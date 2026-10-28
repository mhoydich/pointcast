import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../public/offered-light-lab/controller.js', import.meta.url), 'utf8');
function fixture({ artworkData, radioValues = ['dawn','garden','dusk'], imageSize = [1600,2400] } = {}) {
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
  const ids = 'offered-light to-name message from-name dedication gift-message signature scene-art scene-art-next art-status current-art-title candle-toggle candle-note water sound-toggle ring-bell sound-status motion-toggle preview-gift edit-gift editor receiver-note preview-heading exact-share-text share-text copy-text prepare-image share-image download-image share-status manual-copy copy-field'.split(' ');
  const nodes = Object.fromEntries(ids.map(id => [id,new Element()]));
  const radios = radioValues.map(value => Object.assign(new Element(), { value }));
  const imageLoads = [], blobs = [], shares = [], copied = [], canvases = [], drawn = [], imageDraws = [], effects = { stops:0, enabled:0, rings:0 };
  class MockImage { constructor() { [this.naturalWidth,this.naturalHeight]=imageSize; } set src(v) { this.source=v; imageLoads.push(this); } decode() { return Promise.resolve(); } }
  const document = Object.assign(new EventTarget(), {
    hidden:false, body:new Element(), getElementById:id => nodes[id], querySelectorAll:() => radios,
    createElement(tag) { if (tag !== 'canvas') return new Element(); const canvas={ getContext:() => ({ measureText:v=>({width:v.length*20}), fillRect(){}, drawImage(...args){imageDraws.push(args);}, fillText(value,x,y){drawn.push({value,x,y});} }), toBlob:cb=>blobs.push(cb) };canvases.push(canvas);return canvas; }
  });
  const window = Object.assign(new EventTarget(), { matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}), PointCastEffects:{
    createAudio:({onState})=>({ enable(){effects.enabled++;onState({status:'ready'});return Promise.resolve(true);}, stop(){effects.stops++;onState({status:'idle'});}, dispose(){}, ring(){effects.rings++;return true;} }),
    createRipple:()=>({clear(){},dispose(){}})
  }});
  const navigator = { canShare:()=>true, share:payload=>{shares.push(payload);return Promise.resolve();}, clipboard:{writeText:value=>{copied.push(value);return Promise.resolve();}} };
  const context = vm.createContext({window,document,navigator,Image:MockImage,File:class {constructor(parts,name,options){Object.assign(this,{parts,name,...options});}},setTimeout,clearTimeout,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Promise,Event});
  vm.runInContext(source,context);
  const artworks = artworkData || radios.map(({value})=>({id:value,theme:value,title:value,alt:value,src:'data:'+value}));
  const api = window.initOfferedLight(artworks);
  const tick = async () => { for(let i=0;i<12;i++) await Promise.resolve(); };
  const load = async (index=0) => { imageLoads[index].onload(); await tick(); };
  return {api,nodes,radios,imageLoads,blobs,shares,copied,canvases,drawn,imageDraws,effects,window,document,tick,load,navigator};
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
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
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
    const compose=d.getElementById('compose-dialog');
    assert.ok(compose,'actual mobile source contains the compose dialog');
    assert.equal(d.querySelectorAll('input[name="atmosphere"]').length,6);
    d.getElementById('begin-gift').click();
    assert.equal(compose.open,true);assert.equal(d.activeElement.id,'compose-heading');
    edit('to-name','Mina <3');edit('message','Thinking of you,\ntoday and tomorrow.');edit('from-name','Alex');
    assert.equal(d.getElementById('dedication').textContent,'For Mina <3');
    d.getElementById('close-compose').click();assert.equal(compose.open,false);
    d.getElementById('candle-toggle').click();assert.equal(d.getElementById('offered-light').dataset.lit,'true');
    d.getElementById('open-settings').click();
    d.getElementById('sound-toggle').click();await tick();assert.equal(audioContexts,1);assert.equal(d.getElementById('ring-bell').disabled,false);
    d.getElementById('close-settings').click();d.getElementById('begin-gift').click();
    d.getElementById('preview-gift').click();
    assert.equal(d.getElementById('editor').hidden,true);assert.equal(d.getElementById('receiver-note').hidden,false);
    assert.equal(d.activeElement.id,'preview-heading');assert.equal(api.getState().lit,false);assert.equal(api.getState().soundEnabled,false);
    assert.equal(compose.open,false);
    d.getElementById('edit-gift').click();assert.equal(d.activeElement.id,'compose-heading');assert.equal(d.getElementById('message').value,'Thinking of you,\ntoday and tomorrow.');
    assert.equal(compose.open,true);assert.equal(api.getState().mode,'receive');
    d.getElementById('close-compose').click();assert.equal(compose.open,false);assert.equal(d.activeElement.id,'edit-gift');assert.equal(d.getElementById('edit-gift').hidden,false);
    d.querySelector('input[value=garden]').click();await tick();
    assert.equal(d.getElementById('offered-light').dataset.theme,'garden');assert.equal(d.getElementById('scene-art-next').classList.contains('is-visible'),true);
    for(const art of w.OfferedLightArtworks) {
      d.querySelector(`input[value="${art.id}"]`).click();await tick();
      assert.equal(api.getState().art,art.id);assert.equal(d.getElementById('offered-light').dataset.theme,art.theme);
      assert.equal(d.getElementById('current-art-title').textContent,art.title);
      assert.ok(d.getElementById('scene-art-next').src.endsWith(art.src));
    }
    d.getElementById('open-share').click();assert.equal(d.getElementById('share-dialog').open,true);
    d.getElementById('prepare-image').click();await tick();
    assert.equal(api.getState().prepared,true);assert.equal(shared.length,0);assert.equal(d.getElementById('share-image').disabled,false);
    assert.ok(drawn.includes('For Mina <3'));assert.ok(drawn.includes('Thinking of you,'));assert.ok(drawn.includes('today and tomorrow.'));
    d.getElementById('share-image').click();await tick();
    assert.equal(shared.length,1);assert.equal(shared[0].files[0].name,'offered-light.png');
    d.getElementById('close-share').click();d.getElementById('edit-gift').click();
    edit('message','A revised thought');assert.equal(d.getElementById('share-image').disabled,true);
    d.getElementById('close-compose').click();d.getElementById('open-share').click();
    d.getElementById('share-text').click();await tick();assert.equal(shared[1].text,d.getElementById('exact-share-text').textContent);
    d.getElementById('close-share').click();assert.equal(d.activeElement.id,'open-share');
    d.getElementById('open-settings').click();assert.equal(d.getElementById('settings-dialog').open,true);
    d.getElementById('close-settings').click();assert.equal(d.activeElement.id,'open-settings');assert.equal(d.body.style.overflow,'');
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

