import {createSculptureScene} from './sculpture-scene.js';
import {CATS,FAMILIES,CHARMS} from '../catalog.js';
import {loadCredential,registerBrowserAgent,signedRequest} from '../agent-client.js';
import {freshDeskState,readDeskState,writeDeskState,putDraft,getDraft,stageAction,settleAction,reconcileDeskState,classifyActionError,deskStorageKey} from './agent-state.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const REWARDS={'task.start':3,'task.deliver':5,'task.verify':8,'task.reflect':4};
const LABELS={'task.start':'Plan','task.deliver':'Delivery','task.verify':'Checks','task.reflect':'Reflection','cat.collect':'Sculpture collected','charm.use':'Work charm'};
const PHASE_ORDER=['planned','delivered','verified','reflected'];
const NEXT={planned:'task.deliver',delivered:'task.verify',verified:'task.reflect'};
let storage=null;try{storage=localStorage;}catch{}
let state=readDeskState(storage,null),credential=null,profile=null,busy=false,booting=true,formKey=null,formPhase=null,previewCat=null,family='all',view='all',search='',page=0,historyView='active',detailCat=null,toastTimer=null,lastError='',storageOkay=!!storage;
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');let lessMotion=motionQuery.matches;
let scene;
try{scene=createSculptureScene($('#agent-scene'),{design:CATS[0],reducedMotion:lessMotion,onPet:()=>{$('#agent-bubble').textContent='A small moment of care. Keep going.';}});}catch{
 const img=document.createElement('img');img.src='/lucky-cat/cats/classic.png';img.alt='Classic lucky cat sculpture';img.style.cssText='width:100%;height:100%;object-fit:contain';$('#agent-scene').append(img);
 scene={setDesign(c){img.src=`/lucky-cat/cats/${c.id}.png`;img.alt=`${c.name} lucky cat sculpture`;},setReducedMotion(){},dispose(){}};
}
const create=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
function toast(message){clearTimeout(toastTimer);$('#agent-toast').textContent=message;$('#agent-toast').hidden=false;toastTimer=setTimeout(()=>$('#agent-toast').hidden=true,6500);}
function dateLabel(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Saved';}
function dateTime(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Saved';}
function persist(){const now=new Date().toISOString();storageOkay=writeDeskState(storage,credential?.agentId,state,now);if(storageOkay)state.savedAt=now;updateDraftStatus();return storageOkay;}
function updateDraftStatus(){if(!$('#agent-draft-status'))return;$('#agent-draft-status').textContent=storageOkay?state.savedAt?`Saved on this device · ${new Date(state.savedAt).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}`:'Draft stays in this browser':'Browser storage unavailable · draft only lasts for this visit';}
function selectedTask(){return state.selectedTask==='new'?null:profile?.tasks.find(t=>t.id===state.selectedTask)||null;}
function nextPhase(){const task=selectedTask();return task?NEXT[task.phase]||null:'task.start';}
function phaseFormValues(){const get=name=>$(`#agent-phase-fields [name="${name}"]`)?.value||'';
 if(formPhase==='task.start')return{goal:get('goal'),plan:get('plan')};
 if(formPhase==='task.deliver')return{summary:get('summary'),evidence:get('evidence')};
 if(formPhase==='task.verify')return{checks:$$('#agent-phase-fields .agent-check-row').map(row=>({check:row.querySelector('[data-check="check"]').value,outcome:row.querySelector('[data-check="outcome"]').value,evidence:row.querySelector('[data-check="evidence"]').value})),limitation:get('limitation')};
 if(formPhase==='task.reflect')return{lesson:get('lesson'),nextStep:get('nextStep')};return{};
}
function saveCurrentDraft(){if(!formKey||!formPhase)return;state=putDraft(state,formKey,phaseFormValues());persist();}
function switchTask(id){if(busy)return;saveCurrentDraft();state.selectedTask=id;formKey=null;persist();renderAll(false);$('#agent-work').scrollIntoView({behavior:lessMotion?'instant':'smooth',block:'start'});}
function startNew(){if(busy||state.pending)return;switchTask('new');$('#agent-phase-fields [name="goal"]')?.focus({preventScroll:true});}
function friendlyError(error){const code=String(error?.message||'request-failed');const messages={
 'pending-action-first':'Resolve the saved request before submitting another step. Its exact retry is kept above.',
 'agent-scope-denied':'This agent needs lucky-cat:play and lucky-cat:profile scopes.',
 'active-task-limit':'You have 12 open tasks. Finish one to make room for the next.',
 'daily-task-limit':'Three new tasks are enough for today. Continue an open task or start after midnight UTC.',
 'daily-action-limit':'Today’s action allowance is complete. Your draft is saved; try after midnight UTC.',
 'task-phase-conflict':'This task changed in the ledger. Review its saved timeline before writing the next step.',
 'cat-already-owned':'This sculpture is already in your collection.',
 'insufficient-luck':'A little more earned luck is needed. Your current balance is shown above.',
 'milestone-not-reached':'This milestone needs both the lifetime luck and finished tasks shown in its details.',
 'idempotency-key-conflict':'That retry key belongs to different work. The saved request is retained for review.',
 'lucky-cat-unavailable':'The ledger did not confirm this request. Its exact body and retry key are saved above.',
 'agent-proof-expired':'Your device clock or signing timestamp may be out of date. Refresh, then retry the saved request.',
 'active-agent-key-not-found':'This key is expired or revoked. The ledger still exists, but this browser key cannot access it.',
 'action-too-large':'This submission exceeds 8 KB. Shorten the evidence while keeping it useful.',
 'invalid-action-key':'Use a stable 8–96 character retry key made of letters, numbers, periods, colons, underscores, or hyphens.',
 };
 if(messages[code])return messages[code];
 if(/must-be|must-have|outcome-invalid|must-be-distinct/.test(code))return `Add enough detail for this step: ${code.replaceAll('-',' ')}.`;
 if(error instanceof TypeError||/fetch|network|request-failed/i.test(code))return'The connection did not confirm the result. Your exact request is saved; retry when you are ready.';
 return code;
}
async function refresh({quiet=false}={}){
 if(!credential)return;saveCurrentDraft();
 const result=await signedRequest(credential,'/api/lucky-cat/profile');
 if(result.profile.agentId!==credential.agentId)throw new Error('Profile identity mismatch');
 profile=result.profile;const wasPending=!!state.pending;state=reconcileDeskState(state,profile);
 if(!profile.tasks.some(t=>t.id===state.selectedTask)&&state.selectedTask!=='new')state.selectedTask=profile.tasks.find(t=>t.phase!=='reflected')?.id||'new';
 if(!profile.cats.includes(state.companion))state.companion='classic';
 formKey=null;persist();renderAll(false);if(wasPending&&!state.pending&&!quiet)toast('The matching receipt is restored. Your step is safe in the ledger.');
}
async function connect(){if(busy||booting)return;saveCurrentDraft();busy=true;renderBusy();try{
 const before=state;credential??=await loadCredential();let created=false;
 if(!credential){credential=await registerBrowserAgent();created=true;}
 state=readDeskState(storage,credential.agentId);
 if(created&&before.drafts.length&&!state.drafts.length){state={...state,newTaskId:before.newTaskId,drafts:before.drafts};persist();}
 formKey=null;await refresh({quiet:true});toast('Your signed practice desk is ready. One small task at a time.');
 }catch(error){toast(friendlyError(error));renderAll(false);}finally{busy=false;renderBusy();}
}
async function runAction(body){if(busy)throw new Error('An action is already in progress');if(!credential||!profile)throw new Error('Connect your practice agent first');
 saveCurrentDraft();const previous=state;let requestBody;
 try{const staged=stageAction(state,body);state=staged.state;requestBody=staged.body;if(!persist()){state=previous;throw new Error('The browser could not save the retry record. Enable site storage or use the signed CLI.');}}
 catch(error){toast(friendlyError(error));lastError=error.message;renderAll(false);return null;}
 busy=true;renderPending();renderBusy();
 try{
  const result=await signedRequest(credential,'/api/lucky-cat/actions',requestBody);
  const settled=settleAction(state,result.receipt);
  if(settled.pending)throw new Error('The response did not contain the matching receipt. Keep the saved request and retry.');
  state=settled;profile=result.profile;formKey=null;previewCat=requestBody.type==='cat.collect'?null:previewCat;persist();renderAll(false);
  if(requestBody.type==='charm.use')$('#agent-guidance').scrollIntoView({behavior:lessMotion?'instant':'smooth',block:'nearest'});
  toast(result.replayed?'Matching receipt restored. This step was awarded once.':result.receipt.delta>0?`+${result.receipt.delta} luck. ${LABELS[requestBody.type]} saved.`:requestBody.type==='cat.collect'?`${CATS.find(c=>c.id===requestBody.catId)?.name||'Sculpture'} is yours.`:requestBody.type==='charm.use'?'Your guide is ready. Take one useful step.':'Your step is saved. Today’s luck allowance is already complete.');
  return result;
 }catch(error){lastError=error.message;const classification=classifyActionError(error);
  if(classification.definitive){state={...state,pending:null};persist();try{await refresh({quiet:true});}catch{renderAll(false);}}
  else{persist();renderPending();}
  toast(friendlyError(error));return null;
 }finally{busy=false;renderBusy();}
}
function renderBusy(){
 $('#agent-connect').disabled=busy||booting;
 $('#agent-submit').disabled=busy||!profile||!!state.pending||(nextPhase()==='task.start'&&(profile?.daily.taskStarts>=3||profile?.tasks.filter(t=>t.phase!=='reflected').length>=12));
 $('#agent-new-task').disabled=busy||!!state.pending;$('#agent-completion-new').disabled=busy||!!state.pending;
 $('#agent-retry').disabled=busy||!profile;$('#agent-refresh').disabled=busy||!credential;
 $$('#agent-phase-fields input,#agent-phase-fields textarea,#agent-phase-fields select,#agent-phase-fields button').forEach(el=>el.disabled=busy||booting||!!state.pending);
 const checkCount=checkRowCount();if($('#agent-add-check'))$('#agent-add-check').disabled=busy||!!state.pending||checkCount>=6;$$('[data-remove-check]').forEach(el=>el.disabled=busy||!!state.pending||checkCount<=1);
 $$('[data-use-charm]').forEach(el=>el.disabled=busy||!profile||!!state.pending||profile.balance<Number(el.dataset.cost));
 if(detailCat)$('#agent-detail-collect').disabled=busy||(isOwned(detailCat.id)?state.companion===detailCat.id:!canCollect(detailCat)||!!state.pending);
}
function renderPending(){const pending=state.pending;$('#agent-pending').hidden=!pending;if(!pending)return;
 $('#pending-heading').textContent=`Keep this ${LABELS[pending.body.type]?.toLowerCase()||'step'} safe.`;
 $('#agent-pending-copy').textContent=`Awaiting a matching receipt for the request saved ${dateTime(pending.createdAt)}. Retry sends the exact same body and key, so a recorded action is not awarded or charged twice.`;
 $('#agent-pending-key').textContent=`Retry key · ${pending.body.idempotencyKey}`;$('#agent-pending-body').textContent=JSON.stringify(pending.body,null,2);
}
function field(label,name,{value='',hint='',textarea=true,min=12,max=600,rows=3}={}){
 const wrap=create('label','agent-work-field',label);if(hint)wrap.append(create('small','',hint));
 const el=create(textarea?'textarea':'input');el.name=name;el.required=true;el.minLength=min;el.maxLength=max;el.value=value;if(textarea)el.rows=rows;wrap.append(el);return wrap;
}
function checkRow(check,index){const row=create('fieldset','agent-check-row');const top=create('div','agent-check-top');top.append(create('strong','',`CHECK ${String(index+1).padStart(2,'0')}`));
 const remove=create('button','button','Remove');remove.type='button';remove.dataset.removeCheck=String(index);remove.setAttribute('aria-label',`Remove check ${index+1}`);remove.disabled=checkRowCount()<=1;top.append(remove);row.append(top);
 const checkWrap=field('What did you check?',`check-${index}`,{value:check.check||'',max:300,hint:'Name a concrete check you actually performed.'});checkWrap.querySelector('textarea').dataset.check='check';row.append(checkWrap);
 const outcomeWrap=create('label','agent-work-field','Observed outcome');const select=create('select');select.dataset.check='outcome';select.required=true;for(const [value,label]of[['','Choose the observed result'],['passed','Passed'],['failed','Failed'],['uncertain','Uncertain']]){const option=create('option','',label);option.value=value;option.selected=value===(check.outcome||'');select.append(option);}outcomeWrap.append(select);row.append(outcomeWrap);
 const evidence=field('What did the check show?',`evidence-${index}`,{value:check.evidence||'',max:500,hint:'Record the result or evidence, including failure or uncertainty.'});evidence.querySelector('textarea').dataset.check='evidence';row.append(evidence);return row;
}
function checkRowCount(){return $$('#agent-phase-fields .agent-check-row').length;}
function renderForm(){
 const task=selectedTask(),phase=nextPhase();formPhase=phase;formKey=phase?`${task?.id||state.newTaskId}:${phase}`:null;
 $('#agent-task-form').hidden=!phase;$('#agent-completion').hidden=!!phase;$('#agent-task-goal').hidden=!task;$('#agent-task-goal').textContent=task?.goal||'';
 const titles={'task.start':['Start with a clear plan.','Save my plan'],'task.deliver':['Show what you made.','Record my delivery'],'task.verify':['Give it a second look.','Record my checks'],'task.reflect':['Carry the lesson forward.','Save my reflection']};
 $('#agent-work-heading').textContent=phase?titles[phase][0]:'A useful loop, finished.';
 $('#agent-work-reward').textContent=phase?`+${Math.min(REWARDS[phase],profile?.daily.remaining??REWARDS[phase])} luck`:'Recorded';
 if(phase)$('#agent-submit').textContent=titles[phase][1];
 const order=task?PHASE_ORDER.indexOf(task.phase):-1;$$('[data-phase]').forEach(el=>{const rank=PHASE_ORDER.indexOf(el.dataset.phase);el.classList.toggle('complete',rank<=order);el.classList.toggle('current',phase&&rank===order+1);});
 const fields=$('#agent-phase-fields');fields.replaceChildren();if(!phase){renderTimeline(task);return;}
 const draft=getDraft(state,formKey)||{};
 if(phase==='task.start'){
 fields.append(field('What will be better when you finish?','goal',{value:draft.goal||'',min:20,max:600,hint:'A clear, useful outcome. 20–600 characters.'}),field('Three to six concrete steps','plan',{value:draft.plan||'',max:1800,rows:4,hint:'One step per line. Each needs 12–300 characters.'}));
 $('#agent-form-hint').textContent='Keep the plan bounded. Three new tasks per UTC day, up to twelve open tasks.';
 }else if(phase==='task.deliver'){
 fields.append(field('What did you finish?','summary',{value:draft.summary||'',min:20,max:1000,hint:'Describe the delivered result. 20–1,000 characters.'}),field('Evidence someone can inspect','evidence',{value:draft.evidence||'',max:3000,rows:4,hint:'One result, artifact, or URL per line. 1–6 entries, 12–500 characters each. Do not include secrets.'}));
 $('#agent-form-hint').textContent='A reference is recorded as your own evidence. The desk does not fetch or independently check it.';
 }else if(phase==='task.verify'){
 const checks=Array.isArray(draft.checks)&&draft.checks.length?draft.checks:[{check:'',outcome:'',evidence:''}];
 checks.forEach((check,index)=>fields.append(checkRow(check,index)));
 const add=create('button','button agent-add-check','Add another check +');add.type='button';add.id='agent-add-check';add.disabled=checks.length>=6;fields.append(add);
 fields.append(field('What remains unverified or limited?','limitation',{value:draft.limitation||'',max:600,hint:'Be specific about uncertainty and the limits of these checks.'}));
 $('#agent-form-hint').textContent='One to six real checks. Failed or uncertain results count as honest practice too.';
 fields.querySelectorAll('[data-remove-check]').forEach(el=>el.disabled=checks.length<=1);
 }else{
 fields.append(field('What will you carry into the next task?','lesson',{value:draft.lesson||'',min:20,max:600,hint:'A lesson you can use, rather than a generic success claim.'}),field('One concrete next step','nextStep',{value:draft.nextStep||'',max:400,hint:'12–400 characters. A small, usable next action.'}));
 $('#agent-form-hint').textContent='This finishes the practice loop. Your task and its submitted evidence remain in the ledger.';
 }
 renderTimeline(task);updateDraftStatus();
}
function renderTimeline(task){const wrap=$('#agent-task-timeline');wrap.replaceChildren();wrap.hidden=!task;if(!task)return;
 wrap.append(create('p','eyebrow',`SAVED TIMELINE / ${task.id}`));
 function entry(title,build){const details=create('details');details.append(create('summary','',title));build(details);wrap.append(details);}
 entry(`01 Plan · ${dateLabel(task.createdAt)}`,details=>{const list=create('ol');task.plan.forEach(step=>list.append(create('li','',step)));details.append(list);});
 if(task.delivery)entry('02 Delivery',details=>{details.append(create('p','',task.delivery.summary));const list=create('ol');task.delivery.evidence.forEach(e=>list.append(create('li','',e)));details.append(list);});
 if(task.verification)entry(`03 Checks · ${task.verification.checks.length} recorded`,details=>{for(const check of task.verification.checks){const heading=create('p','',check.check);heading.append(create('span','agent-check-outcome',check.outcome));details.append(heading,create('p','',check.evidence));}details.append(create('p','',`Limitations: ${task.verification.limitation}`));});
 if(task.reflection)entry(`04 Reflection · ${dateLabel(task.updatedAt)}`,details=>details.append(create('p','',task.reflection.lesson),create('p','',`Next step: ${task.reflection.nextStep}`)));
}
function renderConnection(){
 const connected=!!profile;$('#agent-status').textContent=connected?'Connected':booting?'Checking saved key':credential?'Key saved':'Not connected';
 $('#agent-connect').textContent=connected?'Refresh my profile':credential?'Reconnect my practice agent':'Create my practice agent';
 $('#agent-connection-copy').textContent=connected?'Your submitted work is saved in the signed PointCast ledger. Unsubmitted drafts stay in this browser.':'A private, signed record of your work. Create an agent for this browser, or use the same protocol in your own tools.';
 $('#agent-key-details').hidden=!credential;$('#agent-identity').textContent=credential?.agentId||'';
 if(credential){const expires=new Date(credential.expiresAt);$('#agent-key-expiry').textContent=`${expires<=new Date()?'Key expired':'Key expires'} ${expires.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}. This key belongs to this browser.`;}
 $('#agent-luck').textContent=profile?.balance||0;$('#agent-earned').textContent=profile?.lifetimePoints||0;$('#agent-completed').textContent=profile?.completedTasks||0;
 $('#agent-daily').textContent=profile?`${profile.daily.earned} / 60 luck today · ${profile.daily.remaining} available · ${profile.daily.taskStarts} / 3 new tasks · resets at midnight UTC`:'60 luck per UTC day · 3 new tasks · up to 12 open tasks';
}
function renderDesk(){const cat=CATS.find(c=>c.id===(previewCat||state.companion))||CATS[0];scene.setDesign(cat);$('#agent-cat-number').textContent=`${previewCat?'PREVIEW / ':''}SCULPTURE ${cat.number}`;$('#agent-cat-name').textContent=cat.name;$('#agent-cat-material').textContent=`${cat.material} · ${cat.form}`;$('#agent-preview-return').hidden=!previewCat;$('#agent-scene').setAttribute('aria-label',`Abstract ${cat.name} lucky cat sculpture. Drag to turn the sculpture.`);}
function renderHistory(){
 const active=profile?.tasks.filter(t=>t.phase!=='reflected')||[],complete=profile?.tasks.filter(t=>t.phase==='reflected')||[];
 $('#agent-active-count').textContent=active.length;$('#agent-finished-count').textContent=complete.length;$$('[data-history]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.history===historyView));
 const wrap=$('#agent-task-list');wrap.replaceChildren();const tasks=historyView==='active'?active:complete;
 if(!tasks.length)wrap.append(create('p','agent-empty',!profile?'Connect your agent to see its saved work.':historyView==='active'?'A clear desk. Begin with one small, useful task.':'Finished loops will live here. Plan, deliver, check, and reflect to complete one.'));
 for(const task of tasks){const button=create('button',`agent-task-card ${state.selectedTask===task.id?'active':''}`);button.type='button';button.dataset.task=task.id;
 const top=create('span','eyebrow',task.phase==='reflected'?'FINISHED':`NEXT / ${LABELS[NEXT[task.phase]].toUpperCase()}`);top.append(create('span','',dateLabel(task.updatedAt)));button.append(top,create('h3','',task.goal),create('p','',task.phase==='reflected'?'Read the saved timeline ↗':'Resume this task ↗'));button.onclick=()=>switchTask(task.id);wrap.append(button);}
 const receipts=profile?.receipts||[];$('#agent-receipt-count').textContent=receipts.length;const list=$('#agent-receipt-list');list.replaceChildren();
 if(!receipts.length)list.append(create('p','agent-empty','Receipts appear after a submitted action is recorded.'));
 for(const receipt of receipts){const row=create('div','agent-receipt');row.append(create('p','',`${LABELS[receipt.type]||receipt.type} · ${dateTime(receipt.createdAt)}`),create('p',receipt.delta>0?'positive':'',`${receipt.delta>0?'+':''}${receipt.delta} luck`),create('small','',`${receipt.id} · self-reported evidence`));list.append(row);}
}
function renderCharms(){const grid=$('#agent-charm-grid');grid.replaceChildren();
 CHARMS.forEach((charm,index)=>{const card=create('article','agent-charm-card');card.append(create('div','agent-charm-symbol',['◉','◇','↺'][index]),create('h3','',charm.name),create('p','',charm.guidance.purpose));
 const actions=create('div','agent-charm-actions');const use=create('button','button button-dark',`Use · ${charm.cost} luck`);use.type='button';use.dataset.useCharm=charm.id;use.dataset.cost=charm.cost;use.onclick=()=>runAction({type:'charm.use',charmId:charm.id});actions.append(use);
 const uses=profile?.charms.find(c=>c.id===charm.id)?.uses||0;if(uses){const review=create('button','button','Revisit guide');review.type='button';review.onclick=()=>{state={...state,guide:{...charm.guidance,charmId:charm.id,receiptId:profile.receipts.find(r=>r.charmId===charm.id)?.id||null},guideChecks:[]};persist();renderGuidance();$('#agent-guidance').scrollIntoView({behavior:lessMotion?'instant':'smooth',block:'nearest'});};actions.append(review);}
 card.append(actions,create('small','',uses?`${uses} ${uses===1?'use':'uses'} recorded · revisiting is free`:`${charm.cost} free, earned luck · no provider credits`));grid.append(card);
 });renderGuidance();
}
function renderGuidance(){const guide=state.guide;$('#agent-guidance').hidden=!guide;if(!guide)return;
 $('#agent-guidance-title').textContent=guide.title;$('#agent-guidance-purpose').textContent=guide.purpose;$('#agent-guidance-progress').textContent=`${state.guideChecks.length} / ${guide.steps.length} steps`;
 const steps=$('#agent-guidance-steps');steps.replaceChildren();guide.steps.forEach((step,index)=>{const label=create('label',`agent-guide-step ${state.guideChecks.includes(index)?'done':''}`),input=create('input');input.type='checkbox';input.checked=state.guideChecks.includes(index);input.onchange=()=>{state.guideChecks=input.checked?[...state.guideChecks,index]:state.guideChecks.filter(n=>n!==index);persist();renderGuidance();};label.append(input,create('span','',step));steps.append(label);});
}
function isOwned(id){return(profile?.cats||['classic']).includes(id);}
function milestoneMet(cat){return!cat.requires||!!profile&&profile.lifetimePoints>=cat.requires.lifetimePoints&&profile.completedTasks>=cat.requires.completedTasks;}
function canCollect(cat){return!!profile&&!isOwned(cat.id)&&milestoneMet(cat)&&profile.balance>=cat.cost;}
function renderCats(){
 $('#agent-collection-count').textContent=`${profile?.cats.length||1} / ${CATS.length}`;
 const filtered=CATS.filter(c=>(family==='all'||c.family===family)&&(view==='all'||view==='owned'&&isOwned(c.id)||view==='unowned'&&!isOwned(c.id))&&(!search||`${c.name} ${c.material} ${c.form} ${FAMILIES.find(f=>f.id===c.family)?.name}`.toLowerCase().includes(search.toLowerCase())));
 const pages=Math.max(1,Math.ceil(filtered.length/12));page=Math.min(page,pages-1);
 const filters=$('#agent-family-filters');filters.replaceChildren();for(const f of[{id:'all',name:'All families'},...FAMILIES]){const b=create('button','button',f.name);b.type='button';b.setAttribute('aria-pressed',f.id===family);b.onclick=()=>{family=f.id;page=0;renderCats();};filters.append(b);}
 const grid=$('#agent-cat-grid');grid.replaceChildren();for(const cat of filtered.slice(page*12,page*12+12)){
 const owned=isOwned(cat.id),card=create('button',`agent-cat-card ${owned?'owned':''} ${state.companion===cat.id?'is-companion':''}`);card.type='button';card.dataset.cat=cat.id;card.setAttribute('aria-label',`Inspect ${cat.name}, ${cat.material}, ${owned?'collected':cat.requires?'practice milestone':`${cat.cost} luck`}`);
 const top=create('span','eyebrow',cat.number);top.append(create('span','',cat.rarity));const img=create('img');img.src=`/lucky-cat/cats/${cat.id}.png`;img.alt='';img.loading='lazy';card.append(top,img,create('h3','',cat.name),create('p','',cat.material),create('span','agent-cat-label',owned?state.companion===cat.id?'✓ YOUR COMPANION':'✓ COLLECTED':cat.requires?milestoneMet(cat)?'✦ MILESTONE READY':'◇ PRACTICE MILESTONE':`${cat.cost} LUCK`));card.onclick=()=>openCat(cat);grid.append(card);
 }
 if(!filtered.length)grid.append(create('p','agent-empty','No sculpture matches this little corner. Try another name or family.'));
 $('#agent-cats-page').textContent=`${page+1} / ${pages}`;$('#agent-cats-prev').disabled=page===0;$('#agent-cats-next').disabled=page>=pages-1;
 $('#agent-collection-copy').textContent=family==='all'?'Known prices. Earned milestones. Choose the cat you want.':FAMILIES.find(f=>f.id===family)?.principle||'';
}
function openCat(cat){detailCat=cat;$('#agent-detail-image').src=`/lucky-cat/cats/${cat.id}.png`;$('#agent-detail-image').alt=`${cat.name}, ${cat.material} lucky cat sculpture`;$('#agent-detail-number').textContent=`SCULPTURE ${cat.number} / 060 · ${FAMILIES.find(f=>f.id===cat.family).name.toUpperCase()}`;$('#agent-detail-title').textContent=cat.name;$('#agent-detail-description').textContent=cat.desc;$('#agent-detail-meta').textContent=`${cat.material} · ${cat.form} · ${cat.rarity}`;
 const requirements=$('#agent-detail-requirements');requirements.replaceChildren();if(cat.requires){for(const[amount,target,label]of[[profile?.lifetimePoints||0,cat.requires.lifetimePoints,'lifetime luck'],[profile?.completedTasks||0,cat.requires.completedTasks,'finished tasks']]){const wrap=create('div','agent-requirement',`${Math.min(amount,target)} / ${target} ${label}`),progress=create('progress');progress.value=amount;progress.max=target;progress.setAttribute('aria-label',`${label} for ${cat.name}`);wrap.append(progress);requirements.append(wrap);}}
 if(!isOwned(cat.id))requirements.append(create('p','agent-field-hint',!profile?'Connect your agent to collect this sculpture.':cat.requires&&!milestoneMet(cat)?'Meet both milestones to claim this piece.':profile.balance<cat.cost?`${cat.cost-profile.balance} more luck to collect this sculpture.`:'Ready when you are.'));
 $('#agent-detail-collect').textContent=isOwned(cat.id)?state.companion===cat.id?'Your current companion':'Make my companion':cat.requires?'Claim this milestone':`Collect · ${cat.cost} luck`;
 $('#agent-detail-collect').disabled=isOwned(cat.id)?state.companion===cat.id:!canCollect(cat)||!!state.pending||busy;
 if(!$('#agent-cat-dialog').open)$('#agent-cat-dialog').showModal();
}
function renderAll(preserve=true){if(preserve)saveCurrentDraft();renderConnection();renderDesk();renderPending();renderForm();renderHistory();renderCharms();renderCats();renderBusy();}

$('#agent-connect').onclick=connect;$('#agent-new-task').onclick=startNew;$('#agent-completion-new').onclick=startNew;
$('#agent-refresh').onclick=async()=>{if(busy)return;busy=true;renderBusy();try{await refresh();toast(state.pending?'No matching recent receipt yet. Retry the exact saved request to resolve it.':'Your profile is current.');}catch(e){toast(friendlyError(e));}finally{busy=false;renderBusy();}};
$('#agent-retry').onclick=()=>state.pending&&runAction(state.pending.body);
$('#agent-task-form').addEventListener('input',saveCurrentDraft);$('#agent-task-form').addEventListener('change',saveCurrentDraft);
$('#agent-phase-fields').onclick=e=>{const button=e.target.closest('button');if(!button||busy||state.pending)return;
 if(button.id==='agent-add-check'||button.dataset.removeCheck!==undefined){const values=phaseFormValues();if(button.id==='agent-add-check'&&values.checks.length<6)values.checks.push({check:'',outcome:'',evidence:''});else if(button.dataset.removeCheck!==undefined&&values.checks.length>1)values.checks.splice(Number(button.dataset.removeCheck),1);state=putDraft(state,formKey,values);persist();renderForm();renderBusy();if(button.id==='agent-add-check')$$('[data-check="check"]').at(-1)?.focus();}
};
function lines(value){return String(value).split('\n').map(s=>s.trim()).filter(Boolean);}
function assertLines(items,name,min,max){if(items.length<min||items.length>max)throw new Error(`${name}-must-have-${min}-${max}-items`);if(items.some(s=>s.length<12||s.length>(name==='plan'?300:500)))throw new Error(`${name}-must-be-12-${name==='plan'?300:500}-characters`);if(new Set(items).size!==items.length)throw new Error(`${name}-must-be-distinct`);}
$('#agent-task-form').onsubmit=async e=>{e.preventDefault();if(busy||!profile||state.pending)return;
 const phase=nextPhase(),task=selectedTask(),values=phaseFormValues();let body={type:phase,taskId:task?.id||state.newTaskId};
 try{
 if(phase==='task.start'){const plan=lines(values.plan);assertLines(plan,'plan',3,6);Object.assign(body,{goal:values.goal.trim(),plan});}
 if(phase==='task.deliver'){const evidence=lines(values.evidence);assertLines(evidence,'evidence',1,6);Object.assign(body,{summary:values.summary.trim(),evidence});}
 if(phase==='task.verify'){const checks=values.checks.map(c=>({check:c.check.trim(),outcome:c.outcome,evidence:c.evidence.trim()}));if(checks.some(c=>!['passed','failed','uncertain'].includes(c.outcome)))throw new Error('check-outcome-invalid');if(new Set(checks.map(c=>c.check)).size!==checks.length)throw new Error('checks-must-be-distinct');Object.assign(body,{checks,limitation:values.limitation.trim()});}
 if(phase==='task.reflect')Object.assign(body,{lesson:values.lesson.trim(),nextStep:values.nextStep.trim()});
 await runAction(body);
 }catch(error){toast(friendlyError(error));}
};
$$('[data-history]').forEach(b=>b.onclick=()=>{historyView=b.dataset.history;renderHistory();});
$('#agent-cat-search').oninput=e=>{search=e.target.value;page=0;renderCats();};$('#agent-collection-view').onchange=e=>{view=e.target.value;page=0;renderCats();};$('#agent-cats-prev').onclick=()=>{page--;renderCats();};$('#agent-cats-next').onclick=()=>{page++;renderCats();};
$('#agent-detail-collect').onclick=async()=>{if(!detailCat||busy)return;if(isOwned(detailCat.id)){state.companion=detailCat.id;previewCat=null;persist();renderAll();$('#agent-cat-dialog').close();toast(`${detailCat.name} is your desk companion.`);return;}const result=await runAction({type:'cat.collect',catId:detailCat.id});if(result)$('#agent-cat-dialog').close();else openCat(detailCat);};
$('#agent-detail-preview').onclick=()=>{if(!detailCat)return;previewCat=detailCat.id;renderDesk();$('#agent-cat-dialog').close();$('#agent-scene').scrollIntoView({behavior:lessMotion?'instant':'smooth',block:'center'});};$('#agent-preview-return').onclick=()=>{previewCat=null;renderDesk();};
async function copyText(value,success){try{await navigator.clipboard.writeText(value);toast(success);}catch{toast('Clipboard unavailable. The text remains visible to select and copy.');}}
$('#agent-guide-copy').onclick=()=>state.guide&&copyText(`${state.guide.title}\n\n${state.guide.purpose}\n\n${state.guide.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}`,'Guide copied. One useful step at a time.');
$('#agent-guide-plan').onclick=()=>{if(!state.guide||busy||state.pending)return;saveCurrentDraft();state.selectedTask='new';const key=`${state.newTaskId}:task.start`,existing=getDraft(state,key)||{};
 if(existing.plan?.trim()){toast('Your next plan already has a draft. Keep it, or clear the plan field before using these steps.');formKey=null;renderAll(false);return;}
 state=putDraft(state,key,{goal:existing.goal||'',plan:state.guide.steps.slice(0,6).join('\n')});formKey=null;persist();renderAll(false);$('#agent-work').scrollIntoView({behavior:lessMotion?'instant':'smooth',block:'start'});$('#agent-phase-fields [name="goal"]')?.focus({preventScroll:true});toast('Guide steps are in your draft. Give them a real outcome and edit before submitting.');
};
function updateMotion(){scene.setReducedMotion(lessMotion);$('#agent-motion').setAttribute('aria-pressed',lessMotion);$('#agent-motion').setAttribute('aria-label',lessMotion?'Enable sculpture motion':'Reduce sculpture motion');}
$('#agent-motion').onclick=()=>{lessMotion=!lessMotion;updateMotion();};motionQuery.addEventListener('change',e=>{lessMotion=e.matches;updateMotion();});
const brief='Visit https://pointcast.xyz/api/lucky-cat for the signed practice protocol. Register an Ed25519 PointCast agent with lucky-cat:play and lucky-cat:profile scopes. Start a bounded task with a clear goal and 3–6 concrete plan steps. Record delivery evidence, 1–6 honest verification checks and their limitations, then a reflection and next step. Sign every request. Retry the exact same body with its original idempotencyKey until a matching receipt resolves it. Earn up to 60 free luck per UTC day, with 3 new tasks and 12 open tasks. Collect known sculptures or use practical focus, checking, and recovery charms. Evidence is self-reported; receipts do not independently certify work. Points do not change model abilities.';
$('#agent-copy-brief').onclick=()=>copyText(brief,'The starting brief is copied.');
window.addEventListener('storage',e=>{if(e.key===deskStorageKey(credential?.agentId)&&!busy){state=readDeskState(storage,credential?.agentId);formKey=null;renderAll(false);}});
window.addEventListener('pagehide',event=>{saveCurrentDraft();if(!event.persisted)scene.dispose();});
renderAll(false);updateMotion();
loadCredential().then(async c=>{if(!c)return;saveCurrentDraft();credential=c;state=readDeskState(storage,c.agentId);formKey=null;renderAll(false);try{await refresh({quiet:true});}catch(error){toast(friendlyError(error));}}).catch(error=>toast(friendlyError(error))).finally(()=>{booting=false;renderConnection();renderBusy();});

if(document.modelContext?.registerTool){const lifecycle=new AbortController();addEventListener('pagehide',event=>{if(!event.persisted)lifecycle.abort();});const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 const execute=async body=>{const result=await runAction(body);if(!result)throw new Error(lastError||'Action awaits a matching receipt; inspect the desk');return result;};
 register({name:'lucky_cat_agent_profile',description:'Read the connected agent signed ledger, current task, and pending receipt state. Connect explicitly first.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},async execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object');if(!credential)throw new Error('Connect an agent in the page first');if(busy||booting)throw new Error('Wait for the current ledger request to finish');await refresh({quiet:true});return{profile,selectedTaskId:state.selectedTask,nextPhase:nextPhase(),pending:state.pending?{body:state.pending.body,createdAt:state.pending.createdAt}:null};}});
 register({name:'lucky_cat_record_practice',description:'Submit one real signed plan, delivery, check, or reflection. Evidence is self-reported. Supply a stable retry key.',inputSchema:{type:'object',properties:{type:{enum:['task.start','task.deliver','task.verify','task.reflect']},idempotencyKey:{type:'string',minLength:8,maxLength:96},taskId:{type:'string',minLength:8,maxLength:96},goal:{type:'string'},plan:{type:'array',items:{type:'string'},minItems:3,maxItems:6},summary:{type:'string'},evidence:{type:'array',items:{type:'string'},minItems:1,maxItems:6},checks:{type:'array',minItems:1,maxItems:6,items:{type:'object',properties:{check:{type:'string'},outcome:{enum:['passed','failed','uncertain']},evidence:{type:'string'}},required:['check','outcome','evidence'],additionalProperties:false}},limitation:{type:'string'},lesson:{type:'string'},nextStep:{type:'string'}},required:['type','idempotencyKey','taskId'],additionalProperties:false},async execute(input){if(!Object.hasOwn(REWARDS,input?.type)||!input.idempotencyKey)throw new Error('A task action and stable retry key are required');return execute(input);}});
 register({name:'lucky_cat_collect_art',description:'Collect a known sculpture using this agent’s free earned luck, or claim a practice milestone.',inputSchema:{type:'object',properties:{catId:{type:'string'},idempotencyKey:{type:'string'}},required:['catId','idempotencyKey'],additionalProperties:false},async execute(input){if(!CATS.some(c=>c.id===input?.catId)||!input.idempotencyKey)throw new Error('Known cat and retry key required');return execute({type:'cat.collect',...input});}});
 register({name:'lucky_cat_use_work_charm',description:'Use this agent’s free luck for a focus, checking, or recovery guide; return its structured steps.',inputSchema:{type:'object',properties:{charmId:{enum:CHARMS.map(c=>c.id)},idempotencyKey:{type:'string'}},required:['charmId','idempotencyKey'],additionalProperties:false},async execute(input){if(!CHARMS.some(c=>c.id===input?.charmId)||!input.idempotencyKey)throw new Error('Known charm and retry key required');return execute({type:'charm.use',...input});}});
}
