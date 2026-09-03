import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { isDirector, claimedToday } from '../src/lib/front-door-desk.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('September landing hydrates today’s plate and keeps one visitor CTA with three deliberate secondary doors', async () => {
  const [home, desk] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeFrontDoorDesk.astro'),
  ]);

  assert.match(home, /<HomeFrontDoorDesk today=\{frontDoorToday\} news=\{frontDoorNews\} \/>/);
  assert.match(desk, /data-kennel-today="image"/);
  assert.match(desk, /hydrateKennelToday\(\)/);
  assert.match(desk, />Claim today’s dog — free<\/a>/);
  assert.equal((desk.match(/class="front-desk__primary"/g) ?? []).length, 1);
  assert.match(desk, /href="\/collect">Get a dog a day by email/);
  assert.match(desk, /href="\/me" data-front-handle>Claim a handle/);
  assert.match(desk, /href="\/x402">Agents: pay a penny/);
  assert.match(desk, /addEventListener\('pc:auth-change', refresh/);
  assert.match(desk, /\.front-desk__person\[hidden\] \{ display: none; \}/);
  assert.match(desk, /fetch\('\/api\/me\/state'/);
  assert.match(desk, /fetch\('\/api\/collect\/me'/);
});

test('New this week is maintained as a dated seven-item data contract', async () => {
  const news = JSON.parse(await read('src/data/front-door-news.json'));
  assert.deepEqual(news.map((item) => item.label), [
    'Kennel Club',
    'Handles + profiles',
    'Seals',
    'Post office',
    'Paid town actions',
    'Passkeys',
    'The safe',
  ]);
  for (const item of news) {
    assert.match(item.date, /^2026-09-0[23]$/);
    assert.ok(item.line.length > 20);
    assert.match(item.link, /^\//);
  }
});

test('director panel is absent for a visitor and rendered for a fake director session', async () => {
  const desk = await read('src/components/HomeFrontDoorDesk.astro');
  const visitor = { user: { roles: [] } };
  const director = { user: { roles: ['broadcaster'] } };
  assert.equal(isDirector(visitor), false);
  assert.equal(isDirector(director), true);
  assert.match(desk, /if \(isDirector\(session\)\)[\s\S]*renderDirector\(queue\.rows/);
  assert.match(desk, /root\.prepend\(fragment\)/);
  assert.equal(claimedToday([1, 2, 3], 3), true);
  assert.equal(claimedToday([1, 2], 3), false);
});

test('director queue is gated, chain-derived, cached for 60 seconds, and privately returned', async () => {
  const [queue, contracts, manual] = await Promise.all([
    read('functions/api/director/queue.ts'),
    read('src/data/contracts.json'),
    read('src/data/director-queue.json'),
  ]);
  assert.match(queue, /roles\?\.includes\('broadcaster'\)/);
  assert.match(queue, /return authJson\(\{ ok: false, reason: 'forbidden' \}, \{ status: 403 \}\)/);
  assert.match(queue, /const CHAIN_CACHE_SECONDS = 60/);
  assert.match(queue, /\.edge-cache\/director\/chain-v1/);
  assert.match(queue, /context\.waitUntil\(promise\)/);
  assert.match(queue, /'Cache-Control': 'private, no-store'/);
  assert.match(queue, /set_treasury → safe/);
  assert.match(queue, /unpause seals v2/);
  assert.match(queue, /SELECT COUNT\(\*\) AS count FROM subscribers/);
  assert.match(queue, /SELECT COUNT\(\*\) AS count FROM aliases/);
  assert.match(contracts, /"seal_soulbound_v2"\s*:\s*\{\s*"mainnet": ""/s);
  const manualItems = JSON.parse(manual);
  assert.deepEqual(manualItems.map((item) => item.id), ['board-001-sunday', 'mailbox-purchase', 'resend-dns']);
});

test('home unfurl v5 keeps a request-time today dog card', async () => {
  const [home, middleware, card, generator] = await Promise.all([
    read('src/pages/index.astro'),
    read('functions/_middleware.ts'),
    read('scripts/og-home-card.mjs'),
    read('scripts/generate-og-images.mjs'),
  ]);
  assert.match(home, /og-home-v5\.png/);
  assert.match(card, /og-home-v5/);
  assert.match(generator, /og-home-v5\.png/);
  assert.match(middleware, /og\/kennel-club\/today\.png/);
  assert.match(middleware, /request-time/);
});
