import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { STORAGE_KEY, normalizeState, createDemoCard, completeReflection, exportDemo, initObjectLibrary } from '../src/scripts/object-library.mjs';

const root = new URL('../', import.meta.url);
const library = JSON.parse(await readFile(new URL('src/data/object-library.json', root), 'utf8'));
const read = path => readFile(new URL(path, root), 'utf8');

test('every original object has a useful ritual, honest capability boundary, artwork and seasonal atlas link', async () => {
  assert.equal(library.objects.length, 6);
  assert.equal(new Set(library.objects.map(item => item.id)).size, 6);
  for (const object of library.objects) {
    assert.ok(object.ritual.length > 50);
    assert.ok(object.experiment.length > 50);
    assert.match(object.boundary, /Concept only/);
    assert.ok(['winter','spring','summer','fall'].includes(object.season));
    assert.ok(library.uses.some(use => use.id === object.utility));
    const artwork = await read(`public/images/object-library/${object.image}`);
    assert.match(artwork, /<svg/);
    assert.doesNotMatch(artwork, /<script|(?:href|src)="https?:\/\//gim);
  }
  assert.ok((await stat(new URL('public/images/object-library/social.png', root))).size > 10000);
  assert.equal(library.boundaries.physicalInventory, false);
  assert.equal(library.boundaries.bookings, false);
  assert.equal(library.boundaries.submission, false);
  assert.equal(library.boundaries.payments, false);
  const page = await read('src/pages/object-library.astro');
  assert.match(page, /immersive isolated/);
  assert.match(page, /weather-atlas\/\?season=/);
  assert.match(page, /id="factory"/);
  assert.doesNotMatch(page, /href="\/local-object-factory/);
  assert.match(page, /id="ol-intention" disabled/);
  assert.match(page, /type="submit" disabled data-make-card/);
  assert.match(page, /type="submit" disabled class="ol-button ol-green"/);
});

test('untrusted browser state cannot invent inventory, objects, phases or uncapped notes', () => {
  const bad = normalizeState({ objectId:'fake', useId:'fake', phase:'booked', season:'monsoon', duration:'one-year', intention:'a'.repeat(1000), observation:'b'.repeat(1000), payments:true }, library);
  assert.equal(bad.objectId,'');
  assert.equal(bad.phase,'choose');
  assert.equal(bad.intention.length,400);
  assert.equal(bad.observation,'');
  assert.equal('payments' in bad,false);
  assert.equal(createDemoCard(bad,library).ok,false);
  assert.equal(exportDemo(bad,library),null);
  const selected=normalizeState({ objectId:'pane' },library);
  assert.equal(selected.phase,'plan');
  assert.equal(selected.useId,'weather');
  assert.equal(selected.season,'fall');
});

test('a demo card must precede reflection; reflection preserves the original object and plan', () => {
  const plan=normalizeState({objectId:'turn',intention:'Start a first task',useId:'focus',season:'summer'},library);
  assert.equal(completeReflection(plan,{outcome:'helped'},library).ok,false);
  const created=createDemoCard(plan,library,'2026-10-02T12:00:00Z');
  assert.equal(created.ok,true);
  assert.equal(created.state.phase,'card');
  const reflected=completeReflection(created.state,{objectId:'shell',season:'winter',outcome:'mixed',observation:'The off control needs work'},library,'2026-10-02T13:00:00Z');
  assert.equal(reflected.state.objectId,'turn');
  assert.equal(reflected.state.season,'summer');
  assert.equal(reflected.state.phase,'reflection');
  assert.equal(reflected.state.createdAt,'2026-10-02T12:00:00.000Z');
  assert.match(exportDemo(reflected.state,library),/No inventory, reservation, pickup, loan, payment or submission/);
  assert.match(exportDemo(reflected.state,library),/The off control needs work/);
  assert.match(exportDemo(reflected.state,library),/nothing has been sent to a maker/);
});

function fixture(storage) {
  const dom=new JSDOM(`<div data-object-library>
    <h2 id="ol-demo-title" tabindex="-1">Demo</h2>
    <button data-filter="all" aria-pressed="true">All</button><button data-filter="room">Room</button><p data-filter-status></p>
    ${library.objects.map(object=>`<article data-object="${object.id}" data-utility="${object.utility}"><button data-pick="${object.id}"></button></article>`).join('')}
    ${['choose','plan','card','reflection'].map(phase=>`<li data-step="${phase}"></li>`).join('')}
    <form data-plan-form><select name="objectId"><option value=""></option>${library.objects.map(object=>`<option value="${object.id}">${object.name}</option>`).join('')}</select><select name="useId">${library.uses.map(use=>`<option value="${use.id}">${use.name}</option>`).join('')}</select><select name="duration"><option value="twenty-minutes"></option><option value="one-walk"></option><option value="one-evening"></option><option value="one-day"></option></select><select name="season">${['winter','spring','summer','fall'].map(season=>`<option value="${season}"></option>`).join('')}</select><textarea name="intention"></textarea><button type="submit">Create</button></form>
    <div data-card-empty></div><div data-card-content hidden><span data-card-status></span><img data-card-image/><p data-card-type></p><h3 data-card-name></h3><p data-card-use></p><p data-card-trial></p><p data-card-intention></p></div>
    <form data-reflection-form hidden><select name="outcome">${['not-tried','helped','mixed','not-helpful'].map(outcome=>`<option value="${outcome}"></option>`).join('')}</select><textarea name="observation"></textarea><button type="submit">Reflect</button></form>
    <p data-demo-status></p><button data-export-demo disabled>Export</button><button data-clear-demo>Clear</button>
    </div>`,{url:'https://pointcast.xyz/object-library/'});
  const node=dom.window.document.querySelector('[data-object-library]');
  const controller=initObjectLibrary(node,library,storage ? {storage} : {});
  return {dom,node,controller,query:selector=>node.querySelector(selector),submit:selector=>node.querySelector(selector).dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}))};
}

