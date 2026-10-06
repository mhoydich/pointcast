import {scoreCourtCounts,STATIONS} from './model.mjs';
const mounts=new WeakMap();
const demo={a:{control:16,reset:15,hands:14,choose:13},b:{control:15,reset:13,hands:17,choose:15}};
/** Ephemeral DOM inputs only. No account, storage, fetch or telemetry. */
export function mountPaddleCourtStation(root=document){
 const station=root.matches?.('[data-paddle-court]')?root:root.querySelector('[data-paddle-court]');
 if(!station)return()=>{};
 if(mounts.has(station))return mounts.get(station);
 const doc=station.ownerDocument;const one=s=>station.querySelector(s);
 const inputs=[...station.querySelectorAll('[data-court-count]')];const result=one('[data-court-result]');const status=one('[data-court-status]');const mode=one('[data-court-mode]');
 const listeners=[];let fictional=false;const fictionalFields=new Set();let printState=null;
 const on=(element,event,handler)=>{element.addEventListener(event,handler);listeners.push(()=>element.removeEventListener(event,handler));};
 const element=(tag,text)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);return node;};
 const read=paddle=>Object.fromEntries(inputs.filter(i=>i.dataset.paddle===paddle).map(i=>[i.dataset.station,i.value]));
 const error=(input,invalid)=>{input.setAttribute('aria-invalid',String(invalid));doc.getElementById(input.getAttribute('aria-describedby')).hidden=!invalid;};
 const calculate=()=>{
  const scored={a:scoreCourtCounts(read('a')),b:scoreCourtCounts(read('b'))};
  for(const input of inputs)error(input,scored[input.dataset.paddle].errors.includes(input.dataset.station));
  result.replaceChildren();
  if(!scored.a.valid||!scored.b.valid){status.textContent='Complete all eight fields with whole-number counts from 0 to 20. Blank is missing, not zero.';inputs.find(i=>i.getAttribute('aria-invalid')==='true')?.focus();return;}
  const table=element('table');const caption=element('caption',fictional?'Fictional demonstration — no product or actual player':'Your self-reported session counts');table.append(caption);
  const head=element('thead');const hr=element('tr');for(const title of ['Station','Weight','A / 20','B / 20'])hr.append(element('th',title));head.append(hr);table.append(head);
  const body=element('tbody');
  for(let i=0;i<STATIONS.length;i++){const row=element('tr');const title=element('th',STATIONS[i].label);title.scope='row';row.append(title,element('td',STATIONS[i].weight+'%'),element('td',scored.a.contributions[i].count),element('td',scored.b.contributions[i].count));body.append(row);}
  const total=element('tr');const label=element('th','Weighted session score / 100');label.colSpan=2;label.scope='row';total.append(label,element('td',scored.a.total.toFixed(2)),element('td',scored.b.total.toFixed(2)));body.append(total);table.append(body);result.append(table);
  status.textContent=(fictional?'Fictional example. ':'Self-reported observations. ')+'A: '+scored.a.total.toFixed(2)+'; B: '+scored.b.total.toFixed(2)+'. Read the station trade-offs before the total. No universal pass score or purchase verdict.';
 };
 const modeText=()=>{mode.textContent=fictional?`CONTAINS FICTIONAL COUNTS: ${fictionalFields.size} of 8 fields still contain the loaded example; no product or actual player.`:'Your own observations. No fictional data loaded.';};
 for(const input of inputs)on(input,'input',()=>{fictionalFields.delete(input.id);fictional=fictionalFields.size>0;modeText();result.replaceChildren();status.textContent='Counts changed. Calculate again when all four stations are complete for both paddles.';error(input,false);});
 on(one('[data-court-calculate]'),'click',calculate);
 on(one('[data-court-demo]'),'click',()=>{for(const input of inputs){input.value=String(demo[input.dataset.paddle][input.dataset.station]);fictionalFields.add(input.id);}fictional=true;modeText();calculate();});
 on(one('[data-court-clear]'),'click',()=>{for(const input of inputs){input.value='';error(input,false);}for(const note of station.querySelectorAll('textarea'))note.value='';fictionalFields.clear();fictional=false;modeText();result.replaceChildren();status.textContent='Card cleared. All counts and practice notes are blank.';inputs[0]?.focus();});
 const beforePrint=()=>{if(printState)return;printState={fields:[...inputs,...station.querySelectorAll('textarea')].map(field=>({field,value:field.value})),details:[...station.querySelectorAll('.paddle-method-step')].map(detail=>({detail,open:detail.open}))};for(const {field} of printState.fields)field.value='';for(const {detail} of printState.details)detail.open=true;};
 const afterPrint=()=>{if(!printState)return;for(const {field,value} of printState.fields)field.value=value;for(const {detail,open} of printState.details)detail.open=open;printState=null;};
 on(doc.defaultView,'beforeprint',beforePrint);on(doc.defaultView,'afterprint',afterPrint);
 on(one('[data-court-print]'),'click',()=>doc.defaultView.print());
 const cleanup=()=>{afterPrint();for(const dispose of listeners)dispose();mounts.delete(station);};mounts.set(station,cleanup);return cleanup;
}
