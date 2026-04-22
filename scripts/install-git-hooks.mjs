#!/usr/bin/env node
/**
 * install-git-hooks.mjs — copy repo-tracked git hooks from scripts/git-hooks/
 * into .git/hooks/ so they run on git commit.
 *
 * Why: .git/hooks/ is outside the repo (it's per-clone state). Checking hooks
 * into the repo at scripts/git-hooks/ + installing on demand gives everyone
 * the same hook logic without requiring a framework like husky.
 *
 * Idempotent: if a hook file already exists and is byte-identical, skip.
 * If it exists but differs, print a diff-ish summary and back it up to
 * .git/hooks/{name}.backup-{timestamp} before overwriting.
 *
 * Sprint #94 T2 — block 0388 follow-up #2. Shipped 2026-04-21.
 *
 * Usage:
 *   node scripts/install-git-hooks.mjs       # install
 *   npm run install:hooks                    # same
 */

import { readdir, readFile, writeFile, stat, chmod, mkdir, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const SOURCE_DIR = join(repoRoot, 'scripts', 'git-hooks');
const TARGET_DIR = join(repoRoot, '.git', 'hooks');

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function main() {
  if (!(await exists(join(repoRoot, '.git')))) {
    console.error('✗ .git/ not found in', repoRoot, '— are you in the right repo?');
    process.exit(1);
  }
  if (!(await exists(TARGET_DIR))) {
    await mkdir(TARGET_DIR, { recursive: true });
  }

  const hooks = (await readdir(SOURCE_DIR)).filter((f) => !f.startsWith('.') && !f.endsWith('.md'));
  if (hooks.length === 0) {
    console.log('no hook files in', SOURCE_DIR);
    return;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let installed = 0, skipped = 0, backedUp = 0;

  for (const name of hooks) {
    const src = join(SOURCE_DIR, name);
    const dst = join(TARGET_DIR, name);
    const srcBody = await readFile(src);
    if (await exists(dst)) {
      const dstBody = await readFile(dst);
      if (dstBody.equals(srcBody)) {
        console.log(`  = ${name} (identical)`);
        skipped += 1;
        continue;
      }
      const backup = `${dst}.backup-${ts}`;
      await copyFile(dst, backup);
      console.log(`  ! ${name} differed — backed up to ${backup}`);
      backedUp += 1;
    }
    await writeFile(dst, srcBody);
    // Ensure executable (match source permissions best-effort).
    await chmod(dst, 0o755);
    installed += 1;
    console.log(`  + ${name} installed`);
  }

  console.log(`\n✓ install complete · installed=${installed} skipped=${skipped} backedUp=${backedUp}`);
  console.log(`  hooks live at: ${TARGET_DIR}`);
  console.log(`  to uninstall: rm ${TARGET_DIR}/{prepare-commit-msg,…}`);
}

main().catch((err) => {
  console.error('✗ install failed:', err);
  process.exit(1);
});
