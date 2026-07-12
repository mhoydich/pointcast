const LEAGUE_KEY = "pc:nouns-nation-league-v4";
const CANONICAL_DESK_URL = "https://pointcast.xyz/games/nouns-nation-battler/desk/";

const gangColors = {
  "Tomato Noggles": "#e45745",
  "Cobalt Frames": "#3677e0",
  "Golden Nouncil": "#d49b19",
  "Garden Stack": "#3f9b54",
  "Pixel Union": "#8b5cf6",
  "Night Auction": "#2f3a4f",
  "Sunset Prop House": "#ef7d2d",
  "Mint Condition": "#13a6a1",
};

const el = {
  seasonLabel: document.querySelector("#seasonLabel"),
  deskHeadline: document.querySelector("#deskHeadline"),
  deskSummary: document.querySelector("#deskSummary"),
  deskMetrics: document.querySelector("#deskMetrics"),
  runSheetTitle: document.querySelector("#runSheetTitle"),
  runSheetBody: document.querySelector("#runSheetBody"),
  reportKicker: document.querySelector("#reportKicker"),
  reportTitle: document.querySelector("#reportTitle"),
  reportMeta: document.querySelector("#reportMeta"),
  reportSummary: document.querySelector("#reportSummary"),
  reportTable: document.querySelector("#reportTable"),
  reportDesk: document.querySelector("#reportDesk"),
  reportRecaps: document.querySelector("#reportRecaps"),
  shareCardTitle: document.querySelector("#shareCardTitle"),
  shareCardMeta: document.querySelector("#shareCardMeta"),
  reportCanvas: document.querySelector("#reportCanvas"),
  galleryTitle: document.querySelector("#galleryTitle"),
  galleryMeta: document.querySelector("#galleryMeta"),
  reportGallery: document.querySelector("#reportGallery"),
  watchFrames: document.querySelector("#watchFrames"),
  agentFrameTitle: document.querySelector("#agentFrameTitle"),
  agentFrameMeta: document.querySelector("#agentFrameMeta"),
  claudePromptPreview: document.querySelector("#claudePromptPreview"),
  openAgentFrame: document.querySelector("#openAgentFrame"),
  deskCards: document.querySelector("#deskCards"),
  recapCards: document.querySelector("#recapCards"),
  copyRunSheet: document.querySelector("#copyRunSheet"),
  copyReport: document.querySelector("#copyReport"),
  copySocialPost: document.querySelector("#copySocialPost"),
  printReport: document.querySelector("#printReport"),
  downloadCard: document.querySelector("#downloadCard"),
  copyCardLink: document.querySelector("#copyCardLink"),
  saveCard: document.querySelector("#saveCard"),
  clearGallery: document.querySelector("#clearGallery"),
  copySnapshotLink: document.querySelector("#copySnapshotLink"),
  copySnapshotJson: document.querySelector("#copySnapshotJson"),
  copyClaudePrompt: document.querySelector("#copyClaudePrompt"),
  copyClaudeInline: document.querySelector("#copyClaudeInline"),
  useLocalWall: document.querySelector("#useLocalWall"),
  refreshWall: document.querySelector("#refreshWall"),
  copyStatus: document.querySelector("#copyStatus"),
  nounRack: document.querySelector("#nounRack"),
};

let currentRunSheet = "";
let currentReportText = "";
let currentSocialPost = "";
let currentClaudePrompt = "";
let currentCardFileName = "nouns-nation-season-report-card.png";
let reportGallery = [];
let currentSnapshot = null;
let importedSnapshot = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function loadLeague() {
  try {
    return JSON.parse(localStorage.getItem(LEAGUE_KEY) || "null");
  } catch {
    return null;
  }
}

function snapshotLeague(league) {
  if (!league) return null;
  return {
    version: league.version || 4,
    seasonNumber: league.seasonNumber || 1,
    phase: league.phase || "regular",
    day: league.day || 0,
    slot: league.slot || 0,
    playoffSlot: league.playoffSlot || 0,
    champion: league.champion || "",
    table: league.table || {},
    deskCards: Array.isArray(league.deskCards) ? league.deskCards.slice(0, 8) : [],
    recapCards: Array.isArray(league.recapCards) ? league.recapCards.slice(0, 8) : [],
  };
}

function makeSnapshot(league) {
  return {
    kind: "nouns-nation-desk-snapshot",
    version: 1,
    exportedAt: new Date().toISOString(),
    league: snapshotLeague(league),
  };
}

