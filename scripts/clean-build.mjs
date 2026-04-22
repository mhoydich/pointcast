import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// Repeated local Astro builds can leave stale prerender chunks in dist.
rmSync(join(root, 'dist'), { recursive: true, force: true });
