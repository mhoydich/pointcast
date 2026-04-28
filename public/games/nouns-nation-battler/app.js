const FIELD = {
  top: 92,
  bottom: 86,
  left: 54,
  right: 54,
};

const gangPool = [
  {
    name: "Tomato Noggles",
    short: "TN",
    color: "#e45745",
    accent: "#ffe987",
    dark: "#8f241c",
    mark: "split tomato noggles",
    cry: "Noggles down, elbows out",
  },
  {
    name: "Cobalt Frames",
    short: "CF",
    color: "#3677e0",
    accent: "#9bc7ff",
    dark: "#183f8f",
    mark: "blue square lenses",
    cry: "Blue frames, clean lanes",
  },
  {
    name: "Golden Nouncil",
    short: "GN",
    color: "#d49b19",
    accent: "#fff0a6",
    dark: "#74520e",
    mark: "council coin",
    cry: "Vote yes, swing heavy",
  },
  {
    name: "Garden Stack",
    short: "GS",
    color: "#3f9b54",
    accent: "#b8f2bf",
    dark: "#1f5b2e",
    mark: "stacked leaf",
    cry: "Roots hold, heads roll",
  },
  {
    name: "Pixel Union",
    short: "PU",
    color: "#8b5cf6",
    accent: "#e0d2ff",
    dark: "#4d2ba8",
    mark: "union pixel",
    cry: "One block, one bonk",
  },
  {
    name: "Night Auction",
    short: "NA",
    color: "#2f3a4f",
    accent: "#cfd7ef",
    dark: "#141927",
    mark: "midnight paddle",
    cry: "Going once, going through",
  },
  {
    name: "Sunset Prop House",
    short: "SP",
    color: "#ef7d2d",
    accent: "#ffd2a8",
    dark: "#8b4213",
    mark: "sunset ballot",
    cry: "Fund the charge",
  },
  {
    name: "Mint Condition",
    short: "MC",
    color: "#13a6a1",
    accent: "#b7fff4",
    dark: "#08615e",
    mark: "fresh mint stamp",
    cry: "Fresh mint, no mercy",
  },
];

let gangs = [gangPool[0], gangPool[1]];

const roles = [
  { name: "runner", hp: 74, speed: 1.34, range: 29, damage: 8, cadence: 34, move: "Breakaway dash" },
  { name: "bonker", hp: 112, speed: 0.88, range: 24, damage: 15, cadence: 50, move: "Noggles slam" },
  { name: "slinger", hp: 68, speed: 1.03, range: 96, damage: 9, cadence: 46, move: "Auction volley" },
  { name: "captain", hp: 132, speed: 0.94, range: 42, damage: 16, cadence: 42, move: "Quorum rally" },
  { name: "healer", hp: 78, speed: 0.96, range: 70, damage: 5, cadence: 58, move: "Emergency mint" },
];

const names = [
  "Beans", "Blimp", "Toast", "Kettle", "Moon", "Dino", "Yarn", "Robot", "Taco", "Skate",
  "Pencil", "Tulip", "Wizard", "Crown", "Pizza", "Cloud", "Marble", "Violin", "Boot", "Orbit",
  "Badge", "Lilac", "Goblet", "Anchor", "Jelly", "Quilt", "Cactus", "Cassette", "Lemon", "Mug",
];

const el = {
  field: document.querySelector("#field"),
  leftGang: document.querySelector("#leftGang"),
  rightGang: document.querySelector("#rightGang"),
  leftBrandKit: document.querySelector("#leftBrandKit"),
  rightBrandKit: document.querySelector("#rightBrandKit"),
  leftAlive: document.querySelector("#leftAlive"),
  rightAlive: document.querySelector("#rightAlive"),
  leftFlag: document.querySelector("#leftFlag"),
  rightFlag: document.querySelector("#rightFlag"),
  matchTitle: document.querySelector("#matchTitle"),
  newMatchButton: document.querySelector("#newMatchButton"),
  pauseButton: document.querySelector("#pauseButton"),
  autoNextButton: document.querySelector("#autoNextButton"),
  speedGroup: document.querySelector("#speedGroup"),
  momentumBar: document.querySelector("#momentumBar"),
  moveFeed: document.querySelector("#moveFeed"),
  statStrip: document.querySelector("#statStrip"),
  rootStatus: document.querySelector("#rootStatus"),
  rootLeftButton: document.querySelector("#rootLeftButton"),
  rootRightButton: document.querySelector("#rootRightButton"),
  rootCards: document.querySelector("#rootCards"),
  battleLog: document.querySelector("#battleLog"),
  toast: document.querySelector("#toast"),
  weather: document.querySelector("#weather"),
};

