/** @jsxRuntime classic */
import * as React from 'react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, Download, Image as ImageIcon, Search, SlidersHorizontal, Check, ChartNoAxesColumn, Vote, ClipboardList, Pin, PinOff, EyeOff, Undo2 } from 'lucide-react';
import { sampleCards, type CanvasItem, type ResearchResult, type ResearchPart } from './lib/canvas';
import './canvas-board.css';

type Props = {
  items: CanvasItem[]; state: string; enabled: boolean; setEnabled: (value: boolean) => void;
  canGenerate: boolean; imageBusy: boolean; background?: 'studio' | 'grid' | 'reading' | 'radio';
  onAnswer: (card: CanvasItem, answer: string) => void;
  onImage: (card: CanvasItem) => Promise<void>;
  onResearch: (card: CanvasItem) => Promise<ResearchResult>;
};
const icons = { poll: Vote, slider: SlidersHorizontal, survey: ClipboardList, chart: ChartNoAxesColumn, confirmation: Check, image: ImageIcon, research: Search };

export function CanvasPanel(p: Props) {
  const [samples, setSamples] = useState(false);
  const [follow, setFollow] = useState(true);
  const [pinned, setPinned] = useState<Set<string>>(() => new Set());
  const [hidden, setHidden] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const examples = useMemo(sampleCards, []);
  const feed = useRef<HTMLDivElement>(null);
  const last = useRef('');
  const items = useMemo(() => [...p.items, ...(samples ? examples : [])], [p.items, samples, examples]);
  const ordered = useMemo(() => [...items].sort((a, b) => Number(pinned.has(b.id)) - Number(pinned.has(a.id))), [items, pinned]);
  const hiddenSet = new Set(hidden);
  const visible = items.filter(card => !hiddenSet.has(card.id));
  const undoId = [...hidden].reverse().find(id => items.some(card => card.id === id));
  const scrollTo = (id?: string) => {
    const node = Array.from(feed.current?.children || []).find(element => (element as HTMLElement).dataset.canvasCard === id) as HTMLElement | undefined;
    if (node && !node.hidden) node.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  };
  useEffect(() => {
    const newest = p.items.at(-1)?.id || '';
    if (follow && newest && newest !== last.current) scrollTo(newest);
    last.current = newest;
  }, [p.items, follow]);
  function togglePin(card: CanvasItem) {
    setPinned(current => {
      const next = new Set(current);
      if (next.has(card.id)) next.delete(card.id); else next.add(card.id);
      return next;
    });
  }
  function hide(card: CanvasItem) {
    setHidden(current => [...current.filter(id => id !== card.id), card.id]);
    setNotice(`Hidden “${card.title}”. Undo brings it back with your work intact.`);
  }
  function undoHide() {
    if (!undoId) return;
    setHidden(current => current.filter(id => id !== undoId));
    setNotice('Piece restored. Your entries and results are still here.');
  }
  return <section className="canvas-panel canvas-board" data-background={p.background || 'studio'} aria-labelledby="canvas-title">
    <header className="canvas-board-toolbar">
      <div className="canvas-board-title"><h2 id="canvas-title">The board</h2><span className="canvas-count">{visible.length} {visible.length === 1 ? 'piece' : 'pieces'}{samples ? ' · free examples included' : ''}</span></div>
      <div className="canvas-board-controls" aria-label="Board controls">
        <button type="button" className="small-button" aria-pressed={p.enabled} onClick={() => p.setEnabled(!p.enabled)}>{p.enabled ? 'Auto · on' : 'Auto · paused'}</button>
        <button type="button" className="small-button" aria-pressed={follow} onClick={() => { setFollow(!follow); if (!follow) scrollTo(p.items.at(-1)?.id || visible.at(-1)?.id); }}><ArrowDown size={14}/>{follow ? 'Following' : 'Follow new pieces'}</button>
        <button type="button" className="small-button" aria-pressed={samples} onClick={() => setSamples(!samples)}>{samples ? 'Hide examples' : 'Explore the board'}</button>
        {undoId && <button type="button" className="small-button" onClick={undoHide}><Undo2 size={14}/>Undo hide</button>}
      </div>
    </header>
    <p className="section-note canvas-board-status" role="status">{p.state}{!p.enabled ? ' · Automatic pieces paused' : ''}</p>
    <div className="canvas-feed canvas-board-grid" ref={feed} aria-label="Conversation board">
      {!items.length && <div className="canvas-welcome"><span className="ready-prompt">A LITTLE SPACE TO THINK</span><h3>What shall we make?</h3><p>Talk with Shwa and ideas land here. Or explore the board for free.</p></div>}
      {items.length > 0 && !visible.length && <div className="canvas-welcome"><h3>A clear board.</h3><p>Your hidden pieces are still here. Use Undo hide to bring them back.</p></div>}
      {ordered.map(card => <Piece key={card.id} card={card} pinned={pinned.has(card.id)} hidden={hiddenSet.has(card.id)} onPin={() => togglePin(card)} onHide={() => hide(card)} canGenerate={p.canGenerate && !card.sample} imageBusy={p.imageBusy} onAnswer={answer => {
        if (card.sample) { setNotice('Sample answer saved here. Examples are free and stay in this page.'); return; }
        p.onAnswer(card, answer); setNotice('Your answer will shape the next canvas update.');
      }} onImage={() => p.onImage(card)} onResearch={() => p.onResearch(card)}/>)}
    </div>
    <p className="section-note canvas-board-notice" role="status">{notice || 'Pin and hide arrange this page only. New calls start fresh conversation pieces.'}</p>
  </section>;
}

