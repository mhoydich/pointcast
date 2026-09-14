import test from 'node:test';
import assert from 'node:assert/strict';
import { appendCard,parseCard,sampleCards,safeSource } from '../../../src/components/shwa/lib/canvas.ts';
import { contextUpdate } from '../../../src/components/shwa/lib/context.ts';
import { parseResearch,researchRequest } from '../src/studio.ts';
test('canvas only accepts known bounded renderers with valid interaction ranges',()=>{
 for(const sample of sampleCards())assert.equal(parseCard(sample).kind,sample.kind);
 const slider=sampleCards().find(c=>c.kind==='slider')!;
 for(const change of [{step:0},{max:0},{value:Infinity},{min:90,value:35}])assert.throws(()=>parseCard({...slider,...change}));
 assert.throws(()=>parseCard({...slider,kind:'html'}));assert.throws(()=>parseCard({...sampleCards()[0],options:['same','same']}));
 const result=parseCard({...slider,onclick:'evil()',html:'<script>bad</script>'});assert.equal('onclick' in result,false);assert.equal('html' in result,false);
});
test('canvas deduplicates titles and bounds history',()=>{
 const card=parseCard(sampleCards()[0]);let items=appendCard([],card,100);assert.equal(appendCard(items,card,101),items);
 for(let i=0;i<30;i++)items=appendCard(items,{...card,title:'Choice '+i},1000+i);
 assert.equal(items.length,24);assert.equal(items.at(-1)?.title,'Choice 29');
});
test('UI context remains bounded even with multibyte data',()=>{
 for(const text of ['a'.repeat(10000),'🎨'.repeat(1000),'決定'.repeat(1000)]){const result=contextUpdate('canvas',text);assert.ok(new TextEncoder().encode(result).length<=470);assert.ok(!result.includes('\ufffd'));}
});
test('research requires completed searches and native citations, with tool fees for searches only',()=>{
 const response={status:'completed',output:[{type:'web_search_call',status:'completed',action:{type:'search'}},{type:'web_search_call',status:'completed',action:{type:'open_page'}},{type:'message',content:[{type:'output_text',text:'Claim [1]',annotations:[{type:'url_citation',start_index:6,end_index:9,url:'https://example.org/page',title:'Source'}]}]}],usage:{input_tokens:100,output_tokens:50}};
 const result=parseResearch(response);assert.equal(result.parts[0].citations[0].url,'https://example.org/page');assert.ok(Math.abs(result.estimatedCost-.01008)<1e-12);
 assert.throws(()=>parseResearch({...response,status:'incomplete'}));assert.throws(()=>parseResearch({...response,output:response.output.slice(2)}));
 assert.equal(safeSource('javascript:alert(1)'),null);assert.equal(safeSource('https://secret@example.org'),null);
 const bad=structuredClone(response);bad.output[2].content![0].annotations[0].url='javascript:alert(1)';assert.throws(()=>parseResearch(bad));
 const body=researchRequest('bounded question');assert.equal(body.max_tool_calls,2);assert.equal(body.store,false);assert.equal(body.tool_choice,'required');
});
