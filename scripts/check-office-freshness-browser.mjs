/** Regression fixtures only, served on loopback. Never writes or loads the live Loom. */
import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {OFFICE_END,POST_FRESHNESS_MS} from '../public/office/freshness.mjs';
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
  async function open(at,delayed=false){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.method());});
   await page.clock.install({time:new Date(at)});
   await page.addInitScript(({snapshot,delayed})=>{
    const native=window.fetch.bind(window);window.fixtureReads=0;
    window.fetch=(url,init)=>{
     if(url!=='/api/office')return native(url,init);
     window.fixtureReads++;
     // JSON can finish after a fetch signal is aborted. Deliberately ignore
     // cancellation here to prove completion-time rejection, not just abort.
     return Promise.resolve({ok:true,json:()=>delayed?new Promise(r=>window.releaseFixture=()=>r(snapshot)):Promise.resolve(snapshot)});
    };
   },{snapshot:fixture(at),delayed});
   await page.goto('http://127.0.0.1:'+server.address().port+'/office');
   await page.waitForFunction(()=>window.fixtureReads===1);
   if(!delayed)await page.waitForFunction(()=>document.querySelectorAll('.office-desk[data-activity="recent"]').length===1);
   return{page,finish:async()=>{assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.equal(await page.evaluate(()=>window.fixtureReads),1,'local invalidation must not fetch');assert.equal(await page.locator('#office-sound').getAttribute('aria-pressed'),'false');await page.close();}};
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
 }
 console.log('PASS: 8 browser regressions at390/1440px: idle aging, cutoff/watch cancellation, late JSON crossing cutoff, hidden/foreground/BFCache; no extra reads/writes or unsolicited sound.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
