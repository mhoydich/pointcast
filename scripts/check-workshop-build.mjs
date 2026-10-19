import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const read=path=>new JSDOM(readFileSync(`dist/${path}`,'utf8'),{url:'https://pointcast.xyz/'}).window.document;
const lab=read('ues/currency-lab/index.html'), workshop=read('nouns-money/workshop/index.html'), court=read('court/index.html');
assert.equal(lab.querySelectorAll('main').length,1,'Compiled lab has one main landmark');
assert.equal(lab.querySelector('html').dataset.pcIsolated,'true');
assert.ok(lab.querySelector('#currency-lab'));
assert.equal(lab.querySelectorAll('link[rel="manifest"]').length,0,'Independent lab is not the sitewide installable app');
assert.equal(court.querySelectorAll('link[rel="manifest"]').length,1,'An existing default caller retains the manifest');
assert.equal(court.querySelector('link[rel="manifest"]').getAttribute('href'),'/manifest.webmanifest');
assert.equal(lab.querySelector('link[rel="canonical"]').href,'https://pointcast.xyz/ues/currency-lab/');
assert.equal(workshop.querySelector('link[rel="canonical"]').href,'https://pointcast.xyz/nouns-money/workshop/');
for(const doc of [lab,workshop]){
 assert.equal(doc.querySelectorAll('h1').length,1);
 assert.ok(doc.querySelector('a[href="https://www.industrynext.xyz/communications-lab/nouns-money/"]'));
 assert.ok(!doc.querySelector('meta[name="robots"]')?.content.includes('noindex'));
}
assert.ok(workshop.querySelector('a[href="/ues/currency-lab/"]'));
assert.ok(lab.querySelector('a[href="/nouns-money/workshop/"]'));
console.log('Compiled independent lab, default PWA caller, landmarks, canonical and companion navigation checks passed.');
