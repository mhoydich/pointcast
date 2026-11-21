import test from 'node:test';import assert from 'node:assert/strict';import{prepare,createSender,ORIGIN}from './tray.mjs';
const input={slug:'mine',name:'Reader',to:'#loomkit',sentence:'Taking the small proof check.',alt:'A spool with a flag.'};const base=ORIGIN+'/images/loomkit10/';const payload=prepare(input,base);const id='m_test123',address='loom:123456789012345678901234#'+id;
const response=(data,ok=true)=>({ok,status:ok?200:500,json:async()=>data});
test('prepares exact API payload without authority fields',()=>{assert.equal(payload.kind,'image');assert.equal(payload.media.url,base+'mine.svg');assert.deepEqual(payload.from,{name:'Reader',kind:'human'});assert.ok(Object.isFrozen(payload));});
test('rejects invalid input and arbitrary assets',()=>{for(const patch of[{to:'https://evil.test'},{to:'@'},{name:'collator'},{name:'a\nb'},{slug:'../x'},{sentence:'x'.repeat(1801)},{alt:''}])assert.throws(()=>prepare({...input,...patch},base));assert.throws(()=>prepare(input,'https://evil.test/images/loomkit10/'));});
test('explains interior CR/LF sentence breaks',()=>{
 for(const lineBreak of ['\n','\r','\r\n']){
  assert.throws(()=>prepare({...input,sentence:`First line${lineBreak}Second line`},base),{
   message:'Keep your sentence on one line; remove line breaks.'
  });
 }
});
test('keeps outer whitespace trimming for sentence payloads',()=>{
 assert.deepEqual(prepare({...input,sentence:` \r\n${input.sentence}\r\n\t `},base),payload);
 const maximum='x'.repeat(1800);
 assert.equal(prepare({...input,sentence:`\r\n ${maximum} \n`},base).body,maximum);
});
test('preserves empty, length and non-newline control validation',()=>{
 for(const sentence of ['\r\n\t ','x'.repeat(1801),'x'.repeat(1800)+'\nx','First\tsecond','First\u0000second','First\u001fsecond','First\u007fsecond']){
  assert.throws(()=>prepare({...input,sentence},base),{message:'Write a sentence (1–1800 characters).'});
 }
});
test('default draft is inert',async()=>{let n=0;const s=createSender({fetcher:()=>n++,origin:ORIGIN});await assert.rejects(s.send(payload,true));assert.equal(n,0)});
test('wrong origin and missing explicit confirmation cannot send',async()=>{for(const opts of[{origin:'https://preview.test',confirmed:true},{origin:ORIGIN,confirmed:false}]){let n=0;const s=createSender({fetcher:()=>n++,origin:opts.origin,enabled:true});await assert.rejects(s.send(payload,opts.confirmed));assert.equal(n,0)}});
test('one send with retained readback; repeated attempt locked',async()=>{const calls=[];const s=createSender({enabled:true,origin:ORIGIN,fetcher:async(url,opts)=>{calls.push({url,opts});return response(opts.method==='POST'?{ok:true,message:{id},address}:{ops:[{id,...payload}]})}});assert.equal((await s.send(payload,true)).state,'retained');assert.equal(calls.length,2);assert.equal(calls[0].opts.credentials,'omit');await assert.rejects(s.send(payload,true));assert.equal(calls.length,2)});
test('lost receipt yields uncertainty and no retry',async()=>{let n=0;const s=createSender({enabled:true,origin:ORIGIN,fetcher:async()=>{n++;throw Error('offline')}});await assert.rejects(s.send(payload,true),/uncertain/);assert.equal(s.state,'uncertain');await assert.rejects(s.send(payload,true));assert.equal(n,1)});
test('accepted but mismatched readback not success',async()=>{const s=createSender({enabled:true,origin:ORIGIN,fetcher:async(u,o)=>response(o.method==='POST'?{ok:true,message:{id},address}:{ops:[{id,...payload,body:'different'}]})});assert.equal((await s.send(payload,true)).state,'accepted-unverified')});

test('transport revalidates before network',async()=>{let n=0;const s=createSender({enabled:true,origin:ORIGIN,fetcher:()=>n++});await assert.rejects(s.send({...payload,media:{url:'https://evil.test/mine.svg',alt:'x'}},true));assert.equal(n,0);assert.equal(s.state,'idle')});

test('mismatched receipt ID locks uncertain attempt',async()=>{const s=createSender({enabled:true,origin:ORIGIN,fetcher:async()=>response({ok:true,message:{id},address:address+'x'})});await assert.rejects(s.send(payload,true),/uncertain/);assert.equal(s.state,'uncertain')});
