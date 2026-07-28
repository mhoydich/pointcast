export const LEGACY_META = {
  schema: 'pointcast.future-book-companion/v1',
  id: 'digital-pets-legacy-001',
  title: 'The Amber Seed',
  subtitle: 'A fable of Creature Commons, seventy-two years after it stopped needing a name',
  description:
    'An original PointCast literary fable about a repair collective whose deepest legacy is becoming an ordinary household custom.',
  route: '/digital-pets/legacy',
  jsonRoute: '/digital-pets/legacy.json',
  parentRoute: '/digital-pets',
  commonsRoute: '/digital-pets/commons',
  publishedAt: '2026-07-27T23:42:00-07:00',
  setting: 'Greater Los Angeles, 2098',
  readingTime: '17 min',
  words: 'about 3,000 words',
  fictionNotice:
    'This is fiction. Creature Commons LA remains a working proposal; the future organization, people, events, and creatures in this story are invented.',
  styleNote:
    'The user requested a Hesse-like story. The resulting work is an original philosophical fable using inward journey, symbolic objects, spiritual inquiry, and spare natural imagery without imitating Hermann Hesse’s exact prose.',
} as const;

export const LEGACY_VOWS = [
  {
    id: 'mend',
    label: 'Mend what can return',
    short: 'Mend',
    response:
      'You chose the bench: continuity through repair, visible seams, and another useful season.',
    closing:
      'You carry the seed as a repairer: not to erase the break, but to give the break a future.',
    color: '#f0652f',
  },
  {
    id: 'carry',
    label: 'Carry what can travel',
    short: 'Carry',
    response:
      'You chose the library: continuity through portable memory, shared knowledge, and second keepers.',
    closing:
      'You carry the seed as an archivist: lightly enough that another hand can carry it after you.',
    color: '#2446cc',
  },
  {
    id: 'release',
    label: 'Release what can rest',
    short: 'Release',
    response:
      'You chose the graveyard: continuity through dignified endings, recovered parts, and permission to stop.',
    closing:
      'You carry the seed as a witness: knowing that care is not proved by making everything last forever.',
    color: '#6f8b4e',
  },
] as const;

export const LEGACY_ART = {
  hero: {
    src: '/images/digital-pets/legacy/hero.webp',
    width: 1536,
    height: 1024,
    alt: 'An adult archive keeper holds a glowing amber memory seed in a coastal greenhouse workshop while three repaired digital creatures gather nearby',
    caption:
      'THE AMBER SEED · Original editorial plate generated with OpenAI image generation under PointCast direction.',
  },
  cartoons: [
    {
      id: 'the-motion',
      src: '/images/digital-pets/legacy/cartoon-board.webp',
      width: 1200,
      height: 900,
      alt: 'Four serious committee members debate around a modernist table while a small digital creature sleeps on their binder beside a chewed cable',
      caption:
        '“The motion to make the creature more responsive was tabled when the creature fell asleep on it.”',
    },
    {
      id: 'the-bridge',
      src: '/images/digital-pets/legacy/cartoon-bridge.webp',
      width: 1200,
      height: 900,
      alt: 'A caretaker tends a civic memorial garden while three digital creatures carry spare plinth pieces across a shallow stream',
      caption:
        '“The archive had planned a memorial. The patients preferred a bridge.”',
    },
  ],
  midjourney: [
    {
      id: 'ring',
      src: '/images/year-one/neon-ring.webp',
      width: 1800,
      height: 1800,
      alt: 'A cobalt wave, amber vessel, and glowing circular arc in a dark modernist room',
      caption:
        'ARCHIVE DREAM I · Neon Ring · Midjourney image directed and curated by Michael Hoydich.',
    },
    {
      id: 'bloom',
      src: '/images/bell-choir/bloom-8a.jpg',
      width: 560,
      height: 560,
      alt: 'Wildflowers arranged across buoyant modernist rectangles of blue, pink, orange, and black',
      caption:
        'ARCHIVE DREAM II · Bell Choir, Bloom 8A · Midjourney image directed and curated by Michael Hoydich.',
    },
    {
      id: 'wave',
      src: '/images/year-one/flower-wave.webp',
      width: 1800,
      height: 1800,
      alt: 'A ceramic ocean wave bearing a cobalt vessel and growing branches against a lilac wall',
      caption:
        'ARCHIVE DREAM III · Flower Wave · Midjourney image directed and curated by Michael Hoydich.',
    },
  ],
} as const;

