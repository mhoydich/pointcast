import { readFileSync } from 'node:fs';

const files = {
  desk: readFileSync('src/pages/nouns-nation-battler.astro', 'utf8'),
  manifest: readFileSync('src/pages/nouns-nation-battler.json.ts', 'utf8'),
  game: readFileSync('public/games/nouns-nation-battler/app.js', 'utf8'),
  styles: readFileSync('public/games/nouns-nation-battler/styles.css', 'utf8'),
};

const checks = [
  ['desk shows Result Reenactor', files.desk.includes('Result Reenactor')],
  ['desk has Launch Battle Setup button', files.desk.includes('data-reenactor-launch')],
  ['desk posts reenactResult', files.desk.includes("postCommand('reenactResult'")],
  ['desk can build reenactment payload', files.desk.includes('function launchReenactment()')],
  ['manifest exposes reenactResult command', files.manifest.includes("'reenactResult'")],
  ['manifest exposes reenactment snapshot field', files.manifest.includes("'reenactment'")],
  ['manifest exposes reenactmentFields', files.manifest.includes('reenactmentFields')],
  ['manifest documents resultReenactor', files.manifest.includes('resultReenactor')],
  ['game handles reenactResult command', files.game.includes('message.command === "reenactResult"')],
  ['game snapshots reenactment metadata', files.game.includes('reenactment: state.reenactment')],
  ['game maps field weather for shapes', files.game.includes('function fieldWeatherForShape(shape)')],
  ['game applies reenactment bias', files.game.includes('function applyReenactmentBias(setup)')],
  ['game picks deterministic gangs', files.game.includes('function pickReenactmentGangs(setup)')],
  ['styles include windy reenactment weather', files.styles.includes('wind-weather')],
  ['styles include garden reenactment weather', files.styles.includes('garden-weather')],
  ['styles include auction reenactment weather', files.styles.includes('auction-weather')],
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
