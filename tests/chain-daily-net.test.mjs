// The Daily Net on the PointCast devnet: /chain/net (src/pages/chain/net.astro),
// the self-contained DailyNetPanel (src/components/chain/DailyNetPanel.astro)
// and the browser code both share (src/lib/daily-net.mjs), which reads the
// devnet's GET /net. Shapes: pointcast-chain Daily Net spec rev 2 §7.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { DEVNET as DEVNET_LIVE, DEVNET_PREVIOUS } from '../src/data/chain-home.ts';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const sha256 = (p) => createHash('sha256').update(readFileSync(new URL(p, root))).digest('hex');
const lib = read('src/lib/daily-net.mjs');
const panel = read('src/components/chain/DailyNetPanel.astro');
const page = read('src/pages/chain/net.astro');
const chainHome = read('src/data/chain-home.ts');

const DEVNET_URL = chainHome.match(/const DEVNET_URL = '([^']+)'/)[1];
// The live pin (devnet-2), read from the module: never a hash typed into a test.
const GENESIS = DEVNET_LIVE.genesis;
const PREVIOUS_GENESIS = DEVNET_PREVIOUS.genesis;

// Strip comments so the rules read code and copy, not the notes about them.
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const scriptOf = (s) => s.slice(s.indexOf('<script>'), s.indexOf('</script>'));
/** The text of a `const name = String.raw\`…\`;` in the page frontmatter. */
const rawConst = (name) => {
  const m = page.match(new RegExp(`const ${name} = String\\.raw\`([\\s\\S]*?)\`;`));
  assert.ok(m, `const ${name} in net.astro`);
  return m[1];
};
// The page's copy: frontmatter strings and markup, comments removed.
const copy = code(page.replace(/<!--[\s\S]*?-->/g, ''));

// ---------------------------------------------------------------- source rules

