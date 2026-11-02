import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundled = await build({entryPoints:[new URL('../functions/_middleware.ts',import.meta.url).pathname],bundle:true,platform:'browser',format:'esm',write:false,logLevel:'silent'});
const {onRequest} = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
test('actual middleware canonicalizes GET and HEAD preview directories before assets or logging', async () => {
  for (const method of ['GET','HEAD']) {
    for (const path of ['/signal-atlas','/signal-atlas/observatory']) {
      let nextCalls = 0;
      const response = await onRequest({
        request:new Request('https://pointcast.xyz'+path+'?sample=one%20two',{method}),
        env:new Proxy({}, {get(){assert.fail('preview must not inspect bindings');}}),
        next:async()=>{nextCalls++;return new Response('should not run');},
        waitUntil:()=>assert.fail('preview must not schedule logs'),
      });
      assert.equal(response.status,308);
      assert.equal(response.headers.get('location'),'https://pointcast.xyz'+path+'/?sample=one%20two');
      assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
      assert.equal(nextCalls,0);
    }
  }
});
test('actual middleware serves preview HTML and modules once without session or log changes', async () => {
  for (const method of ['GET','HEAD']) {
    for (const path of ['/signal-atlas/','/signal-atlas/observatory/','/signal-atlas/app.mjs']) {
      let nextCalls = 0;
      const response = await onRequest({
        request:new Request('https://pointcast.xyz'+path,{method}),
        env:new Proxy({}, {get(){assert.fail('preview must not inspect bindings');}}),
        next:async()=>{nextCalls++;return new Response('asset',{headers:{'content-type':'text/plain'}});},
        waitUntil:()=>assert.fail('preview must not schedule logs'),
      });
      assert.equal(response.status,200);
      assert.equal(await response.text(),'asset');
      assert.equal(response.headers.get('set-cookie'),null);
      assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
      assert.equal(nextCalls,1);
    }
  }
});
