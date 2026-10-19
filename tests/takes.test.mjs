import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { setTimeout as schedule, clearTimeout as unschedule } from 'node:timers';
import { JSDOM } from 'jsdom';
import {
  parseDoc, serializeDoc, blockTokens, flatTakes, setTakeActive, addTakeOption, removeTakeOption, flattenTake,
  promoteTake, wrapTake, wrapDim, unwrapDimAt, cutRange, sentenceBounds, rangeIsClean, sourceRangeIsInline, docStats, cleanMarkdown, SAMPLE_DOC,
} from '../src/scripts/takes-core.mjs';
import { TakesAudio, SCALES } from '../src/scripts/takes-audio.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Takes Markdown round-trips the sample exactly', () => {
  const doc = parseDoc(SAMPLE_DOC);
  assert.equal(serializeDoc(doc), SAMPLE_DOC);
  assert.equal(doc.overflow.length, 2);
  const para = doc.blocks.find(b => b.versions.length > 1);
  assert.equal(para.versions.length, 3);
  assert.equal(para.active, 1);
});

test('inline takes cycle, return to original and keep the chosen one', () => {
  const src = 'The sand was {{shining | glassy | >wet}} today.';
  const [tok] = flatTakes(blockTokens(src).tokens);
  assert.deepEqual(tok.options, ['shining', 'glassy', 'wet']);
  assert.equal(tok.active, 2);
  assert.equal(setTakeActive(src, 0, 0), 'The sand was {{shining | glassy | wet}} today.');
  assert.equal(setTakeActive(src, 0, 3), 'The sand was {{shining | glassy | wet}} today.', 'wraps around');
  assert.equal(addTakeOption(src, 0, 'bright | {x}'), 'The sand was {{shining | glassy | wet | >bright x}} today.');
  assert.equal(removeTakeOption(src, 0, 2), 'The sand was {{shining | glassy}} today.');
  assert.equal(removeTakeOption('a {{b | >c}} d', 0, 1), 'a b d');
  assert.equal(flattenTake(src, 0), 'The sand was wet today.');
  assert.equal(promoteTake(src, 0), 'The sand was {{wet | shining | glassy}} today.');
});

test('selections wrap only when they do not cut through tokens', () => {
  const src = 'One two ((three four)) five {{six | seven}}.';
  assert.equal(wrapTake(src, 0, 3, 'Uno'), '{{One | >Uno}} two ((three four)) five {{six | seven}}.');
  assert.equal(rangeIsClean(src, 4, 12), false, 'cuts into the dim');
  assert.equal(rangeIsClean(src, 10, 15), true, 'inside the dim is fine');
  assert.equal(wrapDim(src, 0, 7), '((One two)) ((three four)) five {{six | seven}}.');
  assert.equal(unwrapDimAt(src, 10), 'One two three four five {{six | seven}}.');
  assert.deepEqual(cutRange('Keep this, drop that.', 10, 20), { src: 'Keep this,.', cut: 'drop that' });
});

test('sentence bounds treat takes as opaque', () => {
  const src = 'First one. {{A take. | Another.}} still going. Last.';
  const [a, b] = sentenceBounds(src, src.indexOf('still'));
  assert.equal(src.slice(a, b), '{{A take. | Another.}} still going.');
  const [c, d] = sentenceBounds(src, src.indexOf('Last'));
  assert.equal(src.slice(c, d), 'Last.');
});

test('stats and clean export use only the chosen takes', () => {
  const doc = parseDoc('# T\n\nA {{b | >c}} d ((e)).\n\n--- overflow ---\n\ncut');
  const st = docStats(doc);
  assert.equal(st.takes, 1);
  assert.equal(st.overflow, 1);
  assert.equal(cleanMarkdown(doc), '# T\n\nA c d e.\n');
  assert.equal(cleanMarkdown(doc, { keepDim: false }), '# T\n\nA c d .\n');
});

test('alternates ring higher than the original', () => {
  const audio = new TakesAudio({ scale: 'pentatonic', root: 0, octave: 0 });
  const original = audio.takeFreq(0);
  for (let i = 1; i <= 8; i++) assert.ok(audio.takeFreq(i) > original * 2);
  assert.ok(audio.takeFreq(2) > audio.takeFreq(1));
  assert.ok(Object.keys(SCALES).length >= 5);
});

test('page is wired, isolated and honest about storage', async () => {
  const page = await read('src/pages/takes.astro');
  assert.match(page, /immersive isolated/);
  assert.match(page, /Not affiliated/);
  assert.match(page, /Nothing is uploaded/);
  const json = await read('src/pages/takes.json.ts');
  assert.match(json, /ai: false/);
  for (const file of ['src/lib/pointcast-apps.ts', 'src/data/agent-surfaces.ts', 'src/pages/sitemap-discovery.xml.ts', 'public/llms.txt', 'src/pages/for-agents.astro']) {
    assert.match(await read(file), /pointcast\.xyz\/takes\/|href="\/takes\/"/, file);
  }
});

