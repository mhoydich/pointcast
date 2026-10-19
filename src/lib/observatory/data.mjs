export const LOCATION = Object.freeze({name:'El Segundo, California — public town reference',latitude:33.9192,longitude:-118.4165,time_zone:'America/Los_Angeles'});
export const TOPICS = ['moon','sun','pacific','air'];
export function localDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:LOCATION.time_zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get = name => parts.find(p=>p.type===name).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function numeric(value) { return (typeof value==='number'||typeof value==='string'&&value.trim()!=='') && Number.isFinite(Number(value)) ? Number(value) : null; }
export function isoUTC(value) {
  if(typeof value !== 'string' || !value.trim()) return null;
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value.replace(' ','T')}Z`;
  const ms=Date.parse(normalized);return Number.isFinite(ms)?new Date(ms).toISOString():null;
}
export function metric({id,label,value=null,unit=null,kind,source,location=LOCATION.name,valid_at=null,valid_date=null,max_age_seconds=null,note=null,quality=null,station_id=null,coordinates=null,reason=null,status_override=null}, now) {
  const at = valid_at && Date.parse(valid_at);
  const age = at ? Math.max(0,(now.getTime()-at)/1000) : null;
  const future = kind !== 'astronomical_calculation' && at && at > now.getTime()+300000;
  const status = status_override==='not_applicable'?'not_applicable':value === null || value === undefined || future || (kind==='observation'||kind==='estimate')&&!at ? 'unavailable' : max_age_seconds && age !== null && age>max_age_seconds ? 'stale' : 'available';
  return {id,label,value:status==='unavailable'?null:value,unit,kind,status,source,location,valid_at,valid_date,age_seconds:age===null?null:Math.round(age),max_age_seconds,note,quality,station_id,coordinates,reason:reason??(status==='unavailable'?'missing_or_invalid_source_value':status==='stale'?'source_age_exceeds_policy':null)};
}
export async function boundedText(response,limit=5*1024*1024){
  if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw new Error('upstream_too_large');}
  if(!response.body)throw new Error('upstream_empty');
  const reader=response.body.getReader(),decoder=new TextDecoder();let length=0,result='';
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new Error('upstream_too_large');}result+=decoder.decode(value,{stream:true});}result+=decoder.decode();return result;}finally{reader.releaseLock();}
}
export async function upstream(url, fetcher=fetch, text=false) {
  const response=await fetcher(url,{headers:{'Accept':text?'text/plain':'application/json','User-Agent':'PointCastObservatory/1.0 (https://pointcast.xyz)'},signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error(`upstream_http_${response.status}`);
  const content=await boundedText(response);const data=text?content:JSON.parse(content);
  if(!data || data.error)throw new Error('upstream_error');return data;
}
export function illumination(raw){const n=typeof raw==='string'&&raw.endsWith('%')?numeric(raw.slice(0,-1)):numeric(raw)===null?null:numeric(raw)*100;return n!==null&&n>=0&&n<=100?n:null;}
export function pacificOffset(day) {
  const zone=new Intl.DateTimeFormat('en-US',{timeZone:LOCATION.time_zone,timeZoneName:'shortOffset'}).formatToParts(new Date(`${day}T20:00:00Z`)).find(p=>p.type==='timeZoneName').value;
  return zone==='GMT-7'?'-07:00':'-08:00';
}
export function usnoMetrics(body,topic,day,now){
  const d=body?.properties?.data;
  if(!d || numeric(d.year)!==Number(day.slice(0,4)) || numeric(d.month)!==Number(day.slice(5,7)) || numeric(d.day)!==Number(day.slice(8,10)))throw new Error('invalid_usno_date');
  const rows=topic==='moon'?d.moondata:d.sundata;
  if(!Array.isArray(rows))throw new Error('invalid_usno_events');
  const event=(code)=>rows.find(r=>r.phen===code || r.phen===({'R':'Rise','S':'Set','U':'Upper Transit'}[code]))?.time??null;
  const src='usno';
  const absent=code=>event(code)===null || event(code)===undefined || event(code)==='null';
  // One local civil date, with the seasonal Pacific offset explicitly preserved.
  const offset=pacificOffset(day);
  if(numeric(d.tz)!==-8 || d.isdst !== (offset==='-07:00')) throw new Error('invalid_usno_zone');
  const time=(v)=>{const match=/^(\d{2}:\d{2})(?:\s+(ST|DT))?$/.exec(v??'');if(!match)return null;const eventOffset=match[2]?(match[2]==='DT'?'-07:00':'-08:00'):offset;return new Date(`${day}T${match[1]}:00${eventOffset}`).toISOString();};
  const result=['R','S'].map((code,i)=>metric({status_override:absent(code)?'not_applicable':null,reason:absent(code)?'no_event_on_requested_civil_date':null,id:i?'set':'rise',label:`${topic==='moon'?'Moon':'Sun'}${i?'set':'rise'}`,value:time(event(code)),kind:'astronomical_calculation',source:src,unit:'ISO8601',valid_date:day,note:'USNO event for the El Segundo local calendar date; displayed in Pacific time with its local date. Geometric horizon; terrain and weather can change visibility.'},now));
  if(topic==='moon'){
    result.push(metric({status_override:absent('U')?'not_applicable':null,reason:absent('U')?'no_event_on_requested_civil_date':null,id:'transit',label:'Moon upper transit',value:time(event('U')),unit:'ISO8601',kind:'astronomical_calculation',source:src,valid_date:day,note:'Calculated crossing of the local meridian, usually the highest point of the daily path.'},now));
    result.unshift(metric({id:'illumination',label:'Illumination at local noon',value:illumination(d.fracillum),unit:'%',kind:'astronomical_calculation',source:src,valid_at:new Date(`${day}T12:00:00${offset}`).toISOString(),note:'USNO fraction for noon in America/Los_Angeles. A daily calculation, not a live observation.'},now));
    result.push(metric({id:'phase',label:'Daily lunar phase',value:typeof d.curphase==='string'?d.curphase:null,kind:'astronomical_calculation',source:src,valid_date:day},now));
  }
  if(topic==='sun'){
    const rise=time(event('R')),set=time(event('S'));
    result.push(metric({id:'daylight',label:'Calculated daylight',value:rise&&set?Math.round((Date.parse(set)-Date.parse(rise))/60000):null,unit:'minutes',kind:'astronomical_calculation',source:src,valid_date:day,note:'Sunset minus sunrise for the public El Segundo reference horizon; not equivalent full-sun hours for photovoltaics.'},now));
  }
  return result;
}
export function newest(rows,predicate=()=>true){if(!Array.isArray(rows))return null;return rows.filter(r=>r && isoUTC(r.time_tag) && predicate(r)).sort((a,b)=>Date.parse(isoUTC(b.time_tag))-Date.parse(isoUTC(a.time_tag)))[0]??null;}
export function swpcMetrics(wind,kp,now){
  const w=newest(wind,r=>r.active===true && numeric(r.proton_speed)!==null && numeric(r.proton_speed)>0);
  const k=newest(kp,r=>numeric(r.estimated_kp)!==null && numeric(r.estimated_kp)>=0 && numeric(r.estimated_kp)<=9);
  return [metric({id:'solar-wind',label:'Solar wind speed',value:numeric(w?.proton_speed),unit:'km/s',kind:'observation',source:'swpc-wind',quality:w?Object.fromEntries(Object.entries(w).filter(([k])=>k==='overall_quality'||k.endsWith('_flag'))):null,location:w?.source?`Upstream spacecraft: ${w.source}`:'Upstream solar wind monitoring',valid_at:isoUTC(w?.time_tag),max_age_seconds:1200,note:'Active-source proton speed upstream of Earth; not wind in El Segundo.'},now),metric({id:'kp',label:'Estimated planetary Kp',value:numeric(k?.estimated_kp),unit:'0–9 index',kind:'estimate',source:'swpc-kp',location:'Planetary geomagnetic activity',valid_at:isoUTC(k?.time_tag),max_age_seconds:3600,note:'SWPC estimated Kp; not a local aurora forecast.'},now)];
}
export function tideMetrics(body,now){
  if(!Array.isArray(body?.data))throw new Error('invalid_tide_data');
  const rows=body.data.filter(r=>numeric(r.v)!==null && isoUTC(r.t)).sort((a,b)=>Date.parse(isoUTC(b.t))-Date.parse(isoUTC(a.t)));
  const row=rows[0];
  return [metric({id:'water-level',label:'Measured water level',value:numeric(row?.v),unit:'m above MLLW',kind:'observation',source:'noaa-tides',location:'Santa Monica tide station 9410840',valid_at:isoUTC(row?.t),max_age_seconds:1800,quality:row?{q:row.q??null,f:row.f??null,s:row.s??null}:null,station_id:'9410840',coordinates:{latitude:34.0083,longitude:-118.5},note:'Relative to mean lower low water datum. Preliminary station observation; not the water level at every El Segundo beach.'},now)];
}
export function buoyMetrics(text,now){
  const lines=text.trim().split(/\r?\n/);const headers=lines.find(l=>l.startsWith('#YY'))?.replace(/^#/,'').trim().split(/\s+/);
  if(!headers)throw new Error('invalid_buoy_headers');
  const rows=lines.filter(l=>!l.startsWith('#')).map(l=>l.trim().split(/\s+/));
  const row=rows[0];if(!row)throw new Error('missing_buoy_rows');
  const fields=Object.fromEntries(headers.map((h,i)=>[h,row[i]]));
  const valid=isoUTC(`${fields.YY}-${fields.MM}-${fields.DD}T${fields.hh}:${fields.mm}:00Z`);
  const get=k=>fields[k]==='MM'?null:numeric(fields[k]);
  return [['wave-height','Significant wave height','WVHT','m'],['water-temperature','Offshore water temperature','WTMP','°C'],['wave-period','Dominant wave period','DPD','s']].map(([id,label,key,unit])=>metric({id,label,value:get(key),unit,kind:'observation',source:'ndbc',location:'Offshore Santa Monica Bay buoy 46221 / CDIP 028',valid_at:valid,max_age_seconds:7200,station_id:'46221',coordinates:{latitude:33.860,longitude:-118.641},note:'Offshore buoy measurement. Wave height is a sea-state statistic, not breaking surf height; water temperature is not beach temperature.'},now));
}
export function airMetrics(body,now){
  const p=body?.properties;if(!p || !isoUTC(p.timestamp))throw new Error('invalid_nws_observation');
  const expected={temperature:'wmoUnit:degC',windSpeed:'wmoUnit:km_h-1',relativeHumidity:'wmoUnit:percent'};
  const read=k=>p[k]?.unitCode===expected[k] && p[k]?.qualityControl!=='X'?numeric(p[k]?.value):null;
  return [['temperature','Air temperature','temperature','°C'],['wind','Wind speed','windSpeed','km/h'],['humidity','Relative humidity','relativeHumidity','%']].map(([id,label,key,unit])=>metric({id,label,value:read(key),unit,kind:'observation',source:'nws-klax',location:'KLAX airport weather station — not an air-quality monitor',valid_at:isoUTC(p.timestamp),max_age_seconds:7200,quality:p[key]?.qualityControl??null,station_id:'KLAX',coordinates:{latitude:33.93806,longitude:-118.38889},note:'Nearby airport meteorology. Conditions can differ within El Segundo. This is not an AQI or pollutant measurement.'},now));
}

export function phaseMetrics(body,now){
 if(!Array.isArray(body?.phasedata))throw new Error('invalid_phase_data');
 const rows=body.phasedata.map(p=>({name:p.phase,time:isoUTC(`${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}T${p.time}:00Z`)})).filter(p=>p.time&&Date.parse(p.time)>=now.getTime()).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
 const next=rows[0];
 return [metric({id:'next-phase',label:next?`Next primary phase: ${next.name}`:'Next primary phase',value:next?.time??null,unit:'ISO8601',kind:'astronomical_calculation',source:'usno-phases',location:'Global lunar phase instant, displayed in Pacific time',valid_at:next?.time??null,note:'USNO primary-phase time is Universal Time; rendered as a dated Pacific time. A calculated future event, not a forecast of clear skies.'},now)];
}
