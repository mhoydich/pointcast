import {calculatePilot, makerBrief, PILOT_DEFAULTS} from '../lib/buildworks.mjs';
export function initBuildworks(root, data) {
  if (!root || root.dataset.bound) return;
  root.dataset.bound = 'true';
  const calculator = root.querySelector('[data-calculator]');
  const briefForm = root.querySelector('[data-brief-form]');
  const briefOutput = root.querySelector('[data-brief-output]');
  const feedback = root.querySelector('[data-brief-status]');
  let pilot = null;
  let brief = '';
  const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
  const set = (key, value) => { root.querySelector(`[data-result="${key}"]`).textContent = value; };
  const updateBrief = () => {
    const values = Object.fromEntries(new FormData(briefForm));
    const concept = data.concepts.find(c=>c.id===values.concept) || data.concepts[0];
    const finish = data.finishes.find(f=>f.id===values.finish) || data.finishes[0];
    root.querySelector('[data-brief-preview]').src = `/images/buildworks/${concept.id}.svg`;
    root.querySelector('[data-brief-preview]').alt = `${concept.name}, original flat concept illustration`;
    const compatible = concept.processes.includes(finish.id);
    root.querySelector('[data-compatibility]').textContent = compatible ? 'Plausible process to quote. The maker must confirm feasibility.' : 'Exploratory pairing: this finish is not in the concept’s proposed process shortlist. Revise its substrate/geometry with the maker before quoting.';
    brief = makerBrief(concept, finish, values, pilot);
    briefOutput.textContent = brief;
  };
  const updatePilot = (announce = false) => {
    try {
      pilot = calculatePilot(Object.fromEntries(new FormData(calculator)));
      root.querySelector('[data-calc-error]').textContent='';
      root.querySelector('[data-results]').hidden=false;
      set('cash',money(pilot.cashRequired));set('landed',money(pilot.landed));set('contribution',money(pilot.contribution));set('cashResult',money(pilot.pilotCashResult));
      set('units',`${pilot.saleable} saleable / ${pilot.rejected} rejected`);set('sold',`${pilot.sold} assumed sold / ${pilot.unsold} unsold`);
      set('gross',pilot.grossMargin===null?'Undefined at $0 price':`${pilot.grossMargin.toFixed(1)}% gross margin`);
      set('net',pilot.contributionMargin===null?'Undefined at $0 price':`${pilot.contributionMargin.toFixed(1)}% after selling costs`);
      set('wholesale',pilot.wholesaleGrossMargin===null?'Undefined at $0 wholesale price':`${pilot.wholesaleGrossMargin.toFixed(1)}% wholesale gross margin`);
      set('breakEven',pilot.toolingBreakEven===null?'No tooling break-even with nonpositive contribution':`${pilot.toolingBreakEven} units to recover tooling${pilot.toolingBreakEven>pilot.saleable?' — exceeds this batch':''}`);
      if (announce) { const status=root.querySelector('[data-calc-status]'); if(status) status.textContent=`Model updated. Upfront batch cash ${money(pilot.cashRequired)}; direct contribution ${money(pilot.contribution)} per unit; batch cash result ${money(pilot.pilotCashResult)}.`; }
      set('recovery',pilot.cashRecoveryUnits===null?'No cash recovery with nonpositive net receipts':`${pilot.cashRecoveryUnits} sales to recover all batch cash${pilot.cashRecoveryUnits>pilot.saleable?' — exceeds this batch':''}`);
    } catch(e) {pilot=null;root.querySelector('[data-results]').hidden=true;root.querySelector('[data-calc-error]').textContent=e.message;const status=root.querySelector('[data-calc-status]');if(status)status.textContent='';}
    updateBrief();
  };
  calculator.addEventListener('submit',e=>e.preventDefault());
  briefForm.addEventListener('submit',e=>e.preventDefault());
  calculator.addEventListener('change',()=>updatePilot(true));
  calculator.addEventListener('input',()=>updatePilot(false));
  briefForm.addEventListener('change',updateBrief);
  briefForm.addEventListener('input',updateBrief);
  root.querySelectorAll('[data-use-concept]').forEach(button=>button.addEventListener('click',()=>{
    const concept=data.concepts.find(c=>c.id===button.dataset.useConcept);
    briefForm.elements.concept.value=concept.id;briefForm.elements.finish.value=concept.processes[0];
    updateBrief();root.querySelector('#brief-title').focus();
    feedback.textContent=`${concept.name} is now in your maker brief.`;
  }));
  root.querySelector('[data-reset]').addEventListener('click',()=>{for(const [key,value] of Object.entries(PILOT_DEFAULTS))calculator.elements[key].value=String(value);updatePilot(true);});
  root.querySelector('[data-download]').addEventListener('click',()=>{
    const blob = new Blob([brief],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='el-segundo-buildworks-maker-brief.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    feedback.textContent='Maker brief downloaded. Review its open questions before sharing it.';
  });
  root.querySelectorAll('form input, form select, form textarea, [data-download], [data-reset], [data-use-concept]').forEach(control=>control.disabled=false);
  root.querySelector('[data-interactive-note]').textContent='Your edits stay in this page until you leave or reload. Download a brief to keep them.';
  updatePilot();
}
