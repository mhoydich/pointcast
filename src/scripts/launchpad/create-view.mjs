/**
 * The Create panel (plan §3 "Create / launch"): name, symbol, a Noun picker
 * with a live preview, preset, rule set and an optional dev buy, with the
 * dev-buy limit for the chosen rules (plan §4.7) and the preset's price path.
 *
 * Viewer text passes the copy rules as it is typed, so a refused name never
 * reaches the log. Launch adds a `launch` record for the current tick; once
 * that tick has run, the outcome is read back from the event log: the CREATE
 * (then the coin is selected) or the engine's refusal, and the dev buy's.
 * Form values stay after a launch, so a second coin is one edit away.
 */
import { PRESETS, LIMITS, D } from '../../lib/launchpad/config.mjs';
import { newCurve, netForOut, netOfRate, buyOut, graduationRaise, marketCap } from '../../lib/launchpad/curve.mjs';
import { copyProblems } from '../../lib/launchpad/copy-rules.mjs';
import { units, ceilDiv, ONE } from '../../lib/launchpad/units.mjs';
import { previewPath } from '../../lib/launchpad/paths.mjs';
import { el, setText, setAttr, cr, tokens, parseAmount } from './ui.mjs';

const SYMBOL_RE = /^[A-Z0-9]{1,13}$/;
/** Control and text-direction characters and blank fillers: the engine refuses a name with one, as the name would read differently from what is checked. */
const INVISIBLE = /[\p{Cc}\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069\u115F\u1160\u3164\uFFA0\u2800\u{1D159}]/u;
const invisibleMsg = (what) => `The ${what} has a hidden control, text-direction or blank filler character, so it would not read as typed. Retype it without one.`;
const NOUNS = 100;
const CAP_PCT = `${LIMITS.devBuyMaxBps / 100}%`;

/** Engine and sim refusals of a launch, in plain words. */
const LAUNCH_REASON = Object.freeze({
  FILTERED: 'the name or symbol breaks the copy rules (no hype or offer words, no Nouns marks, no real units)',
  BAD_SYMBOL: 'the symbol must be 1 to 13 letters A–Z or digits 0–9',
  BAD_NAME: 'the name must have 1 to 32 characters, none of them invisible',
  BAD_NOUN: 'the Noun must be a number from 0 to 99',
  BAD_PRESET: 'that preset does not exist',
  BAD_RULES: 'that rule set does not exist',
  NO_WALLET: 'your wallet does not exist yet',
  NOT_HUMAN: 'that wallet is not a viewer wallet',
});
/** Engine refusals of a dev buy, in plain words. */
const BUY_REASON = Object.freeze({
  DEV_BUY_CAP: `it is above the dev-buy cap (at most ${CAP_PCT} of supply)`,
  INSUFFICIENT_CREDITS: 'you do not hold enough credits',
  AUCTION_CAP: 'your wallet has already used the auction cap',
  EARLY_CAP: 'it would take you over the early wallet cap',
  BAD_AMOUNT: 'the amount is too small to take any tokens',
  SLIPPAGE: 'the price moved past the slippage limit',
  POSITION: 'it is over the position limit',
  CURVE_COMPLETE: 'the curve has sold out',
});
/** What a copy-rule hit is, by the label copyProblems gives it; anything else is on the never-use list. */
const COPY_KIND = Object.freeze({ 'offer word': 'reads as an offer', 'Nouns mark': 'reads as a Nouns mark', unit: 'names a real unit' });

/** Credits, with whole amounts shown without decimals (the auction cap reads "30 cr"). */
const crWhole = (micro) => (micro % ONE === 0n ? cr(micro, 0) : cr(micro));
const wrapNoun = (n) => ((n % NOUNS) + NOUNS) % NOUNS;

/** The matched words of a copy check, longest first, dropping a word inside a longer one ("official" inside "official Nouns"). */
function refusedWords(problems) {
  const hits = problems.map((p) => {
    const m = /^(.*?): "([\s\S]*)"$/.exec(p);
    return m ? { label: m[1], word: m[2] } : { label: '', word: p };
  }).sort((a, b) => b.word.length - a.word.length);
  const kept = [];
  for (const h of hits) if (!kept.some((k) => k.word.toLowerCase().includes(h.word.toLowerCase()))) kept.push(h);
  return kept;
}

