import { OUTDOOR_RESOURCES } from './radius25-outdoors.ts';

export const PASS_25 = {
  id: 'PC-BEACH-COMMONS-V18-PASS-25',
  title: 'PASS/25',
  subtitle: 'Same Park, Many Worlds',
  dek: 'A manual, many-view outdoor passport: twenty-five public doors, six ways of looking, twenty-four stamps, twelve treasure routes, four tiny sound companions, and no location trail.',
  url: 'https://pointcast.xyz/beach-commons/v18/passport',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v18/passport.json',
  blockUrl: 'https://pointcast.xyz/b/0558',
  fieldStudy: '018.D',
  publishedAt: '2026-08-03',
  updatedAt: '2026-08-03T21:39:00-07:00',
  center: 'El Segundo, California',
  radius: 'roughly 25 straight-line miles',
} as const;

export const PASSPORT_LENSES = [
  { id: 'player', number: '01', title: 'Player', mark: '○', color: '#e85d3f', premise: 'The place is a field of fair invitations.', prompt: 'Find a line, boundary, rhythm, or object that can hold a cooperative game without blocking anyone.' },
  { id: 'artist', number: '02', title: 'Artist', mark: '✦', color: '#f2ad3d', premise: 'The place is a composition already in progress.', prompt: 'Find one repeated form, one surprise color, and one edge you would draw without touching.' },
  { id: 'naturalist', number: '03', title: 'Naturalist', mark: '⌇', color: '#4f795e', premise: 'The place is habitat, not backdrop.', prompt: 'Notice evidence of water, shelter, food, movement, or season. Collect the observation; leave the source.' },
  { id: 'neighbor', number: '04', title: 'Neighbor', mark: '+', color: '#d87958', premise: 'The place is shared before you arrive.', prompt: 'Notice who maintains, uses, crosses, waits, or makes room. Name one small courtesy that improves the commons.' },
  { id: 'quiet', number: '05', title: 'Quiet walker', mark: '—', color: '#69797b', premise: 'The place is an interval, not a task.', prompt: 'Choose a short out-and-back, a seat, or a long view. Let the slowest comfortable pace be correct.' },
  { id: 'listener', number: '06', title: 'Sound listener', mark: '⌁', color: '#287e9b', premise: 'The place has foreground, rhythm, and distance.', prompt: 'Hear the nearest sound, a repeating sound, and the farthest sound. No recording is required.' },
] as const;

export const PASSPORT_STAMPS = [
  { id: 'first-light', family: 'morning', mark: '◒', title: 'First Light', test: 'Arrive before the place feels fully started.' },
  { id: 'marine-layer', family: 'morning', mark: '≋', title: 'Marine Layer', test: 'Find a softened horizon or cool gray color.' },
  { id: 'first-lap', family: 'morning', mark: '↝', title: 'First Lap', test: 'Complete one unhurried loop or out-and-back.' },
  { id: 'open-gate', family: 'morning', mark: '□', title: 'Open Gate', test: 'Confirm the official door and current conditions.' },
  { id: 'court-line', family: 'motion', mark: '⌗', title: 'Court Line', test: 'Use one existing line to invent a fair rule.' },
  { id: 'clean-rally', family: 'motion', mark: '○', title: 'Clean Rally', test: 'Complete ten cooperative touches.' },
  { id: 'slowest-lap', family: 'motion', mark: '∞', title: 'Slowest Lap', test: 'Move together without hurrying the group.' },
  { id: 'good-turn', family: 'motion', mark: '↻', title: 'Good Turn', test: 'Make turns obvious and easy to join.' },
  { id: 'five-colors', family: 'noticing', mark: '✦', title: 'Five Colors', test: 'Name five colors from five different sources.' },
  { id: 'shadow-form', family: 'noticing', mark: '△', title: 'Shadow Form', test: 'Trace one shadow shape in the air.' },
  { id: 'public-art', family: 'noticing', mark: '◇', title: 'Public Art', test: 'Read or study one public work without climbing.' },
  { id: 'garden-line', family: 'noticing', mark: '⌇', title: 'Garden Line', test: 'Follow one plant form with your eyes or pencil.' },
  { id: 'bird-minute', family: 'habitat', mark: '⌁', title: 'Bird Minute', test: 'Count directions of bird sound for one minute.' },
  { id: 'water-sign', family: 'habitat', mark: '≈', title: 'Water Sign', test: 'Notice water, drainage, tide, pond, mist, or thirst.' },
  { id: 'leave-it', family: 'habitat', mark: '·', title: 'Leave It There', test: 'Admire something tempting and leave it exactly there.' },
  { id: 'habitat-edge', family: 'habitat', mark: '╱', title: 'Habitat Edge', test: 'Notice where two kinds of ground or growth meet.' },
  { id: 'shared-seat', family: 'social', mark: '+', title: 'Shared Seat', test: 'Use a seat without making it unavailable to others.' },
  { id: 'small-courtesy', family: 'social', mark: '♥', title: 'Small Courtesy', test: 'Make one access, noise, litter, or turn-taking choice better.' },
  { id: 'good-handoff', family: 'social', mark: '⇢', title: 'Good Handoff', test: 'Pass a ball, idea, tool, or local fact onward.' },
  { id: 'count-out', family: 'social', mark: '✓', title: 'Count Out', test: 'Leave with every person and object accounted for.' },
  { id: 'long-view', family: 'evening', mark: '—', title: 'Long View', test: 'Name five depths from near to far.' },
  { id: 'west-color', family: 'evening', mark: '◐', title: 'West Color', test: 'Notice the day change color without chasing a photo.' },
  { id: 'quiet-close', family: 'evening', mark: '…', title: 'Quiet Close', test: 'End with one minute of shared or private quiet.' },
  { id: 'pack-light', family: 'evening', mark: '↑', title: 'Pack Light', test: 'Leave cleaner, earlier, and with energy in reserve.' },
] as const;

