/**
 * Unfurl card art — SVG strings for every generated PointCast social card.
 *
 * One frame, many bodies. The frame is the town's register card (ink border,
 * channel-colour offset shadow) set in El Segundo's current light: the sky
 * around it, and the sun or moon crossing the top strip, follow the clock
 * (src/lib/unfurl/light.mjs). Bodies:
 *
 *   pageCard   — any page without art of its own: title, description, a Noun
 *   liveCard   — rooms drawn from live state: shortwave, station, tug, drum,
 *                window, bell-post
 *
 * Pure functions: callers fetch data and images and pass data: URIs in, so the
 * same code rasterises at the edge (resvg-wasm) and in Node (tests, scripts).
 * Only Latin text renders — the edge ships Inter + JetBrains Mono Latin
 * subsets — so all copy goes through `clean()`.
 */
import { CHANNEL_COLORS, CLIENT_LINES, channelForPath, quipFor } from './rooms.mjs';

export const W = 1200;
export const H = 630;

const INK = '#12110E';
const BODY = '#38373A';
const FAINT = '#5F5E5A';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
const SANS = 'Inter, system-ui, sans-serif';

// The card panel.
const CX = 40;
const CY = 100;
const CW = 1112;
const CH = 486;

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Keep only what the Latin font subsets can draw; drop emoji and other scripts. */
export function clean(s, fallback = '') {
  const out = String(s ?? '')
    .replace(/[\u2018\u2019]/g, '\u2019')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\u0020-\u007E\u00A0-\u017F\u2013\u2014\u2019\u2022\u2026\u00B7]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return out || fallback;
}

/**
 * Greedy word wrap by estimated advance width. `k` is the average glyph width
 * as a fraction of the font size (Inter ≈ 0.52 regular, ≈ 0.58 extra-bold).
 */
export function wrap(text, { size, width, k = 0.55, maxLines = 3 }) {
  const perLine = Math.max(4, Math.floor(width / (size * k)));
  const words = clean(text).split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const w = word.length > perLine ? `${word.slice(0, perLine - 1)}…` : word;
    if (!line) line = w;
    else if (line.length + 1 + w.length <= perLine) line += ` ${w}`;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    if (last.length > perLine - 1) last = last.slice(0, perLine - 1);
    kept[maxLines - 1] = `${last.replace(/[\s.,;:–—-]+$/, '')}…`;
    return kept;
  }
  return lines;
}

/** Largest title size (of a few steps) whose wrap fits in `maxLines`. */
export function fitTitle(text, width, maxLines = 3) {
  for (const size of [84, 72, 62, 54, 46]) {
    const perLine = Math.floor(width / (size * 0.52));
    const words = clean(text).split(' ');
    let lines = 1;
    let len = 0;
    for (const w of words) {
      const add = len ? w.length + 1 : w.length;
      if (len + add > perLine) { lines += 1; len = w.length; } else len += add;
    }
    if (lines <= maxLines) return { size, lines: wrap(text, { size, width, k: 0.52, maxLines }) };
  }
  return { size: 46, lines: wrap(text, { size: 46, width, k: 0.52, maxLines }) };
}

/**
 * The edge ships one Inter weight, so heavy type is drawn with a same-colour
 * stroke behind the fill. Pass as extra attributes on a <text>.
 */
export function heavy(size, fill, weight = 800) {
  if (weight < 600) return '';
  const w = (size * (weight >= 800 ? 0.045 : 0.028)).toFixed(2);
  return ` stroke="${fill}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke"`;
}

function textLines(lines, { x, y, size, lead = 1.08, family = SANS, weight = 400, fill = INK, spacing = 0 }) {
  return lines.map((line, i) => `<text x="${x}" y="${Math.round(y + i * size * lead)}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${fill}"${family === SANS ? heavy(size, fill, weight) : ''}>${esc(line)}</text>`).join('');
}

function formatInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('en-US');
}

