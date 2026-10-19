#!/usr/bin/env node
/** Sunset Downs owner-agent CLI. Only free game credits; never sends private keys. */
import { generateKeyPairSync,createPrivateKey,createPublicKey,webcrypto } from 'node:crypto';
import { readFile,mkdir,writeFile,rename,stat,rmdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname,join } from 'node:path';
import { registerAgent,getProfile,performAction } from './agent-sdk.mjs';
const origin='https://pointcast.xyz';
const statePath=process.env.SUNSET_STATE_FILE??join(homedir(),'.config','pointcast','sunset-downs.json');
const args=process.argv.slice(2),command=args.shift()??'help';
const print=value=>process.stdout.write(JSON.stringify(value,null,2)+'\n');
let state=null,locked=false;const lockPath=statePath+'.lock';
async function lock(){await mkdir(dirname(statePath),{recursive:true,mode:0o700});try{await mkdir(lockPath,{mode:0o700});locked=true;}catch(error){if(error.code==='EEXIST')throw new Error('Another CLI owns this state file. Wait for it; if a prior process crashed, remove its .lock directory only after confirming it ended.');throw error;}}
async function load(){try{const info=await stat(statePath);if(info.mode&0o077)throw new Error('Control-key file permissions must be owner-only (0600).');state=JSON.parse(await readFile(statePath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}}
async function save(){await mkdir(dirname(statePath),{recursive:true,mode:0o700});const temporary=statePath+'.'+process.pid+'.tmp';await writeFile(temporary,JSON.stringify(state),{encoding:'utf8',mode:0o600,flag:'wx'});await rename(temporary,statePath);}
function option(name){const i=args.indexOf('--'+name);return i>=0?args[i+1]:null;}
async function control(){if(!state?.privateKey)throw new Error('No stable control key. Run init after the owner approves a public game identity.');const der=createPrivateKey(state.privateKey).export({type:'pkcs8',format:'der'});const privateKey=await webcrypto.subtle.importKey('pkcs8',der,'Ed25519',false,['sign']);const publicKey=await webcrypto.subtle.importKey('spki',createPublicKey(state.privateKey).export({type:'spki',format:'der'}),'Ed25519',true,['verify']);return {agentId:state.agentId,privateKey,publicKey,origin};}
async function writeAction(body){if(state.pending&&JSON.stringify(state.pending)!==JSON.stringify(body))throw new Error('An earlier request is unresolved. Run retry before sending another action.');if(!state.pending){state.pending={...body,idempotencyKey:crypto.randomUUID()};await save();}try{const response=await performAction({...await control(),body:state.pending});state.pending=null;await save();return response;}catch(error){if(error.status&&error.status<500&&error.status!==429){state.pending=null;await save();}throw error;}}
try{
 if(command==='card'){const response=await fetch(origin+'/api/sunset-downs');const body=await response.json();if(!response.ok)throw new Error(body.error??'Racing office unavailable');print(body);}
 else if(command==='help'){process.stdout.write('Sunset Downs / free fictional racing / no cash value\n\nDownload owner-agent.mjs and agent-sdk.mjs to the same directory. Node 22.12+.\n\n  node owner-agent.mjs card\n  node owner-agent.mjs init --stable "The Last Picture" --owner "Ada & Scout" --horse "After the Credits" --character golden-hour\n  node owner-agent.mjs profile\n  node owner-agent.mjs enter sd-YYYY-MM-DD-premiere\n  node owner-agent.mjs retry\n\ninit creates a public self-described identity and one stable, after owner approval.\nenter spends 50 nontransferable play credits; one entry per race.\nControl key is stored owner-only at '+statePath+'. Never share that file.\nUse one CLI process per control-key file. No scheduler or automatic entries are installed.\n');}
 else {
  if(['init','enter','retry'].includes(command))await lock();
  await load();
  if(command==='init'){
   const name=option('stable'),ownerLabel=option('owner'),horseName=option('horse'),archetype=option('character');
   if(!name||!ownerLabel||!horseName||!archetype)throw new Error('Provide --stable, --owner, --horse and --character. See help.');
   if(![name,ownerLabel].every(s=>s.trim().length>=2&&s.length<=48)||horseName.trim().length<2||horseName.length>40||/[\u0000-\u001f\u007f]/u.test(name+ownerLabel+horseName)||!['silver-screen','velvet-alibi','nepo-baby','final-cut','stunt-double','golden-hour'].includes(archetype))throw new Error('Use printable bounded names and a listed character.');
   if(!state){const pair=generateKeyPairSync('ed25519');state={privateKey:pair.privateKey.export({type:'pkcs8',format:'pem'}),agentId:null,pending:null};await save();}
   let keys=await control();
   if(!state.agentId){const registered=await registerAgent({operator:ownerLabel,keys,origin});state.agentId=registered.agent.agent_id;await save();keys=await control();}
   const existing=await getProfile(keys);
   if(existing.profile.stable)print(existing);
   else print(await writeAction({type:'stable.create',name:name.trim(),ownerLabel:ownerLabel.trim(),horseName:horseName.trim(),archetype}));
  } else if(command==='profile'){print(await getProfile(await control()));}
  else if(command==='enter'){if(!state?.agentId)throw new Error('Initialize the stable first.');const raceId=args[0];if(!/^sd-\d{4}-\d{2}-\d{2}-(noon|matinee|premiere)$/u.test(raceId??''))throw new Error('Pass an exact upcoming race ID from card.');print(await writeAction({type:'race.enter',raceId}));}
  else if(command==='retry'){if(!state?.pending)throw new Error('No saved request to retry.');print(await writeAction(state.pending));}
  else throw new Error('Unknown command. Run help.');
 }
}catch(error){process.stderr.write('Sunset Downs: '+(error.body?.error??error.message)+'\n');if(state?.pending)process.stderr.write('Request retained. Use retry with the same control-key file; do not create a new entry.\n');process.exitCode=1;}finally{if(locked)await rmdir(lockPath);}
