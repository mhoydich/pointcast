const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../../public/pointcast-effects/v0.1.0/visual-effects.js'), 'utf8');
class Element {
  constructor() { this.attrs = {}; this.listeners = {}; this.classes = new Set(); this.classList = {add: x => this.classes.add(x), remove: x => this.classes.delete(x)}; }
  setAttribute(k,v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener(k,f) { this.listeners[k] = f; }
  removeEventListener(k,f) { if (this.listeners[k] === f) delete this.listeners[k]; }
  click() { this.listeners.click?.(); }
}
function setup() {
  const win = {PointCastEffects: {}}; vm.runInNewContext(source, {window: win, setTimeout, clearTimeout, Promise});
  let pending = []; const doc = { defaultView: {}, createElement() { let resolve, reject; const p = new Promise((a,b) => {resolve=a;reject=b}); const img = {decode: () => p}; pending.push({img,resolve,reject}); return img; } };
  const current = new Element(), next = new Element(), status = new Element(); current.ownerDocument = doc; current.src = 'old';
  return {api:win.PointCastEffects, current,next,status,pending};
}
test('candle synchronizes state and leaves its label alone', () => {
  const {api}=setup(), button=new Element(), host=new Element(), changes=[]; button.textContent='Light a candle';
  const c=api.createCandle(button,{root:host,onChange:v=>changes.push(v)}); button.click();
  assert.equal(c.getState(),true); assert.equal(host.attrs['data-lit'],'true'); assert.equal(button.attrs['aria-pressed'],'true'); assert.equal(button.textContent,'Light a candle');
  c.setLit(false); c.dispose(); button.click(); assert.deepEqual(changes,[true,false]); assert.equal(c.getState(),false);
});
test('decoded image commits immediately for reduced motion', async () => {
  const f=setup(), states=[]; const t=f.api.createArtworkTransition({...f,reducedMotion:()=>true,onState:s=>states.push(s)});
  const p=t.set({src:'new',alt:'A',title:'T'}); assert.equal(f.current.src,'old'); f.pending[0].resolve();
  assert.equal(await p,f.pending[0].img); assert.equal(f.current.src,'new'); assert.equal(f.current.alt,'A'); assert.equal(states.at(-1).loading,false);
});
test('failed decode keeps old artwork and reports failure', async () => {
  const f=setup(), states=[]; const t=f.api.createArtworkTransition({...f,onState:s=>states.push(s)});
  const p=t.set({src:'bad'}); f.pending[0].reject(Error('bad')); assert.equal(await p,null); assert.equal(f.current.src,'old'); assert.ok(states.at(-1).error);
});
test('new request supersedes late decode', async () => {
  const f=setup(); const t=f.api.createArtworkTransition({...f,reducedMotion:()=>true});
  const a=t.set({src:'a'}), b=t.set({src:'b'}); f.pending[1].resolve(); await b; f.pending[0].resolve(); assert.equal(await a,null); assert.equal(f.current.src,'b');
});
test('clear cancels an in-progress fade', async () => {
  const f=setup(); const t=f.api.createArtworkTransition({...f,reducedMotion:()=>false});
  const p=t.set({src:'new'}); f.pending[0].resolve(); await new Promise(setImmediate); assert.equal(f.next.classes.has('is-visible'),true); t.clear(); assert.equal(await p,null); assert.equal(f.current.src,'old'); assert.equal(f.next.classes.has('is-visible'),false);
});
test('dispose invalidates pending decode and prevents further work', async () => {
  const f=setup(); const t=f.api.createArtworkTransition({...f}); const p=t.set({src:'new'}); t.dispose(); f.pending[0].resolve(); assert.equal(await p,null); assert.equal(await t.set({src:'later'}),null); assert.equal(f.current.src,'old');
});
