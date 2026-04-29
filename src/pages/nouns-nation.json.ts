/**
 * /nouns-nation.json - machine-readable hub and federation manifest.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Nation',
  status: 'standalone PointCast area with federation strategy v0 and Battle Desk V3',
  human: 'https://pointcast.xyz/nouns-nation/',
  summary:
    'A standalone PointCast area for Nouns Nation Battler, Battle Desk V3, season recap archive, Battle Desk V2, TV cast, Desk Wall, Agent Bench, blocks, and a federation path for people bringing their own nations, teams, gangs, clubs, crews, DAOs, schools, shops, and local leagues.',
  latestVersion: {
    name: 'Battle Desk V3',
    human: 'https://pointcast.xyz/nouns-nation-battler-v3/',
    thought:
      'Make the sport watchable, make receipts portable, give the league memory through champions and MVPs, and make the federation door easy for outside nations without flattening their culture.',
    signature: 'Michael Hoydich x Codex 5.5 extra-high',
    shippedAt: '2026-04-29',
  },
  routes: {
    hub: 'https://pointcast.xyz/nouns-nation/',
    federation: 'https://pointcast.xyz/nouns-nation/federation/',
    join: 'https://pointcast.xyz/nouns-nation/join/',
    roadmap: 'https://pointcast.xyz/nouns-nation/roadmap',
    roadmapJson: 'https://pointcast.xyz/nouns-nation/roadmap.json',
    roadmapDeck: 'https://pointcast.xyz/decks/nouns-nation-builder-roadmap-v2.pptx',
    investmentThesis: 'https://pointcast.xyz/investment-thesis',
    investmentThesisJson: 'https://pointcast.xyz/investment-thesis.json',
    battleDeskV3: 'https://pointcast.xyz/nouns-nation-battler-v3/',
    seasonRecapArchive: 'https://pointcast.xyz/nouns-nation-battler-v3/#season-recap',
    battleDeskV2: 'https://pointcast.xyz/nouns-nation-battler-v2/',
    battleDesk: 'https://pointcast.xyz/nouns-nation-battler/',
    tvCast: 'https://pointcast.xyz/nouns-nation-battler-tv/',
    deskWall: 'https://pointcast.xyz/nouns-nation-battler-desk/',
    posterWall: 'https://pointcast.xyz/nouns-nation-battler-posters/',
    agentBench: 'https://pointcast.xyz/nouns-nation-battler-agents/',
    battlerManifest: 'https://pointcast.xyz/nouns-nation-battler.json',
    agentBenchJson: 'https://pointcast.xyz/nouns-nation-battler-agents.json',
    battleChannel: 'https://pointcast.xyz/c/battler/',
  },
  federation: {
    posture: 'Federate results and event grammar while letting nations keep local identity, lore, rules, and home desks.',
    eligibleKinds: ['nation', 'team', 'gang', 'club', 'crew', 'DAO', 'school', 'shop', 'local league', 'fandom', 'art collective'],
    integrationLevels: [
      { level: 0, name: 'spectator link', requirement: 'Link to a public Nouns Nation surface.' },
      { level: 1, name: 'read-only manifest', requirement: 'Publish stable identity, colors, home link, roster policy, and proof note.' },
      { level: 2, name: 'snapshot exchange', requirement: 'Publish latest result or standings in a shared envelope.' },
      { level: 3, name: 'home desk', requirement: 'Run a human page or desk surface for the nation.' },
      { level: 4, name: 'federated season', requirement: 'Opt into a shared cup, rivalry week, bowl, or season calendar.' },
    ],
    minimumNationManifest: {
      nationId: 'stable slug',
      displayName: 'public name',
      kind: 'nation | team | gang | club | crew | DAO | school | shop | local league',
      shortCode: '2-5 character code',
      home: 'canonical public URL',
      colors: {
        primary: '#hex',
        secondary: '#hex',
        accent: '#hex',
      },
      roster: {
        mode: 'fixed | generated | external-feed | signup',
        teams: ['team names'],
        nounIds: ['optional Noun ids'],
      },
      ruleset: {
        engine: 'nouns-nation-battler | custom',
        season: 'exhibition | cup | bowl | league',
        matchSize: '30v30 or local format',
      },
      feeds: {
        html: 'human page URL',
        json: 'manifest URL',
        latestResult: 'optional result endpoint',
      },
      proof: {
        contact: 'public steward contact',
        note: 'source, signature, or backlink proof',
      },
    },
  },
  blocks: [
    'https://pointcast.xyz/b/0406',
    'https://pointcast.xyz/b/0407',
    'https://pointcast.xyz/b/0408',
    'https://pointcast.xyz/b/0409',
  ],
  caveats: [
    'Federation is v0 strategy, not a moderated submission backend.',
    'Nations remain responsible for their own public identity, feeds, and permissions.',
    'PointCast can index manifests and stage events once the shared envelope is stable.',
  ],
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
