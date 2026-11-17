/** Static fixture checks; opt-in actual adapter execution is separately labeled below. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test, { after } from 'node:test';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/adapter-contract.fixture.json', import.meta.url), 'utf8'));
const byId = new Map(fixture.cases.map(c => [c.id, c]));
const isoUtc = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === (value.includes('.') ? value : value.replace(/Z$/, '.000Z'));
};

// This deliberately small test-local shape check is not a production validator.
// Error bounds (16 codes, 64 characters each) are fixture conventions, not a
// new adapter contract. Actual adapters retain their own documented bounds.
function envelopeShape(value) {
  return value !== null && typeof value === 'object'
    && value.schema === 'pointcast.office-data/v1'
    && ['ok', 'idle', 'stale', 'error'].includes(value.state)
    && (value.observedAt === null || isoUtc(value.observedAt))
    && (value.sourceUrl === null || typeof value.sourceUrl === 'string')
    && Object.hasOwn(value, 'data')
    && Array.isArray(value.errors) && value.errors.length <= 16
    && value.errors.every(code => typeof code === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(code));
}

const checks = {
  'declaration-invalid': c => assert.notEqual(c.input.declaration.schema, 'pointcast.office-declaration/v1'),
  'declaration-unverified': c => assert.equal(c.input.options.attestation, null),
  'declaration-self-attested': c => {
    assert.equal(c.input.declaration.verified, true);
    assert.ok(c.input.declaration.attestation);
    assert.equal(c.input.options.attestation, null);
  },
  'declaration-expired': c => assert.ok(Date.parse(c.input.declaration.expiresAt) < fixture.now),
  'declaration-mismatched': c => assert.notEqual(c.input.options.attestation.runtimeId, c.input.declaration.runtimeId),
  'declaration-future-attestation': c => assert.ok(Date.parse(c.input.options.attestation.verifiedAt) > fixture.now),
  'declaration-valid-over-120s': c => {
    const { declaration, options: { attestation } } = c.input;
    for (const key of ['handle', 'parentSeat', 'model', 'runtimeId', 'job', 'ownedFiles']) {
      assert.deepEqual(attestation[key], declaration[key]);
    }
    const verifiedAt = Date.parse(attestation.verifiedAt);
    const expiresAt = Date.parse(declaration.expiresAt);
    assert.ok(fixture.now - verifiedAt > 120000);
    assert.ok(expiresAt > fixture.now && expiresAt - verifiedAt <= 86400000);
    assert.equal(c.expected.verified, true);
  },
  'feed-empty': c => {
    assert.equal(c.input.response.status, 200);
    assert.deepEqual(c.input.response.json.messages, []);
    assert.deepEqual(c.expected, { state: 'idle', messages: [] });
  },
  'feed-failed': c => {
    assert.equal(c.input.response.status, 503);
    assert.deepEqual(c.expected, { state: 'error', messages: [], rawPayloadExposed: false });
    assert.ok(!JSON.stringify(c.expected).includes(c.input.response.text));
  },
  'events-stale-read': c => {
    assert.ok(fixture.now - Date.parse(c.input.rooms[0].observedAt) > c.input.maxAgeMs);
    assert.equal(c.expected.mustNotBeOk, true);
  },
  'events-failed-read': c => {
    assert.equal(c.input.rooms[0].state, 'error');
    assert.equal(c.input.rooms[0].observedAt, null);
    assert.equal(c.expected.mustNotBeOk, true);
  },
  'events-future-read': c => {
    assert.ok(Date.parse(c.input.rooms[0].observedAt) > fixture.now);
    assert.equal(c.expected.mustNotBeOk, true);
  },
  'events-echo': c => {
    assert.ok(c.input.rooms[0].data.messages[0].via.id);
    assert.equal(c.expected.state, 'idle');
  },
  'events-missing-parent': c => {
    const messages = c.input.rooms[0].data.messages;
    assert.deepEqual(c.expected.unresolvedMessageIds, [messages[0].id]);
    assert.deepEqual(c.expected.forbiddenMessageIds, [messages[0].parent]);
    assert.ok(!messages.some(m => m.id === messages[0].parent));
  },
  'events-duplicate': c => {
    const { room, messages } = c.input.rooms[0].data;
    assert.deepEqual(messages[0], messages[1]);
    assert.deepEqual(c.expected.eventKeys, [[room.key, messages[0].id]]);
  },
  'events-cross-room': c => {
    const [a, b] = c.input.rooms.map(r => r.data);
    assert.equal(a.messages[0].id, b.messages[0].id);
    assert.notEqual(a.room.key, b.room.key);
    assert.deepEqual(c.expected.eventKeys, [[a.room.key, a.messages[0].id], [b.room.key, b.messages[0].id]]);
  },
  'events-invalid-message-time': c => assert.equal(isoUtc(c.input.rooms[0].data.messages[0].at), false),
  'registry-unverified': c => assert.equal(c.input.declarations[0].validation.verified, false),
  'registry-invalid': c => assert.equal(c.input.declarations[0].validation.valid, false),
  'registry-missing-portrait': c => {
    assert.equal(c.input.declarations[0].validation.verified, true);
    assert.deepEqual(c.input.portraits, {});
  },
  'pr-unknown': c => {
    assert.equal(c.input.response.json.merged, null);
    assert.equal(c.expected.blocked, null);
    assert.equal(c.expected.state, 'unknown');
  },
  'pr-unverified-merge': c => {
    assert.equal(c.input.response.json.merged, true);
    assert.equal(c.input.response.json.merge_commit_sha, null);
    assert.equal(c.expected.state, 'unknown');
  },
  'pr-contradictory-merge': c => {
    assert.equal(c.input.response.json.merged, false);
    assert.ok(c.input.response.json.merged_at && c.input.response.json.merge_commit_sha);
    assert.equal(c.expected.state, 'unknown');
  },
  'pr-draft-not-blocked': c => {
    assert.equal(c.input.response.json.draft, true);
    assert.equal(c.expected.state, 'draft');
    assert.equal(c.expected.blocked, null);
  },
};

test('fixture manifest is explicitly synthetic, deterministic and covers every declared scenario', () => {
  assert.equal(fixture.fixtureOnly, true);
  assert.match(fixture.notice, /not sibling adapter execution/);
  assert.equal(Date.parse(fixture.nowIso), fixture.now);
  assert.equal(byId.size, fixture.cases.length);
  assert.deepEqual([...byId.keys()].sort(), Object.keys(checks).sort());
  assert.deepEqual([...new Set(fixture.cases.map(c => c.adapter))].sort(),
    ['buildDeskRegistry', 'normalizeLoomEvents', 'readLoom', 'readPrStates', 'validateDeclaration']);
});

for (const example of fixture.envelopeExamples) {
  test(`fixture envelope shape: ${example.id}`, () => assert.equal(envelopeShape(example.value), example.valid));
}

for (const c of fixture.cases) {
  test(`fixture expectations only: ${c.id}`, () => {
    assert.equal(c.input.now ?? c.input.options?.now, fixture.now);
    assert.ok(c.note.length > 0);
    checks[c.id](c);
    if (c.adapter === 'validateDeclaration') {
      assert.match(c.input.declaration.handle, /^@fixture-/);
      assert.equal(c.expected.verified, c.id === 'declaration-valid-over-120s');
    }
    if (c.adapter === 'normalizeLoomEvents') {
      for (const r of c.input.rooms) {
        assert.ok(envelopeShape(r));
        assert.match(r.data.room.address, /^#fixture-/);
        for (const m of r.data.messages) assert.match(m.from.address, /^@fixture-/);
      }
      if (['events-stale-read', 'events-failed-read', 'events-future-read', 'events-echo', 'events-invalid-message-time'].includes(c.id)) {
        assert.deepEqual(c.expected.events, []);
      }
    }
    if (c.adapter === 'buildDeskRegistry') {
      assert.equal(c.expected.eligible, false);
      assert.deepEqual(c.expected.forbiddenStates, ['active', 'running']);
    }
    if (c.adapter === 'readPrStates') {
      assert.deepEqual(c.input.prs, [900001]);
      assert.equal(c.expected.mergeEventEligible, false);
    }
  });
}

// Opt-in implementation tests. A missing/unimportable module in a configured
// root is a failure, never a silent skip. No implementation is bundled here.
const adapterFiles = {
  validateDeclaration: 'declarations.mjs', readLoom: 'loom-read.mjs',
  buildDeskRegistry: 'desk-registry.mjs', normalizeLoomEvents: 'events.mjs',
  readPrStates: 'pr-state.mjs',
};
const adapterRoot = process.env.OFFICE_ADAPTER_ROOT;
const adapters = {};
const originalFetch = globalThis.fetch;
let unexpectedFetches = 0;
// Fail before imports as well as during calls, including caught fetch attempts.
globalThis.fetch = async () => { unexpectedFetches++; throw new Error('network_forbidden_in_fixture_tests'); };
after(() => {
  globalThis.fetch = originalFetch;
  assert.equal(unexpectedFetches, 0, 'adapters must use only the injected fake fetcher');
});
if (adapterRoot) {
  const { resolve } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  for (const [name, file] of Object.entries(adapterFiles)) {
    adapters[name] = (await import(pathToFileURL(resolve(adapterRoot, file)).href))[name];
    assert.equal(typeof adapters[name], 'function', `missing export: ${name}`);
  }
}

for (const c of fixture.cases) {
  test(`actual adapter execution: ${c.id}`, {
    skip: adapterRoot ? false : 'Set OFFICE_ADAPTER_ROOT to assembled modules; fixture checks do not execute adapters.',
  }, async () => {
    const input = structuredClone(c.input);
    const { response, ...options } = input;
    const requests = [];
    if (response) {
      const allowedUrl = c.adapter === 'readLoom'
        ? `https://pointcast.xyz/api/loom?to=${encodeURIComponent(input.to)}`
        : `https://api.github.com/repos/mhoydich/pointcast/pulls/${input.prs[0]}`;
      options.fetcher = async (url, init) => {
        requests.push({ url, method: init?.method, credentials: init?.credentials });
        // Throwing here alone is insufficient: fail-closed adapters catch it.
        // Validate the captured requests after the adapter returns as well.
        assert.equal(url, allowedUrl);
        assert.equal(init?.method, 'GET');
        assert.equal(init?.credentials, 'omit');
        return new Response(response.text ?? JSON.stringify(response.json), {
          status: response.status,
          headers: { 'content-type': 'application/json', ...response.headers },
        });
      };
    }
    const actual = c.adapter === 'validateDeclaration'
      ? await adapters[c.adapter](input.declaration, input.options)
      : await adapters[c.adapter](options);
    if (response) {
      assert.ok(requests.length > 0);
      assert.ok(requests.length <= (c.adapter === 'readLoom' ? 1 : 2));
      for (const request of requests) {
        assert.equal(request.url, c.adapter === 'readLoom'
          ? `https://pointcast.xyz/api/loom?to=${encodeURIComponent(input.to)}`
          : `https://api.github.com/repos/mhoydich/pointcast/pulls/${input.prs[0]}`);
        assert.equal(request.method, 'GET');
        assert.equal(request.credentials, 'omit');
      }
    }
    const expected = c.expected;
    if (c.adapter === 'validateDeclaration') {
      assert.equal(actual.verified, expected.verified);
      if (expected.verified) assert.equal(actual.valid, true);
      return;
    }
    assert.equal(actual.schema, 'pointcast.office-data/v1');
    assert.ok(['ok', 'idle', 'stale', 'error'].includes(actual.state));
    assert.ok(actual.observedAt === null || isoUtc(actual.observedAt));
    assert.ok(actual.sourceUrl === null || typeof actual.sourceUrl === 'string');
    assert.ok(Array.isArray(actual.errors));
    assert.ok(actual.errors.every(code => typeof code === 'string' && /^[a-zA-Z0-9_:-]{1,128}$/.test(code)));
    const data = actual.data;
    if (c.adapter === 'readPrStates') {
      assert.equal(data.pullRequests.length, 1);
      const row = data.pullRequests[0];
      assert.equal(row.number, input.prs[0]);
      assert.equal(row.headSha, response.json.head.sha, 'scripted PR must pass transport/schema checks');
      assert.equal(row.state, expected.state);
      if (Object.hasOwn(expected, 'blocked')) assert.equal(row.blocked, expected.blocked);
      assert.equal(row.state === 'merged' && !!row.mergedAt && !!row.mergeSha, expected.mergeEventEligible);
    } else {
      if (expected.state) assert.equal(actual.state, expected.state);
      if (expected.mustNotBeOk) assert.notEqual(actual.state, 'ok');
    }
    if (expected.messages) assert.deepEqual(data.messages, expected.messages);
    if (expected.rawPayloadExposed === false) assert.ok(!JSON.stringify(actual).includes(response.text));
    if (expected.events) assert.deepEqual(data.events, expected.events);
    if (expected.eventKeys) assert.deepEqual(data.events.map(e => [e.roomKey, e.messageId]).sort(), [...expected.eventKeys].sort());
    if (expected.unresolvedMessageIds) {
      assert.deepEqual(data.unresolvedReplies.map(e => e.messageId).sort(), [...expected.unresolvedMessageIds].sort());
    }
    if (expected.forbiddenMessageIds) {
      assert.ok([...data.events, ...data.unresolvedReplies].every(e => !expected.forbiddenMessageIds.includes(e.messageId)));
    }
    if (Object.hasOwn(expected, 'eligible')) {
      assert.equal(data.desks.length, 1);
      assert.ok(data.desks.every(d => d.eligible === expected.eligible && !expected.forbiddenStates.includes(d.state)));
    }
  });
}
