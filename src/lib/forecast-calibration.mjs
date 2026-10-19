export function forecastMetrics(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('At least one valid forecast is required.');
  const bins=Array.from({length:5},(_,i)=>({index:i,count:0,probabilitySum:0,yes:0}));
  let loss=0,yesCount=0;
  for(const row of rows){
    if(typeof row.p!=='number'||!Number.isFinite(row.p)||row.p<0||row.p>1) throw new Error('Probability must be finite and between 0 and 1.');
    if(row.y!==0&&row.y!==1) throw new Error('Outcome must be exactly 0 or 1.');
    loss+=(row.p-row.y)**2;yesCount+=row.y;
    const bin=bins[Math.min(4,Math.floor(row.p*5))];bin.count++;bin.probabilitySum+=row.p;bin.yes+=row.y;
  }
  const result=bins.map(b=>({...b,mean:b.count?b.probabilitySum/b.count:null,observed:b.count?b.yes/b.count:null,gap:b.count?Math.abs(b.probabilitySum/b.count-b.yes/b.count):null}));
  return {n:rows.length,yesCount,brier:loss/rows.length,ece:result.reduce((s,b)=>s+(b.count?b.count/rows.length*b.gap:0),0),bins:result};
}
export function presetRows(dataset,preset,firstOutcome=1){
  if(firstOutcome!==0&&firstOutcome!==1) throw new Error('Outcome must be exactly 0 or 1.');
  return dataset.map(row=>({p:preset.probabilityByGroup[row.group],y:row.id==='S01'?firstOutcome:row.outcome}));
}
