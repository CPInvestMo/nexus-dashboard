// NAEL WhatsApp QA-only webhook, isolated from production and messaging APIs.
// No recipient messaging, no personal data persistence, no account tokens in source.
// Cloudflare Worker + SQLite-backed Durable Object; all dedupe keys are SHA256 digests.
const MAX_BYTES = 64 * 1024;
const DAY_MS = 86_400_000;
const noStore = { "cache-control": "no-store", "x-content-type-options": "nosniff" };

const textResponse = (content, status=200) =>
  new Response(content, {status, headers:{...noStore,"content-type":"text/plain; charset=utf-8"}});
const jsonResponse = (obj, status=200) =>
  new Response(JSON.stringify(obj), {status, headers:{...noStore,"content-type":"application/json; charset=utf-8"}});
const safeEq = (a,b) => {
  if (typeof a!=="string" || typeof b!=="string" || a.length!==b.length) return false;
  let mismatch=0;for(let i=0;i<a.length;i++)mismatch |= a.charCodeAt(i)^b.charCodeAt(i);
  return mismatch===0;
};
const hex = buffer => Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,"0")).join("");
const digest = async text => hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)));
// Stream at most 64 KiB. Never buffer an untrusted oversized request in memory.
async function readCapped(request){
  if(!request.body)return new Uint8Array(0);
  const reader=request.body.getReader(),chunks=[];
  let length=0;
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    length+=value.byteLength;
    if(length>MAX_BYTES){await reader.cancel().catch(()=>{});return null;}
    chunks.push(value);
  }
  const output=new Uint8Array(length);
  let offset=0;
  for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.byteLength;}
  return output;
}

async function signatureValid(bytes, header, secret){
  if(typeof header!=="string" || !/^sha256=[a-f0-9]{64}$/i.test(header))return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signed=hex(await crypto.subtle.sign("HMAC",key,bytes));
  return safeEq(signed,header.slice(7).toLowerCase());
}
function eventIds(payload){
  const result=[];
  if(!payload || typeof payload!=="object" || Array.isArray(payload) || payload.object!=="whatsapp_business_account" || !Array.isArray(payload.entry)) return null;
  for(const entry of payload.entry){
    if(!entry || typeof entry!=="object" || Array.isArray(entry)) return null;
    for(const change of Array.isArray(entry.changes)?entry.changes:[]){
      const value=change?.value;
      for(const m of Array.isArray(value?.messages)?value.messages:[]){
        if(typeof m?.id==="string" && m.id.length<250)result.push("message:"+m.id);
      }
      for(const s of Array.isArray(value?.statuses)?value.statuses:[]){
        if(typeof s?.id==="string" && s.id.length<250)
          result.push("status:"+s.id+":"+
            String(s.status||"").slice(0,30)+":"+
            String(s.timestamp||"").slice(0,20));
      }
    }
  }
  return result;
}
export default {
 async fetch(request,env){
   const url=new URL(request.url);
   if(url.pathname==="/health" && request.method==="GET"){
     return jsonResponse({
       service:"NAEL WhatsApp QA",
       mode:env.QA_ONLY==="true"?"QA_ONLY":"DISABLED",
       configured:!!(env.META_VERIFY_TOKEN&&env.META_APP_SECRET&&env.QA_DEDUPE),
       productionConnected:false,
       sendsMessages:false
     });
   }
   if(url.pathname!=="/webhook")return textResponse("Not found",404);
   if(env.QA_ONLY!=="true")return textResponse("QA mode disabled",503);
   if(!env.META_VERIFY_TOKEN||!env.META_APP_SECRET||!env.QA_DEDUPE)
     return textResponse("QA secrets or dedupe binding not configured",503);
   if(request.method==="GET"){
     const mode=url.searchParams.get("hub.mode");
     const token=url.searchParams.get("hub.verify_token");
     const challenge=url.searchParams.get("hub.challenge");
     if(mode!=="subscribe"||!safeEq(token,env.META_VERIFY_TOKEN)||challenge===null||challenge.length>200)
       return textResponse("Verification denied",403);
     return textResponse(challenge,200);
   }
   if(request.method!=="POST")return textResponse("Method not allowed",405);
   const contentType=request.headers.get("content-type")||"";
   if(!contentType.toLowerCase().startsWith("application/json"))
     return textResponse("Unsupported content type",415);
   const len=Number(request.headers.get("content-length")||"0");
   if(len>MAX_BYTES)return textResponse("Payload too large",413);
   const body=await readCapped(request);
   if(body===null)return textResponse("Payload too large",413);
   const verified=await signatureValid(body,request.headers.get("x-hub-signature-256"),env.META_APP_SECRET);
   if(!verified)return textResponse("Invalid signature",401);
   let payload;
   try{payload=JSON.parse(new TextDecoder().decode(body));}
   catch{return textResponse("Invalid JSON",400);}
   const ids=eventIds(payload);
   if(ids===null)return textResponse("Not a WhatsApp event",422);
   // In QA, acknowledgement is not a trigger to send messages or contact customers.
   // Store only hashed event keys; never store raw body, names, phone numbers, message text, or tokens.
   const selected=ids.length?Array.from(new Set(ids)):["empty:"+await digest(new TextDecoder().decode(body))];
   if(selected.length>100)return textResponse("Too many events",413);
   const keyHashes=await Promise.all(selected.map(x=>digest("nael-qa-dedupe-v1:"+x)));
   const stub=env.QA_DEDUPE.get(env.QA_DEDUPE.idFromName("nael-wa-qa-isolated"));
   let unique=0,duplicate=0;
   try{
     // Per-item operations are serialized inside one SQLite-backed Durable Object.
     for(const keyHash of keyHashes){
       const res=await stub.fetch("https://internal/check",{method:"POST",body:JSON.stringify({key:keyHash})});
       if(!res.ok)return textResponse("QA deduplication unavailable",503);
       const data=await res.json();
       if(data.duplicate)duplicate++;else unique++;
     }
   }catch{return textResponse("QA deduplication unavailable",503);}
   console.info(JSON.stringify({kind:"qa_webhook",eventCount:keyHashes.length,unique,duplicate}));
   return jsonResponse({accepted:true,unique,duplicate,productionConnected:false});
 }
};
// Durable Object uses SQLite unique primary key for replay protection, including concurrent requests.
export class NaelQaDeduper {
 constructor(ctx,env){
   this.ctx=ctx;
   ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS seen (key TEXT PRIMARY KEY, at INTEGER NOT NULL)");
 }
 async fetch(req){
   if(req.method!=="POST")return textResponse("Method not allowed",405);
   let data;try{data=await req.json();}catch{return textResponse("Bad request",400);}
   if(typeof data?.key!=="string"||!/^[a-f0-9]{64}$/.test(data.key))return textResponse("Bad key",400);
   const now=Date.now();
   // periodic eviction keeps retention bounded, prevents unbounded persistent metadata.
   this.ctx.storage.sql.exec("DELETE FROM seen WHERE at < ?",now-DAY_MS);
   const cur=this.ctx.storage.sql.exec("INSERT OR IGNORE INTO seen (key,at) VALUES (?,?)",data.key,now);
   return jsonResponse({duplicate:cur.rowsWritten===0});
 }
}