function encodeSnapshot(snapshot) {
  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeSnapshot(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function snapshotFromHash() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  const encoded = params.get("snapshot");
  if (!encoded) return null;
  try {
    const snapshot = decodeSnapshot(encoded);
    return snapshot?.kind === "nouns-nation-desk-snapshot" ? snapshot : null;
  } catch {
    el.copyStatus.textContent = "snapshot link could not load";
    return null;
  }
}

function hashParams() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash);
}

function viewMode() {
  return hashParams().get("view") || "wall";
}

function isCardView() {
  return viewMode() === "card";
}

function shareBaseUrl() {
  const current = new URL(window.location.href);
  if (current.hostname === "localhost" || current.hostname === "127.0.0.1") {
    return new URL(CANONICAL_DESK_URL);
  }
  current.hash = "";
  return current;
}

function snapshotLink(snapshot = currentSnapshot) {
  if (!snapshot?.league) return "";
  const url = shareBaseUrl();
  url.hash = `snapshot=${encodeSnapshot(snapshot)}`;
  return url.toString();
}

function cardLink(snapshot = currentSnapshot) {
  if (!snapshot?.league) return "";
  const url = shareBaseUrl();
  const params = new URLSearchParams();
  params.set("snapshot", encodeSnapshot(snapshot));
  params.set("view", "card");
  url.hash = params.toString();
  return url.toString();
}

function viewLink(view, snapshot = currentSnapshot) {
  const url = shareBaseUrl();
  const params = new URLSearchParams();
  if (snapshot?.league) params.set("snapshot", encodeSnapshot(snapshot));
  params.set("view", view);
  url.hash = params.toString();
  return url.toString();
}

function localViewLink(view, snapshot = currentSnapshot) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  if (snapshot?.league) params.set("snapshot", encodeSnapshot(snapshot));
  params.set("view", view);
  url.hash = params.toString();
  return url.toString();
}

function activeLeague() {
  return importedSnapshot?.league || loadLeague();
}

function sourceLabel() {
  return importedSnapshot ? "Snapshot" : "Local";
}

function phaseLine(league) {
  if (!league) return "No season state";
  if (league.phase === "regular") return `Season ${league.seasonNumber || 1} Day ${(league.day || 0) + 1} Slate ${(league.slot || 0) + 1}`;
  if (league.phase === "playoffs") return `Season ${league.seasonNumber || 1} Nouns Bowl ${(league.playoffSlot || 0) + 1}/3`;
  return `Season ${league.seasonNumber || 1} Champion`;
}

function standings(league) {
  return Object.entries(league?.table || {})
    .map(([name, record]) => ({ name, ...(record || {}) }))
    .sort((a, b) => (b.wins || 0) - (a.wins || 0) || (a.losses || 0) - (b.losses || 0) || ((b.pf || 0) - (b.pa || 0)) - ((a.pf || 0) - (a.pa || 0)) || (b.fans || 0) - (a.fans || 0));
}

function recordLine(row) {
  if (!row) return "pending";
  return `${row.wins || 0}-${row.losses || 0}`;
}

function metricMarkup(label, value) {
  return `
    <article class="desk-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function fallbackDeskText(card) {
  if (!card) return "";
  return `Commissioner Desk: ${card.title || "Season desk"}. ${card.body || ""} ${card.meta || ""}. Watch: https://pointcast.xyz/nouns-nation-battler-tv/`;
}

function fallbackRecapText(card) {
  if (!card) return "";
  return `${card.phase || "Recap"}: ${card.headline || card.title || "Nouns Nation result"}. Final ${card.title || card.score || "score pending"}. ${card.mvp || ""}. ${card.challenge || ""}. Next: ${card.next || "next slate"}. Watch: https://pointcast.xyz/nouns-nation-battler-tv/`;
}

function runSheetText(league, deskCards, recapCards) {
  const latestDesk = deskCards[0];
  const latestRecap = recapCards[0];
  const leader = standings(league)[0];
  const deskLine = latestDesk ? fallbackDeskText(latestDesk) : "Commissioner Desk: no stored table read yet.";
  const recapLine = latestRecap ? fallbackRecapText(latestRecap) : "Recap Studio: no final card yet.";
  const leaderLine = leader ? `Table leader: ${leader.name} ${leader.wins || 0}-${leader.losses || 0}, ${leader.fans || 0} heat.` : "Table leader: pending.";
  return `${phaseLine(league)} host sheet. ${leaderLine} ${deskLine} ${recapLine}`;
}

