import type { APIRoute } from 'astro';
import { ACOUSTIC_DESIGN, ANTI_DISNEY_HALL, CONCERT_MASTER_ROLE, CURATORIAL_COUNCIL, FUNDING_CALENDAR, FUNDING_TIMELINE, MECHANICAL_SYSTEMS, PAPER_META, PAPER_NOTES, PHILOSOPHICAL_NOTES, PROGRAM, REFERENCES, STRUCTURE_AND_MATERIAL, TCAC_PARTNERSHIP_MOU, THREE_FIFTY_FOUNDING_AUDIENCE } from '../lib/concertHallPaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/concert-hall.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentPaper: PAPER_META.parentPaper, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    antiDisneyHall: ANTI_DISNEY_HALL,
    program: PROGRAM,
    structureAndMaterial: STRUCTURE_AND_MATERIAL,
    mechanicalSystems: MECHANICAL_SYSTEMS,
    acousticDesign: ACOUSTIC_DESIGN,
    fundingCalendar: FUNDING_CALENDAR,
    fundingTimeline: FUNDING_TIMELINE,
    tcacPartnershipMou: TCAC_PARTNERSHIP_MOU,
    concertMasterRole: CONCERT_MASTER_ROLE,
    curatorialCouncil: CURATORIAL_COUNCIL,
    threeFiftyFoundingAudience: THREE_FIFTY_FOUNDING_AUDIENCE,
    philosophicalNotes: PHILOSOPHICAL_NOTES,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      antiDisneyContrasts: ANTI_DISNEY_HALL.fivePoints.length,
      programmedSpaces: PROGRAM.spaces.length,
      fundingSources: FUNDING_CALENDAR.sourceMix.length,
      timelineMilestones: FUNDING_TIMELINE.length,
      mouTerms: TCAC_PARTNERSHIP_MOU.keyTerms.length,
      concertMasterDuties: CONCERT_MASTER_ROLE.primaryDuties.length,
      curatorialDuties: CURATORIAL_COUNCIL.duties.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/concert-hall',
    parent: 'https://pointcast.xyz/giant-works-art',
    related: { giantWorksArt: 'https://pointcast.xyz/giant-works-art', bathHouse: 'https://pointcast.xyz/bath-house', federationCouncil: 'https://pointcast.xyz/federation-council', la28Ready: 'https://pointcast.xyz/la28-ready', torrance: 'https://pointcast.xyz/torrance', strandCorridor: 'https://pointcast.xyz/strand-corridor', commons: 'https://pointcast.xyz/commons', stones: 'https://pointcast.xyz/stones', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
