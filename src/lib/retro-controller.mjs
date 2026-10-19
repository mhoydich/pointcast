import {safeState,dailyChallenge} from './retro-catalog.mjs';
const node=document.querySelector('#retro-data');
if(node){
 const {projects,channels,teletextPages}=JSON.parse(node.textContent);
 const room=document.body.dataset.room;
 const $=s=>document.querySelector(s);
 const key='pointcast-retro-v1';
 let state={tape:[],notes:[]},remember=false;
 const ids=projects.map(p=>p.href);
 const link=(p)=>{const a=document.createElement('a');a.href=p.href;a.textContent=p.title;return a;};
 const status=message=>{if($('#storage-status'))$('#storage-status').textContent=message;};
 function persist(){if(!remember)return;try{localStorage.setItem(key,JSON.stringify(state));status('Saved on this device only.');}catch{remember=false;if($('#remember'))$('#remember').checked=false;status('Saving unavailable. Your changes remain in memory until you leave this page.');}}
 if($('#remember')){
  try{const saved=localStorage.getItem(key);if(saved){state=safeState(saved,ids);remember=true;$('#remember').checked=true;status('Loaded this device’s private tape and notes.');}}catch{status('Device storage unavailable. This page visit stays in memory.');}
  $('#remember').addEventListener('change',e=>{remember=e.target.checked;if(remember)persist();else{try{localStorage.removeItem(key);status('Saving is off. Saved Retro Room data removed; this visit remains in memory.');}catch{status('Storage unavailable. Saving is off until you leave this page.');}}});
  $('#reset-local').addEventListener('click',()=>{state={tape:[],notes:[]};remember=false;$('#remember').checked=false;try{localStorage.removeItem(key);status('Retro Room tape and notes reset. Saving is off.');}catch{status('In-memory data reset. Device storage could not be accessed.');}renderTape();renderNotes();});
 }
 function renderTape(){
  if(!$('#tape-tracks'))return;
  $('#tape-tracks').replaceChildren();$('#side-a').replaceChildren();$('#side-b').replaceChildren();
  if(!state.tape.length){const p=document.createElement('p');p.textContent='An empty tape. Add a page from the shelf below.';$('#tape-tracks').append(p);}
  state.tape.forEach((id,i)=>{const p=projects.find(x=>x.href===id);if(!p)return;const row=document.createElement('div');row.className='track';row.append(link(p));
   for(const [label,delta] of [['↑',-1],['↓',1],['Remove',0]]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',`${delta===0?'Remove':delta<0?'Move up':'Move down'} ${p.title}`);b.disabled=delta<0&&i===0||delta>0&&i===state.tape.length-1;b.addEventListener('click',()=>{if(delta===0)state.tape.splice(i,1);else[state.tape[i],state.tape[i+delta]]=[state.tape[i+delta],state.tape[i]];persist();renderTape();});row.append(b);}
   $('#tape-tracks').append(row);const li=document.createElement('li');li.append(link(p));$(i<6?'#side-a':'#side-b').append(li);
  });
  document.querySelectorAll('[data-add]').forEach(b=>{const added=state.tape.includes(b.dataset.add);b.textContent=added?'On this tape ✓':'Add to tape +';b.disabled=added||state.tape.length>=12;});
 }
 function renderNotes(){if(!$('#notes'))return;$('#notes').replaceChildren();$('#notes-empty').hidden=!!state.notes.length;state.notes.forEach(n=>{const li=document.createElement('li');li.textContent=`${n.day}\n${n.text}`;$('#notes').append(li);});}
 if(room==='mixtape'){
  document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{if(!state.tape.includes(b.dataset.add)&&state.tape.length<12){state.tape.push(b.dataset.add);persist();renderTape();}}));
  $('#clear-tape').addEventListener('click',()=>{state.tape=[];persist();renderTape();});
  $('#print-tape').addEventListener('click',()=>window.print());
  $('#export-tape').addEventListener('click',()=>{const text='POINTCAST / READING TAPE\n'+state.tape.map((id,i)=>{const p=projects.find(x=>x.href===id);return `${i<6?'A':'B'}${i%6+1}. ${p.title}\nhttps://pointcast.xyz${p.href}`;}).join('\n');$('#tape-export').value=text;$('#tape-export').hidden=false;$('#export-label').hidden=false;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='pointcast-reading-tape.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  renderTape();
 }
 if(room==='bbs'){
  const challenge=dailyChallenge();$('#challenge-day').textContent=challenge.day;$('#challenge-text').textContent=challenge.text;
  const completed=()=>state.notes.some(n=>n.day===challenge.day&&n.text===`Challenge completed: ${challenge.text}`);
  const renderChallenge=()=>{$('#challenge-status').textContent=completed()?'Recorded on this device for today.':'';$('#complete-challenge').disabled=completed();};
  $('#complete-challenge').addEventListener('click',()=>{if(!completed()){state.notes.push({day:challenge.day,text:`Challenge completed: ${challenge.text}`});state.notes=state.notes.slice(-20);persist();renderNotes();renderChallenge();}});
  $('#note-form').addEventListener('submit',e=>{e.preventDefault();const text=$('#note-text').value.trim();if(!text)return;state.notes.push({day:new Date().toISOString().slice(0,10),text:text.slice(0,280)});state.notes=state.notes.slice(-20);$('#note-text').value='';persist();renderNotes();renderChallenge();});
  $('#clear-notes').addEventListener('click',()=>{state.notes=[];persist();renderNotes();renderChallenge();});
  $('#reset-local').addEventListener('click',renderChallenge);renderNotes();renderChallenge();
 }
 if($('#filter-form')){
  const apply=()=>{let count=0;const q=$('#search').value.trim().toLowerCase(),kind=$('#filter').value;document.querySelectorAll('[data-href]').forEach(card=>{card.hidden=!(card.dataset.search.includes(q)&&card.dataset.topics.split(' ').includes(kind));if(!card.hidden)count++;});$('#result-count').textContent=`${count} destination${count===1?'':'s'}`;$('#no-results').hidden=!!count;};
  $('#filter-form').addEventListener('submit',e=>e.preventDefault());$('#search').addEventListener('input',apply);$('#filter').addEventListener('change',apply);$('#filter-form').addEventListener('reset',()=>setTimeout(apply,0));apply();
 }
 if(room==='teletext'){
  const show=()=>{const number=location.hash.replace('#p','')||'100';const p=teletextPages.find(p=>p.number===number);if(!p){$('#page-status').textContent='PAGE NOT FOUND / choose 100–105';return;}$('#page-number').value=p.number;$('#page-status').textContent=`POINTCAST / P${p.number}`;$('#page-title').textContent=p.title;$('#page-note').textContent=p.note;$('#teletext-results').replaceChildren();let selection=projects.filter(x=>x.topics.includes(p.kind));if(p.number==='105')selection=[...selection].sort((a,b)=>(b.publishedAt??'').localeCompare(a.publishedAt??''));selection.forEach(x=>{const row=document.createElement('div');row.className='line';row.append(link(x));$('#teletext-results').append(row);});if(!selection.length){const n=document.createElement('p');n.textContent='No published destination in this desk yet. Return to page 100 for the full directory.';$('#teletext-results').append(n);}document.querySelectorAll('[data-page]').forEach(a=>{if(a.dataset.page===p.number)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});};
  $('#page-form').addEventListener('submit',e=>{e.preventDefault();const p=$('#page-number').value;if(teletextPages.some(x=>x.number===p)){if(location.hash===`#p${p}`)show();else location.hash=`p${p}`;}else $('#page-status').textContent='PAGE NOT FOUND / choose 100–105';});window.addEventListener('hashchange',show);show();
 }
 if(room==='saturday-morning'){
  let current=0;
  const show=()=>{const p=channels[current];if(!p){$('#channel-title').textContent='No published channels in this edition.';$('#channel-start').hidden=true;$('#channel-prev').disabled=true;$('#channel-next').disabled=true;$('#channel-dial').disabled=true;return;}$('#channel-number').textContent=`CHANNEL ${p.number}`;$('#channel-title').textContent=p.title;$('#channel-note').textContent=p.note;$('#bumper-title').textContent=p.bumper;$('.bumper').dataset.channel=p.number;$('#channel-start').href=p.href;$('#channel-dial').value=p.number;};
  const load=()=>{const found=channels.findIndex(c=>`#c${c.number}`===location.hash);current=found<0?0:found;show();};
  const change=delta=>{if(!channels.length)return;current=(current+delta+channels.length)%channels.length;location.hash=`c${channels[current].number}`;show();};
  $('#channel-prev').addEventListener('click',()=>change(-1));$('#channel-next').addEventListener('click',()=>change(1));$('#channel-dial').addEventListener('change',e=>{location.hash=`c${e.target.value}`;load();});window.addEventListener('hashchange',load);load();
 }
}
