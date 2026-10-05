import { getSnapshot, convertFx, rateScenario } from '../lib/business-feels.mjs';

const DEFAULT_RADAR = ['fed-target-upper', 'ecb-deposit', 'treasury-10y', 'us-cpi-yoy', 'us-unemployment', 'us-payroll-change'];
const STORAGE_KEY = 'pointcast.business-feels.watch.v1';
const numeric = value => typeof value === 'number' && Number.isFinite(value);
const number = (value, digits = 2) => Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const time = value => value ? String(value).replace('T', ' ').replace(/\.\d+Z$/, ' UTC').replace(/Z$/, ' UTC') : 'No successful read recorded';
const pointsFor = series => (series.history || []).filter(p => /^\d{4}-\d{2}(?:-\d{2})?$/.test(p.date) && numeric(p.value)).sort((a,b)=>a.date.localeCompare(b.date));
const fixedSource = url => /^https:\/\//.test(String(url)) ? url : '#sources';

export function observationCsv(packet) {
  const escape = value => '"' + (numeric(value) ? String(value) : String(value ?? '').replace(/^[=+@\-]/, "'$&")).replace(/"/g, '""') + '"';
  const rows = [['series_id','title','observation_date','value','unit','source','source_url','latest_signal_status','last_success_at','preliminary','date_meaning']];
  for (const series of packet.series) {
    const history = pointsFor(series);
    if (numeric(series.value) && series.observationDate && !history.some(p=>p.date===series.observationDate)) history.push({date:series.observationDate,value:series.value});
    for (const point of history) {
      const sourceUrl=series.sourceId==='treasury'?`https://home.treasury.gov/resource-center-data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=${point.date.slice(0,4)}`:series.sourceUrl;
      rows.push([series.id,series.title,point.date,point.value,series.unit,series.sourceId,sourceUrl,series.status,series.lastSuccessAt,point.preliminary??series.preliminary??false,series.dateMeaning??'Source observation date']);
    }
  }
  const fxHistory=(packet.fx?.history||[]).filter(table=>table.date&&table.rates);
  if(packet.fx?.rates&&packet.fx.date&&!fxHistory.some(table=>table.date===packet.fx.date))fxHistory.push(packet.fx);
  for(const table of fxHistory)for(const [currency,rate] of Object.entries(table.rates))rows.push([`fx-EUR-${currency}`,`ECB EUR/${currency} reference`,table.date,rate,`${currency} per EUR`,packet.fx.sourceId,'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html',packet.fx.status,packet.fx.lastSuccessAt,false,'ECB reference date; one shared EUR-base table']);
  return rows.map(row=>row.map(escape).join(',')).join('\r\n');
}

export function initBusinessFeels(root, dependencies = {}) {
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const read = dependencies.fetch || ((...args)=>view.fetch(...args));
  let packet = dependencies.packet || getSnapshot(new Date());
  const allIds = new Set(packet.series.map(series=>series.id));
  let watched = new Set(DEFAULT_RADAR.filter(id=>allIds.has(id)));
  try {
    const saved = JSON.parse(view.localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.every(id=>typeof id==='string')) watched = new Set(saved.filter(id=>allIds.has(id)));
  } catch {}
  let filter = 'radar';
  const q = selector=>root.querySelector(selector);
  const qa = selector=>[...root.querySelectorAll(selector)];
  const announce = message=>{q('[data-announcement]').textContent=message;};
  const el = (tag,text,className) => {const node=doc.createElement(tag);if(text!==undefined)node.textContent=String(text);if(className)node.className=className;return node;};
  const svgEl = (tag,attributes = {}) => {const node=doc.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));return node;};

  function filterBoard() {
    let count=0;
    qa('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
    qa('[data-signal]').forEach(card=>{
      const series=packet.series.find(s=>s.id===card.dataset.signal);
      const visible=series && (filter==='all' || (filter==='radar'&&watched.has(series.id)) || filter===series.category || (filter==='deferred'&&['setup-required','unavailable'].includes(series.status)));
      card.hidden=!visible;if(visible)count++;
    });
    q('[data-board-count]').textContent=`${count} signal${count===1?'':'s'}`;
    q('[data-empty]').hidden=count>0;
    q('[data-empty]').textContent=filter==='radar'?'Select a signal in “Personalize your watchboard” to put it on your radar.':'No signals match this filter.';
    qa('[data-watch-options] input').forEach(input=>input.checked=watched.has(input.value));
  }

  function sparkline(container,series) {
    container.replaceChildren();
    const points=pointsFor(series).slice(-90);
    if(points.length<2){container.append(el('p',numeric(series.value)?'One dated observation. No historical trend inferred.':'Coverage needs a permitted source.'));return;}
    const dates=points.map(p=>Date.parse(p.date.length===7?`${p.date}-01`:p.date));
    const start=Math.min(...dates),end=Math.max(...dates);
    if(!Number.isFinite(start)||start===end)return;
    const values=points.map(p=>p.value),low=Math.min(...values),high=Math.max(...values),spread=high-low;
    const chart=svgEl('svg',{viewBox:'0 0 280 64',role:'img'});
    const title=svgEl('title');title.textContent=`${series.title}: ${points[0].date} to ${points.at(-1).date}; minimum ${number(low)}, maximum ${number(high)} ${series.unit}. Vertical scale follows this series' observed range.`;chart.append(title);
    chart.append(svgEl('line',{x1:2,y1:57,x2:278,y2:57,stroke:'currentColor',opacity:'.15'}));
    chart.append(svgEl('polyline',{points:points.map((p,i)=>`${2+(dates[i]-start)/(end-start)*276},${spread?55-(p.value-low)/spread*48:31}`).join(' '),fill:'none',stroke:'currentColor','stroke-width':2,'vector-effect':'non-scaling-stroke'}));
    container.append(chart);
  }

  function renderSeries() {
    for(const series of packet.series){
      const card=qa('[data-signal]').find(node=>node.dataset.signal===series.id);if(!card)continue;
      card.dataset.emptyValue=String(!numeric(series.value));
      card.querySelector('[data-series-status]').textContent=series.status;
      card.querySelector('[data-value]').textContent=numeric(series.value)?`${number(series.value)} ${series.unit}`:'Awaiting a permitted feed';
      card.querySelector('[data-observation]').textContent=series.observationDate?(series.category==='economy'?`Period ${series.observationDate.slice(0,7)}${series.releaseDate?` · released ${series.releaseDate}`:''}${series.preliminary?' · preliminary':''}`:`${series.category==='policy'?'Effective / last changed':'Observed'} ${series.observationDate}`):'No numeric observation included';
      card.querySelector('[data-matters]').textContent=series.matters||series.context||'';
      sparkline(card.querySelector('[data-spark]'),series);
      const detail=card.querySelector('[data-series-detail]');detail.replaceChildren();
      detail.append(el('p',series.drivers||series.context||''));
      detail.append(el('p',`Status: ${series.status}. ${series.reason||''}`));
      detail.append(el('p',`${series.dateMeaning||'Date of the source observation'}.${series.releaseDate?` Published ${series.releaseDate}.`:''}${series.preliminary?' Preliminary estimate; revisions may follow.':''}`));
      detail.append(el('p',`Last successful retrieval: ${time(series.lastSuccessAt)}. Staleness threshold: ${series.staleAfterDays} days${series.category==='policy'?' since manual verification':' since the reference period'}.`));
      const link=el('a','Read the original source ↗');link.href=fixedSource(series.sourceUrl);detail.append(link);
      const points=pointsFor(series);
      const baselines=points.filter(p=>p.date<series.observationDate);
      if(numeric(series.value)&&baselines.length){
        const label=el('label','Compare with an actual observation');
        const select=el('select');select.setAttribute('aria-label',`Compare ${series.title} with an earlier observation`);
        for(const point of baselines.toReversed()){const option=el('option',`${point.date} · ${number(point.value)} ${series.unit}`);option.value=point.date;select.append(option);}
        const output=el('output');output.setAttribute('aria-live','polite');
        const compare=()=>{const baseline=baselines.find(p=>p.date===select.value);const change=series.value-baseline.value;const unit=/^%/.test(series.unit)?'percentage points':series.unit;output.textContent=`${baseline.date} → ${series.observationDate}: ${change>0?'+':''}${number(change)} ${unit}. Observed periods; no forecast.`;};
        select.addEventListener('change',compare);label.append(select);detail.append(label,output);compare();
      }
      if(points.length){
        const table=el('table'),caption=el('caption',`${series.title} · last ${Math.min(points.length,24)} observations · ${series.unit}`),thead=el('thead'),head=el('tr');
        for(const title of ['Date','Value']){const th=el('th',title);th.scope='col';head.append(th);}thead.append(head);const body=el('tbody');
        for(const point of points.slice(-24).toReversed()){const row=el('tr');row.append(el('td',point.date),el('td',number(point.value)));body.append(row);}
        table.append(caption,thead,body);const wrap=el('div',undefined,'bf-table-wrap');wrap.append(table);detail.append(wrap);
      }
    }
    filterBoard();
  }

  function renderCurve(){
    const curve=packet.yieldCurve;
    const points=(curve?.points||[]).filter(p=>numeric(p.value));
    q('[data-yield-chart]').replaceChildren();q('[data-yield-table]').replaceChildren();
    q('[data-curve-date]').textContent=curve?.date?`Treasury par yields · ${curve.date} · ${curve.status}`:'Treasury curve · unavailable';
    if(points.length<2){q('[data-yield-chart]').append(el('p','A same-day curve is not available in this packet. Check Treasury’s published table.'));return;}
    const chart=svgEl('svg',{viewBox:'0 0 520 225',role:'img'}),title=svgEl('title');title.textContent=`Treasury par yield curve on ${curve.date}; ${points.map(p=>`${p.tenor} ${number(p.value)}%`).join(', ')}. Maturity categories are evenly spaced.`;chart.append(title);
    const low=Math.min(0,Math.floor(Math.min(...points.map(p=>p.value)))),high=Math.max(1,Math.ceil(Math.max(...points.map(p=>p.value))));
    const x=i=>40+i/(points.length-1)*445,y=value=>175-(value-low)/(high-low)*145;
    for(let tick=low;tick<=high;tick++){chart.append(svgEl('line',{x1:40,y1:y(tick),x2:485,y2:y(tick),stroke:'#758a80','stroke-width':.5}));const label=svgEl('text',{x:27,y:y(tick)+4,fill:'#f4f1e8','font-size':10,'text-anchor':'end'});label.textContent=`${tick}%`;chart.append(label);}
    chart.append(svgEl('polyline',{points:points.map((p,i)=>`${x(i)},${y(p.value)}`).join(' '),fill:'none',stroke:'#e1ff7c','stroke-width':3}));
    points.forEach((point,i)=>{chart.append(svgEl('circle',{cx:x(i),cy:y(point.value),r:4,fill:'#e1ff7c'}));const label=svgEl('text',{x:x(i),y:199,fill:'#f4f1e8','font-size':11,'text-anchor':'middle'});label.textContent=point.tenor;chart.append(label);});
    q('[data-yield-chart]').append(chart);
    const table=el('table'),caption=el('caption',`Observed yields · ${curve.date} · maturity steps evenly spaced in chart`),thead=el('thead'),head=el('tr'),body=el('tbody');
    for(const title of ['Maturity','Par yield']){const th=el('th',title);th.scope='col';head.append(th);}thead.append(head);
    for(const point of points){const row=el('tr');row.append(el('td',point.tenor),el('td',`${number(point.value)}%`));body.append(row);}table.append(caption,thead,body);q('[data-yield-table]').append(table);
  }

  let fxTables=[];
  function renderFx(){
    const form=q('[data-fx-form]');const prevFrom=form.elements.from.value||'USD',prevTo=form.elements.to.value||'EUR',prevDate=form.elements.reference.value;
    const fx=packet.fx;
    fxTables=(fx?.history||[]).filter(entry=>entry.date&&entry.rates).map(entry=>({...fx,...entry}));
    if(fx?.date&&fx?.rates&&!fxTables.some(entry=>entry.date===fx.date))fxTables.push(fx);
    fxTables.sort((a,b)=>b.date.localeCompare(a.date));
    for(const name of ['from','to','reference'])form.elements[name].replaceChildren();
    if(!fxTables.length){for(const input of form.elements)input.disabled=true;q('[data-fx-result]').textContent='No dated reference table available.';q('[data-fx-note]').textContent='Check the ECB source or try a permitted public-feed refresh.';return;}
    for(const input of form.elements)input.disabled=false;
    const currencies=Object.keys(fxTables[0].rates).concat('EUR').filter((c,i,a)=>a.indexOf(c)===i).sort();
    for(const name of ['from','to'])for(const currency of currencies){const option=el('option',currency);option.value=currency;form.elements[name].append(option);}
    for(const table of fxTables){const option=el('option',table.date);option.value=table.date;form.elements.reference.append(option);}
    form.elements.from.value=currencies.includes(prevFrom)?prevFrom:currencies[0];form.elements.to.value=currencies.includes(prevTo)?prevTo:'EUR';
    if(fxTables.some(table=>table.date===prevDate))form.elements.reference.value=prevDate;
    updateFx();
  }
  function updateFx(){
    const form=q('[data-fx-form]');if(!form.checkValidity()) {q('[data-fx-result]').textContent='Enter a nonnegative amount within the stated range.';return;}
    const table=fxTables.find(entry=>entry.date===form.elements.reference.value);if(!table)return;
    try{const result=convertFx(table,Number(form.elements.amount.value),form.elements.from.value,form.elements.to.value);q('[data-fx-result]').textContent=`${number(result.convertedAmount)} ${result.to}`;q('[data-fx-note]').textContent=`${number(result.amount)} ${result.from} × ${number(result.rate,6)} · ECB reference ${result.observationDate} · ${table.date===packet.fx.date?packet.fx.status:'historical reference'}. No spread or fees included.`;}catch{q('[data-fx-result]').textContent='These currencies do not share a rate on this reference date.';q('[data-fx-note]').textContent='Choose a date and currencies present in the same source table.';}
  }
  function updateScenario(){
    const form=q('[data-scenario-form]'),output=q('[data-scenario-result]');output.replaceChildren();
    if(!form.checkValidity()){output.textContent='Enter valid loan assumptions within the stated ranges.';return;}
    const principal=Number(form.elements.principal.value),years=Number(form.elements.years.value),baseRate=Number(form.elements.rate.value),nextRate=baseRate+Number(form.elements.change.value);
    if(nextRate<0||nextRate>50){output.textContent='The changed annual rate must be between 0% and 50%.';return;}
    try{const base=rateScenario({principal,years,annualRatePercent:baseRate}),changed=rateScenario({principal,years,annualRatePercent:nextRate}),difference=changed.monthlyPayment-base.monthlyPayment;output.append(el('span',`${money(changed.monthlyPayment)} / month`),el('small',`${baseRate}% → ${number(nextRate)}%: ${difference>=0?'+':''}${money(difference)} / month versus ${money(base.monthlyPayment)} at the base rate.`),el('small',`Total modeled interest at the changed rate: ${money(changed.totalInterest)}.`));}catch{output.textContent='Check the loan amount, term, and rate assumptions.';}
  }
  function renderHealth(){
    const body=q('[data-source-health]');body.replaceChildren();
    for(const source of packet.sourceHealth||[]){const row=el('tr'),name=el('td'),link=el('a',source.title);link.href=fixedSource(source.sourceUrl);name.append(link);const notes=[source.reason,source.lastError?`Last attempt failed: ${source.lastError.message}.`:'',source.runtimeEnabled?`Public reads cached ${source.cacheSeconds/3600} hours.`:'Runtime reads disabled; source is linked.'].filter(Boolean).join(' ');row.append(name,el('td',source.frequency),el('td',source.status),el('td',time(source.lastSuccessAt)),el('td',notes));body.append(row);}
  }
  function render(){renderSeries();renderCurve();renderFx();renderHealth();updateScenario();q('[data-packet-status]').textContent=packet.mode==='snapshot'?'Bundled snapshot · each signal keeps its own date':'Public feed checked · observation dates stay attached';}
  qa('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;filterBoard();announce(`${q('[data-board-count]').textContent} displayed.`);}));
  q('[data-watch-options]').addEventListener('change',event=>{const input=event.target;if(!input.matches('input[type=checkbox]'))return;input.checked?watched.add(input.value):watched.delete(input.value);try{view.localStorage.setItem(STORAGE_KEY,JSON.stringify([...watched]));}catch{}filterBoard();});
  q('[data-reset-watch]').addEventListener('click',()=>{watched=new Set(DEFAULT_RADAR.filter(id=>allIds.has(id)));try{view.localStorage.removeItem(STORAGE_KEY);}catch{}filterBoard();announce('Watchboard reset.');});
  for(const selector of ['[data-fx-form]','[data-scenario-form]'])q(selector).addEventListener('submit',event=>event.preventDefault());
  q('[data-fx-form]').addEventListener('input',updateFx);q('[data-scenario-form]').addEventListener('input',updateScenario);
  q('[data-refresh]').addEventListener('click',async()=>{
    const button=q('[data-refresh]');button.disabled=true;q('[data-packet-status]').textContent='Checking permitted public feeds…';
    try{const response=await read('/api/business-feels',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('feed unavailable');const next=await response.json();if(!Array.isArray(next.series)||!Array.isArray(next.sourceHealth)||!next.schemaVersion)throw Error('invalid feed');packet=next;render();const failures=next.sourceHealth.filter(source=>source.lastError).length;announce(failures?'Public feeds checked. Some providers failed; retained observations keep their original dates.':'Public feeds checked. Dates and source health updated.');}catch{q('[data-packet-status]').textContent='Refresh unavailable · retained dated observations';announce('Refresh unavailable. The last displayed observations and source dates are retained.');}finally{button.disabled=false;}
  });
  qa('[data-download]').forEach(button=>button.addEventListener('click',()=>{const csv=button.dataset.download==='csv',payload=csv?observationCsv(packet):JSON.stringify(packet,null,2),blob=new view.Blob([payload],{type:csv?'text/csv;charset=utf-8':'application/json'}),url=view.URL.createObjectURL(blob),link=el('a');link.href=url;link.download=`pointcast-business-feels.${csv?'csv':'json'}`;doc.body.append(link);link.click();link.remove();view.URL.revokeObjectURL(url);announce('Downloaded public observations with source attribution.');}));
  render();
  return {getPacket:()=>packet};
}
