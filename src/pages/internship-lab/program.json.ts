import type { APIRoute } from 'astro';
import { taskDefinitions, onboardingLabels, reviewLabels, deployLabels } from '../../lib/internship-lab.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify({
  format: 'pointcast-internship-lab-v1',
  title: 'Internship Lab — one useful thing, from brief to handoff',
  canonical_url: 'https://pointcast.xyz/internship-lab/program.json',
  human_url: 'https://pointcast.xyz/internship-lab/',
  updated: '2026-10-19',
  status: 'available_educational_browser_sandbox',
  applications_open: false,
  intake: { status: 'local_interest_draft_only', submitted: false, asks_for_contact_details: false, persistence: 'memory_in_current_page_only; no_app_storage; browser_tab_restoration_may_retain_page_state', private_intake_configured: false },
  workflow: ['interest_draft', 'onboarding', 'first_assignment', 'task_tracking', 'local_submission_draft', 'review_rehearsal', 'practice_approval_record', 'export_handoff'],
  onboarding: onboardingLabels, tasks: taskDefinitions, review: reviewLabels, release_rehearsal: deployLabels,
  export_formats: ['application/json', 'text/markdown'],
  license: 'Exported original work belongs to its author. Third-party materials retain their own licenses. This workflow does not grant rights to PointCast marks or third-party content.',
  human_approval: { required_for_real_publication: true, browser_checklist_is_authenticated_approval: false, automatic_deployment: false },
  limitations: ['No live signup, applicant storage, hiring decision or employment offer.', 'No pay, credit, eligibility, capacity or schedule is promised.', 'No artifact uploads, URL fetching, payments, messages or deployments.'],
  real_program_pending: ['Private intake and privacy notice', 'Hiring entity and supervisor', 'Eligibility and safeguarding', 'Pay, hours and agreements', 'Approved capacity and review/release ownership'],
  related: { educational_briefs: 'https://pointcast.xyz/communications-lab/', current_intern_status: 'https://pointcast.xyz/intern.json', money_lab: 'https://pointcast.xyz/bot-money/' },
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
