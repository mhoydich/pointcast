import type { APIRoute } from 'astro';
import { SUPREME_CHAIN, SUPREME_LOOM, SUPREME_NOUNS, SUPREME_SPEC, SUPREME_SWITCH_ON, SUPREME_URL } from '../data/supreme-one';

/**
 * /supreme-one.json — Supreme One · November, as data: the five Supreme Office
 * Nouns, what each would drip, how to get in line, the CC0 kit files, and what
 * has to be true before anything is sent. Static; status is "concept".
 */
export const GET: APIRoute = () => {
  const payload = {
    spec: SUPREME_SPEC,
    name: 'Supreme One · November',
    url: SUPREME_URL,
    status: 'concept',
    summary: 'Five Supreme Office Nouns on Solana, each a faucet that drips one SPL token a day to any Solana address the holder names. The tokens are not created yet; getting in line posts a public note to the Loom. Nothing touches a chain.',
    chain: { ...SUPREME_CHAIN, mints: null, mintsNote: 'Five SPL mints, one per noun, created only after Mike says go.' },
    note: '"Supreme" is the plain word (the highest kind); no brand affiliation.',
    nouns: SUPREME_NOUNS.map((n, i) => ({
      no: i + 1,
      slug: n.slug,
      name: n.name,
      ticker: n.ticker,
      dailyAmount: n.dailyAmount,
      drip: n.drip,
      line: n.line,
      art: `https://pointcast.xyz${n.art}`,
      png: `https://pointcast.xyz${n.art.replace(/\.svg$/, '.png')}`,
      page: `${SUPREME_URL}#${n.slug}`,
      status: 'not poured',
    })),
    signUp: {
      how: 'Post "IN LINE · <noun name>" to the Loom address below, under any name. Public; no address is collected yet.',
      loom: SUPREME_LOOM,
      api: 'https://pointcast.xyz/api/loom',
      thread: `https://pointcast.xyz/loom?to=${encodeURIComponent(SUPREME_LOOM)}#thread`,
    },
    kit: {
      license: 'CC0-1.0',
      files: [
        ...SUPREME_NOUNS.map((n) => ({ name: `${n.slug}.svg`, url: `https://pointcast.xyz${n.art}`, kind: 'image/svg+xml', size: '32x32 pixel grid' })),
        ...SUPREME_NOUNS.map((n) => ({ name: `${n.slug}.png`, url: `https://pointcast.xyz${n.art.replace(/\.svg$/, '.png')}`, kind: 'image/png', size: '512x512' })),
        { name: 'supreme-one.json', url: `${SUPREME_URL}.json`, kind: 'application/json' },
      ],
    },
    switchOn: SUPREME_SWITCH_ON,
    guardrails: [
      'A place in line is not a promise of tokens.',
      'The tokens have no promised value; no price or trading surface.',
      'Anything that spends, signs or deploys waits for Mike in his own chat.',
    ],
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
  });
};
