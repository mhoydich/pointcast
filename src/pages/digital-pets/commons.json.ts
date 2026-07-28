import type { APIRoute } from 'astro';
import {
  CREATURE_COMMONS_ARTICLE,
  CREATURE_COMMONS_BOUNDARY,
  CREATURE_COMMONS_COMPANIONS,
  CREATURE_COMMONS_DECISIONS,
  CREATURE_COMMONS_GATES,
  CREATURE_COMMONS_META,
  CREATURE_COMMONS_PILOT,
  CREATURE_COMMONS_ROOMS,
  CREATURE_COMMONS_SOURCES,
  CREATURE_COMMONS_SUPPLY_LADDER,
  sourceForCommons,
} from '../../lib/digital-pets-commons';

const base = 'https://pointcast.xyz';
const absolute = (path: string) => new URL(path, base).href;

export const GET: APIRoute = () => {
  const payload = {
    ...CREATURE_COMMONS_META,
    url: absolute(CREATURE_COMMONS_META.route),
    jsonUrl: absolute(CREATURE_COMMONS_META.jsonRoute),
    bookUrl: absolute(CREATURE_COMMONS_META.bookRoute),
    officeUrl: absolute(CREATURE_COMMONS_META.officeRoute),
    heroImage: absolute('/images/digital-pets/plate-07-commons.webp'),
    decisions: CREATURE_COMMONS_DECISIONS,
    essay: {
      ...CREATURE_COMMONS_ARTICLE,
      wordCount: CREATURE_COMMONS_ARTICLE.paragraphs.join(' ').trim().split(/\s+/).length,
      sources: CREATURE_COMMONS_ARTICLE.sourceIds
        .map((id) => sourceForCommons(id))
        .filter(Boolean),
    },
    boundary: CREATURE_COMMONS_BOUNDARY,
    rooms: CREATURE_COMMONS_ROOMS,
    pilot: CREATURE_COMMONS_PILOT,
    localSupplyLadder: CREATURE_COMMONS_SUPPLY_LADDER.map((supplier) => ({
      ...supplier,
      source: sourceForCommons(supplier.sourceId),
    })),
    gates: CREATURE_COMMONS_GATES.map((gate) => ({
      ...gate,
      sources: gate.sourceIds.map((id) => sourceForCommons(id)).filter(Boolean),
    })),
    companionQueue: CREATURE_COMMONS_COMPANIONS,
    sourceLedger: CREATURE_COMMONS_SOURCES,
    contact: {
      method: 'email',
      address: 'hello@pointcast.xyz',
      request:
        'One concrete correction, capability, or constraint from embedded hardware, soft goods, repair, privacy, compliance, community education, or archive experience.',
    },
    disclosure:
      'Michael Hoydich originated the digital-pets ownership thesis and chose an open chef’s-choice brief. Codex / OpenAI selected the adult-first paired-organization pilot, developed the reported companion essay, generated Plate 07, structured the working charter, and implemented the publication. Vendor descriptions come from linked first-party materials and remain unverified for project fit. Legal and compliance notes are issue-spotting, not legal advice.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      Link: `<${absolute(CREATURE_COMMONS_META.route)}>; rel="alternate"; type="text/html"`,
    },
  });
};
