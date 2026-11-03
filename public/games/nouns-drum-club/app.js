(() => {
  const tracks = [
    {name:'KICK', subtitle:'NOUN 42', noun:42, color:'coral'},
    {name:'SNARE', subtitle:'NOUN 127', noun:127, color:'blue'},
    {name:'HI-HAT', subtitle:'NOUN 272', noun:272, color:'yellow'},
    {name:'PERC', subtitle:'NOUN 455', noun:455, color:'green'}
  ];
  const presets = {
    groove: [[0,4,8,12],[4,12],[0,2,4,6,8,10,12,14],[3,11]],
    break: [[0,3,7,10],[4,12,14],[0,2,3,6,8,10,11,14],[7,15]],
    weird: [[0,6,10],[3,11,15],[1,4,7,10,13],[2,5,9,14]]
  };
  const grid = document.querySelector('#tracks');
  const numbers = document.querySelector('#step-numbers');
  const playButton = document.querySelector('#play');
  const tempoInput = document.querySelector('#tempo');
  const tempoValue = document.querySelector('#tempo-value');
  const status = document.querySelector('#status');
  let pattern = presets.groove.map(row => Array.from({length:16}, (_, i) => row.includes(i)));
  let context, noiseBuffer, playing = false, timer, nextTime = 0, nextStep = 0, generation = 0;
  let currentStep = -1;
  function loadShare() {
    const params = new URLSearchParams(location.search);
    const encoded = params.get('beat');
    if (encoded && /^[0-9a-f]{16}$/i.test(encoded)) {
      pattern = Array.from({length:4}, (_, r) => {
        const n = parseInt(encoded.slice(r * 4, r * 4 + 4), 16);
        return Array.from({length:16}, (_, i) => !!(n & (1 << i)));
      });
    }
    const bpm = Number(params.get('bpm'));
    if (bpm >= 60 && bpm <= 180) tempoInput.value = bpm;
    tempoValue.textContent = tempoInput.value;
  }
  function render() {
    numbers.innerHTML = Array.from({length:16}, (_, i) => `<span class="${i % 4 === 0 ? 'beat-number' : ''}">${String(i + 1).padStart(2,'0')}</span>`).join('');
    grid.innerHTML = tracks.map((t, r) => `<div class="track"><div class="track-label"><button type="button" class="avatar ${t.color}" data-sound="${r}" aria-label="Play ${t.name.toLowerCase()} sound, Noun ${t.noun}"><img src="assets/noun-${t.noun}.svg" alt="" width="52" height="52"></button><span class="track-info"><strong>${t.name}</strong><small>${t.subtitle}</small></span></div><div class="steps">${pattern[r].map((on, i) => `<button type="button" class="step ${on ? 'active' : ''} ${i === currentStep ? 'current' : ''} ${i % 4 === 0 ? 'group-start' : ''}" data-row="${r}" data-step="${i}" aria-label="${t.name}, step ${i + 1}" aria-pressed="${on}"></button>`).join('')}</div></div>`).join('');
  }
  function audio() {
    if (!context) {
      context = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }
  function sound(type, time) {
    const c = audio();
    const gain = c.createGain(); gain.connect(c.destination);
    if (type === 0 || type === 3) {
      const osc = c.createOscillator(); osc.type = type === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(type === 0 ? 150 : 700, time);
      osc.frequency.exponentialRampToValueAtTime(type === 0 ? 45 : 250, time + (type === 0 ? .15 : .09));
      gain.gain.setValueAtTime(type === 0 ? .8 : .22, time);
      gain.gain.exponentialRampToValueAtTime(.001, time + (type === 0 ? .35 : .14));
      osc.connect(gain); osc.start(time); osc.stop(time + .4);
    } else {
      const source = c.createBufferSource(); source.buffer = noiseBuffer;
      const filter = c.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = type === 1 ? 1500 : 7000;
      gain.gain.setValueAtTime(type === 1 ? .35 : .18, time);
      gain.gain.exponentialRampToValueAtTime(.001, time + (type === 1 ? .18 : .055));
      source.connect(filter); filter.connect(gain); source.start(time); source.stop(time + .2);
      if (type === 1) {
        const osc = c.createOscillator(); const tone = c.createGain(); osc.type = 'triangle'; osc.frequency.value = 180;
        tone.gain.setValueAtTime(.18,time); tone.gain.exponentialRampToValueAtTime(.001,time+.1); osc.connect(tone); tone.connect(c.destination); osc.start(time); osc.stop(time+.12);
      }
    }
  }
  function scheduler() {
    while (nextTime < context.currentTime + .1) {
      const step = nextStep, at = nextTime, run = generation;
      pattern.forEach((row, r) => { if (row[step]) sound(r, at); });
      setTimeout(() => { if (playing && generation === run) { currentStep = step; document.querySelectorAll('.step').forEach(el => el.classList.toggle('current', Number(el.dataset.step) === step)); } }, Math.max(0, (at - context.currentTime) * 1000));
      nextTime += 60 / Number(tempoInput.value) / 4;
      nextStep = (nextStep + 1) % 16;
    }
  }
  playButton.addEventListener('click', () => {
    playing = !playing; generation++;
    document.querySelector('#play-icon').textContent = playing ? '■' : '▶';
    document.querySelector('#play-text').textContent = playing ? 'STOP BEAT' : 'PLAY BEAT';
    playButton.setAttribute('aria-pressed', String(playing));
    if (playing) { audio(); nextStep = 0; nextTime = context.currentTime + .05; scheduler(); timer = setInterval(scheduler, 25); }
    else { clearInterval(timer); currentStep = -1; document.querySelectorAll('.step').forEach(el => el.classList.remove('current')); }
  });
  grid.addEventListener('click', event => {
    const step = event.target.closest('.step');
    if (step) { const r = +step.dataset.row, i = +step.dataset.step; pattern[r][i] = !pattern[r][i]; step.classList.toggle('active', pattern[r][i]); step.setAttribute('aria-pressed', String(pattern[r][i])); }
    const avatar = event.target.closest('.avatar');
    if (avatar) sound(+avatar.dataset.sound, audio().currentTime);
  });
  tempoInput.addEventListener('input', () => tempoValue.textContent = tempoInput.value);
  document.querySelector('#clear').addEventListener('click', () => { pattern = pattern.map(() => Array(16).fill(false)); render(); status.textContent = 'Grid cleared. Make something new!'; });
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => { pattern = presets[button.dataset.preset].map(row => Array.from({length:16}, (_, i) => row.includes(i))); render(); status.textContent = `${button.textContent} loaded. Make it your own!`; }));
  document.querySelector('#share').addEventListener('click', async () => {
    const encoded = pattern.map(row => row.reduce((sum, on, i) => sum + (on ? 2 ** i : 0), 0).toString(16).padStart(4, '0')).join('');
    const url = new URL(location.href); url.searchParams.set('beat', encoded); url.searchParams.set('bpm', tempoInput.value); url.hash = 'studio';
    try { await navigator.clipboard.writeText(url.toString()); status.textContent = 'Link copied! Pass your beat on.'; }
    catch { status.textContent = 'Copy your beat link: ' + url.toString(); }
  });
  loadShare(); render();
})();