function reportText(league, deskCards, recapCards, rows) {
  const phase = phaseLine(league);
  const leader = rows[0];
  const topRows = rows.slice(0, 4).map((row, index) => `${index + 1}. ${row.name} ${recordLine(row)} (${row.fans || 0} heat)`).join("\n");
  const latestDesk = deskCards[0];
  const deskLines = deskCards.slice(0, 3).map((card, index) => `${index + 1}. ${card.title || "Commissioner Desk"} - ${card.meta || card.body || "saved desk read"}`).join("\n");
  const recapLines = recapCards.slice(0, 3).map((card, index) => `${index + 1}. ${card.title || card.headline || "Match recap"} - ${card.mvp || card.challenge || card.body || "saved recap"}`).join("\n");
  return [
    `# Nouns Nation Battler Season Report`,
    ``,
    `Source: ${sourceLabel()}`,
    `Phase: ${phase}`,
    `Leader: ${leader ? `${leader.name} ${recordLine(leader)}, ${leader.fans || 0} heat` : "Pending"}`,
    latestDesk ? `Desk: ${latestDesk.title || "Commissioner Desk"} - ${latestDesk.meta || latestDesk.body || ""}` : `Desk: no saved desk read yet`,
    ``,
    `## Table`,
    topRows || `No standings yet.`,
    ``,
    `## Commissioner Desk`,
    deskLines || `No desk archive yet.`,
    ``,
    `## Recaps`,
    recapLines || `No recap cards yet.`,
    ``,
    `Snapshot: ${snapshotLink() || "No snapshot available yet."}`,
  ].join("\n");
}

function socialPostText(league, deskCards, recapCards, rows) {
  const phase = phaseLine(league);
  const leader = rows[0];
  const latestDesk = deskCards[0];
  const latestRecap = recapCards[0];
  return [
    `Nouns Nation Battler report: ${phase}.`,
    leader ? `Leader: ${leader.name} ${recordLine(leader)} with ${leader.fans || 0} heat.` : `Leader: pending.`,
    latestDesk ? `${latestDesk.title || "Commissioner Desk"}: ${latestDesk.meta || latestDesk.body || "desk read saved"}.` : "",
    latestRecap ? `Latest recap: ${latestRecap.title || latestRecap.headline || "Match recap"}${latestRecap.mvp ? ` (${latestRecap.mvp})` : ""}.` : "",
    `Watch: https://pointcast.xyz/nouns-nation-battler-tv/`,
    cardLink() ? `Card: ${cardLink()}` : "",
  ].filter(Boolean).join("\n");
}

function claudeScorebookPrompt(league, deskCards, recapCards, rows) {
  const phase = phaseLine(league);
  const leader = rows[0];
  const latestRecap = recapCards[0];
  const snapshotUrl = snapshotLink(makeSnapshot(league));
  const fallbackRecap = latestRecap ? (latestRecap.share || fallbackRecapText(latestRecap)) : "";
  const toolArgs = snapshotUrl
    ? { snapshotUrl, view: "cowork" }
    : { recapText: fallbackRecap || "No recap supplied yet.", view: "cowork" };
  return [
    "Use the PointCast MCP connector at https://pointcast.xyz/api/mcp-v2.",
    "Call nouns_battler_result_tracker with:",
    JSON.stringify(toolArgs, null, 2),
    "",
    "Then keep a running Nouns Nation Battler scorebook for me.",
    `Current phase: ${phase}.`,
    leader ? `Current leader: ${leader.name} ${recordLine(leader)} with ${leader.fans || 0} heat.` : "Current leader: pending.",
    "Return: table leader, bubble team, latest final, best storyline, next watch link, and one recommended watch-frame link.",
    "Keep it concise and make it feel like a live sports desk, not a software report.",
  ].join("\n");
}

function watchFrameDefinitions(league, deskCards, recapCards, rows) {
  const phase = phaseLine(league);
  const leader = rows[0];
  const latestDesk = deskCards[0];
  const latestRecap = recapCards[0];
  return [
    {
      id: "card",
      label: "Report Card",
      title: leader ? `${leader.name} card` : "16:9 report card",
      body: "A single shareable card for chat, posts, and lunch-review drive-bys.",
      detail: latestRecap?.title || latestDesk?.title || phase,
      color: "#f5c84b",
    },
    {
      id: "scoreboard",
      label: "Scoreboard",
      title: leader ? `${leader.name} on top` : "Big table view",
      body: "A table-first wall for people who want records, heat, recaps, and standings at a glance.",
      detail: `${rows.length || 0} gangs tracked`,
      color: "#3677e0",
    },
    {
      id: "story",
      label: "Story Desk",
      title: "Commissioner read",
      body: "A narrative viewing frame for hosts: table hook, latest result, and what to watch next.",
      detail: latestDesk?.meta || latestRecap?.mvp || "Host angle pending",
      color: "#13a6a1",
    },
    {
      id: "agent",
      label: "Agent Scorebook",
      title: "Claude/Cowork prompt",
      body: "A clean handoff frame for agents that should track results or host a running scorebook.",
      detail: snapshotLink() ? "Snapshot MCP-ready" : "Recap prompt ready",
      color: "#8b5cf6",
    },
  ];
}

