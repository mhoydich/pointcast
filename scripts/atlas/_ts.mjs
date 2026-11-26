// PointCast-only helper: load TypeScript data modules (src/data/*.ts, src/lib/*.ts) from a plain Node
// build script by borrowing Vite's SSR loader, the same way tests/*mcp*.test.mjs do. Files named with
// a leading underscore are not layer adapters; build.mjs skips them.
import { resolve } from 'node:path';

let serverPromise = null;
async function server() {
  if (!serverPromise) {
    serverPromise = import('vite').then(({ createServer }) => createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/atlas-build-cache', server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } }));
  }
  return serverPromise;
}

/** Load a TS/JS module by repo-relative path, e.g. loadTs('src/data/small-shrines.ts'). */
export async function loadTs(repoRelativePath) {
  const s = await server();
  return s.ssrLoadModule(`/${repoRelativePath.replace(/^\/+/, '')}`);
}

/** Close the loader when the build is done (build.mjs calls this if it exists). */
export async function closeTs() {
  if (serverPromise) { const s = await serverPromise; await s.close(); serverPromise = null; }
}

export const repoPath = (p) => resolve(process.cwd(), p);
