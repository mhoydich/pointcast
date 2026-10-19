export const STATIONS=Object.freeze([
 {id:'control',label:'CONTROL',weight:30,attempts:20},
 {id:'reset',label:'RESET',weight:35,attempts:20},
 {id:'hands',label:'HANDS',weight:20,attempts:20},
 {id:'choose',label:'CHOOSE',weight:15,attempts:20},
]);
/** Blank is missing, never zero. Counts are personal drill observations. */
export function scoreCourtCounts(counts){
 const errors=[];const contributions=[];
 for(const station of STATIONS){
  const raw=counts[station.id];const value=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()!==''?Number(raw):NaN;
  if(!Number.isInteger(value)||value<0||value>station.attempts)errors.push(station.id);
  else contributions.push({...station,count:value,points:station.weight*value/station.attempts});
 }
 return errors.length?{valid:false,errors}:{valid:true,errors:[],contributions,total:contributions.reduce((sum,s)=>sum+s.points,0)};
}
