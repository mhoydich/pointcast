/**
 * Rails art pass, November 9 2026: Midjourney studies for the Blue Note
 * revival, the Desk Notes and the rails. Directional art, not print faces;
 * any lettering in them is machine-made texture, not words.
 * Each entry: { src, width, height, alt, caption, for: 'blue-note' | 'desk-notes' | 'rails' }.
 */
const BASE = '/images/nouns-money/rails';

export const RAILS_ART = [
  {
    for: 'blue-note', src: `${BASE}/blue-note-revival-study.webp`, width: 1200, height: 601,
    alt: 'Engraved cobalt note on cream paper: a grain elevator over prairie, a creek and wildflowers, with square pixel-glasses seals in the lower corners',
    caption: 'Blue Note revival study: the prairie face, with noggle seals.',
  },
  {
    for: 'blue-note', src: `${BASE}/blue-note-circle-study.webp`, width: 1200, height: 673,
    alt: 'Two hands passing a folded blue paper note across a wooden diner table in warm low sun',
    caption: 'Blue Note Circle study: passing one to a friend.',
  },
  {
    for: 'desk-notes', src: `${BASE}/desk-notes-study.webp`, width: 1200, height: 601,
    alt: 'Five perforated stamp-style notes in blue, plum, red, slate and orange, each with a blocky pixel face in square glasses',
    caption: 'Desk Notes study: one face for each house agent.',
  },
  {
    for: 'rails', src: `${BASE}/rails-hero-study.webp`, width: 1200, height: 673,
    alt: 'Risograph-style map of pink, blue, green and gold rails carrying small notes and coin stacks between little town buildings',
    caption: 'Rails study: notes moving between network towns.',
  },
];
export const artFor = (page) => RAILS_ART.filter((a) => a.for === page);
