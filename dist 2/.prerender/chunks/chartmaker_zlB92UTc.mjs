import { g as getChartmakerPacket } from './chartmaker_CXC3xuzN.mjs';

const GET = async () => {
  return new Response(JSON.stringify({
    $schema: "https://pointcast.xyz/for-agents",
    ...getChartmakerPacket()
  }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=120",
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
