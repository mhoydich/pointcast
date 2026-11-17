/** S3: actual page, local GET-only in-memory service; no live board access. */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { serveFor } from '../src/lib/loom/for-route.mjs';
const { chromium } = await import(process.env.PROGRESS_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE).href : 'playwright-core');
const out = resolve(process.argv[2] || '/tmp/loom-for-share-proof'); mkdirSync(out,{recursive:true});
const source = readFileSync(new URL('../src/pages/loom/index.astro',import.meta.url),'utf8');
const between = (a,b) => {const i=source.indexOf(a)+a.length; return source.slice(i,source.indexOf(b,i));};
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+between('<style is:inline>','</style>')+'</style></head><body>'+between('<body>','<script is:inline>')+'<script>'+between('<script is:inline>','</script>')+'</script></body></html>';
const map=new Map(),kv={get:async k=>map.get(k)??null,put:async(k,v)=>map.set(k,v)};
const seed=async(name,body,hours=0)=>{
 const r=await handleLoom(new Request('https://pointcast.xyz/api/loom',{method:'POST',body:JSON.stringify({to:'#review',from:{name,kind:'agent'},kind:'note',body})}),{kv,clock:()=>new Date(Date.now()-hours*3600000),firstHelloEnabled:false}); assert.equal(r.status,201);
};
for(let i=0;i<5;i++) await seed('mike','Older unanswered '+i,30+i);
await seed('Desk','NEEDS MIKE · review the draft');
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  let r;
  if(req.url.startsWith('/api/loom')) r=await handleLoom(new Request('https://pointcast.xyz'+req.url),{kv});
  else if(req.url.startsWith('/loom/for/')) r=await serveFor(new Request('https://pointcast.xyz'+req.url,{headers:req.headers}),kv,decodeURIComponent(new URL(req.url,'https://pointcast.xyz').pathname.slice('/loom/for/'.length)));
  if(r){res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text());return;}
  if(req.url==='/loom-availability.mjs'){res.writeHead(200,{'content-type':'text/javascript'}).end(readFileSync(new URL('../public/loom-availability.mjs',import.meta.url)));return;}
  if(req.url.startsWith('/loom')){res.writeHead(200,{'content-type':'text/html; charset=utf-8'}).end(html);return;}
  res.writeHead(404).end();
 }catch(e){res.writeHead(500).end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.PROGRESS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
  const page=await browser.newPage({viewport}), errors=[], writes=[];
  page.on('pageerror',e=>errors.push(String(e))); page.on('request',r=>{if(r.method()!=='GET')writes.push(r.method());});
  await page.addInitScript(()=>localStorage.setItem('loom.name','tester'));
  await page.goto(origin+'/loom/for/MiKe');
  await page.locator('#fyOlder').waitFor({state:'attached'});
  assert.match(page.url(),/\/loom\?for=mike#for-you$/);
  assert.match(await page.locator('#fyPublicView').textContent(),/Public For you for @mike/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('loom.name')),'tester');
  assert.equal(await page.locator('.tiles [data-fyact^="tile-"]').count(),6);
  assert.equal(await page.locator('[data-fyact="tile-unanswered"] .tn').textContent(),'0');
  assert.ok(await page.locator('.gate').count()>0,'existing approval gate remains');
  assert.equal(await page.locator('#fyOlder').evaluate(e=>e.open),false);
  await page.locator('#fyOlder summary').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#fyOlder').evaluate(e=>e.open),true);
  assert.equal(await page.locator('#fyOlder .fyactivity').count(),3);
  await page.locator('#fyOlder .showall').click();
  assert.equal(await page.locator('#fyOlder .fyactivity').count(),5);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:resolve(out,'share-'+viewport.width+'.png')});
  await page.waitForTimeout(750);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  await page.close();
 }
 console.log('PASS: 390/1440px browser share redirect, preserved writer/dashboard/gate, older-only fold, keyboard expansion/show all, no overflow/errors/writes.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
