import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { p as pickCardOfTheDay } from './card-of-the-day_bp_L5sch.mjs';
import { g as getChartOfTheDay } from './chart-of-the-day_BJJik1Ha.mjs';
import { d as getNextPrizeCastDrawAt, g as getPrizeCastSnapshot } from './prize-cast_Bt_lh8RM.mjs';
import contracts from './contracts_B1zhgPPX.mjs';
import { execSync } from 'node:child_process';

const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const todaysCard = pickCardOfTheDay();
  const chartOfTheDay = getChartOfTheDay(blocks);
  const nextDraw = getNextPrizeCastDrawAt();
  const prizeCast = await getPrizeCastSnapshot();
  const visitNounsKt1 = (contracts.visit_nouns?.mainnet).trim();
  const prizeCastKt1 = (contracts.prize_cast?.mainnet).trim();
  const drumKt1 = (contracts.drum_token?.mainnet).trim();
  let mintCount = null;
  if (visitNounsKt1.startsWith("KT1")) {
    try {
      const r = await fetch(`https://api.tzkt.io/v1/tokens?contract=${visitNounsKt1}&limit=10000&select=totalSupply`);
      if (r.ok) {
        const list = await r.json();
        mintCount = list.reduce((sum, t) => sum + Number(t.totalSupply ?? 0), 0);
      }
    } catch {
    }
  }
  let lastCommit = null;
  try {
    const out = execSync('git log -1 --pretty=format:"%h|%s|%cI|%an"', { encoding: "utf-8" }).trim();
    const [hash, subject, date, author] = out.split("|");
    lastCommit = { hash, subject, date, author };
  } catch {
  }
  const channelCounts = {};
  for (const b of blocks) channelCounts[b.data.channel] = (channelCounts[b.data.channel] ?? 0) + 1;
  const payload = {
    $schema: "https://pointcast.xyz/for-agents",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    broadcast: {
      cardOfTheDay: {
        id: todaysCard.id,
        date: todaysCard.date,
        dateLabel: todaysCard.dateLabel,
        note: todaysCard.note,
        rosterIndex: todaysCard.rosterIndex,
        arenaUrl: "https://pointcast.xyz/battle"
      },
      chartOfTheDay: {
        title: chartOfTheDay.title,
        date: chartOfTheDay.date,
        metric: chartOfTheDay.metric,
        value: chartOfTheDay.value,
        trend: chartOfTheDay.trend,
        trendLabel: chartOfTheDay.trendLabel,
        url: "https://pointcast.xyz/chart",
        jsonUrl: "https://pointcast.xyz/chart.json"
      },
      prizeCast: {
        status: prizeCastKt1.startsWith("KT1") ? "live" : "pending",
        contract: prizeCastKt1 || null,
        nextDrawAt: nextDraw.toISOString(),
        tvlTez: prizeCast.tvlTez,
        prizePoolTez: prizeCast.prizePoolTez,
        drawDay: "Sunday 18:00 UTC",
        url: "https://pointcast.xyz/cast"
      }
    },
    latest: blocks.slice(0, 4).map((b) => ({
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      channel: b.data.channel,
      type: b.data.type,
      title: b.data.title,
      timestamp: b.data.timestamp.toISOString()
    })),
    footprint: {
      blocksLive: blocks.length,
      channelCount: Object.keys(channelCounts).length,
      channels: channelCounts,
      visitNounsMinted: mintCount,
      contracts: {
        visitNouns: { kt1: visitNounsKt1 || null, status: visitNounsKt1 ? "live" : "pending" },
        prizeCast: { kt1: prizeCastKt1 || null, status: prizeCastKt1 ? "live" : "pending-compile" },
        drumToken: { kt1: drumKt1 || null, status: drumKt1 ? "live" : "pending-compile" }
      }
    },
    trail: {
      lastCommit,
      statusPage: "https://pointcast.xyz/status"
    },
    surfaces: {
      human: "https://pointcast.xyz/now",
      archive: "https://pointcast.xyz/archive.json",
      editions: "https://pointcast.xyz/editions.json",
      forAgents: "https://pointcast.xyz/for-agents"
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
