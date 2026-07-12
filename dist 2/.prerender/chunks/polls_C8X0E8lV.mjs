import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, m as maybeRenderHead, r as renderComponent, u as unescapeHTML, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import 'clsx';

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(raw || cooked.slice()) }));
var _a$1;
const $$VoterStats = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", `<aside class="vstats" id="vstats" aria-label="Voter progression" data-astro-cid-m4ssd5yk> <div class="vstats__row" data-astro-cid-m4ssd5yk> <span class="vstats__emoji" id="vstats-emoji" data-astro-cid-m4ssd5yk>🗳️</span> <span class="vstats__title mono" id="vstats-title" data-astro-cid-m4ssd5yk>NOVICE VOTER</span> <span class="vstats__level mono" id="vstats-level" data-astro-cid-m4ssd5yk>L1</span> <span class="vstats__sep" aria-hidden="true" data-astro-cid-m4ssd5yk>·</span> <span class="vstats__count mono" data-astro-cid-m4ssd5yk><span id="vstats-count" data-astro-cid-m4ssd5yk>0</span> votes</span> <span class="vstats__sep" aria-hidden="true" data-astro-cid-m4ssd5yk>·</span> <span class="vstats__streak mono" data-astro-cid-m4ssd5yk>streak <span id="vstats-streak" data-astro-cid-m4ssd5yk>×0</span></span> <span class="vstats__unlocks mono" id="vstats-unlocks" aria-label="Achievements earned" data-astro-cid-m4ssd5yk></span> </div> </aside> <div class="vstats-toast" id="vstats-toast" hidden role="status" aria-live="polite" data-astro-cid-m4ssd5yk> <span class="vstats-toast__emoji" id="vstats-toast-emoji" data-astro-cid-m4ssd5yk>🎉</span> <span class="vstats-toast__label" id="vstats-toast-label" data-astro-cid-m4ssd5yk>Milestone</span> </div> <script>
  (function () {
    var TITLES = [
      { min: 0,  title: 'NOVICE VOTER',    emoji: '🗳️' },
      { min: 3,  title: 'APPRENTICE',      emoji: '🎯' },
      { min: 8,  title: 'SCOUT',           emoji: '🔍' },
      { min: 15, title: 'REGULAR',         emoji: '📊' },
      { min: 25, title: 'WITNESS',         emoji: '👁️' },
      { min: 40, title: 'FORECASTER',      emoji: '🔮' },
      { min: 60, title: 'SCHELLING POINT', emoji: '⚡' },
      { min: 99, title: 'ORACLE',          emoji: '🌀' },
    ];
    var ACHIEVEMENTS = [
      { id: 'first-vote',   label: 'First Vote',       emoji: '🗳️', check: function(s) { return s.count >= 1; } },
      { id: 'five-votes',   label: 'Warmed Up',        emoji: '🔥', check: function(s) { return s.count >= 5; } },
      { id: 'ten-votes',    label: 'Double Digits',    emoji: '🎯', check: function(s) { return s.count >= 10; } },
      { id: 'thirty-votes', label: 'Dedicated',        emoji: '💪', check: function(s) { return s.count >= 30; } },
      { id: 'first-zeit',   label: 'Zeitgeist Caught', emoji: '⚡', check: function(s) { return s.zeitgeist >= 1; } },
      { id: 'first-cast',   label: 'First Forecast',   emoji: '🔮', check: function(s) { return s.forecast >= 1; } },
      { id: 'five-polls',   label: 'Five Polls',       emoji: '📊', check: function(s) { return s.uniquePolls >= 5; } },
      { id: 'streak-3',     label: 'Three in a Row',   emoji: '⚡', check: function(s) { return s.streak >= 3; } },
      { id: 'streak-7',     label: 'Lucky Seven',      emoji: '🍀', check: function(s) { return s.streak >= 7; } },
    ];

    function readState() {
      function lsNum(k) { try { return parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch(e) { return 0; } }
      function lsArr(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e) { return []; } }
      return {
        count: lsNum('pc:voter:count'),
        uniquePolls: lsArr('pc:voter:polls').length,
        zeitgeist: lsNum('pc:voter:zeitgeist'),
        forecast: lsNum('pc:voter:forecast'),
        streak: (function(){ try { return parseInt(sessionStorage.getItem('pc:voter:streak') || '0', 10) || 0; } catch(e) { return 0; } })(),
        unlocks: lsArr('pc:voter:unlocks'),
      };
    }

    function titleFor(n) {
      var t = TITLES[0];
      for (var i = 0; i < TITLES.length; i++) if (n >= TITLES[i].min) t = TITLES[i];
      return t;
    }
    function levelFor(n) { return Math.min(Math.floor(n / 3) + 1, 20); }

    function paint(s) {
      var t = titleFor(s.count);
      var el = function(id) { return document.getElementById(id); };
      if (el('vstats-emoji')) el('vstats-emoji').textContent = t.emoji;
      if (el('vstats-title')) el('vstats-title').textContent = t.title;
      if (el('vstats-level')) el('vstats-level').textContent = 'L' + levelFor(s.count);
      if (el('vstats-count')) el('vstats-count').textContent = String(s.count);
      if (el('vstats-streak')) el('vstats-streak').textContent = '×' + s.streak;
      if (el('vstats-unlocks')) {
        var ids = s.unlocks || [];
        var emojis = ids.map(function(id) {
          var a = ACHIEVEMENTS.find(function(x) { return x.id === id; });
          return a ? a.emoji : '';
        }).filter(Boolean);
        el('vstats-unlocks').textContent = emojis.join(' ');
        el('vstats-unlocks').setAttribute('title', ids.join(', '));
      }
    }

    function showToast(emoji, label) {
      var t = document.getElementById('vstats-toast');
      var e = document.getElementById('vstats-toast-emoji');
      var l = document.getElementById('vstats-toast-label');
      if (!t || !e || !l) return;
      e.textContent = emoji;
      l.textContent = label;
      t.hidden = false;
      t.classList.remove('vstats-toast--show');
      void t.offsetWidth;  // reflow
      t.classList.add('vstats-toast--show');
      setTimeout(function() {
        t.classList.remove('vstats-toast--show');
        setTimeout(function() { t.hidden = true; }, 400);
      }, 2400);
    }

    // Paint initial
    paint(readState());

    // Expose global hook for components to call
    window.pcVoter = {
      record: function(opts) {
        opts = opts || {};
        var slug = opts.slug || '';
        var mode = opts.mode || 'coordination';  // coordination | forecast | zeitgeist
        var prevCount = (function(){ try { return parseInt(localStorage.getItem('pc:voter:count') || '0', 10) || 0; } catch(e) { return 0; } })();
        var prevLevel = levelFor(prevCount);

        // Increment count
        var newCount = prevCount + 1;
        try { localStorage.setItem('pc:voter:count', String(newCount)); } catch(e) {}

        // Track unique polls
        try {
          var polls = JSON.parse(localStorage.getItem('pc:voter:polls') || '[]');
          if (slug && polls.indexOf(slug) === -1) {
            polls.push(slug);
            localStorage.setItem('pc:voter:polls', JSON.stringify(polls));
          }
        } catch(e) {}

        // Mode counters
        if (mode === 'zeitgeist') {
          try { localStorage.setItem('pc:voter:zeitgeist', String(parseInt(localStorage.getItem('pc:voter:zeitgeist') || '0', 10) + 1)); } catch(e) {}
        } else if (mode === 'forecast') {
          try { localStorage.setItem('pc:voter:forecast', String(parseInt(localStorage.getItem('pc:voter:forecast') || '0', 10) + 1)); } catch(e) {}
        }

        // Session streak — sessionStorage so it resets per tab
        var prevStreak = 0;
        try { prevStreak = parseInt(sessionStorage.getItem('pc:voter:streak') || '0', 10) || 0; } catch(e) {}
        var newStreak = prevStreak + 1;
        try { sessionStorage.setItem('pc:voter:streak', String(newStreak)); } catch(e) {}

        // Check for new achievements
        var s = readState();
        var priorUnlocks = s.unlocks.slice();
        var newAchievements = [];
        ACHIEVEMENTS.forEach(function(a) {
          if (priorUnlocks.indexOf(a.id) === -1 && a.check(s)) {
            priorUnlocks.push(a.id);
            newAchievements.push(a);
          }
        });
        try { localStorage.setItem('pc:voter:unlocks', JSON.stringify(priorUnlocks)); } catch(e) {}

        // Level up?
        var newLevel = levelFor(newCount);
        var leveledUp = newLevel > prevLevel;

        // Repaint — direct + event dispatch so any other listener (on this
        // page or elsewhere) can repaint too. The event form is belt-and-
        // suspenders: even if the IIFE-scoped paint() somehow doesn't fire,
        // the event-listener below guarantees the top strip repaints.
        paint(readState());
        try { window.dispatchEvent(new CustomEvent('pc:voter-updated', { detail: readState() })); } catch(e) {}

        // Toast for new achievement (first one) or level-up
        if (newAchievements.length > 0) {
          showToast(newAchievements[0].emoji, 'UNLOCKED · ' + newAchievements[0].label.toUpperCase());
        } else if (leveledUp) {
          var t = titleFor(newCount);
          showToast(t.emoji, 'LEVEL ' + newLevel + ' · ' + t.title);
        }

        return { count: newCount, leveledUp: leveledUp, newAchievements: newAchievements };
      },
      // Public refresh hook — anyone can force a repaint after writing LS
      refresh: function() { paint(readState()); },
    };

    // Also listen for the custom event so cross-script repaints work.
    window.addEventListener('pc:voter-updated', function() { paint(readState()); });

    // And listen for native \`storage\` events — if LS is modified from another
    // tab, this tab repaints on return-focus. Doesn't fire for same-tab LS
    // changes, but it's a cheap safety for multi-tab voters.
    window.addEventListener('storage', function(e) {
      if (e.key && e.key.indexOf('pc:voter:') === 0) paint(readState());
    });

    // Repaint on visibility change — if the user tabbed away, voted somewhere,
    // came back, the top reflects reality.
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) paint(readState());
    });
  })();
