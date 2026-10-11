// Nouns Money shelf on pointcast.xyz: card states, Collect on devnet, receipt.
//
// Rendered only while NM_CHAIN_ENABLED is on (src/components/NounsMoneyChainShelf.astro).
// Every word it shows comes from the config island (src/lib/nouns-money/chain-copy.mjs);
// every fact comes from devnet-2 reads checked against /nouns-money/chain.json.
//
// Reads:  GET /status (house), GET /edition/nouns-money-27/mints, GET /account/<addr>,
//         GET /tx/<hash>, plus connect() (params, genesis pinned).
// Writes, only after a click and the passkey's own prompt:
//         POST /nm/claim {sender, design}  → an approval for a server-built recipe,
//         checked by verifyClaim() against chain.json before anything is signed;
//         POST /tx with the passkey-signed edition_mint.
import { buildTx, connect, domainOf, signWithPasskey } from '../../chain/first-mints/lib/pointcast-chain.js';
import { nm27Label, recipeIndex } from './nm-recipe.js';
import { cardView, fetchAllMints, findByRecipeHash, indexMints, verifyClaim } from './nm-shelf.js';
import { createWallet, loadWallet, saveWallet } from './nm-wallet.js';

const fill = (t, v = {}) => String(t).replace(/\{(\w+)\}/g, (w, k) => (k in v ? String(v[k]) : w));

for (const root of document.querySelectorAll('[data-nm-chain-shelf]')) init(root);

