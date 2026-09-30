// Pure, deterministic match-three rules shared by the browser and room Worker.
export const SIZE = 6;
export const COLORS = 6;
export const PROMPTS = ['a tiny impossible garden','the secret under the floor','a letter from tomorrow','the last song of summer','a map made of memories','a door in the rain','what the stars forgot','a city of soft lights','something worth keeping','a beautiful mistake','the sound of home','a wish with roots'];
const next = n => (Math.imul(n, 1664525) + 1013904223) >>> 0;
export function seededBoard(seed = 123456789) {
  let n = seed >>> 0; let board = []; let attempts = 0;
  do { board = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    let value;
    do { n = next(n); value = n % COLORS; }
    while ((i % SIZE > 1 && board[i-1] === value && board[i-2] === value) || (i >= SIZE*2 && board[i-SIZE] === value && board[i-SIZE*2] === value));
    board.push(value);
  }
  attempts++; if (attempts > 100) break;
  } while (!hasMove(board));
  return { board, seed:n, score:0, combo:0, moves:0, promptIndex:0 };
}
export function matchIndexes(board) {
  const hits = new Set();
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE;) {
    const start=col, color=board[row*SIZE+col]; while(col<SIZE && board[row*SIZE+col]===color) col++;
    if(color>=0 && col-start>=3) for(let x=start;x<col;x++)hits.add(row*SIZE+x);
  }
  for (let col=0;col<SIZE;col++) for(let row=0;row<SIZE;) {
    const start=row,color=board[row*SIZE+col];while(row<SIZE && board[row*SIZE+col]===color)row++;
    if(color>=0 && row-start>=3)for(let y=start;y<row;y++)hits.add(y*SIZE+col);
  }
  return [...hits];
}
export function applyMove(state, a, b) {
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=36||b>=36||a===b || !(Math.abs(a-b)===SIZE || (Math.floor(a/SIZE)===Math.floor(b/SIZE)&&Math.abs(a-b)===1))) return null;
  let board=[...state.board], seed=state.seed>>>0; [board[a],board[b]]=[board[b],board[a]];
  let hits=matchIndexes(board); if(!hits.length)return null;
  let cleared=0, chains=0;
  while(hits.length && chains<12){
    chains++;cleared+=hits.length;for(const i of hits)board[i]=-1;
    for(let col=0;col<SIZE;col++){
      const kept=[];for(let row=SIZE-1;row>=0;row--){const v=board[row*SIZE+col];if(v>=0)kept.push(v)}
      while(kept.length<SIZE){seed=next(seed);kept.push(seed%COLORS)}
      for(let row=SIZE-1;row>=0;row--)board[row*SIZE+col]=kept[SIZE-1-row];
    }
    hits=matchIndexes(board);
  }
  const moves=state.moves+1;
  if (!hasMove(board)) { const fresh=seededBoard(seed); board=fresh.board; seed=fresh.seed; }
  return {board,seed,score:state.score+cleared*10*chains,combo:chains,moves,promptIndex:(state.promptIndex+1)%PROMPTS.length,cleared};
}
export function hasMove(board){for(let i=0;i<36;i++)for(const j of [i+1,i+SIZE])if(j<36 && (j===i+SIZE||Math.floor(i/SIZE)===Math.floor(j/SIZE))){const b=[...board];[b[i],b[j]]=[b[j],b[i]];if(matchIndexes(b).length)return true}return false}
