import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const ADMIN = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
const KENNEL = 'KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq';
const SEALS_V2 = 'KT1UVn9CDToAbyoxARLPfNtVkvKgzCwuroy3';
const SAFE = 'KT19Xcb8UuUUUaYTJ2Z7cdqYAhRaFi7UThwG';
const OP_HASH = `o${'1'.repeat(50)}`;

async function withModules(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const [queue, operations, access, rows] = await Promise.all([
      server.ssrLoadModule('/functions/api/director/queue.ts'),
      server.ssrLoadModule('/src/lib/director-operations.ts'),
      server.ssrLoadModule('/src/lib/director-access.ts'),
      server.ssrLoadModule('/src/lib/desk-rows.ts'),
    ]);
    return await run({ queue, operations, access, rows });
  } finally {
    await server.close();
  }
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async first() {
    if (this.sql.startsWith('SELECT token, user_id, expires_at FROM sessions')) {
      return this.db.session;
    }
    if (this.sql.startsWith('SELECT payload FROM users')) {
      return { payload: JSON.stringify(this.db.user) };
    }
    if (this.sql.includes('FROM claims')) return { count: 4 };
    if (this.sql.includes('FROM subscribers')) return { count: 12 };
    if (this.sql.includes('FROM aliases')) return { count: 3 };
    if (this.sql.includes('FROM seal_receipts')) return { count: 8 };
    throw new Error(`Unsupported fake first(): ${this.sql}`);
  }
  async all() {
    if (this.sql.startsWith('SELECT id, done FROM director_state')) {
      return { results: [...this.db.directorState].map(([id, done]) => ({ id, done: done ? 1 : 0 })) };
    }
    throw new Error(`Unsupported fake all(): ${this.sql}`);
  }
  async run() {
    if (this.sql.startsWith('INSERT INTO director_state')) {
      this.db.directorState.set(this.args[0], Boolean(this.args[1]));
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.startsWith('DELETE FROM sessions')) return { success: true, meta: { changes: 0 } };
    throw new Error(`Unsupported fake run(): ${this.sql}`);
  }
}

class FakeD1 {
  constructor(user) {
    this.user = user;
    this.session = { token: 'session-test', user_id: user.userId, expires_at: Date.now() + 60_000 };
    this.directorState = new Map([['mailbox-purchase', true]]);
  }
  prepare(sql) { return new FakeStatement(this, sql); }
}

function fakeUser({ roles = [], identities = [] } = {}) {
  return {
    userId: 'pcu_director_test',
    createdAt: '2026-09-04T00:00:00.000Z',
    preferredName: 'Director',
    roles,
    identities,
  };
}

function tzktFetch(input) {
  const url = String(input);
  if (url.includes(`/contracts/${KENNEL}/storage`)) {
    return Promise.resolve(Response.json({ treasury: ADMIN, supply: 4321 }));
  }
  if (url.includes('/bigmaps/4321/keys')) return Promise.resolve(Response.json({ value: '6' }));
  if (url.includes(`/contracts/${SEALS_V2}/storage`)) return Promise.resolve(Response.json({ paused: true }));
  if (url.includes('/accounts/')) return Promise.resolve(Response.json({ balance: 2_500_000 }));
  return Promise.resolve(Response.json({ error: 'not found' }, { status: 404 }));
}

test('director access accepts the role or the linked admin Tezos identity', async () => {
  await withModules(({ access }) => {
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser({ roles: ['broadcaster'] }) }), true);
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser({ identities: [{ provider: 'kukai', id: ADMIN }] }) }), true);
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser({ identities: [{ provider: 'google', id: ADMIN }] }) }), false);
    assert.equal(access.hasDirectorDeskAccess({ user: fakeUser() }), false);
  });
});

