import assert from 'node:assert/strict';
import {readFile, access, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read = p => readFile(`dist/${p}`, 'utf8');
const json = async p => JSON.parse(await read(p));
const current = await json('25.json');
const opening = await json('25/boards/000.json');
const frozen = await read('25/boards/000.json');
assert.equal(createHash('sha256').update(frozen).digest('hex'), '2b34a571dfe7063517a8405a801b5b7c544f97f3d4b8a2feec4336cdfdf3333f');
assert.equal(current.board, '001');
assert.deepEqual(current.teams, (await json('25/boards/001.json')).teams);
assert.equal(current.teams.length,25);
assert.match(await read('25/boards/000/index.html'), /OHIO STATE|Ohio State/);
const dissent = await json('25/disagreements.json');
assert.equal(dissent.reference.publishedAt,'2026-09-20');
assert.equal(dissent.disagreements.length,5);
for(const team of dissent.disagreements) assert.ok(team.pointcastDifference>0);
const receipts = await json('25/receipts.json');
assert.equal(receipts.receipts.length,25);
assert.equal(receipts.openingReceipts.length,25);
assert.deepEqual(receipts.openingReceipts.map(t=>t.claim),opening.teams.map(t=>t.reason));
const directory = await json('25/directory.json');
const programs = directory.programs;
assert.equal(programs.length,266);
assert.deepEqual(programs.filter(t=>t.pointcastRank).map(t=>t.name),current.teams.map(t=>t.school));
const teamCases = current.discovery.teamCases;
for(const entry of teamCases) {
 const route=new URL(entry.json).pathname.slice(1);
 const payload=await json(route);
 assert.equal(payload.board,'001');
 assert.equal(payload.team.school,entry.team);
 assert.equal(payload.team.isCurrent,true);
}
const oldNames=opening.teams.filter(t=>!current.teams.some(c=>c.school===t.school));
for(const team of oldNames){
 const slug=team.school.toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const payload=await json(`25/teams/${slug}.json`);
 assert.equal(payload.status,'archived-outside-current-25');
 assert.equal(payload.team.reason,team.reason);
}
let checked=0; const missing=new Set();
async function walk(dir){
 for(const ent of await readdir(`dist/${dir}`,{withFileTypes:true})){
  const p=`${dir}/${ent.name}`;
  if(ent.isDirectory())await walk(p);
  else if(p.endsWith('.html')){
   const html=await read(p); checked++;
   assert.ok(html.includes('College football edition and departments'),p);
   for(const [,href] of html.matchAll(/href="(\/25[^"#?]*)/g)){
    const target=href.replace(/\/$/,'').slice(1);
    try{await access(`dist/${target.endsWith('.json')?target:target+'/index.html'}`)}catch{missing.add(href)}
   }
  }
 }
}
await walk('25');
assert.deepEqual([...missing],[]);
console.log(`PASS: ${checked} football HTML pages, all internal football links, 25 current cases, ${oldNames.length} retained cases, 50 receipts, 266 directory programs, and both frozen snapshots.`);
