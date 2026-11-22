// NAEL Cloudflare Worker — safe operational foundation.
// Only database-backed operations are implemented; integrations and external sends fail closed.
export interface Env { DB: D1Database; NAEL_ADMIN_TOKEN: string; NAEL_ADMIN_USER_ID?: string }
type Json = Record<string, unknown>;
class ApiError extends Error { constructor(public status:number,public code:string,message:string){super(message)} }
const utc=()=>new Date().toISOString();
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const fail=(e:unknown)=>{const x=e instanceof ApiError?e:new ApiError(500,"INTERNAL_ERROR","Unexpected server error");return reply({error:{code:x.code,message:x.message},at:utc()},x.status)};
function sameConstantTime(a:string,b:string){const enc=new TextEncoder();const x=enc.encode(a),y=enc.encode(b);let diff=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)diff|=(x[i]||0)^(y[i]||0);return diff===0}
function authenticate(req:Request,env:Env){if(!env.NAEL_ADMIN_TOKEN||env.NAEL_ADMIN_TOKEN.length<32)throw new ApiError(503,"AUTH_NOT_CONFIGURED","Server authentication is not configured");const raw=req.headers.get("authorization")||"";if(!raw.startsWith("Bearer ")||!sameConstantTime(raw.slice(7),env.NAEL_ADMIN_TOKEN))throw new ApiError(401,"UNAUTHENTICATED","Valid server-issued owner token required");return env.NAEL_ADMIN_USER_ID||"owner"}
async function parse(req:Request){if(!req.headers.get("content-type")?.includes("application/json"))throw new ApiError(415,"CONTENT_TYPE","application/json required");let x:unknown;try{x=await req.json()}catch{throw new ApiError(400,"VALIDATION_ERROR","Invalid JSON")}if(!x||typeof x!=="object"||Array.isArray(x))throw new ApiError(400,"VALIDATION_ERROR","Object required");return x as Json}
function field(body:Json,key:string,max=256){const val=body[key];if(typeof val!=="string"||!val.trim()||val.length>max)throw new ApiError(400,"VALIDATION_ERROR","Invalid "+key);return val.trim()}
function checkKey(x:string){if(!/^[a-zA-Z0-9:_-]{12,128}$/.test(x))throw new ApiError(400,"VALIDATION_ERROR","Invalid idempotencyKey");return x}
async function audit(env:Env,actor:string,action:string,entityType:string,entityId:string,outcome:string,executionId?:string,details:Json={}){await env.DB.prepare("INSERT INTO audit_logs(id,actor,action_name,entity_type,entity_id,execution_id,outcome,details_json) VALUES(?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),actor,action,entityType,entityId,executionId||null,outcome,JSON.stringify(details)).run()}
async function runNow(body:Json,env:Env,actor:string){
 const type=field(body,"targetType"),id=field(body,"targetId"),key=checkKey(field(body,"idempotencyKey"));
 if(type!=="task"&&type!=="agent")throw new ApiError(400,"VALIDATION_ERROR","task or agent only");
 if(type==="agent")throw new ApiError(422,"UNSUPPORTED_ADAPTER","Agent dispatcher is not yet connected");
 const task=await env.DB.prepare("SELECT id,task_state FROM tasks WHERE id=?").bind(id).first<{id:string,task_state:string}>();
 if(!task)throw new ApiError(404,"NOT_FOUND","Task does not exist");
 // Only the explicit safe DB self-check is implemented. Never mark real-world tasks completed.
 if(id!=="nael-db-self-check")throw new ApiError(422,"UNSUPPORTED_ADAPTER","No real executor registered for this task");
 if(task.task_state==="CANCELLED")throw new ApiError(409,"CONFLICT","Cancelled task");
 const previous=await env.DB.prepare("SELECT execution_id,execution_state,output_json FROM execution_runs WHERE target_type='TASK' AND target_id=? AND idempotency_key=?").bind(id,key).first<{execution_id:string,execution_state:string,output_json:string|null}>();
 if(previous)return reply({executionId:previous.execution_id,state:previous.execution_state,output:previous.output_json?JSON.parse(previous.output_json):null,replayed:true,auditedAt:utc()});
 const eid=crypto.randomUUID(),time=utc();
 const start=await env.DB.batch([
  env.DB.prepare("INSERT INTO execution_runs(execution_id,target_type,target_id,idempotency_key,execution_state,requested_by,started_at) VALUES(?,'TASK',?,?,'RUNNING',?,?)").bind(eid,id,key,null,time),
  env.DB.prepare("INSERT INTO audit_logs(id,actor,action_name,entity_type,entity_id,execution_id,outcome) VALUES(?,?, 'RUN_NOW','TASK',?,?,'QUEUED')").bind(crypto.randomUUID(),actor,id,eid)
 ]);
 if(!start.every(x=>x.success))throw new ApiError(503,"DB_WRITE_FAILED","Execution could not be persisted");
 try{
  const projects=await env.DB.prepare("SELECT COUNT(*) AS count FROM projects").first<{count:number}>();
  const checks=await env.DB.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE execution_id=?").bind(eid).first<{count:number}>();
  const output={database:"reachable",projects:projects?.count??0,auditRowsForExecution:checks?.count??0,checkedAt:utc()};
  await env.DB.batch([
   env.DB.prepare("UPDATE execution_runs SET execution_state='SUCCEEDED',finished_at=?,output_json=? WHERE execution_id=? AND execution_state='RUNNING'").bind(utc(),JSON.stringify(output),eid),
   env.DB.prepare("INSERT INTO audit_logs(id,actor,action_name,entity_type,entity_id,execution_id,outcome,details_json) VALUES(?,?,'DB_SELF_CHECK','TASK',? ,?,'SUCCEEDED',?)").bind(crypto.randomUUID(),actor,id,eid,JSON.stringify(output))
  ]);
  return reply({executionId:eid,state:"SUCCEEDED",output,auditedAt:utc()},200);
 }catch(err){
  await env.DB.batch([
   env.DB.prepare("UPDATE execution_runs SET execution_state='FAILED',finished_at=?,error_json=? WHERE execution_id=?").bind(utc(),JSON.stringify({code:"DB_CHECK_FAILED"}),eid),
   env.DB.prepare("INSERT INTO audit_logs(id,actor,action_name,entity_type,entity_id,execution_id,outcome) VALUES(?,?,'DB_SELF_CHECK','TASK',? ,?,'FAILED')").bind(crypto.randomUUID(),actor,id,eid)
  ]);
  throw new ApiError(503,"DB_CHECK_FAILED","Database verification failed");
 }
}
async function decide(path:string,body:Json,env:Env,actor:string){
 const id=decodeURIComponent(path.split("/")[3]||"");
 if(!id||id.length>256)throw new ApiError(400,"VALIDATION_ERROR","Invalid approval ID");
 const decision=field(body,"decision");
 if(!["APPROVE","REJECT"].includes(decision))throw new ApiError(400,"VALIDATION_ERROR","APPROVE or REJECT required");
 const row=await env.DB.prepare("SELECT id,action_type,status FROM approvals WHERE id=?").bind(id).first<{id:string,action_type:string,status:string}>();
 if(!row)throw new ApiError(404,"NOT_FOUND","Approval not found");
 if(row.status!=="PENDING")throw new ApiError(409,"CONFLICT","Approval already decided");
 // Until real external adapters are deployed, approving would falsely imply dispatch.
 if(decision==="APPROVE")throw new ApiError(422,"UNSUPPORTED_ADAPTER","No approved external action dispatcher is installed. Approval not changed.");
 const result=await env.DB.batch([
   env.DB.prepare("UPDATE approvals SET status='REJECTED',decided_by=?,decided_at=? WHERE id=? AND status='PENDING'").bind(null,utc(),id),
   env.DB.prepare("INSERT INTO audit_logs(id,actor,action_name,entity_type,entity_id,outcome) VALUES(?,?,'REJECT','APPROVAL',?,'SUCCEEDED')").bind(crypto.randomUUID(),actor,id)
 ]);
 if(!result.every(x=>x.success)||result[0].meta.changes!==1)throw new ApiError(409,"CONFLICT","Approval decision conflict");
 return reply({approvalId:id,status:"REJECTED",auditedAt:utc()});
}
async function syncAll(body:Json,env:Env,actor:string){
 const key=checkKey(field(body,"idempotencyKey"));
 const prev=await env.DB.prepare("SELECT execution_id,execution_state,output_json FROM execution_runs WHERE target_type='SYNC' AND target_id='all' AND idempotency_key=?").bind(key).first<{execution_id:string,execution_state:string,output_json:string|null}>();
 if(prev)return reply({executionId:prev.execution_id,state:prev.execution_state,output:prev.output_json?JSON.parse(prev.output_json):null,replayed:true});
 const connected=await env.DB.prepare("SELECT service_name,is_connected,is_authorized,is_reachable,is_tested,is_operational,last_sync_at,last_error FROM integration_connections").all();
 // This tests the DB read only. It MUST NOT silently claim external adapters were synced.
 const output={succeeded:[{service:"NAEL_D1",operation:"read",checkedAt:utc()}],failed:(connected.results||[]).map((s:any)=>({service:s.service_name,reason:"EXTERNAL_ADAPTER_NOT_CONFIGURED",connectionFlags:{connected:!!s.is_connected,authorized:!!s.is_authorized,reachable:!!s.is_reachable,tested:!!s.is_tested,operational:!!s.is_operational}})),syncedAt:utc()};
 const eid=crypto.randomUUID();
 const result=await env.DB.batch([
  env.DB.prepare("INSERT INTO execution_runs(execution_id,target_type,target_id,idempotency_key,execution_state,requested_by,started_at,finished_at,output_json) VALUES(?,'SYNC','all',?,'SUCCEEDED',?,?,?,?)").bind(eid,key,null,utc(),utc(),JSON.stringify(output)),
  env.DB.prepare("INSERT INTO audit_logs(id,actor,action_name,entity_type,entity_id,execution_id,outcome,details_json) VALUES(?,?,'SYNC_CHECK','INTEGRATION','all',?,'SUCCEEDED',?)").bind(crypto.randomUUID(),actor,eid,JSON.stringify({externalAdaptersTested:0}))
 ]);
 if(!result.every(x=>x.success))throw new ApiError(503,"DB_WRITE_FAILED","Sync audit persistence failed");
 return reply({executionId:eid,state:"SUCCEEDED",output,note:"Database read check only; external sources were not synchronized",auditedAt:utc()});
}
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  try{
   const url=new URL(request.url),path=url.pathname;
   if(path==="/api/health"&&request.method==="GET"){
    try{await env.DB.prepare("SELECT 1 AS ok").first();return reply({status:"ok",database:"reachable",checkedAt:utc()})}
    catch{return reply({status:"unavailable",database:"unreachable",checkedAt:utc()},503)}
   }
   const actor=authenticate(request,env);
   if(path==="/api/status"&&request.method==="GET"){
    const rows=await env.DB.prepare("SELECT service_name,is_connected,is_authorized,is_reachable,is_tested,is_operational,last_sync_at,last_error FROM integration_connections").all();
    return reply({app:"NAEL",database:"connected",integrations:rows.results,at:utc()});
   }
   if(path.startsWith("/api/executions/")&&request.method==="GET"){
    const id=path.slice("/api/executions/".length);
    const row=await env.DB.prepare("SELECT execution_id,target_type,target_id,execution_state,started_at,finished_at,output_json,error_json,evidence_ref FROM execution_runs WHERE execution_id=?").bind(id).first();
    if(!row)throw new ApiError(404,"NOT_FOUND","Execution not found");
    return reply({execution:row});
   }
   if(path==="/api/actions/run-now"&&request.method==="POST")return await runNow(await parse(request),env,actor);
   if(/^\/api\/approvals\/[^/]+\/decide$/.test(path)&&request.method==="POST")return await decide(path,await parse(request),env,actor);
   if(path==="/api/integrations/sync-all"&&request.method==="POST")return await syncAll(await parse(request),env,actor);
   if(path==="/api/deployments/deploy-and-test"&&request.method==="POST"){
    await parse(request);
    throw new ApiError(422,"UNSUPPORTED_ADAPTER","Deployment provider is not connected; no deployment triggered");
   }
   throw new ApiError(404,"NOT_FOUND","Route not implemented");
  }catch(err){return fail(err)}
 }
} satisfies ExportedHandler<Env>;
