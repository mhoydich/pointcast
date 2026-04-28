const FIELD = {
  top: 92,
  bottom: 86,
  left: 54,
  right: 54,
};

const params = new URLSearchParams(window.location.search);
const isTvMode = params.get("mode") === "tv" || params.get("view") === "tv";
const LEAGUE_KEY = "pc:nouns-nation-league-v4";
const LEAGUE_DAYS = 14;
const DAILY_SLOTS = 4;

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
  leaguePhase: document.querySelector("#leaguePhase"),
  leagueDay: document.querySelector("#leagueDay"),
  leagueSlate: document.querySelector("#leagueSlate"),
  leagueMatchup: document.querySelector("#leagueMatchup"),
  standings: document.querySelector("#standings"),
  bracket: document.querySelector("#bracket"),
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
  quickSimButton: document.querySelector("#quickSimButton"),
  simDayButton: document.querySelector("#simDayButton"),
  pauseButton: document.querySelector("#pauseButton"),
  autoNextButton: document.querySelector("#autoNextButton"),
  resetLeagueButton: document.querySelector("#resetLeagueButton"),
  speedGroup: document.querySelector("#speedGroup"),
  momentumBar: document.querySelector("#momentumBar"),
  moveFeed: document.querySelector("#moveFeed"),
  statStrip: document.querySelector("#statStrip"),
  rootStatus: document.querySelector("#rootStatus"),
  rootLeftButton: document.querySelector("#rootLeftButton"),
  rootRightButton: document.querySelector("#rootRightButton"),
  rootCards: document.querySelector("#rootCards"),
  scoutName: document.querySelector("#scoutName"),
  scoutCard: document.querySelector("#scoutCard"),
  rosterList: document.querySelector("#rosterList"),
  battleLog: document.querySelector("#battleLog"),
  toast: document.querySelector("#toast"),
  weather: document.querySelector("#weather"),
  tvClock: document.querySelector("#tvClock"),
  tvLeftGang: document.querySelector("#tvLeftGang"),
  tvLeftAlive: document.querySelector("#tvLeftAlive"),
  tvLeagueLine: document.querySelector("#tvLeagueLine"),
  tvMatchup: document.querySelector("#tvMatchup"),
  tvMatchState: document.querySelector("#tvMatchState"),
  tvRightGang: document.querySelector("#tvRightGang"),
  tvRightAlive: document.querySelector("#tvRightAlive"),
  tvPath: document.querySelector("#tvPath"),
  tvCastHint: document.querySelector("#tvCastHint"),
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
  league: loadLeague(),
  selectedUnitId: "",
  moveHistory: [],
};

if (!state.league) {
  state.league = createLeague();
}

document.body.classList.toggle("tv-mode", isTvMode);

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

function loadLeague() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEAGUE_KEY) || "null");
    return parsed?.version === 4 ? normalizeLeague(parsed) : null;
  } catch {
    return null;
  }
}

function normalizeLeague(league) {
  league.recaps ||= [];
  league.playoffs ||= [];
  for (const gang of gangPool) {
    league.table[gang.name] ||= { wins: 0, losses: 0, pf: 0, pa: 0, streak: 0, fans: 50, last: "" };
  }
  return league;
}

function saveLeague() {
  localStorage.setItem(LEAGUE_KEY, JSON.stringify(state.league));
}

function createLeague() {
  const schedule = buildSchedule(gangPool.length);
  return {
    version: 4,
    phase: "regular",
    day: 0,
    slot: 0,
    playoffSlot: 0,
    champion: "",
    schedule,
    playoffs: [],
    recaps: [],
    table: Object.fromEntries(gangPool.map((gang) => [
      gang.name,
      { wins: 0, losses: 0, pf: 0, pa: 0, streak: 0, fans: 50, last: "" },
    ])),
  };
}

function buildSchedule(teamCount) {
  const rounds = [];
  let teams = Array.from({ length: teamCount }, (_, index) => index);
  for (let round = 0; round < teamCount - 1; round += 1) {
    const games = [];
    for (let index = 0; index < teamCount / 2; index += 1) {
      games.push([teams[index], teams[teamCount - 1 - index]]);
    }
    rounds.push(games);
    teams = [teams[0], teams[teamCount - 1], ...teams.slice(1, teamCount - 1)];
  }
  return [...rounds, ...rounds.map((round) => round.map(([home, away]) => [away, home]))];
}

