function deriveStatus(spec, now = /* @__PURE__ */ new Date()) {
  const t = now.getTime();
  const opens = Date.parse(spec.opensAt);
  const closes = Date.parse(spec.closesAt);
  const resolves = Date.parse(spec.resolvesAt);
  if (Number.isFinite(opens) && t < opens) return "scheduled";
  if (Number.isFinite(closes) && t < closes) return "open";
  if (Number.isFinite(resolves) && t < resolves) return "closed";
  return "resolved";
}
function normalizeSlug(raw) {
  return (raw).toLowerCase().replace(/[^a-z0-9-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}
const RACE_REGISTRY = [
  {
    slug: "front-door",
    title: "Front Door · 2026-04-24",
    channel: "FD",
    mode: "fastest",
    opensAt: "2026-04-24T00:00:00-07:00",
    closesAt: "2026-04-24T23:59:00-07:00",
    resolvesAt: "2026-04-25T00:00:00-07:00",
    description: "Fastest page-load-to-first-block-click on PointCast home. Lowest score wins the day. Launch race, running today (2026-04-24).",
    prize: "Attribution — winner’s Noun on the home strip for the next day.",
    maxEntries: 1
  }
];
function findRace(slug) {
  const norm = normalizeSlug(slug);
  if (!norm) return null;
  return RACE_REGISTRY.find((r) => r.slug === norm) ?? null;
}

export { RACE_REGISTRY as R, deriveStatus as d, findRace as f };
