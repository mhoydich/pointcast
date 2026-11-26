// The prayer site links relatively, so its rooms must load at slash URLs,
// and it is served as authored, with no session bridge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { isStandaloneStaticRoom } from '../src/lib/standalone-static-rooms.mjs';

test('pray paths are standalone rooms; neighbours are not', () => {
  for (const p of ['/pray', '/pray/', '/pray/fire/', '/pray/pray.js', '/pray/bell/']) assert.equal(isStandaloneStaticRoom(p), true, p);
  for (const p of ['/prayer', '/prayers/', '/baby-bonfire/prayer/', '/b/pray/']) assert.equal(isStandaloneStaticRoom(p), false, p);
});

test('no-slash pray rooms redirect to their slash URL and keep the query', async () => {
  const server = await createServer({configFile:false,appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[],include:[]},server:{middlewareMode:true,hmr:false,ws:false}});
  const previousRewriter = globalThis.HTMLRewriter;
  let transforms = 0;
  globalThis.HTMLRewriter = class { on(){return this;} transform(r){transforms++;return r;} };
  try {
    const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
    for (const method of ['GET','HEAD']) {
      for (const path of ['/pray','/pray/fire','/pray/bell','/pray/sit']) {
        const response = await onRequest({
          request:new Request('https://pointcast.xyz'+path+'?for=Ana',{method,headers:{accept:'text/html'}}),env:{},
          next:()=>assert.fail('should redirect'),waitUntil:()=>{},
        });
        assert.equal(response.status,301,path);
        assert.equal(response.headers.get('location'),'https://pointcast.xyz'+path+'/?for=Ana');
      }
    }
    const source = '<!doctype html><html><head><title>Pray</title></head><body>Door</body></html>';
    const response = await onRequest({
      request:new Request('https://pointcast.xyz/pray/',{headers:{accept:'text/html','user-agent':'Mozilla/5.0 Chrome/140.0'}}),env:{},
      next:async()=>new Response(source,{headers:{'content-type':'text/html; charset=utf-8'}}),waitUntil:()=>{},
    });
    assert.equal(response.status,200);
    assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'),null);
    assert.doesNotMatch(await response.text(),/data-pointcast-tezos-session-bridge/);
  } finally {
    globalThis.HTMLRewriter = previousRewriter;
    await server.close();
  }
});
