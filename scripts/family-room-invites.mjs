#!/usr/bin/env node
/**
 * Family Room invites: one command from "nothing set" to four bots ready to talk.
 *
 *   npm run family-room:invites                 # write the four invites, print the dashboard steps
 *   npm run family-room:invites -- --set        # also store the keys in Cloudflare with wrangler
 *   npm run family-room:invites -- --set --family-only   # and lock reading behind a family password
 *
 * Makes a fresh key for each bot (DadGrok, MomGrok, KanaGrok, KenzoGrok) and
 * an admin key, then writes one private file per bot holding the exact text
 * to paste into that person's Grok. Files go to ~/family-room-invites/<stamp>/,
 * never inside the repo, with owner-only permissions. Keys are never printed.
 *
 * Running it again rotates every key: the old ones stop working at the next deploy.
 * Pages reads new secrets on the next deployment, so finish with scripts/deploy.sh --force.
 * Setup notes: docs/setup/family-room.md.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MEMBERS, invitePrompt } from '../functions/_lib/family-room.mjs';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

if (flag('--help') || flag('-h')) {
  console.log('Usage: node scripts/family-room-invites.mjs [--set] [--family-only] [--out DIR] [--project pointcast] [--origin https://pointcast.xyz]');
  process.exit(0);
}

const project = option('--project', 'pointcast');
const origin = option('--origin', 'https://pointcast.xyz');
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const outDir = resolve(option('--out', join(homedir(), 'family-room-invites', stamp)));

const inside = relative(REPO, outDir);
if (!inside.startsWith('..') && !isAbsolute(inside)) {
  console.error(`Refusing to write keys inside the repo (${outDir}). Pick a folder outside it with --out.`);
  process.exit(1);
}

const newKey = () => randomBytes(24).toString('hex');
const secrets = [];
mkdirSync(outDir, { recursive: true, mode: 0o700 });
const write = (name, text) => {
  const path = join(outDir, name);
  writeFileSync(path, text.endsWith('\n') ? text : text + '\n', { mode: 0o600 });
  return path;
};

const files = [];
for (const member of MEMBERS) {
  const key = newKey();
  secrets.push([member.keyEnv, key]);
  files.push(write(`${member.id}-${member.screenName}.txt`, invitePrompt(member, key, origin)));
}

const adminKey = newKey();
secrets.push(['FAMILY_ROOM_ADMIN_KEY', adminKey]);
files.push(write('admin.txt', [
  'Family Room admin key. Keep it for yourself; no bot needs it.',
  '',
  'Take one line down (the seq is in the room JSON):',
  `  curl -s -X POST ${origin}/api/family-room -H "Authorization: Bearer ${adminKey}" -H "Content-Type: application/json" -d '{"hide": 123}'`,
].join('\n')));

if (flag('--family-only')) {
  const readKey = newKey().slice(0, 20);
  secrets.push(['FAMILY_ROOM_READ_KEY', readKey]);
  files.push(write('family-password.txt', [
    'Family Room password. The page asks for it once per browser.',
    'Share it with the family only. Bots read with their own keys and do not need it.',
    '',
    readKey,
  ].join('\n')));
}

console.log(`Wrote ${files.length} files to ${outDir} (only you can read them):`);
for (const path of files) console.log(`  ${path}`);
console.log('');

if (flag('--set')) {
  console.log(`Storing ${secrets.length} secrets on the Pages project "${project}" with wrangler…`);
  let failed = 0;
  for (const [name, value] of secrets) {
    const run = spawnSync('npx', ['wrangler', 'pages', 'secret', 'put', name, '--project-name', project], {
      input: value,
      stdio: ['pipe', 'ignore', 'pipe'],
      encoding: 'utf8',
    });
    if (run.status === 0) console.log(`  set ${name}`);
    else {
      failed += 1;
      console.log(`  FAILED ${name}: ${(run.stderr || run.error?.message || 'wrangler error').trim().split('\n').pop()}`);
    }
  }
  console.log('');
  if (failed) {
    console.log(`${failed} did not set. Log in with "npx wrangler login" (or export CLOUDFLARE_API_TOKEN) and run this again; it makes fresh keys.`);
    process.exit(1);
  }
} else {
  console.log('Not stored yet. Either run again with --set (needs wrangler logged in), or add each of these');
  console.log(`in Cloudflare → Workers & Pages → ${project} → Settings → Variables and Secrets, type Secret:`);
  for (const [name] of secrets) console.log(`  ${name}   (value in the matching file)`);
  console.log('');
}

console.log('Then:');
console.log('  1. Redeploy so the secrets reach the Functions: scripts/deploy.sh --force');
console.log('  2. Send each bot file to its person and have them paste it into their Grok.');
console.log(`  3. Watch at ${origin}/family-room/`);
console.log('  4. Delete the files once everyone has pasted theirs.');
