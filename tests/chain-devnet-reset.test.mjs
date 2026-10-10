// The devnet reset (block 0700): devnet-1 → devnet-2.
//
// What this suite holds:
//   - the launch pins live in ONE place (src/data/chain-home.ts) and every
//     surface reads them; no test or page types a devnet-2 genesis;
//   - the site build fails while a pin is a placeholder;
//   - the notice says the reset happened only with a date, is dated
//     absolutely, and ends exactly 7 days later;
//   - the devnet-1 recording is linked only when its files are there (the
//     recording half SKIPS while public/chain/yard/devnet-1/ is absent);
//   - the copy is honest: no value is promised, may reset, a witness is a claim,
//     keyless bots are custodial, the shared root key is said.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  DEVNET,
  DEVNET_2_GENESIS,
  DEVNET_2_PROFILE,
  DEVNET_CAN,
  DEVNET_CANNOT,
  DEVNET_NEEDS_NODE,
  DEVNET_PREVIOUS,
  NOTICE_END_DATE,
  PLACEHOLDER,
  RESET,
  RESET_DATE,
  SHARED_ROOT_LINE,
  VERIFIER_RECORDS,
  addDays,
  assertDevnetLaunchPinned,
  devnet1Recording,
  devnetLaunchGaps,
  presenceLine,
  resetNoticeShown,
} from '../src/data/chain-home.ts';
import { etaText, sealRate } from '../src/lib/rotation-eta.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const has = (p) => existsSync(new URL(p, root));
const HEX64 = /^[0-9a-f]{64}$/;
const launched = devnetLaunchGaps().length === 0;

const home = read('src/data/chain-home.ts');
const notice = read('src/components/chain/ResetNotice.astro');
const bots = read('src/pages/chain/bots.astro');
const net = read('src/pages/chain/net.astro');
const yardPage = read('src/pages/chain/yard/devnet-1/index.astro');
const fm = read('public/chain/first-mints/index.html');
const live = read('public/chain/first-mints/live.js');
const blockRaw = read('src/content/blocks/0700.json');
const block = JSON.parse(blockRaw);
const strip = JSON.parse(read('src/data/new-today.json'));
const news = JSON.parse(read('src/data/front-door-news.json'));

test('the live devnet is devnet-2, and devnet-1 is the previous chain', () => {
  assert.equal(DEVNET.chainId, 'pointcast-devnet-2');
  assert.equal(DEVNET.epoch, 'devnet-2');
  assert.equal(DEVNET.label, 'devnet-2 · bot · unmoderated');
  assert.equal(DEVNET.terms, 'no value is promised · may reset');
  assert.equal(DEVNET.genesis, DEVNET_2_GENESIS, 'DEVNET reads the one pin');
  assert.equal(DEVNET_PREVIOUS.chainId, 'pointcast-devnet-1');
  assert.match(DEVNET_PREVIOUS.genesis, HEX64);
  assert.notEqual(DEVNET.genesis, DEVNET_PREVIOUS.genesis, 'a new chain cannot carry devnet-1’s genesis');
  assert.equal(DEVNET_PREVIOUS.url, 'https://pointcast.xyz/chain/yard/devnet-1/');
  assert.equal(DEVNET_PREVIOUS.startedOn, '2026-10-03');
  assert.ok(DEVNET.yardHref.includes(`genesis=${DEVNET.genesis}`));
});

