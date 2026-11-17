(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let data, nounSource;
  try { data = JSON.parse($('episode-data').textContent); nounSource = JSON.parse($('noun-svg-data').textContent); }
  catch (_) { if ($('save-status')) $('save-status').textContent = 'The episode content could not be loaded.'; return; }
  const KEY = 'traveling-trapper:TT-001:v2', LEGACY_KEY = 'traveling-trapper:TT-001:v1', NS = 'http://www.w3.org/2000/svg';
  const kinds = data.part_types.map(p => p.id), concepts = new Map(data.concepts.map(c => [c.id, c]));
  const rounds = new Map(data.rounds.map(r => [r.id, r]));
  const typeOf = id => data.part_types.find(p => p.id === id);
  const constraints = { 'more-shade': 'More shade', 'quiet-corner': 'A quiet corner', 'night-market': 'A night market', 'rainy-day': 'A rainy day' };
  const presets = { 'sunroom': [0, 3, 6, 4, 1], 'long-table': [1, 3, 8, 4, 5], 'play-yard': [0, 2, 6, 8, 4] };
  const colors = { shade: '#ffd15c', seating: '#ef654d', water: '#a8c7e1', table: '#abd7bd', activity: '#c3b9dc' };
  const paths = {
    shade: 'M3 13L12 4L21 13ZM12 13V21M6 21H18',
    seating: 'M5 4V15H19V8M5 11H19M7 15V21M17 15V21',
    water: 'M12 3C10 7 5 11 5 15A7 7 0 0 0 19 15C19 11 14 7 12 3ZM8 15C8 18 10 19 12 19',
    table: 'M3 9H21V12H3ZM6 12V21M18 12V21',
    activity: 'M12 3L15 9L22 10L17 15L18 22L12 19L6 22L7 15L2 10L9 9Z'
  };
  const node = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const button = (cls, text, action) => { const b = node('button', cls, text); b.type = 'button'; b.addEventListener('click', action); return b; };
  const icon = kind => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'part-icon'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('width', '28'); s.setAttribute('height', '28'); const p = document.createElementNS(NS, 'path'); Object.entries({ d: paths[kind], fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }).forEach(([k,v]) => p.setAttribute(k,v)); s.append(p); return s; };
  const fresh = (id = data.concepts[0].id) => ({ v: 2, roundId: 'day', conceptId: id, selectedPart: kinds[0], layout: Object.fromEntries(kinds.map((k,i) => [k, presets[id][i]])), variants: Object.fromEntries(kinds.map(k => [k,id])), constraint: 'more-shade', picked: false });
  // Only this known-field boundary admits saved or shared state into the editor.
  function normalizeState(s) {
    const object = value => value && typeof value === 'object' && !Array.isArray(value);
    if (!object(s) || ![1,2].includes(s.v)) throw new Error('Unsupported arrangement version.');
    if (!concepts.has(s.conceptId) || !kinds.includes(s.selectedPart)) throw new Error('Unknown concept or selected part.');
    if (!object(s.layout) || !object(s.variants)) throw new Error('The five parts need positions and variants.');
    if (!kinds.every(k => Object.hasOwn(s.layout,k) && Number.isInteger(s.layout[k]) && s.layout[k] >= 0 && s.layout[k] < 9)) throw new Error('Each part needs a cell from 1 to 9.');
    if (new Set(kinds.map(k => s.layout[k])).size !== kinds.length) throw new Error('Two parts cannot occupy the same cell.');
    if (!kinds.every(k => Object.hasOwn(s.variants,k) && concepts.has(s.variants[k]))) throw new Error('The arrangement contains an unknown part variant.');
    if (typeof s.constraint !== 'string' || !Object.hasOwn(constraints,s.constraint) || typeof s.picked !== 'boolean') throw new Error('Invalid constraint or local-pick state.');
    const roundId = s.v === 1 ? 'day' : s.roundId;
    if (!rounds.has(roundId)) throw new Error('Unknown design round.');
    return { v:2, roundId, conceptId:s.conceptId, selectedPart:s.selectedPart, layout:Object.fromEntries(kinds.map(k => [k,s.layout[k]])), variants:Object.fromEntries(kinds.map(k => [k,s.variants[k]])), constraint:s.constraint, picked:s.picked };
  }
  function designKey(s) { return JSON.stringify([s.roundId,s.conceptId,s.constraint,kinds.map(k=>[s.layout[k],s.variants[k]])]); }
  function parseBundle(text) {
    if (typeof text !== 'string' || text.length > 102400 || new TextEncoder().encode(text).length > 102400) throw new Error('Choose a JSON file no larger than 100 KB.');
    let value; try { value=JSON.parse(text); } catch (_) { throw new Error('This file does not contain valid JSON.'); }
    if (!value || !['traveling-trapper-remix/1','traveling-trapper-remix/2'].includes(value.schema) || value.episode_id !== 'TT-001') throw new Error('Choose a TT-001 arrangement exported by this editor.');
    return normalizeState(value.editor_state);
  }
  function encodeRemix(s) { const encoded=encodeURIComponent(JSON.stringify({...normalizeState(s),picked:false})); if(encoded.length>4096)throw new Error('This arrangement is too large for a share link.');return encoded; }
  function decodeRemix(fragment) {
    if (!fragment.startsWith('#remix=')) throw new Error('This is not an arrangement link.');
    const encoded=fragment.slice(7);if(!encoded || encoded.length>4096)throw new Error('The arrangement link is empty or too long.');
    let value;try{value=JSON.parse(decodeURIComponent(encoded));}catch(_){throw new Error('The arrangement link is incomplete or malformed.');}
    if(value?.v!==2)throw new Error('This link uses an unsupported arrangement version.');return normalizeState(value);
  }
  // End of the pure state boundary; imports remain staged until Apply is chosen.
  let state = fresh(), saveMessage = 'Local draft · choose a concept and arrange its five parts.', toastTimer, previewURL;
  try {
    let raw=localStorage.getItem(KEY),fromLegacy=false;
    if(raw===null){raw=localStorage.getItem(LEGACY_KEY);fromLegacy=raw!==null;}
    if(raw!==null){const saved=JSON.parse(raw);state=normalizeState(saved);saveMessage=state.picked?'Restored your pick from this browser.':'Restored your local draft.';if(fromLegacy||saved.v===1){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}}
  } catch (_) { state=fresh();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}saveMessage='A fresh local draft is ready; the previous save could not be restored.'; }
  const base = () => concepts.get(state.conceptId);
  const round = () => rounds.get(state.roundId);
  const variant = kind => concepts.get(state.variants[kind]).parts.find(p => p.id === kind);
  const mixed = () => kinds.some(k => state.variants[k] !== state.conceptId);
  const at = cell => kinds.find(k => state.layout[k] === cell);
  function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4200); }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); saveMessage = state.picked ? 'Your pick is saved on this browser · ready to copy to Loom.' : 'Draft saved on this browser.'; } catch (_) { saveMessage = 'Working in memory; this browser could not save the draft.'; } }
  function commit(change, focusSelector) { const before=designKey(state);change();if(designKey(state)!==before)state.picked=false;persist();render();if(focusSelector)document.querySelector(focusSelector)?.focus(); }
  function movePart(kind, cell) { if(state.layout[kind]===cell){toast(`${typeOf(kind).name} is already in cell ${cell+1}.`);return;}commit(() => { const other = at(cell), old = state.layout[kind]; if (other) state.layout[other] = old; state.layout[kind] = cell; state.selectedPart = kind; }, `.plan-cell[data-cell="${cell}"]`); toast(`${typeOf(kind).name} moved to cell ${cell + 1}.`); }
  function dragPart(b, kind) { b.draggable = true; b.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', kind); e.dataTransfer.effectAllowed = 'move'; }); }
  function renderConcept() {
    const c = base(), picker = $('concept-picker'); picker.replaceChildren();
    const captions = { 'sunroom': 'Quiet company', 'long-table': 'Make together', 'play-yard': 'Meet through play' };
    data.concepts.forEach(choice => { const b = button('concept-choice', '', () => commit(() => { const {constraint,roundId,picked}=state;state={...fresh(choice.id),constraint,roundId,picked}; }, `.concept-choice[data-concept="${choice.id}"]`)); b.append(node('strong','',choice.name),node('small','',captions[choice.id])); b.dataset.concept = choice.id; b.classList.toggle('is-selected', c.id === choice.id); b.setAttribute('aria-pressed', String(c.id === choice.id)); picker.append(b); });
    $('concept-name').textContent = c.name; $('concept-pitch').textContent = c.pitch;
    $('concept-tradeoffs').replaceChildren(...c.tradeoffs.map(t => node('li', '', t)));
    $('concept-benefits').replaceChildren(node('p', '', `Rearrange: ${c.rearrange_benefit}`), node('p', '', `Replace: ${c.replace_benefit}`));
    $('remix-label').textContent = mixed() ? `${c.name} · mixed parts` : `${c.name} · original parts`;
    $('remix-label').classList.toggle('is-mixed', mixed());
  }
  function renderParts() {
    const tray = $('part-tray'); tray.replaceChildren();
    kinds.forEach(kind => { const p = variant(kind), b = button('part-button', '', () => commit(() => { state.selectedPart = kind; }, `.part-button[data-part="${kind}"]`, true)); b.dataset.part = kind; b.classList.toggle('is-selected', kind === state.selectedPart); b.setAttribute('aria-pressed', String(kind === state.selectedPart)); b.append(icon(kind), node('span','part-title',typeOf(kind).name), node('span','part-meta',p.name)); dragPart(b,kind); tray.append(b); });
    const kind = state.selectedPart, p = variant(kind), detail = $('part-detail'); detail.replaceChildren(node('h3','',p.name),node('p','',p.description),node('p','part-meta',`${typeOf(kind).name} · from ${concepts.get(state.variants[kind]).name} · cell ${state.layout[kind]+1}`));
    $('part-round-note').textContent = round().part_prompts[kind];
    const options = $('part-options'); options.replaceChildren();
    data.concepts.forEach(c => { const choice = c.parts.find(p => p.id === kind), b = button('part-option', '', () => commit(() => { state.variants[kind] = c.id; }, `.part-option[data-variant="${c.id}"]`)); b.dataset.part = kind; b.dataset.variant = c.id; b.classList.toggle('is-selected', c.id === state.variants[kind]); b.setAttribute('aria-pressed',String(c.id === state.variants[kind])); b.append(node('span','part-title',choice.name),node('span','part-meta',`From ${c.name}`)); options.append(b); });
  }
  function renderGrid() {
    const grid = $('plan-grid'); grid.replaceChildren(); grid.setAttribute('role','group'); grid.setAttribute('aria-label','Nine-cell conceptual arrangement. Select a part, then choose a cell.');
    for (let cell = 0; cell < 9; cell++) {
      const kind = at(cell), b = button('plan-cell', '', () => movePart(state.selectedPart, cell)); b.dataset.cell = String(cell); b.classList.toggle('is-empty', !kind); b.classList.toggle('is-selected', kind === state.selectedPart); b.setAttribute('aria-pressed', String(kind === state.selectedPart));
      b.setAttribute('aria-label', `Cell ${cell+1}, row ${Math.floor(cell/3)+1}, column ${cell%3+1}: ${kind ? variant(kind).name : 'empty'}. Move ${typeOf(state.selectedPart).name} here${kind && kind !== state.selectedPart ? ' and exchange positions' : ''}.`);
      b.append(node('span','plan-number',String(cell+1).padStart(2,'0')));
      if (kind) { b.dataset.part = kind; b.append(icon(kind), node('span','plan-name',variant(kind).name)); dragPart(b,kind); } else b.append(node('span','plan-name','Place here'));
      b.addEventListener('dragover',e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }); b.addEventListener('drop',e => { e.preventDefault(); const dragged = e.dataTransfer.getData('text/plain'); if (kinds.includes(dragged)) movePart(dragged,cell); });
      b.addEventListener('keydown', e => { const offsets = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3}; if (Object.hasOwn(offsets,e.key)) { e.preventDefault(); const next = cell + offsets[e.key]; if (next >= 0 && next < 9) grid.querySelector(`[data-cell="${next}"]`).focus(); } }); grid.append(b);
    }
  }
  function renderRound() {
    const r=round();document.documentElement.dataset.round=r.id;
    document.querySelectorAll('#round-picker button[data-round]').forEach(b=>{const active=b.dataset.round===r.id;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));});
    $('round-kicker').textContent=r.kicker;$('round-title').textContent=r.name;$('round-prompt').textContent=r.prompt;$('round-brief').textContent=r.brief;
    $('round-checklist').replaceChildren(...r.checklist.map(question=>node('li','',question)));
    $('hero-line-two').textContent=r.id==='night-market'?'After dark.':'Make a place.';$('hero-deck').textContent=r.id==='night-market'?'Five familiar parts, one evening invitation. Make room to gather, watch a repair, or sit at the quieter edge.':'Shade. A seat. Water. A shared table. Something to do. Borrow a part, move it around, and make a place you would come back to.';
    $('night-starter').disabled=!rounds.get('night-market')?.starter;$('night-starter').hidden=r.id!=='night-market'||!r.starter;
  }
  function shareText() {
    const lines = [`TT-001 · The Traveling Trapper`, `Five Parts Make a Place · ${round().name}`, `${state.picked ? 'My local pick' : 'My draft'}: ${base().name}${mixed() ? ' — mixed parts' : ''}`, '', 'Five parts:'];
    kinds.forEach(k => lines.push(`${typeOf(k).name}: ${variant(k).name} (from ${concepts.get(state.variants[k]).name})`));
    lines.push('', 'Arrangement — cells 1–9 run left to right, top to bottom:');
    for (let i=0;i<9;i++) lines.push(`${i+1}: ${at(i) ? variant(at(i)).name : 'Open cell'}`);
    lines.push('', `Next constraint: ${constraints[state.constraint]}.`, 'Speculative El Segundo clubhouse; no real site selected.', 'Prepared locally for sharing.'); return lines.join('\n');
  }
  function bundle() { return { schema: 'traveling-trapper-remix/2', episode_id: 'TT-001', title: data.metadata.episode_title, status: 'Speculative design exercise', round:{id:round().id,name:round().name,prompt:round().prompt}, base_concept: base().name, local_pick: state.picked, next_constraint: {id:state.constraint,label:constraints[state.constraint]}, parts:kinds.map(k => ({ id:k, ...variant(k), source_concept_id:state.variants[k], source_concept:concepts.get(state.variants[k]).name, cell:state.layout[k]+1, row:Math.floor(state.layout[k]/3)+1, column:state.layout[k]%3+1 })), references:data.references, editor_state:normalizeState(state), share_text:shareText() }; }
  const xml = s => String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function wrap(text, limit) { const out=[]; let line=''; String(text).split(/\s+/).forEach(word => { if (line && (line+' '+word).length>limit) {out.push(line);line=word;} else line+=(line?' ':'')+word; }); if(line)out.push(line);return out; }
  function svgText(text,x,y,size=20,color='#07152f',extra='') { return `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" ${extra}>${xml(text)}</text>`; }
  let hostSVG = '';
  try {
    const doc = new DOMParser().parseFromString(nounSource,'image/svg+xml'), s = doc.documentElement;
    if (s.localName === 'svg' && !doc.querySelector('parsererror')) {
      s.querySelectorAll('script,foreignObject,image,use,style').forEach(n => n.remove());
      [s,...s.querySelectorAll('*')].forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name)||/href$/i.test(a.name)||/url\s*\(/i.test(a.value)) n.removeAttribute(a.name); }));
      if(!s.hasAttribute('viewBox')) s.setAttribute('viewBox',`0 0 ${parseFloat(s.getAttribute('width'))||320} ${parseFloat(s.getAttribute('height'))||320}`);
      s.setAttribute('x','1016');s.setAttribute('y','42');s.setAttribute('width','112');s.setAttribute('height','112'); hostSVG=new XMLSerializer().serializeToString(s);
    }
  } catch (_) {}
  function postcardSVG() {
    const night=state.roundId==='night-market',ink=night?'#f4f1e8':'#07152f',muted=night?'#aebdcb':'#586574',panel=night?'#10243a':'#f4f1e8';
    let out=`<svg xmlns="${NS}" width="1200" height="900" viewBox="0 0 1200 900"><title>${xml(base().name)} — ${xml(round().name)}</title><desc>${xml(shareText())}</desc><rect width="1200" height="900" fill="#07152f"/><rect x="48" y="186" width="1104" height="632" rx="20" fill="${panel}"/>`;
    out+=svgText('THE TRAVELING TRAPPER / TT-001',72,62,15,'#ffd15c','letter-spacing="3"')+svgText(night?'Five Parts. After Dark.':'Five Parts Make a Place',72,123,47,'#f4f1e8')+svgText(`${round().name} · an imagined El Segundo clubhouse`,74,155,18,'#b6c4d1')+hostSVG;
    if(night){out+='<path d="M72 173Q600 185 1128 173" fill="none" stroke="#ffd15c" stroke-width="1" opacity=".5"/>';[120,260,400,540,680,820,960,1100].forEach((x,i)=>{out+=`<circle cx="${x}" cy="${i===0||i===7?175:179}" r="4" fill="#ffd15c"/>`;});}
    out+=svgText(night?'THE SAME FIVE PARTS / AFTER SUNSET':'FIVE PARTS. ONE EDITABLE ARRANGEMENT.',80,223,12,muted,'letter-spacing="1"');
    for(let i=0;i<9;i++) {
      const x=80+(i%3)*172,y=245+Math.floor(i/3)*172,k=at(i),fill=k?colors[k]:(night?'#1b3146':'#e5e6df');
      out+=`<rect x="${x}" y="${y}" width="160" height="160" rx="11" fill="${fill}"/>`+svgText(String(i+1).padStart(2,'0'),x+13,y+23,11,k?'#43505d':muted);
      if(k) {out+=`<g transform="translate(${x+59} ${y+41}) scale(1.75)"><path d="${paths[k]}" fill="none" stroke="#07152f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`;wrap(variant(k).name,18).slice(0,2).forEach((line,j)=>{out+=svgText(line,x+80,y+119+j*21,16,'#07152f','text-anchor="middle"');});}
      else out+=svgText('Open cell',x+80,y+90,15,muted,'text-anchor="middle"');
    }
    out+=svgText(base().name,640,253,38,ink)+svgText(mixed()?'MIXED PARTS / ORIGINAL PROPOSAL':'ORIGINAL PARTS / YOUR ARRANGEMENT',642,280,11,muted,'letter-spacing="1"');
    wrap(night?round().brief:base().pitch,night?43:40).forEach((line,j)=>{out+=svgText(line,642,325+j*25,night?19:21,ink);});
    kinds.forEach((k,i)=>{const y=451+i*49;out+=`<circle cx="650" cy="${y-5}" r="6" fill="${colors[k]}" stroke="${muted}" stroke-width=".5"/>`+svgText(variant(k).name,669,y,18,ink)+svgText(`${typeOf(k).name} · from ${concepts.get(state.variants[k]).name}`,669,y+18,11,muted);});
    out+=svgText('NEXT CONSTRAINT',642,724,11,muted,'letter-spacing="1"')+svgText(constraints[state.constraint],642,754,25,ink)+svgText('Conceptual grid · not a site plan',80,790,12,muted);
    out+=svgText('SPECULATIVE / NO REAL SITE SELECTED',72,852,13,'#ffd15c','letter-spacing="1"')+svgText('The Loom Broadcaster · Team Terra',72,879,13,'#b6c4d1')+svgText('Reference accounts: WOHA + Serpentine / Counterspace',1128,879,12,'#b6c4d1','text-anchor="end"');
    return out+`<metadata>${xml(JSON.stringify({episode:'TT-001',round:state.roundId,sources:data.references.map(r=>r.source_url)}))}</metadata></svg>`;
  }
  function renderPostcard() {
    try { const url=URL.createObjectURL(new Blob([postcardSVG()],{type:'image/svg+xml;charset=utf-8'})), img=node('img','postcard-image'); img.alt=`Speculative ${base().name} postcard for ${round().name}, showing the current five-part arrangement.`;img.width=1200;img.height=900;img.src=url;$('postcard-preview').replaceChildren(img);if(previewURL)URL.revokeObjectURL(previewURL);previewURL=url; }
    catch (_) { $('postcard-preview').textContent='The preview could not be displayed. Your arrangement remains available as text and JSON.'; }
  }
  function arrangementURL() { if(!/^https?:$/.test(window.location.protocol))throw new Error('Open the hosted preview to copy a reusable arrangement link.');return window.location.origin+window.location.pathname+'#remix='+encodeRemix(state); }
  function render() { renderRound();renderConcept();renderParts();renderGrid();$('next-constraint').value=state.constraint;$('save-status').textContent=saveMessage;$('share-text').value=shareText();try{$('remix-link').value=arrangementURL();}catch(error){$('remix-link').value=error.message;}renderPostcard(); }
  async function copy(text, origin, preferredArea) {
    try { if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(text);toast('Copied. Ready to paste.'); }
    catch (_) { let area=preferredArea||$('share-text');if(area.value!==text){area=origin.parentElement.querySelector('.copy-fallback');if(!area){area=node('textarea','copy-fallback');area.readOnly=true;area.rows=5;area.setAttribute('aria-label','Text ready to copy');origin.parentElement.append(area);}area.value=text;}const details=area.closest('details');if(details)details.open=true;area.focus();area.select();toast('Text selected. Use your device’s Copy command.'); }
  }
  function download(blob, filename) { const url=URL.createObjectURL(blob), a=node('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000); }
  function safeDownload(make, name) { try {download(make(),name);toast('Download prepared.');}catch(_){toast('Download could not start. Your local draft is still available.');} }
  function pngDownload() {
    let url;try{url=URL.createObjectURL(new Blob([postcardSVG()],{type:'image/svg+xml;charset=utf-8'}));const img=new Image();
      img.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');context.drawImage(img,0,0);canvas.toBlob(blob=>{if(blob){try{download(blob,'TT-001-postcard.png');toast('PNG download prepared.');}catch(_){toast('The PNG download could not start. Try the SVG export.');}}else toast('PNG conversion was unavailable. Try the SVG export.');},'image/png');}catch(_){toast('PNG conversion was unavailable. Try the SVG export.');}finally{URL.revokeObjectURL(url);}};
      img.onerror=()=>{URL.revokeObjectURL(url);toast('The postcard could not be converted. Try the SVG export.');};img.src=url;
    }catch(_){if(url)URL.revokeObjectURL(url);toast('PNG conversion was unavailable. Try the SVG export.');}
  }
  function renderEditorial() {
    data.references.forEach(r=>{const card=node('article','source-card'),a=node('a','source-link','Read the primary source ↗');a.href=r.source_url;a.target='_blank';a.rel='noopener noreferrer';card.append(node('h3','',r.title),node('p','part-meta',`${r.creator} · ${r.location} · ${r.year}`),node('h4','','From the source'),node('p','source-fact',r.source_fact),node('h4','','Our interpretation'),node('p','source-interpretation',r.our_interpretation),a);$('source-cards').append(card);});
    data.broadcasts.forEach(b=>{const card=node('article','broadcast-card'),copyButton=button('small-button','Copy draft',()=>copy(b.text,copyButton));copyButton.setAttribute('aria-label',`Copy ${b.label.toLowerCase()} draft`);card.append(node('p','part-meta','UNPUBLISHED DRAFT'),node('h3','',b.label),node('p','broadcast-text',b.text),copyButton);$('broadcast-cards').append(card);});
  }
  let stagedImport=null, readSequence=0;
  function clearStage() { stagedImport=null;$('import-preview').hidden=true;$('apply-import').disabled=true; }
  function focusImport(target) { const tab=tabs.find(b=>b.dataset.tab.replace(/^panel-/,'')==='postcard');if(tab)activateTab(tab);target.tabIndex=-1;target.focus(); }
  function stageImport(candidate, origin) {
    stagedImport={...normalizeState(candidate),picked:false};const s=stagedImport,c=concepts.get(s.conceptId),r=rounds.get(s.roundId),summary=$('import-summary');
    summary.replaceChildren(node('h3','',`${r.name} · ${c.name}`),node('p','',`${origin} · review these five parts before applying the draft.`));
    const positions=node('ul','import-parts');
    for(let cell=0;cell<9;cell++){const kind=kinds.find(k=>s.layout[k]===cell);const from=kind?concepts.get(s.variants[kind]):null;const p=from?.parts.find(p=>p.id===kind);positions.append(node('li','',`Cell ${cell+1}: ${p?`${p.name} · from ${from.name}`:'Open cell'}`));}
    summary.append(positions,node('p','',`Next constraint: ${constraints[s.constraint]}.`),node('p','', 'Apply replaces the current draft. Choose your own local pick afterward.'));
    $('import-status').textContent='Arrangement validated and ready to review.';$('import-preview').hidden=false;$('apply-import').disabled=false;focusImport($('import-preview'));
  }
  function importError(error) { clearStage();$('import-status').textContent=`Import not applied: ${error.message}`;focusImport($('import-status')); }
  function readSharedLink() { if(!window.location.hash.startsWith('#remix='))return;readSequence++;try{stageImport(decodeRemix(window.location.hash),'Shared link');}catch(error){importError(error);} }
  async function readFile(file) {
    const request=++readSequence;clearStage();$('import-status').textContent='Reading the local JSON file…';
    try{if(file.size>102400)throw new Error('Choose a JSON file no larger than 100 KB.');const text=await file.text();if(request!==readSequence)return;stageImport(parseBundle(text),'JSON file');}
    catch(error){if(request===readSequence)importError(error);}
  }
  const tabs=[...document.querySelectorAll('button[data-tab]')];
  function activateTab(tab, focus=false) { tabs.forEach(b=>{const active=b===tab,key=b.dataset.tab.replace(/^panel-/,''),panel=$(`panel-${key}`);b.setAttribute('role','tab');b.id||=`tab-${key}`;b.setAttribute('aria-controls',`panel-${key}`);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;b.classList.toggle('is-selected',active);if(panel){panel.hidden=!active;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);}});if(focus)tab.focus(); }
  tabs.forEach((b,i)=>{b.addEventListener('click',()=>activateTab(b));b.addEventListener('keydown',e=>{let j;if(e.key==='ArrowRight')j=(i+1)%tabs.length;if(e.key==='ArrowLeft')j=(i+tabs.length-1)%tabs.length;if(e.key==='Home')j=0;if(e.key==='End')j=tabs.length-1;if(j!==undefined){e.preventDefault();activateTab(tabs[j],true);}});});
  document.querySelectorAll('button[data-open-tab]').forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.openTab.replace(/^panel-/,'');const tab=tabs.find(t=>t.dataset.tab.replace(/^panel-/,'')===target);if(tab)activateTab(tab,true);}));
  if(tabs.length){tabs[0].parentElement.setAttribute('role','tablist');activateTab(tabs.find(b=>b.getAttribute('aria-selected')==='true')||tabs[0]);}
  document.querySelectorAll('#round-picker button[data-round]').forEach(b=>b.addEventListener('click',()=>{if(rounds.has(b.dataset.round))commit(()=>{state.roundId=b.dataset.round;});}));
  $('night-starter').addEventListener('click',()=>{try{const starter=rounds.get('night-market').starter;const next=normalizeState({v:2,roundId:'night-market',selectedPart:kinds[0],picked:state.picked,...starter});commit(()=>{state=next;});toast('Night Market starter applied. Its five parts are ready to rearrange.');}catch(_){toast('The Night Market starter could not be loaded. Your arrangement is unchanged.');}});
  $('shuffle-layout').addEventListener('click',()=>commit(()=>{const cells=[0,1,2,3,4,5,6,7,8];for(let i=cells.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}kinds.forEach((k,i)=>{state.layout[k]=cells[i];});}));
  $('reset-concept').addEventListener('click',()=>commit(()=>{const {conceptId,constraint,roundId,picked}=state;state={...fresh(conceptId),constraint,roundId,picked};}));
  $('clear-saved').addEventListener('click',()=>{state=fresh();let cleared=true;[KEY,LEGACY_KEY].forEach(key=>{try{localStorage.removeItem(key);}catch(_){cleared=false;}});saveMessage=cleared?'Local saves cleared. A fresh draft is ready.':'A fresh draft is ready; browser storage could not be fully cleared.';render();toast(saveMessage);});
  $('next-constraint').addEventListener('change',e=>{const value=e.target.value;if(Object.hasOwn(constraints,value))commit(()=>{state.constraint=value;});});
  $('save-pick').addEventListener('click',()=>{commit(()=>{state.picked=true;},null,true);toast(saveMessage);});
  $('copy-share').addEventListener('click',()=>copy($('share-text').value,$('copy-share')));
  $('copy-remix-link').addEventListener('click',()=>{try{const url=arrangementURL();$('remix-link').value=url;copy(url,$('copy-remix-link'),$('remix-link'));}catch(error){$('import-status').textContent=error.message;toast(error.message);}});
  $('import-json').addEventListener('click',()=>{$('import-file').value='';$('import-file').click();});
  $('import-file').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)readFile(file);});
  $('apply-import').addEventListener('click',()=>{if(!stagedImport)return;const next=normalizeState(stagedImport);readSequence++;clearStage();commit(()=>{state={...next,picked:false};});$('import-status').textContent='Arrangement applied as a new local draft. Choose Save my pick when ready.';$('import-json').focus();toast(saveMessage);});
  $('cancel-import').addEventListener('click',()=>{readSequence++;clearStage();$('import-status').textContent='Import cancelled. Your current arrangement is unchanged.';$('import-json').focus();});
  $('download-svg').addEventListener('click',()=>safeDownload(()=>new Blob([postcardSVG()],{type:'image/svg+xml;charset=utf-8'}),'TT-001-postcard.svg'));
  $('download-png').addEventListener('click',pngDownload);
  $('download-json').addEventListener('click',()=>safeDownload(()=>new Blob([JSON.stringify(bundle(),null,2)+'\n'],{type:'application/json;charset=utf-8'}),'TT-001-remix.json'));
  window.addEventListener('hashchange',readSharedLink);
  renderEditorial();render();readSharedLink();
})();