const state = {
  units: [],
  effects: [],
  running: true,
  speed: 1,
  lastTime: 0,
  tick: 0,
  match: 1,
  finished: false,
  specialClock: 0,
  centerClock: 0,
  weather: "clear",
  autoNext: true,
  nextTimer: null,
  rootingFor: localStorage.getItem("pc:nouns-nation-root") || "",
  season: loadSeason(),
  moveHistory: [],
};

function loadSeason() {
  try {
    return JSON.parse(localStorage.getItem("pc:nouns-nation-season") || "{}");
  } catch {
    return {};
  }
}

function saveSeason() {
  localStorage.setItem("pc:nouns-nation-season", JSON.stringify(state.season));
}

function gangRecord(name) {
  if (!state.season[name]) {
    state.season[name] = { wins: 0, losses: 0, takedowns: 0, rootedWins: 0 };
  }
  return state.season[name];
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fieldBounds() {
  const rect = el.field.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    minX: FIELD.left,
    maxX: rect.width - FIELD.right,
    minY: FIELD.top,
    maxY: rect.height - FIELD.bottom,
  };
}

function createUnit(team, index, bounds) {
  const role = roles[index % roles.length];
  const row = index % 10;
  const rank = Math.floor(index / 10);
  const xBase = team === 0 ? 0.18 + rank * 0.075 : 0.82 - rank * 0.075;
  const yBase = 0.22 + row * 0.062;
  const maxHp = Math.round(role.hp + rand(-10, 16));
  return {
    id: `${team}-${index}`,
    team,
    index,
    role,
    name: `${names[index]} ${role.name}`,
    x: bounds.width * xBase + rand(-18, 18),
    y: bounds.height * yBase + rand(-16, 16),
    vx: 0,
    vy: 0,
    hp: maxHp,
    maxHp,
    cooldown: rand(0, 40),
    morale: 1,
    guard: 0,
    haste: 0,
    stunned: 0,
    special: rand(70, 160),
    minted: false,
    targetId: null,
    node: null,
    hpNode: null,
    down: false,
    asset: `assets/noun-${team * 30 + index}.svg`,
  };
}

function createNode(unit) {
  const node = document.createElement("div");
  node.className = `noun ${unit.team === 0 ? "left" : "right"}`;
  node.title = `${gangs[unit.team].name}: ${unit.name}, official Nouns parts`;
  node.style.outlineColor = gangs[unit.team].color;
  node.innerHTML = `<div class="hp"><i></i></div><img alt="${unit.name}" src="${unit.asset}" />`;
  el.field.append(node);
  unit.node = node;
  unit.hpNode = node.querySelector(".hp i");
}

