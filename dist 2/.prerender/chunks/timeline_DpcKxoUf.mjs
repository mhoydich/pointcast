import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';
import { B as BLOCK_TYPE_LIST } from './block-types_l5R3rOkI.mjs';

function isoWeekKey(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = date.getTime() - firstThursday.getTime();
  const week = 1 + Math.round(diff / 6048e5);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => a.data.timestamp.getTime() - b.data.timestamp.getTime());
  const byWeek = {};
  const weekTotals = {};
  const channelTotals = {};
  const typeTotals = {};
  for (const b of blocks) {
    const wk = isoWeekKey(b.data.timestamp);
    byWeek[wk] = byWeek[wk] ?? {};
    byWeek[wk][b.data.channel] = (byWeek[wk][b.data.channel] ?? 0) + 1;
    weekTotals[wk] = (weekTotals[wk] ?? 0) + 1;
    channelTotals[b.data.channel] = (channelTotals[b.data.channel] ?? 0) + 1;
    typeTotals[b.data.type] = (typeTotals[b.data.type] ?? 0) + 1;
  }
  const firstDate = blocks[0]?.data.timestamp ?? /* @__PURE__ */ new Date();
  const now = /* @__PURE__ */ new Date();
  const weeks = [];
  let cursor = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate()));
  while (cursor <= now) {
    const k = isoWeekKey(cursor);
    if (!weeks.includes(k)) weeks.push(k);
    cursor = new Date(cursor.getTime() + 7 * 864e5);
  }
  const currentWeek = isoWeekKey(now);
  if (!weeks.includes(currentWeek)) weeks.push(currentWeek);
  const peakWeek = Object.entries(weekTotals).reduce(
    (best, [wk, ct]) => ct > best.count ? { week: wk, count: ct } : best,
    { week: "", count: 0 }
  );
  const payload = {
    $schema: "https://pointcast.xyz/for-agents",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    total: blocks.length,
    firstBlockAt: blocks[0]?.data.timestamp.toISOString() ?? null,
    latestBlockAt: blocks[blocks.length - 1]?.data.timestamp.toISOString() ?? null,
    weeksSpanned: weeks.length,
    peakWeek: peakWeek.count > 0 ? peakWeek : null,
    totals: {
      byChannel: Object.fromEntries(
        CHANNEL_LIST.map((ch) => [ch.code, channelTotals[ch.code] ?? 0])
      ),
      byType: Object.fromEntries(
        BLOCK_TYPE_LIST.map((t) => [t.code, typeTotals[t.code] ?? 0])
      )
    },
    weeks: weeks.map((wk) => ({
      week: wk,
      total: weekTotals[wk] ?? 0,
      byChannel: Object.fromEntries(
        CHANNEL_LIST.map((ch) => [ch.code, byWeek[wk]?.[ch.code] ?? 0])
      )
    })),
    surfaces: {
      human: "https://pointcast.xyz/timeline",
      archive: "https://pointcast.xyz/archive.json",
      blocks: "https://pointcast.xyz/blocks.json"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
