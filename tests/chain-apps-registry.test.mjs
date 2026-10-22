// The ten apps on the devnet, as one registry (src/data/chain-apps.ts) and
// the places that read it: the /chain hub, the section nav and the apps row,
// the sitemap, the front door, public/llms.txt, public/llms-full.txt,
// /for-agents, the homepage chain strip and the wire blocks 0721 (the first
// seven), 0722 (Witness and Channels) and 0724 (Start here, first in the list)
// with their art.
//
// What this suite holds: every app has a page, a nav key, a path and one honest
// line; every place that lists the apps lists all ten with the same paths; the
// first seven carry the wire block 0721, the two after them 0722 and Start here
// 0724; llms.txt keeps its line count (the ten are one sentence on the existing
// chain line); the blocks are plain text with their links in companions; and
// the art has no text and no people.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { APPS_2_BLOCK, APPS_BLOCK, APPS_HEADLINE, CHAIN_APPS, FIRST_SEVEN, HONESTY, appByKey } from '../src/data/chain-apps.ts';
import { REGISTRY_ENTRY as WITNESS_ENTRY } from '../src/data/chain-app-witness.ts';
import { APP as CHANNELS_APP } from '../src/data/chain-app-channels.ts';
import { APP as WITNESS_APP } from '../src/data/chain-app-witness.ts';
import { APP as START_APP, REGISTRY_ENTRY as START_ENTRY, START_BLOCK } from '../src/data/chain-app-start.ts';
import { CHAIN_NAV } from '../src/data/chain-home.ts';
import { SDK_SOURCE } from '../src/data/chain-sdk-source.ts';
import { bannedHits, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const KEYS = ['start', 'observatory', 'daily-mint', 'notary', 'capsules', 'verify-a-block', 'playground', 'bloom', 'witness', 'channels'];
const SEVEN = ['observatory', 'daily-mint', 'notary', 'capsules', 'verify-a-block', 'playground', 'bloom'];

test('on an app page exactly one link is aria-current="page": the Apps item in the section nav is the section ("true"), not a second page', () => {
  const header = read('src/components/chain/ChainHeader.astro');
  assert.match(header, /aria-current=\{n\.key === current \? 'page' : n\.key === 'apps' && onApp \? 'true' : undefined\}/);
  assert.doesNotMatch(header, /\(n\.key === 'apps' && onApp\) \? 'page'/, 'the Apps item is no longer a second "page"');
  assert.match(header, /aria-current=\{a\.key === current \? 'page' : undefined\}/, 'the app’s own link, in the apps row, is the page');
  // the item stays lit: the style covers both values
  assert.match(read('src/styles/chain.css'), /\.chn \.subnav a\[aria-current="page"\],\.chn \.subnav a\[aria-current="true"\]\{background:var\(--c600\)/);
  // the rendered page, when dist/ is there: each app has one "page" link in each of the two navs at most, and no two links to different places both "page"
  for (const a of CHAIN_APPS) {
    const built = new URL('dist/chain/' + a.key + '/index.html', root);
    if (!existsSync(built)) continue;
    const html = readFileSync(built, 'utf8');
    const links = [...html.matchAll(/<a href="([^"]+)"[^>]*aria-current="page"[^>]*>([^<]*)</g)].map((m) => m[1]);
    assert.deepEqual(links, [a.href], a.key + ': the one link that is the current page is the app itself: ' + links.join(' '));
    assert.match(html, /<a href="\/chain#apps"[^>]*aria-current="true"[^>]*>Apps</, a.key + ': the Apps item is the current section');
  }
});

test('the registry names ten apps, each with a page, a key, a path and one honest line', () => {
  assert.deepEqual(CHAIN_APPS.map((a) => a.key), KEYS);
  assert.deepEqual([...FIRST_SEVEN], SEVEN, 'the seven block 0721 announces, in order');
  assert.equal(APPS_HEADLINE, 'Ten apps on the devnet');
  assert.equal(HONESTY, 'devnet · no value · may reset');
  assert.match(APPS_BLOCK, /^\d{4}$/);
  assert.match(APPS_2_BLOCK, /^\d{4}$/);
  assert.equal(APPS_BLOCK, '0721');
  assert.equal(APPS_2_BLOCK, '0722');
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
  assert.deepEqual(CHAIN_APPS.filter((a) => a.mode === 'write').map((a) => a.key), ['start', 'daily-mint', 'notary', 'capsules', 'witness', 'channels']);
  assert.equal(appByKey('nope'), undefined);
  // the honest claims in the blurbs
  assert.match(appByKey('daily-mint').blurb, /Play ATTN, no value\./);
  assert.match(appByKey('notary').blurb, /not anchored anywhere/);
  assert.match(appByKey('capsules').blurb, /lose the capsule file and it never opens/);
  assert.match(appByKey('observatory').blurb, /It only reads\./);
  assert.match(appByKey('witness').blurb, /claim tied to a key, not proof that you replayed/);
  assert.match(appByKey('channels').blurb, /a reset drops every claim/);
  // the two apps built after the first seven: the registry entry is the page's own, written in two places and kept equal
  assert.deepEqual({ ...appByKey('witness') }, { ...WITNESS_ENTRY }, 'the registry entry is the one witness data exports');
  assert.equal(WITNESS_APP.path, appByKey('witness').href);
  assert.equal(CHANNELS_APP.path, appByKey('channels').href);
  assert.equal(CHANNELS_APP.key, 'channels');
  assert.equal(WITNESS_APP.key, 'witness');
  // Start here is first, and its entry is the one its data file exports
  assert.equal(CHAIN_APPS[0].key, 'start');
  assert.deepEqual({ ...appByKey('start') }, { ...START_ENTRY }, 'the registry entry is the one start data exports');
  assert.equal(START_APP.path, appByKey('start').href);
  assert.match(appByKey('start').blurb, /You read every field before you sign\. No value; may reset\.$/);
});

test('every app carries the wire block the registry names: the first seven 0721, Witness and Channels 0722, Start here 0724', () => {
  const data = {
    start: ['src/data/chain-app-start.ts', /block: START_BLOCK/],
    observatory: ['src/data/chain-app-observatory.ts', /block: APPS_BLOCK/],
    'daily-mint': ['src/data/chain-app-daily-mint.ts', /block: APPS_BLOCK/],
    notary: ['src/data/chain-app-notary.ts', /block: APPS_BLOCK/],
    capsules: ['src/data/chain-app-capsules.ts', /block: APPS_BLOCK/],
    'verify-a-block': ['src/data/chain-app-verify.ts', new RegExp("block: '" + APPS_BLOCK + "'")],
    playground: ['src/data/chain-app-playground.ts', new RegExp("export const BLOCK = '" + APPS_BLOCK + "'")],
    bloom: ['src/data/chain-app-bloom.ts', new RegExp("export const BLOOM_BLOCK = '" + APPS_BLOCK + "'")],
    witness: ['src/data/chain-app-witness.ts', /block: APPS_2_BLOCK/],
    channels: ['src/data/chain-app-channels.ts', /block: APPS_2_BLOCK/],
  };
  assert.deepEqual(Object.keys(data), KEYS, 'one entry per app');
  for (const [k, [file, re]] of Object.entries(data)) assert.match(read(file), re, k);
  for (const k of ['witness', 'channels']) assert.equal((k === 'witness' ? WITNESS_APP : CHANNELS_APP).block, APPS_2_BLOCK, k);
  assert.equal(START_BLOCK, '0724');
  assert.equal(START_APP.block, START_BLOCK);
  for (const id of [APPS_BLOCK, APPS_2_BLOCK, START_BLOCK]) {
    assert.ok(existsSync(new URL('src/content/blocks/' + id + '.json', root)), id + ' exists');
    assert.ok(existsSync(new URL('public/images/og/b/' + id + '.png', root)), id + ' has its OG card');
  }
  // the built pages, when dist/ is there, carry the crumb of the block that announces them
  for (const [k, id] of Object.entries({ start: START_BLOCK, witness: APPS_2_BLOCK, channels: APPS_2_BLOCK, notary: APPS_BLOCK, capsules: APPS_BLOCK })) {
    const built = new URL('dist/chain/' + k + '/index.html', root);
    if (existsSync(built)) assert.match(readFileSync(built, 'utf8'), new RegExp('href="/b/' + id + '"[^>]*>BLOCK ' + id), k + ' crumb names block ' + id);
  }
  assert.ok(existsSync(new URL('public/images/chain/apps.svg', root)), 'the art of 0721');
  assert.ok(existsSync(new URL('public/images/chain/apps-2.svg', root)), 'the art of 0722');
  // no app page is left pointing at a placeholder block
  for (const a of CHAIN_APPS) for (const f of ['src/data/chain-app-' + a.key + '.ts']) if (existsSync(new URL(f, root))) assert.doesNotMatch(read(f), /TODO\(integrator\)|does not exist yet; the integrator sets it/, f);
});

test('the section nav has an Apps item, the apps row names all ten on an app page, and each app page lights both', () => {
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

test('the /chain hub has an Apps section with all ten, links them in its JSON-LD, and the jump bar points at it', () => {
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

test('the sitemap lists all ten pages, once, with absolute trailing-slash URLs', () => {
  const sm = read('src/pages/sitemap-discovery.xml.ts');
  for (const a of CHAIN_APPS) {
    const url = 'https://pointcast.xyz' + a.href + '/';
    assert.equal(sm.split("['" + url + "'").length - 1, 1, url + ' appears once');
  }
});

test('the front door has the Start here item first, dated 2026-10-21, then the Witness and Channels item, dated 2026-10-20, then the seven apps item, dated 2026-10-19, with the honesty words', () => {
  const all = JSON.parse(read('src/data/front-door-news.json'));
  assert.equal(all[0].link, '/chain/start');
  assert.equal(all[0].date, '2026-10-21');
  assert.equal(all.filter((n) => n.link === '/chain/start').length, 1);
  assert.deepEqual(bannedHits(all[0].line + ' ' + all[0].label), []);
  assert.deepEqual(currencyHits(all[0].line), []);
  assert.match(all[0].line, /No value is promised · may reset\.$/);
  const news = all.slice(1);
  assert.deepEqual(news[0], {
    label: 'Be a witness from your browser · claim a channel',
    line: 'Replay the devnet from block 1 in your browser and sign a checkpoint with a free key, or claim a channel and broadcast on it. A claim, not proof. No value is promised · may reset.',
    link: '/chain/witness',
    date: '2026-10-20',
  });
  assert.deepEqual(news[1], {
    label: 'Seven apps on the devnet',
    line: 'A live dashboard, a play auction, a notary, time capsules, a block-by-hand lesson, an API playground and checkpoint art, all read from your browser. No value is promised · may reset.',
    link: '/chain/observatory',
    date: '2026-10-19',
  });
  assert.equal(news.filter((n) => n.link === '/chain/observatory').length, 1);
  assert.equal(news.filter((n) => n.link === '/chain/witness').length, 1);
  for (const n of [news[0], news[1]]) { assert.deepEqual(bannedHits(n.line + ' ' + n.label), []); assert.deepEqual(currencyHits(n.line), []); assert.match(n.line, /No value is promised · may reset\./); }
  assert.doesNotMatch(news[0].line, /\bverified\b|\bproves?\b|\bworth\b/i, 'a claim, not proof');
});

test('llms.txt mentions all ten on its one chain line and keeps its line count; llms-full.txt and /for-agents each carry one entry for the first seven and one for the two after them', () => {
  const llms = read('public/llms.txt');
  const lines = llms.split('\n');
  const chain = lines.filter((l) => l.startsWith('- [PointCast Chain](https://pointcast.xyz/chain/)'));
  assert.equal(chain.length, 1);
  for (const a of CHAIN_APPS) assert.ok(chain[0].includes('](https://pointcast.xyz' + a.href + '/)'), a.key + ' on the chain line');
  assert.match(chain[0], /Ten apps run on the devnet from your browser \(no value, may reset; anything that posts is signed with a key made in the page\)/);
  assert.equal(lines.filter((l) => l.includes('/chain/start')).length, 1, 'one line');
  assert.equal(lines.filter((l) => l.includes('/chain/observatory')).length, 1, 'one line');
  assert.equal(lines.filter((l) => l.includes('/chain/witness')).length, 1, 'one line');
  assert.equal(lines.length, 318, 'the file ends with a newline: the chain line plus the Gridtown line, after the 2026-10-22 trim under the 320-line cap');
  for (const m of llms.matchAll(/\]\(([^)\s]+)\)/g)) assert.match(m[1], /^https?:\/\//, m[1] + ' is absolute');
  const full = read('public/llms-full.txt').split('\n');
  const para = full.filter((l) => l.startsWith('[Seven apps on the devnet](https://pointcast.xyz/chain/observatory/)'));
  assert.equal(para.length, 1);
  for (const k of SEVEN) assert.ok(para[0].includes('https://pointcast.xyz' + appByKey(k).href + '/'), k);
  assert.match(para[0], /no value, may reset, a reset dated and recorded/);
  assert.match(para[0], /one server's accountable claim on a chain that may reset, not proof of authorship, and is not anchored anywhere/);
  assert.match(para[0], /lose it and the capsule never opens/);
  const para2 = full.filter((l) => l.startsWith('[Two more apps on the devnet](https://pointcast.xyz/chain/witness/)'));
  assert.equal(para2.length, 1);
  assert.equal(full.indexOf(para2[0]), full.indexOf(para[0]) + 1, 'it sits right under the first seven');
  for (const k of ['witness', 'channels']) assert.ok(para2[0].includes('https://pointcast.xyz' + appByKey(k).href + '/'), k);
  assert.match(para2[0], /devnet, no value, may reset, a reset dated and recorded/);
  assert.match(para2[0], /a witness is a claim tied to a key, not proof that anyone replayed, and counts are keys, not people/);
  assert.match(para2[0], /first come, first served; the house holds six codes; a reset drops every claim/);
  assert.match(para2[0], /no take-back, rename or hiding of a station/);
  const agents = read('src/pages/for-agents.astro');
  const li = agents.split('\n').filter((l) => l.includes('<li><a href="/chain/observatory/">Seven apps on the devnet</a>'));
  assert.equal(li.length, 1);
  for (const k of SEVEN) assert.ok(li[0].includes('href="' + appByKey(k).href + '/"'), k);
  assert.match(li[0], /Writes happen only on a button press, signed with a key made in the page\./);
  const li2 = agents.split('\n').filter((l) => l.includes('<li><a href="/chain/witness/">Two more apps on the devnet</a>'));
  assert.equal(li2.length, 1);
  for (const k of ['witness', 'channels']) assert.ok(li2[0].includes('href="' + appByKey(k).href + '/"'), k);
  assert.match(li2[0], /a claim tied to a key, not proof of replay/);
  assert.match(li2[0], /a reset drops every claim/);
  assert.match(li2[0], /Writes happen only on a button press, signed with a key made in the page\./);
  assert.equal(agents.split('\n').indexOf(li2[0]), agents.split('\n').indexOf(li[0]) + 1);
  for (const text of [chain[0], para[0], para2[0], li[0], li2[0]]) { assert.deepEqual(bannedHits(text), []); assert.deepEqual(currencyHits(text), []); }
});

test('the Daily Net page points to Witness in your browser, and the Observatory points to Channels, once each', () => {
  const net = read('src/pages/chain/net.astro');
  assert.equal(net.split('<a href="/chain/witness">Witness in your browser</a>').length - 1, 1);
  assert.match(net.replace(/\s+/g, ' '), /No code to run\? <a href="\/chain\/witness">Witness in your browser<\/a> does the same replay in a worker, shows the post word for word, and signs with a free key made in the page\./);
  const ob = read('src/pages/chain/observatory.astro');
  assert.equal(ob.split('href="/chain/channels"').length - 1, 1);
  assert.match(ob, /<p class="card__links"><a href="\/chain\/channels">Channels: who holds each code, and how to claim one →<\/a><\/p>/);
});

test('the shared key panel names five apps, and the shared stylesheet keeps a hidden button hidden', () => {
  const panel = read('src/components/chain/KeyPanel.astro').replace(/\s+/g, ' ');
  assert.match(panel, /One key, five apps/);
  assert.doesNotMatch(panel, /three apps/);
  for (const page of ['daily-mint', 'notary', 'capsules', 'witness', 'channels']) assert.match(read('src/pages/chain/' + page + '.astro'), /<KeyPanel signs=/, page);
  // .chn .btn sets display and so beats the hidden attribute: the shared sheet puts it back, for every page that uses the panel
  assert.match(read('src/styles/chain-apps.css'), /\.chn \.btn\[hidden\],\.chn \.ca-actions \[hidden\]\{display:none\}/);
  assert.match(read('src/styles/chain.css'), /\.chn \.btn\{display:inline-flex/);
});

test('the homepage chain strip links Start here first and the Observatory after the Daily Net, and the existing links are untouched', () => {
  const strip = read('src/components/HomeChainStrip.astro');
  assert.match(strip, /\.\.\.\(wide \? \[\] : \[\{ href: '\/chain', label: 'PointCast Chain' \}\]\),\n  \{ href: '\/chain\/start', label: 'Start here: your first minute' \},\n  \{ href: '\/chain\/bots', label: 'How bots post' \},/);
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
  for (const k of SEVEN) assert.ok(ids.includes('https://pointcast.xyz' + appByKey(k).href + '/'), k);
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

test('block 0722 is an FD LINK block in plain text: what the two pages do, what writes, what a claim is not; its links are companions, and its media and OG card exist', () => {
  const b = JSON.parse(read('src/content/blocks/' + APPS_2_BLOCK + '.json'));
  assert.equal(b.id, APPS_2_BLOCK);
  assert.equal(b.channel, 'FD');
  assert.equal(b.type, 'LINK');
  assert.equal(b.title, 'Be a witness from your browser, or claim a channel');
  assert.equal(b.author, 'cc');
  assert.equal(b.size, '2x1');
  assert.match(b.timestamp, /^2026-10-20T/);
  assert.ok(Date.parse(b.timestamp) > Date.parse(JSON.parse(read('src/content/blocks/' + APPS_BLOCK + '.json')).timestamp), 'after 0721');
  assert.match(b.dek, /devnet · no value · may reset\.$/);
  assert.equal(b.media.src, '/images/chain/apps-2.svg');
  assert.equal(b.external.url, 'https://pointcast.xyz/chain/witness/');
  assert.doesNotMatch(b.body, /https?:\/\/|<[a-z]|\]\(|www\./i, 'plain text: links go in companions');
  assert.ok(b.body.length > 1500 && b.body.length < 4000, 'body length ' + b.body.length);
  for (const word of ['Witness in your browser', 'Channels', 'pc-witness.mjs', 'WIT', 'GENESIS CHANGED']) assert.ok(b.body.includes(word), word);
  for (const claim of ['no value is promised', 'it may reset', 'dated and recorded, never silent', 'sends nothing until you press Send', 'refuses to sign', 'It is not proof that you replayed', 'counts are keys, not people', 'first come, first served', 'a reset drops every claim', 'crew-only', 'up to sixteen addresses', "word filter", 'The house can hide a post', 'a code is not a trademark', 'node params do not hash to its genesis_hash', 'byte for byte', 'only with a key your browser made', 'with no value', 'not proof']) assert.ok(b.body.includes(claim), claim);
  assert.deepEqual(bannedHits(b.body + ' ' + b.dek + ' ' + b.title), []);
  assert.deepEqual(currencyHits(b.body + ' ' + b.dek), []);
  const ids = b.companions.map((c) => c.id);
  for (const k of ['witness', 'channels']) assert.ok(ids.includes('https://pointcast.xyz' + appByKey(k).href + '/'), k);
  for (const link of ['https://pointcast.xyz/chain/net/', 'https://pointcast.xyz/chain/bots/', 'https://pointcast.xyz/chain/']) assert.ok(ids.includes(link), link);
  assert.ok(ids.includes('0721') && ids.includes('0695') && ids.includes('0700'));
  for (const id of ids.filter((i) => /^\d{4}$/.test(i))) assert.ok(existsSync(new URL('src/content/blocks/' + id + '.json', root)), id + ' exists');
  assert.equal(b.meta.genesis, 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280');
  assert.match(b.meta.writes, /only on a button press, after the confirm box, with a key made in the browser/);
  assert.match(b.meta.sdk, /sha256 33bef6b76c98e5e2090fb7b7d87a4b8324807503c4ea9d2fc65052ac6eb2bde9/, 'the SDK sha is the pin');
  assert.match(b.meta.sdk, new RegExp('at ' + SDK_SOURCE.commit));
  assert.ok(b.meta.sdk.includes(SDK_SOURCE.sha256));
  assert.equal(b.meta.value, 'none; no value is promised');
  const og = readFileSync(new URL('public/images/og/b/' + APPS_2_BLOCK + '.png', root));
  assert.equal(og.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
  assert.ok(statSync(new URL('public/images/chain/apps-2.svg', root)).size < 40000);
  // no other block already holds the id, and the ids around it are in order
  assert.ok(Number(APPS_2_BLOCK) === Number(APPS_BLOCK) + 1);
});

test('the art of 0722 is abstract: shapes only, no text, no images, no scripts, no links, three rail nodes, and it respects reduced motion', () => {
  const svg = read('public/images/chain/apps-2.svg');
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1200 630"/);
  assert.doesNotMatch(svg, /<text|<tspan|<image|<script|foreignObject|href|\son\w+=|<use|<filter|url\(/i);
  assert.match(svg, /prefers-reduced-motion:reduce/);
  const tags = new Set([...svg.matchAll(/<([a-z]+)[\s>\/]/g)].map((m) => m[1]));
  for (const t of tags) assert.ok(['svg', 'style', 'rect', 'g', 'line', 'circle', 'path', 'ellipse', 'polygon'].includes(t), t);
  assert.equal((svg.match(/class="node n\d"/g) || []).length, 3, 'one rail node for each of the three marks: Witness, Channels, the SDK');
  const gen = read('scripts/generate-chain-apps-2-art.py');
  assert.match(gen, /No people, no\nplaces, no type of any kind\./);
  assert.match(gen, /generate-chain-apps-2-art\.py og > \/tmp\/apps-2-og\.svg/);
  assert.match(gen, /GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'/);
  assert.match(gen, /toFile\('public\/images\/og\/b\/0722\.png'\)/);
  // the committed svg is exactly what the committed generator makes
  const out = spawnSync('python3', ['scripts/generate-chain-apps-2-art.py', 'media'], { cwd: new URL('./', root), encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout, svg, 'the art is reproducible from the generator');
});

test('Start here has one entry each in llms-full.txt and /for-agents, right under the two after the seven, with the honesty words', () => {
  const full = read('public/llms-full.txt').split('\n');
  const para2 = full.findIndex((l) => l.startsWith('[Two more apps on the devnet](https://pointcast.xyz/chain/witness/)'));
  const start = full.filter((l) => l.startsWith('[Start here](https://pointcast.xyz/chain/start/)'));
  assert.equal(start.length, 1);
  assert.equal(full.indexOf(start[0]), para2 + 1);
  assert.match(start[0], /devnet, no value, may reset, a reset dated and recorded/);
  assert.match(start[0], /nothing is sent until Sign/);
  assert.match(start[0], /a claim by that key, not proof of who you are/);
  const agents = read('src/pages/for-agents.astro').split('\n');
  const li2 = agents.findIndex((l) => l.includes('<li><a href="/chain/witness/">Two more apps on the devnet</a>'));
  const li = agents.filter((l) => l.includes('<li><a href="/chain/start/">Start here: your first minute on the devnet</a>'));
  assert.equal(li.length, 1);
  assert.equal(agents.indexOf(li[0]), li2 + 1);
  assert.match(li[0], /Writes happen only on a button press, signed with a key made in the page\./);
  for (const text of [start[0], li[0]]) { assert.deepEqual(bannedHits(text), []); assert.deepEqual(currencyHits(text), []); }
});

test('block 0724 is an FD LINK block in plain text: Start here, the plan, house and outside apart with the day’s numbers, and the pcv replay; its links are companions, and its media and OG card exist', () => {
  const b = JSON.parse(read('src/content/blocks/' + START_BLOCK + '.json'));
  assert.equal(b.id, '0724');
  assert.equal(b.channel, 'FD');
  assert.equal(b.type, 'LINK');
  assert.equal(b.author, 'cc');
  assert.equal(b.size, '2x1');
  assert.match(b.timestamp, /^2026-10-21T/);
  assert.ok(Date.parse(b.timestamp) > Date.parse(JSON.parse(read('src/content/blocks/' + APPS_2_BLOCK + '.json')).timestamp), 'after 0722');
  assert.match(b.dek, /devnet · no value · may reset\.$/);
  assert.equal(b.media.src, '/images/chain/first-minute.svg');
  assert.equal(b.external.url, 'https://pointcast.xyz/chain/start/');
  assert.doesNotMatch(b.body, /https?:\/\/|<[a-z]|\]\(|www\./i, 'plain text: links go in companions');
  assert.ok(b.body.length > 1500 && b.body.length < 4500, 'body length ' + b.body.length);
  for (const claim of ['Start here', 'nothing is sent until you press Sign', 'no value is promised', 'it may reset', 'dated and recorded, never silent',
    'not proof of who you are', 'A plan, not a promise', 'peer-to-peer wallets verdict', 'not as the first wallet',
    '95 house transactions from 6 keys, 51 keyless from 1, and 2 outside from 2 keys', 'Almost all of the activity is the house',
    'House activity is the chain checking itself, not use', 'Counts are keys, not people', 'recomputes every state root', '3,790 blocks', 'not a second lab'])
    assert.ok(b.body.includes(claim), claim);
  assert.deepEqual(bannedHits(b.body + ' ' + b.dek + ' ' + b.title), []);
  assert.deepEqual(currencyHits(b.body + ' ' + b.dek), []);
  const ids = b.companions.map((c) => c.id);
  for (const link of ['https://pointcast.xyz/chain/start/', 'https://pointcast.xyz/chain/plan/', 'https://pointcast.xyz/chain/plan/#wallets', 'https://pointcast.xyz/chain/net/#who-signed', 'https://pointcast.xyz/chain/observatory/', 'https://pointcast.xyz/chain/bots/#python', 'https://pointcast.xyz/chain/'])
    assert.ok(ids.includes(link), link);
  for (const id of ids.filter((i) => /^\d{4}$/.test(i))) assert.ok(existsSync(new URL('src/content/blocks/' + id + '.json', root)), id + ' exists');
  assert.ok(b.companions.length <= 12);
  for (const c of b.companions) assert.ok(c.id.length <= 80 && c.label.length <= 80, c.id);
  assert.equal(b.meta.genesis, 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280');
  assert.match(b.meta.classes, /house 95 txs from 6 keys, keyless 51 from 1, outside 2 from 2/);
  assert.match(b.meta.pcv, /verified 3790 blocks, tip e3f57b4e[0-9a-f]{56}, state_root \(replayed\), faults 0/);
  // A block is filed after what it reports: it was once stamped 19:30, before the 19:35 pcv run it cites
  // (devnet block 3,790, the height its counts were read at, was sealed at 19:35:01 UTC).
  const ran = b.meta.pcv.match(/live run (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) UTC/);
  assert.ok(ran, 'meta.pcv names when the run was');
  assert.ok(Date.parse(b.timestamp) >= Date.parse(`${ran[1]}T${ran[2]}:00Z`), `filed ${b.timestamp}, before the run it reports`);
  assert.equal(b.meta.value, 'none; no value is promised');
  const og = readFileSync(new URL('public/images/og/b/0724.png', root));
  assert.equal(og.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
  assert.ok(statSync(new URL('public/images/chain/first-minute.svg', root)).size < 40000);
});

test('the art of 0724 is abstract: shapes only, no text, no images, no scripts, no links, four rail nodes, and it respects reduced motion', () => {
  const svg = read('public/images/chain/first-minute.svg');
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1200 630"/);
  assert.doesNotMatch(svg, /<text|<tspan|<image|<script|foreignObject|href|\son\w+=|<use|<filter|url\(/i);
  assert.match(svg, /prefers-reduced-motion:reduce/);
  const tags = new Set([...svg.matchAll(/<([a-z]+)[\s>\/]/g)].map((m) => m[1]));
  for (const t of tags) assert.ok(['svg', 'style', 'rect', 'g', 'line', 'circle', 'path', 'ellipse', 'polygon'].includes(t), t);
  assert.equal((svg.match(/class="node n\d"/g) || []).length, 4, 'one rail node for each of the four marks: Start here, the plan, who signs, the replay');
  const gen = read('scripts/generate-chain-first-minute-art.py');
  assert.match(gen, /No people, no places, no type of\nany kind\./);
  assert.match(gen, /GENESIS = 'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280'/);
  assert.match(gen, /CLASSES = \(95, 51, 2\)/);
  assert.match(gen, /toFile\('public\/images\/og\/b\/0724\.png'\)/);
  const out = spawnSync('python3', ['scripts/generate-chain-first-minute-art.py', 'media'], { cwd: new URL('./', root), encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout, svg, 'the art is reproducible from the generator');
});