function standings() {
  return gangPool
    .map((gang) => ({ gang, ...state.league.table[gang.name] }))
    .sort((a, b) =>
      b.wins - a.wins ||
      (b.pf - b.pa) - (a.pf - a.pa) ||
      b.pf - a.pf ||
      b.fans - a.fans ||
      a.gang.name.localeCompare(b.gang.name)
    );
}

function currentFixture() {
  const league = state.league;
  if (league.phase === "regular") {
    return league.schedule[league.day]?.[league.slot] || null;
  }
  if (league.phase === "playoffs") {
    return league.playoffs[league.playoffSlot] || null;
  }
  return null;
}

function currentFixtureLabel() {
  const fixture = currentFixture();
  if (!fixture) return "Champion crowned";
  return `${gangPool[fixture[0]].name} vs ${gangPool[fixture[1]].name}`;
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
    number: index + 1,
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
    stats: { hits: 0, damage: 0, heals: 0, kos: 0, deaths: 0, specials: 0 },
    node: null,
    hpNode: null,
    down: false,
    asset: `assets/noun-${team * 30 + index}.svg`,
  };
}

function createNode(unit) {
  const node = document.createElement("div");
  node.className = `noun ${unit.team === 0 ? "left" : "right"}`;
  node.title = unitTitle(unit);
  node.dataset.unitId = unit.id;
  node.style.outlineColor = gangs[unit.team].color;
  node.innerHTML = `
    <div class="hp"><i></i></div>
    <b class="jersey">${unit.number}</b>
    <img alt="${unit.name}" src="${unit.asset}" />
  `;
  el.field.append(node);
  unit.node = node;
  unit.hpNode = node.querySelector(".hp i");
  node.addEventListener("click", () => {
    state.selectedUnitId = unit.id;
    showToast(`Scouting #${unit.number} ${unit.name}`);
    render();
  });
}

function unitTitle(unit) {
  const s = unit.stats;
  return `#${unit.number} ${unit.name} (${unit.role.name}) — ${gangs[unit.team].name}. HP ${Math.max(0, Math.round(unit.hp))}/${unit.maxHp}. ${s.kos} KO, ${s.damage} damage, ${s.heals} healed.`;
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
  state.selectedUnitId = "";
  if (isTvMode) {
    state.autoNext = true;
    state.speed = Math.max(state.speed, 1.55);
    el.autoNextButton.textContent = "Auto Next On";
    el.speedGroup.querySelectorAll("button").forEach((node) => node.classList.toggle("active", Number(node.dataset.speed) === 1.55));
  }
  const fixture = currentFixture();
  gangs = fixture ? [gangPool[fixture[0]], gangPool[fixture[1]]] : [gangPool[0], gangPool[1]];
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
  el.matchTitle.textContent = matchTitle();
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
  recordMove(state.league.phase === "playoffs" ? "BOWL" : "V6", state.league.phase === "playoffs" ? "win or go home" : "league slate armed");
  showToast(state.league.phase === "champion" ? `${state.league.champion} are champions` : "30 vs 30. League match is live.");
  render();
  state.match += 1;
}

