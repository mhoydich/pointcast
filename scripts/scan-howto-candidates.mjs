#!/usr/bin/env node
/**
 * scan-howto-candidates.mjs — find READ blocks whose bodies look like
 * how-to guides and flag them for HowTo schema retrofit.
 *
 * Strategy: a READ block is a HowTo candidate if its body contains any
 * of these shapes:
 *   1. An ordered list with 3+ steps ("1.", "2.", "3." or "Step 1:", etc.)
 *   2. 3+ H2/H3 markdown headings that read like imperatives
 *     ("Install the dependencies", "Configure the gateway", "Verify")
 *   3. Frontmatter meta.howto.steps already present (just a count check)
 *
 * Output: table of candidates sorted by confidence, with suggested
 * HowTo field seeds Mike can paste into the block JSON.
 *
 * Usage:
 *   node scripts/scan-howto-candidates.mjs                # human-readable
 *   node scripts/scan-howto-candidates.mjs --json         # JSON for piping
 *   node scripts/scan-howto-candidates.mjs --min=0.5      # confidence filter
 *
 * Does NOT modify any block files. Designed for triage — Mike decides
 * which to retrofit.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BLOCKS_DIR = join(ROOT, 'src/content/blocks');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const minArg = argv.find((a) => a.startsWith('--min='));
const MIN = minArg ? Number(minArg.split('=')[1]) : 0.35;

/** Count ordered-list steps. Matches "1." / "1)" / "Step 1:" etc. */
function countNumberedSteps(body) {
  const lines = body.split('\n');
  let steps = 0;
  for (const line of lines) {
    if (/^\s*(\d+[.)]|step\s+\d+[:.\-])/i.test(line)) steps += 1;
  }
  return steps;
}

/** Count imperative headings (H2 / H3 starting with a verb). */
function countImperativeHeadings(body) {
  const impStart = /^(#{2,3})\s+(install|configure|create|set|run|build|deploy|verify|test|write|add|enable|setup|open|save|download|upload|connect|start|stop|switch|fetch|publish|ship|claim|mint|play)/im;
  let count = 0;
  const lines = body.split('\n');
  for (const line of lines) {
    if (impStart.test(line)) count += 1;
  }
  return count;
}

/** Detect explicit "How to X" framing in title or first paragraph. */
function hasHowToFraming(title, body) {
  const firstPara = body.split(/\n\s*\n/, 1)[0] ?? '';
  return /how to|step[- ]by[- ]step|guide to|walkthrough|tutorial|checklist/i.test(title + ' ' + firstPara);
}

/** Extract step candidates for schema seeding. */
function extractSteps(body) {
  const lines = body.split('\n');
  const steps = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const numMatch = line.match(/^\s*(\d+[.)])\s+(.*)$/);
    const stepMatch = line.match(/^\s*step\s+\d+[:.\-]\s*(.*)$/i);
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);

    if (numMatch || stepMatch) {
      if (current) steps.push(current);
      const text = numMatch ? numMatch[2] : stepMatch[1];
      // Split "Name — description" or "Name: description" into name + text
      const split = text.match(/^(\*\*)?(.+?)\1?[.:—-]\s+(.+)$/);
      current = split
        ? { name: split[2].replace(/\*\*/g, '').trim(), text: split[3].trim() }
        : { name: text.slice(0, 60), text };
    } else if (headingMatch && /^(install|configure|create|set|run|build|deploy|verify|test|write|add|enable|setup)/i.test(headingMatch[2])) {
      if (current) steps.push(current);
      current = { name: headingMatch[2].trim(), text: '' };
    } else if (current && line.trim()) {
      current.text = (current.text + ' ' + line.trim()).trim();
    } else if (current && !line.trim()) {
      if (current.text) {
        steps.push(current);
        current = null;
      }
    }
  }
  if (current) steps.push(current);

  // De-dupe, trim, and cap step count to reasonable max.
  return steps
    .map((s) => ({
      name: s.name.slice(0, 80),
      text: (s.text || s.name).slice(0, 400),
    }))
    .filter((s, i, arr) => i === arr.findIndex((x) => x.name === s.name))
    .slice(0, 8);
}

// ─── Scan ────────────────────────────────────────────────────────────────────
const files = readdirSync(BLOCKS_DIR).filter((f) => f.endsWith('.json'));
const candidates = [];

