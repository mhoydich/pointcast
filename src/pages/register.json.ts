import type { APIRoute } from 'astro';
import board from '../data/scoreboard.json';
import chainBoard from '../data/scoreboard-chain.json';

const rowOut = (r: (typeof chainBoard.rows)[number]) => ({
  name: r.name, path: r.path, url: `https://pointcast.xyz${r.path}`, score: r.total,
  use: r.use, craft: r.craft, reach: r.reach, loc: r.loc, files: r.files, tests: r.tests, inbound: r.inbound, blocks: r.blockRefs, onHome: r.onHome,
});

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/register.json#schema',
        type: 'pointcast-register-v1',
        generatedAt: board.generatedAt,
        human: 'https://pointcast.xyz/register',
        method: {
          use: 'public room counter or path-only pageviews, log-scaled (~30k ≈ 1)',
          craft: 'source LOC (log, 20k ≈ 1) + tests naming the room',
          reach: 'inbound internal links + wire blocks + on the front door',
          score: 'with a counter 45/27.5/27.5; front door uses completion + seven-day return at 45/27.5/27.5; without outcomes 50/50 craft/reach',
          notMeasured: ['commit cadence (history flattened 2026-07-30)', 'route-level human traffic before 2026-08-17', 'taste'],
        },
        rows: board.rows.map((r) => ({
          rank: undefined,
          name: r.name, path: r.path, url: `https://pointcast.xyz${r.path}`, score: r.total,
          use: r.use, completion: r.completion ?? null, sevenDayReturn: r.sevenDayReturn ?? null, craft: r.craft, reach: r.reach, loc: r.loc, files: r.files, tests: r.tests, inbound: r.inbound, blocks: r.blockRefs, onHome: r.onHome,
        })).map((r, i) => ({ ...r, rank: i + 1 })),
        // The /chain pages, scored the same way in their own snapshot; a path the main board has is left to it.
        chain: {
          generatedAt: chainBoard.generatedAt,
          human: 'https://pointcast.xyz/register#chain',
          pageviewsPulled: chainBoard.useSource.pageviews,
          note: 'visits to pages about the devnet, not use of the chain; on the chain, house activity is the chain checking itself, not use (GET /stats/classes on the devnet splits house, keyless and outside)',
          rows: chainBoard.rows.filter((r) => !board.rows.some((m) => m.path === r.path)).map((r, i) => ({ rank: i + 1, ...rowOut(r) })),
        },
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
  );
