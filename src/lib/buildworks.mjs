export const PILOT_DEFAULTS = Object.freeze({quantity:100, unitCost:2.5, packaging:0.6, freight:45, tooling:120, rejectPercent:5, price:12, shipping:3.5, feePercent:3, feeFixed:0.3, returnReserve:0.4, sellThrough:70, wholesalePrice:6});
export const INPUT_LIMITS = Object.freeze({quantity:[1,100000],unitCost:[0,10000],packaging:[0,10000],freight:[0,1000000],tooling:[0,1000000],rejectPercent:[0,99],price:[0,10000],shipping:[0,10000],feePercent:[0,99],feeFixed:[0,10000],returnReserve:[0,10000],sellThrough:[0,100],wholesalePrice:[0,10000]});

export function calculatePilot(raw = PILOT_DEFAULTS) {
  const inputs = {};
  for (const [key,[min,max]] of Object.entries(INPUT_LIMITS)) {
    const value = Number(raw[key]);
    if ((typeof raw[key] === 'string' && raw[key].trim() === '') || raw[key] == null || !Number.isFinite(value) || value < min || value > max || (key === 'quantity' && !Number.isInteger(value))) throw new RangeError(`Check ${key}: use ${key === 'quantity' ? 'a whole number' : 'a number'} from ${min} to ${max}.`);
    inputs[key] = value;
  }
  const i = inputs;
  const wholeUnits = value => Math.floor(value + Number.EPSILON * Math.max(1, Math.abs(value)) * 8);
  const recoveryUnits = value => Math.ceil(value - Number.EPSILON * Math.max(1, Math.abs(value)) * 8);
  const saleable = wholeUnits(i.quantity * (100 - i.rejectPercent) / 100);
  if (!saleable) throw new RangeError('This batch has no saleable units. Increase quantity or lower the reject allowance.');
  const sold = wholeUnits(saleable * i.sellThrough / 100);
  const inventoryCash = i.quantity * (i.unitCost + i.packaging) + i.freight;
  const landed = inventoryCash / saleable;
  const fees = i.price * i.feePercent / 100 + i.feeFixed;
  const netReceipt = i.price - fees - i.shipping - i.returnReserve;
  const contribution = netReceipt - landed;
  const cashRequired = inventoryCash + i.tooling;
  const grossMargin = i.price > 0 ? (i.price - landed) / i.price * 100 : null;
  const contributionMargin = i.price > 0 ? contribution / i.price * 100 : null;
  // This is the number of unit contributions needed to recover tooling.
  // It is different from recovering all cash committed to unsold inventory.
  const toolingBreakEven = contribution > 0 ? recoveryUnits(i.tooling / contribution) : null;
  const cashRecoveryUnits = netReceipt > 0 ? recoveryUnits(cashRequired / netReceipt) : null;
  const pilotCashResult = sold * netReceipt - cashRequired;
  const wholesaleGrossMargin = i.wholesalePrice > 0 ? (i.wholesalePrice - landed) / i.wholesalePrice * 100 : null;
  return {inputs,saleable,rejected:i.quantity-saleable,sold,unsold:saleable-sold,inventoryCash,landed,fees,netReceipt,contribution,cashRequired,grossMargin,contributionMargin,toolingBreakEven,cashRecoveryUnits,pilotCashResult,wholesaleGrossMargin};
}

export function makerBrief(concept, finish, values = {}, pilot = null) {
  const clean = (v,max=600) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,max);
  const quantity = clean(values.quantity,20) || 'Quote 25 / 50 / 100; confirm supplier minimum';
  const lines = ['EL SEGUNDO BUILDWORKS / MAKER DISCUSSION BRIEF', 'Original concept; not an order, approved specification or tested product.', '', `Concept: ${concept.name} / ${concept.family}`, `Idea: ${concept.story}`, `Proposed scale: ${concept.size}`, `Process to discuss: ${finish.name}`, `Finish tradeoff: ${finish.tradeoff}`, `Quantity to quote: ${quantity}`, `Audience / intended use: ${clean(values.audience,160) || 'Adult decorative use; age classification still needs review.'}`, `Design question: ${clean(values.question) || concept.question}`, '', 'QUOTE / PROOF REQUEST', 'Confirm substrate, thickness, finish, dimensional tolerances, color method, attachments and packaging.', 'Separate tooling, samples, unit price, freight, import charges, tax, proof revisions and defect/remake terms.', 'Ask for MOQ per artwork/colorway, approved sample lead time, production start trigger and shipping window.', 'Supply original vector outlines and a scaled PDF; request supplier-specific bleed/cut and minimum line guidance.', 'Require a marked front/back proof. Approve artwork revision and physical sample separately.', '', 'RELEASE GATES', 'Rights log for artwork, fonts, photos and marks; no copied civic seal, commercial character or implied endorsement.', 'Determine intended age/use before making a label. Small parts, pin points and magnets require product-specific safety review.', 'Confirm materials/finish declarations and applicable testing with supplier or qualified lab; an adult label alone does not exempt a children’s product.', 'Write a dated sample/QC checklist; retain approved sample, lot identifier and defect photographs.', 'Test packaging, handling, attachment durability and shipping with a small pilot before a larger run.', 'Avoid unverifiable recycled, recyclable, non-toxic or child-safe claims.', '', 'ACCEPTANCE PLAN', concept.qc, '', 'BATCH RECORD', 'Artwork revision: ___  Approved proof: ___  Sample: ___  Supplier lot: ___', 'Material/finish evidence: ___  Test report scope: ___  Rejected units: ___', 'Pack-out count: ___  Returns/remake policy: ___  Release decision: ___'];
  if (pilot) lines.push('', 'ILLUSTRATIVE PILOT INPUTS / NOT A QUOTE OR SALES FORECAST', ...Object.entries(pilot.inputs).map(([k,v])=>`${k}: ${v}`), `Saleable units: ${pilot.saleable}; assumed sold: ${pilot.sold}; cash committed USD: ${pilot.cashRequired.toFixed(2)}`, 'Model excludes tax, duties, insurance, labor, overhead and multi-item order effects. Replace assumptions with quotes.');
  return lines.join('\n')+'\n';
}
