import { PASSPORT_DOORS } from './radius25-passport.ts';

export const SHRINE_25 = {
  id: 'PC-BEACH-COMMONS-V18-SHRINE-25',
  title: 'SHRINE/25',
  subtitle: 'Nothing Left Behind',
  dek: 'Twelve portable public rituals for light, weather, memory, repair, play, and the clean close—made to be hosted, attended, and carried home.',
  url: 'https://pointcast.xyz/beach-commons/v18/shrines',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v18/shrines.json',
  blockUrl: 'https://pointcast.xyz/b/0562',
  fieldStudy: '018.E',
  publishedAt: '2026-08-03',
  updatedAt: '2026-08-03T23:22:00-07:00',
  center: 'El Segundo, California',
  radius: 'roughly 25 straight-line miles',
} as const;

export const SHRINE_PROTOCOLS = [
  { id:'first-light', number:'01', family:'light', mark:'◒', title:'First Light', invitation:'Face the first useful light. Name one thing worth beginning.', bring:'One warm-colored card or pocket cloth you already own.', act:'Hold sixty seconds of quiet, then each person says one possible beginning.', close:'Fold the color away and leave together.', never:'No attachment, marking, wax, flame, or unattended object.' },
  { id:'wind-register', number:'02', family:'elements', mark:'≋', title:'Wind Register', invitation:'Let the air write one invisible score.', bring:'Three short ribbons or threads held only in the hand.', act:'Notice direction, pause, gust, and the place where wind changes around a body.', close:'Count every thread back into the pocket.', never:'Never tie ribbon to plants, fences, signs, benches, or habitat.' },
  { id:'water-thanks', number:'03', family:'elements', mark:'≈', title:'Water Thanks', invitation:'Thank water without giving it another object to carry.', bring:'Nothing beyond drinking water for yourself.', act:'Hear three distances of water, drainage, mist, tide, fountain, or rain.', close:'Say one way water made this place possible; depart dry.', never:'No pouring, tossing, floating, collecting, feeding, or entering closed water.' },
  { id:'shade-seat', number:'04', family:'care', mark:'⌂', title:'The Best Seat', invitation:'Make comfort visible by offering it first.', bring:'One personal seat or mat only where ordinary use is allowed.', act:'Offer the best shade, view, or easiest position to someone else.', close:'Lift the seat, check the ground, reopen the passage.', never:'No reserved territory, blocked route, attachment, or unattended setup.' },
  { id:'repair-minute', number:'05', family:'care', mark:'+', title:'Repair Minute', invitation:'Bring one small broken thing back into usefulness.', bring:'A pocket repair for an object you brought: thread, tape, patch, or tiny tool.', act:'Make one reversible repair while another person reads the object’s story.', close:'Pack every clipping, backing, offcut, and tool.', never:'No public worktable or offered service unless the site and event lane allow it.' },
  { id:'names-carried', number:'06', family:'memory', mark:'·', title:'Names Carried', invitation:'Give memory a voice, not a monument.', bring:'A private list in your pocket, if useful.', act:'Speak, think, sign, or write privately the names you want to carry forward.', close:'Keep or destroy the private note; leave no plaque, sign, photo, or token.', never:'No marking, burial, scattering, unattended memorial, or expectation of disclosure.' },
  { id:'fair-start', number:'07', family:'play', mark:'○', title:'Fair Start', invitation:'Bless the game by making the beginning fair.', bring:'One pocket-size soft game object, or nothing.', act:'Agree on the easiest entry, one visible boundary, and a graceful way to stop.', close:'Finish on a cooperative success and reopen the field.', never:'No exclusive claim, hard projectile, amplified call, betting, or blocked public play.' },
  { id:'pollinator-hour', number:'08', family:'habitat', mark:'⌇', title:'Five Small Visits', invitation:'Practice reverence by not approaching.', bring:'Eyes, patience, and an optional pocket notebook.', act:'From a respectful distance, notice five visits to plant, ground, sky, or water.', close:'Keep only the observation.', never:'No touching, feeding, baiting, collecting, moving, or crowding wildlife.' },
  { id:'good-handoff', number:'09', family:'memory', mark:'⇢', title:'Good Handoff', invitation:'Let one useful thing travel person to person.', bring:'A fact, short story, gesture, or small object you already own.', act:'Pass it once. The receiver says what changed in the handoff.', close:'Return objects to their owners; carry the story onward only with consent.', never:'No recruitment list, identity capture, automatic post, or obligation to participate.' },
  { id:'fire-ring-vigil', number:'10', family:'elements', mark:'△', title:'Ring Vigil', invitation:'Use an existing legal hearth as a shared clock.', bring:'Only what current posted rules allow at a designated fire ring.', act:'Watch one ember change, make room for a story, and choose the stopping time early.', close:'Extinguish exactly as the steward directs; account for every person and object.', never:'No independent fire, sand flame, brought fire pit, unattended flame, or claim of availability.' },
  { id:'west-color', number:'11', family:'light', mark:'◐', title:'West Color', invitation:'Watch the day change without turning it into proof.', bring:'No camera is required; one color word each is enough.', act:'Name the sky, ground, faces, and far edge as the palette changes.', close:'Keep the last color in memory and leave before the place closes.', never:'No flash, staging, blocked view, or pressure to photograph or share.' },
  { id:'clean-close', number:'12', family:'care', mark:'✓', title:'Clean Close', invitation:'Make departure the most beautiful construction.', bring:'A small bag for your own setup and incidental safe litter.', act:'Count people, objects, edges, and the route out. Compare the ground to arrival.', close:'Everyone and everything leaves. The public room becomes public again.', never:'No hidden cache, future marker, leftover gift, loose material, or unfinished object.' },
] as const;

