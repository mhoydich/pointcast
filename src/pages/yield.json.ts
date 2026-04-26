/**
 * /yield.json — machine-readable summary of the five candidate models.
 */
import type { APIRoute } from 'astro';

const MODELS = [
  {
    id: 'attention', code: 'A',
    title: 'Attention Yield',
    mechanic: 'Server aggregates session events per wallet-day (capped). Weekly job distributes a fixed pool pro-rata to eligible wallets.',
    moderationImpact: 'zero',
    funding: 'treasury allocation',
    payout: 'DRUM or ꜩ',
    pros: ['visible "constant drip"', 'easy to explain', 'low onboarding friction'],
    cons: ['farmable without caps', 'requires presence tracking'],
    compositionalWith: ['royalty', 'stake'],
  },
  {
    id: 'reflow', code: 'B',
    title: 'Prize Cast Reflow',
    mechanic: 'N% of each Prize Cast weekly draw skips the winner and drips to Visit Nouns holders pro-rata.',
    moderationImpact: 'zero',
    funding: 'Prize Cast weekly yield',
    payout: 'ꜩ',
    pros: ['passive holder yield', 'no new mechanics needed'],
    cons: ['dilutes jackpot', 'gated by Prize Cast TVL growth'],
    compositionalWith: ['attention', 'baker'],
  },
  {
    id: 'royalty', code: 'C',
    title: 'Royalty Router',
    mechanic: '50% of Visit Nouns FA2 secondary-market royalties route back to holders instead of treasury.',
    moderationImpact: 'zero',
    funding: 'secondary-market volume',
    payout: 'ꜩ',
    pros: ['self-reinforcing', 'aligns holders with collection promotion'],
    cons: ['lumpy (no sales = no payout)', 'reduces treasury accumulation'],
    compositionalWith: ['attention', 'stake'],
  },
  {
    id: 'stake', code: 'D',
    title: 'DRUM Stake Yield',
    mechanic: 'Fixed weekly DRUM inflation distributed pro-rata to holders at snapshot. No lock-ups.',
    moderationImpact: 'zero',
    funding: 'DRUM inflation (new mint)',
    payout: 'DRUM',
    pros: ['simple', 'encourages long-tail holding'],
    cons: ['pure inflation without utility demand', 'needs emission schedule'],
    compositionalWith: ['attention', 'royalty'],
  },
  {
    id: 'baker', code: 'E',
    title: 'Baker Kickback',
    mechanic: 'Prize Cast stakes with a kickback-friendly baker; kickback routes to a holder-distribution pool.',
    moderationImpact: 'zero',
    funding: 'baker kickback (off-protocol)',
    payout: 'ꜩ',
    pros: ['free extra yield', 'compositional with Reflow'],
    cons: ['baker dependency', 'kickback programs can change'],
    compositionalWith: ['reflow', 'attention'],
  },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    version: 'v1 · experiments sandbox',
    intent: 'Mike 2026-04-18: "on the token flexible systems, a bunch of experiments, see what works, learn, grow, scale."',
    models: MODELS,
    recommendedComposition: {
      headline: 'attention',
      funding: 'royalty',
      note: 'Wallets that visit earn (Attention). The earnings are funded by secondary-market activity (Royalty Router). Self-reinforcing loop.',
    },
    status: 'none committed to treasury yet. PC-0001 at /dao is the first binding vote.',
    links: {
      human: 'https://pointcast.xyz/yield',
      dao: 'https://pointcast.xyz/dao',
      strategy: 'https://github.com/mhoydich/pointcast/blob/main/docs/plans/2026-04-18-v3-strategy.md',
    },
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
