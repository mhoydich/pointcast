import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
export const BLOCKS_DIR = join(REPO_ROOT, 'src/content/blocks');

const CHANNEL_NAMES = {
  FD: 'Front Door',
  CRT: 'Court',
  SPN: 'Spinning',
  GF: 'Good Feels',
  GDN: 'Garden',
  ESC: 'El Segundo',
  FCT: 'Faucet',
  VST: 'Visit',
  BTL: 'Battler',
  BDY: 'Birthday',
};

export function blockUrl(id) {
  return `https://pointcast.xyz/b/${id}`;
}

export function blockPath(id) {
  return `/b/${id}`;
}

export function stableHash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stringifyMeta(meta) {
  if (!meta || typeof meta !== 'object') return '';
  return Object.entries(meta)
    .map(([key, value]) => {
      if (value == null) return '';
      if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
      if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${String(value)}`;
    })
    .filter(Boolean)
    .join('\n');
}

function normalizeBlock(raw, filePath) {
  const id = String(raw.id || '').padStart(4, '0');
  const channel = raw.channel || 'FD';
  const type = raw.type || 'READ';
  const title = raw.title || `Block ${id}`;
  const dek = raw.dek || '';
  const body = raw.body || '';
  const metaText = stringifyMeta(raw.meta);
  const companions = Array.isArray(raw.companions)
    ? raw.companions.map((c) => [c.label, c.id].filter(Boolean).join(' ')).join('\n')
    : '';
  const text = [
    `PointCast block ${id}`,
    `Channel: ${channel} (${CHANNEL_NAMES[channel] || channel})`,
    `Type: ${type}`,
    `Title: ${title}`,
    dek && `Dek: ${dek}`,
    body,
    metaText && `Meta:\n${metaText}`,
    companions && `Companions:\n${companions}`,
  ].filter(Boolean).join('\n\n');

  return {
    id,
    channel,
    channelName: CHANNEL_NAMES[channel] || channel,
    type,
    title,
    dek,
    body,
    timestamp: raw.timestamp || null,
    author: raw.author || 'cc',
    mood: raw.mood || null,
    source: raw.source || null,
    media: raw.media || null,
    external: raw.external || null,
    meta: raw.meta || null,
    path: blockPath(id),
    url: blockUrl(id),
    filePath,
    relativePath: relative(REPO_ROOT, filePath),
    text,
    digest: stableHash(JSON.stringify({ id, channel, type, title, dek, body, meta: raw.meta || null, timestamp: raw.timestamp || null })),
  };
}

export async function loadBlocks({ includeDrafts = false } = {}) {
  if (!existsSync(BLOCKS_DIR)) return [];
  const names = (await readdir(BLOCKS_DIR))
    .filter((name) => /^\d{4}\.json$/.test(name))
    .sort();

  const blocks = [];
  for (const name of names) {
    const filePath = join(BLOCKS_DIR, name);
    try {
      const raw = JSON.parse(await readFile(filePath, 'utf8'));
      if (!includeDrafts && raw.draft) continue;
      blocks.push(normalizeBlock(raw, filePath));
    } catch (error) {
      console.warn(`[oracle] skipped ${name}: ${error.message}`);
    }
  }

  return blocks.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
}

export async function loadRecentBlocks(count = 5) {
  return (await loadBlocks()).slice(0, count);
}

export async function nextBlockId() {
  const blocks = await loadBlocks({ includeDrafts: true });
  const max = blocks.reduce((n, block) => Math.max(n, Number(block.id) || 0), 0);
  return String(max + 1).padStart(4, '0');
}

export function corpusDigest(blocks) {
  return stableHash(blocks.map((block) => `${block.id}:${block.digest}`).join('\n'));
}

export function compactSnippet(text, max = 900) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
