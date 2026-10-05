import { bayes, brier, binaryEV, walkBook, drawdown, perpStress } from '../lib/prediction-study.mjs';

const money = (x: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(x);
function initStudy() {
  const root=document.querySelector<HTMLElement>('.prediction-study');
  if(!root || root.dataset.initialized) return;
  root.dataset.initialized='true';
  root.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false);
  const openTarget=()=>{
    const hash=location.hash.slice(1);
    if(!/^lesson-\d{2}$/.test(hash)) return;
    const target=document.getElementById(hash);
    if(target instanceof HTMLDetailsElement) target.open=true;
  };
  openTarget();
  window.addEventListener('hashchange',openTarget);
  root.querySelectorAll<HTMLFormElement>('.checkpoint').forEach(form=>{
    form.addEventListener('submit',e=>e.preventDefault());
    form.querySelector('button')?.addEventListener('click',()=>{
      const answer=form.querySelector<HTMLInputElement>('input:checked');
      const feedback=form.querySelector<HTMLElement>('.quiz-feedback')!;
      feedback.textContent=answer ? (answer.value===form.dataset.correct ? 'Correct reasoning. ' : 'Revisit the assumptions. ')+(form.dataset.explanation||'') : 'Choose an answer to check your reasoning.';
    });
  });
  root.querySelectorAll<HTMLElement>('[data-lab]').forEach(lab=>{
    const number=(name:string)=>{
      const input=lab.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
      if(input.value.trim()==='' || !input.checkValidity()) throw new Error('Enter a valid value for '+(input.closest('label')?.textContent?.trim()||name)+'.');
      const value=Number(input.value);
      if(!Number.isFinite(value)) throw new Error('Use finite numeric inputs.');
      return value;
    };
    lab.querySelector('button')?.addEventListener('click',()=>{
      const output=lab.querySelector<HTMLOutputElement>('output')!;
      try{
        let result='';
        switch(lab.dataset.lab){
          case 'bayes': result=`Posterior ${(bayes(number('prior')/100,number('yes')/100,number('no')/100)*100).toFixed(1)}%. This follows your assumed likelihoods, not a verified forecast.`;break;
          case 'brier': {
            const raw=lab.querySelector<HTMLTextAreaElement>('textarea')!.value.trim();
            if(raw.length>10000) throw new Error('Use at most 10,000 characters.');
            const rows=raw.split(/\r?\n/).map(line=>line.split(',').map(part=>part.trim()));
            if(rows.some(row=>row.length!==2 || row.some(x=>x===''))) throw new Error('Use one probability,outcome pair per line.');
            const ps=rows.map(row=>Number(row[0])),ys=rows.map(row=>Number(row[1]));
            result=`Mean binary Brier ${brier(ps,ys).toFixed(4)} over ${rows.length} invented outcomes. Lower is better; this sample does not establish calibration.`;break;
          }
          case 'ev': {
            const x=binaryEV({probability:number('probability')/100,price:number('price'),fee:number('fee'),quantity:number('quantity')});
            result=`Expected net ${money(x.totalEV)}; if YES ${money(x.netIfYes)}, if NO ${money(x.netIfNo)}. All-in cost ${money(x.totalCost)}; break-even belief ${(x.breakEvenProbability*100).toFixed(1)}%. No fill or forecast accuracy is established.`;break;
          }
          case 'depth': {
            const x=walkBook([{price:.5,quantity:20},{price:.54,quantity:30},{price:.6,quantity:50}],number('quantity'));
            result=`${x.filledQuantity} filled, ${x.unfilledQuantity} unfilled in this static model. Average ${x.averagePrice===null?'unavailable':'$'+x.averagePrice.toFixed(4)}; cost ${money(x.totalCost)}. ${x.complete?'Requested depth is available in the invented snapshot.':'Incomplete: never assume the missing size fills at the last price.'}`;break;
          }
          case 'drawdown': {
            const d=drawdown(number('fraction')/100,number('losses'));
            result=`Drawdown ${(d*100).toFixed(1)}%; ${((1-d)*100).toFixed(1)}% remains. This assumes proportional repeated losses and gives no probability of that path.`;break;
          }
          case 'perps': {
            const x=perpStress({collateral:number('collateral'),leverage:number('leverage'),movePct:number('move'),fundingBps:number('funding'),periods:number('periods'),maintenancePct:number('maintenance')});
            result=`Entry notional ${money(x.initialNotional)}; terminal equity ${money(x.netEquity)}; assumed maintenance ${money(x.maintenanceRequirement)}. ${x.maintenanceBreach?'At or below maintenance: this model signals a forced-exit risk.':'Above this assumed maintenance threshold.'} ${x.mayOwe?'Negative equity: a possible deficit beyond initial collateral.':''} This ignores earlier liquidation, mark/index basis, exit fees and venue-specific deficit rules.`;break;
          }
        }
        output.dataset.error='false';output.textContent=result;
      }catch(error){output.dataset.error='true';output.textContent=error instanceof Error?error.message:'Check the synthetic inputs.';}
    });
  });
  root.querySelector('#download-note')?.addEventListener('click',()=>{
    const note=root.querySelector<HTMLTextAreaElement>('#study-note')!.value;
    const blob=new Blob(['UES prediction markets — private paper notes\nSynthetic study only; not a trading record.\n\n',note],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='ues-prediction-paper-notes.txt';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    root.querySelector<HTMLElement>('#note-feedback')!.textContent='Notes download created. The course does not upload or save your notes.';
  });
}
initStudy();
document.addEventListener('astro:page-load',initStudy);
