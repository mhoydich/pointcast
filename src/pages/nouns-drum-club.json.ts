import type { APIRoute } from 'astro';
import { PAD_DEFINITIONS } from '../lib/nouns-drum-club-audio';
import { SCORE_PRESET_OPTIONS } from '../lib/nouns-drum-club-score';

const base = 'https://pointcast.xyz';

export const GET: APIRoute = () => {
  const payload = {
    schema: 'pointcast.playable/v1',
    id: 'nouns-drum-club',
    title: 'Nouns Drum Club',
    description: 'A playful browser drum room: play a full keyboard beneath a reactive Noun band, build a loop, and join a shared live room without an account.',
    human: `${base}/nouns/drum-club/`,
    json: `${base}/nouns-drum-club.json`,
    status: 'playable',
    participation: { account: false, wallet: false, browserAudio: true, sharedRoom: true },
    features: ['36-key synthesized instrument', '16-step local loop sequencer', 'quantized overdub', 'three starter grooves', 'tempo and swing', 'shareable beat links', 'shared live rooms', 'reactive Noun band', 'three visual scenes', 'reduced-motion mode'],
    controls: { keyboard: '1–0 drums; Q–P bass; A–L mallets; Z–M chords and sparkle; Shift plays softly; Space toggles the loop; Escape stops.', touch: 'Tap the visible pads. On phones each sound family expands into larger touch targets.' },
    pads: PAD_DEFINITIONS,
    presets: SCORE_PRESET_OPTIONS,
    bandmates: { human: `${base}/nouns/drum-club/bandmates/`, count: 12, status: 'not-minted', kit: `${base}/images/nouns-drum-club/bandmates/bandmates-kit.zip`, metadataTemplate: `${base}/nouns/drum-club/bandmates/metadata/{catalogId}.json`, note: 'Twelve companion artworks with playable scores. No contract, mint, or purchase is required to play.' },
    campaign: { id: 'PC-NOUNS-EVERYBODY-2026', human: `${base}/nouns/drum-club/campaign/`, manifest: `${base}/ads/nouns-drum-club/campaign.json`, kit: `${base}/ads/nouns-drum-club/campaign-kit.zip`, concepts: 3, formats: 10, assets: 30, audio: 'none' },
    loops: { steps: 16, tempo: {min:60,max:180}, storage:'this browser only', sharing:'The beat query parameter carries the score; opening a link never autoplays it.' },
    rooms: { joining:'Explicit Join action; no account or microphone.', invite:'room query parameter', transport:'WebSocket via /api/drum/room', shared:'Live played keys and reactions', local:'Loop playback and edits stay on each device.', timing:'Best-effort live notes; network latency applies.' },
    assets: { nounArtwork: 'https://noun.pics/23.svg', localNounArtwork: `${base}/games/nouns-nation-battler/assets/noun-23.svg`, licenseNote: 'Nouns artwork is CC0; see noun.pics.' },
    discovery: { block: `${base}/b/0604`, nouns: `${base}/nouns/`, drumDirectory: `${base}/drum-directory.json`, play: `${base}/play.json`, apps: `${base}/apps`, agents: `${base}/agents.json` },
    boundaries: ['Room presence is session-based and does not require an account.', 'Audio starts only after a visitor interacts with the instrument.', 'This page does not claim a recorded performance, audience count, or persistent identity.'],
  };
  return new Response(JSON.stringify(payload, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } });
};
