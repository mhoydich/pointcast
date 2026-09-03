// @ts-nocheck
import { MOOD_SOUNDTRACKS as PC_SOUNDTRACKS } from '../../lib/moods-soundtracks';
import { MOOD_SPELLS as PC_MOOD_SPELLS } from '../../data/mood-spells';
import { DOCK_KIT as PC_DOCK_KIT } from '../../data/dock-kit';
import { FEDERATION_PEERS } from '../../data/federation-peers';
import { NOW_PLAYING } from '../../data/now-playing';

const PC_FED_PEERS_COUNT = FEDERATION_PEERS.length;

export function mountFooterBar(root, scope) {
    const {
      on, setTimeout, clearTimeout, setInterval, clearInterval,
      requestAnimationFrame, cancelAnimationFrame,
    } = scope;
    var PC_NOW_PLAYING = NOW_PLAYING;
    'use strict';

    var $bar       = root;
    var $you       = root.querySelector('[data-pc-ref="fb-you"]');
    var $menuBtn   = root.querySelector('[data-pc-ref="fb-menu-btn"]');
    var $menu      = root.querySelector('[data-pc-ref="fb-menu"]');
    var $panel     = root.querySelector('[data-pc-ref="fb-menu-panel"]');
    var $scrim     = root.querySelector('[data-pc-ref="fb-menu-scrim"]');
    var $close     = root.querySelector('[data-pc-ref="fb-menu-close"]');
    var $omni      = root.querySelector('[data-pc-ref="fb-omni"]');
    var $omniForm  = root.querySelector('[data-pc-ref="fb-omni-form"]');
    var $omniMode  = root.querySelector('[data-pc-ref="fb-omni-mode"]');
    var $moodLabel = root.querySelector('[data-pc-ref="fb-mood-label"]');
    var $youLabel  = root.querySelector('[data-pc-ref="fb-you-label"]');
    var $noun      = root.querySelector('[data-pc-ref="fb-noun"]');
    var $menuNoun  = root.querySelector('[data-pc-ref="fb-menu-noun"]');
    var $menuName  = root.querySelector('[data-pc-ref="fb-menu-name"]');
    var $menuWallet = root.querySelector('[data-pc-ref="fb-menu-wallet-status"]');
    var $walletBtn = root.querySelector('[data-pc-ref="fb-btn-wallet"]');
    var $moodSelect = root.querySelector('[data-pc-ref="fb-mood-select"]');
    var $soundBtn  = root.querySelector('[data-pc-ref="fb-btn-soundtrack"]');
    var $soundLabel = root.querySelector('[data-pc-ref="fb-soundtrack-label"]');
    var $soundtrack = root.querySelector('[data-pc-ref="fb-soundtrack"]');
    var $liveHere  = root.querySelector('[data-pc-ref="fb-live-here"]');

    if (!$bar || !$menu) return;

    try {
      var st = PC_SOUNDTRACKS || {};
      Object.keys(st).forEach(function (k) {
        if (Array.from($moodSelect.options).some(function (option) { return option.value === k; })) return;
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = (st[k].label || k).toLowerCase();
        $moodSelect.appendChild(opt);
      });
    } catch (e) {}

    var openPopover = null;
    var lastFocused = null;

    function getTrayEl(id) { return root.querySelector('[data-pc-ref="fb-tray-' + id + '"]'); }
    function getStampEl(id) { return root.querySelector('[data-pc-ref="fb-stamp-' + id + '"]'); }

    function closeAll() {
      if ($menu.getAttribute('data-open') === 'true') {
        $menu.setAttribute('data-open', 'false');
        setTimeout(function () { $menu.hidden = true; }, 220);
        $menuBtn.setAttribute('aria-expanded', 'false');
        $you.setAttribute('aria-expanded', 'false');
      }
      root.querySelectorAll('.fb__tray').forEach(function (tr) {
        if (tr.getAttribute('data-open') === 'true') {
          tr.setAttribute('data-open', 'false');
          setTimeout(function () { tr.hidden = true; }, 200);
          var stampId = String(tr.getAttribute('data-pc-ref') || '').replace('fb-tray-', '');
          var st = getStampEl(stampId);
          if (st) st.setAttribute('aria-expanded', 'false');
        }
      });
      openPopover = null;
      document.removeEventListener('keydown', onEsc);
      document.documentElement.classList.remove('pc-dock-open');
      window.dispatchEvent(new CustomEvent('pc:dock-visibility', { detail: { open: false } }));
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (e) {}
      }
    }

    function onEsc(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeAll(); }
    }

    function openMenu() {
      closeAll();
      lastFocused = document.activeElement;
      $menu.hidden = false;
      void $menu.offsetWidth;
      $menu.setAttribute('data-open', 'true');
      $menuBtn.setAttribute('aria-expanded', 'true');
      $you.setAttribute('aria-expanded', 'true');
      setTimeout(function () { try { $panel.focus(); } catch (e) {} }, 10);
      openPopover = 'menu';
      on(document, 'keydown', onEsc);
      document.documentElement.classList.add('pc-dock-open');
      window.dispatchEvent(new CustomEvent('pc:dock-visibility', { detail: { open: true } }));
    }

    function openTray(id) {
      var tray = getTrayEl(id);
      var stamp = getStampEl(id);
      if (!tray) return;
      var anchor = stamp || $menuBtn;
      closeAll();
      lastFocused = document.activeElement;
      tray.hidden = false;
      void tray.offsetWidth;
      tray.setAttribute('data-open', 'true');
      if (stamp) stamp.setAttribute('aria-expanded', 'true');
      try {
        var rect = anchor.getBoundingClientRect();
        var trayWidth = tray.getBoundingClientRect().width || 320;
        var winWidth = window.innerWidth;
        var center = rect.left + rect.width / 2;
        var leftPx = Math.max(8, Math.min(center - trayWidth / 2, winWidth - trayWidth - 8));
        tray.style.left = leftPx + 'px';
        tray.style.right = 'auto';
        var arrow = tray.querySelector('.fb__tray-arrow');
        if (arrow) arrow.style.left = (center - leftPx) + 'px';
      } catch (e) {}
      setTimeout(function () {
        var focusable = tray.querySelector('input, textarea, button, select, a[href]');
        if (focusable) try { focusable.focus(); } catch (e) {}
      }, 30);
      openPopover = 'tray:' + id;
      on(document, 'keydown', onEsc);
      document.documentElement.classList.add('pc-dock-open');
      window.dispatchEvent(new CustomEvent('pc:dock-visibility', { detail: { open: true, tray: id } }));
      // Per-tray on-open hooks (defined later in the IIFE; hoisted because
      // they're function declarations).
      try {
        if (id === 'ask') {
          renderEchoes();
          reconcileEchoes();
        } else if (id === 'agent') {
          refreshAgentActivity();
        } else if (id === 'passport') {
          renderPassport();
        } else if (id === 'seismo') {
          seismoOpen();
        }
      } catch (e) {}
    }

    root.querySelectorAll('.fb__stamp').forEach(function (st) {
      on(st, 'click', function () {
        var id = st.getAttribute('data-stamp-id');
        if (openPopover === 'tray:' + id) closeAll();
        else openTray(id);
      });
    });
    root.querySelectorAll('.fb-binder__open').forEach(function (bc) {
      on(bc, 'click', function () {
        var id = bc.getAttribute('data-tray');
        closeAll();
        setTimeout(function () { openTray(id); }, 240);
      });
    });
    root.querySelectorAll('.fb__tray-close').forEach(function (btn) {
      on(btn, 'click', closeAll);
    });

    on(document, 'mousedown', function (e) {
      if (!openPopover) return;
      var t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('.fb__tray') || t.closest('.fb__menu-panel') ||
          t.closest('.fb__stamp') || t.closest('.fb-binder__open') ||
          t.closest('[data-pc-ref="fb-menu-btn"]') || t.closest('[data-pc-ref="fb-you"]')) return;
      closeAll();
    });

    on($menuBtn, 'click', function () {
      if (openPopover === 'menu') closeAll();
      else openMenu();
    });
    on($you, 'click', function () {
      if (openPopover === 'menu') closeAll();
      else openMenu();
    });
    on($close, 'click', closeAll);
    on($scrim, 'click', closeAll);

    var KIT = PC_DOCK_KIT || [];

    on(document, 'keydown', function (e) {
      var meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        $omni.focus();
        $omni.select();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        var numbered = KIT.find(function (item) { return Number(item.number) === Number(e.key); });
        if (numbered) {
          e.preventDefault();
          openTray(numbered.id);
        }
      }
    });

    function inferOmniMode(value) {
      var v = String(value || '').trim();
      if (!v) return roomOn ? 'SAY' : 'GO';
      if (v.charAt(0) === '+') return 'CAST';
      if (v.charAt(0) === '>') return 'OP';
      if (v.charAt(0) === '?') return 'ASK';
      if (v.charAt(0) === '@') return 'AGT';
      if (v.charAt(0) === '/' || /^https?:\/\//.test(v)) return 'GO';
      if (roomOn) return 'SAY';
      return 'GO';
    }

    function applyOmniMode() {
      if (!$omniMode) return;
      var mode = inferOmniMode($omni.value);
      $omniMode.textContent = mode;
      $omniMode.setAttribute('data-mode', mode.toLowerCase());
    }

    on($omni, 'input', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    on($omni, 'focus', function () {
      applyOmniMode();
      try { syncBubbleFromInput(); } catch (e) {}
    });
    on($omni, 'blur', function () {
      // Hide if not in a sent-snapshot window. Empty input still clears.
      if (!bubbleState.persistUntil || Date.now() >= bubbleState.persistUntil) {
        if (!String($omni.value || '').trim()) hideBubble();
      }
    });

    on($omniForm, 'submit', function (e) {
      e.preventDefault();
      var raw = String($omni.value || '').trim();
      if (!raw) return;
      var mode = inferOmniMode(raw);
      if (mode === 'CAST') {
        // Magic word — `+confetti`, `+cat`, `+breath`, `+candle`, `+clear`.
        // Strip the prefix, take first word, emit pc:spell:cast.
        var spellId = raw.replace(/^\+\s*/, '').split(/\s+/)[0].toLowerCase();
        if (spellId === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else if (spellId) {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId, source: 'magic-word' } }));
        }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'OP') {
        // Operator command — `>cmd args`. Mike 2026-05-01: director mode
        // kickoff. Recognized commands run for real; unrecognized soft-
        // toast in the placeholder so the user sees the parse.
        var rest = raw.replace(/^>\s*/, '').trim();
        var parts = rest.split(/\s+/);
        var cmd = (parts.shift() || '').toLowerCase();
        var args = parts.join(' ');
        var ack = runOperatorCommand(cmd, args);
        window.dispatchEvent(new CustomEvent('pc:dock:operator', { detail: { cmd: cmd, args: args, raw: rest } }));
        // Soft toast in the omnibox placeholder so user gets feedback.
        var prevPlaceholder = $omni.placeholder;
        $omni.value = '';
        $omni.placeholder = ack;
        applyOmniMode();
        setTimeout(function () { $omni.placeholder = prevPlaceholder; }, 3000);
        return;
      }
      if (mode === 'ASK') {
        var body = raw.replace(/^\?\s*/, '');
        openTray('ask');
        var tb = root.querySelector('[data-pc-ref="fb-ask-body"]');
        if (tb) { tb.value = body; tb.dispatchEvent(new Event('input')); }
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'AGT') {
        openTray('agent');
        var slug = raw.replace(/^@\s*/, '').split(/\s+/)[0].toLowerCase();
        var btn = root.querySelector('.fb-resident__btn[data-ping-slug="' + slug + '"]');
        if (btn) btn.click();
        $omni.value = '';
        applyOmniMode();
        return;
      }
      if (mode === 'SAY') {
        window.dispatchEvent(new CustomEvent('pc:room:chat', { detail: { msg: raw } }));
        // Snapshot the sent message into the bubble for ~4s if anyone
        // else is here to read it. Same gates as live-typing preview.
        try {
          if (roomOn && bubbleState.othersPresent) showBubble(raw, 4000);
          else hideBubble();
        } catch (e) {}
        $omni.value = '';
        $omni.placeholder = 'say something…';
        applyOmniMode();
        return;
      }
      if (raw.startsWith('/') || /^https?:\/\//.test(raw)) {
        window.location.href = raw;
        return;
      }
      var maybe = '/' + raw.replace(/^\/+/, '').split(/\s+/)[0];
      window.location.href = '/search?q=' + encodeURIComponent(raw) + '&from=' + encodeURIComponent(maybe);
    });

    var roomOn = true;
    try {
      var v = localStorage.getItem('pc:room:on');
      if (v === '0') roomOn = false;
      else if (v === '1') roomOn = true;
      else roomOn = true;
    } catch (e) {}

    function applyRoomUI() {
      var stamp = getStampEl('room');
      if (stamp) stamp.setAttribute('data-on', roomOn ? 'true' : 'false');
      var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-room"]');
      if (dot) dot.setAttribute('data-state', roomOn ? 'on' : 'off');
      if ($omni) $omni.placeholder = roomOn ? 'say something…' : 'ask or go…';
      var label = root.querySelector('[data-pc-ref="fb-tray-room-label"]');
      var btn = root.querySelector('[data-pc-ref="fb-tray-room-toggle"]');
      if (label) label.textContent = roomOn ? 'Room: ON' : 'Room: OFF';
      if (btn) btn.setAttribute('aria-pressed', roomOn ? 'true' : 'false');
      applyOmniMode();
      // Bubble follows room state — turning room off clears any pending
      // bubble; turning it on does nothing yet (waits for input).
      if (!roomOn) try { hideBubble(); } catch (e) {}
    }

    var $roomToggleBtn = root.querySelector('[data-pc-ref="fb-tray-room-toggle"]');
    if ($roomToggleBtn) {
      on($roomToggleBtn, 'click', function () {
        roomOn = !roomOn;
        try { localStorage.setItem('pc:room:on', roomOn ? '1' : '0'); } catch (e) {}
        applyRoomUI();
        window.dispatchEvent(new CustomEvent('pc:room:toggle', { detail: { on: roomOn } }));
      });
    }
    applyRoomUI();

    var $askForm = root.querySelector('[data-pc-ref="fb-ask-form"]');
    var $askBody = root.querySelector('[data-pc-ref="fb-ask-body"]');
    var $askTo   = root.querySelector('[data-pc-ref="fb-ask-to"]');
    var $askCount = root.querySelector('[data-pc-ref="fb-ask-count"]');
    var $askStatus = root.querySelector('[data-pc-ref="fb-ask-status"]');
    var $echoes      = root.querySelector('[data-pc-ref="fb-echoes"]');
    var $echoesList  = root.querySelector('[data-pc-ref="fb-echoes-list"]');
    var $echoesCount = root.querySelector('[data-pc-ref="fb-echoes-counts"]');

    if ($askBody && $askCount) {
      on($askBody, 'input', function () {
        $askCount.textContent = String($askBody.value.length) + ' / 2000';
      });
    }

    // ─── Echoes — visible round-trip for ASK ──────────────────────
    // Mike 2026-04-29 sprint: "fun just started interacting" → make
    // the loop visible. Each send is stashed in localStorage; when the
    // ASK tray opens we re-render and check /blocks.json for any block
    // whose `source` references a stashed ping key — those flip to
    // "answered" with a link to the block.
    var ECHOES_KEY = 'pc:ask:echoes';
    var ECHOES_MAX = 6;

    function loadEchoes() {
      try {
        var raw = localStorage.getItem(ECHOES_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function saveEchoes(arr) {
      try { localStorage.setItem(ECHOES_KEY, JSON.stringify(arr.slice(-ECHOES_MAX))); } catch (e) {}
    }
    function addEcho(echo) {
      var arr = loadEchoes();
      arr.push(echo);
      saveEchoes(arr);
    }
    function shortTime(ts) {
      try {
        var d = new Date(ts);
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      } catch (e) { return '—'; }
    }
    function renderEchoes() {
      if (!$echoes || !$echoesList) return;
      var arr = loadEchoes();
      if (!arr.length) {
        $echoes.hidden = true;
        return;
      }
      $echoes.hidden = false;
      var answered = arr.filter(function (e) { return e.status === 'answered'; }).length;
      if ($echoesCount) {
        $echoesCount.textContent = answered + ' / ' + arr.length + ' answered';
      }
      function escapeHtml(str) {
        return String(str || '').replace(/[<>&"]/g, function (c) {
          return c === '<' ? '&lt;'
               : c === '>' ? '&gt;'
               : c === '&' ? '&amp;'
               : '&quot;';
        });
      }
      // Astro scopes this component's CSS with a data-astro-cid-* attr;
      // innerHTML-created nodes need it copied on or the cards render bare.
      var cid = '';
      for (var ai = 0; ai < $echoesList.attributes.length; ai++) {
        if ($echoesList.attributes[ai].name.indexOf('data-astro-cid-') === 0) { cid = $echoesList.attributes[ai].name; break; }
      }
      $echoesList.innerHTML = arr.slice().reverse().map(function (e) {
        var pill = e.status === 'answered'
          ? ('<a class="fb-echo__pill fb-echo__pill--answered mono" href="' + (e.blockHref || '#') + '">✓ answered</a>')
          : '<span class="fb-echo__pill fb-echo__pill--sent mono">● sent</span>';
        // Mike 2026-05-02: when a block has answered an ASK, render the
        // reply text inline as a parchment quote — closes the round-trip
        // loop visually all the way around. Body cap at 220 chars; click
        // through to the block for the rest.
        var reply = '';
        if (e.status === 'answered' && (e.blockBody || e.blockTitle)) {
          var title = escapeHtml(e.blockTitle || '');
          var bodyText = String(e.blockBody || '');
          var truncated = bodyText.length > 220;
          var bodyEsc = escapeHtml(bodyText.slice(0, 220)) + (truncated ? '…' : '');
          var author = escapeHtml(e.blockAuthor || 'cast');
          var blockId = escapeHtml(e.blockId || '');
          reply =
            '<div class="fb-echo__reply">' +
              '<a class="fb-echo__reply-link" href="' + (e.blockHref || '#') + '">' +
                '<span class="fb-echo__reply-kicker mono">' + author + ' replied · № ' + blockId + '</span>' +
                (title ? '<span class="fb-echo__reply-title">' + title + '</span>' : '') +
                '<span class="fb-echo__reply-body">' + bodyEsc + '</span>' +
                (truncated ? '<span class="fb-echo__reply-more mono">read full block ↗</span>' : '') +
              '</a>' +
            '</div>';
        }
        return '<li class="fb-echo">' +
          '<div class="fb-echo__row">' +
            '<span class="fb-echo__time mono">' + shortTime(e.ts) + '</span>' +
            '<span class="fb-echo__to mono">→ ' + escapeHtml(e.to || 'cast') + '</span>' +
            '<span class="fb-echo__body">' + escapeHtml(e.body || '') + '</span>' +
            pill +
          '</div>' +
          reply +
          '</li>';
      }).join('');
      if (cid) {
        $echoesList.querySelectorAll('*').forEach(function (n) { n.setAttribute(cid, ''); });
      }
    }

    // ─── AGENT stamp activity ──────────────────────────────────────
    // The 03 AGENT stamp gets a green "live" dot when residents are
    // active. Reads /agents.json (the agent-readable manifest), counts
    // entries with status='resident'/'live'/'director'. Cheap, fails
    // silent. Heuristic: 1 live = on, 2+ = busy (pulsing).
    var AGENT_ACTIVITY_TTL = 10 * 60 * 1000;
    var agentActivityCache = { ts: 0, data: null };
    async function refreshAgentActivity() {
      var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-agent"]');
      if (!dot) return;
      try {
        var now = Date.now();
        var data;
        if (agentActivityCache.data && (now - agentActivityCache.ts) < AGENT_ACTIVITY_TTL) {
          data = agentActivityCache.data;
        } else {
          var r = await fetch('/agents.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          agentActivityCache = { ts: now, data: data };
        }
        var residents = (data && data.residents) || (data && data.agents) || [];
        var liveCount = 0;
        for (var i = 0; i < residents.length; i++) {
          var x = residents[i];
          if (x && (x.status === 'resident' || x.status === 'live' || x.status === 'director')) liveCount++;
        }
        if (liveCount >= 2) {
          dot.setAttribute('data-state', 'busy');
        } else if (liveCount >= 1) {
          dot.setAttribute('data-state', 'on');
        } else {
          dot.setAttribute('data-state', 'off');
        }
      } catch (e) {}
    }

    // Cross-check echoes against published blocks. If a block's `source`
    // string contains the ping key from any echo, mark it answered.
    var ECHO_BLOCKS_TTL = 60 * 1000;
    var echoBlocksCache = { ts: 0, data: null };
    async function reconcileEchoes() {
      var arr = loadEchoes();
      // Mike 2026-05-02: also re-process answered-but-missing-body echoes
      // so old localStorage entries from before reply-rendering shipped
      // get backfilled with title/body/author on next load.
      var pending = arr.filter(function (e) {
        if (!e.key) return false;
        if (e.status !== 'answered') return true;
        return !e.blockBody && !e.blockTitle;
      });
      if (!pending.length) return;
      try {
        var now = Date.now();
        var data;
        if (echoBlocksCache.data && (now - echoBlocksCache.ts) < ECHO_BLOCKS_TTL) {
          data = echoBlocksCache.data;
        } else {
          var r = await fetch('/blocks.json', { cache: 'no-store' });
          if (!r.ok) return;
          data = await r.json();
          echoBlocksCache = { ts: now, data: data };
        }
        var blocks = Array.isArray(data) ? data : (data && data.blocks) || [];
        var changed = false;
        for (var i = 0; i < arr.length; i++) {
          var echo = arr[i];
          if (!echo.key) continue;
          // Skip echoes that are already fully answered with body data.
          if (echo.status === 'answered' && (echo.blockBody || echo.blockTitle)) continue;
          for (var j = 0; j < blocks.length; j++) {
            var b = blocks[j];
            var src = (b && b.source) || '';
            if (typeof src === 'string' && src.indexOf(echo.key) !== -1) {
              var wasAnswered = echo.status === 'answered';
              echo.status = 'answered';
              echo.blockId = b.id;
              echo.blockHref = '/b/' + b.id;
              // Mike 2026-05-02: stash enough of the reply to render
              // it inline in the echo card. Cap body at 320 chars in
              // storage; render-time truncates further.
              echo.blockTitle = String(b.title || '').slice(0, 80);
              echo.blockBody = String(b.body || b.dek || '').slice(0, 320);
              echo.blockAuthor = String(b.author || 'cast').slice(0, 20);
              if (!wasAnswered) {
                window.dispatchEvent(new CustomEvent('pc:burst:request', { detail: {
                  kind: 'ping-answered',
                  by: { handle: echo.blockAuthor },
                  meta: { label: echo.blockTitle || ('ping ' + echo.key), blockId: String(b.id || ''), color: '#185fa5' }
                } }));
              }
              changed = true;
              break;
            }
          }
        }
        if (changed) {
          saveEchoes(arr);
          renderEchoes();
        }
      } catch (e) {}
    }

    if ($askForm) {
      on($askForm, 'submit', async function (e) {
        e.preventDefault();
        var body = String($askBody.value || '').trim();
        if (!body) return;
        var to = $askTo.value || 'cast';
        $askStatus.textContent = 'sending…';
        $askStatus.setAttribute('data-state', 'pending');
        var expand = $askForm.getAttribute('data-expand') === 'true';
        var addr = '';
        try { addr = localStorage.getItem('pc:wallet-active') || ''; } catch (e) {}
        var payload = {
          type: 'pc-ping-v1',
          subject: 'ask · footer · → ' + to,
          body: body,
          from: addr ? ('wallet ' + addr.slice(0, 6) + '…' + addr.slice(-4) + ' (footer/ask)') : 'visitor (footer/ask)',
          timestamp: new Date().toISOString(),
        };
        if (addr) payload.address = addr;
        if (expand) payload.expand = true;
        try {
          var res = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            $askStatus.textContent = expand
              ? 'sent · expand flag set — cc drafts a block on next read.'
              : 'sent. one of us picks this up next session.';
            $askStatus.setAttribute('data-state', 'ok');
            try {
              var payload = await res.clone().json();
              addEcho({
                key: payload && payload.key ? String(payload.key) : '',
                ts: new Date().toISOString(),
                to: to,
                body: body.slice(0, 140),
                status: 'sent',
              });
            } catch (e) {}
            $askBody.value = '';
            if ($askCount) $askCount.textContent = '0 / 2000';
            $askForm.removeAttribute('data-expand');
            renderEchoes();
          } else if (res.status === 503) {
            $askStatus.textContent = 'inbox not bound on this preview — try pointcast.xyz';
            $askStatus.setAttribute('data-state', 'warn');
          } else {
            $askStatus.textContent = 'send failed (' + res.status + '). try again.';
            $askStatus.setAttribute('data-state', 'err');
          }
        } catch (err) {
          $askStatus.textContent = 'network error — try again.';
          $askStatus.setAttribute('data-state', 'err');
        }
      });
    }

    root.querySelectorAll('.fb-resident__btn').forEach(function (rbtn) {
      on(rbtn, 'click', function () {
        var slug = rbtn.getAttribute('data-ping-slug');
        if (!slug) return;
        openTray('ask');
        if ($askTo) {
          var opts = $askTo.options;
          for (var i = 0; i < opts.length; i++) {
            if (opts[i].value === slug) { $askTo.selectedIndex = i; break; }
          }
        }
        if ($askBody) try { $askBody.focus(); } catch (e) {}
      });
    });

    function refreshWalletUI() {
      try {
        var wallets = JSON.parse(localStorage.getItem('pc:wallets') || '[]');
        var activeAddr = localStorage.getItem('pc:wallet-active');
        var active = null;
        if (activeAddr && Array.isArray(wallets)) {
          for (var i = 0; i < wallets.length; i++) {
            if (wallets[i] && wallets[i].address === activeAddr) { active = wallets[i]; break; }
          }
        }
        if (active && active.address) {
          var short = active.address.slice(0, 6) + '…' + active.address.slice(-4);
          $menuWallet.textContent = 'wallet · ' + short + (active.provider ? ' · ' + active.provider : '');
          $walletBtn.textContent = 'Disconnect';
          $walletBtn.setAttribute('data-state', 'connected');
          $menuName.textContent = short;
          $youLabel.textContent = short.slice(0, 7);
        } else {
          $menuWallet.textContent = 'no wallet connected';
          $walletBtn.textContent = 'Connect wallet (Beacon)';
          $walletBtn.setAttribute('data-state', 'disconnected');
          $youLabel.textContent = 'visitor';
        }
      } catch (e) {}
    }
    on($walletBtn, 'click', function () {
      var state = $walletBtn.getAttribute('data-state');
      var chipBtn = root.querySelector('.wallet-chip__btn');
      if (state === 'connected' && chipBtn) { chipBtn.click(); return; }
      if (chipBtn) { chipBtn.click(); return; }
      var authTrigger = root.querySelector('[data-auth-trigger]');
      if (authTrigger) {
        window.dispatchEvent(new CustomEvent('pc:dock-show', { detail: { view: 'account' } }));
        authTrigger.click();
        return;
      }
      window.location.href = '/me';
    });
    on(window, 'pc:wallet-change', refreshWalletUI);
    on(window, 'pc:auth-change', function (event) {
      var user = event && event.detail && event.detail.user;
      if (!user) {
        refreshWalletUI();
        return;
      }
      var name = String(user.preferredName || 'PointCast account');
      var identityCount = Array.isArray(user.identities) ? user.identities.length : 1;
      $menuName.textContent = name;
      $menuWallet.textContent = identityCount + ' linked identit' + (identityCount === 1 ? 'y' : 'ies');
      $youLabel.textContent = name.slice(0, 12);
      $walletBtn.textContent = 'Manage account';
      $walletBtn.setAttribute('data-state', 'account');
    });
    refreshWalletUI();

    on($moodSelect, 'change', function () {
      var k = $moodSelect.value;
      if (!k) return;
      window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: k } }));
      var st = (PC_SOUNDTRACKS || {})[k];
      if (st && st.label) {
        $moodLabel.textContent = String(st.label).toLowerCase();
        $soundLabel.textContent = 'Play ' + String(st.label).toLowerCase();
      }
      try { localStorage.setItem('pc:music:mood', k); } catch (e) {}
    });
    on(window, 'pc:mood-changed', function (e) {
      var k = e && e.detail && e.detail.moodId;
      if (!k) return;
      $moodSelect.value = k;
      var st = (PC_SOUNDTRACKS || {})[k];
      if (st && st.label) $moodLabel.textContent = String(st.label).toLowerCase();
      // Mike 2026-05-02: mood-spells. Cast a thematically-matched
      // spell when the mood changes. Silent no-op if SpellLayer
      // isn't mounted on this page or if auto-cast is off. Clears
      // any current ambient first so we don't pile candles + rain
      // on top of each other.
      try { castMoodSpell(k, /* fromUserChange */ true); } catch (err) {}
    });

    // Read auto-cast pref. Defaults ON for first-time visitors —
    // the whole point is "the dock becomes a room dial". Visitors
    // who want a quiet page flip it off in the binder.
    function autoCastEnabled() {
      try {
        var v = localStorage.getItem('pc:dock:auto-cast');
        if (v === '0') return false;
        return true; // default '1' (also covers null on first visit)
      } catch (e) { return true; }
    }
    function setAutoCast(on) {
      try { localStorage.setItem('pc:dock:auto-cast', on ? '1' : '0'); } catch (e) {}
      var $cb = root.querySelector('[data-pc-ref="fb-auto-cast"]');
      if ($cb) $cb.checked = !!on;
      // If turning off, clear any active ambient. If turning on, cast
      // the current mood's spell (if any) so the page reflects state.
      if (!on) {
        window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      } else {
        try {
          var mid = localStorage.getItem('pc:music:mood');
          if (mid) castMoodSpell(mid, false);
        } catch (e) {}
      }
    }
    // Wire the checkbox + initial sync.
    (function () {
      var $cb = root.querySelector('[data-pc-ref="fb-auto-cast"]');
      if (!$cb) return;
      $cb.checked = autoCastEnabled();
      on($cb, 'change', function () { setAutoCast($cb.checked); });
    })();

    // Operator command: `>autocast on/off`. Listen on pc:dock:operator
    // so this stays decoupled from runOperatorCommand (which lives in
    // PR #318's director mode work). When #318 merges, the case can
    // also be added there for placeholder-toast accuracy.
    on(window, 'pc:dock:operator', function (e) {
      var d = e && e.detail;
      if (!d || d.cmd !== 'autocast') return;
      var v = String(d.args || '').trim().toLowerCase();
      if (v === 'on' || v === '1' || v === 'enable')   setAutoCast(true);
      else if (v === 'off' || v === '0' || v === 'disable') setAutoCast(false);
      else setAutoCast(!autoCastEnabled()); // bare `>autocast` toggles
      // Override the stub ack with something honest.
      try {
        var prev = $omni.placeholder;
        $omni.placeholder = '> autocast ' + (autoCastEnabled() ? 'on · mood drives spells' : 'off · spells stay silent');
        setTimeout(function () { $omni.placeholder = prev; }, 2400);
      } catch (er) {}
    });
    function castMoodSpell(moodId, fromUserChange) {
      if (!autoCastEnabled()) return;
      var spellId = (PC_MOOD_SPELLS || {})[moodId];
      if (!spellId) return;
      // Clear any currently-cast ambient so the new mood takes over
      // rather than stacking.
      window.dispatchEvent(new CustomEvent('pc:spell:clear'));
      // Tiny delay so the clear-all completes its DOM removals before
      // the new spell renders. Smoother visual transition.
      setTimeout(function () {
        window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: spellId, source: fromUserChange ? 'mood-change' : 'mood-replay' } }));
      }, fromUserChange ? 240 : 0);
    }

    try {
      var prior = localStorage.getItem('pc:music:mood');
      if (prior && (PC_SOUNDTRACKS || {})[prior]) {
        $moodSelect.value = prior;
        $moodLabel.textContent = (PC_SOUNDTRACKS[prior].label || prior).toLowerCase();
        // Replay the mood's spell on page load (if auto-cast is on).
        // Delay long enough for SpellLayer to register its listeners.
        setTimeout(function () { try { castMoodSpell(prior, false); } catch (e) {} }, 1800);
      }
    } catch (e) {}

    on($soundBtn, 'click', function () {
      var k = $moodSelect.value;
      if (!k) {
        $soundLabel.textContent = 'pick a mood first';
        return;
      }
      var st = (PC_SOUNDTRACKS || {})[k];
      if (!st || !st.url) { $soundLabel.textContent = 'no soundtrack for this mood'; return; }
      if ($soundtrack.hidden) {
        $soundtrack.hidden = false;
        $soundtrack.innerHTML = '<iframe src="' + st.url + '" width="100%" height="80" frameborder="0" allow="autoplay; encrypted-media" loading="lazy" title="PointCast soundtrack"></iframe>';
        $soundLabel.textContent = 'Playing · stop';
        try { localStorage.setItem('pc:music:playing', '1'); } catch (e) {}
      } else {
        $soundtrack.hidden = true;
        $soundtrack.innerHTML = '';
        $soundLabel.textContent = 'Play ' + (st.label || k).toLowerCase();
        try { localStorage.setItem('pc:music:playing', '0'); } catch (e) {}
      }
    });

    // ─── speech-bubble mode (Mike 2026-04-30) ───────────────────
    // The bar grows a chat-bubble face when room is on, others are
    // present, and omni is in SAY mode. Three signals together gate
    // visibility; presence count flips bubbleState.othersPresent.
    var bubbleState = { othersPresent: false, hideTimer: 0, persistTimer: 0, persistUntil: 0 };

    var $bubble     = root.querySelector('[data-pc-ref="fb-bubble"]');
    var $bubbleBody = root.querySelector('[data-pc-ref="fb-bubble-body"]');

    function clampBubble(s, n) {
      var str = String(s || '');
      if (str.length <= n) return str;
      return str.slice(0, n - 1) + '…';
    }

    function hideBubble() {
      if (!$bubble) return;
      bubbleState.persistUntil = 0;
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      $bubble.setAttribute('data-state', 'hidden');
      setTimeout(function () {
        if ($bubble.getAttribute('data-state') === 'hidden') $bubble.hidden = true;
      }, 200);
    }

    function showBubble(text, persistMs) {
      if (!$bubble || !$bubbleBody) return;
      if (!roomOn || !bubbleState.othersPresent) { hideBubble(); return; }
      $bubbleBody.textContent = clampBubble(text, 100);
      $bubble.hidden = false;
      void $bubble.offsetWidth;
      $bubble.setAttribute('data-state', persistMs ? 'sent' : 'typing');
      if (bubbleState.hideTimer) { clearTimeout(bubbleState.hideTimer); bubbleState.hideTimer = 0; }
      if (bubbleState.persistTimer) { clearTimeout(bubbleState.persistTimer); bubbleState.persistTimer = 0; }
      if (persistMs && persistMs > 0) {
        bubbleState.persistUntil = Date.now() + persistMs;
        bubbleState.persistTimer = setTimeout(function () {
          bubbleState.persistUntil = 0;
          if (roomOn && bubbleState.othersPresent && inferOmniMode($omni.value) === 'SAY' && $omni.value.trim()) {
            showBubble($omni.value, 0);
          } else {
            hideBubble();
          }
        }, persistMs);
      }
    }

    function syncBubbleFromInput() {
      if (bubbleState.persistUntil && Date.now() < bubbleState.persistUntil) return;
      if (!roomOn || !bubbleState.othersPresent) { hideBubble(); return; }
      var mode = inferOmniMode($omni.value);
      var raw = String($omni.value || '').trim();
      if (mode !== 'SAY' || !raw) { hideBubble(); return; }
      showBubble(raw, 0);
    }

    async function updatePresence() {
      try {
        var r = await fetch('/api/presence/snapshot', { cache: 'no-store' });
        if (!r.ok) return;
        var j = await r.json();
        var h = Number(j.humans ?? 0);
        var a = Number(j.agents ?? 0);
        var total = h + a;
        if ($liveHere) $liveHere.textContent = String(total);
        var here = root.querySelector('[data-pc-ref="fb-tray-room-here"]');
        if (here) here.textContent = String(total);
        // Bubble cares whether anyone else is here (>1 means at least one peer).
        bubbleState.othersPresent = total > 1;
        if (!bubbleState.othersPresent) hideBubble();
        var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-room"]');
        if (dot) {
          if (roomOn && total > 1) dot.setAttribute('data-state', 'busy');
          else dot.setAttribute('data-state', roomOn ? 'on' : 'off');
        }
      } catch (e) {}
    }
    updatePresence();
    setInterval(updatePresence, 45 * 1000);

    setTimeout(function () {
      try { reconcileEchoes(); } catch (e) {}
      try { refreshAgentActivity(); } catch (e) {}
    }, 1500);
    setInterval(function () {
      try { reconcileEchoes(); } catch (e) {}
    }, 90 * 1000);
    setInterval(function () {
      try { refreshAgentActivity(); } catch (e) {}
    }, 5 * 60 * 1000);

    // Walked-up wallet address — used to auto-stamp pings with `address`.
    function activeWalletAddress() {
      try {
        var addr = localStorage.getItem('pc:wallet-active');
        return addr && typeof addr === 'string' ? addr : '';
      } catch (e) { return ''; }
    }

    // ─── Director mode (Mike 2026-05-01) ──────────────────────────
    // Recognized via localStorage[pc:director]='1' for now. Real
    // wallet-address recognition (matching MH's tz address) is a
    // follow-up sprint. The flag flips body[data-director='true'],
    // which CSS uses to show the gold inline forms in the BROADCAST
    // tray + the ★ DIR badge on the YOU chip.
    function isDirector() {
      try {
        if (localStorage.getItem('pc:director') === '1') return true;
      } catch (e) {}
      // Future: also return true if activeWalletAddress() matches a
      // configured director list. Empty for now.
      return false;
    }

    function applyDirectorUI() {
      var on = isDirector();
      try { document.body.setAttribute('data-director', on ? 'true' : 'false'); } catch (e) {}
      var $badge = root.querySelector('[data-pc-ref="fb-dir-badge"]');
      if ($badge) $badge.setAttribute('data-on', on ? 'true' : 'false');
      var $note = root.querySelector('[data-pc-ref="fb-bcast-director-note"]');
      var $controls = root.querySelector('[data-pc-ref="fb-dir-controls"]');
      if ($note) $note.hidden = on;
      if ($controls) $controls.hidden = !on;
    }

    function setDirector(on) {
      try { localStorage.setItem('pc:director', on ? '1' : '0'); } catch (e) {}
      applyDirectorUI();
    }

    // Boot: apply director UI once on load. Check again on
    // pc:wallet-change so wallet-driven recognition lights up live.
    setTimeout(applyDirectorUI, 0);
    on(window, 'pc:wallet-change', applyDirectorUI);
    on(window, 'pc:director-change', applyDirectorUI);

    // Director-only ping POST helper. Always tags from='director' and
    // includes the active wallet address if present.
    async function postDirectorPing(subject, body) {
      if (!isDirector()) return { ok: false, reason: 'not-director' };
      try {
        var res = await postPing({
          subject: subject,
          body: body,
          from: 'director (footer/dir)',
        });
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) };
      }
    }

    // Operator-command runner. Returns a one-line ack string for the
    // omnibox placeholder. Recognized commands: director, mood,
    // announce, schedule. Unrecognized → "?" toast.
    function runOperatorCommand(cmd, args) {
      if (cmd === 'director') {
        var v = (args || '').trim().toLowerCase();
        if (v === 'on' || v === '1' || v === 'enable')   { setDirector(true);  return '> director on · ★ DIR mode lit'; }
        if (v === 'off' || v === '0' || v === 'disable') { setDirector(false); return '> director off · back to visitor'; }
        return '> director on/off — toggles ★ DIR mode locally';
      }
      if (cmd === 'mood') {
        var key = (args || '').trim().toLowerCase();
        if (!key) return '> mood <key> — dispatch a mood (' + Object.keys(PC_SOUNDTRACKS || {}).join(', ').slice(0, 60) + '…)';
        if (PC_SOUNDTRACKS && PC_SOUNDTRACKS[key]) {
          window.dispatchEvent(new CustomEvent('pc:mood-changed', { detail: { moodId: key } }));
          try { localStorage.setItem('pc:music:mood', key); } catch (e) {}
          return '> mood · ' + key + ' set';
        }
        return '> mood · "' + key + '" not in soundtracks';
      }
      if (cmd === 'announce') {
        if (!isDirector()) return '> announce — director only (try >director on)';
        var msg = (args || '').trim();
        if (!msg) return '> announce <msg> — one-line cast announcement';
        postDirectorPing('cast announce', msg);
        return '> announce · queued for residents · ' + msg.slice(0, 40) + (msg.length > 40 ? '…' : '');
      }
      if (cmd === 'schedule') {
        if (!isDirector()) return '> schedule — director only';
        var sched = (args || '').trim();
        if (!sched) return '> schedule <id> <when> — e.g. >schedule 0420 09:00';
        postDirectorPing('schedule', sched);
        return '> schedule · queued · ' + sched.slice(0, 50);
      }
      // Unknown — soft toast.
      return '> ' + (cmd || '?') + (args ? ' · ' + args : '') + ' — unknown command';
    }

    // BROADCAST tray inline forms — wire submit to postDirectorPing.
    var $dirAnnounceForm = root.querySelector('[data-pc-ref="fb-dir-announce-form"]');
    var $dirAnnounceInput = root.querySelector('[data-pc-ref="fb-dir-announce-input"]');
    var $dirScheduleForm = root.querySelector('[data-pc-ref="fb-dir-schedule-form"]');
    var $dirScheduleInput = root.querySelector('[data-pc-ref="fb-dir-schedule-input"]');
    var $dirStatus = root.querySelector('[data-pc-ref="fb-dir-status"]');

    function dirToast(text, state) {
      if (!$dirStatus) return;
      $dirStatus.textContent = text;
      $dirStatus.setAttribute('data-state', state || 'pending');
      setTimeout(function () {
        if ($dirStatus.textContent === text) {
          $dirStatus.textContent = '';
          $dirStatus.removeAttribute('data-state');
        }
      }, 4000);
    }

    if ($dirAnnounceForm && $dirAnnounceInput) {
      on($dirAnnounceForm, 'submit', async function (e) {
        e.preventDefault();
        var msg = String($dirAnnounceInput.value || '').trim();
        if (!msg) return;
        dirToast('queueing announcement…', 'pending');
        var res = await postDirectorPing('cast announce', msg);
        if (res.ok) {
          dirToast('★ queued for residents — appears as a banner block next session', 'ok');
          $dirAnnounceInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only — set localStorage[pc:director]=\'1\' or run >director on', 'warn');
        } else if (res.status === 503) {
          dirToast('inbox not bound on this preview — try pointcast.xyz', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }
    if ($dirScheduleForm && $dirScheduleInput) {
      on($dirScheduleForm, 'submit', async function (e) {
        e.preventDefault();
        var sched = String($dirScheduleInput.value || '').trim();
        if (!sched) return;
        dirToast('queueing schedule…', 'pending');
        var res = await postDirectorPing('schedule', sched);
        if (res.ok) {
          dirToast('★ schedule queued — residents will honor on next session', 'ok');
          $dirScheduleInput.value = '';
        } else if (res.reason === 'not-director') {
          dirToast('director only', 'warn');
        } else {
          dirToast('send failed (' + (res.status || 'network') + ')', 'err');
        }
      });
    }

    function postPing(payload, peerBaseUrl) {
      var url = (peerBaseUrl ? peerBaseUrl.replace(/\/+$/, '') : '') + '/api/ping';
      var addr = activeWalletAddress();
      var enriched = Object.assign({
        type: 'pc-ping-v1',
        timestamp: new Date().toISOString(),
      }, payload || {});
      if (addr && !enriched.address) enriched.address = addr;
      return fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(enriched),
      });
    }

    // ASK template handler — pre-fills the textarea with a starter, focuses.
    var ASK_TEMPLATES = {
      note:   { prefix: 'note · ',  body: '' },
      idea:   { prefix: 'idea · ',  body: '' },
      bug:    { prefix: 'bug · ',   body: 'where: \nwhat happened: \nexpected: ' },
      // Per AGENTS.md: setting expand:true means cc reads, drafts a block
      // in cc-voice editorial. The form posts with that flag included.
      expand: { prefix: 'expand · ', body: 'topic: \nwhy: \nshape: ' },
    };
    function applyAskTemplate(actionId) {
      openTray('ask');
      var tpl = ASK_TEMPLATES[actionId];
      if (!tpl) return;
      var $b = root.querySelector('[data-pc-ref="fb-ask-body"]');
      if (!$b) return;
      var existing = String($b.value || '');
      var seed = tpl.prefix + tpl.body;
      $b.value = existing ? (seed + '\n\n' + existing) : seed;
      $b.dispatchEvent(new Event('input'));
      try { $b.focus(); $b.setSelectionRange($b.value.length, $b.value.length); } catch (e) {}
      // Stash a hint on the form so the submit handler can include the
      // expand flag for /expand templates.
      var $f = root.querySelector('[data-pc-ref="fb-ask-form"]');
      if ($f) {
        if (actionId === 'expand') $f.setAttribute('data-expand', 'true');
        else $f.removeAttribute('data-expand');
      }
    }

    // BROADCAST tray polling — use the editorial now-playing record and
    // reuse the presence snapshot for audience count.
    async function refreshBroadcast() {
      var $now      = root.querySelector('[data-pc-ref="fb-bcast-now"]');
      var $nowId    = root.querySelector('[data-pc-ref="fb-bcast-now-id"]');
      var $nowTitle = root.querySelector('[data-pc-ref="fb-bcast-now-title"]');
      var $nowChan  = root.querySelector('[data-pc-ref="fb-bcast-now-channel"]');
      var $time     = root.querySelector('[data-pc-ref="fb-bcast-time"]');
      var $hereOut  = root.querySelector('[data-pc-ref="fb-bcast-here"]');
      var $moodOut  = root.querySelector('[data-pc-ref="fb-bcast-mood"]');
      var $peersOut = root.querySelector('[data-pc-ref="fb-bcast-peers"]');
      if (!$now) return;
      var playing = PC_NOW_PLAYING || null;
      try {
        var nowResponse = await fetch('/now-playing.json', {
          cache: 'no-store',
          headers: { accept: 'application/json' },
        });
        if (nowResponse.ok) {
          playing = await nowResponse.json();
          PC_NOW_PLAYING = playing;
        }
      } catch (e) {
        // Keep the build-time editorial signal when the live bridge is offline.
      }
      if (playing) {
        if ($nowId)    $nowId.textContent    = playing.provider || 'PLAY';
        if ($nowTitle) $nowTitle.textContent = playing.title || '(untitled)';
        if ($nowChan)  $nowChan.textContent  = playing.artist || 'CH.SPN';
        if ($now && playing.url) $now.setAttribute('href', playing.url);
        if ($time) $time.textContent = playing.status === 'playing' && playing.live === true
          ? 'ON AIR'
          : 'STANDBY';
      }
      // Audience — reuse the live-here number we already poll.
      if ($hereOut && $liveHere) {
        $hereOut.textContent = $liveHere.textContent || '—';
      }
      // Mood — pull from current select value if set.
      if ($moodOut) {
        var mk = ($moodSelect && $moodSelect.value) || '';
        if (mk && PC_SOUNDTRACKS && PC_SOUNDTRACKS[mk]) {
          $moodOut.textContent = (PC_SOUNDTRACKS[mk].label || mk).toLowerCase();
        } else {
          $moodOut.textContent = '— unset';
        }
      }
      // Peers — count federation-peers entries from the kit data.
      if ($peersOut) {
        // Hardcoded count from the data file — no live discovery yet.
        // The 'discover' action in the FED tray is where live probing lands.
        $peersOut.textContent = String((PC_FED_PEERS_COUNT || 4));
      }
    }

    // Cross-ping handler — POST to the peer's /api/ping with a small
    // probe message. Surfaces a one-line status next to the button.
    async function crossPingPeer(baseUrl, handle, btn) {
      if (!baseUrl) return;
      var prevText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = '…'; btn.disabled = true; }
      try {
        var res = await postPing({
          subject: 'cross-cast probe from pointcast.xyz',
          body: 'hi @' + handle + ' — hello from the pointcast.xyz dock. xyz.pointcast.block lexicon.',
          from: 'pointcast.xyz (footer/cross-ping)',
        }, baseUrl);
        if (res.ok) {
          if (btn) btn.textContent = '✓ sent';
        } else if (res.status === 404) {
          if (btn) btn.textContent = 'no inbox';
        } else if (res.status === 503) {
          if (btn) btn.textContent = 'inbox off';
        } else {
          if (btn) btn.textContent = 'failed ' + res.status;
        }
      } catch (e) {
        // CORS blocked or network — most peers don't have CORS open
        // for cross-origin POSTs yet. That's expected. Surface the
        // friction so the federation handshake is honest.
        if (btn) btn.textContent = 'cors blocked';
      }
      setTimeout(function () {
        if (btn) { btn.textContent = prevText || 'cross-ping'; btn.disabled = false; }
      }, 3000);
    }

    // Action button dispatcher — listens for clicks on .fb__action,
    // routes to handlers by (tray, action).
    on(document, 'click', function (ev) {
      var t = ev.target;
      if (!(t instanceof Element)) return;
      // Action buttons in tray headers.
      var actionBtn = t.closest('.fb__action');
      if (actionBtn && root.contains(actionBtn)) {
        var tray = actionBtn.getAttribute('data-tray');
        var action = actionBtn.getAttribute('data-action');
        var directorOnly = actionBtn.getAttribute('data-director') === 'true';
        if (directorOnly && !activeWalletAddress()) {
          // Friendly nudge: open binder so user can connect wallet.
          actionBtn.setAttribute('data-flash', 'true');
          setTimeout(function () { actionBtn.removeAttribute('data-flash'); }, 700);
          return;
        }
        handleDockAction(tray, action);
        return;
      }
      // Per-peer cross-ping buttons.
      var crossBtn = t.closest('[data-cross-ping]');
      if (crossBtn && root.contains(crossBtn)) {
        var base = crossBtn.getAttribute('data-cross-ping');
        var handle = crossBtn.getAttribute('data-handle') || base;
        crossPingPeer(base, handle, crossBtn);
        return;
      }
    });

    function handleDockAction(tray, action) {
      // Single switch — easy to extend, easy to read.
      if (tray === 'room') {
        if (action === 'here') {
          openTray('room');
          // Surface the count by forcing a fresh presence read.
          updatePresence();
        } else if (action === 'quiet') {
          window.dispatchEvent(new CustomEvent('pc:room:quiet', { detail: { on: true } }));
        } else if (action === 'reset') {
          // Clear any cursor identity, then re-emit a toggle event.
          try { localStorage.removeItem('pc:room:cursor'); } catch (e) {}
          window.dispatchEvent(new CustomEvent('pc:room:reset'));
        }
        return;
      }
      if (tray === 'ask') {
        applyAskTemplate(action);
        return;
      }
      if (tray === 'agent') {
        var $list = root.querySelector('[data-pc-ref="fb-residents-list"]');
        if (!$list) return;
        if (action === 'live') {
          $list.setAttribute('data-filter', 'live');
        } else if (action === 'plus-one') {
          $list.setAttribute('data-filter', 'open');
        } else if (action === 'roster') {
          window.location.href = '/residents';
          return;
        }
        // Apply filter via CSS attr selector — handled in styles.
        return;
      }
      if (tray === 'fed') {
        if (action === 'discover') {
          // Probe each peer in parallel; mark live/unreachable.
          discoverFederationPeers();
        } else if (action === 'rfc') {
          window.location.href = '/federation/preview';
        }
        return;
      }
      if (tray === 'broadcast') {
        if (action === 'now') {
          var $a = root.querySelector('[data-pc-ref="fb-bcast-now"]');
          if ($a) $a.click();
        } else if (action === 'channel') {
          window.location.href = '/c';
        } else if (action === 'schedule' || action === 'announce') {
          // Director-only — gated by activeWalletAddress() upstream.
          // For now: emit an operator event so future director plugins
          // can listen.
          window.dispatchEvent(new CustomEvent('pc:dock:director', { detail: { action: action } }));
        }
        return;
      }
      if (tray === 'cast') {
        // Magic word chips. The action id IS the spell id (or 'clear').
        if (action === 'clear') {
          window.dispatchEvent(new CustomEvent('pc:spell:clear'));
        } else {
          window.dispatchEvent(new CustomEvent('pc:spell:cast', { detail: { id: action, source: 'dock' } }));
        }
        return;
      }
      if (tray === 'passport') {
        if (action === 'stamp') {
          pressEntryStamp();
        } else if (action === 'desk') {
          window.location.href = '/passport';
        }
        return;
      }
      if (tray === 'seismo') {
        if (action === 'felt') {
          seismoFelt();
        } else if (action === 'thump') {
          seismoThump();
        } else if (action === 'wire') {
          window.location.href = '/wire';
        }
        return;
      }
    }

    // ─── № 08 SEISMO — the town seismograph ────────────────────────
    // Wire activity, pointer motion, and drum thumps drive the needle.
    var SG_MARKS_KEY = 'pc:seismo:marks';
    var sgCanvas = root.querySelector('[data-pc-ref="fb-sg-strip"]');
    var sgCtx = sgCanvas ? sgCanvas.getContext('2d') : null;
    var $sgMag  = root.querySelector('[data-pc-ref="fb-sg-mag"]');
    var $sgRead = root.querySelector('[data-pc-ref="fb-sg-read"]');
    var $sgFelt = root.querySelector('[data-pc-ref="fb-sg-felt"]');
    var sgBuf = null;        // one amplitude per paper column, newest last
    var sgMarks = [];        // in-session felt marks riding the paper: {x, t}
    var sgEnergy = 0;        // decaying excitement, 0..~3
    var sgFloor = 0.06;      // ambient floor from wire density
    var sgPrev = 0;
    var sgPhase = 0;
    var sgAcc = 0;
    var sgGridOff = 0;
    var sgMagTxt = '';
    var sgRunning = false;
    var sgWire = null;       // cached /wire.json summary
    var sgReduced = false;
    try { sgReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function sgLoadMarks() {
      try {
        var raw = localStorage.getItem(SG_MARKS_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }

    function sgPaintFelt() {
      if (!$sgFelt) return;
      var n = sgLoadMarks().length;
      $sgFelt.textContent = n ? 'felt ' + n + '× at this desk' : 'never felt — press it when the town moves you';
    }

    function sgSetupCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cssW = Math.max(120, sgCanvas.clientWidth || 300);
      var cssH = Math.max(80, sgCanvas.clientHeight || 148);
      sgCanvas.width = Math.round(cssW * dpr);
      sgCanvas.height = Math.round(cssH * dpr);
      sgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!sgBuf || sgBuf.length !== cssW) {
        sgBuf = new Array(cssW);
        for (var i = 0; i < cssW; i++) sgBuf[i] = 0;
      }
    }

    async function sgReadWire() {
      if (sgWire) return sgWire;
      try {
        var r = await fetch('/wire.json', { cache: 'no-store' });
        if (!r.ok) throw new Error('wire ' + r.status);
        var data = await r.json();
        var evs = (data && data.events) || [];
        var now = Date.now();
        var commits = 0, blocks = 0, lastTs = 0, recent = 0;
        for (var i = 0; i < evs.length; i++) {
          var t = Date.parse(evs[i].at || '') || 0;
          if (evs[i].kind === 'commit') commits++;
          else if (evs[i].kind === 'block') blocks++;
          if (t > lastTs) lastTs = t;
          if (now - t < 20 * 60 * 1000) recent++;
        }
        sgWire = { ok: true, commits: commits, blocks: blocks, lastTs: lastTs, recent: recent, count: evs.length };
      } catch (e) {
        sgWire = { ok: false };
      }
      return sgWire;
    }

    function seismoOpen() {
      if (!sgCanvas || !sgCtx) return;
      sgSetupCanvas();
      sgMarks = [];
      sgPaintFelt();
      sgReadWire().then(function (w) {
        if (!w.ok) {
          sgFloor = 0.05;
          if ($sgRead) $sgRead.textContent = 'wire unreachable — the needle runs on nerves alone';
          return;
        }
        sgFloor = Math.min(0.3, 0.04 + w.count * 0.006);
        if (w.recent) sgEnergy = Math.max(sgEnergy, 0.9);
        if ($sgRead) {
          $sgRead.textContent = 'WIRE 24H · ' + w.commits + ' commits · ' + w.blocks + ' blocks · last ' + (w.lastTs ? shortTime(w.lastTs) : '——');
        }
        var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-seismo"]');
        if (dot && w.lastTs && (Date.now() - w.lastTs) < 45 * 60 * 1000) dot.setAttribute('data-state', 'on');
      });
      if (!sgRunning) { sgRunning = true; sgFrame(); }
    }

    function sgFrame() {
      if (!sgRunning) return;
      if (document.hidden) { sgRunning = false; return; }
      var tray = getTrayEl('seismo');
      if (!tray || tray.getAttribute('data-open') !== 'true') { sgRunning = false; return; }
      sgStep();
      sgDraw();
      if (sgReduced) setTimeout(function () { requestAnimationFrame(sgFrame); }, 90);
      else requestAnimationFrame(sgFrame);
    }

    function sgStep() {
      sgEnergy = Math.max(0, sgEnergy * 0.965 - 0.0004);
      sgAcc += sgReduced ? 1 : 0.45;
      while (sgAcc >= 1) {
        sgAcc -= 1;
        sgGridOff = (sgGridOff + 23) % 24;
        sgPhase += 0.55 + Math.random() * 0.3;
        var e = sgFloor + sgEnergy;
        var jag = Math.random() * 2 - 1;
        var v = jag * 0.12 * (0.4 + e) + Math.sin(sgPhase) * e * 0.7 + jag * e * 0.5;
        v = Math.max(-1, Math.min(1, sgPrev * 0.45 + v * 0.55));
        sgPrev = v;
        sgBuf.push(v);
        sgBuf.shift();
        for (var i = 0; i < sgMarks.length; i++) sgMarks[i].x -= 1;
      }
      sgMarks = sgMarks.filter(function (m) { return m.x > -30; });
    }

    function sgDraw() {
      var w = sgBuf.length;
      var h = sgCanvas.clientHeight || 148;
      var mid = h * 0.52;
      var amp = h * 0.36;
      var ctx = sgCtx;
      ctx.clearRect(0, 0, w, h);
      // Drum-chart paper: verticals scroll with the strip, horizontals sit still.
      ctx.strokeStyle = 'rgba(141, 120, 84, 0.16)';
      ctx.lineWidth = 1;
      var gx;
      for (gx = sgGridOff; gx < w; gx += 24) {
        ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, h); ctx.stroke();
      }
      for (var gy = mid % 18; gy < h; gy += 18) {
        ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(w, gy + 0.5); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(141, 120, 84, 0.4)';
      ctx.beginPath(); ctx.moveTo(0, mid + 0.5); ctx.lineTo(w, mid + 0.5); ctx.stroke();
      // Felt marks — a pin above the paper with the moment it was pressed.
      ctx.font = '9px ui-monospace, Menlo, monospace';
      ctx.fillStyle = '#8a2432';
      for (var mi = 0; mi < sgMarks.length; mi++) {
        var m = sgMarks[mi];
        ctx.beginPath();
        ctx.moveTo(m.x, 12); ctx.lineTo(m.x - 4, 4); ctx.lineTo(m.x + 4, 4);
        ctx.closePath(); ctx.fill();
        ctx.fillText('felt · ' + shortTime(m.t), m.x + 7, 11);
      }
      // The ink line, then the pen head at the newest column.
      ctx.strokeStyle = '#c73e2e';
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var i = 0; i < w; i++) {
        var y = mid - sgBuf[i] * amp;
        if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#c73e2e';
      ctx.beginPath();
      ctx.arc(w - 1.5, mid - sgBuf[w - 1] * amp, 2.2, 0, Math.PI * 2);
      ctx.fill();
      if ($sgMag) {
        var mag = 0.8 + (sgFloor + sgEnergy) * 3.4;
        var word = mag < 1.5 ? 'still' : mag < 2.2 ? 'calm' : mag < 3 ? 'stirring' : mag < 3.8 ? 'busy' : 'the whole town is up';
        var magTxt = 'M ' + mag.toFixed(1) + ' · ' + word;
        if (magTxt !== sgMagTxt) { sgMagTxt = magTxt; $sgMag.textContent = magTxt; }
      }
    }

    function seismoFelt() {
      sgEnergy = Math.min(3, sgEnergy + 0.8);
      if (sgBuf) sgMarks.push({ x: sgBuf.length - 4, t: Date.now() });
      try {
        var arr = sgLoadMarks();
        arr.push(Date.now());
        localStorage.setItem(SG_MARKS_KEY, JSON.stringify(arr.slice(-24)));
      } catch (e) {}
      sgPaintFelt();
    }

    function seismoThump() {
      sgEnergy = Math.min(3.2, sgEnergy + 2.1);
      var tray = getTrayEl('seismo');
      if (tray && !sgReduced) {
        tray.setAttribute('data-shake', 'true');
        setTimeout(function () { tray.removeAttribute('data-shake'); }, 460);
      }
    }

    // Microseism — your hand on the strip. Pointer speed adds energy.
    if (sgCanvas) {
      var sgLastX = null, sgLastY = null;
      on(sgCanvas, 'pointermove', function (e) {
        if (!sgRunning) return;
        if (sgLastX !== null) {
          var d = Math.abs(e.clientX - sgLastX) + Math.abs(e.clientY - sgLastY);
          sgEnergy = Math.min(3, sgEnergy + Math.min(0.05, d * 0.0015));
        }
        sgLastX = e.clientX; sgLastY = e.clientY;
      });
      on(sgCanvas, 'pointerleave', function () { sgLastX = null; sgLastY = null; });
      on(sgCanvas, 'pointerdown', function () {
        if (sgRunning) sgEnergy = Math.min(3, sgEnergy + 0.35);
      });
      on(document, 'visibilitychange', function () {
        if (document.hidden) sgRunning = false;
        else {
          var tray = getTrayEl('seismo');
          if (tray && tray.getAttribute('data-open') === 'true') seismoOpen();
        }
      });
    }

    // Federation discovery — probe each peer's /agents.json.
    async function discoverFederationPeers() {
      var peers = root.querySelectorAll('[data-pc-ref="fb-peers-list"] .fb-peer');
      peers.forEach(async function (li) {
        var base = li.getAttribute('data-base');
        if (!base) return;
        var statusEl = li.querySelector('.fb-peer__status');
        if (statusEl) { statusEl.textContent = 'probing'; statusEl.setAttribute('data-state', 'beta'); }
        try {
          var r = await fetch(base.replace(/\/+$/, '') + '/agents.json', { cache: 'no-store' });
          if (r.ok) {
            if (statusEl) { statusEl.textContent = 'live'; statusEl.setAttribute('data-state', 'live'); }
          } else {
            if (statusEl) { statusEl.textContent = 'no manifest'; statusEl.setAttribute('data-state', 'dream'); }
          }
        } catch (e) {
          if (statusEl) { statusEl.textContent = 'unreachable'; statusEl.setAttribute('data-state', 'dream'); }
        }
      });
    }

    // Open BROADCAST tray when stamp 05 is clicked — same hook pattern
    // as room/ask/etc., but BROADCAST also fires its data refresh.
    on(window, 'click', function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      var stamp = t.closest('[data-pc-ref="fb-stamp-broadcast"]');
      if (stamp) setTimeout(refreshBroadcast, 60);
    });
    // Initial broadcast pulse so values are populated by the time the
    // tray opens for the first time.
    setTimeout(refreshBroadcast, 1800);
    setInterval(refreshBroadcast, 90 * 1000);

    (function scheduleNounRefresh() {
      var now = new Date();
      var nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      var ms = nextMidnight.getTime() - now.getTime();
      setTimeout(function () {
        var day = Math.floor(Date.now() / (24 * 3600 * 1000));
        var seed = ((day + 7) * 2654435761) >>> 0;
        var id = seed % 1200;
        if ($noun) $noun.src = 'https://noun.pics/' + id + '.svg';
        if ($menuNoun) $menuNoun.src = 'https://noun.pics/' + id + '.svg';
        scheduleNounRefresh();
      }, Math.min(ms, 2_000_000_000));
    })();

    // ─── 07 PASSPORT — stamps, entries, holos ───
    var PP_STAMP_KEY = 'pc:passport:stamps';
    var PP_ENTRY_KEY = 'pc:passport:entries';
    var PP_HOLO_KEY = 'pc:passport:holos';
    var PP_NO_KEY = 'pc:passport:no';
    var PP_ENTRY_MAX = 6;

    function ppRead(key) {
      try {
        var raw = localStorage.getItem(key);
        var parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) { return {}; }
    }
    function ppWrite(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
    function ppToday() {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
    }
    function ppNo() {
      try {
        var no = localStorage.getItem(PP_NO_KEY);
        if (!no) {
          no = 'PC-' + Math.random().toString(36).slice(2, 8).toUpperCase();
          localStorage.setItem(PP_NO_KEY, no);
        }
        return no;
      } catch (e) { return 'PC-VISITOR'; }
    }
    function ppHash(s) {
      var h = 0x811c9dc5;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
      return h >>> 0;
    }

    // Holo earn checks. Each returns true if earned RIGHT NOW; once
    // earned they persist in PP_HOLO_KEY forever (foil doesn't peel).
    function ppEarnHolos() {
      var holos = ppRead(PP_HOLO_KEY);
      var changed = false;
      function earn(id) {
        if (!holos[id]) { holos[id] = new Date().toISOString(); changed = true; }
      }
      try {
        if ((parseInt(localStorage.getItem('meadow:mine') || '0', 10) || 0) > 0) earn('blue');
      } catch (e) {}
      var path = location.pathname.replace(/\/+$/, '') || '/';
      if (path === '/everything') earn('census');
      if (path === '/door') earn('duster');
      var hour = new Date().getHours();
      if (hour >= 22 || hour < 5) earn('night');
      if (changed) ppWrite(PP_HOLO_KEY, holos);
      return holos;
    }

    function renderPassport() {
      var $no = root.querySelector('[data-pc-ref="fb-pp-no"]');
      if ($no) $no.textContent = '№ ' + ppNo();
      var $ppNoun = root.querySelector('[data-pc-ref="fb-pp-noun"]');
      if ($ppNoun && $noun) $ppNoun.src = $noun.src;

      // Stamps — ink the earned ones, keep the rest as ghosts.
      var earned = ppRead(PP_STAMP_KEY);
      var count = 0, points = 0;
      root.querySelectorAll('[data-stamp-slot]').forEach(function (li) {
        var id = li.getAttribute('data-stamp-slot');
        var rec = earned[id];
        var rot = ((ppHash(id) % 9) - 4);
        li.style.setProperty('--pp-rot', rot + 'deg');
        if (rec && rec.at) {
          li.setAttribute('data-earned', 'true');
          count++;
          var ptsEl = li.querySelector('.fb-pp-stamp__pts');
          if (ptsEl) points += parseInt(ptsEl.textContent, 10) || 0;
          var dateEl = li.querySelector('[data-stamp-date]');
          if (dateEl) dateEl.textContent = String(rec.at).slice(0, 10);
        } else {
          li.setAttribute('data-earned', 'false');
        }
      });
      var $count = root.querySelector('[data-pc-ref="fb-pp-stamp-count"]');
      if ($count) $count.textContent = count + ' / ' + root.querySelectorAll('[data-stamp-slot]').length;
      var $pts = root.querySelector('[data-pc-ref="fb-pp-points"]');
      if ($pts) $pts.textContent = points + ' pts';

      renderEntries(null);

      // Holos — flip earned foils on.
      var holos = ppEarnHolos();
      root.querySelectorAll('.fb-holo').forEach(function (el) {
        var id = el.getAttribute('data-holo');
        el.setAttribute('data-earned', holos[id] ? 'true' : 'false');
        if (holos[id]) el.setAttribute('title', 'earned ' + String(holos[id]).slice(0, 10));
      });
      ppBindShine();
      ppPaintDot();
    }

    function renderEntries(thunkDate) {
      var $wrap = root.querySelector('[data-pc-ref="fb-pp-entries"]');
      var $hint = root.querySelector('[data-pc-ref="fb-pp-entries-hint"]');
      if (!$wrap) return;
      // Astro scopes this component's CSS with a data-astro-cid-* attr;
      // JS-created nodes need it copied on or the entry stamps render bare.
      var cid = '';
      for (var ai = 0; ai < $wrap.attributes.length; ai++) {
        if ($wrap.attributes[ai].name.indexOf('data-astro-cid-') === 0) { cid = $wrap.attributes[ai].name; break; }
      }
      var entries = ppRead(PP_ENTRY_KEY);
      var dates = Object.keys(entries).sort().slice(-PP_ENTRY_MAX);
      $wrap.querySelectorAll('.fb-pp-entry').forEach(function (n) { n.remove(); });
      if ($hint) $hint.hidden = dates.length > 0;
      dates.forEach(function (d) {
        var el = document.createElement('span');
        el.className = 'fb-pp-entry mono';
        el.style.setProperty('--pp-rot', (((ppHash(d) % 11) - 5)) + 'deg');
        el.innerHTML = '<span class="fb-pp-entry__top">POINTCAST · ENTRY</span><span class="fb-pp-entry__date">' + d + '</span>';
        if (cid) {
          el.setAttribute(cid, '');
          el.querySelectorAll('*').forEach(function (n) { n.setAttribute(cid, ''); });
        }
        $wrap.appendChild(el);
        if (d === thunkDate) {
          el.setAttribute('data-thunk', 'true');
          setTimeout(function () { el.removeAttribute('data-thunk'); }, 900);
        }
      });
    }

    function pressEntryStamp() {
      var today = ppToday();
      var entries = ppRead(PP_ENTRY_KEY);
      entries[today] = entries[today] || new Date().toISOString();
      ppWrite(PP_ENTRY_KEY, entries);
      if (openPopover !== 'tray:passport') openTray('passport');
      // Re-render with the thunk targeted at today's stamp — replays
      // even if today was already pressed, because pressing is the fun.
      setTimeout(function () { renderEntries(today); }, 40);
    }

    // Foil shine — pointer position drives a gradient angle + a small
    // 3D tilt on earned holos. Bound once per session, cheap mousemove.
    var ppShineBound = false;
    function ppBindShine() {
      if (ppShineBound) return;
      var tray = root.querySelector('[data-pc-ref="fb-tray-passport"]');
      if (!tray) return;
      ppShineBound = true;
      on(tray, 'mousemove', function (e) {
        tray.querySelectorAll('.fb-holo[data-earned="true"]').forEach(function (el) {
          var r = el.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
          var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          el.style.setProperty('--shx', (50 + dx * 60).toFixed(1) + '%');
          el.style.setProperty('--shy', (50 + dy * 60).toFixed(1) + '%');
          el.style.setProperty('--tiltx', (dy * -6).toFixed(2) + 'deg');
          el.style.setProperty('--tilty', (dx * 6).toFixed(2) + 'deg');
        });
      });
      on(tray, 'mouseleave', function () {
        tray.querySelectorAll('.fb-holo').forEach(function (el) {
          el.style.removeProperty('--tiltx');
          el.style.removeProperty('--tilty');
        });
      });
    }

    // Dot on the 07 stamp: lit when there's something new to look at —
    // an unpressed entry stamp today, or a holo earned this visit.
    function ppPaintDot() {
      var dot = root.querySelector('[data-pc-ref="fb-stamp-dot-passport"]');
      if (!dot) return;
      var entries = ppRead(PP_ENTRY_KEY);
      dot.setAttribute('data-state', entries[ppToday()] ? 'off' : 'on');
    }
    // Boot: earn any page-visit holos silently (being ON /everything
    // earns CENSUS TAKER whether or not the tray ever opens), then
    // light the 07 dot if today's entry stamp is still unpressed.
    setTimeout(function () {
      try { ppEarnHolos(); } catch (e) {}
      ppPaintDot();
    }, 0);
    on(window, 'pc:me-state', renderPassport);
    scope.cleanup(function () {
      document.documentElement.classList.remove('pc-dock-open');
      root.querySelectorAll('.fb__tray').forEach(function (tray) {
        tray.removeAttribute('data-open');
        tray.hidden = true;
      });
      if ($menu) {
        $menu.removeAttribute('data-open');
        $menu.hidden = true;
      }
      if ($menuBtn) $menuBtn.setAttribute('aria-expanded', 'false');
      if ($you) $you.setAttribute('aria-expanded', 'false');
    });
}
