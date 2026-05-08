#!/usr/bin/env node

/**
 * Convert PointCast Blocks into draft AT Protocol record envelopes.
 *
 * This is a Phase 0 spike, not a publishing path. It reads the local Block
 * JSON files, maps each published block into a `xyz.pointcast.block` record,
 * validates the result against the JSON sketch in RFC 0004, and writes records
 * to tmp/lexicon-records/ for inspection.
 */

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { performance } from 'node:perf_hooks';

const ROOT = process.cwd();
const BLOCKS_DIR = path.join(ROOT, 'src/content/blocks');
const RFC_PATH = path.join(ROOT, 'docs/rfcs/0004-pointcast-block-lexicon.md');
const OUT_DIR = path.join(ROOT, 'tmp/lexicon-records');
const COLLECTION = 'xyz.pointcast.block';
const EXAMPLE_DID = 'did:example:pointcast';
const PUBLIC_BASE_URL = 'https://pointcast.xyz';

const BLOCK_FIELDS = new Set([
  'id',
  'channel',
  'type',
  'title',
  'dek',
  'body',
  'timestamp',
  'size',
  'noun',
  'readingTime',
  'author',
  'source',
  'mood',
  'external',
  'media',
  'companions',
  'meta',
]);

function usage() {
  console.log(`Usage: node scripts/lexicon-convert.mjs [--include-drafts] [--out tmp/lexicon-records]

Options:
  --include-drafts  Convert draft blocks too. Default: published blocks only.
  --out <dir>       Output directory. Default: tmp/lexicon-records.
`);
}

