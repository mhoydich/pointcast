#!/usr/bin/env node
/**
 * walk-codex-workspaces.mjs — enumerate all Codex-adjacent workspaces on
 * Mike's Mac + report per-folder stats. Dry-run only, no copying.
 *
 * Context: the Sprint #92 remote-Codex audit surfaced 20+ projects in the
 * Codex desktop app; only one of them (pointcast-collabs-map-prototype)
 * is currently plumbed to the main repo via scripts/sync-codex-workspace.mjs.
 * Extending that bridge requires knowing what's out there — this is the
 * inventory step.
 *
 * Sources scanned:
 *   - ~/Documents/join us yee/            (Codex's main playground)
 *   - ~/Documents/                        (top-level siblings)
 *   - ~/Desktop/                          (one level)
 *
 * Per folder reported:
 *   - path relative to $HOME
 *   - sizeBytes (recursive, excluding node_modules/.git)
 *   - fileCount
 *   - fileTypes (ext → count)
 *   - lastModified (newest mtime in tree)
 *   - hasGit (.git subfolder present)
 *   - staleness ('hot' < 24h, 'warm' < 7d, 'cool' < 30d, 'cold' >= 30d)
 *   - likelyCodexAuthored (heuristic: single-file index.html large OR
 *                           contains "Codex" / "GPT-5" in README)
 *
 * Output: docs/notes/codex-workspace-inventory.json
 *
 * Usage:
 *   node scripts/walk-codex-workspaces.mjs
 *   npm run walk:codex   (after package.json wiring, Sprint #93 T4)
 *
 * Written: 2026-04-21 Sprint #93 T4 per docs/plans/2026-04-21-sprint-93-queue.md.
 */

import { readdir, stat, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const HOME = process.env.HOME || process.env.USERPROFILE || '';
const OUTPUT = join(repoRoot, 'docs', 'notes', 'codex-workspace-inventory.json');

const SCAN_ROOTS = [
  join(HOME, 'Documents', 'join us yee'),
  join(HOME, 'Documents'),  // one level — siblings of join-us-yee
  join(HOME, 'Desktop'),    // only top-level children
];

// Skip patterns — never recurse into these.
const SKIP_DIRS = new Set(['node_modules', '.git', '.DS_Store', '.next', 'dist', '.vite', '.astro', '.cache', '.turbo']);
// Skip noise at the /Documents top level (system folders, not Codex-shaped).
const SKIP_DOC_NAMES = new Set([
  'join us yee',  // handled as its own scan root, don't double-count
]);

const NOW = Date.now();
const MS_DAY = 24 * 60 * 60 * 1000;

async function walkDir(dir, depth = 0, maxDepth = 12) {
  let totalSize = 0;
  let fileCount = 0;
  let newestMtime = 0;
  const fileTypes = {};
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return { totalSize, fileCount, newestMtime, fileTypes }; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    if (e.name.startsWith('.DS_Store')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (depth >= maxDepth) continue;
      const sub = await walkDir(full, depth + 1, maxDepth);
      totalSize += sub.totalSize;
      fileCount += sub.fileCount;
      if (sub.newestMtime > newestMtime) newestMtime = sub.newestMtime;
      for (const [ext, n] of Object.entries(sub.fileTypes)) fileTypes[ext] = (fileTypes[ext] || 0) + n;
    } else if (e.isFile()) {
      try {
        const s = await stat(full);
        totalSize += s.size;
        fileCount += 1;
        if (s.mtimeMs > newestMtime) newestMtime = s.mtimeMs;
        const dot = e.name.lastIndexOf('.');
        const ext = dot >= 0 ? e.name.slice(dot).toLowerCase() : '(no-ext)';
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      } catch { /* skip unreadable */ }
    }
  }
  return { totalSize, fileCount, newestMtime, fileTypes };
}

function staleness(mtime) {
  if (!mtime) return 'unknown';
  const days = (NOW - mtime) / MS_DAY;
  if (days < 1) return 'hot';
  if (days < 7) return 'warm';
  if (days < 30) return 'cool';
  return 'cold';
}

async function hasGit(dir) {
  try { await stat(join(dir, '.git')); return true; }
  catch { return false; }
}

async function readFileSafe(path, max = 2000) {
  try {
    const buf = await readFile(path, 'utf8');
    return buf.slice(0, max);
  } catch { return ''; }
}

