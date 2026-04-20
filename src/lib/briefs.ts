/**
 * briefs — read docs/briefs/*.md at build time.
 *
 * Unlike docs/sprints/ which uses YAML frontmatter, briefs are free-form
 * markdown. We infer the assignee from the filename (codex vs. manus),
 * pull the first H1 as title, count "## Task" headers as task count, and
 * extract a one-line summary from the lede paragraph.
 *
 * Agents don't have write-back; Mike (or the agent via chat) can edit the
 * file to add a "status: complete" marker line anywhere in the body. We
 * pick that up as a single-glance done/not-done signal.
 */

export type BriefAssignee = 'codex' | 'manus' | 'cc' | 'mixed';

export interface Brief {
  fileSlug: string;
  path: string;
  assignee: BriefAssignee;
  title: string;
  /** One-line summary from the first non-heading, non-meta paragraph. */
  lede: string;
  /** Count of `## Task` or `## Task N —` headers. */
  taskCount: number;
  /** Extracted date from the filename (YYYY-MM-DD). */
  date: string | null;
  /** Body contains "status: complete" marker anywhere. */
  complete: boolean;
}

const BRIEF_FILES = import.meta.glob('../../docs/briefs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function assigneeFromFilename(slug: string): BriefAssignee {
  const s = slug.toLowerCase();
  if (s.includes('codex') && s.includes('manus')) return 'mixed';
  if (s.includes('codex')) return 'codex';
  if (s.includes('manus')) return 'manus';
  return 'cc';
}

function extractDate(slug: string): string | null {
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function extractTitle(body: string, fallback: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function extractLede(body: string): string {
  // Find the first paragraph that isn't a heading or a bold "**Audience:**"-style meta.
  const lines = body.split('\n');
  let inMeta = true;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('#')) continue;
    if (t.startsWith('**') && t.endsWith('**')) continue;
    if (t.startsWith('**') && t.includes(':')) continue;  // "**Audience:** Codex..."
    // Clean: strip markdown, keep first ~220 chars.
    const clean = t
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return clean.length > 220 ? clean.slice(0, 220).trim() + '…' : clean;
  }
  return '';
}

function countTasks(body: string): number {
  const matches = body.match(/^##\s+Task/gim);
  return matches ? matches.length : 0;
}

export function readAllBriefs(): Brief[] {
  const out: Brief[] = [];
  for (const [path, raw] of Object.entries(BRIEF_FILES)) {
    const fileSlug = path.split('/').pop()!.replace(/\.md$/, '');
    if (fileSlug === 'README') continue;
    out.push({
      fileSlug,
      path: `docs/briefs/${fileSlug}.md`,
      assignee: assigneeFromFilename(fileSlug),
      title: extractTitle(raw, fileSlug),
      lede: extractLede(raw),
      taskCount: countTasks(raw),
      date: extractDate(fileSlug),
      complete: /status:\s*complete/i.test(raw),
    });
  }
  out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return out;
}

export function briefsSummary(briefs: Brief[]) {
  const byAssignee: Record<BriefAssignee, number> = { codex: 0, manus: 0, cc: 0, mixed: 0 };
  let tasks = 0;
  let complete = 0;
  for (const b of briefs) {
    byAssignee[b.assignee] += 1;
    tasks += b.taskCount;
    if (b.complete) complete += 1;
  }
  return {
    total: briefs.length,
    byAssignee,
    totalTasks: tasks,
    complete,
  };
}
