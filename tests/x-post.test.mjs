import test from 'node:test';
import assert from 'node:assert/strict';
import { oauthSignature, authHeader, weightedLength, checkText, credsFor, post } from '../scripts/x-post.mjs';

test('signature matches the worked example in X\'s OAuth 1.0a docs', () => {
  const params = {
    status: 'Hello Ladies + Gentlemen, a signed OAuth request!',
    include_entities: 'true',
    oauth_consumer_key: 'xvz1evFS4wEEPTGEFPHBog',
    oauth_nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: '1318622958',
    oauth_token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
    oauth_version: '1.0',
  };
  const sig = oauthSignature({
    method: 'POST',
    url: 'https://api.twitter.com/1.1/statuses/update.json',
    params,
    consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
    tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
  });
  assert.equal(sig, 'hCtSmYh+iHYCEqBWrE7C7hYmtUk=');
});

test('header carries every oauth field and a signature', () => {
  const h = authHeader({ method: 'POST', url: 'https://api.x.com/2/tweets', creds: { apiKey: 'k', apiSecret: 's', accessToken: 't', accessSecret: 'ts' }, nonce: 'n', timestamp: '1' });
  for (const f of ['oauth_consumer_key="k"', 'oauth_nonce="n"', 'oauth_token="t"', 'oauth_signature=']) assert.ok(h.includes(f), f);
});

test('length counts a link as 23 and blocks long or empty text', () => {
  assert.equal(weightedLength('hi https://pointcast.xyz/a/very/long/path/that/is/long'), 26);
  assert.equal(checkText('   '), 'empty');
  assert.match(checkText('x'.repeat(281)), /too long/);
  assert.equal(checkText('x'.repeat(280)), 'ok');
});

test('credentials need all four secrets for that account', () => {
  const env = { X_KANSASDAO_API_KEY: 'a', X_KANSASDAO_API_SECRET: 'b', X_KANSASDAO_ACCESS_TOKEN: 'c', X_KANSASDAO_ACCESS_SECRET: 'd' };
  assert.deepEqual(credsFor('kansasdao', env), { apiKey: 'a', apiSecret: 'b', accessToken: 'c', accessSecret: 'd' });
  assert.equal(credsFor('kansasdao', { ...env, X_KANSASDAO_ACCESS_SECRET: '' }), null);
  assert.equal(credsFor('uofelsegundo', env), null);
});

test('post sends JSON text and reply id, and surfaces API errors', async () => {
  let seen;
  const ok = async (url, init) => { seen = { url, init }; return { ok: true, json: async () => ({ data: { id: '42' } }) }; };
  const creds = { apiKey: 'k', apiSecret: 's', accessToken: 't', accessSecret: 'ts' };
  assert.deepEqual(await post({ text: 'gm', replyTo: '7', creds, fetcher: ok }), { id: '42' });
  assert.equal(seen.url, 'https://api.x.com/2/tweets');
  assert.deepEqual(JSON.parse(seen.init.body), { text: 'gm', reply: { in_reply_to_tweet_id: '7' } });
  const bad = async () => ({ ok: false, status: 402, json: async () => ({ title: 'CreditsDepleted' }) });
  await assert.rejects(post({ text: 'gm', creds, fetcher: bad }), /X API 402/);
});
