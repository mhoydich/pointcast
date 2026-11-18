(() => {
  "use strict";

  const endpoint = "https://pointcast.xyz/api/loom";
  let latestLogs = [];
  let capturedAt = null;

  function plain(value) {
    return typeof value === "string" ? value : "";
  }

  function isoDate(value) {
    const stamp = Date.parse(value);
    return Number.isFinite(stamp) ? new Date(stamp).toISOString() : "";
  }

  function normalizeLog(log) {
    return {
      address: log.address,
      title: plain(log.title),
      label: plain(log.label) || log.address,
      kind: plain(log.kind) || "other",
      count: Math.max(0, Number(log.count) || 0),
      updatedAt: isoDate(log.updatedAt),
      last: {
        name: plain(log.last?.name),
        body: plain(log.last?.body)
      }
    };
  }

  async function read(url) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);
    try {
      const response = await fetch(url, { signal: abort.signal, credentials: "omit" });
      if (!response.ok) throw new Error("PointCast returned HTTP " + response.status);
      const data = await response.json();
      if (!data.ok) throw new Error("PointCast could not read the log");
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function directory() {
    try {
      const data = await read(endpoint);
      if (!Array.isArray(data.logs)) throw new Error("Missing Loom directory");
      latestLogs = data.logs.filter(log => plain(log?.address)).map(normalizeLog);
      capturedAt = new Date().toISOString();
      return { logs: latestLogs, live: true, capturedAt };
    } catch {
      return { logs: latestLogs, live: false, capturedAt };
    }
  }

  async function thread(address) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set("to", address);
      const data = await read(url);
      if (!Array.isArray(data.messages)) throw new Error("Missing Loom messages");
      const messages = data.messages.filter(message => message && !message.hidden).map(message => ({
        name: plain(message.from?.name),
        body: plain(message.body) || plain(message.poll?.question) || plain(message.media?.alt),
        time: isoDate(message.at)
      }));
      return { messages, live: true };
    } catch {
      const log = latestLogs.find(item => item.address === address);
      const messages = log?.last.body ? [{ ...log.last, time: log.updatedAt }] : [];
      return { messages, live: false };
    }
  }

  window.LoomData = { directory, thread };
})();