function resetMatch() {
  clearTimeout(state.nextTimer);
  state.units.forEach((unit) => unit.node?.remove());
  document.querySelectorAll(".hit-pop, .spark").forEach((node) => node.remove());
  state.units = [];
  state.effects = [];
  state.running = true;
  state.finished = false;
  state.tick = 0;
  state.specialClock = 260;
  state.centerClock = 120;
  state.weather = Math.random() > 0.58 ? "dust" : "clear";
  state.moveHistory = [];
  gangs = pickGangs();
  document.documentElement.style.setProperty("--left-gang", gangs[0].color);
  document.documentElement.style.setProperty("--right-gang", gangs[1].color);
  el.weather.className = `weather ${state.weather === "dust" ? "dust" : ""}`;
  el.pauseButton.textContent = "Pause";
  el.leftGang.textContent = gangs[0].name;
  el.rightGang.textContent = gangs[1].name;
  el.leftBrandKit.innerHTML = brandKitMarkup(gangs[0]);
  el.rightBrandKit.innerHTML = brandKitMarkup(gangs[1]);
  el.leftFlag.textContent = gangs[0].short;
  el.rightFlag.textContent = gangs[1].short;
  el.matchTitle.textContent = `Open Field Clash ${state.match}`;
  el.battleLog.innerHTML = "";

  const bounds = fieldBounds();
  for (let team = 0; team < 2; team += 1) {
    for (let index = 0; index < 30; index += 1) {
      const unit = createUnit(team, index, bounds);
      createNode(unit);
      state.units.push(unit);
    }
  }

  addLog(`${gangs[0].name} and ${gangs[1].name} enter the field, 30 strong on each side.`);
  recordMove("V3", "advanced moves armed");
  showToast("30 vs 30. V3 moves are live.");
  render();
  state.match += 1;
}

function brandKitMarkup(gang) {
  return `
    <i class="swatch" style="--swatch:${gang.color}"></i>
    <i class="swatch" style="--swatch:${gang.accent}"></i>
    <i class="swatch" style="--swatch:${gang.dark}"></i>
    <em>${gang.mark}</em>
  `;
}

function pickGangs() {
  const first = Math.floor(Math.random() * gangPool.length);
  let second = Math.floor(Math.random() * gangPool.length);
  while (second === first) {
    second = Math.floor(Math.random() * gangPool.length);
  }
  return [gangPool[first], gangPool[second]];
}

function aliveUnits(team = null) {
  return state.units.filter((unit) => !unit.down && (team === null || unit.team === team));
}

function nearestEnemy(unit) {
  let best = null;
  let bestDistance = Infinity;
  for (const enemy of state.units) {
    if (enemy.team === unit.team || enemy.down) continue;
    const d = distance(unit, enemy);
    if (d < bestDistance) {
      best = enemy;
      bestDistance = d;
    }
  }
  return best;
}

function weakestFriend(unit) {
  let best = null;
  let ratio = 0.74;
  for (const friend of state.units) {
    if (friend.team !== unit.team || friend.down) continue;
    const friendRatio = friend.hp / friend.maxHp;
    const d = distance(unit, friend);
    if (friendRatio < ratio && d < 112) {
      best = friend;
      ratio = friendRatio;
    }
  }
  return best;
}

function nearbyUnits(source, team, radius, includeDown = false) {
  return state.units.filter((unit) => {
    if (unit.team !== team) return false;
    if (!includeDown && unit.down) return false;
    return distance(source, unit) <= radius;
  });
}

function centerPressure(bounds) {
  const center = { x: bounds.width / 2, y: bounds.height / 2 };
  return [0, 1].map((team) =>
    aliveUnits(team).filter((unit) => distance(unit, center) < bounds.width * 0.18).length
  );
}

