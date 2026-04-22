(function () {
  "use strict";

  const STORAGE_KEY = "sitting-with-gandalf-log";
  const SETTINGS_KEY = "sitting-with-gandalf-settings";
  const DEFAULT_MINUTES = 15;

  const modeLines = {
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
    ],
    stars: [
      "Old light arrives late and still finds the window.",
      "Let the constellations do the remembering for a while.",
      "A quiet room can be larger than a kingdom.",
      "Stars are patient witnesses. Borrow their manners.",
      "Even night keeps a few small lamps lit."
    ]
  };

  const modeTones = {
    fire: { low: 82.41, high: 123.47, drone: 0.18 },
    rain: { low: 73.42, high: 110.0, drone: 0.13 },
    road: { low: 65.41, high: 98.0, drone: 0.15 },
    stars: { low: 92.5, high: 138.59, drone: 0.1 }
  };

  const phases = [
    { threshold: 0, name: "Settle", hint: "Shoulders down. Let the room find you." },
    { threshold: 0.22, name: "Drift", hint: "No errands here. Just the fire and the next breath." },
    { threshold: 0.72, name: "Return", hint: "Bring one useful thing back from the quiet." }
  ];

  const pace = [
    { label: "Inhale", seconds: 4 },
    { label: "Hold", seconds: 2 },
    { label: "Exhale", seconds: 6 }
  ];

  const savedSettings = loadSettings();
  const state = {
    duration: DEFAULT_MINUTES * 60,
    remaining: DEFAULT_MINUTES * 60,
    running: false,
    mode: savedSettings.mode || "fire",
    rings: 0,
    log: loadLog(),
    paceStartedAt: performance.now(),
    soundOn: false,
    warmth: savedSettings.warmth ?? 0.62,
    smoke: savedSettings.smoke ?? 0.58,
    lantern: false,
    phaseName: "Settle"
  };

  const dom = {
    body: document.body,
    timerFace: document.getElementById("timerFace"),
    timerText: document.getElementById("timerText"),
    timerCaption: document.getElementById("timerCaption"),
    wizardLine: document.getElementById("wizardLine"),
    phaseName: document.getElementById("phaseName"),
    phaseHint: document.getElementById("phaseHint"),
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
    lanternButton: document.getElementById("lanternButton"),
    lanternExitButton: document.getElementById("lanternExitButton"),
    hushButton: document.getElementById("hushButton"),
    warmthSlider: document.getElementById("warmthSlider"),
    smokeSlider: document.getElementById("smokeSlider"),
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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const visuals = {
    rings: [],
    particles: [],
    lastFrame: performance.now(),
    nextWisp: performance.now() + 1600,
    nextParticle: performance.now() + 300
  };

  const audio = {
    context: null,
    masterGain: null,
    droneGain: null,
    low: null,
    high: null,
    timers: []
  };

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

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function saveLog() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.log.slice(0, 12)));
  }

  function saveSettings() {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        mode: state.mode,
        warmth: state.warmth,
        smoke: state.smoke
      })
    );
  }

  function chooseLine() {
    const pool = modeLines[state.mode];
    const next = pool[Math.floor(Math.random() * pool.length)];
    dom.wizardLine.textContent = next;
  }

  function updateTimer() {
    const progress = 1 - state.remaining / state.duration;
    const degrees = Math.max(0, Math.min(360, progress * 360));
    dom.timerFace.style.setProperty("--progress", `${degrees}deg`);
    dom.timerText.textContent = formatTime(state.remaining);
    dom.timerCaption.textContent = state.running ? "keeping watch" : "pipe pause";
    updatePhase(progress);
  }

  function updatePhase(progress) {
    const active = phases.reduce((current, phase) => (progress >= phase.threshold ? phase : current), phases[0]);

    if (active.name !== state.phaseName) {
      state.phaseName = active.name;
      if (state.running) {
        addSmoke({ count: 4, power: 0.8, spread: 54, countTowardSession: false });
      }
    }

    dom.phaseName.textContent = active.name;
    dom.phaseHint.textContent = active.hint;
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
      empty.textContent = "No notes saved yet.";
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
      const mode = entry.mode ? ` / ${entry.mode}` : "";

      meta.className = "log-meta";
      note.className = "log-note";

      left.textContent = `${entry.minutes} min / ${entry.blend}${mode}`;
      right.textContent = entry.date;
      note.textContent = entry.note || "A quiet bowl, kept well.";

      meta.append(left, right);
      item.append(meta, note);
      dom.logList.append(item);
    });

    updateStats();
  }

  async function startSession() {
    if (state.remaining <= 0) {
      state.remaining = state.duration;
    }

    state.running = true;
    state.paceStartedAt = performance.now();
    dom.startButton.textContent = "Running";
    dom.startButton.disabled = true;
    dom.pauseButton.disabled = false;
    chooseLine();

    if (!state.soundOn) {
      await setSound(true);
    }
  }

  function pauseSession() {
    state.running = false;
    dom.startButton.textContent = "Resume quiet sit";
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.timerCaption.textContent = "pipe pause";
  }

  function resetSession() {
    state.running = false;
    state.remaining = state.duration;
    state.phaseName = "";
    dom.startButton.textContent = "Start quiet sit";
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.paceLabel.textContent = "Settle";
    dom.paceCount.textContent = "0";
    dom.paceBar.style.width = "0%";
    updateTimer();
  }

  function completeSession() {
    pauseSession();
    dom.startButton.textContent = "Start quiet sit";
    state.remaining = 0;
    updateTimer();
    dom.wizardLine.textContent = "There. A little more room in the world.";
    addSmoke({ count: 12, power: 1.2, spread: 100, countTowardSession: true });
    spawnParticles(18);
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
    dom.body.dataset.mode = mode;
    dom.modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });
    saveSettings();
    chooseLine();
    tuneDrone();

    if (state.soundOn) {
      clearSoundTimers();
      scheduleAmbience();
    }
  }

  function setWarmth(value) {
    state.warmth = Number(value) / 100;
    saveSettings();
    updateAudioLevels();
  }

  function setSmoke(value) {
    state.smoke = Number(value) / 100;
    saveSettings();
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
      mode: state.mode,
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
    const baseCount = options.count || 1;
    const intensity = 0.35 + state.smoke * 0.95;
    const count = Math.max(1, Math.round(baseCount * intensity));
    const power = options.power || 0.7;
    const spread = options.spread || 24;
    const originX = options.x || window.innerWidth * 0.68;
    const originY = options.y || window.innerHeight * 0.72;

    for (let index = 0; index < count; index += 1) {
      visuals.rings.push({
        x: originX + (Math.random() - 0.5) * spread,
        y: originY + (Math.random() - 0.5) * spread * 0.45,
        radius: 10 + Math.random() * 14,
        alpha: (0.26 + Math.random() * 0.22) * intensity,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.22 - Math.random() * 0.38 - power * 0.08,
        wobble: Math.random() * 200,
        stretch: 0.58 + Math.random() * 0.34,
        line: 1 + Math.random() * 1.8
      });
    }

    visuals.rings = visuals.rings.slice(-150);

    if (options.countTowardSession) {
      state.rings += count;
      updateStats();
    }
  }

  function spawnParticles(count) {
    if (reducedMotion) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const type = state.mode;

      if (type === "rain") {
        visuals.particles.push({
          type,
          x: Math.random() * window.innerWidth,
          y: -30 - Math.random() * 160,
          vx: -0.8 - Math.random() * 0.6,
          vy: 8 + Math.random() * 7,
          length: 14 + Math.random() * 34,
          alpha: 0.16 + Math.random() * 0.22,
          life: 1
        });
        continue;
      }

      if (type === "road") {
        visuals.particles.push({
          type,
          x: window.innerWidth * (0.35 + Math.random() * 0.48),
          y: window.innerHeight * (0.58 + Math.random() * 0.3),
          vx: -0.16 + Math.random() * 0.34,
          vy: -0.06 - Math.random() * 0.22,
          radius: 1.2 + Math.random() * 3.8,
          alpha: 0.12 + Math.random() * 0.16,
          life: 1
        });
        continue;
      }

      if (type === "stars") {
        visuals.particles.push({
          type,
          x: window.innerWidth * (0.24 + Math.random() * 0.66),
          y: window.innerHeight * (0.08 + Math.random() * 0.52),
          vx: -0.02 + Math.random() * 0.04,
          vy: -0.02 + Math.random() * 0.04,
          radius: 0.9 + Math.random() * 2.4,
          alpha: 0.16 + Math.random() * 0.28,
          twinkle: Math.random() * 1000,
          life: 1
        });
        continue;
      }

      visuals.particles.push({
        type: "fire",
        x: window.innerWidth * (0.62 + Math.random() * 0.34),
        y: window.innerHeight * (0.72 + Math.random() * 0.22),
        vx: -0.08 + Math.random() * 0.18,
        vy: -0.36 - Math.random() * 0.74,
        radius: 1.4 + Math.random() * 3.8,
        alpha: 0.18 + Math.random() * 0.32,
        life: 1
      });
    }

    visuals.particles = visuals.particles.slice(-220);
  }

  function drawParticles(delta, now) {
    visuals.particles.forEach((particle) => {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta * (particle.type === "rain" ? 0.00038 : 0.00012);

      if (particle.type === "rain") {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x + particle.vx * particle.length, particle.y + particle.length);
        ctx.strokeStyle = `rgba(176, 196, 207, ${Math.max(0, particle.alpha * particle.life)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      if (particle.type === "stars") {
        const pulse = 0.6 + Math.sin((now + particle.twinkle) / 460) * 0.4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(221, 226, 207, ${Math.max(0, particle.alpha * particle.life * pulse)})`;
        ctx.shadowColor = "rgba(157, 179, 213, 0.38)";
        ctx.shadowBlur = 10;
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      const color = particle.type === "road" ? "209, 168, 91" : "232, 156, 67";
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color}, ${Math.max(0, particle.alpha * particle.life)})`;
      ctx.shadowColor = `rgba(${color}, 0.26)`;
      ctx.shadowBlur = particle.type === "road" ? 6 : 12;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    visuals.particles = visuals.particles.filter((particle) => {
      return particle.life > 0 && particle.y < window.innerHeight + 80 && particle.y > -180 && particle.x > -120 && particle.x < window.innerWidth + 120;
    });
  }

  function drawSmoke(now) {
    const delta = Math.min(42, now - visuals.lastFrame || 16);
    visuals.lastFrame = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.shadowBlur = 0;

    if (!reducedMotion && now > visuals.nextParticle) {
      const count = state.mode === "rain" ? 7 : state.mode === "stars" ? 2 : 3;
      spawnParticles(count);
      visuals.nextParticle = now + (state.mode === "rain" ? 110 : state.mode === "stars" ? 900 : 420);
    }

    if (state.running && now > visuals.nextWisp) {
      addSmoke({ count: 1, power: 0.4, spread: 32, countTowardSession: false });
      visuals.nextWisp = now + 1900 + Math.random() * (5200 - state.smoke * 2600);
    }

    drawParticles(delta, now);

    visuals.rings.forEach((ring) => {
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

    visuals.rings = visuals.rings.filter((ring) => ring.alpha > 0 && ring.y > -120);
    requestAnimationFrame(drawSmoke);
  }

  function createAudioGraph() {
    audio.context = new (window.AudioContext || window.webkitAudioContext)();
    audio.masterGain = audio.context.createGain();
    audio.droneGain = audio.context.createGain();
    audio.low = audio.context.createOscillator();
    audio.high = audio.context.createOscillator();

    audio.low.type = "sine";
    audio.high.type = "triangle";
    audio.low.connect(audio.droneGain);
    audio.high.connect(audio.droneGain);
    audio.droneGain.connect(audio.masterGain);
    audio.masterGain.connect(audio.context.destination);

    tuneDrone();
    updateAudioLevels();
    audio.low.start();
    audio.high.start();
  }

  function updateAudioLevels() {
    if (!audio.context || !audio.masterGain || !audio.droneGain) {
      return;
    }

    const now = audio.context.currentTime;
    const tone = modeTones[state.mode];
    audio.masterGain.gain.setTargetAtTime(state.warmth * 0.18, now, 0.08);
    audio.droneGain.gain.setTargetAtTime(tone.drone * (0.35 + state.warmth), now, 0.14);
  }

  function tuneDrone() {
    if (!audio.context || !audio.low || !audio.high) {
      return;
    }

    const now = audio.context.currentTime;
    const tone = modeTones[state.mode];
    audio.low.frequency.setTargetAtTime(tone.low, now, 0.22);
    audio.high.frequency.setTargetAtTime(tone.high, now, 0.22);
    updateAudioLevels();
  }

  function clearSoundTimers() {
    audio.timers.forEach((timer) => window.clearTimeout(timer));
    audio.timers = [];
  }

  function queueSound(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    audio.timers.push(timer);
  }

  function noiseBuffer(duration) {
    const samples = Math.floor(audio.context.sampleRate * duration);
    const buffer = audio.context.createBuffer(1, samples, audio.context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < samples; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function playNoise(options) {
    const now = audio.context.currentTime;
    const source = audio.context.createBufferSource();
    const filter = audio.context.createBiquadFilter();
    const gain = audio.context.createGain();

    source.buffer = noiseBuffer(options.duration);
    filter.type = options.filterType;
    filter.frequency.value = options.frequency;
    filter.Q.value = options.q || 0.7;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(options.gain * state.warmth, now + options.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);

    source.connect(filter).connect(gain).connect(audio.masterGain);
    source.start(now);
    source.stop(now + options.duration + 0.02);
  }

  function playBell() {
    const now = audio.context.currentTime;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    const frequencies = [329.63, 392.0, 493.88, 587.33];

    oscillator.type = "sine";
    oscillator.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025 * state.warmth, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    oscillator.connect(gain).connect(audio.masterGain);
    oscillator.start(now);
    oscillator.stop(now + 2.4);
  }

  function playRoadStep() {
    const now = audio.context.currentTime;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(82 + Math.random() * 18, now);
    oscillator.frequency.exponentialRampToValueAtTime(46, now + 0.18);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025 * state.warmth, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(gain).connect(audio.masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }

  function scheduleAmbience() {
    if (!state.soundOn || !audio.context || audio.context.state === "suspended") {
      return;
    }

    if (state.mode === "rain") {
      playNoise({ duration: 0.18, filterType: "highpass", frequency: 1500, q: 0.6, gain: 0.018, attack: 0.018 });
      queueSound(scheduleAmbience, 70 + Math.random() * 180);
      return;
    }

    if (state.mode === "road") {
      playNoise({ duration: 0.62, filterType: "lowpass", frequency: 620, q: 0.5, gain: 0.012, attack: 0.12 });
      if (Math.random() > 0.55) {
        playRoadStep();
      }
      queueSound(scheduleAmbience, 480 + Math.random() * 1400);
      return;
    }

    if (state.mode === "stars") {
      if (Math.random() > 0.32) {
        playBell();
      }
      queueSound(scheduleAmbience, 1800 + Math.random() * 4200);
      return;
    }

    playNoise({ duration: 0.035 + Math.random() * 0.09, filterType: "bandpass", frequency: 550 + Math.random() * 1800, q: 1.4, gain: 0.12 + Math.random() * 0.12, attack: 0.006 });
    queueSound(scheduleAmbience, 120 + Math.random() * 850);
  }

  async function setSound(nextOn) {
    state.soundOn = nextOn;

    if (!state.soundOn) {
      dom.soundButton.textContent = "Turn ambience on";
      clearSoundTimers();
      if (audio.context) {
        await audio.context.suspend();
      }
      return;
    }

    if (!audio.context) {
      createAudioGraph();
    }

    dom.soundButton.textContent = "Mute ambience";
    await audio.context.resume();
    tuneDrone();
    updateAudioLevels();
    clearSoundTimers();
    scheduleAmbience();
  }

  function hush() {
    setSound(false);
    visuals.rings = [];
    visuals.particles = [];
    dom.wizardLine.textContent = "A good silence asks for nothing.";
  }

  function toggleLantern(force) {
    state.lantern = typeof force === "boolean" ? force : !state.lantern;
    dom.body.classList.toggle("lantern-mode", state.lantern);
    dom.lanternButton.textContent = state.lantern ? "Exit focus" : "Focus view";
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
  dom.soundButton.addEventListener("click", () => setSound(!state.soundOn));
  dom.hushButton.addEventListener("click", hush);
  dom.lanternButton.addEventListener("click", () => toggleLantern());
  dom.lanternExitButton.addEventListener("click", () => toggleLantern(false));
  dom.warmthSlider.addEventListener("input", (event) => setWarmth(event.target.value));
  dom.smokeSlider.addEventListener("input", (event) => setSmoke(event.target.value));
  dom.sealEntryButton.addEventListener("click", sealEntry);
  dom.clearLogButton.addEventListener("click", clearLog);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.lantern) {
      toggleLantern(false);
    }
  });

  dom.warmthSlider.value = String(Math.round(state.warmth * 100));
  dom.smokeSlider.value = String(Math.round(state.smoke * 100));

  resizeCanvas();
  renderLog();
  setMode(state.mode);
  updateTimer();
  requestAnimationFrame(tick);
  requestAnimationFrame(drawSmoke);
})();
