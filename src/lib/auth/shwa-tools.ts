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
  root.querySelectorAll<HTMLButtonElement>('[data-ai-starter]').forEach((button) => {
    button.addEventListener('click', () => {
      const song = doc.querySelector('[data-live-now-title]')?.textContent?.trim().slice(0, 200);
      const starters: Record<string, string> = {
        page: 'Help me explore this PointCast page. Suggest one interesting thing to notice and one question worth asking.',
        song: song ? `Tell me about “${song}”. Share one interesting detail and ask what I notice when listening. Do not imply you have heard the audio.` : 'Tell me about this song: [add its title and artist]. Share one interesting detail and ask what I notice when listening.',
        image: 'Let’s discuss an image. I’ll describe what I see: [add your description]. What stands out, and what question would help me look more closely? You have not received the image itself.',
        purchase: 'Help me review this NFT or x402 offer: [paste the public offer and terms]. Identify the item, seller, network, exact price, fees, and what I receive. List missing information. Prepare a review only; do not buy, sign, or send funds.',
      };
      prompt.value = starters[button.dataset.aiStarter!] || '';
      page.checked = button.dataset.aiStarter === 'page' && !page.disabled;
      changed(); prompt.focus();
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
  return () => { stop(); lifetime.abort(); };
}
