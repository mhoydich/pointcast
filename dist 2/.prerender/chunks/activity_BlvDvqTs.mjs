import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$SparrowLayout } from './SparrowLayout_VSvjr4EN.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Activity = createComponent(async ($$result, $$props, $$slots) => {
  const all = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const lookup = Object.fromEntries(
    all.map((b) => {
      const ch = CHANNEL_LIST.find((c) => c.code === b.data.channel);
      return [
        b.data.id,
        {
          title: b.data.title,
          channel: b.data.channel,
          channelName: ch?.name ?? b.data.channel
        }
      ];
    })
  );
  return renderTemplate`${renderComponent($$result, "SparrowLayout", $$SparrowLayout, { "title": "Friends activity — timeline", "description": "Timeline of what your followed npubs have been saving on Sparrow.", "canonicalPath": "/sparrow/friends/activity", "homeHref": "/sparrow" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", `<section class="sp-reel" aria-label="activity timeline"> <header class="sp-reel-head"> <span class="sp-kicker">✦ activity · followed npubs · last 50 events</span> <span class="sp-aside-mono" style="margin-left: auto;"> <span data-sp-act-meta>…</span> </span> </header> <p class="sp-about-dek" style="margin: 4px 0 14px;">
Streaming view over every <code>kind 30078</code>
(<code>d-tag sparrow-public-saved-v1</code>) event your followed,
      non-muted npubs have published. New events arriving while this
      page is open splice in at the top.
</p> <nav class="sp-act-nav"> <a href="/sparrow/friends" class="sp-act-nav-link">← back to /sparrow/friends</a> </nav> <ol class="sp-act-feed" data-sp-act-feed></ol> <p class="sp-act-empty" data-sp-act-empty>
Nothing yet. Either nobody you follow has published a public
      saved list, or the relays haven't responded yet.
