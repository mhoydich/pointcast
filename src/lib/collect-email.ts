export const COLLECT_ORIGIN = 'https://pointcast.xyz';
export const COLLECT_EMAIL_FROM = 'kennel@pointcast.xyz';
export const COLLECT_TIME_ZONE = 'America/Los_Angeles';
export const COLLECT_CONFIRM_TTL_SECONDS = 60 * 60 * 24;
export const COLLECT_CONFIRM_PREFIX = 'collect-confirm:';

export type DailyEmailContent = { subject: string; text: string; html: string };
export type DailyEmailSitting = {
  day: number;
  name: string;
  breed: string;
  title: string;
  image: { png: string };
};

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function dailyEntryUrl(token: string): string {
  const url = new URL('/k/today', COLLECT_ORIGIN);
  url.searchParams.set('claim', '1');
  url.searchParams.set('t', token);
  return url.toString();
}

export function unsubscribeUrl(token: string): string {
  const url = new URL('/api/collect/unsubscribe', COLLECT_ORIGIN);
  url.searchParams.set('t', token);
  return url.toString();
}

export function confirmationUrl(token: string): string {
  const url = new URL('/api/collect/confirm', COLLECT_ORIGIN);
  url.searchParams.set('token', token);
  return url.toString();
}

export function confirmationEmail(link: string): DailyEmailContent {
  const safeLink = escapeHtml(link);
  return {
    subject: 'Confirm your dog-a-day delivery',
    text: `Confirm that you want one Kennel Club note each day:\n\n${link}\n\nThe link expires in 24 hours. Nothing is sent until you confirm.`,
    html: `<div style="margin:0 auto;max-width:560px;padding:32px 20px;font-family:Arial,sans-serif;color:#171717"><p style="font:12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a2432">PointCast · Kennel Club</p><h1 style="font-size:34px;font-weight:500;line-height:1.05">Confirm a dog a day.</h1><p>One note at midnight Pacific when tomorrow’s free sitting is ready.</p><p style="margin:28px 0"><a href="${safeLink}" style="display:inline-block;background:#8a2432;color:#fff;padding:14px 18px;text-decoration:none">Confirm dog-a-day delivery</a></p><p style="color:#686868;font-size:13px">Nothing is sent until you confirm. This link expires in 24 hours.</p></div>`,
  };
}

export function dailyEmail(sitting: DailyEmailSitting, token: string): DailyEmailContent {
  const sittingNumber = String(sitting.day).padStart(2, '0');
  const claimLink = dailyEntryUrl(token);
  const leaveLink = unsubscribeUrl(token);
  const plate = new URL(sitting.image.png, COLLECT_ORIGIN).toString();
  const safeClaim = escapeHtml(claimLink);
  const safeLeave = escapeHtml(leaveLink);
  const safeName = escapeHtml(sitting.name);
  const safeBreed = escapeHtml(sitting.breed);
  const safePlate = escapeHtml(plate);
  return {
    subject: `Sitting ${sittingNumber} · ${sitting.name} is ready`,
    text: `Sitting ${sittingNumber} · ${sitting.name} is ready\n${sitting.breed} · ${sitting.title}\n\nClaim ${sitting.name} — free:\n${claimLink}\n\nUnsubscribe: ${leaveLink}`,
    html: `<div style="margin:0 auto;max-width:620px;padding:24px 16px;font-family:Arial,sans-serif;color:#171717"><p style="font:12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a2432">Kennel Club · Sitting ${sittingNumber}</p><img src="${safePlate}" width="588" alt="${safeName}, ${safeBreed}" style="display:block;width:100%;height:auto;border:1px solid #171717"><h1 style="margin:24px 0 8px;font-size:42px;font-weight:500;line-height:1">${safeName} is ready.</h1><p style="margin:0;color:#555">${safeBreed} · ${escapeHtml(sitting.title)}</p><p style="margin:28px 0"><a href="${safeClaim}" style="display:inline-block;background:#8a2432;color:#fff;padding:15px 20px;text-decoration:none">Claim ${safeName} — free</a></p><p style="font-size:12px;color:#777">You asked PointCast to email you when each dog is ready. <a href="${safeLeave}" style="color:#777">Unsubscribe</a>.</p></div>`,
  };
}

