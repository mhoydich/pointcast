/** @jsxRuntime classic */
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoicePlaybackState } from './lib/voice-playback';

export type MicPreviewState = { active: boolean; level: number; path: string };
type Props = {
  live: boolean;
  onPreview: (state: MicPreviewState) => void;
  callAudio?: { playback?: VoicePlaybackState; heardYou: boolean; replySeen: boolean; retry?: () => void };
};
type PreviewRun = {
  context: AudioContext; stream?: MediaStream; source?: MediaStreamAudioSourceNode;
  analyser?: AnalyserNode; frame?: number; ended?: () => void;
};
const quiet: MicPreviewState = { active: false, level: 0, path: '0,36 320,36' };

export function VoiceOverview({ live, onPreview, callAudio }: Props) {
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'testing' | 'error'>('idle');
  const [message, setMessage] = useState('Test your input here before starting a call.');
  const [preview, setPreview] = useState(quiet);
  const mounted = useRef(false), generation = useRef(0), current = useRef<PreviewRun | null>(null);
  const liveRef = useRef(live), notify = useRef(onPreview);
  liveRef.current = live; notify.current = onPreview;
  const speaker = useRef<HTMLAudioElement>(null), speakerGeneration = useRef(0), speakerEngaged = useRef(false), pageActive = useRef(true);
  const [speakerPhase, setSpeakerPhase] = useState<'idle' | 'starting' | 'playing' | 'error'>('idle');
  const [speakerMessage, setSpeakerMessage] = useState('Play a three-second chime to check this device’s sound.');

  const stopSpeaker = useCallback((reason = 'Speaker test stopped.', element = speaker.current) => {
    speakerGeneration.current++;
    speakerEngaged.current = false;
    element?.pause();
    if (mounted.current) { setSpeakerPhase('idle'); setSpeakerMessage(reason); }
  }, []);
  function speakerFailed(error?: unknown) {
    if (!mounted.current || !pageActive.current || liveRef.current || !speakerEngaged.current) return;
    speakerGeneration.current++;
    speakerEngaged.current = false;
    setSpeakerPhase('error');
    const denied = error && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError';
    setSpeakerMessage(denied ? 'Your browser blocked the test. Tap Play speaker test again, or use the audio player below.' : 'The speaker test could not play. Try again using the button or the audio player below.');
  }
  function speakerPlaying(element: HTMLAudioElement) {
    if (!mounted.current || !pageActive.current || liveRef.current || !speakerEngaged.current) { element.pause(); return; }
    if (element.paused) return;
    speakerGeneration.current++;
    setSpeakerPhase('playing');
    setSpeakerMessage('The chime is playing in your browser. If you cannot hear it, check your device volume and Bluetooth output.');
  }
  function beginSpeaker() {
    const element = speaker.current;
    if (!element || !mounted.current || !pageActive.current || liveRef.current) return;
    const ticket = ++speakerGeneration.current;
    speakerEngaged.current = true;
    setSpeakerPhase('starting'); setSpeakerMessage('Starting the speaker test…');
    try {
      element.currentTime = 0;
      element.muted = false;
      if (element.volume === 0) element.volume = 1;
      // Native media playback starts directly in this gesture, with no API call.
      void element.play().then(() => {
        if (ticket === speakerGeneration.current) speakerPlaying(element);
        else if (!mounted.current || !pageActive.current || liveRef.current || !speakerEngaged.current) element.pause();
      }, error => { if (ticket === speakerGeneration.current) speakerFailed(error); });
    } catch (error) { if (ticket === speakerGeneration.current) speakerFailed(error); }
  }

  const stop = useCallback((reason = 'Local microphone test stopped.') => {
    generation.current++;
    const run = current.current; current.current = null;
    if (run) {
      if (run.frame !== undefined) cancelAnimationFrame(run.frame);
      for (const track of run.stream?.getTracks() || []) {
        if (run.ended) track.removeEventListener('ended', run.ended);
        track.stop();
      }
      try { run.source?.disconnect(); } catch { /* The audio graph may already be closed. */ }
      try { run.analyser?.disconnect(); } catch { /* The audio graph may already be closed. */ }
      if (run.context.state !== 'closed') void run.context.close().catch(() => {});
    }
    notify.current(quiet);
    if (mounted.current) { setPreview(quiet); setPhase('idle'); setMessage(reason); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    pageActive.current = true;
    const element = speaker.current;
    const leave = () => {
      pageActive.current = false;
      stop('Local microphone test stopped when you left the page.');
      stopSpeaker('Speaker test stopped when you left the page.', element);
    };
    const show = () => { pageActive.current = true; };
    window.addEventListener('pagehide', leave);
    window.addEventListener('pageshow', show);
    return () => { mounted.current = false; window.removeEventListener('pagehide', leave); window.removeEventListener('pageshow', show); stop(); stopSpeaker(undefined, element); };
  }, [stop, stopSpeaker]);
  useEffect(() => {
    if (live) { stop('The local test is off while a Shwa call is active.'); stopSpeaker('The speaker test is off during a call.'); }
    else setSpeakerMessage('Play a three-second chime to check this device’s sound.');
  }, [live, stop, stopSpeaker]);

  async function begin() {
    if (liveRef.current || current.current || !mounted.current) return;
    const ticket = ++generation.current;
    setPhase('requesting'); setMessage('Allow microphone access to test your input locally.');
    const valid = () => mounted.current && generation.current === ticket && !liveRef.current;
    try {
      const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!navigator.mediaDevices?.getUserMedia || !Audio) throw new Error('unsupported');
      const run: PreviewRun = { context: new Audio() }; current.current = run;
      // Resume inside the click gesture; a later permission result is still
      // checked against this run before any stream can become active.
      void run.context.resume().catch(() => {
        if (valid()) { stop(); setPhase('error'); setMessage('The local audio test could not start. Please try again.'); }
      });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!valid() || current.current !== run) { stream.getTracks().forEach(track => track.stop()); return; }
      run.stream = stream;
      run.analyser = run.context.createAnalyser(); run.analyser.fftSize = 256;
      run.source = run.context.createMediaStreamSource(stream); run.source.connect(run.analyser);
      run.ended = () => stop('The microphone input ended. You can test it again.');
      stream.getTracks().forEach(track => track.addEventListener('ended', run.ended!));
      const samples = new Uint8Array(run.analyser.fftSize); let lastPaint = -Infinity;
      setPhase('testing'); setMessage('Listening locally. This audio is not being sent to Shwa.');
      const first = { ...quiet, active: true }; setPreview(first); notify.current(first);
      const sample = (at: number) => {
        if (!valid() || current.current !== run) return;
        if (at - lastPaint >= 100) {
          lastPaint = at; run.analyser!.getByteTimeDomainData(samples);
          let sum = 0; const points: string[] = [];
          for (let i = 0; i < samples.length; i++) {
            const value = (samples[i] - 128) / 128; sum += value * value;
            if (i % 4 === 0) points.push(`${i / 252 * 320},${36 - value * 28}`);
          }
          const next = { active: true, level: Math.min(1, Math.sqrt(sum / samples.length) * 6), path: points.join(' ') };
          setPreview(next); notify.current(next);
        }
        run.frame = requestAnimationFrame(sample);
      };
      run.frame = requestAnimationFrame(sample);
    } catch (error) {
      if (!valid()) return;
      stop(); setPhase('error');
      const name = error instanceof Error ? error.name : '';
      setMessage(name === 'NotAllowedError' ? 'Microphone access was not allowed. You can change permission in your browser and try again.' : name === 'NotFoundError' ? 'No microphone was found. Connect one, then try again.' : 'This browser could not start the local microphone test.');
    }
  }

  return <section className="voice-overview" aria-labelledby="voice-overview-title">
    <span className="eyebrow">VOICE → IDEAS → THE BOARD</span>
    <h2 id="voice-overview-title">Think out loud.</h2>
    {live && <section className="voice-diagnostics" aria-labelledby="voice-diagnostics-title">
      <h3 id="voice-diagnostics-title">Your voice connection</h3>
      <dl>
        <div><dt>Call</dt><dd>{callAudio ? 'Connected' : 'Connecting or ending'}</dd></div>
        <div><dt>Your words</dt><dd>{callAudio?.heardYou ? 'Captions received' : 'No captions yet'}</dd></div>
        <div><dt>Shwa’s reply</dt><dd>{callAudio?.replySeen ? 'Captions received' : 'No reply captions yet'}</dd></div>
      </dl>
      <p className="voice-playback-message" role="status" data-playback-state={callAudio?.playback?.status || 'waiting'}>{callAudio?.playback?.message || 'Waiting for the voice connection.'}</p>
      {callAudio?.retry && <button type="button" className="small-button" onClick={callAudio.retry}>Hear Shwa</button>}
      <p className="section-note">Captions show words reaching this page. Browser playback cannot confirm what you hear from your speakers.</p>
    </section>}
    <section className="speaker-preview" aria-labelledby="speaker-preview-title">
      <h3 id="speaker-preview-title">Try your speakers</h3>
      <p>A short sound check. It starts no call, uses no microphone, and spends no call units.</p>
      <div className="speaker-preview-actions">
        <button type="button" className="small-button" disabled={live} onClick={beginSpeaker}>Play speaker test</button>
        {!live && (speakerPhase === 'starting' || speakerPhase === 'playing') && <button type="button" className="small-button" onClick={() => stopSpeaker()}>Stop speaker test</button>}
      </div>
      <audio ref={speaker} className="speaker-preview-player" controls hidden={live} preload="none" src="/audio/starjam/welcome.m4a" aria-label="Speaker test audio" onPlay={event => {
        if (!mounted.current || !pageActive.current || liveRef.current) { event.currentTarget.pause(); return; }
        speakerEngaged.current = true;
        setSpeakerPhase('starting'); setSpeakerMessage('Starting the speaker test…');
      }} onPlaying={event => speakerPlaying(event.currentTarget)} onPause={event => {
        if (!mounted.current || !pageActive.current || liveRef.current || !speakerEngaged.current || !event.currentTarget.paused) return;
        speakerGeneration.current++; speakerEngaged.current = false;
        setSpeakerPhase('idle'); setSpeakerMessage('Speaker test paused. You can play it again.');
      }} onEnded={() => {
        if (!mounted.current || !pageActive.current || liveRef.current) return;
        speakerGeneration.current++; speakerEngaged.current = false;
        setSpeakerPhase('idle'); setSpeakerMessage('The speaker test finished. If it was quiet, check device volume and Bluetooth output.');
      }} onError={() => speakerFailed()}/>
      <p className="speaker-preview-status" role="status" data-state={speakerPhase}>{live ? 'The speaker test is off during a call. Use Hear Shwa to retry the live voice.' : speakerMessage}</p>
    </section>
    <ol className="voice-flow">
      <li><strong>Start a call.</strong> Allow your microphone, speak naturally, and interrupt when you like. Shwa replies by voice; captions follow both sides.</li>
      <li><strong>Watch ideas arrive.</strong> Notes and board pieces usually appear in 15–30 seconds. Pin, answer, or hide a piece as you go.</li>
      <li><strong>Choose what to make.</strong> Say “look up paddle prices” for cited research, or “generate an image of…” to make a picture. You can also click Greenlight on an image idea. Shwa uses Astra for deeper reasoning; requested tools count toward this call’s allowance.</li>
    </ol>
    <section className="mic-preview" aria-labelledby="mic-preview-title">
      <h3 id="mic-preview-title">Try your microphone locally</h3>
      <p>This test shows your input signal in this browser. It starts no call, records nothing, sends no audio, and plays no sound.</p>
      <svg viewBox="0 0 320 72" preserveAspectRatio="none" aria-hidden="true"><polyline points={preview.path} fill="none" stroke="currentColor"/></svg>
      <meter min="0" max="1" value={preview.level} aria-label="Local microphone input level"/>
      <div className="mic-preview-actions">
        {phase === 'requesting' || phase === 'testing' ? <button type="button" className="small-button" onClick={() => stop()}>Stop microphone test</button> : <button type="button" className="small-button" disabled={live} onClick={() => { void begin(); }}>Test microphone</button>}
      </div>
      <p className="section-note" role="status">{live ? 'The local test is off during a call. Your call uses its own microphone connection.' : message}</p>
    </section>
  </section>;
}
