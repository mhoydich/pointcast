/* pray.js: what the four pages share. No libraries, no network, nothing sent.
   The only thing kept is a list of local dates on which an act was finished (day marks).
   Names are read, checked and shown with textContent; never stored, never put in a title or a request. */
(function(){
'use strict';
var P={};

/* ---------- the hour ---------- */
P.part=function(d){
  var h=(d||new Date()).getHours();
  return h>=5&&h<9?'dawn':h>=9&&h<17?'day':h>=17&&h<21?'dusk':'night';
};
P.HOUR={
  dawn:'Early. The day has not started yet.',
  day:'Daytime. A minute is enough.',
  dusk:'Evening. The light is going.',
  night:'Late. Keep it small.'
};

/* ---------- intentions: each changes one quiet line on an act page ---------- */
P.INTENTS={
  thanks:{label:'Thanks',line:'Say thank you for something. Small things count.'},
  asking:{label:'Asking',line:'Ask for what you want. Say it plainly.'},
  someone:{label:'For someone',line:'Hold someone in mind. Say their name.'},
  remembering:{label:'Remembering',line:'Remember who, or what, is gone. Let it be near for a minute.'}
};
function params(){try{return new URLSearchParams(location.search)}catch(e){return null}}
P.intent=function(){
  var q=params(),v=q?q.get('i'):null;
  return v&&Object.prototype.hasOwnProperty.call(P.INTENTS,v)?v:null;
};

/* ---------- names: a first name only ---------- */
var NAME_RE;
try{NAME_RE=new RegExp("^\\p{L}[\\p{L}\\p{M} '’-]{0,23}$",'u')}
catch(e){NAME_RE=/^[A-Za-zÀ-ÖØ-öø-ɏ][A-Za-zÀ-ÖØ-öø-ɏ '’-]{0,23}$/}
P.cleanName=function(v){
  if(typeof v!=='string')return null;
  if(v.normalize)v=v.normalize('NFC');
  v=v.trim().replace(/ {2,}/g,' ');
  return v.length>0&&v.length<=24&&NAME_RE.test(v)?v:null;
};
P.forName=function(){var q=params();return q?P.cleanName(q.get('for')):null};
P.NAME_HELP='A first name: letters, spaces, hyphens, apostrophes.';

/* a link to this same page on whatever domain it is served from */
P.here=function(q){
  var u=location.origin+location.pathname,s=[];
  for(var k in q)if(q[k])s.push(encodeURIComponent(k)+'='+encodeURIComponent(q[k]));
  return s.length?u+'?'+s.join('&'):u;
};

/* ---------- day marks: one key, a list of local dates ---------- */
var KEY='pray-days-v1',memDays=[];
function pad(n){return (n<10?'0':'')+n}
P.dayKey=function(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
P.days=function(){
  var out=memDays.slice();
  try{
    var raw=localStorage.getItem(KEY),list=raw?JSON.parse(raw):[];
    if(Array.isArray(list))list.forEach(function(s){if(typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)&&out.indexOf(s)<0)out.push(s)});
  }catch(e){}
  return out.sort();
};
P.markToday=function(){
  var t=P.dayKey();
  if(memDays.indexOf(t)<0)memDays.push(t);
  var list=P.days();if(list.indexOf(t)<0)list.push(t);
  list=list.sort().slice(-60); /* only recent dates are kept */
  try{localStorage.setItem(KEY,JSON.stringify(list))}catch(e){}
  return t;
};
/* fill a container with 14 marks, oldest first; today last */
P.renderMarks=function(el){
  if(!el)return;
  var have=P.days(),now=new Date(),n=0;
  while(el.firstChild)el.removeChild(el.firstChild);
  for(var i=13;i>=0;i--){
    var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i),k=P.dayKey(d),on=have.indexOf(k)>-1;
    var s=document.createElement('span');s.className='mark'+(on?' on':'')+(i===0?' today':'');
    el.appendChild(s);if(on)n++;
  }
  el.setAttribute('aria-label',n===0?'No days marked in the last two weeks.':(n===1?'One day':n+' days')+' in the last two weeks.');
};

/* ---------- haptics ---------- */
var canVibe=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
P.buzz=function(p){if(canVibe){try{navigator.vibrate(p)}catch(e){}}};

/* ---------- motion ---------- */
var mq=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
P.still=function(){return !!(mq&&mq.matches)};

/* ---------- sound: made on the first touch, never before ---------- */
var AC=window.AudioContext||window.webkitAudioContext,A=null;
P.audio=function(){ /* call only from a click, tap or key handler */
  if(!AC)return null;
  if(!A){
    try{
      var c=new AC(),m=c.createGain(),comp=c.createDynamicsCompressor();
      comp.threshold.value=-14;comp.knee.value=16;comp.ratio.value=3;comp.attack.value=0.005;comp.release.value=0.4;
      m.gain.value=0.9;m.connect(comp);comp.connect(c.destination);
      /* a small room: a short decaying noise as the impulse */
      var rv=c.createConvolver(),len=Math.floor(c.sampleRate*2.6),ir=c.createBuffer(2,len,c.sampleRate);
      for(var ch=0;ch<2;ch++){var d=ir.getChannelData(ch);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
      rv.buffer=ir;var wet=c.createGain();wet.gain.value=0.28;rv.connect(wet);wet.connect(m);
      A={ctx:c,out:m,verb:rv};
    }catch(e){A=null;return null}
  }
  if(A.ctx.state!=='running'){try{A.ctx.resume()}catch(e){}}
  return A;
};
P.audioState=function(){return A?A.ctx.state:'none'};

/* the bell for each part of the day: pitch (Hz of the strike note) and how long it rings (s) */
P.BELL={dawn:{f:329.6,decay:9},day:{f:392,decay:6.5},dusk:{f:261.6,decay:12},night:{f:196,decay:16}};
/* bronze: inharmonic partials (hum, prime, tierce, quint, nominal and above), each a detuned pair so it beats */
var PARTIALS=[[0.5,0.55,1.6],[1,1,1.25],[1.183,0.5,0.95],[1.506,0.32,0.8],[2,0.6,0.62],[2.5,0.2,0.45],[2.66,0.22,0.4],[3.01,0.14,0.32],[4.16,0.09,0.22],[5.43,0.05,0.15]];
P.strike=function(opt){
  opt=opt||{};var a=P.audio();if(!a)return false;
  var c=a.ctx,t=c.currentTime+0.01,b=P.BELL[opt.part||P.part()]||P.BELL.day;
  var f=b.f*(opt.pitch||1),dec=b.decay*(opt.decay||1),vel=opt.vel==null?0.6:opt.vel;
  var bus=c.createGain();bus.gain.value=vel*0.22;bus.connect(a.out);bus.connect(a.verb);
  for(var i=0;i<PARTIALS.length;i++){
    var r=PARTIALS[i],ff=f*r[0];if(ff>16000)continue;
    var len=Math.max(0.6,dec*r[2]),amp=r[1];
    for(var k=0;k<2;k++){
      var o=c.createOscillator();o.type='sine';
      o.frequency.value=ff+(k?1:-1)*(0.35+0.25*i)*(ff/400); /* slow beating, faster in the upper partials */
      var g=c.createGain();
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(amp*0.5,t+0.004+0.002*i);
      g.gain.exponentialRampToValueAtTime(0.0001,t+len);
      o.connect(g);g.connect(bus);o.start(t);o.stop(t+len+0.05);
    }
  }
  /* the strike itself: a very short knock of filtered noise */
  try{
    var n=c.createBuffer(1,Math.floor(c.sampleRate*0.05),c.sampleRate),d=n.getChannelData(0);
    for(var j=0;j<d.length;j++)d[j]=(Math.random()*2-1)*Math.pow(1-j/d.length,4);
    var s=c.createBufferSource();s.buffer=n;var bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*4;bp.Q.value=1.2;
    var ng=c.createGain();ng.gain.value=0.5;s.connect(bp);bp.connect(ng);ng.connect(bus);s.start(t);
  }catch(e){}
  return true;
};

/* ---------- share: the system sheet, else the clipboard, else a field to copy from ---------- */
P.share=function(o){ /* o: {title,text,url,status:el,field:el} ; call straight from the tap */
  var say=function(t){if(o.status)o.status.textContent=t};
  var done=false;
  var manual=function(){if(done)return;done=true;if(o.field){o.field.value=o.url;o.field.hidden=false;try{o.field.focus();o.field.select()}catch(e){}}say('Copy this link and send it.')};
  var copied=function(){if(done)return;done=true;say('Link copied.')};
  var copy=function(){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      try{navigator.clipboard.writeText(o.url).then(copied,manual)}catch(e){manual();return}
      setTimeout(manual,1500);
    }else manual();
  };
  say('');if(o.field)o.field.hidden=true;
  if(navigator.share){
    try{navigator.share({title:o.title,text:o.text,url:o.url}).then(function(){done=true;say('Sent.')},function(e){if(e&&e.name==='AbortError'){say('');return}copy()})}
    catch(e){copy()}
  }else copy();
};

window.Pray=P;
})();
