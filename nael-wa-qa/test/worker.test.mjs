import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, webcrypto } from "node:crypto";
import worker from "../src/index.mjs";

globalThis.crypto ||= webcrypto;
const url="https://qa.example.test";
const sign=(body,secret="qa-test-secret")=>"sha256="+createHmac("sha256",secret).update(body).digest("hex");
const payload={object:"whatsapp_business_account",entry:[{changes:[{value:{messages:[{id:"wamid.QA_SYNTHETIC_123",from:"TEST-NOT-STORED",text:{body:"PRIVATE TEST BODY"}}]}}]}]};
function makeEnv(){
 const seen=new Set();
 return {
  QA_ONLY:"true",
  META_VERIFY_TOKEN:"qa-verify-test",
  META_APP_SECRET:"qa-test-secret",
  QA_DEDUPE:{
    idFromName:()=>({test:true}),
    get:()=>({fetch:async (_url,options)=>{
      const {key}=JSON.parse(options.body);
      const duplicate=seen.has(key);
      seen.add(key);
      return new Response(JSON.stringify({duplicate}),{status:200,headers:{"content-type":"application/json"}});
    }})
  }
 };
}
const webhook=(body,signature,headers={})=>new Request(url+"/webhook",{method:"POST",headers:{"content-type":"application/json","x-hub-signature-256":signature,...headers},body});
test("disabled safely by default and health does not expose secrets",async()=>{
 const r=await worker.fetch(new Request(url+"/webhook?hub.mode=subscribe&hub.challenge=x&hub.verify_token=abc"),{QA_ONLY:"false"});
 assert.equal(r.status,503);
 const h=await worker.fetch(new Request(url+"/health"),makeEnv());
 assert.equal(h.status,200);
 const t=await h.text();assert.ok(!t.includes("qa-test-secret"));assert.ok(!t.includes("qa-verify-test"));
});
test("GET handshake success and rejection",async()=>{
 const env=makeEnv();
 const ok=await worker.fetch(new Request(url+"/webhook?hub.mode=subscribe&hub.challenge=challenge123&hub.verify_token=qa-verify-test"),env);
 assert.equal(ok.status,200);assert.equal(await ok.text(),"challenge123");
 const bad=await worker.fetch(new Request(url+"/webhook?hub.mode=subscribe&hub.challenge=challenge123&hub.verify_token=wrong"),env);
 assert.equal(bad.status,403);
});
test("signed synthetic event accepted once, replay marked duplicate",async()=>{
 const env=makeEnv(),body=JSON.stringify(payload),sig=sign(body);
 const a=await worker.fetch(webhook(body,sig),env);assert.equal(a.status,200);
 assert.deepEqual(await a.json(),{accepted:true,unique:1,duplicate:0,productionConnected:false});
 const b=await worker.fetch(webhook(body,sig),env);assert.equal(b.status,200);
 assert.deepEqual(await b.json(),{accepted:true,unique:0,duplicate:1,productionConnected:false});
});
test("tampering, missing and bad signatures rejected before dedupe",async()=>{
 const env=makeEnv(),body=JSON.stringify(payload);
 for(const s of ["", "sha256=abc", sign(body+"tampered")]){
  const r=await worker.fetch(webhook(body,s),env);assert.equal(r.status,401);
 }
});
test("fails closed on missing binding, malformed JSON, invalid object and large body",async()=>{
 const body=JSON.stringify(payload);
 const missing=makeEnv();delete missing.QA_DEDUPE;
 assert.equal((await worker.fetch(webhook(body,sign(body)),missing)).status,503);
 const malformed="{malformed";
 assert.equal((await worker.fetch(webhook(malformed,sign(malformed)),makeEnv())).status,400);
 const invalid='{"object":"page","entry":[]}';
 assert.equal((await worker.fetch(webhook(invalid,sign(invalid)),makeEnv())).status,422);
 const big="x".repeat(65537);
 assert.equal((await worker.fetch(webhook(big,sign(big)),makeEnv())).status,413);
});
test("no webhook routes for outgoing messaging",async()=>{
 const r=await worker.fetch(new Request(url+"/messages",{method:"POST",body:"{}"}),makeEnv());
 assert.equal(r.status,404);
});
