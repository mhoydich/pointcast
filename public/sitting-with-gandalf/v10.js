(function () {
  "use strict";

  const SETTINGS_KEY = "sitting-with-gandalf-settings";
  const RELEASE = "v10-atelier";
  const RELEASE_MARKER_KEY = "sitting-with-gandalf-release-v10-atelier";
  const DEFAULT_MINUTES = 5;

  const fires = [
    {
      id: "hearth",
      name: "Hearth flicker",
      short: "Hearth",
      desc: "Slow amber flame with an old-room pulse.",
      accent: "#e9a24b",
      deep: "#6e321e",
      glow: "rgba(232, 121, 45, 0.42)",
      audio: { min: 180, max: 620, frequency: 820, spread: 900, gain: 0.038, duration: 0.08, filter: "bandpass", drone: 78 }
    },
    {
      id: "pixel",
      name: "Pixel fire",
      short: "Pixel",
      desc: "Chunky Pico-8 blocks, bright and square.",
      accent: "#ffcc33",
      deep: "#7a1f24",
      glow: "rgba(255, 204, 51, 0.36)",
      audio: { min: 95, max: 260, frequency: 1200, spread: 1200, gain: 0.027, duration: 0.035, filter: "highpass", drone: 96 }
    },
    {
      id: "bonfire",
      name: "Bonfire",
      short: "Bonfire",
      desc: "Tall flame, loud logs, ember pops.",
      accent: "#ff7a32",
      deep: "#7f2f20",
      glow: "rgba(255, 103, 45, 0.5)",
      audio: { min: 115, max: 430, frequency: 650, spread: 1700, gain: 0.052, duration: 0.12, filter: "bandpass", drone: 68 }
    },
    {
      id: "wisp",
      name: "Wisp",
      short: "Wisp",
      desc: "Small pale orbs drifting blue-green.",
      accent: "#8ce8c5",
      deep: "#245465",
      glow: "rgba(91, 217, 193, 0.34)",
      audio: { min: 420, max: 1100, frequency: 1500, spread: 600, gain: 0.016, duration: 0.16, filter: "bandpass", drone: 132, chime: true }
    },
    {
      id: "wizard",
      name: "Wizard fire",
      short: "Wizard",
      desc: "Cold cyan-violet flame turning slowly.",
      accent: "#8dc8ff",
      deep: "#49376f",
      glow: "rgba(117, 164, 255, 0.36)",
      audio: { min: 280, max: 820, frequency: 980, spread: 1200, gain: 0.024, duration: 0.16, filter: "bandpass", drone: 104, chime: true }
    },
    {
      id: "storm",
      name: "Storm fire",
      short: "Storm",
      desc: "Wind-lashed sideways flame with gaps.",
      accent: "#f0d17d",
      deep: "#42506e",
      glow: "rgba(235, 196, 97, 0.34)",
      audio: { min: 90, max: 760, frequency: 520, spread: 2100, gain: 0.046, duration: 0.18, filter: "bandpass", drone: 58, gust: true }
    },
    {
      id: "ember-rain",
      name: "Ember rain",
      short: "Ember",
      desc: "Sparks fall like ash from above.",
      accent: "#ff9860",
      deep: "#693525",
      glow: "rgba(255, 126, 64, 0.34)",
      audio: { min: 70, max: 210, frequency: 2400, spread: 1800, gain: 0.018, duration: 0.028, filter: "highpass", drone: 72 }
    },
    {
      id: "smoke",
      name: "Smoke ribbons",
      short: "Smoke",
      desc: "Slow gray wisps with a hidden coal.",
      accent: "#b8c1bd",
      deep: "#3a4643",
      glow: "rgba(160, 173, 164, 0.22)",
      audio: { min: 520, max: 1600, frequency: 260, spread: 280, gain: 0.018, duration: 0.72, filter: "lowpass", drone: 52, gust: true }
    },
    {
      id: "glass",
      name: "Stained glass",
      short: "Glass",
      desc: "Geometric color panes shifting like flame.",
      accent: "#f2c14e",
      deep: "#2f4b7c",
      glow: "rgba(242, 193, 78, 0.32)",
      audio: { min: 260, max: 740, frequency: 1180, spread: 950, gain: 0.022, duration: 0.09, filter: "bandpass", drone: 88, chime: true }
    },
    {
      id: "coal",
      name: "Coal glow",
      short: "Coal",
      desc: "Deep red pulse, nearly still.",
      accent: "#cf4b32",
      deep: "#4b1716",
      glow: "rgba(202, 55, 37, 0.3)",
      audio: { min: 820, max: 2100, frequency: 180, spread: 160, gain: 0.016, duration: 0.46, filter: "lowpass", drone: 46 }
    }
  ];

  const gandalfs = [
    {
      id: "mondrian",
      style: "Mondrian",
      name: "Mondrian Gandalf",
      desc: "Primary geometry, black grid, white field.",
      path: "assets/v10/gandalf-mondrian.png",
      accent: "#e8c33a",
      deep: "#192b45",
      note: "Reduction is also a form of warmth."
    },
    {
      id: "miro",
      style: "Miro",
      name: "Miro Gandalf",
      desc: "Biomorphic glyphs keeping playful watch.",
      path: "assets/v10/gandalf-miro.png",
      accent: "#e45f46",
      deep: "#243a63",
      note: "Let the small creatures of the page keep watch."
    },
    {
      id: "degas",
      style: "Degas",
      name: "Degas Gandalf",
      desc: "Pastel motion, soft light, staff in blur.",
      path: "assets/v10/gandalf-degas.png",
      accent: "#ddb69b",
      deep: "#57485b",
      note: "Movement is the still thing seen twice."
    },
    {
      id: "monet",
      style: "Monet",
      name: "Monet Gandalf",
      desc: "Garden light dissolving the old silhouette.",
      path: "assets/v10/gandalf-monet.png",
      accent: "#caa7d8",
      deep: "#496f64",
      note: "What dissolves remains."
    },
    {
      id: "klint",
      style: "Klint",
      name: "Klint Gandalf",
      desc: "Mystic diagram, circles, spirals, gold.",
      path: "assets/v10/gandalf-klint.png",
      accent: "#e2b875",
      deep: "#5d4569",
      note: "Look beyond the diagram, then look at it again."
    },
    {
      id: "kandinsky",
      style: "Kandinsky",
      name: "Kandinsky Gandalf",
      desc: "A bright chord of triangles, circles, lines.",
      path: "assets/v10/gandalf-kandinsky.png",
      accent: "#70b7ff",
      deep: "#37366f",
      note: "A triangle has a temperature."
    },
    {
      id: "hokusai",
      style: "Hokusai",
      name: "Hokusai Gandalf",
      desc: "Woodblock mountains, indigo wind, staff.",
      path: "assets/v10/gandalf-hokusai.png",
      accent: "#6ba3d9",
      deep: "#173a5b",
      note: "The mountain does not mind the storm."
    }
  ];

  const dom = {
    body: document.body,
    wizardLine: document.getElementById("wizardLine"),
    guideStep: document.getElementById("guideStep"),
    guideTitle: document.getElementById("guideTitle"),
    guideText: document.getElementById("guideText"),
    phaseName: document.getElementById("phaseName"),
    phaseHint: document.getElementById("phaseHint"),
    wallpaper: document.getElementById("v10Wallpaper"),
    easelButton: document.getElementById("v10EaselButton"),
    easelImage: document.getElementById("v10EaselImage"),
    easelLabel: document.getElementById("v10EaselLabel"),
    hearthCanvas: document.getElementById("v10HearthCanvas"),
    hearthLabel: document.getElementById("v10HearthLabel"),
    fireWall: document.getElementById("v10FireWall"),
    gandalfWall: document.getElementById("v10GandalfWall"),
    firePicker: document.getElementById("v10FirePicker"),
    gandalfPicker: document.getElementById("v10GandalfPicker"),
    selectionTitle: document.getElementById("v10SelectionTitle"),
    selectionText: document.getElementById("v10SelectionText"),
    comboProgress: document.getElementById("v10ComboProgress"),
    beginButton: document.getElementById("v10BeginButton"),
    audioButton: document.getElementById("v10AudioButton"),
    resetButton: document.getElementById("v10ResetButton"),
    durationButtons: Array.from(document.querySelectorAll(".v10-duration-button")),
    timerText: document.getElementById("v10TimerText"),
    timerCaption: document.getElementById("v10TimerCaption"),
    noteStyle: document.getElementById("v10NoteStyle"),
    noteBody: document.getElementById("v10NoteBody"),
    studioNote: document.getElementById("v10StudioNote"),
    studioNoteText: document.getElementById("v10StudioNoteText"),
    versionButtons: Array.from(document.querySelectorAll(".version-button")),
    versionSelect: document.getElementById("versionSelect")
  };

  if (!dom.hearthCanvas) return;

  const fireIds = new Set(fires.map((fire) => fire.id));
  const gandalfIds = new Set(gandalfs.map((gandalf) => gandalf.id));
  const audio = { context: null, master: null, drone: null, droneGain: null, timers: [] };
  const renderer = {
    raf: 0,
    lastFrame: performance.now(),
    sparks: Array.from({ length: 54 }, (_, index) => ({
      x: (index * 73) % 640,
      y: (index * 191) % 360,
      speed: 24 + ((index * 17) % 76),
      size: 1 + (index % 4)
    }))
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  const saved = loadJson(SETTINGS_KEY, {});
  const savedSeen = Array.isArray(saved.v10Seen) ? saved.v10Seen.filter((id) => typeof id === "string") : [];
  const state = {
    fire: fireIds.has(saved.v10Fire) ? saved.v10Fire : "hearth",
    gandalf: gandalfIds.has(saved.v10Gandalf) ? saved.v10Gandalf : "mondrian",
    minutes: [5, 10, 20].includes(Number(saved.v10Minutes)) ? Number(saved.v10Minutes) : DEFAULT_MINUTES,
    remaining: ([5, 10, 20].includes(Number(saved.v10Minutes)) ? Number(saved.v10Minutes) : DEFAULT_MINUTES) * 60,
    running: false,
    view: "atelier",
    lastTick: 0,
    audioOn: false,
    seen: new Set(savedSeen)
  };

  function isV10() {
    return dom.body.dataset.version === "v10";
  }

  function activeFire() {
    return fires.find((fire) => fire.id === state.fire) || fires[0];
  }

  function activeGandalf() {
    return gandalfs.find((gandalf) => gandalf.id === state.gandalf) || gandalfs[0];
  }

  function comboId(fireId = state.fire, gandalfId = state.gandalf) {
    return `${fireId}:${gandalfId}`;
  }

  function markRelease() {
    try {
      if (!localStorage.getItem(RELEASE_MARKER_KEY)) {
        localStorage.setItem(RELEASE_MARKER_KEY, new Date().toISOString());
      }
    } catch (error) {}
  }

  function saveSettings() {
    const current = loadJson(SETTINGS_KEY, {});
    saveJson(SETTINGS_KEY, {
      ...current,
      release: RELEASE,
      version: "v10",
      v10Fire: state.fire,
      v10Gandalf: state.gandalf,
      v10Minutes: state.minutes,
      v10Seen: Array.from(state.seen).slice(0, 70)
    });
    markRelease();
  }

  function format(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function setGuide(step, title, text) {
    if (!isV10()) return;
    if (dom.guideStep) dom.guideStep.textContent = step;
    if (dom.guideTitle) dom.guideTitle.textContent = title;
    if (dom.guideText) dom.guideText.textContent = text;
    if (dom.wizardLine) dom.wizardLine.textContent = text;
  }

  function applyPalette() {
    const fire = activeFire();
    const gandalf = activeGandalf();
    dom.body.dataset.v10Fire = fire.id;
    dom.body.dataset.v10Gandalf = gandalf.id;
    dom.body.dataset.v10View = state.view;
    dom.body.style.setProperty("--v10-accent", fire.accent);
    dom.body.style.setProperty("--v10-accent-deep", gandalf.deep);
    dom.body.style.setProperty("--v10-accent-soft", `${fire.accent}30`);
    dom.body.style.setProperty("--v10-accent-glow", `${gandalf.accent}66`);
    dom.body.style.setProperty("--v10-fire-glow", fire.glow);
  }

  function createThumb(fire) {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    drawThumb(canvas.getContext("2d"), fire);
    return canvas;
  }

  function drawThumb(ctx, fire) {
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = "#090706";
    ctx.fillRect(0, 0, 32, 32);
    if (fire.id === "pixel") {
      const colors = ["#5f1828", "#d64b2e", "#ff9f2c", "#ffd84b"];
      for (let y = 7; y < 30; y += 4) {
        for (let x = 6; x < 26; x += 4) {
          const band = Math.max(0, Math.min(3, Math.floor((30 - y) / 6) + ((x + y) % 3 === 0 ? 1 : 0)));
          ctx.fillStyle = colors[band];
          if (Math.abs(x - 16) < 13 - y * 0.24) ctx.fillRect(x, y, 4, 4);
        }
      }
      return;
    }
    if (fire.id === "wisp" || fire.id === "wizard") {
      ["#8ce8c5", "#8dc8ff", "#b678ff"].forEach((color, index) => {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(10 + index * 6, 19 - index * 4, 5 + index, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      return;
    }
    if (fire.id === "coal") {
      const gradient = ctx.createRadialGradient(16, 22, 2, 16, 22, 18);
      gradient.addColorStop(0, "#ff6f3c");
      gradient.addColorStop(0.4, "#9f2c24");
      gradient.addColorStop(1, "#120706");
      ctx.fillStyle = gradient;
      ctx.fillRect(2, 8, 28, 22);
      return;
    }
    const colors = fire.id === "glass" ? ["#f0d65c", "#e45f46", "#55a8d8", "#8bd06b"] : ["#ffd67a", "#ff8a35", "#c53a28"];
    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(16, 4 + index * 5);
      ctx.quadraticCurveTo(5 + index * 3, 17, 15, 29);
      ctx.quadraticCurveTo(28 - index * 2, 17, 16, 4 + index * 5);
      ctx.fill();
    });
    if (fire.id === "smoke") {
      ctx.strokeStyle = "#c7d0c8";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(11 + i * 5, 28);
        ctx.bezierCurveTo(7 + i * 8, 22, 21 - i * 4, 15, 14 + i * 4, 7);
        ctx.stroke();
      }
    }
  }

  function makeFireButton(fire, wall) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = wall ? "v10-wall-button v10-wall-fire" : "v10-picker-button";
    button.classList.toggle("active", fire.id === state.fire);
    button.setAttribute("aria-label", `${fire.name}: ${fire.desc}`);
    button.title = fire.name;
    button.append(createThumb(fire));
    if (!wall) {
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      const desc = document.createElement("small");
      name.textContent = fire.name;
      desc.textContent = fire.desc;
      copy.append(name, desc);
      button.append(copy);
    }
    button.addEventListener("click", () => setFire(fire.id));
    return button;
  }

  function makeGandalfButton(gandalf, wall) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = wall ? "v10-wall-button v10-wall-gandalf" : "v10-picker-button";
    button.classList.toggle("active", gandalf.id === state.gandalf);
    button.setAttribute("aria-label", `${gandalf.name}: ${gandalf.desc}`);
    button.title = gandalf.name;
    const image = document.createElement("img");
    image.src = gandalf.path;
    image.alt = "";
    image.loading = wall ? "eager" : "lazy";
    button.append(image);
    if (!wall) {
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      const desc = document.createElement("small");
      name.textContent = gandalf.name;
      desc.textContent = gandalf.desc;
      copy.append(name, desc);
      button.append(copy);
    }
    button.addEventListener("click", () => setGandalf(gandalf.id));
    return button;
  }

  function renderPickers() {
    dom.fireWall.replaceChildren(...fires.map((fire) => makeFireButton(fire, true)));
    dom.firePicker.replaceChildren(...fires.map((fire) => makeFireButton(fire, false)));
    dom.gandalfWall.replaceChildren(...gandalfs.map((gandalf) => makeGandalfButton(gandalf, true)));
    dom.gandalfPicker.replaceChildren(...gandalfs.map((gandalf) => makeGandalfButton(gandalf, false)));
  }

  function render() {
    const fire = activeFire();
    const gandalf = activeGandalf();
    applyPalette();
    dom.wallpaper.src = gandalf.path;
    dom.easelImage.src = gandalf.path;
    dom.easelLabel.textContent = gandalf.name;
    dom.hearthLabel.textContent = fire.name;
    dom.selectionTitle.textContent = `${fire.name} + ${gandalf.style}`;
    dom.selectionText.textContent = `${fire.desc} ${gandalf.desc}`;
    dom.comboProgress.textContent = `${state.seen.size} of 70 studio pairings kept`;
    dom.noteStyle.textContent = gandalf.style;
    dom.noteBody.textContent = gandalf.note;
    dom.studioNoteText.textContent = gandalf.note;
    dom.beginButton.textContent = state.running ? "Pause" : state.view === "complete" ? "Begin again" : "Begin";
    dom.audioButton.textContent = state.audioOn ? "Audio off" : "Audio on";
    dom.timerText.textContent = format(state.remaining);
    dom.timerCaption.textContent = state.running ? `${fire.short.toLowerCase()} sit` : `${state.minutes} min / ${gandalf.style}`;
    dom.durationButtons.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.v10Minutes) === state.minutes);
    });
    renderPickers();
  }

  function setFire(id) {
    if (!fireIds.has(id)) return;
    state.fire = id;
    state.view = "atelier";
    saveSettings();
    render();
    applyAudioProfile();
    setGuide("Fire chosen", activeFire().name, activeFire().desc);
  }

  function setGandalf(id) {
    if (!gandalfIds.has(id)) return;
    state.gandalf = id;
    state.view = "atelier";
    saveSettings();
    render();
    setGuide("Canvas chosen", activeGandalf().name, activeGandalf().note);
  }

  function cycleGandalf() {
    const index = gandalfs.findIndex((gandalf) => gandalf.id === state.gandalf);
    const next = gandalfs[(index + 1 + gandalfs.length) % gandalfs.length];
    setGandalf(next.id);
  }

  function chooseDuration(minutes) {
    state.minutes = minutes;
    state.remaining = minutes * 60;
    state.view = "atelier";
    saveSettings();
    render();
  }

  function resizeCanvas() {
    const rect = dom.hearthCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.round((rect.width || 640) * dpr));
    const height = Math.max(180, Math.round((rect.height || 360) * dpr));
    if (dom.hearthCanvas.width !== width || dom.hearthCanvas.height !== height) {
      dom.hearthCanvas.width = width;
      dom.hearthCanvas.height = height;
    }
  }

  function drawFlameShape(ctx, x, base, width, height, color, lean, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, base - height);
    ctx.bezierCurveTo(x - width * 0.8 + lean, base - height * 0.55, x - width * 0.55, base - height * 0.18, x, base);
    ctx.bezierCurveTo(x + width * 0.62, base - height * 0.24, x + width * 0.78 + lean, base - height * 0.62, x, base - height);
    ctx.fill();
    ctx.restore();
  }

  function drawHearth(ctx, w, h, t) {
    drawFirebox(ctx, w, h);
    const base = h * 0.78;
    for (let i = 0; i < 9; i += 1) {
      const x = w * (0.28 + i * 0.055);
      const wave = Math.sin(t * (1.2 + i * 0.08) + i * 1.7);
      drawFlameShape(ctx, x, base, w * (0.065 + i * 0.004), h * (0.34 + wave * 0.035), "#b93224", wave * 8, 0.64);
      drawFlameShape(ctx, x + wave * 5, base, w * 0.04, h * (0.25 + wave * 0.03), "#f18131", -wave * 4, 0.82);
      drawFlameShape(ctx, x - wave * 3, base, w * 0.024, h * (0.16 + wave * 0.02), "#ffd77a", wave * 2, 0.9);
    }
    drawLogs(ctx, w, h);
  }

  function drawPixel(ctx, w, h, t) {
    ctx.imageSmoothingEnabled = false;
    drawFirebox(ctx, w, h);
    const cell = Math.max(8, Math.floor(w / 38));
    const colors = ["#2b0d1b", "#7a1f24", "#d94f2d", "#ff9f2c", "#ffe15f"];
    for (let y = Math.floor(h * 0.22); y < h * 0.88; y += cell) {
      for (let x = Math.floor(w * 0.18); x < w * 0.82; x += cell) {
        const nx = Math.abs((x - w * 0.5) / (w * 0.32));
        const rise = 1 - (y - h * 0.22) / (h * 0.66);
        const jitter = Math.sin(t * 8 + x * 0.07 + y * 0.11);
        if (nx < rise * 0.8 + jitter * 0.08) {
          const index = Math.max(0, Math.min(colors.length - 1, Math.floor(rise * 4 + jitter)));
          ctx.fillStyle = colors[index];
          ctx.fillRect(x, y, cell, cell);
        }
      }
    }
    drawLogs(ctx, w, h);
  }

  function drawBonfire(ctx, w, h, t) {
    drawFirebox(ctx, w, h);
    const base = h * 0.86;
    for (let i = 0; i < 16; i += 1) {
      const x = w * (0.18 + i * 0.043);
      const wave = Math.sin(t * (1.8 + i * 0.05) + i);
      drawFlameShape(ctx, x, base, w * 0.07, h * (0.48 + wave * 0.08), i % 3 === 0 ? "#ffcf6a" : i % 3 === 1 ? "#ff7130" : "#b82324", wave * 20, 0.78);
    }
    for (let i = 0; i < 26; i += 1) {
      const x = (i * 97 + t * 32) % w;
      const y = h * 0.72 - ((t * (24 + i) + i * 31) % (h * 0.55));
      ctx.fillStyle = i % 2 ? "#ffd37b" : "#ff7535";
      ctx.globalAlpha = 0.35 + (i % 5) * 0.08;
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawLogs(ctx, w, h, true);
  }

  function drawWisp(ctx, w, h, t) {
    drawFirebox(ctx, w, h, "#071113");
    for (let i = 0; i < 12; i += 1) {
      const x = w * 0.5 + Math.sin(t * 0.9 + i * 1.4) * w * (0.12 + (i % 3) * 0.03);
      const y = h * 0.72 - ((t * 28 + i * 38) % (h * 0.48));
      const r = 10 + (i % 4) * 5 + Math.sin(t * 2 + i) * 2;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
      gradient.addColorStop(0, i % 2 ? "#c7fff0" : "#caf2ff");
      gradient.addColorStop(0.35, i % 2 ? "#64d9b5" : "#69b8ff");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWizard(ctx, w, h, t) {
    drawFirebox(ctx, w, h, "#080817");
    const cx = w * 0.5;
    const cy = h * 0.58;
    for (let i = 0; i < 18; i += 1) {
      const a = t * 0.85 + i * 0.55;
      ctx.strokeStyle = i % 2 ? "rgba(142, 112, 255, 0.62)" : "rgba(114, 224, 255, 0.72)";
      ctx.lineWidth = 2 + (i % 4);
      ctx.beginPath();
      for (let p = 0; p < 42; p += 1) {
        const r = 8 + p * 2.8 + Math.sin(t * 2 + p * 0.4 + i) * 4;
        const x = cx + Math.cos(a + p * 0.12) * r;
        const y = cy + Math.sin(a + p * 0.12) * r * 0.62 - p * 1.3;
        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    drawFlameShape(ctx, cx, h * 0.84, w * 0.16, h * 0.44, "rgba(157, 104, 255, 0.48)", 0, 0.8);
    drawFlameShape(ctx, cx, h * 0.84, w * 0.08, h * 0.32, "rgba(146, 235, 255, 0.72)", 0, 0.9);
  }

  function drawStorm(ctx, w, h, t) {
    drawFirebox(ctx, w, h, "#0b1017");
    const base = h * 0.76;
    const gust = Math.sin(t * 3.6) * 30;
    for (let i = 0; i < 12; i += 1) {
      const y = base - i * h * 0.035;
      const x = w * (0.28 + i * 0.03) + gust + Math.sin(t * 5 + i) * 18;
      ctx.strokeStyle = i % 2 ? "rgba(255, 206, 105, 0.82)" : "rgba(255, 103, 64, 0.78)";
      ctx.lineWidth = 5 + (i % 4);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + w * 0.14, y - h * 0.1, x + w * 0.3, y - h * 0.04, x + w * 0.44, y - h * 0.18);
      ctx.stroke();
    }
    if (Math.sin(t * 2.7) > 0.88) {
      ctx.strokeStyle = "rgba(223, 241, 255, 0.74)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.18);
      ctx.lineTo(w * 0.34, h * 0.32);
      ctx.lineTo(w * 0.29, h * 0.32);
      ctx.lineTo(w * 0.43, h * 0.5);
      ctx.stroke();
    }
    drawLogs(ctx, w, h);
  }

  function drawEmberRain(ctx, w, h, t) {
    drawFirebox(ctx, w, h, "#110908");
    renderer.sparks.forEach((spark, index) => {
      const x = (spark.x + Math.sin(t * 0.8 + index) * 18) % w;
      const y = (spark.y + t * spark.speed) % h;
      const alpha = 0.25 + ((index % 9) / 12);
      ctx.fillStyle = index % 3 ? `rgba(255, 136, 72, ${alpha})` : `rgba(255, 220, 130, ${alpha})`;
      ctx.fillRect(x, y, spark.size, spark.size * 2.4);
    });
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.88, 0, w * 0.5, h * 0.88, w * 0.42);
    glow.addColorStop(0, "rgba(255, 116, 54, 0.46)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);
  }

  function drawSmoke(ctx, w, h, t) {
    drawFirebox(ctx, w, h, "#080807");
    ctx.lineCap = "round";
    for (let i = 0; i < 9; i += 1) {
      const x = w * (0.28 + i * 0.055);
      ctx.strokeStyle = `rgba(198, 207, 199, ${0.12 + i * 0.025})`;
      ctx.lineWidth = 10 + (i % 4) * 5;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.86);
      ctx.bezierCurveTo(x - w * 0.15 + Math.sin(t + i) * 22, h * 0.7, x + w * 0.12, h * 0.48, x + Math.sin(t * 0.6 + i) * w * 0.2, h * 0.18);
      ctx.stroke();
    }
    drawCoalBase(ctx, w, h, t, 0.4);
  }

  function drawGlass(ctx, w, h, t) {
    drawFirebox(ctx, w, h, "#060809");
    const colors = ["#f2c14e", "#e45f46", "#3c91d0", "#71bd62", "#9e6ad6"];
    for (let i = 0; i < 22; i += 1) {
      const x = w * 0.5 + Math.sin(i * 1.8 + t * 0.7) * w * (0.08 + (i % 5) * 0.028);
      const y = h * 0.84 - i * h * 0.026;
      const s = w * (0.055 + (i % 4) * 0.012);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.52 + Math.sin(t + i) * 0.12;
      ctx.beginPath();
      ctx.moveTo(x, y - s * 1.4);
      ctx.lineTo(x - s, y + s * 0.4);
      ctx.lineTo(x + s * 0.9, y + s * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawCoal(ctx, w, h, t) {
    drawFirebox(ctx, w, h, "#080505");
    drawCoalBase(ctx, w, h, t, 1);
    for (let i = 0; i < 16; i += 1) {
      const x = w * (0.22 + (i % 8) * 0.08);
      const y = h * (0.76 + Math.floor(i / 8) * 0.06);
      const pulse = 0.55 + Math.sin(t * 1.3 + i) * 0.22;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, w * 0.09);
      gradient.addColorStop(0, `rgba(255, 101, 55, ${pulse})`);
      gradient.addColorStop(0.42, `rgba(146, 36, 30, ${pulse * 0.7})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.085, h * 0.052, (i % 5) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFirebox(ctx, w, h, base = "#090706") {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, base);
    gradient.addColorStop(0.65, "#0d0807");
    gradient.addColorStop(1, "#050303");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let y = 0; y < h; y += 18) ctx.fillRect(0, y, w, 1);
  }

  function drawLogs(ctx, w, h, large) {
    ctx.save();
    ctx.translate(w * 0.5, h * 0.86);
    ctx.rotate(-0.12);
    ctx.fillStyle = "#5b321d";
    ctx.fillRect(-w * 0.25, -h * 0.03, w * 0.5, h * (large ? 0.07 : 0.05));
    ctx.rotate(0.24);
    ctx.fillStyle = "#764528";
    ctx.fillRect(-w * 0.25, -h * 0.01, w * 0.5, h * (large ? 0.07 : 0.05));
    ctx.restore();
  }

  function drawCoalBase(ctx, w, h, t, strength) {
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.84, 0, w * 0.5, h * 0.84, w * 0.36);
    gradient.addColorStop(0, `rgba(255, 90, 48, ${0.38 * strength + Math.sin(t * 1.4) * 0.08})`);
    gradient.addColorStop(0.48, `rgba(114, 26, 24, ${0.35 * strength})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, h * 0.55, w, h * 0.45);
  }

  function draw(now) {
    resizeCanvas();
    const ctx = dom.hearthCanvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = dom.hearthCanvas.width / dpr;
    const h = dom.hearthCanvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const t = now / 1000;
    const map = {
      hearth: drawHearth,
      pixel: drawPixel,
      bonfire: drawBonfire,
      wisp: drawWisp,
      wizard: drawWizard,
      storm: drawStorm,
      "ember-rain": drawEmberRain,
      smoke: drawSmoke,
      glass: drawGlass,
      coal: drawCoal
    };
    (map[state.fire] || drawHearth)(ctx, w, h, t);
    renderer.raf = requestAnimationFrame(draw);
  }

  function ensureAudio() {
    if (audio.context) return audio.context;
    audio.context = new (window.AudioContext || window.webkitAudioContext)();
    audio.master = audio.context.createGain();
    audio.droneGain = audio.context.createGain();
    audio.drone = audio.context.createOscillator();
    audio.master.gain.value = 0.13;
    audio.drone.type = "triangle";
    audio.drone.frequency.value = activeFire().audio.drone;
    audio.droneGain.gain.value = 0.018;
    audio.drone.connect(audio.droneGain).connect(audio.master).connect(audio.context.destination);
    audio.drone.start();
    return audio.context;
  }

  function clearAudioTimers() {
    audio.timers.forEach((timer) => window.clearTimeout(timer));
    audio.timers = [];
  }

  function queue(fn, delay) {
    audio.timers.push(window.setTimeout(fn, delay));
  }

  function playNoise(profile) {
    const ctx = ensureAudio();
    const duration = profile.duration + Math.random() * profile.duration;
    const samples = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / samples);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = profile.filter;
    filter.frequency.value = profile.frequency + Math.random() * profile.spread;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(profile.gain, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.connect(filter).connect(gain).connect(audio.master);
    source.start();
    source.stop(ctx.currentTime + duration + 0.02);
  }

  function playChime(profile) {
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = profile.frequency + Math.random() * profile.spread;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(profile.gain * 0.7, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + profile.duration + 0.12);
    osc.connect(gain).connect(audio.master);
    osc.start();
    osc.stop(ctx.currentTime + profile.duration + 0.14);
  }

  function applyAudioProfile() {
    if (!audio.context || !audio.drone) return;
    const profile = activeFire().audio;
    audio.drone.frequency.cancelScheduledValues(audio.context.currentTime);
    audio.drone.frequency.linearRampToValueAtTime(profile.drone, audio.context.currentTime + 0.35);
    audio.droneGain.gain.linearRampToValueAtTime(profile.gust ? 0.012 : 0.018, audio.context.currentTime + 0.35);
    if (state.audioOn) {
      clearAudioTimers();
      scheduleAudio();
    }
  }

  function scheduleAudio() {
    if (!state.audioOn || !isV10()) return;
    const profile = activeFire().audio;
    if (profile.chime && Math.random() > 0.46) playChime(profile);
    else playNoise(profile);
    const next = profile.min + Math.random() * (profile.max - profile.min);
    queue(scheduleAudio, next);
  }

  async function setAudio(on) {
    state.audioOn = on;
    clearAudioTimers();
    if (!on) {
      if (audio.context) await audio.context.suspend();
      render();
      return;
    }
    ensureAudio();
    await audio.context.resume();
    applyAudioProfile();
    render();
  }

  function updateTimer() {
    dom.timerText.textContent = format(state.remaining);
    dom.timerCaption.textContent = state.running ? `${activeFire().short.toLowerCase()} sit` : `${state.minutes} min / ${activeGandalf().style}`;
  }

  async function beginOrPause() {
    if (state.running) {
      state.running = false;
      state.view = "atelier";
      cancelAnimationFrame(state.raf);
      setGuide("Paused", activeGandalf().name, "The studio keeps your place.");
      render();
      return;
    }
    if (state.remaining <= 0) state.remaining = state.minutes * 60;
    state.running = true;
    state.view = "sit";
    state.lastTick = 0;
    await setAudio(true);
    setGuide("Sit has begun", `${activeFire().name} / ${activeGandalf().style}`, "The chair faces the easel. Let the fire take foreground.");
    render();
    state.raf = requestAnimationFrame(tick);
  }

  function completeSit() {
    state.running = false;
    state.remaining = 0;
    state.view = "complete";
    state.seen.add(comboId());
    saveSettings();
    setAudio(false);
    setGuide("Studio note", activeGandalf().style, activeGandalf().note);
    render();
  }

  function tick(now) {
    if (!state.running) return;
    if (!state.lastTick) state.lastTick = now;
    const delta = (now - state.lastTick) / 1000;
    state.lastTick = now;
    state.remaining = Math.max(0, state.remaining - delta);
    const elapsed = state.minutes * 60 - state.remaining;
    if (dom.phaseName) {
      dom.phaseName.textContent = elapsed < state.minutes * 20 ? "Settle" : elapsed < state.minutes * 45 ? "Look" : "Return";
    }
    if (dom.phaseHint) {
      dom.phaseHint.textContent = elapsed < state.minutes * 20
        ? "Let the wall become background."
        : elapsed < state.minutes * 45
          ? "Let the canvas keep its own counsel."
          : "Bring back the note, not the whole studio.";
    }
    updateTimer();
    if (state.remaining <= 0) {
      completeSit();
      return;
    }
    state.raf = requestAnimationFrame(tick);
  }

  function resetSit() {
    state.running = false;
    state.remaining = state.minutes * 60;
    state.view = "atelier";
    cancelAnimationFrame(state.raf);
    setAudio(false);
    setGuide("Reset", "The Gandalf Atelier", "Choose a fire and canvas, or keep the pairing already on the easel.");
    render();
  }

  dom.beginButton.addEventListener("click", beginOrPause);
  dom.audioButton.addEventListener("click", () => setAudio(!state.audioOn));
  dom.resetButton.addEventListener("click", resetSit);
  dom.easelButton.addEventListener("click", cycleGandalf);
  dom.durationButtons.forEach((button) => button.addEventListener("click", () => chooseDuration(Number(button.dataset.v10Minutes))));
  dom.versionButtons.forEach((button) => button.addEventListener("click", () => window.setTimeout(() => { if (isV10()) { saveSettings(); render(); setGuide("V10 ready", "The Gandalf Atelier", "Ten fires, seven Gandalfs, one quiet chair."); } }, 0)));
  dom.versionSelect?.addEventListener("change", () => window.setTimeout(() => { if (isV10()) { saveSettings(); render(); setGuide("V10 ready", "The Gandalf Atelier", "Ten fires, seven Gandalfs, one quiet chair."); } }, 0));
  window.addEventListener("resize", resizeCanvas);

  render();
  requestAnimationFrame(draw);
  if (isV10()) {
    saveSettings();
    setGuide("V10 ready", "The Gandalf Atelier", "Ten fires, seven abstract Gandalfs, and one chair facing the easel.");
  }
})();
