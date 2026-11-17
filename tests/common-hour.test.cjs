const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../public/common-hour/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function setup(){
 const nodes=new Map();const saved=[];let clipboard='';
 function node(id){if(!nodes.has(id)){const x={id,value:'',textContent:'',hidden:false,disabled:false,handlers:{},addEventListener(n,fn){this.handlers[n]=fn;}};Object.defineProperty(x,'innerHTML',{set(){throw new Error('Unsafe HTML sink used');}});nodes.set(id,x);}return nodes.get(id);}
 node('project').value='C01';node('minutes').value='90';node('people').value='3';
 class FormData {constructor(){this.values=['project','minutes','people','captain','brief','output','permission','care','access'].map(k=>[k,node(k).value]);}*[Symbol.iterator](){yield* this.values;}}
 const document={getElementById:node,createElement(tag){assert.equal(tag,'a');return {click(){saved.push({name:this.download,url:this.href});}};}};
 const blobs=[];
 const context=vm.createContext({document,FormData,Intl,Blob,navigator:{clipboard:{writeText:async text=>{clipboard=text;}}},URL:{createObjectURL(blob){blobs.push(blob);return 'blob:qa';},revokeObjectURL(){}},setTimeout:fn=>fn()});
 vm.runInContext(script,context,{filename:'common-hour-inline.js'});
 const emit=(id,event)=>node(id).handlers[event]({preventDefault(){}});
 const prepared=()=>vm.runInContext('prepared',context);
 return {node,emit,prepared,context,saved,blobs,clipboard:()=>clipboard};
}
test('three draft projects produce distinct, bounded Loom drafts with no service claims',()=>{
 for(const id of ['C01','C02','C03']){const f=setup();f.node('project').value=id;f.emit('project','change');f.emit('composer','submit');const c=f.prepared();assert.equal(c.job_id,id);assert.equal(c.state,'draft');assert.equal(c.event_confirmed,false);assert.equal(c.captain_confirmed,false);assert.equal(c.human_minutes_pledged,0);assert.equal(c.human_minutes_completed,0);assert.equal(c.ai_tokens,null);assert.ok(c.loom_draft.length<=2000);assert.match(c.loom_draft,/No event date is set/);assert.equal(f.node('preview').textContent,c.loom_draft);}
});
test('planned participant time uses headcount and duration without becoming service',()=>{
 const f=setup();f.node('people').value='20';f.node('minutes').value='30';f.emit('composer','input');assert.equal(f.node('planned-hours').textContent,'10 hours');f.emit('composer','submit');assert.equal(f.prepared().planned_human_minutes,600);assert.equal(f.prepared().human_minutes_completed,0);
});
test('edits hide stale draft and disable both exports until re-prepared',()=>{
 const f=setup();f.emit('composer','submit');assert.ok(f.prepared());f.node('brief').value='New brief for current review';f.emit('composer','input');assert.equal(f.prepared(),null);assert.equal(f.node('preview').hidden,true);assert.equal(f.node('download').disabled,true);assert.equal(f.node('copy').disabled,true);f.emit('download','click');assert.equal(f.saved.length,0);f.emit('composer','submit');assert.equal(f.prepared().brief,'New brief for current review');assert.equal(f.node('download').disabled,false);
});
test('bad headcounts and unsupported duration cannot generate a draft',()=>{
 for(const v of ['0','21','2.5','NaN','']){const f=setup();f.node('people').value=v;f.emit('composer','submit');assert.equal(f.prepared(),null,v);assert.equal(f.node('error').hidden,false);assert.match(f.node('error').textContent,/whole number/);}
 const f=setup();f.node('minutes').value='120';f.emit('composer','submit');assert.equal(f.prepared(),null);assert.match(f.node('error').textContent,/30, 60 or 90/);
});
test('blank requirements and overlength fields fail closed',()=>{
 for(const key of ['brief','output','permission','care','access']){const f=setup();f.node(key).value='   ';f.emit('composer','submit');assert.equal(f.prepared(),null,key);assert.equal(f.node('download').disabled,true);}
 const f=setup();f.node('brief').value='x'.repeat(281);f.emit('composer','submit');assert.equal(f.prepared(),null);assert.match(f.node('error').textContent,/too long/);
});
test('markup in user fields remains literal text and JSON data',async()=>{
 const f=setup();const hostile='<img src=x onerror="alert(1)"> & <script>alert(2)</script>';
 f.node('captain').value=hostile;f.emit('composer','submit');assert.equal(f.prepared().captain_proposed,hostile);assert.ok(f.node('preview').textContent.includes(hostile));f.emit('download','click');const exported=JSON.parse(await f.blobs[0].text());assert.equal(exported.captain_proposed,hostile);
});
test('copy and downloaded JSON reflect the prepared review copy exactly',async()=>{
 const f=setup();f.node('brief').value='A checked custom brief';f.node('people').value='4';f.node('minutes').value='60';f.emit('composer','submit');await f.emit('copy','click');assert.equal(f.clipboard(),f.node('preview').textContent);f.emit('download','click');assert.equal(f.saved[0].name,'common-hour-c01-draft.json');const data=JSON.parse(await f.blobs[0].text());assert.equal(data.loom_draft,f.clipboard());assert.equal(data.brief,'A checked custom brief');assert.equal(data.planned_human_minutes,240);
});
test('maximum field lengths either fit Loom or explicitly refuse without truncation',()=>{
 const f=setup();for(const [key,len]of Object.entries({captain:60,brief:280,output:320,permission:220,care:220,access:180}))f.node(key).value='x'.repeat(len);f.emit('composer','submit');const c=f.prepared();if(c){assert.ok(c.loom_draft.length<=2000);assert.equal(c.brief.length,280);assert.equal(c.acceptance_criteria.length,320);}else{assert.match(f.node('error').textContent,/2,000-character limit/);assert.equal(f.node('download').disabled,true);}
});
