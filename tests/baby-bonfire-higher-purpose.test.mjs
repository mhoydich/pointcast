// A Higher Purpose (/baby-bonfire/higher-purpose/): one hand-written HTML file that draws a small
// 3D island with WebGL and plays a loop made with the Web Audio API. These tests hold it to its
// brief: small, self-contained, quiet about the visitor, careful with features a browser may lack,
// and careful with words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const FILE = new URL('../public/baby-bonfire/higher-purpose/index.html', import.meta.url);
const html = readFileSync(FILE, 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => !/application\/ld\+json/.test(m[1]));
const code = scripts.map((m) => m[2]).join('\n');
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
const text = html
  .replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/g, ' ');
const SIGNATURE = 'Made by Mike Hoydich and Claude. PointCast, 2026.';

test('the page is one file under 60 KB', () => {
  assert.ok(statSync(FILE).size < 60 * 1024, `${statSync(FILE).size} bytes`);
  assert.equal(scripts.length, 1, 'one inline script');
  assert.ok(scripts.every((m) => !/\bsrc\s*=/.test(m[1])), 'no script is loaded from a file');
  assert.doesNotMatch(html, /<link\b[^>]*rel="stylesheet"/i, 'no outside stylesheet');
  assert.doesNotMatch(html, /<(?:img|audio|video|source|iframe)\b/i, 'no image, media or frame elements');
});

test('script and style name no outside address', () => {
  assert.doesNotMatch(code, /(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}/i, 'script');
  assert.doesNotMatch(styles, /url\(|@import|https?:/i, 'style');
});

test('nothing is fetched, sent or stored', () => {
  for (const [re, what] of [
    [/\bfetch\s*\(/, 'fetch'], [/XMLHttpRequest/, 'XHR'], [/sendBeacon/, 'beacon'], [/WebSocket|EventSource/, 'socket'],
    [/localStorage|sessionStorage|indexedDB|document\.cookie|caches\./, 'storage'], [/\bimport\s*\(/, 'dynamic import'],
  ]) assert.doesNotMatch(code, re, what);
});

test('WebGL and WebXR are used only when the browser has them', () => {
  assert.match(code, /getContext\('webgl2'[^)]*\)\s*\|\|\s*cv\.getContext\('webgl'/, 'WebGL2 with a WebGL1 fallback');
  assert.match(code, /if \(!gl\) \{ drawStill\(\)/, 'a still on a 2D canvas when there is no WebGL');
  assert.match(code, /if \(navigator\.xr && navigator\.xr\.isSessionSupported\)/, 'WebXR is feature-detected');
  assert.match(code, /isSessionSupported\('immersive-vr'\)\.then\(\(ok\) => \{ if \(ok\) \{ vrBtn\.hidden = false/, 'Enter VR shows only when immersive-vr is offered');
  assert.match(html, /<button[^>]*id="vr"[^>]*hidden/, 'the VR button starts hidden');
  assert.match(code, /typeof D\.requestPermission === 'function'/, 'tilt asks permission where the browser requires it');
});

test('reduced motion holds the camera and the beat still', () => {
  assert.match(code, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(code, /function beat\(t\) \{\n  if \(still\) return 0;/, 'no beat pulse');
  assert.match(code, /if \(still\) \{ eye\.x = t\.x;/, 'walking is a cut, not a glide');
  assert.match(code, /dt \* \(still \? 0\.35 : 1\)/, 'everything slows');
  assert.match(styles, /prefers-reduced-motion:reduce/);
});

test('sound waits for a tap, has a toggle and stops when hidden', () => {
  assert.match(html, /<button[^>]*id="snd"[^>]*aria-pressed="true"[^>]*>Sound on<\/button>/);
  assert.match(code, /\$\('begin'\)\.addEventListener\('click', \(\) => \{[\s\S]*?if \(soundOn\) startSound\(\);/);
  assert.equal((code.match(/(?<!function )startSound\(\)/g) || []).length, 3, 'started from Begin, the toggle and a return to the tab only');
  assert.match(code, /if \(document\.hidden\) \{ halt\(\); keys\.clear\(\); if \(started && soundOn\) stopSound\(true\); \}/);
  assert.doesNotMatch(code, /new Audio\(|\.mp3|\.ogg|\.wav/, 'no audio files');
});

test('the signature is in the corner and on the about line, and nowhere larger', () => {
  assert.match(html, new RegExp(`<p class="sig">${SIGNATURE.replace(/\./g, '\\.')}</p>`));
  assert.equal(html.split(SIGNATURE).length - 1, 2);
  assert.match(html, /<details id="about">[\s\S]*Made by Mike Hoydich and Claude\. PointCast, 2026\.[\s\S]*<\/details>/);
});

test('no banned words, names or claims', () => {
  // Names kept out of the source on purpose, so they are stored reversed.
  const names = ['irata', 'amitlu', 'odnetnin', 'ages', 'erodommoc', 'yfitops', 'sleef doog', 'sibannac'].map((s) => [...s].reverse().join(''));
  const all = html.toLowerCase();
  for (const name of names) assert.ok(!all.includes(name), `the file names "${name}"`);
  for (const [re, why] of [
    [/\b(?:thc|cbd|cannabis|hemp)\b/i, 'cannabis'],
    [/\b(?:heals?|healing|therapy|therapeutic|cures?|wellness|anxiety|depression|treats?|treatment|relieves?|stress)\b/i, 'health claim'],
    [/(?<!not |no |nothing is )for sale|\bbuy\b|\$\s?\d|add to cart/i, 'sale'],
    [/\b(?:i|my|me|mine)\b/i, 'first person'],
    [/\b(?:god|gods|holy|sacred|worship|pray|prayer|spirit|spiritual|church|temple|shrine|cross)\b/i, 'religious word'],
  ]) assert.doesNotMatch(text, re, why);
});
