#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  if (result.error) {
    return { ok: false, stdout: '', stderr: result.error.message };
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function findBlock(source, label) {
  const labelIndex = source.indexOf(`${label}:`);
  if (labelIndex === -1) return '';

  const open = source.indexOf('{', labelIndex);
  if (open === -1) return '';

  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = open; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      return source.slice(open + 1, index);
    }
  }

  return '';
}

function topLevelKeys(block) {
  const keys = [];

  for (const line of block.split('\n')) {
    const match = line.match(/^\s{8}([A-Za-z_$][\w$]*):/);
    if (match) keys.push(match[1]);
  }

  return keys;
}

function duplicates(values) {
  const seen = new Set();
  const dupes = new Set();

  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }

  return [...dupes].sort();
}

function item(ok, label, detail = '') {
  console.log(`- ${ok ? 'OK' : 'CHECK'} ${label}${detail ? `: ${detail}` : ''}`);
  return ok;
}

const rootResult = run('git', ['rev-parse', '--show-toplevel']);

if (!rootResult.ok) {
  console.error('This command must be run from inside the pointcast git repository.');
  process.exit(1);
}

const root = rootResult.stdout;
const requiredFiles = [
  'src/pages/agents.json.ts',
  'src/pages/for-agents.astro',
  'src/pages/feed.json.ts',
  'src/pages/feed.xml.ts',
  'src/pages/editions.json.ts',
  'src/pages/local.json.ts',
  'src/pages/ai-stack.json.ts',
  'public/llms.txt',
  'public/llms-full.txt',
];

console.log('PointCast agent surface audit');
console.log(`Root: ${root}`);

let failed = false;

for (const relativePath of requiredFiles) {
  const path = join(root, relativePath);
  const ok = existsSync(path) && statSync(path).size > 0;
  failed = !item(ok, relativePath, ok ? 'present' : 'missing or empty') || failed;
}

const agentsSource = read(join(root, 'src/pages/agents.json.ts'));
const endpointsBlock = findBlock(agentsSource, 'endpoints');
const humanKeys = topLevelKeys(findBlock(endpointsBlock, 'human'));
const jsonKeys = topLevelKeys(findBlock(endpointsBlock, 'json'));
const humanDupes = duplicates(humanKeys);
const jsonDupes = duplicates(jsonKeys);

failed = !item(!humanDupes.length, 'human endpoint keys are unique', humanDupes.join(', ')) || failed;
failed = !item(!jsonDupes.length, 'json endpoint keys are unique', jsonDupes.join(', ')) || failed;

const requiredHuman = ['forAgents', 'aiStack', 'editions', 'local', 'now'];
const requiredJson = ['agents', 'aiStack', 'editions', 'feed', 'local'];

for (const key of requiredHuman) {
  failed = !item(humanKeys.includes(key), `human endpoint exposes ${key}`) || failed;
}

for (const key of requiredJson) {
  failed = !item(jsonKeys.includes(key), `json endpoint exposes ${key}`) || failed;
}

const forAgents = read(join(root, 'src/pages/for-agents.astro'));
const agentMentions = [
  '/agents.json',
  '/llms.txt',
  '/llms-full.txt',
  '/feed.xml',
  '/feed.json',
];

for (const mention of agentMentions) {
  failed = !item(forAgents.includes(mention), `/for-agents mentions ${mention}`) || failed;
}

if (failed) {
  console.error('\nAgent surface audit failed.');
  process.exit(1);
}

console.log('\nAgent surface audit passed.');
