interface ClubSelf {
  signedIn: boolean; isMember: boolean; suspended: boolean; handle: string | null; joinedAt: string | null;
  badges: { id: string; earnedAt: string }[]; checkinDays: number; checkedInToday: boolean; canModerate: boolean;
}
interface ClubPost { id: string; handle: string; channel: string; body: string; createdAt: string; canDelete: boolean; }
interface ClubState { ok: boolean; ready: boolean; memberCount: number; postCount: number; posts: ClubPost[]; self: ClubSelf; }
interface ClubReport { postId: string; reason: string; createdAt: string; body: string; channel: string; handle: string; }
class ClubRequestError extends Error { confirmed: boolean; constructor(message: string, confirmed = true) { super(message); this.confirmed = confirmed; } }
const club = document.querySelector<HTMLElement>('[data-atari-club]');
if (club) {
  const find = <T extends HTMLElement = HTMLElement>(selector: string) => club.querySelector<T>(selector)!;
  const all = <T extends HTMLElement = HTMLElement>(selector: string) => [...club.querySelectorAll<T>(selector)];
  const stream = find('[data-posts]');
  const composer = find<HTMLFormElement>('[data-compose]');
  const message = composer.querySelector<HTMLTextAreaElement>('textarea')!;
  const postChannel = composer.querySelector<HTMLSelectElement>('select')!;
  const join = find<HTMLFormElement>('[data-join]');
  const noticeWrap = find('[data-notice-wrap]');
  const noticeText = find('[data-notice]');
  const retry = find<HTMLButtonElement>('[data-retry]');
  let state: ClubState | null = null;
  let channel = 'all';
  let busy = false;
  let ready = false;
  let generation = 0;
  const reported = new Set<string>();
  const date = (iso: string) => {
    const value = new Date(iso);
    return Number.isNaN(value.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(value);
  };
  function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
    const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node;
  }
  function action(text: string, key: string, value: string) {
    const button = element('button', '', text); button.type = 'button'; button.dataset[key] = value; button.dataset.mutate = ''; return button;
  }
  function notify(text: string, error = false, canRetry = false) {
    noticeWrap.hidden = false; noticeWrap.dataset.tone = error ? 'error' : 'success'; noticeText.textContent = text; retry.hidden = !canRetry;
  }
  function setBusy(value: boolean) {
    busy = value;
    for (const button of all<HTMLButtonElement>('[data-mutate]')) button.disabled = value || !ready || button.dataset.locked === 'true';
    for (const button of all<HTMLButtonElement>('[data-refresh], [data-retry], [data-refresh-reports]')) button.disabled = value;
  }
  async function request(url: string, body?: Record<string, unknown>) {
    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      response = await fetch(url, { signal: controller.signal, credentials: 'same-origin', cache: 'no-store', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    } catch { throw new ClubRequestError('The club connection was interrupted. Please refresh to reconnect.', !body); }
    finally { clearTimeout(timeout); }
    let result: any;
    try { result = await response.json(); } catch { throw new ClubRequestError('The club response could not be read.', !body); }
    if (!response.ok || !result.ok) {
      const wait = response.headers.get('Retry-After');
      throw new ClubRequestError(`${result.message || 'The club could not complete that request.'}${wait && /^\d+$/.test(wait) ? ` Try again in ${wait} seconds.` : ''}`);
    }
    return result;
  }
  function renderMembership() {
    find('[data-access-loading]').hidden = true;
    find('[data-access-unavailable]').hidden = ready;
    const self = ready ? state?.self : null;
    find('[data-visitor]').hidden = !self || self.signedIn;
    join.hidden = !self || !self.signedIn || self.isMember || self.suspended;
    find('[data-member]').hidden = !self?.isMember;
    find('[data-suspended]').hidden = !self?.suspended;
    composer.hidden = !self?.isMember;
    if (self?.isMember) {
      find('[data-self-handle]').textContent = self.handle;
      find('[data-joined]').textContent = self.joinedAt ? `Joined ${date(self.joinedAt)}` : '';
      find('[data-checkin-days]').textContent = String(self.checkinDays);
      find('[data-post-as]').textContent = `Posting as ${self.handle}`;
      const checkin = find<HTMLButtonElement>('[data-checkin]');
      checkin.dataset.locked = String(self.checkedInToday);
      checkin.textContent = self.checkedInToday ? 'Checked in today ✓' : 'Check in today';
    }
    if (self?.suspended) find('[data-paused-handle]').textContent = self.handle;
    find('[data-moderation]').hidden = !self?.canModerate;
    const earned = new Map((self?.badges || []).map(badge => [badge.id, badge.earnedAt]));
    let count = 0;
    for (const badge of all('[data-badge]')) {
      const earnedAt = earned.get(badge.dataset.badge!);
      badge.dataset.earnedState = earnedAt ? 'earned' : 'not-earned';
      const label = badge.querySelector<HTMLElement>('[data-earned]')!;
      label.textContent = earnedAt ? 'EARNED ✓' : !ready ? 'Status unavailable' : self?.signedIn ? 'Not earned yet' : 'Join to start';
      label.title = earnedAt ? `Earned ${date(earnedAt)}` : '';
      if (earnedAt) count++;
    }
    find('[data-badge-count]').textContent = ready ? `${count} / 4` : '— / 4';
    setBusy(busy);
  }
  function emptyBoard() {
    const empty = element('div', 'empty-board');
    empty.append(element('span', 'empty-mark', '↗'), element('h3', '', channel === 'all' ? 'The first signal could be yours.' : `A little space for ${channel}.`));
    const prompts: Record<string, string> = {
      all: 'There are no messages on the board yet. Say hello, share an Atari memory, or tell us what you are making.',
      general: 'No General messages yet. Introduce yourself: what brought you to the club?',
      memories: 'No Memories messages yet. What machine, board, game, or handle do you remember?',
      workshop: 'No Workshop messages yet. Show the room what you are building, or ask a small question to get started.',
    };
    empty.append(element('p', '', prompts[channel]), element('p', 'empty-note', 'A prompt from the club editors. No sample members or messages.'));
    return empty;
  }
  function renderPosts() {
    if (!state) return;
    stream.replaceChildren();
    if (!state.posts.length) stream.append(emptyBoard());
    for (const post of state.posts) {
      const card = element('article', 'board-post');
      const meta = element('div', 'post-meta');
      const time = element('time', '', date(post.createdAt)); time.dateTime = post.createdAt;
      meta.append(element('span', 'post-handle', post.handle), element('span', 'post-channel', post.channel), time);
      card.append(meta, element('p', 'post-body', post.body));
      const tools = element('div', 'post-tools');
      if (post.canDelete) {
        const disclosure = element('details'); disclosure.append(element('summary', '', 'Delete message'));
        const confirm = element('div', 'inline-tools'); confirm.append(element('p', '', 'Remove this message from the board?'), action('Yes, delete', 'deletePost', post.id));
        disclosure.append(confirm); tools.append(disclosure);
      }
      if (state.self.isMember && post.handle !== state.self.handle) {
        if (reported.has(post.id)) tools.append(element('span', '', 'Report received'));
        else {
          const disclosure = element('details'); disclosure.append(element('summary', '', 'Report'));
          const form = element('form', 'inline-tools'); form.dataset.reportForm = post.id;
          const label = element('label', '', 'Reason '); const select = element('select'); select.name = 'reason'; select.setAttribute('aria-label', 'Report reason');
          for (const reason of ['spam', 'abuse', 'privacy', 'other']) { const option = element('option', '', reason.charAt(0).toUpperCase() + reason.slice(1)); option.value = reason; select.append(option); }
          label.append(select); const submit = element('button', '', 'Send report'); submit.type = 'submit'; submit.dataset.mutate = '';
          form.append(label, submit); disclosure.append(form); tools.append(disclosure);
        }
      }
      if (tools.childElementCount) card.append(tools);
      stream.append(card);
    }
    find('[data-board-foot]').textContent = `Showing ${state.posts.length} newest ${channel === 'all' ? '' : channel + ' '}message${state.posts.length === 1 ? '' : 's'}. Public board · dates in your local time.`;
    setBusy(busy);
  }
  async function refreshReports() {
    if (!state?.self.canModerate || !ready) return;
    const reportStatus = find('[data-moderation-status]');
    reportStatus.textContent = 'Reading reports…';
    try {
      const response = await request('/api/atari-club?moderation=1');
      const reports = response.reports as ClubReport[];
      const container = find('[data-reports]'); container.replaceChildren();
      find('[data-report-count]').textContent = `${reports.length} open`;
      reportStatus.textContent = reports.length ? 'Open member reports. Resolving a report keeps the message; deleting removes it.' : 'No open reports.';
      const grouped = new Map<string, ClubReport[]>();
      for (const report of reports) grouped.set(report.postId, [...(grouped.get(report.postId) || []), report]);
      for (const entries of grouped.values()) {
        const report = entries[0];
        const card = element('article', 'report-item');
        card.append(element('p', 'report-meta', `${report.handle} / ${report.channel} / ${entries.length} report${entries.length === 1 ? '' : 's'}: ${[...new Set(entries.map(entry => entry.reason))].join(', ')}`), element('p', 'report-body', report.body || 'Message content has been removed.'));
        const actions = element('div', 'report-actions');
        actions.append(action('Resolve reports', 'resolvePost', report.postId), action('Delete message', 'deletePost', report.postId), action(`Pause ${report.handle}`, 'pauseHandle', report.handle));
        card.append(actions); container.append(card);
      }
      setBusy(busy);
    } catch (error) { reportStatus.textContent = `${(error as Error).message} Use Refresh reports to retry.`; }
  }
  async function refresh(clearNotice = true): Promise<boolean> {
    const requestId = ++generation;
    stream.setAttribute('aria-busy', 'true');
    try {
      const result = await request(`/api/atari-club${channel === 'all' ? '' : `?channel=${encodeURIComponent(channel)}`}`);
      if (requestId !== generation) return false;
      state = result as ClubState; ready = result.ready === true;
      if (!ready) throw new ClubRequestError('The club board is not ready yet.');
      find('[data-member-count]').textContent = String(state.memberCount);
      find('[data-post-count]').textContent = String(state.postCount);
      all<HTMLButtonElement>('[data-channel]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.channel === channel)));
      renderMembership(); renderPosts();
      if (clearNotice) noticeWrap.hidden = true;
      if (state.self.canModerate) await refreshReports();
      return true;
    } catch (error) {
      if (requestId !== generation) return false;
      ready = false; renderMembership();
      const oldView = state ? ' The messages shown are from the last successful load.' : ' This is a connection problem, not an empty board.';
      notify((error as Error).message + oldView, true, true);
      if (!state) {
        const unavailable = element('div', 'empty-board');
        unavailable.append(element('h3', '', 'The line is temporarily quiet.'), element('p', '', 'We could not read the board. Try the connection again; the museum, terminal, and art collection remain open.'));
        stream.replaceChildren(unavailable);
      }
      find('[data-board-foot]').textContent = state ? 'Connection interrupted · showing the last loaded board.' : 'Board status unavailable.';
      return false;
    } finally { if (requestId === generation) stream.setAttribute('aria-busy', 'false'); }
  }
  async function mutate(body: Record<string, unknown>, success: string, onSuccess?: () => void) {
    if (busy || !ready) return;
    setBusy(true);
    try {
      const result = await request('/api/atari-club', body);
      if (state && result.self) state.self = result.self;
      onSuccess?.();
      const refreshed = await refresh(false);
      notify(refreshed ? success : `${success} The updated board could not be loaded; refresh to confirm the current view.`, !refreshed, !refreshed);
    } catch (error) {
      const uncertain = error instanceof ClubRequestError && !error.confirmed;
      notify(`${(error as Error).message}${uncertain ? ' Your request may have arrived. Refresh the board before trying again.' : ''} ${body.action === 'post' ? 'Your draft is still here.' : ''}`.trim(), true, true);
    } finally { setBusy(false); }
  }
  join.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(join);
    void mutate({ action: 'join', handle: String(data.get('handle') || '').trim(), consent: data.get('consent') === 'on' }, 'Welcome to the club. First Carrier is in your locker, and your first day is checked in.');
  });
  composer.addEventListener('submit', event => {
    event.preventDefault();
    const body = message.value;
    const selected = postChannel.value;
    void mutate({ action: 'post', channel: selected, body }, 'Transmission sent. Your message is on the board.', () => {
      // Clear only after the server accepts it, and preserve a newer draft typed during the request.
      if (message.value === body) { message.value = ''; find('[data-character-count]').textContent = '0 / 1000'; }
      channel = selected;
    });
  });
  message.addEventListener('input', () => { find('[data-character-count]').textContent = `${message.value.length} / 1000`; });
  find('[data-checkin]').addEventListener('click', () => { void mutate({ action: 'checkin' }, 'You are checked in for today. Thanks for keeping the line warm.'); });
  all<HTMLButtonElement>('[data-channel]').forEach(button => button.addEventListener('click', () => { if (busy) return; channel = button.dataset.channel!; void refresh(); }));
  all('[data-refresh], [data-retry]').forEach(button => button.addEventListener('click', () => { void refresh(); }));
  find('[data-refresh-reports]').addEventListener('click', () => { void refreshReports(); });
  club.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.deletePost) void mutate({ action: 'delete', postId: button.dataset.deletePost }, 'Message removed from the board.');
    if (button.dataset.resolvePost) void mutate({ action: 'resolve', postId: button.dataset.resolvePost }, 'Reports resolved.');
    if (button.dataset.pauseHandle) void mutate({ action: 'suspend', handle: button.dataset.pauseHandle }, `${button.dataset.pauseHandle} has been paused.`);
  });
  stream.addEventListener('submit', event => {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>('form[data-report-form]');
    if (!form) return;
    event.preventDefault();
    const postId = form.dataset.reportForm!;
    void mutate({ action: 'report', postId, reason: new FormData(form).get('reason') }, 'Report received. The director can review it.', () => reported.add(postId));
  });
  find<HTMLFormElement>('[data-member-action]').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const handle = String(data.get('handle') || '').trim();
    const selected = String(data.get('action'));
    void mutate({ action: selected, handle }, selected === 'restore' ? `${handle} has been restored.` : `${handle} has been paused.`);
  });
  void refresh();
}
