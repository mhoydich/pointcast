let teamNames = ["Gold Nouns", "Sky Nouns"];
const exhibitionTeamNames = ["Gold Nouns", "Sky Nouns"];
const players = [
  { name: "Noun 17", team: 0, x: "31%", y: "72%", avatar: "assets/noun-0.svg" },
  { name: "Noun 28", team: 0, x: "68%", y: "78%", avatar: "assets/noun-1.svg" },
  { name: "Noun 4", team: 1, x: "32%", y: "24%", avatar: "assets/noun-2.svg" },
  { name: "Noun 21", team: 1, x: "69%", y: "29%", avatar: "assets/noun-3.svg" },
];

const shots = {
  dink: { label: "Dink", power: 0.28, control: 0.88, counter: "lob" },
  drive: { label: "Drive", power: 0.72, control: 0.67, counter: "drop" },
  lob: { label: "Lob", power: 0.48, control: 0.72, counter: "smash" },
  drop: { label: "Drop", power: 0.36, control: 0.78, counter: "dink" },
  smash: { label: "Smash", power: 0.93, control: 0.48, counter: "drive" },
};

const USER_TEAM = 0;
const CPU_TEAM = 1;
const CPU_DELAY = 720;
const difficultySettings = {
  easy: { label: "Easy", control: -0.08, finish: -0.08, risk: 0.9 },
  normal: { label: "Normal", control: 0, finish: 0, risk: 1 },
  hard: { label: "Hard", control: 0.08, finish: 0.1, risk: 1.14 },
};
const leagueTeams = [
  { name: "Gold Nouns", rating: 83 },
  { name: "Sky Nouns", rating: 79 },
  { name: "Laser Nouns", rating: 86 },
  { name: "Garden Nouns", rating: 74 },
  { name: "Arcade Nouns", rating: 81 },
  { name: "Beach Nouns", rating: 77 },
  { name: "Moon Nouns", rating: 84 },
  { name: "Coffee Nouns", rating: 72 },
];

const state = {
  score: [0, 0],
  servingTeam: 0,
  serverSlot: 1,
  rallyTeam: 0,
  activePlayer: 0,
  lastShot: null,
  rallyCount: 0,
  gameOver: false,
  busy: false,
  mode: "computer",
  difficulty: "normal",
  momentum: 0,
  cpuTimer: null,
  leagueWatching: false,
  league: null,
};

const el = {
  scoreA: document.querySelector("#scoreA"),
  scoreB: document.querySelector("#scoreB"),
  teamAName: document.querySelector("#teamAName"),
  teamBName: document.querySelector("#teamBName"),
  servePill: document.querySelector("#servePill"),
  court: document.querySelector("#court"),
  courtToast: document.querySelector("#courtToast"),
  turnTitle: document.querySelector("#turnTitle"),
  turnCopy: document.querySelector("#turnCopy"),
  controls: document.querySelector("#controls"),
  modeSwitch: document.querySelector("#modeSwitch"),
  difficultySwitch: document.querySelector("#difficultySwitch"),
  standings: document.querySelector("#standings"),
  leagueToday: document.querySelector("#leagueToday"),
  mintCard: document.querySelector("#mintCard"),
  watchLeagueButton: document.querySelector("#watchLeagueButton"),
  mintCardButton: document.querySelector("#mintCardButton"),
  log: document.querySelector("#log"),
  ball: document.querySelector("#ball"),
  newGameButton: document.querySelector("#newGameButton"),
  teamCards: [...document.querySelectorAll(".team-score")],
  playerEls: [...document.querySelectorAll(".player")],
};

function resetGame() {
  clearCpuTimer();
  state.leagueWatching = false;
  teamNames = exhibitionTeamNames.slice();
  state.score = [0, 0];
  state.servingTeam = 0;
  state.serverSlot = 1;
  state.rallyTeam = 0;
  state.activePlayer = serverPlayer();
  state.lastShot = null;
  state.rallyCount = 0;
  state.gameOver = false;
  state.busy = false;
  state.momentum = 0;
  el.log.innerHTML = "";
  addLog(`Opening serve: Gold Nouns, second server. CPU: ${difficultySettings[state.difficulty].label}.`);
  render();
  scheduleComputerTurn();
}

