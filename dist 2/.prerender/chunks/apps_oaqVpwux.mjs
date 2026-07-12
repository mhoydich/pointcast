import { P as POINTCAST_APPS } from './pointcast-apps_DuRB6sfu.mjs';
import { P as POINTCAST_CONNECTORS } from './pointcast-connectors_CtRpC8H_.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/apps.schema.json",
    name: "PointCast Apps",
    description: "PointCast app shelf for humans and AI clients: rooms, satellite apps, local tools, and addable MCP connectors.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    canonical: "https://pointcast.xyz/apps",
    apps: POINTCAST_APPS.map((app) => ({
      ...app,
      canonicalUrl: `https://pointcast.xyz${app.path}`
    })),
    connectors: POINTCAST_CONNECTORS.map((connector) => ({
      slug: connector.slug,
      name: connector.name,
      endpoint: connector.endpoint,
      status: connector.status,
      priority: connector.priority,
      category: connector.category,
      description: connector.description,
      clientUse: connector.clientUse,
      tools: connector.tools
    }))
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
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
