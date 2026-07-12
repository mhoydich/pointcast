import { f as fetchFroggosData } from './froggos_B8_CNvh8.mjs';

const GET = async () => {
  const market = await fetchFroggosData();
  const payload = {
    $schema: "https://pointcast.xyz/froggos.json",
    name: "PointCast Froggos",
    description: "Hosted front door for the Froggos objkt collection. Sales route to objkt; PointCast provides HTML, schema.org markup, and this JSON mirror.",
    home: "https://pointcast.xyz/froggos",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    market,
    hostAndSell: [
      {
        step: "host",
        description: "PointCast hosts the canonical landing page, OG metadata, schema.org offers, and JSON mirror."
      },
      {
        step: "sell",
        description: "Listings and checkout stay on objkt, where wallet signing, royalties, and settlement already live."
      },
      {
        step: "upgrade",
        description: "PointCast can later reuse its Beacon/Taquito collect flow to fulfill objkt asks directly on-site after an explicit product decision."
      }
    ],
    related: [
      { label: "objkt collection", url: "https://objkt.com/collections/froggos" },
      { label: "Froggos site", url: "https://www.froggos.xyz" },
      { label: "TzKT contract", url: `https://tzkt.io/${market.collection.contract}/tokens` },
      { label: "PointCast collection", url: "https://pointcast.xyz/collection" }
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
