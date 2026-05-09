(function () {
  "use strict";

  const SETTINGS_KEY = "sitting-with-gandalf-settings";
  const JOURNAL_KEY = "sitting-with-gandalf-journal-v9";
  const RELEASE = "v9-council-hall";

  const companions = {
    gandalf: {
      id: "gandalf",
      name: "Gandalf",
      mark: "G",
      room: "Warm hearth",
      title: "Warm hearth room",
      code: "ROOM/GANDALF",
      posture: "sit",
      postureLine: "sit beside the hearth",
      mode: "hearth-fire",
      glyph: "staff",
      object: "hearth-fire",
      accent: "#ffb14a",
      deep: "#6d2d1f",
      text: "The fire keeps a square of floor bright. Sit before the question gets too proud.",
      question: "What has become louder than it deserves?",
      answers: [
        { id: "burden", label: "A burden", tone: "steady warmth", accent: "#ffb14a" },
        { id: "hurry", label: "The hurry", tone: "slow command", accent: "#f06f37" },
        { id: "doubt", label: "A doubt", tone: "plain counsel", accent: "#d7c477" }
      ],
      mantras: [
        "A long road is still walked by one step that agrees to happen.",
        "Old wisdom is often a quieter way to begin.",
        "Let the fire make a small council of the room."
      ],
      breath: ["Draw in while the fire gathers.", "Rest while the staff stays on the floor.", "Breathe out and leave the smoke here."],
      phases: ["Let the fire take first watch.", "Sit where the warmth reaches you.", "Carry one ember, not the whole blaze."],
      partings: ["Go back with the ember, and leave the smoke here.", "Do not mistake urgency for truth.", "You made enough room for the next honest thing."],
      letters: [
        "The fire noticed what you set down before you did.",
        "You practiced {posture} for {minutes} minutes, which is longer than many brave speeches last.",
        "Keep one warm sentence and spend it slowly."
      ]
    },
    frodo: {
      id: "frodo",
      name: "Frodo",
      mark: "F",
      room: "Candlelit hobbit-hole",
      title: "Candlelit hobbit-hole",
      code: "ROOM/FRODO",
      posture: "rest",
      postureLine: "rest by the round door",
      mode: "kettle-tick",
      glyph: "ring",
      object: "kettle-tick",
      accent: "#ffd36e",
      deep: "#5d3f22",
      text: "A round door shuts softly. The kettle ticks. The table is small enough for the truth.",
      question: "What are you carrying farther than you meant to?",
      answers: [
        { id: "memory", label: "A memory", tone: "tender witness", accent: "#ffd36e" },
        { id: "promise", label: "A promise", tone: "careful resolve", accent: "#c99a48" },
        { id: "fear", label: "A fear", tone: "small courage", accent: "#a9bfd1" }
      ],
      mantras: [
        "Small rooms can hold heavy truths without becoming cruel.",
        "A burden named gently has already changed shape.",
        "Rest is not betrayal of the road."
      ],
      breath: ["Breathe in and feel the table.", "Let the kettle tick instead of the mind.", "Breathe out and leave the road outside."],
      phases: ["Let the room be small enough to protect the breath.", "Rest teaches tired hands to unclench.", "Take back the next step, not the whole map."],
      partings: ["A small courage is still courage when it is tired.", "Let the round door close on what is not yours tonight.", "The next step may be small. Let it be small."],
      letters: [
        "The room seemed kind to you because you let it be small.",
        "The {answer} was not defeated; it was given a chair and made less lonely.",
        "Keep close to plain speech and one true friend if you can."
      ]
    },
    samwise: {
      id: "samwise",
      name: "Samwise",
      mark: "S",
      room: "Green garden",
      title: "Green garden room",
      code: "ROOM/SAM",
      posture: "walk",
      postureLine: "walk the garden row",
      mode: "garden-rain",
      glyph: "leaf",
      object: "garden-rain",
      accent: "#9ddc67",
      deep: "#24522f",
      text: "Rain dots the cabbages. A trowel leans against the bench. The earth has time.",
      question: "What small thing still wants tending?",
      answers: [
        { id: "home", label: "Home", tone: "green loyalty", accent: "#9ddc67" },
        { id: "friend", label: "A friend", tone: "loyal care", accent: "#f3c15f" },
        { id: "hope", label: "Hope", tone: "garden nerve", accent: "#74d1a0" }
      ],
      mantras: [
        "Tend the small thing. The large thing listens eventually.",
        "Loyalty can be practical: water, bread, a hand at the elbow.",
        "Hope grows better when it is given chores."
      ],
      breath: ["Step in with the green air.", "Let the seed stay hidden without doubting it.", "Step out and put one worry down like a tool."],
      phases: ["Start at the nearest row.", "Walk the breath between the beds.", "Bring back one tended thing."],
      partings: ["There now. One row is enough for today.", "Keep your hands near the real things.", "If hope feels small, plant it anyway."],
      letters: [
        "There is a kind of bravery that looks very much like tending.",
        "The {answer} does not need grandeur; it needs water and returning.",
        "Do the next useful kindness before the next grand worry."
      ]
    },
    aragorn: {
      id: "aragorn",
      name: "Aragorn",
      mark: "A",
      room: "Stone watchpost",
      title: "Stone watchpost",
      code: "ROOM/ARAGORN",
      posture: "watch",
      postureLine: "watch from the stone",
      mode: "wind-on-stone",
      glyph: "sword",
      object: "wind-on-stone",
      accent: "#b9c0c8",
      deep: "#39424b",
      text: "A high window faces the weather. The stone is cold, but it keeps its oath.",
      question: "What must you meet without rushing toward it?",
      answers: [
        { id: "decision", label: "A decision", tone: "tempered judgment", accent: "#b9c0c8" },
        { id: "conflict", label: "A conflict", tone: "clean blade", accent: "#d7b66f" },
        { id: "future", label: "The future", tone: "far sight", accent: "#88a8c8" }
      ],
      mantras: [
        "Courage is attention that has accepted its post.",
        "A clear watch does not shout at the horizon.",
        "Meet the road when it arrives; do not spend yourself on its rumor."
      ],
      breath: ["Draw in and let the stone teach the spine.", "Watch without drawing the blade.", "Release alarm before action begins."],
      phases: ["Stand your attention like a guard at the wall.", "Watch without inventing the enemy twice.", "Bring back readiness, not alarm."],
      partings: ["Readiness is quieter than fear and more useful.", "Keep your oath small enough to keep today.", "The horizon is not a command."],
      letters: [
        "You watched the weather without becoming it.",
        "The {answer} remains real, but it no longer gets to spend your strength twice.",
        "Act when action is needed. Until then, keep the blade sheathed."
      ]
    },
    galadriel: {
      id: "galadriel",
      name: "Galadriel",
      mark: "L",
      room: "Silver mirror-light",
      title: "Silver mirror-light",
      code: "ROOM/GALADRIEL",
      posture: "mirror",
      postureLine: "mirror the silver water",
      mode: "water-drip",
      glyph: "mirror",
      object: "water-drip",
      accent: "#d8f3ff",
      deep: "#263c54",
      text: "Water gathers moon and window. The room does not answer; it reflects more carefully.",
      question: "What do you carry that is heavier than it ought to be?",
      answers: [
        { id: "image", label: "An image", tone: "clear reflection", accent: "#d8f3ff" },
        { id: "wish", label: "A wish", tone: "silver longing", accent: "#e6d5ff" },
        { id: "shadow", label: "A shadow", tone: "moonlit truth", accent: "#a7b4ff" }
      ],
      mantras: [
        "Reflection becomes counsel when you stop trying to own it.",
        "Silver light is not cold when it tells the truth gently.",
        "Some answers arrive as shapes before they arrive as words."
      ],
      breath: ["Breathe in and let the surface brighten.", "Do not reach into the water.", "Breathe out and let the image loosen."],
      phases: ["Look without grabbing at what appears.", "Let the water show a softer shape.", "Leave the image in the bowl and bring back the lesson."],
      partings: ["You saw enough. Leave the rest to ripen.", "The mirror is not a verdict; it is a lamp.", "Carry the light, not the whole vision."],
      letters: [
        "You looked without seizing, which is the beginning of sight.",
        "The {answer} became less heavy once it was reflected instead of hidden.",
        "Let the truest image be useful, not tyrannical."
      ]
    }
  };

  const dom = {
    body: document.body,
    wizardLine: document.getElementById("wizardLine"),
    guideStep: document.getElementById("guideStep"),
    guideTitle: document.getElementById("guideTitle"),
    guideText: document.getElementById("guideText"),
    hallMeta: document.getElementById("v9HallMeta"),
    roomCode: document.getElementById("v9RoomCode"),
    roomGlyph: document.getElementById("v9RoomGlyph"),
    roomObject: document.getElementById("v9RoomObject"),
    sprite: document.getElementById("v9CompanionSprite"),
    roomKicker: document.getElementById("v9RoomKicker"),
    roomTitle: document.getElementById("v9RoomTitle"),
    roomText: document.getElementById("v9RoomText"),
    roomList: document.getElementById("v9RoomList"),
    answerGrid: document.getElementById("v9AnswerGrid"),
    panelLabel: document.getElementById("v9PanelLabel"),
    companionName: document.getElementById("v9CompanionName"),
    postureLine: document.getElementById("v9PostureLine"),
    question: document.getElementById("v9CouncilQuestion"),
    enterButton: document.getElementById("v9EnterButton"),
    beginButton: document.getElementById("v9BeginButton"),
    audioButton: document.getElementById("v9AudioButton"),
    journalButton: document.getElementById("v9JournalButton"),
    backButton: document.getElementById("v9BackButton"),
    closeJournalButton: document.getElementById("v9CloseJournalButton"),
    timerText: document.getElementById("v9TimerText"),
    timerCaption: document.getElementById("v9TimerCaption"),
    letterTitle: document.getElementById("v9LetterTitle"),
    letterBody: document.getElementById("v9LetterBody"),
    letterMeta: document.getElementById("v9LetterMeta"),
    journalList: document.getElementById("v9JournalList"),
    doors: Array.from(document.querySelectorAll(".v9-door")),
    durationButtons: Array.from(document.querySelectorAll(".v9-duration-button")),
    versionButtons: Array.from(document.querySelectorAll(".version-button")),
    versionSelect: document.getElementById("versionSelect")
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
  const state = {
    companion: companions[saved.v9Companion] ? saved.v9Companion : "gandalf",
    answer: "",
    view: "hall",
    returnView: "hall",
    minutes: Number(saved.v9Minutes) || 5,
    remaining: (Number(saved.v9Minutes) || 5) * 60,
    running: false,
    lastTick: 0,
    raf: 0,
    audioOn: false,
    journal: loadJson(JOURNAL_KEY, []).filter((letter) => letter && letter.body).slice(0, 40),
    lastLetter: null,
    tendencies: saved.v9Tendencies && typeof saved.v9Tendencies === "object" ? saved.v9Tendencies : {}
  };

  if (companions[state.companion].answers.some((answer) => answer.id === saved.v9Answer)) {
    state.answer = saved.v9Answer;
  }

  const audio = { context: null, master: null, drone: null, timers: [] };

  function activeCompanion() {
    return companions[state.companion] || companions.gandalf;
  }

  function activeAnswer() {
    const companion = activeCompanion();
    return companion.answers.find((answer) => answer.id === state.answer) || null;
  }

  function setGuide(step, title, text) {
    if (!isV9()) return;
    dom.guideStep.textContent = step;
    dom.guideTitle.textContent = title;
    dom.guideText.textContent = text;
    dom.wizardLine.textContent = text;
  }

  function isV9() {
    // V9b shares V9's Council Hall flow — same companions, same council,
    // same Letter mechanic into the same v9 Journal. The only difference is
    // the painted-room render layer, which v9b.js handles separately.
    var v = dom.body.dataset.version;
    return v === "v9" || v === "v9b";
  }

  function format(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function postureProgress(companion) {
    return {
      sit: "sitting",
      rest: "resting",
      walk: "walking",
      watch: "watching",
      mirror: "mirroring"
    }[companion.posture] || companion.posture;
  }

  function countLetters(companionId) {
    return state.journal.filter((letter) => letter.companionId === companionId).length;
  }

  function saveSettings() {
    saveJson(SETTINGS_KEY, {
      ...loadJson(SETTINGS_KEY, {}),
      release: RELEASE,
      version: "v9",
      v9Companion: state.companion,
      v9Answer: state.answer,
      v9Minutes: state.minutes,
      v9Tendencies: state.tendencies
    });
  }

  function paintPalette() {
    const companion = activeCompanion();
    const answer = activeAnswer();
    const accent = answer?.accent || companion.accent;
    dom.body.style.setProperty("--v9-accent", accent);
    dom.body.style.setProperty("--v9-accent-deep", companion.deep);
    dom.body.style.setProperty("--v9-accent-soft", `${accent}30`);
    dom.body.style.setProperty("--v9-accent-glow", `${accent}66`);
    dom.body.dataset.v9Room = companion.id;
    dom.body.dataset.v9Answer = answer?.id || "";
    dom.body.dataset.v9View = state.view;
  }

  function renderRooms() {
    dom.roomList.replaceChildren();
    Object.values(companions).forEach((companion) => {
      const count = countLetters(companion.id);
      const button = document.createElement("button");
      button.className = "v9-room-pill";
      button.type = "button";
      button.classList.toggle("active", companion.id === state.companion);
      button.classList.toggle("has-letters", count > 0);
      button.innerHTML = `<span>${companion.mark}</span><strong>${companion.name}</strong><small>${count ? `${count} letter${count === 1 ? "" : "s"}` : companion.posture}</small>`;
      button.addEventListener("click", () => chooseCompanion(companion.id));
      dom.roomList.append(button);
    });

    dom.doors.forEach((door) => {
      const id = door.dataset.v9Companion;
      const count = countLetters(id);
      door.classList.toggle("active", id === state.companion);
      door.classList.toggle("occupied", id === state.companion || count > 0);
      door.classList.toggle("has-letters", count > 0);
    });
  }

  function renderAnswers() {
    const companion = activeCompanion();
    dom.answerGrid.replaceChildren();
    companion.answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "v9-answer-button";
      button.type = "button";
      button.style.setProperty("--answer-accent", answer.accent);
      button.classList.toggle("active", answer.id === state.answer);
      button.innerHTML = `<strong>${answer.label}</strong><small>${answer.tone}</small>`;
      button.addEventListener("click", () => chooseAnswer(answer.id));
      dom.answerGrid.append(button);
    });
  }

  function renderJournal() {
    dom.journalList.replaceChildren();
    if (!state.journal.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No letters yet. Finish a sit and the first one lands here.";
      dom.journalList.append(empty);
      return;
    }
    state.journal.forEach((letter) => {
      const item = document.createElement("li");
      const meta = document.createElement("div");
      const title = document.createElement("strong");
      const body = document.createElement("p");
      const signed = document.createElement("small");
      meta.className = "v9-letter-meta";
      meta.textContent = `${letter.companion} / ${letter.posture} / ${letter.answer}`;
      title.textContent = letter.title;
      body.textContent = letter.body;
      signed.textContent = letter.signed;
      item.append(meta, title, body, signed);
      dom.journalList.append(item);
    });
  }

  function renderLetter() {
    const letter = state.lastLetter || state.journal[0];
    if (!letter) {
      dom.letterTitle.textContent = "No letter yet.";
      dom.letterBody.textContent = "Finish a sit and your companion will leave a note here.";
      dom.letterMeta.textContent = "Stored locally in this browser.";
      return;
    }
    dom.letterTitle.textContent = letter.title;
    dom.letterBody.textContent = letter.body;
    dom.letterMeta.textContent = letter.signed;
  }

  function update() {
    const companion = activeCompanion();
    const answer = activeAnswer();
    paintPalette();
    renderRooms();
    renderAnswers();
    renderJournal();
    renderLetter();

    dom.panelLabel.textContent = state.view === "journal" ? "Journal" : companion.room;
    dom.companionName.textContent = companion.name;
    dom.postureLine.textContent = companion.postureLine;
    dom.question.textContent = companion.question;
    dom.roomCode.textContent = companion.code;
    dom.roomKicker.textContent = `${companion.name} / ${companion.posture}`;
    dom.roomTitle.textContent = companion.title;
    dom.roomText.textContent = answer ? `${companion.text} You named ${answer.label.toLowerCase()}; the room answers in ${answer.tone}.` : companion.text;
    dom.roomGlyph.dataset.glyph = companion.glyph;
    dom.roomObject.dataset.object = companion.object;
    dom.sprite.dataset.companion = companion.id;
    dom.hallMeta.textContent = state.journal.length ? `${state.journal.length} letter${state.journal.length === 1 ? "" : "s"} kept in the hall journal.` : "Five rooms. One question before each sit.";
    dom.enterButton.textContent = state.view === "hall" ? `Enter ${companion.name}` : "Change room";
    dom.beginButton.textContent = state.running ? "Pause sit" : answer ? `Begin ${companion.posture}` : "Answer first";
    dom.audioButton.textContent = state.audioOn ? "Audio off" : "Audio on";
    dom.journalButton.textContent = `Journal ${state.journal.length}`;
    dom.timerText.textContent = format(state.remaining);
    dom.timerCaption.textContent = state.running ? postureProgress(companion) : `${state.minutes} min / ${answer ? answer.tone : "council"}`;
    dom.durationButtons.forEach((button) => button.classList.toggle("active", Number(button.dataset.v9Minutes) === state.minutes));
  }

  function setView(view) {
    if (view === "journal" && state.view !== "journal") state.returnView = state.view;
    state.view = view;
    update();
  }

  function chooseCompanion(id) {
    state.companion = companions[id] ? id : "gandalf";
    state.answer = "";
    state.lastLetter = null;
    saveSettings();
    setView("council");
    chime(520, 0.08);
    setGuide("Council prompt", activeCompanion().name, activeCompanion().question);
  }

  function chooseAnswer(id) {
    const companion = activeCompanion();
    const answer = companion.answers.find((item) => item.id === id) || companion.answers[0];
    state.answer = answer.id;
    state.tendencies[answer.id] = (state.tendencies[answer.id] || 0) + 1;
    saveSettings();
    setView("council");
    chime(660, 0.06);
    setGuide("Answer kept", `${companion.name} / ${answer.tone}`, companion.mantras[state.tendencies[answer.id] % companion.mantras.length]);
  }

  function chooseDuration(minutes) {
    state.minutes = minutes;
    state.remaining = minutes * 60;
    saveSettings();
    update();
  }

  function template(text, data) {
    return text.replace(/\{(\w+)\}/g, (_, key) => String(data[key] ?? ""));
  }

  function composeLetter() {
    const companion = activeCompanion();
    const answer = activeAnswer() || companion.answers[0];
    const count = countLetters(companion.id) + 1;
    const now = new Date();
    const date = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(now);
    const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now);
    const data = { answer: answer.label.toLowerCase(), posture: companion.posture, minutes: state.minutes, count };
    const lines = companion.letters.map((line) => template(line, data));
    if (count > 1) lines.splice(2, 0, `This is letter ${count} from this room; returning is its own counsel.`);
    return {
      id: `${Date.now()}-${companion.id}-${answer.id}`,
      companion: companion.name,
      companionId: companion.id,
      posture: companion.posture,
      answer: answer.label,
      title: `${companion.name} writes after the ${companion.posture}`,
      body: lines.join("\n"),
      signed: `${companion.name} / ${date} / ${time}`,
      date
    };
  }

  function completeSit() {
    state.running = false;
    state.remaining = 0;
    state.lastLetter = composeLetter();
    state.journal.unshift(state.lastLetter);
    state.journal = state.journal.slice(0, 40);
    saveJson(JOURNAL_KEY, state.journal);
    setView("letter");
    chime(880, 0.16);
    setGuide("Letter received", state.lastLetter.answer, activeCompanion().partings[state.journal.length % activeCompanion().partings.length]);
  }

  function tick(now) {
    if (!state.running) return;
    if (!state.lastTick) state.lastTick = now;
    const delta = (now - state.lastTick) / 1000;
    state.lastTick = now;
    state.remaining = Math.max(0, state.remaining - delta);
    const companion = activeCompanion();
    const elapsed = Math.max(0, state.minutes * 60 - state.remaining);
    const phaseIndex = Math.min(2, Math.floor((elapsed / (state.minutes * 60 || 1)) * 3));
    if (Math.floor(elapsed) % 8 === 0) {
      dom.timerCaption.textContent = companion.phases[phaseIndex];
    }
    if (state.remaining <= 0) {
      completeSit();
      return;
    }
    dom.timerText.textContent = format(state.remaining);
    dom.beginButton.textContent = "Pause sit";
    state.raf = requestAnimationFrame(tick);
  }

  async function beginOrPause() {
    if (!activeAnswer()) {
      setView("council");
      setGuide("Answer first", activeCompanion().name, "Choose one council answer, then begin the sit.");
      return;
    }
    if (state.running) {
      state.running = false;
      cancelAnimationFrame(state.raf);
      setGuide("Paused", activeCompanion().name, "The room keeps your place.");
      update();
      return;
    }
    if (state.remaining <= 0) state.remaining = state.minutes * 60;
    state.running = true;
    state.lastTick = 0;
    setView("sit");
    await setAudio(true);
    setGuide("Sit has begun", activeCompanion().name, activeCompanion().breath[0]);
    state.raf = requestAnimationFrame(tick);
  }

  function ensureAudio() {
    if (audio.context) return audio.context;
    audio.context = new (window.AudioContext || window.webkitAudioContext)();
    audio.master = audio.context.createGain();
    audio.drone = audio.context.createOscillator();
    const gain = audio.context.createGain();
    audio.master.gain.value = 0.12;
    audio.drone.type = "triangle";
    audio.drone.frequency.value = 82;
    gain.gain.value = 0.035;
    audio.drone.connect(gain).connect(audio.master).connect(audio.context.destination);
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

  function noise(duration, filterType, frequency, gainValue) {
    const ctx = ensureAudio();
    const samples = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples; i += 1) channel[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.connect(filter).connect(gain).connect(audio.master);
    source.start();
    source.stop(ctx.currentTime + duration + 0.02);
  }

  function chime(freq, length) {
    if (!state.audioOn && !isV9()) return;
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + length);
    osc.connect(gain).connect(audio.master);
    osc.start();
    osc.stop(ctx.currentTime + length + 0.02);
  }

  function scheduleAudio() {
    if (!state.audioOn || !isV9()) return;
    const mode = activeCompanion().mode;
    if (mode === "hearth-fire") {
      noise(0.05 + Math.random() * 0.08, "bandpass", 600 + Math.random() * 1500, 0.04);
      queue(scheduleAudio, 150 + Math.random() * 600);
    } else if (mode === "kettle-tick") {
      chime(920 + Math.random() * 200, 0.08);
      queue(scheduleAudio, 420 + Math.random() * 900);
    } else if (mode === "garden-rain") {
      noise(0.16, "highpass", 1300 + Math.random() * 500, 0.018);
      queue(scheduleAudio, 90 + Math.random() * 210);
    } else if (mode === "wind-on-stone") {
      noise(0.8 + Math.random(), "lowpass", 260 + Math.random() * 260, 0.018);
      queue(scheduleAudio, 900 + Math.random() * 1700);
    } else {
      chime(620 + Math.random() * 280, 0.36);
      queue(scheduleAudio, 720 + Math.random() * 1900);
    }
  }

  async function setAudio(on) {
    state.audioOn = on;
    clearAudioTimers();
    if (!on) {
      if (audio.context) await audio.context.suspend();
      update();
      return;
    }
    ensureAudio();
    await audio.context.resume();
    scheduleAudio();
    update();
  }

  function openJournal() {
    setView("journal");
    setGuide("Journal", "Council letters", state.journal.length ? "Newest letter first." : "The journal is blank and waiting.");
  }

  dom.doors.forEach((door) => door.addEventListener("click", () => chooseCompanion(door.dataset.v9Companion)));
  dom.enterButton.addEventListener("click", () => (state.view === "hall" ? setView("council") : setView("hall")));
  dom.backButton.addEventListener("click", () => setView("hall"));
  dom.beginButton.addEventListener("click", beginOrPause);
  dom.audioButton.addEventListener("click", () => setAudio(!state.audioOn));
  dom.journalButton.addEventListener("click", openJournal);
  dom.closeJournalButton.addEventListener("click", () => setView(state.returnView || "hall"));
  dom.durationButtons.forEach((button) => button.addEventListener("click", () => chooseDuration(Number(button.dataset.v9Minutes))));
  dom.versionButtons.forEach((button) => button.addEventListener("click", () => window.setTimeout(() => { if (isV9()) { saveSettings(); update(); } }, 0)));
  dom.versionSelect?.addEventListener("change", () => window.setTimeout(() => { if (isV9()) { saveSettings(); update(); } }, 0));

  state.remaining = state.minutes * 60;
  update();
  if (isV9()) {
    saveSettings();
    setGuide("V9 ready", activeCompanion().room, activeCompanion().question);
  }
})();
