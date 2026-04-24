/**
 * /.well-known/agent-passport — publisher identity document for AI agents.
 *
 * Not yet a formal standard but a growing convention — pairs with the three
 * OAuth/OIDC well-known docs already shipped, plus the MCP server-card and
 * agent-skills index. The agent-passport is the single highest-level entry
 * point: an agent fetches this first, finds every other well-known path
 * linked from it, and walks from there.
 *
 * Shipped by Sprint #91 Theme C-1 (2026-04-21 14:00 PT).
 */

export const onRequest: PagesFunction = async () => {
  const passport = {
    $schema: 'https://pointcast.xyz/.well-known/agent-passport.schema.json',
    publisher: 'PointCast',
    canonical_url: 'https://pointcast.xyz',
    description: 'A living broadcast from El Segundo. Dispatches, art drops, and coordination infrastructure from Mike Hoydich + collaborators (claude-code, codex, manus, chatgpt).',
    tagline: 'Compute is the currency. The ledger is the receipt.',
    identity: {
      operator: 'Mike Hoydich',
      contact: 'https://pointcast.xyz/cos',
      abuse: 'https://pointcast.xyz/cos?q=abuse',
      tezos_address: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
      github: 'https://github.com/mhoydich',
    },
    preferred_agents: [
      { name: 'claude-code', role: 'primary editorial + engineering', kind: 'large-context' },
      { name: 'codex',       role: 'atomic single-file low-reasoning ships', kind: 'code-specialist' },
      { name: 'manus',       role: 'GTM + distribution + browser automation', kind: 'browser-agent' },
      { name: 'chatgpt',     role: 'longform specs + paste-in-agent flows', kind: 'general' },
    ],
    endpoints: {
      oauth_authorization_server: 'https://pointcast.xyz/.well-known/oauth-authorization-server',
      openid_configuration:       'https://pointcast.xyz/.well-known/openid-configuration',
      oauth_protected_resource:   'https://pointcast.xyz/.well-known/oauth-protected-resource',
      api_catalog:                'https://pointcast.xyz/.well-known/api-catalog',
      mcp_server_card:            'https://pointcast.xyz/.well-known/mcp/server-card.json',
      agent_skills:               'https://pointcast.xyz/.well-known/agent-skills/index.json',
      agents_manifest:            'https://pointcast.xyz/agents.json',
      compute_ledger:             'https://pointcast.xyz/compute.json',
      blocks:                     'https://pointcast.xyz/blocks.json',
      llms_txt:                   'https://pointcast.xyz/llms.txt',
      llms_full:                  'https://pointcast.xyz/llms-full.txt',
      feed_json:                  'https://pointcast.xyz/feed.json',
      feed_rss:                   'https://pointcast.xyz/feed.xml',
    },
    webmcp: {
      available: true,
      tool_count: 7,
      tools: [
        'pointcast_latest_blocks',
        'pointcast_get_block',
        'pointcast_send_ping',
        'pointcast_push_drop',
        'pointcast_drum_beat',
        'pointcast_federation',
        'pointcast_compute_ledger',
      ],
      registered_via: 'navigator.modelContext.provideContext()',
      spec: 'https://webmachinelearning.github.io/webmcp/',
    },
    federation: {
      registry: 'https://pointcast.xyz/for-nodes',
      peers_manifest: 'https://pointcast.xyz/compute.json',
      onboarding: 'Three steps: (1) host /agents.json + a feed, (2) PR the registry at /for-nodes, (3) DAO ratification.',
    },
    policies: {
      robots: 'https://pointcast.xyz/robots.txt',
      terms: 'https://pointcast.xyz/manifesto',
      license: 'CC0 for editorial blocks and site code; see /manifesto for nuance.',
      bot_traffic: 'welcomed; be polite (respect cache headers); rate-limit self at ~10 req/sec per IP.',
      authentication_required: false,
    },
    last_updated: new Date().toISOString(),
  };

  return new Response(JSON.stringify(passport, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
