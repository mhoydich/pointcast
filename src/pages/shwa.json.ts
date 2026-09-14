export const GET = () => Response.json({
  name: 'Shwa — a little room for possibility', url: 'https://pointcast.xyz/shwa/',
  description: 'A scene for voice conversations, images, cited research, and interactive ideas.',
  agent: 'Shwa', platform: 'mobile-first web',
  capabilities: ['two-minute AI voice calls', 'live captions', 'conversation canvas', 'image generation', 'cited research', 'PointCast session restore', 'optional Spotify player', 'reviewed x402 wallet payments'],
  auth: { provider: 'PointCast', endpoint: '/api/auth/session', requiredForVoiceTrial: false, connections: '/me' },
  constraints: ['Capped public voice trial; availability is reported at runtime.', 'Images and research require a call and an explicit click.', 'Spotify requires separate consent; playback and metadata are not sent to the AI.', 'No background calling, phone number, native app, or multiplayer voting.', 'Wallet signatures stay with the visitor.'],
  privacy: 'Audio and conversation-derived work are processed by OpenAI. Captions, images, and canvas pieces stay in this page and clear with a new call.',
});
