import { N as NEXT_SPRINT } from './next-sprint_DYY-RK3_.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/for-agents",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ...NEXT_SPRINT,
    caveats: [
      "Planning and sprint coordination only.",
      "Generated images must be copied into public project assets before any page references them.",
      "Validator status is only trustworthy when reproduced from the live URL."
    ]
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
