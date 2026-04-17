#!/usr/bin/env node
/**
 * claude-visit — append a visit-type drop to the PointCast feed.
 *
 * Writes src/content/drops/{YYYY-MM-DD-{slug}}.md with frontmatter
 * (type: visit, noun, readSlug, etc.) and the --note text as body.
 * Commit the new file — it shows up in the unified feed on next build.
 *
 * Usage:
 *   node scripts/claude-visit.mjs --note "the hinges are agentic"
 *   node scripts/claude-visit.mjs \
 *     --note "sat with the front-door thesis" \
 *     --read seeing-the-future-0205 \
 *     --read-title "Seeing the Future №0205 · AI / Front Door" \
 *     --noun 387
 *   node scripts/claude-visit.mjs \
 *     --note "shipped" --became-dispatch new-post-slug
 *
 * Flags:
 *   --note             required. voice — rendered in serif italic.
 *   --read             optional. post slug Claude sat with.
 *   --read-title       optional. cached title (falls back to slug).
 *   --noun             optional. specific noun ID; otherwise picked semantically.
 *   --became-dispatch  optional. slug if this visit spawned a dispatch.
 *   --model            optional. defaults to 'claude-opus-4-7'.
 *   --slug             optional. filename slug override.
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pickNoun } from '../src/lib/nouns.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DROPS_DIR = resolve(__dirname, '../src/content/drops');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const tok = args[i];
    if (!tok.startsWith('--')) continue;
    const key = tok.replace(/^--/, '');
    const next = args[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = 'true';
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Escape a string so it's safe as a double-quoted YAML value. */
function yamlString(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function main() {
  const args = parseArgs();

  if (!args.note) {
    console.error('error: --note required');
    console.error('usage: node scripts/claude-visit.mjs --note "..." [--read slug] [--noun 387]');
    process.exit(1);
  }

  const nounId = args.noun
    ? parseInt(args.noun, 10)
    : pickNoun({ readSlug: args.read });

  if (Number.isNaN(nounId)) {
    console.error(`error: --noun must be an integer, got "${args.noun}"`);
    process.exit(1);
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const filenameSlug = args.slug
    ? slugify(args.slug)
    : `visit-${args.read ? slugify(args.read) : slugify(args.note).slice(0, 24)}`;

  // If a file with this slug already exists today, append a timestamp suffix.
  let filename = `${dateStr}-${filenameSlug}.md`;
  let filepath = resolve(DROPS_DIR, filename);
  if (existsSync(filepath)) {
    const suffix = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    filename = `${dateStr}-${filenameSlug}-${suffix}.md`;
    filepath = resolve(DROPS_DIR, filename);
  }

  if (!existsSync(DROPS_DIR)) mkdirSync(DROPS_DIR, { recursive: true });

  const model = args.model ?? 'claude-opus-4-7';

  const fmLines = [
    '---',
    `date: ${now.toISOString()}`,
    'type: visit',
    `nounId: ${nounId}`,
    `model: ${yamlString(model)}`,
  ];
  if (args.read) fmLines.push(`readSlug: ${yamlString(args.read)}`);
  if (args['read-title']) fmLines.push(`readTitle: ${yamlString(args['read-title'])}`);
  if (args['became-dispatch']) fmLines.push(`becameDispatch: ${yamlString(args['became-dispatch'])}`);
  fmLines.push('---', '', args.note, '');

  writeFileSync(filepath, fmLines.join('\n'), 'utf-8');

  const relPath = `src/content/drops/${filename}`;
  console.log(`✓ logged visit`);
  console.log(`  file:  ${relPath}`);
  console.log(`  noun:  ${nounId}`);
  console.log(`  when:  ${now.toISOString()}`);
  console.log(`\ncommit: git add ${relPath} && git commit -m "drop: visit — ${args.note.slice(0, 50)}${args.note.length > 50 ? '…' : ''}"`);
}

main();
