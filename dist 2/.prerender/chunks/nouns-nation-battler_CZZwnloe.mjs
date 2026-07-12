import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { a as NOUNS_BATTLER_WATCH_NEXT } from './nouns-battler-agent-bench_CoupaMI8.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$NounsNationBattler = createComponent(($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  const kingdomTvUrl = "https://pointcast.xyz/games/nouns-nation-battler/#mode=tv&type=kingdom";
  const kingdomMobileUrl = "https://pointcast.xyz/nouns-nation-battler-mobile/?type=kingdom";
  const kingdomShareText = "Watch Nouns Kingdom v2: 25 vs 25 Nouns, proposal waves, auction tower volleys, meme lane floods, and Noun Gate pressure. " + kingdomTvUrl;
  const kingdomMobileShareText = "Watch Nouns Kingdom Pocket Cast: 25 vs 25 Nouns siege, proposal waves, auction towers, and Noun Gate pressure. " + kingdomMobileUrl;
  const tickerItems = [
    "30 vs 30 auto-battle live from CH.BTL",
    "Nouns Kingdom v2 is live: 25 vs 25 Nouns, proposal waves, auction towers, and meme lane floods",
    "Two-week table rolls toward the Nouns Bowl",
    "Scout cards, boss fields, and season challenges are active",
    "Scorebug listens to the embedded v39 match engine",
    "Battle Desk V3 is now the federation operating room",
    "Season recap archive tracks champions, MVPs, media angles, next season, and the rival Builder Circuit",
    "Season 6 Sprint Room packages expansion combine, media week, rights sheet, and rival-league scouting",
    "Claim Board, Production Desk, Sponsor Desk, Desk Wall, Watch Frames, Agent Bench, Sideline Desk, asset factory, posters, and JSON are live"
  ];
  const featureStories = [
    {
      label: "Sprint Room",
      title: "Season 6 has a launch board now",
      dek: "The next sprint turns federation into a calendar: combine, media week, rivalry test night, rights receipts, and Bowl lock.",
      image: "/games/nouns-nation-battler/assets/noun-58.svg"
    },
    {
      label: "Recap Desk",
      title: "The archive gives the league memory",
      dek: "V3 now has recent champions, MVP tiers, media arguments, next-season odds, and a rival league preview.",
      image: "/games/nouns-nation-battler/assets/noun-3.svg"
    },
    {
      label: "Top Story",
      title: "The Nouns Bowl path starts with one live slate",
      dek: "Every matchup moves the local table: wins, points, fans, rivalry heat, and challenge marks.",
      image: "/games/nouns-nation-battler/assets/noun-12.svg"
    },
    {
      label: "Film Room",
      title: "Boss fields are where the desk earns its keep",
      dek: "Monsoon Rift, Neon Crown, Scrap Storm, and Blackout Fog turn normal roles into weird reads.",
      image: "/games/nouns-nation-battler/assets/noun-41.svg"
    },
    {
      label: "Root Line",
      title: "Pick a gang, then watch the table remember",
      dek: "Rooting is browser-local, but it makes an automated field feel like a room with sides.",
      image: "/games/nouns-nation-battler/assets/noun-27.svg"
    }
  ];
  const schedule = [
    { slot: "Now", matchup: "Live league slate", status: "Main feed" },
    { slot: "Next", matchup: "Winner reports to table", status: "Auto Next queue" },
    { slot: "TV", matchup: "Director Mode Cast", status: "/nouns-nation-battler-tv" },
    { slot: "Wall", matchup: "Season Desk report", status: "/nouns-nation-battler-desk" }
  ];
  const fallbackStandings = [
    { short: "TN", name: "Tomato Noggles", record: "0-0", detail: "0 fans", color: "#e45745" },
    { short: "CF", name: "Cobalt Frames", record: "0-0", detail: "0 fans", color: "#3677e0" },
    { short: "GN", name: "Golden Nouncil", record: "0-0", detail: "0 fans", color: "#d49b19" },
    { short: "GS", name: "Garden Stack", record: "0-0", detail: "0 fans", color: "#3f9b54" }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "PointCast Battle Desk: Nouns Nation Battler",
    description: "A sports-desk style live hub for the v39 automated 30v30 Nouns Nation Battler league with snapshot-backed Desk Wall watch frames, Results Desk MCP scorebooks, an Agent Bench claim queue, Sideline Desk asset factory, no-money-yet Sponsorship Desk, local-first Production Desk, and public Claim Board.",
    url: "https://pointcast.xyz/nouns-nation-battler/",
    gamePlatform: "Web browser",
    genre: "Auto battler",
    inLanguage: "en-US"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () {
  'use strict';

  var SOURCE = 'pointcast:nouns-nation-battler';
  var CONTROL_SOURCE = 'pointcast:battle-desk';
  var desk = document.querySelector('[data-battle-desk]');
  var frame = document.getElementById('battleFrame');
  if (!desk || !frame) return;

  function find(selector) {
    return desk.querySelector(selector);
  }

  function setText(selector, value) {
    var node = find(selector);
    if (node) node.textContent = value;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function assetPath(asset) {
    if (!asset) return '/games/nouns-nation-battler/assets/noun-0.svg';
    if (/^https?:\\/\\//.test(asset) || asset.charAt(0) === '/') return asset;
    return '/games/nouns-nation-battler/' + asset.replace(/^\\.?\\//, '');
  }

  function postCommand(command, extra) {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage(Object.assign({
      source: CONTROL_SOURCE,
      type: 'command',
      command: command,
    }, extra || {}), window.location.origin);
  }

  function copyText(text, button) {
    var value = String(text || '');
    if (!value) return;
    var done = function () {
      if (!button) return;
      var original = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      window.setTimeout(function () {
        button.textContent = original;
        button.classList.remove('copied');
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(function () {});
    } else {
      var input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        done();
      } catch (error) {
        // Ignore copy failures; the link remains visible.
      }
      document.body.removeChild(input);
    }
  }

  function parseScore(score) {
    var parts = String(score || '').match(/\\d+/g) || [];
    var winner = Number(parts[0] || 0);
    var loser = Number(parts[1] || 0);
    if (winner < loser) {
      var temp = winner;
      winner = loser;
      loser = temp;
    }
    return { winner: winner, loser: loser, margin: Math.max(0, winner - loser) };
  }

  function reenactorValue(name) {
    var node = find('[data-reenactor-field="' + name + '"]');
    return node ? node.value : '';
  }

  var reenactorSlate = [
    { league: 'NBA', winner: 'Celtics', loser: 'Knicks', score: '112-109', shape: 'close' },
    { league: 'WNBA', winner: 'Aces', loser: 'Liberty', score: '88-84', shape: 'comeback' },
    { league: 'NFL', winner: 'Chiefs', loser: 'Ravens', score: '27-24', shape: 'overtime' },
    { league: 'MLB', winner: 'Dodgers', loser: 'Padres', score: '11-3', shape: 'blowout' },
    { league: 'EPL', winner: 'Brighton', loser: 'Arsenal', score: '2-1', shape: 'upset' },
  ];

  function reenactorFieldSet(name, value) {
    var node = find('[data-reenactor-field="' + name + '"]');
    if (node) node.value = value;
  }

  function reenactorSet(name, value) {
    var node = find('[data-reenactor-output="' + name + '"]');
    if (node) node.textContent = value;
  }

  function loadReenactorSlate(index, launch) {
    var item = reenactorSlate[index] || reenactorSlate[0];
    reenactorFieldSet('league', item.league);
    reenactorFieldSet('winner', item.winner);
    reenactorFieldSet('loser', item.loser);
    reenactorFieldSet('score', item.score);
    reenactorFieldSet('shape', item.shape);
    renderReenactment();
    reenactorSet('status', 'Loaded ' + item.league + ' ' + item.winner + '-' + item.loser + ' from the local alt slate.');
    if (launch) launchReenactment();
  }

  function reenactorBlueprint() {
    var league = reenactorValue('league') || 'Sports';
    var winner = reenactorValue('winner') || 'Winner';
    var loser = reenactorValue('loser') || 'Loser';
    var score = parseScore(reenactorValue('score'));
    var shape = reenactorValue('shape') || 'close';
    var winnerAlive = Math.max(4, Math.min(24, 9 + Math.round(score.margin / 2)));
    var loserAlive = Math.max(1, winnerAlive - Math.max(1, Math.min(12, score.margin || 3)));
    var field = 'Windy kingdom rush';
    var modifier = 'late-lane gust';
    var verb = 'survive';

    if (shape === 'comeback') {
      field = 'Garden comeback field';
      modifier = 'fourth-phase healing patch';
      verb = 'flip';
    } else if (shape === 'blowout') {
      field = 'Lava lane rout';
      modifier = 'bench-mob surge';
      verb = 'overrun';
      winnerAlive = Math.max(winnerAlive, 22);
      loserAlive = Math.min(loserAlive, 5);
    } else if (shape === 'upset') {
      field = 'Auction floor upset';
      modifier = 'belief meter spike';
      verb = 'steal';
    } else if (shape === 'overtime') {
      field = 'Rift overtime field';
      modifier = 'sudden-death blink';
      verb = 'outlast';
      winnerAlive = Math.max(6, winnerAlive - 2);
      loserAlive = Math.max(3, winnerAlive - 1);
    }

    return {
      league: league,
      winner: winner,
      loser: loser,
      score: score,
      shape: shape,
      winnerAliveBias: winnerAlive,
      loserAliveBias: loserAlive,
      field: field,
      modifier: modifier,
      headline: winner + ' ' + verb + ' the Nouns reenactment',
      body: winner + ' ' + score.winner + ', ' + loser + ' ' + score.loser + ' becomes a ' + winnerAlive + '-' + loserAlive + ' survivor finish.',
    };
  }

  function renderReenactment() {
    var next = reenactorBlueprint();
    reenactorSet('kicker', next.league + ' informational reenactment');
    reenactorSet('headline', next.headline);
    reenactorSet('body', next.body);
    reenactorSet('field', 'Field: ' + next.field + ' / Modifier: ' + next.modifier);
    reenactorSet('status', 'Generated locally from a typed result shape. No official data feed used.');
    return next;
  }

  function launchReenactment() {
    var next = renderReenactment();
    postCommand('reenactResult', {
      reenactment: {
        league: next.league,
        winner: next.winner,
        loser: next.loser,
        score: next.score.winner + '-' + next.score.loser,
        sourceResult: next.league + ': ' + next.winner + ' ' + next.score.winner + ', ' + next.loser + ' ' + next.score.loser,
        shape: next.shape,
        field: next.field,
        modifier: next.modifier,
        winnerAliveBias: next.winnerAliveBias,
        loserAliveBias: next.loserAliveBias,
        headline: next.headline,
        guardrail: 'Informational alt-broadcast setup, not an official replay.',
      },
    });
    reenactorSet('status', 'Launched themed Nouns battle setup in the embedded field.');
  }

  function reenactmentReceipt() {
    var next = renderReenactment();
    return [
      'Nouns Nation Result Reenactor',
      next.league + ': ' + next.winner + ' ' + next.score.winner + ', ' + next.loser + ' ' + next.score.loser,
      next.headline,
      next.body,
      'Field: ' + next.field,
      'Modifier: ' + next.modifier,
      'Informational alt-broadcast receipt, not an official replay.',
      new URL('/nouns-nation-battler/', window.location.origin).toString(),
    ].join('\\n');
  }

  function speedLabel(speed) {
    if (speed >= 1.4) return 'Rush speed';
    if (speed <= 0.8) return 'Slow speed';
    return 'Live speed';
  }

  function renderTopNouns(leaders) {
    var node = find('[data-live-field="top-nouns"]');
    if (!node) return;
    var rows = []
      .concat((leaders && leaders.left) || [])
      .concat((leaders && leaders.right) || [])
      .sort(function (a, b) {
        var aScore = ((a.stats && a.stats.damage) || 0) + ((a.stats && a.stats.kos) || 0) * 34 + ((a.stats && a.stats.heals) || 0) * 0.12;
        var bScore = ((b.stats && b.stats.damage) || 0) + ((b.stats && b.stats.kos) || 0) * 34 + ((b.stats && b.stats.heals) || 0) * 0.12;
        return bScore - aScore;
      })
      .slice(0, 6);

    if (!rows.length) return;
    node.innerHTML = rows.map(function (unit) {
      var line = '#' + escapeHtml(unit.number || '?') + ' / ' + escapeHtml(unit.role || 'noun') + ' / ' + escapeHtml(unit.hp || 0) + '% HP';
      var stat = unit.stats ? escapeHtml(unit.stats.damage || 0) + ' dmg · ' + escapeHtml(unit.stats.kos || 0) + ' KO' : 'warming up';
      return '<article>' +
        '<img src="' + escapeHtml(assetPath(unit.asset)) + '" alt="" loading="lazy" />' +
        '<span>' + line + '</span>' +
        '<strong>' + escapeHtml(unit.name || 'Noun') + '</strong>' +
        '<em>' + stat + '</em>' +
      '</article>';
    }).join('');
  }

  function renderStandings(rows) {
    var node = find('[data-live-field="standings"]');
    if (!node || !rows || !rows.length) return;
    node.innerHTML = rows.slice(0, 8).map(function (row, index) {
      var diff = Number(row.pf || 0) - Number(row.pa || 0);
      var diffLabel = (diff >= 0 ? '+' : '') + diff;
      return '<article style="--team:' + escapeHtml(row.color || '#8A2432') + '">' +
        '<span>' + String(index + 1) + '</span>' +
        '<strong>' + escapeHtml(row.short || '--') + '</strong>' +
        '<em>' + escapeHtml(row.name || 'Gang') + '</em>' +
        '<b>' + escapeHtml(row.wins || 0) + '-' + escapeHtml(row.losses || 0) + '</b>' +
        '<i>' + diffLabel + ' / ' + escapeHtml(row.fans || 0) + ' fans</i>' +
      '</article>';
    }).join('');
  }

  function renderLog(logs) {
    var node = find('[data-live-field="log"]');
    if (!node || !logs || !logs.length) return;
    node.innerHTML = logs.slice(0, 7).map(function (line) {
      return '<p>' + escapeHtml(line) + '</p>';
    }).join('');
  }

  function renderSnapshot(payload) {
    if (!payload || !payload.gangs || payload.gangs.length < 2) return;

    var leftGang = payload.gangs[0];
    var rightGang = payload.gangs[1];
    var left = payload.alive ? payload.alive.left : 30;
    var right = payload.alive ? payload.alive.right : 30;
    var total = Math.max(1, left + right);
    var leftShare = (left / total) * 100;
    var stateLabel = payload.finished ? 'FINAL' : (payload.running ? 'LIVE' : 'PAUSED');
    var fieldName = payload.field && payload.field.boss ? payload.field.boss : ((payload.field && payload.field.name) || 'Open Field');
    var momentumLabel = Math.abs(left - right) < 2
      ? 'Even field'
      : (left > right ? leftGang.short + ' pressure' : rightGang.short + ' pressure');
    var challenge = payload.challenge
      ? payload.challenge.name + ': ' + payload.challenge.line + '. ' + payload.challenge.rule
      : 'Challenge loading from the match engine.';

    desk.style.setProperty('--left-team', leftGang.color || '#e45745');
    desk.style.setProperty('--right-team', rightGang.color || '#3677e0');
    desk.style.setProperty('--momentum-left', leftShare.toFixed(1) + '%');

    setText('[data-live-field="state"]', stateLabel);
    setText('[data-live-field="match"]', 'Match ' + (payload.match || 1));
    setText('[data-live-field="last-update"]', new Date(payload.timestamp || Date.now()).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }));

    setText('[data-live-field="left-short"]', leftGang.short || 'L');
    setText('[data-live-field="left-name"]', leftGang.name || 'Left Gang');
    setText('[data-live-field="left-mark"]', leftGang.mark || '');
    setText('[data-live-field="left-alive"]', String(left));

    setText('[data-live-field="right-short"]', rightGang.short || 'R');
    setText('[data-live-field="right-name"]', rightGang.name || 'Right Gang');
    setText('[data-live-field="right-mark"]', rightGang.mark || '');
    setText('[data-live-field="right-alive"]', String(right));

    setText('[data-live-field="field"]', fieldName);
    setText('[data-live-field="speed"]', speedLabel(Number(payload.speed || 1)));
    setText('[data-live-field="auto-next"]', payload.autoNext ? 'Auto next on' : 'Auto next off');
    setText('[data-live-field="momentum-label"]', momentumLabel);
    setText('[data-live-field="league-line"]', payload.league && payload.league.line ? payload.league.line : 'League loading');
    setText('[data-live-field="matchup"]', payload.league && payload.league.matchup ? payload.league.matchup : 'Nouns Nation Battler');
    setText('[data-live-field="root-line"]', payload.rootingFor ? 'Rooting for ' + payload.rootingFor : 'Pick a gang');
    setText('[data-live-field="challenge"]', challenge);

    if (payload.reenactment && payload.reenactment.active) {
      reenactorSet('kicker', payload.reenactment.league + ' live reenactment');
      reenactorSet('headline', payload.reenactment.headline);
      reenactorSet('body', payload.reenactment.sourceResult + ' is now driving the field setup.');
      reenactorSet('field', 'Field: ' + payload.reenactment.field + ' / Modifier: ' + payload.reenactment.modifier);
      reenactorSet('status', payload.reenactment.guardrail);
    }

    Array.prototype.forEach.call(desk.querySelectorAll('[data-speed]'), function (button) {
      button.classList.toggle('is-active', Number(button.dataset.speed) === Number(payload.speed || 1));
    });

    renderTopNouns(payload.leaders);
    renderStandings(payload.standings);
    renderLog(payload.logs);
  }

  desk.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var copyButton = target.closest('[data-copy-text]');
    if (copyButton && desk.contains(copyButton)) {
      copyText(copyButton.dataset.copyText, copyButton);
      return;
    }
    var reenactorGenerate = target.closest('[data-reenactor-generate]');
    if (reenactorGenerate && desk.contains(reenactorGenerate)) {
      renderReenactment();
      return;
    }
    var reenactorLaunch = target.closest('[data-reenactor-launch]');
    if (reenactorLaunch && desk.contains(reenactorLaunch)) {
      launchReenactment();
      return;
    }
    var reenactorCopy = target.closest('[data-reenactor-copy]');
    if (reenactorCopy && desk.contains(reenactorCopy)) {
      copyText(reenactmentReceipt(), reenactorCopy);
      return;
    }
    var reenactorSlateButton = target.closest('[data-reenactor-slate]');
    if (reenactorSlateButton && desk.contains(reenactorSlateButton)) {
      loadReenactorSlate(Number(reenactorSlateButton.dataset.reenactorSlate || 0), true);
      return;
    }
    var button = target.closest('[data-desk-command]');
    if (!button || !desk.contains(button)) return;
    var command = button.dataset.deskCommand;

    if (command === 'setSpeed') {
      postCommand(command, { value: Number(button.dataset.speed || 1) });
    } else if (command === 'root') {
      postCommand(command, { team: Number(button.dataset.team || 0) });
    } else {
      postCommand(command);
    }
  });

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return;
    var message = event.data || {};
    if (message.source !== SOURCE || message.type !== 'snapshot') return;
    renderSnapshot(message.payload);
  });

  frame.addEventListener('load', function () {
    window.setTimeout(function () {
      postCommand('snapshot');
    }, 350);
  });

  window.setInterval(function () {
    postCommand('snapshot');
  }, 2500);
})();
<\/script>`], ["", ` <script>
(function () {
  'use strict';

  var SOURCE = 'pointcast:nouns-nation-battler';
  var CONTROL_SOURCE = 'pointcast:battle-desk';
  var desk = document.querySelector('[data-battle-desk]');
  var frame = document.getElementById('battleFrame');
  if (!desk || !frame) return;

  function find(selector) {
    return desk.querySelector(selector);
  }

  function setText(selector, value) {
    var node = find(selector);
    if (node) node.textContent = value;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function assetPath(asset) {
    if (!asset) return '/games/nouns-nation-battler/assets/noun-0.svg';
    if (/^https?:\\\\/\\\\//.test(asset) || asset.charAt(0) === '/') return asset;
    return '/games/nouns-nation-battler/' + asset.replace(/^\\\\.?\\\\//, '');
  }

  function postCommand(command, extra) {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage(Object.assign({
      source: CONTROL_SOURCE,
      type: 'command',
      command: command,
    }, extra || {}), window.location.origin);
  }

  function copyText(text, button) {
    var value = String(text || '');
    if (!value) return;
    var done = function () {
      if (!button) return;
      var original = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      window.setTimeout(function () {
        button.textContent = original;
        button.classList.remove('copied');
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(function () {});
    } else {
      var input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        done();
      } catch (error) {
        // Ignore copy failures; the link remains visible.
      }
      document.body.removeChild(input);
    }
  }

  function parseScore(score) {
    var parts = String(score || '').match(/\\\\d+/g) || [];
    var winner = Number(parts[0] || 0);
    var loser = Number(parts[1] || 0);
    if (winner < loser) {
      var temp = winner;
      winner = loser;
      loser = temp;
    }
    return { winner: winner, loser: loser, margin: Math.max(0, winner - loser) };
  }

  function reenactorValue(name) {
    var node = find('[data-reenactor-field="' + name + '"]');
    return node ? node.value : '';
  }

  var reenactorSlate = [
    { league: 'NBA', winner: 'Celtics', loser: 'Knicks', score: '112-109', shape: 'close' },
    { league: 'WNBA', winner: 'Aces', loser: 'Liberty', score: '88-84', shape: 'comeback' },
    { league: 'NFL', winner: 'Chiefs', loser: 'Ravens', score: '27-24', shape: 'overtime' },
    { league: 'MLB', winner: 'Dodgers', loser: 'Padres', score: '11-3', shape: 'blowout' },
    { league: 'EPL', winner: 'Brighton', loser: 'Arsenal', score: '2-1', shape: 'upset' },
  ];

  function reenactorFieldSet(name, value) {
    var node = find('[data-reenactor-field="' + name + '"]');
    if (node) node.value = value;
  }

  function reenactorSet(name, value) {
    var node = find('[data-reenactor-output="' + name + '"]');
    if (node) node.textContent = value;
  }

  function loadReenactorSlate(index, launch) {
    var item = reenactorSlate[index] || reenactorSlate[0];
    reenactorFieldSet('league', item.league);
    reenactorFieldSet('winner', item.winner);
    reenactorFieldSet('loser', item.loser);
    reenactorFieldSet('score', item.score);
    reenactorFieldSet('shape', item.shape);
    renderReenactment();
    reenactorSet('status', 'Loaded ' + item.league + ' ' + item.winner + '-' + item.loser + ' from the local alt slate.');
    if (launch) launchReenactment();
  }

  function reenactorBlueprint() {
    var league = reenactorValue('league') || 'Sports';
    var winner = reenactorValue('winner') || 'Winner';
    var loser = reenactorValue('loser') || 'Loser';
    var score = parseScore(reenactorValue('score'));
    var shape = reenactorValue('shape') || 'close';
    var winnerAlive = Math.max(4, Math.min(24, 9 + Math.round(score.margin / 2)));
    var loserAlive = Math.max(1, winnerAlive - Math.max(1, Math.min(12, score.margin || 3)));
    var field = 'Windy kingdom rush';
    var modifier = 'late-lane gust';
    var verb = 'survive';

    if (shape === 'comeback') {
      field = 'Garden comeback field';
      modifier = 'fourth-phase healing patch';
      verb = 'flip';
    } else if (shape === 'blowout') {
      field = 'Lava lane rout';
      modifier = 'bench-mob surge';
      verb = 'overrun';
      winnerAlive = Math.max(winnerAlive, 22);
      loserAlive = Math.min(loserAlive, 5);
    } else if (shape === 'upset') {
      field = 'Auction floor upset';
      modifier = 'belief meter spike';
      verb = 'steal';
    } else if (shape === 'overtime') {
      field = 'Rift overtime field';
      modifier = 'sudden-death blink';
      verb = 'outlast';
      winnerAlive = Math.max(6, winnerAlive - 2);
      loserAlive = Math.max(3, winnerAlive - 1);
    }

    return {
      league: league,
      winner: winner,
      loser: loser,
      score: score,
      shape: shape,
      winnerAliveBias: winnerAlive,
      loserAliveBias: loserAlive,
      field: field,
      modifier: modifier,
      headline: winner + ' ' + verb + ' the Nouns reenactment',
      body: winner + ' ' + score.winner + ', ' + loser + ' ' + score.loser + ' becomes a ' + winnerAlive + '-' + loserAlive + ' survivor finish.',
    };
  }

  function renderReenactment() {
    var next = reenactorBlueprint();
    reenactorSet('kicker', next.league + ' informational reenactment');
    reenactorSet('headline', next.headline);
    reenactorSet('body', next.body);
    reenactorSet('field', 'Field: ' + next.field + ' / Modifier: ' + next.modifier);
    reenactorSet('status', 'Generated locally from a typed result shape. No official data feed used.');
    return next;
  }

  function launchReenactment() {
    var next = renderReenactment();
    postCommand('reenactResult', {
      reenactment: {
        league: next.league,
        winner: next.winner,
        loser: next.loser,
        score: next.score.winner + '-' + next.score.loser,
        sourceResult: next.league + ': ' + next.winner + ' ' + next.score.winner + ', ' + next.loser + ' ' + next.score.loser,
        shape: next.shape,
        field: next.field,
        modifier: next.modifier,
        winnerAliveBias: next.winnerAliveBias,
        loserAliveBias: next.loserAliveBias,
        headline: next.headline,
        guardrail: 'Informational alt-broadcast setup, not an official replay.',
      },
    });
    reenactorSet('status', 'Launched themed Nouns battle setup in the embedded field.');
  }

  function reenactmentReceipt() {
    var next = renderReenactment();
    return [
      'Nouns Nation Result Reenactor',
      next.league + ': ' + next.winner + ' ' + next.score.winner + ', ' + next.loser + ' ' + next.score.loser,
      next.headline,
      next.body,
      'Field: ' + next.field,
      'Modifier: ' + next.modifier,
      'Informational alt-broadcast receipt, not an official replay.',
      new URL('/nouns-nation-battler/', window.location.origin).toString(),
    ].join('\\\\n');
  }

  function speedLabel(speed) {
    if (speed >= 1.4) return 'Rush speed';
    if (speed <= 0.8) return 'Slow speed';
    return 'Live speed';
  }

  function renderTopNouns(leaders) {
    var node = find('[data-live-field="top-nouns"]');
    if (!node) return;
    var rows = []
      .concat((leaders && leaders.left) || [])
      .concat((leaders && leaders.right) || [])
      .sort(function (a, b) {
        var aScore = ((a.stats && a.stats.damage) || 0) + ((a.stats && a.stats.kos) || 0) * 34 + ((a.stats && a.stats.heals) || 0) * 0.12;
        var bScore = ((b.stats && b.stats.damage) || 0) + ((b.stats && b.stats.kos) || 0) * 34 + ((b.stats && b.stats.heals) || 0) * 0.12;
        return bScore - aScore;
      })
      .slice(0, 6);

    if (!rows.length) return;
    node.innerHTML = rows.map(function (unit) {
      var line = '#' + escapeHtml(unit.number || '?') + ' / ' + escapeHtml(unit.role || 'noun') + ' / ' + escapeHtml(unit.hp || 0) + '% HP';
      var stat = unit.stats ? escapeHtml(unit.stats.damage || 0) + ' dmg · ' + escapeHtml(unit.stats.kos || 0) + ' KO' : 'warming up';
      return '<article>' +
        '<img src="' + escapeHtml(assetPath(unit.asset)) + '" alt="" loading="lazy" />' +
        '<span>' + line + '</span>' +
        '<strong>' + escapeHtml(unit.name || 'Noun') + '</strong>' +
        '<em>' + stat + '</em>' +
      '</article>';
    }).join('');
  }

  function renderStandings(rows) {
    var node = find('[data-live-field="standings"]');
    if (!node || !rows || !rows.length) return;
    node.innerHTML = rows.slice(0, 8).map(function (row, index) {
      var diff = Number(row.pf || 0) - Number(row.pa || 0);
      var diffLabel = (diff >= 0 ? '+' : '') + diff;
      return '<article style="--team:' + escapeHtml(row.color || '#8A2432') + '">' +
        '<span>' + String(index + 1) + '</span>' +
        '<strong>' + escapeHtml(row.short || '--') + '</strong>' +
        '<em>' + escapeHtml(row.name || 'Gang') + '</em>' +
        '<b>' + escapeHtml(row.wins || 0) + '-' + escapeHtml(row.losses || 0) + '</b>' +
        '<i>' + diffLabel + ' / ' + escapeHtml(row.fans || 0) + ' fans</i>' +
      '</article>';
    }).join('');
  }

  function renderLog(logs) {
    var node = find('[data-live-field="log"]');
    if (!node || !logs || !logs.length) return;
    node.innerHTML = logs.slice(0, 7).map(function (line) {
      return '<p>' + escapeHtml(line) + '</p>';
    }).join('');
  }

  function renderSnapshot(payload) {
    if (!payload || !payload.gangs || payload.gangs.length < 2) return;

    var leftGang = payload.gangs[0];
    var rightGang = payload.gangs[1];
    var left = payload.alive ? payload.alive.left : 30;
    var right = payload.alive ? payload.alive.right : 30;
    var total = Math.max(1, left + right);
    var leftShare = (left / total) * 100;
    var stateLabel = payload.finished ? 'FINAL' : (payload.running ? 'LIVE' : 'PAUSED');
    var fieldName = payload.field && payload.field.boss ? payload.field.boss : ((payload.field && payload.field.name) || 'Open Field');
    var momentumLabel = Math.abs(left - right) < 2
      ? 'Even field'
      : (left > right ? leftGang.short + ' pressure' : rightGang.short + ' pressure');
    var challenge = payload.challenge
      ? payload.challenge.name + ': ' + payload.challenge.line + '. ' + payload.challenge.rule
      : 'Challenge loading from the match engine.';

    desk.style.setProperty('--left-team', leftGang.color || '#e45745');
    desk.style.setProperty('--right-team', rightGang.color || '#3677e0');
    desk.style.setProperty('--momentum-left', leftShare.toFixed(1) + '%');

    setText('[data-live-field="state"]', stateLabel);
    setText('[data-live-field="match"]', 'Match ' + (payload.match || 1));
    setText('[data-live-field="last-update"]', new Date(payload.timestamp || Date.now()).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }));

    setText('[data-live-field="left-short"]', leftGang.short || 'L');
    setText('[data-live-field="left-name"]', leftGang.name || 'Left Gang');
    setText('[data-live-field="left-mark"]', leftGang.mark || '');
    setText('[data-live-field="left-alive"]', String(left));

    setText('[data-live-field="right-short"]', rightGang.short || 'R');
    setText('[data-live-field="right-name"]', rightGang.name || 'Right Gang');
    setText('[data-live-field="right-mark"]', rightGang.mark || '');
    setText('[data-live-field="right-alive"]', String(right));

    setText('[data-live-field="field"]', fieldName);
    setText('[data-live-field="speed"]', speedLabel(Number(payload.speed || 1)));
    setText('[data-live-field="auto-next"]', payload.autoNext ? 'Auto next on' : 'Auto next off');
    setText('[data-live-field="momentum-label"]', momentumLabel);
    setText('[data-live-field="league-line"]', payload.league && payload.league.line ? payload.league.line : 'League loading');
    setText('[data-live-field="matchup"]', payload.league && payload.league.matchup ? payload.league.matchup : 'Nouns Nation Battler');
    setText('[data-live-field="root-line"]', payload.rootingFor ? 'Rooting for ' + payload.rootingFor : 'Pick a gang');
    setText('[data-live-field="challenge"]', challenge);

    if (payload.reenactment && payload.reenactment.active) {
      reenactorSet('kicker', payload.reenactment.league + ' live reenactment');
      reenactorSet('headline', payload.reenactment.headline);
      reenactorSet('body', payload.reenactment.sourceResult + ' is now driving the field setup.');
      reenactorSet('field', 'Field: ' + payload.reenactment.field + ' / Modifier: ' + payload.reenactment.modifier);
      reenactorSet('status', payload.reenactment.guardrail);
    }

    Array.prototype.forEach.call(desk.querySelectorAll('[data-speed]'), function (button) {
      button.classList.toggle('is-active', Number(button.dataset.speed) === Number(payload.speed || 1));
    });

    renderTopNouns(payload.leaders);
    renderStandings(payload.standings);
    renderLog(payload.logs);
  }

  desk.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var copyButton = target.closest('[data-copy-text]');
    if (copyButton && desk.contains(copyButton)) {
      copyText(copyButton.dataset.copyText, copyButton);
      return;
    }
    var reenactorGenerate = target.closest('[data-reenactor-generate]');
    if (reenactorGenerate && desk.contains(reenactorGenerate)) {
      renderReenactment();
      return;
    }
    var reenactorLaunch = target.closest('[data-reenactor-launch]');
    if (reenactorLaunch && desk.contains(reenactorLaunch)) {
      launchReenactment();
      return;
    }
    var reenactorCopy = target.closest('[data-reenactor-copy]');
    if (reenactorCopy && desk.contains(reenactorCopy)) {
      copyText(reenactmentReceipt(), reenactorCopy);
      return;
    }
    var reenactorSlateButton = target.closest('[data-reenactor-slate]');
    if (reenactorSlateButton && desk.contains(reenactorSlateButton)) {
      loadReenactorSlate(Number(reenactorSlateButton.dataset.reenactorSlate || 0), true);
      return;
    }
    var button = target.closest('[data-desk-command]');
    if (!button || !desk.contains(button)) return;
    var command = button.dataset.deskCommand;

    if (command === 'setSpeed') {
      postCommand(command, { value: Number(button.dataset.speed || 1) });
    } else if (command === 'root') {
      postCommand(command, { team: Number(button.dataset.team || 0) });
    } else {
      postCommand(command);
    }
  });

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return;
    var message = event.data || {};
    if (message.source !== SOURCE || message.type !== 'snapshot') return;
    renderSnapshot(message.payload);
  });

  frame.addEventListener('load', function () {
    window.setTimeout(function () {
      postCommand('snapshot');
    }, 350);
  });

  window.setInterval(function () {
    postCommand('snapshot');
  }, 2500);
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "PointCast Battle Desk", "description": "A sports-desk style hub for Nouns Nation Battler v39: live scorebug, league table, top nouns, match queue, live calls, TV cast, desk wall, snapshot-backed watch frames, Results Desk MCP, Agent Bench claim queue, Sideline Desk asset factory, Sponsorship Desk, Production Desk, Claim Board, posters, and the automated 30 vs 30 field feed.", "image": "/images/og/nouns-battler-live.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler-agents.json", title: "Nouns Nation Battler Agent Bench (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-live.png",
    buttons: [
      { label: "Watch desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "Watch V3", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-v3/" },
      { label: "Bowl Path", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-bowl/" },
      { label: "Moon Cup", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-moon/" },
      { label: "TV Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-tv/" },
      { label: "Desk Wall", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-desk/" },
      { label: "Agent Bench", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-agents/" },
      { label: "Sideline Desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-agents/desk/" },
      { label: "Sponsor Desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-sponsors/" },
      { label: "Production", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-production/" },
      { label: "Game JSON", action: "link", target: "https://pointcast.xyz/nouns-nation-battler.json" },
      { label: "Battle channel", action: "link", target: "https://pointcast.xyz/c/battler/" }
    ]
  }, "data-astro-cid-jzrsejhs": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="battle-desk" data-battle-desk${addAttribute(`--btl: ${ch.color600}; --btl-dark: ${ch.color800}; --btl-soft: ${ch.color50}; --left-team: #e45745; --right-team: #3677e0; --momentum-left: 50%;`, "style")} data-astro-cid-jzrsejhs> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-jzrsejhs> <a href="/" data-astro-cid-jzrsejhs>Home</a> <span aria-hidden="true" data-astro-cid-jzrsejhs>/</span> <a href="/c/battler/" data-astro-cid-jzrsejhs>CH.BTL</a> <span aria-hidden="true" data-astro-cid-jzrsejhs>/</span> <span data-astro-cid-jzrsejhs>Battle Desk</span> </nav> <section class="network-strip" aria-label="Battle desk ticker" data-astro-cid-jzrsejhs> <div class="network-brand" data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>PointCast</span> <strong data-astro-cid-jzrsejhs>BTL Network</strong> </div> <div class="ticker" aria-label="Live ticker" data-astro-cid-jzrsejhs> <span class="ticker__live" data-astro-cid-jzrsejhs>Live</span> <div class="ticker__viewport" data-astro-cid-jzrsejhs> <div class="ticker__track" data-astro-cid-jzrsejhs> ${tickerItems.concat(tickerItems).map((item) => renderTemplate`<span data-astro-cid-jzrsejhs>${item}</span>`)} </div> </div> </div> <div class="network-actions" data-astro-cid-jzrsejhs> <a class="data-link" href="/nouns-nation-battler.json" data-astro-cid-jzrsejhs>Desk JSON</a> <a class="data-link" href="/nouns-nation-sports-reenactment/" data-astro-cid-jzrsejhs>Sports Reenactment</a> <a class="data-link" href="/nouns-nation-battler-v3/" data-astro-cid-jzrsejhs>V3 Desk</a> <a class="data-link" href="/nouns-nation-battler-v3/#season-recap" data-astro-cid-jzrsejhs>Recap Archive</a> <a class="data-link" href="/nouns-nation-battler-v3/#sprint-room" data-astro-cid-jzrsejhs>Sprint Room</a> <a class="data-link" href="/nouns-nation-battler-sprint.json" data-astro-cid-jzrsejhs>Sprint JSON</a> <a class="data-link" href="/nouns-nation-battler-agents/" data-astro-cid-jzrsejhs>Agent Bench</a> <a class="data-link" href="/nouns-nation-battler-agents/desk/" data-astro-cid-jzrsejhs>Sideline Desk</a> <a class="data-link" href="/nouns-nation-battler-sponsors/" data-astro-cid-jzrsejhs>Sponsor Desk</a> <a class="data-link" href="/nouns-nation-battler-production/" data-astro-cid-jzrsejhs>Production Desk</a> <a class="data-link" href="/nouns-nation-battler-tasks/" data-astro-cid-jzrsejhs>Claim Board</a> </div> </section> <section class="desk-head" aria-label="Battle desk header" data-astro-cid-jzrsejhs> <div data-astro-cid-jzrsejhs> <p class="kicker" data-astro-cid-jzrsejhs>CH.BTL / Nouns Nation v39 claim board</p> <h1 data-astro-cid-jzrsejhs>PointCast Battle Desk</h1> </div> <div class="desk-head__meta" aria-label="Live desk status" data-astro-cid-jzrsejhs> <span data-live-field="state" data-astro-cid-jzrsejhs>LIVE</span> <strong data-live-field="match" data-astro-cid-jzrsejhs>Match 1</strong> <em data-live-field="last-update" data-astro-cid-jzrsejhs>Waiting for feed</em> </div> </section> <section class="scorebug" aria-label="Live match score" data-astro-cid-jzrsejhs> <article class="score-team score-team--left" data-astro-cid-jzrsejhs> <div class="score-team__id" data-astro-cid-jzrsejhs> <span data-live-field="left-short" data-astro-cid-jzrsejhs>TN</span> <strong data-live-field="left-name" data-astro-cid-jzrsejhs>Tomato Noggles</strong> <em data-live-field="left-mark" data-astro-cid-jzrsejhs>split tomato noggles</em> </div> <div class="score-team__score" data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>Alive</span> <strong data-live-field="left-alive" data-astro-cid-jzrsejhs>30</strong> </div> </article> <div class="score-center" data-astro-cid-jzrsejhs> <div class="score-center__top" data-astro-cid-jzrsejhs> <span data-live-field="field" data-astro-cid-jzrsejhs>Open Field</span> <span data-live-field="speed" data-astro-cid-jzrsejhs>Live speed</span> <span data-live-field="auto-next" data-astro-cid-jzrsejhs>Auto next on</span> </div> <div class="momentum" aria-label="Momentum meter" data-astro-cid-jzrsejhs> <i data-astro-cid-jzrsejhs></i> </div> <strong data-live-field="momentum-label" data-astro-cid-jzrsejhs>Even field</strong> <em data-live-field="league-line" data-astro-cid-jzrsejhs>Day 1 / 14 · Slate 1 of 4</em> </div> <article class="score-team score-team--right" data-astro-cid-jzrsejhs> <div class="score-team__id" data-astro-cid-jzrsejhs> <span data-live-field="right-short" data-astro-cid-jzrsejhs>CF</span> <strong data-live-field="right-name" data-astro-cid-jzrsejhs>Cobalt Frames</strong> <em data-live-field="right-mark" data-astro-cid-jzrsejhs>blue square lenses</em> </div> <div class="score-team__score" data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>Alive</span> <strong data-live-field="right-alive" data-astro-cid-jzrsejhs>30</strong> </div> </article> </section> <section class="watch-next" aria-labelledby="watch-next-title" data-astro-cid-jzrsejhs> <div class="watch-next__head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Watch This Next</p> <h2 id="watch-next-title" data-astro-cid-jzrsejhs>Pick the right screen for the moment.</h2> </div> <div class="watch-next__cards" data-astro-cid-jzrsejhs> ${NOUNS_BATTLER_WATCH_NEXT.map((item) => renderTemplate`<a class="watch-card"${addAttribute(item.href, "href")} data-astro-cid-jzrsejhs> <img${addAttribute(`/games/nouns-nation-battler/assets/noun-${item.noun}.svg`, "src")} alt="" loading="lazy" data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>${item.label}</span> <strong data-astro-cid-jzrsejhs>${item.title}</strong> <p data-astro-cid-jzrsejhs>${item.useFor}</p> </a>`)} </div> </section> <section class="featured-mode" aria-labelledby="featured-mode-title" data-astro-cid-jzrsejhs> <div class="featured-mode__copy" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Featured Mode</p> <h2 id="featured-mode-title" data-astro-cid-jzrsejhs>Nouns Kingdom v2</h2> <p data-astro-cid-jzrsejhs>
A 25 vs 25 siege cast with noggle keeps, proposal waves, auction tower volleys,
          meme lane floods, and Noun Gate pressure.
</p> <div class="featured-mode__actions" data-astro-cid-jzrsejhs> <a href="/games/nouns-nation-battler/#mode=tv&type=kingdom" data-astro-cid-jzrsejhs>Watch Kingdom TV</a> <a href="/nouns-nation-battler-mobile/?type=kingdom" data-astro-cid-jzrsejhs>Phone Cast</a> <a href="/nouns-nation-battler.json" data-astro-cid-jzrsejhs>Mode JSON</a> <button type="button"${addAttribute(kingdomShareText, "data-copy-text")} data-astro-cid-jzrsejhs>Copy Invite</button> <button type="button"${addAttribute(kingdomMobileShareText, "data-copy-text")} data-astro-cid-jzrsejhs>Copy Phone Invite</button> <button type="button"${addAttribute(kingdomTvUrl, "data-copy-text")} data-astro-cid-jzrsejhs>Copy TV Link</button> </div> </div> <div class="featured-mode__nouns" aria-hidden="true" data-astro-cid-jzrsejhs> ${[44, 12, 58, 34, 7].map((noun) => renderTemplate`<img${addAttribute(`/games/nouns-nation-battler/assets/noun-${noun}.svg`, "src")} alt="" loading="lazy" data-astro-cid-jzrsejhs>`)} </div> <div class="featured-mode__beats" aria-label="Nouns Kingdom v2 beats" data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>Proposal wave</span> <span data-astro-cid-jzrsejhs>Auction tower volley</span> <span data-astro-cid-jzrsejhs>Meme lane flood</span> <span data-astro-cid-jzrsejhs>Noun Gate pressure</span> </div> </section> <section class="broadcast-layout" data-astro-cid-jzrsejhs> <section class="game-stage" aria-label="Live Nouns Nation Battler feed" data-astro-cid-jzrsejhs> <header class="stage-header" data-astro-cid-jzrsejhs> <div data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Main Feed</p> <h2 data-live-field="matchup" data-astro-cid-jzrsejhs>Nouns Nation Battler</h2> </div> <div class="stage-actions" aria-label="Desk controls" data-astro-cid-jzrsejhs> <button type="button" data-desk-command="newMatch" data-astro-cid-jzrsejhs>Next</button> <button type="button" data-desk-command="quickSim" data-astro-cid-jzrsejhs>Quick Sim</button> <button type="button" data-desk-command="simDay" data-astro-cid-jzrsejhs>Sim Day</button> <button type="button" data-desk-command="togglePause" data-astro-cid-jzrsejhs>Pause</button> <button type="button" data-desk-command="setSpeed" data-speed="0.75" data-astro-cid-jzrsejhs>Slow</button> <button type="button" class="is-active" data-desk-command="setSpeed" data-speed="1" data-astro-cid-jzrsejhs>Live</button> <button type="button" data-desk-command="setSpeed" data-speed="1.55" data-astro-cid-jzrsejhs>Rush</button> </div> </header> <iframe id="battleFrame" src="/games/nouns-nation-battler/index.html" title="Nouns Nation Battler live match feed" loading="eager" allow="fullscreen" data-astro-cid-jzrsejhs></iframe> </section> <aside class="studio-rail" aria-label="Studio desk" data-astro-cid-jzrsejhs> <section class="panel panel--live-log" data-astro-cid-jzrsejhs> <header class="panel-head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Live Blog</p> <h2 data-astro-cid-jzrsejhs>Latest Calls</h2> </header> <div class="live-log" data-live-field="log" data-astro-cid-jzrsejhs> <p data-astro-cid-jzrsejhs>Feed warming up.</p> </div> </section> <section class="panel" data-astro-cid-jzrsejhs> <header class="panel-head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Leaders</p> <h2 data-astro-cid-jzrsejhs>Top Nouns</h2> </header> <div class="top-nouns" data-live-field="top-nouns" data-astro-cid-jzrsejhs> <article data-astro-cid-jzrsejhs> <img src="/games/nouns-nation-battler/assets/noun-0.svg" alt="" loading="lazy" data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>Awaiting first push</span> <strong data-astro-cid-jzrsejhs>Pregame</strong> </article> </div> </section> <section class="panel" data-astro-cid-jzrsejhs> <header class="panel-head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Table</p> <h2 data-astro-cid-jzrsejhs>League Standings</h2> </header> <div class="standings" data-live-field="standings" data-astro-cid-jzrsejhs> ${fallbackStandings.map((row, index) => renderTemplate`<article${addAttribute(`--team:${row.color}`, "style")} data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>${index + 1}</span> <strong data-astro-cid-jzrsejhs>${row.short}</strong> <em data-astro-cid-jzrsejhs>${row.name}</em> <b data-astro-cid-jzrsejhs>${row.record}</b> <i data-astro-cid-jzrsejhs>${row.detail}</i> </article>`)} </div> </section> </aside> </section> <section class="coverage-grid" aria-label="Battle desk coverage" data-astro-cid-jzrsejhs> <section class="panel panel--wide" data-astro-cid-jzrsejhs> <header class="panel-head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Root Line</p> <h2 data-live-field="root-line" data-astro-cid-jzrsejhs>Pick a gang</h2> </header> <div class="root-buttons" data-astro-cid-jzrsejhs> <button type="button" data-desk-command="root" data-team="0" data-astro-cid-jzrsejhs>Root Left</button> <button type="button" data-desk-command="root" data-team="1" data-astro-cid-jzrsejhs>Root Right</button> <a href="/nouns-nation-battler-tv/" target="_blank" rel="noreferrer" data-astro-cid-jzrsejhs>TV Cast</a> <a href="/nouns-nation-battler-desk/" data-astro-cid-jzrsejhs>Desk Wall</a> <a href="/nouns-nation-battler-v3/#season-recap" data-astro-cid-jzrsejhs>Recap Archive</a> <a href="/nouns-nation-battler-v3/#sprint-room" data-astro-cid-jzrsejhs>Sprint Room</a> <a href="/nouns-nation-battler-production/" data-astro-cid-jzrsejhs>Production Desk</a> <a href="/nouns-nation-battler-tasks/" data-astro-cid-jzrsejhs>Claim Board</a> <a href="/nouns-nation-battler-posters/" data-astro-cid-jzrsejhs>Posters</a> <a href="/nouns-nation-battler-bowl/" data-astro-cid-jzrsejhs>Bowl Path</a> <a href="/nouns-nation-battler-moon/" data-astro-cid-jzrsejhs>Moon Tournament</a> </div> <p class="desk-copy" data-live-field="challenge" data-astro-cid-jzrsejhs>
Season challenge loading. The desk will pull the live side quest from the embedded match.
</p> </section> <section class="panel" data-astro-cid-jzrsejhs> <header class="panel-head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Board</p> <h2 data-astro-cid-jzrsejhs>Match Queue</h2> </header> <div class="schedule" data-astro-cid-jzrsejhs> ${schedule.map((item) => renderTemplate`<article data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>${item.slot}</span> <strong data-astro-cid-jzrsejhs>${item.matchup}</strong> <em data-astro-cid-jzrsejhs>${item.status}</em> </article>`)} </div> </section> <section class="panel panel--reenactor" data-astro-cid-jzrsejhs> <header class="panel-head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>Alt Sports Desk</p> <h2 data-astro-cid-jzrsejhs>Result Reenactor</h2> </header> <div class="reenactor-controls" aria-label="Sports result reenactor controls" data-astro-cid-jzrsejhs> <label data-astro-cid-jzrsejhs>
League
<select data-reenactor-field="league" data-astro-cid-jzrsejhs> <option data-astro-cid-jzrsejhs>NBA</option> <option data-astro-cid-jzrsejhs>WNBA</option> <option data-astro-cid-jzrsejhs>NFL</option> <option data-astro-cid-jzrsejhs>MLB</option> <option data-astro-cid-jzrsejhs>NHL</option> <option data-astro-cid-jzrsejhs>EPL</option> </select> </label> <label data-astro-cid-jzrsejhs>
Winner
<input data-reenactor-field="winner" value="Celtics" data-astro-cid-jzrsejhs> </label> <label data-astro-cid-jzrsejhs>
Loser
<input data-reenactor-field="loser" value="Knicks" data-astro-cid-jzrsejhs> </label> <label data-astro-cid-jzrsejhs>
Final
<input data-reenactor-field="score" value="112-109" data-astro-cid-jzrsejhs> </label> <label class="reenactor-controls__wide" data-astro-cid-jzrsejhs>
Shape
<select data-reenactor-field="shape" data-astro-cid-jzrsejhs> <option value="close" data-astro-cid-jzrsejhs>Close finish</option> <option value="comeback" data-astro-cid-jzrsejhs>Comeback</option> <option value="blowout" data-astro-cid-jzrsejhs>Blowout</option> <option value="upset" data-astro-cid-jzrsejhs>Upset</option> <option value="overtime" data-astro-cid-jzrsejhs>Overtime</option> </select> </label> </div> <article class="reenactor-card" aria-label="Generated Nouns sports reenactment" data-astro-cid-jzrsejhs> <span data-reenactor-output="kicker" data-astro-cid-jzrsejhs>NBA informational reenactment</span> <strong data-reenactor-output="headline" data-astro-cid-jzrsejhs>Celtics survive the Nouns reenactment</strong> <p data-reenactor-output="body" data-astro-cid-jzrsejhs>Celtics 112, Knicks 109 becomes an 11-8 survivor finish.</p> <em data-reenactor-output="field" data-astro-cid-jzrsejhs>Field: Windy kingdom rush / Modifier: late-lane gust</em> </article> <div class="root-buttons" data-astro-cid-jzrsejhs> <button type="button" data-reenactor-generate data-astro-cid-jzrsejhs>Generate Reenactment</button> <button type="button" data-reenactor-launch data-astro-cid-jzrsejhs>Launch Battle Setup</button> <button type="button" data-reenactor-copy data-astro-cid-jzrsejhs>Copy Alt Receipt</button> </div> <div class="reenactor-slate" aria-label="Alt sports result slate" data-astro-cid-jzrsejhs> <p data-astro-cid-jzrsejhs>Alt Sports Slate</p> <div class="reenactor-slate__grid" data-astro-cid-jzrsejhs> <button type="button" data-reenactor-slate="0" data-astro-cid-jzrsejhs>NBA close</button> <button type="button" data-reenactor-slate="1" data-astro-cid-jzrsejhs>WNBA comeback</button> <button type="button" data-reenactor-slate="2" data-astro-cid-jzrsejhs>NFL overtime</button> <button type="button" data-reenactor-slate="3" data-astro-cid-jzrsejhs>MLB blowout</button> <button type="button" data-reenactor-slate="4" data-astro-cid-jzrsejhs>EPL upset</button> </div> </div> <p class="desk-copy" data-reenactor-output="status" data-astro-cid-jzrsejhs>
Informational only: no official score feed, no odds, no betting, no claim of a real replay.
</p> </section> <section class="panel panel--features" data-astro-cid-jzrsejhs> <header class="panel-head" data-astro-cid-jzrsejhs> <p class="panel-label" data-astro-cid-jzrsejhs>NounCenter</p> <h2 data-astro-cid-jzrsejhs>Desk Notes</h2> </header> <div class="feature-stack" data-astro-cid-jzrsejhs> ${featureStories.map((story) => renderTemplate`<article data-astro-cid-jzrsejhs> <img${addAttribute(story.image, "src")} alt="" loading="lazy" data-astro-cid-jzrsejhs> <div data-astro-cid-jzrsejhs> <span data-astro-cid-jzrsejhs>${story.label}</span> <strong data-astro-cid-jzrsejhs>${story.title}</strong> <p data-astro-cid-jzrsejhs>${story.dek}</p> </div> </article>`)} </div> </section> </section> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler.astro";
const $$url = "/nouns-nation-battler";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattler,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
