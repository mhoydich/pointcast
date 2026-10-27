import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../public/offered-light-lab/controller.js', import.meta.url), 'utf8');
function fixture() {
  class Element extends EventTarget {
    constructor() { super(); this.dataset = {}; this.attributes = {}; this.value = ''; this.textContent = ''; this.hidden = false; this.disabled = false; this.children = []; this.classList = { add() {}, remove() {} }; }
    setAttribute(k,v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] || null; }
    removeAttribute(k) { delete this.attributes[k]; }
    set src(v) { this.attributes.src = v; } get src() { return this.attributes.src; }
    focus() { this.focused = true; } select() { this.selected = true; } click() { this.clicked = true; } scrollIntoView() {} decode() { return Promise.resolve(); }
    appendChild(child) { this.children.push(child); } remove() {} querySelector() { return null; }
    emit(type) { this.dispatchEvent(new Event(type)); }
  }
  const ids = 'offered-light to-name message from-name dedication gift-message signature scene-art scene-art-next art-status candle-toggle candle-note water sound-toggle ring-bell sound-status motion-toggle preview-gift edit-gift editor receiver-note preview-heading exact-share-text share-text copy-text prepare-image share-image download-image share-status manual-copy copy-field'.split(' ');
  const nodes = Object.fromEntries(ids.map(id => [id,new Element()]));
  const radios = ['dawn','garden','dusk'].map(value => Object.assign(new Element(), { value }));
  const imageLoads = [], blobs = [], shares = [], copied = [], canvases = [], drawn = [], effects = { stops:0, enabled:0, rings:0 };
  class MockImage { constructor() { this.naturalWidth=1600; this.naturalHeight=2400; } set src(v) { this.source=v; imageLoads.push(this); } decode() { return Promise.resolve(); } }
  const document = Object.assign(new EventTarget(), {
    hidden:false, body:new Element(), getElementById:id => nodes[id], querySelectorAll:() => radios,
    createElement(tag) { if (tag !== 'canvas') return new Element(); const canvas={ getContext:() => ({ measureText:v=>({width:v.length*20}), fillRect(){}, drawImage(){}, fillText(value,x,y){drawn.push({value,x,y});} }), toBlob:cb=>blobs.push(cb) };canvases.push(canvas);return canvas; }
  });
  const window = Object.assign(new EventTarget(), { matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}), PointCastEffects:{
    createAudio:({onState})=>({ enable(){effects.enabled++;onState({status:'ready'});return Promise.resolve(true);}, stop(){effects.stops++;onState({status:'idle'});}, dispose(){}, ring(){effects.rings++;return true;} }),
    createRipple:()=>({clear(){},dispose(){}})
  }});
  const navigator = { canShare:()=>true, share:payload=>{shares.push(payload);return Promise.resolve();}, clipboard:{writeText:value=>{copied.push(value);return Promise.resolve();}} };
  const context = vm.createContext({window,document,navigator,Image:MockImage,File:class {constructor(parts,name,options){Object.assign(this,{parts,name,...options});}},setTimeout,clearTimeout,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Promise,Event});
  vm.runInContext(source,context);
  const artworks = radios.map(({value})=>({id:value,theme:value,title:value,alt:value,src:'data:'+value}));
  const api = window.initOfferedLight(artworks);
  const tick = async () => { for(let i=0;i<12;i++) await Promise.resolve(); };
  const load = async (index=0) => { imageLoads[index].onload(); await tick(); };
  return {api,nodes,radios,imageLoads,blobs,shares,copied,canvases,drawn,effects,window,document,tick,load,navigator};
}
test('personal text stays literal and exact preview/copy share the same snapshot', async () => {
  const f=fixture(); await f.load();
  f.nodes['to-name'].value='<img src=x onerror=alert(1)>'; f.nodes['to-name'].emit('input');
  f.nodes.message.value='A quiet thought\nfor today.'; f.nodes.message.emit('input');
  f.nodes['from-name'].value='Someone'; f.nodes['from-name'].emit('input');
  assert.equal(f.nodes.dedication.textContent,'For <img src=x onerror=alert(1)>');
  f.nodes['copy-text'].emit('click'); await f.tick();
  assert.equal(f.copied[0],f.nodes['exact-share-text'].textContent);
  f.nodes['share-text'].emit('click'); await f.tick();
  assert.equal(f.shares[0].text,f.copied[0]);
  f.api.destroy();
});
test('recipient preview starts unlit and silent, retaining creator words', async () => {
  const f=fixture(); await f.load();
  f.nodes.message.value='Still here';f.nodes.message.emit('input');
  f.nodes['candle-toggle'].emit('click');f.nodes['sound-toggle'].emit('click');await f.tick();
  assert.equal(f.api.getState().lit,true); assert.equal(f.api.getState().soundEnabled,true);
  f.nodes['preview-gift'].emit('click');
  assert.equal(f.api.getState().mode,'receive');assert.equal(f.api.getState().lit,false);assert.equal(f.api.getState().soundEnabled,false);
  assert.equal(f.nodes.editor.hidden,true);assert.equal(f.nodes['receiver-note'].hidden,false);assert.equal(f.nodes['preview-heading'].focused,true);
  f.nodes['edit-gift'].emit('click');assert.equal(f.nodes.message.value,'Still here');assert.equal(f.nodes['to-name'].focused,true);
  f.api.destroy();
});
test('an edit invalidates an in-flight PNG; only the newest preparation becomes shareable', async () => {
  const f=fixture();await f.load();
  f.nodes['prepare-image'].emit('click');await f.tick();assert.equal(f.blobs.length,1);
  f.nodes.message.value='New words';f.nodes.message.emit('input');
  f.blobs[0]({type:'image/png'});await f.tick();
  assert.equal(f.api.getState().prepared,false);assert.equal(f.nodes['share-image'].disabled,true);
  f.nodes['prepare-image'].emit('click');await f.tick();f.blobs[1]({type:'image/png'});await f.tick();
  assert.equal(f.api.getState().prepared,true);assert.equal(f.nodes['share-image'].disabled,false);
  f.api.destroy();
});
test('file sharing is a distinct user action and cancellation preserves prepared image and draft', async () => {
  const f=fixture();await f.load();
  f.nodes['prepare-image'].emit('click');await f.tick();f.blobs[0]({type:'image/png'});await f.tick();
  assert.equal(f.shares.length,0);
  f.navigator.share=()=>Promise.reject(Object.assign(new Error('cancel'),{name:'AbortError'}));
  f.nodes['share-image'].emit('click');await f.tick();
  assert.equal(f.api.getState().prepared,true);assert.match(f.nodes['share-status'].textContent,/cancelled/);
  f.nodes['from-name'].value='Changed';f.nodes['from-name'].emit('input');assert.equal(f.api.getState().prepared,false);
  f.api.destroy();
});
test('slow artwork selection cannot replace the newer decoded choice', async () => {
  const f=fixture();
  f.radios[1].checked=true;f.radios[1].emit('change');
  await f.load(1);assert.equal(f.nodes['scene-art'].src,'data:garden');
  await f.load(0);assert.equal(f.nodes['scene-art'].src,'data:garden');
  assert.equal(f.nodes['art-status'].textContent,'garden is ready.');
  f.api.destroy();
});
test('failed artwork reports recovery without removing words; background stops consent', async () => {
  const f=fixture();f.nodes.message.value='Stay';f.nodes.message.emit('input');
  f.imageLoads[0].onerror();await f.tick();assert.match(f.nodes['art-status'].textContent,/could not open/);assert.equal(f.nodes.message.value,'Stay');
  f.nodes['sound-toggle'].emit('click');await f.tick();assert.equal(f.api.getState().soundEnabled,true);
  f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(f.api.getState().soundEnabled,false);
  f.document.hidden=false;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(f.api.getState().soundEnabled,false);assert.equal(f.effects.enabled,1);
  f.api.destroy();
});

