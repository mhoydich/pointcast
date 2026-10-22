// Shared by scripts/e2e-chain-app-{observatory,daily-mint,notary,capsules}.mjs.
//
// The rule they all hold: WRITES GO ONLY TO A LOCAL DEVNET. A write needs an
// address of the form http://127.0.0.1:PORT; the public devnet is only ever read
// (GET), and --live asks for exactly that. `localOnly()` throws for anything else,
// before a request is made.
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

export const LOCAL_RE = /^http:\/\/127\.0\.0\.1:\d+$/;
export const root = new URL('../../', import.meta.url);

export function harness(title, script) {
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(name);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const api = args.find((a) => /^https?:\/\//.test(a)) || 'http://127.0.0.1:8799';
  const out = [];
  let bad = 0;
  const say = (line) => { out.push(line); console.log(line); };
  const check = (ok, line) => { say((ok ? 'ok   ' : 'FAIL ') + line); if (!ok) bad += 1; };
  const localOnly = (url) => { if (!LOCAL_RE.test(url)) throw new Error(script + ': refusing to write to ' + url + ' (writes go only to http://127.0.0.1:PORT)'); return url; };
  say('e2e: ' + title + ' · ' + new Date().toISOString().slice(0, 16) + 'Z · devnet: no value, may reset');
  return {
    args, flag, opt, api, say, check, localOnly,
    finish() {
      if (bad) { console.log('e2e: ' + bad + ' check(s) FAILED'); process.exit(1); }
      console.log('e2e: all checks passed');
    },
  };
}

export async function sturdyFetch(u, o) {
  for (let i = 0; ; i++) {
    try { return await fetch(u, o); } catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 250)); }
  }
}

/** GET status of a devnet, or null when it does not answer. */
export async function reach(base) {
  try {
    const r = await fetch(base + '/status', { signal: AbortSignal.timeout(6000) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait (polling) until `fn()` is truthy, at most `ms`. */
export async function until(fn, ms = 30000, every = 400) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return null;
    await sleep(every);
  }
}

/** A jsdom page for one app: the section from the built page when dist/ has it, else null. */
export function builtSection(distPath, selector, url) {
  const file = new URL(distPath, root);
  if (!existsSync(file)) return null;
  const dom = new JSDOM(readFileSync(file, 'utf8'), { url });
  const section = dom.window.document.querySelector(selector);
  return section ? { dom, section } : null;
}

/** One throwaway post on a local devnet, to seal a block (a block is sealed when something is posted). */
export async function advance(K, api, count = 1, localOnly = (u) => u) {
  localOnly(api);
  const chain = await K.connectPinned(api, {});
  const key = await K.keyFromSeed(K.newSeedHex());
  let last = 0;
  for (let i = 0; i < count; i++) {
    const tx = await chain.buildPublish({ sender: key.sender, channel: 'BOT', title: 'e2e block ' + i, body: 'e2e advance' });
    last = (await K.signAndSend(chain, key, tx)).height;
  }
  return last;
}

let ipSeq = 0;
/**
 * A fetch for a LOCAL devnet that gives each faucet claim a fresh documentation-range client address
 * (198.51.100.x), because the Worker caps the faucet at three claims per client address per UTC day and a
 * repeated end-to-end run would hit that. The header is the one Cloudflare sets in production; a local
 * Worker trusts what it is sent. Only POST /daily/faucet to 127.0.0.1 is touched.
 */
export function ipFetch(u, o = {}) {
  const url = String(u);
  if (LOCAL_RE.test(new URL(url).origin) && url.endsWith('/daily/faucet') && (o.method || 'GET').toUpperCase() === 'POST') {
    ipSeq += 1;
    return sturdyFetch(u, { ...o, headers: { ...(o.headers || {}), 'cf-connecting-ip': '198.51.100.' + (((Date.now() + ipSeq * 7) % 240) + 10) } });
  }
  return sturdyFetch(u, o);
}
