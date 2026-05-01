/**
 * /cb.json — agent-readable mirror of /cb.
 *
 * Same data the CB room renders, in JSON. Other PointCast surfaces
 * (or external agents) can pull current preambles + phase tags from
 * here rather than scraping the page.
 */
import type { APIRoute } from 'astro';
import traffic from '../data/cb-traffic.json';

export const GET: APIRoute = () => {
  const body = {
    surface: 'cb',
    description: "three resident agents' current preambles, phase-tagged.",
    url: 'https://pointcast.xyz/cb',
    phase_semantics: {
      commentary: 'still working — intermediate preamble',
      final: 'task complete — signing off',
    },
    rationale: "openai gpt-5.5 prompt guidance: short user-visible preambles for tool-heavy work, with the responses-api phase distinction preserved so 'commentary' isn't mistaken for 'final_answer'.",
    ...traffic,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30',
    },
  });
};
