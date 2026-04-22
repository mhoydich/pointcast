#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetPath = path.resolve(__dirname, '../public/.well-known/agent-skills/index.json');

const sha256Hex = (value) => createHash('sha256').update(value).digest('hex');

async function hashSkill(skill) {
  if (skill.type === 'websocket') {
    return {
      ...skill,
      sha256: sha256Hex(skill.url),
      sha256_kind: 'url-string',
    };
  }

  try {
    const response = await fetch(skill.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body = Buffer.from(await response.arrayBuffer());
    return {
      ...skill,
      sha256: sha256Hex(body),
      sha256_kind: 'content',
    };
  } catch (error) {
    console.error(`warning: ${skill.name} fetch failed for ${skill.url}; hashing url string instead (${error.message})`);
    return {
      ...skill,
      sha256: sha256Hex(skill.url),
      sha256_kind: 'url-string-fallback',
    };
  }
}

async function main() {
  const raw = await readFile(targetPath, 'utf8');
  const data = JSON.parse(raw);
  let content = 0;
  let urlString = 0;
  let fallback = 0;

  data.skills = await Promise.all(
    data.skills.map(async (skill) => {
      const hashed = await hashSkill(skill);
      if (hashed.sha256_kind === 'content') content += 1;
      if (hashed.sha256_kind === 'url-string') urlString += 1;
      if (hashed.sha256_kind === 'url-string-fallback') fallback += 1;
      return hashed;
    })
  );

  await writeFile(targetPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`hashed ${data.skills.length} skills: ${content} content, ${urlString} url-string, ${fallback} fallback`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
