import data from '../data/ai-value.json';
import { calculateAIValue, calculateCeiling, AI_VALUE_VERSION } from './ai-value.mjs';
const dollars = value => value.toLocaleString('en-US',{style:'currency',currency:'USD'});
const read = form => Object.fromEntries([...form.elements].filter(el=>el.name).map(el=>[el.name,el.type==='checkbox'?el.checked:el.value]));
export function setupAIValue() {
  for (const root of document.querySelectorAll('[data-ai-value]')) {
    if (root.dataset.ready) continue;
    root.dataset.ready='true';
    const forms=[...root.querySelectorAll('[data-value-scenario]')];const results=new Map();
    const loadRates = form => {
      const preset=data.verified_rate_presets.find(p=>p.id===form.elements.rate_preset.value);
      if (preset) for (const [key,value] of Object.entries(preset.rates)) form.elements[key+'_rate'].value=value;
      form.querySelector('[data-rate-note]').textContent=preset ? `${preset.model}: ${preset.context}; ${preset.processing}; checked ${preset.verified_at}. Extras excluded. Source: ${data.source_ledger.find(s=>s.id===preset.source_id).url}` : 'Custom / unverified rates. Enter each rate explicitly; blank does not mean free.';
    };
    const render = form => {
      const input=read(form);const error=form.querySelector('[data-value-error]');
      try {
        const rates=Object.fromEntries(['input','cache_read','cache_write','output'].map(k=>[k,input[k+'_rate']]));
        const result=calculateAIValue(input,rates);results.set(form,{input,rates,result});error.hidden=true;
        for (const output of form.querySelectorAll('[data-value-output]')) {
          const key=output.dataset.valueOutput,value=result[key];
          output.textContent=value===null ? (key==='costPerAccepted'&&result.acceptedTasks===0?'No accepted results':'Not enough data / coverage or scope unconfirmed') : key==='equivalenceMultiple' ? `${value.toFixed(2)}× (${result.coverageLabel.toLowerCase()})` : key==='breakEvenAttempts' ? `${value.toFixed(2)} attempts; modeled fixed scope` : dollars(value);
        }
        for(const bucket of form.querySelectorAll('[data-value-bucket]'))bucket.textContent=dollars(result.breakdown[bucket.dataset.valueBucket]);
        form.querySelector('[data-coverage-note]').textContent=result.coverageLabel+'. API-equivalent dollars are list-price estimates, not compute cost, cash savings or guaranteed credit.';
        form.querySelector('[data-budget-note]').textContent=result.budget===null?'No budget threshold entered.':`${result.overBudget?'Above':'Within'} your ${dollars(result.budget)} planning threshold. This does not configure provider spending controls.`;
      } catch (e) {
        results.delete(form);error.textContent=e.message;error.hidden=false;
        for(const output of form.querySelectorAll('[data-value-output]'))output.textContent='Not enough data';
        for(const bucket of form.querySelectorAll('[data-value-bucket]'))bucket.textContent='Not enough data';
        form.querySelector('[data-coverage-note]').textContent='Correct the input before interpreting an estimate.';form.querySelector('[data-budget-note]').textContent='';
      }
    };
    for(const form of forms){
      form.addEventListener('submit',e=>e.preventDefault());
      form.addEventListener('input',e=>{if(e.target.name?.endsWith('_rate')){form.elements.rate_preset.value='custom';loadRates(form);}render(form);});
      form.addEventListener('change',e=>{if(e.target.name==='rate_preset'){loadRates(form);}render(form);});
      form.addEventListener('reset',()=>requestAnimationFrame(()=>{loadRates(form);render(form);}));
      loadRates(form);render(form);
    }
    const compare=root.querySelector('[data-compare]');compare.addEventListener('change',()=>{forms[1].hidden=!compare.checked;});
    const brief=root.querySelector('.value-brief');brief.addEventListener('change',()=>{root.querySelector('[data-comparison-note]').textContent=brief.querySelector('[name=comparability]').value==='yes'?'Reader confirmed comparable features and quality. Compare both entered coverage states, accepted-result costs and missing charges; no automatic winner is assigned.':'Quality or required features are different or unknown. Cost estimates alone cannot select a winner.';});
    root.querySelector('[data-value-export]').addEventListener('click',()=>{
      const assumptions={version:AI_VALUE_VERSION,checkedDate:data.editorial.fact_checked_at,taskDefinition:brief.querySelector('[name=task_definition]').value,acceptanceStandard:brief.querySelector('[name=acceptance_standard]').value,comparability:brief.querySelector('[name=comparability]').value,scenarios:forms.filter(f=>!f.hidden).map(f=>results.get(f)||{input:read(f),error:'Not enough data'}),sourceUrls:data.source_ledger.map(s=>s.url),labels:{apiEquivalent:'API-equivalent workload estimate; not credits or savings',modeledPriceDifference:'Modeled price difference only with entered coverage and matched scope',costPerAccepted:'Fully loaded cost per accepted result, requiring coverage'},hypothetical:true};
      const url=URL.createObjectURL(new Blob([JSON.stringify(assumptions,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pointcast-ai-value-assumptions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);
    });
    const ceiling=root.querySelector('[data-value-ceiling]');ceiling.addEventListener('submit',e=>{e.preventDefault();const output=ceiling.querySelector('[data-ceiling-result]');try{const value=calculateCeiling(read(ceiling));output.textContent=`${dollars(value.utilizedEquivalent)} · ${value.label}`;}catch(e){output.textContent=e.message;}});
    ceiling.querySelector('button[type="submit"]').disabled=false;
  }
}
