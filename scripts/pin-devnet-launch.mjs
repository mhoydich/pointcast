#!/usr/bin/env node
// After the devnet-2 reset: copy the launch pins from src/data/chain-home.ts
// (the ONE place they are written) into the files that cannot import it.
//
//   1. fill in chain-home.ts: DEVNET_2_GENESIS, RESET_DATE, NOTICE_END_DATE,
//      DEVNET_1_TIP, DEVNET_1_RECORDED_AT, PRESENCE_FLIP
//   2. node scripts/pin-devnet-launch.mjs
//
// It writes:
//   - chain id + genesis into the files bots download: public/chain/bots/bot.mjs,
//     verify.mjs, pcv.py, public/chain/net/pc-witness.mjs and the live minter's
//     data-chain/data-genesis in public/chain/first-mints/index.html
//   - ⟨RESET_DATE⟩ ⟨DEVNET1_TIP⟩ ⟨DEVNET2_GENESIS⟩ tokens in block 0700 and the
//     front-door news line, and the 0700 entries' dates/timestamp, to RESET_DATE
// It refuses to run while any pin is still a placeholder (bot files excepted
// with --bot-files-only, which only syncs the chain id + current pin).
// tests/chain-devnet-reset.test.mjs fails until everything agrees.
import { readFileSync, writeFileSync } from 'node:fs';
import { DEVNET, DEVNET_1_TIP, RESET_DATE, devnetLaunchGaps } from '../src/data/chain-home.ts';

const root = new URL('../', import.meta.url);
const botOnly = process.argv.includes('--bot-files-only');
const gaps = devnetLaunchGaps();
if (gaps.length && !botOnly) {
  console.error(`launch pins still placeholders: ${gaps.join(', ')}`);
  process.exit(1);
}

const edit = (p, fn) => {
  const url = new URL(p, root);
  const before = readFileSync(url, 'utf8');
  const after = fn(before);
  if (after !== before) writeFileSync(url, after);
  console.log(`${after === before ? 'unchanged' : 'pinned   '} ${p}`);
};
const sub = (s, re, to, p) => {
  if (!re.test(s)) throw new Error(`${p}: no ${re}`);
  return s.replace(re, to);
};

const botFiles = [
  ['public/chain/bots/bot.mjs', [[/const CHAIN_ID = "[^"]*";/, `const CHAIN_ID = "${DEVNET.chainId}";`], [/const GENESIS = "[^"]*";/, `const GENESIS = "${DEVNET.genesis}";`]]],
  ['public/chain/bots/verify.mjs', [[/const GENESIS = "[^"]*";/, `const GENESIS = "${DEVNET.genesis}";`]]],
  ['public/chain/bots/pcv.py', [[/DEVNET_GENESIS = '[^']*'/, `DEVNET_GENESIS = '${DEVNET.genesis}'`]]],
  ['public/chain/first-mints/index.html', [[/data-chain="[^"]*"/, `data-chain="${DEVNET.chainId}"`], [/data-genesis="[^"]*"/, `data-genesis="${DEVNET.genesis}"`]]],
  ['public/chain/net/pc-witness.mjs', [[/const CHAIN_ID = "[^"]*";/, `const CHAIN_ID = "${DEVNET.chainId}";`], [/const GENESIS = "[^"]*";/, `const GENESIS = "${DEVNET.genesis}";`]]],
];
for (const [p, subs] of botFiles) edit(p, (s) => subs.reduce((acc, [re, to]) => sub(acc, re, to, p), s));
if (botOnly) process.exit(0);

const tokens = (s) =>
  s.replaceAll('⟨RESET_DATE⟩', RESET_DATE).replaceAll('⟨DEVNET1_TIP⟩', String(DEVNET_1_TIP)).replaceAll('⟨DEVNET2_GENESIS⟩', DEVNET.genesis);

edit('src/content/blocks/0700.json', (s) => {
  const b = JSON.parse(tokens(s));
  b.timestamp = `${RESET_DATE}T19:00:00Z`;
  return `${JSON.stringify(b, null, 2)}\n`;
});
for (const p of ['src/data/new-today.json', 'src/data/front-door-news.json']) {
  edit(p, (s) => {
    const list = JSON.parse(tokens(s));
    for (const item of list) {
      if (item.block === '0700' || item.label === 'Devnet reset') item.date = RESET_DATE;
    }
    return `${JSON.stringify(list, null, 2)}\n`;
  });
}