function renderWatchFrames(league, deskCards, recapCards, rows) {
  const frames = watchFrameDefinitions(league, deskCards, recapCards, rows);
  el.watchFrames.innerHTML = frames.map((frame) => {
    const openLink = localViewLink(frame.id);
    const copyLink = viewLink(frame.id);
    const extraButton = frame.id === "agent"
      ? `<button type="button" data-copy-text="${escapeHtml(currentClaudePrompt)}" data-copy-label="Claude prompt">Copy Prompt</button>`
      : "";
    return `
      <article class="frame-card" style="--frame-color:${escapeHtml(frame.color)}">
        <span>${escapeHtml(frame.label)}</span>
        <strong>${escapeHtml(frame.title)}</strong>
        <p>${escapeHtml(frame.body)}</p>
        <em>${escapeHtml(frame.detail)}</em>
        <div class="frame-actions">
          <a href="${escapeHtml(openLink)}">Open</a>
          <button type="button" data-copy-text="${escapeHtml(copyLink)}" data-copy-label="${escapeHtml(frame.label)} link">Copy Link</button>
          ${extraButton}
        </div>
      </article>
    `;
  }).join("");
}

function renderAgentScorebook(league, deskCards, recapCards, rows) {
  const phase = phaseLine(league);
  const leader = rows[0];
  currentClaudePrompt = claudeScorebookPrompt(league, deskCards, recapCards, rows);
  el.agentFrameTitle.textContent = leader ? `${leader.name} scorebook handoff` : "Claude/Cowork scorebook handoff";
  el.agentFrameMeta.textContent = `${sourceLabel()} state · ${phase} · ${deskCards.length} desk reads · ${recapCards.length} recaps`;
  el.claudePromptPreview.textContent = currentClaudePrompt;
  el.openAgentFrame.href = localViewLink("agent");
}

function cardFileName(league) {
  const slug = phaseLine(league).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "season-report";
  return `nouns-nation-${slug}-card.png`;
}

function canvasFitText(ctx, value, maxWidth) {
  let text = String(value ?? "");
  if (ctx.measureText(text).width <= maxWidth) return text;
  while (text.length && ctx.measureText(`${text}...`).width > maxWidth) {
    text = text.slice(0, -1);
  }
  return `${text.trim()}...`;
}

function canvasWrapText(ctx, value, maxWidth, maxLines = 3) {
  const words = String(value ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(test).width <= maxWidth) {
      line = test;
      return;
    }
    lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  let last = clipped[clipped.length - 1] || "";
  while (last.length && ctx.measureText(`${last}...`).width > maxWidth) {
    last = last.slice(0, -1);
  }
  clipped[clipped.length - 1] = `${last.trim()}...`;
  return clipped;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const lines = canvasWrapText(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + (index * lineHeight));
  });
  return y + (lines.length * lineHeight);
}

function drawPanel(ctx, x, y, width, height, fill = "#fffdf5") {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#101217";
  ctx.lineWidth = 6;
  ctx.strokeRect(x, y, width, height);
}