// Exercise the real event handlers. Keep each DOM and its pending timers isolated
// so a debounced save from one desk cannot write into the next desk's storage.
async function bootDesk(t, md) {
  const html = await read('src/pages/takes.astro');
  const markup = html.slice(html.indexOf('<div class="tk"'), html.lastIndexOf('<script>'));
  const plain = markup.replace(/\{[A-Za-z][^{}]*?\.map\([\s\S]*?\)\}/g, '').replace(/\{'([^']*)'\}/g, '$1').replace(/\{`[\s\S]*?`\}/g, '');
  const dom = new JSDOM(`<!doctype html><body>${plain}</body>`, { pretendToBeVisual: true, url: 'https://pointcast.xyz/takes/' });
  const { window } = dom;
  const timers = new Set();
  const later = (fn, ms, ...args) => {
    const id = schedule(() => { timers.delete(id); fn(...args); }, ms);
    timers.add(id);
    return id;
  };
  const downloads = [], copies = [];
  const globals = {
    window, document: window.document, localStorage: window.localStorage,
    getComputedStyle: window.getComputedStyle, requestAnimationFrame: fn => later(fn, 0),
    Element: window.Element, confirm: () => true,
    setTimeout: later, clearTimeout: id => { timers.delete(id); unschedule(id); },
    URL: { createObjectURL: blob => { downloads.push(blob); return 'blob:takes-test'; }, revokeObjectURL() {} },
    navigator: { clipboard: { writeText: async text => { copies.push(text); } } },
  };
  const descriptors = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  window.HTMLAnchorElement.prototype.click = function () {}; // capture Blob, without navigating JSDOM
  window.Range.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, bottom: 20, width: 100, height: 20 });
  const { initTakes, STORAGE_KEY } = await import('../src/scripts/takes.mjs');
  if (md !== undefined) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ md }));
  const root = window.document.querySelector('[data-takes]');
  const app = initTakes(root);
  t.after(() => {
    root.remove();
    for (const id of timers) unschedule(id);
    dom.window.close();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const $ = selector => root.querySelector(selector);
  const click = selector => { const el = typeof selector === 'string' ? $(selector) : selector; assert.ok(el, `click target: ${selector}`); el.click(); };
  const key = (el, value, options = {}) => {
    const event = new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options });
    el.dispatchEvent(event);
    return event;
  };
  const edit = (b, text) => {
    click(`.tk-block[data-b="${b}"] [data-act="edit"]`);
    const input = $('[data-inline]');
    input.value = text;
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    return input;
  };
  const selectText = (span, start = 0, end = span.textContent.length) => {
    const range = window.document.createRange();
    range.setStart(span.firstChild, start); range.setEnd(span.firstChild, end);
    window.getSelection().removeAllRanges(); window.getSelection().addRange(range);
  };
  return { app, root, window, $, click, key, edit, selectText, downloads, copies, STORAGE_KEY };
}

test('the desk boots in a DOM and auditions a take with the keyboard', async t => {
  const { app, $, key } = await bootDesk(t);
  assert.equal(document.querySelectorAll('.tk-take').length, 3);
  const take = $('.tk-take');
  take.focus(); key(take, 'ArrowRight');
  const first = flatTakes(blockTokens(app.state.doc.blocks[1].versions[0]).tokens)[0];
  assert.equal(first.active, 0, 'wet and bright (take 3) wraps to the original');
  assert.match($('[data-source]').value, /\{\{shining \| glassy \| wet and bright\}\}/);
});

test('exports and copies include pending inline edits before the blur timer', async t => {
  const { app, click, edit, downloads, copies } = await bootDesk(t, '# Draft\n\nOld paragraph.');
  edit(1, 'Fresh {{original | >chosen}} paragraph.');
  click('[data-act="save-md"]');
  assert.equal(await downloads[0].text(), '# Draft\n\nFresh {{original | >chosen}} paragraph.\n');
  assert.equal(app.state.editing, null);
  edit(1, 'Newest {{original | >chosen}} paragraph.');
  click('[data-act="save-clean"]');
  assert.equal(await downloads[1].text(), '# Draft\n\nNewest chosen paragraph.\n');
  edit(1, 'Copied edits.');
  click('[data-act="copy-md"]');
  assert.equal(copies[0], '# Draft\n\nCopied edits.\n');
});