function matchTitle() {
  if (state.league.phase === "regular") {
    return `Day ${state.league.day + 1} Clash ${state.league.slot + 1}`;
  }
  if (state.league.phase === "playoffs") {
    return state.league.playoffSlot < 2 ? `Nouns Bowl Semifinal ${state.league.playoffSlot + 1}` : "Nouns Bowl Final";
  }
  return `${state.league.champion} champions`;
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
      const before = friend.hp;
      friend.hp = Math.min(friend.maxHp, friend.hp + 15);
      unit.stats.heals += Math.round(friend.hp - before);
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
    unit.stats.specials += 1;
    dealDamage(unit, target, 7);
    recordMove(gangs[unit.team].short, `${unit.name} breakaway dash`);
    pop(unit.x, unit.y - 28, "dash", gangs[unit.team].accent);
    if (target.hp <= 0) downUnit(target, unit, d);
    return true;
  }

  if (unit.role.name === "bonker" && d < 48) {
    const enemies = nearbyUnits(unit, 1 - unit.team, 58).slice(0, 4);
    enemies.forEach((enemy) => {
      dealDamage(unit, enemy, 9);
      enemy.stunned = Math.max(enemy.stunned, 34);
      spark(enemy.x, enemy.y);
      pop(enemy.x, enemy.y - 24, "slam", gangs[unit.team].color);
      if (enemy.hp <= 0) downUnit(enemy, unit, distance(unit, enemy));
    });
    unit.cooldown = 44;
    unit.special = rand(260, 380);
    unit.stats.specials += 1;
    recordMove(gangs[unit.team].short, `${unit.name} noggles slam`);
    return true;
  }

  if (unit.role.name === "slinger" && d < 150) {
    const enemies = nearbyUnits(target, 1 - unit.team, 50).slice(0, 5);
    enemies.forEach((enemy) => {
      dealDamage(unit, enemy, 8);
      spark(enemy.x, enemy.y);
      if (enemy.hp <= 0) downUnit(enemy, unit, distance(unit, enemy));
    });
    unit.cooldown = 40;
    unit.special = rand(250, 360);
    unit.stats.specials += 1;
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
    unit.stats.specials += 1;
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
      unit.stats.specials += 1;
      unit.stats.heals += fallen.hp;
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
  const dealt = dealDamage(unit, target, Math.max(1, Math.round(damage * guarded)));
  unit.stats.hits += 1;
  unit.cooldown = unit.role.cadence + rand(-8, 10);
  unit.node.classList.add("strike");
  unit.node.style.setProperty("--tilt", `${unit.team === 0 ? 8 : -8}deg`);
  setTimeout(() => unit.node?.classList.remove("strike"), 140);
  spark(target.x, target.y);
  pop(target.x, target.y - 25, crit ? `${dealt}!` : `${dealt}`, unit.team === 0 ? gangs[0].color : gangs[1].color);

  if (target.hp <= 0) {
    downUnit(target, unit, d);
  } else if (crit) {
    addOccasionalLog(`${unit.name} lands a clean hit on ${target.name}.`);
  }
}

function dealDamage(unit, target, amount) {
  const dealt = Math.max(0, Math.min(Math.round(amount), Math.ceil(target.hp)));
  target.hp -= dealt;
  unit.stats.damage += dealt;
  return dealt;
}

function downUnit(target, attacker, d) {
  if (target.down) return;
  target.down = true;
  target.hp = 0;
  target.node.classList.add("down");
  target.node.style.zIndex = "3";
  target.stats.deaths += 1;
  attacker.stats.kos += 1;
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
    const matchStars = matchStarLines();
    applyLeagueResult(winner, loser, left, right);
    state.finished = true;
    state.running = false;
    el.pauseButton.textContent = "Replay";
    el.matchTitle.textContent = state.league.phase === "champion" ? `${gangs[winner].name} win the Nouns Bowl` : `${gangs[winner].name} win`;
    addLog(`${gangs[winner].name} hold the open field with ${aliveUnits(winner).length} still standing.`);
    matchStars.forEach((line) => addLog(line));
    showToast(state.autoNext ? `${gangs[winner].name} win. Next match soon.` : `${gangs[winner].name} win the match`);
    if (state.autoNext) {
      state.nextTimer = setTimeout(resetMatch, 3200);
    }
  }
}

function matchStarLines() {
  const damage = statLeader("damage");
  const kos = statLeader("kos");
  const heals = statLeader("heals");
  return [
    damage ? `Damage star: #${damage.number} ${gangs[damage.team].short} ${damage.name} with ${damage.stats.damage}.` : "",
    kos ? `KO star: #${kos.number} ${gangs[kos.team].short} ${kos.name} with ${kos.stats.kos}.` : "",
    heals?.stats.heals ? `Mint star: #${heals.number} ${gangs[heals.team].short} ${heals.name} healed ${heals.stats.heals}.` : "",
  ].filter(Boolean);
}

