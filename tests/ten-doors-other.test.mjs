import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { SPECIES, tidePool, townDay, meterFortune, pacificClock } from '../src/lib/ten-doors/daily.mjs';

// Execute each room's actual entry script against its page markup. Only the
// two simple Astro-generated lists need expanding for this DOM-only harness.
function room(t, slug, options = {}) {
  const source = readFileSync(new URL(`../src/pages/${slug}.astro`, import.meta.url), 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*?;\s*$/gm, '');
  let markup = source.replace(/^---[\s\S]*?---/, '').replace(/<script>[\s\S]*?<\/script>/, '').replace(/<style>[\s\S]*?<\/style>/, '');
  markup = markup.replace(/\{SPECIES\.map\(\(sp\) => \([\s\S]*?\)\)\}/, SPECIES.map(sp => `<label><span>${sp.name}</span><input type="number" min="0" max="30" name="${sp.id}" value="0"></label>`).join(''));
  markup = markup.replace(/\{Array\.from\(\{ length: 16 \}, \(_, i\) => .*?\)\}/, Array.from({length:16},(_,i)=>`<option value="${i}">Step ${i+1}</option>`).join(''));
  const dom = new JSDOM(markup, {url:`https://pointcast.test/${slug}/`,pretendToBeVisual:true,runScripts:'outside-only'});
  const win = dom.window, doc = win.document;
  t.after(()=>win.close());
  let now = 0, clock = Date.parse(options.at || '2026-11-03T01:00:00Z'), nextTimer = 0;
  const timers = new Map(), intervals = [], frames = new Map(), writes = [], sounds = [];
  const drawing = new Proxy({}, {get(o,k){if(k in o)return o[k];if(k==='createLinearGradient')return()=>({addColorStop(){}});return()=>{};}});
  const media = new win.EventTarget(); media.matches=Boolean(options.reduced);
  win.matchMedia=()=>media;
  win.Date=class extends Date {constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}};
  Object.defineProperty(win.performance,'now',{value:()=>now});
  win.requestAnimationFrame=fn=>{frames.set(++nextTimer,fn);return nextTimer;};
  win.cancelAnimationFrame=id=>frames.delete(id);
  win.setTimeout=(fn,delay)=>{timers.set(++nextTimer,{at:now+delay,fn});return nextTimer;};
  win.setInterval=fn=>{intervals.push(fn);return intervals.length;};
  Object.assign(win,{
    SPECIES,tidePool,townDay,meterFortune,pacificClock,
    tone:(...args)=>sounds.push(args),kick:(...args)=>sounds.push(args),noise:(...args)=>sounds.push(args),audio:()=>null,
    hz:m=>440*2**((m-69)/12),fitCanvas:()=>drawing,
    pointerXY:()=>({x:320,y:230}),typing:e=>Boolean(e.target.closest('input,textarea,select')),
    reducedMotion:()=>media.matches,
    load:(key,fallback)=>Object.hasOwn(options.saved||{},key)?options.saved[key]:fallback,
    save:(key,value)=>writes.push({key,value:JSON.parse(JSON.stringify(value))}),
  });
  win.eval(script);
  return {win,doc,frames,writes,sounds,intervals,source,
    get:id=>doc.getElementById(id),
    click:id=>doc.getElementById(id).click(),
    submit:()=>doc.getElementById('tp-form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true})),
    runFor(ms){const end=now+ms;for(;;){const entries=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!entries.length)break;const [id,timer]=entries[0];timers.delete(id);now=timer.at;timer.fn();}now=end;},
    frame(){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));},
    setDate(iso){clock=Date.parse(iso);},
    day:()=>townDay(new Date(clock)),
    hidden(value){Object.defineProperty(doc,'hidden',{value,configurable:true});doc.dispatchEvent(new win.Event('visibilitychange'));},
  };
}

test('meter has an equivalent coin button, one click produces a current fortune, and reduced motion covers the needle', t=>{
  const r=room(t,'meter-oracle');
  const before=r.sounds.length;
  r.get('mo-coin').dispatchEvent(new r.win.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));
  assert.equal(r.sounds.length,before,'button Space is left to native button activation');
  r.click('mo-coin');
  assert.match(r.get('mo-when').textContent,/Same for everyone asking now/);
  assert.equal(r.get('mo-fortune').textContent,meterFortune(new Date('2026-11-03T01:00:00Z')).fortune);
  assert.match(r.source,/@media \(prefers-reduced-motion: reduce\)[\s\S]*?#mo-needle \{ transition: none !important/);
});

