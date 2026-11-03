import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('../public/chain/apps/mist-browser.js', import.meta.url), 'utf8');
const kit = pathToFileURL(new URL('../public/chain/apps/chain-kit.js', import.meta.url).pathname).href;
const deskSource = await readFile(new URL('../public/chain/receipt/desk.js', import.meta.url), 'utf8');
const receiptModel = new URL('../public/chain/receipt/model.mjs', import.meta.url).href;
const genesis = 'a'.repeat(64);
const txHash = 'c'.repeat(64);
const addr1 = 'tz1' + 'A'.repeat(33);
const addr2 = 'tz1' + 'B'.repeat(33);
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const response = (body) => ({ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify(body)});
function page() {
  return new JSDOM(`<main data-mist data-api="https://example.test" data-genesis="${genesis}" data-chain-id="devnet"><span data-status></span><span data-network></span><span data-chain></span><span data-height></span><span data-accounts></span><span data-mempool></span><button data-refresh></button><div data-activity></div><form data-account-form><input data-address></form><div data-account-result></div></main>`, {url:'https://pointcast.xyz'});
}
async function setup(fetcher) {
  const dom = page(); globalThis.document = dom.window.document; globalThis.fetch = fetcher;
  await import(`data:text/javascript;base64,${Buffer.from(source.replace("'./chain-kit.js'", JSON.stringify(kit))).toString('base64')}#${Math.random()}`);
  await tick(); await tick(); return dom;
}
const status = (g = genesis) => ({chain_id:'devnet',genesis_hash:g,height:3,accounts:2,mempool:0});
const feed = {blocks:[{height:2,txs:[{hash:txHash,kind:'post',sender:'alice',payload:{title:'<img src=x onerror=alert(1)>'}}]}]};

test('reads pinned data safely and latest account lookup wins', async () => {
  let release;
  const dom = await setup(async (url) => {
    if (url.endsWith('/status')) return response(status());
    if (url.includes('/feed?')) return response(feed);
    if (url.endsWith(addr1)) return await new Promise((r) => { release = () => r(response({address:addr1,exists:true,balance:1,next_nonce:1})); });
    if (url.endsWith(addr2)) return response({address:addr2,exists:true,balance:2,next_nonce:2});
    throw new Error('unexpected path');
  });
  assert.equal(dom.window.document.querySelector('[data-height]').textContent, '3');
  assert.equal(dom.window.document.querySelector('[data-activity] img'), null);
  const input=dom.window.document.querySelector('[data-address]'); const form=dom.window.document.querySelector('form');
  input.value=addr1; form.dispatchEvent(new dom.window.Event('submit',{cancelable:true})); await tick();
  input.value=addr2; form.dispatchEvent(new dom.window.Event('submit',{cancelable:true})); await tick(); await tick();
  release(); await tick(); await tick();
  assert.match(dom.window.document.querySelector('[data-account-result]').textContent, new RegExp(addr2));
  input.value=addr1; form.dispatchEvent(new dom.window.Event('submit',{cancelable:true})); await tick();
  input.value='invalid'; form.dispatchEvent(new dom.window.Event('submit',{cancelable:true})); release(); await tick(); await tick();
  assert.match(dom.window.document.querySelector('[data-account-result]').textContent, /valid-looking/); dom.window.close();
});

test('genesis changes invalidate visible data and block account results', async () => {
  let calls = 0;
  const dom = await setup(async (url) => {
    if (url.endsWith('/status')) return response(status(++calls > 2 ? 'b'.repeat(64) : genesis));
    if (url.includes('/feed?')) return response(feed);
    throw new Error('account must not be read on mismatch');
  });
  assert.equal(dom.window.document.querySelector('[data-height]').textContent, '3');
  dom.window.document.querySelector('[data-address]').value=addr1;
  dom.window.document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true})); await tick(); await tick();
  assert.equal(dom.window.document.querySelector('[data-height]').textContent, '—');
  assert.match(dom.window.document.querySelector('[data-status]').textContent, /identity changed/);
  assert.equal(dom.window.document.querySelector('[data-network]').textContent, 'Unavailable'); dom.window.close();
});

test('feed links valid transaction hashes to a working Receipt Desk lookup', async () => {
  const malformed = ['javascript:alert(1)', '../start/', 'd'.repeat(63), null];
  const dom = await setup(async (url) => response(url.endsWith('/status') ? status() : {
    blocks: [{height:2,txs:[feed.blocks[0].txs[0], ...malformed.map(hash => ({hash,kind:'post'}))]}],
  }));
  const links = dom.window.document.querySelectorAll('[data-activity] a');
  assert.equal(links.length, 1, 'only a valid hash becomes a receipt link');
  assert.equal(links[0].href, `https://pointcast.xyz/chain/receipt/?hash=${txHash}`);
  assert.match(links[0].getAttribute('aria-label'), new RegExp(txHash));
  const destination = links[0].href;
  dom.window.close();

  const desk = new JSDOM(`<section data-receipt-desk data-api="https://example.test" data-genesis="${genesis}"><form data-form><input id="hash"><button data-submit></button></form><div data-status></div><div data-result></div></section>`, {url:destination});
  const paths = [];
  globalThis.document = desk.window.document;
  globalThis.location = desk.window.location;
  globalThis.fetch = async (url) => {
    paths.push(new URL(url).pathname);
    if (url.endsWith('/status')) return response(status());
    if (url.endsWith(`/tx/${txHash}`)) return response({status:'included',height:2,receipt:{tx_hash:txHash,kind:'post',sender:'alice'}});
    throw new Error('unexpected path');
  };
  try {
    const module = deskSource.replace("'../apps/chain-kit.js'", JSON.stringify(kit)).replace("'./model.mjs'", JSON.stringify(receiptModel));
    await import(`data:text/javascript;base64,${Buffer.from(module).toString('base64')}#${Math.random()}`);
    await tick(); await tick();
    assert.deepEqual(paths, ['/status', `/tx/${txHash}`, '/status']);
    assert.equal(desk.window.document.querySelector('#hash').value, txHash);
    assert.equal(desk.window.document.querySelector('[data-result] h2').textContent, 'Included in a block');
    assert.match(desk.window.document.querySelector('[data-result]').textContent, /not an independently verified proof/);
    assert.equal(desk.window.document.querySelector('[data-result] a').href, destination);
  } finally { desk.window.close(); delete globalThis.location; }
});

test('refresh removes previous activity immediately and recovers after a failed read', async () => {
  let fail = false;
  let release;
  const dom = await setup(async (url) => {
    if (url.endsWith('/status')) return response(status());
    if (fail) return new Promise(resolve => { release = () => resolve(response(null)); });
    return response(feed);
  });
  const activity = dom.window.document.querySelector('[data-activity]');
  const refresh = dom.window.document.querySelector('[data-refresh]');
  assert.equal(activity.querySelectorAll('a').length, 1);
  fail = true; refresh.click();
  assert.equal(activity.querySelectorAll('.activity-row').length, 0);
  assert.match(activity.textContent, /Reading recent transactions/);
  assert.equal(refresh.disabled, true);
  await tick(); release(); await tick(); await tick();
  assert.equal(activity.textContent, 'Activity unavailable.');
  assert.equal(refresh.disabled, false);
  fail = false; refresh.click(); await tick(); await tick();
  assert.equal(activity.querySelectorAll('a').length, 1);
  assert.equal(dom.window.document.querySelector('[data-network]').textContent, 'Identity matched');
  dom.window.close();
});
