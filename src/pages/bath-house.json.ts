import type { APIRoute } from 'astro';
import { ACOUSTIC_DESIGN, BATH_MASTER_ROLE, FUNDING_CALENDAR, FUNDING_TIMELINE, HUNDRED_FOUNDING_BATHERS, MECHANICAL_SYSTEMS, PAPER_META, PAPER_NOTES, PARKS_DEPT_MOU, PHILOSOPHICAL_NOTES, PROGRAM, REFERENCES, STRUCTURE_AND_MATERIAL } from '../lib/bathHousePaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/bath-house.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentPaper: PAPER_META.parentPaper, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    program: PROGRAM,
    structureAndMaterial: STRUCTURE_AND_MATERIAL,
    mechanicalSystems: MECHANICAL_SYSTEMS,
    acousticDesign: ACOUSTIC_DESIGN,
    fundingCalendar: FUNDING_CALENDAR,
    fundingTimeline: FUNDING_TIMELINE,
    parksDeptMou: PARKS_DEPT_MOU,
    bathMasterRole: BATH_MASTER_ROLE,
    hundredFoundingBathers: HUNDRED_FOUNDING_BATHERS,
    philosophicalNotes: PHILOSOPHICAL_NOTES,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      programmedSpaces: PROGRAM.spaces.length,
      fundingSources: FUNDING_CALENDAR.sourceMix.length,
      timelineMilestones: FUNDING_TIMELINE.length,
      mouTerms: PARKS_DEPT_MOU.keyTerms.length,
      bathMasterDuties: BATH_MASTER_ROLE.primaryDuties.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/bath-house',
    parent: 'https://pointcast.xyz/giant-works',
    related: { giantWorks: 'https://pointcast.xyz/giant-works', giantWorksArt: 'https://pointcast.xyz/giant-works-art', federationCouncil: 'https://pointcast.xyz/federation-council', la28Ready: 'https://pointcast.xyz/la28-ready', strandCorridor: 'https://pointcast.xyz/strand-corridor', hermosaBeach: 'https://pointcast.xyz/hermosa-beach', commons: 'https://pointcast.xyz/commons', stones: 'https://pointcast.xyz/stones', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
