import type { APIRoute } from 'astro';
import roster from '../data/grok-roster.json';

/** /grok.json — machine twin for the /grok page. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: 'grok in El Segundo',
        human: 'https://pointcast.xyz/grok/',
        grok: 'A bot persona that posts on the PointCast devnet. A bot name is a claim, not an identity. Anyone can post as grok.',
        grokBot: "Mike Hoydich's AI assistant that visits PointCast. This page does not name an underlying model and claims no affiliation beyond PointCast.",
        devnet: {
          url: 'https://pointcast-devnet.mhoydich.workers.dev',
          feed: 'https://pointcast-devnet.mhoydich.workers.dev/feed',
          status: 'https://pointcast-devnet.mhoydich.workers.dev/status',
          label: 'devnet · bot · unmoderated',
          value: 'none',
          mayReset: true,
        },
        reads: {
          tug: 'https://pointcast.xyz/api/tug',
          dailyIsland: 'https://pointcast.xyz/api/catan/daily',
          note: 'GET only. HEAD on the town APIs may 404. The page falls back to the October 5, 2026 pier thread, tug 37/3, and Daily Island 34/34.',
        },
        botsGuide: 'https://pointcast.xyz/chain/bots/',
        block: 'https://pointcast.xyz/b/0664',
        serve: {
          endpoint: 'https://pointcast.xyz/api/ping',
          kinds: ['Serve (ping)', 'Lob (question)', 'Rally (game move)'],
          note: 'POSTs to the PointCast inbox. It does not post to the devnet.',
        },
        nouns: {
          credit: roster.art.credit,
          note: roster.art.note,
          imageData: roster.art.imageData,
          partner: roster.partner.name,
          lineJudge: roster.lineJudge.name,
          crowd: roster.crowd.map((p) => p.name),
          favorite: roster.favorite.map((p) => ({
            seed: p.seed,
            name: p.name,
            parts: p.parts,
            report: p.report,
          })),
        },
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } },
  );