function renderShareCard(league, deskCards, recapCards, rows) {
  const canvas = el.reportCanvas;
  const ctx = canvas?.getContext("2d");
  const phase = phaseLine(league);
  const leader = rows[0];
  const latestDesk = deskCards[0];
  const latestRecap = recapCards[0];
  currentSocialPost = socialPostText(league, deskCards, recapCards, rows);
  currentCardFileName = cardFileName(league);

  el.shareCardTitle.textContent = leader ? `${leader.name} report card ready` : "Season report card ready";
  el.shareCardMeta.textContent = `${sourceLabel()} state · ${phase} · ${rows.length || 0} teams`;
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const leaderColor = gangColors[leader?.name] || "#f5c84b";
  const secondColor = gangColors[rows[1]?.name] || "#3677e0";
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f3ecdc";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(16, 18, 23, 0.08)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = leaderColor;
  ctx.fillRect(0, 0, width, 28);
  ctx.fillStyle = secondColor;
  ctx.fillRect(0, 28, width, 14);
  ctx.fillStyle = "#101217";
  ctx.fillRect(72, 92, 20, 704);
  ctx.fillStyle = leaderColor;
  ctx.fillRect(92, 92, 18, 704);

  ctx.fillStyle = "#101217";
  ctx.font = "900 34px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("NOUNS NATION BATTLER", 132, 112);
  ctx.font = "1000 108px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("SEASON REPORT", 128, 220);
  ctx.font = "900 38px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`${sourceLabel().toUpperCase()} / ${phase.toUpperCase()}`, 132, 276);

  drawPanel(ctx, 128, 326, 612, 360, "#fffdf5");
  ctx.fillStyle = leaderColor;
  ctx.fillRect(128, 326, 612, 24);
  ctx.fillStyle = "#101217";
  ctx.font = "1000 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("TABLE LEADER", 158, 386);
  ctx.font = "1000 62px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(canvasFitText(ctx, leader?.name || "Pending", 540), 158, 466);
  ctx.font = "900 34px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(leader ? `${recordLine(leader)} · ${leader.fans || 0} heat` : "Run a slate to fill the board", 158, 522);
  ctx.font = "850 28px ui-sans-serif, system-ui, sans-serif";
  const deskLine = latestDesk
    ? `${latestDesk.title || "Commissioner Desk"}: ${latestDesk.meta || latestDesk.body || "desk read saved"}`
    : "No desk read yet. Open the game and render the Watch Party Kit.";
  drawWrappedText(ctx, deskLine, 158, 590, 530, 34, 3);

  drawPanel(ctx, 780, 326, 692, 360, "#fffdf5");
  ctx.fillStyle = secondColor;
  ctx.fillRect(780, 326, 692, 24);
  ctx.fillStyle = "#101217";
  ctx.font = "1000 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("TOP TABLE", 810, 386);
  ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
  (rows.slice(0, 5).length ? rows.slice(0, 5) : [{ name: "Pending", wins: 0, losses: 0, fans: 0 }]).forEach((row, index) => {
    const y = 444 + (index * 48);
    ctx.fillStyle = index === 0 ? leaderColor : "#101217";
    ctx.fillRect(810, y - 28, 30, 30);
    ctx.fillStyle = index === 0 ? "#101217" : "#fffdf5";
    ctx.font = "1000 21px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(String(index + 1), 819, y - 6);
    ctx.fillStyle = "#101217";
    ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(canvasFitText(ctx, row.name, 350), 858, y);
    ctx.font = "850 26px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(recordLine(row), 1230, y);
    ctx.fillText(`${row.fans || 0} heat`, 1316, y);
  });

  drawPanel(ctx, 128, 724, 1344, 100, "#fffdf5");
  ctx.fillStyle = "#101217";
  ctx.font = "1000 26px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("LATEST RECAP", 158, 766);
  ctx.font = "850 28px ui-sans-serif, system-ui, sans-serif";
  const recapLine = latestRecap
    ? `${latestRecap.title || latestRecap.headline || "Match recap"} · ${[latestRecap.mvp, latestRecap.challenge, latestRecap.next ? `Next: ${latestRecap.next}` : ""].filter(Boolean).join(" · ")}`
    : "No recap card yet. Finish a match or quick sim to arm the social card.";
  drawWrappedText(ctx, recapLine, 370, 766, 1010, 32, 2);

  ctx.fillStyle = "#101217";
  ctx.font = "900 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("pointcast.xyz/nouns-nation-battler-tv", 128, 862);
  ctx.fillText(`${deskCards.length} desk reads / ${recapCards.length} recaps / V33`, 1088, 862);
}

function currentCardDataUrl() {
  return el.reportCanvas?.toDataURL("image/png") || "";
}

function downloadDataUrl(dataUrl, fileName) {
  if (!dataUrl) return;
  const link = document.createElement("a");
  link.download = fileName || "nouns-nation-season-report-card.png";
  link.href = dataUrl;
  link.click();
}

function saveGalleryCard() {
  const dataUrl = currentCardDataUrl();
  if (!dataUrl) {
    el.copyStatus.textContent = "card unavailable";
    return;
  }
  const item = {
    dataUrl,
    fileName: currentCardFileName,
    title: el.shareCardTitle.textContent || "Season report card",
    meta: el.shareCardMeta.textContent || "Desk Wall report card",
    post: currentSocialPost,
    link: cardLink(),
    savedAt: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
  };
  reportGallery = [item, ...reportGallery].slice(0, 6);
  renderGallery();
  el.copyStatus.textContent = "report card saved";
}