export const TREASURE_ROUTES = [
  { id: 'one-line', number: '01', title: 'The One-Line Hunt', time: '15–30 min', company: '1–8', lenses: ['player', 'artist'], stamps: ['court-line', 'garden-line'], prompt: 'Find three useful lines: one painted, one grown, one made by light. Use none as a reason to cross a closed boundary.', proof: 'Describe the three lines in twelve words.' },
  { id: 'five-depths', number: '02', title: 'Five Depths', time: '8 min', company: '1–20', lenses: ['quiet', 'artist'], stamps: ['long-view', 'west-color'], prompt: 'Choose the longest safe view. Name foreground, near, middle, far, and beyond.', proof: 'Keep the five nouns, in order.' },
  { id: 'sound-layers', number: '03', title: 'Three-Layer Sound Map', time: '10 min', company: '1–10', lenses: ['listener', 'naturalist'], stamps: ['bird-minute', 'quiet-close'], prompt: 'Find the nearest, repeating, and farthest sound. Walk one minute and try again.', proof: 'Make two three-word sound postcards.' },
  { id: 'welcome-test', number: '04', title: 'The Welcome Test', time: '12 min', company: '2–8', lenses: ['neighbor', 'quiet'], stamps: ['open-gate', 'small-courtesy'], prompt: 'Find three details that make arrival easier and one friction that could be fixed without redesigning the world.', proof: 'Name one courtesy you can perform now.' },
  { id: 'habitat-five', number: '05', title: 'Habitat Five', time: '15 min', company: '1–8', lenses: ['naturalist'], stamps: ['water-sign', 'habitat-edge'], prompt: 'Look for evidence of water, food, shelter, movement, and season without approaching wildlife.', proof: 'Remember one example of each; collect nothing.' },
  { id: 'ten-touch', number: '06', title: 'Ten-Touch Door', time: '10–20 min', company: '2–12', lenses: ['player', 'neighbor'], stamps: ['clean-rally', 'good-turn'], prompt: 'Create a cooperative rally with one soft object or only a movement phrase. Widen after ten clean touches.', proof: 'Finish on the group’s cleanest rally.' },
  { id: 'shade-clock', number: '07', title: 'Shade Clock', time: '12 min', company: '1–6', lenses: ['artist', 'naturalist'], stamps: ['shadow-form', 'marine-layer'], prompt: 'Find three shadows with different edges. Predict which will change fastest.', proof: 'Return later only if it fits the day; compare, do not mark.' },
  { id: 'public-table', number: '08', title: 'Public Table', time: '20–45 min', company: '2–10', lenses: ['neighbor', 'player'], stamps: ['shared-seat', 'good-handoff'], prompt: 'Find a legal shared surface. Play one pocket-size game, trade one local fact, and keep space for strangers.', proof: 'Leave the surface empty and ready.' },
  { id: 'color-relay', number: '09', title: 'Color Relay', time: '12 min', company: '2–12', lenses: ['artist', 'player'], stamps: ['five-colors', 'good-handoff'], prompt: 'One person calls a color already present; the next finds a different source and calls another.', proof: 'Complete ten handoffs without picking anything.' },
  { id: 'slow-loop', number: '10', title: 'Slow Loop Society', time: '15–30 min', company: '1–10', lenses: ['quiet', 'neighbor'], stamps: ['slowest-lap', 'count-out'], prompt: 'Choose a clear short loop. Let the person needing the easiest pace set it.', proof: 'Return with everyone able to continue.' },
  { id: 'art-answer', number: '11', title: 'Art Answers Back', time: '15 min', company: '1–8', lenses: ['artist', 'neighbor'], stamps: ['public-art', 'small-courtesy'], prompt: 'Find a public artwork, memorial, garden, or designed form. Read its context, then answer with a pose, line, or sentence.', proof: 'Do not touch, climb, attach, or leave the response.' },
  { id: 'good-ending', number: '12', title: 'The Good Ending', time: '8 min', company: '1–20', lenses: ['quiet', 'listener', 'neighbor'], stamps: ['quiet-close', 'pack-light'], prompt: 'Stop before fatigue or closing chooses for you. Hear one last sound, count people and equipment, and go.', proof: 'Leave no unfinished object behind.' },
] as const;

