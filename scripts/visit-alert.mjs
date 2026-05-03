#!/usr/bin/env node
/**
 * visit-alert — fire a macOS notification when a real (non-Hawthorne) human
 * lands on PointCast. Designed for the promo window: while you're seeding the
 * site on X / Nextdoor / etc, this is the dopamine drip.
 *
 * State: tmp/visits/_last_human_t.txt holds the highest `t` we've alerted on,
 * so re-runs (cron, manual, restart) never double-fire. Hawthorne entries are
 * filtered out (that's you).
 *
 * Usage:
 *   node scripts/visit-alert.mjs            # one check, exit (cron-friendly)
 *   node scripts/visit-alert.mjs --loop     # poll every 60s in foreground
 *   node scripts/visit-alert.mjs --backfill # mark current state as "seen"
 *                                           # without alerting (use after a gap)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const loop = args.includes('--loop');
const backfill = args.includes('--backfill');

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const visitsDir = resolve(repoRoot, 'tmp/visits');
const stateFile = resolve(visitsDir, '_last_human_t.txt');
const base = process.env.PC_BASE || 'https://pointcast.xyz';

const ensureDir = () => { if (!existsSync(visitsDir)) mkdirSync(visitsDir, { recursive: true }); };

const readLastT = () => {
  if (!existsSync(stateFile)) return 0;
  return Number(readFileSync(stateFile, 'utf8').trim()) || 0;
};

const writeLastT = (t) => {
  ensureDir();
  writeFileSync(stateFile, String(t));
};

const notify = (title, body) => {
  const safe = (s) => s.replace(/"/g, '\\"');
  try {
    execFileSync('osascript', ['-e', `display notification "${safe(body)}" with title "${safe(title)}" sound name "Glass"`]);
  } catch (e) {
    console.error('osascript failed:', e.message);
  }
};

const isYou = (e) => e.city === 'Hawthorne';

const check = async () => {
  const r = await fetch(`${base}/api/visit?t=${Date.now()}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();

  const humans = data.log
    .filter((e) => e.type === 'human' && !isYou(e))
    .sort((a, b) => a.t - b.t);

  if (humans.length === 0) return { fired: 0, total: data.count };

  const lastT = readLastT();

  if (backfill) {
    const newest = humans[humans.length - 1].t;
    writeLastT(newest);
    console.log(`backfilled — last_t set to ${new Date(newest).toISOString()} (${humans.length} humans in window)`);
    return { fired: 0, total: data.count };
  }

  const fresh = humans.filter((e) => e.t > lastT);
  for (const e of fresh) {
    const where = [e.city, e.region, e.country].filter(Boolean).join(', ') || 'unknown';
    const noun = `noun #${e.nounId}`;
    const firsts = e.firsts?.length ? ` ★ ${e.firsts.join(',')}` : '';
    const note = e.note ? ` — "${e.note}"` : '';
    notify(`pointcast visitor${firsts}`, `${where} · ${noun}${note}`);
    console.log(`[alert] ${new Date(e.t).toISOString()} ${where} ${noun}${firsts}${note}`);
  }

  if (fresh.length) writeLastT(fresh[fresh.length - 1].t);
  return { fired: fresh.length, total: data.count };
};

const run = async () => {
  try {
    const r = await check();
    if (!loop) console.log(`checked. fresh=${r.fired} total=${r.total}`);
  } catch (e) {
    console.error('error:', e.message);
  }
};

await run();
if (loop) setInterval(run, 60_000);
