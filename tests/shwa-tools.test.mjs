import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountShwaTools } from '../src/lib/auth/shwa-tools.ts';
function fixture(t) {
  const dom = new JSDOM(`<section><textarea data-runtime-prompt></textarea><input type="checkbox" data-runtime-page><p data-ai-voice-status></p><button data-ai-dictate></button><button data-ai-read></button><button data-ai-stop></button><button data-ai-starter="song"></button><span data-runtime-result-text>Verified reply.</span></section><span data-live-now-title>Rock'n Me — Steve Miller Band</span>`, { url: 'https://pointcast.test/' });
  let active;
  class Recognition { start() { active = this; } abort() { this.aborted = true; } }
  dom.window.SpeechRecognition = Recognition;
  const root = dom.window.document.querySelector('section');
  const cleanup = mountShwaTools(root);
  t.after(() => { cleanup(); dom.window.close(); });
  return { dom, root, q: s => root.querySelector(s), active: () => active };
}
test('dictation creates an editable draft and auth change rejects late microphone results', t => {
  const f = fixture(t);
  let submits = 0;
  f.root.addEventListener('submit', () => submits++);
  f.q('[data-ai-dictate]').click();
  const active = f.active();
  active.onresult({ results: [[{ transcript: 'Tell me about this song.' }]] });
  assert.equal(f.q('[data-runtime-prompt]').value, 'Tell me about this song.');
  assert.equal(submits, 0);
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  assert.equal(active.aborted, true);
  active.onresult({ results: [[{ transcript: 'Late private speech' }]] });
  assert.doesNotMatch(f.q('[data-runtime-prompt]').value, /Late private speech/);
});
test('closing the panel stops listening, and song starter uses displayed song metadata', t => {
  const f = fixture(t);
  f.q('[data-ai-starter="song"]').click();
  assert.match(f.q('[data-runtime-prompt]').value, /Rock'n Me — Steve Miller Band/);
  assert.match(f.q('[data-runtime-prompt]').value, /Do not imply you have heard/);
  f.q('[data-ai-dictate]').click();
  const active = f.active();
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:dock-visibility', { detail: { open: false } }));
  assert.equal(active.aborted, true);
});
