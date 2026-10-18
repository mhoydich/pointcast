/**
 * Morning Edition PR 2, the paper itself: src/pages/morning.astro (the static
 * BlockLayout shell) and src/scripts/morning-client.ts (what fills it from
 * /morning.json and /api/air). Source contracts in the style of
 * tests/air-pages.test.mjs: the client is TypeScript, so the rules other
 * builders and the smoke tests rely on are asserted in the text.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { FIRST_EDITION, FOOTER_LINE, SHOP_DISCLOSURE, SLOTS } from '../functions/_lib/morning.mjs';
import { PAPER_COPY, UI_COPY, replyLine, sourceFrom } from '../src/scripts/morning-signup.ts';
import { isNoindexPath } from '../src/lib/seo-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [page, client, sitemap, signup] = await Promise.all([
  read('src/pages/morning.astro'),
  read('src/scripts/morning-client.ts'),
  read('src/pages/sitemap-discovery.xml.ts'),
  read('src/scripts/morning-signup.ts'),
]);

test('page: a static BlockLayout shell that fetches /morning.json, with the masthead art as og:image', () => {
  assert.match(page, /import BlockLayout from '\.\.\/layouts\/BlockLayout\.astro'/);
  assert.match(page, /from '\.\.\/\.\.\/functions\/_lib\/morning\.mjs'/, 'labels and the footer come from the edition module, not a copy');
  assert.match(page, /const MASTHEAD = '\/images\/air\/morning-masthead\.webp'/);
  assert.match(page, /const MASTHEAD_800 = '\/images\/air\/morning-masthead-800\.webp'/);
  assert.match(page, /image=\{MASTHEAD\}/, 'og:image is the masthead');
  assert.match(page, /imageWidth=\{1600\}[\s\S]*imageHeight=\{600\}/);
  assert.match(page, /srcset=\{`\$\{MASTHEAD_800\} 800w, \$\{MASTHEAD\} 1600w`\}/);
  assert.match(page, /sizes="\(max-width: 680px\) 100vw, 640px"/);
  assert.match(page, /fetchpriority="high"/);
  assert.match(page, /type: 'application\/feed\+json', href: '\/morning\.json'/, 'rel=alternate to the feed');
  assert.match(page, /hideAds/);
  assert.doesNotMatch(page, /noindex/, 'the paper is indexed');
  assert.equal(isNoindexPath('/morning'), false);
  assert.match(page, /import \{ mountMorningPage \} from '\.\.\/scripts\/morning-client'/);
  const h1s = page.match(/<h1\b/g) ?? [];
  assert.equal(h1s.length, 1, 'one h1: the masthead line');
  assert.match(page, /<h1 class="me__mast me-mono" data-me-mast>/);
  assert.match(page, /<span>Morning Edition<\/span>[\s\S]*data-me-mast-no hidden[\s\S]*data-me-mast-day hidden[\s\S]*<span>6:45 AM<\/span>/, 'number and day fill in; the shell is never wrong, never blank');
  assert.match(page, /border-bottom: 2px solid var\(--pc-ink\)/, 'the masthead sits on a 2px ink rule');
  assert.match(page, /font-family: var\(--pc-font-mono\);\s*font-size: 14px;\s*font-weight: 500;/, 'JetBrains Mono, one of the two weights');
  const description = page.match(/const description =\s*'([^']+)'/)?.[1] ?? '';
  assert.ok(description.length >= 50 && description.length <= 160, `description is ${description.length} chars`);
});

test('page: seven slot rows in order, mono labels in channel color, 17px lines, mono bylines, skeleton before the fetch', () => {
  assert.match(page, /rows = SLOTS\.map/);
  assert.match(page, /data-me-slot=\{r\.id\}/);
  assert.match(page, /style=\{`--me-ch:\$\{r\.color\}`\}/);
  assert.match(page, /label: spot \? `\$\{slot\.id\} · \$\{mhzLabel\(spot\)\}` : slot\.id/, 'SKY · 6.100, COURTS · 7.500, PRICE, TOWN, RITUAL, PICK, SHOP');
  assert.match(page, /\.me__label \{ margin: 0; font-size: 12px; font-weight: 500; color: var\(--me-ch\); \}/);
  assert.match(page, /text-transform: uppercase/);
  assert.match(page, /\.me__line \{ margin: 0; font-size: 17px; line-height: 26px;/);
  assert.match(page, /\.me__meta \{[^}]*font-family: var\(--pc-font-mono\); font-size: 13px;/);
  assert.match(page, /<span class="me__sk" aria-hidden="true"><\/span><span class="me__sk me__sk--short" aria-hidden="true"><\/span>/, 'two quiet bars per row until the line lands');
  assert.match(page, /data-me-state="loading"/);
  assert.match(page, /<noscript>[\s\S]*href="\/morning\.json"[\s\S]*<\/noscript>/);
  assert.match(page, /<noscript>\s*<style is:inline>\.me__sk \{ animation: none !important; opacity: \.35; \} \[data-me-status\] \{ display: none !important; \}<\/style>/, 'without a script the shell is finished: no breathing bars, no "Loading…"');
  assert.match(page, /\.me__mast span:not\(\[hidden\]\) \+ span::before/, 'a masthead dot only follows a visible sibling, so the shell never reads "· 6:45 AM"');
  assert.doesNotMatch(page, /\.me__mast span \+ span::before/);
  assert.match(page, /\.me__by::after \{ content: '·'/, 'the meta-row dot trails the bylines, so a wrap never starts with one');
  assert.match(page, /prefers-reduced-motion: reduce/);
  for (const spot of config.spots) assert.doesNotMatch(page, new RegExp(`href="/r/${spot.id}"`), 'spot links come from spotUrl(), not literals');
  assert.deepEqual(SLOTS.map((s) => s.id), ['sky', 'courts', 'price', 'town', 'ritual', 'pick', 'shop']);
});

test('page: the live strip, the preview banner, the reporters line, prev/next and the footer', () => {
  assert.match(page, /<p class="me__live" data-me-live hidden>/, 'hidden until something is live');
  assert.match(page, /<i class="me__dot" aria-hidden="true"><\/i>/);
  assert.match(page, /--me-live: #D42A1E/, 'AirInk’s on-air red');
  assert.match(page, /:global\(\.me__live-item\)/, 'JS-created items need :global');
  assert.doesNotMatch(page, /white-space: nowrap/, 'a long reading wraps inside a 375 px strip instead of widening the page');
  assert.match(page, /\.me__live-text :global\(\.me__live-item\) \{ min-width: 0; overflow-wrap: anywhere; \}/);
  assert.match(page, /\.me__live-text \{ display: grid;[^}]*min-width: 0; \}/, 'one reading per line');
  assert.match(page, /data-me-preview hidden/);
  assert.match(page, /Preview\. No\. 1 is \{firstDay\} at 6:45 AM/);
  assert.match(page, /editionDayLabel\(FIRST_EDITION\)/);
  assert.equal(FIRST_EDITION, '2026-10-03');
  assert.match(page, /<p class="me__reporters" data-me-reporters hidden><\/p>/);
  assert.match(page, /<nav class="me__nav me-mono" data-me-nav aria-label="Other editions" hidden>[\s\S]*data-me-prev hidden[\s\S]*data-me-next hidden/);
  assert.match(page, /<p>\{FOOTER_LINE\} \{SHOP_DISCLOSURE\}<\/p>/, 'the points line and the shop disclosure, from the module');
  assert.equal(FOOTER_LINE, 'Reporters earn points, never cash, and never for what a report says.');
  assert.equal(SHOP_DISCLOSURE, 'No link, no commission.');
  assert.match(page, /<a href="\/morning\.json">\/morning\.json<\/a>/);
  assert.match(page, /<a href="\/api\/mcp">morning_edition on \/api\/mcp<\/a>/);
  assert.match(page, /<a href="\/r">field reports<\/a>/);
  assert.match(page, /data-me-error hidden role="status"/);
  assert.match(page, /data-me-error-retry>Try again</);
  assert.match(page, /max-width: 640px/);
  assert.match(page, /@media \(max-width: 380px\)/, 'a 375 px phone gets its own type sizes');
  assert.match(page, /@media \(min-width: 600px\) \{[\s\S]*grid-template-columns: 136px 1fr/, 'label column on desktop');
});

test('client: reads ?d=, fetches /morning.json, never composes a line, never touches storage', () => {
  assert.match(client, /from '\.\.\/\.\.\/functions\/_lib\/morning\.mjs'/, 'dates from the edition module');
  assert.match(client, /const DATE_RE = \/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\//);
  assert.match(client, /new URLSearchParams\(location\.search\)\.get\('d'\)/);
  assert.match(client, /d \? `\/morning\.json\?d=\$\{encodeURIComponent\(d\)\}` : '\/morning\.json'/);
  assert.match(client, /items\.find\(\(it\) => it && it\.id === `morning:\$\{d\}`\) : items\[0\]/, 'a dated read wants that date’s item, like the MCP tool');
  assert.match(client, /status === 400 \|\| status === 404\) return fail\(root, 'bad-date'\)/);
  assert.match(client, /Accept: 'application\/feed\+json, application\/json'/);
  assert.match(client, /text\(q\(li, '\[data-me-line\]'\), slot\.line\)/, 'the server’s line, verbatim');
  assert.match(client, /const signed = names\.some\(\(n\) => slot\.line\.includes\(n\)\);/, 'names print in one place: a signed line keeps its meta row to the source');
  assert.match(client, /show\(by, !signed && names\.length > 0\)/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB/, 'nothing is stored on the phone');
  assert.doesNotMatch(client, /pid_hash|ip_hash/);
  assert.doesNotMatch(client, /innerHTML/, 'text only: a line is untrusted until it is the server’s, and even then it is text');
  assert.match(client, /document\.title = `\$\{item\.title\} — PointCast`/);
  assert.match(client, /masthead\.split\(' · '\)/);
  assert.match(client, /show\(q\(root, '\[data-me-preview\]'\), p\.number === 0\)/);
  assert.match(client, /show\(reporters, Boolean\(p\.reporterLine\)\)/, 'the reporters line hides when nobody reported');
  assert.match(client, /RETRY_MS = 3_000/);
  assert.match(client, /if \(attempt === 0\) \{ window\.setTimeout/, 'one automatic retry, then the button');
  assert.match(client, /setState\(root, 'ready'\)/);
  assert.match(client, /setState\(root, 'error'\)/);
});

test('client: status line says frozen, provisional or preview; prev/next run from No. 1 to the current edition', () => {
  assert.match(client, /`Frozen \$\{laClock\(item\.date_modified\)\}`/);
  assert.match(client, /Provisional · waiting on/);
  assert.match(client, /klax: 'KLAX', reports: 'the report store'/);
  assert.match(client, /if \(p\.number === 0\) return '';/, 'a preview says PREVIEW once in the masthead and once in the banner, not a third time');
  assert.match(client, /text\(status, said\);\s*show\(status, Boolean\(said\)\);/, 'an empty status line hides');
  assert.doesNotMatch(client, /`Preview · /, 'the banner owns the preview message');
  assert.match(client, /date === editionDate\(now\) && date !== laToday\(now\)/, 'before 6:45 it says when the next edition is due');
  assert.match(client, /timeZone: 'America\/Los_Angeles'/);
  assert.match(client, /const ok = n >= 2;/, 'no edition before No. 1');
  assert.match(client, /const ok = n >= 1 && d <= current;/, 'no edition after the current one');
  assert.match(client, /d === current \? '\/morning' : `\/morning\?d=\$\{d\}`/);
});

test('client: the live strip is GET /api/air, red only for live, hidden when quiet, never "0 reporters"', () => {
  assert.match(client, /getJson<AirIndex>\('\/api\/air'\)/);
  assert.match(client, /LIVE_POLL_MS = 60_000/);
  assert.match(client, /visibilitychange/);
  assert.match(client, /if \(!items\.length\) \{ show\(strip, false\); return; \}/);
  assert.match(client, /`\$\{n\} agree` : 'agree'/);
  assert.match(client, /return '1 reporter'/);
  assert.doesNotMatch(client, /0 reporters/);
  assert.match(client, /el\.className = 'me__live-item'/);
  assert.match(client, /Court Call is on now/);
});

test('client: the shop row never links; every other row points at its desk', () => {
  const fn = client.slice(client.indexOf('function sourceHref('), client.indexOf('function statusLine('));
  assert.match(fn, /default: return null; \/\/ shop/);
  assert.match(fn, /case 'price': return '\/paddles'/);
  assert.match(fn, /case 'ritual': return '\/band'/);
  assert.match(fn, /`\/b\/\$\{m\[1\]\}` : '\/today'/);
  assert.match(fn, /spotUrl\(spot\)/, 'Sky and Courts link to their spot pages');
  assert.match(client, /if \(href\) src\.setAttribute\('href', href\); else src\.removeAttribute\('href'\)/);
  assert.match(page, /<a class="me__src" data-me-src><\/a>/, 'the meta link has no href of its own');
});

test('sitemap: /morning and /morning.json are listed daily', () => {
  assert.match(sitemap, /\['https:\/\/pointcast\.xyz\/morning', 'daily'/);
  assert.match(sitemap, /\['https:\/\/pointcast\.xyz\/morning\.json', 'daily'/);
});

/* ---------- the paper by email (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5.5) ---------- */

