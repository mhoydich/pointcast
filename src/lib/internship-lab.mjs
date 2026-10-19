export const roles = ['Design', 'Research', 'Build', 'Edit'];
export const taskDefinitions = [
  { id: 'understand', title: 'Find one useful job', detail: 'Choose a small audience and one problem. Write what the finished result helps someone do.' },
  { id: 'make', title: 'Make the smallest offer', detail: 'Use the First Offer Kit to draft one offer page and matching product record. State the contents, exclusions, rights and delivery.' },
  { id: 'test', title: 'Test it for the next person', detail: 'Check the page on a narrow screen, follow every link, inspect the downloadable files and compare the human and machine descriptions.' },
];
export const onboardingLabels = [
  'I understand this is practice, not an application or employment offer.',
  'I will use original or permitted material and keep personal information out.',
  'I understand that people review the work and control publication.',
];
export const reviewLabels = [
  'The offer solves a specific problem and its claims have evidence.',
  'Rights, attribution, exclusions and delivery are clear.',
  'The page, download and product record agree; keyboard and mobile checks are documented.',
  'No private data, invented sales, unsupported prices or automatic spending are included.',
];
export const deployLabels = [
  'The exact draft/version and review notes are identified.',
  'Checks, rollback plan and person responsible for release are recorded in the handoff.',
  'A human owner would approve this exact version through the real release process.',
];

export function createDraft() {
  return { role: 'Design', goal: '', offer: '', onboarding: onboardingLabels.map(() => false), tasks: taskDefinitions.map(t => ({ id: t.id, status: 'todo' })), evidence: '', artifactUrl: '', review: reviewLabels.map(() => false), reviewNote: '', deploy: deployLabels.map(() => false), approvalReference: '', practiceApproval: false };
}

export function validArtifactUrl(value) {
  if (!value.trim()) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

export function progress(draft) {
  const intake = roles.includes(draft.role) && draft.goal.trim().length >= 10 && draft.offer.trim().length >= 3;
  const onboarded = intake && draft.onboarding.every(Boolean);
  const built = onboarded && draft.tasks.every(t => t.status === 'ready');
  const submitted = built && draft.evidence.trim().length >= 30 && validArtifactUrl(draft.artifactUrl);
  const reviewed = submitted && draft.review.every(Boolean) && draft.reviewNote.trim().length >= 10;
  const releaseReady = reviewed && draft.deploy.every(Boolean) && draft.approvalReference.trim().length >= 5;
  return { intake, onboarded, built, submitted, reviewed, releaseReady, approved: releaseReady && draft.practiceApproval };
}

// Any changed source work invalidates its previous review and practice approval.
export function invalidateReview(draft) {
  draft.review = reviewLabels.map(() => false);
  draft.deploy = deployLabels.map(() => false);
  draft.practiceApproval = false;
}

export function exportDraft(draft) {
  return {
    format: 'pointcast-internship-handoff-v1',
    source: 'https://pointcast.xyz/internship-lab/',
    status: progress(draft).approved ? 'practice_approval_recorded' : 'local_draft',
    notice: 'Educational rehearsal only. Not submitted to PointCast. Not an application, employment decision, authenticated approval or deployment authorization.',
    applications_open: false, submitted_to_pointcast: false, deployment_enabled: false,
    role_interest: draft.role, learning_goal: draft.goal, offer_title: draft.offer,
    onboarding: onboardingLabels.map((label, i) => ({ label, checked: draft.onboarding[i] })),
    tasks: taskDefinitions.map((task, i) => ({ ...task, status: draft.tasks[i].status })),
    submission: { evidence: draft.evidence, artifact_url: draft.artifactUrl, local_ready: progress(draft).submitted },
    review: { checks: reviewLabels.map((label, i) => ({ label, checked: draft.review[i] })), note: draft.reviewNote, authenticated: false },
    deployment_rehearsal: { checks: deployLabels.map((label, i) => ({ label, checked: draft.deploy[i] })), reference: draft.approvalReference, practice_approval_recorded: progress(draft).approved, grants_publish_authority: false },
  };
}

export function exportMarkdown(draft) {
  const packet = exportDraft(draft);
  const checks = items => items.map(item => `- [${item.checked ? 'x' : ' '}] ${item.label}`).join('\n');
  return `# PointCast internship lab handoff\n\n${packet.notice}\n\nStatus: ${packet.status}\n\n## Interest draft\n\nRole: ${packet.role_interest}\n\nLearning goal: ${packet.learning_goal || '(not drafted)'}\n\nOffer: ${packet.offer_title || '(not drafted)'}\n\n## Onboarding\n\n${checks(packet.onboarding)}\n\n## Tasks\n\n${packet.tasks.map(t => `- ${t.title}: ${t.status}`).join('\n')}\n\n## Evidence for review\n\n${packet.submission.evidence || '(none yet)'}\n\nArtifact URL (unverified): ${packet.submission.artifact_url || '(none)'}\n\n## Review rehearsal\n\n${checks(packet.review.checks)}\n\nReview notes: ${packet.review.note || '(none yet)'}\n\n## Release rehearsal\n\n${checks(packet.deployment_rehearsal.checks)}\n\nPractice reference: ${packet.deployment_rehearsal.reference || '(none)'}\n\nPractice approval recorded: ${packet.deployment_rehearsal.practice_approval_recorded ? 'yes' : 'no'}\n\nThis file grants no publish authority. A human owner must separately approve the exact version and use PointCast’s reviewed release process. No work has been deployed.\n`;
}
