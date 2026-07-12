import { x as NOUNS_BATTLER_WIKI } from './nouns-battler-agent-bench_CoupaMI8.mjs';

const GET = async () => {
  return new Response(
    JSON.stringify(
      {
        $schema: "https://pointcast.xyz/for-agents",
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        name: "Nouns Nation Battler Wiki",
        ...NOUNS_BATTLER_WIKI
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*"
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
