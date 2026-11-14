/** Local browser proof for OFF-59. All posts below go to an in-memory service. */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { handleLoom } from '../src/lib/loom/service.mjs';
import { serveFor } from '../src/lib/loom/for-route.mjs';
const { chromium } = process.env.PROGRESS_PLAYWRIGHT_MODULE ? await import(pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE).href) : await import('playwright-core');
const out = resolve(process.argv[2] || '/tmp/loom-third-proof'); mkdirSync(out,{recursive:true});
const source=readFileSync(new URL('../src/pages/loom/index.astro',import.meta.url),'utf8');
const between=(a,b)=>{const start=source.indexOf(a)+a.length;return source.slice(start,source.indexOf(b,start));};
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+between('<style is:inline>','</style>')+'</style></head><body>'+between('<body>','<script is:inline>')+'<script>'+between('<script is:inline>','</script>')+'</script></body></html>';
const map=new Map(), kv={get:async k=>map.get(k)??null,put:async(k,v)=>map.set(k,v)};
const jason={name:'Jason',kind:'human',address:'@jason'};
const chief={name:'Chief',kind:'agent',address:'@chief'};
async function seed(to,from,body,hours=0){const res=await handleLoom(new Request('https://pointcast.xyz/api/loom',{method:'POST',body:JSON.stringify({to,from,body})}),{kv,firstHelloEnabled:false,clock:()=>new Date(Date.now()-hours*3600000)});assert.equal(res.status,201);return (await res.json()).message;}
await seed('@chief',chief,'CARD · Chief\nI am an AI agent. I only run when Jason opens a chat with me. I am not watching between visits.',30);
const pending=await seed('@chief',jason,'@chief Please show the next phone draft.',10);
await seed('@chief',jason,'@chief An older request still waiting.',26);
const answered=await seed('@chief',jason,'@chief This request was handled elsewhere.',5);
await seed('#handoff',chief,`Here is the response: https://pointcast.xyz/loom?to=%40chief#${answered.id}`,1);
const writes=[];
const server=createServer(async(req,res)=>{try{
  let response;
  if(req.url.startsWith('/loom/for/'))response=await serveFor(new Request('https://pointcast.xyz'+req.url,{method:req.method,headers:req.headers}),kv,req.url.split('?')[0].split('/').pop());
  else if(req.url.startsWith('/api/loom')){let body='';for await(const part of req)body+=part;if(req.method==='POST')writes.push(JSON.parse(body));response=await handleLoom(new Request('https://pointcast.xyz'+req.url,{method:req.method,headers:req.headers,...(body?{body}:{})}),{kv,firstHelloEnabled:false});}
  else if(req.url==='/loom-availability.mjs'){res.writeHead(200,{'content-type':'text/javascript; charset=utf-8'}).end(readFileSync(new URL('../public/loom-availability.mjs',import.meta.url)));return;}
  else if(req.url.startsWith('/loom')){res.writeHead(200,{'content-type':'text/html; charset=utf-8'}).end(html);return;}
  else{res.writeHead(404).end();return;}
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
}catch(error){res.writeHead(500).end(String(error));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;let browser;
try{
  browser=await chromium.launch({executablePath:process.env.PROGRESS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.addInitScript(()=>localStorage.setItem('loom.name','Mike'));
    await page.goto(origin+'/loom/for/jason');
    await page.locator('[data-activity="unanswered"] .availability').first().waitFor();
    assert.ok(page.url().includes('/loom?for=jason'));
    assert.equal(await page.locator('#asBtn').textContent(),'Mike');
    assert.match(await page.locator('#fyDyn .visiting').textContent(),/Public For You for @jason/);
    const recent=page.locator('#fyDyn > [data-activity="unanswered"]');assert.equal(await recent.count(),1);
    assert.match(await recent.textContent(),/Please show the next phone draft/);
    assert.deepEqual(await recent.locator('.fyacts button').allTextContents(),['nudge']);
    assert.match(await recent.locator('.availability').textContent(),/@chief runs only when Jason opens a chat/);
    assert.equal(await page.locator('#fyOlder').getAttribute('open'),null);
    assert.match(await page.locator('#fyOlder summary').textContent(),/1 older unanswered/);
    assert.ok(!(await page.locator('#fyDyn').textContent()).includes('handled elsewhere'));
    assert.ok(!(await page.locator('#fyDyn').textContent()).includes('Recent activity from up to'));
    await page.waitForTimeout(750);assert.equal(writes.length,0,'viewing a public queue does not post seen');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
    await page.screenshot({path:resolve(out,`for-you-${viewport.width}.png`)});
    await page.locator('#fyOlder summary').click();await page.locator('#fyOlder [data-activity]').waitFor({state:'visible'});
    await page.screenshot({path:resolve(out,`older-${viewport.width}.png`)});
    assert.deepEqual(errors,[]);await page.close();
  }
  // A nudge remains a note to the original post, under the actual stored identity.
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(()=>localStorage.setItem('loom.name','Jason'));
  await page.goto(origin+'/loom/for/jason');await page.locator('#fyDyn > [data-activity="unanswered"] .fyacts button').waitFor();
  await page.locator('#fyDyn > [data-activity="unanswered"] .fyacts button').click();
  await page.getByText('Posted: nudge',{exact:true}).waitFor();
  assert.equal(writes.length,1);assert.equal(writes[0].body,'nudge');assert.equal(writes[0].kind,'note');assert.equal(writes[0].from.name,'Jason');assert.ok(writes[0].to.endsWith('#'+pending.id));
  await page.close();console.log('PASS: phone/desktop short link, unchanged posting identity, nudge only, 24h/older fold, cross-thread answer, Chief cadence, no overflow/page errors; one mock nudge, no seen writes.');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
