export const RUN_MS=25000;
export function createRun(now=0){return {status:'running',remaining:RUN_MS,last:now,score:0,hits:0,combo:0,bestCombo:0,lastCatch:null,wave:0,nextWave:0,orbs:[],rewarded:false};}
export function advance(run,now){
 if(run.status!=='running')return run;
 const elapsed=Math.max(0,now-run.last);run.remaining=Math.max(0,run.remaining-elapsed);run.last=Math.max(run.last,now);
 if(!run.remaining){run.status='finished';run.orbs=[];return run;}
 const played=RUN_MS-run.remaining;run.orbs=run.orbs.filter(o=>o.expires>played);
 if(played>=run.nextWave){run.wave++;const golden=(run.wave*3)%4;run.orbs=[0,1,2,3].map(slot=>({id:run.wave+'-'+slot,slot:slot+1,tone:['#ed956f','#bdd85a','#afbde9','#d5b5e8'][slot],golden:slot===golden,expires:played+2100}));run.nextWave=played+2200;}
 return run;
}
export function catchOrb(run,slot,now,expectedId=null){
 advance(run,now);if(run.status!=='running')return null;
 const index=run.orbs.findIndex(o=>o.slot===slot&&(expectedId===null||o.id===expectedId));if(index<0)return null;
 const orb=run.orbs.splice(index,1)[0];const quick=run.lastCatch!==null&&now-run.lastCatch<1300;run.combo=quick?run.combo+1:1;run.bestCombo=Math.max(run.bestCombo,run.combo);run.lastCatch=now;const points=(orb.golden?3:1)+(run.combo>=4?1:0);run.score+=points;run.hits++;return {orb,points,combo:run.combo};
}
export function pauseRun(run,now){advance(run,now);if(run.status==='running')run.status='paused';return run;}
export function resumeRun(run,now){if(run.status==='paused'){run.status='running';run.last=now;run.lastCatch=null;run.combo=0;}return run;}
export function takeReward(run){if(run.status!=='finished'||run.rewarded)return null;run.rewarded=true;return {score:run.score,hits:run.hits,luck:Math.min(12,2+Math.floor(run.score/3))};}