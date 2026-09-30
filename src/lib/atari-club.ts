/** Shared public rules. No account identifiers or client-awarded badges. */
export const CLUB_CHANNELS = ['general', 'memories', 'workshop'] as const;
export type ClubChannel = typeof CLUB_CHANNELS[number];
export const CLUB_POST_LIMIT = 1000;
export const CLUB_BADGES = [
  { id: 'first-carrier', name: 'First Carrier', description: 'Join the Death Star Computer Club.' },
  { id: 'first-transmission', name: 'First Transmission', description: 'Send your first board message.' },
  { id: 'night-shift', name: 'Night Shift', description: 'Check in on three different days.' },
  { id: 'pixel-builder', name: 'Pixel Builder', description: 'Share your first workshop message.' },
] as const;

export class ClubError extends Error {
  status: number;
  code: string;
  retryAfter?: number;
  constructor(status: number, code: string, message: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export function clubChannel(value: unknown): ClubChannel {
  if (typeof value !== 'string' || !CLUB_CHANNELS.includes(value as ClubChannel)) {
    throw new ClubError(400, 'invalid-channel', 'Choose General, Memories, or Workshop.');
  }
  return value as ClubChannel;
}

export function clubHandle(value: unknown, director = false): string {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{2,19}$/.test(value)) {
    throw new ClubError(400, 'invalid-handle', 'Use 3–20 letters, numbers, underscores, or dashes. Start with a letter.');
  }
  const key = value.toLowerCase().replace(/[_-]/g, '');
  const reserved = ['freddie', 'admin', 'administrator', 'moderator', 'sysop', 'pointcast', 'deathstar', 'system'];
  if (reserved.includes(key) || (key === 'overlord' && !director)) {
    throw new ClubError(409, 'reserved-handle', 'That handle is reserved. Please choose another.');
  }
  return value;
}

export function clubBody(value: unknown): string {
  if (typeof value !== 'string') throw new ClubError(400, 'invalid-message', 'Write a message before sending.');
  const text = value.replace(/\r\n?/g, '\n').trim();
  if (!text || text.length > CLUB_POST_LIMIT || text.split('\n').length > 16) {
    throw new ClubError(400, 'invalid-message', 'Write 1–1000 characters in no more than 16 lines.');
  }
  if (/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(text)) {
    throw new ClubError(400, 'invalid-message', 'Remove hidden control characters from your message.');
  }
  // Posts are plain text. Reject markup; clients must still render textContent.
  if (/[<>]/.test(text)) throw new ClubError(400, 'invalid-message', 'Use plain text without angle brackets or HTML.');
  return text;
}

export function clubDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
