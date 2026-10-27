import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * Last-commit dates for page source files, used for sitemap <lastmod>.
 *
 * Dates come from git history only. In a shallow clone every file would look
 * like it changed at the tip commit, so we return an empty map rather than
 * publish false freshness signals. Layout or component edits do not move a
 * page's date; only edits to the page's own source do.
 */
export function loadPageSourceDates(root = process.cwd()) {
  const dates = new Map();
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    if (git('rev-parse', '--is-shallow-repository').trim() === 'true') return dates;
    let current = '';
    for (const line of git('log', '--name-only', '--format=@@%cI', '--', 'src/pages').split('\n')) {
      if (line.startsWith('@@')) current = line.slice(2);
      else if (line && current && !dates.has(line)) dates.set(line, current); // newest commit first
    }
  } catch {
    dates.clear();
  }
  return dates;
}

/** Map a page pathname to the Date of its source file, or undefined if unknown. */
export function lastmodForPath(pathname, dates, root = process.cwd()) {
  if (!dates.size) return undefined;
  const p = pathname.replace(/^\/|\/$/g, '');
  const candidates = p
    ? [`src/pages/${p}.astro`, `src/pages/${p}/index.astro`, `src/pages/${p}.md`, `src/pages/${p}/index.md`]
    : ['src/pages/index.astro'];
  for (const file of candidates) {
    const iso = dates.get(file);
    if (iso && existsSync(`${root}/${file}`)) return new Date(iso);
  }
  return undefined;
}
