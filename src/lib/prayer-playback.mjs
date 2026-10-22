/** Prepare Web Audio from a Listen/Pray gesture, including iOS interruptions. */
export function createPrayerPlayback(scope = globalThis, timeoutMs = 4000) {
  let context = null;

  const release = (value) => {
    try { Promise.resolve(value?.close()).catch(() => {}); } catch { /* already closed */ }
  };

  async function ready() {
    const Audio = scope.AudioContext || scope.webkitAudioContext;
    if (!Audio) throw new Error('Audio playback is not supported in this browser.');
    // Web Audio's ambient default follows the iPhone Silent switch. Set this
    // only after an explicit playback gesture; unsupported browsers keep Web Audio.
    try {
      if (scope.navigator?.audioSession) scope.navigator.audioSession.type = 'playback';
    } catch { /* Optional Audio Session API is unavailable or restricted. */ }
    if (!context || context.state === 'closed') context = new Audio();
    const candidate = context;
    let timer;
    try {
      if (candidate.state !== 'running') {
        // Safari can report "interrupted" after a tab switch or screen lock.
        // Do not schedule a short tone until resume has actually completed.
        await Promise.race([
          candidate.resume(),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Audio did not start. Tap Listen to retry.')), timeoutMs);
          }),
        ]);
      }
      if (context !== candidate || candidate.state !== 'running') {
        throw new Error('Audio is paused by your browser. Tap Listen to retry.');
      }
      return candidate;
    } catch (error) {
      if (context === candidate) context = null;
      release(candidate);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ready,
    close() {
      const previous = context;
      context = null;
      release(previous);
    },
  };
}
