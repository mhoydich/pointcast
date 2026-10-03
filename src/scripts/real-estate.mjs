import {localMarkets,localSources,STUDY_CENTER,haversineMiles} from '../lib/real-estate-local.mjs';
import {sources as globalSources} from '../lib/real-estate-global.mjs';
import {DEFAULT_INPUTS,INPUT_FIELDS,SCENARIOS,normalizeInputs,compareScenarios} from '../lib/real-estate-scenario.mjs';
import {USGS_URL,normalizeUsgs,FEED_SOURCES} from '../lib/real-estate-feeds.mjs';
import snapshots from '../data/real-estate-snapshots.json' with {type:'json'};
const sources=[...localSources,...globalSources,...FEED_SOURCES];
const colors={adverse:'#ed8971',base:'#edc85d',upside:'#91bbc5'};
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const pct=n=>n===null?'—':`${n.toFixed(2)}%`;
export function readAssumptions(search){
  const params=new URLSearchParams(search),inputs={};
  for(const {key}of INPUT_FIELDS)if(params.has(key)){const raw=params.get(key);if(raw.trim()===''||params.getAll(key).length!==1)throw new Error(`Invalid shared ${key}.`);inputs[key]=Number(raw);}
  return normalizeInputs(inputs);
}
export function initRealEstate(root){
  if(!root)return()=>{};root._realEstateCleanup?.();
  const document=root.ownerDocument,w=document.defaultView,listeners=[];
  let inputs={...DEFAULT_INPUTS},caseId='base',results=compareScenarios(inputs),selected=localMarkets[0].id;
  let destroyed=false;
  const on=(target,event,fn)=>{if(!target)return;target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
  const find=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
  const text=(selector,value)=>{const e=find(selector);if(e)e.textContent=value;};
  const svg=(name,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',name);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
  const form=find('[data-assumptions]');
  function writeUrl(){
    const url=new URL(w.location.href);for(const{key}of INPUT_FIELDS){if(inputs[key]===DEFAULT_INPUTS[key])url.searchParams.delete(key);else url.searchParams.set(key,String(inputs[key]));}
    url.searchParams.set('case',caseId);url.searchParams.set('market',selected);
    for(const[selector,key]of [['[data-local-search]','q'],['[data-type]','type'],['[data-global-search]','gq'],['[data-global-region]','region']]){const value=find(selector)?.value;if(value&&value!=='all')url.searchParams.set(key,value);else url.searchParams.delete(key);}
    w.history.replaceState(null,'',url);
  }
  function setFields(){for(const{key}of INPUT_FIELDS){const e=form?.elements.namedItem(key);if(e)e.value=String(inputs[key]);}}
  function updateLocal(){
    const q=(find('[data-local-search]')?.value||'').toLowerCase().trim(),type=find('[data-type]')?.value||'all';let count=0;
    for(const b of all('[data-market]')){const show=b.dataset.search.includes(q)&&(type==='all'||b.dataset.types.split('|').includes(type));b.hidden=!show;if(show)count++;}
    text('[data-local-count]',`${count} of ${localMarkets.length} anchors${count===0?' · no matches':''}`);
  }
  function updateGlobal(){const q=(find('[data-global-search]')?.value||'').toLowerCase().trim(),region=find('[data-global-region]')?.value||'all';let count=0;for(const e of all('[data-global-market]')){e.hidden=!(e.dataset.search.includes(q)&&(region==='all'||region===e.dataset.region));if(!e.hidden)count++;}text('[data-global-count]',`${count} markets${count===0?' · no matches':''}`);}
  function selectMarket(id){
    const m=localMarkets.find(m=>m.id===id);if(!m)return;selected=id;
    all('[data-market]').forEach(e=>{e.classList.toggle('selected',e.dataset.market===id);e.setAttribute('aria-pressed',String(e.dataset.market===id));});
    all('[data-map-market]').forEach(e=>{e.classList.toggle('selected',e.dataset.mapMarket===id);e.setAttribute('aria-pressed',String(e.dataset.mapMarket===id));});
    for(const[key,value]of Object.entries({name:m.name,distance:`${m.distanceMiles.toFixed(1)} MI / REPRESENTATIVE CENTER`,character:m.character,types:m.propertyTypes.join(' · ')}))text(`[data-detail="${key}"]`,value);
    for(const key of ['planning','transit','risks']){const ul=find(`[data-detail="${key}"]`);if(ul)ul.replaceChildren(...m[key].map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));}
    const links=find('[data-detail="sources"]');if(links)links.replaceChildren(...sources.filter(s=>m.sourceIds.includes(s.id)).map(s=>{const a=document.createElement('a');a.href=`#${s.id}`;a.textContent=`${s.publisher||s.title} ↗`;return a;}));
  }
  function chart(){
    const vals=results.flatMap(r=>r.years.map(y=>y.equity));let min=Math.min(0,...vals),max=Math.max(1,...vals);const span=max-min;min-=span*.08;max+=span*.08;
    const x=i=>86+i*163,y=v=>265-(v-min)/(max-min)*220;
    const grid=find('[data-chart-grid]'),paths=find('[data-chart-paths]'),labels=find('[data-chart-labels]');if(!grid||!paths||!labels)return;grid.replaceChildren();paths.replaceChildren();labels.replaceChildren();
    for(let i=0;i<4;i++){const value=min+(max-min)*i/3,pos=y(value);grid.append(svg('line',{x1:86,x2:738,y1:pos,y2:pos,stroke:'#66705c','stroke-width':.7}));const l=svg('text',{x:76,y:pos+4,'text-anchor':'end',fill:'#bdc4b3'});l.textContent=money(value);grid.append(l);}
    for(const r of results){paths.append(svg('polyline',{points:r.years.map((a,i)=>`${x(i)},${y(a.equity)}`).join(' '),fill:'none',stroke:colors[r.scenario.id],'stroke-width':r.scenario.id===caseId?4:2,'stroke-dasharray':r.scenario.id==='adverse'?'6 5':''}));r.years.forEach((a,i)=>paths.append(svg('circle',{cx:x(i),cy:y(a.equity),r:3.5,fill:colors[r.scenario.id]})));}
    for(let i=0;i<5;i++){const l=svg('text',{x:x(i),y:295,'text-anchor':'middle'});l.textContent=`YEAR ${i+1}`;labels.append(l);}
  }
  function renderModel(){
    const r=results.find(r=>r.scenario.id===caseId),m=r.initialMetrics,f=r.final;
    all('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===caseId)));
    for(const[key,value]of Object.entries({equity:money(f.equity),exit:money(f.netLiquidation),count:`${f.propertyCount} / ${money(f.unfundedShortfall)}`,gross:pct(m.grossYieldPct),cap:pct(m.capRatePct),dscr:m.dscr===null?'Debt free':`${m.dscr.toFixed(2)}×`,cashflow:`${money(m.cashflow)}/yr`}))text(`[data-output="${key}"]`,value);
    const adjustments=r.appliedAdjustments.filter(a=>a.before!==a.after).map(a=>`${INPUT_FIELDS.find(f=>f.key===a.field)?.label}: ${a.before} → ${Number(a.after.toFixed(3))}${a.clamped?' (bounded)':''}`).join('; ');
    const cashOnly=f.propertyCount===0?' No property is acquired under these gates; this path is contributed cash only.':'';
    text('[data-output="scenario"]',`${r.scenario.label}: ${r.scenario.description}${adjustments?' '+adjustments+'.':''}${cashOnly}`);
    text('[data-table-caption]',`${r.scenario.label} scenario · five hypothetical years, USD. Contributions at each year’s start; asset values cannot fund the down payment.`);
    const tbody=find('[data-model-years]');if(tbody)tbody.replaceChildren(...r.years.map(y=>{
      const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=String(y.year);tr.append(th);
      for(const v of [`${y.propertyCount} / +${y.acquiredCount}`,money(y.cashflow),money(y.liquidCash),money(y.reserves),money(y.propertyValue),money(y.debtBalance)]){const td=document.createElement('td');td.textContent=v;tr.append(td);}
      const equity=document.createElement('td');equity.textContent=money(y.equity);if(y.unfundedShortfall>0){const small=document.createElement('small');small.textContent=`Unfunded: ${money(y.unfundedShortfall)}`;equity.append(small);}tr.append(equity);
      const gate=document.createElement('td');if(y.acquisitionEligibility.eligible){const span=document.createElement('span');span.className='re-pass';span.textContent='Model gate passed · 1 acquired';gate.append(span);}else{gate.textContent=y.acquisitionEligibility.reasons.join(' ');const small=document.createElement('small');small.textContent=`Cash gap ${money(y.acquisitionEligibility.cashGap)} · DSCR ${y.acquisitionEligibility.dscr===null?'debt free':y.acquisitionEligibility.dscr.toFixed(2)+'×'}`;gate.append(small);}tr.append(gate);return tr;
    }));chart();
  }
  function hpiChart(data){
    text('[data-feed="hpi-value"]',data.latest.index.toFixed(2));text('[data-feed="hpi-period"]',`${data.observationPeriod} · all-transactions · NSA`);
    const signed=v=>v===null?'Unavailable':`${v>=0?'+':''}${v.toFixed(2)}%`;
    text('[data-feed="hpi-change"]',`${signed(data.quarterChangePct)} quarter / ${signed(data.yearChangePct)} year`);text('[data-feed="hpi-date"]',`Retrieved ${data.retrievedAt}. Observation ${data.observationPeriod}.`);
    const rows=data.records,min=Math.min(...rows.map(r=>r.index)),max=Math.max(...rows.map(r=>r.index));const points=rows.map((r,i)=>`${24+i*450/Math.max(1,rows.length-1)},${130-(r.index-min)/Math.max(1,max-min)*100}`).join(' ');find('[data-feed="hpi-path"]')?.setAttribute('points',points);
    const labels=find('[data-feed="hpi-labels"]');if(labels){labels.replaceChildren();for(const[i,x]of [[0,24],[rows.length-1,474]]){const l=svg('text',{x,y:160,'text-anchor':i?'end':'start'});l.textContent=`${rows[i].year} Q${rows[i].quarter}`;labels.append(l);}}
  }
  function quakes(data){text('[data-feed="quake-count"]',String(data.events.length));text('[data-feed="quake-date"]',`Generated ${data.generatedAt}; retrieved ${data.retrievedAt}.`);const ul=find('[data-feed="quakes"]');if(ul)ul.replaceChildren(...(data.events.length?data.events.slice(0,10).map(e=>{const li=document.createElement('li');li.textContent=`M ${e.magnitude===null?'pending':e.magnitude.toFixed(1)} · ${e.place} · ${e.distanceMiles.toFixed(1)} mi · ${e.occurredAt.slice(0,16).replace('T',' ')} UTC`;if(e.url){const a=document.createElement('a');a.href=e.url;a.textContent=' USGS ↗';li.append(a);}return li;}):[Object.assign(document.createElement('li'),{textContent:'No epicenters in this feed window inside the study circle. This does not establish safety.'})]));}
  async function refresh(kind,button){
    const status=kind==='fhfa'?'hpi-status':'quake-status';button.disabled=true;text(`[data-feed="${status}"]`,'Fetching the public source…');let data;
    try{
      const response=await w.fetch(`/api/real-estate/feed?source=${kind}`,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('API unavailable in preview');data=await response.json();if(data.kind!==kind||!['fetched','cached','snapshot-fallback'].includes(data.status))throw new Error('Unexpected API data');
    }catch{
      if(kind==='usgs')try{const response=await w.fetch(USGS_URL,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('USGS unavailable');const reader=response.body.getReader();let size=0,output='';const decoder=new TextDecoder();try{while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4000000)throw new Error('Oversized feed');output+=decoder.decode(value,{stream:true});}output+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}data={...normalizeUsgs(JSON.parse(output),STUDY_CENTER,haversineMiles),status:'fetched',transport:'USGS browser CORS'};}catch{data={...snapshots[kind],status:'snapshot-fallback'};}
      else data={...snapshots[kind],status:'snapshot-fallback'};
    }finally{if(!destroyed)button.disabled=false;}
    if(destroyed)return;if(kind==='fhfa')hpiChart(data);else quakes(data);
    text(`[data-feed="${status}"]`,['fetched','cached'].includes(data.status)?`${data.status==='cached'?'Served from bounded edge cache':'Fetched on request'}${data.transport?' via '+data.transport:''}. ${kind==='fhfa'?'The observation remains quarterly delayed.':'Events can be revised.'} No background refresh.`:'Source unavailable in this runtime. Showing dated snapshot fallback; original timestamps retained.');
  }
  function calculateForm(){const next={};for(const{key}of INPUT_FIELDS){const el=form.elements.namedItem(key);if(!el||el.value.trim()==="")throw new Error(`Enter ${key}.`);next[key]=Number(el.value);}inputs=normalizeInputs(next);results=compareScenarios(inputs);renderModel();writeUrl();}
  function restore(){
    const params=new URLSearchParams(w.location.search);try{inputs=readAssumptions(w.location.search);text('[data-model-status]','Shared assumptions restored. All values remain hypothetical.');}catch(error){inputs={...DEFAULT_INPUTS};text('[data-model-status]',`${error.message} Loaded the example defaults.`);}
    caseId=SCENARIOS.some(s=>s.id===params.get('case'))?params.get('case'):'base';setFields();results=compareScenarios(inputs);renderModel();selectMarket(localMarkets.some(m=>m.id===params.get('market'))?params.get('market'):localMarkets[0].id);
    for(const[selector,key]of [['[data-local-search]','q'],['[data-type]','type'],['[data-global-search]','gq'],['[data-global-region]','region']]){const e=find(selector),value=params.get(key);if(e&&value){if(e.tagName==='SELECT'){if([...e.options].some(o=>o.value===value))e.value=value;}else e.value=value.slice(0,120);}}
    updateLocal();updateGlobal();
  }
  on(root,'click',e=>{const b=e.target.closest('button,[data-map-market]');if(!b||!root.contains(b))return;
    if(b.dataset.market||b.dataset.mapMarket){selectMarket(b.dataset.market||b.dataset.mapMarket);writeUrl();}
    if(b.dataset.case){caseId=b.dataset.case;renderModel();writeUrl();}
    if(b.hasAttribute('data-reset')){inputs={...DEFAULT_INPUTS};caseId='base';setFields();results=compareScenarios(inputs);renderModel();writeUrl();text('[data-model-status]','The invented example is restored.');}
    if(b.dataset.refresh)void refresh(b.dataset.refresh,b);
    if(b.hasAttribute('data-share')){try{calculateForm();}catch(error){text('[data-model-status]',error.message);return;}const value=w.location.href;if(w.navigator.clipboard?.writeText)void w.navigator.clipboard.writeText(value).then(()=>text('[data-model-status]','Assumptions link copied.')).catch(()=>text('[data-model-status]','Copy the address bar to share these assumptions.'));else text('[data-model-status]','Copy the address bar to share these assumptions.');}
    if(b.hasAttribute('data-download')){try{calculateForm();}catch(error){text('[data-model-status]',error.message);return;}const blob=new w.Blob([JSON.stringify({kind:'hypothetical-team-portfolio',exportedAt:new Date().toISOString(),inputs,selectedScenario:caseId,results},null,2)],{type:'application/json'}),url=w.URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pointcast-real-estate-hypothetical-portfolio.json';a.click();w.URL.revokeObjectURL(url);text('[data-model-status]','Results downloaded with inputs and model exclusions.');}
  });
  on(root,'keydown',e=>{const m=e.target.closest('[data-map-market]');if(m&&['Enter',' '].includes(e.key)){e.preventDefault();selectMarket(m.dataset.mapMarket);writeUrl();}});
  on(form,'submit',e=>{e.preventDefault();try{calculateForm();text('[data-model-status]','Recalculated from your hypothetical assumptions. Contributions arrive at each year’s start.');}catch(error){text('[data-model-status]',error.message);}});
  for(const selector of ['[data-local-search]','[data-type]'])on(find(selector),'input',()=>{updateLocal();writeUrl();});for(const selector of ['[data-global-search]','[data-global-region]'])on(find(selector),'input',()=>{updateGlobal();writeUrl();});on(w,'popstate',restore);
  restore();hpiChart(snapshots.fhfa);quakes(snapshots.usgs);
  const cleanup=()=>{destroyed=true;listeners.forEach(fn=>fn());if(root._realEstateCleanup===cleanup)delete root._realEstateCleanup;};root._realEstateCleanup=cleanup;return cleanup;
}
