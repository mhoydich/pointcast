#!/usr/bin/env node
/**
 * gpt-image-batch.mjs — batch image generation via OpenAI's Images API.
 *
 * Reads OPENAI_API_KEY from .env.local (gitignored). Posts one request per
 * record to /v1/images/generations with model gpt-image-2, which returns
 * base64 rather than a URL.
 *
 * Input is a JSON array of { n, name, prompt, size } records. One PNG per
 * record lands in the output directory as NN-slug.png. Existing files are
 * skipped, so a partial run resumes by re-invoking the same command.
 *
 * Commands:
 *   node scripts/gpt-image-batch.mjs <prompts.json> [outDir] [options]
 *
 * Options:
 *   --model <id>      default gpt-image-2. Pass gpt-image-1.5 if the newer
 *                     model rejects WIDTHxHEIGHT sizes — its size grammar is
 *                     reported to differ (resolution tier + aspect ratio).
 *   --quality <tier>  low | medium | high | auto. Default high. Use low while
 *                     iterating on prompts; a full high pass costs ~20x more.
 *   --sleep <ms>      pause between calls. Default 2000. Image generation is
 *                     metered on a separate images-per-minute quota — on a
 *                     tier-1 account (5 IPM) raise this to 12000.
 *   --overwrite       regenerate files that already exist.
 *
 * Example:
 *   node scripts/gpt-image-batch.mjs \
 *     docs/briefs/2026-07-27-beer-desk-objects-prompts.json \
 *     public/img/desk-objects --quality low
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(REPO_ROOT, '.env.local');

const ENDPOINT = 'https://api.openai.com/v1/images/generations';
const VALID_SIZES = new Set(['1024x1024', '1536x1024', '1024x1536']);
const VALID_QUALITY = new Set(['low', 'medium', 'high', 'auto']);
const MAX_ATTEMPTS = 4;

function parseArgs(argv) {
  const opts = {
    model: 'gpt-image-2',
    quality: 'high',
    sleep: 2000,
    overwrite: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--overwrite') {
      opts.overwrite = true;
    } else if (arg === '--model' || arg === '--quality' || arg === '--sleep') {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(`[gpt-image] ${arg} needs a value`);
        process.exit(1);
      }
      opts[arg.slice(2)] = value;
      i += 1;
    } else if (arg.startsWith('--')) {
      console.error(`[gpt-image] unknown option ${arg}`);
      process.exit(1);
    } else {
      positional.push(arg);
    }
  }

  if (!VALID_QUALITY.has(opts.quality)) {
    console.error(`[gpt-image] --quality must be one of ${[...VALID_QUALITY].join(', ')}`);
    process.exit(1);
  }
  opts.sleep = Number(opts.sleep);
  if (!Number.isFinite(opts.sleep) || opts.sleep < 0) {
    console.error('[gpt-image] --sleep must be a non-negative number of milliseconds');
    process.exit(1);
  }

  return { opts, positional };
}

function loadEnv() {
  if (fs.existsSync(ENV_FILE)) {
    const raw = fs.readFileSync(ENV_FILE, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('[gpt-image] OPENAI_API_KEY not set in .env.local or environment');
    process.exit(2);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function generate(record, opts) {
  let size = record.size;
  if (!VALID_SIZES.has(size)) {
    console.warn(`[gpt-image]   size "${size}" unsupported, falling back to 1024x1024`);
    size = '1024x1024';
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: opts.model,
        prompt: record.prompt,
        size,
        quality: opts.quality,
        output_format: 'png',
        n: 1,
      }),
    });

    if (res.ok) {
      const body = await res.json();
      const b64 = body.data?.[0]?.b64_json;
      if (!b64) throw new Error('response carried no b64_json image data');
      return Buffer.from(b64, 'base64');
    }

    const detail = (await res.text()).slice(0, 300);
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`HTTP ${res.status}: ${detail}`);
    }
    const backoff = 2000 * 2 ** (attempt - 1);
    console.warn(`[gpt-image]   HTTP ${res.status}, retrying in ${backoff}ms`);
    await sleep(backoff);
  }
  throw new Error('exhausted retries');
}

async function main() {
  const { opts, positional } = parseArgs(process.argv.slice(2));
  const [promptsPath, outDir = './out'] = positional;
  if (!promptsPath) {
    console.error('[gpt-image] usage: node scripts/gpt-image-batch.mjs <prompts.json> [outDir] [options]');
    console.error('[gpt-image] options: --model <id> --quality <low|medium|high|auto> --sleep <ms> --overwrite');
    process.exit(1);
  }

  loadEnv();

  const records = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  if (!Array.isArray(records) || records.length === 0) {
    console.error('[gpt-image] prompts file must be a non-empty JSON array');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  let made = 0;
  let skipped = 0;
  const failures = [];

  for (const record of records) {
    const file = path.join(
      outDir,
      `${String(record.n).padStart(2, '0')}-${slug(record.name)}.png`,
    );

    if (fs.existsSync(file) && !opts.overwrite) {
      skipped += 1;
      console.log(`[gpt-image] skip  ${file}`);
      continue;
    }

    console.log(`[gpt-image] gen   ${record.name} (${record.size}, ${opts.quality})`);
    try {
      fs.writeFileSync(file, await generate(record, opts));
      made += 1;
      console.log(`[gpt-image]   wrote ${file}`);
    } catch (err) {
      failures.push({ name: record.name, error: err.message });
      console.error(`[gpt-image]   FAILED ${record.name}: ${err.message}`);
    }
    await sleep(opts.sleep);
  }

  console.log(`[gpt-image] ${made} generated, ${skipped} skipped, ${failures.length} failed`);
  if (failures.length) process.exit(1);
}

main().catch((err) => {
  console.error(`[gpt-image] ${err.message}`);
  process.exit(1);
});
