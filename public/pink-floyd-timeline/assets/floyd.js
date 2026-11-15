(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const events = $$('.event');
  const chapters = $$('.chapter');
  const search = $('#timeline-search');
  const type = $('#type-filter');
  const count = $('#result-count');
  let era = 'all';
  const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const eventIndex = events.map(el => ({el, text:normalize(el.dataset.search), era:el.dataset.era, category:el.dataset.category, audiovisual:el.dataset.audiovisual==='true'}));

  function applyFilters(updateURL = true) {
    const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    eventIndex.forEach(item => {
      const visible = (era==='all'||item.era===era) && (type.value==='all'||(type.value==='audiovisual'?item.audiovisual:item.category===type.value)) && words.every(word=>item.text.includes(word));
      item.el.hidden=!visible;
      if(visible) shown++;
    });
    chapters.forEach(chapter => {chapter.hidden = ![...chapter.querySelectorAll('.event')].some(event=>!event.hidden);});
    $$('[data-era-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.eraFilter===era)));
    count.textContent = `${shown} of ${events.length} milestones`;
    $('#no-results').hidden=shown>0;
    if(updateURL) {
      const url = new URL(location.href);
      // A new filter must not retain a prior event anchor that would undo it on reload.
      url.hash = '';
      for(const [key,value] of [['era',era],['type',type.value],['q',search.value.trim()]]) {
        if(value && value!=='all') url.searchParams.set(key,value); else url.searchParams.delete(key);
      }
      history.replaceState(null,'',url);
    }
  }
  function resetFilters() {era='all';type.value='all';search.value='';applyFilters();}
  function restoreFilters() {
    const params=new URLSearchParams(location.search);
    const validEra=$$('[data-era-filter]').map(button=>button.dataset.eraFilter);
    era=validEra.includes(params.get('era'))?params.get('era'):'all';
    type.value=[...type.options].some(option=>option.value===params.get('type'))?params.get('type'):'all';
    search.value=params.get('q')||'';
    applyFilters(false);
  }
  $$('[data-era-filter]').forEach(button=>button.addEventListener('click',()=>{era=button.dataset.eraFilter;applyFilters();}));
  search.addEventListener('input',()=>applyFilters());
  type.addEventListener('change',()=>applyFilters());
  $('#clear-filters').addEventListener('click',()=>{resetFilters();search.focus();});
  $$('[data-event-link]').forEach(link=>link.addEventListener('click',()=>{
    resetFilters();
    const target=document.getElementById(link.dataset.eventLink);
    if(target) requestAnimationFrame(()=>target.focus({preventScroll:true}));
  }));
  addEventListener('popstate',restoreFilters);
  restoreFilters();
  if(location.hash) {
    let targetId=location.hash.slice(1);
    try {targetId=decodeURIComponent(targetId);} catch {}
    const target=document.getElementById(targetId);
    if(target?.classList.contains('event')) {resetFilters();requestAnimationFrame(()=>target.scrollIntoView());}
  }

  const motion=$('#motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let motionOn=!reduced.matches;
  function setMotion(on) {motionOn=on;document.documentElement.classList.toggle('motion-off',!on);motion.setAttribute('aria-pressed',String(on));motion.textContent=on?'Motion on':'Motion paused';}
  motion.addEventListener('click',()=>setMotion(!motionOn));
  reduced.addEventListener('change',event=>setMotion(!event.matches));
  setMotion(motionOn);

  const media=window.FLOYD_MEDIA;
  const dialog=$('#player-dialog');
  const frame=$('#player-frame');
  let selectedIndex=0;
  let opener=null;
  function setVideo(index) {
    selectedIndex=(index+media.videos.length)%media.videos.length;
    const video=media.videos[selectedIndex];
    frame.replaceChildren();
    const iframe=document.createElement('iframe');
    // Only vetted manifest IDs become a third-party URL. Loading requires a visitor action.
    if(!/^[a-zA-Z0-9_-]{11}$/.test(video.youtube_id)) return;
    iframe.src=`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=0&rel=0&playsinline=1`;
    iframe.title=video.title;
    iframe.allow='encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    frame.append(iframe);
    $('#player-title').textContent=video.title;
    $('#player-description').textContent=video.description;
    $('#player-era').textContent=video.era;
    $('#watch-direct').href=video.watch_url;
    $('#player-position').textContent=`${selectedIndex+1} / ${media.videos.length}`;
  }
  $$('[data-watch]').forEach(button=>button.addEventListener('click',()=>{
    const index=media.videos.findIndex(video=>video.id===button.dataset.watch);
    if(index<0)return;
    opener=button;
    setVideo(index);
    document.body.classList.add('modal-open');
    dialog.showModal();
    $('#close-player').focus();
  }));
  function closePlayer(){dialog.close();}
  $('#close-player').addEventListener('click',closePlayer);
  dialog.addEventListener('click',event=>{if(event.target===dialog) {const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closePlayer();}});
  dialog.addEventListener('close',()=>{frame.replaceChildren();document.body.classList.remove('modal-open');opener?.focus({preventScroll:true});});
  $('#previous-video').addEventListener('click',()=>setVideo(selectedIndex-1));
  $('#next-video').addEventListener('click',()=>setVideo(selectedIndex+1));
})();
