// /nouns-money/note/[serial]: one note, read live from devnet-2.
//
// Three facts, each checked, none taken on trust:
//   1. the chain's record for this serial: owner, recipe hash, block
//      (GET /edition/nouns-money-27/mints?after=serial-1&limit=1);
//   2. the published recipe whose blake2b hash equals that recipe hash
//      (rebuilt from /nouns-money/chain.json, all 1,100 possible recipes);
//   3. the art file whose sha256 equals the svg hash inside that recipe
//      (the SVG on this site, hashed in the browser).
// "Hash match" only when all three agree. Words come from the config island.
import { connect } from '../../chain/first-mints/lib/pointcast-chain.js';
import { decodeRecipe, nm27Label, recipeHash, recipeIndex } from './nm-recipe.js';
import { indexMints, judgeSerial, sha256Hex } from './nm-shelf.js';

const fill = (t, v = {}) => String(t).replace(/\{(\w+)\}/g, (w, k) => (k in v ? String(v[k]) : w));

const root = document.querySelector('[data-nm-note]');
if (root) init(root);

async function init(root) {
  let cfg;
  try {
    cfg = JSON.parse(root.querySelector('[data-nm-chain-config]').textContent);
  } catch {
    return;
  }
  const { devnet, copy: C, serial } = cfg;
  const N = C.note;
  const $ = (s) => root.querySelector(s);
  const say = (text, cls = '') => {
    const el = $('[data-nmn-status]');
    el.textContent = text;
    el.className = `nmc-status ${cls}`.trim();
  };
  const set = (k, v) => {
    const el = $(`[data-nmn="${k}"]`);
    if (el) el.textContent = v;
  };
  const get = async (path) => {
    const r = await fetch(devnet.api + path, { signal: AbortSignal.timeout(10000) });
    if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  say(N.reading);
  try {
    if (!/^[0-9a-f]{64}$/.test(devnet.genesis || '')) throw new Error('genesis not pinned');
    await connect(devnet.api, { expect: { chainId: devnet.chainId, genesisHash: devnet.genesis } });
    const doc = await (await fetch(devnet.chainJson, { cache: 'no-store' })).json();
    const entries = doc.entries;
    const index = recipeIndex(entries);
    const house = String((await get('/status'))?.house || '');
    const page = await get(`/edition/${encodeURIComponent(devnet.edition)}/mints?after=${serial - 1}&limit=1`);
    if (!page || page.edition === null) return say(fill(N.notOpen, { serial }), 'is-warn');
    const rawMint = (page.mints || []).find((m) => Number(m.serial) === serial) || null;
    const token = rawMint ? indexMints([rawMint], index).bySerial.get(serial) : undefined;
    const verdict = judgeSerial(serial, { token, rawMint, entries });
    if (verdict.state === 'not-collected') return say(fill(N.notCollected, { serial }));
    if (verdict.state === 'unknown-recipe') {
      set('chainHash', String(rawMint.recipe_hash || ''));
      return say(fill(N.unknownRecipe, { serial }), 'is-warn');
    }
    const { entry } = verdict;
    const t = verdict.token;
    const art = $('[data-nmn-art]');
    art.src = entry.preview;
    art.alt = fill(N.artAlt, { nounId: entry.noun_id, label: nm27Label(serial) });
    art.hidden = false;
    set('owner', t.owner === house ? `${t.owner} (${N.house})` : t.owner);
    set('design', fill(N.designValue, { nounId: entry.noun_id, id: entry.id }));
    set('copy', t.copy === 0 ? N.copySpecimen : `${t.copy} / ${cfg.copies}`);
    set('collectedAt', String(t.minted_at));
    set('chainHash', t.recipe_hash);
    const recipe = index.get(t.recipe_hash).recipe;
    set('publishedRecipe', recipe);
    const decoded = decodeRecipe(recipe);
    const svgBytes = new Uint8Array(await (await fetch(entry.svg, { cache: 'no-store' })).arrayBuffer());
    const fileHash = await sha256Hex(svgBytes);
    set('artHash', fileHash);
    const problems = [];
    if (recipeHash(recipe) !== t.recipe_hash) problems.push(N.problemRecipe);
    if (decoded.svgSha256 !== fileHash) problems.push(N.problemArt);
    if (verdict.state === 'order') problems.push(fill(N.serialOrder, { serial, expected: verdict.expected, design: t.design, copy: t.copy }));
    if (problems.length) return say(fill(N.noMatch, { why: problems.join('; ') }), 'is-warn');
    say(N.match, 'is-ok');
  } catch (e) {
    say(fill(N.unreadable, { why: e.message }), 'is-warn');
  }
}