async function likelyCodexAuthored(dir) {
  // Heuristics: (a) a single dominant index.html > 20KB (Codex pattern).
  //             (b) README mentions Codex / GPT-5 / OpenAI.
  let heuristic = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const htmls = entries.filter((e) => e.isFile() && e.name.endsWith('.html'));
    if (htmls.length === 1) {
      try {
        const s = await stat(join(dir, htmls[0].name));
        if (s.size > 20000) heuristic.push('large-single-html');
      } catch {}
    }
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (!/readme/i.test(e.name)) continue;
      const body = await readFileSafe(join(dir, e.name));
      if (/codex|gpt-5|openai/i.test(body)) heuristic.push('readme-mentions-codex');
      break;
    }
  } catch {}
  return heuristic;
}

async function scanRoot(root, isTopLevelOnly = false) {
  const results = [];
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); }
  catch { return { root, results, error: 'unreadable' }; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (SKIP_DIRS.has(e.name)) continue;
    if (SKIP_DOC_NAMES.has(e.name) && root === join(HOME, 'Documents')) continue;
    if (e.name.startsWith('.')) continue;
    const full = join(root, e.name);
    const { totalSize, fileCount, newestMtime, fileTypes } = await walkDir(full, 0, isTopLevelOnly ? 2 : 12);
    if (fileCount === 0) continue;
    const git = await hasGit(full);
    const cxHints = await likelyCodexAuthored(full);
    results.push({
      path: relative(HOME, full),
      sizeBytes: totalSize,
      fileCount,
      fileTypes: Object.fromEntries(Object.entries(fileTypes).sort((a, b) => b[1] - a[1]).slice(0, 12)),
      lastModified: newestMtime ? new Date(newestMtime).toISOString() : null,
      staleness: staleness(newestMtime),
      hasGit: git,
      likelyCodexAuthored: cxHints.length > 0 ? cxHints : null,
    });
  }
  results.sort((a, b) => {
    // Hot first, then size descending
    const order = { hot: 0, warm: 1, cool: 2, cold: 3, unknown: 4 };
    const d = order[a.staleness] - order[b.staleness];
    if (d !== 0) return d;
    return b.sizeBytes - a.sizeBytes;
  });
  return { root: relative(HOME, root), results };
}

async function main() {
  if (!HOME) { console.error('✗ $HOME not set'); process.exit(1); }
  const startedAt = new Date().toISOString();
  const scans = [];
  for (const r of SCAN_ROOTS) {
    const isDocs = r === join(HOME, 'Documents');
    const isDesktop = r === join(HOME, 'Desktop');
    scans.push(await scanRoot(r, isDocs || isDesktop));
  }

  const totalFolders = scans.reduce((s, x) => s + (x.results?.length || 0), 0);
  const totalSize = scans.reduce((s, x) => s + (x.results?.reduce((a, r) => a + r.sizeBytes, 0) || 0), 0);
  const hotCount = scans.reduce((s, x) => s + (x.results?.filter((r) => r.staleness === 'hot').length || 0), 0);
  const codexHintCount = scans.reduce((s, x) => s + (x.results?.filter((r) => r.likelyCodexAuthored).length || 0), 0);

  const report = {
    schema: 'codex-workspace-inventory-v0',
    generatedAt: startedAt,
    scannedRoots: SCAN_ROOTS.map((r) => relative(HOME, r)),
    summary: {
      totalFolders,
      totalSizeBytes: totalSize,
      hotFolders: hotCount,
      likelyCodexFolders: codexHintCount,
    },
    scans,
    notes: 'Dry-run. No files copied. Staleness: hot<24h warm<7d cool<30d cold>=30d. likelyCodexAuthored is a heuristic (single large HTML OR readme mentions Codex/GPT-5/OpenAI). Sync candidates = staleness in [hot, warm] + likelyCodexAuthored non-null. See scripts/sync-codex-workspace.mjs for the plumbing target.',
  };

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + '\n');

  console.log(`Codex workspace inventory · walk complete`);
  console.log(`  scanned roots: ${SCAN_ROOTS.length}`);
  console.log(`  total folders: ${totalFolders}`);
  console.log(`  total size: ${(totalSize / (1024 * 1024)).toFixed(1)} MB`);
  console.log(`  hot (<24h): ${hotCount}`);
  console.log(`  codex-hint: ${codexHintCount}`);
  console.log(`✓ output: ${OUTPUT}`);
}

main().catch((err) => {
  console.error('✗ walk failed:', err);
  process.exit(1);
});
