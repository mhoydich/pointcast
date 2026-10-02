import atlas from '../data/weather-atlas.json';
export const GET = () => new Response(JSON.stringify({...atlas,kind:'Historical climate and illustrative seasonal living atlas',notAforecast:true,affiliation:'Independent PointCast editorial project; no NOAA, NWS or Nouns partnership'},null,2),{headers:{'Content-Type':'application/json; charset=utf-8'}});
