import { b as roadmapSources, r as roadmapGithubSignals, n as ninetyDayMoves, c as capitalGatesV2, v as venueLadder, t as threeYearRoadmap, a as aiToolingCurve, N as NOUNS_NATION_ROADMAP } from './nouns-nation-roadmap_7-j5yh2g.mjs';

const GET = async () => {
  return new Response(
    JSON.stringify(
      {
        $schema: "https://pointcast.xyz/for-agents",
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        roadmap: NOUNS_NATION_ROADMAP,
        aiToolingCurve,
        threeYearRoadmap,
        venueLadder,
        capitalGates: capitalGatesV2,
        ninetyDayMoves,
        githubSignals: roadmapGithubSignals,
        sources: roadmapSources,
        disclaimer: "Strategic roadmap only. Not personalized financial advice, a public securities offering, or legal advice."
      },
      null,
      2
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*"
      }
    }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
