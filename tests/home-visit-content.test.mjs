import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {HOME_SHARE_EDITIONS} from '../src/lib/home-share-editions.mjs';

test('every art view opens a distinct set of three source-backed public projects', async () => {
  const data=JSON.parse(await readFile(new URL('../src/data/home-visit-views.json',import.meta.url),'utf8'));
  const projects=new Map(data.projects.map(project=>[project.id,project]));
  const sets=new Set();
  assert.equal(data.views.length,6);
  assert.equal(new Set(data.views.map(view=>view.id)).size,6);
  for(const project of data.projects){
    const human=new URL(project.href,'https://pointcast.xyz/');
    const source=new URL(project.source);
    assert.equal(human.origin,'https://pointcast.xyz');
    assert.equal(source.origin,human.origin);
    assert.ok(source.pathname.endsWith('.json'));
    assert.ok(project.kind.length>3,'published concept/demo/research status remains visible');
    assert.ok(project.description.length>20);
  }
  for(const view of data.views){
    assert.ok(HOME_SHARE_EDITIONS.some(art=>art.slug===view.id));
    assert.equal(view.projects.length,3);
    assert.equal(new Set(view.projects).size,3);
    view.projects.forEach(id=>assert.ok(projects.has(id)));
    sets.add([...view.projects].sort().join('|'));
  }
  assert.equal(sets.size,6,'every nonrepeat artwork selection must also change the project set');
});
