/**
 * Shared chrome for every fireplace: a "brought to you by Good Feels"
 * footer pinned to the bottom-right, a tap-to-enable-audio overlay, and
 * a minimal pixel border. One small dependency-free module so each
 * fireplace HTML stays focused on its own art.
 */

import { FireCrackle } from "./fire.js";

export function mountChrome({ title, mood, audio = true, onUserStart } = {}) {
  // ── Footer ─────────────────────────────────────────────────────────
  const foot = document.createElement("div");
  foot.className = "gf-foot";
  foot.innerHTML = `
    <div class="gf-foot-inner">
      <span class="gf-flame">🔥</span>
      <span class="gf-title">${title || "fireplace"}</span>
      ${mood ? `<span class="gf-mood">${mood}</span>` : ""}
      <a class="gf-sponsor" href="https://shop.getgoodfeels.com" target="_blank" rel="noopener sponsored">
        brought to you by <b>Good Feels</b> · shop.getgoodfeels.com
      </a>
    </div>`;
  document.body.appendChild(foot);

  // ── Audio gate ─────────────────────────────────────────────────────
  let crackle = null;
  if (audio) {
    const gate = document.createElement("button");
    gate.className = "gf-gate";
    gate.innerHTML = `<span class="gf-gate-text">tap to light the fire</span>`;
    document.body.appendChild(gate);
    gate.addEventListener("click", () => {
      gate.classList.add("gf-gate-out");
      setTimeout(() => gate.remove(), 600);
      crackle = new FireCrackle({ volume: 0.04, rateHz: 7 });
      crackle.start();
      if (onUserStart) onUserStart();
    });
  } else if (onUserStart) {
    onUserStart();
  }

  // ── Styles ─────────────────────────────────────────────────────────
  const css = document.createElement("style");
  css.textContent = `
    :root {
      --gf-ink: #f5e8c8;
      --gf-dim: #8a7860;
      --gf-bg: #0a0604;
      --gf-accent: #d86440;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: var(--gf-bg);
      color: var(--gf-ink);
      font-family: 'Departure Mono', 'VT323', ui-monospace, monospace;
      overflow: hidden;
      height: 100%;
      image-rendering: pixelated;
      -webkit-font-smoothing: none;
    }
    canvas { image-rendering: pixelated; }

    .gf-foot {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      pointer-events: none;
      z-index: 10;
      padding: 6px 10px;
      background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0));
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .gf-foot-inner {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .gf-foot .gf-title { font-weight: bold; color: var(--gf-ink); }
    .gf-foot .gf-mood { color: var(--gf-dim); font-style: italic; }
    .gf-foot .gf-flame { font-size: 14px; }
    .gf-foot .gf-sponsor {
      pointer-events: auto;
      color: var(--gf-accent);
      text-decoration: none;
      border-left: 1px dashed var(--gf-dim);
      padding-left: 10px;
      transition: filter 0.2s;
    }
    .gf-foot .gf-sponsor:hover { filter: brightness(1.4); text-decoration: underline; }

    .gf-gate {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(2px);
      color: var(--gf-ink);
      border: none;
      cursor: pointer;
      z-index: 20;
      display: flex; align-items: center; justify-content: center;
      font-family: inherit;
      font-size: 14px;
      letter-spacing: 2px;
      transition: opacity 0.6s;
    }
    .gf-gate-text {
      padding: 12px 22px;
      border: 2px dashed var(--gf-ink);
      animation: gf-pulse 1.4s infinite;
    }
    .gf-gate-out { opacity: 0; }
    @keyframes gf-pulse {
      50% { transform: scale(1.04); border-color: var(--gf-accent); color: var(--gf-accent); }
    }

    @media (max-width: 480px) {
      .gf-foot { font-size: 10px; }
      .gf-foot .gf-sponsor { border-left: none; padding-left: 0; }
    }
  `;
  document.head.appendChild(css);

  // Departure Mono / VT323
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Departure+Mono&family=VT323&display=swap";
  document.head.appendChild(fontLink);
}
