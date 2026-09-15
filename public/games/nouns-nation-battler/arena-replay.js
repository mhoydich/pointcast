/** One replay renderer for practice, commissioned records and published exhibitions. */
export function createArenaReplay(root = document) {
const $ = id => root.querySelector('#'+id);
const canvas = $('arena-canvas'), ctx = canvas.getContext('2d');
const controller = new AbortController();
const options = { signal: controller.signal };
let catalog, record, match, playing = false, elapsed = 0, previous = 0, currentFrame = -1;
let frameRequest = 0, destroyed = false;
const sprites = Array.from({length:60},(_,i)=>{const image=new Image();image.onload=()=>{if(!destroyed&&!playing&&match)draw(Math.max(0,currentFrame));};image.src='/games/nouns-nation-battler/assets/noun-'+i+'.svg';return image;});
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

function toggle(value) {
  playing = Boolean(value && match); previous = 0;
  $('arena-play').textContent = playing ? 'Pause' : 'Play replay';
  cancelAnimationFrame(frameRequest);
  if (playing) frameRequest = requestAnimationFrame(animate);
}
function animate(time) {
  if (!playing || destroyed) return;
  if (previous) elapsed += (time - previous) * Number($('arena-speed').value);
  previous = time;
  const tick = elapsed / match.tickMs;
  let index = match.frames.findIndex(frame => frame.tick > tick);
  index = index < 0 ? match.frames.length - 1 : Math.max(0, index - 1);
  draw(index);
  if (elapsed >= match.durationMs) { draw(match.frames.length - 1); toggle(false); }
  else frameRequest = requestAnimationFrame(animate);
}
$('arena-play').addEventListener('click', () => { if (!match) return; if (elapsed >= match.durationMs) elapsed = 0; toggle(!playing); }, options);
$('arena-restart').addEventListener('click', () => { if (!match) return; elapsed = 0; toggle(false); draw(0); }, options);
$('arena-speed').addEventListener('change', () => { previous = 0; }, options);
$('arena-scrub').addEventListener('input', () => { if (!match) return; toggle(false); const index = Number($('arena-scrub').value); elapsed = match.frames[index].tick * match.tickMs; draw(index); }, options);
$('arena-download').addEventListener('click', () => {
  if (!record) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `nouns-exhibition-${match.input.seed}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}, options);
draw(0);
return {
  load(data, matchCatalog, autoplay = false) {
    const nextMatch = data.match || data.result?.match || data.action?.result?.match;
    if (!nextMatch?.frames?.length || !nextMatch?.units?.length) throw Error('The replay record is incomplete.');
    toggle(false); record = data; match = nextMatch; catalog = matchCatalog;
    elapsed = 0; currentFrame = -1;
    $('arena-scrub').max = String(match.frames.length - 1);
    for (const id of ['arena-play','arena-restart','arena-scrub','arena-download']) $(id).disabled = false;
    draw(0); toggle(autoplay && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  },
  destroy() { destroyed = true; toggle(false); controller.abort(); for (const sprite of sprites) sprite.onload = null; },
};
}