test('drum native step controls enforce turns and Start over cancels pending agent moves',t=>{
  const r=room(t,'drum-round',{saved:{'drum-round:kept':null}});
  r.get('dr-step').value='7';
  r.get('dr-step').dispatchEvent(new r.win.Event('change'));
  r.click('dr-place');
  assert.match(r.get('dr-read').textContent,/step 8/);
  assert.equal(r.get('dr-place').disabled,true);
  r.click('dr-place');
  r.runFor(4100);
  assert.equal(r.get('dr-place').disabled,false);
  assert.match(r.get('dr-read').textContent,/Lap 2/);
  r.click('dr-place');
  r.click('dr-reset');
  r.runFor(10000);
  assert.match(r.get('dr-read').textContent,/Your seat first/);
  assert.equal(r.get('dr-place').disabled,false);
  assert.equal(r.get('dr-keep').hidden,true);
});

test('drum playback can pause without losing its bar and hides safely without restarting sound',t=>{
  const r=room(t,'drum-round');
  r.doc.querySelector('[data-voice="1"]').click();
  assert.equal(r.get('dr-playback').textContent,'Start playback','auditioning a voice does not start a loop');
  r.click('dr-place');
  assert.equal(r.get('dr-playback').textContent,'Pause playback');
  r.click('dr-playback');
  assert.equal(r.get('dr-playback').textContent,'Resume playback');
  r.click('dr-playback');
  r.hidden(true);
  assert.equal(r.get('dr-playback').textContent,'Resume playback');
  const before=r.sounds.length;r.intervals.forEach(fn=>fn());
  assert.equal(r.sounds.length,before);
  r.hidden(false);
  assert.equal(r.get('dr-playback').textContent,'Resume playback');
});

test('drum Keep respects cancel, saves only once per completed round, and discards malformed saved bars',t=>{
  const r=room(t,'drum-round',{saved:{'drum-round:kept':[null,{name:'bad',code:'x'},{name:'<script>',code:Array(5).fill('0'.repeat(16)).join('|')}]}});
  assert.equal(r.get('dr-kept').children.length,1);
  assert.equal(r.get('dr-kept').querySelector('script'),null,'saved names are rendered as text');
  for(let lap=0;lap<6;lap++){r.click('dr-place');r.runFor(4100);}
  assert.equal(r.get('dr-keep').hidden,false);
  r.win.prompt=()=>null;r.click('dr-keep');
  assert.equal(r.writes.length,0);
  r.win.prompt=()=>'A bar';r.click('dr-keep');r.click('dr-keep');
  assert.equal(r.writes.length,1);
  assert.equal(r.writes[0].value.length,2);
  assert.equal(r.get('dr-keep').hidden,true);
});

test('tide pool has keyboard and text equivalents, repairs malformed history, and files once',t=>{
  const r=room(t,'tide-pool-census',{reduced:true,saved:{'tide-pool-census:v1':null}});
  const pool=tidePool(r.day());
  assert.equal(r.get('tp-observations').children.length,pool.creatures.length);
  r.click('tp-stir');
  assert.match(r.get('tp-read').textContent,/whole pool is stirred/);
  r.frame();assert.equal(r.frames.size,0,'reduced motion renders a still scene');
  for(const sp of SPECIES)r.doc.querySelector(`[name="${sp.id}"]`).value=pool.counts[sp.id];
  r.submit();r.submit();
  assert.equal(r.writes.length,1);
  assert.equal(r.writes[0].value[r.day()].right,4);
  assert.equal(r.doc.querySelector('[name="crab"]').disabled,true);
  assert.match(r.get('tp-read').textContent,/4 of 4 right/);
});

test('tide pool replaces an old day before accepting guesses and validates stored results',t=>{
  const r=room(t,'tide-pool-census',{at:'2026-11-03T07:59:59Z',saved:{'tide-pool-census:v1':{'2026-11-02':{right:'4'},'2026-11-01':{right:99}}}});
  assert.equal(r.doc.querySelector('[name="crab"]').disabled,false,'invalid results cannot lock the form');
  r.setDate('2026-11-03T08:00:01Z');
  r.submit();
  assert.equal(r.writes.length,0,'old guesses cannot file the newly opened pool');
  assert.match(r.get('tp-read').textContent,/Pool for 2026-11-03/);
  assert.equal(r.get('tp-observations').children.length,tidePool('2026-11-03').creatures.length);
  r.submit();
  assert.equal(r.writes.length,1);
  assert.ok(r.writes[0].value['2026-11-03']);
});