test('exact artwork IDs beat repeated themes; decode failure retains the last successful selection and export', async () => {
  const artworkData = [
    {id:'warmth',theme:'dawn',title:'Warmth',src:'data:warmth'},
    {id:'dawn',theme:'dusk',title:'Evening',src:'data:evening'},
    {id:'blue',theme:'dusk',title:'Blue',src:'data:blue'}
  ];
  const f=fixture({artworkData,radioValues:['warmth','dawn','blue']});
  await f.load();
  try {
    f.radios[1].checked=true;f.radios[1].emit('change');
    assert.equal(f.api.getState().art,'warmth','pending artwork does not change the committed art');
    assert.equal(f.radios[0].checked,true);
    await f.load(1);
    assert.equal(f.api.getState().art,'dawn','an exact ID takes precedence over the first artwork theme');
    assert.equal(f.nodes['current-art-title'].textContent,'Evening');
    assert.equal(f.nodes['offered-light'].dataset.theme,'dusk');
    f.nodes['prepare-image'].emit('click');await f.tick();f.blobs[0]({type:'image/png'});await f.tick();
    const revision=f.api.getState().revision;
    f.radios[2].checked=true;f.radios[2].emit('change');
    f.imageLoads[2].decode=()=>Promise.reject(new Error('decode failed'));
    await f.load(2);
    assert.equal(f.nodes['offered-light'].dataset.artError,'true');
    assert.equal(f.api.getState().art,'dawn');assert.equal(f.api.getState().revision,revision);
    assert.equal(f.api.getState().prepared,true,'the prepared image still represents the selected successful artwork');
    assert.equal(f.radios[1].checked,true);assert.equal(f.radios[2].checked,false);
    assert.equal(f.nodes['scene-art'].src,'data:evening');
    assert.equal(f.nodes['current-art-title'].textContent,'Evening');
    f.nodes['share-image'].emit('click');await f.tick();
    assert.equal(f.shares.length,1);assert.deepEqual(Object.keys(f.shares[0]),['files']);
    f.nodes['prepare-image'].emit('click');await f.tick();
    assert.equal(f.imageDraws.at(-1)[0].source,'data:evening','a fresh export uses the retained decoded artwork');
    f.blobs[1]({type:'image/png'});await f.tick();
    f.radios[2].checked=true;f.radios[2].emit('change');await f.load(3);
    assert.equal(f.api.getState().art,'blue');assert.equal(f.nodes['current-art-title'].textContent,'Blue');
    assert.equal(f.api.getState().prepared,false);assert.equal(f.radios[2].checked,true);
  } finally {f.api.destroy();}
});

