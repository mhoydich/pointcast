import {solarScenario,energyScenario} from '../lib/electricity-study.mjs';
export function setupElectricity(doc=document){
 const root=doc.querySelector('[data-electricity]');if(!root||root.dataset.ready)return;root.dataset.ready='true';
 const money=n=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});const number=n=>n.toLocaleString('en-US',{maximumFractionDigits:1});
 for(const kind of ['energy','solar']){const form=root.querySelector(`[data-${kind}-form]`),out=root.querySelector(`[data-${kind}-output]`);if(!form||!out)continue;
 const update=()=>{const x=Object.fromEntries(Array.from(form.elements).filter(el=>el.name).map(el=>[el.name,el.value===''?NaN:Number(el.value)]));const r=form.checkValidity()?(kind==='solar'?solarScenario(x):energyScenario(x.watts,x.hours,x.days,x.rate,x.fixed)):null;
 if(!r){out.innerHTML='<p class="el-error">Enter valid numbers within the labeled ranges. Incentives cannot exceed solar cost.</p>';return;}
 const rows=kind==='energy'?[['Power',`${number(r.kw)} kW`],['Monthly energy',`${number(r.kwh)} kWh`],['Energy portion',money(r.energyCost)],['Plus fixed-charge assumption',money(r.total)]]:[['Annual solar generation',`${number(r.generated)} kWh`],['Solar directly used / exported',`${number(r.direct)} / ${number(r.exports)} kWh`],['Battery input / delivered',`${number(r.shiftedInput)} / ${number(r.delivered)} kWh`],['Solar-only annual benefit after maintenance',money(r.solarValue)],['Added battery annual benefit',money(r.storageValue)],['Solar-only simple payback',r.solarPayback===null?'No positive annual benefit':`${number(r.solarPayback)} years`],['Solar + battery simple payback',r.combinedPayback===null?'No positive annual benefit':`${number(r.combinedPayback)} years`]];
 out.innerHTML=`<dl>${rows.map(([label,value])=>`<dt>${label}</dt><dd>${value}</dd>`).join('')}</dl>`;};
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('reset',()=>setTimeout(update,0));update();
 }
}
if(typeof document!=='undefined'){setupElectricity();document.addEventListener('astro:page-load',()=>setupElectricity());}
