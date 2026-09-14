export const GET = () => Response.json({
  name: 'Shwa — a little room for possibility', url: 'https://pointcast.xyz/shwa/',
  description: 'A scene for voice conversations, images, cited research, and interactive ideas.',
  agent: 'Shwa', platform: 'web, with a desktop conversation board',
  capabilities: ['two-minute AI voice calls', 'live captions', 'conversation board with pin and undo', 'five-human invite rooms with a shared text board and live votes', 'per-person AI resource preferences', 'Studio, Grid, Reading and Radio backgrounds', 'voice-reactive radio visualization', 'local-only microphone preview', 'image generation', 'cited research', 'PointCast session restore', 'optional Spotify player', 'reviewed x402 wallet payments'],
  collaboration: { endpoint: 'https://pointcast-shwa-rooms.mhoydich.workers.dev', seats: 5, retentionHours: 24, invite: 'URL fragment capability', resources: ['house', 'own', 'x402'], aiBillingConnected: false },
  auth: { provider: 'PointCast', endpoint: '/api/auth/session', requiredForVoiceTrial: false, connections: '/me' },
  constraints: ['Capped public voice trial; availability is reported at runtime.', 'Images and research require a call and an explicit click.', 'Spotify requires separate consent; playback and metadata are not sent to the AI.', 'No background calling, phone number, native app, or group audio/video calls.', 'Wallet signatures stay with the visitor.', 'Resource preferences do not connect AI credentials or fund a room balance.'],
  privacy: 'Audio and conversation-derived work are processed by OpenAI. Personal captions, images, and canvas pieces stay in this page. Explicit shared-room contributions are stored for 24 hours and readable by anyone with the invite link. Discuss with Shwa selects shared text for OpenAI context.',
});
