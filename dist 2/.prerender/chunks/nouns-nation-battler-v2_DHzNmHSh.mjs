import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$NounsNationBattlerV2 = createComponent(($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  const tickerItems = [
    "V2 control room is listening to the embedded v30 match engine",
    "Live table, top Nouns, pressure line, and replay desk update from postMessage snapshots",
    "Run Next, Quick Sim, Sim Day, Slow, Live, and Rush from the desk",
    "TV Cast, Desk Wall, posters, and JSON stay one click away",
    "Every match feeds the local two-week march to the Nouns Bowl"
  ];
  const fallbackStandings = [
    { short: "TN", name: "Tomato Noggles", record: "0-0", detail: "+0 / 0 fans", color: "#e45745" },
    { short: "CF", name: "Cobalt Frames", record: "0-0", detail: "+0 / 0 fans", color: "#3677e0" },
    { short: "GN", name: "Golden Nouncil", record: "0-0", detail: "+0 / 0 fans", color: "#d49b19" },
    { short: "GS", name: "Garden Stack", record: "0-0", detail: "+0 / 0 fans", color: "#3f9b54" },
    { short: "PU", name: "Pixel Union", record: "0-0", detail: "+0 / 0 fans", color: "#8b5cf6" },
    { short: "NA", name: "Night Auction", record: "0-0", detail: "+0 / 0 fans", color: "#2f3a4f" },
    { short: "SP", name: "Sunset Prop House", record: "0-0", detail: "+0 / 0 fans", color: "#ef7d2d" },
    { short: "MC", name: "Mint Condition", record: "0-0", detail: "+0 / 0 fans", color: "#13a6a1" }
  ];
  const fieldCards = [
    { label: "V3", title: "Federation Desk", href: "/nouns-nation-battler-v3/" },
    { label: "Hub", title: "Nouns Nation", href: "/nouns-nation/" },
    { label: "Federate", title: "Bring a Nation", href: "/nouns-nation/join/" },
    { label: "Watch", title: "TV Cast", href: "/nouns-nation-battler-tv/" },
    { label: "Archive", title: "Desk Wall", href: "/nouns-nation-battler-desk/" },
    { label: "Collect", title: "Poster Wall", href: "/nouns-nation-battler-posters/" },
    { label: "Data", title: "JSON Feed", href: "/nouns-nation-battler.json" }
  ];
  const runSheet = [
    { stamp: "00", title: "Open the slate", note: "Check matchup, field type, challenge, and speed." },
    { stamp: "15", title: "Find pressure", note: "Compare alive count, damage leaders, and table position." },
    { stamp: "30", title: "Root the room", note: "Pick a side, then let the table remember it locally." },
    { stamp: "45", title: "Send the artifact", note: "Jump to TV Cast, Desk Wall, or posters after the result." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "PointCast Battle Desk V2: Nouns Nation Battler",
    description: "A v2 GameCast-style control room for the automated 30v30 Nouns Nation Battler league.",
    url: "https://pointcast.xyz/nouns-nation-battler-v2/",
    gamePlatform: "Web browser",
    genre: "Auto battler",
    inLanguage: "en-US"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () {
  'use strict';

  var SOURCE = 'pointcast:nouns-nation-battler';
  var CONTROL_SOURCE = 'pointcast:battle-desk';
  var desk = document.querySelector('[data-battle-v2]');
  var frame = document.getElementById('battleFrameV2');
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

  function speedLabel(speed) {
    if (speed >= 1.4) return 'Rush';
    if (speed <= 0.8) return 'Slow';
    return 'Live';
  }

  function scoreUnit(unit) {
    var stats = unit && unit.stats ? unit.stats : {};
    return Number(stats.damage || 0) + Number(stats.kos || 0) * 34 + Number(stats.heals || 0) * 0.12;
  }

  function renderTopNouns(leaders) {
    var node = find('[data-live-field="top-nouns"]');
    if (!node) return;
    var rows = []
      .concat((leaders && leaders.left) || [])
      .concat((leaders && leaders.right) || [])
      .sort(function (a, b) { return scoreUnit(b) - scoreUnit(a); })
      .slice(0, 8);

    setText('[data-live-field="leader-count"]', rows.length ? rows.length + ' tracked' : 'warming');
    if (!rows.length) return;

    node.innerHTML = rows.map(function (unit, index) {
      var stats = unit.stats || {};
      var line = '#' + escapeHtml(unit.number || '?') + ' / ' + escapeHtml(unit.role || 'noun') + ' / ' + escapeHtml(unit.hp || 0) + '% HP';
      var stat = escapeHtml(stats.damage || 0) + ' dmg / ' + escapeHtml(stats.kos || 0) + ' KO / ' + escapeHtml(Math.round(stats.heals || 0)) + ' heal';
      return '<article>' +
        '<img src="' + escapeHtml(assetPath(unit.asset)) + '" alt="" loading="lazy" />' +
        '<span>' + String(index + 1) + ' / ' + line + '</span>' +
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
    setText('[data-live-field="table-note"]', rows.length + ' gangs');
  }

  function renderLog(logs) {
    var node = find('[data-live-field="log"]');
    if (!node || !logs || !logs.length) return;
    node.innerHTML = logs.slice(0, 9).map(function (line) {
      return '<p>' + escapeHtml(line) + '</p>';
    }).join('');
  }

  function renderSnapshot(payload) {
    if (!payload || !payload.gangs || payload.gangs.length < 2) return;

    var leftGang = payload.gangs[0];
    var rightGang = payload.gangs[1];
    var left = payload.alive ? Number(payload.alive.left || 0) : 30;
    var right = payload.alive ? Number(payload.alive.right || 0) : 30;
    var total = Math.max(1, left + right);
    var leftShare = (left / total) * 100;
    var rightShare = 100 - leftShare;
    var stateLabel = payload.finished ? 'FINAL' : (payload.running ? 'LIVE' : 'PAUSED');
    var fieldName = payload.field && payload.field.boss ? payload.field.boss : ((payload.field && payload.field.name) || 'Open Field');
    var pressureLabel = Math.abs(left - right) < 2
      ? 'Even field'
      : (left > right ? leftGang.short + ' pressure' : rightGang.short + ' pressure');
    var challenge = payload.challenge
      ? payload.challenge.name + ': ' + payload.challenge.line + '. ' + payload.challenge.rule
      : 'Challenge loading from the match engine.';
    var weather = payload.weather && payload.weather.name ? payload.weather.name : (payload.weather || 'Clear');
    var speed = Number(payload.speed || 1);

    desk.style.setProperty('--left-team', leftGang.color || '#e45745');
    desk.style.setProperty('--right-team', rightGang.color || '#3677e0');
    desk.style.setProperty('--left-share', leftShare.toFixed(1) + '%');
    desk.style.setProperty('--right-share', rightShare.toFixed(1) + '%');
    desk.style.setProperty('--pressure-x', leftShare.toFixed(1) + '%');

    setText('[data-live-field="state"]', stateLabel);
    setText('[data-live-field="match"]', String(payload.match || 1));
    setText('[data-live-field="last-update"]', new Date(payload.timestamp || Date.now()).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }));

    setText('[data-live-field="left-short"]', leftGang.short || 'L');
    setText('[data-live-field="left-name"]', leftGang.name || 'Left Gang');
    setText('[data-live-field="left-mark"]', leftGang.mark || '');
    setText('[data-live-field="left-alive"]', String(left));
    setText('[data-live-field="left-pressure"]', Math.round(leftShare) + '%');

    setText('[data-live-field="right-short"]', rightGang.short || 'R');
    setText('[data-live-field="right-name"]', rightGang.name || 'Right Gang');
    setText('[data-live-field="right-mark"]', rightGang.mark || '');
    setText('[data-live-field="right-alive"]', String(right));
    setText('[data-live-field="right-pressure"]', Math.round(rightShare) + '%');

    setText('[data-live-field="field"]', fieldName);
    setText('[data-live-field="speed"]', speedLabel(speed) + ' speed');
    setText('[data-live-field="auto-next"]', payload.autoNext ? 'On' : 'Off');
    setText('[data-live-field="momentum-label"]', pressureLabel);
    setText('[data-live-field="analyst-headline"]', pressureLabel);
    setText('[data-live-field="total-live"]', total + ' live');
    setText('[data-live-field="weather"]', weather);
    setText('[data-live-field="league-line"]', payload.league && payload.league.line ? payload.league.line : 'League loading');
    setText('[data-live-field="matchup"]', payload.league && payload.league.matchup ? payload.league.matchup : 'Nouns Nation Battler');
    setText('[data-live-field="root-line"]', payload.rootingFor ? payload.rootingFor : 'Pick');
    setText('[data-live-field="challenge"]', challenge);
    setText('[data-live-field="control-copy"]', stateLabel === 'LIVE' ? 'Live engine locked' : 'Engine hold');

    Array.prototype.forEach.call(desk.querySelectorAll('[data-speed]'), function (button) {
      button.classList.toggle('is-active', Number(button.dataset.speed) === speed);
    });

    renderTopNouns(payload.leaders);
    renderStandings(payload.standings);
    renderLog(payload.logs);
  }

  desk.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
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

  try {
    localStorage.setItem('pc:nouns-nation-guide-v1', 'seen');
  } catch (error) {
    /* LocalStorage can be unavailable in hardened browsers. The field still loads. */
  }

  var battleSrc = frame.getAttribute('data-battle-src');
  if (battleSrc && frame.getAttribute('src') !== battleSrc) {
    frame.setAttribute('src', battleSrc);
  }

  window.setInterval(function () {
    postCommand('snapshot');
  }, 2500);
})();
<\/script>`], ["", ` <script>
(function () {
  'use strict';

  var SOURCE = 'pointcast:nouns-nation-battler';
  var CONTROL_SOURCE = 'pointcast:battle-desk';
  var desk = document.querySelector('[data-battle-v2]');
  var frame = document.getElementById('battleFrameV2');
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

  function speedLabel(speed) {
    if (speed >= 1.4) return 'Rush';
    if (speed <= 0.8) return 'Slow';
    return 'Live';
  }

  function scoreUnit(unit) {
    var stats = unit && unit.stats ? unit.stats : {};
    return Number(stats.damage || 0) + Number(stats.kos || 0) * 34 + Number(stats.heals || 0) * 0.12;
  }

  function renderTopNouns(leaders) {
    var node = find('[data-live-field="top-nouns"]');
    if (!node) return;
    var rows = []
      .concat((leaders && leaders.left) || [])
      .concat((leaders && leaders.right) || [])
      .sort(function (a, b) { return scoreUnit(b) - scoreUnit(a); })
      .slice(0, 8);

    setText('[data-live-field="leader-count"]', rows.length ? rows.length + ' tracked' : 'warming');
    if (!rows.length) return;

    node.innerHTML = rows.map(function (unit, index) {
      var stats = unit.stats || {};
      var line = '#' + escapeHtml(unit.number || '?') + ' / ' + escapeHtml(unit.role || 'noun') + ' / ' + escapeHtml(unit.hp || 0) + '% HP';
      var stat = escapeHtml(stats.damage || 0) + ' dmg / ' + escapeHtml(stats.kos || 0) + ' KO / ' + escapeHtml(Math.round(stats.heals || 0)) + ' heal';
      return '<article>' +
        '<img src="' + escapeHtml(assetPath(unit.asset)) + '" alt="" loading="lazy" />' +
        '<span>' + String(index + 1) + ' / ' + line + '</span>' +
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
    setText('[data-live-field="table-note"]', rows.length + ' gangs');
  }

  function renderLog(logs) {
    var node = find('[data-live-field="log"]');
    if (!node || !logs || !logs.length) return;
    node.innerHTML = logs.slice(0, 9).map(function (line) {
      return '<p>' + escapeHtml(line) + '</p>';
    }).join('');
  }

  function renderSnapshot(payload) {
    if (!payload || !payload.gangs || payload.gangs.length < 2) return;

    var leftGang = payload.gangs[0];
    var rightGang = payload.gangs[1];
    var left = payload.alive ? Number(payload.alive.left || 0) : 30;
    var right = payload.alive ? Number(payload.alive.right || 0) : 30;
    var total = Math.max(1, left + right);
    var leftShare = (left / total) * 100;
    var rightShare = 100 - leftShare;
    var stateLabel = payload.finished ? 'FINAL' : (payload.running ? 'LIVE' : 'PAUSED');
    var fieldName = payload.field && payload.field.boss ? payload.field.boss : ((payload.field && payload.field.name) || 'Open Field');
    var pressureLabel = Math.abs(left - right) < 2
      ? 'Even field'
      : (left > right ? leftGang.short + ' pressure' : rightGang.short + ' pressure');
    var challenge = payload.challenge
      ? payload.challenge.name + ': ' + payload.challenge.line + '. ' + payload.challenge.rule
      : 'Challenge loading from the match engine.';
    var weather = payload.weather && payload.weather.name ? payload.weather.name : (payload.weather || 'Clear');
    var speed = Number(payload.speed || 1);

    desk.style.setProperty('--left-team', leftGang.color || '#e45745');
    desk.style.setProperty('--right-team', rightGang.color || '#3677e0');
    desk.style.setProperty('--left-share', leftShare.toFixed(1) + '%');
    desk.style.setProperty('--right-share', rightShare.toFixed(1) + '%');
    desk.style.setProperty('--pressure-x', leftShare.toFixed(1) + '%');

    setText('[data-live-field="state"]', stateLabel);
    setText('[data-live-field="match"]', String(payload.match || 1));
    setText('[data-live-field="last-update"]', new Date(payload.timestamp || Date.now()).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }));

    setText('[data-live-field="left-short"]', leftGang.short || 'L');
    setText('[data-live-field="left-name"]', leftGang.name || 'Left Gang');
    setText('[data-live-field="left-mark"]', leftGang.mark || '');
    setText('[data-live-field="left-alive"]', String(left));
    setText('[data-live-field="left-pressure"]', Math.round(leftShare) + '%');

    setText('[data-live-field="right-short"]', rightGang.short || 'R');
    setText('[data-live-field="right-name"]', rightGang.name || 'Right Gang');
    setText('[data-live-field="right-mark"]', rightGang.mark || '');
    setText('[data-live-field="right-alive"]', String(right));
    setText('[data-live-field="right-pressure"]', Math.round(rightShare) + '%');

    setText('[data-live-field="field"]', fieldName);
    setText('[data-live-field="speed"]', speedLabel(speed) + ' speed');
    setText('[data-live-field="auto-next"]', payload.autoNext ? 'On' : 'Off');
    setText('[data-live-field="momentum-label"]', pressureLabel);
    setText('[data-live-field="analyst-headline"]', pressureLabel);
    setText('[data-live-field="total-live"]', total + ' live');
    setText('[data-live-field="weather"]', weather);
    setText('[data-live-field="league-line"]', payload.league && payload.league.line ? payload.league.line : 'League loading');
    setText('[data-live-field="matchup"]', payload.league && payload.league.matchup ? payload.league.matchup : 'Nouns Nation Battler');
    setText('[data-live-field="root-line"]', payload.rootingFor ? payload.rootingFor : 'Pick');
    setText('[data-live-field="challenge"]', challenge);
    setText('[data-live-field="control-copy"]', stateLabel === 'LIVE' ? 'Live engine locked' : 'Engine hold');

    Array.prototype.forEach.call(desk.querySelectorAll('[data-speed]'), function (button) {
      button.classList.toggle('is-active', Number(button.dataset.speed) === speed);
    });

    renderTopNouns(payload.leaders);
    renderStandings(payload.standings);
    renderLog(payload.logs);
  }

  desk.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
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

  try {
    localStorage.setItem('pc:nouns-nation-guide-v1', 'seen');
  } catch (error) {
    /* LocalStorage can be unavailable in hardened browsers. The field still loads. */
  }

  var battleSrc = frame.getAttribute('data-battle-src');
  if (battleSrc && frame.getAttribute('src') !== battleSrc) {
    frame.setAttribute('src', battleSrc);
  }

  window.setInterval(function () {
    postCommand('snapshot');
  }, 2500);
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "PointCast Battle Desk V2", "description": "A GameCast-style v2 control room for Nouns Nation Battler with a live pressure line, analyst rail, league table, top Nouns, replay log, controls, and the embedded 30 vs 30 field feed.", "image": "/images/og/nouns-battler-v2.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation.json", title: "Nouns Nation federation manifest (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-v2.png",
    buttons: [
      { label: "Watch v2", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-v2/" },
      { label: "Nouns Nation", action: "link", target: "https://pointcast.xyz/nouns-nation/" },
      { label: "TV Cast", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-tv/" },
      { label: "Desk Wall", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-desk/" },
      { label: "Game JSON", action: "link", target: "https://pointcast.xyz/nouns-nation-battler.json" }
    ]
  }, "data-astro-cid-yoador66": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="battle-v2" data-battle-v2${addAttribute(`--btl: ${ch.color600}; --btl-dark: ${ch.color800}; --btl-soft: ${ch.color50}; --left-team: #e45745; --right-team: #3677e0; --left-share: 50%; --right-share: 50%; --pressure-x: 50%;`, "style")} data-astro-cid-yoador66> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-yoador66> <a href="/" data-astro-cid-yoador66>Home</a> <span aria-hidden="true" data-astro-cid-yoador66>/</span> <a href="/nouns-nation/" data-astro-cid-yoador66>Nouns Nation</a> <span aria-hidden="true" data-astro-cid-yoador66>/</span> <a href="/nouns-nation-battler/" data-astro-cid-yoador66>Battle Desk</a> <span aria-hidden="true" data-astro-cid-yoador66>/</span> <span data-astro-cid-yoador66>V2</span> </nav> <section class="topline" aria-label="Battle desk v2 ticker" data-astro-cid-yoador66> <div class="brand-lockup" data-astro-cid-yoador66> <span data-astro-cid-yoador66>PointCast BTL</span> <strong data-astro-cid-yoador66>Control Room V2</strong> </div> <div class="ticker" aria-label="Live desk ticker" data-astro-cid-yoador66> <span class="ticker__live" data-live-field="state" data-astro-cid-yoador66>LIVE</span> <div class="ticker__viewport" data-astro-cid-yoador66> <div class="ticker__track" data-astro-cid-yoador66> ${tickerItems.concat(tickerItems).map((item) => renderTemplate`<span data-astro-cid-yoador66>${item}</span>`)} </div> </div> </div> <a href="/nouns-nation/" data-astro-cid-yoador66>Nation Hub</a> </section> <section class="command-head" aria-label="Live command header" data-astro-cid-yoador66> <div class="title-lockup" data-astro-cid-yoador66> <p data-astro-cid-yoador66>CH.BTL / automated league feed</p> <h1 data-astro-cid-yoador66>Battle Desk V2</h1> </div> <div class="status-bank" aria-label="Current match state" data-astro-cid-yoador66> <article data-astro-cid-yoador66> <span data-astro-cid-yoador66>Match</span> <strong data-live-field="match" data-astro-cid-yoador66>1</strong> </article> <article data-astro-cid-yoador66> <span data-astro-cid-yoador66>Field</span> <strong data-live-field="field" data-astro-cid-yoador66>Open Field</strong> </article> <article data-astro-cid-yoador66> <span data-astro-cid-yoador66>Updated</span> <strong data-live-field="last-update" data-astro-cid-yoador66>warming</strong> </article> </div> </section> <section class="score-deck" aria-label="Live matchup" data-astro-cid-yoador66> <article class="team-card team-card--left" data-astro-cid-yoador66> <div class="team-chip" data-live-field="left-short" data-astro-cid-yoador66>TN</div> <div class="team-meta" data-astro-cid-yoador66> <h2 data-live-field="left-name" data-astro-cid-yoador66>Tomato Noggles</h2> <p data-live-field="left-mark" data-astro-cid-yoador66>split tomato noggles</p> </div> <div class="alive-box" data-astro-cid-yoador66> <span data-astro-cid-yoador66>Alive</span> <strong data-live-field="left-alive" data-astro-cid-yoador66>30</strong> </div> </article> <div class="match-center" data-astro-cid-yoador66> <p data-live-field="league-line" data-astro-cid-yoador66>Day 1 / 14 / Slate 1 of 4</p> <h2 data-live-field="matchup" data-astro-cid-yoador66>Nouns Nation Battler</h2> <div class="pressure" aria-label="Pressure meter" data-astro-cid-yoador66> <i data-astro-cid-yoador66></i> </div> <div class="pressure-labels" data-astro-cid-yoador66> <span data-live-field="left-pressure" data-astro-cid-yoador66>50%</span> <strong data-live-field="momentum-label" data-astro-cid-yoador66>Even field</strong> <span data-live-field="right-pressure" data-astro-cid-yoador66>50%</span> </div> </div> <article class="team-card team-card--right" data-astro-cid-yoador66> <div class="team-chip" data-live-field="right-short" data-astro-cid-yoador66>CF</div> <div class="team-meta" data-astro-cid-yoador66> <h2 data-live-field="right-name" data-astro-cid-yoador66>Cobalt Frames</h2> <p data-live-field="right-mark" data-astro-cid-yoador66>blue square lenses</p> </div> <div class="alive-box" data-astro-cid-yoador66> <span data-astro-cid-yoador66>Alive</span> <strong data-live-field="right-alive" data-astro-cid-yoador66>30</strong> </div> </article> </section> <section class="control-strip" aria-label="Desk controls" data-astro-cid-yoador66> <button type="button" data-desk-command="newMatch" data-astro-cid-yoador66>Next</button> <button type="button" data-desk-command="quickSim" data-astro-cid-yoador66>Quick Sim</button> <button type="button" data-desk-command="simDay" data-astro-cid-yoador66>Sim Day</button> <button type="button" data-desk-command="togglePause" data-astro-cid-yoador66>Pause</button> <button type="button" data-desk-command="setAutoNext" data-astro-cid-yoador66>Auto Next</button> <button type="button" data-desk-command="setSpeed" data-speed="0.75" data-astro-cid-yoador66>Slow</button> <button type="button" class="is-active" data-desk-command="setSpeed" data-speed="1" data-astro-cid-yoador66>Live</button> <button type="button" data-desk-command="setSpeed" data-speed="1.55" data-astro-cid-yoador66>Rush</button> <button type="button" data-desk-command="root" data-team="0" data-astro-cid-yoador66>Root Left</button> <button type="button" data-desk-command="root" data-team="1" data-astro-cid-yoador66>Root Right</button> </section> <section class="main-grid" aria-label="V2 live layout" data-astro-cid-yoador66> <section class="field-shell" aria-label="Embedded match field" data-astro-cid-yoador66> <header class="section-head" data-astro-cid-yoador66> <div data-astro-cid-yoador66> <p data-astro-cid-yoador66>Main Feed</p> <h2 data-live-field="control-copy" data-astro-cid-yoador66>Live engine locked</h2> </div> <span data-live-field="speed" data-astro-cid-yoador66>Live speed</span> </header> <iframe id="battleFrameV2" src="about:blank" data-battle-src="/games/nouns-nation-battler/index.html" title="Nouns Nation Battler live field feed" loading="eager" allow="fullscreen" data-astro-cid-yoador66></iframe> </section> <aside class="analyst-rail" aria-label="Live analyst rail" data-astro-cid-yoador66> <section class="panel panel--callout" data-astro-cid-yoador66> <header class="section-head" data-astro-cid-yoador66> <div data-astro-cid-yoador66> <p data-astro-cid-yoador66>Pressure Read</p> <h2 data-live-field="analyst-headline" data-astro-cid-yoador66>Even field</h2> </div> <span data-live-field="total-live" data-astro-cid-yoador66>60 live</span> </header> <p class="analysis-copy" data-live-field="challenge" data-astro-cid-yoador66>
Season challenge loading from the match engine.
</p> <div class="mini-stats" data-astro-cid-yoador66> <article data-astro-cid-yoador66> <span data-astro-cid-yoador66>Auto</span> <strong data-live-field="auto-next" data-astro-cid-yoador66>On</strong> </article> <article data-astro-cid-yoador66> <span data-astro-cid-yoador66>Root</span> <strong data-live-field="root-line" data-astro-cid-yoador66>Pick</strong> </article> <article data-astro-cid-yoador66> <span data-astro-cid-yoador66>Weather</span> <strong data-live-field="weather" data-astro-cid-yoador66>Clear</strong> </article> </div> </section> <section class="panel" data-astro-cid-yoador66> <header class="section-head" data-astro-cid-yoador66> <div data-astro-cid-yoador66> <p data-astro-cid-yoador66>Leaders</p> <h2 data-astro-cid-yoador66>Top Nouns</h2> </div> <span data-live-field="leader-count" data-astro-cid-yoador66>warming</span> </header> <div class="leader-board" data-live-field="top-nouns" data-astro-cid-yoador66> <article data-astro-cid-yoador66> <img src="/games/nouns-nation-battler/assets/noun-0.svg" alt="" loading="lazy" data-astro-cid-yoador66> <span data-astro-cid-yoador66>#0 / pregame</span> <strong data-astro-cid-yoador66>Noun on deck</strong> <em data-astro-cid-yoador66>0 dmg / 0 KO</em> </article> </div> </section> <section class="panel" data-astro-cid-yoador66> <header class="section-head" data-astro-cid-yoador66> <div data-astro-cid-yoador66> <p data-astro-cid-yoador66>Replay Desk</p> <h2 data-astro-cid-yoador66>Latest Calls</h2> </div> </header> <div class="replay-log" data-live-field="log" data-astro-cid-yoador66> <p data-astro-cid-yoador66>Waiting for first push.</p> </div> </section> </aside> </section> <section class="lower-grid" aria-label="League and desk tools" data-astro-cid-yoador66> <section class="panel panel--table" data-astro-cid-yoador66> <header class="section-head" data-astro-cid-yoador66> <div data-astro-cid-yoador66> <p data-astro-cid-yoador66>LeagueCast</p> <h2 data-astro-cid-yoador66>Standings</h2> </div> <span data-live-field="table-note" data-astro-cid-yoador66>local table</span> </header> <div class="standings" data-live-field="standings" data-astro-cid-yoador66> ${fallbackStandings.map((row, index) => renderTemplate`<article${addAttribute(`--team:${row.color}`, "style")} data-astro-cid-yoador66> <span data-astro-cid-yoador66>${index + 1}</span> <strong data-astro-cid-yoador66>${row.short}</strong> <em data-astro-cid-yoador66>${row.name}</em> <b data-astro-cid-yoador66>${row.record}</b> <i data-astro-cid-yoador66>${row.detail}</i> </article>`)} </div> </section> <section class="panel panel--links" data-astro-cid-yoador66> <header class="section-head" data-astro-cid-yoador66> <div data-astro-cid-yoador66> <p data-astro-cid-yoador66>Desk Outputs</p> <h2 data-astro-cid-yoador66>After the Whistle</h2> </div> </header> <div class="link-grid" data-astro-cid-yoador66> ${fieldCards.map((card) => renderTemplate`<a${addAttribute(card.href, "href")} data-astro-cid-yoador66> <span data-astro-cid-yoador66>${card.label}</span> <strong data-astro-cid-yoador66>${card.title}</strong> </a>`)} </div> </section> <section class="panel panel--runsheet" data-astro-cid-yoador66> <header class="section-head" data-astro-cid-yoador66> <div data-astro-cid-yoador66> <p data-astro-cid-yoador66>Run Sheet</p> <h2 data-astro-cid-yoador66>Producer Board</h2> </div> </header> <div class="run-sheet" data-astro-cid-yoador66> ${runSheet.map((item) => renderTemplate`<article data-astro-cid-yoador66> <span data-astro-cid-yoador66>${item.stamp}</span> <strong data-astro-cid-yoador66>${item.title}</strong> <p data-astro-cid-yoador66>${item.note}</p> </article>`)} </div> </section> </section> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-v2.astro";
const $$url = "/nouns-nation-battler-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattlerV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
