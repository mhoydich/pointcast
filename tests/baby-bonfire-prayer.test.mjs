// Prayer Fire (/baby-bonfire/prayer/): the one Baby Bonfire page that is a screen on purpose.
// It plays a film and sound from its own folder, so it is listed under `screens` in the twin
// and not under `scenes`, whose pages load no media. These checks hold what the page promised:
// its own files only, sound after a tap, nothing kept but a count, and no claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const twin = JSON.parse(read('public/baby-bonfire.json'));
const hub = read('public/baby-bonfire/index.html');
const html = read('public/baby-bonfire/prayer/index.html');
const entry = (twin.screens || []).find((s) => s.slug === 'prayer');
const MEDIA = ['hearth-loop.mp4', 'hearth-poster.jpg', 'hearth-unlit.jpg', 'fire.mp3', 'bowl.mp3', 'gong.mp3', 'pad.mp3'];

test('the twin lists Prayer Fire as a screen, apart from the street', () => {
  assert.ok(entry, 'screens has a prayer entry');
  assert.equal(entry.name, 'Prayer Fire');
  assert.equal(entry.url, 'https://pointcast.xyz/baby-bonfire/prayer/');
  assert.deepEqual(entry.media.map((m) => m.file), MEDIA);
  for (const m of entry.media) assert.ok(m.what && m.made, `${m.file} says what it is and how it was made`);
  assert.ok(!twin.scenes.some((s) => s.slug === 'prayer'), 'it is not a window on the street');
  assert.ok(!twin.workshop.some((w) => w.slug === 'prayer'));
  assert.match(twin.privacy, /bb-prayer-v1/);
  assert.match(twin.privacy, /never stored or sent/);
});

