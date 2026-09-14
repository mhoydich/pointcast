/** @jsxRuntime classic */
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type MicPreviewState = { active: boolean; level: number; path: string };
type Props = { live: boolean; onPreview: (state: MicPreviewState) => void };
type PreviewRun = {
  context: AudioContext; stream?: MediaStream; source?: MediaStreamAudioSourceNode;
  analyser?: AnalyserNode; frame?: number; ended?: () => void;
};
const quiet: MicPreviewState = { active: false, level: 0, path: '0,36 320,36' };

export function VoiceOverview({ live, onPreview }: Props) {
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'testing' | 'error'>('idle');
  const [message, setMessage] = useState('Test your input here before starting a call.');
  const [preview, setPreview] = useState(quiet);
  const mounted = useRef(false), generation = useRef(0), current = useRef<PreviewRun | null>(null);
  const liveRef = useRef(live), notify = useRef(onPreview);
  liveRef.current = live; notify.current = onPreview;

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
    const leave = () => stop('Local microphone test stopped when you left the page.');
    window.addEventListener('pagehide', leave);
    return () => { mounted.current = false; window.removeEventListener('pagehide', leave); stop(); };
  }, [stop]);
  useEffect(() => { if (live) stop('The local test is off while a Shwa call is active.'); }, [live, stop]);

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
    <ol className="voice-flow">
      <li><strong>Start a call.</strong> Allow your microphone, speak naturally, and interrupt when you like. Shwa replies by voice; captions follow both sides.</li>
      <li><strong>Watch ideas arrive.</strong> Notes and board pieces usually appear in 15–30 seconds. Pin, answer, or hide a piece as you go.</li>
      <li><strong>Choose what to make.</strong> An image stays an idea until you click Greenlight. Research also needs an explicit click.</li>
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