test('a paragraph action keeps inline edits and targets the same block after a split', async t => {
  const { app, $, click, edit } = await bootDesk(t, '# Draft\n\nFirst.\n\nTarget.');
  const targetId = app.state.doc.blocks[2].id;
  edit(1, 'Revised first.\n\nInserted paragraph.');
  click('.tk-block[data-b="2"] [data-act="add-version"]');
  assert.deepEqual(app.state.doc.blocks.map(b => b.versions[0]), ['# Draft', 'Revised first.', 'Inserted paragraph.', 'Target.']);
  assert.equal(app.state.doc.blocks[3].id, targetId);
  assert.deepEqual(app.state.doc.blocks[3].versions, ['Target.', 'Target.']);
  assert.equal(app.state.doc.blocks[3].active, 1);
  assert.equal(app.state.editing, 3);
  assert.equal($('[data-inline]').value, 'Target.');
});

test('an action on a later take survives removal of the edited paragraph', async t => {
  const { app, click, edit } = await bootDesk(t, '# Draft\n\nRemove me.\n\nA {{b | >c}} d.');
  edit(1, '');
  click('.tk-block[data-b="2"] .tk-take');
  assert.equal(app.state.doc.blocks.length, 2);
  click('[data-act="pick"][data-i="0"]');
  assert.equal(app.state.doc.blocks[1].versions[0], 'A {{b | c}} d.');
});

test('pagehide synchronously saves pending inline text without waiting for debounce', async t => {
  const { app, edit, window, STORAGE_KEY } = await bootDesk(t, '# Draft\n\nOld paragraph.');
  edit(1, 'Kept through reload.\n\nSecond paragraph.');
  window.dispatchEvent(new window.Event('pagehide'));
  const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  assert.equal(saved.md, '# Draft\n\nKept through reload.\n\nSecond paragraph.\n');
  assert.deepEqual(Object.keys(saved).sort(), ['audio', 'md', 'style'], 'persistence format is unchanged');
  assert.equal(serializeDoc(parseDoc(saved.md)), serializeDoc(app.state.doc));
});

test('Escape cancels inline changes, while Enter keeps them in the active version', async t => {
  const md = '# Draft\n\n::: takes\nOriginal.\n+++ >\nAlternate.\n:::\n';
  const { app, edit, key, window, STORAGE_KEY } = await bootDesk(t, md);
  key(edit(1, 'Canceled text.'), 'Escape');
  window.dispatchEvent(new window.Event('pagehide'));
  assert.equal(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).md, md);
  key(edit(1, 'Kept text.\n\nStill the same version.'), 'Enter');
  assert.deepEqual(app.state.doc.blocks[1].versions, ['Original.', 'Kept text.\n\nStill the same version.']);
  assert.equal(app.state.doc.blocks[1].active, 1);
  assert.equal(app.state.doc.blocks.length, 2, 'multi-version paragraphs do not split');
});

test('moving into source mode keeps the inline draft before source input', async t => {
  const { app, $, click, edit, window } = await bootDesk(t, '# Draft\n\nOld.');
  click('[data-mode="split"]');
  edit(1, 'Inline revision.');
  const source = $('[data-source]');
  source.focus();
  assert.match(source.value, /Inline revision/);
  source.value += '\nSource addition.';
  source.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.match(serializeDoc(app.state.doc), /Inline revision\.\n\nSource addition\./);
});

test('new take wrapping refuses existing alternatives but dim and stash preserve them', () => {
  const src = 'A {{b | >c}} d.';
  assert.equal(wrapTake(src, 0, src.length, 'Another sentence.'), src);
  const nestedInDim = 'A ((quiet {{b | >c}} words)) d.';
  assert.equal(wrapTake(nestedInDim, 0, nestedInDim.length, 'Another.'), nestedInDim);
  assert.equal(wrapDim(src, 0, src.length), `((${src}))`);
  assert.equal(cutRange(src, 0, src.length).cut, src);
});

test('sentence and source controls reject nested takes without changing the draft', async t => {
  const md = '# Draft\n\nA {{b | >c}} d.\n';
  const { app, $, click, selectText } = await bootDesk(t, md);
  selectText($('.tk-block[data-b="1"] .tk-t:last-child'), 1, 2);
  click('[data-act="sel-sentence"]');
  assert.equal($('[data-take-form]').hidden, true);
  assert.equal(serializeDoc(app.state.doc), md);
  const source = $('[data-source]');
  source.focus(); source.setSelectionRange(md.indexOf('A '), md.length - 1);
  click('[data-act="src-take"]');
  assert.equal(source.value, md);
  assert.equal(serializeDoc(app.state.doc), md);
});

test('source Stash is one undoable and redoable operation on a restored draft', async t => {
  const md = 'Move these words.\n\nKeep this paragraph.\n';
  const { app, $, click } = await bootDesk(t, md);
  const source = $('[data-source]');
  source.focus(); source.setSelectionRange(0, 'Move these words.'.length);
  click('[data-act="src-stash"]');
  assert.deepEqual(app.state.doc.overflow, ['Move these words.']);
  assert.equal(app.state.undo.length, 1);
  const stashed = serializeDoc(app.state.doc);
  click('[data-act="undo"]');
  assert.equal(serializeDoc(app.state.doc), md);
  click('[data-act="redo"]');
  assert.equal(serializeDoc(app.state.doc), stashed);
});

