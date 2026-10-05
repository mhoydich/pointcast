export const CENTER = { name: 'El Segundo · 90245', lat: 33.9192, lng: -118.4165, radiusMiles: 25 };
export const SOURCES = [
  { id: 'power', name: 'Power', source: 'Southern California Edison', url: 'https://www.sce.com/outages-safety/outage-center/check-outage-status', coverage: 'SCE outage locations within 25 miles; excludes LADWP and other utilities' },
  { id: 'weather', name: 'Weather', source: 'National Weather Service', url: 'https://www.weather.gov/lox/', coverage: 'Active alerts covering El Segundo; not the entire radius' },
  { id: 'quake', name: 'Earthquakes', source: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/map/', coverage: 'Events within 25 miles in the past 24 hours; a quake is not proof of an outage' },
  { id: 'internet', name: 'Internet & mobile', source: 'Downdetector', url: 'https://downdetector.com/', coverage: 'Manual check; provider reports are not verified local outages' },
  { id: 'water', name: 'Water', source: 'El Segundo Public Works', url: 'https://www.elsegundo.org/government/departments/public-works', coverage: 'Manual check; no live feed connected' },
  { id: 'transit', name: 'Transit', source: 'LA Metro alerts', url: 'https://www.metro.net/service/advisories/', coverage: 'Manual check; no live feed connected' },
  { id: 'roads', name: 'Roads', source: 'Caltrans QuickMap', url: 'https://quickmap.dot.ca.gov/', coverage: 'Manual check; no live feed connected' },
  { id: 'gas', name: 'Gas service', source: 'SoCalGas', url: 'https://www.socalgas.com/', coverage: 'Manual check; no live feed connected' },
];
export function miles(lat, lng) {
  const r = Math.PI / 180;
  const a = Math.sin((lat - CENTER.lat) * r / 2) ** 2 + Math.cos(lat * r) * Math.cos(CENTER.lat * r) * Math.sin((lng - CENTER.lng) * r / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
const clean = (s, fallback = 'Not supplied') => typeof s === 'string' && s.trim() && s !== 'Not Available' ? s.trim().slice(0, 2500) : fallback;
export function normalizePower(data) {
  if (data.error || !Array.isArray(data.features) || data.exceededTransferLimit) throw new Error('Incomplete utility response');
  const seen = new Set();
  return data.features.flatMap(f => {
    const a = f.attributes ?? {}, g = f.geometry ?? {};
    if (a.Status !== 'ACTIVE' || !Number.isFinite(g.x) || !Number.isFinite(g.y) || miles(g.y, g.x) > 25) return [];
    const id = String(a.IncidentId ?? a.OBJECTID);
    if (seen.has(id)) return []; seen.add(id);
    return [{ id, kind: 'power', title: `${clean(a.CityName, 'Nearby')} · ${clean(a.ZipcodeName, 'ZIP unknown')}`, lat: g.y, lng: g.x, miles: miles(g.y, g.x), customers: Number.isFinite(a.NoOfAffectedCust_Inci) ? a.NoOfAffectedCust_Inci : null, zip: a.ZipcodeName, cause: clean(a.MemoCauseCdDesc), detail: clean(a.CrewStatusCdDesc), restoration: clean(a.ERT_LOC ?? a.ERT, 'No estimate supplied'), sourceUpdatedAt: clean(a.PublishDate, null), startedAt: Number.isFinite(a.OutageStartDateTime) ? new Date(a.OutageStartDateTime).toISOString() : null, url: SOURCES[0].url }];
  }).sort((a,b) => a.miles - b.miles);
}
export async function collectSignals(fetcher = fetch, now = new Date()) {
  const checkedAt = now.toISOString();
  const power = new URL('https://sce-outage-ags.esriemcs.com/arcgis/rest/services/43/outage/MapServer/0/query');
  power.search = new URLSearchParams({ f:'json', where:"Status='ACTIVE'", geometry:`${CENTER.lng},${CENTER.lat}`, geometryType:'esriGeometryPoint', inSR:'4326', distance:'25', units:'esriSRUnit_StatuteMile', outFields:'*', outSR:'4326', returnGeometry:'true' }).toString();
  const quake = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
  quake.search = new URLSearchParams({format:'geojson',latitude:String(CENTER.lat),longitude:String(CENTER.lng),maxradiuskm:String(25*1.609344),starttime:new Date(now.getTime()-86400000).toISOString(),endtime:checkedAt,orderby:'time'}).toString();
  const urls = [power.href,`https://api.weather.gov/alerts/active?point=${CENTER.lat},${CENTER.lng}`,quake.href];
  const feeds = await Promise.all(SOURCES.slice(0,3).map(async (source,i) => {
    try {
      const r = await fetcher(urls[i], { headers:{'User-Agent':'PointCast Local Signals (https://pointcast.xyz/outages)','Accept':'application/json'},signal:AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error(`Source returned ${r.status}`);
      const d = await r.json();
      if (!Array.isArray(d.features)) throw new Error('Invalid source response');
      const items = i === 0 ? normalizePower(d) : i === 1 ? d.features.map(f=>({id:f.id,kind:'weather',title:clean(f.properties?.event),detail:clean(f.properties?.headline),cause:clean(f.properties?.severity),startedAt:f.properties?.onset,expiresAt:f.properties?.expires,url:'https://www.weather.gov/lox/'})) : d.features.filter(f=>miles(f.geometry?.coordinates?.[1],f.geometry?.coordinates?.[0])<=25).map(f=>({id:f.id,kind:'quake',title:`M ${f.properties.mag ?? '?'} · ${clean(f.properties.place)}`,lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],miles:miles(f.geometry.coordinates[1],f.geometry.coordinates[0]),detail:'Earthquake recorded. Service disruption not confirmed.',startedAt:new Date(f.properties.time).toISOString(),url: /^https:\/\/earthquake\.usgs\.gov\//.test(f.properties.url) ? f.properties.url : SOURCES[2].url}));
      return {...source,status:'available',checkedAt,items};
    } catch { return {...source,status:'unavailable',checkedAt,items:[],error:'Live source unavailable. Check the official source.'}; }
  }));
  return {schema:'pointcast.local-signals/v1',center:CENTER,checkedAt,refreshSeconds:120,feeds:[...feeds,...SOURCES.slice(3).map(s=>({...s,status:'manual',items:[]}))]};
}
