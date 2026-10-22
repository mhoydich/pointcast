/**
 * Project assignments for PointCast Radio Network (RN-01..RN-10).
 * Shared by /radio-network#assignments, /radio-network.json and the jobs board
 * (public/opportunities/catalog.json, project "radio").
 *
 * Educational project briefs, modeled on the PointCast Guides intern
 * assignments (src/data/guides/interns.ts). These are not job postings:
 * applications are not open, and pay, hours, eligibility, supervisor and the
 * hiring or sponsoring entity are not set. The network is a plan; nothing is
 * on air and no one is appointed. Written in a neutral station voice, not in
 * Mike Hoydich's voice.
 */

export type RadioTrack =
  | 'production'
  | 'engineering'
  | 'research'
  | 'reporting'
  | 'community'
  | 'underwriting'
  | 'agent-ops';

export interface RadioAssignment {
  id: string; // e.g. "RN-01"
  title: string;
  track: RadioTrack;
  /** Station slugs from STATIONS in radio-network.ts this work serves. */
  stations: string[];
  /** Plan phase the work belongs to (0–3). */
  phase: number;
  weeks: number;
  brief: string;
  deliverables: string[];
  acceptance: string[];
  /** Skills practiced. */
  learns: string[];
  /** Anything that needs Mike's sign-off before it touches real people, recordings, outreach or publication. */
  needsApproval: string | null;
}

export const RADIO_ASSIGNMENTS_STATUS =
  'Educational project briefs. Applications are not open. Pay, hours, eligibility, supervisor and hiring entity are not set. Nothing is on air and no seat is filled.';

