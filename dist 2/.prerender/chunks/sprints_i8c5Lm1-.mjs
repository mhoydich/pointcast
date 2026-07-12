import { r as readAllRecaps, s as summary } from './sprint-recap_OvTdaPLs.mjs';

const GET = async () => {
  const recaps = readAllRecaps();
  const stats = summary(recaps);
  const payload = {
    $schema: "https://pointcast.xyz/sprints.json",
    name: "PointCast autonomous sprint log",
    description: "Every sprint cc has shipped via cron tick or chat tick. Source: docs/sprints/{date}-{slug}.md.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    summary: stats,
    sprints: recaps.map((r) => ({
      sprintId: r.sprintId,
      fileSlug: r.fileSlug,
      firedAt: r.firedAt,
      trigger: r.trigger ?? null,
      durationMin: r.durationMin ?? null,
      shippedAs: r.shippedAs ?? null,
      status: r.status ?? null,
      title: r.title,
      sections: r.sections,
      anchor: `https://pointcast.xyz/sprints#${r.sprintId}`
    }))
  };
  return new Response(JSON.stringify(payload, null, 2), {
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