test('the chain-derived queue emits exact one-click operations plus till and today data', async () => {
  await withModules(async ({ queue }) => {
    const db = new FakeD1(fakeUser({ roles: ['broadcaster'] }));
    const result = await queue.buildDirectorQueue({ AUTH_DB: db, KENNEL_CLUB_CLAIM_DAILY_CAP: '50' }, { fetcher: tzktFetch });
    const treasury = result.rows.find(({ id }) => id === 'kennel-treasury-safe');
    const seals = result.rows.find(({ id }) => id === 'seals-v2-unpause');
    assert.deepEqual(treasury.operation, { contract: KENNEL, entrypoint: 'set_treasury', args: [SAFE] });
    assert.deepEqual(seals.operation, { contract: SEALS_V2, entrypoint: 'set_paused', args: [false] });
    assert.equal(result.rows.find(({ id }) => id === 'mailbox-purchase').done, true);
    assert.deepEqual(result.today.map(({ id, value }) => [id, value]), [
      ['claims', 4], ['mints', 6], ['subscribers', 12], ['aliases', 3], ['receipts', 8],
    ]);
    assert.deepEqual(result.till.map(({ id }) => id), ['safe', 'claim-wallet', 'cc-wallet', 'kennel-treasury']);
    assert.equal(result.till[3].matchesSafe, false);
  });
});

test('a mocked Beacon operation uses methodsObject, broadcasts, and asks for one confirmation', async () => {
  await withModules(async ({ operations }) => {
    const calls = [];
    const methodArgs = [];
    const confirmations = [];
    const result = await operations.sendDirectorOperationWith(
      { contract: SEALS_V2, entrypoint: 'set_issuer', args: { issuer: ADMIN, allowed: true } },
      {
        connect: async () => ADMIN,
        at: async (address) => ({
          methodsObject: {
            set_issuer: (...args) => {
              methodArgs.push(args);
              return ({
              send: async () => ({
                opHash: OP_HASH,
                confirmation: async (count) => { confirmations.push(count); },
              }),
              });
            },
          },
          address,
        }),
      },
    );
    calls.push(result.address, result.opHash);
    await result.confirmation;
    assert.deepEqual(calls, [ADMIN, OP_HASH]);
    assert.deepEqual(methodArgs, [[{ issuer: ADMIN, allowed: true }]]);
    assert.deepEqual(confirmations, [1]);
  });
});

