/**
 * sprint-recap — read + parse the docs/sprints/*.md recap log at build time.
 *
 * Each sprint cron tick (or chat tick) appends a recap file to
 * docs/sprints/. Format documented in docs/sprints/README.md.
 *
 * Uses Astro/Vite's `import.meta.glob` so the recap file contents get
 * inlined into the bundle at build time. Tried `process.cwd()` and
 * `import.meta.url` first; both lose their bearings in Astro's static
 * pipeline because the lib file gets bundled into an opaque location.
 * `import.meta.glob` is the canonical Astro pattern for "read N files
 * from a known directory at build time".
 *
 * Build-time only — do not import in client bundles.
 */

export interface SprintRecap {
  fileSlug: string;
  sprintId: string;
  firedAt: string;
  trigger?: 'cron' | 'chat' | 'ping' | 'queue';
  durationMin?: number;
  shippedAs?: string;
  status?: 'complete' | 'partial' | 'aborted' | 'pending-deploy';
  title: string;
  sections: Record<string, string>;
}

// Globbed at build time: every .md under docs/sprints/. README is filtered out
// in the parse step so the convention "drop a file, it shows up next build"
// stays intact. Path is relative to THIS file (src/lib/sprint-recap.ts).
const RECAP_FILES = import.meta.glob('../../docs/sprints/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1];
    let v: string | number = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
    out[k] = v;
  }
  return out;
}

function parseSections(body: string): { title: string; sections: Record<string, string> } {
  const sections: Record<string, string> = {};
  let title = '';
  let currentKey: string | null = null;
  let buffer: string[] = [];

  function flush() {
    if (currentKey !== null) sections[currentKey] = buffer.join('\n').trim();
    buffer = [];
  }

  for (const line of body.split('\n')) {
    const h1 = line.match(/^#\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    if (h1 && !title) {
      title = h1[1].trim();
      continue;
    }
    if (h2) {
      flush();
      currentKey = h2[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      continue;
    }
    buffer.push(line);
  }
  flush();
  return { title, sections };
}

export function readAllRecaps(): SprintRecap[] {
  const recaps: SprintRecap[] = [];
  for (const [path, raw] of Object.entries(RECAP_FILES)) {
    const fileSlug = path.split('/').pop()!.replace(/\.md$/, '');
    if (fileSlug === 'README') continue;

    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let frontmatter: Record<string, string | number> = {};
    let body = raw;
    if (fmMatch) {
      frontmatter = parseFrontmatter(fmMatch[1]);
      body = fmMatch[2];
    }
    const { title, sections } = parseSections(body);
    recaps.push({
      fileSlug,
      sprintId: String(frontmatter.sprintId ?? fileSlug),
      firedAt: String(frontmatter.firedAt ?? ''),
      trigger: (frontmatter.trigger as any) ?? undefined,
      durationMin: typeof frontmatter.durationMin === 'number' ? frontmatter.durationMin : undefined,
      shippedAs: frontmatter.shippedAs ? String(frontmatter.shippedAs) : undefined,
      status: (frontmatter.status as any) ?? undefined,
      title: title || String(frontmatter.sprintId ?? fileSlug),
      sections,
    });
  }
  recaps.sort((a, b) => b.firedAt.localeCompare(a.firedAt));
  return recaps;
}

export function summary(recaps: SprintRecap[]) {
  const totalMin = recaps.reduce((s, r) => s + (r.durationMin || 0), 0);
  const byTrigger: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const r of recaps) {
    if (r.trigger) byTrigger[r.trigger] = (byTrigger[r.trigger] || 0) + 1;
    if (r.status) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }
  return {
    count: recaps.length,
    totalMin,
    totalHours: Math.round((totalMin / 60) * 10) / 10,
    byTrigger,
    byStatus,
    oldest: recaps.length ? recaps[recaps.length - 1].firedAt : null,
    newest: recaps.length ? recaps[0].firedAt : null,
  };
}
