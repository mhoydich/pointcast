import { GUIDES, INTERN_ASSIGNMENTS } from './index';

export const INTAKE_SPEC = 'pointcast.guides-intake/v1';
export const INTAKE_ENDPOINT = 'https://pointcast.xyz/api/guides/intake';
export const INTAKE_PAGE = 'https://pointcast.xyz/guides/intake';

export const INTAKE_KINDS = ['tip', 'correction', 'resource', 'schedule', 'result', 'dataset', 'assignment-work'] as const;
export type IntakeKind = (typeof INTAKE_KINDS)[number];

const SOURCE_KINDS: IntakeKind[] = ['correction', 'resource', 'dataset', 'schedule', 'result'];

function suggestKinds(ask: string): IntakeKind[] {
  const t = ask.toLowerCase();
  const out: IntakeKind[] = [];
  if (/\bcorrection|out of date|wrong\b/.test(t)) out.push('correction');
  if (/schedule|calendar|agenda|hours|recurring/.test(t)) out.push('schedule');
  if (/result|score|standings|recap/.test(t)) out.push('result');
  if (/list of|ledger|template|directory|roster|table|spreadsheet/.test(t)) out.push('dataset');
  if (/link|page|resource|sample|template|format/.test(t)) out.push('resource');
  if (/tip|idea|advice|ways to/.test(t)) out.push('tip');
  return out.length ? [...new Set(out)] : ['tip', 'resource'];
}

function agentCheck(ask: string): { agentFriendly: boolean; reason?: string } {
  const t = ask.toLowerCase();
  if (/photo|picture|image/.test(t)) return { agentFriendly: false, reason: 'Involves photos; needs a human who took them and consent from anyone pictured.' };
  if (/interview|consent|permission|approved|agreed/.test(t)) return { agentFriendly: false, reason: 'Involves interviews or people\'s consent; a human must ask and confirm.' };
  if (/contact|organizer|captain|call\b|reach out/.test(t)) return { agentFriendly: false, reason: 'Involves contacting someone; agents never contact people.' };
  return { agentFriendly: true };
}

export function buildIntakeFeed() {
  const tasks: Record<string, unknown>[] = [];
  for (const g of GUIDES) {
    g.wanted.forEach((ask, i) => {
      const { agentFriendly, reason } = agentCheck(ask);
      tasks.push({
        id: `${g.slug}.w${i + 1}`,
        guide: g.slug,
        guideTitle: g.title,
        ask,
        suggestedKinds: suggestKinds(ask),
        agentFriendly,
        ...(reason ? { reason } : {}),
      });
    });
  }
  for (const a of INTERN_ASSIGNMENTS) {
    tasks.push({
      id: a.id,
      kind: 'assignment-work',
      internOnly: true,
      guide: a.guide,
      title: a.title,
      ask: a.brief,
      deliverables: a.deliverables,
      acceptance: a.acceptance,
      agentFriendly: false,
      reason: 'Intern assignment work; agents may not submit assignment-work.',
    });
  }
  return {
    spec: INTAKE_SPEC,
    endpoint: INTAKE_ENDPOINT,
    humanPage: INTAKE_PAGE,
    kinds: INTAKE_KINDS,
    sourceRequiredKinds: SOURCE_KINDS,
    rules: [
      'Agents draft only. Agents never publish, never contact people and never review.',
      'sourceUrls (https) are required for correction, resource, dataset, schedule and result submissions from agents.',
      'No private information: no email addresses, phone numbers or details about private individuals.',
      'Everything lands as pending and is human-reviewed. Every decision carries written feedback.',
      'Keep the receipt returned at submit time; it is shown once. Check status with GET ?receipt= and revise if changes are requested.',
      'Agents must not submit assignment-work; that is for interns.',
    ],
    submit: {
      method: 'POST',
      url: INTAKE_ENDPOINT,
      example: {
        action: 'submit',
        guide: GUIDES[0]?.slug ?? 'network',
        kind: 'resource',
        title: 'City special events page',
        body: 'Official city page for special event permits, checked on the date below. Lists the application window and fees.',
        sourceUrls: ['https://example.gov/special-events'],
        data: null,
        contributor: { name: 'Example Agent', kind: 'agent', model: 'model-name', operator: 'who runs you' },
        consent: { noPrivateInfo: true, humanReview: true },
      },
      check: `${INTAKE_ENDPOINT}?receipt=<receipt>`,
    },
    tasks,
    taskCount: tasks.length,
  };
}
