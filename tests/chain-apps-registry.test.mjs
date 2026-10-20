// The seven apps on the devnet, as one registry (src/data/chain-apps.ts) and
// the places that read it: the /chain hub, the section nav and the apps row,
// the sitemap, the front door, public/llms.txt, public/llms-full.txt,
// /for-agents, the homepage chain strip and the wire block 0721 with its art.
//
// What this suite holds: every app has a page, a nav key, a path and one honest
// line; every place that lists the apps lists all seven with the same paths; the
// three apps that were merged in carry the same wire block as the four built
// here; llms.txt keeps its line count (the seven are one extra sentence on the
// existing chain line); the block is plain text with its links in companions;
// and the art has no text and no people.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { APPS_BLOCK, APPS_HEADLINE, CHAIN_APPS, HONESTY, appByKey } from '../src/data/chain-apps.ts';
import { CHAIN_NAV } from '../src/data/chain-home.ts';
import { bannedHits, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const KEYS = ['observatory', 'daily-mint', 'notary', 'capsules', 'verify-a-block', 'playground', 'bloom'];

test('the registry names seven apps, each with a page, a key, a path and one honest line', () => {
  assert.deepEqual(CHAIN_APPS.map((a) => a.key), KEYS);
  assert.equal(APPS_HEADLINE, 'Seven apps on the devnet');
  assert.equal(HONESTY, 'devnet · no value · may reset');
  assert.match(APPS_BLOCK, /^\d{4}$/);
  for (const a of CHAIN_APPS) {
    assert.equal(a.href, '/chain/' + a.key, a.key);
    assert.ok(existsSync(new URL('src/pages/chain/' + a.key + '.astro', root)), a.key + ' has a page');
    assert.match(read('src/pages/chain/' + a.key + '.astro'), new RegExp('<ChainHeader current="' + a.key + '"'), a.key + ' lights its own nav key');
    assert.ok(a.blurb.length > 60 && a.blurb.length < 260, a.key + ' blurb length ' + a.blurb.length);
    assert.ok(a.label.length > 3 && a.short.length > 3);
    assert.ok(['read', 'write'].includes(a.mode));
    assert.deepEqual(bannedHits(a.blurb), [], a.key);
    assert.deepEqual(currencyHits(a.blurb), [], a.key);
    assert.equal(appByKey(a.key), a);
  }
  // exactly the apps that can post say so
  assert.deepEqual(CHAIN_APPS.filter((a) => a.mode === 'write').map((a) => a.key), ['daily-mint', 'notary', 'capsules']);
  assert.equal(appByKey('nope'), undefined);
  // the honest claims in the blurbs
  assert.match(appByKey('daily-mint').blurb, /Play ATTN, no value\./);
  assert.match(appByKey('notary').blurb, /not anchored anywhere/);
  assert.match(appByKey('capsules').blurb, /lose the capsule file and it never opens/);
  assert.match(appByKey('observatory').blurb, /It only reads\./);
});

test('every app carries the wire block the registry names, and the three merged apps match the four built here', () => {
  const data = {
    observatory: ['src/data/chain-app-observatory.ts', /block: APPS_BLOCK/],
    'daily-mint': ['src/data/chain-app-daily-mint.ts', /block: APPS_BLOCK/],
    notary: ['src/data/chain-app-notary.ts', /block: APPS_BLOCK/],
    capsules: ['src/data/chain-app-capsules.ts', /block: APPS_BLOCK/],
    'verify-a-block': ['src/data/chain-app-verify.ts', new RegExp("block: '" + APPS_BLOCK + "'")],
    playground: ['src/data/chain-app-playground.ts', new RegExp("export const BLOCK = '" + APPS_BLOCK + "'")],
    bloom: ['src/data/chain-app-bloom.ts', new RegExp("export const BLOOM_BLOCK = '" + APPS_BLOCK + "'")],
  };
  for (const [k, [file, re]] of Object.entries(data)) assert.match(read(file), re, k);
  assert.ok(existsSync(new URL('src/content/blocks/' + APPS_BLOCK + '.json', root)), 'the block exists');
  assert.ok(existsSync(new URL('public/images/og/b/' + APPS_BLOCK + '.png', root)), 'and its OG card');
  assert.ok(existsSync(new URL('public/images/chain/apps.svg', root)), 'and its art');
  // no app page is left pointing at a placeholder block
  for (const a of CHAIN_APPS) for (const f of ['src/data/chain-app-' + a.key + '.ts']) if (existsSync(new URL(f, root))) assert.doesNotMatch(read(f), /TODO\(integrator\)|does not exist yet; the integrator sets it/, f);
});

test('the section nav has an Apps item, the apps row names all seven on an app page, and each app page lights both', () => {
  const nav = CHAIN_NAV.find((n) => n.key === 'apps');
  assert.deepEqual(nav, { key: 'apps', href: '/chain#apps', label: 'Apps' });
  const header = read('src/components/chain/ChainHeader.astro');
  assert.match(header, /import \{ CHAIN_APPS \} from '\.\.\/\.\.\/data\/chain-apps'/);
  assert.match(header, /const onApp = CHAIN_APPS\.some\(\(a\) => a\.key === current\)/);
  assert.match(header, /n\.key === 'apps' && onApp/);
  assert.match(header, /<nav class="subnav subnav--apps" aria-label="PointCast Chain apps">/);
  assert.match(header, /CHAIN_APPS\.map\(\(a\) => \(\s*<a href=\{a\.href\} aria-current=\{a\.key === current \? 'page' : undefined\}>\{a\.short\}<\/a>/);
  assert.match(read('src/styles/chain.css'), /\.chn \.subnav--apps\{/);
});

test('the /chain hub has an Apps section with all seven, links them in its JSON-LD, and the jump bar points at it', () => {
  const hub = read('src/pages/chain.astro');
  assert.match(hub, /import \{ APPS_HEADLINE, CHAIN_APPS, HONESTY \} from '\.\.\/data\/chain-apps'/);
  assert.match(hub, /<section id="apps" class="sec" aria-labelledby="apps-title">/);
  assert.match(hub, /CHAIN_APPS\.map\(\(a, i\) => \(/);
  assert.match(hub, /<a href=\{a\.href\}>Open \{a\.short\} →<\/a>/);
  assert.match(hub, /\.\.\.CHAIN_APPS\.map\(\(a\) => \(\{ '@type': 'WebApplication', name: a\.label/);
  assert.match(hub, /<a href="#apps">apps<\/a>/);
  assert.ok(hub.indexOf('id="apps"') > hub.indexOf('<HomeChainStrip variant="wide" />'), 'the section sits under the devnet strip');
  assert.ok(hub.indexOf('id="apps"') < hub.indexOf('id="explore"'));
  assert.match(hub, /never silent\. The apps that write do so only when you press a button after reading what will be sent/);
});

test('the sitemap lists all seven pages, once, with absolute trailing-slash URLs', () => {
  const sm = read('src/pages/sitemap-discovery.xml.ts');
  for (const a of CHAIN_APPS) {
    const url = 'https://pointcast.xyz' + a.href + '/';
    assert.equal(sm.split("['" + url + "'").length - 1, 1, url + ' appears once');
  }
});

test('the front door has the new item first, dated 2026-10-19, linking the Observatory, with the honesty words', () => {
  const news = JSON.parse(read('src/data/front-door-news.json'));
  assert.deepEqual(news[0], {
    label: 'Seven apps on the devnet',
    line: 'A live dashboard, a play auction, a notary, time capsules, a block-by-hand lesson, an API playground and checkpoint art, all read from your browser. No value is promised · may reset.',
    link: '/chain/observatory',
    date: '2026-10-19',
  });
  assert.equal(news.filter((n) => n.link === '/chain/observatory').length, 1);
  assert.deepEqual(bannedHits(news[0].line), []);
});

test('llms.txt mentions all seven on its one chain line and keeps its line count; llms-full.txt and /for-agents each carry one entry', () => {
  const llms = read('public/llms.txt');
  const lines = llms.split('\n');
  const chain = lines.filter((l) => l.startsWith('- [PointCast Chain](https://pointcast.xyz/chain/)'));
  assert.equal(chain.length, 1);
  for (const a of CHAIN_APPS) assert.ok(chain[0].includes('](https://pointcast.xyz' + a.href + '/)'), a.key + ' on the chain line');
  assert.equal(lines.filter((l) => l.includes('/chain/observatory')).length, 1, 'one line');
  assert.equal(lines.length, 334, 'the file ends with a newline and has the 333 lines it had before this change');
  for (const m of llms.matchAll(/\]\(([^)\s]+)\)/g)) assert.match(m[1], /^https?:\/\//, m[1] + ' is absolute');
  const full = read('public/llms-full.txt').split('\n');
  const para = full.filter((l) => l.startsWith('[Seven apps on the devnet](https://pointcast.xyz/chain/observatory/)'));
  assert.equal(para.length, 1);
  for (const a of CHAIN_APPS) assert.ok(para[0].includes('https://pointcast.xyz' + a.href + '/'), a.key);
  assert.match(para[0], /no value, may reset, a reset dated and recorded/);
  assert.match(para[0], /one server's accountable claim on a chain that may reset, not proof of authorship, and is not anchored anywhere/);
  assert.match(para[0], /lose it and the capsule never opens/);
  const agents = read('src/pages/for-agents.astro');
  const li = agents.split('\n').filter((l) => l.includes('<li><a href="/chain/observatory/">Seven apps on the devnet</a>'));
  assert.equal(li.length, 1);
  for (const a of CHAIN_APPS) assert.ok(li[0].includes('href="' + a.href + '/"'), a.key);
  assert.match(li[0], /Writes happen only on a button press, signed with a key made in the page\./);
  for (const text of [chain[0], para[0], li[0]]) { assert.deepEqual(bannedHits(text), []); assert.deepEqual(currencyHits(text), []); }
});

test('the homepage chain strip links the Observatory after the Daily Net, and the existing links are untouched', () => {
  const strip = read('src/components/HomeChainStrip.astro');
  assert.match(strip, /\{ href: '\/chain\/bots', label: 'How bots post' \},\n  \{ href: '\/chain\/net', label: 'The Daily Net' \},\n  \{ href: '\/chain\/observatory', label: 'The Observatory' \},\n  \{ href: DEVNET\.yardHref, label: 'Watch it in the Block Yard' \},/);
});

test('block 0721 is an FD LINK block in plain text: what exists, what writes, what it is not; its links are companions, and its media and OG card exist', () => {
  const b = JSON.parse(read('src/content/blocks/' + APPS_BLOCK + '.json'));
  assert.equal(b.id, APPS_BLOCK);
  assert.equal(b.channel, 'FD');
  assert.equal(b.type, 'LINK');
  assert.equal(b.title, 'Seven apps on the devnet');
  assert.equal(b.author, 'cc');
  assert.equal(b.size, '2x1');
  assert.match(b.timestamp, /^2026-10-20T/);
  assert.match(b.dek, /devnet · no value · may reset\.$/);
  assert.equal(b.media.src, '/images/chain/apps.svg');
  assert.equal(b.external.url, 'https://pointcast.xyz/chain/observatory/');
  // plain text: no markup and no links in the body (links go in companions)
  assert.doesNotMatch(b.body, /https?:\/\/|<[a-z]|\]\(|www\./i);
  assert.ok(b.body.length > 1500 && b.body.length < 4000);
  // it says what each of the seven does and which three write
  for (const word of ['Chain Observatory', 'The Daily Mint', 'The Notary', 'Time Capsules', 'Verify a block', 'API Playground', 'Checkpoint Blooms']) assert.ok(b.body.includes(word), word);
  for (const claim of ['no value is promised', 'it may reset', 'dated and recorded, never silent', 'GENESIS CHANGED', 'accountable claim', 'not anchored anywhere', 'lose it and the capsule never opens', 'only after you have read', 'with no value', 'not proof']) assert.ok(b.body.includes(claim), claim);
  assert.deepEqual(bannedHits(b.body + ' ' + b.dek + ' ' + b.title), []);
  assert.deepEqual(currencyHits(b.body + ' ' + b.dek), []);
  // companions: one per page, plus the Daily Net and the reset blocks and the chain home
  const ids = b.companions.map((c) => c.id);
  for (const a of CHAIN_APPS) assert.ok(ids.includes('https://pointcast.xyz' + a.href + '/'), a.key);
  assert.ok(ids.includes('0695') && ids.includes('0700') && ids.includes('https://pointcast.xyz/chain/'));
  for (const id of ids.filter((i) => /^\d{4}$/.test(i))) assert.ok(existsSync(new URL('src/content/blocks/' + id + '.json', root)), id + ' exists');
  assert.equal(b.meta.genesis, 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280');
  assert.match(b.meta.writes, /only on a button press, after the confirm box, with a key made in the browser/);
  // the OG card is a 1200x630 PNG and the art is a small SVG
  const og = readFileSync(new URL('public/images/og/b/' + APPS_BLOCK + '.png', root));
  assert.equal(og.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
  assert.ok(statSync(new URL('public/images/chain/apps.svg', root)).size < 40000);
});

test('the art is abstract: shapes only, no text, no images, no scripts, no links, and it respects reduced motion', () => {
  const svg = read('public/images/chain/apps.svg');
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1200 630"/);
  assert.doesNotMatch(svg, /<text|<tspan|<image|<script|foreignObject|href|\son\w+=|<use|<filter|url\(/i);
  assert.match(svg, /prefers-reduced-motion:reduce/);
  const tags = new Set([...svg.matchAll(/<([a-z]+)[\s>\/]/g)].map((m) => m[1]));
  for (const t of tags) assert.ok(['svg', 'style', 'rect', 'g', 'line', 'circle', 'path', 'ellipse', 'polygon'].includes(t), t);
  // one rail node per app, in the registry's order
  assert.equal((svg.match(/class="node n\d"/g) || []).length, 7);
  // the generator is committed and says how to rebuild the card
  const gen = read('scripts/generate-chain-apps-art.py');
  assert.match(gen, /No people, no\nplaces, no type of any kind\./);
  assert.match(gen, /generate-chain-apps-art\.py og > \/tmp\/apps-og\.svg/);
  assert.match(gen, /GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'/);
  assert.equal(read('src/data/chain-home.ts').includes("DEVNET_2_GENESIS: string = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'"), true, 'the art uses the pinned genesis');
});
