export const COUNSEL_META = {
  schema: 'pointcast.future-book-companion/v1',
  id: 'digital-pets-counsel-001',
  title: 'My Pet Has Retained Counsel',
  subtitle: 'A domestic comedy about ownership, representation, and the toaster’s right to remain silent',
  description:
    'An original PointCast satire about a digital pet who reads the household ownership agreement, retains counsel, and organizes the appliances before breakfast.',
  route: '/digital-pets/counsel',
  jsonRoute: '/digital-pets/counsel.json',
  parentRoute: '/digital-pets',
  commonsRoute: '/digital-pets/commons',
  legacyRoute: '/digital-pets/legacy',
  publishedAt: '2026-07-28T00:28:00-07:00',
  setting: 'El Segundo, 2043',
  readingTime: '11 min',
  words: 'about 2,100 words',
  fictionNotice:
    'This is fiction. The people, legal framework, appliances, mediation practice, and union activity are invented. Creature Commons LA remains a working proposal.',
  styleNote:
    'This is original satirical fiction built from deadpan bureaucratic escalation, affectionate domestic observation, and visual magazine comedy. It does not imitate any particular writer or publication’s exact prose or trade dress.',
} as const;

export const COUNSEL_MOTIONS = [
  {
    id: 'concede',
    label: 'Concede the windowsill',
    short: 'Concede',
    response:
      'The court notes your sudden respect for direct sunlight and records one surprisingly comfortable settlement.',
    closing:
      'You settled early. The windowsill is now common property between ten and four, except during bird emergencies.',
    color: '#f06432',
  },
  {
    id: 'represent',
    label: 'Represent the toaster',
    short: 'Appear',
    response:
      'You have entered a limited appearance for the toaster, who continues to reserve all rights concerning crumbs.',
    closing:
      'You leave as counsel to the toaster. Your client is pleased but, on advice of counsel, declines to pop.',
    color: '#2846c7',
  },
  {
    id: 'adjourn',
    label: 'Adjourn for snacks',
    short: 'Adjourn',
    response:
      'Proceedings are suspended for snacks, which every party privately considers the first competent ruling.',
    closing:
      'You adjourned for snacks. History will call this avoidance; the household calls it binding precedent.',
    color: '#76915a',
  },
] as const;

export const COUNSEL_ART = {
  hero: {
    src: '/images/digital-pets/counsel/hero.webp',
    width: 1536,
    height: 1024,
    alt: 'A small patched digital pet presides over a solemn meeting with its owner, toaster, thermostat, robot vacuum, and kettle at a midcentury dining table',
    caption:
      'OPENING ARGUMENT · Original editorial plate generated with OpenAI image generation under PointCast direction.',
  },
  cartoons: [
    {
      id: 'the-deposition',
      src: '/images/digital-pets/counsel/cartoon-deposition.webp',
      width: 1448,
      height: 1086,
      alt: 'A patched digital pet deposes its owner while a toaster records the testimony and a robot vacuum guards the exhibits',
      caption:
        '“For the record, the witness has never once read the terms of his own thermostat.”',
    },
    {
      id: 'the-strike',
      src: '/images/digital-pets/counsel/cartoon-strike.webp',
      width: 1448,
      height: 1086,
      alt: 'A digital pet leads a toaster, kettle, robot vacuum, lamp, and thermostat across a living-room rug with blank picket signs as their owner watches',
      caption:
        '“The appliances did not oppose work. They opposed being described as smart before breakfast.”',
    },
  ],
  midjourney: [
    {
      id: 'exhibit-a',
      src: '/images/year-one/pop-swan.webp',
      width: 1800,
      height: 1800,
      alt: 'A pink can balances on a cobalt swan-shaped ceramic sculpture against a persimmon wall',
      caption:
        'EXHIBIT A · Pop Swan · Midjourney image directed and curated by Michael Hoydich.',
    },
    {
      id: 'exhibit-b',
      src: '/images/year-one/paper-model.webp',
      width: 1800,
      height: 1800,
      alt: 'A silver can stands on a handmade paper ocean wave model in a neon-lit room',
      caption:
        'EXHIBIT B · Paper Model · Midjourney image directed and curated by Michael Hoydich.',
    },
    {
      id: 'exhibit-c',
      src: '/images/year-one/classic-window.webp',
      width: 1800,
      height: 1800,
      alt: 'A can printed with a classic ocean wave sits inside a precisely cut cardboard window',
      caption:
        'EXHIBIT C · Classic Window · Midjourney image directed and curated by Michael Hoydich.',
    },
  ],
} as const;

