import { existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, extname, join, relative } from 'node:path';
import { STATIONS } from './local';

const SOURCE_ROOT = findProjectRoot();
const PUBLIC_ROOT = join(SOURCE_ROOT, 'public');

const PUBLIC_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.jpg',
  '.jpeg',
  '.js',
  '.json',
  '.png',
  '.svg',
  '.webp',
]);

export type TvAssetKind = 'image' | 'vector' | 'surface' | 'script' | 'style' | 'data';

export type TvAssetGroupId =
  | 'arena'
  | 'games'
  | 'og-blocks'
  | 'og-pages'
  | 'rooms'
  | 'product-art'
  | 'token-art'
  | 'site-art'
  | 'support';

export type TvAssetGroup = {
  id: TvAssetGroupId;
  label: string;
  eyebrow: string;
  accent: string;
  short: string;
};

export type TvAsset = {
  title: string;
  href: string;
  publicPath: string;
  extension: string;
  kind: TvAssetKind;
  group: TvAssetGroupId;
  previewable: boolean;
};

export type TvNavLink = {
  label: string;
  href: string;
  eyebrow: string;
  body: string;
  accent: string;
  external?: boolean;
};

export type TvSourceRun = {
  label: string;
  sourcePath: string;
  body: string;
  count: number;
  accent: string;
};

export const TV_ASSET_GROUPS: TvAssetGroup[] = [
  {
    id: 'arena',
    label: 'Arena Graphics',
    eyebrow: 'collabs',
    accent: '#1f7a5b',
    short: 'Agent arena, relay, bracket, control-room, trophy, and campaign frames.',
  },
  {
    id: 'games',
    label: 'Game Builds',
    eyebrow: 'play',
    accent: '#185fa5',
    short: 'Static game bundles, embeds, scripts, styles, and noun sprites.',
  },
  {
    id: 'og-blocks',
    label: 'Block OG Cards',
    eyebrow: 'share',
    accent: '#8a2432',
    short: 'Per-block Open Graph image cards generated for broadcasts and sharing.',
  },
  {
    id: 'og-pages',
    label: 'Page OG Cards',
    eyebrow: 'share',
    accent: '#6652a3',
    short: 'Route-level Open Graph cards for the major PointCast surfaces.',
  },
  {
    id: 'rooms',
    label: 'Rooms',
    eyebrow: 'ambient',
    accent: '#0f766e',
    short: 'Listening-room, Gandalf, houseplant, relay, and quiet-mode art.',
  },
  {
    id: 'product-art',
    label: 'Product Art',
    eyebrow: 'objects',
    accent: '#b45309',
    short: 'Nouns Cola, paddle, and other product-style visual material.',
  },
  {
    id: 'token-art',
    label: 'Token Art',
    eyebrow: 'collect',
    accent: '#3f6212',
    short: 'Published token images and edition art.',
  },
  {
    id: 'site-art',
    label: 'Site Art',
    eyebrow: 'identity',
    accent: '#111827',
    short: 'Favicons, home cards, static post pages, and visual identity pieces.',
  },
  {
    id: 'support',
    label: 'Support Files',
    eyebrow: 'bundle',
    accent: '#475569',
    short: 'Manifest, JSON, CSS, and script files that keep the surfaces portable.',
  },
];

export const TV_PRIMARY_NAV: TvNavLink[] = [
  {
    label: 'On Air',
    href: '/tv',
    eyebrow: 'live',
    body: 'The full-screen broadcast with daily drop, recent blocks, polls, presence, and ticker.',
    accent: '#f59f00',
  },
  {
    label: 'Today',
    href: '/today',
    eyebrow: 'daily',
    body: 'The day-specific drop and ritual surface that feeds the first TV slide.',
    accent: '#8a2432',
  },
  {
    label: 'Here',
    href: '/here',
    eyebrow: 'presence',
    body: 'Live congregation view in the same noun-constellation language as TV.',
    accent: '#1f7a5b',
  },
  {
    label: 'Local',
    href: '/local',
    eyebrow: 'stations',
    body: 'The 100-mile lens and source layer for station geography.',
    accent: '#185fa5',
  },
  {
    label: 'Listening Room',
    href: '/listening-room',
    eyebrow: 'ambient',
    body: 'A quiet generated room with an image asset and JSON mirror.',
    accent: '#6652a3',
  },
  {
    label: 'TV JSON',
    href: '/tv/assets.json',
    eyebrow: 'manifest',
    body: 'Machine-readable inventory of surfaces, stations, published assets, and source runs.',
    accent: '#111827',
  },
];

