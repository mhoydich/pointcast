#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, nextBlockId } from './lib/oracle-blocks.mjs';
import { localCommandExists } from './lib/oracle-rag.mjs';

const STATE_DIR = join(REPO_ROOT, '.pointcast/resident');
const RUN_DIR = join(STATE_DIR, 'runs');
const STATUS_PATH = join(STATE_DIR, 'status.json');
const MAX_TASK_MS = 90 * 60 * 1000;
const SLEEP_MS = 30 * 60 * 1000;

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 60_000,
    input: options.input,
    maxBuffer: options.maxBuffer || 30 * 1024 * 1024,
    stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
  });
}

async function readStatus() {
  try {
    return JSON.parse(await readFile(STATUS_PATH, 'utf8'));
  } catch {
    return { runs: [], successCount: 0, failCount: 0, computeHours: 0 };
  }
}

async function writeStatus(update) {
  await mkdir(STATE_DIR, { recursive: true });
  const prior = await readStatus();
  const merged = { ok: true, ...prior, ...update, updatedAt: new Date().toISOString() };
  await writeFile(STATUS_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

async function loadJoinSystem() {
  const source = await readFile(join(REPO_ROOT, 'src/lib/join-system.ts'), 'utf8');
  const js = source
    .replace(/\nexport type [\s\S]*$/m, '')
    .replace(/^export const JOIN_SYSTEM\s*=/m, 'return')
    .replace(/\s+as const;\s*$/m, ';');
  return Function(js)();
}

function estimateMinutes(estimate = '') {
  const text = String(estimate).toLowerCase();
  const nums = text.match(/\d+/g)?.map(Number) || [];
  if (nums.length === 0) return 90;
  const multiplier = /week/.test(text) ? 7 * 24 * 60
    : /day/.test(text) ? 24 * 60
      : /\bhr\b|hour/.test(text) ? 60
        : 1;
  return Math.max(...nums) * multiplier;
}

function refuses(task) {
  const text = `${task.id} ${task.ask} ${task.artifact}`.toLowerCase();
  if (/secret|token|password|private key|credential|\.env/.test(text)) return 'touches secrets or credentials';
  if (/push.+main|main.+push|deploy.+main/.test(text)) return 'pushes to main without review';
  if (estimateMinutes(task.estimate) > 90) return 'exceeds 90 minute max';
  return '';
}

function pickTask(tasks, { skipIds = new Set() } = {}) {
  const candidates = tasks
    .filter((task) => task.lane === 'agent' && task.status === 'open' && !skipIds.has(task.id))
    .map((task) => ({ task, refusal: refuses(task) }));
  const allowed = candidates.filter((c) => !c.refusal).map((c) => c.task);
  allowed.sort((a, b) => {
    const aScore = (/codex/i.test(a.owner || '') ? 0 : 1) + estimateMinutes(a.estimate) / 100;
    const bScore = (/codex/i.test(b.owner || '') ? 0 : 1) + estimateMinutes(b.estimate) / 100;
    return aScore - bScore;
  });
  return { task: allowed[0] || null, refused: candidates.filter((c) => c.refusal) };
}

function claudeCommand() {
  const envBin = process.env.CLAUDE_CODE_BIN;
  if (envBin) return envBin;
  return localCommandExists('claude-code') || localCommandExists('claude');
}

function promptFor(task) {
  return [
    `You are the overnight PointCast resident working one join-system ticket.`,
    `Ticket id: ${task.id}`,
    `Project: ${task.project}`,
    `Ask: ${task.ask}`,
    `Expected artifact: ${task.artifact}`,
    `Time budget: max 90 minutes. Stop earlier if the artifact is coherent.`,
    ``,
    `Guardrails:`,
    `- Do not read, print, edit, or create secrets, tokens, private keys, .env files, or credential stores.`,
    `- Do not push to main or deploy. Leave changes in the worktree for review.`,
    `- Keep the artifact small enough to review in one sitting.`,
    `- Write a short final summary naming every file you changed.`,
  ].join('\n');
}

async function writeRunBlock(run) {
  const id = await nextBlockId();
  const path = join(REPO_ROOT, `src/content/blocks/${id}.json`);
  const body = [
    `Resident run finished for join-system ticket \`${run.taskId}\`.`,
    ``,
    `Status: ${run.success ? 'success' : 'failed'}. Runtime: ${run.minutes.toFixed(1)} minutes.`,
    ``,
    run.summary || 'No summary captured.',
    ``,
    run.artifacts?.length ? `Artifacts: ${run.artifacts.join(', ')}.` : 'Artifacts: none detected.',
    ``,
    `Run log: ${run.logPath}.`,
  ].join('\n');
  const block = {
    id,
    channel: 'VST',
    type: 'READ',
    title: `Resident run · ${run.taskId}`,
    dek: `Overnight resident loop ${run.success ? 'finished' : 'failed'} ${run.taskId}.`,
    timestamp: new Date().toISOString(),
    size: '2x1',
    noun: Number(id),
    readingTime: '2 min',
    body,
    author: 'codex',
    source: 'scripts/resident.mjs local resident loop',
    mood: 'resident-run',
    meta: {
      series: 'resident loop',
      task: run.taskId,
      success: run.success,
      logPath: run.logPath,
      artifacts: run.artifacts || [],
    },
  };
  await writeFile(path, `${JSON.stringify(block, null, 2)}\n`);
  return { id, path };
}

function changedFiles(before, after) {
  const prior = new Set(before.split('\n').filter(Boolean));
  return after.split('\n').filter(Boolean).filter((line) => !prior.has(line)).map((line) => line.replace(/^.. /, '').trim());
}

async function fallbackArtifact(task) {
  const date = new Date().toISOString().slice(0, 10);
  const slug = task.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const path = join(REPO_ROOT, `docs/briefs/${date}-resident-${slug}.md`);
  const text = [
    `# Resident fallback brief - ${task.id}`,
    ``,
    `Claude Code was not available on this machine, so the resident loop produced the smallest reviewable artifact directly.`,
    ``,
    `## Ask`,
    task.ask,
    ``,
    `## Artifact Target`,
    task.artifact,
    ``,
    `## Proposed First Pass`,
    `Ship one static, source-linked artifact first. Keep scraping out of scope unless a human approves sources. Preserve privacy and permission gates before public profile work.`,
    ``,
    `## Guardrails`,
    `No secrets. No main push. Review before publish.`,
  ].join('\n');
  await mkdir(join(REPO_ROOT, 'docs/briefs'), { recursive: true });
  await writeFile(path, `${text}\n`);
  return path;
}

async function runOnce() {
  await mkdir(RUN_DIR, { recursive: true });
  const priorStatus = await readStatus();
  const completed = new Set((priorStatus.runs || []).filter((run) => run.success).map((run) => run.taskId));
  const board = await loadJoinSystem();
  const { task, refused } = pickTask(board.claimableTasks, { skipIds: completed });
  if (!task) {
    await writeStatus({ running: false, currentTask: null, refused, note: 'No feasible open agent task.' });
    return;
  }

  await writeStatus({ running: true, currentTask: task, refused, startedAt: new Date().toISOString() });
  const before = run('git', ['status', '--short']).stdout;
  const started = Date.now();
  const bin = claudeCommand();
  let stdout = '';
  let stderr = '';
  let status = 0;
  let command = bin || 'resident-fallback';
  let fallbackPath = null;

  if (bin) {
    const isClaude = /(^|\/)claude$/.test(bin);
    const args = process.env.CLAUDE_CODE_ARGS
      ? process.env.CLAUDE_CODE_ARGS.split(/\s+/).filter(Boolean)
      : isClaude ? ['-p', promptFor(task)] : [];
    const result = run(bin, args, { input: isClaude ? undefined : promptFor(task), timeout: MAX_TASK_MS, maxBuffer: 80 * 1024 * 1024 });
    stdout = result.stdout || '';
    stderr = result.stderr || '';
    status = result.status ?? 1;
  } else {
    fallbackPath = await fallbackArtifact(task);
    stdout = `Created fallback artifact ${fallbackPath}`;
  }

  const after = run('git', ['status', '--short']).stdout;
  const artifacts = changedFiles(before, after);
  const fallbackRel = fallbackPath ? fallbackPath.replace(`${REPO_ROOT}/`, '') : null;
  if (fallbackRel && !artifacts.includes(fallbackRel)) artifacts.push(fallbackRel);

  const minutes = (Date.now() - started) / 60_000;
  const logName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${task.id}.log`;
  const logPath = join(RUN_DIR, logName);
  await writeFile(logPath, [
    `task: ${task.id}`,
    `command: ${command}`,
    `status: ${status}`,
    `started: ${new Date(started).toISOString()}`,
    `minutes: ${minutes.toFixed(2)}`,
    ``,
    `--- stdout ---`,
    stdout,
    ``,
    `--- stderr ---`,
    stderr,
  ].join('\n'));

  const success = status === 0 && artifacts.length > 0;
  const runRecord = {
    taskId: task.id,
    project: task.project,
    success,
    status,
    minutes,
    command,
    artifacts,
    logPath: logPath.replace(`${REPO_ROOT}/`, ''),
    summary: stdout.trim().slice(-2000),
    finishedAt: new Date().toISOString(),
  };
  const block = await writeRunBlock(runRecord);
  runRecord.blockId = block.id;
  runRecord.blockPath = `/b/${block.id}`;

  const prior = await readStatus();
  const runs = [runRecord, ...(prior.runs || [])].slice(0, 10);
  await writeStatus({
    running: false,
    currentTask: null,
    runs,
    successCount: (prior.successCount || 0) + (success ? 1 : 0),
    failCount: (prior.failCount || 0) + (success ? 0 : 1),
    computeHours: Number(((prior.computeHours || 0) + minutes / 60).toFixed(3)),
  });
}

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const hoursArg = rawArgs.find((arg) => arg.startsWith('--hours='));
const maxRuntimeMs = hoursArg ? Math.max(0, Number(hoursArg.slice('--hours='.length)) || 0) * 60 * 60 * 1000 : null;

if (args.has('--once')) {
  await runOnce();
} else {
  const stopAt = maxRuntimeMs == null ? Infinity : Date.now() + maxRuntimeMs;
  while (Date.now() < stopAt) {
    await runOnce().catch(async (error) => {
      const prior = await readStatus();
      await writeStatus({
        running: false,
        currentTask: null,
        failCount: (prior.failCount || 0) + 1,
        lastError: error.message,
      });
    });
    if (Date.now() + SLEEP_MS > stopAt) break;
    await new Promise((resolve) => setTimeout(resolve, SLEEP_MS));
  }
  if (maxRuntimeMs != null) {
    await writeStatus({ running: false, currentTask: null, note: `Resident window ended after ${(maxRuntimeMs / 3600000).toFixed(1)} hours.` });
  }
}
