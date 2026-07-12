import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, u as unescapeHTML, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$NounsWoodChop = createComponent(($$result, $$props, $$slots) => {
  const TREES = [
    { id: "cypress", label: "Cypress Noun 313", noun: 313, health: 14, bonus: 3, skill: "Rhythm chop", effect: "+1 wood on every fourth streak" },
    { id: "pine", label: "Blue Pine Noun 523", noun: 523, health: 18, bonus: 4, skill: "Sharp axe", effect: "higher crit chance" },
    { id: "palm", label: "Beach Palm Noun 742", noun: 742, health: 22, bonus: 5, skill: "Seed scout", effect: "better seed drops" },
    { id: "oak", label: "Commons Oak Noun 1042", noun: 1042, health: 26, bonus: 6, skill: "Bundle keeper", effect: "+1 energy when banking" }
  ];
  const STAMPS = [
    { id: "first-bundle", label: "First Bundle", threshold: 1, note: "Bank one bundle." },
    { id: "commons-carpenter", label: "Commons Carpenter", threshold: 3, note: "Show up three times." },
    { id: "noggles-forester", label: "Noggles Forester", threshold: 5, note: "Turn rhythm into supply." },
    { id: "woodlot-keeper", label: "Woodlot Keeper", threshold: 8, note: "Protect the loop." }
  ];
  const ORDERS = [
    { id: "warm-up", label: "Warm-up chops", metric: "totalChops", target: 10, reward: "+8 wood", note: "Make ten clean chops and settle into rhythm." },
    { id: "first-bank", label: "Bank the commons", metric: "bundles", target: 1, reward: "+1 seed", note: "Turn twelve wood into a local receipt." },
    { id: "plant-care", label: "Plant care", metric: "plants", target: 2, reward: "+6 energy", note: "Put seeds back into the woodlot." },
    { id: "crew-check", label: "Meet the crew", metric: "helperVisits", target: 3, reward: "+12 wood", note: "Try three Noun helpers and learn their roles." }
  ];
  const VERSIONS = [
    { id: "v1", label: "V1", name: "Core loop", note: "Chop, bank bundles, plant seeds, and collect local stamps." },
    { id: "v2", label: "V2", name: "Helpers + burst", note: "Adds animated Noun helpers, streaks, seed bonuses, crits, and Noun Burst." },
    { id: "v3", label: "V3", name: "Orders + moves", note: "Adds order rewards, helper-move charge, and richer receipts." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        "@id": "https://pointcast.xyz/nouns-wood-chop#game",
        name: "Nouns Wood Chop Commons",
        description: "A browser-playable pixel collect loop where visitors choose Noun helpers, chop trees, complete orders, trigger helper moves, bank bundles, plant seeds, and unlock local Nouns stamps.",
        url: "https://pointcast.xyz/nouns-wood-chop",
        image: "https://pointcast.xyz/images/nouns-wood-chop/pixel-woodlot.svg",
        gamePlatform: "Web browser",
        genre: "Clicker collection",
        inLanguage: "en-US"
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://pointcast.xyz/nouns-wood-chop#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://pointcast.xyz/" },
          { "@type": "ListItem", position: 2, name: "Play", item: "https://pointcast.xyz/play" },
          { "@type": "ListItem", position: 3, name: "Nouns Wood Chop", item: "https://pointcast.xyz/nouns-wood-chop" }
        ]
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Wood Chop", "description": "A playable pixel Nouns collect loop: chop a tree, collect wood, bank bundles, plant seeds, unlock local stamps.", "image": "/images/nouns-wood-chop/pixel-woodlot.svg", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/nouns-wood-chop.json", title: "Nouns Wood Chop game manifest (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/nouns-wood-chop/pixel-woodlot.svg",
    buttons: [
      { label: "Play Wood Chop", action: "link", target: "https://pointcast.xyz/nouns-wood-chop" },
      { label: "Game JSON", action: "link", target: "https://pointcast.xyz/nouns-wood-chop.json" },
      { label: "Block 0383", action: "link", target: "https://pointcast.xyz/b/0383" },
      { label: "Home feed", action: "link", target: "https://pointcast.xyz/" }
    ]
  }, "data-astro-cid-t2pk2pms": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="wood-page" data-wood-game data-astro-cid-t2pk2pms> <script type="application/json" id="wood-game-data">', '<\/script> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-t2pk2pms> <a href="/" data-astro-cid-t2pk2pms>Home</a> <span aria-hidden="true" data-astro-cid-t2pk2pms>/</span> <a href="/play" data-astro-cid-t2pk2pms>Play</a> <span aria-hidden="true" data-astro-cid-t2pk2pms>/</span> <span data-astro-cid-t2pk2pms>Wood Chop</span> </nav> <section class="wood-hero" aria-labelledby="wood-title" data-astro-cid-t2pk2pms> <div class="wood-hero__copy" data-astro-cid-t2pk2pms> <p class="kicker" data-astro-cid-t2pk2pms>Nouns / pixel collect loop</p> <h1 id="wood-title" data-astro-cid-t2pk2pms>Wood Chop Commons</h1> <p data-astro-cid-t2pk2pms>\nPick a Noun helper, chop the tree, fill orders, fire helper moves, bank bundles, plant seeds, and unlock local Nouns stamps. Spacebar works too.\n</p> <div class="version-switch" aria-label="Wood Chop version selector" data-astro-cid-t2pk2pms> <span class="mono" data-astro-cid-t2pk2pms>Version</span> <div class="version-tabs" role="group" aria-label="Choose gameplay version" data-astro-cid-t2pk2pms> ', " </div> <p data-version-note data-astro-cid-t2pk2pms>", '</p> </div> </div> <div class="hud" aria-label="Wood Chop status" data-astro-cid-t2pk2pms> <div data-astro-cid-t2pk2pms><span data-astro-cid-t2pk2pms>WOOD</span><strong data-wood data-astro-cid-t2pk2pms>0</strong></div> <div data-astro-cid-t2pk2pms><span data-astro-cid-t2pk2pms>BUNDLES</span><strong data-bundles data-astro-cid-t2pk2pms>0</strong></div> <div data-astro-cid-t2pk2pms><span data-astro-cid-t2pk2pms>SEEDS</span><strong data-seeds data-astro-cid-t2pk2pms>0</strong></div> <div data-astro-cid-t2pk2pms><span data-astro-cid-t2pk2pms>ENERGY</span><strong data-energy data-astro-cid-t2pk2pms>0</strong></div> <div data-astro-cid-t2pk2pms><span data-astro-cid-t2pk2pms>STREAK</span><strong data-streak data-astro-cid-t2pk2pms>0</strong></div> <div data-orders-hud data-astro-cid-t2pk2pms><span data-astro-cid-t2pk2pms>ORDERS</span><strong data-orders-done data-astro-cid-t2pk2pms>0/4</strong></div> </div> </section> <section class="wood-layout" aria-label="Playable Nouns wood chop" data-astro-cid-t2pk2pms> <section class="forest-panel" aria-labelledby="forest-title" data-astro-cid-t2pk2pms> <div class="board-top" data-astro-cid-t2pk2pms> <div data-astro-cid-t2pk2pms> <p class="mono" data-astro-cid-t2pk2pms>ACTIVE TREE</p> <h2 id="forest-title" data-tree-name data-astro-cid-t2pk2pms>Cypress Noun 313</h2> </div> <strong data-status aria-live="polite" data-astro-cid-t2pk2pms>Ready. Chop to collect.</strong> </div> <button type="button" class="pixel-scene" data-action="chop" aria-label="Chop the active pixel tree" data-astro-cid-t2pk2pms> <span class="pixel-scene__sky" data-astro-cid-t2pk2pms></span> <span class="pixel-scene__sun" data-astro-cid-t2pk2pms></span> <span class="pixel-scene__cloud pixel-scene__cloud--one" data-astro-cid-t2pk2pms></span> <span class="pixel-scene__cloud pixel-scene__cloud--two" data-astro-cid-t2pk2pms></span> <span class="pixel-scene__ground" data-astro-cid-t2pk2pms></span> <span class="tree tree--back" data-astro-cid-t2pk2pms></span> <span class="helper-orbit" aria-hidden="true" data-astro-cid-t2pk2pms> ', ' </span> <span class="tree tree--main" data-astro-cid-t2pk2pms> <span class="tree__crown tree__crown--top" data-astro-cid-t2pk2pms></span> <span class="tree__crown tree__crown--left" data-astro-cid-t2pk2pms></span> <span class="tree__crown tree__crown--right" data-astro-cid-t2pk2pms></span> <span class="tree__trunk" data-astro-cid-t2pk2pms></span> <span class="tree__noggles" data-astro-cid-t2pk2pms><i data-astro-cid-t2pk2pms></i><i data-astro-cid-t2pk2pms></i></span> </span> <span class="axe" aria-hidden="true" data-astro-cid-t2pk2pms></span> <span class="log log--one" data-astro-cid-t2pk2pms></span> <span class="log log--two" data-astro-cid-t2pk2pms></span> <span class="impact" aria-hidden="true" data-astro-cid-t2pk2pms></span> <span class="burst-ring" aria-hidden="true" data-astro-cid-t2pk2pms></span> <span class="drop-layer" data-drop-layer aria-hidden="true" data-astro-cid-t2pk2pms></span> </button> <div class="health" aria-label="Tree health" data-astro-cid-t2pk2pms> <span data-astro-cid-t2pk2pms>Tree health</span> <div data-astro-cid-t2pk2pms><i data-health-bar data-astro-cid-t2pk2pms></i></div> <strong data-health-text data-astro-cid-t2pk2pms>14 / 14</strong> </div> <div class="burst-charge" aria-label="Noun Burst charge" data-astro-cid-t2pk2pms> <span data-astro-cid-t2pk2pms>Noun Burst</span> <div data-astro-cid-t2pk2pms><i data-burst-bar data-astro-cid-t2pk2pms></i></div> <strong data-burst-text data-astro-cid-t2pk2pms>0 / 8</strong> </div> <div class="command-charge" aria-label="Helper move charge" data-astro-cid-t2pk2pms> <span data-astro-cid-t2pk2pms>Helper move</span> <div data-astro-cid-t2pk2pms><i data-command-bar data-astro-cid-t2pk2pms></i></div> <strong data-command-text data-astro-cid-t2pk2pms>0 / 6</strong> </div> <div class="controls" aria-label="Wood Chop controls" data-astro-cid-t2pk2pms> <button type="button" class="btn btn--primary" data-action="chop" data-astro-cid-t2pk2pms>Chop</button> <button type="button" class="btn" data-action="command" data-astro-cid-t2pk2pms>Helper move</button> <button type="button" class="btn" data-action="bank" data-astro-cid-t2pk2pms>Bank bundle</button> <button type="button" class="btn" data-action="plant" data-astro-cid-t2pk2pms>Plant seed</button> <button type="button" class="btn" data-action="rest" data-astro-cid-t2pk2pms>Rest</button> </div> </section> <aside class="side-panel" aria-label="Nouns Wood Chop rewards and receipts" data-astro-cid-t2pk2pms> <div class="noun-row" aria-label="Noun tree crew" data-astro-cid-t2pk2pms> ', ' </div> <div class="helper-readout" aria-live="polite" data-astro-cid-t2pk2pms> <span class="mono" data-astro-cid-t2pk2pms>HELPER</span> <strong data-helper-name data-astro-cid-t2pk2pms>Cypress Noun 313</strong> <p data-astro-cid-t2pk2pms><span data-helper-skill data-astro-cid-t2pk2pms>Rhythm chop</span> · <span data-helper-effect data-astro-cid-t2pk2pms>+1 wood on every fourth streak</span></p> </div> <div class="orders-panel" aria-label="Woodlot orders" data-astro-cid-t2pk2pms> <div class="orders-panel__head" data-astro-cid-t2pk2pms> <span class="mono" data-astro-cid-t2pk2pms>ORDERS</span> <strong data-orders-summary data-astro-cid-t2pk2pms>0 / 4 done</strong> </div> <div class="order-stack" data-astro-cid-t2pk2pms> ', ' </div> </div> <div class="bundle-rule" data-astro-cid-t2pk2pms> <span class="mono" data-astro-cid-t2pk2pms>RULE</span> <strong data-astro-cid-t2pk2pms>12 wood = 1 bundle</strong> <p data-astro-cid-t2pk2pms>Bank a bundle to earn a receipt. Streaks charge Noun Burst for extra wood, seed drops, and a little screen joy.</p> </div> <div class="stamp-stack" aria-label="Stamp milestones" data-astro-cid-t2pk2pms> ', ` </div> <div class="receipts" aria-label="Local receipts" data-astro-cid-t2pk2pms> <div class="receipts__head" data-astro-cid-t2pk2pms> <span class="mono" data-astro-cid-t2pk2pms>RECEIPTS</span> <button type="button" data-action="reset" data-astro-cid-t2pk2pms>Reset</button> </div> <ol data-receipts data-astro-cid-t2pk2pms> <li data-astro-cid-t2pk2pms>No receipts yet.</li> </ol> </div> </aside> </section> </div> <script>
    (function () {
      var root = document.querySelector('[data-wood-game]');
      var dataEl = document.getElementById('wood-game-data');
      if (!root || !dataEl) return;

      var DATA = JSON.parse(dataEl.textContent || '{}');
      var TREES = DATA.trees || [];
      var STAMPS = DATA.stamps || [];
      var ORDERS = DATA.orders || [];
      var VERSIONS = DATA.versions || [];
      var STATE_KEY = 'pc:nouns-wood-chop:v1';
      var PASSPORT_KEY = 'pc:passport:stamps';
      var MAX_ENERGY = 12;
      var BUNDLE_SIZE = 12;
      var BURST_TARGET = 8;
      var COMMAND_TARGET = 6;
      var pulseTimers = {};

      var els = {
        wood: root.querySelector('[data-wood]'),
        bundles: root.querySelector('[data-bundles]'),
        seeds: root.querySelector('[data-seeds]'),
        energy: root.querySelector('[data-energy]'),
        streak: root.querySelector('[data-streak]'),
        status: root.querySelector('[data-status]'),
        treeName: root.querySelector('[data-tree-name]'),
        healthBar: root.querySelector('[data-health-bar]'),
        healthText: root.querySelector('[data-health-text]'),
        burstBar: root.querySelector('[data-burst-bar]'),
        burstText: root.querySelector('[data-burst-text]'),
        commandBar: root.querySelector('[data-command-bar]'),
        commandText: root.querySelector('[data-command-text]'),
        ordersDone: root.querySelector('[data-orders-done]'),
        ordersSummary: root.querySelector('[data-orders-summary]'),
        versionNote: root.querySelector('[data-version-note]'),
        receipts: root.querySelector('[data-receipts]'),
        scene: root.querySelector('.pixel-scene'),
        dropLayer: root.querySelector('[data-drop-layer]'),
        helperName: root.querySelector('[data-helper-name]'),
        helperSkill: root.querySelector('[data-helper-skill]'),
        helperEffect: root.querySelector('[data-helper-effect]'),
      };

      function readJson(key, fallback) {
        try {
          var raw = localStorage.getItem(key);
          if (!raw) return fallback;
          var parsed = JSON.parse(raw);
          return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (e) {
          return fallback;
        }
      }

      function writeJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
      }

      function blankState() {
        return {
          wood: 0,
          bundles: 0,
          seeds: 2,
          energy: MAX_ENERGY,
          treeIndex: 0,
          health: TREES[0] ? TREES[0].health : 14,
          streak: 0,
          felled: 0,
          lastChop: 0,
          helperIndex: 0,
          burst: 0,
          command: 0,
          totalChops: 0,
          plants: 0,
          helperVisits: [],
          ordersClaimed: [],
          version: 'v3',
          receipts: [],
          unlocked: [],
        };
      }

      var state = Object.assign(blankState(), readJson(STATE_KEY, {}));
      var validVersions = VERSIONS.map(function (version) { return version.id; });
      state.receipts = Array.isArray(state.receipts) ? state.receipts : [];
      state.unlocked = Array.isArray(state.unlocked) ? state.unlocked : [];
      state.helperVisits = Array.isArray(state.helperVisits) ? state.helperVisits : [];
      state.ordersClaimed = Array.isArray(state.ordersClaimed) ? state.ordersClaimed : [];
      state.version = validVersions.indexOf(state.version) === -1 ? 'v3' : state.version;
      state.treeIndex = Math.max(0, Math.min(TREES.length - 1, Number(state.treeIndex) || 0));
      state.helperIndex = Math.max(0, Math.min(TREES.length - 1, Number(state.helperIndex) || 0));
      state.burst = Math.max(0, Math.min(BURST_TARGET, Number(state.burst) || 0));
      state.command = Math.max(0, Math.min(COMMAND_TARGET, Number(state.command) || 0));
      state.totalChops = Math.max(0, Number(state.totalChops) || 0);
      state.plants = Math.max(0, Number(state.plants) || 0);
      if (!state.health || state.health < 1) state.health = currentTree().health;

      function currentTree() {
        return TREES[state.treeIndex] || TREES[0] || { id: 'tree', label: 'Pixel Tree', health: 14, bonus: 3 };
      }

      function currentHelper() {
        return TREES[state.helperIndex] || TREES[0] || currentTree();
      }

      function activeVersion() {
        return VERSIONS.find(function (version) { return version.id === state.version; }) || VERSIONS[VERSIONS.length - 1] || { id: 'v3', label: 'V3', name: 'Orders + moves', note: '' };
      }

      function hasHelpers() {
        return state.version === 'v2' || state.version === 'v3';
      }

      function hasOrders() {
        return state.version === 'v3';
      }

      function hasCommand() {
        return state.version === 'v3';
      }

      function markHelper(index) {
        var helper = TREES[index] || TREES[0];
        if (!helper || !helper.id || state.helperVisits.indexOf(helper.id) !== -1) return;
        state.helperVisits.push(helper.id);
      }

      function setStatus(message) {
        if (els.status) els.status.textContent = message;
      }

      function receipt(text) {
        state.receipts.unshift({
          id: 'wood-' + Date.now().toString(36),
          at: new Date().toISOString(),
          text: text,
        });
        state.receipts = state.receipts.slice(0, 6);
      }

      function save() {
        writeJson(STATE_KEY, state);
      }

      function stampPassport() {
        var stamps = readJson(PASSPORT_KEY, {});
        if (!stamps['nouns-wood-chop']) {
          stamps['nouns-wood-chop'] = {
            id: 'nouns-wood-chop',
            at: new Date().toISOString(),
            via: 'nouns-wood-chop',
          };
          writeJson(PASSPORT_KEY, stamps);
        }
      }

      function updateUnlocked() {
        STAMPS.forEach(function (stamp) {
          if (state.bundles >= stamp.threshold && state.unlocked.indexOf(stamp.id) === -1) {
            state.unlocked.push(stamp.id);
            receipt('Unlocked stamp: ' + stamp.label + '.');
          }
        });
      }

      function metricValue(metric) {
        if (metric === 'totalChops') return state.totalChops;
        if (metric === 'bundles') return state.bundles;
        if (metric === 'plants') return state.plants;
        if (metric === 'helperVisits') return state.helperVisits.length;
        if (metric === 'felled') return state.felled;
        return 0;
      }

      function applyOrderReward(order) {
        if (order.id === 'warm-up') {
          state.wood += 8;
          return '+8 wood';
        }
        if (order.id === 'first-bank') {
          state.seeds += 1;
          return '+1 seed';
        }
        if (order.id === 'plant-care') {
          state.energy = Math.min(MAX_ENERGY, state.energy + 6);
          return '+6 energy';
        }
        if (order.id === 'crew-check') {
          state.wood += 12;
          return '+12 wood';
        }
        return order.reward || 'reward';
      }

      function claimOrders() {
        if (!hasOrders()) return 0;
        var claimed = [];
        ORDERS.forEach(function (order) {
          if (state.ordersClaimed.indexOf(order.id) !== -1) return;
          if (metricValue(order.metric) < order.target) return;
          state.ordersClaimed.push(order.id);
          var reward = applyOrderReward(order);
          claimed.push(order.label);
          receipt('Order complete: ' + order.label + ' (' + reward + ').');
        });
        if (claimed.length) {
          pulseScene('is-ordering', 560);
          dropText('ORDER DONE', 'bundle');
          setStatus('Order complete: ' + claimed[claimed.length - 1] + '. Reward added.');
        }
        return claimed.length;
      }

      function nextTree() {
        state.treeIndex = (state.treeIndex + 1) % TREES.length;
        state.health = currentTree().health;
      }

      function pulseScene(className, duration) {
        if (!els.scene) return;
        if (pulseTimers[className]) window.clearTimeout(pulseTimers[className]);
        els.scene.classList.remove(className);
        void els.scene.offsetWidth;
        els.scene.classList.add(className);
        pulseTimers[className] = window.setTimeout(function () {
          els.scene.classList.remove(className);
          pulseTimers[className] = null;
        }, duration || 520);
      }

      function dropText(text, tone) {
        if (!els.dropLayer) return;
        var chip = document.createElement('span');
        chip.className = 'drop-chip drop-chip--' + (tone || 'wood');
        chip.textContent = text;
        chip.style.left = (44 + Math.random() * 18) + '%';
        chip.style.top = (39 + Math.random() * 12) + '%';
        els.dropLayer.append(chip);
        window.setTimeout(function () { chip.remove(); }, 820);
      }

      function helperBonus(baseGain) {
        if (!hasHelpers()) return { bonus: 0, seed: false, crit: false };

        var helper = currentHelper();
        var bonus = 0;
        var seed = false;
        var crit = false;

        if (helper.id === 'cypress' && state.streak > 0 && state.streak % 4 === 0) bonus += 1;
        if (helper.id === 'pine' && Math.random() < 0.28) {
          bonus += 2;
          crit = true;
        }
        if (helper.id === 'palm' && Math.random() < 0.2) seed = true;
        if (state.burst >= BURST_TARGET) {
          bonus += 4;
          seed = true;
          state.burst = 0;
          pulseScene('is-bursting', 540);
          dropText('NOUN BURST +' + (baseGain + bonus), 'burst');
        }

        return { bonus: bonus, seed: seed, crit: crit };
      }

      function chop() {
        if (state.energy <= 0) {
          setStatus('Energy is empty. Rest or bank a bundle.');
          render();
          return;
        }

        var now = Date.now();
        state.streak = now - state.lastChop < 1400 ? state.streak + 1 : 1;
        state.lastChop = now;
        state.energy -= 1;
        if (hasHelpers()) state.burst = Math.min(BURST_TARGET, state.burst + 1);
        if (hasCommand()) state.command = Math.min(COMMAND_TARGET, state.command + 1);
        state.totalChops += 1;

        var rhythmBonus = hasHelpers() ? Math.min(3, Math.floor(state.streak / 5)) : 0;
        var gain = 1 + Math.floor(Math.random() * 2) + rhythmBonus;
        var helper = helperBonus(gain);
        gain += helper.bonus;
        state.wood += gain;
        state.health -= 1;

        if (Math.random() < 0.12 || helper.seed) {
          state.seeds += 1;
          setStatus('Good chop: +' + gain + ' wood, +1 seed.');
          dropText('+1 seed', 'seed');
        } else {
          setStatus('Good chop: +' + gain + ' wood.');
        }

        if (helper.crit) {
          setStatus('Sharp axe crit: +' + gain + ' wood.');
          dropText('CRIT +' + gain, 'crit');
        } else if (hasHelpers() && state.streak > 1 && state.streak % 4 === 0) {
          dropText('STREAK +' + gain, 'wood');
        } else {
          dropText('+' + gain + ' wood', 'wood');
        }

        pulseScene('is-chopping', 260);

        if (state.health <= 0) {
          fellTree();
        }

        claimOrders();
        save();
        render();
      }

      function fellTree() {
        var tree = currentTree();
        var drop = tree.bonus + Math.floor(Math.random() * 3);
        state.felled += 1;
        state.wood += drop;
        state.seeds += 1;
        state.energy = Math.min(MAX_ENERGY, state.energy + 3);
        receipt('Felled ' + tree.label + ': +' + drop + ' wood and +1 seed.');
        pulseScene('is-felling', 640);
        dropText('TREE DOWN +' + drop, 'burst');
        nextTree();
        setStatus('Tree down. New tree planted in the commons.');
      }

      function useCommand() {
        if (!hasCommand()) {
          setStatus('V3 enables helper moves.');
          render();
          return;
        }

        if (state.command < COMMAND_TARGET) {
          setStatus('Helper move needs ' + (COMMAND_TARGET - state.command) + ' more chop' + (COMMAND_TARGET - state.command === 1 ? '' : 's') + '.');
          render();
          return;
        }

        state.command = 0;
        var helper = currentHelper();
        var label = helper.skill || 'Helper move';

        if (helper.id === 'cypress') {
          state.wood += 6;
          state.burst = Math.min(BURST_TARGET, state.burst + 2);
          label = 'Rhythm Riff';
          dropText('RHYTHM RIFF +6', 'burst');
        } else if (helper.id === 'pine') {
          state.wood += 10;
          state.health -= 2;
          label = 'Double Crit';
          dropText('DOUBLE CRIT +10', 'crit');
        } else if (helper.id === 'palm') {
          state.seeds += 2;
          state.energy = Math.min(MAX_ENERGY, state.energy + 3);
          label = 'Seed Rain';
          dropText('SEED RAIN +2', 'seed');
        } else if (helper.id === 'oak') {
          state.wood += 8;
          state.energy = Math.min(MAX_ENERGY, state.energy + 3);
          label = 'Commons Haul';
          dropText('COMMONS HAUL +8', 'bundle');
        }

        receipt('Used ' + label + ' with ' + helper.label + '.');
        pulseScene('is-commanding', 620);
        setStatus(label + ' landed.');
        if (state.health <= 0) fellTree();
        claimOrders();
        save();
        render();
      }

      function bankBundle() {
        if (state.wood < BUNDLE_SIZE) {
          setStatus('Need ' + (BUNDLE_SIZE - state.wood) + ' more wood to bank a bundle.');
          render();
          return;
        }

        state.wood -= BUNDLE_SIZE;
        state.bundles += 1;
        state.energy = Math.min(MAX_ENERGY, state.energy + 2 + (hasHelpers() && currentHelper().id === 'oak' ? 1 : 0));
        receipt('Banked bundle ' + state.bundles + '.');
        pulseScene('is-banking', 540);
        dropText('BUNDLE #' + state.bundles, 'bundle');
        if (state.bundles === 1) stampPassport();
        updateUnlocked();
        setStatus('Bundle banked. Receipt saved locally.');
        claimOrders();
        save();
        render();
      }

      function plantSeed() {
        if (state.seeds <= 0) {
          setStatus('No seeds yet. Fell a tree or keep chopping.');
          render();
          return;
        }

        state.seeds -= 1;
        nextTree();
        state.plants += 1;
        state.energy = Math.min(MAX_ENERGY, state.energy + 4);
        receipt('Planted a seed for ' + currentTree().label + '.');
        pulseScene('is-planting', 480);
        dropText('PLANTED', 'seed');
        setStatus('Seed planted. Energy recovered.');
        claimOrders();
        save();
        render();
      }

      function rest() {
        state.energy = MAX_ENERGY;
        state.streak = 0;
        setStatus('Rested. Back to full energy.');
        save();
        render();
      }

      function reset() {
        state = blankState();
        localStorage.removeItem(STATE_KEY);
        setStatus('Fresh woodlot ready.');
        render();
      }

      function chooseHelper(index) {
        if (!hasHelpers()) {
          setStatus('V2 and V3 enable Noun helpers.');
          render();
          return;
        }
        if (!Number.isInteger(index) || index < 0 || index >= TREES.length) return;
        state.helperIndex = index;
        markHelper(index);
        setStatus(TREES[index].label + ' is helping.');
        claimOrders();
        save();
        render();
      }

      function setVersion(version) {
        if (validVersions.indexOf(version) === -1 || state.version === version) return;
        state.version = version;
        if (!hasHelpers()) {
          state.burst = 0;
          state.command = 0;
        } else if (!hasCommand()) {
          state.command = 0;
          markHelper(state.helperIndex);
        } else {
          markHelper(state.helperIndex);
          claimOrders();
        }
        setStatus(activeVersion().label + ' selected: ' + activeVersion().name + '.');
        save();
        render();
      }

      function render() {
        var tree = currentTree();
        var helper = currentHelper();
        var healthPct = Math.max(0, Math.min(100, (state.health / tree.health) * 100));
        var burstPct = Math.max(0, Math.min(100, (state.burst / BURST_TARGET) * 100));
        var commandPct = Math.max(0, Math.min(100, (state.command / COMMAND_TARGET) * 100));
        var ordersDone = hasOrders() ? state.ordersClaimed.length : 0;
        var version = activeVersion();
        if (!hasHelpers()) {
          burstPct = 0;
          commandPct = 0;
        } else if (!hasCommand()) {
          commandPct = 0;
        }
        root.dataset.tree = tree.id;
        root.dataset.activeHelper = helper.id;
        root.dataset.version = state.version;
        root.style.setProperty('--health', healthPct + '%');
        root.style.setProperty('--burst', burstPct + '%');
        root.style.setProperty('--command', commandPct + '%');

        if (els.wood) els.wood.textContent = String(state.wood);
        if (els.bundles) els.bundles.textContent = String(state.bundles);
        if (els.seeds) els.seeds.textContent = String(state.seeds);
        if (els.energy) els.energy.textContent = String(state.energy) + '/' + MAX_ENERGY;
        if (els.streak) els.streak.textContent = String(state.streak);
        if (els.ordersDone) els.ordersDone.textContent = ordersDone + '/' + ORDERS.length;
        if (els.ordersSummary) els.ordersSummary.textContent = ordersDone + ' / ' + ORDERS.length + ' done';
        if (els.versionNote) els.versionNote.textContent = version.note || '';
        if (els.treeName) els.treeName.textContent = tree.label;
        if (els.helperName) els.helperName.textContent = helper.label;
        if (els.helperSkill) els.helperSkill.textContent = helper.skill || 'Helper';
        if (els.helperEffect) els.helperEffect.textContent = helper.effect || 'steady bonus';
        if (els.healthBar) els.healthBar.style.width = healthPct + '%';
        if (els.healthText) els.healthText.textContent = Math.max(0, state.health) + ' / ' + tree.health;
        if (els.burstBar) els.burstBar.style.width = burstPct + '%';
        if (els.burstText) els.burstText.textContent = state.burst + ' / ' + BURST_TARGET;
        if (els.commandBar) els.commandBar.style.width = commandPct + '%';
        if (els.commandText) els.commandText.textContent = state.command + ' / ' + COMMAND_TARGET;

        root.querySelectorAll('[data-helper]').forEach(function (button) {
          var index = Number(button.getAttribute('data-helper'));
          var active = hasHelpers() && index === state.helperIndex;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        root.querySelectorAll('[data-helper-sprite]').forEach(function (sprite) {
          var index = Number(sprite.getAttribute('data-helper-sprite'));
          sprite.classList.toggle('is-active', hasHelpers() && index === state.helperIndex);
        });

        root.querySelectorAll('[data-version-choice]').forEach(function (button) {
          var active = button.getAttribute('data-version-choice') === state.version;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        root.querySelectorAll('[data-stamp-id]').forEach(function (el) {
          var id = el.getAttribute('data-stamp-id');
          var threshold = Number(el.getAttribute('data-stamp-threshold')) || 0;
          var done = state.bundles >= threshold || state.unlocked.indexOf(id) !== -1;
          el.classList.toggle('is-unlocked', done);
        });

        root.querySelectorAll('[data-order-id]').forEach(function (el) {
          var id = el.getAttribute('data-order-id');
          var metric = el.getAttribute('data-order-metric') || '';
          var target = Number(el.getAttribute('data-order-target')) || 1;
          var value = metricValue(metric);
          var complete = value >= target;
          var claimed = state.ordersClaimed.indexOf(id) !== -1;
          var pct = Math.max(0, Math.min(100, (value / target) * 100));
          var progress = el.querySelector('[data-order-progress]');
          var bar = el.querySelector('[data-order-bar]');
          el.classList.toggle('is-complete', complete);
          el.classList.toggle('is-claimed', claimed);
          if (progress) progress.textContent = String(Math.min(value, target));
          if (bar) bar.style.width = pct + '%';
        });

        root.querySelectorAll('[data-action="bank"]').forEach(function (button) {
          button.disabled = state.wood < BUNDLE_SIZE;
        });
        root.querySelectorAll('[data-action="plant"]').forEach(function (button) {
          button.disabled = state.seeds <= 0;
        });
        root.querySelectorAll('[data-action="command"]').forEach(function (button) {
          button.disabled = !hasCommand() || state.command < COMMAND_TARGET;
        });
        root.querySelectorAll('[data-action="chop"]').forEach(function (button) {
          button.disabled = state.energy <= 0;
        });

        if (els.receipts) {
          els.receipts.textContent = '';
          if (!state.receipts.length) {
            var empty = document.createElement('li');
            empty.textContent = 'No receipts yet.';
            els.receipts.append(empty);
          } else {
            state.receipts.forEach(function (item) {
              var li = document.createElement('li');
              var at = new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              li.textContent = at + ' - ' + item.text;
              els.receipts.append(li);
            });
          }
        }
      }

      root.addEventListener('click', function (event) {
        var button = event.target.closest('[data-action]');
        if (!button) return;
        var action = button.getAttribute('data-action');
        if (action === 'chop') chop();
        if (action === 'command') useCommand();
        if (action === 'bank') bankBundle();
        if (action === 'plant') plantSeed();
        if (action === 'rest') rest();
        if (action === 'reset') reset();
      });

      root.addEventListener('click', function (event) {
        var versionButton = event.target.closest('[data-version-choice]');
        if (!versionButton) return;
        setVersion(versionButton.getAttribute('data-version-choice'));
      });

      root.addEventListener('click', function (event) {
        var helperButton = event.target.closest('.noun-card[data-helper]');
        if (!helperButton) return;
        chooseHelper(Number(helperButton.getAttribute('data-helper')));
      });

      document.addEventListener('keydown', function (event) {
        if (event.code !== 'Space') return;
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        event.preventDefault();
        chop();
      });

      if (hasHelpers()) markHelper(state.helperIndex);
      updateUnlocked();
      if (hasOrders()) claimOrders();
      render();
    })();
  <\/script> `])), maybeRenderHead(), unescapeHTML(JSON.stringify({ trees: TREES, stamps: STAMPS, orders: ORDERS, versions: VERSIONS })), VERSIONS.map((version) => renderTemplate`<button type="button"${addAttribute(version.id, "data-version-choice")}${addAttribute(version.id === "v3" ? "true" : "false", "aria-pressed")} data-astro-cid-t2pk2pms> <strong data-astro-cid-t2pk2pms>${version.label}</strong> <span data-astro-cid-t2pk2pms>${version.name}</span> </button>`), VERSIONS[2].note, TREES.map((tree, index) => renderTemplate`<span${addAttribute(`helper helper--${index + 1}`, "class")}${addAttribute(index, "data-helper-sprite")} data-astro-cid-t2pk2pms> <img${addAttribute(`https://noun.pics/${tree.noun}.svg`, "src")} alt="" width="72" height="72" loading="lazy" onerror="this.style.visibility='hidden'" data-astro-cid-t2pk2pms> </span>`), TREES.map((tree, index) => renderTemplate`<button type="button" class="noun-card"${addAttribute(index, "data-helper")}${addAttribute(`Choose ${tree.label} helper`, "aria-label")} data-astro-cid-t2pk2pms> <img${addAttribute(`https://noun.pics/${tree.noun}.svg`, "src")}${addAttribute(`Noun ${tree.noun}`, "alt")} width="54" height="54" loading="lazy" onerror="this.style.visibility='hidden'" data-astro-cid-t2pk2pms> <span data-astro-cid-t2pk2pms>N${tree.noun}</span> </button>`), ORDERS.map((order) => renderTemplate`<article class="order"${addAttribute(order.id, "data-order-id")}${addAttribute(order.metric, "data-order-metric")}${addAttribute(order.target, "data-order-target")} data-astro-cid-t2pk2pms> <div data-astro-cid-t2pk2pms> <span data-astro-cid-t2pk2pms>${order.reward}</span> <strong data-astro-cid-t2pk2pms>${order.label}</strong> <p data-astro-cid-t2pk2pms>${order.note}</p> </div> <div class="order__progress" aria-hidden="true" data-astro-cid-t2pk2pms><i data-order-bar data-astro-cid-t2pk2pms></i></div> <small data-astro-cid-t2pk2pms><span data-order-progress data-astro-cid-t2pk2pms>0</span> / ${order.target}</small> </article>`), STAMPS.map((stamp) => renderTemplate`<article class="stamp"${addAttribute(stamp.id, "data-stamp-id")}${addAttribute(stamp.threshold, "data-stamp-threshold")} data-astro-cid-t2pk2pms> <span data-astro-cid-t2pk2pms>${stamp.threshold} bundle${stamp.threshold === 1 ? "" : "s"}</span> <strong data-astro-cid-t2pk2pms>${stamp.label}</strong> <p data-astro-cid-t2pk2pms>${stamp.note}</p> </article>`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-wood-chop.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-wood-chop.astro";
const $$url = "/nouns-wood-chop";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsWoodChop,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