export const RADIO_ASSIGNMENTS: RadioAssignment[] = [
  {
    id: 'RN-01',
    title: 'Produce a pilot episode of The Town Desk',
    track: 'production',
    stations: ['el-segundo'],
    phase: 0,
    weeks: 3,
    brief:
      'Produce one 30-minute pilot of The Town Desk for Radio El Segundo using the Phase 0 launch kit rundown. Build the story list from public sources (city agendas, school board notices, event calendars), book any guest only with their written agreement, and deliver a finished episode file plus show notes. The pilot is a rehearsal; it is not published unless approved.',
    deliverables: [
      'Story list of at least ten items, each with a dated public source',
      'Completed rundown with segment times that add up to the half hour',
      'Finished episode file and a listen-back note with three fixes for next time',
      'Show notes draft with every source linked',
    ],
    acceptance: [
      'Every factual item traces to a dated public source or a guest who confirmed it in writing',
      'Every voice in the episode has a signed consent form on file',
      'The episode runs 28 to 30 minutes and follows the hour clock station ID rules',
    ],
    learns: ['Show rundowns and timing', 'Sourcing local news', 'Booking guests with consent'],
    needsApproval: 'Mike approves before any guest is contacted and before the episode is published or streamed',
  },
  {
    id: 'RN-02',
    title: 'Write the audio editing and loudness standard',
    track: 'engineering',
    stations: ['el-segundo'],
    phase: 0,
    weeks: 2,
    brief:
      'Write the network audio standard every station will edit to: recording format, loudness target for streams and podcast files, true-peak ceiling, noise handling, file naming and what may and may not be edited out of an interview. Test it by applying it to two practice recordings made with people who agreed to be recorded.',
    deliverables: [
      'Audio standard document of no more than two pages',
      'Before-and-after loudness measurements for two practice files',
      'Export presets or a settings checklist for one free editor',
    ],
    acceptance: [
      'The standard names a numeric loudness target and true-peak ceiling and cites where each comes from',
      'The editing rules forbid changing the meaning of what someone said',
      'A second person can follow the checklist and hit the target on a new file',
    ],
    learns: ['Loudness measurement', 'Editing ethics', 'Writing a technical standard'],
    needsApproval: null,
  },
  {
    id: 'RN-03',
    title: 'Research music licensing paths for a talk-first launch',
    track: 'research',
    stations: ['el-segundo'],
    phase: 0,
    weeks: 2,
    brief:
      'Research how an internet stream and podcast feed would license music: statutory webcasting through SoundExchange for sound recordings, and performing-rights licenses from ASCAP, BMI, SESAC and GMR for compositions, plus what changes for podcasts and on-demand files. This is research only. Do not sign up for, apply for or contact any licensing body.',
    deliverables: [
      'Comparison table of each license path: what it covers, who issues it, current published minimums and the source page with date checked',
      'Plain-English summary of webcasting play-frequency rules automation must enforce',
      'List of open questions for a broadcast attorney or licensing consultant',
    ],
    acceptance: [
      'Every fee or rule cites the issuing body’s own published page with the date checked',
      'Nothing in the memo is written as legal advice; open questions are flagged, not guessed',
      'No account, application or outreach was made to any licensing body',
    ],
    learns: ['Music licensing basics', 'Primary-source research', 'Writing for a legal review'],
    needsApproval: 'Mike approves before any licensing body is contacted or any account is opened',
  },
  {
    id: 'RN-04',
    title: 'Build the community calendar desk',
    track: 'community',
    stations: ['el-segundo', 'manhattan-beach'],
    phase: 1,
    weeks: 2,
    brief:
      'Design the calendar that feeds the on-air community announcements for Radio El Segundo and the Radio Manhattan Beach local windows. Gather two weeks of public events from city, library, school and nonprofit calendars, write each as a 20-second read, and set the rules for what qualifies and how corrections work.',
    deliverables: [
      'Calendar sheet with date, time, place, organizer, source link and a 20-second read for each event',
      'One-page inclusion rules: what gets read, what does not, and why',
      'Corrections procedure that matches the station rules',
    ],
    acceptance: [
      'Every event links to the organizer’s own public listing, checked within seven days of airing',
      'Reads name and describe; none sells, quotes a price or uses a call to action',
      'Private events and events that name minors are excluded',
    ],
    learns: ['Calendar editing', 'Writing for the ear', 'Corrections practice'],
    needsApproval: null,
  },
  {
    id: 'RN-05',
    title: 'String scores and notes for Courts & Coast',
    track: 'reporting',
    stations: ['el-segundo', 'manhattan-beach'],
    phase: 1,
    weeks: 4,
    brief:
      'Cover local youth and adult league results for Courts & Coast, the weekly sports show, from teams and leagues that have opted in in writing. Collect scores from the league’s own posted results, write short reads and log every source. Minors are named by first name only and only with a parent’s sign-off; no team is covered without opting in.',
    deliverables: [
      'Opt-in log listing each team or league, the contact role and the date of written agreement',
      'Four weeks of score reads, each with its source',
      'Sign-off records for any minor named on air',
    ],
    acceptance: [
      'No team, player or score appears without a matching opt-in and source',
      'Minors appear by first name only, each with a parent sign-off on file',
      'Every read is under 30 seconds when spoken',
    ],
    learns: ['Sports stringing', 'Consent for minors', 'Tight writing for radio'],
    needsApproval: 'Mike approves the opt-in list before any team is contacted and before any read airs',
  },
  {
    id: 'RN-06',
    title: 'Record neighbor voices with the consent workflow',
    track: 'reporting',
    stations: ['el-segundo'],
    phase: 0,
    weeks: 3,
    brief:
      'Run the neighbor-voice workflow from the launch kit end to end: explain the project, get the consent form signed before recording, record a two-minute answer to one question card prompt, and log the file. Record in public spaces or by invitation only. Anyone may withdraw before airing and the recording is then deleted.',
    deliverables: [
      'Five neighbor-voice recordings, each paired with a signed consent form',
      'Recording log with date, place, question asked and consent status',
      'Withdrawal log, including any recording deleted on request',
    ],
    acceptance: [
      'No recording exists without a consent form signed before the recorder started',
      'Every clip is edited to the network audio standard without changing meaning',
      'Withdrawal requests were honored and logged',
    ],
    learns: ['Field recording', 'Informed consent', 'Interviewing strangers respectfully'],
    needsApproval: 'Mike approves the consent form version used and every clip before it airs or is published',
  },
  {
    id: 'RN-07',
    title: 'Develop a bilingual pilot for Radio Hawthorne',
    track: 'production',
    stations: ['hawthorne-lawndale'],
    phase: 3,
    weeks: 4,
    brief:
      'Develop a pilot plan and sample segment for Turno de Noche, the planned bilingual evening show for Radio Hawthorne. Draft the format, a Spanish and English station ID set and one sample segment built from public sources. Any community voice is recorded only with a consent form in the speaker’s preferred language.',
    deliverables: [
      'Format document: segment list, language balance and how bilingual handoffs work',
      'Station ID set in Spanish and English, reviewed by a second fluent speaker',
      'One sample segment of three to five minutes with sources and consent records',
    ],
    acceptance: [
      'Translations are checked by a second fluent speaker and the reviewer is named in the log',
      'Consent forms exist in both languages and each speaker signed the one they chose',
      'The plan states clearly that Radio Hawthorne is a Phase 3 station and not on air',
    ],
    learns: ['Bilingual production', 'Translation review', 'Format development'],
    needsApproval: 'Mike approves before any community member is recorded and before anything is published',
  },
  {
    id: 'RN-08',
    title: 'Stand up a Liquidsoap and Icecast stream test',
    track: 'engineering',
    stations: ['el-segundo'],
    phase: 0,
    weeks: 3,
    brief:
      'Build a private test stream with open-source Liquidsoap and Icecast that plays a looped playlist of station IDs and cleared practice audio, follows the hour clock and falls back to a silence-safe loop if the source drops. Document the setup so the next engineer can rebuild it. Use only audio PointCast has rights to; no commercial music.',
    deliverables: [
      'Configuration files and a setup README in a private repository or branch',
      'Test report: playback on a phone, a desktop browser and a smart speaker or car through a phone',
      'Failover test log showing what listeners hear when the source drops',
    ],
    acceptance: [
      'The stream runs for 24 hours without manual restarts',
      'The test URL is not linked publicly and plays only rights-cleared audio',
      'Another person can rebuild the stream from the README alone',
    ],
    learns: ['Streaming servers', 'Playout automation', 'Failover testing'],
    needsApproval: 'Mike approves before the stream URL is shared or linked from any public page',
  },
  {
    id: 'RN-09',
    title: 'Draft the underwriting kit for first local sponsors',
    track: 'underwriting',
    stations: ['el-segundo'],
    phase: 1,
    weeks: 2,
    brief:
      'Draft the materials a station desk lead would use to approach local underwriters: a one-page explainer, sample credits written the noncommercial way, a draft rate card range marked as a planning estimate, and a prospect list built from public business listings. Drafts only. No business is contacted from this assignment.',
    deliverables: [
      'One-page underwriting explainer',
      'Six sample credits that name and describe without prices or calls to action',
      'Prospect list of up to 25 El Segundo businesses with public source links, not personal contacts',
      'Draft outreach email for review',
    ],
    acceptance: [
      'Every sample credit follows the station rule: names and describes, does not sell',
      'The prospect list uses only public business information; no personal phone numbers or emails',
      'No business was contacted',
    ],
    learns: ['Noncommercial underwriting', 'Sponsor research', 'Drafting for approval'],
    needsApproval: 'Mike approves the kit and every outreach message before any business is contacted',
  },
  {
    id: 'RN-10',
    title: 'Run the transcripts and show notes pipeline',
    track: 'agent-ops',
    stations: ['el-segundo'],
    phase: 0,
    weeks: 2,
    brief:
      'Set up and run the clerical pipeline where agents draft and humans approve: transcribe each pilot episode, draft show notes with source links, build the play log JSON and flag anything that needs a correction. A named human reviews every transcript and note before it is published. Synthetic voices, if any are used, are labeled.',
    deliverables: [
      'Pipeline write-up: tools, steps, and where the human approval happens',
      'Transcripts and show notes for two practice episodes, with reviewer edits tracked',
      'Play log and corrections log in the station JSON shape',
    ],
    acceptance: [
      'Every published transcript and note carries the name of the human reviewer',
      'Agent drafts never publish directly; the review step is logged',
      'Error rate in the reviewed transcripts is measured and reported',
    ],
    learns: ['Human-in-the-loop agent workflows', 'Transcript QA', 'Structured logs'],
    needsApproval: 'Mike approves the pipeline before any agent-drafted text is published',
  },
];