function render() {
  el.teamAName.textContent = teamNames[0];
  el.teamBName.textContent = teamNames[1];
  el.scoreA.textContent = state.score[0];
  el.scoreB.textContent = state.score[1];
  el.servePill.textContent = `${state.score[state.servingTeam]}-${state.score[1 - state.servingTeam]}-${state.serverSlot + 1}`;

  el.playerEls.forEach((node, index) => {
    node.innerHTML = `<img src="${players[index].avatar}" alt="${players[index].name}" />`;
    node.classList.toggle("active", index === state.activePlayer && !state.gameOver);
  });

  const active = players[state.activePlayer];
  el.ball.style.setProperty("--x", active.x);
  el.ball.style.setProperty("--y", active.y);

  const teamName = teamNames[state.rallyTeam];
  el.turnTitle.textContent = state.gameOver ? `${teamName} win` : `${active.name} for the ${teamName}`;
  el.turnCopy.textContent = state.gameOver
    ? "Start a new match when you want another one."
    : copyForTurn();

  const bestShot = recommendedShot();
  [...el.controls.querySelectorAll("button")].forEach((button) => {
    const shot = button.dataset.shot;
    button.disabled = state.gameOver || state.busy || isComputerTurn() || state.leagueWatching;
    button.title = shotHint(shot);
    button.classList.toggle("recommended", shot === bestShot && !isComputerTurn() && !state.gameOver);
    const odds = button.querySelector(".shot-odds");
    if (odds) odds.textContent = `${Math.round(getMakeChance(shot) * 100)}% in`;
  });

  [...el.modeSwitch.querySelectorAll("button")].forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  [...el.difficultySwitch.querySelectorAll("button")].forEach((button) => {
    const isActive = button.dataset.difficulty === state.difficulty;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderLeague();
}

function copyForTurn() {
  if (isComputerTurn()) {
    return state.busy ? "Sky Nouns are lining up the return." : "Sky Nouns are up. The computer will choose.";
  }
  if (!state.lastShot) {
    return `Serve from the ${state.serverSlot === 0 ? "first" : "second"} server. Flow: ${flowLabel()}.`;
  }
  return `${teamNames[1 - state.rallyTeam]} just hit a ${shots[state.lastShot].label.toLowerCase()}. Flow: ${flowLabel()}.`;
}

function shotHint(shot) {
  const data = shots[shot];
  return `${data.label}: ${Math.round(data.control * 100)} control, ${Math.round(data.power * 100)} pressure`;
}

async function playShot(shotName, options = {}) {
  const isAuto = Boolean(options.auto);
  if (state.gameOver || state.busy || (!isAuto && isComputerTurn())) return;
  clearCpuTimer();
  state.busy = true;
  render();
  const shot = shots[shotName];
  const actorIndex = state.activePlayer;
  const actor = players[state.activePlayer];
  const makeChance = getMakeChance(shotName, actor.team);
  const roll = Math.random();
  const nextTeam = 1 - state.rallyTeam;
  const nextPlayer = pickTeammate(nextTeam);

  state.rallyCount += 1;
  addLog(`${actor.name} hits a ${shot.label.toLowerCase()}.`);
  flashPlayer(actorIndex, shotName);

  if (roll > makeChance) {
    const fault = roll > 0.92 ? "wide" : shotName === "smash" ? "into the net" : "long";
    await animateShot(actorIndex, nextPlayer, shotName, "fault");
    showToast(fault === "into the net" ? "Net!" : "Out!");
    state.busy = false;
    resolvePoint(1 - actor.team, `${actor.name}'s ${shot.label.toLowerCase()} goes ${fault}.`);
    return;
  }

  if (getWinnerChance(shotName, actor.team) > Math.random() && state.rallyCount > 2) {
    await animateShot(actorIndex, nextPlayer, shotName, "winner");
    showToast("Winner!");
    state.busy = false;
    resolvePoint(actor.team, `${actor.name} wins it with the ${shot.label.toLowerCase()}.`);
    return;
  }

  await animateShot(actorIndex, nextPlayer, shotName, "rally");
  state.lastShot = shotName;
  state.rallyTeam = nextTeam;
  state.activePlayer = nextPlayer;
  state.busy = false;
  render();
  scheduleComputerTurn();
}

function getMakeChance(shotName, actorTeam = state.rallyTeam) {
  const shot = shots[shotName];
  const pressure = state.lastShot ? shots[state.lastShot].power : 0.18;
  const counterBonus = state.lastShot && shots[state.lastShot].counter === shotName ? 0.16 : 0;
  const rallyBonus = Math.min(state.rallyCount * 0.025, 0.18);
  const flowBonus = actorTeam === USER_TEAM ? state.momentum * 0.03 : -state.momentum * 0.015;
  const cpuBonus = actorTeam === CPU_TEAM ? difficultySettings[state.difficulty].control : 0;
  return clamp(shot.control - pressure * 0.22 + counterBonus - rallyBonus + flowBonus + cpuBonus, 0.18, 0.96);
}

function getWinnerChance(shotName, actorTeam = state.rallyTeam) {
  const shot = shots[shotName];
  const flowBonus = actorTeam === USER_TEAM ? state.momentum * 0.045 : -state.momentum * 0.02;
  const cpuBonus = actorTeam === CPU_TEAM ? difficultySettings[state.difficulty].finish : 0;
  return clamp(shot.power * 0.28 + state.rallyCount * 0.035 + flowBonus + cpuBonus, 0.04, 0.62);
}

function recommendedShot() {
  return Object.keys(shots).reduce((best, shotName) => {
    const score = getMakeChance(shotName) * 0.68 + getWinnerChance(shotName) * 0.32;
    const bestScore = getMakeChance(best) * 0.68 + getWinnerChance(best) * 0.32;
    return score > bestScore ? shotName : best;
  }, "dink");
}

function updateMomentum(winningTeam) {
  state.momentum = clamp(state.momentum + (winningTeam === USER_TEAM ? 1 : -1), -3, 3);
}

function flowLabel() {
  if (state.momentum >= 2) return "heater";
  if (state.momentum === 1) return "warm";
  if (state.momentum === -1) return "shaky";
  if (state.momentum <= -2) return "ice bath";
  return "even";
}

function resolvePoint(winningTeam, reason) {
  addLog(reason);
  updateMomentum(winningTeam);
  if (winningTeam === state.servingTeam) {
    state.score[winningTeam] += 1;
    flashScore(winningTeam);
    addLog(`${teamNames[winningTeam]} score.`);
    if (hasWon(winningTeam)) {
      state.gameOver = true;
      state.rallyTeam = winningTeam;
      state.activePlayer = firstPlayerForTeam(winningTeam);
      addLog(`${teamNames[winningTeam]} take the match ${state.score[0]}-${state.score[1]}.`);
      render();
      return;
    }
  } else if (state.serverSlot === 0) {
    state.serverSlot = 1;
    addLog("Second server.");
  } else {
    state.servingTeam = 1 - state.servingTeam;
    state.serverSlot = 0;
    addLog(`Side out. ${teamNames[state.servingTeam]} serve.`);
  }

  state.rallyTeam = state.servingTeam;
  state.activePlayer = serverPlayer();
  state.lastShot = null;
  state.rallyCount = 0;
  render();
  scheduleComputerTurn();
}

function buildLeague() {
  const today = new Date();
  const dayKey = localDayKey(today);
  const dayIndex = daysSince("2026-04-27", dayKey);
  const standings = leagueTeams.map((team) => ({
    ...team,
    played: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    streak: 0,
  }));
  const matchesByDay = [];

  for (let day = 0; day <= Math.max(dayIndex, 0); day += 1) {
    const matches = dailyPairings(day).map(([home, away], slot) => {
      const match = simulateLeagueMatch(day, slot, leagueTeams[home], leagueTeams[away]);
      applyLeagueMatch(standings, home, away, match);
      return {
        ...match,
        id: `${dateFromStart(day)}-${slot}`,
        day,
        home,
        away,
        homeName: leagueTeams[home].name,
        awayName: leagueTeams[away].name,
      };
    });
    matchesByDay.push(matches);
  }

  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    return diffB - diffA || b.rating - a.rating;
  });

  return {
    dayKey,
    dayIndex: Math.max(dayIndex, 0),
    standings,
    todayMatches: matchesByDay[Math.max(dayIndex, 0)] || [],
  };
}

