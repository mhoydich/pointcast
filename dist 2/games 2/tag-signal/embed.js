(function () {
  const currentScript = document.currentScript;
  const scriptUrl = new URL(currentScript.src, window.location.href);
  const baseUrl = scriptUrl.href.replace(/embed\.js(?:\?.*)?$/, '');

  function loadCss() {
    if (document.querySelector('link[data-tag-game-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${baseUrl}styles.css`;
    link.dataset.tagGameStyle = 'true';
    document.head.appendChild(link);
  }

  function loadEngine() {
    if (window.TagGame) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${baseUrl}tag-game.js`;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function mount() {
    const root = document.createElement('div');
    root.dataset.tagGameRoot = 'true';
    const parent = currentScript.parentElement || document.body;
    parent.insertBefore(root, currentScript.nextSibling);

    window.TagGame.create(root, {
      campaign: currentScript.dataset.campaign || 'embed',
      site: currentScript.dataset.site || window.location.hostname || 'unknown',
      endpoint: currentScript.dataset.endpoint || '',
      duration: Number(currentScript.dataset.duration || 30)
    });
  }

  loadCss();
  loadEngine().then(mount).catch(() => {
    console.warn('Tag Signal could not load.');
  });
})();
