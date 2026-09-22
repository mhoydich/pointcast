import SONGS from '../data/bell-choir-songs.json';
import { frequencies, buildTimeline, detectPitch, pitchLabel } from '../lib/karaoke.mjs';

const $ = id => document.getElementById(id);
const modes = {solo:['Joy','Rhythm','Energy','Courage'],group:['Joy','Rhythm','Energy','Togetherness']};
let chosen = 0, mode = 'solo', running = false, runId = 0, clock, frame;
let bellContext, master, bus, origin = 0, timeline, scheduled = 0, displayed = -1, lastLine = -1;
const oscillators = new Set();
let micStream, micContext, micSource, analyser, micFrame, micRequestId = 0, micPending = false, pitches = [];
let pendingMicCleanup, lastPitchAnnouncement = 0, announcedPitch = '';
let lastAnalysis = 0, ratings = {}, completed = false, toastTimer;
const toast = message => { $('toast').textContent=message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500); };
function host(text) { $('shwa-line').textContent = `“${text}”`; }
function updateTempo() { $('bpm').textContent = `${Math.round(SONGS[chosen].bpm * Number($('pace').value))} BPM`; }
function resetRatings() {
  ratings = {}; completed = false; $('after-song').hidden=true; $('award').hidden=true;
  $('rating-title').textContent=mode==='group'?'How did the chorus feel?':'How did practice feel?';
  $('rating-note').textContent=mode==='group'?'Choose together on this screen. These are your impressions, not a score of anyone’s voice.':'Choose your own flowers. These are impressions, not a score of your voice.';
  $('rating-result').textContent='Choose flowers for each feeling, or simply sing again.';
  $('save-rating').disabled=true; $('save-rating').textContent='Keep these flowers on this screen';
  $('ratings').replaceChildren(...modes[mode].map(name=>{
    const field=document.createElement('fieldset'),legend=document.createElement('legend'),value=document.createElement('span');
    legend.textContent=name; field.append(legend); value.className='rating-value'; value.textContent='Not rated yet';
    for(let n=1;n<=5;n++) { const button=document.createElement('button');button.className='flower-choice';button.textContent=String(n);button.setAttribute('aria-label',`${name}: ${n} ${n===1?'flower':'flowers'}`);button.setAttribute('aria-pressed','false');button.onclick=()=>{
      if(!completed)return; ratings[name]=n;field.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));value.textContent=`${n} / 5`; $('save-rating').disabled=Object.keys(ratings).length!==modes[mode].length;
      $('save-rating').textContent='Keep these flowers on this screen';$('award').hidden=true;$('rating-result').textContent='Your flowers are ready when you are.';
    };field.append(button); }field.append(value);return field;
  }));
  document.querySelectorAll('.reaction').forEach(b=>{b.querySelector('b').textContent='0';b.setAttribute('aria-label',`${b.dataset.label}: 0`);});
}
function stopPlayback() {
  runId++; running=false;clearInterval(clock);cancelAnimationFrame(frame);clock=undefined;frame=undefined;
  for(const oscillator of oscillators){try{oscillator.stop();}catch{}}oscillators.clear();
  if(bus){bus.disconnect();bus=null;}
  $('start').disabled=false;$('stop').disabled=true;$('pace').disabled=false;
}
function paintLine(lineIndex,word=-1) {
  const line=SONGS[chosen].lines[lineIndex];
  $('lyrics').replaceChildren(...line.words.map((wordText,i)=>{const span=document.createElement('span');span.textContent=wordText;span.className=i<word?'past':i===word?'now':'';return span;}));
  $('next').textContent=SONGS[chosen].lines[lineIndex+1]?.words.join(' ')||'Let the last note find its way.';
  if(lastLine!==lineIndex){$('line-announcement').textContent=line.words.join(' ');lastLine=lineIndex;}
}
function resetStage() {
  stopPlayback();resetRatings();lastLine=-1;paintLine(0);$('progress').value=0;
  $('song-label').textContent=SONGS[chosen].title.toUpperCase();$('status').textContent='READY WHEN YOU ARE';$('start').textContent='Sing with the bells';
  $('player-note').textContent='Four beats to breathe, then follow the underlined word.';
  $('songbook').replaceChildren(...SONGS[chosen].lines.map(line=>{const p=document.createElement('p');p.textContent=line.words.join(' ');return p;}));
  document.querySelectorAll('[data-song]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.song)===chosen)));
  host(mode==='group'?'One screen, all your voices. The bells will show the way.':'A hum counts. You don’t have to earn your place in the chorus.'); updateTempo();
}
function ring(note,at,volume,duration=.7) {
  const osc=bellContext.createOscillator(),gain=bellContext.createGain();osc.type='sine';osc.frequency.value=frequencies[note];
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+Math.min(1.7,Math.max(.2,duration)));
  osc.connect(gain).connect(bus);oscillators.add(osc);osc.onended=()=>{oscillators.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+Math.min(1.7,Math.max(.2,duration))+.025);
}
async function start() {
  stopPlayback();stopMic();resetRatings();const token=runId;$('start').disabled=true;
  try {
    if(!bellContext||bellContext.state==='closed'){bellContext=new AudioContext();master=bellContext.createGain();master.connect(bellContext.destination);}
    await bellContext.resume();if(token!==runId)return;if(document.hidden){stopPlayback();return;}
    if(bellContext.state!=='running')throw new Error('audio suspended');
    master.gain.value=Number($('volume').value)*.38;bus=bellContext.createGain();bus.connect(master);
    timeline=buildTimeline(SONGS[chosen],Number($('pace').value));origin=bellContext.currentTime+.12;scheduled=0;displayed=-1;lastLine=-1;running=true;
    $('stop').disabled=false;$('pace').disabled=true;$('start').textContent='Singing…';$('player-note').textContent='Pace is held steady for this song. Stop to change it.';
    host(mode==='group'?'Find a little space for every voice. Four beats, then we begin.':'Take a breath. Follow the bells at your own volume.');
    const schedule=()=>{if(!running||token!==runId)return;while(scheduled<timeline.events.length&&origin+timeline.events[scheduled].time<bellContext.currentTime+.12){const event=timeline.events[scheduled++];ring(event.note,Math.max(bellContext.currentTime,origin+event.time),event.volume,event.duration);}};
    const draw=()=>{
      if(!running||token!==runId)return;if(bellContext.state!=='running'){stopPlayback();$('status').textContent='AUDIO PAUSED · TAP TO BEGIN AGAIN';return;}
      const elapsed=bellContext.currentTime-origin;$('progress').value=Math.max(0,Math.min(1,elapsed/timeline.total));let next=displayed;
      while(next+1<timeline.events.length&&timeline.events[next+1].time<=elapsed)next++;
      if(next!==displayed&&next>=0){displayed=next;const event=timeline.events[next];if(event.count){$('lyrics').textContent=String(event.count);$('next').textContent=SONGS[chosen].lines[0].words.join(' ');$('status').textContent=`COUNT IN · ${event.count}`;}else{paintLine(event.line,event.word);if($('status').textContent!=='SING ALONG')$('status').textContent='SING ALONG';}}
      if(elapsed>=timeline.total){finish();return;}frame=requestAnimationFrame(draw);
    };schedule();clock=setInterval(schedule,25);frame=requestAnimationFrame(draw);
  } catch { if(token===runId){stopPlayback();$('status').textContent='SOUND COULD NOT START';$('player-note').textContent='Tap Sing with the bells to try again. The full lyrics are below.';} }
}
function finish() {
  stopPlayback();completed=true;$('progress').value=1;$('lyrics').textContent='Thank you for your voice.';$('next').textContent='A little more yours each time.';$('status').textContent='SONG COMPLETE';$('start').textContent='Sing it again';$('after-song').hidden=false;
  $('line-announcement').textContent='Song complete. Optional flowers and reactions are below.';
  host('You made room for a song. Give yourself a little kindness before the next one.');$('player-note').textContent='Try a different pace, practice a note, or leave a few flowers below.';
}
function stopMic() {
  micRequestId++;micPending=false;cancelAnimationFrame(micFrame);micFrame=undefined;
  pendingMicCleanup?.();pendingMicCleanup=null;
  if(micStream)micStream.getTracks().forEach(track=>track.stop());micStream=null;
  micSource?.disconnect();analyser?.disconnect();micSource=null;analyser=null;
  if(micContext)void micContext.close().catch(()=>{});micContext=null;pitches=[];announcedPitch='';lastPitchAnnouncement=0;
  $('mic').setAttribute('aria-pressed','false');$('mic').textContent='Enable private pitch practice';$('pitch-note').textContent='—';$('pitch-detail').textContent='Microphone off';$('pitch-meter').hidden=true;
  $('mic-status').textContent='Mic audio stays in this tab. No recording, upload, or saved pitch history.';
  $('pitch-announcement').textContent='';
}
async function toggleMic() {
  if(micStream||micPending){stopMic();return;}
  if(!navigator.mediaDevices?.getUserMedia){$('mic-status').textContent='Microphone practice is unavailable in this browser. You can still sing with the bells.';return;}
  const bellsWereRunning=running;stopPlayback();
  if(bellsWereRunning){$('status').textContent='BELLS STOPPED FOR PITCH PRACTICE';$('start').textContent='Sing with the bells';}
  const token=++micRequestId;micPending=true;$('mic').textContent='Cancel microphone request';$('mic-status').textContent='Waiting for microphone permission. The audio will stay in this tab.';
  let acquired, context, source, detector;
  const cleanup=()=>{acquired?.getTracks().forEach(t=>t.stop());source?.disconnect();detector?.disconnect();if(context&&context.state!=='closed')void context.close().catch(()=>{});};
  try {
    acquired=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    if(token!==micRequestId||document.hidden){cleanup();return;}
    context=new AudioContext();pendingMicCleanup=cleanup;await context.resume();
    if(token!==micRequestId||document.hidden){cleanup();return;}
    if(context.state!=='running')throw new Error('microphone audio suspended');
    detector=context.createAnalyser();detector.fftSize=2048;source=context.createMediaStreamSource(acquired);source.connect(detector);
    micStream=acquired;micContext=context;micSource=source;analyser=detector;pendingMicCleanup=null;
    micPending=false;$('mic').setAttribute('aria-pressed','true');$('mic').textContent='Stop private pitch practice';$('mic-status').textContent='Microphone active · processed only in this tab. Hum one steady note.';
    acquired.getTracks().forEach(t=>t.onended=()=>{if(token===micRequestId)stopMic();});
    const samples=new Float32Array(analyser.fftSize);lastAnalysis=0;
    const analyse=now=>{if(token!==micRequestId||!analyser)return;if(now-lastAnalysis>110){lastAnalysis=now;analyser.getFloatTimeDomainData(samples);const pitch=detectPitch(samples,context.sampleRate);
      if(pitch){pitches.push(pitch.frequency);if(pitches.length>3)pitches.shift();const stable=pitches.length===3&&Math.max(...pitches)/Math.min(...pitches)<1.025;
        if(stable){const measured=[...pitches].sort((a,b)=>a-b)[1],label=pitchLabel(measured);$('pitch-note').textContent=label.note;$('pitch-detail').textContent=`${Math.round(measured)} Hz · ${label.cents>0?'+':''}${label.cents} cents`;$('pitch-meter').hidden=false;$('pitch-meter').value=label.cents;
          if(label.note!==announcedPitch&&now-lastPitchAnnouncement>1500){$('pitch-announcement').textContent=`Nearest note ${label.note}, ${Math.abs(label.cents)} cents ${label.cents<0?'low':'high'}.`;announcedPitch=label.note;lastPitchAnnouncement=now;}
        }else{$('pitch-note').textContent='—';$('pitch-detail').textContent='Finding a steady note…';$('pitch-meter').hidden=true;}
      }else{pitches=[];$('pitch-note').textContent='—';$('pitch-detail').textContent='No clear note yet';$('pitch-meter').hidden=true;}
    }micFrame=requestAnimationFrame(analyse);};micFrame=requestAnimationFrame(analyse);
  }catch{cleanup();if(token===micRequestId){stopMic();$('mic-status').textContent='Microphone stayed off. Check permission to try again; singing still works.';}}
}
document.querySelectorAll('[data-song]').forEach(b=>b.onclick=()=>{stopMic();chosen=Number(b.dataset.song);resetStage();history.replaceState(null,'',`#${SONGS[chosen].id}`);});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
  stopMic();mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('presence').textContent=mode==='group'?'TOGETHER · ONE SCREEN':'SOLO PRACTICE';$('group-size-wrap').hidden=mode!=='group';
  $('mode-note').textContent=mode==='group'?'Sing with friends around this device. Everyone follows the same screen and gives flowers together.':'A private practice on this screen. Hum first; the words will be waiting.';
  $('singer-label').textContent=mode==='group'?'SAME ROOM · SAME CHORUS':'YOUR VOICE · YOUR PACE';resetStage();
});
$('group-size').onchange=()=>toast(`${$('group-size').value} singers around this screen`);
$('start').onclick=start;$('stop').onclick=()=>{stopPlayback();$('start').textContent='Sing with the bells';$('status').textContent='REST A MOMENT';$('player-note').textContent='Change the pace or begin again when you’re ready.';};$('restart').onclick=()=>{stopMic();resetStage();};$('pace').onchange=updateTempo;
$('volume').oninput=()=>{if(master)master.gain.setTargetAtTime(Number($('volume').value)*.38,bellContext.currentTime,.025);};$('mic').onclick=toggleMic;
$('save-rating').onclick=()=>{if(!completed||modes[mode].some(name=>!ratings[name]))return;const average=(Object.values(ratings).reduce((a,b)=>a+b,0)/modes[mode].length).toFixed(1);$('rating-result').textContent=`Your reflection: ${average} / 5 flowers. Kept on this screen until the next song or reload.`;$('award').textContent=mode==='solo'?'🌼 Showed up & sang':ratings.Togetherness>=4?'🌼 Found the harmony':'🌼 Made room for one more';$('award').hidden=false;$('save-rating').disabled=true;$('save-rating').textContent='Flowers kept here 🌼';};
document.querySelectorAll('.reaction').forEach(b=>b.onclick=()=>{const value=Number(b.querySelector('b').textContent)+1;b.querySelector('b').textContent=String(value);b.setAttribute('aria-label',`${b.dataset.label}: ${value}`);});
$('share').onclick=async()=>{const url=`${location.origin}/karaoke/#${SONGS[chosen].id}`;try{await navigator.clipboard.writeText(url);toast('Song link copied');}catch{toast(`Share this page: ${url}`);}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){const wasRunning=running;stopPlayback();stopMic();if(wasRunning){$('status').textContent='PAUSED WHILE YOU WERE AWAY';$('start').textContent='Sing with the bells';}}});
window.addEventListener('pagehide',()=>{stopPlayback();stopMic();clearTimeout(toastTimer);if(bellContext)void bellContext.close().catch(()=>{});bellContext=null;master=null;});
chosen=Math.max(0,SONGS.findIndex(song=>song.id===location.hash.slice(1)));resetStage();