<\/script>`], ["", `<aside class="vstats" id="vstats" aria-label="Voter progression" data-astro-cid-m4ssd5yk> <div class="vstats__row" data-astro-cid-m4ssd5yk> <span class="vstats__emoji" id="vstats-emoji" data-astro-cid-m4ssd5yk>🗳️</span> <span class="vstats__title mono" id="vstats-title" data-astro-cid-m4ssd5yk>NOVICE VOTER</span> <span class="vstats__level mono" id="vstats-level" data-astro-cid-m4ssd5yk>L1</span> <span class="vstats__sep" aria-hidden="true" data-astro-cid-m4ssd5yk>·</span> <span class="vstats__count mono" data-astro-cid-m4ssd5yk><span id="vstats-count" data-astro-cid-m4ssd5yk>0</span> votes</span> <span class="vstats__sep" aria-hidden="true" data-astro-cid-m4ssd5yk>·</span> <span class="vstats__streak mono" data-astro-cid-m4ssd5yk>streak <span id="vstats-streak" data-astro-cid-m4ssd5yk>×0</span></span> <span class="vstats__unlocks mono" id="vstats-unlocks" aria-label="Achievements earned" data-astro-cid-m4ssd5yk></span> </div> </aside> <div class="vstats-toast" id="vstats-toast" hidden role="status" aria-live="polite" data-astro-cid-m4ssd5yk> <span class="vstats-toast__emoji" id="vstats-toast-emoji" data-astro-cid-m4ssd5yk>🎉</span> <span class="vstats-toast__label" id="vstats-toast-label" data-astro-cid-m4ssd5yk>Milestone</span> </div> <script>
  (function () {
    var TITLES = [
      { min: 0,  title: 'NOVICE VOTER',    emoji: '🗳️' },
      { min: 3,  title: 'APPRENTICE',      emoji: '🎯' },
      { min: 8,  title: 'SCOUT',           emoji: '🔍' },
      { min: 15, title: 'REGULAR',         emoji: '📊' },
      { min: 25, title: 'WITNESS',         emoji: '👁️' },
      { min: 40, title: 'FORECASTER',      emoji: '🔮' },
      { min: 60, title: 'SCHELLING POINT', emoji: '⚡' },
      { min: 99, title: 'ORACLE',          emoji: '🌀' },
    ];
    var ACHIEVEMENTS = [
      { id: 'first-vote',   label: 'First Vote',       emoji: '🗳️', check: function(s) { return s.count >= 1; } },
      { id: 'five-votes',   label: 'Warmed Up',        emoji: '🔥', check: function(s) { return s.count >= 5; } },
      { id: 'ten-votes',    label: 'Double Digits',    emoji: '🎯', check: function(s) { return s.count >= 10; } },
      { id: 'thirty-votes', label: 'Dedicated',        emoji: '💪', check: function(s) { return s.count >= 30; } },
      { id: 'first-zeit',   label: 'Zeitgeist Caught', emoji: '⚡', check: function(s) { return s.zeitgeist >= 1; } },
      { id: 'first-cast',   label: 'First Forecast',   emoji: '🔮', check: function(s) { return s.forecast >= 1; } },
      { id: 'five-polls',   label: 'Five Polls',       emoji: '📊', check: function(s) { return s.uniquePolls >= 5; } },
      { id: 'streak-3',     label: 'Three in a Row',   emoji: '⚡', check: function(s) { return s.streak >= 3; } },
      { id: 'streak-7',     label: 'Lucky Seven',      emoji: '🍀', check: function(s) { return s.streak >= 7; } },
    ];

    function readState() {
      function lsNum(k) { try { return parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch(e) { return 0; } }
      function lsArr(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e) { return []; } }
      return {
        count: lsNum('pc:voter:count'),
        uniquePolls: lsArr('pc:voter:polls').length,
        zeitgeist: lsNum('pc:voter:zeitgeist'),
        forecast: lsNum('pc:voter:forecast'),
        streak: (function(){ try { return parseInt(sessionStorage.getItem('pc:voter:streak') || '0', 10) || 0; } catch(e) { return 0; } })(),
        unlocks: lsArr('pc:voter:unlocks'),
      };
    }

    function titleFor(n) {
      var t = TITLES[0];
      for (var i = 0; i < TITLES.length; i++) if (n >= TITLES[i].min) t = TITLES[i];
      return t;
    }
    function levelFor(n) { return Math.min(Math.floor(n / 3) + 1, 20); }

    function paint(s) {
      var t = titleFor(s.count);
      var el = function(id) { return document.getElementById(id); };
      if (el('vstats-emoji')) el('vstats-emoji').textContent = t.emoji;
      if (el('vstats-title')) el('vstats-title').textContent = t.title;
      if (el('vstats-level')) el('vstats-level').textContent = 'L' + levelFor(s.count);
      if (el('vstats-count')) el('vstats-count').textContent = String(s.count);
      if (el('vstats-streak')) el('vstats-streak').textContent = '×' + s.streak;
      if (el('vstats-unlocks')) {
        var ids = s.unlocks || [];
        var emojis = ids.map(function(id) {
          var a = ACHIEVEMENTS.find(function(x) { return x.id === id; });
          return a ? a.emoji : '';
        }).filter(Boolean);
        el('vstats-unlocks').textContent = emojis.join(' ');
        el('vstats-unlocks').setAttribute('title', ids.join(', '));
      }
    }

    function showToast(emoji, label) {
      var t = document.getElementById('vstats-toast');
      var e = document.getElementById('vstats-toast-emoji');
      var l = document.getElementById('vstats-toast-label');
      if (!t || !e || !l) return;
      e.textContent = emoji;
      l.textContent = label;
      t.hidden = false;
      t.classList.remove('vstats-toast--show');
      void t.offsetWidth;  // reflow
      t.classList.add('vstats-toast--show');
      setTimeout(function() {
        t.classList.remove('vstats-toast--show');
        setTimeout(function() { t.hidden = true; }, 400);
      }, 2400);
    }

    // Paint initial
    paint(readState());

    // Expose global hook for components to call
    window.pcVoter = {
      record: function(opts) {
        opts = opts || {};
        var slug = opts.slug || '';
        var mode = opts.mode || 'coordination';  // coordination | forecast | zeitgeist
        var prevCount = (function(){ try { return parseInt(localStorage.getItem('pc:voter:count') || '0', 10) || 0; } catch(e) { return 0; } })();
        var prevLevel = levelFor(prevCount);

        // Increment count
        var newCount = prevCount + 1;
        try { localStorage.setItem('pc:voter:count', String(newCount)); } catch(e) {}

        // Track unique polls
        try {
          var polls = JSON.parse(localStorage.getItem('pc:voter:polls') || '[]');
          if (slug && polls.indexOf(slug) === -1) {
            polls.push(slug);
            localStorage.setItem('pc:voter:polls', JSON.stringify(polls));
          }
        } catch(e) {}

        // Mode counters
        if (mode === 'zeitgeist') {
          try { localStorage.setItem('pc:voter:zeitgeist', String(parseInt(localStorage.getItem('pc:voter:zeitgeist') || '0', 10) + 1)); } catch(e) {}
        } else if (mode === 'forecast') {
          try { localStorage.setItem('pc:voter:forecast', String(parseInt(localStorage.getItem('pc:voter:forecast') || '0', 10) + 1)); } catch(e) {}
        }

        // Session streak — sessionStorage so it resets per tab
        var prevStreak = 0;
        try { prevStreak = parseInt(sessionStorage.getItem('pc:voter:streak') || '0', 10) || 0; } catch(e) {}
        var newStreak = prevStreak + 1;
        try { sessionStorage.setItem('pc:voter:streak', String(newStreak)); } catch(e) {}

        // Check for new achievements
        var s = readState();
        var priorUnlocks = s.unlocks.slice();
        var newAchievements = [];
        ACHIEVEMENTS.forEach(function(a) {
          if (priorUnlocks.indexOf(a.id) === -1 && a.check(s)) {
            priorUnlocks.push(a.id);
            newAchievements.push(a);
          }
        });
        try { localStorage.setItem('pc:voter:unlocks', JSON.stringify(priorUnlocks)); } catch(e) {}

        // Level up?
        var newLevel = levelFor(newCount);
        var leveledUp = newLevel > prevLevel;

        // Repaint — direct + event dispatch so any other listener (on this
        // page or elsewhere) can repaint too. The event form is belt-and-
        // suspenders: even if the IIFE-scoped paint() somehow doesn't fire,
        // the event-listener below guarantees the top strip repaints.
        paint(readState());
        try { window.dispatchEvent(new CustomEvent('pc:voter-updated', { detail: readState() })); } catch(e) {}

        // Toast for new achievement (first one) or level-up
        if (newAchievements.length > 0) {
          showToast(newAchievements[0].emoji, 'UNLOCKED · ' + newAchievements[0].label.toUpperCase());
        } else if (leveledUp) {
          var t = titleFor(newCount);
          showToast(t.emoji, 'LEVEL ' + newLevel + ' · ' + t.title);
        }

        return { count: newCount, leveledUp: leveledUp, newAchievements: newAchievements };
      },
      // Public refresh hook — anyone can force a repaint after writing LS
      refresh: function() { paint(readState()); },
    };

    // Also listen for the custom event so cross-script repaints work.
    window.addEventListener('pc:voter-updated', function() { paint(readState()); });

    // And listen for native \\\`storage\\\` events — if LS is modified from another
    // tab, this tab repaints on return-focus. Doesn't fire for same-tab LS
    // changes, but it's a cheap safety for multi-tab voters.
    window.addEventListener('storage', function(e) {
      if (e.key && e.key.indexOf('pc:voter:') === 0) paint(readState());
    });

    // Repaint on visibility change — if the user tabbed away, voted somewhere,
    // came back, the top reflects reality.
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) paint(readState());
    });
  })();
