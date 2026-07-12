import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$NounsColaCrush = createComponent(async ($$result, $$props, $$slots) => {
  const GOALS = [
    { type: "can", label: "Cola cans", short: "CAN", target: 20 },
    { type: "cap", label: "Bottle caps", short: "CAP", target: 18 },
    { type: "fizz", label: "Fizz drops", short: "FIZ", target: 16 }
  ];
  const PIECES = [
    { type: "can", label: "Cola can", short: "CAN" },
    { type: "cap", label: "Bottle cap", short: "CAP" },
    { type: "fizz", label: "Fizz drop", short: "FIZ" },
    { type: "cherry", label: "Cherry pop", short: "POP" },
    { type: "lemon", label: "Lemon bolt", short: "ZIP" },
    { type: "noggles", label: "Nouns glasses", short: "NOG" }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        "@id": "https://pointcast.xyz/nouns-cola-crush#game",
        name: "Nouns Cola Crush",
        description: "A browser-playable Nouns Cola match-3 puzzle game on PointCast.",
        url: "https://pointcast.xyz/nouns-cola-crush",
        image: "https://pointcast.xyz/images/nouns-cola-crush/super-graphics.png",
        gamePlatform: "Web browser",
        genre: "Match-3 puzzle",
        inLanguage: "en-US"
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://pointcast.xyz/nouns-cola-crush#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://pointcast.xyz/" },
          { "@type": "ListItem", position: 2, name: "Nouns Cola", item: "https://pointcast.xyz/nouns-cola" },
          { "@type": "ListItem", position: 3, name: "Nouns Cola Crush", item: "https://pointcast.xyz/nouns-cola-crush" }
        ]
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Cola Crush", "description": "A playable Nouns Cola match-3 puzzle game with generator-made arcade graphics, cascades, goals, score, moves, and local high score.", "image": "/images/og/nouns-cola-crush.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/nouns-cola-crush.json", title: "Nouns Cola Crush game manifest (JSON)" }], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-cola-crush.png",
    buttons: [
      { label: "Play game", action: "link", target: "https://pointcast.xyz/nouns-cola-crush" },
      { label: "Nouns Cola", action: "link", target: "https://pointcast.xyz/nouns-cola" },
      { label: "Game JSON", action: "link", target: "https://pointcast.xyz/nouns-cola-crush.json" },
      { label: "Home feed", action: "link", target: "https://pointcast.xyz/" }
    ]
  }, "data-astro-cid-iznzqsfo": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="crush-page" data-crush-game data-astro-cid-iznzqsfo> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-iznzqsfo> <a href="/" data-astro-cid-iznzqsfo>Home</a> <span aria-hidden="true" data-astro-cid-iznzqsfo>/</span> <a href="/nouns-cola" data-astro-cid-iznzqsfo>Nouns Cola</a> <span aria-hidden="true" data-astro-cid-iznzqsfo>/</span> <span data-astro-cid-iznzqsfo>Crush</span> </nav> <section class="game-shell" data-astro-cid-iznzqsfo> <div class="mast" data-astro-cid-iznzqsfo> <div class="mast__copy" data-astro-cid-iznzqsfo> <p class="kicker" data-astro-cid-iznzqsfo>NOUNS COLA / ARCADE PILOT</p> <h1 data-astro-cid-iznzqsfo>Nouns Cola Crush</h1> <p data-astro-cid-iznzqsfo>Batch 01 is live: clear cans, caps, and fizz before the moves run out.</p> </div> <div class="hud" aria-label="Game status" data-astro-cid-iznzqsfo> <div data-astro-cid-iznzqsfo><span class="mono" data-astro-cid-iznzqsfo>SCORE</span><strong data-score data-astro-cid-iznzqsfo>0</strong></div> <div data-astro-cid-iznzqsfo><span class="mono" data-astro-cid-iznzqsfo>MOVES</span><strong data-moves data-astro-cid-iznzqsfo>28</strong></div> <div data-astro-cid-iznzqsfo><span class="mono" data-astro-cid-iznzqsfo>TARGET</span><strong data-target data-astro-cid-iznzqsfo>2,600</strong></div> <div data-astro-cid-iznzqsfo><span class="mono" data-astro-cid-iznzqsfo>HIGH</span><strong data-high data-astro-cid-iznzqsfo>0</strong></div> </div> </div> <div class="game-layout" data-astro-cid-iznzqsfo> <section class="board-panel" aria-label="Puzzle board" data-astro-cid-iznzqsfo> <div class="board-top" data-astro-cid-iznzqsfo> <span class="mono" data-status data-astro-cid-iznzqsfo>Batch 01 ready.</span> <strong data-combo data-astro-cid-iznzqsfo>COMBO x1</strong> </div> <div class="board" data-board role="grid" aria-label="Nouns Cola Crush board" data-astro-cid-iznzqsfo></div> </section> <aside class="side-panel" aria-label="Run goals" data-astro-cid-iznzqsfo> <figure class="super-art" data-astro-cid-iznzqsfo> <img src="/images/nouns-cola-crush/super-graphics.png" alt="Nouns Cola arcade art with cans, bubbles, candy gems, and Nouns glasses" width="1672" height="941" data-astro-cid-iznzqsfo> </figure> <div class="goal-stack" aria-label="Collection goals" data-astro-cid-iznzqsfo> ', ' </div> <div class="button-row" aria-label="Game controls" data-astro-cid-iznzqsfo> <button type="button" class="btn btn--primary" data-action="new" data-astro-cid-iznzqsfo>New board</button> <button type="button" class="btn" data-action="shuffle" data-astro-cid-iznzqsfo>Shuffle</button> </div> <div class="piece-strip" aria-label="Piece legend" data-astro-cid-iznzqsfo> ', ` </div> </aside> </div> </section> </div> <script>
    (function () {
      const root = document.querySelector('[data-crush-game]');
      if (!root) return;

      const SIZE = 8;
      const MOVES = 28;
      const TARGET = 2600;
      const TYPES = [
        { type: 'can', label: 'Cola can', short: 'CAN' },
        { type: 'cap', label: 'Bottle cap', short: 'CAP' },
        { type: 'fizz', label: 'Fizz drop', short: 'FIZ' },
        { type: 'cherry', label: 'Cherry pop', short: 'POP' },
        { type: 'lemon', label: 'Lemon bolt', short: 'ZIP' },
        { type: 'noggles', label: 'Nouns glasses', short: 'NOG' },
      ];
      const GOALS = [
        { type: 'can', target: 20 },
        { type: 'cap', target: 18 },
        { type: 'fizz', target: 16 },
      ];

      const byType = Object.fromEntries(TYPES.map((piece) => [piece.type, piece]));
      const boardEl = root.querySelector('[data-board]');
      const scoreEl = root.querySelector('[data-score]');
      const movesEl = root.querySelector('[data-moves]');
      const targetEl = root.querySelector('[data-target]');
      const highEl = root.querySelector('[data-high]');
      const statusEl = root.querySelector('[data-status]');
      const comboEl = root.querySelector('[data-combo]');
      const number = new Intl.NumberFormat('en-US');
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const state = {
        board: [],
        selected: null,
        clearing: new Set(),
        score: 0,
        moves: MOVES,
        combo: 1,
        high: Number(localStorage.getItem('pc:nouns-cola-crush:high') || 0),
        goals: Object.fromEntries(GOALS.map((goal) => [goal.type, 0])),
        busy: false,
        done: false,
      };

      function randomType() {
        return TYPES[Math.floor(Math.random() * TYPES.length)].type;
      }

      function sameLineWouldMatch(board, index, type) {
        const row = Math.floor(index / SIZE);
        const col = index % SIZE;
        const leftMatch = col >= 2 && board[index - 1] === type && board[index - 2] === type;
        const upMatch = row >= 2 && board[index - SIZE] === type && board[index - SIZE * 2] === type;
        return leftMatch || upMatch;
      }

      function createBoard() {
        const board = [];
        for (let index = 0; index < SIZE * SIZE; index++) {
          let type = randomType();
          let guard = 0;
          while (sameLineWouldMatch(board, index, type) && guard < 30) {
            type = randomType();
            guard++;
          }
          board[index] = type;
        }
        return hasLegalMove(board) ? board : createBoard();
      }

      function rowOf(index) {
        return Math.floor(index / SIZE);
      }

      function colOf(index) {
        return index % SIZE;
      }

      function isAdjacent(a, b) {
        const sameRow = rowOf(a) === rowOf(b) && Math.abs(colOf(a) - colOf(b)) === 1;
        const sameCol = colOf(a) === colOf(b) && Math.abs(rowOf(a) - rowOf(b)) === 1;
        return sameRow || sameCol;
      }

      function swapped(board, a, b) {
        const next = board.slice();
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      }

      function findMatches(board) {
        const matched = new Set();

        for (let row = 0; row < SIZE; row++) {
          let runStart = 0;
          for (let col = 1; col <= SIZE; col++) {
            const current = col < SIZE ? board[row * SIZE + col] : null;
            const previous = board[row * SIZE + col - 1];
            if (current !== previous) {
              const runLength = col - runStart;
              if (previous && runLength >= 3) {
                for (let c = runStart; c < col; c++) matched.add(row * SIZE + c);
              }
              runStart = col;
            }
          }
        }

        for (let col = 0; col < SIZE; col++) {
          let runStart = 0;
          for (let row = 1; row <= SIZE; row++) {
            const current = row < SIZE ? board[row * SIZE + col] : null;
            const previous = board[(row - 1) * SIZE + col];
            if (current !== previous) {
              const runLength = row - runStart;
              if (previous && runLength >= 3) {
                for (let r = runStart; r < row; r++) matched.add(r * SIZE + col);
              }
              runStart = row;
            }
          }
        }

        return matched;
      }

      function hasLegalMove(board) {
        for (let index = 0; index < board.length; index++) {
          const right = colOf(index) < SIZE - 1 ? index + 1 : null;
          const down = rowOf(index) < SIZE - 1 ? index + SIZE : null;
          if (right !== null && findMatches(swapped(board, index, right)).size > 0) return true;
          if (down !== null && findMatches(swapped(board, index, down)).size > 0) return true;
        }
        return false;
      }

      function dropBoard() {
        for (let col = 0; col < SIZE; col++) {
          const kept = [];
          for (let row = SIZE - 1; row >= 0; row--) {
            const value = state.board[row * SIZE + col];
            if (value) kept.push(value);
          }
          for (let row = SIZE - 1; row >= 0; row--) {
            const value = kept.shift() || randomType();
            state.board[row * SIZE + col] = value;
          }
        }
      }

      function goalsMet() {
        return GOALS.every((goal) => state.goals[goal.type] >= goal.target);
      }

      function setStatus(message) {
        if (statusEl) statusEl.textContent = message;
      }

      function updateHud() {
        scoreEl.textContent = number.format(state.score);
        movesEl.textContent = String(state.moves);
        targetEl.textContent = number.format(TARGET);
        highEl.textContent = number.format(state.high);
        comboEl.textContent = 'COMBO x' + state.combo;

        root.querySelectorAll('[data-goal]').forEach((goalEl) => {
          const type = goalEl.getAttribute('data-goal');
          const target = Number(goalEl.getAttribute('data-goal-target'));
          const collected = state.goals[type] || 0;
          const remaining = Math.max(0, target - collected);
          const fill = Math.min(100, (collected / target) * 100);
          goalEl.style.setProperty('--fill', fill + '%');
          const value = goalEl.querySelector('[data-goal-value]');
          if (value) value.textContent = remaining > 0 ? remaining + ' left' : 'done';
        });
      }

      function render() {
        boardEl.textContent = '';
        state.board.forEach((type, index) => {
          const piece = byType[type];
          const button = document.createElement('button');
          const mark = document.createElement('span');
          const gleam = document.createElement('span');
          button.type = 'button';
          button.className = 'tile';
          button.dataset.index = String(index);
          button.dataset.piece = type;
          button.setAttribute('role', 'gridcell');
          button.setAttribute('aria-label', piece.label + ', row ' + (rowOf(index) + 1) + ', column ' + (colOf(index) + 1));
          button.disabled = state.busy || state.done;
          if (state.selected === index) button.classList.add('is-selected');
          if (state.clearing.has(index)) button.classList.add('is-clearing');
          gleam.className = 'tile__gleam';
          mark.className = 'tile__mark';
          mark.textContent = piece.short;
          button.append(gleam, mark);
          boardEl.append(button);
        });
        updateHud();
      }

      function shuffleBoard() {
        const copy = state.board.slice();
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        state.board = hasLegalMove(copy) && findMatches(copy).size === 0 ? copy : createBoard();
        state.selected = null;
        state.combo = 1;
        setStatus('Fresh fizz in the grid.');
        render();
      }

      async function resolveMatches(firstMatches) {
        state.busy = true;
        let matches = firstMatches;
        let chain = 0;

        while (matches.size > 0) {
          chain++;
          state.combo = chain;
          state.clearing = matches;
          const clearedByType = {};
          matches.forEach((index) => {
            const type = state.board[index];
            clearedByType[type] = (clearedByType[type] || 0) + 1;
          });
          render();
          await sleep(170);

          matches.forEach((index) => {
            const type = state.board[index];
            if (type in state.goals) state.goals[type] += 1;
            state.board[index] = null;
          });

          const cleared = matches.size;
          const goalBonus = Object.values(clearedByType).reduce((sum, count) => sum + Math.max(0, count - 3) * 45, 0);
          state.score += cleared * 80 * chain + goalBonus;
          dropBoard();
          state.clearing = new Set();
          render();
          await sleep(120);
          matches = findMatches(state.board);
        }

        state.combo = Math.max(1, chain);
        state.busy = false;

        if (state.score > state.high) {
          state.high = state.score;
          localStorage.setItem('pc:nouns-cola-crush:high', String(state.high));
        }

        if (state.score >= TARGET && goalsMet()) {
          state.done = true;
          setStatus('Pilot batch cleared.');
        } else if (state.moves <= 0) {
          state.done = true;
          setStatus('Run complete. Start a new board.');
        } else if (!hasLegalMove(state.board)) {
          shuffleBoard();
          return;
        } else {
          setStatus(chain > 1 ? 'Cascade chain x' + chain + '.' : 'Good pop.');
        }

        render();
      }

      async function attemptSwap(a, b) {
        if (state.busy || state.done) return;
        state.board = swapped(state.board, a, b);
        const matches = findMatches(state.board);

        if (matches.size === 0) {
          state.board = swapped(state.board, a, b);
          state.selected = null;
          state.combo = 1;
          setStatus('No match.');
          render();
          return;
        }

        state.moves -= 1;
        state.selected = null;
        setStatus('Fizz break.');
        render();
        await resolveMatches(matches);
      }

      function newGame() {
        state.board = createBoard();
        state.selected = null;
        state.clearing = new Set();
        state.score = 0;
        state.moves = MOVES;
        state.combo = 1;
        state.goals = Object.fromEntries(GOALS.map((goal) => [goal.type, 0]));
        state.busy = false;
        state.done = false;
        setStatus('Batch 01 ready.');
        render();
      }

      boardEl.addEventListener('click', (event) => {
        const tile = event.target.closest('[data-index]');
        if (!tile || state.busy || state.done) return;
        const index = Number(tile.getAttribute('data-index'));

        if (state.selected === null) {
          state.selected = index;
          setStatus('Tile locked.');
          render();
          return;
        }

        if (state.selected === index) {
          state.selected = null;
          setStatus('Batch 01 ready.');
          render();
          return;
        }

        if (!isAdjacent(state.selected, index)) {
          state.selected = index;
          setStatus('Tile locked.');
          render();
          return;
        }

        attemptSwap(state.selected, index);
      });

      root.querySelector('[data-action="new"]').addEventListener('click', newGame);
      root.querySelector('[data-action="shuffle"]').addEventListener('click', () => {
        if (!state.busy && !state.done) shuffleBoard();
      });

      newGame();
    })();
  <\/script> `])), maybeRenderHead(), GOALS.map((goal) => renderTemplate`<div${addAttribute(`goal goal--${goal.type}`, "class")}${addAttribute(goal.type, "data-goal")}${addAttribute(goal.target, "data-goal-target")} data-astro-cid-iznzqsfo> <div class="goal__head" data-astro-cid-iznzqsfo> <span data-astro-cid-iznzqsfo><i data-astro-cid-iznzqsfo>${goal.short}</i>${goal.label}</span> <strong data-goal-value data-astro-cid-iznzqsfo>${goal.target} left</strong> </div> <div class="goal__bar" aria-hidden="true" data-astro-cid-iznzqsfo><span data-astro-cid-iznzqsfo></span></div> </div>`), PIECES.map((piece) => renderTemplate`<span${addAttribute(`piece-chip piece-chip--${piece.type}`, "class")} data-astro-cid-iznzqsfo>${piece.short}</span>`)) })} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cola-crush.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-cola-crush.astro";
const $$url = "/nouns-cola-crush";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsColaCrush,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
