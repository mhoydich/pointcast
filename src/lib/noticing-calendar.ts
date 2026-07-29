export interface CalendarSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  usedFor: string;
}

export const CALENDAR_ISSUE = {
  schema: 'pointcast.noticing-issue/v1',
  id: 'what-i-keep-noticing-04-calendar',
  issue: '04',
  season: 'How we live together',
  desk: 'Utility',
  format: 'Field guide · Time use',
  title: 'How to calendar a life',
  shortTitle: 'A calendar is a treaty with your future self',
  dek:
    'The useful calendar is not the fullest one. It makes the real footprint of a promise visible and leaves enough unclaimed time for a life to arrive.',
  thesis:
    'A humane calendar does not squeeze more into a week. It makes the true cost of promises visible and protects enough unclaimed time for attention to change.',
  url: 'https://pointcast.xyz/noticing/how-to-calendar-a-life',
  jsonUrl: 'https://pointcast.xyz/noticing/how-to-calendar-a-life.json',
  blockUrl: 'https://pointcast.xyz/b/0539',
  publishedAt: '2026-07-29T10:16:14-07:00',
  readingTime: '10 min',
  altitudes: ['body', 'home', 'network'],
  reportingBoundary:
    'This is a practical editorial field guide, not medical, therapeutic, or employment advice. Time-use averages do not describe every household. Workplace telemetry is drawn from Microsoft 365 users and should not be generalized to every kind of work. Research on time affluence is heterogeneous and often observational. The proposed calendar treaty is a PointCast synthesis, not a validated clinical protocol.',
  credits: {
    director: 'Michael Hoydich',
    writingAndDesign: 'Codex / OpenAI',
    imageSystem: 'OpenAI image generation · poster-image-engine',
    source:
      'Michael Hoydich chat directive, 2026-07-29: “ok time for a next https://pointcast.xyz/noticing, what’s up”.',
  },
  images: [
    {
      id: 'week-has-weather',
      src: '/images/noticing/calendar-issue-04/week-has-weather.webp',
      width: 1536,
      height: 1024,
      alt:
        'A paper week arranged like a coastal landscape, with wooden commitment blocks, blue weather bands, long shadows, and one open yellow field',
      caption:
        'Plate 01 · The Week Has Weather. Capacity moves. A grid does not.',
    },
    {
      id: 'every-yes-casts-a-shadow',
      src: '/images/noticing/calendar-issue-04/every-yes-casts-a-shadow.webp',
      width: 1536,
      height: 1024,
      alt:
        'A small coral meeting block surrounded by much larger translucent layers representing its hidden time footprint',
      caption:
        'Plate 02 · Every Yes Casts a Shadow. The event is visible; the switching, travel, preparation, and recovery usually are not.',
    },
    {
      id: 'leave-a-square-for-arrival',
      src: '/images/noticing/calendar-issue-04/leave-a-square-for-arrival.webp',
      width: 1536,
      height: 1024,
      alt:
        'Hands arrange ribbons and ordinary objects around an open paper courtyard containing sunlight, a chair, and a lemon branch',
      caption:
        'Plate 03 · Leave a Square for Arrival. Blank time is not vacant. It is where the unscripted can enter.',
    },
  ],
  opening: [
    'A calendar invitation has a clean edge. Life does not.',
    'The meeting says 2:00 to 2:30. It does not say twelve minutes to find the document, eight minutes to stop thinking about the thing before it, a walk across town, the strange small exhaustion after being watched on camera, or the half hour needed to remember what you were doing.',
    'The rectangle is accurate about the meeting and dishonest about the day.',
    'That is the central problem with calendaring a life. The tool is excellent at recording agreements between people. It is much worse at representing the body, transitions, uncertainty, care, appetite, weather, or the fact that a good afternoon occasionally needs somewhere unassigned to go.',
  ],
  treatyTerms: [
    {
      id: 'anchors',
      number: '01',
      label: 'Anchors',
      proposition: 'A promise involving another person gets a real edge.',
      note:
        'Appointments, departures, school pickup, dinner, and the call you said you would make. Anchors are not bad. They are the part the calendar already understands.',
    },
    {
      id: 'shadows',
      number: '02',
      label: 'Shadows',
      proposition: 'Every anchor carries time before and after it.',
      note:
        'Preparation, travel, switching, setup, cleanup, and recovery belong to the promise even when the invitation omits them.',
    },
    {
      id: 'tides',
      number: '03',
      label: 'Tides',
      proposition: 'The body repeats before the inbox does.',
      note:
        'Sleep, meals, medication, movement, care, and ordinary energy patterns are not leftover time. Mark the few rhythms that keep the rest possible.',
    },
    {
      id: 'weather',
      number: '04',
      label: 'Weather',
      proposition: 'Capacity is a forecast, not a constant.',
      note:
        'A week can contain the same number of hours and a different amount of usable attention. Review the forecast without turning mood into a score.',
    },
    {
      id: 'commons',
      number: '05',
      label: 'Commons',
      proposition: 'Some time must remain deliberately unclaimed.',
      note:
        'A commons can hold a walk, a neighbor, a child’s question, deep work, a nap, or nothing. It is protected by not deciding too early.',
    },
  ],
  essays: [
    {
      number: '01',
      kicker: 'The rectangle',
      title: 'Calendars inherited a useful fiction: time is an opaque interval.',
      paragraphs: [
        'The internet calendar standard is admirably literal. An event has a start and an end or duration. By default it can appear as an opaque interval in a search for busy time; it can also be made transparent. That simple grammar lets millions of machines negotiate without needing to understand what a dentist, a rehearsal, or Tuesday lunch feels like.',
        'Coordination requires that simplification. The trouble begins when the representation becomes the philosophy. A day rendered as equally available slots starts to suggest that every open rectangle is unused inventory and every occupied one costs only its printed duration.',
        'Modern calendar products have begun admitting the missing dimensions. Apple can add travel time. Google can add buffers to appointment schedules, publish working location, and let focus time automatically decline meetings. Each feature is a quiet confession: the meeting was never the whole event.',
        'The humane move is not to abandon the grid. It is to teach the grid about shadows.',
      ],
    },
    {
      number: '02',
      kicker: 'The shadow',
      title: 'A thirty-minute yes can occupy an afternoon.',
      paragraphs: [
        'Research on interrupted work describes attention residue: difficulty fully switching when part of the mind remains with the task that was paused. One four-study paper found that a brief ready-to-resume plan—writing down where to return—helped reduce that residue under time pressure.',
        'This does not mean every conversation needs a ceremonial moat. It means the actual footprint of a commitment depends on its edges. A familiar call from home may need almost none. A difficult meeting across town may need preparation, travel, and a slow reset. Treating both as the same thirty-minute object is bad accounting.',
        'The current work environment makes that accounting harder. Microsoft’s analysis of heavily pinged Microsoft 365 users described 275 meetings, emails, or chat notifications across a day, with an interruption during core hours about every two minutes. That is a specific telemetry population, not a census of all work, but it captures the sensation: the day is not merely full. It is perforated.',
        'So give consequential events a visible shadow. Add the ride. Add the ten-minute return note. Add the walk around the block. The calendar becomes less impressive and more true.',
      ],
    },
    {
      number: '03',
      kicker: 'The weather',
      title: 'Preferences are cyclical. Calendars pretend availability is flat.',
      paragraphs: [
        'A large Microsoft Research study of scheduling practices found temporal preferences that were cyclical—some days or times felt more suitable—and relational, such as a desire to spread meetings apart. Those preferences were often disconnected from actual practice.',
        'This gap is ordinary. We know a dense morning changes the afternoon, but invite systems see an open slot. We know a night out changes the next morning, but the next morning remains white. We know work now moves among locations: the 2025 American Time Use Survey found that on days they worked, 35 percent of employed people did at least some work at home and 70 percent did at least some at a workplace. The week is already a moving map.',
        'A weather layer is not a biometric dashboard and should not become one. It is a sentence written before the week begins: Tuesday is exposed; Thursday has room; Friday needs a soft landing. The forecast can be wrong. Its usefulness is permission to notice capacity before somebody else claims it.',
        'Review the forecast once. Do not spend the day monitoring yourself like machinery.',
      ],
    },
    {
      number: '04',
      kicker: 'The commons',
      title: 'Do not schedule all the life out of leisure.',
      paragraphs: [
        'Thirteen studies on scheduled leisure found that giving a leisure activity a precise time could make it feel more work-like and reduce anticipation and enjoyment. Rough scheduling—choosing a looser window without a fixed hour—removed that effect in the reported studies.',
        'That finding is not a command to become unreliable. Shared commitments need clocks. It is a useful distinction between a promise and a possibility. Dinner with a friend can be an anchor. Reading can live after lunch. The beach can be Saturday morning, weather permitting. A walk can begin when the light changes.',
        'A 2026 scoping review found that time-affluence research uses inconsistent definitions and is often cross-sectional, so strong causal claims would be premature. Still, the literature repeatedly distinguishes merely having discretionary minutes from feeling that enough time is available for meaningful and relational activity.',
        'The empty square is therefore not a productivity trick. It is a small piece of temporal public space. Protect it from both work and compulsory self-improvement. Something may happen there. That is the point.',
      ],
    },
  ],
  evidenceDesk: [
    {
      label: 'Technical substrate',
      value:
        'iCalendar represents an event with a start and an end or duration and can expose it as opaque or transparent to busy-time searches.',
    },
    {
      label: 'Current product behavior',
      value:
        'Mainstream calendars now acknowledge travel, focus, working location, automatic declines, appointment buffers, and maximum bookings.',
    },
    {
      label: 'Workplace telemetry',
      value:
        'Microsoft reports highly fragmented days among heavily pinged Microsoft 365 users. The population and measurement boundary stay visible.',
    },
    {
      label: 'Published research',
      value:
        'Scheduling preferences, attention residue, leisure scheduling, and time affluence each supply a partial lens; none proves one universal ideal week.',
    },
    {
      label: 'PointCast synthesis',
      value:
        'Anchors, shadows, tides, weather, and commons are an editorial framework for making a week more truthful, not a standardized method.',
    },
  ],
  fieldRules: [
    'Put promises on the calendar; keep wishes lighter.',
    'Give every consequential yes its true shadow.',
    'Protect the few bodily tides that keep the rest possible.',
    'Write a weekly weather sentence, not a daily performance score.',
    'Keep at least one piece of time deliberately unclaimed.',
    'Use rough windows for leisure that should still feel free.',
    'End interrupted work with one line about where to return.',
    'Review the treaty weekly. A boundary is allowed to move.',
  ],
  closing: [
    'A calendar cannot tell you what matters. It can only show which claims have acquired edges.',
    'That is still powerful. An edge lets another person plan. A shadow makes the cost honest. A tide keeps the body in the agreement. A weather note admits uncertainty. A commons keeps the future from being fully occupied by the past.',
    'The goal is not a perfectly defended week. It is a week whose promises a real person could inhabit.',
  ],
  next: {
    title: 'Places we said to visit in 2023',
    label: 'Next in the field · Place',
    dek:
      'Three years later: what endured, what disappeared, what became too popular, and where we would still send a friend.',
    date: '2026-08-25T08:08:00-07:00',
    dateLabel: 'Tue · Aug 25 · fieldwork',
  },
} as const;

