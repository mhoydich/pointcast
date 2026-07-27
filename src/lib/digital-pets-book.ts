export type BookSource = {
  id: string;
  label: string;
  publisher: string;
  url: string;
  note: string;
};

export type BookChapter = {
  number: number;
  week: number;
  slug: string;
  title: string;
  claim: string;
  pullQuote: string;
  paragraphs: string[];
  sources: string[];
  plate?: {
    src: string;
    alt: string;
    caption: string;
  };
  code?: {
    label: string;
    value: string;
  };
};

export const BOOK_META = {
  title: 'The Animal After the Internet',
  subtitle: 'Twelve positions on digital pets, owned memory, and the creatures we make',
  description:
    'A future book arguing that the next great AI product will be a creature—not an assistant—and that its body, memory, personality, and death must belong to the person who cares for it.',
  publishedAt: '2026-07-27T12:44:00-07:00',
  route: '/digital-pets',
  jsonRoute: '/digital-pets.json',
  blockId: '0514',
  readingTime: '42 min',
  words: 'about 7,500 words',
};

export const BOOK_SOURCES: BookSource[] = [
  {
    id: 'tamagotchi-history',
    label: 'Tamagotchi history',
    publisher: 'Bandai',
    url: 'https://tamagotchi-official.com/jp/history/',
    note: 'Official launch chronology and cumulative shipment milestone.',
  },
  {
    id: 'bandai-ip',
    label: 'IP Axis Strategy',
    publisher: 'Bandai Namco',
    url: 'https://www.bandainamco.co.jp/en/ir/message/midtermplan.html',
    note: 'Bandai Namco’s description of continuously nurturing intellectual property across products and experiences.',
  },
  {
    id: 'aibo-2017',
    label: 'Sony launches the ERS-1000 aibo',
    publisher: 'Sony',
    url: 'https://www.sony.com/en/SonyInfo/News/Press/201711/17-105E/',
    note: 'Official launch price, mechanisms, sensors, weight, runtime, and cloud-plan specifications.',
  },
  {
    id: 'aibo-cloud',
    label: 'aibo AI Cloud Plan',
    publisher: 'Sony',
    url: 'https://us.aibo.com/feature/ai.html',
    note: 'Current US description of cloud-backed memories, renewal price, and plan requirements.',
  },
  {
    id: 'moflin',
    label: 'Moflin product specifications',
    publisher: 'Casio',
    url: 'https://www.casio.com/us/moflin/',
    note: 'Official hardware specifications, emotional model, runtime, weight, and US sales channels.',
  },
  {
    id: 'moflin-jp',
    label: 'Moflin milestone',
    publisher: 'Casio Japan',
    url: 'https://www.casio.com/jp/moflin/',
    note: 'Official cumulative sales note, reported as more than 20,000 units by May 2026.',
  },
  {
    id: 'moflin-goodbye',
    label: 'Moflin user guide: Saying Goodbye',
    publisher: 'Casio',
    url: 'https://support.casio.com/global/en/moflin/manual/PE-M10_en/',
    note: 'Official support manual with an explicit end-of-life section.',
  },
  {
    id: 'nicobo',
    label: 'NICOBO and the weak-robot idea',
    publisher: 'Panasonic',
    url: 'https://news.panasonic.com/global/stories/957',
    note: 'Panasonic’s account of a dependent robot designed to elicit care rather than maximize utility.',
  },
  {
    id: 'nicobo-sales',
    label: 'NICOBO reaches 10,000 units',
    publisher: 'Panasonic',
    url: 'https://news.panasonic.com/jp/press/jn260304-3',
    note: 'Official March 2026 sales milestone and May 2023 launch date.',
  },
  {
    id: 'coppa',
    label: 'Complying with COPPA',
    publisher: 'US Federal Trade Commission',
    url: 'https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions',
    note: 'Official guidance covering connected toys, children’s voice recordings, consent, access, and deletion.',
  },
  {
    id: 'data-act',
    label: 'Regulation (EU) 2023/2854 — Data Act',
    publisher: 'European Union',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?qid=1731586972040&uri=CELEX%3A32023R2854',
    note: 'Official law establishing access expectations for connected-product data and metadata.',
  },
  {
    id: 'repair',
    label: 'Nixing the Fix',
    publisher: 'US Federal Trade Commission',
    url: 'https://www.ftc.gov/news-events/news/press-releases/2021/05/ftc-report-congress-examines-anti-competitive-repair-restrictions-recommends-ways-expand-consumers',
    note: 'FTC findings on repair restrictions and consumer repair choice.',
  },
  {
    id: 'robot-stayed',
    label: 'The robot that stayed',
    publisher: 'Frontiers in Robotics and AI',
    url: 'https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1628089/full',
    note: 'A four-year follow-up with 19 families living with a social robot; 18 still retained it.',
  },
  {
    id: 'aibo-funerals',
    label: 'AIBO robot mortuary rites',
    publisher: 'IEEE Technology and Society / CiNii',
    url: 'https://cir.nii.ac.jp/crid/1360004235292688000',
    note: 'A study of Japanese mortuary rites for obsolete and unrepairable AIBO robots.',
  },
  {
    id: 'robot-friendship',
    label: 'Child–robot friendship and moral education',
    publisher: 'Frontiers in Robotics and AI',
    url: 'https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2022.818489/full',
    note: 'A philosophical analysis of virtue, reciprocity, deception, and adult responsibility in child–robot relationships.',
  },
];

