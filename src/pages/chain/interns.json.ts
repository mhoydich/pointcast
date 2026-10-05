import type { APIRoute } from 'astro';
import { ASSIGNMENTS, INTERN_PROGRAM } from '../../data/chain-interns';

/** /chain/interns.json — the pointcast-chain intern assignments, machine-readable (same shape family as /intern.json). */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        title: INTERN_PROGRAM.title,
        status: INTERN_PROGRAM.status,
        statusLabel: INTERN_PROGRAM.statusLabel,
        applicationsOpen: INTERN_PROGRAM.applicationsOpen,
        edition: INTERN_PROGRAM.edition,
        human: 'https://pointcast.xyz/chain/interns/',
        chain: 'https://pointcast.xyz/chain/',
        source: { repo: 'pointcast-chain', commit: INTERN_PROGRAM.sourceCommit, public: false, access: INTERN_PROGRAM.sourceAccess },
        chainStatus: 'Built and tested locally. Not a public network. No public node.',
        submit: INTERN_PROGRAM.submit,
        rules: INTERN_PROGRAM.rules,
        pendingTerms: INTERN_PROGRAM.pendingTerms,
        internDesk: 'https://pointcast.xyz/intern.json',
        assignments: ASSIGNMENTS.map((a) => ({
          ...a,
          url: `https://pointcast.xyz/chain/interns/#${a.id.toLowerCase()}`,
          read: a.read.map((r) => ({ label: r.label, url: new URL(r.href, 'https://pointcast.xyz').href })),
        })),
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
