export type VoicePlaybackState = {
  status: 'waiting' | 'ready' | 'blocked' | 'interrupted' | 'ended';
  message: string;
};

type Options = {
  audio: HTMLAudioElement;
  resume: () => Promise<void>;
  isCurrent: () => boolean;
  onState: (state: VoicePlaybackState) => void;
};

/** Keep browser playback distinct from a connected session or audible speakers. */
export function createVoicePlayback({ audio, resume, isCurrent, onState }: Options) {
  let disposed = false, started = false, attempt = 0;
  let track: MediaStreamTrack | undefined;
  let state: VoicePlaybackState | undefined;
  const current = () => !disposed && isCurrent();
  const publish = (next: VoicePlaybackState) => {
    if (!current() || (state?.status === next.status && state.message === next.message)) return;
    state = next;
    onState(next);
  };
  const waiting = () => publish({ status: 'waiting', message: 'Waiting for Shwa’s voice. You can try sound again if it stays quiet.' });
  const ended = () => publish({ status: 'ended', message: 'Shwa’s audio stream ended. End this call and start a new one to reconnect.' });
  const interrupted = () => publish({ status: 'interrupted', message: 'Voice playback paused. Tap Hear Shwa to try sound again.' });
  const reportPlayback = () => {
    if (!track) return waiting();
    if (track.readyState === 'ended') return ended();
    if (track.muted || !track.enabled) return waiting();
    if (audio.muted || audio.volume === 0) return publish({ status: 'blocked', message: 'This page’s voice output is muted. Tap Hear Shwa to turn it on.' });
    if (audio.paused) return interrupted();
    if (!started) return waiting();
    publish({ status: 'ready', message: 'Voice playback started in your browser. If it is quiet, check your volume or try Hear Shwa.' });
  };

  const play = () => {
    if (!current()) return;
    const ticket = ++attempt;
    if (!track) return waiting();
    if (track.readyState === 'ended') return ended();
    const valid = () => current() && ticket === attempt;
    const failed = (error: unknown) => {
      if (!valid()) return;
      publish({
        status: error && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError' ? 'blocked' : 'interrupted',
        message: 'Your browser could not start Shwa’s voice. Tap Hear Shwa to try sound again.',
      });
    };
    try {
      // Invoke directly, before awaiting anything, so retry retains its click gesture.
      void audio.play().then(() => { if (valid()) { started = true; reportPlayback(); } }, failed);
    } catch (error) { failed(error); }
  };
  const playing = () => { if (!current()) return; attempt++; started = true; reportPlayback(); };
  const paused = () => { if (!current()) return; attempt++; started = false; if (track?.readyState === 'ended') ended(); else if (track) interrupted(); };
  const unavailable = () => { if (!current()) return; attempt++; started = false; if (track?.readyState === 'ended') ended(); else waiting(); };
  const failed = () => { if (!current()) return; attempt++; started = false; if (track) interrupted(); };
  const volumeChanged = () => { if (current() && track) reportPlayback(); };
  const trackEnded = () => { if (!current()) return; attempt++; started = false; ended(); };
  const trackUnmuted = () => { if (current()) play(); };

  const mediaListeners: [string, EventListener][] = [
    ['playing', playing], ['pause', paused], ['error', failed],
    ['waiting', unavailable], ['stalled', unavailable], ['volumechange', volumeChanged],
  ];
  for (const [name, listener] of mediaListeners) audio.addEventListener(name, listener);
  const detachTrack = () => {
    track?.removeEventListener('mute', unavailable);
    track?.removeEventListener('unmute', trackUnmuted);
    track?.removeEventListener('ended', trackEnded);
  };
  waiting();

  return {
    attach(next: MediaStreamTrack): MediaStream {
      const stream = new MediaStream([next]);
      if (!current()) return stream;
      attempt++;
      started = false;
      detachTrack();
      track = next;
      track.addEventListener('mute', unavailable);
      track.addEventListener('unmute', trackUnmuted);
      track.addEventListener('ended', trackEnded);
      audio.autoplay = true;
      audio.srcObject = stream;
      waiting();
      play();
      return stream;
    },
    retry(): void {
      if (!current()) return;
      // The context powers meters only. Its failure must not silence media playback.
      try { void resume().catch(() => {}); } catch { /* Meter support is optional. */ }
      audio.muted = false;
      if (audio.volume === 0) audio.volume = 1;
      play();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      attempt++;
      detachTrack();
      track = undefined;
      for (const [name, listener] of mediaListeners) audio.removeEventListener(name, listener);
    },
  };
}
