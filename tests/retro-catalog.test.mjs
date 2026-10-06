import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeProjects,choose,safeState,dailyChallenge,experiences,channels} from '../src/lib/retro-catalog.mjs';
const live=href=>({state:'verified-live',canonical:`https://pointcast.xyz${href}`,immutable:`https://d5bf6a31.pointcast.pages.dev${href}`,commit:'c03e61844f44425bf604cc8d274c71882a4956b7',verifiedAt:'2026-10-06T10:49:23Z',receipt:'release-20261006'});
test('publication gate hides drafts, rejects external URLs',()=>{const p=normalizeProjects([{title:'Live',href:'/live/',publication:live('/live/')},{title:'Draft',href:'/draft/',status:'draft'},{title:'External',href:'https://outside.test',publication:live('https://outside.test')},{title:'Protocol-relative',href:'//outside.test',publication:live('//outside.test')}]);assert.deepEqual(p.map(x=>x.title),['Live']);});
test('shared classification preserves qualifications and search empty states',()=>{const p=normalizeProjects({projects:[{title:'Research proposal',href:'/communications-lab/',publication:live('/communications-lab/'),summary:'Not a hiring claim'}]});assert.equal(choose(p,'jobs')[0].dek,'Not a hiring claim');assert.equal(choose(p,'jobs','missing').length,0);});
test('local data corruption and stale IDs cannot break room',()=>{assert.deepEqual(safeState('broken',[]),{tape:[],notes:[]});assert.deepEqual(safeState('{"tape":["/gone/","/kept/"],"notes":[{"text":"<script>hi</script>","day":"2026-10-06"},{}]}',['/kept/']),{tape:['/kept/'],notes:[{text:'<script>hi</script>',day:'2026-10-06'}]});});
test('daily challenge is stable within UTC day and rotates',()=>{assert.deepEqual(dailyChallenge(new Date('2026-10-06T01:00:00Z')),dailyChallenge(new Date('2026-10-06T23:59:59Z')));assert.notEqual(dailyChallenge(new Date('2026-10-07T00:00:00Z')).text,dailyChallenge(new Date('2026-10-06T01:00:00Z')).text);});
test('six collision-safe destinations and three original bumper channels',()=>{assert.equal(new Set(experiences.map(x=>x.id)).size,6);assert.equal(new Set(channels.map(x=>x.bumper)).size,3);});

test('top-level status and incomplete or mismatched proof fail closed',()=>{const rows=[{href:'/x/',status:'published'},{href:'/x/',status:'live-verified'},{href:'/x/',publication:{state:'verified-live'}},{href:'/x/',publication:{...live('/y/')}}];assert.equal(normalizeProjects(rows).length,0);});

import vm from 'node:vm';import fs from 'node:fs';
test('blocked device storage keeps controller usable and reset safe',()=>{
 const events={};const el=id=>({checked:false,textContent:'',addEventListener:(name,fn)=>events[`${id}:${name}`]=fn});
 const elements={'#retro-data':{textContent:JSON.stringify({projects:[],channels:[],teletextPages:[]})},'#remember':el('remember'),'#storage-status':el('status'),'#reset-local':el('reset')};
 const document={body:{dataset:{room:'unknown'}},querySelector:s=>elements[s]??null};
 const localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 const code=fs.readFileSync(new URL('../src/lib/retro-controller.mjs',import.meta.url),'utf8').replace(/^import.*?;\n/,'');
 vm.runInNewContext(code,{document,localStorage,safeState,dailyChallenge});
 assert.match(elements['#storage-status'].textContent,/unavailable/);
 elements['#remember'].checked=true;events['remember:change']({target:elements['#remember']});assert.equal(elements['#remember'].checked,false);
 events['reset:click']();assert.match(elements['#storage-status'].textContent,/reset/);
});
