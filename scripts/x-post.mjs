// x-post.mjs — post to an X account from the cloud through the official X API,
// so posting doesn't depend on a browser on the Mac.
//
// Run by .github/workflows/x-post.yml (workflow_dispatch), which any agent with
// repo access can start:  gh workflow run x-post.yml -f account=kansasdao -f text="..."
//
// Each account needs four repository secrets, from a console.x.com app with
// Read and Write permission and that account's own access token (OAuth 1.0a,
// which doesn't expire):
//   X_<ACCOUNT>_API_KEY, X_<ACCOUNT>_API_SECRET,
//   X_<ACCOUNT>_ACCESS_TOKEN, X_<ACCOUNT>_ACCESS_SECRET
// Without them the script prints what it would post and exits 0 (dry run).
//
// Cost (docs.x.com pricing, pay-per-use): about $0.015 per post, $0.20 per post
// that carries a URL. The account's spending cap in the X console is the limit.

import crypto from 'node:crypto';
import { appendFileSync } from 'node:fs';

const ENDPOINT = 'https://api.x.com/2/tweets';
const URL_RE = /https?:\/\/\S+/g;

export const pct = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

// OAuth 1.0a HMAC-SHA1 signature over method, URL and every query/body/oauth param.
export function oauthSignature({ method, url, params, consumerSecret, tokenSecret }) {
  const normalized = Object.keys(params).sort().map(k => `${pct(k)}=${pct(params[k])}`).join('&');
  const base = [method.toUpperCase(), pct(url), pct(normalized)].join('&');
  const key = `${pct(consumerSecret)}&${pct(tokenSecret || '')}`;
  return crypto.createHmac('sha1', key).update(base).digest('base64');
}

export function authHeader({ method, url, creds, nonce = crypto.randomBytes(16).toString('hex'), timestamp = Math.floor(Date.now() / 1000).toString(), extraParams = {} }) {
  const oauth = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  };
  // A JSON body is not part of the signature; only query and form params are.
  oauth.oauth_signature = oauthSignature({ method, url, params: { ...extraParams, ...oauth }, consumerSecret: creds.apiSecret, tokenSecret: creds.accessSecret });
  return 'OAuth ' + Object.keys(oauth).sort().map(k => `${pct(k)}="${pct(oauth[k])}"`).join(', ');
}

// X counts every URL as 23 characters.
export function weightedLength(text) {
  return [...text.replace(URL_RE, 'x'.repeat(23))].length;
}

export function checkText(text) {
  const t = (text || '').trim();
  if (!t) return 'empty';
  if (weightedLength(t) > 280) return `too long (${weightedLength(t)} of 280)`;
  return 'ok';
}

export function credsFor(account, env = process.env) {
  const p = `X_${account.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_`;
  const creds = { apiKey: env[p + 'API_KEY'], apiSecret: env[p + 'API_SECRET'], accessToken: env[p + 'ACCESS_TOKEN'], accessSecret: env[p + 'ACCESS_SECRET'] };
  return Object.values(creds).every(Boolean) ? creds : null;
}

export async function post({ text, replyTo, creds, fetcher = fetch }) {
  const body = { text };
  if (replyTo) body.reply = { in_reply_to_tweet_id: String(replyTo) };
  const res = await fetcher(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: authHeader({ method: 'POST', url: ENDPOINT, creds }), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X API ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  return json.data;
}

async function main() {
  const account = (process.env.X_ACCOUNT || '').trim().replace(/^@/, '').toLowerCase();
  const text = process.env.X_TEXT || '';
  const replyTo = (process.env.X_REPLY_TO || '').trim();
  if (!/^[a-z0-9_]{1,15}$/.test(account)) throw new Error(`not an X handle: "${account}"`);
  const verdict = checkText(text);
  if (verdict !== 'ok') throw new Error(`not posted: text is ${verdict}`);
  const hasUrl = /https?:\/\/\S+/.test(text);
  const creds = credsFor(account);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  const note = line => { console.log(line); if (summary) appendFileSync(summary, line + '\n'); };
  if (!creds) {
    note(`Dry run: no X_${account.toUpperCase()}_* secrets, so nothing was posted to @${account}.`);
    note(`Would post (${weightedLength(text)} chars${hasUrl ? ', has a link' : ''}${replyTo ? `, reply to ${replyTo}` : ''}):\n\n${text}`);
    return;
  }
  const data = await post({ text: text.trim(), replyTo, creds });
  note(`Posted to @${account}: https://x.com/${account}/status/${data.id}`);
}

if (process.argv[1] && process.argv[1].endsWith('x-post.mjs')) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}
