// The sketch owns these controls. The sound kit owns playback and saved preferences.
export function mountSoundDemo(container, { createLoomSound, SOUND_NAMES }) {
  const page = container.ownerDocument;
  const view = page.defaultView;
  container.innerHTML = `<div class="sound-demo">
    <button type="button" data-sound-toggle role="switch">Sound <span data-sound-state aria-hidden="true"></span></button>
    <div data-sound-options hidden>
      <label class="sound-cue">Audio cue <select></select></label>
      <button type="button" data-sound-play>Play</button>
      <button type="button" data-sound-bed role="switch">Fire bed <span data-sound-state aria-hidden="true"></span></button>
    </div>
    <p data-sound-feedback role="status" hidden></p>
  </div>`;
  const toggle = container.querySelector('[data-sound-toggle]');
  const options = container.querySelector('[data-sound-options]');
  const select = options.querySelector('select');
  const bed = options.querySelector('[data-sound-bed]');
  const feedback = container.querySelector('[data-sound-feedback]');
  for (const name of SOUND_NAMES.filter(name => name !== 'fire-bed')) {
    const option = page.createElement('option');
    option.value = name;
    option.textContent = (name[0].toUpperCase() + name.slice(1)).replaceAll('-', ' ');
    select.append(option);
  }

  let sound = createLoomSound();
  function setSwitch(button, on) {
    button.setAttribute('aria-checked', String(on));
    button.querySelector('[data-sound-state]').textContent = on ? 'On' : 'Off';
  }
  function showPreferences() {
    setSwitch(toggle, sound.enabled);
    setSwitch(bed, sound.fireBed);
    options.hidden = !sound.enabled;
    feedback.hidden = true;
  }
  showPreferences();

  async function reportUnlock(instance, pending, cue) {
    const ready = await pending;
    if (instance !== sound || !instance.enabled) return;
    feedback.hidden = ready;
    if (!ready) feedback.textContent = 'Audio couldn’t start. Tap Play to try again.';
    if (ready && cue) instance.play(cue);
  }

  toggle.addEventListener('click', () => {
    if (!sound) return;
    const pending = sound.setEnabled(!sound.enabled);
    showPreferences();
    if (sound.enabled) reportUnlock(sound, pending);
  });
  options.querySelector('[data-sound-play]').addEventListener('click', () => {
    if (sound?.enabled) reportUnlock(sound, sound.unlock(), select.value);
  });
  bed.addEventListener('click', () => {
    if (!sound?.enabled) return;
    const pending = sound.setFireBed(!sound.fireBed);
    showPreferences();
    if (sound.fireBed) reportUnlock(sound, pending);
  });

  view.addEventListener('pagehide', () => {
    sound?.dispose();
    sound = null;
  });
  view.addEventListener('pageshow', event => {
    if (event.persisted && !sound) {
      sound = createLoomSound();
      showPreferences();
    }
  });
}
