const NEARBY = [
  { name: "El Segundo", distance: 0, bearing: "·", status: "seed", population: 17e3 },
  { name: "Manhattan Beach", distance: 3, bearing: "S", status: "target", population: 35e3 },
  { name: "Playa del Rey", distance: 3, bearing: "N", status: "target", population: 12e3 },
  { name: "Westchester", distance: 4, bearing: "N", status: "target", population: 45e3 },
  { name: "Hawthorne", distance: 4, bearing: "E", status: "adjacent", population: 88e3 },
  { name: "Hermosa Beach", distance: 5, bearing: "S", status: "target", population: 19e3 },
  { name: "Mar Vista", distance: 6, bearing: "N", status: "target", population: 38e3 },
  { name: "Venice", distance: 6, bearing: "N", status: "target", population: 4e4 },
  { name: "Redondo Beach", distance: 7, bearing: "S", status: "target", population: 71e3 },
  { name: "Torrance", distance: 7, bearing: "SE", status: "target", population: 145e3 },
  { name: "Culver City", distance: 7, bearing: "NE", status: "adjacent", population: 4e4 },
  { name: "Inglewood", distance: 7, bearing: "NE", status: "target", population: 108e3 },
  { name: "Gardena", distance: 8, bearing: "SE", status: "seed", population: 61e3 },
  { name: "Santa Monica", distance: 10, bearing: "N", status: "adjacent", population: 91e3 },
  { name: "Palos Verdes", distance: 10, bearing: "S", status: "adjacent", population: 41e3 },
  { name: "Compton", distance: 11, bearing: "E", status: "target", population: 95e3 },
  { name: "Lomita", distance: 11, bearing: "SE", status: "seed", population: 2e4 },
  { name: "Downtown LA", distance: 17, bearing: "NE", status: "adjacent", population: 85e3 },
  { name: "Long Beach", distance: 20, bearing: "SE", status: "adjacent", population: 466e3 }
];
const GET = async () => {
  const totalPop = NEARBY.reduce((a, b) => a + b.population, 0);
  const payload = {
    $schema: "https://pointcast.xyz/for-agents",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    anchor: {
      name: "El Segundo, CA",
      lat: 33.919,
      lng: -118.416
    },
    radiusMiles: 25,
    radiusMeters: 40233,
    coveragePopulation: totalPop,
    neighborhoods: NEARBY,
    programs: [
      { id: "mesh", reference: "/b/0240", status: "proposed" },
      { id: "third-spaces", reference: "/b/0242", status: "proposed" },
      { id: "dao-re", reference: "/b/0241", status: "vote-open · /dao/PC-0001" },
      { id: "areas", reference: "/areas", status: "seeded · paddle-exchange · meetups · UES · honey-league" },
      { id: "cross-prog", reference: null, status: "emerging" }
    ],
    links: {
      human: "https://pointcast.xyz/beacon",
      areas: "https://pointcast.xyz/areas",
      areasJson: "https://pointcast.xyz/areas.json",
      dao: "https://pointcast.xyz/dao",
      narrative: "https://pointcast.xyz/b/0244"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=600",
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
