/**
 * Pocket Rocks specimens are fictional digital objects inspired by geology.
 * Identity and artwork depend only on a uint32 seed and a known family.
 * Facts are paraphrased from the primary sources below, not specimen provenance.
 */
export const ROCK_SOURCES = Object.freeze([
  Object.freeze({ title: 'USGS · Collecting Rocks', url: 'https://pubs.usgs.gov/gip/collect1/collectgip.html' }),
  Object.freeze({ title: 'USGS · What are igneous rocks?', url: 'https://www.usgs.gov/faqs/what-are-igneous-rocks' }),
  Object.freeze({ title: 'USGS · Lithologic classification', url: 'https://apps.usgs.gov/thesaurus/thesaurus-full.php?thcode=4' }),
  Object.freeze({ title: 'USGS · Quartzite', url: 'https://apps.usgs.gov/thesaurus/term-simple.php?code=5.2.3&thcode=4' }),
  Object.freeze({ title: 'USGS · Natural Gemstones', url: 'https://pubs.usgs.gov/gip/gemstones/mineral.html' }),
  Object.freeze({ title: 'USGS · Panum Crater', url: 'https://www.usgs.gov/volcanoes/long-valley-caldera/science/long-valley-caldera-field-guide-panum-crater' }),
]);

export const ROCK_FAMILIES = Object.freeze([
  { id: 'basalt', name: 'Midnight Thumb', geology: 'Basalt', group: 'Igneous', story: 'A small piece of midnight. Surprisingly good company.', fact: 'Basalt is an igneous rock formed when lava cools at the surface.', palette: ['#879088', '#454e48', '#1c2724', '#bab79d'], texture: 'A dense charcoal stone with small pale mineral flecks.' },
  { id: 'granite', name: 'Salt & Pepper', geology: 'Granite', group: 'Igneous', story: 'A tiny gathering of grains. Everyone brought a different color.', fact: 'Slow cooling underground gives igneous rocks such as granite time to grow visible crystals.', palette: ['#ddc7b6', '#a38d7c', '#564f49', '#e7dfcc'], texture: 'A chunky warm gray stone scattered with pink, white, and dark grains.' },
  { id: 'sandstone', name: 'Old Shore', geology: 'Sandstone', group: 'Sedimentary', story: 'A little shoreline, folded into your pocket.', fact: 'Sandstone forms when sand grains become cemented into rock.', palette: ['#e5bd82', '#bf8e59', '#755237', '#f2d9ac'], texture: 'A rounded ochre stone with fine, gently undulating layers.' },
  { id: 'slate', name: 'Pocket Page', geology: 'Slate', group: 'Metamorphic', story: 'One page from a book the earth is still writing.', fact: 'Slate is a fine-grained metamorphic rock that can split into thin plates.', palette: ['#9ca9b4', '#5f6e7b', '#303e4b', '#cbd1cd'], texture: 'A flat blue-gray slab with delicate layered edges.' },
  { id: 'obsidian', name: 'Night Glass', geology: 'Obsidian', group: 'Igneous', story: 'Dark enough to hold a secret. Bright enough to give it away.', fact: 'Obsidian is volcanic glass, an igneous material formed by rapid cooling.', palette: ['#737487', '#2c2c3c', '#10121d', '#b2b2bf'], texture: 'A glossy black stone with broad, curved fracture marks.' },
  { id: 'pumice', name: 'Cloud Stone', geology: 'Pumice', group: 'Igneous', story: 'A cloud that decided to stay on the ground.', fact: 'Gas bubbles expanding in cooling magma leave the holes preserved in pumice.', palette: ['#e4dfc9', '#c4bba1', '#817b69', '#f5efdc'], texture: 'A pale cream stone covered in small dark pores.' },
  { id: 'agate', name: 'Little Orbit', geology: 'Agate', group: 'Mineral', story: 'A few patient circles, all finding their own way home.', fact: 'Agate belongs to the fine-crystalline silica varieties of the quartz family.', palette: ['#efcb9e', '#b97547', '#683e2d', '#f6e4c8'], texture: 'A polished amber and rust stone with nested cream bands.' },
  { id: 'jasper', name: 'Red Planet', geology: 'Jasper', group: 'Mineral', story: 'A whole imaginary planet. Fits comfortably in one hand.', fact: 'Jasper is a fine-crystalline variety of silica in the quartz family.', palette: ['#bf7860', '#984b38', '#532e2b', '#d9a57b'], texture: 'A brick-red stone with irregular dark veins and small ochre patches.' },
  { id: 'serpentinite', name: 'Green Current', geology: 'Serpentinite', group: 'Metamorphic', story: 'A green river, holding perfectly still.', fact: 'Serpentinite consists mainly of serpentine minerals formed through reactions involving water.', palette: ['#9aaa79', '#50694b', '#243d32', '#d1cfa2'], texture: 'A waxy olive-green stone crossed by pale winding veins.' },
  { id: 'quartzite', name: 'Sugar Lump', geology: 'Quartzite', group: 'Metamorphic', story: 'A little light, packed tightly enough to carry.', fact: 'Quartzite is a quartz-rich metamorphic rock formed by recrystallization, often of sandstone.', palette: ['#f4e9d7', '#d4c6b4', '#968b80', '#fff9ed'], texture: 'A pale granular stone with small crystalline glints.' },
].map((family) => Object.freeze({ ...family, palette: Object.freeze(family.palette) })));

