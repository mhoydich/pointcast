(function () {
  "use strict";

  const STORAGE_KEY = "sitting-with-gandalf-log";
  const DEFAULT_MINUTES = 15;

  const lines = {
    fire: [
      "Sit down, then. Haste has already had its say.",
      "A fire is a very old kind of clock. Listen until it names the hour.",
      "Trouble may wait outside. It knows the rules of a closed round door.",
      "The smallest pause can hold a surprising amount of courage.",
      "Let the smoke take the sharp edges off the road."
    ],
    rain: [
      "Rain on the roof is the road speaking from a distance.",
      "There is no shame in being still while the weather does the traveling.",
      "A wet cloak dries faster beside patience.",
      "The world is rinsing its face. Give yours a rest as well.",
      "Even thunder sounds gentler from a good chair."
    ],
    road: [
      "The road has many opinions. You need not answer every one.",
      "A map is only a promise made by ink.",
      "Pack lightly, but keep one song where you can reach it.",
      "Mountains look smaller after a proper pause.",
      "Not every journey improves by beginning at once."
    ]
  };

  const pace = [
    { label: "Draw", seconds: 4 },
    { label: "Rest", seconds: 2 },
    { label: "Exhale", seconds: 6 }
  ];

  const state = {
    duration: DEFAULT_MINUTES * 60,
    remaining: DEFAULT_MINUTES * 60,
    running: false,
    mode: "fire",
    rings: 0,
    log: loadLog(),
    paceStartedAt: performance.now(),
    soundOn: false
  };

  const dom = {
    timerFace: document.getElementById("timerFace"),
    timerText: document.getElementById("timerText"),
    timerCaption: document.getElementById("timerCaption"),
    wizardLine: document.getElementById("wizardLine"),
    durationButtons: Array.from(document.querySelectorAll(".duration-button")),
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    startButton: document.getElementById("startButton"),
    pauseButton: document.getElementById("pauseButton"),
    resetButton: document.getElementById("resetButton"),
    blendSelect: document.getElementById("blendSelect"),
    drawButton: document.getElementById("drawButton"),
    exhaleButton: document.getElementById("exhaleButton"),
    wisdomButton: document.getElementById("wisdomButton"),
    soundButton: document.getElementById("soundButton"),
    paceLabel: document.getElementById("paceLabel"),
    paceCount: document.getElementById("paceCount"),
    paceBar: document.getElementById("paceBar"),
    ringCount: document.getElementById("ringCount"),
    sessionCount: document.getElementById("sessionCount"),
    totalMinutes: document.getElementById("totalMinutes"),
    noteInput: document.getElementById("noteInput"),
    sealEntryButton: document.getElementById("sealEntryButton"),
    clearLogButton: document.getElementById("clearLogButton"),
    logList: document.getElementById("logList"),
    canvas: document.getElementById("smokeCanvas")
  };

  const ctx = dom.canvas.getContext("2d");
  const smoke = {
    rings: [],
    lastFrame: performance.now(),
    nextWisp: performance.now() + 2200
  };

  let audioContext = null;
  let masterGain = null;
  let crackleTimer = null;

  function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function loadLog() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveLog() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.log.slice(0, 12)));
  }

  function chooseLine() {
    const pool = lines[state.mode];
    const next = pool[Math.floor(Math.random() * pool.length)];
    dom.wizardLine.textContent = next;
  }

  function updateTimer() {
    const progress = 1 - state.remaining / state.duration;
    const degrees = Math.max(0, Math.min(360, progress * 360));
    dom.timerFace.style.setProperty("--progress", `${degrees}deg`);
    dom.timerText.textContent = formatTime(state.remaining);
    dom.timerCaption.textContent = state.running ? "keeping watch" : "pipe pause";
  }

  function updateStats() {
    const totalMinutes = state.log.reduce((sum, entry) => sum + entry.minutes, 0);
    dom.ringCount.textContent = String(state.rings);
    dom.sessionCount.textContent = String(state.log.length);
    dom.totalMinutes.textContent = String(totalMinutes);
  }

  function renderLog() {
    dom.logList.replaceChildren();

    if (state.log.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No entries sealed yet.";
      dom.logList.append(empty);
      updateStats();
      return;
    }

    state.log.slice(0, 8).forEach((entry) => {
      const item = document.createElement("li");
      const meta = document.createElement("div");
      const note = document.createElement("p");
      const left = document.createElement("span");
      const right = document.createElement("span");

      meta.className = "log-meta";
      note.className = "log-note";

      left.textContent = `${entry.minutes} min / ${entry.blend}`;
      right.textContent = entry.date;
      note.textContent = entry.note || "A quiet bowl, kept well.";

      meta.append(left, right);
      item.append(meta, note);
      dom.logList.append(item);
    });

    updateStats();
  }

  function startSession() {
    if (state.remaining <= 0) {
      state.remaining = state.duration;
    }

    state.running = true;
    state.paceStartedAt = performance.now();
    dom.startButton.textContent = "Resume";
    dom.startButton.disabled = true;
    dom.pauseButton.disabled = false;
    chooseLine();
  }

  function pauseSession() {
    state.running = false;
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.timerCaption.textContent = "pipe pause";
  }

  function resetSession() {
    state.running = false;
    state.remaining = state.duration;
    dom.startButton.textContent = "Start";
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.paceLabel.textContent = "Settle";
    dom.paceCount.textContent = "0";
    dom.paceBar.style.width = "0%";
    updateTimer();
  }

  function completeSession() {
    pauseSession();
    dom.startButton.textContent = "Start";
    state.remaining = 0;
    updateTimer();
    dom.wizardLine.textContent = "There. A little more room in the world.";
    addSmoke({ count: 10, power: 1.2, spread: 90, countTowardSession: true });
  }

  function setDuration(minutes) {
    state.duration = minutes * 60;
    state.remaining = state.duration;
    dom.durationButtons.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.minutes) === minutes);
    });
    resetSession();
  }

  function setMode(mode) {
    state.mode = mode;
    document.body.dataset.mode = mode;
    dom.modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });
    chooseLine();
  }

  function sealEntry() {
    const minutes = Math.round(state.duration / 60);
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

    state.log.unshift({
      date: formatter.format(new Date()),
      minutes,
      blend: dom.blendSelect.value,
      rings: state.rings,
      note: dom.noteInput.value.trim()
    });

    state.log = state.log.slice(0, 12);
    dom.noteInput.value = "";
    saveLog();
    renderLog();
    dom.wizardLine.textContent = "A record kept is a small lantern against forgetfulness.";
  }

  function clearLog() {
    state.log = [];
    saveLog();
    renderLog();
    dom.wizardLine.textContent = "Blank pages are not empty. They are patient.";
  }

  function updatePace(now) {
    if (!state.running) {
      return;
    }

    const total = pace.reduce((sum, item) => sum + item.seconds, 0);
    const elapsed = ((now - state.paceStartedAt) / 1000) % total;
    let cursor = 0;

    for (const item of pace) {
      const nextCursor = cursor + item.seconds;
      if (elapsed <= nextCursor) {
        const local = elapsed - cursor;
        const countdown = Math.max(1, Math.ceil(item.seconds - local));
        const width = Math.min(100, (local / item.seconds) * 100);
        dom.paceLabel.textContent = item.label;
        dom.paceCount.textContent = String(countdown);
        dom.paceBar.style.width = `${width}%`;
        return;
      }
      cursor = nextCursor;
    }
  }

  function tick(now) {
    if (!tick.previous) {
      tick.previous = now;
    }

    const delta = (now - tick.previous) / 1000;
    tick.previous = now;

    if (state.running) {
      state.remaining = Math.max(0, state.remaining - delta);
      if (state.remaining <= 0) {
        completeSession();
      }
      updatePace(now);
    }

    updateTimer();
    requestAnimationFrame(tick);
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    dom.canvas.width = Math.floor(window.innerWidth * ratio);
    dom.canvas.height = Math.floor(window.innerHeight * ratio);
    dom.canvas.style.width = `${window.innerWidth}px`;
    dom.canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function addSmoke(options) {
    const count = options.count || 1;
    const power = options.power || 0.7;
    const spread = options.spread || 24;
    const originX = options.x || window.innerWidth * 0.68;
    const originY = options.y || window.innerHeight * 0.72;

    for (let index = 0; index < count; index += 1) {
      smoke.rings.push({
        x: originX + (Math.random() - 0.5) * spread,
        y: originY + (Math.random() - 0.5) * spread * 0.45,
        radius: 10 + Math.random() * 14,
        alpha: 0.36 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.22 - Math.random() * 0.38 - power * 0.08,
        wobble: Math.random() * 200,
        stretch: 0.58 + Math.random() * 0.34,
        line: 1 + Math.random() * 1.8
      });
    }

    smoke.rings = smoke.rings.slice(-130);

    if (options.countTowardSession) {
      state.rings += count;
      updateStats();
    }
  }

  function drawSmoke(now) {
    const delta = Math.min(42, now - smoke.lastFrame || 16);
    smoke.lastFrame = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (state.running && now > smoke.nextWisp) {
      addSmoke({ count: 1, power: 0.4, spread: 32, countTowardSession: false });
      smoke.nextWisp = now + 3200 + Math.random() * 4200;
    }

    smoke.rings.forEach((ring) => {
      ring.radius += delta * 0.018;
      ring.x += ring.vx * delta + Math.sin((now + ring.wobble) / 760) * 0.08;
      ring.y += ring.vy * delta;
      ring.alpha -= delta * 0.00012;

      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * ring.stretch, Math.sin(now / 1600) * 0.18, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(233, 231, 213, ${Math.max(0, ring.alpha)})`;
      ctx.lineWidth = ring.line;
      ctx.shadowColor = "rgba(232, 156, 67, 0.12)";
      ctx.shadowBlur = 12;
      ctx.stroke();
    });

    smoke.rings = smoke.rings.filter((ring) => ring.alpha > 0 && ring.y > -120);
    requestAnimationFrame(drawSmoke);
  }

  function createAudioGraph() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.08;
    masterGain.connect(audioContext.destination);

    const low = audioContext.createOscillator();
    const fifth = audioContext.createOscillator();
    const lowGain = audioContext.createGain();
    const fifthGain = audioContext.createGain();

    low.type = "sine";
    fifth.type = "triangle";
    low.frequency.value = 82.41;
    fifth.frequency.value = 123.47;
    lowGain.gain.value = 0.18;
    fifthGain.gain.value = 0.05;

    low.connect(lowGain).connect(masterGain);
    fifth.connect(fifthGain).connect(masterGain);
    low.start();
    fifth.start();
  }

  function scheduleCrackle() {
    if (!state.soundOn || !audioContext || !masterGain) {
      return;
    }

    const duration = 0.035 + Math.random() * 0.09;
    const samples = Math.floor(audioContext.sampleRate * duration);
    const buffer = audioContext.createBuffer(1, samples, audioContext.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < samples; index += 1) {
      const fade = 1 - index / samples;
      channel[index] = (Math.random() * 2 - 1) * fade * fade;
    }

    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    filter.type = "bandpass";
    filter.frequency.value = 550 + Math.random() * 1800;
    gain.gain.value = 0.08 + Math.random() * 0.18;

    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(masterGain);
    source.start();

    crackleTimer = window.setTimeout(scheduleCrackle, 120 + Math.random() * 850);
  }

  async function toggleSound() {
    state.soundOn = !state.soundOn;

    if (!state.soundOn) {
      dom.soundButton.textContent = "Ambience off";
      window.clearTimeout(crackleTimer);
      if (audioContext) {
        await audioContext.suspend();
      }
      return;
    }

    if (!audioContext) {
      createAudioGraph();
    }

    await audioContext.resume();
    dom.soundButton.textContent = "Ambience on";
    scheduleCrackle();
  }

  dom.durationButtons.forEach((button) => {
    button.addEventListener("click", () => setDuration(Number(button.dataset.minutes)));
  });

  dom.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  dom.startButton.addEventListener("click", startSession);
  dom.pauseButton.addEventListener("click", pauseSession);
  dom.resetButton.addEventListener("click", resetSession);
  dom.drawButton.addEventListener("click", () => addSmoke({ count: 2, power: 0.8, spread: 28, countTowardSession: true }));
  dom.exhaleButton.addEventListener("click", () => addSmoke({ count: 7, power: 1.2, spread: 72, countTowardSession: true }));
  dom.wisdomButton.addEventListener("click", chooseLine);
  dom.soundButton.addEventListener("click", toggleSound);
  dom.sealEntryButton.addEventListener("click", sealEntry);
  dom.clearLogButton.addEventListener("click", clearLog);
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  renderLog();
  updateTimer();
  requestAnimationFrame(tick);
  requestAnimationFrame(drawSmoke);
})();