function parseArgs(argv) {
  const args = { includeDrafts: false, outDir: OUT_DIR };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--include-drafts') {
      args.includeDrafts = true;
    } else if (arg === '--out') {
      const next = argv[i + 1];
      if (!next) throw new Error('--out requires a directory');
      args.outDir = path.resolve(ROOT, next);
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readLexiconFromRfc() {
  const markdown = await readFile(RFC_PATH, 'utf8');
  const match = markdown.match(/```json\s*([\s\S]*?)```/);
  if (!match) throw new Error(`No JSON lexicon block found in ${RFC_PATH}`);
  return JSON.parse(match[1]);
}

function toIsoDate(value, fileName) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fileName}: invalid timestamp ${JSON.stringify(value)}`);
  }
  return date.toISOString();
}

function mapBlockToRecord(block, fileName) {
  const timestamp = toIsoDate(block.timestamp, fileName);
  const record = {
    $type: COLLECTION,
    id: block.id,
    channel: block.channel,
    type: block.type,
    title: block.title,
    timestamp,
    createdAt: timestamp,
  };

  for (const key of [
    'dek',
    'body',
    'size',
    'noun',
    'readingTime',
    'author',
    'source',
    'mood',
    'external',
    'companions',
    'meta',
  ]) {
    if (block[key] !== undefined) record[key] = block[key];
  }

  if (block.media !== undefined) {
    record.media = normalizeMedia(block.media);
  }

  return record;
}

function normalizeMedia(media) {
  if (!media || typeof media !== 'object' || Array.isArray(media)) return media;
  const out = { ...media };
  for (const key of ['src', 'thumbnail', 'ipfsFallback']) {
    if (typeof out[key] === 'string') out[key] = absolutizeUrl(out[key]);
  }
  return out;
}

function absolutizeUrl(value) {
  if (!value.startsWith('/')) return value;
  return new URL(value, PUBLIC_BASE_URL).toString();
}

function validateRecord(record, lexicon) {
  const messages = [];
  const main = lexicon?.defs?.main?.record;
  if (!main || main.type !== 'object') {
    return [{ level: 'error', code: 'lexicon-missing-main', path: '$', message: 'Lexicon main record is missing.' }];
  }
  validateObject(record, main, lexicon.defs, '$', messages);
  return messages;
}

function validateObject(value, schema, defs, pointer, messages) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    messages.push({ level: 'error', code: 'type-object', path: pointer, message: 'Expected object.' });
    return;
  }

  for (const key of schema.required ?? []) {
    if (value[key] === undefined) {
      messages.push({ level: 'error', code: 'required', path: `${pointer}.${key}`, message: 'Required field missing.' });
    }
  }

  for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
    if (value[key] === undefined) continue;
    validateValue(value[key], propSchema, defs, `${pointer}.${key}`, messages);
  }
}

function validateValue(value, schema, defs, pointer, messages) {
  const resolved = resolveRef(schema, defs);
  if (!resolved) {
    messages.push({ level: 'error', code: 'bad-ref', path: pointer, message: `Could not resolve ${schema.ref}.` });
    return;
  }

  if (resolved.type === 'string') {
    if (typeof value !== 'string') {
      messages.push({ level: 'error', code: 'type-string', path: pointer, message: 'Expected string.' });
      return;
    }
    if (resolved.minLength && value.length < resolved.minLength) {
      messages.push({ level: 'error', code: 'min-length', path: pointer, message: `Expected at least ${resolved.minLength} chars.` });
    }
    if (resolved.maxLength && value.length > resolved.maxLength) {
      messages.push({ level: 'error', code: 'max-length', path: pointer, message: `Expected at most ${resolved.maxLength} chars.` });
    }
    if (resolved.format === 'datetime' && Number.isNaN(Date.parse(value))) {
      messages.push({ level: 'error', code: 'format-datetime', path: pointer, message: 'Expected ISO datetime.' });
    }
    if (resolved.format === 'uri' && !looksLikeUri(value)) {
      messages.push({ level: 'error', code: 'format-uri', path: pointer, message: 'Expected URI.' });
    }
    if (resolved.knownValues && !resolved.knownValues.includes(value)) {
      messages.push({
        level: 'warn',
        code: 'known-value',
        path: pointer,
        message: `Value ${JSON.stringify(value)} is not listed in RFC knownValues.`,
      });
    }
    return;
  }

  if (resolved.type === 'integer') {
    if (!Number.isInteger(value)) {
      messages.push({ level: 'error', code: 'type-integer', path: pointer, message: 'Expected integer.' });
      return;
    }
    if (resolved.minimum !== undefined && value < resolved.minimum) {
      messages.push({ level: 'error', code: 'minimum', path: pointer, message: `Expected >= ${resolved.minimum}.` });
    }
    if (resolved.maximum !== undefined && value > resolved.maximum) {
      messages.push({ level: 'error', code: 'maximum', path: pointer, message: `Expected <= ${resolved.maximum}.` });
    }
    return;
  }

  if (resolved.type === 'array') {
    if (!Array.isArray(value)) {
      messages.push({ level: 'error', code: 'type-array', path: pointer, message: 'Expected array.' });
      return;
    }
    if (resolved.maxLength && value.length > resolved.maxLength) {
      messages.push({ level: 'error', code: 'array-max-length', path: pointer, message: `Expected at most ${resolved.maxLength} items.` });
    }
    value.forEach((item, index) => validateValue(item, resolved.items, defs, `${pointer}[${index}]`, messages));
    return;
  }

  if (resolved.type === 'object') {
    validateObject(value, resolved, defs, pointer, messages);
    return;
  }

  messages.push({ level: 'warn', code: 'unsupported-schema-type', path: pointer, message: `No validator for type ${resolved.type}.` });
}

function resolveRef(schema, defs) {
  if (schema.type !== 'ref') return schema;
  const name = schema.ref?.replace(/^#/, '');
  return name ? defs?.[name] : null;
}

function looksLikeUri(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return value.startsWith('at://') || value.startsWith('did:');
  }
}

function droppedFields(block) {
  return Object.keys(block)
    .filter((key) => !BLOCK_FIELDS.has(key) && key !== 'draft')
    .sort();
}

function countBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item);
    out[key] = (out[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const start = performance.now();
  const args = parseArgs(process.argv.slice(2));
  const lexicon = await readLexiconFromRfc();

  const files = (await readdir(BLOCKS_DIR))
    .filter((name) => name.endsWith('.json'))
    .sort();

  await rm(args.outDir, { recursive: true, force: true });
  await mkdir(args.outDir, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    collection: COLLECTION,
    sourceLexicon: path.relative(ROOT, RFC_PATH),
    outputDir: path.relative(ROOT, args.outDir),
    inputBlocks: files.length,
    draftsSkipped: 0,
    recordsWritten: 0,
    validation: { errors: 0, warnings: 0, warningsByCode: {}, errorsByCode: {} },
    droppedFieldCounts: {},
    channelCounts: {},
    typeCounts: {},
    examples: [],
  };

  const allMessages = [];
  const dropped = [];
  const converted = [];

  for (const fileName of files) {
    const filePath = path.join(BLOCKS_DIR, fileName);
    const block = await readJson(filePath);
    if (block.draft && !args.includeDrafts) {
      summary.draftsSkipped += 1;
      continue;
    }

    const record = mapBlockToRecord(block, fileName);
    const envelope = {
      uri: `at://${EXAMPLE_DID}/${COLLECTION}/${record.id}`,
      collection: COLLECTION,
      rkey: record.id,
      record,
    };

    const messages = validateRecord(record, lexicon);
    for (const message of messages) allMessages.push({ block: record.id, ...message });

    const blockDropped = droppedFields(block);
    if (blockDropped.length) dropped.push({ block: record.id, fields: blockDropped });

    await writeFile(
      path.join(args.outDir, `${record.id}.json`),
      JSON.stringify(envelope, null, 2) + '\n',
    );

    converted.push(record);
  }

  summary.recordsWritten = converted.length;
  summary.channelCounts = countBy(converted, (record) => record.channel);
  summary.typeCounts = countBy(converted, (record) => record.type);
  summary.validation.errors = allMessages.filter((m) => m.level === 'error').length;
  summary.validation.warnings = allMessages.filter((m) => m.level === 'warn').length;
  summary.validation.errorsByCode = countBy(allMessages.filter((m) => m.level === 'error'), (m) => m.code);
  summary.validation.warningsByCode = countBy(allMessages.filter((m) => m.level === 'warn'), (m) => m.code);
  summary.droppedFieldCounts = countBy(dropped.flatMap((item) => item.fields), (field) => field);
  summary.examples = converted.slice(0, 5).map((record) => ({
    id: record.id,
    title: record.title,
    uri: `at://${EXAMPLE_DID}/${COLLECTION}/${record.id}`,
  }));
  summary.durationMs = Math.round(performance.now() - start);

  await writeFile(path.join(args.outDir, '_summary.json'), JSON.stringify(summary, null, 2) + '\n');
  await writeFile(path.join(args.outDir, '_validation.json'), JSON.stringify(allMessages, null, 2) + '\n');
  await writeFile(path.join(args.outDir, '_dropped-fields.json'), JSON.stringify(dropped, null, 2) + '\n');

  console.log(JSON.stringify(summary, null, 2));

  if (summary.validation.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
