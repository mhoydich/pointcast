import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearch, publicDestination, projectSearchRows, searchRows } from '../src/lib/pointcast-search.mjs';

const rows = [
  { kind:'BLOCK', id:'0719', title:'An archive note', dek:'A reference to Nouns Money', label:'CH.FD', type:'NOTE', timestamp:'2026-10-20', haystack:'Nouns Money and art' },
  { kind:'PROJECT', id:'/nouns-money', title:'Nouns Money', dek:'Art you can keep', label:'PROJECT', type:'EXPLORE', timestamp:'', haystack:'gallery workshop' },
  { kind:'PROJECT', id:'/local', title:'El Segundo courts', dek:'Pickleball near the beach', label:'PROJECT', type:'EXPLORE', timestamp:'2026-10-15', haystack:'' },
];
test('search ranks exact titles ahead of newer incidental mentions', () => {
  assert.equal(searchRows(rows, 'nouns money')[0].id, '/nouns-money');
  assert.equal(searchRows(rows, '0719')[0].id, '0719');
});
test('search matches separated words, channel codes, accents and kind filters', () => {
  assert.equal(searchRows(rows, 'beach courts')[0].id, '/local');
  assert.equal(searchRows(rows, 'CH.FD').length, 1);
  assert.equal(searchRows(rows, 'nouns money', 'BLOCK').length, 1);
  assert.equal(searchRows(rows, 'absent word').length, 0);
  assert.equal(normalizeSearch('Café — COURTS'), 'cafe courts');
});
test('projects deduplicate slash variants and retain app detail when launch metadata enriches it', () => {
  const result = projectSearchRows([{ url:'https://pointcast.xyz/room/', name:'Room', description:'Make something', kicker:'STUDIO', channel:'CH.FD' }], [{ link:'/room', title:'The Room', kicker:'New studio', date:'2026-10-19' }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].dek, 'Make something');
  assert.equal(searchRows(result, 'studio')[0].url, '/room');
});
test('destination index excludes executable and credential-bearing URLs', () => {
  assert.equal(publicDestination('javascript:alert(1)'), null);
  assert.equal(publicDestination('https://user:password@example.com'), null);
  assert.equal(publicDestination('https://pointcast.xyz/room/'), '/room');
  assert.equal(publicDestination('/room/?view=music#listen'), '/room?view=music#listen');
});

test('the latest launch wins when a destination appears repeatedly in newest-first data', () => {
  const result = projectSearchRows([], [
    { link:'/morning', title:'The paper: RSS and signup', kicker:'Fresh edition', date:'2026-10-18' },
    { link:'/morning/', title:'Morning Edition', kicker:'Preview', date:'2026-09-28' },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'The paper: RSS and signup');
  assert.ok(result[0].timestamp.startsWith('2026-10-18'));
  assert.equal(searchRows(result, 'preview').length, 1, 'older keywords remain discoverable');
});