function dailyPairings(day) {
  const order = [0, 1, 2, 3, 4, 5, 6, 7];
  const shift = day % order.length;
  const rotated = order.slice(shift).concat(order.slice(0, shift));
  if (day % 2 === 1) rotated.reverse();
  return [
    [rotated[0], rotated[7]],
    [rotated[1], rotated[6]],
    [rotated[2], rotated[5]],
    [rotated[3], rotated[4]],
  ];
}

function simulateLeagueMatch(day, slot, home, away) {
  const rng = seededRandom(hashString(`${day}:${slot}:${home.name}:${away.name}`));
  const edge = (home.rating - away.rating) / 55;
  const homeScore = 7 + Math.floor(rng() * 5);
  let awayScore = Math.max(2, Math.min(10, Math.round(homeScore - 2 - edge * 3 + rng() * 5)));
  let h = homeScore;
  let a = awayScore;
  if (a >= h) {
    h = a + 2;
  }
  if (rng() + edge < 0.35) {
    const oldH = h;
    h = Math.max(2, a - 2);
    a = oldH;
  }
  const winner = h > a ? home.name : away.name;
  return { homeScore: h, awayScore: a, winner };
}

function applyLeagueMatch(standings, homeIndex, awayIndex, match) {
  const home = standings[homeIndex];
  const away = standings[awayIndex];
  home.played += 1;
  away.played += 1;
  home.pointsFor += match.homeScore;
  home.pointsAgainst += match.awayScore;
  away.pointsFor += match.awayScore;
  away.pointsAgainst += match.homeScore;
  if (match.homeScore > match.awayScore) {
    home.wins += 1;
    away.losses += 1;
    home.streak = Math.max(1, home.streak + 1);
    away.streak = Math.min(-1, away.streak - 1);
  } else {
    away.wins += 1;
    home.losses += 1;
    away.streak = Math.max(1, away.streak + 1);
    home.streak = Math.min(-1, home.streak - 1);
  }
}

