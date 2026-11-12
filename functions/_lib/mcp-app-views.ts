/**
 * MCP App views: the three PointCast apps that open as screens inside Claude
 * (and any other host that speaks MCP Apps).
 *
 * Each app is one `open_*` tool plus one `ui://` resource. The tool's _meta
 * links the resource (`ui.resourceUri`) and marks the tool as a global entry
 * point (`openai/ui.entrypoints`), so Claude can list the app on its
 * Artifacts page and people can open it without asking for it.
 * Docs: https://claude.com/docs/connectors/building/mcp-apps/entry-points
 *
 * Rules the docs set for an entry-point tool, kept here:
 * - every input optional; the view starts useful with `{}`
 * - a `title` of 60 characters or fewer
 * - a `name` with no "__", "..", "._" or "_."
 * - `_meta.ui.visibility` left out, so Claude can call the tool
 *
 * The views load the MCP Apps SDK from unpkg (declared in the resource's CSP)
 * and talk to this server only through the host (callServerTool). They embed
 * no PointCast page, so pointcast.xyz keeps its X-Frame-Options.
 */

export const APP_VIEW_MIME = 'text/html;profile=mcp-app';
const SDK = 'https://unpkg.com/@modelcontextprotocol/ext-apps@1.7.5/dist/src/app-with-deps.js';

export const APP_VIEW_URIS = {
  drum: 'ui://pointcast/drum',
  battler: 'ui://pointcast/nouns-battler',
  keyboard: 'ui://pointcast/keyboard-bloom',
} as const;

function toolMeta(uri: string) {
  return {
    ui: { resourceUri: uri },
    'ui/resourceUri': uri,
    'openai/ui': { entrypoints: [{ type: 'global' }] },
  };
}

export const APP_VIEW_TOOL_DEFINITIONS = [
  {
    name: 'open_drum',
    title: 'PointCast Drum',
    description:
      'Open the PointCast Drum as an app: the town-wide drum count, the track playing in the drum room, and a drum to tap that every visitor hears. Takes no arguments.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    _meta: toolMeta(APP_VIEW_URIS.drum),
  },
  {
    name: 'open_nouns_battler',
    title: 'Nouns Nation Battler',
    description:
      'Open Nouns Nation Battler as an app: runs a free, reproducible 12v12 exhibition and plays back the replay. Optional seed (uint32) picks the match; without one a fresh match runs. Nothing is saved or paid.',
    inputSchema: {
      type: 'object',
      properties: { seed: { type: 'integer', minimum: 0, maximum: 4294967295, description: 'Optional match seed. Omit for a fresh match.' } },
      additionalProperties: false,
    },
    _meta: toolMeta(APP_VIEW_URIS.battler),
  },
  {
    name: 'open_keyboard_bloom',
    title: 'Keyboard Bloom',
    description:
      'Open Keyboard Bloom as an app: a pentatonic keyboard that plays in the view, the town keyboard count and today\'s key, and a button that sends a played phrase to the town keyboard. Takes no arguments.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    _meta: toolMeta(APP_VIEW_URIS.keyboard),
  },
];

export const APP_VIEW_TOOL_NAMES = APP_VIEW_TOOL_DEFINITIONS.map((tool) => tool.name);

export const APP_VIEW_RESOURCES = [
  { uri: APP_VIEW_URIS.drum, name: 'PointCast Drum view', description: 'MCP App view for open_drum.', mimeType: APP_VIEW_MIME },
  { uri: APP_VIEW_URIS.battler, name: 'Nouns Nation Battler view', description: 'MCP App view for open_nouns_battler.', mimeType: APP_VIEW_MIME },
  { uri: APP_VIEW_URIS.keyboard, name: 'Keyboard Bloom view', description: 'MCP App view for open_keyboard_bloom.', mimeType: APP_VIEW_MIME },
];