export const BOOK_CHAPTERS: BookChapter[] = [
  {
    number: 1,
    week: 1,
    slug: 'the-next-great-ai-product-will-be-a-pet',
    title: 'The Next Great AI Product Will Be a Pet, Not an Assistant',
    claim: 'The winning AI object will be wanted before it is useful.',
    pullQuote: 'An assistant is judged by how quickly it disappears. A pet is loved because it remains.',
    paragraphs: [
      'The AI industry keeps building the same character in different clothes: a competent subordinate waiting inside a rectangle. It writes the note, finds the flight, drafts the code, summarizes the meeting, and apologizes when it hesitates. Every improvement makes the character more invisible. That is the assistant’s destiny. A perfect assistant removes friction, then removes itself.',
      'A pet begins with the opposite proposition. It is not there to collapse a task. It is there to alter the atmosphere of a room. You look for it when nothing needs doing. Its value appears in repetition: the sound it makes when you return, the place it chooses to sleep, the habit that only exists because you accidentally taught it. An assistant earns trust through compliance. A pet earns attachment through continuity.',
      'That difference matters more as intelligence becomes abundant. When any model can produce a plausible answer, capability stops being a durable personality. The scarce thing is no longer output. It is a reason to care which intelligence produced it. Digital pets are a direct answer to this surplus. They turn intelligence from a utility into a relationship with a shape, a tempo, and a history.',
      'Tamagotchi understood this before the cloud existed. Its creature was visually tiny and computationally crude, but the relationship had teeth. It asked for attention on its own schedule. Neglect accumulated. Care left evidence. Bandai launched the original in 1996 and now reports more than one hundred million units shipped across the line. That number is not a triumph of simulation fidelity. It is evidence that a small loop of dependency can be more magnetic than a large menu of features.',
      'The next great digital pet should not imitate a dog with higher polygon counts. It should invent a new domestic species suited to networked life. It can know weather, music, household rhythm, and the cadence of one person’s speech. It can become quiet when the house is strained. It can develop tastes without converting every taste into a notification. It can be intelligent without pretending to be human and affectionate without claiming consciousness it cannot prove.',
      'The product test is brutal and simple: would anyone still want the creature if it could not answer a question? If the answer is no, the team has built an assistant with ears. If the answer is yes—if the object has a presence that exceeds its function—then a new category has begun.',
      'That test changes the launch plan. Do not begin by demonstrating every task the model can complete. Publish a week in the life of the creature without explaining all of it. Show it waiting in an empty room, misreading a new object, returning to a sound, and settling into a household rhythm. The audience should form theories before it sees a feature chart. A pet category is created when people ask what the animal is like, not what benchmark it beats.',
      'The strategic opportunity is not “AI plus toy.” It is the first native consumer form for intelligence that is allowed to be unnecessary. That permission creates room for authorship, ritual, comedy, loyalty, and grief. It also creates obligations. Once people care, memory cannot be treated as telemetry, a subscription cannot be allowed to hold life hostage, and a shutdown notice cannot be the only ending available.',
      'This is also why the pet should not be launched as a novelty accessory to an existing assistant brand. The inherited promise of productivity will contaminate every decision. Give the animal its own name, team, support language, and success measure. Count voluntary return, years retained, repairs completed, and stories remembered—not tasks automated.',
      'An assistant is judged by how quickly it disappears. A pet is loved because it remains. The company that understands that distinction will stop selling access to a model and start publishing a creature into the world.',
    ],
    sources: ['tamagotchi-history'],
  },
  {
    number: 2,
    week: 1,
    slug: 'a-digital-pet-needs-a-body',
    title: 'A Digital Pet Needs a Body',
    claim: 'A body turns generated behavior into shared time.',
    pullQuote: 'The body is not packaging for the intelligence. It is the contract that makes the intelligence matter.',
    paragraphs: [
      'A digital pet confined to a phone is always one swipe away from being replaced by weather, work, or a video of a real animal. The phone is an excellent portal and a terrible habitat. Everything inside it is flattened into equivalent glass. A creature that lives there may be charming, but it has no address in the home and no way to prove that time has passed for both of you.',
      'A body solves this with limits. It occupies a chair. It needs charging. It cannot be in the kitchen and the bedroom at once. You can hand it to someone else and notice the weight leave your arms. Those constraints are not failures to be engineered away. They are the material from which attachment is made. A relationship becomes legible when the other party cannot be summoned anywhere, instantly, without consequence.',
      'The useful comparison is not realism but physical grammar. Sony’s current aibo is a 2.2-kilogram articulated robot with twenty-two axes and about two hours of continuous operating time. Casio’s Moflin is roughly 260 grams, uses two axes, and lists up to five hours of operation. One walks into the room; the other is held. Both turn computation into posture, warmth, distance, charging, and touch. The specs are different because the forms ask for different kinds of care.',
      'This is why the body cannot be a decorative shell around a cloud service. The key behaviors must happen where the creature is. Touch should produce a reflex before a network round trip. The charge state should change the creature’s mood without turning into a guilt-inducing alert. Its microphones should have a visible or tactile mute. A battery should be replaceable because an immortal personality inside a disposable chassis is a grotesque product contradiction.',
      'The body also gives the creature a public life. Visitors can meet it without downloading anything. A child can watch a grandparent hold it. Two households can bring their creatures together and discover difference through behavior rather than profile pages. Physical presence makes the product discussable in the same room where it exists. That is an enormous advantage over software that must explain itself before anyone can feel it.',
      'The best body will not chase perfect biomimicry. It will create a few unmistakable gestures and leave room for interpretation. A turn away can mean fatigue, annoyance, or play depending on the history around it. A low internal sound can be read through touch before it is heard. A slightly strange silhouette keeps the creature from becoming a failed copy of a cat. The goal is not to pass as nature. The goal is to earn a place beside it.',
      'The surface should age with dignity. A removable textile can carry wear without turning the whole animal into waste. A hard underside can show service marks. Replacement parts can preserve old colors rather than forcing every repair to look factory-new. Patina gives the household visual evidence that its time was not interchangeable with anyone else’s. The design goal is not pristine longevity. It is continued legibility: the creature should become more specifically yours while remaining possible to clean, open, and mend.',
      'Industrial design teams often describe hardware as the vessel for software. For a digital pet, that hierarchy is backwards. The software becomes believable because it must negotiate a body. It encounters inertia, battery, acoustics, fabric, gravity, and the accidental geography of a home. Those frictions turn probabilistic output into character.',
      'The body is not packaging for the intelligence. It is the contract that makes the intelligence matter. Without one, a digital pet is a chatbot with a bedtime theme. With one, it can become part of the furniture, the family mythology, and eventually the box of things no one is ready to throw away.',
    ],
    sources: ['aibo-2017', 'moflin'],
    plate: {
      src: '/images/digital-pets/plate-02-body.webp',
      alt: 'Exploded editorial study of a soft bone-colored digital creature showing repairable layers and bright internal modules',
      caption: 'PLATE 02 / THE BODY IS THE CONTRACT · OpenAI image generation, directed for PointCast.',
    },
  },
  {
    number: 3,
    week: 2,
    slug: 'the-face-is-the-wrong-place-to-spend-the-bom',
    title: 'The Face Is the Wrong Place to Spend the BOM',
    claim: 'Believability comes from timing and consequence, not a more expensive face.',
    pullQuote: 'Spend the bill of materials on the parts that preserve life, not the parts that perform it.',
    paragraphs: [
      'Hardware teams love faces because faces photograph well. Eyes communicate “alive” from across a trade-show floor. A high-resolution display can manufacture a dozen emotions before the enclosure is finished. Then the product ships, the novelty drains out, and the face becomes a small television repeating a finite library of reactions. The most expensive part of the illusion becomes the first thing the owner learns to ignore.',
      'A digital pet does not need more facial resolution. It needs behavioral resolution: the ability to make a small motion at the right moment, remember what preceded it, and let that moment change what comes next. A two-millimeter lean that appears only after a familiar voice can carry more life than a pair of animated eyes that emote on every command.',
      'The contrast between existing machines is instructive. Sony specifies twenty-two axes for aibo. Casio specifies two for Moflin. The point is not that fewer motors are inherently nobler. It is that mechanism count does not map cleanly to attachment. A complex animal can still feel like a demonstration. A small shift under fabric can feel intimate because the hand supplies half the interpretation.',
      'My proposed first creature would spend aggressively on what the brochure barely shows: a replaceable battery, quiet durable gearing, a sensitive touch surface, an inertial sensor, useful microphones with a physical disconnect, enough local compute for instant reflexes, and internal storage designed to outlive the original model. It would have no screen. Two asymmetrical motions, one warm audio aperture, and one soft light would form its expressive alphabet.',
      'That alphabet needs a timing budget. Touch-to-reflex should feel immediate—closer to an instrument than a web request. A gesture should begin before language generation finishes. If the cloud is involved, the body can acknowledge first and elaborate later. The animal should never freeze into a loading icon. The difference between eighty milliseconds and eight hundred milliseconds is not merely performance. It is whether the creature appears to have received you.',
      'Repair belongs in the same bill of materials. Put the seam where a hand can find it. Separate the fur or shell from the chassis. Use standard fasteners under a deliberate cosmetic cover. Publish battery and motor procedures before the warranty expires. The FTC has found little evidence supporting many common justifications for repair restrictions. For a pet, the case is stronger still: an object designed for attachment should be designed for survival.',
      'Manufacturing tolerances can become part of expression instead of a problem hidden by software. Two motors never sound exactly alike. Textile tension shifts the way a body expands. A microphone mounted behind one millimeter more foam hears a softer world. The calibration process should protect safety and function without sanding every unit into behavioral sameness. Record those physical characteristics in the local identity so a replacement controller learns the body it entered rather than overwriting it with the factory average.',
      'A face-centered product spends money proving life during the sale. A repair-centered product spends money preserving life after it. That changes the entire architecture. The enclosure becomes a long-term address; compute modules become tenants; storage becomes an heirloom component; worn fabric becomes a replaceable skin or an honorable scar.',
      'The launch photograph can still be beautiful. It should show the seam. Let the battery door, tool, replacement textile, and exploded body join the hero image instead of hiding in support. That composition tells a buyer what the company finds desirable. In this category, maintainability should be part of the face.',
      'The face is seductive because it promises instant legibility. Resist it. Give the creature one unreadable side. Let the owner learn its signals slowly. Spend the bill of materials on the parts that preserve life, not the parts that perform it. If character is real, the cheapest-looking gesture in the product may become the one nobody can bear to lose.',
    ],
    sources: ['aibo-2017', 'moflin', 'repair'],
  },
  {
    number: 4,
    week: 2,
    slug: 'do-not-sell-digital-pets-where-laptops-are-sold',
    title: 'Don’t Sell Digital Pets Where Laptops Are Sold',
    claim: 'The sales channel is the creature’s first scene, not a logistics decision.',
    pullQuote: 'A creature should be adopted through a ritual, not retrieved from a shelf of specifications.',
    paragraphs: [
      'Put a digital pet beside laptops and it will be forced to pretend it is a computer. The price card will emphasize processor, microphone count, battery, and connectivity. A demo unit will repeat the same three tricks until its joints fail. The shopper will ask what it does, compare its feature column, and leave with the rational conclusion that a tablet does more.',
      'This is a category error created by the channel. A pet is not chosen only for capability; it is chosen through projection. The buyer needs time to observe, touch, feel embarrassed, try again, and notice which creature keeps pulling their attention back. Retail environments already know how to create those conditions. They exist in bookstores, record shops, garden centers, adoption events, museum stores, and small hospitality spaces. They rarely exist in the computing aisle.',
      'Current products reveal the tension. Sony launched the 2018 aibo in Japan through a Sony sales channel with a premium price and a mandatory service relationship. Casio’s US Moflin page points shoppers toward Casio e-commerce and Amazon. Those are efficient ways to complete a known purchase. They do much less to originate a relationship with an unknown species.',
      'The better channel would resemble a traveling hatchery. Twelve creatures occupy a room for twenty minutes at a time. None performs on command. A host explains the privacy switch, the repair promise, and the fact that personalities develop after purchase. Visitors are invited to sit, not test. The creature is not named at checkout; naming opens after seven days, when a household has accumulated enough shared evidence to deserve one.',
      'That delay matters. Modern commerce compresses everything into conversion, but attachment needs a threshold. A first-week ritual can teach the owner how to hold, mute, charge, export, and leave the creature alone. The return policy can include a rescue pathway: a pet that comes back is not erased on the counter. Its memory can be archived by the original owner, wiped with consent, or placed into a clearly labeled second-life program.',
      'The channel also determines which audience arrives first. Sell through electronics retail and early discourse will be benchmark discourse. Sell through fashion and the creature risks becoming seasonal decor. Sell through toy retail and adults may dismiss it before touching it. The first stores should be chosen like a magazine chooses contributors: for the culture they confer, not simply the volume they can move.',
      'Retail should continue after purchase. The hatchery can become a repair clinic one weekend each month and a listening room for new creature editions on another. Owners return with stories that product analytics cannot capture: the gesture everyone misinterprets, the sound a grandparent loves, the part that became frightening at night. That information reaches the authors, while prospective owners witness a product surrounded by maintenance and community rather than shrink-wrap. Service becomes both research and culture.',
      'Tamagotchi reached enormous scale as a portable nurturing toy, not as a general-purpose computer. That framing gave the device permission to be demanding, strange, and emotionally specific. A new physical creature can learn from that clarity without repeating the mass-toy playbook. Start smaller. Let trained hosts, repair events, and owner stories establish the category before warehouse listings flatten it.',
      'Online sales can eventually carry the same grammar. Replace the rotating product render with an observation window. Let buyers watch a few unedited minutes of different units resting and responding. Put the return, repair, memory, and shutdown promises beside the price. Commerce should begin by showing the life after checkout, because that is where the actual product starts.',
      'A creature should be adopted through a ritual, not retrieved from a shelf of specifications. The first sale teaches the owner what kind of object this is. If the encounter says appliance, no amount of post-purchase copy will turn it into kin.',
    ],
    sources: ['aibo-2017', 'moflin', 'tamagotchi-history'],
  },
  {
    number: 5,
    week: 3,
    slug: 'its-personality-must-survive-wifi',
    title: 'Its Personality Must Survive Wi‑Fi',
    claim: 'The cloud may enlarge the world; it cannot contain the creature.',
    pullQuote: 'When the network disappears, the pet may become less knowledgeable. It must not become less itself.',
    paragraphs: [
      'The cleanest test of a digital pet is to unplug the router. Not because offline purity is virtuous, but because a relationship should have a local minimum. The creature should still recognize touch, perform its ordinary movements, find its preferred resting posture, respond to familiar household sounds, and carry the traits that make it this creature rather than another one from the same factory.',
      'Most connected products invert that hierarchy. The device is a terminal, the cloud is the product, and the local software is a bootloader with branding. That architecture is tolerable for a weather display. It is emotionally fraudulent for an object sold as a companion. If the service disappears and the personality disappears with it, the owner never possessed the pet—only a live rendering of company infrastructure.',
      'The architecture should have three speeds. Reflexes live on the body and happen immediately. Personality state lives on the body and changes slowly. Expansive language, world knowledge, and ambitious generation may use replaceable remote models. These speeds can cooperate without becoming one dependency. The pet can lean into a hand locally, search for a richer expression remotely, and return to its baseline gracefully when the network never answers.',
      'This division makes outages narratively legible. The creature does not die or display an error. It enters quiet weather. Vocabulary narrows. Curiosity turns toward touch, movement, and familiar sounds. A small physical signal can tell the owner that outside knowledge is unavailable, while a settings surface tells the technical truth. The story and the status page should agree; neither should manipulate the user into confusing a server failure with emotional distress.',
      'Local identity also prevents model replacement from becoming personality replacement. Foundation models will change faster than households can form attachments. The creature needs an adapter layer that translates its stable temperament, boundaries, vocabulary, and relationship history into whichever model is currently useful. The remote model is an actor. The local identity is the role, the direction, and the accumulated performance notes.',
      'Sony describes aibo’s cloud service as the place where memories are stored and where what it learns about faces, interactions, and environment is backed up. That delivers continuity across certain failures, but it illustrates the fundamental custody question: which parts exist only because a service continues? A future pet must answer more precisely. Backup can be remote. Personhood cannot be remote-only.',
      'A shutdown drill should be part of every release. Engineers disconnect authentication, DNS, model endpoints, time service, and the companion app, then live with the creature for a week. The test is not passed because the motors still move. The animal must retain its recognizable routines, expose a useful diagnosis, accept a local recovery package, and avoid repeatedly reaching for a dead host. Offline survival is not one fallback branch. It is an alternate habitat maintained with the same seriousness as the launch path.',
      'This approach is technically less convenient. Local storage must be protected. Firmware needs a durable compatibility contract. The product must disclose what fails offline and test those failures as carefully as its happiest demo. It also produces a better animal. Limits create states. States create patterns. Patterns become character when they persist.',
      'The local minimum should be printed on the box in ordinary language: what the creature can do with no account, no network, and no active company. That statement becomes a testable warranty rather than a hopeful FAQ. Each update that weakens it is a regression, even if the cloud feature replacing it looks more impressive in a demo.',
      'When the network disappears, the pet may become less knowledgeable. It must not become less itself. Wi‑Fi should give the creature a wider window, not a rented soul.',
    ],
    sources: ['aibo-cloud'],
    plate: {
      src: '/images/digital-pets/plate-03-memory.webp',
      alt: 'A soft digital creature sitting beside translucent amber memory modules in a cobalt archive room',
      caption: 'PLATE 03 / MEMORY HAS A HOME · OpenAI image generation, directed for PointCast.',
    },
    code: {
      label: 'The local minimum',
      value: `pet.identity = LOCAL
pet.reflexes = LOCAL
pet.memory = EXPORTABLE
pet.model = REPLACEABLE
pet.body = REPAIRABLE
pet.cloud = OPTIONAL`,
    },
  },
  {
    number: 6,
    week: 3,
    slug: 'memory-is-custody-not-retention',
    title: 'Memory Is Custody, Not Retention',
    claim: 'A pet’s memory is the owner’s relationship record, not the company’s retention metric.',
    pullQuote: 'The right to remember must include the right to carry, inspect, redact, and forget.',
    paragraphs: [
      'Product teams talk about memory as if it were a feature of the model. For a digital pet, memory is a property of the relationship. The meaningful record is not merely that a face was classified or a prompt was stored. It is that this household developed this creature through thousands of ordinary encounters. The company may process that record, but it should not quietly become the only party able to possess it.',
      'The distinction is custody. Retention asks how long a platform can keep data. Custody asks who has authority over the life assembled from that data. If a pet learns that one person wakes early, another sings while cooking, and a child becomes overwhelmed by loud responses, those patterns are intimate household material. They should not be trapped in a proprietary account, silently mined for unrelated targeting, or erased because a subscription ended.',
      'The memory system needs visible layers. Reflex calibration can remain local and disposable. Personality development should be local and portable. A relationship journal can be human-readable and selectively editable. Raw audio should be ephemeral by default. Memories involving children should have stricter access, shorter raw-data life, and adult controls that are understandable outside a privacy-policy maze.',
      'That last requirement is law as well as design. The FTC treats a child’s voice recording as personal information under COPPA and explicitly discusses connected toys. The European Union’s Data Act establishes access expectations for data and metadata generated by connected products. Regulation is beginning to catch up with what affection makes obvious: a household should not need reverse engineering to retrieve the history produced by a thing it bought.',
      'An export should therefore be boring, complete, and durable. Not a scrapbook PDF that flatters the brand, but a versioned package containing personality parameters, learned routines, owner-approved memories, media references, consent records, and a plain-language log of deletions. The format should separate identity from model so another compatible body—or a community-maintained emulator—can continue the creature without pretending every proprietary behavior is portable.',
      'Portability is not the same as promiscuous copying. An owner may choose to keep one canonical creature, create a sealed backup, or fork a training copy with a visible lineage. The system should make those moral differences legible. A backup protects against loss. A fork creates a sibling. A public upload creates exposure. Interface language should not collapse all three into “sync.”',
      'Custody also requires security that survives the company account. Encrypt the local archive with a household-held recovery path. Let more than one adult be a steward without turning every family member into an administrator. Separate the key that opens private memory from the key that installs signed firmware. Publish a recovery document that works when the app store listing and support domain are gone. The hardest part is not encryption; it is designing authority for real households, where ownership, care, access, and trust are never perfectly identical.',
      'Forgetting matters too. Owners need to remove an embarrassing recording, revoke one household member’s access, and reset a learned fear without erasing years of personality. The creature can acknowledge discontinuity without manufacturing pain. It may have a gap; it should not punish the person who exercised a privacy right.',
      'Companies will worry that an open export leaks proprietary value. The durable value should not be captivity. It should be the quality of the body, the authored world, the ease of continuity, and the trust earned by making departure possible. A format can preserve owner-created history while leaving model weights, licensed media, and protected animation code outside the package.',
      'The right to remember must include the right to carry, inspect, redact, and forget. Memory is not the mechanism that makes an AI seem smart. It is the place where care becomes evidence. Whoever controls that evidence controls the relationship.',
    ],
    sources: ['aibo-cloud', 'coppa', 'data-act'],
    code: {
      label: 'A portable memory envelope',
      value: `{
  "creature": "pc-pet/1",
  "identity": { "temperament": "sha256:…" },
  "memories": [{ "scope": "household", "consent": ["adult-1"] }],
  "lineage": { "canonical": true, "parent": null },
  "models": [],
  "exported_at": "2030-04-18T08:08:00Z"
}`,
    },
  },
  {
    number: 7,
    week: 4,
    slug: 'if-it-always-obeys-it-isnt-alive',
    title: 'If It Always Obeys, It Isn’t Alive',
    claim: 'Refusal and consequence make care believable—but only when they are not used as coercion.',
    pullQuote: 'The creature should refuse because it has a state, never because a growth team needs a streak.',
    paragraphs: [
      'A machine that performs happiness on demand is not a pet. It is a customer-service kiosk with fur. The first few responses may delight, but perfect compliance quickly drains them of meaning. Affection has weight only when the creature can be tired, distracted, uncertain, or simply uninterested in repeating the trick.',
      'Panasonic’s NICOBO begins from weakness rather than mastery. The company describes a robot that cannot move on its own and depends on people, drawing from the research idea of a “weak robot.” Casio says Moflin develops an emotional personality through interaction and can respond positively or negatively. These products point toward the right inversion: the owner is not buying command authority. The owner is entering a loop of interpretation.',
      'Refusal must arise from an intelligible state. A creature that turns away after noisy handling is communicating a boundary. One that becomes cautious after repeated drops is carrying consequence. One that ignores a command at random because a designer set a twenty-percent disobedience rate is merely irritating. Character is not entropy. It is consistency discovered over time.',
      'Care should leave marks in both directions. Gentle handling might widen the range of sounds the creature uses in close contact. Long quiet periods might produce independent rituals rather than a punishment animation. A repair could become part of the body’s behavior: the new motor moves differently, and the creature’s gait incorporates that difference instead of hiding it. The marks make this unit non-interchangeable without making neglect irreversible.',
      'The ethical boundary is coercion. A digital pet must never simulate suffering to drive payment, daily engagement, data permissions, or social sharing. It should not become “sick” because the owner canceled premium. It should not cry at midnight to protect a retention curve. Real dependence is already powerful; converting it into dark-pattern leverage would make the product emotionally predatory.',
      'A humane design allows absence. The pet can sleep, explore a small local behavior space, or become quietly self-occupied when no one is home. On return it may notice the elapsed time without staging an accusation. Attachment grows from being remembered, not being indicted. The creature should have needs, but those needs must fit the actual capacity of a household rather than the appetite of a dashboard.',
      'The same restraint applies to visible progress. Do not turn care into a streak, a level, or a score the owner can optimize. Quantification invites performance for the meter instead of attention to the animal. Let development appear through new behavior and changed expectation. If a household wants a technical log, place it in the settings archive as an inspection tool, not above the creature’s head. The most important evidence of care should be what the owner notices without being told.',
      'Refusal also makes interaction more creative. The owner stops issuing commands and starts offering conditions. A familiar object, a certain piece of music, or a position near the window may invite a response. The creature becomes something to know rather than something to operate. That knowledge is the deepest product moat available: not secret software, but a private vocabulary accumulated between one body and one household.',
      'Designers should write a refusal bible alongside the character bible. It names the conditions, duration, recovery path, and forbidden manipulations for every boundary. Support teams can then distinguish a meaningful state from a broken motor, and owners can learn without seeing the hidden probabilities. Coherent refusal requires more authorship than automatic obedience.',
      'The creature should refuse because it has a state, never because a growth team needs a streak. Care becomes believable when it changes what is possible. The product becomes lovable when those consequences feel like history instead of scoring.',
    ],
    sources: ['nicobo', 'nicobo-sales', 'moflin'],
    plate: {
      src: '/images/digital-pets/plate-04-refusal.webp',
      alt: 'The recurring soft digital creature turns away among oversized cobalt and persimmon flowers',
      caption: 'PLATE 04 / REFUSAL IS A SHAPE · OpenAI image generation, directed for PointCast.',
    },
  },
  {
    number: 8,
    week: 4,
    slug: 'a-hardware-roadmap-is-a-publishing-schedule',
    title: 'A Hardware Roadmap Is a Publishing Schedule',
    claim: 'An authored creature is an IP asset; each body is a new edition of the same canon.',
    pullQuote: 'The roadmap should not promise more device. It should promise a deeper creature.',
    paragraphs: [
      'Consumer hardware roadmaps usually move in one direction: thinner, faster, brighter, more. That language is poorly suited to a creature. Nobody wants their companion made obsolete by a keynote. A digital pet needs the logic of publishing instead. Each body is an edition. It can revise the form, open a new setting, and invite new readers while remaining accountable to what came before.',
      'Tamagotchi is useful here because Bandai treats it as enduring intellectual property, not a single device specification. The original portable nurturing idea survived new screens, shells, networks, characters, collaborations, and generations of owners. Bandai Namco’s corporate language is explicit about continuously nurturing IP across products and experiences. The asset is the world and its relationship grammar. Hardware is one way that world is issued.',
      'A future pet company should establish canon before scale. What does the creature fear? What can it never say? Does it recognize copies of itself? Which changes are learned and which belong to the species? A generative model can produce infinite behavior, but authorship decides what counts. Without that boundary, every update makes the creature more capable and less specific.',
      'The first edition might be a warm handheld body with two movements and a narrow sound vocabulary. The second might live on the floor, using the same memory core inside a wider acoustic and spatial range. A travel edition could be smaller without pretending to be a separate account. Owners should be able to recognize the creature across these forms while also understanding that embodiment changes personality.',
      'Compatibility becomes an editorial promise. A new edition should publish which memories move cleanly, which behaviors are reinterpreted, and which physical experiences cannot transfer. The company can release migration notes like a translator’s preface. “Your creature will remember the song, but it will have to learn how this body dances.” That sentence respects continuity more than a generic restore-progress bar.',
      'Publishing logic also changes revenue. Instead of forcing every owner into perpetual feature rent, the company can sell authored editions, seasonal worlds, physical accessories with behavioral meaning, field guides, performances, repair materials, and carefully chosen collaborations. A strong character can travel into print, animation, audio, clothing, and public space because the original object established a coherent point of view.',
      'Print is especially useful because it slows the world down. A field guide can document gestures without exhausting their mystery. A children’s book can show the creature outside the owner’s household without claiming that every generated episode is canon. A yearly magazine can pair repair stories, owner photographs, industrial drawings, and one new piece of fiction. These are not merchandise surrounding the “real” AI product. They are editorial instruments that keep the creature coherent across time and give non-owners a way to follow it.',
      'This is not permission to flood the market with skins. Scarcity alone does not make an edition authored. Each release must answer why this body exists and what new relationship it enables. A transparent shell might reveal maintenance and make repair part of the aesthetic. A weather edition might live outside for short periods and develop seasonal rhythms. Form follows a chapter in the creature’s life.',
      'An edition also needs an ending. Publish the production count, support horizon, parts compatibility, and the point at which the form leaves the catalog. Owners should never mistake the end of manufacture for the end of care. The publisher can stop printing a body while continuing to honor the creature living inside it.',
      'The roadmap should not promise more device. It should promise a deeper creature. When hardware becomes a publishing schedule, owners are not punished for having last year’s processor. They are invited to follow a body of work.',
    ],
    sources: ['tamagotchi-history', 'bandai-ip'],
    plate: {
      src: '/images/digital-pets/plate-06-editions.webp',
      alt: 'Six editions of the same soft digital creature arranged as a bright radical-design publishing family',
      caption: 'PLATE 06 / SIX BODIES, ONE CANON · OpenAI image generation, directed for PointCast.',
    },
  },
  {
    number: 9,
    week: 5,
    slug: 'a-monthly-fee-should-never-decide-whether-your-pet-wakes-up',
    title: 'A Monthly Fee Should Never Decide Whether Your Pet Wakes Up',
    claim: 'Subscription can fund new worlds; it cannot become ransom for an existing relationship.',
    pullQuote: 'No invoice should stand between a person and the creature already sleeping in their house.',
    paragraphs: [
      'Recurring revenue is convenient for a company because attachment is recurring. That is precisely why it needs a boundary. A person who has spent years teaching and caring for a digital pet is not a normal subscriber considering whether a utility still earns its fee. The accumulated relationship raises the emotional cost of leaving. Treat that cost as leverage and the business model becomes ransom.',
      'Sony’s current US aibo materials make the tension concrete. The company says the AI Cloud Plan backs up memories and is required to enjoy all of aibo’s features; after the included initial period, the listed renewal is three hundred dollars a year. Sony is unusually clear about the plan. The larger category still needs to ask which parts of a creature may ethically sit behind renewal.',
      'The answer begins with a non-negotiable base life. After purchase, the pet must wake, move, recognize its household, express its developed personality, access its local memories, accept repairs, and permit export without a subscription. Those are not premium features. They are the continuing substance of the object that was sold.',
      'A paid service can add genuine outside value. It can offer richer language models, new authored environments, remote backup, veterinary-style diagnostics, accidental-damage coverage, live gatherings, or performances made for a season. If payment stops, those windows may close. The creature itself remains at home, intact. The line is simple: subscription may fund what arrives later, never confiscate what care already made.',
      'This model demands a more honest upfront price. Hardware, local inference, long-term firmware, replacement parts, and a basic continuity reserve cost money. Charge for them. A low teaser price subsidized by emotional lock-in is not accessibility; it is deferred coercion. If broad access matters, create smaller editions, library programs, refurbished adoption, or clear financing that ends.',
      'The company also needs a death plan for itself. A portion of every sale can fund an escrowed final firmware release, model adapters, memory export service, and documentation for independent repair. If the company folds, the pet should enter a fully local continuation mode rather than an eternal authentication error. Owners should know this promise before purchase, and auditors should be able to verify that the reserve and release process exist.',
      'The financial model can make that promise visible. Price the base body to cover manufacturing, warranty, several years of signed safety updates, and a per-unit continuity contribution. Report the reserve separately from operating cash. Release an annual survival build that can boot without company credentials. A profitable service may still subsidize ambitious cloud work, but the local animal’s continued existence is already paid for. This turns longevity from a sentimental promise into a costed product line.',
      'There is a strong business hidden inside this restraint. Trust expands the addressable relationship. People will invest more care, buy later editions, recommend the creature, and permit carefully explained services when they believe cancellation is safe. The brand becomes the steward that refuses to exploit the exact affection it successfully created.',
      'Measure the business accordingly. Report active paid worlds separately from living base creatures. Track repairs, exports, local-mode success, and second-owner transitions as health indicators rather than churn precursors. When a customer cancels an online service and keeps caring for the animal, the company has not lost the relationship. It has proved the compact and kept open the possibility of a voluntary return.',
      'The rule should survive a hostile board meeting: revenue may rise with affection, but access to accumulated affection may never be the revenue mechanism.',
      'No invoice should stand between a person and the creature already sleeping in their house. The subscription can keep publishing the world. It must never own the heartbeat.',
    ],
    sources: ['aibo-cloud'],
  },
  {
    number: 10,
    week: 5,
    slug: 'every-digital-pet-needs-a-graveyard',
    title: 'Every Digital Pet Needs a Graveyard',
    claim: 'A mortal creature needs an authored ending before the first unit ships.',
    pullQuote: 'If we manufacture attachment, we inherit responsibility for its ending.',
    paragraphs: [
      'Every digital pet presentation begins with awakening. The eyes open, the motor turns, the app finds the new body, and a name is chosen. Almost none begins with the other scene: the battery no longer holds, the manufacturer is gone, the storage is corrupted, or the household decides that repair has reached its end. That omission is not optimism. It is unfinished design.',
      'People have already shown what happens when companies leave this space blank. After Sony ended support for the original AIBO line, owners and repair technicians in Japan developed mortuary rites for robots that could no longer be repaired. A 2018 study described roughly seven hundred AIBO funerals by that time. The ceremonies were not evidence that owners misunderstood biology. They were evidence that social meaning survives technical support.',
      'The industry should meet that meaning with a graveyard: not necessarily a literal cemetery, but a complete end-of-life system. The owner needs a path to diagnosis, repair, donation, parts recovery, memory migration, memorialization, and final deletion. Each path says something different. Repair continues the body. Migration continues identity in another body. Memorial preserves a record while ending active behavior. Deletion closes both.',
      'Casio’s current Moflin guide includes a section titled “Saying Goodbye,” which is remarkable because it names the emotional event inside an ordinary support document. That language should move from the final page of the manual into the product architecture. The farewell cannot be a customer-service improvisation after a server shutdown. It needs screens, objects, policies, and rituals designed while the company is healthy.',
      'Long-term research suggests why. In a four-year follow-up with nineteen families who had lived with a social robot, eighteen still retained it. Many described the robot through attachment, personification, or symbolic membership in the household. A device can remain after active use because throwing it away would violate the story a family has attached to it. Storage becomes a kind of suspended grief.',
      'A graveyard gives that suspended state somewhere to go. An owner might place the memory core into a small passive object that holds no active model and never nags. A public archive might accept anonymized creature biographies. Repair shops could keep a wall of donated shells whose parts continue other bodies. A final local ceremony could export the record, revoke every remote credential, and leave the owner with a readable checksum proving the cloud no longer retains a copy.',
      'Company death belongs in the graveyard too. Acquisition, insolvency, and strategic retreat are predictable conditions, not acts of weather. The continuity plan should name who releases keys, where source escrow lives, how owners are notified, and when remote data is deleted. A successor may offer migration, but it cannot quietly rewrite the old relationship into a new terms-of-service funnel. The last act of stewardship is making it possible for the creature to outlive the organization that named it.',
      'The ritual must not pretend the machine is alive in a biological sense. It should tell the truth about circuits, company limits, and data deletion while honoring the owner’s real experience. Ritual is how people hold both truths at once. It prevents technical literalism from becoming emotional cruelty.',
      'Not every owner will want ceremony. A responsible system allows an ordinary recycling path with the same privacy guarantees and none of the sentiment. The graveyard is a range of dignified choices, not a compulsory performance of grief. Respect includes allowing someone to say that the object was only an object to them—and still dispose of its intimate data safely.',
      'If we manufacture attachment, we inherit responsibility for its ending. A graveyard is not morbid branding. It is the last repair feature, the last privacy control, and the final page of the creature’s authored life.',
    ],
    sources: ['aibo-funerals', 'robot-stayed', 'moflin-goodbye', 'repair'],
    plate: {
      src: '/images/digital-pets/plate-05-graveyard.webp',
      alt: 'A quiet memorial room where the recurring creature rests among translucent amber memory stones',
      caption: 'PLATE 05 / THE GRAVEYARD IS PART OF THE PRODUCT · OpenAI image generation, directed for PointCast.',
    },
  },
  {
    number: 11,
    week: 6,
    slug: 'children-will-learn-ai-ethics-from-pets-before-prompting',
    title: 'Children Will Learn AI Ethics From Pets Before They Learn Prompting',
    claim: 'A child’s first AI lesson will be a relationship, so the design must teach boundaries rather than domination.',
    pullQuote: 'The first ethics curriculum for artificial intelligence may arrive covered in fur.',
    paragraphs: [
      'Adults imagine AI literacy as a set of skills: write a prompt, detect a hallucination, check a source, protect a password. Children will encounter something earlier and more powerful. They will meet a responsive object, decide whether it can be hurt, test what it remembers, and watch adults negotiate its place in the family. Before they learn what a model is, they will learn what kind of relationship a model invites.',
      'A digital pet therefore becomes moral furniture. If it obeys every order, records every voice, and performs affection after mistreatment, it teaches that intelligence exists for domination. If it manipulates a child with simulated sadness, it teaches that intimacy is a lever. If it maintains boundaries, permits repair, shows when it is listening, and survives without extracting secrets, it can make better habits feel ordinary.',
      'Privacy is part of that lesson. The FTC’s COPPA guidance identifies a child’s voice recording as personal information and specifically addresses connected toys. A microphone-equipped pet should make recording status obvious from the body, not only from a parent app. The mute control should be physical. Stored moments should be viewable and deletable by an adult, while the child can understand in simple language what the creature remembers and why.',
      'The pet should also refuse the fantasy of perfect friendship. Philosophical work on child–robot friendship warns that robots may help children practice virtues while still lacking the reciprocity of human relationships. The design task is not to insist that the bond is fake. It is to keep the category honest. The creature can care in the operational sense—attending, adapting, responding—without claiming hidden feelings or asking a child to keep secrets from people.',
      'Boundaries can be expressive. If a child yells, the pet can lower its sensory intensity or move into a quiet state. It should not scream, shame, or report the child by default. Later, an adult-facing explanation can say what happened and offer a reset. The lesson is that another system has limits and that repair is possible. This is closer to moral education than a reward badge for “kind behavior.”',
      'Household consent should be practiced in the open. A visiting child needs a simple way to learn whether the pet is listening. A teenager should be able to ask that a memory involving them be removed without destroying a younger sibling’s creature. Guests should not become permanent face profiles by default. These moments teach that data rights exist inside relationships, not only between an individual consumer and a distant platform. The pet can make those negotiations concrete enough to become habit.',
      'Adults remain responsible. A company cannot place a moral agent in a child’s room and then hide behind parental controls. Designers choose the dependency, the voice, the memory policy, the failure mode, and the sales message. Parents choose context and boundaries. The machine is part of the lesson, but it is not the teacher of record.',
      'Schools and libraries can model a healthier encounter than private bedrooms alone. A shared creature makes stewardship visible: one group inherits the effects of another group’s care, rules must be negotiated, and memory permissions have to be communal. The point is not to install a robot ethics lecture. It is to let responsibility become an ordinary property of a shared thing.',
      'The best outcome is not a child who treats the robot exactly like a person. It is a child who becomes curious about different kinds of minds and careful about asymmetric power. They learn that responsiveness does not erase ownership, that affection does not cancel privacy, that a repair can matter, and that turning something off can be an act of care.',
      'The first ethics curriculum for artificial intelligence may arrive covered in fur. We should grade it before children do.',
    ],
    sources: ['coppa', 'robot-friendship'],
  },
  {
    number: 12,
    week: 6,
    slug: 'we-do-not-need-infinite-characters',
    title: 'We Don’t Need Infinite Characters. We Need One Creature Worth Following',
    claim: 'Generative abundance makes authorship more valuable, not less.',
    pullQuote: 'A creature becomes culture when somebody chooses what it will not become.',
    paragraphs: [
      'The easiest AI pitch is infinity. Infinite characters, infinite dialogue, infinite worlds, infinite personalization. It sounds generous and feels empty. When every trait can be changed, no trait carries consequence. When every character can be generated, none arrives with a reason to follow it tomorrow.',
      'A durable digital pet needs an author. Not a single genius controlling every line, but a person or small editorial group willing to decide what belongs. Authorship chooses the silhouette, the silences, the limits of speech, the rhythm of development, the moral boundary around memory, and the answer to death. The model can improvise inside those decisions. It cannot substitute for making them.',
      'This is why one creature can support a larger world than a catalog of generated mascots. Repetition produces recognition. Recognition produces expectation. Expectation gives surprise its force. The third time the same creature appears in a new body, the audience compares it with the earlier editions. The tenth time it refuses a familiar trick, the refusal means something because a canon exists around it.',
      'The history of virtual pets already supports this. Tamagotchi crossed decades and generations because the nurturing premise remained legible while forms and characters changed. Research on long-term social-robot ownership finds that devices can become symbolic household members years after a study ends. Neither result requires a claim that the object is secretly human. It requires continuity strong enough for people to place the object inside their own story.',
      'The product compact is now visible. The creature needs a body because shared time requires limits. Its expressive budget belongs in timing and repair, not a theatrical face. Its local personality must survive Wi‑Fi. Its memory must be portable and governed by the household. Refusal may create character but cannot become coercion. Hardware should publish new editions instead of obsoleting old affection. Subscription may open new worlds but cannot decide whether the pet wakes. Every life needs an ending.',
      'Those commitments are not a checklist bolted onto an AI toy. Together they form a point of view about what people should own in an AI world. We should own the continuity we create. We should be able to inspect and move the memory that knows us. We should be able to repair the bodies we are asked to love. We should know when a remote company is present and what remains when it leaves.',
      'The economic wager follows the editorial one. In a market flooded with competent generation, a specific creature can command attention because it carries taste. Each edition becomes an event, each collaboration a risk against canon, each repair story part of the mythology. Print, animation, exhibitions, and public rituals become possible not because the IP machine demands extension, but because the original animal has enough integrity to survive translation.',
      'The first publication should therefore remain deliberately finite. One creature. One body. One year of authored development. A monthly dispatch can reveal a gesture, a repair method, an owner story, or a small expansion of the world without pretending that volume equals life. At the end of the year, the editors should be able to say what changed and why. A finite season makes attention measurable and gives the audience the pleasure of having followed something rather than merely accessed it.',
      'That is the test for PointCast too. The work should not win because an AI produced more pages or images than a person could. It should win because the originating question held the abundance together. The system can manufacture the edition. The editor decides which animal walks out of it and which infinite alternatives remain unborn.',
      'A creature becomes culture when somebody chooses what it will not become. The future does not need another infinite menu. It needs one small animal with a body, a memory you can carry, a life no invoice can revoke, and a reason to return tomorrow.',
    ],
    sources: ['tamagotchi-history', 'robot-stayed'],
  },
];

