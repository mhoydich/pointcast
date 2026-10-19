(async function(){
'use strict';
const E=window.BotMoney,form=document.getElementById('note-form'),$=id=>document.getElementById(id),status=$('status');let state=E.normalize();
function saveFile(body,type,name){const blob=new Blob([body],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function read(){const vals=Object.fromEntries(new FormData(form));state=E.normalize(vals);return state;}
function fields(){for(const [key,value]of Object.entries(state)){const control=form.elements.namedItem(key);if(control)control.value=String(value);}}
function render(){ $('front-stage').innerHTML=E.render(state,'front');$('back-stage').innerHTML=E.render(state,'back');$('edition-label').textContent=E.series[state.series].name+' / '+state.denomination+' '+E.series[state.series].unit.toLowerCase();$('char-count').textContent=Array.from(state.message).length+' / 100';}
function downloadName(side){return 'nouns-bot-money-'+state.agentId+'-'+state.series+'-'+state.denomination+'-'+side;}
E.ids.forEach(id=>{const opt=document.createElement('option');opt.value=id;opt.textContent=E.names[id];$('agent').append(opt);});
const requested=new URLSearchParams(location.search).get('agent');if(E.ids.includes(requested))state=E.normalize({agentId:requested});fields();
try{await E.load('./');render();for(const b of form.querySelectorAll('button'))b.disabled=false;status.textContent='Ready. Your words stay in this browser.';}catch(e){status.textContent='The original artwork could not load. Reload the page to try again.';return;}
form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',e=>{const previous={...state};read();if(e.target.name==='agentId'&&previous.botName===E.names[previous.agentId])state.botName=E.names[state.agentId];if(e.target.name==='series'){if(previous.message===E.series[previous.series].defaultMessage)state.message=E.series[state.series].defaultMessage;if(previous.palette===E.series[previous.series].defaultPalette)state.palette=E.series[state.series].defaultPalette;fields();}if(e.target.name==='agentId')fields();render();status.textContent='Preview updated. Personal text is not submitted.';});
form.addEventListener('change',()=>{read();fields();render();});
$('front-download').addEventListener('click',()=>{saveFile(E.render(state,'front'),'image/svg+xml',downloadName('front')+'.svg');status.textContent='Front SVG prepared.';});
$('back-download').addEventListener('click',()=>{saveFile(E.render(state,'back'),'image/svg+xml',downloadName('back')+'.svg');status.textContent='Back SVG prepared.';});
$('download-pack').addEventListener('click',()=>{saveFile(E.makePrintHTML(state),'text/html','nouns-bot-money-'+state.agentId+'-'+state.series+'-'+state.paper+'-print.html');status.textContent='Print pack prepared: three fronts and three matching backs. Make one duplex proof first.';});
$('edition-download').addEventListener('click',()=>{saveFile(JSON.stringify(E.makeEdition(state),null,2),'application/json',downloadName('edition')+'.json');status.textContent='Edition and original-art record prepared.';});
window.BotMoneyUI={getState:()=>({...state})};
})();
