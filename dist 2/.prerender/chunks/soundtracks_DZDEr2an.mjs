import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const AUDIO_PROFILE_SLUGS = [
  "el-segundo",
  "medway",
  "nyc",
  "london",
  "mallorca",
  "istanbul",
  "tokyo",
  "mexico-city"
];
const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const soundBlocks = blocks.filter(
    (b) => b.data.type === "LISTEN" || b.data.media?.kind === "audio" || b.data.media?.kind === "embed" && /spotify|soundcloud|bandcamp|apple\.com\/music|tidal/.test(b.data.media.src ?? "")
  );
  const lines = [];
  soundBlocks.forEach((b) => {
    const meta = b.data.meta ?? {};
    lines.push(JSON.stringify({
      kind: "block",
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      type: b.data.type,
      title: b.data.title,
      dek: b.data.dek ?? null,
      mood: b.data.mood ?? null,
      artist: meta.artist ?? null,
      album: meta.album ?? null,
      bpm: meta.bpm ?? null,
      key: meta.key ?? null,
      durationSec: meta.duration ?? meta.durationSec ?? null,
      mediaKind: b.data.media?.kind ?? null,
      mediaSrc: b.data.media?.src ?? null,
      timestamp: b.data.timestamp.toISOString()
    }));
  });
  AUDIO_PROFILE_SLUGS.forEach((slug) => {
    lines.push(JSON.stringify({
      kind: "procedural",
      id: `clock-ambient-${slug}`,
      url: `https://pointcast.xyz/clock/0324`,
      profile: slug,
      title: `Sonic Postcard · ${slug}`,
      description: "Procedural Web Audio ambient — no asset, no licensing. Synthesized in-browser on demand.",
      synthesized: true,
      source: "https://pointcast.xyz/clock/0324#audio"
    }));
  });
  return new Response(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Total-Count": String(lines.length),
      "X-Music-Blocks": String(soundBlocks.length),
      "X-Procedural-Profiles": String(AUDIO_PROFILE_SLUGS.length)
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
