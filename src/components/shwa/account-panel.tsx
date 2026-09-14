/** @jsxRuntime classic */
import * as React from "react";
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { PointCastUser } from '../../lib/auth/types';

type Props = { onActivity?: (key: string, value: string) => void; live?: boolean };
type AccountState = { status: 'loading' | 'ready' | 'error'; user: PointCastUser | null };
type SpotifySelection = { url: string; embed: string };
type PersonalTrack = { id: string; title: string; artist: string; album: string; imageUrl: string | null; spotifyUrl: string; isPlaying: boolean; progressMs: number; durationMs: number };
type SpotifyAccount = { connected: boolean; configured?: boolean; status: 'connected' | 'disconnected' | 'reconnect_required' | 'unavailable'; track: PersonalTrack | null; checkedAt: string };
const SIGN_IN = '/auth?returnTo=%2Fshwa%2F';
const SPOTIFY_AUTH = '/api/spotify/auth?personal=1&returnTo=%2Fshwa%2F';
const SAVED_LINK = 'pc:shwa:spotify-url:v1';
const MUSIC_PRESENCE = 'A Spotify player panel is available in the room. Spotify handles the music separately. You cannot hear, inspect, or control its audio or identify its selection.';

/** Canonical public links only: no arbitrary iframe origins, paths, or query parameters. */
export function roomSpotifySelection(input: string): SpotifySelection | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com' || url.port || url.username || url.password) return null;
    const match = url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|album|playlist)\/([A-Za-z0-9]{22})\/?$/);
    if (!match) return null;
    return { url: `https://open.spotify.com/${match[1]}/${match[2]}`, embed: `https://open.spotify.com/embed/${match[1]}/${match[2]}` };
  } catch { return null; }
}

