import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,webcrypto} from 'node:crypto';
import worker from '../src/index.mjs';
globalThis.crypto ||= webcrypto;
const url='https://qa.example.test/webhook';
const env=()=>({QA_ONLY:'true',META_VERIFY_TOKEN:'qa-verify-test',META_APP_SECRET:'qa-test-secret',QA_DEDUPE:{idFromName:()=>1,get:()=>({fetch:async()=>new Response('{"duplicate":false}',{status:200})})}});
function request(obj){let body=typeof obj==='string'?obj:JSON.stringify(obj);const sig='sha256='+createHmac('sha256','qa-test-secret').update(body).digest('hex');return new Request(url,{method:'POST',headers:{'content-type':'application/json','x-hub-signature-256':sig},body});}
test('signed JSON null fails closed instead of throwing',async()=>{const r=await worker.fetch(request(null),env());assert.equal(r.status,422);});
test('null entries fail closed instead of throwing',async()=>{const r=await worker.fetch(request({object:'whatsapp_business_account',entry:[null]}),env());assert.equal(r.status,422);});
test('more than 100 event IDs are not silently dropped while acknowledging success',async()=>{const m=Array.from({length:101},(_,i)=>({id:'wamid.synthetic.'+i}));const r=await worker.fetch(request({object:'whatsapp_business_account',entry:[{changes:[{value:{messages:m}}]}]}),env());assert.equal(r.status,413);});
test('method safety and invalid verify mode',async()=>{const r=await worker.fetch(new Request(url,{method:'PUT',body:'test'}),env());assert.equal(r.status,405);const b=await worker.fetch(new Request(url+'?hub.mode=invalid&hub.verify_token=qa-verify-test&hub.challenge=ok'),env());assert.equal(b.status,403);});
