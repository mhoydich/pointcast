import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumVs = createComponent(async ($$result, $$props, $$slots) => {
  const title = "DRUM VS — 1v1 tug-of-war for friends";
  const description = "Send a link, tap together, first to 50 wins. A 1v1 drum game on PointCast — your Noun pulls one end of the rope, your friend pulls the other. Backed by a room-scoped event bus for tight cross-device latency.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/drum-vs",
    name: "PointCast Drum VS · 1v1 Tug-of-War",
    url: "https://pointcast.xyz/drum-vs",
    description,
    applicationCategory: "GameApplication",
    operatingSystem: "Any"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    // ─── Helpers ────────────────────────────────────────────────────────
    var ROOM_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
    function newRoomId() {
      var s = '';
      var arr = new Uint8Array(6);
      try { (window.crypto || {}).getRandomValues(arr); } catch (e) { for (var i = 0; i < 6; i++) arr[i] = Math.floor(Math.random() * 256); }
      for (var i = 0; i < 6; i++) s += ROOM_ALPHA[arr[i] % ROOM_ALPHA.length];
      return s;
    }
    function getSid() {
      try {
        var sid = localStorage.getItem('pc:sid');
        if (sid) return sid;
        sid = (Math.random().toString(36).slice(2) + Date.now().toString(36));
        localStorage.setItem('pc:sid', sid);
        return sid;
      } catch (e) {
        return 'anon-' + Date.now();
      }
    }
    function getNounId(seed) {
      // Deterministic noun id from a string seed (0..1199)
      var h = 0;
      for (var i = 0; i < seed.length; i++) {
        h = ((h << 5) - h) + seed.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h) % 1200;
    }

    var qs = new URLSearchParams(window.location.search);
    var room = (qs.get('room') || '').toUpperCase();
    var mode = (qs.get('mode') || 'tug').toLowerCase();
    if (mode !== 'race' && mode !== 'tug' && mode !== 'duel') mode = 'tug';
    var dvMain = document.getElementById('dv-main');
    if (dvMain) dvMain.dataset.mode = mode;
    var lobby = document.getElementById('dv-lobby');
    var game = document.getElementById('dv-game');
    var strap = document.getElementById('dv-strap');

    // ─── Lobby (no room param) ─────────────────────────────────────────
    if (!room) {
      if (lobby) lobby.hidden = false;
      if (strap) strap.textContent = 'tap "open a new duel" to start a room';
      var newRoomBtn = document.getElementById('dv-new-room');
      if (newRoomBtn) {
        newRoomBtn.addEventListener('click', function () {
          var rid = newRoomId();
          var modeRadio = document.querySelector('input[name="dv-mode"]:checked');
          var mode = modeRadio ? modeRadio.value : 'tug';
          var url = '/drum-vs?room=' + rid;
          if (mode && mode !== 'tug') url += '&mode=' + mode;
          window.location.href = url;
        });
      }
      return;
    }

    // ─── Game (with ?room=) ────────────────────────────────────────────
    if (game) game.hidden = false;
    document.getElementById('dv-room').textContent = room;
    var ropeWrap = document.getElementById('dv-rope');
    var raceWrap = document.getElementById('dv-race');
    var duelWrap = document.getElementById('dv-duel');
    var sidesWrap = document.getElementById('dv-sides');
    if (mode === 'race') {
      if (ropeWrap) ropeWrap.hidden = true;
      if (raceWrap) raceWrap.hidden = false;
      if (duelWrap) duelWrap.hidden = true;
    } else if (mode === 'duel') {
      if (ropeWrap) ropeWrap.hidden = true;
      if (raceWrap) raceWrap.hidden = true;
      if (duelWrap) duelWrap.hidden = false;
      // Sides (tap pads) hidden in duel mode — duel has its own button
      if (sidesWrap) sidesWrap.hidden = true;
    } else {
      if (ropeWrap) ropeWrap.hidden = false;
      if (raceWrap) raceWrap.hidden = true;
      if (duelWrap) duelWrap.hidden = true;
    }
    var barMode = document.querySelector('.dv__bar-mode');
    if (barMode) {
      barMode.textContent = mode === 'race'
        ? '▌ RACE · FIRST TO 50'
        : mode === 'duel'
          ? '▌ REACTION DUEL · FIRST TAP AFTER BELL WINS'
          : '▌ TUG-OF-WAR · FIRST TO 50';
    }
    if (strap) strap.textContent = 'room ' + room + ' · ' + (mode === 'race' ? 'race' : mode === 'duel' ? 'duel' : 'tug') + ' · waiting for both Nouns…';

    var sid = getSid();
    var myNoun = getNounId(sid);
    var mySide = 0;          // 0 = unassigned/spectator, 1 or 2 once joined
    var lastTs = 0;
    var p1Score = 0, p2Score = 0;
    var p1Pid = null, p2Pid = null;
    var winner = 0;
    var pollMs = 400;

    // Optimistic local mirror — we increment our own score immediately on
    // tap, the server eventually echoes it back. We trust server state on
    // each poll for canonical truth (so cheaters can't run up the score
    // by spoofing the local DOM — the server validates).
    var optimisticP1 = 0;
    var optimisticP2 = 0;
    var WIN_TAPS_LOCAL = 50;
    var localVictoryClaimed = false;

    var nounImg1 = document.getElementById('dv-noun-1');
    var nounImg2 = document.getElementById('dv-noun-2');
    var status1 = document.getElementById('dv-status-1');
    var status2 = document.getElementById('dv-status-2');
    var scoreEl1 = document.getElementById('dv-side-score-1');
    var scoreEl2 = document.getElementById('dv-side-score-2');
    var headScore1 = document.getElementById('dv-score-p1');
    var headScore2 = document.getElementById('dv-score-p2');
    var tap1 = document.getElementById('dv-tap-1');
    var tap2 = document.getElementById('dv-tap-2');
    var ropeFlag = document.getElementById('dv-rope-flag');
    var ropeFlagNoun = document.getElementById('dv-rope-flag-noun');
    var sideEl1 = document.getElementById('dv-side-1');
    var sideEl2 = document.getElementById('dv-side-2');
    var invite = document.getElementById('dv-invite');
    var victory = document.getElementById('dv-victory');
    var victoryName = document.getElementById('dv-victory-name');
    var victoryP1 = document.getElementById('dv-victory-p1');
    var victoryP2 = document.getElementById('dv-victory-p2');

    function setNounAt(el, id) {
      if (!el) return;
      el.src = 'https://noun.pics/' + id + '.svg';
      el.alt = 'Noun ' + id;
      el.style.imageRendering = 'pixelated';
    }
    function setRopeNoun(id) {
      if (!ropeFlagNoun) return;
      ropeFlagNoun.style.backgroundImage = 'url(https://noun.pics/' + id + '.svg)';
    }

    var raceFill1 = document.getElementById('dv-race-fill-1');
    var raceFill2 = document.getElementById('dv-race-fill-2');
    var racePct1 = document.getElementById('dv-race-pct-1');
    var racePct2 = document.getElementById('dv-race-pct-2');
    var raceRunner1 = document.getElementById('dv-race-runner-1');
    var raceRunner2 = document.getElementById('dv-race-runner-2');
    function updateUI() {
      var p1 = Math.max(p1Score, optimisticP1);
      var p2 = Math.max(p2Score, optimisticP2);
      headScore1.textContent = String(p1);
      headScore2.textContent = String(p2);
      scoreEl1.textContent = String(p1);
      scoreEl2.textContent = String(p2);
      var bound = 50; // win threshold (shared by tug + race)
      // Rope position (mode=tug): -1 (full P1) ... +1 (full P2)
      var net = p2 - p1;
      var ratio = Math.max(-1, Math.min(1, net / bound));
      var pct = 50 + ratio * 50;
      if (ropeFlag) ropeFlag.style.left = pct + '%';
      // Race bars (mode=race): each side fills toward 100% independently
      var p1pct = Math.min(100, (p1 / bound) * 100);
      var p2pct = Math.min(100, (p2 / bound) * 100);
      if (raceFill1) raceFill1.style.width = p1pct + '%';
      if (raceFill2) raceFill2.style.width = p2pct + '%';
      if (racePct1) racePct1.textContent = Math.round(p1pct) + '%';
      if (racePct2) racePct2.textContent = Math.round(p2pct) + '%';
      if (raceRunner1) raceRunner1.style.left = p1pct + '%';
      if (raceRunner2) raceRunner2.style.left = p2pct + '%';
      // Whoever is currently winning sees their noun on the marker
      var leadId = (p1 > p2) ? (p1Pid ? getNounId(p1Pid) : myNoun) :
                  (p2 > p1) ? (p2Pid ? getNounId(p2Pid) : myNoun) :
                              myNoun;
      setRopeNoun(leadId);
    }

    function claimLocalVictory(mySideClaim) {
      if (winner !== 0) return; // server already decided; respect it
      var nameEl = document.getElementById('dv-victory-name');
      var p1El = document.getElementById('dv-victory-p1');
      var p2El = document.getElementById('dv-victory-p2');
      var ov = document.getElementById('dv-victory');
      if (nameEl) nameEl.textContent = (mySideClaim === mySide) ? 'you' : 'they';
      if (p1El) p1El.textContent = String(Math.max(p1Score, optimisticP1));
      if (p2El) p2El.textContent = String(Math.max(p2Score, optimisticP2));
      if (ov) ov.hidden = false;
      try { if (navigator.vibrate) navigator.vibrate([20, 60, 30, 60]); } catch (e) {}
      if (strap) strap.textContent = 'room ' + room + ' · final pull · waiting for server confirm…';
    }

    function applyServerState(state) {
      if (mode === 'duel') applyDuelState(state);

      if (!state) return;
      p1Score = Number(state.p1Score) || 0;
      p2Score = Number(state.p2Score) || 0;
      p1Pid = state.p1Pid || null;
      p2Pid = state.p2Pid || null;
      winner = Number(state.winner) || 0;
      // Reconcile optimistic — never go backward from server truth
      if (optimisticP1 < p1Score) optimisticP1 = p1Score;
      if (optimisticP2 < p2Score) optimisticP2 = p2Score;
      // Clamp once server declares winner — prevents the "77-22 with no
      // overlay" bug where rapid in-flight taps left the local display
      // running past the canonical cap.
      if (winner !== 0) {
        optimisticP1 = p1Score;
        optimisticP2 = p2Score;
      }

      // Render side info
      if (p1Pid) {
        var p1Noun = getNounId(p1Pid);
        setNounAt(nounImg1, p1Noun);
        status1.textContent = (p1Pid === pidOfMe()) ? 'YOU' : 'OPPONENT';
        sideEl1.classList.add('dv__side--seated');
      } else {
        nounImg1.src = '';
        status1.textContent = '— empty —';
        sideEl1.classList.remove('dv__side--seated');
      }
      if (p2Pid) {
        var p2Noun = getNounId(p2Pid);
        setNounAt(nounImg2, p2Noun);
        status2.textContent = (p2Pid === pidOfMe()) ? 'YOU' : 'OPPONENT';
        sideEl2.classList.add('dv__side--seated');
      } else {
        nounImg2.src = '';
        status2.textContent = '— empty —';
        sideEl2.classList.remove('dv__side--seated');
      }

      // Highlight the player's own side
      sideEl1.classList.toggle('dv__side--mine', mySide === 1);
      sideEl2.classList.toggle('dv__side--mine', mySide === 2);

      // Disable the tap button on the side that ISN'T mine
      tap1.disabled = (mySide !== 1) || winner !== 0;
      tap2.disabled = (mySide !== 2) || winner !== 0;

      // Show invite row if waiting for second player
      var bothSeated = !!p1Pid && !!p2Pid;
      invite.hidden = bothSeated;
      if (!bothSeated) {
        if (strap) strap.textContent = 'room ' + room + ' · waiting for the other side…';
      } else if (winner === 0) {
        if (strap) strap.textContent = 'room ' + room + ' · GO · first to 50 takes the rope';
      }

      // Victory state
      if (winner !== 0) {
        var winnerLabel = winner === 1 ? 'P1' : 'P2';
        var winnerPid = winner === 1 ? p1Pid : p2Pid;
        if (winnerPid && winnerPid === pidOfMe()) winnerLabel = 'you';
        else if (winnerPid && winnerPid !== pidOfMe()) winnerLabel = 'they';
        victoryName.textContent = winnerLabel;
        victoryP1.textContent = String(p1Score);
        victoryP2.textContent = String(p2Score);
        victory.hidden = false;
        if (strap) strap.textContent = 'room ' + room + ' · ' + winnerLabel + ' won · rematch?';
      } else {
        victory.hidden = true;
      }

      updateUI();
    }

    // pidOfMe — derive from sid for client-side compare. Server hashes
    // sessionId via sha256 then takes the first 10 chars; we mirror
    // that here purely for the UI display ("YOU" tag). Note: doing
    // sha256 in browser is awkward so we cache the answer.
    var _myPid = null;
    function pidOfMe() {
      if (_myPid) return _myPid;
      // Fallback — assume server's pid for our session. Hashing async
      // here would race with first paint; accept short-term mismatch.
      // Set _myPid lazily on first server response that includes our seat.
      return _myPid || '';
    }

    function joinRoom() {
      fetch('/api/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: room, sessionId: sid, kind: 'join', mode: mode }),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.ok) return;
          mySide = Number(data.side) || 0;
          if (mySide === 1 && data.state) _myPid = data.state.p1Pid;
          if (mySide === 2 && data.state) _myPid = data.state.p2Pid;
          applyServerState(data.state);
          // Once seated, kick polling + try the WebRTC upgrade
          schedulePoll();
          try { rtc.maybeStart(); } catch (e) {}
        })
        .catch(function () {
          if (strap) strap.textContent = 'room ' + room + ' · network slow — retrying…';
          setTimeout(joinRoom, 1500);
        });
    }
    joinRoom();

    // ─── WebRTC peer-to-peer upgrade ────────────────────────────────────
    // Once both seats are filled, set up an RTCPeerConnection between
    // the two players. Tap events go over the data channel for sub-50ms
    // latency once connected. KV remains canonical truth — every tap
    // STILL POSTs to /api/duel for authoritative scoring + winner state.
    // P1 = offerer (creates data channel + offer). P2 = answerer.
    // Signaling rides on /api/duel kind=signal. STUN-only, no TURN.
    var rtc = (function () {
      var pc = null;
      var dc = null;
      var connected = false;
      var pendingIce = [];
      var sigSeen = {};
      var lastSigTs = 0;
      var sigTimer = null;
      var rttMs = 0;
      var statusEl = document.getElementById('dv-lane-label');
      var rttEl = document.getElementById('dv-lane-rtt');
      var hintEl = document.getElementById('dv-lane-hint');
      var laneEl = document.getElementById('dv-lane');

      function setStatus(label, hint, mode) {
        if (statusEl) statusEl.textContent = label;
        if (hintEl) hintEl.textContent = hint || '';
        if (laneEl) laneEl.dataset.mode = mode || 'kv';
      }
      function setRTT(ms) {
        rttMs = ms;
        if (rttEl) rttEl.textContent = '· ' + Math.round(ms) + 'ms';
      }

      function otherPid() {
        if (mySide === 1) return p2Pid;
        if (mySide === 2) return p1Pid;
        return null;
      }

      function postSignal(kind, payload) {
        var to = otherPid();
        if (!to) return Promise.resolve();
        return fetch('/api/duel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: room, sessionId: sid, kind: 'signal', to: to,
            signal: { kind: kind, payload: payload },
          }),
        }).catch(function () {});
      }

      function ensurePc() {
        if (pc) return pc;
        if (typeof RTCPeerConnection === 'undefined') {
          setStatus('KV · ~400ms', 'no WebRTC in this browser', 'kv');
          return null;
        }
        try {
          pc = new RTCPeerConnection({
            iceServers: [
              { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
            ],
          });
        } catch (e) {
          setStatus('KV · ~400ms', 'WebRTC init failed', 'kv');
          return null;
        }
        pc.onicecandidate = function (ev) {
          if (ev.candidate) {
            postSignal('ice', JSON.stringify(ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate));
          }
        };
        pc.oniceconnectionstatechange = function () {
          if (!pc) return;
          var s = pc.iceConnectionState;
          if (s === 'failed' || s === 'disconnected' || s === 'closed') {
            connected = false;
            setStatus('KV · ~400ms', 'P2P dropped — KV fallback', 'kv');
          }
        };
        pc.ondatachannel = function (ev) {
          dc = ev.channel;
          wireDataChannel();
        };
        return pc;
      }

      function wireDataChannel() {
        if (!dc) return;
        dc.onopen = function () {
          connected = true;
          setStatus('P2P · live', 'measuring rtt…', 'p2p');
          send({ kind: 'hello', pid: pidOfMe() });
          send({ kind: 'ping', t0: performance.now() });
        };
        dc.onclose = function () {
          connected = false;
          setStatus('KV · ~400ms', 'P2P closed', 'kv');
        };
        dc.onerror = function () {
          connected = false;
          setStatus('KV · ~400ms', 'P2P error — KV fallback', 'kv');
        };
        dc.onmessage = function (ev) {
          var msg = null;
          try { msg = JSON.parse(ev.data); } catch (e) { return; }
          if (!msg || !msg.kind) return;
          if (msg.kind === 'tap') {
            var oppSide = msg.side;
            if (oppSide === 1) optimisticP1 += 1;
            else if (oppSide === 2) optimisticP2 += 1;
            updateUI();
          } else if (msg.kind === 'ping') {
            send({ kind: 'pong', t0: msg.t0 });
          } else if (msg.kind === 'pong') {
            var delta = performance.now() - msg.t0;
            setRTT(delta);
            if (hintEl) hintEl.textContent = 'data channel · ~' + Math.round(delta) + 'ms peer-to-peer';
          }
        };
      }

      function send(obj) {
        if (!dc || dc.readyState !== 'open') return false;
        try { dc.send(JSON.stringify(obj)); return true; } catch (e) { return false; }
      }

      function isSeated() {
        return mySide === 1 || mySide === 2;
      }
      function bothSeated() {
        return !!p1Pid && !!p2Pid;
      }

      function pollSignals() {
        if (!isSeated() || connected) {
          if (sigTimer) clearTimeout(sigTimer);
          sigTimer = null;
          return;
        }
        var me = pidOfMe();
        if (!me) {
          sigTimer = setTimeout(pollSignals, 500);
          return;
        }
        fetch('/api/duel?room=' + encodeURIComponent(room) +
              '&sigSince=' + lastSigTs +
              '&for=' + encodeURIComponent(me), { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (!data || !Array.isArray(data.signals)) return;
            data.signals.forEach(handleSignal);
            if (data.signals.length) {
              lastSigTs = data.signals[data.signals.length - 1].t || lastSigTs;
            }
          })
          .catch(function () {})
          .finally(function () {
            if (!connected) sigTimer = setTimeout(pollSignals, 600);
          });
      }

      function handleSignal(s) {
        if (!s || !s.id || sigSeen[s.id]) return;
        sigSeen[s.id] = 1;
        var p = ensurePc();
        if (!p) return;
        if (s.kind === 'offer') {
          if (mySide !== 2) return;
          var sdp = JSON.parse(s.payload);
          p.setRemoteDescription(sdp).then(function () {
            return p.createAnswer();
          }).then(function (ans) {
            return p.setLocalDescription(ans);
          }).then(function () {
            postSignal('answer', JSON.stringify(p.localDescription));
            pendingIce.forEach(function (c) { try { p.addIceCandidate(c); } catch (e) {} });
            pendingIce = [];
          }).catch(function () {
            setStatus('KV · ~400ms', 'P2P offer-handle failed', 'kv');
          });
        } else if (s.kind === 'answer') {
          if (mySide !== 1) return;
          var sdp2 = JSON.parse(s.payload);
          p.setRemoteDescription(sdp2).then(function () {
            pendingIce.forEach(function (c) { try { p.addIceCandidate(c); } catch (e) {} });
            pendingIce = [];
          }).catch(function () {});
        } else if (s.kind === 'ice') {
          var c;
          try { c = JSON.parse(s.payload); } catch (e) { return; }
          if (!p.remoteDescription) {
            pendingIce.push(c);
          } else {
            try { p.addIceCandidate(c); } catch (e) {}
          }
        }
      }

      function startAsP1() {
        var p = ensurePc();
        if (!p) return;
        dc = p.createDataChannel('drum-vs', { ordered: true, maxRetransmits: 0 });
        wireDataChannel();
        p.createOffer().then(function (offer) {
          return p.setLocalDescription(offer);
        }).then(function () {
          postSignal('offer', JSON.stringify(p.localDescription));
        }).catch(function () {
          setStatus('KV · ~400ms', 'P2P offer failed', 'kv');
        });
      }

      function startAsP2() {
        ensurePc();
        if (!sigTimer) pollSignals();
      }

      function maybeStart() {
        if (!isSeated()) return;
        if (!bothSeated()) {
          if (!sigTimer) pollSignals();
          return;
        }
        if (connected) return;
        if (mySide === 1 && !pc) startAsP1();
        else if (mySide === 2 && !pc) startAsP2();
        if (!sigTimer) pollSignals();
      }

      setInterval(function () {
        if (connected && dc && dc.readyState === 'open') {
          send({ kind: 'ping', t0: performance.now() });
        }
      }, 5000);

      return {
        maybeStart: maybeStart,
        sendTap: function (side) { return send({ kind: 'tap', side: side, t: Date.now() }); },
        isConnected: function () { return connected; },
        rttMs: function () { return rttMs; },
      };
    })();

    // ─── Reaction-duel state machine ───────────────────────────────────
    // Drives the duel UI based on server state.{p1Ready, p2Ready, bellAt,
    // roundState, falseStart, winner}. Polls existing state via the same
    // poll() loop; doesn't add round-trips. Local countdown is purely
    // visual — the server's bellAt is canonical.
    var duelEls = {
      stage: document.getElementById('dv-duel-stage'),
      status: document.getElementById('dv-duel-status'),
      instr: document.getElementById('dv-duel-instr'),
      readyBtn: document.getElementById('dv-duel-ready'),
      tapBtn: document.getElementById('dv-duel-tap'),
    };
    var duelState = { roundState: 'idle', bellAt: 0, p1Ready: false, p2Ready: false, falseStart: 0 };
    var duelLocalReady = false;     // we sent kind=ready, awaiting echo
    var duelLocalTap = false;       // we sent kind=tap, awaiting resolve
    var duelTickerTimer = null;

    function applyDuelState(st) {
      if (mode !== 'duel') return;
      duelState.roundState = st.roundState || 'idle';
      duelState.bellAt = Number(st.bellAt) || 0;
      duelState.p1Ready = !!st.p1Ready;
      duelState.p2Ready = !!st.p2Ready;
      duelState.falseStart = Number(st.falseStart) || 0;
      renderDuel();
    }

    function renderDuel() {
      if (mode !== 'duel') return;
      var s = duelState.roundState;
      var bothReady = duelState.p1Ready && duelState.p2Ready;
      duelEls.stage.dataset.state = s;
      // Reset visibility
      duelEls.readyBtn.hidden = true;
      duelEls.tapBtn.hidden = true;

      if (winner !== 0) {
        // Round resolved. Show outcome.
        var youWon = (winner === mySide);
        if (duelState.falseStart !== 0) {
          var falseStarter = duelState.falseStart === mySide;
          duelEls.status.textContent = falseStarter
            ? '✗ FALSE START · you tapped before the bell'
            : '✓ ' + (winner === mySide ? 'you ' : 'they ') + 'won by waiting · their false start';
          duelEls.instr.textContent = 'click rematch to go again';
        } else {
          duelEls.status.textContent = youWon ? '✓ YOU WON the round' : '✗ THEY tapped first';
          duelEls.instr.textContent = 'click rematch to go again';
        }
        return;
      }

      if (s === 'idle' || !bothReady) {
        var meReady = (mySide === 1 && duelState.p1Ready) || (mySide === 2 && duelState.p2Ready);
        var theyReady = (mySide === 1 && duelState.p2Ready) || (mySide === 2 && duelState.p1Ready);
        if (meReady && !theyReady) {
          duelEls.status.textContent = '✓ ready · waiting for opponent…';
          duelEls.instr.textContent = 'they need to ready up · then bell rings 2-5s after';
        } else if (!meReady && theyReady) {
          duelEls.status.textContent = 'opponent is ready · your move';
          duelEls.instr.textContent = 'tap READY when you are';
          duelEls.readyBtn.hidden = false;
        } else if (!meReady && !theyReady) {
          duelEls.status.textContent = '— ready up to start the round —';
          duelEls.instr.textContent = 'both players tap READY · then bell rings 2-5s after · first tap wins · false start loses';
          duelEls.readyBtn.hidden = false;
        } else {
          // both ready (would only happen mid-transition before server flips state to arming)
          duelEls.status.textContent = 'both ready · arming…';
        }
        return;
      }

      if (s === 'arming') {
        var msToBell = duelState.bellAt - Date.now();
        if (msToBell > 0) {
          // Pre-bell — DO NOT TAP
          duelEls.status.textContent = '⚠ HOLD · do not tap until the bell';
          duelEls.instr.textContent = 'bell rings in ~' + Math.ceil(msToBell / 100) / 10 + 's · false start = loss';
          duelEls.tapBtn.hidden = false;  // visible so they CAN tap (and lose if early)
          duelEls.tapBtn.classList.remove('dv__duel-btn--armed');
          duelEls.tapBtn.classList.add('dv__duel-btn--hold');
        } else {
          // Bell rang — TAP NOW
          duelEls.status.textContent = '◉ TAP! TAP! TAP!';
          duelEls.instr.textContent = 'first to tap wins this round';
          duelEls.tapBtn.hidden = false;
          duelEls.tapBtn.classList.add('dv__duel-btn--armed');
          duelEls.tapBtn.classList.remove('dv__duel-btn--hold');
        }
      }
    }

    // 60 Hz-ish ticker so the bell countdown and 'TAP NOW' state flip
    // visually without waiting for next state poll. Bell time is
    // server-canonical so all clients flip together within ~1 frame.
    function startDuelTicker() {
      if (duelTickerTimer) return;
      duelTickerTimer = setInterval(function () { renderDuel(); }, 80);
    }
    if (mode === 'duel') startDuelTicker();

    // READY click — POST kind=ready
    if (duelEls.readyBtn) {
      duelEls.readyBtn.addEventListener('click', function () {
        if (duelLocalReady) return;
        duelLocalReady = true;
        try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
        fetch('/api/duel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: room, sessionId: sid, kind: 'ready' }),
        }).then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (data && data.ok && data.state) applyDuelState(data.state);
          })
          .catch(function () { duelLocalReady = false; });
      });
    }

    // TAP click — POST kind=tap, server resolves the round
    if (duelEls.tapBtn) {
      var doTap = function () {
        if (duelLocalTap) return;
        duelLocalTap = true;
        try { if (navigator.vibrate) navigator.vibrate(20); } catch (e) {}
        fetch('/api/duel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: room, sessionId: sid, kind: 'tap', side: mySide }),
        }).then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (data && data.ok && data.state) {
              applyServerState(data.state);
              applyDuelState(data.state);
            }
          })
          .catch(function () { duelLocalTap = false; });
      };
      duelEls.tapBtn.addEventListener('mousedown', function (e) { doTap(); e.preventDefault(); });
      duelEls.tapBtn.addEventListener('touchstart', function (e) { doTap(); e.preventDefault(); }, { passive: false });
    }

    // Reset duel-local flags on rematch
    if (rematchBtn = document.getElementById('dv-rematch')) {
      // Already wired below; we'll piggyback in the existing handler — this
      // var declaration is a no-op since the existing handler exists later.
    }

    // ─── Tap broadcast ─────────────────────────────────────────────────
    function fireTap(side) {
      if (mySide !== side || winner !== 0) return;
      // Hard local cap — can't out-tap our own win.
      if (mode === 'tug' || mode === 'race') {
        var myCount = side === 1 ? optimisticP1 : optimisticP2;
        if (myCount >= WIN_TAPS_LOCAL) return;
      }
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
      // Optimistic local
      if (side === 1) optimisticP1 += 1;
      else optimisticP2 += 1;
      // Provisional local victory — server confirms within ~400ms.
      if ((mode === 'tug' || mode === 'race') && !localVictoryClaimed) {
        var meCount = side === 1 ? optimisticP1 : optimisticP2;
        if (meCount >= WIN_TAPS_LOCAL) {
          localVictoryClaimed = true;
          claimLocalVictory(side);
        }
      }
      updateUI();
      var btn = side === 1 ? tap1 : tap2;
      btn.classList.remove('dv__tap--hit');
      void btn.offsetWidth;
      btn.classList.add('dv__tap--hit');

      // Fast lane: peer data channel (if connected)
      try { rtc.sendTap(side); } catch (e) {}

      // Slow lane: KV canonical
      fetch('/api/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: room,
          sessionId: sid,
          kind: 'tap',
          side: side,
        }),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.ok) return;
          // Server canonical scores — reconcile (server can only go up)
          if (data.state) applyServerState(data.state);
        })
        .catch(function () { /* offline; optimistic stays */ });
    }

    tap1.addEventListener('mousedown', function (e) { fireTap(1); e.preventDefault(); });
    tap1.addEventListener('touchstart', function (e) { fireTap(1); e.preventDefault(); }, { passive: false });
    tap2.addEventListener('mousedown', function (e) { fireTap(2); e.preventDefault(); });
    tap2.addEventListener('touchstart', function (e) { fireTap(2); e.preventDefault(); }, { passive: false });

    // Keyboard: A / Left arrow → P1, L / Right arrow → P2
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      var k = e.key.toLowerCase();
      var ae = document.activeElement;
      var tag = ae && ae.tagName ? ae.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (k === 'a' || k === 'arrowleft' || k === 'q') { fireTap(1); e.preventDefault(); }
      else if (k === 'l' || k === 'arrowright' || k === 'p') { fireTap(2); e.preventDefault(); }
    });

    // ─── Poll loop ─────────────────────────────────────────────────────
    var pollTimer = null;
    function schedulePoll() {
      if (pollTimer) clearTimeout(pollTimer);
      pollTimer = setTimeout(poll, pollMs);
    }
    function poll() {
      fetch('/api/duel?room=' + encodeURIComponent(room) + '&since=' + lastTs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.ok) return;
          var hadBoth = !!p1Pid && !!p2Pid;
          if (data.state) applyServerState(data.state);
          if (Array.isArray(data.events) && data.events.length) {
            lastTs = data.events[data.events.length - 1].t || lastTs;
          }
          // 2nd player just joined → kick the WebRTC dance
          var hasBothNow = !!p1Pid && !!p2Pid;
          if (!hadBoth && hasBothNow) {
            try { rtc.maybeStart(); } catch (e) {}
          }
        })
        .catch(function () {})
        .finally(function () { schedulePoll(); });
    }

    // ─── Invite row ────────────────────────────────────────────────────
    var shareCopy = document.getElementById('dv-share-copy');
    var shareNative = document.getElementById('dv-share-native');
    var shareTweet = document.getElementById('dv-share-tweet');
    var shareStatus = document.getElementById('dv-share-status');
    var inviteUrl = window.location.origin + '/drum-vs?room=' + room + (mode !== 'tug' ? '&mode=' + mode : '');
    var inviteText = 'tap with me — drum-vs room ' + room + ' · pointcast.xyz';

    function setShareStatus(msg) {
      if (!shareStatus) return;
      shareStatus.textContent = msg || ' ';
      if (msg) setTimeout(function () { if (shareStatus.textContent === msg) shareStatus.textContent = ' '; }, 2400);
    }

    if (shareCopy) {
      shareCopy.addEventListener('click', function () {
        try {
          navigator.clipboard.writeText(inviteUrl);
          setShareStatus('✓ link copied');
        } catch (e) {
          setShareStatus('✗ copy unavailable');
        }
      });
    }
    if (shareTweet) {
      shareTweet.href =
        'https://twitter.com/intent/tweet?text=' + encodeURIComponent(inviteText) +
        '&url=' + encodeURIComponent(inviteUrl);
    }
    if (shareNative && navigator.share) {
      shareNative.hidden = false;
      var isCoarse = false;
      try { isCoarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
      if (isCoarse) shareNative.classList.add('dv__btn--primary');
      shareNative.addEventListener('click', function () {
        try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
        navigator.share({
          title: 'drum vs · 1v1 tug-of-war',
          text: inviteText,
          url: inviteUrl,
        }).then(function () { setShareStatus('✓ sent'); })
          .catch(function (err) {
            if (err && err.name === 'AbortError') return;
            setShareStatus('share canceled');
          });
      });
    }

    // ─── Rematch ───────────────────────────────────────────────────────
    var rematchBtn = document.getElementById('dv-rematch');
    var shareResultBtn = document.getElementById('dv-share-result');
    if (rematchBtn) {
      rematchBtn.addEventListener('click', function () {
        if (mySide !== 1 && mySide !== 2) return;
        fetch('/api/duel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: room, sessionId: sid, kind: 'reset' }),
        })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (data && data.ok) {
              optimisticP1 = 0;
              optimisticP2 = 0;
              localVictoryClaimed = false;
              duelLocalReady = false;
              duelLocalTap = false;
              applyServerState(data.state);
            }
          });
      });
    }
    if (shareResultBtn && navigator.share) {
      shareResultBtn.addEventListener('click', function () {
        var msg = 'i played drum vs · final ' + p1Score + '·' + p2Score + ' · join: ' + inviteUrl;
        navigator.share({ title: 'drum vs result', text: msg, url: inviteUrl }).catch(function () {});
      });
    }

  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-vs.png", "jsonLd": jsonLd, "data-astro-cid-swb4mxco": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dv" id="dv-main" data-astro-cid-swb4mxco> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "vs", "data-astro-cid-swb4mxco": true })} <header class="dv__head" data-astro-cid-swb4mxco> <p class="dv__kicker mono" data-astro-cid-swb4mxco>★ DRUM HUB · 1v1 GAMES FOR FRIENDS ★</p> <h1 class="dv__title" data-astro-cid-swb4mxco>drum <em data-astro-cid-swb4mxco>vs</em></h1> <p class="dv__strap mono" id="dv-strap" data-astro-cid-swb4mxco>— preparing the rope —</p> </header>  <section class="dv__lobby" id="dv-lobby" hidden data-astro-cid-swb4mxco> <div class="dv__lobby-card" data-astro-cid-swb4mxco> <p class="dv__eyebrow mono" data-astro-cid-swb4mxco>★ NEW DUEL ★</p> <h2 class="dv__lobby-title" data-astro-cid-swb4mxco>tap, send, race</h2> <p class="dv__lobby-body" data-astro-cid-swb4mxco>