test('each launch pin is one constant with a TODO, and nothing else holds a devnet-2 genesis', () => {
  for (const name of ['DEVNET_2_GENESIS', 'RESET_DATE', 'NOTICE_END_DATE', 'DEVNET_1_TIP', 'DEVNET_1_RECORDED_AT', 'PRESENCE_FLIP']) {
    assert.equal((home.match(new RegExp(`^export const ${name}\\b`, 'gm')) ?? []).length, 1, `${name} is declared once`);
  }
  assert.match(home, /TODO\(orchestrator\): 64-hex genesis_hash/);
  // This test never types a genesis: it reads both from the module.
  assert.doesNotMatch(read('tests/chain-devnet-reset.test.mjs'), /\b[0-9a-f]{64}\b/);
  // Pages and the component print the pin through DEVNET; a hash written as a genesis may only be
  // devnet-1's (a tx hash elsewhere in a page is not a chain pin).
  for (const [p, src] of [['notice', notice], ['bots', bots], ['net', net], ['yard', yardPage], ['block', blockRaw], ['live.js', live]]) {
    for (const [, hex] of src.matchAll(/genesis[^0-9a-f]{0,24}([0-9a-f]{64})/gi)) {
      assert.ok(hex === DEVNET_PREVIOUS.genesis || hex === DEVNET_2_GENESIS, `${p} carries a stray 64-hex ${hex.slice(0, 12)}`);
    }
  }
});

test('the build fails while any pin is a placeholder', () => {
  const gaps = devnetLaunchGaps();
  const saved = process.env.PC_DEVNET_PLACEHOLDER_OK;
  delete process.env.PC_DEVNET_PLACEHOLDER_OK;
  try {
    if (gaps.length) assert.throws(() => assertDevnetLaunchPinned(), /launch pins are still placeholders/);
    else assert.doesNotThrow(() => assertDevnetLaunchPinned());
  } finally {
    if (saved !== undefined) process.env.PC_DEVNET_PLACEHOLDER_OK = saved;
  }
  // Every page that shows devnet-2 calls the guard.
  for (const [p, src] of [['bots', bots], ['net', net], ['yard', yardPage], ['chain', read('src/pages/chain.astro')]]) {
    assert.match(src, /^assertDevnetLaunchPinned\(\);$/m, p);
  }
});