export const CALENDAR_SOURCES: readonly CalendarSource[] = [
  {
    id: 'S01',
    title: 'RFC 5545: Internet Calendaring and Scheduling Core Object Specification',
    publisher: 'RFC Editor / IETF',
    url: 'https://www.rfc-editor.org/rfc/rfc5545',
    usedFor:
      'The technical grammar of VEVENT, start and end or duration, and opaque versus transparent busy time.',
  },
  {
    id: 'S02',
    title: 'American Time Use Survey — 2025 Results',
    publisher: 'U.S. Bureau of Labor Statistics',
    url: 'https://www.bls.gov/news.release/atus.htm',
    usedFor:
      'Current U.S. time-use boundary and the share of employed people working at home and at a workplace on days worked.',
  },
  {
    id: 'S03',
    title: 'Breaking Down the Infinite Workday',
    publisher: 'Microsoft WorkLab',
    url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday',
    usedFor:
      'Microsoft 365 telemetry on early starts, message volume, and interruptions among heavily pinged users; not generalized to all workers.',
  },
  {
    id: 'S04',
    title: 'Rhythm of Work: Scheduling Preferences and Practices',
    publisher: 'Microsoft Research',
    url:
      'https://www.microsoft.com/en-us/research/publication/rhythm-of-work-mixed-methods-characterization-of-information-workers-scheduling-preferences-and-practices/',
    usedFor:
      'Large-scale mixed-methods research on cyclical and relational scheduling preferences and their gap from actual practice.',
  },
  {
    id: 'S05',
    title: 'The Calendar Mindset: Scheduling Takes the Fun Out and Puts the Work In',
    publisher: 'Journal of Marketing Research',
    url: 'https://doi.org/10.1509/jmr.14.0591',
    usedFor:
      'Thirteen reported studies on precisely scheduled leisure, anticipation, enjoyment, and rough scheduling.',
  },
  {
    id: 'S06',
    title: 'Time Affluence and Health: A Scoping Review',
    publisher: 'Frontiers in Public Health',
    url: 'https://doi.org/10.3389/fpubh.2026.1824268',
    usedFor:
      'Current review of definitions, associations with wellbeing, conceptual heterogeneity, and causal limits.',
  },
  {
    id: 'S07',
    title: 'Tasks Interrupted: A Ready-to-Resume Plan',
    publisher: 'Organization Science',
    url: 'https://doi.org/10.1287/orsc.2017.1184',
    usedFor:
      'Four studies on anticipated resumption pressure, attention residue, and a brief ready-to-resume intervention.',
  },
  {
    id: 'S08',
    title: 'Use Focus Time in Google Calendar',
    publisher: 'Google Calendar Help',
    url: 'https://support.google.com/calendar/answer/11190973',
    usedFor:
      'Current focus-time behavior, including muting chat and automatically declining meetings.',
  },
  {
    id: 'S09',
    title: 'Update Your Availability for Appointments',
    publisher: 'Google Calendar Help',
    url: 'https://support.google.com/calendar/answer/11423292',
    usedFor:
      'Current appointment buffers, adjusted availability, and maximum daily bookings.',
  },
  {
    id: 'S10',
    title: 'Add Location and Travel Time to Events in Calendar on Mac',
    publisher: 'Apple Support',
    url: 'https://support.apple.com/guide/calendar/icl43600/mac',
    usedFor:
      'Current travel-time and time-to-leave features that extend the visible event footprint.',
  },
];