for (const f of files) {
  let data;
  try { data = JSON.parse(readFileSync(join(BLOCKS_DIR, f), 'utf8')); }
  catch { continue; }
  if (data?.draft) continue;
  if (data?.type !== 'READ') continue;

  const body = data.body ?? '';
  if (body.length < 400) continue;

  const already = data?.meta?.format === 'howto';
  if (already) {
    candidates.push({
      id: data.id,
      title: data.title,
      already: true,
      confidence: 1,
      numberedSteps: countNumberedSteps(body),
      impHeadings: countImperativeHeadings(body),
      howToFraming: hasHowToFraming(data.title, body),
      extractedSteps: (data.meta?.howto?.steps ?? []).length,
    });
    continue;
  }

  const numbered = countNumberedSteps(body);
  const impHeadings = countImperativeHeadings(body);
  const framing = hasHowToFraming(data.title, body);

  // Confidence: mix of signals. Max 1.0.
  let confidence = 0;
  if (numbered >= 3) confidence += 0.45;
  else if (numbered >= 2) confidence += 0.2;
  if (impHeadings >= 3) confidence += 0.3;
  else if (impHeadings >= 2) confidence += 0.15;
  if (framing) confidence += 0.3;
  confidence = Math.min(1, confidence);

  if (confidence < MIN) continue;

  const extracted = extractSteps(body);

  candidates.push({
    id: data.id,
    title: data.title,
    channel: data.channel,
    already: false,
    confidence,
    numberedSteps: numbered,
    impHeadings,
    howToFraming: framing,
    extractedSteps: extracted,
  });
}

candidates.sort((a, b) => b.confidence - a.confidence);

// ─── Output ──────────────────────────────────────────────────────────────────
if (asJson) {
  console.log(JSON.stringify(candidates, null, 2));
  process.exit(0);
}

console.log(`[howto-scan] scanned ${files.length} blocks · ${candidates.length} candidates at confidence ≥ ${MIN}\n`);

const already = candidates.filter((c) => c.already);
const pending = candidates.filter((c) => !c.already);

if (already.length > 0) {
  console.log(`── Already flagged as HowTo (${already.length})`);
  for (const c of already) {
    console.log(`  ✓ ${c.id} · ${c.title} (${c.extractedSteps} steps in schema)`);
  }
  console.log('');
}

if (pending.length === 0) {
  console.log('No new candidates. All eligible blocks are already HowTo-flagged.');
  process.exit(0);
}

console.log(`── Candidates to retrofit (${pending.length}), ordered by confidence:\n`);

for (const c of pending) {
  const bar = '█'.repeat(Math.round(c.confidence * 20)).padEnd(20, '░');
  console.log(`  ${c.id} · CH.${c.channel} · conf=${c.confidence.toFixed(2)} ${bar}`);
  console.log(`    title: ${c.title}`);
  const signals = [];
  if (c.numberedSteps > 0) signals.push(`${c.numberedSteps} numbered steps`);
  if (c.impHeadings > 0) signals.push(`${c.impHeadings} imperative headings`);
  if (c.howToFraming) signals.push('how-to framing');
  console.log(`    signals: ${signals.join(' · ')}`);
  console.log(`    extracted ${c.extractedSteps.length} step${c.extractedSteps.length === 1 ? '' : 's'}:`);
  for (const [i, s] of c.extractedSteps.entries()) {
    const line = `      ${i + 1}. ${s.name}`;
    console.log(line.length > 120 ? line.slice(0, 117) + '…' : line);
  }

  // Emit a paste-ready meta.howto skeleton.
  const skeleton = {
    format: 'howto',
    howto: {
      name: c.title,
      description: '<< 1-2 sentence overview of what this guide accomplishes >>',
      totalTime: '<< ISO 8601 duration, e.g. PT30M >>',
      supplies: [],
      tools: [],
      steps: c.extractedSteps.map((s) => ({ name: s.name, text: s.text })),
    },
  };
  console.log(`    --- paste-ready meta patch for src/content/blocks/${c.id}.json ---`);
  console.log(JSON.stringify(skeleton, null, 2).split('\n').map((l) => '      ' + l).join('\n'));
  console.log('');
}

console.log(`[howto-scan] done · copy meta patches into each block's "meta" field and build — HowTo schema fires automatically.`);
