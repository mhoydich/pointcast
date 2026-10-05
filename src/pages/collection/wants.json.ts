/**
 * /collection/wants.json — the want list, machine-readable.
 * Same picks as /collection/wants, with each one's collected status.
 */
import type { APIRoute } from 'astro';
import { COLLECTOR_WALLET, WANT_LIST_CURATED_AT, WANT_LIST_CURATOR, wantListWithStatus } from '../../lib/want-list';

export const GET: APIRoute = async () => {
  const { picks, checked } = await wantListWithStatus();
  const body = {
    $schema: 'https://pointcast.xyz/for-agents',
    name: 'PointCast want list',
    human: 'https://pointcast.xyz/collection/wants',
    collector: COLLECTOR_WALLET,
    curatedAt: WANT_LIST_CURATED_AT,
    curator: WANT_LIST_CURATOR,
    walletChecked: checked,
    note: 'Prices are the floor or listing observed on priceObservedAt, not live quotes. Collecting needs a wallet signature; nothing here buys for you.',
    summary: { picks: picks.length, collected: picks.filter((p) => p.collected).length },
    picks,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
