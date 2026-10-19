// Nouns Money Workshop v1. Original Nouns rendering derived from the pinned
// nouns-money renderer / nounsDAO SVG builder. GPL-3.0; see assets license.
export const VERSION = 'nmw-design/1';
export const COMMIT = '2213eea1c15f331f786784c2621d53bdecf907e2';
export const ASSET_SHA = 'a03f22b7838b35fdf0332617c9b8e2b032eb26cf1632afbefb200fec64c4bc20';
export const SEED_FIELDS = ['background', 'body', 'accessory', 'head', 'glasses'];
export const LIMITS = [2,30,143,254,23];
export const THEMES = {
  pacific: {name:'Pacific Social Club',short:'Pacific',eyebrow:'POSTCARDS FROM A POSSIBLE WORLD',lines:['A LITTLE','LOCAL','WONDER.'],back:['GOOD IDEAS','TRAVEL LIGHT.'],motto:'A little sun. A little time. A little room to play.',mark:'P',place:'COASTAL STUDY'},
  workshop: {name:'Factory of Ideas',short:'Workshop',eyebrow:'AN EXPERIMENT IN MAKING THINGS',lines:['MADE OF','BRIGHT','IDEAS.'],back:['MAKE SOMETHING','WORTH KEEPING.'],motto:'For the curious hands that turn what if into what next.',mark:'W',place:'INDUSTRIAL STUDY'},
  'el-segundo': {name:'El Segundo Field Notes',short:'El Segundo',eyebrow:'A SMALL SCHOOL OF EVERYDAY THINGS',lines:['STAY','A LITTLE','CURIOUS.'],back:['THE WORLD IS','YOUR CLASSROOM.'],motto:'An invitation to notice one more thing today.',mark:'E',place:'NEIGHBORHOOD STUDY'}
};
export const PALETTES = [
  {name:'Park green',paper:'#f4ecd8',ink:'#3c3024',accent:'#345b46'},
  {name:'Oxblood',paper:'#f3e5d5',ink:'#612f37',accent:'#ac5e45'},
  {name:'Blueprint',paper:'#e9eade',ink:'#274c60',accent:'#bb602f'}
];
export const CAST = [
  {name:'Bonsai',seed:[0,1,70,19,15]}, {name:'Sunset',seed:[0,28,57,201,3]},
  {name:'Flower',seed:[0,14,70,87,3]}, {name:'CRT',seed:[0,1,75,64,15]},
  {name:'Factory',seed:[0,8,70,79,13]}, {name:'Pencil',seed:[0,25,33,149,3]},
  {name:'Sailboat',seed:[0,3,70,182,15]}, {name:'Book',seed:[0,6,70,68,11]},
  {name:'Moon',seed:[0,2,57,128,3]}
].map(x=>({...x,seed:Object.fromEntries(SEED_FIELDS.map((k,i)=>[k,x.seed[i]]))}));
export const DEFAULT = {
  schemaVersion:VERSION,theme:'pacific',
  asset:{collection:'nouns-cc0-local-seed',sourceCommit:COMMIT,sourceSha256:ASSET_SHA,seed:CAST[0].seed},
  colors:{paper:PALETTES[0].paper,ink:PALETTES[0].ink,accent:PALETTES[0].accent},
  edition:{label:'FIRST IMPRESSIONS',number:1}
};
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function keys(x,allowed,required=allowed){
  if(!object(x)||Object.keys(x).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(x,k))) throw new Error('This design has an unsupported structure.');
}
export function normalize(input){
  keys(input,['schemaVersion','theme','asset','colors','edition','specimen'],['schemaVersion','theme','asset','colors','edition']);
  if(input.schemaVersion!==VERSION||!Object.hasOwn(THEMES,input.theme))throw new Error('This design version or theme is not supported.');
  const a=input.asset;
  keys(a,['collection','sourceCommit','sourceSha256','seed']);
  if(a.collection!=='nouns-cc0-local-seed'||a.sourceCommit!==COMMIT||a.sourceSha256!==ASSET_SHA)throw new Error('This design uses a different Nouns asset source.');
  keys(a.seed,SEED_FIELDS);
  const seed=Object.fromEntries(SEED_FIELDS.map((k,i)=>{
    if(!Number.isInteger(a.seed[k])||a.seed[k]<0||a.seed[k]>=LIMITS[i])throw new Error('This Noun has an invalid trait index.');
    return[k,a.seed[k]];
  }));
  keys(input.colors,['paper','ink','accent']);
  const colors=Object.fromEntries(['paper','ink','accent'].map(k=>{
    if(typeof input.colors[k]!=='string'||!/^#[0-9a-f]{6}$/.test(input.colors[k]))throw new Error('Use six-digit lowercase hex colors.');
    return[k,input.colors[k]];
  }));
  keys(input.edition,['label','number']);
  const {label,number}=input.edition;
  if(typeof label!=='string'||!label.trim()||label.length>28||!/^[A-Z0-9 .&-]+$/.test(label)||!Number.isInteger(number)||number<1||number>99)throw new Error('The edition label or number is invalid.');
  return {schemaVersion:VERSION,theme:input.theme,asset:{collection:a.collection,sourceCommit:COMMIT,sourceSha256:ASSET_SHA,seed},colors,edition:{label,number}};
}
export function canonical(input){return JSON.stringify(normalize(input));}
export async function seal(input){
  const design=normalize(input);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(design)));
  const hex=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
  return {...design,specimen:{algorithm:'sha256-canonical-v1-48',id:'NMW1-'+hex.slice(0,12).toUpperCase()}};
}
export async function verify(input){
  const result=await seal(input);
  keys(input.specimen,['algorithm','id']);
  if(input.specimen.algorithm!==result.specimen.algorithm||input.specimen.id!==result.specimen.id)throw new Error('The design fingerprint does not match its contents.');
  return result;
}
export async function importDesign(text){
  if(typeof text!=='string'||text.length>6000)throw new Error('This design file is too large.');
  let input;try{input=JSON.parse(text);}catch{throw new Error('Choose a Nouns Money Workshop JSON design.');}
  return verify(input);
}
export function encodeDesign(design){return btoa(JSON.stringify(design)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export async function decodeDesign(text){
  if(text.length>8000||!/^[A-Za-z0-9_-]+$/.test(text))throw new Error('This design link is invalid.');
  try{return await importDesign(atob(text.replaceAll('-','+').replaceAll('_','/')));}catch(error){throw new Error(error.message||'This design link is invalid.');}
}
export function escapeXml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
export function nounRects(seed,data){
  normalize({...DEFAULT,asset:{...DEFAULT.asset,seed}});
  return ['bodies','accessories','heads','glasses'].flatMap((group,i)=>{
    const hex=data.images[group][seed[SEED_FIELDS[i+1]]].data.replace(/^0x/,'');
    const raw=Uint8Array.from(hex.match(/.{2}/g)||[],h=>parseInt(h,16));
    if(raw.length===5&&raw.every(n=>n===0))return [];
    if(raw.length<5||(raw.length-5)%2)throw new Error('Invalid Nouns RLE.');
    const[palette,top,right,bottom,left]=raw;
    if(palette!==0||left>=right||right>32||top>bottom||bottom>32)throw new Error('Invalid Nouns bounds.');
    let x=left,y=top;const rects=[];
    for(let j=5;j<raw.length;j+=2){
      let run=raw[j];const color=raw[j+1];
      if(color>=data.palette.length)throw new Error('Invalid Nouns palette index.');
      while(run){const width=Math.min(run,right-x);if(width<=0||y>=32)throw new Error('Nouns RLE exceeds canvas.');
        if(color)rects.push({x:x*10,y:y*10,width:width*10,height:10,fill:'#'+data.palette[color]});
        x+=width;if(x===right){x=left;y++;}run-=width;
      }
    }return rects;
  });
}
export function nounSvg(seed,data){return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" shape-rendering="crispEdges">${nounRects(seed,data).map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${r.fill}"/>`).join('')}</svg>`;}
export function nounName(seed,data){return data.images.heads[seed.head].filename.replace(/^head-/,'').replaceAll('-',' ');}
export const TRAY_KEY='nmw-tray/1';
export const TRAY_LIMIT=24;
export async function readTray(raw){
  if(!raw)return[];
  if(raw.length>180000)throw new Error('The saved tray is too large.');
  const values=JSON.parse(raw);if(!Array.isArray(values)||values.length>TRAY_LIMIT)throw new Error('The saved tray could not be read.');
  return Promise.all(values.map(verify));
}
export function addToTray(tray,design){
  if(tray.some(d=>canonical(d)===canonical(design)))return tray;
  if(tray.length>=TRAY_LIMIT)throw new Error('Your tray has 24 designs. Remove one before saving another.');
  return [design,...tray];
}
