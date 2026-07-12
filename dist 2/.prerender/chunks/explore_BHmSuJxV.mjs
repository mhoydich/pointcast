import { c as countByCategory, s as staleFeatures, r as recentFeatures, F as FEATURES, C as CATEGORIES } from './explore_VIsa8iQ4.mjs';
import { P as POINTCAST_APPS } from './pointcast-apps_DuRB6sfu.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const GET = () => {
  const counts = countByCategory();
  const payload = {
    $schema: "https://pointcast.xyz/explore.json",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    total: FEATURES.length,
    categories: CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      blurb: c.blurb,
      count: counts[c.key] ?? 0
    })),
    features: FEATURES.map((f) => ({
      slug: f.slug,
      url: `https://pointcast.xyz${f.slug}`,
      title: f.title,
      description: f.description,
      category: f.category,
      lastCommit: f.mtime > 0 ? new Date(f.mtime * 1e3).toISOString() : null
    })),
    recent: recentFeatures(7, 16).map((f) => ({
      slug: f.slug,
      url: `https://pointcast.xyz${f.slug}`,
      title: f.title,
      lastCommit: new Date(f.mtime * 1e3).toISOString()
    })),
    stale: staleFeatures(90, 12).map((f) => ({
      slug: f.slug,
      url: `https://pointcast.xyz${f.slug}`,
      title: f.title,
      lastCommit: new Date(f.mtime * 1e3).toISOString(),
      daysUntouched: Math.floor((Date.now() / 1e3 - f.mtime) / 86400)
    })),
    feeds: {
      rss: "https://pointcast.xyz/explore.rss",
      json: "https://pointcast.xyz/explore.json"
    },
    channels: Object.values(CHANNELS).map((ch) => ({
      code: ch.code,
      slug: ch.slug,
      name: ch.name,
      url: `https://pointcast.xyz/c/${ch.slug}`,
      purpose: ch.purpose,
      color: ch.color600
    })),
    apps: POINTCAST_APPS.map((a) => ({
      slug: a.slug,
      name: a.name,
      url: a.url,
      description: a.description,
      channel: a.channel
    }))
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
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
