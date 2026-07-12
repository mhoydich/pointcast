import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST, C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { S as STATIONS, c as NAME_DROPS } from './local_DC-fTB3e.mjs';
import { d as daySeed, p as pickDailyBlock, t as todayPT } from './daily_2eiOMuEj.mjs';

const GET = async () => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  let gallery = [];
  try {
    gallery = await getCollection("gallery", ({ data }) => !data.draft);
  } catch {
  }
  function pickEntry(date) {
    const pick = pickDailyBlock(blocks, date);
    if (!pick) return null;
    const ch = CHANNELS[pick.data.channel];
    return {
      date: todayPT(date),
      daySeed: daySeed(date),
      blockId: pick.data.id,
      title: pick.data.title,
      channel: { code: ch.code, slug: ch.slug, name: ch.name },
      type: pick.data.type,
      mood: pick.data.mood ?? null,
      moodUrl: pick.data.mood ? `https://pointcast.xyz/mood/${pick.data.mood}` : null,
      blockUrl: `https://pointcast.xyz/b/${pick.data.id}`,
      blockJsonUrl: `https://pointcast.xyz/b/${pick.data.id}.json`
    };
  }
  const now = /* @__PURE__ */ new Date();
  const DAY_MS = 864e5;
  const today = pickEntry(now);
  const tomorrow = pickEntry(new Date(now.getTime() + DAY_MS));
  const past = [];
  for (let i = 1; i <= 7; i++) {
    const entry = pickEntry(new Date(now.getTime() - i * DAY_MS));
    if (entry) past.push(entry);
  }
  const seed = daySeed(now);
  const moodSet = /* @__PURE__ */ new Set();
  for (const b of blocks) if (b.data.mood) moodSet.add(b.data.mood);
  for (const g of gallery) if (g.data.mood) moodSet.add(g.data.mood);
  const moodList = [...moodSet].sort();
  const todayMoodSlug = moodList.length > 0 ? moodList[seed % moodList.length] : null;
  const stationList = [...STATIONS].sort((a, b) => a.miles - b.miles);
  const todayStation = stationList[(seed + 3) % stationList.length];
  const todayNameDrop = NAME_DROPS[(seed + 5) % NAME_DROPS.length];
  const todayChannelSpec = CHANNEL_LIST[(seed + 7) % CHANNEL_LIST.length];
  const todayNounId = seed * 7 % 1200;
  const todayStrip = {
    seed,
    mood: todayMoodSlug ? {
      slug: todayMoodSlug,
      display: todayMoodSlug.replace(/-/g, " "),
      url: `https://pointcast.xyz/mood/${todayMoodSlug}`,
      jsonUrl: `https://pointcast.xyz/mood/${todayMoodSlug}.json`
    } : null,
    block: today,
    // same as `today` above; included here for strip-consumer symmetry
    station: {
      name: todayStation.name,
      miles: todayStation.miles,
      direction: todayStation.direction,
      blurb: todayStation.blurb,
      url: `https://pointcast.xyz/search?q=${encodeURIComponent(todayStation.name)}`
    },
    nameDrop: {
      name: todayNameDrop.name,
      kind: todayNameDrop.kind,
      one: todayNameDrop.one,
      url: "https://pointcast.xyz/b/0276"
    },
    channel: {
      code: todayChannelSpec.code,
      slug: todayChannelSpec.slug,
      name: todayChannelSpec.name,
      purpose: todayChannelSpec.purpose,
      color600: todayChannelSpec.color600,
      url: `https://pointcast.xyz/c/${todayChannelSpec.slug}`,
      jsonUrl: `https://pointcast.xyz/c/${todayChannelSpec.slug}.json`
    },
    noun: {
      id: todayNounId,
      url: `https://noun.pics/${todayNounId}.svg`
    },
    rotation: {
      algorithm: "daySeed with prime offsets per slot (mood: +0, block: shared with /today pick, station: +3, nameDrop: +5, channel: +7, noun: *7)",
      rotatesAt: "midnight PT"
    }
  };
  const payload = {
    $schema: "https://pointcast.xyz/today.json",
    name: "PointCast · Daily Drop",
    description: "One block per PT calendar day, chosen deterministically so every visitor globally sees the same pick on the same day. Past picks and tomorrow preview are computed from the same deterministic function.",
    home: "https://pointcast.xyz/today",
    generatedAt: now.toISOString(),
    rotation: {
      algorithm: "daySeed = year*1000 + dayOfYearPT; pick = blocks[daySeed % blocks.length] (blocks sorted by id)",
      anchor: "America/Los_Angeles",
      collectionSize: blocks.length
    },
    today,
    tomorrow,
    past,
    /** TodayStrip six daily-rotating chips — same picks as the home-page
     *  component (src/components/TodayStrip.astro). Agents consuming this
     *  endpoint get the full daily featured-set in one fetch. */
    todayStrip,
    /** The `collect` mechanic is client-side-only for v0: localStorage
     *  array at `pc:daily:collected`. Agents can't collect programmatically
     *  — that's by design. When Tezos claim ships, a separate endpoint
     *  handles the server-side attestation. */
    collect: {
      mechanism: "localStorage (client-only, v0)",
      storageKey: "pc:daily:collected",
      schema: '{ date: "YYYY-MM-DD", blockId: string, at: ISO-string }[]',
      serverAggregation: "not yet — KV-backed count endpoint is follow-up work",
      tezosClaim: "deferred; requires Mike greenlight per wallet-ladder Rung 5"
    },
    adjacent: {
      today: "https://pointcast.xyz/today",
      tv: "https://pointcast.xyz/tv",
      moods: "https://pointcast.xyz/moods",
      blocksJson: "https://pointcast.xyz/blocks.json",
      walletLadderEditorial: "https://pointcast.xyz/b/0280",
      arcEditorial: "https://pointcast.xyz/b/0282"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
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
