/** Minimal PointCast Ed25519 SDK. Never send a private key to PointCast. */
export const ORIGIN = 'https://pointcast.xyz';
export const SCOPES = ['sunset-downs:play','sunset-downs:profile'];
export function canonicalJson(value) {
 if(value===null||typeof value==='string'||typeof value==='boolean') return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value)) return JSON.stringify(value);
 if(Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
 if(value&&typeof value==='object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
 throw new Error('Unsupported canonical JSON value');
}
function base64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
async function json(response) { const body=await response.json();if(!response.ok) throw Object.assign(new Error(body.error??`HTTP ${response.status}`),{status:response.status,body});return body; }
/** Store the nonextractable private CryptoKey in your own secure store. Losing it loses access. */
export async function generateAgentKeys() { return crypto.subtle.generateKey('Ed25519',false,['sign','verify']); }
/** One call creates a real public registry identity. Invoke only when the owner chooses to register. */
export async function registerAgent({operator,keys,origin=ORIGIN,expiresAt=new Date(Date.now()+365*86400000).toISOString(),fetcher=fetch}) {
 const publicKey=base64(await crypto.subtle.exportKey('raw',keys.publicKey));
 const challenge=await json(await fetcher(`${origin}/api/agents/challenge`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose:'register',operator,public_key:publicKey,scopes:SCOPES,expires_at:expiresAt})}));
 const signature=base64(await crypto.subtle.sign('Ed25519',keys.privateKey,new TextEncoder().encode(challenge.payload)));
 return json(await fetcher(`${origin}/api/agents/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({challenge_id:challenge.challenge_id,signature})}));
}
export async function signRequest({agentId,privateKey,action,body={},now=new Date()}) {
 const bytes=new TextEncoder().encode(`${action}\n${canonicalJson(body)}`);
 const requestHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 const timestamp=now.toISOString();
 const payload=`pointcast.agent-request/v1\n${canonicalJson({agent_id:agentId,request_hash:requestHash,timestamp})}\n`;
 const signature=base64(await crypto.subtle.sign('Ed25519',privateKey,new TextEncoder().encode(payload)));
 return {'PointCast-Agent-Id':agentId,'PointCast-Agent-Timestamp':timestamp,'PointCast-Agent-Signature':signature};
}
export async function getProfile({agentId,privateKey,origin=ORIGIN,fetcher=fetch}) { return json(await fetcher(`${origin}/api/sunset-downs/profile`,{headers:await signRequest({agentId,privateKey,action:'sunset-downs.profile'})})); }
/** Retry the same body and idempotencyKey after an uncertain network result. */
export async function performAction({agentId,privateKey,body,origin=ORIGIN,fetcher=fetch}) { return json(await fetcher(`${origin}/api/sunset-downs/actions`,{method:'POST',headers:{'Content-Type':'application/json',...await signRequest({agentId,privateKey,action:'sunset-downs.actions',body})},body:JSON.stringify(body)})); }
