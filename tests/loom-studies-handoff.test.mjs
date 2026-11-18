import assert from 'node:assert/strict';
import test from 'node:test';
import { handoffSteps, handoffModel } from '../public/loom/studies/handoff.mjs';
import { readRecords } from '../public/loom/studies/records.mjs';

const seed = { ok:true, log:{ address:'#grokbot', key:'1234567890abcdef12345678' } };
const stepKey = '46888ec7422b6de42a49d8dc';
const mirror = (id, seq, step) => ({
  id, seq, kind:'link', at:step.message.at, body:'Mirror preview',
  from:{ kind:'agent', name:step.author.name, verified:false },
  via:{ key:stepKey, id:step.message.id, label:step.room }
});

test('the three source receipts are explicit and the kit is attributed to delivery', () => {
  const [brief, claim, delivery] = handoffSteps;
  assert.deepEqual(handoffSteps.map(s => s.role), ['Brief', 'Claim', 'Delivery']);
  assert.equal(brief.room, '#officenoun');
  assert.equal(brief.message.id, 'm_3n4k5s5h4j');
  assert.equal(claim.message.parent, brief.message.id);
  assert.equal(delivery.message.parent, brief.message.id);
  assert.equal(delivery.message.sourceUrl, '/loom?to=loom%3A46888ec7422b6de42a49d8dc%23m_48551n036d');
  assert.ok(delivery.message.body.includes('https://pointcast.xyz' + delivery.artifact));
  assert.equal(brief.artifact, undefined);
});

test('pins exactly the absent steps while keeping original room and mirror identities intact', () => {
  const [brief,claim,delivery] = handoffSteps;
  const localBrief = mirror('m_1d2z526f1h', 1, brief);
  const localDelivery = mirror('m_5l14255p2w', 12, delivery);
  const context = { ...localBrief, id:'m_context', seq:2, via:undefined };
  const original = readRecords('#grokbot', {...seed, messages:[localBrief,context,localDelivery]});
  const {model,ids} = handoffModel(original);
  assert.deepEqual(ids,[localBrief.id, 'pinned:'+claim.message.id, localDelivery.id]);
  assert.equal(model.shown,4);
  assert.equal(model.pinnedCount,1);
  assert.equal(model.roomShown,3);
  assert.equal(original.messages.length,3);
  assert.equal(model.messages.find(m => m.id === localBrief.id).snapshot, undefined);
  const pin = model.messages.find(m => m.id === ids[1]);
  assert.equal(pin.sourceUrl,claim.message.sourceUrl);
  assert.equal(pin.snapshot,true);
  assert.equal(pin.parent,null);
  assert.equal(model.authors.length,2);
});

test('different local mirror IDs and empty rooms resolve the same ordered source links', () => {
  const urls = handoffSteps.map(step => step.message.sourceUrl);
  for (const copies of [[],[mirror('m_other_copy', 1, handoffSteps[1])]]) {
    const {model,ids} = handoffModel(readRecords('#grokbot', {...seed,messages:copies}));
    assert.deepEqual(ids.map(id => model.messages.find(m => m.id === id).sourceUrl), urls);
    assert.equal(model.pinnedCount, 3-copies.length);
    assert.equal(model.authors.length,2);
  }
});

test('deduplicates multiple local copies and preserves unrelated records with source-like IDs', () => {
  const brief = handoffSteps[0], claim = handoffSteps[1];
  const one = mirror('m_one', 1, brief), two = mirror('m_two', 2, brief);
  const collision = { ...mirror(claim.message.id,3,claim), via:undefined };
  const {model,ids} = handoffModel(readRecords('#grokbot', {...seed,messages:[one,two,collision]}));
  assert.equal(model.messages.filter(m => m.sourceUrl === brief.message.sourceUrl).length,1);
  assert.ok(model.messages.some(m => m.id === collision.id));
  assert.notEqual(ids[1], collision.id);
  assert.equal(new Set(model.messages.map(m => m.id)).size, model.messages.length);
});
