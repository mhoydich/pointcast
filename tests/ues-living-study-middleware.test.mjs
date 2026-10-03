import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('real Pages middleware keeps quiet studies isolated through both HTML delivery branches',async()=>{
  const server = await createServer({configFile:false,appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[],include:[]},server:{middlewareMode:true,hmr:false,ws:false}});
  const originalFetch = globalThis.fetch;
  const originalRewriter = globalThis.HTMLRewriter;
  let bridgeTransforms=0;
  class FakeRewriter {
    handlers=[];
    on(selector,handler){this.handlers.push({selector,handler});return this;}
    transform(response){
      for(const {selector,handler} of this.handlers) {
        if(selector==='body') handler.element({append(html){if(html.includes('data-pointcast-tezos-session-bridge'))bridgeTransforms++;}});
      }
      return response;
    }
  }
  const html=()=>new Response('<!doctype html><html lang="en"><head><title>Fixture</title></head><body>Public study</body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
  try {
    globalThis.HTMLRewriter=FakeRewriter;
    globalThis.fetch=async(input)=>{
      assert.ok(new URL(String(input)).pathname.endsWith('/'),'no-slash delivery internally requests the slash document');
      return html();
    };
    const {onRequest}=await server.ssrLoadModule('/functions/_middleware.ts');
    async function route(pathname,contentType='text/html; charset=utf-8') {
      bridgeTransforms=0;
      const response=await onRequest({
        request:new Request(`https://pointcast.xyz${pathname}`,{headers:{accept:contentType,'user-agent':'Mozilla/5.0 (Macintosh) Chrome/140.0'}}),
        env:{},next:async()=>contentType.startsWith('text/html')?html():new Response('{"fixture":true}',{headers:{'Content-Type':contentType}}),
        waitUntil:()=>assert.fail('public fixture requests should not log visits'),
      });
      return {response,bridgeTransforms};
    }
    for(const slug of ['death']) {
      for(const suffix of ['','/','.html','/index.html']) {
        const {response,bridgeTransforms}=await route(`/ues/${slug}${suffix}`);
        assert.equal(response.status,200);
        assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'),null);
        assert.equal(bridgeTransforms,0,`quiet ${slug}${suffix} does not receive the account bridge`);
      }
    }
    for(const pathname of ['/ues/','/ues/plant-portraits/','/me','/ues/grief/notes','/ues/grief/','/ues/human-energy/','/ues/nature-interaction/','/ues/frequency/','/ues/human-energy/adult-substances/']) {
      const {response,bridgeTransforms}=await route(pathname);
      assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'),'1',pathname);
      assert.equal(bridgeTransforms,1,`${pathname} keeps existing session restoration`);
    }
    for(const pathname of ['/api/auth/session','/ues/grief.json']) {
      const {response,bridgeTransforms}=await route(pathname,'application/json');
      assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'),null);
      assert.equal(bridgeTransforms,0);
      assert.equal(await response.text(),'{"fixture":true}');
    }
  } finally {
    globalThis.fetch=originalFetch;
    if(originalRewriter===undefined)delete globalThis.HTMLRewriter;else globalThis.HTMLRewriter=originalRewriter;
    await server.close();
  }
});
