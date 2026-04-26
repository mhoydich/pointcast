(function () {
  "use strict";

  const STORAGE_KEY = "sitting-with-gandalf-log";
  const SETTINGS_KEY = "sitting-with-gandalf-settings";
  const DEFAULT_MINUTES = 15;
  const RELEASE_VERSION = "v4";
  const versions = new Set(["v1", "v2", "v3", "v4"]);
  const renderStyles = {
    storybook: {
      name: "Storybook glow",
      idle: "The picture stays painterly and warm, like a page you can breathe inside.",
      lines: ["Let the brushwork soften the edges.", "The old quiet has good color today."]
    },
    pixel: {
      name: "Pixel campfire",
      idle: "The world has gone tiny and bright. Let each little square carry less than a thought.",
      lines: [
        "A small pixel can hold a surprising amount of peace.",
        "Step lightly. Even the moss has gone 16-bit.",
        "Tiny lights, tiny worries, plenty of room."
      ]
    }
  };

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

  const natureViews = {
    glade: {
      name: "Moss glade",
      mode: "fire",
      idle: "Rest your eyes in the green. Let the small lights do the wandering.",
      phases: {
        Settle: "Find one patch of moss and let your shoulders answer it.",
        Drift: "Let the glade hold the edges of the day for you.",
        Return: "Bring back one small, green permission to move slowly."
      },
      cues: {
        look: "Notice the softest light in the trees. Stay with it for three breaths.",
        listen: "Listen as if the room has leaves. Let the quiet have texture.",
        breathe: "Breathe in like shade. Breathe out like a path becoming clear.",
        release: "Let one tight thought step off the trail and disappear behind the ferns."
      },
      lines: [
        "Green is a patient kind of advice.",
        "You do not need to enter the forest loudly.",
        "Let the moss keep what you no longer need to carry.",
        "A small light is enough when the eyes soften."
      ]
    },
    garden: {
      name: "Rain garden",
      mode: "rain",
      idle: "Let the porch hold you. The rain can do the moving for now.",
      phases: {
        Settle: "Hear the nearest drops before you sort the far ones.",
        Drift: "Let the garden drink what the day could not.",
        Return: "Come back rinsed, not rushed."
      },
      cues: {
        look: "Look where the path shines. Let the rain polish the moment.",
        listen: "Count three soft sounds, then stop counting.",
        breathe: "Breathe in cool. Breathe out the hurry you inherited.",
        release: "Put one worry down on the wet stones and leave it there."
      },
      lines: [
        "Rain makes a room out of anywhere with a roof.",
        "Let the weather be busy on your behalf.",
        "A garden in rain is not waiting. It is receiving.",
        "You can be sheltered without being closed."
      ]
    },
    meadow: {
      name: "Meadow path",
      mode: "road",
      idle: "Choose the open air. Let the far hills make the next thing smaller.",
      phases: {
        Settle: "Feel the path without needing to follow it yet.",
        Drift: "Let the meadow widen around the question.",
        Return: "Take one honest step, not the whole horizon."
      },
      cues: {
        look: "Look toward the bright distance without making a plan.",
        listen: "Listen for the space between thoughts. It has room in it.",
        breathe: "Breathe in the open field. Breathe out the clenched map.",
        release: "Let the path go on without you for a few minutes."
      },
      lines: [
        "A path can invite you without hurrying you.",
        "The hill is far away, and that is part of its kindness.",
        "Let the meadow be large enough for the feeling.",
        "Open air has a way of making small troubles tell the truth."
      ]
    },
    lake: {
      name: "Moon lake",
      mode: "stars",
      idle: "Rest beside the reflected sky. Nothing bright needs to be chased.",
      phases: {
        Settle: "Let the water show you how stillness moves.",
        Drift: "Borrow the lake's habit of holding light without grasping it.",
        Return: "Bring back one quiet reflection and leave the rest shining."
      },
      cues: {
        look: "Look at the reflected moon. Let attention settle on the waterline.",
        listen: "Listen for the night behind the sound.",
        breathe: "Breathe in like cool water. Breathe out like a ripple flattening.",
        release: "Let one thought sink without needing to watch it land."
      },
      lines: [
        "The lake keeps the moon without owning it.",
        "Night can be gentle when you stop negotiating with it.",
        "Reflection is not repetition. It is softening.",
        "A quiet surface still has depth."
      ]
    }
  };

  const intentions = {
    rest: {
      title: "Rest",
      text: "Let the picture be enough. Nothing needs improving for the next few minutes.",
      lines: ["Rest is not a delay. It is repair.", "Let enough be enough for one small hour."]
    },
    ground: {
      title: "Ground",
      text: "Feel the chair, the floor, the weight of yourself allowed to arrive.",
      lines: ["The body is a better anchor than an argument.", "Come back by inches. That is still coming back."]
    },
    wander: {
      title: "Wander",
      text: "Let attention walk gently through the scene without asking it to perform.",
      lines: ["A wandering mind can still move softly.", "Let attention roam, then invite it home."]
    },
    sleep: {
      title: "Sleep",
      text: "Dim the effort. Let every breath make the room a little farther from the day.",
      lines: ["The day may close without a speech.", "Let the last task be getting softer."]
    }
  };

  const companions = {
    hearth: {
      name: "Hearth Gandalf",
      mode: "fire",
      idle: "Begin warm: start the quiet sit, then breathe with the ring.",
      paused: "The fire will keep its place. Return when you are ready.",
      complete: "Good. Carry one ember of that quiet with you.",
      phases: {
        Settle: "Let the pipe find its first slow glow.",
        Drift: "Let the room do most of the work.",
        Return: "Bring back one ember, not the whole fire."
      },
      lines: [
        "Warmth first. Wisdom can take the second chair.",
        "The hearth knows how to wait without becoming idle.",
        "Draw slowly. Even old magic begins with breath.",
        "A good chair has ended more quarrels than a loud speech."
      ]
    },
    rain: {
      name: "Rain Gandalf",
      mode: "rain",
      idle: "Begin soft: let the rain carry the hurry away before you draw.",
      paused: "Rain does not mind interruption. It simply continues.",
      complete: "There. Washed clean enough for the next small thing.",
      phases: {
        Settle: "Hear the roof before you hear your thoughts.",
        Drift: "Let the weather travel for you.",
        Return: "Take the quiet part of the storm back with you."
      },
      lines: [
        "Rain has a thousand fingers and no need to hurry.",
        "A wet road is still a road, only more honest.",
        "Let each drop answer one thought and leave you with fewer.",
        "The window is doing enough. Sit behind it."
      ]
    },
    road: {
      name: "Road Gandalf",
      mode: "road",
      idle: "Begin steady: set your pack down, draw once, and leave the road outside.",
      paused: "The road bends, waits, and goes on. So may you.",
      complete: "You have walked without leaving. That counts.",
      phases: {
        Settle: "Put the pack down before you inspect the map.",
        Drift: "Let the dust fall behind you.",
        Return: "Choose the next step, not the whole journey."
      },
      lines: [
        "Not every road asks to be answered tonight.",
        "Dust is only the road remembering your feet.",
        "A map is better after tea and worse after panic.",
        "Rest is also a direction."
      ]
    },
    stars: {
      name: "Star Gandalf",
      mode: "stars",
      idle: "Begin quiet: look upward, draw lightly, and let the night widen.",
      paused: "The stars do not scold a pause within a pause.",
      complete: "A little night-sense is enough for one pocket.",
      phases: {
        Settle: "Let the dark become spacious rather than empty.",
        Drift: "Borrow the patience of distant light.",
        Return: "Bring back one small lamp for the path."
      },
      lines: [
        "Old light arrives late and is not ashamed.",
        "The sky is full because it leaves room.",
        "A quiet pipe can make a window out of any wall.",
        "Look up long enough and the hour grows gentler."
      ]
    }
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
  const savedRelease = savedSettings.release === RELEASE_VERSION;
  const initialVersion = savedRelease && versions.has(savedSettings.version) ? savedSettings.version : RELEASE_VERSION;
  const initialRenderStyle = savedRelease && renderStyles[savedSettings.renderStyle]
    ? savedSettings.renderStyle
    : initialVersion === "v4"
      ? "pixel"
      : "storybook";
  const state = {
    duration: DEFAULT_MINUTES * 60,
    remaining: DEFAULT_MINUTES * 60,
    running: false,
    mode: savedSettings.mode || "fire",
    version: initialVersion,
    companion: companions[savedSettings.companion] ? savedSettings.companion : "hearth",
    visual: natureViews[savedSettings.visual] ? savedSettings.visual : "glade",
    intention: intentions[savedSettings.intention] ? savedSettings.intention : "rest",
    renderStyle: initialRenderStyle,
    rings: 0,
    log: loadLog(),
    paceStartedAt: performance.now(),
    soundOn: false,
    warmth: savedSettings.warmth ?? 0.62,
    smoke: savedSettings.smoke ?? 0.58,
    lantern: false,
    phaseName: "Settle",
    guidePace: ""
  };

  const dom = {
    body: document.body,
    timerFace: document.getElementById("timerFace"),
    timerText: document.getElementById("timerText"),
    timerCaption: document.getElementById("timerCaption"),
    wizardLine: document.getElementById("wizardLine"),
    phaseName: document.getElementById("phaseName"),
    phaseHint: document.getElementById("phaseHint"),
    guideStep: document.getElementById("guideStep"),
    guideTitle: document.getElementById("guideTitle"),
    guideText: document.getElementById("guideText"),
    versionButtons: Array.from(document.querySelectorAll(".version-button")),
    visualButtons: Array.from(document.querySelectorAll(".nature-button")),
    intentionButtons: Array.from(document.querySelectorAll(".intention-button")),
    cueButtons: Array.from(document.querySelectorAll(".cue-button")),
    intentionTitle: document.getElementById("intentionTitle"),
    intentionText: document.getElementById("intentionText"),
    roomStep: document.getElementById("roomStep"),
    ambienceStep: document.getElementById("ambienceStep"),
    durationButtons: Array.from(document.querySelectorAll(".duration-button")),
    companionButtons: Array.from(document.querySelectorAll(".wizard-button")),
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
    smokeLabel: document.getElementById("smokeLabel"),
    paceLabel: document.getElementById("paceLabel"),
    paceCount: document.getElementById("paceCount"),
    paceBar: document.getElementById("paceBar"),
    ringCount: document.getElementById("ringCount"),
    ringLabel: document.getElementById("ringLabel"),
    sessionCount: document.getElementById("sessionCount"),
    totalMinutes: document.getElementById("totalMinutes"),
    ritualSummary: document.getElementById("ritualSummary"),
    blendLabel: document.getElementById("blendLabel"),
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
        release: RELEASE_VERSION,
        version: state.version,
        mode: state.mode,
        companion: state.companion,
        visual: state.visual,
        intention: state.intention,
        renderStyle: state.renderStyle,
        warmth: state.warmth,
        smoke: state.smoke
      })
    );
  }

  function activeCompanion() {
    return companions[state.companion] || companions.hearth;
  }

  function activeView() {
    return natureViews[state.visual] || natureViews.glade;
  }

  function activeIntention() {
    return intentions[state.intention] || intentions.rest;
  }

  function activeRenderStyle() {
    return renderStyles[state.renderStyle] || renderStyles.storybook;
  }

  function isNatureVersion(version = state.version) {
    return version === "v3" || version === "v4";
  }

  function setGuide(step, title, text) {
    dom.guideStep.textContent = step;
    dom.guideTitle.textContent = title;
    dom.guideText.textContent = text;
  }

  function updateGuideIdle(step) {
    if (state.version === "v1") {
      return;
    }

    if (isNatureVersion()) {
      const view = activeView();
      const intention = activeIntention();
      const renderStyle = activeRenderStyle();
      setGuide(step || "Nature cue", `${view.name} · ${renderStyle.name}`, `${view.idle} ${intention.text} ${renderStyle.idle}`);
      return;
    }

    const companion = activeCompanion();
    setGuide(step || "Next", companion.name, companion.idle);
  }

  function updateGuideForPace(label, countdown) {
    if (state.version === "v1") {
      return;
    }

    if (isNatureVersion()) {
      const view = activeView();
      const lowerLabel = label.toLowerCase();
      const copy = {
        Inhale: `Breathe in for ${countdown}. Keep the ${view.name.toLowerCase()} soft in your eyes.`,
        Hold: `Hold for ${countdown}. Let the view hold the edges of the room.`,
        Exhale: `Breathe out for ${countdown}. Let one thing loosen without needing a story.`
      };

      setGuide(`Now: ${lowerLabel}`, view.name, copy[label] || view.idle);
      return;
    }

    const companion = activeCompanion();
    const lowerLabel = label.toLowerCase();
    const copy = {
      Inhale: `Draw in for ${countdown}. Let ${companion.name} keep the room steady.`,
      Hold: `Hold for ${countdown}. Nothing needs chasing.`,
      Exhale: `Exhale for ${countdown}. Let the smoke drift; tap Smoke ring if you want to see it go.`
    };

    setGuide(`Now: ${lowerLabel}`, companion.name, copy[label] || companion.idle);
  }

  function chooseLine() {
    if (isNatureVersion()) {
      const view = activeView();
      const intention = activeIntention();
      const pool = view.lines.concat(intention.lines, activeRenderStyle().lines);
      const next = pool[Math.floor(Math.random() * pool.length)];
      dom.wizardLine.textContent = next;
      return;
    }

    const companion = activeCompanion();
    const pool = state.version === "v1" || Math.random() <= 0.38 ? modeLines[state.mode] : companion.lines;
    const next = pool[Math.floor(Math.random() * pool.length)];
    dom.wizardLine.textContent = next;
  }

  function updateTimer() {
    const progress = 1 - state.remaining / state.duration;
    const degrees = Math.max(0, Math.min(360, progress * 360));
    dom.timerFace.style.setProperty("--progress", `${degrees}deg`);
    dom.timerText.textContent = formatTime(state.remaining);
    dom.timerCaption.textContent = state.running
      ? isNatureVersion()
        ? "breathing slowly"
        : "keeping watch"
      : isNatureVersion()
        ? "nature sit"
        : "pipe pause";
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
    if (isNatureVersion()) {
      dom.phaseHint.textContent = activeView().phases[active.name] || active.hint;
    } else {
      dom.phaseHint.textContent = state.version === "v1" ? active.hint : activeCompanion().phases[active.name] || active.hint;
    }
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
      const companion = entry.companion ? ` / ${entry.companion.replace(" Gandalf", "")}` : "";
      const visual = entry.visual ? ` / ${entry.visual}` : "";
      const intention = entry.intention ? ` / ${entry.intention}` : "";
      const style = entry.style ? ` / ${entry.style}` : "";
      const version = entry.version ? `${entry.version.toUpperCase()} / ` : "";

      meta.className = "log-meta";
      note.className = "log-note";

      left.textContent = `${version}${entry.minutes} min / ${entry.blend}${mode}${companion}${visual}${intention}${style}`;
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
    state.guidePace = "";
    dom.startButton.textContent = "Running";
    dom.startButton.disabled = true;
    dom.pauseButton.disabled = false;
    chooseLine();
    updateGuideIdle("Sit has begun");

    if (!state.soundOn) {
      await setSound(true);
    }
  }

  function pauseSession() {
    state.running = false;
    dom.startButton.textContent = isNatureVersion() ? "Resume nature sit" : "Resume quiet sit";
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.timerCaption.textContent = isNatureVersion() ? "nature sit" : "pipe pause";
    if (isNatureVersion()) {
      setGuide("Paused", activeView().name, "The place will keep waiting. Come back without hurry.");
    } else if (state.version === "v2") {
      setGuide("Paused", activeCompanion().name, activeCompanion().paused);
    }
  }

  function resetSession() {
    state.running = false;
    state.remaining = state.duration;
    state.phaseName = "";
    dom.startButton.textContent = isNatureVersion() ? "Start nature sit" : "Start quiet sit";
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.paceLabel.textContent = "Settle";
    dom.paceCount.textContent = "0";
    dom.paceBar.style.width = "0%";
    state.guidePace = "";
    updateGuideIdle("Next");
    updateTimer();
  }

  function completeSession() {
    pauseSession();
    dom.startButton.textContent = isNatureVersion() ? "Start nature sit" : "Start quiet sit";
    state.remaining = 0;
    updateTimer();
    dom.wizardLine.textContent = isNatureVersion() ? "There. The room feels less crowded now." : "There. A little more room in the world.";
    if (isNatureVersion()) {
      setGuide("Complete", activeView().name, "Carry one color, one sound, and one easier breath back with you.");
    } else if (state.version === "v2") {
      setGuide("Complete", activeCompanion().name, activeCompanion().complete);
    }
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

  function setVersion(version) {
    const next = versions.has(version) ? version : "v4";
    state.version = next;
    dom.body.dataset.version = next;
    dom.versionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.version === next);
    });

    dom.roomStep.textContent = next === "v1" ? "1" : "2";
    dom.ambienceStep.textContent = next === "v1" ? "2" : "3";
    dom.ritualSummary.textContent = isNatureVersion(next) ? "Session scent and tally" : "Pipe leaf and tally";
    dom.blendLabel.textContent = isNatureVersion(next) ? "Session scent" : "Pipe leaf";
    dom.smokeLabel.textContent = isNatureVersion(next) ? "Atmosphere" : "Smoke";
    dom.ringLabel.textContent = isNatureVersion(next) ? "cues" : "rings";
    dom.startButton.textContent = state.running ? "Running" : isNatureVersion(next) ? "Start nature sit" : "Start quiet sit";

    if (next === "v1" && state.mode === "stars") {
      setMode("fire");
      return;
    }

    if (next === "v1") {
      dom.phaseHint.textContent = phases.find((phase) => phase.name === state.phaseName)?.hint || phases[0].hint;
      chooseLine();
    } else if (isNatureVersion(next)) {
      if (next === "v4" && state.renderStyle !== "pixel") {
        setRenderStyle("pixel");
      } else if (next === "v3" && state.renderStyle !== "storybook") {
        setRenderStyle("storybook");
      }
      setVisual(state.visual);
      setIntention(state.intention);
      updateGuideIdle(next === "v4" ? "V4 ready" : "Nature ready");
    } else {
      updateGuideIdle("V2 ready");
    }

    saveSettings();
  }

  function setMode(mode) {
    const nextMode = state.version === "v1" && mode === "stars" ? "fire" : mode;
    state.mode = nextMode;
    dom.body.dataset.mode = nextMode;
    dom.modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === nextMode);
    });
    saveSettings();
    chooseLine();
    tuneDrone();

    if (state.soundOn) {
      clearSoundTimers();
      scheduleAmbience();
    }

    if (!state.running) {
      updateGuideIdle(isNatureVersion() ? "Sound set" : "Next");
    }
  }

  function setCompanion(companion, options) {
    const next = companions[companion] ? companion : "hearth";
    const settings = options || {};

    state.companion = next;
    dom.body.dataset.companion = next;
    dom.companionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.companion === next);
    });

    if (settings.syncMode !== false) {
      setMode(companions[next].mode);
    } else {
      saveSettings();
    }

    chooseLine();
    updateGuideIdle(
      isNatureVersion()
        ? "Nature ready"
        : settings.syncMode === false
          ? "Choose your Gandalf"
          : "Companion chosen"
    );
  }

  function setVisual(visual, options) {
    const next = natureViews[visual] ? visual : "glade";
    const settings = options || {};

    state.visual = next;
    dom.body.dataset.visual = next;
    dom.visualButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.visual === next);
    });

    if (settings.syncMode !== false) {
      setMode(natureViews[next].mode);
    } else {
      saveSettings();
    }

    if (isNatureVersion()) {
      chooseLine();
      updateGuideIdle("View chosen");
    }
  }

  function setIntention(intention) {
    const next = intentions[intention] ? intention : "rest";
    const active = intentions[next];

    state.intention = next;
    dom.body.dataset.intention = next;
    dom.intentionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.intention === next);
    });
    dom.intentionTitle.textContent = active.title;
    dom.intentionText.textContent = active.text;
    saveSettings();

    if (isNatureVersion()) {
      chooseLine();
      updateGuideIdle("Intention set");
    }
  }

  function setRenderStyle(renderStyle) {
    const next = renderStyles[renderStyle] ? renderStyle : "storybook";
    state.renderStyle = next;
    dom.body.dataset.render = next;
    saveSettings();

    if (isNatureVersion()) {
      chooseLine();
      updateGuideIdle(next === "pixel" ? "Pixel style" : "Storybook style");
      spawnParticles(next === "pixel" ? 10 : 5);
    }
  }

  function playCue(cue) {
    const view = activeView();
    const text = view.cues[cue] || view.idle;
    const labels = {
      look: "Look",
      listen: "Listen",
      breathe: "Breathe",
      release: "Release"
    };

    dom.wizardLine.textContent = text;
    setGuide(labels[cue] || "Cue", view.name, text);

    if (cue === "breathe") {
      addSmoke({ count: 4, power: 0.55, spread: 70, countTowardSession: false });
    } else {
      spawnParticles(cue === "release" ? 12 : 6);
    }

    state.rings += 1;
    updateStats();
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
      version: state.version,
      companion: state.version === "v2" ? activeCompanion().name : "",
      visual: isNatureVersion() ? activeView().name : "",
      intention: isNatureVersion() ? activeIntention().title : "",
      style: isNatureVersion() ? activeRenderStyle().name : "",
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
        if (state.guidePace !== `${item.label}-${countdown}`) {
          state.guidePace = `${item.label}-${countdown}`;
          updateGuideForPace(item.label, countdown);
        }
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
    if (isNatureVersion()) {
      setGuide("Quiet", activeView().name, "Ambience is off. Let the picture do the holding for a while.");
    } else if (state.version === "v2") {
      setGuide("Quiet", activeCompanion().name, "Ambience is off. The room can stay still for a while.");
    }
  }

  function toggleLantern(force) {
    state.lantern = typeof force === "boolean" ? force : !state.lantern;
    dom.body.classList.toggle("lantern-mode", state.lantern);
    dom.lanternButton.textContent = state.lantern ? "Exit focus" : "Focus view";
  }

  dom.durationButtons.forEach((button) => {
    button.addEventListener("click", () => setDuration(Number(button.dataset.minutes)));
  });

  dom.versionButtons.forEach((button) => {
    button.addEventListener("click", () => setVersion(button.dataset.version));
  });

  dom.visualButtons.forEach((button) => {
    button.addEventListener("click", () => setVisual(button.dataset.visual));
  });

  dom.intentionButtons.forEach((button) => {
    button.addEventListener("click", () => setIntention(button.dataset.intention));
  });

  dom.cueButtons.forEach((button) => {
    button.addEventListener("click", () => playCue(button.dataset.cue));
  });

  dom.companionButtons.forEach((button) => {
    button.addEventListener("click", () => setCompanion(button.dataset.companion));
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
  setRenderStyle(state.renderStyle);
  setVersion(state.version);
  setCompanion(state.companion, { syncMode: false });
  setMode(state.mode);
  updateTimer();
  updateGuideIdle(isNatureVersion() ? (state.version === "v4" ? "V4 ready" : "Nature ready") : "Next");
  requestAnimationFrame(tick);
  requestAnimationFrame(drawSmoke);
})();