const FAMILY_BY_ID = new Map(ROCK_FAMILIES.map((family) => [family.id, family]));
const UINT32_MAX = 0xffffffff;
const MAX_ROCKS = 500;
const MAX_CABINET_TEXT = 1_000_000;

function uint32(seed) {
  if (typeof seed !== 'number' || !Number.isInteger(seed)) throw new TypeError('Rock seed must be a uint32 number.');
  if (seed < 0 || seed > UINT32_MAX) throw new RangeError('Rock seed must be between 0 and 4294967295.');
  return seed >>> 0;
}

function mix32(value) {
  let x = value >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

function familyHash(text) {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) value = Math.imul(value ^ text.charCodeAt(i), 0x01000193);
  return value >>> 0;
}

/** Explicit family identifiers must be known; numeric strings are never coerced. */
export function makeRock(seed, familyId) {
  const normalizedSeed = uint32(seed);
  const family = familyId === undefined
    ? ROCK_FAMILIES[mix32(normalizedSeed ^ 0xa79d316b) % ROCK_FAMILIES.length]
    : FAMILY_BY_ID.get(familyId);
  if (!family) throw new RangeError('Unknown rock family.');
  return {
    seed: normalizedSeed,
    id: `PR-${family.id.toUpperCase()}-${normalizedSeed.toString(16).padStart(8, '0').toUpperCase()}`,
    familyId: family.id,
    name: family.name,
    geology: family.geology,
    group: family.group,
    story: family.story,
    fact: family.fact,
    palette: [...family.palette],
    texture: family.texture,
  };
}

/** Reconstruct trusted metadata; never accept imported names, colors, HTML, or IDs. */
export function normalizeRock(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  try {
    if (typeof input.familyId !== 'string' || !FAMILY_BY_ID.has(input.familyId)) return null;
    return makeRock(input.seed, input.familyId);
  } catch {
    return null;
  }
}

function emptyCabinet() {
  return { version: 1, rocks: [], featuredId: null };
}

function canonicalTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== value) return null;
  return value;
}

/**
 * Read version-1 local/export data. Bad records are skipped; bad envelopes yield
 * an empty cabinet. First valid collection date wins for duplicate specimens.
 */
export function readCabinet(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_CABINET_TEXT) return emptyCabinet();
  let data;
  try { data = JSON.parse(raw); } catch { return emptyCabinet(); }
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== 1 || !Array.isArray(data.rocks)) return emptyCabinet();
  const rocks = [];
  const ids = new Set();
  for (const input of data.rocks) {
    const rock = normalizeRock(input);
    const collectedAt = canonicalTimestamp(input?.collectedAt);
    if (!rock || !collectedAt || ids.has(rock.id)) continue;
    ids.add(rock.id);
    rocks.push({ ...rock, collectedAt });
    if (rocks.length === MAX_ROCKS) break;
  }
  return { version: 1, rocks, featuredId: typeof data.featuredId === 'string' && ids.has(data.featuredId) ? data.featuredId : null };
}

function randomFor(rock) {
  let state = mix32(rock.seed ^ familyHash(rock.familyId));
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const num = (value) => Number(value.toFixed(2));
const point = (p) => `${num(p.x)},${num(p.y)}`;
const escapeXml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);

function outline(points) {
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = midpoint(points[points.length - 1], points[0]);
  return `M${point(start)} ${points.map((p, i) => `Q${point(p)} ${point(midpoint(p, points[(i + 1) % points.length]))}`).join(' ')} Z`;
}

