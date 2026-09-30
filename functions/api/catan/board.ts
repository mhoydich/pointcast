/**
 * /api/catan/board — the Board Forge as JSON. GET ?seed=any-words.
 * Deterministic and free: the same seed always forges the same island.
 * No seed → a fresh random one (returned, so the board can be shared).
 */
import { forgeBoard, RESOURCES } from '../../../src/lib/catan.ts';
import { catanOptions, CATAN_HEADERS } from '../../_lib/catan-store.ts';

export const onRequestOptions = catanOptions;

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const seed = url.searchParams.get('seed') || `forge-${Math.random().toString(36).slice(2, 8)}`;
  const board = forgeBoard(seed);
  const body = {
    ...board,
    legend: Object.fromEntries(Object.entries(RESOURCES).map(([k, v]) => [k, { label: v.label, terrain: v.terrain }])),
    coords: 'axial (q, r), pointy-top; hex i is read row by row from the top; harbour dir indexes [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]]',
  };
  const headers = { ...CATAN_HEADERS, 'Cache-Control': url.searchParams.get('seed') ? 'public, max-age=86400' : 'no-store' };
  return new Response(JSON.stringify(body, null, 2), { headers });
};
