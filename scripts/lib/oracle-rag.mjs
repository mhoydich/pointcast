import * as lancedb from '@lancedb/lancedb';
import { UMAP } from 'umap-js';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, compactSnippet, corpusDigest, loadBlocks, loadRecentBlocks } from './oracle-blocks.mjs';

export const ORACLE_DIR = join(REPO_ROOT, '.pointcast/oracle');
export const LANCEDB_DIR = join(REPO_ROOT, '.pointcast/lancedb');
export const ATLAS_PUBLIC_PATH = join(REPO_ROOT, 'public/atlas/blocks-atlas.json');
export const ATLAS_LOCAL_PATH = join(ORACLE_DIR, 'atlas.json');
export const MANIFEST_PATH = join(ORACLE_DIR, 'manifest.json');

const TABLE_NAME = 'blocks';
const EMBED_MODELS = [
  process.env.POINTCAST_EMBED_MODEL || 'nomic-embed-text',
  'bge-small',
  'bge-small-en',
].filter(Boolean);
const CHAT_MODELS = [
  process.env.POINTCAST_CHAT_MODEL || 'qwen2.5:3b',
  'llama3.2:3b',
].filter(Boolean);

function ollamaBase() {
  return (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
}

async function ensureDirs() {
  await mkdir(ORACLE_DIR, { recursive: true });
  await mkdir(LANCEDB_DIR, { recursive: true });
  await mkdir(join(REPO_ROOT, 'public/atlas'), { recursive: true });
}

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function hashVector(text, dims = 384) {
  const vector = new Array(dims).fill(0);
  const tokens = String(text || '').toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) || [];
  for (const token of tokens) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i += 1) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % dims;
    vector[idx] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, n) => sum + n * n, 0)) || 1;
  return vector.map((n) => n / norm);
}

