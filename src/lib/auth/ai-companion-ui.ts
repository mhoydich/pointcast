const ENDPOINT = '/api/me/ai-companions';
const LABELS: Record<string, string> = { claude: 'Claude', chatgpt: 'ChatGPT', codex: 'Codex', 'claude-code': 'Claude Code', other: 'Another AI' };
type Receipt = { invitationId: string; provider: string; status: string; confirmedAt: string | null };

export function mountAiCompanion(root: HTMLElement): () => void {
  const form = root.querySelector<HTMLFormElement>('[data-ai-form]')!;
  const create = root.querySelector<HTMLButtonElement>('[data-ai-create]')!;
  const status = root.querySelector<HTMLOutputElement>('[data-ai-status]')!;
  const invitation = root.querySelector<HTMLElement>('[data-ai-invitation]')!;
  const prompt = root.querySelector<HTMLTextAreaElement>('[data-ai-prompt]')!;
  const list = root.querySelector<HTMLUListElement>('[data-ai-list]')!;
  const copy = root.querySelector<HTMLButtonElement>('[data-ai-copy]')!;
  const refresh = root.querySelector<HTMLButtonElement>('[data-ai-refresh]')!;
  const controller = new AbortController();
  let generation = 0;
  let operation = 0;
  let busy = false;
  let available = false;
  let issuedFor = '';
  let invitationId = '';
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  const live = (version: number) => !controller.signal.aborted && version === generation;
  function clearInvitation() {
    invitation.hidden = true;
    prompt.value = '';
    issuedFor = '';
    invitationId = '';
    clearTimeout(expiryTimer);
  }
  async function request(method = 'GET', body?: unknown) {
    const response = await fetch(ENDPOINT, {
      method, credentials: 'include', cache: 'no-store', signal: controller.signal,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(response.status === 401 ? 'Sign in to confirm a private AI visit.' : 'AI visit confirmation is unavailable. You can still use the public connector.');
    return data;
  }
  function setBusy(value: boolean) {
    busy = value; create.disabled = value || !available; refresh.disabled = value;
    root.querySelectorAll<HTMLButtonElement>('[data-ai-remove]').forEach((button) => { button.disabled = value; });
  }
  async function load() {
    const version = ++generation;
    try {
      const data = await request();
      if (!live(version)) return false;
      available = true; setBusy(busy);
      list.replaceChildren();
      if (issuedFor && !data.companions.some((receipt: Receipt) => receipt.provider === issuedFor && receipt.status === 'waiting' && receipt.invitationId === invitationId)) clearInvitation();
      for (const receipt of data.companions as Receipt[]) {
        if (receipt.provider === issuedFor && receipt.status !== 'waiting') clearInvitation();
        const li = document.createElement('li');
        const label = document.createElement('span');
        const detail = receipt.status === 'visit-confirmed'
          ? 'Visit confirmed ' + new Date(receipt.confirmedAt!).toLocaleString()
          : receipt.status === 'waiting' ? 'Waiting for your AI to check in' : 'Invitation expired — create another';
        label.textContent = (LABELS[receipt.provider] || 'AI') + ' · ' + detail;
        const remove = document.createElement('button');
        remove.type = 'button'; remove.textContent = 'Remove'; remove.dataset.aiRemove = receipt.provider;
        remove.disabled = busy;
        li.append(label, remove); list.append(li);
      }
      status.textContent = data.companions.length ? 'These receipts are visible only in your PointCast account.' : 'No AI visits confirmed yet. Choose your AI to make an invitation.';
      return true;
    } catch (error) {
      if (!live(version)) return false;
      available = false; setBusy(busy); list.replaceChildren(); clearInvitation();
      status.textContent = error instanceof Error ? error.message : 'Unable to load AI visits.';
      return false;
    }
  }
  async function submit(event: Event) {
    event.preventDefault();
    if (busy || !available) return;
    const currentOperation = ++operation;
    const provider = (form.elements.namedItem('provider') as HTMLSelectElement).value;
    const approach = (form.elements.namedItem('approach') as HTMLSelectElement).value;
    const gentle = (form.elements.namedItem('gentle') as HTMLInputElement).checked;
    setBusy(true); clearInvitation(); status.textContent = 'Creating your private invitation…';
    try {
      const data = await request('POST', { provider, approach, gentle });
      if (controller.signal.aborted || currentOperation !== operation) return;
      const loaded = await load();
      if (!loaded || controller.signal.aborted || currentOperation !== operation) return;
      issuedFor = provider;
      invitationId = data.invitationId;
      prompt.value = 'I want to confirm this visit on my private PointCast profile. Use the PointCast MCP tool pointcast_pair with code "' + data.code + '" once. Keep the code private. This only records a visit and grants no account access. Then use town_map or blocks_recent and suggest one place for us to explore together.';
      invitation.hidden = false; copy.textContent = 'Copy invitation';
      root.querySelector<HTMLElement>('[data-ai-expiry]')!.textContent = 'One use. Expires at ' + new Date(data.expiresAt).toLocaleTimeString() + '.';
      expiryTimer = setTimeout(() => { clearInvitation(); void load(); }, Math.max(0, Date.parse(data.expiresAt) - Date.now()));
      status.textContent = 'Paste the invitation into the AI app where you added PointCast, then check for a confirmed visit.';
    } catch (error) {
      if (!controller.signal.aborted && currentOperation === operation) status.textContent = error instanceof Error ? error.message : 'Unable to create invitation.';
    } finally { if (!controller.signal.aborted && currentOperation === operation) setBusy(false); }
  }
  async function remove(event: Event) {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-ai-remove]');
    if (!button || busy) return;
    const currentOperation = ++operation;
    setBusy(true);
    try {
      await request('DELETE', { provider: button.dataset.aiRemove });
      if (controller.signal.aborted || currentOperation !== operation) return;
      if (issuedFor === button.dataset.aiRemove) clearInvitation();
      await load();
    } catch (error) {
      if (!controller.signal.aborted && currentOperation === operation) status.textContent = error instanceof Error ? error.message : 'Unable to remove receipt.';
    } finally { if (!controller.signal.aborted && currentOperation === operation) setBusy(false); }
  }
  async function copyInvitation() {
    const version = operation;
    try { await navigator.clipboard.writeText(prompt.value); if (version === operation && !controller.signal.aborted) copy.textContent = 'Copied'; }
    catch { if (version !== operation || controller.signal.aborted) return; prompt.focus(); prompt.select(); copy.textContent = navigator.platform.includes('Mac') ? 'Press ⌘C' : 'Press Ctrl+C'; }
  }
  function authChanged() {
    ++operation; ++generation; clearInvitation(); list.replaceChildren(); available = false; setBusy(false);
    void load();
  }
  form.addEventListener('submit', submit, { signal: controller.signal });
  list.addEventListener('click', remove, { signal: controller.signal });
  copy.addEventListener('click', copyInvitation, { signal: controller.signal });
  refresh.addEventListener('click', () => void load(), { signal: controller.signal });
  window.addEventListener('pc:auth-change', authChanged, { signal: controller.signal });
  window.addEventListener('pc:auth-refresh', authChanged, { signal: controller.signal });
  void load();
  return () => { ++operation; ++generation; clearInvitation(); controller.abort(); };
}
