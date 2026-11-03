import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

// Run each production inline script against its real controls. Audio/drawing
// are stubbed; state transitions, stored data and scheduling remain real.
function setup(t, slug, options = {}) {
  const source = readFileSync(new URL(`../src/pages/${slug}.astro`, import.meta.url), 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\s*import[^;]+;\s*/m, '');
  const markup = source.replace(/^---[\s\S]*?---/, '').replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
  const dom = new JSDOM(markup, {url:'https://pointcast.test/'+slug,runScripts:'outside-only',pretendToBeVisual:true});
  const w = dom.window, d = w.document;
  let now = 0, nextID = 0, muted = false;
  const frames = new Map(), intervals = new Map(), saved = new Map(), sounds = [], stops = [], rects = [];
  const param = () => ({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
  const oscillator = () => Object.assign(new w.EventTarget(), {frequency:param(),start(){sounds.push('organ');},stop(){stops.push('stop');},connect(){}});
  const gain = () => ({gain:param(),connect(){}});
  const context = {currentTime:0,createGain:gain,createOscillator:oscillator};
  Object.defineProperty(w.performance,'now',{value:()=>now});
  w.requestAnimationFrame = cb => {frames.set(++nextID,cb); return nextID;};
  w.cancelAnimationFrame = id => frames.delete(id);
  w.setInterval = cb => {intervals.set(++nextID,cb);return nextID;};
  w.clearInterval = id => intervals.delete(id);
  const g = new Proxy({}, {get(target,key){
    if(key in target) return target[key];
    if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop(){}});
    if(key==='fillRect')return (...args)=>rects.push(args);
    return ()=>{};
  }});
  Object.assign(w, {
    fitCanvas:()=>g, pointerXY:(_canvas,event)=>({x:event.clientX,y:event.clientY}),
    audio:()=>context,out:()=>gain(),
    hz:m=>440*2**((m-69)/12),pentatonic:(root,count)=>Array.from({length:count},(_,i)=>root+i),
    reducedMotion:()=>Boolean(options.reducedMotion), typing:e=>Boolean(e.target?.closest?.('input,textarea,select')),
    load:(_key,fallback)=>options.stored===undefined?fallback:options.stored,
    save:(key,value)=>saved.set(key,JSON.parse(JSON.stringify(value))),
    isMuted:()=>muted,setMuted:value=>{muted=value;},
    tone:()=>{sounds.push('tone');return {osc:oscillator(),gain:gain()};},
    kick:()=>sounds.push('kick'),noise:()=>sounds.push('noise'),
  });
  d.querySelector('canvas').setPointerCapture=()=>{};
  w.eval(script);
  t.after(()=>w.close());
  const get=id=>d.getElementById(id);
  return {w,d,get,frames,intervals,saved,sounds,stops,rects,
    frame(at){now=at;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(at));},
    tick(at){now=at;[...intervals.values()].forEach(cb=>cb());},
    click:id=>get(id).click(),
    change(id,value){get(id).value=String(value);get(id).dispatchEvent(new w.Event('change',{bubbles:true}));},
    pagehide(){w.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:true}));},
    back(){w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:true}));},
  };
}

test('Takeoff native lanes work, Shift+Tab does not toggle auto, and Back restarts a silent scene', t => {
  const room=setup(t,'takeoff-organ',{reducedMotion:true});
  room.w.dispatchEvent(new room.w.KeyboardEvent('keydown',{key:'Shift',shiftKey:true}));
  assert.equal(room.get('to-auto').getAttribute('aria-pressed'),'false');
  room.d.querySelector('[data-lane="2"]').click();
  assert.match(room.get('to-read').textContent,/lane 3/);
  assert.equal(room.sounds.length,3);
  room.frame(1000);
  room.pagehide();
  assert.equal(room.frames.size,0);
  assert.equal(room.stops.length,3,'all held oscillators stop before caching');
  room.back();
  assert.equal(room.frames.size,1);
  room.frame(1100);
  assert.equal(room.sounds.length,3,'Back does not resume auto or held notes');
});

