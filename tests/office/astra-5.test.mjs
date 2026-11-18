import test from 'node:test';
import assert from 'node:assert/strict';
import { readPrStates } from '../../src/lib/office/pr-state.mjs';
const now = Date.parse('2026-11-17T17:00:00Z');
const base = { number: 123, base: { repo: { full_name: 'mhoydich/pointcast' } }, head: { sha: 'a'.repeat(40) }, state: 'open', draft: false, merged: false, merged_at: null, merge_commit_sha: null };
async function run(values, options = {}) {
  let calls = 0;
  const fetcher = async (url, init) => {
    assert.equal(url, 'https://api.github.com/repos/mhoydich/pointcast/pulls/123');
    assert.equal(init.method, 'GET'); assert.equal(init.credentials, 'omit'); assert.equal(init.redirect, 'error'); assert.equal(init.headers.Authorization, undefined);
    return new Response(JSON.stringify(values[Math.min(calls++, values.length - 1)]), { headers: { date: new Date(now).toUTCString() } });
  };
  return readPrStates({ prs: [123], now, fetcher, ...options });
}
for (const [name, patch, state] of [['open', {}, 'open'], ['draft', {draft:true}, 'draft'], ['awaiting review', {mergeable_state:'blocked'}, 'open'], ['closed', {state:'closed'}, 'closed']]) test(name+' is not red evidence', async () => {
  const r = await run([{...base,...patch}]); assert.equal(r.data.pullRequests[0].state,state); assert.equal(r.data.pullRequests[0].blocked,null);
});
test('consistent explicit conflict',async()=>{ const r=await run([{...base,mergeable:false,mergeable_state:'dirty'}]); assert.equal(r.data.pullRequests[0].blocked,true); });
test('head change discards evidence',async()=>{ const r=await run([base,{...base,head:{sha:'b'.repeat(40)}}]); assert.equal(r.state,'error'); assert.equal(r.data.pullRequests[0].state,'unknown'); });
test('merge requires flags time and SHA agreement',async()=>{
 const p={...base,state:'closed',merged:true,merged_at:'2026-11-17T16:00:00Z',merge_commit_sha:'c'.repeat(40)};
 assert.equal((await run([p])).data.pullRequests[0].state,'merged');
 for(const patch of [{merged:false},{merged_at:null},{merge_commit_sha:null},{merged_at:'2027-01-01T00:00:00Z'},{merge_commit_sha:'d'.repeat(40)}]) assert.equal((await run([p,{...p,...patch}])).data.pullRequests[0].state,'unknown');
});
test('invalid input performs no fetch',async()=>{assert.equal((await readPrStates({prs:['123'],fetcher:()=>{throw Error('unexpected')}})).state,'error');});
test('empty is idle',async()=>assert.equal((await readPrStates({prs:[],now})).state,'idle'));
test('stale HTTP response cannot emit evidence',async()=>assert.equal((await run([base],{now:now+121000})).state,'stale'));
test('network error is bounded',async()=>{ const r=await run([base],{fetcher:()=>{throw Error('private upstream text')}});assert.deepEqual(r.errors,['pr_123:request_failed']);});
test('monotonic elapsed time handles response latency and sequential batches', async t => {
  let elapsed = 0;
  t.mock.method(performance, 'now', () => elapsed);
  // Simulate wall-clock jumps: supplied epoch plus monotonic time governs reads.
  t.mock.method(Date, 'now', () => now - 86400000);
  const r = await readPrStates({ prs: [123, 124], now, fetcher: async url => {
    elapsed += 1100;
    const number = Number(url.split('/').at(-1));
    return Response.json({ ...base, number, draft: true }, { headers: { date: new Date(now + elapsed).toUTCString() } });
  } });
  assert.equal(r.state, 'ok');
  assert.equal(r.observedAt, new Date(now + 4400).toISOString());
  assert.deepEqual(r.data.pullRequests.map(p => p.state), ['draft', 'draft']);
});
test('elapsed clock still rejects genuinely future and stale observations', async t => {
  let elapsed = 0;
  t.mock.method(performance, 'now', () => elapsed);
  for (const [offset, expected] of [[10000, 'invalid_observation_time'], [-121000, 'stale_response']]) {
    elapsed = 0;
    const r = await readPrStates({ prs: [123], now, fetcher: async () => {
      elapsed += 1100;
      return Response.json(base, { headers: { date: new Date(now + elapsed + offset).toUTCString() } });
    } });
    assert.deepEqual(r.errors, [`pr_123:${expected}`]);
    assert.equal(r.observedAt, null);
  }
});

test('consistent draft conflicts retain draft state and verified conflict evidence', async () => {
  const conflict = { ...base, draft: true, mergeable: false, mergeable_state: 'dirty' };
  const result = await run([conflict, conflict]);
  const row = result.data.pullRequests[0];
  assert.equal(result.state, 'ok');
  assert.equal(row.state, 'draft');
  assert.equal(row.blocked, true);
  assert.deepEqual(row.evidence, [{ type: 'conflict', headSha: base.head.sha, sourceUrl: 'https://api.github.com/repos/mhoydich/pointcast/pulls/123' }]);
});
test('draft conflicts need two confirmed consistent observations', async () => {
  const conflict = { ...base, draft: true, mergeable: false, mergeable_state: 'dirty' };
  for (const patch of [
    { mergeable: null }, { mergeable: true }, { mergeable: undefined },
    { mergeable_state: 'unknown' }, { mergeable_state: 'blocked' }, { mergeable_state: undefined },
    { draft: false }, { state: 'closed' }, { head: { sha: 'b'.repeat(40) } },
  ]) {
    for (const values of [[conflict, { ...conflict, ...patch }], [{ ...conflict, ...patch }, conflict]]) {
      const row = (await run(values)).data.pullRequests[0];
      assert.equal(row.blocked, null, JSON.stringify(patch));
      assert.deepEqual(row.evidence, []);
    }
  }
  const closed = { ...conflict, state: 'closed' };
  assert.equal((await run([closed, closed])).data.pullRequests[0].blocked, null);
});
