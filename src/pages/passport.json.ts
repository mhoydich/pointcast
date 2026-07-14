import type { APIRoute } from 'astro';
import { PASSPORT_STAMPS } from '../lib/play-layer';
import { buildTezosPassportManifest } from '../lib/tezos-passport';

export const GET: APIRoute = async () => {
  const payload = {
    ...buildTezosPassportManifest(),
    generatedAt: new Date().toISOString(),
    localRituals: PASSPORT_STAMPS,
    agentProtocol: {
      publicAddress:
        'When the user supplies a Tezos address, open /passport?address={address}. Do not claim that address belongs to the user unless they explicitly say so or provide a signed seal.',
      localState:
        'Local ritual stamps are intentionally unavailable to remote agents. Ask the user to export a signed proof rather than inferring browser state.',
      signedSeal:
        'A seal is a wallet signature over a PointCast journey snapshot. It is not an on-chain transaction, mint, credential authority, or identity guarantee.',
      verification:
        'Verify the proof payload and signature with the included public key, then derive the Tezos address from that key before treating the wallet binding as valid.',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
};
