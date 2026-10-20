import type { InternAssignment } from './types';

/**
 * Educational project briefs for PointCast Guides. These are not job postings
 * and intern applications are not open. Each brief is a unit of practice work
 * that feeds a guide or the wider network.
 */
export const INTERN_ASSIGNMENTS: InternAssignment[] = [
  {
    id: 'GA-01',
    title: 'Interview a pickleball team captain for the team page',
    track: 'reporting',
    guide: 'pickleball-team-page',
    weeks: 1,
    brief:
      'Interview one team captain who has agreed in writing to a 30-minute call about how the team schedules play, welcomes new players and posts results. Turn the call into proposed updates to the team guide, using only what the captain said and confirmed.',
    deliverables: [
      'Consent form signed by the captain, stored with the assignment',
      'Interview notes with timestamps for each quote',
      'Proposed edits to the pickleball-team-page guide sections',
    ],
    acceptance: [
      'The captain has approved every quote in writing before anything is published',
      'No quote is attributed to anyone who did not say it',
      'Proposed edits add no facts the captain did not confirm',
    ],
    learns: ['Interviewing with consent', 'Quote verification', 'Turning notes into a guide section'],
    needsApproval: 'Mike approves before any interview is published or quoted',
  },
  {
    id: 'GA-02',
    title: 'Fact-check El Segundo resource links for new-in-town',
    track: 'reporting',
    guide: 'new-in-town',
    weeks: 2,
    brief:
      'Check each local resource already listed in the new-in-town guide for El Segundo. Confirm that it is open, current and useful to a newcomer, then propose additions. Record every check with the date and the primary source you used.',
    deliverables: [
      'Link audit table with status, last-checked date and source for each resource',
      'Up to five proposed additions, each with a one-line neutral description',
      'List of entries that could not be verified',
    ],
    acceptance: [
      'Every resource has a dated check against a primary source such as the organization site or a city page',
      'Nothing is added that was not checked',
      'Unverified entries are flagged, not silently removed',
    ],
    learns: ['Source verification', 'Local government research', 'Writing neutral one-line descriptions'],
    needsApproval: null,
  },
  {
    id: 'GA-03',
    title: 'Draft the first-visit checklist for a neighborhood guide',
    track: 'guide-writing',
    guide: 'start-a-neighborhood-guide',
    weeks: 1,
    brief:
      'Write a first draft of the checklist and the wanted list for the start-a-neighborhood-guide page. Base it on the guide sections already in place and on public city guidance about neighborhood groups. Keep the steps general enough for any neighborhood, with one El Segundo example.',
    deliverables: [
      'Checklist draft with six to eight steps, each with a one-sentence detail',
      'Wanted list draft with five items a reader could send in',
      'Short source note linking each step to the public guidance it came from',
    ],
    acceptance: [
      'Each step can be completed by one person in under an hour',
      'Every step cites a public source or is marked as the Guide opinion',
      'The text reads at about an eighth-grade level',
    ],
    learns: ['Plain-language how-to writing', 'Reader-first checklists', 'Citing public process pages'],
    needsApproval: null,
  },
  {
    id: 'GA-04',
    title: 'Write a plain-English ladder rules explainer',
    track: 'guide-writing',
    guide: 'pickleball-ladder-and-league-night',
    weeks: 3,
    brief:
      'Turn a set of ladder and league-night rules, shared by a host who agrees to share them, into a plain-English explainer with one worked example. Do not invent rules. Mark any rule the host has not confirmed so the Guide can resolve it.',
    deliverables: [
      'Rules explainer under 800 words',
      'One worked example using fictional player names',
      'List of open questions for the host',
    ],
    acceptance: [
      'Every rule traces to a source the host provided',
      'The worked example uses only fictional names and scores',
      'The explainer scores at grade 8 or below on a standard readability check',
    ],
    learns: ['Rules writing', 'Worked examples', 'Readability checks'],
    needsApproval: 'Mike approves the explainer before it is published',
  },
  {
    id: 'GA-05',
    title: 'Build a schedule and results JSON template for team pages',
    track: 'data',
    guide: 'pickleball-team-page',
    weeks: 2,
    brief:
      'Design a small JSON schema for a team schedule and results, with a sample file for one invented team. Pages and agents will read the same file, so keep field names plain and write every date in ISO 8601 with a time zone.',
    deliverables: [
      'JSON schema file with a description for each field',
      'Sample file for one fictional team with at least eight matches',
      'Short note listing edge cases such as forfeits, postponements, rain-outs and ties',
    ],
    acceptance: [
      'The sample validates against the schema with no errors',
      'Every date uses ISO 8601 with a time zone',
      'The schema can represent forfeit and postponed status',
    ],
    learns: ['JSON schema design', 'Data validation', 'Edge cases in sports data'],
    needsApproval: null,
  },
  {
    id: 'GA-06',
    title: 'Audit all guides for privacy: minors and consent',
    track: 'data',
    guide: null,
    weeks: 4,
    brief:
      'Read every guide and its sections, checklist and wanted list. Flag any text that names a minor, a private person or a private address, or that implies consent that was never given. Report each finding with its file and location. Do not edit the guides in this assignment.',
    deliverables: [
      'Audit table with one row per finding',
      'Severity rating for each finding',
      'Short summary of patterns and recommended fixes',
    ],
    acceptance: [
      'Every guide in src/data/guides is reviewed',
      'Each finding cites a slug and a section heading',
      'The report copies no personal details beyond what is needed to find the text',
    ],
    learns: ['Privacy review', 'Consent basics for public writing', 'Structured audit reporting'],
    needsApproval: 'Mike approves any fix that changes published guide text',
  },
  {
    id: 'GA-07',
    title: 'Design a printable game-day card for a court bulletin board',
    track: 'design',
    guide: 'game-day-reporting',
    weeks: 3,
    brief:
      'Design a one-page printable card that tells players how to find league-night information, check the ladder and report a score. Use only the steps and field names from the game-day-reporting guide. The card should be readable from two meters away.',
    deliverables: [
      'Print-ready PDF at letter size',
      'Editable source file',
      'One-paragraph note on type sizes and contrast choices',
    ],
    acceptance: [
      'Body text is at least 14 pt and headings at least 24 pt',
      'The card still reads clearly when printed in grayscale',
      'The card contains no photos of people',
    ],
    learns: ['Print layout', 'Type hierarchy', 'Contrast checks for accessibility'],
    needsApproval: 'Mike approves before the card is printed or posted at any venue',
  },
  {
    id: 'GA-08',
    title: 'Shoot header photos of public courts and beaches',
    track: 'design',
    guide: 'beach-and-run-clubs',
    weeks: 2,
    brief:
      'Photograph public parks, courts and beach access points in El Segundo for guide headers. Shoot at quiet hours, frame without identifiable people, and log the location and time of each shot. Do not photograph private property without permission.',
    deliverables: [
      'Set of ten to fifteen header-ready images, cropped to the guide banner size',
      'Shot log with location, date, time and orientation for each image',
      'Short note on any shot that needed a retake because of people in frame',
    ],
    acceptance: [
      'No image shows an identifiable person without signed consent on file',
      'Every image has an alt-text line describing the place, not the people',
      'Every image is at least 2000 pixels wide',
    ],
    learns: ['Location photography', 'Consent and privacy in public spaces', 'Image preparation for the web'],
    needsApproval: 'Mike approves every photo before it is used on any page',
  },
  {
    id: 'GA-09',
    title: 'Recruit and onboard the first three volunteer contributors',
    track: 'community',
    guide: 'start-a-pickleball-team',
    weeks: 1,
    brief:
      'Find three people who want to help with a guide, using a short public sign-up form and a short conversation with each. Explain the one-Guide-per-topic model, what contributors do and do not do, and which decisions are still open. This is a volunteer project brief. It is not a job offer, and intern applications are not open.',
    deliverables: [
      'Recruiting message draft for Mike to review',
      'One-page onboarding guide for contributors',
      'Log of the three first contributors and the first task each agreed to',
    ],
    acceptance: [
      'Three contributors have agreed in writing to a first task',
      'Contributors are asked only for a name and a preferred contact method',
      'The recruiting message makes no employment or compensation promises',
    ],
    learns: ['Volunteer recruiting', 'Onboarding design', 'Setting clear scope'],
    needsApproval: 'Mike approves the recruiting message before it is sent to anyone',
  },
  {
    id: 'GA-10',
    title: 'Compile a consent-based list of local run clubs and rec leagues',
    track: 'community',
    guide: 'beach-and-run-clubs',
    weeks: 2,
    brief:
      'List public-facing run clubs and rec leagues in the South Bay that publish their own meeting times. Use only public channels. Log each contact attempt and its result. Record organization names and public links only, with no personal details about any organizer.',
    deliverables: [
      'List of at least ten groups with name, public link, meeting info and last-checked date',
      'Contact log showing each attempt, channel and outcome',
      'Short note on which groups asked not to be listed',
    ],
    acceptance: [
      'Every listed group has a public source for its meeting information',
      'No group is listed after it asked to be left out',
      'The file holds no personal contact details for individuals',
    ],
    learns: ['Community research', 'Consent-based outreach', 'Maintaining a directory'],
    needsApproval: 'Mike approves before any group is listed publicly or contacted directly',
  },
  {
    id: 'GA-11',
    title: 'Write an agent prompt that drafts a game recap from a stats sheet',
    track: 'agent-ops',
    guide: 'game-day-reporting',
    weeks: 3,
    brief:
      'Write a prompt and a fixed output format for an agent that drafts a game recap from a stats sheet. The draft is for human review only. The prompt must forbid invented scores, names and quotes, and must mark any missing field instead of guessing.',
    deliverables: [
      'Prompt file with role, inputs, rules and output format',
      'Three test runs on fictional stats sheets, with saved outputs',
      'Failure log listing every invented detail the agent produced and the prompt change that fixed it',
    ],
    acceptance: [
      'The test set produces zero invented scores or names',
      'Missing fields appear as [MISSING] in the output',
      'Every output says a human must review it before publication',
    ],
    learns: ['Prompt design', 'Evaluation with test cases', 'Human review in the loop'],
    needsApproval: null,
  },
  {
    id: 'GA-12',
    title: 'Spec a weekly link-check and staleness report for all guides',
    track: 'agent-ops',
    guide: null,
    weeks: 4,
    brief:
      'Write a spec, not a live job, for a check that lists every related link and every dated checklist item across the guides. It should flag links not checked in 90 days and write a report for a human. The report goes to a review queue and never to the live site.',
    deliverables: [
      'Written spec covering inputs, outputs, schedule and failure cases',
      'Dry-run report on the current guides',
      'Runbook section explaining how a human clears each flag',
    ],
    acceptance: [
      'The dry run covers every guide in src/data/guides',
      'The spec makes no automatic edits to guide files',
      'The runbook names the reviewer and the time allowed for each flag',
    ],
    learns: ['Automation specs', 'Runbook writing', 'Limiting agent actions to review'],
    needsApproval: null,
  },
];
