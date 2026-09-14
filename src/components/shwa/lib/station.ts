export type Caption = { id: string; speaker: 'you'|'electro'; text: string; start: number; end: number };
import type { CanvasCard } from './canvas';
export type Notes = { summary: string; topics: string[]; questions: string[]; imageIdea: string; card?:CanvasCard|null };
export type Line = { available: boolean; message?: string; reason?: string; retryAt?: number; remainingCalls?: number; networkCallsRemaining?: number };
export function appendCaption(rows: Caption[], speaker: Caption['speaker'], delta: string, start: number, end: number): Caption[] {
  const next = rows.map(row=>({...row}));
  // Each speaker has an independent stream; input and output can overlap.
  const previous = next.findLast(row=>row.speaker===speaker);
  if (previous && start>=previous.start && start-previous.end<1800 && previous.text.length<1600) {
    previous.text+=delta; previous.end=Math.max(previous.end,end);
  } else next.push({id:`${speaker}-${start}-${next.length}`,speaker,text:delta,start,end});
  return next.slice(-80);
}
export function transcriptText(rows: Caption[]) { return rows.map(row=>`${row.speaker==='you'?'You':'Shwa'}: ${row.text}`).join('\n').slice(-12000); }
export function spotifyEmbed(raw: string): string|null {
  try {
    const url=new URL(raw.trim());
    if(url.protocol!=='https:'||url.hostname!=='open.spotify.com'||url.username||url.password||url.port)return null;
    const path=url.pathname.replace(/^\/intl-[a-z-]+\//,'/').replace(/^\/embed\//,'/');
    const match=path.match(/^\/(track|album|playlist|episode)\/([A-Za-z0-9]{22})\/?$/);
    return match?`https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0`:null;
  }catch{return null;}
}
export const dollars = (value:number) => '$'+value.toFixed(value<0.01?4:3);