Generate a room, send the link to a friend. First side to <strong data-astro-cid-swb4mxco>50 taps</strong> wins.
          Pick a mode below. Once both Nouns are in, the page upgrades to peer-to-peer for sub-50ms latency.
</p> <fieldset class="dv__mode-picker" data-astro-cid-swb4mxco> <legend class="dv__mode-legend mono" data-astro-cid-swb4mxco>★ pick a mode</legend> <label class="dv__mode-opt" data-astro-cid-swb4mxco> <input type="radio" name="dv-mode" value="tug" checked data-astro-cid-swb4mxco> <span class="dv__mode-name" data-astro-cid-swb4mxco>tug-of-war</span> <span class="dv__mode-sub mono" data-astro-cid-swb4mxco>rope marker · slow squeeze</span> </label> <label class="dv__mode-opt" data-astro-cid-swb4mxco> <input type="radio" name="dv-mode" value="race" data-astro-cid-swb4mxco> <span class="dv__mode-name" data-astro-cid-swb4mxco>race</span> <span class="dv__mode-sub mono" data-astro-cid-swb4mxco>side-by-side bars · sprint</span> </label> <label class="dv__mode-opt" data-astro-cid-swb4mxco> <input type="radio" name="dv-mode" value="duel" data-astro-cid-swb4mxco> <span class="dv__mode-name" data-astro-cid-swb4mxco>reaction duel</span> <span class="dv__mode-sub mono" data-astro-cid-swb4mxco>bell rings 2-5s · first tap wins · don't false-start</span> </label> </fieldset> <button type="button" class="dv__btn dv__btn--magenta dv__btn--big" id="dv-new-room" data-astro-cid-swb4mxco>
▸ open a new duel
</button> <p class="dv__lobby-hint mono" data-astro-cid-swb4mxco>no signup · no install · the URL is the invite</p> </div> </section>  <section class="dv__game" id="dv-game" hidden data-astro-cid-swb4mxco>  <div class="dv__bar" data-astro-cid-swb4mxco> <p class="dv__bar-mode mono" data-astro-cid-swb4mxco>▌ TUG-OF-WAR · FIRST TO 50</p> <p class="dv__bar-room mono" data-astro-cid-swb4mxco>ROOM · <strong id="dv-room" data-astro-cid-swb4mxco>—</strong></p> <p class="dv__bar-score mono" data-astro-cid-swb4mxco><span id="dv-score-p1" data-astro-cid-swb4mxco>0</span> · <span id="dv-score-p2" data-astro-cid-swb4mxco>0</span></p> </div>  <div class="dv__lane" id="dv-lane" aria-live="polite" data-mode="kv" data-astro-cid-swb4mxco> <span class="dv__lane-dot" id="dv-lane-dot" aria-hidden="true" data-astro-cid-swb4mxco></span> <span class="dv__lane-label mono" id="dv-lane-label" data-astro-cid-swb4mxco>KV · ~400ms</span> <span class="dv__lane-rtt mono" id="dv-lane-rtt" data-astro-cid-swb4mxco></span> <span class="dv__lane-hint mono" id="dv-lane-hint" data-astro-cid-swb4mxco>connecting…</span> </div>  <div class="dv__rope" id="dv-rope" aria-label="Tug-of-war rope" data-astro-cid-swb4mxco> <div class="dv__rope-track" data-astro-cid-swb4mxco> <span class="dv__rope-mark dv__rope-mark--left" aria-hidden="true" data-astro-cid-swb4mxco>P1</span> <span class="dv__rope-line" aria-hidden="true" data-astro-cid-swb4mxco></span> <span class="dv__rope-flag" id="dv-rope-flag" aria-hidden="true" data-astro-cid-swb4mxco> <span class="dv__rope-flag-noun" id="dv-rope-flag-noun" data-astro-cid-swb4mxco></span> </span> <span class="dv__rope-mark dv__rope-mark--right" aria-hidden="true" data-astro-cid-swb4mxco>P2</span> </div> <div class="dv__rope-meter" aria-hidden="true" data-astro-cid-swb4mxco> <span class="dv__rope-meter-tick" data-astro-cid-swb4mxco></span> <span class="dv__rope-meter-tick" data-astro-cid-swb4mxco></span> <span class="dv__rope-meter-mid" data-astro-cid-swb4mxco></span> <span class="dv__rope-meter-tick" data-astro-cid-swb4mxco></span> <span class="dv__rope-meter-tick" data-astro-cid-swb4mxco></span> </div> </div>  <div class="dv__race" id="dv-race" aria-label="Side-by-side race" hidden data-astro-cid-swb4mxco> <div class="dv__race-row dv__race-row--p1" data-astro-cid-swb4mxco> <span class="dv__race-tag mono" aria-hidden="true" data-astro-cid-swb4mxco>P1</span> <div class="dv__race-track" data-astro-cid-swb4mxco> <div class="dv__race-fill dv__race-fill--p1" id="dv-race-fill-1" data-astro-cid-swb4mxco></div> <span class="dv__race-runner" id="dv-race-runner-1" aria-hidden="true" data-astro-cid-swb4mxco></span> </div> <span class="dv__race-pct mono" id="dv-race-pct-1" data-astro-cid-swb4mxco>0%</span> </div> <div class="dv__race-row dv__race-row--p2" data-astro-cid-swb4mxco> <span class="dv__race-tag mono" aria-hidden="true" data-astro-cid-swb4mxco>P2</span> <div class="dv__race-track" data-astro-cid-swb4mxco> <div class="dv__race-fill dv__race-fill--p2" id="dv-race-fill-2" data-astro-cid-swb4mxco></div> <span class="dv__race-runner" id="dv-race-runner-2" aria-hidden="true" data-astro-cid-swb4mxco></span> </div> <span class="dv__race-pct mono" id="dv-race-pct-2" data-astro-cid-swb4mxco>0%</span> </div> </div>  <div class="dv__duel" id="dv-duel" aria-label="Reaction duel" hidden data-astro-cid-swb4mxco> <div class="dv__duel-stage" id="dv-duel-stage" data-state="idle" data-astro-cid-swb4mxco> <p class="dv__duel-status" id="dv-duel-status" data-astro-cid-swb4mxco>— ready up to start the round —</p> <p class="dv__duel-instr mono" id="dv-duel-instr" data-astro-cid-swb4mxco>tap READY · bell rings 2-5s after both ready · first tap after bell wins · false start = loss</p> <button type="button" class="dv__duel-btn" id="dv-duel-ready" hidden data-astro-cid-swb4mxco> <span class="dv__duel-glyph" aria-hidden="true" data-astro-cid-swb4mxco>●</span> <span class="dv__duel-label mono" data-astro-cid-swb4mxco>READY</span> </button> <button type="button" class="dv__duel-btn dv__duel-btn--tap" id="dv-duel-tap" hidden data-astro-cid-swb4mxco> <span class="dv__duel-glyph" aria-hidden="true" data-astro-cid-swb4mxco>▣</span> <span class="dv__duel-label mono" data-astro-cid-swb4mxco>TAP NOW</span> </button> </div> </div>  <div class="dv__sides" id="dv-sides" data-astro-cid-swb4mxco>  <article class="dv__side dv__side--p1" data-side="1" id="dv-side-1" data-astro-cid-swb4mxco> <header class="dv__side-head" data-astro-cid-swb4mxco> <img class="dv__side-noun" id="dv-noun-1" src="" alt="" width="80" height="80" data-astro-cid-swb4mxco> <div class="dv__side-info" data-astro-cid-swb4mxco> <p class="dv__side-tag mono" data-astro-cid-swb4mxco>P1 · LEFT</p> <p class="dv__side-status mono" id="dv-status-1" data-astro-cid-swb4mxco>— waiting —</p> </div> <p class="dv__side-score mono" id="dv-side-score-1" aria-live="polite" data-astro-cid-swb4mxco>0</p> </header> <button type="button" class="dv__tap dv__tap--p1" id="dv-tap-1" aria-label="P1 tap" data-astro-cid-swb4mxco> <span class="dv__tap-cap" data-astro-cid-swb4mxco> <span class="dv__tap-glyph" aria-hidden="true" data-astro-cid-swb4mxco>▣</span> <span class="dv__tap-label mono" data-astro-cid-swb4mxco>PULL</span> <span class="dv__tap-kbd mono" data-astro-cid-swb4mxco>A · ←</span> </span> </button> </article>  <article class="dv__side dv__side--p2" data-side="2" id="dv-side-2" data-astro-cid-swb4mxco> <header class="dv__side-head" data-astro-cid-swb4mxco> <img class="dv__side-noun" id="dv-noun-2" src="" alt="" width="80" height="80" data-astro-cid-swb4mxco> <div class="dv__side-info" data-astro-cid-swb4mxco> <p class="dv__side-tag mono" data-astro-cid-swb4mxco>P2 · RIGHT</p> <p class="dv__side-status mono" id="dv-status-2" data-astro-cid-swb4mxco>— waiting —</p> </div> <p class="dv__side-score mono" id="dv-side-score-2" aria-live="polite" data-astro-cid-swb4mxco>0</p> </header> <button type="button" class="dv__tap dv__tap--p2" id="dv-tap-2" aria-label="P2 tap" data-astro-cid-swb4mxco> <span class="dv__tap-cap" data-astro-cid-swb4mxco> <span class="dv__tap-glyph" aria-hidden="true" data-astro-cid-swb4mxco>▣</span> <span class="dv__tap-label mono" data-astro-cid-swb4mxco>PULL</span> <span class="dv__tap-kbd mono" data-astro-cid-swb4mxco>L · →</span> </span> </button> </article> </div>  <section class="dv__invite" id="dv-invite" hidden data-astro-cid-swb4mxco> <p class="dv__invite-line" data-astro-cid-swb4mxco>
☞ <strong data-astro-cid-swb4mxco>send the link</strong> to a friend so they can join the rope.
</p> <div class="dv__invite-row" data-astro-cid-swb4mxco> <button type="button" class="dv__btn dv__btn--share" id="dv-share-native" hidden data-astro-cid-swb4mxco>
▸ share via iMessage / WhatsApp
</button> <button type="button" class="dv__btn" id="dv-share-copy" data-astro-cid-swb4mxco>copy link</button> <a class="dv__btn dv__btn--ghost" id="dv-share-tweet" target="_blank" rel="noopener" href="#" data-astro-cid-swb4mxco>tweet</a> </div> <p class="dv__share-status mono" id="dv-share-status" data-astro-cid-swb4mxco>&nbsp;</p> </section>  <section class="dv__victory" id="dv-victory" hidden data-astro-cid-swb4mxco> <div class="dv__victory-card" data-astro-cid-swb4mxco> <p class="dv__victory-kicker mono" data-astro-cid-swb4mxco>★ FINAL PULL ★</p> <p class="dv__victory-line" data-astro-cid-swb4mxco> <span id="dv-victory-name" data-astro-cid-swb4mxco>—</span> <em data-astro-cid-swb4mxco>won the rope.</em> </p> <p class="dv__victory-score mono" data-astro-cid-swb4mxco><span id="dv-victory-p1" data-astro-cid-swb4mxco>0</span> · <span id="dv-victory-p2" data-astro-cid-swb4mxco>0</span></p> <button type="button" class="dv__btn dv__btn--big dv__btn--magenta" id="dv-rematch" data-astro-cid-swb4mxco>▸ rematch</button> <button type="button" class="dv__btn" id="dv-share-result" data-astro-cid-swb4mxco>share result</button> </div> </section>  <footer class="dv__foot" data-astro-cid-swb4mxco> <p class="mono" data-astro-cid-swb4mxco>
DRUM VS · v0.1 · 2026-04-30 · pointcast.xyz/drum-vs · room state in
<code data-astro-cid-swb4mxco>/api/duel</code> · 400ms poll + optimistic local · WebRTC P2P upgrade pending.
</p> </footer> </section> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-vs.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-vs.astro";
const $$url = "/drum-vs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumVs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
