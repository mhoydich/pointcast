/** Local composition helpers. Only the runtime form can submit a task. */
export function mountShwaTools(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const prompt = root.querySelector<HTMLTextAreaElement>('[data-runtime-prompt]')!;
  const page = root.querySelector<HTMLInputElement>('[data-runtime-page]')!;
  const status = root.querySelector<HTMLElement>('[data-ai-voice-status]')!;
  const dictate = root.querySelector<HTMLButtonElement>('[data-ai-dictate]')!;
  const read = root.querySelector<HTMLButtonElement>('[data-ai-read]')!;
  const voiceWindow = win as any;
  const Recognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
  let recognition: any = null;
  let speaking = false;
  let version = 0;
  function changed() { prompt.dispatchEvent(new win.Event('input', { bubbles: true })); }
  function stop() {
    ++version;
    recognition?.abort(); recognition = null;
    if (speaking) win.speechSynthesis?.cancel();
    speaking = false; dictate.textContent = 'Tap to speak';
  }
  function reset() { stop(); status.textContent = ''; }
  dictate.disabled = !Recognition;
  read.disabled = !win.speechSynthesis;
  if (!Recognition) status.textContent = 'Voice input is unavailable in this browser. You can type your question.';
  const form = root.querySelector<HTMLFormElement>('[data-runtime-task-form]');
  if (root.dataset.compact === 'true' && form && !root.querySelector('.ai-runtime__options')) {
    const options = doc.createElement('details');
    options.className = 'ai-runtime__options';
    const summary = doc.createElement('summary'); summary.textContent = 'Voice & options';
    for (const attribute of form.getAttributeNames().filter(name => name.startsWith('data-astro-cid-'))) {
      options.setAttribute(attribute, ''); summary.setAttribute(attribute, '');
    }
    options.append(summary);
    for (const selector of ['.ai-runtime__voice', '.ai-runtime__followup', '.ai-runtime__page', '.ai-runtime__model', '[data-runtime-model-source]', '.ai-runtime__fields', '.ai-runtime__actions', '.ai-runtime__login', '.ai-runtime__gentle', '.ai-runtime__gentle-detail', '.ai-runtime__preview', '.ai-runtime__invite', '.ai-runtime__pilot', '.ai-runtime__manage']) {
      const element = root.querySelector(selector); if (element) options.append(element);
    }
    form.append(options);
  }
  if (root.dataset.compact === 'true' && form && !root.querySelector('[data-shwa-conversation]')) {
    const conversation = doc.createElement('details'); conversation.dataset.shwaConversation = ''; conversation.className = 'shwa-conversation';
    const summary = doc.createElement('summary'); summary.textContent = 'Ask Shwa · song stories & conversation'; conversation.append(summary);
    const parent = form.parentElement!;
    for (const selector of ['.ai-runtime__shwa', '.ai-runtime__task', '[data-runtime-job]', '[data-runtime-result]']) {
      const element = root.querySelector(selector); if (element) conversation.append(element);
    }
    parent.append(conversation);
  }
  const starterStatus = root.querySelector<HTMLElement>('[data-ai-starter-status]');
  const songTitle = () => doc.querySelector('[data-live-now-title]')?.textContent?.trim().slice(0, 200) || '';
  const updateSong = () => {
    root.querySelectorAll('[data-ai-song-label]').forEach(label => { label.textContent = songTitle() || 'Play a song to explore its story'; });
  };
  const songElement = doc.querySelector('[data-live-now-title]');
  const observer = new win.MutationObserver(updateSong);
  if (songElement) observer.observe(songElement, { childList: true, subtree: true, characterData: true });
  updateSong();
  root.querySelector('[data-shwa-song]')?.addEventListener('click', () => {
    const conversation = root.querySelector<HTMLDetailsElement>('[data-shwa-conversation]'); if (conversation) conversation.open = true;
    root.querySelector<HTMLButtonElement>('[data-ai-starter="song"]')?.click();
  }, { signal: lifetime.signal });
  root.querySelectorAll<HTMLButtonElement>('[data-ai-starter]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const song = songTitle();
      if (button.dataset.aiStarter === 'song' && !song) {
        if (starterStatus) starterStatus.textContent = 'No song title is showing yet. Play a song, or type its title and artist below.';
        return;
      }
      if (starterStatus) starterStatus.textContent = '';
      const starters: Record<string, string> = {
        song: `What is the history of “${song}”? Use your general music knowledge to tell me its album and release era, the people behind it, and one memorable story or musical detail. Make it an interesting short read. Say when you are unsure about a fact. Do not imply you have heard the audio or looked anything up.`,
        activity: 'Give me three small, inviting things to do now: one creative, one away from the screen, and one on PointCast. Make each concrete and easy to start, in one or two sentences. Choose the PointCast activity from these available places: /rosebud (browser drum playground), /open-road (one minute of stillness), /room (listening room), /downloads/ (original downloadable artworks). Include its full https://pointcast.xyz link. No setup or purchases.',
        surprise: 'Surprise me with one lovely, unexpected little detour I can try in the next two minutes. It might be a creative experiment, a way of noticing my surroundings, or a playful question. Be specific, warm, and original. No setup or purchases. Give me the invitation directly, without a preamble.',
      };
      prompt.value = starters[button.dataset.aiStarter!] || '';
      page.checked = false;
      for (const selector of ['[data-runtime-followup]', '[data-runtime-gentle]']) {
        const input = root.querySelector<HTMLInputElement>(selector); if (input) input.checked = false;
      }
      for (const selector of ['[data-runtime-note]', '[data-runtime-context]']) {
        const input = root.querySelector<HTMLInputElement>(selector); if (input) input.value = '';
      }
      changed();
      if (button.hasAttribute('data-ai-quick') && form) form.requestSubmit();
      else prompt.focus();
    }, { signal: lifetime.signal });
  });
  dictate.addEventListener('click', () => {
    if (recognition) { stop(); status.textContent = 'Voice input stopped. Review your text before sending.'; return; }
    stop();
    const generation = version;
    const active = new Recognition(); recognition = active;
    active.continuous = false; active.interimResults = false;
    active.lang = doc.documentElement.lang || win.navigator.language || 'en-US';
    active.onresult = (event: any) => {
      if (generation !== version || lifetime.signal.aborted) return;
      const transcript = Array.from(event.results as any[]).map((result: any) => result[0]?.transcript || '').join(' ');
      prompt.value = [prompt.value.trim(), transcript.trim()].filter(Boolean).join(' ').slice(0, 4000);
      changed(); status.textContent = 'Transcript ready. Review it, then send when you’re ready.';
    };
    active.onerror = () => { if (generation === version) status.textContent = 'Voice input could not finish. Check microphone permission, or type your question.'; };
    active.onend = () => { if (recognition === active) { recognition = null; dictate.textContent = 'Tap to speak'; } };
    try { active.start(); dictate.textContent = 'Stop listening'; status.textContent = 'Listening…'; }
    catch { stop(); status.textContent = 'Voice input is unavailable. You can type instead.'; }
  }, { signal: lifetime.signal });
  read.addEventListener('click', () => {
    const text = root.querySelector('[data-runtime-result-text]')?.textContent?.trim();
    if (!text) { status.textContent = 'Ask a question first; then you can listen to the reply.'; return; }
    stop(); const utterance = new voiceWindow.SpeechSynthesisUtterance(text);
    speaking = true; utterance.onend = () => { speaking = false; };
    win.speechSynthesis.speak(utterance); status.textContent = 'Reading the reply aloud.';
  }, { signal: lifetime.signal });
  root.querySelector('[data-ai-stop]')!.addEventListener('click', () => { stop(); status.textContent = 'Voice stopped.'; }, { signal: lifetime.signal });
  win.addEventListener('pc:auth-change', reset, { signal: lifetime.signal });
  win.addEventListener('pc:auth-refresh', reset, { signal: lifetime.signal });
  win.addEventListener('pc:dock-visibility', (event) => { if (!(event as CustomEvent).detail?.open || (event as CustomEvent).detail?.tray !== 'my-ai') reset(); }, { signal: lifetime.signal });
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState !== 'visible') reset(); }, { signal: lifetime.signal });
  return () => { stop(); observer.disconnect(); lifetime.abort(); };
}