test('unsupported share and clipboard expose a local, selectable copy fallback', async () => {
  const f=fixture();await f.load();
  f.navigator.share=undefined;f.navigator.clipboard=undefined;
  f.nodes['share-text'].emit('click');await f.tick();
  assert.equal(f.nodes['manual-copy'].hidden,false);
  assert.equal(f.nodes['copy-field'].value,f.nodes['exact-share-text'].textContent);
  assert.equal(f.nodes['copy-field'].selected,true);
  f.nodes['prepare-image'].emit('click');await f.tick();f.blobs[0]({type:'image/png'});await f.tick();
  assert.equal(f.nodes['share-image'].disabled,true);
  f.nodes['download-image'].emit('click');await f.tick();
  const link=f.document.body.children.at(-1);
  assert.equal(link.download,'offered-light.png');assert.equal(link.clicked,true);
  assert.equal(f.api.getState().prepared,true);
  f.api.destroy();
});

test('actual HTML, core effects and controller integrate through create / receive / PNG share', async t => {
  let JSDOM;
  try {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    ({ JSDOM } = require(require.resolve('jsdom', { paths: [new URL('.', import.meta.url).pathname] })));
  } catch (_) { t.skip('jsdom is not installed in this environment'); return; }
  const html = fs.readFileSync(new URL('../public/offered-light-lab/index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, url:'https://local.invalid/' });
  const w=dom.window, d=w.document, shared=[], drawn=[];
  let audioContexts=0;
  w.matchMedia=()=>({ matches:false, addEventListener(){}, removeEventListener(){} });
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
  w.Image=class { constructor(){this.naturalWidth=1024;this.naturalHeight=1536;} set src(v){this.source=v;w.queueMicrotask(()=>this.onload());} decode(){return Promise.resolve();} };
  const param=()=>({value:0,setValueAtTime(){},cancelScheduledValues(){},cancelAndHoldAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  const node=()=>({gain:param(),connect(){},disconnect(){}});
  w.AudioContext=class extends w.EventTarget {
    constructor(){super();audioContexts++;this.state='running';this.currentTime=0;this.destination={};}
    createGain(){return node();}
    createDynamicsCompressor(){return {...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};}
    createOscillator(){return Object.assign(new w.EventTarget(),{...node(),frequency:param(),start(){},stop(){}});}
    resume(){return Promise.resolve();} close(){this.state='closed';return Promise.resolve();}
  };
  w.HTMLCanvasElement.prototype.getContext=()=>({measureText:v=>({width:v.length*20}),fillRect(){},drawImage(){},fillText(value){drawn.push(value);}});
  w.HTMLCanvasElement.prototype.toBlob=function(cb){w.queueMicrotask(()=>cb(new w.Blob(['mock PNG'],{type:'image/png'})));};
  Object.defineProperty(w.navigator,'canShare',{value:()=>true,configurable:true});
  Object.defineProperty(w.navigator,'share',{value:payload=>{shared.push(payload);return Promise.resolve();},configurable:true});
  w.eval(fs.readFileSync(new URL('../public/pointcast-effects/v0.1.0/pointcast-effects.js',import.meta.url),'utf8'));
  w.eval(source);
  w.eval(fs.readFileSync(new URL('../public/offered-light-lab/artworks.js',import.meta.url),'utf8'));
  const api=w.initOfferedLight(w.OfferedLightArtworks);
  const tick=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
  const edit=(id,value)=>{const field=d.getElementById(id);field.value=value;field.dispatchEvent(new w.Event('input',{bubbles:true}));};
  try {
    await tick();
    assert.equal(audioContexts,0,'arrival never creates an audio graph');
    edit('to-name','Mina <3');edit('message','Thinking of you,\ntoday and tomorrow.');edit('from-name','Alex');
    assert.equal(d.getElementById('dedication').textContent,'For Mina <3');
    d.getElementById('candle-toggle').click();assert.equal(d.getElementById('offered-light').dataset.lit,'true');
    d.getElementById('sound-toggle').click();await tick();assert.equal(audioContexts,1);assert.equal(d.getElementById('ring-bell').disabled,false);
    d.getElementById('preview-gift').click();
    assert.equal(d.getElementById('editor').hidden,true);assert.equal(d.getElementById('receiver-note').hidden,false);
    assert.equal(d.activeElement.id,'preview-heading');assert.equal(api.getState().lit,false);assert.equal(api.getState().soundEnabled,false);
    d.getElementById('edit-gift').click();assert.equal(d.activeElement.id,'to-name');assert.equal(d.getElementById('message').value,'Thinking of you,\ntoday and tomorrow.');
    d.querySelector('input[value=garden]').click();await tick();
    assert.equal(d.getElementById('offered-light').dataset.theme,'garden');assert.equal(d.getElementById('scene-art-next').classList.contains('is-visible'),true);
    d.getElementById('share-panel').open=true;
    d.getElementById('prepare-image').click();await tick();
    assert.equal(api.getState().prepared,true);assert.equal(shared.length,0);assert.equal(d.getElementById('share-image').disabled,false);
    assert.ok(drawn.includes('For Mina <3'));assert.ok(drawn.includes('Thinking of you,'));assert.ok(drawn.includes('today and tomorrow.'));
    d.getElementById('share-image').click();await tick();
    assert.equal(shared.length,1);assert.equal(shared[0].files[0].name,'offered-light.png');
    edit('message','A revised thought');assert.equal(d.getElementById('share-image').disabled,true);
    d.getElementById('share-text').click();await tick();assert.equal(shared[1].text,d.getElementById('exact-share-text').textContent);
    const water=d.getElementById('water');
    water.getBoundingClientRect=()=>({left:100,top:200,width:300,height:90});
    const pointer=new w.MouseEvent('pointerdown',{clientX:325,clientY:245,button:0});water.dispatchEvent(pointer);
    const ripple=water.querySelector('.pointcast-ripple');assert.equal(ripple.style.left,'225px');assert.equal(ripple.style.top,'45px');
    d.getElementById('motion-toggle').click();assert.equal(water.querySelectorAll('.pointcast-ripple').length,0);
  } finally { api.destroy();dom.window.close(); }
});

test('a maximum-length message with many line breaks exports every line within 8192px', async () => {
  const f=fixture();await f.load();
  f.nodes.message.value=Array(250).fill('x').join('\n');f.nodes.message.emit('input');
  f.nodes['prepare-image'].emit('click');await f.tick();
  assert.equal(f.drawn.filter(line=>line.value==='x').length,250);
  assert.ok(f.canvases[0].height<=8192);
  assert.ok(f.drawn.every(line=>line.y<f.canvases[0].height));
  f.blobs[0]({type:'image/png'});await f.tick();assert.equal(f.api.getState().prepared,true);
  f.api.destroy();
});
