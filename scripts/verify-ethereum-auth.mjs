// E2E check for /api/auth/ethereum — signs the exact message shape
// src/lib/auth/client.ts::loginWithMetaMask() builds, with a throwaway key,
// and asserts the full round trip: ok:true, pc_session cookie, session GET.
// Usage: node scripts/verify-ethereum-auth.mjs [baseUrl]
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const base = process.argv[2] ?? 'https://pointcast.xyz';
const account = privateKeyToAccount(generatePrivateKey());

const message = [
  'PointCast Ethereum Login',
  `Address: ${account.address}`,
  `Origin: ${base}`,
  `Issued At: ${new Date().toISOString()}`,
  `Nonce: ${crypto.randomUUID()}`,
  'Chain ID: 0x1',
].join('\n');

const signature = await account.signMessage({ message });

const res = await fetch(`${base}/api/auth/ethereum`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'metamask',
    address: account.address,
    chainId: '0x1',
    message,
    signature,
  }),
});

const body = await res.json().catch(() => null);
const setCookie = res.headers.get('set-cookie') ?? '';
console.log('POST /api/auth/ethereum →', res.status, JSON.stringify(body));
console.log('Set-Cookie:', setCookie ? setCookie.slice(0, 80) + '…' : '(none)');

if (res.status !== 200 || !body?.ok || !setCookie.includes('pc_session=')) {
  console.error('FAIL: sign-in did not complete');
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

console.log('PASS: full MetaMask-shaped auth round trip OK as', body.user.userId);
