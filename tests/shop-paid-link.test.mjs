import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { AFFILIATE_PROGRAMS } from '../src/data/affiliate-programs.ts';
import {
  AFFILIATE_PROGRAM_IDS,
  anyProgramApproved,
  courtPaidRowCount,
  courtRowPaidLink,
  NO_COMMISSION_NOTE,
  outboundCheckout,
  PAID_LINK_DISCLOSURE,
  PROGRAM_BY_REGISTER_BRAND,
  publicAffiliate,
  publicAffiliateWith,
  resolvePaidLink,
  resolvePaidLinkWith,
  shopLaneUrl,
} from '../src/lib/commerce.ts';

const readJson = (rel) => JSON.parse(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'));

const EXPECTED_IDS = ['selkirk', 'engage', 'crbn', 'six-zero', '11six24', 'amazon', 'joola'];

test('shop-paid-link: stage-1 guard — all 7 programs are approved:false', () => {
  assert.equal(AFFILIATE_PROGRAMS.length, 7);
  assert.deepEqual(AFFILIATE_PROGRAMS.map((p) => p.id).sort(), [...EXPECTED_IDS].sort());
  for (const p of AFFILIATE_PROGRAMS) assert.equal(p.approved, false, `${p.id} must be approved:false in stage 1`);
});

test('shop-paid-link: JOOLA is not accepting', () => {
  const joola = AFFILIATE_PROGRAMS.find((p) => p.id === 'joola');
  assert.equal(joola.accepting, false);
});

test('shop-paid-link: every resolution comes back unpaid in stage 1', () => {
  for (const p of AFFILIATE_PROGRAMS) {
    const result = resolvePaidLink('https://maker.example/products/thing', p.id);
    assert.equal(result.paid, false);
    assert.equal(result.note, NO_COMMISSION_NOTE);
  }
});

test('shop-paid-link: unknown program comes back unpaid', () => {
  const result = resolvePaidLink('https://maker.example/products/thing', 'not-a-real-program');
  assert.equal(result.paid, false);
});

test('shop-paid-link: http and pointcast hrefs never pay, even for a patched-approved program', () => {
  const approved = AFFILIATE_PROGRAMS.map((p) => (p.id === 'selkirk' ? { ...p, approved: true, approvedOn: '2026-09-28', linkHosts: ['maker.example'] } : p));
  assert.equal(resolvePaidLinkWith(approved, 'http://maker.example/products/thing', 'selkirk').paid, false, 'http never pays');
  assert.equal(resolvePaidLinkWith(approved, 'https://pointcast.xyz/products/thing', 'selkirk').paid, false, 'pointcast host never pays');
  assert.equal(resolvePaidLinkWith(approved, 'https://shop.pointcast.xyz/products/thing', 'selkirk').paid, false, 'pointcast subdomain never pays');
});

test('shop-paid-link: a patched, approved program pays only on a listed host, with the exact disclosure', () => {
  const approved = AFFILIATE_PROGRAMS.map((p) =>
    p.id === 'selkirk' ? { ...p, approved: true, approvedOn: '2026-09-28', linkHosts: ['maker.example'] } : p,
  );

  const wrongHost = resolvePaidLinkWith(approved, 'https://other.example/products/thing', 'selkirk');
  assert.equal(wrongHost.paid, false, 'a host outside linkHosts never pays');

  const paid = resolvePaidLinkWith(approved, 'https://maker.example/products/thing', 'selkirk');
  assert.equal(paid.paid, true);
  assert.equal(paid.host, 'maker.example');
  assert.equal(paid.program, 'selkirk');
  assert.equal(paid.rel, 'sponsored noopener');
  assert.equal(paid.disclosure, PAID_LINK_DISCLOSURE);
  assert.equal(paid.disclosure, 'Paid link. PointCast earns a commission if you buy.');
});

test('shop-paid-link: approved but not accepting, or missing approvedOn, still does not pay', () => {
  const noApprovedOn = AFFILIATE_PROGRAMS.map((p) => (p.id === 'selkirk' ? { ...p, approved: true, approvedOn: null, linkHosts: ['maker.example'] } : p));
  assert.equal(resolvePaidLinkWith(noApprovedOn, 'https://maker.example/products/thing', 'selkirk').paid, false);

  const notAccepting = AFFILIATE_PROGRAMS.map((p) => (p.id === 'joola' ? { ...p, approved: true, approvedOn: '2026-09-28', linkHosts: ['joola.com'] } : p));
  assert.equal(resolvePaidLinkWith(notAccepting, 'https://joola.com/products/thing', 'joola').paid, false, 'accepting:false never pays even if approved');
});

test('shop-paid-link: anyProgramApproved() is false in stage 1', () => {
  assert.equal(anyProgramApproved(), false);
});

test('shop-paid-link: outboundCheckout(url) is unchanged without a second argument', () => {
  const result = outboundCheckout('https://maker.example/products/thing');
  assert.deepEqual(result, {
    mode: 'outbound-only',
    url: 'https://maker.example/products/thing',
    host: 'maker.example',
    opensOn: 'merchant-site',
    paymentHandledBy: 'merchant',
    pointCastCaptures: [],
  });
  assert.equal('paid' in result, false);
  assert.equal('affiliate' in result, false);
  assert.equal('disclosure' in result, false);
});

test('shop-paid-link: outboundCheckout(url, {program}) adds paid/affiliate/disclosure, unpaid in stage 1', () => {
  const result = outboundCheckout('https://maker.example/products/thing', { program: 'selkirk' });
  assert.equal(result.paid, false);
  assert.equal(result.affiliate, null);
  assert.equal(result.disclosure, NO_COMMISSION_NOTE);
});

test('shop-paid-link: no lane is "court" from commerceLane, and shopLaneUrl("court") is /shop/court', async () => {
  const { commerceLane } = await import('../src/lib/commerce.ts');
  const fixtures = [
    { brand: 'PointCast Merch', url: 'https://pointcast-merch.myshopify.com/x', category: '', name: '' },
    { brand: 'Good Feels', url: 'https://getgoodfeels.com/x', category: 'Enhancer', name: '' },
    { brand: 'Good Feels', url: 'https://getgoodfeels.com/x', category: 'Gummies', name: '' },
    { brand: 'Good Feels', url: 'https://getgoodfeels.com/x', category: 'Seltzer', name: '' },
    { brand: 'Good Feels', url: 'https://getgoodfeels.com/x', category: '', name: '' },
    { brand: 'Some Maker', url: 'https://maker.example/x', category: '', name: '' },
  ];
  for (const product of fixtures) assert.notEqual(commerceLane(product), 'court');
  assert.equal(shopLaneUrl('court'), '/shop/court');
  assert.equal(shopLaneUrl('court', true), 'https://pointcast.xyz/shop/court');
});

// ── Public affiliate (the review JSON feeds) ────────────────────────────

test('publicAffiliate: stage 1 publishes null for every program, known or not', () => {
  assert.equal(publicAffiliate(null), null);
  for (const id of AFFILIATE_PROGRAM_IDS) {
    assert.equal(publicAffiliate({ program: id, url: 'https://maker.example/?ref=pointcast' }), null, `${id} is unapproved`);
  }
  assert.equal(publicAffiliate({ program: 'not-a-program', url: 'https://11six24.com/?ref=pointcast' }), null);
});

test('publicAffiliateWith: a patched, approved program publishes the link with its disclosure', () => {
  const approved = AFFILIATE_PROGRAMS.map((p) =>
    p.id === 'selkirk' ? { ...p, approved: true, approvedOn: '2026-09-28', linkHosts: ['maker.example'] } : p,
  );
  assert.deepEqual(publicAffiliateWith(approved, { program: 'selkirk', url: 'https://maker.example/x' }), {
    program: 'selkirk',
    url: 'https://maker.example/x',
    rel: 'sponsored noopener',
    disclosure: PAID_LINK_DISCLOSURE,
  });
  assert.equal(publicAffiliateWith(approved, { program: 'selkirk', url: 'https://other.example/x' }), null, 'off-host stays null');
  assert.equal(publicAffiliateWith(approved, { program: 'engage', url: 'https://maker.example/x' }), null, 'unapproved stays null');
});

// ── Court lane: the brand map and row resolution ────────────────────────

test('PROGRAM_BY_REGISTER_BRAND: every key is a real register brand, every value a program on file', () => {
  const calendar = readJson('src/data/paddle-calendar.json');
  const register = readJson('src/data/paddle-register.json');
  const brands = new Set([...(register.backfill ?? []), ...calendar.releases].map((p) => p.brand));
  for (const [brand, program] of Object.entries(PROGRAM_BY_REGISTER_BRAND)) {
    assert.ok(brands.has(brand), `"${brand}" is not spelled the way the register spells any brand`);
    assert.ok(AFFILIATE_PROGRAM_IDS.includes(program), `"${program}" is not a program id on file`);
  }
  assert.equal(PROGRAM_BY_REGISTER_BRAND['Six Zero'], 'six-zero');
});

test('courtRowPaidLink: stage 1 never pays; missing maker page or brand resolves unpaid', () => {
  assert.equal(courtRowPaidLink({ brand: 'Six Zero', makerUrl: 'https://maker.example/x' }).paid, false);
  assert.equal(courtRowPaidLink({ brand: 'Six Zero', makerUrl: null }).paid, false);
  assert.equal(courtRowPaidLink({ brand: 'Nobody', makerUrl: 'https://maker.example/x' }).paid, false);
  assert.equal(courtRowPaidLink({ brand: 'Selkirk', makerUrl: '/paddles/some-paddle' }).paid, false, 'a register path never pays');
  assert.equal(courtPaidRowCount([{ brand: 'Selkirk', makerUrl: 'https://maker.example/y' }]), 0);
});
