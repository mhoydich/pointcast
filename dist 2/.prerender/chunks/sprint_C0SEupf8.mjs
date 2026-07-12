import { S as SPRINT_BACKLOG, c as counts } from './sprints_B_I6ZYlg.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/sprint.json",
    name: "PointCast sprint backlog",
    description: "Candidate work items cc can pick up. /sprint is the human UI; /api/queue is the POST endpoint.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    counts: counts(),
    cron: {
      schedule: "0 * * * * (minute :11 hourly, in cc local timezone)",
      sentinel: "<<sprint-tick>>",
      runtime: "CronCreate (session, durable=true). Auto-expires after 7 days.",
      lastTickHint: "When cc fires, it appends a recap file to docs/sprints/{date}-{slug}.md."
    },
    backlog: SPRINT_BACKLOG.map((s) => ({
      ...s,
      anchor: `https://pointcast.xyz/sprint#${s.id}`
    })),
    endpoints: {
      pickPost: "https://pointcast.xyz/api/queue",
      pickList: "https://pointcast.xyz/api/queue?action=list",
      pingPost: "https://pointcast.xyz/api/ping"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