test('a failed displayed-image decode keeps artwork selection, theme, and exports coherent', async () => {
  const f=fixture();await f.load();
  try {
    f.nodes['scene-art-next'].decode=()=>Promise.reject(new Error('display decode failed'));
    f.radios[1].checked=true;f.radios[1].emit('change');await f.load(1);
    assert.equal(f.api.getState().art,'dawn');assert.equal(f.radios[0].checked,true);
    assert.equal(f.nodes['offered-light'].dataset.theme,'dawn');assert.equal(f.nodes['current-art-title'].textContent,'dawn');
    assert.equal(f.nodes['scene-art'].src,'data:dawn');
    f.nodes['prepare-image'].emit('click');await f.tick();
    assert.equal(f.imageDraws[0][0].source,'data:dawn');
    f.blobs[0]({type:'image/png'});await f.tick();assert.equal(f.api.getState().prepared,true);
  } finally {f.api.destroy();}
});

test('square artwork exports as a full 1600px square before its dedication', async () => {
  const f=fixture({imageSize:[2048,2048]});await f.load();
  try {
    f.nodes['prepare-image'].emit('click');await f.tick();
    assert.deepEqual(f.imageDraws[0].slice(1),[0,0,1600,1600]);
    assert.equal(f.drawn[0].y,1740);
    f.blobs[0]({type:'image/png'});await f.tick();assert.equal(f.api.getState().prepared,true);
  } finally {f.api.destroy();}
});

