import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import manifest from '../src/data/nouns-bandmates-launch.json' with { type: 'json' };
import { nounsBandmatesLaunchAllowed, verifyNounsBandmatesLaunchPackage } from '../src/lib/nouns-bandmates-launch.ts';

const payloadUrl = new URL(`../public${manifest.payload}`, import.meta.url);
const reviewedPayload = await readFile(payloadUrl, 'utf8');

function response({ text, json, ok = true }) {
  return Promise.resolve({ ok, text: async () => text ?? JSON.stringify(json), json: async () => json ?? JSON.parse(text) });
}

function reviewedFetch(input) {
  if (input === manifest.payload) return response({ text: reviewedPayload });
  if (String(input).endsWith('/chains/main/chain_id')) return response({ json: 'NetXdQprcVkpaWU' });
  throw new Error(`Unexpected URL: ${input}`);
}

test('reviewed launch package verifies against its content address and mainnet', async () => {
  const payload = await verifyNounsBandmatesLaunchPackage(manifest, reviewedFetch);
  assert.equal(payload.network, 'mainnet');
  assert.equal(payload.administrator, manifest.administrator);
  assert.equal(payload.code.length > 0, true);
});

test('one-byte package tampering is rejected before any chain read', async () => {
  let chainReads = 0;
  await assert.rejects(
    () => verifyNounsBandmatesLaunchPackage(manifest, (input) => {
      if (input === manifest.payload) return response({ text: `${reviewedPayload} ` });
      chainReads += 1;
      return response({ json: 'NetXdQprcVkpaWU' });
    }),
    /does not match the reviewed version/,
  );
  assert.equal(chainReads, 0);
});

test('wrong declared or connected network fails closed', async () => {
  await assert.rejects(
    () => verifyNounsBandmatesLaunchPackage({ ...manifest, network: 'ghostnet' }, reviewedFetch),
    /not for Tezos mainnet/,
  );
  await assert.rejects(
    () => verifyNounsBandmatesLaunchPackage(manifest, (input) => String(input).endsWith('/chain_id') ? response({ json: 'NetXnHfVqm9iesp' }) : reviewedFetch(input)),
    /mainnet could not be verified/,
  );
});

test('wallet identity, review checkbox, busy state, and duplicate guard all gate launch', () => {
  const base = { busy: false, pending: false, address: manifest.administrator, administrator: manifest.administrator, agreed: true };
  assert.equal(nounsBandmatesLaunchAllowed(base), true);
  assert.equal(nounsBandmatesLaunchAllowed({ ...base, address: `tz1${'A'.repeat(33)}` }), false);
  assert.equal(nounsBandmatesLaunchAllowed({ ...base, agreed: false }), false);
  assert.equal(nounsBandmatesLaunchAllowed({ ...base, busy: true }), false);
  assert.equal(nounsBandmatesLaunchAllowed({ ...base, pending: true }), false);
});

test('launch page records the guard before wallet origination and verifies live code before confirmation copy', async () => {
  const source = await readFile(new URL('../src/lib/nouns-bandmates-launch.ts', import.meta.url), 'utf8');
  const guard = source.indexOf("state: 'wallet-requested'");
  const originate = source.indexOf('.wallet.originate(');
  const verify = source.indexOf('await verifyOriginatedCode(contract.address)');
  const confirmed = source.indexOf("state: 'confirmed'");
  assert.ok(guard >= 0 && originate > guard);
  assert.ok(verify > originate && confirmed > verify);
  assert.doesNotMatch(source, /contract\.applied/);
});
