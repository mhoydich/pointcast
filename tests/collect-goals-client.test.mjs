import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import { mountCollect } from '../src/scripts/collect-goals-client.mjs';
import { STORAGE_KEY, emptyDraft, exportDraft, parseDraft } from '../src/lib/collect-goals.mjs';

// Use the real form markup. Astro closes textarea tags during compilation;
// normalize that syntax here before handing the source to the HTML parser.
const source = await readFile(new URL('../src/pages/collect.astro', import.meta.url), 'utf8');
const markup = source.replace(/^---[\s\S]*?---/, '').replace(/<script\b[\s\S]*?<\/script>/g, '')
  .replace(/<textarea([^>]*?)\s*\/>/g, '<textarea$1></textarea>');

function harness({ saved, storageFailure = false } = {}) {
  const dom = new JSDOM(markup, { url:'https://pointcast.xyz/collect#notebook' });
  const previous = Object.fromEntries(['window','document','location','FormData'].map(k => [k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  for (const k of Object.keys(previous)) Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:dom.window[k]});
  if (saved !== undefined) dom.window.localStorage.setItem(STORAGE_KEY,saved);
  if (storageFailure) Object.defineProperty(dom.window,'localStorage',{get(){ throw new Error('Storage denied'); }});
  const root = dom.window.document.querySelector('[data-collect-goals]');
  const $ = sel => root.querySelector(sel);
  const form = $('[data-resource-form]');
  const dispatch = (el,event) => el.dispatchEvent(new dom.window.Event(event,{bubbles:true,cancelable:true}));
  const fields = data => {
    for (const [key,value] of Object.entries(data)) {
      const input = form.elements.namedItem(key);
      if (input.type === 'checkbox') input.checked = value; else input.value = value;
    }
    dispatch(form.elements.namedItem('stage'),'change');
    if (data.allocationConfirmed !== undefined) form.elements.namedItem('allocationConfirmed').checked = data.allocationConfirmed;
  };
  mountCollect(root);
  return {dom,root,$,form,fields,dispatch,
    state:()=>parseDraft(dom.window.localStorage.getItem(STORAGE_KEY)),
    submit:()=>dispatch(form,'submit'),
    async importFile(text,{confirm=true,size=text.length}={}) {
      let prompts=0;
      dom.window.confirm=()=>{prompts++;return confirm;};
      const input=$('[data-import]');
      Object.defineProperty(input,'files',{configurable:true,value:[{size,text:async()=>text}]});
      dispatch(input,'change');
      await new Promise(resolve=>setImmediate(resolve));
      return prompts;
    },
    close(){dom.window.close();for(const[k,descriptor]of Object.entries(previous)){if(descriptor)Object.defineProperty(globalThis,k,descriptor);else delete globalThis[k];}}
  };
}

const resource = {title:'PointCast print project',stage:'lead',amount:'1200',date:'2026-10-24',evidence:''};

test('real page mounts once, opens notebook hash and persists a wishlist toggle once',()=>{
  const h=harness();try{
    mountCollect(h.root);
    assert.equal(h.$('[data-notebook]').open,true);
    h.$('[data-wishlist]').click();
    assert.equal(h.state().wishlist,true);
    assert.equal(h.$('[data-wishlist]').getAttribute('aria-pressed'),'true');
    assert.match(h.$('[data-wishlist-status]').textContent,/browser/);
    h.$('[data-wishlist]').click();
    assert.equal(h.state().wishlist,false);
  }finally{h.close();}
});

test('leads never fund realized totals; realized allocations require evidence and explicit confirmation',()=>{
  const h=harness();try{
    h.fields(resource);h.submit();
    assert.equal(h.state().resources.length,1);
    assert.equal(h.$('[data-total-leads]').textContent,'1');
    assert.equal(h.$('[data-total-realized]').textContent,'—');
    assert.equal(h.$('[data-total-allocated]').textContent,'—');
    h.fields({...resource,title:'Received project',stage:'realized',amount:'250.25'});h.submit();
    assert.match(h.$('[data-resource-error]').textContent,/Evidence reference is required/);
    assert.equal(h.state().resources.length,1);
    h.fields({...resource,title:'Received project',stage:'realized',amount:'250.25',evidence:'Public receipt 01'});h.submit();
    assert.equal(h.$('[data-total-realized]').textContent,'$250.25');
    h.fields({...resource,title:'Allocation',stage:'allocated',amount:'100',evidence:'Public receipt 02',allocationConfirmed:false});h.submit();
    assert.match(h.$('[data-resource-error]').textContent,/explicitly allocated/);
    h.form.elements.namedItem('allocationConfirmed').checked=true;h.submit();
    assert.equal(h.$('[data-total-allocated]').textContent,'$100.00');
    assert.equal(h.state().resources.length,3);
    assert.equal(h.form.elements.namedItem('stage').value,'lead');
    assert.equal(h.form.elements.namedItem('evidence').required,false);
  }finally{h.close();}
});

test('record text is inert, removal has undo, and saved records restore on a fresh mount',()=>{
  const h=harness();let saved;try{
    h.fields({...resource,title:'<img src=x onerror=alert(1)>',evidence:'<script>alert(1)</script>'});h.submit();
    assert.equal(h.$('[data-resource-list] img'),null);
    assert.equal(h.$('[data-resource-list] script'),null);
    assert.match(h.$('[data-resource-list]').textContent,/<img src=x/);
    h.$('[data-resource-list] button').click();
    assert.equal(h.state().resources.length,0);
    assert.equal(h.$('[data-undo]').hidden,false);
    h.$('[data-undo]').click();
    assert.equal(h.state().resources.length,1);
    assert.equal(h.$('[data-undo]').hidden,true);
    saved=h.dom.window.localStorage.getItem(STORAGE_KEY);
  }finally{h.close();}
  const restored=harness({saved});try{
    assert.equal(restored.$('[data-total-leads]').textContent,'1');
    assert.match(restored.$('[data-tracker-status]').textContent,/draft is loaded/);
  }finally{restored.close();}
});

test('unreadable existing storage is preserved while session-only changes remain usable',()=>{
  const h=harness({saved:'broken{'});try{
    assert.match(h.$('[data-tracker-status]').textContent,/Existing data is untouched/);
    h.fields(resource);h.submit();
    assert.equal(h.dom.window.localStorage.getItem(STORAGE_KEY),'broken{');
    assert.equal(h.$('[data-total-leads]').textContent,'1');
    assert.match(h.$('[data-tracker-status]').textContent,/Not saved to browser storage/);
    h.$('[data-wishlist]').click();
    assert.match(h.$('[data-wishlist-status]').textContent,/this visit only/);
  }finally{h.close();}
});

test('blocked browser storage does not disable the local session tracker',()=>{
  const h=harness({storageFailure:true});try{
    h.fields(resource);h.submit();
    assert.equal(h.$('[data-total-leads]').textContent,'1');
    assert.match(h.$('[data-tracker-status]').textContent,/Not saved/);
  }finally{h.close();}
});

test('import rejects invalid/oversize files and cancel without changing current draft, then restores notes after confirmation',async()=>{
  const h=harness();try{
    h.fields(resource);h.submit();
    const before=h.dom.window.localStorage.getItem(STORAGE_KEY);
    assert.equal(await h.importFile('{broken'),0);
    assert.equal(h.dom.window.localStorage.getItem(STORAGE_KEY),before);
    assert.match(h.$('[data-tracker-status]').textContent,/Import not applied/);
    assert.equal(await h.importFile('{}',{size:300001}),0);
    assert.equal(h.dom.window.localStorage.getItem(STORAGE_KEY),before);
    const next={...emptyDraft(),wishlist:true,notes:'Verify final configuration',nextReviewDate:'2026-11-01'};
    assert.equal(await h.importFile(exportDraft(next),{confirm:false}),1);
    assert.equal(h.dom.window.localStorage.getItem(STORAGE_KEY),before);
    assert.equal(await h.importFile(exportDraft(next)),1);
    assert.deepEqual(h.state(),next);
    assert.equal(h.$('[data-notes-form]').elements.namedItem('notes').value,next.notes);
    assert.equal(h.$('[data-notes-form]').elements.namedItem('nextReviewDate').value,next.nextReviewDate);
  }finally{h.close();}
});

test('research notes persist separately from public funding and remain in JSON roundtrip',()=>{
  const h=harness();try{
    const notes=h.$('[data-notes-form]');
    notes.elements.namedItem('notes').value='Check vehicle and ownership costs';
    notes.elements.namedItem('nextReviewDate').value='2026-11-24';
    h.dispatch(notes,'submit');
    assert.equal(h.state().notes,'Check vehicle and ownership costs');
    assert.equal(h.state().nextReviewDate,'2026-11-24');
    assert.match(h.root.textContent,/Funding unverified/);
    assert.equal(h.$('[data-total-allocated]').textContent,'—');
  }finally{h.close();}
});

test('export downloads exactly the current validated draft with a descriptive JSON filename',async()=>{
  const h=harness();
  const originalCreate=URL.createObjectURL;
  const originalClick=h.dom.window.HTMLAnchorElement.prototype.click;
  let exportedBlob;
  let downloaded;
  try{
    h.fields(resource);h.submit();
    URL.createObjectURL=blob=>{exportedBlob=blob;return 'blob:collect-test';};
    h.dom.window.HTMLAnchorElement.prototype.click=function(){downloaded={href:this.href,name:this.download};};
    h.$('[data-export]').click();
    assert.match(downloaded.name,/^pointcast-collect-001-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(downloaded.href,'blob:collect-test');
    assert.equal(exportedBlob.type,'application/json');
    assert.deepEqual(parseDraft(await exportedBlob.text()),h.state());
    assert.match(h.$('[data-tracker-status]').textContent,/Export prepared/);
  }finally{
    URL.createObjectURL=originalCreate;
    h.dom.window.HTMLAnchorElement.prototype.click=originalClick;
    h.close();
  }
});

test('quota write failure clearly falls back to session-only without replacing saved content',()=>{
  const saved=exportDraft({...emptyDraft(),notes:'Existing record'});
  const h=harness({saved});
  const proto=Object.getPrototypeOf(h.dom.window.localStorage);
  const original=proto.setItem;
  try{
    proto.setItem=()=>{throw new Error('Quota exceeded');};
    h.fields(resource);h.submit();
    assert.equal(h.$('[data-total-leads]').textContent,'1');
    assert.match(h.$('[data-tracker-status]').textContent,/Not saved to browser storage/);
    assert.equal(h.dom.window.localStorage.getItem(STORAGE_KEY),saved);
  }finally{proto.setItem=original;h.close();}
});

test('a stale tab preserves the newer saved draft and keeps its own edits exportable for this visit',async()=>{
  const original=exportDraft(emptyDraft());
  const h=harness({saved:original});
  const originalCreate=URL.createObjectURL;
  const originalClick=h.dom.window.HTMLAnchorElement.prototype.click;
  let exportedBlob;
  try{
    // A second tab saves after this tab mounted. localStorage writes from
    // another document do not update the first tab's in-memory state.
    const newer={...emptyDraft(),wishlist:true,notes:'Saved from the other tab',nextReviewDate:'2026-12-01'};
    const newerRaw=exportDraft(newer);
    h.dom.window.localStorage.setItem(STORAGE_KEY,newerRaw);
    h.fields(resource);h.submit();
    assert.equal(h.dom.window.localStorage.getItem(STORAGE_KEY),newerRaw);
    assert.equal(h.$('[data-total-leads]').textContent,'1');
    assert.match(h.$('[data-tracker-status]').textContent,/Another tab saved a newer notebook/);
    assert.match(h.$('[data-tracker-status]').textContent,/version is preserved/);
    // Subsequent changes must also stay in memory, not overwrite the newer tab.
    h.fields({...resource,title:'Second local idea',amount:''});h.submit();
    h.$('[data-wishlist]').click();
    assert.equal(h.dom.window.localStorage.getItem(STORAGE_KEY),newerRaw);
    assert.equal(h.$('[data-total-leads]').textContent,'2');
    assert.match(h.$('[data-wishlist-status]').textContent,/this visit only/);
    URL.createObjectURL=blob=>{exportedBlob=blob;return 'blob:collect-conflict-test';};
    h.dom.window.HTMLAnchorElement.prototype.click=function(){};
    h.$('[data-export]').click();
    const exported=parseDraft(await exportedBlob.text());
    assert.equal(exported.resources.length,2);
    assert.equal(exported.notes,'');
    assert.equal(exported.wishlist,true);
    assert.deepEqual(h.state(),newer);
  }finally{
    URL.createObjectURL=originalCreate;
    h.dom.window.HTMLAnchorElement.prototype.click=originalClick;
    h.close();
  }
});


test('legacy claim/error queries and Kennel hashes forward intact while ordinary notebook links stay on Collect',()=>{
  const inline=source.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline,'Collect must provide its legacy-link bridge.');
  const cases=[
    ['?claim=1&t=opaque%2Bvalue&from=daily-email','#collection-title',true],
    ['?confirmed=1&claim=1','#collect-title',true],
    ['?collect_error=daily-link-invalid&from=daily-email','#detail',true],
    ['','#collect-title',true],
    ['','#collection-title',true],
    ['?source=old-bookmark','#collection-title',true],
    ['','#notebook',false],
    ['?source=wishlist','#notebook',false],
    ['','#dossier',false],
    ['','',false],
  ];
  for(const [search,hash,redirect] of cases){
    const destinations=[];
    const context=createContext({URLSearchParams,location:{search,hash,replace:value=>destinations.push(value)}});
    // Reusing the same context also guards the IIFE against lexical redeclaration
    // if a client router executes this inline bridge on a repeated visit.
    runInContext(inline,context);
    runInContext(inline,context);
    assert.deepEqual(destinations,redirect?Array(2).fill('/collect/kennel'+search+hash):[],search+hash);
  }
});