function applyLeagueResult(winnerSide, loserSide, leftAlive, rightAlive) {
  if (state.league.phase === "champion") return;
  const winnerGang = gangs[winnerSide];
  const loserGang = gangs[loserSide];
  const phaseLabel = state.league.phase === "regular"
    ? `Day ${state.league.day + 1}, slate ${state.league.slot + 1}`
    : state.league.playoffSlot < 2 ? `Nouns Bowl semifinal ${state.league.playoffSlot + 1}` : "Nouns Bowl final";
  const winnerAlive = winnerSide === 0 ? leftAlive : rightAlive;
  const loserAlive = loserSide === 0 ? leftAlive : rightAlive;
  const winnerScore = Math.max(1, winnerAlive);
  const loserScore = Math.max(0, 30 - winnerAlive);
  const winnerRow = state.league.table[winnerGang.name];
  const loserRow = state.league.table[loserGang.name];
  const close = winnerScore - loserScore <= 6;

  winnerRow.wins += 1;
  winnerRow.pf += winnerScore;
  winnerRow.pa += loserScore;
  winnerRow.streak = Math.max(1, winnerRow.streak + 1);
  winnerRow.fans = Math.min(99, winnerRow.fans + (state.league.phase === "playoffs" ? 9 : close ? 5 : 3));
  winnerRow.last = "W";

  loserRow.losses += 1;
  loserRow.pf += loserScore;
  loserRow.pa += winnerScore;
  loserRow.streak = Math.min(-1, loserRow.streak - 1);
  loserRow.fans = Math.max(10, loserRow.fans + (close ? 1 : -2));
  loserRow.last = "L";

  addRecap(`${phaseLabel}: ${winnerGang.short} beat ${loserGang.short}, ${winnerScore}-${loserScore}.`);
  advanceLeague(winnerGang.name, loserGang.name);
  saveLeague();
}

function addRecap(text) {
  state.league.recaps ||= [];
  state.league.recaps.unshift(text);
  state.league.recaps = state.league.recaps.slice(0, 6);
}

function advanceLeague(winnerName) {
  const league = state.league;
  if (league.phase === "regular") {
    league.slot += 1;
    if (league.slot >= DAILY_SLOTS) {
      league.slot = 0;
      league.day += 1;
    }
    if (league.day >= LEAGUE_DAYS) {
      seedPlayoffs();
    }
    return;
  }

  if (league.phase === "playoffs") {
    league.playoffs[league.playoffSlot].winner = winnerName;
    league.playoffSlot += 1;
    if (league.playoffSlot === 2) {
      const first = gangPool.findIndex((gang) => gang.name === league.playoffs[0].winner);
      const second = gangPool.findIndex((gang) => gang.name === league.playoffs[1].winner);
      league.playoffs[2] = [first, second];
    }
    if (league.playoffSlot >= 3) {
      league.phase = "champion";
      league.champion = winnerName;
      league.playoffSlot = 2;
      state.autoNext = false;
      el.autoNextButton.textContent = "Auto Next Off";
      addLog(`${winnerName} lift the Nouns Bowl trophy after a two-week league run.`);
    }
  }
}

function seedPlayoffs() {
  const seeds = standings().slice(0, 4).map((row) => gangPool.findIndex((gang) => gang.name === row.gang.name));
  state.league.phase = "playoffs";
  state.league.day = LEAGUE_DAYS - 1;
  state.league.slot = DAILY_SLOTS - 1;
  state.league.playoffSlot = 0;
  state.league.playoffs = [
    [seeds[0], seeds[3]],
    [seeds[1], seeds[2]],
  ];
  addLog(`Playoffs are set: ${gangPool[seeds[0]].short} vs ${gangPool[seeds[3]].short}, ${gangPool[seeds[1]].short} vs ${gangPool[seeds[2]].short}.`);
}

function quickSimCurrentMatch() {
  if (state.league.phase === "champion") {
    showToast(`${state.league.champion} already own the Bowl`);
    return;
  }
  clearTimeout(state.nextTimer);
  const fixture = currentFixture();
  if (!fixture) return;
  gangs = [gangPool[fixture[0]], gangPool[fixture[1]]];
  const [winnerSide, loserSide, winnerScore, loserScore] = simulatedScore();
  gangRecord(gangs[winnerSide].name).wins += 1;
  gangRecord(gangs[loserSide].name).losses += 1;
  gangRecord(gangs[winnerSide].name).takedowns += Math.max(8, winnerScore);
  if (state.rootingFor === gangs[winnerSide].name) {
    gangRecord(gangs[winnerSide].name).rootedWins += 1;
  }
  saveSeason();
  applyLeagueResult(winnerSide, loserSide, winnerSide === 0 ? winnerScore : loserScore, winnerSide === 1 ? winnerScore : loserScore);
  addLog(`Quick sim: ${gangs[winnerSide].name} survive ${winnerScore}-${loserScore}.`);
  showToast(`Quick sim: ${gangs[winnerSide].short} win`);
  resetMatch();
}

