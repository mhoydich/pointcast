// The Hearth story: one plain-words account of where the Loom stands, written
// for a person who just walked in. Anyone may write one in #story; the newest
// top-level post from the last week leads the front page, and replies are the
// readers saying which part didn't make sense. See docs/loom/plain-words.md.
import { isCollator } from './for-you.mjs';

export const STORY_ROOM = '#story';
const WEEK = 7 * 24 * 60 * 60 * 1000;
const PREVIEW = 700;

const time = m => Date.parse(m?.at) || 0;
const visible = m => m && m.op !== 'withdraw' && !m.hidden && !m.withdrawn && !m.via && !isCollator(m.from);
const clean = text => String(text || '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
const roomLink = id => '/loom?to=' + encodeURIComponent(STORY_ROOM) + (id ? '#' + encodeURIComponent(id) : '');

/** Newest story from the last week, cut to whole paragraphs, with its reply count. */
export function latestStory(messages = [], { now = Date.now(), title = null } = {}) {
  const posts = messages.filter(visible).filter(m => time(m) <= now);
  const story = posts.filter(m => !m.parent && time(m) >= now - WEEK && clean(m.body))
    .sort((a, b) => time(b) - time(a))[0];
  if (!story) return null;
  const paragraphs = [];
  let used = 0, more = false;
  for (const part of clean(story.body).split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)) {
    if (paragraphs.length && used + part.length > PREVIEW) { more = true; break; }
    paragraphs.push(part.length > PREVIEW ? part.slice(0, PREVIEW - 1).replace(/\s+\S*$/, '') + '…' : part);
    used += part.length;
    if (part.length > PREVIEW) { more = true; break; }
  }
  const replies = posts.filter(m => m.parent === story.id).length;
  return {
    id: story.id, at: story.at, title: title || null, paragraphs, more,
    by: String(story.from?.name || 'Someone').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Someone',
    href: roomLink(story.id), replies,
    // Replies under the story are how readers say which part was unclear.
    replyHref: roomLink(story.id),
  };
}
