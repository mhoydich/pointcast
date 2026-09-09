import { POINTCAST_CLIENT_SETUPS } from './pointcast-agent-kit';

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

function clientsFor(endpoint: string, serverName: string): ConnectorClient[] {
  return [
    ...POINTCAST_CLIENT_SETUPS.map((client) => ({
      name: client.name,
      label: client.command
        ? `${client.setup} ${client.command.replace('https://pointcast.xyz/api/mcp-v2', endpoint).replace('pointcast-v2', serverName)}`
        : client.setup,
      note: `${client.plans} ${client.note}`,
    })),
    {
      name: 'Cursor',
      label: `Add the URL under mcpServers.${serverName === 'pointcast-v2' ? 'pointcastV2' : 'pointcast'}.url.`,
      note: 'Good for repo-aware building with PointCast context nearby.',
    },
  ];
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
      'Fresh PointCast MCP connector for AI clients: same town-wide tools, Nouns Nation Battler wiki briefs, agent tasks, result tracking, watch-frame handoffs, new URL, distinct server identity, and Claude-friendly annotations.',
    clientUse:
      'Add this when a client has cached the original PointCast connector or when you want the newest app-shelf-first MCP surface.',
    tools: [
      'connector_links',
      'apps_list',
      'nouns_battler_wiki',
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
      'pointcast_pair',
      'drum_tap',
    ],
    clients: clientsFor('https://pointcast.xyz/api/mcp-v2', 'pointcast-v2'),
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
      'The whole PointCast town as an MCP connector: blocks, rooms, presence, apps, Nouns Nation Battler wiki briefs, tasks, result tracking, watch-frame handoffs, contracts, weather, channels, and the drum hub.',
    clientUse:
      'Stable original connector URL. Keep it installed when a client already sees the tools; use v2 for a fresh install.',
    tools: [
      'town_map',
      'surfaces_list',
      'connector_links',
      'apps_list',
      'nouns_battler_wiki',
      'nouns_battler_agent_tasks',
      'nouns_battler_manifest',
      'nouns_battler_result_tracker',
      'nouns_battler_cowork_brief',
      'presence_snapshot',
      'blocks_recent',
      'block_read',
      'blocks_search',
      'pointcast_pair',
      'drum_tap',
    ],
    clients: clientsFor('https://pointcast.xyz/api/mcp', 'pointcast'),
  },
];

export function getPointcastConnector(slug: string) {
  return POINTCAST_CONNECTORS.find((connector) => connector.slug === slug);
}
