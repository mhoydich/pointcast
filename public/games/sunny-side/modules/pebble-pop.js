const COLORS = ['#df8469', '#dfb949', '#72a9ad', '#899d68', '#a596b9'];
const INK = '#294844';
const ROWS = 7;
const COLS = 6;
const CELL = 58;
const LEFT = 66;
const TOP = 133;

function panel(ctx, x, y, w, h, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}

export default function createGame(api) {
  let board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ color: Math.floor(Math.random() * COLORS.length), fall: 0 })));
  let total = 0;
  let moves = 20;
  let time = 0;
  let clearing = null;
  let cursor = { r: 0, c: 0 };
  let hovered = null;
  let keyboard = false;
  let note = 'Tap 2 or more touching pebbles';
  let noteTime = 0;
  let largest = 0;
  let ended = false;
  api.score(0);

  function group(r, c) {
    const color = board[r][c].color;
    const result = [];
    const seen = new Set();
    const queue = [[r, c]];
    while (queue.length) {
      const [rr, cc] = queue.pop();
      const id = rr * COLS + cc;
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || seen.has(id) || board[rr][cc].color !== color) continue;
      seen.add(id);
      result.push([rr, cc]);
      queue.push([rr - 1, cc], [rr + 1, cc], [rr, cc - 1], [rr, cc + 1]);
    }
    return result;
  }
  function playable() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if ((r && board[r][c].color === board[r - 1][c].color) || (c && board[r][c].color === board[r][c - 1].color)) return true;
    }
    return false;
  }
  function ensureMove() {
    if (!playable()) {
      board[0][1].color = board[0][0].color;
      note = 'A fresh pair rolled in';
      noteTime = 1.5;
    }
  }
  ensureMove();
  function select(r, c) {
    if (ended || clearing || moves <= 0) return;
    cursor = { r, c };
    const cells = group(r, c);
    if (cells.length < 2) {
      note = 'Find a pebble with a matching neighbor';
      noteTime = 1.4;
      return;
    }
    const points = cells.length * cells.length * 10;
    moves--;
    total += points;
    largest = Math.max(largest, cells.length);
    api.score(total);
    clearing = { cells, timer: 0.27, duration: 0.27 };
    hovered = null;
    note = cells.length >= 7 ? `${cells.length} pebbles! A garden-sized pop · +${points}` : `${cells.length} pebbles · +${points}`;
    noteTime = 1.6;
    for (const [rr, cc] of cells) api.burst(LEFT + (cc + 0.5) * CELL, TOP + (rr + 0.5) * CELL, COLORS[board[rr][cc].color]);
  }
  function settle() {
    const removed = new Set(clearing.cells.map(([r, c]) => r * COLS + c));
    for (let c = 0; c < COLS; c++) {
      const keep = [];
      for (let r = ROWS - 1; r >= 0; r--) if (!removed.has(r * COLS + c)) keep.push({ ...board[r][c], oldRow: r });
      for (let r = ROWS - 1, i = 0; r >= 0; r--, i++) {
        const pebble = keep[i];
        board[r][c] = pebble ? { color: pebble.color, fall: -(r - pebble.oldRow) * CELL } : { color: Math.floor(Math.random() * COLORS.length), fall: -(i - keep.length + 1) * CELL - (ROWS - keep.length) * CELL };
      }
    }
    clearing = null;
    ensureMove();
    if (!moves) {
      ended = true;
      api.finish(`20 moves, ${total.toLocaleString()} points. Your biggest pop cleared ${largest} pebbles!`);
    }
  }
  function position(x, y) {
    const c = Math.floor((x - LEFT) / CELL);
    const r = Math.floor((y - TOP) / CELL);
    return c >= 0 && c < COLS && r >= 0 && r < ROWS ? { r, c } : null;
  }
  return {
    update(dt) {
      const step = Math.min(dt, 0.1);
      time += step;
      noteTime = Math.max(0, noteTime - step);
      if (clearing) {
        clearing.timer -= step;
        if (clearing.timer <= 0) settle();
      }
      for (const row of board) for (const pebble of row) pebble.fall *= Math.exp(-step * 15);
    },
    draw(ctx) {
      panel(ctx, 28, 22, 424, 86, 22, 'rgba(255,252,235,.96)');
      ctx.fillStyle = INK;
      ctx.font = '700 12px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MAKE A LITTLE CHAIN', 48, 47);
      ctx.font = '700 17px system-ui,sans-serif';
      ctx.fillText(noteTime ? note : 'Same color. Touching sides. Pop!', 48, 76, 300);
      ctx.textAlign = 'right';
      ctx.font = '800 25px system-ui,sans-serif';
      ctx.fillText(moves, 431, 59);
      ctx.font = '600 10px system-ui,sans-serif';
      ctx.fillText('MOVES', 431, 78);
      panel(ctx, LEFT - 11, TOP - 11, COLS * CELL + 22, ROWS * CELL + 22, 24, 'rgba(49,74,65,.84)');
      const current = keyboard ? cursor : hovered;
      const selected = current && !clearing ? group(current.r, current.c) : [];
      const selectedSet = new Set(selected.map(([r, c]) => r * COLS + c));
      const removed = new Set(clearing?.cells.map(([r, c]) => r * COLS + c) ?? []);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const pebble = board[r][c];
        const selectedCell = selected.length > 1 && selectedSet.has(r * COLS + c);
        let scale = 1;
        if (removed.has(r * COLS + c)) scale = Math.max(0, clearing.timer / clearing.duration);
        const x = LEFT + (c + 0.5) * CELL;
        const y = TOP + (r + 0.5) * CELL + pebble.fall;
        if (y < TOP - 2) continue;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale * (selectedCell ? 1.04 : 1), scale * (selectedCell ? 1.04 : 1));
        ctx.rotate(Math.sin(r * 11 + c * 3) * 0.1);
        ctx.fillStyle = '#183f34';
        ctx.beginPath(); ctx.ellipse(0, 5, 24, 23, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS[pebble.color];
        ctx.beginPath(); ctx.ellipse(0, 0, 23, 23, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.23)';
        ctx.beginPath(); ctx.ellipse(-6, -8, 10, 5, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(30,55,41,.22)';
        ctx.beginPath(); ctx.arc(7, 6, 2, 0, Math.PI * 2); ctx.fill();
        if (selectedCell) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff3b9'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 24, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
      }
      if (keyboard) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(LEFT + cursor.c * CELL + 1, TOP + cursor.r * CELL + 1, CELL - 2, CELL - 2, 15); ctx.stroke();
      }
      panel(ctx, 65, 563, 350, 28, 14, 'rgba(255,252,235,.94)');
      ctx.textAlign = 'center'; ctx.fillStyle = '#476151'; ctx.font = '600 12px system-ui,sans-serif';
      ctx.fillText('Bigger groups make bigger scores', 240, 582);
    },
    pointer(x, y, phase) {
      keyboard = false;
      hovered = position(x, y);
      if (phase === 'down' && hovered) select(hovered.r, hovered.c);
      if (phase === 'up') hovered = null;
    },
    key(key, pressed) {
      if (!pressed || ended) return;
      keyboard = true;
      if (key === 'ArrowLeft') cursor.c = (cursor.c + COLS - 1) % COLS;
      else if (key === 'ArrowRight') cursor.c = (cursor.c + 1) % COLS;
      else if (key === 'ArrowUp') cursor.r = (cursor.r + ROWS - 1) % ROWS;
      else if (key === 'ArrowDown') cursor.r = (cursor.r + 1) % ROWS;
      else if (key === 'Enter' || key === ' ' || key === 'Space') select(cursor.r, cursor.c);
    }
  };
}
