import { readFileSync } from 'node:fs';

const desk = readFileSync('src/pages/nouns-nation-battler.astro', 'utf8');
const manifest = readFileSync('src/pages/nouns-nation-battler.json.ts', 'utf8');
const game = readFileSync('public/games/nouns-nation-battler/app.js', 'utf8');
const gameHtml = readFileSync('public/games/nouns-nation-battler/index.html', 'utf8');
const styles = readFileSync('public/games/nouns-nation-battler/styles.css', 'utf8');

const checks = [
  ['Pocket Cast route still present in manifest', manifest.includes('nouns-nation-battler-mobile')],
  ['desk has typed Celtics default', desk.includes('value="Celtics"')],
  ['desk has typed Knicks default', desk.includes('value="Knicks"')],
  ['desk has default 112-109 score', desk.includes('value="112-109"')],
  ['default close receipt has Celtics/Knicks source result pieces', desk.includes("next.league + ': ' + next.winner") && desk.includes('value="Celtics"') && desk.includes('value="Knicks"')],
  ['default close headline survives', desk.includes('Celtics survive the Nouns reenactment')],
  ['default close survivor finish is 11-8', desk.includes('11-8 survivor finish')],
  ['guardrail copy remains present', desk.includes('Informational alt-broadcast receipt, not an official replay.')],
  ['alt sports slate is available', desk.includes('Alt Sports Slate')],
  ['alt sports slate has five launch presets', (desk.match(/data-reenactor-slate=/g) || []).length === 5],
  ['slate includes WNBA comeback preset', desk.includes("winner: 'Aces'") && desk.includes("shape: 'comeback'")],
  ['slate includes EPL upset preset', desk.includes("winner: 'Brighton'") && desk.includes("shape: 'upset'")],
  ['close maps to Windy kingdom rush', desk.includes("field = 'Windy kingdom rush'")],
  ['blowout maps to Lava lane rout', desk.includes("field = 'Lava lane rout'")],
  ['overtime maps to Rift overtime field', desk.includes("field = 'Rift overtime field'")],
  ['game close setup uses kingdom battle type', game.includes('shape === "close"') && game.includes('type.id === "kingdom"')],
  ['game blowout setup uses lava battle type', game.includes('shape === "blowout"') && game.includes('type.id === "lava"')],
  ['game overtime setup uses rift battle type', game.includes('shape === "overtime"') && game.includes('type.id === "rift"')],
  ['game close setup uses wind weather', game.includes('return "wind"')],
  ['game blowout setup uses heat weather', game.includes('return "heat"')],
  ['game overtime setup uses spark weather', game.includes('return "spark"')],
  ['game accepts launched reenactment command', game.includes('message.command === "reenactResult"')],
  ['game field contains reenactment banner markup', gameHtml.includes('id="reenactmentBanner"')],
  ['game updates reenactment banner from live state', game.includes('renderReenactmentBanner(left, right)')],
  ['game banner includes alive score', game.includes('alive ·')],
  ['styles include mobile-safe reenactment banner', styles.includes('.mobile-mode .reenactment-banner')],
  ['styles include TV-safe reenactment banner', styles.includes('.tv-mode .reenactment-banner')],
];

const failures = checks.filter(([, passed]) => !passed);

if (failures.length) {
  console.error(`${failures.length} Pocket Cast / reenactment QA checks failed:`);
  for (const [name] of failures) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`${checks.length} Pocket Cast / reenactment QA checks passed`);
