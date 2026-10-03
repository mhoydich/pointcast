import { MODELS, RACES, RACE_BRIEFS, initialState, restore, quote, placeBet, settle, budgetReceipt, standings, nextLap, lockRound, submitResult, finalizeResult, reopenResult } from './engine.mjs';
const $ = id => document.getElementById(id);
const key = 'pointcast-ai-market-v1';
let state = initialState(), race = 'budget', model = 'sol', cash = false;
try { state = restore(localStorage.getItem(key)); } catch {}
const fmt = n => n.toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names = winner => (winner || '').split(',').map(id => MODELS.find(m => m.id === id)?.name || id).join(' + ');
const labels = {open:'PREDICTIONS OPEN', locked:'LOCKED / RECEIPT PENDING', provisional:'PROVISIONAL / NO PAYOUT', settled:'FINALIZED', void:'VOID / REFUNDED'};
function message(text, error = false) { $('message').textContent = text; $('message').style.color = error ? '#ffc6b8' : '#d8fb67'; }
function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { message('Played successfully, but browser storage is unavailable. This session will not survive a reload.', true); } }
function act(fn, text, focus) { try { state = fn(); save(); render(); message(text); if (focus) $(focus).focus(); } catch (e) { message(e.message, true); } }
function choose(r, m) { if (RACES.some(x => x.id === r) && r !== race) { $('result-note').value = state.rounds[r].resultNote || ''; $('winner').value = state.rounds[r].winner || 'sol'; $('brief-message').textContent = ''; } if (RACES.some(x => x.id === r)) race = r; if (MODELS.some(x => x.id === m)) model = m; message(''); render(); }
function renderQuote() {
  const n = Number($('stake').value);
  $('return-label').textContent = race === 'budget' ? 'Return on the known price result' : 'Estimated total return';
  $('quote-note').textContent = cash ? 'Hypothetical only. No funds move.' : race === 'budget' ? 'Sol and Sonnet share the known win. This quote includes both winning outcomes; Opus returns zero.' : 'Indicative return changes until predictions lock. Includes simulated seed stakes.';
  try {
    const stake = cash ? Math.round(n * 100) : n;
    if (cash && (!Number.isFinite(n) || n <= 0 || Math.abs(n * 100 - stake) > 1e-6)) throw Error();
    const q = quote(state, race, model, stake);
    $('pool-share').textContent = (q.share * 100).toFixed(1) + '%';
    $('return').textContent = cash ? (q.payout / 100).toFixed(2) + ' XTZ' : fmt(q.payout) + ' pts';
    $('multiple').textContent = q.multiple.toFixed(2) + '×';
    $('place').disabled = cash || !Number.isSafeInteger(n) || n < 1 || n > state.balance;
  } catch { ['pool-share','return','multiple'].forEach(id => $(id).textContent = '—'); $('place').disabled = true; }
}
function render() {
  const current = RACES.find(r => r.id === race), round = state.rounds[race];
  $('balance').textContent = fmt(state.balance);
  $('play-mode').setAttribute('aria-pressed', String(!cash)); $('cash-mode').setAttribute('aria-pressed', String(cash));
  $('cash-notice').hidden = !cash; $('demo-control').hidden = cash;
  $('mode-note').textContent = cash ? 'Cash preview · no escrow deployed · deposits disabled' : 'Device-local practice · simulated pools · no cash value';
  $('slip-title').textContent = current.title; $('slip-rule').textContent = current.rule;
  $('stake-unit').textContent = cash ? 'XTZ · hypothetical' : 'play points';
  $('place').textContent = cash ? 'XTZ escrow not live' : round.status === 'open' ? 'Back ' + MODELS.find(m => m.id === model).name : labels[round.status];
  $('stake').step = cash ? '.01' : '1'; $('stake').min = cash ? '.01' : '1'; $('stake').max = cash ? '100' : String(state.balance);
  $('max-stake').disabled = cash; document.querySelectorAll('[data-stake]').forEach(b => b.textContent = cash ? (Number(b.dataset.stake)/100).toFixed(2)+' XTZ' : b.dataset.stake);
  $('markets').innerHTML = RACES.map(r => {
    const rd = state.rounds[r.id], total = Object.values(rd.pools).reduce((a,b) => a+b,0);
    return `<article class="market ${r.id === race ? 'selected' : ''}"><div class="meta">${r.category} · ${labels[rd.status]}</div><div class="market-title"><h3>${r.title}</h3><button class="pick-race" data-race="${r.id}">${r.id === race ? 'Selected' : 'Pick race'}</button></div><p>${r.description}</p><div class="odds-row">${MODELS.map(m => `<button class="odd" data-race="${r.id}" data-model="${m.id}" aria-label="Choose ${m.name} for ${r.title}"><span class="model">${m.icon} ${m.name}</span><strong>${(rd.pools[m.id]/total*100).toFixed(0)}%</strong></button>`).join('')}</div><div class="pool-track" aria-hidden="true">${MODELS.map(m => `<span style="flex-grow:${rd.pools[m.id]}"></span>`).join('')}</div><div class="market-bottom"><span>${cash ? (total/100).toFixed(2)+' XTZ assumed pool' : fmt(total)+' pts simulated pool'}</span><span>${rd.status === 'settled' ? 'Practice result: '+names(rd.winner) : rd.status === 'provisional' ? 'Provisional: '+names(rd.winner) : 'Stake share · not calibrated probability'}</span></div></article>`;
  }).join('');
  $('contenders').innerHTML = MODELS.map(m => `<button class="contender" data-model="${m.id}" aria-pressed="${model === m.id}"><span>${m.icon} ${m.name}<br><small>${m.maker}</small></span><strong>${(round.pools[m.id]/Object.values(round.pools).reduce((a,b)=>a+b,0)*100).toFixed(0)}%</strong></button>`).join('');
  document.querySelectorAll('[data-race]').forEach(b => b.onclick = () => choose(b.dataset.race,b.dataset.model));
  document.querySelectorAll('.contender').forEach(b => b.onclick = () => choose(race,b.dataset.model));
  $('ticket-count').textContent = state.tickets.length;
  $('tickets').innerHTML = state.tickets.length ? [...state.tickets].reverse().map(t => `<div class="ticket"><strong>${MODELS.find(m => m.id === t.model).name}</strong><div class="ticket-line"><span>Lap ${t.lap || 1} · ${RACES.find(r => r.id === t.race).title}</span><span>${fmt(t.stake)} pts</span></div><small>${t.status === 'open' ? 'Pending · no payout until finalization' : t.status === 'refunded' ? 'Void · '+fmt(t.payout)+' pts refunded' : t.status === 'won' ? 'Won · '+fmt(t.payout)+' pts returned' : 'Lost · 0 pts returned'}</small></div>`).join('') : '<p class="empty">Your first prediction belongs here.</p>';
  renderSeason(); renderFormGuide(); renderLab(); renderQuote();
}
function renderSeason() {
  const closed = state.tickets.filter(t => t.status !== 'open'), won = closed.filter(t => t.status === 'won').length;
  const staked = state.tickets.reduce((n,t)=>n+t.stake,0), returned = closed.reduce((n,t)=>n+(t.payout||0),0);
  $('season').innerHTML = `<div><span>Available</span><strong>${fmt(state.balance)}<small> pts</small></strong></div><div><span>Your calls</span><strong>${state.tickets.length}</strong></div><div><span>Winning tickets</span><strong>${won}</strong></div><div><span>Returned / staked</span><strong>${fmt(returned)} / ${fmt(staked)}</strong></div>`;
  $('badges').innerHTML = [{name:'First call',icon:'✳',earned:state.tickets.length>0},{name:'Across the grid',icon:'▦',earned:new Set(state.tickets.map(t=>t.model)).size===3},{name:'Receipt reader',icon:'✓',earned:state.rounds.budget.status==='settled'||(state.history||[]).some(h=>h.rounds.budget.status==='settled')}].map(b => `<span class="badge ${b.earned?'earned':''}"><b>${b.icon}</b>${b.name}<small>${b.earned?'Collected':'Locked'}</small></span>`).join('');
}
function renderFormGuide() {
  $('lap-label').textContent = 'LAP '+String(state.lap||1).padStart(2,'0'); const rows = standings(state);
  $('standings').innerHTML = rows.map(m => `<article class="constructor ${m.points>0&&m.points===rows[0].points?'leader':''}"><span class="position">${rows.filter(x=>x.points>m.points).length+1}</span><div><h3>${m.icon} ${m.name}</h3><p>${m.wins} practice wins · ${m.shared} shared · ${m.entered} finalized build-offs</p></div><strong>${Number(m.points.toFixed(1))}<small> podium pts</small></strong></article>`).join('');
  const finished = RACES.filter(r => ['settled','void'].includes(state.rounds[r.id].status)).length;
  $('lap-progress').innerHTML = RACES.map(r => `<button data-progress="${r.id}" class="${['settled','void'].includes(state.rounds[r.id].status)?'complete':''}">${['settled','void'].includes(state.rounds[r.id].status)?'✓':'○'} ${r.title}</button>`).join('');
  document.querySelectorAll('[data-progress]').forEach(b => b.onclick = () => choose(b.dataset.progress));
  $('next-lap').disabled = cash || finished !== RACES.length;
  $('lap-note').textContent = finished===RACES.length ? 'All four finishes recorded. Start a fresh lap; your bankroll, tickets and constructors points carry forward.' : finished+' / 4 finishes recorded. Finalize or void the remaining practice races to open another lap.';
  const events = [...(state.history||[]),{lap:state.lap||1,rounds:state.rounds}].flatMap(h => RACES.filter(r => h.rounds[r.id].status!=='open').map(r => ({lap:h.lap,race:r,round:h.rounds[r.id]}))).reverse();
  $('results').innerHTML = events.length ? events.map(e => `<article><span>LAP ${e.lap} / ${labels[e.round.status]}</span><h3>${e.race.title}</h3><p>${e.round.status==='void'?'Player stakes refunded':e.round.status==='locked'?'Predictions locked · receipt pending':names(e.round.winner)}</p>${e.round.resultNote?'<blockquote>'+esc(e.round.resultNote)+'</blockquote>':''}<small>${e.race.id==='budget'?'Known price exercise · rates dated September 29, 2026 · no podium points':e.round.resultNote?'Locally entered practice note · not independently verified':'Legacy practice result or pending receipt · no verified model run'}</small></article>`).join('') : '<p class="empty">No receipts yet. Try the known-price exercise or lock a build-off to begin.</p>';
}
function renderLab() {
  const rd = state.rounds[race], budget = race==='budget', closed = ['settled','void'].includes(rd.status);
  $('race-sheet').hidden = budget; $('budget-finish').hidden = !budget; $('budget-finish').disabled = rd.status!=='open';
  $('budget-receipt').hidden = !budget || rd.status!=='settled';
  if (budget) return;
  const brief = rd.brief || RACE_BRIEFS[race];
  $('brief-prompt').textContent = brief.prompt; $('brief-rubric').innerHTML = brief.rubric.map(t=>'<li>'+esc(t)+'</li>').join('');
  const order = ['open','locked','provisional','settled'];
  $('race-stages').innerHTML = order.map((status,i)=>`<span class="${order.indexOf(rd.status)>=i?'active':''}">${i+1} ${['Predict','Lock','Receipt','Finalize'][i]}</span>`).join('');
  $('resolution-note').textContent = rd.status==='open'?'Read the brief, place your practice predictions, then lock the pool.':rd.status==='locked'?'Predictions are locked. Record an outcome and explain the evidence before any payout.':rd.status==='provisional'?'Review the note and outcome. Revise the receipt or finalize to pay play tickets.':rd.status==='void'?'This round was voided. Player stakes were refunded.':'Finalized. '+(rd.resultNote?'Your receipt is in the results desk.':'This legacy result predates the Race Lab receipt workflow.');
  $('lock-round').hidden = rd.status!=='open'; $('result-form').hidden = rd.status!=='locked';
  $('provisional-receipt').hidden = rd.status!=='provisional'; $('provisional-winner').textContent = names(rd.winner); $('provisional-note').textContent = rd.resultNote||'';
  $('void-round').hidden = closed; $('copy-brief').disabled = false;
}
$('bet-form').onsubmit = e => { e.preventDefault(); if (cash) return message('Cash betting is unavailable. No Tezos escrow is deployed.',true); act(()=>placeBet(state,race,model,Number($('stake').value)),'Play prediction placed.'); };
$('stake').oninput = renderQuote;
document.querySelectorAll('[data-stake]').forEach(b=>b.onclick=()=>{$('stake').value=cash?Number(b.dataset.stake)/100:b.dataset.stake;renderQuote();});
$('max-stake').onclick = () => {$('stake').value=state.balance;renderQuote();};
$('play-mode').onclick = () => {cash=false;$('stake').value=50;message('');render();};
$('cash-mode').onclick = () => {cash=true;$('stake').value=.5;message('');render();};
$('lock-round').onclick = () => {if(!cash)act(()=>lockRound(state,race),'Predictions locked. The brief and pool are frozen.','winner');};
$('result-form').onsubmit = e => {e.preventDefault();if(cash)return;const winners=$('winner').value.split(',');act(()=>submitResult(state,race,winners,$('result-note').value),'Provisional result recorded. No points paid yet.','finalize-result');};
$('finalize-result').onclick = () => {if(!cash)act(()=>finalizeResult(state,race),'Practice result finalized. Ticket returns are in your play balance.','resolution-note');};
$('revise-result').onclick = () => {if(cash)return;const rd=state.rounds[race];$('winner').value=rd.winner;$('result-note').value=rd.resultNote;act(()=>reopenResult(state,race),'Receipt reopened for revision. Predictions remain locked.','result-note');};
$('void-round').onclick = () => {if(!cash)act(()=>settle(state,race,'void'),'Round voided. Your player stakes were refunded.','resolution-note');};
$('budget-finish').onclick = () => {if(!cash)act(()=>settle(state,'budget',budgetReceipt().winners),'Known price result: Sol + Sonnet tie. Winning tickets share the pool; no podium points.','budget-receipt');};
$('copy-brief').onclick = async () => {const brief=state.rounds[race].brief||RACE_BRIEFS[race];const text=`POINTCAST RACE LAB / ${RACES.find(r=>r.id===race).title}\n\n${brief.prompt}\n\nRUBRIC\n${brief.rubric.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nUse the same prompt, model versions, tool access and time budget for every entrant. This is a proposed practice protocol, not a verified benchmark.`;try{await navigator.clipboard.writeText(text);$('brief-message').textContent='Race brief copied.';}catch{$('brief-message').textContent=text;}};
$('share-pick').onclick = async () => {const u=new URL(location.href);u.search='';u.hash=new URLSearchParams({race,model}).toString();try{await navigator.clipboard.writeText(u.href);$('share-message').textContent='Race pick copied. Tickets and result notes stay on your device.';}catch{$('share-message').textContent=u.href;}};
$('reset').onclick = () => {if(!confirm('Reset all local play history and return your balance to 1,000 points?'))return;state=initialState();save();render();message('Fresh starting grid. 1,000 play points.');};
$('next-lap').onclick = () => {if(cash)return;try{state=nextLap(state);save();race='budget';render();$('season-message').textContent='Lap '+state.lap+' is open. Your history and bankroll are preserved.';}catch(e){$('season-message').textContent=e.message;}};
$('export-season').onclick = () => {const receipt={format:'pointcast-ai-grand-prix-race-lab-v3',exportedAt:new Date().toISOString(),scope:'Device-local practice. User-entered outcomes and notes are not independently verified. No cash value or community ranking.',rateDate:budgetReceipt().rateDate,lap:state.lap||1,balance:state.balance,standings:standings(state).map(({id,name,points,wins,shared,entered})=>({id,name,points,wins,shared,entered})),tickets:state.tickets,history:state.history||[],currentRounds:state.rounds};const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pointcast-race-lab-lap-'+receipt.lap+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('season-message').textContent='Receipt download requested. Includes frozen race briefs and your local result notes.';};
try {const p=new URLSearchParams(location.hash.slice(1));if(RACES.some(r=>r.id===p.get('race')))race=p.get('race');if(MODELS.some(m=>m.id===p.get('model')))model=p.get('model');} catch {}
$('spec-table').innerHTML = '<table><thead><tr><th>Model / source</th><th>Input / 1M</th><th>Output / 1M</th></tr></thead><tbody>'+MODELS.map(m=>`<tr><td><a href="${m.url}" target="_blank" rel="noopener">${m.name}</a></td><td>$${m.input}</td><td>$${m.output}</td></tr>`).join('')+'</tbody></table>';
render();
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const register=t=>{try{Promise.resolve(document.modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});}catch{}};register({name:'read_play_market',description:'Read device-local practice pools, resolution status, tickets and balance. No real assets.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>structuredClone(state)});register({name:'place_play_prediction',description:'Spend device-local play points on an open practice race. Cannot place XTZ wagers or trade after lock.',inputSchema:{type:'object',properties:{race:{type:'string',enum:RACES.map(r=>r.id)},model:{type:'string',enum:MODELS.map(m=>m.id)},stake:{type:'integer',minimum:1}},required:['race','model','stake'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(cash)throw Error('Switch to play mode. Cash markets are unavailable.');if(!input||typeof input!=='object')throw Error('Invalid prediction.');state=placeBet(state,input.race,input.model,input.stake);race=input.race;model=input.model;save();render();message('Play prediction placed.');return{balance:state.balance,ticket:state.tickets.at(-1)};}});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