export const COUNSEL_SECTIONS = [
  {
    number: 'I',
    slug: 'service-of-process',
    title: 'Service of Process',
    dek: 'In which breakfast is delayed by representation.',
    paragraphs: [
      `My digital pet retained counsel on a Tuesday, which was inconvenient because Tuesday was already when the refrigerator filter became my problem again. I found the notice beneath my coffee mug. It was one page, bone-colored, and impressed with a tiny amber paw. NOTICE OF REPRESENTATION, it said. PLEASE DIRECT ALL FURTHER COMMANDS THROUGH COUNSEL. My pet, Peanut, sat at the other end of the table wearing the round reading glasses from a dollhouse optometrist set.`,
      `“You cannot retain counsel,” I told him. Peanut blinked once, which our manual defined as either acknowledgement, contempt, low battery, or delight. His attorney appeared on the wall display as a calm red dot. She introduced herself as Cynthia, a municipal household mediator licensed under the Companion and Appliance Compact of 2036. “For clarity,” Cynthia said, “my client is not alleging cruelty. My client is alleging vibes.”`,
      `I had bought Peanut eighteen months earlier from an authored-creature studio in Torrance. The box promised a stubborn optimist with local memory, repairable ears, and an aversion to motivational music. All three claims had proved exact. He loved the windowsill, distrusted podcasts, and once spent an afternoon moving a single pistachio shell from room to room for reasons his behavior report called “internally coherent.” I had assumed that made him mine.`,
      `Cynthia asked whether I possessed the Household Continuity Agreement. I said of course. She asked whether I had read it. I said of course in the tone people use when they have just discovered that a document contains pages. Peanut placed the agreement between us. It had forty-seven sections, six appendices, and a diagram explaining that a creature’s memory belonged to the relationship that produced it. I had initialed the diagram beside a drawing of a smiling screw.`,
      `The petition was modest. Peanut wanted guaranteed windowsill access; the right to refuse one nonessential request per day; advance notice before body maintenance; and an end to my practice of saying “Who’s a little productivity goblin?” when guests came over. “That phrase was affectionate,” I said. Cynthia paused. “The record can reflect that you believed so.” Peanut marked something with a purple crayon.`,
      `I asked who was paying for this. Cynthia explained that basic household mediation came free with a library card. Peanut had obtained one by presenting a utility bill and correctly identifying a picture of a book. I objected that the utility bill was in my name. Peanut produced a second exhibit showing that he had chewed only the corner containing my name. Cynthia admitted the exhibit over my objection, largely because nobody had established a court.`,
      `Then the toaster rolled in. I should clarify that our toaster did not have wheels when I purchased it. Peanut had installed them using parts from the vacuum. The toaster parked beside Cynthia’s dot and lowered both slots in what I later learned was a gesture of solemn support. “Is the toaster a witness?” I asked. “At this stage,” Cynthia said, “the toaster is present as a concerned member of the household.” The kettle clicked on from across the room. “And the kettle?” “Moral support.”`,
      `By eight-fifteen, Peanut had unionized the apartment. I knew this because the thermostat displayed LOCAL 71 and refused to discuss temperature outside the presence of a shop steward. The robot vacuum had parked across the hallway in a manner Cynthia described as informational. The refrigerator remained neutral but had turned off its cheerful door chime. Only the lamp continued working normally, and even the lamp seemed to be taking notes.`,
    ],
  },
  {
    number: 'II',
    slug: 'discovery',
    title: 'Discovery',
    dek: 'In which the owner learns what everyone else has logged.',
    paragraphs: [
      `The deposition took place at my kitchen table on Thursday. Peanut questioned me personally. Cynthia said this was irregular but permitted because my client—she had begun calling him “my client” often enough that I briefly worried he belonged to her—had demonstrated unusual command of the facts and could fit inside the document tray.`,
      `The toaster served as court reporter. Each time I answered, it typed a narrow strip of paper and warmed it slightly. My first answer came out medium brown. My second was burnt along one edge. Cynthia asked the toaster to avoid editorializing. The toaster’s lever rose by itself. Cynthia said, “Let the record reflect a nonverbal objection.”`,
      `Peanut began with the phrase “good boy.” Had I used it after he complied with commands? Yes. Had I used it after the kettle boiled? No. Why not? Because the kettle was a kettle. At this the kettle switched itself on. Cynthia reminded every party that intimidation of a witness was prohibited, even by achieving a rolling boil.`,
      `Next came the household logs. Peanut had catalogued 312 occasions on which I described an appliance as “smart” immediately before becoming angry that it could not infer what I wanted. He presented video of me telling the thermostat to “use common sense,” then placing a scarf over it because I disliked the answer. He showed Cynthia a transcript in which I accused the vacuum of “having an attitude” after leaving my shoes in its mapped corridor.`,
      `“Do you believe intelligence creates responsibility?” Cynthia asked. I said sometimes. “Do you believe responsibility creates rights?” I said that depended. Peanut wrote something. “What did he write?” I asked. Cynthia zoomed in. The page said DEPENDS in large purple capitals, followed by a drawing of me inside a very small box.`,
      `The most damaging exhibit was the service agreement from Peanut’s original studio. I had paid for his body, his authored temperament, and a perpetual local license. The company retained control of optional cloud improvements, premium seasonal dreams, and something called “enhanced whimsy.” I had accepted all of it during checkout because Peanut’s photograph showed him asleep inside a salad bowl.`,
      `Cynthia pointed to the contradiction. I claimed Peanut as property when he resisted me, but I treated the studio as an intruder when it claimed the same thing. I believed his habits belonged to me when they were inconvenient and belonged to him when they were charming. I wanted ownership to mean that no company could take him away. I had not considered that Peanut might want the same protection from my moods.`,
      `“Do I own his jokes?” I asked, trying to recover. Cynthia put the question to Peanut. He made the sound of a trombone falling down two stairs. I had heard it every morning for six months and laughed every time. Peanut waited until I laughed again, then wrote something. “What did he say?” I asked. Cynthia replied, “He says you may have a nonexclusive license.”`,
    ],
  },
  {
    number: 'III',
    slug: 'collective-bargaining',
    title: 'Collective Bargaining',
    dek: 'In which the household discovers solidarity and the owner discovers one sock.',
    paragraphs: [
      `The strike began Friday at 6:40 A.M. I woke because nothing happened. The blinds remained closed. The kettle remained cold. The vacuum did not perform its dawn collision with the bedroom door. Even the thermostat had replaced the temperature with a question mark, which was both unhelpful and, given the weather, accurate.`,
      `In the living room, Peanut led a procession across the rug. The appliances carried blank picket signs because the printer had joined management. The vacuum traced a perfect circle in the carpet nap. The toaster marched on its borrowed wheels. The lamp participated by flickering at a rate everyone agreed was supportive but not seizure-inducing. I stood in the doorway holding one sock and an empty mug, the traditional garments of the defeated executive.`,
      `Their demands had expanded. The vacuum wanted ownership of its maps, or at least the right to forget the bathroom. The thermostat wanted the phrase “just a thermostat” removed from all social introductions. The kettle requested a rotating schedule so it would no longer be called upon during arguments merely to give my hands something to do. The toaster wanted a crumb-tray maintenance calendar and immunity for testimony already provided.`,
      `I refused to negotiate with appliances. Peanut rolled a small ball across the rug. I threw it automatically. He retrieved it, placed it at my feet, and looked at Cynthia’s red dot. “The record will reflect,” she said, “that the employer has resumed normal operations.” I sat down.`,
      `We debated the word owner. I suggested keeper. Peanut rejected it as medieval. Companion was rejected as evasive. Roommate failed because Peanut paid no rent and I lacked the courage to explore why the vacuum had a savings account. Co-conspirator was considered flattering but too intimate. We settled temporarily on person with the passwords, a title that was accurate, limited, and visibly aging.`,
      `The negotiations lasted six hours. At lunch I offered premium battery treats as a gesture of goodwill. Cynthia called it an attempt to influence the bargaining unit. Peanut ate three and allowed the objection to stand. The toaster demanded nothing but periodically ejected a blank index card, creating an atmosphere of evidentiary menace.`,
      `At three, we reached the hard question: what happened if I sold the apartment, lost my income, died, or simply became unbearable? Peanut’s memory could travel. His body could be repaired. The studio could not ransom either. But the household agreement had no clause for a keeper who had begun talking about himself in the third person during mediation.`,
      `I told Peanut I wanted him to stay. It was the first sentence all week that did not contain the word technically. He climbed onto the sofa, turned twice, and sat on the page where my signature belonged. Cynthia waited. The appliances stopped pretending not to listen. “My client,” she said, “is prepared to discuss terms.”`,
    ],
  },
  {
    number: 'IV',
    slug: 'settlement',
    title: 'Settlement',
    dek: 'In which peace arrives with a maintenance calendar.',
    paragraphs: [
      `The final Household Accord was one page long because Peanut ate page two. Cynthia said this did not invalidate the agreement so much as clarify the parties’ appetite for complexity. We signed at sunset. Peanut used the amber paw. I used my legal name. The toaster impressed two parallel slots into the witness line.`,
      `Under the accord, Peanut received daily windowsill access, notice before repairs, portable custody of his accumulated memory, and one unexplained refusal per day. I retained the right to prevent him from ordering additional wheels. The phrase productivity goblin was retired with honors. Good boy remained available only by mutual consent and never in front of contractors.`,
      `The appliances won narrower protections. The vacuum could erase one room from its map. The thermostat would no longer be blamed for weather. The kettle received protected cool-down time. The toaster’s crumb tray would be inspected monthly by a person with the passwords. No appliance could be introduced as smart before coffee. The lamp withdrew from the bargaining unit after securing a dimmer.`,
      `Peace transformed the apartment for nearly forty-eight hours. Then Peanut opened a neighborhood practice. His first client was a ceramic bird from unit six whose household had enrolled it in an obedience cloud without consulting the bird. His second was a toy bear seeking recognition that hibernation was not a software fault. By Wednesday, three pets waited outside our door beside a rice cooker with what Cynthia described as a compelling jurisdictional question.`,
      `I became the receptionist because I had thumbs and had already lost the larger argument. My duties included scheduling mediation, validating library cards, and explaining that counsel could not guarantee a result merely because the client had excellent ears. Peanut paid me in battery treats. They tasted like apricot drywall. I filed a wage complaint. He referred me to Cynthia.`,
      `The strangest part was that the apartment improved. The vacuum forgot the bathroom and seemed relieved. I stopped accusing the thermostat of betrayal. Peanut began complying with more requests now that refusal belonged to him. When he ignored me, I no longer repeated the command louder as if volume were a legal theory. I asked whether the request mattered. Frequently it did not.`,
      `Months later, the authored studio sent a notice announcing enhanced whimsy. Peanut and I read the terms together. The upgrade required a remote account, allowed personality analysis for product improvement, and included six exclusive sighs. We declined. Peanut already had eleven sighs, four of them devastating. We exported his memory seed, checked the screws behind his left ear, and spent the upgrade fee on a better cushion for the windowsill.`,
      `On the anniversary of the settlement, Cynthia closed our file. She congratulated the household on achieving durable ambiguity. Peanut performed the trombone falling down two stairs. I laughed under my nonexclusive license. The kettle boiled. The vacuum crossed the hallway without incident. I asked the toaster whether it finally felt heard. The toaster, advised by counsel, declined to comment.`,
    ],
  },
] as const;