function stepUnit(unit, dt, bounds) {
  if (unit.down) return;
  unit.guard = Math.max(0, unit.guard - dt);
  unit.haste = Math.max(0, unit.haste - dt);
  unit.stunned = Math.max(0, unit.stunned - dt);
  unit.special = Math.max(0, unit.special - dt);
  if (unit.stunned > 0) return;
  unit.cooldown = Math.max(0, unit.cooldown - dt);

  if (unit.role.name === "healer") {
    const friend = weakestFriend(unit);
    if (friend && unit.cooldown === 0) {
      friend.hp = Math.min(friend.maxHp, friend.hp + 15);
      unit.cooldown = unit.role.cadence;
      pop(friend.x, friend.y - 18, "+15", "#55cc6d");
      addOccasionalLog(`${unit.name} patches up ${friend.name}.`);
      return;
    }
  }

  const target = nearestEnemy(unit);
  if (!target) return;

  const d = distance(unit, target);
  if (unit.special === 0 && maybeUseAdvancedMove(unit, target, d, bounds)) {
    return;
  }
  const dx = (target.x - unit.x) / Math.max(1, d);
  const dy = (target.y - unit.y) / Math.max(1, d);
  const preferred = unit.role.range * (unit.role.name === "slinger" ? 0.84 : 0.72);
  const advance = d > preferred ? 1 : d < preferred * 0.56 ? -0.8 : 0.08;
  const laneNoise = Math.sin((state.tick + unit.index * 19) / 31) * 0.42;
  const speedStatus = unit.haste > 0 ? 1.34 : 1;

  unit.vx += (dx * advance - dy * laneNoise) * unit.role.speed * speedStatus * 0.18 * dt;
  unit.vy += (dy * advance + dx * laneNoise) * unit.role.speed * speedStatus * 0.18 * dt;
  unit.vx *= 0.82;
  unit.vy *= 0.82;
  unit.x = clamp(unit.x + unit.vx, bounds.minX, bounds.maxX);
  unit.y = clamp(unit.y + unit.vy, bounds.minY, bounds.maxY);

  if (d <= unit.role.range && unit.cooldown === 0) {
    attack(unit, target, d);
  }
}

function maybeUseAdvancedMove(unit, target, d, bounds) {
  if (unit.role.name === "runner" && d > 70 && d < 180) {
    const dx = (target.x - unit.x) / Math.max(1, d);
    const dy = (target.y - unit.y) / Math.max(1, d);
    unit.x = clamp(unit.x + dx * 82, bounds.minX, bounds.maxX);
    unit.y = clamp(unit.y + dy * 82, bounds.minY, bounds.maxY);
    unit.haste = 95;
    unit.cooldown = 18;
    unit.special = rand(230, 330);
    target.hp -= 7;
    recordMove(gangs[unit.team].short, `${unit.name} breakaway dash`);
    pop(unit.x, unit.y - 28, "dash", gangs[unit.team].accent);
    if (target.hp <= 0) downUnit(target, unit, d);
    return true;
  }

  if (unit.role.name === "bonker" && d < 48) {
    const enemies = nearbyUnits(unit, 1 - unit.team, 58).slice(0, 4);
    enemies.forEach((enemy) => {
      enemy.hp -= 9;
      enemy.stunned = Math.max(enemy.stunned, 34);
      spark(enemy.x, enemy.y);
      pop(enemy.x, enemy.y - 24, "slam", gangs[unit.team].color);
      if (enemy.hp <= 0) downUnit(enemy, unit, distance(unit, enemy));
    });
    unit.cooldown = 44;
    unit.special = rand(260, 380);
    recordMove(gangs[unit.team].short, `${unit.name} noggles slam`);
    return true;
  }

  if (unit.role.name === "slinger" && d < 150) {
    const enemies = nearbyUnits(target, 1 - unit.team, 50).slice(0, 5);
    enemies.forEach((enemy) => {
      enemy.hp -= 8;
      spark(enemy.x, enemy.y);
      if (enemy.hp <= 0) downUnit(enemy, unit, distance(unit, enemy));
    });
    unit.cooldown = 40;
    unit.special = rand(250, 360);
    recordMove(gangs[unit.team].short, `${unit.name} auction volley`);
    pop(target.x, target.y - 30, "volley", gangs[unit.team].accent);
    return true;
  }

  if (unit.role.name === "captain") {
    const allies = nearbyUnits(unit, unit.team, 110).slice(0, 9);
    allies.forEach((ally) => {
      ally.guard = Math.max(ally.guard, 130);
      ally.morale = Math.min(1.5, ally.morale + 0.12);
    });
    unit.cooldown = 36;
    unit.special = rand(300, 440);
    recordMove(gangs[unit.team].short, `${unit.name} quorum rally`);
    pop(unit.x, unit.y - 30, "rally", gangs[unit.team].accent);
    return true;
  }

  if (unit.role.name === "healer") {
    const fallen = state.units.find((friend) => friend.team === unit.team && friend.down && !friend.minted && distance(unit, friend) < 98);
    if (fallen) {
      fallen.down = false;
      fallen.minted = true;
      fallen.hp = Math.round(fallen.maxHp * 0.36);
      fallen.guard = 150;
      fallen.morale = 1.18;
      fallen.node.classList.remove("down");
      unit.cooldown = 62;
      unit.special = rand(360, 500);
      recordMove(gangs[unit.team].short, `${unit.name} emergency mint`);
      addLog(`${gangs[unit.team].name}: ${unit.name} mints ${fallen.name} back into the match.`);
      pop(fallen.x, fallen.y - 28, "mint", "#55cc6d");
      return true;
    }
  }

  return false;
}

