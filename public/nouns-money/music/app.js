import { NOTES, TRACKS, PRESETS, REGIONAL_NOTE_IDS } from './catalog.js';
import { MoneyEngine, renderPatternWav } from './audio.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'nouns-money-maker-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const engine = new MoneyEngine({volume:.65});
const notesById = new Map(NOTES.map(note=>[note.id,note]));
let state = {version:1, pattern:clone(PRESETS[0].pattern), tempo:PRESETS[0].tempo, swing:PRESETS[0].swing, volume:.65, noteIds:TRACKS.map(t=>t.noteId), muted:Array(8).fill(false), preset:PRESETS[0].id};
let previous = null, playing = false, starting = false, intent=0, timer=null, nextStep=0, nextTime=0, visualQueue=[], currentStep=-1, raf=null, toastTimer, savedTimer;
const padTimers = new Map();
const PENTATONIC = [1, 1.189207, 1.33484, 1.498307, 1.781797];
const clamp = (x,a,b)=>Math.min(b,Math.max(a,x));
function validate(raw){
  if(!raw || raw.version!==1 || !Array.isArray(raw.pattern) || raw.pattern.length!==8 || raw.pattern.some(r=>!Array.isArray(r)||r.length!==16||r.some(x=>typeof x!=='boolean'))) throw new Error('That file is not a Money Maker loop.');
  if(!Array.isArray(raw.noteIds)||raw.noteIds.length!==8||raw.noteIds.some(id=>!notesById.has(id))) throw new Error('This loop contains an unknown currency.');
  if(!Array.isArray(raw.muted)||raw.muted.length!==8||raw.muted.some(x=>typeof x!=='boolean')) throw new Error('Invalid mute settings.');
  for(const key of ['tempo','swing','volume']) if(typeof raw[key]!=='number'||!Number.isFinite(raw[key]))throw new Error('Invalid loop controls.');
  return {version:1,pattern:clone(raw.pattern),noteIds:[...raw.noteIds],muted:[...raw.muted],tempo:clamp(Math.round(raw.tempo),60,160),swing:clamp(raw.swing,0,.45),volume:clamp(raw.volume,0,1),preset:PRESETS.some(p=>p.id===raw.preset)?raw.preset:'custom'};
}
function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3400);}
function remember(){previous=clone(state);$('undo').disabled=false;}
function persist(){clearTimeout(savedTimer);savedTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$('save-state').textContent='SAVED ON THIS DEVICE · YOUR LOOP IS READY WHEN YOU ARE';}catch{$('save-state').textContent='LOCAL SAVE UNAVAILABLE · USE SAVE LOOP TO KEEP YOUR WORK';}},160);}
function custom(){state.preset='custom';$('preset').value='custom';persist();}
function pitchFor(row){const id=state.noteIds[row];const base=TRACKS[row].pitch;const offset=(Number(id)-Number(TRACKS[row].noteId)+25)%5;return Math.min(2,base*PENTATONIC[offset]);}
function noteFor(row){return notesById.get(state.noteIds[row]);}
function flash(row){const pad=$('pad-'+row);clearTimeout(padTimers.get(row));pad.classList.add('hit');padTimers.set(row,setTimeout(()=>pad.classList.remove('hit'),105));}
function status(text){$('audio-state').textContent=text;}
async function fire(row){
  const ticket=intent;
  try{await engine.unlock();if(ticket!==intent||document.hidden)return;engine.setVolume(state.volume);engine.trigger(TRACKS[row].id,{velocity:.9,pitch:pitchFor(row)});flash(row);if(!playing)status('SOUND READY · TAP NOTES TO PLAY');animate();}
  catch(error){toast(error.message);status('TAP AGAIN TO ENABLE SOUND');}
}
function syncControls(){
 $('tempo').value=state.tempo;$('tempo-value').textContent=state.tempo+' BPM';$('swing').value=Math.round(state.swing*100);$('swing-value').textContent=Math.round(state.swing*100)+'%';$('volume').value=Math.round(state.volume*100);$('volume-value').textContent=Math.round(state.volume*100)+'%';$('preset').value=state.preset;engine.setVolume(state.volume);
}
function buildPads(){
 $('pads').replaceChildren();
 TRACKS.forEach((track,row)=>{
  const note=noteFor(row),shell=document.createElement('article');shell.className='pad-shell'+(state.muted[row]?' muted':'');shell.id='shell-'+row;shell.style.setProperty('--accent',note.accent);
  const pad=document.createElement('button');pad.className='pad';pad.id='pad-'+row;pad.type='button';pad.setAttribute('aria-label',`Play ${track.label}: ${note.title}. Key ${track.key}`);
  const img=document.createElement('img');img.src=note.image;img.alt=note.title+' currency';img.width=960;img.height=480;img.draggable=false;img.loading=row>3?'lazy':'eager';pad.append(img);
  const key=document.createElement('span');key.className='key';key.textContent=track.key.toUpperCase();key.setAttribute('aria-hidden','true');pad.append(key);pad.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();pad.focus({preventScroll:true});fire(row);});pad.addEventListener('click',e=>{if(e.detail===0)fire(row);});
  const meta=document.createElement('div');meta.className='pad-meta';const title=document.createElement('strong');title.textContent=track.label;meta.append(title);
  const mute=document.createElement('button');mute.className='mute';mute.type='button';mute.textContent='MUTE';mute.setAttribute('aria-label','Mute '+track.label);mute.setAttribute('aria-pressed',String(state.muted[row]));mute.addEventListener('click',()=>{remember();state.muted[row]=!state.muted[row];if(state.muted[row])engine.stopVoice(TRACKS[row].id);mute.setAttribute('aria-pressed',String(state.muted[row]));shell.classList.toggle('muted',state.muted[row]);$('seq-row-'+row).classList.toggle('muted',state.muted[row]);custom();});meta.append(mute);
  const select=document.createElement('select');select.className='currency-select';select.setAttribute('aria-label','Currency for '+track.label);NOTES.forEach(n=>{const o=document.createElement('option');o.value=n.id;o.textContent=n.id+' / '+n.title;select.append(o);});select.value=note.id;select.addEventListener('change',()=>{remember();state.noteIds[row]=select.value;const n=noteFor(row);img.src=n.image;img.alt=n.title+' currency';shell.style.setProperty('--accent',n.accent);$('seq-row-'+row).style.setProperty('--accent',n.accent);pad.setAttribute('aria-label',`Play ${track.label}: ${n.title}. Key ${track.key}`);custom();fire(row);});
  shell.append(pad,meta,select);$('pads').append(shell);
 });
}
function buildSequencer(){
 $('sequencer').replaceChildren();const numbers=document.createElement('div');numbers.className='seq-row seq-numbers';numbers.append(document.createElement('span'));for(let step=0;step<16;step++){const n=document.createElement('span');n.textContent=String(step+1).padStart(2,'0');if(step%4===0)n.className='downbeat';numbers.append(n);}$('sequencer').append(numbers);
 TRACKS.forEach((track,row)=>{const line=document.createElement('div');line.id='seq-row-'+row;line.className='seq-row'+(state.muted[row]?' muted':'');line.style.setProperty('--accent',noteFor(row).accent);const label=document.createElement('button');label.type='button';label.className='seq-label';const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');label.append(dot,document.createTextNode(track.label));label.setAttribute('aria-label','Preview '+track.label);label.addEventListener('click',()=>fire(row));line.append(label);
 for(let step=0;step<16;step++){const button=document.createElement('button');button.type='button';button.className='step'+(step%4===0?' bar-start':'');button.id=`step-${row}-${step}`;button.dataset.step=step;button.setAttribute('aria-label',`${track.label}, step ${step+1}`);button.setAttribute('aria-pressed',String(state.pattern[row][step]));button.addEventListener('click',()=>{remember();state.pattern[row][step]=!state.pattern[row][step];button.setAttribute('aria-pressed',String(state.pattern[row][step]));custom();});line.append(button);}$('sequencer').append(line);
 });
}
function repaint(){syncControls();buildPads();buildSequencer();}
function schedule(){
 if(!playing||engine.context?.state!=='running')return;
 const now=engine.context.currentTime;
 if(nextTime<now-.15)nextTime=now+.02;
 while(nextTime<now+.085){
  const step=nextStep,seconds=60/state.tempo/4,time=nextTime+(step%2?state.swing*seconds:0),rows=[];
  TRACKS.forEach((track,row)=>{if(state.pattern[row][step]&&!state.muted[row]){engine.trigger(track.id,{time,pitch:pitchFor(row),velocity:step%4===0?.95:.8,seed:((row+1)*73856093)^((step+1)*19349663)});rows.push(row);}});
  visualQueue.push({time,step,rows});nextTime+=seconds;nextStep=(step+1)%16;
 }
}
function drawMeter(){const c=$('meter').getContext('2d');c.clearRect(0,0,120,28);const samples=new Uint8Array(64);if(engine.analyser)engine.analyser.getByteFrequencyData(samples);for(let i=0;i<20;i++){const h=Math.max(2,Math.pow((samples[i*2]||0)/255,.8)*25);c.fillStyle=i>15?'#dca566':'#b9c79a';c.fillRect(i*6,28-h,3,h);}}
function animate(){
 if(raf)return;
 function frame(){raf=null;
  if(engine.context){const now=engine.context.currentTime;while(visualQueue.length&&visualQueue[0].time<=now){const e=visualQueue.shift();if(currentStep>=0)document.querySelectorAll(`[data-step="${currentStep}"]`).forEach(el=>el.classList.remove('current'));currentStep=e.step;document.querySelectorAll(`[data-step="${currentStep}"]`).forEach(el=>el.classList.add('current'));$('step-counter').textContent=String(currentStep+1).padStart(2,'0')+' / 16';e.rows.forEach(flash);}}
  drawMeter();if(playing||engine.activeSourceCount>0)raf=requestAnimationFrame(frame);
 }raf=requestAnimationFrame(frame);
}
function stop(announce=false){intent++;playing=false;starting=false;clearInterval(timer);timer=null;engine.stopAll();visualQueue=[];currentStep=-1;document.querySelectorAll('.step.current').forEach(e=>e.classList.remove('current'));$('play').setAttribute('aria-pressed','false');$('play-label').textContent='Play the money';$('play-symbol').textContent='▶';$('status-dot').classList.remove('running');$('step-counter').textContent='01 / 16';status(engine.context?'PAUSED · YOUR CHANGE IS SAFE':'TAP PLAY OR A NOTE TO BEGIN');if(announce)toast('Playback paused while this page is hidden.');}
async function toggle(){
 if(playing||starting){stop();return;}const ticket=++intent;starting=true;$('play-label').textContent='Preparing the till…';$('play-symbol').textContent='·';status('GETTING YOUR CHANGE READY');
 try{await engine.unlock();if(ticket!==intent||document.hidden)return;const readyPattern=clone(state.pattern),readyPitches=TRACKS.map((_,i)=>pitchFor(i));await engine.preparePattern({pattern:readyPattern,voices:TRACKS.map(t=>t.id),pitches:readyPitches});if(ticket!==intent||document.hidden)return;starting=false;engine.context.onstatechange=()=>{if(playing&&engine.context.state!=='running')stop();};engine.setVolume(state.volume);playing=true;nextStep=0;nextTime=engine.context.currentTime+.055;$('play').setAttribute('aria-pressed','true');$('play-label').textContent='Pause the groove';$('play-symbol').textContent='Ⅱ';$('status-dot').classList.add('running');status('THE TILL IS SINGING');schedule();timer=setInterval(schedule,25);animate();}
 catch(error){stop();toast(error.message);}
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function apply(newState){stop();state=validate(newState);repaint();persist();}
function loadInitial(){
 try{if(location.hash.startsWith('#loop=')){const token=location.hash.slice(6);if(token.length>12000)throw new Error('Loop link is too large.');const data=JSON.parse(atob(token.replace(/-/g,'+').replace(/_/g,'/')));state=validate(data);toast('Shared loop loaded. Press Play to hear it.');return;}}catch{toast('That loop link could not be loaded. Starting with Pocket Change.');}
 try{const saved=localStorage.getItem(STORAGE_KEY);if(saved)state=validate(JSON.parse(saved));}catch{}
}
PRESETS.forEach(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.name;$('preset').append(option);});const customOption=document.createElement('option');customOption.value='custom';customOption.textContent='Your own change';customOption.disabled=true;$('preset').append(customOption);
loadInitial();repaint();
$('play').addEventListener('click',toggle);
$('apply-regionals').addEventListener('click',()=>{remember();apply({...state,noteIds:[...REGIONAL_NOTE_IDS],preset:'custom'});toast('Eight regional notes loaded. Your rhythm stays in place. Press Play to hear them, or Undo to return.');});
['tempo','swing','volume'].forEach(id=>{let changing=false;$(id).addEventListener('input',()=>{if(!changing){remember();changing=true;}state[id]=Number($(id).value)/(id==='tempo'?1:100);syncControls();custom();});$(id).addEventListener('change',()=>changing=false);});
$('preset').addEventListener('change',()=>{const p=PRESETS.find(p=>p.id===$('preset').value);if(!p)return;remember();const running=playing;apply({...state,pattern:clone(p.pattern),tempo:p.tempo,swing:p.swing,muted:Array(8).fill(false),preset:p.id});if(running)toggle();toast(p.name+' loaded. '+p.description);});
$('clear').addEventListener('click',()=>{remember();stop();state.pattern=Array.from({length:8},()=>Array(16).fill(false));custom();buildSequencer();toast('A clean slate. Tap steps to build, or Undo to bring it back.');});
$('undo').addEventListener('click',()=>{if(!previous)return;const restored=previous;previous=null;apply(restored);$('undo').disabled=true;toast('Your last change is back.');});
$('remix').addEventListener('click',()=>{remember();const base=clone(PRESETS[Math.floor(Math.random()*PRESETS.length)].pattern);for(let row=0;row<8;row++){for(let step=0;step<16;step++){if((row!==1&&row!==7||step%4!==0)&&Math.random()<.1)base[row][step]=!base[row][step];}}state.pattern=base;custom();buildSequencer();toast('Fresh change. Press Play, or Undo to return to your loop.');});
$('export').addEventListener('click',async()=>{
 if(!state.pattern.some((r,i)=>!state.muted[i]&&r.some(Boolean))){toast('Add an unmuted step before exporting.');return;}
 stop();const button=$('export');button.disabled=true;button.textContent='Rendering your WAV…';
 try{await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));const snapshot=clone(state);const blob=await renderPatternWav({pattern:snapshot.pattern.map((r,i)=>snapshot.muted[i]?r.map(()=>false):r),voices:TRACKS.map(t=>t.id),pitches:TRACKS.map((_,i)=>pitchFor(i)),tempo:snapshot.tempo,swing:snapshot.swing,volume:snapshot.volume,bars:4});download(blob,`nouns-money-${snapshot.tempo}bpm.wav`);toast('Four bars of money music exported as a stereo WAV.');}
 catch(error){toast('Could not export: '+error.message);}finally{button.disabled=false;button.innerHTML='<span aria-hidden="true">↗</span> Export WAV';}
});
$('save-loop').addEventListener('click',()=>{download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'nouns-money-loop.json');toast('Loop saved. Load it here any time.');});
$('load-loop').addEventListener('click',()=>$('load-file').click());$('load-file').addEventListener('change',async()=>{const file=$('load-file').files[0];if(!file)return;try{if(file.size>100000)throw new Error('Choose a Money Maker JSON file under 100 KB.');const checked=validate(JSON.parse(await file.text()));remember();apply(checked);toast('Loop loaded. Press Play to hear it.');}catch(error){toast(error.message);}finally{$('load-file').value='';}});
$('share').addEventListener('click',async()=>{if(location.protocol==='file:'){toast('Use Save loop for this offline copy. Loop links work on the hosted instrument.');return;}const token=btoa(JSON.stringify(state)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const url=location.origin+location.pathname+'#loop='+token;try{await navigator.clipboard.writeText(url);toast('Loop link copied. Share your pattern and currencies.');}catch{$('share-url').value=url;$('link-dialog').showModal();$('share-url').select();}});
window.addEventListener('keydown',event=>{const tag=event.target.tagName;if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||['INPUT','SELECT','TEXTAREA'].includes(tag)||$('link-dialog').open)return;const row=TRACKS.findIndex(t=>t.key.toLowerCase()===event.key.toLowerCase());if(row>=0){event.preventDefault();fire(row);}else if(event.code==='Space'&&!['BUTTON','A'].includes(tag)){event.preventDefault();toggle();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){const wasPlaying=playing;stop(wasPlaying);}});
window.addEventListener('pagehide',()=>stop());
// Read-only instrumentation for diagnostics; no user data leaves the page.
window.moneyMaker={getState:()=>clone(state),getAudioStats:()=>engine.stats,get playing(){return playing;},get currentStep(){return currentStep;}};
