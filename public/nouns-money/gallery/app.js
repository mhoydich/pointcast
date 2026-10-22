'use strict';
/* All manifest text is inserted as text, and all asset URLs remain in the collection. */
const GalleryData = (() => {
  const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value);
  const asset = value => {
    if (typeof value !== 'string' || !value.startsWith('/nouns-money/collected/') || /[\\\u0000-\u001f]/.test(value)) return null;
    try { const u = new URL(value, 'https://local.invalid'); return u.origin === 'https://local.invalid' && u.pathname.startsWith('/nouns-money/collected/') ? u.pathname + u.search + u.hash : null; } catch { return null; }
  };
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const parseFavorites = value => {
    try { const data = JSON.parse(value); return new Set(Array.isArray(data) ? data.filter(validId).slice(0, 1000) : []); } catch { return new Set(); }
  };
  const hashId = hash => {
    try { const p = new URLSearchParams(hash.replace(/^#/, '')); const id = p.get('piece'); return validId(id) ? id : null; } catch { return null; }
  };
  const matches = (entry, state, saved) => (state.kind === 'all' || entry.kind === state.kind) && (state.collection === 'all' || entry.collection === state.collection) && (!state.saved || saved.has(entry.id)) && state.query.split(/\s+/).filter(Boolean).every(word => entry.searchText.includes(word));
  const prepare = manifest => {
    if (!manifest || !Array.isArray(manifest.entries) || !Array.isArray(manifest.collections)) throw new Error('Invalid collection manifest');
    const seen = new Set();
    const collections = manifest.collections.filter(c => c && validId(c.id) && typeof c.title === 'string');
    const names = new Map(collections.map(c => [c.id, c.title]));
    const entries = manifest.entries.filter(e => e && validId(e.id) && !seen.has(e.id) && seen.add(e.id) && typeof e.title === 'string' && asset(e.image) && ['preview','print-edition','vector-edition'].includes(e.kind)).map((e, i) => ({...e, index:i, image:asset(e.image), back:asset(e.back), download:asset(e.download), detail:asset(e.detail), collectionTitle:names.get(e.collection) || 'Collected artwork', searchText:normalize([e.title,e.description,e.region,e.family,e.caption,names.get(e.collection)].filter(Boolean).join(' '))}));
    if (!entries.length) throw new Error('No artwork in collection manifest');
    return {entries,collections};
  };
  return {validId,asset,normalize,parseFavorites,hashId,matches,prepare};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = GalleryData;
if (typeof document !== 'undefined') (() => {
  const $ = id => document.getElementById(id);
  const PAGE_SIZE = 36;
  const STORAGE_KEY = 'nouns-money-gallery-favorites-v1';
  const state = {query:'',kind:'all',collection:'all',saved:false,sort:'featured',page:1};
  let entries = [], filtered = [], lookup = new Map(), favorites = new Set(), storageAvailable = true, active = null, back = false, opener = null, loading = true, debounce;
  let randomOrder = new Map();
  const label = entry => entry.kind === 'print-edition' ? 'PDF print edition' : entry.kind === 'vector-edition' ? 'Vector print edition' : 'Archive preview';
  const el = (tag, className, text) => { const node = document.createElement(tag); if(className) node.className=className; if(text !== undefined) node.textContent=text; return node; };
  function readSaved() { try { favorites = GalleryData.parseFavorites(localStorage.getItem(STORAGE_KEY)); } catch { favorites = new Set(); storageAvailable=false; } }
  function persist() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify([...favorites])); } catch { storageAvailable=false; } updateSaved(); }
  function updateSaved() { $('saved-count').textContent=favorites.size; $('favorites').setAttribute('aria-pressed',String(state.saved)); $('save-note').textContent=storageAvailable ? 'Favorites live in this browser, on this device.' : 'Browser storage is unavailable. Favorites will last for this visit.'; }
  function shuffleOrder() { randomOrder=new Map(entries.map(e=>[e.id,Math.random()])); }
  function applyFilters(resetPage=true) {
    if(loading) return;
    if(resetPage) state.page=1;
    filtered=entries.filter(entry=>GalleryData.matches(entry,state,favorites));
    filtered.sort((a,b)=>state.sort==='title' ? a.title.localeCompare(b.title) : state.sort==='shuffle' ? randomOrder.get(a.id)-randomOrder.get(b.id) : ((a.kind==='preview'?2:a.kind==='print-edition'?0:1)-(b.kind==='preview'?2:b.kind==='print-edition'?0:1)) || a.index-b.index);
    state.page=Math.min(state.page,Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)));
    render();
  }
  function render() {
    const gallery=$('gallery'), start=(state.page-1)*PAGE_SIZE, shown=filtered.slice(start,start+PAGE_SIZE);
    gallery.replaceChildren();
    shown.forEach((entry,i)=> {
      const card=el('article','art-card'); card.style.setProperty('--i',Math.min(i,10));
      const open=el('button','art-open'); open.type='button'; open.setAttribute('aria-label',`Explore ${entry.title}`);
      const visual=el('div','art-image');
      const image=el('img'); image.src=entry.image; image.alt=entry.title; image.loading=i<3?'eager':'lazy'; image.decoding='async';
      if(Number.isFinite(entry.width) && Number.isFinite(entry.height) && entry.width>0 && entry.height>0) {image.width=entry.width;image.height=entry.height;}
      image.addEventListener('error',()=> {image.remove();visual.append(el('span','image-missing','Image unavailable'));},{once:true});
      visual.append(image);
      const caption=el('div','art-caption'); caption.append(el('span','art-kicker',entry.region||entry.collectionTitle),el('span','art-title',entry.title));
      const meta=el('span','art-meta'); meta.append(el('span','format-dot'),document.createTextNode(label(entry))); caption.append(meta);
      open.append(visual,caption); open.addEventListener('click',()=>openPiece(entry.id,open));
      const save=el('button','card-save',favorites.has(entry.id)?'♥':'♡'); save.type='button'; save.setAttribute('aria-label',`${favorites.has(entry.id)?'Unsave':'Save'} ${entry.title}`); save.setAttribute('aria-pressed',String(favorites.has(entry.id)));
      save.addEventListener('click',()=> {toggleSaved(entry); if(state.saved){applyFilters(false);$('favorites').focus();}else{save.textContent=favorites.has(entry.id)?'♥':'♡';save.setAttribute('aria-pressed',String(favorites.has(entry.id)));save.setAttribute('aria-label',`${favorites.has(entry.id)?'Unsave':'Save'} ${entry.title}`);}});
      card.append(open,save); gallery.append(card);
    });
    gallery.setAttribute('aria-busy','false');
    const total=filtered.length, end=Math.min(start+PAGE_SIZE,total);
    $('result-status').textContent=total?`${start+1}–${end} of ${total.toLocaleString()} ${state.saved?'saved ':''}artwork entries`:'No artwork matches this view';
    $('empty').hidden=total>0;
    $('empty-title').textContent=state.saved&&favorites.size===0?'A little space for your favorites.':'A world still waiting to be found.';
    $('empty-copy').textContent=state.saved&&favorites.size===0?'Tap a heart on any artwork to keep it here. Saved on this device.':'Try a different word or open up your filters.';
    $('reset').hidden=!state.query&&state.kind==='all'&&state.collection==='all'&&!state.saved;
    $('pagination').hidden=total<=PAGE_SIZE; $('page-status').textContent=`${state.page} / ${Math.max(1,Math.ceil(total/PAGE_SIZE))}`;
    $('previous').disabled=state.page===1; $('next').disabled=end>=total; $('surprise').disabled=!total;
    document.querySelectorAll('[data-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.kind===state.kind)));
    updateSaved();
  }
  function reset() {
    clearTimeout(debounce);Object.assign(state,{query:'',kind:'all',collection:'all',saved:false,page:1});$('search').value='';$('collection').value='all';applyFilters();
  }
  function toggleSaved(entry) { if(favorites.has(entry.id)) favorites.delete(entry.id); else favorites.add(entry.id);persist();if(active?.id===entry.id) updatePieceSave(); }
  function updatePieceSave() { const saved=favorites.has(active.id);$('piece-save').textContent=saved?'♥ Saved to favorites':'♡ Save to favorites';$('piece-save').setAttribute('aria-pressed',String(saved)); }
  function setHash(id) { const url=new URL(location.href);url.hash=id?`piece=${encodeURIComponent(id)}`:'';try{history.replaceState(null,'',url);}catch{} }
  function imageFace() {
    const img=$('piece-image');img.hidden=false;$('piece-image-error').hidden=true;
    img.style.animation='none';void img.offsetWidth;img.style.animation='';
    img.src=back&&active.back?active.back:active.image;img.alt=`${active.title}${active.back?back?' — back':' — front':''}`;
    $('face-label').textContent=active.back?(back?'Back / 02':'Front / 01'):active.kind==='preview'?'Archive image':'Artwork';
    $('flip').textContent=back?'Back to the front ↻':'Turn it over ↻';$('flip').setAttribute('aria-label',back?'Show front of artwork':'Show back of artwork');
  }
  function addSpec(title,value) {const row=el('div');row.append(el('dt','',title),el('dd','',value));$('piece-specs').append(row);}
  function downloadLink(text,url,download=true,secondary=false) {if(!url)return;const link=el('a',`download-link${secondary?' secondary':''}`,text);link.href=url;if(download)link.setAttribute('download','');link.append(el('span','','↗'));$('piece-downloads').append(link);}
  function paintPiece() {
    $('piece-collection').textContent=active.collectionTitle;$('piece-kind').textContent=label(active);$('piece-title').textContent=active.title;$('piece-description').textContent=active.description||'A study from the Nouns Money collection.';
    $('piece-region').textContent=[active.region,active.family].filter(Boolean).join(' / ');$('piece-region').hidden=!$('piece-region').textContent;
    $('piece-notice').textContent=active.printNotice||active.previewNotice||'Collectible art. No cash value.';$('piece-status').textContent=active.status||'';
    $('piece-specs').replaceChildren();
    if(Array.isArray(active.trimMm)&&active.trimMm.length===2)addSpec('Trim size',`${active.trimMm[0]} × ${active.trimMm[1]} mm`);
    if(active.printReady){addSpec('Bleed',active.bleedMm?`${active.bleedMm} mm`:'None');addSpec('Physical proof',active.physicalPrintProof?'Completed':'Still required');addSpec('Faces',active.back?'Front + back':'Single image');}
    else {addSpec('File type','Review preview');addSpec('Print master','Not available here');}
    $('piece-downloads').replaceChildren();
    if(active.download){
      if(active.kind==='vector-edition'){downloadLink('Download front · SVG',active.download);if(active.back?.toLowerCase().endsWith('.svg'))downloadLink('Download back · SVG',active.back,true,true);downloadLink('Open craft print sheet',active.detail,false,true);}
      else downloadLink(`Download print master · PDF${active.downloadBytes?' / '+(active.downloadBytes/1000000).toFixed(1)+' MB':''}`,active.download);
    }
    $('flip').hidden=!active.back;back=false;imageFace();updatePieceSave();$('feedback').textContent='';$('share-fallback').hidden=true;
    const position=filtered.findIndex(e=>e.id===active.id);$('piece-position').textContent=position>=0?`${position+1} / ${filtered.length}`:'From the open collection';
    const sequence=filtered.some(e=>e.id===active.id)?filtered:entries;
    $('piece-prev').disabled=sequence.length<2;$('piece-next').disabled=sequence.length<2;
  }
  function openPiece(id,source,writeHash=true) {
    if(!lookup.has(id))return;
    active=lookup.get(id);if(source)opener=source;paintPiece();
    if(!$('inspector').open){$('inspector').showModal();document.body.classList.add('modal-open');$('close').focus();}
    $('inspector').scrollTop=0;if(writeHash)setHash(id);
  }
  function movePiece(delta) {if(!active)return;const sequence=filtered.some(e=>e.id===active.id)?filtered:entries;const i=sequence.findIndex(e=>e.id===active.id);openPiece(sequence[(i+delta+sequence.length)%sequence.length].id);}
  function followHash() {
    const params=new URLSearchParams(location.hash.replace(/^#/,'')), collection=params.get('collection');
    if(collection && GalleryData.validId(collection) && [...$('collection').options].some(option=>option.value===collection)) {
      state.collection=collection;state.kind='all';state.saved=false;state.query='';$('collection').value=collection;$('search').value='';applyFilters();
      $('explore').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
    const id=GalleryData.hashId(location.hash);if(id&&lookup.has(id))openPiece(id,null,false);else if($('inspector').open)$('inspector').close();else if(location.hash.startsWith('#piece='))$('result-status').textContent='That artwork link is unavailable. Explore the collection below.';
  }
  $('filters').addEventListener('submit',e=>e.preventDefault());
  $('search').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>{state.query=GalleryData.normalize($('search').value.trim()).slice(0,150);applyFilters();},140);});
  $('collection').addEventListener('change',()=>{state.collection=$('collection').value;applyFilters();});
  $('sort').addEventListener('change',()=>{state.sort=$('sort').value;if(state.sort==='shuffle')shuffleOrder();applyFilters();});
  document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>{state.kind=button.dataset.kind;applyFilters();}));
  $('favorites').addEventListener('click',()=>{state.saved=!state.saved;applyFilters();});
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
  for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{state.page+=delta;applyFilters(false);$('result-status').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  $('surprise').addEventListener('click',()=>{if(filtered.length)openPiece(filtered[Math.floor(Math.random()*filtered.length)].id,$('surprise'));});
  $('close').addEventListener('click',()=>$('inspector').close());
  $('inspector').addEventListener('close',()=>{document.body.classList.remove('modal-open');setHash(null);if(opener?.isConnected)opener.focus();else $('surprise').focus();active=null;opener=null;});
  $('piece-image').addEventListener('error',()=>{$('piece-image').hidden=true;$('piece-image-error').hidden=false;});
  $('flip').addEventListener('click',()=>{if(active?.back){back=!back;imageFace();}});
  $('piece-prev').addEventListener('click',()=>movePiece(-1));$('piece-next').addEventListener('click',()=>movePiece(1));
  $('piece-save').addEventListener('click',()=>{if(active){toggleSaved(active);applyFilters(false);}});
  $('inspector').addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowLeft'){e.preventDefault();movePiece(-1);}if(e.key==='ArrowRight'){e.preventDefault();movePiece(1);}});
  $('share').addEventListener('click',async()=>{if(!active)return;setHash(active.id);const link=location.href;try{await navigator.clipboard.writeText(link);$('feedback').textContent='Link copied. Send a little possibility.';}catch{$('share-fallback').value=link;$('share-fallback').hidden=false;$('share-fallback').focus();$('share-fallback').select();$('feedback').textContent='Copy the artwork link below.';}});
  window.addEventListener('hashchange',()=>{if(!loading)followHash();});
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){favorites=GalleryData.parseFavorites(e.newValue);favorites=new Set([...favorites].filter(id=>lookup.has(id)));updateSaved();if(!loading){applyFilters(false);if(active)updatePieceSave();}}});
  async function init() {
    readSaved();
    try {
      const response=await fetch('/nouns-money/collected/manifest.json');if(!response.ok)throw new Error('Collection unavailable');const data=GalleryData.prepare(await response.json());entries=data.entries;lookup=new Map(entries.map(e=>[e.id,e]));favorites=new Set([...favorites].filter(id=>lookup.has(id)));shuffleOrder();
      for(const collection of data.collections){const count=entries.filter(e=>e.collection===collection.id).length;if(!count)continue;const option=el('option','',`${collection.title} (${count})`);option.value=collection.id;$('collection').append(option);}
      $('collection-total').textContent=`${entries.length.toLocaleString()} entries · ${data.collections.filter(c=>entries.some(e=>e.collection===c.id)).length} collections`;
      $('count-all').textContent=entries.length;for(const kind of ['preview','print-edition','vector-edition'])$(`count-${kind}`).textContent=entries.filter(e=>e.kind===kind).length;
      loading=false;applyFilters();followHash();
    } catch(error) {
      $('gallery').setAttribute('aria-busy','false');$('result-status').textContent='The collection could not be loaded.';$('collection-total').textContent='A moment between worlds';$('empty').hidden=false;$('empty-title').textContent='The library is taking a moment.';$('empty-copy').textContent='Please reload this page to try again. You can also explore the paper studio.';$('empty-reset').textContent='Reload the collection ↗';$('empty-reset').removeEventListener('click',reset);$('empty-reset').addEventListener('click',()=>location.reload());$('filters').inert=true;document.querySelector('.filter-bottom').inert=true;
    }
  }
  init();
})();
