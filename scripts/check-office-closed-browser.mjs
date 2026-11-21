/** Test the actual built, post-cutoff /office page. Usage: node scripts/check-office-closed-browser.mjs [dist] [phone.png] */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {OFFICE_END} from '../public/office/freshness.mjs';

const {chromium} = await import(process.env.PROGRESS_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PROGRESS_PLAYWRIGHT_MODULE).href : 'playwright-core');
const dist = resolve(process.argv[2] || 'dist');
const origin = 'http://office.test';
const boardPath = '/loom?to=%23officenoun-tasks';
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
try {
  for (const javaScriptEnabled of [true, false]) {
    const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,javaScriptEnabled});
    const unexpected = [];
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() === 'GET' && url.origin === origin) {
        if (url.pathname === '/office/') return route.fulfill({path:resolve(dist,'office/index.html'),contentType:'text/html'});
        if (url.pathname === '/images/ufogp/sid.svg') return route.fulfill({path:resolve(dist,'images/ufogp/sid.svg'),contentType:'image/svg+xml'});
        if (url.pathname.startsWith('/_astro/') && url.pathname.endsWith('.css')) {
          return route.fulfill({body:await readFile(resolve(dist,'.'+url.pathname)),contentType:'text/css'});
        }
        if (url.pathname + url.search === boardPath) return route.fulfill({contentType:'text/plain',body:'Test destination'});
      }
      unexpected.push(request.method() + ' ' + request.url());
      return route.abort();
    });
    await page.goto(origin+'/office/');
    assert.match(await page.getByRole('heading',{level:1}).innerText(), /The Office\s+is closed/);
    assert.equal(await page.locator('time').getAttribute('datetime'),new Date(OFFICE_END).toISOString());
    assert.equal(await page.locator('script, button').count(),0,'the ended floor has no active controls');
    assert.equal(await page.getByRole('link').count(),1);
    const link = page.getByRole('link',{name:'Read the task board'});
    const box = await link.boundingBox();
    assert.ok(box && box.y + box.height <= 844 && box.height >= 44, 'action fits in the phone viewport');
    assert.ok(await page.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth===320)));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if (javaScriptEnabled && process.argv[3]) await page.screenshot({path:process.argv[3]});
    await Promise.all([page.waitForURL(origin+boardPath),link.tap()]);
    assert.deepEqual(unexpected,[],'the closed Office must not query the API');
    await page.close();
  }
  console.log('PASS: built Office closed view at 390px, image, cutoff, single task-board link, JS on/off, no API reads.');
} finally {
  await browser.close();
}
