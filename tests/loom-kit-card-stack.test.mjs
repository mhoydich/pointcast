import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {isApproval} from '../public/loom/kit/card-stack.mjs';

const cards = JSON.parse(await readFile(new URL('../public/sketches/loom-kit/cards/cards.json', import.meta.url)));
const confirm = cards.find(card => card.kind === 'confirm');

test('only the explicitly addressed, pending approval gets a yes button', () => {
  assert.deepEqual(cards.filter(isApproval),[confirm]);
  for (const update of [{recipient:'someone-else'}, {state:'answered'}, {action:' '}, {action:{}}, {action:null}]) {
    assert.equal(isApproval({...confirm,request:{...confirm.request,...update}}),false);
  }
});

test('mentioning confirmation in a note or quoting a request does not create an approval', () => {
  assert.equal(isApproval({kind:'note',title:'The “needs your yes” card says “Yes, go ahead”.'}),false);
  assert.equal(isApproval({...confirm,kind:'note'}),false);
  assert.equal(isApproval({kind:'confirm',title:'Yes?',request:null}),false);
});
