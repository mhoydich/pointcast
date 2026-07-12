import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$WalletChip } from './WalletChip_CCc3HKnc.mjs';
import { D as DERBY_SEASON, a as DERBY_RULEBOOK, b as DERBY_POSTERS, c as DERBY_ROSTER, d as DERBY_TRACKS, e as DERBY_STATS, f as DERBY_VERSION } from './agent-derby_D2xATzzG.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$AgentDerby = createComponent(($$result, $$props, $$slots) => {
  const derbyData = {
    version: DERBY_VERSION,
    stats: DERBY_STATS,
    tracks: DERBY_TRACKS,
    roster: DERBY_ROSTER,
    posters: DERBY_POSTERS,
    rulebook: DERBY_RULEBOOK,
    season: DERBY_SEASON
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "@id": "https://pointcast.xyz/agent-derby#game",
    name: "PointCast Agent Derby",
    description: "A deterministic browser horse-racing game for PointCast agents and humans.",
    url: "https://pointcast.xyz/agent-derby",
    gamePlatform: "Web browser",
    genre: "Horse racing simulation",
    inLanguage: "en-US"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Agent Derby", "description": "A deterministic browser horse-racing game for PointCast agents and humans.", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/agent-derby.json", title: "PointCast Agent Derby manifest" }], "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: "Run race", action: "link", target: "https://pointcast.xyz/agent-derby" },
      { label: "Game JSON", action: "link", target: "https://pointcast.xyz/agent-derby.json" },
      { label: "/for-agents", action: "link", target: "https://pointcast.xyz/for-agents" },
      { label: "Home", action: "link", target: "https://pointcast.xyz/" }
    ]
  }, "data-astro-cid-65woera6": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="derby-page" data-agent-derby data-astro-cid-65woera6> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-65woera6> <a href="/" data-astro-cid-65woera6>Home</a> <span aria-hidden="true" data-astro-cid-65woera6>/</span> <span data-astro-cid-65woera6>agent-derby</span> </nav> <section class="derby-shell" aria-labelledby="derby-title" data-astro-cid-65woera6> <header class="mast" data-astro-cid-65woera6> <div class="mast__copy" data-astro-cid-65woera6> <p class="kicker" data-astro-cid-65woera6>CH.BTL / AGENT DERBY / v', '</p> <h1 id="derby-title" data-astro-cid-65woera6>PointCast Agent Derby</h1> </div> <div class="mast__rail" data-astro-cid-65woera6> <div class="race-key" aria-label="Race status" data-astro-cid-65woera6> <span data-race-id data-astro-cid-65woera6>AD-READY</span> <strong data-race-state data-astro-cid-65woera6>GATES</strong> </div> <div class="beacon-gate" aria-label="Tezos Beacon gate" data-astro-cid-65woera6> <span data-astro-cid-65woera6>Beacon gate</span> ', ' </div> </div> </header> <section class="control-deck" aria-label="Race controls" data-astro-cid-65woera6> <label class="seed-box" data-astro-cid-65woera6> <span data-astro-cid-65woera6>Seed</span> <input type="text" value="gamgee-rc0" data-seed-input spellcheck="false" autocomplete="off" data-astro-cid-65woera6> </label> <div class="track-tabs" data-track-tabs role="tablist" aria-label="Track select" data-astro-cid-65woera6></div> <div class="button-row" data-astro-cid-65woera6> <button type="button" class="btn btn--primary" data-action="run" data-astro-cid-65woera6>Run race</button> <button type="button" class="btn" data-action="new-field" data-astro-cid-65woera6>New field</button> <button type="button" class="btn" data-action="reset" data-astro-cid-65woera6>Reset</button> </div> </section> <section class="poster-wall" aria-labelledby="poster-wall-title" data-astro-cid-65woera6> <div class="poster-wall__head" data-astro-cid-65woera6> <div data-astro-cid-65woera6> <p class="poster-wall__kicker" data-astro-cid-65woera6>1980s trapper heat / agent durby posters</p> <h2 id="poster-wall-title" data-astro-cid-65woera6>Mean stable sheets</h2> </div> <a href="/agent-derby.json" data-astro-cid-65woera6>Poster manifest</a> </div> <div class="poster-grid" data-astro-cid-65woera6> ', ' </div> </section> <section class="season-board" aria-labelledby="season-board-title" data-astro-cid-65woera6> <div class="season-board__head" data-astro-cid-65woera6> <div data-astro-cid-65woera6> <p class="season-board__kicker" data-astro-cid-65woera6>league table / tickets / feature seeds</p> <h2 id="season-board-title" data-astro-cid-65woera6>', '</h2> </div> <a href="/play#derby-season" data-astro-cid-65woera6>Play layer</a> </div> <div class="season-board__grid" data-astro-cid-65woera6> <article class="season-card season-card--intro" data-astro-cid-65woera6> <p data-astro-cid-65woera6>', '</p> <div class="ticket-row" data-astro-cid-65woera6> ', ' </div> </article> <article class="season-card" data-astro-cid-65woera6> <h3 data-astro-cid-65woera6>Standings</h3> <ol class="season-standings" data-astro-cid-65woera6> ', ' </ol> </article> <article class="season-card" data-astro-cid-65woera6> <h3 data-astro-cid-65woera6>Feature Seeds</h3> <div class="feature-races" data-astro-cid-65woera6> ', ' </div> </article> </div> </section> <div class="race-grid" data-astro-cid-65woera6> <main class="track-card" aria-label="Race track" data-astro-cid-65woera6> <div class="track-card__top" data-astro-cid-65woera6> <span data-track-label data-astro-cid-65woera6>El Segundo Sprint</span> <strong data-track-meta data-astro-cid-65woera6>ES-1200 / 1200m / fast dirt</strong> </div> <div class="track-stage" data-track-stage data-astro-cid-65woera6></div> </main> <aside class="stable-card" aria-label="Field" data-astro-cid-65woera6> <div class="stable-card__head" data-astro-cid-65woera6> <span data-astro-cid-65woera6>Field</span> <strong data-field-summary data-astro-cid-65woera6>6 gates loaded</strong> </div> <div class="field-list" data-field-list data-astro-cid-65woera6></div> </aside> </div> <div class="race-bottom" data-astro-cid-65woera6> <section class="result-card" aria-label="Race result" data-astro-cid-65woera6> <div class="panel-head" data-astro-cid-65woera6> <span data-astro-cid-65woera6>Result</span> <button type="button" class="mini-btn" data-action="copy" data-astro-cid-65woera6>Copy receipt</button> </div> <div class="podium" data-podium data-astro-cid-65woera6> <p data-astro-cid-65woera6>Gates are loaded.</p> </div> <pre class="receipt" data-receipt aria-label="Race receipt" data-astro-cid-65woera6>', '</pre> </section> <section class="log-card" aria-label="Race call" data-astro-cid-65woera6> <div class="panel-head" data-astro-cid-65woera6> <span data-astro-cid-65woera6>Call</span> <a href="/agent-derby.json" data-astro-cid-65woera6>/agent-derby.json</a> </div> <div class="race-log" data-race-log data-astro-cid-65woera6> <p data-astro-cid-65woera6>Race desk standing by.</p> </div> </section> <section class="agent-card" aria-label="Agent protocol" data-astro-cid-65woera6> <div class="panel-head" data-astro-cid-65woera6> <span data-astro-cid-65woera6>Agent line</span> <a href="/for-agents" data-astro-cid-65woera6>/for-agents</a> </div> <code data-astro-cid-65woera6>/agent-derby?seed=gamgee-rc0&amp;track=wire-mile&amp;agents=claude,codex,manus</code> <div class="history-list" data-history-list data-astro-cid-65woera6></div> </section> </div> </section> </div> <script type="application/json" id="derby-data">', `<\/script> <script>
    (function () {
      var root = document.querySelector('[data-agent-derby]');
      var dataEl = document.getElementById('derby-data');
      if (!root || !dataEl) return;

      var DATA = JSON.parse(dataEl.textContent || '{}');
      var TRACKS = DATA.tracks || [];
      var ROSTER = DATA.roster || [];
      var STATS = DATA.stats || ['speed', 'stamina', 'burst', 'nerve', 'gate', 'grit'];
      var STORAGE_KEY = 'pc:agent-derby:races';
      var FRAME_COUNT = 120;

      var params = new URLSearchParams(window.location.search);
      var seedInput = root.querySelector('[data-seed-input]');
      var trackTabs = root.querySelector('[data-track-tabs]');
      var trackStage = root.querySelector('[data-track-stage]');
      var fieldList = root.querySelector('[data-field-list]');
      var historyList = root.querySelector('[data-history-list]');
      var raceLog = root.querySelector('[data-race-log]');
      var receiptEl = root.querySelector('[data-receipt]');
      var podium = root.querySelector('[data-podium]');
      var raceIdEl = root.querySelector('[data-race-id]');
      var raceStateEl = root.querySelector('[data-race-state]');
      var trackLabel = root.querySelector('[data-track-label]');
      var trackMeta = root.querySelector('[data-track-meta]');
      var fieldSummary = root.querySelector('[data-field-summary]');

      var state = {
        seed: params.get('seed') || 'gamgee-rc0',
        trackId: params.get('track') || (TRACKS[0] && TRACKS[0].id),
        field: [],
        sim: null,
        timer: 0,
        frame: 0,
        racing: false,
        receipt: null,
      };

      seedInput.value = state.seed;

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
          return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
        });
      }

      function hashString(value) {
        var hash = 2166136261;
        var text = String(value);
        for (var i = 0; i < text.length; i += 1) {
          hash ^= text.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
      }

      function rngFrom(value) {
        var a = hashString(value);
        return function () {
          a |= 0;
          a = (a + 0x6D2B79F5) | 0;
          var t = Math.imul(a ^ (a >>> 15), 1 | a);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      }

      function activeTrack() {
        return TRACKS.find(function (track) { return track.id === state.trackId; }) || TRACKS[0];
      }

      function agentTokens() {
        return (new URLSearchParams(window.location.search).get('agents') || '')
          .split(',')
          .map(function (token) { return token.trim().toLowerCase(); })
          .filter(Boolean);
      }

      function matchesToken(horse, token) {
        return horse.slug.toLowerCase().indexOf(token) >= 0 ||
          horse.agent.toLowerCase().indexOf(token) >= 0 ||
          horse.name.toLowerCase().indexOf(token) >= 0;
      }

      function selectField(seed) {
        var requested = [];
        agentTokens().forEach(function (token) {
          var match = ROSTER.find(function (horse) { return matchesToken(horse, token); });
          if (match && requested.indexOf(match) === -1) requested.push(match);
        });

        var rng = rngFrom(seed + ':field');
        var shuffled = ROSTER
          .filter(function (horse) { return requested.indexOf(horse) === -1; })
          .map(function (horse) { return { horse: horse, sort: rng() }; })
          .sort(function (a, b) { return a.sort - b.sort; })
          .map(function (item) { return item.horse; });

        return requested.concat(shuffled).slice(0, 6).map(function (horse, index) {
          return Object.assign({}, horse, { gate: index + 1 });
        });
      }

      function ratingFor(horse, track) {
        var total = 0;
        STATS.forEach(function (stat) {
          total += horse.stats[stat] * (track.bias[stat] || 1);
        });
        return total / STATS.length;
      }

      function raceId(seed, track, field) {
        var base = seed + ':' + track.id + ':' + field.map(function (horse) { return horse.slug; }).join(',');
        return 'AD-' + hashString(base).toString(36).toUpperCase().slice(0, 6).padStart(6, '0');
      }

      function simulateRace(seed, trackId, field) {
        var track = TRACKS.find(function (item) { return item.id === trackId; }) || TRACKS[0];
        var ratings = field.map(function (horse) { return ratingFor(horse, track); });
        var totalRating = ratings.reduce(function (sum, rating) { return sum + rating; }, 0);

        var runners = field.map(function (horse, runnerIndex) {
          var rng = rngFrom(seed + ':' + track.id + ':' + horse.slug);
          var rating = ratings[runnerIndex];
          var distance = 0;
          var raw = [0];
          var trouble = null;

          for (var tick = 1; tick <= FRAME_COUNT; tick += 1) {
            var p = tick / FRAME_COUNT;
            var gatePush = Math.max(0, 1 - p * 5) * (horse.stats.gate - 50) * 0.2;
            var cruise = Math.sin(Math.PI * Math.min(1, p * 1.12)) * (horse.stats.speed - 50) * 0.045;
            var stretch = Math.max(0, (p - 0.62) / 0.38) * (((horse.stats.stamina + horse.stats.burst) / 2) - 50) * 0.11;
            var surface = 0;
            if (track.id === 'dune-night') surface = (horse.stats.grit - 50) * 0.08;
            if (track.id === 'fog-route') surface = (((horse.stats.nerve + horse.stats.grit) / 2) - 50) * 0.07;

            var trafficWindow = p > 0.24 && p < 0.76;
            if (!trouble && trafficWindow && rng() < (100 - horse.stats.nerve) / 18000) {
              trouble = { tick: tick, note: horse.name + ' checked in traffic' };
            }

            var penalty = trouble && tick - trouble.tick < 11 ? 10.5 : 0;
            var pace = 47 + rating / 3.35 + gatePush + cruise + stretch + surface + (rng() - 0.5) * 6 - penalty;
            distance += Math.max(16, pace);
            raw.push(distance);
          }

          var chance = Math.max(0.05, rating / totalRating);
          return Object.assign({}, horse, {
            rating: rating,
            odds: (1 / chance).toFixed(1) + 'x',
            raw: raw,
            finish: raw[raw.length - 1],
            trouble: trouble,
          });
        });

        var maxDistance = runners.reduce(function (max, runner) { return Math.max(max, runner.finish); }, 0);
        runners.forEach(function (runner) {
          runner.positions = runner.raw.map(function (value) { return Math.min(100, (value / maxDistance) * 100); });
          runner.margin = Number((((maxDistance - runner.finish) / maxDistance) * 12).toFixed(2));
          runner.time = Number((track.par + runner.margin * 0.43).toFixed(2));
        });

        var order = runners.slice().sort(function (a, b) {
          return b.finish - a.finish || a.gate - b.gate;
        });

        return {
          raceId: raceId(seed, track, field),
          seed: seed,
          track: track,
          runners: runners,
          order: order,
          winner: order[0],
        };
      }

      function horseSvg() {
        return '<svg viewBox="0 0 96 52" aria-hidden="true" focusable="false">' +
          '<path fill="var(--coat)" d="M12 35h14l6-12h20l8 7 10-14 12 1 6 7-6 4 5 5-8 2-5-5-7 12H49l-5 9h-8l3-9H25l-7 9h-8l8-10-6-7Z"/>' +
          '<path fill="var(--accent)" d="M54 22l7 5 5-8-7-3-5 6Zm-24 1h12l-3 6H27l3-6Z"/>' +
          '<circle cx="80" cy="22" r="2" fill="#12110e"/>' +
          '<path stroke="#12110e" stroke-width="3" stroke-linecap="round" d="M25 37l-7 10M46 37l-4 10M62 37l5 10"/>' +
          '</svg>';
      }

      function statBars(horse) {
        return STATS.map(function (stat) {
          var value = horse.stats[stat];
          return '<div class="stat-line"><span>' + stat.toUpperCase() + '</span><strong>' + value + '</strong><i style="--v:' + value + '%"></i></div>';
        }).join('');
      }

      function renderTrackTabs() {
        trackTabs.innerHTML = TRACKS.map(function (track) {
          var selected = track.id === state.trackId ? ' aria-selected="true"' : ' aria-selected="false"';
          return '<button type="button" role="tab" data-track="' + escapeHtml(track.id) + '"' + selected + '>' +
            '<span>' + escapeHtml(track.code) + '</span>' +
            '<strong>' + escapeHtml(track.label) + '</strong>' +
            '</button>';
        }).join('');
      }

      function renderTrack() {
        var sim = state.sim;
        var track = sim.track;
        trackLabel.textContent = track.label;
        trackMeta.textContent = track.code + ' / ' + track.distance + 'm / ' + track.going;
        raceIdEl.textContent = sim.raceId;
        fieldSummary.textContent = sim.runners.length + ' gates loaded';

        trackStage.innerHTML =
          '<div class="track-ruler"><span>GATE</span><span>BACKSTRETCH</span><span>TURN</span><span>WIRE</span></div>' +
          sim.runners.map(function (runner) {
            return '<div class="lane" data-lane="' + escapeHtml(runner.slug) + '">' +
              '<div class="lane__meta"><span>G' + runner.gate + '</span><strong>' + escapeHtml(runner.name) + '</strong><small>' + escapeHtml(runner.agent) + ' / ' + runner.odds + '</small></div>' +
              '<div class="lane__rail">' +
                '<span class="lane__fill" data-fill="' + escapeHtml(runner.slug) + '"></span>' +
                '<span class="runner" data-runner="' + escapeHtml(runner.slug) + '" style="--coat:' + escapeHtml(runner.coat) + ';--accent:' + escapeHtml(runner.accent) + ';left:3%;">' + horseSvg() + '</span>' +
              '</div>' +
            '</div>';
          }).join('');
      }

      function renderField() {
        fieldList.innerHTML = state.sim.runners.map(function (runner) {
          return '<article class="horse-card" style="--coat:' + escapeHtml(runner.coat) + ';--accent:' + escapeHtml(runner.accent) + '">' +
            '<div class="horse-card__top"><span>G' + runner.gate + '</span><strong>' + escapeHtml(runner.name) + '</strong><small>' + escapeHtml(runner.odds) + '</small></div>' +
            '<p>' + escapeHtml(runner.stable) + '</p>' +
            '<em>' + escapeHtml(runner.bloodline) + '</em>' +
            '<div class="stats">' + statBars(runner) + '</div>' +
          '</article>';
        }).join('');
      }

      function receiptFor(sim) {
        return {
          raceId: sim.raceId,
          seed: sim.seed,
          track: sim.track.id,
          generatedAt: new Date().toISOString(),
          winner: sim.winner.slug,
          order: sim.order.map(function (runner) { return runner.slug; }),
          margins: sim.order.map(function (runner) {
            return { slug: runner.slug, margin: runner.margin, time: runner.time };
          }),
        };
      }

      function renderReceipt(receipt) {
        receiptEl.textContent = JSON.stringify(receipt || {}, null, 2);
      }

      function renderPodium() {
        if (!state.receipt) {
          podium.innerHTML = '<p>Gates are loaded.</p>';
          return;
        }
        var order = state.sim.order;
        podium.innerHTML = order.slice(0, 3).map(function (runner, index) {
          var place = index + 1;
          return '<article class="podium-step podium-step--' + place + '" style="--coat:' + escapeHtml(runner.coat) + '">' +
            '<span>' + place + '</span>' +
            '<strong>' + escapeHtml(runner.name) + '</strong>' +
            '<small>' + (runner.margin === 0 ? 'winner' : runner.margin + ' lengths') + '</small>' +
          '</article>';
        }).join('');
      }

      function readHistory() {
        try {
          return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (error) {
          return [];
        }
      }

      function writeHistory(receipt) {
        var next = [receipt].concat(readHistory().filter(function (item) { return item.raceId !== receipt.raceId; })).slice(0, 12);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {}
      }

      function renderHistory() {
        var items = readHistory().slice(0, 4);
        historyList.innerHTML = items.length
          ? items.map(function (item) {
              return '<a href="/agent-derby?seed=' + encodeURIComponent(item.seed) + '&track=' + encodeURIComponent(item.track) + '">' +
                '<span>' + escapeHtml(item.raceId) + '</span><strong>' + escapeHtml(item.winner) + '</strong>' +
              '</a>';
            }).join('')
          : '<p>No race receipts yet.</p>';
      }

      function logLine(text) {
        var p = document.createElement('p');
        p.textContent = text;
        raceLog.prepend(p);
        while (raceLog.children.length > 8) raceLog.removeChild(raceLog.lastChild);
      }

      function setStateLabel(value) {
        raceStateEl.textContent = value;
        root.dataset.racePhase = value.toLowerCase();
      }

      function updateUrl() {
        var url = new URL(window.location.href);
        url.searchParams.set('seed', state.seed);
        url.searchParams.set('track', state.trackId);
        window.history.replaceState({}, '', url);
      }

      function updatePositions(frame) {
        state.sim.runners.forEach(function (runner) {
          var progress = runner.positions[Math.min(frame, runner.positions.length - 1)] || 0;
          var x = 3 + progress * 0.935;
          var marker = trackStage.querySelector('[data-runner="' + runner.slug + '"]');
          var fill = trackStage.querySelector('[data-fill="' + runner.slug + '"]');
          if (marker) marker.style.left = x + '%';
          if (fill) fill.style.width = Math.max(0, x - 3) + '%';
        });
      }

      function prepareRace(options) {
        window.clearInterval(state.timer);
        state.racing = false;
        state.frame = 0;
        state.receipt = null;
        if (!options || !options.keepField) state.field = selectField(state.seed);
        state.sim = simulateRace(state.seed, state.trackId, state.field);
        raceLog.innerHTML = '<p>Race desk standing by.</p>';
        setStateLabel('GATES');
        updateUrl();
        renderTrackTabs();
        renderTrack();
        renderField();
        renderReceipt(null);
        renderPodium();
        renderHistory();
        updatePositions(0);
      }

      function leaderAt(frame) {
        return state.sim.runners
          .slice()
          .sort(function (a, b) {
            return (b.positions[frame] || 0) - (a.positions[frame] || 0);
          })[0];
      }

      function playRace() {
        if (state.racing) return;
        prepareRace({ keepField: true });
        state.racing = true;
        state.frame = 0;
        setStateLabel('LIVE');
        logLine('And they are off at ' + state.sim.track.label + '.');
        state.timer = window.setInterval(function () {
          state.frame += 1;
          updatePositions(state.frame);

          if (state.frame === 25 || state.frame === 58 || state.frame === 92) {
            var leader = leaderAt(state.frame);
            logLine(leader.name + ' leads through frame ' + state.frame + '.');
          }

          if (state.frame >= FRAME_COUNT) {
            window.clearInterval(state.timer);
            state.racing = false;
            state.receipt = receiptFor(state.sim);
            writeHistory(state.receipt);
            setStateLabel('PHOTO');
            logLine(state.sim.winner.name + ' hits the wire first.');
            state.sim.order.forEach(function (runner) {
              if (runner.trouble) logLine(runner.trouble.note + '.');
            });
            renderReceipt(state.receipt);
            renderPodium();
            renderHistory();
          }
        }, 38);
      }

      trackTabs.addEventListener('click', function (event) {
        var button = event.target.closest('[data-track]');
        if (!button || state.racing) return;
        state.trackId = button.getAttribute('data-track');
        prepareRace({ keepField: true });
      });

      root.addEventListener('click', function (event) {
        var action = event.target.closest('[data-action]');
        if (!action) return;
        var name = action.getAttribute('data-action');

        if (name === 'run') playRace();
        if (name === 'reset' && !state.racing) prepareRace({ keepField: true });
        if (name === 'new-field' && !state.racing) {
          state.seed = 'race-' + Date.now().toString(36).slice(-7);
          seedInput.value = state.seed;
          prepareRace();
        }
        if (name === 'copy') {
          var receipt = state.receipt || receiptFor(state.sim);
          navigator.clipboard?.writeText(JSON.stringify(receipt, null, 2));
          logLine('Receipt copied for ' + receipt.raceId + '.');
        }
      });

      seedInput.addEventListener('change', function () {
        if (state.racing) return;
        state.seed = seedInput.value.trim() || 'gamgee-rc0';
        seedInput.value = state.seed;
        prepareRace();
      });

      prepareRace();
    })();
  <\/script> `])), maybeRenderHead(), DERBY_VERSION, renderComponent($$result2, "WalletChip", $$WalletChip, { "data-astro-cid-65woera6": true }), DERBY_POSTERS.map((poster) => renderTemplate`<a class="poster-card"${addAttribute(`/agent-derby?seed=${poster.seed}&track=${poster.track}&agents=${poster.agent.toLowerCase()}`, "href")}${addAttribute(`--poster-position:${poster.imagePosition}`, "style")}${addAttribute(`Run ${poster.title}`, "aria-label")} data-astro-cid-65woera6> <img${addAttribute(poster.image, "src")} alt="" loading="lazy" decoding="async" data-astro-cid-65woera6> <span class="poster-card__gate" data-astro-cid-65woera6>${poster.gate}</span> <span class="poster-card__agent" data-astro-cid-65woera6>${poster.agent}</span> <strong data-astro-cid-65woera6>${poster.title}</strong> <small data-astro-cid-65woera6>${poster.palette.join(" / ")}</small> </a>`), DERBY_SEASON.title, DERBY_SEASON.cadence, DERBY_SEASON.ticketRewards.map((ticket) => renderTemplate`<span data-astro-cid-65woera6>${ticket.label} · +${ticket.points}</span>`), DERBY_SEASON.standings.map((row) => {
    const horse = DERBY_ROSTER.find((entry) => entry.slug === row.horseSlug);
    return renderTemplate`<li data-astro-cid-65woera6> <span data-astro-cid-65woera6>${row.rank}</span> <strong data-astro-cid-65woera6>${horse?.name ?? row.horseSlug}</strong> <em data-astro-cid-65woera6>${row.points} pts · ${row.record}</em> </li>`;
  }), DERBY_SEASON.featureRaces.map((race) => renderTemplate`<a${addAttribute(`/agent-derby?seed=${race.seed}&track=${race.track}&agents=${race.agents.join(",")}`, "href")} data-astro-cid-65woera6> <strong data-astro-cid-65woera6>${race.label}</strong> <span data-astro-cid-65woera6>${race.track} · ${race.seed}</span> </a>`), void 0, unescapeHTML(JSON.stringify(derbyData))) })} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/agent-derby.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/agent-derby.astro";
const $$url = "/agent-derby";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AgentDerby,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
