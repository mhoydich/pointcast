import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { keyFromSeed } from '../public/chain/apps/chain-kit.js';
import { KEY_SLOT as CHAIN_APPS_KEY } from '../public/chain/apps/key-panel.js';
import {
  CHANNEL,
  KEY_SLOT,
  LIMITS,
  assertSafeSvg,
  editionsSummary,
  emailSnippet,
  layoutDrawn,
  layoutTyped,
  layoutUpload,
  parseSignature,
  planRecord,
  signStatement,
  signatureBody,
  storeRequestBytes,
  tripsWordFilter,
  verifyStatement,
} from '../public/signature/studio.js';
import { HISTORY, HISTORY_LINKS } from '../src/data/signature-history.ts';
import { BLOCK, EDITION_GAP, FONTS, HONESTY, NOT_LEGAL } from '../src/data/signature-studio.ts';

const root = new URL('../', import.meta.url);
const rootDir = fileURLToPath(root);
const read = (rel) => readFileSync(new URL(rel, root), 'utf8');
const publicFile = (webPath) => join(rootDir, 'public', webPath.replace(/^\//, ''));
const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const HASH = 'ab'.repeat(32);

function utf16be(text) {
  const buf = Buffer.alloc(text.length * 2);
  for (let i = 0; i < text.length; i++) buf.writeUInt16BE(text.charCodeAt(i), i * 2);
  return buf;
}

test('every catalog face has a font file, a license, and extracted outlines', () => {
  assert.equal(FONTS.length, 8);
  assert.equal(new Set(FONTS.map((font) => font.id)).size, 8);
  for (const font of FONTS) {
    assert.equal(existsSync(publicFile(font.file)), true, font.file);
    assert.equal(existsSync(publicFile(font.paths)), true, font.paths);
    const license = font.license === 'Apache-2.0'
      ? 'public/signature/fonts/homemade-apple/LICENSE.txt'
      : `public/signature/fonts/${font.id}/OFL.txt`;
    const text = read(license);
    if (font.license === 'Apache-2.0') assert.match(text, /Apache License/);
    else assert.match(text, /SIL Open Font License/);
    const outlines = JSON.parse(readFileSync(publicFile(font.paths), 'utf8'));
    assert.equal(outlines.id, font.id);
    assert.ok(outlines.glyphs.M && outlines.glyphs.a, font.id);
  }
});

test('PointCast Script is the original face, named in the font file', () => {
  const bytes = readFileSync(new URL('../public/signature/fonts/pointcast-script/PointCastScript.ttf', import.meta.url));
  assert.ok(bytes.includes(utf16be('PointCast Script')) || bytes.includes('PointCast Script'));
  const ofl = read('public/signature/fonts/pointcast-script/OFL.txt');
  assert.match(ofl, /Reserved Font Name "PointCast Script"/);
  assert.match(read('public/signature/fonts/README.md'), /build-font\.mjs/);
  assert.match(read('scripts/signature/glyphs.mjs'), /export const GLYPHS/);
});

test('a typed name becomes vector paths, with and without a flourish', () => {
  const font = JSON.parse(read('public/signature/paths/pointcast-script.json'));
  const laid = layoutTyped({ font, text: 'Michael Hoydich', size: 96, flourish: true });
  assert.deepEqual(laid.missing, []);
  assert.ok(laid.svg.includes('<path d="M'));
  assert.ok(laid.svg.length > 1000);
  assert.doesNotMatch(laid.svg, /<script/i);
  assertSafeSvg(laid.svg);
  const plain = layoutTyped({ font, text: 'Michael Hoydich', flourish: false, slant: 12, weight: 2, color: '#112233' });
  assert.ok(plain.height < laid.height);
  assert.match(plain.svg, /#112233/);
  assert.match(plain.svg, /skewX\(12\)/);
  assert.throws(() => layoutTyped({ font, text: '   ' }), /type a name/);
});

test('a third-party face also draws, and a drawing becomes quadratic strokes', () => {
  const font = JSON.parse(read('public/signature/paths/great-vibes.json'));
  const laid = layoutTyped({ font, text: 'PointCast', flourish: false });
  assert.deepEqual(laid.missing, []);
  assertSafeSvg(laid.svg);
  const drawn = layoutDrawn(
    [
      { x: 10, y: 40, t: 0, pressure: 0.2 },
      { x: 40, y: 10, t: 30, pressure: 0.9 },
      { x: 80, y: 50, t: 60, pressure: 0.3 },
      { x: 120, y: 20, t: 90, pressure: 0.8 },
    ],
    { flourish: true, color: '#1c140f' },
  );
  assert.match(drawn.svg, / Q /);
  assertSafeSvg(drawn.svg);
  assert.throws(() => layoutDrawn([{ x: 1, y: 1, t: 0 }]), /draw a stroke/);
});

test('an upload stays a picture, and a hostile SVG is refused', () => {
  const uploaded = layoutUpload({ dataUrl: TINY_PNG, width: 12, height: 8 });
  assert.match(uploaded.svg, /<image href="data:image\/png;base64,/);
  assert.equal(uploaded.vector, false);
  assertSafeSvg(uploaded.svg);
  assert.throws(() => layoutUpload({ dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=', width: 10, height: 10 }), /PNG, JPEG/);
  assert.throws(() => assertSafeSvg('<svg xmlns="http://www.w3.org/2000/svg" ><script></script></svg>'), /not safe/);
});

test('the post names the hash, and leaves out an outline the word filter would misread', () => {
  const font = JSON.parse(read('public/signature/paths/pointcast-script.json'));
  const letter = layoutTyped({ font, text: 'M', flourish: true, size: 96 });
  assert.equal(tripsWordFilter(letter.svg), true);
  const body = signatureBody({ sha256: HASH, kind: 'typed', font: 'pointcast-script', bytes: 1200, label: 'M', svg: letter.svg });
  assert.match(body, /svg:omitted/);
  assert.equal(tripsWordFilter(body), false);
  assert.ok(storeRequestBytes(body) <= LIMITS.storeBytes);
  const parsed = parseSignature(body);
  assert.equal(parsed.kind, 'typed');
  assert.equal(parsed.svgOmitted, true);
  const safe = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M 2 2 L 6 6"/></svg>';
  assert.equal(tripsWordFilter(safe), false);
  const embedded = signatureBody({ sha256: HASH, kind: 'drawn', bytes: 10, svg: safe });
  assert.match(embedded, /svg:<svg /);
  assert.equal(tripsWordFilter(embedded), false);
  const huge = signatureBody({ sha256: HASH, kind: 'drawn', bytes: 10, svg: 'M 2 2 '.repeat(2000) });
  assert.match(huge, /svg:omitted/);
  const plan = planRecord({ sha256: HASH, kind: 'typed', font: 'pointcast-script', bytes: 12, label: '', svg: '', media: '' });
  assert.equal(plan.channel, CHANNEL);
  assert.equal(plan.channel, 'ART');
  assert.equal(plan.body.includes('11'.repeat(32)), false);
  assert.equal(plan.mediaUri, null);
});

test('an ed25519 statement signs and fails when the text changes', async () => {
  const key = await keyFromSeed('11'.repeat(32));
  assert.equal(key.sender, 'tz1SuVm2EtvzCVfkgpgDWNnvXFNJpL6z1kCC');
  const signed = await signStatement({ key, statement: 'I made this mark.', pngSha256: HASH });
  assert.match(signed.canonical, /^pointcast-signature\/statement\/v1\npng-sha256:abab/);
  const ok = await verifyStatement({ canonical: signed.canonical, publicKey: signed.publicKey, signature: signed.signature });
  assert.equal(ok.ok, true);
  const tampered = await verifyStatement({
    canonical: signed.canonical.replace('mark', 'mark.'),
    publicKey: signed.publicKey,
    signature: signed.signature,
  });
  assert.equal(tampered.ok, false);
  assert.equal(signed.canonical.includes(key.seedHex), false);
});

test('editions are described, and a signature edition is not pretended', () => {
  const summary = editionsSummary({
    editions: [{ id: 'daily-mint', minted: 11, remaining: 3639, terms: { attestor: 'f5462bdcdcff352eb7e4862e99b72af091964a674bcc07961b82fda814e2bc47' } }],
  });
  assert.match(summary.lines[0], /daily-mint/);
  assert.match(summary.lines[0], /house attestor required/);
  assert.match(EDITION_GAP, /daily-mint/);
  assert.match(EDITION_GAP, /attestor/);
  assert.match(EDITION_GAP, /signature\/v1/);
});

test('the email snippet points at a file, not a data URI', () => {
  const html = emailSnippet({ alt: 'Ada <script>' });
  assert.match(html, /src="signature\.png"/);
  assert.match(html, /Ada &lt;script&gt;/);
  assert.doesNotMatch(html, /data:/);
});

test('the history cites the statutes, the parchment, and the cryptography', () => {
  const hrefs = new Set(HISTORY_LINKS);
  for (const href of [
    'https://www.legislation.gov.uk/aep/Cha2/29/3',
    'https://www.law.cornell.edu/ucc/1/1-201',
    'https://www.archives.gov/founding-docs/declaration-history',
    'https://www.congress.gov/106/plaws/publ229/PLAW-106publ229.pdf',
    'https://www.law.cornell.edu/uscode/text/15/7001',
    'https://www.law.cornell.edu/uscode/text/15/7003',
    'https://ed25519.cr.yp.to/ed25519-20110926.pdf',
    'https://eips.ethereum.org/EIPS/eip-191',
    'https://docs.tezos.com/architecture/accounts',
  ]) assert.ok(hrefs.has(href), href);
  assert.ok(HISTORY.length >= 7);
});

test('the pages say this is not a legal e-signature service, and the key slot is separate', () => {
  const page = read('src/pages/signature/index.astro');
  const history = read('src/pages/signature/history.astro');
  assert.equal(NOT_LEGAL, 'This is not a legally binding e-signature service, not a notary, and not proof of who you are.');
  assert.match(page, /\{NOT_LEGAL\}/);
  assert.match(history, /\{NOT_LEGAL\}/);
  assert.match(page, /\{HONESTY\}/);
  assert.match(page, /data-signature/);
  assert.match(page, /data-send/);
  assert.match(page, /data-prepare/);
  assert.match(page, /studio-view\.js/);
  assert.equal(KEY_SLOT, 'pointcast-signature/key/v1');
  assert.notEqual(KEY_SLOT, CHAIN_APPS_KEY);
  assert.match(read('public/signature/studio-view.js'), /textContent/);
  assert.doesNotMatch(read('public/signature/studio-view.js'), /innerHTML/);
});

test('block 0764 is the studio announcement and points at the pages', () => {
  const block = JSON.parse(read('src/content/blocks/0764.json'));
  assert.equal(block.id, BLOCK);
  assert.equal(block.id, '0764');
  assert.equal(block.channel, 'FD');
  assert.equal(block.type, 'LINK');
  assert.equal(block.author, 'cc');
  assert.doesNotMatch(block.meta.status, /live/i);
  assert.equal(block.size, '2x1');
  assert.ok(block.dek.includes(NOT_LEGAL) || block.dek.includes('not a legally binding e-signature service'));
  assert.match(block.dek, /devnet · no value · may reset/);
  assert.equal(block.external.url, 'https://pointcast.xyz/signature/');
  assert.ok(block.companions.every((item) => item.id.length <= 80 && item.label.length <= 80));
  assert.ok(block.companions.some((item) => item.id === 'https://pointcast.xyz/signature/history/'));
  const sitemap = read('src/pages/sitemap-discovery.xml.ts');
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/signature\//);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/signature\/history\.json/);
  assert.equal(existsSync(new URL('../public/images/signature/mark.svg', import.meta.url)), true);
});
