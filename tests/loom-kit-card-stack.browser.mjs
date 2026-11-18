// Run against the sketch's built public directory; pass an optional second argument for four PNGs.
// CARD_SOUND_MODULE can point at the local, pinned item 22 module to verify the real integration.
import assert from 'node:assert/strict';
import {mkdir, readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';

const {chromium} = await import(process.env.PROGRESS_PLAYWRIGHT_MODULE || 'playwright-core');
const root = resolve(process.argv[2] || fileURLToPath(new URL('../public/', import.meta.url)));
const output = process.argv[3];
if (output) await mkdir(output, {recursive:true});
const types = {'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server = createServer(async (req,res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const path = resolve(root, '.' + decodeURIComponent(pathname), pathname.endsWith('/') ? 'index.html' : '');
  if (req.method !== 'GET' || !path.startsWith(root + sep)) return res.writeHead(403).end();
  try {
    const data = await readFile(path);
    res.writeHead(200, {'content-type':types[extname(path)] || 'application/octet-stream'}).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolveListen => server.listen(0,'127.0.0.1',resolveListen));
const base = 'http://127.0.0.1:' + server.address().port;
const route = base + '/sketches/loom-kit/cards/';
const errors = [], unexpectedRequests = [];
let browser;

async function phone(soundModule, reducedMotion = 'no-preference') {
  const ctx = await browser.newContext({viewport:{width:390,height:844},isMobile:true,
    hasTouch:true,deviceScaleFactor:1,reducedMotion,serviceWorkers:'block'});
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await ctx.route('**/*', async handle => {
    const request = handle.request(), url = new URL(request.url());
    if (request.method() !== 'GET' || url.origin !== base || url.pathname.startsWith('/api/')) {
      unexpectedRequests.push(request.method() + ' ' + request.url()); return handle.abort();
    }
    if (url.pathname === '/loom/kit/sound.mjs') {
      return soundModule ? handle.fulfill({path:soundModule,contentType:'text/javascript'}) : handle.fulfill({status:404,body:''});
    }
    return handle.continue();
  });
  return page;
}
const selectors = {
  note:'[data-stack][data-state="ready"][data-card-type="note"]',
  confirm:'[data-stack][data-state="ready"][data-card-type="confirm"]'
};
async function state(page, value) {
  await page.locator(selectors[value] || '[data-stack][data-state="'+value+'"]').waitFor({timeout:6000});
}
async function inspect(page, filename) {
  const stack = page.locator('[data-stack]');
  const flameState = await stack.locator('[data-fire]').getAttribute('data-flame-state');
  assert.equal(flameState,['note','confirm'].includes(filename)?'bright':'embers', filename+' flame');
  await stack.locator('.lk-departing').waitFor({state:'detached'});
  await stack.locator('[data-card]').evaluate(card=>Promise.allSettled(card.getAnimations().map(a=>a.finished)));
  await stack.locator('img:visible').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  const visibleTargets = stack.locator('button:visible,a[href]:visible');
  for (const target of await visibleTargets.all()) {
    const box = await target.boundingBox();
    assert.ok(box && box.width >= 44 && box.height >= 44, '44px target: '+await target.innerText()+' '+JSON.stringify(box));
  }
  const action = stack.locator('[data-primary]:visible');
  if (await action.count()) {
    const box = await action.boundingBox();
    assert.ok(box.y >= 844 * 2/3 && box.y + box.height <= 844, filename+' primary in lower third: '+JSON.stringify(box));
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), filename+' should fit horizontally');
  if (output) await page.screenshot({path:resolve(output,filename+'.png')});
}
async function swipe(page) {
  const card = await page.locator('[data-card]:visible').first().boundingBox();
  const y = Math.round(card.y + Math.min(card.height * .45, 230));
  const right = Math.round(card.x + card.width * .85), left = Math.round(card.x + card.width * .15);
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:right,y}]});
    for (let i=1;i<=6;i++) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(right+(left-right)*i/6),y}]});
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  } finally { await cdp.detach(); }
}
async function verifyRapidTaps(reducedMotion) {
  const page = await phone(undefined, reducedMotion);
  await page.goto(route); await state(page,'note');
  const primary = page.locator('[data-primary]');
  const box = await primary.boundingBox();
  const x = Math.round(box.x + box.width/2), y = Math.round(box.y + box.height/2);
  // Coordinate taps bypass Playwright's aria-disabled auto-wait, just as a finger does.
  await page.evaluate(() => {
    window.primaryTouches = [];
    document.addEventListener('click', event => {
      if (!event.target.closest('[data-primary]')) return;
      window.primaryTouches.push({at:event.timeStamp, card:document.querySelector('[data-stack]').dataset.cardType,
        outgoing:document.querySelector('.lk-departing')?.innerText.includes('Ada') || false});
    }, true);
  });
  await page.touchscreen.tap(x,y);
  await page.touchscreen.tap(x,y);
  const taps = await page.evaluate(()=>window.primaryTouches);
  assert.deepEqual(taps.map(t=>[t.card,t.outgoing]),[['note',false],['confirm',true]], 'both taps reached the primary while Ada was departing');
  assert.ok(taps[1].at - taps[0].at <= 100,'two real touches landed within 100ms: '+(taps[1].at-taps[0].at));
  await state(page,'confirm');
  await page.locator('.lk-departing').waitFor({state:'detached'});
  await primary.tap();
  await page.locator('[data-stack][data-card-type=reply]').waitFor();

  // Skipping and undoing are still possible during the same handoff.
  await page.reload(); await state(page,'note');
  const next = await page.locator('[data-next]').boundingBox();
  await page.touchscreen.tap(x,y);
  await page.touchscreen.tap(next.x+next.width/2,next.y+next.height/2);
  await page.locator('[data-stack][data-card-type=reply]').waitFor();
  await page.locator('[data-undo]').tap();
  await state(page,'note');
  await page.context().close();
}
// This plain host imports its kit separately so a card's private import is observable.
async function verifySharedSound(soundModule, replaceStandalone) {
  const page = await phone(soundModule), privateImports = [];
  page.on('request',request=>{
    if (request.url().includes('/loom/kit/sound.mjs')) privateImports.push(request.url());
  });
  await page.addInitScript(()=>{
    window.soundAudit = {contexts:0, closed:0, tones:0, ownership:[], cues:[]};
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args) { super(...args); window.soundAudit.contexts++; }
      createOscillator() {
        const oscillator = super.createOscillator(), start = oscillator.start.bind(oscillator);
        oscillator.start = (...args)=>{window.soundAudit.tones++; return start(...args);};
        return oscillator;
      }
      close() { window.soundAudit.closed++; return super.close(); }
    };
  });
  await page.route('**/host-sound.mjs',r=>r.fulfill({path:soundModule,contentType:'text/javascript'}));
  await page.route('**/test-host',r=>r.fulfill({contentType:'text/html',body:
    '<meta name="viewport" content="width=device-width,initial-scale=1"><button id="owner" aria-pressed="false">Host sound</button><main id="slot"></main>'}));
  await page.goto(base+'/test-host');
  await page.evaluate(async()=>{
    const {createLoomSound} = await import('/host-sound.mjs');
    const {mountDemo} = await import('/loom/kit/card-stack.mjs');
    const sound = createLoomSound(), ownerToggle = sound.setEnabled, ownerPlay = sound.play;
    const owner = document.querySelector('#owner'), slot = document.querySelector('#slot');
    owner.onclick = async()=>{
      await ownerToggle(!sound.enabled);
      owner.setAttribute('aria-pressed',String(sound.enabled));
    };
    for (const method of ['unlock','setEnabled','setFireBed','dispose']) {
      const original = sound[method];
      sound[method] = (...args)=>{window.soundAudit.ownership.push(method); return original(...args);};
    }
    sound.play = name=>{
      const played = ownerPlay(name);
      window.soundAudit.cues.push({name,played}); return played;
    };
    window.host = {
      local:()=>mountDemo(slot),
      async mount(){ this.unmount = await mountDemo(slot,{sound}); },
      play:()=>ownerPlay('receive')
    };
  });
  if (replaceStandalone) {
    await page.evaluate(()=>window.host.local().then(()=>true));
    await page.locator('[data-sound]').tap();
    await page.locator('[data-sound][aria-pressed=true]').waitFor();
  }
  const audit = ()=>page.evaluate(()=>window.soundAudit);
  const old = await audit(), initialImports = privateImports.length;
  assert.equal(old.contexts,replaceStandalone?1:0);
  await page.evaluate(()=>window.host.mount());
  await state(page,'note');
  assert.equal(await page.locator('[data-stack] [data-sound]:visible').count(),0,'only the host owns a sound control');
  assert.equal((await audit()).closed,replaceStandalone?1:0,'replacing an active standalone mount closes its own context');
  const primary = page.locator('[data-primary]');
  await primary.tap(); await state(page,'confirm');
  assert.deepEqual((await audit()).cues,[],'muted host receives no play call');
  assert.equal((await audit()).tones,old.tones);
  const owner = page.locator('#owner');
  await owner.tap(); await page.locator('#owner[aria-pressed=true]').waitFor();
  await page.locator('.lk-departing').waitFor({state:'detached'});
  await primary.tap(); await page.locator('[data-stack][data-card-type=reply]').waitFor();
  const audible = await audit();
  assert.deepEqual(audible.cues,[{name:'yes',played:true}]);
  assert.ok(audible.tones>old.tones,'the real host kit started its chord');
  await owner.tap(); await page.locator('#owner[aria-pressed=false]').waitFor();
  await primary.tap(); await state(page,'empty');
  assert.deepEqual((await audit()).cues,audible.cues,'host mute takes effect on the next card');
  assert.equal((await audit()).tones,audible.tones);
  await owner.tap(); await page.locator('#owner[aria-pressed=true]').waitFor();
  await page.evaluate(()=>window.host.mount());
  await state(page,'note'); await primary.tap();
  const remounted = await audit();
  assert.deepEqual(remounted.cues.at(-1),{name:'tap',played:true},'remounted cards use the same host instance');
  await page.evaluate(()=>window.host.unmount());
  assert.equal(await page.locator('[data-stack]').count(),0);
  assert.equal(await page.evaluate(()=>window.host.play()),true,'the host can still play after unmount');
  const final = await audit();
  assert.ok(final.tones>remounted.tones);
  assert.equal(final.contexts,old.contexts+1,'no additional card-owned context in shared mode');
  assert.equal(final.closed,replaceStandalone?1:0,'borrowed context stays open');
  assert.deepEqual(final.ownership,[],'cards may not change host preferences, unlock, or dispose');
  assert.equal(privateImports.length,initialImports,'shared mount needs no private sound module import');
  await page.context().close();
}
try {
  browser = await chromium.launch({executablePath:process.env.PROGRESS_CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  // For the gallery use the real optional sound module if provided, so the exact shot stack is explicit.
  const page = await phone(process.env.CARD_SOUND_MODULE);
  await page.goto(route); await state(page,'note');
  const sound = page.locator('[data-sound]');
  await sound.waitFor();
  if (process.env.CARD_SOUND_MODULE) await page.locator('[data-sound]:enabled').waitFor();
  else await page.getByRole('button',{name:/sound unavailable/i}).waitFor();
  assert.equal(await sound.getAttribute('aria-pressed'),'false','audio defaults to off');
  assert.equal(await page.getByRole('button',{name:/^yes\b/i}).count(),0,'a note cannot offer confirmation');
  await inspect(page,'note');
  const next = page.locator('[data-next]');
  await next.tap(); await state(page,'confirm');
  assert.match(await page.locator('[data-primary]').innerText(),/yes/i);
  await inspect(page,'confirm');
  await page.locator('[data-primary]').tap();
  await page.locator('[data-stack][data-card-type=reply]').waitFor();
  let reads = 0, proceed;
  const initialRead = new Promise(resolveRead => { proceed = resolveRead; });
  await page.route('**/cards.json', async request => {
    reads++;
    if (reads === 1) { await initialRead; return request.abort('internetdisconnected'); }
    if (reads === 2) return request.fulfill({status:503,body:''});
    if (reads === 4) return request.fulfill({json:[]});
    if (reads === 5) return request.fulfill({json:[{kind:'note',person:'Ada',room:'Reading room',title:'The guide says “needs your yes”.'}]});
    return request.fallback();
  });
  await page.goto(route,{waitUntil:'domcontentloaded'}); await state(page,'loading');
  assert.equal(await page.locator('[data-fire]').getAttribute('data-flame-state'),'steady');
  assert.equal(await page.getByRole('button',{name:/^yes\b/i}).count(),0);
  proceed();
  await state(page,'offline'); await inspect(page,'offline');
  const retry = page.locator('[data-primary]');
  await retry.tap(); await state(page,'error');
  assert.equal(await page.locator('[data-fire]').getAttribute('data-flame-state'),'embers');
  await retry.tap(); await state(page,'note');
  assert.equal(reads,3,'one snapshot read per attempt');
  await page.reload(); await state(page,'empty'); await inspect(page,'empty');
  await retry.tap(); await state(page,'note');
  assert.equal(await page.getByRole('button',{name:/^yes\b/i}).count(),0,'quoted words must never make a confirm action');
  await page.context().close();

  const behavior = await phone(undefined,'reduce');
  await behavior.clock.install(); await behavior.goto(route); await state(behavior,'note');
  assert.ok(await behavior.locator('[data-sound]').isDisabled(),'unavailable audio cannot be switched on');
  const primary = behavior.locator('[data-primary]');
  await primary.focus(); await behavior.keyboard.press('Enter');
  await state(behavior,'confirm');
  assert.ok(await primary.evaluate(el=>el===document.activeElement),'keyboard action should move focus to the next primary');
  const moves = await behavior.locator('[data-stack]').evaluate(root=>root.getAnimations({subtree:true}).flatMap(animation=>{
    const frames = animation.effect.getKeyframes();
    return ['transform','translate','scale','rotate'].filter(key=>new Set(frames.map(frame=>frame[key])).size>1);
  }));
  assert.deepEqual(moves,[],'reduced-motion mode must not animate position, tilt, or scale');
  const fire = behavior.locator('[data-fire]');
  assert.equal(await fire.getAttribute('data-flame-state'),'spark');
  await behavior.clock.fastForward(601);
  assert.equal(await fire.getAttribute('data-flame-state'),'bright');
  const undo = behavior.locator('[data-undo]');
  await undo.waitFor(); await undo.tap(); await state(behavior,'note');
  await primary.tap(); await state(behavior,'confirm');
  await behavior.clock.fastForward(5100);
  assert.ok(!await undo.isVisible(),'undo expires after five seconds');
  await behavior.goto(route);
  await state(behavior,'note'); await swipe(behavior); await state(behavior,'confirm');
  await behavior.locator('.lk-departing').waitFor({state:'detached'});
  await primary.press('Enter'); await behavior.locator('[data-stack][data-card-type=reply]').waitFor({timeout:3000});
  await behavior.context().close();

  await verifyRapidTaps('no-preference');
  await verifyRapidTaps('reduce');

  if (process.env.CARD_SOUND_MODULE) {
    const audio = await phone(process.env.CARD_SOUND_MODULE);
    await audio.goto(route); await state(audio,'note');
    const toggle = audio.locator('[data-sound]');
    await toggle.tap();
    assert.equal(await toggle.getAttribute('aria-pressed'),'true','real sound kit enabled after touch');
    await audio.reload(); await state(audio,'note');
    await audio.locator('[data-sound]:enabled').waitFor();
    assert.equal(await toggle.getAttribute('aria-pressed'),'true','opt-in remembered');
    await toggle.tap();
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    await audio.context().close();
    await verifySharedSound(process.env.CARD_SOUND_MODULE,false);
    await verifySharedSound(process.env.CARD_SOUND_MODULE,true);
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(unexpectedRequests,[]);
  console.log('PASS: 390×844 states, readable assets, thumb actions, 44px targets, touch swipe, Undo, read-only local navigation and sound control.');
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
