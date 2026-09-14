/** @jsxRuntime classic */
import * as React from "react";
"use client";
import { useEffect, useRef, useState } from 'react';
import { Wallet, Copy, ArrowUpRight } from 'lucide-react';
import type { EIP1193Provider, Address, Hex } from 'viem';
import type { PaymentRequired } from '@x402/fetch';
import { BASE_USDC, approveQuote, publicPaymentURL, safeRequirements } from './lib/payments';

type WalletOption={id:string;name:string;provider:EIP1193Provider};
type Reviewed={quote:PaymentRequired;url:string;at:number};
async function readResult(response:Response):Promise<ArrayBuffer>{
 const limit=5*1024*1024;if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw Error('Service result exceeds 5 MB.');}
 const reader=response.body?.getReader();if(!reader)return new ArrayBuffer(0);const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw Error('Service result exceeds 5 MB.');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}return bytes.buffer;
}
export function WalletPanel(){
 const [wallets,setWallets]=useState<WalletOption[]>([]),[address,setAddress]=useState<Address|''>(''),[chain,setChain]=useState(''),[balance,setBalance]=useState<string|null>(null),[resource,setResource]=useState(''),[review,setReview]=useState<Reviewed|null>(null),[message,setMessage]=useState('Connect a browser wallet to fund, receive, or pay a service.'),[busy,setBusy]=useState(false),[receipt,setReceipt]=useState(''),[result,setResult]=useState<{url:string;preview:string;name:string}|null>(null);
 useEffect(()=>()=>{if(result)URL.revokeObjectURL(result.url);},[result]);
 const provider=useRef<EIP1193Provider|null>(null),addressRef=useRef(address);addressRef.current=address;
 useEffect(()=>{
  const found=(event:Event)=>{const detail=(event as CustomEvent<{info:{uuid:string;name:string};provider:EIP1193Provider}>).detail;if(!detail?.provider?.request)return;setWallets(old=>old.some(w=>w.id===detail.info.uuid)?old:[...old,{id:detail.info.uuid,name:detail.info.name,provider:detail.provider}]);};
  window.addEventListener('eip6963:announceProvider',found);window.dispatchEvent(new Event('eip6963:requestProvider'));
  const injected=(window as Window&{ethereum?:EIP1193Provider}).ethereum;if(injected)setWallets(old=>old.length?old:[{id:'injected',name:'Browser wallet',provider:injected}]);
  return()=>window.removeEventListener('eip6963:announceProvider',found);
 },[]);
 useEffect(()=>{
  const wallet=provider.current;if(!wallet||!address)return;
  const changed=()=>{setReview(null);setAddress('');setBalance(null);setMessage('Wallet changed. Reconnect to review the current account.');};
  wallet.on('accountsChanged',changed);wallet.on('chainChanged',changed);
  return()=>{wallet.removeListener('accountsChanged',changed);wallet.removeListener('chainChanged',changed);};
 },[address,chain]);
 async function balances(wallet:EIP1193Provider,account:Address){
  const current=await wallet.request({method:'eth_chainId'});setChain(current);
  if(current!=='0x2105'){setBalance(null);return;}
  const result=await wallet.request({method:'eth_call',params:[{to:BASE_USDC as Address,data:('0x70a08231'+account.slice(2).padStart(64,'0')) as Hex},'latest']});
  setBalance((Number(BigInt(result))/1e6).toFixed(2));
 }
 async function connect(option:WalletOption){setBusy(true);setReview(null);try{const accounts=await option.provider.request({method:'eth_requestAccounts'});if(!accounts[0])throw Error('No wallet account selected.');provider.current=option.provider;setAddress(accounts[0]);await balances(option.provider,accounts[0]);setMessage('Your wallet holds the funds. Each payment needs your approval.');}catch{setMessage('Wallet connection wasn’t completed. You can keep using the station.');}finally{setBusy(false);}}
 async function switchBase(){try{await provider.current?.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x2105'}]});setMessage('Base selected. Connect your wallet again.');}catch{setMessage('Choose Base in your wallet, then reconnect.');}}
 async function inspect(){
  setBusy(true);setReview(null);setReceipt('');setResult(null);
  try{const url=publicPaymentURL(resource);const response=await fetch(url,{credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});if(response.status!==402){await response.body?.cancel();throw Error(response.ok?'This service responded without requiring payment.':'This service did not return an x402 payment quote.');}
   const header=response.headers.get('PAYMENT-REQUIRED');if(!header||header.length>32000){await response.body?.cancel();throw Error('The service must allow browser access and expose its PAYMENT-REQUIRED header.');}
   const {x402Client,x402HTTPClient}=await import('@x402/fetch');const http=new x402HTTPClient(new x402Client());const quote=approveQuote(http.getPaymentRequiredResponse(name=>response.headers.get(name)),url);await response.body?.cancel();setReview({quote,url,at:Date.now()});setMessage('Review the amount and receiver below. Nothing has been signed.');
  }catch(error){setMessage(error instanceof Error?error.message:'Could not inspect this service. It must support browser CORS.');}finally{setBusy(false);}
 }
 async function pay(){
  const approved=review,wallet=provider.current,account=address;if(!approved||!wallet||!account||busy)return;
  setBusy(true);setReview(null);let submitted=false;
  try{
   if(Date.now()-approved.at>120000)throw Error('This quote expired. Inspect the service again.');
   const accounts=await wallet.request({method:'eth_accounts'});const currentChain=await wallet.request({method:'eth_chainId'});if(accounts[0]?.toLowerCase()!==account.toLowerCase()||currentChain!=='0x2105')throw Error('Wallet or network changed. Reconnect and review again.');
   const [{createWalletClient,createPublicClient,custom,http:rpcHttp,keccak256,toBytes},{base},{x402Client,x402HTTPClient},{ExactEvmScheme}]=await Promise.all([import('viem'),import('viem/chains'),import('@x402/fetch'),import('@x402/evm/exact/client')]);
   const clientWallet=createWalletClient({account,chain:base,transport:custom(wallet)});
   const client=new x402Client().register('eip155:8453',new ExactEvmScheme({address:account,signTypedData:args=>clientWallet.signTypedData({...args,account} as Parameters<typeof clientWallet.signTypedData>[0])}));
   client.onBeforePaymentCreation(async({selectedRequirements})=>{if(addressRef.current!==account||Date.now()-approved.at>120000||!safeRequirements(selectedRequirements)||JSON.stringify(selectedRequirements)!==JSON.stringify(approved.quote.accepts[0]))return{abort:true,reason:'Payment terms changed.'};});
   const http=new x402HTTPClient(client);setMessage('Review the USDC authorization in your wallet.');const payload=await http.createPaymentPayload(approved.quote);
   const authorization=(payload.payload as {authorization?:{nonce?:unknown}}).authorization;const nonce=authorization?.nonce;if(typeof nonce!=='string'||!/^0x[\da-fA-F]{64}$/.test(nonce))throw Error('The wallet returned an unsupported authorization.');
   setMessage('Sending the approved payment once…');submitted=true;
   const response=await fetch(approved.url,{method:'GET',headers:http.encodePaymentSignatureHeader(payload),credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(30000)});
   const body=await readResult(response);
   const mime=response.headers.get('content-type')||'';const textResult=mime.includes('json')||mime.startsWith('text/plain');setResult({url:URL.createObjectURL(new Blob([body],{type:textResult?'text/plain':'application/octet-stream'})),preview:textResult?new TextDecoder().decode(body.slice(0,16000)):'A file was returned by the service.',name:mime.includes('json')?'service-result.json':textResult?'service-result.txt':'service-result.bin'});
   const settlement=http.getPaymentSettleResponse(name=>response.headers.get(name));
   if(!settlement.success||settlement.network!=='eip155:8453'||!/^0x[\da-fA-F]{64}$/.test(settlement.transaction||''))throw Error('No confirmed settlement receipt returned.');
   const transaction=settlement.transaction as Hex;setReceipt(transaction);
   const proof=await createPublicClient({chain:base,transport:rpcHttp()}).getTransactionReceipt({hash:transaction});const terms=approved.quote.accepts[0];
   const transferTopic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
   const nonceUsed=proof.logs.some(log=>log.address.toLowerCase()===BASE_USDC.toLowerCase()&&log.topics[0]===keccak256(toBytes('AuthorizationUsed(address,bytes32)'))&&log.topics[1]?.slice(-40).toLowerCase()===account.slice(2).toLowerCase()&&log.topics[2]?.toLowerCase()===nonce.toLowerCase());
   const paid=nonceUsed&&proof?.status==='success'&&proof.logs.some(log=>log.address.toLowerCase()===BASE_USDC.toLowerCase()&&log.topics[0]===transferTopic&&log.topics[1]?.slice(-40).toLowerCase()===account.slice(2).toLowerCase()&&log.topics[2]?.slice(-40).toLowerCase()===terms.payTo.slice(2).toLowerCase()&&BigInt(log.data)===BigInt(terms.amount));
   setMessage(paid?(response.ok?'Payment confirmed on Base. The service accepted the request.':'Payment confirmed, but the service returned an error. Keep the receipt for support.'):'The service returned a receipt. On-chain confirmation is still pending; don’t pay again.');
   await balances(wallet,account);
  }catch(error){setMessage(submitted?'Payment status is uncertain. We won’t retry or ask you to sign again automatically. Check your wallet and the service.':error instanceof Error?error.message:'Payment wasn’t completed.');}finally{setBusy(false);}
 }
 return <section className="wallet-panel panel" aria-labelledby="wallet-title"><div className="panel-heading"><span className="eyebrow">07 / THE EXCHANGE</span><Wallet size={19}/></div><h2 id="wallet-title">A little circulation.</h2><p className="section-note">Fund your wallet. Receive USDC. Pay an x402 service.</p>
  {!address?<div className="wallet-connect">{wallets.length?wallets.map(option=><button className="small-button" key={option.id} disabled={busy} onClick={()=>void connect(option)}>Connect {option.name}</button>):<p className="empty-note">Open this station in a browser with a wallet extension to connect. No wallet is needed for the voice demo.</p>}</div>:<div className="receive-box"><div><span className="mini-label">FUND / RECEIVE · BASE USDC</span><strong>{balance===null?'—':balance+' USDC'}</strong></div><code>{address}</code><div className="receive-actions"><button className="text-button" onClick={()=>{void navigator.clipboard.writeText(address).then(()=>setMessage('Address copied. Send native USDC on Base to fund this wallet.')).catch(()=>setMessage('Select and copy the address above.'));}}><Copy size={14}/>Copy receive address</button><a href={'https://basescan.org/address/'+address} target="_blank" rel="noopener noreferrer">View wallet <ArrowUpRight size={14}/></a></div>{chain!=='0x2105'&&<button className="small-button" onClick={()=>void switchBase()}>Switch wallet to Base</button>}<p className="section-note">Incoming funds stay in your wallet. They don’t automatically top up the OpenAI project.</p></div>}
  <form className="payment-form" onSubmit={event=>{event.preventDefault();void inspect();}}><label htmlFor="payment-url" className="mini-label">PAY AN X402 SERVICE</label><div><input id="payment-url" value={resource} onChange={event=>{setResource(event.target.value);setReview(null);}} placeholder="https://service.example/paid-resource" type="url" required/><button className="small-button" disabled={busy} type="submit">Inspect</button></div></form>
  {review&&<div className="payment-review"><span className="mini-label">REVIEW BEFORE SIGNING</span><strong>{Number(review.quote.accepts[0].amount)/1e6} USDC · Base</strong><p>{review.quote.resource.description}</p><span>Receiver</span><code>{review.quote.accepts[0].payTo}</code><span>Resource · GET · results up to 5 MB</span><code>{review.url}</code><button className="small-button" disabled={!address||chain!=='0x2105'||busy} onClick={()=>void pay()}>Approve in wallet</button></div>}
  <p className="section-note" role="status">{message}</p>{result&&<div className="service-result"><span className="mini-label">SERVICE RESULT</span><pre>{result.preview}</pre><a href={result.url} download={result.name}>Download result</a></div>}{receipt&&<a className="receipt-link" href={'https://basescan.org/tx/'+receipt} target="_blank" rel="noopener noreferrer">View payment receipt <ArrowUpRight size={14}/></a>}<p className="section-note">Base native USDC · up to $1 per reviewed request. The service must support browser access.</p>
 </section>;
}