function simCurrentDay() {
  if (state.league.phase !== "regular") {
    quickSimCurrentMatch();
    return;
  }
  const day = state.league.day;
  let sims = 0;
  while (state.league.phase === "regular" && state.league.day === day && sims < DAILY_SLOTS) {
    quickSimCurrentMatch();
    sims += 1;
  }
  addLog(`Day ${Math.min(day + 1, LEAGUE_DAYS)} sim complete: ${sims} league matches recorded.`);
  showToast(`Day sim complete: ${sims} matches`);
  resetMatch();
}

function simulatedScore() {
  const rows = gangs.map((gang) => state.league.table[gang.name]);
  const leftPower = 50 + rows[0].wins * 4 + rows[0].fans * 0.24 + Math.random() * 42;
  const rightPower = 50 + rows[1].wins * 4 + rows[1].fans * 0.24 + Math.random() * 42;
  const winnerSide = leftPower >= rightPower ? 0 : 1;
  const loserSide = 1 - winnerSide;
  const winnerScore = Math.round(rand(17, 29));
  const loserScore = Math.max(0, Math.round(winnerScore - rand(2, 12)));
  return [winnerSide, loserSide, winnerScore, loserScore];
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
    unit.node.title = unitTitle(unit);
    unit.node.classList.toggle("guarded", unit.guard > 0 && !unit.down);
    unit.node.classList.toggle("hasted", unit.haste > 0 && !unit.down);
    unit.node.classList.toggle("stunned", unit.stunned > 0 && !unit.down);
    unit.node.classList.toggle("selected", state.selectedUnitId === unit.id);
  }

  const damageLeader = statLeader("damage");
  const koLeader = statLeader("kos");
  const healLeader = statLeader("heals");
  const liveLeader = statLeader("hp", (unit) => unit.down ? -1 : unit.morale * unit.hp);
  el.statStrip.innerHTML = `
    <div class="stat"><span>Left standing</span><strong>${left}/30</strong></div>
    <div class="stat"><span>Right standing</span><strong>${right}/30</strong></div>
    <div class="stat"><span>Damage leader</span><strong>${unitStatLine(damageLeader, "damage")}</strong></div>
    <div class="stat"><span>KO leader</span><strong>${unitStatLine(koLeader, "kos")}</strong></div>
    <div class="stat"><span>Heal leader</span><strong>${unitStatLine(healLeader, "heals")}</strong></div>
    <div class="stat"><span>Hot noun</span><strong>${unitStatLine(liveLeader, "live")}</strong></div>
  `;
  el.moveFeed.innerHTML = state.moveHistory
    .slice(0, 4)
    .map((move) => `<span><b>${move.tag}</b>${move.text}</span>`)
    .join("");
  renderLeague();
  renderRooting(left, right);
  renderScout();
  renderTv(left, right);
}

function renderTv(left, right) {
  if (!isTvMode) return;
  const league = state.league;
  el.tvClock.textContent = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
  el.tvLeftGang.textContent = `${gangs[0].short} · ${gangs[0].name}`;
  el.tvLeftAlive.textContent = left;
  el.tvRightGang.textContent = `${gangs[1].short} · ${gangs[1].name}`;
  el.tvRightAlive.textContent = right;
  el.tvLeagueLine.textContent = tvLeagueLine();
  el.tvMatchup.textContent = currentFixtureLabel();
  if (league.phase === "champion") {
    el.tvMatchState.textContent = `${league.champion} own the Nouns Bowl`;
  } else if (state.finished) {
    const leader = left === right ? "Drawn field" : left > right ? `${gangs[0].short} win` : `${gangs[1].short} win`;
    el.tvMatchState.textContent = `${leader} · final ${left}-${right}`;
  } else {
    el.tvMatchState.textContent = `${left + right} Nouns live · ${state.weather === "dust" ? "dust field" : "open field"}`;
  }
  el.tvPath.textContent = tvPathLine();
}

