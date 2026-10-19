import {initialState, normalizeState, THEMES, PALETTES, COMPOSITIONS, STORAGE_KEY, specimenId, noteSVG, briefText, readyForBrief, escapeXML, workshopDesign, workshopURL, applyWorkshopDesign, verifiedNounsData, importedArt} from './lab-core.mjs';

import {importDesign,decodeDesign} from './workshop-model.mjs';

const root = document.getElementById('currency-lab');
if (root && !root.dataset.initialized) {
  root.dataset.initialized = 'true';
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  let state = initialState(), teacher = false, saveEnabled = false, nounsData = null, importSequence = 0;
  const artOptions = () => {const a=nounsData&&importedArt(state,nounsData);return a?{assetHref:a.href,assetName:a.name}:{};};
  async function loadNouns() {
    if(nounsData)return nounsData;
    const response=await fetch(new URL('./image-data.json',import.meta.url));
    if(!response.ok)throw new Error('Original Nouns artwork could not be loaded. Your current lab is unchanged.');
    nounsData=await verifiedNounsData(await response.text());return nounsData;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed=JSON.parse(stored);
      if(!parsed||parsed.version!==1) throw new Error('Unsupported saved lab');
      state = normalizeState(parsed); saveEnabled = true; $('#storage-status').textContent = 'Your saved lab has been restored on this device.';
    }
  } catch { $('#storage-status').textContent = 'This browser could not restore a saved lab. You can still use it and download your brief.'; }

  if(state.assetOverride){
    try {await loadNouns();} catch {state.assetOverride=null;state.colorsOverride=null;$('#storage-status').textContent='The saved Noun could not be loaded. A default Noun is shown; your title and story are kept.';}
  }
  async function receiveDesign(read) {
    $('.design-import').open=true;
    const request=++importSequence;
    try {const design=await read();await loadNouns();if(request!==importSequence)return;
      state=applyWorkshopDesign(state,design);commit();
      $('#import-status').textContent='Workshop design loaded: Noun, colors, theme, and edition label. The lab adds its own layout and local label. Changing the meaning starts a new lab Noun.';
    } catch(error) {if(request===importSequence)$('#import-status').textContent=error.message||'That design could not be loaded. Your current lab is unchanged.';}
  }
  function persist() {
    if (!saveEnabled) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { saveEnabled = false; $('#storage-status').textContent = 'Device storage is unavailable. Your work still works in this tab; download a brief to keep it.'; }
  }
  function renderBrief() {
    const s = state, p = s.colorsOverride?{label:'Imported Workshop colors'}:PALETTES[s.palette], title = escapeXML(s.title), story = escapeXML(s.story || 'Write a sentence about what this object should help someone notice or remember.');
    $('#print-output').innerHTML = `<p class="print-eyebrow">UNIVERSITY OF EL SEGUNDO / NOUNS MONEY WORKSHOP</p><h1>${title}</h1><p class="print-eyebrow">PROJECT BRIEF · ${readyForBrief(s) ? 'SELF-CHECKED' : 'DRAFT'}</p><p class="print-story">${story}</p><div class="print-note">${noteSVG(s,{side:'front',id:'print-front',...artOptions()})}</div><div class="print-note">${noteSVG(s,{side:'back',id:'print-back',...artOptions()})}</div><div class="print-facts"><p>Meaning: ${THEMES[s.theme].label}</p><p>Composition: ${COMPOSITIONS[s.composition].label}</p><p>Ink: ${p.label}</p><p>Planned copies: ${s.copies} · not enforced</p><p>Design label: ${specimenId(s)}</p><p>Reprints carry the same label.</p></div><h2>Proof observations</h2>${['A reader could tell it is collectible art.','The key label stayed readable on paper.','I can explain why the duplicate has the same ID.'].map((line,i)=>`<p class="print-check">${s.checks[i]?'[x]':'[ ]'} ${line}</p>`).join('')}<p class="print-line">Next revision <span></span></p><p class="print-no-value">ART SPECIMEN · NO MONETARY VALUE</p><p class="print-end">This is a private project brief, not a credential. No payment, redemption, ownership, or financial rights. Original Nouns artwork: CC0. Traits: ${s.assetOverride?Object.values(s.assetOverride.seed).join(' / '):'0 / 17 / 41 / '+THEMES[s.theme].head+' / 2'}. Independent project; no official Nouns affiliation. Source pin: 2213eea1c15f331f786784c2621d53bdecf907e2.</p>`;
  }
  function renderArt() {
    $('#note-art').innerHTML = noteSVG(state,artOptions());
    $('#face-label').textContent = state.side === 'front' ? 'FRONT / 01' : 'BACK / 02';
    $$('[data-face]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.face === state.side)));
    $('#specimen-id').textContent = specimenId(state);
    $('#detail-id').textContent = specimenId(state);
    $('#composition-options').innerHTML = Object.entries(COMPOSITIONS).map(([key,c])=>`<button type="button" data-composition="${key}" aria-pressed="${state.composition===key}" aria-label="${c.label} composition">${noteSVG({...state,composition:key},{side:'front',id:`mini-${key}`,...artOptions()})}<span>${c.label}</span></button>`).join('');
    // The thumbnail names already describe their purpose; avoid repeating their SVG descriptions.
    $$('#composition-options svg').forEach(el=>el.setAttribute('aria-hidden','true'));
    $('#duplicate-tray').hidden = !(state.duplicated && state.step === 2);
    if (state.duplicated) {
      $('#copy-a').innerHTML = noteSVG(state,{side:'front',id:'copy-a',...artOptions()});
      $('#copy-b').innerHTML = noteSVG(state,{side:'front',id:'copy-b',...artOptions()});
      $('#copy-a-id').textContent = $('#copy-b-id').textContent = specimenId(state);
    }
    renderBrief();
  }
  function render({art = true} = {}) {
    $$('.experiment').forEach((el,i)=>el.hidden=i!==state.step);
    $$('[data-step]').forEach(el=>{
      const n = Number(el.dataset.step);
      if (n===state.step) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
      el.querySelector('.step-check').textContent = state.completed.includes(n) ? '·' : '';
    });
    $$('[data-theme]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.theme===state.theme)));
    $$('[data-palette]').forEach(el=>el.setAttribute('aria-pressed',String(!state.colorsOverride&&el.dataset.palette===state.palette)));
    $$('input[name="meaning-answer"]').forEach(el=>el.checked=el.value===state.meaningAnswer);
    $$('input[name="copy-answer"]').forEach(el=>el.checked=el.value===state.copyAnswer);
    $$('[data-check]').forEach(el=>el.checked=state.checks[Number(el.dataset.check)]);
    $('#meaning-prompt').textContent = THEMES[state.theme].prompt;
    $('#meaning-feedback').textContent = !state.meaningAnswer ? '' : state.meaningAnswer==='collectible' ? 'Yes. It is art with a story. No one has promised redemption or spending power.' : 'Try again. A picture and a story do not establish redemption or spending power. This sample is collectible art.';
    $('#composition-feedback').textContent = COMPOSITIONS[state.composition].feedback;
    $('#duplicate-feedback').textContent = state.duplicated ? 'Two copies. Same label. The identifier names the design; it did not stop copying.' : '';
    $('#duplicate-button').textContent = state.duplicated ? 'Compare the copies again ⊞' : 'Make a second copy ⊞';
    $('#copy-feedback').textContent = !state.copyAnswer ? '' : state.copyAnswer==='no' ? 'Exactly. An identifier can describe a design. It does not enforce your copy plan.' : 'Look at the two copies: both carry the same label. A printed identifier is not a restriction.';
    $('#desk-caption').textContent = [THEMES[state.theme].finding, COMPOSITIONS[state.composition].feedback, state.duplicated ? 'The label copied perfectly. So did the artwork. What can it tell you—and what can’t it?' : 'Try a duplicate. Then read the two labels side by side.', 'Print one proof. Look closely. Revise the thing you notice first.'][state.step];
    if (document.activeElement !== $('#project-title')) $('#project-title').value = state.title;
    if (document.activeElement !== $('#project-story')) $('#project-story').value = state.story;
    if (document.activeElement !== $('#copies')) $('#copies').value = state.copies;
    $('#brief-status').textContent = readyForBrief(state) ? 'Brief ready. Your self-checks and observations are included.' : 'Draft ready to print. Finish the meaning and copy experiments, add a story, and test your proof when you can.';
    $('#progress-text').textContent = `${state.completed.length} of 4 experiments visited`;
    $('#storage-explanation').textContent = saveEnabled ? 'Saved only in this browser on this device. Changes are saved as you work; nothing is submitted.' : 'Your work stays in this tab. Choose “Save on this device” to keep it after closing.';
    $('#save-progress').textContent = saveEnabled ? 'Saved on this device' : 'Save on this device';
    if (art) renderArt();
  }
  function commit(options) { persist(); render(options); }
  function chooseStep(index, focus=true) {
    state.step=index;
    if (!state.completed.includes(index)) state.completed.push(index);
    commit();
    if (focus) { const heading=$(`#heading-${index}`);heading.focus({preventScroll:true});heading.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}); }
  }
  function choosePath(next, focus=true) {
    teacher=next;
    $('#learner-path').hidden=teacher;$('#teacher-path').hidden=!teacher;
    $('#learn-path').setAttribute('aria-pressed',String(!teacher));$('#teach-path').setAttribute('aria-pressed',String(teacher));
    if (focus) (teacher ? $('#teacher-title') : $(`#heading-${state.step}`)).focus({preventScroll:true});
  }
  function download(content, name, type) {
    const url=URL.createObjectURL(new Blob([content],{type})), a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  root.addEventListener('click',async event=>{
    const el=event.target.closest('button');if(!el)return;
    if(el.dataset.step!==undefined) chooseStep(Number(el.dataset.step));
    if(el.dataset.next!==undefined) chooseStep(Number(el.dataset.next));
    if(el.dataset.face){state.side=el.dataset.face;commit();}
    if(el.dataset.theme){state.checks=[false,false,false];importSequence++;state.assetOverride=null;state.colorsOverride=null;state.editionNumber=1;const old=THEMES[state.theme].title;state.theme=el.dataset.theme;if(state.title===old)state.title=THEMES[state.theme].title;commit();}
    if(el.dataset.palette){state.checks=[false,false,false];state.colorsOverride=null;state.palette=el.dataset.palette;commit();}
    if(el.dataset.composition){state.checks=[false,false,false];state.composition=el.dataset.composition;commit();$(`[data-composition="${state.composition}"]`).focus({preventScroll:true});}
    if(el.id==='learn-path'||el.id==='teacher-start')choosePath(false);
    if(el.id==='teach-path')choosePath(true);
    if(el.id==='detail-toggle'){const expanded=el.getAttribute('aria-expanded')==='true';el.setAttribute('aria-expanded',String(!expanded));$('#note-details').hidden=expanded;el.textContent=expanded?'Read the details +':'Close the details −';}
    if(el.id==='duplicate-button'){state.duplicated=true;commit();}
    if(el.id==='save-progress'){saveEnabled=true;persist();render({art:false});if(saveEnabled)$('#storage-status').textContent='Saved on this device. You can clear this lab below.';}
    if(el.id==='erase-progress'){
      try {localStorage.removeItem(STORAGE_KEY);} catch {$('#storage-status').textContent='This browser did not allow removal of saved data. Clear this site’s browser storage to remove the saved copy.';return;}
      state=initialState();saveEnabled=false;$('#storage-status').textContent='Lab cleared. Your downloaded files are unchanged.';render();
    }
    if(el.id==='print-brief'){renderBrief();window.print();}
    if(el.id==='download-brief')download(briefText(state),'ues-art-note-brief.txt','text/plain;charset=utf-8');
    if(el.id==='download-design'||el.id==='open-workshop'){
      try {
        const design=await workshopDesign(state);
        if(el.id==='download-design')download(JSON.stringify(design,null,2),'ues-workshop-design.json','application/json');
        else window.location.assign(workshopURL(design));
      } catch {$('#brief-status').textContent='This browser could not prepare the portable design. Your printable and text briefs still work.';}
    }
  });
  root.addEventListener('change',async event=>{
    const el=event.target;
    if(el.id==='import-design'&&el.files?.[0]){const file=el.files[0];await receiveDesign(async()=>{if(file.size>6000)throw new Error('Choose a Workshop design JSON smaller than 6 KB.');return importDesign(await file.text());});el.value='';}
    if(el.name==='meaning-answer'){state.meaningAnswer=el.value;commit({art:false});}
    if(el.name==='copy-answer'){state.copyAnswer=el.value;commit({art:false});}
    if(el.dataset.check!==undefined){state.checks[Number(el.dataset.check)]=el.checked;commit({art:false});renderBrief();}
    if(el.id==='copies'){state.checks=[false,false,false];const n=Number(el.value);state.copies=Number.isFinite(n)?Math.max(1,Math.min(24,Math.round(n))):6;el.value=state.copies;commit();}
  });
  root.addEventListener('input',event=>{
    const el=event.target;
    if(el.id==='project-title'){state.checks=[false,false,false];state.title=el.value.trim().slice(0,36)||THEMES[state.theme].title;commit();}
    if(el.id==='project-story'){state.story=el.value.slice(0,160);commit({art:false});renderBrief();}
  });
  window.addEventListener('beforeprint',renderBrief);
  choosePath(false,false);
  chooseStep(state.step,false);
  const fragment=new URLSearchParams(window.location.hash.slice(1));
  if(fragment.has('design'))await receiveDesign(()=>decodeDesign(fragment.get('design')));
}
