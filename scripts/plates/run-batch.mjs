#!/usr/bin/env node
/**
 * run-batch.mjs: generate a batch of PointCast plates with OpenAI's image
 * model, on a machine that has OPENAI_API_KEY (Mike's iMac, or Codex there).
 * Cloud sessions can't reach api.openai.com, so threads write prompt
 * manifests under scripts/plates/batch/ and this script renders them.
 *
 *   node scripts/plates/run-batch.mjs                      # every manifest, skip files that exist
 *   node scripts/plates/run-batch.mjs batch/pmm-brand.json # one manifest (path relative to scripts/plates/)
 *   node scripts/plates/run-batch.mjs --dry-run            # print the plan, call nothing
 *   node scripts/plates/run-batch.mjs --force              # regenerate files that exist
 *   node scripts/plates/run-batch.mjs --model gpt-image-1  # override the model for every entry
 *
 * A manifest is a JSON array of
 *   { "out": "public/images/<dir>/<name>.png", "prompt": "...",
 *     "aspect": "portrait" | "square" | "landscape", "quality": "low" | "medium" | "high",
 *     "og": "public/images/<dir>/<name>-og.png" (optional), "model": "..." (optional) }
 * Every path must stay under public/images/, and no file (png, its .webp twin,
 * or og) may be written by two entries, even across manifests. The key comes from the
 * environment or the gitignored .env.local, the same way scripts/mcp/plates.mjs
 * reads it, and is never printed.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '..', '..');
const IMAGES_ROOT = path.join(REPO_ROOT, 'public', 'images');
const OPENAI_URL = 'https://api.openai.com/v1/images/generations';
export const DEFAULT_MODEL = 'gpt-image-2';
const FALLBACK_MODEL = 'gpt-image-1';
export const ASPECT_TO_SIZE = { portrait: '1024x1536', square: '1024x1024', landscape: '1536x1024' };
const QUALITIES = new Set(['low', 'medium', 'high']);

/** The absolute path for a repo-relative image path, or an error if it leaves public/images/ or isn't a .png. */
export function imagePath(rel, label = 'out') {
  if (typeof rel !== 'string' || !rel.trim()) throw new Error(`${label} is required`);
  if (!/\.png$/i.test(rel)) throw new Error(`${label} "${rel}" must end in .png`);
  const abs = path.resolve(REPO_ROOT, rel);
  const inside = path.relative(IMAGES_ROOT, abs);
  if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) throw new Error(`${label} "${rel}" is outside public/images/`);
  return abs;
}

/** Check one manifest entry; returns a list of problems (empty when it is fine). */
export function entryProblems(e) {
  const out = [];
  if (!e || typeof e !== 'object' || Array.isArray(e)) return ['entry is not an object'];
  try { imagePath(e.out, 'out'); } catch (err) { out.push(err.message); }
  if (e.og !== undefined) { try { imagePath(e.og, 'og'); } catch (err) { out.push(err.message); } }
  if (typeof e.prompt !== 'string' || e.prompt.trim().length < 20) out.push('prompt must be a string of at least 20 characters');
  if (typeof e.prompt === 'string' && e.prompt.length > 4000) out.push('prompt is over 4000 characters');
  if (e.aspect !== undefined && !ASPECT_TO_SIZE[e.aspect]) out.push(`aspect "${e.aspect}" is not portrait, square or landscape`);
  if (e.quality !== undefined && !QUALITIES.has(e.quality)) out.push(`quality "${e.quality}" is not low, medium or high`);
  if (e.model !== undefined && (typeof e.model !== 'string' || !/^[a-z0-9.\-]+$/i.test(e.model))) out.push('model must be a plain model id');
  return out;
}

/** Every absolute file an entry writes: the png, its .webp twin and the og crop. */
export function entryFiles(e) {
  const png = imagePath(e.out);
  const files = [png, png.replace(/\.png$/i, '.webp')];
  if (e.og !== undefined) files.push(imagePath(e.og, 'og'));
  return files;
}

/**
 * Read and check a manifest file; throws listing every problem. Pass the same
 * `claimed` map across manifests to catch two entries writing one file.
 */
export function loadManifest(file, claimed = new Map()) {
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(list)) throw new Error(`${file}: a manifest is a JSON array`);
  const problems = [];
  const name = path.basename(file);
  list.forEach((e, i) => {
    const bad = entryProblems(e);
    for (const p of bad) problems.push(`#${i}: ${p}`);
    if (bad.length) return;
    for (const f of entryFiles(e)) {
      const rel = path.relative(REPO_ROOT, f);
      if (claimed.has(f)) problems.push(`#${i}: ${rel} is also written by ${claimed.get(f)}`);
      else claimed.set(f, `${name} #${i}`);
    }
  });
  if (problems.length) throw new Error(`${path.relative(REPO_ROOT, file)}:\n  ${problems.join('\n  ')}`);
  return list;
}

