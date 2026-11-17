/** Presentation only. No eligibility, elimination, authenticity or game-state decisions. */
const handle=s=>/^@[a-z0-9][a-z0-9_.-]{0,39}$/i.test(String(s))?String(s).toLowerCase():null;
export const portraitPath=s=>typeof s==='string'&&/^\/images\/(?:socrates-tag\/players|ufogp)\/[a-z0-9-]+\.svg$/.test(s)?s:null;
export function visualState(state, portraits={}, now=Date.now()) {
 const checked=Number(state?.checkedAt),stale=!Number.isFinite(checked)||checked<=0||now-checked>120000||checked>now+60000;
 const latest=state?.latest, deadline=state?.deadline;
 const active=!stale&&!state?.attention&&Number.isFinite(deadline)&&now<deadline;
 const moves=Array.isArray(state?.moves)?state.moves:[];
 return {status:stale?'Waiting for a fresh room read':state.attention?'Host review needed':!latest?'Waiting for a reported move':!active?'Reported clock elapsed':'Reported handoff · not verified',
  next:handle(latest?.tag),active,
  moves:moves.slice(-6).map(m=>({id:String(m.id??''),name:handle(m.address)||String(m.name??'Unknown player').slice(0,80),quote:String(m.quote??'').slice(0,250),svg:portraitPath(portraits[handle(m.address)?.slice(1)]),tag:handle(m.tag)}))};
}
