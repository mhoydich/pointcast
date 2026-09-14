import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { discoveryPrompt, parseShwaPicks, mountShwaDashboard } from '../src/lib/auth/shwa-dashboard.ts';
const response = JSON.stringify({type:'shwa-picks',headline:'A little sound and color',note:'Try making something.',picks:[{id:'rosebud',title:'Make a beat',reason:'A small musical experiment.',firstStep:'Try three taps.'}]});
function fixture(t) {
 const dom=new JSDOM(`<section><textarea data-runtime-prompt></textarea><details data-shwa-conversation></details><div data-shwa-dashboard><h2 data-shwa-headline></h2><p data-shwa-note></p><p data-shwa-picks-label></p><button data-shwa-refresh></button><div data-shwa-cards></div><span data-shwa-history-count></span><div data-shwa-history></div></div></section><span data-live-now-title>Sun Ra</span>`,{url:'https://pointcast.xyz/connectors?token=secret#private'});
 const root=dom.window.document.querySelector('section'), calls=[];
 const dash=mountShwaDashboard(root,(...args)=>calls.push(args));
 t.after(()=>{dash.stop();dom.window.close()});
 return {dom,root,calls,dash,open(){dom.window.dispatchEvent(new dom.window.CustomEvent('pc:dock-visibility',{detail:{open:true,tray:'my-ai'}}))}};
}
test('AI cards accept only catalog IDs, bounded text, and no generated destinations',()=>{
 assert.equal(parseShwaPicks('not JSON'),null);
 assert.equal(parseShwaPicks(JSON.stringify({type:'shwa-picks',headline:'x',note:'y',picks:[{id:'https://evil.test',title:'x',reason:'x',firstStep:'x'}]})),null);
 assert.equal(parseShwaPicks('```json\n'+response+'\n```').picks[0].id,'rosebud');
 assert.ok(discoveryPrompt('page','song','I like art').length+500<4000);
});
test('opening the HUD starts one inference, excludes URL secrets, and polling never repeats it',async t=>{
 const f=fixture(t);f.dash.render([],true);assert.equal(f.calls.length,0);
 f.open();await new Promise(r=>setImmediate(r));
 assert.equal(f.calls.length,1);assert.doesNotMatch(f.calls[0][0],/token=secret|#private/);assert.match(f.calls[0][0],/Sun Ra/);
 f.dash.render([],true);f.open();await new Promise(r=>setImmediate(r));assert.equal(f.calls.length,1);
});
test('history survives rendering, drives explicit follow-up, and clears on session loss',async t=>{
 const f=fixture(t);const job={id:'one',kind:'prompt',question:'SHWA DISCOVERY\n...',status:'succeeded',createdAt:new Date().toISOString(),result:{text:response,actualModels:['real-model']}};
 f.dash.render([job],true);f.open();await new Promise(r=>setImmediate(r));assert.equal(f.calls.length,0);
 assert.equal(f.root.querySelector('[data-shwa-cards] a').getAttribute('href'),'/rosebud');
 const history=f.root.querySelector('[data-shwa-history] details');history.open=true;
 f.dash.render([job],true);assert.equal(f.root.querySelector('[data-shwa-history] details'),history);
 history.querySelector('button').click();assert.equal(f.calls[0][1],response);assert.equal(f.calls[0][2],true);
 f.dash.clear();f.dash.render([],false);assert.doesNotMatch(f.root.querySelector('[data-shwa-history]').textContent,/A little sound and color/);
});
test('private pages send no page metadata and an unavailable companion never starts',async t=>{
 const f=fixture(t);f.dom.reconfigure({url:'https://pointcast.xyz/me?secret=yes'});f.dom.window.document.title='Private profile';
 f.dash.render([],false);f.open();await new Promise(r=>setImmediate(r));assert.equal(f.calls.length,0);
 f.dash.render([],true);await new Promise(r=>setImmediate(r));assert.equal(f.calls.length,1);assert.doesNotMatch(f.calls[0][0],/Private profile|secret=yes/);
});
