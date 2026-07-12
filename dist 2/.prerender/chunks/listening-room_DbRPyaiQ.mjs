const payload = {
  $schema: "https://pointcast.xyz/for-agents",
  generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  name: "PointCast Listening Room",
  status: "interactive sponsored listening room",
  human: "https://pointcast.xyz/listening-room",
  image: "https://pointcast.xyz/images/listening-room/pointcast-listening-room-space.png",
  archiveBlock: {
    id: "0339",
    url: "https://pointcast.xyz/b/0339",
    jsonUrl: "https://pointcast.xyz/b/0339.json"
  },
  sponsors: [
    { name: "Nouns Cola", url: "https://pointcast.xyz/nouns-cola" },
    { name: "Get Good Feels", url: "https://getgoodfeels.net" }
  ],
  soundtrack: {
    platform: "Spotify",
    embed: "https://open.spotify.com/embed/playlist/35WC68tu9rrBoRrW3N2n0M",
    open: "https://open.spotify.com/playlist/35WC68tu9rrBoRrW3N2n0M?si=3543c0d357294d9f"
  },
  interactions: [
    "space-sparkle canvas",
    "scene mode presets",
    "intensity slider",
    "drift slider",
    "focus mode",
    "browser-local room memory"
  ],
  related: {
    pointcast: "https://pointcast.xyz/",
    nounsCola: "https://pointcast.xyz/nouns-cola",
    sourceBlock: "https://pointcast.xyz/b/0339"
  }
};
const GET = async () => {
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
