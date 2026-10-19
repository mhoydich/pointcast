export const SCHEMA_VERSION = 'pointcast-waves-v1';
export const STATION = Object.freeze({id:'46221',cdipId:'028',name:'Santa Monica Bay offshore buoy',latitude:33.860,longitude:-118.641,depthM:387,sourceUrl:'https://www.ndbc.noaa.gov/station_realtime.php?station=46221',feedUrl:'https://www.ndbc.noaa.gov/data/realtime2/46221.txt'});
export const TIME_ZONE = 'America/Los_Angeles';
export const metresToFeet = m => typeof m==='number' && Number.isFinite(m) ? m*3.28084 : null;
export function compassPoint(deg) {
  return typeof deg==='number' && Number.isFinite(deg) ? ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(((deg%360)+360)%360/22.5)%16] : null;
}
export function formatLocalTime(iso) {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? new Intl.DateTimeFormat('en-US',{timeZone:TIME_ZONE,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(time) : 'Unavailable';
}
export function statusAt(observation, now=new Date()) {
  const t = Date.parse(observation?.observedAt), clock = new Date(now).getTime();
  if(!Number.isFinite(t) || !Number.isFinite(clock) || t>clock+300000) return {state:'unavailable',ageMinutes:null};
  const ageMinutes = Math.max(0,(clock-t)/60000);
  return {state:ageMinutes<=90?'fresh':ageMinutes<=180?'delayed':ageMinutes<=360?'stale':'expired',ageMinutes};
}
export function waveModel(observation) {
  const period=observation?.dominantPeriodS, direction=observation?.directionFromDeg;
  const wavelengthM=typeof period==='number' && period>0 ? 9.80665*period*period/(2*Math.PI) : null;
  return {wavelengthM,phaseSpeedMS:wavelengthM===null?null:wavelengthM/period,travelDeg:typeof direction==='number'?(direction+180)%360:null};
}
export function trendSegments(history) {
  const groups=[]; let segment=[],previous=null;
  for(const row of history??[]) {
    const time=Date.parse(row.observedAt);
    if(!Number.isFinite(time) || typeof row.heightM!=='number' || !Number.isFinite(row.heightM)) {if(segment.length)groups.push(segment);segment=[];previous=null;continue;}
    if(previous!==null && (time-previous>45*60000 || time<=previous)){if(segment.length)groups.push(segment);segment=[];}
    segment.push(row); previous=time;
  }
  if(segment.length)groups.push(segment);
  return groups;
}
export function describeMorning(packet, now=new Date()) {
  const o=packet?.observation;
  if(!o) return 'The buoy report is unavailable. No conditions have been estimated.';
  const state=statusAt(o,now).state;
  const height=typeof o.heightM==='number'?`${o.heightM.toFixed(1)} m (${metresToFeet(o.heightM).toFixed(1)} ft) significant wave height`:'wave height unavailable';
  const period=typeof o.dominantPeriodS==='number'?`${o.dominantPeriodS.toFixed(0)}-second dominant period`:'dominant period unavailable';
  const direction=typeof o.directionFromDeg==='number'?`from ${compassPoint(o.directionFromDeg)}, ${Math.round(o.directionFromDeg)}° true`:'direction unavailable';
  const rows=(packet.history??[]).filter(r=>typeof r.heightM==='number');
  const range=rows.length?` The ${rows.length} reported heights in the displayed 24-hour window range from ${Math.min(...rows.map(r=>r.heightM)).toFixed(1)} to ${Math.max(...rows.map(r=>r.heightM)).toFixed(1)} m.`:'';
  return `${state==='expired'||state==='stale'?'Older offshore observation':'Offshore observation'} at ${formatLocalTime(o.observedAt)}: ${height}, ${period}, ${direction}.${range} This does not describe breaking surf at El Segundo.`;
}
