import { inningAt, plays, MEMORY_KEY, parseMemory, memoryText } from '../data/baseball.mjs';

const root = document.querySelector<HTMLElement>('[data-baseball]');
if (root) {
  const q = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  let step = 0;
  let lens = 'ball';
  const invitations: Record<string, string> = {
    company: 'Come watch an inning with me. You do not need to know everything.',
    pencil: 'Bring a pencil. We can learn the marks together.',
    listen: 'Bring a radio. Leave room for the story.',
  };
  const next = q<HTMLButtonElement>('[data-next]');
  const previous = q<HTMLButtonElement>('[data-previous]');
  function render() {
    const state = inningAt(step);
    q('[data-runs]').textContent = String(state.runs);
    q('[data-hits]').textContent = String(state.hits);
    q('[data-step]').textContent = `${step} / 6 BATTERS`;
    const outs = q('[data-outs]');
    outs.setAttribute('aria-label', `${state.outs} outs`);
    outs.querySelectorAll('i').forEach((dot, i) => dot.classList.toggle('on', i < state.outs));
    root!.querySelectorAll('[data-base]').forEach((base, i) => {
      base.setAttribute('visibility', state.bases[i] ? 'visible' : 'hidden');
      base.querySelector('text')!.textContent = state.bases[i] || '';
    });
    const occupied = state.bases.map((runner, i) => runner ? `${['first', 'second', 'third'][i]}: batter ${runner}` : '').filter(Boolean);
    q('#field-desc').textContent = `${state.runs} runs, ${state.hits} hits, ${state.outs} outs. ${occupied.length ? `Runners on ${occupied.join('; ')}.` : 'No runners on base.'}${state.complete ? ' Half inning over; one runner left on base.' : ''}`;
    q('[data-base-caption]').textContent = state.complete ? 'TWO RUNS. ONE LITTLE AFTERNOON.' : occupied.length ? `${occupied.length} RUNNER${occupied.length === 1 ? '' : 'S'} WAITING FOR THE NEXT PLAY.` : 'EVERY RUN IS A JOURNEY HOME.';
    root!.querySelectorAll('[data-cell]').forEach((cell, i) => {
      cell.classList.toggle('played', i < step);
      cell.classList.toggle('current', i === step - 1);
      cell.querySelector('[data-mark]')!.textContent = i < step ? plays[i].code : '·';
      cell.querySelector('[data-play-name]')!.textContent = i < step ? ['single', 'strikeout', 'walk', 'double', 'sac. fly', 'strikeout'][i] : 'waiting';
    });
    root!.querySelectorAll('[data-lens]').forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute('data-lens') === lens)));
    q('[data-play-eyebrow]').textContent = step ? `BATTER ${String(step).padStart(2, '0')} / ${lens === 'ball' ? 'FOLLOW THE BALL' : lens === 'pencil' ? 'KEEPING SCORE' : 'THE PEOPLE BESIDE YOU'}` : 'THE AFTERNOON IS OPEN';
    q('[data-play-title]').textContent = step ? state.name : 'Let’s see what happens.';
    q('[data-play-copy]').textContent = step ? state[lens === 'ball' ? 'line' : lens] : lens === 'pencil' ? 'A scorecard is a little map of what happened. Start with the next batter.' : lens === 'company' ? 'Notice the people around the game. There is room for a conversation between plays.' : 'Press “Next batter” to follow the ball. Change your view to notice the pencil or the company.';
    next.replaceChildren(document.createTextNode(state.complete ? 'Replay half inning ' : 'Next batter '));
    const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = state.complete ? '↺' : '→'; next.append(arrow);
    previous.disabled = step === 0;
    const ball = q('[data-ball]'); ball.setAttribute('visibility', step ? 'visible' : 'hidden');
    if (step) {
      ball.setAttribute('cx', String(state.ball[0])); ball.setAttribute('cy', String(state.ball[1]));
      q('[data-ball-path]').setAttribute('d', `M310 325 ${state.ball[0]} ${state.ball[1]}`);
    } else q('[data-ball-path]').setAttribute('d', 'M310 325 310 325');
  }
  next.addEventListener('click', () => { step = step === plays.length ? 0 : step + 1; render(); });
  previous.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  root.querySelectorAll<HTMLButtonElement>('[data-lens]').forEach(button => button.addEventListener('click', () => { lens = button.dataset.lens!; render(); }));
  const note = q<HTMLTextAreaElement>('#baseball-memory');
  const ritual = q<HTMLSelectElement>('#baseball-ritual');
  const status = q('[data-memory-status]');
  function updateMemory() {
    q('[data-character-count]').textContent = `${note.value.length} / 280`;
    q('[data-invitation]').textContent = invitations[ritual.value];
  }
  try {
    const saved = parseMemory(localStorage.getItem(MEMORY_KEY));
    if (saved) { note.value = saved.note; ritual.value = saved.ritual; status.textContent = 'Your saved memory is here. Keep it, change it, or take it with you.'; }
  } catch { status.textContent = 'This browser cannot keep memories. You can still download a card.'; }
  note.addEventListener('input', updateMemory);
  ritual.addEventListener('change', updateMemory);
  q('[data-save-memory]').addEventListener('click', () => {
    if (!note.value.trim()) { status.textContent = 'Add a few words about the afternoon first.'; note.focus(); return; }
    try { localStorage.setItem(MEMORY_KEY, JSON.stringify({ note: note.value.slice(0, 280), ritual: ritual.value })); status.textContent = 'Kept in this browser. A little piece of the afternoon.'; }
    catch { status.textContent = 'This browser could not save it. Download the card to keep a copy.'; }
  });
  q('[data-clear-memory]').addEventListener('click', () => {
    try { localStorage.removeItem(MEMORY_KEY); note.value = ''; ritual.value = 'company'; updateMemory(); status.textContent = 'Memory cleared. The next afternoon is open.'; }
    catch { status.textContent = 'The browser could not clear the saved memory. Try its site storage settings.'; }
  });
  q('[data-download-memory]').addEventListener('click', () => {
    const blob = new Blob([memoryText(note.value, ritual.value)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'pointcast-baseball-memory.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Your text card is ready to take with you.';
  });
  render(); updateMemory();
  q('[data-interactive]').hidden = false;
  q('[data-memory-desk]').hidden = false;
}