/** Parse argv; throws on an unknown flag or a --model without a plain id. */
export function parseArgs(args) {
  const opts = { dry: false, force: false, model: null, files: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dry = true;
    else if (a === '--force') opts.force = true;
    else if (a === '--model' || a.startsWith('--model=')) {
      const v = a === '--model' ? args[++i] : a.slice('--model='.length);
      if (!v || v.startsWith('-') || !/^[a-z0-9.\-]+$/i.test(v)) throw new Error('--model needs a plain model id, e.g. --model gpt-image-1');
      opts.model = v;
    } else if (a.startsWith('-')) throw new Error(`unknown flag ${a} (use --dry-run, --force or --model <id>)`);
    else opts.files.push(a);
  }
  return opts;
}

function apiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envFile = path.join(REPO_ROOT, '.env.local');
  if (!fs.existsSync(envFile)) return '';
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1];
  }
  return '';
}

async function generate(entry, model, key) {
  const body = { model, prompt: entry.prompt, size: ASPECT_TO_SIZE[entry.aspect || 'portrait'], quality: entry.quality || 'high', n: 1 };
  const res = await fetch(OPENAI_URL, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  if (!res.ok) {
    const msg = json?.error?.message || text.slice(0, 300);
    const err = new Error(`HTTP ${res.status}: ${msg}`);
    err.modelMissing = res.status === 404 || /model/i.test(msg) && /(not found|does not exist|invalid)/i.test(msg);
    throw err;
  }
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error('response had no data[0].b64_json');
  return Buffer.from(b64, 'base64');
}

/** Write the .webp twin and og crop for a png. */
async function writeDerived(j, png, sharp) {
  const out = imagePath(j.out);
  await fsp.writeFile(out.replace(/\.png$/i, '.webp'), await sharp(png).webp({ quality: 82 }).toBuffer());
  if (j.og) {
    const og = imagePath(j.og, 'og');
    await fsp.mkdir(path.dirname(og), { recursive: true });
    await fsp.writeFile(og, await sharp(png).resize(1200, 630, { fit: 'cover', position: 'centre' }).png().toBuffer());
  }
}

async function main(argv) {
  const { dry, force, model: modelOverride, files: named } = parseArgs(argv.slice(2));
  const files = named.length
    ? named.map((f) => path.resolve(HERE, f))
    : fs.readdirSync(path.join(HERE, 'batch')).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(HERE, 'batch', f));

  const jobs = [];
  const claimed = new Map();
  for (const f of files) for (const e of loadManifest(f, claimed)) jobs.push({ ...e, manifest: path.basename(f) });
  // A png that exists only needs its missing webp/og rebuilt, locally and for free.
  const todo = jobs.filter((j) => force || !fs.existsSync(imagePath(j.out)));
  const patch = force ? [] : jobs.filter((j) => fs.existsSync(imagePath(j.out)) && entryFiles(j).some((f) => !fs.existsSync(f)));
  console.error(`${jobs.length} plates in ${files.length} manifest(s); ${todo.length} to generate${force ? ' (forced)' : ''}${patch.length ? `, ${patch.length} to rebuild webp/og from the existing png` : ''}.`);
  if (dry) {
    for (const j of todo) console.error(`  ${j.manifest}  ${j.out}  ${j.aspect || 'portrait'}`);
    for (const j of patch) console.error(`  ${j.manifest}  ${j.out}  (webp/og only)`);
    return;
  }
  if (!todo.length && !patch.length) return;

  const sharp = (await import('sharp')).default;
  for (const j of patch) {
    await writeDerived(j, await fsp.readFile(imagePath(j.out)), sharp);
    console.error(`  rebuilt webp/og for ${j.out}`);
  }
  if (!todo.length) return;

  const key = apiKey();
  if (!key) throw new Error('OPENAI_API_KEY is not set (environment or .env.local at the repo root).');
  let model = modelOverride || DEFAULT_MODEL;
  let done = 0;
  const failures = [];
  for (const j of todo) {
    const want = modelOverride || j.model || model;
    let png;
    try {
      png = await generate(j, want, key);
    } catch (err) {
      if (err.modelMissing && !modelOverride && !j.model && want !== FALLBACK_MODEL) {
        console.error(`  ${want} is not available on this key; falling back to ${FALLBACK_MODEL}.`);
        model = FALLBACK_MODEL;
        try { png = await generate(j, model, key); } catch (err2) { failures.push(`${j.out}: ${err2.message}`); continue; }
      } else { failures.push(`${j.out}: ${err.message}`); continue; }
    }
    const out = imagePath(j.out);
    await fsp.mkdir(path.dirname(out), { recursive: true });
    await fsp.writeFile(out, png);
    await writeDerived(j, png, sharp);
    done++;
    console.error(`  [${done}/${todo.length}] ${j.out}`);
  }
  if (failures.length) { console.error(`${failures.length} failed:\n  ${failures.join('\n  ')}`); process.exitCode = 1; }
}

// Compare real paths so a checkout under a space or a symlink still runs main().
const isMain = process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
if (isMain) main(process.argv).catch((e) => { console.error(e.message); process.exit(1); });
