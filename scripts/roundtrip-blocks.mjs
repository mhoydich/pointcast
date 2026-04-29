#!/usr/bin/env node
/**
 * scripts/roundtrip-blocks.mjs — Sprint 5 Day 4 deliverable.
 *
 * Reads every block JSON in src/content/blocks/, runs it through the
 * Block ↔ Lexicon converter (src/lib/lexicon/block-to-lexicon.ts via
 * a small inline ESM import), and reports:
 *
 *   - total blocks
 *   - lossless count
 *   - drift count + every drifting block's id + path list
 *
 * Exits 0 if all lossless, 1 if any drift. Wired so a future
 * pre-commit or CI check can run it without changes.
 *
 * Why pure JS (not the .ts module) — we don't want to spin up
 * a TypeScript compiler in a tiny script. The converter logic
 * is small enough to mirror inline. Both files share the same
 * RFC 0004 contract; if they ever drift, fix both.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOCKS_DIR = join(ROOT, 'src', 'content', 'blocks');

// ─── Inline mirror of src/lib/lexicon/block-to-lexicon.ts ──────────────
// Keep these in lockstep. RFC 0004 is the contract.

function stripUndefined(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = stripUndefined(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function blockToLexiconRecord(block, opts = {}) {
  const out = {
    $type: 'xyz.pointcast.block',
    id: block.id,
    channel: String(block.channel),
    type: String(block.type),
    title: block.title,
    timestamp: block.timestamp,
    createdAt: opts.createdAt ?? block.timestamp,
  };
  if (block.dek !== undefined)         out.dek = block.dek;
  if (block.body !== undefined)        out.body = block.body;
  if (block.size !== undefined)        out.size = String(block.size);
  if (block.noun !== undefined)        out.noun = block.noun;
  if (block.readingTime !== undefined) out.readingTime = block.readingTime;
  if (block.author !== undefined)      out.author = block.author;
  if (block.source !== undefined)      out.source = block.source;
  if (block.mood !== undefined)        out.mood = block.mood;
  if (block.external)                  out.external = { ...block.external };
  if (block.media)                     out.media = { ...block.media };
  if (block.companions && block.companions.length) {
    out.companions = block.companions.map((c) => ({
      id: c.id,
      label: c.label,
      ...(c.surface ? { surface: c.surface } : {}),
    }));
  }
  if (block.meta && Object.keys(block.meta).length) {
    out.meta = stripUndefined(block.meta);
  }
  return out;
}

function lexiconRecordToBlock(record) {
  const out = {
    id: record.id,
    channel: record.channel,
    type: record.type,
    title: record.title,
    timestamp: record.timestamp,
  };
  if (record.dek !== undefined)         out.dek = record.dek;
  if (record.body !== undefined)        out.body = record.body;
  if (record.size !== undefined)        out.size = record.size;
  if (record.noun !== undefined)        out.noun = record.noun;
  if (record.readingTime !== undefined) out.readingTime = record.readingTime;
  if (record.author !== undefined)      out.author = record.author;
  if (record.source !== undefined)      out.source = record.source;
  if (record.mood !== undefined)        out.mood = record.mood;
  if (record.external)                  out.external = { ...record.external };
  if (record.media)                     out.media = { ...record.media };
  if (record.companions && record.companions.length) {
    out.companions = record.companions.map((c) => ({
      id: c.id,
      label: c.label,
      ...(c.surface ? { surface: c.surface } : {}),
    }));
  }
  if (record.meta && Object.keys(record.meta).length) {
    out.meta = stripUndefined(record.meta);
  }
  return out;
}

function diffPaths(a, b, path = '') {
  if (a === b) return [];
  if (typeof a !== typeof b) return [path || '(root)'];
  if (a === null || b === null) return a === b ? [] : [path || '(root)'];
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [`${path}[length]`];
    const out = [];
    for (let i = 0; i < a.length; i++) {
      out.push(...diffPaths(a[i], b[i], `${path}[${i}]`));
    }
    return out;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const out = [];
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      out.push(...diffPaths(a[k], b[k], path ? `${path}.${k}` : k));
    }
    return out;
  }
  return [path || '(root)'];
}

// ─── main ──────────────────────────────────────────────────────────────

function main() {
  const files = readdirSync(BLOCKS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  let lossless = 0;
  let drifted = 0;
  const drifts = [];

  for (const f of files) {
    const raw = readFileSync(join(BLOCKS_DIR, f), 'utf8');
    let block;
    try {
      block = JSON.parse(raw);
    } catch (e) {
      console.error(`[parse error] ${f}: ${e.message}`);
      continue;
    }
    const record = blockToLexiconRecord(block);
    const back = lexiconRecordToBlock(record);
    const drift = diffPaths(stripUndefined(block), stripUndefined(back));
    if (drift.length === 0) {
      lossless++;
    } else {
      drifted++;
      drifts.push({ id: block.id, file: f, paths: drift });
    }
  }

  const total = files.length;
  const pct = total > 0 ? ((lossless / total) * 100).toFixed(1) : '0.0';

  console.log('Block ↔ Lexicon round-trip · RFC 0004 / Sprint 5 Day 4');
  console.log('─────────────────────────────────────────────────────');
  console.log(`total blocks scanned: ${total}`);
  console.log(`           lossless: ${lossless} (${pct}%)`);
  console.log(`            drifted: ${drifted}`);

  if (drifts.length > 0) {
    console.log('');
    console.log('Drift details:');
    for (const d of drifts) {
      console.log(`  · ${d.id} (${d.file})`);
      for (const p of d.paths.slice(0, 12)) console.log(`      ${p}`);
      if (d.paths.length > 12) console.log(`      …${d.paths.length - 12} more`);
    }
  }

  process.exit(drifts.length === 0 ? 0 : 1);
}

main();
