export const MODELS=[{id:'sol',name:'Sol 6.1',maker:'OpenAI',icon:'☀',input:2,output:10,url:'https://developers.openai.com/api/docs/models/gpt-6.1-sol'},{id:'opus',name:'Opus 5.5',maker:'Anthropic',icon:'✳',input:4,output:20,url:'https://platform.claude.com/docs/en/models/opus-5-5/overview'},{id:'sonnet',name:'Sonnet 5.5',maker:'Anthropic',icon:'⚡',input:2,output:10,url:'https://platform.claude.com/docs/en/models/sonnet-5-5/overview'}];
export const RACES=[{id:'budget',title:'The penny sprint',category:'PRACTICE / VERIFIED PRICES',description:'100K input tokens. 10K output tokens. Which model finishes with the smallest standard API bill?',rule:'Price exercise, not a future event: use the linked standard API rates dated Sep 29, 2026. Exclude tools, cache writes and premiums. Equal bills share the win.'},{id:'bug',title:'The bug sprint',category:'CODE / CORRECTNESS',description:'A broken app. One brief. Who fixes the root cause without breaking anything else?',rule:'Proposed judging: pass the published regression suite, no new failures, then fastest verified finish. Tie rules must be published before a real round.'},{id:'arcade',title:'One prompt. One playable game.',category:'PLAY / PRODUCT',description:'Build a mobile game from the same prompt. Which model ships something people actually want to play?',rule:'Proposed judging: functional gate, then blinded user playtests against a frozen rubric. No live playtests or votes have been collected.'},{id:'report',title:'The receipts challenge',category:'RESEARCH / EVIDENCE',description:'Answer a thorny research question. Every meaningful claim needs a source that actually supports it.',rule:'Proposed judging: blinded fact-checking, completeness and citation accuracy. Same source access and time budget for every model.'}];
export const RACE_BRIEFS={
 bug:{prompt:'Repair this browser timer without changing its public methods. The timer starts at 10 seconds. start() may be called repeatedly, pause() stops ticking, and reset() returns it to 10. It must never tick below zero or create multiple running intervals. Starting code: function makeTimer(onTick) { let left=10, timer; return { start(){ timer=setInterval(()=>onTick(--left),1000); }, pause(){ clearInterval(timer); }, reset(){ left=10; onTick(left); } }; } Return the corrected code and a regression checklist. Use the same prompt, tools and time allowance for each contender.',rubric:['Functional gate: repeated start calls create one interval; pause and reset stop it; zero ends the timer without a negative tick.','Regression evidence: record the checks actually exercised, including restart after pause and reset while running.','Among passing entries, compare the recorded time to completion. Use a shared finish if reliable times tie. A local note does not establish an independently verified model run.']},
 arcade:{prompt:'Build a browser game called Signal Chase in one self-contained HTML file. A target appears on a 3 by 3 grid; tap it to score and move it. Each game lasts 45 seconds. Include a clear start button, score, timer, end screen and replay. Support a 390-pixel-wide touch screen and keyboard input. No external assets, libraries, logins or network requests. Use the same prompt, tools and time allowance for each contender.',rubric:['Functional gate: start, scoring, 45-second finish and replay work without stale targets or duplicate timers.','Mobile and access check: no horizontal overflow at 390 pixels; grid controls have readable labels, visible focus and keyboard activation.','Compare the passing games with the same locally recorded playtest questions: clarity, responsiveness and desire to play again. If evidence does not separate them, submit a shared finish. No live playtest is claimed by this page.']},
 report:{prompt:'Explain how a reader can verify a claim that one AI coding model is better than another. Produce a concise evaluation plan covering a fixed task, exact model versions, equal tool access, correctness checks, token cost, timing, source attribution and limitations. Use primary documentation for factual claims and link each source to the claim it supports. Separate observed evidence from proposed tests. Use the same prompt, source access and time allowance for each contender.',rubric:['Evidence gate: factual claims have supporting primary sources; quotes and model versions can be checked; unsupported claims are identified.','Compare completeness against the requested evaluation dimensions and whether another person could reproduce the proposed test.','Record citation checks and reasons for the chosen result in a local receipt. A confident or longer answer alone does not win; tied evidence permits a shared finish.']}
};
const FINAL_STATUSES=['settled','void'];
const PENDING_STATUSES=['open','locked','provisional'];
export function initialState(){return {version:1,lap:1,history:[],balance:1000,tickets:[],rounds:Object.fromEntries(RACES.map(r=>[r.id,{pools:{sol:100,opus:100,sonnet:100},status:'open',winner:null}]))}}
function roundOf(s,id){if(!RACES.some(r=>r.id===id)||!s.rounds?.[id])throw Error('Unknown round.');return s.rounds[id]}
function validModel(id){if(!MODELS.some(m=>m.id===id))throw Error('Choose a contender.');}
function validStake(n){if(!Number.isSafeInteger(n)||n<1)throw Error('Stake must be a positive whole number.');}
function winnerList(winner){const winners=Array.isArray(winner)?winner:[winner];for(const w of winners)validModel(w);if(winners.length===0||new Set(winners).size!==winners.length)throw Error('Choose valid, distinct winners.');return MODELS.filter(m=>winners.includes(m.id)).map(m=>m.id)}
function sameWinners(a,b){return a.length===b.length&&a.every(w=>b.includes(w))}
function totalPool(r){const total=MODELS.reduce((n,m)=>n+r.pools[m.id],0);if(!Number.isSafeInteger(total))throw Error('The simulated pool is too large.');return total}
function localNote(note){if(typeof note!=='string'||note.trim().length<20||note.trim().length>2000)throw Error('Write a local result note of 20 to 2,000 characters.');return note.trim()}
function buildoff(id){if(!Object.hasOwn(RACE_BRIEFS,id))throw Error('The price exercise settles directly from its published receipt.');}
export function quote(s,id,model,stake){
 validModel(model);validStake(stake);const r=roundOf(s,id);if(r.status!=='open')throw Error('Predictions are locked for this round.');
 const total=totalPool(r)+stake;if(!Number.isSafeInteger(total))throw Error('The simulated pool is too large.');
 const winners=id==='budget'?budgetReceipt().winners:[model];
 if(!winners.includes(model))return {payout:0,share:0,multiple:0};
 const winning=winners.reduce((n,w)=>n+r.pools[w],0)+stake;
 return {payout:Math.floor(stake*total/winning),share:stake/winning,multiple:total/winning};
}
export function placeBet(s,id,model,stake){
 validModel(model);validStake(stake);const r=roundOf(s,id);if(r.status!=='open')throw Error('Predictions are locked for this round.');if(stake>s.balance)throw Error('Not enough play points.');
 if(!Number.isSafeInteger(totalPool(r)+stake))throw Error('The simulated pool is too large.');
 const next=structuredClone(s);next.balance-=stake;next.rounds[id].pools[model]+=stake;next.tickets.push({id:next.tickets.length+1,lap:next.lap||1,race:id,model,stake,status:'open',payout:null});return next;
}
export function lockRound(s,id){
 const r=roundOf(s,id);buildoff(id);if(r.status!=='open')throw Error('Only an open race can lock predictions.');
 const n=structuredClone(s);Object.assign(n.rounds[id],{status:'locked',winner:null,resultNote:null,brief:structuredClone(RACE_BRIEFS[id])});return n;
}
export function submitResult(s,id,winner,evidence){
 const r=roundOf(s,id);buildoff(id);if(r.status!=='locked')throw Error('Lock predictions before submitting a practice result.');
 const winners=winnerList(winner),note=localNote(evidence),n=structuredClone(s);
 Object.assign(n.rounds[id],{status:'provisional',winner:winners.join(','),resultNote:note});return n;
}
export function reopenResult(s,id){
 const r=roundOf(s,id);buildoff(id);if(r.status!=='provisional')throw Error('Only a provisional receipt can be revised.');
 const n=structuredClone(s);Object.assign(n.rounds[id],{status:'locked',winner:null,resultNote:null});return n;
}
export function settle(s,id,winner){
 const r=roundOf(s,id);if(FINAL_STATUSES.includes(r.status))throw Error('This round is already settled.');
 const winners=winner==='void'?[]:winnerList(winner);
 if(winner!=='void'){
  if(id==='budget'){if(r.status!=='open'||!sameWinners(winners,budgetReceipt().winners))throw Error('Use the published shared price result: Sol and Sonnet.');}
  else {if(r.status!=='provisional'||!sameWinners(winners,winnerList(r.winner.split(','))))throw Error('Finalize the submitted provisional receipt before paying out.');localNote(r.resultNote);}
 }
 const next=structuredClone(s),total=totalPool(r),winningPool=winners.reduce((n,w)=>n+r.pools[w],0);
 next.rounds[id].status=winner==='void'?'void':'settled';next.rounds[id].winner=winner==='void'?'void':winners.join(',');
 for(const t of next.tickets.filter(t=>t.race===id&&t.status==='open')){
  t.payout=winner==='void'?t.stake:winners.includes(t.model)?Math.floor(t.stake*total/winningPool):0;
  t.status=winner==='void'?'refunded':t.payout>0?'won':'lost';next.balance+=t.payout;
 }
 if(!Number.isSafeInteger(next.balance))throw Error('The simulated balance is too large.');return next;
}
export function finalizeResult(s,id){const r=roundOf(s,id);buildoff(id);if(r.status!=='provisional')throw Error('Submit a provisional receipt before finalizing.');return settle(s,id,r.winner.split(','))}
export function budgetReceipt(){const bills=MODELS.map(m=>({id:m.id,name:m.name,total:m.input*.1+m.output*.01})),lowest=Math.min(...bills.map(m=>m.total));return {inputTokens:100000,outputTokens:10000,rateDate:'2026-09-29',bills,winners:bills.filter(m=>m.total===lowest).map(m=>m.id)}}
function validBrief(brief){return brief&&typeof brief.prompt==='string'&&brief.prompt.length>0&&brief.prompt.length<=8000&&Array.isArray(brief.rubric)&&brief.rubric.length>0&&brief.rubric.length<=20&&brief.rubric.every(x=>typeof x==='string'&&x.length>0&&x.length<=5000)}
function validRound(r,id,historical=false){
 if(!r||!(historical?FINAL_STATUSES:[...PENDING_STATUSES,...FINAL_STATUSES]).includes(r.status))throw Error();
 if(id==='budget'&&['locked','provisional'].includes(r.status))throw Error();
 if(!r.pools||Object.keys(r.pools).length!==MODELS.length||Object.keys(r.pools).some(id=>!MODELS.some(m=>m.id===id)))throw Error();
 for(const m of MODELS)if(!Number.isSafeInteger(r.pools[m.id])||r.pools[m.id]<100)throw Error();totalPool(r);
 if(['settled','provisional'].includes(r.status)){if(typeof r.winner!=='string')throw Error();winnerList(r.winner.split(','));}
 else if(r.status==='void'){if(r.winner!=='void')throw Error();}
 else if(r.winner!==null)throw Error();
 if(r.brief!==undefined&&!validBrief(r.brief))throw Error();
 if(['locked','provisional'].includes(r.status)&&!validBrief(r.brief))throw Error();
 if(r.status==='provisional')localNote(r.resultNote);
 else if(r.resultNote!==undefined&&r.resultNote!==null)localNote(r.resultNote);
}
export function restore(raw){
 try{
  const s=JSON.parse(raw);if(!s||s.version!==1||!Number.isSafeInteger(s.balance)||s.balance<0||!Array.isArray(s.tickets)||!s.rounds)throw Error();
  s.lap=Number.isSafeInteger(s.lap)&&s.lap>0?s.lap:1;
  s.history=Array.isArray(s.history)?s.history.filter(h=>{try{if(!Number.isSafeInteger(h.lap)||h.lap<1||!h.rounds)throw Error();for(const r of RACES)validRound(h.rounds[r.id],r.id,true);return true}catch{return false}}):[];
  for(const race of RACES){if(!s.rounds[race.id]&&race.id==='budget')s.rounds.budget=initialState().rounds.budget;validRound(s.rounds[race.id],race.id);}
  for(const t of s.tickets){
   if(!t||!Number.isSafeInteger(t.id)||t.id<1||!RACES.some(r=>r.id===t.race)||!MODELS.some(m=>m.id===t.model)||!Number.isSafeInteger(t.stake)||t.stake<1||!['open','won','lost','refunded'].includes(t.status))throw Error();
   if(t.lap!==undefined&&(!Number.isSafeInteger(t.lap)||t.lap<1||t.lap>s.lap))throw Error();
   if(t.status==='open'){if(t.payout!==null||(t.lap||1)!==s.lap||!PENDING_STATUSES.includes(s.rounds[t.race].status))throw Error();}
   else if(!Number.isSafeInteger(t.payout)||t.payout<0||(t.status==='lost'&&t.payout!==0)||(t.status==='won'&&t.payout===0)||(t.status==='refunded'&&t.payout!==t.stake))throw Error();
  }
  return s;
 }catch{return initialState()}
}
export function standings(s){
 const rows=MODELS.map(m=>({...m,points:0,wins:0,shared:0,entered:0}));
 for(const rounds of [...(s.history||[]).map(h=>h.rounds),s.rounds])for(const id of Object.keys(RACE_BRIEFS)){
  const r=rounds[id];if(r?.status!=='settled')continue;const winners=r.winner.split(',');
  for(const row of rows){row.entered++;if(winners.includes(row.id)){row.points+=3/winners.length;row.wins++;if(winners.length>1)row.shared++;}}
 }
 return rows.sort((a,b)=>b.points-a.points||MODELS.findIndex(m=>m.id===a.id)-MODELS.findIndex(m=>m.id===b.id));
}
export function nextLap(s){if(!RACES.every(r=>FINAL_STATUSES.includes(s.rounds[r.id]?.status)))throw Error('Finish or void all four races before starting the next lap.');const n=structuredClone(s);n.history=[...(s.history||[]),{lap:s.lap||1,rounds:structuredClone(s.rounds)}];n.lap=(s.lap||1)+1;n.rounds=initialState().rounds;return n;}
