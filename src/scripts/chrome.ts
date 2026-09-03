import { initMeState } from '../lib/me-state';
import { mountAuthMenus } from './chrome/auth-menu';
import { mountCursorRoom } from './chrome/cursor-room';
import { mountDockBurstTicker } from './chrome/dock-burst-ticker';
import { mountDockLauncher } from './chrome/dock-launcher';
import { mountFooterBar } from './chrome/footer-bar';
import { mountSpellLayer } from './chrome/spell-layer';
import { mountTugRope } from './chrome/tug-rope';

type EventOptions = boolean | AddEventListenerOptions;

export type ChromeScope = ReturnType<typeof createChromeScope>;

function createChromeScope() {
  const controller = new AbortController();
  const timeouts = new Set<number>();
  const intervals = new Set<number>();
  const frames = new Set<number>();
  const sockets = new Set<globalThis.WebSocket>();
  const observers = new Set<globalThis.IntersectionObserver>();
  const cleanups = new Set<() => void>();

  function on(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options: EventOptions = {},
  ) {
    const normalized = typeof options === 'boolean' ? { capture: options } : options;
    target.addEventListener(type, listener, { ...normalized, signal: controller.signal });
  }

  function scopedTimeout(handler: TimerHandler, delay?: number, ...args: unknown[]) {
    const id = window.setTimeout(() => {
      timeouts.delete(id);
      if (!controller.signal.aborted) {
        if (typeof handler === 'function') handler(...args);
        else window.eval(handler);
      }
    }, delay);
    timeouts.add(id);
    return id;
  }

  function scopedClearTimeout(id?: number) {
    if (id == null) return;
    timeouts.delete(id);
    window.clearTimeout(id);
  }

  function scopedInterval(handler: TimerHandler, delay?: number, ...args: unknown[]) {
    const id = window.setInterval(handler, delay, ...args);
    intervals.add(id);
    return id;
  }

  function scopedClearInterval(id?: number) {
    if (id == null) return;
    intervals.delete(id);
    window.clearInterval(id);
  }

  function scopedFrame(callback: FrameRequestCallback) {
    const id = window.requestAnimationFrame((time) => {
      frames.delete(id);
      if (!controller.signal.aborted) callback(time);
    });
    frames.add(id);
    return id;
  }

  function scopedCancelFrame(id?: number) {
    if (id == null) return;
    frames.delete(id);
    window.cancelAnimationFrame(id);
  }

  function openWebSocket(url: string | URL, protocols?: string | string[]) {
    const socket = protocols === undefined
      ? new window.WebSocket(url)
      : new window.WebSocket(url, protocols);
    sockets.add(socket);
    socket.addEventListener('close', () => sockets.delete(socket), { once: true });
    return socket;
  }

  function observe(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    const observer = new window.IntersectionObserver(callback, options);
    observers.add(observer);
    return observer;
  }

  function cleanup(callback: () => void) {
    cleanups.add(callback);
  }

  function abort() {
    if (controller.signal.aborted) return;
    controller.abort();
    for (const id of timeouts) window.clearTimeout(id);
    for (const id of intervals) window.clearInterval(id);
    for (const id of frames) window.cancelAnimationFrame(id);
    for (const observer of observers) observer.disconnect();
    for (const socket of sockets) {
      try { socket.close(1000, 'page changed'); } catch {}
    }
    for (const callback of cleanups) {
      try { callback(); } catch {}
    }
    timeouts.clear();
    intervals.clear();
    frames.clear();
    sockets.clear();
    observers.clear();
    cleanups.clear();
  }

  return {
    signal: controller.signal,
    on,
    setTimeout: scopedTimeout,
    clearTimeout: scopedClearTimeout,
    setInterval: scopedInterval,
    clearInterval: scopedClearInterval,
    requestAnimationFrame: scopedFrame,
    cancelAnimationFrame: scopedCancelFrame,
    openWebSocket,
    observe,
    cleanup,
    abort,
  };
}

let pageScope: ChromeScope | null = null;

export function initChrome() {
  pageScope?.abort();
  pageScope = createChromeScope();
  const scope = pageScope;

  initMeState();
  mountAuthMenus(scope);
  mountDockBurstTicker(scope);

  document.querySelectorAll<HTMLElement>('[data-dock]').forEach((root) => mountFooterBar(root, scope));
  document.querySelectorAll<HTMLElement>('[data-dock-launcher]').forEach((root) => mountDockLauncher(root, scope));
  document.querySelectorAll<HTMLElement>('.tug').forEach((root) => mountTugRope(root, scope));
  document.querySelectorAll<HTMLElement>('.spell-layer').forEach((root) => mountSpellLayer(root, scope));

  // Presence is a page singleton. If a transition temporarily leaves two room
  // roots in the DOM, only the first may open the room + burst sockets.
  const room = document.querySelector<HTMLElement>('.cursor-room');
  if (room) mountCursorRoom(room, scope);
}

document.addEventListener('astro:before-swap', () => pageScope?.abort());
document.addEventListener('astro:page-load', initChrome);
initChrome();
