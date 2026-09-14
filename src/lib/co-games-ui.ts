import { initial, legalHuman, legalPartner, simulate, choose, score, human, partner, observe, validateSupportResponse } from './co-games-engine.mjs';
import { CoGamesRuntimeClient, CoGamesRuntimeError, buildCoGamesPrompt, type RuntimeChoice } from './co-games-runtime.ts';

type HumanId = keyof typeof human;
type SupportId = keyof typeof partner;

export function mountCoGames(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const client = new CoGamesRuntimeClient();
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  let state = initial();
  let gameId = crypto.randomUUID();
  let selected: HumanId = 'ember';
  let support: SupportId | null = choose(state, selected);
  let history: string[] = [];
  let mode: 'practice' | 'native' = 'practice';
  let choices: RuntimeChoice[] = [];
  let choiceId = '';
  let notice = '';
  let reason = '';
  let actualModels: string[] = [];
  let busy = false;
  let cancelling = false;
  let loading = false;
  let epoch = 0;
  let loadEpoch = 0;
  let requestController: AbortController | null = null;
  let discoveryController: AbortController | null = null;
  let pending: { id: string; fingerprint: string; choice: RuntimeChoice } | null = null;
  let currentOwner: string | null = null;
  const choice = () => choices.find(item => item.id === choiceId);
  const retryMatches = () => Boolean(pending && state.status === 'playing' && pending.fingerprint === JSON.stringify([choiceId, observe(state, selected, gameId)]));
  const live = (version = epoch) => !lifetime.signal.aborted && root.isConnected && version === epoch;
  const partnerName = () => mode === 'practice' ? 'Practice partner' : choice()?.providerLabel || 'Your AI';

  function clearMove() {
    support = mode === 'practice' ? choose(state, selected) : null;
    reason = ''; actualModels = []; pending = null;
  }

  async function load() {
    if (mode !== 'native' || busy) return;
    const version = epoch, sequence = ++loadEpoch;
    discoveryController?.abort(); discoveryController = new AbortController();
    loading = true; notice = 'Checking your paired AI…'; render();
    try {
      const next = await client.discover(discoveryController.signal);
      if (!live(version) || sequence !== loadEpoch || mode !== 'native') return;
      choices = next;
      if (retryMatches() && pending && !choices.some(item => item.id === pending!.choice.id)) choices.push(pending.choice);
      if (!choices.some(item => item.id === choiceId)) { choiceId = choices[0]?.id || ''; clearMove(); }
      notice = choices.length ? 'Choose your spell, then ask your AI for a support move.' : 'No ready AI is online. Open My AI to pair or start your computer companion.';
    } catch (error) {
      if (!live(version) || sequence !== loadEpoch) return;
      if (!(retryMatches() && pending)) { choices = []; choiceId = ''; clearMove(); }
      notice = error instanceof Error ? error.message : 'Could not check your AI.';
    } finally {
      if (live(version) && sequence === loadEpoch) { loading = false; render(); }
    }
  }

  function render() {
    if (!live()) return;
    const active = state.status === 'playing';
    root.dataset.mode = mode;
    root.dataset.status = state.status;
    q('[data-round]').textContent = active ? `ROUND ${state.round + 1} / 4` : `FINISHED · ${state.round} ROUNDS`;
    q('[data-enemy]').textContent = String(state.enemy);
    q('[data-health]').textContent = `${state.hp} / 14`;
    q('[data-team-name]').textContent = `You + ${partnerName()}`;
    q('[data-partner-name]').textContent = partnerName();
    q('.cg-health').setAttribute('aria-valuenow', String(state.hp));
    q('.cg-health-fill').style.width = `${state.hp / 14 * 100}%`;
    root.querySelectorAll<HTMLElement>('[data-threat]').forEach(node => {
      node.dataset.now = String(active && Number(node.dataset.threat) === state.round);
      node.dataset.past = String(Number(node.dataset.threat) < state.round);
    });
    q('[data-play]').hidden = !active;
    q('[data-result]').hidden = active;
    q<HTMLSelectElement>('[data-mode]').disabled = busy;
    q('[data-native-controls]').hidden = mode !== 'native';
    q('[data-native-actions]').hidden = mode !== 'native';
    q('[data-runtime-status]').textContent = notice;
    const runtimeSelect = q<HTMLSelectElement>('[data-runtime]');
    const optionsKey = choices.map(item => `${item.id}:${item.label}:${item.busy}`).join('|');
    if (runtimeSelect.dataset.options !== optionsKey) {
      runtimeSelect.replaceChildren(...choices.map(item => {
        const option = doc.createElement('option'); option.value = item.id;
        option.textContent = `${item.providerLabel} · ${item.label}${item.busy ? ' · busy' : ''}`;
        return option;
      }));
      runtimeSelect.dataset.options = optionsKey;
    }
    runtimeSelect.value = choiceId; runtimeSelect.hidden = !choices.length; runtimeSelect.disabled = busy || loading;
    q<HTMLButtonElement>('[data-refresh]').disabled = busy || loading;
    q<HTMLButtonElement>('[data-request]').disabled = busy || loading || !choice() || (Boolean(choice()?.busy) && !retryMatches()) || !active;
    q('[data-request]').textContent = pending && !busy ? 'Retry the same support request' : 'Ask my AI for support';
    q('[data-request]').hidden = Boolean(support && mode === 'native');
    q('[data-cancel]').hidden = !busy;
    q<HTMLButtonElement>('[data-cancel]').disabled = cancelling;
    q('[data-turn-state]').textContent = busy ? 'Your AI’s turn · choosing support' : mode === 'native' && !support ? 'Your turn · ask for support' : 'Your turn · confirm the pair';
    if (active) {
      const legal = legalHuman(state);
      root.querySelectorAll<HTMLButtonElement>('[data-card]').forEach(button => {
        button.disabled = busy || !legal.includes(button.dataset.card as HumanId);
        button.setAttribute('aria-pressed', String(selected === button.dataset.card));
      });
      q('[data-uses="ember"]').textContent = `${state.ember} cast${state.ember === 1 ? '' : 's'} left`;
      q('[data-uses="focus"]').textContent = state.focus ? '1 cast left' : 'Used';
      q('[data-effect="ember"]').textContent = `Deal ${state.focused ? 8 : 4} damage.`;
      q('[data-effect="root"]').textContent = `Deal ${state.focused ? 4 : 2}. Block 3.`;
      q('[data-focus-status]').textContent = state.focused ? 'Focused · next damage ×2' : 'Choose one card';
      q('[data-stock]').textContent = `Support left: Echo ${state.echo} · Ward ${state.ward} · Mend ${state.mend}`;
      q('[data-another]').hidden = mode !== 'practice';
      q<HTMLButtonElement>('[data-another]').disabled = legalPartner(state).length < 2;
      const forecast = q('[data-forecast]'); forecast.replaceChildren(); forecast.hidden = !support;
      const f = support ? simulate(state, selected, support) : null;
      if (f && support) {
        const effect = support === 'echo' ? 'add 2 damage' : support === 'ward' ? 'block 3 damage' : `restore ${f.healing} health`;
        const comment = f.state.status === 'won' ? 'This pair closes the rift and keeps us standing.' : f.state.hp === 0 ? 'This pair would knock us out. Try another spell or support.' : score(f.state) >= 10000 ? 'We still have a path to close it in time.' : 'We can try it, but I can’t find a winning finish from this pair.';
        q('[data-partner]').textContent = mode === 'native' ? `${partner[support].name}: ${reason || `I’ll ${effect}.`} · ${actualModels.join(', ')}` : `I’ll cast ${partner[support].name} to ${effect}. ${comment}`;
        for (const text of [`Together: ${f.damage} damage`, `Block: ${Math.min(f.block, f.incoming)} / ${f.incoming}`, `Our health: ${state.hp} → ${f.state.hp}`, `Rift: ${state.enemy} → ${f.state.enemy}`]) {
          const span = doc.createElement('span'); span.textContent = text; forecast.append(span);
        }
        q('[data-cast]').textContent = `Cast ${human[selected].name} + ${partner[support].name} ↗`;
      } else {
        q('[data-partner]').textContent = busy ? 'Your AI has the board and your chosen spell. Waiting for its support move.' : 'Choose a spell, then ask your AI to complete the play.';
        q('[data-cast]').textContent = 'Waiting for a support move';
      }
      q<HTMLButtonElement>('[data-cast]').disabled = busy || !f;
      if (mode === 'native') q('[data-prompt-preview]').textContent = buildCoGamesPrompt(observe(state, selected, gameId));
    } else {
      const won = state.status === 'won';
      q('[data-result-title]').textContent = won ? 'You closed it. Together.' : state.hp === 0 ? 'The rift took you both.' : 'The rift is still open.';
      q('[data-result-copy]').textContent = won ? `Four rounds. Two roles. ${state.hp} health left. Your spells and your partner’s support made the difference.` : state.hp === 0 ? 'Try timing your protection for the larger attacks. The forecast shows whether both of you survive.' : 'You stayed standing, but ran out of rounds. Try adding more damage or setting up Focus early.';
    }
    q('[data-log]').hidden = history.length === 0;
    q('[data-count]').textContent = String(history.length);
    const log = q('[data-log-items]'); log.replaceChildren();
    for (const item of history) { const li = doc.createElement('li'); li.textContent = item; log.append(li); }
    q('[data-last]').textContent = history.at(-1) || 'Close the rift within four rounds and keep your team alive.';
  }

  const listener = { signal: lifetime.signal };
  root.querySelectorAll<HTMLButtonElement>('[data-card]').forEach(button => button.addEventListener('click', () => {
    if (busy || !legalHuman(state).includes(button.dataset.card as HumanId)) return;
    if (selected !== button.dataset.card) { selected = button.dataset.card as HumanId; clearMove(); }
    render();
  }, listener));
  q('[data-another]').addEventListener('click', () => {
    if (mode !== 'practice') return;
    const legal = legalPartner(state); if (!legal.length) return;
    support = legal[(legal.indexOf(support!) + 1) % legal.length]; render();
  }, listener);
  q('[data-cast]').addEventListener('click', () => {
    if (busy || !support) return;
    const f = simulate(state, selected, support); if (!f) return;
    history.push(`Round ${state.round + 1} · You: ${human[selected].name}. ${partnerName()}${actualModels.length ? ` (${actualModels.join(', ')})` : ''}: ${partner[support].name}. Dealt ${f.damage}, took ${f.taken}${f.healing ? `, healed ${f.healing}` : ''}. Health ${f.state.hp} / 14.`);
    state = f.state;
    if (state.status === 'playing' && !legalHuman(state).includes(selected)) selected = legalHuman(state)[0];
    clearMove(); render();
    if (state.status !== 'playing') q('[data-replay]').focus();
  }, listener);
  q('[data-replay]').addEventListener('click', () => {
    ++epoch; ++loadEpoch; discoveryController?.abort(); loading = false;
    state = initial(); gameId = crypto.randomUUID(); history = []; selected = 'ember'; clearMove(); render(); q('[data-card="ember"]').focus();
    if (mode === 'native') void load();
  }, listener);
  q<HTMLSelectElement>('[data-mode]').addEventListener('change', () => {
    if (busy) return;
    ++epoch; ++loadEpoch; discoveryController?.abort(); loading = false;
    mode = q<HTMLSelectElement>('[data-mode]').value === 'native' ? 'native' : 'practice';
    notice = ''; clearMove(); render(); if (mode === 'native') void load();
  }, listener);
  q<HTMLSelectElement>('[data-runtime]').addEventListener('change', () => { choiceId = q<HTMLSelectElement>('[data-runtime]').value; clearMove(); render(); }, listener);
  q('[data-refresh]').addEventListener('click', () => void load(), listener);
  q('[data-request]').addEventListener('click', async () => {
    const target = choice(); if (busy || !target || (target.busy && !retryMatches()) || state.status !== 'playing') return;
    const observation = observe(state, selected, gameId);
    const fingerprint = JSON.stringify([target.id, observation]);
    if (!pending || pending.fingerprint !== fingerprint) pending = { id: crypto.randomUUID(), fingerprint, choice: target };
    const requestId = pending.id, version = ++epoch;
    requestController = new AbortController(); busy = true; support = null; reason = ''; actualModels = []; notice = 'Sending this round to your AI…'; render();
    try {
      const result = await client.requestSupport(target, observation, {
        requestId, signal: requestController.signal,
        onProgress: progress => { if (live(version)) { notice = progress.status === 'running' ? 'Your AI is choosing a support card…' : 'Request queued. Waiting for your computer companion…'; render(); } },
      });
      if (!live(version) || mode !== 'native' || choice()?.id !== target.id) return;
      const checked = validateSupportResponse(observe(state, selected, gameId), result.response);
      if (!checked.ok) throw new Error(`Your AI’s move was not applied: ${checked.reason}`);
      support = checked.support; reason = typeof result.response.reason === 'string' ? result.response.reason : '';
      actualModels = result.actualModels; pending = null; notice = `Support received from ${actualModels.join(', ')}. Review the pair before casting.`;
    } catch (error) {
      if (!live(version)) return;
      notice = error instanceof Error ? error.message : 'Your AI did not return a usable move.';
      support = null; actualModels = [];
      const uncertain = error instanceof CoGamesRuntimeError && ['network-error', 'request-timeout', 'support-request-timeout', 'job-missing', 'invalid-response', 'aborted'].includes(error.reason);
      if (!uncertain) pending = null;
      if (error instanceof CoGamesRuntimeError && error.reason === 'unauthorized') { choices = []; choiceId = ''; }
    } finally { if (live(version)) { busy = false; requestController = null; render(); } }
  }, listener);
  q('[data-cancel]').addEventListener('click', async () => {
    if (!busy || !pending || cancelling) return;
    const requestId = pending.id, version = ++epoch;
    requestController?.abort(); requestController = null;
    cancelling = true;
    notice = 'Cancelling the support request…'; render();
    try { await client.cancel(requestId); if (live(version)) notice = 'Cancellation requested. This move will not be used; check My AI for the task’s final status.'; }
    catch { if (live(version)) notice = 'Stopped waiting. Cancellation is unconfirmed; check My AI before starting another request.'; }
    finally { if (live(version)) { busy = false; cancelling = false; pending = null; support = null; render(); } }
  }, listener);
  function authChanged(event: Event) {
    const detail = (event as CustomEvent<{user?: {userId?: string} | null; source?: string}>).detail;
    const owner = detail?.user?.userId || null;
    if (event.type === 'pc:auth-change' && detail?.source === 'tezos-session-bridge' && owner && owner === currentOwner) return;
    currentOwner = owner; ++epoch; ++loadEpoch; requestController?.abort(); discoveryController?.abort();
    choices = []; choiceId = ''; busy = false; cancelling = false; loading = false; clearMove();
    notice = 'Your sign-in changed. Check your AI connection again.'; render();
  }
  win.addEventListener('pc:auth-change', authChanged, listener);
  win.addEventListener('pc:auth-refresh', authChanged, listener);
  render();
  return () => {
    ++epoch; ++loadEpoch;
    if (pending) void client.cancel(pending.id).catch(() => {});
    requestController?.abort(); discoveryController?.abort(); lifetime.abort();
    choices = []; actualModels = []; reason = ''; pending = null;
  };
}
