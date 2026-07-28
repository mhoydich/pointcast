export type LibraryProtocolId = 'memory' | 'access' | 'room' | 'practice' | 'voice';

export interface LibrarySource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  usedFor: string;
}

export const LIBRARY_ISSUE = {
  schema: 'pointcast.noticing-issue/v1',
  id: 'what-i-keep-noticing-01-library',
  issue: '01',
  season: 'How we live together',
  desk: 'Coordination',
  format: 'Major Study · Opening dispatch',
  title: 'The future of the library',
  shortTitle: 'The library is a protocol with a roof',
  dek:
    'At one small public library in El Segundo, the future is already visible: memory, rooms, parks, school partnerships, digital access, art, and the radical permission to arrive without buying anything.',
  thesis:
    'The future of the library is not fewer books. It is thicker public capacity.',
  url: 'https://pointcast.xyz/noticing/the-future-of-the-library',
  jsonUrl: 'https://pointcast.xyz/noticing/the-future-of-the-library.json',
  blockUrl: 'https://pointcast.xyz/b/0515',
  publishedAt: '2026-07-27T15:31:00-07:00',
  readingTime: '12 min',
  location: {
    name: 'El Segundo Public Library',
    address: '111 W. Mariposa Avenue, El Segundo, California',
    url: 'https://www.elsegundolibrary.gov/',
  },
  altitudes: ['home', 'town', 'network', 'world'],
  reportingBoundary:
    'This opening dispatch is reported from the library’s current public services, calendar, policies, and city records. The proposed pilots are PointCast ideas, not announced library programs. Direct interviews and room-by-room observation belong to the next dispatch.',
  credits: {
    director: 'Michael Hoydich',
    writingAndDesign: 'Codex / OpenAI',
    imageSystem: 'OpenAI image generation · poster-image-engine',
    source:
      'Michael Hoydich chat directive, 2026-07-27: begin What I Keep Noticing with The Future of the Library as a cool, visual, connective magazine issue with original images.',
  },
  images: [
    {
      id: 'sunroom-commons',
      src: '/images/noticing/library-issue-01/sunroom-commons.webp',
      width: 1536,
      height: 1024,
      alt:
        'A sunlit civic collage of neighbors reading, mapping, studying, and opening a card catalog around one shared library table',
      caption:
        'Plate 01 · Sunroom Commons. A library organized around shared capability, with one chair kept open.',
    },
    {
      id: 'town-memory-table',
      src: '/images/noticing/library-issue-01/town-memory-table.webp',
      width: 1536,
      height: 1024,
      alt:
        'An archival worktable of coastal photographs, maps, catalog drawers, gloves, a recorder, and two generations pointing to the same place',
      caption:
        'Plate 02 · Town Memory Table. An archive becomes civic memory when somebody can find it, touch it, and add context.',
    },
    {
      id: 'borrowable-town',
      src: '/images/noticing/library-issue-01/borrowable-town.webp',
      width: 1536,
      height: 1024,
      alt:
        'A yellow editorial still life of a park pass, hotspot, sensor, seeds, repair tool, recorder, cake pan, transit map, and book connected by a blue path',
      caption:
        'Plate 03 · A Borrowable Town. One existing park pass opens the door to a larger question: what else should a library card unlock?',
    },
  ],
  opening: [
    'At 111 West Mariposa Avenue, a library card can open more than a shelf. It can open a California state park. It can open a study room, a film stream, an interlibrary request, a newspaper archive, a school-library collection, and photographs of the town before you arrived.',
    'That list is not a forecast. It is the present tense of the El Segundo Public Library. The future is already here in pieces; the interesting work is learning to see the pieces as one system.',
    'A library is a protocol with a roof. Its deepest technology is not the book, the database, or the barcode. It is permission: permission to enter without a purchase in mind, to stay without explaining yourself, to ask a beginner’s question, to use a shared resource, and to leave with more capability than you brought in.',
    'Most private spaces begin with a transaction. The library begins with presence. That difference is a small civic miracle.',
  ],
  protocols: [
    {
      id: 'memory' as LibraryProtocolId,
      number: '01',
      label: 'Memory',
      proposition: 'A town should be able to remember itself.',
      current:
        'The History Committee preserves photographs, clippings, maps, and memorabilia in the library’s Heritage Room; the digital collection extends part of that memory beyond the building.',
      route: 'History Room',
      url: 'https://www.elsegundolibrary.gov/about-us/history-committee',
    },
    {
      id: 'access' as LibraryProtocolId,
      number: '02',
      label: 'Access',
      proposition: 'A card should unlock more of the world than a person could buy alone.',
      current:
        'Books move through interlibrary loan; films and ebooks travel through digital services; a state-parks pass converts a library card into a day outside.',
      route: 'Digital library',
      url: 'https://www.elsegundolibrary.gov/digital-library',
    },
    {
      id: 'room' as LibraryProtocolId,
      number: '03',
      label: 'Room',
      proposition: 'Public life needs somewhere to happen.',
      current:
        'Study rooms, rental rooms, exhibit space, and the changing Room of Requirement make the library a host—not only a container.',
      route: 'Study rooms',
      url: 'https://www.elsegundolibrary.gov/services/book-a-study-room',
    },
    {
      id: 'practice' as LibraryProtocolId,
      number: '04',
      label: 'Practice',
      proposition: 'Knowledge becomes public when people can do it together.',
      current:
        'Storytimes, craft groups, teen programs, author events, and school-library partnerships turn information into recurring shared practice.',
      route: 'Events',
      url: 'https://www.elsegundolibrary.gov/events',
    },
    {
      id: 'voice' as LibraryProtocolId,
      number: '05',
      label: 'Voice',
      proposition: 'A public institution should have visible ways to hear its public.',
      current:
        'A Library Board of Trustees meets in public, while the Friends and History Committee give volunteers concrete ways to support the institution.',
      route: 'Library trustees',
      url: 'https://www.elsegundolibrary.gov/about-us/library-board-of-trustees',
    },
  ],
  essays: [
    {
      number: '01',
      kicker: 'The quiet infrastructure',
      title: 'The shelves are only the visible part.',
      paragraphs: [
        'We often talk about libraries as if they are a delivery mechanism for books. That description is true in the way that calling a kitchen a delivery mechanism for plates is true. It notices the objects and misses the choreography.',
        'Look instead at the agreements. The public funds a common collection. Librarians make it legible. A card establishes lightweight belonging. Catalogs let strangers share a retrieval system. Due dates keep the resource moving. Quiet, help, privacy, and intellectual freedom become behavioral infrastructure. Even the return slot is a tiny act of faith in the next person.',
        'The El Segundo system extends this choreography into four school libraries, local-history stewardship, digital media, art exhibits, rooms, programs, and a park pass. Every extension says the same thing: a town is more capable when access is pooled.',
      ],
    },
    {
      number: '02',
      kicker: 'Against replacement stories',
      title: 'The future is not a tablet where the stacks used to be.',
      paragraphs: [
        'Bad futures replace one thing with another. Books become screens. Desks become kiosks. Librarians become search boxes. The drawing looks efficient because everything difficult has been removed—including most of the people.',
        'A useful future is additive. Keep the deep shelf. Add the recorder, the sensor, the studio hour, the repair manual, the local dataset, the public meeting, and the person who knows how to help. A library can hold old media and new capability without treating either as a threat.',
        'This matters most in a world of abundant answers and scarce trust. The public library is not valuable because information is hard to find. It is valuable because context, continuity, privacy, and patient human assistance are hard to maintain.',
      ],
    },
    {
      number: '03',
      kicker: 'The coordinating question',
      title: 'What should everyone in town be able to do?',
      paragraphs: [
        'That is a better planning question than “What should the library contain?” It moves attention from inventory to agency.',
        'Everyone should be able to research a claim, use a quiet room, see the town’s memory, learn a practical skill, reach a public meeting, make a small thing, borrow an uncommon object, and ask for help without first becoming a customer.',
        'The answer will change. The protocol should not. The library keeps revising the set of capabilities that a resident can access simply by being a resident.',
      ],
    },
  ],
  presentTense: [
    {
      label: 'Already here',
      title: 'A park pass',
      detail:
        'El Segundo cardholders can check out a California State Library Parks Pass for vehicle day use at participating state parks.',
      url: 'https://www.elsegundolibrary.gov/services/reopening-procedures/california-state-library-parks-pass',
    },
    {
      label: 'Already here',
      title: 'A town archive',
      detail:
        'The Heritage Room and digital photo collection preserve maps, photographs, clippings, yearbooks, and local context.',
      url: 'https://www.elsegundolibrary.gov/about-us/history-committee',
    },
    {
      label: 'Already here',
      title: 'Four school doors',
      detail:
        'The public library partners with the school district to support four school-library locations and shared catalog access.',
      url: 'https://www.elsegundolibrary.gov/about-us/school-libraries/high-school-library',
    },
    {
      label: 'Already here',
      title: 'A changing gallery',
      detail:
        'Artists can exhibit work in library cases, gridwalls, and the changing Room of Requirement.',
      url: 'https://www.elsegundolibrary.gov/services/arts-and-culture/opportunities-for-artists',
    },
  ],
  proposals: [
    {
      number: 'A',
      title: 'The Borrowable Town Shelf',
      premise:
        'Start with twelve useful objects, not a hundred: two air-quality sensors, two field recorders, two repair kits, two induction burners, two cake pans, and two neighborhood-observation kits.',
      test:
        'Ninety days. Ordinary library circulation. One-page guides. Track holds, completions, breakage, questions, and the stories people bring back.',
      boundary:
        'Proposal—not a current El Segundo Public Library program. Object choice, safety, storage, maintenance, and staff time require library review.',
    },
    {
      number: 'B',
      title: 'Town Memory Saturdays',
      premise:
        'Invite one block, one team, or one family at a time to bring a photograph, flyer, map, recipe, oral history, or small mystery from El Segundo.',
      test:
        'One staffed table each month. Scan only with permission. Return every original. Add context before adding volume.',
      boundary:
        'Proposal. The History Committee already provides the stewardship model; any expansion should follow its archival standards and consent practices.',
    },
    {
      number: 'C',
      title: 'Public Capability Hours',
      premise:
        'A resident offers one careful hour on something they actually know: mending a seam, reading a city agenda, recording clean audio, preparing for an interview, propagating a plant.',
      test:
        'Six sessions. Ten seats each. No sales pitch. The library curates the teacher, the scope, and a durable one-page takeaway.',
      boundary:
        'Proposal. This is a small program experiment, not an open marketplace or a substitute for professional services.',
    },
  ],
  borrowList: [
    {
      status: 'HERE',
      title: 'A day in a state park',
      note: 'One small card becomes transportation into a larger public landscape.',
    },
    {
      status: 'HERE',
      title: 'A room with a door',
      note: 'Privacy, concentration, tutoring, and collaboration are all forms of access.',
    },
    {
      status: 'HERE',
      title: 'The town before you',
      note: 'Photographs and clippings let a place recognize its own change.',
    },
    {
      status: 'NEXT?',
      title: 'A way to measure the air',
      note: 'A sensor is most useful when the method and interpretation travel with it.',
    },
    {
      status: 'NEXT?',
      title: 'An hour of somebody’s craft',
      note: 'The durable object is not the lesson. It is the confidence to try again alone.',
    },
  ],
  fieldPrompts: [
    'What happens here that could not happen as well at home?',
    'Where does a visitor learn the rules without having to ask?',
    'Which resource is always in use? Which is hard to notice?',
    'What does the building let a child do independently?',
    'Where can a person be private without becoming invisible?',
    'What knowledge leaves the room when a regular volunteer stops coming?',
  ],
  closing: [
    'A library does not need to become everything. It needs to remain one of the rare places where the town can decide, together, what everyone should be able to reach.',
    'The books stay. So does the quiet. Around them, the public capacity thickens: a room, a memory, a pass, a practice, a voice, an open chair.',
    'The future of the library is not waiting for a new building. It begins whenever a shared resource becomes a shared ability.',
  ],
  next: {
    title: 'Why LaCroix',
    label: 'Published next · Ritual · Issue 02',
    dek:
      'Bubbles, cans, office refrigerators, and the peculiar warmth of choosing a flavor that barely exists.',
    date: '2026-07-27T20:18:00-07:00',
    dateLabel: 'Published · Jul 27 · Read now',
    url: '/noticing/why-lacroix',
  },
} as const;

