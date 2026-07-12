import { H as HORIZON_BANDS, a as MACHINE_LOOPS, b as MACHINE_PRINCIPLES, S as SEED_GOALS, c as MACHINE_NOTES, G as GOAL_TYPE_LABELS, M as MACHINE_META } from './goalMachine_Day03hBb.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/goal.json",
    name: MACHINE_META.title,
    subtitle: MACHINE_META.subtitle,
    tagline: MACHINE_META.tagline,
    thesis: MACHINE_META.thesis,
    authors: MACHINE_META.authors,
    principles: MACHINE_PRINCIPLES,
    goalTypes: GOAL_TYPE_LABELS,
    seedGoals: SEED_GOALS,
    machineLoops: MACHINE_LOOPS,
    horizonBands: HORIZON_BANDS,
    notes: MACHINE_NOTES,
    counts: {
      seedGoals: SEED_GOALS.length,
      principles: MACHINE_PRINCIPLES.length,
      loops: MACHINE_LOOPS.length,
      bands: HORIZON_BANDS.length
    },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    human: "https://pointcast.xyz/goal",
    parent: "https://pointcast.xyz/university-of-el-segundo",
    related: {
      ues: "https://pointcast.xyz/university-of-el-segundo",
      commons: "https://pointcast.xyz/commons",
      marineLayer: "https://pointcast.xyz/marine-layer",
      civicLayer: "https://pointcast.xyz/civic-layer",
      commonForms: "https://pointcast.xyz/common-forms"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
