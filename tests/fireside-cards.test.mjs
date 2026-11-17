import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {QUIET_MS,swipe,nextIndex,flameView,safeCard} from '../public/sketches/fireside-cards/model.mjs';
const base = new URL('../public/sketches/fireside-cards/',import.meta.url);
const cards=JSON.parse(readFileSync(new URL('cards.json',base)));
test('curated words are exact excerpts with three different real source links',()=>{
 assert.deepEqual(cards.map(c=>c.topic),['coordination','cartography','daos']);
 for(const c of cards){assert(safeCard(c));assert(c.body.includes(c.quote));assert(c.url.endsWith(c.id));}
 assert.equal(new Set(cards.map(c=>c.url)).size,3);
});
test('a full half minute precedes navigation',()=>{assert.equal(QUIET_MS,30000);assert.equal(flameView(29999,true).ready,false);assert.equal(flameView(30000,true).ready,true);});
test('presentation brightness remains bounded, including a paused fire',()=>{for(const t of [-500,0,15000,30000,99999])for(const active of [true,false]){const v=flameView(t,active);assert(v.brightness>=.48&&v.brightness<=.75);}});
test('swipes require horizontal intent and the same pointer; cancellation does nothing',()=>{
 const start={id:1,x:200,y:200};
 assert.equal(swipe(start,{id:1,x:100,y:210}),1);assert.equal(swipe(start,{id:1,x:300,y:210}),-1);
 for(const end of [{id:1,x:150,y:200},{id:1,x:100,y:300},{id:2,x:100,y:200}])assert.equal(swipe(start,end),0);
 assert.equal(swipe(start,{id:1,x:100,y:200},true),0);assert.equal(swipe(null,{id:1,x:100,y:200}),0);
});
test('both directions wrap without a feed or an end trap',()=>{assert.equal(nextIndex(2,1,3),0);assert.equal(nextIndex(0,-1,3),2);});
test('links cannot escape into script or a different site',()=>{for(const url of ['javascript:alert(1)','https://evil.example/loom','https://pointcast.xyz.evil/loom'])assert.equal(safeCard({...cards[0],url}),false);});
test('no-script card has actual words, a source and no autoplay',()=>{
 const html=readFileSync(new URL('index.html',base),'utf8');assert(html.includes(cards[0].quote));assert(html.includes('<noscript>'));assert(html.includes(cards[0].url));assert(!html.includes('autoplay'));
 for(const file of ['hearth-loop.mp4','hearth-poster.jpg','fire.mp3'])assert(existsSync(new URL('../public/pray/fire/media/'+file,import.meta.url)));
});
