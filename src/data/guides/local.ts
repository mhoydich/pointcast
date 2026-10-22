import type { Guide } from './types';

/**
 * Local guides: neighborhoods, community groups, events, newsletters, newcomers.
 * Evergreen how-to pages. Nothing here names real people, businesses, venues,
 * fees, laws, or phone numbers. Where a rule or cost varies by city, the guide
 * tells the reader to check with their own city.
 */
export const LOCAL_GUIDES: Guide[] = [
  {
    slug: 'start-a-neighborhood-guide',
    category: 'local',
    title: `How to Start a Neighborhood Guide`,
    dek: `Become the person who knows what is happening on your block, and share it every week.`,
    audience: `Residents who want to keep a small, useful, trustworthy record of their own neighborhood.`,
    seat: 'open',
    minutes: 7,
    sections: [
      {
        heading: `What a neighborhood Guide actually does`,
        body: [
          `A neighborhood Guide is not a reporter, a politician, or a moderator. The job is smaller and more useful: keep an accurate, current page about the place you live, so a neighbor can find out what they need without asking five people. That means who to call about a broken streetlight, when the next public meeting is, which park gets used for what, and what changed since last month.`,
          `Pick a boundary you can walk. A few blocks, one school catchment, or one park and the streets around it is plenty. A small area is easier to keep accurate, and readers can tell right away whether the page is about them. You can always widen the map later, and you can invite other Guides to take the next area over.`,
        ],
      },
      {
        heading: `What to cover first`,
        body: [
          `Start with evergreen basics before news. Write down where trash and recycling questions go, how to report a street or utility problem, where the nearest library, park, and transit stop are, and when the local governing bodies meet. Link to the official source for each one instead of copying the details, so the page stays right when the source changes.`,
          `Then add a short list of recurring things: regular markets, volunteer days, school events, seasonal traditions. Put a date on every item and mark each one as confirmed or unconfirmed. A page that says "last checked in March" earns more trust than a page that sounds sure about everything.`,
        ],
      },
      {
        heading: `A weekly rhythm you can keep`,
        body: [
          `Choose a weekly cadence small enough to survive a bad week. One workable pattern: ten minutes to skim official calendars and agendas, ten minutes to read messages from neighbors, and twenty minutes to update the page and post a short note. Same day, same time, every week. Readers learn when to expect you, and you learn what a normal week looks like, which makes the unusual ones stand out.`,
          `Skip a week out loud if you have to. A one-line note saying the update is paused until next week is better than silence. If you find the pace is too much, cut the scope before you cut the schedule.`,
        ],
      },
      {
        heading: `Sourcing and verification`,
        body: [
          `Rank your sources. An official notice, agenda, or website is strongest, a direct message from the person organizing something is next, and a secondhand post in a group chat is a lead and nothing more. When you can, ask the organizer directly and say so on the page. When you cannot confirm something, say "we have not confirmed this" and leave it out of the main list.`,
          `Keep a simple log of where each item came from and the date you checked it. A shared spreadsheet is fine. When someone asks "where did you hear that," you will have an answer, and handing off to a future Guide gets much easier.`,
        ],
      },
      {
        heading: `Corrections and handing over the page`,
        body: [
          `You will get things wrong. Put a visible way to report a mistake on every page, fix the item quickly, and note what changed and when. Do not quietly rewrite history: a short "Corrected on" line is honest and costs you nothing. Treat the person who spotted the error as a contributor, because they are one.`,
          `Write down how you do the job as you go, in plain steps, so someone else could pick it up. Neighborhood pages tend to fail when one person moves or gets busy. If a second person already knows where the sources and the log live, the page can outlast any one Guide.`,
        ],
      },
    ],
    checklist: [
      { label: `Pick a walkable boundary`, detail: `Write one sentence describing exactly which streets or landmarks are in and out.` },
      { label: `List the official sources`, detail: `Gather links for city services, meeting calendars, and public notices. Link, do not copy.` },
      { label: `Draft the evergreen basics`, detail: `Services, parks, transit, libraries, and how to report problems.` },
      { label: `Set a weekly slot`, detail: `Choose a day and time you can keep, and tell readers when to expect updates.` },
      { label: `Start a source log`, detail: `Record where each item came from and the date you checked it.` },
      { label: `Add a corrections link`, detail: `Make it easy for any reader to report a mistake.` },
      { label: `Recruit one backup`, detail: `Find a neighbor who can fill in for a week and learn the routine.` },
    ],
    wanted: [
      `Links to official city or county pages for services, with the date you last checked them.`,
      `A list of recurring neighborhood events with confirmed dates and an organizer contact the organizer has approved.`,
      `Corrections: anything on a guide page that is out of date or wrong.`,
      `Photos of public spaces that you took yourself and are happy to share, with a short caption.`,
      `Accessibility notes for parks, sidewalks, and meeting rooms, from people who use them.`,
    ],
    related: [
      { label: `Local`, href: '/local' },
      { label: `Town`, href: '/town' },
      { label: `Communications Lab`, href: '/communications-lab' },
      { label: `All guides`, href: '/guides' },
    ],
    tags: ['neighborhood', 'local', 'guide', 'community', 'how-to'],
  },
  {
    slug: 'run-a-community-group',
    category: 'local',
    title: `How to Run a Community Group`,
    dek: `Roles, meetings, money, and a clean handoff for volunteer groups that want to last.`,
    audience: `Anyone organizing a volunteer, neighborhood, hobby, or mutual aid group, especially a first-time organizer.`,
    seat: 'open',
    minutes: 8,
    sections: [
      {
        heading: `Start with a one-sentence purpose`,
        body: [
          `Before you pick a name or a logo, write one sentence that says what the group does and for whom. "We clean up the creek trail on the first Saturday of each month" is a purpose. "We bring the community together" is a hope. A clear sentence helps new people decide whether to join and helps current members say no to projects that do not fit.`,
          `Ask the first five or six people who show up what they want from the group. Some want to meet neighbors, some want results, some want a small role with a clear end. Knowing the mix early helps you design a group where all three feel useful.`,
        ],
      },
      {
        heading: `Roles that spread the work`,
        body: [
          `Most small groups run well with a handful of named roles: a convener who keeps the schedule, a note-taker, a person who handles communications, a person who handles money if there is any, and a welcome person who greets newcomers. One person can hold two roles at first, but name them anyway. Unnamed jobs become the organizer's jobs.`,
          `Keep terms short and renewable, such as six months or a year. A short term makes it easier to say yes and easier to step down without hard feelings. Write each role on one page: what it covers, how much time it takes in a typical month, and who to ask for help.`,
        ],
      },
      {
        heading: `Meetings people want to attend`,
        body: [
          `Send an agenda a few days ahead, start on time, and end on time. Open with a quick round of names for the first few meetings. Spend most of the time on decisions and assignments, not updates that could have been a message. Close by reading back who agreed to do what by when.`,
          `Take short notes and share them within a couple of days. Record decisions, owners, and dates, and skip the transcript. Rotate the note-taker and the facilitator. If your group meets in a public or borrowed space, ask the space's manager about their booking process and any rules for the room, and follow them.`,
        ],
      },
      {
        heading: `Money handling basics`,
        body: [
          `If the group handles any money, even small amounts, put two rules in place on day one: more than one person is involved, and everything is written down. One person collects, a different person records, and someone who did neither reviews the records now and then. Keep a simple ledger of money in, money out, and what it was for, and share it with members on a regular schedule.`,
          `Do not mix group money with personal accounts. Rules about accounts, fundraising, and tax status depend on where you live and what kind of group you are, so check with your city, state, or a local nonprofit support organization before collecting funds, and ask a qualified professional if you are unsure. When in doubt, spend less, record more, and ask first.`,
        ],
      },
      {
        heading: `A shared calendar and a single place for news`,
        body: [
          `Pick one calendar that everyone can see and treat it as the source of truth. Put every meeting, work day, and deadline on it, with a location and a contact. Post the link wherever members gather. When a date changes, change the calendar first, then tell people.`,
          `Choose one main channel for announcements and keep side chats separate. Newcomers should be able to find the calendar, the notes, and the welcome person within a minute of arriving. If information lives in six places, only the founders will ever find it.`,
        ],
      },
      {
        heading: `Handing off leadership`,
        body: [
          `Plan the handoff from the beginning. Keep a shared folder with the calendar, the contact list, the ledger, past notes, and a one-page guide to how the group runs. Invite a likely successor to shadow you for a season before you step down, and hand over the accounts and keys in person or with a witness.`,
          `When you leave, leave loudly and kindly: thank people publicly, say what worked, and say what you would change. A group that can lose its founder and keep meeting has done the hardest part of the job.`,
        ],
      },
    ],
    checklist: [
      { label: `Write the purpose sentence`, detail: `One sentence: what you do, and for whom.` },
      { label: `Name the roles`, detail: `Convener, note-taker, communications, money, and welcome, with short terms.` },
      { label: `Set a meeting rhythm`, detail: `Fixed day, fixed length, agenda sent ahead, notes sent after.` },
      { label: `Set up two-person money handling`, detail: `One collects, another records, and a third reviews. Keep a ledger.` },
      { label: `Check local rules`, detail: `Ask your city or a local nonprofit support group about fundraising and account rules.` },
      { label: `Create the shared calendar`, detail: `One link, one source of truth, posted where members gather.` },
      { label: `Start a handoff folder`, detail: `Contacts, notes, ledger, and a one-page how-we-run-things guide.` },
      { label: `Name a likely successor`, detail: `Invite them to shadow the lead role for a season.` },
    ],
    wanted: [
      `A sample one-page role description that has worked for a volunteer group, with the group's name removed.`,
      `A simple ledger template you have used, with notes on how it was reviewed.`,
      `Meeting agenda formats that kept your group on time.`,
      `Tips for welcoming newcomers, especially people who work evenings or have caregiving duties.`,
      `Pointers to local nonprofit support resources, with the date you checked them.`,
    ],
    related: [
      { label: `Local`, href: '/local' },
      { label: `Town`, href: '/town' },
      { label: `Communications Lab`, href: '/communications-lab' },
      { label: `All guides`, href: '/guides' },
    ],
    tags: ['community', 'volunteers', 'meetings', 'nonprofit', 'leadership', 'how-to'],
  },
  {
    slug: 'block-party-and-street-events',
    category: 'local',
    title: `How to Plan a Block Party or Street Event`,
    dek: `From the first knock on a door to the last bag of trash, a plan for a neighborhood event that goes well.`,
    audience: `Neighbors planning a block party, street fair, or small public gathering for the first time.`,
    seat: 'open',
    minutes: 8,
    sections: [
      {
        heading: `Decide what the event is for`,
        body: [
          `A good block party has a simple purpose: meet each other, welcome new neighbors, celebrate a season, or raise a little money for something the block cares about. Pick one. Then pick a date, a rain plan, and a start and end time that works for families, older neighbors, and people who work odd hours. Shorter is better. Three hours that feel full beat six that drift.`,
          `Walk the area you have in mind and note what you will need: where people will gather, where the food will go, where cars normally park, and where an emergency vehicle would need to get through. Sketch a rough map. You will use it for the permit conversation, for the neighbors, and for your volunteers.`,
        ],
      },
      {
        heading: `Permits and the city process`,
        body: [
          `If you want to close a street, use a public park, amplify sound, serve food to the public, or put up a tent or stage, your city may have a process for it. Rules, timelines, and costs differ from place to place and change over time, so start by checking your own city's website or calling its office that handles special events or street use. Ask what is required for your specific plan and how far ahead you need to apply.`,
          `Keep copies of everything you submit and receive. Ask whether notice to nearby residents is required, and whether there are conditions such as insurance, cleanup, or a named responsible person. Treat the answers as the authority, not this guide. If your city offers a simpler path for small neighborhood gatherings, ask about it.`,
        ],
      },
      {
        heading: `Talk to your neighbors first`,
        body: [
          `Go door to door before you post anything online. A short, friendly note with the date, time, what is planned, and a way to reach you will do more than a flyer on a pole. Ask whether anyone has concerns, such as access to a driveway, a medical need, a pet that is frightened by noise, or a work shift that starts early. Many problems are easy to solve if you hear about them a month ahead.`,
          `Invite people to help, not just attend. Give out small, specific jobs: set up tables, bring a folding chair, watch the sign-in sheet, greet people at the corner. Neighbors who have a job tend to feel ownership of the day and take care of it.`,
        ],
      },
      {
        heading: `Safety and access`,
        body: [
          `Plan for the basics. Keep a clear lane for emergency vehicles. Mark the edges of the event area so cars and people know where they are. Put a few adults in charge of watching traffic and crowds, and make sure they are easy to spot. Keep a basic first aid kit, water, shade, and a way to call for help at a known spot, and tell your volunteers where it is.`,
          `Think about who might struggle to take part. Leave room for wheelchairs and strollers, offer seating, and label food with common allergens when people bring dishes. If you serve food, ask your city or county health office what applies to your situation. Plan for a quiet corner for people who need a break from noise.`,
        ],
      },
      {
        heading: `Cleanup and follow-through`,
        body: [
          `Decide before the event who cleans up and when. Set out clearly marked trash, recycling, and compost containers if your area has them, and recruit a few volunteers to empty them during the party. Make cleanup part of the plan, not a hope. Many hands, fifteen minutes, and a playlist go a long way.`,
          `Do a last walk of the area with a bag and gloves. Return anything borrowed, and send a thank-you note with a few photos that the people in them are comfortable sharing. Jot down what worked, what you would change, and who helped, so the next organizer can start from your notes.`,
        ],
      },
    ],
    checklist: [
      { label: `Pick the purpose and the date`, detail: `One goal, a rain plan, and a start and end time that suit different households.` },
      { label: `Sketch the map`, detail: `Gathering area, food, parking, and the emergency vehicle path.` },
      { label: `Check the city process`, detail: `Ask your city what applies to your plan and how far ahead to apply. Keep copies of everything.` },
      { label: `Visit neighbors in person`, detail: `Share the plan and ask about concerns before posting online.` },
      { label: `Assign specific volunteer jobs`, detail: `Setup, greeters, traffic watchers, first aid, cleanup.` },
      { label: `Prepare a safety kit`, detail: `First aid, water, shade, a way to call for help, and a clear lane for emergency vehicles.` },
      { label: `Plan for access`, detail: `Seating, wide paths, allergen labels, and a quiet space.` },
      { label: `Schedule cleanup and a thank-you`, detail: `Name the crew, do a last walk, and send thanks afterward.` },
    ],
    wanted: [
      `Your city's special events or street use page, with the date you checked it.`,
      `A sample neighbor notice that worked, with names and contact details removed.`,
      `A volunteer job list from an event you organized.`,
      `Ideas for low-cost activities that work for all ages.`,
      `Lessons from events that rained out, ran long, or needed a plan B.`,
    ],
    related: [
      { label: `Local`, href: '/local' },
      { label: `Town`, href: '/town' },
      { label: `Communications Lab`, href: '/communications-lab' },
      { label: `All guides`, href: '/guides' },
    ],
    tags: ['events', 'block party', 'permits', 'safety', 'neighbors', 'community'],
  },
  {
    slug: 'local-newsletter-in-an-afternoon',
    category: 'local',
    title: `How to Start a Local Newsletter in an Afternoon`,
    dek: `A small, honest, hyperlocal newsletter or feed you can launch today and keep up without burning out.`,
    audience: `Residents and community volunteers who want to share local information on a regular schedule.`,
    seat: 'open',
    minutes: 7,
    sections: [
      {
        heading: `Choose a beat you can cover`,
        body: [
          `A beat is a topic or a place you commit to watching. For a hyperlocal newsletter, good beats include public meetings, parks and open space, school announcements, local events, new businesses opening and closing, and street and transit changes. Pick two or three. Trying to cover everything is how a newsletter dies in its third issue.`,
          `Write a one-paragraph description of who the newsletter is for and what it will and will not do. "A weekly list of public meetings and events in the east side of town" is a promise you can keep. Share the promise at the top of every issue so new readers know what to expect.`,
        ],
      },
      {
        heading: `Set up in one afternoon`,
        body: [
          `You need a name, a way to collect email addresses or followers, a template, and a place to keep your notes. Many free or low-cost tools handle all of that. Pick one, send yourself a test, and look at it on a phone. Keep the template plain: a short intro, three to six items with dates, a corrections note, and a way to reply.`,
          `Write the first issue before you tell anyone about it. Then invite a few friendly neighbors, ask for blunt feedback, and adjust. A short, useful first issue beats a long, polished one that arrives next month.`,
        ],
      },
      {
        heading: `Sourcing and verification`,
        body: [
          `Go to the source whenever you can. For a meeting, read the posted agenda. For an event, contact the organizer. For a closure or a change, find the official notice. Put the date and link next to each item so readers can check. Treat a post in a group chat as a tip to follow up on, not as a fact to repeat.`,
          `Keep a simple record of each item, where it came from, and when you confirmed it. If two sources disagree, say so, or leave the item out until you know. When you quote someone, use their words accurately and ask permission if the context is personal. Never publish a rumor because it is interesting.`,
        ],
      },
      {
        heading: `Tone and cadence`,
        body: [
          `Write like a neighbor who has done their homework: plain, specific, and kind. Lead with what readers can do or need to know. Avoid sarcasm about named people and avoid guessing at motives. If something is contested, describe the positions fairly and link to the official record.`,
          `Pick a cadence you can keep even during a busy month. Weekly is great if you have help; every other week or monthly is fine if you do not. Send at the same time each cycle. Consistency matters more than volume, and a modest newsletter that arrives on time builds more trust than an ambitious one that appears when it can.`,
        ],
      },
      {
        heading: `Privacy and care for neighbors`,
        body: [
          `Local news is about people who live near you and will see you at the store. Do not publish home addresses, license plates, children's full names, or photos of private homes and people without permission. Be especially careful with anything involving minors, health, immigration status, or a crime allegation. If you are unsure, leave it out or ask the person affected.`,
          `Make corrections and removal requests easy. A reader who asks you to take down a photo or fix a detail should get a prompt, respectful reply. Publish your approach to privacy on a short page and link to it from each issue. That page protects your neighbors and, over time, protects you.`,
        ],
      },
    ],
    checklist: [
      { label: `Choose two or three beats`, detail: `Pick topics you can watch every cycle.` },
      { label: `Write the promise`, detail: `One paragraph describing who it is for and what it covers.` },
      { label: `Pick a tool and a template`, detail: `Test on a phone. Include a corrections note and a reply link.` },
      { label: `Draft issue one`, detail: `Three to six dated items with links to the source.` },
      { label: `Start a source log`, detail: `Where each item came from and when you confirmed it.` },
      { label: `Set the cadence`, detail: `A schedule you can keep during a busy month.` },
      { label: `Publish a privacy note`, detail: `Explain what you do not publish and how to request a change.` },
    ],
    wanted: [
      `Public meeting calendars and agenda links for local bodies, with the date you checked them.`,
      `Event listings with organizer-approved details.`,
      `Corrections: anything in a past issue that was wrong or has changed.`,
      `Photos you took yourself, with consent from anyone identifiable in them.`,
      `Template layouts that read well on a phone.`,
      `Suggestions for beats nobody is covering yet.`,
    ],
    related: [
      { label: `Communications Lab`, href: '/communications-lab' },
      { label: `Internship Lab`, href: '/internship-lab' },
      { label: `Beacon`, href: '/beacon' },
      { label: `All guides`, href: '/guides' },
    ],
    tags: ['newsletter', 'hyperlocal', 'journalism', 'verification', 'privacy', 'how-to'],
  },
  {
    slug: 'new-in-town',
    category: 'local',
    title: `New in Town: A Template for Newcomers`,
    dek: `A fill-in-the-blanks guide for mapping the essentials of a place without guessing.`,
    audience: `Local Guides building a newcomer page, and new residents who want to know what to look for.`,
    seat: 'open',
    minutes: 6,
    sections: [
      {
        heading: `How to use this template`,
        body: [
          `This is a template, not a finished guide for any one town. A Guide fills in each section with verified information for their own area and links to the official source for each item. If a detail cannot be confirmed, leave it blank and mark it "to confirm." An honest gap is better than a confident guess.`,
          `For every fact you add, record where it came from and the date you checked it. Add a "last checked" line to each section. Newcomers are making real decisions about where to live, enroll a child, or get to work, so accuracy matters more than completeness.`,
        ],
      },
      {
        heading: `Schools and childcare`,
        body: [
          `Explain how a family finds out which school serves their address and how enrollment works, and link to the district or school office that decides it. Do not describe school quality or rank schools. Point to official reports where they exist and encourage visits, questions, and conversations with current families.`,
          `List the questions a newcomer should ask: enrollment deadlines, required documents, transportation, before and after school care, and how to reach the front office. Add a note about childcare and preschool options only where you can link to a licensing or listing source, and say that families should verify details directly.`,
        ],
      },
      {
        heading: `Parks, libraries, and public spaces`,
        body: [
          `Map the public spaces residents actually use: parks, trails, playgrounds, community centers, and the public library. For each, link to the official page for hours, rules, and any reservation process, and note how to get there on foot, by bike, by transit, or by car. Add accessibility details only from sources you trust or from people who have visited.`,
          `For the library, explain what a newcomer typically needs to ask about, such as getting a card, borrowing, public computers, and programs, and point to the library's own site for current details. Ask local contributors to share tips, such as the quiet reading corner or the best time to visit, only if they are happy to be quoted.`,
        ],
      },
      {
        heading: `Transit, getting around, and civic meetings`,
        body: [
          `Describe the main ways to get around: bus, rail, bike lanes, walking routes, and parking. Link to the transit agency's official trip planner and schedules instead of copying routes or fares, which change. Note where to find service alerts. Add a short "first week" suggestion, such as taking one trip at the hour you will actually travel.`,
          `Explain how local government meetings work in your area: which bodies meet, where the schedule and agendas are posted, how the public can comment, and how to follow along if you cannot attend. Newcomers often do not know that these meetings are open, and a clear, friendly explanation can make the first one far less intimidating.`,
        ],
      },
      {
        heading: `Everyday services and who to ask`,
        body: [
          `Gather the practical items: how to start utilities, how trash and recycling pickup works, how to register a vehicle or get a license, how to register to vote, and where to find non-emergency city services. Link to the official offices and describe only the steps they publish. If a process differs by county or state, say so and point to the right place.`,
          `Finish with a short list of "people to ask": a neighborhood group, a library desk, a community center front desk, or a local Guide. Only list organizations you have verified, and never post personal contact details without the person's consent. Invite readers to suggest what is missing.`,
        ],
      },
    ],
    checklist: [
      { label: `Copy the template`, detail: `Create one section per topic and mark each as to confirm.` },
      { label: `Find the official source`, detail: `Link the school district, city, library, and transit agency pages.` },
      { label: `Record dates`, detail: `Add a last-checked line to every section.` },
      { label: `Walk or ride the routes`, detail: `Check access to parks, the library, and a transit stop in person.` },
      { label: `Explain civic meetings`, detail: `Where schedules are posted and how public comment works.` },
      { label: `Gather everyday services`, detail: `Utilities, trash, vehicle, voting, and non-emergency services.` },
      { label: `Ask a newcomer to review`, detail: `Someone who moved recently can find what is confusing or missing.` },
    ],
    wanted: [
      `Links to official school district, library, and transit pages, with the date you checked them.`,
      `A recent newcomer's list of questions they wish they had answers to.`,
      `Corrections where a link is broken or a process has changed.`,
      `Accessibility notes for parks, libraries, and meeting rooms, from people who have visited.`,
      `A plain-language explanation of how local public meetings work in your area.`,
    ],
    related: [
      { label: `Local`, href: '/local' },
      { label: `Town`, href: '/town' },
      { label: `Intern desk`, href: '/intern' },
      { label: `All guides`, href: '/guides' },
    ],
    tags: ['newcomers', 'template', 'schools', 'transit', 'libraries', 'civic'],
  },
];
