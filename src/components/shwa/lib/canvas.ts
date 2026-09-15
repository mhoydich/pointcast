export const CARD_KINDS = ['poll','slider','survey','chart','confirmation','image','research'] as const;
export type CardKind = typeof CARD_KINDS[number];
export type CanvasCard = { kind:CardKind; title:string; text:string; options:string[]; questions:string[]; points:{label:string;value:number}[]; unit:string; min:number; max:number; step:number; value:number; lowLabel:string; highLabel:string; prompt:string; basis:'conversation'|'illustrative' };
export type CanvasItem = CanvasCard & {id:string;createdAt:number;sample?:boolean;imageUrl?:string;workState?:'pending'|'complete'|'error';workMessage?:string;researchResult?:ResearchResult;researchedAt?:number};
export type ResearchPart = {text:string;citations:{start:number;end:number;url:string;title:string}[]};
export type ResearchResult = {parts:ResearchPart[];estimatedCost:number};
export type ResearchSource = {url:string;title:string;domain:string;excerpt:string};
const string={type:'string'};
export const CARD_SCHEMA = {type:'object',additionalProperties:false,properties:{
 kind:{type:'string',enum:CARD_KINDS},title:string,text:string,
 options:{type:'array',items:string,maxItems:5},questions:{type:'array',items:string,maxItems:3},
 points:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{label:string,value:{type:'number'}},required:['label','value']}},
 unit:string,min:{type:'number'},max:{type:'number'},step:{type:'number'},value:{type:'number'},lowLabel:string,highLabel:string,prompt:string,basis:{type:'string',enum:['conversation','illustrative']}
},required:['kind','title','text','options','questions','points','unit','min','max','step','value','lowLabel','highLabel','prompt','basis']};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const bounded=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
export function parseCard(v:unknown):CanvasCard {
 if(!record(v)||!CARD_KINDS.includes(v.kind as CardKind)||!bounded(v.title,140)||!v.title.trim()||!bounded(v.text,1200)||!bounded(v.prompt,1600)||!bounded(v.unit,40)||!bounded(v.lowLabel,80)||!bounded(v.highLabel,80)||!['conversation','illustrative'].includes(String(v.basis)))throw Error('card_invalid');
 for(const [key,max] of [['options',5],['questions',3]] as const)if(!Array.isArray(v[key])||v[key].length>max||v[key].some(x=>!bounded(x,300)))throw Error('card_invalid');
 if(!Array.isArray(v.points)||v.points.length>8||v.points.some(x=>!record(x)||!bounded(x.label,100)||typeof x.value!=='number'||!Number.isFinite(x.value)||Math.abs(x.value)>1e9))throw Error('card_invalid');
 if(['min','max','step','value'].some(k=>typeof v[k]!=='number'||!Number.isFinite(v[k])||Math.abs(v[k] as number)>1e9))throw Error('card_invalid');
 const c=v as unknown as CanvasCard;
 if(c.kind==='slider'&&(c.max<=c.min||c.step<=0||c.step>c.max-c.min||c.value<c.min||c.value>c.max))throw Error('slider_invalid');
 if(c.kind==='poll'&&(c.options.length<2||new Set(c.options).size!==c.options.length))throw Error('poll_invalid');
 if(c.kind==='survey'&&!c.questions.length)throw Error('survey_invalid');
 if(c.kind==='chart'&&c.points.length<2)throw Error('chart_invalid');
 if((c.kind==='image'||c.kind==='research')&&!c.prompt.trim())throw Error('prompt_missing');
 // Copy only declared fields; arbitrary model fields cannot become renderer props.
 return {kind:c.kind,title:c.title,text:c.text,options:[...c.options],questions:[...c.questions],points:c.points.map(p=>({label:p.label,value:p.value})),unit:c.unit,min:c.min,max:c.max,step:c.step,value:c.value,lowLabel:c.lowLabel,highLabel:c.highLabel,prompt:c.prompt,basis:c.basis};
}
export function appendCard(items:CanvasItem[],card:CanvasCard,now=Date.now()):CanvasItem[]{
 if(items.some(i=>i.kind===card.kind&&i.title.trim().toLowerCase()===card.title.trim().toLowerCase()))return items;
 return [...items,{...card,id:`card-${now}-${items.length}`,createdAt:now}].slice(-24);
}
export function safeSource(raw:string):string|null {try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
/** Previews use only returned citations and their associated findings; no metadata fetch. */
export function researchSources(result:ResearchResult):ResearchSource[]{
 const sources=new Map<string,ResearchSource>();
 for(const part of result.parts)for(const citation of part.citations){
  const url=safeSource(citation.url);
  if(!url||sources.has(url)||!Number.isInteger(citation.start)||!Number.isInteger(citation.end)||citation.start<0||citation.end<=citation.start||citation.end>part.text.length)continue;
  const before=part.text.slice(0,citation.start).trim();
  const paragraph=before.split(/\n\s*\n/).at(-1)||part.text.slice(citation.start,citation.end);
  const finding=paragraph.replace(/^\s*(?:[-*#]+|\d+\.)\s*/, '').replace(/\s+/g,' ').trim();
  const excerpt=finding.length>240?'…'+finding.slice(-239):finding;
  const domain=new URL(url).hostname.replace(/^www\./,'');
  sources.set(url,{url,title:citation.title.trim().slice(0,300)||domain,domain,excerpt});
  if(sources.size>=8)return [...sources.values()];
 }
 return [...sources.values()];
}
export function sampleCards():CanvasItem[]{
 const base={text:'',options:[],questions:[],points:[],unit:'',min:0,max:100,step:1,value:50,lowLabel:'',highLabel:'',prompt:'',basis:'illustrative' as const};
 const cards:CanvasCard[]=[
 {...base,kind:'poll',title:'What kind of place are we making?',text:'Imagine a tiny neighborhood listening room. Choose its first direction.',options:['A quiet listening bar','A playful creative club','A sunny community radio room']},
 {...base,kind:'slider',title:'Find the energy',text:'Where should the room sit? Move the dial, then send your choice to the canvas.',lowLabel:'Unhurried',highLabel:'Electric',value:35},
 {...base,kind:'chart',title:'A possible opening-night mix',text:'An invented starting point to discuss, not attendance or survey results.',points:[{label:'Music',value:45},{label:'Making',value:30},{label:'Conversation',value:25}],unit:'%'},
 {...base,kind:'survey',title:'Three things to discover',text:'A small design brief, made together.',questions:['What should someone feel when they walk in?','What is the one thing they can do here?','What would make them come back?']},
 {...base,kind:'confirmation',title:'Is this the direction?',text:'A small, welcoming place where listening can turn into making. Confirming only records your preference in this page.'},
 {...base,kind:'image',title:'Picture the listening room',text:'A visual invitation for the idea.',prompt:'A warm Southern California community listening room, midcentury modern flat poster art, terracotta, olive, cream, playful but refined, no text'},
 {...base,kind:'research',title:'What makes a listening room work?',text:'Look for useful precedents and primary sources.',prompt:'Find three documented examples of community listening rooms or listening bars, with sources explaining their space or programming.'}
 ];return cards.map((c,i)=>({...c,id:`sample-${i}`,sample:true,createdAt:0}));
}
