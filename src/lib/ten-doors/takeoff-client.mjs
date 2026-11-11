import { SCALE, NOTES, PLANS, MAX_PLANES, createSession, toRecord, launch, advance, setPaused, setMode, restartPlan, nextPlan } from './takeoff.mjs';
import { audio, out, hz, tone, typing, onControl } from './audio.mjs';
import { createTakeoffRenderer } from './takeoff-render.mjs';

const STORAGE = 'takeoff-organ:v2';
const AUTO_NOTES = [0,3,5,1,4,6,2,5,7,1,3,4];

/** Mount one instrument. Cleanup never preserves active planes or audio. */
export function mountTakeoff(root) {
  const doc=root.ownerDocument, win=doc.defaultView;
  const $=(id)=>root.querySelector(`#${id}`);
  const pads=[...root.querySelectorAll('[data-to-lane]')];
  const events=new win.AbortController();
  const on=(target,type,fn)=>target.addEventListener(type,fn,{signal:events.signal});
  const motion=win.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer=createTakeoffRenderer($('to-sky'));
  let saved;
  try {saved=JSON.parse(win.localStorage.getItem(STORAGE)||'null');}catch{}
  let state=createSession(saved), soundOn=false, auto=false, nextAuto=0, autoCursor=0;
  let frame=0,lastTime=0,visualTime=0,bursts=[],destroyed=false;
  const voices=new Map(), oneShots=new Set(), padTimers=new Map();
  const still=()=>motion.matches||!renderer.available;
  const say=(message)=>{$('to-status').textContent=message;};
  const persist=()=>{try{win.localStorage.setItem(STORAGE,JSON.stringify(toRecord(state)));}catch{/* Quiet/private browsing still plays. */}};

  function stopVoice(voice,quick=true) {
    if(!voice)return;
    if(quick){
      // Disconnect synchronously: a hidden tab may already have suspended the
      // context, so a scheduled fade would otherwise wait and sound on return.
      try{voice.gain.disconnect();}catch{}
      voice.oscs.forEach(o=>{try{o.stop();}catch{}});
      return;
    }
    try {
      if(voice.context.state!=='closed'){
        const t=voice.context.currentTime;
        voice.gain.gain.cancelScheduledValues(t);
        voice.gain.gain.setValueAtTime(Math.max(.0001,voice.gain.gain.value),t);
        voice.gain.gain.exponentialRampToValueAtTime(.0001,t+.5);
        voice.oscs.forEach(o=>{try{o.stop(t+.55);}catch{}});
      }
    }catch{}
  }
  function stopAll() {
    for(const voice of voices.values())stopVoice(voice);
    voices.clear();
    for(const voice of oneShots){try{voice.gain.disconnect();voice.osc.stop();}catch{}}
    oneShots.clear();
  }
  function soundUnavailable() {
    soundOn=false;stopAll();updateUi();
    say('Sound is unavailable here. Your notes and sky chords still work quietly.');
  }
  function playNote(plane) {
    if(!soundOn||doc.hidden||destroyed)return;
    try {
      const c=audio();if(!c){soundUnavailable();return;}
      while(voices.size>=MAX_PLANES){
        const [key,voice]=voices.entries().next().value;
        voice.oscs.forEach(o=>{try{o.stop();}catch{}});try{voice.gain.disconnect();}catch{}voices.delete(key);
      }
      const t=c.currentTime,hold=still()?1.35:Math.max(.25,(plane.durationMs-plane.ageMs)/1000);
      const gain=c.createGain();gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.065,t+.035);gain.gain.exponentialRampToValueAtTime(.042,t+.18);gain.gain.setValueAtTime(.042,t+hold);gain.gain.exponentialRampToValueAtTime(.0001,t+hold+.65);
      const oscs=[1,2,3].map((partial,i)=>{
        const o=c.createOscillator(),level=c.createGain();o.type=i===1?'triangle':'sine';o.frequency.value=hz(SCALE[plane.lane])*partial;
        level.gain.value=[1,.22,.10][i];o.connect(level);level.connect(gain);o.start(t);o.stop(t+hold+.72);return o;
      });
      gain.connect(out());const voice={context:c,gain,oscs};voices.set(plane.id,voice);
      oscs[0].addEventListener('ended',()=>{if(voices.get(plane.id)===voice)voices.delete(plane.id);},{once:true});
    }catch{soundUnavailable();}
  }
  function chime() {
    if(!soundOn||doc.hidden||destroyed)return;
    try {
      for(const old of oneShots){try{old.gain.disconnect();old.osc.stop();}catch{}}oneShots.clear();
      [74,77,81].forEach((m,i)=>{
        const voice=tone(hz(m),{type:'sine',attack:.02,length:.06,release:.55,gain:.025,when:i*.09});
        if(voice){oneShots.add(voice);voice.osc.addEventListener('ended',()=>oneShots.delete(voice),{once:true});}
      });
    }catch{soundUnavailable();}
  }
  function pulse(lane) {
    const button=pads[lane];win.clearTimeout(padTimers.get(lane));button.classList.add('is-lit');
    padTimers.set(lane,win.setTimeout(()=>{button.classList.remove('is-lit');padTimers.delete(lane);},220));
  }
  function updateUi() {
    const plan=PLANS[state.planIndex],guide=state.mode==='guide',complete=guide&&state.phase==='complete';
    root.dataset.mode=state.mode;root.dataset.phase=state.phase;root.dataset.paused=String(state.paused);root.dataset.inAir=String(state.planes.length);
    $('to-sound').setAttribute('aria-pressed',String(soundOn));$('to-sound').querySelector('[data-sound-label]').textContent=soundOn?'Sound on':'Sound off';
    $('to-pause').textContent=state.paused?'Resume':'Pause';
    $('to-guide-mode').setAttribute('aria-pressed',String(guide));$('to-free-mode').setAttribute('aria-pressed',String(!guide));
    $('to-auto').hidden=guide;$('to-auto').setAttribute('aria-pressed',String(auto));$('to-auto').textContent=auto?'Stop auto':'Auto fly';$('to-auto').disabled=state.paused;
    $('to-aircount').textContent=state.paused?'Sky paused':state.planes.length?`${state.planes.length} ${state.planes.length===1?'departure':'departures'} in the sky`:'Ready for takeoff';
    $('to-title').textContent=guide?complete?`${plan.title}, cleared` :plan.title:'The sky is yours';
    $('to-eyebrow').textContent=guide?complete?'Three departures clear':'A little sky chord':'Eight notes. Endless combinations.';
    $('to-hint').textContent=guide?complete?'Stay and play, replay this chord, or try another.':'Tap the three marked notes. Let them overlap.':'Choose any notes. Auto fly can play a gentle departure sequence.';
    $('to-title').closest('.to-guide').classList.toggle('is-complete',complete);
    $('to-next').hidden=!guide;$('to-next').disabled=!complete;
    $('to-next').firstChild.textContent=state.stamps.length===PLANS.length?'Another chord ':'Next chord ';
    $('to-goals').hidden=!guide;$('to-stamps').hidden=!guide;
    [...root.querySelectorAll('[data-goal-slot]')].forEach((slot,i)=>{
      const lane=plan.lanes[i],clear=state.arrived.includes(lane),pending=state.planes.some(p=>p.goal&&p.lane===lane);
      slot.querySelector('.to-goal-note').textContent=`${lane+1} · ${NOTES[lane]}`;
      slot.querySelector('.to-goal-state').textContent=clear?'✓ Clear':pending?'↗ Airborne':'Ready';
      slot.classList.toggle('is-clear',clear);slot.classList.toggle('is-airborne',pending);
    });
    pads.forEach((button,lane)=>{
      const target=guide&&!complete&&plan.lanes.includes(lane)&&!state.arrived.includes(lane);
      button.classList.toggle('is-goal',target);button.querySelector('.to-pad-hint').textContent=target?'✦ Chord note':'Play a note';button.disabled=state.paused;
      button.setAttribute('aria-label',`Launch lane ${lane+1}, ${NOTES[lane]}${target?', chord note':''}`);
    });
    root.querySelectorAll('[data-stamp]').forEach(stamp=>{
      const earned=state.stamps.includes(stamp.dataset.stamp),label=PLANS.find(p=>p.id===stamp.dataset.stamp).title;
      stamp.classList.toggle('is-earned',earned);stamp.setAttribute('aria-label',`${label}, ${earned?'explored':'unexplored'}`);
    });
    $('to-stamp-label').textContent=state.stamps.length===PLANS.length?'All five skies explored. Stay and play.':state.stamps.length?`${state.stamps.length} of 5 sky chords explored`:'Five little skies to explore';
  }
  function draw(){renderer.draw({...state,goalLanes:PLANS[state.planIndex].lanes},{time:visualTime,still:still(),bursts});}
  function wake(){if(!frame&&!state.paused&&!destroyed&&!doc.hidden){lastTime=win.performance.now();frame=win.requestAnimationFrame(tick);}}
  function receive(result,instant=false) {
    state=result.state;
    for(const plane of result.arrivals){
      if(!instant){stopVoice(voices.get(plane.id),false);bursts.push({lane:plane.lane,at:visualTime});}
    }
    bursts=bursts.slice(-MAX_PLANES);
    if(result.completed){persist();chime();say(state.stamps.length===PLANS.length?'All five sky chords explored. Stay and play, or choose free play.':`${PLANS[state.planIndex].title} is clear. Three notes, one little sky chord. Next chord is ready.`);}
    else if(result.arrivals.length&&state.mode==='guide')say(`${state.arrived.length} of 3 chord departures clear of the coast. Every note is welcome.`);
    if(result.arrivals.length||result.completed)updateUi();
  }
  function launchLane(lane,{announce=true}={}) {
    if(destroyed)return;
    const result=launch(state,lane);
    if(!result.accepted){if(announce)say(result.reason==='paused'?'The sky is paused. Resume whenever you are ready.':'The sky is full for a moment. Let a little space open.');return;}
    state=result.state;pulse(lane);playNote(result.plane);
    if(announce)say(`Lane ${lane+1}, ${NOTES[lane]} taking off.${result.matched?' A chord note is on its way.':' Every note is welcome.'}`);
    if(still())receive(advance(state,0,{instant:true}),true);
    updateUi();draw();if(state.planes.length||auto||bursts.length)wake();
  }
  function tick(now) {
    frame=0;if(destroyed||state.paused||doc.hidden)return;
    const delta=Math.max(0,Math.min(100,now-lastTime));lastTime=now;visualTime+=delta;
    if(auto&&state.mode==='free'&&visualTime>=nextAuto){launchLane(AUTO_NOTES[autoCursor++%AUTO_NOTES.length],{announce:false});nextAuto=visualTime+2300;}
    receive(advance(state,delta,{instant:still()}),still());
    bursts=bursts.filter(b=>visualTime-b.at<850);draw();
    if(state.planes.length||auto||bursts.length){if(!frame)frame=win.requestAnimationFrame(tick);}
  }
  function pause(hidden=false) {
    if(destroyed)return;
    auto=false;state=setPaused(state,true);bursts=[];win.cancelAnimationFrame(frame);frame=0;stopAll();updateUi();draw();
    say(hidden?'The sky paused while you were away. Resume whenever you like.':'Sky paused. Take your time.');
  }
  function resume() {
    if(destroyed)return;
    state=setPaused(state,false);updateUi();for(const plane of state.planes)playNote(plane);draw();if(state.planes.length)wake();say('Back to the sky. Every note is welcome.');
  }
  function fresh(next,message) {
    auto=false;stopAll();win.cancelAnimationFrame(frame);frame=0;bursts=[];state=next;persist();updateUi();draw();say(message);
  }
  pads.forEach(button=>on(button,'click',()=>launchLane(Number(button.dataset.toLane))));
  on($('to-sound'),'click',()=>{
    if(soundOn){soundOn=false;stopAll();say('Sound off. Your departures still fly.');}
    else{const c=audio();if(!c){soundUnavailable();return;}soundOn=true;for(const plane of state.planes)if(!state.paused)playNote(plane);say('Sound on. Let your notes overlap.');}
    updateUi();
  });
  on($('to-pause'),'click',()=>state.paused?resume():pause());
  on($('to-clear'),'click',()=>fresh(restartPlan(state),'A clear sky. Try this chord again, or play any notes you like.'));
  on($('to-next'),'click',()=>{if(state.phase==='complete')fresh(nextPlan(state),`${PLANS[(state.planIndex+1)%PLANS.length].title}. Try the three marked notes together.`);});
  on($('to-guide-mode'),'click',()=>{if(state.mode!=='guide')fresh(setMode(state,'guide'),'Three marked notes make a little sky chord. All the other notes are welcome too.');});
  on($('to-free-mode'),'click',()=>{if(state.mode!=='free')fresh(setMode(state,'free'),'The sky is yours. Play any notes, or try Auto fly.');});
  on($('to-auto'),'click',()=>{
    if(state.mode!=='free'||state.paused)return;
    auto=!auto;updateUi();say(auto?'Auto fly is playing a gentle departure sequence. Stop it whenever you like.':'Auto fly stopped. Back to your notes.');
    if(auto){nextAuto=visualTime+2300;launchLane(AUTO_NOTES[autoCursor++%AUTO_NOTES.length],{announce:false});wake();}
  });
  on(root,'keydown',event=>{
    if(typing(event)||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.repeat&&(event.key==='Enter'||event.key===' ')){event.preventDefault();return;}
    if(event.repeat)return;
    if(/^[1-8]$/.test(event.key)){event.preventDefault();launchLane(Number(event.key)-1);}
    else if(event.key==='Escape'||(event.key===' '&&!onControl(event))){event.preventDefault();state.paused?resume():pause();}
  });
  on(doc,'visibilitychange',()=>{if(doc.hidden)pause(true);});
  on(win,'blur',()=>{if(state.planes.length||auto)pause(true);});
  on(win,'resize',()=>{renderer.resize();draw();});
  on(motion,'change',()=>{
    bursts=[];if(still()&&!state.paused)receive(advance(state,0,{instant:true}),true);updateUi();draw();
  });
  root.querySelectorAll('button').forEach(button=>{button.disabled=false;});updateUi();draw();
  say('Tap any note to launch. For a sky chord, try the three marked notes together.');
  return ()=>{
    if(destroyed)return;destroyed=true;auto=false;win.cancelAnimationFrame(frame);events.abort();stopAll();
    for(const timer of padTimers.values())win.clearTimeout(timer);padTimers.clear();pads.forEach(p=>p.classList.remove('is-lit'));
    root.querySelectorAll('button').forEach(button=>{button.disabled=true;});
  };
}
