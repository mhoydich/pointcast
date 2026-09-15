/** @jsxRuntime classic */
import * as React from "react";
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { z } from "zod";
import { appendCaption, transcriptText, type Caption, type Notes, type Line } from "./lib/station";
import { contextUpdate } from "./lib/context";
import { appendCard, parseCard, type CanvasItem, type ResearchResult } from "./lib/canvas";
import { createVoiceActions } from "./lib/voice-actions";
import { createVoicePlayback, type VoicePlaybackState } from "./lib/voice-playback";
import { StationPanels } from "./station-panels";
const GATEWAY = "https://shwa-voice-gateway.mhoydich.workers.dev";
type Phase = "idle"|"connecting"|"connected"|"ending"|"ended"|"error";
type Control = {id:string;token:string};
type Call = {peer:RTCPeerConnection;channel:RTCDataChannel;mic?:MediaStream;control?:Control;audio:HTMLAudioElement;context:AudioContext;playback?:ReturnType<typeof createVoicePlayback>;actions?:ReturnType<typeof createVoiceActions>;timer?:ReturnType<typeof setInterval>;timeout?:ReturnType<typeof setTimeout>;frame?:number;input?:AnalyserNode;output?:AnalyserNode;usage:number;costBase:number;closed:boolean;cancelled:boolean};
export default function Home(){
 const [phase,setPhase]=useState<Phase>("idle"),[line,setLine]=useState<Line|null>(null),[message,setMessage]=useState("Checking the line…"),[muted,setMuted]=useState(false),[seconds,setSeconds]=useState(120),[voicePlayback,setVoicePlayback]=useState<VoicePlaybackState>({status:"waiting",message:"Start a call, then say hello to Shwa."});
 const [captions,setCaptions]=useState<Caption[]>([]),[notes,setNotes]=useState<Notes|null>(null),[notesState,setNotesState]=useState("Waiting for a conversation"),[costs,setCosts]=useState({voice:0,reasoning:0,notes:0,images:0,research:0}),[imagePrompt,setImagePrompt]=useState(""),[images,setImages]=useState<{url:string;prompt:string}[]>([]),[imageState,setImageState]=useState(""),[imageBusy,setImageBusy]=useState(false),[hasControl,setHasControl]=useState(false),[signals,setSignals]=useState({input:0,output:0,inputPath:"0,36 320,36",outputPath:"0,36 320,36"});
 const [canvas,setCanvas]=useState<CanvasItem[]>([]),[canvasEnabled,setCanvasEnabled]=useState(true),[workState,setWorkState]=useState("Say “look up paddle prices” or “generate an image of…” during a call."),[contextState,setContextState]=useState("Shwa will receive station context when the call connects.");
 const canvasRef=useRef<CanvasItem[]>([]),canvasEnabledRef=useRef(true),activityRef=useRef<Record<string,string>>({station:"Shwa room inside PointCast. You are Shwa. A desktop board holds conversation pieces. Studio, Grid, Reading and Radio backgrounds change the view. A small call dock stays at the bottom; images are top right with explicit Greenlight controls underneath. Radio animation shows audio activity or a labeled ambient preview; it does not broadcast to others. No outside action is authorized by canvas choices."}),contextSent=useRef<Record<string,string>>({}),contextPending=useRef(false),imagePending=useRef(false),voiceImagePending=useRef(new Set<string>());
 canvasEnabledRef.current=canvasEnabled;canvasRef.current=canvas;
 const activity=useCallback((key:string,text:string)=>{activityRef.current[key]=text.slice(0,900);notesFinal.current=true;},[]);
 const sendContext=useCallback(()=>{const call=active.current,control=studioControl.current;if(!call||!control||call.closed||call.cancelled||phaseRef.current!=="connected"||contextPending.current)return;
  const update=Object.entries(activityRef.current).find(([key,value])=>contextSent.current[key]!==value);if(!update)return;
  const [key,value]=update;contextSent.current[key]=value;contextPending.current=true;setContextState("Sharing station context with Shwa…");
  void fetch(GATEWAY+"/context",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({...control,context:contextUpdate(key,value)}),signal:AbortSignal.timeout(8000)})
   .then(async response=>{const data=z.object({accepted:z.boolean().optional()}).passthrough().parse(await response.json());if(studioControl.current!==control)return;setContextState(response.ok&&data.accepted?"Shwa received the latest station update.":"The latest station update is unconfirmed.");})
   .catch(()=>{if(studioControl.current===control)setContextState("The latest station update is unconfirmed.");}).finally(()=>{contextPending.current=false;});
 },[]);
 useEffect(()=>{const timer=setInterval(sendContext,2500);return()=>clearInterval(timer);},[sendContext]);
 const captionsRef=useRef<Caption[]>([]), studioControl=useRef<Control|undefined>(undefined), notesPending=useRef(false), notesDigest=useRef(""), notesStopped=useRef(false), notesFinal=useRef(false), costsRef=useRef(costs), eventsSeen=useRef(new Set<string>());
 costsRef.current=costs;
 const active=useRef<Call|null>(null), phaseRef=useRef<Phase>(phase), orb=useRef<HTMLDivElement>(null);
 phaseRef.current=phase;
 const refresh=useCallback(async()=>{
  try{const r=await fetch(GATEWAY+"/status",{credentials:"omit",cache:"no-store",signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const data:Line=await r.json();setLine(data);if(!active.current && (phaseRef.current!=="error" || !data.available))setMessage(data.available?"The line is open.":data.message||"The line is getting connected. Check back shortly.");return data;}
  catch{setLine({available:false});if(!active.current)setMessage("The line is unavailable right now. Try again shortly.");}
 },[]);
 const closeRemote=useCallback((control?:Control,beacon=false)=>{
  if(!control)return;
  if(beacon)navigator.sendBeacon(GATEWAY+"/session/close",new Blob([JSON.stringify(control)],{type:"text/plain"}));
  else void fetch(GATEWAY+"/session/close",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify(control),keepalive:true}).catch(()=>{});
 },[]);
 const cleanup=useCallback((call:Call)=>{
  if(call.closed)return;const owns=active.current===call;call.closed=true;clearInterval(call.timer);clearTimeout(call.timeout);if(call.frame)cancelAnimationFrame(call.frame);
  call.playback?.dispose();call.mic?.getTracks().forEach(t=>t.stop());call.audio.pause();call.audio.srcObject=null;
  if(call.context.state!=="closed")void call.context.close().catch(()=>{});
  call.channel.close();call.peer.close();if(!owns)return;active.current=null;notesFinal.current=true;
  orb.current?.style.setProperty("--level","0");setMuted(false);setVoicePlayback({status:"waiting",message:"Start a call, then say hello to Shwa."});setSignals({input:0,output:0,inputPath:"0,36 320,36",outputPath:"0,36 320,36"});
 },[]);
 const end=useCallback(()=>{
  const call=active.current;if(!call||call.closed||call.cancelled)return;
  call.cancelled=true;call.mic?.getTracks().forEach(t=>t.stop());setPhase("ending");setMessage("Ending the conversation…");
  if(call.channel.readyState==="open")call.channel.send(JSON.stringify({type:"session.close"}));
  closeRemote(call.control);clearTimeout(call.timeout);
  call.timeout=setTimeout(()=>{cleanup(call);setPhase("ended");setMessage("Your microphone is off. Thanks for stopping by.");void refresh();},8000);
 },[cleanup,closeRemote,refresh]);
 useEffect(()=>{
  void refresh();const timer=setInterval(()=>{if(!active.current)void refresh();},5000);
  const leave=()=>{const call=active.current;if(call){call.cancelled=true;if(call.channel.readyState==="open")call.channel.send(JSON.stringify({type:"session.close"}));closeRemote(call.control,true);cleanup(call);}studioControl.current=undefined;voiceImagePending.current.clear();setImageBusy(imagePending.current);setHasControl(false);phaseRef.current="ended";setPhase("ended");};
  const resume=(event:PageTransitionEvent)=>{if(event.persisted){leave();setMessage("Your previous call ended. Start a new call when you’re ready.");void refresh();}};
  window.addEventListener("pagehide",leave);window.addEventListener("pageshow",resume);return()=>{clearInterval(timer);window.removeEventListener("pagehide",leave);window.removeEventListener("pageshow",resume);leave();};
 },[refresh,cleanup,closeRemote]);
 useEffect(()=>{
  type Registry={registerTool:(tool:object,options:{signal:AbortSignal})=>void|Promise<void>};
  const context=(document as Document&{modelContext?:Registry}).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const validate=(input:unknown)=>{if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length)throw Error("This tool takes no arguments.");};
  const schema={type:"object",properties:{},additionalProperties:false};
  const tools=[
   {name:"get_shwa_status",description:"Read the voice connection status. Does not activate the microphone or start a paid conversation.",inputSchema:schema,annotations:{readOnlyHint:true},execute:(input:unknown)=>{validate(input);return{status:phaseRef.current,microphoneActive:!!active.current?.mic?.active,estimatedCost:costsRef.current,captionSegments:captionsRef.current.length};}},
   {name:"end_shwa_call",description:"End the active Shwa conversation and turn off the microphone. Use only when the person asks to end it.",inputSchema:schema,annotations:{readOnlyHint:false},execute:(input:unknown)=>{validate(input);end();return{status:active.current?"ending":"inactive",microphoneActive:false};}}
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  return()=>lifecycle.abort();
 },[end]);
 useEffect(()=>{
  const timer=setInterval(()=>{
   const control=studioControl.current,spoken=transcriptText(captionsRef.current),text=spoken.slice(-9500)+"\nSTATION CONTEXT: "+Object.entries(activityRef.current).filter(([key])=>key!=="station").map(([key,value])=>key+": "+value).join("\n").slice(-2500)+"\nALREADY ON CANVAS: "+canvasRef.current.map(c=>`${c.kind}: ${c.title} — ${c.prompt||c.text} (${c.workState||"proposal"})`).join(" | ").slice(-2500)+(!canvasEnabledRef.current?"\nCanvas paused: return card null.":"");
   const trigger=spoken+Object.entries(activityRef.current).filter(([k])=>!["station","canvas"].includes(k)).map(([k,v])=>k+v).join(" ");
   if((!active.current&&!notesFinal.current)||!control||notesPending.current||notesStopped.current||spoken.length<35||trigger===notesDigest.current)return;
   notesPending.current=true;notesFinal.current=false;notesDigest.current=trigger;setNotesState("Updating from the conversation…");
   void fetch(GATEWAY+"/notes",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({...control,transcript:text}),signal:AbortSignal.timeout(40000)})
    .then(async response=>{const data=z.object({message:z.string().optional(),reason:z.string().optional(),notes:z.unknown().optional(),estimatedCost:z.number().optional()}).parse(await response.json());if(response.ok)setCosts(old=>({...old,notes:old.notes+(Number(data.estimatedCost)||0)}));if(studioControl.current!==control)return;if(!response.ok){if(data.reason==="notes_limit")notesStopped.current=true;throw Error(data.message||"Notes unavailable");}const parsed=z.object({summary:z.string(),topics:z.array(z.string()),questions:z.array(z.string()),imageIdea:z.string(),card:z.unknown().optional()}).parse(data.notes);const card=parsed.card==null?null:parseCard(parsed.card);setNotes({...parsed,card});if(card&&canvasEnabledRef.current){setCanvas(old=>appendCard(old,card));activityRef.current.canvas=`Newest ${card.kind}: ${card.title}. ${card.options.length?"Options: "+card.options.join(" / "):card.kind==="slider"?`Range ${card.min} to ${card.max}: ${card.lowLabel} to ${card.highLabel}`:card.text}`.slice(0,850);}setNotesState("Updated just now · AI notes");})
    .catch(error=>{if(studioControl.current===control)setNotesState(error instanceof Error?error.message:"Notes unavailable");}).finally(()=>{notesPending.current=false;});
  },15000);return()=>clearInterval(timer);
 },[]);
 async function generateImage(requestedPrompt?:string,cardId?:string){
  const control=studioControl.current,prompt=(requestedPrompt??imagePrompt).trim();if(!control||!prompt||imagePending.current||voiceImagePending.current.size)return;
  imagePending.current=true;setImageBusy(true);setImageState("Making your image… this may take a minute.");
  try{const response=await fetch(GATEWAY+"/image",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({...control,prompt}),signal:AbortSignal.timeout(100000)});const data=z.object({message:z.string().optional(),image:z.string().max(14000000).optional(),mimeType:z.string().optional(),estimatedCost:z.number().optional(),remainingImages:z.number().optional()}).parse(await response.json());if(response.ok)setCosts(old=>({...old,images:old.images+(Number(data.estimatedCost)||0)}));if(studioControl.current!==control)return;if(!response.ok)throw Error(data.message||"Image unavailable");if(data.mimeType!=="image/webp"||typeof data.image!=="string")throw Error("The image response wasn’t usable.");const url="data:image/webp;base64,"+data.image;setImages(old=>[{url,prompt},...old].slice(0,2));if(cardId)setCanvas(old=>old.map(c=>c.id===cardId?{...c,imageUrl:url}:c));activity("image","An image was created and is visible to the visitor. Prompt: "+prompt+". You have the prompt and completion status, not vision of its pixels.");setImageState("Made with OpenAI · "+data.remainingImages+" image attempts left for this call.");}
  catch(error){if(studioControl.current===control)setImageState(error instanceof Error?error.message:"Image generation is unavailable.");if(cardId)throw error;}finally{imagePending.current=false;setImageBusy(voiceImagePending.current.size>0);}
 }
 async function researchCard(card:CanvasItem):Promise<ResearchResult>{
  const control=studioControl.current;if(!control)throw Error("Start a call to use research.");activity("research","The visitor requested research: "+card.prompt+". It is still in progress.");
  try{const response=await fetch(GATEWAY+"/research",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({...control,question:card.prompt}),signal:AbortSignal.timeout(70000)});
  const data=z.object({message:z.string().optional()}).passthrough().parse(await response.json());if(!response.ok){if(studioControl.current===control)activity("research","The latest research did not return a usable result.");throw Error(data.message||"Research unavailable.");}
  const result=z.object({parts:z.array(z.object({text:z.string().max(18000),citations:z.array(z.object({start:z.number().int().nonnegative(),end:z.number().int().positive(),url:z.string().url().startsWith("https://"),title:z.string()}))})),estimatedCost:z.number().finite().nonnegative()}).parse(data);
  setCosts(old=>({...old,research:old.research+result.estimatedCost}));if(studioControl.current!==control)throw Error("This research belongs to the previous call.");activity("research","Research is visible with clickable citations: "+result.parts.map(p=>p.text).join(" ").slice(0,700));return result;
  }catch(error){if(studioControl.current===control)activity("research","The latest research is unconfirmed or unsuccessful. Do not claim a result is ready.");if(error instanceof Error&&!["ZodError","TypeError","TimeoutError"].includes(error.name))throw error;throw Error("Research could not be confirmed. It may have been charged; no automatic retry.");}
 }
 function answerCard(card:CanvasItem,answer:string){activity("choice",`Visitor answer to canvas ${card.kind} "${card.title}": ${answer}. This is a local preference only, not authorization for external action.`);}
 async function start(){
  if(active.current||!line?.available)return;
  if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){setPhase("error");setMessage("Open this link in a current Safari, Chrome, Edge, or Firefox browser to talk.");return;}
  if(imagePending.current||voiceImagePending.current.size)return;
  studioControl.current=undefined;setHasControl(false);setCanvas([]);canvasRef.current=[];contextSent.current={};for(const key of ["canvas","choice","research","image","tool"])delete activityRef.current[key];setContextState("Waiting to share station context with Shwa.");captionsRef.current=[];setCaptions([]);setNotes(null);setNotesState("Waiting for a conversation");notesDigest.current="";notesStopped.current=false;notesFinal.current=false;eventsSeen.current.clear();setImages([]);setImageState("");
  setWorkState("Say “look up paddle prices” or “generate an image of…” during this call.");setPhase("connecting");setMessage("Allow your microphone to say hello.");setSeconds(120);setMuted(false);
  const peer=new RTCPeerConnection(),channel=peer.createDataChannel("oai-events"),audio=new Audio(),context=new AudioContext();
  const call:Call={peer,channel,audio,context,closed:false,cancelled:false,usage:0,costBase:costsRef.current.voice};active.current=call;
  call.playback=createVoicePlayback({audio,resume:()=>context.resume(),isCurrent:()=>active.current===call&&!call.closed&&!call.cancelled,onState:setVoicePlayback});
  call.actions=createVoiceActions({
   canStart:()=>active.current===call&&!call.closed&&!call.cancelled&&!!call.control,
   isCurrent:()=>!!call.control&&studioControl.current===call.control,
   execute:async callId=>{const response=await fetch(GATEWAY+"/tool",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({...call.control,callId}),signal:AbortSignal.timeout(105000)});const data=await response.json();if(!response.ok)throw Error(typeof data.message==="string"?data.message:"The request could not finish. No automatic retry.");return data;},
   onStart:action=>{if(action.name==="generate_image"){voiceImagePending.current.add(action.callId);setImageBusy(true);setImageState("Making the image you asked for…");}setCanvas(old=>[...old,action.card].slice(-24));setWorkState(action.name==="search_web"?"Looking it up · results will land on the board.":"Making your image · it will appear on the board.");activity("tool",`A spoken ${action.name} request is pending: ${action.prompt}`);},
   onResult:(action,result)=>{
    if(action.name==="generate_image"){voiceImagePending.current.delete(action.callId);setImageBusy(imagePending.current||voiceImagePending.current.size>0);}
    setCanvas(old=>{const targetId=result.operationId?`voice-${result.operationId}`:action.card.id;const base=old.find(card=>card.id===targetId)||{...action.card,id:targetId};const completed:CanvasItem={...base,title:action.name==="search_web"?"Here’s what turned up":"Your image is here",workState:"complete",workMessage:"",...("research" in result?{researchResult:result.research,researchedAt:Date.now()}:{imageUrl:result.imageUrl})};const withoutAlias=old.filter(card=>card.id!==action.card.id||card.id===targetId);return withoutAlias.some(card=>card.id===targetId)?withoutAlias.map(card=>card.id===targetId?completed:card):[...withoutAlias,completed].slice(-24);});
    if("imageUrl" in result&&!result.reused){setImages(old=>[{url:result.imageUrl,prompt:action.prompt},...old].slice(0,2));setImageState("Made from your spoken request · OpenAI");}
    setWorkState((action.name==="search_web"?"Research is on the board, with sources.":"Your image is on the board and in Images.")+(result.voiceDelivery!=="queued"?" Shwa’s spoken follow-up is unconfirmed.":""));
    activity("tool",`The spoken ${action.name} request completed and is on the board. ${result.voiceDelivery==="queued"?"The tool result was submitted to your reasoning backend; a spoken follow-up is not yet confirmed.":"Delivery to your voice backend is unavailable. Do not imply you received these findings."}`);
   },
   onError:(action,error)=>{if(action.name==="generate_image"){voiceImagePending.current.delete(action.callId);setImageBusy(imagePending.current||voiceImagePending.current.size>0);setImageState(error);}setCanvas(old=>old.map(card=>card.id===action.card.id?{...card,workState:"error",workMessage:error}:card));setWorkState(error);activity("tool",`The spoken ${action.name} request did not complete: ${error}`);},
   onCost:(kind,amount)=>setCosts(old=>({...old,[kind]:old[kind]+amount})),
   onReasoning:state=>setWorkState(state==="working"?"Shwa is thinking with Astra…":state==="error"?"Shwa’s reasoning did not finish. You can ask again.":"Shwa’s reasoning returned. Requested work appears on the board."),
  });
  // Keep the meter resume within the start gesture; native media plays Shwa’s voice.
  void context.resume().catch(()=>{});
  try{
   const fresh=await refresh();if(call.cancelled||call.closed||active.current!==call)return;if(!fresh?.available)throw Error(fresh?.message||"The line is unavailable right now.");
   peer.addEventListener("track",event=>{
    if(call.closed||call.cancelled||active.current!==call){event.track.stop();return;}
    const stream=call.playback!.attach(event.track);
    call.output=context.createAnalyser();call.output.fftSize=256;context.createMediaStreamSource(stream).connect(call.output);
   });
   channel.addEventListener("message",({data})=>{
    if(call.closed||active.current!==call)return;
    let event;try{event=JSON.parse(data);}catch{return;}
    call.actions?.handle(event);
    if(typeof event.event_id==="string"){if(eventsSeen.current.has(event.event_id))return;eventsSeen.current.add(event.event_id);}
    if(typeof event.usage?.seconds==="number"){call.usage=Math.max(call.usage,event.usage.seconds);setCosts(old=>({...old,voice:Math.max(old.voice,call.costBase+call.usage/60*.05)}));}
    if((event.type==="session.input_transcript.delta"||event.type==="session.output_transcript.delta")&&typeof event.delta==="string"&&event.delta.length<12000){const start=Number.isFinite(event.start_ms)?event.start_ms:Date.now();const finish=Number.isFinite(event.end_ms)?event.end_ms:start;captionsRef.current=appendCaption(captionsRef.current,event.type==="session.input_transcript.delta"?"you":"electro",event.delta,start,finish);setCaptions(captionsRef.current);}
    if(event.type==="session.started"&&!call.cancelled){setPhase("connected");clearTimeout(call.timeout);setMessage("Connected. Say hello to Shwa.");}
    if(event.type==="session.closed"){cleanup(call);setPhase("ended");setMessage("That was lovely. Come back anytime.");void refresh();}
    if(event.type==="error")setMessage("The connection had a problem. Please end the conversation and try again.");
   });
   channel.addEventListener("close",()=>{if(call.closed||active.current!==call)return;closeRemote(call.control);cleanup(call);setPhase("ended");setMessage("The line closed. Your microphone is off.");});
   peer.addEventListener("connectionstatechange",()=>{if(peer.connectionState==="failed"&&!call.closed&&active.current===call){closeRemote(call.control);cleanup(call);setPhase("error");setMessage("The connection dropped. You can try again.");}});
   call.mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   if(call.cancelled||call.closed||active.current!==call){call.mic.getTracks().forEach(t=>t.stop());return;}
   call.mic.getTracks().forEach(t=>peer.addTrack(t,call.mic!));setMessage("Opening the voice connection…");
   call.input=context.createAnalyser();call.input.fftSize=256;context.createMediaStreamSource(call.mic).connect(call.input);
   const samples=new Uint8Array(256);let lastPaint=0;
   const sample=(analyser?:AnalyserNode)=>{if(!analyser)return{level:0,path:"0,36 320,36"};analyser.getByteTimeDomainData(samples);let sum=0;const points=[];for(let i=0;i<samples.length;i++){const value=(samples[i]-128)/128;sum+=value*value;if(i%4===0)points.push(`${i/252*320},${36-value*100}`);}return{level:Math.min(1,Math.sqrt(sum/samples.length)*6),path:points.join(" ")};};
   const animate=(at:number)=>{if(call.closed)return;if(at-lastPaint>100){lastPaint=at;const input=sample(call.input),output=sample(call.output);setSignals({input:input.level,output:output.level,inputPath:input.path,outputPath:output.path});orb.current?.style.setProperty("--level",String(Math.max(input.level,output.level)));}call.frame=requestAnimationFrame(animate);};call.frame=requestAnimationFrame(animate);
   await peer.setLocalDescription(await peer.createOffer());
   if(peer.iceGatheringState!=="complete")await new Promise<void>((resolve,reject)=>{
    const changed=()=>{if(peer.iceGatheringState==="complete"){clearTimeout(timeout);peer.removeEventListener("icegatheringstatechange",changed);resolve();}};
    const timeout=setTimeout(()=>{peer.removeEventListener("icegatheringstatechange",changed);reject(Error("network"));},10000);peer.addEventListener("icegatheringstatechange",changed);
   });
   if(call.cancelled||call.closed||active.current!==call)return;
   const response=await fetch(GATEWAY+"/session",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({sdp:peer.localDescription?.sdp,voiceTools:true}),signal:AbortSignal.timeout(35000)});
   const result=z.object({message:z.string().optional(),reason:z.string().optional(),retryAt:z.number().optional(),transport:z.object({sdp:z.string().max(131072)}).optional(),control:z.object({id:z.string(),token:z.string()}).optional(),expiresAt:z.union([z.string(),z.number()]).optional()}).parse(await response.json());if(call.closed||call.cancelled||active.current!==call){closeRemote(result.control);return;}if(!response.ok){if(result.reason)setLine({available:false,reason:result.reason,message:result.message,retryAt:result.retryAt});throw Error(typeof result.message==="string"?result.message:"Shwa couldn’t connect. Please try again shortly.");}
   call.control=result.control;if(call.cancelled||call.closed||active.current!==call){closeRemote(call.control);return;}studioControl.current=result.control;setHasControl(!!result.control);
   if(!result.transport?.sdp)throw Error("The voice connection wasn’t ready. Please try again.");
   await peer.setRemoteDescription({type:"answer",sdp:result.transport.sdp});if(call.closed||call.cancelled||active.current!==call){closeRemote(call.control);return;}
   const deadline=typeof result.expiresAt==="number"?result.expiresAt:Date.parse(result.expiresAt||""),finishAt=Number.isFinite(deadline)?deadline:Date.now()+120000;
   call.timer=setInterval(()=>{const left=Math.max(0,Math.ceil((finishAt-Date.now())/1000));setSeconds(left);call.usage=Math.max(call.usage,(Date.now()-(finishAt-120000))/1000);setCosts(old=>({...old,voice:Math.max(old.voice,call.costBase+Math.max(0,call.usage)/60*.05)}));if(!left)end();},1000);
   if(phaseRef.current==="connecting")call.timeout=setTimeout(()=>{if(phaseRef.current==="connecting"){closeRemote(call.control);cleanup(call);setPhase("error");setMessage("The line didn’t connect. Please try again.");}},20000);
  }catch(error){
   const owns=active.current===call;closeRemote(call.control);cleanup(call);if(!owns)return;
   if(call.cancelled){setPhase("ended");setMessage("Your microphone is off.");return;}
   setPhase("error");const name=error instanceof Error?error.name:"";
   setMessage(name==="NotAllowedError"?"Microphone permission is needed. Allow it in your browser, then try again.":name==="NotFoundError"?"No microphone was found. Connect one and try again.":name==="TimeoutError"?"The connection took too long. Please try again shortly.":error instanceof Error&&!["network","Failed to fetch"].includes(error.message)?error.message:"The line couldn’t connect. Please check your connection and try again.");
  }
 }
 function toggleMute(){const call=active.current;if(!call?.mic)return;const next=!muted;call.mic.getAudioTracks().forEach(t=>{t.enabled=!next;});if(call.channel.readyState==="open")call.channel.send(JSON.stringify({type:next?"session.input_audio.mute":"session.input_audio.unmute"}));setMuted(next);}
 const connected=phase==="connected",busy=phase==="connecting"||phase==="ending";
 const label=connected?"In conversation":phase==="connecting"?"Connecting":phase==="ending"?"Signing off":phase==="ended"?"Until next time":line?.available?"Ready when you are":"A moment, please";
 return <StationPanels workState={workState} voicePlayback={voicePlayback} onRetrySound={()=>active.current?.playback?.retry()} canvas={canvas} canvasEnabled={canvasEnabled} setCanvasEnabled={setCanvasEnabled} contextState={contextState} onActivity={activity} onAnswer={answerCard} onCanvasImage={card=>generateImage(card.prompt,card.id)} onResearch={researchCard} phase={phase} line={line} message={message} seconds={seconds} muted={muted} signals={signals} captions={captions} notes={notes} notesState={notesState} costs={costs} prompt={imagePrompt} setPrompt={setImagePrompt} images={images} imageState={imageState} imageBusy={imageBusy} canGenerate={hasControl} generate={prompt=>void generateImage(prompt)}>
  <div ref={orb} className={"voice-orb"+(connected?" is-connected":"")} aria-hidden="true"><div className="orb-halo"/><div className="orb-core"><span>s</span></div><div className="orb-ring"/></div>
  <div className="call-actions">
   {connected?<><button className={"mute-button"+(muted?" muted":"")} onClick={toggleMute} aria-pressed={muted} aria-label={muted?"Turn microphone on":"Mute microphone"}>{muted?<MicOff size={21}/>:<Mic size={21}/>}</button><button className="mute-button sound-retry" aria-label="Retry Shwa sound" title="Hear Shwa · retry sound" onClick={()=>active.current?.playback?.retry()}><Volume2 size={21}/></button><button className="call-button end-button" onClick={end}><PhoneOff size={20}/>End call</button></>:busy?<button className="call-button secondary-button" onClick={end} disabled={phase==="ending"}><PhoneOff size={20}/>{phase==="ending"?"Ending…":"Cancel"}</button>:<button className="call-button" disabled={!line?.available||imageBusy} onClick={()=>void start()}><Phone size={21}/>{phase==="ended"?"Call again":"Start a call"}</button>}
   {!busy&&!connected&&!line?.available&&<button className="refresh-button" onClick={()=>void refresh()}>Check the line</button>}
  </div>
 </StationPanels>;
}
