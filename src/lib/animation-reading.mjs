// Public long-form reading contract. Research is normalized only after full input arrives.
export const ANIMATION_READING_ROUTES = Object.freeze({
  avatar: '/reading/animation/avatar-the-last-airbender',
  hannaBarbera: '/reading/animation/hanna-barbera',
  saturdayMorning: '/reading/animation/saturday-morning-1980s',
});
export function assertAnimationReading(story) {
  if(!story || typeof story.title!=='string' || !story.title.trim() || typeof story.dek!=='string' || !story.dek.trim()) throw new Error('A complete title and introduction are required.');
  if(typeof story.checkedDate!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(story.checkedDate)) throw new Error('A dated source check is required.');
  if(!Array.isArray(story.sections)||!story.sections.length||!Array.isArray(story.sources)||!story.sources.length) throw new Error('Full story sections and sources are required.');
  const ids=new Set(['timeline','learning','work','sources']);const sources=new Map();
  for(const source of story.sources){
    if(!source.id||sources.has(source.id)||!source.title||!source.publisher) throw new Error('Unique, attributed sources are required.');
    const url=new URL(source.url);if(url.protocol!=='https:') throw new Error('Use verified HTTPS source links.');sources.set(source.id,source);
  }
  const refs=item=>{for(const id of item.sourceIds||[])if(!sources.has(id))throw new Error('Unknown source reference: '+id);};
  for(const [index,section] of story.sections.entries()){
    if(typeof section.id!=='string'||!/^[a-z][a-z0-9-]*$/.test(section.id)||ids.has(section.id)||(!section.heading&&!(index===0&&section.heading===null))) throw new Error('Unique, readable section anchors are required.');ids.add(section.id);
    if(!Array.isArray(section.paragraphs)||!section.paragraphs.length||section.paragraphs.some(p=>typeof p!=='string'||!p.trim())) throw new Error('Preserve the complete section prose.');
    if(section.spoiler!==undefined&&typeof section.spoiler!=='boolean')throw new Error('Spoiler sections require an explicit boolean label.');refs(section);
  }
  for(const event of story.timeline||[]){if(!event.date||!event.description)throw new Error('Timeline entries need dates and full context.');refs(event);}
  for(const companion of Object.values(story.companions||{}))refs(companion);
  return story;
}
export function animationReadingMinutes(story){return Math.max(1,Math.ceil(story.sections.flatMap(s=>s.paragraphs).join(' ').trim().split(/\s+/).length/220));}

export function readingFragments(text){
  const parts=[];const pattern=/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;let end=0;
  for(const match of text.matchAll(pattern)){parts.push({text:text.slice(end,match.index)});parts.push({text:match[1],href:match[2]});end=match.index+match[0].length;}
  parts.push({text:text.slice(end)});return parts;
}

export function readingBlock(text){
  const lines=text.split(/\r?\n/);const unordered=lines.length>1&&lines.every(line=>/^-\s+/.test(line));
  const ordered=lines.length>1&&lines.every(line=>/^\d+\.\s+/.test(line));
  if(unordered||ordered)return {kind:ordered?'ordered':'unordered',items:lines.map(line=>line.replace(ordered?/^\d+\.\s+/:/^-\s+/,''))};
  return {kind:'paragraph',text};
}
