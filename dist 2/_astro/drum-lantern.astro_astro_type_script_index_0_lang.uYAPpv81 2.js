let c=null;function x(){if(!c){const t=window.AudioContext||window.webkitAudioContext;c=new t}return c.state==="suspended"&&c.resume(),c}function S(){const t=x(),e=t.currentTime,i=440,n=659.25,r=t.createOscillator();r.type="sine",r.frequency.value=i;const s=t.createOscillator();s.type="sine",s.frequency.value=n;const a=t.createGain();a.gain.setValueAtTime(1e-4,e),a.gain.exponentialRampToValueAtTime(.18,e+.01),a.gain.exponentialRampToValueAtTime(1e-4,e+1.4),r.connect(a),s.connect(a),a.connect(t.destination),r.start(e),s.start(e),r.stop(e+1.5),s.stop(e+1.5)}function v(){const t=x(),e=t.currentTime,i=t.createOscillator();i.type="sine",i.frequency.value=880;const n=t.createGain();n.gain.setValueAtTime(1e-4,e),n.gain.exponentialRampToValueAtTime(.1,e+.01),n.gain.exponentialRampToValueAtTime(1e-4,e+.8),i.connect(n).connect(t.destination),i.start(e),i.stop(e+.9)}const m="pc:sid";function M(){try{let t=localStorage.getItem(m);return t||(t="sid-"+Math.random().toString(36).slice(2)+Date.now().toString(36),localStorage.setItem(m,t)),t}catch{return"sid-anon-"+Date.now()}}async function b(t){const e=new TextEncoder().encode(t),i=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(i)).map(n=>n.toString(16).padStart(2,"0")).join("")}function I(t){let e=0;for(let i=0;i<Math.min(8,t.length);i++)e=e*31+t.charCodeAt(i)|0;return Math.abs(e)%1200}const w="pc:lantern:released";let d=0;try{d=parseInt(localStorage.getItem(w)||"0",10)||0}catch{}let u=0,l=0;const A=24,o=document.getElementById("dl-sky"),y=document.getElementById("dl-released"),f=document.getElementById("dl-aloft"),p=document.getElementById("dl-your-noun");function h(){y&&(y.textContent=`${d} RELEASED`),f&&(f.textContent=`${l} ALOFT`)}h();function C(){return`
      <svg class="dl__lantern-svg" viewBox="0 0 56 64" shape-rendering="crispEdges" aria-hidden="true">
        <!-- top brass cap -->
        <rect x="20" y="0" width="16" height="3" fill="#b8862c"/>
        <rect x="18" y="3" width="20" height="3" fill="#d4a437"/>
        <!-- string up -->
        <rect x="27" y="-12" width="2" height="12" fill="#6b4d12"/>
        <!-- body — paper, with side ribs -->
        <rect x="6" y="6" width="44" height="44" fill="oklch(0.65 0.20 60)" rx="2"/>
        <rect x="6" y="6" width="44" height="3" fill="oklch(0.55 0.20 60)"/>
        <rect x="6" y="47" width="44" height="3" fill="oklch(0.55 0.20 60)"/>
        <!-- side ribs -->
        <rect x="6" y="12" width="2" height="34" fill="oklch(0.45 0.18 60)"/>
        <rect x="48" y="12" width="2" height="34" fill="oklch(0.45 0.18 60)"/>
        <!-- bottom brass band -->
        <rect x="14" y="50" width="28" height="4" fill="#d4a437"/>
        <!-- tassel -->
        <rect x="27" y="54" width="2" height="6" fill="#c4351c"/>
        <rect x="25" y="60" width="6" height="3" fill="#c4351c"/>
      </svg>
    `}function E(t,e,i){if(l>=A||!o)return;const n=document.createElement("div");n.className="dl__lantern";const r=o.getBoundingClientRect(),s=Math.max(20,Math.min(r.width-76,t)),a=Math.max(60,Math.min(r.height-60,e));n.style.setProperty("--x",`${s}px`),n.style.setProperty("--y0",`${a}px`),n.style.setProperty("--rise-dur",`${28+Math.random()*6}s`),n.style.transform=`translate(${s}px, ${a}px)`,n.innerHTML=`
      <div class="dl__lantern-glow"></div>
      ${C()}
      <img class="dl__lantern-noun" src="https://noun.pics/${i}.svg" alt="" />
    `,o.appendChild(n),requestAnimationFrame(()=>{n.classList.add("dl__lantern--rising")}),l+=1,h(),o&&o.classList.add("dl__sky--seeded");const g=parseFloat(n.style.getPropertyValue("--rise-dur"))*1e3,_=g-4e3;setTimeout(()=>{n.classList.add("dl__lantern--fading")},_),setTimeout(()=>{try{v()}catch{}n.remove(),l-=1,h()},g)}o?.addEventListener("click",t=>{const e=o.getBoundingClientRect(),i=t.clientX-e.left-28,n=t.clientY-e.top-32;E(i,n,u);try{S()}catch{}d+=1;try{localStorage.setItem(w,String(d))}catch{}h()});function T(){if(!o||l>=A-4)return;const t=o.getBoundingClientRect(),e=Math.random()*(t.width-76),i=t.height-60-Math.random()*80,n=Math.floor(Math.random()*1200);E(e,i,n)}setTimeout(T,2e3);setInterval(()=>{Math.random()<.55&&T()},6500);(async()=>{const t=M(),e=await b(t);u=I(e),p&&(p.textContent=String(u).padStart(4,"0"))})();