export function RoomAccount({ onActivity, live = false }: Props) {
  const [account, setAccount] = useState<AccountState>({ status: 'loading', user: null });
  const [revision, setRevision] = useState(0);
  const activity = useRef(onActivity);
  activity.current = onActivity;
  useEffect(() => {
    let controller: AbortController | undefined;
    let mounted = true;
    async function restore() {
      controller?.abort();
      const request = new AbortController(); controller = request;
      setAccount({ status: 'loading', user: null });
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store', signal: request.signal });
        if (response.status === 401) {
          if (mounted && !request.signal.aborted) setAccount({ status: 'ready', user: null });
          return;
        }
        if (!response.ok) throw new Error('Session unavailable');
        const data = await response.json() as { user?: PointCastUser };
        if (!data.user || typeof data.user.userId !== 'string' || !Array.isArray(data.user.identities)) throw new Error('Session unavailable');
        if (mounted && !request.signal.aborted) setAccount({ status: 'ready', user: data.user });
      } catch {
        if (mounted && !request.signal.aborted) setAccount({ status: 'error', user: null });
      }
    }
    const refresh = () => { void restore(); };
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener('pc:auth-change', refresh);
    window.addEventListener('pc:auth-refresh', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      mounted = false; controller?.abort();
      window.removeEventListener('pc:auth-change', refresh);
      window.removeEventListener('pc:auth-refresh', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [revision]);
  useEffect(() => {
    activity.current?.('account', account.user ? 'The visitor is signed in to PointCast. Their account identity and connected-service data are not provided to you.' : 'No signed-in PointCast account is currently confirmed for this room.');
  }, [account.user]);
  return <div className="account-chip" aria-label="PointCast account">
    {account.status === 'loading' ? <span role="status">Restoring account…</span> : account.status === 'error' ? <><span role="status">Account unavailable</span><button type="button" className="small-button" onClick={() => setRevision(value => value + 1)}>Retry</button></> : account.user ? <a href="/auth" aria-label="Manage PointCast account">{account.user.preferredName || 'Your account'} · PointCast</a> : live ? <span>Guest · sign in after your call</span> : <a href={SIGN_IN}>Sign in</a>}
  </div>;
}

export function RoomMusic({ onActivity, live = false }: Props) {
  const [spotify, setSpotify] = useState<SpotifyAccount | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'anonymous' | 'error'>('loading');
  const [input, setInput] = useState('');
  const [selection, setSelection] = useState<SpotifySelection | null>(null);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);
  const [revision, setRevision] = useState(0);
  const activity = useRef(onActivity);
  const picked = useRef(false);
  const manualRef = useRef(false);
  activity.current = onActivity;
  const inputId = useId();
  useEffect(() => {
    try {
      const remembered = roomSpotifySelection(localStorage.getItem(SAVED_LINK) || '');
      if (remembered) { picked.current = true; manualRef.current = true; setSelection(remembered); setInput(remembered.url); setManual(true); }
    } catch { /* A public link can still be used without browser storage. */ }
    // This is fixed application presence. Never forward URLs, titles, artists, or playback events to AI.
    activity.current?.('music', MUSIC_PRESENCE);
  }, []);
  useEffect(() => {
    let controller: AbortController | undefined;
    let mounted = true;
    async function restore(clear = false) {
      controller?.abort();
      const request = new AbortController(); controller = request;
      if (clear) {
        setSpotify(null); setState('loading');
        if (!manualRef.current) { picked.current = false; setSelection(null); }
      }
      try {
        const response = await fetch('/api/me/spotify', { credentials: 'include', cache: 'no-store', signal: request.signal });
        if (response.status === 401) {
          if (mounted && !request.signal.aborted) {
            setSpotify(null); setState('anonymous');
            if (!manualRef.current) { picked.current = false; setSelection(null); }
          }
          return;
        }
        if (!response.ok) throw new Error('Spotify connection unavailable');
        const data = await response.json() as SpotifyAccount & { ok?: boolean };
        if (!data.ok || typeof data.connected !== 'boolean' || !['connected', 'disconnected', 'reconnect_required', 'unavailable'].includes(data.status)) throw new Error('Spotify connection unavailable');
        if (!mounted || request.signal.aborted) return;
        setSpotify(data); setState('ready');
        const restored = data.status === 'connected' && data.track?.spotifyUrl ? roomSpotifySelection(data.track.spotifyUrl) : null;
        if (restored && !picked.current) { picked.current = true; setSelection(restored); }
        if (data.status !== 'connected' && !manualRef.current) { picked.current = false; setSelection(null); }
      } catch {
        if (mounted && !request.signal.aborted) {
          setSpotify(null); setState('error');
          if (!manualRef.current) { picked.current = false; setSelection(null); }
        }
      }
    }
    const refresh = () => { void restore(true); };
    const visible = () => { if (document.visibilityState === 'visible') void restore(); };
    void restore(true);
    const timer = window.setInterval(visible, 60_000);
    window.addEventListener('pc:auth-change', refresh);
    window.addEventListener('pc:auth-refresh', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      mounted = false; controller?.abort(); window.clearInterval(timer);
      window.removeEventListener('pc:auth-change', refresh);
      window.removeEventListener('pc:auth-refresh', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [revision]);
  function choose(event: FormEvent) {
    event.preventDefault();
    const next = roomSpotifySelection(input);
    if (!next) { setError('Use a public open.spotify.com track, album, or playlist link.'); return; }
    picked.current = true; manualRef.current = true; setSelection(next); setManual(true); setError('');
    try { localStorage.setItem(SAVED_LINK, next.url); } catch { /* Storage is optional. */ }
  }
  async function disconnect() {
    setDisconnecting(true); setError('');
    try {
      const response = await fetch('/api/me/spotify', { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('Disconnect unconfirmed');
      setRevision(value => value + 1);
    } catch { setError('Spotify could not be disconnected. Please try again.'); }
    finally { setDisconnecting(false); }
  }
  const track = spotify?.status === 'connected' ? spotify.track : null;
  const connectionNote = state === 'loading' ? 'Restoring your Spotify connection…' : state === 'anonymous' ? 'Sign in to PointCast to restore your saved Spotify connection, or add a public link.' : state === 'error' ? 'Your Spotify connection could not be checked. You can still add a public link.' : spotify?.status === 'unavailable' ? 'Spotify is unavailable right now. You can still add a public link.' : spotify?.status === 'reconnect_required' ? 'Your Spotify authorization needs to be renewed. Reconnect to restore it.' : spotify?.status === 'disconnected' ? 'Connect Spotify once to restore it when you sign in to PointCast.' : track ? `${track.isPlaying ? 'Playing on your Spotify' : 'Paused on your Spotify'}: ${track.title || 'Spotify track'}${track.artist ? ` · ${track.artist}` : ''}.` : 'Your Spotify connection is restored. Nothing is playing right now.';
  return <section className="music-panel panel" aria-labelledby="room-music-title">
    <div className="panel-heading"><span className="eyebrow">06 / A LITTLE SOUNDTRACK</span><span>SPOTIFY</span></div>
    <h2 id="room-music-title">Bring your music.</h2>
    <p className="section-note" role="status">{connectionNote}</p>
    {state === 'error' && <button type="button" className="small-button" onClick={() => setRevision(value => value + 1)}>Check again</button>}
    {state === 'anonymous' && !live && <a className="small-button" href={SIGN_IN}>Sign in</a>}
    {state === 'ready' && spotify?.configured !== false && !live && <a className="small-button" href={SPOTIFY_AUTH}>{spotify?.connected || spotify?.status === 'reconnect_required' ? 'Reconnect Spotify' : 'Connect Spotify'}</a>}
    {spotify?.connected && !live && <button type="button" className="small-button" disabled={disconnecting} onClick={() => { void disconnect(); }}>{disconnecting ? 'Disconnecting…' : 'Disconnect Spotify'}</button>}
    <form className="spotify-form" onSubmit={choose}>
      <label className="sr-only" htmlFor={inputId}>Public Spotify track, album, or playlist link</label>
      <input id={inputId} value={input} onChange={event => setInput(event.target.value)} type="url" placeholder="Paste a Spotify link" autoComplete="off" />
      <button className="small-button" type="submit">Bring it in</button>
    </form>
    {error && <p className="section-note attention" role="alert">{error}</p>}
    {live ? <p className="section-note">The room’s player is off during your Shwa call. Pause music in other apps, too.</p> : selection ? <iframe key={selection.embed} title="Spotify player" src={selection.embed} height="352" width="100%" allow="encrypted-media; fullscreen; picture-in-picture" loading="lazy" /> : <div className="music-empty"><span>Your soundtrack goes here.</span></div>}
    {selection && !live && <a className="small-button" href={selection.url} target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a>}
    <p className="section-note">{manual ? 'This public link is remembered in this browser. ' : ''}Press play when you’re ready; the player may ask you to sign in to Spotify. Music and Spotify details stay outside Shwa’s conversation.</p>
  </section>;
}
