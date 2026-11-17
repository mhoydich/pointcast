(() => {
  'use strict';
  const SIZE = 7, TYPES = 6, TOTAL = SIZE * SIZE;
  const names = ['Noun 0', 'Noun 1', 'Noun 2', 'Noun 3', 'Noun 4', 'Noun 5'];
  const images = names.map((_, i) => `assets/noun-${String(i).padStart(4, '0')}.svg`);
  const $ = id => document.getElementById(id);
  const boardEl = $('board'), status = $('status'), overlay = $('overlay');
  let board = [], level = 1, target = 0, goal = 12, collected = 0, moves = 20, score = 0, levelStartScore = 0;
  let selected = -1, busy = false, ended = false, ignoreClick = false, pointer = null;
  let modalNext = () => {};
  const sleep = ms => new Promise(resolve => setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 10 : ms));
  const rand = () => Math.floor(Math.random() * TYPES);
  function matches(cells) {
    const found = new Set();
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const p = y * SIZE + x, v = cells[p]; if (v == null) continue;
      if (x < SIZE - 2 && v === cells[p + 1] && v === cells[p + 2]) { let k = x; while (k < SIZE && cells[y * SIZE + k] === v) found.add(y * SIZE + k++); }
      if (y < SIZE - 2 && v === cells[p + SIZE] && v === cells[p + SIZE * 2]) { let k = y; while (k < SIZE && cells[k * SIZE + x] === v) found.add(k++ * SIZE + x); }
    }
    return found;
  }
  function bloom(cells, found) {
    const full = new Set(found); let bonus = false;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const p = y * SIZE + x, v = cells[p];
      if (x <= SIZE - 4 && [1,2,3].every(k => cells[p+k] === v)) { bonus = true; for (let k=0; k<SIZE; k++) full.add(y*SIZE+k); }
      if (y <= SIZE - 4 && [1,2,3].every(k => cells[p+k*SIZE] === v)) { bonus = true; for (let k=0; k<SIZE; k++) full.add(k*SIZE+x); }
    }
    return { full, bonus };
  }
  function swap(cells, a, b) { [cells[a], cells[b]] = [cells[b], cells[a]]; }
  function neighbors(a, b) { return b >= 0 && b < TOTAL && (Math.abs(a - b) === SIZE || Math.floor(a / SIZE) === Math.floor(b / SIZE) && Math.abs(a - b) === 1); }
  function available(cells) {
    for (let p = 0; p < TOTAL; p++) for (const n of [p + 1, p + SIZE]) {
      if (!neighbors(p, n)) continue;
      swap(cells, p, n); const ok = matches(cells).size > 0; swap(cells, p, n); if (ok) return true;
    }
    return false;
  }
  function newBoard() {
    let cells;
    do {
      cells = Array(TOTAL).fill(null);
      for (let p = 0; p < TOTAL; p++) {
        let choices = Array.from({ length: TYPES }, (_, i) => i);
        if (p % SIZE > 1 && cells[p - 1] === cells[p - 2]) choices = choices.filter(v => v !== cells[p - 1]);
        if (p >= SIZE * 2 && cells[p - SIZE] === cells[p - SIZE * 2]) choices = choices.filter(v => v !== cells[p - SIZE]);
        cells[p] = choices[Math.floor(Math.random() * choices.length)];
      }
    } while (!available(cells));
    return cells;
  }
  function render() {
    const focused = boardEl.contains(document.activeElement) ? Number(document.activeElement.dataset.index) : -1;
    const frag = document.createDocumentFragment();
    board.forEach((v, i) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'tile' + (selected === i ? ' selected' : ''); btn.dataset.index = i;
      btn.setAttribute('aria-label', `${names[v]}, row ${Math.floor(i / SIZE) + 1}, column ${i % SIZE + 1}${selected === i ? ', selected' : ''}`);
      btn.setAttribute('aria-pressed', selected === i ? 'true' : 'false');
      const img = document.createElement('img'); img.src = images[v]; img.alt = ''; img.draggable = false; btn.append(img); frag.append(btn);
    });
    boardEl.replaceChildren(frag);
    if (focused >= 0 && Number.isInteger(focused)) boardEl.children[focused]?.focus({ preventScroll: true });
    $('level').textContent = String(level).padStart(2, '0'); $('levelTop').textContent = String(level).padStart(2, '0');
    $('targetArt').src = images[target]; $('targetArt').alt = names[target]; $('collected').textContent = Math.min(collected, goal); $('targetCount').textContent = goal;
    $('moves').textContent = moves; $('score').textContent = score.toLocaleString(); $('progress').style.width = `${Math.min(100, collected / goal * 100)}%`;
  }
  function showModal(kicker, title, text, button, next, art = '✿') {
    $('modalKicker').textContent = kicker; $('modalTitle').textContent = title; $('modalText').textContent = text; $('modalArt').textContent = art;
    $('modalAction').innerHTML = `${button} <span>→</span>`; modalNext = next; overlay.hidden = false; $('modalAction').focus();
  }
  function begin(n) {
    if (n !== level) levelStartScore = score;
    else score = levelStartScore;
    level = n; target = (level - 1) % TYPES; goal = Math.min(25, 12 + (level - 1) * 2); moves = Math.max(18, 22 - Math.floor((level - 1) / 2)); collected = 0; selected = -1; busy = false; ended = false; board = newBoard(); overlay.hidden = true;
    status.textContent = 'Tap two neighbors or swipe to swap.'; render();
  }
  function end(won) {
    ended = true;
    if (won) showModal('GARDEN COMPLETE', 'Beautifully grown!', `You gathered ${goal} ${names[target]} friends. Your garden is blooming!`, 'Next garden', () => begin(level + 1), '✿');
    else showModal('ONE MORE TRY', 'Keep growing.', `You gathered ${collected} of ${goal} ${names[target]} friends. Give this garden another go.`, 'Try again', () => begin(level), '❋');
  }
  async function attempt(a, b) {
    if (busy || ended || !neighbors(a, b)) return;
    busy = true; selected = -1; swap(board, a, b); render(); await sleep(130);
    let found = matches(board);
    if (!found.size) {
      swap(board, a, b); render(); boardEl.children[a]?.classList.add('invalid'); boardEl.children[b]?.classList.add('invalid');
      status.textContent = 'That swap needs a line of three. Try another!'; await sleep(240); busy = false; return;
    }
    moves--; let chain = 0;
    while (found.size) {
      chain++; const expanded = bloom(board, found); found = expanded.full;
      found.forEach(i => { if (board[i] === target) collected++; boardEl.children[i]?.classList.add('clearing'); });
      score += found.size * 20 * chain; status.textContent = expanded.bonus ? 'Bloom bonus! Four in a row clears the whole line.' : chain > 1 ? `A ${chain}× garden cascade!` : `Lovely match! ${found.size} Nouns gathered.`;
      renderHud(); await sleep(240); found.forEach(i => board[i] = null);
      for (let x = 0; x < SIZE; x++) {
        let write = SIZE - 1;
        for (let y = SIZE - 1; y >= 0; y--) { const v = board[y * SIZE + x]; if (v !== null) { board[write * SIZE + x] = v; if (write !== y) board[y * SIZE + x] = null; write--; } }
        while (write >= 0) board[write-- * SIZE + x] = rand();
      }
      render(); await sleep(170); found = matches(board);
    }
    if (collected >= goal) { busy = false; end(true); return; }
    if (moves <= 0) { busy = false; end(false); return; }
    if (!available(board)) { board = newBoard(); render(); status.textContent = 'Fresh garden! The Nouns reshuffled for you.'; }
    busy = false;
  }
  function renderHud() { $('collected').textContent = Math.min(collected, goal); $('moves').textContent = moves; $('score').textContent = score.toLocaleString(); $('progress').style.width = `${Math.min(100, collected / goal * 100)}%`; }
  function choose(i) {
    if (busy || ended) return;
    if (selected < 0) { selected = i; render(); boardEl.children[i]?.focus(); status.textContent = `${names[board[i]]} selected. Choose a neighbor.`; }
    else if (selected === i) { selected = -1; render(); status.textContent = 'Tap two neighbors or swipe to swap.'; }
    else if (neighbors(selected, i)) attempt(selected, i);
    else { selected = i; render(); status.textContent = 'Choose a neighboring Noun to swap.'; }
  }
  boardEl.addEventListener('click', e => { const tile = e.target.closest('.tile'); if (!tile || ignoreClick) return; choose(Number(tile.dataset.index)); });
  boardEl.addEventListener('pointerdown', e => { const tile = e.target.closest('.tile'); if (tile && !busy && !ended) pointer = { x: e.clientX, y: e.clientY, index: Number(tile.dataset.index) }; });
  boardEl.addEventListener('pointerup', e => {
    if (!pointer) return; const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y, start = pointer.index; pointer = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return;
    const horizontal = Math.abs(dx) > Math.abs(dy), dest = start + (horizontal ? (dx > 0 ? 1 : -1) : (dy > 0 ? SIZE : -SIZE));
    ignoreClick = true; setTimeout(() => { ignoreClick = false; }, 350); if (neighbors(start, dest)) attempt(start, dest);
  });
  boardEl.addEventListener('pointercancel', () => { pointer = null; });
  boardEl.addEventListener('keydown', e => {
    const tile = e.target.closest('.tile'); if (!tile || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    e.preventDefault(); const i = Number(tile.dataset.index), dest = i + ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -SIZE, ArrowDown: SIZE }[e.key]);
    if (neighbors(i, dest)) { if (selected === i) { boardEl.children[dest]?.focus({ preventScroll: true }); attempt(i, dest); } else boardEl.children[dest]?.focus({ preventScroll: true }); }
  });
  $('restart').addEventListener('click', () => { if (!busy) begin(level); });
  $('help').addEventListener('click', () => { if (busy || ended) return; showModal('HOW TO PLAY', 'Make a little magic.', 'Swipe neighbors or tap two tiles to swap. Make a line of three or more. Four clears the whole line! Gather the featured Noun before your moves run out.', 'Back to garden', () => { overlay.hidden = true; }); });
  $('modalAction').addEventListener('click', () => modalNext());
  begin(1); showModal('WELCOME TO NOUNS GARDEN', 'Ready to grow?', 'Swap neighbors to make a line of three. Gather the Noun shown in your goal before your moves run out.', "Let's play", () => { overlay.hidden = true; });
})();
