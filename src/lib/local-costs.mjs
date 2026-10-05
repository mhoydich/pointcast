import data from '../data/local-costs.json' with { type: 'json' };
import { CENTER, miles } from './local-signals.mjs';
export { data as COST_DATA };
export function validateObservation(value, now = Date.now()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an observation object');
  const item = data.items.find(i=>i.id===value.itemId);
  if (!item) throw new Error('Unknown basket item');
  if (typeof value.price !== 'number' || !Number.isFinite(value.price) || value.price < 0 || value.price > 100000) throw new Error('Price must be a nonnegative USD number');
  if (value.unit !== item.unit) throw new Error(`Use the basket unit: ${item.unit}`);
  const text = key => { const v=value[key]; if(typeof v!=='string'||!v.trim()||v.length>500) throw new Error(`Supply ${key} (up to 500 characters)`); return v.trim(); };
  const observedAt=text('observedAt');
  const time = Date.parse(observedAt);
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(observedAt) || !Number.isFinite(time) || time>now+300000 || time<now-90*86400000) throw new Error('Use a timestamp with timezone within the past 90 days');
  const sourceUrl=text('sourceUrl');
  let u; try {u=new URL(sourceUrl);} catch {throw new Error('Supply an HTTPS evidence URL');}
  if(u.protocol!=='https:' || u.username || u.password) throw new Error('Supply an HTTPS evidence URL without credentials');
  if(!Number.isFinite(value.lat)||!Number.isFinite(value.lng)||Math.abs(value.lat)>90||Math.abs(value.lng)>180||miles(value.lat,value.lng)>CENTER.radiusMiles) throw new Error('Seller location must be within 25 miles of El Segundo');
  if(!['included','excluded','unknown'].includes(value.tax)) throw new Error('Tax must be included, excluded or unknown');
  return {itemId:item.id,price:value.price,unit:item.unit,currency:'USD',observedAt:new Date(time).toISOString(),sourceUrl,seller:text('seller'),location:text('location'),lat:value.lat,lng:value.lng,product:text('product'),conditions:text('conditions'),tax:value.tax,contributor:text('contributor'),contributorIdentity:'self-reported',status:'pending-review'};
}
export function basketSnapshot(now = Date.now()) {
  const rows = data.items.map(item=>{
    const observations=data.observations.filter(o=>o.itemId===item.id&&o.status==='reviewed'&&miles(o.lat,o.lng)<=25).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
    const latest=observations[0]??null;
    const previous=latest ? observations.slice(1).find(o=>o.seller===latest.seller&&o.product===latest.product&&o.conditions===latest.conditions&&o.tax===latest.tax&&o.unit===latest.unit&&o.price!==undefined)??null : null;
    return {...item,latest,previous,delta:latest&&previous?latest.price-previous.price:null,stale:latest?now-Date.parse(latest.observedAt)>7*86400000:false,history:observations};
  });
  const required=rows.filter(i=>i.quantity>0),priced=required.filter(i=>i.latest&&!i.stale);
  return {schema:'pointcast.local-costs/v1',center:CENTER,startedAt:data.startedAt,currency:'USD',items:rows,context:data.context,basket:{priced:priced.length,required:required.length,complete:priced.length===required.length,subtotal:priced.reduce((n,i)=>n+i.quantity*i.latest.price,0),note:'Illustrative quantities, not a CPI or household budget. Missing and stale prices are excluded. Different tax treatments and fixed utility charges prevent an all-in total.'},contribute:{endpoint:'/api/local-costs',method:'POST',status:'pending-review',identity:'Self-reported, including visiting agents. No automatic endorsement or promotion.',example:{itemId:'coffee-drip',price:3.5,unit:'cup',observedAt:new Date(now).toISOString(),sourceUrl:'https://example.com/menu',seller:'Replace with real local seller',location:'El Segundo, CA',lat:CENTER.lat,lng:CENTER.lng,product:'12 oz drip coffee',conditions:'Regular menu price; no membership, delivery or sale',tax:'excluded',contributor:'Your name or agent handle'},review:'Director reads /api/local-costs?action=queue while signed in; reviews evidence and commits accepted records to src/data/local-costs.json through a PR.'},jobs:rows.filter(i=>!i.latest||i.stale).map(i=>({itemId:i.id,title:`Find a dated ${i.name.toLowerCase()} price`,unit:i.unit,spec:i.spec,brief:'Choose a seller within 25 miles. Read first-hand evidence. Record product, price, tax and offer terms with a timestamp and source URL. Never guess. Submit a candidate; reviewed observations alone enter the basket.'}))};
}
