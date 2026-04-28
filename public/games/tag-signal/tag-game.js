(function () {
  const STORAGE_KEY = 'tag-game-events-v1';
  const DEFAULTS = {
    duration: 30,
    campaign: 'default',
    site: location.hostname || 'local',
    endpoint: '',
    width: 800,
    height: 600
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nowIso = () => new Date().toISOString();

  function readEvents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function writeEvents(events) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-100)));
  }

  function saveEvent(event) {
    const events = readEvents();
    events.push(event);
    writeEvents(events);
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

  function createPlayer(x, y, color) {
    return {
      x,
      y,
      radius: 18,
      vx: 0,
      vy: 0,
      color
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
      this.best = Number(localStorage.getItem('tag-game-best') || 0);
      this.lastTick = 0;
      this.remaining = this.options.duration;
      this.tagCooldown = 0;
      this.player = createPlayer(140, 300, '#2f6fed');
      this.target = createPlayer(640, 300, '#e94f37');
      this.decoys = [
        createPlayer(390, 170, '#ffc857'),
        createPlayer(390, 430, '#0f9f8f')
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
          <div class="tag-game__stat"><span class="tag-game__label">Tags</span><span class="tag-game__value" data-score>0</span></div>
          <div class="tag-game__stat"><span class="tag-game__label">Clock</span><span class="tag-game__value" data-time>${this.options.duration}s</span></div>
          <div class="tag-game__stat"><span class="tag-game__label">Best</span><span class="tag-game__value" data-best>${this.best}</span></div>
        </div>
        <div class="tag-game__stage-wrap">
          <canvas width="${this.options.width}" height="${this.options.height}" aria-label="Tag Signal game board"></canvas>
          <div class="tag-game__overlay" data-overlay>
            <div class="tag-game__overlay-panel">
              <h3 data-overlay-title>Tag Signal</h3>
              <p data-overlay-copy>Tag the red runner before time expires. Move with arrow keys, WASD, or drag/tap.</p>
              <button class="tag-game__start" type="button" data-start>Start</button>
            </div>
          </div>
        </div>
        <div class="tag-game__footer">
          <span>Arrow keys, WASD, click, or touch</span>
          <span>Campaign: ${this.escape(this.options.campaign)}</span>
        </div>
      `;
      this.canvas = this.root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.scoreEl = this.root.querySelector('[data-score]');
      this.timeEl = this.root.querySelector('[data-time]');
      this.bestEl = this.root.querySelector('[data-best]');
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
      const scaleX = this.options.width / rect.width;
      const scaleY = this.options.height / rect.height;
      this.pointer = {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
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
      this.remaining = this.options.duration;
      this.player.x = 140;
      this.player.y = 300;
      this.target.x = 640;
      this.target.y = 300;
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
      const speed = this.pointer ? 310 : 260;
      this.player.x = clamp(this.player.x + (move.x / len) * speed * delta, 24, this.options.width - 24);
      this.player.y = clamp(this.player.y + (move.y / len) * speed * delta, 24, this.options.height - 24);

      this.moveRunner(this.target, this.player, delta, 220, seconds);
      this.decoys.forEach((decoy, index) => {
        decoy.x = 400 + Math.cos(seconds * (0.9 + index * 0.3) + index * 2.4) * 210;
        decoy.y = 300 + Math.sin(seconds * (1.2 + index * 0.2) + index) * 150;
      });

      this.tagCooldown = Math.max(0, this.tagCooldown - delta);
      if (this.tagCooldown <= 0 && distance(this.player, this.target) < this.player.radius + this.target.radius) {
        this.score += 1;
        this.tagCooldown = 0.45;
        this.target.x = 90 + Math.random() * (this.options.width - 180);
        this.target.y = 90 + Math.random() * (this.options.height - 180);
        this.track('tag', { score: this.score, remaining: Math.ceil(this.remaining) });
      }
    }

    moveRunner(runner, chaser, delta, speed, seconds) {
      let dx = runner.x - chaser.x;
      let dy = runner.y - chaser.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      dx /= len;
      dy /= len;
      runner.x += (dx * speed + Math.cos(seconds * 3.1) * 42) * delta;
      runner.y += (dy * speed + Math.sin(seconds * 2.7) * 42) * delta;

      if (runner.x < 36 || runner.x > this.options.width - 36) runner.x = clamp(runner.x, 36, this.options.width - 36);
      if (runner.y < 36 || runner.y > this.options.height - 36) runner.y = clamp(runner.y, 36, this.options.height - 36);
    }

    renderHud() {
      this.scoreEl.textContent = this.score;
      this.timeEl.textContent = `${Math.ceil(this.remaining)}s`;
      this.bestEl.textContent = this.best;
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.options.width, this.options.height);
      ctx.fillStyle = '#e7f7f1';
      ctx.fillRect(0, 0, this.options.width, this.options.height);

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

      this.drawZone(120, 100, '#ffc857');
      this.drawZone(620, 440, '#2f6fed');
      this.decoys.forEach((decoy) => this.drawRunner(decoy, 'decoy'));
      this.drawRunner(this.target, 'target');
      this.drawRunner(this.player, 'player');
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
      const previousBest = this.best;
      this.best = Math.max(this.best, this.score);
      localStorage.setItem('tag-game-best', String(this.best));
      this.renderHud();
      this.overlayTitle.textContent = this.score > previousBest ? 'New best' : 'Round over';
      this.overlayCopy.textContent = `You tagged ${this.score} runner${this.score === 1 ? '' : 's'}.`;
      this.startButton.textContent = 'Play again';
      this.overlay.hidden = false;
      this.track('finish', { score: this.score, best: this.best });
    }

    track(type, detail = {}) {
      const event = {
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
    create(root, options) {
      return new TagGame(root, options);
    },
    getEvents: readEvents,
    clearEvents() {
      writeEvents([]);
      window.dispatchEvent(new CustomEvent('tag-game:event', { detail: null }));
    }
  };
})();
