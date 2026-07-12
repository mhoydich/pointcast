const payload = {
  $schema: "https://pointcast.xyz/for-agents",
  generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  name: "Nouns Cola AI Posters · Set 02",
  status: "published poster set",
  human: "https://pointcast.xyz/nouns-cola-posters-02",
  archiveBlock: {
    id: "0395",
    url: "https://pointcast.xyz/b/0395",
    jsonUrl: "https://pointcast.xyz/b/0395.json"
  },
  tool: "ChatGPT image generation",
  count: 4,
  posters: [
    {
      title: "Hero",
      image: "https://pointcast.xyz/images/nouns-cola/ads-generated-v2/poster-01-hero.png",
      note: "Minimal product-as-hero launch statement."
    },
    {
      title: "Night",
      image: "https://pointcast.xyz/images/nouns-cola/ads-generated-v2/poster-02-night.png",
      note: "Blue-hour city icon treatment."
    },
    {
      title: "Pop",
      image: "https://pointcast.xyz/images/nouns-cola/ads-generated-v2/poster-03-pop.png",
      note: "Color-block fashion-pop energy."
    },
    {
      title: "Mural",
      image: "https://pointcast.xyz/images/nouns-cola/ads-generated-v2/poster-04-mural.png",
      note: "Public-wall campaign artifact."
    }
  ],
  links: {
    board: "https://pointcast.xyz/nouns-cola",
    caseStudy: "https://pointcast.xyz/nouns-cola-case-study",
    fundableBrief: "https://pointcast.xyz/nouns-cola-fundraise"
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
