/**
 * rfcs — build-time reader for docs/rfc/*.md.
 *
 * Each RFC is a markdown file with a front-matter block (key: value pairs
 * before the first ##). The reader globs the directory, parses the header
 * + body, and exposes helpers for both the human index page (/rfc) and
 * the agent manifest (/rfc.json).
 *
 * Same pattern as src/lib/sprint-recap.ts — import.meta.glob so Astro's
 * static pipeline can inline the files at build time without runtime fs.
 *
 * Build-time only. Do not import in client bundles.
 */

/** A parsed RFC. */
export interface Rfc {
  /** URL slug (derived from filename: compute-ledger-v0.md → compute-ledger-v0). */
  slug: string;
  /** Display title (first # heading). */
  title: string;
  /** Subtitle, version, status — pulled from the first bold-heavy paragraph. */
  version: string;
  status: string;
  filedAt: string;
  editors: string;
  canonicalUrl: string;
  license: string;
  contact: string;
  /** Full body markdown (minus the front-matter preamble). */
  body: string;
  /** Summary (first H2 section: abstract). */
  abstract: string;
  /** Raw source for rendering. */
  raw: string;
  /** Word count for stats. */
  wordCount: number;
}

// Globbed at build time: every .md under docs/rfc/.
const RFC_FILES = import.meta.glob('../../docs/rfc/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function extractHeader(raw: string, key: string): string {
  // Lines look like: **Version:** 0.1.0 (working draft)
  const re = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+?)$`, 'mi');
  const m = raw.match(re);
  return m ? m[1].trim() : '';
}

function extractTitle(raw: string): string {
  const m = raw.match(/^#\s+(.+?)$/m);
  return m ? m[1].trim() : 'Untitled RFC';
}

function extractAbstract(raw: string): string {
  // Find the "## Abstract" section and grab the paragraph(s) until the next ##.
  const m = raw.match(/##\s+Abstract\s*\n+([\s\S]+?)(?=\n##\s+|$)/);
  if (!m) return '';
  return m[1].trim();
}

function slugFromPath(path: string): string {
  const filename = path.split('/').pop() || '';
  return filename.replace(/\.md$/, '');
}

function wordCount(s: string): number {
  return s
    .replace(/```[\s\S]+?```/g, '') // strip code blocks
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseOne(path: string, raw: string): Rfc {
  return {
    slug: slugFromPath(path),
    title: extractTitle(raw),
    version: extractHeader(raw, 'Version'),
    status: extractHeader(raw, 'Status'),
    filedAt: extractHeader(raw, 'Filed'),
    editors: extractHeader(raw, 'Editors'),
    canonicalUrl: extractHeader(raw, 'Canonical URL'),
    license: extractHeader(raw, 'License'),
    contact: extractHeader(raw, 'Contact'),
    body: raw,
    abstract: extractAbstract(raw),
    raw,
    wordCount: wordCount(raw),
  };
}

/** List all RFCs, newest filedAt first. */
export function listRfcs(): Rfc[] {
  const rfcs = Object.entries(RFC_FILES).map(([path, raw]) => parseOne(path, raw));
  return rfcs.sort((a, b) => {
    // Crude but works: v0 → v1 → v2 lexicographically by slug.
    // If a filedAt date is parseable, prefer that.
    const ta = Date.parse(a.filedAt);
    const tb = Date.parse(b.filedAt);
    if (!isNaN(ta) && !isNaN(tb)) return tb - ta;
    return b.slug.localeCompare(a.slug);
  });
}

/** Find one RFC by slug, or null. */
export function getRfc(slug: string): Rfc | null {
  return listRfcs().find((r) => r.slug === slug) ?? null;
}
