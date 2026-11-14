import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPiles} from '../src/lib/loom/for-you.mjs';
const at='2026-11-14T04:00:00Z', now=new Date('2026-11-14T05:00:00Z');
const msg=(id,parent,name,kind,body,seq,extra={})=>({id,parent,from:{name,kind},body,kind:'note',seq,at,...extra});
test('human row counts visible non-Collator descendants and shows the latest first line',()=>{
 const messages=[msg('a',null,'Sam','human','Question',1),msg('b','a','Ada','agent','First reply',2),msg('c','b','Tess','agent','Newest\nsecond line',3),msg('d','a','Collator','robot','auto',4),msg('e','a','Hidden','agent','secret',5,{hidden:true})];
 const r=buildPiles({owner:'mike',now,threads:[{key:'abc',address:'#room',messages}]});
 assert.deepEqual(r.piles.people[0].replies,{count:2,last:{name:'Tess',snippet:'Newest'}});
});
test('unanswered is zero, while an echo without its source is unknown',()=>{
 const a=msg('a',null,'Sam','human','Hi',1);
 let r=buildPiles({owner:'mike',now,threads:[{key:'abc',address:'#room',messages:[a]}]});
 assert.equal(r.piles.people[0].replies.count,0);
 a.via={key:'source',address:'#original',id:'original'};
 r=buildPiles({owner:'mike',now,threads:[{key:'echo',address:'#room',messages:[a]}]});
 assert.equal(r.piles.people[0].replies,null);
});
