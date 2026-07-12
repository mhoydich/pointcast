import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Bath = createComponent(($$result, $$props, $$slots) => {
  const title = "Bath — color-wave room · PointCast";
  const description = "Eight moods. Ambient generated tones. Any Spotify link. WARM · COOL · ELECTRIC · EARTH · VOID · DAWN · NEON · OCEAN.";
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function(){
  'use strict';
  var NOTES={warm:'amber · coral · gold · the warm side of morning',cool:'teal · sapphire · mist · the clear side of afternoon',electric:'magenta · cyan · arc · the lit side of midnight',earth:'sage · ochre · loam · the slow side of dusk',void:'charcoal · silver · pitch · the deep side of nothing',dawn:'peach · rose · lilac · the soft side of waking',neon:'green · yellow · shock · the loud side of alive',ocean:'cerulean · navy · deep · the still side of the sea'};
  var TONES={warm:{freqs:[220,440,329.6],g:.056,lpf:800},cool:{freqs:[220,293.7,440],g:.048,lpf:580},electric:{freqs:[277.2,369.9,554.4],g:.06,lpf:1200},earth:{freqs:[130.8,196,261.6],g:.058,lpf:480},void:{freqs:[55,110,164.8],g:.07,lpf:260},dawn:{freqs:[261.6,392,523.3],g:.048,lpf:900},neon:{freqs:[440,554.4,659.3],g:.055,lpf:1800},ocean:{freqs:[138.6,207.7,277.2],g:.064,lpf:400}};
  var ctx=null,mGain=null,nodes=[],soundOn=false,mood='warm',spot=null;
  function stopNodes(){nodes.forEach(function(n){try{n.o.stop()}catch(e){}try{n.l.stop()}catch(e){}});nodes=[];}
  function startDrone(m){
    if(!ctx||!soundOn)return;
    stopNodes();
    var c=TONES[m]||TONES.warm,pg=c.g/c.freqs.length;
    c.freqs.forEach(function(f,i){
      var o=ctx.createOscillator(),og=ctx.createGain(),lp=ctx.createBiquadFilter(),lf=ctx.createOscillator(),lg=ctx.createGain();
      o.type='sine';o.frequency.value=f;og.gain.value=pg;
      lp.type='lowpass';lp.frequency.value=c.lpf;lp.Q.value=0.7;
      lf.type='sine';lf.frequency.value=0.07+i*0.025;lg.gain.value=2.5;
      lf.connect(lg);lg.connect(o.detune);o.connect(lp);lp.connect(og);og.connect(mGain);
      o.start();lf.start();nodes.push({o:o,l:lf});
    });
  }
  function toggleSound(){
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    if(!ctx){ctx=new AC();mGain=ctx.createGain();mGain.gain.value=0;mGain.connect(ctx.destination);}
    soundOn=!soundOn;
    var btn=document.getElementById('bath-sound-btn'),sn=document.getElementById('bath-sound-note');
    if(soundOn){mGain.gain.setTargetAtTime(0.85,ctx.currentTime,0.6);startDrone(mood);if(btn)btn.textContent='SOUND ON';if(btn)btn.setAttribute('data-on','1');if(sn)sn.textContent='generated drone · '+mood+' · web audio';}
    else{mGain.gain.setTargetAtTime(0,ctx.currentTime,0.4);setTimeout(stopNodes,1800);if(btn)btn.textContent='SOUND OFF';if(btn)btn.setAttribute('data-on','0');if(sn)sn.textContent='generated drone · no network';}
  }
  function setMood(m){
    mood=m;
    var el=document.getElementById('bath-main');if(el)el.dataset.mood=m;
    var n=document.getElementById('bath-note');if(n)n.textContent=NOTES[m]||'';
    document.querySelectorAll('.bath__mood').forEach(function(b){var on=b.dataset.m===m;b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('bath__mood--active',on);});
    if(soundOn&&ctx){startDrone(m);var sn=document.getElementById('bath-sound-note');if(sn)sn.textContent='generated drone · '+m+' · web audio';}
  }
  function clockMood(){var h=new Date().getHours();if(h<5)return'void';if(h<8)return'dawn';if(h<11)return'warm';if(h<16)return'cool';if(h<19)return'earth';if(h<22)return'electric';return'ocean';}
  function parseSpot(raw){var m=raw.match(/open\\.spotify\\.com\\/(track|playlist|album|episode)\\/([A-Za-z0-9]{22})/);return m?{type:m[1],id:m[2]}:null;}
  function updateWallet(){var el=document.getElementById('bath-wallet-note');if(!el)return;var a=localStorage.getItem('pc:wallet-active');el.textContent=a?'saves to '+a.slice(0,6)+'...'+a.slice(-4):'connect wallet (footer) to link to your address';}
  function handleInput(val){
    var p=parseSpot(val.trim()),em=document.getElementById('bath-embed'),sr=document.getElementById('bath-save-row'),cb=document.getElementById('bath-clear-btn');
    if(cb)cb.style.display=val.length?'flex':'none';
    spot=p;
    if(em){if(p){var h=p.type==='track'?'152':'352';em.innerHTML='<iframe src="https://open.spotify.com/embed/'+p.type+'/'+p.id+'?utm_source=pointcast" width="100%" height="'+h+'" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="display:block;border-radius:10px;margin-top:10px;box-shadow:0 4px 28px rgba(0,0,0,.45)"></iframe>';}else{em.innerHTML='';}}
    if(sr)sr.style.display=p?'flex':'none';
    if(p)updateWallet();
  }
  function saveToBath(){
    if(!spot)return;
    var btn=document.getElementById('bath-save-btn');
    if(btn){btn.textContent='SAVING...';btn.disabled=true;}
    var addr=localStorage.getItem('pc:wallet-active')||undefined;
    var entry={spotify_url:'https://open.spotify.com/'+spot.type+'/'+spot.id,spotify_type:spot.type,spotify_id:spot.id,mood:mood,address:addr,timestamp:new Date().toISOString()};
    try{var prev=JSON.parse(localStorage.getItem('pc:bath:saves')||'[]');localStorage.setItem('pc:bath:saves',JSON.stringify([entry].concat(prev.filter(function(e){return e.spotify_id!==entry.spotify_id})).slice(0,50)));}catch(e){}
    fetch('/api/bath',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}).then(function(r){return r.json();}).then(function(d){if(btn){btn.textContent=d.ok?'SAVED':'SAVED LOCALLY';btn.disabled=false;setTimeout(function(){btn.textContent='SAVE TO BATH';},2500);}}).catch(function(){if(btn){btn.textContent='SAVED LOCALLY';btn.disabled=false;setTimeout(function(){btn.textContent='SAVE TO BATH';},2500);}});
  }
  function tick(){var el=document.getElementById('bath-clock');if(!el)return;var n=new Date();el.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+' PT';}
  document.querySelectorAll('.bath__mood').forEach(function(b){b.addEventListener('click',function(){setMood(b.dataset.m);});});
  var sb=document.getElementById('bath-sound-btn');if(sb)sb.addEventListener('click',toggleSound);
  var inp=document.getElementById('bath-spotify-input');
  if(inp){inp.addEventListener('input',function(){handleInput(inp.value);});inp.addEventListener('paste',function(){setTimeout(function(){handleInput(inp.value);},0);});}
  var clr=document.getElementById('bath-clear-btn');if(clr)clr.addEventListener('click',function(){if(inp)inp.value='';handleInput('');});
  var sv=document.getElementById('bath-save-btn');if(sv)sv.addEventListener('click',saveToBath);
  setMood(clockMood());tick();setInterval(tick,60000);
})();
<\/script>`], ["", ` <script>
(function(){
  'use strict';
  var NOTES={warm:'amber · coral · gold · the warm side of morning',cool:'teal · sapphire · mist · the clear side of afternoon',electric:'magenta · cyan · arc · the lit side of midnight',earth:'sage · ochre · loam · the slow side of dusk',void:'charcoal · silver · pitch · the deep side of nothing',dawn:'peach · rose · lilac · the soft side of waking',neon:'green · yellow · shock · the loud side of alive',ocean:'cerulean · navy · deep · the still side of the sea'};
  var TONES={warm:{freqs:[220,440,329.6],g:.056,lpf:800},cool:{freqs:[220,293.7,440],g:.048,lpf:580},electric:{freqs:[277.2,369.9,554.4],g:.06,lpf:1200},earth:{freqs:[130.8,196,261.6],g:.058,lpf:480},void:{freqs:[55,110,164.8],g:.07,lpf:260},dawn:{freqs:[261.6,392,523.3],g:.048,lpf:900},neon:{freqs:[440,554.4,659.3],g:.055,lpf:1800},ocean:{freqs:[138.6,207.7,277.2],g:.064,lpf:400}};
  var ctx=null,mGain=null,nodes=[],soundOn=false,mood='warm',spot=null;
  function stopNodes(){nodes.forEach(function(n){try{n.o.stop()}catch(e){}try{n.l.stop()}catch(e){}});nodes=[];}
  function startDrone(m){
    if(!ctx||!soundOn)return;
    stopNodes();
    var c=TONES[m]||TONES.warm,pg=c.g/c.freqs.length;
    c.freqs.forEach(function(f,i){
      var o=ctx.createOscillator(),og=ctx.createGain(),lp=ctx.createBiquadFilter(),lf=ctx.createOscillator(),lg=ctx.createGain();
      o.type='sine';o.frequency.value=f;og.gain.value=pg;
      lp.type='lowpass';lp.frequency.value=c.lpf;lp.Q.value=0.7;
      lf.type='sine';lf.frequency.value=0.07+i*0.025;lg.gain.value=2.5;
      lf.connect(lg);lg.connect(o.detune);o.connect(lp);lp.connect(og);og.connect(mGain);
      o.start();lf.start();nodes.push({o:o,l:lf});
    });
  }
  function toggleSound(){
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    if(!ctx){ctx=new AC();mGain=ctx.createGain();mGain.gain.value=0;mGain.connect(ctx.destination);}
    soundOn=!soundOn;
    var btn=document.getElementById('bath-sound-btn'),sn=document.getElementById('bath-sound-note');
    if(soundOn){mGain.gain.setTargetAtTime(0.85,ctx.currentTime,0.6);startDrone(mood);if(btn)btn.textContent='SOUND ON';if(btn)btn.setAttribute('data-on','1');if(sn)sn.textContent='generated drone · '+mood+' · web audio';}
    else{mGain.gain.setTargetAtTime(0,ctx.currentTime,0.4);setTimeout(stopNodes,1800);if(btn)btn.textContent='SOUND OFF';if(btn)btn.setAttribute('data-on','0');if(sn)sn.textContent='generated drone · no network';}
  }
  function setMood(m){
    mood=m;
    var el=document.getElementById('bath-main');if(el)el.dataset.mood=m;
    var n=document.getElementById('bath-note');if(n)n.textContent=NOTES[m]||'';
    document.querySelectorAll('.bath__mood').forEach(function(b){var on=b.dataset.m===m;b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('bath__mood--active',on);});
    if(soundOn&&ctx){startDrone(m);var sn=document.getElementById('bath-sound-note');if(sn)sn.textContent='generated drone · '+m+' · web audio';}
  }
  function clockMood(){var h=new Date().getHours();if(h<5)return'void';if(h<8)return'dawn';if(h<11)return'warm';if(h<16)return'cool';if(h<19)return'earth';if(h<22)return'electric';return'ocean';}
  function parseSpot(raw){var m=raw.match(/open\\\\.spotify\\\\.com\\\\/(track|playlist|album|episode)\\\\/([A-Za-z0-9]{22})/);return m?{type:m[1],id:m[2]}:null;}
  function updateWallet(){var el=document.getElementById('bath-wallet-note');if(!el)return;var a=localStorage.getItem('pc:wallet-active');el.textContent=a?'saves to '+a.slice(0,6)+'...'+a.slice(-4):'connect wallet (footer) to link to your address';}
  function handleInput(val){
    var p=parseSpot(val.trim()),em=document.getElementById('bath-embed'),sr=document.getElementById('bath-save-row'),cb=document.getElementById('bath-clear-btn');
    if(cb)cb.style.display=val.length?'flex':'none';
    spot=p;
    if(em){if(p){var h=p.type==='track'?'152':'352';em.innerHTML='<iframe src="https://open.spotify.com/embed/'+p.type+'/'+p.id+'?utm_source=pointcast" width="100%" height="'+h+'" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="display:block;border-radius:10px;margin-top:10px;box-shadow:0 4px 28px rgba(0,0,0,.45)"></iframe>';}else{em.innerHTML='';}}
    if(sr)sr.style.display=p?'flex':'none';
    if(p)updateWallet();
  }
  function saveToBath(){
    if(!spot)return;
    var btn=document.getElementById('bath-save-btn');
    if(btn){btn.textContent='SAVING...';btn.disabled=true;}
    var addr=localStorage.getItem('pc:wallet-active')||undefined;
    var entry={spotify_url:'https://open.spotify.com/'+spot.type+'/'+spot.id,spotify_type:spot.type,spotify_id:spot.id,mood:mood,address:addr,timestamp:new Date().toISOString()};
    try{var prev=JSON.parse(localStorage.getItem('pc:bath:saves')||'[]');localStorage.setItem('pc:bath:saves',JSON.stringify([entry].concat(prev.filter(function(e){return e.spotify_id!==entry.spotify_id})).slice(0,50)));}catch(e){}
    fetch('/api/bath',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}).then(function(r){return r.json();}).then(function(d){if(btn){btn.textContent=d.ok?'SAVED':'SAVED LOCALLY';btn.disabled=false;setTimeout(function(){btn.textContent='SAVE TO BATH';},2500);}}).catch(function(){if(btn){btn.textContent='SAVED LOCALLY';btn.disabled=false;setTimeout(function(){btn.textContent='SAVE TO BATH';},2500);}});
  }
  function tick(){var el=document.getElementById('bath-clock');if(!el)return;var n=new Date();el.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+' PT';}
  document.querySelectorAll('.bath__mood').forEach(function(b){b.addEventListener('click',function(){setMood(b.dataset.m);});});
  var sb=document.getElementById('bath-sound-btn');if(sb)sb.addEventListener('click',toggleSound);
  var inp=document.getElementById('bath-spotify-input');
  if(inp){inp.addEventListener('input',function(){handleInput(inp.value);});inp.addEventListener('paste',function(){setTimeout(function(){handleInput(inp.value);},0);});}
  var clr=document.getElementById('bath-clear-btn');if(clr)clr.addEventListener('click',function(){if(inp)inp.value='';handleInput('');});
  var sv=document.getElementById('bath-save-btn');if(sv)sv.addEventListener('click',saveToBath);
  setMood(clockMood());tick();setInterval(tick,60000);
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "data-astro-cid-2zaitjrk": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bath" id="bath-main" data-mood="warm" data-astro-cid-2zaitjrk> <div class="bath__blobs" aria-hidden="true" data-astro-cid-2zaitjrk> <div class="bath__blob bath__blob--a" data-astro-cid-2zaitjrk></div> <div class="bath__blob bath__blob--b" data-astro-cid-2zaitjrk></div> <div class="bath__blob bath__blob--c" data-astro-cid-2zaitjrk></div> <div class="bath__blob bath__blob--d" data-astro-cid-2zaitjrk></div> </div> <div class="bath__frame" data-astro-cid-2zaitjrk> <header class="bath__head" data-astro-cid-2zaitjrk> <p class="bath__kicker" data-astro-cid-2zaitjrk>ROOM · BATH · EL SEGUNDO</p> <h1 class="bath__title" data-astro-cid-2zaitjrk>The Bath</h1> <p class="bath__dek" data-astro-cid-2zaitjrk>Step in. The color fills from below.</p> </header> <p class="bath__note" id="bath-note" aria-live="polite" data-astro-cid-2zaitjrk>amber · coral · gold · the warm side of morning</p> <nav class="bath__moods" aria-label="Color moods" data-astro-cid-2zaitjrk> <button class="bath__mood" data-m="warm" aria-pressed="true" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>WARM</span></button> <button class="bath__mood" data-m="cool" aria-pressed="false" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>COOL</span></button> <button class="bath__mood" data-m="electric" aria-pressed="false" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>ELECTRIC</span></button> <button class="bath__mood" data-m="earth" aria-pressed="false" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>EARTH</span></button> <button class="bath__mood" data-m="void" aria-pressed="false" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>VOID</span></button> <button class="bath__mood" data-m="dawn" aria-pressed="false" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>DAWN</span></button> <button class="bath__mood" data-m="neon" aria-pressed="false" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>NEON</span></button> <button class="bath__mood" data-m="ocean" aria-pressed="false" data-astro-cid-2zaitjrk><span class="bath__mood-dot" data-astro-cid-2zaitjrk></span><span class="bath__mood-name" data-astro-cid-2zaitjrk>OCEAN</span></button> </nav> <div class="bath__audio" data-astro-cid-2zaitjrk> <button class="bath__sound-btn" id="bath-sound-btn" data-on="0" data-astro-cid-2zaitjrk>SOUND OFF</button> <span class="bath__sound-note" id="bath-sound-note" data-astro-cid-2zaitjrk>generated drone · no network</span> </div> <section class="bath__spotify" aria-label="Spotify" data-astro-cid-2zaitjrk> <div class="bath__input-row" data-astro-cid-2zaitjrk> <input class="bath__spotify-input" id="bath-spotify-input" type="url" placeholder="paste any spotify link..." autocomplete="off" spellcheck="false" data-astro-cid-2zaitjrk> <button class="bath__clear-btn" id="bath-clear-btn" style="display:none" aria-label="Clear" data-astro-cid-2zaitjrk>x</button> </div> <div id="bath-embed" data-astro-cid-2zaitjrk></div> <div class="bath__save-row" id="bath-save-row" style="display:none" data-astro-cid-2zaitjrk> <button class="bath__save-btn" id="bath-save-btn" data-astro-cid-2zaitjrk>SAVE TO BATH</button> <span class="bath__wallet-note" id="bath-wallet-note" data-astro-cid-2zaitjrk></span> </div> </section> <nav class="bath__links" aria-label="Other rooms" data-astro-cid-2zaitjrk> <a class="bath__link" href="/anytime" data-astro-cid-2zaitjrk><span class="bath__link-label" data-astro-cid-2zaitjrk>/ANYTIME</span><span class="bath__link-desc" data-astro-cid-2zaitjrk>I'd Have You Anytime · George Harrison</span></a> <a class="bath__link" href="/room" data-astro-cid-2zaitjrk><span class="bath__link-label" data-astro-cid-2zaitjrk>/ROOM</span><span class="bath__link-desc" data-astro-cid-2zaitjrk>the mix room · 10 tracks</span></a> <a class="bath__link" href="/meditate" data-astro-cid-2zaitjrk><span class="bath__link-label" data-astro-cid-2zaitjrk>/MEDITATE</span><span class="bath__link-desc" data-astro-cid-2zaitjrk>ocean room · breathing</span></a> <a class="bath__link" href="/" data-astro-cid-2zaitjrk><span class="bath__link-label" data-astro-cid-2zaitjrk>/</span><span class="bath__link-desc" data-astro-cid-2zaitjrk>back to the broadcast</span></a> </nav> <footer class="bath__foot" data-astro-cid-2zaitjrk> <span data-astro-cid-2zaitjrk>on air · el segundo · fm 96.1 · cc0</span> <span id="bath-clock" data-astro-cid-2zaitjrk>--</span> </footer> </div> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/bath.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/bath.astro";
const $$url = "/bath";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Bath,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