function attack(unit, target, d) {
  const crit = Math.random() > 0.91;
  const roleBoost = unit.role.name === "captain" && aliveUnits(unit.team).length < 14 ? 1.35 : 1;
  const damage = Math.round((unit.role.damage + rand(-3, 4)) * unit.morale * roleBoost * (crit ? 1.8 : 1));
  const guarded = target.guard > 0 ? 0.64 : 1;
  target.hp -= Math.max(1, Math.round(damage * guarded));
  unit.cooldown = unit.role.cadence + rand(-8, 10);
  unit.node.classList.add("strike");
  unit.node.style.setProperty("--tilt", `${unit.team === 0 ? 8 : -8}deg`);
  setTimeout(() => unit.node?.classList.remove("strike"), 140);
  spark(target.x, target.y);
  pop(target.x, target.y - 25, crit ? `${damage}!` : `${damage}`, unit.team === 0 ? gangs[0].color : gangs[1].color);

  if (target.hp <= 0) {
    downUnit(target, unit, d);
  } else if (crit) {
    addOccasionalLog(`${unit.name} lands a clean hit on ${target.name}.`);
  }
}

function downUnit(target, attacker, d) {
  target.down = true;
  target.hp = 0;
  target.node.classList.add("down");
  target.node.style.zIndex = "3";
  attacker.morale = Math.min(1.35, attacker.morale + 0.08);
  gangRecord(gangs[attacker.team].name).takedowns += 1;
  saveSeason();
  const verb = d > 70 ? "snipes" : attacker.role.name === "bonker" ? "bonks" : "drops";
  addLog(`${gangs[attacker.team].name}: ${attacker.name} ${verb} ${target.name}.`);
  showToast(`${gangs[attacker.team].short} score a takedown`);
  checkFinish();
}

function gangCall() {
  const left = aliveUnits(0).length;
  const right = aliveUnits(1).length;
  if (left === 0 || right === 0) return;
  const team = left <= right ? 0 : 1;
  const units = aliveUnits(team);
  units.forEach((unit) => {
    unit.morale = Math.min(1.42, unit.morale + 0.16);
    unit.cooldown = Math.max(0, unit.cooldown - 12);
  });
  addLog(`${gangs[team].name} call: ${gangs[team].cry}.`);
  showToast(`${gangs[team].name} surge`);
  el.weather.className = "weather confetti";
  setTimeout(() => {
    el.weather.className = `weather ${state.weather === "dust" ? "dust" : ""}`;
  }, 900);
}

function centerControl(bounds) {
  const [leftPressure, rightPressure] = centerPressure(bounds);
  if (leftPressure === rightPressure || leftPressure + rightPressure < 4) return;
  const team = leftPressure > rightPressure ? 0 : 1;
  aliveUnits(team).forEach((unit) => {
    unit.special = Math.max(0, unit.special - 18);
    unit.morale = Math.min(1.44, unit.morale + 0.04);
  });
  recordMove(gangs[team].short, "center field control");
  addOccasionalLog(`${gangs[team].name} control the center and charge their specials.`);
}

