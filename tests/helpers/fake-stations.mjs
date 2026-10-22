// A small model of the devnet's stations, as a fetch function and an SDK-shaped
// chain, for the Channels suite (tests/chain-app-channels.test.mjs). Not a test
// file.
//
// It serves what the Channels page reads (GET /status, /params, /stations,
// /station/{code}, /account/{addr}, /feed, /tx/{hash}) and takes what it writes
// (POST /body, POST /tx), and it applies the chain's own rules to a signed
// claim_station, set_station and publish_block, with the words the devnet used
// when it refused them (pointcast-chain crates/chain-core state.rs and station.rs;
// each text here was seen from a throwaway local devnet-2 by
// scripts/e2e-chain-app-channels.mjs, which checks this model against it).
// Signatures are verified with the SDK, so a page that signs the wrong thing, or
// with the wrong key, is refused here as it would be there.
import * as pcc from '../../public/chain/first-mints/lib/pointcast-chain.js';
import { DEVNET } from '../../src/data/chain-home.ts';

export const CHAIN_ID = DEVNET.chainId;
export const GENESIS = DEVNET.genesis;
export const DOMAIN = pcc.domainOf(CHAIN_ID, GENESIS);
export const HOUSE = 'tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35';
export const HOUSE_CODES = ['ART', 'FD', 'GDN', 'GF', 'ORC', 'RLY'];
export const BAD_WORD = 'zzbadwordzz';
const HEX = (c) => c.repeat(64);

const reply = (obj, status = 200, text) => ({
  ok: status < 400,
  status,
  headers: { get: () => null },
  text: async () => (text !== undefined ? text : JSON.stringify(obj)),
});

/** The words the chain gives for each refusal (state.rs Display for TxError). */
export const WORDS = Object.freeze({
  notCrew: "only this station's owner and crew post or seal here",
  taken: 'someone else holds this station',
  unknown: 'no such station',
  notOwner: "only the station's owner may do this",
  limit: (n) => 'this holder already holds ' + n + ' stations',
  filter: 'kept off the devnet by its word filter',
});

/**
 * The model. `opts.stations` seeds extra stations ({code, owner, name, mode, crew, pinned, offer}),
 * `opts.posts` seeds posts ({channel, title, body, sender, bot, senderKind}), `opts.max` is max_stations.
 * `opts.label` and `opts.statusChainId` are what GET /status says for its label and its chain_id (for the
 * suites that feed the page hostile text); a bot or a sender kind on a post is what its card says.
 */