function renderLeague() {
  if (!state.league) state.league = buildLeague();
  const feature = state.league.todayMatches[0];
  el.standings.innerHTML = state.league.standings.map((team, index) => `
    <div class="standing-row">
      <span>${index + 1}. ${team.name}</span>
      <strong>${team.wins}-${team.losses}</strong>
      <small>${team.pointsFor - team.pointsAgainst >= 0 ? "+" : ""}${team.pointsFor - team.pointsAgainst}</small>
    </div>
  `).join("");
  el.leagueToday.innerHTML = state.league.todayMatches.map((match, index) => `
    <button class="league-match ${index === 0 ? "featured" : ""}" data-match="${index}">
      <span>${match.homeName}</span>
      <strong>${match.homeScore}-${match.awayScore}</strong>
      <span>${match.awayName}</span>
    </button>
  `).join("");
  const minted = getMintedCards();
  const alreadyMinted = feature && minted.some((card) => card.id === feature.id);
  el.mintCard.innerHTML = feature ? `
    <p>${feature.homeName} vs ${feature.awayName}</p>
    <strong>${feature.homeScore}-${feature.awayScore}</strong>
    <small>${alreadyMinted ? "Minted in local collection" : "Mint today's match card"}</small>
    <small>${minted.length} card${minted.length === 1 ? "" : "s"} collected</small>
  ` : "<p>League is warming up.</p>";
  el.mintCardButton.disabled = !feature || alreadyMinted;
  el.watchLeagueButton.disabled = state.busy || state.leagueWatching || !feature;
}

async function watchLeagueMatch(matchIndex = 0) {
  if (state.busy || state.leagueWatching || !state.league?.todayMatches[matchIndex]) return;
  clearCpuTimer();
  const match = state.league.todayMatches[matchIndex];
  state.leagueWatching = true;
  state.busy = true;
  state.gameOver = false;
  state.rallyCount = 0;
  state.lastShot = null;
  teamNames = [match.homeName, match.awayName];
  state.score = [0, 0];
  state.rallyTeam = 0;
  state.activePlayer = 0;
  el.log.innerHTML = "";
  addLog(`Broadcast: ${match.homeName} vs ${match.awayName}.`);
  render();

  const homePoints = match.homeScore;
  const awayPoints = match.awayScore;
  const points = buildReplayPoints(homePoints, awayPoints, match);
  for (const point of points) {
    state.rallyTeam = point.team;
    state.activePlayer = pickTeammate(point.team);
    render();
    const shotName = point.shot;
    flashPlayer(state.activePlayer, shotName);
    await animateShot(state.activePlayer, pickTeammate(1 - point.team), shotName, point.final ? "winner" : "rally");
    if (point.final) {
      state.score[point.team] += 1;
      flashScore(point.team);
      showToast("Point!");
      addLog(`${teamNames[point.team]} win a ${shotName}.`);
      await wait(260);
    }
  }

  state.score = [match.homeScore, match.awayScore];
  state.leagueWatching = false;
  state.busy = false;
  state.gameOver = true;
  state.rallyTeam = match.homeScore > match.awayScore ? 0 : 1;
  state.activePlayer = firstPlayerForTeam(state.rallyTeam);
  addLog(`${teamNames[state.rallyTeam]} take the daily match ${state.score[0]}-${state.score[1]}.`);
  render();
}