async function init(root) {
  let cfg;
  try {
    cfg = JSON.parse(root.querySelector('[data-nm-chain-config]').textContent);
  } catch {
    return;
  }
  const { devnet, copy: C } = cfg;
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const say = (text, cls = '') => {
    const el = $('[data-nmc-status]');
    el.textContent = text;
    el.className = `nmc-status ${cls}`.trim();
  };
  const lock = () => $$('button').forEach((b) => (b.disabled = true));

  // Reads need nothing; collecting needs a passkey, and a passkey needs pointcast.xyz.
  const offOrigin = !devnet.origins.includes(location.origin);
  const noPasskeys = !window.PublicKeyCredential || !navigator.credentials;
  const blocked = offOrigin ? C.status.offOrigin : noPasskeys ? C.status.noWebauthn : '';
  if (offOrigin) $('[data-nmc-off]').hidden = false;
  if (!/^[0-9a-f]{64}$/.test(devnet.genesis || '')) {
    lock();
    return say(C.status.noGenesis, 'is-warn');
  }

  const call = async (path, init) => {
    const r = await fetch(devnet.api + path, { ...init, signal: AbortSignal.timeout(init ? 20000 : 10000) });
    let j = null;
    try {
      j = await r.json();
    } catch {
      j = null;
    }
    return { ok: r.ok, status: r.status, j };
  };
  // A read that is refused or fails throws: it never stands in for "closed" or "nothing minted".
  const get = async (path) => {
    const r = await call(path);
    if (!r.ok || !r.j) throw new Error(errText(r));
    return r.j;
  };
  const post = (path, body) => call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const errText = (r) => (r.j && (r.j.code ? `${r.j.code}: ${r.j.error || ''}` : r.j.error)) || `HTTP ${r.status}`;

  let wallet = loadWallet(localStorage, devnet.walletKey);
  let chain = null;
  let house = '';
  let state = 'reading'; // 'reading' | 'failed' | 'closed' | 'open'
  let entries = [];
  let index = new Map();
  let shelf = null;

  const showWallet = () => {
    $('[data-nmc-addr]').textContent = wallet ? wallet.address : C.shelf.walletNone;
    $('[data-nmc-create]').hidden = Boolean(wallet);
    $('[data-nmc-create]').disabled = Boolean(blocked);
  };
  const paintShelf = () => {
    for (const card of $$('[data-nmc-design]')) {
      const design = Number(card.dataset.nmcDesign);
      const view = cardView(state, {
        slot: shelf ? shelf.byDesign.get(design) : null,
        house,
        shelf: C.shelf,
        copies: cfg.copies,
        canCollect: !blocked && Boolean(wallet),
      });
      card.querySelector('[data-nmc-line]').textContent = view.line;
      card.querySelector('[data-nmc-collect]').disabled = !view.enabled;
    }
  };
  // Only a full, successful read changes the shelf; a failed read throws and leaves it as it was.
  const readShelf = async () => {
    const r = await fetchAllMints(get, devnet.edition);
    shelf = r.open ? indexMints(r.mints, index) : null;
    state = r.open ? 'open' : 'closed';
    paintShelf();
    return r;
  };

  showWallet();
  say(C.status.loading);
  const fail = (template, e) => {
    state = 'failed';
    lock();
    paintShelf();
    say(fill(template, { why: e.message }), 'is-warn');
  };
  try {
    chain = await connect(devnet.api, { expect: { chainId: devnet.chainId, genesisHash: devnet.genesis } });
  } catch (e) {
    return fail(C.status.wrongChain, e);
  }
  try {
    const res = await fetch(devnet.chainJson, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${devnet.chainJson}: HTTP ${res.status}`);
    entries = (await res.json()).entries;
    index = recipeIndex(entries);
    house = String((await get('/status')).house || '');
    await readShelf();
  } catch (e) {
    return fail(C.status.unreadable, e);
  }
  if (state !== 'open') {
    lock();
    return say(C.status.notOpen, 'is-warn');
  }
  if (blocked) return say(blocked, 'is-warn');
  say(wallet ? C.status.ready : C.status.needWallet);

  $('[data-nmc-create]').addEventListener('click', async () => {
    try {
      say(C.status.waitingPasskey);
      wallet = await createWallet(devnet.rpId);
      saveWallet(wallet, localStorage, devnet.walletKey);
      showWallet();
      paintShelf();
      say(C.status.walletMade, 'is-ok');
    } catch (e) {
      say(fill(C.status.noWallet, { why: e.message }), 'is-warn');
    }
  });

  const receipt = (fields) => {
    const box = $('[data-nmc-receipt]');
    box.hidden = false;
    for (const [k, v] of Object.entries(fields)) {
      const el = box.querySelector(`[data-nmc-r="${k}"]`);
      if (el) el.textContent = v;
    }
    return box;
  };

  for (const btn of $$('[data-nmc-collect]')) {
    btn.addEventListener('click', async () => {
      const design = Number(btn.dataset.nmcCollect);
      const entry = entries.find((e) => e.design === design);
      if (blocked) return say(blocked, 'is-warn');
      if (!wallet || !chain || !entry) return say(C.status.needWallet, 'is-warn');
      lock();
      try {
        say(fill(C.status.asking, { nounId: entry.noun_id }));
        const claim = await post(devnet.claimPath, { sender: wallet.address, design });
        if (!claim.ok) return say(fill(C.status.refused, { why: errText(claim) }), 'is-warn');
        // One claim per passkey per UTC day: a repeat returns today's live approval,
        // possibly for another design. It is checked against chain.json all the same.
        let target = entry;
        if (claim.j && claim.j.duplicate === true && Number(claim.j.design) !== design) {
          target = entries.find((e) => e.design === Number(claim.j.design)) || entry;
        }
        let ok;
        try {
          ok = verifyClaim(claim.j, { entry: target, sender: wallet.address });
        } catch (e) {
          return say(fill(C.status.mismatch, { why: e.message }), 'is-warn');
        }
        if (target !== entry) say(fill(C.status.duplicate, { copy: ok.copy, nounId: target.noun_id }));
        const acct = await get(`/account/${encodeURIComponent(wallet.address)}`);
        const nonce = Number(acct.next_nonce ?? 0);
        const tx = buildTx('edition_mint', {
          sender: wallet.address,
          nonce,
          edition: devnet.edition,
          recipient: wallet.address,
          recipe: ok.recipe,
          approval_expires: ok.approval_expires,
          approval: ok.approval,
        });
        const words = [
          C.confirm.title,
          fill(C.confirm.note, { nounId: target.noun_id, copy: ok.copy, copies: cfg.copies }),
          fill(C.confirm.recipe, { hash: `${ok.recipeHash.slice(0, 16)}…` }),
          C.replacementLine,
          C.standardLine,
        ];
        const signed = await signWithPasskey(tx, domainOf(devnet.chainId, devnet.genesis), {
          publicKey: wallet.publicKey,
          credentialId: wallet.credentialId,
          rpId: devnet.rpId,
          params: chain.params,
          confirm: async (w) => window.confirm([...words, '', w.title, ...(w.allowed || []), ...(w.not_allowed || []), `Lasts: ${w.lasts}`, `Undo: ${w.undo}`].join('\n')),
        });
        say(C.status.sending);
        const sent = await post('/tx', signed);
        if (!sent.ok) return say(fill(C.status.refused, { why: errText(sent) }), 'is-warn');
        const txHash = String(sent.j.tx_hash || sent.j.hash || '');
        receipt({
          note: `${fill(C.shelf.noun, { nounId: target.noun_id })} · ${target.id}`,
          copy: `${ok.copy} / ${cfg.copies}`,
          recipeHash: ok.recipeHash,
          tx: txHash,
          serial: C.receipt.serialPending,
          owner: wallet.address,
        });
        say(fill(C.status.sent, { tx: `${txHash.slice(0, 16)}…` }), 'is-ok');
        for (let i = 0; i < 12; i += 1) {
          await new Promise((r) => setTimeout(r, 5000));
          const r = await readShelf().catch(() => null);
          const token = r && findByRecipeHash(r.mints, ok.recipeHash);
          if (token) {
            const label = nm27Label(Number(token.serial));
            const box = receipt({ serial: label, owner: String(token.owner) });
            const link = box.querySelector('[data-nmc-note-link]');
            link.href = `/nouns-money/note/${Number(token.serial)}/`;
            link.hidden = false;
            return say(fill(C.status.landed, { label, nounId: target.noun_id, copy: ok.copy, copies: cfg.copies }), 'is-ok');
          }
        }
        say(C.status.pending);
      } catch (e) {
        say(fill(C.status.refused, { why: e.message }), 'is-warn');
      } finally {
        showWallet();
        paintShelf();
      }
    });
  }
}