export function stationsDevnet(opts = {}) {
  const max = opts.max ?? 4;
  const st = {
    height: 40,
    genesis: opts.genesis || GENESIS,
    stations: new Map(),
    nonces: new Map(),
    blocks: [],
    bodies: new Map(),
    hidden: new Set(),
    log: opts.log || [],
    sent: [],
    stored: [],
    ticketed: opts.ticketed === true,
    enabled: opts.enabled !== false,
    maxAccount: opts.maxAccount ?? 1024,
    house: opts.house === undefined ? HOUSE : opts.house,
    down: false,
  };
  for (const c of HOUSE_CODES) st.stations.set(c, { code: c, owner: HOUSE, name: c, mode: 'open', crew: [], pinned: null, offer: null, house: true, claimedAt: 0 });
  for (const s of opts.stations || []) st.stations.set(s.code, { name: s.code, mode: 'crew', crew: [], pinned: null, offer: null, house: false, claimedAt: 12, ...s });
  const row = (s) => ({ claimed_at: s.claimedAt, code: s.code, crew: s.crew, house: s.house, mode: s.mode, name: s.name, offer: s.offer, owner: s.owner, pinned: s.pinned });
  const stationsJson = () => ({ enabled: st.enabled, house_codes: HOUSE_CODES, max_stations: max, stations: [...st.stations.values()].sort((a, b) => (a.code < b.code ? -1 : 1)).map(row) });

  /** A block holds entries; a card is built from one at read time, so hiding a post later shows. */
  function seal(entry) {
    st.height += 1;
    st.blocks.push({ height: st.height, timestamp: 1792480000000 + st.height * 3000, entries: [entry] });
    return { height: st.height, index: 0 };
  }

  function cardOf(tx, signed, hash = pcc.txHash(signed), meta = {}) {
    const { sender, nonce, ...rest } = tx;
    const hidden = st.hidden.has(hash);
    const payload = { ...rest };
    if (tx.type === 'publish_block') {
      payload.media_uri = null;
      if (hidden) payload.title = '[hidden by the devnet admin]';
      else if (st.bodies.has(tx.body_hash)) payload.body = st.bodies.get(tx.body_hash);
    }
    return { hash, kind: tx.type, ...(tx.type === 'publish_block' ? { label: 'devnet-2 · bot · unmoderated' } : {}), ...(hidden ? { hidden: true } : {}), ...(meta.bot ? { bot: meta.bot } : {}), nonce, payload, sender, sender_info: { kind: meta.senderKind || 'human' }, sig_mode: 'raw' };
  }
  const render = (e) => cardOf(e.tx, e.signed, e.hash, e.meta);

  function refuse(message, status = 400) {
    return Object.assign(new Error(message), { status, details: { error: message, network: 'devnet' } });
  }

  const held = (addr) => [...st.stations.values()].filter((s) => s.owner === addr && !s.house).length;

  /** Apply a signed tx the way the chain does, or throw the chain's words. Returns the tx hash. */
  async function submit(signed) {
    if (st.down) throw refuse('devnet unreachable', 502);
    const tx = signed.tx;
    const ok = await pcc.verifyEd25519(signed.public_key.bytes, pcc.hexToBytes(pcc.signingHash(tx, DOMAIN)), signed.signature);
    if (!ok) throw refuse('bad signature');
    if (pcc.tezosAddress(signed.public_key) !== tx.sender) throw refuse('the key does not match the sender');
    const want = st.nonces.get(tx.sender) || 0;
    if (tx.nonce !== want) throw refuse('stale nonce: expected ' + want + ', got ' + tx.nonce);
    const hash = pcc.txHash(signed);
    if (tx.type === 'claim_station') {
      if (!st.enabled) throw refuse('feature disabled: stations');
      if (!/^[A-Z0-9]{1,16}$/.test(tx.code)) throw refuse('invalid code: must be [A-Z0-9]');
      if (!tx.name || new TextEncoder().encode(tx.name).length > 32) throw refuse('invalid name: too long');
      const cur = st.stations.get(tx.code);
      if (cur && cur.owner === tx.sender) { cur.name = tx.name; cur.mode = tx.mode; } else if (cur && cur.offer === tx.sender) {
        if (held(tx.sender) >= max) throw refuse(WORDS.limit(max));
        Object.assign(cur, { owner: tx.sender, name: tx.name, mode: tx.mode, crew: [], pinned: null, offer: null, claimedAt: st.height + 1 });
      } else if (cur || HOUSE_CODES.includes(tx.code)) throw refuse(WORDS.taken);
      else {
        if (held(tx.sender) >= max) throw refuse(WORDS.limit(max));
        st.stations.set(tx.code, { code: tx.code, owner: tx.sender, name: tx.name, mode: tx.mode, crew: [], pinned: null, offer: null, house: false, claimedAt: st.height + 1 });
      }
    } else if (tx.type === 'set_station') {
      const cur = st.stations.get(tx.code);
      if (!cur) throw refuse(WORDS.unknown);
      if (cur.owner !== tx.sender) throw refuse(WORDS.notOwner);
      if (tx.crew.length > 16) throw refuse('invalid crew: more than 16 entries');
      if (!tx.crew.every((a, i) => i === 0 || tx.crew[i - 1] < a)) throw refuse('invalid crew: must be sorted ascending, no duplicates');
      if (tx.crew.includes(tx.sender)) throw refuse('invalid crew: lists the owner');
      cur.crew = [...tx.crew];
      cur.pinned = tx.pinned ?? null;
      cur.offer = tx.owner_to ?? null;
    } else if (tx.type === 'publish_block') {
      const cur = st.stations.get(tx.channel);
      if (cur && cur.mode === 'crew' && cur.owner !== tx.sender && !cur.crew.includes(tx.sender)) throw refuse(WORDS.notCrew);
    } else throw refuse('this model takes claim_station, set_station and publish_block');
    st.nonces.set(tx.sender, want + 1);
    st.sent.push(signed);
    const at = seal({ tx, signed, hash });
    st.index = { ...(st.index || {}), [hash]: at };
    return hash;
  }

  // posts seeded by the test: cards with made-up hashes, as a devnet would hold from other senders
  let seeded = 0;
  for (const p of opts.posts || []) {
    seeded += 1;
    const body = p.body ?? 'seeded body';
    const body_hash = pcc.bodyHash(body);
    st.bodies.set(body_hash, body);
    const hash = (seeded * 7919).toString(16).padStart(64, '0');
    const tx = { type: 'publish_block', sender: p.sender || HOUSE, nonce: 0, channel: p.channel, title: p.title, body_hash, media_uri: null };
    if (p.hidden) st.hidden.add(hash);
    st.height += 1;
    st.blocks.push({ height: st.height, timestamp: 1792480000000 + st.height * 3000, entries: [{ tx, signed: null, hash, meta: { bot: p.bot, senderKind: p.senderKind } }] });
  }

  const feed = ({ limit = 20, before = null } = {}) => {
    const tip = st.height;
    const withTx = st.blocks.filter((b) => b.entries.length && (before === null || b.height < before)).sort((a, b) => b.height - a.height);
    const page = withTx.slice(0, limit);
    const last = page.at(-1);
    return { tip, blocks: page.map((b) => ({ hash: HEX('b'), height: b.height, network: 'devnet', timestamp: b.timestamp, txs: b.entries.map(render) })), next_before: last ? last.height : null };
  };

  const statusJson = () => ({
    chain_id: opts.statusChainId || CHAIN_ID, genesis_hash: st.genesis, height: st.height, tip_hash: HEX('a'), tip_timestamp: 1792480000000 + st.height * 3000, state_root: HEX('c'), mempool: 0, accounts: 3, agents: 0, bots: 0, drops: 0,
    total_supply: 1000000, max_supply: 1000000000, label: opts.label || 'devnet-2 · bot · unmoderated', may_reset: true, network: 'devnet', value: 'none', anchors: 'none: the devnet does not anchor to Tezos', house: st.house,
  });
  const paramsJson = () => ({
    chain_id: CHAIN_ID,
    launch: {
      presence: { tap_policy: st.ticketed ? 'ticketed' : 'open', presence_reward: 5 },
      stations: { house_codes: HOUSE_CODES, max_account_stations: st.maxAccount, max_capsules: 8192, max_delay_blocks: 10512000, max_stations: max, max_unopened: 32 },
    },
  });

  const fetchFn = async (url, init = {}) => {
    const u = new URL(String(url));
    const method = (init.method || 'GET').toUpperCase();
    st.log.push(method + ' ' + u.pathname + u.search);
    if (st.down) throw new TypeError('Failed to fetch');
    const p = u.pathname;
    let m;
    if (method === 'POST') {
      if (p === '/body') {
        const { body } = JSON.parse(init.body);
        if (typeof body !== 'string' || !body.length) return reply({ error: 'body: a non-empty string' }, 400);
        if (new TextEncoder().encode(body).length > 8192) return reply({ error: 'body over 8192 bytes on the devnet' }, 413);
        if (body.toLowerCase().includes(BAD_WORD)) return reply({ error: WORDS.filter }, 422);
        const h = pcc.bodyHash(body);
        st.bodies.set(h, body);
        st.stored.push(body);
        return reply({ body_hash: h, network: 'devnet' });
      }
      if (p === '/tx') {
        try {
          const hash = await submit(JSON.parse(init.body));
          return reply({ tx_hash: hash, status: 'pending', network: 'devnet' });
        } catch (e) {
          return reply({ error: e.message, network: 'devnet' }, e.status || 400);
        }
      }
      return reply({ error: 'no such route on the devnet' }, 404);
    }
    if (p === '/status') return reply(statusJson());
    if (p === '/params') return reply(paramsJson());
    if (p === '/stations') return reply(stationsJson());
    if ((m = /^\/station\/([^/]+)$/.exec(p))) {
      const s = st.stations.get(decodeURIComponent(m[1]).toUpperCase());
      return reply(s ? row(s) : { code: decodeURIComponent(m[1]).toUpperCase(), station: null });
    }
    if ((m = /^\/account\/([A-Za-z0-9]+)$/.exec(p))) return reply({ address: m[1], balance: 0, exists: st.nonces.has(m[1]), next_nonce: st.nonces.get(m[1]) || 0, nonce: st.nonces.get(m[1]) || 0 });
    if (p === '/feed') return reply(feed({ limit: Number(u.searchParams.get('limit') || 20), before: u.searchParams.has('before') ? Number(u.searchParams.get('before')) : null }));
    if ((m = /^\/tx\/([0-9a-f]{64})$/.exec(p))) {
      const at = (st.index || {})[m[1]];
      return reply(at ? { status: 'included', height: at.height, index: at.index } : { status: 'unknown' });
    }
    return reply({ error: 'no such route on the devnet' }, 404);
  };

  /** The SDK-shaped chain the page's logic signs and sends with. */
  const chain = {
    domain: DOMAIN,
    chainId: CHAIN_ID,
    genesisHash: GENESIS,
    async submit(signed) {
      const hash = await submit(signed);
      return { txHash: hash, status: 'pending' };
    },
    async waitForTx(hash) {
      const at = (st.index || {})[hash];
      if (!at) throw Object.assign(new Error('tx not found'), { details: { status: 'unknown' } });
      return { height: at.height, index: at.index, status: 'included', receipt: { kind: 'x', tx_hash: hash } };
    },
  };

  return { st, fetch: fetchFn, chain, submit, hide: (hash) => st.hidden.add(hash), card: cardOf, WORDS };
}
