export interface ConnectorClient {
  name: string;
  label: string;
  note: string;
}

export interface PointcastConnector {
  slug: string;
  name: string;
  shortName: string;
  endpoint: string;
  status: 'live' | 'pilot';
  priority: number;
  owner: string;
  category: 'town' | 'commerce' | 'creative' | 'operations';
  description: string;
  clientUse: string;
  tools: string[];
  clients: ConnectorClient[];
}

export const POINTCAST_CONNECTORS: PointcastConnector[] = [
  {
    slug: 'pointcast-v2',
    name: 'PointCast v2',
    shortName: 'PointCast v2',
    endpoint: 'https://pointcast.xyz/api/mcp-v2',
    status: 'live',
    priority: 0,
    owner: 'PointCast',
    category: 'town',
    description:
      'Fresh PointCast MCP connector for AI clients: same town-wide tools, Nouns Nation Battler agent tasks, result tracking, watch-frame handoffs, new URL, distinct server identity, and Claude-friendly annotations.',
    clientUse:
      'Add this when a client has cached the original PointCast connector or when you want the newest app-shelf-first MCP surface.',
    tools: [
      'connector_links',
      'apps_list',
      'nouns_battler_agent_tasks',
      'nouns_battler_manifest',
      'nouns_battler_result_tracker',
      'nouns_battler_cowork_brief',
      'town_map',
      'surfaces_list',
      'presence_snapshot',
      'blocks_recent',
      'block_read',
      'blocks_search',
      'drum_tap',
    ],
    clients: [
      {
        name: 'Claude custom connector',
        label: 'Paste the endpoint URL into Add custom connector.',
        note: 'Use "PointCast v2" as the connector name.',
      },
      {
        name: 'Claude Code',
        label: 'claude mcp add --transport http pointcast-v2 https://pointcast.xyz/api/mcp-v2',
        note: 'Best for testing the fresh connector identity before replacing v1.',
      },
      {
        name: 'Cursor',
        label: 'Add the URL under mcpServers.pointcastV2.url.',
        note: 'Good for repo-aware building with the newest PointCast app shelf nearby.',
      },
    ],
  },
  {
    slug: 'pointcast',
    name: 'PointCast',
    shortName: 'PointCast',
    endpoint: 'https://pointcast.xyz/api/mcp',
    status: 'live',
    priority: 1,
    owner: 'PointCast',
    category: 'town',
    description:
      'The whole PointCast town as an MCP connector: blocks, rooms, presence, apps, Nouns Nation Battler tasks, result tracking, watch-frame handoffs, contracts, weather, channels, and the drum hub.',
    clientUse:
      'Stable original connector URL. Keep it installed when a client already sees the tools; use v2 for a fresh install.',
    tools: [
      'town_map',
      'surfaces_list',
      'connector_links',
      'apps_list',
      'nouns_battler_agent_tasks',
      'nouns_battler_manifest',
      'nouns_battler_result_tracker',
      'nouns_battler_cowork_brief',
      'presence_snapshot',
      'blocks_recent',
      'block_read',
      'blocks_search',
      'drum_tap',
    ],
    clients: [
      {
        name: 'Claude custom connector',
        label: 'Paste the endpoint URL into Add custom connector.',
        note: 'Use "PointCast" as the connector name.',
      },
      {
        name: 'Claude Code',
        label: 'claude mcp add --transport http pointcast https://pointcast.xyz/api/mcp',
        note: 'Best for local agent work and task handoffs.',
      },
      {
        name: 'Cursor',
        label: 'Add the URL under mcpServers.pointcast.url.',
        note: 'Good for repo-aware building with PointCast context nearby.',
      },
    ],
  },
];

export function getPointcastConnector(slug: string) {
  return POINTCAST_CONNECTORS.find((connector) => connector.slug === slug);
}
