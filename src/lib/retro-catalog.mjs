// Experience metadata only. Titles, URLs, publication status and receipts belong
// to the publisher's shared registry. No second project list is maintained here.
export const experiences = [
 {id:'teletext',number:'100',title:'PointCast Teletext',short:'Teletext',tag:'The information service',description:'Numbered pages. A little weather, a little ocean, a route into the latest.',color:'#78e6d0'},
 {id:'saturday-morning',number:'200',title:'Saturday Morning',short:'Saturday Morning',tag:'Turn the channel',description:'Original station bumpers and a dial into the animation reading shelf.',color:'#ffca71'},
 {id:'mixtape',number:'300',title:'Mixtape Desk',short:'Mixtape Desk',tag:'Make a reading tape',description:'Sequence readings and art on two sides. Print a cassette insert.',color:'#fb91b7'},
 {id:'bbs',number:'400',title:'PointCast BBS Annex',short:'BBS Annex',tag:'Your local terminal',description:'Room directory, daily challenges and a guestbook that stays on this device.',color:'#b9f38b'},
 {id:'cartridges',number:'500',title:'Cartridge Shelf',short:'Cartridge Shelf',tag:'Pick up & play',description:'Original pixel jackets, useful manuals and a Start into published projects.',color:'#8db9ff'},
 {id:'video-store',number:'600',title:'Video Store',short:'Video Store',tag:'Find your next reading',description:'Browse the essay shelves by mood and topic. No late fees.',color:'#c8a5ff'},
];
export const channels = [
 {number:'201',title:'The morning was the medium',href:'/reading/animation/saturday-morning-1980s/',bumper:'SUNRISE SIGNAL',note:'A reading about the Saturday ritual: the schedule, the television and the shared morning.'},
 {number:'202',title:'Hanna-Barbera',href:'/reading/animation/hanna-barbera/',bumper:'PAPER PLANET',note:'A history reading about a studio and the worlds made for television.'},
 {number:'203',title:'Avatar and the art of learning to change',href:'/reading/animation/avatar-the-last-airbender/',bumper:'WIND WINDOW',note:'A later animation reading: learning, responsibility and transformation.'},
];
export const teletextPages = [
 {number:'100',title:'Index',kind:'all',note:'A directory of published PointCast destinations. Page numbers are addresses, not a live data feed.'},
 {number:'101',title:'Weather desk',kind:'weather',note:'Open the weather report for its source, location and observation time. No readings are simulated here.'},
 {number:'102',title:'Ocean desk',kind:'ocean',note:'Visit the Pacific report for conditions and sources. Publication verification is separate from observation freshness.'},
 {number:'103',title:'Bird desk',kind:'birds',note:'Only published bird destinations can appear here. Planned pages remain off the directory.'},
 {number:'104',title:'Jobs & proposals',kind:'jobs',note:'Research briefs and proposals are ideas to explore. They are not claims of open jobs, hiring or compensation.'},
 {number:'105',title:'Latest destinations',kind:'all',note:'Published destinations from the shared PointCast catalog. Publication order is shown by the Latest desk.'},
];
export function normalizeProjects(registry) {
 const records = Array.isArray(registry) ? registry : registry.projects ?? registry.items ?? [];
 return records.filter(p => p.publication?.state === 'verified-live' && /^[a-f0-9]{40}$/.test(p.publication.commit ?? '') && Number.isFinite(Date.parse(p.publication.verifiedAt)) && typeof p.publication.receipt === 'string' && !!p.publication.receipt && /^https:\/\/pointcast\.xyz\//.test(p.publication.canonical ?? '') && /^https:\/\/[a-z0-9-]+\.pointcast\.pages\.dev(?:\/|$)/.test(p.publication.immutable ?? '')).filter(p => {
  const href=p.href ?? p.path; return typeof href==='string' && /^\/(?!\/)/.test(href) && p.publication.canonical === `https://pointcast.xyz${href}`;
 }).map(p=>({...p,href:p.href??p.path,dek:p.dek??p.description??p.summary??'',topics:classify(p)}));
}
export function classify(p) {
 const s=`${p.href??p.path} ${p.title} ${p.group??''} ${(Array.isArray(p.tags)?p.tags:[]).join(' ')}`.toLowerCase();
 const result=['all'];
 for(const [kind,re] of Object.entries({weather:/weather|\/air\//,ocean:/ocean|pacific/,birds:/bird|avian/,jobs:/opportunit|communications-lab|intern/,animation:/animation/,play:/rocks|lucky-cat|arcade|nounle|games|drum|object-library|keyboard/,art:/art|wallet|rocks|object-library/,calm:/ocean|pacific|moon|books|cat/,curious:/reading|atlas|manufacturing|books|sun|moon/,making:/manufactur|chain|communications|everyday|mobility/})) if(re.test(s))result.push(kind);
 return result;
}
export function choose(projects, kind='all', search='') {
 const query=search.trim().toLowerCase();
 return projects.filter(p=>p.topics.includes(kind)&&`${p.title} ${p.dek}`.toLowerCase().includes(query));
}
export function dailyChallenge(date=new Date()) {
 const day=date.toISOString().slice(0,10);const choices=['Open a reading, then write one question it left you with.','Visit an art project and describe one color you noticed.','Try a published play project. Write one tip for your next visit.','Find a report and check its observation time before reading it.'];
 return {day,text:choices[Math.floor(Date.parse(day)/86400000)%choices.length]};
}
export function safeState(raw, ids) {
 try { const s=JSON.parse(raw); return {tape:Array.isArray(s.tape)?[...new Set(s.tape.filter(x=>ids.includes(x)))].slice(0,12):[],notes:Array.isArray(s.notes)?s.notes.filter(x=>typeof x.text==='string'&&typeof x.day==='string').map(x=>({text:x.text.slice(0,280),day:x.day.slice(0,10)})).slice(-20):[]}; } catch{return {tape:[],notes:[]};}
}

export function roomProjects(projects,room) {
 const shelves={mixtape:['curious','art','animation'],cartridges:['play','art','making'],'video-store':['curious','animation','making']};
 return shelves[room]?projects.filter(p=>shelves[room].some(t=>p.topics.includes(t))):projects;
}