export const TV_SURFACE_NAV: TvNavLink[] = [
  {
    label: 'Tag Signal',
    href: '/tag-signal',
    eyebrow: 'game page',
    body: 'PointCast game wrapper for the embeddable tag surface.',
    accent: '#185fa5',
  },
  {
    label: 'Tag Full Screen',
    href: '/games/tag-signal/',
    eyebrow: 'static',
    body: 'Portable game build with embed demo and widget script.',
    accent: '#1f7a5b',
  },
  {
    label: 'Nouns Nation Battler',
    href: '/nouns-nation-battler/',
    eyebrow: 'game page',
    body: 'Battle-card page tied to the generated Nouns asset pack.',
    accent: '#8a2432',
  },
  {
    label: 'Battler Full Screen',
    href: '/games/nouns-nation-battler/',
    eyebrow: 'static',
    body: 'Portable battler build with sixty noun sprites and a manifest.',
    accent: '#6652a3',
  },
  {
    label: 'Nouns Open Circuit',
    href: '/nouns-open-circuit',
    eyebrow: 'league desk',
    body: 'Rival agent-operated Nouns league surface with tactics packets and receipt previews.',
    accent: '#2f8f5f',
  },
  {
    label: 'Noun Pickleball',
    href: '/games/noun-pickleball/',
    eyebrow: 'static',
    body: 'Standalone doubles game with local noun player art.',
    accent: '#b45309',
  },
  {
    label: 'Sitting With Gandalf',
    href: '/sitting-with-gandalf/',
    eyebrow: 'room',
    body: 'Companion flow with generated wizard-study art.',
    accent: '#0f766e',
  },
  {
    label: 'Collab Arena',
    href: '/collabs/arena/',
    eyebrow: 'static',
    body: 'Static arena presentation backed by forty generated graphics.',
    accent: '#3f6212',
  },
  {
    label: 'Collab Relay',
    href: '/collabs/relay/',
    eyebrow: 'static',
    body: 'Relay prototype surface for the collab map and broadcast pitch.',
    accent: '#475569',
  },
];

export const TV_SOURCE_RUNS: TvSourceRun[] = [
  {
    label: 'PointCast Ads v2',
    sourcePath: 'designs/ads-v2',
    body: 'Square, story, banner, sticker, wallpaper, and contact-sheet export set.',
    count: countFiles('designs/ads-v2', ['.md', '.png', '.txt']),
    accent: '#8a2432',
  },
  {
    label: 'Pitch Deck Screens',
    sourcePath: 'designs/deck',
    body: 'Deck-stage HTML, noun source art, and rendered slide checks.',
    count: countFiles('designs/deck', ['.html', '.js', '.png', '.svg']),
    accent: '#185fa5',
  },
  {
    label: 'Nouns Cola Print Ads',
    sourcePath: 'designs/nouns-cola-print-ads-10',
    body: 'Ten print-ad SVG/PNG outputs, contact sheets, build script, and manifest.',
    count: countFiles('designs/nouns-cola-print-ads-10', ['.json', '.md', '.mjs', '.png', '.svg']),
    accent: '#b45309',
  },
  {
    label: 'Poster Sprints',
    sourcePath: 'designs/poster-sprints',
    body: 'Poster viewer, deck exports, gallery screenshots, and sprint source data.',
    count: countFiles('designs/poster-sprints', ['.css', '.html', '.js', '.json', '.md', '.mjs', '.png', '.pptx', '.svg']),
    accent: '#1f7a5b',
  },
  {
    label: 'Paddle Renders',
    sourcePath: 'designs/paddle',
    body: 'PaddleBlock render references and final export notes.',
    count: countFiles('designs/paddle', ['.md', '.png']),
    accent: '#6652a3',
  },
  {
    label: 'TV Briefs',
    sourcePath: 'docs/sprints',
    body: 'Broadcast, stations, live-poll, daily-drop, and presence implementation notes.',
    count: countFiles('docs/sprints', ['.md']),
    accent: '#111827',
  },
];

export const TV_STATION_NAV = STATIONS.map((station, index) => ({
  label: station.name,
  href: `/tv/${station.slug}`,
  eyebrow: `${index + 1}`.padStart(2, '0'),
  body: `${station.miles} mi ${station.direction} - ${station.blurb}`,
  accent: index % 3 === 0 ? '#185fa5' : index % 3 === 1 ? '#1f7a5b' : '#8a2432',
}));