test('page: the #paper section is one email field and one button, with the fine print and a status line', () => {
  const section = page.match(/<section class="me__paper" id="paper"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(section, 'a section with id="paper"');
  assert.match(section, /data-me-paper\b/);
  assert.match(section, /<h2 [^>]*>Get the paper by email<\/h2>/, 'the heading; the masthead stays the only h1');
  assert.equal((section.match(/<input\b/g) ?? []).length, 1, 'one field');
  assert.match(section, /<input [^>]*type="email"[^>]*autocomplete="email"[^>]*required|<input [^>]*autocomplete="email"[^>]*type="email"[^>]*required|<input [^>]*type="email"[^>]*required[^>]*autocomplete="email"/);
  assert.match(section, /<label [^>]*for="paper-email"[^>]*>Email<\/label>/);
  assert.match(section, /id="paper-email"/);
  assert.equal((section.match(/<button\b/g) ?? []).length, 1, 'one button');
  assert.match(section, /type="submit"[^>]*>Send me the paper<\/button>/);
  assert.match(section, /<button [^>]*\bdisabled\b[^>]*>Send me the paper<\/button>/, 'disabled until the script mounts');
  assert.match(section, /<form [^>]*method="post" action="\/api\/morning\/subscribe"/, 'a native submit is never a GET with the address in the URL');
  assert.match(section, /One email at 6:45 AM with the day's edition, only after you confirm by email\. Unsubscribe any time from any edition\./);
  assert.doesNotMatch(section, /one tap/i, 'the footer link is a page with a button, so not one tap');
  assert.match(section, /data-me-paper-status role="status"/);
  assert.match(section, /<noscript>[\s\S]*The signup needs JavaScript\. The paper is also at <a href="\/morning\.xml">\/morning\.xml<\/a>\.[\s\S]*<\/noscript>/);
  assert.doesNotMatch(section, /!/, 'no exclamation marks');
  assert.ok(page.indexOf('id="paper"') > page.indexOf('data-me-nav') && page.indexOf('id="paper"') < page.indexOf('<footer class="me__foot">'), 'after the editions nav, before the footer');
  assert.match(page, /\.me__paper \{[^}]*border-top: 1px solid var\(--pc-rule\)/, 'a rule above it');
});

test('page: the RSS feed is an alternate, a visible footer link and a JSON-LD encoding', () => {
  assert.match(page, /\{ type: 'application\/rss\+xml', href: '\/morning\.xml', title: 'PointCast Morning Edition · RSS' \}/);
  assert.match(page, /type: 'application\/feed\+json', href: '\/morning\.json'/, 'the JSON Feed alternate stays');
  const foot = page.slice(page.indexOf('<footer class="me__foot">'), page.indexOf('</footer>'));
  assert.match(foot, /<a href="\/morning\.json">\/morning\.json<\/a>[\s\S]*<a href="\/morning\.xml">\/morning\.xml<\/a>/, '/morning.xml sits beside /morning.json');
  assert.match(page, /\{ '@type': 'MediaObject', encodingFormat: 'application\/rss\+xml', contentUrl: 'https:\/\/pointcast\.xyz\/morning\.xml' \}/);
  assert.match(page, /encodingFormat: 'application\/feed\+json', contentUrl: 'https:\/\/pointcast\.xyz\/morning\.json'/);
});

test('page: the signup script is mounted from the existing script block, beside the reader', () => {
  const block = page.slice(page.lastIndexOf('<script>'), page.indexOf('</script>', page.lastIndexOf('<script>')));
  assert.match(block, /import \{ mountMorningPage \} from '\.\.\/scripts\/morning-client';/);
  assert.match(block, /import \{ mountMorningSignup \} from '\.\.\/scripts\/morning-signup';/);
  assert.match(block, /mountMorningPage\(\);\s*mountMorningSignup\(\);/);
  assert.equal(page.split('<script>').length - 1, 1, 'one script block');
});

test('signup script: posts {email, source} to /api/morning/subscribe, keeps nothing on the phone', () => {
  assert.match(signup, /fetch\('\/api\/morning\/subscribe', \{\s*method: 'POST',/);
  assert.match(signup, /JSON\.stringify\(\{ email, source \}\)/);
  assert.match(signup, /'Content-Type': 'application\/json'/);
  assert.match(signup, /button\.disabled = true;\s*say\(UI_COPY\.sending\);/);
  assert.match(signup, /root\.scrollIntoView\(\)/);
  assert.match(signup, /button\.disabled = false;/, 'mounting enables the button');
  assert.match(signup, /document\.addEventListener\('me:rendered', \(\) => \{ if \(!moved\) root\.scrollIntoView\(\); \}, \{ once: true \}\)/, 're-scrolls to #paper once the edition has rendered above it');
  assert.match(client, /root\.dispatchEvent\(new CustomEvent\('me:rendered', \{ bubbles: true \}\)\)/);
  assert.match(signup, /export function mountMorningSignup\(\)/);
  assert.doesNotMatch(signup, /localStorage|sessionStorage|indexedDB|document\.cookie/, 'the address is never stored on the phone');
  assert.doesNotMatch(signup, /innerHTML/);
  assert.doesNotMatch(signup, /console\./);
});

test('signup script: the copy, the source from ?src= and the ?paper= results', () => {
  assert.equal(UI_COPY.sending, 'Sending…');
  assert.equal(UI_COPY.invalid, "That address doesn't look right.");
  assert.equal(UI_COPY.limited, 'Too many tries. Wait 15 minutes.');
  assert.equal(UI_COPY.failed, "That didn't go through. Try again.");
  assert.deepEqual(PAPER_COPY, {
    confirmed: "You're on the list. The next edition comes by email at 6:45 AM.",
    expired: 'That link expired. Sign up again for a new one.',
    invalid: 'That link did not work.',
    unavailable: "That didn't go through. Try again later.",
  });
  for (const src of ['receipt', 'card', 'rss']) assert.equal(sourceFrom(`?src=${src}`), src);
  for (const search of ['', '?src=', '?src=em', '?src=other', '?src=RECEIPT', '?x=receipt', '?src=receipt%00']) assert.equal(sourceFrom(search), 'morning', search);
  assert.equal(sourceFrom('?paper=confirmed&src=card'), 'card');

  const ok = (status) => replyLine(202, { ok: true, status, message: `server says ${status}` });
  assert.equal(ok('check-email'), 'server says check-email', 'the server\'s message, verbatim');
  assert.equal(ok('on-list'), 'server says on-list');
  assert.equal(replyLine(400, { ok: false, reason: 'invalid-email' }), UI_COPY.invalid);
  assert.equal(replyLine(429, { ok: false, reason: 'email-rate-limited' }), UI_COPY.limited);
  assert.equal(replyLine(429, { ok: false, reason: 'ip-rate-limited' }), UI_COPY.limited);
  for (const [status, body] of [[503, { ok: false, reason: 'store-unavailable' }], [403, { ok: false, reason: 'bad-origin' }], [500, null], [202, null], [202, { ok: true, status: 'weird', message: 'x' }], [202, { ok: true, status: 'on-list' }]]) {
    assert.equal(replyLine(status, body), UI_COPY.failed, `${status} ${JSON.stringify(body)}`);
  }
  for (const line of [...Object.values(UI_COPY), ...Object.values(PAPER_COPY)]) assert.doesNotMatch(line, /!/);
});