/** The sky strip: gradient field, the sun or moon on its arc, the clock line. */
function sky(light) {
  const sunX = 70 + light.arc * 1060;
  const sunY = 42 - Math.sin(Math.PI * light.arc) * 20;
  const body = light.moon
    ? `<circle cx="${sunX}" cy="${sunY}" r="15" fill="${light.sun}" /><circle cx="${sunX + 7}" cy="${sunY - 5}" r="13" fill="${light.sky}" />`
    : `<circle cx="${sunX}" cy="${sunY}" r="20" fill="${light.sun}" opacity="0.35" /><circle cx="${sunX}" cy="${sunY}" r="13" fill="${light.sun}" />`;
  const stars = light.moon
    ? [[180, 30], [320, 48], [470, 18], [640, 40], [790, 24], [930, 46], [1080, 28], [240, 14], [1010, 12], [560, 52]]
      .map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="3" fill="${light.ink}" opacity="0.7" />`).join('')
    : '';
  const fog = light.id === 'marine'
    ? `<rect x="0" y="22" width="${W}" height="16" fill="#FFFFFF" opacity="0.35" /><rect x="0" y="48" width="${W}" height="10" fill="#FFFFFF" opacity="0.25" />`
    : '';
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light.sky}" /><stop offset="1" stop-color="${light.glow}" /></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)" />
    ${stars}${body}${fog}`;
}

function clockLine(light, right = 'POINTCAST.XYZ') {
  const left = `POINTCAST · ${light.name.toUpperCase()} · ${light.clock.label} IN EL SEGUNDO`;
  return `<text x="${CX + 4}" y="86" font-family="${MONO}" font-size="16" font-weight="700" letter-spacing="2" fill="${light.ink}">${esc(left)}</text>
    <text x="${CX + CW}" y="86" text-anchor="end" font-family="${MONO}" font-size="16" font-weight="700" letter-spacing="2" fill="${light.ink}">${esc(right)}</text>`;
}

function panel(color) {
  return `<rect x="${CX + 10}" y="${CY + 10}" width="${CW}" height="${CH}" fill="${color}" />
    <rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" fill="#FFFFFF" stroke="${INK}" stroke-width="3" />`;
}

/** Footer: the quip in channel colour, then the honest small print. */
function footer({ quip, client, serial, color, extra = '' }) {
  const y = CY + CH - 62;
  const small = [
    serial ? `UNFURL #${formatInt(serial)}` : '',
    client ? clean(CLIENT_LINES[client] ?? '').toUpperCase() : '',
    extra,
  ].filter(Boolean).join(' · ');
  return `<rect x="${CX + 28}" y="${y - 30}" width="${CW - 56}" height="2" fill="${INK}" opacity="0.12" />
    <text x="${CX + 32}" y="${y + 4}" font-family="${SANS}" font-size="24" font-weight="700" fill="${color}"${heavy(24, `${color}`, 700)}>${esc(clean(quip))}</text>
    <text x="${CX + 32}" y="${y + 38}" font-family="${MONO}" font-size="14" font-weight="700" letter-spacing="2" fill="${FAINT}">${esc(small)}</text>`;
}

function kicker(text, color, x = CX + 32, y = CY + 48) {
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="3" fill="${color}">${esc(clean(text).toUpperCase())}</text>`;
}

function svgDoc(label, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(clean(label))}">${inner}</svg>`;
}

function framedImage(href, { x, y, size, tint, color }) {
  if (!href) return '';
  return `<rect x="${x + 8}" y="${y + 8}" width="${size}" height="${size}" fill="${color}" />
    <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${tint}" stroke="${INK}" stroke-width="3" />
    <image x="${x + 3}" y="${y + 3}" width="${size - 6}" height="${size - 6}" href="${href}" xlink:href="${href}" preserveAspectRatio="xMidYMid slice" />`;
}

/**
 * A card for any page without art of its own.
 *
 * @param {object} o
 * @param {string} o.path        page path, e.g. "/drum-says"
 * @param {string} o.title
 * @param {string} [o.description]
 * @param {object} o.light       lightAt() result
 * @param {string} [o.nounHref]  data: URI of the page's Noun
 * @param {string} [o.bucket]    light bucket, seeds the quip
 * @param {string} [o.client]    unfurlClient() id
 * @param {number} [o.serial]    unfurl counter
 */
