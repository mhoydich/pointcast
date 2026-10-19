const topic=document.body.dataset.topic;
const $=s=>document.querySelector(s);
let currentReport=null;
const pacificTime=v=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(v));
const el=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
function displayMetric(m){
 if(m.status==='not_applicable')return 'No event this date';
 if(m.status==='unavailable'||m.value===null)return 'Unavailable';
 if(m.unit==='ISO8601')return pacificTime(m.value);
 return `${typeof m.value==='number'?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(m.value):m.value}${m.unit?' '+m.unit:''}`;
}
function renderReport(report){
 const container=$('#metrics');container.replaceChildren();
 for(const m of report.metrics){const cell=el('div',null,'metric');cell.append(el('h3',m.label),el('p',displayMetric(m),m.unit==='ISO8601'?'value date-value':'value'));const meta=el('div',null,'meta');meta.append(el('div',`${m.kind.replaceAll('_',' ')} · ${m.status}`),el('div',m.location));if(m.valid_at)meta.append(el('div',`${m.kind==='astronomical_calculation'?'Calculation instant':'Source observation time'}: ${pacificTime(m.valid_at)}`));else if(m.valid_date)meta.append(el('div',`Calculated for ${m.valid_date} · Pacific civil date`));if(m.note)meta.append(el('div',m.note));cell.append(meta);container.append(cell);}
 $('#report-status').textContent=`${report.status.toUpperCase()} · Report assembled ${pacificTime(report.generated_at)}. Source times are shown separately. No data value is substituted for an unavailable source.`;
 $('#report-text').textContent=report.metrics.map(m=>`${m.label}: ${displayMetric(m)} (${m.status}; ${m.location}${m.valid_at?'; '+pacificTime(m.valid_at):''}).`).join(' ');
 const code=$('#report-json');if(code)code.textContent=JSON.stringify(report,null,2);
}
async function refresh(){
 const button=$('#refresh');button.disabled=true;button.textContent='Checking sources…';
 $('#report-status').textContent='Checking official sources. The report will label missing and stale observations.';
 try{const response=await fetch(`/api/observatory/${topic}`,{cache:'no-cache',headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('unavailable');const report=await response.json();if(report.schema_version!=='pointcast.observatory.report.v1'||report.topic!==topic||!Array.isArray(report.metrics))throw new Error('invalid report');currentReport=report;renderReport(report);$('#download-report').disabled=false;}
 catch{currentReport=null;$('#download-report').disabled=true;$('#report-status').textContent='Unavailable — the source service could not be reached. Read the field guide below and follow official source links. No live values are being displayed.';$('#report-text').textContent='A current source report is unavailable. No observation was inferred.';$('#metrics').querySelectorAll('.value').forEach(v=>v.textContent='Unavailable');$('#metrics').querySelectorAll('.meta').forEach(v=>v.textContent='Current source report unavailable. See the source ledger for location and method.');const code=$('#report-json');if(code)code.textContent='No current report available.';}
 finally{button.disabled=false;button.textContent='Refresh report';}
}
function download(name,type,text){const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#refresh')?.addEventListener('click',refresh);
$('#download-report')?.addEventListener('click',()=>{if(currentReport)download(`pointcast-${topic}-${currentReport.local_date}.json`,'application/json',JSON.stringify(currentReport,null,2));});
const formulas={
 moon:()=>{const angle=Number($('#lab-range').value);const fraction=(1-Math.cos(angle*Math.PI/180))/2;$('#lab-output').textContent=`${(fraction*100).toFixed(1)}% illuminated · model angle ${angle}°`;const shape=$('#phase-model');if(shape){const points=[],waxing=angle<=180,cos=Math.cos(angle*Math.PI/180);for(let y=-100;y<=100;y+=2){const edge=Math.sqrt(10000-y*y);points.push(`${200+(waxing?edge:-edge)},${120+y}`);}for(let y=100;y>=-100;y-=2){const edge=Math.sqrt(10000-y*y);points.push(`${200+(waxing?cos*edge:-cos*edge)},${120+y}`);}shape.setAttribute('points',points.join(' '));$('#phase-svg').setAttribute('aria-label',`Idealized lunar phase: ${(fraction*100).toFixed(1)} percent illuminated, model angle ${angle} degrees`);}return {angle_deg:angle,illuminated_fraction:fraction};},
 sun:()=>{const power=Number($('#lab-range').value),hours=Number($('#lab-range-2').value),loss=0.8;const energy=power*hours*loss;$('#lab-output').textContent=`${energy.toFixed(1)} kWh/day · illustrative energy`;$('#range-value').textContent=`${power.toFixed(1)} kW array`;$('#range-value-2').textContent=`${hours.toFixed(1)} equivalent full-sun hours`;return {power_kw:power,equivalent_sun_hours:hours,performance_factor:loss,energy_kwh_day:energy};},
 pacific:()=>{const period=Number($('#lab-range').value),length=9.81*period*period/(2*Math.PI);$('#lab-output').textContent=`${length.toFixed(0)} m wavelength · ${period} s period`;$('#wave-model')?.setAttribute('d',`M0 90 Q ${length/4} 30 ${length/2} 90 T ${length} 90 T ${length*1.5} 90 T ${length*2} 90 T ${length*2.5} 90 T ${length*3} 90`);return {period_seconds:period,deep_water_wavelength_m:length};},
 air:()=>{const km=Number($('#lab-range').value);const layer=km<12?'Troposphere':km<50?'Stratosphere':km<85?'Mesosphere':km<600?'Thermosphere':'Exosphere transition';$('#lab-output').textContent=`${km} km · ${layer}`;$('#air-marker')?.setAttribute('cy',String(260-(Math.min(km,100)/100)*210));return {altitude_km:km,layer,model:'approximate layer boundaries; vary with latitude and season'};}
};
$('#lab-range')?.addEventListener('input',formulas[topic]);$('#lab-range-2')?.addEventListener('input',formulas[topic]);if(formulas[topic]&&$('#lab-range'))formulas[topic]();
$('#save-card')?.addEventListener('click',async()=>{
 const status=$('#card-status');const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const seed=`PointCast/${topic}/${day}/original-study-v1`;let hash='';try{hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(seed)))).map(x=>x.toString(16).padStart(2,'0')).join('');}catch{status.textContent='This browser cannot create a SHA-256 receipt. The page field guide remains available.';return;}
 const palette={moon:['#101b23','#d2f089'],sun:['#281b18','#ffca69'],pacific:['#082a30','#9fe4cc'],air:['#182d36','#c6e3f3']}[topic];
 const rings=Array.from({length:8},(_,i)=>`<circle cx="360" cy="300" r="${70+i*19}" fill="none" stroke="${palette[1]}" stroke-opacity="${.2+i*.07}" stroke-dasharray="${parseInt(hash.slice(i*2,i*2+2),16)+10} 24" transform="rotate(${parseInt(hash.slice(i*3,i*3+2),16)} 360 300)"/>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900"><rect width="720" height="900" fill="${palette[0]}"/><g>${rings}</g><g fill="${palette[1]}" font-family="monospace"><text x="45" y="60" font-size="16">POINTCAST / OBSERVATORY / ORIGINAL STUDY</text><text x="45" y="630" font-size="60">${topic.toUpperCase()}</text><text x="45" y="685" font-size="20">${day} · El Segundo · Pacific civil date</text><text x="45" y="735" font-size="14">Conceptual geometry. No source observation encoded.</text><text x="45" y="762" font-size="14">SHA-256 seed receipt · not an NFT or ownership proof</text><text x="45" y="810" font-size="11">${hash.slice(0,32)}</text><text x="45" y="833" font-size="11">${hash.slice(32)}</text></g></svg>`;
 download(`pointcast-${topic}-study-${day}.svg`,'image/svg+xml',svg);status.textContent=`Saved original SVG study. Seed receipt ${hash.slice(0,16)}… No blockchain or wallet action occurred.`;
});
refresh();
