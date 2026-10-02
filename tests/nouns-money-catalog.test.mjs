import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SOURCE_CATALOG } from '../src/lib/nouns-money/catalog.ts';
test('workshop adapts all100canonical artwork records with their original hashes',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/data/nouns-money-hundred.json',import.meta.url),'utf8'));
 const provenance=JSON.parse(readFileSync(new URL('../public/images/nouns-money/source-100/provenance.json',import.meta.url),'utf8'));
 assert.equal(SOURCE_CATALOG.count,100);assert.equal(new Set(SOURCE_CATALOG.notes.map(note=>note.id)).size,100);
 for(const note of SOURCE_CATALOG.notes){const source=manifest.catalog.find(item=>item.nounId===note.nounId);assert.ok(source);assert.equal(note.specimenId,source.serial);assert.equal(note.svg,`/images/nouns-money/nordic-100/${source.file}.svg`);assert.equal(note.image,`/images/nouns-money/nordic-100/${source.file}.webp`);const bytes=readFileSync(new URL('../public'+note.svg,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),source.svgSha256);assert.equal(provenance.notes.find(item=>item.id===note.id).svg_sha256,source.svgSha256);}
});
