import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  MONEY_LIVE_CAP_CENTS,
  assertNoMoneySecrets,
  buildAllowanceSummary,
  formatUsd,
  normalizeMoneyReceiptDraft,
  verifyStripeSignature,
} from '../src/lib/money-runtime.mjs';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

test('Money allowance counts canonical live spend plus unpromoted live drafts', () => {
  const allowance = buildAllowanceSummary(
    {
      liveCents: 500,
      testCents: 100,
      receipts: [{ linkSessionId: 'req_promoted', mode: 'live', amountCents: 500 }],
    },
    [
      { linkSessionId: 'req_pending', mode: 'live', status: 'pending', amountCents: 1000 },
      { linkSessionId: 'req_test', mode: 'test', status: 'approved', amountCents: 9999 },
      { linkSessionId: 'req_promoted', mode: 'live', status: 'settled', amountCents: 500 },
    ],
  );

  assert.equal(allowance.capCents, MONEY_LIVE_CAP_CENTS);
  assert.equal(allowance.liveReservedCents, 1500);
  assert.equal(allowance.remainingCents, 500);
  assert.equal(allowance.pendingReceiptCount, 2);
  assert.equal(allowance.remainingLabel, '$5.00');
});

test('Money receipt normalization redacts card-like values and omits raw payment tokens', () => {
  const draft = normalizeMoneyReceiptDraft({
    id: 'evt_1',
    data: {
      object: {
        id: 'req_123',
        amount: 50,
        currency: 'usd',
        merchantName: 'replicate.com',
        mode: 'live',
        status: 'settled',
        context: 'A sufficiently detailed approval context for a small Replicate top-up.',
        card_number: '4242424242424242',
        payment_method_id: 'pm_secret_123',
        metadata: {
          agent: 'codex',
          loop: 'scout',
          credential_label: 'Mastercard 4242',
        },
      },
    },
  }, { now: '2026-05-02T12:00:00.000Z' });

  assert.equal(draft.amountCents, 50);
  assert.equal(draft.credentialLabel, 'Mastercard ****');
  assert.equal(draft.agent, 'codex');
  assert.equal(assertNoMoneySecrets(draft).length, 0);
  assert.equal(JSON.stringify(draft).includes('4242424242424242'), false);
  assert.equal(JSON.stringify(draft).includes('pm_secret_123'), false);
});

test('Stripe-style signature verification accepts current valid signatures only', async () => {
  const raw = JSON.stringify({ id: 'evt_money_test' });
  const secret = 'whsec_test_money';
  const timestamp = 1777742400;
  const validHeader = await signStripe(raw, secret, timestamp);

  assert.equal(await verifyStripeSignature(raw, validHeader, secret, 300, timestamp * 1000), true);
  assert.equal(await verifyStripeSignature(raw, validHeader, 'wrong', 300, timestamp * 1000), false);
  assert.equal(await verifyStripeSignature(raw, validHeader, secret, 300, (timestamp + 1000) * 1000), false);
});

test('USD formatter keeps cents visible for audit rows', () => {
  assert.equal(formatUsd(60), '$0.60');
  assert.equal(formatUsd(2000), '$20.00');
});

async function signStripe(raw, secret, timestamp) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${raw}`));
  const hex = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${hex}`;
}