export const SHRINE_WATCHES = [
  { id:'dawn', label:'Dawn', time:'8–12 minutes', tone:'begin', note:'Soft speech, first useful light, a cool public room.' },
  { id:'day', label:'Day', time:'12–20 minutes', tone:'make', note:'Clear passage, small repair, fair play, shade and care.' },
  { id:'dusk', label:'Dusk', time:'10–18 minutes', tone:'remember', note:'Long color, names carried, a deliberate ending.' },
  { id:'night', label:'Night', time:'8–15 minutes', tone:'listen', note:'Only where current access and lighting support a safe, lawful visit.' },
] as const;

export const SHRINE_COMPANY = [
  { id:'one', label:'One', range:'1 person', instruction:'Keep it personal, attended, pocket-size, and indistinguishable from considerate ordinary use.' },
  { id:'few', label:'A few', range:'2–6 people', instruction:'Choose a host, keep passage open, invite no audience, and close as one group.' },
  { id:'circle', label:'Small circle', range:'7–20 people', instruction:'Treat this as an organized gathering: check the steward and permit lane before announcing or setting up.' },
] as const;

export const SHRINE_LANES = [
  { id:'pocket', number:'01', title:'Pocket shrine', test:'One person or a few companions; attended; ordinary personal objects; no public invitation, setup, attachment, or residue.', move:'Check current hours, signs, closures, and site rules. If any element stops feeling like ordinary use, move to the hosted lane.' },
  { id:'hosted', number:'02', title:'Hosted gathering', test:'An organized group, memorial, public invitation, table, chairs, service, repeated program, or coordinated activity.', move:'Contact the operating steward before promotion. LA County-operated beaches and Marina del Rey require a Special Event Use Permit for organized group activities.' },
  { id:'built', number:'03', title:'Built installation', test:'Anything anchored, attached, left in place, constructed, displayed as public art, or requiring temporary structures or power.', move:'Use the owner or agency’s public-art, facility-use, engineering, fire, access, and special-event process. A concept page is not approval.' },
  { id:'event', number:'04', title:'Public event', test:'A promoted program, 100+ people, after-hours use, admission, amplified sound, food or alcohol, vendors, or temporary structures.', move:'Begin with the relevant facility and special-event office. Timing, fees, insurance, safety plans, and additional permits may apply.' },
] as const;

export const SHRINE_SOURCES = [
  { id:'beach-faq', label:'LA County beach rules FAQ', url:'https://beaches.lacounty.gov/la-county-beach-rules-faq/', note:'Ordinary beach use, canopies, parties, and Dockweiler fire-pit rules; updated May 16, 2025.' },
  { id:'beach-events', label:'LA County beach special-event permits', url:'https://beaches.lacounty.gov/special-event-permit/', note:'Organized groups and examples including memorials, vendors, and table or chair setup on County-operated beaches and Marina del Rey.' },
  { id:'parks-events', label:'LA County Parks special events', url:'https://parks.lacounty.gov/special-events-main/', note:'Facility-use and larger-event triggers for County parks.' },
  { id:'dockweiler-fire', label:'Dockweiler fire-pit guidance', url:'https://beaches.lacounty.gov/dockweiler-beach-fire-pits', note:'Current official ring availability and use guidance; first-come does not guarantee a pit.' },
  { id:'el-segundo-art', label:'El Segundo cultural development guidelines', url:'https://www.elsegundo.org/home/showpublisheddocument/12247/639050442028970000', note:'A local example of formal review for art proposed for public view or public space.' },
  { id:'tidepool', label:'California State Parks tidepool etiquette', url:'https://www.parks.ca.gov/?page_id=25082', note:'Leave shells, rocks, plants, animals, and tide life where they are; local rules and protected-area requirements control.' },
] as const;

export const SHRINE_DOORS = PASSPORT_DOORS.map((door) => ({
  id: door.id,
  number: door.number,
  name: door.name,
  city: door.city,
  source: door.source,
  sourceLabel: door.sourceLabel,
  check: door.check,
}));

export const SHRINE_BOUNDARIES = [
  'The object leaves with the host. Nothing is hidden, scattered, buried, burned, poured, planted, tied, nailed, taped, chalked, stacked, or left as a gift.',
  'The public path, accessible route, seat, court, field, shoreline, habitat edge, and emergency access remain open.',
  'No shell, stone, sand, plant, animal, tide life, artifact, or site material becomes shrine material.',
  'No flame outside a current legal designated ring; no unattended flame; no claim that a ring, space, or condition is available.',
  'No identity list, geolocation, camera, microphone, analytics, automatic sharing, public attendance record, or network write.',
  'An organized gathering or built work starts with the steward, permit, accessibility, safety, ecology, and removal plan—not with an announcement.',
] as const;
