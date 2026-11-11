import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {JSDOM, VirtualConsole} from 'jsdom';
const root = fileURLToPath(new URL('../public/ues/pantone/', import.meta.url));
const errors=[];
const virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(root+'index.html','utf8'),{url:'https://pointcast.xyz/ues/pantone/',runScripts:'outside-only',virtualConsole});
const w=dom.window,d=w.document;
let saved=[],revoked=[],prints=0;
w.URL.createObjectURL=blob=>{saved.push(blob);return 'blob:ues-test-'+saved.length};
w.URL.revokeObjectURL=url=>revoked.push(url);
w.HTMLAnchorElement.prototype.click=function(){assert.equal(this.download,'ues-color-handoff-brief.txt')};
w.print=()=>prints++;
w.eval(fs.readFileSync(root+'study.js','utf8'));
let assertions=0;
function check(value,expected){assert.equal(value,expected);assertions++}
function submit(id,value){const form=d.querySelector('[data-question="'+id+'"]');if(value){form.querySelector('[value="'+value+'"]').checked=true;form.dispatchEvent(new w.Event('change',{bubbles:true}))}form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));return form}
test('UES color study supports repeated learning, private safe brief updates and exports', async () => {
check(d.querySelectorAll('h1').length,1);
check(d.querySelectorAll('#palette-swatches .palette-swatch').length,4);
check(d.querySelectorAll('button:disabled').length,0);
submit('context'); check(d.querySelector('#feedback-context').textContent.startsWith('Choose one'),true);
for(let i=0;i<3;i++){
const f=submit('context','wrong-file');check(f.dataset.result,'retry');
submit('context','appearance');check(f.dataset.result,'correct');
submit('material','proof');submit('handoff','conditions');
check(d.querySelector('#quiz-progress').textContent.startsWith('3 of 3 questions checked · 3 of 3 understood'),true);
d.querySelector('#reset-checks').click();check(d.querySelectorAll('.quiz input:checked').length,0);check(d.querySelectorAll('.quiz[data-result]').length,0);
}
d.querySelector('#project').value='<img src=x onerror=alert(1)> & "sample"';
d.querySelector('#project').dispatchEvent(new w.Event('input',{bubbles:true}));
check(d.querySelector('#brief-output').textContent.includes('<img src=x'),true);check(d.querySelector('#brief-output img'),null);
for(const key of ['workshop','evening','harbor','workshop']){d.querySelector('#palette').value=key;d.querySelector('#palette').dispatchEvent(new w.Event('change',{bubbles:true}));check(d.querySelectorAll('.palette-swatch').length,4)}
for(const box of d.querySelectorAll('[name="ready"]')){box.checked=true;box.dispatchEvent(new w.Event('change',{bubbles:true}))}
check(d.querySelector('#brief-progress').textContent,'6 of 6 handoff checks reviewed');
check(d.querySelector('#brief-output').textContent.includes('HANDOFF REVIEW (6/6)'),true);
d.querySelector('#download-brief').click();d.querySelector('#download-brief').click();
check(saved.length,2);check(saved[0].type,'text/plain;charset=utf-8');
d.querySelector('#print-brief').click();check(prints,1);
d.querySelector('#brief-form').reset();await new Promise(r=>setTimeout(r,20));
check(d.querySelector('#project').value,'El Segundo maker market');check(d.querySelectorAll('[name="ready"]:checked').length,0);
check(d.querySelector('#brief-output').textContent.includes('HANDOFF REVIEW (0/6)'),true);
await new Promise(r=>setTimeout(r,1050));check(revoked.length,2);check(errors.length,0);
const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);check(new Set(ids).size,ids.length);
const localLinks=[...d.querySelectorAll('a[href^="#"]')].filter(a=>!d.getElementById(a.hash.slice(1)));check(localLinks.length,0);
console.log(JSON.stringify({passed:true,assertions,quizCycles:3,paletteChanges:4,downloads:2,printCalls:prints,errors},null,2));w.close();
});
