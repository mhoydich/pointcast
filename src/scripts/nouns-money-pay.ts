import { NounsMoneySandbox, IndexedDbSandboxStore, NounsMoneyError, type NoteId } from '../../packages/nouns-money-sdk/src/index';
let release = () => {};
export function mountPaymentSandbox() {
 release(); const root = document.querySelector<HTMLElement>('[data-nm-pay]'); if (!root) return;
 const sandbox = new NounsMoneySandbox(new IndexedDbSandboxStore());
 const $ = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
 let active: any = null; let busy = false; let disposed = false; let createKey = crypto.randomUUID(); let confirmKey = crypto.randomUUID(); let cancelKey = crypto.randomUUID();
 const status = (text: string) => { if (!disposed) $('[data-nm-pay-status]').textContent = text; };
 const selected = () => [...root.querySelectorAll<HTMLInputElement>('[data-nm-selection] input:checked')].map(input => input.value as NoteId);
 const update = () => {
   const ids = selected(); $('[data-nm-selection-count]').textContent = `${ids.length} / ${active?.noteCount || 0} selected`;
   $<HTMLButtonElement>('[data-nm-confirm]').disabled = busy || !active || active.status !== 'requires_notes' || ids.length !== active.noteCount;
   root.querySelectorAll<HTMLInputElement>('[data-nm-selection] input').forEach(input => { input.disabled = busy || active?.status !== 'requires_notes' || !input.checked && ids.length >= active?.noteCount; });
   $<HTMLButtonElement>('[data-nm-cancel]').disabled = busy || active?.status !== 'requires_notes';
   $<HTMLButtonElement>('[data-nm-create-button]').disabled = busy;
   $<HTMLButtonElement>('[data-nm-back]').disabled = busy;
   root.querySelectorAll<HTMLButtonElement>('[data-nm-resume]').forEach(button => { button.disabled = busy; });
 };
 const renderActive = (intent: any) => {
   active = intent; confirmKey = crypto.randomUUID(); cancelKey = crypto.randomUUID();
   $('[data-nm-setup]').hidden = true; $('[data-nm-checkout]').hidden = intent.status !== 'requires_notes';
   $('[data-nm-intent-label]').textContent = intent.label;
   $('[data-nm-select-instruction]').textContent = `Choose exactly ${intent.noteCount} distinct demo ${intent.noteCount === 1 ? 'note' : 'notes'}. Your collection stays on its shelf.`;
   $('[data-nm-intent-meta]').textContent = `${intent.id} · ${intent.status} · TEST`;
   root.querySelectorAll<HTMLInputElement>('[data-nm-selection] input').forEach(input => { input.checked = intent.noteIds.includes(input.value); });
   const receipt = $('[data-nm-receipt]'); receipt.replaceChildren(); receipt.hidden = intent.status === 'requires_notes';
   if (!receipt.hidden) {
     const h2 = document.createElement('h2'); h2.textContent = intent.status === 'succeeded' ? 'Demo payment confirmed' : 'Demo intent canceled';
     const p = document.createElement('p'); p.textContent = 'TEST RECEIPT · No funds moved. No artwork or tokens transferred.';
     const dl = document.createElement('dl');
     for (const [label, value] of [['Intent',intent.id],['Status',intent.status],['Exchange',intent.label],['Receipt',intent.receipt?.id || 'No receipt issued'],['Demo notes',intent.noteIds.join(', ') || 'None'],['Updated',intent.updatedAt]]) { const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=value;dl.append(dt,dd); }
     const button = document.createElement('button'); button.type = 'button'; button.dataset.nmBack = ''; button.textContent = 'Create another demo'; receipt.append(h2,p,dl,button);
   }
   update();
 };
 const history = async () => {
   const intents = await sandbox.listIntents(); if (disposed) return;
   const list = $('[data-nm-intents]'); list.replaceChildren();
   if (!intents.length) { const li=document.createElement('li');li.textContent='No demo intents yet.';list.append(li); }
   for (const intent of intents.slice(0,12)) {
     const li=document.createElement('li'); const text=document.createElement('div'); text.textContent=`${intent.label} · ${intent.status} · ${intent.noteCount} demo ${intent.noteCount===1?'note':'notes'}`;
     const button=document.createElement('button');button.type='button';button.dataset.nmResume=intent.id;button.textContent=intent.status==='requires_notes'?'Resume':'View receipt';button.disabled=busy;li.append(text,button);list.append(li);
   }
 };
 const act = async (work:()=>Promise<any>, success:string) => {
   if (busy || disposed) return; busy=true;update(); status('Saving this demo action…');
   try { const intent = await work(); if(disposed)return;renderActive(intent);status(success);await history(); }
   catch(error) { status(error instanceof NounsMoneyError ? `${error.message} (${error.code})` : 'Sandbox action failed. Retry with the same action; no success was confirmed.'); }
   finally { busy=false;if(!disposed)update(); }
 };
 const submit = (event:Event) => { if(!(event.target as Element).matches('[data-nm-create]'))return;event.preventDefault();const form=new FormData(event.target as HTMLFormElement); void act(async()=>{const intent=await sandbox.createIntent({label:String(form.get('label')||''),noteCount:Number(form.get('noteCount')),mode:'test'},{idempotencyKey:createKey});createKey=crypto.randomUUID();return intent;},'Demo intent created. Choose your demo notes.'); };
 const click = (event:Event) => { const target=(event.target as Element).closest<HTMLElement>('button');if(!target||busy)return;
   if(target.hasAttribute('data-nm-confirm')&&active) { const noteIds=selected();void act(()=>sandbox.confirmIntent(active.id,{noteIds,mode:'test'},{idempotencyKey:confirmKey}),'Demo payment confirmed. The saved receipt records a simulation only.'); }
   if(target.hasAttribute('data-nm-cancel')&&active)void act(()=>sandbox.cancelIntent(active.id,{idempotencyKey:cancelKey}),'Intent canceled. No funds or notes moved.');
   if(target.hasAttribute('data-nm-back')) { active=null; $('[data-nm-setup]').hidden=false;$('[data-nm-checkout]').hidden=true;$('[data-nm-receipt]').hidden=true;status('Create a new demo or resume an open intent from history.');update(); }
   if(target.dataset.nmResume) { void act(()=>sandbox.retrieveIntent(target.dataset.nmResume!),'Loaded this browser’s saved demo.'); }
 };
 const change = () => { confirmKey=crypto.randomUUID();update(); };
 root.addEventListener('submit',submit);root.addEventListener('click',click);root.addEventListener('change',change);
 release=()=>{disposed=true;root.removeEventListener('submit',submit);root.removeEventListener('click',click);root.removeEventListener('change',change);};
 void history().then(()=>{if(!disposed){update();status('Local sandbox ready. No account, wallet signature, gas or funds required.');}}).catch(()=>{status('Sandbox storage is unavailable. Enable site storage to create persistent demo intents.');$<HTMLButtonElement>('[data-nm-create-button]').disabled=true;});
}
