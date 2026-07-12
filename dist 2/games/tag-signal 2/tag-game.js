(function () {
  const VERSION = '2.0.0';
  const STORAGE_KEY = 'tag-signal-events-v2';
  const BEST_KEY = 'tag-signal-best-v2';
  const HEAT_KEY = 'tag-signal-heat-v2';
  const DEFAULTS = {
    duration: 35,
    campaign: 'default',
    site: location.hostname || 'local',
    endpoint: '',
    width: 800,
    height: 600
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nowIso = () => new Date().toISOString();

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readEvents() {
    return readJson(STORAGE_KEY, []);
  }

  function saveEvent(event) {
    const events = readEvents();
    events.push(event);
    writeJson(STORAGE_KEY, events.slice(-150));
    window.dispatchEvent(new CustomEvent('tag-game:event', { detail: event }));
  }

  function sendEvent(endpoint, event) {
    if (!endpoint) return;
    const body = JSON.stringify(event);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  }

  function createRunner(x, y, color, radius = 18) {
    return {
      x,
      y,
      radius,
      color,
      pulse: 0
    };
  }

  function createHeat() {
    return {
      cols: 8,
      rows: 6,
      cells: Array.from({ length: 48 }, () => 0)
    };
  }

  class TagGame {
    constructor(root, options = {}) {
      this.root = root;
      this.options = { ...DEFAULTS, ...options };
      this.keys = new Set();
      this.pointer = null;
      this.animation = null;
      this.running = false;
      this.score = 0;
      this.combo = 1;
      this.signals = 0;
      this.best = Number(localStorage.getItem(BEST_KEY) || 0);
      this.lastTick = 0;
      this.remaining = this.options.duration;
      this.tagCooldown = 0;
      this.comboWindow = 0;
      this.shake = 0;
      this.heat = readJson(HEAT_KEY, createHeat());
      this.player = createRunner(130, 300, '#2f6fed');
      this.target = createRunner(650, 300, '#e94f37');
      this.signal = createRunner(420, 300, '#ffc857', 13);
      this.decoys = [
        createRunner(390, 150, '#0f9f8f', 16),
        createRunner(390, 450, '#8a4df5', 16),
        createRunner(610, 150, '#ff8a3d', 16)
      ];
      this.mount();
      this.bind();
      this.resize();
      this.draw();
      this.track('impression');
    }

    mount() {
      this.root.classList.add('tag-game');
      this.root.innerHTML = `
        <div class="tag-game__topbar">
          <div class="tag-game__stat"><span class="tag-game__label">Score</span><span class="tag-game__value" data-score>0</span></div>
          <div class="tag-game__stat"><span class="tag-game__label">Combo</span><span class="tag-game__value" data-combo>x1</span></div>
          <div class="tag-game__stat"><span class="tag-game__label">Clock</span><span class="tag-game__value" data-time>${this.options.duration}s</span></div>
          <div class="tag-game__stat"><span class="tag-game__label">Best</span><span class="tag-game__value" data-best>${this.best}</span></div>
        </div>
        <div class="tag-game__stage-wrap">
          <canvas width="${this.options.width}" height="${this.options.height}" aria-label="Tag Signal v2 game board"></canvas>
          <div class="tag-game__overlay" data-overlay>
            <div class="tag-game__overlay-panel">
              <p class="tag-game__version">Tag Signal v2</p>
              <h3 data-overlay-title>Catch the signal</h3>
              <p data-overlay-copy>Tag the red runner. Grab gold signals to extend combo and leave a heat trail for the site owner.</p>
              <button class="tag-game__start" type="button" data-start>Start</button>
            </div>
          </div>
        </div>
        <div class="tag-game__footer">
          <span>Keys, click, or touch</span>
          <span data-tracking>Events: ${this.eventCount()} · Campaign: ${this.escape(this.options.campaign)}</span>
        </div>
      `;
      this.canvas = this.root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.scoreEl = this.root.querySelector('[data-score]');
      this.comboEl = this.root.querySelector('[data-combo]');
      this.timeEl = this.root.querySelector('[data-time]');
      this.bestEl = this.root.querySelector('[data-best]');
      this.trackingEl = this.root.querySelector('[data-tracking]');
      this.overlay = this.root.querySelector('[data-overlay]');
      this.overlayTitle = this.root.querySelector('[data-overlay-title]');
      this.overlayCopy = this.root.querySelector('[data-overlay-copy]');
      this.startButton = this.root.querySelector('[data-start]');
    }

    escape(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]);
    }

    bind() {
      this.startButton.addEventListener('click', () => this.start());
      window.addEventListener('keydown', (event) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
          this.keys.add(event.key.toLowerCase());
          event.preventDefault();
        }
      });
      window.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()));
      this.canvas.addEventListener('pointerdown', (event) => this.setPointer(event));
      this.canvas.addEventListener('pointermove', (event) => this.setPointer(event));
      this.canvas.addEventListener('pointerup', () => { this.pointer = null; });
      this.canvas.addEventListener('pointercancel', () => { this.pointer = null; });
      window.addEventListener('resize', () => this.resize());
    }

    setPointer(event) {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer = {
        x: (event.clientX - rect.left) * (this.options.width / rect.width),
        y: (event.clientY - rect.top) * (this.options.height / rect.height)
      };
      event.preventDefault();
    }

    resize() {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.canvas.width = Math.round(this.options.width * dpr);
      this.canvas.height = Math.round(this.options.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    start() {
      this.running = true;
      this.score = 0;
      this.combo = 1;
      this.signals = 0;
      this.remaining = this.options.duration;
      this.tagCooldown = 0;
      this.comboWindow = 0;
      this.player.x = 130;
      this.player.y = 300;
      this.target.x = 650;
      this.target.y = 300;
      this.placeSignal();
      this.lastTick = performance.now();
      this.overlay.hidden = true;
      this.track('start');
      cancelAnimationFrame(this.animation);
      this.animation = requestAnimationFrame((time) => this.tick(time));
    }

    tick(time) {
      const delta = Math.min(0.04, (time - this.lastTick) / 1000 || 0);
      this.lastTick = time;
      this.remaining = Math.max(0, this.remaining - delta);
      this.update(delta, time / 1000);
      this.draw();
      this.renderHud();
      if (this.remaining <= 0) {
        this.finish();
        return;
      }
      this.animation = requestAnimationFrame((next) => this.tick(next));
    }

    update(delta, seconds) {
      const move = this.readMove();
      const speed = this.pointer ? 325 : 275;
      this.player.x = clamp(this.player.x + move.x * speed * delta, 24, this.options.width - 24);
      this.player.y = clamp(this.player.y + move.y * speed * delta, 24, this.options.height - 24);
      this.recordHeat(this.player);

      this.moveRunner(this.target, this.player, delta, 218 + this.score * 2, seconds);
      this.decoys.forEach((decoy, index) => {
        decoy.x = 400 + Math.cos(seconds * (0.85 + index * 0.23) + index * 2.4) * (180 + index * 18);
        decoy.y = 300 + Math.sin(seconds * (1.08 + index * 0.18) + index) * (125 + index * 18);
      });

      this.comboWindow = Math.max(0, this.comboWindow - delta);
      this.shake = Math.max(0, this.shake - delta * 10);
      if (this.comboWindow <= 0) this.combo = Math.max(1, this.combo - delta * 0.55);

      if (distance(this.player, this.signal) < this.player.radius + this.signal.radius) {
        this.signals += 1;
        this.combo = Math.min(9, Math.ceil(this.combo) + 1);
        this.comboWindow = 4.5;
        this.remaining = Math.min(this.options.duration, this.remaining + 2.5);
        this.placeSignal();
        this.track('signal', {
          score: this.score,
          combo: Math.ceil(this.combo),
          signals: this.signals,
          remaining: Math.ceil(this.remaining),
          heat: this.topHeatCells()
        });
      }

      this.tagCooldown = Math.max(0, this.tagCooldown - delta);
      if (this.tagCooldown <= 0 && distance(this.player, this.target) < this.player.radius + this.target.radius) {
        const comboScore = Math.ceil(this.combo);
        this.score += comboScore;
        this.combo = Math.min(9, comboScore + 0.5);
        this.comboWindow = 3.25;
        this.tagCooldown = 0.42;
        this.shake = 1;
        this.target.x = 90 + Math.random() * (this.options.width - 180);
        this.target.y = 90 + Math.random() * (this.options.height - 180);
        this.track('tag', {
          score: this.score,
          combo: comboScore,
          remaining: Math.ceil(this.remaining),
          heat: this.topHeatCells()
        });
      }
    }

    readMove() {
      const move = { x: 0, y: 0 };
      if (this.keys.has('arrowleft') || this.keys.has('a')) move.x -= 1;
      if (this.keys.has('arrowright') || this.keys.has('d')) move.x += 1;
      if (this.keys.has('arrowup') || this.keys.has('w')) move.y -= 1;
      if (this.keys.has('arrowdown') || this.keys.has('s')) move.y += 1;

      if (this.pointer) {
        const dx = this.pointer.x - this.player.x;
        const dy = this.pointer.y - this.player.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        move.x += dx / len;
        move.y += dy / len;
      }

      const len = Math.max(1, Math.hypot(move.x, move.y));
      return { x: move.x / len, y: move.y / len };
    }

    moveRunner(runner, chaser, delta, speed, seconds) {
      let dx = runner.x - chaser.x;
      let dy = runner.y - chaser.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      dx /= len;
      dy /= len;
      runner.x += (dx * speed + Math.cos(seconds * 3.1) * 54) * delta;
      runner.y += (dy * speed + Math.sin(seconds * 2.7) * 54) * delta;
      runner.x = clamp(runner.x, 36, this.options.width - 36);
      runner.y = clamp(runner.y, 36, this.options.height - 36);
    }

    placeSignal() {
      this.signal.x = 70 + Math.random() * (this.options.width - 140);
      this.signal.y = 70 + Math.random() * (this.options.height - 140);
      this.signal.pulse = 1;
    }

    recordHeat(point) {
      const col = clamp(Math.floor(point.x / (this.options.width / this.heat.cols)), 0, this.heat.cols - 1);
      const row = clamp(Math.floor(point.y / (this.options.height / this.heat.rows)), 0, this.heat.rows - 1);
      this.heat.cells[row * this.heat.cols + col] += 1;
      if (Math.random() < 0.04) writeJson(HEAT_KEY, this.heat);
    }

    topHeatCells() {
      return this.heat.cells
        .map((count, index) => ({ cell: index, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    eventCount() {
      return readEvents().length;
    }

    renderHud() {
      this.scoreEl.textContent = this.score;
      this.comboEl.textContent = `x${Math.ceil(this.combo)}`;
      this.timeEl.textContent = `${Math.ceil(this.remaining)}s`;
      this.bestEl.textContent = this.best;
      this.trackingEl.textContent = `Events: ${this.eventCount()} · Campaign: ${this.options.campaign}`;
    }

    draw() {
      const ctx = this.ctx;
      const shakeX = this.shake ? (Math.random() - 0.5) * this.shake * 8 : 0;
      const shakeY = this.shake ? (Math.random() - 0.5) * this.shake * 8 : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      ctx.clearRect(-12, -12, this.options.width + 24, this.options.height + 24);
      ctx.fillStyle = '#e7f7f1';
      ctx.fillRect(-12, -12, this.options.width + 24, this.options.height + 24);
      this.drawHeat();
      this.drawGrid();
      this.drawZone(120, 100, '#ffc857');
      this.drawZone(620, 440, '#2f6fed');
      this.decoys.forEach((decoy) => this.drawRunner(decoy, 'decoy'));
      this.drawSignal();
      this.drawRunner(this.target, 'target');
      this.drawRunner(this.player, 'player');
      ctx.restore();
    }

    drawHeat() {
      const ctx = this.ctx;
      const cellW = this.options.width / this.heat.cols;
      const cellH = this.options.height / this.heat.rows;
      const max = Math.max(1, ...this.heat.cells);
      this.heat.cells.forEach((count, index) => {
        if (!count) return;
        const col = index % this.heat.cols;
        const row = Math.floor(index / this.heat.cols);
        ctx.fillStyle = `rgba(255, 200, 87, ${Math.min(0.28, count / max * 0.28)})`;
        ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
      });
    }

    drawGrid() {
      const ctx = this.ctx;
      ctx.strokeStyle = 'rgba(22,24,29,0.12)';
      ctx.lineWidth = 2;
      for (let x = 40; x < this.options.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.options.height);
        ctx.stroke();
      }
      for (let y = 40; y < this.options.height; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.options.width, y);
        ctx.stroke();
      }
    }

    drawZone(x, y, color) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = color;
      ctx.fillRect(x - 58, y - 34, 116, 68);
      ctx.restore();
      ctx.strokeStyle = '#16181d';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 58, y - 34, 116, 68);
    }

    drawSignal() {
      const ctx = this.ctx;
      const pulse = 1 + Math.sin(performance.now() / 170) * 0.08;
      ctx.save();
      ctx.translate(this.signal.x, this.signal.y);
      ctx.rotate(performance.now() / 650);
      ctx.fillStyle = '#ffc857';
      ctx.strokeStyle = '#16181d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        const radius = (i % 2 ? 10 : 18) * pulse;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawRunner(runner, type) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(runner.x, runner.y);
      ctx.fillStyle = 'rgba(22,24,29,0.15)';
      ctx.beginPath();
      ctx.ellipse(0, 22, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = runner.color;
      ctx.strokeStyle = '#16181d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, runner.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-11, -7, 8, 7);
      ctx.fillRect(3, -7, 8, 7);
      ctx.fillStyle = '#16181d';
      ctx.fillRect(type === 'target' ? -7 : -9, -5, 3, 3);
      ctx.fillRect(type === 'target' ? 7 : 5, -5, 3, 3);
      if (type === 'player') {
        ctx.strokeStyle = '#ffc857';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, runner.radius + 8, -0.3, 0.7);
        ctx.stroke();
      }
      ctx.restore();
    }

    finish() {
      this.running = false;
      cancelAnimationFrame(this.animation);
      writeJson(HEAT_KEY, this.heat);
      const previousBest = this.best;
      this.best = Math.max(this.best, this.score);
      localStorage.setItem(BEST_KEY, String(this.best));
      this.renderHud();
      this.overlayTitle.textContent = this.score > previousBest ? 'New best signal' : 'Round captured';
      this.overlayCopy.textContent = `Score ${this.score}. Signals ${this.signals}. Top heat cells: ${this.topHeatCells().map((cell) => cell.cell).join(', ')}.`;
      this.startButton.textContent = 'Play again';
      this.overlay.hidden = false;
      this.track('finish', {
        score: this.score,
        best: this.best,
        signals: this.signals,
        heat: this.topHeatCells()
      });
    }

    track(type, detail = {}) {
      const event = {
        version: VERSION,
        type,
        campaign: this.options.campaign,
        site: this.options.site,
        path: location.pathname,
        at: nowIso(),
        ...detail
      };
      saveEvent(event);
      sendEvent(this.options.endpoint, event);
      window.parent?.postMessage({ source: 'tag-game', event }, '*');
    }
  }

  window.TagGame = {
    version: VERSION,
    create(root, options) {
      return new TagGame(root, options);
    },
    getEvents: readEvents,
    getHeat() {
      return readJson(HEAT_KEY, createHeat());
    },
    clearEvents() {
      writeJson(STORAGE_KEY, []);
      writeJson(HEAT_KEY, createHeat());
      window.dispatchEvent(new CustomEvent('tag-game:event', { detail: null }));
    }
  };
})();
