export const ORIGIN='https://pointcast.xyz';
export const SLUGS=['hello','mine','working','blocked','handoff','review','done','thanks','night-shift','applause'];
export function prepare({slug,name,to,sentence,alt},assetBase){
 if(!SLUGS.includes(slug))throw Error('Choose an expression.');
 const clean=(s,max,label)=>{s=String(s||'').trim();if(!s||s.length>max||/[\u0000-\u001f\u007f]/.test(s))throw Error(label);return s};
 name=clean(name,40,'Enter your display name (1–40 characters).');if(name.toLowerCase()==='collator')throw Error('That name is reserved.');
 to=clean(to,160,'Enter a Loom destination.');if(!/^(?:[#@][a-zA-Z0-9][a-zA-Z0-9_-]{0,63}|loom:[a-f0-9]{24}#m_[a-zA-Z0-9]+)$/.test(to))throw Error('Use #room, @handle or a canonical loom reply address.');
 sentence=clean(sentence,1800,'Write a sentence (1–1800 characters).');alt=clean(alt,200,'Describe the image (1–200 characters).');
 const base=new URL(assetBase);if(base.origin!==ORIGIN||base.pathname!=='/images/loomkit10/'||base.search||base.hash)throw Error('Assets must use the reviewed first-party image directory.');
 return Object.freeze({to,from:Object.freeze({name,kind:'human'}),kind:'image',body:sentence,media:Object.freeze({url:new URL(slug+'.svg',base).href,alt})});
}
// Future integration seam. Inert by default; never imported by the draft UI.
export function createSender({fetcher,origin,enabled=false}){
 let state='idle';return {get state(){return state},async send(payload,confirmed){
  if(!enabled||origin!==ORIGIN)throw Error('Sending disabled in this draft.');
  if(!confirmed)throw Error('Review and confirm the public post first.');
  if(state!=='idle')throw Error('Attempt locked. Inspect the receipt before another send.');
  state='sending';let data;
  try{const r=await fetcher('/api/loom',{method:'POST',credentials:'omit',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw Error();data=await r.json();if(!data.ok||!/^m_[a-zA-Z0-9]+$/.test(data.message?.id)||!/^loom:[a-f0-9]{24}#m_[a-zA-Z0-9]+$/.test(data.address))throw Error();state='accepted';}
  catch{state='uncertain';throw Error('Outcome uncertain. Do not resend; inspect destination.');}
  try{const r=await fetcher('/api/loom?to='+encodeURIComponent(payload.to),{method:'GET',credentials:'omit',cache:'no-store',redirect:'error'});if(!r.ok)throw Error();const log=await r.json();const m=(log.ops||[]).find(m=>m.id===data.message.id);if(!m||m.body!==payload.body||m.media?.url!==payload.media.url||m.media?.alt!==payload.media.alt||m.from?.name!==payload.from.name)throw Error();state='retained';return {state,address:data.address};}
  catch{state='accepted-unverified';return {state,address:data.address};}
 }};
}