// ── Shared shell ──────────────────────────────────────────────────────
const STYLE = `
:root { color-scheme: light dark; --bg: #fbfaf5; --fg: #1d1b16; --muted: #6b665a; --line: #e2ddcf; --accent: #d9480f; --card: #ffffff; }
@media (prefers-color-scheme: dark) { :root { --bg: #16150f; --fg: #f1ede2; --muted: #a39d8e; --line: #34312a; --accent: #ff7a3d; --card: #1f1d17; } }
* { box-sizing: border-box; }
body { margin: 0; padding: 16px; font: 15px/1.45 system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); }
h1 { font-size: 20px; margin: 0 0 2px; }
.sub { color: var(--muted); margin: 0 0 14px; font-size: 13px; }
.stats { display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 14px; }
.stat { flex: 1 1 140px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
.stat b { display: block; font-size: 22px; font-variant-numeric: tabular-nums; }
.stat span { color: var(--muted); font-size: 12px; }
button { font: inherit; border: 1px solid var(--line); background: var(--card); color: var(--fg); border-radius: 10px; padding: 8px 14px; cursor: pointer; }
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
button:disabled { opacity: .5; cursor: default; }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.note { color: var(--muted); font-size: 12px; margin-top: 10px; min-height: 1em; }
`;

function page(title: string, body: string, script: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${title}</title>
<style>${STYLE}</style></head>
<body>
${body}
<script type="module">
import { App } from "${SDK}";
const $ = (id) => document.getElementById(id);
const app = new App({ name: ${JSON.stringify(title)}, version: "1.0.0" }, { availableDisplayModes: ["inline", "fullscreen"] });
const say = (t) => { $("note").textContent = t || ""; };
async function openSite(url) {
  try { const r = await app.openLink({ url }); if (r?.isError) say(url); } catch { say(url); }
}
let ctx = null;
const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
${script}
await app.connect();
</script>
</body></html>`;
}

// ── Drum ──────────────────────────────────────────────────────────────
const DRUM_HTML = page(
  'PointCast Drum',
  `<h1>PointCast Drum</h1>
<p class="sub">One drum for the whole town. Every tap here is heard in the drum rooms.</p>
<div class="stats">
  <div class="stat"><b id="total">…</b><span>taps since the room opened</span></div>
  <div class="stat"><b id="mine">0</b><span>your taps this visit</span></div>
</div>
<div class="row" style="margin-bottom:14px">
  <button id="drum" class="primary" style="width:120px;height:120px;border-radius:60px;font-size:18px">Tap</button>
  <div><div id="track" class="sub" style="margin:0">Checking the room's track…</div></div>
</div>
<div class="row"><button id="refresh">Refresh</button><button id="site">Open the drum room</button></div>
<div id="note" class="note"></div>`,
  `
let total = 0, mine = 0, pending = 0, sending = false, siteUrl = "https://pointcast.xyz/drum";
const show = (res) => {
  const sc = res?.structuredContent;
  if (!sc) { say(res?.content?.[0]?.text || "The drum is quiet right now."); return; }
  total = sc.globalTotal ?? total; siteUrl = sc.url || siteUrl;
  $("total").textContent = total.toLocaleString();
  $("track").textContent = sc.track ? "Room track: Spotify " + sc.track.id : "No track is set in the room.";
};
function thump() {
  try {
    const a = audio(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.32);
  } catch {}
}
async function flush() {
  if (sending || !pending) return;
  sending = true; const combo = Math.min(5, pending); pending -= combo;
  try {
    const res = await app.callServerTool({ name: "drum_tap", arguments: { combo, kind: "artifact", app: "claude-app" } });
    if (res?.isError) say(res.content?.[0]?.text || "That tap didn't land."); else say("");
  } catch { say("That tap didn't land."); }
  sending = false; if (pending) setTimeout(flush, 400);
}
$("drum").onclick = () => { thump(); mine++; total++; pending++; $("mine").textContent = mine; $("total").textContent = total.toLocaleString(); setTimeout(flush, 400); };
$("refresh").onclick = async () => show(await app.callServerTool({ name: "open_drum", arguments: {} }));
$("site").onclick = () => openSite(siteUrl);
app.ontoolresult = show;
`,
);

// ── Nouns Nation Battler ─────────────────────────────────────────────
const BATTLER_HTML = page(
  'Nouns Nation Battler',
  `<h1>Nouns Nation Battler</h1>
<p class="sub">A free 12v12 exhibition, played back from the server's replay. Nothing is saved or paid.</p>
<div class="stats">
  <div class="stat"><b id="left">…</b><span id="leftGang">left</span></div>
  <div class="stat"><b id="right">…</b><span id="rightGang">right</span></div>
</div>
<canvas id="field" width="1000" height="600" style="width:100%;height:auto;border:1px solid var(--line);border-radius:12px;background:var(--card)"></canvas>
<p id="result" class="sub" style="margin:10px 0"></p>
<div class="row"><button id="again" class="primary">Play another match</button><button id="replay">Replay</button><button id="site">Open the league</button></div>
<div id="note" class="note"></div>`,
  `
const cv = $("field"), g = cv.getContext("2d");
let match = null, timer = null, siteUrl = "https://pointcast.xyz/nouns-nation-battler";
const COLORS = { left: "#d9480f", right: "#1c7ed6" };
const nice = (s) => String(s || "").replace(/-/g, " ");
function draw(frame) {
  g.clearRect(0, 0, cv.width, cv.height);
  g.strokeStyle = "rgba(128,128,128,.25)"; g.beginPath(); g.moveTo(500, 0); g.lineTo(500, 600); g.stroke();
  const alive = { left: 0, right: 0 };
  for (const [id, x, y, hp] of frame.units) {
    const u = match.units[id]; if (!u) continue;
    const max = u.maxHp || 100, r = 10 + (u.role === "captain" ? 4 : 0);
    g.globalAlpha = hp > 0 ? 1 : 0.18;
    g.fillStyle = COLORS[u.side]; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    if (hp > 0) { alive[u.side]++; g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x - 12, y - r - 7, 24, 3); g.fillStyle = "#2f9e44"; g.fillRect(x - 12, y - r - 7, 24 * Math.max(0, hp) / max, 3); }
  }
  g.globalAlpha = 1;
  $("left").textContent = alive.left + " standing"; $("right").textContent = alive.right + " standing";
}
function play() {
  if (!match?.frames?.length) return;
  clearInterval(timer); let i = 0; $("result").textContent = "";
  timer = setInterval(() => {
    draw(match.frames[i]); i++;
    if (i >= match.frames.length) {
      clearInterval(timer);
      const side = match.winner, gang = side ? nice(match.input?.[side]?.gang) : "";
      $("result").textContent = side ? gang + " win by " + nice(match.reason) + " · seed " + match.input.seed : "A draw · seed " + match.input.seed;
    }
  }, Math.max(60, Math.min(180, Math.round(8000 / match.frames.length))));
}
const show = (res) => {
  const sc = res?.structuredContent;
  if (!sc?.match) { say(res?.content?.[0]?.text || "No match came back."); return; }
  match = sc.match; siteUrl = sc.url || siteUrl; say("");
  $("leftGang").textContent = nice(match.input.left.gang) + " · " + match.input.left.tactic;
  $("rightGang").textContent = nice(match.input.right.gang) + " · " + match.input.right.tactic;
  play();
};
$("again").onclick = async () => {
  $("again").disabled = true; say("Running a match…");
  try { show(await app.callServerTool({ name: "open_nouns_battler", arguments: {} })); }
  catch { say("The arena didn't answer."); }
  $("again").disabled = false;
};
$("replay").onclick = play;
$("site").onclick = () => openSite(siteUrl);
app.ontoolresult = show;
`,
);

// ── Keyboard Bloom ───────────────────────────────────────────────────
const KEYBOARD_HTML = page(
  'Keyboard Bloom',
  `<h1>Keyboard Bloom</h1>
