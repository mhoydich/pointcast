#!/usr/bin/env node
/**
 * migrate-post-bodies-to-blocks.mjs
 *
 * SEO hygiene: for every block whose meta.legacyPath points at a real
 * /posts/<slug>.md file, inline the post body into the block body so
 * /b/{id} is no longer a stub that defers to /posts/<slug>. Combined with
 * the canonical redirect already shipped in src/pages/posts/[...slug].astro,
 * this fully converges duplicate content to /b/{id}.
 *
 * Behavior:
 * - Reads src/content/blocks/*.json for entries with meta.legacyPath
 * - Resolves the matching src/content/posts/<slug>.md
 * - Strips YAML frontmatter
 * - Writes post markdown into block.body (only when block.body is empty or
 *   contains one of the known stub phrases pointing to /posts/)
 * - Preserves the old stub under meta.legacyStubBody for future reference
 * - Seeds block.dek from post frontmatter.description when block.dek is empty
 *
 * Idempotent: rerunning after a successful migration is a no-op.
 *
 * Run:   node scripts/migrate-post-bodies-to-blocks.mjs
 *   add  --dry  to preview without writing
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BLOCKS_DIR = join(ROOT, 'src/content/blocks');
const POSTS_DIR = join(ROOT, 'src/content/posts');

const DRY = process.argv.includes('--dry');

/** Strip --- YAML frontmatter --- from a Markdown string, return { body, data }. */
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { body: md, data: {} };
  const yaml = m[1];
  const body = md.slice(m[0].length).trimStart();
  const data = {};
  // Lightweight YAML — just top-level key: value pairs with string/array values.
  for (const line of yaml.split('\n')) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    }
    data[key] = val;
  }
  return { body, data };
}

/** Heuristic: does this block body read as a "see legacy path" stub? */
function isStubBody(body) {
  if (!body || body.length < 400) return true;
  return /during migration|continues at `\/posts\/|legacy path|legacyPath/i.test(body);
}

const blockFiles = readdirSync(BLOCKS_DIR).filter((f) => f.endsWith('.json')).sort();
let migrated = 0;
let skipped = 0;
let missing = 0;

for (const bf of blockFiles) {
  const blockPath = join(BLOCKS_DIR, bf);
  const block = JSON.parse(readFileSync(blockPath, 'utf8'));
  const legacy = block?.meta?.legacyPath;
  if (!legacy || !legacy.startsWith('/posts/')) continue;

  const slug = legacy.replace(/^\/posts\//, '').replace(/\/$/, '');
  const postPath = join(POSTS_DIR, `${slug}.md`);
  if (!existsSync(postPath)) {
    console.log(`· ${block.id} → ${legacy} — post missing, skip`);
    missing += 1;
    continue;
  }

  const postRaw = readFileSync(postPath, 'utf8');
  const { body: postBody, data: postData } = parseFrontmatter(postRaw);
  const currentBody = block.body ?? '';

  // Skip if block already contains substantive, non-stub content.
  if (currentBody && !isStubBody(currentBody)) {
    console.log(`· ${block.id} → ${slug} — already has body (${currentBody.length} chars), skip`);
    skipped += 1;
    continue;
  }

  // Preserve original stub for audit history.
  const nextMeta = { ...(block.meta ?? {}) };
  if (currentBody && !nextMeta.legacyStubBody) {
    nextMeta.legacyStubBody = currentBody;
  }

  // Seed dek from post frontmatter if missing.
  let nextDek = block.dek;
  if (!nextDek && postData.description) nextDek = postData.description;

  const next = {
    ...block,
    ...(nextDek ? { dek: nextDek } : {}),
    body: postBody.trim(),
    meta: nextMeta,
  };

  if (DRY) {
    console.log(`→ ${block.id} ← ${slug}: ${postBody.length} chars (dry run)`);
  } else {
    writeFileSync(blockPath, JSON.stringify(next, null, 2) + '\n');
    console.log(`✓ ${block.id} ← ${slug}: migrated ${postBody.length} chars into block body`);
  }
  migrated += 1;
}

console.log(`\nMigrated: ${migrated} · Skipped (already rich): ${skipped} · Missing post: ${missing}`);
if (DRY) console.log('(dry run — no files written)');
