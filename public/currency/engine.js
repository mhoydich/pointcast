(function(root){
'use strict';
const defaults={batch:25,sold:25,print:117,setup:0,inbound:12,vendorTax:0,price:30,shippingCharge:6,packaging:1.25,postage:5,minutes:8,hourly:30,feePercent:2.9,feeFixed:.30,reservePercent:5,artwork:300,overhead:75,acquisition:0};
function economics(input){
 const p={...defaults,...input};
 for(const [key,value] of Object.entries(p)) if(!Number.isFinite(value)||value<0) throw new Error('Use finite, non-negative costs and quantities.');
 if(!Number.isInteger(p.batch)||!Number.isInteger(p.sold)||p.batch<1||p.sold>p.batch) throw new Error('Batch must be a positive whole number; sold must be a whole number within the batch.');
 const gross=p.price+p.shippingCharge;
 const labor=p.minutes/60*p.hourly;
 const perOrder=p.packaging+p.postage+labor+gross*p.feePercent/100+p.feeFixed+p.price*p.reservePercent/100+p.acquisition;
 const contribution=gross-perOrder;
 const fixed=p.print+p.setup+p.inbound+p.vendorTax+p.artwork+p.overhead;
 const breakEven=contribution>0?Math.ceil(fixed/contribution):null;
 return {gross,perOrder,labor,contribution,fixed,revenue:gross*p.sold,remaining:contribution*p.sold-fixed,breakEven,reachable:breakEven!==null&&breakEven<=p.batch,unsold:p.batch-p.sold};
}
const products={note:{label:'Original art note',size:'150 × 75 mm',digital:12,physical:30,unit:'three-note set'},stamp:{label:'Artist-stamp sheet',size:'180 × 240 mm',digital:12,physical:null,unit:'sheet'},medallion:{label:'Original medallion',size:'40 mm diameter',digital:null,physical:null,unit:'piece'}};
function configuration({product='note',mode='digital',quantity=1,start=1,palette='mint'}={}){
 if(!products[product]||!['digital','physical'].includes(mode)||!['mint','coral','blue'].includes(palette)) throw new Error('Choose a listed product, format and palette.');
 if(!Number.isInteger(quantity)||quantity<1||quantity>100||!Number.isInteger(start)||start<1||start+quantity-1>999999) throw new Error('Quantity: 1–100. Serial range: 000001–999999.');
 const spec=products[product],price=spec[mode];
 return {product,mode,quantity,start,end:start+quantity-1,palette,label:spec.label,size:spec.size,unit:spec.unit,total:price===null?null:price*quantity,serialRange:`CU-${String(start).padStart(6,'0')} → CU-${String(start+quantity-1).padStart(6,'0')}`,status:'simulation; no monetary or postal value; no order'};
}
root.CurrencyEngine={defaults,economics,configuration,products};
})(typeof globalThis!=='undefined'?globalThis:this);
