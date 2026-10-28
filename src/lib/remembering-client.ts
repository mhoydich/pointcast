import { remembranceCards, remembranceIntents, buildRemembranceText, wrapRemembranceText, reflowRemembranceForImage } from './remembering.mjs';

const root = document.querySelector<HTMLElement>('[data-remembering]');
if (root) {
  const get = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const name = get<HTMLInputElement>('rem-name');
  const memory = get<HTMLTextAreaElement>('rem-memory');
  const status = get<HTMLParagraphElement>('rem-status');
  const occasion = get<HTMLSelectElement>('rem-occasion');
  const intent = get<HTMLSelectElement>('rem-intent');
  const shareButton = get<HTMLButtonElement>('rem-share');
  let selected = root.querySelector<HTMLInputElement>('input[name="rem-card"]:checked')?.value || remembranceCards[0].id;
  let lit = false;
  let audioContext: AudioContext | undefined;
  let bellGain: GainNode | undefined;
  let voices: OscillatorNode[] = [];
  let audioEpoch = 0;
  let bellActive = false;
  let imageRevision = 0;
  let prepared: { blob: Blob; file: File } | undefined;
  function invalidateImage() {
    imageRevision++;
    prepared = undefined;
    get<HTMLButtonElement>('rem-share-image').disabled = true;
  }

  const shareText = () => buildRemembranceText(selected, name.value, memory.value, occasion.value, intent.value);
  function render() {
    invalidateImage();
    const card = remembranceCards.find((item: { id: string }) => item.id === selected)!;
    get('rem-card-title').textContent = card.title;
    get('rem-card-message').textContent = card.message;
    get('rem-card-intent').textContent = remembranceIntents.find((item: { id: string }) => item.id === intent.value)?.message || '';
    get('rem-card-occasion').textContent = occasion.selectedOptions[0]?.textContent || '';
    const dedication = get('rem-dedication');
    dedication.textContent = name.value.trim() ? `Remembering ${name.value.trim()}` : '';
    dedication.hidden = !name.value.trim();
    const personal = get('rem-card-memory');
    personal.textContent = memory.value.trim();
    personal.hidden = !memory.value.trim();
    get('rem-share-text').textContent = shareText();
    get<HTMLTextAreaElement>('rem-copy-text').value = shareText();
    status.textContent = '';
  }
  root.querySelectorAll<HTMLInputElement>('input[name="rem-card"]').forEach((input) => {
    input.addEventListener('change', () => { selected = input.value; render(); });
  });
  name.addEventListener('input', render);
  memory.addEventListener('input', render);
  occasion.addEventListener('change', render);
  intent.addEventListener('change', render);
  root.querySelectorAll<HTMLInputElement>('input[name="rem-art"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      invalidateImage();
      const art = get<HTMLImageElement>('rem-card-art');
      art.src = `/images/still-light/${input.value}.webp`;
      art.alt = input.dataset.alt || '';
    });
  });
  get('rem-preview-link').addEventListener('click', () => {
    const heading = get('rem-preview-title');
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  get('rem-candle').addEventListener('click', () => {
    lit = !lit;
    root.querySelector<HTMLElement>('.rem-candle-scene')!.dataset.lit = String(lit);
    get('rem-candle').setAttribute('aria-pressed', String(lit));
    get('rem-candle').textContent = lit ? 'Let the candle rest' : 'Light a candle';
    get('rem-candle-caption').textContent = lit ? 'A light for the love you carry.' : 'A little light, when you wish.';
  });
  function stopBell() {
    audioEpoch++;
    bellActive = false;
    get('rem-bell').textContent = 'Sound a gentle bell';
    get('rem-bell').setAttribute('aria-pressed', 'false');
    if (audioContext && bellGain) {
      bellGain.gain.cancelScheduledValues(audioContext.currentTime);
      bellGain.gain.setTargetAtTime(0, audioContext.currentTime, .025);
    }
    voices.forEach((voice) => { try { voice.stop((audioContext?.currentTime || 0) + .12); } catch {} });
    voices = [];
  }
  get('rem-bell').addEventListener('click', async () => {
    if (bellActive) { stopBell(); status.textContent = 'The bell has stopped.'; return; }
    stopBell();
    bellActive = true;
    get('rem-bell').textContent = 'Stop the bell';
    get('rem-bell').setAttribute('aria-pressed', 'true');
    const epoch = audioEpoch;
    try {
      const AudioConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioConstructor) throw new Error('Audio unavailable');
      audioContext ||= new AudioConstructor();
      await audioContext.resume();
      if (epoch !== audioEpoch || document.hidden) return;
      const start = audioContext.currentTime;
      bellGain = audioContext.createGain();
      bellGain.gain.setValueAtTime(.12, start);
      bellGain.connect(audioContext.destination);
      const master = bellGain;
      [1, 2.01, 2.73, 4.07].forEach((partial, i) => {
        const voice = audioContext!.createOscillator();
        const volume = audioContext!.createGain();
        voice.type = 'sine';
        voice.frequency.value = 330 * partial;
        volume.gain.setValueAtTime(0, start);
        volume.gain.linearRampToValueAtTime(.28 / (i + 1), start + .09);
        volume.gain.exponentialRampToValueAtTime(.0001, start + 5.8 - i * .4);
        voice.connect(volume).connect(master);
        voice.onended = () => { voice.disconnect(); volume.disconnect(); voices = voices.filter((item) => item !== voice); if (i === 0) master.disconnect(); if (epoch === audioEpoch && voices.length === 0) { bellActive = false; get('rem-bell').textContent = 'Sound a gentle bell'; get('rem-bell').setAttribute('aria-pressed', 'false'); } };
        voice.start(start);
        voice.stop(start + 6);
        voices.push(voice);
      });
      status.textContent = 'A gentle bell. Let it fade at its own pace.';
    } catch {
      if (epoch !== audioEpoch) return;
      stopBell();
      status.textContent = 'The bell could not play on this device. You can still light a candle here.';
    }
  });
  async function copyWords() {
    const text = shareText();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      get('rem-manual-copy').hidden = true;
      status.textContent = 'Words copied. You can paste them into a message when you are ready.';
    } catch {
      get('rem-manual-copy').hidden = false;
      const field = get<HTMLTextAreaElement>('rem-copy-text');
      field.value = text;
      field.focus();
      field.select();
      status.textContent = 'Select and copy the words below. Nothing has been sent.';
    }
  }
  async function makeCardImage() {
    // Snapshot the visible selection before asynchronous image loading.
    const text = reflowRemembranceForImage(shareText());
    const source = get<HTMLImageElement>('rem-card-art').src;
    const art = new Image();
    art.src = source;
    await art.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    let fontSize = 30;
    let lines: string[];
    let lineHeight: number;
    do {
      ctx.font = `${fontSize}px sans-serif`;
      lines = wrapRemembranceText(text, (line: string) => ctx.measureText(line).width, 840);
      lineHeight = fontSize * 1.5;
      if (1560 + lines.length * lineHeight + 100 <= 8192) break;
      fontSize *= .8;
    } while (fontSize > .1);
    if (1560 + lines.length * lineHeight + 100 > 8192) throw new Error('Card is too long');
    canvas.height = Math.ceil(1560 + lines.length * lineHeight + 100);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(1000 / art.naturalWidth, 1500 / art.naturalHeight);
    const width = art.naturalWidth * scale;
    const height = art.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 1000, 1500);
    ctx.clip();
    ctx.drawImage(art, (1000 - width) / 2, (1500 - height) / 2, width, height);
    ctx.restore();
    ctx.fillStyle = '#172d47';
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = 'top';
    lines.forEach((line: string, index: number) => ctx.fillText(line, 80, 1560 + index * lineHeight));
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image unavailable')), 'image/png'));
  }
  function downloadCard(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'remembering-card.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function prepareImage(download: boolean) {
    const button = get<HTMLButtonElement>(download ? 'rem-save-image' : 'rem-prepare-image');
    const revision = imageRevision;
    button.disabled = true;
    status.textContent = 'Preparing your card on this device…';
    try {
      const blob = await makeCardImage();
      if (revision !== imageRevision) {
        status.textContent = 'The card changed while the image was being made. Please prepare it again.';
        return;
      }
      if (download) {
        downloadCard(blob);
        status.textContent = 'Your card image was downloaded.';
      } else {
        prepared = { blob, file: new File([blob], 'remembering-card.png', { type: 'image/png' }) };
        get<HTMLButtonElement>('rem-share-image').disabled = false;
        status.textContent = 'Your card is ready to share.';
      }
    } catch {
      status.textContent = 'The card image could not be made. Your words are still here; you can copy them instead.';
    } finally { button.disabled = false; }
  }
  get('rem-save-image').addEventListener('click', () => { void prepareImage(true); });
  get('rem-prepare-image').addEventListener('click', () => { void prepareImage(false); });
  get('rem-share-image').addEventListener('click', () => {
    if (!prepared) return;
    const { blob, file } = prepared;
    try {
      if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
        downloadCard(blob);
        status.textContent = 'Image sharing is unavailable here, so your card was downloaded.';
        return;
      }
      // Invoke immediately in the click handler, before awaiting any work.
      const sharing = navigator.share({ files: [file] });
      void sharing.then(() => { status.textContent = 'Returned from sharing. Your card is still here.'; })
        .catch((error) => { status.textContent = error instanceof DOMException && error.name === 'AbortError'
          ? 'Sharing cancelled. Your card is still here.' : 'Sharing is unavailable right now. You can save the card image instead.'; });
    } catch {
      status.textContent = 'Sharing is unavailable right now. You can save the card image instead.';
    }
  });
  get('rem-copy').addEventListener('click', copyWords);
  shareButton.addEventListener('click', async () => {
    if (!navigator.share) { await copyWords(); return; }
    shareButton.disabled = true;
    try {
      await navigator.share({ text: shareText() });
      status.textContent = 'Returned from sharing. Your card is still here.';
    } catch (error) {
      status.textContent = error instanceof DOMException && error.name === 'AbortError'
        ? 'Sharing cancelled. Your words are still here.'
        : 'Sharing is unavailable right now. Use Copy these words instead.';
    } finally { shareButton.disabled = false; }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopBell();
      void audioContext?.suspend().catch(() => {});
    }
  });
  window.addEventListener('pagehide', () => {
    stopBell();
    // A page restored from the back-forward cache keeps its JavaScript state.
    // Discard the closed context so a later, explicit tap can create a new one.
    const context = audioContext;
    audioContext = undefined;
    bellGain = undefined;
    void context?.close().catch(() => {});
  });
  render();
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | HTMLSelectElement>('[data-rem-enable]')
    .forEach((control) => { control.disabled = false; });
}
