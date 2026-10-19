export const DEFAULT_SOLAR = Object.freeze({capacity:5,yield:1500,selfUse:40,retail:0.35,exportRate:0.05,pvCost:18000,pvAnnual:150,batteryCost:10000,batteryKWh:10,cycles:250,efficiency:90,batteryAnnual:100,incentive:0});
const limits={capacity:[0,1000],yield:[0,3000],selfUse:[0,100],retail:[0,2],exportRate:[0,2],pvCost:[0,10000000],pvAnnual:[0,100000],batteryCost:[0,10000000],batteryKWh:[0,10000],cycles:[0,365],efficiency:[1,100],batteryAnnual:[0,100000],incentive:[0,10000000]};
export function solarScenario(input){
 const x={}; for(const [key,[min,max]] of Object.entries(limits)){const v=input[key];if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)return null;x[key]=v;}
 if(x.incentive>x.pvCost)return null;
 const generated=x.capacity*x.yield,direct=generated*x.selfUse/100,exports=generated-direct;
 const shiftedInput=Math.min(exports,x.batteryKWh*x.cycles/(x.efficiency/100));
 const delivered=shiftedInput*x.efficiency/100;
 const solarValue=direct*x.retail+exports*x.exportRate-x.pvAnnual;
 const storageValue=delivered*x.retail-shiftedInput*x.exportRate-x.batteryAnnual;
 const combinedValue=solarValue+storageValue;
 const netPv=x.pvCost-x.incentive;
 return {generated,direct,exports,shiftedInput,delivered,solarValue,storageValue,combinedValue,solarPayback:solarValue>0?netPv/solarValue:null,combinedPayback:combinedValue>0?(netPv+x.batteryCost)/combinedValue:null};
}
export function energyScenario(watts,hours,days,rate,fixed){
 if(![watts,hours,days,rate,fixed].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0)||hours>24||days>31||watts>100000||rate>2||fixed>1000)return null;
 const kw=watts/1000,kwh=kw*hours*days;return {kw,kwh,energyCost:kwh*rate,total:kwh*rate+fixed};
}
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
