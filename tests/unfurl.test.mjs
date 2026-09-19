import test from 'node:test';
import assert from 'node:assert/strict';
import { handleUnfurl, parseHead, safeUrl } from '../functions/api/unfurl.ts';
const get = (url) => new Request('https://pointcast.xyz/api/unfurl?url=' + encodeURIComponent(url));
test('only public https hostnames are fetched', () => {
  for (const bad of ['http://example.org', 'https://localhost/x', 'https://127.0.0.1/', 'https://[::1]/', 'https://intranet/', 'https://user:pw@site.com/', 'https://site.com:8443/', 'https://printer.local/', 'javascript:alert(1)', '', 'x'.repeat(700)]) assert.equal(safeUrl(bad), null, bad);
  assert.equal(safeUrl('https://www.tonebloom.xyz/room?a=1#frag').toString(), 'https://www.tonebloom.xyz/room?a=1');
});
test('Open Graph, Twitter and <title> fallbacks are decoded and bounded', () => {
  const page = new URL('https://site.com/a/b');
  const og = parseHead(`<head><meta property="og:title" content="Tom &amp; Jerry&#39;s"><meta name='description' content='plain &lt;b&gt; text'><meta property="og:image" content="/img/card.png"><meta property="og:site_name" content="Site"></head>`, page);
  assert.deepEqual(og, { site: 'Site', title: "Tom & Jerry's", description: 'plain <b> text', image: 'https://site.com/img/card.png' });
  const bare = parseHead('<title> Just a title </title><meta property="og:image" content="http://insecure/x.png">', page);
  assert.equal(bare.title, 'Just a title'); assert.equal(bare.image, ''); assert.equal(bare.site, 'site.com');
});
test('Spotify goes through oEmbed and never touches the page', async () => {
  const seen = [];
  const fetcher = async (url) => { seen.push(String(url)); return Response.json({ title: 'Set Adrift on Memory Bliss', author_name: 'P.M. Dawn', thumbnail_url: 'https://i.scdn.co/image/abc' }); };
  const res = await handleUnfurl(get('https://open.spotify.com/track/7vooILIm1H'), {}, fetcher); const d = await res.json();
  assert.equal(res.status, 200); assert.equal(d.kind, 'spotify'); assert.equal(d.title, 'Set Adrift on Memory Bliss'); assert.equal(d.description, 'P.M. Dawn'); assert.equal(d.image, 'https://i.scdn.co/image/abc');
  assert.equal(seen.length, 1); assert.match(seen[0], /^https:\/\/open\.spotify\.com\/oembed\?url=/);
  const bare = async (url) => String(url).includes('/oembed') ? Response.json({ title: 'Mama', thumbnail_url: 'https://i.scdn.co/image/x' }) : new Response('<meta property="og:description" content="Genesis · Mama · Song · 1983">', { headers: { 'Content-Type': 'text/html' } });
  assert.equal((await (await handleUnfurl(get('https://open.spotify.com/track/abc'), {}, bare)).json()).description, 'Genesis'); assert.match(res.headers.get('Cache-Control'), /s-maxage=86400/);
});
test('redirects are re-checked, non-HTML and bad input are refused without a fetch', async () => {
  let calls = 0;
  const hop = async (url) => { calls++; return String(url).includes('start') ? new Response(null, { status: 302, headers: { Location: 'https://169.254.169.254/latest' } }) : new Response('<title>no</title>', { headers: { 'Content-Type': 'text/html' } }); };
  assert.equal((await handleUnfurl(get('https://site.com/start'), {}, hop)).status, 404); assert.equal(calls, 1);
  const pdf = async () => new Response('%PDF', { headers: { 'Content-Type': 'application/pdf' } });
  assert.equal((await handleUnfurl(get('https://site.com/file.pdf'), {}, pdf)).status, 404);
  let touched = false; const never = async () => { touched = true; return new Response(''); };
  assert.equal((await handleUnfurl(get('http://site.com/'), {}, never)).status, 400); assert.equal(touched, false);
  const html = async () => new Response('<html><head><meta property="og:title" content="A page"></head></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const ok = await (await handleUnfurl(get('https://site.com/page'), {}, html)).json(); assert.equal(ok.title, 'A page'); assert.equal(ok.kind, 'page');
});
