// /pray/: a standalone, liftable prayer site in one static folder (public/pray/).
// These checks hold its promises: nothing outside the folder, relative links inside it,
// names checked and shown as text only, one storage key, no network, sound after a touch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const PAGES = ['public/pray/index.html', 'public/pray/fire/index.html', 'public/pray/bell/index.html', 'public/pray/sit/index.html'];
const js = read('public/pray/pray.js');
const pages = Object.fromEntries(PAGES.map((p) => [p, read(p)]));
const inline = (html) => [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');

test('every page and pray.js parses', () => {
  assert.doesNotThrow(() => new Function(js));
  for (const [p, html] of Object.entries(pages)) assert.doesNotThrow(() => new Function(inline(html)), p);
});

test('each page is whole: lang, title, referrer, og tags, no outside files', () => {
  for (const [p, html] of Object.entries(pages)) {
    assert.match(html, /<html lang="en">/, p);
    assert.match(html, /<title>[^<]+<\/title>/, p);
    assert.ok(html.includes('<meta name="referrer" content="strict-origin">'), p);
    assert.match(html, /<meta property="og:title" content="[^"]+">/, p);
    assert.match(html, /<meta property="og:description" content="[^"]+">/, p);
    // src/href: relative inside the folder, data:, or an absolute pointcast.xyz room link
    for (const m of html.matchAll(/\s(?:src|href)="([^"]*)"/g)) {
      const v = m[1];
      assert.ok(/^(\.\/|\.\.\/|media\/|data:|https:\/\/pointcast\.xyz\/)/.test(v), `${p}: ${v}`);
      if (v.startsWith('https://pointcast.xyz/')) assert.ok(p.endsWith('public/pray/index.html'), `${p} links out: ${v}`);
    }
    assert.doesNotMatch(html, /fonts\.googleapis|<script[^>]+src="https?:/i, p);
  }
});

test('relative files resolve inside public/pray/', () => {
  for (const [p, html] of Object.entries(pages)) {
    const dir = new URL(p.replace(/[^/]+$/, ''), root);
    for (const m of html.matchAll(/\s(?:src|href|poster)="((?:\.\.?\/|media\/)[^"?#]*)/g)) {
      const target = new URL(m[1], dir);
      assert.ok(target.pathname.includes('/public/pray/'), `${p}: ${m[1]} leaves the folder`);
      const file = target.pathname.endsWith('/') ? new URL('index.html', target) : target;
      assert.ok(existsSync(file), `${p}: ${m[1]} exists`);
    }
  }
});

test('nothing sent, one storage key', () => {
  const all = js + Object.values(pages).map(inline).join('\n');
  assert.doesNotMatch(all, /XMLHttpRequest|sendBeacon|WebSocket|EventSource|import\(|sessionStorage|document\.cookie|indexedDB/);
  // the only fetch is the fire loading its own sounds from media/
  assert.deepEqual([...all.matchAll(/fetch\(([^)]*)\)/g)].map((m) => m[1]), ["'media/'+name+'.mp3'"]);
  assert.match(js, /var KEY='pray-days-v1'/);
  const sets = [...all.matchAll(/localStorage\.setItem\(([^,]+),/g)].map((m) => m[1]);
  assert.deepEqual(sets, ['KEY']);
  for (const m of all.matchAll(/localStorage\.(getItem|setItem)/g)) {
    const before = all.slice(Math.max(0, m.index - 80), m.index);
    assert.match(before, /try\{/, 'storage is guarded');
  }
});

test('names: one rule, text only, never in the title', () => {
  assert.match(js, /P\.cleanName=function/);
  assert.match(js, /v\.length<=24/);
  const all = Object.values(pages).map(inline).join('\n');
  assert.doesNotMatch(all.replace(/breathEl\.innerHTML='&nbsp;'/g, ''), /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  assert.doesNotMatch(all + js, /document\.title\s*=/);
  assert.match(pages['public/pray/bell/index.html'], /textContent='A bell is rung for '\+who\+'\.'/);
  assert.match(pages['public/pray/fire/index.html'], /textContent='A fire is lit for '\+arrivedFor\+'\.'/);
});

test('sound waits for a touch; the bell is synthesized', () => {
  assert.equal((js.match(/new AC\(/g) || []).length, 1);
  assert.match(js, /P\.audio=function\(\)\{ \/\* call only from a click, tap or key handler/);
  assert.match(js, /PARTIALS=\[\[0\.5,/);
  for (const p of ['public/pray/bell/index.html', 'public/pray/sit/index.html']) {
    // strike() is only reached from listeners
    const code = inline(pages[p]);
    assert.doesNotMatch(code.replace(/function [a-z]+\(\)\{[\s\S]*?\n\}/g, ''), /^P\.strike\(/m, p);
  }
  for (const html of Object.values(pages)) assert.doesNotMatch(html, /\bautoplay\b/);
});

test('door: three acts, four intentions, day marks, at most eight rooms, signature', () => {
  const d = pages['public/pray/index.html'];
  for (const h of ['./fire/', './bell/', './sit/']) assert.ok(d.includes(`href="${h}"`), h);
  for (const i of ['thanks', 'asking', 'someone', 'remembering']) assert.ok(d.includes(`data-i="${i}"`), i);
  const rooms = d.match(/href="https:\/\/pointcast\.xyz\/[^"]+"/g) || [];
  assert.ok(rooms.length > 0 && rooms.length <= 8);
  for (const r of rooms) {
    const slug = r.slice('href="https://pointcast.xyz/'.length, -1);
    assert.ok(existsSync(new URL(`src/pages/${slug}.astro`, root)) || existsSync(new URL(`public/${slug}`, root)), slug);
  }
  assert.ok(d.includes('Made by Mike Hoydich and Claude'));
  for (const [p, html] of Object.entries(pages)) if (p !== 'public/pray/index.html') assert.ok(!html.includes('Mike Hoydich'), p);
});

test('weight: the folder without media stays small', () => {
  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const f = new URL(n, dir);
    return statSync(f).isDirectory() ? walk(new URL(`${n}/`, dir)) : [f];
  });
  const files = walk(new URL('public/pray/', root)).filter((f) => !f.pathname.includes('/media/'));
  const total = files.reduce((s, f) => s + statSync(f).size, 0);
  assert.ok(total < 150 * 1024, `${total} bytes`);
});
