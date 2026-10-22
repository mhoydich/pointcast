(() => {
  'use strict';
  const data = window.PREMIERE;
  const $ = id => document.getElementById(id);
  const portrait = id => `assets/portraits/noun-${String(id).padStart(4,'0')}.svg`;
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const locations = {lobby:'The lobby',alley:'The alley',booth:'The projection booth',roof:'The roof landing',auditorium:'The auditorium'};
  const key = 'nouns-world-premiere-sol-v1';
  const props = {
    ticket:'<rect x="8" y="15" width="102" height="45" fill="#e8b867"/><path d="M82 15v45" stroke="#101e2a" stroke-dasharray="3 4"/><path d="M20 28h50M20 38h40M20 48h26" stroke="#101e2a" stroke-width="3"/>',
    map:'<path d="M8 15L42 5l30 12 35-9v52L72 68 42 55 8 66z" fill="#d6e0ce"/><path d="M42 5v50M72 17v51" stroke="#738884"/><path d="M20 50l14-23 18 12 18-8 25 12" stroke="#b06d48" stroke-width="3" stroke-dasharray="4 4" fill="none"/>',
    paper:'<rect x="12" y="17" width="90" height="46" fill="#f0e8d7"/><ellipse cx="102" cy="40" rx="9" ry="23" fill="#ccc4b5"/><path d="M24 24h50M24 52h33" stroke="#a19d91"/>',
    clip:'<path d="M30 18h65l-4 39H25z" fill="#f0e8d7"/><rect x="39" y="6" width="40" height="25" rx="3" fill="#bd8c48"/><path d="M48 7v-4h20v4" fill="none" stroke="#e8b867" stroke-width="4"/>',
    tin:'<ellipse cx="60" cy="39" rx="43" ry="28" fill="#9ba8a9"/><ellipse cx="60" cy="33" rx="43" ry="28" fill="#c9d1ce"/><ellipse cx="60" cy="33" rx="25" ry="16" fill="#e8b867"/><path d="M44 33h32" stroke="#101e2a" stroke-width="4"/>',
    strip:'<path d="M7 15h105v44H7z" fill="#b17649"/><path d="M8 23h103M8 51h103" stroke="#efdbac" stroke-width="5" stroke-dasharray="6 5"/><path d="M25 31h18v12H25zm30 0h18v12H55zm30 0h18v12H85z" fill="#101e2a"/>',
    card:'<path d="M15 7h90v60H15z" fill="#f0e8d7"/><path d="M60 7v60" stroke="#c5bca9"/><path d="M27 25h20M27 34h20M27 43h15" stroke="#9d8361" stroke-width="2"/>',
    lamp:'<path d="M60 25v40M40 65h40" stroke="#e8b867" stroke-width="6"/><path d="M30 30L43 5h34l13 25z" fill="#e8b867"/><ellipse cx="60" cy="30" rx="30" ry="7" fill="#fff0ba"/>',
    reel:'<circle cx="60" cy="36" r="31" fill="#aebbbd"/><circle cx="60" cy="36" r="6" fill="#101e2a"/><g fill="#334853"><circle cx="60" cy="17" r="9"/><circle cx="42" cy="35" r="9"/><circle cx="78" cy="35" r="9"/><circle cx="60" cy="55" r="9"/></g>',
    camera:'<path d="M12 22h69v42H12zM81 31l27-14v48L81 52z" fill="#516a71"/><circle cx="30" cy="15" r="14" fill="#b0bcba"/><circle cx="65" cy="15" r="14" fill="#b0bcba"/><circle cx="30" cy="15" r="5" fill="#101e2a"/><circle cx="65" cy="15" r="5" fill="#101e2a"/>',
    chair:'<rect x="33" y="6" width="55" height="35" fill="#ac5f43"/><path d="M28 42h65v10H28z" fill="#d99d62"/><path d="M33 50v20M88 50v20" stroke="#d99d62" stroke-width="6"/>',
    monster:'<path d="M29 17l5-14 14 13h25L88 3l4 20 6 36H22z" fill="#d4b87c"/><circle cx="47" cy="29" r="5" fill="#101e2a"/><circle cx="73" cy="29" r="5" fill="#101e2a"/><path d="M45 47q15-8 30 0" fill="none" stroke="#101e2a" stroke-width="3"/><path d="M33 58v11M49 58v11M66 58v11M83 58v11" stroke="#d4b87c" stroke-width="5"/>',
    banner:'<path d="M5 15h110l-8 23 8 23H5l8-23z" fill="#e8b867"/><text x="60" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#101e2a">ALMOST</text>'
  };
  const initial = () => ({id:'arrival',items:[],tags:[],history:[]});
  const allowed = (scene, state) => (scene.choices || []).map((choice,index)=>({choice,index})).filter(({choice})=>!choice.requires || state.items.includes(choice.requires));
  function replay(history) {
    let result=initial();
    if(!Array.isArray(history) || history.length>30) return result;
    for(const step of history) {
      const scene=data.scenes[result.id];
      const found=allowed(scene,result).find(({index})=>index===step.index);
      if(!found || step.from!==result.id) return initial();
      const c=found.choice;
      result.history.push({from:result.id,index:step.index});
      if(c.gain && !result.items.includes(c.gain)) result.items.push(c.gain);
      if(c.tag && !result.tags.includes(c.tag)) result.tags.push(c.tag);
      result.id=c.next;
    }
    return result;
  }
  let state=initial(),storageAvailable=true;
  try {const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===data.version) state=replay(saved.history);} catch {storageAvailable=false;}
  function save() {
    try {localStorage.setItem(key,JSON.stringify({version:data.version,history:state.history}));storageAvailable=true;}
    catch {storageAvailable=false;}
  }
  function paragraph(p) {return typeof p==='string'?p:(p.if?(state.items.includes(p.if)?p.yes:p.no):(state.tags.includes(p.tag)?p.yes:p.no));}
  function render(focus=false) {
    const scene=data.scenes[state.id];
    $('slate').textContent=`${locations[scene.place].toUpperCase()} / ${scene.time}`;
    $('take').textContent=`SCENE ${String(state.history.length+1).padStart(2,'0')}`;
    $('scene-kicker').textContent=scene.kicker;
    $('scene-title').textContent=scene.title;
    $('scene-text').innerHTML=scene.text.map(p=>`<p>${esc(paragraph(p))}</p>`).join('');
    $('scene-set').src=`assets/scenes/${scene.place}.svg`;
    $('location-label').textContent=locations[scene.place];
    $('scene-visual').setAttribute('role','img');
    $('scene-visual').setAttribute('aria-label',`${locations[scene.place]}. ${scene.cast.map(id=>data.cast[id-1].name).join(', ')} in a theatrical composition with ${scene.prop.replaceAll('-',' ')}.`);
    $('scene-cast').innerHTML=scene.cast.map(id=>`<img src="${portrait(id)}" alt="" aria-hidden="true">`).join('');
    $('scene-object').innerHTML=`<svg viewBox="0 0 120 75" xmlns="http://www.w3.org/2000/svg">${props[scene.prop]||props.ticket}</svg>`;
    $('choices').replaceChildren();
    for(const {choice,index} of allowed(scene,state)) {
      const button=document.createElement('button');button.type='button';button.className='choice';
      button.dataset.choice=index;
      button.innerHTML=`<b>${esc(choice.label)}</b><small>${esc(choice.note)}</small>`;
      button.addEventListener('click',()=>{state=replay([...state.history,{from:state.id,index}]);save();render(true);});
      $('choices').append(button);
    }
    $('ending-actions').hidden=!scene.ending;
    $('pocket').textContent=state.items.length?state.items.map(id=>data.items[id]).join(' / '):'A premiere invitation. An unreasonable amount of hope.';
    $('save-status').textContent=storageAvailable?'Progress stays in this browser.':'Progress lasts for this visit. Browser storage is unavailable.';
    const route=[...state.history.map(step=>({title:data.scenes[step.from].title,choice:data.scenes[step.from].choices[step.index].label})),{title:scene.title}];
    $('route-count').textContent=`${route.length} ${route.length===1?'scene':'scenes'}`;
    $('route-log').innerHTML=route.map(r=>`<li>${esc(r.title)}${r.choice?` — ${esc(r.choice)}`:''}</li>`).join('');
    $('player').dataset.scene=state.id;
    if(focus) {
      $('scene-title').focus({preventScroll:true});
      const target=matchMedia('(max-width:760px)').matches?$('scene-title'):$('player');
      target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
    }
  }
  function reset(){state=initial();save();render(true);}
  $('restart').addEventListener('click',reset);$('another-cut').addEventListener('click',reset);
  $('download-programme').addEventListener('click',()=>{
    const scene=data.scenes[state.id];if(!scene.ending)return;
    const text=[data.title.toUpperCase(),'YOUR PREMIERE PROGRAMME','',`Ending: ${scene.ending}`,'',...scene.text.map(paragraph),'','YOUR ROUTE',...state.history.map((s,i)=>`${i+1}. ${data.scenes[s.from].title} / ${data.scenes[s.from].choices[s.index].label}`),'','IN YOUR COAT POCKET',...state.items.map(i=>data.items[i]),'','Written, designed & built by GPT-6.1 Sol','Creative direction: Michael Hoydich','Original Nouns artwork: nounsDAO. Fictional characters, no minted identity.','Editorial signature / Sol edition / 19 October 2026'].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`nouns-world-premiere-${state.id.replace('end-','')}-programme.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('hero-cast').innerHTML=[1,3,2,9,10].map(id=>`<img src="${portrait(id)}" alt="">`).join('');
  $('cast-grid').innerHTML=data.cast.map(c=>`<article class="cast-card"><div class="portrait-wrap" data-number="${String(c.id).padStart(2,'0')}"><img src="${portrait(c.id)}" alt="${esc(c.name)}, exact original-framework Nouns portrait" loading="lazy"></div><h3>${esc(c.name)}</h3><p class="role">${esc(c.role)}</p><p class="flaw">${esc(c.flaw)}</p><details><summary>Under the costume +</summary><p>${esc(c.heart)}</p><p class="quote">${esc(c.line)}</p></details></article>`).join('');
  $('episode-list').innerHTML=data.episodes.map((e,i)=>`<li><span class="episode-number">${String(i+1).padStart(2,'0')}</span><div class="episode-title"><h3>${esc(e[0])}</h3><p>${esc(e[1])}</p></div><div class="episode-summary"><p>${esc(e[2])}</p><span>${esc(e[3])}</span></div></li>`).join('');
  render();
})();