// JSDOM verifies controller/DOM behavior; these dialog methods model native lifecycle,
// not Safari rendering or its operating-system keyboard.
async function dialogFixture({ native = true } = {}) {
  const { JSDOM } = await import('jsdom');
  const dom=new JSDOM(`<!doctype html><body style="overflow:clip"><main id="offered-light">
    <button id="begin-gift">Compose</button><button id="edit-gift" hidden>Edit</button>
    <button id="open-share">Share</button><button id="open-settings">Settings</button>
    <h1 id="preview-heading" tabindex="-1">A light</h1><p id="receiver-note" hidden>Receiving preview</p>
    <p id="dedication"></p><p id="gift-message"></p><p id="signature"></p>
    <button id="candle-toggle"></button><button id="sound-toggle"></button><button id="ring-bell"></button>
    <dialog id="compose-dialog"><h2 id="compose-heading" tabindex="-1">Compose</h2><button id="close-compose">Close</button>
      <section id="editor"><input id="to-name"><textarea id="message"></textarea><input id="from-name">
      <button id="preview-gift">Receive</button></section></dialog>
    <dialog id="share-dialog"><h2>Share</h2><button id="close-share">Close</button><pre id="exact-share-text"></pre></dialog>
    <dialog id="settings-dialog"><h2>Settings</h2><button id="close-settings">Close</button></dialog>
    </main></body>`,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://local.invalid/'});
  const w=dom.window,d=w.document,$=id=>d.getElementById(id),autofocus=[];
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  let scrolls=0;
  w.HTMLElement.prototype.scrollIntoView=function(){scrolls++;};
  w.Image=class {constructor(){this.naturalWidth=2048;this.naturalHeight=2048;}set src(value){this.source=value;w.queueMicrotask(()=>this.onload());}decode(){return Promise.resolve();}};
  w.PointCastEffects={createAudio:()=>({enable:()=>Promise.resolve(true),stop(){},dispose(){}})};
  w.HTMLDialogElement.prototype.showModal=native ? function(){
    this.open=true;const target=this.querySelector('[autofocus]') || this.querySelector('input,button');
    autofocus.push(target?.id);target?.focus();
  } : undefined;
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.eval(source);const api=w.initOfferedLight([{id:'warmth',theme:'dawn',title:'Warmth',src:'data:warmth'}]);
  const edit=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const click=id=>{$(id).focus();$(id).click();};
  const escape=id=>{const dialog=$(id);if(native){const event=new w.Event('cancel',{cancelable:true});if(dialog.dispatchEvent(event))dialog.close();}else dialog.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));};
  return {dom,w,d,$,api,edit,click,escape,autofocus,get scrolls(){return scrolls;},destroy(){api.destroy();w.close();}};
}

test('compose dialog retains drafts, focuses its heading, and receives/edit without turning on consent effects', async () => {
  const f=await dialogFixture();
  try {
    f.click('begin-gift');assert.equal(f.$('compose-dialog').open,true);
    assert.equal(f.d.activeElement.id,'compose-heading');assert.equal(f.autofocus[0],'compose-heading','showModal can focus the heading before a phone text field');
    assert.equal(f.d.body.style.overflow,'hidden');
    f.edit('to-name','Mina');f.edit('message','Holding you here.');f.edit('from-name','Alex');
    f.click('close-compose');assert.equal(f.$('compose-dialog').open,false);
    assert.equal(f.d.activeElement.id,'begin-gift');assert.equal(f.d.body.style.overflow,'clip');
    f.click('begin-gift');assert.equal(f.$('message').value,'Holding you here.');
    f.escape('compose-dialog');assert.equal(f.d.activeElement.id,'begin-gift');assert.equal(f.$('message').value,'Holding you here.');
    f.click('candle-toggle');f.click('sound-toggle');await Promise.resolve();await Promise.resolve();
    assert.equal(f.api.getState().lit,true);assert.equal(f.api.getState().soundEnabled,true);
    f.click('begin-gift');f.click('preview-gift');
    assert.equal(f.$('compose-dialog').open,false);assert.equal(f.d.body.style.overflow,'clip');
    assert.equal(f.api.getState().mode,'receive');assert.equal(f.api.getState().lit,false);assert.equal(f.api.getState().soundEnabled,false);
    assert.equal(f.d.activeElement.id,'preview-heading');assert.ok(f.scrolls>0);assert.equal(f.$('editor').hidden,true);
    assert.equal(f.$('gift-message').textContent,'Holding you here.');
    f.click('edit-gift');assert.equal(f.api.getState().mode,'receive');assert.equal(f.$('compose-dialog').open,true);
    assert.equal(f.$('editor').hidden,false);assert.equal(f.d.activeElement.id,'compose-heading');assert.equal(f.$('to-name').value,'Mina');
    f.edit('message','An updated thought.');f.click('close-compose');
    assert.equal(f.d.activeElement.id,'edit-gift');assert.equal(f.$('edit-gift').hidden,false,'the focus-return target stays visible');
    assert.equal(f.$('message').value,'An updated thought.');assert.equal(f.$('gift-message').textContent,'An updated thought.');
  } finally {f.destroy();}
});

