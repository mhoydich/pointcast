/** @jsxRuntime classic */
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Copy, Plus, ArrowUpRight, Check, X, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { ROOM_ENDPOINT, ROOM_TOKEN, roomFromHash, roomInvite, resourceNames, type ResourceRoute, type SharedRoom, type SharedPiece } from './lib/shared-room';
import './shared-room.css';
const secretFor = (room: string) => {
  const key = 'pc:shwa:seat:' + room;
  try { const saved = sessionStorage.getItem(key); if (saved && ROOM_TOKEN.test(saved)) return saved; } catch { /* The current connection can still work without storage. */ }
  const value = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  try { sessionStorage.setItem(key, value); } catch { /* Rejoining after reload will require an available seat. */ }
  return value;
};
export function useSharedRoom() {
  const [invite, setInvite] = useState(() => typeof window === 'undefined' ? '' : roomFromHash(window.location.hash));
  const [target, setTarget] = useState<{ token: string; name: string; resource: ResourceRoute; secret: string } | null>(null);
  const [room, setRoom] = useState<SharedRoom | null>(null), [id, setId] = useState('');
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle'), [error, setError] = useState('');
  const socket = useRef<WebSocket | null>(null), creating = useRef(false), createAbort = useRef<AbortController | null>(null);
  useEffect(() => { const changed = () => { if (!target) setInvite(roomFromHash(location.hash)); }; window.addEventListener('hashchange', changed); return () => window.removeEventListener('hashchange', changed); }, [target]);
  useEffect(() => () => { createAbort.current?.abort(); }, []);
  useEffect(() => {
    if (!target) return;
    let disposed = false, paused = false, attempts = 0, terminal = false, retry: ReturnType<typeof setTimeout> | undefined, heartbeat: ReturnType<typeof setInterval> | undefined;
    function connect() {
      if (disposed || paused || terminal) return;
      setPhase('connecting');
      const ws = new WebSocket(ROOM_ENDPOINT.replace('https:', 'wss:') + '/rooms/' + target!.token); socket.current = ws;
      let heard = Date.now();
      ws.onopen = () => { if (disposed || paused) { ws.close(); return; } ws.send(JSON.stringify({ type: 'join', name: target!.name, resource: target!.resource, secret: target!.secret }));
        heartbeat = setInterval(() => { if (Date.now() - heard > 60_000) ws.close(); else if (ws.readyState === WebSocket.OPEN) ws.send('ping'); }, 20_000);
      };
      ws.onmessage = event => {
        if (disposed || socket.current !== ws) return; heard = Date.now(); if (event.data === 'pong') return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'joined') { setId(message.id); setPhase('connected'); setError(''); attempts = 0; }
          if (message.type === 'state') setRoom(message.room);
          if (message.type === 'error') setError(message.message);
        } catch { setError('A room update could not be read. Rejoin to refresh.'); }
      };
      ws.onclose = event => {
        clearInterval(heartbeat); if (disposed || paused || socket.current !== ws) return;
        setPhase('disconnected');
        if ([4002, 4004, 4005, 4006].includes(event.code)) { terminal = true; setError(event.reason || 'The room could not be joined.'); return; }
        if (++attempts <= 6) retry = setTimeout(connect, Math.min(15_000, 1000 * 2 ** (attempts - 1)));
        else setError('Connection lost. Rejoin when your connection is ready.');
      };
      ws.onerror = () => { if (!disposed) setError('The room connection is unavailable. Check the link or try again.'); };
    }
    const hide = () => { paused = true; clearTimeout(retry); clearInterval(heartbeat); socket.current?.close(); };
    const show = (event: PageTransitionEvent) => { if (event.persisted) { paused = false; connect(); } };
    window.addEventListener('pagehide', hide); window.addEventListener('pageshow', show); connect();
    return () => { disposed = true; clearTimeout(retry); clearInterval(heartbeat); socket.current?.close(); socket.current = null; window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); };
  }, [target]);
  const join = useCallback(async (name: string, resource: ResourceRoute, fresh = false) => {
    if (!name.trim() || creating.current) return;
    creating.current = true; setError(''); setPhase('connecting');
    const abort = new AbortController(); createAbort.current = abort;
    try {
      let token = fresh ? '' : invite;
      if (!token) {
        const response = await fetch(ROOM_ENDPOINT + '/rooms', { method: 'POST', credentials: 'omit', signal: AbortSignal.any([abort.signal, AbortSignal.timeout(12_000)]) });
        const value = await response.json(); if (!response.ok || !ROOM_TOKEN.test(value.room)) throw Error(value.error || 'Could not create the room.'); token = value.room;
      }
      if (abort.signal.aborted) return;
      setRoom(null); setId(''); setInvite(token); history.replaceState(history.state, '', '/shwa/#room=' + token);
      setTarget({ token, name: name.trim(), resource, secret: secretFor(token) });
    } catch (cause) { if (!abort.signal.aborted) { setPhase('idle'); setError(cause instanceof Error ? cause.message : 'Could not open the room.'); } }
    finally { creating.current = false; }
  }, [invite]);
  const send = useCallback((event: Record<string, unknown>) => { const ws = socket.current; if (!ws || ws.readyState !== WebSocket.OPEN || phase !== 'connected') return false; ws.send(JSON.stringify(event)); return true; }, [phase]);
  const leave = useCallback(() => { createAbort.current?.abort(); if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: 'leave' })); setTarget(null); setRoom(null); setId(''); setInvite(''); setPhase('idle'); setError(''); history.replaceState(history.state, '', '/shwa/'); }, []);
  return { invite, room, id, phase, error, join, send, leave };
}
export type RoomController = ReturnType<typeof useSharedRoom>;
export function SharedRoomBoard({ group, open, setOpen, houseAvailable, onImageIdea, onDiscuss, onWallet, latestNote }: { group: RoomController; open: boolean; setOpen: (open: boolean) => void; houseAvailable: boolean; onImageIdea: (text: string) => void; onDiscuss: (text: string) => void; onWallet: () => void; latestNote?: string }) {
  const [name, setName] = useState(''), [resource, setResource] = useState<ResourceRoute>('house'), [kind, setKind] = useState<SharedPiece['kind']>('note'), [draft, setDraft] = useState(''), [pending, setPending] = useState(''), [notice, setNotice] = useState(''), [editing, setEditing] = useState(false);
  const me = group.room?.members.find(member => member.id === group.id), joined = group.phase === 'connected';
  useEffect(() => { if (me) { setName(me.name); setResource(me.resource); } }, [me?.name, me?.resource]);
  useEffect(() => { if (pending && group.room?.pieces.some(piece => piece.id === pending)) { setDraft(''); setPending(''); setNotice('Added to everyone’s board.'); } }, [group.room, pending]);
  useEffect(() => { if (!pending) return; const timeout = setTimeout(() => { setPending(''); setNotice('Posting is unconfirmed. Your draft is still here; check the board before retrying.'); }, 8000); return () => clearTimeout(timeout); }, [pending]);
  if (!open && !group.room) return null;
  const link = typeof window === 'undefined' ? '' : roomInvite(window.location.origin, group.invite);
  function post(text = draft, pieceKind = kind) { const pieceId = crypto.randomUUID(); if (group.send({ type: 'add', id: pieceId, kind: pieceKind, text })) { setPending(pieceId); setNotice('Posting…'); } }
  function profile(next: ResourceRoute) { setResource(next); if (joined) group.send({ type: 'profile', name, resource: next }); }
  const resourceHelp = resource === 'house' ? (houseAvailable ? 'House voice trial is available within its existing limits. Joining never starts a call.' : 'House voice trial has no available calls. The shared board still works.') : resource === 'own' ? 'Pair your AI in your private PointCast profile. Running it inside this room is the next integration.' : 'Open the wallet for existing x402 tools. Room credit and automatic AI purchases are not connected yet.';
  return <section className="shared-room-board" aria-label="Five-person shared room">
    <div className="shared-room-heading"><div><span className="eyebrow">A TABLE FOR FIVE</span><h2>{group.room ? 'Good things, together.' : 'Make room for your people.'}</h2></div>{!group.room && <button className="shared-icon" onClick={() => setOpen(false)} aria-label="Close group setup"><X size={17}/></button>}</div>
    {!group.room && <p className="shared-intro">A shared board for five humans, with Shwa close by. Add ideas, find a direction, make something.</p>}
    {group.room && <><ol className="shared-seats" aria-label="Five room seats">{Array.from({ length: 5 }, (_, index) => { const member = group.room!.members[index]; return <li key={member?.id || 'empty-' + index} className={member ? 'occupied' : 'empty'}><span className="seat-orb">{member ? member.name.slice(0, 1).toUpperCase() : '+'}</span><strong>{member ? member.name + (member.id === group.id ? ' · you' : '') : 'Open seat'}</strong><small>{member ? (member.online ? resourceNames[member.resource] + ' · chosen' : 'Reconnecting…') : 'Invite a human'}</small></li>; })}</ol>
      <div className="shared-room-tools"><span className={'shared-connection ' + (joined ? 'online' : '')}>{joined ? `${group.room.members.filter(member => member.online).length} / 5 here · live board` : 'Reconnecting · edits paused'}</span><button onClick={async () => { try { await navigator.clipboard.writeText(link); setNotice('Invite link copied. Anyone with it can join.'); } catch { setNotice('Copy the invite link from the field below.'); } }}><Copy size={14}/>Invite</button><button onClick={() => setEditing(!editing)} aria-expanded={editing}>My seat</button><button onClick={group.leave}>Leave</button></div>
      <label className="shared-link">Room link<input aria-label="Room invite link" value={link} readOnly onFocus={event => event.target.select()}/></label>
    </>}
    {(!group.room || editing) && <div className="shared-setup"><label>Your name<input value={name} maxLength={32} onChange={event => setName(event.target.value)} placeholder="What should we call you?" autoComplete="nickname"/></label><fieldset><legend>Your AI resource route</legend><div className="resource-routes">{(Object.keys(resourceNames) as ResourceRoute[]).map(route => <button type="button" key={route} aria-pressed={resource === route} onClick={() => profile(route)}>{resourceNames[route]}</button>)}</div></fieldset><p className="resource-help">{resourceHelp}</p><div className="shared-setup-actions">{resource === 'own' && <a href="/me#ai-companion" target="_blank" rel="noopener noreferrer">Connect my AI<ArrowUpRight size={14}/></a>}{resource === 'x402' && <button type="button" onClick={onWallet}>Open wallet<ArrowUpRight size={14}/></button>}{group.room ? <button disabled={!name.trim() || !joined} onClick={() => { group.send({ type: 'profile', name, resource }); setEditing(false); }}>Save my seat</button> : <button className="shared-primary" disabled={!name.trim() || group.phase === 'connecting'} onClick={() => void group.join(name, resource)}><Users size={16}/>{group.phase === 'connecting' ? 'Opening…' : group.invite ? 'Join this room' : 'Create a room'}</button>}</div><p className="shared-fine">Anyone with the invite link can join and read this board for 24 hours. Names are chosen by participants. Resource choices are preferences; they do not connect credentials, fund a balance, or change the house call’s payer.</p></div>}
    {group.room && <><form className="shared-composer" onSubmit={event => { event.preventDefault(); post(); }}><div className="shared-kind" role="group" aria-label="Contribution type">{(['note', 'proposal', 'image-idea'] as const).map(value => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{value === 'note' ? 'A thought' : value === 'proposal' ? 'A proposal' : 'An image idea'}</button>)}</div><textarea aria-label="Your contribution" value={draft} maxLength={1600} rows={2} placeholder={kind === 'proposal' ? 'Something we can decide together…' : kind === 'image-idea' ? 'A picture worth making…' : 'Put a thought on the table…'} onChange={event => setDraft(event.target.value)}/><div><button className="shared-primary" disabled={!joined || !draft.trim() || !!pending}><Plus size={15}/>Add to our board</button>{latestNote && <button type="button" disabled={!joined || !!pending} onClick={() => { setDraft(latestNote.slice(0, 1600)); setKind('note'); }}>Use my latest Shwa note</button>}</div></form>
      <div className="shared-pieces">{group.room.pieces.length ? group.room.pieces.map(piece => <article className={'shared-piece kind-' + piece.kind} key={piece.id}><div className="shared-paper"><div className="shared-byline"><span>{piece.author}</span><span>{piece.kind === 'proposal' ? 'PROPOSAL' : piece.kind === 'image-idea' ? 'IMAGE IDEA' : 'THOUGHT'}</span></div><p>{piece.text}</p>{piece.kind === 'proposal' && <div className="shared-vote-total">{Object.values(piece.votes).filter(vote => vote === 'yes').length} yes · {Object.values(piece.votes).filter(vote => vote === 'no').length} rethink · {Object.keys(piece.votes).length} / {group.room!.members.length} voted</div>}</div><div className="shared-piece-actions">{piece.kind === 'proposal' && <><button disabled={!joined} aria-pressed={piece.votes[group.id] === 'yes'} onClick={() => group.send({ type: 'vote', id: piece.id, vote: piece.votes[group.id] === 'yes' ? null : 'yes' })}><Check size={13}/>Yes</button><button disabled={!joined} aria-pressed={piece.votes[group.id] === 'no'} onClick={() => group.send({ type: 'vote', id: piece.id, vote: piece.votes[group.id] === 'no' ? null : 'no' })}>Rethink</button></>}{piece.kind === 'image-idea' && <button onClick={() => { onImageIdea(piece.text); setNotice('Idea placed in your image studio. Greenlight there generates it within an eligible call.'); }}><ImageIcon size={13}/>Prepare image</button>}<button onClick={() => { onDiscuss(piece.author + ' contributed: ' + piece.text); setNotice('Selected text added to this browser’s Shwa context. It is sent to OpenAI during an eligible live call; no call was started.'); }}><MessageCircle size={13}/>Discuss with Shwa</button>{piece.authorId === group.id && <button disabled={!joined} onClick={() => group.send({ type: 'remove', id: piece.id })} aria-label={'Remove your ' + piece.kind}><X size={13}/></button>}</div></article>) : <div className="shared-empty">The table is open.<span>Start with a thought, a question, a possibility.</span></div>}</div>
      <p className="shared-fine">Anyone with this link can join and read the board. It expires after 24 hours. This version shares text and votes; microphones, Shwa calls, images, Spotify and payments stay in each person’s browser. “Discuss with Shwa” selects text to send to OpenAI. Votes never approve spending.</p></>}
    <p className="shared-feedback" role="status">{group.error || notice}</p>{group.phase === 'disconnected' && <div className="shared-recovery"><button disabled={!name.trim()} onClick={() => void group.join(name, resource)}>Rejoin room</button><button onClick={group.leave}>Return to my own board</button></div>}
  </section>;
}
