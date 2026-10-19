import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {parse} from 'parse5';

const root=process.cwd();
const dist=resolve(process.argv[2] || 'dist');
const data=JSON.parse(readFileSync(join(root,'src/data/purple-rain.json'),'utf8'));
const twin=JSON.parse(readFileSync(join(dist,'purple-rain.json'),'utf8'));
assert.deepEqual(twin,data,'Compiled JSON must preserve the complete reviewed inventory');
assert.equal(twin.status,'publication-approved');
const html=readFileSync(join(dist,'purple-rain/index.html'),'utf8');
const document=parse(html);
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
const has=(node,name)=>node.attrs?.some(a=>a.name===name);
function descend(node){return [node,...(node.childNodes||[]).flatMap(descend)];}
const nodes=descend(document);
const meta=nodes.find(n=>n.nodeName==='meta'&&attr(n,'name')==='robots');
assert.ok(meta);assert.equal(attr(meta,'content'),'index, follow');
assert.equal(attr(nodes.find(n=>n.nodeName==='link'&&attr(n,'rel')==='canonical'),'href'),data.canonical);
assert.equal(nodes.filter(n=>n.nodeName==='h1').length,1);
assert.equal(nodes.filter(n=>has(n,'data-timeline-lenses')).length,data.timeline.length);
const cards=nodes.filter(n=>has(n,'data-gallery-card'));
assert.equal(cards.length,data.images.length);
const references=cards.filter(n=>attr(n,'data-image-kind')==='reference');
assert.equal(references.length,data.images.filter(i=>i.kind==='reference').length);
for(const reference of references)assert.equal(descend(reference).filter(n=>n.nodeName==='img').length,0,'Restricted references cannot acquire compiled image markup');
assert.equal(nodes.filter(n=>['iframe','video','audio'].includes(n.nodeName)).length,0);
for(const image of nodes.filter(n=>n.nodeName==='img'&&attr(n,'src'))){
 const src=attr(image,'src');assert.ok(src.startsWith('/images/purple-rain/'),src);
 assert.ok(existsSync(join(dist,src)),'Missing compiled image: '+src);
}
for(const image of data.images){
 for(const key of ['src','fullSrc','originalSrc'])if(image[key])assert.ok(existsSync(join(dist,image[key])),image.id+': '+key);
 if(image.kind==='reuse')assert.equal(createHash('sha256').update(readFileSync(join(dist,image.src))).digest('hex'),image.sha256,image.id);
}
assert.ok(existsSync(join(dist,'images/purple-rain/originals/original-art.json')));
console.log(JSON.stringify({passed:true,dist,images:cards.length,outboundOnlyReferences:references.length,timeline:data.timeline.length,indexable:true,inventoryPreserved:true},null,2));
