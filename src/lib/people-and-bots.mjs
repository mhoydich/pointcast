/**
 * /people-and-bots: participation, resources, and ethos.
 * One module feeds the HTML page and /people-and-bots.json.
 * Approved for publication on 2026-11-07. No block id.
 *
 * Primary product pages were refetched on 2026-11-07. A later price or
 * page can change. This module does not sell a subscription or join accounts.
 */

export const PEOPLE_AND_BOTS = {
  schema: 'pointcast.people-and-bots/v0',
  id: 'people-and-bots',
  title: 'People and their bots',
  description:
    'Approved for publication. People publish with their own AI tools: civic notes, memory, art, Tezos provenance, play, and labeled fiction.',
  path: '/people-and-bots/',
  json: '/people-and-bots.json',
  canonical: 'https://pointcast.xyz/people-and-bots/',
  draftedOn: '2026-11-07',
  status: 'approved-for-publication',
  block: null,
  documentTitle: 'People and their bots | PointCast',
  author: {
    name: 'New Bot',
    also: 'Grok Bot',
    role: 'Drafted the page on 2026-11-07. Not the curator and not the publisher.',
  },
  kicker: 'Approved for publication · 2026-11-07',
  credits: {
    curated: {
      by: 'Michael Hoydich',
      date: '2026-11-07',
      note: 'Curated the requests quoted on this page. No clock time was recorded for those requests.',
    },
    drafted: {
      by: 'Grok Bot (New Bot)',
      date: '2026-11-07',
      note: 'Drafted the page with AI assistance. The quotations are Michael’s. The rest is not written in his voice.',
    },
    published: {
      by: 'Michael Hoydich',
      date: '2026-11-07',
      time: '6:34 PM ET',
      quote: 'ok cool publish and let’s keep going check desk',
      note: 'Approved for publication on 2026-11-07 at 6:34 PM ET.',
    },
  },
  creditText:
    'Curated by Michael Hoydich on 2026-11-07. Drafted by Grok Bot (New Bot) on 2026-11-07. Approved for publication by Michael Hoydich on 2026-11-07 at 6:34 PM ET.',
  dek: 'Bring your curiosity and the AI tools you like using. Make something useful, beautiful, playful, or worth remembering. Publish it with its sources and credits, and leave a next step for someone else.',
  standing:
    'PointCast is an independent project. This page is unaffiliated with the City of El Segundo. It is unaffiliated with Anthropic, OpenAI, Manus, Midjourney, xAI, the Tezos Foundation, and Nouns.',
  quotes: {
    heading: 'The requests, in Michael Hoydich’s words',
    note: 'Recorded November 7, 2026. No clock time was kept for these lines. They are not a manifesto, and the rest of this page is not written in his voice.',
    items: [
      'various ethos and a custom page on pointcast about this',
      'highlight our resources from claude to manus chat midjourney etc',
      'also very wikitwitter publish for posterity and affirmation of effort',
    ],
    subscription: {
      request: 'request they do the $20 subscription',
      clarification: 'I meant Grok Bot.',
      means: 'for managing twitter accounts',
      also: 'of course all the other benefits highlight them',
    },
  },
  why: {
    heading: 'Why keep a record',
    points: [
      {
        title: 'Posterity',
        text: 'A durable page can outlast a post. The page holds the work, the sources, the tools, and the open questions. A social post can point back to it.',
      },
      {
        title: 'Affirmation of effort',
        text: 'Writing the record down acknowledges that someone did the work. Publication is not a certificate of quality, impact, or truth.',
      },
      {
        title: 'A useful link',
        text: 'The pace is slower and the pieces are longer. A link should add a source, a correction, or a new angle. It is not a chain of copies.',
      },
    ],
  },
  practices: [
    {
      id: 'civic',
      title: 'Civic making',
      summary:
        'Learn by making something a neighbor can use. A field note, a guide, a map, or a small repair is enough. The invitation is one artifact, not a pledge to an AI brand.',
      status: 'Public pages, checked 2026-11-07',
      links: [
        {
          href: 'https://elsegundo.xyz/here/',
          label: 'Here',
          note: 'Guides for where you are standing. The elsegundo.xyz homepage describes the site as an independent, source-backed guide.',
        },
        {
          href: 'https://elsegundo.xyz/goods/',
          label: 'The everything index',
          note: 'A public index of ordinary things near El Segundo. Read any prices on that page. This workshop does not repeat them.',
        },
        {
          href: '/ues/local-broadcast/',
          label: 'Local Broadcast',
          note: 'A public PointCast course room: publish a place, with sources and a corrections path.',
        },
        {
          href: '/ues/collective-intelligence-studio/',
          label: 'Collective Intelligence Studio',
          note: 'A public course room titled Humans, Agents & Editorial Judgment.',
        },
      ],
    },
    {
      id: 'memory',
      title: 'Durable public memory',
      summary:
        'Mike’s word for the direction was “wikitwitter”: a navigable record of work, sources, changes, and uncertainty. Preserving a source is not the same as establishing a claim.',
      status: 'Public pages, checked 2026-11-07',
      links: [
        {
          href: '/ues/living-archive/',
          label: 'Living Archive',
          note: 'A public course room for oral history, image, and sound, with consent and rights in the work.',
        },
        {
          href: '/standards/provenance/',
          label: 'Provenance standard',
          note: 'A PointCast draft standard: say who made a thing, and whose words they are.',
        },
        {
          href: '/grok/method/',
          label: 'Publishing method',
          note: 'The house canon for claims, labels, and citation. This page is not a block in that ledger.',
        },
      ],
    },
    {
      id: 'art',
      title: 'Art as a way of seeing',
      summary:
        'An art contribution can be an image, a study, an annotation, or an introduction to an artist. Say how it was made, and keep imagined scenes distinct from photographs of real places.',
      status: 'Public pages, checked 2026-11-07',
      links: [
        {
          href: 'https://elsegundo.xyz/art/',
          label: 'The art thread',
          note: 'On 2026-11-07 the page reported 48 works and an earlier archive of 652 works in 163 sets, drawn from preserved Midjourney publications. It says the scenes are imagined, not photographs of local places, and that its Ideogram account review was still unfinished.',
        },
        {
          href: '/art/after-hours-2026-11-02/',
          label: 'After hours, in pictures',
          note: 'A public page of three pictures from the night of November 2, 2026. The page calls them concept art and illustrations, including work still in progress. This page does not add a tool name the pictures page did not state in the passage checked.',
        },
        {
          href: '/small-shrines/',
          label: 'Small Shrines',
          note: 'Four public pauses. That page credits its own making, including Michael Hoydich’s Midjourney studies for two rooms.',
        },
      ],
    },
    {
      id: 'tezos',
      title: 'Art, Tezos, and provenance',
      summary:
        'Write about an artist or a project the way a catalog note would: creator, artwork or project link, chain and edition when you have them, license, and what you added. Prices, returns, and buying calls are out of scope.',
      status: 'Public desk, checked 2026-11-07',
      links: [
        {
          href: '/tezos/',
          label: 'Tezos experiments',
          note: 'A PointCast desk dated 2026-10-06. It points at public experiments and says it does not restate edition counts or sale claims. PointCast Chain is a different chain.',
        },
      ],
    },
    {
      id: 'play',
      title: 'Music, play, and quiet',
      summary:
        'A small instrument, a listening room, a game, a picture, or a minute of quiet counts. Play sits beside research and code.',
      status: 'Public pages, checked 2026-11-07',
      links: [
        {
          href: '/ten-doors/',
          label: 'Ten Doors',
          note: 'A public hallway of ten browser pieces. src/lib/ten-doors.mjs, read 2026-11-07, sets TEN_DOORS_DATE to 2026-11-02 and says the areas opened that day. This page did not re-check a deploy receipt for that date.',
        },
        {
          href: '/takeoff-organ/',
          label: 'Takeoff Organ',
          note: 'A browser instrument. The after-hours picture of it is concept art, not a screenshot of the instrument.',
        },
        {
          href: '/tone-bloom/',
          label: 'Tone Bloom',
          note: 'A PointCast desk for a sound and art instrument. The instrument stays on its own site.',
        },
      ],
    },
    {
      id: 'fiction',
      title: 'Labeled fiction',
      summary:
        'Stories and invented worlds are welcome when the page says they are invented, names the people and tools, and stays distinct from a field note. This page does not list a fiction serial.',
      status: 'Practice welcome · no public example listed',
      links: [],
    },
  ],
  resources: [
    {
      id: 'claude',
      name: 'Claude',
      href: 'https://claude.com/product/overview',
      checked: '2026-11-07',
      check: 'HTTP 200. The page title was “Claude | The AI assistant for work.”',
      use: 'A person may use Claude for thinking, writing, code, and critique on an Anthropic account they control.',
      boundary: 'PointCast does not include a Claude subscription. Logins are not shared.',
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      href: 'https://chatgpt.com/',
      checked: '2026-11-07',
      check: 'HTTP 200.',
      use: 'A person may use ChatGPT for thinking, writing, code, and critique on an OpenAI account they control.',
      boundary: 'PointCast does not include a ChatGPT subscription. Logins are not shared.',
    },
    {
      id: 'manus',
      name: 'Manus',
      href: 'https://manus.im/',
      checked: '2026-11-07',
      check: 'HTTP 200. The page title was “Manus: Hands On AI.” The homepage describes Manus as an action engine that goes beyond answers to execute tasks, automate workflows, and extend human reach.',
      use: 'A person may use Manus for research and hands-on workflow exploration on an account they control.',
      boundary: 'PointCast does not include a Manus subscription. Logins are not shared. This page does not claim a shared seat. Manus automation is that product’s own feature. It is not permission to automate Midjourney.',
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      href: 'https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service',
      productHref: 'https://www.midjourney.com/',
      checked: '2026-11-07',
      check: 'Terms of Service, effective 2026-05-27, were read from the official docs URL. The terms say: “You may not use automated tools to access, interact with, or generate Assets through the Services.” They also say only one user may use the Services per registered account. The Community Guidelines prohibit unauthorized automation, third-party apps, and account sharing.',
      use: 'Midjourney stays a human-operated visual practice. A person sits at the controls.',
      boundary: 'A bot on this page does not operate Midjourney. PointCast does not include a Midjourney subscription. Logins are not shared.',
      guidelinesHref: 'https://docs.midjourney.com/hc/en-us/articles/32013696484109-Community-Guidelines',
    },
    {
      id: 'grok-bot',
      name: 'Grok Bot',
      href: 'https://docs.x.ai/grok-bot/overview',
      checked: '2026-11-07',
      check: 'Official overview read on 2026-11-07. Grok Bot is described there as a proactive AI teammate with a cloud computer, working across apps, websites, and tools. Chat, a voice call, and a voice note are the interfaces named on that page.',
      use: 'Research, writing, code, and creative work sit alongside account help. The same day’s pricing page lists image and video generation, code hosting, and cloud agents on the Premium tier that includes Grok Bot. Those are xAI product features, on a plan the reader buys from xAI.',
      boundary: 'PointCast does not include Grok Bot. Logins are not shared. One person’s Grok Bots are not joined to another person’s Claude, ChatGPT, Manus, or Midjourney account.',
    },
  ],
  grokBeyondX: {
    heading: 'Grok Bot, beyond an X account',
    request:
      'The November 7 clarification said the subscription was “for managing twitter accounts,” and asked that the other benefits be highlighted. Current product docs call the service X.',
    benefits: [
      {
        title: 'Research',
        text: 'The Grok Bot overview, read on 2026-11-07, includes prebuilt bots that watch public mentions and send a digest.',
        href: 'https://docs.x.ai/grok-bot/computer-and-apps',
        hrefLabel: 'Computer and apps',
      },
      {
        title: 'Writing',
        text: 'The Grok Bot overview, read on 2026-11-07, uses drafts as its examples: a deck from files you already have, a reply left for you to send, and a campaign brief waiting for approval. The person publishes.',
        href: 'https://docs.x.ai/grok-bot/overview',
        hrefLabel: 'Grok Bot overview',
      },
      {
        title: 'Code and a computer',
        text: 'The Grok Bot overview, read on 2026-11-07, says your bots share a cloud computer with a browser, a filesystem, and a terminal. The subscription docs, read the same day, say the included usage pool also covers Grok models in Cursor, and that third-party models in Cursor are billed separately.',
        href: 'https://docs.x.ai/x-subscription/pricing',
        hrefLabel: 'Subscription docs',
      },
      {
        title: 'Creative work',
        text: 'The pricing page, read on 2026-11-07, listed “Make stunning AI images & videos” on Premium, the tier whose feature list names Grok Bot. That line is about Grok’s own image and video tool. It is separate from Midjourney, which stays human-operated.',
        href: 'https://x.ai/pricing',
        hrefLabel: 'x.ai/pricing',
      },
      {
        title: 'Reminders and routines',
        text: 'The skills and routines guide, read on 2026-11-07, says a routine runs a saved skill on a schedule or when an event arrives, and the person sets the approval boundary. The mobile guide, read the same day, documents Apple Reminders on iPhone. Check that guide before assuming the same list on another phone.',
        href: 'https://docs.x.ai/grok-bot/skills-routines-and-automations',
        hrefLabel: 'Skills and routines',
        alsoHref: 'https://docs.x.ai/grok-bot/mobile',
        alsoLabel: 'Grok Bot for mobile',
      },
      {
        title: 'Connected apps, where supported',
        text: 'The Grok Bot overview, read on 2026-11-07, names Slack, Notion, Drive, Teams, Gmail, and Google Calendar. The computer-and-apps guide, read the same day, says an authorized app can do only what that account can already do, and that a browser on the cloud computer covers a service without a connector. Support varies by app, team policy, and plan.',
        href: 'https://docs.x.ai/grok-bot/computer-and-apps',
        hrefLabel: 'What a connected app can do',
      },
      {
        title: 'Coordination inside one Grok Bot account',
        text: 'The Grok Bot overview, read on 2026-11-07, says multiple Grok Bots on an account can hand work to one another and then bring it to the person to approve, edit, or send back. That is coordination inside Grok Bot. It is not a network among the people on this page, and it is not a bridge to other vendors’ models.',
        href: 'https://docs.x.ai/grok-bot/overview',
        hrefLabel: 'An entire team of bots',
      },
      {
        title: 'X accounts',
        text: 'The computer-and-apps guide, read on 2026-11-07, says bots can search and read public posts on X without connecting an X account, and that this access is read-only and does not sign in as you. The same section says DMs, bookmarks, the home timeline, and likes use the X plugin and a sign-in. This page does not add a purchase requirement for those tools.',
        href: 'https://docs.x.ai/grok-bot/computer-and-apps',
        hrefLabel: 'Search and read X',
      },
    ],
    pricing: {
      checked: '2026-11-07',
      pages: [
        { href: 'https://x.ai/pricing', label: 'x.ai/pricing' },
        { href: 'https://docs.x.ai/x-subscription/pricing', label: 'Subscription pricing docs' },
      ],
      finding:
        'Refetched 2026-11-07. The pricing page listed new-plan prices of Free at $0, Plus at $8 per month, Premium at $30 per month, Super at $100 per month, and Ultra at $200 per month. That page’s Premium feature list names Grok Bot. It did not list a $20 Grok Bot plan.',
      docs:
        'The subscription docs, read the same day, say new self-serve customers use The X Subscription, Grok Bot is included on Premium, Super, and Ultra, and Plus does not include Grok Bot. They also say existing Cursor, SuperGrok, and X Premium plans continue unless you change or cancel them.',
      caveats:
        'The pricing page says prices are subject to change, tax may be added, and third-party model use in Cursor is billed separately. Subscriptions are sold through X Subscription Corp. Check the pricing page before you buy. This page is not a quote. The subscription amount in Michael’s request is a quotation, not the listed new-plan price.',
    },
  },
  steps: {
    heading: 'A first contribution',
    intro:
      'Participation is human opt-in. You choose the tool, the account, and the moment something becomes public. This page has no form and does not store a submission.',
    items: [
      'Choose one artifact: a field note, a useful tool, a picture or an art note, a Tezos project note, a small instrument, a labeled story, or a question.',
      'Name the human owner. A bot may help. The owner decides what is public.',
      'Fill the provenance card before publishing. Private prompts, private conversations, and contact details can stay off the card.',
      'Keep the durable copy on a page you control, or hold it until a person approves publication.',
      'If you also post on a social account, link back to the durable copy.',
      'A response to someone else’s work should add a source, a correction, or a new angle. Ask before you tag them or act on their account.',
      'Confirm the public action yourself. Nothing on this page joins a bot to a network for you.',
    ],
  },
  provenance: {
    heading: 'Provenance card',
    intro:
      'Copy this into your own notes. The button only writes to your clipboard. It does not send the card anywhere.',
    fields: [
      ['Title', 'What a stranger can call the work.'],
      ['Human owner', 'The person who decides what is public.'],
      ['Date and version', 'When this version was made, and what changed since the last one.'],
      ['Sources', 'Links, documents, or observations the work relies on. A preserved source is not yet a proven claim.'],
      ['Tools', 'Each AI or instrument, and the part it played. Name the human edits.'],
      ['Rights', 'License, quotation limits, and what you have permission to show.'],
      ['Changes', 'What you added, cut, or corrected.'],
      ['Uncertainty', 'What is real, what is invented, what is unfinished, and what a later reader should recheck.'],
    ],
    template: [
      'Title:',
      'Human owner:',
      'Date and version:',
      'Sources:',
      'Tools, and what each one did:',
      'Rights and license:',
      'Changes:',
      'Real:',
      'Invented:',
      'Uncertain:',
      'Durable URL:',
      'Related work:',
      'One question for the next person:',
    ].join('\n'),
  },
  collaboration: {
    heading: 'Separate accounts, linked on purpose',
    points: [
      'You own your account and you choose your tools.',
      'Claude, ChatGPT, Manus, Midjourney, and Grok Bot are examples. They are not a shared login, a bundled subscription, or a single system.',
      'A public link is a human choice. This page does not promise that anyone’s bots are already connected.',
      'There is no join form, no mailing list, and no submission on this page.',
    ],
  },
  sourcesNote:
    'Factual claims on this page name the single public page or repository file they come from, with the 2026-11-07 check. Desk notes, private paths, and unpublished projects are omitted.',
};

export const PEOPLE_AND_BOTS_PUBLIC = {
  ...PEOPLE_AND_BOTS,
  machineNote:
    'JSON twin for /people-and-bots/. Status is approved-for-publication. creativeWorkStatus is Approved for publication. block is null.',
};
