/** Sid's integration adapter. All facts come through Ada's office-data/v1 modules. */
export const OFFICE_END = Date.parse('2026-11-18T17:24:00.000Z');
const SCHEMA = 'pointcast.office-view/v1';
const fixed = [1767, 1770, 1773]; // A small explicit watch list, not a repository-wide count.
export async function readOfficeSnapshot({ records, adapters, fetcher = fetch, clock = Date.now } = {}) {
  const started = clock();
  if (started >= OFFICE_END) return { schema: SCHEMA, state: 'ended', observedAt: new Date(started).toISOString(), desks: [], events: [], edges: [], merges: [], blocked: [], errors: ['experiment_ended'] };
  if (!Array.isArray(records) || records.length > 25) throw new TypeError('bounded trusted records required');
  const boundedFetch = (...args) => { if (clock() >= OFFICE_END) throw new Error('experiment_ended'); return fetcher(...args); };
  const { validateDeclaration, buildDeskRegistry, readLoom, normalizeLoomEvents, readPrStates } = adapters;
  // These records are parent-runtime observations checked outside the public board.
  // Never accept declarations/attestations/portraits from a query or POST payload.
  const declarations = records.map(r => ({ validation: validateDeclaration(r.declaration, {attestation:r.attestation,now:started}), receipt:r.receipt }));
  const portraits = Object.fromEntries(records.map(r => [r.declaration.handle, {
    src:'/images/ufogp/sid.svg',whole:true,provenance:'official-nouns-traits',sourceUrl:'https://pointcast.xyz/images/ufogp/provenance.json'
  }]));
  const registry = buildDeskRegistry({declarations,portraits,now:started});
  const rooms = await Promise.all(['#officenoun-tasks', ...records.map(r => r.declaration.handle)].map(to => readLoom({to,fetcher:boundedFetch,now:clock(),timeoutMs:5000,maxAgeMs:120000})));
  const now = clock();
  const observed = normalizeLoomEvents({rooms,now,maxAgeMs:900000});
  const pr = await readPrStates({prs:fixed,fetcher:boundedFetch,now:clock(),maxAgeMs:120000});
  const eligible = new Set(registry.data.desks.filter(d => d.eligible).map(d => d.handle));
  const events = observed.data.events.filter(e => eligible.has(e.handle));
  const all = new Map(observed.data.events.map(e => [e.id,e]));
  const edges = events.filter(e => e.type === 'reply').flatMap(e => {
    const parent = all.get(e.roomKey+'#'+e.parentId);
    return parent && eligible.has(parent.handle) ? [{id:e.id,parentId:e.parentId,fromHandle:e.handle,toHandle:parent.handle,sourceUrl:e.sourceUrl}] : [];
  });
  const errors = [...new Set([...declarations.flatMap(r=>r.validation.errors),...registry.errors,...observed.errors,...pr.errors])];
  const snapshot = new Date(clock()).toISOString();
  // Display parent-observed sessions without claiming registry eligibility. This
  // keeps contract failures visible, rather than silently relabeling parentage.
  const visible = records.map(r => registry.data.desks.find(d=>d.handle===r.declaration.handle) || {
    handle:r.declaration.handle,name:r.declaration.name,eligible:false,state:'unverified',portrait:portraits[r.declaration.handle]
  });
  const desks = visible.map(d => {
    const last = events.filter(e => e.handle === d.handle).sort((a,b)=>b.at.localeCompare(a.at))[0];
    return {handle:d.handle,name:d.name,nounUrl:d.portrait?.src || null,eligible:d.eligible,identityState:d.state,
      lifecycle:records.find(r=>r.declaration.handle===d.handle)?.lifecycle || 'unknown',
      artNote:'Shared Sid parent-seat portrait, not a unique child identity.',
      facts:{lastPostAt:last?.at || null,postUrl:last?.sourceUrl || null,asOf:snapshot,stale:!d.eligible || !['ok','idle'].includes(observed.state),status:d.eligible?'Declaration checked against parent runtime record':'Declaration or portrait unresolved'}};
  });
  const merges = pr.data.pullRequests.filter(p=>p.state==='merged' && p.mergeSha).map(p=>({number:p.number,url:p.url,mergedAt:p.mergedAt,verified:true}));
  const blocked = pr.data.pullRequests.filter(p=>p.blocked===true).map(p=>({number:p.number,url:p.url,reason:'Provider reports a conflicting head',checkedAt:pr.observedAt,verified:true}));
  return {schema:SCHEMA,state:errors.length?'degraded':events.length?'ok':'idle',observedAt:snapshot,desks,events,edges,merges,blocked,
    evidenceFresh:pr.state==='ok',trackedPrs:fixed,errors,sourceUrls:rooms.map(r=>r.sourceUrl).filter(Boolean),
    expiresAt:new Date(OFFICE_END).toISOString()};
}
