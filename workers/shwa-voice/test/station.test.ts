import test from 'node:test';
import assert from 'node:assert/strict';
import { appendCaption, spotifyEmbed } from '../../../src/components/shwa/lib/station.ts';
import { approveQuote, publicPaymentURL, BASE_USDC } from '../../../src/components/shwa/lib/payments.ts';
test('overlapping voice captions append independently without deleting spaces',()=>{
 let rows=appendCaption([],'you','What is ',100,200);
 rows=appendCaption(rows,'electro','Let’s ',150,220);
 rows=appendCaption(rows,'you','an orbital garden?',201,500);
 assert.equal(rows.length,2);assert.equal(rows[0].text,'What is an orbital garden?');assert.equal(rows[1].text,'Let’s ');
 assert.equal(appendCaption(rows,'you','A new thought.',5000,6000).length,3);
});
test('Spotify embeds accept only supported public entity URLs',()=>{
 assert.equal(spotifyEmbed('https://open.spotify.com/intl-en/track/1234567890abcdefghijkl?si=private'),'https://open.spotify.com/embed/track/1234567890abcdefghijkl?theme=0');
 for(const value of ['https://evil.test/track/1234567890abcdefghijkl','https://open.spotify.com.evil.test/track/1234567890abcdefghijkl','javascript:alert(1)','https://open.spotify.com/user/person','https://open.spotify.com:443@evil.test/track/1234567890abcdefghijkl'])assert.equal(spotifyEmbed(value),null);
});
test('payment quote must match resource and exact Base USDC terms before signing',()=>{
 const url='https://service.example/item';const quote={x402Version:2,resource:{url,description:'One item',mimeType:'application/json'},accepts:[{scheme:'exact',network:'eip155:8453',asset:BASE_USDC,amount:'10000',payTo:'0x1111111111111111111111111111111111111111',maxTimeoutSeconds:60,extra:{name:'USD Coin',version:'2'}}]};
 assert.equal(approveQuote(quote,url).accepts.length,1);
 for(const changes of [{amount:'1000001'},{maxTimeoutSeconds:'120'},{maxTimeoutSeconds:1.5},{network:'eip155:1'},{asset:'0x1111111111111111111111111111111111111111'},{maxTimeoutSeconds:10000},{extra:{name:'evil',version:'2'}},{extra:{name:'USD Coin',version:'2',assetTransferMethod:'permit2'}}])assert.throws(()=>approveQuote({...quote,accepts:[{...quote.accepts[0],...changes}]},url));
 assert.throws(()=>approveQuote(quote,'https://other.example/item'));
 for(const value of ['http://service.example','https://user:pass@service.example','https://127.0.0.1/test','https://host.local/pay'])assert.throws(()=>publicPaymentURL(value));
});
