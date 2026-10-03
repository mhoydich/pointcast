/** Dated public evidence and proposals. No polling, project sync or chain actions. */
import { SNAPSHOT, LATEST_LINKS, STUDIO, NATIVE } from './hoydich-portfolio.mjs';

export const DASHBOARD_SNAPSHOT = {
  ...SNAPSHOT,
  note: 'Checked public pages and prepared studio work, grouped into project families. A dated editorial snapshot; nothing here polls a project service or a blockchain.',
};

const focused = new Set(['fila', 'books', 'discovery', 'coffee-business', 'business-signals', 'chain', 'art-v2', 'puzzles', 'buildworks', 'studio-identity']);
export const DASHBOARD_ROWS = [
  ...LATEST_LINKS.map(project => ({
    id: project.id, title: project.title, family: project.family ?? 'tools', status: 'open',
    summary: project.summary, nextAction: project.nextAction ?? 'Use the published edition and its source notes; review the date and project boundaries before relying on it.',
    focus: focused.has(project.id), href: project.href, ...(project.statusLabel ? { statusLabel: project.statusLabel } : {}),
    source: project.source ?? { href: project.href, label: 'Published project context' },
    sourceNote: project.statusLabel ? 'The status preview is public; service restrictions remain as described in the project summary.' : 'The page is public. Objects, garments and future scenarios may remain concepts.',
  })),
  ...STUDIO.map(project => ({
    id: project.id, title: project.title, family: project.family,
    status: project.status === 'ready' ? 'ready' : 'building', summary: project.direction,
    nextAction: project.nextStep, focus: true, ...(project.source ? { source: project.source } : {}),
    sourceNote: project.status === 'ready' ? 'Prepared design source; this edition has not been published.' : 'In progress. No unpublished destination is offered as an open project.',
  })),
  ...NATIVE.map(project => ({
    id: project.id, title: project.title, family: project.family, status: 'native',
    summary: project.description, nextAction: 'Review the delivered native edition locally before proposing a public browser version.',
    focus: false, sourceNote: project.boundary,
  })),
];

export const PROPOSALS = [
  { id: 'daymaker', number: '01', title: 'El Segundo Daymaker', selected: false,
    summary: 'Weather, coffee, courts, art and walks assembled into useful ways through a day.',
    firstEdition: 'Three starter routes: a coffee walk, an after-work court outing and an art loop. Check each place before making route claims.',
    nextAction: 'Choose the three starting points and verify access, hours and weather context.',
    reuse: [{href:'/weather-atlas/',label:'Weather & Living Atlas'},{href:'/ues/coffee/',label:'Coffee atlas'},{href:'/pickleball/home/',label:'RALLY courts'}] },
  { id: 'listening-shelf', number: '02', title: 'The Listening Shelf', selected: false,
    summary: 'A small listening and reading studio where books, playlists and original art share a mood.',
    firstEdition: 'After League: one reading shelf, one listening sequence and one original visual edition.',
    nextAction: 'Select the book and recording links, then verify credits and listening availability.',
    reuse: [{href:'/books/',label:'The reading shelf'},{href:'/meditate/2026-10-03/',label:'A music & place meditation'}] },
  { id: 'pilot-lab', number: '03', title: 'Buildworks Pilot Lab', selected: false,
    summary: 'Turn existing object and puzzle studies into one modest, testable production experiment.',
    firstEdition: 'One puzzle, one pin and one print, with dated supplier quotes and explicit unit-economics assumptions.',
    nextAction: 'Finish the current studies, select three designs and request actual supplier quotes before claiming costs or availability.',
    reuse: [{href:'/object-library/',label:'Object concepts'},{href:'/ues/business/',label:'UES business studies'}] },
  { id: 'chain-observatory', number: '04', title: 'Chain Observatory', selected: true,
    summary: 'A read-only evidence desk for PointCast’s contracts, payment quotes and recorded chain experiments.',
    firstEdition: 'Three evidence lanes: Tezos contracts, Etherlink/x402 runtime status, and the PointCast dev replay. Keep quote, settlement and network launch distinct.',
    nextAction: 'Define freshness and evidence rules around the existing chain pages before adding any polling.',
    reuse: [{href:'/chain/#status',label:'PointCast Chain status'},{href:'/x402.json',label:'x402 discovery'},{href:'/marketplace/',label:'Tezos marketplace context'}] },
  { id: 'pocket-museum', number: '05', title: 'Pocket Museum', selected: false,
    summary: 'A small exhibition you can carry: original art, short labels and a quiet route between works.',
    firstEdition: 'One six-work exhibition drawn from verified original artwork, with credits and accessible close reading.',
    nextAction: 'Select six works whose source and rights records are complete.',
    reuse: [{href:'/other-worlds/',label:'Other Worlds'},{href:'/bukowski/',label:'Original tribute writing'}] },
  { id: 'court-journal', number: '06', title: 'Court Journal', selected: false,
    summary: 'Keep practice observations and turn them into a useful next session, beside existing RALLY guides.',
    firstEdition: 'A local journal for three drills, a doubles reflection and a plain-text export.',
    nextAction: 'Choose one practice routine and define what a player can record without sharing personal data.',
    reuse: [{href:'/pickleball/home/',label:'RALLY practice desk'},{href:'/pickleball/articles/cleaner-backhands/',label:'Backhand guide'}] },
  { id: 'neighborhood-signals', number: '07', title: 'Neighborhood Signals', selected: true,
    summary: 'A dated neighborhood briefing that connects existing weather, place and business studies.',
    firstEdition: 'One El Segundo brief with climate context, coffee/place notes and sourced housing or business signals; show source age and coverage.',
    nextAction: 'Agree the handful of questions the brief should answer, then compare source dates and geographic scope.',
    reuse: [{href:'/weather-atlas/',label:'Historical climate context'},{href:'/ues/coffee/',label:'Coffee/place research'},{href:'/real-estate/',label:'Real estate methodology'},{href:'/business-feels/',label:'Business signals'}] },
  { id: 'studio-receipts', number: '08', title: 'Studio Receipts', selected: false,
    summary: 'A clear record of how a work moved from idea to draft to a public edition.',
    firstEdition: 'Three short project histories with dated source notes, original art credits and comparisons only where both editions are verified.',
    nextAction: 'Select three projects with enough preserved evidence to tell their development honestly.',
    reuse: [{href:'/hoydich/#field-notes',label:'Existing field notes'},{href:'/fila/#sources',label:'FILA source desk'}] },
  { id: 'object-exchange', number: '09', title: 'Object Exchange', selected: false,
    summary: 'Develop the Object Library’s browser rehearsal into a useful way to discuss lending needs.',
    firstEdition: 'A local wish-list and borrowing rehearsal for the six proposed objects, with clear controls and export.',
    nextAction: 'Learn which actual objects people need before proposing inventory, payments or a lending service.',
    reuse: [{href:'/object-library/',label:'Object Library rehearsal'}] },
  { id: 'futures-room', number: '10', title: '2027 Futures Room', selected: true,
    summary: 'A room for comparing existing 2027 ideas while keeping design fiction separate from evidence.',
    firstEdition: 'Three scenario boards: what to wear, what to make and how to move. Label each input as a released study, a concept or an unanswered question.',
    nextAction: 'Choose three scenarios and map the existing studies into them before commissioning new work.',
    reuse: [{href:'/fila/2027/',label:'2027 concept lookbook'},{href:'/object-library/',label:'Proposed everyday objects'},{href:'/hoydich/#roadmap',label:'The wider studio map'}] },
];

