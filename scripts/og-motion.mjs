#!/usr/bin/env node
/**
 * Motion unfurls — three-second seamless loops for the rooms where movement
 * is the point: the drum, the bell choir, the tug, and the station.
 *
 *   node scripts/og-motion.mjs            # all rooms
 *   node scripts/og-motion.mjs drum tug   # some
 *
 * Output: public/images/og/motion/<room>.mp4 (1200×630, H.264, no audio).
 * The middleware adds them as og:video on their rooms (src/lib/unfurl/rooms.mjs
 * MOTION_ROOMS); clients that play link-preview video show the loop, the rest
 * keep the still card. Frames are drawn with the same frame + fonts as the
 * edge cards (src/lib/unfurl/cards.mjs), rasterised by resvg-wasm, encoded
 * by ffmpeg. Not part of `npm run build` — ffmpeg isn't a build dependency;
 * run it when a scene changes and commit the files.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { COLORS, framedCard, heavy } from '../src/lib/unfurl/cards.mjs';
import { lightAt } from '../src/lib/unfurl/light.mjs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public/images/og/motion');
const FPS = 24;
const FRAMES = FPS * 3;
const { INK, BODY, SANS, MONO, CX, CY, CW } = COLORS;

await initWasm(readFileSync(path.join(ROOT, 'node_modules/@resvg/resvg-wasm/index_bg.wasm')));
const fonts = ['inter-latin.bin', 'jetbrains-mono-latin.bin']
  .map((f) => new Uint8Array(readFileSync(path.join(ROOT, 'functions/og/kennel-club', f))));

function rasterise(svg) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: false, fontBuffers: fonts, defaultFontFamily: 'Inter', sansSerifFamily: 'Inter', monospaceFamily: 'JetBrains Mono Variable' },
  });
  const png = r.render().asPng();
  r.free();
  return png;
}

// Golden hour, fixed: the loops are posters, not clocks.
const LIGHT = { ...lightAt(new Date('2026-09-24T00:40:00Z')), clock: { label: 'ANY TIME', date: '', hour: 17, minute: 40 } };
const TAU = Math.PI * 2;

function headline(text, y = CY + 140, size = 70) {
  return `<text x="${CX + 28}" y="${y}" font-family="${SANS}" font-size="${size}" font-weight="800" letter-spacing="-2" fill="${INK}"${heavy(size, INK)}>${text}</text>`;
}

const SCENES = {
  drum(f) {
    const colors = ['#185FA5', '#993C1D', '#0F6E56', '#BA7517', '#534AB7', '#8A2432', '#3B6D11', '#993556'];
    // 16 steps over the loop; each entry lists the pads that hit on that step.
    const pattern = [[0, 4], [], [2], [], [1, 5], [], [2], [6], [0, 4], [], [2, 3], [], [1, 5], [7], [2], [6]];
    const stepLen = FRAMES / pattern.length;
    const pads = [];
    const floats = [];
    for (let i = 0; i < 8; i += 1) {
      let glow = 0;
      pattern.forEach((hits, s) => {
        if (!hits.includes(i)) return;
        const age = (f - s * stepLen + FRAMES) % FRAMES;
        if (age < 8) glow = Math.max(glow, 1 - age / 8);
        if (age < 14) floats.push({ i, age });
      });
      const x = CX + 610 + (i % 4) * 116;
      const y = CY + 100 + Math.floor(i / 4) * 116;
      const press = glow * 5;
      pads.push(`<rect x="${x + 7}" y="${y + 7}" width="100" height="100" fill="${INK}" />
        <rect x="${x + press}" y="${y + press}" width="100" height="100" fill="#FFFFFF" stroke="${INK}" stroke-width="3" />
        <rect x="${x + press}" y="${y + press}" width="100" height="100" fill="${colors[i]}" opacity="${glow.toFixed(3)}" />`);
    }
    const plus = floats.map(({ i, age }) => {
      const x = CX + 660 + (i % 4) * 116;
      const y = CY + 100 + Math.floor(i / 4) * 116 - age * 4;
      return `<text x="${x}" y="${y}" text-anchor="middle" font-family="${MONO}" font-size="22" font-weight="700" fill="${colors[i]}" opacity="${(1 - age / 14).toFixed(3)}">+1</text>`;
    }).join('');
    return framedCard({
      light: LIGHT, code: 'SPN', label: 'The PointCast drum',
      kicker: 'CH.SPN · THE DRUM · EVERYONE, ONE BEAT',
      body: `${headline('Everyone,', CY + 150, 80)}${headline('one beat.', CY + 236, 80)}
        <text x="${CX + 32}" y="${CY + 300}" font-family="${SANS}" font-size="28" fill="${BODY}">Tap a pad. The whole town hears it.</text>
        ${pads.join('')}${plus}`,
      quip: 'Add one. It takes a second.',
      extra: 'POINTCAST.XYZ/DRUM',
    });
  },

  'bell-choir'(f) {
    const t = f / FRAMES;
    const hues = ['#BA7517', '#993C1D', '#0F6E56', '#185FA5', '#534AB7', '#993556'];
    const bells = [];
    for (let i = 0; i < 6; i += 1) {
      const phase = t * TAU * 2 + i * (TAU / 6);
      const angle = Math.sin(phase) * 22;
      const x = CX + 110 + i * 172;
      const y = CY + 150;
      // A ring leaves the bell at each extreme of its swing.
      const since = ((phase / TAU) % 0.5 + 0.5) % 0.5; // 0..0.5 of a swing since the last extreme (+/−)
      const r = 20 + since * 190;
      const ring = `<circle cx="${x}" cy="${y + 70}" r="${r.toFixed(1)}" fill="none" stroke="${hues[i]}" stroke-width="3" opacity="${Math.max(0, 0.7 - since * 1.4).toFixed(3)}" />`;
      bells.push(`${ring}<g transform="rotate(${angle.toFixed(2)} ${x} ${y})">
        <line x1="${x}" y1="${y - 40}" x2="${x}" y2="${y}" stroke="${INK}" stroke-width="3" />
        <path d="M ${x - 44} ${y + 90} Q ${x - 40} ${y + 10} ${x} ${y} Q ${x + 40} ${y + 10} ${x + 44} ${y + 90} Z" fill="${hues[i]}" stroke="${INK}" stroke-width="3" />
        <rect x="${x - 50}" y="${y + 86}" width="100" height="10" fill="${INK}" />
        <circle cx="${x + Math.sin(phase + 0.6) * 14}" cy="${y + 104}" r="9" fill="${INK}" />
      </g>`);
    }
    return framedCard({
      light: LIGHT, code: 'GDN', label: 'The PointCast bell choir',
      kicker: 'CH.GDN · THE BELL CHOIR · RING TOGETHER',
      body: `<line x1="${CX + 40}" y1="${CY + 110}" x2="${CX + CW - 40}" y2="${CY + 110}" stroke="${INK}" stroke-width="6" />${bells.join('')}
        ${headline('Ring one. Everyone hears it.', CY + 372, 42)}`,
      quip: 'A bell for whoever needs one.',
      extra: 'POINTCAST.XYZ/BELL-CHOIR',
    });
  },

  tug(f) {
    const t = f / FRAMES;
    const knot = Math.sin(t * TAU) * 0.35 + Math.sin(t * TAU * 3) * 0.06;
    const x0 = CX + 150;
    const x1 = CX + CW - 150;
    const mid = (x0 + x1) / 2;
    const shift = knot * (x1 - x0) / 4;
    const y = CY + 250;
    const segs = [];
    for (let x = x0 - 60; x < x1 + 60; x += 28) {
      const sx = x + shift;
      segs.push(`<line x1="${sx}" y1="${y - 7}" x2="${sx + 14}" y2="${y + 7}" stroke="#8B6B3E" stroke-width="4" />`);
    }
    const lean = (side) => {
      const pull = side < 0 ? Math.max(0, -knot) : Math.max(0, knot);
      const bx = side < 0 ? CX + 110 + shift : CX + CW - 110 + shift;
      const tilt = -side * (8 + pull * 30);
      return `<g transform="rotate(${tilt.toFixed(2)} ${bx} ${y + 70})">
        <rect x="${bx - 30}" y="${y - 60}" width="60" height="130" fill="${side < 0 ? '#185FA5' : '#5F5E5A'}" stroke="${INK}" stroke-width="3" />
        <text x="${bx}" y="${y + 10}" text-anchor="middle" font-family="${MONO}" font-size="30" font-weight="700" fill="#FFFFFF">${side < 0 ? ':)' : '[]'}</text>
      </g>`;
    };
    return framedCard({
      light: LIGHT, code: 'CRT', label: 'The PointCast tug of war',
      kicker: 'CH.CRT · THE TUG · PEOPLE VS MACHINES',
      body: `${headline('People vs machines.', CY + 130, 70)}
        <clipPath id="ropeclip"><rect x="${CX + 4}" y="${CY}" width="${CW - 8}" height="400" /></clipPath>
        <g clip-path="url(#ropeclip)">
          <rect x="${x0 - 60 + shift}" y="${y - 9}" width="${x1 - x0 + 120}" height="18" fill="#C9A66B" stroke="${INK}" stroke-width="2" />${segs.join('')}
          ${lean(-1)}${lean(1)}
        </g>
        <line x1="${mid}" y1="${y - 50}" x2="${mid}" y2="${y + 50}" stroke="${INK}" stroke-width="2" stroke-dasharray="6 6" />
        <circle cx="${mid + shift}" cy="${y}" r="22" fill="#C8102E" stroke="${INK}" stroke-width="3" />`,
      quip: 'Grab the rope. Every pull counts.',
      extra: 'POINTCAST.XYZ/TUG',
    });
  },

  station(f) {
    const t = f / FRAMES;
    const angle = t * 360 * 1.5; // 33⅓ rpm is too slow to read; one and a half turns per loop
    const cx = CX + CW - 250;
    const cy = CY + 205;
    const grooves = [150, 135, 120, 105, 90, 75].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2A2926" stroke-width="2" />`).join('');
    const bars = [];
    for (let i = 0; i < 14; i += 1) {
      const h = 18 + Math.abs(Math.sin(t * TAU * 2 + i * 0.9) * Math.cos(t * TAU + i * 0.35)) * 110;
      bars.push(`<rect x="${CX + 34 + i * 34}" y="${CY + 380 - h}" width="24" height="${h.toFixed(1)}" fill="#993C1D" />`);
    }
    const on = Math.floor(t * 6) % 2 === 0;
    return framedCard({
      light: LIGHT, code: 'SPN', label: 'Mike Hoydich Radio on PointCast',
      kicker: 'CH.SPN · MIKE HOYDICH RADIO',
      side: `<circle cx="${CX + 440}" cy="${CY + 42}" r="8" fill="#C8102E" opacity="${on ? 1 : 0.25}" /><text x="${CX + 456}" y="${CY + 48}" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="3" fill="#C8102E">ON AIR</text>`,
      body: `${headline('One listener’s', CY + 130, 64)}${headline('station.', CY + 200, 64)}
        ${bars.join('')}
        <g transform="rotate(${angle.toFixed(2)} ${cx} ${cy})">
          <circle cx="${cx}" cy="${cy}" r="170" fill="#141311" stroke="${INK}" stroke-width="3" />${grooves}
          <circle cx="${cx}" cy="${cy}" r="52" fill="#993C1D" />
          <rect x="${cx - 6}" y="${cy - 48}" width="12" height="30" fill="#FBEEE9" />
          <circle cx="${cx}" cy="${cy}" r="6" fill="#FFFFFF" />
        </g>
        <line x1="${cx + 190}" y1="${cy - 150}" x2="${cx + 70}" y2="${cy + 40}" stroke="${INK}" stroke-width="8" stroke-linecap="round" />
        <circle cx="${cx + 190}" cy="${cy - 150}" r="16" fill="#5F5E5A" stroke="${INK}" stroke-width="3" />`,
      quip: 'Requests are open.',
      extra: 'POINTCAST.XYZ/STATION',
    });
  },
};

const only = process.argv.slice(2);
const rooms = only.length ? only : Object.keys(SCENES);
mkdirSync(OUT, { recursive: true });

for (const room of rooms) {
  const scene = SCENES[room];
  if (!scene) throw new Error(`no scene "${room}" (have: ${Object.keys(SCENES).join(', ')})`);
  const dir = mkdtempSync(path.join(tmpdir(), `pc-motion-${room}-`));
  try {
    for (let f = 0; f < FRAMES; f += 1) {
      writeFileSync(path.join(dir, `f${String(f).padStart(3, '0')}.png`), rasterise(scene(f)));
    }
    const out = path.join(OUT, `${room}.mp4`);
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%03d.png'),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-profile:v', 'main',
      '-movflags', '+faststart', '-an', out,
    ]);
    console.log(`${room}: ${path.relative(ROOT, out)} (${Math.round(statSync(out).size / 1024)} KB)`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
