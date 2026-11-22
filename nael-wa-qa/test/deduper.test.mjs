import test from 'node:test';
import assert from 'node:assert/strict';
import {NaelQaDeduper} from '../src/index.mjs';

function fakeSql() {
 const data=new Map();
 return {
  data,
  exec(sql,...args) {
   if(sql.startsWith('CREATE TABLE'))return {rowsWritten:0};
   if(sql.startsWith('DELETE FROM')){let count=0;for(const [id,time] of data){if(time<args[0]){data.delete(id);count++}}return {rowsWritten:count};}
   if(sql.startsWith('INSERT OR IGNORE')){if(data.has(args[0]))return {rowsWritten:0};data.set(args[0],args[1]);return {rowsWritten:1};}
   throw Error('Unexpected SQL '+sql);
  }
 };
}
test('Durable Object deduper uses only SHA256 key and rejects repeat with mock SQLite',async()=>{
 const sql=fakeSql(), deduper=new NaelQaDeduper({storage:{sql}},{});
 const key='f'.repeat(64);
 const request=()=>new Request('https://internal/check',{method:'POST',body:JSON.stringify({key})});
 const first=await deduper.fetch(request());
 assert.equal(first.status,200);assert.deepEqual(await first.json(),{duplicate:false});
 const repeat=await deduper.fetch(request());
 assert.equal(repeat.status,200);assert.deepEqual(await repeat.json(),{duplicate:true});
 assert.deepEqual([...sql.data.keys()],[key]);
 assert.equal((await deduper.fetch(new Request('https://internal/check',{method:'POST',body:'{"key":"phone number"}'}))).status,400);
});
