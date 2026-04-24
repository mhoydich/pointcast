/**
 * research — build-time reader for docs/research/*.md.
 *
 * Research memos live under docs/research/. Each is a markdown file
 * with a bold-key header block (Filed by, Trigger, Purpose) at the top
 * before the first ##. Same reader pattern as src/lib/rfcs.ts.
 *
 * Build-time only. Do not import in client bundles.
 */

export interface ResearchMemo {
  /** URL slug derived from filename: 2026-04-21-where-we-are.md → 2026-04-21-where-we-are. */
  slug: string;
  /** Display title (first # heading). */
  title: string;
  /** Filed-by line text (e.g. "cc, 2026-04-21 ~13:15 PT"). */
  filedBy: string;
  /** Short date extracted from filename, for sorting (YYYY-MM-DD). */
  filedDate: string;
  /** Trigger quote. */
  trigger: string;
  /** Purpose line. */
  purpose: string;
  /** First paragraph after the header block — used as the list-view dek. */
  summary: string;
  /** Full markdown body. */
  body: string;
  /** Word count. */
  wordCount: number;
}

const FILES = import.meta.glob('../../docs/research/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function extractBold(raw: string, key: string): string {
  const re = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+?)$`, 'mi');
  const m = raw.match(re);
  return m ? m[1].trim() : '';
}

function extractTitle(raw: string): string {
  const m = raw.match(/^#\s+(.+?)$/m);
  return m ? m[1].trim() : 'Untitled research memo';
}

function extractSummary(raw: string): string {
  // First paragraph after the bold-key block. Heuristic: find the first line
  // after the first `##` heading that isn't empty and isn't bold-keyed.
  const afterFirstH2 = raw.split(/\n##\s+/).slice(1, 2).join('\n');
  if (!afterFirstH2) return '';
  const lines = afterFirstH2.split('\n');
  // Skip the section title line we'd have captured the "##" for.
  let start = 1;
  while (start < lines.length && lines[start].trim() === '') start++;
  const para: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) break;
    if (line.startsWith('**') && line.endsWith(':')) continue;
    para.push(line);
  }
  return para.join(' ').slice(0, 400);
}

function slugFromPath(path: string): string {
  return (path.split('/').pop() || '').replace(/\.md$/, '');
}

function dateFromSlug(slug: string): string {
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function wordCount(s: string): number {
  return s
    .replace(/```[\s\S]+?```/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseOne(path: string, raw: string): ResearchMemo {
  const slug = slugFromPath(path);
  return {
    slug,
    title: extractTitle(raw),
    filedBy: extractBold(raw, 'Filed by'),
    filedDate: dateFromSlug(slug),
    trigger: extractBold(raw, 'Trigger'),
    purpose: extractBold(raw, 'Purpose'),
    summary: extractSummary(raw),
    body: raw,
    wordCount: wordCount(raw),
  };
}

export function listMemos(): ResearchMemo[] {
  const memos = Object.entries(FILES).map(([p, raw]) => parseOne(p, raw));
  return memos.sort((a, b) => b.filedDate.localeCompare(a.filedDate));
}

export function getMemo(slug: string): ResearchMemo | null {
  return listMemos().find((m) => m.slug === slug) ?? null;
}