function buildReplayPoints(homeScore, awayScore, match) {
  const rng = seededRandom(hashString(`replay:${match.id}`));
  const points = [];
  let h = 0;
  let a = 0;
  const highlights = Math.min(9, homeScore + awayScore);
  while (points.filter((point) => point.final).length < highlights) {
    const team = h >= homeScore ? 1 : a >= awayScore ? 0 : rng() > 0.5 ? 0 : 1;
    if (team === 0) h += 1;
    else a += 1;
    const rallyLength = 2 + Math.floor(rng() * 4);
    for (let i = 0; i < rallyLength; i += 1) {
      points.push({
        team: i % 2 === 0 ? team : 1 - team,
        shot: ["dink", "drive", "drop", "lob", "smash"][Math.floor(rng() * 5)],
        final: i === rallyLength - 1,
      });
    }
  }
  return points;
}

function mintTodayCard() {
  const feature = state.league?.todayMatches[0];
  if (!feature) return;
  const minted = getMintedCards();
  if (minted.some((card) => card.id === feature.id)) return;
  minted.push({
    id: feature.id,
    date: state.league.dayKey,
    home: feature.homeName,
    away: feature.awayName,
    score: `${feature.homeScore}-${feature.awayScore}`,
    mintedAt: new Date().toISOString(),
  });
  localStorage.setItem("noun-pickleball-mints", JSON.stringify(minted));
  showToast("Minted!");
  addLog(`Minted local card: ${feature.homeName} ${feature.homeScore}-${feature.awayScore} ${feature.awayName}.`);
  renderLeague();
}

function getMintedCards() {
  try {
    return JSON.parse(localStorage.getItem("noun-pickleball-mints") || "[]");
  } catch {
    return [];
  }
}

function localDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysSince(start, current) {
  const startDate = new Date(`${start}T00:00:00`);
  const currentDate = new Date(`${current}T00:00:00`);
  return Math.floor((currentDate - startDate) / 86400000);
}

