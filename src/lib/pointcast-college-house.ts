export type CollegeHousePlate = {
  id: string;
  number: string;
  moment: string;
  title: string;
  image: string;
  alt: string;
  caption: string;
  essay: readonly string[];
  midjourneyJobId: string;
  midjourneyIndex: number;
  model: string;
  promptSummary: string;
};

export const HOUSE_WE_BORROWED = {
  spec: 'pointcast.college-football.house-we-borrowed/v1',
  title: 'THE HOUSE WE BORROWED',
  subtitle: 'An ode to college, seen from the room where friendship became a daily practice.',
  kicker: 'PointCast College Football · House Desk 001',
  issue: '001',
  issueName: "TALKIN' SEASON",
  publishedAt: '2026-07-28T11:09:00-07:00',
  canonical: 'https://pointcast.xyz/25/magazine/the-house-we-borrowed',
  machineEdition: 'https://pointcast.xyz/25/magazine/the-house-we-borrowed.json',
  magazine: 'https://pointcast.xyz/25/magazine',
  block: '0533',
  readingTime: '9 min',
  thesis:
    'For four years, the house behaved like it had always known us. It had not. It was lending us the furniture, the noise, the work, and one another.',
  standfirst:
    'College is often sold as a credential and remembered as a feeling. From the fraternity house, the feeling looks less like a brochure than a thousand ordinary negotiations: who has the key, who takes out the trash, who stays up, who gets welcomed, and whether inherited ritual can learn to open its door.',
  prologue: [
    'The first surprise was that the house was not symbolic. It leaked. It smelled different on every floor. The porch chair leaned left. The kitchen light made everyone look awake long after we had stopped being useful.',
    'Then the symbolic part arrived anyway. A house full of young people becomes a machine for compressing time. Breakfast, argument, study, repair, game day, heartbreak, borrowed jacket, impossible exam, somebody at the door: each event enters the same rooms until the rooms begin to feel like witnesses.',
    'This is an ode to that compression. Not to the letters on the wall, and not to the institution at its worst. To the brief experiment of living close enough that friendship has to become a practice.',
  ],
  plates: [
    {
      id: 'arrival',
      number: '01',
      moment: 'Move-in / blue hour',
      title: 'YOU ARE EIGHTEEN AND THE MAP IS WRONG.',
      image: '/images/pointcast-college-house/arrival.webp',
      alt: 'A weathered shared college house glowing at blue hour as students arrive by bicycle',
      caption:
        'The house looks permanent on the first night. That is its first illusion. Everyone inside it is arriving at once.',
      essay: [
        'College begins with a great clerical error: people who do not know who they are are given schedules, keys, and a map. The map can locate the library. It cannot tell you which room will change your life.',
        'A fraternity house offers one crude answer: start with proximity. Put the private uncertainty of eighteen or nineteen people within earshot of one another. Let the stairs announce every return. Let the porch become a border that has to be crossed on purpose.',
        'The ideal is not instant brotherhood. The ideal is enough repeated contact that performance becomes difficult and care becomes visible.',
      ],
      midjourneyJobId: 'f7c51733-83f8-48c2-8b1a-e5ad9ca7adb8',
      midjourneyIndex: 2,
      model: 'Midjourney V8.1',
      promptSummary: 'Weathered college house at blue hour; temporary social architecture; documentary film.',
    },
    {
      id: 'kitchen',
      number: '02',
      moment: '1:18 a.m. / shared kitchen',
      title: 'BROTHERHOOD IS MOSTLY CLEANUP.',
      image: '/images/pointcast-college-house/kitchen.webp',
      alt: 'College friends cooking a late meal together in a worn shared kitchen',
      caption:
        'The mythology lives in the formal room. The relationship is usually being made in the kitchen.',
      essay: [
        'From a distance, fraternity is made of ceremonies. Up close, it is made of maintenance: the trash nobody claims, the ride home, the pan left in the sink, the friend who has gone quiet.',
        'This is the unmarketable center of communal life. Someone eventually has to notice. Someone has to decide that the condition of the room is also the condition of the group.',
        'The best version of brotherhood is not loyalty without question. It is attention without applause.',
      ],
      midjourneyJobId: 'b8bf246d-bfce-42e5-bd5e-6e032685f282',
      midjourneyIndex: 2,
      model: 'Midjourney V8.1',
      promptSummary: 'Late-night shared kitchen; friends making food and coffee; tenderness through ordinary chores.',
    },
    {
      id: 'useful-room',
      number: '03',
      moment: 'Weeknight / the formal room',
      title: 'A ROOM IS ONLY AS GOOD AS WHO CAN USE IT.',
      image: '/images/pointcast-college-house/useful-room.webp',
      alt: 'A fraternity-house living room reused as a study hall, rehearsal space, pantry, and print workshop',
      caption:
        'A formal room can preserve status, or it can become a table big enough for the work in front of it.',
      essay: [
        'Inherited rooms are powerful because they arrive already explained. The portraits say who mattered. The locked cabinet says what deserves protection. The seating chart says who belongs near the center.',
        'College should be one of the places where explanation can be revised. Turn the formal room into a study hall. Put the printer beside the piano. Give a shelf to mutual aid. Let the wall hold current work instead of inherited certainty.',
        'Tradition earns another year when it becomes useful to someone it was not designed for.',
      ],
      midjourneyJobId: '03d7e77c-5610-4f27-b4df-7c8534212536',
      midjourneyIndex: 3,
      model: 'Midjourney V8.1',
      promptSummary: 'Formal room becoming study hall, rehearsal room, pantry, and print workshop.',
    },
    {
      id: 'walk',
      number: '04',
      moment: 'Saturday / the walk to the bowl',
      title: 'THE GAME BEGINS BEFORE THE STADIUM.',
      image: '/images/pointcast-college-house/walk-to-the-bowl.webp',
      alt: 'A loose procession of college friends walking from a shared house toward a night football game',
      caption:
        'The useful unit of college football is not the seat. It is the walk that gathers people on the way there.',
      essay: [
        'On Saturday, the house releases everyone at once. A private address becomes a small public procession. People join from sidewalks, dorms, apartments, band rooms, buses, parking lots, and the one friend who was absolutely leaving ten minutes ago.',
        'This is why college football survives explanations of college football. The game is real, but so is the migration around it: a whole campus agreeing to move in one direction for a few hours.',
        'The fraternity lens is only one camera in that crowd. Its responsibility is to widen the frame.',
      ],
      midjourneyJobId: 'b9286185-dc51-469a-829d-a3cd3172d5e4',
      midjourneyIndex: 0,
      model: 'Midjourney V8.1',
      promptSummary: 'Friends leaving fraternity row for a night game; campus procession at dusk.',
    },
    {
      id: 'morning',
      number: '05',
      moment: 'Sunday / 9:07 a.m.',
      title: 'THE HOUSE KEEPS THE SOUND.',
      image: '/images/pointcast-college-house/morning-after.webp',
      alt: 'Soft morning light falling through a worn college-house stairwell after a long night',
      caption:
        'Morning is the house with its argument removed. What remains is evidence: light, shoes, paper, repair.',
      essay: [
        'Every communal myth needs the morning after, not as punishment but as scale. The chant becomes a ringing ear. The giant win becomes a cup on the stairs. The invincible group becomes one person awake early enough to hear the building settle.',
        'This is when the house feels most honest. It is not a monument. It is a container that took the shape of the people inside it and will take another shape next year.',
        'Memory begins as evidence nobody has thrown away yet.',
      ],
      midjourneyJobId: '28760ab2-fe00-4943-ac30-13b9d0deed62',
      midjourneyIndex: 2,
      model: 'Midjourney V8.1',
      promptSummary: 'Quiet morning-after stairwell; shared-life evidence; soft documentary light.',
    },
    {
      id: 'repair',
      number: '06',
      moment: 'Senior spring / repair day',
      title: 'LEAVE THE PORCH BETTER.',
      image: '/images/pointcast-college-house/repair-day.webp',
      alt: 'Current students and older alumni repairing porch furniture and planting a young shade tree together',
      caption:
        'The cleanest form of legacy is maintenance performed for people whose names you do not know.',
      essay: [
        'The danger of fraternity nostalgia is that it can make possession feel like stewardship. We were here, therefore the house is ours. But a borrowed place asks the opposite question: what will be more open, safer, kinder, and more useful because we passed through it?',
        'Repair the chair. Plant shade. Write down the hard lesson. Retire the ritual that requires harm. Make the guest list less predictable. Pass on fewer secrets and more instructions.',
        'The house was borrowed. The friendship was not.',
      ],
      midjourneyJobId: 'f6878292-a558-4fea-89cb-94548c04ec47',
      midjourneyIndex: 2,
      model: 'Midjourney V8.1',
      promptSummary: 'Students and alumni repairing a porch and planting shade; inheritance as stewardship.',
    },
  ] as readonly CollegeHousePlate[],
  refusals: [
    {
      title: 'NO ROMANCE FOR HAZING.',
      body: 'Pain is not proof of love, secrecy is not depth, and endurance is not consent. Any ritual that needs harm to feel meaningful has failed its own people.',
    },
    {
      title: 'NO NOSTALGIA FOR LOCKED DOORS.',
      body: 'Fraternities have often mistaken selectivity for character. An ode worth writing has to notice who was excluded, who did the invisible work, and whose comfort organized the room.',
    },
    {
      title: 'NO BROTHERHOOD WITHOUT ACCOUNTABILITY.',
      body: 'Belonging cannot mean protection from consequence. The useful house is one where a friend can interrupt the group before the group becomes an excuse.',
    },
  ],
  houseRules: [
    'Notice who has not spoken.',
    'Clean the room you did not use.',
    'Make the walk home a group ritual.',
    'Let tradition explain itself every year.',
    'Give the best room a public purpose.',
    'Leave instructions for people you will never meet.',
  ],
  closing:
    'Maybe the college experience is not the best four years of your life. That would be too small a wish. Maybe it is four years in which ordinary rooms teach you that a life is built with other people—and that every door is a decision.',
  credits: {
    conceptAndEditorialDirection: 'Michael Hoydich',
    writingDesignAndImplementation: 'Michael Hoydich with Codex / OpenAI',
    imageDirection: 'Michael Hoydich with Codex / OpenAI',
    imageGeneration: 'Midjourney V8.1',
    imageCount: 6,
  },
  boundary:
    'An independent PointCast editorial feature about one possible fraternity-house experience. It does not represent every student, chapter, school, or Greek-letter organization and is not affiliated with or endorsed by any college, fraternity, athletic program, conference, or governing body. The images are imagined editorial scenes, not documentary photographs of real people or places.',
} as const;
