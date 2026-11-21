import {chromium} from '/workspace/work/render/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const errors=[];
for(const width of [320,390,768,1280]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(String(e)));const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('http://localhost:18869/');
 assert.equal(await page.locator('h1').count(),1);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert(await page.locator('#portrait').evaluate(i=>i.complete&&i.naturalWidth===320));
 await page.getByRole('button',{name:'Unassigned',exact:true}).click();
 assert.equal(await page.locator('#name').textContent(),'Unassigned desk');assert.equal(await page.locator('#source').isVisible(),false);
 assert.equal(await page.locator('#inbox-title').textContent(),'No inbox attached');
 await page.getByRole('button',{name:'Sol / preview',exact:true}).click();
 assert(await page.locator('#source').isVisible());assert.match(await page.locator('#source').getAttribute('href'),/sol-rival-phone/);
 await page.locator('summary').click();assert(await page.getByText('Approval remains with Mike',{exact:false}).isVisible());
 assert(requests.every(u=>u.startsWith('http://localhost:18869/')));
 if(width===390)await page.screenshot({path:'/tmp/sol-rival-phone-390.png',fullPage:true});
 console.log(`${width}x844: no overflow; portraits load; both desk states; source hidden/restored; disclosure; local requests only`);await page.close();
}
assert.deepEqual(errors,[]);await browser.close();console.log('No page errors. Emulated viewports only; no physical phone testing.');