test('alternate text inputs keep native undo while document undo still works', async t => {
  const md = '# Draft\n\nA {{b | >c}} d.\n';
  const { app, root, $, click, key, edit, selectText } = await bootDesk(t, md);
  key(edit(1, 'Revised A {{b | >c}} d.'), 'Enter');
  const changed = serializeDoc(app.state.doc);
  assert.notEqual(changed, md);
  click('.tk-take');
  const popInput = $('[data-add-option] input');
  popInput.focus(); popInput.value = 'A typed alternative';
  assert.equal(key(popInput, 'z', { ctrlKey: true }).defaultPrevented, false);
  assert.equal(serializeDoc(app.state.doc), changed);
  click('[data-act="close-pop"]');
  selectText($('.tk-block[data-b="1"] .tk-t:last-child'), 1, 2);
  click('[data-act="sel-take"]');
  const newInput = $('[data-take-form] input');
  newInput.value = 'Replacement';
  assert.equal(key(newInput, 'z', { metaKey: true }).defaultPrevented, false);
  assert.equal(serializeDoc(app.state.doc), changed);
  key(newInput, 'Escape');
  assert.equal(key(root, 'z', { metaKey: true }).defaultPrevented, true);
  assert.equal(serializeDoc(app.state.doc), md);
});


test('source Take rejection preserves raw text, selection and both history stacks', async t => {
  const md = '# Draft\n\nA {{b | >c}} d.\n';
  const { app, $, click, edit, key } = await bootDesk(t, md);
  key(edit(1, 'A later revision.'), 'Enter');
  click('[data-act="undo"]');
  assert.equal(app.state.redo.length, 1, 'fixture has a pending redo');
  const source = $('[data-source]');
  const raw = '# Draft\n\nA {{b | >c}} d.  \n\n';
  source.value = raw;
  assert.equal(serializeDoc(parseDoc(raw)), md, 'raw formatting describes the current model');
  const before = serializeDoc(app.state.doc);
  const undo = [...app.state.undo], redo = [...app.state.redo];
  const tokenStart = raw.indexOf('{{'), tokenEnd = raw.indexOf('}}') + 2;
  for (const [start, end] of [[raw.indexOf('b |'), raw.indexOf('b |') + 1], [tokenStart, tokenEnd], [raw.indexOf('A '), raw.length]]) {
    source.focus(); source.setSelectionRange(start, end);
    click('[data-act="src-take"]');
    assert.equal(source.value, raw, 'rejection must not normalize spacing or trailing newlines');
    assert.deepEqual([source.selectionStart, source.selectionEnd], [start, end]);
    assert.equal(serializeDoc(app.state.doc), before);
    assert.deepEqual(app.state.undo, undo);
    assert.deepEqual(app.state.redo, redo);
  }
});

test('source Dim and Stash preserve a complete existing take token', async t => {
  const md = 'A {{b | >c}} d.\n';
  const { app, $, click } = await bootDesk(t, md);
  const source = $('[data-source]');
  const token = '{{b | >c}}';
  const selectToken = () => {
    const start = source.value.indexOf(token);
    source.focus(); source.setSelectionRange(start, start + token.length);
  };
  selectToken(); click('[data-act="src-dim"]');
  assert.equal(serializeDoc(app.state.doc), 'A (({{b | >c}})) d.\n');
  assert.deepEqual(flatTakes(blockTokens(app.state.doc.blocks[0].versions[0]).tokens)[0].options, ['b', 'c']);
  click('[data-act="undo"]');
  selectToken(); click('[data-act="src-stash"]');
  assert.deepEqual(app.state.doc.overflow, [token]);
  assert.equal(app.state.doc.blocks[0].versions[0], 'A  d.');
});

test('consecutive source Stashes have separate undo steps and a new Stash clears redo', async t => {
  const md = 'First.\n\nSecond.\n\nThird.\n';
  const { app, $, click } = await bootDesk(t, md);
  const source = $('[data-source]');
  const stash = text => {
    const start = source.value.indexOf(text);
    source.focus(); source.setSelectionRange(start, start + text.length);
    click('[data-act="src-stash"]');
  };
  stash('First.');
  const first = serializeDoc(app.state.doc);
  stash('Second.');
  const second = serializeDoc(app.state.doc);
  assert.deepEqual(app.state.doc.overflow, ['Second.', 'First.']);
  assert.equal(app.state.undo.length, 2);
  click('[data-act="undo"]'); assert.equal(serializeDoc(app.state.doc), first);
  click('[data-act="undo"]'); assert.equal(serializeDoc(app.state.doc), md);
  click('[data-act="redo"]'); assert.equal(serializeDoc(app.state.doc), first);
  assert.deepEqual(app.state.redo, [second]);
  stash('Third.');
  assert.deepEqual(app.state.doc.overflow, ['Third.', 'First.']);
  assert.equal(app.state.redo.length, 0);
  click('[data-act="undo"]'); assert.equal(serializeDoc(app.state.doc), first);
});

