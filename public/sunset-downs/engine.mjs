/** Sunset Downs is fictional racing entertainment. Credits have no cash value. */
export const TIME_ZONE = 'America/Los_Angeles';
export const STARTING_CREDITS = 1000;
export const ENTRY_FEE = 50;
export const MAX_ENTRIES = 12;
export const PURSE = [300, 150, 75];
export const HORSES = [
  { id:'silver-screen', name:'Silver Screen', title:'The fading leading man', personality:'A velvet-voiced legend with one last impossible comeback. Always arrives late; expects the light to find him.', quote:'Darling, the third act belongs to me.', silks:'#d2d4ce', accent:'#233829', story:'Once the face on every billboard. Now one clean stretch could buy him the ending the studio refused.' },
  { id:'velvet-alibi', name:'Velvet Alibi', title:'The dangerous ingenue', personality:'Cool, inscrutable, and never where the photographers expect. Smiles like she already knows the result.', quote:'I was never here. Check the photo finish.', silks:'#742c49', accent:'#e9cbb8', story:'Nobody knows who paid her entry. Everybody at the Turf Club claims they discovered her first.' },
  { id:'nepo-baby', name:'Nepo Baby', title:'The heir with something to prove', personality:'A trust fund in racing silks. Charming, maddening, and quietly terrified the talent skipped a generation.', quote:'My father owns the sunset. I still have to run.', silks:'#d2af57', accent:'#133d30', story:'The family name opened the gates. It cannot carry him through them.' },
  { id:'final-cut', name:'Final Cut', title:'The ruthless auteur', personality:'Precise, obsessive, and allergic to a sentimental ending. Will sacrifice the opening act to own the last frame.', quote:'Keep rolling. This is the take.', silks:'#222e43', accent:'#eee8d9', story:'After three beautiful disasters, a perfectionist bets their reputation on one unedited run.' },
  { id:'stunt-double', name:'Stunt Double', title:'The invisible hero', personality:'Takes the fall, does the work, gets none of the close-ups. Underestimated by absolutely everyone in the box seats.', quote:'You know the star. You remember my jump.', silks:'#c36c42', accent:'#f2e4cb', story:'Twenty years making other horses famous. Tonight, the billing changes.' },
  { id:'golden-hour', name:'Golden Hour', title:'The golden-hearted outsider', personality:'An earnest dreamer from the wrong side of the Hollywood sign. Runs like the whole town is about to believe.', quote:'There is still a little light left.', silks:'#e1b85a', accent:'#653f2b', story:'No dynasty, no entourage. Just a good stride and the unreasonable belief that the gate opens for everyone.' },
];
export const POSTS = [
  { id:'noon', hour:12, name:'The Matinée', subtitle:'New faces. Old debts.' },
  { id:'matinee', hour:16, name:'The Dailies', subtitle:'Every alibi has a finish line.' },
  { id:'premiere', hour:20, name:'The Premiere', subtitle:'One last shot at the marquee.' },
];
const localDate = new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'});
const localParts = new Intl.DateTimeFormat('en-US',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function dayAt(now = new Date()) { return localDate.format(new Date(now)); }
export function shiftDay(day, amount) { const d=new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+amount); return d.toISOString().slice(0,10); }
export function postTime(day,hour) {
  const target=Date.parse(`${day}T${String(hour).padStart(2,'0')}:00:00Z`);
  let guess=target;
  for(let i=0;i<3;i++) {
    const p=Object.fromEntries(localParts.formatToParts(new Date(guess)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const displayed=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));
    guess+=target-displayed;
  }
  return new Date(guess).toISOString();
}
export function getRace(id,now=new Date()) {
  const match=/^sd-(\d{4}-\d{2}-\d{2})-(noon|matinee|premiere)$/u.exec(String(id));
  if(!match || !Number.isFinite(Date.parse(`${match[1]}T12:00:00Z`)) || new Date(`${match[1]}T12:00:00Z`).toISOString().slice(0,10)!==match[1]) return null;
  const post=POSTS.find(p=>p.id===match[2]);
  const postAt=postTime(match[1],post.hour);
  return {id,day:match[1],slot:post.id,name:post.name,subtitle:post.subtitle,postAt,timeZone:TIME_ZONE,status:Date.parse(postAt)>new Date(now).getTime()?'open':'due'};
}
export function raceCards(now=new Date(),{daysAhead=1,daysBefore=0}={}) {
  const day=dayAt(now), cards=[];
  for(let offset=-daysBefore;offset<=daysAhead;offset++) for(const post of POSTS) cards.push(getRace(`sd-${shiftDay(day,offset)}-${post.id}`,now));
  return cards;
}
export function houseEntrants() { return HORSES.map(h=>({id:`house:${h.id}`,name:h.name,archetype:h.id,stableName:'The House of Sunset',ownerLabel:'House cast',house:true})); }
function random(seed) {
  let h=2166136261;
  for(const c of seed) { h^=c.charCodeAt(0);h=Math.imul(h,16777619); }
  return ()=>{h+=0x6d2b79f5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
/** Seed is server-generated only after post and persisted with a frozen field. This is not a cryptographic fairness proof. */
export function simulateRace(seed,entrants) {
  if(typeof seed!=='string'||!/^[0-9a-f]{32}$/u.test(seed)||!Array.isArray(entrants)||entrants.length<6||entrants.length>18||new Set(entrants.map(e=>e.id)).size!==entrants.length) throw new Error('invalid-race-snapshot');
  const rng=random(seed);
  const finish=entrants.slice().sort((a,b)=>a.id.localeCompare(b.id)).map(e=>({...e,seconds:Math.round((62+rng()*9)*1000)/1000})).sort((a,b)=>a.seconds-b.seconds||a.id.localeCompare(b.id)).map((e,i)=>({...e,position:i+1,award:e.house?0:(PURSE[i]??0)}));
  return {seed,finish,winnerId:finish[0].id,headline:`${finish[0].name} owns the final frame.`,commentary:[`The gates open. ${finish.at(-1).name} has left themselves a Hollywood ending.`,`${finish[1].name} asks the question at the turn. ${finish[0].name} has the answer.`,`${finish[0].name}, by ${Math.max(.001,finish[1].seconds-finish[0].seconds).toFixed(3)} seconds. Somebody call the studio.`],playbackSeconds:24,engine:'sunset-downs-simulation-v1'};
}
