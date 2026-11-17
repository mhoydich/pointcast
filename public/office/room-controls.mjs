// Room addresses are assigned by the bounded snapshot reader. A user gesture
// enables audio and only arrivals after the first good snapshot make a sound.
export function roomControls({ read, sound, watch }) {
  let audio;
  let sounding = false;
  let watching = false;
  let timer;
  let previousIds = null;

  function toggle(button, enabled, label) {
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = label + (enabled ? ' on' : ' off');
  }

  function schedule() {
    clearTimeout(timer);
    if (watching && !document.hidden) timer = setTimeout(read, 60_000);
  }

  function setWatching(enabled) {
    watching = enabled;
    toggle(watch, enabled, 'Live updates');
    schedule();
  }

  function setSound(enabled) {
    sounding = enabled;
    toggle(sound, enabled, 'Room sound');
  }

  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) {
    sound.disabled = true;
    sound.textContent = 'Room sound unavailable';
  }
  sound.addEventListener('click', async () => {
    if (sounding) {
      setSound(false);
      return;
    }
    try {
      audio ??= new Audio();
      await audio.resume();
      setSound(true);
    } catch {
      sound.disabled = true;
      sound.textContent = 'Room sound unavailable';
    }
  });

  watch.addEventListener('click', () => setWatching(!watching));
  document.addEventListener('visibilitychange', schedule);

  function chime(frequency, start) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.035, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + 0.14);
  }

  function observe(snapshot) {
    const ended = snapshot?.state === 'ended';
    if (!snapshot || ended || snapshot.state === 'degraded') {
      previousIds = null;
      setWatching(false);
      watch.disabled = ended;
      return;
    }
    watch.disabled = false;
    const events = snapshot.events;
    const rooms = ['#officenoun-tasks', ...snapshot.desks.map(desk => desk.handle)];
    if (sounding && !document.hidden && previousIds && snapshot.state === 'ok') {
      const arrivals = new Set(events.filter(event => !previousIds.has(event.id)).map(event => event.roomAddress));
      // One cue per active room per read, even when a room has many arrivals.
      let delay = 0;
      for (const address of arrivals) {
        const index = rooms.indexOf(address);
        if (index < 0) continue;
        try {
          chime(261.63 * 2 ** (index / 6), audio.currentTime + delay);
          delay += 0.16;
        } catch {
          setSound(false);
          break;
        }
      }
    }
    previousIds = new Set(events.map(event => event.id));
    schedule();
  }

  return { observe };
}
