/* Browser regression for delayed and failed Sunny Side game module loading.
 * Run: node tests/sunny-start-browser.cjs [path-to-checkout]
 * Set PLAYWRIGHT_MODULE_PATH and CHROMIUM_PATH if your installation differs.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || '/opt/codex/cua_node/lib/node_modules/playwright');
const root = path.resolve(process.argv[2] || process.cwd(), 'public');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp'};
const slugs = ['roof-hop','wire-walk','puppy-dream','pebble-pop','garden-pairs'];
async function waitForModule(observed, label) {
  let timer;
  try {
    await Promise.race([observed, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}: module request did not arrive`)), 8000);
    })]);
  } finally { clearTimeout(timer); }
}
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'}).end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const ctx = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    for (const slug of slugs) {
      const page = await ctx.newPage(); page.setDefaultTimeout(8000);
      const errors=[]; page.on('pageerror', e => errors.push(e.message));
      let release, signal;
      const held = new Promise(resolve => { release=resolve; });
      const observed = new Promise(resolve => { signal=resolve; });
      await page.route(`**/modules/${slug}.js`, async route => { signal(); await held; await route.continue(); });
      await page.goto(`http://127.0.0.1:${port}/games/${slug}/index.html`, {waitUntil:'commit'});
      await waitForModule(observed, slug);
      const start=page.locator('#start'); await start.waitFor({state:'visible'});
      assert.equal(await start.isDisabled(), true, `${slug}: start must be disabled while module loads`);
      assert.match(await start.innerText(), /loading/i, `${slug}: loading state must be visible`);
      const box=await start.boundingBox();
      for (let i=0;i<3;i++) await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
      assert.equal(await page.locator('#overlay').isVisible(),true,`${slug}: tapping during load cannot dismiss intro`);
      assert.equal(await page.locator('#pause').isDisabled(),true,`${slug}: no round should be running during load`);
      await page.locator('#sound').focus();
      release();
      await page.waitForFunction(() => !document.querySelector('#start').disabled);
      assert.match(await start.innerText(), /play/i, `${slug}: ready state invites play`);
      assert.equal(await page.locator('#status').getAttribute('aria-live'),'polite');
      assert.match(await page.locator('#status').textContent(), /ready/i, `${slug}: readiness announced`);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'sound', `${slug}: readiness does not steal focus`);
      await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
      assert.equal(await page.locator('#overlay').isHidden(), true, `${slug}: first ready click starts`);
      assert.equal(await page.locator('#pause').isEnabled(),true);
      // Simulate a rapid follow-up tap at the same location after the button
      // disappears: it must leave the active round running.
      for (let i=0;i<2;i++) await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
      assert.equal(await page.locator('#overlay').isHidden(),true,`${slug}: repeated ready taps keep the round running`);
      const canvas=page.locator('canvas'), canvasBox=await canvas.boundingBox();
      for(let i=0;i<3;i++) await page.touchscreen.tap(canvasBox.x+canvasBox.width*.5,canvasBox.y+canvasBox.height*.55);
      await page.locator('#pause').click();
      assert.equal(await page.locator('#resume').isVisible(),true,`${slug}: pause opens resume`);
      await page.locator('#resume').click();
      assert.equal(await page.locator('#overlay').isHidden(),true,`${slug}: resume returns to round`);
      await page.locator('#pause').click();
      await start.click();
      assert.equal(await page.locator('#overlay').isHidden(),true,`${slug}: fresh round starts`);
      assert.match(await page.locator('#status').textContent(), /Round started/, `${slug}: new round announced`);
      assert.deepEqual(errors,[],`${slug}: no uncaught browser errors`);
      console.log(`PASS ${slug}: delayed load, repeated taps, start, pause/resume, fresh round`);
      await page.close();
    }
    {
      const page = await ctx.newPage(); page.setDefaultTimeout(8000);
      let release, signal;
      const held = new Promise(resolve => { release=resolve; });
      const observed = new Promise(resolve => { signal=resolve; });
      await page.route('**/modules/roof-hop.js', async route => { signal(); await held; await route.continue(); });
      await page.goto(`http://127.0.0.1:${port}/games/roof-hop/index.html`,{waitUntil:'commit'});
      await waitForModule(observed, 'keyboard');
      await page.locator('#sound').focus();
      assert.equal(await page.locator('#start').isDisabled(),true);
      release();
      await page.waitForFunction(() => !document.querySelector('#start').disabled);
      assert.equal(await page.evaluate(() => document.activeElement.id),'sound','ready transition retains focus');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.tagName),'CANVAS');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id),'start','ready start reachable with Tab');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#overlay').isHidden(),true,'Enter starts the round');
      console.log('PASS keyboard: focus retained on ready, Tab reaches start, Enter starts');
      await page.close();
    }
    {
      const page = await ctx.newPage(); page.setDefaultTimeout(8000);
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      let release, signal;
      const held = new Promise(resolve => { release=resolve; });
      const observed = new Promise(resolve => { signal=resolve; });
      await page.route('**/modules/roof-hop.js', async route => { signal(); await held; await route.abort('failed'); });
      await page.goto(`http://127.0.0.1:${port}/games/roof-hop/index.html`,{waitUntil:'commit'});
      await waitForModule(observed, 'failure');
      await page.locator('#sound').focus();
      release();
      await page.waitForFunction(() => document.querySelector('#start')?.textContent === 'Game unavailable');
      assert.equal(await page.locator('#start').isDisabled(),true);
      assert.match(await page.locator('#overlay-copy').innerText(),/refresh/i);
      assert.equal(await page.locator('#status').getAttribute('aria-live'),'polite');
      assert.match(await page.locator('#status').textContent(),/unavailable.*refresh/i);
      assert.equal(await page.evaluate(() => document.activeElement.id),'sound','failed load does not steal focus');
      assert.deepEqual(errors,[]);
      console.log('PASS failed module: unavailable state, disabled start, refresh guidance');
      await page.close();
    }
    await ctx.close();
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode=1; });
