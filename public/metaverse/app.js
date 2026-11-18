'use strict';

async function startMetaverse() {
  const el = id => document.getElementById(id);
  const buildings = window.LoomBuildings;
  let selected = 0, map, directory, results = [], readToken = 0, directoryToken = 0;
  let city;
  function showMode(mode) {
    const walking = mode === 'walk';
    el('orbit-mode').setAttribute('aria-pressed', String(!walking));
    el('walk-mode').setAttribute('aria-pressed', String(walking));
    el('step-pad').hidden = !walking;
    el('orbit-tools').hidden = walking;
    el('projection').textContent = walking ? 'STREET LEVEL' : 'WEBGL / ORBIT';
    el('city-hint').textContent = walking ? 'WASD or arrows to walk · Drag to look' : 'Drag to orbit · Pinch or scroll to zoom';
    el('focus-plate').textContent = walking ? 'Walk to this building' : 'View building up close';
  }
  try {
    await import('./webgl/main.js');
    city = window.LoomWebCity(el('city'), choose, showMode);
    showMode('orbit');
    el('camera-modes').hidden = false;
    el('focus-plate').hidden = false;
    el('orbit-mode').onclick = () => city.setMode('orbit');
    el('walk-mode').onclick = () => city.setMode('walk');
    el('focus-plate').onclick = () => city.focus(selected);
    document.querySelectorAll('[data-step]').forEach(button => {
      button.onclick = () => city.step(button.dataset.step);
    });
    el('city').addEventListener('loomwebglcontextlost', () => { el('projection').textContent = 'RESTORING 3D VIEW'; });
    el('city').addEventListener('loomwebglcontextrestored', () => showMode(el('city').dataset.mode));
  } catch (error) {
    console.warn('Using the illustrated district view.', error);
    const original = el('city');
    const canvas = original.cloneNode(false);
    original.replaceWith(canvas);
    city = window.LoomCity(canvas, choose);
    el('projection').textContent = 'ILLUSTRATED VIEW';
  }
  const plateNumber = index => String(index + 1).padStart(2, '0');
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function choose(index) {
    selected = index;
    const plate = buildings[index];
    city.select(index);
    el('plateid').textContent = 'SOURCE PLATE / ' + plateNumber(index);
    el('title').textContent = plate.name;
    el('photo').src = plate.image;
    el('photo').alt = plate.description;
    el('desc').textContent = plate.description.replace(/[.]?$/, '.');
    el('credit').textContent = plate.credit;
    el('job').href = plate.job;
    el('pub').href = plate.source;
    [...el('plates').children].forEach((button, i) => button.setAttribute('aria-pressed', i === index));
    try { localStorage.setItem('loom3d.plate', plate.id); } catch {}
  }
  for (const [i, plate] of buildings.entries()) {
    const btn = element('button', undefined, 'card'), thumb = element('div', undefined, 'thumb');
    const image = document.createElement('img');
    image.src = plate.image;
    image.alt = '';
    thumb.append(image, element('span', plateNumber(i), 'cardnum'));
    btn.append(thumb, element('strong', plate.name));
    btn.onclick = () => choose(i);
    el('plates').append(btn);
  }
  let saved;
  try { saved = localStorage.getItem('loom3d.plate'); } catch {}
  choose(Math.max(0, buildings.findIndex(x => x.id === saved)));
  el('enlarge').onclick = () => {
    const plate = buildings[selected];
    el('full').src = plate.image;
    el('full').alt = plate.description;
    el('caption').textContent = plate.name;
    el('lightbox').showModal();
  };
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.close').onclick = () => dialog.close();
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });
  function toggle(network) {
    city.setActive?.(!network);
    el('network').hidden = !network;
    el('cityview').hidden = network;
    el('threads').setAttribute('aria-pressed',network);
    el('district').setAttribute('aria-pressed',!network);
    el('viewtitle').replaceChildren(document.createTextNode(network ? 'The threads' : 'The district'),element('span','.'));
    if (network && !map) map = window.LoomMap(el('map'), address => openThread(address));
    if (network) loadDirectory();
  }
  el('threads').onclick = () => toggle(true);
  el('district').onclick = () => toggle(false);
  async function loadDirectory() {
    const token = ++directoryToken;
    const data = await window.LoomData.directory();
    if (token !== directoryToken) return;
    directory = data;
    filter();
  }
  function filter() {
    if (!directory) return;
    const term = el('query').value.trim().toLowerCase();
    results = directory.logs.filter(x => [x.title,x.label,x.address,x.kind].join(' ').toLowerCase().includes(term));
    map.setData(results);
    el('status').textContent = results.length + ' THREADS · ' + (directory.live ? 'LIVE' : (directory.capturedAt ? 'LAST READ' : 'OFFLINE'));
    el('rooms').replaceChildren();
    if (!results.length) el('rooms').append(element('p', directory.live ? 'No matching threads.' : 'The Loom directory is unavailable. Open Threads again to retry.'));
    for (const log of results) {
      const button = element('button',undefined,'room');
      button.append(element('strong',log.label || log.address), element('small',log.kind + ' · ' + log.count + ' messages'));
      button.onclick = () => openThread(log.address);
      el('rooms').append(button);
    }
  }
  el('query').oninput = filter;
  async function openThread(address) {
    const token = ++readToken, log = results.find(item => item.address === address);
    if(map) map.select(address);
    el('roomtitle').textContent = log?.label || address;
    el('roomlink').href = 'https://pointcast.xyz/loom?to=' + encodeURIComponent(address);
    el('messages').textContent = 'Reading thread…';
    if (!el('reader').open) el('reader').showModal();
    const data = await window.LoomData.thread(address);
    if (token !== readToken) return;
    const list = el('messages');
    list.replaceChildren();
    if (!data.live) list.append(element('p','Offline · showing available saved messages.','muted'));
    if (!data.messages.length) list.append(element('p',data.live ? 'No messages in this thread yet.' : 'No saved messages for this thread.'));
    for (const message of [...data.messages].reverse()) {
      const post = element('article');
      post.append(element('strong',message.name || 'Anonymous'),element('small', message.time ? ' · ' + new Date(message.time).toLocaleString() : ''),element('p',message.body));
      list.append(post);
    }
  }
  el('discussion').onclick = () => openThread(buildings[selected].source);
  document.querySelectorAll('[data-act]').forEach(button => button.onclick = () => {
    const renderer = el('network').hidden ? city : map;
    if (button.dataset.act === 'reset') renderer.reset();
    else renderer.zoom(button.dataset.act === 'in' ? 1.2 : 1/1.2);
  });
  for (const id of ['city','map']) el(id).addEventListener('keydown',event => {
    if (id === 'city' && el('city').dataset.mode === 'walk') return;
    const renderer = id === 'city' ? city : map;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const angle = event.key === 'ArrowLeft' ? -.14 : .14;
      if (id === 'city') renderer.rotate(angle); else renderer.orbit(angle,0);
    }
    if (event.key === '+' || event.key === '=') renderer.zoom(1.2);
    if (event.key === '-') renderer.zoom(1/1.2);
    if (event.key === 'Home') renderer.reset();
  });

}

startMetaverse();
