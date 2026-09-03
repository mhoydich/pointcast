// @ts-nocheck
import {
    clearDockActivity,
    formatDockAge,
    readDockActivity,
    readDockRecents,
    recordDockOpen,
    recordDockVisit,
  } from '../../lib/dock-state';
  import {
    PET_CARE_KEY,
    PET_SELECTED_KEY,
    PET_STAMPS_KEY,
    readPetSnapshot,
    syncPetCareActivity,
  } from '../../lib/pet-state';
  import { initMeState } from '../../lib/me-state';

  export function mountDockLauncher(root, scope) {
    const { on } = scope;
    initMeState();
    if (!root || root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';

    const tabButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dock-tab]'));
    const views = Array.from(root.querySelectorAll<HTMLElement>('[data-dock-view]'));

    function selectView(viewName: string, focus = false) {
      tabButtons.forEach((button) => {
        const active = button.dataset.dockTab === viewName;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        if (active && focus) button.focus();
      });
      views.forEach((view) => {
        view.hidden = view.dataset.dockView !== viewName;
      });
      if (viewName === 'activity') renderActivity();
      if (viewName === 'home') renderRecents();
    }

    tabButtons.forEach((button, index) => {
      on(button, 'click', () => selectView(button.dataset.dockTab || 'home'));
      on(button, 'keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const next = tabButtons[(index + delta + tabButtons.length) % tabButtons.length];
        selectView(next.dataset.dockTab || 'home', true);
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-dock-tab-jump]').forEach((button) => {
      on(button, 'click', () => selectView(button.dataset.dockTabJump || 'home'));
    });

    function createRecentRow(path: string, title: string, age: string): HTMLLIElement {
      const li = document.createElement('li');
      const link = document.createElement('a');
      const body = document.createElement('span');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      const time = document.createElement('time');
      link.href = path;
      link.dataset.dockTrack = '';
      link.dataset.dockTitle = title;
      strong.textContent = title;
      small.textContent = path;
      time.textContent = age;
      body.append(strong, small);
      link.append(body, time);
      li.append(link);
      return li;
    }

    function renderRecents() {
      const list = root.querySelector<HTMLOListElement>('[data-dock-recents]');
      if (!list) return;
      const recents = readDockRecents()
        .filter((item) => item.path !== `${window.location.pathname}${window.location.search}`)
        .slice(0, 4);
      list.replaceChildren();
      if (!recents.length) {
        const fallback = [
          { path: '/win95-games', title: 'Retro Arcade' },
          { path: '/app', title: 'PointCast Shell' },
          { path: '/rooms', title: 'Rooms' },
        ];
        fallback.forEach((item) => list.append(createRecentRow(item.path, item.title, 'start')));
        return;
      }
      recents.forEach((item) => list.append(createRecentRow(item.path, item.title, formatDockAge(item.visitedAt))));
    }

    function renderActivity() {
      const list = root.querySelector<HTMLOListElement>('[data-dock-activity]');
      if (!list) return;
      const activity = readDockActivity().slice(0, 12);
      list.replaceChildren();
      if (!activity.length) {
        const empty = document.createElement('li');
        empty.className = 'dock-empty';
        empty.textContent = 'Activity starts as you open apps and save places.';
        list.append(empty);
        return;
      }
      activity.forEach((item) => {
        const li = document.createElement('li');
        const marker = document.createElement('span');
        const body = document.createElement(item.path ? 'a' : 'span');
        const time = document.createElement('time');
        marker.className = 'dock-activity__marker';
        marker.dataset.type = item.type;
        body.textContent = item.label;
        if (item.path && body instanceof HTMLAnchorElement) body.href = item.path;
        time.textContent = formatDockAge(item.at);
        li.append(marker, body, time);
        list.append(li);
      });
    }

    function renderPet() {
      const companion = root.querySelector<HTMLElement>('[data-dock-companion]');
      if (!companion) return;
      const pet = readPetSnapshot();
      const image = companion.querySelector<HTMLImageElement>('[data-dock-pet-image]');
      const name = companion.querySelector<HTMLElement>('[data-dock-pet-name]');
      const summary = companion.querySelector<HTMLElement>('[data-dock-pet-summary]');
      companion.style.setProperty('--dock-pet-accent', pet.accent);
      if (image) image.src = `https://noun.pics/${pet.nounId}.svg`;
      if (name) name.textContent = pet.name;
      if (summary) {
        const care = pet.careCount ? `${pet.careCount} care${pet.careCount === 1 ? '' : 's'}` : 'no care yet';
        summary.textContent = `${pet.state} · ${care}`;
      }
    }

    const search = root.querySelector<HTMLInputElement>('[data-dock-app-search]');
    const appRows = Array.from(root.querySelectorAll<HTMLElement>('[data-dock-app-item]'));
    const searchEmpty = root.querySelector<HTMLElement>('[data-dock-search-empty]');
    if (search) on(search, 'input', () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      appRows.forEach((row) => {
        const matches = !query || (row.dataset.search || '').includes(query);
        row.hidden = !matches;
        if (matches) visible += 1;
      });
      if (searchEmpty) searchEmpty.hidden = visible > 0;
    });

    on(root, 'click', (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-dock-track]');
      if (!link) return;
      recordDockOpen(link.getAttribute('href') || '/', link.dataset.dockTitle || link.textContent || 'PointCast');
    });

    const clearActivity = root.querySelector<HTMLButtonElement>('[data-dock-clear-activity]');
    if (clearActivity) on(clearActivity, 'click', () => {
      clearDockActivity();
      renderActivity();
    });

    on(window, 'pc:dock-state-change', () => {
      renderRecents();
      renderActivity();
    });
    on(window, 'pc:pet-state-change', () => {
      syncPetCareActivity();
      renderPet();
      renderActivity();
    });
    on(window, 'storage', (event) => {
      if (![PET_CARE_KEY, PET_SELECTED_KEY, PET_STAMPS_KEY].includes(event.key || '')) return;
      syncPetCareActivity();
      renderPet();
      renderActivity();
    });
    on(window, 'pc:dock-show', (event) => {
      const detail = (event as CustomEvent<{ view?: string }>).detail;
      selectView(detail?.view || 'home');
    });
    on(window, 'pc:auth-change', (event) => {
      const user = (event as CustomEvent<{ user?: { preferredName?: string; identities?: unknown[] } | null }>).detail?.user;
      const name = root.querySelector<HTMLElement>('[data-dock-account-name]');
      const detail = root.querySelector<HTMLElement>('[data-dock-account-detail]');
      if (!user) {
        if (name) name.textContent = 'Visitor mode';
        if (detail) detail.textContent = 'Your activity stays on this device until you sign in.';
        return;
      }
      if (name) name.textContent = user.preferredName || 'PointCast account';
      const count = user.identities?.length || 1;
      if (detail) detail.textContent = `${count} linked ${count === 1 ? 'identity' : 'identities'}.`;
    });

    syncPetCareActivity();
    recordDockVisit(`${window.location.pathname}${window.location.search}`, document.title);
    renderRecents();
    renderActivity();
    renderPet();
    selectView('home');
    scope.cleanup(() => { delete root.dataset.ready; });
  }