test('source typing batches do not cross an explicit Stash or history restore', async t => {
  const md = 'Move this.\n\nKeep.\n';
  const { app, $, click, window } = await bootDesk(t, md);
  const source = $('[data-source]');
  const typeSource = value => {
    source.focus(); source.value = value;
    source.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  typeSource(source.value.replace('Move this.', 'Move new words.'));
  typeSource(source.value.replace('Move new words.', 'Move revised words.'));
  const beforeStash = serializeDoc(app.state.doc);
  assert.equal(app.state.undo.length, 1, 'successive source input events share one batch');
  source.setSelectionRange(0, 'Move revised words.'.length);
  click('[data-act="src-stash"]');
  const afterStash = serializeDoc(app.state.doc);
  typeSource(source.value.replace('Keep.', 'Keep edited.'));
  assert.equal(app.state.undo.length, 3, 'typing after the compound Stash starts a new batch');
  click('[data-act="undo"]'); assert.equal(serializeDoc(app.state.doc), afterStash);
  click('[data-act="undo"]'); assert.equal(serializeDoc(app.state.doc), beforeStash);
  click('[data-act="undo"]'); assert.equal(serializeDoc(app.state.doc), md);
  typeSource(source.value.replace('Keep.', 'A new edit after undo.'));
  assert.equal(app.state.undo.length, 1);
  assert.equal(app.state.redo.length, 0, 'a new edit after Undo invalidates redo');
  click('[data-act="undo"]'); assert.equal(serializeDoc(app.state.doc), md);
});

test('take options receive focus when opened and Escape returns it from buttons or inputs', async t => {
  const { $, click, key, window } = await bootDesk(t, 'A {{b | >c}} d.\n');
  const pop = $('[data-pop]');
  const take = () => $('.tk-take');
  take().focus(); key(take(), 'Enter');
  assert.equal(pop.hidden, false);
  assert.equal(window.document.activeElement, pop.querySelector('[data-act="pick"][data-i="1"]'));
  assert.equal(key(window.document.activeElement, 'Escape').defaultPrevented, true);
  assert.equal(pop.hidden, true);
  assert.equal(window.document.activeElement, take());
  click(take());
  assert.equal(window.document.activeElement, pop.querySelector('[data-act="pick"][data-i="1"]'));
  const input = pop.querySelector('input');
  input.focus(); input.value = 'Unsubmitted alternative';
  assert.equal(key(input, 'Escape').defaultPrevented, true);
  assert.equal(pop.hidden, true);
  assert.equal(window.document.activeElement, take());
  assert.equal(take().dataset.count, '2', 'Escape does not submit the alternate input');
  key(take(), 'ArrowLeft');
  assert.equal(take().dataset.active, '0', 'closed-dialog audition shortcuts still work');
  click(take());
  click('[data-act="pick"][data-i="1"]');
  assert.equal(window.document.activeElement, pop.querySelector('[data-act="pick"][data-i="1"]'), 'focus survives the audition render');
  click('[data-act="close-pop"]');
  assert.equal(pop.hidden, true);
  assert.equal(window.document.activeElement, take());
});


test('keyboard activation of a paragraph tool keeps its target until the native click', async t => {
  for (const activation of ['Enter', ' ']) {
    await t.test(activation === ' ' ? 'Space' : activation, async t => {
      const { app, $, click, edit, key } = await bootDesk(t, 'First.\n\nTarget.\n');
      const targetId = app.state.doc.blocks[1].id;
      edit(0, 'Revised first.\n\nInserted.');
      const button = $('.tk-block[data-b="1"] [data-act="add-version"]');
      button.focus();
      assert.equal(key(button, 'Tab').defaultPrevented, false);
      assert.equal(button.isConnected, true, 'Tab must not replace the focused paragraph tool');
      assert.equal(document.activeElement, button);
      assert.equal(key(button, activation).defaultPrevented, false);
      assert.equal(button.isConnected, true, 'native activation still needs a connected button');
      click(button); // JSDOM does not synthesize the browser default keyboard click.
      assert.equal(app.state.doc.blocks[2].id, targetId);
      assert.deepEqual(app.state.doc.blocks[2].versions, ['Target.', 'Target.']);
      assert.equal(app.state.editing, 2);
      assert.equal(app.state.doc.blocks[0].versions[0], 'Revised first.');
    });
  }
});


test('source Take cannot wrap paragraph boundaries or structural marker fragments', async t => {
  const md = '# Audit\n\n::: takes\nOriginal paragraph.\n+++ >\nChosen paragraph.\n:::\n\nFirst paragraph.\n\nSecond paragraph.\n\n--- overflow ---\n\nStashed paragraph.\n';
  const { app, $, click, edit, key } = await bootDesk(t, md);
  key(edit(0, '# Audit one'), 'Enter');
  key(edit(0, '# Audit two'), 'Enter');
  click('[data-act="undo"]');
  assert.equal(app.state.undo.length, 1);
  assert.equal(app.state.redo.length, 1);
  const source = $('[data-source]');
  const raw = source.value.replace('First paragraph.', 'First paragraph.  ').replace('\n\nSecond', '\n \nSecond') + '\n';
  source.value = raw;
  const before = serializeDoc(app.state.doc);
  assert.equal(serializeDoc(parseDoc(raw)), before);
  const undo = [...app.state.undo], redo = [...app.state.redo];
  const open = raw.indexOf('::: takes'), sep = raw.indexOf('+++ >'), close = raw.indexOf(':::', open + 3);
  const overflow = raw.indexOf('--- overflow ---');
  const original = raw.indexOf('Original'), chosen = raw.indexOf('Chosen');
  const ranges = [
    ['whole paragraph-take block', open, close + 3],
    ['partial opening fence', open + 1, open + 6],
    ['partial version separator', sep + 1, sep + 4],
    ['partial closing fence', close + 1, close + 3],
    ['across paragraph versions', original, chosen + 'Chosen'.length],
    ['newline before a separator', original, sep],
    ['newline after an opening fence', open + '::: takes'.length, original + 'Original'.length],
    ['blank-line paragraph boundary', raw.indexOf('First'), raw.indexOf('Second') + 'Second paragraph.'.length],
    ['whole overflow boundary', raw.indexOf('Second'), raw.indexOf('Stashed') + 'Stashed'.length],
    ['partial overflow marker', overflow + 4, overflow + 12],
    ['newline before overflow', raw.indexOf('Second'), overflow],
  ];
  for (const [label, start, end] of ranges) {
    for (const activation of ['toolbar', 'shortcut']) {
      source.focus(); source.setSelectionRange(start, end);
      if (activation === 'toolbar') click('[data-act="src-take"]');
      else assert.equal(key(source, '1', { altKey: true, code: 'Digit1' }).defaultPrevented, true);
      assert.equal(source.value, raw, `${label}: ${activation} preserves exact source`);
      assert.deepEqual([source.selectionStart, source.selectionEnd], [start, end]);
      assert.equal(serializeDoc(app.state.doc), before, `${label}: ${activation} preserves model`);
      assert.deepEqual(app.state.undo, undo);
      assert.deepEqual(app.state.redo, redo);
      assert.deepEqual(app.state.doc.blocks[1].versions, ['Original paragraph.', 'Chosen paragraph.']);
      assert.equal(app.state.doc.blocks[1].active, 1);
    }
  }
});

test('source Take still works within either paragraph version and keeps version selection', async t => {
  const md = '::: takes\nOriginal paragraph.\n+++ >\nChosen paragraph.\n:::\n';
  const { app, $, click, key } = await bootDesk(t, md);
  const source = $('[data-source]');
  for (const text of ['Original', 'Chosen']) {
    const start = source.value.indexOf(text);
    source.focus(); source.setSelectionRange(start, start + text.length);
    if (text === 'Original') click('[data-act="src-take"]');
    else key(source, '1', { altKey: true, code: 'Digit1' });
    assert.equal(app.state.doc.blocks.length, 1);
    assert.equal(app.state.doc.blocks[0].versions.length, 2);
    assert.equal(app.state.doc.blocks[0].active, 1);
  }
  assert.deepEqual(app.state.doc.blocks[0].versions, ['{{Original | }} paragraph.', '{{Chosen | }} paragraph.']);
});

test('source inline boundary guard allows soft lines but protects heading structure', () => {
  const soft = 'First line\nsecond line.';
  assert.equal(sourceRangeIsInline(soft, 0, soft.length), true);
  const heading = '# Heading\nParagraph.';
  assert.equal(sourceRangeIsInline(heading, 2, 'Heading'.length + 2), true);
  assert.equal(sourceRangeIsInline(heading, 0, 'Heading'.length + 2), false, 'heading marker stays outside the take');
  assert.equal(sourceRangeIsInline(heading, 2, heading.length), false, 'heading and following paragraph are separate blocks');
});


test('source Dim rejects structural ranges without changing raw source or history', async t => {
  const md = '# Audit\n\n::: takes\nOriginal paragraph.\n+++ >\nChosen paragraph.\n:::\n\nFirst paragraph.\n\nSecond paragraph.\n\n--- overflow ---\n\nStashed paragraph.\n';
  const { app, $, click, edit, key } = await bootDesk(t, md);
  key(edit(0, '# Audit one'), 'Enter');
  key(edit(0, '# Audit two'), 'Enter');
  click('[data-act="undo"]');
  const source = $('[data-source]');
  const raw = source.value.replace('First paragraph.', 'First paragraph.  ') + '\n';
  source.value = raw;
  const before = serializeDoc(app.state.doc);
  const undo = [...app.state.undo], redo = [...app.state.redo];
  assert.equal(undo.length, 1); assert.equal(redo.length, 1);
  const open = raw.indexOf('::: takes'), sep = raw.indexOf('+++ >'), close = raw.indexOf(':::', open + 3);
  const overflow = raw.indexOf('--- overflow ---');
  const ranges = [
    [open, close + 3], [open + 1, open + 6], [sep + 1, sep + 4], [close + 1, close + 3],
    [raw.indexOf('Original'), sep],
    [raw.indexOf('First'), raw.indexOf('Second') + 'Second paragraph.'.length],
    [raw.indexOf('Second'), raw.indexOf('Stashed') + 'Stashed'.length],
    [overflow + 4, overflow + 12],
  ];
  for (const [start, end] of ranges) {
    for (const activation of ['toolbar', 'shortcut']) {
      source.focus(); source.setSelectionRange(start, end);
      if (activation === 'toolbar') click('[data-act="src-dim"]');
      else assert.equal(key(source, '2', { altKey: true, code: 'Digit2' }).defaultPrevented, true);
      assert.equal(source.value, raw);
      assert.deepEqual([source.selectionStart, source.selectionEnd], [start, end]);
      assert.equal(serializeDoc(app.state.doc), before);
      assert.deepEqual(app.state.undo, undo); assert.deepEqual(app.state.redo, redo);
      assert.deepEqual(app.state.doc.blocks[1].versions, ['Original paragraph.', 'Chosen paragraph.']);
      assert.equal(app.state.doc.blocks[1].active, 1);
    }
  }
});

test('source Dim works inside a paragraph version and retains full inline alternatives', async t => {
  const md = '::: takes\nOriginal paragraph.\n+++ >\nChosen {{one | >two}} paragraph.\n:::\n';
  const { app, $, click, key } = await bootDesk(t, md);
  const source = $('[data-source]');
  let start = source.value.indexOf('Original');
  source.focus(); source.setSelectionRange(start, start + 'Original'.length);
  click('[data-act="src-dim"]');
  const token = '{{one | >two}}';
  start = source.value.indexOf(token);
  source.focus(); source.setSelectionRange(start, start + token.length);
  key(source, '2', { altKey: true, code: 'Digit2' });
  assert.equal(app.state.doc.blocks.length, 1);
  assert.equal(app.state.doc.blocks[0].active, 1);
  assert.deepEqual(app.state.doc.blocks[0].versions, ['((Original)) paragraph.', 'Chosen (({{one | >two}})) paragraph.']);
  const take = flatTakes(blockTokens(app.state.doc.blocks[0].versions[1]).tokens)[0];
  assert.deepEqual(take.options, ['one', 'two']);
  assert.equal(take.active, 1);
});


test('source Stash rejects structural ranges without changing source, model or history', async t => {
  const md = '# Audit\n\n::: takes\nOriginal paragraph.\n+++ >\nChosen paragraph.\n:::\n\nFirst paragraph.\n\nSecond paragraph.\n\n--- overflow ---\n\nStashed paragraph.\n';
  const { app, $, click, edit, key } = await bootDesk(t, md);
  key(edit(0, '# Audit one'), 'Enter');
  key(edit(0, '# Audit two'), 'Enter');
  click('[data-act="undo"]');
  const source = $('[data-source]');
  const raw = source.value.replace('First paragraph.', 'First paragraph.  ') + '\n';
  source.value = raw;
  const before = serializeDoc(app.state.doc);
  const undo = [...app.state.undo], redo = [...app.state.redo];
  assert.equal(undo.length, 1); assert.equal(redo.length, 1);
  const open = raw.indexOf('::: takes'), sep = raw.indexOf('+++ >'), close = raw.indexOf(':::', open + 3);
  const overflow = raw.indexOf('--- overflow ---');
  const ranges = [
    [open, close + 3], [open + 1, open + 6], [sep + 1, sep + 4], [close + 1, close + 3],
    [raw.indexOf('Original'), sep],
    [raw.indexOf('First'), raw.indexOf('Second') + 'Second paragraph.'.length],
    [raw.indexOf('Second'), raw.indexOf('Stashed') + 'Stashed'.length],
    [overflow + 4, overflow + 12],
  ];
  for (const [start, end] of ranges) {
    for (const activation of ['toolbar', 'shortcut']) {
      source.focus(); source.setSelectionRange(start, end);
      if (activation === 'toolbar') click('[data-act="src-stash"]');
      else assert.equal(key(source, '3', { altKey: true, code: 'Digit3' }).defaultPrevented, true);
      assert.equal(source.value, raw);
      assert.deepEqual([source.selectionStart, source.selectionEnd], [start, end]);
      assert.equal(serializeDoc(app.state.doc), before);
      assert.deepEqual(app.state.undo, undo); assert.deepEqual(app.state.redo, redo);
      assert.deepEqual(app.state.doc.blocks[1].versions, ['Original paragraph.', 'Chosen paragraph.']);
      assert.equal(app.state.doc.blocks[1].active, 1);
    }
  }
});

test('valid source Stash and Put back retain chosen inline alternatives', async t => {
  const md = '::: takes\nOriginal paragraph.\n+++ >\nChosen {{one | >two}} paragraph.\n:::\n\nWhole paragraph.\n';
  const { app, $, click, key } = await bootDesk(t, md);
  const source = $('[data-source]');
  const token = '{{one | >two}}';
  let start = source.value.indexOf(token);
  source.focus(); source.setSelectionRange(start, start + token.length);
  key(source, '3', { altKey: true, code: 'Digit3' });
  assert.deepEqual(app.state.doc.overflow, [token]);
  assert.deepEqual(app.state.doc.blocks[0].versions, ['Original paragraph.', 'Chosen  paragraph.']);
  assert.equal(app.state.doc.blocks[0].active, 1);
  click('[data-act="unstash"][data-i="0"]');
  assert.deepEqual(app.state.doc.overflow, []);
  const restored = app.state.doc.blocks[1];
  const take = flatTakes(blockTokens(restored.versions[0]).tokens)[0];
  assert.deepEqual(take.options, ['one', 'two']);
  assert.equal(take.active, 1);
  assert.equal(cleanMarkdown(app.state.doc), 'Chosen paragraph.\n\ntwo\n\nWhole paragraph.\n');
  start = source.value.indexOf('Whole paragraph.');
  source.focus(); source.setSelectionRange(start, start + 'Whole paragraph.'.length);
  click('[data-act="src-stash"]');
  assert.deepEqual(app.state.doc.overflow, ['Whole paragraph.']);
  click('[data-act="unstash"][data-i="0"]');
  assert.deepEqual(app.state.doc.overflow, []);
  assert.ok(app.state.doc.blocks.some(block => block.versions[0] === 'Whole paragraph.'));
  assert.equal(app.state.doc.blocks[0].active, 1);
});


test('source Dim and Stash reject partial inline takes without modifying draft history', async t => {
  const md = '# Audit\n\nA {{original | >chosen}} d.\n';
  const { app, $, click, edit, key } = await bootDesk(t, md);
  key(edit(0, '# Audit one'), 'Enter');
  key(edit(0, '# Audit two'), 'Enter');
  click('[data-act="undo"]');
  const source = $('[data-source]');
  const raw = source.value.replace(' d.', ' d.  ') + '\n';
  source.value = raw;
  const before = serializeDoc(app.state.doc);
  const undo = [...app.state.undo], redo = [...app.state.redo];
  const open = raw.indexOf('{{'), close = raw.indexOf('}}');
  const option = raw.indexOf('chosen');
  const ranges = [[open, open + 2], [close, close + 2], [option, option + 'chosen'.length], [open, option + 2], [option, close + 2]];
  for (const kind of ['dim', 'stash']) {
    for (const [start, end] of ranges) {
      for (const activation of ['toolbar', 'shortcut']) {
        source.focus(); source.setSelectionRange(start, end);
        if (activation === 'toolbar') click(`[data-act="src-${kind}"]`);
        else key(source, kind === 'dim' ? '2' : '3', { altKey: true, code: kind === 'dim' ? 'Digit2' : 'Digit3' });
        assert.equal(source.value, raw);
        assert.deepEqual([source.selectionStart, source.selectionEnd], [start, end]);
        assert.equal(serializeDoc(app.state.doc), before);
        assert.deepEqual(app.state.undo, undo); assert.deepEqual(app.state.redo, redo);
      }
    }
  }
});

test('source Stash accepts plain text inside a dim and retains the dim boundaries', async t => {
  const { app, $, click } = await bootDesk(t, 'A ((quiet words)) d.\n');
  const source = $('[data-source]');
  const start = source.value.indexOf('quiet');
  source.focus(); source.setSelectionRange(start, start + 'quiet'.length);
  click('[data-act="src-stash"]');
  assert.equal(app.state.doc.blocks[0].versions[0], 'A (( words)) d.');
  assert.deepEqual(app.state.doc.overflow, ['quiet']);
  assert.equal(blockTokens(app.state.doc.blocks[0].versions[0]).tokens[1].t, 'dim');
});
