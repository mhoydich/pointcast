import type { APIRoute } from 'astro';
import { clubArt } from '../../data/atari-club-art';
import { CLUB_BADGES, CLUB_CHANNELS } from '../../lib/atari-club';

export const GET: APIRoute = () => new Response(JSON.stringify({
  schema: 'pointcast.death-star-club/v1',
  name: 'Death Star Computer Club',
  url: 'https://pointcast.xyz/atari-bbs/club/',
  board: '/api/atari-club',
  membership: 'Voluntary; existing PointCast sign-in required. Handles and messages are public.',
  channels: CLUB_CHANNELS,
  badges: CLUB_BADGES,
  checkinTimezone: 'America/Los_Angeles',
  artwork: clubArt,
  artworkNote: 'Ten new AI-assisted designs inspired by ten distinct images in Michael Hoydich’s Midjourney archive. Reference titles are archive metadata; linked images identify the actual references. Gear images are concepts. Art cards are free downloads.',
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
