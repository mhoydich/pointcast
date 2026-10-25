import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { SCENES } from '../public/open-channel/scenes.mjs';
import { createSession, startSession, chooseReply, parseVoiceChoice, exportSession } from '../public/open-channel/engine.mjs';

test('all three stories reach four distinct endings through valid two-choice paths', () => {
  assert.equal(SCENES.length, 3);
  for (const scene of SCENES) {
    const ends = new Set();
    function walk(session, seen) {
      const node = scene.nodes[session.nodeId];
      assert.ok(node && node.text);
      assert.ok(!seen.has(session.nodeId), 'story must end without loops');
      if (node.ending) { assert.equal(node.choices.length, 0); assert.equal(session.turns.length, 5); ends.add(node.ending); return; }
      assert.equal(node.choices.length, 2);
      for (let i = 0; i < node.choices.length; i++) {
        const next = chooseReply(scene, session, i);
        assert.notEqual(next, session);
        walk(next, new Set([...seen, session.nodeId]));
      }
    }
    walk(startSession(scene, createSession(scene)), new Set());
    assert.equal(ends.size, 4);
  }
});
test('invalid input cannot advance a scene and repeated start is inert', () => {
  const scene = SCENES[0]; const initial = createSession(scene);
  assert.equal(chooseReply(scene, initial, 0), initial);
  const started = startSession(scene, initial);
  assert.equal(startSession(scene, started), started);
  for (const index of [-1, 2, .5, NaN, '0']) assert.equal(chooseReply(scene, started, index), started);
  assert.equal(chooseReply(SCENES[1], started, 0), started);
});
test('voice commands require an unambiguous numbered choice', () => {
  for (const phrase of ['one', '1.', 'Option one!', 'number 1', ' choice ONE ']) assert.equal(parseVoiceChoice(phrase, 2), 0);
  assert.equal(parseVoiceChoice('two', 2), 1);
  for (const phrase of ['someone', 'two or one', 'do not choose one', '', 'three', 'one two']) assert.equal(parseVoiceChoice(phrase, 2), -1);
  assert.equal(parseVoiceChoice('two', 1), -1);
});
test('transcript export includes the actual branch, note, and provider disclosure', () => {
  const scene = SCENES[0];
  const session = chooseReply(scene, chooseReply(scene, startSession(scene, createSession(scene)), 1), 0);
  session.note = 'A test note <not HTML>.';
  const text = exportSession(scene, session);
  for (const turn of session.turns) assert.ok(text.includes(turn.text));
  assert.ok(text.includes('Dessa is not connected'));
  assert.ok(text.includes(scene.nodes[session.nodeId].ending));
  assert.ok(text.includes(session.note));
});
async function controller() {
  const page = await readFile(new URL('../src/pages/open-channel.astro', import.meta.url), 'utf8');
  const dom = new JSDOM(page.slice(page.indexOf('<!doctype')), { runScripts: 'outside-only', url: 'https://pointcast.xyz/open-channel/' });
  const utterances = [], recognitions = [], downloads = [];
  let cancels = 0;
  class Speech { constructor(text) { this.text = text; } }
  class Recognition { constructor() { recognitions.push(this); } start() { this.onstart?.(); } abort() { this.aborted = true; } }
  dom.window.speechSynthesis = { cancel() { cancels++; }, getVoices() { return []; }, speak(utterance) { utterances.push(utterance); utterance.onstart?.(); } };
  dom.window.SpeechSynthesisUtterance = Speech;
  dom.window.SpeechRecognition = Recognition;
  dom.window.URL.createObjectURL = (blob) => { downloads.push(blob); return 'blob:test'; };
  dom.window.URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = function() {};
  Object.assign(dom.window, { SCENES, createSession, startSession, chooseReply, parseVoiceChoice, exportSession });
  const source = (await readFile(new URL('../public/open-channel/app.mjs', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
  vm.runInContext(source, dom.getInternalVMContext());
  return { dom, $: id => dom.window.document.getElementById(id), utterances, recognitions, downloads, cancels: () => cancels };
}
test('switching scenes retains each session and notes, with no accidental HTML rendering', async () => {
  const c = await controller(); const { $, dom } = c;
  $('start').click(); $('choices').children[0].click(); const line = $('line').textContent;
  $('note').value = '<img src=x onerror=alert(1)>'; $('note').dispatchEvent(new dom.window.Event('input'));
  $('channel-list').children[1].click(); assert.equal($('conversation').hidden, true);
  $('start').click(); $('channel-list').children[0].click();
  assert.equal($('line').textContent, line); assert.equal($('note').value, '<img src=x onerror=alert(1)>');
  $('save').click(); assert.equal(c.downloads.length, 1);
  $('restart').click(); assert.equal($('transcript').children.length, 1); assert.ok($('note').value.includes('<img'));
  dom.window.close();
});
test('late speech callbacks cannot corrupt a new scene and narration stops on a choice', async () => {
  const c = await controller(); const { $, dom } = c;
  $('start').click(); $('narration').click(); const old = c.utterances[0]; const oldEnd = old.onend;
  assert.ok($('console').classList.contains('speaking'));
  $('choices').children[0].click(); assert.equal(c.utterances.length, 2);
  oldEnd(); assert.ok($('console').classList.contains('speaking'));
  $('channel-list').children[1].click(); old.onstart();
  assert.equal($('console').classList.contains('speaking'), false);
  assert.equal($('status').textContent, 'READY TO TUNE IN');
  dom.window.close();
});
test('microphone cancellation rejects stale recognition results and denied permission is recoverable', async () => {
  const c = await controller(); const { $, dom } = c;
  $('start').click(); $('mic').click(); const first = c.recognitions[0]; const stale = first.onresult;
  $('channel-list').children[1].click(); stale({ results: [[{ transcript: 'one' }]] });
  assert.equal($('conversation').hidden, true); assert.equal(first.aborted, true);
  $('start').click(); $('mic').click(); c.recognitions[1].onerror({ error: 'not-allowed' });
  assert.match($('mic-status').textContent, /declined/); assert.equal($('mic').disabled, false);
  $('mic').click(); c.recognitions[2].onresult({ results: [[{ transcript: 'number two' }]] });
  assert.equal($('transcript').children.length, 3);
  dom.window.close();
});
