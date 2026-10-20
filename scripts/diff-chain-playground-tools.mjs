#!/usr/bin/env node
// Diff a saved tools/list reply against the API Playground's pinned list. No network.
//
//   curl -s <devnet>/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
//     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' > live-tools.json
//   node scripts/diff-chain-playground-tools.mjs live-tools.json
//
// Prints what the page would say about it: tools added, removed and changed, how
// each added or changed tool is classified (only a known read-only tool gets Run),
// and whether every inputSchema in the reply becomes a form. Exit 1 if it differs.
import { readFileSync } from 'node:fs';
import * as pg from '../public/chain/apps/playground.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/diff-chain-playground-tools.mjs <saved tools/list reply.json>');
  process.exit(2);
}
const pinned = pg.parseToolsList({ result: { tools: JSON.parse(readFileSync(new URL('../public/chain/apps/playground-tools.json', import.meta.url), 'utf8')).tools } }).tools;
const { tools, dropped } = pg.parseToolsList(JSON.parse(readFileSync(file, 'utf8')));
const diff = pg.diffTools(pinned, tools);
console.log(`${tools.length} tools in ${file} (${dropped} dropped as unusable); pinned list has ${pinned.length}`);
console.log(pg.discoveryMessage({ tools, diff, reason: '' }));
for (const name of [...diff.added, ...diff.changed]) {
  const t = tools.find((x) => x.name === name);
  const c = pg.classifyTool(t);
  const { fields, root } = pg.fieldsFromSchema(t.inputSchema);
  console.log(`  ${name}: ${c.kind}${c.run ? ' (Run)' : ' (no Run)'} · ${root ? 'one JSON box' : `${fields.length} fields`} · ${c.why}`);
}
const readers = tools.filter((t) => pg.classifyTool(t).run).length;
console.log(`${readers} would get a Run button; ${tools.length - readers} would not`);
process.exit(diff.same ? 0 : 1);
