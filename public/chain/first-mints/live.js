// First Mints, live on pointcast-devnet-2.
//
// A passkey wallet and one First Mint per passkey account, on the public
// devnet. No value is promised; the devnet may reset. Everything here runs in
// the visitor's browser:
//   - the passkey is created and used with rp id "pointcast.xyz", so it only
//     works on https://pointcast.xyz (devnet-2 launch record 7 checks the rp id
//     hash and the origin). Anywhere else the page says so and asks nothing.
//   - reads: GET /status, /params (via the SDK's connect, genesis pinned),
//     /edition/first-mints, /account/<addr>
//   - writes: POST /edition/first-mints/approve (the devnet's attestor signs an
//     approval for this exact recipe), then POST /tx with the passkey-signed
//     edition_mint. Nothing is sent before the person reads the plain words
//     and agrees.
// lib/pointcast-chain.js and lib/first-mint.js are copies of pointcast-chain
// sdk/ at main 33a2ba9 (sha256 pinned in tests/chain-devnet-reset.test.mjs).
import { buildTx, connect, domainOf, passkeyAddress, signWithPasskey, bytesToHex } from './lib/pointcast-chain.js';
import { RANGES, TEXT_CHARSET, validate, encodeRecipe, renderCard, auditSvg } from './lib/first-mint.js';

const root = document.querySelector('[data-fm-live]');
if (root) init(root);

