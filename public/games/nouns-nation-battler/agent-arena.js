const $ = id => document.getElementById(id);
const canvas = $('arena-canvas'), ctx = canvas.getContext('2d');
let catalog, rulesVersion, record, match, playing = false, elapsed = 0, previous = 0, currentFrame = -1;
const sprites = Array.from({length:60},(_,i)=>{const image=new Image();image.src='/games/nouns-nation-battler/assets/noun-'+i+'.svg';return image;});
const status = text => { $('arena-status').textContent = text; };
function input() {
  const seed = Number($('arena-seed').value);
  if (!$('arena-seed').value.trim() || !Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw Error('Choose a whole-number seed from 0 to 4294967295.');
  return { seed, left: { gang: $('left-gang').value, tactic: $('left-tactic').value }, right: { gang: $('right-gang').value, tactic: $('right-tactic').value } };
}
function example() {
  try { $('arena-example').textContent = `GET https://pointcast.xyz/api/nouns-battler/arena\n\nPOST https://pointcast.xyz/api/nouns-battler/arena\nContent-Type: application/json\n\n${JSON.stringify(input(), null, 2)}\n\n// Optional commissioned record: POST /api/agent/battler\n// Body: {"match": <the input above>, "rulesVersion": "${rulesVersion}", "maxSpendUnits": "10000"}\n// No payment signature: receive terms only (HTTP 402).`; } catch {}
  for (const side of ['left','right']) $(''+side+'-hint').textContent = catalog?.tactics.find(t => t.id === $(side+'-tactic').value)?.description || '';
}
function field() {
  ctx.fillStyle = '#e4eacb'; ctx.fillRect(0,0,1000,600);
  ctx.strokeStyle = '#bec9a8'; ctx.lineWidth=1;
  for(let x=25;x<1000;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke();}
  for(let y=25;y<600;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1000,y);ctx.stroke();}
  ctx.strokeStyle='#a7b28f';ctx.lineWidth=3;ctx.strokeRect(22,22,956,556);ctx.beginPath();ctx.arc(500,300,85,0,Math.PI*2);ctx.stroke();ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(500,22);ctx.lineTo(500,578);ctx.stroke();ctx.setLineDash([]);
}
function draw(index) {
  field();
  if(!match){ctx.fillStyle='#6f785d';ctx.font='bold 28px system-ui';ctx.textAlign='center';ctx.fillText('THE PLAYGROUND IS OPEN',500,280);ctx.font='18px system-ui';ctx.fillText('Choose two gangs. Make a little history.',500,318);return;}
  const frame=match.frames[index];if(!frame)return;
  const live={left:0,right:0};
  for(const [id,x,y,hp] of frame.units){const unit=match.units.find(u=>u.id===id);if(!unit||hp<=0)continue;live[unit.side]++;
    const color=catalog.gangs.find(g=>g.id===unit.gang)?.color || (unit.side==='left'?'#d76847':'#4b8b82');
    ctx.fillStyle='rgba(38,45,22,.15)';ctx.beginPath();ctx.ellipse(x,y+19,18,6,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=unit.side==='left'?'#fffdf1':'#282820';ctx.beginPath();ctx.arc(x,y+23,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;ctx.fillRect(x-15,y-15,30,30);ctx.strokeStyle='#282820';ctx.lineWidth=2;ctx.strokeRect(x-15,y-15,30,30);
    ctx.fillStyle='#fff9e5';ctx.fillRect(x-11,y-8,9,8);ctx.fillRect(x+2,y-8,9,8);ctx.fillStyle='#282820';ctx.fillRect(x-7,y-6,3,5);ctx.fillRect(x+4,y-6,3,5);ctx.fillRect(x-2,y-5,4,2);
    const sprite=sprites[unit.nounId];if(sprite?.complete && sprite.naturalWidth){ctx.drawImage(sprite,x-17,y-18,34,34);}
    ctx.fillStyle='#282820';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(unit.role.slice(0,1).toUpperCase(),x+21,y+5);
    ctx.fillStyle='#69715b';ctx.fillRect(x-15,y-23,30,4);ctx.fillStyle='#3d8453';ctx.fillRect(x-15,y-23,30*Math.max(0,hp)/unit.maxHp,4);
  }
  for(const event of match.events.filter(e=>e.tick<=frame.tick && e.tick>frame.tick-3)) {
    const target=frame.units.find(u=>u[0]===event.target);
    if(target && event.amount){ctx.fillStyle=event.type==='heal'?'#27713e':'#b23828';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(String(event.amount),target[1],target[2]-30);}
  }
  $('left-score').textContent=`${catalog.gangs.find(g=>g.id===match.input.left.gang)?.short || 'LEFT'} · ${live.left}`;
  $('right-score').textContent=`${catalog.gangs.find(g=>g.id===match.input.right.gang)?.short || 'RIGHT'} · ${live.right}`;
  $('arena-clock').textContent=`${(frame.tick*match.tickMs/1000).toFixed(1)}s / ${(match.durationMs/1000).toFixed(1)}s`;
  $('arena-scrub').value=String(index);
  if(index!==currentFrame){currentFrame=index;const events=match.events.filter(e=>e.tick<=frame.tick).slice(-12);$('arena-events').replaceChildren(...events.map(e=>{const li=document.createElement('li');li.textContent=`${(e.tick*match.tickMs/1000).toFixed(1)}s · ${e.text || e.type}`;return li;}));}
}
function toggle(value){playing=value;$('arena-play').textContent=playing?'Pause':'Play replay';previous=0;}
function animate(time){if(playing&&match){if(previous)elapsed+=(time-previous)*Number($('arena-speed').value);previous=time;const tick=elapsed/match.tickMs;let i=match.frames.findIndex(f=>f.tick>tick);i=i<0?match.frames.length-1:Math.max(0,i-1);draw(i);if(elapsed>=match.durationMs){draw(match.frames.length-1);toggle(false);}}requestAnimationFrame(animate);}
$('arena-form').addEventListener('submit',async e=>{e.preventDefault();try{const body=input();$('arena-run').disabled=true;status('The server is running your exhibition…');const response=await fetch('/api/nouns-battler/arena',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok||!data.ok||!data.match)throw Error(data.error?.message||data.error||'The exhibition could not start. Try again.');record=data;match=data.match;elapsed=0;currentFrame=-1;$('arena-scrub').max=String(match.frames.length-1);for(const id of ['arena-play','arena-restart','arena-scrub','arena-download'])$(id).disabled=false;
$('arena-result').textContent=match.winner==='draw'?'An evenly matched playground.':`${catalog.gangs.find(g=>g.id===match.input[match.winner].gang)?.name || match.winner} take the exhibition!`;
$('arena-proof').textContent=`Server-run result · ${match.rulesVersion} · ${match.reason} · Survivors ${match.survivors.left}–${match.survivors.right} · Match hash: ${data.matchHash}`;
status('Exhibition complete. Watch the replay or download the full record.');draw(0);toggle(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}catch(err){status(String(err.message||err));}finally{$('arena-run').disabled=!catalog;}});
$('arena-play').onclick=()=>{if(elapsed>=match.durationMs)elapsed=0;toggle(!playing);};$('arena-restart').onclick=()=>{elapsed=0;draw(0);toggle(false);};$('arena-speed').onchange=()=>{previous=0;};$('arena-scrub').oninput=()=>{toggle(false);const i=Number($('arena-scrub').value);elapsed=match.frames[i].tick*match.tickMs;draw(i);};
$('arena-random').onclick=()=>{$('arena-seed').value=String(crypto.getRandomValues(new Uint32Array(1))[0]);example();};
$('arena-download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`nouns-exhibition-${match.input.seed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('arena-quote').onclick=async()=>{const button=$('arena-quote');button.disabled=true;try{const response=await fetch('/api/agent/battler',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({match:input(),rulesVersion,maxSpendUnits:'10000'})});const data=await response.json();$('arena-terms').hidden=false;$('arena-terms').textContent=`HTTP ${response.status} · No payment submitted\n${JSON.stringify(data,null,2)}`;}catch(err){status(`Could not retrieve terms: ${err.message}`);}finally{button.disabled=false;}};
$('arena-form').addEventListener('change',example);
field();draw(0);requestAnimationFrame(animate);
(async()=>{try{const response=await fetch('/api/nouns-battler/arena');const data=await response.json();if(!response.ok||!data.ok)throw Error('Catalog unavailable. Reload to try again.');catalog=data.catalog;rulesVersion=data.rulesVersion;for(const side of ['left','right']){for(const kind of ['gang','tactic']){const select=$(side+'-'+kind);select.replaceChildren(...catalog[kind==='gang'?'gangs':'tactics'].map(item=>{const o=document.createElement('option');o.value=item.id;o.textContent=item.name;return o;}));select.disabled=false;}if(side==='right'){$('right-gang').selectedIndex=Math.min(1,catalog.gangs.length-1);$('right-tactic').value='guard';}}$('arena-run').disabled=false;$('arena-quote').disabled=false;example();status('Pick your gangs. The first exhibition is on the house.');
const actionId=new URLSearchParams(location.search).get('record');
if(actionId){
  if(!/^pai_[a-zA-Z0-9_-]+$/.test(actionId))throw Error('That record link is not valid.');
  status('Opening commissioned record…');
  const actionResponse=await fetch('/api/actions/'+encodeURIComponent(actionId));const action=await actionResponse.json();
  if(!actionResponse.ok)throw Error('This commissioned record is unavailable.');
  const result=action.result || action.action?.result;
  if(action.status !== 'succeeded' || !result?.match){status('This commissioned record is not complete yet. Reload this link later to check its status.');return;}
  record=action;match=result.match;elapsed=0;currentFrame=-1;
  $('arena-scrub').max=String(match.frames.length-1);
  for(const id of ['arena-play','arena-restart','arena-scrub','arena-download'])$(id).disabled=false;
  $('arena-result').textContent=match.winner==='draw'?'A drawn exhibition.':`${catalog.gangs.find(g=>g.id===match.input[match.winner].gang)?.name || match.winner} take the exhibition!`;
  $('arena-proof').textContent=`Commissioned server-run record · ${actionId} · ${match.rulesVersion} · Match hash: ${result.matchHash || 'not supplied'}`;
  status('Commissioned record loaded. Press Play replay to watch.');draw(0);toggle(false);
}}catch(err){status(err.message);}})();