test('the page is whole and wears the area head tags, back link and notice', () => {
  assert.ok(html.includes('<title>Baby Bonfire — Prayer Fire</title>'));
  assert.ok(html.includes('<link rel="canonical" href="https://pointcast.xyz/baby-bonfire/prayer/">'));
  assert.ok(html.includes('<meta property="og:url" content="https://pointcast.xyz/baby-bonfire/prayer/">'));
  assert.ok(html.includes('<link rel="alternate" type="application/json" href="/baby-bonfire.json"'));
  assert.match(html, /<meta name="description" content="[^"]+ Nothing is for sale\.">/);
  assert.ok(html.includes('<a class="bb-back" href="/baby-bonfire/">'));
  assert.ok(html.trimEnd().endsWith('</html>'));
  assert.match(html, /<b>Concept sketch\.<\/b> Nothing is for sale\. Do not burn anything indoors on the strength of these pages\./);
  assert.match(html, /This is a film of a small fire, on a screen\. Nothing on this page lights a real one\./);
  assert.match(html, /were generated with AI tools\. The words and the page are by Claude, at Mike Hoydich's direction/);
});

test('every file the page asks for is in its own folder, and small', () => {
  let total = 0;
  for (const name of MEDIA) {
    const url = new URL(`public/baby-bonfire/prayer/media/${name}`, root);
    assert.ok(existsSync(url), name);
    const size = statSync(url).size;
    assert.ok(size > 1000 && size < 1_500_000, `${name} is ${size} bytes`);
    total += size;
  }
  assert.ok(total < 3_000_000, `media is ${total} bytes in all`);
  // src and poster point into media/ and nowhere else
  const asked = [...html.matchAll(/\b(?:src|poster)="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(asked.sort(), ['media/hearth-loop.mp4', 'media/hearth-poster.jpg', 'media/hearth-unlit.jpg']);
  // the four sounds are fetched by name from the same folder
  assert.equal((html.match(/fetch\(/g) || []).length, 1);
  assert.ok(html.includes("fetch('media/'+name+'.mp3')"));
  for (const name of ['fire', 'bowl', 'gong', 'pad']) assert.match(html, new RegExp(`['"]${name}['"]`), name);
});

test('no outside requests: no script files, frames, remote urls or trackers', () => {
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<iframe\b|<object\b|<embed\b|@import|XMLHttpRequest|sendBeacon|WebSocket|EventSource|getUserMedia|geolocation/);
  // The JSON-LD block names schema.org as its vocabulary; that is a label, not a request.
  const requests = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  for (const m of requests.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
    assert.ok(m[0].startsWith('https://pointcast.xyz/baby-bonfire/') || m[0] === 'http://www.w3.org/2000/svg', m[0]);
  }
  for (const m of html.matchAll(/<link[^>]+href="([^"]+)"/g)) {
    assert.ok(m[1] === '/favicon.svg' || m[1].startsWith('/baby-bonfire') || m[1].startsWith('https://pointcast.xyz/baby-bonfire'), m[1]);
  }
  assert.doesNotMatch(html, /url\(\s*['"]?https?:/i);
});

test('sound and film wait for a tap, and can be turned off', () => {
  assert.doesNotMatch(html, /<video[^>]*\bautoplay\b/i);
  assert.doesNotMatch(html, /<audio[^>]*\bautoplay\b/i);
  assert.match(html, /<video id="vid" muted loop playsinline/);
  // the audio context is made inside initAudio, which light() calls from the button press
  const initAudio = html.slice(html.indexOf('function initAudio('), html.indexOf('function setMaster('));
  assert.match(initAudio, /new AC\(/);
  assert.equal((html.match(/new AC\(/g) || []).length, 1);
  const light = html.slice(html.indexOf('function light('), html.indexOf('function offer('));
  assert.match(light, /initAudio\(\)/);
  assert.match(html, /lightBtn\.addEventListener\('click'/);
  assert.ok(html.includes('id="soundBtn" type="button" aria-pressed="true"'));
  assert.match(html, /It has sound: a fire, a bowl, a gong\. Sound starts when you light it\./);
});

test('the words are never kept: one count in this browser, guarded, and nothing else', () => {
  assert.match(html, /var KEY='bb-prayer-v1'/);
  const sets = html.match(/localStorage\.setItem\([^)]*\)/g) || [];
  assert.deepEqual(sets, ['localStorage.setItem(KEY,String(n)']);
  assert.match(html, /try\{var n=parseInt\(localStorage\.getItem\(KEY\)/);
  assert.match(html, /try\{localStorage\.setItem\(KEY,String\(n\)\)\}catch\(e\)\{\}/);
  assert.doesNotMatch(html, /sessionStorage|document\.cookie|indexedDB|caches\./);
  assert.match(html, /Your words stay on this page\. They are not sent anywhere and they are not saved\./);
  assert.match(html, /autocomplete="off"/);
});

test('it works without motion, by keyboard and for a screen reader', () => {
  assert.match(html, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(html, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(html, /role="radiogroup" aria-labelledby="q"/);
  assert.match(html, /e\.key==='ArrowRight'/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="img" aria-label="A small stone and copper tabletop fireplace/);
  assert.match(html, /<label class="sr" for="words">/);
});

test('content rules: no claims, no prices, nothing the area leaves out', () => {
  const banned = /good ?feels|cannabis|\bhemp\b|\bthc\b|nintendo|playstation|xbox|\bsega\b|safety[- ]tested|buy now|pre-?order|add to cart/i;
  assert.equal(html.match(banned), null);
  assert.doesNotMatch(html, /flame-safe|fire-safe|fireproof|flameproof|heals?\b|therap|wellness|reduces? (stress|anxiety)|improves? (sleep|mood|health)|manifest|guarantee|will (come|happen|work)\b/i);
  assert.doesNotMatch(html, /[€£]\s?\d|\$\s?\d|\bUSD\b|\bprice[ds]?\b|subscri|donat/i);
  for (const m of html.matchAll(/for sale/g)) assert.match(html.slice(Math.max(0, m.index - 24), m.index), /[Nn]othing (here )?is $/);
  // eight things to bring, four lines each, and none of them written as Mike
  const intents = html.slice(html.indexOf('var INTENTS=['), html.indexOf('var intent=INTENTS[0]'));
  assert.equal((intents.match(/\{id:'/g) || []).length, 8);
  for (const block of intents.match(/lines:\[[^\]]*\]/g)) assert.equal((block.match(/','/g) || []).length, 3, block);
  assert.doesNotMatch(html, /Mike (says|said|writes|wrote)|&ldquo;/);
});

test('the hub links it from its own section, not from the street or the earlier-work strip', () => {
  const section = hub.slice(hub.indexOf('id="screen-h"'), hub.indexOf('id="work-h"'));
  assert.ok(section.includes('<a href="/baby-bonfire/prayer/">'));
  assert.match(section, /These four are screens\./);
  assert.equal((hub.match(/class="obj" href=/g) || []).length, twin.scenes.length, 'one cabinet object per scene');
  const earlier = hub.slice(hub.indexOf('id="earlier-h"'), hub.indexOf('<footer>'));
  assert.ok(!earlier.includes('/baby-bonfire/prayer/'));
});

test('it is listed for machines: sitemap, llms and the full text', () => {
  assert.ok(read('src/pages/sitemap-discovery.xml.ts').includes("'https://pointcast.xyz/baby-bonfire/prayer/'"));
  assert.ok(read('public/llms.txt').includes('https://pointcast.xyz/baby-bonfire/prayer/'));
  assert.ok(read('public/llms-full.txt').includes('https://pointcast.xyz/baby-bonfire/prayer/'));
});

// Send the fire: after an offering, one tap makes a picture of this fire with the words and
// hands it to the device's share sheet. The picture is made on the device and goes nowhere
// unless the person sends or saves it.
const script = html.slice(html.indexOf('<script>'), html.indexOf('</script>', html.indexOf('<script>')));
const between = (a, b) => script.slice(script.indexOf(a), script.indexOf(b, script.indexOf(a)));

test('send the fire: the closing line gets two quiet buttons, and End stays', () => {
  assert.match(html, /<button class="ghost warm" id="sendBtn" type="button">Send the fire<\/button>/);
  assert.match(html, /<button class="ghost" id="againBtn" type="button">Offer another<\/button>/);
  assert.match(html, /<button class="ghost" id="endBtn" type="button">End<\/button>/);
  assert.match(html, /<div class="keep" id="keepsake" role="dialog" aria-modal="true"/);
  assert.match(html, /id="saveLink" download="prayer-fire\.jpg"/);
  assert.match(html, />Save picture</);
  assert.match(html, />Copy link</);
  assert.match(html, /id="closeKeep"/);
  assert.match(script, /CLOSE='Offered\. The fire has it now\.'/);
  // the buttons show with the closing line, and the minute no longer hides them on a timer
  assert.match(between('function endSit(', 'function again('), /lineEl\.textContent=CLOSE;[^}]*after\.hidden=false/);
  assert.doesNotMatch(between('function endSit(', 'function again('), /6500/);
});

test('send the fire: the picture is 1080x1350 JPEG, made before the tap', () => {
  assert.match(script, /var PW=1080,PH=1350/);
  assert.match(script, /'image\/jpeg',0\.9\)/);
  assert.match(script, /new File\(\[blob\],'prayer-fire\.jpg',\{type:'image\/jpeg'\}\)/);
  assert.match(script, /posterEl\.src='media\/hearth-poster\.jpg'/);
  assert.match(script, /document\.fonts/);
  assert.match(script, /PRAYER FIRE · POINTCAST\.XYZ\/BABY-BONFIRE\/PRAYER/);
  assert.match(script, /toLocaleDateString\(undefined/);
  // made when the words reach the fire, not when the button is pressed
  assert.match(between('function startSit(', 'function nextLine('), /makeKeep\(offered\)/);
  // the alt text carries the words
  assert.match(script, /keepImg\.alt=keep\.alt/);
  assert.match(script, /with the words “'\+words/);
});

test('send the fire: share is guarded by canShare and called straight from the tap', () => {
  const handler = between("sendBtn.addEventListener('click'", 'openKeep();\n});');
  assert.ok(handler.length > 0, 'the send handler is there');
  assert.equal((script.match(/navigator\.share\(/g) || []).length, 1, 'one share call');
  assert.ok(handler.indexOf('navigator.canShare(d)') > -1 && handler.indexOf('navigator.canShare(d)') < handler.indexOf('navigator.share(d)'), 'canShare comes first');
  assert.match(handler, /var d=\{files:\[f\]\}/, 'only the file is shared');
  const beforeShare = handler.slice(0, handler.indexOf('navigator.share('));
  assert.doesNotMatch(beforeShare, /await|\.then\(|setTimeout|Promise/, 'nothing is awaited before share');
  // a cancelled share is silent; anything else, or no share at all, opens the keepsake
  assert.match(handler, /e\.name!=='AbortError'\)openKeep\(\)/);
  // focus returns to the send button when the keepsake closes
  assert.match(between('function shutKeep(', 'closeKeep.addEventListener'), /sendBtn\.focus\(\)/);
  assert.match(script, /e\.key==='Escape'/);
  // Copy link copies the page address only
  assert.match(script, /var SITE='https:\/\/pointcast\.xyz\/baby-bonfire\/prayer\/'/);
  assert.match(script, /navigator\.clipboard\.writeText\(SITE\)/);
  assert.equal((script.match(/writeText\(/g) || []).length, 1);
});

test('send the fire: the words go nowhere and are kept nowhere', () => {
  // no new network: the one fetch is still the media loader, and nothing else talks out
  assert.equal((script.match(/fetch\(/g) || []).length, 1);
  assert.doesNotMatch(script, /XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.sendBeacon|import\(|new Worker|postMessage/);
  // the only things given a src or href are the poster, a blob of this page, or nothing
  for (const m of script.matchAll(/\.(src|href)=([^;,)]+)/g)) {
    assert.ok(["'media/hearth-poster.jpg'", 'keep.url', 'URL.createObjectURL(new Blob([buf]'].some((ok) => m[2].startsWith(ok)), m[0]);
  }
  // storage: still only the count
  assert.deepEqual(script.match(/localStorage\.setItem\([^)]*\)/g), ['localStorage.setItem(KEY,String(n)']);
  assert.doesNotMatch(script, /sessionStorage|document\.cookie|indexedDB|caches\.|openDatabase/);
  // nothing written to the address bar
  assert.doesNotMatch(script, /location\s*\.\s*(href|hash|search|pathname)\s*=|location\.(assign|replace|reload)\(|(window|document)\.location\s*=|history\.(pushState|replaceState|go|back|forward)\(/);
  // the words are dropped with the picture on "Offer another"
  assert.match(between('function dropKeep(', 'function fillKeep('), /offered=''/);
  assert.match(between('function dropKeep(', 'function fillKeep('), /revokeObjectURL|dropUrl\(\)/);
  assert.match(between('function again(', "endBtn.addEventListener"), /dropKeep\(\)/);
});

test('the offering moment: about a second and a half, and a plain cross-fade without motion', () => {
  const launch = between('function launch(', 'function frame(');
  assert.match(launch, /if\(RM\)\{/, 'a reduced-motion branch');
  assert.match(launch, /return 1\.2;/);
  assert.match(launch, /return 0\.06\+\(n-1\)\*gap\+1\.05;/);
  assert.match(script, /swell=Math\.min\(1,swell\+0\.45\)/, 'the flame swells as the words arrive');
  assert.match(html, /\.sheet,\.sit,\.line\{transition:opacity \.6s ease\}/);
});

test('iPhone manners and a page that reads without scripts', () => {
  assert.match(html, /<input id="words"[^>]*enterkeyhint="send"/);
  assert.match(between('function offer(', 'form.addEventListener'), /wordsEl\.blur\(\)/);
  assert.match(html, /\.chips\{-webkit-mask-image:linear-gradient/);
  assert.match(html, /env\(safe-area-inset-bottom\)\) calc\(14px \+ env\(safe-area-inset-left\)\)/);
  assert.match(html, /<noscript><p class="fine">This page needs scripts to light the fire\. How it works:/);
});
