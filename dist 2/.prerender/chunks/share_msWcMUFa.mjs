import { f as SHARE_ACTION_CHECKLIST, c as SHARE_CAMPAIGN_PACKETS, b as SHARE_LAUNCH_ASSETS, a as SHARE_SNIPPETS, e as SHARE_AUDIENCES, S as SHARE_LANDING_PAGES, D as DISTRIBUTION_LOOP, d as SHARE_KIT_UPDATED, h as SHARE_SPRINT_PATH, g as SHARE_PLAN_PATH } from './share-kit_Z8-VWlGp.mjs';

const SITE_URL = "https://pointcast.xyz";
const repoUrl = (path) => `https://github.com/mhoydich/pointcast/blob/main/${path}`;
const absolute = (path) => new URL(path, SITE_URL).href;
const GET = async () => {
  const payload = {
    schema: "pointcast-share-kit-v0",
    host: "pointcast.xyz",
    updatedAt: SHARE_KIT_UPDATED,
    humanUrl: absolute("/share"),
    planUrl: repoUrl(SHARE_PLAN_PATH),
    sprintUrl: repoUrl(SHARE_SPRINT_PATH),
    summary: "Organic visitor plan and campaign packets for PointCast. Use narrow audience routes, useful public surfaces, machine-readable endpoints, and post-deploy recrawl loops.",
    landingPages: SHARE_LANDING_PAGES.map((page) => ({
      ...page,
      url: absolute(page.path)
    })),
    audiences: SHARE_AUDIENCES.map((audience) => ({
      ...audience,
      url: absolute(audience.path)
    })),
    snippets: SHARE_SNIPPETS.map((snippet) => ({
      ...snippet,
      url: absolute(snippet.target)
    })),
    launchAssets: SHARE_LAUNCH_ASSETS.map((asset) => ({
      ...asset,
      url: absolute(asset.url),
      docUrl: repoUrl(asset.docPath)
    })),
    campaignPackets: SHARE_CAMPAIGN_PACKETS.map((packet) => ({
      ...packet,
      url: absolute(packet.targetPath),
      docUrl: repoUrl(packet.docPath)
    })),
    actionChecklist: SHARE_ACTION_CHECKLIST.map((item) => ({
      ...item,
      url: absolute(item.url)
    })),
    distributionLoop: DISTRIBUTION_LOOP
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60, s-maxage=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