test('Refinery rejects malformed saved grids and exposes every window to native controls', t => {
  const malformed = [null, [], Array(8).fill(null), Array(8).fill('11111111'), Array.from({length:8},()=>Array(7).fill(true)), Array.from({length:8},()=>Array(8).fill('yes'))];
  for(const stored of malformed){
    const room=setup(t,'refinery-lights',{stored});
    assert.equal(room.get('rl-play').getAttribute('aria-pressed'),'false');
    room.change('rl-tower',7);room.change('rl-voice',7);room.click('rl-window');
    const grid=room.saved.get('refinery-lights:v1');
    assert.equal(grid.length,8);assert.ok(grid.every(row=>row.length===8&&row.every(v=>typeof v==='boolean')));
    assert.equal(grid[7][7],true);
    assert.match(room.get('rl-read').textContent,/lamp 4 on at tower 8/);
    room.click('rl-clear');
    assert.ok(room.saved.get('refinery-lights:v1').flat().every(v=>!v));
  }
});

test('Refinery Play starts on the first click, pause stops scheduling, and cached Back remains usable', t => {
  const room=setup(t,'refinery-lights');
  assert.equal(room.frames.size,0,'the paused skyline has no idle animation');
  room.click('rl-clear');room.change('rl-tower',1);room.change('rl-voice',0);room.click('rl-window');
  room.sounds.length=0;
  room.click('rl-play');room.tick(100);
  assert.equal(room.get('rl-play').textContent,'Pause');assert.ok(room.sounds.includes('kick'));
  room.click('rl-play');const before=room.sounds.length;room.tick(2000);assert.equal(room.sounds.length,before);
  room.pagehide();assert.equal(room.intervals.size,0);
  room.back();assert.equal(room.intervals.size,1);assert.equal(room.get('rl-play').textContent,'Play');
});

test('Chalk ignores corrupt strokes and native beat/pitch controls add a playable bounded note', t => {
  const room=setup(t,'chalk-score',{stored:[null,{c:99,pts:[[1,2]]},{c:0,pts:[null,['bad',2],[1,Infinity],[1,-3]]}],reducedMotion:true});
  room.frame(0);
  room.d.querySelector('[data-chalk="3"]').click();room.change('cs-beat',7);room.change('cs-pitch',14);room.click('cs-note');
  const strokes=room.saved.get('chalk-score:v1');
  assert.deepEqual(strokes,[{c:3,pts:[[675,425]]}]);
  assert.match(room.get('cs-read').textContent,/pink pluck note at beat 8, pitch 1/);
  room.frame(5600);room.frame(5700);
  assert.ok(room.sounds.includes('tone'));
  assert.equal(room.rects.some(rect=>rect[2]===2&&rect[3]===440),false,'reduced motion has no sweeping playhead');
  room.click('cs-play');assert.equal(room.get('cs-play').textContent,'Play score');
  assert.ok(room.stops.length>0,'pause stops sounding voices');
  room.frame(5800);assert.equal(room.frames.size,0);
  room.pagehide();room.back();room.frame(6000);assert.equal(room.frames.size,0,'Back redraws without restarting playback');
});

test('Chalk keeps at most 120 strokes with bounded, valid points and clears an active drawing safely', t => {
  const longStroke={c:1,pts:Array.from({length:1000},(_,i)=>[i%720,100])};
  const room=setup(t,'chalk-score',{stored:[longStroke]});
  for(let i=0;i<125;i++)room.click('cs-note');
  const strokes=room.saved.get('chalk-score:v1');
  assert.equal(strokes.length,120);assert.ok(strokes.every(s=>s.pts.length<=320));
  const canvas=room.get('cs-slab');
  canvas.dispatchEvent(new room.w.MouseEvent('pointerdown',{clientX:5,clientY:5,bubbles:true}));
  room.click('cs-hose');
  canvas.dispatchEvent(new room.w.MouseEvent('pointermove',{clientX:200,clientY:300,bubbles:true}));
  canvas.dispatchEvent(new room.w.MouseEvent('pointerup',{bubbles:true}));
  assert.deepEqual(room.saved.get('chalk-score:v1'),[]);
  assert.equal(room.get('cs-play').getAttribute('aria-pressed'),'false');
});
