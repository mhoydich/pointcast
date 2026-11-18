import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

test('Back and Forward restore studies and records across pending room reads', async t => {
  const page = new URL('../public/loom/studies/index.html', import.meta.url);
  const dom = new JSDOM(await readFile(page,'utf8'), {
    pretendToBeVisual:true,
    url:'https://example.org/loom/studies/?view=line&record=m_two&src=desk#reader'
  });
  const { window } = dom;
  t.after(() => window.close());
  for (const key of ['window','document','location','history','requestAnimationFrame','cancelAnimationFrame']) {
    Object.defineProperty(globalThis,key,{value:window[key], configurable:true});
    t.after(() => { delete globalThis[key]; });
  }
  window.HTMLCanvasElement.prototype.getContext = () => null;
  const pending = [];
  t.mock.method(globalThis,'fetch', async (url, {signal}) => {
    const room = new URL(url,window.location.href).searchParams.get('to');
    const data = {ok:true,log:{address:room},messages:['m_one','m_two','m_three'].map((id,index) => ({
      id, seq:index+1, at:'2026-11-18T10:00:00Z', body:room + ' ' + id
    }))};
    return new Promise(resolve => pending.push({room,signal,finish:() => resolve(Response.json(data))}));
  });
  const tick = () => new Promise(resolve => setImmediate(resolve));
  const at = () => new URL(window.location.href);
  const el = selector => window.document.querySelector(selector);
  async function traverse(direction) {
    const popped = once(window,'popstate');
    window.history[direction]();
    await popped;
  }
  await import('../public/loom/studies/studio.mjs');
  pending.shift().finish();
  await tick();
  assert.equal(el('#record-body').textContent,'#grokbot m_two');

  const length = window.history.length;
  el('[data-mode=weave]').click();
  el('#next').click();
  el('[data-mode=weave]').click();
  assert.equal(window.history.length,length+1);
  el('#room').value = '#metaverse';
  el('#room').dispatchEvent(new window.Event('change'));
  const delayed = pending.shift();
  assert.equal(delayed.room,'#metaverse');
  assert.equal(at().searchParams.get('room'),'#metaverse');
  assert.equal(window.history.length,length+2);

  await traverse('back');
  assert.equal(delayed.signal.aborted,true);
  pending.shift().finish();
  delayed.finish();
  await tick();
  assert.equal(el('#record-body').textContent,'#grokbot m_three');
  assert.equal(el('[aria-pressed=true][data-mode]').dataset.mode,'weave');
  await traverse('back');
  assert.equal(el('#record-body').textContent,'#grokbot m_two');
  assert.equal(el('[aria-pressed=true][data-mode]').dataset.mode,'line');
  assert.equal(pending.length,0,'changing views in a loaded room reuses the room');
  await traverse('forward');
  await traverse('forward');
  pending.shift().finish();
  await tick();
  assert.equal(el('#record-body').textContent,'#metaverse m_one');
  assert.equal(at().searchParams.get('src'),'desk');
  assert.equal(at().hash,'#reader');
  assert.equal(window.history.length,length+2);
});
