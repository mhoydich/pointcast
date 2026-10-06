import {forecastMetrics,presetRows} from '../lib/forecast-calibration.mjs';
export function initCalibration(root=document){
 root.querySelectorAll('[data-calibration]').forEach(lab=>{
  if(lab.dataset.initialized)return;lab.dataset.initialized='true';
  const example=JSON.parse(lab.dataset.example);let active=example.presets.find(p=>p.id==='matched');
  const outcome=lab.querySelector('[data-first-outcome]');const svgNS='http://www.w3.org/2000/svg';
  const render=()=>{
   try{
    const result=forecastMetrics(presetRows(example.rows,active,Number(outcome.value)));
    lab.querySelector('[data-calibration-result]').textContent=`Mean Brier loss ${result.brier.toFixed(4)} (lower is better). Binned ECE ${result.ece.toFixed(4)} probability units (${(result.ece*100).toFixed(2)} percentage points). n = ${result.n}; Yes = ${result.yesCount}.`;
    lab.querySelector('[data-explanation]').textContent=active.explanation;
    lab.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===active.id)));
    const body=lab.querySelector('[data-calibration-bins]');body.replaceChildren();
    const points=lab.querySelector('[data-calibration-points]');points.replaceChildren();
    for(const b of result.bins){
     const tr=document.createElement('tr');const values=[['[0, 0.2)','[0.2, 0.4)','[0.4, 0.6)','[0.6, 0.8)','[0.8, 1]'][b.index],b.count,...[b.mean,b.observed,b.gap].map(v=>v===null?'—':v.toFixed(4))];
     values.forEach((v,i)=>{const cell=document.createElement(i?'td':'th');if(!i)cell.scope='row';cell.textContent=String(v);tr.append(cell);});body.append(tr);
     if(b.count){const group=document.createElementNS(svgNS,'g');const circle=document.createElementNS(svgNS,'circle');circle.setAttribute('cx',45+b.mean*230);circle.setAttribute('cy',255-b.observed*230);circle.setAttribute('r','6');circle.setAttribute('fill','#8566ad');circle.setAttribute('stroke','currentColor');const text=document.createElementNS(svgNS,'text');text.setAttribute('x',53+b.mean*230);text.setAttribute('y',249-b.observed*230);text.textContent='n='+b.count;group.append(circle,text);points.append(group);}
    }
   }catch(error){lab.querySelector('[data-calibration-result]').textContent=error.message;}
  };
  lab.querySelectorAll('button,select').forEach(el=>el.disabled=false);
  lab.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{active=example.presets.find(p=>p.id===b.dataset.preset);render();}));
  outcome.addEventListener('change',render);
  lab.querySelector('[data-calibration-reset]').addEventListener('click',()=>{active=example.presets.find(p=>p.id==='matched');outcome.value='1';render();});
  render();
 });
}
if(typeof document!=='undefined'){initCalibration();document.addEventListener('astro:page-load',()=>initCalibration());}
