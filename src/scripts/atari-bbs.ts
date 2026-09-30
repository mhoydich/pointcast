// A new museum interpretation, not recovered Death Star BBS software.
const terminal = document.querySelector<HTMLElement>('[data-terminal]');
if (terminal) {
  const output = terminal.querySelector<HTMLElement>('[data-output]')!;
  const announcement = terminal.querySelector<HTMLElement>('[data-announcement]')!;
  const connection = terminal.querySelector<HTMLElement>('[data-connection]')!;
  const connect = terminal.querySelector<HTMLButtonElement>('[data-connect]')!;
  const skip = terminal.querySelector<HTMLButtonElement>('[data-skip]')!;
  const instant = terminal.querySelector<HTMLInputElement>('[data-instant]')!;
  const form = terminal.querySelector<HTMLFormElement>('[data-command-form]')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const dash = document.querySelector<HTMLElement>('#dash')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = 'WELCOME TO THE MUSEUM\n\n[H] The story    [R] The rig\n[G] Door game    [S] Source notes\n\nType a command below. HELP returns here.\nQ disconnects. Nothing is sent to a BBS.';
  const screens: Record<string, string> = {
    H: 'THE STORY\n\nOverlord = Mike Hoydich\nFreddie  = Frank\n\nMike’s 2013 account dates the launch to 1987.\nThey also formed UFP, the United Federation\nof Pirates. Read the original post below.',
    R: 'THE RIG\n\nAtari 130XE / FoReM BBS software\n300 baud at launch / under 1 MB of storage\n\nThe desk photograph is from Mike’s archive.\nExact later hardware configurations remain\nuncertain. See the collection below.',
    S: 'SOURCE NOTES\n\nThe WordPress post is the primary account.\nIts comments form a small oral history.\n\nThis terminal and game are modern tributes.\nRead the sources in the museum below.\nNo original board software is running here.',
    G: 'DOOR OPEN: 38-COLUMN DASH\n\nYour race is below the terminal.\nAlternate A and L to reach column 38.\n\nA new game inspired by old recollections.\nYour best time stays in this browser.',
  };
  let connected = false;
  let textTimer: ReturnType<typeof setTimeout> | undefined;
  let fullText = output.textContent || '';
  function finishText() {
    clearTimeout(textTimer);
    output.textContent = fullText;
    skip.hidden = true;
  }
  function write(text: string) {
    clearTimeout(textTimer);
    fullText = text;
    announcement.textContent = text;
    if (instant.checked || reducedMotion.matches) { finishText(); return; }
    output.textContent = '';
    skip.hidden = false;
    let position = 0;
    const type = () => {
      position += 1;
      output.textContent = text.slice(0, position);
      if (position < text.length) textTimer = setTimeout(type, 33);
      else skip.hidden = true;
    };
    type();
  }
  function activate() {
    connected = true;
    connect.hidden = true;
    connection.textContent = 'CONNECTED';
    form.hidden = false;
  }
  connect.addEventListener('click', () => { activate(); write('CONNECT 300\n\n' + menu); });
  skip.addEventListener('click', finishText);
  instant.addEventListener('change', () => { if (instant.checked) finishText(); });
  function command(raw: string) {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    if (value === 'Q' || value === 'QUIT') {
      connected = false;
      connect.hidden = false;
      form.hidden = true;
      connection.textContent = 'OFFLINE';
      resetRace();
      dash.hidden = true;
      write('NO CARRIER\n\nThanks for visiting.\nThe museum is still open below.');
      connect.focus();
      return;
    }
    if (!connected) activate();
    if (['HELP', '?', 'M', 'MENU'].includes(value)) write(menu);
    else if (value === 'CLEAR') write('SCREEN CLEARED\n\nType HELP for the menu.');
    else if (screens[value]) {
      write(screens[value]);
      if (value === 'G') {
        dash.hidden = false;
        dash.focus({ preventScroll: true });
        dash.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
      }
    } else write('COMMAND NOT FOUND\n\nTry H, R, G, S, HELP, CLEAR, or Q.');
  }
  form.addEventListener('submit', event => { event.preventDefault(); command(input.value); input.value = ''; });
  terminal.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(button => {
    button.addEventListener('click', () => command(button.dataset.command!));
  });

  const track = dash.querySelector<HTMLElement>('.dash-track')!;
  const cells = [...track.children];
  const countLabel = dash.querySelector<HTMLElement>('[data-dash-count]')!;
  const timeLabel = dash.querySelector<HTMLElement>('[data-dash-time]')!;
  const status = dash.querySelector<HTMLElement>('[data-dash-status]')!;
  const bestLabel = dash.querySelector<HTMLElement>('[data-best]')!;
  const stepButtons = [...dash.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const storageKey = 'pointcast:atari-bbs:dash-best:v1';
  let best: number | null = null;
  try {
    const stored = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(stored) && stored > 0) best = stored;
  } catch { /* The game also works with browser storage disabled. */ }
  function showBest() { bestLabel.textContent = best === null ? 'Best time stays in this browser.' : `Your best: ${best.toFixed(2)} s · this browser`; }
  showBest();
  let steps = 0;
  let previous = '';
  let started = 0;
  let animation = 0;
  function tick() {
    timeLabel.textContent = `${((performance.now() - started) / 1000).toFixed(2)} s`;
    animation = requestAnimationFrame(tick);
  }
  function resetRace() {
    cancelAnimationFrame(animation);
    steps = 0; previous = ''; started = 0;
    cells.forEach(cell => cell.classList.remove('done'));
    stepButtons.forEach(button => { button.disabled = false; });
    countLabel.textContent = '00 / 38';
    track.setAttribute('aria-valuenow', '0');
    timeLabel.textContent = '0.00 s';
    status.textContent = 'Press either key to start. Then alternate.';
  }
  function step(key: string) {
    if (steps >= 38 || dash.hidden) return;
    if (key === previous) { status.textContent = `Switch to ${key === 'A' ? 'L' : 'A'} to keep moving.`; return; }
    if (steps === 0) { started = performance.now(); animation = requestAnimationFrame(tick); }
    previous = key;
    cells[steps].classList.add('done');
    steps += 1;
    countLabel.textContent = `${String(steps).padStart(2, '0')} / 38`;
    track.setAttribute('aria-valuenow', String(steps));
    if (steps === 38) {
      cancelAnimationFrame(animation);
      const seconds = Math.max(.01, (performance.now() - started) / 1000);
      timeLabel.textContent = `${seconds.toFixed(2)} s`;
      status.textContent = `Finish! All 38 columns in ${seconds.toFixed(2)} seconds. Reset to race again.`;
      stepButtons.forEach(button => { button.disabled = true; });
      if (best === null || seconds < best) {
        best = seconds;
        try { localStorage.setItem(storageKey, String(best)); } catch { /* Session best remains usable. */ }
        showBest();
      }
    } else status.textContent = `Next: ${key === 'A' ? 'L' : 'A'}`;
  }
  stepButtons.forEach(button => button.addEventListener('click', () => step(button.dataset.step!)));
  dash.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toUpperCase();
    if (key === 'A' || key === 'L') { event.preventDefault(); step(key); }
  });
  dash.querySelector<HTMLButtonElement>('[data-reset]')!.addEventListener('click', () => { resetRace(); dash.focus({ preventScroll: true }); });
  // A browser Back restore must not leave a half-written screen or frozen race.
  window.addEventListener('pagehide', () => { finishText(); resetRace(); });
}