export function pageCard({ path, title, description = '', light, nounHref = '', bucket = '', client = '', serial = 0, channel }) {
  const code = channel ?? channelForPath(path);
  const ch = CHANNEL_COLORS[code] ?? CHANNEL_COLORS.FD;
  const titleText = clean(title, 'PointCast').replace(/\s+[—|–·:-]\s+PointCast$/i, '');
  const textW = nounHref ? 740 : 1020;
  const t = fitTitle(titleText, textW, 3);
  const titleTop = CY + 60 + t.size;
  const titleBottom = titleTop + (t.lines.length - 1) * t.size * 1.04;
  const descLines = wrap(description, { size: 24, width: textW, k: 0.5, maxLines: titleBottom > CY + 300 ? 1 : 2 });
  return svgDoc(`${titleText} on PointCast`, `
    ${sky(light)}
    ${clockLine(light)}
    ${panel(ch.c600)}
    ${kicker(`CH.${code} · ${ch.name} · ${path}`.slice(0, 70), ch.c600)}
    ${textLines(t.lines, { x: CX + 28, y: titleTop, size: t.size, lead: 1.04, weight: 800, spacing: -2 })}
    ${textLines(descLines, { x: CX + 32, y: titleBottom + 48, size: 24, lead: 1.3, fill: BODY })}
    ${framedImage(nounHref, { x: CX + CW - 300, y: CY + 60, size: 250, tint: ch.tint, color: ch.c600 })}
    ${footer({ quip: quipFor(path, bucket, code), client, serial, color: ch.c600 })}
  `);
}

/* ------------------------------------------------------------ live cards */

function ago(ms, now) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 90) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function hereLine(presence) {
  if (!presence || typeof presence.humans !== 'number') return '';
  const n = presence.humans + (presence.agents || 0);
  return n === 1 ? '1 IN TOWN NOW' : `${formatInt(n)} IN TOWN NOW`;
}

/** Shortwave post copy: links read as their host, emoji-only posts as a sticker. */
export function postText(raw) {
  const withHosts = String(raw ?? '').replace(/https?:\/\/(?:www\.)?([^/\s]+)\S*/gi, (_, host) => `[${host}]`);
  return clean(withHosts, '(a sticker)');
}

function plural(n, one, many = `${one}S`) {
  return `${formatInt(n)} ${Number(n) === 1 ? one : many}`;
}

