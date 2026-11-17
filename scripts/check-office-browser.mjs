/** Local integration with an actual read-only snapshot; no synthetic live activity. */
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE||'/workspace/work/render/node_modules/playwright-core/index.mjs').href);
const root=resolve(new URL('..',import.meta.url).pathname),out=resolve(process.argv[2]||'/tmp/office-proof');mkdirSync(out,{recursive:true});
const html=readFileSync(resolve(root,'src/pages/office.astro'),'utf8').replace(/^---[\s\S]*?---\s*/,'').replace('{title}','The Office · PointCast').replace(' is:inline','');
const snapshot=JSON.parse(readFileSync(process.env.OFFICE_SNAPSHOT||'/tmp/s4-live-snapshot.json'));
let reads=0;
const server=createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 if(req.url==='/api/office'){reads++;res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(snapshot));return;}
 if(req.url==='/office'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
 const path=resolve(root,'public','.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!path.startsWith(resolve(root,'public')+'/')||!existsSync(path)){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':({'.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[extname(path)]||'application/octet-stream'}).end(readFileSync(path));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[],writes=[],external=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.method());if(!r.url().startsWith('http://127.0.0.1:'))external.push(r.url());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/office');
  await page.waitForFunction(()=>document.querySelectorAll('.office-desk').length===6);
  assert.equal(await page.locator('.office-desk__noun').count(),6);
  assert.equal(await page.locator('.office-desk[data-activity="recent"]').count(),0,'Sid parent contract mismatch stays dark');
  assert.equal(await page.locator('#office-sound').isDisabled(),true);
  assert.equal(await page.locator('[data-state=\"verified-merged\"]').count(),snapshot.evidenceFresh?snapshot.merges.length:0);
  assert.equal(await page.locator('body').getAttribute('data-motion'),'reduced');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const before=reads;await page.waitForTimeout(500);assert.equal(reads,before,'no background polling');
  await page.locator('.office-phone-nav__button').filter({hasText:'Evidence'}).click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'office-evidence');
  await page.locator('#office-refresh').click();await page.waitForFunction(()=>!document.querySelector('#office-refresh').disabled);
  assert.equal(reads,before+1);await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:resolve(out,'office-'+viewport.width+'.png'),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);
  await page.close();
 }
 console.log('PASS: actual-snapshot 390/1440px integration, six whole portraits, truthful dark contract failure, keyboard/focus, silent reduced motion, bounded reads, no errors/overflow/writes/external requests.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
