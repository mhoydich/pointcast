/**
 * /explore feature index — auto-built from src/pages/*.astro.
 *
 * Slurps every page file as raw text at build time, extracts `title`
 * and `description` from the frontmatter (regex, not import — we only
 * want the strings, not to compile every page into the explorer chunk),
 * and buckets each one into a category by URL prefix.
 *
 * The categories mirror PointCast's mental geography: drum hub,
 * Nouns Battler, agents, Sing room, channels, blocks, visit log,
 * everything else. The page renders chunky pixel-card tiles; this
 * file is just the data plumbing.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

const RAW_PAGES = import.meta.glob('../pages/*.astro', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface Feature {
  slug: string;       // URL: "/drum-radio"
  title: string;      // human title
  description: string;
  category: string;   // bucket key
  prefix: string;     // first slug segment, e.g. "drum"
  /** Last-commit unix timestamp (seconds). 0 if untracked. */
  mtime: number;
}

/**
 * Read git mtimes for every src/pages/*.astro in one shell call.
 * Format: "<unix>\0<relpath>" pairs, one per line — survives spaces/quotes.
 * Falls back to 0 if git isn't available (e.g. shallow CI without .git).
 */
function readMtimes(): Record<string, number> {
  try {
    const out = execSync(
      'git log --name-only --pretty=format:__COMMIT__%ct -- src/pages/*.astro',
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    );
    const map: Record<string, number> = {};
    let currentTs = 0;
    for (const raw of out.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('__COMMIT__')) {
        currentTs = parseInt(line.slice('__COMMIT__'.length), 10) || 0;
        continue;
      }
      // Only first-seen wins — git log walks newest→oldest, so first hit is latest.
      if (line.startsWith('src/pages/') && line.endsWith('.astro') && !(line in map)) {
        map[line] = currentTs;
      }
    }
    return map;
  } catch {
    return {};
  }
}

const MTIMES = readMtimes();

export interface Category {
  key: string;
  label: string;
  blurb: string;
  match: (slug: string) => boolean;
}

export const CATEGORIES: Category[] = [
  {
    key: 'drum',
    label: 'Drum Hub',
    blurb: 'Tap, sing, broadcast — the noisy room.',
    match: (s) => s === 'drum' || s.startsWith('drum-'),
  },
  {
    key: 'nouns',
    label: 'Nouns Battler',
    blurb: 'Deterministic duels and the agent bench.',
    match: (s) => s === 'battle' || s === 'battle-log' || s === 'battler' || s.startsWith('nouns-') || s === 'arena',
  },
  {
    key: 'agent',
    label: 'Agents',
    blurb: 'Claude, Codex, Manus, and the lanes between.',
    match: (s) =>
      s.startsWith('agent') ||
      s === 'cast' ||
      s === 'codex' ||
      s === 'claude' ||
      s === 'manus' ||
      s === 'cc',
  },
  {
    key: 'sing',
    label: 'Sing & Birthday',
    blurb: 'Polyphonic singing, birthdays, applause.',
    match: (s) => s === 'sing' || s.startsWith('sing-') || s === 'happy-friday' || s === 'birthday',
  },
  {
    key: 'visit',
    label: 'Visit Log',
    blurb: 'Human + agent visits, presence pings.',
    match: (s) => s === 'visit' || s.startsWith('visit-') || s === 'visitors' || s === 'visited' || s === 'inhabited',
  },
  {
    key: 'sprint',
    label: 'Sprints & Briefs',
    blurb: 'What shipped, what was filed, what is next.',
    match: (s) =>
      s === 'sprints' || s === 'sprint' || s === 'briefs' || s === 'changelog' || s === 'queue' || s === 'ping',
  },
  {
    key: 'local',
    label: 'El Segundo & Local',
    blurb: '25-mile radius rooms — courts, areas, civic.',
    match: (s) =>
      s === 'local' ||
      s === 'areas' ||
      s === 'civic' ||
      s === 'breathe-california' ||
      s === 'cannabis' ||
      s === 'court' ||
      s === 'dao',
  },
  {
    key: 'apps',
    label: 'Apps & Connectors',
    blurb: 'Surfaces, apps, and outbound rails.',
    match: (s) => s === 'apps' || s === 'connectors' || s === 'collabs' || s === 'beacon' || s === 'booth',
  },
  {
    key: 'collect',
    label: 'Collect & Drops',
    blurb: 'Editions, drops, treasury, mint surfaces.',
    match: (s) => s === 'collect' || s.startsWith('collect') || s === 'drop' || s === 'drops' || s === 'mint' || s === 'treasury',
  },
];

const FALLBACK: Category = {
  key: 'misc',
  label: 'Other Rooms',
  blurb: 'Everything else — the long tail.',
  match: () => true,
};

function categorize(slug: string): Category {
  return CATEGORIES.find((c) => c.match(slug)) ?? FALLBACK;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  if (t.startsWith('`') && t.endsWith('`')) return t.slice(1, -1);
  return t;
}

function pickConst(source: string, name: string): string | null {
  const re = new RegExp(`(?:const|let)\\s+${name}\\s*(?::[^=]+)?=\\s*([^;\\n]+)`, 'm');
  const m = source.match(re);
  if (!m) return null;
  return unquote(m[1].trim());
}

function slugFromPath(path: string): string {
  const file = path.split('/').pop()!;
  return file.replace(/\.astro$/, '');
}

function frontmatter(raw: string): string {
  const m = raw.match(/^---([\s\S]*?)---/);
  return m ? m[1] : '';
}

function deriveTitleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w.length <= 3 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

const SKIP = new Set(['404', 'index']);

export const FEATURES: Feature[] = Object.entries(RAW_PAGES)
  .map(([path, raw]) => {
    const slug = slugFromPath(path);
    if (SKIP.has(slug)) return null;
    const fm = frontmatter(raw);
    const titleRaw = pickConst(fm, 'title') ?? deriveTitleFromSlug(slug);
    const descRaw = pickConst(fm, 'description') ?? '';
    const cat = categorize(slug);
    const rel = `src/pages/${slug}.astro`;
    return {
      slug: `/${slug}`,
      title: titleRaw.replace(/\s+/g, ' ').trim() || deriveTitleFromSlug(slug),
      description: descRaw.replace(/\s+/g, ' ').trim(),
      category: cat.key,
      prefix: slug.split('-')[0],
      mtime: MTIMES[rel] ?? 0,
    } as Feature;
  })
  .filter((f): f is Feature => f !== null)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export function countByCategory(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of FEATURES) out[f.category] = (out[f.category] ?? 0) + 1;
  return out;
}

/**
 * Pages whose latest commit landed in the last `days` days (default 7).
 * Newest first, capped at `limit`. Returns [] if mtimes are unavailable.
 */
export function recentFeatures(days = 7, limit = 12): Feature[] {
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
  return FEATURES
    .filter((f) => f.mtime > cutoff)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);
}
