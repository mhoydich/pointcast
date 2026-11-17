import * as G from './signal-run.js';
import * as C from './signal-run-chain.js';
import { mountKeyPanel } from './key-panel.js';
import { whatYouSign } from './start.js';
import { cleanText, connectPinned, makeNet, pcc, resolveApi, sendFailureText } from './chain-kit.js';

export const PASSPORT_SLOT = 'pointcast-signal-run/passport/v1';
export const RECEIPT_SLOT = 'pointcast-signal-run/receipt/v1';
function element(doc, tag, cls, text) { const el = doc.createElement(tag); if (cls) el.className = cls; if (text) el.textContent = text; return el; }
export function stampSvg(event) {
  const e = G.completedEvent(event);
  if (!e) throw new Error('Not a completed event');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900"><rect width="720" height="900" rx="40" fill="#101427"/><rect x="32" y="32" width="656" height="836" rx="24" fill="#26332d" stroke="#dcff79" stroke-dasharray="8 8"/><g fill="#dcff79" font-family="Arial,sans-serif" text-anchor="middle"><text x="360" y="110" font-size="18" letter-spacing="5">POINTCAST / EVENT PASSPORT</text><text x="360" y="390" font-size="250">✳</text><text x="360" y="505" font-size="64" font-weight="700">SIGNAL RUN</text><text x="360" y="565" font-size="32">${e.day}</text><text x="360" y="642" font-size="24">3 stages · ${e.moves} moves · ${e.spare} spare</text><text x="360" y="690" font-size="20">${e.assisted ? 'With a little guidance' : 'Found my own way'}</text><text x="360" y="780" font-size="17">LOCAL SOUVENIR / PLAYER-REPORTED RUN</text><text x="360" y="813" font-size="15">Not a token or proof of chain inclusion</text></g></svg>`;
}
export function mount(root, env = {}) {
  const doc = root.ownerDocument, win = env.window || doc.defaultView;
  const q = s => root.querySelector(s), set = (s, text) => { const n = q(s); if (n) n.textContent = text; };
  let storage = env.storage; if (storage === undefined) { try { storage = win.localStorage; } catch { storage = null; } }
  const day = G.utcDay(env.now ? env.now() : Date.now());
  const api = resolveApi(win.location.search, { api: root.dataset.api, genesis: root.dataset.genesis });
  const net = makeNet(api.api, env);
  const keys = mountKeyPanel(q('[data-key-panel]'), { ...env, window: win, storage });
  const S = { day, stage: 0, map: G.makeMap(day, 0), state: null, routes: [], assisted: false,
    passport: G.loadPassport(storage, PASSPORT_SLOT), chain: null, plan: null, receipt: null, busy: false, hint: -1, disposed: false };
  S.state = G.initialState(S.map);
  try {
    const saved = JSON.parse(storage && storage.getItem(RECEIPT_SLOT));
    if (saved && /^[0-9a-f]{64}$/.test(saved.txHash) && /^[0-9a-f]{64}$/.test(saved.genesis) && typeof saved.body === 'string' && saved.body.length < 2000 && typeof saved.sender === 'string' && saved.sender.length < 90 && G.validDay(saved.day)) S.receipt = saved;
  } catch { /* missing, malformed or unavailable local storage */ }
  const save = (slot, value) => { try { storage.setItem(slot, JSON.stringify(value)); return true; } catch { set('[data-storage-status]', 'Storage is unavailable. Download your stamp or receipt before leaving; this browser cannot keep them.'); return false; } };
  const download = (name, type, value) => {
    const url = win.URL.createObjectURL(new win.Blob([value], { type }));
    const a = element(doc, 'a'); a.href = url; a.download = name; doc.body.append(a); a.click(); a.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(url), 1000);
  };
  function paintPassport() {
    const box = q('[data-passport]'); box.replaceChildren();
    set('[data-passport-count]', S.passport.length + ' daily stamp' + (S.passport.length === 1 ? '' : 's'));
    if (!S.passport.length) {
      const card = element(doc, 'article', 'sr-stamp sr-stamp-empty');
      card.append(element(doc, 'div', 'sr-stamp-symbol', '✳'), element(doc, 'h3', '', 'Your first signal'), element(doc, 'p', '', 'Complete today’s three stages.')); box.append(card);
    }
    for (const e of S.passport) {
      const card = element(doc, 'article', 'sr-stamp');
      card.append(element(doc, 'small', '', 'LOCAL / THREE STAGES COMPLETE'), element(doc, 'div', 'sr-stamp-symbol', '✳'), element(doc, 'h3', '', e.day), element(doc, 'p', '', e.moves + ' moves · ' + e.spare + ' spare' + (e.assisted ? ' · guided' : ' · unguided')));
      const button = element(doc, 'button', '', 'Download stamp ↗'); button.type = 'button'; button.addEventListener('click', () => download('signal-run-' + e.day + '.svg', 'image/svg+xml', stampSvg(e))); card.append(button); box.append(card);
    }
  }
  function available() { return S.passport.find(e => e.day === S.day) || null; }
  function paintWallet() {
    q('[data-review]').disabled = S.busy || !available() || !keys.key() || Boolean(S.receipt && S.receipt.day === day && S.receipt.genesis === api.genesis);
    q('[data-sign]').disabled = S.busy;
    q('[data-cancel]').disabled = S.busy;
    q('[data-check]').disabled = S.busy;
    if (!S.busy && !S.plan && !S.receipt) set('[data-chain-status]', available() ? 'Today’s event is ready. Make a devnet play key, then review the public receipt.' : 'Complete all three stages to unlock today’s optional receipt.');
  }
  function paintReceipt() {
    const r = S.receipt; q('[data-receipt-panel]').hidden = !r;
    if (!r) return;
    set('[data-receipt-hash]', r.txHash);
    set('[data-receipt-title]', 'Saved receipt · inclusion not checked');
    set('[data-receipt-status]', 'A transaction hash is saved for ' + r.day + '. Check the current devnet before treating it as included. A reset may remove it.');
    q('[data-verify]').hidden = true;
  }
  function paintBoard(message) {
    const { map, state } = S, board = q('[data-board]'); board.replaceChildren();
    const visited = new Set([0]); let pos = 0; for (const d of state.route) { pos = G.neighbor(pos, d); visited.add(pos); }
    for (let i = 0; i < 49; i++) {
      const shard = map.shards.indexOf(i), collected = shard >= 0 && (state.mask & (1 << shard));
      const kind = i === state.pos ? 'player' : map.walls.includes(i) ? 'wall' : i === map.exit ? 'exit' : shard >= 0 && !collected ? 'shard' : 'floor';
      const cell = element(doc, 'button', 'sr-cell', ({ player: '◆', shard: '✳', exit: '↗' })[kind] || '');
      cell.type = 'button'; cell.tabIndex = -1; cell.dataset.kind = kind; cell.dataset.visited = visited.has(i) ? 'yes' : 'no'; cell.dataset.suggested = S.hint === i ? 'yes' : 'no';
      cell.setAttribute('aria-label', 'Row ' + (Math.floor(i / 7) + 1) + ', column ' + (i % 7 + 1) + ': ' + kind);
      cell.addEventListener('click', () => { if (Date.now() < suppressClickUntil) return; const dir = Object.keys(G.DIRECTIONS).find(d => G.neighbor(S.state.pos, d) === i); if (dir) step(dir); else say('Move one square at a time using the direction controls.'); });
      board.append(cell);
    }
    set('[data-stage-title]', '0' + (S.stage + 1) + ' / ' + G.STAGE_NAMES[S.stage]);
    set('[data-stage-count]', 'STAGE ' + (S.stage + 1) + ' / 3');
    set('[data-shards]', state.mask.toString(2).replace(/0/g, '').length + ' / 3');
    set('[data-energy]', String(map.budget - state.route.length)); set('[data-event-progress]', String(S.routes.length) + ' / 3');
    const done = state.status === 'won' && S.stage === 2;
    q('[data-next]').hidden = state.status !== 'won'; q('[data-next]').textContent = done ? 'Play today again ↻' : 'Next stage →';
    for (const b of root.querySelectorAll('[data-dir]')) b.disabled = state.status !== 'playing';
    q('[data-hint]').disabled = state.status !== 'playing';
    if (message) say(message);
  }
  const say = text => set('[data-game-status]', text);
  function step(dir) {
    const next = G.move(S.map, S.state, dir);
    if (next === S.state) { if (S.state.status === 'playing') say('There’s a wall or the edge of the map. Try another direction.'); return; }
    const shard = next.mask !== S.state.mask; S.state = next; S.hint = -1;
    let message = shard ? 'Signal found! Keep going toward the gate.' : 'Find all three signals, then reach the gate.';
    if (next.pos === S.map.exit && next.mask !== 7) message = 'The gate needs all three signals. Gather the rest first.';
    if (next.status === 'lost') message = 'Out of moves. Restart this stage and try a tighter route.';
    if (next.status === 'won') {
      S.routes[S.stage] = next.route;
      message = 'Stage clear. ' + (S.map.budget - next.route.length) + ' moves to spare. On to the next signal.';
      if (S.stage === 2) {
        const event = G.completedEvent({ day, routes: S.routes, assisted: S.assisted });
        S.passport = [event, ...S.passport.filter(e => e.day !== day)].slice(0, 14); save(PASSPORT_SLOT, S.passport); paintPassport(); paintWallet();
        message = 'All signals delivered! Today’s stamp is in your passport. Keep the picture or seal an optional event receipt below.';
      }
    }
    paintBoard(message);
  }
  function restart(all = false) {
    if (all) { S.stage = 0; S.routes = []; S.assisted = false; }
    // Restarting a won stage invalidates that stage's route before advancing.
    S.routes = S.routes.slice(0, S.stage); S.map = G.makeMap(day, S.stage); S.state = G.initialState(S.map); S.hint = -1;
    paintBoard('A fresh start. Collect three signals and reach the gate.');
  }
  async function connect() {
    // A real built genesis is required; a preview cannot silently trust another node.
    if (!/^[0-9a-f]{64}$/.test(api.genesis || '')) throw new Error('This page has no pinned devnet genesis. Receipts are unavailable.');
    S.chain = await (env.connect || connectPinned)(api.api, { pinned: api.genesis, env });
    if (S.chain.chainId !== S.chain.params.chain_id || (!api.override && S.chain.chainId !== root.dataset.chainId)) throw new Error('The devnet chain ID does not match this page’s pinned identity. Nothing was signed.');
    return S.chain;
  }
  function clearPlan() { S.plan = null; q('[data-review-panel]').hidden = true; }
  async function review() {
    if (S.busy || !available() || !keys.key() || q('[data-review]').disabled) return;
    S.busy = true; paintWallet(); clearPlan(); set('[data-chain-status]', 'Reading the pinned devnet and preparing the exact transaction…');
    try {
      const key = keys.key(), chain = await connect();
      const plan = await C.prepareEvent(chain, key, available());
      if (!keys.key() || keys.key().sender !== key.sender || S.disposed) return;
      S.plan = { ...plan, key };
      const card = whatYouSign(plan.tx, chain);
      set('[data-review-network]', chain.chainId + ' · ' + api.api + '\nGenesis: ' + chain.genesisHash);
      set('[data-review-account]', plan.tx.sender);
      set('[data-review-body]', plan.body);
      set('[data-review-fields]', card.fields.map(([k, v]) => k + ': ' + v).join('\n') + '\nSigning digest: ' + card.digest);
      q('[data-review-panel]').hidden = false; set('[data-chain-status]', 'Ready for your review. Nothing has been uploaded, signed or sent.'); q('[data-sign]').focus();
    } catch (e) { set('[data-chain-status]', sendFailureText(e)); }
    finally { S.busy = false; paintWallet(); }
  }
  async function sign() {
    if (S.disposed || S.busy || !S.plan || !keys.key() || keys.key().sender !== S.plan.tx.sender) return;
    const plan = S.plan; S.busy = true; paintWallet(); set('[data-chain-status]', 'Publishing your reviewed event receipt…');
    try {
      await C.publishEvent({ chain: S.chain, net, key: plan.key, plan, wait: env.wait, beforeSign: () => !S.disposed && keys.key()?.sender === plan.key.sender,
        onSigned: ({ txHash }) => {
          S.receipt = { format: 'signal-run-receipt/v1', day: plan.day, txHash, sender: plan.key.sender, genesis: plan.genesis, api: api.api, body: plan.body };
          // This happens before submit, so an ambiguous response retains the hash.
          save(RECEIPT_SLOT, S.receipt); paintReceipt();
        } });
      clearPlan(); set('[data-chain-status]', 'The devnet reports inclusion. Checking the event body, block commitment and seal…');
      await check(true);
    } catch (e) { set('[data-chain-status]', sendFailureText(e)); if (S.receipt) set('[data-receipt-status]', sendFailureText(e) + ' Use Check chain inclusion; this page will not resend it.'); }
    finally { clearPlan(); S.busy = false; paintWallet(); }
  }
  async function check(insideSend = false) {
    if (!S.receipt || (S.busy && !insideSend)) return;
    if (!insideSend) { S.busy = true; paintWallet(); }
    set('[data-receipt-status]', 'Reading the current devnet and checking the receipt…');
    try {
      const chain = await connect(), result = await C.checkEvent(chain, net, S.receipt);
      if (result.included) {
        set('[data-receipt-title]', 'Event receipt · included in block ' + result.height);
        set('[data-receipt-status]', 'Checked now: this post and its event body are committed by block ' + result.height + ', whose seal checks under the pinned genesis key. Your gameplay remains a player-reported claim. The devnet may reset.');
        const link = q('[data-verify]'); link.href = '/chain/verify-a-block#b=' + result.height; link.hidden = false;
      } else { set('[data-receipt-title]', 'Event receipt · ' + result.status); set('[data-receipt-status]', 'The current devnet does not report this transaction as included (' + result.status + '). Nothing is resent. Keep the hash and check again later.'); q('[data-verify]').hidden = true; }
    } catch (e) { set('[data-receipt-title]', 'Event receipt · check incomplete'); set('[data-receipt-status]', cleanText(e.message, 400)); q('[data-verify]').hidden = true; }
    finally { if (!insideSend) { S.busy = false; paintWallet(); } }
  }
  q('[data-board]').addEventListener('keydown', e => {
    const dir = ({ ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' })[e.key];
    if (dir) { e.preventDefault(); step(dir); }
  });
  let pointer = null, suppressClickUntil = 0;
  q('[data-board]').addEventListener('pointerdown', e => { pointer = { x: e.clientX, y: e.clientY }; });
  q('[data-board]').addEventListener('pointerup', e => {
    if (!pointer) return; const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y; pointer = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    suppressClickUntil = Date.now() + 400; e.preventDefault();
    step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
  });
  q('[data-board]').addEventListener('pointercancel', () => { pointer = null; });
  for (const b of root.querySelectorAll('[data-dir]')) b.addEventListener('click', () => step(b.dataset.dir));
  q('[data-retry]').addEventListener('click', () => restart());
  q('[data-next]').addEventListener('click', () => {
    if (S.state.status !== 'won') return;
    if (S.stage === 2) restart(true); else { S.stage++; restart(); }
    q('[data-board]').focus();
  });
  q('[data-hint]').addEventListener('click', () => {
    const route = G.shortestRoute(S.map, S.state.pos, S.state.mask); S.assisted = true;
    if (!route || route.length > S.map.budget - S.state.route.length) { say('This route needs more moves than you have left. Restart and try a different path.'); return; }
    S.hint = G.neighbor(S.state.pos, route[0]); paintBoard('Next step: ' + ({ U: 'up', D: 'down', L: 'left', R: 'right' })[route[0]] + '. The highlighted square points the way.');
  });
  q('[data-review]').addEventListener('click', review); q('[data-sign]').addEventListener('click', sign);
  q('[data-cancel]').addEventListener('click', () => { if (!S.busy) { clearPlan(); set('[data-chain-status]', 'Canceled. Nothing was uploaded, signed or sent.'); paintWallet(); q('[data-review]').focus(); } });
  q('[data-check]').addEventListener('click', () => check());
  q('[data-download-receipt]').addEventListener('click', () => { if (S.receipt) download('signal-run-receipt-' + S.receipt.day + '.json', 'application/json', JSON.stringify(S.receipt, null, 2)); });
  keys.onChange(() => { if (!S.busy) { clearPlan(); paintWallet(); } });
  doc.addEventListener('astro:before-swap', () => { S.disposed = true; clearPlan(); }, { once: true });
  set('[data-event-day]', day + ' / UTC');
  if (api.ignored) set('[data-chain-status]', 'Ignored an unsupported devnet override. This page uses its built-in pinned devnet.');
  paintBoard('Your expedition starts here. Collect three signals, then reach the gate.'); paintPassport(); paintReceipt(); paintWallet();
  return { state: S, keys, step, review, sign, check, restart, net };
}
