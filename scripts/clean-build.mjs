import { existsSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');

// Repeated local Astro builds can leave stale prerender chunks in dist.
if (existsSync(dist)) {
  const stale = join(root, '..', `dist.stale-${Date.now()}`);
  try {
    renameSync(dist, stale);
    // Delete the parked copy too. Leaving it cost ~1.8G per build: 28 of these
    // filled ~48G next to the ~/pc-* worktrees by 2026-09-29.
    rmSync(stale, { recursive: true, force: true });
    console.log(`[clean-build] cleared old dist (${stale})`);
  } catch {
    rmSync(dist, { recursive: true, force: true });
  }
}
