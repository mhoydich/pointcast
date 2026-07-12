import { g as getBrewForDate, a as getBrewForDayOffset, B as BREWS } from './special-brews_Gd4VscHQ.mjs';

const GET = () => {
  const today = getBrewForDate();
  const yesterday = getBrewForDayOffset(-1);
  const tomorrow = getBrewForDayOffset(1);
  const payload = {
    $schema: "https://pointcast.xyz/BLOCKS.md",
    name: "PointCast Special Brew",
    description: "One brew per UTC day, the same one for everyone. Sibling celebration room to /kettle. Pour the cup, hear the chime, count the cups.",
    page: "https://pointcast.xyz/special-brew",
    api: {
      sip_log: "https://pointcast.xyz/api/special-brew",
      mirror: "https://pointcast.xyz/special-brew.json"
    },
    rotation: {
      schedule: "UTC daily at 00:00",
      algorithm: "(year * 7 + day_of_year * 13) mod count",
      total_brews: BREWS.length
    },
    today: {
      ...today,
      utc_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    },
    yesterday,
    tomorrow,
    catalog: BREWS,
    served_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