type PieceProps = {
  card: CanvasItem; pinned: boolean; hidden: boolean; onPin: () => void; onHide: () => void;
  canGenerate: boolean; imageBusy: boolean; onAnswer: (answer: string) => void;
  onImage: () => Promise<void>; onResearch: () => Promise<ResearchResult>;
};
function Piece({ card: c, pinned, hidden, onPin, onHide, canGenerate, imageBusy, onAnswer, onImage, onResearch }: PieceProps) {
  const [choice, setChoice] = useState('');
  const [value, setValue] = useState(c.value);
  const [answers, setAnswers] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [researchedAt, setResearchedAt] = useState('');
  const pending = useRef(false);
  const formId = React.useId();
  const rangeId = React.useId();
  const Icon = icons[c.kind];
  const respond = (answer: string) => { setChoice(answer); onAnswer(answer); };
  async function generate() {
    if (!canGenerate || imageBusy || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await onImage(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Image unavailable'); }
    finally { pending.current = false; setBusy(false); }
  }
  async function investigate() {
    if (!canGenerate || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { setResearch(await onResearch()); setResearchedAt(new Date().toLocaleDateString()); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Research unavailable'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <article className={`canvas-piece piece-${c.kind}${pinned ? ' is-pinned' : ''}`} aria-label={c.title} data-canvas-card={c.id} hidden={hidden}>
    <div className="piece-paper">
      <div className="piece-label"><span><Icon size={15}/>{c.kind === 'confirmation' ? 'direction check' : c.kind}</span><span>{c.sample ? 'FREE EXAMPLE' : c.basis === 'illustrative' ? 'ILLUSTRATIVE' : 'FROM THE CONVERSATION'}</span></div>
      <h3>{c.title}</h3><p className="piece-description">{c.text}</p>
      {c.kind === 'poll' && <p className="piece-note">{choice ? `Your choice: ${choice}` : 'Choose a direction below. One response in this browser; no group totals.'}</p>}
      {c.kind === 'slider' && <div className="canvas-slider"><output htmlFor={rangeId}>{value}{c.unit ? ` ${c.unit}` : ''}</output><input id={rangeId} aria-label={c.title} type="range" min={c.min} max={c.max} step={c.step} value={value} onChange={event => { setValue(Number(event.target.value)); setSent(false); }}/><div className="range-labels"><span>{c.lowLabel || c.min}</span><span>{c.highLabel || c.max}</span></div></div>}
      {c.kind === 'chart' && <div className="canvas-chart" role="img" aria-label={`${c.title}. ${c.points.map(point => `${point.label}: ${point.value} ${c.unit}`).join(', ')}`}>
        {c.points.map((point, index) => { const maximum = Math.max(...c.points.map(item => Math.abs(item.value)), 1); return <div key={index}><div><span>{point.label}</span><strong>{point.value.toLocaleString()} {c.unit}</strong></div><div className="chart-track"><span style={{ width: `${Math.abs(point.value) / maximum * 100}%` }}/></div></div>; })}
        <p className="section-note">{c.basis === 'illustrative' ? 'Illustrative values to explore; not measured results.' : 'Values discussed in the conversation; not independently verified.'}</p>
      </div>}
      {c.kind === 'survey' && <form id={formId} className="canvas-survey" onSubmit={event => {
        event.preventDefault(); if (answers.filter(answer => answer?.trim()).length < c.questions.length) return;
        onAnswer(c.questions.map((question, index) => `${question} ${answers[index]}`).join('\n')); setSent(true);
      }}>{c.questions.map((question, index) => <label key={index}>{question}<textarea required maxLength={300} value={answers[index] || ''} onChange={event => { setAnswers(current => { const next = [...current]; next[index] = event.target.value; return next; }); setSent(false); }}/></label>)}</form>}
      {c.kind === 'confirmation' && <p className="piece-note">{choice || 'Choose below to record a preference. No external action.'}</p>}
      {c.kind === 'image' && <div className="canvas-image">{c.imageUrl ? <img src={c.imageUrl} alt={c.prompt}/> : <><span className="piece-note">IMAGE PROPOSAL</span><p className="art-prompt">{c.prompt}</p><small>{c.sample ? 'A free example prompt. Live conversation pieces can create images.' : 'Greenlight below to generate this image within the call’s limits.'}</small></>}</div>}
      {c.kind === 'research' && <div className="canvas-research">{research ? <div>{research.parts.map((part, index) => <p key={index} className="research-text"><CitedText part={part}/></p>)}<small>Web research via OpenAI · {researchedAt}</small></div> : <><p className="research-query">{c.prompt}</p><small>{c.sample ? 'A free example question. Live conversation pieces can search.' : 'Research runs only when you ask below.'}</small></>}</div>}
    </div>
    <div className="piece-actions">
      <div className="piece-response-actions">
        {c.kind === 'poll' && <div className="poll-options" role="group" aria-label={c.title}>{c.options.map(option => <button type="button" key={option} aria-pressed={choice === option} onClick={() => respond(option)}><span aria-hidden="true">{choice === option ? '■' : '□'}</span>{option}</button>)}</div>}
        {c.kind === 'slider' && <button type="button" className="small-button" disabled={sent} onClick={() => { onAnswer(`${value} ${c.unit} on a range ${c.min}–${c.max} (${c.lowLabel} to ${c.highLabel})`); setSent(true); }}>{sent ? 'Choice recorded' : 'Use this setting'}</button>}
        {c.kind === 'survey' && <button type="submit" form={formId} className="small-button" disabled={sent}>{sent ? 'Answers recorded' : 'Use these answers'}</button>}
        {c.kind === 'confirmation' && <div className="confirmation-options">{['Yes, this direction', 'Keep exploring'].map(option => <button type="button" key={option} className="small-button" aria-pressed={choice === option} onClick={() => respond(option)}>{choice === option && <Check size={15}/>} {option}</button>)}</div>}
        {c.kind === 'image' && (c.imageUrl ? <a className="small-button" href={c.imageUrl} download="shwa-canvas.webp"><Download size={15}/>Save image</a> : <button type="button" className="small-button greenlight-button" disabled={!canGenerate || imageBusy || busy} onClick={() => { void generate(); }}><ImageIcon size={16}/>{busy ? 'Making your image…' : 'Greenlight image · ~0.5¢'}</button>)}
        {c.kind === 'research' && !research && <button type="button" className="small-button" disabled={!canGenerate || busy} onClick={() => { void investigate(); }}><Search size={16}/>{busy ? 'Looking it up…' : 'Research this · up to 2¢ + tokens'}</button>}
      </div>
      <div className="piece-local-actions" aria-label="Arrange this piece">
        <button type="button" className="small-button" aria-pressed={pinned} aria-label={`${pinned ? 'Unpin' : 'Pin'} ${c.title}`} onClick={onPin}>{pinned ? <PinOff size={14}/> : <Pin size={14}/>} {pinned ? 'Unpin' : 'Pin'}</button>
        <button type="button" className="small-button" aria-label={`Hide ${c.title}`} onClick={onHide}><EyeOff size={14}/>Hide</button>
      </div>
      {!c.sample && !canGenerate && !c.imageUrl && !research && (c.kind === 'image' || c.kind === 'research') && <small className="piece-action-note">Available with an active call.</small>}
      {error && <p className="section-note attention" role="alert">{error}</p>}
    </div>
  </article>;
}
export function CitedText({ part }: { part: ResearchPart }) {
  let at = 0; const nodes: ReactNode[] = [];
  for (const citation of part.citations) {
    if (citation.start < at) continue;
    nodes.push(part.text.slice(at, citation.start));
    nodes.push(<a key={citation.start} href={citation.url} target="_blank" rel="noopener noreferrer" title={citation.title}>[{citation.title || new URL(citation.url).hostname}]</a>);
    at = citation.end;
  }
  nodes.push(part.text.slice(at)); return <>{nodes}</>;
}