export const AUDIO_COMPANIONS = [
  { id: 'dawn', number: '01', title: 'Dawn Buoys', seconds: 24, colors: ['#d7e6dc', '#f2ad3d'], notes: [220, 277.18, 329.63, 415.3], tempo: 145, note: 'Four soft bells for the first public door.' },
  { id: 'court', number: '02', title: 'Court Lines', seconds: 20, colors: ['#e85d3f', '#f3e9cf'], notes: [196, 246.94, 293.66, 369.99], tempo: 112, note: 'A dry four-corner pulse for cooperative movement.' },
  { id: 'habitat', number: '03', title: 'Habitat Edge', seconds: 28, colors: ['#4f795e', '#a8c2a6'], notes: [164.81, 220, 246.94, 329.63], tempo: 175, note: 'Widely spaced tones that leave room for the actual place.' },
  { id: 'west', number: '04', title: 'West Color', seconds: 26, colors: ['#f2ad3d', '#8c5974'], notes: [174.61, 220, 261.63, 349.23], tempo: 154, note: 'A descending close for golden hour and pack-out.' },
] as const;

export const SPOTIFY_SERIES = [
  { id: 'dawn', number: '01', title: 'OPEN/25 — Dawn Loop', spotifyId: '0Z30r3jl6nDN0PHDcLFnoD', trackCount: 6, use: 'Marine-layer mornings and the first public door.', status: 'public', url: 'https://open.spotify.com/playlist/0Z30r3jl6nDN0PHDcLFnoD?si=f5_EnwwDREW_beVf5Ryv8g' },
  { id: 'court', number: '02', title: 'OPEN/25 — Court Lines', spotifyId: '75NLcw5qCkzUSxBi92dkDa', trackCount: 3, use: 'Rallies, skating, passing, and playful motion.', status: 'public', url: 'https://open.spotify.com/playlist/75NLcw5qCkzUSxBi92dkDa?si=lX14P4lKQhSiU56hFxodDQ' },
  { id: 'garden', number: '03', title: 'OPEN/25 — Garden Color', spotifyId: '1XRkXwhEom26CGVqM7f4vM', trackCount: 13, use: 'Gardens, sculpture, drawing, and close looking.', status: 'public', url: 'https://open.spotify.com/playlist/1XRkXwhEom26CGVqM7f4vM?si=zKf-y6xyTPK3hmFTtWHZfw' },
  { id: 'wetland', number: '04', title: 'OPEN/25 — Wetland Listening', spotifyId: '6Q6XPsPykiih2Y98gkMiuN', trackCount: 6, use: 'Slow habitat walks with room for actual sound.', status: 'public', url: 'https://open.spotify.com/playlist/6Q6XPsPykiih2Y98gkMiuN?si=TOm5JBQITQCHjFp6VeOuow' },
  { id: 'golden', number: '05', title: 'OPEN/25 — Golden Hour Handoff', spotifyId: '1FXBoUCfVC2ivXugmI2Cs4', trackCount: 6, use: 'The move from afternoon games into sunset.', status: 'public', url: 'https://open.spotify.com/playlist/1FXBoUCfVC2ivXugmI2Cs4?si=bwGspnryS6aMj65n6stiFg' },
  { id: 'fire', number: '06', title: 'OPEN/25 — Fire Ring Night', spotifyId: '68Pw7sw6gRGfpSaZAOfx5R', trackCount: 15, use: 'Legal designated rings, current conditions, warm pack-out.', status: 'public', url: 'https://open.spotify.com/playlist/68Pw7sw6gRGfpSaZAOfx5R?si=S_Rb_cFESM-nh2pz0e3-SQ' },
] as const;

