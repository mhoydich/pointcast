(() => {
  "use strict";

  const W = 1280;
  const H = 720;
  const MAP_W = 24;
  const MAP_H = 18;
  const TILE_W = 64;
  const TILE_H = 32;
  const ORIGIN_X = 524;
  const ORIGIN_Y = 48;

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const minimap = document.querySelector("#minimapCanvas");
  const mctx = minimap.getContext("2d");

  const referenceScene = new Image();
  referenceScene.decoding = "async";
  referenceScene.src = "./assets/pointcast-rts-generated.png";

  const els = {
    wood: document.querySelector("#woodValue"),
    food: document.querySelector("#foodValue"),
    gold: document.querySelector("#goldValue"),
    stone: document.querySelector("#stoneValue"),
    signal: document.querySelector("#signalValue"),
    pop: document.querySelector("#popValue"),
    gameTitle: document.querySelector("#gameTitle"),
    missionCopy: document.querySelector(".mission-copy"),
    age: document.querySelector("#ageValue"),
    timer: document.querySelector("#timerValue"),
    wave: document.querySelector("#waveValue"),
    waveName: document.querySelector("#waveName"),
    threat: document.querySelector("#threatValue"),
    score: document.querySelector("#scoreValue"),
    missionRaid: document.querySelector("#missionRaidValue"),
    missionField: document.querySelector("#missionFieldValue"),
    missionRaiders: document.querySelector("#missionRaidersValue"),
    missionKeep: document.querySelector("#missionKeepValue"),
    missionProgressFill: document.querySelector("#missionProgressFill"),
    coachTitle: document.querySelector("#coachTitle"),
    coachText: document.querySelector("#coachText"),
    objectiveValue: document.querySelector("#objectiveValue"),
    objectiveText: document.querySelector("#objectiveText"),
    objectiveFill: document.querySelector("#objectiveFill"),
    selectedTitle: document.querySelector("#selectedTitle"),
    selectedDescription: document.querySelector("#selectedDescription"),
    selectedMeta: document.querySelector("#selectedMeta"),
    selectedHealthFill: document.querySelector("#selectedHealthFill"),
    eventLog: document.querySelector("#eventLog"),
    factionList: document.querySelector("#factionList"),
    overlay: document.querySelector("#gameOverlay"),
    overlayKicker: document.querySelector("#overlayKicker"),
    overlayTitle: document.querySelector("#overlayTitle"),
    overlayText: document.querySelector("#overlayText"),
    overlayAction: document.querySelector("#overlayAction"),
    broadcastPanel: document.querySelector("#broadcastPanel"),
    broadcastPlayer: document.querySelector("#broadcastPlayer"),
    broadcastTitle: document.querySelector("#broadcastTitle"),
    broadcastClose: document.querySelector("#broadcastClose"),
    broadcastTrackButtons: document.querySelectorAll("[data-track]"),
    pauseButton: document.querySelector("#pauseButton"),
    restartButton: document.querySelector("#restartButton"),
    modeButton: document.querySelector("#modeButton"),
    agentPlayerSelect: document.querySelector("#agentPlayerSelect"),
    commandButtons: document.querySelectorAll("[data-command]")
  };

  const BROADCAST_TRACKS = {
    jump: {
      title: "Jump Around",
      log: "Jump Around",
      url: "https://www.youtube.com/embed/XhzpxjuwZy0?autoplay=1&rel=0"
    },
    electric: {
      title: "Electric Relaxation",
      log: "Electric Relaxation",
      url: "https://www.youtube.com/embed/WHRnvjCkTsw?autoplay=1&rel=0"
    }
  };

  const MODE_CONFIG = {
    signal: {
      button: "CvC",
      title: "Signal Siege",
      eyebrow: "PointCast playable RTS prototype",
      mission: "Raise the local network, hold the coast, and outlast the syndicate raids.",
      objective: "Hold six raids",
      objectiveText: "Keep the PointCast Keep standing until the coast is clear.",
      keep: "PointCast Keep",
      victoryTitle: "The coast is live",
      victoryText: "PointCast held every raid and kept the shared signal online.",
      lostText: "The syndicate broke the local signal.",
      openingLogs: ["PointCast Keep online.", "Tokyo Syndicate activity spotted on the coast."]
    },
    cvc: {
      button: "CvC",
      title: "Claude vs Codex",
      eyebrow: "Competitive agent skirmish",
      mission: "Codex ships the local build while Claude raids with planning, jamming, and careful sabotage.",
      objective: "Out-code Claude",
      objectiveText: "Keep the Codex Keep standing through six Claude review raids.",
      keep: "Codex Keep",
      victoryTitle: "Codex merged clean",
      victoryText: "Codex held the build, broke Claude's review raids, and shipped the playable prototype.",
      lostText: "Claude's critique broke the local build before Codex could stabilize it.",
      openingLogs: ["Codex Keep online.", "Claude review agents detected at the edge of the repo."]
    }
  };

  const CVC_WAVE_NAMES = [
    "Claude Context Probe",
    "Sonnet Split Review",
    "Opus Shield Wall",
    "Prompt Harbor Rush",
    "Reviewer Siege Broadcast",
    "Final Merge Conflict"
  ];

  const CVC_ENEMY_NAMES = {
    scout: "Claude Scout",
    raider: "Review Raider",
    shield: "Opus Shield",
    runner: "Context Runner",
    jammer: "Token Jammer",
    saboteur: "Merge Saboteur",
    cart: "Regression Cart",
    captain: "Claude Captain"
  };

  const AGENT_PLAYERS = {
    human: { name: "Human", pace: 0 },
    manus: { name: "Manus", pace: 1.35, mode: "cvc", towerGoal: 3, crossbowGoal: 5, signalReserve: 70 },
    codex: { name: "Codex", pace: 1.1, mode: "cvc", towerGoal: 2, crossbowGoal: 6, signalReserve: 45 },
    claude: { name: "Claude", pace: 1.55, mode: "cvc", towerGoal: 4, crossbowGoal: 4, signalReserve: 95 },
    any: { name: "Any Agent", pace: 1.25, mode: "signal", towerGoal: 3, crossbowGoal: 5, signalReserve: 60 }
  };

  const BUILDINGS = {
    hq: {
      name: "PointCast Keep",
      w: 3,
      h: 3,
      maxHp: 2600,
      cap: 10,
      signal: 1.25,
      attack: 20,
      range: 5.5,
      rate: 1.15,
      color: "#8f948b",
      roof: "#2e9d59",
      desc: "Central command and village training."
    },
    house: {
      name: "Relay House",
      w: 2,
      h: 2,
      maxHp: 620,
      cap: 6,
      cost: { wood: 70 },
      color: "#936a43",
      roof: "#cf7b43",
      desc: "Raises population capacity."
    },
    farm: {
      name: "Signal Farm",
      w: 2,
      h: 2,
      maxHp: 520,
      food: 1.45,
      cost: { wood: 60 },
      color: "#5d7b37",
      roof: "#d6b65b",
      desc: "Adds steady food income."
    },
    kiosk: {
      name: "PointCast Kiosk",
      w: 2,
      h: 2,
      maxHp: 1160,
      cap: 4,
      signal: 2.5,
      cost: { wood: 120, stone: 80 },
      color: "#755c3e",
      roof: "#31a660",
      desc: "Expands the network and signal income."
    },
    tower: {
      name: "Signal Tower",
      w: 1,
      h: 1,
      maxHp: 760,
      attack: 36,
      range: 6.4,
      rate: 0.95,
      cost: { wood: 100, stone: 100 },
      color: "#9aa096",
      roof: "#38b76a",
      desc: "Automatically fires on raiders."
    },
    barracks: {
      name: "Cast Yard",
      w: 2,
      h: 2,
      maxHp: 980,
      cost: { wood: 160, gold: 70 },
      color: "#6b5844",
      roof: "#3b8c59",
      desc: "Trains crossbow crews."
    }
  };

  const UNIT_TYPES = {
    villager: {
      name: "Villager",
      maxHp: 90,
      speed: 1.65,
      range: 0.78,
      guardRange: 1.15,
      damage: 8,
      rate: 1.05,
      pop: 1,
      gather: 0.72,
      cost: { food: 50 },
      color: "#62c36c",
      desc: "Gathers resources and can hold a lane."
    },
    crossbow: {
      name: "Crossbowman",
      maxHp: 130,
      speed: 2.05,
      range: 5.3,
      guardRange: 6.1,
      damage: 32,
      rate: 1.05,
      pop: 1,
      cost: { food: 45, gold: 40 },
      color: "#49a8d5",
      desc: "Ranged unit with strong focus fire."
    }
  };

  const ENEMY_TYPES = {
    scout: {
      name: "Tokyo Scout",
      maxHp: 118,
      speed: 1.2,
      damage: 15,
      rate: 0.95,
      range: 0.78,
      score: 28,
      bounty: { gold: 5, signal: 3 },
      color: "#d75f53",
      accent: "#2b1b1a"
    },
    raider: {
      name: "Syndicate Raider",
      maxHp: 210,
      speed: 0.92,
      damage: 24,
      rate: 0.85,
      range: 0.82,
      score: 48,
      bounty: { gold: 8, signal: 5 },
      color: "#b84e69",
      accent: "#f1c165"
    },
    shield: {
      name: "Glock Shield",
      maxHp: 340,
      speed: 0.68,
      damage: 31,
      rate: 0.78,
      range: 0.86,
      score: 72,
      bounty: { gold: 11, stone: 4, signal: 7 },
      color: "#d9a842",
      accent: "#2c2d31"
    },
    runner: {
      name: "Westwatch Runner",
      maxHp: 92,
      speed: 1.72,
      damage: 13,
      rate: 1.1,
      range: 0.72,
      score: 36,
      bounty: { gold: 6, signal: 4 },
      color: "#9b5bd0",
      accent: "#f0d1ff"
    },
    jammer: {
      name: "Signal Jammer",
      maxHp: 260,
      speed: 0.72,
      damage: 10,
      rate: 1.15,
      range: 0.78,
      score: 92,
      bounty: { gold: 12, signal: 28 },
      color: "#24a6a8",
      accent: "#efff9c",
      signalJam: 0.44
    },
    saboteur: {
      name: "Keep Saboteur",
      maxHp: 160,
      speed: 1.58,
      damage: 38,
      rate: 0.72,
      range: 0.7,
      score: 86,
      bounty: { gold: 10, stone: 5, signal: 12 },
      color: "#e86f2f",
      accent: "#251510",
      rushKeep: true
    },
    cart: {
      name: "Siege Cart",
      maxHp: 680,
      speed: 0.42,
      damage: 58,
      rate: 0.55,
      range: 1,
      score: 150,
      bounty: { gold: 20, stone: 10, signal: 14 },
      color: "#5e5960",
      accent: "#e1c071"
    },
    captain: {
      name: "Syndicate Captain",
      maxHp: 1180,
      speed: 0.58,
      damage: 68,
      rate: 0.7,
      range: 1.05,
      score: 320,
      bounty: { gold: 40, stone: 20, signal: 28 },
      color: "#2c7256",
      accent: "#f2d56c"
    }
  };

  const WAVES = [
    {
      name: "Tokyo Probe",
      reward: { wood: 60, food: 40, signal: 45 },
      groups: [
        { at: 1, type: "scout", count: 4, gap: 2.5, edge: "east" },
        { at: 9, type: "runner", count: 2, gap: 2.2, edge: "north" }
      ]
    },
    {
      name: "Syndicate Split",
      reward: { wood: 80, gold: 35, signal: 60 },
      groups: [
        { at: 1, type: "scout", count: 4, gap: 1.8, edge: "east" },
        { at: 4, type: "jammer", count: 1, gap: 0, edge: "north" },
        { at: 6, type: "raider", count: 3, gap: 2.4, edge: "south" },
        { at: 11, type: "runner", count: 3, gap: 1.45, edge: "north" }
      ]
    },
    {
      name: "Glock Shield Wall",
      reward: { stone: 70, gold: 45, signal: 75 },
      groups: [
        { at: 1, type: "shield", count: 3, gap: 3.4, edge: "east" },
        { at: 4, type: "saboteur", count: 2, gap: 3.2, edge: "north" },
        { at: 8, type: "raider", count: 4, gap: 1.9, edge: "north" },
        { at: 14, type: "scout", count: 5, gap: 1.15, edge: "south" }
      ]
    },
    {
      name: "Harbor Rush",
      reward: { wood: 100, food: 70, signal: 90 },
      groups: [
        { at: 1, type: "runner", count: 5, gap: 1.1, edge: "south" },
        { at: 4, type: "saboteur", count: 3, gap: 2.8, edge: "east" },
        { at: 7, type: "jammer", count: 1, gap: 0, edge: "north" },
        { at: 10, type: "raider", count: 5, gap: 1.65, edge: "east" },
        { at: 17, type: "shield", count: 2, gap: 2.8, edge: "north" }
      ]
    },
    {
      name: "Siege Broadcast",
      reward: { stone: 100, gold: 80, signal: 110 },
      groups: [
        { at: 1, type: "cart", count: 2, gap: 6.2, edge: "east" },
        { at: 3, type: "jammer", count: 2, gap: 8, edge: "north" },
        { at: 5, type: "shield", count: 4, gap: 2.35, edge: "north" },
        { at: 11, type: "raider", count: 5, gap: 1.6, edge: "south" },
        { at: 17, type: "saboteur", count: 3, gap: 2.2, edge: "east" }
      ]
    },
    {
      name: "Final Relay Break",
      reward: { signal: 180 },
      groups: [
        { at: 1, type: "captain", count: 1, gap: 0, edge: "east" },
        { at: 3, type: "jammer", count: 2, gap: 9, edge: "north" },
        { at: 5, type: "cart", count: 2, gap: 5.8, edge: "north" },
        { at: 8, type: "shield", count: 5, gap: 2.05, edge: "south" },
        { at: 12, type: "saboteur", count: 4, gap: 2, edge: "east" },
        { at: 16, type: "runner", count: 8, gap: 1, edge: "east" },
        { at: 23, type: "raider", count: 6, gap: 1.45, edge: "north" }
      ]
    }
  ];

  const BUILD_COMMANDS = new Map([
    ["build-house", "house"],
    ["build-farm", "farm"],
    ["build-kiosk", "kiosk"],
    ["build-tower", "tower"],
    ["build-barracks", "barracks"]
  ]);

  let state;
  let gameMode = "signal";
  let agentPlayer = "human";
  let lastFrame = performance.now();
  let dpr = 1;

  function configureCanvas(target, context, width, height) {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    target.width = Math.round(width * dpr);
    target.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function modeConfig() {
    return MODE_CONFIG[gameMode] || MODE_CONFIG.signal;
  }

  function isCvcMode() {
    return gameMode === "cvc";
  }

  function enemyName(type) {
    return isCvcMode() ? CVC_ENEMY_NAMES[type] || ENEMY_TYPES[type].name : ENEMY_TYPES[type].name;
  }

  function waveName(index = state?.waveIndex || 0) {
    if (isCvcMode()) return CVC_WAVE_NAMES[index] || "Merged";
    return WAVES[index]?.name || "Coast Clear";
  }

  function resetGame() {
    state = {
      nextId: 1,
      mode: gameMode,
      agentPlayer,
      agentCooldown: 1,
      time: 0,
      score: 0,
      paused: false,
      awaitingStart: true,
      gameOver: false,
      victory: false,
      resources: { wood: 520, food: 420, gold: 260, stone: 250, signal: 130 },
      buildings: [],
      units: [],
      enemies: [],
      projectiles: [],
      particles: [],
      floaters: [],
      pings: [],
      resourceNodes: [],
      spawnQueue: [],
      broadcastOpen: false,
      broadcastTrack: "jump",
      waveIndex: 0,
      waveActive: false,
      waveClock: 0,
      nextWaveTimer: 22,
      activeCommand: "select",
      selected: null,
      hoverTile: null,
      logs: [],
      keepWarningLevel: 0
    };

    seedResourceNodes();
    const keep = addBuilding("hq", 9, 8);
    addBuilding("house", 6, 11);
    addBuilding("farm", 4, 12);
    addBuilding("kiosk", 13, 10);
    addBuilding("barracks", 14, 5);
    addBuilding("tower", 18, 7);

    addUnit("villager", 10.6, 12.5, { job: "wood" });
    addUnit("villager", 7.9, 13.1, { job: "food" });
    addUnit("villager", 12.8, 11.6, { job: "gold" });
    addUnit("villager", 13.7, 12.8, { job: "stone" });
    addUnit("crossbow", 17.1, 8.2, { guard: true });
    addUnit("crossbow", 16.2, 9.2, { guard: true });

    state.selected = { kind: "building", id: keep.id };
    modeConfig().openingLogs.forEach((message) => addLog(message));
    hideOverlay();
    els.pauseButton.textContent = "Pause";
    updateUI();
  }

  function seedResourceNodes() {
    const nodes = [
      { type: "wood", x: 2.2, y: 2.4, amount: 900 },
      { type: "wood", x: 3.4, y: 5.8, amount: 900 },
      { type: "food", x: 5.6, y: 13.6, amount: 760 },
      { type: "food", x: 2.4, y: 12.8, amount: 760 },
      { type: "gold", x: 13.4, y: 2.6, amount: 620 },
      { type: "gold", x: 20.5, y: 10.6, amount: 620 },
      { type: "stone", x: 17.2, y: 3.8, amount: 780 },
      { type: "stone", x: 6.2, y: 6.3, amount: 780 }
    ];

    state.resourceNodes = nodes.map((node) => ({
      ...node,
      id: state.nextId++,
      pulse: Math.random() * 10
    }));
  }

  function addBuilding(type, x, y, options = {}) {
    const spec = BUILDINGS[type];
    const building = {
      id: state.nextId++,
      kind: "building",
      type,
      x,
      y,
      w: spec.w,
      h: spec.h,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      attackTimer: 0,
      live: Boolean(options.live)
    };
    state.buildings.push(building);
    return building;
  }

  function addUnit(type, x, y, options = {}) {
    const spec = UNIT_TYPES[type];
    const unit = {
      id: state.nextId++,
      kind: "unit",
      type,
      x,
      y,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      attackTimer: 0,
      order: defaultUnitOrder(type, options),
      job: options.job || "wood",
      workTimer: 0,
      live: Boolean(options.live),
      selectedPulse: Math.random() * Math.PI * 2
    };
    state.units.push(unit);
    return unit;
  }

  function defaultUnitOrder(type, options = {}) {
    if (type !== "crossbow" || options.guard === false) return null;
    const keep = state.buildings.find((building) => building.type === "hq");
    if (!keep) return null;
    const point = guardPoint(state.units.filter((unit) => unit.type === "crossbow").length);
    return { type: "guard", x: point.x, y: point.y };
  }

  function guardPoint(index) {
    const keep = state.buildings.find((building) => building.type === "hq");
    const center = keep ? buildingCenter(keep) : { x: 10, y: 9 };
    return {
      x: center.x + 1.45 + (index % 4) * 0.42,
      y: center.y - 1.18 + Math.floor(index / 4) * 0.42
    };
  }

  function spawnEnemy(type, edge) {
    const spec = ENEMY_TYPES[type];
    const spawn = spawnPoint(edge);
    const enemy = {
      id: state.nextId++,
      kind: "enemy",
      type,
      x: spawn.x,
      y: spawn.y,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      attackTimer: 0,
      slowTime: 0,
      slowFactor: 1,
      wobble: Math.random() * Math.PI * 2
    };
    state.enemies.push(enemy);
    addPing(enemy.x, enemy.y, ENEMY_TYPES[type].color, 1.8, type === "jammer" || type === "saboteur" ? type : "spawn");
    announceEnemySpawn(type);
  }

  function announceEnemySpawn(type) {
    if (type === "jammer") {
      addLog(isCvcMode() ? "Token Jammer entered the diff. Signal income reduced." : "Signal Jammer entered the field. Signal income reduced.");
      return;
    }
    if (type === "saboteur") {
      addLog(isCvcMode() ? "Merge Saboteur breaking toward the Codex Keep." : "Keep Saboteur breaking toward the Keep.");
      return;
    }
    if (type === "cart") {
      addLog(isCvcMode() ? "Regression Cart spotted. Towers are prioritizing it." : "Siege Cart spotted. Towers are prioritizing it.");
      return;
    }
    if (type === "captain") {
      addLog(isCvcMode() ? "Claude Captain begins the final review broadcast." : "Final captain broadcast begins.");
    }
  }

  function spawnPoint(edge) {
    if (edge === "north") {
      return { x: 12 + Math.random() * 8, y: -1.4 };
    }
    if (edge === "south") {
      return { x: 19 + Math.random() * 3, y: 17.8 };
    }
    return { x: 24.8, y: 5 + Math.random() * 8 };
  }

  function startWave(manual) {
    if (state.waveActive || state.gameOver || state.victory) return;
    const wave = WAVES[state.waveIndex];
    if (!wave) return;
    const rushBonus = !state.awaitingStart && manual ? Math.max(0, Math.ceil(state.nextWaveTimer)) * 2 : 0;

    state.awaitingStart = false;
    state.waveActive = true;
    state.waveClock = 0;
    state.spawnQueue = [];
    wave.groups.forEach((group) => {
      for (let i = 0; i < group.count; i += 1) {
        state.spawnQueue.push({
          time: group.at + i * group.gap,
          type: group.type,
          edge: group.edge
        });
      }
    });
    state.spawnQueue.sort((a, b) => a.time - b.time);
    if (rushBonus) {
      state.score += rushBonus;
      state.resources.signal += Math.ceil(rushBonus / 2);
      addLog(`Early start bonus: +${rushBonus} score.`);
    }
    hideOverlay();
    addLog(`${manual ? "Manual" : "Auto"} raid started: ${waveName(state.waveIndex)}.`);
  }

  function updateGame(dt) {
    state.time += dt;

    updateEconomy(dt);
    updateBuildings(dt);
    updateUnits(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateWave(dt);
    updateAgentPlayer(dt);
    cleanupDead();
    checkEndState();
  }

  function updateEconomy(dt) {
    const signalMultiplier = signalIncomeMultiplier();
    state.buildings.forEach((building) => {
      const spec = BUILDINGS[building.type];
      if (spec.signal) state.resources.signal += spec.signal * signalMultiplier * dt;
      if (spec.food) state.resources.food += spec.food * dt;
    });

    state.units.forEach((unit) => {
      if (unit.type !== "villager" || unit.order) return;
      const spec = UNIT_TYPES.villager;
      const node = nearestResourceNode(unit.job, unit);
      if (!node) return;
      const arrived = moveToward(unit, node, spec.speed * 0.72, dt);
      if (arrived || dist(unit, node) < 0.36) {
        state.resources[unit.job] += spec.gather * dt;
        node.pulse += dt * 7;
        unit.workTimer -= dt;
        if (unit.workTimer <= 0) {
          unit.workTimer = 1.25 + Math.random() * 0.6;
          addFloater(`+${unit.job[0].toUpperCase()}`, unit.x, unit.y, resourceColor(unit.job));
        }
      }
    });
  }

  function signalIncomeMultiplier() {
    const jammerCount = state.enemies.filter((enemy) => enemy.type === "jammer").length;
    if (!jammerCount) return 1;
    return Math.max(0.22, 1 - jammerCount * ENEMY_TYPES.jammer.signalJam);
  }

  function updateBuildings(dt) {
    state.buildings.forEach((building) => {
      const spec = BUILDINGS[building.type];
      if (!spec.attack) return;
      building.attackTimer -= dt;
      const target = priorityEnemy(buildingCenter(building), spec.range, ["cart", "saboteur", "jammer"]);
      if (target && building.attackTimer <= 0) {
        building.attackTimer = spec.rate;
        const center = buildingCenter(building);
        fireProjectile(center, target, spec.attack, "#8ce0a7", 7.8, { kind: "tower" });
        addPing(target.x, target.y, "#8ce0a7", 0.55, "hit");
      }
    });
  }

  function updateUnits(dt) {
    state.units.forEach((unit) => {
      const spec = UNIT_TYPES[unit.type];
      unit.attackTimer -= dt;

      if (unit.order?.type === "move") {
        const arrived = moveToward(unit, unit.order, spec.speed, dt);
        if (arrived) unit.order = null;
      }

      if (unit.order?.type === "guard") {
        const target = priorityEnemy(unit, spec.guardRange + 3.2, ["saboteur", "jammer", "runner"]);
        if (target && dist(unit, target) <= spec.range) {
          attackEnemy(unit, target, spec);
          return;
        }
        if (target && dist(unit, target) > spec.range) {
          moveToward(unit, target, spec.speed * 0.82, dt);
          return;
        }
        if (dist(unit, unit.order) > 0.42) {
          moveToward(unit, unit.order, spec.speed * 0.7, dt);
        }
        return;
      }

      if (unit.order?.type === "attack") {
        const target = findEnemy(unit.order.targetId);
        if (!target) {
          unit.order = null;
        } else {
          const range = spec.range;
          const distance = dist(unit, target);
          if (distance > range * 0.92) {
            moveToward(unit, target, spec.speed, dt);
          } else {
            attackEnemy(unit, target, spec);
          }
        }
        return;
      }

      const target = priorityEnemy(unit, spec.guardRange, ["saboteur", "jammer"]);
      if (target && dist(unit, target) <= spec.range) {
        attackEnemy(unit, target, spec);
      }
    });
  }

  function attackEnemy(unit, target, spec) {
    if (unit.attackTimer > 0) return;
    unit.attackTimer = spec.rate;
    if (unit.type === "crossbow") {
      fireProjectile(unit, target, spec.damage, "#66c7ea", 8.6);
    } else {
      damageEnemy(target, spec.damage);
      addParticle(unit.x, unit.y, "#b7f0a5", 6);
    }
  }

  function updateEnemies(dt) {
    state.enemies.forEach((enemy) => {
      const spec = ENEMY_TYPES[enemy.type];
      enemy.attackTimer -= dt;
      if (enemy.slowTime > 0) {
        enemy.slowTime -= dt;
        if (enemy.slowTime <= 0) enemy.slowFactor = 1;
      }

      const target = enemyTarget(enemy);
      if (!target) return;

      const point = target.kind === "building" ? buildingCenter(target) : target;
      const distance = dist(enemy, point);
      const attackDistance = target.kind === "building"
        ? Math.max(spec.range, Math.min(target.w, target.h) * 0.55)
        : spec.range;

      if (distance <= attackDistance) {
        if (enemy.attackTimer <= 0) {
          enemy.attackTimer = spec.rate;
          damageFriendly(target, spec.damage);
          addParticle(enemy.x, enemy.y, spec.color, 8);
          const point = target.kind === "building" ? buildingCenter(target) : target;
          addPing(point.x, point.y, "#ff806f", 0.82, "hit");
        }
      } else {
        moveToward(enemy, point, spec.speed * enemy.slowFactor, dt);
      }
    });
  }

  function updateProjectiles(dt) {
    state.projectiles.forEach((projectile) => {
      const target = findEnemy(projectile.targetId);
      if (!target) {
        projectile.dead = true;
        return;
      }

      const distance = dist(projectile, target);
      if (distance <= projectile.speed * dt + 0.08) {
        damageEnemy(target, projectile.damage);
        addParticle(target.x, target.y, projectile.color, 8);
        projectile.dead = true;
        return;
      }

      projectile.x += ((target.x - projectile.x) / distance) * projectile.speed * dt;
      projectile.y += ((target.y - projectile.y) / distance) * projectile.speed * dt;
    });
    state.projectiles = state.projectiles.filter((projectile) => !projectile.dead);
  }

  function updateParticles(dt) {
    state.particles.forEach((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.size *= 0.985;
    });
    state.floaters.forEach((floater) => {
      floater.life -= dt;
      floater.y -= dt * 0.46;
    });
    state.pings.forEach((ping) => {
      ping.life -= dt;
      ping.radius += dt * ping.growth;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.floaters = state.floaters.filter((floater) => floater.life > 0);
    state.pings = state.pings.filter((ping) => ping.life > 0);
  }

  function updateWave(dt) {
    if (state.awaitingStart || state.gameOver || state.victory) return;

    if (!state.waveActive) {
      state.nextWaveTimer -= dt;
      if (state.nextWaveTimer <= 0) startWave(false);
      return;
    }

    state.waveClock += dt;
    while (state.spawnQueue.length && state.spawnQueue[0].time <= state.waveClock) {
      const event = state.spawnQueue.shift();
      spawnEnemy(event.type, event.edge);
    }

    if (!state.spawnQueue.length && !state.enemies.length) {
      const wave = WAVES[state.waveIndex];
      applyReward(wave.reward);
      addLog(`${waveName(state.waveIndex)} cleared. Supplies recovered.`);
      state.waveIndex += 1;
      state.waveActive = false;
      state.nextWaveTimer = state.waveIndex >= WAVES.length ? 0 : nextRaidDelay();
      if (state.waveIndex < WAVES.length) {
        addLog(`Next raid in ${state.nextWaveTimer}s. Start early for a signal bonus.`);
      }
    }
  }

  function updateAgentPlayer(dt) {
    const agent = AGENT_PLAYERS[agentPlayer] || AGENT_PLAYERS.human;
    if (!agent.pace || state.gameOver || state.victory || state.paused) return;
    state.agentCooldown -= dt;
    if (state.agentCooldown > 0) return;
    state.agentCooldown = agent.pace;

    const crossbows = state.units.filter((unit) => unit.type === "crossbow").length;
    const towers = state.buildings.filter((building) => building.type === "tower").length;

    if (state.waveActive && state.enemies.length >= 4 && state.resources.signal >= 120 + agent.signalReserve) {
      castSignalPulse();
      return;
    }
    if (state.waveActive && state.enemies.length && crossbows && state.resources.signal >= 80 + Math.floor(agent.signalReserve / 2)) {
      castVolley();
      return;
    }
    if (state.waveActive && crossbows) {
      guardKeep();
      return;
    }
    if (crossbows < agent.crossbowGoal && canAfford(UNIT_TYPES.crossbow.cost) && state.buildings.some((building) => building.type === "barracks") && recomputePopulation().pop < recomputePopulation().cap) {
      trainUnit("crossbow");
      return;
    }
    if (towers < agent.towerGoal && canAfford(BUILDINGS.tower.cost)) {
      autoPlaceBuilding("tower");
      return;
    }
    if (!state.waveActive && !state.awaitingStart && state.nextWaveTimer > 4) {
      startWave(true);
      return;
    }
    if (state.awaitingStart) startWave(true);
  }

  function autoPlaceBuilding(type) {
    const spec = BUILDINGS[type];
    const candidates = [
      { x: 17, y: 6 },
      { x: 15, y: 9 },
      { x: 19, y: 10 },
      { x: 12, y: 6 },
      { x: 20, y: 5 }
    ];
    const spot = candidates.find((tile) => canPlace(type, tile.x, tile.y));
    if (!spot || !spend(spec.cost)) return false;
    const building = addBuilding(type, spot.x, spot.y, { live: true });
    state.selected = { kind: "building", id: building.id };
    addLog(`${AGENT_PLAYERS[agentPlayer].name} built ${spec.name}.`);
    return true;
  }

  function cleanupDead() {
    state.units = state.units.filter((unit) => unit.hp > 0);
    state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
    const before = state.buildings.length;
    state.buildings = state.buildings.filter((building) => building.hp > 0);
    if (before !== state.buildings.length) recomputePopulation();
  }

  function checkEndState() {
    const keep = state.buildings.find((building) => building.type === "hq");
    if (!keep && !state.gameOver) {
      state.gameOver = true;
      showOverlay("Network Lost", "The Keep fell", modeConfig().lostText, "Restart");
      addLog(`${modeConfig().keep} has fallen.`);
    }

    if (!state.victory && state.waveIndex >= WAVES.length && !state.waveActive && !state.enemies.length && keep) {
      state.victory = true;
      state.resources.signal += 250;
      showOverlay("Victory", modeConfig().victoryTitle, modeConfig().victoryText, "Play Again");
      addLog(isCvcMode() ? "Victory: Codex merged the build." : "Victory: the PointCast network holds.");
    }
  }

  function nextRaidDelay() {
    return Math.max(10, 20 - state.waveIndex * 2);
  }

  function fireProjectile(from, target, damage, color, speed, options = {}) {
    state.projectiles.push({
      x: from.x,
      y: from.y,
      targetId: target.id,
      damage,
      color,
      speed,
      kind: options.kind || "bolt"
    });
  }

  function enemyTarget(enemy) {
    if (ENEMY_TYPES[enemy.type].rushKeep) {
      return state.buildings.find((building) => building.type === "hq") || nearestEntity(enemy, state.buildings);
    }

    const nearbyUnit = nearestFriendlyUnit(enemy, 1.35);
    if (nearbyUnit) return nearbyUnit;

    const keep = state.buildings.find((building) => building.type === "hq");
    const towers = state.buildings.filter((building) => building.type === "tower");
    const priority = [...towers, keep].filter(Boolean);
    const targets = priority.length ? priority : state.buildings;
    return nearestEntity(enemy, targets);
  }

  function damageFriendly(target, amount) {
    if (target.hp <= 0) return;
    target.hp -= amount;
    const name = target.kind === "building" ? (target.type === "hq" ? modeConfig().keep : BUILDINGS[target.type].name) : UNIT_TYPES[target.type].name;
    if (target.kind === "building" && target.type === "hq") {
      const pct = target.hp / target.maxHp;
      const warningLevel = pct <= 0.25 ? 3 : pct <= 0.5 ? 2 : pct <= 0.75 ? 1 : 0;
      if (warningLevel > state.keepWarningLevel) {
        state.keepWarningLevel = warningLevel;
        addLog(`Warning: Keep integrity at ${Math.max(0, Math.ceil(pct * 100))}%.`);
      }
      addFloater(`-${Math.ceil(amount)}`, buildingCenter(target).x, buildingCenter(target).y, "#ff806f");
    }
    if (target.hp <= 0) addLog(`${name} destroyed.`);
  }

  function damageEnemy(enemy, amount) {
    if (enemy.hp <= 0) return;
    enemy.hp -= amount;
    if (enemy.hp <= 0) {
      const spec = ENEMY_TYPES[enemy.type];
      state.score += spec.score;
      applyReward(spec.bounty);
      addFloater(`+${spec.score}`, enemy.x, enemy.y, "#f4cf6b");
      for (let i = 0; i < 7; i += 1) addParticle(enemy.x, enemy.y, spec.color, 7);
      addPing(enemy.x, enemy.y, "#f4cf6b", 1.1, "score");
    }
  }

  function applyReward(reward = {}) {
    Object.entries(reward).forEach(([key, value]) => {
      state.resources[key] += value;
    });
  }

  function nearestResourceNode(type, unit) {
    const nodes = state.resourceNodes.filter((node) => node.type === type);
    return nearestEntity(unit, nodes);
  }

  function nearestEnemy(origin, range = Infinity) {
    let best = null;
    let bestDistance = range;
    state.enemies.forEach((enemy) => {
      const distance = dist(origin, enemy);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    });
    return best;
  }

  function priorityEnemy(origin, range = Infinity, priority = []) {
    let best = null;
    let bestRank = Infinity;
    let bestDistance = range;
    let bestHp = -Infinity;
    state.enemies.forEach((enemy) => {
      const distance = dist(origin, enemy);
      if (distance > range) return;
      const rank = priority.includes(enemy.type) ? priority.indexOf(enemy.type) : priority.length;
      const strongerSameRank = rank === bestRank && enemy.hp > bestHp && priority.length > 1;
      const closerSameRank = rank === bestRank && !strongerSameRank && distance < bestDistance;
      if (!best || rank < bestRank || strongerSameRank || closerSameRank) {
        best = enemy;
        bestRank = rank;
        bestDistance = distance;
        bestHp = enemy.hp;
      }
    });
    return best;
  }

  function nearestFriendlyUnit(origin, range = Infinity) {
    let best = null;
    let bestDistance = range;
    state.units.forEach((unit) => {
      const distance = dist(origin, unit);
      if (distance < bestDistance) {
        best = unit;
        bestDistance = distance;
      }
    });
    return best;
  }

  function nearestEntity(origin, entities) {
    let best = null;
    let bestDistance = Infinity;
    entities.forEach((entity) => {
      if (!entity) return;
      const point = entity.kind === "building" ? buildingCenter(entity) : entity;
      const distance = dist(origin, point);
      if (distance < bestDistance) {
        best = entity;
        bestDistance = distance;
      }
    });
    return best;
  }

  function findEnemy(id) {
    return state.enemies.find((enemy) => enemy.id === id);
  }

  function findUnit(id) {
    return state.units.find((unit) => unit.id === id);
  }

  function findBuilding(id) {
    return state.buildings.find((building) => building.id === id);
  }

  function selectedEntity() {
    if (!state.selected) return null;
    if (state.selected.kind === "unit") return findUnit(state.selected.id);
    if (state.selected.kind === "building") return findBuilding(state.selected.id);
    if (state.selected.kind === "enemy") return findEnemy(state.selected.id);
    return null;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function moveToward(entity, target, speed, dt) {
    const distance = dist(entity, target);
    if (distance < 0.08) return true;
    const step = Math.min(distance, speed * dt);
    entity.x += ((target.x - entity.x) / distance) * step;
    entity.y += ((target.y - entity.y) / distance) * step;
    entity.x = clamp(entity.x, -1.5, MAP_W + 1.5);
    entity.y = clamp(entity.y, -1.5, MAP_H + 1.5);
    return distance <= step + 0.08;
  }

  function buildingCenter(building) {
    return {
      x: building.x + building.w / 2,
      y: building.y + building.h / 2
    };
  }

  function recomputePopulation() {
    const cap = state.buildings.reduce((sum, building) => sum + (BUILDINGS[building.type].cap || 0), 0);
    const pop = state.units.reduce((sum, unit) => sum + UNIT_TYPES[unit.type].pop, 0);
    return { pop, cap };
  }

  function commandCost(command) {
    if (BUILD_COMMANDS.has(command)) return BUILDINGS[BUILD_COMMANDS.get(command)].cost || {};
    if (command === "train-villager") return UNIT_TYPES.villager.cost;
    if (command === "train-crossbow") return UNIT_TYPES.crossbow.cost;
    if (command === "signal-pulse") return { signal: 120 };
    if (command === "volley") return { signal: 80 };
    if (command === "repair") return { wood: 45, stone: 25 };
    return {};
  }

  function canAfford(cost = {}) {
    return Object.entries(cost).every(([key, value]) => state.resources[key] >= value);
  }

  function spend(cost = {}) {
    if (!canAfford(cost)) return false;
    Object.entries(cost).forEach(([key, value]) => {
      state.resources[key] -= value;
    });
    return true;
  }

  function handleCommand(command) {
    if (state.gameOver || state.victory) {
      if (command === "start-wave") resetGame();
      return;
    }

    if (BUILD_COMMANDS.has(command)) {
      state.activeCommand = command;
      state.selected = null;
      addLog(`${BUILDINGS[BUILD_COMMANDS.get(command)].name} placement armed.`);
      updateUI();
      return;
    }

    if (command === "select") {
      state.activeCommand = "select";
      updateUI();
      return;
    }

    if (command === "army") {
      state.activeCommand = "select";
      state.selected = { kind: "group", id: "army" };
      addLog("Field army selected.");
      updateUI();
      return;
    }

    if (command === "rally") {
      rallyArmy();
      return;
    }

    if (command === "guard") {
      guardKeep();
      return;
    }

    if (command === "volley") {
      castVolley();
      return;
    }

    if (command === "repair") {
      repairSelected();
      return;
    }

    if (command === "train-villager") {
      trainUnit("villager");
      return;
    }

    if (command === "train-crossbow") {
      trainUnit("crossbow");
      return;
    }

    if (command === "signal-pulse") {
      castSignalPulse();
      return;
    }

    if (command === "jump-broadcast") {
      toggleBroadcast();
      return;
    }

    if (command === "start-wave") {
      startWave(true);
    }
  }

  function toggleBroadcast(forceOpen, track = state.broadcastTrack) {
    const wasOpen = state.broadcastOpen;
    const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !state.broadcastOpen;
    state.broadcastTrack = track;
    state.broadcastOpen = shouldOpen;
    els.broadcastPanel.hidden = !shouldOpen;
    const broadcast = BROADCAST_TRACKS[state.broadcastTrack] || BROADCAST_TRACKS.jump;
    els.broadcastTitle.textContent = broadcast.title;
    els.broadcastPlayer.title = `Poor Prompting Radio - ${broadcast.title}`;
    els.broadcastPlayer.src = shouldOpen ? broadcast.url : "about:blank";
    if (shouldOpen && !wasOpen) {
      state.resources.signal += 25;
      addLog(`Poor Prompting Radio: ${broadcast.log} broadcast is live.`);
      addLog("Morale boost: +25 signal.");
    } else if (shouldOpen) {
      addLog(`Poor Prompting Radio switched to ${broadcast.log}.`);
    } else {
      addLog("Poor Prompting Radio closed.");
    }
    updateUI();
  }

  function trainUnit(type) {
    const spec = UNIT_TYPES[type];
    const pop = recomputePopulation();
    if (pop.pop + spec.pop > pop.cap) {
      addLog("Population cap reached.");
      return;
    }

    const trainer = type === "villager"
      ? state.buildings.find((building) => building.type === "hq")
      : state.buildings.find((building) => building.type === "barracks");

    if (!trainer) {
      addLog(type === "villager" ? "The Keep is missing." : "Build a Cast Yard first.");
      return;
    }

    if (!spend(spec.cost)) {
      addLog("Not enough resources.");
      return;
    }

    const center = buildingCenter(trainer);
    const unit = addUnit(type, center.x + 0.4 + Math.random() * 0.5, center.y + 0.5 + Math.random() * 0.5, {
      job: nextVillagerJob(),
      live: true,
      guard: type === "crossbow"
    });
    state.selected = { kind: "unit", id: unit.id };
    state.activeCommand = "select";
    addLog(`${spec.name} trained.`);
  }

  function nextVillagerJob() {
    const jobs = ["wood", "food", "gold", "stone"];
    const count = state.units.filter((unit) => unit.type === "villager").length;
    return jobs[count % jobs.length];
  }

  function rallyArmy() {
    const keep = state.buildings.find((building) => building.type === "hq");
    if (!keep) return;
    const center = buildingCenter(keep);
    state.units.forEach((unit, index) => {
      if (unit.type !== "crossbow") return;
      unit.order = {
        type: "move",
        x: center.x + 2.6 + (index % 3) * 0.45,
        y: center.y - 0.8 + Math.floor(index / 3) * 0.45
      };
    });
    state.selected = { kind: "group", id: "army" };
    addLog("Army rallied to the Keep.");
  }

  function guardKeep() {
    const keep = state.buildings.find((building) => building.type === "hq");
    if (!keep) return;
    const center = buildingCenter(keep);
    const army = state.units.filter((unit) => unit.type === "crossbow");
    army.forEach((unit, index) => {
      const point = guardPoint(index);
      unit.order = { type: "guard", x: point.x, y: point.y };
    });
    state.selected = { kind: "group", id: "army" };
    addLog(`${army.length} crossbow crew${army.length === 1 ? "" : "s"} guarding the Keep.`);
  }

  function castVolley() {
    const army = state.units.filter((unit) => unit.type === "crossbow");
    if (!army.length) {
      addLog("Train crossbow crews before calling Volley.");
      return;
    }
    if (!state.enemies.length) {
      addLog("No raiders marked for Volley.");
      return;
    }
    if (!spend(commandCost("volley"))) {
      addLog("Not enough signal for Volley.");
      return;
    }

    army.forEach((unit, index) => {
      const target = priorityEnemy(unit, 9, ["jammer", "saboteur", "cart"]) || state.enemies[index % state.enemies.length];
      if (!target) return;
      fireProjectile(unit, target, 52, "#f3d46a", 12.2, { kind: "volley" });
      addPing(target.x, target.y, "#f3d46a", 1.05, "volley");
      addFloater("VOLLEY", target.x, target.y, "#f3d46a");
    });
    addLog(`Volley fired by ${army.length} crossbow crew${army.length === 1 ? "" : "s"}.`);
  }

  function repairSelected() {
    const entity = selectedEntity();
    if (!entity || entity.kind !== "building") {
      addLog("Select a damaged building first.");
      return;
    }
    if (entity.hp >= entity.maxHp) {
      addLog("Selected building is already repaired.");
      return;
    }
    if (!spend(commandCost("repair"))) {
      addLog("Not enough wood and stone for repair.");
      return;
    }
    entity.hp = Math.min(entity.maxHp, entity.hp + 420);
    addLog(`${entity.type === "hq" ? modeConfig().keep : BUILDINGS[entity.type].name} repaired.`);
  }

  function castSignalPulse() {
    if (!state.enemies.length) {
      addLog("No raiders in signal range.");
      return;
    }
    if (!spend(commandCost("signal-pulse"))) {
      addLog("Not enough signal for a pulse.");
      return;
    }

    state.enemies.forEach((enemy) => {
      damageEnemy(enemy, 90);
      enemy.slowTime = 4.5;
      enemy.slowFactor = 0.45;
      for (let i = 0; i < 4; i += 1) addParticle(enemy.x, enemy.y, "#7ed7ff", 9);
      addPing(enemy.x, enemy.y, "#7ed7ff", 0.9, "pulse");
    });
    addLog("Signal pulse fired across the network.");
  }

  function placeBuilding(tile) {
    const type = BUILD_COMMANDS.get(state.activeCommand);
    if (!type) return;
    const spec = BUILDINGS[type];
    const x = Math.floor(tile.x - spec.w / 2);
    const y = Math.floor(tile.y - spec.h / 2);

    if (!canPlace(type, x, y)) {
      addLog("That ground is blocked.");
      return;
    }
    if (!spend(spec.cost)) {
      addLog("Not enough resources.");
      return;
    }

    const building = addBuilding(type, x, y, { live: true });
    state.selected = { kind: "building", id: building.id };
    state.activeCommand = "select";
    addLog(`${spec.name} built.`);
  }

  function canPlace(type, x, y) {
    const spec = BUILDINGS[type];
    if (x < 0 || y < 0 || x + spec.w > MAP_W || y + spec.h > MAP_H) return false;
    for (let tx = x; tx < x + spec.w; tx += 1) {
      for (let ty = y; ty < y + spec.h; ty += 1) {
        if (isWaterTile(tx, ty)) return false;
      }
    }
    const footprint = { x, y, w: spec.w, h: spec.h };
    return !state.buildings.some((building) => rectsOverlap(footprint, building));
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function handleCanvasPointer(event) {
    state.hoverTile = screenToWorld(pointerPosition(event));
  }

  function handleCanvasClick(event) {
    const point = pointerPosition(event);
    const tile = screenToWorld(point);

    if (BUILD_COMMANDS.has(state.activeCommand)) {
      placeBuilding(tile);
      updateUI();
      return;
    }

    const hit = pickEntity(point, tile);
    if (hit) {
      if (hit.kind === "enemy" && canCommandSelectedArmy()) {
        orderSelectedAttack(hit.id);
      } else {
        state.selected = { kind: hit.kind, id: hit.id };
        state.activeCommand = "select";
      }
      updateUI();
      return;
    }

    if (canCommandSelectedArmy()) {
      orderSelectedMove(tile);
    } else {
      state.selected = null;
    }
    updateUI();
  }

  function canCommandSelectedArmy() {
    return state.selected?.kind === "unit" || state.selected?.kind === "group";
  }

  function orderSelectedMove(tile) {
    const targets = selectedUnitsForOrders();
    targets.forEach((unit, index) => {
      unit.order = {
        type: "move",
        x: clamp(tile.x + (index % 3) * 0.25, 0, MAP_W - 0.2),
        y: clamp(tile.y + Math.floor(index / 3) * 0.25, 0, MAP_H - 0.2)
      };
    });
    if (targets.length) addLog(`${targets.length} unit${targets.length === 1 ? "" : "s"} moving.`);
  }

  function orderSelectedAttack(enemyId) {
    const targets = selectedUnitsForOrders();
    targets.forEach((unit) => {
      unit.order = { type: "attack", targetId: enemyId };
    });
    if (targets.length) addLog(`${targets.length} unit${targets.length === 1 ? "" : "s"} attacking.`);
  }

  function selectedUnitsForOrders() {
    if (state.selected?.kind === "group") {
      return state.units.filter((unit) => unit.type === "crossbow");
    }
    if (state.selected?.kind === "unit") {
      const unit = findUnit(state.selected.id);
      return unit ? [unit] : [];
    }
    return [];
  }

  function pickEntity(point, tile) {
    const unitHits = [...state.units, ...state.enemies]
      .map((entity) => ({ entity, screen: tileToScreen(entity.x, entity.y) }))
      .map(({ entity, screen }) => ({ entity, distance: Math.hypot(point.x - screen.x, point.y - (screen.y - 18)) }))
      .filter((hit) => hit.distance < 23)
      .sort((a, b) => a.distance - b.distance);

    if (unitHits.length) return unitHits[0].entity;

    const tx = Math.floor(tile.x);
    const ty = Math.floor(tile.y);
    const buildings = [...state.buildings].sort((a, b) => (b.x + b.y + b.w + b.h) - (a.x + a.y + a.w + a.h));
    return buildings.find((building) => tx >= building.x && tx < building.x + building.w && ty >= building.y && ty < building.y + building.h);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H
    };
  }

  function tileToScreen(x, y, z = 0) {
    return {
      x: ORIGIN_X + (x - y) * (TILE_W / 2),
      y: ORIGIN_Y + (x + y) * (TILE_H / 2) - z
    };
  }

  function screenToWorld(point) {
    const dx = point.x - ORIGIN_X;
    const dy = point.y - ORIGIN_Y;
    const a = dx / (TILE_W / 2);
    const b = dy / (TILE_H / 2);
    return {
      x: (a + b) / 2,
      y: (b - a) / 2
    };
  }

  function isoRectCorners(x, y, w, h, z = 0) {
    return [
      tileToScreen(x, y, z),
      tileToScreen(x + w, y, z),
      tileToScreen(x + w, y + h, z),
      tileToScreen(x, y + h, z)
    ];
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    const referenceMode = drawBackdrop();

    if (!referenceMode) {
      drawTiles();
      drawResources();
      drawSceneProps();
      drawBuildGhost();
    } else {
      drawReferenceLiveLayer();
    }

    const renderables = [
      ...state.buildings.map((item) => ({ item, type: "building", sort: item.x + item.y + item.w + item.h })),
      ...state.units.map((item) => ({ item, type: "unit", sort: item.x + item.y + 0.4 })),
      ...state.enemies.map((item) => ({ item, type: "enemy", sort: item.x + item.y + 0.45 }))
    ].sort((a, b) => a.sort - b.sort);

    if (!referenceMode) {
      renderables.forEach(({ item, type }) => {
        if (type === "building") drawBuilding(item);
        if (type === "unit") drawUnit(item);
        if (type === "enemy") drawEnemy(item);
      });
    } else if (state.enemies.length) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      renderables.forEach(({ item, type }) => {
        if (type === "building" && item.live) drawBuilding(item);
        if (type === "unit" && item.live) drawUnit(item);
        if (type === "enemy") drawEnemy(item);
      });
      ctx.restore();
    } else if (referenceMode) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      renderables.forEach(({ item, type }) => {
        if (type === "building" && item.live) drawBuilding(item);
        if (type === "unit" && item.live) drawUnit(item);
      });
      ctx.restore();
    }

    if (referenceMode) drawBuildGhost();

    drawProjectiles();
    drawParticles();
    if (!referenceMode) drawTopCanvasStatus();
    drawMinimap();
  }

  function drawBackdrop() {
    if (referenceScene.complete && referenceScene.naturalWidth) {
      const cropTop = 44;
      const cropBottom = 0;
      ctx.drawImage(
        referenceScene,
        0,
        cropTop,
        referenceScene.naturalWidth,
        referenceScene.naturalHeight - cropTop - cropBottom,
        0,
        0,
        W,
        H
      );
      ctx.fillStyle = "rgba(3, 7, 5, 0.05)";
      ctx.fillRect(0, 0, W, H);
      return true;
    }

    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, "#294b30");
    grd.addColorStop(0.52, "#566b3b");
    grd.addColorStop(1, "#17718b");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, W, 48);
    ctx.fillRect(0, H - 34, W, 34);
    return false;
  }

  function drawReferenceLiveLayer() {
    const pulse = 0.5 + Math.sin(state.time * 2.2) * 0.5;
    ctx.save();

    // Selection bracket around the central PointCast kiosk in the reference art.
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.62 + pulse * 0.25})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(456, 383);
    ctx.lineTo(604, 341);
    ctx.lineTo(715, 391);
    ctx.lineTo(568, 442);
    ctx.closePath();
    ctx.stroke();

    // Live signal pulses from the tower locations visible in the screenshot.
    [
      [1062, 337, 34],
      [1139, 442, 28],
      [1011, 493, 42],
      [481, 198, 28]
    ].forEach(([x, y, radius], index) => {
      ctx.strokeStyle = `rgba(90, 245, 132, ${0.16 + pulse * 0.14})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + pulse * 18 + index * 2, 0, Math.PI * 2);
      ctx.stroke();
    });

    if (state.waveActive || state.enemies.length) {
      ctx.fillStyle = "rgba(49, 214, 89, 0.16)";
      ctx.fillRect(0, 0, W, 30);
      ctx.fillStyle = "#7cff94";
      ctx.font = "700 13px Georgia, serif";
      ctx.fillText(`${currentWaveLabel()} active: ${state.enemies.length} raiders`, 24, 21);
    }

    drawPings();
    ctx.restore();
  }

  function drawTiles() {
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const terrain = terrainForTile(x, y);
        drawDiamond(x, y, terrain.fill, terrain.stroke);
        if (terrain.path) drawPathMark(x, y);
        if (terrain.water) drawWaterMark(x, y);
        if (terrain.field) drawFieldRows(x, y);
      }
    }
  }

  function terrainForTile(x, y) {
    if (isWaterTile(x, y)) {
      return { fill: colorShift("#116f92", x, y, 12), stroke: "rgba(170, 230, 255, 0.13)", water: true };
    }
    if (isBeachTile(x, y)) {
      return { fill: colorShift("#bda673", x, y, 10), stroke: "rgba(45, 36, 19, 0.16)" };
    }
    const isPath = (x >= 7 && x <= 20 && y >= 7 && y <= 10) || (x >= 11 && x <= 14 && y >= 3 && y <= 14);
    if (isPath) {
      return { fill: colorShift("#8b8976", x, y, 10), stroke: "rgba(255, 255, 255, 0.08)", path: true };
    }
    const isField = x >= 2 && x <= 6 && y >= 11 && y <= 15;
    if (isField) {
      return { fill: colorShift("#66823d", x, y, 8), stroke: "rgba(23, 47, 23, 0.18)", field: true };
    }
    if (x < 4 && y < 8) {
      return { fill: colorShift("#274f34", x, y, 10), stroke: "rgba(160, 200, 130, 0.08)" };
    }
    return { fill: colorShift("#53793d", x, y, 12), stroke: "rgba(0, 0, 0, 0.14)" };
  }

  function isWaterTile(x, y) {
    return x > 21 || y > 16 || (x > 18 && y > 12) || x + y > 37;
  }

  function isBeachTile(x, y) {
    return !isWaterTile(x, y) && (
      isWaterTile(x + 1, y) ||
      isWaterTile(x, y + 1) ||
      isWaterTile(x + 1, y + 1)
    );
  }

  function drawDiamond(x, y, fill, stroke) {
    const points = isoRectCorners(x, y, 1, 1);
    drawPoly(points, fill, stroke);
  }

  function drawPathMark(x, y) {
    const a = tileToScreen(x + 0.22, y + 0.5);
    const b = tileToScreen(x + 0.78, y + 0.5);
    ctx.strokeStyle = "rgba(230, 225, 198, 0.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawWaterMark(x, y) {
    const c = tileToScreen(x + 0.5, y + 0.5);
    ctx.strokeStyle = "rgba(150, 225, 255, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c.x - 12, c.y);
    ctx.quadraticCurveTo(c.x - 5, c.y - 5, c.x + 2, c.y);
    ctx.quadraticCurveTo(c.x + 9, c.y + 5, c.x + 16, c.y);
    ctx.stroke();
  }

  function drawFieldRows(x, y) {
    const left = tileToScreen(x + 0.15, y + 0.55);
    const right = tileToScreen(x + 0.85, y + 0.55);
    ctx.strokeStyle = "rgba(28, 49, 24, 0.36)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }

  function drawResources() {
    state.resourceNodes.forEach((node) => {
      const screen = tileToScreen(node.x, node.y);
      ctx.save();
      ctx.translate(screen.x, screen.y);
      drawShadow(0, 0, 26, 9);
      if (node.type === "wood") drawTreeCluster(node.pulse);
      if (node.type === "food") drawFoodPatch(node.pulse);
      if (node.type === "gold") drawOrePile("#d8aa43", node.pulse);
      if (node.type === "stone") drawOrePile("#adb2ac", node.pulse);
      ctx.restore();
    });
  }

  function drawSceneProps() {
    drawBillboard(18.1, 9.8);
    drawSailBoat(21.4, 14.6, 0.95);
    drawSailBoat(22.8, 16.1, 0.7);
    drawSailBoat(19.8, 15.7, 0.62);
    drawSignalMonolith(22.2, 5.6);
    drawSignalMonolith(21.3, 8.5);
  }

  function drawBillboard(x, y) {
    const p = tileToScreen(x, y);
    ctx.save();
    ctx.translate(p.x, p.y - 34);
    drawShadow(0, 43, 48, 12);
    ctx.strokeStyle = "#24221e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-45, 26);
    ctx.lineTo(-45, 62);
    ctx.moveTo(45, 26);
    ctx.lineTo(45, 62);
    ctx.stroke();
    ctx.fillStyle = "#2d302b";
    ctx.fillRect(-68, -18, 136, 48);
    ctx.strokeStyle = "#958b73";
    ctx.lineWidth = 3;
    ctx.strokeRect(-68, -18, 136, 48);
    ctx.fillStyle = "#c7c0aa";
    ctx.font = "700 12px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("Local Signals.", -42, 3);
    ctx.fillText("Shared Intelligence.", -42, 19);
    drawSignalGlyph(-55, 8, 15, "#8e9289");
    ctx.restore();
  }

  function drawSignalMonolith(x, y) {
    const p = tileToScreen(x, y);
    ctx.save();
    ctx.translate(p.x, p.y);
    drawShadow(0, 4, 24, 9);
    ctx.fillStyle = "#4b514a";
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.lineTo(0, -12);
    ctx.lineTo(18, -2);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#82887f";
    ctx.fillRect(-14, -54, 28, 50);
    ctx.fillStyle = "#232522";
    ctx.fillRect(-10, -48, 20, 35);
    ctx.fillStyle = "#e5e2c9";
    ctx.beginPath();
    ctx.moveTo(-18, -54);
    ctx.lineTo(0, -66);
    ctx.lineTo(18, -54);
    ctx.lineTo(0, -44);
    ctx.closePath();
    ctx.fill();
    drawSignalGlyph(0, -31, 15, "#d8f0d6");
    ctx.restore();
  }

  function drawSailBoat(x, y, scale) {
    const p = tileToScreen(x, y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = "rgba(4, 28, 38, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3c2a1b";
    ctx.beginPath();
    ctx.moveTo(-32, -4);
    ctx.lineTo(24, -4);
    ctx.lineTo(12, 12);
    ctx.lineTo(-22, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#d7d0a6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, -55);
    ctx.stroke();
    ctx.fillStyle = "#dbeed3";
    ctx.beginPath();
    ctx.moveTo(2, -52);
    ctx.lineTo(28, -14);
    ctx.lineTo(2, -7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#39a75b";
    ctx.beginPath();
    ctx.moveTo(-3, -46);
    ctx.lineTo(-28, -12);
    ctx.lineTo(-3, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTreeCluster(pulse) {
    for (let i = 0; i < 3; i += 1) {
      const x = (i - 1) * 9;
      const y = (i % 2) * 5 - 10;
      ctx.fillStyle = "#674225";
      ctx.fillRect(x - 2, y - 5, 4, 15);
      ctx.fillStyle = i === 1 ? "#245f3a" : "#2c7441";
      ctx.beginPath();
      ctx.moveTo(x, y - 24 - Math.sin(pulse) * 1.2);
      ctx.lineTo(x - 13, y + 3);
      ctx.lineTo(x + 13, y + 3);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawFoodPatch(pulse) {
    ctx.fillStyle = "#425e2e";
    ctx.beginPath();
    ctx.ellipse(0, -6, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c7d76b";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 7, 2);
      ctx.lineTo(i * 7 + Math.sin(pulse + i) * 2, -17);
      ctx.stroke();
    }
  }

  function drawOrePile(color, pulse) {
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i += 1) {
      const x = -15 + i * 7;
      const h = 12 + ((i * 3) % 9);
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.lineTo(x + 6, -h - Math.sin(pulse + i) * 1.5);
      ctx.lineTo(x + 14, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.stroke();
  }

  function drawBuildGhost() {
    if (!BUILD_COMMANDS.has(state.activeCommand) || !state.hoverTile) return;
    const type = BUILD_COMMANDS.get(state.activeCommand);
    const spec = BUILDINGS[type];
    const x = Math.floor(state.hoverTile.x - spec.w / 2);
    const y = Math.floor(state.hoverTile.y - spec.h / 2);
    const ok = canPlace(type, x, y) && canAfford(spec.cost);
    const points = isoRectCorners(x, y, spec.w, spec.h);
    ctx.save();
    ctx.globalAlpha = 0.65;
    drawPoly(points, ok ? "rgba(48, 180, 93, 0.34)" : "rgba(217, 91, 79, 0.34)", ok ? "#8ce0a7" : "#ff9d92");
    ctx.restore();
  }

  function drawBuilding(building) {
    const spec = BUILDINGS[building.type];
    const selected = state.selected?.kind === "building" && state.selected.id === building.id;
    const base = isoRectCorners(building.x, building.y, building.w, building.h);
    if (selected) {
      ctx.save();
      ctx.lineWidth = 3;
      drawPoly(base, "rgba(216, 170, 67, 0.16)", "#f1cc68");
      ctx.restore();
    }

    drawIsoPrism(building.x, building.y, building.w, building.h, building.type === "tower" ? 66 : 42, spec.roof, spec.color, darken(spec.color, 18));
    const center = tileToScreen(building.x + building.w / 2, building.y + building.h / 2);

    if (building.type === "hq") drawKeepDetails(center);
    if (building.type === "kiosk") drawKioskDetails(center);
    if (building.type === "tower") drawTowerDetails(center);
    if (building.type === "house") drawHouseDetails(center);
    if (building.type === "farm") drawFarmDetails(center);
    if (building.type === "barracks") drawBarracksDetails(center);

    if (building.hp < building.maxHp || selected) {
      drawHealthBar(center.x, center.y - 74, building.hp / building.maxHp, 62);
    }
  }

  function drawIsoPrism(x, y, w, h, height, top, left, right) {
    const base = isoRectCorners(x, y, w, h, 0);
    const roof = isoRectCorners(x, y, w, h, height);
    drawPoly([base[1], base[2], roof[2], roof[1]], right, "rgba(0,0,0,0.16)");
    drawPoly([base[2], base[3], roof[3], roof[2]], left, "rgba(0,0,0,0.16)");
    drawPoly([base[0], base[1], roof[1], roof[0]], lighten(left, 6), "rgba(0,0,0,0.12)");
    drawPoly(roof, top, "rgba(255,255,255,0.22)");
  }

  function drawKeepDetails(center) {
    ctx.save();
    ctx.translate(center.x, center.y - 54);
    ctx.fillStyle = "#d8e1d5";
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(i * 22 - 6, -20, 12, 18);
      ctx.fillRect(i * 22 - 9, -27, 18, 8);
    }
    drawSignalGlyph(0, 1, 18, "#18251d");
    ctx.restore();
  }

  function drawKioskDetails(center) {
    ctx.save();
    ctx.translate(center.x, center.y - 43);
    drawSignalGlyph(18, -15, 17, "#e8f6e8");
    ctx.strokeStyle = "#d8c99e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-22, -2);
    ctx.lineTo(5, -24);
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.fillRect(-26, 10, 52, 11);
    ctx.fillStyle = "#f2e7c9";
    ctx.font = "700 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("POINTCAST", 0, 19);
    ctx.restore();
  }

  function drawTowerDetails(center) {
    ctx.save();
    ctx.translate(center.x, center.y - 74);
    ctx.strokeStyle = "#e6f3e6";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.lineTo(0, -20);
    ctx.stroke();
    drawSignalGlyph(0, -28, 24, "#e8f6e8");
    ctx.restore();
  }

  function drawHouseDetails(center) {
    ctx.save();
    ctx.translate(center.x, center.y - 45);
    ctx.fillStyle = "#f2d9a6";
    ctx.fillRect(-18, 0, 36, 19);
    ctx.fillStyle = "#25211c";
    ctx.fillRect(-4, 7, 8, 12);
    ctx.restore();
  }

  function drawFarmDetails(center) {
    ctx.save();
    ctx.translate(center.x, center.y - 38);
    ctx.strokeStyle = "#f1d870";
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-30, i * 6);
      ctx.lineTo(30, i * 6 - 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBarracksDetails(center) {
    ctx.save();
    ctx.translate(center.x, center.y - 45);
    ctx.fillStyle = "#1a1e1b";
    ctx.fillRect(-31, 5, 62, 14);
    ctx.fillStyle = "#d9ead8";
    ctx.font = "800 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CAST YARD", 0, 16);
    ctx.restore();
  }

  function drawSignalGlyph(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size / 8);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, -Math.PI * 0.86, Math.PI * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.58, -Math.PI * 0.86, Math.PI * 0.16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, size * 0.55);
    ctx.lineTo(0, -size * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  function drawUnit(unit) {
    const spec = UNIT_TYPES[unit.type];
    const point = tileToScreen(unit.x, unit.y);
    const selected = state.selected?.kind === "unit" && state.selected.id === unit.id;
    ctx.save();
    ctx.translate(point.x, point.y);
    drawShadow(0, 2, 19, 7);
    if (selected || state.selected?.kind === "group") drawSelectionRing(unit.selectedPulse);
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.ellipse(0, -18, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f1d5ad";
    ctx.beginPath();
    ctx.arc(0, -34, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = unit.type === "crossbow" ? "#1d1f21" : "#74572d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.lineTo(13, -27);
    ctx.stroke();
    if (unit.hp < unit.maxHp || selected) drawHealthBar(0, -50, unit.hp / unit.maxHp, 35);
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const spec = ENEMY_TYPES[enemy.type];
    const point = tileToScreen(enemy.x, enemy.y);
    const selected = state.selected?.kind === "enemy" && state.selected.id === enemy.id;
    ctx.save();
    ctx.translate(point.x, point.y);
    drawShadow(0, 2, 22, 8);
    if (selected) drawSelectionRing(enemy.wobble);
    ctx.fillStyle = spec.color;
    ctx.beginPath();
    ctx.ellipse(0, -20, enemy.type === "captain" ? 17 : 12, enemy.type === "cart" ? 17 : 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spec.accent;
    ctx.fillRect(-9, -35, 18, 8);
    ctx.strokeStyle = "rgba(0,0,0,0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, -18);
    ctx.lineTo(15, -26);
    ctx.stroke();
    if (enemy.slowTime > 0) {
      ctx.strokeStyle = "#7ed7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -20, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawHealthBar(0, -50, enemy.hp / enemy.maxHp, 38);
    ctx.restore();
  }

  function drawSelectionRing(seed) {
    ctx.strokeStyle = "#f0c75c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 + Math.sin(state.time * 4 + seed) * 1.5, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawProjectiles() {
    state.projectiles.forEach((projectile) => {
      const p = tileToScreen(projectile.x, projectile.y);
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      const size = projectile.kind === "volley" ? 6 : projectile.kind === "tower" ? 4.8 : 4;
      if (projectile.kind === "volley") {
        ctx.strokeStyle = "rgba(243, 212, 106, 0.52)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - 8, p.y - 28);
        ctx.lineTo(p.x + 8, p.y - 16);
        ctx.stroke();
      }
      ctx.arc(p.x, p.y - 22, size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPings() {
    state.pings.forEach((ping) => {
      const p = tileToScreen(ping.x, ping.y);
      const alpha = Math.max(0, ping.life / ping.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ping.color;
      ctx.lineWidth = ping.kind === "spawn" || ping.kind === "volley" || ping.kind === "pulse" || ping.kind === "jammer" || ping.kind === "saboteur" ? 3 : 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 18, ping.radius * 24, ping.radius * 11, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (ping.kind === "spawn" || ping.kind === "volley" || ping.kind === "jammer" || ping.kind === "saboteur") {
        ctx.fillStyle = ping.color;
        ctx.beginPath();
        if (ping.kind === "jammer") {
          ctx.arc(p.x, p.y - 48, 9, 0, Math.PI * 2);
        } else {
          ctx.moveTo(p.x, p.y - 56);
          ctx.lineTo(p.x - 8, p.y - 40);
          ctx.lineTo(p.x + 8, p.y - 40);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      const p = tileToScreen(particle.x, particle.y);
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 18, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    state.floaters.forEach((floater) => {
      const p = tileToScreen(floater.x, floater.y);
      ctx.globalAlpha = Math.max(0, floater.life / 1.2);
      ctx.fillStyle = floater.color;
      ctx.font = "800 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(floater.text, p.x, p.y - 46);
      ctx.globalAlpha = 1;
    });
  }

  function drawTopCanvasStatus() {
    ctx.save();
    ctx.fillStyle = "rgba(10, 13, 12, 0.68)";
    ctx.fillRect(14, 14, 360, 86);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.strokeRect(14.5, 14.5, 360, 86);
    ctx.fillStyle = "#f7efe2";
    ctx.font = "900 18px sans-serif";
    ctx.fillText(currentWaveLabel(), 30, 44);
    ctx.fillStyle = "#b9c0b3";
    ctx.font = "700 13px sans-serif";
    ctx.fillText(canvasStatusLine(), 30, 70);
    ctx.restore();
  }

  function canvasStatusLine() {
    if (state.awaitingStart) return "Network ready. Raid pending.";
    if (state.waveActive) return `${state.enemies.length} raiders on the field`;
    if (state.victory) return "The coast is live.";
    if (state.gameOver) return "Signal lost.";
    return `Next raid in ${Math.max(0, Math.ceil(state.nextWaveTimer))}s`;
  }

  function currentWaveLabel() {
    const wave = WAVES[Math.min(state.waveIndex, WAVES.length - 1)];
    return state?.waveIndex >= WAVES.length ? (isCvcMode() ? "Merged" : "Coast Clear") : waveName(state.waveIndex);
  }

  function drawHealthBar(x, y, pct, width) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - width / 2, y, width, 6);
    ctx.fillStyle = pct > 0.48 ? "#4ad46d" : pct > 0.22 ? "#d8aa43" : "#d95b4f";
    ctx.fillRect(x - width / 2, y, width * clamp(pct, 0, 1), 6);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(x - width / 2 + 0.5, y + 0.5, width - 1, 5);
    ctx.restore();
  }

  function drawShadow(x, y, rx, ry) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPoly(points, fill, stroke) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawMinimap() {
    const MW = 260;
    const MH = 170;
    mctx.clearRect(0, 0, MW, MH);
    mctx.fillStyle = "#102018";
    mctx.fillRect(0, 0, MW, MH);

    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        mctx.fillStyle = isWaterTile(x, y) ? "#177a9c" : isBeachTile(x, y) ? "#bda673" : "#4f753a";
        mctx.fillRect((x / MAP_W) * MW, (y / MAP_H) * MH, Math.ceil(MW / MAP_W), Math.ceil(MH / MAP_H));
      }
    }

    state.resourceNodes.forEach((node) => drawMapDot(node.x, node.y, resourceColor(node.type), 3));
    state.buildings.forEach((building) => drawMapDot(building.x + building.w / 2, building.y + building.h / 2, building.type === "hq" ? "#f1cc68" : "#38d06c", building.type === "hq" ? 5 : 4));
    state.units.forEach((unit) => drawMapDot(unit.x, unit.y, "#79c8ff", 2.8));
    state.enemies.forEach((enemy) => drawMapDot(enemy.x, enemy.y, enemyMapColor(enemy.type), enemy.type === "cart" || enemy.type === "captain" ? 4.6 : 3.5));

    mctx.strokeStyle = "rgba(255,255,255,0.35)";
    mctx.strokeRect(0.5, 0.5, MW - 1, MH - 1);
  }

  function drawMapDot(x, y, color, radius) {
    mctx.fillStyle = color;
    mctx.beginPath();
    mctx.arc((x / MAP_W) * 260, (y / MAP_H) * 170, radius, 0, Math.PI * 2);
    mctx.fill();
  }

  function enemyMapColor(type) {
    if (type === "jammer") return "#24e0df";
    if (type === "saboteur") return "#ff8a38";
    if (type === "cart") return "#d8c07a";
    return "#ff6b5f";
  }

  function addParticle(x, y, color, size) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.9,
      vy: (Math.random() - 0.8) * 0.9,
      color,
      size: size * (0.55 + Math.random() * 0.6),
      life: 0.55 + Math.random() * 0.35,
      maxLife: 0.9
    });
  }

  function addFloater(text, x, y, color) {
    state.floaters.push({ text, x, y, color, life: 1.2 });
  }

  function addPing(x, y, color, life = 1.2, kind = "ping") {
    state.pings.push({
      x,
      y,
      color,
      kind,
      life,
      maxLife: life,
      radius: kind === "spawn" ? 0.2 : kind === "volley" || kind === "pulse" || kind === "jammer" || kind === "saboteur" ? 0.16 : 0.1,
      growth: kind === "spawn" ? 1.7 : kind === "volley" || kind === "pulse" || kind === "jammer" || kind === "saboteur" ? 1.45 : 1.05
    });
  }

  function addLog(message) {
    state.logs.unshift(message);
    state.logs = state.logs.slice(0, 7);
  }

  function updateUI() {
    const pop = recomputePopulation();
    updateModeUI();
    els.wood.textContent = Math.floor(state.resources.wood);
    els.food.textContent = Math.floor(state.resources.food);
    els.gold.textContent = Math.floor(state.resources.gold);
    els.stone.textContent = Math.floor(state.resources.stone);
    els.signal.textContent = Math.floor(state.resources.signal);
    els.pop.textContent = `${pop.pop}/${pop.cap}`;
    els.timer.textContent = formatTime(state.time);
    els.age.textContent = state.resources.signal >= 850 ? "Broadcast" : "Imperial";
    els.wave.textContent = `${Math.min(state.waveIndex + 1, WAVES.length)} / ${WAVES.length}`;
    els.waveName.textContent = currentWaveLabel();
    els.threat.textContent = threatLabel();
    els.score.textContent = Math.floor(state.score);
    const keep = state.buildings.find((building) => building.type === "hq");
    const keepPct = keep ? clamp(keep.hp / keep.maxHp, 0, 1) : 0;
    els.missionRaid.textContent = `${Math.min(state.waveIndex + 1, WAVES.length)} / ${WAVES.length}`;
    els.missionField.textContent = missionFieldLabel();
    els.missionRaiders.textContent = String(state.enemies.length);
    els.missionKeep.textContent = `${Math.ceil(keepPct * 100)}%`;
    els.missionProgressFill.style.width = `${missionProgress() * 100}%`;
    const coach = coachAdvice(keepPct);
    els.coachTitle.textContent = coach.title;
    els.coachText.textContent = coach.text;
    els.objectiveValue.textContent = state.victory ? (isCvcMode() ? "Merged" : "Coast Clear") : modeConfig().objective;
    els.objectiveText.textContent = state.victory
      ? modeConfig().victoryText
      : state.gameOver
        ? "The Keep was destroyed."
        : modeConfig().objectiveText;
    els.objectiveFill.style.width = `${clamp((state.waveIndex + (state.waveActive ? 0.45 : 0)) / WAVES.length, 0, 1) * 100}%`;

    updateSelectionUI();
    updateButtons(pop);
    updateLog();
    updateFactionList();
  }

  function updateModeUI() {
    const config = modeConfig();
    els.gameTitle.textContent = config.title;
    els.missionCopy.textContent = config.mission;
    els.modeButton.textContent = config.button;
    els.modeButton.classList.toggle("is-active", isCvcMode());
    els.modeButton.title = isCvcMode() ? "Switch back to Signal Siege." : "Switch to Claude vs Codex mode.";
    els.agentPlayerSelect.value = agentPlayer;
  }

  function missionProgress() {
    if (state.victory) return 1;
    const waveBase = state.waveIndex / WAVES.length;
    if (!state.waveActive) return clamp(waveBase, 0, 1);
    const wave = WAVES[state.waveIndex];
    const lastSpawn = wave
      ? Math.max(...wave.groups.map((group) => group.at + Math.max(0, group.count - 1) * group.gap), 1)
      : 1;
    const spawnProgress = clamp(state.waveClock / lastSpawn, 0, 1);
    const clearBonus = state.spawnQueue.length ? 0 : clamp(1 - state.enemies.length / 8, 0, 1) * 0.35;
    return clamp(waveBase + ((spawnProgress * 0.65 + clearBonus) / WAVES.length), 0, 1);
  }

  function missionFieldLabel() {
    if (state.gameOver) return "Signal lost";
    if (state.victory) return "Clear";
    if (state.enemies.some((enemy) => enemy.type === "saboteur")) return "Keep Rush";
    if (state.enemies.some((enemy) => enemy.type === "jammer")) return "Jammed";
    if (state.enemies.some((enemy) => enemy.type === "cart" || enemy.type === "captain")) return "Siege";
    if (state.waveActive) return "Raid live";
    if (state.awaitingStart) return "Ready";
    return `Next ${Math.max(0, Math.ceil(state.nextWaveTimer))}s`;
  }

  function coachAdvice(keepPct) {
    const pop = recomputePopulation();
    const crossbows = state.units.filter((unit) => unit.type === "crossbow").length;
    const towers = state.buildings.filter((building) => building.type === "tower").length;

    if (state.gameOver) {
      return { title: "Signal lost", text: "Restart and build tower coverage before the second raid." };
    }
    if (state.victory) {
      return { title: "Coast clear", text: "The shared signal held every raid." };
    }
    if (keepPct < 0.55) {
      return { title: "Repair the Keep", text: "Select the Keep and use Repair before the next wave lands." };
    }
    if (state.waveActive && state.enemies.some((enemy) => enemy.type === "saboteur")) {
      return isCvcMode()
        ? { title: "Stop the merge saboteur", text: "Guard pulls Codex crews back to intercept Claude's Keep rush." }
        : { title: "Stop the saboteur", text: "Guard pulls crossbows back to intercept Keep rushers." };
    }
    if (state.waveActive && state.enemies.some((enemy) => enemy.type === "jammer")) {
      return isCvcMode()
        ? { title: "Break the token jammer", text: "Claude is choking signal income. Volley prioritizes jammers when you have 80 signal." }
        : { title: "Break the jammer", text: "Signal income is reduced. Volley prioritizes jammers when you have 80 signal." };
    }
    if (state.waveActive && state.enemies.some((enemy) => enemy.type === "cart")) {
      return isCvcMode()
        ? { title: "Kill the regression cart", text: "Signal Towers prioritize regression carts before they reach Codex Keep." }
        : { title: "Burn the cart", text: "Signal Towers prioritize siege carts before they reach the Keep." };
    }
    if (state.waveActive && state.enemies.length >= 3 && state.resources.signal >= 120) {
      return { title: "Fire Signal Pulse", text: "Spend 120 signal to damage and slow every active raider." };
    }
    if (state.waveActive && state.enemies.length && crossbows >= 2 && state.resources.signal >= 80) {
      return {
        title: "Call Volley",
        text: isCvcMode() ? "Volley spends 80 signal for focused Codex burst damage." : "Volley spends 80 signal for focused crossbow burst damage."
      };
    }
    if (state.waveActive && state.enemies.length && state.resources.signal < 80) {
      return { title: "Conserve signal", text: "Hold with Guard until kiosks and bounties refill enough signal for Volley." };
    }
    if (state.waveActive) {
      return { title: isCvcMode() ? "Hold the build" : "Hold the Keep", text: `Use Guard to keep crossbows near the ${isCvcMode() ? "Codex Keep" : "Keep"} while towers fire.` };
    }
    if (pop.pop >= pop.cap - 1) {
      return { title: "Raise capacity", text: "Build a Relay House before training more crews." };
    }
    if (crossbows < 3) {
      return {
        title: isCvcMode() ? "Train Codex crews" : "Train crossbows",
        text: isCvcMode() ? "Three Codex crews make Claude's first review much safer." : "Three crossbow crews make the first raids much safer."
      };
    }
    if (towers < 2) {
      return { title: "Place another tower", text: "A second Signal Tower gives the coast real coverage." };
    }
    return { title: isCvcMode() ? "Start Claude's review" : "Start the raid", text: "Guard the army, then start the next raid when ready." };
  }

  function updateSelectionUI() {
    if (BUILD_COMMANDS.has(state.activeCommand)) {
      const type = BUILD_COMMANDS.get(state.activeCommand);
      const spec = BUILDINGS[type];
      els.selectedTitle.textContent = spec.name;
      els.selectedDescription.textContent = `Cost: ${formatCost(spec.cost)}.`;
      els.selectedMeta.textContent = "Placement";
      els.selectedHealthFill.style.width = canAfford(spec.cost) ? "100%" : "28%";
      return;
    }

    if (state.selected?.kind === "group") {
      const army = state.units.filter((unit) => unit.type === "crossbow");
      els.selectedTitle.textContent = "Field Army";
      els.selectedDescription.textContent = `${army.length} crossbow crew${army.length === 1 ? "" : "s"} ready.`;
      els.selectedMeta.textContent = `${army.length} unit${army.length === 1 ? "" : "s"}`;
      els.selectedHealthFill.style.width = army.length ? "100%" : "0%";
      return;
    }

    const entity = selectedEntity();
    if (!entity) {
      els.selectedTitle.textContent = "No Selection";
      els.selectedDescription.textContent = "PointCast command is standing by.";
      els.selectedMeta.textContent = "Ready";
      els.selectedHealthFill.style.width = "0%";
      return;
    }

    const spec = entity.kind === "building"
      ? BUILDINGS[entity.type]
      : entity.kind === "enemy"
        ? ENEMY_TYPES[entity.type]
        : UNIT_TYPES[entity.type];

    els.selectedTitle.textContent = entity.kind === "enemy" ? enemyName(entity.type) : entity.kind === "building" && entity.type === "hq" ? modeConfig().keep : spec.name;
    els.selectedDescription.textContent = spec.desc || "Hostile unit.";
    els.selectedMeta.textContent = `${Math.max(0, Math.ceil(entity.hp))} / ${entity.maxHp}`;
    els.selectedHealthFill.style.width = `${clamp(entity.hp / entity.maxHp, 0, 1) * 100}%`;
  }

  function updateButtons(pop) {
    els.commandButtons.forEach((button) => {
      const command = button.dataset.command;
      button.classList.toggle("is-active", command === state.activeCommand || (command === "army" && state.selected?.kind === "group"));
      let disabled = state.gameOver || state.victory;
      const cost = commandCost(command);

      if (BUILD_COMMANDS.has(command) || command.startsWith("train") || command === "signal-pulse" || command === "volley" || command === "repair") {
        disabled = disabled || !canAfford(cost);
      }
      if (command === "train-villager") {
        disabled = disabled || !state.buildings.some((building) => building.type === "hq") || pop.pop >= pop.cap;
      }
      if (command === "train-crossbow") {
        disabled = disabled || !state.buildings.some((building) => building.type === "barracks") || pop.pop >= pop.cap;
      }
      if (command === "start-wave") {
        disabled = state.waveActive || state.gameOver || state.victory || state.waveIndex >= WAVES.length;
      }
      if (command === "repair") {
        const entity = selectedEntity();
        disabled = disabled || !entity || entity.kind !== "building" || entity.hp >= entity.maxHp;
      }
      if (command === "signal-pulse") {
        disabled = disabled || !state.enemies.length;
      }
      if (command === "volley") {
        disabled = disabled || !state.enemies.length || !state.units.some((unit) => unit.type === "crossbow");
      }
      if (command === "jump-broadcast") {
        disabled = false;
        button.classList.toggle("is-active", state.broadcastOpen);
      }
      if (["select", "army", "rally", "guard"].includes(command)) disabled = state.gameOver || state.victory;

      button.disabled = disabled;
      button.title = commandHint(command, disabled, cost);
    });
  }

  function commandHint(command, disabled, cost) {
    if (!disabled) {
      if (command === "guard") return "Order crossbow crews to defend the Keep.";
      if (command === "volley") return "Spend 80 signal for focused crossbow burst damage.";
      if (command === "signal-pulse") return "Spend 120 signal to damage and slow every active raider.";
      if (command === "start-wave") return state.awaitingStart ? "Begin the first raid." : "Start early for a signal and score bonus.";
      return "";
    }
    if (command === "volley") {
      if (!state.units.some((unit) => unit.type === "crossbow")) return "Train crossbow crews before calling Volley.";
      if (!state.enemies.length) return "Volley requires active raiders.";
    }
    if (command === "signal-pulse" && !state.enemies.length) return "Signal Pulse requires active raiders.";
    if (Object.keys(cost).length && !canAfford(cost)) return `Need ${formatCost(cost)}.`;
    if (command === "start-wave" && state.waveActive) return "Current raid is still live.";
    return "";
  }

  function updateLog() {
    els.eventLog.innerHTML = state.logs.map((log) => `<p>${escapeHtml(log)}</p>`).join("");
  }

  function updateFactionList() {
    const keep = state.buildings.find((building) => building.type === "hq");
    const pointHealth = keep ? `${Math.ceil((keep.hp / keep.maxHp) * 100)}%` : "0%";
    const rows = isCvcMode()
      ? [
          ["Codex", `${pointHealth} build integrity`, "#30b45d"],
          ["Claude", `${state.enemies.filter((enemy) => ["scout", "raider", "cart", "captain"].includes(enemy.type)).length} reviewers`, "#d95b4f"],
          ["Opus Shields", `${state.enemies.filter((enemy) => enemy.type === "shield").length} active`, "#d8aa43"],
          ["Token Pressure", `${state.enemies.filter((enemy) => ["runner", "jammer", "saboteur"].includes(enemy.type)).length} active`, "#24e0df"]
        ]
      : [
          ["PointCast", `${pointHealth} keep integrity`, "#30b45d"],
          ["Tokyo Syndicate", `${state.enemies.filter((enemy) => ["scout", "raider", "cart", "captain"].includes(enemy.type)).length} active`, "#d95b4f"],
          ["The Glock Order", `${state.enemies.filter((enemy) => enemy.type === "shield").length} active`, "#d8aa43"],
          ["Westwatch Guild", `${state.enemies.filter((enemy) => enemy.type === "runner").length} active`, "#a071d7"]
        ];
    els.factionList.innerHTML = rows
      .map(([name, meta, color]) => `<div class="faction-row" style="border-left:4px solid ${color}"><strong>${name}</strong><span>${meta}</span></div>`)
      .join("");
  }

  function threatLabel() {
    if (state.gameOver) return "Lost";
    if (state.victory) return "Clear";
    if (state.awaitingStart) return "Ready";
    if (state.enemies.length > 12) return "Critical";
    if (state.enemies.length > 6) return "High";
    if (state.waveActive) return "Raid";
    return `${Math.ceil(state.nextWaveTimer)}s`;
  }

  function showOverlay(kicker, title, text, action) {
    els.overlayKicker.textContent = kicker;
    els.overlayTitle.textContent = title;
    els.overlayText.textContent = text;
    els.overlayAction.textContent = action;
    els.overlay.classList.add("is-visible");
  }

  function hideOverlay() {
    els.overlay.classList.remove("is-visible");
  }

  function formatCost(cost = {}) {
    return Object.entries(cost).map(([key, value]) => `${value}${key[0].toUpperCase()}`).join(" ");
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function resourceColor(type) {
    return {
      wood: "#9c7048",
      food: "#63c464",
      gold: "#d8aa43",
      stone: "#b6bbb3",
      signal: "#3ca9d6"
    }[type] || "#fff";
  }

  function colorShift(hex, x, y, amount) {
    const n = ((x * 31 + y * 17) % (amount * 2)) - amount;
    return shade(hex, n);
  }

  function darken(hex, amount) {
    return shade(hex, -amount);
  }

  function lighten(hex, amount) {
    return shade(hex, amount);
  }

  function shade(hex, amount) {
    const clean = hex.replace("#", "");
    const value = parseInt(clean, 16);
    const r = clamp(((value >> 16) & 255) + amount, 0, 255);
    const g = clamp(((value >> 8) & 255) + amount, 0, 255);
    const b = clamp((value & 255) + amount, 0, 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setAgentPlayer(id, restart = false) {
    agentPlayer = AGENT_PLAYERS[id] ? id : "any";
    const agent = AGENT_PLAYERS[agentPlayer];
    if (agent.mode) gameMode = agent.mode;
    if (restart) {
      resetGame();
      addLog(`${agent.name} is playing for PointCast.`);
    } else if (state) {
      state.agentPlayer = agentPlayer;
      state.agentCooldown = 0.2;
      updateUI();
    }
    return agentPlayer;
  }

  function gameSnapshot() {
    const keep = state.buildings.find((building) => building.type === "hq");
    return {
      canonicalUrl: "https://pointcast.xyz/games/signal-siege/",
      mode: gameMode,
      agentPlayer,
      time: Math.floor(state.time),
      raid: `${Math.min(state.waveIndex + 1, WAVES.length)} / ${WAVES.length}`,
      field: missionFieldLabel(),
      keep: keep ? Math.ceil((keep.hp / keep.maxHp) * 100) : 0,
      enemies: state.enemies.map((enemy) => ({ id: enemy.id, type: enemy.type, name: enemyName(enemy.type), hp: Math.ceil(enemy.hp) })),
      resources: Object.fromEntries(Object.entries(state.resources).map(([key, value]) => [key, Math.floor(value)])),
      score: Math.floor(state.score),
      victory: state.victory,
      gameOver: state.gameOver
    };
  }

  window.PointCastAgentGame = {
    setAgent: (id) => setAgentPlayer(id, true),
    setMode: (mode) => {
      gameMode = mode === "cvc" ? "cvc" : "signal";
      resetGame();
      return gameMode;
    },
    startRaid: () => startWave(true),
    guard: () => guardKeep(),
    volley: () => castVolley(),
    signalPulse: () => castSignalPulse(),
    buildTower: () => autoPlaceBuilding("tower"),
    trainCrossbow: () => trainUnit("crossbow"),
    snapshot: gameSnapshot
  };

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (!state.paused && !state.gameOver && !state.victory) {
      updateGame(dt);
    }
    render();
    updateUI();
    requestAnimationFrame(loop);
  }

  els.commandButtons.forEach((button) => {
    button.addEventListener("click", () => handleCommand(button.dataset.command));
  });

  els.pauseButton.addEventListener("click", () => {
    if (state.gameOver || state.victory) return;
    state.paused = !state.paused;
    els.pauseButton.textContent = state.paused ? "Resume" : "Pause";
    addLog(state.paused ? "Game paused." : "Game resumed.");
  });

  els.restartButton.addEventListener("click", resetGame);

  els.modeButton.addEventListener("click", () => {
    gameMode = isCvcMode() ? "signal" : "cvc";
    resetGame();
  });

  els.agentPlayerSelect.addEventListener("change", () => {
    setAgentPlayer(els.agentPlayerSelect.value, true);
  });

  els.overlayAction.addEventListener("click", () => {
    if (state.gameOver || state.victory) {
      resetGame();
      return;
    }
    startWave(true);
  });

  els.broadcastClose.addEventListener("click", () => toggleBroadcast(false));
  els.broadcastTrackButtons.forEach((button) => {
    button.addEventListener("click", () => toggleBroadcast(true, button.dataset.track));
  });

  canvas.addEventListener("pointermove", handleCanvasPointer);
  canvas.addEventListener("pointerleave", () => {
    state.hoverTile = null;
  });
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    const point = pointerPosition(event);
    const tile = screenToWorld(point);
    const hit = pickEntity(point, tile);
    if (hit?.kind === "enemy" && canCommandSelectedArmy()) orderSelectedAttack(hit.id);
    else if (canCommandSelectedArmy()) orderSelectedMove(tile);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      state.activeCommand = "select";
      state.selected = null;
      hideOverlay();
    }
    if (event.key === " ") {
      event.preventDefault();
      if (!state.waveActive) startWave(true);
    }
  });

  window.addEventListener("resize", () => {
    configureCanvas(canvas, ctx, W, H);
    configureCanvas(minimap, mctx, 260, 170);
  });

  configureCanvas(canvas, ctx, W, H);
  configureCanvas(minimap, mctx, 260, 170);
  resetGame();
  requestAnimationFrame(loop);
})();