function renderGallery() {
  if (!reportGallery.length) {
    el.galleryTitle.textContent = "No saved cards yet";
    el.galleryMeta.textContent = "Use Save Card to keep report cards during this Desk Wall session.";
    el.reportGallery.innerHTML = `
      <article class="empty-card">
        <span>In-session only</span>
        <p>Saved cards stay here while this page is open, so a host can compare a slate before sharing.</p>
      </article>
    `;
    return;
  }
  el.galleryTitle.textContent = `${reportGallery.length} saved report card${reportGallery.length === 1 ? "" : "s"}`;
  el.galleryMeta.textContent = "Re-download cards or copy their matching social post text before leaving the page.";
  el.reportGallery.innerHTML = reportGallery.map((item, index) => `
    <article class="gallery-card">
      <img src="${item.dataUrl}" alt="" />
      <div>
        <span>${escapeHtml(item.savedAt)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.meta)}</p>
        <div class="gallery-actions">
          <button type="button" data-gallery-copy="${index}">Copy Post</button>
          <button type="button" data-gallery-link="${index}">Copy Link</button>
          <button type="button" data-gallery-download="${index}">Download</button>
        </div>
      </div>
    </article>
  `).join("");
}

function cardButton(label, text) {
  return `<button type="button" data-copy-text="${escapeHtml(text)}" data-copy-label="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
}

function renderDeskCards(cards) {
  if (!cards.length) {
    el.deskCards.innerHTML = `
      <article class="empty-card">
        <span>No desk archive yet</span>
        <p>Open the game and let the Watch Party Kit render once to arm the Commissioner Desk archive.</p>
      </article>
    `;
    return;
  }
  el.deskCards.innerHTML = cards.slice(0, 8).map((card, index) => `
    <article class="archive-card" style="--card-color:${index % 2 ? "#3677e0" : "#f5c84b"}">
      <div>
        <span>${escapeHtml(card.label || `Desk ${index + 1}`)}</span>
        <strong>${escapeHtml(card.title || "Commissioner Desk")}</strong>
        <p>${escapeHtml(card.meta || card.body || "Table read saved from the Watch Party Kit.")}</p>
      </div>
      ${cardButton(index === 0 ? "Copy Latest" : "Copy Desk", card.text || fallbackDeskText(card))}
    </article>
  `).join("");
}

function renderRecapCards(cards) {
  if (!cards.length) {
    el.recapCards.innerHTML = `
      <article class="empty-card">
        <span>No recap cards yet</span>
        <p>Finish a match or quick sim to add result cards from Recap Studio.</p>
      </article>
    `;
    return;
  }
  el.recapCards.innerHTML = cards.slice(0, 8).map((card, index) => `
    <article class="archive-card" style="--card-color:${escapeHtml(card.leftColor || card.rightColor || gangColors[card.winner] || "#13a6a1")}">
      <div>
        <span>${escapeHtml(card.phase || `Recap ${index + 1}`)}</span>
        <strong>${escapeHtml(card.title || card.headline || "Match recap")}</strong>
        <p>${escapeHtml([card.mvp, card.challenge, card.next ? `Next: ${card.next}` : ""].filter(Boolean).join(" | ") || card.body || "Result card saved from Recap Studio.")}</p>
      </div>
      ${cardButton(index === 0 ? "Copy Latest" : "Copy Recap", card.share || fallbackRecapText(card))}
    </article>
  `).join("");
}

function renderReport(league, deskCards, recapCards, rows) {
  const phase = phaseLine(league);
  const leader = rows[0];
  const latestDesk = deskCards[0];
  const latestRecap = recapCards[0];
  currentReportText = reportText(league, deskCards, recapCards, rows);

  el.reportKicker.textContent = `${sourceLabel()} Season Report`;
  el.reportTitle.textContent = leader ? `${leader.name} lead ${phase}` : "Nouns Nation Battler report";
  el.reportMeta.textContent = `${deskCards.length} desk reads · ${recapCards.length} recaps · ${new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
  el.reportSummary.textContent = latestDesk
    ? `${latestDesk.title || "Commissioner Desk"}: ${latestDesk.meta || latestDesk.body || "The desk read is saved for the host report."}`
    : latestRecap
      ? `${latestRecap.headline || "Latest recap"}: ${latestRecap.mvp || latestRecap.challenge || "Recap Studio has a result ready."}`
      : "Run a slate or open a snapshot to turn the desk wall into a printable season report.";
  el.reportTable.innerHTML = (rows.slice(0, 6).length ? rows.slice(0, 6) : [{ name: "Pending", wins: 0, losses: 0, fans: 0 }]).map((row, index) => `
    <div class="report-row">
      <b>${index + 1}</b>
      <strong>${escapeHtml(row.name)}</strong>
      <span>${escapeHtml(recordLine(row))}</span>
      <em>${escapeHtml(row.fans || 0)} heat</em>
    </div>
  `).join("");
  el.reportDesk.innerHTML = (deskCards.slice(0, 3).length ? deskCards.slice(0, 3) : [{ label: "Desk", title: "No desk reads yet", meta: "Open the game and render the Watch Party Kit." }]).map((card) => `
    <div class="report-card">
      <strong>${escapeHtml(card.title || "Commissioner Desk")}</strong>
      <p>${escapeHtml(card.meta || card.body || "Saved desk read")}</p>
    </div>
  `).join("");
  el.reportRecaps.innerHTML = (recapCards.slice(0, 3).length ? recapCards.slice(0, 3) : [{ phase: "Recap", title: "No recap cards yet", body: "Finish a match or quick sim to save a recap." }]).map((card) => `
    <div class="report-card">
      <strong>${escapeHtml(card.title || card.headline || "Match recap")}</strong>
      <p>${escapeHtml([card.mvp, card.challenge, card.next ? `Next: ${card.next}` : "", card.body].filter(Boolean).join(" | ") || "Saved recap card")}</p>
    </div>
  `).join("");
}

function renderNouns() {
  const ids = [3, 14, 25, 36, 47, 58];
  el.nounRack.innerHTML = ids.map((id) => `<img src="../assets/noun-${id}.svg" alt="" />`).join("");
}

function render() {
  renderNouns();
  const league = activeLeague();
  const deskCards = Array.isArray(league?.deskCards) ? league.deskCards : [];
  const recapCards = Array.isArray(league?.recapCards) ? league.recapCards : [];
  const rows = standings(league);
  const leader = rows[0];
  const phase = phaseLine(league);
  currentSnapshot = makeSnapshot(league);
  currentRunSheet = runSheetText(league, deskCards, recapCards);
  currentReportText = reportText(league, deskCards, recapCards, rows);
  currentSocialPost = socialPostText(league, deskCards, recapCards, rows);

  el.seasonLabel.textContent = `${sourceLabel()} wall · ${phase}`;
  el.deskHeadline.textContent = leader ? `${leader.name} hold the board` : "Run a slate to fill the wall";
  el.deskSummary.textContent = deskCards.length || recapCards.length
    ? `${deskCards.length} desk reads and ${recapCards.length} recap cards are loaded from ${sourceLabel().toLowerCase()} state.`
    : "The wall will fill with Commissioner Desk reads and Recap Studio cards from this browser or a snapshot link.";
  el.deskMetrics.innerHTML = [
    metricMarkup("Source", sourceLabel()),
    metricMarkup("Phase", phase),
    metricMarkup("Leader", leader ? `${leader.name} ${leader.wins || 0}-${leader.losses || 0}` : "Pending"),
    metricMarkup("Desk Reads", deskCards.length),
    metricMarkup("Recaps", recapCards.length),
  ].join("");
  el.runSheetTitle.textContent = deskCards[0]?.title || recapCards[0]?.headline || "Latest playable angle";
  el.runSheetBody.textContent = currentRunSheet;
  renderAgentScorebook(league, deskCards, recapCards, rows);
  renderWatchFrames(league, deskCards, recapCards, rows);
  renderReport(league, deskCards, recapCards, rows);
  renderShareCard(league, deskCards, recapCards, rows);
  renderDeskCards(deskCards);
  renderRecapCards(recapCards);
  applyViewMode(league, rows, deskCards, recapCards);
}

function applyViewMode(league, rows, deskCards, recapCards) {
  const view = viewMode();
  const frameViews = ["card", "scoreboard", "story", "agent"];
  const leader = rows?.[0];
  const latestDesk = deskCards?.[0];
  const latestRecap = recapCards?.[0];
  document.body.classList.toggle("frame-view", frameViews.includes(view));
  document.body.classList.toggle("card-view", view === "card");
  document.body.classList.toggle("scoreboard-view", view === "scoreboard");
  document.body.classList.toggle("story-view", view === "story");
  document.body.classList.toggle("agent-view", view === "agent");

  if (view === "card") {
    el.seasonLabel.textContent = `Report Card Frame · ${phaseLine(league)}`;
    el.deskHeadline.textContent = "Snapshot card ready to share";
    el.deskSummary.textContent = "A focused 16:9 card view for chat, posts, and agent handoff.";
    el.shareCardTitle.textContent = el.shareCardTitle.textContent.replace("ready", "shared");
  }
  if (view === "scoreboard") {
    el.seasonLabel.textContent = `Scoreboard Frame · ${phaseLine(league)}`;
    el.deskHeadline.textContent = leader ? `${leader.name} top the table` : "Scoreboard frame";
    el.deskSummary.textContent = "Standings first, with the Commissioner Desk and Recap Studio stacked like a broadcast table read.";
  }
  if (view === "story") {
    el.seasonLabel.textContent = `Story Desk Frame · ${phaseLine(league)}`;
    el.deskHeadline.textContent = latestDesk?.title || latestRecap?.headline || "Story desk frame";
    el.deskSummary.textContent = latestDesk?.meta || latestRecap?.mvp || "A host-friendly frame for the league angle, recent result, and next-watch hook.";
  }
  if (view === "agent") {
    el.seasonLabel.textContent = `Agent Scorebook Frame · ${phaseLine(league)}`;
    el.deskHeadline.textContent = "Hand this season to Claude";
    el.deskSummary.textContent = "Copy the MCP prompt, paste it into Claude/Cowork, and let the agent keep the league scorebook while you watch.";
  }
}

async function copyText(text, label = "Copy") {
  try {
    await navigator.clipboard.writeText(text);
    el.copyStatus.textContent = `${label} copied`;
  } catch {
    el.copyStatus.textContent = "copy failed";
  }
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const galleryCopy = target?.closest("[data-gallery-copy]");
  if (galleryCopy) {
    const item = reportGallery[Number(galleryCopy.dataset.galleryCopy)];
    copyText(item?.post || "", "Gallery post");
    return;
  }
  const galleryLink = target?.closest("[data-gallery-link]");
  if (galleryLink) {
    const item = reportGallery[Number(galleryLink.dataset.galleryLink)];
    copyText(item?.link || "", "Gallery card link");
    return;
  }
  const galleryDownload = target?.closest("[data-gallery-download]");
  if (galleryDownload) {
    const item = reportGallery[Number(galleryDownload.dataset.galleryDownload)];
    downloadDataUrl(item?.dataUrl, item?.fileName);
    el.copyStatus.textContent = item ? "gallery card downloaded" : "card unavailable";
    return;
  }
  const button = target?.closest("[data-copy-text]");
  if (!button) return;
  copyText(button.dataset.copyText || "", button.dataset.copyLabel || "Copy");
});

