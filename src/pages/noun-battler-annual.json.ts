import type { APIRoute } from "astro";
import {
  NOUN_BATTLER_ANNUAL_META,
  NOUN_BATTLER_FIELDS,
  NOUN_BATTLER_GANGS,
  NOUN_BATTLER_HISTORY,
  NOUN_BATTLER_ROLES,
  NOUN_BATTLER_ROUTES,
} from "../lib/noun-battler-annual";

export const GET: APIRoute = async () => {
  const meta = NOUN_BATTLER_ANNUAL_META;
  const payload = {
    schema: "https://pointcast.xyz/schemas/editorial-history/v1",
    id: meta.id,
    title: meta.title,
    issue: meta.issue,
    description: meta.description,
    canonical: meta.canonical,
    publishedAt: meta.publishedAt,
    editorialBoundary: {
      history:
        "The chronology is reconstructed from checked-in design notes, PRDs, route manifests, and repository history.",
      projection:
        "The interactive matchup lab is an annual-only deterministic editorial projection. It does not write to or represent official local league results.",
      persistence:
        "The playable Nouns Nation season and rooting state are browser-local. Desk Wall snapshots may travel through links without creating a global live database.",
      wagering: "No odds, wagers, or betting product.",
    },
    art: {
      type: "original generator-made editorial plates",
      project: "poster-image-engine/projects/noun-battler-annual-2026",
      plates: meta.plates.map((plate) => ({
        name: plate.name,
        url: `https://pointcast.xyz${plate.path}`,
        alt: plate.alt,
      })),
    },
    history: NOUN_BATTLER_HISTORY.map((entry) => ({
      ...entry,
      routes: entry.routes.map((route) =>
        route.startsWith("http") ? route : `https://pointcast.xyz${route}`,
      ),
    })),
    foundingDuel: {
      format: "deterministic best-of-three stance duel",
      stances: {
        STRIKE: "beats FOCUS",
        FOCUS: "beats GUARD",
        GUARD: "beats STRIKE",
      },
      inheritedStats: ["type", "ATK", "DEF", "SPD", "FOC", "HP"],
      record: "A replay is the seed pair plus stance inputs; the same inputs reproduce the result.",
      playable: "https://pointcast.xyz/battle",
      rules: "https://pointcast.xyz/battle.json",
    },
    nounsNationLeague: {
      format: "eight-gang, fourteen-day double round robin",
      teams: 8,
      standardMatch: "30 vs 30",
      matchesPerDay: 4,
      playoffs: "top four, then Nouns Bowl final",
      persistence: "browser localStorage only",
      roles: NOUN_BATTLER_ROLES,
      fields: NOUN_BATTLER_FIELDS,
      gangs: NOUN_BATTLER_GANGS.map((gang) => ({
        ...gang,
        nounSprite: `https://pointcast.xyz/games/nouns-nation-battler/assets/noun-${gang.noun}.svg`,
        ratingsBoundary:
          "Annual editorial scouting rating used only by the matchup lab, not an official live league stat.",
      })),
      playable: "https://pointcast.xyz/games/nouns-nation-battler/",
      desk: "https://pointcast.xyz/nouns-nation-battler/",
      manifest: "https://pointcast.xyz/nouns-nation-battler.json",
    },
    pacific48: {
      format: "five-round stronger-stat card battle",
      battlers: 48,
      receipts: ["browser-local stamp book", "portable Passport card"],
      boundary: "No wallet required; cards and stamps are local receipts, not minted tokens.",
      pointcast: "https://pointcast.xyz/noun-battler",
      standalone: "https://noun-battler.mhoydich.chatgpt.site",
    },
    publicRooms: NOUN_BATTLER_ROUTES.map((route) => ({
      ...route,
      url: `https://pointcast.xyz${route.path}`,
    })),
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
