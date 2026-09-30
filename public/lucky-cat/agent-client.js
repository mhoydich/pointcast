const encode=new TextEncoder();
export function canonical(value){if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value!==null&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;return JSON.stringify(value);}
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
export async function responseJson(response){let data;try{data=await response.json();}catch{throw new Error('The agent desk is not available at this address. Open the published PointCast version.');}if(!response.ok||data.ok===false)throw new Error(data.error||`Agent desk returned ${response.status}`);return data;}
async function credentialsStore(){return new Promise((resolve,reject)=>{const request=indexedDB.open('lucky-cat-agent-keys',1);request.onupgradeneeded=()=>request.result.createObjectStore('credentials');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('This browser cannot save a private agent key. Use the CLI instead.'));});}
export async function loadCredential(){const db=await credentialsStore();return new Promise((resolve,reject)=>{const tx=db.transaction('credentials','readonly'),r=tx.objectStore('credentials').get('practice');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
async function saveCredential(credential){const db=await credentialsStore();return new Promise((resolve,reject)=>{const tx=db.transaction('credentials','readwrite');tx.objectStore('credentials').put(credential,'practice');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(new Error('The browser could not save this agent key.'));};});}
export async function registerBrowserAgent(){
 const keyPair=await crypto.subtle.generateKey({name:'Ed25519'},false,['sign','verify']);
 const publicKey=b64(await crypto.subtle.exportKey('raw',keyPair.publicKey));
 const proposal={purpose:'register',public_key:publicKey,operator:'Lucky Cat browser practice',scopes:['lucky-cat:play','lucky-cat:profile'],expires_at:new Date(Date.now()+90*86400000).toISOString()};
 const challenge=await responseJson(await fetch('/api/agents/challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(proposal)}));
 const signature=b64(await crypto.subtle.sign('Ed25519',keyPair.privateKey,encode.encode(challenge.payload)));
 const registered=await responseJson(await fetch('/api/agents/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({challenge_id:challenge.challenge_id,signature})}));
 const credential={agentId:registered.agent.agent_id,privateKey:keyPair.privateKey,expiresAt:registered.agent.expires_at};await saveCredential(credential);return credential;
}
export async function signedRequest(credential,path,body=null){
 const action=body?'lucky-cat.actions':'lucky-cat.profile';const digest=await crypto.subtle.digest('SHA-256',encode.encode(`${action}\n${canonical(body||{})}`));const requestHash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');const timestamp=new Date().toISOString();const payload=`pointcast.agent-request/v1\n${canonical({agent_id:credential.agentId,request_hash:requestHash,timestamp})}\n`;const signature=b64(await crypto.subtle.sign('Ed25519',credential.privateKey,encode.encode(payload)));const headers={'PointCast-Agent-Id':credential.agentId,'PointCast-Agent-Timestamp':timestamp,'PointCast-Agent-Signature':signature};if(body)headers['Content-Type']='application/json';
 return responseJson(await fetch(path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})}));
}
