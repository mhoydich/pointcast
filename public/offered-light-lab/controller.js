/* Offered Light — local, consent-led interactions. No network, storage, or delivery service. */
(function () {
  'use strict';
  window.initOfferedLight = function initOfferedLight(artworks) {
    const root = document.getElementById('offered-light');
    if (!root || !Array.isArray(artworks) || !artworks.length) return null;
    if (root.offeredLight) root.offeredLight.destroy();
    const $ = id => document.getElementById(id);
    const nodes = Object.fromEntries(['to-name','message','from-name','dedication','gift-message','signature','scene-art','scene-art-next','art-status','candle-toggle','candle-note','water','sound-toggle','ring-bell','sound-status','motion-toggle','preview-gift','edit-gift','editor','receiver-note','preview-heading','exact-share-text','share-text','copy-text','prepare-image','share-image','download-image','share-status','manual-copy','copy-field'].map(id => [id, $(id)]));
    const n = nodes;
    const removers = [], timers = new Set(), urls = new Set();
    const media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
    let disposed = false, revision = 0, artSerial = 0, prepareSerial = 0, audioSerial = 0;
    let selected = artworks[0], decodedArt = null, prepared = null;
    let rippleEffect = null, soundEffect = null;
    let mode = 'create', lit = false, soundEnabled = false, still = false, preparing = false;
    const on = (el, name, fn) => { if (el) { el.addEventListener(name, fn); removers.push(() => el.removeEventListener(name, fn)); } };
    const later = (fn, delay) => { const id = setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, delay); timers.add(id); return id; };
    const say = (id, value) => { if (n[id]) n[id].textContent = value; };
    const pressed = (id, value) => { if (n[id]) n[id].setAttribute('aria-pressed', String(value)); };
    const status = value => say('share-status', value);
    const reduced = () => still || media.matches;
    const fields = () => ({
      to: (n['to-name']?.value || '').slice(0, 80).trim(),
      message: (n.message?.value || '').slice(0, 500).trim(),
      from: (n['from-name']?.value || '').slice(0, 80).trim()
    });
    const textFor = data => ['An offered light', data.to ? 'For ' + data.to : 'For you', data.message || 'May a little light find you here.', data.from ? 'With care, ' + data.from : 'With care', 'There is no need to reply.'].join('\n\n');
    function updateButtons() {
      if (n['prepare-image']) n['prepare-image'].disabled = preparing;
      if (n['share-image']) n['share-image'].disabled = !prepared || !fileSharing(prepared.file);
      if (n['download-image']) n['download-image'].disabled = preparing;
    }
    function invalidate() {
      revision++; prepareSerial++; prepared = null; preparing = false;
      updateButtons();
      status('Your words stay on this device until you choose to share.');
    }
    function renderWords() {
      const data = fields();
      say('dedication', data.to ? 'For ' + data.to : 'For you');
      say('gift-message', data.message || 'May a little light find you here.');
      say('signature', data.from ? 'With care, ' + data.from : 'With care');
      say('exact-share-text', textFor(data));
    }
    ['to-name','message','from-name'].forEach(id => {
      if (!n[id]) return;
      n[id].maxLength = id === 'message' ? 500 : 80;
      on(n[id], 'input', () => { n[id].value = n[id].value.slice(0, n[id].maxLength); invalidate(); renderWords(); });
    });
    function setCandle(value) {
      lit = value;
      root.dataset.lit = String(value);
      pressed('candle-toggle', value);
      say('candle-note', value ? 'A little light, held here for you.' : 'Light the candle whenever you wish.');
    }
    on(n['candle-toggle'], 'click', () => setCandle(!lit));
    function imageReady(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => { try { if (img.decode) await img.decode(); resolve(img); } catch (err) { reject(err); } };
        img.onerror = () => reject(new Error('Artwork could not load.'));
        img.src = src;
      });
    }
    async function chooseArt(art, invalidateExport = true) {
      selected = art;
      const serial = ++artSerial;
      decodedArt = null;
      if (invalidateExport) invalidate();
      root.dataset.theme = art.theme || art.id;
      root.dataset.artLoading = 'true';
      say('art-status', 'Opening ' + art.title + '…');
      if (n['scene-art-next']) n['scene-art-next'].classList.remove('is-visible');
      try {
        const img = await imageReady(art.src);
        if (disposed || serial !== artSerial) return;
        decodedArt = img;
        const main = n['scene-art'], next = n['scene-art-next'];
        if (next && main && main.getAttribute('src') && !reduced()) {
          next.src = art.src; next.alt = art.alt || art.title;
          if (next.decode) await next.decode();
          if (disposed || serial !== artSerial) return;
          next.classList.add('is-visible');
          later(() => {
            if (serial !== artSerial) return;
            main.src = art.src; main.alt = art.alt || art.title;
            next.classList.remove('is-visible');
          }, 750);
        } else if (main) { main.src = art.src; main.alt = art.alt || art.title; }
        root.dataset.artLoading = 'false';
        root.dataset.artError = 'false';
        say('art-status', art.title + ' is ready.');
      } catch (_) {
        if (disposed || serial !== artSerial) return;
        root.dataset.artLoading = 'false'; root.dataset.artError = 'true';
        say('art-status', 'This artwork could not open. Choose another atmosphere or try it again. Your words are safe here.');
      }
    }
    document.querySelectorAll('input[name="atmosphere"]').forEach((input, index) => {
      const art = artworks.find(item => item.theme === input.value || item.id === input.value) || artworks[index];
      input.checked = art === selected;
      on(input, 'change', () => { if (input.checked && art) chooseArt(art); });
    });
    function setMode(value) {
      mode = value; root.dataset.mode = value;
      if (n.editor) n.editor.hidden = value === 'receive';
      if (n['receiver-note']) n['receiver-note'].hidden = value !== 'receive';
      if (n['preview-gift']) n['preview-gift'].hidden = value === 'receive';
      if (n['edit-gift']) n['edit-gift'].hidden = value !== 'receive';
      stopAudio(true);
      if (value === 'receive') {
        setCandle(false);
        n['preview-heading']?.focus({ preventScroll: true });
        root.scrollIntoView?.({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      } else n['to-name']?.focus({ preventScroll: true });
    }
    on(n['preview-gift'], 'click', () => setMode('receive'));
    on(n['edit-gift'], 'click', () => setMode('create'));
    function applyMotion() {
      root.dataset.reducedMotion = String(reduced());
      pressed('motion-toggle', reduced());
      if (reduced()) rippleEffect?.clear?.();
    }
    on(n['motion-toggle'], 'click', () => { still = !still; applyMotion(); });
    if (media.addEventListener) on(media, 'change', applyMotion);
    else if (media.addListener) { media.addListener(applyMotion); removers.push(() => media.removeListener(applyMotion)); }
    function syncSound(state) {
      if (disposed) return;
      if (state.status === 'idle' || state.status === 'error' || state.status === 'disposed') soundEnabled = false;
      pressed('sound-toggle', soundEnabled);
      if (n['ring-bell']) n['ring-bell'].disabled = !soundEnabled || state.status !== 'ready';
      say('sound-status', state.error || (state.status === 'starting' ? 'Preparing sound. Nothing plays until you choose the gong.' : soundEnabled ? 'Sound is available. Play one quiet closing gong when you wish.' : 'Sound is off. Silence is complete.'));
    }
    if (window.PointCastEffects) {
      soundEffect = window.PointCastEffects.createAudio({ onState: syncSound });
      if (n.water) rippleEffect = window.PointCastEffects.createRipple(n.water, { reducedMotion: reduced });
    }
    function stopAudio() {
      audioSerial++;
      soundEnabled = false;
      soundEffect?.stop();
      pressed('sound-toggle', false);
      if (n['ring-bell']) n['ring-bell'].disabled = true;
      say('sound-status', 'Sound is off. Silence is complete.');
    }
    on(n['sound-toggle'], 'click', async () => {
      if (soundEnabled) { stopAudio(); return; }
      if (!soundEffect) { say('sound-status', 'Sound is unavailable in this browser. You can enjoy the scene in silence.'); return; }
      const serial = ++audioSerial;
      soundEnabled = true; pressed('sound-toggle', true);
      // enable() invokes AudioContext.resume before its first await, inside this gesture.
      const ready = await soundEffect.enable();
      if (disposed || serial !== audioSerial) return;
      soundEnabled = ready;
      if (ready) syncSound({ status: 'ready' });
      else { pressed('sound-toggle', false); if (n['ring-bell']) n['ring-bell'].disabled = true; }
    });
    on(n['ring-bell'], 'click', () => {
      if (soundEnabled && soundEffect?.ring('gong')) say('sound-status', 'One quiet gong. You can turn sound off at any time.');
    });
    on(document, 'visibilitychange', () => { if (document.hidden) { stopAudio(); rippleEffect?.clear?.(); } });
    on(window, 'pagehide', () => { stopAudio(); rippleEffect?.clear?.(); });
    function manualCopy(value, message) {
      if (n['manual-copy']) n['manual-copy'].hidden = false;
      if (n['copy-field']) { n['copy-field'].value = value; n['copy-field'].focus(); n['copy-field'].select(); }
      status(message || 'Select and copy the exact text below.');
    }
    async function copyText() {
      const value = textFor(fields());
      try {
        if (!navigator.clipboard?.writeText) throw new Error('No clipboard');
        await navigator.clipboard.writeText(value);
        status('The exact gift text has been copied.');
      } catch (_) { manualCopy(value); }
    }
    on(n['copy-text'], 'click', copyText);
    on(n['share-text'], 'click', async () => {
      const currentRevision = revision, value = textFor(fields());
      if (!navigator.share) { manualCopy(value, 'Native sharing is unavailable here. Copy the exact gift text below.'); return; }
      try { await navigator.share({ text: value }); if (!disposed && currentRevision === revision) status('The text was passed to your share sheet. Your draft is still here.'); }
      catch (err) { if (!disposed && currentRevision === revision) status(err?.name === 'AbortError' ? 'Sharing was cancelled. Your draft is still here.' : 'Sharing could not open. You can copy the text instead.'); }
    });
    function fileSharing(file) {
      try { return Boolean(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (_) { return false; }
    }
    function wrapText(context, value, width) {
      const lines = [];
      const graphemes = text => typeof Intl !== 'undefined' && Intl.Segmenter
        ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.segment)
        : Array.from(text);
      String(value).split('\n').forEach(paragraph => {
        if (!paragraph) { lines.push(''); return; }
        let line = '';
        paragraph.split(/(\s+)/).forEach(word => {
          if (context.measureText(line + word).width <= width) { line += word; return; }
          if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
          word = word.trimStart();
          if (context.measureText(word).width <= width) { line = word; return; }
          // Unspaced scripts and long names still wrap without cutting a grapheme.
          graphemes(word).forEach(character => {
            if (line && context.measureText(line + character).width > width) { lines.push(line); line = character; }
            else line += character;
          });
        });
        lines.push(line.trimEnd());
      });
      return lines;
    }
    async function makeImage(art, data, image) {
      if (document.fonts?.ready) await document.fonts.ready;
      const width = 1600, artHeight = 2400, inset = 140, textWidth = width - inset * 2;
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      const blocks = [
        { value: 'AN OFFERED LIGHT', font: '24px sans-serif', line: 40, gap: 48, color: '#776b5b' },
        { value: data.to ? 'For ' + data.to : 'For you', font: '56px Georgia, serif', line: 72, gap: 38, color: '#302c27' },
        { value: data.message || 'May a little light find you here.', font: '42px Georgia, serif', line: 61, gap: 42, color: '#302c27' },
        { value: data.from ? 'With care, ' + data.from : 'With care', font: '30px sans-serif', line: 45, gap: 50, color: '#554c42' },
        { value: 'There is no need to reply.', font: '27px sans-serif', line: 42, gap: 0, color: '#776b5b' }
      ];
      blocks.forEach(block => { context.font = block.font; block.lines = wrapText(context, block.value, textWidth); });
      const heightFor = () => blocks.reduce((sum, block) => sum + block.lines.length * block.line + block.gap, 0) + inset * 2;
      let textHeight = heightFor();
      if (artHeight + textHeight > 8192) {
        // A 500-character message can still contain hundreds of explicit line breaks.
        // Fit that exceptional case without silently cropping any personal words.
        const body = blocks[2], bodyHeight = body.lines.length * body.line;
        const available = 8192 - artHeight - (textHeight - bodyHeight);
        body.line = Math.max(1, Math.floor(available / body.lines.length));
        body.font = Math.max(1, Math.floor(body.line * 42 / 61)) + 'px Georgia, serif';
        context.font = body.font; body.lines = wrapText(context, body.value, textWidth);
        textHeight = heightFor();
      }
      canvas.width = width; canvas.height = artHeight + textHeight;
      context.fillStyle = '#f5f0e6'; context.fillRect(0, 0, width, canvas.height);
      const ratio = Math.min(width / image.naturalWidth, artHeight / image.naturalHeight);
      context.drawImage(image, (width - image.naturalWidth * ratio) / 2, (artHeight - image.naturalHeight * ratio) / 2, image.naturalWidth * ratio, image.naturalHeight * ratio);
      let y = artHeight + inset;
      context.textBaseline = 'top';
      blocks.forEach(block => {
        context.font = block.font; context.fillStyle = block.color;
        block.lines.forEach(line => { context.fillText(line, inset, y); y += block.line; });
        y += block.gap;
      });
      const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Image could not be prepared')), 'image/png'));
      return { blob, file: new File([blob], 'offered-light.png', { type: 'image/png' }), art: art.id };
    }
    async function prepareImage() {
      const currentRevision = revision, serial = ++prepareSerial, art = selected, data = fields();
      preparing = true; prepared = null; updateButtons(); status('Preparing your full artwork and dedication on this device…');
      try {
        const img = decodedArt || await imageReady(art.src);
        const result = await makeImage(art, data, img);
        if (disposed || serial !== prepareSerial || revision !== currentRevision) return null;
        prepared = { ...result, revision: currentRevision }; preparing = false; updateButtons();
        status(fileSharing(prepared.file) ? 'Image ready. Choose Share image to open your share sheet, or download it.' : 'Image ready. Download it below; this browser cannot share image files directly.');
        return prepared;
      } catch (_) {
        if (serial === prepareSerial && !disposed) { preparing = false; updateButtons(); status('The image could not be prepared. Try another atmosphere; your words are still here to copy.'); }
        return null;
      }
    }
    on(n['prepare-image'], 'click', prepareImage);
    on(n['share-image'], 'click', async () => {
      const gift = prepared;
      if (!gift || gift.revision !== revision || !fileSharing(gift.file)) { status('Prepare the image first, then choose Share image. You can also download it.'); return; }
      try { await navigator.share({ files: [gift.file] }); if (gift.revision === revision) status('The image was passed to your share sheet. Your draft is still here.'); }
      catch (err) { if (gift.revision === revision) status(err?.name === 'AbortError' ? 'Sharing was cancelled. Your image and draft are still here.' : 'Image sharing could not open. Download the image or copy the text below.'); }
    });
    on(n['download-image'], 'click', async () => {
      const gift = prepared || await prepareImage();
      if (!gift || gift.revision !== revision || disposed) return;
      const url = URL.createObjectURL(gift.blob); urls.add(url);
      const link = document.createElement('a'); link.href = url; link.download = 'offered-light.png';
      document.body.appendChild(link); link.click(); link.remove();
      later(() => { URL.revokeObjectURL(url); urls.delete(url); }, 60000);
      status('Your image download is ready. Your draft remains here.');
    });
    root.dataset.mode = mode;
    setCandle(false); stopAudio(true); applyMotion(); renderWords(); updateButtons(); chooseArt(selected, false);
    const api = {
      getState: () => ({ revision, art: selected.id, mode, lit, soundEnabled, reducedMotion: reduced(), preparing, prepared: Boolean(prepared) }),
      destroy: () => {
        disposed = true; artSerial++; prepareSerial++; stopAudio(true);
        removers.forEach(remove => remove());
        soundEffect?.dispose(); rippleEffect?.dispose();
        timers.forEach(timer => clearTimeout(timer)); timers.clear();
        urls.forEach(url => URL.revokeObjectURL(url)); urls.clear();
        root.offeredLight = null;
      }
    };
    root.offeredLight = api;
    return api;
  };
}());
