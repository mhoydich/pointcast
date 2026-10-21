// End-to-end run of the live strip on /chain/plan against a devnet over HTTP:
//
//   node scripts/e2e-chain-plan.mjs [http://127.0.0.1:8799] [--live]
//
// The strip only reads (GET), and so does this script: it never writes to any
// devnet. (To see the strip name a witness key the house does not run, witness
// a throwaway LOCAL devnet first with pointcast-chain's scripts/pc-witness.mjs
// --devnet http://127.0.0.1:PORT --genesis <its genesis>.)
// What it does, printing one line per result:
//   1. reads /status, /net and /daily itself;
//   2. mounts plan-live.js over the built page (dist/chain/plan/index.html) in
//      jsdom with ?devnet=<the local devnet>, reads, and compares the four lines
//      with what it read, house keys and outside keys included;
//   3. checks the strip stops at GENESIS CHANGED for a wrong pin;
//   4. --live: the same read checks on the public devnet, pinned from chain-home.
// Exit status 1 on any mismatch.
import { DEVNET } from '../src/data/chain-home.ts';
import { HOUSE_WITNESSES, STANDING } from '../src/data/chain-plan.ts';
import * as live from '../public/chain/apps/plan-live.js';
import { builtSection, harness, reach, sturdyFetch } from './lib/e2e-chain-apps.mjs';

const h = harness('The plan · live strip', 'e2e-chain-plan');
const { say, check } = h;

async function getJson(base, path) {
  const r = await sturdyFetch(base + path, { signal: AbortSignal.timeout(10000) });
  return r.ok ? r.json() : null;
}

async function mountAndRead(search, label) {
  const page = builtSection('dist/chain/plan/index.html', '[data-plan-live]', 'http://127.0.0.1:4321/chain/plan/' + search);
  if (!page) { check(false, label + ': dist/chain/plan/index.html with the strip (run npm run build:bare first)'); return null; }
  const calls = [];
  const fetchSpy = (u, o = {}) => { calls.push({ url: String(u), method: (o.method || 'GET').toUpperCase() }); return sturdyFetch(u, o); };
  const c = live.start(page.section, { fetch: fetchSpy, search });
  check(Boolean(c), label + ': the strip mounts over the built page');
  if (!c) return null;
  check(calls.length === 0, label + ': nothing is read before the page is ready');
  await c.read();
  const q = (f) => page.section.querySelector('[data-live-' + f + ']').textContent;
  check(calls.length > 0 && calls.every((x) => x.method === 'GET'), label + ': ' + calls.length + ' requests, all GET');
  return { state: page.section.dataset.state, height: q('height'), witnesses: q('witnesses'), lot: q('lot'), milestone: q('milestone'), status: q('state'), calls };
}

async function compare(base, search, label, pinnedHouse) {
  const [st, net, daily] = await Promise.all([getJson(base, '/status'), getJson(base, '/net'), getJson(base, '/daily')]);
  if (!st) { check(false, label + ': ' + base + ' answers /status'); return; }
  say(label + ': ' + base + ' at block ' + st.height + ', genesis ' + String(st.genesis_hash).slice(0, 12) + '…');
  const got = await mountAndRead(search, label);
  if (!got) return;
  check(got.state === 'live', label + ': state live (' + got.state + ')');
  check(got.height.startsWith('Block ' + Number(st.height).toLocaleString('en-US')) || got.height.startsWith('Block ' + Number(st.height + 1).toLocaleString('en-US')), label + ': height line "' + got.height + '"');
  const ws = Array.isArray(net && net.witnesses) ? net.witnesses : [];
  const outside = ws.filter((w) => !Object.prototype.hasOwnProperty.call(pinnedHouse, w.addr));
  if (!ws.length) check(/^No witness key has signed today/.test(got.witnesses), label + ': no witnesses today, said so');
  else {
    check(got.witnesses.startsWith(ws.length + ' witness key' + (ws.length === 1 ? '' : 's') + ' today'), label + ': ' + ws.length + ' witness key(s): "' + got.witnesses + '"');
    for (const w of ws) check(got.witnesses.includes((w.name || w.addr) + (pinnedHouse[w.addr] ? ' (house)' : '')), label + ': names ' + (w.name || w.addr) + (pinnedHouse[w.addr] ? ' as the house’s' : ' with no house tag'));
  }
  check(outside.length ? /^A witness key the house does not run has signed today/.test(got.milestone) : /^No witness key from outside the house today/.test(got.milestone), label + ': milestone line "' + got.milestone + '"');
  const lot = daily && daily.status === 'on' && daily.lot ? daily.lot : null;
  check(lot ? got.lot === 'Today’s Daily Mint lot, #' + lot.n + ': ' + lot.bids + ' bid' + (lot.bids === 1 ? '' : 's') + ' so far.' : /no open lot/.test(got.lot), label + ': lot line "' + got.lot + '"');
  say(label + ': status "' + got.status + '"');
}

const local = await reach(h.api);
if (!local) {
  check(false, 'the local devnet at ' + h.api + ' answers (start one: pointcast-chain deploy/devnet-worker, wrangler dev --local)');
} else {
  await compare(h.api, '?devnet=' + h.api, 'local', HOUSE_WITNESSES);
  const wrong = await mountAndRead('?devnet=' + h.api + '&genesis=' + 'ab'.repeat(32), 'local, wrong pin');
  if (wrong) {
    check(wrong.state === 'genesis-changed' && /^GENESIS CHANGED/.test(wrong.status), 'local, wrong pin: GENESIS CHANGED, no numbers');
    check(wrong.height.startsWith('Not read yet'), 'local, wrong pin: the height line keeps its static words');
  }
}

if (h.flag('--live')) {
  await compare(DEVNET.url, '', 'live', HOUSE_WITNESSES);
  say('live: the plan was written at block ' + STANDING.blocks.toLocaleString('en-US'));
}

h.finish();
