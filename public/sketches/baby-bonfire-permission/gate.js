'use strict';
const $=id=>document.getElementById(id);
const film=$('film'),crackle=$('crackle'),bowl=$('bowl'),motion=$('motion'),sound=$('sound');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
motion.checked=!reduced.matches;sound.checked=false;crackle.volume=.25;bowl.volume=.3;
let active=false,drag=null,suppressClick=false,epoch=0;
const stopMedia=()=>{film.pause();crackle.pause();bowl.pause();};
function reset(){epoch++;active=false;stopMedia();$('choices').hidden=false;$('gate').hidden=false;$('active').hidden=true;$('title').textContent='Let a little fire in?';$('step').textContent='01 / ARRIVE';$('description').textContent='A moving flame. A soft crackle. Nothing starts until you say so.';$('thumb').style.setProperty('--x','0px');}
async function begin(silent=false){if(active)return;const run=++epoch;active=true;$('choices').hidden=true;$('gate').hidden=true;$('active').hidden=false;$('title').textContent='You can just be here.';$('step').textContent='02 / YOUR MINUTE';$('description').textContent='Nothing to finish. Nothing to prove.';if(silent){motion.checked=false;sound.checked=false;}$('status').textContent='Your quiet moment is open.';$('stop').focus();const pending=[];
if(motion.checked&&!reduced.matches){if(!film.src)film.src='https://pointcast.xyz/baby-bonfire/prayer/media/hearth-loop.mp4';pending.push(film.play().catch(()=>{if(epoch===run)$('status').textContent='The still ember is here. Video could not play.';}));}
if(sound.checked)pending.push(crackle.play().catch(()=>{if(epoch===run)$('status').textContent='Sound could not start. You can still enjoy the quiet.';}));await Promise.all(pending);if(epoch!==run||!active||document.hidden)stopMedia();}
$('thumb').addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}begin();});
$('thumb').addEventListener('pointerdown',e=>{if(e.button!==0||active)return;drag={id:e.pointerId,start:e.clientX,max:Math.max(1,$('swipe').clientWidth-58),x:0};$('thumb').setPointerCapture(e.pointerId);});
$('thumb').addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;drag.x=Math.min(drag.max,Math.max(0,e.clientX-drag.start));$('thumb').style.setProperty('--x',drag.x+'px');});
function release(e,cancel=false){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;suppressClick=cancel||d.x>6;$('thumb').style.setProperty('--x','0px');if(!cancel&&d.x>=d.max*.9)begin();setTimeout(()=>{suppressClick=false;},0);}
$('thumb').addEventListener('pointerup',e=>release(e));$('thumb').addEventListener('pointercancel',e=>release(e,true));$('thumb').addEventListener('lostpointercapture',e=>{if(drag)release(e,true);});
$('silent').addEventListener('click',()=>begin(true));$('decline').addEventListener('click',()=>{reset();$('description').textContent='All good. Nothing started. Come back whenever you like.';});$('stop').addEventListener('click',()=>{reset();$('thumb').focus();});
$('bell').addEventListener('click',()=>{if(!active)return;bowl.pause();bowl.currentTime=0;bowl.play().catch(()=>{$('status').textContent='The bowl could not play. Your quiet moment is still here.';});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMedia();if(active)$('status').textContent='Paused while away. End this moment and begin again when ready.';}});window.addEventListener('pagehide',reset);reduced.addEventListener('change',()=>{if(reduced.matches){motion.checked=false;film.pause();}});
