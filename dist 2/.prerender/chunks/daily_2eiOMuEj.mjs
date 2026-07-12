function todayPT(now = /* @__PURE__ */ new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
  } catch {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}
function dayOfYearPT(now = /* @__PURE__ */ new Date()) {
  const [y, m, d] = todayPT(now).split("-").map((n) => parseInt(n, 10));
  const start = Date.UTC(y, 0, 1);
  const mid = Date.UTC(y, m - 1, d);
  return Math.floor((mid - start) / 864e5) + 1;
}
function daySeed(now = /* @__PURE__ */ new Date()) {
  const y = parseInt(todayPT(now).split("-")[0], 10);
  return y * 1e3 + dayOfYearPT(now);
}
function pickDailyBlock(blocks, now = /* @__PURE__ */ new Date()) {
  if (blocks.length === 0) return null;
  const sorted = [...blocks].sort((a, b) => a.data.id.localeCompare(b.data.id));
  return sorted[daySeed(now) % sorted.length];
}

export { daySeed as d, pickDailyBlock as p, todayPT as t };
