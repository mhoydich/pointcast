import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

for (const room of ['/nouns-money/workshop', '/ues/currency-lab', '/case-studies/launchpad']) test(room+' canonical reads remain quiet and byte-preserving without affecting neighbors', async () => {
  const server = await createServer({configFile:false,appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[],include:[]},server:{middlewareMode:true,hmr:false,ws:false}});
  const previousRewriter = globalThis.HTMLRewriter;
  let transforms = 0;
  class Rewriter {
    on(){return this;}
    transform(response){transforms++;return response;}
  }
  globalThis.HTMLRewriter = Rewriter;
  try {
    const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
    const source = '<!doctype html><html><head><title>Motors fixture</title></head><body>Concept</body></html>';
    for (const method of ['GET','HEAD']) {
      for (const ua of ['Mozilla/5.0 Chrome/140.0','ClaudeBot']) {
        transforms = 0;
        let nextCalls = 0;
        const response = await onRequest({
          request:new Request('https://pointcast.xyz'+room+'/?source=case',{method,headers:{accept:'text/html','user-agent':ua}}),
          env:{VISITS:{}},
          next:async()=>{nextCalls++;return new Response(method==='HEAD'?null:source,{headers:{'content-type':'text/html; charset=utf-8'}});},
          waitUntil:()=>assert.fail('Paper rooms must not log crawler visits'),
        });
        assert.equal(response.status,200);
        assert.equal(nextCalls,1);
        assert.equal(transforms,0,'Paper rooms retain authored metadata and receives no account bridge');
        assert.equal(response.headers.get('set-cookie'),null);
        assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'),null);
        assert.equal(await response.text(),method==='HEAD'?'':source);
      }
      for (const path of [room,room+'.html',room+'/index',room+'/index.html']) {
        const response = await onRequest({
          request:new Request('https://pointcast.xyz'+path+'?source=case',{method}),env:{},
          next:()=>assert.fail('Alias should redirect'),waitUntil:()=>assert.fail('Alias should not log'),
        });
        assert.equal(response.status,301);
        assert.equal(response.headers.get('location'),'https://pointcast.xyz'+room+'/?source=case');
      }
    }
    for (const pathname of [room+'-neighbor/',room+'/notes/']) {
      transforms=0;
      await onRequest({request:new Request('https://pointcast.xyz'+pathname,{headers:{accept:'text/html','user-agent':'Mozilla/5.0 Chrome/140.0'}}),env:{},next:async()=>new Response(source,{headers:{'content-type':'text/html'}}),waitUntil:()=>assert.fail('Fixture has no visit binding')});
      assert.ok(transforms>0,'Neighboring pages retain normal middleware');
    }
  } finally {
    if(previousRewriter===undefined)delete globalThis.HTMLRewriter;else globalThis.HTMLRewriter=previousRewriter;
    await server.close();
  }
});
