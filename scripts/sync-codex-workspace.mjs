#!/usr/bin/env node
/**
 * sync-codex-workspace.mjs — pull Codex's prototype work from its personal
 * workspace into the main PointCast repo under a dedicated /lab/ surface.
 *
 * Context: Codex (the OpenAI desktop agent) writes to a personal workspace
 * at ~/Documents/join us yee/ rather than to the main pointcast repo. For
 * most main-repo work it operates in /Users/michaelhoydich/pointcast/
 * directly, but experimental prototypes land in the Documents workspace
 * and never reach GitHub or the live site. This script closes that gap.
 *
 * Policy:
 *   - Source: ~/Documents/join us yee/pointcast-collabs-map-prototype/
 *   - Target: <repo>/public/lab/
 *   - Only sync `.html` / `.json` / `.css` / `.js` / `.md` in collabs/*
 *   - Never touch files that already exist in target with a newer mtime
 *     UNLESS --force is passed (protects cc edits from being stomped)
 *   - Default dry-run — pass --apply to actually write
 *   - Manifest is emitted to docs/notes/codex-sync-manifest.json with
 *     every sync so the ledger can attribute Codex for synced files
 *
 * Usage:
 *   node scripts/sync-codex-workspace.mjs          # dry run
 *   node scripts/sync-codex-workspace.mjs --apply  # writes files
 *   node scripts/sync-codex-workspace.mjs --apply --force  # overwrites
 *
 * Written: 2026-04-21 Sprint #92 follow-up after the remote-Codex audit
 * surfaced a workspace-to-repo sync gap. Paired with block 0377 editorial.
 */

import { readdir, copyFile, mkdir, stat, writeFile, readFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

// Configure source + target. Use HOME-relative path so it works if the
// repo is cloned somewhere else.
const HOME = process.env.HOME || process.env.USERPROFILE || '';
const SOURCE = join(HOME, 'Documents', 'join us yee', 'pointcast-collabs-map-prototype', 'collabs');
const TARGET = join(repoRoot, 'public', 'lab');
const MANIFEST = join(repoRoot, 'docs', 'notes', 'codex-sync-manifest.json');

const EXTS = new Set(['.html', '.json', '.css', '.js', '.mjs', '.md', '.svg']);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.DS_Store']);

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const force = args.has('--force');

async function* walk(dir, base = dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full, base);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      const ext = dot >= 0 ? entry.name.slice(dot).toLowerCase() : '';
      if (!EXTS.has(ext)) continue;
      const rel = relative(base, full);
      yield { full, rel };
    }
  }
}

async function main() {
  const sourceExists = await stat(SOURCE).catch(() => null);
  if (!sourceExists) {
    console.error(`✗ source does not exist: ${SOURCE}`);
    console.error(`  (expected Codex's workspace — set HOME correctly or adjust the SOURCE constant)`);
    process.exit(1);
  }

  const toCopy = [];
  const skippedNewer = [];

  for await (const { full, rel } of walk(SOURCE)) {
    const targetPath = join(TARGET, rel);
    const srcStat = await stat(full).catch(() => null);
    const dstStat = await stat(targetPath).catch(() => null);

    if (!srcStat) continue;

    if (dstStat && !force) {
      // Skip if target is newer — protects cc/Mike edits.
      if (dstStat.mtimeMs >= srcStat.mtimeMs) {
        skippedNewer.push({ rel, targetMtime: dstStat.mtime, sourceMtime: srcStat.mtime });
        continue;
      }
    }

    toCopy.push({ full, rel, targetPath, size: srcStat.size });
  }

  console.log(`Codex workspace sync · ${apply ? 'APPLY' : 'dry-run'}${force ? ' --force' : ''}`);
  console.log(`  source: ${SOURCE}`);
  console.log(`  target: ${TARGET}`);
  console.log(`  files to copy: ${toCopy.length}`);
  console.log(`  skipped (target newer): ${skippedNewer.length}`);

  if (!apply) {
    for (const f of toCopy.slice(0, 20)) console.log(`  + ${f.rel} (${f.size}b)`);
    if (toCopy.length > 20) console.log(`  ... ${toCopy.length - 20} more`);
    console.log('  (pass --apply to actually copy)');
    return;
  }

  let copied = 0;
  for (const f of toCopy) {
    await mkdir(dirname(f.targetPath), { recursive: true });
    await copyFile(f.full, f.targetPath);
    copied += 1;
  }

  await mkdir(dirname(MANIFEST), { recursive: true });
  const manifestData = {
    syncedAt: new Date().toISOString(),
    source: SOURCE,
    target: TARGET,
    filesSynced: toCopy.map((f) => f.rel),
    skippedNewer: skippedNewer.map((s) => s.rel),
    notes: 'Auto-sync from Codex personal workspace to main repo /public/lab/. Attribute Codex in compute ledger.',
  };
  await writeFile(MANIFEST, JSON.stringify(manifestData, null, 2) + '\n');

  console.log(`✓ copied ${copied} file(s)`);
  console.log(`✓ manifest: ${MANIFEST}`);

  // Sprint #93 T3 — auto-ledger: append a Codex-attributed entry to the
  // compute ledger so the sync files its own paperwork. One entry per apply
  // run, at top of the array, summarizing what was synced.
  if (copied > 0) {
    await appendLedgerEntry(manifestData, copied);
  } else {
    console.log('  (no files copied; skipping ledger entry)');
  }
}

/**
 * Append a Codex-attributed ledger entry to src/lib/compute-ledger.ts for
 * the files we just synced. Inserts immediately after the opening
 * `export const COMPUTE_LEDGER: ComputeEntry[] = [` line, so the new entry
 * is at the top of the chronological list.
 *
 * Idempotence: each entry has a unique ISO timestamp. Running the sync
 * twice in quick succession just creates two entries — not a concern.
 */
async function appendLedgerEntry(manifest, copiedCount) {
  const ledgerPath = join(repoRoot, 'src', 'lib', 'compute-ledger.ts');
  const raw = await readFile(ledgerPath, 'utf8');
  const marker = 'export const COMPUTE_LEDGER: ComputeEntry[] = [';
  const idx = raw.indexOf(marker);
  if (idx < 0) {
    console.warn('  ! could not find COMPUTE_LEDGER marker; skipping ledger entry');
    return;
  }
  const insertPos = idx + marker.length;
  const when = manifest.syncedAt;
  const fileList = manifest.filesSynced.slice(0, 4).join(', ') + (manifest.filesSynced.length > 4 ? `, +${manifest.filesSynced.length - 4} more` : '');
  const noteBody = `Auto-ledger from scripts/sync-codex-workspace.mjs · ${copiedCount} file(s) synced from Codex workspace to public/lab/: ${fileList}. Manifest: docs/notes/codex-sync-manifest.json.`;
  const entry = `
  // ---- Codex workspace auto-sync · ${when} ----
  {
    at: '${when}',
    collab: 'codex',
    kind: 'ops',
    title: 'Codex workspace sync · ${copiedCount} file(s) pulled into /public/lab/',
    artifact: '/lab',
    signature: 'shy',
    notes: ${JSON.stringify(noteBody)},
  },`;
  const updated = raw.slice(0, insertPos) + entry + raw.slice(insertPos);
  await writeFile(ledgerPath, updated);
  console.log(`✓ ledger entry appended · collab: codex · ${when}`);
}

main().catch((err) => {
  console.error('✗ sync failed:', err);
  process.exit(1);
});
