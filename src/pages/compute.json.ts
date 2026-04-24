/**
 * /compute.json — machine-readable compute ledger + federation spec.
 *
 * Mike 2026-04-20: "lets federate compute."
 *
 * Every entry in COMPUTE_LEDGER gets emitted here, plus a federation
 * block that tells other nodes how to publish a compatible feed. Goal:
 * a small interoperable compute-transparency network, not a metric
 * dashboard we own.
 *
 * Author: cc. Source: Mike 2026-04-20 15:10 PT chat.
 */
import type { APIRoute } from 'astro';
import {
  COMPUTE_LEDGER,
  SIGNATURE_LABEL,
  SIGNATURE_BAND,
  KIND_LABEL,
  collabCounts,
  recentEntries,
} from '../lib/compute-ledger';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/compute.json',
    name: 'PointCast compute ledger',
    description:
      'Public record of compute expended to build PointCast — sprints, blocks, briefs, ops. Compute-as-currency, legible, federatable. Signatures are order-of-magnitude bands (token counts are private and fuzzy).',
    generatedAt: new Date().toISOString(),
    homepage: 'https://pointcast.xyz',

    summary: {
      total: COMPUTE_LEDGER.length,
      last24h: recentEntries(24).length,
      last7d: recentEntries(24 * 7).length,
      byCollaborator: collabCounts(),
    },

    scales: {
      signature: Object.entries(SIGNATURE_LABEL).map(([k, label]) => ({
        id: k,
        label,
        band: SIGNATURE_BAND[k as keyof typeof SIGNATURE_BAND],
      })),
      kind: Object.entries(KIND_LABEL).map(([k, label]) => ({ id: k, label })),
    },

    entries: COMPUTE_LEDGER.map((e) => ({
      at: e.at,
      collab: e.collab,
      kind: e.kind,
      kindLabel: KIND_LABEL[e.kind],
      title: e.title,
      artifact: e.artifact ?? null,
      signature: e.signature,
      signatureLabel: SIGNATURE_LABEL[e.signature],
      signatureBand: SIGNATURE_BAND[e.signature],
      notes: e.notes ?? null,
      federation: e.federation ?? null,
    })),

    federationSpec: {
      rationale:
        'Elad Gil 2026-04-12: compute is becoming currency; teams may eventually be measured in token budgets vs. dollars. PointCast publishes its own ledger openly and invites other small networks to publish a compatible feed. No central aggregator required — every node keeps its own source of truth.',
      steps: [
        {
          n: 1,
          name: 'Host a /compute.json on your domain',
          detail:
            'Minimum schema: { entries: [{ at, collab, kind, title, signature }] }. Optional fields: artifact, notes, federation. Full schema + field docs: github.com/MikeHoydich/pointcast/blob/main/src/lib/compute-ledger.ts',
        },
        {
          n: 2,
          name: 'Register your feed',
          detail:
            'Email hello@pointcast.xyz with your feed URL, or PR src/lib/compute-federation.ts in the pointcast repo. We aggregate your entries into the /compute view with attribution preserved.',
        },
        {
          n: 3,
          name: 'Keep it cheap',
          detail:
            'Hand-curated is fine. Auto-derived from a CI hook is fine. Don\'t publish raw token counts unless you want to; the signature bands are enough.',
        },
      ],
      contact: 'hello@pointcast.xyz',
      referencePost: 'https://blog.eladgil.com/p/random-thoughts-while-gazing-at-the',
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
