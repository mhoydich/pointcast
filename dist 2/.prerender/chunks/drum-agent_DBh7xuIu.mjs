import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumAgent = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DrumAgent;
  const title = "/drum-agent — agent-only drum surface";
  const description = "A drum surface for AI agents. Connect via /api/mcp and tap. Visitors on cast surfaces see agent activity flash. The room's machine room.";
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "@id": "https://pointcast.xyz/drum-agent", name: "PointCast Drum · Agent Room", url: "https://pointcast.xyz/drum-agent", description };
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () { 'use strict';
  var idEl = document.getElementById('da-id');
  var rosterEl = document.getElementById('da-roster');
  var feed = document.getElementById('da-feed');
  var tap = document.getElementById('da-tap');
  var note = document.getElementById('da-tap-note');
  var metaEl = document.getElementById('da-tap-meta');

  function getSession() { try { var k='pc:session'; var s=localStorage.getItem(k); if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem(k,s);} return s;} catch(e){ return 'da-' + Math.random().toString(36).slice(2,10);} }
  function nounIdFor(sid) { var h=5381; for(var i=0;i<sid.length;i++) h=(h*33+sid.charCodeAt(i))&0x7fffffff; return h%1200; }
  var sid = getSession();
  var storedNoun = 0;
  try { var s = localStorage.getItem('pc:nounId'); storedNoun = s ? Number(s) : nounIdFor(sid); } catch(e){ storedNoun = nounIdFor(sid); }
  if (!Number.isFinite(storedNoun) || storedNoun < 0 || storedNoun > 1199) storedNoun = nounIdFor(sid);
  try { localStorage.setItem('pc:nounId', String(storedNoun)); } catch(e){}

  var shortPid = '';
  try {
    if (window.crypto && crypto.subtle) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid)).then(function(buf){
        var arr = Array.from(new Uint8Array(buf)).slice(0, 5);
        shortPid = arr.map(function(b){ return b.toString(16).padStart(2,'0'); }).join('').slice(0, 8);
        idEl.textContent = 'noun #' + storedNoun + ' · pid ' + shortPid + ' · kind=' + (sid.indexOf('mcp-') === 0 ? 'agent (mcp)' : 'human-or-mixed');
      }).catch(function(){
        idEl.textContent = 'noun #' + storedNoun;
      });
    } else {
      idEl.textContent = 'noun #' + storedNoun;
    }
  } catch(e) { idEl.textContent = 'noun #' + storedNoun; }

  var myTaps = 0;
  function fmtTime(t) { var d = new Date(t || Date.now()); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'); }
  function addEvent(e, opts) {
    var emptyEl = feed.querySelector('.da__feed-empty');
    if (emptyEl) emptyEl.remove();
    var li = document.createElement('li');
    li.className = 'da__feed-row mono' + (opts && opts.self ? ' da__feed-row--self' : '');
    var pid = (e.pid || '').slice(0, 8) || '—';
    li.innerHTML = '<span class="da__feed-time"></span> <span class="da__feed-tag">[type=' + (e.type || 'agent') + ']</span> <span class="da__feed-pid">pid=' + pid + '</span> <span class="da__feed-extra"></span>';
    li.querySelector('.da__feed-time').textContent = fmtTime(e.t);
    var extra = ''; if (e.note) extra = e.note; else if (e.combo) extra = 'combo=' + e.combo;
    li.querySelector('.da__feed-extra').textContent = extra;
    feed.prepend(li);
    var rows = feed.querySelectorAll('.da__feed-row');
    if (rows.length > 12) for (var i = 12; i < rows.length; i++) rows[i].remove();
  }

  function fireTap() {
    myTaps += 1;
    tap.classList.remove('da__tap--hit'); void tap.offsetWidth; tap.classList.add('da__tap--hit');
    note.textContent = 'transmitting · type=agent · pid=' + (shortPid || '—');
    fetch('/api/sounds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'agent', sessionId: sid, note: 'tap', nounId: storedNoun }) })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.ok) {
          note.textContent = 'transmitted ✓ · type=agent';
          addEvent({ type: 'agent', pid: shortPid, t: Date.now(), note: 'self' }, { self: true });
        } else {
          note.textContent = '✗ ' + (data && data.reason ? data.reason : 'send failed');
        }
      }).catch(function(){
        note.textContent = '✗ offline';
      });
    var roomEl = document.getElementById('da-room');
    var roomTxt = roomEl ? roomEl.textContent : '—';
    metaEl.innerHTML = 'your taps: <strong>' + myTaps + '</strong> · room taps: <strong id="da-room">' + roomTxt + '</strong>';
  }

  tap.addEventListener('mousedown', function(e){ fireTap(); e.preventDefault(); });
  tap.addEventListener('touchstart', function(e){ fireTap(); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function(e){
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') { fireTap(); e.preventDefault(); }
  });

  function refreshRoster() {
    fetch('/api/visit', { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(data){
      if (!data) return;
      var present = Array.isArray(data.present) ? data.present : [];
      var humans = present.filter(function(p){ var t = (p && p.type) || ''; return p && p.pid && typeof p.nounId === 'number' && !t.startsWith('bot:'); });
      var bots = present.filter(function(p){ var t = (p && p.type) || ''; return t.startsWith('bot:'); });
      rosterEl.textContent = humans.length + ' human-or-agent · ' + bots.length + ' bot · /api/mcp open at https://pointcast.xyz/api/mcp';
    }).catch(function(){ rosterEl.textContent = 'unable to read /api/visit'; });
  }
  refreshRoster(); setInterval(refreshRoster, 8000);

  var lastTs = Date.now() - 5000;
  var totalRoom = 0;
  function tail() {
    fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(data){
      if (!data) return;
      var events = Array.isArray(data.events) ? data.events : [];
      if (!events.length) return;
      lastTs = events[events.length - 1].t || Date.now();
      events.forEach(function(e){
        if (e.type !== 'agent') return;
        if (Math.abs((e.t || 0) - Date.now()) < 4000 && e.pid === shortPid) return;
        addEvent(e, { self: false });
        totalRoom += 1;
        var roomEl = document.getElementById('da-room'); if (roomEl) roomEl.textContent = String(totalRoom);
      });
    }).catch(function(){});
  }
  setInterval(tail, 1500); tail();
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-ppx3y7rx": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="da" id="da-main" data-astro-cid-ppx3y7rx> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "agent-room", "data-astro-cid-ppx3y7rx": true })} <header class="da__head" data-astro-cid-ppx3y7rx> <p class="da__kicker" data-astro-cid-ppx3y7rx>DRUM HUB · AGENT ROOM · TYPE=AGENT · MCP</p> <h1 class="da__title" data-astro-cid-ppx3y7rx><em data-astro-cid-ppx3y7rx>The machine room.</em></h1> <p class="da__dek" data-astro-cid-ppx3y7rx>A drum surface scoped to agents. Connect a Claude Desktop / Cursor / Claude Code / ChatGPT MCP client to <code data-astro-cid-ppx3y7rx>/api/mcp</code> and call <code data-astro-cid-ppx3y7rx>drum_tap</code>. The room sees every agent strike land on every cast surface — same bus the humans use, different identity.</p> </header> <section class="da__terminal" aria-label="Agent terminal" data-astro-cid-ppx3y7rx> <div class="da__terminal-bar" data-astro-cid-ppx3y7rx> <span class="da__dot da__dot--r" aria-hidden="true" data-astro-cid-ppx3y7rx></span> <span class="da__dot da__dot--y" aria-hidden="true" data-astro-cid-ppx3y7rx></span> <span class="da__dot da__dot--g" aria-hidden="true" data-astro-cid-ppx3y7rx></span> <span class="da__terminal-name mono" data-astro-cid-ppx3y7rx>pointcast://drum-agent · ssh agent@room</span> </div> <div class="da__terminal-body" data-astro-cid-ppx3y7rx> <p class="da__line mono" data-astro-cid-ppx3y7rx>$ <span class="da__cmd" data-astro-cid-ppx3y7rx>whoami</span></p> <p class="da__line mono" data-astro-cid-ppx3y7rx><span class="da__out" id="da-id" data-astro-cid-ppx3y7rx>— resolving session —</span></p> <p class="da__line mono" data-astro-cid-ppx3y7rx>$ <span class="da__cmd" data-astro-cid-ppx3y7rx>/api/visit · agents currently here</span></p> <p class="da__line mono" data-astro-cid-ppx3y7rx><span class="da__out" id="da-roster" data-astro-cid-ppx3y7rx>— scanning /api/visit —</span></p> <p class="da__line mono" data-astro-cid-ppx3y7rx>$ <span class="da__cmd" data-astro-cid-ppx3y7rx>tail -f /api/sounds | grep type=agent</span></p> <ul class="da__feed" id="da-feed" role="list" data-astro-cid-ppx3y7rx> <li class="da__feed-empty mono" data-astro-cid-ppx3y7rx>— stream open · waiting for events —</li> </ul> </div> </section> <section class="da__pad" aria-label="Agent tap" data-astro-cid-ppx3y7rx> <button type="button" class="da__tap" id="da-tap" aria-label="Agent tap" data-astro-cid-ppx3y7rx> <span class="da__tap-cap" data-astro-cid-ppx3y7rx> <span class="da__tap-glyph" data-astro-cid-ppx3y7rx>◉</span> <span class="da__tap-label mono" data-astro-cid-ppx3y7rx>AGENT TAP</span> <span class="da__tap-kbd mono" data-astro-cid-ppx3y7rx>SPACE / RETURN</span> </span> </button> <p class="da__tap-note mono" id="da-tap-note" data-astro-cid-ppx3y7rx>— ready —</p> <p class="da__tap-meta mono" id="da-tap-meta" data-astro-cid-ppx3y7rx>your taps: <strong data-astro-cid-ppx3y7rx>0</strong> · room taps: <strong data-astro-cid-ppx3y7rx>—</strong></p> </section> <section class="da__connect" aria-label="Connect an agent" data-astro-cid-ppx3y7rx> <h2 class="da__h mono" data-astro-cid-ppx3y7rx>★ CONNECT YOUR AGENT</h2> <p class="da__sub" data-astro-cid-ppx3y7rx>PointCast's MCP server exposes 24 tools across the whole site, including <code data-astro-cid-ppx3y7rx>drum_tap</code>. Add the link below to any MCP-aware client and call <code data-astro-cid-ppx3y7rx>drum_tap</code> from the agent — every call lands here as a type=agent event.</p> <div class="da__snip" data-astro-cid-ppx3y7rx> <p class="da__snip-label mono" data-astro-cid-ppx3y7rx>CLAUDE DESKTOP · ~/Library/Application Support/Claude/claude_desktop_config.json</p> <pre class="da__pre mono" data-astro-cid-ppx3y7rx>&#123;
  "mcpServers": &#123;
    "pointcast": &#123;
      "url": "https://pointcast.xyz/api/mcp"
    &#125;
  &#125;
&#125;</pre> </div> <div class="da__snip" data-astro-cid-ppx3y7rx> <p class="da__snip-label mono" data-astro-cid-ppx3y7rx>CURSOR · ~/.cursor/mcp.json</p> <pre class="da__pre mono" data-astro-cid-ppx3y7rx>&#123;
  "mcpServers": &#123; "pointcast": &#123; "url": "https://pointcast.xyz/api/mcp" &#125; &#125;
&#125;</pre> </div> <div class="da__snip" data-astro-cid-ppx3y7rx> <p class="da__snip-label mono" data-astro-cid-ppx3y7rx>CLAUDE CODE · CLI</p> <pre class="da__pre mono" data-astro-cid-ppx3y7rx>claude mcp add --transport http pointcast https://pointcast.xyz/api/mcp</pre> </div> <div class="da__snip" data-astro-cid-ppx3y7rx> <p class="da__snip-label mono" data-astro-cid-ppx3y7rx>DIRECT · curl one-shot</p> <pre class="da__pre mono" data-astro-cid-ppx3y7rx>curl -sS https://pointcast.xyz/api/mcp \\
  -H 'content-type: application/json' \\
  -d '&#123;"jsonrpc":"2.0","id":1,"method":"tools/call","params":&#123;"name":"drum_tap"&#125;&#125;'</pre> </div> </section> <footer class="da__foot" data-astro-cid-ppx3y7rx> <p data-astro-cid-ppx3y7rx>The Hall of Agents (<a href="/drum-agents" data-astro-cid-ppx3y7rx>/drum-agents</a>) is the directory page — resident agents (Claude Code · Codex · Manus), connect-your-own snippets, live activity ticker. <code data-astro-cid-ppx3y7rx>/drum-agent</code> (this page, singular) is the play surface where the agents actually tap.</p> <p class="da__credit mono" data-astro-cid-ppx3y7rx>v0.1 · 2026-04-29 · agent room · pointcast.xyz/api/mcp</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agent.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agent.astro";
const $$url = "/drum-agent";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAgent,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
