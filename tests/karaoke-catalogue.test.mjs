import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalogue = JSON.parse(readFileSync(new URL('../src/data/karaoke-catalogue.json', import.meta.url)));
const bells = JSON.parse(readFileSync(new URL('../src/data/bell-choir-songs.json', import.meta.url)));

test('starter catalogue has seven unique, shareable, publisher-attributed songs', () => {
  assert.equal(catalogue.length, 7);
  assert.equal(new Set([...catalogue, ...bells].map(song => song.id)).size, catalogue.length + bells.length);
  for (const song of catalogue) {
    assert.match(song.id, /^[a-z0-9-]+$/);
    assert.equal(song.provider, 'youtube');
    assert.match(song.videoId, /^[A-Za-z0-9_-]{11}$/);
    for (const key of ['title', 'artist', 'publisher', 'mood', 'note']) assert.ok(song[key].trim());
    assert.match(song.sourceChecked, /^\d{4}-\d{2}-\d{2}$/);
    for (const key of ['lyrics', 'audio', 'audioUrl', 'score', 'pitch']) assert.equal(song[key], undefined);
  }
});

test('starter substitutions and arrangement are disclosed, not hidden', () => {
  assert.match(catalogue.find(song => song.artist === 'Frank Ocean').note, /alternate for Pink \+ White/);
  assert.match(catalogue.find(song => song.artist === 'Weezer').note, /alternate for Undone/);
  assert.match(catalogue.find(song => song.title === 'Skinny Love').note, /Birdy’s piano arrangement/);
  assert.match(catalogue.find(song => song.artist === 'Kanye West').note, /alternate for Ghost Town/);
});