export function getTvAssetInventory() {
  const files = walk(PUBLIC_ROOT)
    .map((filePath) => normalizePath(relative(PUBLIC_ROOT, filePath)))
    .filter((publicPath) => {
      const extension = extname(publicPath).toLowerCase();
      return PUBLIC_EXTENSIONS.has(extension);
    })
    .map(toAsset)
    .sort((a, b) => {
      const groupOrder = groupIndex(a.group) - groupIndex(b.group);
      return groupOrder || a.publicPath.localeCompare(b.publicPath);
    });

  const groups = TV_ASSET_GROUPS.map((group) => ({
    ...group,
    count: files.filter((asset) => asset.group === group.id).length,
    previewCount: files.filter((asset) => asset.group === group.id && asset.previewable).length,
  }));

  return {
    assets: files,
    groups,
    totals: {
      all: files.length,
      previewable: files.filter((asset) => asset.previewable).length,
      sourceRuns: TV_SOURCE_RUNS.reduce((sum, run) => sum + run.count, 0),
      stations: TV_STATION_NAV.length,
      surfaces: TV_PRIMARY_NAV.length + TV_SURFACE_NAV.length,
    },
  };
}

function findProjectRoot() {
  const starts = [dirname(fileURLToPath(import.meta.url)), process.cwd()];

  for (const start of starts) {
    let dir = start;

    while (true) {
      if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'public'))) {
        return dir;
      }

      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  return process.cwd();
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return walk(fullPath);
    if (stats.isFile()) return [fullPath];
    return [];
  });
}

function countFiles(pathFromRoot: string, extensions: string[]) {
  const root = join(SOURCE_ROOT, pathFromRoot);
  const allowed = new Set(extensions);
  return walk(root).filter((filePath) => allowed.has(extname(filePath).toLowerCase())).length;
}

function toAsset(publicPath: string): TvAsset {
  const extension = extname(publicPath).toLowerCase();
  const kind = getKind(extension);

  return {
    title: titleFromPath(publicPath),
    href: `/${publicPath}`,
    publicPath,
    extension: extension.replace('.', ''),
    kind,
    group: groupForPath(publicPath, kind),
    previewable: kind === 'image' || kind === 'vector',
  };
}

function getKind(extension: string): TvAssetKind {
  if (extension === '.png' || extension === '.jpg' || extension === '.jpeg' || extension === '.webp') return 'image';
  if (extension === '.svg') return 'vector';
  if (extension === '.html') return 'surface';
  if (extension === '.js') return 'script';
  if (extension === '.css') return 'style';
  return 'data';
}

function groupForPath(publicPath: string, kind: TvAssetKind): TvAssetGroupId {
  if (publicPath.startsWith('collabs/arena/graphics/')) return 'arena';
  if (publicPath.startsWith('games/')) return 'games';
  if (publicPath.startsWith('images/og/b/')) return 'og-blocks';
  if (publicPath.startsWith('images/og/') || publicPath.startsWith('images/og-')) return 'og-pages';
  if (
    publicPath.startsWith('images/listening-room/') ||
    publicPath.startsWith('images/houseplants/') ||
    publicPath.startsWith('sitting-with-gandalf/') ||
    publicPath === 'images/relay-super-map.png'
  ) {
    return 'rooms';
  }
  if (
    publicPath.startsWith('images/nouns-cola/') ||
    publicPath.startsWith('images/nouns-cola-crush/') ||
    publicPath.startsWith('images/paddle')
  ) {
    return 'product-art';
  }
  if (publicPath.startsWith('images/tokens/')) return 'token-art';
  if (kind === 'script' || kind === 'style' || kind === 'data') return 'support';
  return 'site-art';
}

function groupIndex(group: TvAssetGroupId) {
  return TV_ASSET_GROUPS.findIndex((item) => item.id === group);
}

function titleFromPath(publicPath: string) {
  const name = basename(publicPath, extname(publicPath));
  return name
    .replace(/^\d+-/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\bog\b/i, 'OG')
    .replace(/\btv\b/i, 'TV')
    .replace(/\bjson\b/i, 'JSON')
    .replace(/\bcss\b/i, 'CSS')
    .replace(/\bjs\b/i, 'JS');
}

function normalizePath(path: string) {
  return path.split('\\').join('/');
}