export function mountCreate(root, ctx) {
  root.classList.add('lp-crt');
  let generation = 0;
  let lastSig = '';
  let rulesTouched = false;
  let nameTouched = false;
  let symbolTouched = false;
  let lastNoun = 0;
  /** Launches recorded here whose tick has not run yet: { tick, from, recs, selectedAt }. */
  let batches = [];
  const facts = new Map();
  let copyKey = null;
  let copyHits = [];
  /** Which field a copy-rule hit is in, so only that field is marked invalid. */
  let copyIn = { name: false, symbol: false };

  /* ---------- fields ---------- */
  const option = (value, label) => el('option', { value }, label);
  const field = (...kids) => el('div', { class: 'lp-crt-field' }, ...kids);

  const nameInput = el('input', { type: 'text', id: 'lp-crt-name', maxlength: LIMITS.nameMax, autocomplete: 'off', spellcheck: 'false', 'aria-describedby': 'lp-crt-name-err lp-crt-refusal' });
  const nameCount = el('span', { class: 'lp-crt-count', 'aria-hidden': 'true' });
  const nameErr = el('p', { class: 'lp-error lp-crt-err', id: 'lp-crt-name-err', hidden: true });
  const symInput = el('input', { type: 'text', id: 'lp-crt-symbol', maxlength: LIMITS.symbolMax, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-describedby': 'lp-crt-symbol-help lp-crt-symbol-err lp-crt-refusal' });
  const symErr = el('p', { class: 'lp-error lp-crt-err', id: 'lp-crt-symbol-err', hidden: true });
  // Always in the page (empty when clean), so the polite live region is heard when a refusal appears.
  const refusal = el('p', { class: 'lp-error lp-crt-refusal', id: 'lp-crt-refusal', 'aria-live': 'polite' });

  const prevBtn = el('button', { type: 'button', class: 'lp-crt-step', id: 'lp-crt-prev' }, 'Previous');
  const nextBtn = el('button', { type: 'button', class: 'lp-crt-step', id: 'lp-crt-next' }, 'Next');
  const nounInput = el('input', { type: 'number', id: 'lp-crt-noun', min: 0, max: NOUNS - 1, step: 1, value: lastNoun, inputmode: 'numeric', 'aria-describedby': 'lp-crt-noun-err' });
  const nounErr = el('p', { class: 'lp-error lp-crt-err', id: 'lp-crt-noun-err', hidden: true });
  const nounSet = el('fieldset', { class: 'lp-crt-noun' },
    el('legend', {}, 'Noun'),
    el('div', { class: 'lp-crt-picker' }, prevBtn, el('label', { class: 'lp-crt-noun-label' }, el('span', { class: 'lp-sr' }, 'Noun number, 0 to 99'), nounInput), nextBtn),
    nounErr);

  const img = el('img', { class: 'lp-crt-img', width: 160, height: 160, alt: '', decoding: 'async' });
  const pName = el('strong', { class: 'lp-crt-pname' });
  const pSym = el('span', { class: 'lp-crt-psym' });
  const pNoun = el('span', { class: 'lp-crt-pnoun' });
  const preview = el('figure', { class: 'lp-crt-preview', id: 'lp-crt-preview' }, img,
    el('figcaption', {}, pName, pSym, el('span', { class: 'lp-crt-made' }, 'Simulated coin · made on this board'), pNoun));

  const presetSel = el('select', { id: 'lp-crt-preset' }, ...Object.values(PRESETS).map((p) => option(p.id, p.label)));
  const pathTitle = el('p', { class: 'lp-crt-path-title' });
  const pathLines = el('dl', { class: 'lp-lines lp-crt-path-lines' });
  const pathVals = {};
  for (const [k, label] of [['start', 'Starting market cap'], ['raise', 'Credits to graduate'], ['end', 'Market cap at graduation']]) {
    pathVals[k] = el('dd');
    pathLines.append(el('dt', {}, label), pathVals[k]);
  }
  const path = el('div', { class: 'lp-crt-path', id: 'lp-crt-path' }, pathTitle, pathLines);

  const rulesSel = el('select', { id: 'lp-crt-rules' }, ...Object.values(ctx.rules).map((r) => option(r.id, r.label)));
  const devInput = el('input', { type: 'text', id: 'lp-crt-devbuy', inputmode: 'decimal', autocomplete: 'off', placeholder: 'none', 'aria-describedby': 'lp-crt-held lp-crt-devhint lp-crt-devest lp-crt-dev-err' });
  const held = el('span', { class: 'lp-crt-held', id: 'lp-crt-held', 'aria-hidden': 'true' });
  const devHint = el('p', { class: 'lp-note lp-crt-devhint', id: 'lp-crt-devhint' });
  const devEst = el('p', { class: 'lp-note lp-crt-devest', id: 'lp-crt-devest', hidden: true });
  const devErr = el('p', { class: 'lp-error lp-crt-err', id: 'lp-crt-dev-err', hidden: true });

  // aria-disabled, not disabled, so a pressed Launch keeps focus; the submit handler's validate() is the guard.
  const launchBtn = el('button', { type: 'submit', class: 'lp-crt-launch', id: 'lp-crt-launch', 'aria-disabled': 'true', 'aria-describedby': 'lp-crt-why' }, 'Launch');
  const why = el('span', { class: 'lp-note lp-crt-why', id: 'lp-crt-why' });
  const result = el('div', { class: 'lp-crt-result', id: 'lp-crt-result' });

  const form = el('form', { class: 'lp-form lp-crt-form', novalidate: true, 'aria-label': 'Create a coin' },
    field(el('label', { for: 'lp-crt-name' }, el('span', { class: 'lp-crt-label' }, 'Name', nameCount)), nameInput, nameErr),
    field(el('label', { for: 'lp-crt-symbol' }, 'Symbol'), symInput,
      el('p', { class: 'lp-note lp-crt-help', id: 'lp-crt-symbol-help' }, `Letters A–Z and digits 0–9, up to ${LIMITS.symbolMax}.`), symErr, refusal),
    nounSet,
    preview,
    field(el('label', { for: 'lp-crt-preset' }, 'Preset'), presetSel),
    path,
    field(el('label', { for: 'lp-crt-rules' }, 'Rules'), rulesSel),
    field(el('label', { for: 'lp-crt-devbuy' }, el('span', { class: 'lp-crt-label' }, 'Dev buy (cr), optional', held)), devInput, devHint, devEst, devErr),
    el('div', { class: 'lp-row lp-crt-go' }, launchBtn, why),
    result);

  root.append(
    el('div', { class: 'lp-crt-head' }, el('h3', {}, 'Create a coin'),
      el('p', { class: 'lp-note' }, 'Launch a simulated coin with play credits. The launch goes into this run’s action log, so a replay link reproduces it.')),
    form);

  presetSel.value = PRESETS[ctx.sim?.preset] ? ctx.sim.preset : Object.keys(PRESETS)[0];
  rulesSel.value = ctx.settings.rules;

  /* ---------- derived numbers ---------- */

  /** Dev-buy limit and price path for a preset and rule set (plan §4.7), from the curve itself. */
  function factsFor(presetId, rulesId) {
    const key = `${presetId}|${rulesId}`;
    if (facts.has(key)) return facts.get(key);
    const cfg = ctx.sim.world.config;
    const p = cfg.presets[presetId];
    const r = cfg.rules[rulesId];
    const end = { Q: p.Q0 + graduationRaise(p), B: p.B0 - p.R0 };
    const f = { preset: p, rules: r, start: marketCap(newCurve(p), p.supply), raise: graduationRaise(p), end: marketCap(end, p.supply) };
    if (r.auction) {
      f.cap = p.Q0 / r.auction.capDivisor;
    } else {
      // Exact-out cost of the cap at launch: net = netForOut(curve, cap), gross = net + ceil(net·r/D), with the t=0 sniper fee where the rules charge one.
      const fees = cfg.curveFees;
      f.rate = BigInt(fees.creator + fees.house + fees.lp) + (r.sniperFee ? BigInt(r.sniperFee.startBps) * 100n : 0n);
      f.capOut = (p.supply * BigInt(cfg.limits.devBuyMaxBps)) / 10_000n;
      f.capNet = netForOut(newCurve(p), f.capOut);
      f.capGross = f.capNet + ceilDiv(f.capNet * f.rate, D);
    }
    facts.set(key, f);
    return f;
  }

  /** Credits the viewer holds; before its first record runs, the scenario's starting credits. */
  function creditsHeld() {
    const sim = ctx.sim;
    return sim.world.wallets.get(ctx.viewer)?.credits ?? units(sim.scenario.humanCredits ?? '1000');
  }

  /** Copy-rule hits for the name and symbol, cached on the text. */
  function copyCheck(name, symbol) {
    const key = `${name}\n${symbol}`;
    if (key !== copyKey) {
      copyKey = key;
      copyHits = refusedWords(copyProblems(key, { viewer: true }));
      const any = copyHits.length > 0;
      const inName = any && copyProblems(name, { viewer: true }).length > 0;
      const inSymbol = any && copyProblems(symbol, { viewer: true }).length > 0;
      // A word that only matches across both fields ("main" and "NET") marks both.
      copyIn = inName || inSymbol ? { name: inName, symbol: inSymbol } : { name: any, symbol: any };
    }
    return copyHits;
  }

  function showErr(input, node, msg, invalid = Boolean(msg)) {
    node.hidden = !msg;
    setText(node, msg);
    setAttr(input, 'aria-invalid', String(invalid));
  }

  /* ---------- validation ---------- */

  /** Read the form, show every problem in place, and return what a launch record would carry. */
  function validate() {
    const sim = ctx.sim;
    if (!sim) return { ok: false };
    const name = nameInput.value.trim();
    const symbol = symInput.value.trim();
    const nounText = nounInput.value.trim();
    const nounId = /^\d{1,2}$/.test(nounText) ? Number(nounText) : null;
    if (nounId !== null) lastNoun = nounId;
    const f = factsFor(presetSel.value, rulesSel.value);
    const devText = devInput.value.trim();
    const devBuy = devText ? parseAmount(devText) : null;
    const credits = creditsHeld();
    const finished = sim.world.tick >= sim.scenario.ticks;

    // Name, symbol and the copy rules.
    setText(nameCount, ` ${nameInput.value.length} / ${LIMITS.nameMax}`);
    const hits = copyCheck(name, symbol);
    const nameHidden = INVISIBLE.test(name);
    const symHidden = INVISIBLE.test(symbol);
    let symMsg = '';
    if (symHidden) symMsg = invisibleMsg('symbol');
    else if (symbol && !SYMBOL_RE.test(symbol)) symMsg = `Letters A–Z and digits 0–9 only, up to ${LIMITS.symbolMax}.`;
    else if (symbolTouched && !symbol) symMsg = 'Add a symbol.';
    const nameMsg = nameHidden ? invisibleMsg('name') : nameTouched && !name ? 'Add a name.' : '';
    showErr(nameInput, nameErr, nameMsg, Boolean(nameMsg) || copyIn.name);
    showErr(symInput, symErr, symMsg, Boolean(symMsg) || copyIn.symbol);
    const words = hits.map((h) => `“${h.word}” ${COPY_KIND[h.label] ?? 'is on the never-use list'}`).join('; ');
    setText(refusal, hits.length ? `Refused: ${words}. Coin names and symbols carry no hype or offer words, no Nouns marks and no real units. Nothing has been recorded.` : '');

    // Noun and preview.
    showErr(nounInput, nounErr, nounId === null ? 'Pick a whole number from 0 to 99.' : '');
    const shown = nounId ?? lastNoun;
    const src = previewPath(shown);
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    setAttr(img, 'alt', `Coin face showing Noun #${shown}`);
    // A refused name or symbol never renders on the coin card (plan §3): the field that tripped shows its placeholder.
    const pNameText = copyIn.name || nameHidden ? '' : name;
    const pSymText = copyIn.symbol || symHidden ? '' : symbol;
    setText(pName, pNameText || 'Coin name');
    pName.classList.toggle('lp-crt-blank', !pNameText);
    setText(pSym, pSymText || 'SYMBOL');
    pSym.classList.toggle('lp-crt-blank', !pSymText);
    setText(pNoun, `Noun #${shown} · CC0 art`);

    // Price path for the preset.
    setText(pathTitle, `Price path, ${f.preset.label}`);
    setText(pathVals.start, cr(f.start));
    setText(pathVals.raise, cr(f.raise));
    setText(pathVals.end, cr(f.end));

    // Dev buy: the limit under these rules, then the typed amount against it.
    setText(held, `credits held ${cr(credits)}`);
    if (f.cap !== undefined) {
      const lock = f.rules.devLock ? ' (the creator is locked until graduation under fair rules)' : ' per wallet';
      setText(devHint, `${f.rules.label} rules: an ordinary auction order, capped at ${crWhole(f.cap)}${lock}. Anything over the cap is refused and stays with you; the order gets a pro-rata fill when the auction clears ${f.rules.auction.ticks} ticks after launch.`);
    } else {
      const sniper = f.rules.sniperFee ? `, with the sniper fee at its opening ${f.rules.sniperFee.startBps / 100}%` : '';
      setText(devHint, `${f.rules.label} rules: at most ${CAP_PCT} of supply (${tokens(f.capOut)} tokens). The full ${CAP_PCT} costs about ${cr(f.capGross)} here: ${cr(f.capNet)} into the curve plus fees${sniper}. It is the coin’s first trade, disclosed and flagged DEV.`);
    }
    let est = '', warn = false, devMsg = '';
    if (devText && !devBuy) devMsg = 'Type a positive amount in cr, with up to 6 decimals.';
    else if (devBuy && units(devBuy) > credits) devMsg = `That is more than your credits held (${cr(credits)}).`;
    else if (devBuy) {
      const gross = units(devBuy);
      if (f.cap !== undefined) {
        warn = gross > f.cap;
        est = warn ? `Only ${crWhole(f.cap)} goes in as an order; the other ${cr(gross - f.cap)} is refused and stays with you.` : `Goes in as a ${cr(gross)} auction order.`;
      } else {
        const net = netOfRate(gross, f.rate);
        warn = net > f.capNet;
        const out = buyOut(newCurve(f.preset), net);
        est = warn ? 'Above the cap: the coin still launches, but this dev buy will be refused.' : `Takes about ${tokens(out)} tokens (${(Number((out * 10_000n) / f.preset.supply) / 100).toFixed(2)}% of supply).`;
      }
    }
    devEst.hidden = !est;
    setText(devEst, est);
    devEst.classList.toggle('lp-crt-warn', warn);
    showErr(devInput, devErr, devMsg);

    // Launch.
    const fieldsOk = Boolean(name && symbol) && !nameMsg && !symMsg && !hits.length && nounId !== null && !devMsg;
    // The same symbol already waiting for this tick: a second click (or a double-click) would launch a twin coin and charge its dev buy twice.
    const twin = Boolean(symbol) && batches.some((b) => b.tick === sim.world.tick && b.recs.some((r) => r.symbol === symbol));
    const ok = fieldsOk && !finished && !twin;
    setAttr(launchBtn, 'aria-disabled', String(!ok));
    let whyText;
    if (finished) whyText = 'The run has finished. Reset to start a new one.';
    else if (hits.length) whyText = 'Change the refused word to launch.';
    else if (!name || !symbol) whyText = 'Add a name and a symbol to launch.';
    else if (!fieldsOk) whyText = 'Fix the marked field to launch.';
    else if (twin) whyText = `${symbol} is already recorded for tick ${sim.world.tick}. Change the symbol to launch another coin.`;
    else whyText = `Records a launch for tick ${sim.world.tick}. Play credits only.`;
    setText(why, whyText);
    return { ok, name, symbol, nounId, preset: presetSel.value, rules: rulesSel.value, devBuy };
  }

  /* ---------- results ---------- */

  /** Replace the result line (plain paragraphs: nothing in it takes focus). */
  function showResult(parts) {
    result.replaceChildren(...parts.map(([cls, text]) => el('p', { class: cls }, text)));
  }

  function pendingText(playing) {
    const n = batches.reduce((s, b) => s + b.recs.length, 0);
    const what = n === 1 ? batches[0].recs[0].symbol : `${n} coins`;
    return `Launches at tick ${batches[0].tick} (${what}).${playing ? '' : ' Press Step or Play to run it.'}`;
  }

  /**
   * The outcome of each launch in a tick that has run. Viewer launches run in
   * log order and each leaves one CREATE (viewerMade) or one human launch
   * refusal, or a sim reject with no event; so the log's launch records for
   * that tick, rejects set aside, line up with those events in order.
   */
  function outcomes(batch) {
    const { world, humanRejects, log } = ctx.sim;
    const rejected = new Map(humanRejects.filter((x) => x.tick === batch.tick && x.type === 'launch').map((x) => [x.record, x.reason]));
    const ev = world.events;
    const seen = [];
    for (let i = batch.from; i < ev.length && ev[i].tick <= batch.tick; i++) {
      const e = ev[i];
      if (e.tick !== batch.tick) continue;
      if ((e.type === 'CREATE' && e.viewerMade) || (e.type === 'ENGINE_REFUSE' && e.actor === 'human' && e.side === 'launch')) seen.push(i);
    }
    const byRec = new Map();
    let k = 0;
    for (const rec of log) {
      if (rec.tick !== batch.tick || rec.type !== 'launch') continue;
      byRec.set(rec, rejected.has(rec) ? { reason: rejected.get(rec) } : seen[k++] ?? null);
    }
    return batch.recs.map((rec) => {
      const at = byRec.get(rec) ?? null;
      const refused = (reason) => ({ rec, parts: [['lp-error', `${rec.symbol} was not launched: ${LAUNCH_REASON[reason] ?? reason}.`]] });
      if (at === null) return { rec, parts: [['lp-error', `${rec.symbol}: no outcome was found for this launch.`]] };
      if (typeof at === 'object') return refused(at.reason);
      const e = ev[at];
      if (e.type === 'ENGINE_REFUSE' || e.creator !== ctx.viewer) return refused(e.reason ?? 'refused');
      const parts = [['lp-ok', `Launched ${e.symbol} (${e.coin}).`]];
      if (rec.devBuy) parts.push(devOutcome(e, at, rec));
      return { rec, coin: e.coin, parts };
    });
  }

  /** The dev buy's event: the first fill, order or refusal for the new coin and the viewer's wallet after its CREATE. */
  function devOutcome(create, at, rec) {
    const ev = ctx.sim.world.events;
    for (let i = at + 1; i < ev.length && ev[i].tick === create.tick; i++) {
      const e = ev[i];
      if (e.coin !== create.coin || e.wallet !== ctx.viewer) continue;
      if (e.type === 'TRADE') return ['lp-note', `Dev buy: ${tokens(e.base)} tokens for ${cr(e.quote)}, flagged DEV.`];
      if (e.type === 'AUCTION_ORDER') {
        const over = e.refused > 0n ? ` ${cr(e.refused)} over the cap was refused and stayed with you.` : '';
        return ['lp-note', `Dev buy: a ${cr(e.quote)} auction order, filled pro-rata when the auction clears at tick ${create.openTick}.${over}`];
      }
      if (e.type === 'ENGINE_REFUSE') return ['lp-error', `Dev buy of ${cr(units(rec.devBuy))} refused: ${BUY_REASON[e.reason] ?? e.reason}. The coin launched without it.`];
    }
    return ['lp-note', 'No dev buy event was found.'];
  }

  /** Settle every batch whose tick has run: show and announce the outcomes, then select the newest coin. */
  function settle() {
    const tick = ctx.sim.world.tick;
    const done = batches.filter((b) => tick > b.tick);
    if (!done.length) return;
    batches = batches.filter((b) => tick <= b.tick);
    const all = done.flatMap((b) => outcomes(b).map((o) => ({ ...o, batch: b })));
    showResult(all.flatMap((o) => o.parts));
    ctx.actions.announce(all.flatMap((o) => o.parts.map((p) => p[1])).join(' '));
    const last = [...all].reverse().find((o) => o.coin);
    // Select the new coin, unless the viewer picked another coin after launching.
    if (last && (last.batch.selectedAt === null || ctx.selected === last.batch.selectedAt) && ctx.selected !== last.coin) ctx.actions.select(last.coin);
  }

  /* ---------- events ---------- */

  nameInput.addEventListener('input', () => { nameTouched = true; validate(); });
  /** Uppercase the symbol as it is typed, keeping the caret where it was. */
  function upperSymbol(e) {
    if (e.isComposing) return;
    const v = symInput.value;
    const up = v.toUpperCase();
    if (up !== v) {
      const a = symInput.selectionStart, b = symInput.selectionEnd;
      symInput.value = up;
      if (up.length === v.length && a !== null) symInput.setSelectionRange(a, b);
    }
    symbolTouched = true;
    validate();
  }
  symInput.addEventListener('input', upperSymbol);
  symInput.addEventListener('compositionend', upperSymbol);
  const setNoun = (n) => { nounInput.value = String(wrapNoun(n)); validate(); };
  prevBtn.addEventListener('click', () => setNoun(lastNoun - 1));
  nextBtn.addEventListener('click', () => setNoun(lastNoun + 1));
  nounInput.addEventListener('input', () => validate());
  nounInput.addEventListener('change', () => {
    const n = Math.round(Number(nounInput.value));
    nounInput.value = String(nounInput.value.trim() !== '' && Number.isFinite(n) ? Math.min(NOUNS - 1, Math.max(0, n)) : lastNoun);
    validate();
  });
  presetSel.addEventListener('change', () => validate());
  rulesSel.addEventListener('change', () => { rulesTouched = true; validate(); });
  devInput.addEventListener('input', () => validate());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    nameTouched = true;
    symbolTouched = true;
    const s = validate();
    if (!s.ok) return;
    const rec = { type: 'launch', wallet: ctx.viewer, symbol: s.symbol, name: s.name, nounId: s.nounId, preset: s.preset, rules: s.rules };
    if (s.devBuy) rec.devBuy = s.devBuy;
    const from = ctx.sim.world.events.length;
    const selectedAt = ctx.selected;
    const res = ctx.actions.record(rec);
    if (!res.ok) { showResult([['lp-error', `Not recorded: ${res.error}`]]); return; }
    const full = ctx.sim.log.at(-1);
    const batch = batches.find((b) => b.tick === res.tick);
    if (batch) batch.recs.push(full);
    else batches.push({ tick: res.tick, from, recs: [full], selectedAt });
    showResult([['lp-crt-pending', pendingText(false)]]);
    ctx.actions.announce(`Launch of ${s.symbol} recorded for tick ${res.tick}.`);
    lastSig = '';
    validate();
  });

  validate();

  /* ---------- render ---------- */

  return {
    /** Settles launches whose tick has run, then repaints only when the tick, the viewer's credits or the pending set changed. */
    render(info) {
      const sim = ctx.sim;
      if (!sim) return;
      if (batches.length) settle();
      const sig = [generation, sim.world.tick, info.finished, info.playing, creditsHeld(), batches.length].join('|');
      if (sig === lastSig) return;
      lastSig = sig;
      validate();
      if (batches.length) showResult([['lp-crt-pending', pendingText(info.playing)]]);
    },
    /** True while a launch waits for its tick, so the shell renders this view even when its panel is hidden. */
    pending: () => batches.length > 0,
    /** A new run: clear the result line and anything pending; the form keeps its values. */
    reset() {
      generation += 1;
      lastSig = '';
      batches = [];
      facts.clear();
      result.replaceChildren();
      if (!rulesTouched) rulesSel.value = ctx.settings.rules;
      validate();
    },
  };
}
