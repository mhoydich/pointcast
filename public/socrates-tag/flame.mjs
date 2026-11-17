/** Presentation only: supplied sources are fuel markers, never verified points. */
export function flameView(state, checkedAt, now=Date.now()) {
  const stale=!checkedAt || now-checkedAt>120000;
  const count=state?.moves?.length ?? 0;
  const remaining=state?.deadline ? Math.max(0,Math.min(1,(state.deadline-now)/7200000)) : 0;
  const expired=state?.deadline != null && now>=state.deadline;
  const tag=state?.latest?.tag ?? null;
  const mode=stale?'stale':!count?'waiting':expired?'elapsed':state.attention?'review':'burning';
  return {count,tag,mode,remaining,
    brightness:mode==='burning'?0.5+remaining*(0.25+Math.min(count,20)/80):mode==='elapsed'?0.24:0.48,
    label:mode==='stale'?'Fire paused: room data is unavailable or old.':mode==='elapsed'?'The reported clock ran down. The ember waits for Daniel’s ruling.':mode==='review'?'The ember is held for host review.':mode==='waiting'?'Waiting for the opening tag.':`Reported ember: ${tag}. Each source-labelled move adds to the shared fire.`,
  };
}
