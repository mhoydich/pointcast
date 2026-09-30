export const STORAGE_KEY='lucky-cat-v1';
import {CATS,humanRequirement} from './catalog.js';
export {CATS};
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function freshState(day=dayKey()){return {version:1,luck:0,lifetimeLuck:0,pinned:[],owned:['classic'],selected:'classic',surpriseDay:null,goalsDay:day,goals:defaultGoals(),favorites:[],best:0,rounds:0,sparks:0,focusMinutes:0,focus:{duration:25,remaining:1500,deadline:null,status:'idle'},sound:false,reducedMotion:false};}
function defaultGoals(){return ['Drink a glass of water','Move a little','Do one kind thing'].map((text,i)=>({id:`daily-${i}`,text,done:false}));}
export function normalize(raw,day=dayKey()){
 const base=freshState(day);if(!raw||raw.version!==1)return base;
 for(const key of ['luck','lifetimeLuck','best','rounds','sparks','focusMinutes'])if(Number.isFinite(raw[key])&&raw[key]>=0)base[key]=Math.floor(raw[key]);
 base.owned=[...new Set(['classic',...(Array.isArray(raw.owned)?raw.owned.filter(id=>CATS.some(c=>c.id===id)):[])])];base.pinned=Array.isArray(raw.pinned)?raw.pinned.filter(id=>CATS.some(c=>c.id===id)):[];base.lifetimeLuck=Number.isFinite(raw.lifetimeLuck)?Math.max(0,raw.lifetimeLuck):base.luck+CATS.filter(c=>base.owned.includes(c.id)).reduce((n,c)=>n+c.cost,0);base.selected=base.owned.includes(raw.selected)?raw.selected:'classic';base.surpriseDay=typeof raw.surpriseDay==='string'?raw.surpriseDay:null;base.sound=raw.sound===true;base.reducedMotion=raw.reducedMotion===true;base.favorites=Array.isArray(raw.favorites)?raw.favorites.filter(n=>Number.isInteger(n)&&n>=0&&n<8):[];
 if(raw.goalsDay===day&&Array.isArray(raw.goals)){base.goals=raw.goals.slice(0,8).filter(g=>typeof g.id==='string'&&typeof g.text==='string'&&g.text.trim()).map(g=>({id:g.id,text:g.text.slice(0,70),done:g.done===true}));}
 const f=raw.focus;if(f&&[5,15,25].includes(f.duration)&&['idle','running','paused','complete'].includes(f.status)){base.focus={duration:f.duration,remaining:Math.max(0,Math.min(f.duration*60,Number(f.remaining)||0)),deadline:Number.isFinite(f.deadline)?f.deadline:null,status:f.status};if(base.focus.status==='running'&&!base.focus.deadline)base.focus.status='paused';}return base;
}
export function act(state,action,now=Date.now(),day=dayKey()){
 const s=normalize(state,day);let message='',changed=false;
 switch(action.type){
 case 'surprise':if(s.surpriseDay===day)message='Your surprise is safe. Come back tomorrow.';else{s.surpriseDay=day;s.luck+=8;s.lifetimeLuck+=8;changed=true;message='+8 luck. Good things find their way to you.';}break;
 case 'cat':{const cat=CATS.find(c=>c.id===action.id);if(!cat)throw new Error('Unknown cat');if(!s.owned.includes(cat.id)){if(!humanRequirement(cat,s).met){message='A little more practice will unlock this milestone.';break;}if(s.luck<cat.cost){message=`${cat.cost-s.luck} more luck to meet ${cat.name}.`;break;}s.luck-=cat.cost;s.owned.push(cat.id);message=`Meet ${cat.name}. ${cat.desc}`;}else message=`${cat.name} is your lucky companion.`;s.selected=cat.id;changed=true;break;}
 case 'goal':{const g=s.goals.find(g=>g.id===action.id);if(!g)throw new Error('Unknown goal');if(!g.done){g.done=true;s.luck+=5;s.lifetimeLuck+=5;changed=true;message='+5 luck. Small win, big good energy.';}break;}
 case 'add-goal':{if(typeof action.text!=='string'||!action.text.trim())throw new Error('Write a small goal first');if(s.goals.length>=8){message='Eight small things is plenty for one day.';break;}s.goals.push({id:action.id,text:action.text.trim().slice(0,70),done:false});changed=true;break;}
 case 'round':{if(!Number.isInteger(action.score)||action.score<0)throw new Error('Invalid score');const reward=Math.min(12,2+Math.floor(action.score/3));s.luck+=reward;s.lifetimeLuck+=reward;s.best=Math.max(s.best,action.score);s.rounds++;s.sparks+=action.hits??action.score;changed=true;message=`+${reward} luck. Lovely little round.`;break;}
 case 'duration':if(![5,15,25].includes(action.minutes))throw new Error('Choose 5, 15, or 25 minutes');if(s.focus.status==='running'||s.focus.status==='paused'){message='Reset this session to choose a new duration.';break;}s.focus={duration:action.minutes,remaining:action.minutes*60,deadline:null,status:'idle'};changed=true;break;
 case 'focus-start':if(s.focus.status!=='running'){if(['idle','complete'].includes(s.focus.status))s.focus.remaining=s.focus.duration*60;s.focus.deadline=now+s.focus.remaining*1000;s.focus.status='running';changed=true;}break;
 case 'focus-pause':if(s.focus.status==='running'){s.focus.remaining=Math.max(0,Math.ceil((s.focus.deadline-now)/1000));s.focus.deadline=null;s.focus.status='paused';changed=true;}break;
 case 'focus-reset':s.focus={duration:s.focus.duration,remaining:s.focus.duration*60,deadline:null,status:'idle'};changed=true;break;
 case 'focus-check':if(s.focus.status==='running'&&now>=s.focus.deadline){s.focus.remaining=0;s.focus.deadline=null;s.focus.status='complete';s.luck+=10;s.lifetimeLuck+=10;s.focusMinutes+=s.focus.duration;changed=true;message='+10 luck. You made a little space for focus.';}break;
 case 'favorite':if(!Number.isInteger(action.index)||action.index<0||action.index>7)throw new Error('Invalid affirmation');s.favorites=s.favorites.includes(action.index)?s.favorites.filter(i=>i!==action.index):[...s.favorites,action.index];changed=true;message=s.favorites.includes(action.index)?'A good thought, saved.':'Thought removed from favorites.';break;
 case 'pin':if(!CATS.some(c=>c.id===action.id))throw new Error('Unknown cat');s.pinned=s.pinned.includes(action.id)?s.pinned.filter(id=>id!==action.id):[...s.pinned,action.id];changed=true;break;
 case 'setting':if(!['sound','reducedMotion'].includes(action.key)||typeof action.value!=='boolean')throw new Error('Invalid setting');s[action.key]=action.value;changed=true;break;
 default:throw new Error('Unknown action');}
 return {state:s,message,changed};
}
