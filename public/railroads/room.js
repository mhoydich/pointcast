(() => {
  const FALLBACK_ERAS = {
    "1825": {
      index: 0,
      location: "SHILDON → STOCKTON · 27 SEP 1825",
      plate: "01",
      kicker: "WHEN PUBLIC STEAM BECAME A PUBLIC EVENT",
      title: "The railway did not begin with a blank page.",
      answer:
        "Railways and steam engines already existed. What changed on September 27, 1825 was the combination: Locomotion No. 1 hauled an opening train over the Stockton & Darlington, a public railway built to move coal and open to traffic. The journey made a scattered set of inventions look like a repeatable public system.",
      gain: "A working model for moving freight and people on one shared line.",
      cost: "The new network grew inside a coal economy and accelerated industrial expansion.",
      question: "When does an invention become infrastructure?",
      topic: "beginnings",
      sourceLabel: "HISTORIC ENGLAND · STOCKTON & DARLINGTON OVERVIEW",
      source: "https://historicengland.org.uk/whats-new/research/a-brief-overview-of-the-stockton-and-darlington-railway/",
      keywords: [
        "1825", "begin", "began", "beginning", "first", "origin", "steam", "locomotion",
        "darlington", "stockton", "england", "coal", "public railway"
      ],
    },
    "1869": {
      index: 1,
      location: "SIERRA NEVADA → PROMONTORY · 1869",
      plate: "02",
      kicker: "THE WORK BEFORE THE CEREMONY",
      title: "A continent was joined by hands the photograph minimized.",
      answer:
        "The Central Pacific relied on thousands of Chinese workers as graders, tracklayers, masons, blacksmith helpers, and cooks. They faced avalanches, blasting accidents, severe weather, and unequal pay. Eight Chinese workers moved the final rail into place at Promontory on May 10, 1869, just before the famous ceremony crowded them out of the best-known image.",
      gain: "Rail and telegraph connected distant markets, mail, and travel across the continent.",
      cost: "Dangerous labor, discriminatory wages, and a public memory that hid many builders.",
      question: "Who disappears when a network tells its success story?",
      topic: "labor and memory",
      sourceLabel: "NATIONAL PARK SERVICE · ARCHEOLOGY OF CHINESE LABORERS",
      source: "https://www.nps.gov/articles/archeology-of-chinese-laborers-connected-country.htm",
      keywords: [
        "1869", "built", "builder", "workers", "worker", "labor", "chinese", "sierra", "promontory",
        "spike", "transcontinental", "central pacific", "union pacific", "who made", "who did"
      ],
    },
    "1883": {
      index: 2,
      location: "NORTH AMERICA · 18 NOV 1883",
      plate: "03",
      kicker: "THE DAY NOON HAPPENED TWICE",
      title: "Railroads needed every clock to agree.",
      answer:
        "Before standard time, towns set clocks by the local sun. That left North America with hundreds of local times and railroads juggling roughly fifty operating standards. On November 18, 1883, the railroads adopted standard zones. In some places, people experienced two noons: one by the sun and another by the new railway clock.",
      gain: "Timetables became legible across long distances.",
      cost: "Local solar time gave way to a network’s clock.",
      question: "Whose clock are you living by?",
      topic: "time and coordination",
      sourceLabel: "SMITHSONIAN NATIONAL MUSEUM OF AMERICAN HISTORY · ON TIME",
      source: "https://americanhistory.si.edu/ontime/synchronizing/zones.html",
      keywords: [
        "1883", "time", "clock", "noon", "zone", "zones", "schedule", "timetable", "late", "standard"
      ],
    },
    "1964": {
      index: 3,
      location: "TOKYO → SHIN-OSAKA · 01 OCT 1964",
      plate: "04",
      kicker: "SPEED BECAME A PUBLIC PROMISE",
      title: "The train stopped imitating the airplane.",
      answer:
        "The Tokaido Shinkansen opened between Tokyo and Shin-Osaka on October 1, 1964. Its dedicated electric railway and Series 0 trains made high speed a normal, repeated public service—not a one-off record attempt. The breakthrough was the whole system: track, power, signaling, schedules, stations, and maintenance working together.",
      gain: "Distant cities became part of one dependable day.",
      cost: "Speed required a new corridor and a permanent commitment to the system behind it.",
      question: "Is speed a machine—or an agreement people keep?",
      topic: "speed and systems",
      sourceLabel: "JR CENTRAL · SCMAGLEV AND RAILWAY PARK",
      source: "https://museum.jr-central.co.jp/sp/en/_pdf/brochure.pdf",
      keywords: [
        "1964", "fast", "faster", "speed", "high speed", "bullet", "shinkansen", "japan", "tokyo",
        "osaka", "modern", "electric"
      ],
    },
  };

  const root = document.querySelector("[data-railroad-room]");
  if (!root) return;

  let ERAS = FALLBACK_ERAS;
  const dataNode = document.querySelector("#railroad-era-data");
  if (dataNode?.textContent) {
    try {
      const parsed = JSON.parse(dataNode.textContent);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length === 4) ERAS = parsed;
    } catch {
      // The checked-in fallback keeps the room usable if the embedded data is unavailable.
    }
  }

  const YEARS = Object.keys(ERAS);
  const MAP_POSITIONS = {
    "1825": "translate(70 145)",
    "1869": "translate(350 162)",
    "1883": "translate(615 91)",
    "1964": "translate(930 125)",
  };
  const MAP_PROGRESS = { "1825": 100, "1869": 70, "1883": 38, "1964": 0 };

  const question = root.querySelector("#question");
  const voiceStatus = root.querySelector("[data-voice-status]");
  const speakButton = root.querySelector("[data-speak]");
  const travelButton = root.querySelector("[data-travel]");
  const hearButton = root.querySelector("[data-hear]");
  const stopVoiceButton = root.querySelector("[data-stop-voice]");
  const recognitionWindow = window;
  const Recognition = recognitionWindow.SpeechRecognition || recognitionWindow.webkitSpeechRecognition;

  let currentYear = "1883";
  let recognition = null;
  let recognitionGeneration = 0;
  let speaking = false;

  const remembered = (() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("pc:railroad-time:visited") || "[]");
      return new Set(Array.isArray(saved) ? saved.filter((year) => YEARS.includes(year)) : []);
    } catch {
      return new Set();
    }
  })();
  remembered.add(currentYear);

  function text(selector, value) {
    const node = root.querySelector(selector);
    if (node) node.textContent = value;
  }

  function normalize(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const GENERIC_ROUTING_KEYWORDS = new Set([
    "begin", "began", "beginning", "first", "origin", "built", "builder", "workers",
    "worker", "labor", "who made", "who did", "fast", "faster", "speed", "modern"
  ]);

  function keywordWeight(keyword) {
    if (GENERIC_ROUTING_KEYWORDS.has(keyword)) return 1;
    return keyword.includes(" ") ? 4 : 2;
  }

  function chooseEra(raw) {
    const value = normalize(raw);
    if (!value) return currentYear;

    const scored = YEARS.map((year) => {
      const era = ERAS[year];
      let score = value.includes(year) ? 9 : 0;
      for (const keyword of era.keywords) {
        if (value.includes(keyword)) score += keywordWeight(keyword);
      }
      return { year, score };
    }).sort((a, b) => b.score - a.score);

    if (scored[0].score > 0) return scored[0].year;
    return YEARS[(YEARS.indexOf(currentYear) + 1) % YEARS.length];
  }

  function contextualAnswer(era, rawQuestion) {
    const value = normalize(rawQuestion);
    let lead = "";
    if (/^who\b|who built|who made|people/.test(value)) lead = "Start with the people, not the machine. ";
    else if (/^why\b|how come|reason/.test(value)) lead = "The useful answer is about the system around the train. ";
    else if (/cost|harm|bad|lost|price/.test(value)) lead = "The gain and the cost belong in the same frame. ";
    else if (/first|begin|start/.test(value)) lead = "There was no single first—but this is a strong place to begin. ";
    else if (/future|today|now/.test(value)) lead = "To understand the present, this earlier agreement matters. ";
    return lead + era.answer;
  }

  function saveVisited() {
    try {
      sessionStorage.setItem("pc:railroad-time:visited", JSON.stringify([...remembered]));
    } catch {
      // The route remains fully usable when browser storage is unavailable.
    }
  }

  function updateMap(year) {
    root.querySelectorAll("[data-map-stop]").forEach((stop) => {
      const stopYear = stop.getAttribute("data-map-stop");
      stop.classList.toggle("is-visited", remembered.has(stopYear));
      stop.classList.toggle("is-current", stopYear === year);
    });
    const engine = root.querySelector("[data-map-engine]");
    if (engine) engine.setAttribute("transform", MAP_POSITIONS[year]);
    const progress = root.querySelector("[data-map-progress]");
    if (progress) progress.style.strokeDashoffset = String(MAP_PROGRESS[year]);
    text("[data-visited-count]", String(remembered.size));
  }

  function stopRecognition(message = "") {
    recognitionGeneration += 1;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Some browser implementations throw after natural completion.
      }
    }
    recognition = null;
    root.classList.remove("is-listening");
    speakButton.textContent = "● Tap to speak";
    if (message) voiceStatus.textContent = message;
  }

  function stopSpeech(message = "") {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speaking = false;
    if (message) voiceStatus.textContent = message;
  }

  function activateEra(year, rawQuestion = "", source = "station") {
    const era = ERAS[year] || ERAS["1883"];
    currentYear = year;
    remembered.add(year);
    saveVisited();
    stopSpeech();
    root.dataset.era = year;

    root.querySelectorAll("[data-scene]").forEach((scene) => {
      const active = scene.getAttribute("data-scene") === year;
      scene.classList.toggle("is-active", active);
      scene.setAttribute("aria-hidden", active ? "false" : "true");
    });

    root.querySelectorAll("[data-stop]").forEach((button) => {
      const active = button.getAttribute("data-stop") === year;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });

    text("[data-location]", era.location);
    text("[data-plate]", era.plate);
    text("[data-year]", year);
    text("[data-kicker]", era.kicker);
    text("[data-title]", era.title);
    text("[data-answer]", contextualAnswer(era, rawQuestion));
    text("[data-gain]", era.gain);
    text("[data-cost]", era.cost);
    text("[data-question]", `“${era.question}”`);

    const receipt = root.querySelector("[data-source]");
    const sourceUrl = typeof era.source === "string" ? era.source : era.source?.url;
    const sourceLabel = era.sourceLabel || era.source?.label || "Source";
    receipt.href = sourceUrl;
    receipt.textContent = `SOURCE RECEIPT · ${sourceLabel.toUpperCase()} ↗`;
    updateMap(year);

    if (source === "voice") {
      voiceStatus.textContent = `Heard “${rawQuestion.slice(0, 140)}” — the line moved to ${year}. Review the transcript, explore, or hear the answer.`;
    } else if (source === "question") {
      voiceStatus.textContent = `The line read your question and moved to ${year}.`;
    } else {
      voiceStatus.textContent = `Arrived at ${year}. Ask another question or choose another station.`;
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.querySelector(".story")?.animate(
        [
          { opacity: 0.42, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 460, easing: "cubic-bezier(.18,.75,.28,1)" }
      );
    }
  }

  function travelFromQuestion(source = "question") {
    const value = question.value.trim();
    if (!value) {
      voiceStatus.textContent = "Ask a question first, or choose one of the suggested questions.";
      question.focus();
      return;
    }
    activateEra(chooseEra(value), value, source);
  }

  function beginRecognition() {
    if (!Recognition) {
      voiceStatus.textContent = "Speech recognition is unavailable in this browser. Type a question instead.";
      return;
    }
    if (recognition) {
      stopRecognition("Listening stopped. You can edit the transcript, then travel with it.");
      return;
    }

    stopSpeech();
    recognitionGeneration += 1;
    const generation = recognitionGeneration;
    const active = new Recognition();
    recognition = active;
    active.continuous = false;
    active.interimResults = true;
    active.lang = document.documentElement.lang || navigator.language || "en-US";

    let finalText = "";
    active.onstart = () => {
      if (generation !== recognitionGeneration) return;
      root.classList.add("is-listening");
      speakButton.textContent = "■ Stop listening";
      voiceStatus.textContent = "Listening once… ask about a beginning, a builder, time, or speed.";
    };
    active.onresult = (event) => {
      if (generation !== recognitionGeneration) return;
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalText += transcript;
        else interim += transcript;
      }
      question.value = `${finalText}${interim}`.trim().slice(0, 500);
      if (interim) voiceStatus.textContent = `Listening… ${interim.slice(0, 120)}`;
    };
    active.onerror = (event) => {
      if (generation !== recognitionGeneration) return;
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      stopRecognition(denied
        ? "Microphone permission was not granted. Type a question instead."
        : "Voice input could not finish. Try again, or type your question.");
    };
    active.onend = () => {
      if (generation !== recognitionGeneration) return;
      recognition = null;
      root.classList.remove("is-listening");
      speakButton.textContent = "● Tap to speak";
      if (question.value.trim()) travelFromQuestion("voice");
      else voiceStatus.textContent = "I did not catch a question. Try once more or type it.";
    };

    try {
      active.start();
    } catch {
      recognition = null;
      root.classList.remove("is-listening");
      voiceStatus.textContent = "Speech recognition could not start. Type a question instead.";
    }
  }

  function readAnswer() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      voiceStatus.textContent = "Spoken playback is unavailable in this browser.";
      return;
    }
    stopRecognition();
    stopSpeech();
    const era = ERAS[currentYear];
    const visibleAnswer = root.querySelector("[data-answer]")?.textContent?.trim() || era.answer;
    const utterance = new SpeechSynthesisUtterance(
      `${era.title} ${visibleAnswer} ${era.question}`
    );
    utterance.lang = "en-US";
    utterance.rate = 0.94;
    utterance.pitch = 0.92;
    utterance.onstart = () => {
      speaking = true;
      voiceStatus.textContent = `Reading the ${currentYear} answer aloud.`;
    };
    utterance.onend = () => {
      speaking = false;
      voiceStatus.textContent = "Reading complete. Ask another question when you are ready.";
    };
    utterance.onerror = () => {
      speaking = false;
      voiceStatus.textContent = "Spoken playback stopped. The written answer is still here.";
    };
    window.speechSynthesis.speak(utterance);
  }

  root.querySelectorAll("[data-stop]").forEach((button) => {
    button.addEventListener("click", () => activateEra(button.getAttribute("data-stop"), "", "station"));
  });

  root.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => {
      question.value = button.getAttribute("data-example") || "";
      travelFromQuestion("question");
    });
  });

  travelButton.addEventListener("click", () => travelFromQuestion("question"));
  question.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") travelFromQuestion("question");
  });
  speakButton.addEventListener("click", beginRecognition);
  hearButton.addEventListener("click", readAnswer);
  stopVoiceButton.addEventListener("click", () => {
    stopRecognition();
    stopSpeech("Voice stopped. The written journey stays here.");
  });
  root.querySelector("[data-reset-route]")?.addEventListener("click", () => {
    remembered.clear();
    remembered.add("1883");
    question.value = "";
    saveVisited();
    activateEra("1883", "", "station");
    voiceStatus.textContent = "Route cleared. You are back at railway time; ask where to go next.";
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      stopRecognition();
      stopSpeech();
    }
  });
  window.addEventListener("pagehide", () => {
    stopRecognition();
    stopSpeech();
  });

  if (!Recognition) {
    speakButton.disabled = true;
    speakButton.textContent = "Speech unavailable";
    voiceStatus.textContent = "Speech recognition is unavailable in this browser. Type a question or choose a station.";
  }
  if (!("speechSynthesis" in window)) {
    hearButton.disabled = true;
    stopVoiceButton.disabled = true;
  }

  updateMap(currentYear);
})();