<p class="sub">Play a phrase here, then send it to the town keyboard if you like it.</p>
<div class="stats">
  <div class="stat"><b id="total">…</b><span>notes the town has played</span></div>
  <div class="stat"><b id="key">…</b><span>today's key</span></div>
</div>
<div id="keys" class="row" style="margin-bottom:12px"></div>
<p class="sub" style="margin:0 0 10px">Your phrase: <span id="phrase">none yet</span></p>
<div class="row"><button id="send" class="primary" disabled>Send to the town</button><button id="clear">Clear</button><button id="site">Open Keyboard Bloom</button></div>
<div id="note" class="note"></div>`,
  `
const NOTES = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
const NAMES = ["C", "D", "E", "G", "A", "C", "D", "E", "G", "A"];
const KEYS = "asdfghjkl;";
let phrase = [], siteUrl = "https://pointcast.xyz/keyboard";
function tone(midi) {
  try {
    const a = audio(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = "triangle"; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.95);
  } catch {}
}
function press(i) {
  tone(NOTES[i]); if (phrase.length < 64) phrase.push(NOTES[i]);
  $("phrase").textContent = phrase.map((n) => NAMES[NOTES.indexOf(n)]).join(" ");
  $("send").disabled = false;
}
NOTES.forEach((n, i) => {
  const b = document.createElement("button");
  b.textContent = NAMES[i]; b.title = "Key " + KEYS[i]; b.style.cssText = "width:44px;height:72px;font-weight:600";
  b.onclick = () => press(i); $("keys").append(b);
});
document.addEventListener("keydown", (e) => { const i = KEYS.indexOf(e.key); if (i >= 0 && !e.repeat) press(i); });
const show = (res) => {
  const sc = res?.structuredContent;
  if (!sc) { say(res?.content?.[0]?.text || "The keyboard signal is quiet."); return; }
  siteUrl = sc.url || siteUrl;
  if (typeof sc.globalTotal === "number") $("total").textContent = sc.globalTotal.toLocaleString();
  $("key").textContent = sc.key || "not set yet";
};
$("send").onclick = async () => {
  if (!phrase.length) return;
  $("send").disabled = true; say("Sending…");
  try {
    const res = await app.callServerTool({ name: "keyboard_play", arguments: { notes: phrase, kind: "artifact", app: "claude-app" } });
    say(res?.isError ? (res.content?.[0]?.text || "The town keyboard didn't take it.") : "Sent. Listeners on the keyboard signal heard it.");
    if (!res?.isError) { phrase = []; $("phrase").textContent = "none yet"; show(await app.callServerTool({ name: "open_keyboard_bloom", arguments: {} })); }
  } catch { say("The town keyboard didn't answer."); }
  $("send").disabled = !phrase.length;
};
$("clear").onclick = () => { phrase = []; $("phrase").textContent = "none yet"; $("send").disabled = true; };
$("site").onclick = () => openSite(siteUrl);
app.ontoolresult = show;
`,
);

const HTML_BY_URI: Record<string, string> = {
  [APP_VIEW_URIS.drum]: DRUM_HTML,
  [APP_VIEW_URIS.battler]: BATTLER_HTML,
  [APP_VIEW_URIS.keyboard]: KEYBOARD_HTML,
};

/** resources/read content for a view, or null when the URI is not one. */
export function readAppView(uri: string) {
  const text = HTML_BY_URI[uri];
  if (!text) return null;
  return {
    contents: [{
      uri,
      mimeType: APP_VIEW_MIME,
      text,
      _meta: { ui: { csp: { resourceDomains: ['https://unpkg.com'] } } },
    }],
  };
}
