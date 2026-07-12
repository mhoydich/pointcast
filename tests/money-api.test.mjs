import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { handleMoneyReceipts, handleMoneyWebhook } from '../src/lib/money-api.mjs';
import { moneyReceiptKey } from '../src/lib/money-runtime.mjs';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

test('Money webhook rejects unsigned live receipts', async () => {
  const env = { PC_MONEY_KV: new MemoryKv() };
  const body = JSON.stringify({
    id: 'evt_live_unsigned',
    data: { object: { id: 'req_live_unsigned', amount: 50, merchantName: 'replicate.com', mode: 'live' } },
  });
  const response = await handleMoneyWebhook({
    request: new Request('https://pointcast.xyz/api/link/webhook', { method: 'POST', body }),
    env,
  });

  assert.equal(response.status, 401);
  assert.match(await response.text(), /unsigned-live-receipt-rejected/);
});

test('Money webhook stores signed test receipts and is idempotent by event id', async () => {
  const kv = new MemoryKv();
  const secret = 'whsec_test_money';
  const body = JSON.stringify({
    id: 'evt_test_1',
    type: 'spend_request.settled',
    data: {
      object: {
        id: 'req_test_1',
        amount: 10,
        currency: 'usd',
        merchantName: 'replicate.com',
        merchantUrl: 'https://replicate.com',
        mode: 'test',
        status: 'settled',
        context: 'Testmode Link request for validating PointCast Money receipt intake and promotion.',
        metadata: {
          agent: 'codex',
          loop: 'scout',
          credential_label: 'Stripe Link test credential',
        },
      },
    },
  });
  const signature = await signStripe(body, secret);
  const request = () =>
    new Request('https://pointcast.xyz/api/link/webhook', {
      method: 'POST',
      body,
      headers: { 'stripe-signature': signature },
    });

  const first = await handleMoneyWebhook({ request: request(), env: { PC_MONEY_KV: kv, LINK_WEBHOOK_SECRET: secret } });
  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.ok, true);
  assert.equal(firstBody.receipt.amountCents, 10);

  const stored = await kv.get(moneyReceiptKey('req_test_1'));
  assert.ok(stored);
  assert.equal(JSON.parse(stored).signatureVerified, true);

  const second = await handleMoneyWebhook({ request: request(), env: { PC_MONEY_KV: kv, LINK_WEBHOOK_SECRET: secret } });
  assert.equal(second.status, 200);
  assert.equal((await second.json()).duplicate, true);
});

test('Money receipts endpoint requires admin token and returns drafts', async () => {
  const kv = new MemoryKv();
  await kv.put(moneyReceiptKey('req_admin_1'), JSON.stringify({
    id: 'req_admin_1',
    linkSessionId: 'req_admin_1',
    agent: 'codex',
    loop: 'scout',
    amountCents: 50,
    amountUsd: 0.5,
    currency: 'USD',
    merchant: 'replicate.com',
    mode: 'live',
    status: 'approved',
    updatedAt: '2026-05-02T12:00:00.000Z',
  }));

  const denied = await handleMoneyReceipts({
    request: new Request('https://pointcast.xyz/api/link/receipts'),
    env: { PC_MONEY_KV: kv, MONEY_ADMIN_TOKEN: 'secret' },
  });
  assert.equal(denied.status, 401);

  const allowed = await handleMoneyReceipts({
    request: new Request('https://pointcast.xyz/api/link/receipts', {
      headers: { authorization: 'Bearer secret' },
    }),
    env: { PC_MONEY_KV: kv, MONEY_ADMIN_TOKEN: 'secret' },
  });
  assert.equal(allowed.status, 200);
  const payload = await allowed.json();
  assert.equal(payload.count, 1);
  assert.equal(payload.receipts[0].id, 'req_admin_1');
  assert.equal(payload.allowance.reservedDraftCents, 50);
});

class MemoryKv {
  store = new Map();

  async get(key) {
    return this.store.get(key) ?? null;
  }

  async put(key, value) {
    this.store.set(key, value);
  }

  async list({ prefix = '', limit = 100 } = {}) {
    return {
      keys: [...this.store.keys()]
        .filter((name) => name.startsWith(prefix))
        .slice(0, limit)
        .map((name) => ({ name })),
    };
  }
}

async function signStripe(raw, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${raw}`));
  const hex = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${hex}`;
}
