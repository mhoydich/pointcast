import {DEFAULT,THEMES,PALETTES,CAST,SEED_FIELDS,LIMITS,ASSET_SHA,TRAY_KEY,normalize,seal,verify,importDesign,encodeDesign,decodeDesign,nounSvg,nounName,readTray,addToTray,canonical} from './model.mjs';
import {compose} from './art.mjs';

const $=s=>document.querySelector(s);
let data,design,draft=structuredClone(DEFAULT),side='front',tray=[],revision=0,storageMode='local',busy=false;
const status=(message,error=false)=>{$('#status').textContent=message;$('#status').classList.toggle('error',error);};
function text(tag,content,className){const el=document.createElement(tag);el.textContent=content;if(className)el.className=className;return el;}
function setStorageMode(mode){
  storageMode=mode;
  const message=mode==='local'?'Your tray stays in this browser, on this device. Nothing is uploaded.':'Your tray is visit-only: browser storage is unavailable or unreadable. Export a design recipe to keep it.';
  $('.save-note').textContent=message;
  $('#tray-info').textContent=mode==='local'?'Saved in this browser only. Clearing browser data removes your tray. Export a design file to keep a portable copy.':message;
}
async function latestTray(){
  if(storageMode==='local'){
    try{return await readTray(localStorage.getItem(TRAY_KEY));}
    catch{setStorageMode('visit');}
  }return tray;
}
function writeTray(next){
  let persisted=false;
  if(storageMode==='local'){
    try{localStorage.setItem(TRAY_KEY,JSON.stringify(next));persisted=true;}
    catch{setStorageMode('visit');}
  }
  tray=next;$('#tray-count').textContent=tray.length;
  return persisted;
}
async function render({animate=false}={}){
  const request=++revision;
  const result=await seal(draft);
  if(request!==revision)return;
  design=result;
  $('#note').innerHTML=compose(design,data,side,'live');
  if(animate){$('#note').classList.remove('is-flipping');void $('#note').offsetWidth;$('#note').classList.add('is-flipping');}
  $('#design-title').textContent=THEMES[design.theme].name;
  $('#design-detail').textContent=`${nounName(design.asset.seed,data)} / ${design.edition.label.toLowerCase()}`;
  $('#selected-noun').textContent=`Selected: ${nounName(design.asset.seed,data)}. Exact original Nouns geometry.`;
  $('#front').setAttribute('aria-pressed',side==='front');$('#back').setAttribute('aria-pressed',side==='back');
  document.querySelectorAll('[data-cast]').forEach(el=>el.setAttribute('aria-pressed',SEED_FIELDS.every(k=>CAST[Number(el.dataset.cast)].seed[k]===design.asset.seed[k])));
  document.querySelectorAll('[data-theme]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.theme===design.theme));
  document.querySelectorAll('[data-palette]').forEach(el=>el.setAttribute('aria-pressed',['paper','ink','accent'].every(k=>PALETTES[Number(el.dataset.palette)][k]===design.colors[k])));
  $('#edition').value=design.edition.label;$('#edition-number').value=design.edition.number;
  updateSaveLabel();
}
function updateSaveLabel(){
  const saved=design&&tray.some(x=>canonical(x)===canonical(design));
  $('#save').textContent=saved?'✓ In your tray':'＋ Keep in my tray';
  $('#save').setAttribute('aria-pressed',String(Boolean(saved)));
}
function selectTab(name,focus=false){
  for(const tab of document.querySelectorAll('[role="tab"]')){
    const selected=tab.id==='tab-'+name;
    tab.setAttribute('aria-selected',selected);tab.tabIndex=selected?0:-1;
    $('#'+tab.getAttribute('aria-controls')).hidden=!selected;
    if(selected&&focus)tab.focus();
  }
}
function makeControls(){
  CAST.forEach((item,i)=>{
    const button=document.createElement('button');button.dataset.cast=i;
    button.setAttribute('aria-label',`Choose ${item.name} Noun`);button.setAttribute('aria-pressed','false');
    button.innerHTML=nounSvg(item.seed,data);button.firstElementChild.setAttribute('aria-hidden','true');
    button.append(text('span',item.name));button.addEventListener('click',async()=>{draft.asset.seed={...item.seed};await render();status(`${item.name} is on the press.`);});$('#cast').append(button);
  });
  for(const [key,t]of Object.entries(THEMES)){
    const button=document.createElement('button');button.dataset.theme=key;button.setAttribute('aria-pressed','false');
    button.append(text('b',t.mark));const copy=document.createElement('span');copy.append(text('strong',t.name),text('small',t.place));button.append(copy);
    button.addEventListener('click',async()=>{draft.theme=key;await render();status(`${t.name}. Turn the note over to see its world.`);});$('#themes').append(button);
  }
  PALETTES.forEach((p,i)=>{
    const button=document.createElement('button');button.dataset.palette=i;button.setAttribute('aria-pressed','false');
    for(const key of ['paper','ink','accent']){const swatch=document.createElement('i');swatch.style.backgroundColor=p[key];swatch.setAttribute('aria-hidden','true');button.append(swatch);}
    button.append(text('span',p.name));button.addEventListener('click',async()=>{draft.colors={paper:p.paper,ink:p.ink,accent:p.accent};await render();status(`${p.name}. Original Noun colors preserved.`);});$('#palettes').append(button);
  });
}
function showDialog(id){$(id).showModal();}
function inspect(){
  const specs=$('#specs');specs.replaceChildren();
  const pairs=[['Fingerprint',design.specimen.id],['Place',THEMES[design.theme].name],['Edition label',`${design.edition.label} / STUDY ${String(design.edition.number).padStart(2,'0')}`],['Trait seed',SEED_FIELDS.map(k=>`${k}: ${design.asset.seed[k]}`).join(' · ')],['Paper size','180 × 84 mm per face'],['Source commit',design.asset.sourceCommit],['Source SHA-256',design.asset.sourceSha256],['Artwork','Original Nouns parts / CC0'],['Fingerprint method','SHA-256 · first 48 bits · repeatable, not globally registered']];
  for(const [label,value]of pairs)specs.append(text('dt',label),text('dd',value));
  showDialog('#inspect-dialog');
}
function renderTray(){
  const grid=$('#tray-grid');grid.replaceChildren();$('#tray-count').textContent=tray.length;updateSaveLabel();
  if(!tray.length){const empty=document.createElement('div');empty.className='tray-empty';empty.append(text('b','✳'),text('p','Room for something good.'),text('span','Keep a design from the workshop to start your tray.','small-note'));grid.append(empty);return;}
  tray.forEach((item,i)=>{
    const card=document.createElement('article');card.className='tray-card';
    const preview=document.createElement('div');preview.innerHTML=compose(item,data,'front','tray-'+i);
    card.append(preview,text('h3',THEMES[item.theme].name),text('p',item.specimen.id));
    const actions=document.createElement('div');const open=text('button','Open design');const remove=text('button','Remove');
    open.addEventListener('click',async()=>{draft=normalize(item);side='front';await render();$('#tray-dialog').close();status('Design reopened. Make another variation, or take it to paper.');$('#inspect').focus();});
    remove.setAttribute('aria-label',`Remove ${THEMES[item.theme].name} ${item.specimen.id} from tray`);
    remove.addEventListener('click',async()=>{if(busy)return;busy=true;try{const fresh=await latestTray();const next=fresh.filter(x=>canonical(x)!==canonical(item));const persisted=writeTray(next);renderTray();$('#tray-status').textContent=persisted?'Design removed from this browser’s tray.':'Design removed from the visit-only tray.';const nextButton=$('#tray-grid button');(nextButton||$('#tray-dialog [data-close]')).focus();}finally{busy=false;}});
    actions.append(open,remove);card.append(actions);grid.append(card);
  });
}
function download(content,mime,filename){
  const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();const timer=setTimeout(()=>URL.revokeObjectURL(url),60000);timer.unref?.();
}
function prepareProof(){
  $('#print-front').innerHTML=compose(design,data,'front','proof');$('#print-back').innerHTML=compose(design,data,'back','proof');
  $('#proof-id').textContent=design.specimen.id+' · repeatable specimen fingerprint, not a registered serial';
}
async function loadImported(input){
  design=await verify(input);draft=normalize(design);side='front';await render();
  status('Design recipe opened. Save it to your tray when you are ready.');
}
function bind(){
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
  document.querySelectorAll('[role="tab"]').forEach(tab=>{
    tab.addEventListener('click',()=>selectTab(tab.id.slice(4)));
    tab.addEventListener('keydown',event=>{const list=['noun','place','ink'],idx=list.indexOf(tab.id.slice(4));let next;
      if(event.key==='ArrowRight')next=(idx+1)%3;else if(event.key==='ArrowLeft')next=(idx+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;
      event.preventDefault();selectTab(list[next],true);
    });
  });
  for(const face of ['front','back'])$('#'+face).addEventListener('click',async()=>{side=face;await render({animate:true});status(`Showing the ${face} of your specimen.`);});
  $('#shuffle').addEventListener('click',async()=>{
    const random=new Uint32Array(7);crypto.getRandomValues(random);
    const oldHead=draft.asset.seed.head;
    draft.asset.seed=Object.fromEntries(SEED_FIELDS.map((key,i)=>[key,random[i]%LIMITS[i]]));
    if(draft.asset.seed.head===oldHead)draft.asset.seed.head=(oldHead+1)%LIMITS[3];
    const palette=PALETTES[random[5]%PALETTES.length];draft.colors={paper:palette.paper,ink:palette.ink,accent:palette.accent};draft.theme=Object.keys(THEMES)[random[6]%3];
    side='front';await render({animate:true});status(`A new world: ${nounName(design.asset.seed,data)} in ${THEMES[design.theme].name}.`);
  });
  $('#edition').addEventListener('change',async()=>{
    const input=$('#edition'),value=input.value.toUpperCase().trim();
    if(!value||!/^[A-Z0-9 .&-]{1,28}$/.test(value)){input.setCustomValidity('Use 1–28 letters, numbers, spaces, periods, & or hyphens.');input.reportValidity();return;}
    input.setCustomValidity('');draft.edition.label=value;await render();status('Edition label updated.');
  });
  $('#edition').addEventListener('input',()=>$('#edition').setCustomValidity(''));
  $('#edition-number').addEventListener('change',async()=>{
    const input=$('#edition-number'),value=Number(input.value);if(!Number.isInteger(value)||value<1||value>99){input.setCustomValidity('Choose a whole study number from 1 to 99.');input.reportValidity();return;}
    input.setCustomValidity('');draft.edition.number=value;await render();status('Study number updated.');
  });
  $('#edition-number').addEventListener('input',()=>$('#edition-number').setCustomValidity(''));
  $('#inspect').addEventListener('click',inspect);
  $('#open-tray').addEventListener('click',async()=>{tray=await latestTray();renderTray();$('#tray-status').textContent='';showDialog('#tray-dialog');});
  $('#save').addEventListener('click',async()=>{
    if(busy)return;busy=true;$('#save').disabled=true;
    try{const snapshot=await seal(draft);const fresh=await latestTray();const next=addToTray(fresh,snapshot);const persisted=writeTray(next);updateSaveLabel();status(persisted?'Kept in your tray, on this device. Export the recipe for a portable copy.':'Kept for this visit only. Download the recipe to keep it after leaving.');}
    catch(error){status(error.message,true);}finally{busy=false;$('#save').disabled=false;}
  });
  $('#open-export').addEventListener('click',async()=>{await render();$('#export-side').textContent=`${side==='front'?'Front':'Back'} / editable SVG`;$('#export-status').textContent='';$('#share-fallback').hidden=true;showDialog('#export-dialog');});
  $('#download-svg').addEventListener('click',()=>{download(compose(design,data,side,'export'),'image/svg+xml',`${design.specimen.id}-${side}.svg`);$('#export-status').textContent='SVG download prepared. The original Noun pixels remain editable vector shapes.';});
  $('#download-json').addEventListener('click',()=>{download(JSON.stringify(design,null,2)+'\n','application/json',`${design.specimen.id}.json`);$('#export-status').textContent='Design recipe download prepared. Reopen it here with “Open a saved design.”';});
  $('#share').addEventListener('click',async()=>{
    const url=new URL(location.href);url.search='';url.hash='design='+encodeDesign(design);
    try{await navigator.clipboard.writeText(url.href);$('#export-status').textContent='Design link copied. The recipe is in the link; nothing was uploaded.';}
    catch{$('#share-fallback').hidden=false;$('#share-url').value=url.href;$('#share-url').focus();$('#share-url').select();$('#export-status').textContent='Copy the selected link. Nothing is uploaded.';}
  });
  $('#print-proof').addEventListener('click',()=>{prepareProof();$('#export-dialog').close();document.body.classList.add('printing');$('#print-view').hidden=false;window.scrollTo(0,0);$('#leave-print').focus();});
  $('#leave-print').addEventListener('click',()=>{document.body.classList.remove('printing');$('#print-view').hidden=true;$('#open-export').focus();});
  $('#do-print').addEventListener('click',()=>window.print());
  window.addEventListener('beforeprint',prepareProof);
  $('#import-button').addEventListener('click',()=>{$('#import-file').value='';$('#import-file').click();});
  $('#import-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{if(file.size>6000)throw new Error('Choose a design recipe smaller than 6 KB.');await loadImported(await importDesign(await file.text()));}
    catch(error){status(`${error.message} Your current design is unchanged.`,true);}
  });
  window.addEventListener('storage',async event=>{if(event.key!==TRAY_KEY&&event.key!==null)return;try{tray=await readTray(event.newValue);renderTray();}catch{status('Another tab changed the tray, but it could not be read. Your current design is safe.',true);}});
  window.addEventListener('hashchange',async()=>{const encoded=new URLSearchParams(location.hash.slice(1)).get('design');if(encoded){try{await loadImported(await decodeDesign(encoded));}catch(error){status(`${error.message} Your current design is unchanged.`,true);}}});
}
$('#provenance').addEventListener('click',()=>showDialog('#source-dialog'));
// Source information remains usable if the asset request fails.
$('#source-dialog [data-close]').addEventListener('click',()=>$('#source-dialog').close());
async function init(){
  try{
    const response=await fetch('./assets/image-data.json');if(!response.ok)throw new Error('Original Nouns assets could not be loaded.');
    const raw=await response.arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',raw);
    const hex=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');if(hex!==ASSET_SHA)throw new Error('The original Nouns asset checksum does not match.');
    data=JSON.parse(new TextDecoder().decode(raw));
    tray=await latestTray();$('#tray-count').textContent=tray.length;makeControls();bind();
    const theme=new URLSearchParams(location.search).get('theme');if(theme&&Object.hasOwn(THEMES,theme))draft.theme=theme;
    await render();document.querySelectorAll('button:disabled').forEach(button=>button.disabled=false);
    status('Your first specimen is ready. Turn it over, or make it yours.');
    const encoded=new URLSearchParams(location.hash.slice(1)).get('design');
    if(encoded){try{await loadImported(await decodeDesign(encoded));}catch(error){status(`${error.message} A fresh specimen is ready to use.`,true);}}
  }catch(error){status(`${error.message} Reload to try again, or download the starter SVG below.`,true);const link=document.createElement('a');link.href='./assets/starter-front.svg';link.download='Nouns-Money-starter.svg';link.textContent='Download starter SVG';link.className='subtle-link';$('#status').after(link);}
}
init();