test('/desk renders the signed-out door first and the three live dashboard columns after authorization', async () => {
  const [page, home] = await Promise.all([
    readFile(new URL('../src/pages/desk.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/HomeFrontDoorDesk.astro', import.meta.url), 'utf8'),
  ]);
  assert.match(page, /data-director-door/);
  assert.match(page, /data-director-board hidden/);
  assert.match(page, />Signatures</);
  assert.match(page, />The till</);
  assert.match(page, />Today</);
  assert.match(page, /createDeskList\(signatures, \{/);
  assert.match(page, /submitDirectorOperation\(operation\)/);
  // The rows are built with createElement, so the styles must be global or
  // Astro's scoped data-astro-cid-* attribute leaves every control unstyled.
  assert.match(page, /<style is:global>/);
  assert.doesNotMatch(page, /<style>\n/);
  assert.match(page, /DESK_LEGEND\.map/);
  assert.match(page, /const POLL_MS = 60_000/);
  assert.match(page, /method: 'POST'/);
  assert.match(home, /href="\/desk">Director’s desk/);
  assert.match(home, /\.slice\(0, 3\)/);
});

test('manual Done writes are director-only and persist only allowlisted queue ids', async () => {
  await withModules(async ({ queue }) => {
    const unauthorized = new FakeD1(fakeUser());
    const denied = await queue.handleDirectorQueueWrite(new Request('https://pointcast.xyz/api/director/queue', {
      method: 'POST', headers: { cookie: 'pc_session=session-test', origin: 'https://pointcast.xyz' },
      body: JSON.stringify({ id: 'resend-dns', done: true }),
    }), { AUTH_DB: unauthorized });
    assert.equal(denied.status, 403);

    const authorized = new FakeD1(fakeUser({ identities: [{ provider: 'kukai', id: ADMIN }] }));
    const saved = await queue.handleDirectorQueueWrite(new Request('https://pointcast.xyz/api/director/queue', {
      method: 'POST', headers: { cookie: 'pc_session=session-test', origin: 'https://pointcast.xyz' },
      body: JSON.stringify({ id: 'resend-dns', done: true }),
    }), { AUTH_DB: authorized });
    assert.equal(saved.status, 200);
    assert.equal(authorized.directorState.get('resend-dns'), true);

    const rejected = await queue.handleDirectorQueueWrite(new Request('https://pointcast.xyz/api/director/queue', {
      method: 'POST', headers: { cookie: 'pc_session=session-test', origin: 'https://pointcast.xyz' },
      body: JSON.stringify({ id: 'not-in-the-queue', done: true }),
    }), { AUTH_DB: authorized });
    assert.equal(rejected.status, 400);
  });
});

test('director_state migration is bounded and tied to authenticated users', async () => {
  const migration = await readFile(new URL('../migrations/auth/0009_director_state.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE director_state/);
  assert.match(migration, /CHECK \(done IN \(0, 1\)\)/);
  assert.match(migration, /FOREIGN KEY \(updated_by\) REFERENCES users\(id\)/);
});

// ── The row itself: WHAT / NOW / AFTER / STATUS ──────────────────────────

function gate() {
  let resolve = () => {};
  let reject = () => {};
  const promise = new Promise((ok, no) => { resolve = ok; reject = no; });
  return { promise, resolve, reject };
}

const tick = async (times = 3) => {
  for (let i = 0; i < times; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

function deskDom() {
  const dom = new JSDOM('<main><ol data-desk-signatures></ol></main>');
  const list = dom.window.document.querySelector('[data-desk-signatures]');
  return { dom, doc: dom.window.document, list };
}

function treasuryRow() {
  return {
    id: 'kennel-treasury-safe',
    kind: 'signature',
    what: 'Send Kennel Club mint proceeds to the project safe',
    why: 'Every 1 ꜩ sitting after this signature pays the 1-of-2 safe.',
    href: `https://better-call.dev/mainnet/${KENNEL}`,
    done: false,
    state: 'open',
    now: { label: 'treasury', value: ADMIN, note: 'your Kukai' },
    after: { label: 'treasury', value: SAFE, note: 'project safe' },
    buttonLabel: 'Sign with Kukai',
    operation: { contract: KENNEL, entrypoint: 'set_treasury', args: [SAFE] },
  };
}

function cellText(item, modifier) {
  return item.querySelector(`.desk-sig__cell--${modifier} .desk-sig__value`)?.textContent ?? '';
}

const pillText = (item) => item.querySelector('.desk-pill')?.textContent ?? '';

/** A desk list wired to the real operation sender with a scripted Beacon. */
function harness({ rows: lib, operations }, wallet) {
  const { doc, dom, list } = deskDom();
  const seen = [];
  const desk = lib.createDeskList(list, {
    doc,
    schedule: () => {},
    submit: (operation) => operations.sendDirectorOperationWith(operation, {
      connect: async () => { seen.push('permissions'); return wallet.address ?? ADMIN; },
      at: async () => ({
        methodsObject: {
          [wallet.entrypoint ?? 'set_treasury']: () => ({
            send: async () => {
              seen.push('send');
              await (wallet.sendGate?.promise ?? Promise.resolve());
              if (wallet.failure) throw wallet.failure;
              return { opHash: OP_HASH, confirmation: () => wallet.confirmGate?.promise ?? Promise.resolve() };
            },
          }),
        },
      }),
    }),
    toggle: async () => {},
    refresh: async () => { seen.push('refresh'); },
  });
  list.addEventListener('click', (event) => { void desk.handleClick(event); });
  const click = () => list.querySelector('[data-desk-action="sign"]')
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  return { desk, list, seen, click, item: () => list.querySelector('[data-queue-id]') };
}

test('a row prints WHAT, NOW, AFTER and a Needs signature pill before anything is clicked', async () => {
  await withModules(({ rows: lib }) => {
    const { doc, list } = deskDom();
    const desk = lib.createDeskList(list, {
      doc, schedule: () => {}, submit: async () => ({ opHash: OP_HASH, confirmation: Promise.resolve() }),
      toggle: async () => {}, refresh: async () => {},
    });
    desk.setRows([treasuryRow()]);
    const item = list.querySelector('[data-queue-id]');
    assert.deepEqual(
      [...item.querySelectorAll('.desk-sig__col')].map((node) => node.textContent),
      ['WHAT', 'NOW', 'AFTER', 'STATUS'],
    );
    assert.match(cellText(item, 'what'), /Send Kennel Club mint proceeds to the project safe/);
    assert.match(cellText(item, 'now'), /treasury: tz2FjJh…MxdFw/);
    assert.match(cellText(item, 'now'), /your Kukai/);
    assert.match(cellText(item, 'after'), /treasury: KT19Xcb…UThwG/);
    assert.match(cellText(item, 'after'), /project safe/);
    assert.equal(pillText(item), 'Needs signature');
    assert.equal(list.querySelector('[data-desk-action="sign"]').textContent, 'Sign with Kukai');
    assert.deepEqual(lib.DESK_LEGEND.map(({ column }) => column), ['WHAT', 'NOW', 'AFTER', 'STATUS']);
  });
});

test('one click asks for permissions, sends, and walks Confirm → Broadcast → Confirmed', async () => {
  await withModules(async (modules) => {
    const wallet = { sendGate: gate(), confirmGate: gate() };
    const rig = harness(modules, wallet);
    rig.desk.setRows([treasuryRow()]);

    rig.click();
    assert.equal(pillText(rig.item()), 'Confirm in Kukai…');
    assert.equal(rig.list.querySelector('[data-desk-action="sign"]').disabled, true);

    wallet.sendGate.resolve();
    await tick();
    assert.match(pillText(rig.item()), /^Broadcast · o111/);
    assert.equal(
      rig.item().querySelector('.desk-pill__op').getAttribute('href'),
      `https://tzkt.io/${OP_HASH}`,
    );

    wallet.confirmGate.resolve();
    await tick();
    assert.equal(pillText(rig.item()), 'Confirmed');
    // Permissions are requested inside the click — no separate connect step.
    assert.deepEqual(rig.seen, ['permissions', 'send', 'refresh']);
  });
});

test('a confirmed row fades to Cleared once the verified queue stops returning it', async () => {
  await withModules(async (modules) => {
    const wallet = { sendGate: gate(), confirmGate: gate() };
    const rig = harness(modules, wallet);
    rig.desk.setRows([treasuryRow()]);
    rig.click();
    wallet.sendGate.resolve();
    wallet.confirmGate.resolve();
    await tick();
    assert.equal(rig.desk.stageOf('kennel-treasury-safe'), 'confirmed');

    rig.desk.setRows([]);
    const ghost = rig.item();
    assert.equal(pillText(ghost), 'Cleared');
    assert.ok(ghost.classList.contains('is-cleared'));
    assert.equal(rig.desk.stageOf('kennel-treasury-safe'), 'cleared');
  });
});

test('a rejected wallet, a wrong wallet, and a dead network each render inline in the row', async () => {
  await withModules(async (modules) => {
    const rejected = harness(modules, { failure: { name: 'AbortedBeaconError', errorType: 'ABORTED_ERROR', message: 'Aborted by user' } });
    rejected.desk.setRows([treasuryRow()]);
    rejected.click();
    await tick();
    assert.match(rejected.item().querySelector('.desk-sig__error').textContent, /Kukai rejected the signature\. Nothing was broadcast\./);
    assert.equal(pillText(rejected.item()), 'Needs signature');
    assert.equal(rejected.list.querySelector('[data-desk-action="sign"]').disabled, false);
    assert.ok(!rejected.seen.includes('refresh'));

    const stranger = harness(modules, { address: 'tz1UvNjifVKhP6Hm3ytVfWtmTiCxKozcYsSG' });
    stranger.desk.setRows([treasuryRow()]);
    stranger.click();
    await tick();
    assert.match(stranger.item().querySelector('.desk-sig__error').textContent, /not the contract admin \(tz2FjJh…MxdFw\)/);

    const offline = harness(modules, { failure: new Error('Failed to fetch') });
    offline.desk.setRows([treasuryRow()]);
    offline.click();
    await tick();
    assert.match(offline.item().querySelector('.desk-sig__error').textContent, /The network did not answer/);
  });
});

test('non-chain rows keep the Done toggle inside the same four-column grid', async () => {
  await withModules(async ({ rows: lib }) => {
    const { doc, dom, list } = deskDom();
    const toggles = [];
    const desk = lib.createDeskList(list, {
      doc,
      schedule: () => {},
      submit: async () => ({ opHash: OP_HASH, confirmation: Promise.resolve() }),
      toggle: async (id, done) => { toggles.push([id, done]); },
      refresh: async () => {},
    });
    desk.setRows([{
      id: 'resend-dns', kind: 'manual', what: 'Finish Resend DNS', why: 'Town mail needs verified sending DNS.',
      href: 'https://resend.com/domains', done: false, state: 'open', toggleable: true, buttonLabel: 'Done',
      now: { label: 'town', value: 'sending domain unverified' },
      after: { label: 'town', value: 'verified SPF and DKIM on pointcast.xyz' },
    }]);
    const item = list.querySelector('[data-queue-id]');
    assert.deepEqual(
      [...item.querySelectorAll('.desk-sig__col')].map((node) => node.textContent),
      ['WHAT', 'NOW', 'AFTER', 'STATUS'],
    );
    assert.equal(pillText(item), 'Open');
    const button = list.querySelector('[data-desk-action="toggle"]');
    assert.equal(button.textContent, 'Done');
    list.addEventListener('click', (event) => { void desk.handleClick(event); });
    button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await tick();
    assert.deepEqual(toggles, [['resend-dns', true]]);
  });
});

test('the signature row factory gives set_issuer, set_window and set_price the same grammar', async () => {
  await withModules(({ queue }) => {
    const built = [
      ['set_issuer', { issuer: ADMIN, allowed: true }, { label: 'issuer', value: 'none' }, { label: 'issuer', value: ADMIN }],
      ['set_window', [0, 86_400], { label: 'window', value: 'closed' }, { label: 'window', value: '24h' }],
      ['set_price', [1_000_000], { label: 'price', value: '0 ꜩ' }, { label: 'price', value: '1 ꜩ' }],
    ].map(([entrypoint, args, now, after]) => queue.directorSignatureRow({
      id: `seals-${entrypoint}`, contract: SEALS_V2, entrypoint, args,
      what: `Set the ${entrypoint.replace('set_', '')}`, why: 'Operating change.',
      href: `https://better-call.dev/mainnet/${SEALS_V2}`, now, after,
    }));
    assert.deepEqual(built.map(({ kind, buttonLabel }) => [kind, buttonLabel]), [
      ['signature', 'Sign with Kukai'], ['signature', 'Sign with Kukai'], ['signature', 'Sign with Kukai'],
    ]);
    assert.deepEqual(built.map(({ operation }) => operation.entrypoint), ['set_issuer', 'set_window', 'set_price']);
    assert.equal(built[0].value, 'issuer: none → issuer: tz2FjJh…MxdFw');
    assert.ok(built.every((row) => row.now && row.after && row.state === 'open' && row.done === false));
  });
});

test('the chain queue carries a plain WHAT sentence with structured NOW and AFTER values', async () => {
  await withModules(async ({ queue }) => {
    const db = new FakeD1(fakeUser({ roles: ['broadcaster'] }));
    const result = await queue.buildDirectorQueue({ AUTH_DB: db, KENNEL_CLUB_CLAIM_DAILY_CAP: '50' }, { fetcher: tzktFetch });
    const treasury = result.rows.find(({ id }) => id === 'kennel-treasury-safe');
    assert.equal(treasury.what, 'Send Kennel Club mint proceeds to the project safe');
    assert.deepEqual(treasury.now, { label: 'treasury', value: ADMIN, note: 'your Kukai' });
    assert.deepEqual(treasury.after, { label: 'treasury', value: SAFE, note: 'project safe' });
    assert.equal(treasury.buttonLabel, 'Sign with Kukai');

    const seals = result.rows.find(({ id }) => id === 'seals-v2-unpause');
    assert.deepEqual(seals.now, { label: 'paused', value: 'true', note: 'issuing blocked' });
    assert.deepEqual(seals.after, { label: 'paused', value: 'false', note: 'issuing open' });

    // Every row — chain, setup and manual alike — reads in the same grammar.
    assert.ok(result.rows.every((row) => row.now?.value && row.after?.value && row.what && row.why));
    const manual = result.rows.find(({ id }) => id === 'resend-dns');
    assert.equal(manual.now.value, 'sending domain unverified');
    const setup = result.rows.find(({ id }) => id.startsWith('contract-'));
    assert.equal(setup.now.value, 'unset');
    assert.equal(setup.buttonLabel, 'Open publisher');
  });
});