function dateFromStart(day) {
  const date = new Date("2026-04-27T00:00:00");
  date.setDate(date.getDate() + day);
  return localDayKey(date);
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed || 1;
  return () => {
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isComputerTurn() {
  return state.mode === "computer" && state.rallyTeam === CPU_TEAM && !state.gameOver;
}

function scheduleComputerTurn() {
  clearCpuTimer();
  if (!isComputerTurn()) return;
  state.busy = true;
  render();
  state.cpuTimer = window.setTimeout(() => {
    state.cpuTimer = null;
    state.busy = false;
    playShot(pickComputerShot(), { auto: true });
  }, CPU_DELAY);
}

function clearCpuTimer() {
  if (state.cpuTimer) {
    window.clearTimeout(state.cpuTimer);
    state.cpuTimer = null;
    return true;
  }
  return false;
}

function pickComputerShot() {
  if (!state.lastShot) {
    return weightedPick([
      ["drive", 4],
      ["drop", 3],
      ["lob", 1],
      ["dink", 2],
    ]);
  }

  const counter = shots[state.lastShot].counter;
  const pressure = shots[state.lastShot].power;
  const risk = difficultySettings[state.difficulty].risk;
  const pool = [
    [counter, 5],
    ["dink", pressure > 0.7 ? 4 : 2],
    ["drive", (state.rallyCount > 3 ? 3 : 2) * risk],
    ["drop", pressure > 0.6 ? 3 : 2],
    ["lob", state.rallyCount > 4 ? 3 : 1],
    ["smash", (state.rallyCount > 3 && pressure < 0.5 ? 2 : 1) * risk],
  ];
  return weightedPick(pool);
}

function weightedPick(pool) {
  const total = pool.reduce((sum, item) => sum + item[1], 0);
  let roll = Math.random() * total;
  for (const [value, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return pool[0][0];
}

function flashPlayer(index, shotName) {
  const node = el.playerEls[index];
  node.classList.remove("swing", "smash-swing");
  void node.offsetWidth;
  node.classList.add(shotName === "smash" ? "smash-swing" : "swing");
  window.setTimeout(() => node.classList.remove("swing", "smash-swing"), 420);
}

function flashScore(team) {
  const node = el.teamCards[team];
  node.classList.remove("score-pop");
  void node.offsetWidth;
  node.classList.add("score-pop");
  window.setTimeout(() => node.classList.remove("score-pop"), 560);
}

function showToast(message) {
  el.courtToast.textContent = message;
  el.courtToast.classList.remove("show");
  void el.courtToast.offsetWidth;
  el.courtToast.classList.add("show");
  window.setTimeout(() => el.courtToast.classList.remove("show"), 760);
}

function animateShot(fromIndex, toIndex, shotName, result) {
  const from = players[fromIndex];
  const to = players[toIndex];
  const midpoint = {
    x: `${(parseFloat(from.x) + parseFloat(to.x)) / 2}%`,
    y: arcY(from, to, shotName, result),
  };
  const duration = shotName === "smash" ? 310 : shotName === "lob" ? 620 : shotName === "dink" ? 430 : 500;
  const scale = shotName === "lob" ? 1.34 : shotName === "smash" ? 0.82 : 1.12;
  const spin = shotName === "drop" || shotName === "dink" ? " rotate(180deg)" : " rotate(360deg)";

  el.ball.style.setProperty("--x", from.x);
  el.ball.style.setProperty("--y", from.y);
  el.ball.classList.add("in-flight", `shot-${shotName}`);
  if (shotName === "smash") {
    el.court.classList.add("impact");
  }

  const animation = el.ball.animate([
    { left: from.x, top: from.y, transform: "translate(-50%, -50%) scale(1) rotate(0deg)", offset: 0 },
    { left: midpoint.x, top: midpoint.y, transform: `translate(-50%, -50%) scale(${scale})${spin}`, offset: 0.52 },
    { left: landingX(to, result), top: landingY(to, result), transform: "translate(-50%, -50%) scale(1) rotate(540deg)", offset: 1 },
  ], {
    duration,
    easing: "cubic-bezier(.2,.75,.22,1)",
    fill: "forwards",
  });

  return animation.finished.finally(() => {
    el.ball.style.setProperty("--x", landingX(to, result));
    el.ball.style.setProperty("--y", landingY(to, result));
    el.ball.classList.remove("in-flight", `shot-${shotName}`);
    el.court.classList.remove("impact");
    animation.cancel();
  });
}

function arcY(from, to, shotName, result) {
  if (result === "fault" && shotName === "smash") return "50%";
  if (shotName === "lob") return from.team === 0 ? "9%" : "91%";
  if (shotName === "drop" || shotName === "dink") return from.team === 0 ? "47%" : "53%";
  return from.team === 0 ? "36%" : "64%";
}

function landingX(player, result) {
  if (result === "fault") {
    return player.team === 0 ? "10%" : "90%";
  }
  return player.x;
}

function landingY(player, result) {
  if (result === "fault") {
    return player.team === 0 ? "88%" : "12%";
  }
  return player.y;
}

function pickTeammate(team) {
  const options = players.map((player, index) => ({ player, index })).filter(({ player }) => player.team === team);
  return options[Math.floor(Math.random() * options.length)].index;
}

function firstPlayerForTeam(team) {
  return players.findIndex((player) => player.team === team);
}

function serverPlayer() {
  const teamPlayers = players.map((player, index) => ({ player, index })).filter(({ player }) => player.team === state.servingTeam);
  return teamPlayers[state.serverSlot].index;
}

function hasWon(team) {
  return state.score[team] >= 11 && state.score[team] - state.score[1 - team] >= 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addLog(message) {
  const row = document.createElement("div");
  row.textContent = message;
  el.log.prepend(row);
  while (el.log.children.length > 6) {
    el.log.lastElementChild.remove();
  }
}

el.controls.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-shot]");
  if (button) playShot(button.dataset.shot);
});

el.newGameButton.addEventListener("click", resetGame);
el.watchLeagueButton.addEventListener("click", () => watchLeagueMatch(0));
el.mintCardButton.addEventListener("click", mintTodayCard);
el.leagueToday.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-match]");
  if (button) watchLeagueMatch(Number(button.dataset.match));
});
el.modeSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button || button.dataset.mode === state.mode) return;
  const stoppedCpu = clearCpuTimer();
  if (stoppedCpu) state.busy = false;
  state.mode = button.dataset.mode;
  addLog(state.mode === "computer" ? "Vs CPU mode on. You control Gold Nouns." : "Pass & Play mode on. Both teams are manual.");
  render();
  scheduleComputerTurn();
});
el.difficultySwitch.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-difficulty]");
  if (!button || button.dataset.difficulty === state.difficulty) return;
  state.difficulty = button.dataset.difficulty;
  addLog(`CPU set to ${difficultySettings[state.difficulty].label}.`);
  render();
});
resetGame();