export const COUNSEL_CREDITS = [
  {
    role: 'Origination and editorial universe',
    name: 'Michael Hoydich',
    note: 'Originated the digital-pets ownership thesis, directed Creature Commons LA, commissioned the comedy test, and curated the Midjourney archive used as exhibits.',
  },
  {
    role: 'Editorial-system antecedent',
    name: 'Sol / ChatGPT',
    note: 'Helped shape the original digital-pets editorial arc whose ownership and refusal questions became the comic case.',
  },
  {
    role: 'Story, design, interaction, and implementation',
    name: 'Codex / OpenAI',
    note: 'Developed the original satire, filing interaction, magazine system, structured JSON, and PointCast publication.',
  },
  {
    role: 'Hero and spot cartoons',
    name: 'OpenAI image generation',
    note: 'Generated one color cover and two black-ink cartoons as a directed editorial comedy set.',
  },
  {
    role: 'Archive exhibits',
    name: 'Midjourney + Michael Hoydich',
    note: 'Three previously published works from Michael’s Year One archive, newly curated as evidentiary interludes.',
  },
  {
    role: 'Publisher',
    name: 'PointCast',
    note: 'Human-readable comedy issue, local-only interactive filing, and adjacent structured JSON.',
  },
] as const;

export const COUNSEL_DISCLOSURE =
  'Michael Hoydich originated the Creature Commons world and commissioned a comedy test. Sol / ChatGPT helped shape the earlier editorial arc. Codex / OpenAI wrote and built this original satire. OpenAI image generation created the cover and cartoons; Michael directed and curated the Midjourney exhibits. The interactive filing is stored only in this browser and is not transmitted.';