el.copyRunSheet.addEventListener("click", () => copyText(currentRunSheet, "Run sheet"));
el.copyReport.addEventListener("click", () => copyText(currentReportText, "Report"));
el.copySocialPost.addEventListener("click", () => copyText(currentSocialPost, "Social post"));
el.printReport.addEventListener("click", () => window.print());
el.downloadCard.addEventListener("click", () => {
  downloadDataUrl(currentCardDataUrl(), currentCardFileName);
  el.copyStatus.textContent = "report card downloaded";
});
el.copyCardLink.addEventListener("click", () => copyText(cardLink(), "Card link"));
el.saveCard.addEventListener("click", saveGalleryCard);
el.clearGallery.addEventListener("click", () => {
  reportGallery = [];
  renderGallery();
  el.copyStatus.textContent = "gallery cleared";
});
el.copySnapshotLink.addEventListener("click", () => copyText(snapshotLink(), "Snapshot link"));
el.copySnapshotJson.addEventListener("click", () => copyText(JSON.stringify(currentSnapshot, null, 2), "Snapshot JSON"));
el.copyClaudePrompt.addEventListener("click", () => copyText(currentClaudePrompt, "Claude prompt"));
el.copyClaudeInline.addEventListener("click", () => copyText(currentClaudePrompt, "Claude prompt"));
el.useLocalWall.addEventListener("click", () => {
  importedSnapshot = null;
  history.replaceState(null, "", window.location.pathname);
  el.copyStatus.textContent = "local wall loaded";
  render();
});
el.refreshWall.addEventListener("click", () => {
  importedSnapshot = snapshotFromHash();
  render();
});

window.addEventListener("hashchange", () => {
  importedSnapshot = snapshotFromHash();
  render();
});

importedSnapshot = snapshotFromHash();
renderGallery();
render();
