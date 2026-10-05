import {filterStudies} from '../lib/ues-front-door.mjs';
import data from '../data/ues-front-door.json' with {type:'json'};
export function initFrontDoor(root = document.querySelector('[data-ues-front-door]')) {
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const form = root.querySelector('[data-study-form]'), count = root.querySelector('[data-study-count]');
  const fields = {query: form.elements.namedItem('query'), school: form.elements.namedItem('school'), status: form.elements.namedItem('status')};
  const apply = () => {
    const visible = new Set(filterStudies(data.studies, {query:fields.query.value,school:fields.school.value,status:fields.status.value}).map((s)=>s.id));
    root.querySelectorAll('[data-study]').forEach((card)=>{card.hidden=!visible.has(card.dataset.study);});
    count.textContent = `${visible.size} of ${data.studies.length} studies`;
    root.querySelector('[data-study-empty]').hidden = visible.size !== 0;
  };
  root.querySelectorAll('button,input,select').forEach((el)=>{el.disabled=false;});
  form.addEventListener('submit',(event)=>event.preventDefault());
  form.addEventListener('input',apply); form.addEventListener('change',apply);
  form.addEventListener('reset',()=>setTimeout(apply,0));
  root.querySelectorAll('[data-pick-school]').forEach((button)=>button.addEventListener('click',()=>{
    fields.school.value=button.dataset.pickSchool; fields.query.value=''; fields.status.value=''; apply();
    fields.query.focus({preventScroll:true}); root.querySelector('#study-directory').scrollIntoView({block:'start',behavior:'auto'});
  }));
}
initFrontDoor(); document.addEventListener('astro:page-load',()=>initFrontDoor());