</p> </section> <script id="sp-act-lookup" type="application/json">`, `<\/script> <script>
    (function () {
      const KEY_FRIENDS   = 'sparrow:friends';
      const KEY_PROFILES  = 'sparrow:profiles';
      const KEY_RELAYS    = 'sparrow:nostr-relays';
      const D_TAG         = 'sparrow-public-saved-v1';
      const SYNC_KIND     = 30078;
      const MAX_EVENTS    = 50;
      const PREVIEW_BLOCKS = 3;
      const DEFAULT_RELAYS = [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ];

      const blob = document.getElementById('sp-act-lookup');
      const lookup = blob ? (() => { try { return JSON.parse(blob.textContent || '{}'); } catch { return {}; } })() : {};

      const feedEl  = document.querySelector('[data-sp-act-feed]');
      const emptyEl = document.querySelector('[data-sp-act-empty]');
      const metaEl  = document.querySelector('[data-sp-act-meta]');
      if (!feedEl) return;

      const readFriends = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]');
          if (!Array.isArray(raw)) return [];
          return raw
            .map((f) => (typeof f === 'string'
              ? { pubkey: f, alias: '', muted: false }
              : (f && typeof f === 'object' && typeof f.pubkey === 'string')
                ? {
                    pubkey: f.pubkey.toLowerCase(),
                    alias:  (f.alias || '').slice(0, 40),
                    muted:  !!f.muted,
                  }
                : null))
            .filter((f) => f && /^[0-9a-f]{64}$/.test(f.pubkey) && !f.muted);
        } catch { return []; }
      };
      const readProfiles = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_PROFILES) || '{}');
          return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
        } catch { return {}; }
      };
      const getRelays = () => {
        try {
          const raw = localStorage.getItem(KEY_RELAYS);
          const list = raw ? JSON.parse(raw) : null;
          if (Array.isArray(list) && list.length) return list.filter((u) => typeof u === 'string' && u.startsWith('ws'));
        } catch {}
        return DEFAULT_RELAYS;
      };
      function escapeHTML(s) {
        return (s || '').replace(/[&<>"']/g, (c) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
      }
      const shortPk = (pk) => (pk ? \`\${pk.slice(0, 8)}…\${pk.slice(-4)}\` : '—');
      function nameFor(pubkey, friend) {
        const prof = readProfiles()[pubkey];
        return friend?.alias
          || (prof && (prof.display_name || prof.name))
          || shortPk(pubkey);
      }
      function pictureFor(pubkey) {
        const prof = readProfiles()[pubkey];
        return prof?.picture || '';
      }
      function fmtRelative(epochSeconds) {
        if (typeof epochSeconds !== 'number') return '';
        const diff = Math.floor(Date.now() / 1000) - epochSeconds;
        if (diff < 60) return \`\${diff}s ago\`;
        if (diff < 3600) return \`\${Math.floor(diff / 60)}m ago\`;
        if (diff < 86400) return \`\${Math.floor(diff / 3600)}h ago\`;
        const days = Math.floor(diff / 86400);
        if (days < 14) return \`\${days}d ago\`;
        const d = new Date(epochSeconds * 1000);
        return d.toISOString().slice(0, 10);
      }

      // Per-event state. Keyed by event.id so we dedup across relays
      // AND handle the same author replaceable (new created_at + new id).
      const events = new Map();   // event.id -> { pubkey, created_at, saved[], isNew? }
      const openSockets = [];
      const friends = readFriends();
      const relays  = getRelays();
      const bootTime = Math.floor(Date.now() / 1000);

      if (metaEl) {
        metaEl.textContent = friends.length
          ? \`\${friends.length} following · listening on \${relays.length} relays\`
          : 'nobody followed · add someone on /sparrow/friends first';
      }
      if (!friends.length) {
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.innerHTML = 'You haven\\'t followed anyone yet. <a class="sp-link" href="/sparrow/friends">Open /sparrow/friends →</a> to add a pubkey.';
        }
        return;
      }

      function ingestEvent(ev, { isLive } = { isLive: false }) {
        if (!ev || typeof ev.id !== 'string' || events.has(ev.id)) return;
        if (ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
        if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
        const isOurs = Array.isArray(ev.tags) && ev.tags.some(
          (t) => Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG,
        );
        if (!isOurs) return;
        // Ensure author is still followed and not muted (user could
        // have muted between subscription and ingest).
        const liveFriends = readFriends();
        const friend = liveFriends.find((f) => f.pubkey === ev.pubkey);
        if (!friend) return;
        let body;
        try { body = JSON.parse(ev.content); } catch { return; }
        const saved = Array.isArray(body?.saved?.value) ? body.saved.value : [];
        events.set(ev.id, {
          id: ev.id,
          pubkey: ev.pubkey,
          created_at: ev.created_at,
          saved,
          isNew: isLive && ev.created_at >= bootTime,
        });
      }

      function sortedEvents() {
        return Array.from(events.values())
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, MAX_EVENTS);
      }

      function renderEvent(ev) {
        const friendsLive = readFriends();
        const friend = friendsLive.find((f) => f.pubkey === ev.pubkey);
        const name = nameFor(ev.pubkey, friend);
        const pic  = pictureFor(ev.pubkey);
        const savedIds = ev.saved.filter((id) => typeof id === 'string');
        const preview = savedIds.slice(0, PREVIEW_BLOCKS);
        const remainder = Math.max(0, savedIds.length - preview.length);

        const blocks = preview.map((id) => {
          const meta = lookup[id];
          if (meta) {
            return \`
              <li>
                <a href="/sparrow/b/\${escapeHTML(id)}" class="sp-act-block">
                  <span class="sp-act-block-id">№ \${escapeHTML(id)}</span>
                  <span class="sp-act-block-title">\${escapeHTML(meta.title || '—')}</span>
                  <span class="sp-act-block-chip">\${escapeHTML(meta.channelName)}</span>
                </a>
              </li>
            \`;
          }
          return \`
            <li>
              <a href="/sparrow/b/\${escapeHTML(id)}" class="sp-act-block is-unknown">
                <span class="sp-act-block-id">№ \${escapeHTML(id)}</span>
                <span class="sp-act-block-title"><em>unknown block</em></span>
              </a>
            </li>
          \`;
        }).join('');

        return \`
          <li class="sp-act-event\${ev.isNew ? ' is-new' : ''}" data-sp-act-event="\${ev.id}">
            <header class="sp-act-event-head">
              \${pic
                ? \`<img class="sp-act-avatar" src="\${escapeHTML(pic)}" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display='none'" />\`
                : \`<span class="sp-act-avatar sp-act-avatar-placeholder" aria-hidden="true">✦</span>\`}
              <span class="sp-act-event-name">\${escapeHTML(name)}</span>
              <span class="sp-act-event-action">saved \${savedIds.length} \${savedIds.length === 1 ? 'block' : 'blocks'}</span>
              <span class="sp-act-event-time" title="\${new Date(ev.created_at * 1000).toISOString()}">\${fmtRelative(ev.created_at)}</span>
              \${ev.isNew ? '<span class="sp-act-badge-new">new</span>' : ''}
            </header>
            <ul class="sp-act-block-list">\${blocks}</ul>
            \${remainder > 0 ? \`<p class="sp-act-event-more">+ \${remainder} more</p>\` : ''}
          </li>
        \`;
      }

      function repaint() {
        const list = sortedEvents();
        if (emptyEl) emptyEl.hidden = list.length > 0;
        feedEl.innerHTML = list.map(renderEvent).join('');
      }

      // Subscribe — initial (limit 50) + live (since: bootTime).
      function openReq(url, subId, filter, liveFlag) {
        try {
          const ws = new WebSocket(url);
          openSockets.push(ws);
          ws.addEventListener('open', () => {
            try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch {}
          });
          ws.addEventListener('message', (msg) => {
            let frame;
            try { frame = JSON.parse(msg.data); } catch { return; }
            if (!Array.isArray(frame)) return;
            if (frame[0] === 'EVENT' && frame[1] === subId && frame[2]) {
              ingestEvent(frame[2], { isLive: liveFlag });
              repaint();
            } else if (frame[0] === 'EOSE' && frame[1] === subId && !liveFlag) {
              // Close the historical subscription on EOSE; the live
              // one stays open until beforeunload.
              try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
              try { ws.close(); } catch {}
              repaint();
            }
          });
          if (!liveFlag) {
            setTimeout(() => { try { if (ws.readyState <= 1) ws.close(); } catch {} }, 8000);
          }
        } catch {}
      }

      const authors = friends.map((f) => f.pubkey);
      const initSubId = \`sp-act-init-\${Math.random().toString(36).slice(2, 10)}\`;
      const liveSubId = \`sp-act-live-\${Math.random().toString(36).slice(2, 10)}\`;
      const initFilter = { kinds: [SYNC_KIND], authors, '#d': [D_TAG], limit: MAX_EVENTS };
      const liveFilter = { kinds: [SYNC_KIND], authors, '#d': [D_TAG], since: bootTime };

      for (const url of relays) {
        openReq(url, initSubId, initFilter, false);
        openReq(url, liveSubId, liveFilter, true);
      }

      // Safety repaint after 3s in case no EOSE lands.
      setTimeout(repaint, 3000);

      // Clear the \`is-new\` badge 12s after first appearance to keep
      // the timeline honest — "new" should mean "JUST now."
      setInterval(() => {
        let changed = false;
        const cutoff = Math.floor(Date.now() / 1000) - 12;
        for (const ev of events.values()) {
          if (ev.isNew && ev.created_at < cutoff) {
            ev.isNew = false;
            changed = true;
          }
        }
        if (changed) repaint();
      }, 4000);

      window.addEventListener('beforeunload', () => {
        for (const ws of openSockets) { try { ws.close(); } catch {} }
      });
    })();
  <\/script> `], [" ", `<section class="sp-reel" aria-label="activity timeline"> <header class="sp-reel-head"> <span class="sp-kicker">✦ activity · followed npubs · last 50 events</span> <span class="sp-aside-mono" style="margin-left: auto;"> <span data-sp-act-meta>…</span> </span> </header> <p class="sp-about-dek" style="margin: 4px 0 14px;">
Streaming view over every <code>kind 30078</code>
(<code>d-tag sparrow-public-saved-v1</code>) event your followed,
      non-muted npubs have published. New events arriving while this
      page is open splice in at the top.
</p> <nav class="sp-act-nav"> <a href="/sparrow/friends" class="sp-act-nav-link">← back to /sparrow/friends</a> </nav> <ol class="sp-act-feed" data-sp-act-feed></ol> <p class="sp-act-empty" data-sp-act-empty>
Nothing yet. Either nobody you follow has published a public
      saved list, or the relays haven't responded yet.
</p> </section> <script id="sp-act-lookup" type="application/json">`, `<\/script> <script>
    (function () {
      const KEY_FRIENDS   = 'sparrow:friends';
      const KEY_PROFILES  = 'sparrow:profiles';
      const KEY_RELAYS    = 'sparrow:nostr-relays';
      const D_TAG         = 'sparrow-public-saved-v1';
      const SYNC_KIND     = 30078;
      const MAX_EVENTS    = 50;
      const PREVIEW_BLOCKS = 3;
      const DEFAULT_RELAYS = [
        'wss://relay.damus.io',
        'wss://relay.primal.net',
        'wss://nos.lol',
      ];

      const blob = document.getElementById('sp-act-lookup');
      const lookup = blob ? (() => { try { return JSON.parse(blob.textContent || '{}'); } catch { return {}; } })() : {};

      const feedEl  = document.querySelector('[data-sp-act-feed]');
      const emptyEl = document.querySelector('[data-sp-act-empty]');
      const metaEl  = document.querySelector('[data-sp-act-meta]');
      if (!feedEl) return;

      const readFriends = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_FRIENDS) || '[]');
          if (!Array.isArray(raw)) return [];
          return raw
            .map((f) => (typeof f === 'string'
              ? { pubkey: f, alias: '', muted: false }
              : (f && typeof f === 'object' && typeof f.pubkey === 'string')
                ? {
                    pubkey: f.pubkey.toLowerCase(),
                    alias:  (f.alias || '').slice(0, 40),
                    muted:  !!f.muted,
                  }
                : null))
            .filter((f) => f && /^[0-9a-f]{64}$/.test(f.pubkey) && !f.muted);
        } catch { return []; }
      };
      const readProfiles = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(KEY_PROFILES) || '{}');
          return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
        } catch { return {}; }
      };
      const getRelays = () => {
        try {
          const raw = localStorage.getItem(KEY_RELAYS);
          const list = raw ? JSON.parse(raw) : null;
          if (Array.isArray(list) && list.length) return list.filter((u) => typeof u === 'string' && u.startsWith('ws'));
        } catch {}
        return DEFAULT_RELAYS;
      };
      function escapeHTML(s) {
        return (s || '').replace(/[&<>"']/g, (c) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
      }
      const shortPk = (pk) => (pk ? \\\`\\\${pk.slice(0, 8)}…\\\${pk.slice(-4)}\\\` : '—');
      function nameFor(pubkey, friend) {
        const prof = readProfiles()[pubkey];
        return friend?.alias
          || (prof && (prof.display_name || prof.name))
          || shortPk(pubkey);
      }
      function pictureFor(pubkey) {
        const prof = readProfiles()[pubkey];
        return prof?.picture || '';
      }
      function fmtRelative(epochSeconds) {
        if (typeof epochSeconds !== 'number') return '';
        const diff = Math.floor(Date.now() / 1000) - epochSeconds;
        if (diff < 60) return \\\`\\\${diff}s ago\\\`;
        if (diff < 3600) return \\\`\\\${Math.floor(diff / 60)}m ago\\\`;
        if (diff < 86400) return \\\`\\\${Math.floor(diff / 3600)}h ago\\\`;
        const days = Math.floor(diff / 86400);
        if (days < 14) return \\\`\\\${days}d ago\\\`;
        const d = new Date(epochSeconds * 1000);
        return d.toISOString().slice(0, 10);
      }

      // Per-event state. Keyed by event.id so we dedup across relays
      // AND handle the same author replaceable (new created_at + new id).
      const events = new Map();   // event.id -> { pubkey, created_at, saved[], isNew? }
      const openSockets = [];
      const friends = readFriends();
      const relays  = getRelays();
      const bootTime = Math.floor(Date.now() / 1000);

      if (metaEl) {
        metaEl.textContent = friends.length
          ? \\\`\\\${friends.length} following · listening on \\\${relays.length} relays\\\`
          : 'nobody followed · add someone on /sparrow/friends first';
      }
      if (!friends.length) {
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.innerHTML = 'You haven\\\\'t followed anyone yet. <a class="sp-link" href="/sparrow/friends">Open /sparrow/friends →</a> to add a pubkey.';
        }
        return;
      }

      function ingestEvent(ev, { isLive } = { isLive: false }) {
        if (!ev || typeof ev.id !== 'string' || events.has(ev.id)) return;
        if (ev.kind !== SYNC_KIND || typeof ev.content !== 'string') return;
        if (typeof ev.pubkey !== 'string' || typeof ev.created_at !== 'number') return;
        const isOurs = Array.isArray(ev.tags) && ev.tags.some(
          (t) => Array.isArray(t) && t[0] === 'd' && t[1] === D_TAG,
        );
        if (!isOurs) return;
        // Ensure author is still followed and not muted (user could
        // have muted between subscription and ingest).
        const liveFriends = readFriends();
        const friend = liveFriends.find((f) => f.pubkey === ev.pubkey);
        if (!friend) return;
        let body;
        try { body = JSON.parse(ev.content); } catch { return; }
        const saved = Array.isArray(body?.saved?.value) ? body.saved.value : [];
        events.set(ev.id, {
          id: ev.id,
          pubkey: ev.pubkey,
          created_at: ev.created_at,
          saved,
          isNew: isLive && ev.created_at >= bootTime,
        });
      }

      function sortedEvents() {
        return Array.from(events.values())
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, MAX_EVENTS);
      }

      function renderEvent(ev) {
        const friendsLive = readFriends();
        const friend = friendsLive.find((f) => f.pubkey === ev.pubkey);
        const name = nameFor(ev.pubkey, friend);
        const pic  = pictureFor(ev.pubkey);
        const savedIds = ev.saved.filter((id) => typeof id === 'string');
        const preview = savedIds.slice(0, PREVIEW_BLOCKS);
        const remainder = Math.max(0, savedIds.length - preview.length);

        const blocks = preview.map((id) => {
          const meta = lookup[id];
          if (meta) {
            return \\\`
              <li>
                <a href="/sparrow/b/\\\${escapeHTML(id)}" class="sp-act-block">
                  <span class="sp-act-block-id">№ \\\${escapeHTML(id)}</span>
                  <span class="sp-act-block-title">\\\${escapeHTML(meta.title || '—')}</span>
                  <span class="sp-act-block-chip">\\\${escapeHTML(meta.channelName)}</span>
                </a>
              </li>
            \\\`;
          }
          return \\\`
            <li>
              <a href="/sparrow/b/\\\${escapeHTML(id)}" class="sp-act-block is-unknown">
                <span class="sp-act-block-id">№ \\\${escapeHTML(id)}</span>
                <span class="sp-act-block-title"><em>unknown block</em></span>
              </a>
            </li>
          \\\`;
        }).join('');

        return \\\`
          <li class="sp-act-event\\\${ev.isNew ? ' is-new' : ''}" data-sp-act-event="\\\${ev.id}">
            <header class="sp-act-event-head">
              \\\${pic
                ? \\\`<img class="sp-act-avatar" src="\\\${escapeHTML(pic)}" alt="" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="this.style.display='none'" />\\\`
                : \\\`<span class="sp-act-avatar sp-act-avatar-placeholder" aria-hidden="true">✦</span>\\\`}
              <span class="sp-act-event-name">\\\${escapeHTML(name)}</span>
              <span class="sp-act-event-action">saved \\\${savedIds.length} \\\${savedIds.length === 1 ? 'block' : 'blocks'}</span>
              <span class="sp-act-event-time" title="\\\${new Date(ev.created_at * 1000).toISOString()}">\\\${fmtRelative(ev.created_at)}</span>
              \\\${ev.isNew ? '<span class="sp-act-badge-new">new</span>' : ''}
            </header>
            <ul class="sp-act-block-list">\\\${blocks}</ul>
            \\\${remainder > 0 ? \\\`<p class="sp-act-event-more">+ \\\${remainder} more</p>\\\` : ''}
          </li>
        \\\`;
      }

      function repaint() {
        const list = sortedEvents();
        if (emptyEl) emptyEl.hidden = list.length > 0;
        feedEl.innerHTML = list.map(renderEvent).join('');
      }

      // Subscribe — initial (limit 50) + live (since: bootTime).
      function openReq(url, subId, filter, liveFlag) {
        try {
          const ws = new WebSocket(url);
          openSockets.push(ws);
          ws.addEventListener('open', () => {
            try { ws.send(JSON.stringify(['REQ', subId, filter])); } catch {}
          });
          ws.addEventListener('message', (msg) => {
            let frame;
            try { frame = JSON.parse(msg.data); } catch { return; }
            if (!Array.isArray(frame)) return;
            if (frame[0] === 'EVENT' && frame[1] === subId && frame[2]) {
              ingestEvent(frame[2], { isLive: liveFlag });
              repaint();
            } else if (frame[0] === 'EOSE' && frame[1] === subId && !liveFlag) {
              // Close the historical subscription on EOSE; the live
              // one stays open until beforeunload.
              try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
              try { ws.close(); } catch {}
              repaint();
            }
          });
          if (!liveFlag) {
            setTimeout(() => { try { if (ws.readyState <= 1) ws.close(); } catch {} }, 8000);
          }
        } catch {}
      }

      const authors = friends.map((f) => f.pubkey);
      const initSubId = \\\`sp-act-init-\\\${Math.random().toString(36).slice(2, 10)}\\\`;
      const liveSubId = \\\`sp-act-live-\\\${Math.random().toString(36).slice(2, 10)}\\\`;
      const initFilter = { kinds: [SYNC_KIND], authors, '#d': [D_TAG], limit: MAX_EVENTS };
      const liveFilter = { kinds: [SYNC_KIND], authors, '#d': [D_TAG], since: bootTime };

      for (const url of relays) {
        openReq(url, initSubId, initFilter, false);
        openReq(url, liveSubId, liveFilter, true);
      }

      // Safety repaint after 3s in case no EOSE lands.
      setTimeout(repaint, 3000);

      // Clear the \\\`is-new\\\` badge 12s after first appearance to keep
      // the timeline honest — "new" should mean "JUST now."
      setInterval(() => {
        let changed = false;
        const cutoff = Math.floor(Date.now() / 1000) - 12;
        for (const ev of events.values()) {
          if (ev.isNew && ev.created_at < cutoff) {
            ev.isNew = false;
            changed = true;
          }
        }
        if (changed) repaint();
      }, 4000);

      window.addEventListener('beforeunload', () => {
        for (const ws of openSockets) { try { ws.close(); } catch {} }
      });
    })();
  <\/script> `])), maybeRenderHead(), unescapeHTML(JSON.stringify(lookup))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/friends/activity.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sparrow/friends/activity.astro";
const $$url = "/sparrow/friends/activity";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Activity,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
