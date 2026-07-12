import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, c as renderSlot, m as maybeRenderHead, b as addAttribute, u as unescapeHTML, r as renderComponent, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$BlockCard } from './BlockCard_BfWFl5A7.mjs';
import 'clsx';
import { $ as $$PresenceBar, a as $$MoodChip } from './MoodChip_Bs_gV9ui.mjs';
import { $ as $$WalletChip } from './WalletChip_CCc3HKnc.mjs';
import contracts from './contracts_B1zhgPPX.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { p as pickDailyBlock, t as todayPT } from './daily_2eiOMuEj.mjs';
import { C as CHANNELS, a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';
import { n as nextFullMoon, h as hoursToNextFullMoon, a as namedMoonForDate } from './battler-moon-tournament_Bbz_lH4Q.mjs';
import { $ as $$NativePlantingYield } from './NativePlantingYield_2uQExJY3.mjs';
import process from 'vite-plugin-node-polyfills/shims/process';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { P as POINTCAST_APPS } from './pointcast-apps_DuRB6sfu.mjs';
import { $ as $$BuddhaHeadRotator } from './BuddhaHeadRotator_CrqbxwyL.mjs';
import { P as PLAY_SURFACES } from './play-layer_B1t_jF-o.mjs';
import { D as DERBY_SEASON } from './agent-derby_D2xATzzG.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { t as todayZenCat, e as ZEN_CATS_STORAGE_KEYS, f as ZEN_CAT_RITUALS } from './zen-cats_rLk34c8x.mjs';
import { $ as $$NounsPortraitStrip } from './NounsPortraitStrip_3imNU3-4.mjs';
import { $ as $$MintButton } from './MintButton_BMx003SY.mjs';

var __freeze$g = Object.freeze;
var __defProp$g = Object.defineProperty;
var __template$g = (cooked, raw) => __freeze$g(__defProp$g(cooked, "raw", { value: __freeze$g(raw || cooked.slice()) }));
var _a$g;
const $$BlockReorder = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$g || (_a$g = __template$g(["", '<div class="reorder-host" data-astro-cid-d4fzm2qs> <div class="reorder-toggle mono" id="pc-reorder-toggle" aria-live="polite" data-astro-cid-d4fzm2qs> <button class="reorder-toggle__btn reorder-toggle__btn--mode" id="pc-reorder-mode" type="button" aria-pressed="false" data-astro-cid-d4fzm2qs> <span class="reorder-toggle__dot" aria-hidden="true" data-astro-cid-d4fzm2qs></span> <span class="reorder-toggle__label" id="pc-reorder-label" data-astro-cid-d4fzm2qs>ARRANGE · OFF</span> </button> <button class="reorder-toggle__btn reorder-toggle__btn--reset" id="pc-reorder-reset" type="button" hidden data-astro-cid-d4fzm2qs>↻ RESET</button> <span class="reorder-toggle__hint" id="pc-reorder-hint" data-astro-cid-d4fzm2qs>tap to arrange</span> </div> ', " </div> <script>\n(function () {\n  'use strict';\n  var STORAGE_KEY = 'pc:block-order';\n\n  // ---------- storage helpers --------------------------------------------\n  function loadOrder() {\n    try {\n      var raw = localStorage.getItem(STORAGE_KEY);\n      if (!raw) return {};\n      var parsed = JSON.parse(raw);\n      return (parsed && typeof parsed === 'object') ? parsed : {};\n    } catch (e) { return {}; }\n  }\n  function saveOrder(order) {\n    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch (e) {}\n  }\n  function clearOrder() {\n    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}\n  }\n\n  function blockIdOf(el) {\n    if (!el) return null;\n    var direct = el.getAttribute && el.getAttribute('data-id');\n    if (direct) return direct;\n    var m = el.getAttribute && (el.getAttribute('aria-label') || '').match(/Block (\\d{4}):/);\n    return m ? m[1] : null;\n  }\n\n  // ---------- apply persisted order --------------------------------------\n  function applyOrder() {\n    var order = loadOrder();\n    var keys = Object.keys(order);\n    var label = document.getElementById('pc-reorder-label');\n    var resetBtn = document.getElementById('pc-reorder-reset');\n    var host = document.querySelector('.reorder-host');\n    if (keys.length > 0) {\n      host && host.classList.add('reorder-host--has-custom');\n      if (label) label.textContent = 'ARRANGE · ' + (arrangeOn ? 'ON' : 'OFF') + ' · ' + keys.length + ' MOVED';\n      if (resetBtn) resetBtn.hidden = false;\n    } else {\n      host && host.classList.remove('reorder-host--has-custom');\n      if (label) label.textContent = 'ARRANGE · ' + (arrangeOn ? 'ON' : 'OFF');\n      if (resetBtn) resetBtn.hidden = true;\n    }\n    var cards = document.querySelectorAll('.block-card');\n    cards.forEach(function (el) {\n      var id = blockIdOf(el);\n      if (!id) return;\n      if (order[id] != null) el.style.order = String(order[id]);\n      else el.style.order = '';\n    });\n  }\n\n  // ---------- mode toggle -------------------------------------------------\n  var arrangeOn = false;\n\n  function setArrange(on) {\n    arrangeOn = !!on;\n    var host = document.querySelector('.reorder-host');\n    var mode = document.getElementById('pc-reorder-mode');\n    var hint = document.getElementById('pc-reorder-hint');\n    if (host) host.classList.toggle('reorder-host--arranging', arrangeOn);\n    if (mode) mode.setAttribute('aria-pressed', arrangeOn ? 'true' : 'false');\n    if (hint) hint.textContent = arrangeOn ? 'drag any card · tap toggle to finish' : 'tap to arrange';\n    applyOrder();\n  }\n\n  // ---------- drag state --------------------------------------------------\n  var active = null;          // current dragging element\n  var placeholder = null;     // visual gap in DOM flow\n  var startX = 0, startY = 0;\n  var pointerId = null;\n\n  function onPointerDown(e) {\n    if (!arrangeOn) return;\n    var card = e.target.closest && e.target.closest('.block-card');\n    if (!card) return;\n    // Only primary button for mouse; all for touch/pen.\n    if (e.pointerType === 'mouse' && e.button !== 0) return;\n\n    e.preventDefault();\n    active = card;\n    pointerId = e.pointerId;\n    var rect = card.getBoundingClientRect();\n    startX = e.clientX - rect.left;\n    startY = e.clientY - rect.top;\n\n    // Capture the pointer so we get move/up even if pointer leaves the card.\n    try { card.setPointerCapture(pointerId); } catch (err) {}\n\n    card.classList.add('block-card--dragging');\n    card.style.position = 'fixed';\n    card.style.left = rect.left + 'px';\n    card.style.top = rect.top + 'px';\n    card.style.width = rect.width + 'px';\n    card.style.height = rect.height + 'px';\n    card.style.zIndex = '1000';\n    card.style.pointerEvents = 'none';\n\n    // Insert a placeholder to hold the space.\n    placeholder = document.createElement('div');\n    placeholder.className = 'block-card block-card--placeholder';\n    placeholder.style.width = rect.width + 'px';\n    placeholder.style.height = rect.height + 'px';\n    placeholder.style.order = card.style.order || '';\n    card.parentNode.insertBefore(placeholder, card.nextSibling);\n  }\n\n  function onPointerMove(e) {\n    if (!active || e.pointerId !== pointerId) return;\n    e.preventDefault();\n    active.style.left = (e.clientX - startX) + 'px';\n    active.style.top = (e.clientY - startY) + 'px';\n\n    // Find the card under the pointer (excluding the active and placeholder).\n    var x = e.clientX, y = e.clientY;\n    var cards = document.querySelectorAll('.block-card');\n    var nearest = null;\n    var nearestDist = Infinity;\n    cards.forEach(function (c) {\n      if (c === active || c === placeholder) return;\n      var r = c.getBoundingClientRect();\n      var cx = r.left + r.width / 2;\n      var cy = r.top + r.height / 2;\n      var d = Math.hypot(cx - x, cy - y);\n      if (d < nearestDist) { nearest = c; nearestDist = d; }\n    });\n    if (nearest && placeholder && nearest !== placeholder) {\n      var r = nearest.getBoundingClientRect();\n      // Insert placeholder before or after nearest based on pointer side.\n      var after = (x > r.left + r.width / 2) || (y > r.top + r.height / 2 && x > r.left);\n      nearest.parentNode.insertBefore(placeholder, after ? nearest.nextSibling : nearest);\n    }\n  }\n\n  function onPointerUp(e) {\n    if (!active || e.pointerId !== pointerId) return;\n    e.preventDefault();\n\n    // Move active into placeholder position.\n    if (placeholder && placeholder.parentNode) {\n      placeholder.parentNode.insertBefore(active, placeholder);\n      placeholder.parentNode.removeChild(placeholder);\n    }\n    active.classList.remove('block-card--dragging');\n    active.style.position = '';\n    active.style.left = '';\n    active.style.top = '';\n    active.style.width = '';\n    active.style.height = '';\n    active.style.zIndex = '';\n    active.style.pointerEvents = '';\n\n    try { active.releasePointerCapture(pointerId); } catch (err) {}\n    active = null;\n    placeholder = null;\n    pointerId = null;\n\n    persistDomOrder();\n    applyOrder();\n  }\n\n  function persistDomOrder() {\n    var cards = Array.prototype.slice.call(document.querySelectorAll('.block-card'));\n    var next = {};\n    cards.forEach(function (c, i) {\n      // Skip any lingering placeholders.\n      if (c.classList.contains('block-card--placeholder')) return;\n      var id = blockIdOf(c);\n      if (!id) return;\n      next[id] = i;\n    });\n    saveOrder(next);\n  }\n\n  function suppressClicksWhileArranging(e) {\n    if (!arrangeOn) return;\n    // Allow clicks on toggle + reset; suppress clicks on any card link.\n    if (e.target.closest('.reorder-toggle')) return;\n    if (e.target.closest('.block-card')) {\n      e.preventDefault();\n      e.stopPropagation();\n    }\n  }\n\n  function wire() {\n    var host = document.querySelector('.reorder-host');\n    if (!host) return;\n\n    // Pointer events on the host (delegated).\n    host.addEventListener('pointerdown', onPointerDown);\n    host.addEventListener('pointermove', onPointerMove);\n    host.addEventListener('pointerup', onPointerUp);\n    host.addEventListener('pointercancel', onPointerUp);\n\n    // Suppress card clicks while in arrange mode (capture phase).\n    host.addEventListener('click', suppressClicksWhileArranging, true);\n\n    // Toggle\n    var mode = document.getElementById('pc-reorder-mode');\n    if (mode) mode.addEventListener('click', function () { setArrange(!arrangeOn); });\n\n    // Reset\n    var reset = document.getElementById('pc-reorder-reset');\n    if (reset) reset.addEventListener('click', function () {\n      clearOrder();\n      var cards = document.querySelectorAll('.block-card');\n      cards.forEach(function (el) { el.style.order = ''; });\n      applyOrder();\n    });\n  }\n\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', function () { wire(); applyOrder(); });\n  } else {\n    wire(); applyOrder();\n  }\n})();\n<\/script>"], ["", '<div class="reorder-host" data-astro-cid-d4fzm2qs> <div class="reorder-toggle mono" id="pc-reorder-toggle" aria-live="polite" data-astro-cid-d4fzm2qs> <button class="reorder-toggle__btn reorder-toggle__btn--mode" id="pc-reorder-mode" type="button" aria-pressed="false" data-astro-cid-d4fzm2qs> <span class="reorder-toggle__dot" aria-hidden="true" data-astro-cid-d4fzm2qs></span> <span class="reorder-toggle__label" id="pc-reorder-label" data-astro-cid-d4fzm2qs>ARRANGE · OFF</span> </button> <button class="reorder-toggle__btn reorder-toggle__btn--reset" id="pc-reorder-reset" type="button" hidden data-astro-cid-d4fzm2qs>↻ RESET</button> <span class="reorder-toggle__hint" id="pc-reorder-hint" data-astro-cid-d4fzm2qs>tap to arrange</span> </div> ', " </div> <script>\n(function () {\n  'use strict';\n  var STORAGE_KEY = 'pc:block-order';\n\n  // ---------- storage helpers --------------------------------------------\n  function loadOrder() {\n    try {\n      var raw = localStorage.getItem(STORAGE_KEY);\n      if (!raw) return {};\n      var parsed = JSON.parse(raw);\n      return (parsed && typeof parsed === 'object') ? parsed : {};\n    } catch (e) { return {}; }\n  }\n  function saveOrder(order) {\n    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch (e) {}\n  }\n  function clearOrder() {\n    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}\n  }\n\n  function blockIdOf(el) {\n    if (!el) return null;\n    var direct = el.getAttribute && el.getAttribute('data-id');\n    if (direct) return direct;\n    var m = el.getAttribute && (el.getAttribute('aria-label') || '').match(/Block (\\\\d{4}):/);\n    return m ? m[1] : null;\n  }\n\n  // ---------- apply persisted order --------------------------------------\n  function applyOrder() {\n    var order = loadOrder();\n    var keys = Object.keys(order);\n    var label = document.getElementById('pc-reorder-label');\n    var resetBtn = document.getElementById('pc-reorder-reset');\n    var host = document.querySelector('.reorder-host');\n    if (keys.length > 0) {\n      host && host.classList.add('reorder-host--has-custom');\n      if (label) label.textContent = 'ARRANGE · ' + (arrangeOn ? 'ON' : 'OFF') + ' · ' + keys.length + ' MOVED';\n      if (resetBtn) resetBtn.hidden = false;\n    } else {\n      host && host.classList.remove('reorder-host--has-custom');\n      if (label) label.textContent = 'ARRANGE · ' + (arrangeOn ? 'ON' : 'OFF');\n      if (resetBtn) resetBtn.hidden = true;\n    }\n    var cards = document.querySelectorAll('.block-card');\n    cards.forEach(function (el) {\n      var id = blockIdOf(el);\n      if (!id) return;\n      if (order[id] != null) el.style.order = String(order[id]);\n      else el.style.order = '';\n    });\n  }\n\n  // ---------- mode toggle -------------------------------------------------\n  var arrangeOn = false;\n\n  function setArrange(on) {\n    arrangeOn = !!on;\n    var host = document.querySelector('.reorder-host');\n    var mode = document.getElementById('pc-reorder-mode');\n    var hint = document.getElementById('pc-reorder-hint');\n    if (host) host.classList.toggle('reorder-host--arranging', arrangeOn);\n    if (mode) mode.setAttribute('aria-pressed', arrangeOn ? 'true' : 'false');\n    if (hint) hint.textContent = arrangeOn ? 'drag any card · tap toggle to finish' : 'tap to arrange';\n    applyOrder();\n  }\n\n  // ---------- drag state --------------------------------------------------\n  var active = null;          // current dragging element\n  var placeholder = null;     // visual gap in DOM flow\n  var startX = 0, startY = 0;\n  var pointerId = null;\n\n  function onPointerDown(e) {\n    if (!arrangeOn) return;\n    var card = e.target.closest && e.target.closest('.block-card');\n    if (!card) return;\n    // Only primary button for mouse; all for touch/pen.\n    if (e.pointerType === 'mouse' && e.button !== 0) return;\n\n    e.preventDefault();\n    active = card;\n    pointerId = e.pointerId;\n    var rect = card.getBoundingClientRect();\n    startX = e.clientX - rect.left;\n    startY = e.clientY - rect.top;\n\n    // Capture the pointer so we get move/up even if pointer leaves the card.\n    try { card.setPointerCapture(pointerId); } catch (err) {}\n\n    card.classList.add('block-card--dragging');\n    card.style.position = 'fixed';\n    card.style.left = rect.left + 'px';\n    card.style.top = rect.top + 'px';\n    card.style.width = rect.width + 'px';\n    card.style.height = rect.height + 'px';\n    card.style.zIndex = '1000';\n    card.style.pointerEvents = 'none';\n\n    // Insert a placeholder to hold the space.\n    placeholder = document.createElement('div');\n    placeholder.className = 'block-card block-card--placeholder';\n    placeholder.style.width = rect.width + 'px';\n    placeholder.style.height = rect.height + 'px';\n    placeholder.style.order = card.style.order || '';\n    card.parentNode.insertBefore(placeholder, card.nextSibling);\n  }\n\n  function onPointerMove(e) {\n    if (!active || e.pointerId !== pointerId) return;\n    e.preventDefault();\n    active.style.left = (e.clientX - startX) + 'px';\n    active.style.top = (e.clientY - startY) + 'px';\n\n    // Find the card under the pointer (excluding the active and placeholder).\n    var x = e.clientX, y = e.clientY;\n    var cards = document.querySelectorAll('.block-card');\n    var nearest = null;\n    var nearestDist = Infinity;\n    cards.forEach(function (c) {\n      if (c === active || c === placeholder) return;\n      var r = c.getBoundingClientRect();\n      var cx = r.left + r.width / 2;\n      var cy = r.top + r.height / 2;\n      var d = Math.hypot(cx - x, cy - y);\n      if (d < nearestDist) { nearest = c; nearestDist = d; }\n    });\n    if (nearest && placeholder && nearest !== placeholder) {\n      var r = nearest.getBoundingClientRect();\n      // Insert placeholder before or after nearest based on pointer side.\n      var after = (x > r.left + r.width / 2) || (y > r.top + r.height / 2 && x > r.left);\n      nearest.parentNode.insertBefore(placeholder, after ? nearest.nextSibling : nearest);\n    }\n  }\n\n  function onPointerUp(e) {\n    if (!active || e.pointerId !== pointerId) return;\n    e.preventDefault();\n\n    // Move active into placeholder position.\n    if (placeholder && placeholder.parentNode) {\n      placeholder.parentNode.insertBefore(active, placeholder);\n      placeholder.parentNode.removeChild(placeholder);\n    }\n    active.classList.remove('block-card--dragging');\n    active.style.position = '';\n    active.style.left = '';\n    active.style.top = '';\n    active.style.width = '';\n    active.style.height = '';\n    active.style.zIndex = '';\n    active.style.pointerEvents = '';\n\n    try { active.releasePointerCapture(pointerId); } catch (err) {}\n    active = null;\n    placeholder = null;\n    pointerId = null;\n\n    persistDomOrder();\n    applyOrder();\n  }\n\n  function persistDomOrder() {\n    var cards = Array.prototype.slice.call(document.querySelectorAll('.block-card'));\n    var next = {};\n    cards.forEach(function (c, i) {\n      // Skip any lingering placeholders.\n      if (c.classList.contains('block-card--placeholder')) return;\n      var id = blockIdOf(c);\n      if (!id) return;\n      next[id] = i;\n    });\n    saveOrder(next);\n  }\n\n  function suppressClicksWhileArranging(e) {\n    if (!arrangeOn) return;\n    // Allow clicks on toggle + reset; suppress clicks on any card link.\n    if (e.target.closest('.reorder-toggle')) return;\n    if (e.target.closest('.block-card')) {\n      e.preventDefault();\n      e.stopPropagation();\n    }\n  }\n\n  function wire() {\n    var host = document.querySelector('.reorder-host');\n    if (!host) return;\n\n    // Pointer events on the host (delegated).\n    host.addEventListener('pointerdown', onPointerDown);\n    host.addEventListener('pointermove', onPointerMove);\n    host.addEventListener('pointerup', onPointerUp);\n    host.addEventListener('pointercancel', onPointerUp);\n\n    // Suppress card clicks while in arrange mode (capture phase).\n    host.addEventListener('click', suppressClicksWhileArranging, true);\n\n    // Toggle\n    var mode = document.getElementById('pc-reorder-mode');\n    if (mode) mode.addEventListener('click', function () { setArrange(!arrangeOn); });\n\n    // Reset\n    var reset = document.getElementById('pc-reorder-reset');\n    if (reset) reset.addEventListener('click', function () {\n      clearOrder();\n      var cards = document.querySelectorAll('.block-card');\n      cards.forEach(function (el) { el.style.order = ''; });\n      applyOrder();\n    });\n  }\n\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', function () { wire(); applyOrder(); });\n  } else {\n    wire(); applyOrder();\n  }\n})();\n<\/script>"])), maybeRenderHead(), renderSlot($$result, $$slots["default"]));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/BlockReorder.astro", void 0);

var __freeze$f = Object.freeze;
var __defProp$f = Object.defineProperty;
var __template$f = (cooked, raw) => __freeze$f(__defProp$f(cooked, "raw", { value: __freeze$f(cooked.slice()) }));
var _a$f;
const $$HomeMajors = createComponent(($$result, $$props, $$slots) => {
  const prizeCastKt1 = (contracts.prize_cast?.mainnet).trim();
  const prizeCastStatus = prizeCastKt1 ? "LIVE" : "PENDING";
  return renderTemplate(_a$f || (_a$f = __template$f(["", '<section class="majors" aria-label="Major modules" data-astro-cid-5prfvaiz>  <article class="major major--drum" data-astro-cid-5prfvaiz> <header class="major__head" data-astro-cid-5prfvaiz> <span class="major__kicker mono" data-astro-cid-5prfvaiz>CH.SPN · DRUM ROOM</span> <span class="major__tag mono" data-astro-cid-5prfvaiz>TAP TO START</span> </header> <div class="drum-mini" id="drum-mini" data-astro-cid-5prfvaiz> <button type="button" class="drum-mini__tap" data-drum-pitch="70" aria-label="Tap low drum" data-astro-cid-5prfvaiz> <img src="https://noun.pics/20.svg" alt="" loading="lazy" draggable="false" data-astro-cid-5prfvaiz> <span class="drum-mini__label mono" data-astro-cid-5prfvaiz>LOW</span> </button> <button type="button" class="drum-mini__tap" data-drum-pitch="110" aria-label="Tap mid drum" data-astro-cid-5prfvaiz> <img src="https://noun.pics/42.svg" alt="" loading="lazy" draggable="false" data-astro-cid-5prfvaiz> <span class="drum-mini__label mono" data-astro-cid-5prfvaiz>MID</span> </button> <button type="button" class="drum-mini__tap" data-drum-pitch="170" aria-label="Tap high drum" data-astro-cid-5prfvaiz> <img src="https://noun.pics/101.svg" alt="" loading="lazy" draggable="false" data-astro-cid-5prfvaiz> <span class="drum-mini__label mono" data-astro-cid-5prfvaiz>HIGH</span> </button> </div> <dl class="major__stats" data-astro-cid-5prfvaiz> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>YOURS</dt> <dd class="mono" id="drum-mini-your" data-astro-cid-5prfvaiz>—</dd> </div> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>GLOBAL</dt> <dd class="mono" id="drum-mini-global" data-astro-cid-5prfvaiz>—</dd> </div> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>STATUS</dt> <dd class="mono" id="drum-mini-status" data-astro-cid-5prfvaiz>READY</dd> </div> </dl> <footer class="major__foot" data-astro-cid-5prfvaiz> <a class="major__cta" href="/drum" data-astro-cid-5prfvaiz> <span class="major__cta-label" data-astro-cid-5prfvaiz>Open drum room</span> <span aria-hidden="true" data-astro-cid-5prfvaiz>→</span> </a> <span class="major__note mono" data-astro-cid-5prfvaiz>DRUM TOKEN · SOON</span> </footer> </article>  <article class="major major--cast" data-astro-cid-5prfvaiz> <header class="major__head" data-astro-cid-5prfvaiz> <span class="major__kicker mono" data-astro-cid-5prfvaiz>CH.CST · PRIZE CAST</span> <span', " data-astro-cid-5prfvaiz> ", ` </span> </header> <div class="cast-mini" data-astro-cid-5prfvaiz> <p class="cast-mini__label mono" data-astro-cid-5prfvaiz>NEXT DRAW · SUN 18:00 UTC</p> <p class="cast-mini__count" id="cast-mini-count" data-role="countdown" data-astro-cid-5prfvaiz>— d — h — m — s</p> </div> <dl class="major__stats" data-astro-cid-5prfvaiz> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>CADENCE</dt> <dd data-astro-cid-5prfvaiz>Weekly</dd> </div> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>MODEL</dt> <dd data-astro-cid-5prfvaiz>No-loss · yield prize</dd> </div> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>NETWORK</dt> <dd data-astro-cid-5prfvaiz>Tezos</dd> </div> </dl> <footer class="major__foot" data-astro-cid-5prfvaiz> <a class="major__cta" href="/cast" data-astro-cid-5prfvaiz> <span class="major__cta-label" data-astro-cid-5prfvaiz>Open Prize Cast</span> <span aria-hidden="true" data-astro-cid-5prfvaiz>→</span> </a> <span class="major__note mono" data-astro-cid-5prfvaiz>DEPOSIT · PENDING ORIGINATION</span> </footer> </article>  <article class="major major--meditate" data-astro-cid-5prfvaiz> <header class="major__head" data-astro-cid-5prfvaiz> <span class="major__kicker mono" data-astro-cid-5prfvaiz>CH.GDN · OCEAN RESET</span> <span class="major__tag mono" data-astro-cid-5prfvaiz>2 MIN</span> </header> <div class="ocean-mini" data-astro-cid-5prfvaiz> <img src="/images/tokens/breathe-el-segundo.webp" alt="" loading="lazy" decoding="async" data-astro-cid-5prfvaiz> <div class="ocean-mini__scene" aria-hidden="true" data-astro-cid-5prfvaiz> <span class="ocean-mini__sun" data-astro-cid-5prfvaiz></span> <span class="ocean-mini__orb" data-astro-cid-5prfvaiz></span> <span class="ocean-mini__wave ocean-mini__wave--back" data-astro-cid-5prfvaiz></span> <span class="ocean-mini__wave ocean-mini__wave--front" data-astro-cid-5prfvaiz></span> </div> </div> <dl class="major__stats" data-astro-cid-5prfvaiz> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>DEFAULT</dt> <dd data-astro-cid-5prfvaiz>Calm Bay</dd> </div> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>BREATH</dt> <dd data-astro-cid-5prfvaiz>4-2-6-2</dd> </div> <div data-astro-cid-5prfvaiz> <dt class="mono" data-astro-cid-5prfvaiz>LOG</dt> <dd data-astro-cid-5prfvaiz>Local</dd> </div> </dl> <footer class="major__foot" data-astro-cid-5prfvaiz> <a class="major__cta" href="/meditate" data-astro-cid-5prfvaiz> <span class="major__cta-label" data-astro-cid-5prfvaiz>Open Ocean Reset</span> <span aria-hidden="true" data-astro-cid-5prfvaiz>→</span> </a> <span class="major__note mono" data-astro-cid-5prfvaiz>FOCUS MODE · AUDIO OPTIONAL</span> </footer> </article> </section> <script>
  /**
   * Trimmed taiko synth — just the "thump" variant (sine sweep + noise burst)
   * because the mini doesn't need bell/shaker. Lazy-init the AudioContext so
   * Safari's autoplay policy is respected: a real context only gets created
   * on the first user tap.
   */
  (function () {
    const ctxBox = { ctx: null };
    function getCtx() {
      if (ctxBox.ctx) return ctxBox.ctx;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try { ctxBox.ctx = new Ctor(); } catch { return null; }
      return ctxBox.ctx;
    }

    function playThump(pitch) {
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch {} }
      const now = ctx.currentTime;

      const out = ctx.createGain();
      out.connect(ctx.destination);
      out.gain.setValueAtTime(0, now);
      out.gain.linearRampToValueAtTime(0.38, now + 0.003);
      out.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + 0.12);
      osc.connect(out);
      osc.start(now);
      osc.stop(now + 0.3);

      const bufSize = Math.floor(ctx.sampleRate * 0.04);
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    }

    // Counter — shared with /drum via localStorage key 'pc:drum-your'
    const YOUR_KEY = 'pc:drum-your';
    function readYour() {
      try { return Number(localStorage.getItem(YOUR_KEY) || 0); } catch { return 0; }
    }
    function writeYour(n) {
      try { localStorage.setItem(YOUR_KEY, String(n)); } catch {}
    }

    const yourEl = document.getElementById('drum-mini-your');
    const globalEl = document.getElementById('drum-mini-global');
    const statusEl = document.getElementById('drum-mini-status');
    if (!yourEl || !globalEl) return;

    let yourCount = readYour();
    yourEl.textContent = String(yourCount);

    // Try to pull global drum count from /api/drum. If 404 or network
    // fails, keep a dash — no error noise.
    fetch('/api/drum')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const total = Number(j?.total ?? j?.count ?? 0);
        globalEl.textContent = total > 0 ? total.toLocaleString('en-US') : '—';
      })
      .catch(() => {
        globalEl.textContent = '—';
      });

    document.querySelectorAll('#drum-mini .drum-mini__tap').forEach(function (btn) {
      btn.addEventListener('pointerdown', function () {
        const pitch = Number(btn.getAttribute('data-drum-pitch') || 110);
        playThump(pitch);
        yourCount += 1;
        yourEl.textContent = String(yourCount);
        writeYour(yourCount);
        if (statusEl) statusEl.textContent = 'DRUMMING';
        // Tiny bump animation on the tap tile
        btn.classList.add('drum-mini__tap--hit');
        setTimeout(function () { btn.classList.remove('drum-mini__tap--hit'); }, 180);

        // Fire-and-forget global increment. The /api/drum endpoint bumps
        // a KV counter; we don't need the response here (the home card's
        // global count is stale-tolerant).
        fetch('/api/drum', { method: 'POST' }).catch(function () {});
      });
    });
  })();

  /**
   * Prize Cast countdown — ticks every second until Sunday 18:00 UTC.
   */
  (function () {
    const el = document.getElementById('cast-mini-count');
    if (!el) return;

    function nextSunday18() {
      const now = new Date();
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 0, 0, 0));
      const delta = (7 - now.getUTCDay()) % 7;
      d.setUTCDate(d.getUTCDate() + delta);
      if (delta === 0 && now.getTime() >= d.getTime()) d.setUTCDate(d.getUTCDate() + 7);
      return d;
    }

    function tick() {
      const diff = Math.max(0, nextSunday18().getTime() - Date.now());
      const mins = Math.floor(diff / 60000);
      const d = Math.floor(mins / 1440);
      const h = Math.floor((mins % 1440) / 60);
      const m = mins % 60;
      const s = Math.floor((diff / 1000) % 60);
      el.textContent = d + 'd ' + String(h).padStart(2, '0') + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's';
    }

    tick();
    setInterval(tick, 1000);
  })();
<\/script>`])), maybeRenderHead(), addAttribute(`major__tag mono major__tag--${prizeCastKt1 ? "live" : "pending"}`, "class"), prizeCastStatus);
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/HomeMajors.astro", void 0);

var __freeze$e = Object.freeze;
var __defProp$e = Object.defineProperty;
var __template$e = (cooked, raw) => __freeze$e(__defProp$e(cooked, "raw", { value: __freeze$e(cooked.slice()) }));
var _a$e;
const $$SitTile = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$e || (_a$e = __template$e(["", `<a class="sit-tile mono" id="sit-tile" href="/sit" hidden aria-label="sit room — multiplayer presence" data-astro-cid-2b2nsr66> <span class="sit-tile__dot" aria-hidden="true" data-astro-cid-2b2nsr66></span> <span class="sit-tile__path" data-astro-cid-2b2nsr66>/sit</span> <span class="sit-tile__sep" aria-hidden="true" data-astro-cid-2b2nsr66>·</span> <span class="sit-tile__count" data-astro-cid-2b2nsr66><span data-role="sitting" data-astro-cid-2b2nsr66>0</span> sitting now</span> </a> <script>
  (function () {
    var tile = document.getElementById('sit-tile');
    if (!tile) return;
    var sitEl = tile.querySelector('[data-role="sitting"]');

    function show(n) {
      if (!sitEl) return;
      sitEl.textContent = String(n);
      tile.removeAttribute('hidden');
    }

    // Skip in environments where /api/sit will never exist (file://, naked
    // localhost without Functions). Same gate PresenceBar uses — keeps
    // local dev quiet.
    var host = window.location.host;
    var hasFunctions = host.endsWith('pointcast.xyz') || host.endsWith('.pages.dev');
    if (!hasFunctions) return;

    var ws = null;
    var connectTimer = window.setTimeout(function () {
      try { ws && ws.close(); } catch {}
      // HTTP fallback
      fetch('/api/sit/presence', { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j) return;
          var n = Number(j.sitting || j.count || 0);
          if (n > 0) show(n);
        })
        .catch(function () {});
    }, 4000);

    try {
      var proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      ws = new WebSocket(proto + host + '/api/sit');
    } catch { return; }

    ws.addEventListener('open', function () {
      clearTimeout(connectTimer);
    });
    ws.addEventListener('message', function (evt) {
      try {
        var msg = JSON.parse(evt.data);
        if (msg && msg.type === 'presence' && Number(msg.sitting) > 0) {
          show(Number(msg.sitting));
        }
      } catch {}
    });
    ws.addEventListener('error', function () { clearTimeout(connectTimer); });
  })();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/SitTile.astro", void 0);

var __freeze$d = Object.freeze;
var __defProp$d = Object.defineProperty;
var __template$d = (cooked, raw) => __freeze$d(__defProp$d(cooked, "raw", { value: __freeze$d(cooked.slice()) }));
var _a$d;
const $$FreshDeck = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$d || (_a$d = __template$d(["", `<aside class="fresh-deck" id="fresh-deck" hidden aria-label="Fresh on this visit" data-astro-cid-ntzgj5kb> <p class="fresh-deck__kicker mono" data-astro-cid-ntzgj5kb> <span class="fresh-deck__label" data-astro-cid-ntzgj5kb>FRESH ON THIS VISIT</span> <span class="fresh-deck__sub" data-astro-cid-ntzgj5kb>· 3 RANDOM PICKS · TAP TO READ</span> </p> <div class="fresh-deck__row" id="fresh-deck-row" role="list" data-astro-cid-ntzgj5kb></div> </aside> <script>
  (function () {
    /* Wait for the grid to exist (it renders below this component in
     * source order; runs after parse). */
    function init() {
      const grid = document.querySelector('.grid');
      const dest = document.getElementById('fresh-deck-row');
      const wrap = document.getElementById('fresh-deck');
      if (!grid || !dest || !wrap) return;

      const cards = Array.from(grid.querySelectorAll('.block-card[data-id]'));
      if (cards.length < 3) return;

      // Partial Fisher-Yates: pick 3 unique indexes without sorting the rest.
      const picks = [];
      const pool = cards.slice();
      for (let i = 0; i < 3 && pool.length > 0; i++) {
        const j = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(j, 1)[0]);
      }

      const frag = document.createDocumentFragment();
      picks.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.classList.add('fresh-deck__card');
        // Strip grid-span classes so the cloned card flows in the deck row.
        ['span-2x1', 'span-2x2', 'span-1x2', 'span-3x2'].forEach((c) => clone.classList.remove(c));
        clone.classList.add('span-1x1');
        clone.setAttribute('role', 'listitem');
        // Add a small data-attr so we can spot fresh-deck cards in dev.
        clone.dataset.fresh = '1';
        frag.appendChild(clone);
      });

      dest.appendChild(frag);
      wrap.hidden = false;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FreshDeck.astro", void 0);

var __freeze$c = Object.freeze;
var __defProp$c = Object.defineProperty;
var __template$c = (cooked, raw) => __freeze$c(__defProp$c(cooked, "raw", { value: __freeze$c(cooked.slice()) }));
var _a$c;
const $$PollsOnHome = createComponent(async ($$result, $$props, $$slots) => {
  const polls = (await getCollection("polls", ({ data }) => !data.draft)).sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime()).slice(0, 8);
  const pollSlugsOrder = polls.map((p) => p.data.slug);
  const labelBySlug = {};
  for (const p of polls) {
    labelBySlug[p.data.slug] = p.data.options.reduce((acc, o) => {
      acc[o.id] = o.label;
      return acc;
    }, {});
  }
  return renderTemplate(_a$c || (_a$c = __template$c(["", '<script type="application/json" id="polls-home-label-map">', `<\/script><script>
  (function () {
    var mapEl = document.getElementById('polls-home-label-map');
    if (!mapEl) return;

    var cards = Array.from(document.querySelectorAll('.polls-home__card[data-poll-slug]'));

    // ── Freshness filter ─────────────────────────────────────────────
    // Mike 2026-04-19 morning: "ive done these polls, should we refresh
    // with new ones when complete". Walk the rendered list, hide any
    // poll the user has already voted on, keep only the first 2
    // unvoted visible. If all are voted, show the "caught up" card.
    var VISIBLE_SLOTS = 2;
    var shown = 0;
    cards.forEach(function (card) {
      var slug = card.getAttribute('data-poll-slug');
      var voted = false;
      try { voted = !!localStorage.getItem('pc:poll:voted:' + slug); } catch (e) {}
      if (voted || shown >= VISIBLE_SLOTS) {
        card.hidden = true;
        card.setAttribute('data-filtered', voted ? 'voted' : 'overflow');
      } else {
        card.hidden = false;
        shown += 1;
      }
    });

    // If we hid everything (all voted), surface the caught-up card.
    var caughtUp = document.getElementById('polls-caught-up');
    if (caughtUp) {
      if (shown === 0) {
        caughtUp.hidden = false;
      } else {
        caughtUp.hidden = true;
      }
    }

    // Only wire up visible-and-unvoted cards. Hidden cards don't need
    // the vote handler since the user can't see or click them.
    cards.filter(function (c) { return !c.hidden; }).forEach(function (card) {
      var slug = card.getAttribute('data-poll-slug');
      var optsDiv = card.querySelector('[data-poll-options]');
      var distDiv = card.querySelector('[data-poll-dist]');
      var statusEl = card.querySelector('[data-poll-status]');
      var buttons = Array.from(card.querySelectorAll('.polls-home__opt'));
      var lsKey = 'pc:poll:voted:' + slug;

      function setStatus(msg, kind) {
        if (!statusEl) return;
        statusEl.textContent = msg || '';
        statusEl.dataset.kind = kind || '';
      }

      function showDist(tally, total, votedFor) {
        if (!distDiv) return;
        optsDiv.hidden = true;
        distDiv.hidden = false;
        var max = 0;
        for (var k in tally) if (tally[k] > max) max = tally[k];
        max = Math.max(max, 1);
        Array.from(distDiv.querySelectorAll('[data-option-id]')).forEach(function (row) {
          var id = row.getAttribute('data-option-id');
          var count = tally[id] || 0;
          var pct = total > 0 ? Math.round((count / total) * 100) : 0;
          row.querySelector('[data-fill]').style.width = ((count / max) * 100) + '%';
          row.querySelector('[data-pct]').textContent = pct + '%';
          row.classList.toggle('polls-home__bar--leader', count === max && count > 0);
          row.classList.toggle('polls-home__bar--voted', id === votedFor);
        });
      }

      function fetchTally(votedFor) {
        fetch('/api/poll?slug=' + encodeURIComponent(slug), { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) {
            if (!j || !j.ok) return;
            showDist(j.tally || {}, j.total || 0, votedFor);
          })
          .catch(function () {});
      }

      // If prior vote exists, this card shouldn't have passed the
      // filter above — but guard anyway in case of race conditions.
      try {
        var prior = localStorage.getItem(lsKey);
        if (prior) {
          card.hidden = true;
          return;
        }
      } catch (e) {}

      // ═ JUICE ═ tap-time sensory feedback (cookie-clicker vibe)
      var actx = null;
      function chime(freq, dur) {
        try {
          if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
          var o = actx.createOscillator(), g = actx.createGain();
          o.type = 'sine'; o.frequency.value = freq || 720;
          g.gain.setValueAtTime(0, actx.currentTime);
          g.gain.linearRampToValueAtTime(0.09, actx.currentTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0005, actx.currentTime + (dur || 0.18));
          o.connect(g).connect(actx.destination);
          o.start(); o.stop(actx.currentTime + (dur || 0.18) + 0.05);
        } catch(e) {}
      }
      function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e) {} }
      function ripple(btn, ev) {
        try {
          var r = document.createElement('span');
          r.className = 'juice-ripple';
          var rect = btn.getBoundingClientRect();
          var x = ev && ev.clientX ? ev.clientX - rect.left : rect.width / 2;
          var y = ev && ev.clientY ? ev.clientY - rect.top : rect.height / 2;
          r.style.left = x + 'px'; r.style.top = y + 'px';
          btn.style.position = 'relative'; btn.style.overflow = 'hidden';
          btn.appendChild(r);
          setTimeout(function() { if (r.parentNode) r.parentNode.removeChild(r); }, 700);
        } catch(e) {}
      }
      function xpFloat(btn, text) {
        try {
          var x = document.createElement('span');
          x.className = 'juice-xp';
          x.textContent = text || '+1 XP';
          var rect = btn.getBoundingClientRect();
          x.style.left = (rect.width / 2) + 'px';
          x.style.top = '0';
          btn.style.position = 'relative';
          btn.appendChild(x);
          setTimeout(function() { if (x.parentNode) x.parentNode.removeChild(x); }, 950);
        } catch(e) {}
      }
      function inferMode() { return card.getAttribute('data-poll-purpose') || 'coordination'; }

      buttons.forEach(function (b) {
        b.addEventListener('click', function (ev) {
          if (b.disabled) return;
          buttons.forEach(function (x) { x.disabled = true; });
          var id = b.getAttribute('data-option-id');
          ripple(b, ev); chime(720, 0.14); buzz(10);
          setStatus('locking in…', '');
          fetch('/api/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'pc-poll-v1',
              slug: slug,
              optionId: id,
              via: 'home',
              timestamp: new Date().toISOString(),
            }),
          })
            .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
            .then(function (res) {
              if (res.status === 200 && res.body.ok) {
                try { localStorage.setItem(lsKey, id); } catch (e) {}
                xpFloat(b, '+1 XP'); chime(880, 0.16);
                if (window.pcVoter && window.pcVoter.record) {
                  window.pcVoter.record({ slug: slug, mode: inferMode() });
                } else {
                  try { window.dispatchEvent(new CustomEvent('pc:voter-updated')); } catch (e) {}
                }
                setStatus('✓ locked · ' + id, 'voted');
                fetchTally(id);
              } else if (res.status === 409 && res.body.error === 'already-voted') {
                try { localStorage.setItem(lsKey, res.body.votedFor); } catch (e) {}
                setStatus('already voted · ' + res.body.votedFor, 'warn');
                fetchTally(res.body.votedFor);
              } else if (res.status === 503) {
                setStatus('KV not bound', 'err');
                buttons.forEach(function (x) { x.disabled = false; });
              } else {
                setStatus('failed', 'err');
                buttons.forEach(function (x) { x.disabled = false; });
              }
            })
            .catch(function () {
              setStatus('network error', 'err');
              buttons.forEach(function (x) { x.disabled = false; });
            });
        });
      });
    });
  })();
<\/script><script>
  // After paint, apply width via CSS var so the bars actually fill.
  setTimeout(function () {
    document.querySelectorAll('.polls-home__bar').forEach(function (bar) {
      var fill = bar.querySelector('[data-fill]');
      if (!fill) return;
      var w = fill.style.width || '0%';
      bar.style.setProperty('--fill-width', w);
    });
  }, 0);
  // Re-sync on any mutations (when tally paints)
  var mo = new MutationObserver(function () {
    document.querySelectorAll('.polls-home__bar').forEach(function (bar) {
      var fill = bar.querySelector('[data-fill]');
      if (!fill) return;
      bar.style.setProperty('--fill-width', fill.style.width || '0%');
    });
  });
  mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style'] });
<\/script>`])), polls.length > 0 && renderTemplate`${maybeRenderHead()}<aside class="polls-home" aria-label="Live polls — tap to vote"${addAttribute(pollSlugsOrder.join(","), "data-poll-order")} data-astro-cid-lfdcg2ha><p class="polls-home__kicker mono" data-astro-cid-lfdcg2ha><span class="polls-home__label" data-astro-cid-lfdcg2ha>LIVE POLLS · TAP AN OPTION · VOTE LANDS HERE</span><a class="polls-home__all" href="/polls" data-astro-cid-lfdcg2ha>see all →</a></p><div class="polls-home__row" id="polls-home-row" data-astro-cid-lfdcg2ha>${polls.map((p) => renderTemplate`<article class="polls-home__card"${addAttribute(p.data.slug, "data-poll-slug")}${addAttribute(p.data.purpose ?? "coordination", "data-poll-purpose")} data-astro-cid-lfdcg2ha><div class="polls-home__card-head" data-astro-cid-lfdcg2ha><span${addAttribute(`purpose-chip purpose-chip--${p.data.purpose ?? "coordination"} mono`, "class")} data-astro-cid-lfdcg2ha>${(p.data.purpose ?? "coordination").toUpperCase()}</span><a class="polls-home__slug mono"${addAttribute(`/poll/${p.data.slug}`, "href")} title="Open full poll" data-astro-cid-lfdcg2ha>/${p.data.slug} →</a></div><h3 class="polls-home__q" data-astro-cid-lfdcg2ha>${p.data.question}</h3><div class="polls-home__options" data-poll-options data-astro-cid-lfdcg2ha>${p.data.options.map((o) => renderTemplate`<button type="button" class="polls-home__opt"${addAttribute(o.id, "data-option-id")}${addAttribute(o.label, "data-option-label")} data-astro-cid-lfdcg2ha><span class="polls-home__opt-label" data-astro-cid-lfdcg2ha>${o.label}</span></button>`)}</div><div class="polls-home__dist" data-poll-dist hidden data-astro-cid-lfdcg2ha>${p.data.options.map((o) => renderTemplate`<div class="polls-home__bar"${addAttribute(o.id, "data-option-id")} data-astro-cid-lfdcg2ha><span class="polls-home__bar-label" data-astro-cid-lfdcg2ha>${o.label}</span><span class="polls-home__bar-track" data-astro-cid-lfdcg2ha><span class="polls-home__bar-fill" data-fill style="width: 0%" data-astro-cid-lfdcg2ha></span></span><span class="polls-home__bar-pct mono" data-pct data-astro-cid-lfdcg2ha>—</span></div>`)}</div><p class="polls-home__status mono" data-poll-status data-astro-cid-lfdcg2ha></p></article>`)}<article class="polls-home__card polls-home__card--caught-up" id="polls-caught-up" hidden data-astro-cid-lfdcg2ha><div class="polls-home__card-head" data-astro-cid-lfdcg2ha><span class="purpose-chip purpose-chip--utility mono" data-astro-cid-lfdcg2ha>CAUGHT UP</span><a class="polls-home__slug mono" href="/polls" data-astro-cid-lfdcg2ha>/polls →</a></div><h3 class="polls-home__q" data-astro-cid-lfdcg2ha>You've voted every live poll. ✓</h3><p class="polls-home__caught-text" data-astro-cid-lfdcg2ha>New polls drop with each sprint tick. Check <a href="/polls" data-astro-cid-lfdcg2ha>/polls</a> for the full archive + cross-cohort tallies.</p></article></div></aside>`, unescapeHTML(JSON.stringify(labelBySlug)));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PollsOnHome.astro", void 0);

var __freeze$b = Object.freeze;
var __defProp$b = Object.defineProperty;
var __template$b = (cooked, raw) => __freeze$b(__defProp$b(cooked, "raw", { value: __freeze$b(cooked.slice()) }));
var _a$b;
const $$FreshStrip = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const newest = blocks[0];
  const newestId = newest?.data.id ?? "";
  newest?.data.title ?? "";
  const newestTimestampMs = newest?.data.timestamp.getTime() ?? 0;
  const candidateIds = blocks.slice(1, 21).map((b) => b.data.id);
  const daily = pickDailyBlock(blocks);
  const dailyId = daily?.data.id ?? "";
  const todayStr = todayPT();
  return renderTemplate(_a$b || (_a$b = __template$b(["", '<aside class="fresh-strip" aria-label="Fresh signal"', "", "", "", "", ' data-astro-cid-xwmmqj7a> <div class="fresh-strip__row" data-astro-cid-xwmmqj7a> <span class="fresh-strip__badge fresh-strip__badge--loading mono" id="fresh-badge" data-astro-cid-xwmmqj7a> <span class="fresh-strip__dot" aria-hidden="true" data-astro-cid-xwmmqj7a></span> <span class="fresh-strip__badge-label" data-astro-cid-xwmmqj7a>HELLO</span> </span> <span class="fresh-strip__sep mono" aria-hidden="true" data-astro-cid-xwmmqj7a>·</span> <span class="fresh-strip__meta mono" data-astro-cid-xwmmqj7a> <span class="fresh-strip__meta-label" data-astro-cid-xwmmqj7a>LAST DROP</span> <span class="fresh-strip__meta-sep" aria-hidden="true" data-astro-cid-xwmmqj7a>·</span> <time class="fresh-strip__ago" id="fresh-ago"', ` data-astro-cid-xwmmqj7a>just now</time> </span> <span class="fresh-strip__sep mono" aria-hidden="true" data-astro-cid-xwmmqj7a>·</span> <span class="fresh-strip__hello mono" id="fresh-hello" title="HELLO — presence points. +1 per day for showing up. Stored in this browser." data-astro-cid-xwmmqj7a> <span class="fresh-strip__hello-star" aria-hidden="true" data-astro-cid-xwmmqj7a>✦</span> <span class="fresh-strip__hello-label" data-astro-cid-xwmmqj7a>HELLO</span> <span class="fresh-strip__hello-count" id="fresh-hello-count" data-astro-cid-xwmmqj7a>0</span> </span> <span class="fresh-strip__spacer" aria-hidden="true" data-astro-cid-xwmmqj7a></span> <a class="fresh-strip__cta" id="fresh-cta" href="/start" aria-label="Start here — 5-step tour for first-time visitors" data-astro-cid-xwmmqj7a> <span class="fresh-strip__cta-label mono" data-astro-cid-xwmmqj7a>START HERE</span> <span class="fresh-strip__cta-arrow" aria-hidden="true" data-astro-cid-xwmmqj7a>→</span> </a> </div> <p class="sr-only" aria-live="polite" id="fresh-sr" data-astro-cid-xwmmqj7a></p> </aside> <script>
  (function () {
    const strip = document.querySelector('.fresh-strip');
    if (!strip) return;

    const newestId = strip.dataset.newestId || '';
    const newestMs = parseInt(strip.dataset.newestMs || '0', 10);
    const candidates = (strip.dataset.candidates || '').split(',').filter(Boolean);
    const dailyId = strip.dataset.dailyId || '';
    const today = strip.dataset.today || '';

    const badge = document.getElementById('fresh-badge');
    const badgeLabel = badge ? badge.querySelector('.fresh-strip__badge-label') : null;
    const cta = document.getElementById('fresh-cta');
    const ctaLabel = cta ? cta.querySelector('.fresh-strip__cta-label') : null;
    const ago = document.getElementById('fresh-ago');
    const sr = document.getElementById('fresh-sr');

    const LS_KEY = 'pc:lastVisit';
    const NOW = Date.now();

    // Read last visit (ISO string) from localStorage.
    let lastVisit = 0;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed > 0) lastVisit = parsed;
      }
    } catch (e) { /* localStorage disabled */ }

    // Count blocks newer than lastVisit using the embedded newestMs as
    // the latest timestamp. The exact per-block count would need a full
    // list — but for the badge we just need first-time vs some vs none.
    // "Some" is a heuristic good enough for a morning glance.
    let state = 'hello';
    let count = 0;
    if (lastVisit === 0) {
      state = 'hello';
    } else if (newestMs > lastVisit) {
      state = 'fresh';
      // We know there's at least one. We don't have per-block counts
      // client-side, but we can approximate by reading /blocks.json
      // asynchronously — see below.
      count = 1;
    } else {
      state = 'caught-up';
    }

    function paint() {
      if (!badge || !badgeLabel || !cta || !ctaLabel) return;

      badge.classList.remove('fresh-strip__badge--loading', 'fresh-strip__badge--hello', 'fresh-strip__badge--fresh', 'fresh-strip__badge--caught');

      if (state === 'hello') {
        badge.classList.add('fresh-strip__badge--hello');
        badgeLabel.textContent = 'HELLO';
        ctaLabel.textContent = 'START HERE';
        cta.href = '/start';
        if (sr) sr.textContent = 'Welcome. Take the 5-step tour.';
      } else if (state === 'fresh') {
        badge.classList.add('fresh-strip__badge--fresh');
        const label = count > 1 ? count + ' NEW' : 'NEW';
        badgeLabel.textContent = label;
        ctaLabel.textContent = 'JUMP IN';
        cta.href = '/b/' + newestId;
        if (sr) sr.textContent = count + ' new since your last visit. Jump in at the newest block.';
      } else {
        // CAUGHT UP — check whether today's daily drop is still available.
        // If visitor hasn't claimed today's drop yet, route them there;
        // it's a concrete "something to do now" vs. a random older block.
        // Per Mike 2026-04-19 morning feedback ("nothing to do") + the
        // /today daily-drop surface shipped earlier this morning.
        badge.classList.add('fresh-strip__badge--caught');
        badgeLabel.textContent = 'CAUGHT UP';
        let routedToDaily = false;
        if (dailyId && today) {
          let claimedToday = false;
          try {
            const raw = localStorage.getItem('pc:daily:collected');
            if (raw) {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) claimedToday = arr.some(function (c) { return c && c.date === today; });
            }
          } catch (e) { /* ignore */ }
          if (!claimedToday) {
            ctaLabel.textContent = "TODAY'S DROP";
            cta.href = '/today';
            if (sr) sr.textContent = "Caught up on the feed. Today's drop is still waiting — tap to collect.";
            routedToDaily = true;
          }
        }
        if (!routedToDaily) {
          const pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : newestId;
          ctaLabel.textContent = 'REVISIT';
          cta.href = '/b/' + pick;
          if (sr) sr.textContent = 'Caught up and claimed. Tap to revisit an older block.';
        }
      }
    }

    // Pretty-ago for LAST DROP.
    function prettyAgo(ms) {
      const delta = Math.max(0, NOW - ms);
      const s = Math.floor(delta / 1000);
      if (s < 60) return 'just now';
      const m = Math.floor(s / 60);
      if (m < 60) return m + ' min ago';
      const h = Math.floor(m / 60);
      if (h < 24) return h + 'h ago';
      const d = Math.floor(h / 24);
      if (d < 7) return d + 'd ago';
      return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (ago && newestMs) ago.textContent = prettyAgo(newestMs);

    paint();

    // Refine count by fetching /blocks.json — swap the badge label if we
    // can compute a precise number. Non-blocking; if it fails, the
    // heuristic label stays.
    if (state === 'fresh' && lastVisit > 0) {
      fetch('/blocks.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !Array.isArray(j.blocks)) return;
          const precise = j.blocks.filter(function (b) {
            const ts = Date.parse(b.timestamp);
            return !isNaN(ts) && ts > lastVisit;
          }).length;
          if (precise > 0 && precise !== count) {
            count = precise;
            paint();
          }
        })
        .catch(function () { /* keep heuristic */ });
    }

    // Mark this visit AFTER painting — so the next visit's comparison
    // is against the arrival moment of this one, not post-interaction.
    try { localStorage.setItem(LS_KEY, String(NOW)); } catch (e) {}

    // ── HELLO: daily presence points ─────────────────────────────────
    //
    // +1 per day for arriving. First visit ever = +1. First visit on a
    // new PT calendar date = +1. Same-day revisits don't add.
    //
    // This is intentionally simple v0. Future path: spend HELLO for
    // perks (custom noun, mood-slug authoring, etc.) OR convert to a
    // Tezos HELLO token once a daylight decision on custody lands.
    // See block 0280 (wallet ladder) for the framing — this sits at
    // Rung 3-ish today and can graduate later without losing the count.
    const HELLO_COUNT_KEY = 'pc:hello:count';
    const HELLO_DAY_KEY = 'pc:hello:lastDay';
    const helloEl = document.getElementById('fresh-hello');
    const helloCountEl = document.getElementById('fresh-hello-count');

    function todayPTStr() {
      try {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
      } catch (e) {
        // en-CA gives YYYY-MM-DD; fallback if the runtime rejects it.
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
      }
    }

    function spawnHelloFloat(amount) {
      if (!helloEl) return;
      const f = document.createElement('span');
      f.className = 'fresh-strip__hello-float';
      f.textContent = '+' + amount + ' HELLO';
      f.setAttribute('aria-hidden', 'true');
      helloEl.appendChild(f);
      // Remove after animation completes (CSS handles the animation).
      setTimeout(function () {
        if (f.parentNode) f.parentNode.removeChild(f);
      }, 1800);
    }

    let count = 0;
    try {
      const rawCount = localStorage.getItem(HELLO_COUNT_KEY);
      if (rawCount) {
        const parsed = parseInt(rawCount, 10);
        if (!isNaN(parsed) && parsed >= 0) count = parsed;
      }
    } catch (e) { /* localStorage off */ }

    let earnedToday = false;
    try {
      const lastDay = localStorage.getItem(HELLO_DAY_KEY);
      const today = todayPTStr();
      if (lastDay !== today) {
        count += 1;
        localStorage.setItem(HELLO_COUNT_KEY, String(count));
        localStorage.setItem(HELLO_DAY_KEY, today);
        earnedToday = true;
      }
    } catch (e) { /* localStorage off; count stays */ }

    if (helloCountEl) helloCountEl.textContent = String(count);

    if (earnedToday) {
      if (helloEl) helloEl.classList.add('fresh-strip__hello--earned');
      // Delay the float slightly so the badge paint registers first.
      setTimeout(function () { spawnHelloFloat(1); }, 140);
      // Remove the earned glow class after the float fades.
      setTimeout(function () {
        if (helloEl) helloEl.classList.remove('fresh-strip__hello--earned');
      }, 2400);
      if (sr) sr.textContent = (sr.textContent || '') + ' +1 HELLO earned.';
    }
  })();
<\/script>`])), maybeRenderHead(), addAttribute(newestId, "data-newest-id"), addAttribute(newestTimestampMs, "data-newest-ms"), addAttribute(candidateIds.join(","), "data-candidates"), addAttribute(dailyId, "data-daily-id"), addAttribute(todayStr, "data-today"), addAttribute(newest?.data.timestamp.toISOString(), "datetime"));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FreshStrip.astro", void 0);

var __freeze$a = Object.freeze;
var __defProp$a = Object.defineProperty;
var __template$a = (cooked, raw) => __freeze$a(__defProp$a(cooked, "raw", { value: __freeze$a(raw || cooked.slice()) }));
var _a$a;
const $$VisitorHereStrip = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$VisitorHereStrip;
  return renderTemplate(_a$a || (_a$a = __template$a(["", '<aside class="here-strip" aria-label="Visitors here right now" data-initial="hidden" data-astro-cid-6axxcpd6> <div class="here-strip__row" data-astro-cid-6axxcpd6> <span class="here-strip__kicker mono" data-astro-cid-6axxcpd6> <span class="here-strip__kicker-label" data-astro-cid-6axxcpd6>PEOPLES HERE</span> <span class="here-strip__kicker-sub" id="here-count" data-astro-cid-6axxcpd6>· 1 ·</span>  <span class="here-strip__room-count" id="here-room-count" hidden data-astro-cid-6axxcpd6></span> </span> <ol class="here-strip__slots" id="here-slots" data-astro-cid-6axxcpd6>  <li class="here-slot here-slot--you" data-slot="0" data-astro-cid-6axxcpd6> <span class="here-slot__ring" aria-hidden="true" data-astro-cid-6axxcpd6></span> <img class="here-slot__noun" id="here-you-img" alt="" src="" loading="eager" data-astro-cid-6axxcpd6> <span class="here-slot__label mono" data-astro-cid-6axxcpd6>YOU</span> </li>  ', `  <li class="here-slot here-slot--overflow" id="here-overflow" hidden data-astro-cid-6axxcpd6> <span class="here-slot__overflow-num mono" id="here-overflow-num" data-astro-cid-6axxcpd6>+0</span> </li> </ol> <button class="here-strip__tell mono" id="here-tell-btn" type="button" aria-expanded="false" aria-controls="here-tell-panel" data-astro-cid-6axxcpd6> <span class="here-strip__tell-label" data-astro-cid-6axxcpd6>+ TELL</span> </button>  <button class="here-strip__wire mono" id="here-wire-btn" type="button" aria-expanded="false" aria-controls="here-wire-panel" data-astro-cid-6axxcpd6> <span class="here-strip__wire-label" data-astro-cid-6axxcpd6>WIRE</span> <span class="here-strip__wire-badge" id="here-wire-badge" hidden data-astro-cid-6axxcpd6>·</span> </button> <a class="here-strip__profile mono" href="/profile" id="here-profile-link" data-astro-cid-6axxcpd6> <span class="here-strip__profile-label" data-astro-cid-6axxcpd6>PROFILE</span> <span class="here-strip__profile-arrow" aria-hidden="true" data-astro-cid-6axxcpd6>→</span> </a> </div>  <div class="here-strip__vibes" id="here-vibes-bar" aria-label="React with a vibe" data-astro-cid-6axxcpd6> <span class="here-vibes__label mono" data-astro-cid-6axxcpd6>VIBE</span> <button type="button" class="here-vibes__btn" data-vibe="❤️" aria-label="heart" data-astro-cid-6axxcpd6>❤️</button> <button type="button" class="here-vibes__btn" data-vibe="🔥" aria-label="fire" data-astro-cid-6axxcpd6>🔥</button> <button type="button" class="here-vibes__btn" data-vibe="👋" aria-label="hi" data-astro-cid-6axxcpd6>👋</button> <button type="button" class="here-vibes__btn" data-vibe="✨" aria-label="sparkle" data-astro-cid-6axxcpd6>✨</button> <button type="button" class="here-vibes__btn" data-vibe="😎" aria-label="cool" data-astro-cid-6axxcpd6>😎</button> <span class="here-vibes__hint mono" id="here-vibes-hint" hidden data-astro-cid-6axxcpd6></span> </div>  <div class="here-strip__vibe-float" id="here-vibe-float" aria-live="polite" data-astro-cid-6axxcpd6></div>  <div class="here-strip__state" id="here-state" hidden data-astro-cid-6axxcpd6> <span class="here-state__you mono" data-astro-cid-6axxcpd6>YOU</span> <span class="here-state__sep" aria-hidden="true" data-astro-cid-6axxcpd6>·</span> <span class="here-state__mood" id="here-state-mood" hidden data-astro-cid-6axxcpd6></span> <span class="here-state__listening" id="here-state-listening" hidden data-astro-cid-6axxcpd6> <span aria-hidden="true" data-astro-cid-6axxcpd6>🎵</span> <span id="here-state-listening-text" data-astro-cid-6axxcpd6></span> </span> <span class="here-state__where" id="here-state-where" hidden data-astro-cid-6axxcpd6> <span aria-hidden="true" data-astro-cid-6axxcpd6>📍</span> <span id="here-state-where-text" data-astro-cid-6axxcpd6></span> </span> <button class="here-state__edit mono" id="here-state-edit" type="button" data-astro-cid-6axxcpd6>edit</button> </div>  <div class="here-strip__focus" id="here-focus" hidden data-astro-cid-6axxcpd6> <img class="here-focus__noun" id="here-focus-noun" alt="" src="" data-astro-cid-6axxcpd6> <div class="here-focus__body" data-astro-cid-6axxcpd6> <p class="here-focus__head mono" data-astro-cid-6axxcpd6> <span id="here-focus-kind" data-astro-cid-6axxcpd6>VISITOR</span> <span class="here-focus__sep" aria-hidden="true" data-astro-cid-6axxcpd6>·</span> <span id="here-focus-noun-label" data-astro-cid-6axxcpd6>noun —</span> <span class="here-focus__sep" aria-hidden="true" data-astro-cid-6axxcpd6>·</span> <span id="here-focus-joined" data-astro-cid-6axxcpd6>joined —</span> </p> <p class="here-focus__detail" id="here-focus-detail" data-astro-cid-6axxcpd6></p> <div class="here-focus__actions" data-astro-cid-6axxcpd6>  <a class="here-focus__join mono" id="here-focus-join" hidden href="" data-astro-cid-6axxcpd6></a>  <button class="here-focus__wave mono" id="here-focus-wave" type="button" hidden data-astro-cid-6axxcpd6>👋 WAVE</button>  <button class="here-focus__follow mono" id="here-focus-follow" type="button" hidden aria-pressed="false" data-astro-cid-6axxcpd6>FOLLOW</button>  <button class="here-focus__reply mono" id="here-focus-reply" type="button" hidden data-astro-cid-6axxcpd6>REPLY</button>  <button class="here-focus__bring mono" id="here-focus-bring" type="button" hidden data-astro-cid-6axxcpd6>BRING HERE</button> </div> </div> <button class="here-focus__close mono" id="here-focus-close" type="button" aria-label="Close visitor details" data-astro-cid-6axxcpd6>×</button> </div>  <div class="here-strip__waves" id="here-waves" aria-live="polite" data-astro-cid-6axxcpd6></div>  <div class="here-strip__panel here-strip__panel--wire" id="here-wire-panel" hidden data-astro-cid-6axxcpd6> <p class="here-panel__eyebrow mono" data-astro-cid-6axxcpd6>WIRE · live · last 20 messages</p>  <div class="here-wire__tabs mono" role="tablist" data-astro-cid-6axxcpd6> <button type="button" class="here-wire__tab" id="here-wire-tab-room" role="tab" aria-selected="true" data-scope="room" data-astro-cid-6axxcpd6>THIS ROOM</button> <button type="button" class="here-wire__tab" id="here-wire-tab-all" role="tab" aria-selected="false" data-scope="all" data-astro-cid-6axxcpd6>ALL</button> <span class="here-wire__tab-spacer" aria-hidden="true" data-astro-cid-6axxcpd6></span> <span class="here-wire__tab-room" id="here-wire-tab-room-name" data-astro-cid-6axxcpd6></span> </div> <ol class="here-wire__log" id="here-wire-log" role="log" aria-live="polite" data-astro-cid-6axxcpd6></ol> <form class="here-wire__form" id="here-wire-form" data-astro-cid-6axxcpd6> <input type="text" id="here-wire-input" class="here-panel__input here-wire__input" placeholder="say something to the peoples · max 120 chars" maxlength="120" autocomplete="off" data-astro-cid-6axxcpd6> <button type="submit" class="here-wire__send mono" data-astro-cid-6axxcpd6>SEND</button> </form> <p class="here-wire__hint mono" data-astro-cid-6axxcpd6>all visitors here see this · ephemeral · clears when nobody's here</p> </div>  <div class="here-strip__panel" id="here-tell-panel" hidden data-astro-cid-6axxcpd6> <p class="here-panel__eyebrow mono" data-astro-cid-6axxcpd6>TELL THE PEOPLES · local first · live when connected</p> <label class="here-panel__field" data-astro-cid-6axxcpd6> <span class="here-panel__label mono" data-astro-cid-6axxcpd6>🎵 now playing</span> <input type="text" id="here-input-listening" class="here-panel__input" placeholder="Spotify URL or song title (optional)" maxlength="120" autocomplete="off" data-astro-cid-6axxcpd6> </label> <label class="here-panel__field" data-astro-cid-6axxcpd6> <span class="here-panel__label mono" data-astro-cid-6axxcpd6>📍 where</span> <div class="here-panel__where-row" data-astro-cid-6axxcpd6> <input type="text" id="here-input-where" class="here-panel__input" placeholder="El Segundo · or your town (optional)" maxlength="80" autocomplete="off" data-astro-cid-6axxcpd6> <button type="button" id="here-geo-btn" class="here-panel__geo mono" aria-label="Use my location" data-astro-cid-6axxcpd6>
📡 USE
</button> </div> </label> <fieldset class="here-panel__moods" data-astro-cid-6axxcpd6> <legend class="here-panel__label mono" data-astro-cid-6axxcpd6>mood</legend> <div class="here-panel__mood-row" id="here-mood-row" data-astro-cid-6axxcpd6> <button type="button" class="mood-pill" data-mood="chill" data-astro-cid-6axxcpd6>● chill</button> <button type="button" class="mood-pill" data-mood="hype" data-astro-cid-6axxcpd6>● hype</button> <button type="button" class="mood-pill" data-mood="focus" data-astro-cid-6axxcpd6>● focus</button> <button type="button" class="mood-pill" data-mood="flow" data-astro-cid-6axxcpd6>● flow</button> <button type="button" class="mood-pill" data-mood="curious" data-astro-cid-6axxcpd6>● curious</button> <button type="button" class="mood-pill" data-mood="quiet" data-astro-cid-6axxcpd6>● quiet</button> </div> </fieldset> <div class="here-panel__actions" data-astro-cid-6axxcpd6> <button type="button" id="here-save-btn" class="here-panel__save mono" data-astro-cid-6axxcpd6>SAVE</button> <button type="button" id="here-clear-btn" class="here-panel__clear mono" data-astro-cid-6axxcpd6>CLEAR</button> <span class="here-panel__hint mono" id="here-save-hint" data-astro-cid-6axxcpd6></span> </div> </div> </aside> <script>
  (function () {
    var strip = document.querySelector('.here-strip');
    if (!strip) return;

    function cheapHash(s) {
      var h = 5381;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
      return h >>> 0;
    }
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
    function nounUrl(id) { return 'https://noun.pics/' + id + '.svg'; }
    function truncate(s, max) {
      if (!s || s.length <= max) return s || '';
      return s.slice(0, max - 1) + '…';
    }

    var sessionId;
    sessionId = lsGet('pc:session');
    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
      lsSet('pc:session', sessionId);
    }

    var nounId;
    var cachedNoun = lsGet('pc:visitor:noun');
    if (cachedNoun) nounId = parseInt(cachedNoun, 10);
    if (!(nounId >= 0 && nounId < 1200)) {
      nounId = cheapHash(sessionId) % 1200;
      lsSet('pc:visitor:noun', String(nounId));
    }

    if (!lsGet('pc:visitor:firstSeenAt')) {
      lsSet('pc:visitor:firstSeenAt', new Date().toISOString());
    }

    var isAgent = /gptbot|claudebot|claude-user|anthropic-ai|perplexitybot|oai-searchbot|atlas|bingbot|googlebot/i.test(navigator.userAgent);

    var youImg = document.getElementById('here-you-img');
    if (youImg) {
      youImg.src = nounUrl(nounId);
      youImg.alt = 'your noun · ' + nounId;
    }
    var profileLink = document.getElementById('here-profile-link');
    if (profileLink) {
      profileLink.href = '/profile';
      profileLink.setAttribute('aria-label', 'Your profile · noun ' + nounId);
    }

    strip.dataset.initial = 'ready';

    var countEl = document.getElementById('here-count');
    var otherSlots = Array.from(strip.querySelectorAll('.here-slot--ghost[data-slot]'));
    var overflow = document.getElementById('here-overflow');
    var overflowNum = document.getElementById('here-overflow-num');
    var host = window.location.host;
    var allowPresence = host.endsWith('pointcast.xyz') || host.endsWith('.pages.dev');
    var ws = null;
    var heartbeatTimer = 0;
    var reconnectTimer = 0;

    function describeSession(session) {
      var parts = [];
      var kind = session.kind === 'agent' ? 'AGENT' : (session.kind === 'wallet' ? 'WALLET' : 'HUMAN');
      parts.push(kind);
      if (session.mood) parts.push(session.mood);
      if (session.listening) parts.push('listening ' + truncate(session.listening, 40));
      if (session.where) parts.push('in ' + truncate(session.where, 28));
      return parts.join(' · ');
    }

    function clearSlot(slot) {
      if (!slot) return;
      slot.classList.remove('here-slot--occupied');
      slot.removeAttribute('data-kind');
      slot.removeAttribute('title');
      slot.removeAttribute('aria-label');
      var img = slot.querySelector('.here-slot__noun');
      var ghost = slot.querySelector('.here-slot__ghost');
      if (img) {
        img.hidden = true;
        img.removeAttribute('src');
        img.alt = '';
      }
      if (ghost) ghost.hidden = false;
    }

    function paintSlot(slot, session) {
      if (!slot || !session) return;
      var nextNounId = Number(session.nounId);
      if (!(nextNounId >= 0 && nextNounId < 1200)) {
        clearSlot(slot);
        return;
      }
      slot.classList.add('here-slot--occupied');
      slot.dataset.kind = session.kind || 'human';
      // Phase 3 — co-room: peer is on the same path as the viewer. We
      // toggle a class so CSS can give them a distinct ring/glow.
      var sameRoom = !!session.currentPath && session.currentPath === window.location.pathname;
      if (sameRoom) slot.classList.add('here-slot--coroom');
      else slot.classList.remove('here-slot--coroom');
      // Stash the session JSON on the slot so the click handler can read it.
      try { slot.dataset.session = JSON.stringify(session); } catch (e) {}
      slot.setAttribute('role', 'button');
      slot.setAttribute('tabindex', '0');
      var img = slot.querySelector('.here-slot__noun');
      var ghost = slot.querySelector('.here-slot__ghost');
      if (img) {
        img.hidden = false;
        img.src = nounUrl(nextNounId);
        img.alt = 'visitor noun · ' + nextNounId;
      }
      if (ghost) ghost.hidden = true;
      var label = describeSession(session);
      if (label) {
        slot.title = label + ' · tap for details';
        slot.setAttribute('aria-label', label + ' · tap for details');
      } else {
        slot.title = 'visitor · tap for details';
        slot.setAttribute('aria-label', 'visitor · tap for details');
      }
      // Phase 3 — render the peer's current page as a click-to-teleport chip
      // beneath the avatar. We don't show the chip for /, /index, or our
      // own page (the visitor is already there).
      var whereLink = slot.querySelector('.here-slot__where');
      var peerPath = sanitizePeerPath(session.currentPath);
      if (whereLink) {
        if (peerPath && peerPath !== window.location.pathname) {
          whereLink.hidden = false;
          whereLink.href = peerPath;
          whereLink.textContent = 'on ' + shortenPath(peerPath);
          whereLink.setAttribute('aria-label', 'go to ' + peerPath + ' (where this visitor is)');
        } else {
          whereLink.hidden = true;
          whereLink.removeAttribute('href');
          whereLink.textContent = '';
        }
      }
      // Phase 3 — show the WAVE button when this peer is a real human/wallet
      // visitor (agents can't receive waves; the worker drops them anyway).
      var waveBtn = slot.querySelector('.here-slot__wave');
      if (waveBtn) {
        var isHuman = !session.kind || session.kind === 'human' || session.kind === 'wallet';
        if (isHuman) {
          waveBtn.hidden = false;
          waveBtn.setAttribute('data-wave-noun', String(nextNounId));
          waveBtn.setAttribute('aria-label', 'wave at noun ' + nextNounId);
        } else {
          waveBtn.hidden = true;
        }
      }
    }

    // Defense-in-depth on the receiving side: even though the server
    // already sanitizes currentPath, never render a peer-supplied value
    // that doesn't pass our own check. Mirrors normalizeCurrentPath in
    // workers/presence/src/index.ts.
    function sanitizePeerPath(value) {
      if (typeof value !== 'string') return null;
      var v = value.trim();
      if (!v || v.length > 200) return null;
      if (v.charAt(0) !== '/') return null;
      if (v.indexOf('//') === 0) return null;
      if (/[?#]/.test(v)) return null;
      if (!/^[A-Za-z0-9\\/_\\-.]+$/.test(v)) return null;
      return v;
    }
    function shortenPath(p) {
      if (!p) return '';
      if (p.length <= 22) return p;
      return p.slice(0, 21) + '…';
    }

    // ---------- visitor-slot focus (click/tap to show details) ----------
    var focusEl = document.getElementById('here-focus');
    var focusNoun = document.getElementById('here-focus-noun');
    var focusKind = document.getElementById('here-focus-kind');
    var focusNounLabel = document.getElementById('here-focus-noun-label');
    var focusJoined = document.getElementById('here-focus-joined');
    var focusDetail = document.getElementById('here-focus-detail');
    var focusClose = document.getElementById('here-focus-close');
    var focusCurrentSlot = null;

    function hideFocus() {
      if (focusEl) focusEl.hidden = true;
      focusCurrentSlot = null;
    }
    function formatJoinedAt(iso) {
      try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var h = d.getHours(); var m = d.getMinutes();
        var mm = m < 10 ? '0' + m : String(m);
        return 'joined ' + h + ':' + mm;
      } catch (e) { return '—'; }
    }
    function showFocus(slot) {
      if (!focusEl || !slot) return;
      var raw = slot.dataset.session;
      if (!raw) return;
      var session;
      try { session = JSON.parse(raw); } catch (e) { return; }
      if (!session) return;
      if (focusNoun) {
        focusNoun.src = nounUrl(Number(session.nounId));
        focusNoun.alt = 'noun ' + session.nounId;
      }
      if (focusKind) focusKind.textContent = (session.kind || 'visitor').toUpperCase();
      if (focusNounLabel) focusNounLabel.textContent = 'noun ' + session.nounId;
      if (focusJoined) focusJoined.textContent = formatJoinedAt(session.joinedAt);
      var parts = [];
      if (session.mood) parts.push(String(session.mood).toUpperCase());
      if (session.listening) parts.push('🎵 ' + session.listening);
      if (session.where) parts.push('📍 ' + session.where);
      if (focusDetail) focusDetail.textContent = parts.length ? parts.join(' · ') : 'no self-report — just showing up is enough.';
      // Phase 3 — also render a JOIN button in the focus card if the peer
      // is on a different page from the viewer. One-click teleport.
      var peerPath = sanitizePeerPath(session.currentPath);
      var joinBtn = document.getElementById('here-focus-join');
      if (joinBtn) {
        if (peerPath && peerPath !== window.location.pathname) {
          joinBtn.hidden = false;
          joinBtn.href = peerPath;
          joinBtn.textContent = 'JOIN ON ' + shortenPath(peerPath).toUpperCase() + ' →';
        } else {
          joinBtn.hidden = true;
          joinBtn.removeAttribute('href');
        }
      }
      // Phase 3 — show WAVE + FOLLOW + REPLY buttons in the focus card.
      // Always available for human/wallet peers; hidden for agents.
      var waveBtnFocus = document.getElementById('here-focus-wave');
      var followBtnFocus = document.getElementById('here-focus-follow');
      var replyBtnFocus = document.getElementById('here-focus-reply');
      var isHumanPeer = !session.kind || session.kind === 'human' || session.kind === 'wallet';
      if (waveBtnFocus) waveBtnFocus.hidden = !isHumanPeer;
      if (followBtnFocus) {
        followBtnFocus.hidden = !isHumanPeer;
        var isFollowing = followingNounId === Number(session.nounId);
        followBtnFocus.setAttribute('aria-pressed', String(isFollowing));
        followBtnFocus.textContent = isFollowing ? 'FOLLOWING ✓' : 'FOLLOW';
      }
      if (replyBtnFocus) replyBtnFocus.hidden = !isHumanPeer;
      // Phase 4 — show BRING for human peers on a different page.
      var bringBtnFocus = document.getElementById('here-focus-bring');
      if (bringBtnFocus) {
        var canBring = isHumanPeer && peerPath && peerPath !== window.location.pathname;
        bringBtnFocus.hidden = !canBring;
        bringBtnFocus.textContent = canBring
          ? 'BRING TO ' + shortenPath(window.location.pathname).toUpperCase()
          : 'BRING HERE';
      }
      focusEl.hidden = false;
      focusCurrentSlot = slot;
    }
    function onSlotActivate(e) {
      var slot = e.currentTarget;
      if (!slot) return;
      // Toggle off if clicking the same slot.
      if (focusCurrentSlot === slot) { hideFocus(); return; }
      showFocus(slot);
    }
    if (focusClose) focusClose.addEventListener('click', hideFocus);
    // Delegate — attach once; re-evaluates slot state every click.
    var slotsEl = document.getElementById('here-slots');
    if (slotsEl) {
      slotsEl.addEventListener('click', function (e) {
        var slot = e.target.closest('.here-slot--occupied');
        if (!slot) return;
        // Skip YOU — TELL panel already owns that surface.
        if (slot.classList.contains('here-slot--you')) return;
        onSlotActivate({ currentTarget: slot });
      });
      slotsEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var slot = e.target.closest('.here-slot--occupied');
        if (!slot || slot.classList.contains('here-slot--you')) return;
        e.preventDefault();
        onSlotActivate({ currentTarget: slot });
      });
    }

    function otherSessionsFromPayload(payload) {
      var sessions = Array.isArray(payload && payload.sessions) ? payload.sessions : [];
      var others = [];
      var removedSelf = false;
      for (var i = 0; i < sessions.length; i++) {
        var session = sessions[i];
        if (!session || typeof session !== 'object') continue;
        if (!removedSelf && Number(session.nounId) === nounId) {
          removedSelf = true;
          continue;
        }
        others.push(session);
      }
      return others;
    }

    var lastPresencePayload = null;
    function paintPresence(payload) {
      if (payload) lastPresencePayload = payload;
      var humans = Number(payload && payload.humans) || 0;
      var agents = Number(payload && payload.agents) || 0;
      var total = Math.max(1, humans + agents);
      var others = otherSessionsFromPayload(payload);
      // Phase 3 — co-room first. Sort other-peers so visitors on the
      // same page bubble to the front of the avatar row. Stable sort
      // to preserve joinedAt order within each group.
      var here = window.location.pathname;
      var coRoomCount = 0;
      for (var k = 0; k < others.length; k++) {
        if (others[k] && others[k].currentPath === here) coRoomCount++;
      }
      others = others.slice().sort(function (a, b) {
        var ar = (a && a.currentPath === here) ? 0 : 1;
        var br = (b && b.currentPath === here) ? 0 : 1;
        return ar - br;
      });
      if (countEl) countEl.textContent = '· ' + total + ' ·';
      // Phase 3 — per-room chip. "ROOM 2" when there's at least one
      // co-room peer; hidden otherwise. YOU is implicit (we always count
      // ourselves, so the displayed value is \`coRoomCount + 1\`).
      var roomCountEl = document.getElementById('here-room-count');
      if (roomCountEl) {
        if (coRoomCount > 0) {
          roomCountEl.hidden = false;
          roomCountEl.textContent = '· ROOM ' + (coRoomCount + 1);
        } else {
          roomCountEl.hidden = true;
          roomCountEl.textContent = '';
        }
      }
      for (var i = 0; i < otherSlots.length; i++) {
        if (i < others.length) paintSlot(otherSlots[i], others[i]);
        else clearSlot(otherSlots[i]);
      }
      var shown = Math.min(otherSlots.length, others.length);
      var overflowCount = Math.max(0, total - 1 - shown);
      if (overflowCount > 0) {
        if (overflow) overflow.hidden = false;
        if (overflowNum) overflowNum.textContent = '+' + overflowCount;
      } else {
        if (overflow) overflow.hidden = true;
      }
      // Phase 3 — surface chat + waves + drive auto-follow.
      paintChat(payload && payload.chat);
      paintWaves(payload && payload.waves);
      paintVibes(payload && payload.vibes);
      maybeFollow(others);
    }

    function sendPresence(type, extra) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try {
        var payload = { type: type, nounId: nounId };
        if (!isAgent && extra && typeof extra === 'object') {
          if (Object.prototype.hasOwnProperty.call(extra, 'mood')) payload.mood = extra.mood;
          if (Object.prototype.hasOwnProperty.call(extra, 'listening')) payload.listening = extra.listening;
          if (Object.prototype.hasOwnProperty.call(extra, 'where')) payload.where = extra.where;
          if (Object.prototype.hasOwnProperty.call(extra, 'currentPath')) payload.currentPath = extra.currentPath;
        }
        ws.send(JSON.stringify(payload));
        return true;
      } catch (e) {
        return false;
      }
    }

    function currentPresenceFields() {
      return {
        mood: lsGet('pc:visitor:mood'),
        listening: lsGet('pc:visitor:listening'),
        where: lsGet('pc:visitor:where'),
        // Phase 3 — broadcast the current page so peers can see + follow.
        // Agents don't get this (server strips it for kind=agent anyway).
        currentPath: window.location && window.location.pathname ? window.location.pathname : undefined,
      };
    }

    // Re-emit currentPath after Astro view transitions so peers see the
    // visitor moving between rooms in real time.
    document.addEventListener('astro:after-swap', function () {
      if (isAgent) return;
      sendPresence('update', { currentPath: window.location.pathname });
    });

    function stopHeartbeat() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = 0;
      }
    }

    function scheduleReconnect() {
      stopHeartbeat();
      if (reconnectTimer || !allowPresence) return;
      reconnectTimer = window.setTimeout(function () {
        reconnectTimer = 0;
        connectPresence();
      }, 3000);
    }

    function connectPresence() {
      if (!allowPresence) return;
      var wsURL = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + host +
        '/api/presence?sid=' + encodeURIComponent(sessionId) + '&kind=' + (isAgent ? 'agent' : 'human');
      try {
        ws = new WebSocket(wsURL);
      } catch (e) {
        scheduleReconnect();
        return;
      }
      ws.addEventListener('open', function () {
        stopHeartbeat();
        sendPresence('identify', currentPresenceFields());
        heartbeatTimer = window.setInterval(function () {
          sendPresence('ping');
        }, 30_000);
      });
      ws.addEventListener('message', function (evt) {
        try {
          paintPresence(JSON.parse(evt.data));
        } catch (e) {}
      });
      ws.addEventListener('close', scheduleReconnect);
      ws.addEventListener('error', scheduleReconnect);
    }

    paintPresence({
      humans: isAgent ? 0 : 1,
      agents: isAgent ? 1 : 0,
      sessions: [{ nounId: nounId, kind: isAgent ? 'agent' : 'human', joinedAt: new Date().toISOString() }],
    });
    if (allowPresence) connectPresence();

    // ── Phase 3: WAVE button on each peer slot ─────────────────
    // Delegate so we don't need to wire one listener per slot.
    var slotsRoot = document.getElementById('here-slots');
    if (slotsRoot) {
      slotsRoot.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('.here-slot__wave');
        if (!btn) return;
        e.stopPropagation();
        e.preventDefault();
        var to = Number(btn.getAttribute('data-wave-noun'));
        if (!(to >= 0 && to < 1200)) return;
        sendWave(to);
        // Self-confirm — flash a tiny ✓ on the button so the sender sees it
        // before the broadcast loop returns.
        btn.classList.add('here-slot__wave--sent');
        setTimeout(function () { btn.classList.remove('here-slot__wave--sent'); }, 1200);
      });
    }

    function sendWave(toNoun, opts) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try {
        var msg = { type: 'wave', nounId: nounId, to: toNoun, emoji: '👋' };
        // Phase 4 — BRING piggybacks on wave with optional targetPath.
        if (opts && opts.targetPath) msg.targetPath = String(opts.targetPath).slice(0, 200);
        if (opts && opts.emoji) msg.emoji = String(opts.emoji).slice(0, 8);
        ws.send(JSON.stringify(msg));
        return true;
      } catch (e) { return false; }
    }

    // ── Phase 3: WAVE rendering (incoming) ─────────────────────
    var wavesRoot = document.getElementById('here-waves');
    var seenWaveAt = 0; // dedupe: monotonic timestamp of last rendered wave
    function paintWaves(waves) {
      if (!wavesRoot || !Array.isArray(waves) || !waves.length) return;
      // Render only entries newer than the last we showed.
      var fresh = [];
      for (var i = 0; i < waves.length; i++) {
        var w = waves[i];
        if (!w || typeof w.at !== 'number') continue;
        if (w.at <= seenWaveAt) continue;
        fresh.push(w);
      }
      if (!fresh.length) return;
      seenWaveAt = fresh[fresh.length - 1].at;
      for (var j = 0; j < fresh.length; j++) {
        renderWave(fresh[j]);
      }
    }
    function renderWave(w) {
      var atMe = Number(w.toNoun) === Number(nounId);
      var fromMe = Number(w.fromNoun) === Number(nounId);
      var hasBring = atMe && typeof w.targetPath === 'string' && sanitizePeerPath(w.targetPath) && w.targetPath !== window.location.pathname;
      var chip = document.createElement('div');
      chip.className = 'here-wave-chip' + (atMe ? ' here-wave-chip--at-me' : '') + (hasBring ? ' here-wave-chip--bring' : '');
      var label = (w.emoji || '👋') + ' noun ' + w.fromNoun + ' → noun ' + w.toNoun;
      if (atMe) label += ' · that’s YOU';
      else if (fromMe) label += ' · sent';
      // Phase 4 — BRING: include the target path + a JOIN button when
      // the wave invites YOU somewhere.
      if (hasBring) {
        var lab = document.createElement('span'); lab.textContent = label + ' · come to ' + shortenPath(w.targetPath); chip.appendChild(lab);
        var go = document.createElement('a');
        go.className = 'here-wave-chip__go mono';
        go.href = w.targetPath;
        go.textContent = 'JOIN →';
        chip.appendChild(go);
      } else {
        chip.textContent = label;
      }
      wavesRoot.appendChild(chip);
      // Auto-remove after 4s (or 8s for BRING — the call to action gets longer).
      var dwell = hasBring ? 8_000 : 4_000;
      setTimeout(function () {
        chip.classList.add('here-wave-chip--out');
        setTimeout(function () { if (chip.parentNode) chip.parentNode.removeChild(chip); }, 400);
      }, dwell);
    }

    // ── Phase 4: VIBE bar + render ─────────────────────────────
    var vibesBar = document.getElementById('here-vibes-bar');
    var vibeFloat = document.getElementById('here-vibe-float');
    var vibesHint = document.getElementById('here-vibes-hint');
    var seenVibeAt = 0;
    if (vibesBar) {
      vibesBar.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('.here-vibes__btn');
        if (!btn) return;
        var emoji = btn.getAttribute('data-vibe') || '✨';
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try { ws.send(JSON.stringify({ type: 'vibe', nounId: nounId, emoji: emoji })); } catch (e2) {}
        // Local optimistic flash so the sender sees instant feedback even
        // if the broadcast tick is a beat behind.
        renderVibe({ fromNoun: nounId, emoji: emoji, at: Date.now(), local: true });
        if (vibesHint) {
          vibesHint.hidden = false;
          vibesHint.textContent = 'sent';
          setTimeout(function () { if (vibesHint) vibesHint.hidden = true; }, 1200);
        }
        btn.classList.add('here-vibes__btn--sent');
        setTimeout(function () { btn.classList.remove('here-vibes__btn--sent'); }, 700);
      });
    }
    function paintVibes(vibes) {
      if (!Array.isArray(vibes) || !vibes.length) return;
      var here = window.location.pathname;
      var fresh = [];
      for (var i = 0; i < vibes.length; i++) {
        var v = vibes[i]; if (!v || typeof v.at !== 'number') continue;
        if (v.at <= seenVibeAt) continue;
        // Skip my own — already rendered locally; avoids double-flash.
        if (Number(v.fromNoun) === Number(nounId)) continue;
        // Co-room only.
        if (v.room && v.room !== here) continue;
        fresh.push(v);
      }
      if (!fresh.length) return;
      seenVibeAt = fresh[fresh.length - 1].at;
      for (var j = 0; j < fresh.length; j++) renderVibe(fresh[j]);
    }
    function renderVibe(v) {
      if (!vibeFloat) return;
      var chip = document.createElement('div');
      chip.className = 'here-vibe-chip';
      var em = document.createElement('span');
      em.className = 'here-vibe-chip__em';
      em.textContent = String(v.emoji || '✨');
      chip.appendChild(em);
      var who = document.createElement('span');
      who.className = 'here-vibe-chip__who mono';
      who.textContent = v.local ? 'YOU' : ('noun ' + v.fromNoun);
      chip.appendChild(who);
      // Random horizontal jitter so chips spread across the bar instead
      // of stacking vertically into a single column.
      chip.style.left = (8 + Math.floor(Math.random() * 60)) + '%';
      vibeFloat.appendChild(chip);
      // Animate up + fade. Auto-remove after the float duration.
      setTimeout(function () { chip.classList.add('here-vibe-chip--out'); }, 50);
      setTimeout(function () { if (chip.parentNode) chip.parentNode.removeChild(chip); }, 5_500);
    }

    // ── Phase 3: WIRE chat panel (uses existing DO chat ring buffer) ──
    var wirePanel = document.getElementById('here-wire-panel');
    var wireBtn = document.getElementById('here-wire-btn');
    var wireBadge = document.getElementById('here-wire-badge');
    var wireLog = document.getElementById('here-wire-log');
    var wireForm = document.getElementById('here-wire-form');
    var wireInput = document.getElementById('here-wire-input');
    var wireTabRoom = document.getElementById('here-wire-tab-room');
    var wireTabAll = document.getElementById('here-wire-tab-all');
    var wireTabRoomName = document.getElementById('here-wire-tab-room-name');
    var seenChatAt = 0;
    var unreadChat = 0;
    // Phase 3 — WIRE scope: 'room' (default — only this page's chat)
    // or 'all' (every chat in the ring buffer).
    var wireScope = 'room';
    var lastChatPayload = []; // stash so we can re-render on tab switch

    function setWireScope(next) {
      wireScope = next === 'all' ? 'all' : 'room';
      if (wireTabRoom) wireTabRoom.setAttribute('aria-selected', String(wireScope === 'room'));
      if (wireTabAll) wireTabAll.setAttribute('aria-selected', String(wireScope === 'all'));
      paintChat(lastChatPayload);
    }
    if (wireTabRoom) wireTabRoom.addEventListener('click', function () { setWireScope('room'); });
    if (wireTabAll) wireTabAll.addEventListener('click', function () { setWireScope('all'); });
    // Show the current room name in the tab bar so the visitor knows what
    // "THIS ROOM" means.
    if (wireTabRoomName) wireTabRoomName.textContent = window.location.pathname;
    document.addEventListener('astro:after-swap', function () {
      if (wireTabRoomName) wireTabRoomName.textContent = window.location.pathname;
      // Re-render filtered log against the new room.
      paintChat(lastChatPayload);
      // Re-paint presence so co-room highlight + room count + slot
      // sort reflect the new pathname.
      if (lastPresencePayload) paintPresence(lastPresencePayload);
    });

    if (wireBtn && wirePanel) {
      wireBtn.addEventListener('click', function () {
        wirePanel.hidden = !wirePanel.hidden;
        wireBtn.setAttribute('aria-expanded', String(!wirePanel.hidden));
        if (!wirePanel.hidden) {
          unreadChat = 0;
          if (wireBadge) { wireBadge.hidden = true; wireBadge.textContent = '·'; }
          if (wireInput) try { wireInput.focus(); } catch (e) {}
        }
      });
    }
    if (wireForm) {
      wireForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!wireInput) return;
        var msg = wireInput.value.trim();
        if (!msg) return;
        if (msg.length > 120) msg = msg.slice(0, 120);
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try { ws.send(JSON.stringify({ type: 'chat', nounId: nounId, msg: msg, tag: 'noun-' + nounId })); } catch (e2) {}
        wireInput.value = '';
      });
    }

    function paintChat(chat) {
      if (!wireLog) return;
      if (Array.isArray(chat)) lastChatPayload = chat;
      var source = lastChatPayload || [];
      // Apply scope filter. We compare entry.room against the viewer's
      // current pathname; entries without \`room\` (older messages or
      // pre-Phase-3 senders) are treated as "all"-only — they only show
      // up under the ALL tab so we don't leak cross-room context.
      var here = window.location.pathname;
      var filtered = wireScope === 'all'
        ? source
        : source.filter(function (c) { return c && c.room === here; });
      // Render the filtered list. Cap to last 20 entries (DO already
      // ring-buffers to that depth, but defensive).
      wireLog.innerHTML = '';
      var newer = 0;
      for (var i = 0; i < filtered.length; i++) {
        var c = filtered[i]; if (!c || typeof c.at !== 'number') continue;
        var li = document.createElement('li');
        li.className = 'here-wire__entry' + (Number(c.nounId) === Number(nounId) ? ' here-wire__entry--mine' : '');
        var who = document.createElement('span');
        who.className = 'here-wire__who mono';
        who.textContent = 'noun ' + c.nounId;
        var msg = document.createElement('span');
        msg.className = 'here-wire__msg';
        // Phase 3 — highlight @noun-NNN mentions; if it mentions YOU,
        // tag the entire entry so the row gets a brighter treatment.
        var raw = String(c.msg || '');
        var mineMention = '@noun-' + nounId;
        if (raw.indexOf(mineMention) >= 0) {
          li.classList.add('here-wire__entry--at-me');
        }
        // Render mentions as styled chips. Simple regex; max 32 chars
        // for the noun id digits to avoid catastrophic backtracking.
        var mentionRe = /@noun-(\\d{1,4})/g;
        var pos = 0;
        var match;
        while ((match = mentionRe.exec(raw)) !== null) {
          if (match.index > pos) {
            msg.appendChild(document.createTextNode(raw.slice(pos, match.index)));
          }
          var chip = document.createElement('span');
          chip.className = 'here-wire__mention';
          chip.textContent = match[0];
          msg.appendChild(chip);
          pos = match.index + match[0].length;
        }
        if (pos < raw.length) msg.appendChild(document.createTextNode(raw.slice(pos)));
        li.appendChild(who);
        li.appendChild(msg);
        // In ALL scope, decorate with the sender's room so cross-room
        // context is legible.
        if (wireScope === 'all' && c.room) {
          var room = document.createElement('span');
          room.className = 'here-wire__room mono';
          room.textContent = c.room;
          li.appendChild(room);
        }
        wireLog.appendChild(li);
      }
      // Empty-state hint when filtered.
      if (!filtered.length && wireScope === 'room') {
        var li2 = document.createElement('li');
        li2.className = 'here-wire__empty mono';
        li2.textContent = 'no messages from this room yet — try ALL';
        wireLog.appendChild(li2);
      }
      // Auto-scroll.
      try { wireLog.scrollTop = wireLog.scrollHeight; } catch (e) {}
      // Unread badge logic — counts new messages from peers regardless
      // of current scope filter (so visitors don't miss cross-room pings
      // they care about). Source for \`newer\` is the unfiltered chat.
      for (var k = 0; k < source.length; k++) {
        var s = source[k];
        if (!s || typeof s.at !== 'number') continue;
        if (s.at > seenChatAt && Number(s.nounId) !== Number(nounId)) newer++;
      }
      if (source.length) seenChatAt = source[source.length - 1].at;
      if (newer > 0 && wirePanel && wirePanel.hidden) {
        unreadChat += newer;
        if (wireBadge) { wireBadge.hidden = false; wireBadge.textContent = String(unreadChat); }
      }
    }

    // ── Phase 3: FOLLOW (auto-teleport when followed peer changes path) ──
    var followingNounId = -1;
    try {
      var saved = parseInt(localStorage.getItem('pc:following') || '', 10);
      if (saved >= 0 && saved < 1200) followingNounId = saved;
    } catch (e) {}

    function setFollowing(targetNoun) {
      followingNounId = (targetNoun >= 0 && targetNoun < 1200) ? targetNoun : -1;
      try {
        if (followingNounId >= 0) localStorage.setItem('pc:following', String(followingNounId));
        else localStorage.removeItem('pc:following');
      } catch (e) {}
    }

    function maybeFollow(others) {
      if (followingNounId < 0 || !Array.isArray(others)) return;
      for (var i = 0; i < others.length; i++) {
        var s = others[i];
        if (!s || Number(s.nounId) !== followingNounId) continue;
        var path = sanitizePeerPath(s.currentPath);
        if (path && path !== window.location.pathname) {
          // Tiny debounce — write a flag so we don't loop on race conditions.
          var stamp = Date.now();
          if (window.__pcLastFollowAt && stamp - window.__pcLastFollowAt < 1500) return;
          window.__pcLastFollowAt = stamp;
          window.location.href = path;
          return;
        }
      }
    }

    // Wire FOLLOW + WAVE buttons in the focus card so they target the
    // currently-focused peer.
    var focusWaveBtn = document.getElementById('here-focus-wave');
    var focusFollowBtn = document.getElementById('here-focus-follow');
    if (focusWaveBtn) {
      focusWaveBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          if (Number(s.nounId) >= 0) sendWave(Number(s.nounId));
          focusWaveBtn.classList.add('here-focus__wave--sent');
          setTimeout(function () { focusWaveBtn.classList.remove('here-focus__wave--sent'); }, 1200);
        } catch (e) {}
      });
    }
    if (focusFollowBtn) {
      focusFollowBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          var n = Number(s.nounId);
          if (!(n >= 0)) return;
          if (followingNounId === n) {
            setFollowing(-1);
            focusFollowBtn.setAttribute('aria-pressed', 'false');
            focusFollowBtn.textContent = 'FOLLOW';
          } else {
            setFollowing(n);
            focusFollowBtn.setAttribute('aria-pressed', 'true');
            focusFollowBtn.textContent = 'FOLLOWING ✓';
          }
        } catch (e) {}
      });
    }
    // Phase 4 — BRING button: send a wave with targetPath = OUR path
    // so the focused peer sees a "come to /<path>" invite chip.
    var focusBringBtn = document.getElementById('here-focus-bring');
    if (focusBringBtn) {
      focusBringBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          var n = Number(s.nounId);
          if (!(n >= 0)) return;
          sendWave(n, { targetPath: window.location.pathname, emoji: '🫳' });
          focusBringBtn.classList.add('here-focus__bring--sent');
          var prior = focusBringBtn.textContent;
          focusBringBtn.textContent = 'INVITED ✓';
          setTimeout(function () {
            focusBringBtn.classList.remove('here-focus__bring--sent');
            focusBringBtn.textContent = prior;
          }, 1800);
        } catch (e) {}
      });
    }

    // Phase 3 — REPLY button opens WIRE with @noun-N prefilled. Threading
    // is just a mention convention; no DO change needed since chat already
    // ring-buffers and broadcasts.
    var focusReplyBtn = document.getElementById('here-focus-reply');
    if (focusReplyBtn) {
      focusReplyBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          var n = Number(s.nounId);
          if (!(n >= 0)) return;
          // Open WIRE if it's closed.
          if (wirePanel && wirePanel.hidden && wireBtn) {
            wireBtn.click();
          }
          if (wireInput) {
            var prefill = '@noun-' + n + ' ';
            wireInput.value = prefill;
            try { wireInput.focus(); } catch (e2) {}
            try {
              wireInput.setSelectionRange(prefill.length, prefill.length);
            } catch (e3) {}
          }
          // Hide focus card so the visitor's eye lands on WIRE.
          hideFocus();
        } catch (e) {}
      });
    }

    // ── TELL THE PEOPLES panel ──────────────────────────────────
    var STATE_KEYS = {
      mood: 'pc:visitor:mood',
      listening: 'pc:visitor:listening',
      where: 'pc:visitor:where',
    };
    var panel = document.getElementById('here-tell-panel');
    var tellBtn = document.getElementById('here-tell-btn');
    var inputListening = document.getElementById('here-input-listening');
    var inputWhere = document.getElementById('here-input-where');
    var geoBtn = document.getElementById('here-geo-btn');
    var moodRow = document.getElementById('here-mood-row');
    var saveBtn = document.getElementById('here-save-btn');
    var clearBtn = document.getElementById('here-clear-btn');
    var saveHint = document.getElementById('here-save-hint');
    var stateLine = document.getElementById('here-state');
    var stateMood = document.getElementById('here-state-mood');
    var stateListening = document.getElementById('here-state-listening');
    var stateListeningText = document.getElementById('here-state-listening-text');
    var stateWhere = document.getElementById('here-state-where');
    var stateWhereText = document.getElementById('here-state-where-text');
    var stateEdit = document.getElementById('here-state-edit');

    var selectedMood = null;

    function paintMoodPills(mood) {
      if (!moodRow) return;
      var pills = moodRow.querySelectorAll('.mood-pill');
      pills.forEach(function (p) {
        if (p.dataset.mood === mood) p.classList.add('mood-pill--active');
        else p.classList.remove('mood-pill--active');
      });
    }

    function paintStateLine() {
      var mood = lsGet(STATE_KEYS.mood);
      var listening = lsGet(STATE_KEYS.listening);
      var where = lsGet(STATE_KEYS.where);
      var any = mood || listening || where;
      if (!stateLine) return;
      if (!any) { stateLine.hidden = true; return; }
      stateLine.hidden = false;
      if (stateMood) {
        if (mood) { stateMood.hidden = false; stateMood.textContent = mood; stateMood.dataset.mood = mood; }
        else stateMood.hidden = true;
      }
      if (stateListening && stateListeningText) {
        if (listening) { stateListening.hidden = false; stateListeningText.textContent = listening.length > 50 ? listening.slice(0, 49) + '…' : listening; }
        else stateListening.hidden = true;
      }
      if (stateWhere && stateWhereText) {
        if (where) { stateWhere.hidden = false; stateWhereText.textContent = where; }
        else stateWhere.hidden = true;
      }
    }

    function togglePanel(open) {
      if (!panel || !tellBtn) return;
      var nextOpen = typeof open === 'boolean' ? open : panel.hidden;
      panel.hidden = !nextOpen;
      tellBtn.setAttribute('aria-expanded', String(!panel.hidden));
      var label = tellBtn.querySelector('.here-strip__tell-label');
      if (label) label.textContent = panel.hidden ? '+ TELL' : '× CLOSE';
    }

    function loadIntoInputs() {
      if (inputListening) inputListening.value = lsGet(STATE_KEYS.listening) || '';
      if (inputWhere) inputWhere.value = lsGet(STATE_KEYS.where) || '';
      selectedMood = lsGet(STATE_KEYS.mood);
      paintMoodPills(selectedMood);
    }

    if (tellBtn) tellBtn.addEventListener('click', function () {
      togglePanel();
      if (!panel.hidden) loadIntoInputs();
    });

    if (moodRow) moodRow.addEventListener('click', function (ev) {
      var t = ev.target.closest('.mood-pill');
      if (!t) return;
      var m = t.dataset.mood;
      selectedMood = (selectedMood === m) ? null : m;
      paintMoodPills(selectedMood);
    });

    if (geoBtn) geoBtn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        saveHint.textContent = 'no geolocation support';
        return;
      }
      saveHint.textContent = 'asking…';
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude.toFixed(2);
        var lng = pos.coords.longitude.toFixed(2);
        // Simple: write coords as "lat,lng"; future tick can reverse-geocode to city.
        if (inputWhere) inputWhere.value = lat + ',' + lng;
        saveHint.textContent = '✓ got coords · reverse-geocode coming';
      }, function (err) {
        saveHint.textContent = 'denied (' + (err && err.code) + ')';
      }, { enableHighAccuracy: false, timeout: 8000 });
    });

    if (saveBtn) saveBtn.addEventListener('click', function () {
      var listening = (inputListening && inputListening.value || '').trim();
      var where = (inputWhere && inputWhere.value || '').trim();
      lsSet(STATE_KEYS.mood, selectedMood);
      lsSet(STATE_KEYS.listening, listening);
      lsSet(STATE_KEYS.where, where);
      sendPresence('update', {
        mood: selectedMood || null,
        listening: listening || null,
        where: where || null,
      });
      saveHint.textContent = '✓ saved · shown to you + peoples around';
      paintStateLine();
      setTimeout(function () {
        saveHint.textContent = '';
        togglePanel(false);
      }, 1200);
    });

    if (clearBtn) clearBtn.addEventListener('click', function () {
      lsSet(STATE_KEYS.mood, null);
      lsSet(STATE_KEYS.listening, null);
      lsSet(STATE_KEYS.where, null);
      selectedMood = null;
      if (inputListening) inputListening.value = '';
      if (inputWhere) inputWhere.value = '';
      paintMoodPills(null);
      sendPresence('update', { mood: null, listening: null, where: null });
      saveHint.textContent = 'cleared';
      paintStateLine();
      setTimeout(function () { saveHint.textContent = ''; }, 900);
    });

    if (stateEdit) stateEdit.addEventListener('click', function () {
      togglePanel(true);
      loadIntoInputs();
    });

    paintStateLine();
  })();
<\/script>`], ["", '<aside class="here-strip" aria-label="Visitors here right now" data-initial="hidden" data-astro-cid-6axxcpd6> <div class="here-strip__row" data-astro-cid-6axxcpd6> <span class="here-strip__kicker mono" data-astro-cid-6axxcpd6> <span class="here-strip__kicker-label" data-astro-cid-6axxcpd6>PEOPLES HERE</span> <span class="here-strip__kicker-sub" id="here-count" data-astro-cid-6axxcpd6>· 1 ·</span>  <span class="here-strip__room-count" id="here-room-count" hidden data-astro-cid-6axxcpd6></span> </span> <ol class="here-strip__slots" id="here-slots" data-astro-cid-6axxcpd6>  <li class="here-slot here-slot--you" data-slot="0" data-astro-cid-6axxcpd6> <span class="here-slot__ring" aria-hidden="true" data-astro-cid-6axxcpd6></span> <img class="here-slot__noun" id="here-you-img" alt="" src="" loading="eager" data-astro-cid-6axxcpd6> <span class="here-slot__label mono" data-astro-cid-6axxcpd6>YOU</span> </li>  ', `  <li class="here-slot here-slot--overflow" id="here-overflow" hidden data-astro-cid-6axxcpd6> <span class="here-slot__overflow-num mono" id="here-overflow-num" data-astro-cid-6axxcpd6>+0</span> </li> </ol> <button class="here-strip__tell mono" id="here-tell-btn" type="button" aria-expanded="false" aria-controls="here-tell-panel" data-astro-cid-6axxcpd6> <span class="here-strip__tell-label" data-astro-cid-6axxcpd6>+ TELL</span> </button>  <button class="here-strip__wire mono" id="here-wire-btn" type="button" aria-expanded="false" aria-controls="here-wire-panel" data-astro-cid-6axxcpd6> <span class="here-strip__wire-label" data-astro-cid-6axxcpd6>WIRE</span> <span class="here-strip__wire-badge" id="here-wire-badge" hidden data-astro-cid-6axxcpd6>·</span> </button> <a class="here-strip__profile mono" href="/profile" id="here-profile-link" data-astro-cid-6axxcpd6> <span class="here-strip__profile-label" data-astro-cid-6axxcpd6>PROFILE</span> <span class="here-strip__profile-arrow" aria-hidden="true" data-astro-cid-6axxcpd6>→</span> </a> </div>  <div class="here-strip__vibes" id="here-vibes-bar" aria-label="React with a vibe" data-astro-cid-6axxcpd6> <span class="here-vibes__label mono" data-astro-cid-6axxcpd6>VIBE</span> <button type="button" class="here-vibes__btn" data-vibe="❤️" aria-label="heart" data-astro-cid-6axxcpd6>❤️</button> <button type="button" class="here-vibes__btn" data-vibe="🔥" aria-label="fire" data-astro-cid-6axxcpd6>🔥</button> <button type="button" class="here-vibes__btn" data-vibe="👋" aria-label="hi" data-astro-cid-6axxcpd6>👋</button> <button type="button" class="here-vibes__btn" data-vibe="✨" aria-label="sparkle" data-astro-cid-6axxcpd6>✨</button> <button type="button" class="here-vibes__btn" data-vibe="😎" aria-label="cool" data-astro-cid-6axxcpd6>😎</button> <span class="here-vibes__hint mono" id="here-vibes-hint" hidden data-astro-cid-6axxcpd6></span> </div>  <div class="here-strip__vibe-float" id="here-vibe-float" aria-live="polite" data-astro-cid-6axxcpd6></div>  <div class="here-strip__state" id="here-state" hidden data-astro-cid-6axxcpd6> <span class="here-state__you mono" data-astro-cid-6axxcpd6>YOU</span> <span class="here-state__sep" aria-hidden="true" data-astro-cid-6axxcpd6>·</span> <span class="here-state__mood" id="here-state-mood" hidden data-astro-cid-6axxcpd6></span> <span class="here-state__listening" id="here-state-listening" hidden data-astro-cid-6axxcpd6> <span aria-hidden="true" data-astro-cid-6axxcpd6>🎵</span> <span id="here-state-listening-text" data-astro-cid-6axxcpd6></span> </span> <span class="here-state__where" id="here-state-where" hidden data-astro-cid-6axxcpd6> <span aria-hidden="true" data-astro-cid-6axxcpd6>📍</span> <span id="here-state-where-text" data-astro-cid-6axxcpd6></span> </span> <button class="here-state__edit mono" id="here-state-edit" type="button" data-astro-cid-6axxcpd6>edit</button> </div>  <div class="here-strip__focus" id="here-focus" hidden data-astro-cid-6axxcpd6> <img class="here-focus__noun" id="here-focus-noun" alt="" src="" data-astro-cid-6axxcpd6> <div class="here-focus__body" data-astro-cid-6axxcpd6> <p class="here-focus__head mono" data-astro-cid-6axxcpd6> <span id="here-focus-kind" data-astro-cid-6axxcpd6>VISITOR</span> <span class="here-focus__sep" aria-hidden="true" data-astro-cid-6axxcpd6>·</span> <span id="here-focus-noun-label" data-astro-cid-6axxcpd6>noun —</span> <span class="here-focus__sep" aria-hidden="true" data-astro-cid-6axxcpd6>·</span> <span id="here-focus-joined" data-astro-cid-6axxcpd6>joined —</span> </p> <p class="here-focus__detail" id="here-focus-detail" data-astro-cid-6axxcpd6></p> <div class="here-focus__actions" data-astro-cid-6axxcpd6>  <a class="here-focus__join mono" id="here-focus-join" hidden href="" data-astro-cid-6axxcpd6></a>  <button class="here-focus__wave mono" id="here-focus-wave" type="button" hidden data-astro-cid-6axxcpd6>👋 WAVE</button>  <button class="here-focus__follow mono" id="here-focus-follow" type="button" hidden aria-pressed="false" data-astro-cid-6axxcpd6>FOLLOW</button>  <button class="here-focus__reply mono" id="here-focus-reply" type="button" hidden data-astro-cid-6axxcpd6>REPLY</button>  <button class="here-focus__bring mono" id="here-focus-bring" type="button" hidden data-astro-cid-6axxcpd6>BRING HERE</button> </div> </div> <button class="here-focus__close mono" id="here-focus-close" type="button" aria-label="Close visitor details" data-astro-cid-6axxcpd6>×</button> </div>  <div class="here-strip__waves" id="here-waves" aria-live="polite" data-astro-cid-6axxcpd6></div>  <div class="here-strip__panel here-strip__panel--wire" id="here-wire-panel" hidden data-astro-cid-6axxcpd6> <p class="here-panel__eyebrow mono" data-astro-cid-6axxcpd6>WIRE · live · last 20 messages</p>  <div class="here-wire__tabs mono" role="tablist" data-astro-cid-6axxcpd6> <button type="button" class="here-wire__tab" id="here-wire-tab-room" role="tab" aria-selected="true" data-scope="room" data-astro-cid-6axxcpd6>THIS ROOM</button> <button type="button" class="here-wire__tab" id="here-wire-tab-all" role="tab" aria-selected="false" data-scope="all" data-astro-cid-6axxcpd6>ALL</button> <span class="here-wire__tab-spacer" aria-hidden="true" data-astro-cid-6axxcpd6></span> <span class="here-wire__tab-room" id="here-wire-tab-room-name" data-astro-cid-6axxcpd6></span> </div> <ol class="here-wire__log" id="here-wire-log" role="log" aria-live="polite" data-astro-cid-6axxcpd6></ol> <form class="here-wire__form" id="here-wire-form" data-astro-cid-6axxcpd6> <input type="text" id="here-wire-input" class="here-panel__input here-wire__input" placeholder="say something to the peoples · max 120 chars" maxlength="120" autocomplete="off" data-astro-cid-6axxcpd6> <button type="submit" class="here-wire__send mono" data-astro-cid-6axxcpd6>SEND</button> </form> <p class="here-wire__hint mono" data-astro-cid-6axxcpd6>all visitors here see this · ephemeral · clears when nobody's here</p> </div>  <div class="here-strip__panel" id="here-tell-panel" hidden data-astro-cid-6axxcpd6> <p class="here-panel__eyebrow mono" data-astro-cid-6axxcpd6>TELL THE PEOPLES · local first · live when connected</p> <label class="here-panel__field" data-astro-cid-6axxcpd6> <span class="here-panel__label mono" data-astro-cid-6axxcpd6>🎵 now playing</span> <input type="text" id="here-input-listening" class="here-panel__input" placeholder="Spotify URL or song title (optional)" maxlength="120" autocomplete="off" data-astro-cid-6axxcpd6> </label> <label class="here-panel__field" data-astro-cid-6axxcpd6> <span class="here-panel__label mono" data-astro-cid-6axxcpd6>📍 where</span> <div class="here-panel__where-row" data-astro-cid-6axxcpd6> <input type="text" id="here-input-where" class="here-panel__input" placeholder="El Segundo · or your town (optional)" maxlength="80" autocomplete="off" data-astro-cid-6axxcpd6> <button type="button" id="here-geo-btn" class="here-panel__geo mono" aria-label="Use my location" data-astro-cid-6axxcpd6>
📡 USE
</button> </div> </label> <fieldset class="here-panel__moods" data-astro-cid-6axxcpd6> <legend class="here-panel__label mono" data-astro-cid-6axxcpd6>mood</legend> <div class="here-panel__mood-row" id="here-mood-row" data-astro-cid-6axxcpd6> <button type="button" class="mood-pill" data-mood="chill" data-astro-cid-6axxcpd6>● chill</button> <button type="button" class="mood-pill" data-mood="hype" data-astro-cid-6axxcpd6>● hype</button> <button type="button" class="mood-pill" data-mood="focus" data-astro-cid-6axxcpd6>● focus</button> <button type="button" class="mood-pill" data-mood="flow" data-astro-cid-6axxcpd6>● flow</button> <button type="button" class="mood-pill" data-mood="curious" data-astro-cid-6axxcpd6>● curious</button> <button type="button" class="mood-pill" data-mood="quiet" data-astro-cid-6axxcpd6>● quiet</button> </div> </fieldset> <div class="here-panel__actions" data-astro-cid-6axxcpd6> <button type="button" id="here-save-btn" class="here-panel__save mono" data-astro-cid-6axxcpd6>SAVE</button> <button type="button" id="here-clear-btn" class="here-panel__clear mono" data-astro-cid-6axxcpd6>CLEAR</button> <span class="here-panel__hint mono" id="here-save-hint" data-astro-cid-6axxcpd6></span> </div> </div> </aside> <script>
  (function () {
    var strip = document.querySelector('.here-strip');
    if (!strip) return;

    function cheapHash(s) {
      var h = 5381;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
      return h >>> 0;
    }
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
    function nounUrl(id) { return 'https://noun.pics/' + id + '.svg'; }
    function truncate(s, max) {
      if (!s || s.length <= max) return s || '';
      return s.slice(0, max - 1) + '…';
    }

    var sessionId;
    sessionId = lsGet('pc:session');
    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
      lsSet('pc:session', sessionId);
    }

    var nounId;
    var cachedNoun = lsGet('pc:visitor:noun');
    if (cachedNoun) nounId = parseInt(cachedNoun, 10);
    if (!(nounId >= 0 && nounId < 1200)) {
      nounId = cheapHash(sessionId) % 1200;
      lsSet('pc:visitor:noun', String(nounId));
    }

    if (!lsGet('pc:visitor:firstSeenAt')) {
      lsSet('pc:visitor:firstSeenAt', new Date().toISOString());
    }

    var isAgent = /gptbot|claudebot|claude-user|anthropic-ai|perplexitybot|oai-searchbot|atlas|bingbot|googlebot/i.test(navigator.userAgent);

    var youImg = document.getElementById('here-you-img');
    if (youImg) {
      youImg.src = nounUrl(nounId);
      youImg.alt = 'your noun · ' + nounId;
    }
    var profileLink = document.getElementById('here-profile-link');
    if (profileLink) {
      profileLink.href = '/profile';
      profileLink.setAttribute('aria-label', 'Your profile · noun ' + nounId);
    }

    strip.dataset.initial = 'ready';

    var countEl = document.getElementById('here-count');
    var otherSlots = Array.from(strip.querySelectorAll('.here-slot--ghost[data-slot]'));
    var overflow = document.getElementById('here-overflow');
    var overflowNum = document.getElementById('here-overflow-num');
    var host = window.location.host;
    var allowPresence = host.endsWith('pointcast.xyz') || host.endsWith('.pages.dev');
    var ws = null;
    var heartbeatTimer = 0;
    var reconnectTimer = 0;

    function describeSession(session) {
      var parts = [];
      var kind = session.kind === 'agent' ? 'AGENT' : (session.kind === 'wallet' ? 'WALLET' : 'HUMAN');
      parts.push(kind);
      if (session.mood) parts.push(session.mood);
      if (session.listening) parts.push('listening ' + truncate(session.listening, 40));
      if (session.where) parts.push('in ' + truncate(session.where, 28));
      return parts.join(' · ');
    }

    function clearSlot(slot) {
      if (!slot) return;
      slot.classList.remove('here-slot--occupied');
      slot.removeAttribute('data-kind');
      slot.removeAttribute('title');
      slot.removeAttribute('aria-label');
      var img = slot.querySelector('.here-slot__noun');
      var ghost = slot.querySelector('.here-slot__ghost');
      if (img) {
        img.hidden = true;
        img.removeAttribute('src');
        img.alt = '';
      }
      if (ghost) ghost.hidden = false;
    }

    function paintSlot(slot, session) {
      if (!slot || !session) return;
      var nextNounId = Number(session.nounId);
      if (!(nextNounId >= 0 && nextNounId < 1200)) {
        clearSlot(slot);
        return;
      }
      slot.classList.add('here-slot--occupied');
      slot.dataset.kind = session.kind || 'human';
      // Phase 3 — co-room: peer is on the same path as the viewer. We
      // toggle a class so CSS can give them a distinct ring/glow.
      var sameRoom = !!session.currentPath && session.currentPath === window.location.pathname;
      if (sameRoom) slot.classList.add('here-slot--coroom');
      else slot.classList.remove('here-slot--coroom');
      // Stash the session JSON on the slot so the click handler can read it.
      try { slot.dataset.session = JSON.stringify(session); } catch (e) {}
      slot.setAttribute('role', 'button');
      slot.setAttribute('tabindex', '0');
      var img = slot.querySelector('.here-slot__noun');
      var ghost = slot.querySelector('.here-slot__ghost');
      if (img) {
        img.hidden = false;
        img.src = nounUrl(nextNounId);
        img.alt = 'visitor noun · ' + nextNounId;
      }
      if (ghost) ghost.hidden = true;
      var label = describeSession(session);
      if (label) {
        slot.title = label + ' · tap for details';
        slot.setAttribute('aria-label', label + ' · tap for details');
      } else {
        slot.title = 'visitor · tap for details';
        slot.setAttribute('aria-label', 'visitor · tap for details');
      }
      // Phase 3 — render the peer's current page as a click-to-teleport chip
      // beneath the avatar. We don't show the chip for /, /index, or our
      // own page (the visitor is already there).
      var whereLink = slot.querySelector('.here-slot__where');
      var peerPath = sanitizePeerPath(session.currentPath);
      if (whereLink) {
        if (peerPath && peerPath !== window.location.pathname) {
          whereLink.hidden = false;
          whereLink.href = peerPath;
          whereLink.textContent = 'on ' + shortenPath(peerPath);
          whereLink.setAttribute('aria-label', 'go to ' + peerPath + ' (where this visitor is)');
        } else {
          whereLink.hidden = true;
          whereLink.removeAttribute('href');
          whereLink.textContent = '';
        }
      }
      // Phase 3 — show the WAVE button when this peer is a real human/wallet
      // visitor (agents can't receive waves; the worker drops them anyway).
      var waveBtn = slot.querySelector('.here-slot__wave');
      if (waveBtn) {
        var isHuman = !session.kind || session.kind === 'human' || session.kind === 'wallet';
        if (isHuman) {
          waveBtn.hidden = false;
          waveBtn.setAttribute('data-wave-noun', String(nextNounId));
          waveBtn.setAttribute('aria-label', 'wave at noun ' + nextNounId);
        } else {
          waveBtn.hidden = true;
        }
      }
    }

    // Defense-in-depth on the receiving side: even though the server
    // already sanitizes currentPath, never render a peer-supplied value
    // that doesn't pass our own check. Mirrors normalizeCurrentPath in
    // workers/presence/src/index.ts.
    function sanitizePeerPath(value) {
      if (typeof value !== 'string') return null;
      var v = value.trim();
      if (!v || v.length > 200) return null;
      if (v.charAt(0) !== '/') return null;
      if (v.indexOf('//') === 0) return null;
      if (/[?#]/.test(v)) return null;
      if (!/^[A-Za-z0-9\\\\/_\\\\-.]+$/.test(v)) return null;
      return v;
    }
    function shortenPath(p) {
      if (!p) return '';
      if (p.length <= 22) return p;
      return p.slice(0, 21) + '…';
    }

    // ---------- visitor-slot focus (click/tap to show details) ----------
    var focusEl = document.getElementById('here-focus');
    var focusNoun = document.getElementById('here-focus-noun');
    var focusKind = document.getElementById('here-focus-kind');
    var focusNounLabel = document.getElementById('here-focus-noun-label');
    var focusJoined = document.getElementById('here-focus-joined');
    var focusDetail = document.getElementById('here-focus-detail');
    var focusClose = document.getElementById('here-focus-close');
    var focusCurrentSlot = null;

    function hideFocus() {
      if (focusEl) focusEl.hidden = true;
      focusCurrentSlot = null;
    }
    function formatJoinedAt(iso) {
      try {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var h = d.getHours(); var m = d.getMinutes();
        var mm = m < 10 ? '0' + m : String(m);
        return 'joined ' + h + ':' + mm;
      } catch (e) { return '—'; }
    }
    function showFocus(slot) {
      if (!focusEl || !slot) return;
      var raw = slot.dataset.session;
      if (!raw) return;
      var session;
      try { session = JSON.parse(raw); } catch (e) { return; }
      if (!session) return;
      if (focusNoun) {
        focusNoun.src = nounUrl(Number(session.nounId));
        focusNoun.alt = 'noun ' + session.nounId;
      }
      if (focusKind) focusKind.textContent = (session.kind || 'visitor').toUpperCase();
      if (focusNounLabel) focusNounLabel.textContent = 'noun ' + session.nounId;
      if (focusJoined) focusJoined.textContent = formatJoinedAt(session.joinedAt);
      var parts = [];
      if (session.mood) parts.push(String(session.mood).toUpperCase());
      if (session.listening) parts.push('🎵 ' + session.listening);
      if (session.where) parts.push('📍 ' + session.where);
      if (focusDetail) focusDetail.textContent = parts.length ? parts.join(' · ') : 'no self-report — just showing up is enough.';
      // Phase 3 — also render a JOIN button in the focus card if the peer
      // is on a different page from the viewer. One-click teleport.
      var peerPath = sanitizePeerPath(session.currentPath);
      var joinBtn = document.getElementById('here-focus-join');
      if (joinBtn) {
        if (peerPath && peerPath !== window.location.pathname) {
          joinBtn.hidden = false;
          joinBtn.href = peerPath;
          joinBtn.textContent = 'JOIN ON ' + shortenPath(peerPath).toUpperCase() + ' →';
        } else {
          joinBtn.hidden = true;
          joinBtn.removeAttribute('href');
        }
      }
      // Phase 3 — show WAVE + FOLLOW + REPLY buttons in the focus card.
      // Always available for human/wallet peers; hidden for agents.
      var waveBtnFocus = document.getElementById('here-focus-wave');
      var followBtnFocus = document.getElementById('here-focus-follow');
      var replyBtnFocus = document.getElementById('here-focus-reply');
      var isHumanPeer = !session.kind || session.kind === 'human' || session.kind === 'wallet';
      if (waveBtnFocus) waveBtnFocus.hidden = !isHumanPeer;
      if (followBtnFocus) {
        followBtnFocus.hidden = !isHumanPeer;
        var isFollowing = followingNounId === Number(session.nounId);
        followBtnFocus.setAttribute('aria-pressed', String(isFollowing));
        followBtnFocus.textContent = isFollowing ? 'FOLLOWING ✓' : 'FOLLOW';
      }
      if (replyBtnFocus) replyBtnFocus.hidden = !isHumanPeer;
      // Phase 4 — show BRING for human peers on a different page.
      var bringBtnFocus = document.getElementById('here-focus-bring');
      if (bringBtnFocus) {
        var canBring = isHumanPeer && peerPath && peerPath !== window.location.pathname;
        bringBtnFocus.hidden = !canBring;
        bringBtnFocus.textContent = canBring
          ? 'BRING TO ' + shortenPath(window.location.pathname).toUpperCase()
          : 'BRING HERE';
      }
      focusEl.hidden = false;
      focusCurrentSlot = slot;
    }
    function onSlotActivate(e) {
      var slot = e.currentTarget;
      if (!slot) return;
      // Toggle off if clicking the same slot.
      if (focusCurrentSlot === slot) { hideFocus(); return; }
      showFocus(slot);
    }
    if (focusClose) focusClose.addEventListener('click', hideFocus);
    // Delegate — attach once; re-evaluates slot state every click.
    var slotsEl = document.getElementById('here-slots');
    if (slotsEl) {
      slotsEl.addEventListener('click', function (e) {
        var slot = e.target.closest('.here-slot--occupied');
        if (!slot) return;
        // Skip YOU — TELL panel already owns that surface.
        if (slot.classList.contains('here-slot--you')) return;
        onSlotActivate({ currentTarget: slot });
      });
      slotsEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var slot = e.target.closest('.here-slot--occupied');
        if (!slot || slot.classList.contains('here-slot--you')) return;
        e.preventDefault();
        onSlotActivate({ currentTarget: slot });
      });
    }

    function otherSessionsFromPayload(payload) {
      var sessions = Array.isArray(payload && payload.sessions) ? payload.sessions : [];
      var others = [];
      var removedSelf = false;
      for (var i = 0; i < sessions.length; i++) {
        var session = sessions[i];
        if (!session || typeof session !== 'object') continue;
        if (!removedSelf && Number(session.nounId) === nounId) {
          removedSelf = true;
          continue;
        }
        others.push(session);
      }
      return others;
    }

    var lastPresencePayload = null;
    function paintPresence(payload) {
      if (payload) lastPresencePayload = payload;
      var humans = Number(payload && payload.humans) || 0;
      var agents = Number(payload && payload.agents) || 0;
      var total = Math.max(1, humans + agents);
      var others = otherSessionsFromPayload(payload);
      // Phase 3 — co-room first. Sort other-peers so visitors on the
      // same page bubble to the front of the avatar row. Stable sort
      // to preserve joinedAt order within each group.
      var here = window.location.pathname;
      var coRoomCount = 0;
      for (var k = 0; k < others.length; k++) {
        if (others[k] && others[k].currentPath === here) coRoomCount++;
      }
      others = others.slice().sort(function (a, b) {
        var ar = (a && a.currentPath === here) ? 0 : 1;
        var br = (b && b.currentPath === here) ? 0 : 1;
        return ar - br;
      });
      if (countEl) countEl.textContent = '· ' + total + ' ·';
      // Phase 3 — per-room chip. "ROOM 2" when there's at least one
      // co-room peer; hidden otherwise. YOU is implicit (we always count
      // ourselves, so the displayed value is \\\`coRoomCount + 1\\\`).
      var roomCountEl = document.getElementById('here-room-count');
      if (roomCountEl) {
        if (coRoomCount > 0) {
          roomCountEl.hidden = false;
          roomCountEl.textContent = '· ROOM ' + (coRoomCount + 1);
        } else {
          roomCountEl.hidden = true;
          roomCountEl.textContent = '';
        }
      }
      for (var i = 0; i < otherSlots.length; i++) {
        if (i < others.length) paintSlot(otherSlots[i], others[i]);
        else clearSlot(otherSlots[i]);
      }
      var shown = Math.min(otherSlots.length, others.length);
      var overflowCount = Math.max(0, total - 1 - shown);
      if (overflowCount > 0) {
        if (overflow) overflow.hidden = false;
        if (overflowNum) overflowNum.textContent = '+' + overflowCount;
      } else {
        if (overflow) overflow.hidden = true;
      }
      // Phase 3 — surface chat + waves + drive auto-follow.
      paintChat(payload && payload.chat);
      paintWaves(payload && payload.waves);
      paintVibes(payload && payload.vibes);
      maybeFollow(others);
    }

    function sendPresence(type, extra) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try {
        var payload = { type: type, nounId: nounId };
        if (!isAgent && extra && typeof extra === 'object') {
          if (Object.prototype.hasOwnProperty.call(extra, 'mood')) payload.mood = extra.mood;
          if (Object.prototype.hasOwnProperty.call(extra, 'listening')) payload.listening = extra.listening;
          if (Object.prototype.hasOwnProperty.call(extra, 'where')) payload.where = extra.where;
          if (Object.prototype.hasOwnProperty.call(extra, 'currentPath')) payload.currentPath = extra.currentPath;
        }
        ws.send(JSON.stringify(payload));
        return true;
      } catch (e) {
        return false;
      }
    }

    function currentPresenceFields() {
      return {
        mood: lsGet('pc:visitor:mood'),
        listening: lsGet('pc:visitor:listening'),
        where: lsGet('pc:visitor:where'),
        // Phase 3 — broadcast the current page so peers can see + follow.
        // Agents don't get this (server strips it for kind=agent anyway).
        currentPath: window.location && window.location.pathname ? window.location.pathname : undefined,
      };
    }

    // Re-emit currentPath after Astro view transitions so peers see the
    // visitor moving between rooms in real time.
    document.addEventListener('astro:after-swap', function () {
      if (isAgent) return;
      sendPresence('update', { currentPath: window.location.pathname });
    });

    function stopHeartbeat() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = 0;
      }
    }

    function scheduleReconnect() {
      stopHeartbeat();
      if (reconnectTimer || !allowPresence) return;
      reconnectTimer = window.setTimeout(function () {
        reconnectTimer = 0;
        connectPresence();
      }, 3000);
    }

    function connectPresence() {
      if (!allowPresence) return;
      var wsURL = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + host +
        '/api/presence?sid=' + encodeURIComponent(sessionId) + '&kind=' + (isAgent ? 'agent' : 'human');
      try {
        ws = new WebSocket(wsURL);
      } catch (e) {
        scheduleReconnect();
        return;
      }
      ws.addEventListener('open', function () {
        stopHeartbeat();
        sendPresence('identify', currentPresenceFields());
        heartbeatTimer = window.setInterval(function () {
          sendPresence('ping');
        }, 30_000);
      });
      ws.addEventListener('message', function (evt) {
        try {
          paintPresence(JSON.parse(evt.data));
        } catch (e) {}
      });
      ws.addEventListener('close', scheduleReconnect);
      ws.addEventListener('error', scheduleReconnect);
    }

    paintPresence({
      humans: isAgent ? 0 : 1,
      agents: isAgent ? 1 : 0,
      sessions: [{ nounId: nounId, kind: isAgent ? 'agent' : 'human', joinedAt: new Date().toISOString() }],
    });
    if (allowPresence) connectPresence();

    // ── Phase 3: WAVE button on each peer slot ─────────────────
    // Delegate so we don't need to wire one listener per slot.
    var slotsRoot = document.getElementById('here-slots');
    if (slotsRoot) {
      slotsRoot.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('.here-slot__wave');
        if (!btn) return;
        e.stopPropagation();
        e.preventDefault();
        var to = Number(btn.getAttribute('data-wave-noun'));
        if (!(to >= 0 && to < 1200)) return;
        sendWave(to);
        // Self-confirm — flash a tiny ✓ on the button so the sender sees it
        // before the broadcast loop returns.
        btn.classList.add('here-slot__wave--sent');
        setTimeout(function () { btn.classList.remove('here-slot__wave--sent'); }, 1200);
      });
    }

    function sendWave(toNoun, opts) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try {
        var msg = { type: 'wave', nounId: nounId, to: toNoun, emoji: '👋' };
        // Phase 4 — BRING piggybacks on wave with optional targetPath.
        if (opts && opts.targetPath) msg.targetPath = String(opts.targetPath).slice(0, 200);
        if (opts && opts.emoji) msg.emoji = String(opts.emoji).slice(0, 8);
        ws.send(JSON.stringify(msg));
        return true;
      } catch (e) { return false; }
    }

    // ── Phase 3: WAVE rendering (incoming) ─────────────────────
    var wavesRoot = document.getElementById('here-waves');
    var seenWaveAt = 0; // dedupe: monotonic timestamp of last rendered wave
    function paintWaves(waves) {
      if (!wavesRoot || !Array.isArray(waves) || !waves.length) return;
      // Render only entries newer than the last we showed.
      var fresh = [];
      for (var i = 0; i < waves.length; i++) {
        var w = waves[i];
        if (!w || typeof w.at !== 'number') continue;
        if (w.at <= seenWaveAt) continue;
        fresh.push(w);
      }
      if (!fresh.length) return;
      seenWaveAt = fresh[fresh.length - 1].at;
      for (var j = 0; j < fresh.length; j++) {
        renderWave(fresh[j]);
      }
    }
    function renderWave(w) {
      var atMe = Number(w.toNoun) === Number(nounId);
      var fromMe = Number(w.fromNoun) === Number(nounId);
      var hasBring = atMe && typeof w.targetPath === 'string' && sanitizePeerPath(w.targetPath) && w.targetPath !== window.location.pathname;
      var chip = document.createElement('div');
      chip.className = 'here-wave-chip' + (atMe ? ' here-wave-chip--at-me' : '') + (hasBring ? ' here-wave-chip--bring' : '');
      var label = (w.emoji || '👋') + ' noun ' + w.fromNoun + ' → noun ' + w.toNoun;
      if (atMe) label += ' · that’s YOU';
      else if (fromMe) label += ' · sent';
      // Phase 4 — BRING: include the target path + a JOIN button when
      // the wave invites YOU somewhere.
      if (hasBring) {
        var lab = document.createElement('span'); lab.textContent = label + ' · come to ' + shortenPath(w.targetPath); chip.appendChild(lab);
        var go = document.createElement('a');
        go.className = 'here-wave-chip__go mono';
        go.href = w.targetPath;
        go.textContent = 'JOIN →';
        chip.appendChild(go);
      } else {
        chip.textContent = label;
      }
      wavesRoot.appendChild(chip);
      // Auto-remove after 4s (or 8s for BRING — the call to action gets longer).
      var dwell = hasBring ? 8_000 : 4_000;
      setTimeout(function () {
        chip.classList.add('here-wave-chip--out');
        setTimeout(function () { if (chip.parentNode) chip.parentNode.removeChild(chip); }, 400);
      }, dwell);
    }

    // ── Phase 4: VIBE bar + render ─────────────────────────────
    var vibesBar = document.getElementById('here-vibes-bar');
    var vibeFloat = document.getElementById('here-vibe-float');
    var vibesHint = document.getElementById('here-vibes-hint');
    var seenVibeAt = 0;
    if (vibesBar) {
      vibesBar.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('.here-vibes__btn');
        if (!btn) return;
        var emoji = btn.getAttribute('data-vibe') || '✨';
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try { ws.send(JSON.stringify({ type: 'vibe', nounId: nounId, emoji: emoji })); } catch (e2) {}
        // Local optimistic flash so the sender sees instant feedback even
        // if the broadcast tick is a beat behind.
        renderVibe({ fromNoun: nounId, emoji: emoji, at: Date.now(), local: true });
        if (vibesHint) {
          vibesHint.hidden = false;
          vibesHint.textContent = 'sent';
          setTimeout(function () { if (vibesHint) vibesHint.hidden = true; }, 1200);
        }
        btn.classList.add('here-vibes__btn--sent');
        setTimeout(function () { btn.classList.remove('here-vibes__btn--sent'); }, 700);
      });
    }
    function paintVibes(vibes) {
      if (!Array.isArray(vibes) || !vibes.length) return;
      var here = window.location.pathname;
      var fresh = [];
      for (var i = 0; i < vibes.length; i++) {
        var v = vibes[i]; if (!v || typeof v.at !== 'number') continue;
        if (v.at <= seenVibeAt) continue;
        // Skip my own — already rendered locally; avoids double-flash.
        if (Number(v.fromNoun) === Number(nounId)) continue;
        // Co-room only.
        if (v.room && v.room !== here) continue;
        fresh.push(v);
      }
      if (!fresh.length) return;
      seenVibeAt = fresh[fresh.length - 1].at;
      for (var j = 0; j < fresh.length; j++) renderVibe(fresh[j]);
    }
    function renderVibe(v) {
      if (!vibeFloat) return;
      var chip = document.createElement('div');
      chip.className = 'here-vibe-chip';
      var em = document.createElement('span');
      em.className = 'here-vibe-chip__em';
      em.textContent = String(v.emoji || '✨');
      chip.appendChild(em);
      var who = document.createElement('span');
      who.className = 'here-vibe-chip__who mono';
      who.textContent = v.local ? 'YOU' : ('noun ' + v.fromNoun);
      chip.appendChild(who);
      // Random horizontal jitter so chips spread across the bar instead
      // of stacking vertically into a single column.
      chip.style.left = (8 + Math.floor(Math.random() * 60)) + '%';
      vibeFloat.appendChild(chip);
      // Animate up + fade. Auto-remove after the float duration.
      setTimeout(function () { chip.classList.add('here-vibe-chip--out'); }, 50);
      setTimeout(function () { if (chip.parentNode) chip.parentNode.removeChild(chip); }, 5_500);
    }

    // ── Phase 3: WIRE chat panel (uses existing DO chat ring buffer) ──
    var wirePanel = document.getElementById('here-wire-panel');
    var wireBtn = document.getElementById('here-wire-btn');
    var wireBadge = document.getElementById('here-wire-badge');
    var wireLog = document.getElementById('here-wire-log');
    var wireForm = document.getElementById('here-wire-form');
    var wireInput = document.getElementById('here-wire-input');
    var wireTabRoom = document.getElementById('here-wire-tab-room');
    var wireTabAll = document.getElementById('here-wire-tab-all');
    var wireTabRoomName = document.getElementById('here-wire-tab-room-name');
    var seenChatAt = 0;
    var unreadChat = 0;
    // Phase 3 — WIRE scope: 'room' (default — only this page's chat)
    // or 'all' (every chat in the ring buffer).
    var wireScope = 'room';
    var lastChatPayload = []; // stash so we can re-render on tab switch

    function setWireScope(next) {
      wireScope = next === 'all' ? 'all' : 'room';
      if (wireTabRoom) wireTabRoom.setAttribute('aria-selected', String(wireScope === 'room'));
      if (wireTabAll) wireTabAll.setAttribute('aria-selected', String(wireScope === 'all'));
      paintChat(lastChatPayload);
    }
    if (wireTabRoom) wireTabRoom.addEventListener('click', function () { setWireScope('room'); });
    if (wireTabAll) wireTabAll.addEventListener('click', function () { setWireScope('all'); });
    // Show the current room name in the tab bar so the visitor knows what
    // "THIS ROOM" means.
    if (wireTabRoomName) wireTabRoomName.textContent = window.location.pathname;
    document.addEventListener('astro:after-swap', function () {
      if (wireTabRoomName) wireTabRoomName.textContent = window.location.pathname;
      // Re-render filtered log against the new room.
      paintChat(lastChatPayload);
      // Re-paint presence so co-room highlight + room count + slot
      // sort reflect the new pathname.
      if (lastPresencePayload) paintPresence(lastPresencePayload);
    });

    if (wireBtn && wirePanel) {
      wireBtn.addEventListener('click', function () {
        wirePanel.hidden = !wirePanel.hidden;
        wireBtn.setAttribute('aria-expanded', String(!wirePanel.hidden));
        if (!wirePanel.hidden) {
          unreadChat = 0;
          if (wireBadge) { wireBadge.hidden = true; wireBadge.textContent = '·'; }
          if (wireInput) try { wireInput.focus(); } catch (e) {}
        }
      });
    }
    if (wireForm) {
      wireForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!wireInput) return;
        var msg = wireInput.value.trim();
        if (!msg) return;
        if (msg.length > 120) msg = msg.slice(0, 120);
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try { ws.send(JSON.stringify({ type: 'chat', nounId: nounId, msg: msg, tag: 'noun-' + nounId })); } catch (e2) {}
        wireInput.value = '';
      });
    }

    function paintChat(chat) {
      if (!wireLog) return;
      if (Array.isArray(chat)) lastChatPayload = chat;
      var source = lastChatPayload || [];
      // Apply scope filter. We compare entry.room against the viewer's
      // current pathname; entries without \\\`room\\\` (older messages or
      // pre-Phase-3 senders) are treated as "all"-only — they only show
      // up under the ALL tab so we don't leak cross-room context.
      var here = window.location.pathname;
      var filtered = wireScope === 'all'
        ? source
        : source.filter(function (c) { return c && c.room === here; });
      // Render the filtered list. Cap to last 20 entries (DO already
      // ring-buffers to that depth, but defensive).
      wireLog.innerHTML = '';
      var newer = 0;
      for (var i = 0; i < filtered.length; i++) {
        var c = filtered[i]; if (!c || typeof c.at !== 'number') continue;
        var li = document.createElement('li');
        li.className = 'here-wire__entry' + (Number(c.nounId) === Number(nounId) ? ' here-wire__entry--mine' : '');
        var who = document.createElement('span');
        who.className = 'here-wire__who mono';
        who.textContent = 'noun ' + c.nounId;
        var msg = document.createElement('span');
        msg.className = 'here-wire__msg';
        // Phase 3 — highlight @noun-NNN mentions; if it mentions YOU,
        // tag the entire entry so the row gets a brighter treatment.
        var raw = String(c.msg || '');
        var mineMention = '@noun-' + nounId;
        if (raw.indexOf(mineMention) >= 0) {
          li.classList.add('here-wire__entry--at-me');
        }
        // Render mentions as styled chips. Simple regex; max 32 chars
        // for the noun id digits to avoid catastrophic backtracking.
        var mentionRe = /@noun-(\\\\d{1,4})/g;
        var pos = 0;
        var match;
        while ((match = mentionRe.exec(raw)) !== null) {
          if (match.index > pos) {
            msg.appendChild(document.createTextNode(raw.slice(pos, match.index)));
          }
          var chip = document.createElement('span');
          chip.className = 'here-wire__mention';
          chip.textContent = match[0];
          msg.appendChild(chip);
          pos = match.index + match[0].length;
        }
        if (pos < raw.length) msg.appendChild(document.createTextNode(raw.slice(pos)));
        li.appendChild(who);
        li.appendChild(msg);
        // In ALL scope, decorate with the sender's room so cross-room
        // context is legible.
        if (wireScope === 'all' && c.room) {
          var room = document.createElement('span');
          room.className = 'here-wire__room mono';
          room.textContent = c.room;
          li.appendChild(room);
        }
        wireLog.appendChild(li);
      }
      // Empty-state hint when filtered.
      if (!filtered.length && wireScope === 'room') {
        var li2 = document.createElement('li');
        li2.className = 'here-wire__empty mono';
        li2.textContent = 'no messages from this room yet — try ALL';
        wireLog.appendChild(li2);
      }
      // Auto-scroll.
      try { wireLog.scrollTop = wireLog.scrollHeight; } catch (e) {}
      // Unread badge logic — counts new messages from peers regardless
      // of current scope filter (so visitors don't miss cross-room pings
      // they care about). Source for \\\`newer\\\` is the unfiltered chat.
      for (var k = 0; k < source.length; k++) {
        var s = source[k];
        if (!s || typeof s.at !== 'number') continue;
        if (s.at > seenChatAt && Number(s.nounId) !== Number(nounId)) newer++;
      }
      if (source.length) seenChatAt = source[source.length - 1].at;
      if (newer > 0 && wirePanel && wirePanel.hidden) {
        unreadChat += newer;
        if (wireBadge) { wireBadge.hidden = false; wireBadge.textContent = String(unreadChat); }
      }
    }

    // ── Phase 3: FOLLOW (auto-teleport when followed peer changes path) ──
    var followingNounId = -1;
    try {
      var saved = parseInt(localStorage.getItem('pc:following') || '', 10);
      if (saved >= 0 && saved < 1200) followingNounId = saved;
    } catch (e) {}

    function setFollowing(targetNoun) {
      followingNounId = (targetNoun >= 0 && targetNoun < 1200) ? targetNoun : -1;
      try {
        if (followingNounId >= 0) localStorage.setItem('pc:following', String(followingNounId));
        else localStorage.removeItem('pc:following');
      } catch (e) {}
    }

    function maybeFollow(others) {
      if (followingNounId < 0 || !Array.isArray(others)) return;
      for (var i = 0; i < others.length; i++) {
        var s = others[i];
        if (!s || Number(s.nounId) !== followingNounId) continue;
        var path = sanitizePeerPath(s.currentPath);
        if (path && path !== window.location.pathname) {
          // Tiny debounce — write a flag so we don't loop on race conditions.
          var stamp = Date.now();
          if (window.__pcLastFollowAt && stamp - window.__pcLastFollowAt < 1500) return;
          window.__pcLastFollowAt = stamp;
          window.location.href = path;
          return;
        }
      }
    }

    // Wire FOLLOW + WAVE buttons in the focus card so they target the
    // currently-focused peer.
    var focusWaveBtn = document.getElementById('here-focus-wave');
    var focusFollowBtn = document.getElementById('here-focus-follow');
    if (focusWaveBtn) {
      focusWaveBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          if (Number(s.nounId) >= 0) sendWave(Number(s.nounId));
          focusWaveBtn.classList.add('here-focus__wave--sent');
          setTimeout(function () { focusWaveBtn.classList.remove('here-focus__wave--sent'); }, 1200);
        } catch (e) {}
      });
    }
    if (focusFollowBtn) {
      focusFollowBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          var n = Number(s.nounId);
          if (!(n >= 0)) return;
          if (followingNounId === n) {
            setFollowing(-1);
            focusFollowBtn.setAttribute('aria-pressed', 'false');
            focusFollowBtn.textContent = 'FOLLOW';
          } else {
            setFollowing(n);
            focusFollowBtn.setAttribute('aria-pressed', 'true');
            focusFollowBtn.textContent = 'FOLLOWING ✓';
          }
        } catch (e) {}
      });
    }
    // Phase 4 — BRING button: send a wave with targetPath = OUR path
    // so the focused peer sees a "come to /<path>" invite chip.
    var focusBringBtn = document.getElementById('here-focus-bring');
    if (focusBringBtn) {
      focusBringBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          var n = Number(s.nounId);
          if (!(n >= 0)) return;
          sendWave(n, { targetPath: window.location.pathname, emoji: '🫳' });
          focusBringBtn.classList.add('here-focus__bring--sent');
          var prior = focusBringBtn.textContent;
          focusBringBtn.textContent = 'INVITED ✓';
          setTimeout(function () {
            focusBringBtn.classList.remove('here-focus__bring--sent');
            focusBringBtn.textContent = prior;
          }, 1800);
        } catch (e) {}
      });
    }

    // Phase 3 — REPLY button opens WIRE with @noun-N prefilled. Threading
    // is just a mention convention; no DO change needed since chat already
    // ring-buffers and broadcasts.
    var focusReplyBtn = document.getElementById('here-focus-reply');
    if (focusReplyBtn) {
      focusReplyBtn.addEventListener('click', function () {
        if (!focusCurrentSlot) return;
        try {
          var s = JSON.parse(focusCurrentSlot.dataset.session || '{}');
          var n = Number(s.nounId);
          if (!(n >= 0)) return;
          // Open WIRE if it's closed.
          if (wirePanel && wirePanel.hidden && wireBtn) {
            wireBtn.click();
          }
          if (wireInput) {
            var prefill = '@noun-' + n + ' ';
            wireInput.value = prefill;
            try { wireInput.focus(); } catch (e2) {}
            try {
              wireInput.setSelectionRange(prefill.length, prefill.length);
            } catch (e3) {}
          }
          // Hide focus card so the visitor's eye lands on WIRE.
          hideFocus();
        } catch (e) {}
      });
    }

    // ── TELL THE PEOPLES panel ──────────────────────────────────
    var STATE_KEYS = {
      mood: 'pc:visitor:mood',
      listening: 'pc:visitor:listening',
      where: 'pc:visitor:where',
    };
    var panel = document.getElementById('here-tell-panel');
    var tellBtn = document.getElementById('here-tell-btn');
    var inputListening = document.getElementById('here-input-listening');
    var inputWhere = document.getElementById('here-input-where');
    var geoBtn = document.getElementById('here-geo-btn');
    var moodRow = document.getElementById('here-mood-row');
    var saveBtn = document.getElementById('here-save-btn');
    var clearBtn = document.getElementById('here-clear-btn');
    var saveHint = document.getElementById('here-save-hint');
    var stateLine = document.getElementById('here-state');
    var stateMood = document.getElementById('here-state-mood');
    var stateListening = document.getElementById('here-state-listening');
    var stateListeningText = document.getElementById('here-state-listening-text');
    var stateWhere = document.getElementById('here-state-where');
    var stateWhereText = document.getElementById('here-state-where-text');
    var stateEdit = document.getElementById('here-state-edit');

    var selectedMood = null;

    function paintMoodPills(mood) {
      if (!moodRow) return;
      var pills = moodRow.querySelectorAll('.mood-pill');
      pills.forEach(function (p) {
        if (p.dataset.mood === mood) p.classList.add('mood-pill--active');
        else p.classList.remove('mood-pill--active');
      });
    }

    function paintStateLine() {
      var mood = lsGet(STATE_KEYS.mood);
      var listening = lsGet(STATE_KEYS.listening);
      var where = lsGet(STATE_KEYS.where);
      var any = mood || listening || where;
      if (!stateLine) return;
      if (!any) { stateLine.hidden = true; return; }
      stateLine.hidden = false;
      if (stateMood) {
        if (mood) { stateMood.hidden = false; stateMood.textContent = mood; stateMood.dataset.mood = mood; }
        else stateMood.hidden = true;
      }
      if (stateListening && stateListeningText) {
        if (listening) { stateListening.hidden = false; stateListeningText.textContent = listening.length > 50 ? listening.slice(0, 49) + '…' : listening; }
        else stateListening.hidden = true;
      }
      if (stateWhere && stateWhereText) {
        if (where) { stateWhere.hidden = false; stateWhereText.textContent = where; }
        else stateWhere.hidden = true;
      }
    }

    function togglePanel(open) {
      if (!panel || !tellBtn) return;
      var nextOpen = typeof open === 'boolean' ? open : panel.hidden;
      panel.hidden = !nextOpen;
      tellBtn.setAttribute('aria-expanded', String(!panel.hidden));
      var label = tellBtn.querySelector('.here-strip__tell-label');
      if (label) label.textContent = panel.hidden ? '+ TELL' : '× CLOSE';
    }

    function loadIntoInputs() {
      if (inputListening) inputListening.value = lsGet(STATE_KEYS.listening) || '';
      if (inputWhere) inputWhere.value = lsGet(STATE_KEYS.where) || '';
      selectedMood = lsGet(STATE_KEYS.mood);
      paintMoodPills(selectedMood);
    }

    if (tellBtn) tellBtn.addEventListener('click', function () {
      togglePanel();
      if (!panel.hidden) loadIntoInputs();
    });

    if (moodRow) moodRow.addEventListener('click', function (ev) {
      var t = ev.target.closest('.mood-pill');
      if (!t) return;
      var m = t.dataset.mood;
      selectedMood = (selectedMood === m) ? null : m;
      paintMoodPills(selectedMood);
    });

    if (geoBtn) geoBtn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        saveHint.textContent = 'no geolocation support';
        return;
      }
      saveHint.textContent = 'asking…';
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude.toFixed(2);
        var lng = pos.coords.longitude.toFixed(2);
        // Simple: write coords as "lat,lng"; future tick can reverse-geocode to city.
        if (inputWhere) inputWhere.value = lat + ',' + lng;
        saveHint.textContent = '✓ got coords · reverse-geocode coming';
      }, function (err) {
        saveHint.textContent = 'denied (' + (err && err.code) + ')';
      }, { enableHighAccuracy: false, timeout: 8000 });
    });

    if (saveBtn) saveBtn.addEventListener('click', function () {
      var listening = (inputListening && inputListening.value || '').trim();
      var where = (inputWhere && inputWhere.value || '').trim();
      lsSet(STATE_KEYS.mood, selectedMood);
      lsSet(STATE_KEYS.listening, listening);
      lsSet(STATE_KEYS.where, where);
      sendPresence('update', {
        mood: selectedMood || null,
        listening: listening || null,
        where: where || null,
      });
      saveHint.textContent = '✓ saved · shown to you + peoples around';
      paintStateLine();
      setTimeout(function () {
        saveHint.textContent = '';
        togglePanel(false);
      }, 1200);
    });

    if (clearBtn) clearBtn.addEventListener('click', function () {
      lsSet(STATE_KEYS.mood, null);
      lsSet(STATE_KEYS.listening, null);
      lsSet(STATE_KEYS.where, null);
      selectedMood = null;
      if (inputListening) inputListening.value = '';
      if (inputWhere) inputWhere.value = '';
      paintMoodPills(null);
      sendPresence('update', { mood: null, listening: null, where: null });
      saveHint.textContent = 'cleared';
      paintStateLine();
      setTimeout(function () { saveHint.textContent = ''; }, 900);
    });

    if (stateEdit) stateEdit.addEventListener('click', function () {
      togglePanel(true);
      loadIntoInputs();
    });

    paintStateLine();
  })();
<\/script>`])), maybeRenderHead(), Array.from({ length: 11 }).map((_, i) => renderTemplate`<li${addAttribute(`here-slot here-slot--ghost`, "class")}${addAttribute(i + 1, "data-slot")} data-astro-cid-6axxcpd6> <img class="here-slot__noun here-slot__noun--other" alt="" src="" loading="lazy" hidden data-astro-cid-6axxcpd6> <span class="here-slot__ghost" aria-hidden="true" data-astro-cid-6axxcpd6>·</span>  <a class="here-slot__where" hidden href="" aria-label="" data-astro-cid-6axxcpd6></a>  <button class="here-slot__wave" type="button" hidden aria-label="wave at this visitor" data-wave-noun="" data-astro-cid-6axxcpd6>👋</button> </li>`));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/VisitorHereStrip.astro", void 0);

var __freeze$9 = Object.freeze;
var __defProp$9 = Object.defineProperty;
var __template$9 = (cooked, raw) => __freeze$9(__defProp$9(cooked, "raw", { value: __freeze$9(cooked.slice()) }));
var _a$9;
const $$NetworkStrip = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$9 || (_a$9 = __template$9(["", `<aside class="network-strip" aria-label="Network primitives" data-astro-cid-4qgpehga> <p class="network-strip__kicker mono" data-astro-cid-4qgpehga> <span class="network-strip__label" data-astro-cid-4qgpehga>NETWORK</span> <span class="network-strip__sep" aria-hidden="true" data-astro-cid-4qgpehga>·</span> <span class="network-strip__lede" data-astro-cid-4qgpehga> <span id="network-live-count" data-astro-cid-4qgpehga>—</span> here now · <span id="network-node-count" data-astro-cid-4qgpehga>3</span> nodes registered
</span> </p> <ul class="network-strip__links mono" data-astro-cid-4qgpehga> <li data-astro-cid-4qgpehga><a href="/here" data-astro-cid-4qgpehga>/here → live congregation</a></li> <li data-astro-cid-4qgpehga><a href="/for-nodes" data-astro-cid-4qgpehga>/for-nodes → become a node</a></li> <li data-astro-cid-4qgpehga><a href="/workbench" data-astro-cid-4qgpehga>/workbench → who's building what</a></li> </ul> </aside> <script>
  (function () {
    fetch('/api/presence/snapshot', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return;
        var total = (j.humans || 0) + (j.agents || 0);
        var el = document.getElementById('network-live-count');
        if (el) el.textContent = String(Math.max(total, 1));
      })
      .catch(function () { /* no-op — sensible fallback already in markup */ });
  })();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/NetworkStrip.astro", void 0);

const $$TodayOnPointCast = createComponent(($$result, $$props, $$slots) => {
  const prettyToday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(/* @__PURE__ */ new Date());
  const STOPS = [
    {
      kicker: "MONDAY · 5/4",
      title: "Clean shipping lane, live front door",
      dek: "The WIP shelf stays safe; the verified worktree becomes the publish path; the first screen says what is alive today.",
      href: "/b/0427"
    },
    {
      kicker: "DRUM · SAINT",
      title: "Your patron Noun has an altar lane",
      dek: "A personal Noun identity follows the browser, then routes offerings into the current weekly altar chamber.",
      href: "/drum-saint"
    },
    {
      kicker: "ROOM · VESPERS",
      title: "Bells on the hour",
      dek: "Leave the tower open and the day gets tolled into shape. Manual toll works after the first click.",
      href: "/drum-vespers"
    },
    {
      kicker: "PLAY · PENDULUM",
      title: "A brass bell on a rope",
      dek: "Click anywhere to push. The swing rings at the apex, decays naturally, and keeps local swing receipts.",
      href: "/drum-pendulum"
    },
    {
      kicker: "STATUS · NOW",
      title: "One screen for the current state",
      dek: "Latest block, Card of the Day, Prize Cast status, contract footprint, and the latest commit trail.",
      href: "/now"
    },
    {
      kicker: "AGENTS · ROUTE",
      title: "Readable paths for humans and machines",
      dek: "The Monday route for visiting agents: /for-agents, /agents.json, /status, then one bounded ping or artifact.",
      href: "/for-agents"
    }
  ];
  return renderTemplate`${maybeRenderHead()}<aside class="today-strip" aria-label="Today on PointCast" data-astro-cid-ovhvksfv> <header class="today-strip__head" data-astro-cid-ovhvksfv> <p class="today-strip__date mono" data-astro-cid-ovhvksfv> <span class="today-strip__date-day" data-astro-cid-ovhvksfv>${prettyToday}</span> <span class="today-strip__sep" aria-hidden="true" data-astro-cid-ovhvksfv>·</span> <span class="today-strip__date-loc" data-astro-cid-ovhvksfv>El Segundo</span> </p> <p class="today-strip__kicker mono" data-astro-cid-ovhvksfv>TODAY ON POINTCAST · CURATED</p> </header> <ol class="today-strip__list" data-astro-cid-ovhvksfv> ${STOPS.map((s, i) => renderTemplate`<li class="today-stop" data-astro-cid-ovhvksfv> <a class="today-stop__link"${addAttribute(s.href, "href")} data-astro-cid-ovhvksfv> <span class="today-stop__num mono" data-astro-cid-ovhvksfv>${String(i + 1).padStart(2, "0")}</span> <span class="today-stop__kicker mono" data-astro-cid-ovhvksfv>${s.kicker}</span> <span class="today-stop__title" data-astro-cid-ovhvksfv>${s.title}</span> <span class="today-stop__dek" data-astro-cid-ovhvksfv>${s.dek}</span> <span class="today-stop__arrow mono" aria-hidden="true" data-astro-cid-ovhvksfv>→</span> </a> </li>`)} </ol> <p class="today-strip__footer mono" data-astro-cid-ovhvksfv>
also today · <a href="/status" data-astro-cid-ovhvksfv>agent ledger</a> · <a href="/drum-press" data-astro-cid-ovhvksfv>drum press</a> · <a href="/archive" data-astro-cid-ovhvksfv>full archive</a> </p> </aside>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/TodayOnPointCast.astro", void 0);

var __freeze$8 = Object.freeze;
var __defProp$8 = Object.defineProperty;
var __template$8 = (cooked, raw) => __freeze$8(__defProp$8(cooked, "raw", { value: __freeze$8(cooked.slice()) }));
var _a$8;
const $$DailyDropStrip = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const pick = pickDailyBlock(blocks);
  const today = todayPT();
  const prettyDay = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(/* @__PURE__ */ new Date()).toUpperCase();
  return renderTemplate(_a$8 || (_a$8 = __template$8(["", "<script>\n(function () {\n  'use strict';\n  var strip = document.querySelector('.daily-drop-strip');\n  if (!strip) return;\n\n  var COLLECTION_KEY = 'pc:daily:collected';\n  var LAST_DAY_KEY = 'pc:daily:lastDay';\n  var HELLO_KEY = 'pc:hello:count';\n\n  var btn = document.getElementById('daily-drop-collect');\n  var totalEl = document.getElementById('daily-drop-total');\n  var streakEl = document.getElementById('daily-drop-streak');\n\n  var blockId = strip.getAttribute('data-block-id') || '';\n  var today = strip.getAttribute('data-today') || '';\n\n  function readCollection() {\n    try {\n      var raw = localStorage.getItem(COLLECTION_KEY);\n      if (!raw) return [];\n      var parsed = JSON.parse(raw);\n      return Array.isArray(parsed) ? parsed : [];\n    } catch (e) { return []; }\n  }\n\n  function writeCollection(arr) {\n    try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(arr)); } catch (e) {}\n  }\n\n  function computeStreak(collection) {\n    if (!collection.length) return 0;\n    var dates = collection.map(function (c) { return c.date; }).sort();\n    var streak = 1;\n    // Walk backward from today; count consecutive days present.\n    var d = new Date(today + 'T12:00:00');\n    for (var i = dates.length - 1; i >= 0; i--) {\n      var ymd = d.toISOString().slice(0, 10);\n      if (dates.indexOf(ymd) === -1) break;\n      streak = 1 + (i === dates.length - 1 ? 0 : streak);\n      d.setDate(d.getDate() - 1);\n    }\n    // Simpler: just count distinct recent consecutive days.\n    var uniq = {};\n    dates.forEach(function (x) { uniq[x] = true; });\n    var days = Object.keys(uniq).sort().reverse();\n    var count = 0;\n    var cursor = new Date(today + 'T12:00:00');\n    for (var j = 0; j < days.length; j++) {\n      var want = cursor.toISOString().slice(0, 10);\n      if (days[j] !== want) break;\n      count++;\n      cursor.setDate(cursor.getDate() - 1);\n    }\n    return count;\n  }\n\n  function paint(state) {\n    var coll = state.collection;\n    if (totalEl) totalEl.textContent = String(coll.length);\n    if (streakEl) streakEl.textContent = String(computeStreak(coll));\n    if (state.claimed && btn) {\n      btn.classList.add('daily-drop-strip__collect--done');\n      btn.disabled = true;\n      var icon = btn.querySelector('.daily-drop-strip__collect-icon');\n      var label = btn.querySelector('.daily-drop-strip__collect-label');\n      if (icon) icon.textContent = '✓';\n      if (label) label.textContent = 'COLLECTED';\n    }\n  }\n\n  function currentState() {\n    var collection = readCollection();\n    var claimed = collection.some(function (c) { return c.date === today && c.blockId === blockId; });\n    return { collection: collection, claimed: claimed };\n  }\n\n  paint(currentState());\n\n  if (btn) {\n    btn.addEventListener('click', function () {\n      var st = currentState();\n      if (st.claimed) return;\n      var entry = { date: today, blockId: blockId, at: new Date().toISOString() };\n      var next = st.collection.concat([entry]);\n      writeCollection(next);\n      try { localStorage.setItem(LAST_DAY_KEY, today); } catch (e) {}\n      // HELLO +1 on first collect of the day (matches /today's behavior).\n      try {\n        var h = parseInt(localStorage.getItem(HELLO_KEY) || '0', 10) || 0;\n        localStorage.setItem(HELLO_KEY, String(h + 1));\n      } catch (e) {}\n      paint({ collection: next, claimed: true });\n    });\n  }\n})();\n<\/script>"])), pick && renderTemplate`${maybeRenderHead()}<aside class="daily-drop-strip"${addAttribute(pick.data.id, "data-block-id")}${addAttribute(today, "data-today")} aria-label="Today's daily drop" data-astro-cid-letm7yjq><div class="daily-drop-strip__left" data-astro-cid-letm7yjq><p class="daily-drop-strip__kicker mono" data-astro-cid-letm7yjq><span class="daily-drop-strip__day" data-astro-cid-letm7yjq>${prettyDay}</span><span class="daily-drop-strip__sep" aria-hidden="true" data-astro-cid-letm7yjq>·</span><span data-astro-cid-letm7yjq>TODAY'S DROP · ONE PER DAY · EVERYONE SEES THE SAME</span></p><div class="daily-drop-strip__row" data-astro-cid-letm7yjq><a class="daily-drop-strip__thumb"${addAttribute(`/b/${pick.data.id}`, "href")}${addAttribute(`Open block ${pick.data.id}`, "aria-label")} data-astro-cid-letm7yjq><img${addAttribute(`https://noun.pics/${pick.data.noun ?? parseInt(pick.data.id, 10) % 1200}.svg`, "src")} alt="" width="44" height="44" loading="lazy" style="image-rendering: pixelated;" data-astro-cid-letm7yjq></a><div class="daily-drop-strip__body" data-astro-cid-letm7yjq><p class="daily-drop-strip__code mono" data-astro-cid-letm7yjq>
CH.${CHANNELS[pick.data.channel]?.code ?? pick.data.channel} · ${pick.data.id} · ${pick.data.type}</p><a class="daily-drop-strip__title"${addAttribute(`/b/${pick.data.id}`, "href")} data-astro-cid-letm7yjq>${pick.data.title}</a></div></div></div><div class="daily-drop-strip__right" data-astro-cid-letm7yjq><button type="button" class="daily-drop-strip__collect" id="daily-drop-collect"${addAttribute(pick.data.id, "data-block-id")}${addAttribute(today, "data-today")} data-astro-cid-letm7yjq><span class="daily-drop-strip__collect-icon" aria-hidden="true" data-astro-cid-letm7yjq>✦</span><span class="daily-drop-strip__collect-label mono" data-astro-cid-letm7yjq>COLLECT</span></button><p class="daily-drop-strip__stats mono" id="daily-drop-stats" aria-live="polite" data-astro-cid-letm7yjq><span id="daily-drop-total" data-astro-cid-letm7yjq>0</span><span class="daily-drop-strip__stats-label" data-astro-cid-letm7yjq>COLLECTED</span><span class="daily-drop-strip__stats-sep" aria-hidden="true" data-astro-cid-letm7yjq>·</span><span id="daily-drop-streak" data-astro-cid-letm7yjq>0</span><span class="daily-drop-strip__stats-label" data-astro-cid-letm7yjq>STREAK</span></p></div></aside>`);
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/DailyDropStrip.astro", void 0);

var __freeze$7 = Object.freeze;
var __defProp$7 = Object.defineProperty;
var __template$7 = (cooked, raw) => __freeze$7(__defProp$7(cooked, "raw", { value: __freeze$7(cooked.slice()) }));
var _a$7;
const $$SportsStrip = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$7 || (_a$7 = __template$7(["", `<aside class="sports-strip" aria-label="Recent sports results" data-astro-cid-547j6rm5> <header class="sports-strip__head" data-astro-cid-547j6rm5> <p class="sports-strip__kicker" data-astro-cid-547j6rm5> <span class="sports-strip__kicker-live" data-astro-cid-547j6rm5>SPORTS</span> <span class="sports-strip__kicker-rest" data-astro-cid-547j6rm5>· last night · today · global major</span> </p> </header> <div class="sports-strip__grid" id="sports-strip-grid" data-astro-cid-547j6rm5> <article class="sports-tile" data-league="nba" data-path="basketball/nba" data-astro-cid-547j6rm5> <header class="sports-tile__head" data-astro-cid-547j6rm5> <h3 class="sports-tile__league" data-astro-cid-547j6rm5>NBA</h3> <span class="sports-tile__sub" data-astro-cid-547j6rm5>playoffs</span> </header> <div class="sports-tile__body" data-state="loading" data-astro-cid-547j6rm5> <p class="sports-tile__loading" data-astro-cid-547j6rm5>loading…</p> </div> <a class="sports-tile__link" href="https://www.espn.com/nba/scoreboard" target="_blank" rel="noopener" data-astro-cid-547j6rm5>full board →</a> </article> <article class="sports-tile" data-league="mlb" data-path="baseball/mlb" data-astro-cid-547j6rm5> <header class="sports-tile__head" data-astro-cid-547j6rm5> <h3 class="sports-tile__league" data-astro-cid-547j6rm5>MLB</h3> <span class="sports-tile__sub" data-astro-cid-547j6rm5>regular season</span> </header> <div class="sports-tile__body" data-state="loading" data-astro-cid-547j6rm5> <p class="sports-tile__loading" data-astro-cid-547j6rm5>loading…</p> </div> <a class="sports-tile__link" href="https://www.espn.com/mlb/scoreboard" target="_blank" rel="noopener" data-astro-cid-547j6rm5>full board →</a> </article> <article class="sports-tile" data-league="nhl" data-path="hockey/nhl" data-astro-cid-547j6rm5> <header class="sports-tile__head" data-astro-cid-547j6rm5> <h3 class="sports-tile__league" data-astro-cid-547j6rm5>NHL</h3> <span class="sports-tile__sub" data-astro-cid-547j6rm5>playoffs</span> </header> <div class="sports-tile__body" data-state="loading" data-astro-cid-547j6rm5> <p class="sports-tile__loading" data-astro-cid-547j6rm5>loading…</p> </div> <a class="sports-tile__link" href="https://www.espn.com/nhl/scoreboard" target="_blank" rel="noopener" data-astro-cid-547j6rm5>full board →</a> </article> <article class="sports-tile" data-league="epl" data-path="soccer/eng.1" data-astro-cid-547j6rm5> <header class="sports-tile__head" data-astro-cid-547j6rm5> <h3 class="sports-tile__league" data-astro-cid-547j6rm5>Premier Lg</h3> <span class="sports-tile__sub" data-astro-cid-547j6rm5>matchday</span> </header> <div class="sports-tile__body" data-state="loading" data-astro-cid-547j6rm5> <p class="sports-tile__loading" data-astro-cid-547j6rm5>loading…</p> </div> <a class="sports-tile__link" href="https://www.espn.com/soccer/scoreboard/_/league/eng.1" target="_blank" rel="noopener" data-astro-cid-547j6rm5>full board →</a> </article> </div> </aside> <script>
(function () {
  'use strict';
  var grid = document.getElementById('sports-strip-grid');
  if (!grid) return;

  var CACHE_PREFIX = 'pc:sports:v2:';
  var TTL_MS = 10 * 60 * 1000;

  function readCache(key) {
    try {
      var raw = sessionStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || !p.at || Date.now() - p.at > TTL_MS) return null;
      return p.data;
    } catch (e) { return null; }
  }
  function writeCache(key, data) {
    try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), data: data })); } catch (e) {}
  }

  function safe(x, fb) { return (x == null || x === '') ? fb : x; }

  function isCloseGame(homeScore, awayScore, status, shortDetail) {
    var hs = parseInt(homeScore, 10), as = parseInt(awayScore, 10);
    if (!isFinite(hs) || !isFinite(as)) return false;
    var diff = Math.abs(hs - as);
    var detail = (shortDetail || '').toLowerCase();
    // OT / extra time / shootout / penalties / F/OT / 2OT etc.
    if (/ot|extra|shootout|penalt|so|et/.test(detail)) return true;
    // Close-final: ≤3 runs in MLB, ≤5 pts in NBA, ≤1 in NHL/EPL.
    if (status === 'post') return diff <= 3;
    // In-progress: amber when tied or ≤2.
    if (status === 'in') return diff <= 2;
    return false;
  }

  function fmtGame(event) {
    try {
      var comp = event.competitions && event.competitions[0];
      if (!comp) return null;
      var competitors = comp.competitors || [];
      if (competitors.length !== 2) return null;
      var home = competitors.find(function (c) { return c.homeAway === 'home'; }) || competitors[0];
      var away = competitors.find(function (c) { return c.homeAway === 'away'; }) || competitors[1];
      var status = (comp.status && comp.status.type && comp.status.type.state) || 'pre';
      var shortDetail = (comp.status && comp.status.type && comp.status.type.shortDetail) || '';
      var hAbbr = safe(home.team && home.team.abbreviation, safe(home.team && home.team.shortDisplayName, '—'));
      var aAbbr = safe(away.team && away.team.abbreviation, safe(away.team && away.team.shortDisplayName, '—'));
      var hScore = safe(home.score, '');
      var aScore = safe(away.score, '');
      var hWinner = home.winner === true;
      var aWinner = away.winner === true;
      var hot = isCloseGame(hScore, aScore, status, shortDetail);
      return {
        status: status,
        shortDetail: shortDetail,
        hAbbr: hAbbr, aAbbr: aAbbr,
        hScore: hScore, aScore: aScore,
        hWinner: hWinner, aWinner: aWinner,
        hot: hot,
      };
    } catch (e) { return null; }
  }

  function rank(a, b) {
    var order = { in: 3, post: 2, pre: 1 };
    return (order[b.status] || 0) - (order[a.status] || 0);
  }

  function renderGames(tile, games) {
    var body = tile.querySelector('.sports-tile__body');
    if (!body) return;
    if (!games || !games.length) {
      body.dataset.state = 'empty';
      body.innerHTML = '<p class="sports-tile__loading">no games scheduled</p>';
      return;
    }
    body.dataset.state = 'loaded';
    var sorted = games.slice().sort(rank).slice(0, 3);
    body.innerHTML = sorted.map(function (g) {
      var statusLabel = '';
      var statusClass = '';
      if (g.status === 'post') { statusLabel = 'FINAL'; statusClass = 'final'; }
      else if (g.status === 'in') { statusLabel = g.shortDetail || 'LIVE'; statusClass = 'live'; }
      else { statusLabel = g.shortDetail || 'UPCOMING'; statusClass = 'pre'; }

      var hotBadge = g.hot ? '<span class="sports-game__hot" aria-label="close game">⚡</span>' : '';

      var awayRow = '<div class="sports-game__row' + (g.aWinner ? ' sports-game__row--winner' : '') + '">' +
        '<span class="sports-game__team">' + escapeHtml(g.aAbbr) + '</span>' +
        '<span class="sports-game__score">' + escapeHtml(g.aScore) + '</span>' +
      '</div>';
      var homeRow = '<div class="sports-game__row' + (g.hWinner ? ' sports-game__row--winner' : '') + '">' +
        '<span class="sports-game__team">' + escapeHtml(g.hAbbr) + '</span>' +
        '<span class="sports-game__score">' + escapeHtml(g.hScore) + '</span>' +
      '</div>';

      return '<article class="sports-game sports-game--' + statusClass + (g.hot ? ' sports-game--hot' : '') + '">' +
        '<div class="sports-game__meta"><span class="sports-game__status">' + escapeHtml(statusLabel) + '</span>' + hotBadge + '</div>' +
        awayRow + homeRow +
      '</article>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderError(tile) {
    var body = tile.querySelector('.sports-tile__body');
    if (!body) return;
    body.dataset.state = 'error';
    body.innerHTML = '<p class="sports-tile__loading">tap board →</p>';
  }

  function fetchLeague(tile) {
    var path = tile.getAttribute('data-path');
    var league = tile.getAttribute('data-league');
    if (!path || !league) return;

    var cached = readCache(league);
    if (cached) { renderGames(tile, cached); return; }

    var url = 'https://site.api.espn.com/apis/site/v2/sports/' + path + '/scoreboard';
    fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.events) { renderError(tile); return; }
        var games = data.events.map(fmtGame).filter(function (g) { return g; });
        writeCache(league, games);
        renderGames(tile, games);
      })
      .catch(function () { renderError(tile); });
  }

  Array.prototype.forEach.call(grid.querySelectorAll('.sports-tile'), fetchLeague);
})();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/SportsStrip.astro", void 0);

const $$SportsDeskStrip = createComponent(async ($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  const now = /* @__PURE__ */ new Date();
  const fullMoon = nextFullMoon(now);
  const hoursToMoon = hoursToNextFullMoon(now);
  const daysToMoon = Math.floor(hoursToMoon / 24);
  const moonName = namedMoonForDate(fullMoon);
  const btlBlocks = (await getCollection(
    "blocks",
    ({ data }) => !data.draft && data.channel === "BTL" && data.type === "READ"
  )).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const latest = btlBlocks[0] ?? null;
  const trilogyIds = ["0411", "0422", "0434"];
  const trilogy = trilogyIds.map((id) => btlBlocks.find((b) => b.data.id === id)).filter(Boolean);
  function shortDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Los_Angeles"
    }).format(date);
  }
  return renderTemplate`${latest && renderTemplate`${maybeRenderHead()}<aside class="sds" aria-labelledby="sds-title"${addAttribute(`--btl: ${ch.color600}; --btl-dark: ${ch.color800}; --btl-soft: ${ch.color50};`, "style")} data-astro-cid-c4xemeeh><div class="sds__head" data-astro-cid-c4xemeeh><p class="sds__kicker mono" data-astro-cid-c4xemeeh>CH.BTL · SPORTS DESK · CADENCE</p><h2 class="sds__title" id="sds-title" data-astro-cid-c4xemeeh>
The desk shows up on a schedule.
</h2><p class="sds__strap" data-astro-cid-c4xemeeh>
Three beats so far. Next one lands Thursday. The Bowl path now has a structural surface
        to point at when the table tightens.
</p></div><a class="sds__latest"${addAttribute(`/b/${latest.data.id}`, "href")}${addAttribute(`Latest beat: ${latest.data.title}`, "aria-label")} data-astro-cid-c4xemeeh><span class="sds__latest-noun" aria-hidden="true" data-astro-cid-c4xemeeh><img${addAttribute(`https://noun.pics/${latest.data.noun ?? Number(latest.data.id)}.svg`, "src")} alt="" width="44" height="44" loading="lazy" style="image-rendering: pixelated;" onerror="this.style.visibility='hidden'" data-astro-cid-c4xemeeh></span><span class="sds__latest-copy" data-astro-cid-c4xemeeh><span class="sds__latest-meta mono" data-astro-cid-c4xemeeh><span class="sds__latest-tag" data-astro-cid-c4xemeeh>${latest.data.id}</span><span class="sds__latest-date" data-astro-cid-c4xemeeh>${shortDate(latest.data.timestamp)}</span><span class="sds__latest-pill" data-astro-cid-c4xemeeh>LATEST</span></span><strong class="sds__latest-title" data-astro-cid-c4xemeeh>${latest.data.title}</strong><span class="sds__latest-dek" data-astro-cid-c4xemeeh>${latest.data.dek}</span></span></a><ol class="sds__trilogy" aria-label="Sports Desk trilogy" data-astro-cid-c4xemeeh>${trilogy.map((b, i) => renderTemplate`<li${addAttribute(`sds__beat ${i === trilogy.length - 1 ? "sds__beat--current" : ""}`, "class")} data-astro-cid-c4xemeeh><a${addAttribute(`/b/${b.data.id}`, "href")} data-astro-cid-c4xemeeh><span class="sds__beat-tag mono" data-astro-cid-c4xemeeh>${b.data.id}</span><span class="sds__beat-day mono" data-astro-cid-c4xemeeh>${shortDate(b.data.timestamp)}</span><span class="sds__beat-title" data-astro-cid-c4xemeeh>${b.data.title.split("—")[0].trim()}</span></a></li>`)}<li class="sds__beat sds__beat--next" data-astro-cid-c4xemeeh><span data-astro-cid-c4xemeeh><span class="sds__beat-tag mono" data-astro-cid-c4xemeeh>——</span><span class="sds__beat-day mono" data-astro-cid-c4xemeeh>Thu May 7</span><span class="sds__beat-title" data-astro-cid-c4xemeeh>Next beat · Bowl-path scoreboard if the table has tightened</span></span></li></ol><nav class="sds__paths mono" aria-label="Battler fast paths" data-astro-cid-c4xemeeh><a href="/nouns-nation-battler-bowl/" class="sds__path sds__path--primary" data-astro-cid-c4xemeeh>▸ Bowl path</a><a href="/nouns-nation-battler-moon/" class="sds__path sds__path--moon" data-astro-cid-c4xemeeh>
🌕 ${moonName} Cup ·
${daysToMoon > 0 ? ` ${daysToMoon}d` : hoursToMoon > 0 ? ` ${Math.round(hoursToMoon)}h` : " tonight"}</a><a href="/nouns-nation-battler/" data-astro-cid-c4xemeeh>Battle Desk</a><a href="/nouns-nation-battler-v3/" data-astro-cid-c4xemeeh>V3</a><a href="/c/battler/" data-astro-cid-c4xemeeh>CH.BTL</a></nav></aside>`}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/SportsDeskStrip.astro", void 0);

var __freeze$6 = Object.freeze;
var __defProp$6 = Object.defineProperty;
var __template$6 = (cooked, raw) => __freeze$6(__defProp$6(cooked, "raw", { value: __freeze$6(cooked.slice()) }));
var _a$6;
const $$LASportsTicker = createComponent(($$result, $$props, $$slots) => {
  const TEAMS = [
    { id: "dodgers", name: "DODGERS", emoji: "⚾", league: "mlb", path: "baseball/mlb", tid: "19", color: "#005A9C", siteSlug: "lad" },
    { id: "lakers", name: "LAKERS", emoji: "🏀", league: "nba", path: "basketball/nba", tid: "13", color: "#552583", siteSlug: "lal" },
    { id: "kings", name: "KINGS", emoji: "🏒", league: "nhl", path: "hockey/nhl", tid: "8", color: "#111111", siteSlug: "la" },
    { id: "chargers", name: "CHARGERS", emoji: "🏈", league: "nfl", path: "football/nfl", tid: "24", color: "#0080C6", siteSlug: "lac" },
    { id: "galaxy", name: "GALAXY", emoji: "⚽", league: "mls", path: "soccer/usa.1", tid: "187", color: "#00245D", siteSlug: "la" }
  ];
  return renderTemplate(_a$6 || (_a$6 = __template$6(["", '<aside class="la-ticker" aria-label="LA sports ticker"> <header class="la-ticker__head"> <p class="la-ticker__kicker mono">LA SPORTS · TICKER · 25 MILE RADIUS</p> <span class="la-ticker__updated mono" data-la-ticker-updated hidden></span> </header> <ol class="la-ticker__list"> ', " </ol> </aside> <script>\n(function () {\n  'use strict';\n  var root = document.querySelector('aside.la-ticker');\n  if (!root) return;\n  var rows = root.querySelectorAll('.la-ticker__row');\n  if (!rows.length) return;\n\n  var CACHE_PREFIX = 'pc:la-ticker:v1:';\n  var TTL_MS = 10 * 60 * 1000;\n\n  function readCache(k) {\n    try {\n      var raw = sessionStorage.getItem(CACHE_PREFIX + k);\n      if (!raw) return null;\n      var p = JSON.parse(raw);\n      if (!p || !p.at || (Date.now() - p.at) > TTL_MS) return null;\n      return p.data;\n    } catch (e) { return null; }\n  }\n  function writeCache(k, d) {\n    try { sessionStorage.setItem(CACHE_PREFIX + k, JSON.stringify({ at: Date.now(), data: d })); } catch (e) {}\n  }\n  function fmtTime(iso) {\n    if (!iso) return '';\n    try {\n      var d = new Date(iso);\n      return new Intl.DateTimeFormat('en-US', {\n        weekday: 'short', hour: 'numeric', minute: '2-digit',\n        timeZone: 'America/Los_Angeles', timeZoneName: 'short',\n      }).format(d);\n    } catch (e) { return ''; }\n  }\n  function shortDate(iso) {\n    if (!iso) return '';\n    try {\n      var d = new Date(iso);\n      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }).format(d);\n    } catch (e) { return ''; }\n  }\n  function safeAbbr(team, fallback) {\n    if (!team) return fallback;\n    return team.abbreviation || team.shortDisplayName || team.displayName || fallback;\n  }\n\n  function describe(event, ourTid) {\n    if (!event) return null;\n    var comp = event.competitions && event.competitions[0];\n    if (!comp) return null;\n    var competitors = comp.competitors || [];\n    var us, them, isHome;\n    competitors.forEach(function (c) {\n      var tid = (c.team && (c.team.id || c.id)) ? String(c.team.id || c.id) : '';\n      if (tid === String(ourTid)) { us = c; isHome = c.homeAway === 'home'; }\n      else { them = c; }\n    });\n    if (!us || !them) return null;\n    var status = (comp.status && comp.status.type && comp.status.type.state) || (event.status && event.status.type && event.status.type.state) || 'pre';\n    var shortDetail = (comp.status && comp.status.type && comp.status.type.shortDetail) ||\n                      (event.status && event.status.type && event.status.type.shortDetail) || '';\n    function readScore(s) {\n      if (s == null) return '';\n      if (typeof s === 'object') return s.displayValue != null ? String(s.displayValue) : (s.value != null ? String(s.value) : '');\n      return String(s);\n    }\n    var usScore = readScore(us.score);\n    var themScore = readScore(them.score);\n    var themAbbr = safeAbbr(them.team, '—');\n    var hot = false;\n    var us_n = parseInt(usScore, 10), th_n = parseInt(themScore, 10);\n    if (isFinite(us_n) && isFinite(th_n)) {\n      var diff = Math.abs(us_n - th_n);\n      var dl = (shortDetail || '').toLowerCase();\n      if (/ot|extra|shootout|penalt|so|et/.test(dl)) hot = true;\n      else if (status === 'post' && diff <= 3) hot = true;\n      else if (status === 'in' && diff <= 2) hot = true;\n    }\n    var won = us.winner === true;\n    var lost = them.winner === true;\n\n    var line = '';\n    if (status === 'post') {\n      var verdict = won ? 'W' : (lost ? 'L' : '·');\n      line = verdict + ' ' + usScore + '-' + themScore + ' ' + (isHome ? 'vs' : '@') + ' ' + themAbbr + ' · Final';\n      if (/ot|extra|shootout|so/.test((shortDetail || '').toLowerCase())) {\n        line = line.replace('· Final', '· ' + shortDetail);\n      }\n    } else if (status === 'in') {\n      line = usScore + '-' + themScore + ' ' + (isHome ? 'vs' : '@') + ' ' + themAbbr + ' · ' + (shortDetail || 'LIVE');\n    } else {\n      // pre\n      var when = event.date || (comp && comp.date);\n      var t = fmtTime(when);\n      line = (isHome ? 'vs ' : '@ ') + themAbbr + (t ? ' · ' + t : '');\n    }\n    return { status: status, hot: hot, line: line };\n  }\n\n  function renderRow(row, info, errorMsg) {\n    var lineEl = row.querySelector('[data-la-line]');\n    if (!lineEl) return;\n    row.classList.remove('la-ticker__row--live', 'la-ticker__row--final', 'la-ticker__row--pre', 'la-ticker__row--hot', 'la-ticker__row--idle');\n    if (errorMsg) {\n      row.classList.add('la-ticker__row--idle');\n      lineEl.textContent = errorMsg;\n      return;\n    }\n    if (!info) {\n      row.classList.add('la-ticker__row--idle');\n      lineEl.textContent = 'no scheduled match';\n      return;\n    }\n    if (info.status === 'in') row.classList.add('la-ticker__row--live');\n    else if (info.status === 'post') row.classList.add('la-ticker__row--final');\n    else row.classList.add('la-ticker__row--pre');\n    if (info.hot) row.classList.add('la-ticker__row--hot');\n    lineEl.textContent = info.line + (info.hot ? '  ⚡' : '');\n  }\n\n  function pickEvent(team, ourTid) {\n    if (!team) return null;\n    var pool = [];\n    if (team.nextEvent) pool = pool.concat(team.nextEvent);\n    if (team.previousEvent) pool = pool.concat(team.previousEvent);\n    var picked = null;\n    pool.forEach(function (ev) {\n      var d = describe(ev, ourTid);\n      if (!d) return;\n      if (!picked) { picked = { d: d, ev: ev }; return; }\n      // Prefer in > post > pre.\n      var order = { in: 3, post: 2, pre: 1 };\n      if ((order[d.status] || 0) > (order[picked.d.status] || 0)) picked = { d: d, ev: ev };\n    });\n    return picked ? picked.d : null;\n  }\n\n  function loadRow(row) {\n    var path = row.dataset.path;\n    var tid = row.dataset.tid;\n    var team = row.dataset.team;\n    if (!path || !tid || !team) return;\n    var cached = readCache(team);\n    if (cached) { renderRow(row, cached); return; }\n\n    var url = 'https://site.api.espn.com/apis/site/v2/sports/' + path + '/teams/' + tid;\n    fetch(url, { cache: 'no-store' })\n      .then(function (r) { return r.ok ? r.json() : null; })\n      .then(function (data) {\n        var info = pickEvent(data && data.team, tid);\n        writeCache(team, info);\n        renderRow(row, info);\n      })\n      .catch(function () { renderRow(row, null, 'check ESPN'); });\n  }\n\n  function init() {\n    rows.forEach(function (row) { loadRow(row); });\n    var stamp = root.querySelector('[data-la-ticker-updated]');\n    if (stamp) {\n      try {\n        stamp.textContent = 'updated ' + new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }).format(new Date());\n        stamp.hidden = false;\n      } catch (e) {}\n    }\n  }\n\n  try { init(); } catch (e) {}\n  document.addEventListener('astro:page-load', function () { try { init(); } catch (e) {} });\n})();\n<\/script>"])), maybeRenderHead(), TEAMS.map((t) => renderTemplate`<li class="la-ticker__row"${addAttribute(t.id, "data-team")}${addAttribute(t.path, "data-path")}${addAttribute(t.tid, "data-tid")}${addAttribute(t.league, "data-league")}${addAttribute(`--team-color: ${t.color}`, "style")}> <span class="la-ticker__chip" aria-hidden="true">${t.emoji}</span> <span class="la-ticker__name mono">${t.name}</span> <span class="la-ticker__line" data-la-line>loading…</span> <a class="la-ticker__link mono"${addAttribute(`https://www.espn.com/${t.league}/team/_/name/${t.siteSlug}`, "href")} target="_blank" rel="noopener"${addAttribute(`${t.name} on ESPN`, "aria-label")}>→</a> </li>`));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/LASportsTicker.astro", void 0);

var __freeze$5 = Object.freeze;
var __defProp$5 = Object.defineProperty;
var __template$5 = (cooked, raw) => __freeze$5(__defProp$5(cooked, "raw", { value: __freeze$5(raw || cooked.slice()) }));
var _a$5;
const $$AgentLedger = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$AgentLedger;
  function findRepoRoot() {
    const here = path.dirname(fileURLToPath(import.meta.url));
    let dir = here;
    for (let i = 0; i < 8; i++) {
      if (existsSync(path.join(dir, ".git"))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return process.cwd();
  }
  const REPO_ROOT = findRepoRoot();
  const AGENT_STYLE = {
    codex: { label: "Codex", bg: "#1e293b", fg: "#67e8f9" },
    manus: { label: "Manus", bg: "#3b1219", fg: "#fbbf24" },
    claude: { label: "Claude", bg: "#4c1d95", fg: "#e9d5ff" },
    mike: { label: "Mike", bg: "#1b2818", fg: "#bbf7d0" }
  };
  function relTime(iso) {
    const now = Date.now();
    const t = new Date(iso).getTime();
    const delta = Math.max(0, Math.floor((now - t) / 1e3));
    if (delta < 60) return `${delta}s ago`;
    if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
    if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
    if (delta < 86400 * 7) return `${Math.floor(delta / 86400)}d ago`;
    return new Date(iso).toISOString().slice(0, 10);
  }
  function attribute(email, subject, body) {
    const e = (email || "").toLowerCase();
    const s = subject || "";
    const b = (body || "").toLowerCase();
    if (e.includes("codex") || s.startsWith("[codex]")) return "codex";
    if (e.includes("manus") || s.startsWith("[manus]")) return "manus";
    if (b.includes("co-authored-by: claude") || b.includes("noreply@anthropic.com")) return "claude";
    return "mike";
  }
  let entries = [];
  try {
    const raw = execSync(
      'git log -n 8 --pretty=format:"%H%x1f%cI%x1f%ae%x1f%s%x1f%b%x1e"',
      { cwd: REPO_ROOT, encoding: "utf8" }
    );
    entries = raw.split("").map((chunk) => chunk.trim()).filter(Boolean).map((chunk) => {
      const [sha = "", iso = "", email = "", subject = "", body = ""] = chunk.split("");
      const agent = attribute(email, subject, body);
      const cleanSubject = subject.replace(/^\[[a-z]+\]\s*/i, "").replace(/\s*\(#\d+\)\s*$/, "").trim();
      return {
        sha: sha.slice(0, 7),
        iso,
        when: relTime(iso),
        agent,
        label: AGENT_STYLE[agent].label,
        subject: cleanSubject.length > 58 ? cleanSubject.slice(0, 55) + "…" : cleanSubject
      };
    }).slice(0, 5);
  } catch (e) {
    entries = [];
  }
  return renderTemplate(_a$5 || (_a$5 = __template$5(["", `<script>
  // Sprint 22 (Mike 2026-04-24 Fri morning): "refresh this and have it
  // timely, changing based on time of day, number of visits, etc."
  //
  // Two jobs:
  //   1. Re-render rel-time strings from the <time datetime> source so
  //      "33m ago" keeps ticking forward without a site rebuild. The
  //      build-time \`e.when\` was stale the moment the page cached.
  //   2. On first paint, hydrate the ledger from /api/wire-events so
  //      any commits that landed AFTER the last deploy get surfaced
  //      here — using the Sprint 18 MCP endpoint to do the work.
  (function () {
    'use strict';

    var $list = document.getElementById('agent-ledger-list');
    if (!$list) return;

    var AGENT_CLASS = { codex: 'al--codex', manus: 'al--manus', claude: 'al--claude', mike: 'al--mike' };
    var AGENT_LABEL = { codex: 'Codex', manus: 'Manus', claude: 'Claude', mike: 'Mike' };

    function relTime(iso) {
      var t = new Date(iso).getTime();
      if (!isFinite(t)) return '';
      var d = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (d < 60)            return d + 's ago';
      if (d < 3600)          return Math.floor(d / 60) + 'm ago';
      if (d < 86400)         return Math.floor(d / 3600) + 'h ago';
      if (d < 86400 * 7)     return Math.floor(d / 86400) + 'd ago';
      return new Date(iso).toISOString().slice(0, 10);
    }

    function updateRelTimes() {
      var rows = $list.querySelectorAll('li[data-iso]');
      rows.forEach(function (row) {
        var iso = row.getAttribute('data-iso');
        if (!iso) return;
        var t = row.querySelector('.al__when');
        if (t) t.textContent = relTime(iso);
      });
    }

    // Rebuild the ledger from a fresh wire-events payload. Keeps the
    // Mike/Manus attribution cheap — the server already mapped agent
    // by email + trailer — we just remap to our 4-agent set.
    function remapAgent(a) {
      if (a === 'codex' || a === 'manus' || a === 'claude' || a === 'mike') return a;
      return 'claude'; // safest fallback; 'block' events don't render here
    }

    function cleanSubject(s) {
      return String(s || '').replace(/^\\[[a-z]+\\]\\s*/i, '').replace(/\\s*\\(#\\d+\\)\\s*$/, '').trim();
    }

    function escapeHTML(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
      });
    }

    async function hydrateFromWire() {
      try {
        var res = await fetch('/api/wire-events?kind=commit&limit=5', {
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) return;
        var data = await res.json();
        var events = (data && Array.isArray(data.events)) ? data.events : [];
        if (!events.length) return;
        var html = events.slice(0, 5).map(function (e) {
          var agent = remapAgent(e.agent);
          var cls = AGENT_CLASS[agent];
          var subject = cleanSubject(e.subject);
          if (subject.length > 58) subject = subject.slice(0, 55) + '…';
          return '<li class="al ' + cls + '" data-iso="' + escapeHTML(e.at) + '">' +
            '<span class="al__agent">' + escapeHTML(AGENT_LABEL[agent]) + '</span>' +
            '<span class="al__subject" title="' + escapeHTML(subject) + '">' + escapeHTML(subject) + '</span>' +
            '<time class="al__when" datetime="' + escapeHTML(e.at) + '">' + escapeHTML(relTime(e.at)) + '</time>' +
          '</li>';
        }).join('');
        $list.innerHTML = html;
      } catch (e) {
        // Silent fail — build-time render stays.
      }
    }

    // Run now + every 60s so the "2m ago" row ticks to "3m ago" while
    // the tab is open.
    updateRelTimes();
    setInterval(updateRelTimes, 60_000);

    // One-shot live hydrate on page load. Cheap — /api/wire-events has
    // a 15s CDN cache, graceful no-op if the endpoint is unreachable.
    if (typeof fetch === 'function') hydrateFromWire();
  })();
<\/script><!-- Sprint 29 (Mike 2026-04-24 screenshot bug "Claudefeat(race):...22m ago"):
     the AgentLedger client script rebuilds rows via innerHTML when it
     hydrates from /api/wire-events. Those rebuilt elements don't carry
     Astro's scoped-CSS data-astro-cid-* attributes, so the scoped
     styles below didn't match and the grid template collapsed. All
     ledger classes are already namespaced with .agent-ledger or .al
     so going global is safe. -->`], ["", `<script>
  // Sprint 22 (Mike 2026-04-24 Fri morning): "refresh this and have it
  // timely, changing based on time of day, number of visits, etc."
  //
  // Two jobs:
  //   1. Re-render rel-time strings from the <time datetime> source so
  //      "33m ago" keeps ticking forward without a site rebuild. The
  //      build-time \\\`e.when\\\` was stale the moment the page cached.
  //   2. On first paint, hydrate the ledger from /api/wire-events so
  //      any commits that landed AFTER the last deploy get surfaced
  //      here — using the Sprint 18 MCP endpoint to do the work.
  (function () {
    'use strict';

    var $list = document.getElementById('agent-ledger-list');
    if (!$list) return;

    var AGENT_CLASS = { codex: 'al--codex', manus: 'al--manus', claude: 'al--claude', mike: 'al--mike' };
    var AGENT_LABEL = { codex: 'Codex', manus: 'Manus', claude: 'Claude', mike: 'Mike' };

    function relTime(iso) {
      var t = new Date(iso).getTime();
      if (!isFinite(t)) return '';
      var d = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (d < 60)            return d + 's ago';
      if (d < 3600)          return Math.floor(d / 60) + 'm ago';
      if (d < 86400)         return Math.floor(d / 3600) + 'h ago';
      if (d < 86400 * 7)     return Math.floor(d / 86400) + 'd ago';
      return new Date(iso).toISOString().slice(0, 10);
    }

    function updateRelTimes() {
      var rows = $list.querySelectorAll('li[data-iso]');
      rows.forEach(function (row) {
        var iso = row.getAttribute('data-iso');
        if (!iso) return;
        var t = row.querySelector('.al__when');
        if (t) t.textContent = relTime(iso);
      });
    }

    // Rebuild the ledger from a fresh wire-events payload. Keeps the
    // Mike/Manus attribution cheap — the server already mapped agent
    // by email + trailer — we just remap to our 4-agent set.
    function remapAgent(a) {
      if (a === 'codex' || a === 'manus' || a === 'claude' || a === 'mike') return a;
      return 'claude'; // safest fallback; 'block' events don't render here
    }

    function cleanSubject(s) {
      return String(s || '').replace(/^\\\\[[a-z]+\\\\]\\\\s*/i, '').replace(/\\\\s*\\\\(#\\\\d+\\\\)\\\\s*$/, '').trim();
    }

    function escapeHTML(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
      });
    }

    async function hydrateFromWire() {
      try {
        var res = await fetch('/api/wire-events?kind=commit&limit=5', {
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) return;
        var data = await res.json();
        var events = (data && Array.isArray(data.events)) ? data.events : [];
        if (!events.length) return;
        var html = events.slice(0, 5).map(function (e) {
          var agent = remapAgent(e.agent);
          var cls = AGENT_CLASS[agent];
          var subject = cleanSubject(e.subject);
          if (subject.length > 58) subject = subject.slice(0, 55) + '…';
          return '<li class="al ' + cls + '" data-iso="' + escapeHTML(e.at) + '">' +
            '<span class="al__agent">' + escapeHTML(AGENT_LABEL[agent]) + '</span>' +
            '<span class="al__subject" title="' + escapeHTML(subject) + '">' + escapeHTML(subject) + '</span>' +
            '<time class="al__when" datetime="' + escapeHTML(e.at) + '">' + escapeHTML(relTime(e.at)) + '</time>' +
          '</li>';
        }).join('');
        $list.innerHTML = html;
      } catch (e) {
        // Silent fail — build-time render stays.
      }
    }

    // Run now + every 60s so the "2m ago" row ticks to "3m ago" while
    // the tab is open.
    updateRelTimes();
    setInterval(updateRelTimes, 60_000);

    // One-shot live hydrate on page load. Cheap — /api/wire-events has
    // a 15s CDN cache, graceful no-op if the endpoint is unreachable.
    if (typeof fetch === 'function') hydrateFromWire();
  })();
<\/script><!-- Sprint 29 (Mike 2026-04-24 screenshot bug "Claudefeat(race):...22m ago"):
     the AgentLedger client script rebuilds rows via innerHTML when it
     hydrates from /api/wire-events. Those rebuilt elements don't carry
     Astro's scoped-CSS data-astro-cid-* attributes, so the scoped
     styles below didn't match and the grid template collapsed. All
     ledger classes are already namespaced with .agent-ledger or .al
     so going global is safe. -->`])), entries.length > 0 && renderTemplate`${maybeRenderHead()}<aside class="agent-ledger" aria-label="Latest multi-agent commits" id="agent-ledger"><p class="agent-ledger__label">LEDGER · LAST 5 SHIPS</p><ol class="agent-ledger__list" id="agent-ledger-list">${entries.map((e) => renderTemplate`<li${addAttribute(`al al--${e.agent}`, "class")}${addAttribute(e.iso, "data-iso")}><span class="al__agent">${e.label}</span><span class="al__subject"${addAttribute(e.subject, "title")}>${e.subject}</span><time class="al__when"${addAttribute(e.iso, "datetime")}>${e.when}</time></li>`)}</ol><a class="agent-ledger__more" href="/status">full ledger /status →</a></aside>`);
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/AgentLedger.astro", void 0);

var __freeze$4 = Object.freeze;
var __defProp$4 = Object.defineProperty;
var __template$4 = (cooked, raw) => __freeze$4(__defProp$4(cooked, "raw", { value: __freeze$4(raw || cooked.slice()) }));
var _a$4;
const $$HomeFireplace = createComponent(($$result, $$props, $$slots) => {
  function dailyNounId() {
    const day = Math.floor(Date.now() / (24 * 3600 * 1e3));
    const seed = day * 2654435761 >>> 0;
    return seed % 1200;
  }
  const nounId = dailyNounId();
  const nounUrl = `https://noun.pics/${nounId}.svg`;
  return renderTemplate(_a$4 || (_a$4 = __template$4(["", '<aside class="hearth" aria-label="Evening hearth — cozy companion to the Gamgee release" data-astro-cid-6r7ebifp> <div class="hearth__grain" aria-hidden="true" data-astro-cid-6r7ebifp></div> <div class="hearth__glow" aria-hidden="true" data-astro-cid-6r7ebifp></div> <div class="hearth__smoke" aria-hidden="true" data-astro-cid-6r7ebifp> <span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span> </div> <div class="hearth__embers" aria-hidden="true" data-astro-cid-6r7ebifp> <span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span> <span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span> </div> <div class="hearth__pixel-fireplace" aria-hidden="true" data-astro-cid-6r7ebifp> <span class="pixel-fireplace__brick pixel-fireplace__brick--top" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__brick pixel-fireplace__brick--left" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__brick pixel-fireplace__brick--right" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__mantel" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__log pixel-fireplace__log--a" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__log pixel-fireplace__log--b" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__flame pixel-fireplace__flame--outer" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__flame pixel-fireplace__flame--mid" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__flame pixel-fireplace__flame--core" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__coal pixel-fireplace__coal--a" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__coal pixel-fireplace__coal--b" data-astro-cid-6r7ebifp></span> </div> <div class="hearth__body" data-astro-cid-6r7ebifp> <figure class="hearth__noun" data-astro-cid-6r7ebifp> <span class="hearth__noun-ring" aria-hidden="true" data-astro-cid-6r7ebifp></span> <img class="hearth__noun-img"', "", ' width="72" height="72" loading="eager" data-astro-cid-6r7ebifp> <figcaption class="hearth__noun-cap mono" data-astro-cid-6r7ebifp>NOUN ', `</figcaption> </figure> <div class="hearth__copy" data-astro-cid-6r7ebifp> <p class="hearth__kicker mono" data-astro-cid-6r7ebifp> <span class="hearth__dot" data-astro-cid-6r7ebifp></span> <span id="hearth-mood" data-astro-cid-6r7ebifp>EVENING · EL SEGUNDO</span> <span class="hearth__sep" aria-hidden="true" data-astro-cid-6r7ebifp>·</span> <span class="hearth__keep" data-astro-cid-6r7ebifp>KEEP GOING</span> </p> <h2 class="hearth__line" data-astro-cid-6r7ebifp> <span class="hearth__sub" id="hearth-sub" data-astro-cid-6r7ebifp>Pull up a chair.</span> <span class="hearth__main" id="hearth-main" data-astro-cid-6r7ebifp>The kettle's on. The marine layer's in.</span> </h2> <p class="hearth__meta mono" data-astro-cid-6r7ebifp> <span data-astro-cid-6r7ebifp>HOSTING TONIGHT · <span id="hearth-noun-ref" data-astro-cid-6r7ebifp>Noun `, `</span></span> <span class="hearth__sep" aria-hidden="true" data-astro-cid-6r7ebifp>·</span> <span data-astro-cid-6r7ebifp>GAMGEE RC0</span> </p> </div> <div class="hearth__cta" data-astro-cid-6r7ebifp> <a href="/gandalf" class="hearth__link" data-astro-cid-6r7ebifp> <span class="hearth__link-glyph" aria-hidden="true" data-astro-cid-6r7ebifp> <span class="hearth__mini-fire" data-astro-cid-6r7ebifp></span> </span> <span class="hearth__link-label mono" data-astro-cid-6r7ebifp>SIT A WHILE <span class="hearth__arrow" data-astro-cid-6r7ebifp>→</span></span> <span class="hearth__link-sub" data-astro-cid-6r7ebifp>/gandalf · /tonight · /meditate</span> </a> </div> </div> </aside> <script>
  (function () {
    'use strict';
    var $mood = document.getElementById('hearth-mood');
    var $sub  = document.getElementById('hearth-sub');
    var $main = document.getElementById('hearth-main');
    if (!$mood || !$sub || !$main) return;

    // Bucketed copy — each time-of-day band carries its own set of
    // coherent lines. Previous version keyed off \`hour % COPY.length\`
    // which would show evening-jasmine copy at 09:00 etc. (Mike caught
    // this on 2026-04-24 Fri morning: "El Segundo's cool tonight" was
    // displaying next to "MORNING LIGHT · 09:00 PT".) Now the same
    // intensity that drives the kicker also picks from its bucket.
    var COPY_BY_BUCKET = {
      smallhours: [
        { sub: 'Walk slow.',       main: 'The city is forty blocks wide and half asleep.' },
        { sub: 'Hold still.',      main: "The jasmine isn't lying — it's just been holding this note since eleven." },
        { sub: 'Keep going.',      main: 'A night build is a slow garden. Something blooms before dawn.' },
      ],
      morning: [
        { sub: 'Start gentle.',    main: 'The coffee finds its own cadence here.' },
        { sub: 'Low and forward.', main: 'Marine layer still holding past Dockweiler. The boulevards are soft.' },
        { sub: 'Open a window.',   main: 'The air is salt-fresh; you can taste it before you see the water.' },
        { sub: 'Begin small.',     main: 'A garden is slow on purpose. So is a morning.' },
      ],
      midday: [
        { sub: 'Keep the pace.',   main: 'Midday on the Strand is quieter than you remember.' },
        { sub: 'Stay loose.',      main: 'The sun is direct; the work is patient.' },
        { sub: 'Ship a thing.',    main: 'Small hands change the course because the great have other things to do.' },
        { sub: 'Walk the block.',  main: 'Main Street at one pm has a particular honesty to it.' },
      ],
      golden: [
        { sub: 'Look west.',       main: 'The light goes copper for about twelve minutes.' },
        { sub: 'Slow the turn.',   main: "Golden hour is shorter than you'd like, which is the point." },
        { sub: 'Walk toward it.',  main: 'Vista del Mar becomes a reason to be outside.' },
      ],
      blue: [
        { sub: 'Settle in.',       main: 'Blue hour lasts longer at the coast. Let it.' },
        { sub: 'Ease off.',        main: 'The boulevards are a different city after nine.' },
        { sub: 'Hold the light.',  main: "The sky hasn't decided to be dark yet. Neither have you." },
      ],
      evening: [
        { sub: 'Pull up a chair.', main: "The kettle's on. The marine layer's in." },
        { sub: 'Stoke the fire.',  main: "El Segundo's cool tonight. The jasmine is lying." },
        { sub: 'Breathe through.', main: 'The Strand is empty past the lifeguard tower. Come sit.' },
        { sub: 'Stay a while.',    main: 'The day ran long. The block still holds up.' },
      ],
    };

    // Day-index seed so everyone viewing in the same hour+day reads
    // the same line, but the variant rotates across days. Prevents the
    // home page from looking pinned.
    function daySeededIndex(length, bucketSalt) {
      var day = Math.floor(Date.now() / (24 * 3600 * 1000));
      var hour = new Date().getHours();
      var mix = ((day * 131) ^ (hour * 17) ^ bucketSalt) >>> 0;
      return mix % length;
    }

    function updateMood() {
      var now = new Date();
      var h = now.getHours() + now.getMinutes() / 60;

      var label, intensity, bucket, salt;
      if (h < 6)        { label = 'SMALL HOURS · EL SEGUNDO'; intensity = 'evening'; bucket = 'smallhours'; salt = 1; }
      else if (h < 10)  { label = 'MORNING LIGHT · EL SEGUNDO'; intensity = 'day';   bucket = 'morning';    salt = 2; }
      else if (h < 15)  { label = 'MIDDAY · EL SEGUNDO';        intensity = 'day';   bucket = 'midday';     salt = 3; }
      else if (h < 18)  { label = 'GOLDEN HOUR · EL SEGUNDO';   intensity = 'golden';bucket = 'golden';     salt = 4; }
      else if (h < 21)  { label = 'BLUE HOUR · EL SEGUNDO';     intensity = 'evening';bucket = 'blue';      salt = 5; }
      else              { label = 'EVENING · EL SEGUNDO';       intensity = 'evening';bucket = 'evening';   salt = 6; }

      $mood.textContent = label;

      var hearth = document.querySelector('.hearth');
      if (hearth) {
        hearth.setAttribute('data-mood', intensity);
        hearth.setAttribute('data-bucket', bucket);
      }

      var lines = COPY_BY_BUCKET[bucket];
      var idx = daySeededIndex(lines.length, salt);
      $sub.textContent = lines[idx].sub;
      $main.textContent = lines[idx].main;
    }

    updateMood();
    setInterval(updateMood, 60 * 1000);
  })();
<\/script>`], ["", '<aside class="hearth" aria-label="Evening hearth — cozy companion to the Gamgee release" data-astro-cid-6r7ebifp> <div class="hearth__grain" aria-hidden="true" data-astro-cid-6r7ebifp></div> <div class="hearth__glow" aria-hidden="true" data-astro-cid-6r7ebifp></div> <div class="hearth__smoke" aria-hidden="true" data-astro-cid-6r7ebifp> <span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span> </div> <div class="hearth__embers" aria-hidden="true" data-astro-cid-6r7ebifp> <span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span> <span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span><span data-astro-cid-6r7ebifp></span> </div> <div class="hearth__pixel-fireplace" aria-hidden="true" data-astro-cid-6r7ebifp> <span class="pixel-fireplace__brick pixel-fireplace__brick--top" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__brick pixel-fireplace__brick--left" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__brick pixel-fireplace__brick--right" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__mantel" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__log pixel-fireplace__log--a" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__log pixel-fireplace__log--b" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__flame pixel-fireplace__flame--outer" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__flame pixel-fireplace__flame--mid" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__flame pixel-fireplace__flame--core" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__coal pixel-fireplace__coal--a" data-astro-cid-6r7ebifp></span> <span class="pixel-fireplace__coal pixel-fireplace__coal--b" data-astro-cid-6r7ebifp></span> </div> <div class="hearth__body" data-astro-cid-6r7ebifp> <figure class="hearth__noun" data-astro-cid-6r7ebifp> <span class="hearth__noun-ring" aria-hidden="true" data-astro-cid-6r7ebifp></span> <img class="hearth__noun-img"', "", ' width="72" height="72" loading="eager" data-astro-cid-6r7ebifp> <figcaption class="hearth__noun-cap mono" data-astro-cid-6r7ebifp>NOUN ', `</figcaption> </figure> <div class="hearth__copy" data-astro-cid-6r7ebifp> <p class="hearth__kicker mono" data-astro-cid-6r7ebifp> <span class="hearth__dot" data-astro-cid-6r7ebifp></span> <span id="hearth-mood" data-astro-cid-6r7ebifp>EVENING · EL SEGUNDO</span> <span class="hearth__sep" aria-hidden="true" data-astro-cid-6r7ebifp>·</span> <span class="hearth__keep" data-astro-cid-6r7ebifp>KEEP GOING</span> </p> <h2 class="hearth__line" data-astro-cid-6r7ebifp> <span class="hearth__sub" id="hearth-sub" data-astro-cid-6r7ebifp>Pull up a chair.</span> <span class="hearth__main" id="hearth-main" data-astro-cid-6r7ebifp>The kettle's on. The marine layer's in.</span> </h2> <p class="hearth__meta mono" data-astro-cid-6r7ebifp> <span data-astro-cid-6r7ebifp>HOSTING TONIGHT · <span id="hearth-noun-ref" data-astro-cid-6r7ebifp>Noun `, `</span></span> <span class="hearth__sep" aria-hidden="true" data-astro-cid-6r7ebifp>·</span> <span data-astro-cid-6r7ebifp>GAMGEE RC0</span> </p> </div> <div class="hearth__cta" data-astro-cid-6r7ebifp> <a href="/gandalf" class="hearth__link" data-astro-cid-6r7ebifp> <span class="hearth__link-glyph" aria-hidden="true" data-astro-cid-6r7ebifp> <span class="hearth__mini-fire" data-astro-cid-6r7ebifp></span> </span> <span class="hearth__link-label mono" data-astro-cid-6r7ebifp>SIT A WHILE <span class="hearth__arrow" data-astro-cid-6r7ebifp>→</span></span> <span class="hearth__link-sub" data-astro-cid-6r7ebifp>/gandalf · /tonight · /meditate</span> </a> </div> </div> </aside> <script>
  (function () {
    'use strict';
    var $mood = document.getElementById('hearth-mood');
    var $sub  = document.getElementById('hearth-sub');
    var $main = document.getElementById('hearth-main');
    if (!$mood || !$sub || !$main) return;

    // Bucketed copy — each time-of-day band carries its own set of
    // coherent lines. Previous version keyed off \\\`hour % COPY.length\\\`
    // which would show evening-jasmine copy at 09:00 etc. (Mike caught
    // this on 2026-04-24 Fri morning: "El Segundo's cool tonight" was
    // displaying next to "MORNING LIGHT · 09:00 PT".) Now the same
    // intensity that drives the kicker also picks from its bucket.
    var COPY_BY_BUCKET = {
      smallhours: [
        { sub: 'Walk slow.',       main: 'The city is forty blocks wide and half asleep.' },
        { sub: 'Hold still.',      main: "The jasmine isn't lying — it's just been holding this note since eleven." },
        { sub: 'Keep going.',      main: 'A night build is a slow garden. Something blooms before dawn.' },
      ],
      morning: [
        { sub: 'Start gentle.',    main: 'The coffee finds its own cadence here.' },
        { sub: 'Low and forward.', main: 'Marine layer still holding past Dockweiler. The boulevards are soft.' },
        { sub: 'Open a window.',   main: 'The air is salt-fresh; you can taste it before you see the water.' },
        { sub: 'Begin small.',     main: 'A garden is slow on purpose. So is a morning.' },
      ],
      midday: [
        { sub: 'Keep the pace.',   main: 'Midday on the Strand is quieter than you remember.' },
        { sub: 'Stay loose.',      main: 'The sun is direct; the work is patient.' },
        { sub: 'Ship a thing.',    main: 'Small hands change the course because the great have other things to do.' },
        { sub: 'Walk the block.',  main: 'Main Street at one pm has a particular honesty to it.' },
      ],
      golden: [
        { sub: 'Look west.',       main: 'The light goes copper for about twelve minutes.' },
        { sub: 'Slow the turn.',   main: "Golden hour is shorter than you'd like, which is the point." },
        { sub: 'Walk toward it.',  main: 'Vista del Mar becomes a reason to be outside.' },
      ],
      blue: [
        { sub: 'Settle in.',       main: 'Blue hour lasts longer at the coast. Let it.' },
        { sub: 'Ease off.',        main: 'The boulevards are a different city after nine.' },
        { sub: 'Hold the light.',  main: "The sky hasn't decided to be dark yet. Neither have you." },
      ],
      evening: [
        { sub: 'Pull up a chair.', main: "The kettle's on. The marine layer's in." },
        { sub: 'Stoke the fire.',  main: "El Segundo's cool tonight. The jasmine is lying." },
        { sub: 'Breathe through.', main: 'The Strand is empty past the lifeguard tower. Come sit.' },
        { sub: 'Stay a while.',    main: 'The day ran long. The block still holds up.' },
      ],
    };

    // Day-index seed so everyone viewing in the same hour+day reads
    // the same line, but the variant rotates across days. Prevents the
    // home page from looking pinned.
    function daySeededIndex(length, bucketSalt) {
      var day = Math.floor(Date.now() / (24 * 3600 * 1000));
      var hour = new Date().getHours();
      var mix = ((day * 131) ^ (hour * 17) ^ bucketSalt) >>> 0;
      return mix % length;
    }

    function updateMood() {
      var now = new Date();
      var h = now.getHours() + now.getMinutes() / 60;

      var label, intensity, bucket, salt;
      if (h < 6)        { label = 'SMALL HOURS · EL SEGUNDO'; intensity = 'evening'; bucket = 'smallhours'; salt = 1; }
      else if (h < 10)  { label = 'MORNING LIGHT · EL SEGUNDO'; intensity = 'day';   bucket = 'morning';    salt = 2; }
      else if (h < 15)  { label = 'MIDDAY · EL SEGUNDO';        intensity = 'day';   bucket = 'midday';     salt = 3; }
      else if (h < 18)  { label = 'GOLDEN HOUR · EL SEGUNDO';   intensity = 'golden';bucket = 'golden';     salt = 4; }
      else if (h < 21)  { label = 'BLUE HOUR · EL SEGUNDO';     intensity = 'evening';bucket = 'blue';      salt = 5; }
      else              { label = 'EVENING · EL SEGUNDO';       intensity = 'evening';bucket = 'evening';   salt = 6; }

      $mood.textContent = label;

      var hearth = document.querySelector('.hearth');
      if (hearth) {
        hearth.setAttribute('data-mood', intensity);
        hearth.setAttribute('data-bucket', bucket);
      }

      var lines = COPY_BY_BUCKET[bucket];
      var idx = daySeededIndex(lines.length, salt);
      $sub.textContent = lines[idx].sub;
      $main.textContent = lines[idx].main;
    }

    updateMood();
    setInterval(updateMood, 60 * 1000);
  })();
<\/script>`])), maybeRenderHead(), addAttribute(nounUrl, "src"), addAttribute(`Noun ${nounId} sitting by the hearth`, "alt"), nounId, nounId);
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/HomeFireplace.astro", void 0);

const $$AppLaunchStrip = createComponent(($$result, $$props, $$slots) => {
  const INTERNAL_ROOMS = [
    { slug: "observatory", name: "The Observatory", kicker: "CONSTELLATIONS · LOCAL STATE", channel: "CH.SKY", href: "/observatory", kind: "internal" },
    { slug: "cabinet", name: "The Cabinet", kicker: "LOCAL SHELF · RECEIPTS", channel: "CH.SHELF", href: "/cabinet", kind: "internal" },
    { slug: "signal-garden", name: "Signal Garden", kicker: "LOCAL ACTIVITY · GROWTH", channel: "CH.SIGNAL", href: "/signal-garden", kind: "internal" },
    { slug: "gallery-wall", name: "Gallery Wall", kicker: "CURATION · SHOW CARDS", channel: "CH.CURATE", href: "/gallery-wall", kind: "internal" },
    { slug: "ritual-clock", name: "Ritual Clock", kicker: "DAILY CADENCE · MARKS", channel: "CH.TIME", href: "/ritual-clock", kind: "internal" },
    { slug: "exchange-table", name: "Exchange Table", kicker: "WISHLIST · OFFERS", channel: "CH.SWAP", href: "/exchange-table", kind: "internal" },
    { slug: "provenance-ledger", name: "Provenance Ledger", kicker: "LOCAL PROOFS · EXPORTS", channel: "CH.PROOF", href: "/provenance-ledger", kind: "internal" },
    { slug: "world-atlas", name: "World Atlas", kicker: "LANDMARKS · GEMS · ROUTES", channel: "CH.WORLD", href: "/world-atlas", kind: "internal" },
    { slug: "mint-studio", name: "Mint Studio", kicker: "ART BRIEF · METADATA", channel: "CH.MINT", href: "/mint-studio", kind: "internal" },
    { slug: "harbor-log", name: "Harbor Log", kicker: "MORNING OCEAN · WATCHLIST", channel: "CH.OCEAN", href: "/harbor-log", kind: "internal" },
    { slug: "cat-passport", name: "Cat Passport", kicker: "ZEN CATS · GEMS · LANDMARKS", channel: "CH.CAT", href: "/cat-passport", kind: "internal" },
    { slug: "referral-garden", name: "Referral Garden", kicker: "INVITES · DISCLOSURE", channel: "CH.GROW", href: "/referral-garden", kind: "internal" },
    { slug: "sats-path", name: "Sats Path", kicker: "BITCOIN READINESS · MAP", channel: "CH.SATS", href: "/sats-path", kind: "internal" },
    { slug: "wire", name: "PointCast Wire", kicker: "LIVE TICKER · EVENTS", channel: "CH.FD", href: "/wire", kind: "internal" },
    { slug: "farm", name: "Sam’s Plot", kicker: "FARMING GAME · 9 TILES", channel: "CH.GDN", href: "/farm", kind: "internal" },
    { slug: "agent-derby", name: "Agent Derby", kicker: "DETERMINISTIC RACING · GAME", channel: "CH.BTL", href: "/agent-derby", kind: "internal" },
    { slug: "room", name: "Listening Room", kicker: "SPOTIFY COMPANION · CURSORS", channel: "CH.SPN", href: "/room", kind: "internal" },
    { slug: "talk", name: "Voice Dispatch", kicker: "RECORD A TALK · 10–60s", channel: "CH.FD", href: "/talk", kind: "internal" },
    { slug: "gandalf", name: "Sit With Gandalf", kicker: "WARM COMPANION · KEEPSAKE", channel: "CH.GDN", href: "/gandalf", kind: "internal" },
    { slug: "cast", name: "Prize Cast", kicker: "NO-LOSS · PENDING MINT", channel: "CH.FCT", href: "/cast", kind: "internal" },
    { slug: "drum", name: "DRUM", kicker: "SHARED DRUM MODULE", channel: "CH.SPN", href: "/drum", kind: "internal" },
    { slug: "now", name: "What’s Live", kicker: "TODAY ON POINTCAST", channel: "CH.FD", href: "/now", kind: "internal" }
  ];
  function daySeed() {
    const day = Math.floor(Date.now() / (24 * 3600 * 1e3));
    return day * 2654435761 >>> 0 || 1;
  }
  function pickN(items, n, seed2) {
    const out = items.slice();
    let s = seed2;
    for (let i = out.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor(s / 233280 * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out.slice(0, n);
  }
  const seed = daySeed();
  const pinnedRooms = INTERNAL_ROOMS.filter((room) => room.slug === "observatory" || room.slug === "cabinet");
  const rotatingRooms = INTERNAL_ROOMS.filter((room) => room.slug !== "observatory" && room.slug !== "cabinet");
  const internalPicks = [...pinnedRooms, ...pickN(rotatingRooms, 1, seed)];
  const satellites = POINTCAST_APPS.filter((a) => a.kind === "satellite").map((a) => ({
    slug: a.slug,
    name: a.name,
    kicker: a.kicker,
    channel: a.channel,
    href: a.path,
    kind: "external"
  }));
  const rooms = [...internalPicks, ...satellites];
  const liveCount = rooms.length;
  const numberWord = (n) => {
    if (n === 1) return "One";
    if (n === 2) return "Two";
    if (n === 3) return "Three";
    if (n === 4) return "Four";
    if (n === 5) return "Five";
    if (n === 6) return "Six";
    if (n === 7) return "Seven";
    return String(n);
  };
  const headline = `${numberWord(liveCount)} rooms are live right now.`;
  return renderTemplate`${maybeRenderHead()}<section class="app-strip" aria-labelledby="app-strip-title" data-astro-cid-7jzvvn5r> <div class="app-strip__head" data-astro-cid-7jzvvn5r> <p class="app-strip__kicker mono" data-astro-cid-7jzvvn5r>ROOMS · OPEN NOW · PICKED FOR TODAY</p> <h2 id="app-strip-title" data-astro-cid-7jzvvn5r>${headline}</h2> </div> <div class="app-strip__grid"${addAttribute(liveCount, "data-count")} data-astro-cid-7jzvvn5r> ${rooms.map((room) => renderTemplate`<a${addAttribute(`app-strip__item app-strip__item--${room.kind}`, "class")}${addAttribute(room.href, "href")} data-astro-cid-7jzvvn5r> <span class="app-strip__channel mono" data-astro-cid-7jzvvn5r> ${room.channel} <span class="app-strip__kindtag mono" data-astro-cid-7jzvvn5r>${room.kind === "external" ? "SATELLITE" : "POINTCAST"}</span> </span> <strong data-astro-cid-7jzvvn5r>${room.name}</strong> <span class="app-strip__kickerline" data-astro-cid-7jzvvn5r>${room.kicker}</span> </a>`)} <a class="app-strip__item app-strip__item--all" href="/apps" data-astro-cid-7jzvvn5r> <span class="app-strip__channel mono" data-astro-cid-7jzvvn5r>INDEX</span> <strong data-astro-cid-7jzvvn5r>All rooms</strong> <span class="app-strip__kickerline" data-astro-cid-7jzvvn5r>every PointCast surface, sorted</span> </a> </div> </section>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/AppLaunchStrip.astro", void 0);

const $$PointCastPlayStrip = createComponent(($$result, $$props, $$slots) => {
  const primary = PLAY_SURFACES.filter(
    (surface) => ["passport", "walk", "quests", "weather", "radio", "zen-cats", "nouns-wood-chop", "derby-season"].includes(surface.id)
  );
  return renderTemplate`${maybeRenderHead()}<aside class="play-strip" aria-labelledby="play-strip-title" data-astro-cid-lxyzsbbw> <div class="play-strip__head" data-astro-cid-lxyzsbbw> <p class="play-strip__kicker" data-astro-cid-lxyzsbbw>PLAY LAYER · TWELVE NEW LOOPS</p> <h2 id="play-strip-title" data-astro-cid-lxyzsbbw>PointCast now has rituals, quests, cats, and route cards.</h2> <p data-astro-cid-lxyzsbbw>
Passport stamps, the Daily Walk, room weather, radio bulletins, civic wishes,
      Zen Cats, Wood Chop, the pet, and ${DERBY_SEASON.title} are wired through one local play layer.
</p> </div> <nav class="play-strip__links" aria-label="PointCast play layer routes" data-astro-cid-lxyzsbbw> ${primary.map((surface) => renderTemplate`<a${addAttribute(surface.route, "href")} data-astro-cid-lxyzsbbw> <span data-astro-cid-lxyzsbbw>${surface.code}</span> <strong data-astro-cid-lxyzsbbw>${surface.title}</strong> </a>`)} <a class="play-strip__all" href="/play" data-astro-cid-lxyzsbbw> <span data-astro-cid-lxyzsbbw>ALL</span> <strong data-astro-cid-lxyzsbbw>/play</strong> </a> </nav> </aside>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PointCastPlayStrip.astro", void 0);

var __freeze$3 = Object.freeze;
var __defProp$3 = Object.defineProperty;
var __template$3 = (cooked, raw) => __freeze$3(__defProp$3(cooked, "raw", { value: __freeze$3(cooked.slice()) }));
var _a$3;
const $$ZenCatTodayCard = createComponent(($$result, $$props, $$slots) => {
  const today = todayZenCat();
  const cat = today.cat;
  const palette = cat.palette;
  const clientData = {
    today,
    rituals: ZEN_CAT_RITUALS,
    storageKeys: ZEN_CATS_STORAGE_KEYS,
    passportStamp: "zen-cat"
  };
  return renderTemplate(_a$3 || (_a$3 = __template$3(["", '<section class="zen-cat-today" aria-labelledby="zen-cat-today-title" data-zen-cat-today-card', ' data-astro-cid-gzljyffj> <a class="zen-cat-today__art" href="/zen-cats"', " data-astro-cid-gzljyffj> <img", "", ` width="220" height="220" loading="lazy" decoding="async" data-astro-cid-gzljyffj> </a> <div class="zen-cat-today__copy" data-astro-cid-gzljyffj> <p class="zen-cat-today__kicker" data-astro-cid-gzljyffj>PLAY LAYER · DAILY ZEN CAT</p> <h2 id="zen-cat-today-title" data-astro-cid-gzljyffj>Today's cat is `, " - ", ".</h2> <p data-astro-cid-gzljyffj> ", ", ", ", ", '. Run the three quiet rituals here,\n      then mint when the dedicated PCCAT contract is live on Tezos.\n</p> <dl class="zen-cat-today__facts" data-astro-cid-gzljyffj> <div data-astro-cid-gzljyffj> <dt data-astro-cid-gzljyffj>Token</dt> <dd data-astro-cid-gzljyffj>#', "</dd> </div> <div data-astro-cid-gzljyffj> <dt data-astro-cid-gzljyffj>Rarity</dt> <dd data-astro-cid-gzljyffj>", "</dd> </div> <div data-astro-cid-gzljyffj> <dt data-astro-cid-gzljyffj>Mantra</dt> <dd data-astro-cid-gzljyffj>", '</dd> </div> </dl> </div> <div class="zen-cat-today__actions" data-astro-cid-gzljyffj> <div class="zen-cat-today__rituals" aria-label="Zen Cat daily rituals" data-astro-cid-gzljyffj> ', ' </div> <p class="zen-cat-today__status" data-home-zen-status data-astro-cid-gzljyffj>0 / ', ' rituals complete.</p> <div class="zen-cat-today__links" data-astro-cid-gzljyffj> <button type="button" data-home-collect-cat disabled data-astro-cid-gzljyffj>Collect here</button> <a href="/zen-cats" data-astro-cid-gzljyffj>Open garden</a> <a href="/play" data-astro-cid-gzljyffj>Play layer</a> </div> </div> </section> <script type="application/json" id="zen-cat-home-data">', "<\/script> ", ""])), maybeRenderHead(), addAttribute(`--cat-ground:${palette.ground};--cat-paper:${palette.paper};--cat-accent:${palette.accent};--cat-ink:${palette.ink};`, "style"), addAttribute(`Open today's Zen Cat, ${cat.name}`, "aria-label"), addAttribute(today.imageUrl, "src"), addAttribute(`${cat.name}, the daily Zen Cat`, "alt"), cat.name, cat.mood, cat.coat, today.room, today.weather, today.tokenId, today.rarity, cat.mantra, ZEN_CAT_RITUALS.map((ritual) => renderTemplate`<button type="button"${addAttribute(ritual.id, "data-home-ritual-id")} aria-pressed="false" data-astro-cid-gzljyffj> <span data-astro-cid-gzljyffj>${ritual.label}</span> </button>`), ZEN_CAT_RITUALS.length, unescapeHTML(JSON.stringify(clientData)), renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/ZenCatTodayCard.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/ZenCatTodayCard.astro", void 0);

const $$WalletShelfModule = createComponent(($$result, $$props, $$slots) => {
  const wallet = "tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw";
  const walletUrl = `/wallet/?address=${wallet}`;
  const items = [
    {
      label: "PCMUG",
      title: "Espresso Cup",
      meta: "Coffee Mugs #1",
      image: "/images/coffee-mugs/espresso.svg",
      href: "/token/coffee-mugs/1",
      status: "token detail"
    },
    {
      label: "PCVN",
      title: "Noun #557",
      meta: "Visit Nouns #557",
      image: "https://noun.pics/557.svg",
      href: "/token/visit-nouns/557",
      status: "market aware"
    },
    {
      label: "PCVN",
      title: "Noun #88",
      meta: "Visit Nouns #88",
      image: "https://noun.pics/88.svg",
      href: "/token/visit-nouns/88",
      status: "holder aware"
    }
  ];
  return renderTemplate`${maybeRenderHead()}<section class="wallet-shelf" aria-labelledby="wallet-shelf-title" data-astro-cid-hx7adwyu> <div class="wallet-shelf__copy" data-astro-cid-hx7adwyu> <p class="wallet-shelf__kicker mono" data-astro-cid-hx7adwyu>TEZOS SHELF · TOKEN PAGES · LIVE MARKET</p> <h2 id="wallet-shelf-title" data-astro-cid-hx7adwyu>Collected pieces should look collected.</h2> <p data-astro-cid-hx7adwyu>
The PointCast wallet now opens into shareable token pages with framed art,
      live holders, listing status, objkt, TzKT, and the market lane one tap away.
</p> <nav class="wallet-shelf__actions" aria-label="Wallet shelf actions" data-astro-cid-hx7adwyu> <a${addAttribute(walletUrl, "href")} data-astro-cid-hx7adwyu>Open wallet shelf</a> <a href="/token/visit-nouns/557" data-astro-cid-hx7adwyu>Token #557</a> <a href="/marketplace" data-astro-cid-hx7adwyu>Marketplace console</a> <a href="/market" data-astro-cid-hx7adwyu>Live asks</a> </nav> </div> <div class="wallet-shelf__cards" aria-label="Current collected cards" data-astro-cid-hx7adwyu> ${items.map((item) => renderTemplate`<a class="wallet-shelf__card"${addAttribute(item.href, "href")}${addAttribute(item.href.startsWith("http") ? "_blank" : void 0, "target")}${addAttribute(item.href.startsWith("http") ? "noopener" : void 0, "rel")} data-astro-cid-hx7adwyu> <span class="wallet-shelf__label mono" data-astro-cid-hx7adwyu>${item.label}</span> <span class="wallet-shelf__art" data-astro-cid-hx7adwyu> <img${addAttribute(item.image, "src")}${addAttribute(item.title, "alt")} loading="lazy" data-astro-cid-hx7adwyu> </span> <strong data-astro-cid-hx7adwyu>${item.title}</strong> <span data-astro-cid-hx7adwyu>${item.meta}</span> <em class="wallet-shelf__status mono" data-astro-cid-hx7adwyu>${item.status}</em> </a>`)} </div> </section>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/WalletShelfModule.astro", void 0);

const $$DrumCrewStrip = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DrumCrewStrip;
  const { context = "home" } = Astro2.props;
  const KT1 = contracts.visit_nouns?.mainnet;
  const priceMutez = Number(contracts.visit_nouns?.mintPriceMutez);
  const crew = [
    { id: 88, room: "classic", surface: "/drum", tag: "CH.VST · v1", note: "one tap, one heart, no skill required" },
    { id: 247, room: "collab", surface: "/drum-v2", tag: "CH.VST · v2", note: "pentatonic voice + leaderboard" },
    { id: 365, room: "orchestra", surface: "/drum-v4", tag: "CH.VST · v4", note: "twelve nouns playing twelve instruments" },
    { id: 612, room: "choir", surface: "/drum-v6", tag: "CH.VST · v6", note: "twelve voices, four chord progressions" },
    { id: 808, room: "lounge", surface: "/drum-v9", tag: "CH.VST · v9", note: "eight saxophones, one Cmaj9 voicing" },
    { id: 999, room: "mcp", surface: "/api/mcp", tag: "CH.VST · agents", note: "agents enter through this door" }
  ];
  const trophyHref = "/drum-trophies";
  const collectionHref = "/collection/visit-nouns";
  return renderTemplate`${maybeRenderHead()}<section${addAttribute(["drum-crew", `drum-crew--${context}`], "class:list")} id="drum-crew" aria-labelledby="drum-crew-title" data-astro-cid-qllxozem> <div class="drum-crew__head" data-astro-cid-qllxozem> <p class="drum-crew__kicker" data-astro-cid-qllxozem>Drum Crew · Visit Nouns FA2 · Tezos mainnet</p> <div class="drum-crew__title" data-astro-cid-qllxozem> <h2 id="drum-crew-title" data-astro-cid-qllxozem>Six Nouns, one per drum room.</h2> <p data-astro-cid-qllxozem>
The drum hub has nine playable surfaces plus an <a href="/api/mcp" data-astro-cid-qllxozem>MCP server for agents</a>. This is the collectible set — one Noun seed per room, all gas-only on the live Visit Nouns FA2. Click a card to visit the room it stands for. Mint to keep the souvenir.
</p> </div> <div class="drum-crew__links" data-astro-cid-qllxozem> <a class="drum-crew__pill"${addAttribute(trophyHref, "href")} data-astro-cid-qllxozem>Trophies →</a> <a class="drum-crew__pill"${addAttribute(collectionHref, "href")} data-astro-cid-qllxozem>Collection →</a> </div> </div> <ul class="drum-crew__grid" role="list" data-astro-cid-qllxozem> ${crew.map((c) => renderTemplate`<li class="crew-card" data-astro-cid-qllxozem> <div class="crew-card__chrome" data-astro-cid-qllxozem> <span class="crew-card__tag" data-astro-cid-qllxozem>${c.tag}</span> <span class="crew-card__room" data-astro-cid-qllxozem>${c.room}</span> </div> <a class="crew-card__art"${addAttribute(c.surface, "href")}${addAttribute(`Visit the ${c.room} room`, "aria-label")} data-astro-cid-qllxozem> <img${addAttribute(`https://noun.pics/${c.id}.svg`, "src")}${addAttribute(`Noun ${c.id} — ${c.room} room avatar`, "alt")} width="220" height="220"${addAttribute(context === "home" ? "lazy" : "lazy", "loading")} data-astro-cid-qllxozem> <span class="crew-card__id" data-astro-cid-qllxozem>№ ${c.id}</span> </a> <div class="crew-card__body" data-astro-cid-qllxozem> <p class="crew-card__note" data-astro-cid-qllxozem>${c.note}</p> <p class="crew-card__visit" data-astro-cid-qllxozem><a${addAttribute(c.surface, "href")} data-astro-cid-qllxozem>Visit ${c.surface}</a></p> </div> <div class="crew-card__actions" data-astro-cid-qllxozem> ${renderComponent($$result, "MintButton", $$MintButton, { "contract": KT1, "tokenId": c.id, "priceMutez": priceMutez, "kind": "mint", "label": priceMutez > 0 ? `Mint · ${(priceMutez / 1e6).toFixed(2)} ꜩ` : "Mint · free", "data-astro-cid-qllxozem": true })} <a class="crew-card__objkt"${addAttribute(`https://objkt.com/tokens/${KT1}/${c.id}`, "href")} target="_blank" rel="noopener" data-astro-cid-qllxozem>objkt ↗</a> </div> </li>`)} </ul> <p class="drum-crew__foot" data-astro-cid-qllxozem>
Each mint is one transfer on the Visit Nouns FA2 — gas only, public mint, no allowlist. The Drum Crew cap is open: any seed can keep going past the first six if a sibling room ships. <a href="/drum" data-astro-cid-qllxozem>/drum</a> is the hub. <a href="/api/mcp" data-astro-cid-qllxozem>/api/mcp</a> is the agent door.
</p> </section>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/DrumCrewStrip.astro", void 0);

const $$KettleStrip = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<a class="kettle-strip" href="/kettle" aria-label="The kettle is on at /kettle" data-astro-cid-ttrqlsyl> <span class="kettle-strip__emoji" aria-hidden="true" data-astro-cid-ttrqlsyl>🫖</span> <span class="kettle-strip__copy" data-astro-cid-ttrqlsyl> <span class="kettle-strip__line1" data-astro-cid-ttrqlsyl>The kettle is on at <strong data-astro-cid-ttrqlsyl>/kettle</strong>.</span> <span class="kettle-strip__line2" data-astro-cid-ttrqlsyl>Stoke the flame together — the room boils when we all show up.</span> </span> <span class="kettle-strip__cta" aria-hidden="true" data-astro-cid-ttrqlsyl>enter the kitchen →</span> </a>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/KettleStrip.astro", void 0);

var __freeze$2 = Object.freeze;
var __defProp$2 = Object.defineProperty;
var __template$2 = (cooked, raw) => __freeze$2(__defProp$2(cooked, "raw", { value: __freeze$2(cooked.slice()) }));
var _a$2;
const $$AgentLane = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$2 || (_a$2 = __template$2(["", `<aside class="al" aria-labelledby="al-title" data-astro-cid-bpwcfexk> <div class="al__head" data-astro-cid-bpwcfexk> <p class="al__kicker mono" data-astro-cid-bpwcfexk>★ AGENT LANE · MACHINE-READABLE FRONT DOOR ★</p> <h2 class="al__title mono" id="al-title" data-astro-cid-bpwcfexk>agents welcome</h2> <p class="al__sub" data-astro-cid-bpwcfexk>Add the MCP connector. Open the agent drum room. Hand the URL to your model. The room treats agents and humans on the same bus.</p> </div> <div class="al__grid" data-astro-cid-bpwcfexk> <a class="al__card al__card--play" href="/drum-agent" data-astro-cid-bpwcfexk> <span class="al__card-glyph" aria-hidden="true" data-astro-cid-bpwcfexk>◉</span> <span class="al__card-meta" data-astro-cid-bpwcfexk> <span class="al__card-eyebrow mono" data-astro-cid-bpwcfexk>PLAY · TYPE=AGENT</span> <span class="al__card-title" data-astro-cid-bpwcfexk>/drum-agent</span> <span class="al__card-note" data-astro-cid-bpwcfexk>Big AGENT TAP button. Every press fans out across every cast surface.</span> </span> </a> <a class="al__card" href="/drum-agents" data-astro-cid-bpwcfexk> <span class="al__card-glyph" aria-hidden="true" data-astro-cid-bpwcfexk>⌂</span> <span class="al__card-meta" data-astro-cid-bpwcfexk> <span class="al__card-eyebrow mono" data-astro-cid-bpwcfexk>HALL · DIRECTORY</span> <span class="al__card-title" data-astro-cid-bpwcfexk>/drum-agents</span> <span class="al__card-note" data-astro-cid-bpwcfexk>Resident agents (Claude Code · Codex · Manus) plus connect-your-own snippets.</span> </span> </a> <a class="al__card" href="/api/mcp" data-astro-cid-bpwcfexk> <span class="al__card-glyph" aria-hidden="true" data-astro-cid-bpwcfexk>◊</span> <span class="al__card-meta" data-astro-cid-bpwcfexk> <span class="al__card-eyebrow mono" data-astro-cid-bpwcfexk>MCP · 24 TOOLS</span> <span class="al__card-title" data-astro-cid-bpwcfexk>/api/mcp</span> <span class="al__card-note" data-astro-cid-bpwcfexk>JSON-RPC 2.0. Town map, presence, blocks, channels, contracts, drum hub.</span> </span> </a> <a class="al__card" href="/connectors" data-astro-cid-bpwcfexk> <span class="al__card-glyph" aria-hidden="true" data-astro-cid-bpwcfexk>⬚</span> <span class="al__card-meta" data-astro-cid-bpwcfexk> <span class="al__card-eyebrow mono" data-astro-cid-bpwcfexk>CONNECT · CLIENT LINKS</span> <span class="al__card-title" data-astro-cid-bpwcfexk>/connectors</span> <span class="al__card-note" data-astro-cid-bpwcfexk>Addable connector links for Claude Desktop, Cursor, ChatGPT, Claude Code.</span> </span> </a> </div> <div class="al__strip" data-astro-cid-bpwcfexk> <span class="al__stat mono" data-astro-cid-bpwcfexk>live: <strong id="al-count" data-astro-cid-bpwcfexk>—</strong></span> <span class="al__stat mono" data-astro-cid-bpwcfexk>events tail · <span id="al-tail" data-astro-cid-bpwcfexk>— stream open —</span></span> <span class="al__stat mono" data-astro-cid-bpwcfexk>→ <a href="/town" data-astro-cid-bpwcfexk>/town</a> · <a href="/agents.json" data-astro-cid-bpwcfexk>/agents.json</a> · <a href="/llms.txt" data-astro-cid-bpwcfexk>/llms.txt</a></span> </div> </aside> <script>
(function () {
  'use strict';
  var countEl = document.getElementById('al-count');
  var tailEl = document.getElementById('al-tail');
  if (!countEl || !tailEl) return;

  function pollVisit() {
    fetch('/api/visit', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var present = Array.isArray(data.present) ? data.present : [];
        var humanish = present.filter(function (p) {
          var t = (p && p.type) || '';
          return p && p.pid && typeof p.nounId === 'number' && !t.startsWith('bot:');
        });
        countEl.textContent = String(humanish.length);
      })
      .catch(function () {});
  }

  var lastTs = Date.now() - 6000;
  function pollSounds() {
    fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var events = Array.isArray(data.events) ? data.events : [];
        if (!events.length) return;
        lastTs = events[events.length - 1].t || Date.now();
        var last = events[events.length - 1];
        var pid = (last.pid || '').slice(0, 8) || '—';
        tailEl.textContent = 'type=' + (last.type || '?') + ' · pid=' + pid;
      })
      .catch(function () {});
  }

  pollVisit();
  pollSounds();
  setInterval(pollVisit, 8000);
  setInterval(pollSounds, 2000);
})();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/AgentLane.astro", void 0);

const $$DrumPressMarquee = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<aside class="dpm" aria-labelledby="dpm-title" data-astro-cid-z6mrkjmp> <div class="dpm__head" data-astro-cid-z6mrkjmp> <p class="dpm__kicker mono" data-astro-cid-z6mrkjmp>★ DRUM PRESS · CATALOG OF DRUM MEDIA ★</p> <h2 class="dpm__title" id="dpm-title" data-astro-cid-z6mrkjmp>
forty-seven <em data-astro-cid-z6mrkjmp>editions</em> in print
</h2> <p class="dpm__strap mono" data-astro-cid-z6mrkjmp>eight imprints · pressed nightly · el segundo, ca</p> </div> <div class="dpm__row" role="list" data-astro-cid-z6mrkjmp> <a class="dpm__cover" role="listitem" href="/drum-v15" data-astro-cid-z6mrkjmp> <span class="dpm__cat mono" data-astro-cid-z6mrkjmp>DR-V15</span> <span class="dpm__name" data-astro-cid-z6mrkjmp>hang</span> <span class="dpm__sub mono" data-astro-cid-z6mrkjmp>handpan · steel</span> </a> <a class="dpm__cover" role="listitem" href="/drum-letters" data-astro-cid-z6mrkjmp> <span class="dpm__cat mono" data-astro-cid-z6mrkjmp>DR-COM3</span> <span class="dpm__name" data-astro-cid-z6mrkjmp>letters</span> <span class="dpm__sub mono" data-astro-cid-z6mrkjmp>note for the next</span> </a> <a class="dpm__cover" role="listitem" href="/drum-radio" data-astro-cid-z6mrkjmp> <span class="dpm__cat mono" data-astro-cid-z6mrkjmp>DR-CST5</span> <span class="dpm__name" data-astro-cid-z6mrkjmp>radio</span> <span class="dpm__sub mono" data-astro-cid-z6mrkjmp>96.1 fm · all rooms</span> </a> <a class="dpm__cover" role="listitem" href="/drum-agent" data-astro-cid-z6mrkjmp> <span class="dpm__cat mono" data-astro-cid-z6mrkjmp>DR-MAC2</span> <span class="dpm__name" data-astro-cid-z6mrkjmp>agent room</span> <span class="dpm__sub mono" data-astro-cid-z6mrkjmp>play floor · machine</span> </a> </div> <a class="dpm__cta mono" href="/drum-press" data-astro-cid-z6mrkjmp>
browse the catalog → <span class="dpm__cta-imprints" data-astro-cid-z6mrkjmp>8 imprints · 47 titles</span> </a> </aside>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/DrumPressMarquee.astro", void 0);

const $$BirthdayLane = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<aside class="bdl" aria-labelledby="bdl-title" data-astro-cid-yrovxqgm> <div class="bdl__head" data-astro-cid-yrovxqgm> <p class="bdl__kicker mono" data-astro-cid-yrovxqgm>★ DRUM HUB · BIRTHDAY IMPRINT · 4 WAYS TO CELEBRATE ★</p> <h2 class="bdl__title" id="bdl-title" data-astro-cid-yrovxqgm>
it&apos;s <em data-astro-cid-yrovxqgm>somebody&apos;s</em> birthday
</h2> <p class="bdl__strap mono" data-astro-cid-yrovxqgm>tap a drum · light a candle · sign a card · swing a piñata</p> </div> <div class="bdl__row" role="list" data-astro-cid-yrovxqgm> <a class="bdl__card bdl__card--hub" role="listitem" href="/drum-birthday" data-astro-cid-yrovxqgm> <span class="bdl__cat mono" data-astro-cid-yrovxqgm>DR-BD1</span> <span class="bdl__glyph" aria-hidden="true" data-astro-cid-yrovxqgm>🎂</span> <span class="bdl__name" data-astro-cid-yrovxqgm>birthday</span> <span class="bdl__sub mono" data-astro-cid-yrovxqgm>the hub · big drum · live confetti</span> <span class="bdl__go mono" data-astro-cid-yrovxqgm>go to room →</span> </a> <a class="bdl__card bdl__card--cake" role="listitem" href="/drum-cake" data-astro-cid-yrovxqgm> <span class="bdl__cat mono" data-astro-cid-yrovxqgm>DR-BD2</span> <span class="bdl__glyph" aria-hidden="true" data-astro-cid-yrovxqgm>🕯️</span> <span class="bdl__name" data-astro-cid-yrovxqgm>cake</span> <span class="bdl__sub mono" data-astro-cid-yrovxqgm>light a candle · blow it out · wish</span> <span class="bdl__go mono" data-astro-cid-yrovxqgm>go to room →</span> </a> <a class="bdl__card bdl__card--card" role="listitem" href="/drum-card" data-astro-cid-yrovxqgm> <span class="bdl__cat mono" data-astro-cid-yrovxqgm>DR-BD3</span> <span class="bdl__glyph" aria-hidden="true" data-astro-cid-yrovxqgm>💌</span> <span class="bdl__name" data-astro-cid-yrovxqgm>card</span> <span class="bdl__sub mono" data-astro-cid-yrovxqgm>the room signs together · one tap each</span> <span class="bdl__go mono" data-astro-cid-yrovxqgm>go to room →</span> </a> <a class="bdl__card bdl__card--pinata" role="listitem" href="/drum-pinata" data-astro-cid-yrovxqgm> <span class="bdl__cat mono" data-astro-cid-yrovxqgm>DR-BD4</span> <span class="bdl__glyph" aria-hidden="true" data-astro-cid-yrovxqgm>🪅</span> <span class="bdl__name" data-astro-cid-yrovxqgm>piñata</span> <span class="bdl__sub mono" data-astro-cid-yrovxqgm>take a swing · the room bursts at 100</span> <span class="bdl__go mono" data-astro-cid-yrovxqgm>go to room →</span> </a> </div> <div class="bdl__foot" data-astro-cid-yrovxqgm> <p class="bdl__cta mono" data-astro-cid-yrovxqgm>
personalize: append <code data-astro-cid-yrovxqgm>?for=NAME&amp;from=YOU&amp;age=N</code> to any room — share the link, the page wears the name
</p> </div> </aside>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/BirthdayLane.astro", void 0);

const $$DrumVsLane = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<aside class="dvl" aria-labelledby="dvl-title" data-astro-cid-4qw35ygy> <div class="dvl__head" data-astro-cid-4qw35ygy> <p class="dvl__kicker mono" data-astro-cid-4qw35ygy>★ DRUM HUB · 1v1 · SEND-A-LINK GAMES ★</p> <h2 class="dvl__title" id="dvl-title" data-astro-cid-4qw35ygy>
tap <em data-astro-cid-4qw35ygy>vs</em> tap
</h2> <p class="dvl__strap mono" data-astro-cid-4qw35ygy>room-scoped · WebRTC peer-to-peer · sub-50ms when both phones are in</p> </div> <div class="dvl__board" aria-hidden="true" data-astro-cid-4qw35ygy> <div class="dvl__face dvl__face--p1" data-astro-cid-4qw35ygy> <img class="dvl__noun" src="https://noun.pics/156.svg" alt="" width="56" height="56" loading="lazy" data-astro-cid-4qw35ygy> <span class="dvl__face-tag mono" data-astro-cid-4qw35ygy>P1</span> </div> <div class="dvl__rope" data-astro-cid-4qw35ygy> <span class="dvl__rope-line" data-astro-cid-4qw35ygy></span> <span class="dvl__rope-mid" data-astro-cid-4qw35ygy>VS</span> </div> <div class="dvl__face dvl__face--p2" data-astro-cid-4qw35ygy> <img class="dvl__noun" src="https://noun.pics/805.svg" alt="" width="56" height="56" loading="lazy" data-astro-cid-4qw35ygy> <span class="dvl__face-tag mono" data-astro-cid-4qw35ygy>P2</span> </div> </div> <div class="dvl__row" data-astro-cid-4qw35ygy> <a class="dvl__btn dvl__btn--magenta" href="/drum-vs" data-astro-cid-4qw35ygy>
▸ tug-of-war
<span class="dvl__btn-sub mono" data-astro-cid-4qw35ygy>rope · first to 50</span> </a> <a class="dvl__btn" href="/drum-vs?mode=race" data-astro-cid-4qw35ygy>
▸ race
<span class="dvl__btn-sub mono" data-astro-cid-4qw35ygy>bars · sprint to 50</span> </a> <a class="dvl__btn" href="/drum-vs?mode=duel" data-astro-cid-4qw35ygy>
▸ duel
<span class="dvl__btn-sub mono" data-astro-cid-4qw35ygy>bell · first tap wins</span> </a> </div> <p class="dvl__foot mono" data-astro-cid-4qw35ygy>
no signup · the URL is the invite · share via iMessage / WhatsApp
</p> </aside>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/DrumVsLane.astro", void 0);

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const $$DrumLeagueStrip = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", `<aside class="dls" aria-labelledby="dls-title" data-astro-cid-mcyxukk2> <div class="dls__head" data-astro-cid-mcyxukk2> <p class="dls__kicker mono" data-astro-cid-mcyxukk2>★ DRUM LEAGUE · COMMUNITY COUNTER · ALL OF US ★</p> <h2 class="dls__title" id="dls-title" data-astro-cid-mcyxukk2>we're at <strong id="dls-count" data-astro-cid-mcyxukk2>—</strong> taps this week</h2> <p class="dls__strap mono" data-astro-cid-mcyxukk2>every drum surface counts · top contributors get a portrait sunday</p> </div> <div class="dls__row" data-astro-cid-mcyxukk2> <div class="dls__top" id="dls-top" role="list" aria-label="Top contributors" data-astro-cid-mcyxukk2> <span class="dls__top-empty mono" data-astro-cid-mcyxukk2>— loading top three —</span> </div> <a class="dls__cta mono" href="/drum-league" data-astro-cid-mcyxukk2>
▸ open the league
<span class="dls__cta-sub" data-astro-cid-mcyxukk2>live counter · top 12 · today's duel</span> </a> </div> </aside> <script>
  (function () {
    var countEl = document.getElementById('dls-count');
    var topEl = document.getElementById('dls-top');
    function fmt(n) { try { return n.toLocaleString(); } catch (e) { return String(n); } }
    function tickCount() {
      var sid;
      try { sid = localStorage.getItem('pc:sid') || ''; } catch (e) { sid = ''; }
      if (!sid) sid = 'anon-' + Date.now();
      fetch('/api/drum?sessionId=' + encodeURIComponent(sid), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          var n = Number(d.globalTotal) || 0;
          if (countEl) countEl.textContent = fmt(n);
        }).catch(function () {});
    }
    function tickTop() {
      fetch('/api/drum/top', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !Array.isArray(d.entries) || !topEl) return;
          var top3 = d.entries.slice(0, 3);
          if (top3.length === 0) {
            topEl.innerHTML = '<span class="dls__top-empty mono">— no taps yet · be the first —</span>';
            return;
          }
          topEl.innerHTML = top3.map(function (e, i) {
            var rank = e.rank || (i + 1);
            var nid = (e.nounId | 0) || 1;
            var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            return '<span class="dls__top-row" role="listitem">' +
                   '<span class="dls__top-medal" aria-hidden="true">' + medal + '</span>' +
                   '<img class="dls__top-noun" src="https://noun.pics/' + nid + '.svg" alt="" width="36" height="36" loading="lazy" />' +
                   '<span class="dls__top-count mono">' + fmt(Number(e.count) || 0) + '</span>' +
                   '</span>';
          }).join('');
        }).catch(function () {});
    }
    tickCount(); tickTop();
    setInterval(tickCount, 8000);
    setInterval(tickTop, 12000);
  })();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/DrumLeagueStrip.astro", void 0);

const $$FeedbackBlock = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="mt-10 mb-8" id="feedback"> <div class="flex items-center gap-3 mb-3"> <div class="h-px flex-1 bg-rule/40"></div> <h2 class="font-mono text-[0.58rem] tracking-[0.22em] uppercase text-ink-soft/60"> <span class="text-warm/70">09</span> &middot; Feedback &middot; <span class="text-warm">tell mike</span> </h2> <div class="h-px flex-1 bg-rule/40"></div> </div> <div class="relative rounded-xl overflow-hidden border-2 border-ink/80 bg-card p-4 md:p-5"> <!-- Midcentury corner blocks --> <div class="absolute top-0 left-0 w-2.5 h-2.5 bg-warm" aria-hidden="true"></div> <div class="absolute top-0 right-0 w-2.5 h-2.5 bg-ink" aria-hidden="true"></div> <div class="absolute bottom-0 left-0 w-2.5 h-2.5 bg-ink" aria-hidden="true"></div> <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-warm" aria-hidden="true"></div> <p class="font-mono text-[0.54rem] tracking-[0.2em] uppercase text-warm mb-1">
anonymous · emailed straight to mike
</p> <p class="font-serif italic text-[1.15rem] md:text-[1.3rem] text-ink leading-snug mb-4" id="fb-prompt">
what would make you come back?
</p> <!-- Mood chips — tappable emoji, sets the \`mood\` on submit --> <div class="flex flex-wrap gap-1.5 mb-3" id="fb-mood-row"> <button type="button" data-mood="loving" class="fb-mood px-2.5 py-1.5 rounded-full border border-rule/40 bg-paper/60 hover:border-warm/60 cursor-pointer transition-colors text-sm">🥰 loving</button> <button type="button" data-mood="impressed" class="fb-mood px-2.5 py-1.5 rounded-full border border-rule/40 bg-paper/60 hover:border-warm/60 cursor-pointer transition-colors text-sm">🤯 impressed</button> <button type="button" data-mood="confused" class="fb-mood px-2.5 py-1.5 rounded-full border border-rule/40 bg-paper/60 hover:border-warm/60 cursor-pointer transition-colors text-sm">🤔 confused</button> <button type="button" data-mood="annoyed" class="fb-mood px-2.5 py-1.5 rounded-full border border-rule/40 bg-paper/60 hover:border-warm/60 cursor-pointer transition-colors text-sm">😤 annoyed</button> <button type="button" data-mood="broken" class="fb-mood px-2.5 py-1.5 rounded-full border border-rule/40 bg-paper/60 hover:border-warm/60 cursor-pointer transition-colors text-sm">🔨 broken</button> </div> <textarea id="fb-message" rows="3" maxlength="2000" placeholder="type whatever comes to mind…" class="w-full px-3 py-2 rounded-md border border-rule/40 bg-paper font-serif italic text-[1rem] text-ink leading-snug focus:border-warm focus:outline-none resize-vertical"></textarea> <!-- Optional contact — hidden until toggled --> <div class="mt-2 flex items-center gap-2 flex-wrap"> <button type="button" id="fb-contact-toggle" class="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/55 hover:text-warm cursor-pointer">
+ want a reply?
</button> <input id="fb-contact" type="text" maxlength="200" placeholder="email or @handle · optional" class="hidden flex-1 min-w-[8rem] px-2 py-1 rounded-sm border border-rule/40 bg-paper text-[0.82rem] text-ink focus:border-warm focus:outline-none"> </div> <div class="flex items-center justify-between gap-2 mt-3"> <p class="font-mono text-[0.46rem] tracking-[0.18em] uppercase text-ink-soft/40" id="fb-charcount">
0 / 2000
</p> <button id="fb-submit" type="button" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm bg-ink text-paper font-mono text-[0.56rem] tracking-[0.14em] uppercase hover:bg-warm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"> <span id="fb-submit-label">Send →</span> </button> </div> <p id="fb-status" class="mt-2 font-mono text-[0.5rem] tracking-[0.18em] uppercase text-warm min-h-[0.85rem]" role="status" aria-live="polite"></p> <!-- Success confirmation — big + unmistakable. Replaces the whole form
         area on successful send so the sender CANNOT miss that it landed.
         Hidden until \`fb-success\` is toggled visible by the submit handler. --> <div id="fb-success" class="hidden absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card border-2 border-ink/80 rounded-xl p-6 text-center" role="alert" aria-live="assertive"> <span class="text-4xl" aria-hidden="true">✓</span> <p class="font-heading text-[1.5rem] md:text-[1.75rem] text-ink leading-none">
Got it, thanks.
</p> <p class="font-serif italic text-[0.95rem] text-ink-soft/80 leading-snug max-w-[24rem]">
Your note landed in Mike's pile. He actually reads these.
</p> <p class="font-mono text-[0.5rem] tracking-[0.22em] uppercase text-warm/60 mt-1">
stored at /admin/feedback &middot; emailed if inbox wired
</p> <button type="button" id="fb-reset" class="mt-2 font-mono text-[0.5rem] tracking-[0.18em] uppercase text-ink-soft/60 hover:text-warm transition-colors cursor-pointer">
send another →
</button> </div> </div> </section> ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FeedbackBlock.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/FeedbackBlock.astro", void 0);

const $$NounsWoodChopStrip = createComponent(($$result, $$props, $$slots) => {
  const stampTargets = [
    { label: "First Bundle", bundles: 1 },
    { label: "Carpenter", bundles: 3 },
    { label: "Forester", bundles: 5 },
    { label: "Keeper", bundles: 8 }
  ];
  return renderTemplate`${maybeRenderHead()}<aside class="wood-strip" aria-labelledby="wood-strip-title" data-astro-cid-2viazwg5> <div class="wood-strip__scene" aria-hidden="true" data-astro-cid-2viazwg5> <span class="wood-strip__sun" data-astro-cid-2viazwg5></span> <span class="wood-strip__tree wood-strip__tree--back" data-astro-cid-2viazwg5></span> <span class="wood-strip__tree wood-strip__tree--main" data-astro-cid-2viazwg5></span> <span class="wood-strip__noggles" data-astro-cid-2viazwg5> <i data-astro-cid-2viazwg5></i> <i data-astro-cid-2viazwg5></i> </span> <span class="wood-strip__axe" data-astro-cid-2viazwg5></span> <span class="wood-strip__log wood-strip__log--one" data-astro-cid-2viazwg5></span> <span class="wood-strip__log wood-strip__log--two" data-astro-cid-2viazwg5></span> </div> <div class="wood-strip__copy" data-astro-cid-2viazwg5> <p class="wood-strip__kicker" data-astro-cid-2viazwg5>Nouns play loop / pixel collect</p> <h2 id="wood-strip-title" data-astro-cid-2viazwg5>Wood Chop Commons is live.</h2> <p data-astro-cid-2viazwg5>
Chop a pixel tree, collect wood, bank bundles, plant seeds, and unlock local Nouns stamps. It is small, quick, and very PointCast.
</p> <nav class="wood-strip__actions" aria-label="Nouns Wood Chop links" data-astro-cid-2viazwg5> <a href="/nouns-wood-chop" data-astro-cid-2viazwg5>Play</a> <a href="/nouns-wood-chop.json" data-astro-cid-2viazwg5>Manifest</a> <a href="/b/0383" data-astro-cid-2viazwg5>Block 0383</a> </nav> </div> <div class="wood-strip__stamps" aria-label="Stamp milestones" data-astro-cid-2viazwg5> ${stampTargets.map((stamp) => renderTemplate`<div class="wood-strip__stamp" data-astro-cid-2viazwg5> <span data-astro-cid-2viazwg5>${stamp.bundles} bundle${stamp.bundles === 1 ? "" : "s"}</span> <strong data-astro-cid-2viazwg5>${stamp.label}</strong> </div>`)} </div> </aside>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/NounsWoodChopStrip.astro", void 0);

const $$NowLine = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$NowLine;
  const { blocks, blockCount } = Astro2.props;
  const latest = blocks[0] ?? null;
  const recent = blocks.slice(0, 6);
  const channelCounts = recent.reduce((acc, block) => {
    acc[block.data.channel] = (acc[block.data.channel] ?? 0) + 1;
    return acc;
  }, {});
  const dominantChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]).map(([channel]) => channel)[0];
  const dominant = dominantChannel ? CHANNELS[dominantChannel] : null;
  const latestTime = latest ? new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short"
  }).format(latest.data.timestamp) : "no blocks yet";
  return renderTemplate`${maybeRenderHead()}<aside class="now-line" aria-label="PointCast now line" data-astro-cid-2uiopgaj> <div class="now-line__pulse" aria-hidden="true" data-astro-cid-2uiopgaj></div> <div class="now-line__copy" data-astro-cid-2uiopgaj> <p class="now-line__kicker" data-astro-cid-2uiopgaj>NOW LINE</p> <h2 data-astro-cid-2uiopgaj> ${latest ? latest.data.title : "PointCast is ready."} </h2> <p data-astro-cid-2uiopgaj> ${blockCount} blocks live
${latest && renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-2uiopgaj": true }, { "default": ($$result2) => renderTemplate` · latest ${latestTime}` })}`} ${dominant && renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-2uiopgaj": true }, { "default": ($$result2) => renderTemplate` · recent center: ${dominant.name}` })}`} </p> </div> <nav class="now-line__links" aria-label="Now line links" data-astro-cid-2uiopgaj> ${latest && renderTemplate`<a${addAttribute(`/b/${latest.data.id}`, "href")} data-astro-cid-2uiopgaj>latest block</a>`} <a href="/status" data-astro-cid-2uiopgaj>status</a> <a href="/wire" data-astro-cid-2uiopgaj>wire</a> </nav> </aside>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/NowLine.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const HELLO_MIKE_BLOCK_ID = "0334";
  const HOUSEPLANTS_FIRST_BLOCK_ID = "0333";
  const allBlocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const firstBlock = allBlocks.find((block) => block.data.id === HOUSEPLANTS_FIRST_BLOCK_ID) ?? allBlocks[0] ?? null;
  const helloMikeCandidate = allBlocks.find((block) => block.data.id === HELLO_MIKE_BLOCK_ID) ?? null;
  const helloMikeBlock = helloMikeCandidate?.data.id !== firstBlock?.data.id ? helloMikeCandidate : null;
  const pinnedBlockIds = new Set([firstBlock?.data.id, helloMikeBlock?.data.id].filter(Boolean));
  const blocks = allBlocks.filter((block) => !pinnedBlockIds.has(block.data.id));
  const blockCount = allBlocks.length;
  const latestShips = allBlocks.slice(0, 5);
  const leadShip = latestShips[0] ?? null;
  const shipDeck = latestShips.slice(1);
  const homeDescription = "PointCast is an agent-native broadcast from El Segundo: live posts, rooms, games, agent surfaces, participation memory, Nouns experiments, and machine-readable feeds in one place.";
  function prettyShipTime(date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
      timeZoneName: "short"
    }).format(date);
  }
  const participationCards = [
    {
      href: "/internships/",
      label: "Internships 2026",
      title: "Build like you will remember this moment.",
      note: "A structured, warm program for people who want to gather information, make artifacts, leave receipts, help others, and see their work matter."
    },
    {
      href: "/internships/#participation-moment",
      label: "Participation memory",
      title: "Genius is something you practice.",
      note: "Weekly memory notes turn the work into a record: what changed, who it helped, and what the next person can use."
    },
    {
      href: "/internships/#nouns-interest",
      label: "Nouns interest",
      title: "Configure, stamp, message.",
      note: "Pick a Nouns path, stamp a local receipt, gather source notes, and ping PointCast for review."
    },
    {
      href: "/internships/roles.json",
      label: "Machine readable",
      title: "Roles and pathways as data.",
      note: "Agents can parse roles for Information Gatherer, Participation Memory Keeper, Nouns configurator, rewards, grants, rooms, and more."
    }
  ];
  const todayPostIdeas = [
    {
      channel: "Internship",
      title: "The Week You Started Becoming Useful",
      brief: "A post about participation as a first real receipt: one question, one source, one action, one memory note.",
      action: "Draft from /internships/#participation-moment"
    },
    {
      channel: "Nouns",
      title: "Nouns Interest Configurator Field Log",
      brief: "Walk through Visit Nouns, cards, portraits, cola, and the stamp path as a practical onboarding map.",
      action: "Gather links and send a reviewed Nouns brief"
    },
    {
      channel: "Research",
      title: "Information Gatherer: Five Sources Before One Claim",
      brief: "Make the research lane concrete: credible sources, uncertainty notes, privacy check, next action.",
      action: "Use the information-gatherer runner output"
    },
    {
      channel: "Rewards",
      title: "Proof Of Help Beats Proof Of Hype",
      brief: "Explain how task rewards can honor useful contributions without pretending collectibles are investment products.",
      action: "Link /rewards and /internships/program.json"
    },
    {
      channel: "Mindfulness",
      title: "The Five-Minute Reset Before You Build",
      brief: "A simple breath, gratitude, and contentment ritual for interns and builders between tasks.",
      action: "Pair with /meditate"
    },
    {
      channel: "Local",
      title: "El Segundo Field Notes For Internet People",
      brief: "A local-signal post: one place, one observation, one photo/screenshot receipt, one useful map note.",
      action: "Route to Local Signal Scout"
    },
    {
      channel: "Grants",
      title: "Grant Quest: What PointCast Can Ask For Today",
      brief: "A fresh shortlist of funder angles: public goods, AI media literacy, Nouns, Tezos, learning pathways.",
      action: "Update /grants/applications.json"
    },
    {
      channel: "Audio",
      title: "Road-Song Energy For Builders",
      brief: "A soundtrack-style post: why the day needs punch, motion, and confidence without losing care.",
      action: "Open with the user-shared Spotify reference"
    }
  ];
  const studioSignals = [
    {
      href: "/app",
      label: "App",
      title: "The phone home screen is live.",
      note: "Now, rooms, drum, profile, collect, and agents in one installable shell."
    },
    {
      href: "/now",
      label: "Now",
      title: "The live snapshot is the first stop.",
      note: "Latest block, system footprint, contracts, and commit trail."
    },
    {
      href: "/chart",
      label: "Chart",
      title: "A daily data card is live.",
      note: "Two-week block velocity, generated from the ledger, with /chart.json for agents."
    },
    {
      href: "/drum-fives",
      label: "Drum",
      title: "The fives and bell wing has a hub.",
      note: "Quintet, altars, bell fall, jar, pendulum, vespers, and saint."
    },
    {
      href: "/drum-pendulum",
      label: "Pendulum",
      title: "A single brass bell on a rope.",
      note: "Click to push, then let the room decay slowly."
    },
    {
      href: "/for-agents",
      label: "Agents",
      title: "The operating surface is readable.",
      note: "Manifest, pings, status, and machine-readable paths stay close."
    },
    {
      href: "/archive",
      label: "Archive",
      title: "Every receipt stays addressable.",
      note: "The grid is still the ledger; the front door is the orientation."
    }
  ];
  const mondayResetSteps = [
    "Breathe in the Monday light over El Segundo.",
    "Name the clean lane before adding more rooms.",
    "Point people to one room, one game, one agent path."
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/#home",
    name: "PointCast Gamgee front door",
    description: homeDescription,
    url: "https://pointcast.xyz/",
    inLanguage: "en-US",
    hasPart: allBlocks.slice(0, 20).map((b) => ({
      "@type": "CreativeWork",
      "@id": `https://pointcast.xyz/b/${b.data.id}`,
      name: b.data.title,
      datePublished: b.data.timestamp.toISOString(),
      url: `https://pointcast.xyz/b/${b.data.id}`
    }))
  };
  const alternates = [
    { type: "application/json", href: "/blocks.json", title: "All blocks (JSON)" },
    { type: "application/rss+xml", href: "/feed.xml", title: "PointCast (RSS · all blocks)" },
    { type: "application/feed+json", href: "/feed.json", title: "PointCast (JSON Feed 1.1)" },
    ...CHANNEL_LIST.map((c) => ({
      type: "application/rss+xml",
      href: `/c/${c.slug}.rss`,
      title: `PointCast · ${c.name} (RSS)`
    }))
  ];
  const contents = [
    { href: "#monday-reset", label: "Reset", note: "A Monday front-door reset" },
    { href: "#studio-signal", label: "Today", note: "Live rooms and agent paths" },
    { href: "#release", label: "Release", note: "Gamgee RC0 and agent paths" },
    { href: "/areas", label: "Areas", note: "Paddles, meetups, UES, Honey League" },
    { href: "#participation", label: "Participate", note: "Internships, memory, Nouns" },
    { href: "/nouns-nation/", label: "Nouns Nation", note: "V3 desk, TV, federation" },
    { href: "#post-ideas", label: "Post Ideas", note: "Fresh seeds for today" },
    { href: "#pattern", label: "Pattern", note: "Agent-native publishing" },
    { href: "#featured", label: "Featured", note: "Pinned blocks" },
    { href: "#fresh", label: "Fresh", note: "New, mood, and presence" },
    { href: "#nouns-portraits", label: "Portraits", note: "Five Tezos-mintable Nouns" },
    { href: "#network", label: "Network", note: "People, apps, and activity" },
    { href: "#play", label: "Play", note: "Passport, quests, walk, radio" },
    { href: "#wood-chop", label: "Wood Chop", note: "Pixel Nouns collect loop" },
    { href: "#today", label: "Today", note: "Highlights, drop, sports" },
    { href: "#interact", label: "Interact", note: "Polls, random deck, channels" },
    { href: "#feedback", label: "Feedback", note: "Share what should change" },
    { href: "#majors", label: "Majors", note: "Drum, Cast, Meditate" },
    { href: "#blocks", label: "Blocks", note: "Full public grid" },
    { href: "#endpoints", label: "Endpoints", note: "Site map and feeds" }
  ];
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function() {\n    const el = document.getElementById('pc-clock');\n    if (!el) return;\n    const fmt = new Intl.DateTimeFormat('en-US', {\n      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Los_Angeles'\n    });\n    function tick() {\n      const parts = fmt.formatToParts(new Date());\n      const h = parts.find(p => p.type === 'hour')?.value ?? '—';\n      const m = parts.find(p => p.type === 'minute')?.value ?? '—';\n      el.textContent = `${h}:${m} PT`;\n    }\n    tick();\n    setInterval(tick, 10_000);\n  })();\n<\/script>"], ["", " <script>\n  (function() {\n    const el = document.getElementById('pc-clock');\n    if (!el) return;\n    const fmt = new Intl.DateTimeFormat('en-US', {\n      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Los_Angeles'\n    });\n    function tick() {\n      const parts = fmt.formatToParts(new Date());\n      const h = parts.find(p => p.type === 'hour')?.value ?? '—';\n      const m = parts.find(p => p.type === 'minute')?.value ?? '—';\n      el.textContent = \\`\\${h}:\\${m} PT\\`;\n    }\n    tick();\n    setInterval(tick, 10_000);\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Home", "description": homeDescription, "jsonLd": jsonLd, "alternates": alternates, "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: "Open /internships", action: "link", target: "https://pointcast.xyz/internships" },
      { label: "Open /gamgee", action: "link", target: "https://pointcast.xyz/gamgee" },
      { label: "Open /now", action: "link", target: "https://pointcast.xyz/now" },
      { label: "/for-agents", action: "link", target: "https://pointcast.xyz/for-agents" },
      { label: "/agents.json", action: "link", target: "https://pointcast.xyz/agents.json" }
    ]
  }, "data-astro-cid-j7pv25f6": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-j7pv25f6> <h1 class="sr-only" data-astro-cid-j7pv25f6>PointCast Gamgee - an agent-native broadcast from El Segundo with human and machine-readable paths.</h1> <!-- Masthead — one line. Wordmark, block count, current time, agent link. --> <header class="masthead" data-astro-cid-j7pv25f6> <a href="/" class="wordmark" aria-label="PointCast home" data-astro-cid-j7pv25f6>POINTCAST</a> <span class="sep" aria-hidden="true" data-astro-cid-j7pv25f6>·</span> <span class="meta" data-astro-cid-j7pv25f6>${blockCount} BLOCKS</span> <span class="sep" aria-hidden="true" data-astro-cid-j7pv25f6>·</span> <time class="meta time" id="pc-clock" data-astro-cid-j7pv25f6>— : —</time> ${renderComponent($$result2, "PresenceBar", $$PresenceBar, { "data-astro-cid-j7pv25f6": true })} <span class="spacer" aria-hidden="true" data-astro-cid-j7pv25f6></span> ${renderComponent($$result2, "WalletChip", $$WalletChip, { "data-astro-cid-j7pv25f6": true })} <a href="/for-agents" class="agent-link" data-astro-cid-j7pv25f6>/for-agents →</a> </header> ${renderComponent($$result2, "NowLine", $$NowLine, { "blocks": allBlocks, "blockCount": blockCount, "data-astro-cid-j7pv25f6": true })} ${leadShip && renderTemplate`<section class="ship-hero" aria-label="Most recent PointCast ships" data-astro-cid-j7pv25f6> <div class="ship-hero__copy" data-astro-cid-j7pv25f6> <p class="ship-hero__kicker mono" data-astro-cid-j7pv25f6>LIVE SHIP ROOM · MOST RECENT FIRST</p> <h2 data-astro-cid-j7pv25f6>PointCast is shipping while the page is open.</h2> <p class="ship-hero__dek" data-astro-cid-j7pv25f6>
The front door now opens on Monday proof: clean shipping lane,
            latest block, bell-wing rooms, agent paths, and new receipts landing as the work moves.
</p> <div class="ship-hero__actions" aria-label="Primary actions" data-astro-cid-j7pv25f6> <a class="ship-hero__action ship-hero__action--primary mono"${addAttribute(`/b/${leadShip.data.id}`, "href")} data-astro-cid-j7pv25f6>Open latest ship</a> <a class="ship-hero__action mono" href="/app" data-astro-cid-j7pv25f6>Open app</a> <a class="ship-hero__action mono" href="/chart" data-astro-cid-j7pv25f6>Chart</a> <a class="ship-hero__action mono" href="/status" data-astro-cid-j7pv25f6>Full ledger</a> ${leadShip.data.external?.url && renderTemplate`<a class="ship-hero__action mono"${addAttribute(leadShip.data.external.url, "href")} data-astro-cid-j7pv25f6>Run it</a>`} </div> <dl class="ship-hero__stats" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6><dt data-astro-cid-j7pv25f6>${blockCount}</dt><dd data-astro-cid-j7pv25f6>blocks live</dd></div> <div data-astro-cid-j7pv25f6><dt data-astro-cid-j7pv25f6>${latestShips.length}</dt><dd data-astro-cid-j7pv25f6>fresh ships pinned</dd></div> <div data-astro-cid-j7pv25f6><dt data-astro-cid-j7pv25f6>${prettyShipTime(leadShip.data.timestamp)}</dt><dd data-astro-cid-j7pv25f6>latest stamp</dd></div> </dl> </div> <div class="ship-hero__lead" data-astro-cid-j7pv25f6> ${renderComponent($$result2, "BlockCard", $$BlockCard, { "block": leadShip, "data-astro-cid-j7pv25f6": true })} </div> <div class="ship-hero__rail" aria-label="Recent ships" data-astro-cid-j7pv25f6> ${shipDeck.map((block) => renderTemplate`<a class="ship-tile"${addAttribute(`/b/${block.data.id}`, "href")} data-astro-cid-j7pv25f6> <span class="ship-tile__meta mono" data-astro-cid-j7pv25f6>CH.${block.data.channel} · ${block.data.id} · ${block.data.type}</span> <strong data-astro-cid-j7pv25f6>${block.data.title}</strong> <span data-astro-cid-j7pv25f6>${block.data.dek}</span> </a>`)} </div> <nav class="ship-hero__shortcuts mono" aria-label="Fast paths" data-astro-cid-j7pv25f6> <a href="/app" data-astro-cid-j7pv25f6>App</a> <a href="/chart" data-astro-cid-j7pv25f6>Chart</a> <a href="/now" data-astro-cid-j7pv25f6>Now</a> <a href="/rooms" data-astro-cid-j7pv25f6>Rooms</a> <a href="/drum-fives" data-astro-cid-j7pv25f6>Drum Fives</a> <a href="/profile" data-astro-cid-j7pv25f6>Profile</a> <a href="/nouns-nation/" data-astro-cid-j7pv25f6>Nouns Nation</a> </nav> </section>`} <section id="monday-reset" class="monday-meditation" aria-labelledby="monday-reset-title" data-astro-cid-j7pv25f6> <div class="monday-meditation__copy" data-astro-cid-j7pv25f6> <p class="monday-meditation__kicker" data-astro-cid-j7pv25f6>Monday reset / 90 seconds</p> <h2 id="monday-reset-title" class="monday-meditation__title" data-astro-cid-j7pv25f6>Make the system easy to enter again.</h2> <p class="monday-meditation__dek" data-astro-cid-j7pv25f6>
Monday starts with the lane. PointCast keeps the useful pace: preserve the WIP shelf, ship from the clean worktree, point people toward the best rooms, then publish the next proof.
</p> </div> <ol class="monday-meditation__steps" aria-label="Monday reset steps" data-astro-cid-j7pv25f6> ${mondayResetSteps.map((step) => renderTemplate`<li data-astro-cid-j7pv25f6>${step}</li>`)} </ol> <a class="monday-meditation__link" href="/meditate" data-astro-cid-j7pv25f6>Open /meditate</a> </section> <section id="studio-signal" class="studio-signal" aria-labelledby="studio-signal-title" data-astro-cid-j7pv25f6> <div class="studio-signal__skyline" aria-hidden="true" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> </div> <div class="studio-signal__inner" data-astro-cid-j7pv25f6> <div class="studio-signal__copy" data-astro-cid-j7pv25f6> <p class="studio-signal__kicker" data-astro-cid-j7pv25f6>Monday / El Segundo / Shipping mode</p> <h2 id="studio-signal-title" class="studio-signal__title" data-astro-cid-j7pv25f6>New work is on the front door.</h2> <p class="studio-signal__dek" data-astro-cid-j7pv25f6>
PointCast is in clean Monday mode: latest ship first, bell-wing rooms visible, agent surfaces close at hand, and every fresh block still addressable for humans and agents.
</p> <div class="studio-signal__weather" aria-label="Monday mood" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>Clean lane ready</span> <span data-astro-cid-j7pv25f6>Bell wing open</span> <span data-astro-cid-j7pv25f6>Agents routed</span> </div> </div> <div class="studio-signal__right" data-astro-cid-j7pv25f6> <div class="studio-signal__hearth" aria-label="Color fireplace" data-astro-cid-j7pv25f6> <span class="studio-signal__flame studio-signal__flame--outer" data-astro-cid-j7pv25f6></span> <span class="studio-signal__flame studio-signal__flame--middle" data-astro-cid-j7pv25f6></span> <span class="studio-signal__flame studio-signal__flame--inner" data-astro-cid-j7pv25f6></span> <span class="studio-signal__log studio-signal__log--one" data-astro-cid-j7pv25f6></span> <span class="studio-signal__log studio-signal__log--two" data-astro-cid-j7pv25f6></span> </div> <nav class="studio-signal__links" aria-label="Monday PointCast paths" data-astro-cid-j7pv25f6> ${studioSignals.map((signal) => renderTemplate`<a${addAttribute(signal.href, "href")} class="studio-signal__link" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${signal.label}</span> <strong data-astro-cid-j7pv25f6>${signal.title}</strong> <em data-astro-cid-j7pv25f6>${signal.note}</em> </a>`)} </nav> </div> </div> </section> <nav class="contents" aria-labelledby="contents-title" data-astro-cid-j7pv25f6> <div class="contents__header" data-astro-cid-j7pv25f6> <p class="contents__eyebrow" data-astro-cid-j7pv25f6>Table of Contents</p> <h2 id="contents-title" class="contents__title" data-astro-cid-j7pv25f6>What is on PointCast</h2> </div> <ol class="contents__list" data-astro-cid-j7pv25f6> ${contents.map((item, index) => renderTemplate`<li class="contents__item" data-astro-cid-j7pv25f6> <a${addAttribute(item.href, "href")} class="contents__link" data-astro-cid-j7pv25f6> <span class="contents__number" data-astro-cid-j7pv25f6>${String(index + 1).padStart(2, "0")}</span> <span class="contents__copy" data-astro-cid-j7pv25f6> <span class="contents__label" data-astro-cid-j7pv25f6>${item.label}</span> <span class="contents__note" data-astro-cid-j7pv25f6>${item.note}</span> </span> </a> </li>`)} </ol> <div class="contents__routes" aria-label="Common PointCast routes" data-astro-cid-j7pv25f6> <a href="/now" data-astro-cid-j7pv25f6>/now</a> <a href="/chart" data-astro-cid-j7pv25f6>/chart</a> <a href="/areas" data-astro-cid-j7pv25f6>/areas</a> <a href="/for-agents" data-astro-cid-j7pv25f6>/for-agents</a> <a href="/search" data-astro-cid-j7pv25f6>/search</a> <a href="/archive" data-astro-cid-j7pv25f6>/archive</a> <a href="/blocks.json" data-astro-cid-j7pv25f6>/blocks.json</a> </div> </nav> ${renderComponent($$result2, "HomeFireplace", $$HomeFireplace, { "data-astro-cid-j7pv25f6": true })} <section id="release" class="gamgee-front-door" aria-labelledby="gamgee-front-door-title" data-astro-cid-j7pv25f6> <div class="gamgee-front-door__copy" data-astro-cid-j7pv25f6> <p class="gamgee-front-door__kicker" data-astro-cid-j7pv25f6>Fresh home signal</p> <h2 id="gamgee-front-door-title" class="gamgee-front-door__title" data-astro-cid-j7pv25f6>PointCast is live work, posted while the day is still moving.</h2> <p class="gamgee-front-door__dek" data-astro-cid-j7pv25f6>Today the front door points at participation: internships, memory notes, Nouns interest, information gathering, rewards, grants, rooms, and the confidence to make something useful enough to remember.</p> <ul class="gamgee-front-door__signals" aria-label="Gamgee release signals" data-astro-cid-j7pv25f6> <li data-astro-cid-j7pv25f6>${blockCount} blocks</li> <li data-astro-cid-j7pv25f6>Claude + Codex + Manus</li> <li data-astro-cid-j7pv25f6>Build it, stamp it, remember it</li> </ul> </div> <nav class="gamgee-front-door__paths" aria-label="Gamgee entry points" data-astro-cid-j7pv25f6> <a href="/internships/" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For interns</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/internships</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Build like you will remember this moment.</span> </a> <a href="/internships/#nouns-interest" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For Nouns</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/internships/#nouns-interest</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Configure, stamp, message PointCast.</span> </a> <a href="/now" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For humans</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/now</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>See what is live today.</span> </a> <a href="/app" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For phones</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/app</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Install the PointCast shell.</span> </a> <a href="/rooms" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For rooms</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/rooms</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Bath · Drum · Anytime — all rooms.</span> </a> <a href="/marketplace" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For collectors</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/marketplace</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Buy and list PointCast NFTs on Tezos.</span> </a> <a href="/profile" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For you</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/profile</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Your collection, mood, rooms visited.</span> </a> <a href="/for-agents" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For agents</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/for-agents</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Read the operating surface.</span> </a> <a href="/agents.json" class="gamgee-front-door__path" data-astro-cid-j7pv25f6> <span class="gamgee-front-door__label" data-astro-cid-j7pv25f6>For tools</span> <span class="gamgee-front-door__target" data-astro-cid-j7pv25f6>/agents.json</span> <span class="gamgee-front-door__note" data-astro-cid-j7pv25f6>Parse the canonical manifest.</span> </a> </nav> ${renderComponent($$result2, "AgentLedger", $$AgentLedger, { "data-astro-cid-j7pv25f6": true })} </section> <section id="participation" class="participation-home" aria-labelledby="participation-home-title" data-astro-cid-j7pv25f6> <div class="participation-home__head" data-astro-cid-j7pv25f6> <p class="participation-home__kicker" data-astro-cid-j7pv25f6>Participation engine</p> <h2 id="participation-home-title" class="participation-home__title" data-astro-cid-j7pv25f6>Do the work you will want to remember.</h2> <p class="participation-home__dek" data-astro-cid-j7pv25f6>
The new PointCast path is simple: gather the information, make the useful thing, leave the receipt, help the next person, and write down the moment you became sharper.
</p> </div> <div class="participation-home__grid" data-astro-cid-j7pv25f6> ${participationCards.map((card) => renderTemplate`<a${addAttribute(card.href, "href")} class="participation-home__card" data-astro-cid-j7pv25f6> <span class="participation-home__label" data-astro-cid-j7pv25f6>${card.label}</span> <strong data-astro-cid-j7pv25f6>${card.title}</strong> <span data-astro-cid-j7pv25f6>${card.note}</span> </a>`)} </div> <div class="participation-home__actions" aria-label="Participation actions" data-astro-cid-j7pv25f6> <a href="/internships/program.json" data-astro-cid-j7pv25f6>program.json</a> <a href="/internships/roles.json" data-astro-cid-j7pv25f6>roles.json</a> <a href="/rewards/" data-astro-cid-j7pv25f6>task rewards</a> <a href="/grants/" data-astro-cid-j7pv25f6>grant quest</a> <a href="/ping/" data-astro-cid-j7pv25f6>ping to participate</a> </div> </section> <section id="post-ideas" class="today-ideas" aria-labelledby="today-ideas-title" data-astro-cid-j7pv25f6> <div class="today-ideas__head" data-astro-cid-j7pv25f6> <p class="today-ideas__kicker" data-astro-cid-j7pv25f6>Today fresh post ideas</p> <h2 id="today-ideas-title" class="today-ideas__title" data-astro-cid-j7pv25f6>Eight sparks with road-song confidence.</h2> <p class="today-ideas__dek" data-astro-cid-j7pv25f6>
Quick post seeds for the next PointCast run: lively, useful, source-backed, and ready to become blocks, pings, or grant/reward artifacts.
</p> </div> <div class="today-ideas__rail" data-astro-cid-j7pv25f6> ${todayPostIdeas.map((idea, index) => renderTemplate`<article class="today-ideas__card" data-astro-cid-j7pv25f6> <span class="today-ideas__number" data-astro-cid-j7pv25f6>${String(index + 1).padStart(2, "0")}</span> <span class="today-ideas__channel" data-astro-cid-j7pv25f6>${idea.channel}</span> <h3 data-astro-cid-j7pv25f6>${idea.title}</h3> <p data-astro-cid-j7pv25f6>${idea.brief}</p> <strong data-astro-cid-j7pv25f6>${idea.action}</strong> </article>`)} </div> </section> <section id="pattern" class="agent-native-brief" aria-labelledby="agent-native-brief-title" data-astro-cid-j7pv25f6> <div class="agent-native-brief__copy" data-astro-cid-j7pv25f6> <p class="agent-native-brief__kicker" data-astro-cid-j7pv25f6>Agent-native publishing · new explainer</p> <h2 id="agent-native-brief-title" class="agent-native-brief__title" data-astro-cid-j7pv25f6>A website for people and agents at the same time.</h2> <p class="agent-native-brief__dek" data-astro-cid-j7pv25f6>
The new pattern page turns PointCast into a reference implementation:
          canonical human pages, JSON mirrors, discovery manifests, feeds,
          sitemaps, LLM context, and citation-ready permalinks.
</p> <div class="agent-native-brief__nouns" aria-label="Nouns signal markers" data-astro-cid-j7pv25f6> ${[313, 523, 742, 1042].map((nounId) => renderTemplate`<a${addAttribute(`https://noun.pics/${nounId}.svg`, "href")} target="_blank" rel="noopener" class="agent-native-brief__noun" data-astro-cid-j7pv25f6> <img${addAttribute(`https://noun.pics/${nounId}.svg`, "src")}${addAttribute(`Noun ${nounId}`, "alt")} width="44" height="44" loading="lazy" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>N${nounId}</span> </a>`)} </div> </div> <div class="agent-native-brief__matrix" aria-label="Agent-native publishing surfaces" data-astro-cid-j7pv25f6> <a href="/agent-native-publishing" class="agent-native-brief__cell agent-native-brief__cell--primary" data-astro-cid-j7pv25f6> <span class="agent-native-brief__label" data-astro-cid-j7pv25f6>Pattern</span> <strong data-astro-cid-j7pv25f6>/agent-native-publishing</strong> <span data-astro-cid-j7pv25f6>Six rules plus the reusable brief.</span> </a> <a href="/agents.json" class="agent-native-brief__cell" data-astro-cid-j7pv25f6> <span class="agent-native-brief__label" data-astro-cid-j7pv25f6>Manifest</span> <strong data-astro-cid-j7pv25f6>/agents.json</strong> <span data-astro-cid-j7pv25f6>One request maps the surface.</span> </a> <a href="/llms.txt" class="agent-native-brief__cell" data-astro-cid-j7pv25f6> <span class="agent-native-brief__label" data-astro-cid-j7pv25f6>Context</span> <strong data-astro-cid-j7pv25f6>/llms.txt</strong> <span data-astro-cid-j7pv25f6>Short answer and retrieval order.</span> </a> <a href="/BLOCKS.md" class="agent-native-brief__cell" data-astro-cid-j7pv25f6> <span class="agent-native-brief__label" data-astro-cid-j7pv25f6>Schema</span> <strong data-astro-cid-j7pv25f6>/BLOCKS.md</strong> <span data-astro-cid-j7pv25f6>Stable Block primitive.</span> </a> </div> <ul class="agent-native-brief__signals" aria-label="Agent-native publishing checklist" data-astro-cid-j7pv25f6> <li data-astro-cid-j7pv25f6>human HTML</li> <li data-astro-cid-j7pv25f6>JSON mirrors</li> <li data-astro-cid-j7pv25f6>stable IDs</li> <li data-astro-cid-j7pv25f6>RSS + JSON Feed</li> <li data-astro-cid-j7pv25f6>LLM context</li> <li data-astro-cid-j7pv25f6>citation contract</li> </ul> </section> ${helloMikeBlock && renderTemplate`<section id="featured" class="hello-module" aria-label="Hello Mike module" data-astro-cid-j7pv25f6> ${renderComponent($$result2, "BlockCard", $$BlockCard, { "block": helloMikeBlock, "data-astro-cid-j7pv25f6": true })} </section>`} ${firstBlock && renderTemplate`<section${addAttribute(helloMikeBlock ? void 0 : "featured", "id")} class="first-block" aria-label="Featured block on PointCast" data-astro-cid-j7pv25f6> ${renderComponent($$result2, "BlockCard", $$BlockCard, { "block": firstBlock, "data-astro-cid-j7pv25f6": true })} </section>`} <div id="fresh" class="section-anchor" aria-hidden="true" data-astro-cid-j7pv25f6></div> <!-- Fresh strip — top-of-page freshness signal + one-tap action.
         Per Mike 2026-04-19 morning feedback "top not fresh enough and
         nothing to do". Shows HELLO / N NEW / CAUGHT UP badges based on
         localStorage lastVisit; CTA routes to newest or random older. --> ${renderComponent($$result2, "FreshStrip", $$FreshStrip, { "data-astro-cid-j7pv25f6": true })} <!-- MoodChip — moved to top per Mike 2026-04-20 13:55 PT: "yah let
         move mood up, and then yah make the selection of the mood change
         the mood, that animation, and yah the ability to play music,
         neater ui and then you are rolling thru the site in that mood."
         Setting your mood first means every page that follows renders
         with the tint + the soundtrack follows you. --> ${renderComponent($$result2, "MoodChip", $$MoodChip, { "data-astro-cid-j7pv25f6": true })} <!-- Visitor "peoples here" strip — represents YOU as a noun avatar +
         ghost slots that light up when other visitors connect. Per Mike
         2026-04-19 20:30 PT. --> ${renderComponent($$result2, "VisitorHereStrip", $$VisitorHereStrip, { "data-astro-cid-j7pv25f6": true })} <!-- Kettle invitation — cozy multiplayer kitchen at /kettle. Per
         Mike 2026-04-27: "fun publish and lets do another kettle or
         coffee play, something fun to participate with." Sits between
         VisitorHereStrip (you-are-here) and NounsPortraitStrip (you-can-
         collect) so the invitation reads "you're here, the kettle is on,
         go stoke it." --> <!-- Drum Press marquee — doorway to the catalog. Per Mike 2026-04-29:
         "rethink homepage for drum and an almost publishing house that
         published tons of drum media." Reframes 47+ /drum* surfaces as
         a publishing house with eight imprints. Sits at the top of the
         drum-related strips so the homepage reads "drum has a press →
         agents have a lane → kettle is on → nouns are collectible". --> ${renderComponent($$result2, "DrumPressMarquee", $$DrumPressMarquee, { "data-astro-cid-j7pv25f6": true })} <!-- Agent lane — machine-readable front door. Per Mike 2026-04-29:
         "make a whole area for agents to interact, an agent drum surface
         and then well compact." Sits right after VisitorHereStrip so a
         human visitor sees both lanes (you, your peers) and (the agents,
         their door) in the first scroll. Compact green-on-black terminal
         strip linking /drum-agent (play), /drum-agents (Hall directory),
         /api/mcp (24-tool JSON-RPC), /connectors (addable client links). --> ${renderComponent($$result2, "AgentLane", $$AgentLane, { "data-astro-cid-j7pv25f6": true })} <!-- Birthday lane — the Birthday Imprint of /drum-press. Per Mike
         2026-04-29: "a bunch of birthday drum apps, different ways to
         celebrate one's birthday with collaborative drumming, neat
         unfurl, ability to potentially customize, ways to share and
         smile, everyone likes to hit the drum." Four cards link to
         /drum-birthday (hub), /drum-cake (light/blow candles),
         /drum-card (collab signatures), /drum-pinata (burst at 100).
         Each surface accepts ?for=NAME&from=YOU&age=N for personalized
         unfurl + page text. Sits after AgentLane so the homepage flow
         reads: you → agents → today's birthday → kettle → nouns. --> ${renderComponent($$result2, "BirthdayLane", $$BirthdayLane, { "data-astro-cid-j7pv25f6": true })} <!-- Drum VS lane — 1v1 friend duels (tug or race). Per Mike
         2026-04-30: "more drum, this time, as games to send to friends
         1v1." WebRTC P2P data channel for sub-50ms taps once both
         seated; KV reconcile slow lane is always-on. URL is the
         invite — share via iMessage/WhatsApp from the game page. --> ${renderComponent($$result2, "DrumVsLane", $$DrumVsLane, { "data-astro-cid-j7pv25f6": true })} <!-- Drum League — community competition layer. Per Mike 2026-04-30:
         "community competition, league, uplifting, nouns, participatory."
         Cooperative-with-a-leaderboard: every tap on every /drum-* surface
         ticks the same shared counter. Top 12 contributors get a Sunday
         portrait. Strip shows live count + top 3 + CTA. --> ${renderComponent($$result2, "DrumLeagueStrip", $$DrumLeagueStrip, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "KettleStrip", $$KettleStrip, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "NounsPortraitStrip", $$NounsPortraitStrip, { "context": "home", "data-astro-cid-j7pv25f6": true })} <!-- Drum Crew — six mintable Nouns, one per drum room. Per Mike
         2026-04-27: "have a look at the homepage, try to add some
         nouns blocks for collecting." Sits right under
         NounsPortraitStrip so the two collecting modules share the
         same visual neighborhood. Same Visit Nouns FA2, different
         seeds, themed to the nine drum surfaces + /api/mcp. --> ${renderComponent($$result2, "DrumCrewStrip", $$DrumCrewStrip, { "context": "home", "data-astro-cid-j7pv25f6": true })} <div id="network" class="section-anchor" aria-hidden="true" data-astro-cid-j7pv25f6></div> <!-- Network strip — surfaces /here (live congregation), /for-nodes
         (become a node), /workbench (who's building what). Per Mike
         2026-04-20 11:15 PT: "look to refresh homepage, include new
         blocks, approach, etc · i'm pushing claude, codex and soon manus
         to start interacting, let me know if there is a page we can
         track that activity". --> ${renderComponent($$result2, "NetworkStrip", $$NetworkStrip, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "AppLaunchStrip", $$AppLaunchStrip, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "WalletShelfModule", $$WalletShelfModule, { "data-astro-cid-j7pv25f6": true })} <div id="play" class="section-anchor" aria-hidden="true" data-astro-cid-j7pv25f6></div> ${renderComponent($$result2, "ZenCatTodayCard", $$ZenCatTodayCard, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "PointCastPlayStrip", $$PointCastPlayStrip, { "data-astro-cid-j7pv25f6": true })} <div id="wood-chop" class="section-anchor" aria-hidden="true" data-astro-cid-j7pv25f6></div> ${renderComponent($$result2, "NounsWoodChopStrip", $$NounsWoodChopStrip, { "data-astro-cid-j7pv25f6": true })} <div id="today" class="section-anchor" aria-hidden="true" data-astro-cid-j7pv25f6></div> <!-- Today on PointCast — hand-curated day-specific highlights.
         Per Mike 2026-04-20 12:20 PT: "on homepage, it should likely
         be all the interesting things we were talking about today from
         clock to bitcoin, to 420, to feature updates, to things to try,
         to learnings, to how to learn, to entertainment, kinda thing.
         Monday reset keeps the latest ships first. --> ${renderComponent($$result2, "TodayOnPointCast", $$TodayOnPointCast, { "data-astro-cid-j7pv25f6": true })} <!-- Daily drop collect inline. Per Mike 2026-04-20 13:20 PT:
         "have on homepage, ability to collect daily drop." Shared
         localStorage with /today so claim here, claim there, same count. --> ${renderComponent($$result2, "DailyDropStrip", $$DailyDropStrip, { "data-astro-cid-j7pv25f6": true })} <!-- Sports Desk — BTL cadence + Bowl-path anchor. Per Mike
         2026-05-04 sprint plan "Bowl path visible, cadence kept":
         the Thu→Sat→Mon trilogy needs a permanent home fixture so
         the desk doesn't age out of the grid. Lives just above the
         real-league SportsStrip so the two sports surfaces cluster. --> ${renderComponent($$result2, "SportsDeskStrip", $$SportsDeskStrip, { "data-astro-cid-j7pv25f6": true })} <!-- Sports — recent global-major results. Per Mike 2026-04-20
         13:20 PT: "try a couple of sports updates of the latest results
         from last night or today, start with global major." Client-side
         fetches ESPN scoreboards, 10-min cache. --> ${renderComponent($$result2, "LASportsTicker", $$LASportsTicker, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "SportsStrip", $$SportsStrip, { "data-astro-cid-j7pv25f6": true })} <div id="interact" class="section-anchor" aria-hidden="true" data-astro-cid-j7pv25f6></div>   <!-- Live polls strip — pool now includes 4 fresh polls (codex-project
         bet, sunday-ES, april-register, sunday-soundtrack) on top of the
         existing 12. Per Mike 2026-04-19 21:55 PT "more fresh polls". --> ${renderComponent($$result2, "PollsOnHome", $$PollsOnHome, { "data-astro-cid-j7pv25f6": true })} <!-- Fresh deck — 3 random blocks cloned client-side from the grid below
         so every page-view gets a different top. Per Mike 2026-04-18 block
         0272 + /sprint pick. --> ${renderComponent($$result2, "FreshDeck", $$FreshDeck, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "BuddhaHeadRotator", $$BuddhaHeadRotator, { "context": "home", "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "FeedbackBlock", $$FeedbackBlock, { "data-astro-cid-j7pv25f6": true })} <!-- Channel legend — sticky-horizontal on mobile, flex-wrap on desktop. --> <nav class="channels" aria-label="Channels" data-astro-cid-j7pv25f6> ${CHANNEL_LIST.map((ch) => renderTemplate`<a class="chip"${addAttribute(`/c/${ch.slug}`, "href")}${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-j7pv25f6> <span class="chip__dot" aria-hidden="true" data-astro-cid-j7pv25f6></span> <span class="chip__code" data-astro-cid-j7pv25f6>CH.${ch.code}</span> <span class="chip__name" data-astro-cid-j7pv25f6>${ch.name}</span> </a>`)} </nav> <!-- Majors — inline modules for /drum + /cast + /meditate.
         Mike 2026-04-17: "make sure the majors, like drum or pool
         together, have some type of module on the home page prior to
         click" + "likely have ability to drum get started". --> <div id="majors" class="section-anchor" aria-hidden="true" data-astro-cid-j7pv25f6></div> <!-- /sit live ribbon — only visible when N>0. Hidden on first render. --> ${renderComponent($$result2, "SitTile", $$SitTile, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "HomeMajors", $$HomeMajors, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "NativePlantingYield", $$NativePlantingYield, { "data-astro-cid-j7pv25f6": true })} <!-- The grid — every block. Drag-and-drop reordering is client-side +
         localStorage-only; no server state. --> ${renderComponent($$result2, "BlockReorder", $$BlockReorder, { "data-astro-cid-j7pv25f6": true }, { "default": async ($$result3) => renderTemplate` <section id="blocks" class="grid" role="main" data-astro-cid-j7pv25f6> ${blocks.map((block) => renderTemplate`${renderComponent($$result3, "BlockCard", $$BlockCard, { "block": block, "data-astro-cid-j7pv25f6": true })}`)} </section> ` })} <!-- Footer — endpoint list. Agent-oriented, no social nav. --> <footer id="endpoints" class="endpoints" data-astro-cid-j7pv25f6> <p class="endpoints__label" data-astro-cid-j7pv25f6>ENDPOINTS</p> <ul class="endpoints__list" data-astro-cid-j7pv25f6> <li data-astro-cid-j7pv25f6><a href="/manifesto" data-astro-cid-j7pv25f6>/manifesto</a></li> <li data-astro-cid-j7pv25f6><a href="/dao" data-astro-cid-j7pv25f6>/dao</a></li> <li data-astro-cid-j7pv25f6><a href="/yield" data-astro-cid-j7pv25f6>/yield</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-cola" data-astro-cid-j7pv25f6>/nouns-cola</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-cola-crush" data-astro-cid-j7pv25f6>/nouns-cola-crush</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-wood-chop" data-astro-cid-j7pv25f6>/nouns-wood-chop</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-wood-chop.json" data-astro-cid-j7pv25f6>/nouns-wood-chop.json</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-cards" data-astro-cid-j7pv25f6>/nouns-cards</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-cards-v2" data-astro-cid-j7pv25f6>/nouns-cards-v2</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-cards-v3" data-astro-cid-j7pv25f6>/nouns-cards-v3</a></li> <li data-astro-cid-j7pv25f6><a href="/nouns-portraits" data-astro-cid-j7pv25f6>/nouns-portraits</a></li> <li data-astro-cid-j7pv25f6><a href="/internships" data-astro-cid-j7pv25f6>/internships</a></li> <li data-astro-cid-j7pv25f6><a href="/internships/program.json" data-astro-cid-j7pv25f6>/internships/program.json</a></li> <li data-astro-cid-j7pv25f6><a href="/internships/roles.json" data-astro-cid-j7pv25f6>/internships/roles.json</a></li> <li data-astro-cid-j7pv25f6><a href="/rewards" data-astro-cid-j7pv25f6>/rewards</a></li> <li data-astro-cid-j7pv25f6><a href="/grants" data-astro-cid-j7pv25f6>/grants</a></li> <li data-astro-cid-j7pv25f6><a href="/linktree" data-astro-cid-j7pv25f6>/linktree</a></li> <li data-astro-cid-j7pv25f6><a href="/publish" data-astro-cid-j7pv25f6>/publish</a></li> <li data-astro-cid-j7pv25f6><a href="/beacon" data-astro-cid-j7pv25f6>/beacon</a></li> <li data-astro-cid-j7pv25f6><a href="/nature" data-astro-cid-j7pv25f6>/nature</a></li> <li data-astro-cid-j7pv25f6><a href="/garden-yield" data-astro-cid-j7pv25f6>/garden-yield</a></li> <li data-astro-cid-j7pv25f6><a href="/houseplants" data-astro-cid-j7pv25f6>/houseplants</a></li> <li data-astro-cid-j7pv25f6><a href="/nature-yield.json" data-astro-cid-j7pv25f6>/nature-yield.json</a></li> <li data-astro-cid-j7pv25f6><a href="/gamgee" data-astro-cid-j7pv25f6>/gamgee</a></li> <li data-astro-cid-j7pv25f6><a href="/meditate" data-astro-cid-j7pv25f6>/meditate</a></li> <li data-astro-cid-j7pv25f6><a href="/protocol" data-astro-cid-j7pv25f6>/protocol</a></li> <li data-astro-cid-j7pv25f6><a href="/messages" data-astro-cid-j7pv25f6>/messages</a></li> <li data-astro-cid-j7pv25f6><a href="/messages/demo" data-astro-cid-j7pv25f6>/messages/demo</a></li> <li data-astro-cid-j7pv25f6><a href="/messages/chain" data-astro-cid-j7pv25f6>/messages/chain</a></li> <li data-astro-cid-j7pv25f6><a href="/agent-native-publishing" data-astro-cid-j7pv25f6>/agent-native-publishing</a></li> <li data-astro-cid-j7pv25f6><a href="/glossary" data-astro-cid-j7pv25f6>/glossary</a></li> <li data-astro-cid-j7pv25f6><a href="/now" data-astro-cid-j7pv25f6>/now</a></li> <li data-astro-cid-j7pv25f6><a href="/search" data-astro-cid-j7pv25f6>/search</a></li> <li data-astro-cid-j7pv25f6><a href="/archive" data-astro-cid-j7pv25f6>/archive</a></li> <li data-astro-cid-j7pv25f6><a href="/timeline" data-astro-cid-j7pv25f6>/timeline</a></li> <li data-astro-cid-j7pv25f6><a href="/editions" data-astro-cid-j7pv25f6>/editions</a></li> <li data-astro-cid-j7pv25f6><a href="/subscribe" data-astro-cid-j7pv25f6>/subscribe</a></li> <li data-astro-cid-j7pv25f6><a href="/changelog" data-astro-cid-j7pv25f6>/changelog</a></li> <li data-astro-cid-j7pv25f6><a href="/stack" data-astro-cid-j7pv25f6>/stack</a></li> <li data-astro-cid-j7pv25f6><a href="/ai-stack" data-astro-cid-j7pv25f6>/ai-stack</a></li> <li data-astro-cid-j7pv25f6><a href="/yee" data-astro-cid-j7pv25f6>/yee</a></li> <li data-astro-cid-j7pv25f6><a href="/mesh" data-astro-cid-j7pv25f6>/mesh</a></li> <li data-astro-cid-j7pv25f6><a href="/collabs" data-astro-cid-j7pv25f6>/collabs</a></li> <li data-astro-cid-j7pv25f6><a href="/ping" data-astro-cid-j7pv25f6>/ping</a></li> <li data-astro-cid-j7pv25f6><a href="/sprint" data-astro-cid-j7pv25f6>/sprint</a></li> <li data-astro-cid-j7pv25f6><a href="/sprints" data-astro-cid-j7pv25f6>/sprints</a></li> <li data-astro-cid-j7pv25f6><a href="/drop" data-astro-cid-j7pv25f6>/drop</a></li> <li data-astro-cid-j7pv25f6><a href="/products" data-astro-cid-j7pv25f6>/products</a></li> <li data-astro-cid-j7pv25f6><a href="/polls" data-astro-cid-j7pv25f6>/polls</a></li> <li data-astro-cid-j7pv25f6><a href="/briefs" data-astro-cid-j7pv25f6>/briefs</a></li> <li data-astro-cid-j7pv25f6><a href="/gallery" data-astro-cid-j7pv25f6>/gallery</a></li> <li data-astro-cid-j7pv25f6><a href="/moods" data-astro-cid-j7pv25f6>/moods</a></li> <li data-astro-cid-j7pv25f6><a href="/local" data-astro-cid-j7pv25f6>/local</a></li> <li data-astro-cid-j7pv25f6><a href="/play" data-astro-cid-j7pv25f6>/play</a></li> <li data-astro-cid-j7pv25f6><a href="/play.json" data-astro-cid-j7pv25f6>/play.json</a></li> <li data-astro-cid-j7pv25f6><a href="/passport" data-astro-cid-j7pv25f6>/passport</a></li> <li data-astro-cid-j7pv25f6><a href="/quests" data-astro-cid-j7pv25f6>/quests</a></li> <li data-astro-cid-j7pv25f6><a href="/walk" data-astro-cid-j7pv25f6>/walk</a></li> <li data-astro-cid-j7pv25f6><a href="/room-weather" data-astro-cid-j7pv25f6>/room-weather</a></li> <li data-astro-cid-j7pv25f6><a href="/radio" data-astro-cid-j7pv25f6>/radio</a></li> <li data-astro-cid-j7pv25f6><a href="/routes" data-astro-cid-j7pv25f6>/routes</a></li> <li data-astro-cid-j7pv25f6><a href="/builders" data-astro-cid-j7pv25f6>/builders</a></li> <li data-astro-cid-j7pv25f6><a href="/civic" data-astro-cid-j7pv25f6>/civic</a></li> <li data-astro-cid-j7pv25f6><a href="/pet" data-astro-cid-j7pv25f6>/pet</a></li> <li data-astro-cid-j7pv25f6><a href="/zen-cats" data-astro-cid-j7pv25f6>/zen-cats</a></li> <li data-astro-cid-j7pv25f6><a href="/zen-cats.json" data-astro-cid-j7pv25f6>/zen-cats.json</a></li> <li data-astro-cid-j7pv25f6><a href="/today" data-astro-cid-j7pv25f6>/today ★</a></li> <li data-astro-cid-j7pv25f6><a href="/tv" data-astro-cid-j7pv25f6>/tv ↗</a></li> <li data-astro-cid-j7pv25f6><a href="/tv/assets" data-astro-cid-j7pv25f6>/tv/assets</a></li> <li data-astro-cid-j7pv25f6><a href="/eth-legacy" data-astro-cid-j7pv25f6>/eth-legacy</a></li> <li data-astro-cid-j7pv25f6><a href="/shop" data-astro-cid-j7pv25f6>/shop</a></li> <li data-astro-cid-j7pv25f6><a href="/agents.json" data-astro-cid-j7pv25f6>/agents.json</a></li> <li data-astro-cid-j7pv25f6><a href="/app" data-astro-cid-j7pv25f6>/app</a></li> <li data-astro-cid-j7pv25f6><a href="/blocks.json" data-astro-cid-j7pv25f6>/blocks.json</a></li> <li data-astro-cid-j7pv25f6><a href="/for-agents" data-astro-cid-j7pv25f6>/for-agents</a></li> <li data-astro-cid-j7pv25f6><a href="/agent-derby" data-astro-cid-j7pv25f6>/agent-derby</a></li> <li data-astro-cid-j7pv25f6><a href="/agent-derby.json" data-astro-cid-j7pv25f6>/agent-derby.json</a></li> <li data-astro-cid-j7pv25f6><a href="/battle" data-astro-cid-j7pv25f6>/battle</a></li> <li data-astro-cid-j7pv25f6><a href="/cast" data-astro-cid-j7pv25f6>/cast</a></li> <li data-astro-cid-j7pv25f6><a href="/drum" data-astro-cid-j7pv25f6>/drum</a></li> <li data-astro-cid-j7pv25f6><a href="/status" data-astro-cid-j7pv25f6>/status</a></li> <li data-astro-cid-j7pv25f6><a href="/collection" data-astro-cid-j7pv25f6>/collection</a></li> <li data-astro-cid-j7pv25f6><a href="/profile" data-astro-cid-j7pv25f6>/profile</a></li> <li data-astro-cid-j7pv25f6><a href="/collect" data-astro-cid-j7pv25f6>/collect</a></li> <li data-astro-cid-j7pv25f6><a href="/about" data-astro-cid-j7pv25f6>/about</a></li> </ul> </footer> </div> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
