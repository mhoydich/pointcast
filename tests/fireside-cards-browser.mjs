// Run against a local static server. No board posts; media calls are mocked.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const url=process.env.FIRESIDE_URL || 'http://127.0.0.1:8766/sketches/fireside-cards/';
let checks=0;
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.route('https://pointcast.xyz/pray/fire/media/**',r=>r.fulfill({path:new URL('../public/pray/fire/media/'+r.request().url().split('/').pop(),import.meta.url).pathname}));
 await context.addInitScript(()=>{
  window.plays=[];window.pauses=[];
  HTMLMediaElement.prototype.play=function(){window.plays.push(this.id);return Promise.resolve()};
  HTMLMediaElement.prototype.pause=function(){window.pauses.push(this.id)};
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto(url);await page.locator('#arrival').waitFor({state:'visible'});
 assert.deepEqual(await page.evaluate(()=>window.plays),[]);checks++;
 await page.screenshot({path:'/tmp/fireside-phone-arrival.png'});
 await page.click('#light');assert.deepEqual(await page.evaluate(()=>window.plays),['film','crackle']);
 await page.clock.runFor(29750);assert(await page.locator('#ways').isHidden());
 await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#topic').textContent(),'coordination');
 await page.clock.runFor(500);assert(await page.locator('#ways').isVisible());checks++;
 await page.screenshot({path:'/tmp/fireside-phone-ready.png'});
 await page.click('#next');assert.equal(await page.locator('#topic').textContent(),'cartography');assert(await page.locator('#ways').isHidden());
 await page.clock.runFor(30250);await page.click('#stay');assert(await page.locator('#ways').isHidden());checks++;
 await page.click('#pause');assert(await page.locator('#arrival').isVisible());assert((await page.evaluate(()=>window.pauses)).includes('crackle'));
 const n=await page.evaluate(()=>window.plays.length);await page.click('#silent');assert.equal(await page.evaluate(()=>window.plays.slice(-1)[0]),'film');assert.equal(await page.evaluate(()=>window.plays.length),n+1);checks++;
 await page.clock.runFor(30250);
 async function gesture(cancel=false,dy=0){await page.locator('#quote').dispatchEvent('pointerdown',{pointerId:11,isPrimary:true,button:0,clientX:280,clientY:250});await page.locator('#card').dispatchEvent(cancel?'pointercancel':'pointerup',{pointerId:11,isPrimary:true,button:0,clientX:100,clientY:250+dy});}
 // Synthetic pointers cannot capture; use real mouse drag for capture behavior.
 await page.mouse.move(280,260);await page.mouse.down();await page.mouse.move(100,260);await page.mouse.up();
 assert.equal(await page.locator('#topic').textContent(),'daos');checks++;
 await page.clock.runFor(30250);await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#topic').textContent(),'coordination');checks++;
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 assert(await page.locator('#arrival').isVisible());const count=await page.evaluate(()=>window.plays.length);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await page.evaluate(()=>window.plays.length),count);checks++;
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}checks++;
 assert.deepEqual(errors,[]);await context.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await reduced.addInitScript(()=>{window.plays=[];HTMLMediaElement.prototype.play=function(){window.plays.push(this.id);return Promise.resolve()};});
 const rp=await reduced.newPage();await rp.goto(url);await rp.click('#silent');assert.deepEqual(await rp.evaluate(()=>window.plays),[]);checks++;await reduced.close();
 const off=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:568}});const sp=await off.newPage();await sp.goto(url);assert(await sp.locator('noscript a').isVisible());assert((await sp.locator('h1').textContent()).includes('who schedules'));assert(await sp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks++;await sp.screenshot({path:'/tmp/fireside-nojs.png'});await off.close();
 console.log(`${checks} browser checks passed; mocked playback, real Chromium layout; not physical-device/audio QA.`);
}finally{await browser.close()}
