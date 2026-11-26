import assert from 'node:assert/strict';
import test from 'node:test';
import { loadMessage } from '../public/sketches/loom-share-cards/links.mjs';

const key = '59bd98330ba4e9fadf436bfc';
const id = 'm_4t1d0t5q0y';
const reply = 'loom:' + key + '#' + id;
const base = 'https://pointcast.xyz';
const native = '/loom?to=%23loom-ux#' + id;
const quoted = { id, at:'2026-11-18T23:59:00Z', from:{name:'X desk'}, body:'  The room is open.  ' };
const thread = {
  ok:true, exists:true, log:{key,address:'#loom-ux'},
  messages:[{...quoted,id:'m_abcdef',body:'A different post'}, quoted],
};
const serve = (value, inspect = () => {}) => async (url, options) => {
  inspect(new URL(url), options);
  return {ok:true,json:async () => value};
};

test('a reply-address permalink reads only its bound public thread and selects the exact message', async () => {
  const card = await loadMessage(base + '/loom?to=' + encodeURIComponent(reply), {
    fetcher:serve(thread, (url, options) => {
      assert.equal(url.origin + url.pathname, base + '/api/loom');
      assert.deepEqual([...url.searchParams], [['to',reply]]);
      assert.deepEqual(options, {method:'GET',credentials:'omit',redirect:'error'});
    }),
  });
  assert.deepEqual(card, {kind:'message',quote:'The room is open.',byline:'X desk',room:'#loom-ux',
    date:'Nov 18, 2026',linkLabel:'pointcast.xyz' + native,source:base + native});
});

test('native room fragments, printed URLs, topic pages and literal reply fragments resolve', async () => {
  for (const url of [native, 'pointcast.xyz'+native, '/loom/topic/loom-ux#'+id,
    '/loom?to=loom:'+key+'#'+id, '/loom/classic?to='+encodeURIComponent(reply)+'#thread']) {
    assert.equal((await loadMessage(url, {fetcher:serve(thread)})).source, base + native);
  }
});

test('handles retain their message fragment and other thread types retain the real reply permalink', async () => {
  const handle = '/loom?to=%40astra#' + id;
  const handleRoom = {...thread,log:{key,address:'@astra'}};
  assert.equal((await loadMessage(handle, {fetcher:serve(handleRoom)})).source, base+handle);
  const locator = '/loom?to='+encodeURIComponent(reply);
  const urlRoom = {...thread,log:{key,address:'https://example.org/path'}};
  assert.equal((await loadMessage(locator, {fetcher:serve(urlRoom)})).source, base+locator);
});

test('missing, hidden, blank, nonexistent or mismatched records cannot become the card', async () => {
  const hidden = {...quoted, hidden:true};
  const responses = [
    {...thread, messages:[hidden]}, {...thread, messages:[{...quoted,body:'  '}]},
    {...thread, messages:[{...quoted,id:'m_abcdef'}]}, {...thread, exists:false},
    {...thread, log:{key:'2'.repeat(24),address:'#loom-ux'}}, {...thread, messages:null},
  ];
  for (const value of responses) await assert.rejects(
    loadMessage('/loom?to='+encodeURIComponent(reply), {fetcher:serve(value)}), /unavailable/);
  await assert.rejects(loadMessage(native, {fetcher:serve({...thread,log:{key,address:'#other'}})}), /unavailable/);
});

test('external links, room-only addresses, unsupported routes and malformed references make zero requests', async () => {
  const bad = [base+'/loom?to=%23loom-ux', '/loom/p/'+id, 'https://other.invalid'+native,
    'https://pointcast.xyz.evil.invalid'+native, 'http://pointcast.xyz'+native,
    'https://other@pointcast.xyz'+native, '/api/loom?to=%23loom-ux#'+id,
    '/loom?to=%23room&to=%23other#'+id, '/loom?to=http%3A%2F%2Fevil.invalid#'+id,
    '/loom?to=%23bad%2Froom#'+id, '/loom?to='+encodeURIComponent(reply)+'#m_abcdef',
    '/loom?to=loom:bad#'+id, '/loom?to=%23loom-ux#m_x', 'x'.repeat(2049)];
  let reads = 0;
  for (const input of bad) await assert.rejects(
    loadMessage(input, {fetcher:() => {reads++;}}), /Paste a PointCast/);
  assert.equal(reads,0);
});

test('failed network or unreadable JSON produces a retryable public-board error', async () => {
  for (const fetcher of [async () => {throw new Error('offline')}, async () => ({ok:false}),
    async () => ({ok:true,json:async () => {throw new SyntaxError()}})]) {
    await assert.rejects(loadMessage(native,{fetcher}), /public board could not be read/);
  }
});
