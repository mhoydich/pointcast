import {LOCATION,TOPICS,localDay,upstream,metric,usnoMetrics,swpcMetrics,tideMetrics,buoyMetrics,airMetrics,phaseMetrics} from './data.mjs';
export const SOURCES={
 usno:{label:'US Naval Observatory — Sun and Moon one-day calculations',documentation:'https://aa.usno.navy.mil/data/api',kind:'astronomical_calculation',authentication:'none'},
 'usno-phases':{label:'US Naval Observatory — primary lunar phases',documentation:'https://aa.usno.navy.mil/data/api',kind:'astronomical_calculation',authentication:'none'},
 'swpc-wind':{label:'NOAA SWPC — real-time solar wind',documentation:'https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json',kind:'observation',authentication:'none'},
 'swpc-kp':{label:'NOAA SWPC — estimated planetary Kp',documentation:'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',kind:'estimate',authentication:'none'},
 'noaa-tides':{label:'NOAA CO-OPS — Santa Monica 9410840',documentation:'https://api.tidesandcurrents.noaa.gov/api/prod/',kind:'observation',authentication:'none'},
 ndbc:{label:'NOAA NDBC / CDIP — buoy 46221',documentation:'https://www.ndbc.noaa.gov/station_page.php?station=46221',kind:'observation',authentication:'none'},
 'nws-klax':{label:'National Weather Service — KLAX meteorology',documentation:'https://www.weather.gov/documentation/services-web-api',kind:'observation',authentication:'none'},
 airnow:{label:'AirNow — official AQI, external link only',documentation:'https://www.airnow.gov/',kind:'external_reference',authentication:'API key required; not integrated'}
};
const specs={moon:[['illumination','Illumination at local noon','%','astronomical_calculation','usno'],['rise','Moonrise','ISO8601','astronomical_calculation','usno'],['set','Moonset','ISO8601','astronomical_calculation','usno'],['phase','Daily lunar phase',null,'astronomical_calculation','usno'],['transit','Moon upper transit','ISO8601','astronomical_calculation','usno'],['next-phase','Next primary phase','ISO8601','astronomical_calculation','usno-phases']],sun:[['rise','Sunrise','ISO8601','astronomical_calculation','usno'],['set','Sunset','ISO8601','astronomical_calculation','usno'],['daylight','Calculated daylight','minutes','astronomical_calculation','usno'],['solar-wind','Solar wind speed','km/s','observation','swpc-wind'],['kp','Estimated planetary Kp','0–9 index','estimate','swpc-kp']],pacific:[['water-level','Measured water level','m above MLLW','observation','noaa-tides'],['wave-height','Significant wave height','m','observation','ndbc'],['water-temperature','Offshore water temperature','°C','observation','ndbc'],['wave-period','Dominant wave period','s','observation','ndbc']],air:[['temperature','Air temperature','°C','observation','nws-klax'],['wind','Wind speed','km/h','observation','nws-klax'],['humidity','Relative humidity','%','observation','nws-klax'],['aqi','Air quality index',null,'external_reference','airnow']]};
export async function buildReport(topic,fetcher=fetch,now=new Date()){
 if(!TOPICS.includes(topic))throw new Error('unknown_topic');
 const day=localDay(now),requests=[],errors=[],sourceRecords={};
 let metrics=specs[topic].map(([id,label,unit,kind,source])=>metric({id,label,unit,kind,source,note:'The upstream measurement or calculation is unavailable.'},now));
 const run=(source,url,parse,isText=false)=>requests.push((async()=>{sourceRecords[source]={...SOURCES[source],request_url:url,retrieved_at:null,status:'unavailable'};try{const raw=await upstream(url,fetcher,isText);const parsed=parse(raw);const replacement=new Map(parsed.map(m=>[m.id,m]));metrics=metrics.map(m=>replacement.get(m.id)??m);sourceRecords[source].retrieved_at=now.toISOString();sourceRecords[source].status=parsed.some(m=>m.status==='available')?'available':parsed.some(m=>m.status==='stale')?'stale':'unavailable';}catch(e){errors.push({source,code:e?.message?.startsWith('upstream_http_')?e.message:'upstream_unavailable_or_invalid'});}})());
 if(topic==='moon'||topic==='sun'){
 const url=new URL('https://aa.usno.navy.mil/api/rstt/oneday');for(const [k,v] of Object.entries({date:day,coords:`${LOCATION.latitude},${LOCATION.longitude}`,tz:'-8',dst:'true'}))url.searchParams.set(k,v);
 run('usno',url.toString(),raw=>usnoMetrics(raw,topic,day,now));
 }
 if(topic==='moon')run('usno-phases',`https://aa.usno.navy.mil/api/moon/phases/date?date=${day}&nump=4`,raw=>phaseMetrics(raw,now));
 if(topic==='sun'){
 run('swpc-wind',SOURCES['swpc-wind'].documentation,raw=>swpcMetrics(raw,[],now).filter(m=>m.id==='solar-wind'));
 run('swpc-kp',SOURCES['swpc-kp'].documentation,raw=>swpcMetrics([],raw,now).filter(m=>m.id==='kp'));
 }
 if(topic==='pacific'){
 const url=new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');for(const [k,v]of Object.entries({product:'water_level',date:'recent',station:'9410840',datum:'MLLW',time_zone:'gmt',units:'metric',format:'json',application:'PointCastObservatory'}))url.searchParams.set(k,v);
 run('noaa-tides',url.toString(),raw=>tideMetrics(raw,now));
 run('ndbc','https://www.ndbc.noaa.gov/data/realtime2/46221.txt',raw=>buoyMetrics(raw,now),true);
 }
 if(topic==='air'){
 run('nws-klax','https://api.weather.gov/stations/KLAX/observations/latest',raw=>airMetrics(raw,now));
 sourceRecords.airnow={...SOURCES.airnow,status:'not_integrated',request_url:null,retrieved_at:null};
 metrics=metrics.map(m=>m.id==='aqi'?{...m,location:'El Segundo — no verified current AQI source connected',note:'Open the official AirNow map for current reporting areas. No AQI has been inferred from airport weather or historic monitors.'}:m);
 }
 await Promise.all(requests);
 // In partial failure cases, source labels remain explicit instead of inheriting town coordinates.
 metrics=metrics.map(m=>m.source==='ndbc'?{...m,location:'Offshore Santa Monica Bay buoy 46221 / CDIP 028'}:m.source==='noaa-tides'?{...m,location:'Santa Monica tide station 9410840'}:m.source==='nws-klax'?{...m,location:'KLAX airport weather station — not an air-quality monitor'}:m);
 const count=metrics.filter(m=>m.status==='available').length;
 return {schema_version:'pointcast.observatory.report.v1',topic,location:LOCATION,local_date:day,generated_at:now.toISOString(),status:count===metrics.length?'available':count?'partial':metrics.some(m=>m.status==='stale')?'stale':'unavailable',metrics,sources:sourceRecords,errors,notes:['generated_at is the report assembly time, not a source observation time.','Data are fetched on demand, with no more than five minutes of public caching.','Stale source values remain labeled stale; absent values remain null.','This report is informational and is not a navigation, surf, health, or emergency alert service.']};
}
export async function handle(request,topic,fetcher=fetch,now=new Date()){
 const headers={'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS'}});
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers:{...headers,Allow:'GET, HEAD, OPTIONS'}});
 if(!TOPICS.includes(topic))return new Response(JSON.stringify({error:'unknown_topic'}),{status:404,headers});
 const payload=await buildReport(topic,fetcher,now);
 headers['Cache-Control']=payload.status==='unavailable'?'public, max-age=30':'public, max-age=300';
 return new Response(request.method==='HEAD'?null:JSON.stringify(payload,null,2),{headers});
}
