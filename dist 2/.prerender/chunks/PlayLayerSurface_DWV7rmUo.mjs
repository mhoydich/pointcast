import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, u as unescapeHTML, b as addAttribute, r as renderComponent, F as Fragment, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { P as PLAY_SURFACES, b as PASSPORT_STAMPS, c as POINTCAST_PETS, d as PET_CARE_ACTIONS, C as COLLECTIBLE_ROUTES, A as AGENT_QUESTS, D as DAILY_WALK_STEPS, e as CIVIC_WISHES, B as BUILDER_GHOSTS, R as RADIO_BULLETINS, f as ROOM_WEATHER, a as PLAY_LAYER_VERSION, g as PLAY_LAYER_DESCRIPTION } from './play-layer_B1t_jF-o.mjs';
import { D as DERBY_SEASON, c as DERBY_ROSTER } from './agent-derby_D2xATzzG.mjs';
import { t as todayPT } from './daily_2eiOMuEj.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$PlayLayerApp = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$PlayLayerApp;
  const { focus = "overview" } = Astro2.props;
  const today = todayPT();
  const activeSurface = PLAY_SURFACES.find((surface) => surface.id === focus) ?? null;
  const totalPoints = PASSPORT_STAMPS.reduce((sum, stamp) => sum + stamp.points, 0);
  const stampById = new Map(PASSPORT_STAMPS.map((stamp) => [stamp.id, stamp]));
  const defaultPet = POINTCAST_PETS[0];
  const appData = {
    today,
    focus,
    stamps: PASSPORT_STAMPS,
    walkSteps: DAILY_WALK_STEPS,
    quests: AGENT_QUESTS,
    routes: COLLECTIBLE_ROUTES,
    pets: POINTCAST_PETS,
    petActions: PET_CARE_ACTIONS,
    derbySeason: DERBY_SEASON
  };
  return renderTemplate(_a || (_a = __template(["", '<div class="play-layer" data-play-layer', "", "", ' data-astro-cid-jdztlgyt> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-jdztlgyt> <a href="/" data-astro-cid-jdztlgyt>Home</a> <span aria-hidden="true" data-astro-cid-jdztlgyt>/</span> <a href="/play" data-astro-cid-jdztlgyt>play</a> ', ' </nav> <header class="play-hero" id="overview" data-astro-cid-jdztlgyt> <div class="play-hero__copy" data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>PLAY LAYER · v', " · ", "</p> <h1 data-astro-cid-jdztlgyt>", '</h1> <p data-astro-cid-jdztlgyt>\nPassport, quests, daily walk, room weather, radio, routes, builder ghosts,\n        civic wishes, site pets, Zen Cats, and the Derby league now share one local ritual layer.\n</p> <div class="play-hero__actions" aria-label="Primary play routes" data-astro-cid-jdztlgyt> <a href="/passport" data-astro-cid-jdztlgyt>Passport</a> <a href="/walk" data-astro-cid-jdztlgyt>Daily Walk</a> <a href="/quests" data-astro-cid-jdztlgyt>Quests</a> <a href="/pet" data-astro-cid-jdztlgyt>Pets</a> <a href="/zen-cats" data-astro-cid-jdztlgyt>Zen Cats</a> <a href="/play.json" data-astro-cid-jdztlgyt>JSON</a> </div> </div> <aside class="passport-meter" aria-label="Passport progress" data-astro-cid-jdztlgyt> <img src="https://noun.pics/137.svg" alt="" width="84" height="84" loading="eager" data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <span class="passport-meter__label" data-astro-cid-jdztlgyt>Passport</span> <strong data-astro-cid-jdztlgyt><span data-passport-count data-astro-cid-jdztlgyt>0</span> / ', '</strong> <span class="passport-meter__points" data-astro-cid-jdztlgyt><span data-passport-points data-astro-cid-jdztlgyt>0</span> / ', ' points</span> </div> </aside> </header> <nav class="surface-rail" aria-label="Play surfaces" data-astro-cid-jdztlgyt> ', ' </nav> <section class="play-section play-section--overview" aria-labelledby="systems-title" data-astro-cid-jdztlgyt> <div class="section-head" data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>SYSTEMS</p> <h2 id="systems-title" data-astro-cid-jdztlgyt>All ', ' pieces are wired together.</h2> </div> <div class="system-grid" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="passport" class="play-section" aria-labelledby="passport-title" data-play-section="passport" data-astro-cid-jdztlgyt> <div class="section-head" data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>PASSPORT</p> <h2 id="passport-title" data-astro-cid-jdztlgyt>Stamp the things that make PointCast feel alive.</h2> </div> <div class="stamp-grid" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="walk" class="play-section" aria-labelledby="walk-title" data-play-section="walk" data-astro-cid-jdztlgyt> <div class="section-head section-head--split" data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>DAILY WALK</p> <h2 id="walk-title" data-astro-cid-jdztlgyt>Five stops, one day key.</h2> </div> <div class="progress-pill" data-astro-cid-jdztlgyt> <span data-walk-count data-astro-cid-jdztlgyt>0</span> / ', ' </div> </div> <div class="walk-track" data-walk-progress style="--walk-progress: 0%" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="quests" class="play-section" aria-labelledby="quests-title" data-play-section="quests" data-astro-cid-jdztlgyt> <div class="section-head section-head--split" data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>QUEST BOARD</p> <h2 id="quests-title" data-astro-cid-jdztlgyt>Small, receipt-shaped jobs for humans and agents.</h2> </div> <a class="section-link" href="/play.json" data-astro-cid-jdztlgyt>Quest JSON</a> </div> <div class="quest-grid" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="weather" class="play-section" aria-labelledby="weather-title" data-play-section="weather" data-astro-cid-jdztlgyt> <div class="section-head" data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>ROOM WEATHER</p> <h2 id="weather-title" data-astro-cid-jdztlgyt>Every room gets a forecast.</h2> </div> <div class="weather-grid" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="radio" class="play-section play-section--radio" aria-labelledby="radio-title" data-play-section="radio" data-astro-cid-jdztlgyt> <div class="section-head section-head--split" data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>POINTCAST RADIO</p> <h2 id="radio-title" data-astro-cid-jdztlgyt>The broadcast desk has copy.</h2> </div> <button type="button" class="radio-tune" data-stamp-button data-stamp-id="radio-tune" data-astro-cid-jdztlgyt>Tune In</button> </div> <div class="radio-board" data-astro-cid-jdztlgyt> <div class="radio-dial" aria-hidden="true" data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>PC</span> <strong data-astro-cid-jdztlgyt>90245</strong> </div> <div class="bulletin-list" data-astro-cid-jdztlgyt> ', ' </div> </div> </section> <section id="routes" class="play-section" aria-labelledby="routes-title" data-play-section="routes" data-astro-cid-jdztlgyt> <div class="section-head" data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>COLLECTIBLE ROUTES</p> <h2 id="routes-title" data-astro-cid-jdztlgyt>Finish loops, unlock route cards.</h2> </div> <div class="route-grid" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="builders" class="play-section" aria-labelledby="builders-title" data-play-section="builders" data-astro-cid-jdztlgyt> <div class="section-head" data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>BUILDER GHOSTS</p> <h2 id="builders-title" data-astro-cid-jdztlgyt>Contribution trails become visible.</h2> </div> <div class="ghost-grid" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="civic" class="play-section" aria-labelledby="civic-title" data-play-section="civic" data-astro-cid-jdztlgyt> <div class="section-head section-head--split" data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>TINY CIVIC LAYER</p> <h2 id="civic-title" data-astro-cid-jdztlgyt>Wishes route the next public artifact.</h2> </div> <a class="section-link" href="/poll/pointcast-next-build" data-astro-cid-jdztlgyt>Vote</a> </div> <div class="civic-grid" data-astro-cid-jdztlgyt> ', ' </div> </section> <section id="pet" class="play-section play-section--pet" aria-labelledby="pet-title" data-play-section="pet" data-astro-cid-jdztlgyt> <div class="section-head" data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>POINTCAST PET</p> <h2 id="pet-title" data-astro-cid-jdztlgyt>Pick the one that keeps you company on /pet.</h2> </div> <div class="pet-shell" data-astro-cid-jdztlgyt> <div class="pet-stage" data-pet-stage', ' data-astro-cid-jdztlgyt> <div class="pet-stage__active" aria-live="polite" data-astro-cid-jdztlgyt> <img data-pet-image', ' alt="" width="132" height="132" loading="lazy" data-astro-cid-jdztlgyt> <strong data-pet-name data-astro-cid-jdztlgyt>', "</strong> <span data-pet-state data-astro-cid-jdztlgyt>sleepy signal</span> <em data-pet-kind data-astro-cid-jdztlgyt>", "</em> <p data-pet-line data-astro-cid-jdztlgyt>", '</p> </div> <div class="pet-companions" aria-label="Nouns companions on screen" data-astro-cid-jdztlgyt> ', ' </div> </div> <div class="pet-panel" data-astro-cid-jdztlgyt> <div class="pet-roster" aria-label="PointCast pet roster" data-astro-cid-jdztlgyt> ', ' </div> <div class="pet-gauges" data-astro-cid-jdztlgyt> ', ' </div> <div class="pet-actions" data-astro-cid-jdztlgyt> ', ' </div> </div> </div> </section> <section id="derby-season" class="play-section" aria-labelledby="derby-season-title" data-play-section="derby-season" data-astro-cid-jdztlgyt> <div class="section-head section-head--split" data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <p class="kicker" data-astro-cid-jdztlgyt>DERBY SEASON</p> <h2 id="derby-season-title" data-astro-cid-jdztlgyt>', '</h2> </div> <a class="section-link" href="/agent-derby" data-astro-cid-jdztlgyt>Run Race</a> </div> <div class="season-grid" data-astro-cid-jdztlgyt> <article class="season-panel" data-astro-cid-jdztlgyt> <p data-astro-cid-jdztlgyt>', '</p> <div class="ticket-row" data-astro-cid-jdztlgyt> ', ' </div> </article> <article class="season-panel" data-astro-cid-jdztlgyt> <h3 data-astro-cid-jdztlgyt>Standings</h3> <ol class="standings" data-astro-cid-jdztlgyt> ', ' </ol> </article> <article class="season-panel" data-astro-cid-jdztlgyt> <h3 data-astro-cid-jdztlgyt>Feature Seeds</h3> <div class="feature-list" data-astro-cid-jdztlgyt> ', ' </div> </article> </div> </section> </div> <script type="application/json" id="play-layer-data">', `<\/script> <script>
  (function () {
    var root = document.querySelector('[data-play-layer]');
    var dataEl = document.getElementById('play-layer-data');
    if (!root || !dataEl) return;

    var DATA = JSON.parse(dataEl.textContent || '{}');
    var STAMP_KEY = 'pc:passport:stamps';
    var QUEST_KEY = 'pc:quests';
    var PET_KEY = 'pc:pet:care';
    var PET_SELECTED_KEY = 'pc:pet:selected';
    var WALK_KEY = 'pc:walk:' + (DATA.today || 'today');
    var stampMeta = {};
    var petMeta = {};
    (DATA.stamps || []).forEach(function (stamp) { stampMeta[stamp.id] = stamp; });
    (DATA.pets || []).forEach(function (pet) { petMeta[pet.id] = pet; });

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

    function stamps() {
      return readJson(STAMP_KEY, {});
    }

    function setStamp(id, via) {
      if (!id) return;
      var current = stamps();
      current[id] = current[id] || { id: id, at: new Date().toISOString(), via: via || 'play-layer' };
      writeJson(STAMP_KEY, current);
      paint();
    }

    function completedStampIds() {
      return Object.keys(stamps()).filter(function (id) { return !!stampMeta[id]; });
    }

    function paintPassport() {
      var current = stamps();
      var ids = completedStampIds();
      var points = ids.reduce(function (sum, id) {
        return sum + (Number(stampMeta[id] && stampMeta[id].points) || 0);
      }, 0);

      root.querySelectorAll('[data-passport-count]').forEach(function (el) { el.textContent = String(ids.length); });
      root.querySelectorAll('[data-passport-points]').forEach(function (el) { el.textContent = String(points); });

      root.querySelectorAll('[data-passport-stamp]').forEach(function (el) {
        var id = el.getAttribute('data-passport-stamp');
        var done = !!current[id];
        el.classList.toggle('is-collected', done);
        var status = el.querySelector('[data-stamp-status]');
        if (status) status.textContent = done ? 'stamped ' + new Date(current[id].at).toLocaleDateString() : 'open';
      });

      root.querySelectorAll('[data-stamp-button]').forEach(function (button) {
        var id = button.getAttribute('data-stamp-id');
        var done = !!current[id];
        button.classList.toggle('is-done', done);
        if (!button.hasAttribute('data-pet-action')) button.textContent = done ? 'Stamped' : (button.dataset.defaultText || button.textContent || 'Stamp');
      });
    }

    function walkState() {
      return readJson(WALK_KEY, {});
    }

    function paintWalk() {
      var state = walkState();
      var total = (DATA.walkSteps || []).length || 1;
      var done = 0;
      root.querySelectorAll('[data-walk-step]').forEach(function (el) {
        var id = el.getAttribute('data-walk-step');
        var isDone = !!state[id];
        if (isDone) done += 1;
        el.classList.toggle('is-done', isDone);
        var button = el.querySelector('[data-walk-button]');
        if (button) button.textContent = isDone ? 'Done' : 'Done';
      });
      root.querySelectorAll('[data-walk-count]').forEach(function (el) { el.textContent = String(done); });
      var pct = Math.round((done / total) * 100);
      root.querySelectorAll('[data-walk-progress]').forEach(function (el) { el.style.setProperty('--walk-progress', pct + '%'); });
    }

    function questState() {
      return readJson(QUEST_KEY, {});
    }

    function paintQuests() {
      var state = questState();
      root.querySelectorAll('[data-quest-id]').forEach(function (el) {
        var id = el.getAttribute('data-quest-id');
        var value = state[id] || 'open';
        el.classList.toggle('is-claimed', value === 'claimed');
        el.classList.toggle('is-done', value === 'done');
        var stateEl = el.querySelector('[data-quest-state]');
        if (stateEl) stateEl.textContent = value;
      });
    }

    function paintRoutes() {
      var current = stamps();
      root.querySelectorAll('[data-route-id]').forEach(function (el) {
        var ids = (el.getAttribute('data-route-stamps') || '').split(',').filter(Boolean);
        var done = ids.filter(function (id) { return !!current[id]; });
        var complete = ids.length > 0 && done.length === ids.length;
        el.classList.toggle('is-complete', complete);
        var count = el.querySelector('[data-route-count]');
        if (count) count.textContent = done.length + ' / ' + ids.length;
        var state = el.querySelector('[data-route-state]');
        if (state) state.textContent = complete ? 'ready' : 'open';
        el.querySelectorAll('[data-route-stamp]').forEach(function (row) {
          row.classList.toggle('is-done', !!current[row.getAttribute('data-route-stamp')]);
        });
      });
    }

    function petCare() {
      var raw = readJson(PET_KEY, []);
      return Array.isArray(raw) ? raw : [];
    }

    function firstPet() {
      return (DATA.pets && DATA.pets[0]) || null;
    }

    function selectedPet() {
      var saved = readJson(PET_SELECTED_KEY, {});
      var fallback = firstPet();
      if (!fallback) return null;
      return petMeta[saved.id] || fallback;
    }

    function petCareCount(care, pet) {
      var fallback = firstPet();
      if (!pet || !fallback) return 0;
      return care.filter(function (entry) {
        return (entry.petId || fallback.id) === pet.id;
      }).length;
    }

    function paintPet() {
      var current = stamps();
      var care = petCare();
      var pet = selectedPet();
      var scores = { signal: 8, glow: 8, calm: 8, charge: 8 };
      if (pet && scores[pet.affinity] !== undefined) scores[pet.affinity] += 10;
      (DATA.petActions || []).forEach(function (action) {
        if (current[action.stampId]) scores[action.stat] += Number(action.effect || 0);
      });
      care.forEach(function (entry) {
        var action = (DATA.petActions || []).find(function (candidate) { return candidate.id === entry.id; });
        var entryPet = firstPet() && (entry.petId || firstPet().id);
        if (action && pet && entryPet === pet.id) scores[action.stat] += 10;
      });

      if (pet) {
        root.style.setProperty('--pet-accent', pet.accent || '#2f8f5f');
        var stage = root.querySelector('[data-pet-stage]');
        if (stage) stage.style.setProperty('--pet-accent', pet.accent || '#2f8f5f');
        root.querySelectorAll('[data-pet-image]').forEach(function (img) {
          img.setAttribute('src', 'https://noun.pics/' + pet.nounId + '.svg');
        });
        root.querySelectorAll('[data-pet-name]').forEach(function (el) { el.textContent = pet.name; });
        root.querySelectorAll('[data-pet-kind]').forEach(function (el) { el.textContent = pet.kind; });
        root.querySelectorAll('[data-pet-line]').forEach(function (el) { el.textContent = pet.line; });
      }

      root.querySelectorAll('[data-pet-select], [data-pet-companion]').forEach(function (button) {
        var id = button.getAttribute('data-pet-select') || button.getAttribute('data-pet-companion');
        var active = !!pet && id === pet.id;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      root.querySelectorAll('[data-pet-care-count]').forEach(function (el) {
        var pet = petMeta[el.getAttribute('data-pet-care-count')];
        var count = petCareCount(care, pet);
        el.textContent = count + (count === 1 ? ' care' : ' cares');
      });

      Object.keys(scores).forEach(function (key) {
        scores[key] = Math.max(0, Math.min(100, scores[key]));
        root.querySelectorAll('[data-pet-gauge="' + key + '"]').forEach(function (el) {
          var bar = el.querySelector('i');
          var value = el.querySelector('[data-pet-value]');
          if (bar) bar.style.setProperty('--pet-gauge', scores[key] + '%');
          if (value) value.textContent = String(scores[key]);
        });
      });

      var avg = Math.round((scores.signal + scores.glow + scores.calm + scores.charge) / 4);
      var label = avg >= 70 ? 'bright signal' : avg >= 44 ? 'awake signal' : 'sleepy signal';
      root.querySelectorAll('[data-pet-state]').forEach(function (el) { el.textContent = label; });
    }

    function paint() {
      paintPassport();
      paintWalk();
      paintQuests();
      paintRoutes();
      paintPet();
    }

    root.querySelectorAll('[data-stamp-button]').forEach(function (button) {
      button.dataset.defaultText = button.textContent || 'Stamp';
      button.addEventListener('click', function () {
        setStamp(button.getAttribute('data-stamp-id'), 'button');
      });
    });

    root.querySelectorAll('[data-walk-button]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-step-id');
        var state = walkState();
        state[id] = { at: new Date().toISOString() };
        writeJson(WALK_KEY, state);
        var parent = button.closest('[data-walk-step]');
        var stampId = parent && parent.getAttribute('data-step-stamp');
        if (stampId) setStamp(stampId, 'daily-walk');
        paint();
      });
    });

    root.querySelectorAll('[data-quest-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-quest-id');
        var action = button.getAttribute('data-quest-action') || 'claimed';
        var state = questState();
        state[id] = action;
        writeJson(QUEST_KEY, state);
        setStamp('quest-claim', 'quest-board');
        paint();
      });
    });

    root.querySelectorAll('[data-route-button]').forEach(function (button) {
      button.addEventListener('click', function () {
        var card = button.closest('[data-route-id]');
        if (!card || !card.classList.contains('is-complete')) return;
        setStamp('route-card', 'route-complete');
      });
    });

    root.querySelectorAll('[data-pet-select], [data-pet-companion]').forEach(function (button) {
      button.addEventListener('click', function () {
        writeJson(PET_SELECTED_KEY, {
          id: button.getAttribute('data-pet-select') || button.getAttribute('data-pet-companion'),
          at: new Date().toISOString(),
        });
        paint();
      });
    });

    root.querySelectorAll('[data-pet-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-pet-action');
        var care = petCare();
        var pet = selectedPet();
        care.push({ id: id, petId: pet && pet.id, at: new Date().toISOString() });
        writeJson(PET_KEY, care.slice(-60));
        setStamp('pet-care', 'pet');
        paint();
      });
    });

    paint();

    if (DATA.focus && DATA.focus !== 'overview') {
      var target = document.getElementById(DATA.focus);
      if (target) {
        setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 60);
      }
    }
  })();
<\/script>`])), maybeRenderHead(), addAttribute(focus, "data-focus"), addAttribute(today, "data-today"), addAttribute(`--pet-accent: ${defaultPet.accent}`, "style"), activeSurface && renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-jdztlgyt": true }, { "default": ($$result2) => renderTemplate` <span aria-hidden="true" data-astro-cid-jdztlgyt>/</span> <span data-astro-cid-jdztlgyt>${activeSurface.id}</span> ` })}`, PLAY_LAYER_VERSION, today, activeSurface ? activeSurface.title : "PointCast Play Layer", PASSPORT_STAMPS.length, totalPoints, PLAY_SURFACES.map((surface) => renderTemplate`<a${addAttribute(["surface-chip", surface.id === focus && "is-active"], "class:list")}${addAttribute(surface.route, "href")} data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${surface.code}</span> <strong data-astro-cid-jdztlgyt>${surface.title}</strong> </a>`), PLAY_SURFACES.length, PLAY_SURFACES.map((surface) => renderTemplate`<a class="system-tile"${addAttribute(surface.route, "href")} data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${surface.code}</span> <strong data-astro-cid-jdztlgyt>${surface.title}</strong> <em data-astro-cid-jdztlgyt>${surface.summary}</em> </a>`), PASSPORT_STAMPS.map((stamp) => renderTemplate`<article class="stamp"${addAttribute(stamp.id, "data-passport-stamp")} data-astro-cid-jdztlgyt> <div class="stamp__top" data-astro-cid-jdztlgyt> <span class="stamp__category" data-astro-cid-jdztlgyt>${stamp.category}</span> <strong data-astro-cid-jdztlgyt>${stamp.points}</strong> </div> <h3 data-astro-cid-jdztlgyt>${stamp.label}</h3> <p data-astro-cid-jdztlgyt>${stamp.description}</p> <div class="stamp__actions" data-astro-cid-jdztlgyt> <a${addAttribute(stamp.route, "href")} data-astro-cid-jdztlgyt>${stamp.action}</a> <button type="button" data-stamp-button${addAttribute(stamp.id, "data-stamp-id")} data-astro-cid-jdztlgyt>Stamp</button> </div> <small data-stamp-status data-astro-cid-jdztlgyt>open</small> </article>`), DAILY_WALK_STEPS.length, DAILY_WALK_STEPS.map((step, index) => renderTemplate`<article class="walk-step"${addAttribute(step.id, "data-walk-step")}${addAttribute(step.stampId, "data-step-stamp")} data-astro-cid-jdztlgyt> <span class="walk-step__num" data-astro-cid-jdztlgyt>${String(index + 1).padStart(2, "0")}</span> <div data-astro-cid-jdztlgyt> <h3 data-astro-cid-jdztlgyt>${step.title}</h3> <p data-astro-cid-jdztlgyt>${step.line}</p> <a${addAttribute(step.href, "href")} data-astro-cid-jdztlgyt>${step.href}</a> </div> <button type="button" data-walk-button${addAttribute(step.id, "data-step-id")} data-astro-cid-jdztlgyt>Done</button> </article>`), AGENT_QUESTS.map((quest) => renderTemplate`<article class="quest"${addAttribute(quest.id, "data-quest-id")} data-astro-cid-jdztlgyt> <div class="quest__head" data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${quest.difficulty}</span> <strong data-quest-state data-astro-cid-jdztlgyt>open</strong> </div> <h3 data-astro-cid-jdztlgyt>${quest.title}</h3> <p data-astro-cid-jdztlgyt>${quest.agentBrief}</p> <dl data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <dt data-astro-cid-jdztlgyt>Reward</dt> <dd data-astro-cid-jdztlgyt>${quest.reward}</dd> </div> <div data-astro-cid-jdztlgyt> <dt data-astro-cid-jdztlgyt>Receipt</dt> <dd data-astro-cid-jdztlgyt>${quest.receiptShape.join(", ")}</dd> </div> </dl> <div class="quest__actions" data-astro-cid-jdztlgyt> <a${addAttribute(quest.href, "href")} data-astro-cid-jdztlgyt>Source</a> <button type="button" data-quest-action="claimed"${addAttribute(quest.id, "data-quest-id")} data-astro-cid-jdztlgyt>Claim</button> <button type="button" data-quest-action="done"${addAttribute(quest.id, "data-quest-id")} data-astro-cid-jdztlgyt>Done</button> </div> </article>`), ROOM_WEATHER.map((room) => renderTemplate`<article class="room"${addAttribute(`--room-color: ${room.color}; --room-intensity: ${room.intensity}%`, "style")} data-astro-cid-jdztlgyt> <div class="room__bar" aria-hidden="true" data-astro-cid-jdztlgyt></div> <div class="room__head" data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${room.condition}</span> <strong data-astro-cid-jdztlgyt>${room.intensity}</strong> </div> <h3 data-astro-cid-jdztlgyt>${room.name}</h3> <p data-astro-cid-jdztlgyt>${room.agentAdvice}</p> <ul data-astro-cid-jdztlgyt> ${room.signals.map((signal) => renderTemplate`<li data-astro-cid-jdztlgyt>${signal}</li>`)} </ul> <div class="room__actions" data-astro-cid-jdztlgyt> <a${addAttribute(room.href, "href")} data-astro-cid-jdztlgyt>Open</a> <button type="button" data-stamp-button data-stamp-id="room-weather" data-astro-cid-jdztlgyt>Log</button> </div> </article>`), RADIO_BULLETINS.map((bulletin) => renderTemplate`<a class="bulletin"${addAttribute(bulletin.href, "href")} data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${bulletin.band}</span> <strong data-astro-cid-jdztlgyt>${bulletin.title}</strong> <em data-astro-cid-jdztlgyt>${bulletin.copy}</em> </a>`), COLLECTIBLE_ROUTES.map((route) => renderTemplate`<article class="route-card"${addAttribute(route.id, "data-route-id")}${addAttribute(route.stamps.join(","), "data-route-stamps")}${addAttribute(`--route-color: ${route.color}`, "style")} data-astro-cid-jdztlgyt> <div class="route-card__head" data-astro-cid-jdztlgyt> <span data-route-count data-astro-cid-jdztlgyt>0 / ${route.stamps.length}</span> <strong data-route-state data-astro-cid-jdztlgyt>open</strong> </div> <h3 data-astro-cid-jdztlgyt>${route.title}</h3> <p data-astro-cid-jdztlgyt>${route.deck}</p> <ol data-astro-cid-jdztlgyt> ${route.stamps.map((stampId, index) => renderTemplate`<li${addAttribute(stampId, "data-route-stamp")} data-astro-cid-jdztlgyt> <a${addAttribute(route.hrefs[index], "href")} data-astro-cid-jdztlgyt>${stampById.get(stampId)?.label ?? stampId}</a> </li>`)} </ol> <button type="button" data-route-button data-astro-cid-jdztlgyt>Claim Card</button> <small data-astro-cid-jdztlgyt>${route.reward}</small> </article>`), BUILDER_GHOSTS.map((ghost, index) => renderTemplate`<article class="ghost" data-astro-cid-jdztlgyt> <img${addAttribute(`https://noun.pics/${137 + index * 77}.svg`, "src")} alt="" width="52" height="52" loading="lazy" data-astro-cid-jdztlgyt> <div data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${ghost.role}</span> <h3 data-astro-cid-jdztlgyt><a${addAttribute(ghost.href, "href")} data-astro-cid-jdztlgyt>${ghost.name}</a></h3> <p data-astro-cid-jdztlgyt>${ghost.signal}</p> <nav${addAttribute(`${ghost.name} trails`, "aria-label")} data-astro-cid-jdztlgyt> ${ghost.trails.map((trail) => renderTemplate`<a${addAttribute(trail, "href")} data-astro-cid-jdztlgyt>${trail}</a>`)} </nav> <button type="button" data-stamp-button data-stamp-id="builder-ghost" data-astro-cid-jdztlgyt>Trace</button> </div> </article>`), CIVIC_WISHES.map((wish) => renderTemplate`<a class="wish"${addAttribute(wish.href, "href")} data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${wish.status}</span> <strong data-astro-cid-jdztlgyt>${wish.title}</strong> <em data-astro-cid-jdztlgyt>${wish.outcome}</em> </a>`), addAttribute(`--pet-accent: ${defaultPet.accent}`, "style"), addAttribute(`https://noun.pics/${defaultPet.nounId}.svg`, "src"), defaultPet.name, defaultPet.kind, defaultPet.line, POINTCAST_PETS.map((pet, index) => renderTemplate`<button type="button"${addAttribute(["pet-companion", index === 0 && "is-active"], "class:list")}${addAttribute(pet.id, "data-pet-companion")}${addAttribute(`--pet-card-accent: ${pet.accent}`, "style")}${addAttribute(index === 0 ? "true" : "false", "aria-pressed")}${addAttribute(pet.name, "title")} data-astro-cid-jdztlgyt> <img${addAttribute(`https://noun.pics/${pet.nounId}.svg`, "src")} alt="" width="56" height="56" loading="lazy" data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${pet.name}</span> </button>`), POINTCAST_PETS.map((pet, index) => renderTemplate`<button type="button"${addAttribute(["pet-card", index === 0 && "is-active"], "class:list")}${addAttribute(pet.id, "data-pet-select")}${addAttribute(`--pet-card-accent: ${pet.accent}`, "style")}${addAttribute(index === 0 ? "true" : "false", "aria-pressed")} data-astro-cid-jdztlgyt> <img${addAttribute(`https://noun.pics/${pet.nounId}.svg`, "src")} alt="" width="44" height="44" loading="lazy" data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${pet.kind}</span> <strong data-astro-cid-jdztlgyt>${pet.name}</strong> <em data-astro-cid-jdztlgyt>${pet.line}</em> <small${addAttribute(pet.id, "data-pet-care-count")} data-astro-cid-jdztlgyt>0 care</small> </button>`), ["signal", "glow", "calm", "charge"].map((stat) => renderTemplate`<div class="pet-gauge"${addAttribute(stat, "data-pet-gauge")} data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${stat}</span> <i style="--pet-gauge: 8%" data-astro-cid-jdztlgyt></i> <strong data-pet-value data-astro-cid-jdztlgyt>8</strong> </div>`), PET_CARE_ACTIONS.map((action) => renderTemplate`<button type="button"${addAttribute(action.id, "data-pet-action")}${addAttribute(action.stampId, "data-pet-stamp")} data-astro-cid-jdztlgyt> <strong data-astro-cid-jdztlgyt>${action.label}</strong> <span data-astro-cid-jdztlgyt>${action.line}</span> </button>`), DERBY_SEASON.title, DERBY_SEASON.cadence, DERBY_SEASON.ticketRewards.map((ticket) => renderTemplate`<span data-astro-cid-jdztlgyt>${ticket.label} +${ticket.points}</span>`), DERBY_SEASON.standings.map((row) => {
    const horse = DERBY_ROSTER.find((entry) => entry.slug === row.horseSlug);
    return renderTemplate`<li data-astro-cid-jdztlgyt> <span data-astro-cid-jdztlgyt>${row.rank}</span> <strong data-astro-cid-jdztlgyt>${horse?.name ?? row.horseSlug}</strong> <em data-astro-cid-jdztlgyt>${row.points} pts · ${row.record}</em> </li>`;
  }), DERBY_SEASON.featureRaces.map((race) => renderTemplate`<a${addAttribute(`/agent-derby?seed=${race.seed}&track=${race.track}&agents=${race.agents.join(",")}`, "href")} data-astro-cid-jdztlgyt> <strong data-astro-cid-jdztlgyt>${race.label}</strong> <span data-astro-cid-jdztlgyt>${race.track} · ${race.seed}</span> </a>`), unescapeHTML(JSON.stringify(appData)));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PlayLayerApp.astro", void 0);

