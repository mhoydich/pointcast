import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

test('all five Listen buttons wait for audio, show failures, and never post a prayer', async () => {
  const source = readFileSync(new URL('../src/pages/prayer-altars-evening.astro', import.meta.url), 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const bundle = await build({ stdin: { contents: script, resolveDir: fileURLToPath(new URL('../src/pages/', import.meta.url)), loader: 'ts' }, bundle: true, write: false, format: 'iife', platform: 'browser' });
  const stations = ['none', 'vespers', 'lucernarium', 'compline', 'vigil'];
  const dom = new JSDOM(stations.map(key => `<article class="pe__altar" data-station="${key}"><button data-listen>Listen</button><button data-pray>Pray</button><p data-audio-status role="status"></p></article>`).join(''), { url: 'https://pointcast.xyz/prayer-altars-evening', runScripts: 'outside-only' });
  const { window } = dom;
  const contexts = [], starts = [], requests = [];
  class Context {
    state = 'suspended'; currentTime = 12; destination = {};
    constructor() { contexts.push(this); }
    resume() { return new Promise(resolve => { this.finish = () => { this.state = 'running'; resolve(); }; }); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    node() {
      const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
      return { frequency: parameter(), gain: parameter(), connect: target => target, start: time => { assert.equal(this.state, 'running'); starts.push(time); }, stop() {} };
    }
    createOscillator() { return this.node(); }
    createGain() { return this.node(); }
    createBiquadFilter() { return this.node(); }
  }
  window.AudioContext = Context;
  window.fetch = async (url, options = {}) => { requests.push({ url, method: options.method || 'GET' }); return { json: async () => ({ ok: true, count: 1, total: 1, recent: [] }) }; };
  try {
    window.eval(bundle.outputFiles[0].text);
    assert.equal(contexts.length, 0, 'no autoplay');
    for (const station of stations) {
      const before = starts.length;
      if (contexts[0]) contexts[0].state = 'interrupted';
      window.document.querySelector(`[data-station="${station}"] [data-listen]`).click();
      assert.equal(starts.length, before, 'no tone before resume');
      contexts[0].finish();
      await new Promise(setImmediate);
      assert(starts.length > before);
      assert.match(window.document.querySelector(`[data-station="${station}"] [data-audio-status]`).textContent, new RegExp(`${station.toUpperCase()} tone started`));
    }
    assert.equal(requests.filter(r => r.method === 'POST').length, 0);
    contexts[0].state = 'suspended';
    contexts[0].resume = () => Promise.reject(new Error('blocked'));
    window.document.querySelector('[data-listen]').click();
    await new Promise(setImmediate);
    assert.match(window.document.querySelector('[data-station="none"] [data-audio-status]').textContent, /Sound could not start/);
    assert.equal(requests.filter(r => r.method === 'POST').length, 0);
    window.document.querySelector('[data-pray]').click();
    contexts[1].finish();
    await new Promise(setImmediate);
    assert.equal(requests.filter(r => r.method === 'POST').length, 1, 'Pray keeps its original action');
  } finally { window.close(); }
});
