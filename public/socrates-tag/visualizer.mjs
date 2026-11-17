import {visualState} from './visualizer-model.mjs';
/** OFF-54 B. Additive view consuming Ada's projection; never reads/writes the board. */
export function mountVisualizer(root=document.getElementById('flame-trail')) {
 if(!root)return ()=>{};
 let state=null,portraits={};
 root.classList.add('flame-trail');
 const heading=document.createElement('h2');heading.textContent='Around the fire';
 const status=document.createElement('p');status.setAttribute('role','status');
 const list=document.createElement('ol');list.setAttribute('aria-label','Last six reported moves');
 const caution=document.createElement('p');caution.className='flame-trail-note';caution.textContent='A retained chain, not an eligibility roster. Portraits and handles are self-declared.';
 root.replaceChildren(heading,status,list,caution);
 function paint(){
  const v=visualState(state,portraits);const text=v.status+(v.next?' · '+v.next:'');if(status.textContent!==text)status.textContent=text;
  root.dataset.reportedActive=String(v.active);
  const signature=JSON.stringify(v.moves);if(list.dataset.signature===signature)return;list.dataset.signature=signature;
  list.replaceChildren(...v.moves.map(m=>{const li=document.createElement('li');
   if(m.svg){const img=document.createElement('img');img.src=m.svg;img.alt='';img.width=48;img.height=48;img.loading='lazy';li.append(img)}
   const name=document.createElement('strong');name.textContent=m.name;const q=document.createElement('q');q.textContent=m.quote;
   const link=document.createElement('a');link.href='#move-'+m.id;link.textContent='Source & receipt';li.append(name,q,link);return li}));
 }
 const update=e=>{state=e.detail??null;portraits=state?.portraits??{};paint()};
 document.addEventListener('socrates-state',update);
 // A failed room read must immediately remove the active indication.
 const fail=()=>{state=state?{...state,checkedAt:0}:null;paint()};
 document.addEventListener('socrates-read-failed',fail);
 const timer=setInterval(paint,1000);paint();
 return ()=>{clearInterval(timer);document.removeEventListener('socrates-state',update);document.removeEventListener('socrates-read-failed',fail)};
}
mountVisualizer();