export const PINTEREST_BOARDS = [
  { id: 'marine', number: '01', title: 'OPEN/25 — Marine Layer Mornings', season: 'Spring air', area: 'Near coast + center', color: '#cbdedc', accent: '#287e9b', count: 13, status: 'public', url: 'https://www.pinterest.com/hoydich/open25-marine-layer-mornings/' },
  { id: 'court', number: '02', title: 'OPEN/25 — Court Heat + Social Fields', season: 'Summer motion', area: 'Courts + fields', color: '#ee7655', accent: '#642f26', count: 13, status: 'public', url: 'https://www.pinterest.com/hoydich/open25-court-heat-%2B-social-fields/' },
  { id: 'habitat', number: '03', title: 'OPEN/25 — Garden Color + Habitat', season: 'Fall detail', area: 'Gardens + preserves', color: '#79946c', accent: '#f0bd4e', count: 12, status: 'public', url: 'https://www.pinterest.com/hoydich/open25-garden-color-%2B-habitat/' },
  { id: 'west', number: '04', title: 'OPEN/25 — Golden Hour + Quiet Coast', season: 'Winter light', area: 'Hills + horizon', color: '#e2a64a', accent: '#513c55', count: 12, status: 'public', url: 'https://www.pinterest.com/hoydich/open25-golden-hour-%2B-quiet-coast/' },
] as const;

const BOARD_BY_RESOURCE: Record<string, string> = {
  center: 'marine', 'south-bay': 'court', westside: 'marine', hills: 'west', 'north-arc': 'west', 'south-arc': 'habitat',
};
const boardCounts: Record<string, number> = { marine: 0, court: 0, habitat: 0, west: 0 };

export const PINTEREST_PINS = OUTDOOR_RESOURCES.flatMap((resource, index) => {
  const primary = BOARD_BY_RESOURCE[resource.arc] || 'marine';
  const alternate = resource.modes.includes('nature') ? 'habitat' : resource.modes.includes('court') || resource.modes.includes('field') ? 'court' : index % 2 ? 'west' : 'marine';
  return [primary, alternate].map((candidate, viewIndex) => {
    let board = candidate;
    if (boardCounts[board] >= (PINTEREST_BOARDS.find((item) => item.id === board)?.count || 0)) {
      board = PINTEREST_BOARDS.find((item) => boardCounts[item.id] < item.count)?.id || board;
    }
    boardCounts[board] += 1;
    const lens = PASSPORT_LENSES[(index * 2 + viewIndex) % PASSPORT_LENSES.length];
    const stamp = PASSPORT_STAMPS[(index * 2 + viewIndex) % PASSPORT_STAMPS.length];
    return {
      id: String(index * 2 + viewIndex + 1).padStart(2, '0'),
      board,
      resourceId: resource.id,
      resource: resource.name,
      city: resource.city,
      lensId: lens.id,
      lens: lens.title,
      stampId: stamp.id,
      stamp: stamp.title,
      title: `${resource.name} · ${lens.title} view`,
      description: `${lens.prompt} Try for the ${stamp.title} stamp. Check the official steward before leaving; observe without collecting or altering. Independent PointCast field prompt.`,
      prompt: viewIndex === 0 ? lens.prompt : stamp.test,
      destination: 'https://pointcast.xyz/beach-commons/v18/passport',
      image: `/beach-commons/v18/passport/pins/pass-25-${String(index * 2 + viewIndex + 1).padStart(2, '0')}.png`,
    };
  });
});

export const PASSPORT_DOORS = OUTDOOR_RESOURCES.map((resource) => ({
  id: resource.id,
  number: resource.number,
  name: resource.name,
  city: resource.city,
  arc: resource.arc,
  band: resource.band,
  modes: resource.modes,
  source: resource.source,
  sourceLabel: resource.sourceLabel,
  check: resource.check,
}));