function checkFinish() {
  const left = aliveUnits(0).length;
  const right = aliveUnits(1).length;
  if (!state.finished && (left === 0 || right === 0)) {
    const winner = left > 0 ? 0 : 1;
    const loser = 1 - winner;
    gangRecord(gangs[winner].name).wins += 1;
    gangRecord(gangs[loser].name).losses += 1;
    if (state.rootingFor === gangs[winner].name) {
      gangRecord(gangs[winner].name).rootedWins += 1;
    }
    saveSeason();
    state.finished = true;
    state.running = false;
    el.pauseButton.textContent = "Replay";
    el.matchTitle.textContent = `${gangs[winner].name} win`;
    addLog(`${gangs[winner].name} hold the open field with ${aliveUnits(winner).length} still standing.`);
    showToast(state.autoNext ? `${gangs[winner].name} win. Next match soon.` : `${gangs[winner].name} win the match`);
    if (state.autoNext) {
      state.nextTimer = setTimeout(resetMatch, 3200);
    }
  }
}

function update(time = 0) {
  const elapsed = state.lastTime ? time - state.lastTime : 16;
  state.lastTime = time;
  const dt = clamp(elapsed / 16.67, 0.5, 2.4) * state.speed;

  if (state.running && !state.finished) {
    const bounds = fieldBounds();
    state.tick += dt;
    state.specialClock -= dt;
    state.centerClock -= dt;
    if (state.specialClock <= 0) {
      state.specialClock = rand(260, 430);
      gangCall();
    }
    if (state.centerClock <= 0) {
      state.centerClock = rand(130, 210);
      centerControl(bounds);
    }
    state.units.forEach((unit) => stepUnit(unit, dt, bounds));
    separateUnits(bounds);
    render();
  }
  requestAnimationFrame(update);
}

function separateUnits(bounds) {
  const living = aliveUnits();
  for (let i = 0; i < living.length; i += 1) {
    for (let j = i + 1; j < living.length; j += 1) {
      const a = living[i];
      const b = living[j];
      const d = distance(a, b);
      if (d > 0 && d < 31) {
        const push = (31 - d) * 0.028;
        const dx = (a.x - b.x) / d;
        const dy = (a.y - b.y) / d;
        a.x = clamp(a.x + dx * push, bounds.minX, bounds.maxX);
        a.y = clamp(a.y + dy * push, bounds.minY, bounds.maxY);
        b.x = clamp(b.x - dx * push, bounds.minX, bounds.maxX);
        b.y = clamp(b.y - dy * push, bounds.minY, bounds.maxY);
      }
    }
  }
}

function render() {
  const left = aliveUnits(0).length;
  const right = aliveUnits(1).length;
  el.leftAlive.textContent = left;
  el.rightAlive.textContent = right;
  const momentum = left + right === 0 ? 0 : (right - left) / 30;
  el.momentumBar.style.transform = `scaleX(${clamp(Math.abs(momentum), 0.04, 1)})`;
  el.momentumBar.style.marginLeft = momentum >= 0 ? "50%" : `${50 - Math.abs(momentum) * 50}%`;

  for (const unit of state.units) {
    unit.node.style.left = `${unit.x}px`;
    unit.node.style.top = `${unit.y}px`;
    unit.hpNode.style.width = `${Math.max(0, unit.hp / unit.maxHp) * 100}%`;
    unit.node.classList.toggle("guarded", unit.guard > 0 && !unit.down);
    unit.node.classList.toggle("hasted", unit.haste > 0 && !unit.down);
    unit.node.classList.toggle("stunned", unit.stunned > 0 && !unit.down);
  }

  const leaders = [0, 1].map((team) => {
    const best = aliveUnits(team).sort((a, b) => b.morale * b.hp - a.morale * a.hp)[0];
    return best ? best.name : "none";
  });
  el.statStrip.innerHTML = `
    <div class="stat"><span>Left standing</span><strong>${left}/30</strong></div>
    <div class="stat"><span>Right standing</span><strong>${right}/30</strong></div>
    <div class="stat"><span>Hot noun</span><strong>${leaders[0]}</strong></div>
    <div class="stat"><span>Counter-noun</span><strong>${leaders[1]}</strong></div>
  `;
  el.moveFeed.innerHTML = state.moveHistory
    .slice(0, 4)
    .map((move) => `<span><b>${move.tag}</b>${move.text}</span>`)
    .join("");
  renderRooting(left, right);
}