function tvLeagueLine() {
  const league = state.league;
  if (league.phase === "regular") {
    return `Day ${league.day + 1} / ${LEAGUE_DAYS} · Slate ${league.slot + 1} of ${DAILY_SLOTS}`;
  }
  if (league.phase === "playoffs") {
    return league.playoffSlot < 2 ? `Nouns Bowl · Semifinal ${league.playoffSlot + 1}` : "Nouns Bowl · Final";
  }
  return "Nouns Bowl Champion";
}

function tvPathLine() {
  const league = state.league;
  if (league.phase === "champion") {
    const recap = (league.recaps || [])[0];
    return `${league.champion} are champions${recap ? ` · ${recap}` : ""}`;
  }
  if (league.phase === "playoffs" && league.playoffs.length) {
    return league.playoffs
      .map((pair, index) => {
        const label = index < 2 ? `Semi ${index + 1}` : "Bowl";
        const left = gangPool[pair[0]]?.short || "?";
        const right = gangPool[pair[1]]?.short || "?";
        const winner = pair.winner ? ` -> ${gangPool.find((gang) => gang.name === pair.winner)?.short || "W"}` : "";
        return `${label}: ${left} vs ${right}${winner}`;
      })
      .join(" · ");
  }
  return standings()
    .slice(0, 4)
    .map((row, index) => `${index + 1}. ${row.gang.short} ${row.wins}-${row.losses}`)
    .join(" · ");
}

function statLeader(key, score = (unit) => unit.stats[key]) {
  return [...state.units].sort((a, b) => score(b) - score(a) || b.stats.kos - a.stats.kos || a.number - b.number)[0] || null;
}

function unitStatLine(unit, key) {
  if (!unit) return "none";
  const value = key === "live" ? `${Math.max(0, Math.round(unit.hp))} hp` : `${unit.stats[key]} ${key === "kos" ? "KO" : key}`;
  return `#${unit.number} ${gangs[unit.team].short} ${unit.name} · ${value}`;
}

function renderLeague() {
  const league = state.league;
  const rows = standings();
  el.leaguePhase.textContent = league.phase === "regular" ? "Two Week League" : league.phase === "playoffs" ? "Nouns Bowl Playoffs" : "Nouns Bowl Champion";
  el.leagueDay.textContent = league.phase === "regular" ? `Day ${league.day + 1} / ${LEAGUE_DAYS}` : league.phase === "playoffs" ? `Playoff ${league.playoffSlot + 1} / 3` : state.league.champion;
  el.leagueSlate.textContent = league.phase === "regular" ? `Slate ${league.slot + 1} of ${DAILY_SLOTS}` : league.phase === "playoffs" ? (league.playoffSlot < 2 ? "Semifinal" : "Superbowl") : "Season complete";
  el.leagueMatchup.textContent = currentFixtureLabel();
  el.standings.innerHTML = rows.map((row, index) => {
    const diff = row.pf - row.pa;
    const rooted = state.rootingFor === row.gang.name ? " rooted" : "";
    const streak = row.streak > 0 ? `W${row.streak}` : row.streak < 0 ? `L${Math.abs(row.streak)}` : "-";
    return `
      <div class="standing${rooted}" style="--team:${row.gang.color}">
        <b>${index + 1}</b>
        <strong>${row.gang.short}</strong>
        <span>${row.wins}-${row.losses}</span>
        <span>${diff >= 0 ? "+" : ""}${diff}</span>
        <span>${streak}</span>
        <span>${row.fans} fans</span>
      </div>
    `;
  }).join("");
  renderBracket(rows);
}

