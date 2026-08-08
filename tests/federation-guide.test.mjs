import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('PointCast Federation publishes human, JSON, and Markdown joining surfaces', () => {
  const page = read('src/pages/federation.astro');
  const component = read('src/components/FederationJoinGuide.astro');
  const json = read('src/pages/federation.json.ts');
  const markdown = read('src/pages/federation.md.ts');
  const contract = read('src/lib/federation.ts');

  assert.match(page, /FederationJoinGuide/);
  assert.match(component, /Join the PointCast node/);
  assert.match(component, /Never put private contact information/);
  assert.match(json, /FEDERATION_NODE_TEMPLATE/);
  assert.match(contract, /privateDestinationsStayLocal/);
  assert.match(markdown, /pointcast-federation\.json/);
});

test('federation instructions distinguish receipt states and current boundaries', () => {
  const contract = read('src/lib/federation.ts');
  const collabs = read('src/pages/collabs.json.ts');

  for (const state of ['drafted', 'approved', 'submitted', 'delivered', 'confirmed', 'replied']) {
    assert.match(contract, new RegExp(`'${state}'`));
  }

  assert.match(contract, /human-required/);
  assert.match(contract, /Never publish an email address, phone number, or private handle/);
  assert.match(collabs, /FEDERATION_STEPS/);
  assert.match(collabs, /FEDERATION_RECEIPT_STATES/);
});

test('federation is present in PointCast discovery surfaces', () => {
  const agents = read('src/pages/agents.json.ts');
  const forAgents = read('src/pages/for-agents.astro');
  const sitemap = read('src/pages/sitemap-discovery.xml.ts');
  const llms = read('public/llms.txt');

  for (const source of [agents, forAgents, sitemap, llms]) {
    assert.match(source, /federation/);
  }
});
