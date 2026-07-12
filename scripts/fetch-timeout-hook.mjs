const DEFAULT_TIMEOUT_MS = Number(process.env.POINTCAST_FETCH_TIMEOUT_MS || 5000);

if (!globalThis.__POINTCAST_FETCH_TIMEOUT_PATCHED__) {
  const originalFetch = globalThis.fetch?.bind(globalThis);

  if (typeof originalFetch === 'function') {
    globalThis.fetch = async (input, init = {}) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error(`fetch timeout after ${DEFAULT_TIMEOUT_MS}ms`)), DEFAULT_TIMEOUT_MS);

      try {
        const signal = init.signal
          ? AbortSignal.any([init.signal, controller.signal])
          : controller.signal;
        return await originalFetch(input, { ...init, signal });
      } finally {
        clearTimeout(timeout);
      }
    };
  }

  globalThis.__POINTCAST_FETCH_TIMEOUT_PATCHED__ = true;
}
