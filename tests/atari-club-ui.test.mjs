import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
const root = new URL('../',import.meta.url);
const read = path => readFileSync(new URL(path,root),'utf8');
const script = ts.transpileModule(read('src/scripts/atari-club.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const baseSelf = {signedIn:false,isMember:false,suspended:false,handle:null,joinedAt:null,badges:[],checkinDays:0,checkedInToday:false,canModerate:false};
const member = {...baseSelf,signedIn:true,isMember:true,handle:'SpaceAce',joinedAt:'2026-09-30T08:00:00Z',badges:[{id:'first-carrier',earnedAt:'2026-09-30T08:00:00Z'}],checkinDays:1,checkedInToday:true};
const state = self => ({ok:true,ready:true,memberCount:1,postCount:0,posts:[],self});
const badgeFixture = ['first-carrier','first-transmission','night-shift','pixel-builder'].map(id=>`<article data-badge="${id}"><span data-earned></span></article>`).join('');
function setup(fetcher) {
 const page=read('src/pages/atari-bbs/club.astro');
 let html=page.slice(page.indexOf('<main'),page.indexOf('</main>')+7);
 html=html.replace(/\{CLUB_BADGES\.map[\s\S]*?<\/article>\)\}/,badgeFixture);
 html=html.replace(/\{clubArt\.map[\s\S]*?<\/article>\)\}/,'');
 const dom=new JSDOM(html,{url:'https://pointcast.xyz/atari-bbs/club/',runScripts:'outside-only'});
 dom.window.fetch=fetcher;
 dom.window.eval(script);
 const find=s=>dom.window.document.querySelector(s);
 const submit=s=>find(s).dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 return {dom,find,submit};
}
const response=(value,status=200)=>Promise.resolve(new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}}));
const settle=()=>new Promise(resolve=>setTimeout(resolve,15));

test('public visitors see a real empty board and no invented badge awards',async()=>{
 const app=setup(()=>response({...state(baseSelf),memberCount:0}));
 try{await settle();assert.equal(app.find('[data-member-count]').textContent,'0');assert.equal(app.find('[data-visitor]').hidden,false);assert.equal(app.find('[data-compose]').hidden,true);assert.match(app.find('[data-posts]').textContent,/No sample members or messages/);assert.equal(app.find('[data-badge-count]').textContent,'0 / 4');assert.equal(app.find('[data-badge="first-carrier"]').dataset.earnedState,'not-earned');}finally{app.dom.window.close();}
});

test('unavailable storage service is not represented as an empty board',async()=>{
 const app=setup(()=>response({ok:false,ready:false,message:'The club board is being connected.'},503));
 try{await settle();assert.equal(app.find('[data-member-count]').textContent,'—');assert.equal(app.find('[data-access-unavailable]').hidden,false);assert.match(app.find('[data-notice]').textContent,/connection problem, not an empty board/);assert.equal(app.find('[data-retry]').hidden,false);}finally{app.dom.window.close();}
});

test('failed message stays intact; accepted workshop post refreshes server badges and board',async()=>{
 const calls=[];let rejectPost=true;let current=state(member);
 const app=setup((url,options)=>{calls.push({url,options});if(options.method==='POST'){if(rejectPost)return response({ok:false,message:'Wait between messages.'},429);current={...state({...member,badges:[...member.badges,{id:'first-transmission',earnedAt:member.joinedAt},{id:'pixel-builder',earnedAt:member.joinedAt}]}),postCount:1,posts:[{id:'acp_'+'a'.repeat(32),handle:'SpaceAce',channel:'workshop',body:'I made a tiny font.',createdAt:member.joinedAt,canDelete:true}]};return response({ok:true,self:current.self},201);}return response(current);});
 try{await settle();const textarea=app.find('textarea');textarea.value='I made a tiny font.';app.find('#post-channel').value='workshop';app.submit('[data-compose]');await settle();assert.equal(textarea.value,'I made a tiny font.');assert.match(app.find('[data-notice]').textContent,/Your draft is still here/);rejectPost=false;app.submit('[data-compose]');await settle();assert.equal(textarea.value,'');assert.equal(app.find('[data-badge-count]').textContent,'3 / 4');assert.match(app.find('[data-posts]').textContent,/I made a tiny font/);assert.ok(calls.some(call=>call.url==='/api/atari-club?channel=workshop'));assert.equal(calls.find(call=>call.options.method==='POST').options.credentials,'same-origin');assert.equal(app.find('[data-checkin]').disabled,true);}finally{app.dom.window.close();}
});

test('post bodies render as text and paused memberships cannot compose or report',async()=>{
 const current={...state({...member,isMember:false,suspended:true}),postCount:1,posts:[{id:'acp_'+'b'.repeat(32),handle:'OtherMember',channel:'general',body:'<img src=x onerror=alert(1)>',createdAt:member.joinedAt,canDelete:false}]};
 const app=setup(()=>response(current));
 try{await settle();assert.equal(app.find('[data-suspended]').hidden,false);assert.equal(app.find('[data-compose]').hidden,true);assert.equal(app.find('[data-posts] img'),null);assert.match(app.find('[data-posts]').textContent,/<img src=x/);assert.equal(app.find('[data-report-form]'),null);}finally{app.dom.window.close();}
});

test('director reports and membership actions use the published contract',async()=>{
 const calls=[];const self={...member,canModerate:true};
 const app=setup((url,options)=>{calls.push({url,options});if(options.method==='POST')return response({ok:true,self});if(url.includes('moderation=1'))return response({ok:true,reports:[{postId:'acp_'+'c'.repeat(32),handle:'Trouble',channel:'general',reason:'spam',body:'A reported message.',createdAt:member.joinedAt}]});return response(state(self));});
 try{await settle();assert.equal(app.find('[data-moderation]').hidden,false);assert.match(app.find('[data-reports]').textContent,/A reported message/);app.find('[data-resolve-post]').click();await settle();assert.equal(JSON.parse(calls.find(call=>call.options.method==='POST').options.body).action,'resolve');app.find('#moderate-handle').value='Trouble';app.find('#moderate-action').value='restore';app.submit('[data-member-action]');await settle();assert.ok(calls.some(call=>call.options.body&&JSON.parse(call.options.body).action==='restore'));}finally{app.dom.window.close();}
});

test('an ambiguous send keeps the draft and retry refreshes without sending it again',async()=>{
 let sends=0;const app=setup((_url,options)=>{if(options.method==='POST'){sends++;return Promise.reject(new Error('connection lost'));}return response(state(member));});
 try{await settle();app.find('textarea').value='Was this transmitted?';app.submit('[data-compose]');await settle();assert.match(app.find('[data-notice]').textContent,/may have arrived/);assert.equal(app.find('textarea').value,'Was this transmitted?');app.find('[data-retry]').click();await settle();assert.equal(sends,1);assert.equal(app.find('textarea').value,'Was this transmitted?');}finally{app.dom.window.close();}
});
