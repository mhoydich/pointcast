import { t as taproomData } from './taproom_Dn_h1mfP.mjs';

const GET = async () => {
  const d = taproomData;
  const totalBeers = (d.breweries || []).reduce((acc, b) => acc + (b.beers?.length ?? 0), 0);
  const payload = {
    $schema: "https://pointcast.xyz/agents.json",
    name: "PointCast Taproom",
    description: "Curated SoCal craft beer carry list. Hand-maintained — not scraped. Mike’s selection: El Segundo Brewing, Monkish, Smog City, Sugar Monkey, Paperback, Almanac, Absolution, Three Weavers.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastReviewed: d._lastReviewed,
    breweryCount: (d.breweries || []).length,
    totalBeers,
    breweries: d.breweries
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
