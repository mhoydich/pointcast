/* Same-origin, review-only bridge. This file never submits an AI task. */
(() => {
  'use strict';
  if (window.__pointcastPlayerHostV1) {
    window.__pointcastPlayerHostV1.mount();
    return;
  }
  let cleanup = null;
  function mount() {
    cleanup?.();
    cleanup = null;
    const root = document.querySelector('[data-player-host]');
    if (!root) return;
    const frame = root.querySelector('[data-player-frame]');
    const dialog = root.querySelector('[data-player-ai-dialog]');
    const notice = root.querySelector('[data-player-host-notice]');
    const draftStatus = root.querySelector('[data-player-draft-status]');
    if (!(frame instanceof HTMLIFrameElement) || !(dialog instanceof HTMLDialogElement)) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    let returnFocus = null;
    function open() {
      if (dialog.open) return;
      returnFocus = document.activeElement;
      dialog.showModal();
      dialog.querySelector('[data-player-close]')?.focus();
    }
    function acknowledge() {
      if (location.origin === 'null') return;
      frame.contentWindow?.postMessage({ type: 'pointcast.player.host-ready', version: 1 }, location.origin);
    }
    function clearOptionalContext() {
      for (const selector of ['[data-runtime-followup]', '[data-runtime-page]', '[data-runtime-gentle]']) {
        const input = dialog.querySelector(selector);
        if (input instanceof HTMLInputElement) {
          input.checked = false;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      for (const selector of ['[data-runtime-context]', '[data-runtime-note]']) {
        const input = dialog.querySelector(selector);
        if (input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
    window.addEventListener('message', event => {
      if (event.source !== frame.contentWindow || event.origin !== location.origin || location.origin === 'null') return;
      const data = event.data;
      if (!data || typeof data !== 'object' || data.version !== 1) return;
      if (data.type === 'pointcast.player.ready') { acknowledge(); return; }
      if (data.type !== 'pointcast.player.ai-draft' || typeof data.prompt !== 'string') return;
      if (!data.prompt.trim() || data.prompt.length > 4000) {
        if (notice) notice.textContent = 'The AI brief was not accepted. It must contain 1–4,000 characters.';
        return;
      }
      const prompt = dialog.querySelector('[data-runtime-prompt]');
      if (!(prompt instanceof HTMLTextAreaElement)) {
        if (notice) notice.textContent = 'The companion form is unavailable. Export the brief from the player instead.';
        return;
      }
      clearOptionalContext();
      prompt.value = data.prompt;
      prompt.dispatchEvent(new Event('input', { bubbles: true }));
      prompt.dispatchEvent(new Event('change', { bubbles: true }));
      if (draftStatus) draftStatus.textContent = 'Draft received from the player. No AI task has started. Review the exact text below, check your connection, and choose Run this task yourself.';
      if (notice) notice.textContent = 'AI brief is in the review form. The player sent no audio files and started no task.';
      open();
    }, options);
    frame.addEventListener('load', acknowledge, options);
    root.querySelector('[data-player-open-ai]')?.addEventListener('click', open, options);
    dialog.querySelector('[data-player-close]')?.addEventListener('click', () => dialog.close(), options);
    dialog.addEventListener('close', () => {
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
    }, options);
    acknowledge();
    cleanup = () => {
      controller.abort();
      if (dialog.open) dialog.close();
    };
  }
  document.addEventListener('astro:page-load', mount);
  document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = null; });
  window.__pointcastPlayerHostV1 = Object.freeze({ mount });
  mount();
})();
