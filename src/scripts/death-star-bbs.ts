import { COLUMNS, ROWS, NOTES, TARGETS, WINDS, cleanHandle, freshGame, fireArrow, nextArrow, makeDisplay } from '../lib/death-star-bbs.mjs';

const root = document.querySelector<HTMLElement>('[data-death-star]');
if (root) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const context = canvas.getContext('2d');
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const controls = root.querySelector<HTMLElement>('[data-controls]')!;
  const status = root.querySelector<HTMLElement>('[data-bbs-status]')!;
  const mirror = root.querySelector<HTMLElement>('[data-screen-text]')!;
  const heading = root.querySelector<HTMLElement>('[data-screen-title]')!;
  const details = root.querySelector<HTMLDetailsElement>('[data-text-view]')!;
  const slow = root.querySelector<HTMLInputElement>('[data-slow]')!;
  const skip = root.querySelector<HTMLButtonElement>('[data-skip]')!;
  const palette = root.querySelector<HTMLSelectElement>('[data-palette]')!;
  const handleForm = root.querySelector<HTMLFormElement>('[data-handle-form]')!;
  const handleInput = handleForm.querySelector<HTMLInputElement>('input')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const localKey = 'pointcast:death-star:local-handle:v1';
  const bestKey = 'pointcast:death-star:archery-best:v1';
  let handle = 'VISITOR';
  let best: number | null = null;
  try {
    handle = cleanHandle(localStorage.getItem(localKey) || 'VISITOR');
    const rawBest = localStorage.getItem(bestKey);
    const stored = rawBest === null ? NaN : Number(rawBest);
    if (Number.isInteger(stored) && stored >= 0 && stored <= 50) best = stored;
  } catch { /* A local visit works when storage is denied. */ }
  const state = { view: 'welcome', note: 0, handle, best, game: freshGame() };
  const palettes: Record<string, { background: string; foreground: string }> = {
    blue: { background: '#183985', foreground: '#c6dcff' },
    green: { background: '#0f2519', foreground: '#b8e992' },
    amber: { background: '#2a2012', foreground: '#f2cd82' },
  };
  let atlasPixels: ImageData | null = null;
  let tinted: HTMLCanvasElement | null = null;
  let display = makeDisplay(state);
  let drawTimer: ReturnType<typeof setTimeout> | undefined;
  const original = 'https://hoydich.wordpress.com/2013/09/10/death-star-bbs-1987/';

  function tintAtlas() {
    if (!atlasPixels) return;
    const colors = palettes[palette.value] || palettes.blue;
    const rgb = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
    const foreground = rgb(colors.foreground);
    const background = rgb(colors.background);
    tinted = document.createElement('canvas');
    tinted.width = 256; tinted.height = 256;
    const target = tinted.getContext('2d')!;
    const result = target.createImageData(256, 256);
    // Normal atlas cells are black ink on white. Derive inverse cells from
    // the normal half because the sheet's 0x9B is an EOL display exception.
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const sourceOffset = ((y % 128) * 256 + x) * 4;
        const normalInk = atlasPixels.data[sourceOffset] < 128;
        const ink = y >= 128 ? !normalInk : normalInk;
        const color = ink ? foreground : background;
        const destination = (y * 256 + x) * 4;
        result.data[destination] = color[0]; result.data[destination + 1] = color[1]; result.data[destination + 2] = color[2]; result.data[destination + 3] = 255;
      }
    }
    target.putImageData(result, 0, 0);
    root!.dataset.palette = palette.value;
  }
  function drawCell(index: number) {
    if (!context || !tinted) return;
    const code = display.cells[index];
    context.drawImage(tinted, (code % 16) * 16, Math.floor(code / 16) * 16, 16, 16, (index % COLUMNS) * 16, Math.floor(index / COLUMNS) * 16, 16, 16);
  }
  function finishDrawing() {
    const restoreTerminalFocus = document.activeElement === skip;
    clearTimeout(drawTimer);
    if (context && tinted) {
      context.imageSmoothingEnabled = false;
      for (let index = 0; index < COLUMNS * ROWS; index++) drawCell(index);
    }
    skip.hidden = true;
    stage.setAttribute('aria-busy', 'false');
    // The skip control disappears at completion. Keep keyboard users inside
    // the terminal instead of leaving focus on a now-hidden button.
    if (restoreTerminalFocus) stage.focus({ preventScroll: true });
  }
  function draw(reveal = false) {
    clearTimeout(drawTimer);
    if (!context || !tinted) return;
    const colors = palettes[palette.value] || palettes.blue;
    context.fillStyle = colors.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    if (!reveal || !slow.checked || reduced.matches || state.view === 'game') { finishDrawing(); return; }
    const inkCells = display.cells.flatMap((code: number, index: number) => code === 32 ? [] : [index]);
    let position = 0;
    skip.hidden = false;
    stage.setAttribute('aria-busy', 'true');
    const tick = () => {
      drawCell(inkCells[position++]);
      if (position < inkCells.length) drawTimer = setTimeout(tick, 33);
      else finishDrawing();
    };
    tick();
  }
  type Action = { key: string; label: string; command: string; primary?: boolean };
  const menuAction: Action = { key: 'ESC', label: 'Main menu', command: 'MENU' };
  function actions(): Action[] {
    if (state.view === 'welcome' || state.view === 'offline') return [{ key: '↵', label: 'Dial into the board', command: 'MENU', primary: true }];
    if (state.view === 'menu') return [
      { key: 'B', label: 'Bulletins', command: 'B' }, { key: 'G', label: 'Archery', command: 'G' },
      { key: 'A', label: 'Glyph room', command: 'A' }, { key: 'I', label: 'System info', command: 'I' },
      { key: 'H', label: 'Your handle', command: 'H' }, { key: 'C', label: 'The club', command: 'C' },
      { key: 'Q', label: 'Hang up', command: 'Q' },
    ];
    if (state.view === 'bulletins') return [{ key: 'P', label: 'Previous note', command: 'P' }, { key: 'N', label: 'Next note', command: 'N', primary: true }, menuAction];
    if (state.view === 'game') {
      if (state.game.complete) return [{ key: 'R', label: 'Play again', command: 'R', primary: true }, menuAction];
      if (state.game.shot) return [{ key: '↵', label: state.game.round === 4 ? 'See your total' : 'Next arrow', command: 'NEXT', primary: true }, menuAction];
      return [{ key: '↑', label: 'Aim up', command: 'UP' }, { key: 'SPACE', label: 'Fire arrow', command: 'FIRE', primary: true }, { key: '↓', label: 'Aim down', command: 'DOWN' }, menuAction];
    }
    if (state.view === 'info') return [{ key: 'O', label: 'Original post', command: 'O' }, menuAction];
    return [menuAction];
  }
  function render(announce = true, reveal = true) {
    const oldView = root!.dataset.view;
    root!.dataset.view = state.view;
    display = makeDisplay(state);
    heading.textContent = display.title;
    mirror.textContent = display.readable;
    if (announce) {
      if (state.view === 'game' && !state.game.complete) {
        const game = state.game;
        status.textContent = game.shot
          ? `Arrow ${game.round + 1}: ${game.shot.points} points. Total ${game.score}. Press Enter for ${game.round === 4 ? 'your final score' : 'the next arrow'}.`
          : `Arrow ${game.round + 1}. Aim ${game.aim + 1}, target ${TARGETS[game.round] + 1}, wind ${WINDS[game.round]}. Up and Down aim; Space fires.`;
      } else status.textContent = display.readable;
    }
    handleForm.hidden = state.view !== 'handle';
    if (state.view === 'handle' && oldView !== 'handle') handleInput.value = state.handle === 'VISITOR' ? '' : state.handle;
    const activeCommand = (document.activeElement as HTMLElement | null)?.dataset.action;
    controls.replaceChildren();
    for (const action of actions()) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.action = action.command;
      if (action.primary) button.className = 'action-primary';
      const key = document.createElement('kbd'); key.textContent = action.key;
      const text = document.createElement('span'); text.textContent = action.label;
      button.append(key, text); controls.append(button);
    }
    // Keep keyboard focus after a control set changes, especially FIRE -> NEXT.
    if (activeCommand) {
      const nextButton = [...controls.querySelectorAll<HTMLButtonElement>('button')].find(button => button.dataset.action === activeCommand);
      (nextButton || controls.querySelector<HTMLButtonElement>('button'))?.focus({ preventScroll: true });
    }
    draw(reveal);
  }
  function saveBest() {
    if (state.best === null || state.game.score > state.best) {
      state.best = state.game.score;
      try { localStorage.setItem(bestKey, String(state.best)); } catch { /* Session best is still shown. */ }
    }
  }
  function command(key: string) {
    if (key === 'C') { window.location.assign('/atari-bbs/club/'); return; }
    if (key === 'O') { window.location.assign(original); return; }
    if (key === 'MENU') state.view = 'menu';
    else if (key === 'Q') state.view = 'offline';
    else if (state.view === 'game' && ['UP', 'DOWN', 'FIRE', 'NEXT', 'R'].includes(key)) {
      if (key === 'R') state.game = freshGame();
      else if (key === 'NEXT') { state.game = nextArrow(state.game); if (state.game.complete) saveBest(); }
      else if (key === 'FIRE') state.game = fireArrow(state.game);
      else if (!state.game.shot && !state.game.complete) state.game.aim = Math.max(0, Math.min(6, state.game.aim + (key === 'UP' ? -1 : 1)));
    } else if (state.view === 'bulletins' && (key === 'N' || key === 'P')) {
      state.note = (state.note + (key === 'N' ? 1 : NOTES.length - 1)) % NOTES.length;
    } else if (key === 'B') { state.view = 'bulletins'; state.note = 0; }
    else if (key === 'A') state.view = 'glyphs';
    else if (key === 'I') state.view = 'info';
    else if (key === 'H') state.view = 'handle';
    else if (key === 'G') { state.view = 'game'; state.game = freshGame(); }
    else return;
    render();
    if (state.view === 'handle') handleInput.focus({ preventScroll: true });
  }
  controls.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (button) command(button.dataset.action!);
  });
  root.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const target = event.target as HTMLElement;
    const editable = target.closest('input, select, textarea');
    if (editable) {
      if (event.key === 'Escape' && state.view === 'handle') { event.preventDefault(); command('MENU'); stage.focus({ preventScroll: true }); }
      return;
    }
    // Native Enter/Space on a visible button must fire exactly once through click.
    if (target.closest('button, a, summary') && (event.key === 'Enter' || event.key === ' ')) return;
    let key = event.key.toUpperCase();
    if (key === 'ESCAPE') key = 'MENU';
    else if (state.view === 'game') {
      if (key === 'ARROWUP') key = 'UP';
      else if (key === 'ARROWDOWN') key = 'DOWN';
      else if (key === ' ') key = 'FIRE';
      else if (key === 'ENTER') key = state.game.shot ? 'NEXT' : 'FIRE';
    } else if ((state.view === 'welcome' || state.view === 'offline') && key === 'ENTER') key = 'MENU';
    if (actions().some(action => action.command === key) || key === 'MENU') { event.preventDefault(); command(key); }
  });
  handleForm.addEventListener('submit', event => {
    event.preventDefault();
    state.handle = cleanHandle(handleInput.value);
    let saved = true;
    try { localStorage.setItem(localKey, state.handle); } catch { saved = false; }
    command('MENU'); stage.focus({ preventScroll: true });
    status.textContent = `Welcome, ${state.handle}. ${saved ? 'Handle saved only in this browser.' : 'Storage is unavailable; your handle lasts for this visit.'} ${display.readable}`;
  });
  palette.addEventListener('change', () => { tintAtlas(); draw(); });
  slow.addEventListener('change', () => { if (!slow.checked) finishDrawing(); });
  skip.addEventListener('click', finishDrawing);
  const applyMotion = () => { if (reduced.matches) { slow.checked = false; finishDrawing(); } slow.disabled = reduced.matches; };
  reduced.addEventListener?.('change', applyMotion);
  applyMotion();
  window.addEventListener('pagehide', finishDrawing);
  window.addEventListener('pageshow', () => { if (tinted) finishDrawing(); });
  const failAtlas = () => {
    canvas.hidden = true; details.open = true;
    status.textContent = 'The ATASCII image could not load. The readable terminal and all controls still work below.';
    root!.querySelector<HTMLElement>('[data-render-note]')!.textContent = 'Text display active · glyph image unavailable';
  };
  render(false, false);
  if (document.activeElement === document.body) stage.focus({ preventScroll: true });
  if (!context) failAtlas();
  else {
    const atlas = new Image();
    atlas.onload = () => {
      try {
        const source = document.createElement('canvas'); source.width = 256; source.height = 256;
        const ctx = source.getContext('2d')!; ctx.drawImage(atlas, 0, 0);
        atlasPixels = ctx.getImageData(0, 0, 256, 256);
        tintAtlas(); draw(false);
      } catch { failAtlas(); }
    };
    atlas.onerror = failAtlas;
    atlas.src = '/images/atari-bbs/atascii.gif';
  }
}