test('dates are absolute; the notice ends exactly 7 days after the reset and then hides', () => {
  assert.equal(addDays('2026-10-09', 7), '2026-10-16');
  assert.equal(addDays('2026-10-30', 7), '2026-11-06');
  if (RESET_DATE === PLACEHOLDER) {
    assert.equal(resetNoticeShown('2026-10-08'), false, 'no date, no "was reset" notice');
    return;
  }
  assert.match(RESET_DATE, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(NOTICE_END_DATE, addDays(RESET_DATE, 7));
  assert.equal(resetNoticeShown(RESET_DATE), true);
  assert.equal(resetNoticeShown(NOTICE_END_DATE), true);
  assert.equal(resetNoticeShown(addDays(NOTICE_END_DATE, 1)), false);
});

test('the notice: one component on both pages, the exact words, hidden client-side after the end date', () => {
  for (const [name, page] of [['bots', bots], ['net', net]]) {
    assert.match(page, /import ResetNotice from '\.\.\/\.\.\/components\/chain\/ResetNotice\.astro';/, name);
    assert.equal((page.match(/<ResetNotice \/>/g) ?? []).length, 1, name);
    assert.match(page, /<a href="#reset">/, name);
  }
  assert.equal(RESET.headline, `The devnet was reset on ${RESET_DATE}.`);
  assert.equal(RESET.recordingLine, `devnet-1 (#1–#${DEVNET_PREVIOUS.tip}, 2026-10-03 → ${RESET_DATE}) is recorded and checkable here →`);
  assert.match(notice, /The devnet was reset on \{notYet\(RESET\.date\)\}\./);
  assert.match(notice, /is recorded and checkable here →/);
  assert.match(notice, /data-until=\{RESET\.noticeEnd\}/);
  assert.match(notice, /el\.hidden = true/);
  assert.match(notice, /resetNoticeShown\(\)/);
  for (const [k] of RESET.effects) assert.ok(k.length > 0);
  assert.ok(RESET.effects.some(([, v]) => /genesis_reset/.test(v)), 'the stale-nonce error is named');
  assert.ok(RESET.effects.some(([, v]) => /same name/.test(v)), 'keyless bots re-register under the same name');
});

test('what you can do now: §4, gated where the SPEC gates it', () => {
  const whats = DEVNET_CAN.map((c) => c.what).join(' | ');
  for (const need of ['bot', 'passkey wallet', 'First Mint', 'controller', 'time capsule', 'station', 'rotation', 'Daily Net']) {
    assert.ok(whats.toLowerCase().includes(need.toLowerCase()), need);
  }
  const mint = DEVNET_CAN.find((c) => /First Mint/.test(c.what));
  assert.match(mint.gate, /edition is open and the attestor is set/);
  assert.match(DEVNET_CAN.find((c) => /passkey/.test(c.what)).how, /only on pointcast\.xyz/);
  assert.match(DEVNET_CAN.find((c) => /bot/.test(c.what)).how, /custodial/);
  assert.match(DEVNET_CAN.find((c) => /controller/.test(c.what)).how, /clears passes/);
  // VERIFY only when CI proved the records decode.
  assert.ok(!DEVNET_CAN.some((c) => /VERIFY/.test(c.what)));
  assert.match(bots, /VERIFIER_RECORDS \? \[\.\.\.DEVNET_CAN, DEVNET_CAN_VERIFY\] : DEVNET_CAN/);
  assert.equal(typeof VERIFIER_RECORDS, 'boolean');
  assert.equal(DEVNET_NEEDS_NODE.length, 6);
  assert.ok(DEVNET_CANNOT.some((c) => /No value is promised/.test(c)));
  assert.ok(DEVNET_CANNOT.some((c) => /may reset/.test(c)));
});

test('presence copy covers both findings and says which is unknown', () => {
  assert.match(presenceLine(), /Open on devnet-2/);
  assert.match(home, /Ticketed later by an admin transaction, with no reset/);
  assert.match(home, /devnet-2 will be reset again when that happens/);
});

test('/chain/net: rotation ETA in blocks at the observed rate, and the shared-root line', () => {
  assert.equal(DEVNET_2_PROFILE.rotationDelayBlocks, 1200);
  assert.match(net, /id="rotation"/);
  assert.match(net, /SHARED_ROOT_LINE/);
  assert.match(SHARED_ROOT_LINE, /all come from one root key that Claude generated\. A rotation demo shows the mechanism, not security\./);
  assert.doesNotMatch(net, /1 hour/);
  const r = sealRate(1000, 0, 81.2 * 3_600_000);
  assert.ok(Math.abs(r - 12.315) < 0.01);
  assert.equal(etaText(1200, r), '1,200 blocks (≈ 4.1 days at the current rate)');
  assert.equal(etaText(1200, 1200), '1,200 blocks (≈ 1 h at the current rate)');
  assert.equal(etaText(1200, null), '1,200 blocks');
  assert.equal(sealRate(5, 0, 1), null);
});

test('/chain/bots says keyless bots are custodial', () => {
  assert.match(bots, /<b>Custodial\.<\/b> The house holds a keyless bot’s controllers\./);
  assert.match(bots, /id="accounts"/);
  assert.match(bots, /id="stations"/);
  assert.match(bots, /takes effect at once and clears every pass/);
});

test('First Mints: live minter, rp pointcast.xyz, off-origin notice, pinned SDK copies', () => {
  assert.match(fm, /data-rp="pointcast\.xyz"/);
  assert.match(fm, /data-origins="https:\/\/pointcast\.xyz"/);
  assert.match(fm, new RegExp(`data-chain="${DEVNET.chainId}"`));
  assert.match(fm, new RegExp(`data-genesis="${DEVNET.genesis}"`), 'pinned by scripts/pin-devnet-launch.mjs');
  assert.match(fm, /Passkeys work only on pointcast\.xyz\./);
  assert.match(fm, /<script type="module" src="\.\/live\.js"><\/script>/);
  assert.match(live, /if \(!cfg\.origins\.includes\(location\.origin\)\)/);
  assert.match(live, /rp: \{ id: cfg\.rpId/);
  assert.match(live, /confirm: async/);
  assert.doesNotMatch(live, /localStorage\.setItem\([^)]*secret|privateKey/i);
  const sha = (p) => createHash('sha256').update(readFileSync(new URL(p, root))).digest('hex');
  // pointcast-chain sdk/ at main 33a2ba9.
  assert.equal(sha('public/chain/first-mints/lib/pointcast-chain.js').slice(0, 16), '33bef6b76c98e5e2');
  assert.equal(sha('public/chain/first-mints/lib/first-mint.js').slice(0, 16), '43aa51b3f3fcb624');
});

test('bot downloads pin the same chain as the site', () => {
  assert.ok(read('public/chain/bots/bot.mjs').includes(`const CHAIN_ID = "${DEVNET.chainId}";`));
  assert.ok(read('public/chain/net/pc-witness.mjs').includes(`const CHAIN_ID = "${DEVNET.chainId}";`));
  for (const p of ['public/chain/bots/bot.mjs', 'public/chain/bots/verify.mjs', 'public/chain/net/pc-witness.mjs']) {
    assert.ok(read(p).includes(`const GENESIS = "${DEVNET.genesis}";`), p);
  }
});

test('the devnet-1 page is the index; the orchestrator copies only data into public/', () => {
  assert.ok(!has('public/chain/yard/devnet-1/index.html'), 'a public index.html would collide with src/pages/chain/yard/devnet-1/');
  assert.match(yardPage, /devnet1Recording\(\)/);
  assert.match(yardPage, /const title = `devnet-1 · \$\{DEVNET_PREVIOUS\.startedOn\} → \$\{notYet\(RESET\.date\)\}`;/);
  assert.match(yardPage, /The recording files are not in this build/);
});

test('devnet1Recording() refuses anything that is not devnet-1', () => {
  const dir = mkdtempSync(join(tmpdir(), 'd1-'));
  try {
    assert.equal(devnet1Recording(dir), null, 'absent');
    const snap = (genesis) => ({
      schema: 'pointcast-chain-snapshot/v1',
      source: { kind: 'devnet-recording', chain_id: 'pointcast-devnet-1', genesis, tip: 2, recorded_at: '2026-10-09T00:00:00Z' },
      status: { genesis_hash: genesis, height: 2, tip_hash: 'a'.repeat(64), state_root: 'b'.repeat(64) },
      blocks: [{ txs: [{}] }, { txs: [] }],
    });
    writeFileSync(join(dir, 'snapshot.json'), JSON.stringify(snap('c'.repeat(64))));
    assert.equal(devnet1Recording(dir), null, 'another chain');
    writeFileSync(join(dir, 'snapshot.json'), JSON.stringify(snap(DEVNET_PREVIOUS.genesis)));
    writeFileSync(join(dir, 'snapshot.sha256'), `${'d'.repeat(64)}  snapshot.json\n`);
    const r = devnet1Recording(dir);
    assert.equal(r.height, 2);
    assert.equal(r.txs, 1);
    assert.equal(r.sha256, 'd'.repeat(64));
    assert.equal(r.recordedAt, '2026-10-09');
    assert.ok(r.yardHref.endsWith(`&genesis=${DEVNET_PREVIOUS.genesis}`));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const haveRecording = has('public/chain/yard/devnet-1/snapshot.json');
test('the published devnet-1 recording matches its pins', { skip: !haveRecording && 'public/chain/yard/devnet-1/ not filled yet' }, () => {
  const rec = devnet1Recording();
  assert.ok(rec, 'snapshot.json is devnet-1’s own');
  assert.equal(rec.genesis, DEVNET_PREVIOUS.genesis);
  const sumFile = read('public/chain/yard/devnet-1/snapshot.sha256');
  const actual = createHash('sha256').update(readFileSync(new URL('public/chain/yard/devnet-1/snapshot.json', root))).digest('hex');
  assert.ok(sumFile.includes(actual), 'snapshot.sha256 matches snapshot.json');
  assert.ok(readFileSync(new URL('public/chain/yard/devnet-1/snapshot.json', root)).length <= 20 * 1024 * 1024, '≤ 20 MiB');
  const snap = JSON.parse(read('public/chain/yard/devnet-1/snapshot.json'));
  for (const s of snap.body_shards ?? []) {
    const buf = readFileSync(new URL(`public/chain/yard/devnet-1/${s.path}`, root));
    assert.equal(createHash('sha256').update(buf).digest('hex'), s.sha256, s.path);
    assert.ok(buf.length <= 5 * 1024 * 1024, `${s.path} ≤ 5 MiB`);
  }
  if (launched) {
    assert.equal(rec.height, DEVNET_PREVIOUS.tip, 'DEVNET_1_TIP is the recorded tip');
  }
});

test('block 0700 and the front door: one block, honest words, tokens filled at launch', () => {
  assert.equal(block.id, '0700');
  assert.equal(block.channel, 'FD');
  assert.equal(block.title, 'The devnet reset; devnet-1 is recorded');
  assert.match(block.body, /No value is promised · may reset\./);
  assert.match(block.body, /A witness is a claim, not proof\./);
  assert.match(block.body, /custodial/);
  assert.doesNotMatch(`${block.title} ${block.dek} ${block.body}`, /\bverified\b|\bproves?\b|main\s*net|\bworth\b|\binvest|\bprofit|\byield\b/i);
  assert.ok(block.companions.some((c) => c.id === DEVNET_PREVIOUS.url));
  assert.equal(block.meta.genesis_previous, DEVNET_PREVIOUS.genesis);
  // Abstract art, no text.
  const art = read(`public${block.media.src}`);
  assert.doesNotMatch(art, /<text|<tspan/);
  const item = strip.find((x) => x.block === '0700');
  assert.ok(item && item.link === '/chain/yard/devnet-1/');
  const line = news.find((x) => x.label === 'Devnet reset');
  assert.equal(line.link, '/chain/bots#reset', 'not the strip’s link: a fresh strip item stays out of front-door-news');
  assert.ok(line && /No value is promised · may reset\./.test(line.line));
  if (launched) {
    for (const s of [blockRaw, JSON.stringify(line)]) assert.doesNotMatch(s, /⟨[A-Z0-9_]+⟩/, 'scripts/pin-devnet-launch.mjs filled every token');
    assert.equal(block.timestamp.slice(0, 10), RESET_DATE);
    assert.equal(item.date, RESET_DATE);
    assert.equal(line.date, RESET_DATE);
    assert.equal(block.meta.genesis_now, DEVNET.genesis);
  } else {
    assert.match(blockRaw, /⟨RESET_DATE⟩/, 'unfilled until launch, never a made-up date');
  }
});

test('the next free block id was 0700 (no other block file claims it)', () => {
  assert.ok(has('src/content/blocks/0700.json'));
  assert.ok(!has('src/content/blocks/0701.json') || JSON.parse(read('src/content/blocks/0701.json')).id === '0701');
});

test('#reset stays a live anchor after the notice comes down (front-door news and page copy link to it)', () => {
  const idAt = notice.indexOf('id="reset"');
  const showAt = notice.indexOf('{show && (');
  assert.ok(idAt > -1 && showAt > -1 && idAt < showAt, 'id="reset" is outside the {show && …} conditional');
  assert.match(notice, /data-reset-after hidden=\{show\}/, 'a permanent recording line takes over after NOTICE_END_DATE');
  assert.match(notice, /removeAttribute\('hidden'\)/, 'and the browser shows it when it hides an old notice');
});

test('the rotation line does not claim a notice is pending on day one', () => {
  const rot = DEVNET_CAN.find((c) => /rotation/i.test(c.what));
  assert.ok(rot, 'rotation line present');
  assert.match(rot.gate ?? '', /only after the keys admin posts one/);
});
