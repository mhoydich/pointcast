import type { APIRoute } from 'astro';
import { SATURDAY_SIGNAL_CONTRACT as contract, SATURDAY_SIGNAL_STAMPS as feature, SATURDAY_SIGNAL_TEAMS as teams } from '../../../lib/pointcast-signal-stamps';
export const GET: APIRoute = () => new Response(JSON.stringify({ ...feature, count: teams.length,
  formatsPerField: ['stamp/png/1024x1024','profile/png/512x512','wallpaper/webp/1920x1080'],
  mint: { network: contract.network, live: contract.live, contract: contract.kt1 || null, entrypoint: contract.entrypoint,
    priceMutez: contract.priceMutez, editionCapPerToken: contract.editionCapPerToken, onePerWalletPerToken: contract.onePerWalletPerToken,
    custody: 'Collector signs directly in their own Tezos wallet. PointCast never receives seed phrases or private keys.' }, teams,
}, null, 2), { headers: { 'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300' } });
