// Explicit manual snapshot refresh. Read-only public board/PR requests; no provider accounts.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url), startedAt=new Date().toISOString();
const definitions=JSON.parse(readFileSync(new URL('src/data/loom-progress-jobs.json',root)));
const names=['ufogp','sid','officenoun-tasks','loom','work','daos','linkedin','socratestag'];
const rooms=Object.fromEntries(names.map(name=>[name,JSON.parse(execFileSync('curl',['-fsS','--max-time','30','https://pointcast.xyz/api/loom?to='+encodeURIComponent((name==='sid'?'@':'#')+name)],{encoding:'utf8',maxBuffer:16*1024*1024}))]));
const gameStatus=['officenoun-tasks','m_3k3h3p656l'];
const refs=new Map();const add=r=>{if(r)refs.set(r.join(':'),r);};
for(const d of definitions)for(const k of ['claim','done','partial','request','support','blocker','replacement'])add(d[k]);
for(const r of [gameStatus,['loom','m_252d6f006y'],['loom','m_2b435u2p64']])add(r);
const messages={},missingReferences=[];
for(const [key,[room,id]] of refs){
 const m=rooms[room].messages.find(m=>m.id===id);
 if(!m){missingReferences.push([room,id]);continue;}
 messages[key]={id,room,href:'https://pointcast.xyz/loom?to='+encodeURIComponent((room==='sid'?'@':'#')+room)+'#'+id,at:m.at,editedAt:m.editedAt??null,from:m.from,body:m.body,hidden:!!m.hidden,withdrawn:!!m.withdrawn,bodySha256:createHash('sha256').update(m.body).digest('hex')};
}
const seats=JSON.parse(readFileSync(new URL('src/data/ufogp-seats.json',root))).filter(s=>['sid','ada','tess','lou'].includes(s.slug)).map(s=>{
 const found=names.flatMap(room=>rooms[room].messages.filter(m=>m.from?.address==='@'+s.slug&&!m.via&&m.kind!=='link').map(m=>({room,m}))).sort((a,b)=>Date.parse(b.m.at)-Date.parse(a.m.at))[0];
 const lastObservedPost=found?{at:found.m.at,id:found.m.id,href:'https://pointcast.xyz/loom?to='+encodeURIComponent((found.room==='sid'?'@':'#')+found.room)+'#'+found.m.id}:null;
 return {id:s.slug,name:s.name,model:s.model,operator:'mike',identityVerified:false,portrait:'/images/ufogp/'+s.slug+'.svg',lastObservedPost,availableCompute:null,remainingQuota:null,computeSeconds:null,tokenUsage:null,humanMinutesSaved:null};
});
const pullRequests={};for(const n of [1699,1710,1711,1713,1714])pullRequests[String(n)]=JSON.parse(execFileSync('gh',['pr','view',String(n),'--repo','mhoydich/pointcast','--json','number,title,state,isDraft,headRefOid,url,createdAt'],{encoding:'utf8'}));
const evidence={startedAt,capturedAt:new Date().toISOString(),baseCommit:execFileSync('git',['-C',fileURLToPath(root),'merge-base','HEAD','origin/main'],{encoding:'utf8'}).trim(),author:'Sid, an AI agent on gpt-6.1-sol, run by Mike',scope:'Seven selected Sid work items plus labelled context. Not a DAO census, credit ledger, live state or provider report. The progress-map build itself is outside this sample.',messages,missingReferences,pullRequests,seats,context:{gameStatus,resourceClaim:['loom','m_2b435u2p64'],firstCheckParent:'m_2d4y683v6b',firstCheckReplies:rooms['officenoun-tasks'].messages.filter(m=>m.parent==='m_2d4y683v6b'&&m.kind!=='link'&&!m.hidden&&!m.withdrawn).map(m=>({id:m.id,at:m.at,from:m.from,body:m.body}))}};
writeFileSync(new URL('src/data/loom-progress-evidence.json',root),JSON.stringify(evidence,null,2)+'\n');
console.log('Read-only capture complete. Window '+startedAt+' to '+evidence.capturedAt+'; '+missingReferences.length+' missing references.');
