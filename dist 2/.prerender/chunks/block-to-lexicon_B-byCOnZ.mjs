function blockAtUri(did, blockId) {
  return `at://${did}/xyz.pointcast.block/${blockId}`;
}
function blockToLexiconRecord(block, opts = {}) {
  const out = {
    $type: "xyz.pointcast.block",
    id: block.id,
    channel: String(block.channel),
    type: String(block.type),
    title: block.title,
    timestamp: normalizeIso(block.timestamp),
    createdAt: normalizeIso(opts.createdAt ?? block.timestamp)
  };
  if (block.dek !== void 0) out.dek = block.dek;
  if (block.body !== void 0) out.body = block.body;
  if (block.size !== void 0) out.size = String(block.size);
  if (block.noun !== void 0) out.noun = block.noun;
  if (block.readingTime !== void 0) out.readingTime = block.readingTime;
  if (block.author !== void 0) out.author = block.author;
  if (block.source !== void 0) out.source = block.source;
  if (block.mood !== void 0) out.mood = block.mood;
  if (block.external) out.external = { ...block.external };
  if (block.media) out.media = { ...block.media };
  if (block.companions && block.companions.length) {
    out.companions = block.companions.map((c) => ({
      id: c.id,
      label: c.label,
      ...c.surface ? { surface: c.surface } : {}
    }));
  }
  if (block.meta && Object.keys(block.meta).length) {
    out.meta = stripUndefined(block.meta);
  }
  return out;
}
function lexiconRecordToBlock(record) {
  const out = {
    id: record.id,
    channel: record.channel,
    type: record.type,
    title: record.title,
    timestamp: normalizeIso(record.timestamp)
  };
  if (record.dek !== void 0) out.dek = record.dek;
  if (record.body !== void 0) out.body = record.body;
  if (record.size !== void 0) out.size = record.size;
  if (record.noun !== void 0) out.noun = record.noun;
  if (record.readingTime !== void 0) out.readingTime = record.readingTime;
  if (record.author !== void 0) out.author = record.author;
  if (record.source !== void 0) out.source = record.source;
  if (record.mood !== void 0) out.mood = record.mood;
  if (record.external) out.external = { ...record.external };
  if (record.media) out.media = { ...record.media };
  if (record.companions && record.companions.length) {
    out.companions = record.companions.map((c) => ({
      id: c.id,
      label: c.label,
      ...c.surface ? { surface: c.surface } : {}
    }));
  }
  if (record.meta && Object.keys(record.meta).length) {
    out.meta = stripUndefined(record.meta);
  }
  return out;
}
function roundTrip(block) {
  const record = blockToLexiconRecord(block);
  const back = lexiconRecordToBlock(record);
  const drift = diffPaths(stripUndefined(block), stripUndefined(back));
  return { record, back, lossless: drift.length === 0, drift };
}
function normalizeIso(input) {
  if (input instanceof Date) return input.toISOString();
  return String(input);
}
function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === void 0) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = stripUndefined(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
function diffPaths(a, b, path = "") {
  if (a === b) return [];
  if (typeof a !== typeof b) return [path || "(root)"];
  if (a === null || b === null) return a === b ? [] : [path || "(root)"];
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [`${path}[length]`];
    const out = [];
    for (let i = 0; i < a.length; i++) {
      out.push(...diffPaths(a[i], b[i], `${path}[${i}]`));
    }
    return out;
  }
  if (typeof a === "object" && typeof b === "object") {
    const out = [];
    const keys = /* @__PURE__ */ new Set([
      ...Object.keys(a),
      ...Object.keys(b)
    ]);
    for (const k of keys) {
      out.push(...diffPaths(
        a[k],
        b[k],
        path ? `${path}.${k}` : k
      ));
    }
    return out;
  }
  return [path || "(root)"];
}

export { blockAtUri as a, blockToLexiconRecord as b, roundTrip as r };