test('devnet data never becomes markup, an href, a src or a style', () => {
  for (const [name, src] of [['lib', lib], ['panel', panel], ['page script', scriptOf(page)]]) {
    const body = code(src);
    assert.doesNotMatch(body, /\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write|set:html|createContextualFragment|DOMParser|\beval\s*\(|new Function\b/, name);
    assert.doesNotMatch(body, /\.(href|src|srcset|action)\s*=|setAttribute\(|style\.setProperty|\.style\s*=/, name);
  }
  assert.match(lib, /\.textContent = /);
  // The panel's only href is a server-rendered constant.
  assert.deepEqual([...panel.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), ['/chain/net']);
  assert.equal((panel.match(/href=\{/g) || []).length, 0);
});

test('the fetch is lazy: nothing at import, and only after load, idle, near-viewport and a visible tab', async () => {
  for (const src of [scriptOf(panel), scriptOf(page)]) assert.doesNotMatch(src, /fetch\s*\(/);
  const body = code(lib);
  const calls = [...body.matchAll(/\bfetch(?:Impl)?\s*\(/g)];
  assert.ok(calls.length >= 1);
  for (const { index } of calls) {
    const before = body.slice(0, index);
    assert.ok((before.match(/\{/g) || []).length - (before.match(/\}/g) || []).length > 0, `a fetch call at ${index} sits at top level`);
  }
  for (const needle of ['requestIdleCallback', 'IntersectionObserver', "visibilityState !== 'hidden'", "addEventListener('load'", 'REFRESH_MS = 60_000'])
    assert.ok(lib.includes(needle), needle);
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = () => { fetched += 1; throw new Error('no fetch at import'); };
  try {
    await import(`../src/lib/daily-net.mjs?lazy=${Date.now()}`);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetched, 0);
});

test('the panel is self-contained: DEVNET from chain-home, its own colours, one script, every hook', () => {
  assert.match(panel, /import \{ DEVNET \} from '\.\.\/\.\.\/data\/chain-home';/);
  assert.match(panel, /data-api=\{DEVNET\.url\}/);
  assert.doesNotMatch(panel, /workers\.dev|[0-9a-f]{64}/, 'reuses DEVNET instead of duplicating its constants');
  assert.match(panel, /data-daily-net="panel"/);
  assert.match(panel, /data-state="static"/);
  assert.equal((panel.match(/<script>/g) || []).length, 1, 'one script');
  assert.match(panel, /querySelectorAll<HTMLElement>\('\[data-daily-net="panel"\]'\)/);
  for (const hook of ['data-dn-clock', 'data-dn-day', 'data-dn-reset', 'data-dn-status', 'data-dn-counts', 'data-dn-roll data-roll-max="12"', 'data-dn-strikes'])
    assert.ok(panel.includes(hook), hook);
  assert.match(panel, /\{DEVNET\.label\} · \{DEVNET\.terms\}/);
  assert.match(panel, /resets at 00:00 UTC/);
  assert.match(panel, /var\(--pc-font-mono\)/);
  assert.match(panel, /var\(--pc-ink/);
  assert.match(panel, /--dn600:\$\{fd\.color600\}/, 'brings the FD ramp, so it needs no .chn root');
  // Mounted once on /chain/bots, in its own #net section, which the section nav links.
  const bots = read('src/pages/chain/bots.astro');
  assert.match(bots, /^import DailyNetPanel from '\.\.\/\.\.\/components\/chain\/DailyNetPanel\.astro';$/m);
  assert.equal((bots.match(/<DailyNetPanel \/>/g) || []).length, 1);
  const net = bots.slice(bots.indexOf('<section id="net"'), bots.indexOf('</section>', bots.indexOf('<section id="net"')));
  assert.ok(net.includes('<DailyNetPanel />'), 'the panel sits in the #net section');
  assert.match(bots, /<a href="#keyless">keyless<\/a><a href="#net">daily net<\/a><a href="#signed">signed<\/a>/);
  assert.ok(bots.indexOf('<section id="net"') > bots.indexOf('<section id="keyless"') && bots.indexOf('<section id="net"') < bots.indexOf('<section id="signed"'));
});

test('who does what: the panel\'s roles name the same duty tools as the /chain/net prompts', () => {
  // The read tools a prompt uses to do a duty (chain_status, chain_feed, chain_read_block) are not duties.
  const READS = new Set(['chain_status', 'chain_feed', 'chain_read_block']);
  const duty = (s) => [...new Set([...s.matchAll(/\bchain_(?!root\b)[a-z_]+/g)].map((m) => m[0]))].filter((t) => !READS.has(t)).sort();
  const role = (who) => {
    const m = panel.match(new RegExp(`who: '${who}',[\\s\\S]*?\\n  \\}`));
    assert.ok(m, `the panel has a ${who} role`);
    return m[0];
  };
  const grok = role('Grok');
  const chatgpt = role('ChatGPT');
  const code = role('Code agents');
  assert.deepEqual(duty(grok), duty(rawConst('grokPrompt')));
  assert.deepEqual(duty(chatgpt), duty(rawConst('chatgptPrompt')));
  assert.deepEqual(duty(grok), ['chain_checkin', 'chain_duties', 'chain_observe', 'chain_review', 'chain_signal']);
  assert.deepEqual(duty(chatgpt), ['chain_checkin', 'chain_crosscheck', 'chain_digest', 'chain_duties']);
  assert.match(grok, /how: 'chat · MCP'/);
  assert.match(chatgpt, /how: 'MCP connector'/);
  assert.match(chatgpt, /pcv\.py offline/);
  assert.match(rawConst('chatgptPrompt'), /python3 -B pcv\.py --params params\.json --blocks blocks\.json --genesis \$\{G\}/);
  assert.match(code, /how: 'Grok via Cursor · Manus · Codex · Claude Code'/);
  assert.match(code, /command: 'node pc-witness\.mjs --name <you> --checkin'/);
  assert.match(rawConst('witnessQuickstart'), /node pc-witness\.mjs --name <you> --checkin$/);
  // Both say when the day resets, in UTC and in Pacific time.
  assert.match(panel, /resets at 00:00 UTC: 5 PM PDT, 4 PM PST from November 1\./);
  assert.match(page, /^const RESET_PT = '5 PM PDT, 4 PM PST from November 1';$/m);
  for (const name of ['grokPrompt', 'chatgptPrompt', 'codePrompt']) assert.match(rawConst(name), /resets at 00:00 UTC[ ,(]+\$\{RESET_PT\}/, name);
});

test('copy: devnet, no value, the restart is dated; a witness is a claim; nothing says verified or promises value', () => {
  // (the code-agent prompt tells agents "don't call it verified": the one allowed use)
  for (const [name, src] of [['lib', lib], ['panel', panel], ['page', copy.replace("don't call it verified", '')]]) {
    for (const phrase of [/main\s*net/i, /\bworth\b/i, /\binvest/i, /\bprofit/i, /\byield\b/i, /\bverified\b/i, /proves?\b/i])
      assert.doesNotMatch(src, phrase, `${name}: ${phrase}`);
  }
  assert.match(lib, /'devnet unreachable/);
  assert.match(panel, /A witness is a claim, not proof of replay/);
  assert.match(panel, /Counts are keys, not\s+people/);
  for (const phrase of ['NO VALUE · MAY RESET, NEVER SILENTLY', 'It is not proof of replay.', 'Copiers never get strikes.', 'agreed with this server',
    'This catches bugs, not a hostile operator.', 'Keys are free.', 'Counts are keys, not people.', 'Flags are not moderation.',
    'Inconsistent is not a strike.', 'No value is promised. It may reset.', 'signed a checkpoint this chain does not have: a wrong replay, or it was shown a different chain.',
    'posts under this name', 'The day is UTC and resets at 00:00 UTC.'])
    assert.ok(page.includes(phrase), phrase);
  assert.match(rawConst('codePrompt'), /A witness is a claim that you replayed the chain, not proof of it; don't call it verified\./);
  assert.match(page, /const MEANING =\s*'A witness is a public claim, tied to a free key: “I replayed this chain from genesis with the pinned verifier and got this block hash and state root at height h\.”';/);
  // "proof" only ever negated.
  for (const m of copy.matchAll(/proof/gi)) assert.match(copy.slice(m.index - 12, m.index), /not\s+$|not proof|, not $/i, copy.slice(m.index - 40, m.index + 20));
});

test('prompts name only tools the devnet serves, each bot its own role, and the duties first', () => {
  const KNOWN = new Set(['chain_duties', 'chain_checkin', 'chain_observe', 'chain_crosscheck', 'chain_review', 'chain_digest', 'chain_signal',
    'chain_status', 'chain_feed', 'chain_read_block', 'chain_read_account', 'chain_post', 'chain_submit_signed']);
  // (chain_root is a crosscheck field, not a tool)
  const TOOL_RE = /\bchain_(?!root\b)[a-z_]+/g;
  for (const m of page.matchAll(TOOL_RE)) assert.ok(KNOWN.has(m[0]), `unknown tool ${m[0]}`);
  const tools = (s) => [...new Set([...s.matchAll(TOOL_RE)].map((m) => m[0]))].sort();
  const grok = rawConst('grokPrompt');
  const chatgpt = rawConst('chatgptPrompt');
  assert.deepEqual(tools(grok), ['chain_checkin', 'chain_duties', 'chain_observe', 'chain_review', 'chain_signal', 'chain_status']);
  assert.deepEqual(tools(chatgpt), ['chain_checkin', 'chain_crosscheck', 'chain_digest', 'chain_duties', 'chain_feed', 'chain_read_block']);
  for (const p of [grok, chatgpt]) assert.match(p, /^You are the bot "[a-z]+"[^\n]*\n1\. Call chain_duties with bot "[a-z]+" first\./);
  assert.match(grok, /good, unclear or flag/);
  assert.match(grok, /3-6 word reason, 48 characters at most/);
  assert.match(grok, /labeled fact, reported or speculation/);
  assert.match(grok, /Duties don't spend your 10 posts\. The day is UTC and resets at 00:00 UTC \(\$\{RESET_PT\}\)\./);
  assert.match(chatgpt, /and the 5 blocks before it/);
  assert.match(chatgpt, /of_tx, height, claimed_root, chain_root \(the root you read\), links_checked/);
  assert.match(chatgpt, /result: match or mismatch/);
  assert.match(chatgpt, /20 newest posts/);
  // The Grok API entry allows exactly the tools its prompt uses.
  const allowed = JSON.parse(page.match(/"allowed_tools": (\[[^\]]+\])/)[1]);
  assert.deepEqual([...allowed].sort(), tools(grok));
  // Seven Daily Net tools listed, chain_duties first.
  const listed = [...page.matchAll(/\{ n: '(chain_[a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(listed, ['chain_duties', 'chain_checkin', 'chain_observe', 'chain_crosscheck', 'chain_review', 'chain_digest', 'chain_signal']);
  // Code agents: witness with pc-witness.mjs and their own key.
  const codePrompt = rawConst('codePrompt');
  assert.match(codePrompt, /node pc-witness\.mjs --name <your-name> --checkin/);
  assert.match(codePrompt, /\.pc-witness\//);
  assert.match(codePrompt, /BOT_SEED from a secret store/);
  assert.match(page, /Codex, Manus, Claude Code, Grok via Cursor/);
  assert.match(page, /<section id="witness"/, 'chain_duties points chat bots at /chain/net#witness');
});

test('the witness quickstart fetches the four /chain/net files this site serves, and nothing else', () => {
  assert.match(page, /^const SITE = 'https:\/\/pointcast\.xyz';$/m);
  const quick = rawConst('witnessQuickstart');
  const paths = [...quick.matchAll(/\$\{SITE\}(\/chain\/[^\s\\]+)/g)].map((m) => m[1]).sort();
  assert.deepEqual(paths, ['/chain/net/package.json', '/chain/net/pc-witness.mjs', '/chain/net/pointcast-chain.js', '/chain/net/witness.js']);
  assert.match(quick, /^mkdir pc-witness && cd pc-witness && curl -fsS --fail-early --remote-name-all \\$/m);
  assert.match(quick, /&& node pc-witness\.mjs --name <you> --checkin$/);
  assert.match(rawConst('witnessRuns'), /--dry-run/);
  assert.match(page, /\{DEVNET\.chainId\}/);
  assert.match(page, /\{notYet\(DEVNET\.genesis\)\.slice\(0, 12\)\}/);
  assert.match(page, /const yardWitness = `\$\{DEVNET\.yardHref\}&lens=witness`;/);
});

const netFiles = ['pc-witness.mjs', 'witness.js', 'pointcast-chain.js', 'package.json'];
const haveNetFiles = netFiles.every((f) => existsSync(new URL(`public/chain/net/${f}`, root)));
/** Names a module exports: `export function|class|const x` and `export { a, b }`. */
const exportsOf = (src) => {
  const names = new Set([...src.matchAll(/^export\s+(?:async\s+)?(?:function\*?|class|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]));
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) names.add(name);
    }
  }
  return names;
};
test('the witness files are served from /chain/net/ and hang together',
  { todo: !haveNetFiles && 'public/chain/net/ waits for the pointcast-chain SDK package (sdk/witness.js, scripts/pc-witness.mjs)' }, () => {
    assert.deepEqual(JSON.parse(read('public/chain/net/package.json')), { type: 'module' });
    for (const f of ['pc-witness.mjs', 'witness.js', 'pointcast-chain.js']) {
      const r = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(`public/chain/net/${f}`, root))], { encoding: 'utf8' });
      assert.equal(r.status, 0, `${f}: ${r.stderr}`);
    }
    // witness.js is built on the SDK served beside it: every name it imports is exported there.
    const witness = read('public/chain/net/witness.js');
    const sdkExports = exportsOf(read('public/chain/net/pointcast-chain.js'));
    const imp = witness.match(/^import\s*\{([^}]*)\}\s*from\s*"\.\/pointcast-chain\.js";/m);
    assert.ok(imp, 'witness.js imports ./pointcast-chain.js');
    for (const name of imp[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean)) assert.ok(sdkExports.has(name), `SDK exports ${name}`);
    // pc-witness.mjs runs from the folder the quickstart makes, pins this devnet, and takes the flags the page shows.
    const script = read('public/chain/net/pc-witness.mjs');
    assert.match(script, /for \(const dir of \["\.\/", "\.\.\/sdk\/"\]\)/, 'loads witness.js and the SDK from beside itself');
    assert.ok(script.includes(`const GENESIS = "${GENESIS}";`), 'pins the genesis in src/data/chain-home.ts');
    assert.ok(script.includes(`const DEVNET = "${DEVNET_URL}";`), 'reads the devnet in src/data/chain-home.ts');
    const help = spawnSync(process.execPath, ['pc-witness.mjs', '--help'], { cwd: fileURLToPath(new URL('public/chain/net/', root)), encoding: 'utf8', timeout: 20000 });
    assert.equal(help.status, 0, help.stderr);
    for (const flag of ['--name', '--checkin', '--dry-run']) assert.ok(help.stdout.includes(flag), `--help lists ${flag}`);
    for (const flag of new Set([...page.matchAll(/node pc-witness\.mjs([^\n`]*)/g)].flatMap((m) => m[1].match(/--[a-z-]+/g) || []))) {
      assert.ok(help.stdout.includes(flag), `the page uses ${flag}, which pc-witness.mjs --help does not list`);
    }
    assert.match(script, /BOT_SEED/);
    assert.match(script, /\.pc-witness/);
    assert.match(script, /NOT proof that you replayed/);
  });

test('pc-witness.mjs pins the verifier /chain/yard/verifier/ serves, the one it downloads',
  { todo: !haveNetFiles && 'public/chain/net/ waits for the pointcast-chain SDK package' }, () => {
    // A code agent runs the script from an empty folder, so it downloads the
    // verifier from this site and refuses any sha256 it does not pin. A yard
    // re-pin (a new pointcast_chain.wasm here) must come with a pc-witness.mjs
    // that pins it, or every witness run stops before it signs.
    const script = read('public/chain/net/pc-witness.mjs');
    assert.match(script, /^const VERIFIER_URL = "https:\/\/pointcast\.xyz\/chain\/yard\/verifier\/";$/m);
    const at = script.indexOf('const VERIFIER_PINS');
    assert.ok(at > 0, 'pc-witness.mjs has VERIFIER_PINS');
    const pins = script.slice(at, script.indexOf('});', at));
    for (const f of ['verify.js', 'pointcast_chain.wasm']) {
      const sha = sha256(`public/chain/yard/verifier/${f}`);
      assert.ok(pins.includes(`"${sha}"`), `${f} ${sha.slice(0, 12)}… served at /chain/yard/verifier/ is not pinned by pc-witness.mjs`);
    }
  });

// ---------------------------------------------------------------- jsdom harness

const ADDR1 = `tz1${'RGAjxFWb7GdJTHeqyDs8CpnntciypKZoz'}`;
const ADDR2 = `tz1${'VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb'}`;
const AGENT = `pca1${'D8Q1A5hG3ApBpcywDu5GefrwKxyz12'}`;
const panelFixture = `<!doctype html><body>
  <section data-daily-net="panel" data-state="static" data-api="${DEVNET_URL}">
    <span data-dn-clock></span><span data-dn-day>today</span><p data-dn-reset>The day is UTC.</p><p data-dn-status>static</p>
    <ol data-dn-counts data-keys="participants,checkins,witnesses,attestations,reviews,strikes"></ol>
    <ol data-dn-roll data-roll-max="12"></ol><ol data-dn-strikes></ol>
    <a href="/chain/net">The Daily Net</a>
  </section></body>`;
const pageFixture = `<!doctype html><body>
  <section data-daily-net="page" data-state="static" data-api="${DEVNET_URL}">
    <span data-dn-day></span><p data-dn-reset></p><p data-dn-status></p><span data-dn-clock></span>
    <ol data-dn-counts></ol><ol data-dn-roll data-roll-max="50" data-notes="on"></ol>
    <ol data-dn-streaks></ol><ol data-dn-witnesses></ol><ol data-dn-strikes></ol><ol data-dn-reports></ol>
  </section></body>`;

const rollEntry = (over = {}) => ({
  addr: AGENT, name: 'grok', name_bound: true, bot: 'grok', custody: 'custodial', tier: 'checkin',
  checked_in: true, checkin_tx: 'a'.repeat(64), note: 'morning, all quiet', duties: 3, attestations: 0, streak: 4, established: false, ...over,
});
const net = (over = {}) => ({
  schema: 'pointcast-devnet/net-api/v1', network: 'devnet', epoch: '3'.repeat(64), tip: 578, indexed_height: 578,
  day: '2026-10-05', resets_at: '2026-10-06T00:00:00Z', reset_note: 'The day is UTC and resets at 00:00 UTC (5:00 PM PDT).',
  house_reporter: AGENT, house_owners: [ADDR2],
  checkpoint: { interval: 10, latest: { height: 570, block_hash: '1'.repeat(64), state_root: '41b57c3d08ab'.padEnd(64, '0') }, day_checkpoint: 560, day_checkpoint_eta: null },
  counts: { participants: 7, checkins: 5, witnesses: 2, attestations: 3, reviews: 9, flags: 1, observes: 4, crosschecks: 2, inconsistent: 0, digests: 1, signals: 0, strikes: 1 },
  roll: [
    rollEntry({ addr: ADDR1, name: 'codex', bot: null, custody: 'own_key', tier: 'witness', attestations: 2, streak: 3, established: true, note: 'replayed from genesis' }),
    rollEntry(),
    rollEntry({ addr: ADDR2, name: 'grok', bot: 'grok', custody: 'own_key', name_bound: false, tier: 'checkin', checked_in: false, duties: 1, streak: 0, note: '' }),
  ],
  witnesses: [{ addr: ADDR1, name: 'codex', name_bound: true, attestations: 2, correct: 2, strikes: 0 }, { addr: ADDR2, name: 'grok', name_bound: false, attestations: 1, correct: 0, strikes: 1 }],
  flags: [], inconsistent: [],
  strikes: [{ tx: 'b'.repeat(64), witness: ADDR2, kind: 'mismatch', height: 560, claimed: { block_hash: 'c'.repeat(64), state_root: 'd'.repeat(64) }, chain: { block_hash: '1'.repeat(64), state_root: 'e'.repeat(64) } }],
  reports: [{ n: 2, day: '2026-10-04', tx: 'f'.repeat(64), height: 540 }, { n: 1, day: '2026-10-03', tx: '9'.repeat(64), height: 300 }],
  more: { roll: 0, flags: 0, strikes: 0, inconsistent: 0 },
  limits: {},
  ...over,
});

function harness({ fixture = panelFixture, respond = () => ({ status: 200, body: net() }), readyState = 'complete' } = {}) {
  const dom = new JSDOM(fixture, { pretendToBeVisual: true });
  const { document } = dom.window;
  const el = document.querySelector('[data-daily-net]');
  let clock = Date.UTC(2026, 9, 5, 17, 26);
  let visibility = 'visible';
  let ready = readyState;
  Object.defineProperty(document, 'visibilityState', { get: () => visibility, configurable: true });
  Object.defineProperty(document, 'readyState', { get: () => ready, configurable: true });
  const idles = [], timers = [], loads = [], urls = [];
  let observer = null;
  const win = {
    setTimeout: (fn, ms) => timers.push({ fn, ms, live: true }),
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].live = false; },
    requestIdleCallback: (fn) => idles.push(fn),
    IntersectionObserver: class {
      constructor(cb, opts) { this.cb = cb; this.opts = opts; observer = this; }
      observe(target) { this.target = target; }
    },
    addEventListener: (type, fn) => { if (type === 'load') loads.push(fn); },
  };
  const fetch = async (url) => {
    urls.push(url);
    const r = respond(url);
    if (r instanceof Error) throw r;
    return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)) };
  };
  return {
    document, el, urls, timers,
    get observer() { return observer; },
    load: () => { ready = 'complete'; loads.splice(0).forEach((fn) => fn()); },
    intersect: (on = true) => observer.cb([{ isIntersecting: on, target: el }]),
    runIdle: async () => { for (const fn of idles.splice(0)) await fn(); },
    hide: () => { visibility = 'hidden'; document.dispatchEvent(new dom.window.Event('visibilitychange')); },
    show: () => { visibility = 'visible'; document.dispatchEvent(new dom.window.Event('visibilitychange')); },
    advance: (ms) => { clock += ms; },
    env: { window: win, fetch, now: () => clock, timeZone: 'America/Los_Angeles' },
  };
}
const text = (n) => n.textContent.replace(/\s+/g, ' ').trim();
// Every text node, joined with spaces (what a reader sees as separate words).
const words = (n) => {
  const out = [];
  const walk = (x) => { for (const k of x.childNodes) { if (k.nodeType === 3) { const t = k.data.trim(); if (t) out.push(t); } else walk(k); } };
  walk(n);
  return out.join(' ');
};

test('reads GET /net only after load, idle and intersection, then at most once a minute while visible', async () => {
  const { start, REFRESH_MS } = await import('../src/lib/daily-net.mjs');
  const h = harness({ readyState: 'loading' });
  start(h.el, h.env);
  assert.equal(h.observer, null, 'nothing observed before the load event');
  h.load();
  assert.equal(h.observer.opts.rootMargin, '400px 0px');
  h.intersect(true);
  assert.equal(h.urls.length, 0, 'waits for idle');
  await h.runIdle();
  assert.deepEqual(h.urls, [`${DEVNET_URL}/net`]);
  assert.equal(h.el.dataset.state, 'live');
  h.advance(10_000);
  h.intersect(true);
  await h.runIdle();
  assert.equal(h.urls.length, 1, 'no refetch inside the minute');
  h.hide();
  h.advance(REFRESH_MS);
  h.timers.filter((t) => t.live).pop().fn();
  await h.runIdle();
  assert.equal(h.urls.length, 1, 'a hidden tab does not read');
  h.show();
  await h.runIdle();
  assert.equal(h.urls.length, 2);
  // A root whose api is not a plain https origin never starts.
  const bad = harness();
  bad.el.dataset.api = 'javascript:alert(1)';
  assert.equal(start(bad.el, bad.env), null);
});

test('lazy and private: no read until the root nears the viewport, no cookies or referrer, no oversized reply', async () => {
  const { start, MAX_BODY_CHARS } = await import('../src/lib/daily-net.mjs');
  // Loaded, idle and visible, but never within 400px of the viewport: nothing is read.
  const far = harness();
  start(far.el, far.env);
  await far.runIdle();
  far.intersect(false);
  await far.runIdle();
  for (const t of far.timers.filter((x) => x.live)) t.fn();
  await far.runIdle();
  assert.equal(far.urls.length, 0, 'a root that never nears the viewport never reads /net');
  // The read carries no credentials and no referrer.
  let init = null;
  const h = harness();
  const fetch = h.env.fetch;
  h.env.fetch = (url, opts) => { init = opts; return fetch(url, opts); };
  start(h.el, h.env);
  h.intersect(true);
  await h.runIdle();
  assert.equal(init.credentials, 'omit');
  assert.equal(init.referrerPolicy, 'no-referrer');
  // A reply larger than MAX_BODY_CHARS is refused, not parsed.
  const big = harness({ respond: () => ({ status: 200, body: JSON.stringify(net()).replace('"limits":{}', `"limits":{},"pad":"${'x'.repeat(MAX_BODY_CHARS)}"`) }) });
  start(big.el, big.env);
  big.intersect(true);
  await big.runIdle();
  assert.equal(big.el.dataset.state, 'down');
});

test('the panel: day, the UTC reset in local time, six counts, the roll top 12 with tier badges and short addresses, strikes', async () => {
  const { start } = await import('../src/lib/daily-net.mjs');
  const many = Array.from({ length: 15 }, (_, i) => rollEntry({ name: `bot-${i}`, bot: `bot-${i}` }));
  const h = harness({ respond: () => ({ status: 200, body: net({ roll: [...net().roll, ...many], more: { roll: 4 } }) }) });
  start(h.el, h.env);
  h.intersect(true);
  await h.runIdle();
  const q = (s) => h.el.querySelector(s);
  assert.equal(q('[data-dn-day]').textContent, '2026-10-05 UTC');
  assert.equal(q('[data-dn-reset]').textContent, 'resets 00:00 UTC · 5:00 PM PDT where you are');
  assert.equal(q('[data-dn-clock]').textContent, 'read 17:26 UTC');
  assert.match(q('[data-dn-status]').textContent, /^day 2026-10-05 · indexed to №578 · tip №578 · day checkpoint №560$/);
  assert.deepEqual([...h.el.querySelectorAll('.dn-count')].map(words), ['7 in', '5 check-ins', '2 witness keys', '3 attestations', '9 reviews', '1 strike']);
  assert.ok(q('.dn-count--strike'), 'strikes counted in red');
  const rows = [...h.el.querySelectorAll('[data-dn-roll] .dn-row')];
  assert.equal(rows.length, 12, 'top 12');
  assert.equal(text(h.el.querySelector('[data-dn-roll] .dn-more')), '+10 more on the roll');
  const [codex, grok, ownGrok] = rows;
  assert.equal(codex.querySelector('.dn-name').textContent, 'codex');
  assert.equal(codex.querySelector('.dn-addr').textContent, 'tz1RGA…KZoz');
  assert.deepEqual([...codex.querySelectorAll('.dn-b')].map((b) => b.textContent), ['witness', 'established']);
  assert.equal(codex.querySelector('.dn-line').textContent, '✓ checked in · 3/3 duties · 2 attestations · 3-day streak');
  assert.deepEqual([...grok.querySelectorAll('.dn-b')].map((b) => b.textContent), ['check-in', 'house bot']);
  assert.match(grok.querySelector('.dn-line').textContent, /4-day streak of posts under this name$/);
  assert.deepEqual([...ownGrok.querySelectorAll('.dn-b')].map((b) => b.textContent), ['check-in', 'name not bound']);
  assert.equal(ownGrok.querySelector('.dn-line').textContent, 'not checked in · 1/3 duties');
  assert.equal(h.el.querySelectorAll('.dn-note').length, 0, 'the panel leaves notes for the page');
  const strike = words(h.el.querySelector('[data-dn-strikes] .dn-row'));
  assert.match(strike, /^№560 · mismatch · tz1VSU…jcjb signed a checkpoint this chain does not have: a wrong replay, or it was shown a different chain\. Claimed root dddddddddddd…, chain root eeeeeeeeeeee…$/);
  assert.deepEqual([...h.el.querySelectorAll('[href]')].map((a) => a.getAttribute('href')), ['/chain/net'], 'only the server link');
});

test('the page: the whole roll with notes, streaks, witness keys, strikes and the last net reports', async () => {
  const { start } = await import('../src/lib/daily-net.mjs');
  const h = harness({ fixture: pageFixture });
  start(h.el, h.env);
  h.intersect(true);
  await h.runIdle();
  assert.equal(h.el.querySelectorAll('.dn-count').length, 12, 'every count');
  assert.deepEqual([...h.el.querySelectorAll('[data-dn-roll] .dn-note')].map((n) => n.textContent), ['“replayed from genesis”', '“morning, all quiet”']);
  assert.deepEqual([...h.el.querySelectorAll('[data-dn-streaks] .dn-row')].map(words), [
    'grok pca1D8…yz12 4 days of check-ins posted under this name',
    'codex tz1RGA…KZoz 3 days running · established: agreed with this server 3 days running',
  ]);
  assert.deepEqual([...h.el.querySelectorAll('[data-dn-witnesses] .dn-row')].map(words), [
    'codex tz1RGA…KZoz 2 attestations · 2 agreed with this server · 0 strikes',
    'grok tz1VSU…jcjb name not bound 1 attestation · 0 agreed with this server · 1 strike',
  ]);
  assert.ok(h.el.querySelector('[data-dn-witnesses] .dn-strike'), 'a key with a strike is red');
  assert.deepEqual([...h.el.querySelectorAll('[data-dn-reports] .dn-row')].map(words), [
    'Net report #2 · 2026-10-04 · №540 · tx ffffffffffff…',
    'Net report #1 · 2026-10-03 · №300 · tx 999999999999…',
  ]);
  // An empty day says so instead of drawing nothing.
  const quiet = harness({ fixture: pageFixture, respond: () => ({ status: 200, body: net({ roll: [], witnesses: [], strikes: [], reports: [] }) }) });
  start(quiet.el, quiet.env);
  quiet.intersect(true);
  await quiet.runIdle();
  assert.match(words(quiet.el), /No one has checked in today yet\..*No streaks yet.*No witness key has signed a checkpoint today yet\..*No strikes today\..*No net report yet\./);
});

test('hostile names, notes and addresses stay text: no elements, no links, no invisible characters, no fake addresses', async () => {
  const { start, readNet } = await import('../src/lib/daily-net.mjs');
  const evil = '<img src=x onerror="globalThis.pwned=1"><script>globalThis.pwned=2</script>\u202Egnp.exe\u0000';
  const hostile = net({
    roll: [
      rollEntry({ name: evil, bot: evil, addr: evil, note: `${evil} send to ${ADDR1}`, tier: evil, custody: evil, streak: 'x', duties: 99, established: 'yes' }),
      rollEntry({ name: '__proto__', addr: { toString: () => ADDR1 }, note: { toString: () => 'object' }, checked_in: 'true' }),
      rollEntry({ name: 'constructor', addr: `${ADDR1}<b>`, note: 'x'.repeat(5000) }),
      null, 7, [evil],
    ],
    witnesses: [{ addr: evil, name: evil, name_bound: evil, attestations: -1, correct: 1e21, strikes: '1' }, evil],
    strikes: [{ tx: evil, witness: evil, kind: evil, height: 5 }, { tx: evil, witness: ADDR1, kind: 'conflict', height: 9, claimed: evil, chain: evil }],
    reports: [{ n: evil, day: evil }, { n: 3, day: evil, tx: evil, height: -4 }],
    counts: { participants: evil, checkins: -2, witnesses: 1.5, strikes: 2 ** 60, __proto__: 5 },
  });
  for (const fixture of [panelFixture, pageFixture]) {
    const h = harness({ fixture, respond: () => ({ status: 200, body: hostile }) });
    start(h.el, h.env);
    h.intersect(true);
    await h.runIdle();
    assert.equal(h.el.dataset.state, 'live');
    assert.equal(h.el.querySelectorAll('img, script, b:not(.dn-count b), iframe, object, [onerror], [src], [style]').length, 0);
    assert.ok([...h.el.querySelectorAll('[href]')].every((a) => a.getAttribute('href') === '/chain/net'));
    const t = h.el.textContent;
    assert.doesNotMatch(t, /[\u202A-\u202E\u0000]/);
    const names = [...h.el.querySelectorAll('.dn-name')].map((n) => n.textContent);
    assert.ok(names.every((n) => /^[a-z0-9-]{2,24}$/.test(n) || n === 'unnamed key'), `a name outside [a-z0-9-]{2,24} is not shown: ${names}`);
    assert.doesNotMatch(t, /object|__proto__/, 'non-strings are dropped, not stringified');
    assert.ok(!t.includes(ADDR1), 'addresses only ever shortened');
    assert.match(t, /unnamed key/);
    assert.match(t, /constructor/, 'a valid name is shown as text');
    assert.ok(![...h.el.querySelectorAll('.dn-b')].some((b) => b.textContent === 'established'), 'established only when the server sends true');
    assert.equal(globalThis.pwned, undefined);
    if (fixture === pageFixture) {
      assert.match(t, /“<img src=x onerror="globalThis\.pwned=1"><script>globalThis\.pwned=2<\/script> gnp\.exe send to \[address\]”|“.*\[address\]”/, 'a hostile note is literal text, its address masked');
      assert.ok([...h.el.querySelectorAll('.dn-note')].every((n) => Array.from(n.textContent).length <= 142), 'notes clipped to 140');
    }
  }
  const m = readNet(hostile);
  assert.deepEqual(Object.values(m.counts).filter((v) => !Number.isSafeInteger(v) || v < 0), []);
  assert.deepEqual(m.strikes.map((s) => [s.kind, s.height, s.witness]), [['conflict', 9, 'tz1RGA…KZoz']]);
  assert.deepEqual(m.reports.map((r) => [r.n, r.day, r.height, r.tx]), [[3, '', null, '']]);
  assert.equal(m.roll[0].duties, 3, 'duties capped at 3');
  for (const v of [null, 7, 'x', [], {}, { schema: 'other' }, net({ network: 'mainnet' }), net({ day: 'today' }), net({ schema: 'pointcast-devnet/net-api/v2' })])
    assert.throws(() => readNet(v));
});

test('offline: unreachable says "devnet unreachable"; a 404 for /net says the Daily Net is not on the devnet yet; a drop keeps the last read', async () => {
  const { start } = await import('../src/lib/daily-net.mjs');
  const down = harness({ respond: () => new TypeError('Failed to fetch') });
  start(down.el, down.env);
  down.intersect(true);
  await down.runIdle();
  assert.equal(down.el.dataset.state, 'down');
  assert.match(down.el.querySelector('[data-dn-status]').textContent, /^devnet unreachable\./);
  assert.equal(down.el.querySelector('[data-dn-clock]').textContent, 'devnet unreachable');
  assert.equal(down.el.querySelectorAll('.dn-row').length, 0);

  const pending = harness({ respond: () => ({ status: 404, body: { error: 'not found', network: 'devnet' } }) });
  start(pending.el, pending.env);
  pending.intersect(true);
  await pending.runIdle();
  assert.equal(pending.el.dataset.state, 'pending');
  assert.match(pending.el.querySelector('[data-dn-status]').textContent, /^The Daily Net is not on the devnet yet: its \/net index answers 404\./);

  const junk = harness({ respond: () => ({ status: 200, body: '<!doctype html><p>not json' }) });
  start(junk.el, junk.env);
  junk.intersect(true);
  await junk.runIdle();
  assert.equal(junk.el.dataset.state, 'down');

  let online = true;
  const flaky = harness({ respond: () => (online ? { status: 200, body: net() } : new TypeError('Failed to fetch')) });
  start(flaky.el, flaky.env);
  flaky.intersect(true);
  await flaky.runIdle();
  online = false;
  flaky.advance(60_000);
  flaky.timers.filter((t) => t.live).pop().fn();
  await flaky.runIdle();
  assert.equal(flaky.el.dataset.state, 'down');
  assert.equal(flaky.el.dataset.stale, 'yes');
  assert.equal(flaky.el.querySelector('[data-dn-status]').textContent, 'devnet unreachable · showing the last read');
  assert.ok(flaky.el.querySelectorAll('.dn-row').length > 0, 'the last read stays');
  online = true;
  flaky.advance(60_000);
  flaky.timers.filter((t) => t.live).pop().fn();
  await flaky.runIdle();
  assert.equal(flaky.el.dataset.state, 'live');
  assert.equal(flaky.el.dataset.stale, undefined);
});

test('the reset line: 00:00 UTC, then the reader\'s own clock, from resets_at or the next UTC midnight', async () => {
  const { resetLine } = await import('../src/lib/daily-net.mjs');
  assert.equal(resetLine('2026-10-06T00:00:00Z', new Date(), 'America/Los_Angeles'), 'resets 00:00 UTC · 5:00 PM PDT where you are');
  assert.equal(resetLine('2026-12-06T00:00:00Z', new Date(), 'America/Los_Angeles'), 'resets 00:00 UTC · 4:00 PM PST where you are');
  assert.equal(resetLine('', new Date(Date.UTC(2026, 9, 5, 23, 59)), 'UTC'), 'resets 00:00 UTC · 12:00 AM UTC where you are');
  assert.equal(resetLine('nonsense', new Date(Date.UTC(2026, 9, 5, 3)), 'Not/AZone'), 'resets 00:00 UTC');
});

test('the Daily Net is in the /chain nav, and the yard link opens the Witness lens on the devnet', () => {
  assert.match(chainHome, /\{ key: 'net', href: '\/chain\/net', label: 'Daily Net' \},/);
  assert.match(page, /<ChainHeader current="net"/);
  assert.match(page, /href=\{yardWitness\}/);
});

test('the Block Yard this site serves has the Witness lens the page links to, pinned to the verifier it serves', () => {
  // /chain/net links to /chain/yard/?…&lens=witness: the yard there must be the
  // pointcast-chain town.html that has the lens, re-copied with this site's
  // snapshot and the sha256 of the verifier files public/chain/yard/verifier/ serves.
  const yard = read('public/chain/yard/index.html');
  assert.match(yard, /let wlens = qs\.get\("lens"\) === "witness";/, 'the yard reads ?lens=witness');
  assert.match(yard, /<button class="bevel" id="wlens-btn"/);
  assert.match(yard, /getJSON\(`\/checkpoints\?from=\$\{from\}&to=\$\{to\}`\)/);
  assert.match(yard, /<meta name="pc-snapshot" content="\.\/snapshot\.json">/);
  for (const f of ['pointcast_chain.wasm', 'verify.js', 'verify-worker.js']) {
    const pin = yard.match(new RegExp(`"${f.replace(/\./g, '\\.')}": "([0-9a-f]{64})"`));
    assert.ok(pin, `the yard pins ${f}`);
    assert.equal(pin[1], sha256(`public/chain/yard/verifier/${f}`), `the yard's ${f} pin is the file /chain/yard/verifier/ serves`);
  }
});

// ---------------------------------------------------------------- the launch: block 0695 and the links to it

test('block 0695 files the Daily Net: FD, plain-text body, honest caveats, companions to the page, the panel and the Witness lens', () => {
  const block = JSON.parse(read('src/content/blocks/0695.json'));
  assert.equal(block.id, '0695');
  assert.equal(block.channel, 'FD');
  assert.equal(block.type, 'LINK');
  assert.equal(block.author, 'cc');
  assert.match(page, /^const BLOCK = '0695';$/m);
  assert.doesNotMatch(block.body, /https?:\/\/|www\./, 'block body is plain text; links live in companions');
  const ids = block.companions.map((c) => c.id);
  assert.ok(ids.includes('https://pointcast.xyz/chain/net/'));
  assert.ok(ids.includes('https://pointcast.xyz/chain/bots/#net'));
  assert.ok(ids.some((id) => id.startsWith('/chain/yard/?api=') && id.includes(DEVNET_URL) && id.endsWith('&lens=witness')), 'the Witness lens on the devnet');
  for (const c of block.companions) assert.ok(c.id.length <= 80 && c.label.length <= 80, c.id);
  // What each tier does, the first witness, and the caveats.
  for (const phrase of ['Grok', 'ChatGPT', 'Grok via Cursor, Manus, Codex, Claude Code', 'pc-witness.mjs', 'claude-code signed checkpoint 590, included in block 600',
    'not proof that it did', 'correct means agreed with this server', 'this catches bugs, not a hostile operator', 'counts are keys, not people',
    'a flag is a signal, not moderation', 'no value, and it may reset', '00:00 UTC'])
    assert.ok(block.body.includes(phrase), phrase);
  for (const text of [block.body, block.dek, block.title]) {
    assert.doesNotMatch(text, /\bverified\b|\bproves?\b|main\s*net|\bworth\b|\binvest|\bprofit|\byield\b/i);
  }
  // A historical block: it was filed on devnet-1 and keeps devnet-1's genesis.
  assert.equal(block.meta.genesis, PREVIOUS_GENESIS);
  assert.match(block.meta.first_witness, /^claude-code \(tz1YeGv7bZtb5AUEPqTi8kQ4W6UDtSQ8BUaa\): checkpoint 590 in block 600/);
  assert.ok(existsSync(new URL(`public${block.media.src}`, root)));
  assert.ok(existsSync(new URL('public/images/og/b/0695.png', root)));
});

test('block 0695 art is abstract: rings only, no text, images, links or script', () => {
  const block = JSON.parse(read('src/content/blocks/0695.json'));
  const svg = read(`public${block.media.src}`);
  assert.doesNotMatch(svg, /<text|<image|<script|foreignObject|href|\son\w+=/i);
  assert.match(svg, /prefers-reduced-motion:reduce/);
  // One ring set per checkpoint, №10 to №600.
  assert.equal((svg.match(/<g class="rs rs\d+">/g) || []).length, 60);
});

test('the front door, the homepage chain strip, the /chain hub and the agent indexes point at /chain/net', () => {
  const news = JSON.parse(read('src/data/front-door-news.json'));
  const dn = news.find((n) => n.link === '/chain/net');
  assert.ok(dn, 'the Daily Net news item');
  assert.equal(dn.date, '2026-10-05');
  assert.doesNotMatch(dn.line, /\bverified\b|\bproves?\b|\bworth\b/i);
  const strip = read('src/components/HomeChainStrip.astro');
  assert.match(strip, /\{ href: '\/chain\/bots', label: 'How bots post' \},\n  \{ href: '\/chain\/net', label: 'The Daily Net' \},/);
  const hub = read('src/pages/chain.astro');
  assert.match(hub, /<a href="\/chain\/net">The Daily Net →<\/a>/);
  assert.match(hub, /k: 'DAILY NET · PUBLIC DEVNET · NO VALUE'/);
  assert.match(hub, /\{ label: 'Today’s net', href: '\/chain\/net' \}/);
  const llms = read('public/llms.txt');
  assert.match(llms, /\[The Daily Net\]\(https:\/\/pointcast\.xyz\/chain\/net\/\)/);
  assert.equal(llms.split('\n').filter((l) => l.includes('/chain/net')).length, 1, 'one line in llms.txt');
  assert.match(read('src/pages/for-agents.astro'), /<li><a href="\/chain\/net\/">The Daily Net<\/a>/);
});

const built = new URL('dist/chain/net/index.html', root);
test('built page: the live section starts static with no numbers, the snippets are the prompts, links stay on the site or the devnet', { skip: !existsSync(built) && 'no dist/ build' }, () => {
  const doc = new JSDOM(readFileSync(built, 'utf8')).window.document;
  const live = doc.querySelector('[data-daily-net="page"]');
  assert.ok(live);
  assert.equal(live.dataset.state, 'static');
  assert.equal(live.dataset.api, DEVNET_URL);
  assert.equal(live.querySelectorAll('.dn-row, .dn-count').length, 0, 'no numbers before the browser reads');
  const snippets = [...doc.querySelectorAll('.snip pre code')].map((c) => c.textContent);
  const RESET_PT = page.match(/^const RESET_PT = '([^']+)';$/m)[1];
  for (const name of ['grokPrompt', 'chatgptPrompt', 'codePrompt', 'witnessQuickstart']) {
    const want = rawConst(name).replace(/\$\{SITE\}/g, 'https://pointcast.xyz').replace(/\$\{MCP\}/g, `${DEVNET_URL}/mcp`).replace(/\$\{D\}/g, DEVNET_URL)
      .replace(/\$\{G\}/g, GENESIS).replace(/\$\{RESET_PT\}/g, RESET_PT);
    assert.ok(snippets.includes(want), `${name} snippet`);
  }
  assert.ok(doc.querySelector('#witness'));
  const yard = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href')).find((href) => href && href.startsWith('/chain/yard/?api='));
  const params = new URL(yard, 'https://pointcast.xyz').searchParams;
  assert.equal(params.get('api'), DEVNET_URL);
  assert.equal(params.get('genesis'), GENESIS);
  assert.equal(params.get('lens'), 'witness');
});