test('browser demo completes, restores, invalidates edited plans, filters and clears without sending notes', () => {
  const memory=new Map();
  const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
  const f=fixture(storage);
  f.query('[data-pick="pip"]').click();
  assert.equal(f.controller.getState().phase,'plan');
  assert.equal(f.query('[name="season"]').value,'spring');
  f.query('[name="intention"]').value='<img src=x onerror="alert(1)">';
  f.query('[name="intention"]').dispatchEvent(new f.dom.window.Event('input'));
  f.submit('[data-plan-form]');
  assert.equal(f.query('[data-card-content]').hidden,false);
  assert.equal(f.query('[data-card-intention]').textContent,'<img src=x onerror="alert(1)">');
  assert.equal(f.query('[data-card-intention]').children.length,0);
  f.query('[name="observation"]').value='Paper was enough.';
  f.submit('[data-reflection-form]');
  assert.equal(f.controller.getState().phase,'reflection');
  assert.match(f.query('[data-demo-status]').textContent,/Nothing was submitted/);
  const restored=fixture(storage);
  assert.equal(restored.controller.getState().observation,'Paper was enough.');
  assert.match(restored.query('[data-demo-status]').textContent,/reflection is restored/);
  restored.query('[name="season"]').value='winter';
  restored.query('[name="season"]').dispatchEvent(new restored.dom.window.Event('change'));
  assert.equal(restored.controller.getState().phase,'plan');
  assert.equal(restored.query('[data-reflection-form]').hidden,true);
  restored.query('[data-filter="room"]').click();
  assert.equal(restored.query('[data-object="glow"]').hidden,false);
  assert.equal(restored.query('[data-object="turn"]').hidden,true);
  restored.query('[data-clear-demo]').click();
  assert.equal(memory.has(STORAGE_KEY),false);
  assert.equal(restored.controller.getState().objectId,'');
  assert.equal(restored.query('[data-export-demo]').disabled,true);
  assert.equal(initObjectLibrary(restored.node,library),undefined);
});

test('blocked storage still permits a complete in-memory demo and explains failed clearing', () => {
  const storage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')},removeItem(){throw new Error('blocked')}};
  const f=fixture(storage);
  assert.match(f.query('[data-demo-status]').textContent,/storage is unavailable/);
  f.query('[data-pick="pane"]').click();
  f.submit('[data-plan-form]');
  assert.equal(f.controller.getState().phase,'card');
  f.submit('[data-reflection-form]');
  assert.equal(f.controller.getState().phase,'reflection');
  f.query('[data-clear-demo]').click();
  assert.equal(f.controller.getState().phase,'choose');
  assert.match(f.query('[data-demo-status]').textContent,/blocked storage removal/);
});
