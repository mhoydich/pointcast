import { t as todayPT, d as daySeed } from './daily_2eiOMuEj.mjs';

function toPtDate(date) {
  return todayPT(date);
}
function dayLabel(date) {
  const d = /* @__PURE__ */ new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC"
  }).format(d);
}
function dateDaysAgo(days, now = /* @__PURE__ */ new Date()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  return toPtDate(d);
}
function countByDate(blocks) {
  const out = /* @__PURE__ */ new Map();
  for (const block of blocks) {
    const date = toPtDate(block.data.timestamp);
    const existing = out.get(date) ?? { count: 0, latestId: null };
    existing.count += 1;
    if (!existing.latestId || block.data.id > existing.latestId) {
      existing.latestId = block.data.id;
    }
    out.set(date, existing);
  }
  return out;
}
function getChartOfTheDay(blocks, now = /* @__PURE__ */ new Date()) {
  const windowDays = 14;
  const today = todayPT(now);
  const byDate = countByDate(blocks);
  const points = Array.from({ length: windowDays }, (_, index) => {
    const date = dateDaysAgo(windowDays - 1 - index, now);
    const day = byDate.get(date);
    return {
      date,
      label: date === today ? "Today" : dayLabel(date),
      value: day?.count ?? 0,
      latestId: day?.latestId ?? null
    };
  });
  const todayPoint = points[points.length - 1];
  const previousPoint = points[points.length - 2] ?? todayPoint;
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const delta = todayPoint.value - previousPoint.value;
  const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const trendLabel = delta === 0 ? "flat versus yesterday" : `${delta > 0 ? "+" : ""}${delta} versus yesterday`;
  const variants = [
    {
      slug: "shipping-pulse",
      title: "PointCast Shipping Pulse",
      kicker: "CHART OF THE DAY · BLOCK VELOCITY",
      dek: "A two-week view of how many immutable PointCast blocks landed each PT day.",
      metric: "blocks published today",
      unit: "blocks"
    },
    {
      slug: "receipt-rhythm",
      title: "Receipt Rhythm",
      kicker: "CHART OF THE DAY · DAILY RECEIPTS",
      dek: "The daily receipt heartbeat: quiet days, ship days, and the shape of the current push.",
      metric: "receipts today",
      unit: "receipts"
    },
    {
      slug: "front-door-tempo",
      title: "Front Door Tempo",
      kicker: "CHART OF THE DAY · SITE MOTION",
      dek: "A compact signal for whether PointCast is moving today, built from the block ledger.",
      metric: "new public blocks",
      unit: "blocks"
    }
  ];
  const variant = variants[daySeed(now) % variants.length];
  const insight = todayPoint.value === 0 ? "No new block has landed yet today. The chart will lift as soon as the next receipt ships." : trend === "up" ? `Today is ahead of yesterday by ${delta} ${Math.abs(delta) === 1 ? "block" : "blocks"}.` : trend === "down" ? `Today is quieter than yesterday by ${Math.abs(delta)} ${Math.abs(delta) === 1 ? "block" : "blocks"}.` : "Today is matching yesterday so far.";
  return {
    ...variant,
    date: today,
    generatedAt: now.toISOString(),
    value: todayPoint.value,
    maxValue,
    trend,
    trendLabel,
    insight,
    points,
    source: {
      blocks: blocks.length,
      windowDays,
      timezone: "America/Los_Angeles"
    }
  };
}

export { getChartOfTheDay as g };