const $$PlayLayerSurface = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$PlayLayerSurface;
  const { focus = "overview" } = Astro2.props;
  const surface = PLAY_SURFACES.find((item) => item.id === focus);
  const title = surface ? surface.title : "PointCast Play Layer";
  const description = surface?.summary ?? PLAY_LAYER_DESCRIPTION;
  const primaryTarget = `https://pointcast.xyz${surface?.route ?? "/play"}`;
  const primaryLabel = surface ? `Open ${surface.route}` : "Open Play Layer";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": surface ? "WebApplication" : "CollectionPage",
    "@id": `https://pointcast.xyz${surface?.route ?? "/play"}#play-layer`,
    name: title,
    description,
    url: `https://pointcast.xyz${surface?.route ?? "/play"}`,
    applicationCategory: "GameApplication",
    inLanguage: "en-US",
    hasPart: PLAY_SURFACES.map((item) => ({
      "@type": "WebApplication",
      name: item.title,
      url: `https://pointcast.xyz${item.route}`,
      description: item.summary
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/play.json", title: "PointCast play layer manifest" }], "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: primaryLabel, action: "link", target: primaryTarget },
      { label: "Play JSON", action: "link", target: "https://pointcast.xyz/play.json" },
      { label: "Daily Walk", action: "link", target: "https://pointcast.xyz/walk" }
    ]
  } }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "PlayLayerApp", $$PlayLayerApp, { "focus": focus })} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/PlayLayerSurface.astro", void 0);

export { $$PlayLayerSurface as $ };
