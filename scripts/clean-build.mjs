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
    console.log(`[clean-build] moved dist -> ${stale}`);
  } catch {
    rmSync(dist, { recursive: true, force: true });
  }
}
// Repeated local Astro builds can leave stale prerender chunks.
// The project builds to .dist-build so older local dist/ artifacts never
// block production builds.
rmSync(join(root, '.dist-build'), { recursive: true, force: true });
