import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const url = new URL('../public/sketches/college-football-office-pool/index.html', import.meta.url);
const doc = new JSDOM(readFileSync(url, 'utf8')).window.document;

test('the sample outcome can be revealed without submitting a real pick', () => {
  const sample = doc.querySelector('article');
  const reveal = sample.querySelector('details');
  assert.match(sample.textContent, /fictional scores/i);
  assert.match(reveal.querySelector('summary').textContent, /reveal the sample final/i);
  assert.equal(reveal.open, false);
  assert.match(reveal.textContent, /41 missed the final total of 44 by three/);
  assert.equal(doc.querySelector('form, script'), null);
});

test('the return test scores its original cohort separately from later visitors', () => {
  const measure = doc.getElementById('measure').parentElement.textContent;
  assert.match(measure, /Friday pick and posted a second reply after the final, by Monday noon/);
  assert.match(measure, /fewer than six of the 20 return/);
  assert.match(measure, /extra 30 seats/);
  assert.match(doc.querySelector('#pilot + p + p').textContent, /still needs to confirm the 20 volunteers/);
});
