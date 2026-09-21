import { BRANDS, PADDLES, PADDLE_REGISTER_URL, REGISTER_STATS, publicPaddle } from '../lib/paddle-register';

const body = {
  name: 'The Paddle Register',
  status: 'sourced reference — one permanent record per paddle line; the labs measure, the register keeps the record',
  url: PADDLE_REGISTER_URL,
  license: 'CC0',
  stats: REGISTER_STATS,
  how: {
    perPaddle: `${PADDLE_REGISTER_URL}/{id}.json`,
    calendar: 'https://pointcast.xyz/paddle-calendar.json',
    note: 'Swingweight and twistweight values are each lab\'s own measurement and link to their source. Certification is shown only where a source states it.',
  },
  brands: BRANDS.map((b) => ({ brand: b.brand, url: `${PADDLE_REGISTER_URL}/brand/${b.slug}`, paddles: b.paddles.map((p) => p.id) })),
  paddles: PADDLES.map(publicPaddle),
};

export const GET = () => new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
