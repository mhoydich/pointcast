/**
 * /everything census — every door in town, no exceptions.
 *
 * Sibling to src/lib/explore.ts, which indexes *top-level* pages into
 * curated categories. This module goes deeper: it deep-globs the whole
 * src/pages tree (subdirectory rooms, dynamic routes, machine feeds)
 * so nothing that ships can hide from the index. Build-time only —
 * raw-text glob + regex, nothing here compiles page code.
 *
 * Four kinds of door:
 *   room     — a top-level static page ("/coffee")
 *   district — a static page inside a subdirectory ("/race/front-door")
 *   dynamic  — a parameterized route ("/b/{id}"), with a count when knowable
 *   machine  — a non-HTML surface ("/wire.json", "/llms.txt", "/rss.xml")
 */

import { CHANNELS } from './channels';

const PAGE_SOURCES = import.meta.glob('../pages/**/*.astro', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Endpoint files — we only need their paths and leading doc comment, so
// raw-glob them too. Covers .ts and .js API-route styles.
const ENDPOINT_SOURCES = import.meta.glob(['../pages/**/*.ts', '../pages/**/*.js'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Counting blocks needs no file contents — glob keys are enough.
const BLOCK_FILES = import.meta.glob('../content/blocks/*.json');

export type DoorKind = 'room' | 'district' | 'dynamic' | 'machine';

export interface Door {
  route: string;       // "/coffee", "/race/front-door", "/b/{id}", "/wire.json"
  kind: DoorKind;
  title: string;
  description: string;
  district: string;    // first path segment for grouped display; "" for top-level
  count?: number;      // for dynamic collections when knowable
}

/** Quoted string literals only — expressions ("app.name") and interpolated
 *  templates fall through to null so the caller can use a slug fallback. */
function unquote(s: string): string | null {
  const t = s.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  if (t.startsWith('`') && t.endsWith('`') && !t.includes('${')) return t.slice(1, -1);
  return null;
}

function pickConst(source: string, name: string): string | null {
  const re = new RegExp(`(?:const|let)\\s+${name}\\s*(?::[^=]+)?=\\s*([^;\\n]+)`, 'm');
  const m = source.match(re);
  if (!m) return null;
  return unquote(m[1].trim());
}

function frontmatter(raw: string): string {
  const m = raw.match(/^---([\s\S]*?)---/);
  return m ? m[1] : '';
}

/** First sentence of the file's leading doc comment, for machine doors. */
function leadingDocLine(raw: string): string {
  const m = raw.match(/\/\*\*([\s\S]*?)\*\//);
  if (!m) return '';
  const lines = m[1]
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l && !l.startsWith('@'));
  return (lines[0] ?? '').replace(/\s+/g, ' ').trim();
}

function titleFromSlug(slug: string): string {
  return slug
    .split(/[-/]/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

/** "../pages/race/front-door.astro" → "/race/front-door"; index.astro folds into its directory. */
function routeFromPath(p: string): string {
  let rel = p.replace(/^\.\.\/pages\//, '').replace(/\.astro$/, '');
  if (rel === 'index') return '/';
  rel = rel.replace(/\/index$/, '');
  return `/${rel}`;
}

/** "[id]" → "{id}" for display. */
function displayRoute(route: string): string {
  return route.replace(/\[(\.\.\.)?([^\]]+)\]/g, '{$2}');
}

// Backups, dupes, editor droppings, and 404 — not doors.
function isJunk(p: string): boolean {
  return (
    p.includes('.bak') ||
    / \d+\.astro$/.test(p) ||
    p.endsWith('/404.astro') ||
    p.endsWith('pages/404.astro')
  );
}

// Known dynamic-door counts. "/b/{id}" is the archive itself; "/c/{channel}"
// is fixed by BLOCKS.md law.
function dynamicCount(route: string): number | undefined {
  if (route === '/b/{id}') return Object.keys(BLOCK_FILES).length;
  if (route === '/c/{channel}') return Object.keys(CHANNELS).length;
  return undefined;
}

function buildPageDoors(): Door[] {
  const doors: Door[] = [];
  for (const [path, raw] of Object.entries(PAGE_SOURCES)) {
    if (isJunk(path)) continue;
    // /admin is a service closet, not a town door.
    if (path.startsWith('../pages/admin/')) continue;
    const route = routeFromPath(path);
    if (route === '/') continue;
    const fm = frontmatter(raw);
    const slug = route.slice(1);
    const dynamic = /\[[^\]]+\]/.test(route);
    const inDistrict = slug.includes('/');
    const shown = displayRoute(route);
    doors.push({
      route: shown,
      kind: dynamic ? 'dynamic' : inDistrict ? 'district' : 'room',
      title: (pickConst(fm, 'title') ?? titleFromSlug(displayRoute(slug))).replace(/\s+/g, ' ').trim(),
      description: (pickConst(fm, 'description') ?? '').replace(/\s+/g, ' ').trim(),
      district: inDistrict ? slug.split('/')[0] : '',
      count: dynamic ? dynamicCount(shown) : undefined,
    });
  }
  return doors;
}

/**
 * "../pages/wire.json.ts" → "/wire.json"; "../pages/rss.xml.js" → "/rss.xml".
 * Bare endpoint files ("api/link/spend.ts") route without a fake extension.
 */
function machineRoute(p: string): string {
  const rel = p.replace(/^\.\.\/pages\//, '').replace(/\.(ts|js)$/, '');
  return `/${rel}`;
}

function buildMachineDoors(): Door[] {
  const doors: Door[] = [];
  for (const [path, raw] of Object.entries(ENDPOINT_SOURCES)) {
    if (isJunk(path)) continue;
    if (path.startsWith('../pages/admin/')) continue;
    const route = machineRoute(path);
    const slug = route.slice(1);
    const dynamic = /\[[^\]]+\]/.test(route);
    doors.push({
      route: displayRoute(route),
      kind: 'machine',
      title: displayRoute(slug),
      description: leadingDocLine(raw),
      district: slug.includes('/') ? slug.split('/')[0] : '',
      count: dynamic ? dynamicCount(displayRoute(route)) : undefined,
    });
  }
  return doors;
}

const byRoute = (a: Door, b: Door) => a.route.localeCompare(b.route);

export const DOORS: Door[] = [...buildPageDoors(), ...buildMachineDoors()].sort(byRoute);

export const ROOMS = DOORS.filter((d) => d.kind === 'room');
export const DISTRICT_DOORS = DOORS.filter((d) => d.kind === 'district');
export const DYNAMIC_DOORS = DOORS.filter((d) => d.kind === 'dynamic');
export const MACHINE_DOORS = DOORS.filter((d) => d.kind === 'machine');

/** District name → its static + dynamic doors, for grouped display. */
export function districts(): Map<string, Door[]> {
  const map = new Map<string, Door[]>();
  for (const d of [...DISTRICT_DOORS, ...DYNAMIC_DOORS].sort(byRoute)) {
    const key = d.district || '·';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export const BLOCK_COUNT = Object.keys(BLOCK_FILES).length;
