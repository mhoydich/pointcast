/**
 * Morning Edition email signup — the form in #paper on /morning.
 *
 * POSTs {email, source} to /api/morning/subscribe and prints the answer. The
 * server's `message` is shown verbatim for 'check-email' and 'on-list'. Also
 * reads ?paper= (the redirect from the confirm link) and prints that result.
 * The address stays in the form field only: nothing is kept on the phone, and
 * the field is cleared once the server has it. The button is rendered
 * disabled (and the form is method="post"), so a tap before this script runs,
 * or with JavaScript off, never sends the address in a URL; mounting enables it.
 * Arriving at #paper (the receipt link, the confirm redirect), the section is
 * scrolled to again once the edition renders above it, unless the reader has
 * scrolled since.
 */
type Reply = { ok?: boolean; status?: string; message?: string; reason?: string };

const SOURCES = ['receipt', 'card', 'rss'];
const TIMEOUT_MS = 12_000;

export const UI_COPY = {
  sending: 'Sending…',
  invalid: "That address doesn't look right.",
  limited: 'Too many tries. Wait 15 minutes.',
  failed: "That didn't go through. Try again.",
} as const;

/** ?paper= results, from the confirm link's redirect. */
export const PAPER_COPY: Record<string, string> = {
  confirmed: "You're on the list. The next edition comes by email at 6:45 AM.",
  expired: 'That link expired. Sign up again for a new one.',
  invalid: 'That link did not work.',
  unavailable: "That didn't go through. Try again later.",
};

/** receipt, card or rss when ?src= says so, else morning. */
export function sourceFrom(search: string): string {
  const src = new URLSearchParams(search).get('src') ?? '';
  return SOURCES.includes(src) ? src : 'morning';
}

/** The line to print for a reply (status code + parsed body). */
export function replyLine(httpStatus: number, body: Reply | null): string {
  if (httpStatus === 202 && body?.ok === true && (body.status === 'check-email' || body.status === 'on-list') && typeof body.message === 'string') return body.message;
  if (body?.reason === 'invalid-email') return UI_COPY.invalid;
  if (body?.reason === 'email-rate-limited' || body?.reason === 'ip-rate-limited') return UI_COPY.limited;
  return UI_COPY.failed;
}

export function mountMorningSignup(): void {
  const root = document.querySelector<HTMLElement>('[data-me-paper]');
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>('[data-me-paper-form]');
  const input = root.querySelector<HTMLInputElement>('[data-me-paper-email]');
  const button = root.querySelector<HTMLButtonElement>('[data-me-paper-send]');
  const status = root.querySelector<HTMLElement>('[data-me-paper-status]');
  if (!form || !input || !button || !status) return;
  const say = (text: string) => { status.textContent = text; };

  const result = new URLSearchParams(location.search).get('paper');
  if (result && Object.prototype.hasOwnProperty.call(PAPER_COPY, result)) {
    say(PAPER_COPY[result]);
    root.scrollIntoView();
  }
  if (location.hash === '#paper' || result) {
    // The edition renders above #paper after a fetch and pushes it down (no scroll anchoring on iOS Safari).
    let moved = false;
    const mark = () => { moved = true; };
    for (const type of ['wheel', 'touchstart', 'keydown']) window.addEventListener(type, mark, { once: true, passive: true });
    document.addEventListener('me:rendered', () => { if (!moved) root.scrollIntoView(); }, { once: true });
  }
  button.disabled = false;

  const source = sourceFrom(location.search);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    const email = input.value.trim();
    if (!email) { say(UI_COPY.invalid); return; }
    button.disabled = true;
    say(UI_COPY.sending);
    let line: string = UI_COPY.failed;
    let sent = false;
    try {
      const res = await fetch('/api/morning/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = (await res.json().catch(() => null)) as Reply | null;
      line = replyLine(res.status, body);
      sent = res.status === 202;
    } catch {
      line = UI_COPY.failed;
    }
    if (sent) input.value = '';
    say(line);
    button.disabled = false;
  });
}
