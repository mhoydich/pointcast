import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('../public/nouns-money/house-cards/card.js', import.meta.url), 'utf8');

function mount(t, markup) {
  const dom = new JSDOM(markup, { runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  t.after(() => window.close());
  t.mock.timers.enable({ apis: ['setTimeout'] });
  window.setTimeout = globalThis.setTimeout;
  window.clearTimeout = globalThis.clearTimeout;

  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(target) { this.target = target; observers.push(this); }
    disconnect() { this.target = null; }
    show(ratio) {
      assert.ok(this.target, 'a connected card is being observed');
      this.callback([{ target: this.target, intersectionRatio: ratio, isIntersecting: ratio > 0 }]);
    }
  };
  window.eval(source);
  return {
    card: document.querySelector('nouns-money-house-card'), document, observers,
    tick: (ms) => t.mock.timers.tick(ms),
    visibility(hidden) {
      Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
      document.dispatchEvent(new window.Event('visibilitychange'));
    },
  };
}

const loomRows = `<nouns-money-house-card placement="loom"></nouns-money-house-card>
  <button type="button" id="room">Next room</button>`;

test('a Loom card needs seven uninterrupted seconds at half visibility in an active document', (t) => {
  const { card, document, observers, tick, visibility } = mount(t, loomRows);
  const observer = observers[0];
  observer.show(0.49);
  tick(12000);
  assert.equal(card.hidden, false);
  observer.show(0.5);
  tick(6000);
  visibility(true);
  tick(12000);
  assert.equal(card.hidden, false);
  visibility(false);
  tick(6000);
  observer.show(0);
  tick(12000);
  assert.equal(card.hidden, false);
  observer.show(1);
  tick(6999);
  assert.equal(card.hidden, false);
  tick(1);
  assert.equal(card.hidden, true);
  assert.equal(document.activeElement, document.body, 'auto-dismiss does not move keyboard focus');
});

test('keyboard focus on the card holds it open and a fresh timer begins after focus leaves', async (t) => {
  const { card, document, observers, tick } = mount(t, loomRows);
  observers[0].show(1);
  tick(6000);
  const mint = card.shadowRoot.querySelector('a');
  mint.focus();
  assert.equal(card.shadowRoot.activeElement, mint);
  tick(14000);
  assert.equal(card.hidden, false);
  document.querySelector('#room').focus();
  await Promise.resolve();
  tick(6999);
  assert.equal(card.hidden, false);
  tick(1);
  assert.equal(card.hidden, true);
  assert.equal(document.activeElement.id, 'room');
});

test('Skip immediately restores the next Loom row without activating it', (t) => {
  const { card, document } = mount(t, loomRows);
  const row = document.querySelector('#room');
  const click = t.mock.fn();
  row.addEventListener('click', click);
  const skip = card.shadowRoot.querySelector('button');
  skip.focus();
  skip.click();
  assert.equal(card.hidden, true);
  assert.equal(document.activeElement, row);
  assert.equal(click.mock.callCount(), 0);
});

for (const mode of ['interactive', 'tv-mode']) {
  test(`Battler Skip focuses the designated ${mode} control without advancing a match`, (t) => {
    const { card, document } = mount(t, `<body class="${mode}">
      <nouns-money-house-card placement="battler" data-return-focus="body.tv-mode #matchTitle, body:not(.tv-mode) #newMatchButton"></nouns-money-house-card>
      <button>Following sibling</button><h2 id="matchTitle" tabindex="-1">Round complete</h2>
      <button id="newMatchButton">New match</button></body>`);
    const startMatch = t.mock.fn();
    document.querySelector('#newMatchButton').addEventListener('click', startMatch);
    card.shadowRoot.querySelector('button').click();
    assert.equal(card.hidden, true);
    assert.equal(document.activeElement.id, mode === 'tv-mode' ? 'matchTitle' : 'newMatchButton');
    assert.equal(startMatch.mock.callCount(), 0);
  });
}

test('removing and reinserting a directory card requires a fresh view before dismissal', (t) => {
  const { card, document, observers, tick, visibility } = mount(t, loomRows);
  observers[0].show(1);
  tick(6000);
  card.remove();
  assert.equal(observers[0].target, null);
  visibility(true);
  visibility(false);
  tick(14000);
  assert.equal(card.hidden, false);
  document.body.prepend(card);
  assert.equal(observers[1].target, card);
  tick(14000);
  assert.equal(card.hidden, false);
  observers[1].show(1);
  tick(7000);
  assert.equal(card.hidden, true);
});