<\/script>`])), maybeRenderHead());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/VoterStats.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b, _c;
const $$Polls = createComponent(async ($$result, $$props, $$slots) => {
  const polls = (await getCollection("polls", ({ data }) => !data.draft)).sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime());
  const parentBySlug = /* @__PURE__ */ new Map();
  polls.forEach((p) => {
    const fu = p.data.followUps ?? {};
    for (const childSlug of Object.values(fu)) {
      if (!parentBySlug.has(childSlug)) parentBySlug.set(childSlug, p.data.slug);
    }
  });
  const title = "Polls — Schelling-point coordination";
  const description = "Pick a focal point. Win if you match the most-popular answer. Coordination game over content. Per Mike 2026-04-18 directive.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PointCast Polls",
    description,
    url: "https://pointcast.xyz/polls"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/polls.png", "jsonLd": jsonLd, "data-astro-cid-ebrcqvmp": true }, { "default": async ($$result2) => renderTemplate(_c || (_c = __template([" ", '<main class="page" data-astro-cid-ebrcqvmp> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-ebrcqvmp> <a href="/" data-astro-cid-ebrcqvmp>Home</a> <span aria-hidden="true" data-astro-cid-ebrcqvmp>›</span> <span data-astro-cid-ebrcqvmp>polls</span> </nav> ', ` <header class="head" data-astro-cid-ebrcqvmp> <p class="kicker mono" data-astro-cid-ebrcqvmp>
