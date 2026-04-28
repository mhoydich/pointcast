/**
 * Doom-fire algorithm — a tiny pixel-art fire that has been ported
 * everywhere since the 1993 release. For each pixel (bottom→top), copy
 * from below with a small random horizontal offset and decay the palette
 * index by 0–3. The palette controls the color identity of the fire.
 *
 * Exposed as a single class so each fireplace can instantiate one with
 * its own palette, dimensions, and source row.
 *
 *   const fire = new PixelFire(canvas, { palette: HEARTH, scale: 4 });
 *   fire.start();
 *   // optionally:
 *   fire.setIntensity(0.8);   // 0..1 — how hot the source row is
 *   fire.setSource(row);      // override source row indices
 */

export const PALETTES = {
  // Classic orange/yellow hearth
  hearth: [
    [7,7,7],[31,7,7],[47,15,7],[71,15,7],[87,23,7],[103,31,7],[119,31,7],[143,39,7],
    [159,47,7],[175,63,7],[191,71,7],[199,71,7],[223,79,7],[223,87,7],[223,87,7],
    [215,95,7],[215,103,15],[207,111,15],[207,119,15],[207,127,15],[207,135,23],
    [199,135,23],[199,143,23],[199,151,31],[191,159,31],[191,159,31],[191,167,39],
    [191,167,39],[191,175,47],[183,175,47],[183,183,47],[183,183,55],[207,207,111],
    [223,223,159],[239,239,199],[255,255,255],
  ],
  // Cool crystal — blue → cyan → white
  crystal: [
    [4,4,12],[8,8,24],[12,12,48],[16,20,72],[20,28,96],[24,40,128],[28,52,160],
    [32,72,192],[40,96,212],[56,124,228],[80,152,236],[112,176,240],[144,196,244],
    [176,212,246],[200,224,248],[220,236,250],[236,244,252],[248,250,253],[255,255,255],
  ],
  // Cannabis joint — coal red → ember orange → ash white
  ember: [
    [10,4,4],[36,8,8],[64,16,12],[96,28,16],[128,40,20],[156,56,24],[180,72,28],
    [200,92,32],[212,116,40],[220,140,52],[228,164,72],[232,184,96],[236,200,124],
    [240,212,156],[244,224,184],[248,232,208],[252,244,232],[255,252,248],
  ],
  // Mystic — purple → pink → cyan
  mystic: [
    [10,4,16],[28,8,40],[44,12,64],[64,20,88],[88,28,112],[112,36,136],[136,48,160],
    [160,60,176],[180,80,184],[196,108,192],[208,140,200],[216,172,208],[224,200,220],
    [232,220,232],[244,236,244],[255,250,255],
  ],
  // Plasma — sci-fi green → cyan → white
  plasma: [
    [4,8,4],[8,24,12],[12,48,20],[16,72,32],[20,100,48],[24,132,68],[32,164,92],
    [44,192,124],[64,212,156],[96,224,188],[136,232,212],[176,240,228],[212,246,238],
    [236,250,246],[250,253,250],[255,255,255],
  ],
  // Tiki — deep red → orange → bright yellow
  tiki: [
    [12,4,4],[40,8,4],[68,12,4],[92,20,4],[116,32,4],[140,48,4],[164,64,4],
    [184,84,8],[200,108,12],[212,136,20],[220,164,32],[228,188,52],[236,208,84],
    [244,224,128],[250,236,176],[254,246,216],[255,254,248],
  ],
  // Lava lamp — magenta/pink retro
  lava: [
    [12,4,12],[36,8,28],[64,12,48],[96,20,72],[128,32,96],[160,48,116],[188,68,128],
    [208,92,140],[220,120,148],[228,148,156],[236,176,168],[244,200,184],[250,224,208],
    [254,240,232],[255,250,248],
  ],
  // Forge — deep blood-red → orange → bright yellow
  forge: [
    [4,2,2],[20,4,4],[44,8,4],[68,12,4],[96,18,4],[124,28,4],[148,40,4],[170,56,4],
    [188,76,8],[200,100,16],[212,128,32],[222,156,52],[230,184,80],[238,208,116],
    [244,228,160],[250,242,204],[255,252,236],[255,255,252],
  ],
  // Gas — blue → cyan → white (gas stove ring, blue flame)
  gas: [
    [4,4,12],[8,12,32],[12,24,60],[16,40,96],[24,64,140],[32,96,184],[44,132,212],
    [64,168,228],[96,196,236],[136,216,240],[176,232,244],[212,244,248],[240,252,252],[255,255,255],
  ],
  // Saber — pure neon blue, sharp falloff (lightsaber blade)
  saber: [
    [0,0,0],[8,16,40],[12,32,80],[20,56,128],[32,96,180],[64,144,220],[120,196,240],
    [180,228,248],[224,244,252],[244,252,255],[255,255,255],
  ],
  // Solar — radiant yellow/white sun surface
  solar: [
    [16,8,4],[40,16,4],[68,28,4],[100,44,4],[136,68,4],[172,100,8],[200,136,20],
    [220,168,40],[232,196,72],[240,216,108],[246,232,148],[250,244,188],[252,250,224],[255,255,250],
  ],
  // Aurora — green → cyan → violet (northern lights)
  aurora: [
    [4,8,16],[8,28,32],[12,48,52],[16,72,72],[20,100,90],[24,132,104],[40,164,124],
    [72,192,160],[104,212,192],[136,220,220],[160,200,232],[180,168,236],[200,140,232],
    [220,128,224],[236,168,236],[248,212,244],
  ],
};