function renderRooting(left, right) {
  const currentNames = gangs.map((gang) => gang.name);
  if (!currentNames.includes(state.rootingFor)) {
    el.rootStatus.textContent = "Pick a gang";
  } else {
    const team = gangs.findIndex((gang) => gang.name === state.rootingFor);
    const alive = team === 0 ? left : right;
    el.rootStatus.textContent = `${gangs[team].short} with ${alive} up`;
  }
  el.rootLeftButton.textContent = `Root ${gangs[0].short}`;
  el.rootRightButton.textContent = `Root ${gangs[1].short}`;
  el.rootLeftButton.classList.toggle("active", state.rootingFor === gangs[0].name);
  el.rootRightButton.classList.toggle("active", state.rootingFor === gangs[1].name);
  el.rootCards.innerHTML = gangs
    .map((gang, index) => {
      const record = gangRecord(gang.name);
      const alive = index === 0 ? left : right;
      const power = Math.round((alive / 30) * 60 + record.wins * 8 + record.takedowns * 0.4);
      return `
        <div class="root-card" style="border-color:${gang.color}">
          <b>${gang.name}</b>
          <span>${record.wins}-${record.losses} record</span>
          <span>${record.takedowns} takedowns</span>
          <span>${power} root power</span>
        </div>
      `;
    })
    .join("");
}

function recordMove(tag, text) {
  state.moveHistory.unshift({ tag, text });
  state.moveHistory = state.moveHistory.slice(0, 9);
  showToast(`${tag}: ${text}`);
}

function addLog(text) {
  const p = document.createElement("p");
  p.textContent = text;
  el.battleLog.prepend(p);
  while (el.battleLog.children.length > 18) {
    el.battleLog.lastElementChild.remove();
  }
}

function addOccasionalLog(text) {
  if (Math.random() > 0.74) addLog(text);
}

function showToast(text) {
  el.toast.textContent = text;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 1000);
}

function pop(x, y, text, color) {
  const node = document.createElement("div");
  node.className = "hit-pop";
  node.textContent = text;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.borderColor = color;
  el.field.append(node);
  setTimeout(() => node.remove(), 650);
}

function spark(x, y) {
  const node = document.createElement("div");
  node.className = "spark";
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  el.field.append(node);
  setTimeout(() => node.remove(), 360);
}

el.newMatchButton.addEventListener("click", resetMatch);
el.pauseButton.addEventListener("click", () => {
  if (state.finished) {
    resetMatch();
    return;
  }
  state.running = !state.running;
  el.pauseButton.textContent = state.running ? "Pause" : "Resume";
});
el.autoNextButton.addEventListener("click", () => {
  state.autoNext = !state.autoNext;
  el.autoNextButton.textContent = `Auto Next ${state.autoNext ? "On" : "Off"}`;
  if (!state.autoNext) clearTimeout(state.nextTimer);
});
el.rootLeftButton.addEventListener("click", () => setRooting(0));
el.rootRightButton.addEventListener("click", () => setRooting(1));

function setRooting(team) {
  state.rootingFor = gangs[team].name;
  localStorage.setItem("pc:nouns-nation-root", state.rootingFor);
  addLog(`You are rooting for ${state.rootingFor}.`);
  showToast(`Rooting for ${gangs[team].short}`);
  render();
}
el.speedGroup.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  state.speed = Number(button.dataset.speed);
  el.speedGroup.querySelectorAll("button").forEach((node) => node.classList.toggle("active", node === button));
});

window.addEventListener("resize", () => {
  const bounds = fieldBounds();
  state.units.forEach((unit) => {
    unit.x = clamp(unit.x, bounds.minX, bounds.maxX);
    unit.y = clamp(unit.y, bounds.minY, bounds.maxY);
  });
  render();
});

resetMatch();
requestAnimationFrame(update);
