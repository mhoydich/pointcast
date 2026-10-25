import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { WORKSHOPS, buildOutline, getProgress } from '../public/open-channel/workshops.mjs';

async function controller({ mode = 'pitch', saved, storageFails = false } = {}) {
  const page = await readFile(new URL('../src/pages/open-channel/[mode].astro', import.meta.url), 'utf8');
  const html = page.slice(page.indexOf('<!doctype')).replace('data-workshop={workshopId}', `data-workshop="${mode}"`);
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: `https://pointcast.xyz/open-channel/${mode === 'pitch' ? 'pitch-room' : 'story-booth'}/` });
  const { window } = dom;
  const storageKey = `pointcast-open-channel-${mode}-v1`;
  if (saved !== undefined) window.sessionStorage.setItem(storageKey, typeof saved === 'string' ? saved : JSON.stringify(saved));
  if (storageFails) Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage blocked'); } });
  const utterances = [], recognitions = [], downloads = [], links = [];
  class Speech { constructor(text) { this.text = text; } }
  class Recognition { constructor() { recognitions.push(this); } start() { this.onstart?.(); } abort() { this.aborted = true; } }
  window.speechSynthesis = { cancel() {}, getVoices() { return []; }, speak(utterance) { utterances.push(utterance); utterance.onstart?.(); } };
  window.SpeechSynthesisUtterance = Speech;
  window.SpeechRecognition = Recognition;
  window.Blob = Blob;
  window.URL.createObjectURL = blob => { downloads.push(blob); return 'blob:test'; };
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function() { links.push({ download: this.download, href: this.href }); };
  let now = 0, nextTask = 0;
  const tasks = new Map();
  window.Date.now = () => now;
  window.setTimeout = (callback, delay = 0) => { const id = ++nextTask; tasks.set(id, { callback, at: now + delay, repeat: 0 }); return id; };
  window.setInterval = (callback, repeat) => { const id = ++nextTask; tasks.set(id, { callback, at: now + repeat, repeat }); return id; };
  window.clearTimeout = window.clearInterval = id => tasks.delete(id);
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, task] = next; now = task.at;
      if (task.repeat) task.at += task.repeat; else tasks.delete(id);
      task.callback();
    }
    now = end;
  }
  Object.assign(window, { WORKSHOPS, buildOutline, getProgress });
  const source = (await readFile(new URL('../public/open-channel/workshop-app.mjs', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
  vm.runInContext(source, dom.getInternalVMContext());
  const $ = id => window.document.getElementById(id);
  function type(value) { $('answer').value = value; $('answer').dispatchEvent(new window.Event('input')); }
  function dictate(transcript, isFinal = true) {
    const result = [{ transcript }]; result.isFinal = isFinal;
    return { resultIndex: 0, results: [result] };
  }
  return { dom, $, type, dictate, utterances, recognitions, downloads, links, advance, saved: () => window.sessionStorage.getItem(storageKey) };
}

test('answers and review choices survive step changes, exercise changes, and a page reload', async () => {
  const c = await controller(); const { $, dom } = c;
  assert.equal($('download').disabled, true);
  c.type('For a neighborhood shop with a crowded counter.');
  $('next').click(); c.type('A small display that makes the offer clear.');
  $('checklist').querySelector('input').click();
  $('exercise-list').children[1].click(); c.type('An evening of stories about this block.');
  $('exercise-list').children[0].click();
  assert.equal($('answer').value, 'A small display that makes the offer clear.');
  assert.equal($('checklist').querySelector('input').checked, true);
  assert.equal($('progress-label').textContent, '2 of 5 prompts answered');
  const saved = c.saved(); dom.window.close();
  const restored = await controller({ saved });
  assert.equal(restored.$('answer').value, 'A small display that makes the offer clear.');
  restored.$('previous').click(); assert.match(restored.$('answer').value, /neighborhood shop/);
  restored.$('exercise-list').children[1].click(); assert.match(restored.$('answer').value, /evening of stories/);
  restored.dom.window.close();
});

test('outline and download preserve actual user words as text, and leave unanswered sections explicit', async () => {
  const c = await controller({ mode: 'story' }); const { $, dom } = c;
  const words = '<img src=x onerror=alert(1)> A keeper wants the last seed.\nA second line.';
  c.type(words);
  assert.ok($('outline').textContent.includes(words));
  assert.equal($('outline').querySelectorAll('section > h3').length, 6);
  assert.equal($('outline').querySelector('img, script'), null);
  assert.equal($('outline').querySelector('section > p').textContent, words);
  assert.equal($('outline').querySelectorAll('.unanswered').length, 5);
  assert.match($('outline').textContent, /Not answered yet/);
  assert.equal($('progress-label').textContent, '1 of 6 prompts answered');
  $('download').click();
  assert.equal(c.downloads.length, 1);
  const download = await c.downloads[0].text();
  assert.ok(download.includes(words));
  assert.ok(download.includes('[Not answered]'));
  assert.ok(download.includes('Dessa is not connected'));
  assert.ok(download.includes('Self-reported checklist; not an automated score.'));
  assert.equal(c.links[0].download, 'open-channel-story-short-story.md');
  for (const prompt of WORKSHOPS.story.scenarios[0].prompts) assert.ok(!download.includes(prompt.placeholder));
  dom.window.close();
});

test('corrupt or unavailable browser storage cannot prevent writing; restored data stays bounded', async () => {
  const corrupt = await controller({ saved: '{broken' });
  assert.equal(corrupt.$('answer').value, ''); corrupt.type('A fresh draft.');
  assert.match(corrupt.$('outline').textContent, /A fresh draft/); corrupt.dom.window.close();
  const blocked = await controller({ storageFails: true }); blocked.type('Still writable.');
  assert.match(blocked.$('storage-status').textContent, /storage is unavailable/);
  assert.equal(blocked.$('download').disabled, false); blocked.dom.window.close();
  const bounded = await controller({ saved: { activeId: 'unknown', drafts: { offer: { index: 999, answers: { audience: 'x'.repeat(5000), offer: { unsafe: true }, unknown: 'discard me' }, checks: [true, 'true', 1] } } } });
  assert.equal(bounded.$('step-counter').textContent, '5 / 5');
  bounded.$('step-rail').children[0].click(); assert.equal(bounded.$('answer').value.length, 3000);
  const saved = JSON.parse(bounded.saved());
  assert.equal(saved.activeId, 'offer'); assert.equal(saved.drafts.offer.answers.unknown, undefined);
  assert.equal(saved.drafts.offer.answers.offer, undefined);
  assert.deepEqual(saved.drafts.offer.checks, [true, false, false, false]);
  bounded.dom.window.close();
});

test('clearing requires confirmation and removes only the selected exercise', async () => {
  const c = await controller(); const { $, dom } = c;
  c.type('First exercise stays.'); $('exercise-list').children[1].click(); c.type('Second exercise goes.');
  $('clear').click(); assert.equal($('answer').value, 'Second exercise goes.');
  $('cancel-clear').click(); assert.equal($('cancel-clear').hidden, true);
  $('clear').click(); $('clear').click();
  assert.equal($('answer').value, ''); assert.equal($('download').disabled, true);
  $('exercise-list').children[0].click(); assert.equal($('answer').value, 'First exercise stays.');
  dom.window.close();
});

test('dictation appends only final words and ignores cancelled results after a step change or error', async () => {
  const c = await controller(); const { $, dom } = c;
  c.type('A starting thought.'); $('dictate').click(); const first = c.recognitions[0];
  first.onresult(c.dictate('An unfinished phrase', false)); assert.equal($('answer').value, 'A starting thought.');
  first.onresult(c.dictate('Another thought.')); assert.equal($('answer').value, 'A starting thought. Another thought.');
  const stale = first.onresult; $('next').click();
  assert.equal(first.aborted, true); stale(c.dictate('This must not reach the next prompt.'));
  assert.equal($('answer').value, '');
  $('dictate').click(); const denied = c.recognitions[1]; denied.onerror({ error: 'not-allowed' });
  assert.match($('voice-status').textContent, /denied/); denied.onend();
  assert.match($('voice-status').textContent, /denied/);
  denied.onresult(c.dictate('Rejected late words')); assert.equal($('answer').value, '');
  $('dictate').click(); c.recognitions[2].onresult(c.dictate('A recovered answer.'));
  c.recognitions[2].onend(); assert.equal($('answer').value, 'A recovered answer.');
  assert.match($('voice-status').textContent, /Microphone is off/);
  dom.window.close();
});

test('leaving the page stops dictation and narration and prevents late callbacks from changing a new prompt', async () => {
  const c = await controller(); const { $, dom } = c;
  $('hear-prompt').click(); const previousSpeech = c.utterances[0];
  $('next').click(); $('hear-prompt').click();
  previousSpeech.onend(); assert.equal($('stop-voice').disabled, false);
  $('dictate').click(); assert.equal($('stop-voice').disabled, true);
  const capture = c.recognitions[0];
  Object.defineProperty(dom.window.document, 'hidden', { configurable: true, value: true });
  dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
  assert.equal(capture.aborted, true); capture.onresult(c.dictate('Late hidden input'));
  assert.equal($('answer').value, ''); assert.equal($('dictate').textContent, 'Start microphone');
  dom.window.close();
});

test('the rehearsal timer pauses, resumes, finishes, and resets without invoking speech capture', async () => {
  const c = await controller({ mode: 'story' }); const { $, dom } = c;
  assert.equal($('timer').textContent, '02:00');
  $('timer-toggle').click(); c.advance(1500); assert.equal($('timer').textContent, '01:59');
  $('timer-toggle').click(); c.advance(10000); assert.equal($('timer').textContent, '01:59');
  assert.equal($('timer-toggle').textContent, 'Resume timer');
  $('timer-toggle').click(); c.advance(118500);
  assert.equal($('timer').textContent, '00:00'); assert.match($('feedback').textContent, /Time is up/);
  $('timer-reset').click(); assert.equal($('timer').textContent, '02:00');
  $('timer-toggle').click(); c.advance(5000); dom.window.dispatchEvent(new dom.window.Event('pagehide'));
  const paused = $('timer').textContent; c.advance(30000); assert.equal($('timer').textContent, paused);
  assert.equal(c.recognitions.length, 0); assert.equal(c.utterances.length, 0);
  dom.window.close();
});
