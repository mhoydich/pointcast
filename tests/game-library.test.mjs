import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const games=JSON.parse(fs.readFileSync(path.join(root,'src/data/game-catalog.json'),'utf8'));
const normalize=value=>new URL(value,'https://pointcast.xyz').pathname.replace(/\/$/,'');
const routes=new Set(games.flatMap(game=>[game.playUrl,...game.editions.map(edition=>edition.url)]).map(normalize));

test('every catalog game has a unique stable page, playable entry, controls, participation and an honest download type',()=>{
  assert.ok(games.length>30,'Catalog must cover the site, not one game shelf');
  assert.equal(new Set(games.map(game=>game.slug)).size,games.length);
  for(const game of games){
    assert.match(game.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for(const key of ['name','family','kicker','description','players','saveNote','networkNote'])assert.ok(typeof game[key]==='string'&&game[key].trim(),`${game.slug}: ${key}`);
    assert.match(game.accent,/^#[0-9a-f]{6}$/i);
    assert.ok(game.steps.length>=2,`${game.slug}: first steps`);
    assert.ok(game.controls.length,`${game.slug}: actual controls`);
    assert.ok(game.participation.length,`${game.slug}: participation path`);
    assert.ok(['local','online','prepared'].includes(game.download.kind));
    assert.ok(game.download.note.trim());
    for(const link of [game.playUrl,game.download.entry,...game.editions.map(item=>item.url),...game.participation.map(item=>item.url)]){
      assert.ok(link.startsWith('/')||link.startsWith('https://'),`${game.slug}: safe link ${link}`);
      assert.ok(!link.startsWith('//'),`${game.slug}: no protocol-relative host`);
      assert.ok(!new URL(link,'https://pointcast.xyz').username,`${game.slug}: no credentials in links`);
    }
    if(game.download.kind==='prepared')assert.ok(fs.existsSync(path.join(root,'public/downloads/games',`${game.slug}.zip`)));
    if(game.hero?.startsWith('/'))assert.ok(fs.existsSync(path.join(root,'public',game.hero)),`${game.slug}: hero exists`);
  }
});

test('all five Drum Arcade games, every Beat Runner edition, and the four Retro Arcade games stay represented',()=>{
  const drum=fs.readFileSync(path.join(root,'src/lib/drum-games.ts'),'utf8');
  const retro=fs.readFileSync(path.join(root,'src/lib/retro-arcade.ts'),'utf8');
  for(const source of [drum,retro])for(const [,route]of source.matchAll(/path:\s*'([^']+)'/g))assert.ok(routes.has(normalize(route)),`Missing game or edition: ${route}`);
});

test('every Brick Choir cabinet and the independently playable core games have a landing page',()=>{
  const choir=fs.readFileSync(path.join(root,'src/pages/brick-choir.astro'),'utf8');
  for(const [,route]of choir.matchAll(/class="cab"\s+href="([^"]+)"/g))assert.ok(routes.has(normalize(route)),`Missing cabinet: ${route}`);
  for(const route of ['/last-tag','/games/tag-signal/','/nouns-wood-chop','/agent-derby','/crystal-ball-pass/play','/crystal-ball-pass/v2','/co-games','/co-games/flow','/mascot-battler','/games/noun-pickleball/','/games/nouns-nation-battler/','/games/mossbell/index.html'])assert.ok(routes.has(normalize(route)),`Missing playable game: ${route}`);
});

test('local play entries exist in source and never advertise hosted API endpoints as local files',()=>{
  for(const game of games.filter(game=>game.download.kind==='local')){
    assert.ok(game.download.entry.startsWith('/'),`${game.slug}: local entry`);
    const route=normalize(game.download.entry);
    assert.ok(!route.startsWith('/api/'));
    const rel=route.replace(/^\//,'');
    const candidates=[`src/pages/${rel}.astro`,`src/pages/${rel}/index.astro`,`public/${rel}`,`public/${rel}/index.html`];
    assert.ok(candidates.some(file=>fs.existsSync(path.join(root,file))),`${game.slug}: source for ${route}`);
    for(const include of game.download.include){assert.ok(!include.split('/').includes('..'));assert.ok(!include.startsWith('/api/'));}
  }
});
