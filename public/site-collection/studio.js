(()=>{
'use strict';
const byId=id=>document.getElementById(id),poster=byId('poster');if(!poster)return;
const status=byId('status'),flowers=byId('flowers'),localImage=byId('local-image');
const palettes={sunset:['#ed7848','#d9e477','#d58da3','#89b7a6'],pacific:['#81b6c5','#e97253','#ebe5ad','#456d93'],afterhours:['#aa8ec7','#dce665','#e08ca3','#7cad9c']};
let seed=0,generation=0,moving=false,media=matchMedia('(prefers-reduced-motion: reduce)');
const say=text=>{status.textContent=text;};
function describePoster(){poster.setAttribute('aria-label',byId('poster-title').textContent+' poster with '+(localImage.getAttribute('visibility')==='visible'?'your imported image':'sixteen geometric flowers'));}
function remix(){const colors=palettes[byId('palette').value];flowers.querySelectorAll('.flower').forEach((flower,i)=>{flower.querySelectorAll('circle').forEach((circle,j)=>circle.setAttribute('fill',colors[(i+seed+(j===0?0:j===1?2:1))%4]));});}
byId('studio-controls').hidden=false;
byId('title').addEventListener('input',event=>{const text=event.target.value.trim()||'GENERAL ELECTRIC';byId('poster-title').textContent=text.toUpperCase();const title=byId('poster-title'),size=text.length>18?52:76;title.setAttribute('font-size',String(size));if(typeof title.getComputedTextLength==='function'){const width=title.getComputedTextLength();if(width>860)title.setAttribute('font-size',String(Math.floor(size*860/width)));}describePoster();});
byId('palette').addEventListener('change',()=>{remix();say('Palette changed. Your print is ready.');});
byId('shuffle').addEventListener('click',()=>{seed=(seed+1)%4;remix();say('Flower colors remixed.');});
function stopMotion(){moving=false;poster.dataset.motion='false';byId('motion').setAttribute('aria-pressed','false');byId('motion').textContent='Start breathing';}
byId('motion').addEventListener('click',()=>{if(media.matches){stopMotion();say('Reduced motion is enabled. The poster stays still.');return;}moving=!moving;poster.dataset.motion=String(moving);byId('motion').setAttribute('aria-pressed',String(moving));byId('motion').textContent=moving?'Pause breathing':'Start breathing';});
media.addEventListener('change',()=>{if(media.matches)stopMotion();});
function clearImage(){generation++;localImage.removeAttribute('href');localImage.setAttribute('visibility','hidden');flowers.setAttribute('visibility','visible');byId('clear').hidden=true;byId('file').value='';describePoster();byId('file').focus();say('Image removed. Back to flowers.');}
byId('clear').addEventListener('click',clearImage);
async function importImage(file){const token=++generation;if(!file)return;
if(!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)){say('Choose a PNG, JPEG, GIF or WebP image.');byId('file').value='';return;}
if(file.size>8*1024*1024){say('That file is too large. Choose an image under 8 MB.');byId('file').value='';return;}
say('Reading image locally…');
try{const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('read'));reader.readAsDataURL(file);});const img=new Image();img.src=url;await img.decode();if(token!==generation)return;
if(img.naturalWidth>8192||img.naturalHeight>8192||img.naturalWidth*img.naturalHeight>25000000){say('Image dimensions are too large. Use an image under 25 megapixels and 8192 px per side.');return;}
// Rasterize decoded input so the poster embeds pixels only and captures the current GIF frame as a still image.
const raster=document.createElement('canvas');raster.width=img.naturalWidth;raster.height=img.naturalHeight;const ctx=raster.getContext('2d');if(!ctx)throw new Error('canvas');ctx.drawImage(img,0,0);localImage.setAttribute('href',raster.toDataURL('image/png'));localImage.setAttribute('visibility','visible');flowers.setAttribute('visibility','hidden');byId('clear').hidden=false;describePoster();say('Image added locally. Ready to download your poster.');
}catch{if(token===generation)say('This image could not be read. Try another PNG, JPEG, GIF or WebP.');}}
byId('file').addEventListener('change',event=>importImage(event.target.files[0]));
const drop=byId('drop');['dragenter','dragover'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('drag');}));drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('drag');importImage(event.dataTransfer.files[0]);});
byId('download').addEventListener('click',async()=>{const button=byId('download');button.disabled=true;button.textContent='Preparing PNG…';let url;
try{const svg=poster.cloneNode(true);svg.removeAttribute('class');svg.removeAttribute('data-motion');svg.setAttribute('width','1000');svg.setAttribute('height','1400');url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1400;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');ctx.drawImage(img,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('export');const downloadUrl=URL.createObjectURL(blob),link=document.createElement('a');link.href=downloadUrl;link.download='general-electric-pointcast.png';link.click();setTimeout(()=>URL.revokeObjectURL(downloadUrl),10000);say('Poster downloaded. Made here, kept by you.');
}catch{say('Download could not be prepared. Try again or use your browser’s print command.');}finally{if(url)URL.revokeObjectURL(url);button.disabled=false;button.textContent='Download poster PNG ↓';}});
})();
