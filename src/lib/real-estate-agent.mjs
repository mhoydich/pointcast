import {study,queryStudy} from './real-estate-study.mjs';
import {INPUT_FIELDS,compareScenarios} from './real-estate-scenario.mjs';
import {propertyTypes} from './real-estate-local.mjs';
const numberProperties=Object.fromEntries(INPUT_FIELDS.map(f=>[f.key,{type:f.key==='loanYears'?'integer':'number',minimum:f.min,maximum:f.max,default:f.defaultValue,description:`${f.label} (${f.unit}). ${f.description}`} ]));
export const REAL_ESTATE_TOOLS=[
  {name:'real_estate_study',description:'Read or search Groundwork’s dated educational real-estate research: 18 local 25-mile El Segundo anchors, eight global markets, sources and read-only API methods. No active listings or investment recommendations.',inputSchema:{type:'object',properties:{q:{type:'string',maxLength:120},region:{enum:['all','local','global']},type:{enum:['all',...propertyTypes]}},additionalProperties:false}},
  {name:'real_estate_scenario',description:'Calculate five hypothetical USD years in adverse/base/upside cases. Editable invented capital, rent, debt and costs; returns acquisition gates, monthly-amortized debt, cash, reserves, gaps and equity. No transaction, financing approval, account or real user budget.',inputSchema:{type:'object',properties:{inputs:{type:'object',properties:numberProperties,additionalProperties:false}},additionalProperties:false}},
  {name:'real_estate_feed',description:'Read fixed public FHFA quarterly LA metro HPI or USGS earthquake context, with original observation/generation/retrieval timestamps, bounded edge caching and dated fallback. No listing, price quote or parcel risk inference.',inputSchema:{type:'object',properties:{source:{enum:['fhfa','usgs']}},required:['source'],additionalProperties:false}},
];
function objectArgs(args,allowed){if(!args||typeof args!=='object'||Array.isArray(args))throw new Error('Arguments must be an object.');for(const key of Object.keys(args))if(!allowed.includes(key))throw new Error(`Unknown argument: ${key}`);}
export async function runRealEstateTool(name,args={},readFeed){
  if(name==='real_estate_study'){objectArgs(args,['q','region','type']);if(args.q!==undefined&&(typeof args.q!=='string'||args.q.length>120))throw new Error('Invalid search.');if(args.region!==undefined&&!['all','local','global'].includes(args.region))throw new Error('Invalid region.');if(args.type!==undefined&&!['all',...propertyTypes].includes(args.type))throw new Error('Invalid property type.');return Object.keys(args).length?queryStudy(args):study;}
  if(name==='real_estate_scenario'){objectArgs(args,['inputs']);return {kind:'hypothetical-model',readOnly:true,results:compareScenarios(args.inputs===undefined?{}:args.inputs),limits:study.limits};}
  if(name==='real_estate_feed'){objectArgs(args,['source']);if(!['fhfa','usgs'].includes(args.source))throw new Error('Choose source fhfa or usgs.');if(typeof readFeed!=='function')throw new Error('Feed adapter unavailable in this runtime.');return readFeed(args.source);}
  throw new Error('Unknown real-estate tool.');
}
