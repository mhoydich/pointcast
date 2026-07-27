import type { APIRoute } from "astro";
import {
  NOUN_BATTLER_ANNUAL_CAMPAIGN,
  NOUN_BATTLER_PROMO_DISPATCHES,
  NOUN_BATTLER_PROMO_LINKS,
} from "../../lib/noun-battler-annual-promotion";

export const GET: APIRoute = () => {
  const payload = {
    schema: "https://pointcast.xyz/schemas/promotion-packet/v1",
    name: "The Battle Record promotion packet",
    description:
      "Copy-ready sports-desk dispatches and public campaign receipts for the Noun Battler Annual 2026.",
    campaign: NOUN_BATTLER_ANNUAL_CAMPAIGN,
    dispatches: NOUN_BATTLER_PROMO_DISPATCHES.map((dispatch) => ({
      ...dispatch,
      url: `https://pointcast.xyz${dispatch.href}`,
      image: `https://pointcast.xyz${dispatch.image}`,
    })),
    links: NOUN_BATTLER_PROMO_LINKS,
    editorialBoundary: {
      placement: "First-party PointCast house inventory selected by URL context.",
      telemetry: "Aggregate impressions and clicks; no visitor identifiers or profiles.",
      matchupLab: "Unsaved deterministic editorial projection, not an official league result.",
      wagering: "No odds, wagers, betting product, purchase, or wallet action.",
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
};
