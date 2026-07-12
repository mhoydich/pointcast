import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { g as getChartOfTheDay } from './chart-of-the-day_BJJik1Ha.mjs';

const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const chart = getChartOfTheDay(blocks);
  return new Response(JSON.stringify({
    $schema: "https://pointcast.xyz/for-agents",
    canonical: "https://pointcast.xyz/chart",
    ...chart
  }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
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
