// Compile the exact route in a minimal fixture, not the full repository build.
import {mkdtemp, mkdir, cp, writeFile, readFile, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join, resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url));
const fixture=await mkdtemp(join(tmpdir(),'office-drawer-route-'));
await mkdir(join(fixture,'src/pages/office'),{recursive:true});await mkdir(join(fixture,'sketches'),{recursive:true});
await cp(join(root,'src/pages/office/project.astro'),join(fixture,'src/pages/office/project.astro'));
await cp(join(root,'sketches/office-project-drawer-shwa'),join(fixture,'sketches/office-project-drawer-shwa'),{recursive:true});
await writeFile(join(fixture,'package.json'),JSON.stringify({type:'module'}));
const astro=process.env.DRAWER_ASTRO || resolve(root,'node_modules/astro/bin/astro.mjs');
await symlink(resolve(astro,'../../..'),join(fixture,'node_modules'),'dir');
execFileSync(process.execPath,[astro,'build','--root',fixture],{cwd:fixture,stdio:'inherit',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'}});
const html=await readFile(join(fixture,'dist/office/project/index.html'),'utf8');
assert.match(html,/id="project-data"/);assert.match(html,/PROJECT PILOT/);assert.match(html,/script[^>]+src="\/_astro\//);
const json=html.match(/<script id="project-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];assert.ok(json);assert.equal(JSON.parse(json).project.task,'OFF-57 / B');
console.log(`PASS compiled /office/project/ with bundled script, CSS and embedded public data. Fixture: ${fixture}`);
