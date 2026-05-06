import { readFileSync } from 'node:fs';

const files = {
  desk: readFileSync('src/pages/nouns-nation-battler.astro', 'utf8'),
  manifest: readFileSync('src/pages/nouns-nation-battler.json.ts', 'utf8'),
  agentBench: readFileSync('src/lib/nouns-battler-agent-bench.ts', 'utf8'),
  sportsSite: readFileSync('src/pages/nouns-nation-sports-reenactment.astro', 'utf8'),
  sportsGoal: readFileSync('src/pages/nouns-nation-sports-reenactment/goal.astro', 'utf8'),
  game: readFileSync('public/games/nouns-nation-battler/app.js', 'utf8'),
  styles: readFileSync('public/games/nouns-nation-battler/styles.css', 'utf8'),
};

const checks = [
  ['desk shows Result Reenactor', files.desk.includes('Result Reenactor')],
  ['desk has Launch Battle Setup button', files.desk.includes('data-reenactor-launch')],
  ['desk posts reenactResult', files.desk.includes("postCommand('reenactResult'")],
  ['desk can build reenactment payload', files.desk.includes('function launchReenactment()')],
  ['desk exposes alt sports slate', files.desk.includes('Alt Sports Slate')],
  ['desk can load alt slate items', files.desk.includes('function loadReenactorSlate(index, launch)')],
  ['manifest exposes reenactResult command', files.manifest.includes("'reenactResult'")],
  ['manifest exposes reenactment snapshot field', files.manifest.includes("'reenactment'")],
  ['manifest exposes reenactmentFields', files.manifest.includes('reenactmentFields')],
  ['manifest links sports reenactment product site', files.manifest.includes('sportsReenactment')],
  ['manifest links sports mission control', files.manifest.includes('missionControl')],
  ['manifest documents sports reenactment goals', files.manifest.includes("goals: ['watch', 'share', 'agent', 'sponsor']")],
  ['manifest documents local reenactment slate', files.manifest.includes('localSlate')],
  ['manifest documents resultReenactor', files.manifest.includes('resultReenactor')],
  ['sports site exists with product title', files.sportsSite.includes('Nouns Sports Reenactment')],
  ['sports site documents products', files.sportsSite.includes('const products =')],
  ['sports site includes broadcast kit builder', files.sportsSite.includes('Broadcast Kit Builder')],
  ['sports site can copy generated kit', files.sportsSite.includes('data-copy-kit')],
  ['sports site generates agent brief copy', files.sportsSite.includes('Agent task:')],
  ['sports site links goal room', files.sportsSite.includes('/nouns-nation-sports-reenactment/goal/')],
  ['sports goal room exists', files.sportsGoal.includes('Sports Reenactment Mission Control')],
  ['sports goal room has Mission Control text', files.sportsGoal.includes('MISSION CONTROL')],
  ['sports goal room has all goal IDs', ['watch', 'share', 'agent', 'sponsor'].every((goal) => files.sportsGoal.includes(`id: '${goal}'`))],
  ['sports goal room has all shape IDs', ['close', 'comeback', 'blowout', 'upset', 'overtime'].every((shape) => files.sportsGoal.includes(`id: '${shape}'`))],
  ['sports goal room has copyable artifacts', files.sportsGoal.includes('data-copy-artifact')],
  ['sports goal room has parallel agent lanes', files.sportsGoal.includes('Parallel Agent Initiative')],
  ['sports goal room keeps guardrails', files.sportsGoal.includes('not official replay')],
  ['Agent Bench references sports goal route', files.agentBench.includes('nouns-nation-sports-reenactment/goal')],
  ['sports site links Battle Desk', files.sportsSite.includes('/nouns-nation-battler/')],
  ['sports site keeps informational guardrail', files.sportsSite.includes('not official replay')],
  ['game handles reenactResult command', files.game.includes('message.command === "reenactResult"')],
  ['game snapshots reenactment metadata', files.game.includes('reenactment: state.reenactment')],
  ['game renders reenactment field banner', files.game.includes('function renderReenactmentBanner(left, right)')],
  ['game maps field weather for shapes', files.game.includes('function fieldWeatherForShape(shape)')],
  ['game applies reenactment bias', files.game.includes('function applyReenactmentBias(setup)')],
  ['game picks deterministic gangs', files.game.includes('function pickReenactmentGangs(setup)')],
  ['styles include windy reenactment weather', files.styles.includes('wind-weather')],
  ['styles include garden reenactment weather', files.styles.includes('garden-weather')],
  ['styles include auction reenactment weather', files.styles.includes('auction-weather')],
  ['styles include reenactment banner', files.styles.includes('.reenactment-banner')],
  ['styles include TV reenactment banner rules', files.styles.includes('.tv-mode .reenactment-banner')],
];

for (const shape of ['close', 'comeback', 'blowout', 'upset', 'overtime']) {
  checks.push([`desk supports ${shape} shape`, files.desk.includes(`'${shape}'`) || files.desk.includes(`value="${shape}"`)]);
  checks.push([`game supports ${shape} shape`, files.game.includes(`"${shape}"`)]);
}

const failures = checks.filter(([, passed]) => !passed);

if (failures.length) {
  console.error(`${failures.length} Nouns Battler audit checks failed:`);
  for (const [name] of failures) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`${checks.length} Nouns Battler audit checks passed`);