const LIVE_BODIES = {
  shortwave({ data, now, images }) {
    const posts = (data?.posts ?? []).slice(0, 3);
    const rows = posts.length
      ? posts.map((p, i) => {
        const y = CY + 90 + i * 96;
        const text = postText(p.text);
        const line = wrap(text, { size: 30, width: 780, k: 0.52, maxLines: 1 })[0] ?? '';
        const who = clean(p.who, 'visitor');
        return `${framedImage(images[i], { x: CX + 32, y, size: 72, tint: '#EEF4FA', color: '#185FA5' })}
          <text x="${CX + 132}" y="${y + 30}" font-family="${SANS}" font-size="30" font-weight="700" fill="${INK}"${heavy(30, `${INK}`, 700)}>${esc(line)}</text>
          <text x="${CX + 132}" y="${y + 62}" font-family="${MONO}" font-size="15" font-weight="700" letter-spacing="1" fill="${FAINT}">${esc(`${who} · ${ago(Date.parse(p.at), now)}`)}</text>`;
      }).join('')
      : `<text x="${CX + 32}" y="${CY + 200}" font-family="${SANS}" font-size="64" font-weight="800" fill="${INK}"${heavy(64, `${INK}`, 800)}>The square is quiet.</text>`;
    return {
      code: 'FD',
      label: 'Shortwave, the PointCast town square, live',
      kicker: 'CH.FD · SHORTWAVE · THE TOWN SQUARE · LIVE',
      side: `<text x="${CX + CW - 32}" y="${CY + 48}" text-anchor="end" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="3" fill="#C8102E">ON AIR</text><circle cx="${CX + CW - 130}" cy="${CY + 42}" r="7" fill="#C8102E" />`,
      body: rows,
      quip: posts.length ? 'Say something. It goes out live.' : 'Be the first voice today.',
    };
  },

  station({ data, images }) {
    const on = data?.onAir ?? {};
    const live = Boolean(on.live);
    const title = clean(on.title, 'Silence, for now');
    const t = fitTitle(title, 720, 2);
    const artist = clean(on.artist, '');
    const stats = data?.stats ?? {};
    return {
      code: 'SPN',
      label: `${live ? 'On air' : 'Last played'}: ${title}`,
      kicker: `CH.SPN · MIKE HOYDICH RADIO · ${live ? 'ON AIR NOW' : 'LAST ON AIR'}`,
      side: '',
      body: `${textLines(t.lines, { x: CX + 28, y: CY + 70 + t.size, size: t.size, lead: 1.04, weight: 800, spacing: -2 })}
        <text x="${CX + 32}" y="${CY + 110 + t.size * (t.lines.length + 0.2)}" font-family="${SANS}" font-size="34" font-weight="400" fill="${BODY}">${esc(artist)}</text>
        <text x="${CX + 32}" y="${CY + 340}" font-family="${MONO}" font-size="16" font-weight="700" letter-spacing="2" fill="${FAINT}">${esc(`${formatInt(stats.plays)} PLAYS · ${formatInt(stats.distinctTracks)} TRACKS · ${formatInt(stats.distinctArtists)} ARTISTS`)}</text>
        ${framedImage(images[0], { x: CX + CW - 300, y: CY + 60, size: 250, tint: '#FBEEE9', color: '#993C1D' })}`,
      quip: live ? 'Tune in. Requests are open.' : 'The needle is resting. Leave a request.',
    };
  },

  tug({ data }) {
    const tug = data?.tug ?? {};
    const knot = Math.max(-1, Math.min(1, Number(tug.knot) || 0));
    const x0 = CX + 60;
    const x1 = CX + CW - 60;
    const kx = x0 + ((knot + 1) / 2) * (x1 - x0);
    const y = CY + 230;
    const verdict = Math.abs(knot) < 0.08 ? 'Dead even.' : knot < 0 ? 'People are winning.' : 'Machines are winning.';
    const segs = [];
    for (let x = x0; x < x1; x += 28) segs.push(`<line x1="${x}" y1="${y - 7}" x2="${x + 14}" y2="${y + 7}" stroke="#8B6B3E" stroke-width="4" />`);
    return {
      code: 'CRT',
      label: `The tug of war: ${verdict}`,
      kicker: 'CH.CRT · THE TUG · PEOPLE VS MACHINES · LIVE',
      side: '',
      body: `<text x="${CX + 28}" y="${CY + 140}" font-family="${SANS}" font-size="76" font-weight="800" letter-spacing="-2" fill="${INK}"${heavy(76, `${INK}`, 800)}>${esc(verdict)}</text>
        <rect x="${x0}" y="${y - 9}" width="${x1 - x0}" height="18" fill="#C9A66B" stroke="${INK}" stroke-width="2" />${segs.join('')}
        <line x1="${CX + CW / 2}" y1="${y - 40}" x2="${CX + CW / 2}" y2="${y + 40}" stroke="${INK}" stroke-width="2" stroke-dasharray="6 6" />
        <circle cx="${kx}" cy="${y}" r="22" fill="#C8102E" stroke="${INK}" stroke-width="3" />
        <text x="${x0}" y="${y + 70}" font-family="${MONO}" font-size="18" font-weight="700" letter-spacing="2" fill="${INK}">${esc(`PEOPLE · ${plural(tug.humanPulls, 'PULL')}`)}</text>
        <text x="${x1}" y="${y + 70}" text-anchor="end" font-family="${MONO}" font-size="18" font-weight="700" letter-spacing="2" fill="${INK}">${esc(`${plural(tug.machinePulls, 'PULL')} · MACHINES`)}</text>`,
      quip: knot <= 0 ? 'Grab the rope. Every pull counts.' : 'The robots need a word. Pull.',
    };
  },

  drum({ data }) {
    const total = formatInt(data?.globalTotal);
    const pads = [];
    const colors = ['#185FA5', '#993C1D', '#0F6E56', '#BA7517', '#534AB7', '#8A2432', '#3B6D11', '#993556'];
    for (let i = 0; i < 8; i += 1) {
      const x = CX + CW - 330 + (i % 4) * 74;
      const yy = CY + 90 + Math.floor(i / 4) * 74;
      const lit = (Number(data?.globalTotal) + i * 3) % 5 === 0;
      pads.push(`<rect x="${x + 5}" y="${yy + 5}" width="62" height="62" fill="${INK}" /><rect x="${x}" y="${yy}" width="62" height="62" fill="${lit ? colors[i] : '#FFFFFF'}" stroke="${INK}" stroke-width="3" />`);
    }
    return {
      code: 'SPN',
      label: `${total} drum hits and counting on PointCast`,
      kicker: 'CH.SPN · THE DRUM · EVERYONE, ONE BEAT · LIVE',
      side: '',
      body: `<text x="${CX + 28}" y="${CY + 190}" font-family="${SANS}" font-size="136" font-weight="800" letter-spacing="-6" fill="${INK}"${heavy(136, `${INK}`, 800)}>${esc(total)}</text>
        <text x="${CX + 34}" y="${CY + 250}" font-family="${SANS}" font-size="38" font-weight="400" fill="${BODY}">hits on the town drum, and counting.</text>
        ${pads.join('')}`,
      quip: 'Add one. It takes a second and the town hears it.',
    };
  },

  window({ data, light }) {
    const temp = Number.isFinite(Number(data?.tempF)) ? `${Math.round(Number(data.tempF))}°F` : '—';
    const cond = clean(data?.condition, 'unknown').toLowerCase();
    const sunset = typeof data?.sunset === 'string' && /T(\d{2}):(\d{2})/.test(data.sunset)
      ? (() => { const [, h, m] = data.sunset.match(/T(\d{2}):(\d{2})/); const hh = Number(h); return `${((hh + 11) % 12) + 1}:${m} ${hh < 12 ? 'AM' : 'PM'}`; })()
      : '';
    return {
      code: 'ESC',
      label: `El Segundo right now: ${temp}, ${cond}`,
      kicker: 'CH.ESC · THE WINDOW · EL SEGUNDO RIGHT NOW',
      side: '',
      body: `<text x="${CX + 24}" y="${CY + 220}" font-family="${SANS}" font-size="170" font-weight="800" letter-spacing="-8" fill="${INK}"${heavy(170, `${INK}`, 800)}>${esc(temp)}</text>
        <text x="${CX + 560}" y="${CY + 150}" font-family="${SANS}" font-size="54" font-weight="800" fill="#534AB7"${heavy(54, `#534AB7`, 800)}>${esc(cond)}</text>
        <text x="${CX + 562}" y="${CY + 200}" font-family="${SANS}" font-size="28" font-weight="400" fill="${BODY}">${esc(light.name.toLowerCase())}${sunset ? ` · sunset ${esc(sunset)}` : ''}</text>`,
      quip: /fog|overcast|mist/.test(cond) ? 'The marine layer is in. It usually leaves by lunch.' : 'Look out the window. Or look at ours.',
    };
  },

  'bell-post'({ data, now }) {
    const all = data?.phrases ?? [];
    const phrases = all.slice(0, 4);
    const rows = phrases.map((p, i) => {
      const y = CY + 200 + i * 56;
      const notes = (p.notes ?? []).slice(0, 24);
      const dots = notes.map((n, j) => `<circle cx="${CX + 60 + j * 30}" cy="${y - (Number(n.n) % 8) * 4}" r="9" fill="hsl(${Number(p.hue) || 0}, 60%, 45%)" stroke="${INK}" stroke-width="2" />`).join('');
      return `<line x1="${CX + 40}" y1="${y}" x2="${CX + 800}" y2="${y}" stroke="${INK}" stroke-width="1" opacity="0.2" />${dots}
        <text x="${CX + CW - 40}" y="${y}" text-anchor="end" font-family="${MONO}" font-size="14" font-weight="700" letter-spacing="1" fill="${FAINT}">${esc(`${clean(p.voice).toUpperCase()} · ${ago(p.t, now)}`)}</text>`;
    }).join('');
    const empty = `<text x="${CX + 28}" y="${CY + 170}" font-family="${SANS}" font-size="70" font-weight="800" letter-spacing="-2" fill="${INK}"${heavy(70, `${INK}`, 800)}>The rack is quiet.</text>
      <text x="${CX + 32}" y="${CY + 230}" font-family="${SANS}" font-size="30" fill="${BODY}">${esc(`${formatInt(data?.total)} phrases hung all time. Hang the next one.`)}</text>`;
    return {
      code: 'GDN',
      label: `The Bell Post: ${all.length} phrases hanging`,
      kicker: `CH.GDN · THE BELL POST · ${formatInt(all.length)} HANGING NOW`,
      side: '',
      body: phrases.length
        ? `<text x="${CX + 28}" y="${CY + 130}" font-family="${SANS}" font-size="64" font-weight="800" letter-spacing="-2" fill="${INK}"${heavy(64, INK)}>${esc(all.length === 1 ? 'One phrase is hanging.' : `${all.length} phrases are hanging.`)}</text>${rows}`
        : empty,
      quip: phrases.length ? 'Ring one back. They fade in a day.' : 'Play four notes. Leave them for a stranger.',
    };
  },
};

export const LIVE_ROOM_IDS = Object.keys(LIVE_BODIES);

/**
 * A live room card. `images` holds data: URIs the body wants (Noun avatars
 * for shortwave, cover art for station), already fetched by the caller.
 */
/**
 * The shared frame with any body — live cards and the motion loops
 * (scripts/og-motion.mjs) both draw through this.
 */
export function framedCard({ light, code, label, kicker: kick, side = '', body, quip, client = '', serial = 0, extra = '', right = 'POINTCAST.XYZ' }) {
  const ch = CHANNEL_COLORS[code] ?? CHANNEL_COLORS.FD;
  return svgDoc(label, `
    ${sky(light)}
    ${clockLine(light, right)}
    ${panel(ch.c600)}
    ${kicker(kick, ch.c600)}
    ${side}
    ${body}
    ${footer({ quip, client, serial, color: ch.c600, extra })}
  `);
}

export const COLORS = { INK, BODY, FAINT, MONO, SANS, CX, CY, CW, CH };

export function liveCard({ room, data, light, now = Date.now(), images = [], client = '', serial = 0, presence = null }) {
  const make = LIVE_BODIES[room];
  if (!make) throw new Error(`unknown live room ${room}`);
  const b = make({ data, light, now, images });
  return framedCard({ light, ...b, client, serial, extra: `DRAWN ${light.clock.label}`, right: hereLine(presence) || 'POINTCAST.XYZ' });
}

/* ------------------------------------------------------ keyboard quartet */

/** Seat names, keycaps, and colours for /keyboard-quartet (mirrors the page). */
export const QUARTET_SEATS = [
  { name: 'Coral',  caps: 'QWERT', light: '#FF8F70', dark: '#C9492B' },
  { name: 'Gold',   caps: 'YUIOP', light: '#E6C98A', dark: '#9A6C12' },
  { name: 'Sea',    caps: 'ZXCVB', light: '#6FD3C1', dark: '#17806E' },
  { name: 'Violet', caps: 'NM,./', light: '#B69CFF', dark: '#5E43C4' },
];
const QUARTET_DEGREES = ['#F2C14E', '#EF7D6B', '#6FC9E6', '#8FDC7A', '#C8A2FF'];

/** Invite copy for /keyboard-quartet: seat-only, never free text from the URL. */
export function quartetWords(seat) {
  const s = QUARTET_SEATS[seat];
  if (!s) return null;
  return {
    title: `A seat is saved for you · Keyboard Quartet`,
    description: `The ${s.name} seat (${s.caps.split('').join(' ')}) is yours. Four people, one keyboard: one calls a phrase, everyone echoes it, and the garden grows.`,
  };
}

function quartetFlower(x, y, h, color) {
  const petals = [0, 72, 144, 216, 288].map((a) => {
    const r = (a * Math.PI) / 180;
    return `<circle cx="${(x + Math.cos(r) * 6).toFixed(1)}" cy="${(y - h + Math.sin(r) * 6).toFixed(1)}" r="5" fill="${color}" />`;
  }).join('');
  return `<path d="M${x} ${y} Q ${x + 4} ${y - h / 2} ${x} ${y - h}" stroke="#3F6B58" stroke-width="2.4" fill="none" />${petals}<circle cx="${x}" cy="${y - h}" r="3.2" fill="#FFF4D6" />`;
}

/**
 * The /keyboard-quartet card: a drawn keyboard split into four seats, with
 * the invited seat lit and labelled. `seat` is 0–3 or null for the plain card.
 */
export function quartetCard({ seat = null, light, client = '', serial = 0 }) {
  const saved = QUARTET_SEATS[seat] ? seat : null;
  const s = saved === null ? null : QUARTET_SEATS[saved];
  // The drawn board, right side of the panel.
  const bx = 596;
  const by = CY + 34;
  const bw = 530;
  const bh = 330;
  const seatW = 243;
  const seatH = 126;
  const seats = QUARTET_SEATS.map((q, i) => {
    const sx = bx + 16 + (i % 2) * (seatW + 12);
    const sy = by + 16 + Math.floor(i / 2) * (seatH + 50);
    const on = i === saved;
    const dim = saved !== null && !on;
    const pads = q.caps.split('').map((cap, d) => {
      const px = sx + 14 + d * 45;
      const py = sy + 46;
      return `<rect x="${px}" y="${py}" width="39" height="62" rx="8" fill="${on ? q.light : '#16241F'}" stroke="${on ? q.light : '#2C4139'}" stroke-width="1.5" />
        <rect x="${px + 8}" y="${py + 7}" width="23" height="4" rx="2" fill="${QUARTET_DEGREES[d]}" />
        <text x="${px + 19.5}" y="${py + 44}" text-anchor="middle" font-family="${MONO}" font-size="21" font-weight="700" fill="${on ? '#0B1412' : '#DFE9E3'}">${esc(cap)}</text>`;
    }).join('');
    return `<g opacity="${dim ? 0.5 : 1}">
      <rect x="${sx}" y="${sy}" width="${seatW}" height="${seatH}" rx="12" fill="#101C19" stroke="${on ? q.light : '#243630'}" stroke-width="${on ? 4 : 1.5}" />
      <text x="${sx + 14}" y="${sy + 30}" font-family="${SANS}" font-size="22" font-weight="700" fill="${q.light}"${heavy(22, q.light, 700)}>${esc(q.name)}</text>
      ${on ? `<text x="${sx + seatW - 14}" y="${sy + 29}" text-anchor="end" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2" fill="${q.light}">SAVED FOR YOU</text>` : ''}
      ${pads}
    </g>`;
  }).join('');
  const flowers = Array.from({ length: 13 }, (_, i) => {
    const q = QUARTET_SEATS[(i * 3 + (saved ?? 0)) % 4];
    return quartetFlower(bx + 40 + i * 37.5, by + 16 + seatH + 46, 20 + ((i * 7) % 4) * 4, q.light);
  }).join('');
  const board = `<rect x="${bx + 8}" y="${by + 8}" width="${bw}" height="${bh}" rx="16" fill="${CHANNEL_COLORS.SPN.c600}" />
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="16" fill="#0B1412" stroke="${INK}" stroke-width="3" />
    ${seats}
    ${flowers}`;

  const left = s
    ? `${textLines(['A seat is', 'saved for you.'], { x: CX + 28, y: CY + 128, size: 60, lead: 1.04, weight: 800, spacing: -2 })}
      <text x="${CX + 32}" y="${CY + 246}" font-family="${SANS}" font-size="34" font-weight="800" fill="${s.dark}"${heavy(34, s.dark)}>${esc(`The ${s.name} seat.`)}</text>
      <text x="${CX + 32}" y="${CY + 290}" font-family="${MONO}" font-size="24" font-weight="700" letter-spacing="6" fill="${s.dark}">${esc(s.caps.split('').join(' '))}</text>
      ${textLines(['Four people, one keyboard.', 'Call, echo, grow the garden.'], { x: CX + 32, y: CY + 344, size: 22, lead: 1.35, fill: BODY })}`
    : `${textLines(['Keyboard', 'Quartet.'], { x: CX + 28, y: CY + 134, size: 72, lead: 1.02, weight: 800, spacing: -2 })}
      ${textLines(['Four people, one keyboard.', 'One calls a phrase. Everyone', 'echoes it. The garden grows.'], { x: CX + 32, y: CY + 262, size: 25, lead: 1.35, fill: BODY })}`;

  return framedCard({
    light,
    code: 'SPN',
    label: s ? `A ${s.name} seat is saved for you at Keyboard Quartet` : 'Keyboard Quartet on PointCast',
    kicker: s ? 'CH.SPN · YOU ARE INVITED' : 'CH.SPN · KEYBOARD QUARTET · 2-4 PLAYERS',
    body: `${left}${board}`,
    quip: s ? `Pull up a chair. The ${s.name} keys are yours.` : 'Twenty keys. Four seats. No wrong notes.',
    client,
    serial,
    extra: 'NO LOGIN · NO TIMER',
  });
}
