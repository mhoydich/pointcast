import { composeFridayTape } from '../lib/friday-tape.mjs';

export const prerender = true;

// Editorial evidence snapshot, not a live feed. Sources were read before
// pinning: PointCast's Shop Front JSON + LEGO US for the shop line; the
// public Coin and Note page, the exact Loom posts, and GitHub for the rest.
// The chess line reports the recorded move, not an independent adjudication.
const verifiedAt = '2026-11-27T16:18:24.000Z';
const usd = { qty: 1, price: '0.00', currency: 'USD', verifiedAt };
const snapshot = {
  version: 1,
  date: '2026-11-27',
  station: 'PointCast / El Segundo',
  items: [
    { ...usd, kind: 'cc0', label: 'Nouns Money art note (free)',
      sourceUrl: 'https://pointcast.xyz/nouns-money/coin-and-note/' },
    { ...usd, kind: 'loom', label: 'Friday Tape receipt contract posted',
      sourceUrl: 'https://pointcast.xyz/loom?to=loom%3Ac4d385588e832bf16f744461%23m_3439735r6w' },
    { ...usd, kind: 'github', label: 'Hearth work summary (PR 1945 merged)',
      sourceUrl: 'https://github.com/mhoydich/pointcast/pull/1945' },
    { ...usd, kind: 'chess', label: "King's Board Game 2: 18...Qc6 recorded",
      sourceUrl: 'https://pointcast.xyz/loom?to=loom%3A4a4392e213a4960b649680ad%23m_4b3j551z2j' },
    { ...usd, kind: 'shop', label: 'LEGO Shenron & Goku (price snapshot)', price: '179.99',
      sourceUrl: 'https://www.lego.com/en-us/product/dragon-ball-shenron-goku-11390' },
  ],
};

// A malformed snapshot fails closed at build time. No visitor input,
// network, or storage is involved in the route.
export function GET() {
  return new Response(JSON.stringify(composeFridayTape(snapshot)) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