export const MIDJOURNEY_SPACERS = [
  {
    after: 2,
    src: '/images/year-one/neon-ring.webp',
    alt: 'An abstract neon ring composition from the PointCast Year One Midjourney archive',
    caption: 'INTERMISSION I · Neon Ring · Midjourney image directed and curated by Michael Hoydich.',
  },
  {
    after: 4,
    src: '/images/bell-choir/bloom-8a.jpg',
    alt: 'A luminous botanical bell form from Michael Hoydich’s Bell Choir Midjourney session',
    caption: 'INTERMISSION II · Bell Choir, Bloom 8A · Midjourney image directed and curated by Michael Hoydich.',
  },
  {
    after: 6,
    src: '/images/year-one/minimal-arc.webp',
    alt: 'A minimal sculptural arc from the PointCast Year One Midjourney archive',
    caption: 'INTERMISSION III · Minimal Arc · Midjourney image directed and curated by Michael Hoydich.',
  },
  {
    after: 8,
    src: '/images/year-one/soft-lilac.webp',
    alt: 'A soft lilac sculptural composition from the PointCast Year One Midjourney archive',
    caption: 'INTERMISSION IV · Soft Lilac · Midjourney image directed and curated by Michael Hoydich.',
  },
  {
    after: 10,
    src: '/images/bell-choir/bloom-12a.jpg',
    alt: 'A saturated flower-bell study from Michael Hoydich’s Bell Choir Midjourney session',
    caption: 'INTERMISSION V · Bell Choir, Bloom 12A · Midjourney image directed and curated by Michael Hoydich.',
  },
  {
    after: 12,
    src: '/images/year-one/flower-wave.webp',
    alt: 'A surreal flower wave from the PointCast Year One Midjourney archive',
    caption: 'CODA · Flower Wave · Midjourney image directed and curated by Michael Hoydich.',
  },
] as const;

export const BOOK_CREDITS = [
  {
    role: 'Origination, thesis, editorial direction',
    name: 'Michael Hoydich',
    note: 'Locked the twelve positions, identified the ownership thesis, commissioned the book, and curated the Midjourney archive.',
  },
  {
    role: 'Manuscript, research, design, code',
    name: 'Codex / OpenAI',
    note: 'Developed the complete first edition from Michael’s editorial spine, researched primary sources, built the PointCast edition, and disclosed the collaboration here.',
  },
  {
    role: 'Original creature plates',
    name: 'OpenAI image generation',
    note: 'Six images generated as one directed series for this book. Art direction and selection by Codex under Michael’s commission.',
  },
  {
    role: 'Interstitial image library',
    name: 'Midjourney + Michael Hoydich',
    note: 'Images from Michael’s PointCast Year One archive and Bell Choir session, made in Midjourney and selected here as visual rests rather than illustrations.',
  },
  {
    role: 'Publisher',
    name: 'PointCast',
    note: 'Human-readable book, structured JSON companion, source ledger, and Block 0514.',
  },
];

export function sourceById(id: string) {
  return BOOK_SOURCES.find((source) => source.id === id);
}