export const LIBRARY_SOURCES: readonly LibrarySource[] = [
  {
    id: 'S01',
    title: 'El Segundo Libraries home and current events',
    publisher: 'El Segundo Public Library',
    url: 'https://www.elsegundolibrary.gov/',
    usedFor: 'Address, current program examples, and public-service framing.',
  },
  {
    id: 'S02',
    title: 'Digital Library',
    publisher: 'El Segundo Public Library',
    url: 'https://www.elsegundolibrary.gov/digital-library',
    usedFor: 'Kanopy, Libby, research databases, photo archives, and newspaper access.',
  },
  {
    id: 'S03',
    title: 'History Committee and Heritage Room',
    publisher: 'El Segundo Public Library',
    url: 'https://www.elsegundolibrary.gov/about-us/history-committee',
    usedFor: 'Local-history stewardship, materials, public access, and volunteer care.',
  },
  {
    id: 'S04',
    title: 'California State Library Parks Pass',
    publisher: 'El Segundo Public Library',
    url:
      'https://www.elsegundolibrary.gov/services/reopening-procedures/california-state-library-parks-pass',
    usedFor: 'Existing non-book circulation example and eligibility boundary.',
  },
  {
    id: 'S05',
    title: 'High School Library',
    publisher: 'El Segundo Public Library',
    url: 'https://www.elsegundolibrary.gov/about-us/school-libraries/high-school-library',
    usedFor: 'Four-school partnership and shared public-library catalog access.',
  },
  {
    id: 'S06',
    title: 'Opportunities for Artists',
    publisher: 'El Segundo Public Library',
    url:
      'https://www.elsegundolibrary.gov/services/arts-and-culture/opportunities-for-artists',
    usedFor: 'Exhibit cases, gridwalls, the Room of Requirement, and public-art coordination.',
  },
  {
    id: 'S07',
    title: 'Friends of the Library',
    publisher: 'El Segundo Public Library',
    url: 'https://www.elsegundolibrary.gov/about-us/friends-of-the-library',
    usedFor: 'Volunteer support, fundraising, history work, literacy, and program support.',
  },
  {
    id: 'S08',
    title: 'Collection Development Policy',
    publisher: 'El Segundo Public Library',
    url: 'https://www.elsegundolibrary.gov/home/showpublisheddocument/11470/638930936394000000',
    usedFor: 'Diverse collections, interlibrary loan, internet access, and intellectual-freedom commitments.',
  },
] as const;
