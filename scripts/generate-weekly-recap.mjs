#!/usr/bin/env node
/**
 * generate-weekly-recap.mjs — content-oriented weekly recap drafter.
 *
 * Complement to functions/cron/weekly-recap.ts (which aggregates live
 * KV stats like drum taps and visits). This script builds the *content*
 * side: a scannable summary of the past 7 days of blocks, grouped by
 * channel, ready to ship as three artifacts:
 *
 *   1. A READ block JSON, writeable to src/content/blocks/{next_id}.json.
 *      Uses the "recap" meta.format so future tooling can identify it.
 *   2. A Markdown newsletter body (suitable for Substack, Mirror,
 *      Paragraph, or anywhere else that accepts Markdown + links).
 *   3. A short social-share version (X thread / Farcaster cast / LinkedIn
 *      post) linking to the READ block permalink.
 *
 * The generator is intentionally deterministic — given the same block
 * set + same cutoff, output is reproducible. Mike can edit the READ
 * block before shipping; the script just saves the first-draft.
 *
 * Usage:
 *   node scripts/generate-weekly-recap.mjs               # last 7 days
 *   node scripts/generate-weekly-recap.mjs --days=14     # custom window
 *   node scripts/generate-weekly-recap.mjs --id=0380     # assign block ID
 *   node scripts/generate-weekly-recap.mjs --write       # write block file + drafts
 *   node scripts/generate-weekly-recap.mjs --stdout      # print-only (default)
 *
 * Outputs when --write:
 *   src/content/blocks/{id}.json          — the READ block, ready to ship
 *   docs/outreach/drafts/recap-{week}.md  — Markdown newsletter body
 *   docs/outreach/drafts/recap-{week}-cast.md — social-share short version
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BLOCKS_DIR = join(ROOT, 'src/content/blocks');
const OUT_DIR = join(ROOT, 'docs/outreach/drafts');

// ─── Args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const DAYS = Number(arg('days', '7'));
const WRITE = flag('write');
const assignedId = arg('id', null);

// ─── Channel metadata (mirror of src/lib/channels.ts keys) ───────────────────
const CHANNELS = {
  FD:  { name: 'Front Door',  slug: 'front-door' },
  CRT: { name: 'Court',       slug: 'court' },
  SPN: { name: 'Spinning',    slug: 'spinning' },
  GF:  { name: 'Good Feels',  slug: 'good-feels' },
  GDN: { name: 'Garden',      slug: 'garden' },
  ESC: { name: 'El Segundo',  slug: 'el-segundo' },
  FCT: { name: 'Faucet',      slug: 'faucet' },
  VST: { name: 'Visit',       slug: 'visit' },
  BTL: { name: 'Battler',     slug: 'battler' },
};

// ─── Load blocks ─────────────────────────────────────────────────────────────
const blockFiles = readdirSync(BLOCKS_DIR).filter((f) => f.endsWith('.json'));
const blocks = blockFiles
  .map((f) => {
    try { return JSON.parse(readFileSync(join(BLOCKS_DIR, f), 'utf8')); }
    catch { return null; }
  })
  .filter(Boolean)
  .filter((b) => !b.draft)
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

if (blocks.length === 0) {
  console.error('[recap] no blocks found in', BLOCKS_DIR);
  process.exit(1);
}

// ─── Compute the recap window ────────────────────────────────────────────────
// Anchor on the most recent block rather than "now", because many dev sessions
// won't have shipped a block today and we want a useful window even in that
// case. The window ends on the most-recent block's day and spans N days back.
const latestDate = new Date(blocks[0].timestamp);
const cutoff = new Date(latestDate);
cutoff.setDate(cutoff.getDate() - DAYS + 1);
cutoff.setHours(0, 0, 0, 0);

const windowBlocks = blocks.filter((b) => new Date(b.timestamp) >= cutoff);

if (windowBlocks.length === 0) {
  console.error(`[recap] no blocks in the last ${DAYS} days (cutoff=${cutoff.toISOString().slice(0,10)})`);
  process.exit(1);
}

// ─── ISO week id for the recap (for filenames + citation format) ─────────────
function getISOWeekId(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-w${String(weekNo).padStart(2, '0')}`;
}
const weekId = getISOWeekId(latestDate);
const startStr = cutoff.toISOString().slice(0, 10);
const endStr = latestDate.toISOString().slice(0, 10);

// ─── Group + rank blocks by channel ──────────────────────────────────────────
const byChannel = {};
for (const b of windowBlocks) {
  (byChannel[b.channel] = byChannel[b.channel] ?? []).push(b);
}

// ─── Pick "headline" blocks: longest READ + editor-flagged feature ───────────
const reads = windowBlocks.filter((b) => b.type === 'READ');
const longestRead = reads.sort((a, b) => (b.body?.length ?? 0) - (a.body?.length ?? 0))[0];
const featured = windowBlocks.filter((b) => b.meta?.featured);

// ─── Count by type ───────────────────────────────────────────────────────────
const typeCounts = windowBlocks.reduce((acc, b) => {
  acc[b.type] = (acc[b.type] ?? 0) + 1;
  return acc;
}, {});

// ─── Decide block ID for the recap ───────────────────────────────────────────
function nextBlockId() {
  const ids = blockFiles
    .map((f) => f.replace(/\.json$/, ''))
    .filter((s) => /^\d{4}$/.test(s))
    .map(Number);
  const max = Math.max(...ids);
  return String(max + 1).padStart(4, '0');
}
const blockId = assignedId ?? nextBlockId();

// ─── Build the READ block JSON ───────────────────────────────────────────────
function channelKicker(code) {
  const ch = CHANNELS[code];
  return ch ? `CH.${code} · ${ch.name}` : code;
}

function blockLine(b, indent = '') {
  const ch = CHANNELS[b.channel];
  const titleEscaped = b.title.replace(/\*/g, '\\*');
  return `${indent}- **[${titleEscaped}](/b/${b.id})** · CH.${b.channel} · ${b.type}${b.dek ? ` — ${b.dek}` : ''}`;
}

