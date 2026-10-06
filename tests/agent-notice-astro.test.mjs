import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform as compileAstro } from '@astrojs/compiler';
import { transform as compileJavaScript } from 'esbuild';

const page=new URL('../src/pages/agents/spec/index.astro',import.meta.url);
test('public spec protocol examples compile as literal documentation',async()=>{
 const source=await readFile(page,'utf8');
 const emitted=await compileAstro(source,{filename:page.pathname});
 assert.equal(emitted.diagnostics.filter(d=>d.severity===1).length,0);
 await compileJavaScript(emitted.code,{loader:'ts',target:'esnext'});
 assert.ok(emitted.code.includes('{epoch}:{committed sequence}'));
 assert.ok(source.includes('Readable URLs:'));
});
test('the original interpreted protocol example is rejected before a full build',async()=>{
 const source=(await readFile(page,'utf8')).replace(' is:raw','');
 const emitted=await compileAstro(source,{filename:page.pathname});
 await assert.rejects(compileJavaScript(emitted.code,{loader:'ts',target:'esnext'}),/Expected.*sequence/s);
});
