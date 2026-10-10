import {SCHEMA_VERSION,STATION} from '../../../public/waves/model.mjs';
export const MAX_FEED_BYTES = 1024*1024;
const REQUIRED={YY:'yr',MM:'mo',DD:'dy',hh:'hr',mm:'mn',WVHT:'m',DPD:'sec',APD:'sec',MWD:'degT',WTMP:'degC',WDIR:'degT',WSPD:'m/s',GST:'m/s'};
const FIELDS={heightM:['WVHT',0,50],dominantPeriodS:['DPD',Number.MIN_VALUE,60],averagePeriodS:['APD',Number.MIN_VALUE,60],directionFromDeg:['MWD',0,360],waterTempC:['WTMP',-5,50],windSpeedMS:['WSPD',0,100],windDirectionDeg:['WDIR',0,360],gustMS:['GST',0,120]};
function value(token,min,max){if(token==='MM')return null;if(typeof token!=='string'||!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(token))return null;const v=Number(token);return Number.isFinite(v)&&v>=min&&v<=max?v:null;}
function time(fields,now){
  if(!['YY','MM','DD','hh','mm'].every(k=>/^\d+$/.test(fields[k]??'')))return null;
  const [y,m,d,h,n]=['YY','MM','DD','hh','mm'].map(k=>Number(fields[k]));
  if(y<2000||y>2100||m<1||m>12||d<1||d>31||h>23||n>59)return null;
  const ms=Date.UTC(y,m-1,d,h,n),at=new Date(ms);
  if(at.getUTCFullYear()!==y||at.getUTCMonth()!==m-1||at.getUTCDate()!==d||ms>now.getTime()+300000)return null;
  return at.toISOString();
}
export function parseNdbc(text,now=new Date()){
  if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_FEED_BYTES)throw new Error('feed_too_large');
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(lines.length>6000)throw new Error('feed_too_many_rows');
  const header=lines.find(l=>/^#YY\s/.test(l))?.slice(1).trim().split(/\s+/);
  const units=lines.find(l=>/^#yr\s/.test(l))?.slice(1).trim().split(/\s+/);
  if(!header||!units||header.length!==units.length||new Set(header).size!==header.length||header.length>32)throw new Error('feed_header_invalid');
  if(!Object.entries(REQUIRED).every(([k,u])=>header.includes(k)&&units[header.indexOf(k)]===u))throw new Error('feed_units_invalid');
  const rows=new Map();
  for(const line of lines){
    if(line.startsWith('#'))continue;
    const tokens=line.split(/\s+/);if(tokens.length!==header.length)continue;
    const fields=Object.fromEntries(header.map((k,i)=>[k,tokens[i]]));
    const observedAt=time(fields,now);if(!observedAt)continue;
    const row={observedAt};for(const [k,[field,min,max]] of Object.entries(FIELDS))row[k]=value(fields[field],min,max);
    if(row.directionFromDeg===360)row.directionFromDeg=0;
    if(row.windDirectionDeg===360)row.windDirectionDeg=0;
    // Equal-time duplicates choose the more complete row; there is no synthetic merge across timestamps.
    const old=rows.get(observedAt),score=r=>100*['heightM','dominantPeriodS','directionFromDeg'].filter(k=>r[k]!==null).length+10*(r.averagePeriodS!==null)+Object.values(r).filter(v=>v!==null).length;
    if(!old||score(row)>score(old))rows.set(observedAt,row);
  }
  const sorted=[...rows.values()].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
  const observation=sorted.findLast(r=>r.heightM!==null||r.dominantPeriodS!==null||r.directionFromDeg!==null)??null;
  const from=new Date(now.getTime()-24*3600000).toISOString(),to=now.toISOString();
  const history=sorted.filter(r=>r.observedAt>=from&&r.observedAt<=to);
  if(history.length>97)throw new Error('feed_frequency_invalid');
  return {observation,history,historyWindow:{from,to}};
}
export function makePacket(parsed,retrievedAt,assembledAt=retrievedAt){
  return {schemaVersion:SCHEMA_VERSION,station:STATION,retrievedAt,assembledAt,...parsed,upstream:{status:'ok',code:null}};
}
export function validPacket(packet,now=new Date()){
  if(packet?.schemaVersion!==SCHEMA_VERSION||packet.station?.id!==STATION.id||packet.station?.feedUrl!==STATION.feedUrl||!Number.isFinite(Date.parse(packet.retrievedAt))||Date.parse(packet.retrievedAt)>now.getTime()+300000||!Array.isArray(packet.history)||packet.history.length>97)return false;
  const validRow=r=>r&&Number.isFinite(Date.parse(r.observedAt))&&Date.parse(r.observedAt)<=now.getTime()+300000&&Object.entries(FIELDS).every(([k,[,min,max]])=>r[k]===null||(typeof r[k]==='number'&&Number.isFinite(r[k])&&r[k]>=min&&r[k]<=max));
  return (packet.observation===null||(validRow(packet.observation)&&['heightM','dominantPeriodS','directionFromDeg'].some(k=>packet.observation[k]!==null)))&&packet.history.every(validRow)&&packet.history.every((r,i)=>i===0||r.observedAt>packet.history[i-1].observedAt);
}
export function atRequestTime(packet,now,failedCode=null){
  const from=new Date(now.getTime()-86400000).toISOString(),to=now.toISOString();
  return {...packet,assembledAt:to,history:packet.history.filter(r=>r.observedAt>=from&&r.observedAt<=to),historyWindow:{from,to},upstream:failedCode?{status:'failed',code:failedCode}:packet.upstream};
}