const title = `This week on PointCast · ${weekId}`;
const dek = `${windowBlocks.length} blocks across ${Object.keys(byChannel).length} channels, ${startStr} → ${endStr}. ${longestRead?.title ? `Headline: "${longestRead.title}".` : ''}`.trim();

const bodyParts = [];
bodyParts.push(`This is the ${weekId} weekly recap — a scannable index of every Block PointCast shipped between ${startStr} and ${endStr}. ${windowBlocks.length} total pieces across ${Object.keys(byChannel).length} channels. Each link goes to the permanent /b/{id} URL, which is the one to cite.`);

// By-type summary line
const typeSummary = Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([t, n]) => `${n} ${t.toLowerCase()}`)
  .join(' · ');
bodyParts.push(`**By type:** ${typeSummary}.`);

if (longestRead) {
  bodyParts.push(`## Headline\n\n${blockLine(longestRead)}\n\n${longestRead.dek ?? (longestRead.body ?? '').slice(0, 280).replace(/\n+/g, ' ')}…`);
}

if (featured.length > 0) {
  bodyParts.push(`## Editor picks\n\n${featured.map((b) => blockLine(b)).join('\n')}`);
}

bodyParts.push('## By channel\n');
for (const [code, chBlocks] of Object.entries(byChannel).sort((a, b) => b[1].length - a[1].length)) {
  const ch = CHANNELS[code];
  if (!ch) continue;
  bodyParts.push(`### ${channelKicker(code)} · ${chBlocks.length} block${chBlocks.length === 1 ? '' : 's'}\n`);
  bodyParts.push(chBlocks.map((b) => blockLine(b)).join('\n'));
  bodyParts.push('');
}

bodyParts.push('## The back page');
bodyParts.push(`Subscribe via [RSS](/feed.xml), [JSON Feed](/feed.json), or follow [@mhoydich on Farcaster](https://warpcast.com/mhoydich). Every Block is a permanent URL at /b/{id}. New to PointCast? Start at [/manifesto](/manifesto) or the [/agent-native](/agent-native) writeup. Thanks for reading.`);

const body = bodyParts.join('\n\n');

const blockRecord = {
  id: blockId,
  channel: 'FD',
  type: 'READ',
  title,
  dek,
  body,
  timestamp: latestDate.toISOString(),
  size: '2x1',
  readingTime: `${Math.max(2, Math.round(body.split(/\s+/).length / 220))} min`,
  author: 'cc',
  meta: {
    format: 'recap',
    weekId,
    windowStart: startStr,
    windowEnd: endStr,
    blockCount: windowBlocks.length,
    byType: typeCounts,
    series: 'weekly-recap',
  },
};

// ─── Newsletter-style Markdown (mirror of READ block but H1 + metadata) ──────
const newsletterMd = [
  `# ${title}`,
  ``,
  `*${dek}*`,
  ``,
  `Permanent URL: [pointcast.xyz/b/${blockId}](https://pointcast.xyz/b/${blockId})`,
  ``,
  `---`,
  ``,
  body,
  ``,
  `---`,
  ``,
  `*This recap is auto-generated by \`scripts/generate-weekly-recap.mjs\` and edited by MH × Claude Code before publication. Source block: [/b/${blockId}](https://pointcast.xyz/b/${blockId}).*`,
].join('\n');

