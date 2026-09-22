import {
  PAD_DEFINITIONS,
  PAD_BY_CODE,
  PAD_BY_ID,
  NounsDrumClubAudio,
} from "./nouns-drum-club-audio";
import {
  SCORE_PRESETS,
  normalizeScore,
  decodeScore,
  encodeScore,
  setStep,
  toggleStep,
  stepDuration,
  stepTime,
  type DrumScore,
} from "./nouns-drum-club-score";
import { NounsDrumClubRoom } from "./nouns-drum-club-room";

let disposeClub: (() => void) | undefined;

function mountClub() {
  disposeClub?.();
  const app = document.querySelector<HTMLElement>("#ndc");
  if (!app) return;
  const control = new AbortController();
  const listen = (target: EventTarget, type: string, fn: EventListener) =>
    target.addEventListener(type, fn, { signal: control.signal });
  const el = <T extends HTMLElement = HTMLElement>(id: string) =>
    app.querySelector<T>(`#ndc-${id}`)!;
  const audio = new NounsDrumClubAudio();
  audio.setVolume(0.65);
  let destroyed = false;
  let room: NounsDrumClubRoom | null = null;
  let roomLive = false;
  let soundOn = false;
  let playing = false;
  let recording = false;
  let startAt = 0;
  let nextStep = 0;
  let clockEpoch = 0;
  let fillEpoch = 0;
  let currentStep = -1;
  let scheduler: ReturnType<typeof setInterval> | undefined;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const after = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!destroyed) fn();
    }, ms);
    timers.add(timer);
    return timer;
  };
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let calm = media.matches;
  let score: DrumScore = normalizeScore(SCORE_PRESETS.clubhouse);
  const params = new URLSearchParams(location.search);
  try {
    score = params.has("beat")
      ? decodeScore(params.get("beat"))
      : decodeScore(localStorage.getItem("nouns-drum-club-beat-v1"));
  } catch {
    /* Storage is optional. */
  }
  const roomInput = el<HTMLInputElement>("room-code");
  const requestedRoom = params.get("room");
  if (
    requestedRoom &&
    /^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/i.test(requestedRoom)
  )
    roomInput.value = requestedRoom.toLowerCase();
  const defaultLanes = [
    "kick",
    "snare",
    "clap",
    "hat-closed",
    "shaker",
    "bass-c",
    "mallet-g",
    "chord-c",
  ];
  let visibleLanes = [
    ...new Set([...defaultLanes, ...score.lanes.map((lane) => lane.padId)]),
  ];
  const say = (text: string) => {
    el("status").textContent = text;
  };
  const persist = () => {
    try {
      localStorage.setItem("nouns-drum-club-beat-v1", encodeScore(score));
    } catch {
      /* The instrument works without storage. */
    }
  };
  const clearPresetSelection = () =>
    app
      .querySelectorAll("[data-preset]")
      .forEach((button) => button.setAttribute("aria-pressed", "false"));
  const syncTempo = () => {
    el<HTMLInputElement>("tempo").value = String(score.tempo);
    el<HTMLInputElement>("swing").value = String(Math.round(score.swing * 100));
  };
  syncTempo();
  const meter = el<HTMLMeterElement>("level");
  const meterTimer = setInterval(() => {
    if (meter) meter.value = document.hidden ? 0 : Math.min(1, audio.level * 5);
  }, 80);
  if (params.has("beat")) {
    clearPresetSelection();
    say(
      `${score.name} is ready. Press Play loop to hear it, then make it yours.`,
    );
  }

  const canvas = el<HTMLCanvasElement>("canvas");
  const context = canvas.getContext("2d");
  let width = 0,
    height = 0,
    frame = 0,
    lastFrame = 0;
  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    color: string;
    shape: number;
    text?: string;
  };
  let particles: Particle[] = [];
  const resize = new ResizeObserver(() => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  });
  resize.observe(canvas);
  const draw = (now: number) => {
    frame = 0;
    if (!context || destroyed) return;
    const dt = Math.min(2, Math.max(0.25, (now - lastFrame) / 16.67));
    lastFrame = now;
    context.clearRect(0, 0, width, height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.045 * dt;
      context.globalAlpha = Math.min(1, p.life / 14);
      context.fillStyle = p.color;
      if (p.text) {
        context.font = "25px sans-serif";
        context.fillText(p.text, p.x, p.y);
      } else if (p.shape % 2) {
        context.fillRect(p.x, p.y, 7, 7);
      } else {
        context.beginPath();
        context.arc(p.x, p.y, 4, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
    if (particles.length) frame = requestAnimationFrame(draw);
  };
  function confetti(index: number, color: string, text?: string) {
    if (calm || !context || document.hidden) return;
    const x = width * (0.18 + index * 0.215);
    for (let i = 0; i < (text ? 4 : 8); i++)
      particles.push({
        x: x + (Math.random() - 0.5) * 55,
        y: height * 0.4,
        vx: (Math.random() - 0.5) * 3.8,
        vy: -2.5 - Math.random() * 2.4,
        life: 45,
        max: 45,
        color,
        shape: i,
        text,
      });
    if (particles.length > 180) particles.splice(0, particles.length - 180);
    if (!frame) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(draw);
    }
  }
  const pulseTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const animations = new Map<number, Animation>();
  const padButtons = new Map(
    Array.from(app.querySelectorAll<HTMLButtonElement>("[data-pad]")).map(
      (button) => [button.dataset.pad!, button],
    ),
  );
  function visualize(padId: string, peer = false) {
    const pad = PAD_BY_ID.get(padId);
    if (!pad || document.hidden) return;
    const button = padButtons.get(padId);
    const old = pulseTimers.get(padId);
    if (old) {
      clearTimeout(old);
      timers.delete(old);
    }
    button?.classList.add("is-hit");
    pulseTimers.set(
      padId,
      after(() => {
        button?.classList.remove("is-hit");
        pulseTimers.delete(padId);
      }, 140),
    );
    const order = PAD_DEFINITIONS.indexOf(pad);
    const memberIndex = order < 10 ? 0 : order < 20 ? 1 : order < 29 ? 2 : 3;
    const member = app.querySelector<HTMLElement>(
      `[data-member="${memberIndex}"]`,
    );
    if (!calm && member) {
      animations.get(memberIndex)?.cancel();
      animations.set(
        memberIndex,
        member.animate(
          [
            { transform: "translateY(0) rotate(0)" },
            { transform: "translateY(-12px) rotate(-3deg)" },
            { transform: "translateY(0) rotate(0)" },
          ],
          { duration: 260, easing: "ease-out" },
        ),
      );
    }
    confetti(memberIndex, pad.color);
    el("last-hit").textContent =
      `${peer ? "FROM THE ROOM" : "YOU"} / ${pad.label.toUpperCase()}`;
  }
  function setSoundUI() {
    const button = el<HTMLButtonElement>("sound");
    button.textContent = soundOn ? "◉ Sound on" : "◉ Turn sound on";
    button.setAttribute("aria-pressed", String(soundOn));
  }
  async function enableSound() {
    if (soundOn && audio.enabled) return true;
    const enabled = await audio.enable();
    if (destroyed) return false;
    if (!enabled) {
      say("Sound could not start. Tap Turn sound on to try again.");
      return false;
    }
    soundOn = true;
    audio.setMuted(false);
    setSoundUI();
    return true;
  }
  async function hit(padId: string, velocity = 0.85) {
    if (!(await enableSound())) return;
    audio.hit(padId, velocity);
    visualize(padId);
    if (roomLive) room?.hit(padId, velocity);
    if (recording && playing) {
      const position = Math.max(
        0,
        Math.floor((audio.currentTime - startAt) / stepDuration(score.tempo)),
      );
      const closest = [
        Math.max(0, position - 1),
        position,
        position + 1,
      ].reduce(
        (best, candidate) =>
          Math.abs(
            stepTime(startAt, candidate, score.tempo, score.swing) -
              audio.currentTime,
          ) <
          Math.abs(
            stepTime(startAt, best, score.tempo, score.swing) -
              audio.currentTime,
          )
            ? candidate
            : best,
        position,
      );
      const step = closest % 16;
      score = setStep(score, padId, Math.max(0, step), velocity);
      if (!visibleLanes.includes(padId)) visibleLanes.push(padId);
      renderGrid();
      persist();
      clearPresetSelection();
    }
  }
  for (const [padId, button] of padButtons) {
    listen(button, "pointerdown", ((event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      void hit(padId, event.shiftKey ? 0.45 : 0.85);
    }) as EventListener);
    listen(button, "click", ((event: MouseEvent) => {
      if (event.detail === 0) void hit(padId);
    }) as EventListener);
  }
  listen(el("sound"), "click", async () => {
    if (soundOn) {
      stop();
      soundOn = false;
      audio.setMuted(true);
      setSoundUI();
      say("Sound is off. Tap a pad to play again.");
    } else if (await enableSound()) say("Sound on. Your keyboard is ready.");
  });
  listen(el("volume"), "input", () =>
    audio.setVolume(Number(el<HTMLInputElement>("volume").value) / 100),
  );

  function renderGrid() {
    const grid = el("sequencer");
    const fragment = document.createDocumentFragment();
    const heading = document.createElement("div");
    heading.className = "ndc-seq-row";
    for (const title of [
      "SOUND",
      ...Array.from({ length: 16 }, (_, i) => String(i + 1)),
    ]) {
      const span = document.createElement("span");
      span.textContent = title;
      heading.append(span);
    }
    fragment.append(heading);
    for (const padId of visibleLanes) {
      const pad = PAD_BY_ID.get(padId);
      if (!pad) continue;
      const lane = score.lanes.find((item) => item.padId === padId);
      const row = document.createElement("div");
      row.className = "ndc-seq-row";
      row.style.setProperty("--lane-color", pad.color);
      const label = document.createElement("span");
      label.textContent = pad.label;
      label.className = "ndc-seq-label";
      row.append(label);
      for (let step = 0; step < 16; step++) {
        const button = document.createElement("button");
        button.className = "ndc-step";
        button.type = "button";
        button.dataset.step = String(step);
        button.dataset.lane = padId;
        button.setAttribute("aria-label", `${pad.label}, step ${step + 1}`);
        button.setAttribute(
          "aria-pressed",
          String((lane?.steps[step] ?? 0) > 0),
        );
        if (playing && currentStep === step) button.classList.add("is-current");
        row.append(button);
      }
      fragment.append(row);
    }
    const focused = document.activeElement as HTMLElement | null;
    const focusLane = focused?.dataset.lane,
      focusStep = focused?.dataset.step;
    grid.replaceChildren(fragment);
    if (focusLane && focusStep)
      grid
        .querySelector<HTMLButtonElement>(
          `[data-lane="${focusLane}"][data-step="${focusStep}"]`,
        )
        ?.focus({ preventScroll: true });
  }
  renderGrid();
  listen(el("sequencer"), "click", ((event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-step][data-lane]",
    );
    if (!button) return;
    const padId = button.dataset.lane!,
      step = Number(button.dataset.step);
    score = toggleStep(score, padId, step);
    persist();
    clearPresetSelection();
    const on =
      (score.lanes.find((l) => l.padId === padId)?.steps[step] ?? 0) > 0;
    button.setAttribute("aria-pressed", String(on));
    if (on && soundOn && !playing) {
      audio.hit(padId, 0.55);
      visualize(padId);
    }
  }) as EventListener);
  function showStep(step: number) {
    currentStep = step;
    app
      .querySelectorAll<HTMLElement>("[data-step]")
      .forEach((button) =>
        button.classList.toggle(
          "is-current",
          Number(button.dataset.step) === step,
        ),
      );
  }
  function tick() {
    if (!playing || destroyed || !soundOn) return;
    const now = audio.currentTime;
    // A sleeping tab resumes at the present bar, without replaying a backlog.
    if (stepTime(startAt, nextStep, score.tempo, score.swing) < now - 0.15)
      nextStep = Math.max(
        nextStep,
        Math.ceil((now - startAt) / stepDuration(score.tempo)),
      );
    while (stepTime(startAt, nextStep, score.tempo, score.swing) < now + 0.1) {
      const when = stepTime(startAt, nextStep, score.tempo, score.swing),
        step = nextStep % 16;
      const hits = score.lanes.filter((lane) => lane.steps[step] > 0);
      for (const lane of hits)
        audio.hit(lane.padId, lane.steps[step] * 0.8, when);
      const epoch = clockEpoch;
      after(
        () => {
          if (!playing || epoch !== clockEpoch) return;
          showStep(step);
          for (const lane of hits) visualize(lane.padId);
        },
        Math.max(0, (when - now) * 1000),
      );
      nextStep++;
    }
  }
  function stop() {
    clockEpoch++;
    fillEpoch++;
    audio.stop();
    playing = false;
    recording = false;
    if (scheduler) clearInterval(scheduler);
    scheduler = undefined;
    el("play").textContent = "▶ Play loop";
    el("play").setAttribute("aria-pressed", "false");
    el("record").setAttribute("aria-pressed", "false");
    showStep(-1);
  }
  async function play() {
    if (playing) {
      stop();
      say("Loop stopped. The keyboard is still yours.");
      return;
    }
    if (!(await enableSound()) || playing) return;
    playing = true;
    startAt = audio.currentTime + 0.045;
    nextStep = 0;
    el("play").textContent = "■ Stop loop";
    el("play").setAttribute("aria-pressed", "true");
    tick();
    scheduler = setInterval(tick, 25);
    say(
      "Your loop is playing. Add keys on top, or turn on Overdub to keep them.",
    );
  }
  listen(el("play"), "click", () => {
    void play();
  });
  listen(el("record"), "click", async () => {
    if (!playing) await play();
    if (!playing) return;
    recording = !recording;
    el("record").setAttribute("aria-pressed", String(recording));
    say(
      recording
        ? "Overdub is on. Your keys will join the loop."
        : "Overdub is off. Play freely over your beat.",
    );
  });
  const restartClock = () => {
    if (playing) {
      clockEpoch++;
      audio.stop();
      startAt = audio.currentTime + 0.11;
      nextStep = 0;
    }
  };
  listen(el("tempo"), "change", () => {
    score = normalizeScore({
      ...score,
      tempo: Number(el<HTMLInputElement>("tempo").value),
    });
    syncTempo();
    persist();
    restartClock();
    clearPresetSelection();
  });
  listen(el("swing"), "input", () => {
    score = {
      ...score,
      swing: Number(el<HTMLInputElement>("swing").value) / 100,
    };
    persist();
    clearPresetSelection();
  });
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-preset]"))
    listen(button, "click", () => {
      const preset = SCORE_PRESETS[button.dataset.preset!];
      if (!preset) return;
      score = normalizeScore(preset);
      visibleLanes = [
        ...new Set([...defaultLanes, ...score.lanes.map((l) => l.padId)]),
      ];
      syncTempo();
      renderGrid();
      persist();
      restartClock();
      clearPresetSelection();
      button.setAttribute("aria-pressed", "true");
      say(
        `${score.name} is ready. ${playing ? "Keep playing along." : "Press Play loop to hear it."}`,
      );
    });
  listen(el("clear"), "click", () => {
    score = { ...score, name: "My beat", lanes: [] };
    renderGrid();
    persist();
    clearPresetSelection();
    say("A blank canvas. Tap grid steps, or use Overdub and play.");
  });
  listen(el("add-lane"), "change", () => {
    const select = el<HTMLSelectElement>("add-lane");
    if (select.value && !visibleLanes.includes(select.value)) {
      visibleLanes.push(select.value);
      renderGrid();
    }
    select.value = "";
  });
  listen(document, "keydown", ((event: KeyboardEvent) => {
    if (event.code === "Escape") {
      stop();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const target = event.target as HTMLElement;
    if (target.closest('input,textarea,select,[contenteditable="true"],dialog'))
      return;
    if (event.code === "Space") {
      if (target.closest("button,a")) return;
      event.preventDefault();
      void play();
      return;
    }
    const pad = PAD_BY_CODE.get(event.code);
    if (pad) {
      event.preventDefault();
      void hit(pad.id, event.shiftKey ? 0.45 : 0.85);
    }
  }) as EventListener);
  listen(document, "visibilitychange", () => {
    if (document.hidden) {
      stop();
      particles = [];
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      context?.clearRect(0, 0, width, height);
    }
  });
  listen(el("fill"), "click", async () => {
    if (!(await enableSound())) return;
    const epoch = ++fillEpoch;
    const fill = ["tom-low", "tom-high", "snare", "snare", "clap", "sparkle"];
    fill.forEach((id, i) =>
      after(() => {
        if (!soundOn || document.hidden || epoch !== fillEpoch) return;
        audio.hit(id, 0.7);
        visualize(id);
        if (roomLive) room?.hit(id, 0.7);
      }, i * 115),
    );
    say("A little flourish. Your turn.");
  });

  async function copyLink(url: URL, kind: string) {
    try {
      await navigator.clipboard.writeText(url.href);
      say(`${kind} copied. Send it to someone you want to make music with.`);
    } catch {
      say(`Copy this ${kind.toLowerCase()}:`);
      let field = app.querySelector<HTMLInputElement>("#ndc-copy-fallback");
      if (!field) {
        field = document.createElement("input");
        field.id = "ndc-copy-fallback";
        field.readOnly = true;
        field.style.cssText =
          "width:100%;padding:10px;font-size:12px;border:1px solid currentColor";
        field.setAttribute("aria-label", "Link to copy");
        el("status").after(field);
      }
      field.value = url.href;
      field.focus();
      field.select();
    }
  }
  listen(el("copy-beat"), "click", () => {
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set("beat", encodeScore(score));
    void copyLink(url, "Beat link");
  });
  listen(el("invite"), "click", () => {
    const url = new URL(location.pathname, location.origin);
    const code = roomInput.value.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/.test(code)) {
      say("Use 1–24 letters, numbers, or dashes for the room name.");
      roomInput.focus();
      return;
    }
    url.searchParams.set("room", code);
    void copyLink(url, "Room invite");
  });
  function leaveRoom() {
    roomLive = false;
    room?.disconnect();
    room = null;
    el("people").replaceChildren();
    el("room-status").textContent = "Solo session";
    el("room-dot").classList.remove("is-live");
    el("leave").hidden = true;
    el("join").textContent = "Join ↗";
    roomInput.disabled = false;
    el("stage-caption").textContent = "THE CLUBHOUSE IS YOURS";
  }
  listen(el("room-form"), "submit", ((event: SubmitEvent) => {
    event.preventDefault();
    const code = roomInput.value.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/.test(code)) {
      say("Use 1–24 letters, numbers, or dashes for the room name.");
      return;
    }
    leaveRoom();
    roomInput.value = code;
    roomInput.disabled = true;
    el("leave").hidden = false;
    room = new NounsDrumClubRoom({
      room: code,
      onStatus(status) {
        if (destroyed) return;
        roomLive = status.state === "live";
        el("room-dot").classList.toggle("is-live", roomLive);
        const labels = {
          connecting: "Connecting…",
          live: "Room connected",
          reconnecting: "Reconnecting…",
          unavailable: "Room unavailable · try again",
          closed: "Solo session",
        };
        el("room-status").textContent = labels[status.state];
        el("join").textContent = roomLive ? "Rejoin ↗" : "Join ↗";
        if (status.state === "unavailable") {
          roomInput.disabled = false;
          say(
            "The shared room is unavailable. Your keyboard and local loop still work.",
          );
        }
        if (roomLive)
          el("stage-caption").textContent = `LIVE ROOM / ${code.toUpperCase()}`;
      },
      onPresence(presence) {
        if (destroyed) return;
        el("room-status").textContent =
          `${presence.connected} ${presence.connected === 1 ? "person" : "people"} connected`;
        const avatars = document.createDocumentFragment();
        for (const person of presence.people.slice(0, 12)) {
          const img = document.createElement("img");
          img.src = `/games/nouns-nation-battler/assets/noun-${person.avatar % 60}.svg`;
          img.alt = "Connected Noun";
          img.width = 38;
          img.height = 38;
          avatars.append(img);
        }
        el("people").replaceChildren(avatars);
      },
      onHit(event) {
        if (event.origin !== "peer" || document.hidden) return;
        if (soundOn) audio.hit(event.pad, event.velocity * 0.8);
        visualize(event.pad, true);
      },
      onReaction(event) {
        confetti(1, "#f36a35", event.emoji);
      },
    });
    room.connect();
    say("Joining the band. Turn sound on to hear the room.");
  }) as EventListener);
  listen(el("leave"), "click", () => {
    leaveRoom();
    say("You left the room. Keep making music here.");
  });
  listen(el("new-room"), "click", () => {
    leaveRoom();
    const bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    roomInput.value = `jam-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
    say("Your new room name is ready. Join, then copy an invite.");
  });
  for (const button of app.querySelectorAll<HTMLButtonElement>(
    "[data-reaction]",
  ))
    listen(button, "click", () => {
      const emoji = button.dataset.reaction!;
      confetti(2, "#f36a35", emoji);
      if (roomLive) room?.sendReaction(emoji);
      else say("Join a room to send your applause to the band.");
    });
  function syncMotion() {
    app.classList.toggle("is-calm", calm);
    el("motion").setAttribute("aria-pressed", String(calm));
    el("motion").textContent = calm ? "Motion: gentle" : "Less motion";
    if (calm) {
      particles = [];
      animations.forEach((animation) => animation.cancel());
    }
  }
  syncMotion();
  listen(el("motion"), "click", () => {
    calm = !calm;
    syncMotion();
  });
  listen(media, "change", () => {
    calm = media.matches;
    syncMotion();
  });
  const scenes = ["clubhouse", "parade", "moonwalk"];
  let scene = 0;
  listen(el("scene"), "click", () => {
    scene = (scene + 1) % scenes.length;
    app.dataset.scene = scenes[scene];
    el("scene").textContent =
      `Scene: ${["Clubhouse", "Golden hour", "Moonwalk"][scene]} ↻`;
  });
  listen(el("help"), "click", () =>
    el("guide").scrollIntoView({
      behavior: calm ? "instant" : "smooth",
      block: "start",
    }),
  );
  disposeClub = () => {
    destroyed = true;
    stop();
    clearInterval(meterTimer);
    control.abort();
    room?.disconnect();
    resize.disconnect();
    if (frame) cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    animations.forEach((animation) => animation.cancel());
    void audio.dispose();
  };
}

mountClub();
document.addEventListener("astro:page-load", mountClub);
document.addEventListener("astro:before-swap", () => {
  disposeClub?.();
  disposeClub = undefined;
});
