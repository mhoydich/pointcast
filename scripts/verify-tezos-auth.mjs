// E2E check for /api/auth/tezos — signs the exact message shape
// src/lib/auth/client.ts::loginWithKukai() builds, with a throwaway
// in-memory ed25519 key, and asserts the full round trip: ok:true,
// pc_session cookie, session GET.
// Usage: node scripts/verify-tezos-auth.mjs [baseUrl]
//
// The key below is a THROWAWAY generated for this script — it holds no
// funds and exists only so repeat runs hit one stable test identity.
// Delete the created user keys from USERS KV after a prod run:
//   user:{userId}, identity:kukai:{address}, session:{token}
import { InMemorySigner } from '@taquito/signer';

const THROWAWAY_SK = 'edsk33gdADfZ5m1Aw6gz6at1i1L9B3PXa28QdD4arzpWwxFF8Vg95w';

const base = process.argv[2] ?? 'https://pointcast.xyz';
const signer = await InMemorySigner.fromSecretKey(THROWAWAY_SK);
const publicKey = await signer.publicKey();
const address = await signer.publicKeyHash();

const message = [
  'PointCast Tezos Login',
  `Address: ${address}`,
  `Origin: ${base}`,
  `Issued At: ${new Date().toISOString()}`,
  `Nonce: ${crypto.randomUUID()}`,
].join('\n');

const messageHex = Buffer.from(message, 'utf8').toString('hex');
const { prefixSig } = await signer.sign(messageHex);

const res = await fetch(`${base}/api/auth/tezos`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address,
    publicKey,
    signature: prefixSig,
    message,
  }),
});

const body = await res.json().catch(() => null);
const setCookie = res.headers.get('set-cookie') ?? '';
console.log('POST /api/auth/tezos →', res.status, JSON.stringify(body));
console.log('Set-Cookie:', setCookie ? setCookie.slice(0, 80) + '…' : '(none)');

if (res.status !== 200 || !body?.ok || !setCookie.includes('pc_session=')) {
  console.error('FAIL: Tezos sign-in did not complete');
  process.exit(1);
}

const cookie = setCookie.split(';')[0];
const sess = await fetch(`${base}/api/auth/session`, { headers: { cookie } });
const sessBody = await sess.json().catch(() => null);
console.log('GET /api/auth/session →', sess.status, JSON.stringify(sessBody));

if (sess.status !== 200 || !sessBody?.user) {
  console.error('FAIL: session cookie did not resolve to a user');
  process.exit(1);
}

console.log('PASS: full Kukai-shaped auth round trip OK as', body.user.userId);
console.log(`cleanup keys → user:${body.user.userId} identity:kukai:${address} session:${body.session.sessionToken}`);
