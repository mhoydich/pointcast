import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAggregate, onRequest } from '../functions/api/field.ts';

function makeKv() {
  const values = new Map();
  const metadata = new Map();

  return {
    values,
    metadata,
    async get(key) {
      return values.get(key) ?? null;
    },
    async put(key, value, options = {}) {
      values.set(key, value);
      metadata.set(key, options.metadata ?? null);
    },
    async list(options = {}) {
      const prefix = options.prefix ?? '';
      const keys = [...values.keys()]
        .filter((key) => key.startsWith(prefix))
        .sort()
        .map((name) => ({ name, metadata: metadata.get(name) ?? null }));
      return { keys, list_complete: true, cacheStatus: null };
    },
  };
}

function fieldRequest(body) {
  return new Request('https://pointcast.xyz/api/field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function context(request, env) {
  return {
    request,
    env,
    functionPath: '/api/field',
    params: {},
    data: {},
    waitUntil() {},
    next: async () => new Response('next'),
  };
}

test('field aggregate counts receipts and recognizes a participant across invitations', () => {
  const aggregate = buildAggregate([
    'field:v1:receipt:PC-FIELD-001:aaa',
    'field:v1:receipt:PC-FIELD-002:aaa',
    'field:v1:receipt:PC-FIELD-001:bbb',
  ]);

  assert.deepEqual(aggregate, {
    completedReceipts: 3,
    returningParticipants: 1,
    activeInvitations: 2,
  });
});

test('field participation stores only a hashed token receipt and deduplicates it', async () => {
  const kv = makeKv();
  const participantToken = '33ef3823-e63d-4f05-8c31-f9a48f7bbad5';
  const payload = {
    type: 'pointcast-field-participation-v1',
    invitationId: 'PC-FIELD-001',
    participantToken,
    consent: true,
  };

  const first = await onRequest(context(fieldRequest(payload), { VISITS: kv }));
  const firstJson = await first.json();
  assert.equal(first.status, 200);
  assert.equal(firstJson.created, true);
  assert.equal(firstJson.aggregate.completedReceipts, 1);

  const [storedKey] = [...kv.values.keys()];
  assert.match(storedKey, /^field:v1:receipt:PC-FIELD-001:[0-9a-f]{64}$/);
  assert.doesNotMatch(storedKey, new RegExp(participantToken));
  assert.equal(kv.values.get(storedKey), '1');
  assert.deepEqual(Object.keys(kv.metadata.get(storedKey)).sort(), ['invitationId', 'recordedAt']);

  const second = await onRequest(context(fieldRequest(payload), { VISITS: kv }));
  const secondJson = await second.json();
  assert.equal(second.status, 200);
  assert.equal(secondJson.created, false);
  assert.equal(secondJson.aggregate.completedReceipts, 1);

  const aggregateResponse = await onRequest(context(
    new Request('https://pointcast.xyz/api/field'),
    { VISITS: kv },
  ));
  const aggregateJson = await aggregateResponse.json();
  assert.equal(aggregateJson.aggregate.completedReceipts, 1);
  assert.equal(aggregateJson.aggregate.returningParticipants, 0);
  assert.deepEqual(
    aggregateJson.privacy.neverStores,
    ['observation choices', 'note', 'photo', 'location', 'IP address', 'user agent'],
  );
});

test('field participation rejects observation content and requires consent', async () => {
  const kv = makeKv();
  const base = {
    type: 'pointcast-field-participation-v1',
    invitationId: 'PC-FIELD-001',
    participantToken: 'e22c8a08-5d7f-41bc-87c8-b29eaa4ca6bb',
    consent: true,
  };

  const withObservation = await onRequest(context(
    fieldRequest({ ...base, note: 'This must remain on-device.' }),
    { VISITS: kv },
  ));
  assert.equal(withObservation.status, 400);
  assert.equal((await withObservation.json()).error, 'unexpected-fields');

  const withoutConsent = await onRequest(context(
    fieldRequest({ ...base, consent: false }),
    { VISITS: kv },
  ));
  assert.equal(withoutConsent.status, 400);
  assert.equal((await withoutConsent.json()).error, 'explicit-consent-required');
  assert.equal(kv.values.size, 0);
});

test('field participation preflight is bodyless and origin-scoped', async () => {
  const response = await onRequest(context(
    new Request('https://pointcast.xyz/api/field', { method: 'OPTIONS' }),
    {},
  ));

  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'https://pointcast.xyz',
  );
});