function renderBracket(rows) {
  const league = state.league;
  const seeds = rows.slice(0, 4).map((row, index) => `${index + 1}. ${row.gang.short}`);
  const playoffLines = league.playoffs.length
    ? league.playoffs.map((pair, index) => {
      const label = index < 2 ? `Semi ${index + 1}` : "Nouns Bowl";
      const left = gangPool[pair[0]]?.short || "?";
      const right = gangPool[pair[1]]?.short || "?";
      const winner = pair.winner ? ` -> ${gangPool.find((gang) => gang.name === pair.winner)?.short || pair.winner}` : "";
      return `<span>${label}: <b>${left}</b> vs <b>${right}</b>${winner}</span>`;
    })
    : seeds.map((seed) => `<span>Seed ${seed}</span>`);
  const recaps = (league.recaps || []).slice(0, 3).map((text) => `<em>${text}</em>`).join("");
  el.bracket.innerHTML = `
    <div class="bracket-head">
      <span>Nouns Bowl Path</span>
      <strong>${league.phase === "champion" ? league.champion : league.phase === "playoffs" ? "Playoffs live" : "Top four advance"}</strong>
    </div>
    <div class="bracket-grid">${playoffLines.join("")}</div>
    <div class="recap-strip">${recaps || "<em>No league results yet.</em>"}</div>
  `;
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

function renderScout() {
  const selected = state.units.find((unit) => unit.id === state.selectedUnitId) || statLeader("damage") || state.units[0];
  if (!selected) return;
  const s = selected.stats;
  const hp = Math.max(0, Math.round(selected.hp));
  el.scoutName.textContent = `#${selected.number} ${selected.name}`;
  el.scoutCard.innerHTML = `
    <img alt="${selected.name}" src="${selected.asset}" />
    <div>
      <b>${gangs[selected.team].name}</b>
      <span>${selected.role.name} / ${selected.role.move}</span>
      <span>${hp}/${selected.maxHp} HP · ${selected.down ? "down" : "active"}</span>
      <span>${s.kos} KO · ${s.damage} dmg · ${s.heals} heal · ${s.specials} specials</span>
    </div>
  `;
  const performers = [...state.units]
    .sort((a, b) => (b.stats.damage + b.stats.kos * 30 + b.stats.heals * 0.6) - (a.stats.damage + a.stats.kos * 30 + a.stats.heals * 0.6))
    .slice(0, 8);
  el.rosterList.innerHTML = performers.map((unit) => `
    <button class="${unit.id === selected.id ? "active" : ""}" data-unit-id="${unit.id}" type="button">
      <b>#${unit.number} ${gangs[unit.team].short}</b>
      <span>${unit.name}</span>
      <span>${unit.stats.damage} dmg / ${unit.stats.kos} KO</span>
    </button>
  `).join("");
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
el.quickSimButton.addEventListener("click", quickSimCurrentMatch);
el.simDayButton.addEventListener("click", simCurrentDay);
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
el.resetLeagueButton.addEventListener("click", () => {
  clearTimeout(state.nextTimer);
  state.league = createLeague();
  saveLeague();
  addLog("A fresh two-week league begins.");
  showToast("League reset: Day 1");
  resetMatch();
});
el.rootLeftButton.addEventListener("click", () => setRooting(0));
el.rootRightButton.addEventListener("click", () => setRooting(1));
el.rosterList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-unit-id]");
  if (!button) return;
  state.selectedUnitId = button.dataset.unitId;
  render();
});

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

window.addEventListener("keydown", (event) => {
  if (!isTvMode) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
  const key = event.key.toLowerCase();
  if (key === " ") {
    event.preventDefault();
    el.pauseButton.click();
    flashTvHint("Space: pause/resume");
  } else if (key === "n") {
    resetMatch();
    flashTvHint("Next match");
  } else if (key === "q") {
    quickSimCurrentMatch();
    flashTvHint("Quick sim");
  } else if (key === "d") {
    simCurrentDay();
    flashTvHint("Day sim");
  } else if (key === "r") {
    el.resetLeagueButton.click();
    flashTvHint("League reset");
  }
});

function flashTvHint(text) {
  if (!isTvMode) return;
  el.tvCastHint.textContent = text;
  el.tvCastHint.classList.add("flash");
  clearTimeout(el.tvCastHint.timer);
  el.tvCastHint.timer = setTimeout(() => {
    el.tvCastHint.textContent = "Space pause · N next · Q quick sim · D sim day · R reset";
    el.tvCastHint.classList.remove("flash");
  }, 1200);
}

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