function flecks(rand, palette, count, radius, opacity = 0.65) {
  return Array.from({ length: count }, () => {
    const x = 75 + rand() * 330;
    const y = 95 + rand() * 275;
    const r = radius * (0.3 + rand());
    const color = palette[Math.floor(rand() * palette.length)];
    const angle = rand() * 180;
    return `<path d="M${num(x-r)},${num(y)} l${num(r*0.6)},${num(-r*0.8)} ${num(r*1.3)},${num(r*0.4)} ${num(-r*0.2)},${num(r*1.1)} Z" fill="${color}" opacity="${opacity}" transform="rotate(${num(angle)} ${num(x)} ${num(y)})"/>`;
  }).join('');
}

function veins(rand, color, count, thickness, opacity) {
  return Array.from({ length: count }, (_, i) => {
    const y = 95 + rand() * 230;
    const wave = 30 + rand() * 65;
    return `<path d="M35 ${num(y)} C130 ${num(y-wave)}, 180 ${num(y+wave)}, 252 ${num(y+rand()*35)} S350 ${num(y-wave)}, 450 ${num(y+wave/2)}" fill="none" stroke="${color}" stroke-width="${num(thickness*(0.5+rand()))}" opacity="${opacity}" transform="rotate(${num((rand()-0.5)*65)} 240 240)" data-vein="${i}"/>`;
  }).join('');
}

function familyTexture(rock, rand, prefix) {
  const [light, base, dark, accent] = rock.palette;
  switch (rock.familyId) {
    case 'granite':
      return flecks(rand, [light, dark, accent, '#b88777'], 380, 3.8, 0.85);
    case 'basalt':
      return flecks(rand, [light, dark, accent], 150, 1.6, 0.44) + veins(rand, dark, 3, 1.2, 0.45);
    case 'quartzite':
      return flecks(rand, [light, accent, dark], 260, 2.4, 0.56) + Array.from({ length: 12 }, () => {
        const x = 105 + rand() * 270;
        const y = 110 + rand() * 215;
        const r = 1.8 + rand() * 3;
        return `<path d="M${num(x-r)} ${num(y)} H${num(x+r)} M${num(x)} ${num(y-r)} V${num(y+r)}" stroke="${accent}" stroke-width="1" opacity="0.85"/>`;
      }).join('');
    case 'sandstone':
      return Array.from({ length: 28 }, (_, i) => {
        const y = 86 + i * (9 + rand()*2);
        const bend = (rand()-0.5) * 24;
        return `<path d="M30 ${num(y)} Q230 ${num(y+bend)} 450 ${num(y+rand()*15)}" fill="none" stroke="${i % 4 === 0 ? dark : accent}" stroke-width="${num(0.8+rand()*3.3)}" opacity="${i % 4 === 0 ? 0.22 : 0.3}"/>`;
      }).join('') + flecks(rand, [light, dark], 160, 1.2, 0.2);
    case 'slate':
      return Array.from({ length: 19 }, (_, i) => {
        const y = 140 + i * 9;
        return `<path d="M40 ${y} L${num(170+rand()*30)} ${num(y-5-rand()*10)} L440 ${num(y+rand()*8)}" fill="none" stroke="${i%3 ? light : dark}" stroke-width="${num(0.6+rand()*2)}" opacity="0.24"/>`;
      }).join('');
    case 'pumice':
      return Array.from({ length: 155 }, () => {
        const x = 65 + rand()*350;
        const y = 85 + rand()*300;
        const r = 1.2 + rand()*5;
        return `<ellipse cx="${num(x)}" cy="${num(y)}" rx="${num(r)}" ry="${num(r*(0.55+rand()*0.6))}" fill="url(#${prefix}-pore)" transform="rotate(${num(rand()*180)} ${num(x)} ${num(y)})"/><path d="M${num(x-r)} ${num(y+1)} q${num(r)} ${num(r)} ${num(r*2)} 0" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.7"/>`;
      }).join('');
    case 'agate': {
      const cx = 200 + rand()*90;
      const cy = 200 + rand()*70;
      const rotation = num(rand()*70-35);
      return `<g transform="rotate(${rotation} ${num(cx)} ${num(cy)})">${Array.from({ length: 22 }, (_, i) => {
        const rx = 9 + i*11;
        const ry = rx*(0.66+rand()*0.04);
        const color = [accent, light, dark, base][i%4];
        return `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" fill="none" stroke="${color}" stroke-width="${num(3+rand()*6)}" opacity="${i%4===2 ? 0.65 : 0.85}"/>`;
      }).join('')}</g>`;
    }
    case 'jasper':
      return veins(rand, dark, 9, 2, 0.65) + flecks(rand, [base, accent, light], 60, 3, 0.35);
    case 'serpentinite':
      return veins(rand, dark, 8, 16, 0.16) + veins(rand, accent, 7, 3.2, 0.7) + veins(rand, light, 10, 0.7, 0.55);
    case 'obsidian':
      return Array.from({ length: 7 }, () => {
        const x = 150 + rand()*130;
        const y = 180 + rand()*90;
        const width = 90 + rand()*130;
        return `<path d="M${num(x-width/2)} ${num(y+80)} Q${num(x-width)} ${num(y-70)} ${num(x+width/2)} ${num(y-65)}" fill="none" stroke="${light}" stroke-width="${num(1+rand()*3)}" opacity="0.28"/>`;
      }).join('') + `<path d="M120 185 Q200 115 304 130 Q225 143 174 218 Z" fill="${accent}" opacity="0.16"/>`;
    default:
      return '';
  }
}

/** Self-contained SVG: safe for an img data URL, an export, or inline fallback. */
export function rockSvg(input, options = {}) {
  const rock = normalizeRock(input);
  if (!rock) throw new TypeError('Cannot draw an invalid rock.');
  const safeOptions = options && typeof options === 'object' ? options : {};
  const size = Number.isInteger(safeOptions.size) && safeOptions.size >= 16 && safeOptions.size <= 4096 ? safeOptions.size : 480;
  const background = safeOptions.background === true;
  const rand = randomFor(rock);
  const [light, base, dark, accent] = rock.palette;
  const prefix = rock.id.toLowerCase();
  const count = 10 + Math.floor(rand()*4);
  const offset = rand()*Math.PI*2;
  const aspect = rock.familyId === 'slate' ? 0.6 : 0.79 + rand()*0.16;
  const center = { x: 232 + rand()*16, y: 226 + rand()*16 };
  const points = Array.from({ length: count }, (_, i) => {
    const angle = offset + i/count*Math.PI*2 + (rand()-0.5)*0.13;
    const radius = 139 + rand()*38;
    return { x: center.x + Math.cos(angle)*radius*(1.02+rand()*0.06), y: center.y + Math.sin(angle)*radius*aspect };
  });
  const path = outline(points);
  const shadowY = num(Math.max(...points.map((p) => p.y)) + 10);
  const faces = points.map((p, i) => {
    const next = points[(i+1)%points.length];
    const isLit = p.x + p.y < center.x + center.y;
    return `<path d="M${point(p)} L${point(next)} L${num(center.x+(rand()-0.5)*55)},${num(center.y+(rand()-0.5)*55)} Z" fill="${isLit ? light : dark}" opacity="${num(0.04+rand()*0.13)}"/>`;
  }).join('');
  const texture = familyTexture(rock, rand, prefix);
  const description = `${rock.name}, inspired by ${rock.geology}. ${rock.texture}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 480 480" role="img" aria-label="${escapeXml(description)}">
