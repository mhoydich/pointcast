import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../src/pages/dao.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'DAO local-choice script exists');
function page(initial, blocked = false) {
  const dom = new JSDOM('<button data-proposal="PC-0001" data-vote="FOR">For</button><button data-proposal="PC-0001" data-vote="AGAINST">Against</button><p data-vote-status="PC-0001"></p><p id="dao-storage-status"></p>', { url: 'https://example.test/dao/', runScripts: 'outside-only' });
  if (initial) dom.window.localStorage.setItem('pc:dao:votes', JSON.stringify(initial));
  if (blocked) dom.window.Storage.prototype.setItem = () => { throw new Error('storage blocked'); };
  dom.window.eval(script);
  return dom;
}

test('local choice can be changed and cleared without a wallet, preserving other saved records', () => {
  const old = { 'PC-0002': { vote: 'FOR', address: 'example-old-address' } };
  const dom = page(old);
  const buttons = dom.window.document.querySelectorAll('button');
  buttons[0].click();
  let saved = JSON.parse(dom.window.localStorage.getItem('pc:dao:votes'));
  assert.equal(saved['PC-0001'].vote, 'FOR');
  assert.equal(saved['PC-0001'].address, undefined);
  assert.deepEqual(saved['PC-0002'], old['PC-0002']);
  buttons[1].click();
  assert.match(dom.window.document.querySelector('[data-vote-status]').textContent, /AGAINST/);
  buttons[1].click();
  saved = JSON.parse(dom.window.localStorage.getItem('pc:dao:votes'));
  assert.equal(saved['PC-0001'], undefined);
  assert.deepEqual(saved['PC-0002'], old['PC-0002']);
  dom.window.close();
});

test('blocked storage reports that the choice was not saved', () => {
  const dom = page(null, true);
  dom.window.document.querySelector('button').click();
  assert.match(dom.window.document.getElementById('dao-storage-status').textContent, /not saved/);
  assert.equal(dom.window.document.querySelector('[data-vote-status]').textContent, 'NO LOCAL CHOICE');
  dom.window.close();
});
