/** Local asset-only browser proof. No live site, accounts, scripts or writes. */
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=process.env.PROGRESS_PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE).href):await import('playwright-core');
const folder=new URL('../public/images/after-hours-art/',import.meta.url);
const out=resolve(process.argv[2]||'/tmp/after-hours-art-proof');mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=createServer((req,res)=>{try{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(path.includes('..')){res.writeHead(403).end();return;}
 const file=new URL('.'+path,folder);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'}).end(readFileSync(file));
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;let browser;
try{
 browser=await chromium.launch({executablePath:process.env.PROGRESS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:1100},{width:390,height:844}]){
  const context=await browser.newContext({viewport,javaScriptEnabled:false});const page=await context.newPage();const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push({method:r.method(),url:r.url()}));
  await page.goto(origin+'/proof.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('script,iframe,form,audio,video').count(),0);
  assert.equal(await page.locator('img').count(),9);
  assert.ok(await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0&&img.getBoundingClientRect().width>0)));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.locator('.portraits figure').count(),6);
  assert.ok(await page.locator('.portraits img').evaluateAll(imgs=>imgs.every(img=>Math.abs(img.getBoundingClientRect().width-img.getBoundingClientRect().height)<1)));
  assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.method==='GET'&&r.url.startsWith(origin+'/')));
  await page.screenshot({path:resolve(out,`proof-${viewport.width}.png`),fullPage:true});
  await context.close();
 }
 console.log('PASS: 390/1440px, JavaScript disabled, 9 SVGs load, 6 whole square portraits, no horizontal overflow/errors/external requests/writes.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