<title>${escapeXml(rock.name)}</title><desc>${escapeXml(rock.texture)} Fictional digital specimen ${rock.id}.</desc>
<defs>
<linearGradient id="${prefix}-body" x1="10%" y1="5%" x2="80%" y2="95%"><stop stop-color="${light}"/><stop offset=".42" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
<linearGradient id="${prefix}-shade" x1="15%" y1="5%" x2="70%" y2="100%"><stop stop-color="${accent}" stop-opacity=".14"/><stop offset=".45" stop-color="${dark}" stop-opacity="0"/><stop offset="1" stop-color="${dark}" stop-opacity=".48"/></linearGradient>
<radialGradient id="${prefix}-pore" cx="65%" cy="70%"><stop stop-color="${dark}" stop-opacity=".9"/><stop offset=".8" stop-color="${dark}" stop-opacity=".62"/><stop offset="1" stop-color="${base}"/></radialGradient>
<radialGradient id="${prefix}-shadow"><stop stop-color="#3c342b" stop-opacity=".22"/><stop offset="1" stop-color="#3c342b" stop-opacity="0"/></radialGradient>
<clipPath id="${prefix}-clip"><path d="${path}"/></clipPath>
<filter id="${prefix}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="${rock.seed%65535}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".08"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
</defs>
${background ? '<rect width="480" height="480" fill="#f3efe5"/>' : ''}
<ellipse cx="245" cy="${shadowY}" rx="157" ry="25" fill="url(#${prefix}-shadow)"/>
<path d="${path}" fill="url(#${prefix}-body)" stroke="${dark}" stroke-opacity=".22" stroke-width="1.2"/>
<g clip-path="url(#${prefix}-clip)">${faces}${texture}<path d="${path}" fill="url(#${prefix}-shade)"/><path d="${path}" fill="${base}" opacity=".075" filter="url(#${prefix}-grain)"/></g>
<path d="${path}" fill="none" stroke="${accent}" stroke-opacity=".16" stroke-width="1"/>
</svg>`;
}
