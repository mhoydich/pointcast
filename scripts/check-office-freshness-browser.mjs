/** Regression fixtures only, served on loopback. Never writes or loads the live Loom. */
import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {OFFICE_END,POST_FRESHNESS_MS} from '../public/office/freshness.mjs';
import {readOfficeSnapshot} from '../src/lib/office-page.mjs';
import {adapters,records,NOW,sources} from '../tests/office-integration/source-fixture.mjs';
const {chromium}=await import(process.env.PROGRESS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE).href:'playwright-core');
const root=resolve(new URL('..',import.meta.url).pathname);
const html=readFileSync(resolve(root,'src/pages/office.astro'),'utf8').replace(/^---[\s\S]*?---\s*/,'').replace('{title}','Office expiry TEST FIXTURE').replace(' is:inline','');
const iso=t=>new Date(t).toISOString();
const fixture=at=>({schema:'pointcast.office-view/v1',state:'ok',observedAt:iso(at),expiresAt:iso(OFFICE_END),evidenceFresh:true,
 desks:[{handle:'@sol-1',name:'TEST FIXTURE',nounUrl:null,eligible:true,lifecycle:'Local regression fixture only',artNote:'No live activity',facts:{lastPostAt:iso(at),asOf:iso(at),postUrl:'https://pointcast.xyz/loom?to=%40sol-1',stale:false}}],
 events:[{id:'fixture-only',handle:'@sol-1',type:'post',at:iso(at),roomAddress:'@sol-1',sourceUrl:'https://pointcast.xyz/loom?to=%40sol-1'}],edges:[],merges:[{number:1767,url:'https://github.com/mhoydich/pointcast/pull/1767',mergedAt:iso(at-1000),verified:true}],blocked:[],trackedPrs:[1767],errors:[]});
