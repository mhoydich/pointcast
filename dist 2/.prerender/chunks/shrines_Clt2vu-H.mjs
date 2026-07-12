import { U as UNFURL_SHRINES, c as SHRINE_SETS, a as absoluteUrl, b as absoluteImage } from './unfurl-shrines_CZAaG8nC.mjs';

const GET = async () => {
  const shrinesBySlug = new Map(UNFURL_SHRINES.map((shrine) => [shrine.slug, shrine]));
  const payload = {
    $schema: "https://pointcast.xyz/shrines.json",
    title: "PointCast URL shrine sets",
    version: "1.0",
    description: "Visual shrine sets for PointCast URL unfurls, grouped by share ritual and backed by generated background art.",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: absoluteUrl("/unfurls.json"),
    builder: absoluteUrl("/unfurls#builder"),
    backgrounds: {
      sheet: absoluteImage("/images/shrines/shrine-background-sheet.png"),
      elementSheet: absoluteImage("/images/shrines/element-shrine-background-sheet.png"),
      generatedFor: "URL unfurl shrines"
    },
    sets: SHRINE_SETS.map((set) => ({
      ...set,
      background: absoluteImage(set.background),
      backgroundVariants: set.backgroundVariants?.map(absoluteImage),
      url: absoluteUrl(`/shrines#${set.slug}`),
      shrines: set.slugs.map((slug) => shrinesBySlug.get(slug)).filter(Boolean).map((shrine) => ({
        ...shrine,
        url: absoluteUrl(shrine.path),
        miniUrl: absoluteUrl(shrine.miniPath),
        miniImage: absoluteUrl(`${shrine.miniPath}/og.png`),
        image: absoluteImage(shrine.image),
        proof: shrine.proof.map(absoluteUrl)
      }))
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
