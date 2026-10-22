import type { ShrineSound } from '../lib/small-shrines-audio';

export const SHRINE_DURATION = 60;

export type SmallShrine = {
  id: string;
  title: string;
  number: string;
  kicker: string;
  invitation: string;
  focus: string;
  image: string;
  alt: string;
  color: string;
  audioMode: ShrineSound;
  credit: string;
  sourceUrl: string;
  phases: { at: number; label: string; text: string }[];
};

/** Space names and meditations are original editorial work, not titles supplied by the artists. */
export const SHRINES: SmallShrine[] = [
  {
    id: 'ocean',
    title: 'Ocean',
    number: '01',
    kicker: 'A little more room',
    invitation: 'Let the horizon hold the faraway things.',
    focus: 'The line where water meets sky.',
    image: '/images/small-shrines/ocean.webp',
    alt: 'A pale stone alcove opens toward a quiet sea at dawn, with a small ceramic bowl in the foreground.',
    color: '#607d82',
    audioMode: 'tide',
    credit: 'Original artwork · OpenAI image_gen',
    sourceUrl: '/images/small-shrines/provenance.json',
    phases: [
      {
        at: 0,
        label: 'Arrive',
        text: 'Let your eyes rest on the horizon, or on an ordinary object beside you. Notice where you are supported. There is no special way to sit here.',
      },
      {
        at: 15,
        label: 'Notice',
        text: 'Look at the space between the bowl and the sea. Both can belong in one view. Let your breathing continue in its own familiar rhythm, without changing it.',
      },
      {
        at: 30,
        label: 'Stay',
        text: 'If a thought arrives, it can stay at the edge of the picture. You do not need to finish it. Find one small difference between two nearby colors.',
      },
      {
        at: 45,
        label: 'Return',
        text: 'Bring your attention to the room around you. Notice one sound, then the surface beneath your hands. Take this small amount of space into whatever you choose next.',
      },
    ],
  },
  {
    id: 'garden',
    title: 'Garden',
    number: '02',
    kicker: 'Nothing to hurry',
    invitation: 'Stay with one small thing that grows.',
    focus: 'A leaf against a field of color.',
    image: '/images/small-shrines/garden.webp',
    alt: 'A delicate tree and a small potted plant sit among geometric planes of soft pink, yellow, green, and blue.',
    color: '#617453',
    audioMode: 'drone',
    credit: 'Michael Hoydich · Midjourney',
    sourceUrl: 'https://www.midjourney.com/jobs/cfb27c2e-d562-47db-9761-4d2e41be10a3?index=2',
    phases: [
      {
        at: 0,
        label: 'Arrive',
        text: 'Keep your eyes open if you like. Choose one leaf in the picture, or one shape nearby. You can give it a little attention without needing to name it.',
      },
      {
        at: 15,
        label: 'Notice',
        text: 'Follow the edge of that shape slowly with your eyes. Notice where it meets another color. The rest of the garden can remain unfinished in your attention.',
      },
      {
        at: 30,
        label: 'Stay',
        text: 'Let your gaze widen to include the plant and the space around it. Nothing needs to grow faster during this minute. Your breathing can keep its ordinary pace.',
      },
      {
        at: 45,
        label: 'Return',
        text: 'Find a shape in your own room that you had not noticed before. Let it be enough for now. When you are ready, turn toward your next small task.',
      },
    ],
  },
  {
    id: 'night',
    title: 'Night',
    number: '03',
    kicker: 'A light left on',
    invitation: 'You can leave a few things for tomorrow.',
    focus: 'The quiet circle of lantern light.',
    image: '/images/small-shrines/night.webp',
    alt: 'An indigo courtyard holds a small amber lantern beneath a large pale moon, with textured walls and deep blue shadows.',
    color: '#7772a0',
    audioMode: 'bowl',
    credit: 'Original artwork · OpenAI image_gen',
    sourceUrl: '/images/small-shrines/provenance.json',
    phases: [
      {
        at: 0,
        label: 'Arrive',
        text: 'Rest your eyes on the lantern, or another steady object near you. You can stay exactly where you are. Notice the contact between your feet and their support.',
      },
      {
        at: 15,
        label: 'Notice',
        text: 'Look for the place where warm light becomes blue shadow. There is no sharp boundary to find. Let your eyes move at a pace that feels comfortable.',
      },
      {
        at: 30,
        label: 'Stay',
        text: 'A list may still be running through your mind. It does not have to disappear. Let the lantern share your attention with it, just for a few ordinary moments.',
      },
      {
        at: 45,
        label: 'Return',
        text: 'Notice the actual light around you, whether it is morning or evening. Let your gaze travel beyond the screen. Choose one thing to return to, and leave the rest.',
      },
    ],
  },
  {
    id: 'memory',
    title: 'Memory',
    number: '04',
    kicker: 'Keep the small things',
    invitation: 'An ordinary detail can be worth keeping.',
    focus: 'A fine stem crossing a pale rectangle.',
    image: '/images/small-shrines/memory.webp',
    alt: 'Fine botanical line drawings cross translucent pale yellow and lavender geometric shapes on a light background.',
    color: '#987d6c',
    audioMode: 'pulse',
    credit: 'Michael Hoydich · Midjourney',
    sourceUrl: 'https://www.midjourney.com/jobs/56c71940-c990-4346-b0c6-4f0b805ab209?index=2',
    phases: [
      {
        at: 0,
        label: 'Arrive',
        text: 'Look at a line in the artwork, or a familiar object near you. Keep your eyes open if you prefer. Let your breathing happen without giving it a task.',
      },
      {
        at: 15,
        label: 'Notice',
        text: 'If you like, remember one ordinary pleasant detail: a cup, a window, a patch of sunlight. If nothing comes to mind, stay with the colors in front of you.',
      },
      {
        at: 30,
        label: 'Stay',
        text: 'You do not need the whole story. A color or texture can be enough. If remembering feels unwelcome, return to the stem and the space beside it.',
      },
      {
        at: 45,
        label: 'Return',
        text: 'Notice something present that you might want to remember later. It can be very small. Let your attention return to the room, and carry only what you choose.',
      },
    ],
  },
];