const server=createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 if(req.url==='/office/app.mjs'&&process.env.OFFICE_TEST_APP){res.writeHead(200,{'content-type':'text/javascript'}).end(readFileSync(process.env.OFFICE_TEST_APP));return;}
 if(req.url==='/office'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
 const path=resolve(root,'public','.'+new URL(req.url,'http://localhost').pathname);
 if(!path.startsWith(resolve(root,'public')+'/')||!existsSync(path)){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':({'.mjs':'text/javascript','.css':'text/css'})[extname(path)]||'application/octet-stream'}).end(readFileSync(path));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:process.env.PROGRESS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  async function open(at,delayed=false,threads=false,assembled=null){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.method());});
   await page.clock.install({time:new Date(at)});
   const snapshot=assembled ?? fixture(at);
   if(threads){
    snapshot.desks.push({...snapshot.desks[0],handle:'@sol-2',name:'TEST FIXTURE 2'});
    snapshot.edges=[{id:'fixture-thread',parentId:'fixture-parent',fromHandle:'@sol-1',toHandle:'@sol-2',sourceUrl:'https://pointcast.xyz/loom?to=%40sol-1'}];
   }
   await page.addInitScript(({snapshot,delayed})=>{
    const native=window.fetch.bind(window);window.fixtureReads=0;
    window.fetch=(url,init)=>{
     if(url!=='/api/office')return native(url,init);
     window.fixtureReads++;
     if(window.failFixture)return Promise.resolve({ok:false,status:503});
     // JSON can finish after a fetch signal is aborted. Deliberately ignore
     // cancellation here to prove completion-time rejection, not just abort.
     return Promise.resolve({ok:true,json:()=>delayed?new Promise(r=>window.releaseFixture=()=>r(snapshot)):Promise.resolve(snapshot)});
    };
   },{snapshot,delayed});
   await page.goto('http://127.0.0.1:'+server.address().port+'/office');
   await page.waitForFunction(()=>window.fixtureReads===1);
   if(!delayed)await page.waitForFunction(n=>document.querySelectorAll('.office-desk[data-activity="recent"]').length===n,snapshot.desks.filter(d=>d.facts.lastPostAt && !d.facts.stale).length);
   return{page,finish:async(expectedReads=1)=>{assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.equal(await page.evaluate(()=>window.fixtureReads),expectedReads,'only explicitly expected source reads may occur');assert.equal(await page.locator('#office-sound').getAttribute('aria-pressed'),'false');await page.close();}};
  }
  {
   // Actual provider adapters -> integration projection -> actual app/renderers.
   // Older context never enters the app's activity list or desk freshness facts.
   const source=sources({oldParent:true,draftConflict:true});
   const anchor=performance.now();
   const assembled=await readOfficeSnapshot({records,adapters,fetcher:source.fetcher,clock:()=>NOW+Math.ceil(performance.now()-anchor)});
   assert.equal(source.requests.length,13);
   const {page,finish}=await open(Date.parse(assembled.observedAt),false,false,assembled);
   const parent=page.locator('.office-desk').filter({hasText:'@sol-1'});
   assert.equal(await parent.getAttribute('data-activity'),'unknown','old context never lights parent');
   assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),1,'only reply author lights');
   assert.equal(await page.locator('[data-reply-id]').count(),1,'actual fresh reply draws its old-parent edge');
   assert.match(await page.locator('.floor-threads .office-reply-threads__sources').textContent(),/@sol-2 replied to @sol-1/);
   assert.equal(await page.locator('#office-events > ul > li > a').count(),1,'old parent excluded from fresh activity');
   assert.equal(await page.locator('[data-state="verified-blocked"]').count(),1,'confirmed conflicting draft lights lamp');
   assert.match(await page.locator('[data-state="verified-blocked"]').textContent(),/1770/);
   await page.clock.runFor(POST_FRESHNESS_MS);
   assert.equal(await page.locator('[data-reply-id]').count(),0,'edge ages with reply, not old context');
   assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),0);
   await finish();
  }
  {
   const at=OFFICE_END-20*60_000,{page,finish}=await open(at);
   assert.equal(await page.locator('#office-watch').getAttribute('aria-pressed'),'false');
   await page.clock.runFor(POST_FRESHNESS_MS);
   assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),0);
   assert.equal(await page.locator('[data-state="verified-merged"]').count(),0);
   assert.equal(await page.locator('.office-desk__post-time').getAttribute('datetime'),iso(at),'source timestamp preserved');
   await finish();
  }
  {
   const {page,finish}=await open(OFFICE_END-1000);
   await page.locator('#office-watch').click(); // Existing user opt-in must also stop at the end.
   await page.clock.runFor(61_000);
   assert.match(await page.locator('#office-status').textContent(),/Experiment ended/);
   assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),0);
   assert.equal(await page.locator('[data-state="verified-merged"]').count(),0);
   assert.equal(await page.locator('#office-refresh').isDisabled(),true);
   assert.equal(await page.locator('#office-watch').isDisabled(),true);
   await finish();
  }
  {
   const {page,finish}=await open(OFFICE_END-1000,true);
   await page.waitForFunction(()=>typeof window.releaseFixture==='function');
   await page.clock.runFor(1001);await page.evaluate(()=>window.releaseFixture());
   await page.waitForFunction(()=>document.querySelector('#office-status').textContent.includes('Experiment ended'));
   assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),0);
   assert.equal(await page.locator('[data-state="verified-merged"]').count(),0);
   assert.equal(await page.locator('#office-refresh').isDisabled(),true);
   await finish();
  }
  {
   const at=OFFICE_END-20*60_000,{page,finish}=await open(at);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
   await page.clock.setSystemTime(at+16*60_000); // Wall clock jumps; suspended timers do not run.
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
   assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),0);
   await page.clock.setSystemTime(OFFICE_END+1);await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
   assert.match(await page.locator('#office-status').textContent(),/Experiment ended/);
   await finish();
  }
  {
   const at=OFFICE_END-20*60_000,{page,finish}=await open(at);
   await page.locator('.office-desk details > summary').click();
   await page.locator('.office-desk__source').focus();
   await page.clock.runFor(120_000);
   assert.equal(await page.locator('.office-desk details').evaluate(e=>e.open),true,'age repaint keeps expanded detail');
   assert.equal(await page.evaluate(()=>document.activeElement.matches('.office-desk__source')),true,'desk source focus restored');
   await page.locator('.office-desk details > summary').focus();
   await page.clock.runFor(POST_FRESHNESS_MS-120_000);
   assert.equal(await page.evaluate(()=>document.activeElement.matches('.office-desk details > summary')),true,'summary focus survives post expiry');
   assert.equal(await page.locator('.office-desk details').evaluate(e=>e.open),true);
   await page.locator('.office-desk__source').focus();
   await page.clock.setSystemTime(at+16*60_000);
   await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
   assert.equal(await page.evaluate(()=>document.activeElement.matches('.office-desk__source')),true,'visibility repaint keeps source focus');
   assert.equal(await page.locator('.office-desk details').evaluate(e=>e.open),true);
   await finish();
  }
  {
   const at=OFFICE_END-20*60_000,{page,finish}=await open(at);
   await page.locator('.office-desk details > summary').click();
   await page.locator('.office-evidence__merge a').focus();
   await page.clock.runFor(120_000);
   assert.equal(await page.evaluate(()=>document.activeElement.matches('.office-evidence__merge a')),true,'evidence source focus restored when flame ages');
   assert.equal(await page.locator('.office-desk details').evaluate(e=>e.open),true);
   await page.clock.setSystemTime(at+16*60_000);await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
   assert.equal(await page.evaluate(()=>document.activeElement.matches('.office-evidence__merge a')),true,'pageshow repaint preserves evidence focus');
   assert.equal(await page.locator('.office-desk details').evaluate(e=>e.open),true);
   await finish();
  }
  {
   const {page,finish}=await open(OFFICE_END-1000);
   await page.locator('.office-desk details > summary').click();await page.locator('.office-desk__source').focus();
   await page.clock.runFor(1000);
   assert.match(await page.locator('#office-status').textContent(),/Experiment ended/);
   assert.equal(await page.evaluate(()=>document.activeElement.matches('.office-desk__source')),true,'historical desk source remains focused at cutoff');
   assert.equal(await page.locator('.office-desk details').evaluate(e=>e.open),true);
   await finish();
  }
  {
   const {page,finish}=await open(OFFICE_END-1000);
   await page.locator('.office-desk details > summary').click();await page.locator('.office-evidence__merge a').focus();
   await page.clock.runFor(1000);
   assert.equal(await page.locator('.office-evidence__merge a').count(),0,'cutoff still removes active evidence');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'office-evidence','removed control falls back to its section, never body');
   assert.equal(await page.locator('.office-desk details').evaluate(e=>e.open),true);
   await finish();
  }
  for(const control of [
   {selector:'.office-desk__source',section:'office-floor'},
   {selector:'.office-evidence__merge a',section:'office-evidence'},
   {selector:'#office-events > ul a',section:'office-activity'},
   {selector:'.floor-threads a',section:'office-floor',threads:true}
  ]){
   const {page,finish}=await open(OFFICE_END-20*60_000,false,control.threads);
   if(control.threads)await page.addStyleTag({content:'.floor-threads{display:block!important;pointer-events:auto!important}.floor-threads .office-reply-threads__sources{display:block!important}'});
   else if(control.selector==='.office-desk__source')await page.locator('.office-desk details > summary').click();
   await page.locator('#office-watch').click();
   await page.locator(control.selector).first().focus();
   await page.evaluate(()=>window.failFixture=true);
   await page.clock.runFor(60_000); // Exactly the existing opted-in automatic read.
   await page.waitForFunction(()=>document.querySelector('#office-status').textContent.includes('Source read failed'));
   assert.equal(await page.evaluate(()=>document.activeElement.id),control.section,'failed read retains focus in the source section');
   assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),0);
   assert.equal(await page.locator('#office-watch').getAttribute('aria-pressed'),'false');
   await page.clock.runFor(90_000); // No failure retry or focus-triggered network read.
   await finish(2);
  }
  {
   const {page,finish}=await open(OFFICE_END-20*60_000,false,true);
   // Overlay sources are normally visually suppressed. Surface their actual
   // controls in this isolated fixture to exercise the renderer's resize path.
   await page.addStyleTag({content:'.floor-threads{display:block!important;pointer-events:auto!important}.floor-threads .office-reply-threads__sources{display:block!important}'});
   const thread=page.locator('.floor-threads a').first();await thread.focus();
   await thread.evaluate(el=>window.focusedThread=el);
   const oldX=await page.locator('.floor-threads line').getAttribute('x2');
   await page.setViewportSize({width:width-20,height:901});
   await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
   assert.equal(await page.evaluate(()=>document.activeElement===window.focusedThread),true,'resize preserves exact focused thread node');
   assert.equal(await page.evaluate(()=>window.focusedThread.isConnected),true);
   assert.notEqual(await page.locator('.floor-threads line').getAttribute('x2'),oldX,'resize still updates line geometry');
   await finish();
  }
 }
 console.log('PASS: 28 browser regressions at390/1440px: source-to-screen old-parent edge/dark context and confirmed draft conflict, idle aging, cutoff/watch cancellation, late JSON crossing cutoff, hidden/foreground/BFCache, desk/evidence focus/details, automatic failure fallback and in-place resize thread focus; no extra reads/writes or unsolicited sound.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