export const CHAIN_PANELS = [
  {
    "id": "tezos-l1",
    "title": "Tezos / existing contracts",
    "statusLabel": "Mainnet contracts verified",
    "tone": "verified",
    "summary": "Existing Tezos mainnet contracts were verified against public registry records. Contract existence does not show that every collection has an open mint flow.",
    "nextAction": "Read the registered contract context and check the particular collection’s current state.",
    "sources": [
      {
        "href": "https://github.com/mhoydich/pointcast/blob/aa2869924f9a1dac0067c42be3938ca1080fc04d/src/data/contracts.json",
        "label": "Public contract registry"
      }
    ],
    "checkedAt": "2026-10-03T20:15:00Z"
  },
  {
    "id": "etherlink-x402",
    "title": "Etherlink / x402",
    "statusLabel": "Quote available / settlement unverified",
    "tone": "limited",
    "summary": "The read-only endpoint quotes 0.01 USDC on Etherlink (42793); settlement was not verified in this snapshot. Base remains awaiting configuration. x402 is a payment protocol, separate from the PointCast dev chain.",
    "nextAction": "Compare the quote and runtime catalog. A quote or signed receipt alone is not proof of settlement.",
    "sources": [
      {
        "href": "/x402.json",
        "label": "Payment discovery"
      },
      {
        "href": "/oracles.json",
        "label": "Runtime catalog"
      }
    ],
    "checkedAt": "2026-10-03T20:15:00Z"
  },
  {
    "id": "art-minting",
    "title": "Art & archive minting",
    "statusLabel": "Specific services disabled / preview",
    "tone": "disabled",
    "summary": "An archive-wide collector flow is not verified here. Other Worlds’ claim service and Agent Cabinet are disabled previews; Other Worlds also has older minted inventory. These specific states do not mean every Tezos contract is paused.",
    "nextAction": "Verify each collection’s rights, edition terms and current availability before proposing a collector release.",
    "sources": [
      {
        "href": "/api/other-worlds",
        "label": "Other Worlds service status"
      },
      {
        "href": "/api/agent-cabinet/status",
        "label": "Cabinet service status"
      }
    ],
    "checkedAt": "2026-10-03T20:15:00Z"
  },
  {
    "id": "pointcast-dev",
    "title": "PointCast Chain / dev replay",
    "statusLabel": "Recorded prototype / no public node",
    "tone": "limited",
    "summary": "Replay 422 recorded dev-chain blocks in the browser. Tezos Shadownet posts were applied, but their binding to this recording is unchecked. No public node or value-bearing network is advertised; a replay does not establish production readiness.",
    "nextAction": "Read the dated network boundaries and try verification of the saved recording.",
    "sources": [
      {
        "href": "/chain#status",
        "label": "Local-network status"
      },
      {
        "href": "/chain/yard/snapshot.json",
        "label": "Recorded blocks"
      }
    ],
    "checkedAt": "2026-10-03T20:15:00Z"
  }
];

export function dashboardPayload() {
  return { snapshot: DASHBOARD_SNAPSHOT, rows: DASHBOARD_ROWS, proposals: PROPOSALS, chain: CHAIN_PANELS,
    statusDefinitions: { open: 'A verified public page is available; its contents may include concepts or demos.', building: 'Work is in progress; no unpublished route is linked as live.', ready: 'A prepared creative edition is ready for review; it is not published.', native: 'A native edition was delivered; no public browser route or download is offered.' },
    proposalNote: 'Selected next and proposed ideas have not started. Complete the current work before opening more builds.',
  };
}