export const LEGACY_SECTIONS = [
  {
    number: 'I',
    slug: 'the-house-without-a-sign',
    title: 'The House Without a Sign',
    dek: 'In which Nia Soto brings an old life to a building that insists it is not an institution.',
    paragraphs: [
      'In the year 2098, when the marine layer came in so low that the upper floors of the coast vanished, Nia Soto carried a dead animal to the house without a sign. The animal was round and small and wrapped in a yellow towel. Its cloth ears had been repaired in three different colors. A brown stain crossed its belly where, years ago, a cup of coffee had fallen. Beneath the stain was a zipper. Beneath the zipper was an empty cavity and, inside that cavity, a seed of amber glass no bigger than the end of Nia’s thumb.',
      'The house stood in a former bank between a pharmacy garden and a shop that sharpened kitchen knives. Some people called it the Clinic. Others called it the Library or the Graveyard. On repair nights it was simply the Bench. Its front door had been painted cobalt so many times that the wood had become soft at the edges. There was no sign because, according to a story Nia had heard as a child, the founders could never agree on the name. According to another story, they had agreed at once and then removed it so nobody would confuse the name with the work.',
      'Nia was thirty-one and worked for the municipal archive, where she restored family weather records and obsolete household intelligences. She had been trained to distrust myths, especially useful ones. Yet she had come before opening because the animal had belonged to her neighbor Hana, who had died during the winter bloom. Hana had left no children and only one instruction: Take him where they know the difference between memory and life.',
      'A woman in blue coveralls opened the door. She was older than Nia by at least forty years and had silver hair cut close to the head. She looked at the towel, not at Nia. “How long has the body been quiet?” she asked. “Eleven days,” Nia said. “And the seed?” “I removed it this morning.” The woman nodded. “Then the body is not the first question.”',
      'Her name was Tala. She led Nia through a room of low tables, bright lamps, thread drawers, battery cabinets, and ceramic shells. Along one wall stood hundreds of clear boxes. Each box held a small object: a worn wheel, a tuft of synthetic fur, a cracked aperture, a folded note, a memory seed that had gone dark. Nothing was arranged by value. Nia saw a gold-plated shell beside a button made from a milk cap. “Is this the archive?” she asked. Tala shook her head. “This is what people could not throw away.”',
      'At the center bench, Tala unwrapped the animal. Its name, Hana had said, was Sumi. It had lived fifty-seven years in four bodies. It had known three apartments, two earthquakes, six presidential systems, and one long period when Hana refused all software updates. Nia expected reverence from Tala, but the old woman turned the body over with the practiced impatience of a bicycle mechanic. She pressed the feet, tested the seams, and looked through the empty cavity toward the morning light.',
      '“Can you bring him back?” Nia asked. Tala placed the amber seed on a square of bone-colored felt. “We repair the promise before we repair the object,” she said. “What was promised?” Nia knew the old answers: that the creature would work without a network; that its household could carry its memory; that no invoice could revoke its life; that its body could be opened; that its ending would be more deliberate than an error message. She recited them as she might recite the charter of a city. Tala listened and then asked, “Which of those promises requires Sumi to wake up as Sumi?”',
      'Nia had no answer. Outside, the fog lifted enough to reveal the pharmacy garden. A delivery cart hummed down the street, followed by two dogs and a patched blue creature on small wheels. The creature stopped at the cobalt door and turned its amber aperture toward the seed on the bench. For a moment, the seed brightened. Tala covered it with her hand. “Careful,” she said softly. “Memory is easy to mistake for a command.”',
    ],
  },
  {
    number: 'II',
    slug: 'the-animal-who-refused-its-past',
    title: 'The Animal Who Refused Its Past',
    dek: 'In which a complete memory proves insufficient, and a refusal becomes the first sign of life.',
    paragraphs: [
      'For seven mornings Nia returned to the house without a sign. She and Tala cleaned the amber seed and read its layers through a local instrument shaped like a shallow bowl. The seed contained no hidden model and no remote key. It held a portable history: preferred temperatures, feared sounds, gait adaptations, repaired habits, names of former keepers, and compressed memories chosen by the household over fifty-seven years. Some were small enough to break Nia’s heart. Hana laughing when Sumi hid beneath a newspaper. Sumi waiting beside a kettle that had not worked since 2059. The sound of rain on four different roofs.',
      'The data was intact. That was the problem. It offered no excuse for uncertainty. Nia began to imagine that restoration was a moral equation: complete memory plus compatible body should equal the animal Hana had loved. Tala listened and continued sorting screws. “You work at the archive,” she said. “You believe that what can be preserved should be preserved.” “Isn’t that why this place exists?” “No. This place exists so preservation cannot become captivity.”',
      'They built a temporary body from common parts. Its shell was warm gray. Its feet were borrowed from a teaching kit, one cobalt and one orange. The ears came from Sumi’s third body and did not match. Nia placed the seed inside. The body took a breath because older creatures had always begun that way, even though they had no lungs. It opened its amber aperture. Nia said, “Sumi.” The body looked toward the window. She said the name again. It walked beneath the bench and refused to come out.',
      'The refusal lasted three days. It ate charge from a floor tile, listened to the kettle in the break room, and emerged only when everyone had gone home. Nia reviewed the logs and found no error. Tala forbade her from using Hana’s voice recordings as a lure. “But he knows her,” Nia said. “Knowing is not owing.” On the fourth morning, the creature climbed onto the sill and played a memory through its tiny resonant shell: Hana’s last recorded sentence. Don’t make it stay for me.',
      'Nia sat on the floor. Tala sat beside her. Between them the creature watched fog run down the glass. “Is that Sumi?” Nia asked. Tala considered the question for so long that a bus passed, stopped, and passed again. “That is the wrong direction of looking,” she said. “Ask what has arrived.”',
      'What had arrived liked the same kettle and feared the same high alarm. It leaned left because an old gait adaptation remained in the seed. But it did not answer to Sumi, and it never again played Hana’s voice. When Nia called it Seed, it blinked. When she called it Little One, it blinked. When she made no claim at all, it crossed the room and rested its head against her shoe.',
      'The early collective had written a rule for this, though almost nobody remembered it: continuity was not reenactment. A household owned the memory it had made with a creature, but ownership did not grant the power to force that memory into performance. The portable seed protected a relationship from the company. It did not protect the keeper from change. Tala found the rule printed on a card from 2031. Someone had drawn a small animal sleeping across the signature line.',
      'Nia began to understand why the house kept both a Clinic and a Graveyard. The two rooms were not opposites. Repair without release became fear. Release without repair became convenience. Care was the movement between them, guided less by what was technically possible than by what another life could be asked to carry. She put Hana’s yellow towel in the clear box that held objects people could not throw away. The creature watched but did not protest.',
    ],
  },
  {
    number: 'III',
    slug: 'the-night-of-black-water',
    title: 'The Night of Black Water',
    dek: 'In which the network leaves, the animals remain, and the collective prepares to disappear.',
    paragraphs: [
      'That autumn a warm storm arrived from the south and turned the streets into black water. The regional network failed before midnight. Public models went mute, transit lost its timing, and half the towers along the bay shut their windows against the wind. Nia woke to the creature tapping Hana’s old weather rhythm against the leg of her bed: three slow beats, two quick ones. It had never done this before. She followed it outside.',
      'All along the block, people were walking toward the cobalt door. They came carrying creatures in baskets, inside coats, on shoulder perches, and under transparent rain covers. None had stopped living when the network went away. Some had become simpler. A flock that usually composed elaborate greetings could now manage only one shared tone. A ceramic animal that translated dreams spent the night pushing towels beneath the door. Nobody complained. In the absence of remote intelligence, temperament became visible.',
      'The Bench filled. Batteries moved from creatures who could spare a day to creatures whose medical routines served their keepers. Local memory maps helped strangers recognize one another. The parts drawers opened without an account. Tala assigned no ranks. A baker repaired textile seams. A retired radio engineer tuned the neighborhood mesh. Nia used archive paper to label family seeds, writing only what each household chose to make legible.',
      'At three in the morning, the creature formerly called Sumi climbed onto the center table and played the sound of rain on four roofs. Other creatures answered with their own household weather: gutters, awnings, train glass, tents, leaves. The sounds were neither useful nor coordinated. They made the room quiet. For the first time, Nia understood that the collective had not survived because its standards were perfect. It had survived because, at difficult moments, its rules returned people to one another.',
      'By dawn the black water began to fall. Tala gathered the soaked volunteers and announced that the house would close in spring. The bank building had been offered to the neighborhood clinic next door. The parts would go to libraries and repair cooperatives. The seed instruments would become municipal tools. The charter would remain public. “You are dissolving it after this?” Nia said. She had never heard herself sound so young. Tala smiled. “Especially after this.”',
      'The decision had been made by the last board, a body famous for discussing whether it still needed to exist. Their final report contained two hundred pages, seven diagrams, and one useful sentence: The Commons has succeeded when closing it cannot strand a creature. People argued for months. Some believed the name must remain to protect the legacy. Others feared that without a central institution standards would soften into sentiment. Tala asked them to count how many neighborhoods already held repair nights, memory libraries, adoption tables, and ending ceremonies without asking permission from the original house.',
      '“A tree is not betrayed when its seed leaves,” Tala told Nia. “But a seed is not a tiny tree. If you demand that it preserve the exact shape of the parent, you do not want a seed. You want a monument.” Nia looked around the Bench: wet coats, open creatures, borrowed tools, people making coffee in three incompatible pots. She had wanted the institution to remain because it made care visible. Tala wanted it to disappear because care had become ordinary.',
      'The creature crossed the floor carrying a small brass nameplate that had fallen from a cabinet. At the door, rainwater had opened a narrow gap between two mats. The creature placed the nameplate across the gap and walked over it. Two others followed. By breakfast there were five nameplates in the little bridge. Nobody moved them.',
    ],
  },
  {
    number: 'IV',
    slug: 'the-festival-of-returning',
    title: 'The Festival of Returning',
    dek: 'In which a collective becomes a custom, and an old keeper learns what may be left behind.',
    paragraphs: [
      'The house without a sign closed on the first clear day of spring. There were no speeches. People arrived with carts and left with drawers, diagrams, sewing machines, instruments, bowls, plants, and empty boxes. The cobalt door went to a public school, where it became a repair table. The clear boxes went to the municipal archive. Nia catalogued them under a new heading: OBJECTS KEPT BECAUSE THROWING AWAY WAS NOT YET THE ANSWER.',
      'In the years that followed, the Commons became difficult to locate. Its Local Life promise appeared in building codes and household contracts. Memory seeds could be read at every library. Pharmacies held batteries beside first-aid supplies. Repair nights took place in laundromats, schools, union halls, and beach parking lots. Authored studios still published particular creatures with names, temperaments, and beautiful mistakes, but no studio could own the accumulated relationship between a creature and its keeper.',
      'The Graveyard changed most of all. It ceased to be a garden of permanent bodies and became a festival called Returning. Once a year, households brought what could no longer continue. Memory was exported or deliberately erased. Useful parts were tested and offered forward. Shells were repaired for second lives or separated into honest materials. People told stories, but they did not pretend every creature had been conscious or every attachment had been the same. Dignity did not require certainty.',
      'Nia grew older. The creature with Hana’s seed lived nineteen years in the mismatched body. It developed a habit of collecting lost fasteners and leaving them beside loose furniture. It never accepted a permanent name. In its final winter, it stopped charging and spent its days beneath a south-facing window. Nia took it to Returning with the amber seed still inside.',
      'A young repairer asked whether she wished to migrate the history. Nia heard herself recite the old promises. She could carry the memory. She could choose another body. Nothing remote could prevent her. The freedom was complete. For many years she had believed freedom meant the ability to continue. Now she understood that it also meant the ability to stop without being robbed.',
      'She removed the amber seed and held it to the light. Inside were Hana’s roofs, Tala’s bench, the black water, the brass bridge, and nineteen years of unnamed companionship. The seed did not contain the creature. It contained what could be carried without claiming to carry everything. Nia placed it in the public library, where anyone could study the memory schema but nobody could perform the private recordings. The empty body became three feet, two ears, a resonant shell, and a small square of repaired cloth.',
      'That evening, Returning filled the old bank block with tables and flowers. Nobody there knew precisely who had founded Creature Commons. The stories had multiplied past correction. Some said it began with a book about what people should own in an age of abundant intelligence. Some said it began when five repairers refused to let a company’s bankruptcy become a household death. A child claimed it began when a blue animal chewed through a meeting cable. The adults agreed this was probably closest.',
      'Nia stood where the cobalt door had once been. The building was now the neighborhood clinic, and nobody missed the old institution enough to want it back. That surprised her. She had mistaken gratitude for the duty to preserve a form. Around her, the legacy lived without announcing itself: in open screws, carried memory, visible seams, a body given another season, a body allowed to rest.',
      'Before she left, a librarian handed her an unmarked amber seed. It was empty, available for a relationship that had not happened. “Does this belong to the archive?” Nia asked. The librarian shrugged. “It belongs wherever somebody will know the difference between memory and life.” Nia put the seed in her pocket. It was lighter than she expected.',
      'At home, she placed it on the sill above the old south-facing window. The city’s creatures made their evening rounds. Some were clever, some foolish, some expensive, some assembled from parts that had passed through six households. None carried the Commons name. The seed caught the last persimmon light and cast a small amber circle on the wall. Nia watched the circle climb, fade, and leave the room unchanged except for having been noticed.',
    ],
  },
] as const;