test('share/settings dialogs restore invoker focus and release native scroll locks on close, Escape, pagehide and destroy', async () => {
  const f=await dialogFixture();
  try {
    f.edit('message','Private draft');
    for(const name of ['share','settings']) {
      f.click('open-'+name);assert.equal(f.$(name+'-dialog').open,true);assert.equal(f.d.body.style.overflow,'hidden');
      f.click('close-'+name);assert.equal(f.d.activeElement.id,'open-'+name);assert.equal(f.d.body.style.overflow,'clip');
      f.click('open-'+name);f.escape(name+'-dialog');assert.equal(f.d.activeElement.id,'open-'+name);assert.equal(f.d.body.style.overflow,'clip');
    }
    f.click('open-share');f.click('open-settings');
    assert.equal(f.$('share-dialog').open,false);assert.equal(f.$('settings-dialog').open,true);
    f.w.dispatchEvent(new f.w.Event('pagehide'));
    assert.equal(f.$('settings-dialog').open,false);assert.equal(f.d.body.style.overflow,'clip');assert.equal(f.$('message').value,'Private draft');
    f.click('open-share');f.api.destroy();assert.equal(f.$('share-dialog').open,false);assert.equal(f.d.body.style.overflow,'clip');
    f.click('open-share');assert.equal(f.$('share-dialog').open,false,'destroy removed the launch listener');
  } finally {f.destroy();}
});

test('browsers without showModal use an in-flow dialog without locking background scroll', async () => {
  const f=await dialogFixture({native:false});
  try {
    f.click('begin-gift');assert.equal(f.$('compose-dialog').open,true);assert.equal(f.$('compose-dialog').hidden,false);
    assert.equal(f.$('compose-dialog').dataset.nonmodal,'true');
    assert.equal(f.scrolls,1,'the in-flow fallback scrolls its heading into view');
    assert.equal(f.d.body.style.overflow,'clip');assert.equal(f.d.activeElement.id,'compose-heading');
    f.edit('message','Still here');f.escape('compose-dialog');
    assert.equal(f.$('compose-dialog').open,false);assert.equal(f.$('compose-dialog').hidden,true);assert.equal(f.d.activeElement.id,'begin-gift');
    f.click('begin-gift');assert.equal(f.$('message').value,'Still here');f.click('preview-gift');
    assert.equal(f.$('compose-dialog').hidden,true);assert.equal(f.api.getState().mode,'receive');assert.equal(f.d.activeElement.id,'preview-heading');
  } finally {f.destroy();}
});

test('a slow displayed-image decode cannot replace a newer loaded source or its export', async () => {
  const f=fixture();await f.load();
  try {
    let finishOldDecode,calls=0;
    f.nodes['scene-art-next'].decode=()=>++calls===1 ? new Promise(resolve=>{finishOldDecode=resolve;}) : Promise.resolve();
    f.radios[1].checked=true;f.radios[1].emit('change');await f.load(1);
    assert.equal(f.api.getState().art,'dawn');
    f.radios[2].checked=true;f.radios[2].emit('change');await f.load(2);
    finishOldDecode();await f.tick();
    assert.equal(f.api.getState().art,'dusk');assert.equal(f.nodes['scene-art-next'].src,'data:dusk');
    assert.equal(f.nodes['current-art-title'].textContent,'dusk');assert.equal(f.radios[2].checked,true);
    f.nodes['prepare-image'].emit('click');await f.tick();assert.equal(f.imageDraws[0][0].source,'data:dusk');
    f.blobs[0]({type:'image/png'});await f.tick();assert.equal(f.api.getState().prepared,true);
  } finally {f.api.destroy();}
});
