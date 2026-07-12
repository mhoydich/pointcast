import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

function buildTVSlides(blocks, opts = {}) {
  const limit = opts.limit ?? 18;
  const filtered = opts.channel ? blocks.filter((b) => b.data.channel === opts.channel) : blocks;
  return filtered.slice(0, limit).map((b) => ({
    id: b.data.id,
    title: b.data.title,
    dek: b.data.dek ?? "",
    channel: b.data.channel,
    channelName: CHANNELS[b.data.channel]?.name ?? b.data.channel,
    type: b.data.type,
    mood: b.data.mood ?? "",
    timestamp: b.data.timestamp.toISOString()
  }));
}
function fmtTVDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric"
  });
}

export { buildTVSlides as b, fmtTVDate as f };