export class PixelFire {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} opts
   * @param {number[][]} opts.palette  - RGB triples, index 0 is "off"
   * @param {number} [opts.scale=4]    - pixel size on screen
   * @param {number} [opts.intensity=1] - how hot the source row is (0..1)
   * @param {boolean} [opts.flipY=false] - render upside-down (for some shapes)
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.palette = opts.palette || PALETTES.hearth;
    this.scale = opts.scale ?? 4;
    this.intensity = opts.intensity ?? 1;
    this.flipY = !!opts.flipY;

    this.cols = Math.floor(canvas.width / this.scale);
    this.rows = Math.floor(canvas.height / this.scale);
    this.pixels = new Uint8Array(this.cols * this.rows);

    this._mask = null; // optional Uint8Array — 0 means "force off here"
    this._sourceMask = null; // optional Uint8Array(cols) overriding source
    this._raf = 0;
    this._tick = this._tick.bind(this);
    this._setSourceFull();
  }

  setPalette(p) { this.palette = p; }
  setIntensity(i) { this.intensity = Math.max(0, Math.min(1, i)); this._setSourceFull(); }
  setMask(maskFn) {
    // maskFn(col, row) returns true if pixel allowed, false to force off.
    this._mask = new Uint8Array(this.cols * this.rows);
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this._mask[y * this.cols + x] = maskFn(x, y) ? 1 : 0;
      }
    }
  }
  setSource(arr) { this._sourceMask = arr; }

  _setSourceFull() {
    const top = this.palette.length - 1;
    const hot = Math.round(top * this.intensity);
    for (let x = 0; x < this.cols; x++) {
      this.pixels[(this.rows - 1) * this.cols + x] = hot;
    }
  }

  _step() {
    const w = this.cols, h = this.rows;
    for (let y = h - 1; y > 0; y--) {
      for (let x = 0; x < w; x++) {
        const dst = (y - 1) * w + x;
        const decay = (Math.random() * 4) | 0;
        const offset = ((Math.random() * 3) | 0) - 1;
        const sx = Math.max(0, Math.min(w - 1, x + offset));
        const src = y * w + sx;
        const v = this.pixels[src] - decay;
        this.pixels[dst] = v < 0 ? 0 : v;
      }
    }
    if (this._sourceMask) {
      const top = this.palette.length - 1;
      const hot = Math.round(top * this.intensity);
      for (let x = 0; x < w; x++) {
        this.pixels[(h - 1) * w + x] = this._sourceMask[x] ? hot : 0;
      }
    }
    if (this._mask) {
      for (let i = 0; i < this.pixels.length; i++) {
        if (!this._mask[i]) this.pixels[i] = 0;
      }
    }
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.cols, h = this.rows, s = this.scale;
    const pal = this.palette;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < h; y++) {
      const drawY = this.flipY ? (h - 1 - y) : y;
      for (let x = 0; x < w; x++) {
        const v = this.pixels[y * w + x];
        if (v === 0) continue;
        const c = pal[Math.min(pal.length - 1, v)];
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.fillRect(x * s, drawY * s, s, s);
      }
    }
  }

  _tick() {
    this._step();
    this._draw();
    this._raf = requestAnimationFrame(this._tick);
  }
  start() { if (!this._raf) this._tick(); }
  stop()  { cancelAnimationFrame(this._raf); this._raf = 0; }
}

/** Tiny crackling synthesizer — short bursts of filtered white noise.
 *  Call .start() once after a user gesture (button click / keypress) so
 *  autoplay rules don't silently mute it. */
export class FireCrackle {
  constructor(opts = {}) {
    this.volume = opts.volume ?? 0.05;
    this.rateHz = opts.rateHz ?? 8;
    this._ctx = null;
    this._timer = 0;
  }
  start() {
    if (this._ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this._ctx = new AC();
    const tick = () => {
      if (!this._ctx) return;
      if (Math.random() < 0.7) this._pop();
      const interval = 1000 / this.rateHz * (0.5 + Math.random());
      this._timer = setTimeout(tick, interval);
    };
    tick();
  }
  stop() {
    if (this._timer) clearTimeout(this._timer);
    if (this._ctx) { this._ctx.close(); this._ctx = null; }
  }
  _pop() {
    const ctx = this._ctx;
    const dur = 0.04 + Math.random() * 0.12;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const env = Math.exp(-i / (d.length * 0.3));
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600 + Math.random() * 1800;
    filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.value = this.volume * (0.5 + Math.random());
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
  }
}