async function ollamaJson(path, payload, timeoutMs = 45_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${ollamaBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`${response.status} ${response.statusText} ${text.slice(0, 160)}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function embedText(text) {
  const prompt = String(text || '').slice(0, 7000);
  const errors = [];
  for (const model of EMBED_MODELS) {
    try {
      const json = await ollamaJson('/api/embeddings', { model, prompt }, 60_000);
      if (Array.isArray(json.embedding) && json.embedding.length > 0) {
        return { vector: json.embedding, model, fallback: false };
      }
    } catch (error) {
      errors.push(`${model}: ${error.message}`);
    }
  }
  return { vector: hashVector(prompt), model: 'hash-fallback', fallback: true, errors };
}

async function chat(messages, options = {}) {
  const errors = [];
  for (const model of CHAT_MODELS) {
    try {
      const json = await ollamaJson('/api/chat', {
        model,
        stream: false,
        messages,
        options: { temperature: options.temperature ?? 0.25, num_ctx: options.numCtx ?? 8192 },
      }, options.timeoutMs ?? 90_000);
      const content = json?.message?.content || json?.response || '';
      if (content.trim()) return { content: content.trim(), model, fallback: false };
    } catch (error) {
      errors.push(`${model}: ${error.message}`);
    }
  }
  return { content: '', model: 'extractive-fallback', fallback: true, errors };
}

async function openOrCreateTable() {
  await ensureDirs();
  const db = await lancedb.connect(LANCEDB_DIR);
  const names = await db.tableNames();
  if (!names.includes(TABLE_NAME)) return null;
  return db.openTable(TABLE_NAME);
}

export async function reindex({ force = false, recomputeAtlas = true } = {}) {
  await ensureDirs();
  const blocks = await loadBlocks();
  const digest = corpusDigest(blocks);
  const manifest = await readJson(MANIFEST_PATH, {});

  if (!force && manifest?.digest === digest && existsSync(join(LANCEDB_DIR, `${TABLE_NAME}.lance`))) {
    if (recomputeAtlas && !existsSync(ATLAS_LOCAL_PATH)) await computeAtlas();
    return { ok: true, skipped: true, blocks: blocks.length, digest, model: manifest.model || null };
  }

  const rows = [];
  let model = null;
  let fallbackEmbeddings = 0;
  for (const block of blocks) {
    const embedded = await embedText(block.text);
    model ||= embedded.model;
    if (embedded.fallback) fallbackEmbeddings += 1;
    rows.push({
      id: block.id,
      channel: block.channel,
      channelName: block.channelName,
      type: block.type,
      title: block.title,
      dek: block.dek || '',
      body: block.body || '',
      timestamp: block.timestamp || '',
      mood: block.mood || '',
      path: block.path,
      url: block.url,
      source: block.source || '',
      text: block.text,
      digest: block.digest,
      vector: embedded.vector,
    });
  }

  const db = await lancedb.connect(LANCEDB_DIR);
  await db.createTable(TABLE_NAME, rows, { mode: 'overwrite' });
  await writeFile(MANIFEST_PATH, JSON.stringify({
    digest,
    indexedAt: new Date().toISOString(),
    blocks: rows.length,
    model,
    fallbackEmbeddings,
  }, null, 2));

  let atlas = null;
  if (recomputeAtlas) atlas = await computeAtlas({ rows });
  return { ok: true, skipped: false, blocks: rows.length, digest, model, fallbackEmbeddings, atlas: Boolean(atlas) };
}

function lexicalScore(query, block) {
  const words = new Set(String(query || '').toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) || []);
  if (words.size === 0) return 0;
  const title = String(block.title || '').toLowerCase();
  const dek = String(block.dek || '').toLowerCase();
  const body = String(block.body || '').toLowerCase();
  const hay = `${title} ${dek} ${body} ${block.text}`.toLowerCase();
  let score = 0;
  for (const word of words) {
    if (title.includes(word)) score += word.length > 3 ? 12 : 4;
    if (dek.includes(word)) score += word.length > 3 ? 8 : 3;
    if (body.includes(word)) score += word.length > 3 ? 3 : 1;
    if (hay.includes(word)) score += word.length > 3 ? 2 : 1;
  }
  const phrase = String(query || '').toLowerCase().trim();
  if (phrase && title.includes(phrase)) score += 80;
  if (phrase && dek.includes(phrase)) score += 50;
  if (phrase && body.includes(phrase)) score += 20;
  if (phrase && hay.includes(phrase)) score += 12;
  return score;
}

export async function retrieveBlocks(query, topK = 8) {
  const manifest = await readJson(MANIFEST_PATH, null);
  const blocks = await loadBlocks();
  const digest = corpusDigest(blocks);
  if (!manifest || manifest.digest !== digest) await reindex({ force: false, recomputeAtlas: false });

  const embedded = await embedText(query);
  const lexical = blocks
    .map((block) => ({ ...block, _lexical: lexicalScore(query, block) }))
    .sort((a, b) => b._lexical - a._lexical)
    .slice(0, topK);

  try {
    const table = await openOrCreateTable();
    if (!table) throw new Error('missing LanceDB table');
    const vectorHits = await table.vectorSearch(embedded.vector).limit(Math.max(topK, 12)).toArray();
    const merged = new Map();
    for (const hit of vectorHits) merged.set(hit.id, { ...hit, score: Number(hit._distance ?? 0), source: 'vector' });
    for (const hit of lexical) {
      const prior = merged.get(hit.id);
      merged.set(hit.id, {
        ...(prior || hit),
        id: hit.id,
        channel: hit.channel,
        channelName: hit.channelName,
        type: hit.type,
        title: hit.title,
        dek: hit.dek,
        body: hit.body,
        timestamp: hit.timestamp,
        mood: hit.mood || '',
        path: hit.path,
        url: hit.url,
        text: hit.text,
        lexicalScore: hit._lexical,
        source: prior ? 'vector+lexical' : 'lexical',
      });
    }
    return [...merged.values()]
      .sort((a, b) => (Number(b.lexicalScore || 0) - Number(a.lexicalScore || 0)) || (Number(a.score || 0) - Number(b.score || 0)))
      .slice(0, topK);
  } catch {
    return lexical.slice(0, topK);
  }
}

async function toneGuide() {
  const nowPath = join(REPO_ROOT, 'src/pages/now.astro');
  const now = existsSync(nowPath) ? (await readFile(nowPath, 'utf8')).slice(0, 1800) : '';
  const recent = await loadRecentBlocks(5);
  const frontDoor = (await loadBlocks()).filter((b) => b.channel === 'FD').slice(0, 3);
  const samples = [...frontDoor, ...recent]
    .map((b) => `${b.id} ${b.title}: ${compactSnippet(b.dek || b.body || b.text, 260)}`)
    .join('\n');

  return [
    'PointCast voice: precise, alive, lightly ritual, operationally honest.',
    'Short declarative sentences are welcome. Cite the block. No fake certainty.',
    'Use the site language when it is in the sources: block, chamber, wing, surface, receipt, front door.',
    now && `Now-page source texture:\n${compactSnippet(now, 700)}`,
    samples && `Recent/front-door samples:\n${samples}`,
  ].filter(Boolean).join('\n\n');
}

export async function answerQuestion(question) {
  const hits = await retrieveBlocks(question, 8);
  const context = hits.map((hit, idx) => [
    `[${idx + 1}] ${hit.path} | ${hit.title} | CH.${hit.channel} | ${hit.timestamp || ''}`,
    compactSnippet(hit.body || hit.text, 1400),
  ].join('\n')).join('\n\n');

  const system = `${await toneGuide()}\n\nAnswer only from the provided PointCast block context. Include inline citations as Markdown links to /b/0XXX. If evidence is thin, say what is thin.`;
  const user = `Question: ${question}\n\nContext:\n${context}`;
  const response = await chat([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);

  let answer = response.content || extractiveAnswer(question, hits);
  const cited = new Set([...answer.matchAll(/\/b\/(\d{4})/g)].map((m) => m[1]));
  const receipts = hits.slice(0, 3).filter((hit) => !cited.has(hit.id));
  if (cited.size < 3 && receipts.length > 0) {
    answer += `\n\nReceipts: ${receipts.map((hit) => `[${hit.path}](${hit.path})`).join(', ')}.`;
  }
  return {
    ok: true,
    question,
    answer,
    citations: hits.map((hit) => ({
      id: hit.id,
      title: hit.title,
      path: hit.path,
      url: hit.url,
      channel: hit.channel,
      snippet: compactSnippet(hit.body || hit.text, 260),
    })),
    model: response.model,
    fallback: response.fallback,
  };
}

function extractiveAnswer(question, hits) {
  if (hits.length === 0) {
    return `I do not have a block receipt for that yet.`;
  }
  const lead = hits[0];
  const clean = (text, max = 280) => compactSnippet(text, max)
    .replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(\/b\/\d{4}\)/g, '$1');
  const trail = hits.slice(0, 4).map((hit) => {
    const snippet = clean(hit.dek || hit.body || hit.text);
    return `- ${hit.title}: ${snippet} [${hit.path}](${hit.path})`;
  }).join('\n');
  return [
    `The block trail points to ${lead.title}. ${clean(lead.dek || lead.body || lead.text, 360)} [${lead.path}](${lead.path}).`,
    '',
    `Supporting receipts:`,
    trail,
  ].join('\n');
}

function seededRandom(seed = 42) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizePoints(points) {
  if (!points.length) return [];
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = maxX - minX || 1;
  const sy = maxY - minY || 1;
  return points.map(([x, y]) => ({
    x: (x - minX) / sx,
    y: (y - minY) / sy,
  }));
}

function gridProjection(rows) {
  const byChannel = new Map();
  for (const row of rows) {
    const list = byChannel.get(row.channel) || [];
    list.push(row);
    byChannel.set(row.channel, list);
  }
  const channels = [...byChannel.keys()].sort();
  const cols = Math.ceil(Math.sqrt(channels.length));
  const points = [];
  for (let ci = 0; ci < channels.length; ci += 1) {
    const channel = channels[ci];
    const list = byChannel.get(channel);
    const cx = (ci % cols + 0.5) / cols;
    const cy = (Math.floor(ci / cols) + 0.5) / Math.ceil(channels.length / cols);
    for (let i = 0; i < list.length; i += 1) {
      const angle = (i / Math.max(1, list.length)) * Math.PI * 2;
      const radius = 0.04 + (i % 7) * 0.006;
      points.push({ id: list[i].id, x: Math.min(0.98, Math.max(0.02, cx + Math.cos(angle) * radius)), y: Math.min(0.98, Math.max(0.02, cy + Math.sin(angle) * radius)) });
    }
  }
  return points;
}

async function loadRowsFromTable() {
  const table = await openOrCreateTable();
  if (!table) return [];
  return table.query().limit(10_000).toArray();
}

export async function computeAtlas({ rows = null } = {}) {
  await ensureDirs();
  const tableRows = rows || await loadRowsFromTable();
  if (!tableRows.length) return null;

  let coords;
  try {
    const vectors = tableRows.map((row) => row.vector);
    const umap = new UMAP({
      nComponents: 2,
      nNeighbors: Math.max(3, Math.min(15, Math.floor(tableRows.length / 4))),
      minDist: 0.08,
      random: seededRandom(20260506),
    });
    coords = normalizePoints(umap.fit(vectors)).map((point, idx) => ({ id: tableRows[idx].id, ...point }));
  } catch {
    coords = gridProjection(tableRows);
  }

  const coordById = new Map(coords.map((p) => [p.id, p]));
  const points = tableRows.map((row) => {
    const point = coordById.get(row.id) || { x: 0.5, y: 0.5 };
    return {
      id: row.id,
      title: row.title,
      channel: row.channel,
      channelName: row.channelName,
      type: row.type,
      mood: row.mood || '',
      path: row.path,
      timestamp: row.timestamp,
      text: compactSnippet(`${row.title} ${row.dek || ''} ${row.body || ''}`, 360),
      x: point.x,
      y: point.y,
      cluster: row.channel,
    };
  });

  const clusters = await labelClusters(points);
  const atlas = {
    ok: true,
    generatedAt: new Date().toISOString(),
    pointCount: points.length,
    method: 'umap-js over LanceDB vectors',
    points,
    clusters,
  };
  await writeFile(ATLAS_LOCAL_PATH, JSON.stringify(atlas, null, 2));
  await writeFile(ATLAS_PUBLIC_PATH, JSON.stringify(atlas, null, 2));
  return atlas;
}

async function labelClusters(points) {
  const groups = new Map();
  for (const point of points) {
    const list = groups.get(point.cluster) || [];
    list.push(point);
    groups.set(point.cluster, list);
  }
  const clusters = [];
  for (const [cluster, list] of groups) {
    const titles = list.slice(0, 12).map((p) => p.title).join('; ');
    const fallback = list[0]?.channelName || cluster;
    let label = fallback;
    if (process.env.POINTCAST_LABEL_CLUSTERS !== '0') {
      const response = await chat([
        { role: 'system', content: 'Name this PointCast cluster in 2-3 words. Return only the label.' },
        { role: 'user', content: titles },
      ], { temperature: 0.1, timeoutMs: 25_000 });
      if (response.content && !response.fallback) label = response.content.replace(/[".]/g, '').slice(0, 40);
    }
    clusters.push({
      id: cluster,
      label,
      count: list.length,
      cx: list.reduce((sum, p) => sum + p.x, 0) / list.length,
      cy: list.reduce((sum, p) => sum + p.y, 0) / list.length,
    });
  }
  return clusters.sort((a, b) => b.count - a.count);
}

export async function readAtlas() {
  return await readJson(ATLAS_LOCAL_PATH, null) || await readJson(ATLAS_PUBLIC_PATH, null);
}

export async function resetOracle() {
  await rm(ORACLE_DIR, { recursive: true, force: true });
  await rm(LANCEDB_DIR, { recursive: true, force: true });
}

export function localCommandExists(command) {
  const result = spawnSync('which', [command], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}
