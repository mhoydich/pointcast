export const DEFAULTS={price:32,shippingCharge:7,landed:9.5,mailer:1.25,handling:2.5,postage:8,royalty:1.5,reserve:1.25,feePercent:2.9,feeFlat:.3,cac:0,fixed:4500,lot:500};
export function economics(input){
  const keys=Object.keys(DEFAULTS);
  if(keys.some(k=>!Number.isFinite(input[k])||input[k]<0)||input.feePercent>100||!Number.isInteger(input.lot)||input.lot<1) return {valid:false};
  const revenue=input.price+input.shippingCharge;
  const fee=revenue*input.feePercent/100+input.feeFlat;
  const variable=input.landed+input.mailer+input.handling+input.postage+input.royalty+input.reserve+input.cac+fee;
  const contribution=revenue-variable;
  const breakEven=contribution>0?Math.ceil(input.fixed/contribution):null;
  const prepaid=input.fixed+input.landed*input.lot;
  const cashPerSale=contribution+input.landed;
  const cashRecovery=cashPerSale>0?Math.ceil(prepaid/cashPerSale):null;
  return {valid:true,revenue,fee,variable,contribution,breakEven,prepaid,cashPerSale,cashRecovery,margin:revenue>0?contribution/revenue:null};
}
