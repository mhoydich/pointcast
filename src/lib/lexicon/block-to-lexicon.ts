/**
 * Block ↔ xyz.pointcast.block Lexicon converter.
 *
 * Phase 0 spike — see docs/rfcs/0004-pointcast-block-lexicon.md.
 *
 * Goal: prove the existing Block schema maps cleanly onto an
 * AT Protocol Lexicon record, and surface where the mapping
 * has friction (drift points). No Phase 1 commitment yet —
 * this is a learn-by-doing exercise.
 *
 * Two pure functions:
 *  - blockToLexiconRecord(block) → record body shaped per Lexicon
 *  - lexiconRecordToBlock(record) → reverse, for round-trip checks
 *
 * No I/O, no astro:content imports — keeps this importable from
 * client-side preview pages and unit-friendly. Loose Block typing
 * (we accept the partial subset that lands on the wire).
 *
 * Open questions deferred to RFC 0004:
 *   - Co-authorship multi-agent → currently dropped, only `author` survives
 *   - Talk/Birthday distinct Lexicons → out of scope here
 *   - companions[].id polymorphism → preserved verbatim
 */

export type BlockChannel =
  | 'FD' | 'CRT' | 'SPN' | 'GF' | 'GDN' | 'ESC' | 'FCT' | 'VST' | 'BTL' | 'BDY';
export type BlockType =
  | 'READ' | 'LISTEN' | 'WATCH' | 'MINT' | 'FAUCET' | 'NOTE' | 'VISIT' | 'LINK' | 'TALK' | 'BIRTHDAY';
export type BlockSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x2';

export interface BlockExternal {
  url: string;
  label: string;
}
export interface BlockMedia {
  kind: 'image' | 'audio' | 'video' | 'embed';
  src: string;
  thumbnail?: string;
  ipfsFallback?: string;
}
export interface BlockCompanion {
  id: string;
  label: string;
  surface?: 'yee' | 'poll' | 'clock' | 'block' | 'external' | 'atproto';
}
export interface BlockMeta {
  location?: string;
  station?: string;
  series?: string;
  topics?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface Block {
  id: string;
  channel: BlockChannel | string;
  type: BlockType | string;
  title: string;
  dek?: string;
  body?: string;
  timestamp: string; // ISO datetime
  size?: BlockSize | string;
  noun?: number;
  readingTime?: string;
  author?: string;
  source?: string;
  mood?: string;
  external?: BlockExternal;
  media?: BlockMedia;
  companions?: BlockCompanion[];
  meta?: BlockMeta;
}

/**
 * Lexicon record shape (xyz.pointcast.block). Mirrors RFC 0004 sketch
 * with a few practical conventions baked in:
 *  - createdAt mirrors timestamp by default (back-fill convention)
 *  - companions[].surface defaults to 'block' to match Block defaults
 *  - meta blob preserved verbatim, undefined fields elided
 */
export interface LexiconBlockRecord {
  $type: 'xyz.pointcast.block';
  id: string;
  channel: string;
  type: string;
  title: string;
  dek?: string;
  body?: string;
  timestamp: string;
  createdAt: string;
  size?: string;
  noun?: number;
  readingTime?: string;
  author?: string;
  source?: string;
  mood?: string;
  external?: BlockExternal;
  media?: BlockMedia;
  companions?: BlockCompanion[];
  meta?: BlockMeta;
}

/**
 * AT-URI for a record on a node's repo.
 * `at://{did}/xyz.pointcast.block/{rkey}` — rkey is the block id.
 */
export function blockAtUri(did: string, blockId: string): string {
  return `at://${did}/xyz.pointcast.block/${blockId}`;
}

/**
 * Block → Lexicon record. Strips undefineds for clean JSON.
 *
 * @param block A Block as it appears in src/content/blocks/{id}.json
 * @param opts.createdAt Override createdAt; defaults to block.timestamp
 *                      (the back-fill convention from RFC 0004).
 */
export function blockToLexiconRecord(
  block: Block,
  opts: { createdAt?: string } = {},
): LexiconBlockRecord {
  const out: LexiconBlockRecord = {
    $type: 'xyz.pointcast.block',
    id: block.id,
    channel: String(block.channel),
    type: String(block.type),
    title: block.title,
    timestamp: normalizeIso(block.timestamp),
    createdAt: normalizeIso(opts.createdAt ?? block.timestamp),
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

/**
 * Lexicon record → Block. The reverse direction. Drops $type and createdAt
 * (createdAt has no slot in the Block schema; it survives as a side-channel).
 */
export function lexiconRecordToBlock(record: LexiconBlockRecord): Block {
  const out: Block = {
    id: record.id,
    channel: record.channel,
    type: record.type,
    title: record.title,
    timestamp: normalizeIso(record.timestamp),
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

/**
 * Round-trip a Block through the Lexicon and back. Used by tests
 * and the /federation/preview demo page.
 *
 * Returns:
 *  - record: the Lexicon record produced from input
 *  - back: the Block round-tripped from that record
 *  - lossless: true if back equals input under JSON-equality
 *  - drift: list of paths where back differs from input (debug aid)
 */
export function roundTrip(block: Block): {
  record: LexiconBlockRecord;
  back: Block;
  lossless: boolean;
  drift: string[];
} {
  const record = blockToLexiconRecord(block);
  const back = lexiconRecordToBlock(record);
  const drift = diffPaths(stripUndefined(block), stripUndefined(back));
  return { record, back, lossless: drift.length === 0, drift };
}

// ─────────────── helpers ───────────────

function normalizeIso(input: string | Date): string {
  if (input instanceof Date) return input.toISOString();
  // Allow ISO-ish strings to pass through. Tolerate trailing 'Z' / offsets.
  return String(input);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = stripUndefined(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function diffPaths(a: unknown, b: unknown, path = ''): string[] {
  if (a === b) return [];
  if (typeof a !== typeof b) return [path || '(root)'];
  if (a === null || b === null) return a === b ? [] : [path || '(root)'];
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [`${path}[length]`];
    const out: string[] = [];
    for (let i = 0; i < a.length; i++) {
      out.push(...diffPaths(a[i], b[i], `${path}[${i}]`));
    }
    return out;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const out: string[] = [];
    const keys = new Set([
      ...Object.keys(a as Record<string, unknown>),
      ...Object.keys(b as Record<string, unknown>),
    ]);
    for (const k of keys) {
      out.push(...diffPaths(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
        path ? `${path}.${k}` : k,
      ));
    }
    return out;
  }
  return [path || '(root)'];
}