function init(root) {
  const cfg = {
    api: root.dataset.api,
    chainId: root.dataset.chain,
    genesis: root.dataset.genesis,
    rpId: root.dataset.rp,
    origins: (root.dataset.origins || '').split(' ').filter(Boolean),
    edition: root.dataset.edition || 'first-mints',
    approvePath: root.dataset.approve || '/edition/first-mints/approve',
  };
  const $ = (s) => root.querySelector(s);
  const say = (s, cls = '') => {
    const el = $('[data-fm-status]');
    el.textContent = s;
    el.className = `fm-live__status ${cls}`;
  };
  const KEY = 'pc-fm-live:devnet-2';
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  };
  const save = (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* private window: the passkey still exists, only this browser forgets its id */
    }
  };

  if (!cfg.origins.includes(location.origin)) {
    $('[data-fm-off]').hidden = false;
    root.querySelectorAll('button').forEach((b) => (b.disabled = true));
    say('Passkeys work only on pointcast.xyz.', 'is-warn');
    return;
  }
  if (!/^[0-9a-f]{64}$/.test(cfg.genesis || '')) {
    root.querySelectorAll('button').forEach((b) => (b.disabled = true));
    say('Not live yet: the devnet-2 genesis is not pinned in this build.', 'is-warn');
    return;
  }
  if (!window.PublicKeyCredential || !navigator.credentials) {
    root.querySelectorAll('button').forEach((b) => (b.disabled = true));
    say('This browser has no passkeys (WebAuthn).', 'is-warn');
    return;
  }

  let wallet = load();
  let chain = null;
  const showWallet = () => {
    $('[data-fm-addr]').textContent = wallet ? wallet.address : 'none yet';
    $('[data-fm-create]').hidden = Boolean(wallet);
    $('[data-fm-mintbox]').hidden = !wallet;
  };
  showWallet();

  const get = async (p) => {
    const r = await fetch(cfg.api + p, { signal: AbortSignal.timeout(10000) });
    let j = null;
    try {
      j = await r.json();
    } catch {
      j = null;
    }
    return { ok: r.ok, status: r.status, j };
  };
  const post = async (p, body) => {
    const r = await fetch(cfg.api + p, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    let j = null;
    try {
      j = await r.json();
    } catch {
      j = null;
    }
    return { ok: r.ok, status: r.status, j };
  };
  const errText = (r) => (r.j && (r.j.code ? `${r.j.code}: ${r.j.error || ''}` : r.j.error)) || `HTTP ${r.status}`;

  // ---- the edition, read live
  (async () => {
    try {
      chain = await connect(cfg.api, { expect: { chainId: cfg.chainId, genesisHash: cfg.genesis } });
    } catch (e) {
      say(`The devnet is not the chain this page expects (${e.message}). Nothing will be signed.`, 'is-warn');
      root.querySelectorAll('button').forEach((b) => (b.disabled = true));
      return;
    }
    const ed = await get(`/edition/${cfg.edition}`).catch(() => null);
    const open = ed && ed.ok && ed.j;
    $('[data-fm-edition]').textContent = open
      ? `Open · ${Number(ed.j.minted ?? 0).toLocaleString('en-US')} of ${Number(ed.j.supply ?? ed.j.terms?.supply ?? 0).toLocaleString('en-US')} minted`
      : 'Not open yet on devnet-2';
    if (!open) $('[data-fm-mint]').disabled = true;
    say(wallet ? 'Ready.' : 'Make a passkey wallet to begin.');
  })();

  // ---- passkey wallet
  $('[data-fm-create]').addEventListener('click', async () => {
    try {
      say('Waiting for your passkey…');
      const cred = await navigator.credentials.create({
        publicKey: {
          rp: { id: cfg.rpId, name: 'PointCast' },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'devnet-2 wallet', displayName: 'PointCast devnet-2' },
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
          timeout: 60000,
        },
      });
      const spki = new Uint8Array(cred.response.getPublicKey());
      const point = spki.slice(spki.length - 65); // 04 ‖ X ‖ Y
      if (point[0] !== 4) throw new Error('unexpected public key format');
      const compressed = new Uint8Array(33);
      compressed[0] = point[64] & 1 ? 3 : 2;
      compressed.set(point.slice(1, 33), 1);
      const publicKey = { scheme: 'p256', bytes: bytesToHex(compressed) };
      const rawId = new Uint8Array(cred.rawId);
      const credentialId = btoa(String.fromCharCode(...rawId)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      wallet = { publicKey, credentialId, address: passkeyAddress(publicKey) };
      save(wallet);
      showWallet();
      say('Wallet made. It lives in your passkey; this browser only remembers which one.', 'is-ok');
    } catch (e) {
      say(`No wallet made: ${e.message}`, 'is-warn');
    }
  });

  // ---- one card
  const words = $('[data-fm-words]');
  let fields = null;
  const draw = () => {
    const text = words.value.toUpperCase();
    if (!text || [...text].some((c) => !TEXT_CHARSET.includes(c))) {
      $('[data-fm-card]').textContent = '';
      fields = null;
      return;
    }
    for (let tries = 0; tries < 64; tries += 1) {
      const pick = (k) => RANGES[k][0] + Math.floor(Math.random() * (RANGES[k][1] - RANGES[k][0] + 1));
      const f = Object.fromEntries(Object.keys(RANGES).map((k) => [k, pick(k)]));
      f.text = text;
      try {
        validate(f);
        const svg = renderCard(f);
        auditSvg(svg);
        fields = f;
        // renderCard + auditSvg: only the audited element/attribute set, from our own renderer.
        $('[data-fm-card]').innerHTML = svg;
        return;
      } catch {
        /* try another draw */
      }
    }
    fields = null;
  };
  words.addEventListener('input', draw);
  $('[data-fm-shuffle]').addEventListener('click', draw);

  $('[data-fm-mint]').addEventListener('click', async () => {
    if (!wallet || !fields || !chain) return say('Make a wallet and type your words first.', 'is-warn');
    try {
      const recipe = bytesToHex(encodeRecipe(fields));
      say('Asking the devnet attestor for an approval…');
      const ap = await post(cfg.approvePath, { sender: wallet.address, recipient: wallet.address, recipe });
      if (!ap.ok) return say(`Not approved: ${errText(ap)}`, 'is-warn');
      const acct = await get(`/account/${encodeURIComponent(wallet.address)}`);
      const nonce = acct.ok && acct.j ? Number(acct.j.next_nonce ?? 0) : 0;
      const tx = buildTx('edition_mint', {
        sender: wallet.address,
        nonce,
        edition: cfg.edition,
        recipient: wallet.address,
        recipe,
        approval_expires: ap.j.approval_expires,
        approval: ap.j.approval,
      });
      const domain = domainOf(cfg.chainId, cfg.genesis);
      const signed = await signWithPasskey(tx, domain, {
        publicKey: wallet.publicKey,
        credentialId: wallet.credentialId,
        rpId: cfg.rpId,
        params: chain.params,
        confirm: async (w) => window.confirm([w.title, ...(w.allowed || []), ...(w.not_allowed || []), `Lasts: ${w.lasts}`, `Undo: ${w.undo}`, 'devnet-2 · no value is promised'].join('\n')),
      });
      say('Sending…');
      const r = await post('/tx', signed);
      if (!r.ok) return say(`Not minted: ${errText(r)}`, 'is-warn');
      say(`Sent to devnet-2 as tx ${String(r.j.tx_hash || r.j.hash || '').slice(0, 16)}…. It is minted when a block includes it. Certificate: devnet-2, no value is promised.`, 'is-ok');
    } catch (e) {
      say(`Not minted: ${e.message}`, 'is-warn');
    }
  });
}
