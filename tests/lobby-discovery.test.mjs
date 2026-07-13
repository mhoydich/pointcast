import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const agentsManifest = await readFile(new URL('../src/pages/agents.json.ts', import.meta.url), 'utf8');
const forAgents = await readFile(new URL('../src/pages/for-agents.astro', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../src/pages/sitemap-discovery.xml.ts', import.meta.url), 'utf8');

test('agent discovery surfaces advertise the lobby and its JSON contract', () => {
  assert.match(agentsManifest, /lobby: 'https:\/\/pointcast\.xyz\/lobby'/);
  assert.match(agentsManifest, /lobby: 'https:\/\/pointcast\.xyz\/lobby\.json'/);
  assert.match(forAgents, /<code>\/lobby<\/code> \+ <code>\/lobby\.json<\/code>/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/lobby'/);
  assert.match(sitemap, /https:\/\/pointcast\.xyz\/lobby\.json'/);
});
