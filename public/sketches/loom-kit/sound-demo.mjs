// The sketch owns these controls. The sound kit owns playback and saved preferences.
export function mountSoundDemo(container, sound, names, signal) {
  const page = container.ownerDocument;
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
  for (const name of names.filter(name => name !== 'fire-bed')) {
    const option = page.createElement('option');
    option.value = name;
    option.textContent = (name[0].toUpperCase() + name.slice(1)).replaceAll('-', ' ');
    select.append(option);
  }

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

  async function reportUnlock(pending, cue) {
    const ready = await pending;
    if (signal.aborted || !sound.enabled) return;
    feedback.hidden = ready;
    if (!ready) feedback.textContent = 'Audio couldn’t start. Tap Play to try again.';
    if (ready && cue) sound.play(cue);
  }

  toggle.addEventListener('click', () => {
    const pending = sound.setEnabled(!sound.enabled);
    showPreferences();
    if (sound.enabled) reportUnlock(pending);
  }, { signal });
  options.querySelector('[data-sound-play]').addEventListener('click', () => {
    if (sound.enabled) reportUnlock(sound.unlock(), select.value);
  }, { signal });
  bed.addEventListener('click', () => {
    if (!sound.enabled) return;
    const pending = sound.setFireBed(!sound.fireBed);
    showPreferences();
    if (sound.fireBed) reportUnlock(pending);
  }, { signal });
}
