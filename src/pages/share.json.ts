import type { APIRoute } from 'astro';
import {
  DISTRIBUTION_LOOP,
  SHARE_ACTION_CHECKLIST,
  SHARE_AUDIENCES,
  SHARE_CAMPAIGN_PACKETS,
  SHARE_KIT_UPDATED,
  SHARE_LANDING_PAGES,
  SHARE_LAUNCH_ASSETS,
  SHARE_PLAN_PATH,
  SHARE_SNIPPETS,
  SHARE_SPRINT_PATH,
} from '../lib/share-kit';

const SITE_URL = 'https://pointcast.xyz';
const repoUrl = (path: string) => `https://github.com/mhoydich/pointcast/blob/main/${path}`;
const absolute = (path: string) => new URL(path, SITE_URL).href;

export const GET: APIRoute = async () => {
  const payload = {
    schema: 'pointcast-share-kit-v0',
    host: 'pointcast.xyz',
    updatedAt: SHARE_KIT_UPDATED,
    humanUrl: absolute('/share'),
    planUrl: repoUrl(SHARE_PLAN_PATH),
    sprintUrl: repoUrl(SHARE_SPRINT_PATH),
    summary:
      'Organic visitor plan and campaign packets for PointCast. Use narrow audience routes, useful public surfaces, machine-readable endpoints, and post-deploy recrawl loops.',
    landingPages: SHARE_LANDING_PAGES.map((page) => ({
      ...page,
      url: absolute(page.path),
    })),
    audiences: SHARE_AUDIENCES.map((audience) => ({
      ...audience,
      url: absolute(audience.path),
    })),
    snippets: SHARE_SNIPPETS.map((snippet) => ({
      ...snippet,
      url: absolute(snippet.target),
    })),
    launchAssets: SHARE_LAUNCH_ASSETS.map((asset) => ({
      ...asset,
      url: absolute(asset.url),
      docUrl: repoUrl(asset.docPath),
    })),
    campaignPackets: SHARE_CAMPAIGN_PACKETS.map((packet) => ({
      ...packet,
      url: absolute(packet.targetPath),
      docUrl: repoUrl(packet.docPath),
    })),
    actionChecklist: SHARE_ACTION_CHECKLIST.map((item) => ({
      ...item,
      url: absolute(item.url),
    })),
    distributionLoop: DISTRIBUTION_LOOP,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
};
