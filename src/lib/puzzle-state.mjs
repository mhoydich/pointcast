export const ROWS=3;
export const COLS=4;
export const PIECES=ROWS*COLS;
export function shuffledPieces(random=Math.random){
  const pieces=Array.from({length:PIECES},(_,i)=>i);
  for(let i=pieces.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}
  if(pieces.every((id,i)=>id===i)) [pieces[0],pieces[1]]=[pieces[1],pieces[0]];
  return pieces;
}
export function placement(state,piece,slot){
  if(!Number.isInteger(piece)||piece<0||piece>=PIECES||!Number.isInteger(slot)||slot<0||slot>=PIECES) return {ok:false,reason:'invalid',state};
  if(state.includes(slot)) return {ok:false,reason:'filled',state};
  if(piece!==slot) return {ok:false,reason:'mismatch',state};
  return {ok:true,reason:'placed',state:[...state,slot]};
}
export function piecePosition(id){return {row:Math.floor(id/COLS)+1,column:id%COLS+1,x:(id%COLS)*100/(COLS-1),y:Math.floor(id/COLS)*100/(ROWS-1)};}
