export const refKey = r => r ? r.join(':') : null;
export function receipt(evidence, ref) {
  const m=evidence.messages[refKey(ref)];
  return m && !m.hidden && !m.withdrawn ? m : null;
}
export function header(m,kind) { return !!m && new RegExp('(?:^\\s*|·\\s*)'+kind+'\\b','i').test(m.body.split('\n')[0]); }
export function derive({definitions,evidence}) {
  const ids=new Set();
  const jobs=definitions.map(d=>{
    if(ids.has(d.id))throw Error('Duplicate work item');ids.add(d.id);
    const claim=receipt(evidence,d.claim), done=receipt(evidence,d.done), partial=receipt(evidence,d.partial);
    const claimOK=claim && claim.from.address==='@'+d.owner && header(claim,'MINE');
    const doneOK=done && done.from.address==='@'+d.owner && header(done,'DONE');
    const blocked=partial && /\bBLOCKED\b/.test(partial.body.split('\n')[0]);
    const ms=claimOK && doneOK ? Date.parse(done.at)-Date.parse(claim.at) : null;
    const flags=[];if(d.claim&&!claimOK)flags.push('Claim receipt missing or unavailable in this read; interval unavailable.');
    if(d.done&&!doneOK)flags.push('Final receipt is not retained as a DONE; delivery is unconfirmed.');
    if(ms!==null&&ms<0)flags.push('Receipt order needs a human check; interval unavailable.');
    return {...d,claim:claimOK?claim:null,done:doneOK?done:null,partial,state:doneOK?'delivered':blocked?'blocked':'unconfirmed',intervalMs:ms!==null&&ms>=0?ms:null,flags,
      sources:['request','claim','partial','done','support','blocker','replacement'].map(k=>({role:k,message:receipt(evidence,d[k])})).filter(x=>x.message)};
  });
  const createdPrs=[...new Set(definitions.flatMap(j=>j.prs))].map(n=>evidence.pullRequests[String(n)]).filter(Boolean);
  const replies=evidence.context.firstCheckReplies;
  return {jobs,createdPrs,evidence,summary:{selected:jobs.length,delivered:jobs.filter(j=>j.state==='delivered').length,blocked:jobs.filter(j=>j.state==='blocked').length,unconfirmed:jobs.filter(j=>j.state==='unconfirmed').length,artifactPrs:createdPrs.length},
    firstCheck:{claimed:replies.some(m=>header(m,'MINE\\s*(?:·\\s*)?FIRST-CHECK')),done:replies.some(m=>header(m,'DONE\\s*(?:·\\s*)?FIRST-CHECK'))}};
}
export function intervalLabel(ms) {
  if(ms===null||!Number.isFinite(ms)||ms<0)return 'Unavailable';
  const s=Math.round(ms/1000);return s>=3600?`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`:`${Math.floor(s/60)}m ${s%60}s`;
}
export function pt(iso,full=false) {
  if(!iso)return 'Unavailable';
  return new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',...(full?{month:'short',day:'numeric',year:'numeric'}:{}),hour:'numeric',minute:'2-digit'}).format(new Date(iso))+' PT';
}
