/* The Hundred: original Nouns casting gallery. All character state stays local. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let items = [], cohorts = [], selected = 'all', previousFocus = null;
  const dialog = $('#character-dialog');
  const traitsText = item => Object.values(item.traits || {}).join(' ');
  const cohortFor = item => cohorts.find(c => c.id === item.cohortId) || {};
  function visibleItems() {
    const query = $('#search').value.trim().toLowerCase();
    return items.filter(item => (selected === 'all' || item.cohortId === selected) && `${item.name} ${item.cohortName} ${item.oneLiner} ${item.bio} ${traitsText(item)}`.toLowerCase().includes(query));
  }
  function renderCast() {
    const found = visibleItems();
    $('#result-count').textContent = `${found.length} OF ${items.length} CHARACTERS · SELECT A FACE TO MEET THEM`;
    $('#empty-state').hidden = found.length > 0;
    $('#cast-grid').innerHTML = found.map(item => `<button type="button" class="cast-card" data-character="${escape(item.id)}" aria-label="Meet ${escape(item.name)}"><div class="portrait-wrap" style="--cast-paper:${escape(cohortFor(item).paper || '#e4e4da')}"><img src="${escape(item.svg)}" alt="${escape(item.name)}, original Nouns character" width="320" height="320" loading="lazy"><span class="portrait-number">${String(item.number).padStart(3,'0')}</span></div><h3>${escape(item.name)}</h3><p>${escape(item.cohortName)}</p></button>`).join('');
  }
  function showCharacter(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    previousFocus = document.activeElement;
    const cohort = cohortFor(item), seed = Object.entries(item.seed).map(([key,value]) => `${key}:${value}`).join(' · ');
    $('#character-detail').innerHTML = `<div class="detail-layout"><div class="detail-portrait" style="--cast-paper:${escape(cohort.paper || '#e4e4da')}"><img src="${escape(item.svg)}" alt="${escape(item.name)}" width="320" height="320"></div><div class="detail-copy"><p class="eyebrow">${String(item.number).padStart(3,'0')} / ${escape(item.cohortName)}</p><h2 id="dialog-name">${escape(item.name)}</h2><p><strong>${escape(item.oneLiner)}</strong></p><p>${escape(item.bio)}</p><dl>${Object.entries(item.traits).map(([key,value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl><code class="seed">${escape(seed)}</code><div class="actions"><a class="pill dark" href="${escape(item.svg)}" download="${escape(item.id)}.svg">Download SVG ↓</a><button type="button" class="pill" id="copy-character">Copy character bio</button></div><p id="copy-status" aria-live="polite"></p></div></div>`;
    $('#copy-character').addEventListener('click', async () => {
      const text = `${item.name} — ${item.cohortName}\n${item.oneLiner}\n\n${item.bio}\n\nOriginal Nouns art. Creative direction: Michael Hoydich.\nSeed: ${seed}\nNo minted token or ownership claim.`;
      try { await navigator.clipboard.writeText(text); $('#copy-status').textContent = 'Character bio copied.'; }
      catch { $('#copy-status').textContent = 'Copy is unavailable here. You can select the biography above.'; }
    });
    if (!dialog.open) dialog.showModal();
  }
  $('#cast-grid').addEventListener('click', event => { const button = event.target.closest('[data-character]'); if (button) showCharacter(button.dataset.character); });
  $('#search').addEventListener('input', renderCast);
  $('#surprise').addEventListener('click', () => { const found=visibleItems(); if(found.length) showCharacter(found[Math.floor(Math.random()*found.length)].id); });
  $('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if(event.target === dialog) { const box=dialog.getBoundingClientRect(); if(event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { if(previousFocus?.isConnected) previousFocus.focus(); });
  async function loadEditions() {
    const response = await fetch('editions.json');
    if(!response.ok) throw new Error('The guest studio index is unavailable.');
    const data = await response.json();
    $('#edition-grid').innerHTML = data.editions.map(edition => `<article class="edition-card">${edition.image ? `<img class="edition-art" src="${escape(edition.image)}" alt="${escape(edition.title)} artwork" width="640" height="400" loading="lazy">` : `<div class="edition-placeholder" style="background:${escape(edition.color || '#e9ff72')}">${escape(edition.shortName)}</div>`}<div class="edition-copy"><p class="eyebrow">${escape(edition.kind)}</p><h3>${escape(edition.title)}</h3><p>${escape(edition.description)}</p><a class="text-link" href="${escape(edition.href)}">Explore the edition ↗</a><p class="signature">${escape(edition.credit)}</p></div></article>`).join('');
  }
  Promise.all([
    fetch('manifest.json').then(response => { if(!response.ok) throw new Error('Character manifest is unavailable.'); return response.json(); }).then(manifest => {
      items = manifest.items; cohorts = manifest.cohorts;
      const preview = [0,10,20,30,40,50,60,70,80,90,5,95].map(index => items[index]).filter(Boolean);
      $('.casting-grid').innerHTML = preview.map(item => `<img src="${escape(item.svg)}" alt="${escape(item.name)}" width="160" height="160">`).join('');
      $('#cohort-filters').innerHTML = [{id:'all',name:'Everyone'},...cohorts].map(cohort => `<button type="button" data-cohort="${escape(cohort.id)}" aria-pressed="${cohort.id==='all'}">${escape(cohort.name)}</button>`).join('');
      $('#cohort-filters').addEventListener('click', event => { const button=event.target.closest('[data-cohort]'); if(!button)return; selected=button.dataset.cohort; document.querySelectorAll('[data-cohort]').forEach(b => b.setAttribute('aria-pressed',String(b===button))); renderCast(); });
      renderCast();
    }),
    loadEditions().catch(() => { $('#edition-grid').innerHTML = '<p>Guest editions are being prepared. The complete character collection is available below.</p>'; })
  ]).catch(() => { $('#result-count').textContent='The character gallery could not load. Download the character pack or open the contact sheet below.'; $('#cast-grid').innerHTML='<a class="pill dark" href="contact-sheets/all-100.jpg">View all 100 characters ↗</a>'; });
})();
