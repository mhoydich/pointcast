import { initial, legalHuman, legalPartner, simulate, choose, score, human, partner, encounters, encounterFor, currentIntent, combos, observe, validateSupportResponse } from './co-games-engine.mjs';
import { coGameWorlds, type CoGameWorldId } from './co-games-worlds.ts';
import { CoGamesRuntimeClient, CoGamesRuntimeError, buildCoGamesPrompt, type RuntimeChoice } from './co-games-runtime.ts';

import type { EncounterId, GameState, Forecast, ComboId } from './co-games-engine.mjs';

type HumanId = keyof typeof human;
type SupportId = keyof typeof partner;
type NativeMove = { support: SupportId; reason: string; models: string[] };

export function mountCoGames(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const lifetime = new win.AbortController();
  const client = new CoGamesRuntimeClient();
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const optionalText = (selector: string, value: string) => { const node = root.querySelector(selector); if (node) node.textContent = value; };
  let state: GameState = initial('garden');
  let wins = 0;
  let matchNumber = 1;
  let lastCombo = '';
  const battleOrder = (Object.keys(encounters) as EncounterId[]).filter(id => id !== 'classic');
  const encounterTips: Record<EncounterId, string> = {
    classic: 'Four turns. Make every card count.',
    garden: 'A gentle start. Match cards for bonus effects.',
    rush: 'The first hit is heavy. Protect early.',
    shell: 'Armor fades after two turns. Set up your big hit.',
    storm: 'Quiet turns, heavy hits. Time your protection.',
  };
  let gameId = crypto.randomUUID();
  let selected: HumanId = 'ember';
  let support: SupportId | null = choose(state, selected);
  let history: string[] = [];
  let outcome = '';
  let mode: 'practice' | 'native' = 'practice';
  let choices: RuntimeChoice[] = [];
  let choiceId = '';
  let notice = '';
  let lastNativeMove: NativeMove | null = null;
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

  function clearMove(clearAttribution = true) {
    if (clearAttribution && lastNativeMove) notice = '';
    support = mode === 'practice' ? choose(state, selected) : null;
    if (clearAttribution) lastNativeMove = null;
    pending = null;
  }

  function recommendedHuman(): HumanId | null {
    let best: HumanId | null = null, bestScore = -Infinity;
    for (const candidate of legalHuman(state)) {
      const companion = choose(state, candidate);
      const forecast = companion ? simulate(state, candidate, companion) : null;
      if (forecast && score(forecast.state) > bestScore) { best = candidate; bestScore = score(forecast.state); }
    }
    return best;
  }

  async function load() {
    if (mode !== 'native' || busy) return;
    const version = epoch, sequence = ++loadEpoch;
    discoveryController?.abort(); discoveryController = new AbortController();
    loading = true; notice = 'Finding your AI…'; render();
    try {
      const next = await client.discover(discoveryController.signal);
      if (!live(version) || sequence !== loadEpoch || mode !== 'native') return;
      choices = next;
      if (retryMatches() && pending && !choices.some(item => item.id === pending!.choice.id)) choices.push(pending.choice);
      if (!choices.some(item => item.id === choiceId)) { choiceId = choices[0]?.id || ''; clearMove(); }
      notice = choices.length ? 'Choose a card. Play a turn together.' : 'Your AI is offline. Open My AI to connect it.';
    } catch (error) {
      if (!live(version) || sequence !== loadEpoch) return;
      if (!(retryMatches() && pending)) { choices = []; choiceId = ''; clearMove(); }
      notice = error instanceof Error ? error.message : 'Could not find your AI.';
    } finally {
      if (live(version) && sequence === loadEpoch) { loading = false; render(); }
    }
  }

  function render() {
    if (!live()) return;
    const active = state.status === 'playing';
    const encounter = encounterFor(state)!;
    const intent = currentIntent(state);
    root.dataset.mode = mode;
    root.dataset.status = state.status;
    root.dataset.encounter = encounter.id;
    root.dataset.busy = String(busy);
    q('[data-round]').textContent = active ? `ROUND ${state.round + 1} / 4` : `FINISHED · ${state.round} ROUNDS`;
    q('[data-enemy]').textContent = String(state.enemy);
    optionalText('[data-enemy-max]', String(encounter.enemy));
    optionalText('[data-wins]', String(wins));
    optionalText('[data-match-number]', String(matchNumber));
    optionalText('[data-encounter-name]', encounter.name);
    optionalText('[data-encounter-tip]', encounterTips[encounter.id]);
    optionalText('[data-current-armor]', String(intent?.armor ?? 0));
    optionalText('[data-battle-intent]', intent ? `Incoming ${intent.attack}${intent.armor ? ` · Armor ${intent.armor}` : ''}` : 'Battle complete');
    optionalText('[data-combo-preview]', (mode === 'native' && lastNativeMove) || !active ? lastCombo : '');
    q('[data-health]').textContent = `${state.hp} / 14`;
    q('[data-team-name]').textContent = `You + ${partnerName()}`;
    q('[data-partner-name]').textContent = partnerName();
    optionalText('[data-actual-model]', mode === 'native' && lastNativeMove ? lastNativeMove.models.join(', ') : '');
    q('.cg-health').setAttribute('aria-valuenow', String(state.hp));
    q('.cg-health-fill').style.width = `${state.hp / 14 * 100}%`;
    optionalText('[data-current-threat]', String(intent?.attack ?? 0));
    optionalText('[data-outcome]', outcome || coGameWorlds[encounter.id as CoGameWorldId]?.arrival || 'Beat the rival crew. Keep your team alive.');
    optionalText('[data-quick-tip]', !active ? 'Play again to try a different path.' : busy ? 'Your AI is choosing its card.'
      : state.focused ? 'Charged up: your next attack does double damage.' : 'Pick a card. Your partner adds support.');
    root.querySelectorAll<HTMLElement>('[data-threat]').forEach(node => {
      node.dataset.now = String(active && Number(node.dataset.threat) === state.round);
      node.dataset.past = String(Number(node.dataset.threat) < state.round);
      const attack = encounter.threats[Number(node.dataset.threat)];
      if (attack !== undefined) node.textContent = String(attack);
    });
    q('[data-play]').hidden = !active;
    q('[data-result]').hidden = active;
    q<HTMLSelectElement>('[data-mode]').disabled = busy;
    q('[data-native-controls]').hidden = mode !== 'native';
    q('[data-native-actions]').hidden = mode !== 'native';
    q('[data-runtime-status]').textContent = notice;
    q('[data-runtime-status]').hidden = mode !== 'native';
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
    q('[data-request]').textContent = busy ? 'Your AI is playing…' : pending ? 'Retry this turn' : 'Play with AI';
    q('[data-request]').hidden = mode !== 'native' || !active;
    q('[data-cast]').hidden = mode !== 'practice' || !active;
    q('[data-cancel]').hidden = !busy;
    q<HTMLButtonElement>('[data-cancel]').disabled = cancelling;
    q('[data-turn-state]').textContent = !active ? 'Match complete' : busy ? 'Your AI is choosing…' : 'Pick a card · play a turn';
    const hint = root.querySelector<HTMLButtonElement>('[data-hint]');
    if (hint) hint.disabled = busy || !active;
    const freshBattle = root.querySelector<HTMLButtonElement>('[data-new-battle]');
    if (freshBattle) freshBattle.disabled = busy;
    q<HTMLButtonElement>('[data-replay]').disabled = busy;
    q('[data-replay]').textContent = state.status === 'won' ? 'Next battle →' : 'Try again ↻';
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
      q('[data-focus-status]').textContent = state.focused ? 'Next attack ×2' : 'Choose one card';
      q('[data-stock]').textContent = `Echo ${state.echo} · Ward ${state.ward} · Mend ${state.mend}`;
      q('[data-another]').hidden = mode !== 'practice';
      q<HTMLButtonElement>('[data-another]').disabled = busy || legalPartner(state).length < 2;
      const forecast = q('[data-forecast]'); forecast.replaceChildren(); forecast.hidden = mode === 'native' || !support;
      const f = mode === 'practice' && support ? simulate(state, selected, support) : null;
      if (f && support) {
        const effect = support === 'echo' ? '+2 damage' : support === 'ward' ? 'block 3' : `heal ${f.healing}`;
        q('[data-partner]').textContent = `I’ll play ${partner[support].name}: ${effect}.`;
        optionalText('[data-partner-choice]', partner[support].name);
        optionalText('[data-combo-preview]', comboSummary(f, selected, support));
        for (const text of [`Damage ${f.damage}`, `Block ${Math.min(f.block, f.incoming)}`, `Health ${state.hp} → ${f.state.hp}`, `Rivals ${state.enemy} → ${f.state.enemy}`, ...(f.armor ? [`Armor absorbs ${f.armor}`] : [])]) {
          const span = doc.createElement('span'); span.textContent = text; forecast.append(span);
        }
      }
      q('[data-cast]').textContent = 'Play turn';
      q<HTMLButtonElement>('[data-cast]').disabled = busy || !f || mode !== 'practice';
      if (mode === 'native') q('[data-prompt-preview]').textContent = buildCoGamesPrompt(observe(state, selected, gameId));
    } else {
      root.querySelectorAll<HTMLButtonElement>('[data-card]').forEach(button => { button.disabled = true; });
      q<HTMLButtonElement>('[data-cast]').disabled = true;
      const won = state.status === 'won';
      q('[data-result-title]').textContent = won ? 'You did it. Together.' : 'One more try?';
      q('[data-result-copy]').textContent = won ? `${coGameWorlds[encounter.id as CoGameWorldId]?.victory || encounter.name + ' beaten.'} ${state.hp} health left.` : state.hp === 0 ? 'Your team ran out of health. Try more protection.' : 'The rival crew survived. Try a little more damage.';
    }
    if (mode === 'native') {
      q('[data-partner]').textContent = busy ? cancelling ? 'Stopping this turn…' : 'Choosing my card…' : lastNativeMove
        ? `${partner[lastNativeMove.support].name}: ${lastNativeMove.reason || 'Played together.'} · ${lastNativeMove.models.join(', ')}`
        : loading ? 'Finding your AI…' : retryMatches() ? 'Check this turn before starting another.'
          : !choice() ? 'Connect your AI to play together.' : choice()?.busy ? 'Your AI is finishing another task.'
            : 'Choose your card. I’ll add support when you play.';
      optionalText('[data-partner-choice]', busy ? cancelling ? 'Stopping…' : 'Choosing…' : loading ? 'Checking…'
        : lastNativeMove ? partner[lastNativeMove.support].name : retryMatches() ? 'Check turn'
          : !choice() ? 'Offline' : choice()?.busy ? 'Busy' : 'Ready');
    } else if (!active) {
      q('[data-partner]').textContent = state.status === 'won' ? 'We did it. Nice teamwork.' : 'We can try another path.';
      optionalText('[data-partner-choice]', 'Ready');
    }
    q('[data-log]').hidden = history.length === 0;
    q('[data-count]').textContent = String(history.length);
    const log = q('[data-log-items]'); log.replaceChildren();
    for (const item of history) { const li = doc.createElement('li'); li.textContent = item; log.append(li); }
    q('[data-last]').textContent = history.at(-1) || `Beat ${encounter.name} within four turns and keep your team alive.`;
  }

  function comboSummary(forecast: Forecast, humanId: HumanId, supportId: SupportId): string {
    if (!forecast.combo) return '';
    const bonus = combos[`${humanId}:${supportId}` as ComboId];
    return `${forecast.combo.name} · ${bonus.bonusDamage ? `+${bonus.bonusDamage} damage` : `+${bonus.bonusHealing} healing`}`;
  }

  function nextEncounter(): EncounterId {
    const current = encounterFor(state)!.id;
    return battleOrder[(battleOrder.indexOf(current) + 1) % battleOrder.length];
  }

  root.addEventListener('click', event => {
    const target = event.target instanceof win.Element ? event.target.closest<HTMLButtonElement>('[data-visit-encounter]') : null;
    if (!target || busy) return;
    const id = target.dataset.visitEncounter as CoGameWorldId;
    if (!Object.hasOwn(coGameWorlds, id)) return;
    root.querySelector<HTMLDialogElement>('#cg-worlds')?.close();
    void startBattle(id, false);
  }, { signal: lifetime.signal });

  async function startBattle(encounterId: EncounterId, retry: boolean) {
    if (busy) return;
    const version = ++epoch; ++loadEpoch;
    discoveryController?.abort(); requestController?.abort(); loading = false;
    const oldRequest = pending?.id;
    let warning = '';
    if (oldRequest) {
      busy = true; cancelling = true; notice = 'Closing the previous AI turn…'; render();
      try { await client.cancel(oldRequest); }
      catch { warning = 'Previous AI task may still be running. Check My AI before requesting another turn.'; }
      if (!live(version)) return;
      busy = false; cancelling = false;
    }
    state = initial(encounterId); gameId = crypto.randomUUID(); matchNumber++;
    history = []; outcome = ''; lastCombo = ''; selected = 'ember'; clearMove();
    notice = mode === 'native' ? warning : ''; render();
    root.dispatchEvent(new win.CustomEvent('co-games:match', { bubbles: true, detail: Object.freeze({ encounter: encounterId, matchNumber, retry }) }));
    q('[data-card="ember"]').focus();
    if (mode === 'native') {
      await load();
      if (warning && live(version)) { notice = warning; render(); }
    }
  }

  function playTurn(supportId: SupportId): boolean {
    const f = simulate(state, selected, supportId); if (!f) return false;
    const playedHuman = selected;
    const native = mode === 'native' ? lastNativeMove : null;
    const model = native?.models.join(', ') || null;
    const reason = native?.reason || '';
    lastCombo = comboSummary(f, playedHuman, supportId);
    history.push(`Round ${state.round + 1} · You: ${human[playedHuman].name}. ${partnerName()}${model ? ` (${model})` : ''}: ${partner[supportId].name}. Dealt ${f.damage}, took ${f.taken}${f.healing ? `, healed ${f.healing}` : ''}. Health ${f.state.hp} / 14.${lastCombo ? ` ${lastCombo}.` : ''}${f.armor ? ` Armor absorbed ${f.armor}.` : ''}`);
    state = f.state;
    if (state.status === 'won') wins++;
    outcome = state.status === 'won' ? `Rivals beaten! ${state.hp} health left.` : state.status === 'lost' ? state.hp === 0 ? 'Your team ran out of health.' : 'Out of turns. The rival crew is still standing.'
      : `${f.damage} damage · ${f.taken} taken${f.healing ? ` · ${f.healing} healed` : ''}`;
    if (lastCombo) outcome += ` · ${lastCombo}`;
    if (state.status === 'playing' && !legalHuman(state).includes(selected)) selected = legalHuman(state)[0];
    clearMove(false);
    notice = mode === 'native' ? (state.status === 'playing' ? 'Turn played. Choose your next card.' : 'Match complete.') : '';
    render();
    root.dispatchEvent(new win.CustomEvent('co-games:turn', { bubbles: true, detail: Object.freeze({
      human: playedHuman, support: supportId, damage: f.damage, taken: f.taken, healing: f.healing,
      hp: state.hp, enemy: state.enemy, round: state.round, status: state.status, model, reason, combo: f.combo, armor: f.armor,
    }) }));
    if (state.status !== 'playing' && !busy) q('[data-replay]').focus();
    return true;
  }

  const listener = { signal: lifetime.signal };
  root.querySelectorAll<HTMLButtonElement>('[data-card]').forEach(button => button.addEventListener('click', () => {
    if (busy || !legalHuman(state).includes(button.dataset.card as HumanId)) return;
    if (selected !== button.dataset.card) { selected = button.dataset.card as HumanId; clearMove(false); }
    render();
  }, listener));
  root.querySelector('[data-hint]')?.addEventListener('click', () => {
    if (busy || state.status !== 'playing') return;
    const recommended = recommendedHuman(); if (!recommended) return;
    selected = recommended; clearMove(false); render();
    optionalText('[data-quick-tip]', `${human[selected].name} selected. This keeps our best path open.`);
  }, listener);
  q('[data-another]').addEventListener('click', () => {
    if (busy || mode !== 'practice') return;
    const legal = legalPartner(state); if (!legal.length) return;
    support = legal[(legal.indexOf(support!) + 1) % legal.length]; render();
  }, listener);
  q('[data-cast]').addEventListener('click', () => {
    if (busy || mode !== 'practice' || !support) return;
    playTurn(support);
  }, listener);
  q('[data-replay]').addEventListener('click', () => {
    if (busy || state.status === 'playing') return;
    const retry = state.status === 'lost';
    void startBattle(retry ? encounterFor(state)!.id : nextEncounter(), retry);
  }, listener);
  root.querySelector('[data-new-battle]')?.addEventListener('click', () => { if (!busy) void startBattle(nextEncounter(), false); }, listener);
  q<HTMLSelectElement>('[data-mode]').addEventListener('change', () => {
    if (busy) return;
    ++epoch; ++loadEpoch; discoveryController?.abort(); loading = false;
    mode = q<HTMLSelectElement>('[data-mode]').value === 'native' ? 'native' : 'practice';
    notice = ''; clearMove(); render(); if (mode === 'native') void load();
  }, listener);
  q<HTMLSelectElement>('[data-runtime]').addEventListener('change', () => {
    if (busy) return;
    choiceId = q<HTMLSelectElement>('[data-runtime]').value; clearMove(); render();
  }, listener);
  q('[data-refresh]').addEventListener('click', () => void load(), listener);
  q('[data-request]').addEventListener('click', async () => {
    const target = choice(); if (busy || loading || mode !== 'native' || !target || (target.busy && !retryMatches()) || state.status !== 'playing') return;
    const observation = observe(state, selected, gameId);
    const fingerprint = JSON.stringify([target.id, observation]);
    if (!pending || pending.fingerprint !== fingerprint) pending = { id: crypto.randomUUID(), fingerprint, choice: target };
    const requestId = pending.id, version = ++epoch;
    requestController = new AbortController(); busy = true; support = null; lastNativeMove = null; notice = 'Playing this turn with your AI…'; render();
    try {
      const result = await client.requestSupport(target, observation, {
        requestId, signal: requestController.signal,
        onProgress: progress => { if (live(version)) { notice = progress.status === 'running' ? 'Your AI is choosing its card…' : 'Waiting for your AI…'; render(); } },
      });
      if (!live(version) || mode !== 'native' || choice()?.id !== target.id) return;
      const checked = validateSupportResponse(observe(state, selected, gameId), result.response);
      if (checked.ok === false) throw new Error(`Your AI’s move was not applied: ${checked.reason}`);
      lastNativeMove = { support: checked.support, reason: typeof result.response.reason === 'string' ? result.response.reason : '', models: [...result.actualModels] };
      if (!playTurn(checked.support)) throw new Error('This turn could not be played. Choose a card and try again.');
    } catch (error) {
      if (!live(version)) return;
      notice = error instanceof Error ? error.message : 'Your AI did not return a usable move.';
      support = null; lastNativeMove = null;
      const uncertain = error instanceof CoGamesRuntimeError && ['network-error', 'request-timeout', 'support-request-timeout', 'job-missing', 'invalid-response', 'aborted'].includes(error.reason);
      if (!uncertain) pending = null;
      if (error instanceof CoGamesRuntimeError && error.reason === 'unauthorized') { choices = []; choiceId = ''; }
      else if (error instanceof CoGamesRuntimeError && ['runtime-offline', 'runtime-not-found', 'provider-unavailable', 'provider-not-ready', 'subscription-required'].includes(error.reason)) {
        choices = choices.filter(item => item.id !== target.id); choiceId = '';
      }
    } finally {
      if (live(version)) {
        busy = false; requestController = null; render();
        if (state.status !== 'playing') q('[data-replay]').focus();
      }
    }
  }, listener);
  q('[data-cancel]').addEventListener('click', async () => {
    if (!busy || !pending || cancelling) return;
    const requestId = pending.id, version = ++epoch;
    requestController?.abort(); requestController = null;
    cancelling = true;
    notice = 'Cancelling this turn…'; render();
    try { await client.cancel(requestId); if (live(version)) notice = 'Turn cancelled here. Check My AI for the task’s final status.'; }
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
    choices = []; lastNativeMove = null; pending = null;
  };
}
