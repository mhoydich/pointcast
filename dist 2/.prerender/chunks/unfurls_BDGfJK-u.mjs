import { U as UNFURL_SHRINES, a as absoluteUrl, b as absoluteImage, d as getMiniShrineDescription } from './unfurl-shrines_CZAaG8nC.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/unfurls.json",
    title: "PointCast URL unfurl shrines",
    version: "2.0",
    description: "Canonical URL preview manifest for high-signal PointCast routes, plus the source data for the /unfurls shrine builder.",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    count: UNFURL_SHRINES.length,
    builder: {
      url: "https://pointcast.xyz/unfurls#builder",
      requiredFields: ["path", "miniPath", "title", "description", "image", "kind", "audience", "ritual"],
      optionalFields: ["proof", "shrineSet"]
    },
    rule: {
      human: "When you send a PointCast link, its preview should read like a mini shrine: stable image, clear object, proof links, and a single next action.",
      miniShrinePattern: "https://pointcast.xyz/u/{slug}"
    },
    shrines: UNFURL_SHRINES.map((shrine) => ({
      ...shrine,
      url: absoluteUrl(shrine.path),
      miniUrl: absoluteUrl(shrine.miniPath),
      miniImage: absoluteUrl(`${shrine.miniPath}/og.png`),
      miniTitle: `${shrine.title} · mini shrine`,
      miniDescription: getMiniShrineDescription(shrine),
      image: absoluteImage(shrine.image),
      proof: shrine.proof.map(absoluteUrl),
      validators: {
        opengraph: `https://www.opengraph.xyz/url/${encodeURIComponent(absoluteUrl(shrine.path))}`,
        miniShrineOpengraph: `https://www.opengraph.xyz/url/${encodeURIComponent(absoluteUrl(shrine.miniPath))}`,
        twitterCard: `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(absoluteUrl(shrine.path))}`,
        facebookSharing: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(absoluteUrl(shrine.path))}`
      }
    }))
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
