// A recorded devnet as a fetch function, for the Daily Mint, Notary and Time
// Capsules suites. It serves what tests/fixtures/chain-apps-local.json holds,
// recorded by GET reads from a throwaway local devnet-2 (the same code as the
// public devnet, a 15-minute lot day): the raw blocks, params, status, the
// auction's /daily views, the capsules list and the message bodies. The feed,
// /block/N and /tx/HASH are built from the raw blocks the way the Worker builds
// them (tests/chain-app-daily-mint.test.mjs checks the feed against the real
// recorded one).
import { readFileSync } from 'node:fs';
import * as pcc from '../../public/chain/first-mints/lib/pointcast-chain.js';

export const FX = JSON.parse(readFileSync(new URL('../fixtures/chain-apps-local.json', import.meta.url), 'utf8'));

const reply = (obj, status = 200, text) => ({
  ok: status < 400,
  status,
  headers: { get: () => null },
  text: async () => (text !== undefined ? text : JSON.stringify(obj)),
});

/** The card the Worker shows for one signed tx (kind, sender, payload without sender and nonce, plus a stored body). */
export function cardOf(stx, bodies = FX.bodies) {
  const { sender, nonce, ...rest } = stx.tx;
  const withBody = { ...rest };
  if (stx.tx.type === 'publish_block' && bodies[stx.tx.body_hash] !== undefined) withBody.body = bodies[stx.tx.body_hash];
  const payload = Object.fromEntries(Object.keys(withBody).sort().map((k) => [k, withBody[k]]));
  return { hash: pcc.txHash(stx), kind: stx.tx.type, sender: stx.tx.sender, payload };
}

/** GET /feed as the Worker serves it: newest blocks that carry transactions first, `next_before` to page on. */
export function feedOf(blocks, { limit = 20, before = null, bodies = FX.bodies } = {}) {
  const tip = blocks.at(-1).header.height;
  const withTx = blocks.filter((b) => b.txs.length && (before === null || b.header.height < before)).reverse();
  const page = withTx.slice(0, limit);
  const rows = page.map((b) => ({ height: b.header.height, hash: pcc.blockHeaderHash(b.header), timestamp: b.header.timestamp, txs: b.txs.map((t) => cardOf(t, bodies)) }));
  const last = page.at(-1);
  // The Worker answers next_before with the oldest height it returned, whether or not more follows; an empty page ends the scan.
  return { tip, blocks: rows, next_before: last ? last.header.height : null };
}

/**
 * The fetch function. `log` collects "METHOD path?query". `overrides` maps a path
 * to (url, init) => response to replace a route. `mutate` can alter the blocks
 * (a test tampers with a copy, never the fixture).
 */
export function fakeDevnet({ fx = FX, log = [], overrides = {}, blocks = fx.blocks, status = fx.status, bodies = fx.bodies, accounts = {} } = {}) {
  const tip = blocks.at(-1).header.height;
  return async (url, init = {}) => {
    const u = new URL(String(url));
    const method = (init.method || 'GET').toUpperCase();
    log.push(method + ' ' + u.pathname + u.search);
    if (overrides[u.pathname]) return overrides[u.pathname](u, init);
    if (method !== 'GET') return reply({ error: 'the fake devnet takes no writes' }, 405);
    const p = u.pathname;
    let m;
    if (p === '/status') return reply({ ...status, height: tip });
    if (p === '/params') return reply(fx.params);
    if (p === '/daily') return reply(fx.daily);
    if (p === '/daily/law') return reply(fx.dailyLaw);
    if ((m = /^\/account\/([A-Za-z0-9]+)$/.exec(p))) {
      const a = accounts[m[1]];
      return reply(a ? { address: m[1], balance: a.balance, exists: true, next_nonce: a.next_nonce ?? 0, nonce: a.next_nonce ?? 0 } : { address: m[1], balance: 0, exists: false, next_nonce: 0, nonce: 0 });
    }
    if ((m = /^\/daily\/(\d+)$/.exec(p))) return fx.lots[m[1]] ? reply(fx.lots[m[1]]) : reply({ error: 'no such lot' }, 404);
    if (p === '/edition/daily-mint') return reply(fx.edition);
    if (p === '/capsules') return reply(fx.capsules);
    if ((m = /^\/raw\/block\/(\d+)$/.exec(p))) {
      const b = blocks.find((x) => x.header.height === Number(m[1]));
      return b ? reply(b) : reply({ error: 'block not found' }, 404);
    }
    if (p === '/raw/blocks') {
      const from = Number(u.searchParams.get('from') || 1);
      const limit = Number(u.searchParams.get('limit') || 100);
      return reply({ tip, from, blocks: blocks.filter((b) => b.header.height >= from).slice(0, limit) });
    }
    if ((m = /^\/block\/(\d+)$/.exec(p))) {
      const b = blocks.find((x) => x.header.height === Number(m[1]));
      return b ? reply({ ...b.header, hash: pcc.blockHeaderHash(b.header), network: 'devnet' }) : reply({ error: 'block not found' }, 404);
    }
    if (p === '/feed') return reply(feedOf(blocks, { limit: Number(u.searchParams.get('limit') || 20), before: u.searchParams.has('before') ? Number(u.searchParams.get('before')) : null, bodies }));
    if ((m = /^\/tx\/([0-9a-f]{64})$/.exec(p))) {
      for (const b of blocks) {
        const i = b.txs.findIndex((t) => pcc.txHash(t) === m[1]);
        if (i >= 0) return reply({ status: 'included', height: b.header.height, index: i });
      }
      return reply({ status: 'unknown' });
    }
    if ((m = /^\/body\/([0-9a-f]{64})$/.exec(p))) return bodies[m[1]] !== undefined ? reply(null, 200, bodies[m[1]]) : reply({ error: 'body not found' }, 404);
    return reply({ error: 'no such route on the devnet' }, 404);
  };
}
