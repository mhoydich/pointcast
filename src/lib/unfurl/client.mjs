/**
 * Which app is unfurling a card, from the crawler's User-Agent.
 *
 * iMessage's LinkPresentation fetcher announces itself as both
 * facebookexternalhit and Twitterbot, so it has to be checked before either.
 * Returns '' for ordinary browsers and anything unrecognised.
 */
const CLIENTS = [
  ['imessage', (ua) => /facebookexternalhit/i.test(ua) && /Twitterbot/i.test(ua)],
  ['slack', (ua) => /Slack(bot|-ImgProxy)/i.test(ua)],
  ['discord', (ua) => /Discordbot/i.test(ua)],
  ['telegram', (ua) => /TelegramBot/i.test(ua)],
  ['whatsapp', (ua) => /WhatsApp/i.test(ua)],
  ['linkedin', (ua) => /LinkedInBot/i.test(ua)],
  ['bluesky', (ua) => /Bluesky|cardyb/i.test(ua)],
  ['mastodon', (ua) => /Mastodon|Pleroma|Akkoma|Misskey/i.test(ua)],
  ['signal', (ua) => /Signal/i.test(ua)],
  ['x', (ua) => /Twitterbot/i.test(ua)],
  ['facebook', (ua) => /facebookexternalhit|Facebot|meta-externalagent/i.test(ua)],
  ['google', (ua) => /Googlebot|Google-InspectionTool|GoogleOther/i.test(ua)],
  ['agent', (ua) => /Claude|ClaudeBot|anthropic|GPTBot|ChatGPT|OAI-SearchBot|PerplexityBot|Applebot/i.test(ua)],
];

export function unfurlClient(userAgent = '') {
  const ua = String(userAgent || '');
  if (!ua) return '';
  for (const [id, test] of CLIENTS) if (test(ua)) return id;
  return '';
}
