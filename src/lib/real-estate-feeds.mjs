export const FHFA_URL = 'https://www.fhfa.gov/hpi/download/quarterly_datasets/hpi_at_metro.csv';
export const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
export const FEED_SOURCES = [
  {id:'feed-fhfa',title:'FHFA House Price Index datasets',url:'https://www.fhfa.gov/data/hpi/datasets',publisher:'Federal Housing Finance Agency',checkedAt:'2026-10-03',cadence:'Quarterly, revised'},
  {id:'feed-usgs',title:'USGS GeoJSON summary feeds',url:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php',publisher:'U.S. Geological Survey',checkedAt:'2026-10-03',cadence:'Publisher updates every minute'},
  {id:'feed-usgs-rights',title:'USGS copyrights and credits',url:'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',publisher:'U.S. Geological Survey',checkedAt:'2026-10-03',cadence:'Policy'},
  {id:'feed-hud',title:'HUD Fair Market Rent API access',url:'https://www.huduser.gov/portal/dataset/fmr-api.html',publisher:'HUD USER',checkedAt:'2026-10-03',cadence:'Annual'},
  {id:'feed-census',title:'Census Data API guidance',url:'https://www.census.gov/data/developers/guidance/api-user-guide.html',publisher:'U.S. Census Bureau',checkedAt:'2026-10-03',cadence:'Dataset dependent'},
];
export const feedInventory = [
  {id:'fhfa',name:'LA metro house-price index',cadence:'Quarterly / delayed',status:'Working server adapter',access:'Keyless official CSV; tested HTTP 200 on 3 Oct 2026.',cors:'No CORS allow-origin header observed; same-origin Pages adapter is required.',licensing:'Federal statistical data; retain FHFA attribution and release/vintage. No listing imagery or MLS data.',limits:'No SLA or numerical rate limit asserted. Explicit refresh only; derived-response edge cache up to one hour; fixed URL; 6 MB cap; 12s timeout; no persistent schedule.',meaning:'All-transactions, not seasonally adjusted index; includes purchase and refinance appraisal data. LA metro division is much larger than this 25-mile study. Not a price quote, asking rent, cap rate or yield.',sourceIds:['feed-fhfa']},
  {id:'usgs',name:'Earthquake context near the circle',cadence:'Publisher every minute / near real time',status:'Working browser + server adapter',access:'Keyless official GeoJSON; tested HTTP 200.',cors:'Wildcard CORS observed; publisher max-age 60 seconds.',licensing:'USGS-produced data are public domain; credit USGS. Third-party media can have different terms.',limits:'Explicit page-load-free refresh only; derived-response edge cache up to 60 seconds. Fixed one-week feed; 4 MB cap; 12s timeout; no alert service. Events may be revised.',meaning:'Events with epicenters within 25 miles during the rolling past week. Not a probability, parcel hazard rating, damage determination or statement that an area is safe.',sourceIds:['feed-usgs','feed-usgs-rights']},
  {id:'census',name:'ACS rents, housing and demographics',cadence:'Annual releases / multiyear estimates',status:'Access blocked; no live adapter',access:'Keyless API probe redirected to missing_key.html on 3 Oct 2026. Requires separate authorized key setup.',cors:'Wildcard CORS was present on the response; missing authentication still blocks data.',licensing:'Federal aggregate statistics; retain vintage, geography and margins of error.',limits:'No key created. No values copied from the rejected API response. API policy and request limits must be reviewed before enabling.',meaning:'Median gross rent is occupied-unit survey context, not current asking rent or achievable investment cash flow.',sourceIds:['feed-census']},
  {id:'hud',name:'HUD Fair Market Rents',cadence:'Annual program benchmark',status:'Token required; source link only',access:'Official API requires account/token. No token created or stored.',cors:'Not tested with credentials.',licensing:'Public program statistics; check API terms before automated reuse.',limits:'No credential-dependent adapter in v1.',meaning:'Program rent benchmark, not a property appraisal or listing price.',sourceIds:['feed-hud']},
  {id:'listings',name:'For-sale listings, leases and closed comps',cadence:'Provider dependent',status:'Not connected',access:'Needs a licensed broker/provider agreement and a field-level reuse policy.',cors:'Provider dependent.',licensing:'No MLS scraping; no assumed permission to republish portal listings or photographs.',limits:'No properties, rents, availability, broker feeds or buy buttons fabricated.',meaning:'v1 compares study anchors and official evidence; it is not an exhaustive property database.',sourceIds:[]},
];
export function parseFhfaCsv(text, retrievedAt = new Date().toISOString()) {
  const records = [];
  for (const line of text.split(/\r?\n/)) {
    if(!line.includes('",31084,'))continue;
    const m = line.match(/^"([^\"]+)",31084,(\d{4}),([1-4]),([^,]+),/);
    if(!m)throw new Error('FHFA format changed');
    if(m[4]==='-')continue;
    if(!Number.isFinite(Number(m[4]))||Number(m[4])<=0)throw new Error('FHFA index invalid');
    records.push({market:m[1],code:'31084',year:Number(m[2]),quarter:Number(m[3]),index:Number(m[4])});
  }
  records.sort((a,b)=>a.year-b.year||a.quarter-b.quarter);
  if (!records.length) throw new Error('FHFA series missing or changed');
  const latest = records.at(-1), previous = records.find(x=>x.year*4+x.quarter===latest.year*4+latest.quarter-1), priorYear=records.find(x=>x.year===latest.year-1&&x.quarter===latest.quarter);
  return {kind:'fhfa',retrievedAt,observationPeriod:`${latest.year} Q${latest.quarter}`,series:'All-transactions HPI / NSA / 1995 Q1 = 100',geography:'Los Angeles–Long Beach–Glendale metro division (31084), beyond the 25-mile circle',latest,quarterChangePct:previous?(latest.index/previous.index-1)*100:null,yearChangePct:priorYear?(latest.index/priorYear.index-1)*100:null,records:records.slice(-16),sourceUrl:FHFA_URL,sourceIds:['feed-fhfa'],limitation:feedInventory[0].meaning};
}
export function normalizeUsgs(payload, center, distance, retrievedAt = new Date().toISOString()) {
  if (!payload || !Array.isArray(payload.features) || !Number.isFinite(payload.metadata?.generated)) throw new Error('USGS format changed');
  if(payload.features.some(f=>!f||typeof f.properties?.type!=='string'||!Number.isFinite(f.properties?.time)||f.geometry?.type!=='Point'||!Array.isArray(f.geometry.coordinates)||!Number.isFinite(f.geometry.coordinates[0])||!Number.isFinite(f.geometry.coordinates[1])||Math.abs(f.geometry.coordinates[0])>180||Math.abs(f.geometry.coordinates[1])>90))throw new Error('USGS event schema changed');
  const events=payload.features.filter(f=>f?.properties?.type==='earthquake'&&f.geometry?.type==='Point'&&Array.isArray(f.geometry.coordinates)).map(f=>{
    const [lon,lat,depthKm]=f.geometry.coordinates, p=f.properties;
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(p?.time)) return null;
    const miles=distance(center.lat,center.lon,lat,lon);
    if(miles>25) return null;
    const url=typeof p.url==='string'&&p.url.startsWith('https://earthquake.usgs.gov/')?p.url:null;
    return {id:String(f.id).slice(0,80),lat,lon,depthKm,magnitude:Number.isFinite(p.mag)?p.mag:null,place:String(p.place||'Location pending').slice(0,200),occurredAt:new Date(p.time).toISOString(),updatedAt:Number.isFinite(p.updated)?new Date(p.updated).toISOString():null,distanceMiles:Math.round(miles*10)/10,url};
  }).filter(Boolean).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
  return {kind:'usgs',retrievedAt,generatedAt:new Date(payload.metadata.generated).toISOString(),window:'Rolling past week at publisher generation time',events,sourceUrl:USGS_URL,sourceIds:['feed-usgs'],limitation:feedInventory[1].meaning};
}
