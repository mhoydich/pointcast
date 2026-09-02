import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Kennel Club mainnet FA2 is registered consistently across contract discovery surfaces', async () => {
  const [contractText, agents, status, block] = await Promise.all([
    read('src/data/contracts.json'),
    read('src/pages/agents.json.ts'),
    read('src/pages/status.astro'),
    read('src/content/blocks/0583.json'),
  ]);
  const contracts = JSON.parse(contractText);
  assert.deepEqual(contracts.kennel_club.mainnet, 'KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq');
  assert.equal(contracts.kennel_club.status, 'live, paused until unpause');
  assert.equal(contracts.kennel_club.mintPriceMutez, 1_000_000);
  assert.equal(contracts.kennel_club.tokenIdConvention, 'day - 1');
  const series = JSON.parse(await read('src/data/kennel-club-september-sitting.json'));
  assert.equal(series.status, 'live, paused until unpause');
  assert.equal(series.mint.contractAddress, contracts.kennel_club.mainnet);
  assert.equal(series.mint.priceMutez, 1_000_000);
  assert.match(agents, /kennelClub:/);
  assert.match(agents, /live, paused until unpause/);
  assert.match(status, /Kennel Club FA2 · Mainnet · live, paused until unpause/);
  const blockData = JSON.parse(block);
  assert.equal(blockData.type, 'MINT');
  assert.match(blockData.body, /The mint is live at 1 ꜩ per sitting\./);
  assert.deepEqual(blockData.companions.find((item) => item.id === 'https://tzkt.io/KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq'), {
    id: 'https://tzkt.io/KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq',
    label: 'The contract on TzKT',
    surface: 'external',
  });
});
