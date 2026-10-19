import test from 'node:test';
import assert from 'node:assert/strict';
import {HORSES,dayAt,postTime,raceCards,getRace,houseEntrants,simulateRace} from '../public/sunset-downs/engine.mjs';
test('Los Angeles cards preserve noon / 16 / 20 across both DST transitions',()=>{
 assert.equal(postTime('2026-03-07',12),'2026-03-07T20:00:00.000Z');
 assert.equal(postTime('2026-03-08',12),'2026-03-08T19:00:00.000Z');
 assert.equal(postTime('2026-10-31',20),'2026-11-01T03:00:00.000Z');
 assert.equal(postTime('2026-11-01',20),'2026-11-02T04:00:00.000Z');
 assert.equal(dayAt(new Date('2026-10-20T01:00Z')),'2026-10-19');
 const cards=raceCards(new Date('2026-10-19T18:00Z'));
 assert.equal(cards.length,6);assert.deepEqual(cards.slice(0,3).map(c=>c.slot),['noon','matinee','premiere']);
 assert.equal(getRace('sd-2026-02-31-noon'),null);assert.equal(getRace('sd-2026-10-19-midnight'),null);
 assert.equal(getRace(cards[0].id,new Date(cards[0].postAt)).status,'due');
});
test('the Hollywood cast has unique identities and balanced entertainment outcomes replay exactly',()=>{
 assert.equal(new Set(HORSES.map(h=>h.id)).size,6);
 assert.ok(HORSES.every(h=>h.personality.length>60&&h.story.length>40));
 const field=[...houseEntrants(),{id:'pci_test',name:'A New Star',house:false,archetype:'stunt-double'}];
 const seed='ab'.repeat(16),result=simulateRace(seed,field);
 assert.deepEqual(result,simulateRace(seed,field.slice().reverse()));
 assert.equal(result.finish.length,7);assert.equal(new Set(result.finish.map(e=>e.position)).size,7);
 assert.ok(result.finish.every(e=>e.house?e.award===0:[300,150,75,0].includes(e.award)));
 assert.notDeepEqual(result,simulateRace('bc'.repeat(16),field));
 assert.throws(()=>simulateRace(seed,[...field,field[0]]),/snapshot/);
});
