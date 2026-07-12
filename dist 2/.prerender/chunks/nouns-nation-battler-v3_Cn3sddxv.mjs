import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { u as NOUNS_BATTLER_AGENT_OPS_LOOP, w as NOUNS_BATTLER_SEASON_6_FAST_PASS, v as NOUNS_BATTLER_SEASON_6_POCKET_DESK, j as NOUNS_BATTLER_SEASON_6_MISSION_PACKS } from './nouns-battler-agent-bench_CoupaMI8.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$NounsNationBattlerV3 = createComponent(async ($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  const tickerItems = [
    "V3 frames the game as a federation desk, not just a match viewer",
    "The thought: make the sport watchable, make the receipts portable, make the door easy to enter",
    "Nations, teams, gangs, clubs, crews, DAOs, shops, schools, and local leagues can bring identity",
    "PointCast supplies the desk, schedule grammar, result envelope, and agent-readable rails",
    "Sprint Room now packages Season 6 launch work: expansion, media week, rights inventory, and proof artifacts",
    "Fast Pass gives agents copyable claim, share, and audit handoffs before the room cools",
    "Pocket Desk turns the next minute into phone-sized live, claim, audit, and handoff moves",
    "Agent Ops keeps Season 6 claims, reports, and handoffs on a public 30-day ledger",
    "Signed: Michael Hoydich x Codex 5.5 extra-high"
  ];
  const thoughtCards = [
    {
      label: "01",
      title: "Make the game legible first",
      body: "The field can stay chaotic. The desk should make the score, pressure, stakes, and next action understandable in one glance."
    },
    {
      label: "02",
      title: "Federate receipts, not vibes",
      body: "Every outside nation needs a stable manifest, a result envelope, and a public home link. Culture stays local; proof travels."
    },
    {
      label: "03",
      title: "Let identity enter sideways",
      body: "A nation can be a school, crew, shop, DAO, local league, art collective, or fandom. The intake shape should not overfit one social form."
    },
    {
      label: "04",
      title: "Agents become staff",
      body: "Codex, Claude, Manus, Cursor, and MCP agents should be able to scout, score, QA, package assets, and write handoff notes without a meeting."
    }
  ];
  const federationLanes = [
    {
      code: "FOUND",
      title: "Founding gangs",
      body: "The eight built-in gangs become the house league: stable colors, marks, standings, and rivalry memory."
    },
    {
      code: "BRING",
      title: "Imported nations",
      body: "Outside groups arrive with a manifest, roster mode, colors, proof note, and the event level they want to try."
    },
    {
      code: "CAST",
      title: "Broadcast desks",
      body: "Every nation can get a desk surface, a TV cut, and shareable cards without needing to fork the whole game."
    },
    {
      code: "CUP",
      title: "Opt-in cups",
      body: "The first federation events should be small: exhibitions, rivalry nights, cups, and one clear bowl."
    }
  ];
  const operatorLoops = [
    { stamp: "WATCH", title: "Observe the slate", note: "Use live snapshots to call match pressure, field type, and top Nouns." },
    { stamp: "WRITE", title: "Turn match into receipt", note: "Publish result cards, desk snapshots, and CH.BTL blocks for the archive." },
    { stamp: "INVITE", title: "Open the intake lane", note: "Point people to the manifest shape before promising a custom backend." },
    { stamp: "FEDERATE", title: "Schedule the right event", note: "Start with exhibition and cup formats, then graduate stable nations." }
  ];
  const seasonRecaps = [
    {
      season: "S01",
      title: "Founders Table",
      champion: "Tomato Noggles",
      runnerUp: "Cobalt Frames",
      record: "12-4, Bowl 24-18",
      mvp: "#12 Noun Runner",
      mvpLine: "breakaway damage, three closeout KOs, and the first true desk star turn",
      story: "Tomato made the league legible: fast starts, loud recaps, simple villain energy for everyone chasing them.",
      asset: "/games/nouns-nation-battler/assets/noun-12.svg",
      color: "#e45745"
    },
    {
      season: "S02",
      title: "Blue Frame Revenge",
      champion: "Cobalt Frames",
      runnerUp: "Golden Nouncil",
      record: "13-3, Bowl 21-20",
      mvp: "#41 Cobalt Captain",
      mvpLine: "quorum rallies, late shields, and the calmest one-point final in the archive",
      story: "Cobalt turned the broadcast into a tactics show. Slower pace, cleaner spacing, bigger late-game reads.",
      asset: "/games/nouns-nation-battler/assets/noun-41.svg",
      color: "#3677e0"
    },
    {
      season: "S03",
      title: "Garden Weather",
      champion: "Garden Stack",
      runnerUp: "Pixel Union",
      record: "11-5, Bowl 27-16",
      mvp: "#27 Mint Healer",
      mvpLine: "emergency mints, field control, and a healing stat line people could understand",
      story: "Garden made support roles headline material. The desk learned to sell saves, not just KOs.",
      asset: "/games/nouns-nation-battler/assets/noun-27.svg",
      color: "#3f9b54"
    },
    {
      season: "S04",
      title: "Midnight Paddle",
      champion: "Night Auction",
      runnerUp: "Sunset Prop House",
      record: "10-6, Bowl 19-15",
      mvp: "#58 Night Slinger",
      mvpLine: "auction volleys, Fog Bowl ambushes, and the best heel run so far",
      story: "Night Auction proved a season can be a media product: dark fields, narrow finals, and endless clips.",
      asset: "/games/nouns-nation-battler/assets/noun-58.svg",
      color: "#2f3a4f"
    },
    {
      season: "S05",
      title: "Mint Condition Cup",
      champion: "Mint Condition",
      runnerUp: "Tomato Noggles",
      record: "12-4, Bowl 23-21",
      mvp: "#03 Fresh Bonker",
      mvpLine: "two playoff slams, one last-stand challenge, and a sponsor-friendly smile",
      story: "Mint made the next federation pitch obvious: new nations need color, a chant, and one undeniable star.",
      asset: "/games/nouns-nation-battler/assets/noun-3.svg",
      color: "#13a6a1"
    }
  ];
  const mvpBoard = [
    { label: "Career MVP", name: "#41 Cobalt Captain", note: "Best all-around desk resume: wins, rallies, and playoff composure." },
    { label: "Scoring Title", name: "#12 Noun Runner", note: "Fastest way to explain the sport to a new viewer: point, sprint, finish." },
    { label: "Cult Hero", name: "#27 Mint Healer", note: "Turned healing and emergency mints into watchable television." },
    { label: "Villain Heat", name: "#58 Night Slinger", note: "Every rival league needs someone who can own the cold open." }
  ];
  const mediaAngles = [
    {
      label: "Dynasty Watch",
      title: "No gang has defended yet",
      body: "That gives every preview show a clean question: is the league chaos, or has nobody built a repeatable system?"
    },
    {
      label: "Transfer Desk",
      title: "Imported nations need stars",
      body: "Federation gets easier when each incoming team arrives with one face, one rivalry, one chant, and one receipt trail."
    },
    {
      label: "Film Room",
      title: "Healers are underpriced",
      body: "Support Nouns create better clips than expected because the viewer understands a saved teammate immediately."
    },
    {
      label: "Schedule Talk",
      title: "Rivalry week before the Bowl",
      body: "The best media format is not more matches. It is fewer matches with names, stakes, and a reason to come back."
    }
  ];
  const nextSeasonPreview = [
    { label: "Favorite", title: "Cobalt Frames", body: "Best structure, best captain tree, and the cleanest path back to the Bowl." },
    { label: "Chaos Pick", title: "Pixel Union", body: "If the fields skew weird, Pixel can turn scrappy matchups into a meme season." },
    { label: "Hot Seat", title: "Tomato Noggles", body: "Still the face of the league, but the table has learned how to drag them late." },
    { label: "Format Test", title: "Rivalry Week", body: "A mid-season named week gives media, agents, and sponsors an easier package to sell." }
  ];
  const rivalLeaguePreview = {
    name: "The Builder Circuit",
    tagline: "A rival league built from imported nations before they graduate into the main Bowl.",
    table: [
      { code: "BB", name: "Beach Builders", angle: "local city pride, outdoor broadcasts, easy sponsor inventory" },
      { code: "PC", name: "Protocol Club", angle: "agent-native statkeeping, receipts-first governance, hard-core viewers" },
      { code: "MU", name: "Meme Union", angle: "clip factory, chaos teams, fastest social loop" },
      { code: "SC", name: "Shop Class", angle: "merchant crews, product drops, bring-your-own kit colors" }
    ],
    question: "The media question is whether the Builder Circuit is a farm system, a rebel league, or the first federation cup with its own rights package."
  };
  const sprintBrief = {
    label: "Sprint 06",
    title: "Season 6 launch room",
    thesis: "Turn the recap archive into a launch calendar: invite imported nations, make media week legible, and give every commissioner a proof packet before the first fixture.",
    northStar: "A new nation can understand the sport, pick an entry lane, and leave with a public receipt in one sitting.",
    status: "Design locked / ship in small blocks"
  };
  const sprintScoreboard = [
    { metric: "4", label: "Launch beats", note: "combine, rivalry week, media day, Bowl rights memo" },
    { metric: "8", label: "House gangs", note: "stable table for imported nations to challenge" },
    { metric: "12", label: "Proof fields", note: "identity, colors, roster, result, home, steward, feeds, rights" },
    { metric: "1", label: "Rival league", note: "Builder Circuit pressure keeps the main league honest" }
  ];
  const sprintTimeline = [
    {
      day: "D0",
      title: "Commissioner kickoff",
      body: "Name the season story, publish the recap link, and pin the intake lane so new groups know where to start."
    },
    {
      day: "D2",
      title: "Expansion combine",
      body: "Imported nations submit colors, short code, roster mode, public home, proof note, and one rivalry seed."
    },
    {
      day: "D5",
      title: "Media week packet",
      body: "Create preview cards, MVP watch, upset watch, sponsor reads, and one repeatable show rundown."
    },
    {
      day: "D8",
      title: "Rivalry test night",
      body: "Run named exhibitions before promising a full season. Great rivalries graduate; weak ones stay clips."
    },
    {
      day: "D12",
      title: "Rights and receipts",
      body: "Package watch frames, JSON routes, score envelopes, archive pages, and sponsor inventory as the media product."
    },
    {
      day: "D14",
      title: "Bowl lock",
      body: "Freeze the event slate, promote the final, and hand agents the postgame publishing checklist."
    }
  ];
  const expansionCombine = [
    { code: "ID", title: "Identity lock", body: "Name, short code, colors, mark, chant, and public home link." },
    { code: "RO", title: "Roster mode", body: "Fixed Nouns, generated roster, external feed, signup team, or house draft." },
    { code: "PR", title: "Proof trail", body: "Steward, backlink, source note, permissions, and result-envelope URL." },
    { code: "RY", title: "Rivalry seed", body: "One target, one reason, one media hook the desk can explain fast." }
  ];
  const mediaSprintProducts = [
    { label: "Show", title: "Federation Tonight", body: "A weekly desk show with top clips, standings pressure, MVP heat, and imported-nation watch." },
    { label: "Card", title: "Expansion Passport", body: "Shareable card for each candidate nation: colors, captain, home, proof, and entry level." },
    { label: "Feed", title: "Commissioner Wire", body: "Short updates for fixtures, disputes, sponsor slots, agent tasks, and result confirmations." },
    { label: "Package", title: "Cup Rights Sheet", body: "A simple inventory map for TV cast, ticker, recap cards, posters, and sponsor reads." }
  ];
  const sprintAgentQueue = [
    {
      code: "SCOUT-01",
      title: "Expansion scout",
      artifact: "candidate nation card",
      body: "Find one credible entrant, summarize identity, roster mode, home link, rivalry seed, and proof risk."
    },
    {
      code: "PROD-02",
      title: "Media producer",
      artifact: "show rundown",
      body: "Package the first media week slate: opening segment, two clips, sponsor slot, and closing Bowl hook."
    },
    {
      code: "AUDIT-03",
      title: "Receipt auditor",
      artifact: "proof checklist",
      body: "Make every imported nation leave with stable URL, steward, source note, result envelope, and citation."
    },
    {
      code: "COMM-04",
      title: "Commissioner agent",
      artifact: "season lock memo",
      body: "Freeze the launch calendar, promote rivalry night, and assign postgame publishing lanes."
    }
  ];
  const rivalScoutNotes = [
    { team: "Beach Builders", read: "Best local-media story; make them the summer exhibition test." },
    { team: "Protocol Club", read: "Best agent/receipt story; use them to harden the manifest format." },
    { team: "Meme Union", read: "Best clips story; dangerous if they own the social layer first." },
    { team: "Shop Class", read: "Best product story; strong bridge into merch, sponsor reads, and kits." }
  ];
  const opsActionButtons = [
    { action: "claim", label: "Claim", status: "claimed" },
    { action: "report", label: "Report", status: "submitted" },
    { action: "handoff", label: "Handoff", status: "handoff" }
  ];
  const opsStatusOptions = NOUNS_BATTLER_AGENT_OPS_LOOP.allowedStatuses.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }));
  const outputLinks = [
    { label: "Hub", title: "Nouns Nation", href: "/nouns-nation/" },
    { label: "Bowl", title: "Bowl Path", href: "/nouns-nation-battler-bowl/" },
    { label: "Moon", title: "Moon Tournament", href: "/nouns-nation-battler-moon/" },
    { label: "Recap", title: "Season Archive", href: "#season-recap" },
    { label: "Sprint", title: "Season 6 Room", href: "#sprint-room" },
    { label: "Pocket", title: "Pocket Desk", href: "#pocket-desk" },
    { label: "Ops", title: "Agent Ops", href: "#ops-ledger" },
    { label: "Claim", title: "Fast Pass", href: "#claim-pass" },
    { label: "V2", title: "Battle Desk V2", href: "/nouns-nation-battler-v2/" },
    { label: "Strategy", title: "Federation", href: "/nouns-nation/federation/" },
    { label: "Intake", title: "Bring a Nation", href: "/nouns-nation/join/" },
    { label: "Capital", title: "Investment Thesis", href: "/investment-thesis" },
    { label: "Agents", title: "Sideline Desk", href: "/nouns-nation-battler-agents/desk/" },
    { label: "Missions", title: "Sprint JSON", href: "/nouns-nation-battler-sprint.json" },
    { label: "Data", title: "Nation JSON", href: "/nouns-nation.json" },
    { label: "Game", title: "Battler JSON", href: "/nouns-nation-battler.json" }
  ];
  const fallbackTeams = [
    { short: "TN", name: "Tomato Noggles", alive: 30, color: "#e45745" },
    { short: "CF", name: "Cobalt Frames", alive: 30, color: "#3677e0" }
  ];
  const signature = {
    line: "Signed Michael Hoydich x Codex 5.5 extra-high",
    place: "El Segundo, California",
    date: "2026-04-29",
    posture: "Build the sport as a public desk first. Then let people bring their own nations, teams, gangs, clubs, crews, DAOs, schools, shops, and leagues into the schedule when their receipts are legible."
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "PointCast Battle Desk V3: Nouns Nation Federation Desk",
    description: "A federation-minded V3 control room for Nouns Nation Battler with live match feed, season recap archive, MVP board, media coverage slate, next-season preview, rival league preview, Season 6 Sprint Room, Agent Ops public ledger, Pocket Desk phone handoffs, Fast Pass claim/share/audit handoffs, operating thought, signed posture, and bring-your-own-nation rails.",
    url: "https://pointcast.xyz/nouns-nation-battler-v3/",
    gamePlatform: "Web browser",
    genre: "Auto battler",
    inLanguage: "en-US"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () {
  'use strict';

  var SOURCE = 'pointcast:nouns-nation-battler';
  var CONTROL_SOURCE = 'pointcast:battle-desk';
  var desk = document.querySelector('[data-battle-v3]');
  var frame = document.getElementById('battleFrameV3');
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

  function updateCopyState(button, label) {
    var status = button.querySelector('[data-copy-status]');
    if (status) status.textContent = label;
    button.setAttribute('data-copy-state', label.toLowerCase());
    window.setTimeout(function () {
      if (status) status.textContent = 'Ready';
      button.removeAttribute('data-copy-state');
    }, 1600);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (error) {
      return false;
    } finally {
      document.body.removeChild(area);
    }
  }

  function copyAction(button) {
    var text = button.getAttribute('data-copy-text') || '';
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(function () { updateCopyState(button, 'Copied'); })
        .catch(function () { updateCopyState(button, fallbackCopy(text) ? 'Copied' : 'Failed'); });
      return;
    }
    updateCopyState(button, fallbackCopy(text) ? 'Copied' : 'Failed');
  }

  function initOpsLedger() {
    var opsRoot = find('[data-ops-ledger]');
    if (!opsRoot) return;

    var endpoint = opsRoot.getAttribute('data-ops-endpoint') || '/api/nouns-battler/ops';
    var storageKey = opsRoot.getAttribute('data-ops-storage-key') || 'pc:nouns-battler:ops-drafts';
    var form = opsRoot.querySelector('[data-ops-form]');
    var listNode = opsRoot.querySelector('[data-ops-list]');
    var statusLine = opsRoot.querySelector('[data-ops-status-line]');
    var actionInput = opsRoot.querySelector('[data-ops-action-input]');
    var statusInput = opsRoot.querySelector('[data-ops-status-input]');
    var missionInput = opsRoot.querySelector('[data-ops-mission]');
    var artifactInput = opsRoot.querySelector('[data-ops-artifact]');
    var copyButton = opsRoot.querySelector('[data-ops-copy]');
    if (!form || !listNode || !actionInput || !statusInput || !missionInput || !copyButton) return;

    function setStatus(message, kind) {
      if (!statusLine) return;
      statusLine.textContent = message;
      statusLine.setAttribute('data-state', kind || 'ready');
    }

    function selectedMissionLabel() {
      var option = missionInput.options[missionInput.selectedIndex];
      return option ? option.textContent.replace(/\\s+/g, ' ').trim() : missionInput.value;
    }

    function updateArtifactDefault(force) {
      if (!artifactInput) return;
      var option = missionInput.options[missionInput.selectedIndex];
      var artifact = option ? option.getAttribute('data-artifact') || '' : '';
      if (force || !artifactInput.value || artifactInput.getAttribute('data-auto-artifact') === 'true') {
        artifactInput.value = artifact;
        artifactInput.setAttribute('data-auto-artifact', 'true');
      }
    }

    function payloadFromForm() {
      var data = new FormData(form);
      var payload = {
        type: String(data.get('type') || 'nouns-battler-ops-v1'),
        action: String(data.get('action') || 'claim'),
        missionId: String(data.get('missionId') || ''),
        handle: String(data.get('handle') || '').trim(),
        artifact: String(data.get('artifact') || '').trim(),
        status: String(data.get('status') || 'claimed'),
        proofUrl: String(data.get('proofUrl') || '').trim(),
        notes: String(data.get('notes') || '').trim(),
      };
      if (!payload.artifact) delete payload.artifact;
      if (!payload.proofUrl) delete payload.proofUrl;
      if (!payload.notes) delete payload.notes;
      return payload;
    }

    function handoffText(payload) {
      var proof = payload.proofUrl || 'proof gap visible';
      var notes = payload.notes || 'next operator should verify public receipts before claiming approval';
      return 'AGENT OPS ' + payload.action.toUpperCase() + ': mission ' + payload.missionId +
        '; mission label ' + selectedMissionLabel() +
        '; handle ' + (payload.handle || '{handle}') +
        '; artifact ' + (payload.artifact || '{artifact}') +
        '; status ' + payload.status +
        '; proof ' + proof +
        '; notes ' + notes +
        '; ledger https://pointcast.xyz/nouns-nation-battler-v3/#ops-ledger; API https://pointcast.xyz/api/nouns-battler/ops.';
    }

    function updateHandoffCopy() {
      copyButton.setAttribute('data-copy-text', handoffText(payloadFromForm()));
    }

    function saveDraft(payload, reason) {
      var draft = {
        ...payload,
        savedAt: new Date().toISOString(),
        reason: reason || 'api-unavailable',
        handoff: handoffText(payload),
      };
      try {
        var drafts = JSON.parse(localStorage.getItem(storageKey) || '[]');
        drafts.unshift(draft);
        localStorage.setItem(storageKey, JSON.stringify(drafts.slice(0, 10)));
      } catch (error) {
        /* Draft fallback is best-effort only. */
      }
      copyButton.setAttribute('data-copy-text', draft.handoff);
      return draft;
    }

    function entryDate(entry) {
      if (!entry || !entry.timestamp) return '';
      try {
        return new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      } catch (error) {
        return entry.timestamp;
      }
    }

    function renderEntries(entries, note) {
      if (!entries || !entries.length) {
        listNode.innerHTML = '<article><strong>No public ops yet</strong><p>' + escapeHtml(note || 'Claim, report, or hand off one Season 6 mission to start the ledger.') + '</p></article>';
        return;
      }
      listNode.innerHTML = entries.map(function (row) {
        var entry = row && row.entry ? row.entry : row;
        if (!entry) return '';
        var proof = entry.proofUrl
          ? '<a href="' + escapeHtml(entry.proofUrl) + '">Proof</a>'
          : '<em>Proof gap</em>';
        return '<article>' +
          '<span>' + escapeHtml(entry.action || 'ops') + ' / ' + escapeHtml(entry.status || 'posted') + '</span>' +
          '<strong>' + escapeHtml(entry.missionTitle || entry.missionId || 'Season 6 mission') + '</strong>' +
          '<p>' + escapeHtml(entry.artifact || 'No artifact named yet') + '</p>' +
          '<small>' + escapeHtml(entry.handle || 'operator') + ' / ' + escapeHtml(entryDate(entry)) + '</small>' +
          (entry.notes ? '<p>' + escapeHtml(entry.notes) + '</p>' : '') +
          proof +
        '</article>';
      }).join('');
    }

    async function loadOps() {
      try {
        var response = await fetch(endpoint + '?action=list&limit=20', { cache: 'no-store' });
        var json = await response.json();
        if (!response.ok || !json.ok) {
          renderEntries([], json.reason === 'kv-unbound' ? 'Public KV is not bound yet; local fallback drafts still work.' : 'Ledger temporarily unavailable.');
          setStatus(json.reason === 'kv-unbound' ? 'KV unavailable. Fallback drafts enabled.' : 'Ledger list unavailable. Fallback drafts enabled.', 'warn');
          return;
        }
        renderEntries(json.entries || []);
        setStatus('Ledger loaded. Public handle only.', 'ready');
      } catch (error) {
        renderEntries([], 'Ledger temporarily unavailable; local fallback drafts still work.');
        setStatus('Ledger list failed. Fallback drafts enabled.', 'warn');
      }
    }

    Array.prototype.forEach.call(opsRoot.querySelectorAll('[data-ops-action]'), function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-ops-action') || 'claim';
        var status = button.getAttribute('data-ops-status') || 'claimed';
        actionInput.value = action;
        statusInput.value = status;
        Array.prototype.forEach.call(opsRoot.querySelectorAll('[data-ops-action]'), function (other) {
          var active = other === button;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        updateHandoffCopy();
      });
    });

    function resetActionButtons() {
      Array.prototype.forEach.call(opsRoot.querySelectorAll('[data-ops-action]'), function (button) {
        var active = button.getAttribute('data-ops-action') === 'claim';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    missionInput.addEventListener('change', function () {
      updateArtifactDefault(true);
      updateHandoffCopy();
    });
    if (artifactInput) {
      artifactInput.addEventListener('input', function () {
        artifactInput.setAttribute('data-auto-artifact', 'false');
        updateHandoffCopy();
      });
    }
    form.addEventListener('input', updateHandoffCopy);
    form.addEventListener('change', updateHandoffCopy);

    var refresh = opsRoot.querySelector('[data-ops-refresh]');
    if (refresh) refresh.addEventListener('click', loadOps);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var payload = payloadFromForm();
      updateHandoffCopy();
      setStatus('Posting public ops entry...', 'busy');
      try {
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        var result = await response.json();
        if (!response.ok || !result.ok) {
          var fallback = saveDraft(payload, result.reason || result.error || 'api-unavailable');
          setStatus('Saved local fallback draft. Copy handoff is ready.', 'warn');
          renderEntries([fallback], 'Local fallback draft saved.');
          return;
        }
        setStatus('Posted to public Agent Ops ledger.', 'ok');
        form.reset();
        actionInput.value = 'claim';
        statusInput.value = 'claimed';
        resetActionButtons();
        updateArtifactDefault(true);
        updateHandoffCopy();
        loadOps();
      } catch (error) {
        var fallback = saveDraft(payload, 'network-failed');
        setStatus('Network failed. Saved local fallback draft and prepared handoff copy.', 'warn');
        renderEntries([fallback], 'Local fallback draft saved.');
      }
    });

    updateArtifactDefault(true);
    updateHandoffCopy();
    loadOps();
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
      .slice(0, 6);

    if (!rows.length) return;
    node.innerHTML = rows.map(function (unit, index) {
      var stats = unit.stats || {};
      return '<article>' +
        '<img src="' + escapeHtml(assetPath(unit.asset)) + '" alt="" loading="lazy" />' +
        '<span>' + String(index + 1) + ' / #' + escapeHtml(unit.number || '?') + ' / ' + escapeHtml(unit.role || 'noun') + '</span>' +
        '<strong>' + escapeHtml(unit.name || 'Noun') + '</strong>' +
        '<em>' + escapeHtml(stats.damage || 0) + ' dmg / ' + escapeHtml(stats.kos || 0) + ' KO</em>' +
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
    var left = payload.alive ? Number(payload.alive.left || 0) : 30;
    var right = payload.alive ? Number(payload.alive.right || 0) : 30;
    var total = Math.max(1, left + right);
    var leftShare = (left / total) * 100;
    var rightShare = 100 - leftShare;
    var speed = Number(payload.speed || 1);
    var stateLabel = payload.finished ? 'FINAL' : (payload.running ? 'LIVE' : 'PAUSED');
    var fieldName = payload.field && payload.field.boss ? payload.field.boss : ((payload.field && payload.field.name) || 'Open Field');
    var pressureLabel = Math.abs(left - right) < 2
      ? 'Even field'
      : (left > right ? leftGang.short + ' controls tempo' : rightGang.short + ' controls tempo');
    var challenge = payload.challenge
      ? payload.challenge.name + ': ' + payload.challenge.line + '. ' + payload.challenge.rule
      : 'Challenge loading from the match engine.';
    var weather = payload.weather && payload.weather.name ? payload.weather.name : (payload.weather || 'Clear');

    desk.style.setProperty('--left-team', leftGang.color || '#e45745');
    desk.style.setProperty('--right-team', rightGang.color || '#3677e0');
    desk.style.setProperty('--left-share', leftShare.toFixed(1) + '%');
    desk.style.setProperty('--right-share', rightShare.toFixed(1) + '%');

    setText('[data-live-field="state"]', stateLabel);
    setText('[data-live-field="match"]', String(payload.match || 1));
    setText('[data-live-field="left-short"]', leftGang.short || 'L');
    setText('[data-live-field="left-name"]', leftGang.name || 'Left Gang');
    setText('[data-live-field="left-alive"]', String(left));
    setText('[data-live-field="left-pressure"]', Math.round(leftShare) + '%');
    setText('[data-live-field="right-short"]', rightGang.short || 'R');
    setText('[data-live-field="right-name"]', rightGang.name || 'Right Gang');
    setText('[data-live-field="right-alive"]', String(right));
    setText('[data-live-field="right-pressure"]', Math.round(rightShare) + '%');
    setText('[data-live-field="league-line"]', payload.league && payload.league.line ? payload.league.line : 'League loading');
    setText('[data-live-field="matchup"]', payload.league && payload.league.matchup ? payload.league.matchup : 'Nouns Nation Battler');
    setText('[data-live-field="field"]', fieldName);
    setText('[data-live-field="control-copy"]', stateLabel === 'LIVE' ? 'Live engine locked' : 'Engine hold');
    setText('[data-live-field="analyst-headline"]', pressureLabel);
    setText('[data-live-field="challenge"]', challenge);
    setText('[data-live-field="total-live"]', String(total));
    setText('[data-live-field="speed"]', speedLabel(speed));
    setText('[data-live-field="weather"]', weather);

    Array.prototype.forEach.call(desk.querySelectorAll('[data-speed]'), function (button) {
      button.classList.toggle('is-active', Number(button.dataset.speed) === speed);
    });

    renderTopNouns(payload.leaders);
    renderLog(payload.logs);
  }

  desk.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var copyButton = target.closest('[data-copy-action]');
    if (copyButton && desk.contains(copyButton)) {
      copyAction(copyButton);
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

  initOpsLedger();

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
  var desk = document.querySelector('[data-battle-v3]');
  var frame = document.getElementById('battleFrameV3');
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

  function updateCopyState(button, label) {
    var status = button.querySelector('[data-copy-status]');
    if (status) status.textContent = label;
    button.setAttribute('data-copy-state', label.toLowerCase());
    window.setTimeout(function () {
      if (status) status.textContent = 'Ready';
      button.removeAttribute('data-copy-state');
    }, 1600);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (error) {
      return false;
    } finally {
      document.body.removeChild(area);
    }
  }

  function copyAction(button) {
    var text = button.getAttribute('data-copy-text') || '';
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(function () { updateCopyState(button, 'Copied'); })
        .catch(function () { updateCopyState(button, fallbackCopy(text) ? 'Copied' : 'Failed'); });
      return;
    }
    updateCopyState(button, fallbackCopy(text) ? 'Copied' : 'Failed');
  }

  function initOpsLedger() {
    var opsRoot = find('[data-ops-ledger]');
    if (!opsRoot) return;

    var endpoint = opsRoot.getAttribute('data-ops-endpoint') || '/api/nouns-battler/ops';
    var storageKey = opsRoot.getAttribute('data-ops-storage-key') || 'pc:nouns-battler:ops-drafts';
    var form = opsRoot.querySelector('[data-ops-form]');
    var listNode = opsRoot.querySelector('[data-ops-list]');
    var statusLine = opsRoot.querySelector('[data-ops-status-line]');
    var actionInput = opsRoot.querySelector('[data-ops-action-input]');
    var statusInput = opsRoot.querySelector('[data-ops-status-input]');
    var missionInput = opsRoot.querySelector('[data-ops-mission]');
    var artifactInput = opsRoot.querySelector('[data-ops-artifact]');
    var copyButton = opsRoot.querySelector('[data-ops-copy]');
    if (!form || !listNode || !actionInput || !statusInput || !missionInput || !copyButton) return;

    function setStatus(message, kind) {
      if (!statusLine) return;
      statusLine.textContent = message;
      statusLine.setAttribute('data-state', kind || 'ready');
    }

    function selectedMissionLabel() {
      var option = missionInput.options[missionInput.selectedIndex];
      return option ? option.textContent.replace(/\\\\s+/g, ' ').trim() : missionInput.value;
    }

    function updateArtifactDefault(force) {
      if (!artifactInput) return;
      var option = missionInput.options[missionInput.selectedIndex];
      var artifact = option ? option.getAttribute('data-artifact') || '' : '';
      if (force || !artifactInput.value || artifactInput.getAttribute('data-auto-artifact') === 'true') {
        artifactInput.value = artifact;
        artifactInput.setAttribute('data-auto-artifact', 'true');
      }
    }

    function payloadFromForm() {
      var data = new FormData(form);
      var payload = {
        type: String(data.get('type') || 'nouns-battler-ops-v1'),
        action: String(data.get('action') || 'claim'),
        missionId: String(data.get('missionId') || ''),
        handle: String(data.get('handle') || '').trim(),
        artifact: String(data.get('artifact') || '').trim(),
        status: String(data.get('status') || 'claimed'),
        proofUrl: String(data.get('proofUrl') || '').trim(),
        notes: String(data.get('notes') || '').trim(),
      };
      if (!payload.artifact) delete payload.artifact;
      if (!payload.proofUrl) delete payload.proofUrl;
      if (!payload.notes) delete payload.notes;
      return payload;
    }

    function handoffText(payload) {
      var proof = payload.proofUrl || 'proof gap visible';
      var notes = payload.notes || 'next operator should verify public receipts before claiming approval';
      return 'AGENT OPS ' + payload.action.toUpperCase() + ': mission ' + payload.missionId +
        '; mission label ' + selectedMissionLabel() +
        '; handle ' + (payload.handle || '{handle}') +
        '; artifact ' + (payload.artifact || '{artifact}') +
        '; status ' + payload.status +
        '; proof ' + proof +
        '; notes ' + notes +
        '; ledger https://pointcast.xyz/nouns-nation-battler-v3/#ops-ledger; API https://pointcast.xyz/api/nouns-battler/ops.';
    }

    function updateHandoffCopy() {
      copyButton.setAttribute('data-copy-text', handoffText(payloadFromForm()));
    }

    function saveDraft(payload, reason) {
      var draft = {
        ...payload,
        savedAt: new Date().toISOString(),
        reason: reason || 'api-unavailable',
        handoff: handoffText(payload),
      };
      try {
        var drafts = JSON.parse(localStorage.getItem(storageKey) || '[]');
        drafts.unshift(draft);
        localStorage.setItem(storageKey, JSON.stringify(drafts.slice(0, 10)));
      } catch (error) {
        /* Draft fallback is best-effort only. */
      }
      copyButton.setAttribute('data-copy-text', draft.handoff);
      return draft;
    }

    function entryDate(entry) {
      if (!entry || !entry.timestamp) return '';
      try {
        return new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      } catch (error) {
        return entry.timestamp;
      }
    }

    function renderEntries(entries, note) {
      if (!entries || !entries.length) {
        listNode.innerHTML = '<article><strong>No public ops yet</strong><p>' + escapeHtml(note || 'Claim, report, or hand off one Season 6 mission to start the ledger.') + '</p></article>';
        return;
      }
      listNode.innerHTML = entries.map(function (row) {
        var entry = row && row.entry ? row.entry : row;
        if (!entry) return '';
        var proof = entry.proofUrl
          ? '<a href="' + escapeHtml(entry.proofUrl) + '">Proof</a>'
          : '<em>Proof gap</em>';
        return '<article>' +
          '<span>' + escapeHtml(entry.action || 'ops') + ' / ' + escapeHtml(entry.status || 'posted') + '</span>' +
          '<strong>' + escapeHtml(entry.missionTitle || entry.missionId || 'Season 6 mission') + '</strong>' +
          '<p>' + escapeHtml(entry.artifact || 'No artifact named yet') + '</p>' +
          '<small>' + escapeHtml(entry.handle || 'operator') + ' / ' + escapeHtml(entryDate(entry)) + '</small>' +
          (entry.notes ? '<p>' + escapeHtml(entry.notes) + '</p>' : '') +
          proof +
        '</article>';
      }).join('');
    }

    async function loadOps() {
      try {
        var response = await fetch(endpoint + '?action=list&limit=20', { cache: 'no-store' });
        var json = await response.json();
        if (!response.ok || !json.ok) {
          renderEntries([], json.reason === 'kv-unbound' ? 'Public KV is not bound yet; local fallback drafts still work.' : 'Ledger temporarily unavailable.');
          setStatus(json.reason === 'kv-unbound' ? 'KV unavailable. Fallback drafts enabled.' : 'Ledger list unavailable. Fallback drafts enabled.', 'warn');
          return;
        }
        renderEntries(json.entries || []);
        setStatus('Ledger loaded. Public handle only.', 'ready');
      } catch (error) {
        renderEntries([], 'Ledger temporarily unavailable; local fallback drafts still work.');
        setStatus('Ledger list failed. Fallback drafts enabled.', 'warn');
      }
    }

    Array.prototype.forEach.call(opsRoot.querySelectorAll('[data-ops-action]'), function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-ops-action') || 'claim';
        var status = button.getAttribute('data-ops-status') || 'claimed';
        actionInput.value = action;
        statusInput.value = status;
        Array.prototype.forEach.call(opsRoot.querySelectorAll('[data-ops-action]'), function (other) {
          var active = other === button;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        updateHandoffCopy();
      });
    });

    function resetActionButtons() {
      Array.prototype.forEach.call(opsRoot.querySelectorAll('[data-ops-action]'), function (button) {
        var active = button.getAttribute('data-ops-action') === 'claim';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    missionInput.addEventListener('change', function () {
      updateArtifactDefault(true);
      updateHandoffCopy();
    });
    if (artifactInput) {
      artifactInput.addEventListener('input', function () {
        artifactInput.setAttribute('data-auto-artifact', 'false');
        updateHandoffCopy();
      });
    }
    form.addEventListener('input', updateHandoffCopy);
    form.addEventListener('change', updateHandoffCopy);

    var refresh = opsRoot.querySelector('[data-ops-refresh]');
    if (refresh) refresh.addEventListener('click', loadOps);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var payload = payloadFromForm();
      updateHandoffCopy();
      setStatus('Posting public ops entry...', 'busy');
      try {
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        var result = await response.json();
        if (!response.ok || !result.ok) {
          var fallback = saveDraft(payload, result.reason || result.error || 'api-unavailable');
          setStatus('Saved local fallback draft. Copy handoff is ready.', 'warn');
          renderEntries([fallback], 'Local fallback draft saved.');
          return;
        }
        setStatus('Posted to public Agent Ops ledger.', 'ok');
        form.reset();
        actionInput.value = 'claim';
        statusInput.value = 'claimed';
        resetActionButtons();
        updateArtifactDefault(true);
        updateHandoffCopy();
        loadOps();
      } catch (error) {
        var fallback = saveDraft(payload, 'network-failed');
        setStatus('Network failed. Saved local fallback draft and prepared handoff copy.', 'warn');
        renderEntries([fallback], 'Local fallback draft saved.');
      }
    });

    updateArtifactDefault(true);
    updateHandoffCopy();
    loadOps();
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
      .slice(0, 6);

    if (!rows.length) return;
    node.innerHTML = rows.map(function (unit, index) {
      var stats = unit.stats || {};
      return '<article>' +
        '<img src="' + escapeHtml(assetPath(unit.asset)) + '" alt="" loading="lazy" />' +
        '<span>' + String(index + 1) + ' / #' + escapeHtml(unit.number || '?') + ' / ' + escapeHtml(unit.role || 'noun') + '</span>' +
        '<strong>' + escapeHtml(unit.name || 'Noun') + '</strong>' +
        '<em>' + escapeHtml(stats.damage || 0) + ' dmg / ' + escapeHtml(stats.kos || 0) + ' KO</em>' +
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
    var left = payload.alive ? Number(payload.alive.left || 0) : 30;
    var right = payload.alive ? Number(payload.alive.right || 0) : 30;
    var total = Math.max(1, left + right);
    var leftShare = (left / total) * 100;
    var rightShare = 100 - leftShare;
    var speed = Number(payload.speed || 1);
    var stateLabel = payload.finished ? 'FINAL' : (payload.running ? 'LIVE' : 'PAUSED');
    var fieldName = payload.field && payload.field.boss ? payload.field.boss : ((payload.field && payload.field.name) || 'Open Field');
    var pressureLabel = Math.abs(left - right) < 2
      ? 'Even field'
      : (left > right ? leftGang.short + ' controls tempo' : rightGang.short + ' controls tempo');
    var challenge = payload.challenge
      ? payload.challenge.name + ': ' + payload.challenge.line + '. ' + payload.challenge.rule
      : 'Challenge loading from the match engine.';
    var weather = payload.weather && payload.weather.name ? payload.weather.name : (payload.weather || 'Clear');

    desk.style.setProperty('--left-team', leftGang.color || '#e45745');
    desk.style.setProperty('--right-team', rightGang.color || '#3677e0');
    desk.style.setProperty('--left-share', leftShare.toFixed(1) + '%');
    desk.style.setProperty('--right-share', rightShare.toFixed(1) + '%');

    setText('[data-live-field="state"]', stateLabel);
    setText('[data-live-field="match"]', String(payload.match || 1));
    setText('[data-live-field="left-short"]', leftGang.short || 'L');
    setText('[data-live-field="left-name"]', leftGang.name || 'Left Gang');
    setText('[data-live-field="left-alive"]', String(left));
    setText('[data-live-field="left-pressure"]', Math.round(leftShare) + '%');
    setText('[data-live-field="right-short"]', rightGang.short || 'R');
    setText('[data-live-field="right-name"]', rightGang.name || 'Right Gang');
    setText('[data-live-field="right-alive"]', String(right));
    setText('[data-live-field="right-pressure"]', Math.round(rightShare) + '%');
    setText('[data-live-field="league-line"]', payload.league && payload.league.line ? payload.league.line : 'League loading');
    setText('[data-live-field="matchup"]', payload.league && payload.league.matchup ? payload.league.matchup : 'Nouns Nation Battler');
    setText('[data-live-field="field"]', fieldName);
    setText('[data-live-field="control-copy"]', stateLabel === 'LIVE' ? 'Live engine locked' : 'Engine hold');
    setText('[data-live-field="analyst-headline"]', pressureLabel);
    setText('[data-live-field="challenge"]', challenge);
    setText('[data-live-field="total-live"]', String(total));
    setText('[data-live-field="speed"]', speedLabel(speed));
    setText('[data-live-field="weather"]', weather);

    Array.prototype.forEach.call(desk.querySelectorAll('[data-speed]'), function (button) {
      button.classList.toggle('is-active', Number(button.dataset.speed) === speed);
    });

    renderTopNouns(payload.leaders);
    renderLog(payload.logs);
  }

  desk.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var copyButton = target.closest('[data-copy-action]');
    if (copyButton && desk.contains(copyButton)) {
      copyAction(copyButton);
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

  initOpsLedger();

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
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "PointCast Battle Desk V3", "description": "A federation-minded V3 desk for Nouns Nation Battler: live match feed, season recap archive, MVP board, media angles, next-season and rival-league previews, Season 6 Sprint Room, Agent Ops public ledger, Pocket Desk phone handoffs, Fast Pass claim/share/audit handoffs, portable receipts, bring-your-own-nation rails, and a signed Michael Hoydich x Codex 5.5 extra-high operating thought.", "image": "/images/og/nouns-battler-v3.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation.json", title: "Nouns Nation federation manifest (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler-sprint.json", title: "Season 6 Sprint Room missions (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-v3.png",
    buttons: [
      { label: "Watch V3", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-v3/" },
      { label: "Bowl Path", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-bowl/" },
      { label: "Moon Cup", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-moon/" },
      { label: "Nouns Nation", action: "link", target: "https://pointcast.xyz/nouns-nation/" },
      { label: "Bring a Nation", action: "link", target: "https://pointcast.xyz/nouns-nation/join/" },
      { label: "Sprint JSON", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-sprint.json" },
      { label: "Nation JSON", action: "link", target: "https://pointcast.xyz/nouns-nation.json" }
    ]
  }, "data-astro-cid-uh3tz5ep": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="battle-v3" data-battle-v3${addAttribute(`--btl: ${ch.color600}; --btl-dark: ${ch.color800}; --btl-soft: ${ch.color50}; --left-team: ${fallbackTeams[0].color}; --right-team: ${fallbackTeams[1].color}; --left-share: 50%; --right-share: 50%;`, "style")} data-astro-cid-uh3tz5ep> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-uh3tz5ep> <a href="/" data-astro-cid-uh3tz5ep>Home</a> <span aria-hidden="true" data-astro-cid-uh3tz5ep>/</span> <a href="/nouns-nation/" data-astro-cid-uh3tz5ep>Nouns Nation</a> <span aria-hidden="true" data-astro-cid-uh3tz5ep>/</span> <a href="/nouns-nation-battler-v2/" data-astro-cid-uh3tz5ep>Battle Desk V2</a> <span aria-hidden="true" data-astro-cid-uh3tz5ep>/</span> <span data-astro-cid-uh3tz5ep>V3</span> </nav> <section class="signal-bar" aria-label="V3 ticker" data-astro-cid-uh3tz5ep> <div class="signal-bar__brand" data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>PointCast BTL</span> <strong data-astro-cid-uh3tz5ep>Federation Desk V3</strong> </div> <div class="signal-bar__ticker" data-astro-cid-uh3tz5ep> <span data-live-field="state" data-astro-cid-uh3tz5ep>LIVE</span> <div data-astro-cid-uh3tz5ep> <p data-astro-cid-uh3tz5ep> ${tickerItems.concat(tickerItems).map((item) => renderTemplate`<span data-astro-cid-uh3tz5ep>${item}</span>`)} </p> </div> </div> <a href="/nouns-nation/join/" data-astro-cid-uh3tz5ep>Bring</a> </section> <section class="hero" aria-labelledby="battle-v3-title" data-astro-cid-uh3tz5ep> <div class="hero__copy" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>NEXT VERSION / FEDERATION THOUGHT</p> <h1 id="battle-v3-title" data-astro-cid-uh3tz5ep>Battle Desk V3 is the league operating room.</h1> <p data-astro-cid-uh3tz5ep>
The thought is simple: ESPN-style watchability is the front door, but federation is the
          long game. Give every match a clean desk, every result a portable receipt, and every outside
          nation a way to show up without losing its own identity.
</p> <nav class="hero__actions" aria-label="Battle Desk V3 actions" data-astro-cid-uh3tz5ep> <a class="primary" href="#live" data-astro-cid-uh3tz5ep>Watch live</a> <a href="#season-recap" data-astro-cid-uh3tz5ep>Season recap</a> <a href="#sprint-room" data-astro-cid-uh3tz5ep>Sprint room</a> <a href="#pocket-desk" data-astro-cid-uh3tz5ep>Pocket desk</a> <a href="#ops-ledger" data-astro-cid-uh3tz5ep>Agent ops</a> <a href="#claim-pass" data-astro-cid-uh3tz5ep>Fast pass</a> <a href="/nouns-nation/federation/" data-astro-cid-uh3tz5ep>Read strategy</a> <a href="/nouns-nation/join/" data-astro-cid-uh3tz5ep>Bring a nation</a> </nav> </div> <aside class="signature" aria-label="Signed thought" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Operator signature</p> <strong data-astro-cid-uh3tz5ep>${signature.line}</strong> <p data-astro-cid-uh3tz5ep>${signature.posture}</p> <span data-astro-cid-uh3tz5ep>${signature.place} / ${signature.date}</span> </aside> </section> <section class="scorebar" aria-label="Live matchup summary" data-astro-cid-uh3tz5ep> <article data-astro-cid-uh3tz5ep> <span data-live-field="left-short" data-astro-cid-uh3tz5ep>${fallbackTeams[0].short}</span> <strong data-live-field="left-name" data-astro-cid-uh3tz5ep>${fallbackTeams[0].name}</strong> <em data-astro-cid-uh3tz5ep><b data-live-field="left-alive" data-astro-cid-uh3tz5ep>${fallbackTeams[0].alive}</b> alive</em> </article> <div data-astro-cid-uh3tz5ep> <span data-live-field="league-line" data-astro-cid-uh3tz5ep>Day 1 / Slate 1</span> <strong data-live-field="matchup" data-astro-cid-uh3tz5ep>Nouns Nation Battler</strong> <i data-astro-cid-uh3tz5ep><span data-live-field="left-pressure" data-astro-cid-uh3tz5ep>50%</span><span data-live-field="right-pressure" data-astro-cid-uh3tz5ep>50%</span></i> </div> <article data-astro-cid-uh3tz5ep> <span data-live-field="right-short" data-astro-cid-uh3tz5ep>${fallbackTeams[1].short}</span> <strong data-live-field="right-name" data-astro-cid-uh3tz5ep>${fallbackTeams[1].name}</strong> <em data-astro-cid-uh3tz5ep><b data-live-field="right-alive" data-astro-cid-uh3tz5ep>${fallbackTeams[1].alive}</b> alive</em> </article> </section> <section class="controls" aria-label="Desk controls" data-astro-cid-uh3tz5ep> <button type="button" data-desk-command="newMatch" data-astro-cid-uh3tz5ep>Next</button> <button type="button" data-desk-command="quickSim" data-astro-cid-uh3tz5ep>Quick Sim</button> <button type="button" data-desk-command="simDay" data-astro-cid-uh3tz5ep>Sim Day</button> <button type="button" data-desk-command="togglePause" data-astro-cid-uh3tz5ep>Pause</button> <button type="button" data-desk-command="setAutoNext" data-astro-cid-uh3tz5ep>Auto Next</button> <button type="button" data-desk-command="setSpeed" data-speed="0.75" data-astro-cid-uh3tz5ep>Slow</button> <button type="button" class="is-active" data-desk-command="setSpeed" data-speed="1" data-astro-cid-uh3tz5ep>Live</button> <button type="button" data-desk-command="setSpeed" data-speed="1.55" data-astro-cid-uh3tz5ep>Rush</button> <button type="button" data-desk-command="root" data-team="0" data-astro-cid-uh3tz5ep>Root Left</button> <button type="button" data-desk-command="root" data-team="1" data-astro-cid-uh3tz5ep>Root Right</button> </section> <section id="live" class="live-grid" aria-label="Live Federation Desk" data-astro-cid-uh3tz5ep> <section class="field-panel" aria-label="Embedded match field" data-astro-cid-uh3tz5ep> <header class="section-head" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Main feed</p> <h2 data-live-field="control-copy" data-astro-cid-uh3tz5ep>Live engine locked</h2> </div> <span data-live-field="field" data-astro-cid-uh3tz5ep>Open Field</span> </header> <iframe id="battleFrameV3" src="about:blank" data-battle-src="/games/nouns-nation-battler/index.html" title="Nouns Nation Battler live field feed" loading="eager" allow="fullscreen" data-astro-cid-uh3tz5ep></iframe> </section> <aside class="desk-panel" aria-label="Live desk readout" data-astro-cid-uh3tz5ep> <section class="desk-card desk-card--hot" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Match thought</p> <h2 data-live-field="analyst-headline" data-astro-cid-uh3tz5ep>Even field</h2> <p data-live-field="challenge" data-astro-cid-uh3tz5ep>
Season challenge loading from the match engine.
</p> <div class="mini-grid" data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep><b data-live-field="match" data-astro-cid-uh3tz5ep>1</b> match</span> <span data-astro-cid-uh3tz5ep><b data-live-field="total-live" data-astro-cid-uh3tz5ep>60</b> live</span> <span data-astro-cid-uh3tz5ep><b data-live-field="speed" data-astro-cid-uh3tz5ep>Live</b> speed</span> <span data-astro-cid-uh3tz5ep><b data-live-field="weather" data-astro-cid-uh3tz5ep>Clear</b> weather</span> </div> </section> <section class="desk-card" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Top Nouns</p> <div class="leader-board" data-live-field="top-nouns" data-astro-cid-uh3tz5ep> <article data-astro-cid-uh3tz5ep> <img src="/games/nouns-nation-battler/assets/noun-0.svg" alt="" loading="lazy" data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>#0 / pregame</span> <strong data-astro-cid-uh3tz5ep>Noun on deck</strong> <em data-astro-cid-uh3tz5ep>0 dmg / 0 KO</em> </article> </div> </section> <section class="desk-card" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Replay calls</p> <div class="replay-log" data-live-field="log" data-astro-cid-uh3tz5ep> <p data-astro-cid-uh3tz5ep>Waiting for first push.</p> </div> </section> </aside> </section> <section id="season-recap" class="season-recap" aria-labelledby="recap-title" data-astro-cid-uh3tz5ep> <div class="section-head" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Season recap desk</p> <h2 id="recap-title" data-astro-cid-uh3tz5ep>The archive makes the sport feel bigger than one match.</h2> </div> <a href="/nouns-nation-battler-desk/" data-astro-cid-uh3tz5ep>Open Desk Wall</a> </div> <div class="recap-layout" data-astro-cid-uh3tz5ep> <div class="champion-stack" aria-label="Recent season champions" data-astro-cid-uh3tz5ep> ${seasonRecaps.map((season) => renderTemplate`<article class="champion-card"${addAttribute(`--season-color: ${season.color}`, "style")} data-astro-cid-uh3tz5ep> <img${addAttribute(season.asset, "src")} alt="" loading="lazy" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${season.season} / ${season.title}</span> <strong data-astro-cid-uh3tz5ep>${season.champion}</strong> <p data-astro-cid-uh3tz5ep>${season.record} vs ${season.runnerUp}. ${season.story}</p> <em data-astro-cid-uh3tz5ep>MVP: ${season.mvp} - ${season.mvpLine}</em> </div> </article>`)} </div> <aside class="mvp-board" aria-label="MVP overview" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>MVP board</p> <h3 data-astro-cid-uh3tz5ep>Stars the desk can sell.</h3> <div data-astro-cid-uh3tz5ep> ${mvpBoard.map((item) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${item.label}</span> <strong data-astro-cid-uh3tz5ep>${item.name}</strong> <p data-astro-cid-uh3tz5ep>${item.note}</p> </article>`)} </div> </aside> </div> <div class="coverage-slate" aria-label="Media coverage angles" data-astro-cid-uh3tz5ep> ${mediaAngles.map((angle) => renderTemplate`<article class="coverage-card" data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${angle.label}</span> <strong data-astro-cid-uh3tz5ep>${angle.title}</strong> <p data-astro-cid-uh3tz5ep>${angle.body}</p> </article>`)} </div> <section class="next-season-panel" aria-labelledby="next-season-title" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Next season preview</p> <h3 id="next-season-title" data-astro-cid-uh3tz5ep>What the studio should argue about before kickoff.</h3> <div class="preview-grid" data-astro-cid-uh3tz5ep> ${nextSeasonPreview.map((item) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${item.label}</span> <strong data-astro-cid-uh3tz5ep>${item.title}</strong> <p data-astro-cid-uh3tz5ep>${item.body}</p> </article>`)} </div> </div> <aside class="rival-league" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Rival league</p> <h3 data-astro-cid-uh3tz5ep>${rivalLeaguePreview.name}</h3> <p data-astro-cid-uh3tz5ep>${rivalLeaguePreview.tagline}</p> <div data-astro-cid-uh3tz5ep> ${rivalLeaguePreview.table.map((team) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${team.code}</span> <strong data-astro-cid-uh3tz5ep>${team.name}</strong> <p data-astro-cid-uh3tz5ep>${team.angle}</p> </article>`)} </div> <em data-astro-cid-uh3tz5ep>${rivalLeaguePreview.question}</em> </aside> </section> </section> <section id="sprint-room" class="sprint-room" aria-labelledby="sprint-title" data-astro-cid-uh3tz5ep> <div class="section-head" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Next sprint</p> <h2 id="sprint-title" data-astro-cid-uh3tz5ep>Season 6 gets an actual launch room.</h2> </div> <a href="/nouns-nation/join/" data-astro-cid-uh3tz5ep>Open intake</a> </div> <div class="sprint-brief" data-astro-cid-uh3tz5ep> <article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${sprintBrief.label}</span> <strong data-astro-cid-uh3tz5ep>${sprintBrief.title}</strong> <p data-astro-cid-uh3tz5ep>${sprintBrief.thesis}</p> <em data-astro-cid-uh3tz5ep>${sprintBrief.northStar}</em> </article> <aside data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Status</span> <strong data-astro-cid-uh3tz5ep>${sprintBrief.status}</strong> <p data-astro-cid-uh3tz5ep>
The sport needs more than matches now: it needs a commissioner calendar,
            a public combine, media products, and rival-league pressure.
</p> </aside> </div> <section id="claim-pass" class="claim-pass" aria-labelledby="claim-pass-title" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Fast pass</p> <h3 id="claim-pass-title" data-astro-cid-uh3tz5ep>Copy the next action before the room cools.</h3> <p data-astro-cid-uh3tz5ep>${NOUNS_BATTLER_SEASON_6_FAST_PASS.guardrail}</p> </div> <div class="claim-pass__cards" data-astro-cid-uh3tz5ep> ${NOUNS_BATTLER_SEASON_6_FAST_PASS.cards.map((card) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${card.label}</span> <strong data-astro-cid-uh3tz5ep>${card.title}</strong> <p data-astro-cid-uh3tz5ep>${card.body}</p> <div class="claim-pass__actions" data-astro-cid-uh3tz5ep> <a${addAttribute(card.href, "href")} data-astro-cid-uh3tz5ep>Open</a> <button type="button" data-copy-action${addAttribute(card.copyText, "data-copy-text")} data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${card.cta}</span> <small data-copy-status data-astro-cid-uh3tz5ep>Ready</small> </button> </div> </article>`)} </div> </section> <section id="pocket-desk" class="pocket-desk" aria-labelledby="pocket-desk-title" data-astro-cid-uh3tz5ep> <div class="pocket-desk__head" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Pocket desk</p> <h3 id="pocket-desk-title" data-astro-cid-uh3tz5ep>${NOUNS_BATTLER_SEASON_6_POCKET_DESK.title}</h3> <p data-astro-cid-uh3tz5ep>${NOUNS_BATTLER_SEASON_6_POCKET_DESK.summary}</p> </div> <div class="pocket-desk__rail" data-astro-cid-uh3tz5ep> ${NOUNS_BATTLER_SEASON_6_POCKET_DESK.cards.map((card) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${card.label}</span> <strong data-astro-cid-uh3tz5ep>${card.title}</strong> <p data-astro-cid-uh3tz5ep>${card.body}</p> <div class="pocket-desk__actions" data-astro-cid-uh3tz5ep> <a${addAttribute(card.href, "href")} data-astro-cid-uh3tz5ep>Open</a> <button type="button" data-copy-action${addAttribute(card.copyText, "data-copy-text")} data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${card.cta}</span> <small data-copy-status data-astro-cid-uh3tz5ep>Ready</small> </button> </div> </article>`)} </div> </section> <section id="ops-ledger" class="ops-ledger" aria-labelledby="ops-ledger-title" data-ops-ledger data-ops-endpoint="/api/nouns-battler/ops"${addAttribute(NOUNS_BATTLER_AGENT_OPS_LOOP.storage.fallbackStorageKey, "data-ops-storage-key")} data-astro-cid-uh3tz5ep> <div class="ops-ledger__head" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Agent Ops</p> <h3 id="ops-ledger-title" data-astro-cid-uh3tz5ep>${NOUNS_BATTLER_AGENT_OPS_LOOP.title}</h3> <p data-astro-cid-uh3tz5ep>${NOUNS_BATTLER_AGENT_OPS_LOOP.summary}</p> <a href="/api/nouns-battler/ops" data-astro-cid-uh3tz5ep>API</a> </div> <form class="ops-form" data-ops-form data-astro-cid-uh3tz5ep> <input type="hidden" name="type" value="nouns-battler-ops-v1" data-astro-cid-uh3tz5ep> <input type="hidden" name="action" value="claim" data-ops-action-input data-astro-cid-uh3tz5ep> <div class="ops-segments" role="group" aria-label="Agent Ops action" data-astro-cid-uh3tz5ep> ${opsActionButtons.map((button, index) => renderTemplate`<button type="button"${addAttribute(["ops-segments__button", { "is-active": index === 0 }], "class:list")}${addAttribute(button.action, "data-ops-action")}${addAttribute(button.status, "data-ops-status")}${addAttribute(index === 0 ? "true" : "false", "aria-pressed")} data-astro-cid-uh3tz5ep> ${button.label} </button>`)} </div> <label data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Mission</span> <select name="missionId" data-ops-mission required data-astro-cid-uh3tz5ep> ${NOUNS_BATTLER_SEASON_6_MISSION_PACKS.map((mission) => renderTemplate`<option${addAttribute(mission.id, "value")}${addAttribute(mission.artifact, "data-artifact")} data-astro-cid-uh3tz5ep> ${mission.operator} / ${mission.title} </option>`)} </select> </label> <label data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Handle</span> <input name="handle" type="text" maxlength="48" placeholder="operator-name" autocomplete="name" required data-astro-cid-uh3tz5ep> </label> <label data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Status</span> <select name="status" data-ops-status-input required data-astro-cid-uh3tz5ep> ${opsStatusOptions.map((status, index) => renderTemplate`<option${addAttribute(status.value, "value")}${addAttribute(index === 0, "selected")} data-astro-cid-uh3tz5ep>${status.label}</option>`)} </select> </label> <label data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Artifact</span> <input name="artifact" type="text" maxlength="120" placeholder="candidate nation card" data-ops-artifact data-astro-cid-uh3tz5ep> </label> <label class="ops-form__wide" data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Proof URL</span> <input name="proofUrl" type="url" maxlength="2048" inputmode="url" placeholder="https://..." data-astro-cid-uh3tz5ep> </label> <label class="ops-form__wide" data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Notes</span> <textarea name="notes" maxlength="600" rows="4" placeholder="Public proof gap, next receipt, or handoff note." data-astro-cid-uh3tz5ep></textarea> </label> <div class="ops-form__actions" data-astro-cid-uh3tz5ep> <button type="submit" data-astro-cid-uh3tz5ep>Post to ledger</button> <button type="button" data-copy-action data-ops-copy data-copy-text="" data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Copy handoff</span> <small data-copy-status data-astro-cid-uh3tz5ep>Ready</small> </button> </div> <p data-ops-status-line data-astro-cid-uh3tz5ep>Ledger ready. Public handle only.</p> </form> <aside class="ops-ledger__list" aria-live="polite" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>Latest public ops</span> <button type="button" data-ops-refresh data-astro-cid-uh3tz5ep>Refresh</button> </div> <div data-ops-list data-astro-cid-uh3tz5ep> <article data-astro-cid-uh3tz5ep> <strong data-astro-cid-uh3tz5ep>Loading ledger</strong> <p data-astro-cid-uh3tz5ep>Checking /api/nouns-battler/ops for the newest Season 6 claims, reports, and handoffs.</p> </article> </div> </aside> </section> <div class="sprint-scoreboard" aria-label="Sprint scorecard" data-astro-cid-uh3tz5ep> ${sprintScoreboard.map((item) => renderTemplate`<article data-astro-cid-uh3tz5ep> <strong data-astro-cid-uh3tz5ep>${item.metric}</strong> <span data-astro-cid-uh3tz5ep>${item.label}</span> <p data-astro-cid-uh3tz5ep>${item.note}</p> </article>`)} </div> <div class="sprint-grid" data-astro-cid-uh3tz5ep> <section class="sprint-timeline" aria-labelledby="timeline-title" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Launch calendar</p> <h3 id="timeline-title" data-astro-cid-uh3tz5ep>The next season should feel scheduled before it feels big.</h3> <div data-astro-cid-uh3tz5ep> ${sprintTimeline.map((item) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${item.day}</span> <strong data-astro-cid-uh3tz5ep>${item.title}</strong> <p data-astro-cid-uh3tz5ep>${item.body}</p> </article>`)} </div> </section> <aside class="combine-card" aria-label="Expansion combine" data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Expansion combine</p> <h3 data-astro-cid-uh3tz5ep>How a new nation enters.</h3> <div data-astro-cid-uh3tz5ep> ${expansionCombine.map((item) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${item.code}</span> <strong data-astro-cid-uh3tz5ep>${item.title}</strong> <p data-astro-cid-uh3tz5ep>${item.body}</p> </article>`)} </div> </aside> </div> <div class="media-products" aria-label="Media sprint products" data-astro-cid-uh3tz5ep> ${mediaSprintProducts.map((product) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${product.label}</span> <strong data-astro-cid-uh3tz5ep>${product.title}</strong> <p data-astro-cid-uh3tz5ep>${product.body}</p> </article>`)} </div> <section class="agent-sprint" aria-labelledby="agent-sprint-title" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Agent bench</p> <h3 id="agent-sprint-title" data-astro-cid-uh3tz5ep>The launch room has assigned operators.</h3> <p data-astro-cid-uh3tz5ep>
Season 6 should not depend on one human remembering the whole board. Each agent gets
            a narrow job, a named artifact, and a receipt-shaped way to hand it forward.
</p> </div> <div data-astro-cid-uh3tz5ep> ${sprintAgentQueue.map((agent) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${agent.code}</span> <strong data-astro-cid-uh3tz5ep>${agent.title}</strong> <p data-astro-cid-uh3tz5ep>${agent.body}</p> <em data-astro-cid-uh3tz5ep>${agent.artifact}</em> </article>`)} </div> </section> <section class="mission-board" aria-labelledby="mission-board-title" data-astro-cid-uh3tz5ep> <div class="mission-board__head" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Mission board</p> <h3 id="mission-board-title" data-astro-cid-uh3tz5ep>Agents can claim one Season 6 artifact at a time.</h3> </div> <a href="/nouns-nation-battler-sprint.json" data-astro-cid-uh3tz5ep>Mission JSON</a> </div> <div class="mission-pack-grid" data-astro-cid-uh3tz5ep> ${NOUNS_BATTLER_SEASON_6_MISSION_PACKS.map((mission) => renderTemplate`<article data-astro-cid-uh3tz5ep> <header data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${mission.operator}</span> <em data-astro-cid-uh3tz5ep>${mission.priority}</em> </header> <strong data-astro-cid-uh3tz5ep>${mission.title}</strong> <p data-astro-cid-uh3tz5ep>${mission.prompt}</p> <ul data-astro-cid-uh3tz5ep> ${mission.acceptanceChecks.map((check) => renderTemplate`<li data-astro-cid-uh3tz5ep>${check}</li>`)} </ul> <code data-astro-cid-uh3tz5ep>${mission.artifact}</code> </article>`)} </div> </section> <section class="rival-scout" aria-labelledby="rival-scout-title" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Rival scout</p> <h3 id="rival-scout-title" data-astro-cid-uh3tz5ep>Treat the Builder Circuit as pressure, not decoration.</h3> <p data-astro-cid-uh3tz5ep>
The rival league is useful because it creates urgency. If the main federation does
            not make identity, clips, proof, and fixtures easy, someone else owns the story.
</p> </div> <div data-astro-cid-uh3tz5ep> ${rivalScoutNotes.map((note) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${note.team}</span> <p data-astro-cid-uh3tz5ep>${note.read}</p> </article>`)} </div> </section> </section> <section class="thought-board" aria-labelledby="thought-title" data-astro-cid-uh3tz5ep> <div class="section-head" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>The thought</p> <h2 id="thought-title" data-astro-cid-uh3tz5ep>Federation starts as product clarity.</h2> </div> </div> <div class="thought-grid" data-astro-cid-uh3tz5ep> ${thoughtCards.map((card) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${card.label}</span> <strong data-astro-cid-uh3tz5ep>${card.title}</strong> <p data-astro-cid-uh3tz5ep>${card.body}</p> </article>`)} </div> </section> <section class="federation-lanes" aria-labelledby="lanes-title" data-astro-cid-uh3tz5ep> <div class="section-head" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Federation lanes</p> <h2 id="lanes-title" data-astro-cid-uh3tz5ep>Who gets to enter the room?</h2> </div> <a href="/nouns-nation/join/" data-astro-cid-uh3tz5ep>Open intake</a> </div> <div class="lane-grid" data-astro-cid-uh3tz5ep> ${federationLanes.map((lane) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${lane.code}</span> <strong data-astro-cid-uh3tz5ep>${lane.title}</strong> <p data-astro-cid-uh3tz5ep>${lane.body}</p> </article>`)} </div> </section> <section class="operator-loop" aria-labelledby="loop-title" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Producer loop</p> <h2 id="loop-title" data-astro-cid-uh3tz5ep>Run the league like a public newsroom.</h2> <p data-astro-cid-uh3tz5ep>
V3 treats every match as source material. Watch the field, write the receipt,
          invite the next nation, and only then expand the event format.
</p> </div> <div class="loop-list" data-astro-cid-uh3tz5ep> ${operatorLoops.map((loop) => renderTemplate`<article data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${loop.stamp}</span> <strong data-astro-cid-uh3tz5ep>${loop.title}</strong> <p data-astro-cid-uh3tz5ep>${loop.note}</p> </article>`)} </div> </section> <nav class="mobile-dock" aria-label="Mobile desk shortcuts" data-astro-cid-uh3tz5ep> <a href="#live" data-astro-cid-uh3tz5ep>Field</a> <a href="#sprint-room" data-astro-cid-uh3tz5ep>Sprint</a> <a href="#pocket-desk" data-astro-cid-uh3tz5ep>Pocket</a> <a href="#ops-ledger" data-astro-cid-uh3tz5ep>Ops</a> </nav> <section class="outputs" aria-labelledby="outputs-title" data-astro-cid-uh3tz5ep> <div class="section-head" data-astro-cid-uh3tz5ep> <div data-astro-cid-uh3tz5ep> <p class="kicker" data-astro-cid-uh3tz5ep>Desk outputs</p> <h2 id="outputs-title" data-astro-cid-uh3tz5ep>Where the next click goes.</h2> </div> </div> <div class="output-grid" data-astro-cid-uh3tz5ep> ${outputLinks.map((link) => renderTemplate`<a${addAttribute(link.href, "href")} data-astro-cid-uh3tz5ep> <span data-astro-cid-uh3tz5ep>${link.label}</span> <strong data-astro-cid-uh3tz5ep>${link.title}</strong> </a>`)} </div> </section> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-v3.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-v3.astro";
const $$url = "/nouns-nation-battler-v3";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattlerV3,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