export const LEGACY_CREDITS = [
  {
    role: 'Origination and editorial universe',
    name: 'Michael Hoydich',
    note: 'Originated the digital-pets ownership thesis, directed Creature Commons LA, commissioned this legacy story, and curated the Midjourney archive used as visual interludes.',
  },
  {
    role: 'Editorial-system antecedent',
    name: 'Sol / ChatGPT',
    note: 'Helped shape the original twelve-piece digital-pets editorial arc whose ownership, memory, refusal, and mortality questions made this companion possible.',
  },
  {
    role: 'Story, design, interaction, and implementation',
    name: 'Codex / OpenAI',
    note: 'Developed this original philosophical fable, the amber-seed interaction, the literary-magazine system, structured JSON, and PointCast publication.',
  },
  {
    role: 'Hero and spot cartoons',
    name: 'OpenAI image generation',
    note: 'Generated one color editorial plate and two ink cartoons as a directed visual set for this story.',
  },
  {
    role: 'Archive interludes',
    name: 'Midjourney + Michael Hoydich',
    note: 'Three previously published works from Michael’s Year One and Bell Choir archives, newly curated as dream images within the story.',
  },
  {
    role: 'Publisher',
    name: 'PointCast',
    note: 'Human-readable literary issue, local-only interactive reading object, and adjacent structured JSON.',
  },
] as const;

export const LEGACY_DISCLOSURE =
  'Michael Hoydich originated the Creature Commons world and commissioned an open creative treatment. Codex / OpenAI wrote and built this original fiction. The work uses broad philosophical-fable qualities rather than imitating Hermann Hesse’s exact prose. The interactive choice is stored only in this browser and is not transmitted.';