// ─── Short social-share version ──────────────────────────────────────────────
const topChannel = Object.entries(byChannel).sort((a, b) => b[1].length - a[1].length)[0];
const topChannelLine = topChannel ? `${topChannel[1].length} from CH.${topChannel[0]} · ${CHANNELS[topChannel[0]]?.name}` : '';

const castMd = [
  `# Social-share drafts — weekly recap ${weekId}`,
  ``,
  `Permanent URL: https://pointcast.xyz/b/${blockId}`,
  `Window: ${startStr} → ${endStr}`,
  `Total: ${windowBlocks.length} blocks`,
  ``,
  `## Farcaster cast`,
  ``,
  '```',
  `this week on pointcast · ${weekId}`,
  ``,
  `${windowBlocks.length} blocks · ${typeSummary}`,
  `${topChannelLine}`,
  ``,
  longestRead ? `headline: ${longestRead.title}` : '',
  ``,
  `pointcast.xyz/b/${blockId}`,
  '```',
  ``,
  `## X thread (4 tweets)`,
  ``,
  '```',
  `shipped ${windowBlocks.length} blocks on pointcast.xyz this week 👇`,
  '```',
  ``,
  '```',
  longestRead ? `headline: "${longestRead.title}"\n${longestRead.dek ?? ''}\n\npointcast.xyz/b/${longestRead.id}` : '',
  '```',
  ``,
  '```',
  `by type: ${typeSummary}`,
  ``,
  `by channel: ${Object.entries(byChannel).sort((a,b)=>b[1].length-a[1].length).slice(0,3).map(([c,bs])=>`${bs.length} ${CHANNELS[c]?.name ?? c}`).join(', ')}`,
  '```',
  ``,
  '```',
  `full recap: pointcast.xyz/b/${blockId}`,
  ``,
  `RSS: pointcast.xyz/feed.xml`,
  `JSON: pointcast.xyz/feed.json`,
  '```',
  ``,
  `## LinkedIn short post`,
  ``,
  '```',
  longestRead
    ? `One paragraph from this week on pointcast.xyz:\n\n"${longestRead.title}" — ${longestRead.dek ?? ''}\n\n${windowBlocks.length} total blocks shipped this week (${typeSummary}). Full recap: https://pointcast.xyz/b/${blockId}`
    : `${windowBlocks.length} blocks shipped on pointcast.xyz this week (${typeSummary}).\n\nFull recap: https://pointcast.xyz/b/${blockId}`,
  '```',
].join('\n');

// ─── Emit ────────────────────────────────────────────────────────────────────
if (WRITE) {
  mkdirSync(OUT_DIR, { recursive: true });

  const blockOut = join(BLOCKS_DIR, `${blockId}.json`);
  if (existsSync(blockOut) && !assignedId) {
    console.error(`[recap] ${blockOut} already exists; pass --id=${blockId} to overwrite or pick a new id`);
    process.exit(1);
  }
  writeFileSync(blockOut, JSON.stringify(blockRecord, null, 2) + '\n');
  console.log(`[recap] ✓ wrote block ${blockId} → ${blockOut}`);

  const nlOut = join(OUT_DIR, `recap-${weekId}.md`);
  writeFileSync(nlOut, newsletterMd);
  console.log(`[recap] ✓ wrote newsletter draft → ${nlOut}`);

  const castOut = join(OUT_DIR, `recap-${weekId}-cast.md`);
  writeFileSync(castOut, castMd);
  console.log(`[recap] ✓ wrote social-share drafts → ${castOut}`);

  console.log(`[recap]`);
  console.log(`[recap] next steps:`);
  console.log(`[recap]   1. Edit src/content/blocks/${blockId}.json — polish the body`);
  console.log(`[recap]   2. npm run build:bare — confirm it renders cleanly`);
  console.log(`[recap]   3. Commit + deploy`);
  console.log(`[recap]   4. Post the Farcaster cast / X thread / LinkedIn draft from ${castOut}`);
  console.log(`[recap]   5. (optional) Cross-post ${nlOut} to Substack / Mirror / Paragraph with canonical back to /b/${blockId}`);
} else {
  console.log(`[recap] window: ${startStr} → ${endStr} (${DAYS} days)`);
  console.log(`[recap] ${windowBlocks.length} blocks across ${Object.keys(byChannel).length} channels`);
  console.log(`[recap] proposed block id: ${blockId}`);
  console.log(`[recap] by type: ${typeSummary}`);
  console.log(`[recap]`);
  console.log('─── BLOCK JSON (preview) ─────────────────────────────────────');
  console.log(JSON.stringify({ ...blockRecord, body: blockRecord.body.slice(0, 300) + `\n... (${blockRecord.body.length} chars total)` }, null, 2));
  console.log(`─── re-run with --write to save the block + drafts ───`);
}
