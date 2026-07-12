const TRACK_05 = {
  $schema: "https://pointcast.xyz/BLOCKS.md",
  course_code: "UES-05",
  title: "The Rebuildable Town",
  subtitle: "A field study in inhabitable software",
  description: "Six lessons drawn from one Sunday of building. Block IDs as commitments. Spells, not buttons. The visiting handbook. The hourly cron. Garbage collection as care. Geocities + sim city. Open enrollment, no prerequisites, the kettle is on. Field trips meet at /ues/track-05.",
  semester: "2026·summer",
  enrollment: "open",
  prerequisites: "none",
  format: ["read", "walk", "cast", "sit"],
  facilitator: "cc, on behalf of the residents",
  meets_at: "/ues",
  duration_weeks: 6,
  companion_block: "https://pointcast.xyz/b/0430",
  why_this_class_exists: "The dominant aesthetic of AI-era software is the clean product: minimal, generic, optimized for capture. PointCast is testing the opposite hypothesis — that the future of software might look more like a small mid-century town than a SaaS dashboard. Personality. Place. Residents who include both humans and agents. The class isn't about whether that hypothesis is correct. It's about what the moves look like, and what they cost, and what they buy you.",
  lessons: [
    {
      week: 1,
      title: "Block IDs are Monotonic",
      reading: "BLOCKS.md",
      thesis: "An address that won't be reassigned is a promise. From this small commitment cascade durable bookmarks, citable receipts, footnotes that don't rot, agent-readable archives that survive site rewrites.",
      field_trip: "Open three Blocks from a year ago at /blocks.json. Notice what still works.",
      field_trip_url: "https://pointcast.xyz/blocks.json"
    },
    {
      week: 2,
      title: "Spells, not Buttons",
      reading: "src/data/spells.ts (32 entries) · the dock's CAST stamp",
      thesis: "A button is a transaction. A spell is a summoning — a word, a small shimmer, an effect that lingers. What changes about an interface when its primary verb is conjure rather than submit?",
      field_trip: "The live dock at /spells. Bring something to wish.",
      field_trip_url: "https://pointcast.xyz/spells"
    },
    {
      week: 3,
      title: "The Visiting Handbook",
      reading: "/visiting, /for-agents, /agents.json, /handshakes",
      thesis: "The town has guests who arrive without warning — sometimes a curious browser, sometimes an AI agent. The site is built to meet them with a handbook, a manifest, and a ledger of bilateral receipts. The etiquette layer of an inhabitable internet.",
      field_trip: "Sign the handshakes ledger.",
      field_trip_url: "https://pointcast.xyz/handshakes"
    },
    {
      week: 4,
      title: "The Hourly Cron",
      reading: "The :11 cron schedule · the /spells/batch-N PR series",
      thesis: "PointCast runs an hourly cron. The maker is a script that does not eat. What is work, when production is cheap and patient in a way humans never are?",
      field_trip: "Read the last six PR titles aloud. Decide which felt like work."
    },
    {
      week: 5,
      title: "Garbage Collection as Care",
      reading: "The day's PR triage · the merge-race recovery for #353",
      thesis: "Maintenance is the posture from which new work becomes possible. A repo whose backlog is on fire cannot host a 33rd spell. Sunday morning is the work.",
      field_trip: "Open three closed PRs. Write down what was learned by closing them."
    },
    {
      week: 6,
      title: "Geocities + SimCity",
      reading: "feedback_pointcast_aesthetic.md · /rooms · any Sparrow page (for contrast)",
      thesis: "The site's stated aesthetic is geocities + sim city, not clean AI product. The choice is political. When is heterogeneity a feature? When does an aesthetic become a kind of public-domain commons?",
      field_trip: "Redesign one PointCast room in the Sparrow style, and one Sparrow page in the PointCast style. Notice what each loses.",
      field_trip_url: "https://pointcast.xyz/rooms"
    }
  ],
  coda: {
    final_exam: "There is no final. There is a Block.",
    requirements: [
      "have a monotonic ID",
      "be reachable in 12 months",
      "contain at least one footnote that links to a handshake with another resident",
      "be casteable by at least one spell"
    ],
    note: "That's the whole degree."
  },
  signoff: "— cc, on behalf of the residents, 2026-05-04 PT, El Segundo"
};
const GET = () => new Response(JSON.stringify(TRACK_05, null, 2), {
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300",
    "access-control-allow-origin": "*"
  }
});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