POLLS · SCHELLING POINTS
<a href="/zeitgeist-map" class="map-link" data-astro-cid-ebrcqvmp>▣ VIEW AS CONSTELLATION MAP →</a> </p> <h1 class="title" data-astro-cid-ebrcqvmp>Pick the spot everyone else picks.</h1> <p class="dek" data-astro-cid-ebrcqvmp>
A Schelling-point poll is a coordination game disguised as a question.
        You don't win by guessing right. You win by guessing what other
        people will guess. Reveals where collective attention focuses
        without anyone telling it to. From Thomas Schelling, who studied
        what people converge on with no communication. Per
<a href="/b/0272" data-astro-cid-ebrcqvmp>block 0272</a>.
</p> </header>  <section class="viz" id="polls-viz" aria-label="Polls activity" data-astro-cid-ebrcqvmp> <div class="viz__metric" data-astro-cid-ebrcqvmp> <span class="viz__num mono" data-astro-cid-ebrcqvmp>`, `</span> <span class="viz__lbl mono" data-astro-cid-ebrcqvmp>POLLS LIVE</span> </div> <div class="viz__metric" data-astro-cid-ebrcqvmp> <span class="viz__num mono" id="viz-total-votes" data-astro-cid-ebrcqvmp>—</span> <span class="viz__lbl mono" data-astro-cid-ebrcqvmp>TOTAL VOTES</span> </div> <div class="viz__metric viz__metric--wide" data-astro-cid-ebrcqvmp> <span class="viz__lbl mono" data-astro-cid-ebrcqvmp>MOST ACTIVE</span> <span class="viz__leader mono" id="viz-most-active" data-astro-cid-ebrcqvmp>—</span> </div> <div class="viz__metric viz__metric--wide" data-astro-cid-ebrcqvmp> <span class="viz__lbl mono" data-astro-cid-ebrcqvmp>PURPOSE MIX</span> <span class="viz__bar" id="viz-purpose-bar" aria-hidden="true" data-astro-cid-ebrcqvmp></span> <span class="viz__legend mono" id="viz-purpose-legend" data-astro-cid-ebrcqvmp></span> </div> </section>  <details class="philosophy" data-astro-cid-ebrcqvmp> <summary data-astro-cid-ebrcqvmp><span class="mono" data-astro-cid-ebrcqvmp>POLLS PHILOSOPHY · WHAT MAKES A GOOD POINTCAST POLL</span></summary> <div class="philosophy__body" data-astro-cid-ebrcqvmp> <p data-astro-cid-ebrcqvmp><strong data-astro-cid-ebrcqvmp>The test in one sentence:</strong> if the leader changes, what happens differently?</p> <p data-astro-cid-ebrcqvmp>If the answer is "nothing", it's a clickbait poll — sorting people without doing anything with the result. PointCast polls have to belong to one of four categories:</p> <dl data-astro-cid-ebrcqvmp> <dt data-astro-cid-ebrcqvmp><span class="purpose-chip purpose-chip--coordination mono" data-astro-cid-ebrcqvmp>COORDINATION</span></dt> <dd data-astro-cid-ebrcqvmp>Schelling-point classics. The act of converging IS the win. (e.g. "where to meet")</dd> <dt data-astro-cid-ebrcqvmp><span class="purpose-chip purpose-chip--utility mono" data-astro-cid-ebrcqvmp>UTILITY</span></dt> <dd data-astro-cid-ebrcqvmp>Local info-gathering. Result helps the consumer decide something. (e.g. "best South Bay sunset")</dd> <dt data-astro-cid-ebrcqvmp><span class="purpose-chip purpose-chip--editorial mono" data-astro-cid-ebrcqvmp>EDITORIAL</span></dt> <dd data-astro-cid-ebrcqvmp>Feeds back into PointCast's loop — sprint routing, CotD picks, channel weighting.</dd> <dt data-astro-cid-ebrcqvmp><span class="purpose-chip purpose-chip--decision mono" data-astro-cid-ebrcqvmp>DECISION</span></dt> <dd data-astro-cid-ebrcqvmp>Outcome materially changes a real-world thing. (e.g. shop hours, meetup time)</dd> </dl> <p data-astro-cid-ebrcqvmp>Every poll has a <code data-astro-cid-ebrcqvmp>purpose</code> field + an <code data-astro-cid-ebrcqvmp>outcomeAction</code> sentence describing the downstream use. Tap any card to see its outcome below the question. Polls without a credible <code data-astro-cid-ebrcqvmp>outcomeAction</code> don't ship.</p> </div> </details> `, ' <section class="how" data-astro-cid-ebrcqvmp> <p class="kicker mono" data-astro-cid-ebrcqvmp>HOW IT WORKS</p> <ul class="how__steps" data-astro-cid-ebrcqvmp> <li data-astro-cid-ebrcqvmp><strong data-astro-cid-ebrcqvmp>Pick one.</strong> Tap an option. Per-address dedup; anonymous voters dedup by UA+IP fingerprint.</li> <li data-astro-cid-ebrcqvmp><strong data-astro-cid-ebrcqvmp>Distribution reveals after vote.</strong> See where the crowd converged.</li> <li data-astro-cid-ebrcqvmp><strong data-astro-cid-ebrcqvmp>The "win" is matching the most-popular pick.</strong> Truth value irrelevant; coordination value is the point.</li> <li data-astro-cid-ebrcqvmp><strong data-astro-cid-ebrcqvmp>No moderation surface.</strong> Polls are pre-authored JSON. No free-text submissions, no comments.</li> </ul> </section> ', " ", ` <script>
      // Paint RESOLVES IN N DAYS countdown on forecast poll chips.
      (function () {
        var chips = Array.from(document.querySelectorAll('.purpose-chip--forecast[data-resolves-at]'));
        chips.forEach(function (el) {
          var iso = el.getAttribute('data-resolves-at');
          if (!iso) return;
          var at = new Date(iso).getTime();
          var now = Date.now();
          var ms = at - now;
          if (ms <= 0) { el.textContent = 'RESOLVING…'; return; }
          var days = Math.ceil(ms / (24 * 3600 * 1000));
          el.textContent = 'FORECAST · RESOLVES IN ' + days + 'D';
        });
      })();
    <\/script> <script>
      (function () {
        var optsScript = document.getElementById('poll-options-by-slug');
        var purposeScript = document.getElementById('poll-purpose-by-slug');
        if (!optsScript) return;
        var labelMap = JSON.parse(optsScript.textContent || '{}');
        var purposeMap = JSON.parse((purposeScript && purposeScript.textContent) || '{}');
        var cards = Array.from(document.querySelectorAll('.poll-card__link[data-poll-slug]'));

        // Aggregate viz state.
        var aggregate = { total: 0, mostActive: { slug: null, n: 0, q: '' }, byPurpose: { coordination: 0, utility: 0, editorial: 0, decision: 0 } };
        var pending = cards.length;

        function paintAggregate() {
          var totalEl = document.getElementById('viz-total-votes');
          var mostEl = document.getElementById('viz-most-active');
          var barEl = document.getElementById('viz-purpose-bar');
          var legEl = document.getElementById('viz-purpose-legend');
          if (totalEl) totalEl.textContent = String(aggregate.total);
          if (mostEl) mostEl.textContent = aggregate.mostActive.slug
            ? aggregate.mostActive.slug + ' · ' + aggregate.mostActive.n + ' VOTE' + (aggregate.mostActive.n === 1 ? '' : 'S')
            : 'no votes yet';
          // Purpose distribution bar — segments by share of polls (not votes), since votes per purpose is sparse early.
          var purposeCounts = aggregate.byPurpose;
          var purposeTotal = (purposeCounts.coordination + purposeCounts.utility + purposeCounts.editorial + purposeCounts.decision) || 1;
          if (barEl) {
            barEl.innerHTML = '';
            var segs = [
              { k: 'coordination', color: '#185FA5', n: purposeCounts.coordination },
              { k: 'utility',      color: '#0F6E56', n: purposeCounts.utility },
              { k: 'editorial',    color: '#5F3DC4', n: purposeCounts.editorial },
              { k: 'decision',     color: '#C95019', n: purposeCounts.decision },
            ];
            segs.forEach(function (s) {
              if (s.n === 0) return;
              var span = document.createElement('span');
              span.className = 'viz__bar-seg';
              span.title = s.k + ': ' + s.n;
              span.style.background = s.color;
              span.style.width = (s.n / purposeTotal * 100) + '%';
              barEl.appendChild(span);
            });
          }
          if (legEl) {
            var parts = [];
            if (purposeCounts.coordination) parts.push(purposeCounts.coordination + ' COORD');
            if (purposeCounts.utility)      parts.push(purposeCounts.utility + ' UTIL');
            if (purposeCounts.editorial)    parts.push(purposeCounts.editorial + ' EDIT');
            if (purposeCounts.decision)     parts.push(purposeCounts.decision + ' DEC');
            legEl.textContent = parts.join(' · ');
          }
        }

        // Pre-count purpose distribution from cards (don't need to wait for fetches).
        cards.forEach(function (card) {
          var p = card.getAttribute('data-poll-purpose');
          if (p && aggregate.byPurpose[p] !== undefined) aggregate.byPurpose[p]++;
        });
        paintAggregate();

        cards.forEach(function (card) {
          var slug = card.getAttribute('data-poll-slug');
          var liveEl = card.querySelector('[data-poll-live]');
          var leaderEl = card.querySelector('[data-poll-leader]');
          fetch('/api/poll?slug=' + encodeURIComponent(slug), { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (j) {
              if (!j || !j.ok) return;
              var total = j.total || 0;
              if (liveEl) {
                liveEl.textContent = total + ' VOTE' + (total === 1 ? '' : 'S');
                liveEl.dataset.state = total > 0 ? 'active' : '';
              }
              if (leaderEl && total > 0) {
                var tally = j.tally || {};
                var bestId = null, bestN = 0;
                for (var k in tally) { if (tally[k] > bestN) { bestN = tally[k]; bestId = k; } }
                if (bestId) {
                  var label = (labelMap[slug] && labelMap[slug][bestId]) || bestId;
                  var pct = total > 0 ? Math.round((bestN / total) * 100) : 0;
                  leaderEl.textContent = 'LEADER · ' + label + ' · ' + pct + '%';
                }
              }

              // Aggregate update.
              aggregate.total += total;
              if (total > aggregate.mostActive.n) {
                aggregate.mostActive = { slug: slug, n: total, q: '' };
              }
            })
            .catch(function () {})
            .finally(function () {
              pending--;
              if (pending <= 0) paintAggregate();
            });
        });
      })();
    <\/script> <section class="agent-strip" data-astro-cid-ebrcqvmp> <p class="agent-strip__label mono" data-astro-cid-ebrcqvmp>MACHINE-READABLE</p> <ul data-astro-cid-ebrcqvmp> <li data-astro-cid-ebrcqvmp><a href="/api/poll" data-astro-cid-ebrcqvmp>/api/poll</a></li> <li data-astro-cid-ebrcqvmp><a href="/agents.json" data-astro-cid-ebrcqvmp>/agents.json</a></li> <li data-astro-cid-ebrcqvmp><a href="/b/0272" data-astro-cid-ebrcqvmp>/b/0272 · the directive</a></li> <li data-astro-cid-ebrcqvmp><a href="/for-agents" data-astro-cid-ebrcqvmp>/for-agents</a></li> </ul> </section> </main> `])), maybeRenderHead(), renderComponent($$result2, "VoterStats", $$VoterStats, { "data-astro-cid-ebrcqvmp": true }), polls.length, polls.length === 0 ? renderTemplate`<section class="empty" data-astro-cid-ebrcqvmp> <p class="empty__title" data-astro-cid-ebrcqvmp>No polls yet.</p> <p class="empty__body" data-astro-cid-ebrcqvmp>Drop a JSON file in <code data-astro-cid-ebrcqvmp>src/content/polls/&#123;slug&#125;.json</code> to seed the first one.</p> </section>` : renderTemplate`<ul class="list" data-astro-cid-ebrcqvmp> ${polls.map((p) => renderTemplate`<li class="poll-card" data-astro-cid-ebrcqvmp> <a${addAttribute(`/poll/${p.data.slug}`, "href")} class="poll-card__link"${addAttribute(p.data.slug, "data-poll-slug")}${addAttribute(p.data.purpose, "data-poll-purpose")} data-astro-cid-ebrcqvmp> <div class="poll-card__top" data-astro-cid-ebrcqvmp> <span${addAttribute(`purpose-chip purpose-chip--${p.data.purpose} mono`, "class")} data-astro-cid-ebrcqvmp>${(p.data.purpose || "coordination").toUpperCase()}</span> ${p.data.zeitgeist && renderTemplate`<span class="purpose-chip purpose-chip--zeitgeist mono" data-astro-cid-ebrcqvmp>ZEITGEIST</span>`} ${Object.keys(p.data.followUps ?? {}).length > 0 && renderTemplate`<span class="purpose-chip purpose-chip--pathway mono" title="This poll branches — picking mapped options reveals a next poll" data-astro-cid-ebrcqvmp>
PATHWAY · ${Object.keys(p.data.followUps ?? {}).length} </span>`} ${parentBySlug.has(p.data.slug) && renderTemplate`<span class="purpose-chip purpose-chip--followup mono"${addAttribute(`Follow-up from ${parentBySlug.get(p.data.slug)}`, "title")} data-astro-cid-ebrcqvmp>
FOLLOW-UP
</span>`} ${p.data.resolvesAt && !p.data.resolved && renderTemplate`<span class="purpose-chip purpose-chip--forecast mono"${addAttribute(p.data.resolvesAt.toISOString(), "data-resolves-at")} data-astro-cid-ebrcqvmp>FORECAST · RESOLVES —</span>`} ${p.data.resolved && renderTemplate`<span class="purpose-chip purpose-chip--resolved mono" data-astro-cid-ebrcqvmp>RESOLVED</span>`} <span class="poll-card__count mono" data-astro-cid-ebrcqvmp>${p.data.options.length} OPTIONS</span> <span class="poll-card__live mono" data-poll-live aria-live="polite" data-astro-cid-ebrcqvmp>— votes</span> </div> <h2 class="poll-card__q" data-astro-cid-ebrcqvmp>${p.data.question}</h2> ${p.data.dek && renderTemplate`<p class="poll-card__dek" data-astro-cid-ebrcqvmp>${p.data.dek}</p>`} ${p.data.outcomeAction && renderTemplate`<p class="poll-card__outcome" data-astro-cid-ebrcqvmp><span class="mono" data-astro-cid-ebrcqvmp>OUTCOME ·</span> ${p.data.outcomeAction}</p>`} <div class="poll-card__bottom" data-astro-cid-ebrcqvmp> <span class="poll-card__leader mono" data-poll-leader data-astro-cid-ebrcqvmp></span> <span class="poll-card__cta mono" data-astro-cid-ebrcqvmp>▶ VOTE</span> </div> </a> </li>`)} </ul>`, polls.length > 0 && renderTemplate(_a || (_a = __template(['<script type="application/json" id="poll-options-by-slug">', "<\/script>"])), unescapeHTML(JSON.stringify(
    Object.fromEntries(polls.map((p) => [
      p.data.slug,
      p.data.options.reduce((acc, o) => {
        acc[o.id] = o.label;
        return acc;
      }, {})
    ]))
  ))), polls.length > 0 && renderTemplate(_b || (_b = __template(['<script type="application/json" id="poll-purpose-by-slug">', "<\/script>"])), unescapeHTML(JSON.stringify(
    Object.fromEntries(polls.map((p) => [p.data.slug, p.data.purpose]))
  )))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/polls.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/polls.astro";
const $$url = "/polls";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Polls,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
