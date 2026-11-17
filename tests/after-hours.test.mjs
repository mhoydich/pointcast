import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/after-hours/index.html',import.meta.url),'utf8');
test('exactly six real destination tracks',()=>{const tracks=[...html.matchAll(/class="track" href="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(tracks,['/pray/','/small-shrines/','/baby-bonfire/','/nouns/drum-club/','/keyboard/','/ufogp/']);});
test('no scripts, embeds, media, forms or implicit writes',()=>{assert.doesNotMatch(html,/<(script|iframe|audio|video|form)\b/i);assert.doesNotMatch(html,/onclick|localStorage|fetch\(/);});
test('honest edition and page-not-player framing',()=>{assert.match(html,/First edition/);assert.match(html,/playlist of pages, not an audio player/);assert.match(html,/not a product for sale/);assert.match(html,/A toast to the crew/);});
test('accessible structural landmarks and focus',()=>{assert.match(html,/<html lang="en">/);assert.match(html,/class="skip" href="#tracks"/);assert.match(html,/aria-labelledby="side-a"/);assert.match(html,/aria-labelledby="side-b"/);assert.match(html,/:focus-visible/);assert.match(html,/class="sleeve-art"/);});
test('responsive and print layout',()=>{assert.match(html,/@media\(max-width:650px\)/);assert.match(html,/@media print/);assert.match(html,/width=device-width/);});
test('uses the correct keyboard route and local artwork',()=>{assert.doesNotMatch(html,/keyboard-bloom/);assert.doesNotMatch(html,/@import|url\(/);assert.equal((html.match(/class=\"seat\"/g)||[]).length,6);});

test('Sid’s artwork and source manifest are included without cropping',()=>{
 assert.match(html,/after-hours-art\/cassette-sleeve\.svg/);
 assert.match(html,/after-hours-art\/flag\.svg/);
 assert.match(html,/after-hours-art\/crew-sheet\.svg/);
 assert.match(html,/after-hours-art\/manifest\.json/);
 assert.equal((html.match(/after-hours-art\/portraits\/[^"]+\.svg/g)||[]).length,6);
 assert.doesNotMatch(html,/object-fit\s*:\s*cover/);
});

test('production skip links stay on this page',()=>{assert.doesNotMatch(html,/<base\b/i);assert.match(html,/<link rel="canonical" href="https:\/\/pointcast\.xyz\/after-hours\/">/);});
