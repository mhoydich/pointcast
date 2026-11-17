(function(root){
  'use strict';
  const sports=['basketball','pickleball','tennis','badminton','volleyball','beachvolleyball','padel','squash','racquetball','netball','handball','futsal','table_tennis','pelota','paddle_tennis','platform_tennis','bocce','boules','sepak_takraw','roller_hockey','shuffleboard','korfball'];
  const excluded=new Set(['private','no','customers','members','residents','destination','delivery','agricultural','forestry','military','emergency','employees','staff','school','students','official','restricted']);
  const accessLabels={public:'Public access tagged',permissive:'Permissive access tagged',unknown:'Access not established',conditional:'Conditional access — check',permit:'Permit required — eligibility unchecked',restricted:'Restricted / excluded',closed:'Disused / excluded'};
  function access(tags){
    if(['disused','abandoned','demolished','razed','construction'].some(k=>tags[k]&&!['no','false','0'].includes(String(tags[k]).toLowerCase()))||Object.keys(tags).some(k=>/^(disused|abandoned|demolished|razed|construction):(leisure|sport)$/.test(k)&&tags[k]&&!['no','false','0'].includes(String(tags[k]).toLowerCase()))||['no','closed'].includes(tags.operational_status))return 'closed';
    const a=String(tags.access||'').trim().toLowerCase();
    if(excluded.has(a))return 'restricted';
    if(tags['access:conditional'])return 'conditional';
    if(a==='permit')return 'permit';
    if(a==='yes')return 'public';
    if(a==='permissive')return 'permissive';
    return 'unknown';
  }
  function normalize(elements){
    const seen=new Set();return (Array.isArray(elements)?elements:[]).flatMap(e=>{
      if(!e||!['node','way','relation'].includes(e.type)||!Number.isSafeInteger(e.id)||e.id<=0)return [];
      const tags=e.tags&&typeof e.tags==='object'&&!Array.isArray(e.tags)?e.tags:{},id=`${e.type}/${e.id}`,point=e.type==='node'?e:e.center;
      if(seen.has(id)||!point||!Number.isFinite(point.lon)||!Number.isFinite(point.lat)||Math.abs(point.lon)>180||Math.abs(point.lat)>90)return [];
      const ss=String(tags.sport||'').toLowerCase().split(';').map(s=>s.trim()).filter(s=>sports.includes(s));
      if(!ss.length)return [];seen.add(id);
      const a=access(tags);
      return [{id,osm_type:e.type,osm_id:e.id,name:tags.name||tags['name:en']||`${ss.map(label).join(' / ')} ${tags.leisure==='sports_centre'?'centre':tags.leisure==='sports_hall'?'hall':'court'}`,sports:ss,coordinates:[point.lon,point.lat],coordinate_precision:e.type==='node'?'mapped feature point':'mapped feature bounds centre',access:a,access_label:accessLabels[a],fee:tags.fee||'not recorded',opening_hours:tags.opening_hours||'not recorded',reservation:tags.reservation||'not recorded',surface:tags.surface||'not recorded',lit:tags.lit||'not recorded',wheelchair:tags.wheelchair||'not recorded',source_url:`https://www.openstreetmap.org/${id}`,tags}];
    });
  }
  function label(s){return ({beachvolleyball:'Beach volleyball',table_tennis:'Table tennis',multi:'Multi-sport',paddle_tennis:'Paddle tennis',platform_tennis:'Platform tennis',sepak_takraw:'Sepak takraw'})[s]||s.replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());}
  function matchesSport(r,s){if(s==='all')return true;if(s==='volleyball')return r.sports.some(x=>['volleyball','beachvolleyball'].includes(x));if(s==='other')return r.sports.some(x=>!['basketball','pickleball','tennis','volleyball','beachvolleyball','padel','badminton','netball','squash'].includes(x));return r.sports.includes(s);}
  function visible(r,includeUnknown){return ['public','permissive'].includes(r.access)||(includeUnknown&&['unknown','conditional','permit'].includes(r.access));}
  function query(lat,lon,radius){
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>85||Math.abs(lon)>180||![1000,2000,5000].includes(radius))throw new Error('Choose a valid map location and a 1, 2 or 5 km radius.');
    return `[out:json][timeout:25];nwr["leisure"~"^(pitch|sports_centre|sports_hall)$"]["sport"~"(^|;)[ ]*(${sports.join('|')})[ ]*(;|$)"](around:${radius},${lat.toFixed(5)},${lon.toFixed(5)});out body center 500;`;
  }
  const api={sports,accessLabels,access,normalize,label,matchesSport,visible,query};root.CourtData=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
