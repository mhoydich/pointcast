let teamNames = ["Gold Nouns", "Sky Nouns"];
const exhibitionTeamNames = ["Gold Nouns", "Sky Nouns"];
const players = [
  { name: "Noun 17", team: 0, slot: 0, x: "32%", y: "78%", avatar: "assets/noun-0.svg" },
  { name: "Noun 28", team: 0, slot: 1, x: "68%", y: "70%", avatar: "assets/noun-1.svg" },
  { name: "Noun 4", team: 1, slot: 0, x: "32%", y: "30%", avatar: "assets/noun-2.svg" },
  { name: "Noun 21", team: 1, slot: 1, x: "68%", y: "22%", avatar: "assets/noun-3.svg" },
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
const watchSpeeds = {
  slow: 1.35,
  normal: 1,
  fast: 0.42,
};
const achievementList = [
  { id: "first-watch", label: "First Broadcast" },
  { id: "first-mint", label: "Card Printer" },
  { id: "underdog", label: "Upset Watcher" },
  { id: "collector-3", label: "Three Card Run" },
  { id: "speed-demon", label: "Fast Forward" },
];
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
  watchSpeed: "normal",
  spotlightTeam: "Gold Nouns",
  tomorrowVisible: false,
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
  shotTrace: document.querySelector("#shotTrace"),
  bounceMarker: document.querySelector("#bounceMarker"),
  landingLabel: document.querySelector("#landingLabel"),
  speedLines: document.querySelector("#speedLines"),
  ballShadow: document.querySelector("#ballShadow"),
  net: document.querySelector(".net"),
  turnTitle: document.querySelector("#turnTitle"),
  turnCopy: document.querySelector("#turnCopy"),
  rallyStrip: document.querySelector("#rallyStrip"),
  controls: document.querySelector("#controls"),
  modeSwitch: document.querySelector("#modeSwitch"),
  difficultySwitch: document.querySelector("#difficultySwitch"),
  standings: document.querySelector("#standings"),
  leagueToday: document.querySelector("#leagueToday"),
  mintCard: document.querySelector("#mintCard"),
  teamSpotlightSelect: document.querySelector("#teamSpotlightSelect"),
  teamSpotlight: document.querySelector("#teamSpotlight"),
  tomorrowCard: document.querySelector("#tomorrowCard"),
  trophyCase: document.querySelector("#trophyCase"),
  watchSpeed: document.querySelector("#watchSpeed"),
  watchLeagueButton: document.querySelector("#watchLeagueButton"),
  mintCardButton: document.querySelector("#mintCardButton"),
  previewTomorrowButton: document.querySelector("#previewTomorrowButton"),
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
  updatePlayerPositions();
  el.teamAName.textContent = teamNames[0];
  el.teamBName.textContent = teamNames[1];
  el.scoreA.textContent = state.score[0];
  el.scoreB.textContent = state.score[1];
  el.servePill.textContent = `${state.score[state.servingTeam]}-${state.score[1 - state.servingTeam]}-${state.serverSlot + 1}`;

  el.playerEls.forEach((node, index) => {
    node.innerHTML = `<img src="${players[index].avatar}" alt="${players[index].name}" />`;
    node.style.setProperty("--x", players[index].x);
    node.style.setProperty("--y", players[index].y);
    node.classList.toggle("active", index === state.activePlayer && !state.gameOver);
  });

  const active = players[state.activePlayer];
  el.ball.style.setProperty("--x", active.x);
  el.ball.style.setProperty("--y", active.y);
  el.ballShadow.style.setProperty("--x", active.x);
  el.ballShadow.style.setProperty("--y", active.y);
  el.ballShadow.style.setProperty("--scale", "1");

  const teamName = teamNames[state.rallyTeam];
  el.turnTitle.textContent = state.gameOver ? `${teamName} win` : `${active.name} for the ${teamName}`;
  el.turnCopy.textContent = state.gameOver
    ? "Start a new match when you want another one."
    : copyForTurn();
  renderRallyStrip();

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

function updatePlayerPositions() {
  const formation = currentFormation();
  players.forEach((player, index) => {
    const spot = formation[index] || baseSpot(player.team, player.slot);
    player.x = `${spot.x}%`;
    player.y = `${spot.y}%`;
  });
}

function currentFormation() {
  if (state.leagueWatching) return kitchenFormation();
  if (state.gameOver) return celebrationFormation(state.rallyTeam);
  if (state.rallyCount === 0 && !state.lastShot) return serveFormation();
  if (state.rallyCount === 1) return returnFormation();
  if (state.rallyCount === 2) return thirdShotFormation();
  if (state.lastShot === "dink" || state.lastShot === "drop") return kitchenFormation();
  if (state.lastShot === "lob") return lobRecoveryFormation();
  return neutralRallyFormation();
}

function serveFormation() {
  const serveRight = servingSide() === "right";
  const serverX = serveRight ? 70 : 30;
  const partnerX = serveRight ? 30 : 70;
  const returnX = serveRight ? 30 : 70;
  const returnPartnerX = serveRight ? 70 : 30;
  const servingBottom = state.servingTeam === 0;
  const spots = {};
  const server = serverPlayer();
  const serverPartner = partnerOf(server);
  const receiverTeam = 1 - state.servingTeam;
  const receiver = playerIndexForSlot(receiverTeam, serveRight ? 0 : 1);
  const receiverPartner = partnerOf(receiver);

  spots[server] = { x: serverX, y: servingBottom ? 78 : 22 };
  spots[serverPartner] = { x: partnerX, y: servingBottom ? 66 : 34 };
  spots[receiver] = { x: returnX, y: servingBottom ? 18 : 82 };
  spots[receiverPartner] = { x: returnPartnerX, y: servingBottom ? 36 : 64 };
  return spots;
}

function returnFormation() {
  const spots = serveFormation();
  const returningBottom = state.rallyTeam === 0;
  players.forEach((player, index) => {
    if (player.team === state.rallyTeam) {
      spots[index] = { x: player.slot === 0 ? 31 : 69, y: returningBottom ? 61 : 39 };
    } else {
      spots[index] = { x: player.slot === 0 ? 31 : 69, y: returningBottom ? 76 : 24 };
    }
  });
  return spots;
}

function thirdShotFormation() {
  const bottomHasBall = state.rallyTeam === 0;
  const spots = {};
  players.forEach((player, index) => {
    if (player.team === state.rallyTeam) {
      spots[index] = { x: player.slot === 0 ? 30 : 70, y: bottomHasBall ? 76 : 24 };
    } else {
      spots[index] = { x: player.slot === 0 ? 31 : 69, y: bottomHasBall ? 39 : 61 };
    }
  });
  return spots;
}

function kitchenFormation() {
  const spots = {};
  players.forEach((player, index) => {
    const bottom = player.team === 0;
    const shade = index === state.activePlayer ? (bottom ? -2 : 2) : 0;
    spots[index] = { x: player.slot === 0 ? 32 : 68, y: bottom ? 62 + shade : 38 + shade };
  });
  return spots;
}

function lobRecoveryFormation() {
  const spots = {};
  players.forEach((player, index) => {
    const retreating = player.team === state.rallyTeam;
    const bottom = player.team === 0;
    const baseY = retreating ? (bottom ? 76 : 24) : (bottom ? 58 : 42);
    spots[index] = { x: player.slot === 0 ? 30 : 70, y: baseY };
  });
  return spots;
}

function neutralRallyFormation() {
  const spots = {};
  players.forEach((player, index) => {
    const bottom = player.team === 0;
    const hasBall = player.team === state.rallyTeam;
    spots[index] = {
      x: player.slot === 0 ? 30 : 70,
      y: bottom ? (hasBall ? 70 : 58) : (hasBall ? 30 : 42),
    };
  });
  return spots;
}

function celebrationFormation(winningTeam) {
  const spots = {};
  players.forEach((player, index) => {
    const bottom = player.team === 0;
    const winner = player.team === winningTeam;
    spots[index] = {
      x: player.slot === 0 ? 38 : 62,
      y: winner ? (bottom ? 66 : 34) : (bottom ? 78 : 22),
    };
  });
  return spots;
}

function renderRallyStrip() {
  const phase = rallyPhaseLabel();
  const serving = `${teamNames[state.servingTeam]} serve`;
  const server = `S${state.serverSlot + 1}`;
  const side = servingSide();
  el.rallyStrip.innerHTML = [
    `<span class="hot">${phase}</span>`,
    `<span>${serving}</span>`,
    `<span>${server}</span>`,
    `<span>${side} box</span>`,
  ].join("");
}

function rallyPhaseLabel() {
  if (state.gameOver) return "match";
  if (state.rallyCount === 0) return "serve";
  if (state.rallyCount === 1) return "return bounce";
  if (state.rallyCount === 2) return "third shot";
  if (state.lastShot === "dink" || state.lastShot === "drop") return "kitchen";
  if (state.lastShot === "lob") return "reset";
  return "rally";
}

function copyForTurn() {
  if (isComputerTurn()) {
    return state.busy ? "Sky Nouns are lining up the return." : "Sky Nouns are up. The computer will choose.";
  }
  if (!state.lastShot) {
    return `Serve cross-court from the ${servingSide()} box. Flow: ${flowLabel()}.`;
  }
  if (state.rallyCount === 1) return `Return must bounce before the serving side can attack. Flow: ${flowLabel()}.`;
  if (state.rallyCount === 2) return `Third shot time: drop resets the point, drive applies pressure. Flow: ${flowLabel()}.`;
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
  const nextPlayer = pickReceiverForShot(shotName, actorIndex, nextTeam);

  state.rallyCount += 1;
  addLog(`${actor.name} hits a ${shot.label.toLowerCase()}.`);
  flashReady(actorIndex);
  flashReady(nextPlayer);
  await wait(90);
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
  const phaseBonus = phaseMakeBonus(shotName);
  return clamp(shot.control - pressure * 0.22 + counterBonus - rallyBonus + flowBonus + cpuBonus + phaseBonus, 0.18, 0.96);
}

function getWinnerChance(shotName, actorTeam = state.rallyTeam) {
  const shot = shots[shotName];
  const flowBonus = actorTeam === USER_TEAM ? state.momentum * 0.045 : -state.momentum * 0.02;
  const cpuBonus = actorTeam === CPU_TEAM ? difficultySettings[state.difficulty].finish : 0;
  const phaseBonus = phaseWinnerBonus(shotName);
  return clamp(shot.power * 0.28 + state.rallyCount * 0.035 + flowBonus + cpuBonus + phaseBonus, 0.04, 0.62);
}

function phaseMakeBonus(shotName) {
  if (!state.lastShot && state.rallyCount === 0) {
    return shotName === "drive" ? 0.11 : shotName === "lob" || shotName === "smash" ? -0.24 : -0.08;
  }
  if (state.rallyCount === 1) {
    return shotName === "drive" || shotName === "lob" ? 0.07 : shotName === "dink" ? -0.18 : 0;
  }
  if (state.rallyCount === 2) {
    return shotName === "drop" ? 0.13 : shotName === "smash" ? -0.16 : 0;
  }
  if (state.lastShot === "dink" || state.lastShot === "drop") {
    return shotName === "dink" ? 0.08 : shotName === "smash" ? -0.12 : 0;
  }
  if (state.lastShot === "lob") {
    return shotName === "smash" ? 0.11 : 0;
  }
  return 0;
}

function phaseWinnerBonus(shotName) {
  if (state.rallyCount < 3 && shotName === "smash") return -0.18;
  if (state.lastShot === "lob" && shotName === "smash") return 0.16;
  if ((state.lastShot === "dink" || state.lastShot === "drop") && shotName === "dink") return -0.1;
  if (state.rallyCount === 2 && shotName === "drop") return -0.06;
  return 0;
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
  const tomorrowMatches = dailyPairings(state.league.dayIndex + 1).map(([home, away], slot) => ({
    ...simulateLeagueMatch(state.league.dayIndex + 1, slot, leagueTeams[home], leagueTeams[away]),
    homeName: leagueTeams[home].name,
    awayName: leagueTeams[away].name,
  }));
  const spotlight = state.league.standings.find((team) => team.name === state.spotlightTeam) || state.league.standings[0];
  el.standings.innerHTML = state.league.standings.map((team, index) => `
    <div class="standing-row">
      <span>${index + 1}. ${team.name}</span>
      <strong>${team.wins}-${team.losses}</strong>
      <small>${team.pointsFor - team.pointsAgainst >= 0 ? "+" : ""}${team.pointsFor - team.pointsAgainst}</small>
    </div>
  `).join("");
  el.teamSpotlightSelect.innerHTML = leagueTeams.map((team) => `
    <option value="${team.name}" ${team.name === state.spotlightTeam ? "selected" : ""}>${team.name}</option>
  `).join("");
  el.teamSpotlight.innerHTML = spotlight ? `
    <strong>${spotlight.name}</strong>
    <div>${spotlight.wins}-${spotlight.losses} record</div>
    <div>${spotlight.pointsFor} scored / ${spotlight.pointsAgainst} allowed</div>
    <div>${streakLabel(spotlight.streak)}</div>
  ` : "";
  el.leagueToday.innerHTML = state.league.todayMatches.map((match, index) => `
    <button class="league-match ${index === 0 ? "featured" : ""}" data-match="${index}">
      <span>${match.homeName}</span>
      <strong>${match.homeScore}-${match.awayScore}</strong>
      <span>${match.awayName}</span>
    </button>
  `).join("");
  [...el.watchSpeed.querySelectorAll("button")].forEach((button) => {
    const isActive = button.dataset.speed === state.watchSpeed;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  const minted = getMintedCards();
  const alreadyMinted = feature && minted.some((card) => card.id === feature.id);
  el.mintCard.innerHTML = feature ? `
    <p>${feature.homeName} vs ${feature.awayName}</p>
    <strong>${feature.homeScore}-${feature.awayScore}</strong>
    <small>${alreadyMinted ? "Minted in local collection" : "Mint today's match card"}</small>
    <small>${minted.length} card${minted.length === 1 ? "" : "s"} collected</small>
  ` : "<p>League is warming up.</p>";
  el.tomorrowCard.innerHTML = state.tomorrowVisible ? tomorrowMatches.map((match) => `
    <div class="tomorrow-row">
      <span>${match.homeName}</span>
      <strong>${match.homeScore}-${match.awayScore}</strong>
      <span>${match.awayName}</span>
    </div>
  `).join("") : "<p>Tap Tomorrow to peek at the next slate.</p>";
  el.trophyCase.innerHTML = achievementList.map((achievement) => `
    <span class="${hasAchievement(achievement.id) ? "unlocked" : ""}">${achievement.label}</span>
  `).join("");
  el.mintCardButton.disabled = !feature || alreadyMinted;
  el.watchLeagueButton.disabled = state.busy || state.leagueWatching || !feature;
  el.previewTomorrowButton.classList.toggle("active", state.tomorrowVisible);
}

async function watchLeagueMatch(matchIndex = 0) {
  if (state.busy || state.leagueWatching || !state.league?.todayMatches[matchIndex]) return;
  clearCpuTimer();
  const match = state.league.todayMatches[matchIndex];
  state.leagueWatching = true;
  unlockAchievement("first-watch");
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
    await animateShot(state.activePlayer, pickTeammate(1 - point.team), shotName, point.final ? "winner" : "rally", watchSpeeds[state.watchSpeed]);
    if (point.final) {
      state.score[point.team] += 1;
      flashScore(point.team);
      showToast("Point!");
      addLog(`${teamNames[point.team]} win a ${shotName}.`);
      await wait(260 * watchSpeeds[state.watchSpeed]);
    }
  }

  state.score = [match.homeScore, match.awayScore];
  state.leagueWatching = false;
  state.busy = false;
  state.gameOver = true;
  state.rallyTeam = match.homeScore > match.awayScore ? 0 : 1;
  state.activePlayer = firstPlayerForTeam(state.rallyTeam);
  addLog(`${teamNames[state.rallyTeam]} take the daily match ${state.score[0]}-${state.score[1]}.`);
  if (isUpset(match)) unlockAchievement("underdog");
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
  unlockAchievement("first-mint");
  if (minted.length >= 3) unlockAchievement("collector-3");
  showToast("Minted!");
  addLog(`Minted local card: ${feature.homeName} ${feature.homeScore}-${feature.awayScore} ${feature.awayName}.`);
  renderLeague();
}

function streakLabel(streak) {
  if (streak > 1) return `${streak} match win streak`;
  if (streak === 1) return "Won last match";
  if (streak < -1) return `${Math.abs(streak)} match slide`;
  if (streak === -1) return "Lost last match";
  return "Even form";
}

function isUpset(match) {
  const home = leagueTeams.find((team) => team.name === match.homeName);
  const away = leagueTeams.find((team) => team.name === match.awayName);
  if (!home || !away) return false;
  const winnerRating = match.homeScore > match.awayScore ? home.rating : away.rating;
  const loserRating = match.homeScore > match.awayScore ? away.rating : home.rating;
  return winnerRating + 4 < loserRating;
}

function getAchievements() {
  try {
    return JSON.parse(localStorage.getItem("noun-pickleball-achievements") || "[]");
  } catch {
    return [];
  }
}

function hasAchievement(id) {
  return getAchievements().includes(id);
}

function unlockAchievement(id) {
  const achievements = getAchievements();
  if (achievements.includes(id)) return;
  achievements.push(id);
  localStorage.setItem("noun-pickleball-achievements", JSON.stringify(achievements));
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
  node.classList.remove("ready", "recover", "swing", "smash-swing", "dink-swing", "lob-swing");
  void node.offsetWidth;
  const className = shotName === "smash" ? "smash-swing" : shotName === "dink" || shotName === "drop" ? "dink-swing" : shotName === "lob" ? "lob-swing" : "swing";
  node.classList.add(className);
  window.setTimeout(() => node.classList.remove(className), 560);
}

function flashReady(index) {
  const node = el.playerEls[index];
  node.classList.remove("ready");
  void node.offsetWidth;
  node.classList.add("ready");
  window.setTimeout(() => node.classList.remove("ready"), 240);
}

function flashRecover(index) {
  const node = el.playerEls[index];
  node.classList.remove("recover");
  void node.offsetWidth;
  node.classList.add("recover");
  window.setTimeout(() => node.classList.remove("recover"), 360);
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

function animateShot(fromIndex, toIndex, shotName, result, speed = 1) {
  const from = players[fromIndex];
  const to = players[toIndex];
  const landing = shotLanding(fromIndex, toIndex, shotName, result);
  const apex = shotApex(from, landing, shotName, result);
  const tuning = shotAnimationTuning(shotName, result);
  const midpoint = {
    x: `${(parseFloat(from.x) + landing.x) / 2}%`,
    y: `${apex.y}%`,
  };
  const baseDuration = tuning.duration;
  const duration = baseDuration * speed;
  const scale = tuning.apexScale;
  const spin = ` rotate(${tuning.spin}deg)`;
  const fromX = Number(from.x.replace("%", ""));
  const fromY = Number(from.y.replace("%", ""));
  const holdPoint = {
    x: `${fromX + (landing.x - fromX) * 0.15}%`,
    y: `${fromY + (landing.y - fromY) * 0.15}%`,
  };
  const latePoint = {
    x: `${fromX + (landing.x - fromX) * 0.78}%`,
    y: `${fromY + (landing.y - fromY) * 0.78 + tuning.lateLift}%`,
  };

  el.ball.style.setProperty("--x", from.x);
  el.ball.style.setProperty("--y", from.y);
  el.ballShadow.style.setProperty("--x", from.x);
  el.ballShadow.style.setProperty("--y", from.y);
  el.ballShadow.style.setProperty("--scale", "1");
  showShotTrace(from, landing);
  showSpeedLines(from, landing, shotName);
  el.ball.classList.add("in-flight", `shot-${shotName}`);
  el.court.classList.add("rally-glow");
  window.setTimeout(() => el.court.classList.remove("rally-glow"), 520);
  if (shotName === "smash" || result === "winner") {
    el.court.classList.add("impact");
  }
  if (result === "fault" && shotName === "smash") {
    rippleNet();
  }

  const shadowAnimation = el.ballShadow.animate([
    { left: from.x, top: from.y, transform: "translate(-50%, -18%) scale(1)", opacity: 0.66, offset: 0 },
    { left: midpoint.x, top: `${Math.min(88, Math.max(12, landing.y + (from.team === 0 ? 10 : -10)))}%`, transform: `translate(-50%, -18%) scale(${tuning.shadowScale})`, opacity: tuning.shadowOpacity, offset: 0.52 },
    { left: `${landing.x}%`, top: `${landing.y}%`, transform: "translate(-50%, -18%) scale(1.08)", opacity: 0.72, offset: 1 },
  ], {
    duration,
    easing: "cubic-bezier(.2,.75,.22,1)",
    fill: "forwards",
  });

  const animation = el.ball.animate([
    { left: from.x, top: from.y, transform: "translate(-50%, -50%) scale(1) rotate(0deg)", filter: "brightness(1)", offset: 0 },
    { left: holdPoint.x, top: holdPoint.y, transform: `translate(-50%, -50%) scale(${tuning.windupScale}) rotate(${tuning.spin * 0.12}deg)`, filter: "brightness(1.08)", offset: 0.16 },
    { left: midpoint.x, top: midpoint.y, transform: `translate(-50%, -50%) scale(${scale})${spin}`, filter: "brightness(1.22)", offset: tuning.apexOffset },
    { left: latePoint.x, top: latePoint.y, transform: `translate(-50%, -50%) scale(${tuning.lateScale}) rotate(${tuning.spin * 1.2}deg)`, filter: "brightness(1.05)", offset: 0.84 },
    { left: `${landing.x}%`, top: `${landing.y}%`, transform: `translate(-50%, -50%) scale(${tuning.landScale}) rotate(${tuning.spin * 1.45}deg)`, filter: "brightness(1)", offset: 1 },
  ], {
    duration,
    easing: tuning.easing,
    fill: "forwards",
  });

  return animation.finished.finally(() => {
    showBounce(landing, shotName, result);
    showLandingLabel(landing, result === "winner" ? "clean" : result === "fault" ? "miss" : shotName);
    flashRecover(toIndex);
    el.ball.style.setProperty("--x", `${landing.x}%`);
    el.ball.style.setProperty("--y", `${landing.y}%`);
    el.ballShadow.style.setProperty("--x", `${landing.x}%`);
    el.ballShadow.style.setProperty("--y", `${landing.y}%`);
    el.ballShadow.style.setProperty("--scale", "1");
    el.ball.classList.remove("in-flight", `shot-${shotName}`);
    el.court.classList.remove("impact");
    animation.cancel();
    shadowAnimation.cancel();
  });
}

function shotAnimationTuning(shotName, result) {
  const shotTuning = {
    dink: { duration: 560, apexScale: 1.06, windupScale: 0.92, lateScale: 0.98, landScale: 1, spin: 210, lateLift: 1, apexOffset: 0.58, shadowScale: 0.82, shadowOpacity: 0.46, easing: "cubic-bezier(.33,.7,.26,1)" },
    drop: { duration: 600, apexScale: 1.2, windupScale: 0.96, lateScale: 0.84, landScale: 0.95, spin: 260, lateLift: 4, apexOffset: 0.48, shadowScale: 0.58, shadowOpacity: 0.26, easing: "cubic-bezier(.2,.9,.24,1)" },
    drive: { duration: 420, apexScale: 0.92, windupScale: 0.86, lateScale: 1.08, landScale: 1, spin: 620, lateLift: 0, apexOffset: 0.44, shadowScale: 0.9, shadowOpacity: 0.58, easing: "cubic-bezier(.12,.74,.18,1)" },
    lob: { duration: 760, apexScale: 1.52, windupScale: 0.9, lateScale: 1.18, landScale: 1, spin: 420, lateLift: 8, apexOffset: 0.5, shadowScale: 0.42, shadowOpacity: 0.18, easing: "cubic-bezier(.18,.62,.3,1)" },
    smash: { duration: 330, apexScale: 0.72, windupScale: 1.12, lateScale: 1.22, landScale: 0.86, spin: 820, lateLift: 0, apexOffset: 0.36, shadowScale: 1.05, shadowOpacity: 0.66, easing: "cubic-bezier(.04,.82,.13,1)" },
  };
  const tuning = { ...shotTuning[shotName] };
  if (result === "fault") {
    tuning.duration += 90;
    tuning.landScale = 0.72;
    tuning.easing = "cubic-bezier(.18,.64,.72,.82)";
  }
  if (result === "winner") {
    tuning.duration = Math.max(280, tuning.duration - 70);
    tuning.lateScale += 0.16;
    tuning.shadowOpacity = 0.72;
  }
  return tuning;
}

function shotLanding(fromIndex, toIndex, shotName, result) {
  const from = players[fromIndex];
  const to = players[toIndex];
  if (result === "fault") return faultLanding(from, shotName);
  if (result === "winner") return winnerLanding(from, shotName);
  if (!state.lastShot && state.rallyCount === 1) return serveLanding();
  if (shotName === "dink") return { x: to.slot === 0 ? 35 : 65, y: to.team === 0 ? 58 : 42 };
  if (shotName === "drop") return { x: to.slot === 0 ? 31 : 69, y: to.team === 0 ? 60 : 40 };
  if (shotName === "lob") return { x: to.slot === 0 ? 28 : 72, y: to.team === 0 ? 80 : 20 };
  if (shotName === "smash") return { x: to.slot === 0 ? 27 : 73, y: to.team === 0 ? 76 : 24 };
  return { x: Number(to.x.replace("%", "")), y: to.team === 0 ? 72 : 28 };
}

function serveLanding() {
  const servingBottom = state.servingTeam === 0;
  const right = servingSide() === "right";
  return {
    x: right ? 31 : 69,
    y: servingBottom ? 24 : 76,
  };
}

function faultLanding(from, shotName) {
  if (shotName === "smash") return { x: 50, y: from.team === 0 ? 49 : 51 };
  if (state.rallyCount === 0) return { x: servingSide() === "right" ? 72 : 28, y: from.team === 0 ? 23 : 77 };
  return { x: from.slot === 0 ? 13 : 87, y: from.team === 0 ? 15 : 85 };
}

function winnerLanding(from, shotName) {
  if (shotName === "dink" || shotName === "drop") return { x: from.slot === 0 ? 34 : 66, y: from.team === 0 ? 43 : 57 };
  if (shotName === "lob") return { x: from.slot === 0 ? 72 : 28, y: from.team === 0 ? 14 : 86 };
  return { x: from.slot === 0 ? 73 : 27, y: from.team === 0 ? 20 : 80 };
}

function shotApex(from, landing, shotName, result) {
  if (result === "fault" && shotName === "smash") return { y: 50 };
  if (shotName === "lob") return { y: from.team === 0 ? 8 : 92 };
  if (shotName === "drop" || shotName === "dink") return { y: from.team === 0 ? 48 : 52 };
  return { y: (Number(from.y.replace("%", "")) + landing.y) / 2 + (from.team === 0 ? -9 : 9) };
}

function showShotTrace(from, landing) {
  const courtBox = el.court.getBoundingClientRect();
  const x1 = Number(from.x.replace("%", ""));
  const y1 = Number(from.y.replace("%", ""));
  const dx = (landing.x - x1) * courtBox.width / 100;
  const dy = (landing.y - y1) * courtBox.height / 100;
  el.shotTrace.style.setProperty("--x1", from.x);
  el.shotTrace.style.setProperty("--y1", from.y);
  el.shotTrace.style.setProperty("--trace-length", `${Math.hypot(dx, dy)}px`);
  el.shotTrace.style.setProperty("--trace-angle", `${Math.atan2(dy, dx)}rad`);
  el.shotTrace.classList.remove("live");
  void el.shotTrace.offsetWidth;
  el.shotTrace.classList.add("live");
}

function showSpeedLines(from, landing, shotName) {
  if (shotName === "dink" || shotName === "drop") return;
  const x1 = Number(from.x.replace("%", ""));
  const y1 = Number(from.y.replace("%", ""));
  const angle = Math.atan2(landing.y - y1, landing.x - x1);
  el.speedLines.style.setProperty("--x", `${x1 + (landing.x - x1) * 0.54}%`);
  el.speedLines.style.setProperty("--y", `${y1 + (landing.y - y1) * 0.54}%`);
  el.speedLines.style.setProperty("--angle", `${angle}rad`);
  el.speedLines.classList.remove("show");
  void el.speedLines.offsetWidth;
  el.speedLines.classList.add("show");
  window.setTimeout(() => el.speedLines.classList.remove("show"), 420);
}

function showBounce(landing, shotName, result) {
  el.bounceMarker.style.setProperty("--x", `${landing.x}%`);
  el.bounceMarker.style.setProperty("--y", `${landing.y}%`);
  el.bounceMarker.style.borderColor = result === "fault" ? "#d87363" : shotName === "lob" ? "#c8fffb" : "#d7ff3f";
  el.bounceMarker.classList.remove("show");
  void el.bounceMarker.offsetWidth;
  el.bounceMarker.classList.add("show");
  el.ball.classList.remove("squash");
  void el.ball.offsetWidth;
  el.ball.classList.add("squash");
  window.setTimeout(() => el.ball.classList.remove("squash"), 210);
  window.setTimeout(() => el.bounceMarker.classList.remove("show"), 620);
}

function showLandingLabel(landing, label) {
  el.landingLabel.textContent = label;
  el.landingLabel.style.setProperty("--x", `${landing.x}%`);
  el.landingLabel.style.setProperty("--y", `${landing.y}%`);
  el.landingLabel.classList.remove("show");
  void el.landingLabel.offsetWidth;
  el.landingLabel.classList.add("show");
  window.setTimeout(() => el.landingLabel.classList.remove("show"), 700);
}

function rippleNet() {
  el.net.classList.remove("ripple");
  void el.net.offsetWidth;
  el.net.classList.add("ripple");
  window.setTimeout(() => el.net.classList.remove("ripple"), 360);
}

function pickTeammate(team) {
  const options = players.map((player, index) => ({ player, index })).filter(({ player }) => player.team === team);
  return options[Math.floor(Math.random() * options.length)].index;
}

function pickReceiverForShot(shotName, actorIndex, nextTeam) {
  if (state.rallyCount === 0) {
    return playerIndexForSlot(nextTeam, servingSide() === "right" ? 0 : 1);
  }
  if (shotName === "dink" || shotName === "drop") {
    return closestPlayerTo(nextTeam, Number(players[actorIndex].x.replace("%", "")), nextTeam === 0 ? 62 : 38);
  }
  if (shotName === "lob") {
    return playerIndexForSlot(nextTeam, players[actorIndex].slot);
  }
  return pickTeammate(nextTeam);
}

function closestPlayerTo(team, x, y) {
  return players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.team === team)
    .sort((a, b) => distanceTo(a.player, x, y) - distanceTo(b.player, x, y))[0].index;
}

function distanceTo(player, x, y) {
  const px = Number(player.x.replace("%", ""));
  const py = Number(player.y.replace("%", ""));
  return Math.hypot(px - x, py - y);
}

function partnerOf(index) {
  return players.findIndex((player, playerIndex) => player.team === players[index].team && playerIndex !== index);
}

function playerIndexForSlot(team, slot) {
  return players.findIndex((player) => player.team === team && player.slot === slot);
}

function baseSpot(team, slot) {
  return {
    x: slot === 0 ? 32 : 68,
    y: team === 0 ? 74 : 26,
  };
}

function firstPlayerForTeam(team) {
  return players.findIndex((player) => player.team === team);
}

function serverPlayer() {
  const teamPlayers = players.map((player, index) => ({ player, index })).filter(({ player }) => player.team === state.servingTeam);
  return teamPlayers[state.serverSlot].index;
}

function servingSide() {
  return state.score[state.servingTeam] % 2 === 0 ? "right" : "left";
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
el.previewTomorrowButton.addEventListener("click", () => {
  state.tomorrowVisible = !state.tomorrowVisible;
  renderLeague();
});
el.teamSpotlightSelect.addEventListener("change", (event) => {
  state.spotlightTeam = event.target.value;
  renderLeague();
});
el.watchSpeed.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-speed]");
  if (!button) return;
  state.watchSpeed = button.dataset.speed;
  if (state.watchSpeed === "fast") unlockAchievement("speed-demon");
  renderLeague();
});
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
