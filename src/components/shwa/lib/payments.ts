import type { PaymentRequired, PaymentRequirements } from '@x402/fetch';
export const BASE_USDC='0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export function publicPaymentURL(value:string){
 const url=new URL(value.trim());
 if(url.protocol!=='https:'||url.username||url.password||url.hash||url.port||!url.hostname.includes('.')||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname)||url.hostname.endsWith('.local')||url.hostname.startsWith('['))throw Error('Use a public HTTPS service URL.');
 return url.href;
}
export function approveQuote(quote:PaymentRequired,url:string):PaymentRequired{
 if(quote.x402Version!==2||!quote.resource||quote.resource.url!==url||!Array.isArray(quote.accepts))throw Error('The service did not return a matching x402 v2 quote.');
 const requirement=quote.accepts.find(safeRequirements);
 if(!requirement)throw Error('This station supports exact Base USDC payments up to $1, with a short authorization.');
 // Retain only the reviewed option, and no unreviewed payment extensions.
 return {x402Version:2,resource:{url,description:typeof quote.resource.description==='string'?quote.resource.description.slice(0,300):'',mimeType:quote.resource.mimeType},accepts:[structuredClone(requirement)]};
}
export function safeRequirements(r:PaymentRequirements){
 return r?.scheme==='exact'&&r.network==='eip155:8453'&&r.asset?.toLowerCase()===BASE_USDC.toLowerCase()&&/^0x[a-fA-F0-9]{40}$/.test(r.payTo)&&r.payTo.toLowerCase()!=='0x0000000000000000000000000000000000000000'&&typeof r.amount==='string'&&/^\d+$/.test(r.amount)&&BigInt(r.amount)>BigInt(0)&&BigInt(r.amount)<=BigInt(1_000_000)&&typeof r.maxTimeoutSeconds==='number'&&Number.isSafeInteger(r.maxTimeoutSeconds)&&r.maxTimeoutSeconds>0&&r.maxTimeoutSeconds<=120&&r.extra?.name==='USD Coin'&&r.extra?.version==='2'&&(!r.extra?.assetTransferMethod||r.extra.assetTransferMethod==='eip3009');
}
