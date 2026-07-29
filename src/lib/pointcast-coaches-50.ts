export type CoachAxis =
  | 'program'
  | 'capital'
  | 'players'
  | 'region'
  | 'fans'
  | 'facilities'
  | 'aura';

export type CoachScorecard = Record<CoachAxis, number>;

export type CoachCard = {
  rank: number;
  coach: string;
  school: string;
  conference: string;
  region: string;
  signal: string;
  scores: CoachScorecard;
  case: string;
  question: string;
};

export const COACH_AXIS_LABELS: Array<{
  id: CoachAxis;
  label: string;
  weight: number;
  note: string;
}> = [
  {
    id: 'program',
    label: 'Program',
    weight: 20,
    note: 'The durable football system: staff, standards, decision quality, and proof over time.',
  },
  {
    id: 'capital',
    label: 'Capital',
    weight: 15,
    note: 'Not raw wealth. The ability to turn roster, staff, travel, and institutional resources into advantage.',
  },
  {
    id: 'players',
    label: 'Players',
    weight: 20,
    note: 'Recruiting, development, retention, role clarity, and the trust that survives a depth chart.',
  },
  {
    id: 'region',
    label: 'Region',
    weight: 10,
    note: 'Fit with place, recruiting roads, local identity, weather, and the program’s natural constituency.',
  },
  {
    id: 'fans',
    label: 'Fans',
    weight: 10,
    note: 'Belief, expectation, access, temperature, and whether the coach can carry the public story.',
  },
  {
    id: 'facilities',
    label: 'Facilities',
    weight: 10,
    note: 'How intelligently the physical plant supports daily work. Buildings are an amplifier, not a coach.',
  },
  {
    id: 'aura',
    label: 'Aura',
    weight: 15,
    note: 'The difficult residue: attention, inevitability, fear, calm, theater, and the feeling before proof arrives.',
  },
];

const coach = (
  rank: number,
  coachName: string,
  school: string,
  conference: string,
  region: string,
  signal: string,
  scores: CoachScorecard,
  caseFor: string,
  question: string,
): CoachCard => ({
  rank,
  coach: coachName,
  school,
  conference,
  region,
  signal,
  scores,
  case: caseFor,
  question,
});

export const POINTCAST_COACHES_50: CoachCard[] = [
  coach(1, 'Curt Cignetti', 'Indiana', 'Big Ten', 'Bloomington / Rust Belt edge', 'The new proof', { program: 10, capital: 9, players: 10, region: 9, fans: 10, facilities: 8, aura: 10 }, 'He made certainty portable, then made Indiana the center of the sport. The feat is not merely winning; it is changing what the room thinks it is allowed to expect.', 'Can the cleanest belief system in football survive becoming the thing everyone studies?'),
  coach(2, 'Kirby Smart', 'Georgia', 'SEC', 'Athens / Georgia pipeline', 'The standing empire', { program: 10, capital: 10, players: 10, region: 10, fans: 9, facilities: 10, aura: 10 }, 'The best complete machine: local talent, staff depth, physical identity, recruiting memory, and enough institutional alignment to keep refreshing the edge.', 'Does a mature empire still invent, or only defend?'),
  coach(3, 'Ryan Day', 'Ohio State', 'Big Ten', 'Columbus / national scale', 'The proof after proof', { program: 10, capital: 10, players: 10, region: 9, fans: 8, facilities: 10, aura: 9 }, 'He works inside the sport’s hottest expectation chamber and keeps producing elite offense, elite rosters, and championship-level Sundays.', 'Can joy ever enter a room where almost every win is treated as rent?'),
  coach(4, 'Marcus Freeman', 'Notre Dame', 'Independent', 'South Bend / national parish', 'The modern steward', { program: 9, capital: 9, players: 10, region: 8, fans: 10, facilities: 9, aura: 10 }, 'A rare fit between person, place, recruiting reach, and public meaning. He has made inherited mythology feel inhabited rather than displayed.', 'Can Notre Dame turn moral clarity and national reach into the last two wins?'),
  coach(5, 'Dan Lanning', 'Oregon', 'Big Ten', 'Eugene / Pacific Northwest', 'The acceleration lab', { program: 9, capital: 10, players: 10, region: 9, fans: 9, facilities: 10, aura: 10 }, 'He converts capital into tempo, recruits into competition, and visual confidence into a real football identity. Oregon feels less like a brand campaign than a living lab.', 'What happens when the sport finally makes the lab play slow?'),
  coach(6, 'Mario Cristobal', 'Miami', 'ACC', 'Miami / South Florida', 'The regional reclamation', { program: 9, capital: 9, players: 10, region: 10, fans: 9, facilities: 8, aura: 10 }, 'He understands that Miami’s highest resource is not nostalgia but geography. The roster, line play, and city are beginning to tell the same story.', 'Can a revived local machine become durable before the city finds its next obsession?'),
  coach(7, 'Kalen DeBoer', 'Alabama', 'SEC', 'Tuscaloosa / national pipeline', 'The impossible inheritance', { program: 9, capital: 10, players: 10, region: 8, fans: 8, facilities: 10, aura: 9 }, 'Few coaches see offensive answers faster. His 2026 work is larger: translate a flexible, humane program into a building designed around a singular predecessor.', 'Can adaptation become Alabama’s next tradition?'),
  coach(8, 'Steve Sarkisian', 'Texas', 'SEC', 'Austin / Texas triangle', 'The open throttle', { program: 9, capital: 10, players: 10, region: 10, fans: 9, facilities: 10, aura: 9 }, 'The scheme is a recruiting pitch, the campus is a capital city, and the resource ceiling may not exist. He has made the giant program feel technically specific.', 'When every advantage is present, which imperfection still belongs to the coach?'),
  coach(9, 'Lane Kiffin', 'LSU', 'SEC', 'Baton Rouge / Gulf South', 'The volatile merger', { program: 9, capital: 10, players: 10, region: 9, fans: 9, facilities: 10, aura: 10 }, 'The sport’s best public improviser just entered one of its richest local ecologies. Offense, portal literacy, Louisiana talent, and Saturday night now occupy one room.', 'Can a personality built on motion create the stability LSU keeps buying?'),
  coach(10, 'Kyle Whittingham', 'Michigan', 'Big Ten', 'Ann Arbor / Great Lakes', 'The master changes rooms', { program: 10, capital: 9, players: 9, region: 8, fans: 9, facilities: 10, aura: 10 }, 'For two decades he made toughness feel indigenous to Utah. Michigan now tests whether his deepest advantage was geography—or an operating system he can carry anywhere.', 'Does the oldest new hire in the sport make Michigan feel younger?'),
  coach(11, 'Dabo Swinney', 'Clemson', 'ACC', 'Upstate South Carolina', 'The sovereign system', { program: 10, capital: 9, players: 9, region: 10, fans: 9, facilities: 10, aura: 9 }, 'He built the whole town-sized thing: language, development, loyalty, facility theater, and national proof. His refusal to mimic every market trend is now either moat or tax.', 'Can conviction remain a competitive advantage when the labor market keeps changing?'),
  coach(12, 'Mike Elko', 'Texas A&M', 'SEC', 'College Station / Texas', 'The adult in the room', { program: 9, capital: 10, players: 9, region: 9, fans: 9, facilities: 10, aura: 8 }, 'He brings diagnostic calm to the nation’s loudest pile of unrealized inputs. The early achievement is making restraint feel ambitious.', 'Can a program famous for resources learn to admire conversion more than acquisition?'),
  coach(13, 'Kalani Sitake', 'BYU', 'Big 12', 'Provo / Mountain West', 'The belonging engine', { program: 9, capital: 8, players: 9, region: 10, fans: 10, facilities: 9, aura: 9 }, 'Few coaches align team, faith, diaspora, region, and emotional tone so naturally. BYU plays like an institution with a memory of itself.', 'How far can belonging travel when the weekly talent math tightens?'),
  coach(14, 'Rhett Lashlee', 'SMU', 'ACC', 'Dallas / private capital', 'The city accelerator', { program: 9, capital: 10, players: 9, region: 10, fans: 8, facilities: 9, aura: 8 }, 'He joined speed, donor urgency, Dallas recruiting, and modern offense without letting the project feel purely purchased.', 'Can SMU turn a fast return into a long civic relationship?'),
  coach(15, 'Joey McGuire', 'Texas Tech', 'Big 12', 'Lubbock / West Texas', 'The network state', { program: 8, capital: 10, players: 9, region: 10, fans: 10, facilities: 9, aura: 9 }, 'The high-school network is not a slogan; it is distribution. Add serious new capital and a fan base that treats distance as identity, and the ceiling changes.', 'Can the most energized room in the Big 12 keep its patience when it begins expecting trophies?'),
  coach(16, 'Willie Fritz', 'Houston', 'Big 12', 'Houston / Gulf metropolis', 'The lifetime builder', { program: 9, capital: 8, players: 8, region: 10, fans: 8, facilities: 8, aura: 8 }, 'His career is a long argument for building where you stand. Houston gives him the deepest local player pool he has ever governed.', 'Can a commuter-city program turn metropolitan scale into weekly intimacy?'),
  coach(17, 'Josh Heupel', 'Tennessee', 'SEC', 'Knoxville / Tennessee Valley', 'The tempo revival', { program: 9, capital: 9, players: 9, region: 9, fans: 10, facilities: 9, aura: 9 }, 'He restored offensive pleasure to a fan culture exhausted by self-seriousness. Neyland now feels like an instrument again.', 'Can tempo become a complete championship identity rather than a glorious condition?'),
  coach(18, 'Jeff Brohm', 'Louisville', 'ACC', 'Louisville / Ohio Valley', 'The hometown engineer', { program: 9, capital: 8, players: 9, region: 10, fans: 9, facilities: 9, aura: 8 }, 'Local credibility, quarterback imagination, and an exact feel for the institution make him one of the sport’s cleanest fits.', 'What does Louisville become when the homecoming phase is over?'),
  coach(19, 'Matt Campbell', 'Penn State', 'Big Ten', 'State College / interior Pennsylvania', 'The scale translation', { program: 9, capital: 9, players: 9, region: 9, fans: 9, facilities: 10, aura: 8 }, 'He built culture in a place with little inherited margin. Penn State supplies the margin—and asks whether his developmental patience can operate at championship speed.', 'Can a builder keep his intimacy when the room grows to 107,000 seats?'),
  coach(20, 'James Franklin', 'Virginia Tech', 'ACC', 'Blacksburg / Mid-Atlantic', 'The reboot specialist', { program: 9, capital: 8, players: 9, region: 9, fans: 10, facilities: 8, aura: 9 }, 'His recruiting organization and public program-building arrive at a place starving to reconnect the state, the stadium, and the national conversation.', 'Can “Invest to Win” become a football culture rather than a capital slogan?'),
  coach(21, 'Lincoln Riley', 'USC', 'Big Ten', 'Los Angeles / national market', 'The beautiful risk', { program: 8, capital: 9, players: 10, region: 8, fans: 7, facilities: 9, aura: 9 }, 'There may be no better designer of quarterback confidence. The ranking now turns on whether his program can make resistance as legible as invention.', 'Can USC become physically trustworthy without sanding off the thing that makes Riley rare?'),
  coach(22, 'Kirk Ferentz', 'Iowa', 'Big Ten', 'Iowa City / Upper Midwest', 'The old operating system', { program: 10, capital: 8, players: 9, region: 10, fans: 9, facilities: 9, aura: 8 }, 'Continuity itself is a competitive resource. Iowa knows its weather, body types, fan bargain, and Saturday grammar better than almost anyone.', 'At what point does institutional memory stop being wisdom and start being latency?'),
  coach(23, 'Kenny Dillingham', 'Arizona State', 'Big 12', 'Tempe / desert metropolis', 'The young civic pitch', { program: 8, capital: 8, players: 9, region: 10, fans: 9, facilities: 8, aura: 10 }, 'He speaks to the valley like a resident, not a consultant. The emotional speed is real, and so is the emerging player-development case.', 'Can a hot young project build boring, durable infrastructure before the next leap arrives?'),
  coach(24, 'Sonny Dykes', 'TCU', 'Big 12', 'Fort Worth / North Texas', 'The flexible private', { program: 9, capital: 9, players: 9, region: 10, fans: 8, facilities: 9, aura: 8 }, 'He understands private-school agility, Texas offense, portal timing, and the freedom to reshape a roster quickly.', 'Was the title run a peak, or proof of an institution designed for volatility?'),
  coach(25, 'Bret Bielema', 'Illinois', 'Big Ten', 'Champaign / central Illinois', 'The heavy restoration', { program: 9, capital: 8, players: 9, region: 10, fans: 8, facilities: 8, aura: 8 }, 'He made local body types, line play, and plainspoken confidence feel like a modern counterculture rather than a reenactment.', 'Can the restoration recruit enough speed without losing its center of gravity?'),
  coach(26, 'Brent Venables', 'Oklahoma', 'SEC', 'Norman / Southern Plains', 'The defensive furnace', { program: 8, capital: 9, players: 9, region: 9, fans: 10, facilities: 9, aura: 9 }, 'The standards, recruiting reach, and defensive imagination remain elite. The job is to make the whole room as coherent as the most intense part of it.', 'Can intensity become a resource that players live in rather than recover from?'),
  coach(27, 'Clark Lea', 'Vanderbilt', 'SEC', 'Nashville / private urban South', 'The institution hacker', { program: 9, capital: 8, players: 8, region: 10, fans: 8, facilities: 8, aura: 9 }, 'He understands Vanderbilt’s constraints as design material. Academic specificity and Nashville access are beginning to work together rather than apologize for each other.', 'Can the cleverest exception in the league preserve its edge after everyone notices?'),
  coach(28, 'Manny Diaz', 'Duke', 'ACC', 'Durham / Research Triangle', 'The second-act fit', { program: 8, capital: 8, players: 9, region: 9, fans: 7, facilities: 8, aura: 8 }, 'Duke gives his defensive energy a smaller, clearer institutional canvas. The work is precise, developmental, and less burdened by theater.', 'How much national ceiling can a program create before local attention catches up?'),
  coach(29, 'Spencer Danielson', 'Boise State', 'Mountain West', 'Boise / Intermountain West', 'The blue-field successor', { program: 9, capital: 7, players: 9, region: 10, fans: 10, facilities: 8, aura: 9 }, 'He inherited a tradition of doing more with clarity and made it emotionally his own. Boise still knows how to turn distance from the center into identity.', 'Can the sport’s new economics leave enough oxygen for the best regional machine?'),
  coach(30, 'Jeff Monken', 'Army', 'American', 'West Point / Hudson Valley', 'The total institution', { program: 10, capital: 6, players: 9, region: 10, fans: 10, facilities: 8, aura: 10 }, 'No coach-program relationship is more complete. Mission, player profile, place, physical language, and public meaning all reinforce the football.', 'How do you modernize a total system without diluting the source of its coherence?'),
  coach(31, 'Brent Key', 'Georgia Tech', 'ACC', 'Atlanta / urban South', 'The line-room revival', { program: 8, capital: 8, players: 9, region: 10, fans: 8, facilities: 8, aura: 8 }, 'An alumnus with a line coach’s eye has made toughness credible inside one of the country’s richest cities and recruiting regions.', 'Can Tech claim Atlanta as daily infrastructure rather than billboard territory?'),
  coach(32, 'Jedd Fisch', 'Washington', 'Big Ten', 'Seattle / Pacific Northwest', 'The professionalizer', { program: 8, capital: 9, players: 9, region: 9, fans: 9, facilities: 9, aura: 8 }, 'He builds staffs, quarterbacks, and external belief quickly. Washington provides a sophisticated fan base and one of the sport’s great physical settings.', 'Will constant construction ever settle into an identity people can name?'),
  coach(33, 'Eli Drinkwitz', 'Missouri', 'SEC', 'Columbia / border state', 'The boundary player', { program: 8, capital: 9, players: 9, region: 9, fans: 8, facilities: 8, aura: 9 }, 'He understands the portal, the state, the league’s media physics, and the motivational value of being slightly overlooked.', 'Can Missouri keep the underdog voltage after becoming a funded expectation?'),
  coach(34, 'Lance Leipold', 'Kansas', 'Big 12', 'Lawrence / Great Plains', 'The patient rebuilder', { program: 9, capital: 8, players: 9, region: 9, fans: 9, facilities: 8, aura: 8 }, 'His work remains one of the era’s best demonstrations that teaching, staff continuity, and adult sequencing can change a program’s floor.', 'Can the rebuilt stadium and rebuilt expectations rise at the same pace?'),
  coach(35, 'Brian Newberry', 'Navy', 'American', 'Annapolis / Chesapeake', 'The adaptive mission', { program: 9, capital: 6, players: 9, region: 10, fans: 9, facilities: 8, aura: 9 }, 'He has preserved service-academy coherence while updating how Navy creates conflict. Constraint becomes football language.', 'Can adaptation keep outrunning the growing physical gap?'),
  coach(36, 'Jon Sumrall', 'Florida', 'SEC', 'Gainesville / Florida', 'The pressure launch', { program: 8, capital: 10, players: 9, region: 10, fans: 8, facilities: 10, aura: 9 }, 'His rise is built on directness, defense, and immediate cultural traction. Florida gives those traits enormous fuel and almost no warm-up period.', 'Can urgency build a foundation before it starts charging interest?'),
  coach(37, 'P.J. Fleck', 'Minnesota', 'Big Ten', 'Twin Cities / Upper Midwest', 'The culture exporter', { program: 8, capital: 8, players: 8, region: 9, fans: 8, facilities: 9, aura: 8 }, 'The language can be loud, but the developmental floor and internal clarity are real. He keeps Minnesota nationally legible.', 'Can the program create a second great act without changing its vocabulary?'),
  coach(38, 'Matt Rhule', 'Nebraska', 'Big Ten', 'Lincoln / Great Plains', 'The sleeping civic giant', { program: 8, capital: 9, players: 9, region: 10, fans: 10, facilities: 9, aura: 9 }, 'Few coaches are better at naming the emotional and structural work of a rebuild. Nebraska supplies incomparable public commitment.', 'When does empathy for the rebuild become a demand for arrival?'),
  coach(39, 'Pat Narduzzi', 'Pittsburgh', 'ACC', 'Pittsburgh / Appalachia', 'The contrarian', { program: 8, capital: 7, players: 8, region: 10, fans: 7, facilities: 7, aura: 8 }, 'His defensive stubbornness and regional bluntness give Pitt a recognizable edge in a sport smoothing itself into sameness.', 'Can a contrarian program generate enough offensive surprise to matter nationally again?'),
  coach(40, 'Dan Mullen', 'UNLV', 'Mountain West', 'Las Vegas / desert market', 'The laboratory return', { program: 8, capital: 8, players: 9, region: 9, fans: 8, facilities: 9, aura: 9 }, 'An elite offensive teacher returns in a market built on events, reinvention, and transient attention. The fit could be strange in the productive way.', 'Can the football program create local habit inside a city of visitors?'),
  coach(41, 'Alex Golesh', 'Auburn', 'SEC', 'Auburn / eastern Alabama', 'The tempo bet', { program: 8, capital: 9, players: 9, region: 9, fans: 9, facilities: 10, aura: 8 }, 'He brings offensive nerve and builder energy to a program where the surrounding capital, rivalry, and booster weather can outrun any plan.', 'Can he make the room move at one speed?'),
  coach(42, 'Pete Golding', 'Ole Miss', 'SEC', 'Oxford / North Mississippi', 'The continuity test', { program: 8, capital: 9, players: 9, region: 9, fans: 9, facilities: 9, aura: 8 }, 'He knows the roster, the league, and the internal machinery of the Kiffin era. Continuity is a real advantage if it grows a new voice.', 'Is he protecting a window or building the next house?'),
  coach(43, 'Dave Doeren', 'NC State', 'ACC', 'Raleigh / Research Triangle', 'The durable floor', { program: 8, capital: 8, players: 8, region: 9, fans: 9, facilities: 8, aura: 7 }, 'The program is physical, stable, and rarely fooled about what it is. That floor matters in a sport addicted to expensive reinvention.', 'Can durability produce one season that changes the program’s national category?'),
  coach(44, 'Bob Chesney', 'UCLA', 'Big Ten', 'Los Angeles / public flagship', 'The institutional rescue', { program: 8, capital: 7, players: 8, region: 8, fans: 7, facilities: 7, aura: 8 }, 'His résumé is a sequence of places becoming more serious. UCLA is a different scale of puzzle: public, diffuse, beautiful, financially pressured, and hungry for intimacy.', 'Can a builder create campus gravity for a stadium miles away?'),
  coach(45, 'Tony Elliott', 'Virginia', 'ACC', 'Charlottesville / Mid-Atlantic', 'The humane build', { program: 8, capital: 8, players: 8, region: 9, fans: 8, facilities: 8, aura: 8 }, 'He has carried grief, standards, and a complicated rebuild with unusual steadiness. The football case is now catching up to the human one.', 'Can patience become competitive momentum before the room asks for another reset?'),
  coach(46, 'Shane Beamer', 'South Carolina', 'SEC', 'Columbia / Carolinas', 'The emotional conductor', { program: 8, capital: 8, players: 8, region: 9, fans: 10, facilities: 9, aura: 9 }, 'He understands that South Carolina’s crowd is not background but resource. Special teams, emotion, and underdog electricity make the program dangerous.', 'Can emotional peaks become a week-to-week football floor?'),
  coach(47, 'Deion Sanders', 'Colorado', 'Big 12', 'Boulder / Front Range', 'The attention economy', { program: 7, capital: 9, players: 9, region: 8, fans: 9, facilities: 8, aura: 10 }, 'No coach has changed a program’s media value faster. The larger experiment is whether attention can finance durable player development and institutional memory.', 'What remains in the room when spectacle is no longer scarce?'),
  coach(48, 'Greg Schiano', 'Rutgers', 'Big Ten', 'New Jersey / New York corridor', 'The regional reclamation', { program: 8, capital: 8, players: 8, region: 10, fans: 8, facilities: 8, aura: 8 }, 'He knows the state’s high-school map, the program’s psychological history, and how to make physical competence feel like civic recovery.', 'Can Rutgers turn the nation’s largest nearby media market into actual college-football belonging?'),
  coach(49, 'Jason Candle', 'UConn', 'Independent', 'Storrs / New England', 'The northern restart', { program: 8, capital: 7, players: 8, region: 8, fans: 7, facilities: 8, aura: 7 }, 'A proven program operator enters a region with money, alumni reach, and no settled modern football identity. That ambiguity is a form of space.', 'Can UConn make independence feel intentional rather than residual?'),
  coach(50, 'Matt Entz', 'Fresno State', 'Pac-12', 'Central Valley / California', 'The valley machine', { program: 8, capital: 7, players: 8, region: 10, fans: 9, facilities: 7, aura: 8 }, 'His championship background meets a place with a strong player culture, a proud fan bargain, and a region that deserves to be treated as the center.', 'Can Fresno State carry its local certainty into a newly reshaped conference room?'),
];

export const COACHES_50_TIERS = [
  {
    id: 'proof',
    ranks: '01–10',
    title: 'Proof, power, and the new room',
    note: 'Champions, empire operators, and four elite coaches beginning again inside a different institution.',
  },
  {
    id: 'systems',
    ranks: '11–25',
    title: 'The system builders',
    note: 'The coaches whose best argument is the repeatable relationship among players, place, language, and work.',
  },
  {
    id: 'converters',
    ranks: '26–40',
    title: 'The advantage converters',
    note: 'Programs with a sharper idea than their market rank—and coaches who can turn a constraint into an identity.',
  },
  {
    id: 'live-wires',
    ranks: '41–50',
    title: 'Live wires and regional bets',
    note: 'New rooms, unfinished proofs, strong local ecologies, and people capable of moving much higher by October.',
  },
] as const;

export const COACHES_50_PLATES = [
  {
    id: '01',
    title: 'The Headset',
    caption: 'The film room before the institution wakes up.',
    image: '/images/pointcast-coaches-50/poster-01.webp',
  },
  {
    id: '02',
    title: 'The Capital Table',
    caption: 'A program can buy inputs. A coach still has to convert them.',
    image: '/images/pointcast-coaches-50/poster-02.webp',
  },
  {
    id: '03',
    title: 'The Player Room',
    caption: 'Trust is infrastructure, and the depth chart is where the claim gets audited.',
    image: '/images/pointcast-coaches-50/poster-03.webp',
  },
  {
    id: '04',
    title: 'The Region',
    caption: 'Geography recruits before the coach arrives and remembers after the coach leaves.',
    image: '/images/pointcast-coaches-50/poster-04.webp',
  },
  {
    id: '05',
    title: 'The Fans',
    caption: 'The crowd is capital, weather, jury, choir, and memory.',
    image: '/images/pointcast-coaches-50/poster-05.webp',
  },
  {
    id: '06',
    title: 'The Aura',
    caption: 'The thing everyone feels and no athletic department can order.',
    image: '/images/pointcast-coaches-50/poster-06.webp',
  },
] as const;

export const COACHES_50_SOURCES = [
  {
    label: 'CBS Sports · Power Four coach rankings entering 2026',
    url: 'https://www.cbssports.com/college-football/news/2026-college-football-coach-rankings-top-25-power-four/',
    role: 'A current comparison board for the Power Four field.',
  },
  {
    label: 'On3 · CBS ranking of all 68 Power Four coaches',
    url: 'https://www.on3.com/news/cbs-sports-ranks-all-68-power-four-head-coaches-ahead-of-2026-college-football-season/',
    role: 'Current 2026 assignments and a complete Power Four reference list.',
  },
  {
    label: 'On3 · Sporting News ranking of all 138 FBS coaches',
    url: 'https://www.on3.com/news/the-sporting-news-ranks-all-138-fbs-head-coaches-entering-2026-season/',
    role: 'A full-FBS reference that keeps Group of Six and independent programs visible.',
  },
  {
    label: 'Sporting News · Top 25 college football coaches for 2026',
    url: 'https://www.sportingnews.com/ca/ncaa-football/news/top-25-college-football-coach-rankings-2026/314ee39c8f5d899c17944f60',
    role: 'A second national opinion board and results check.',
  },
  {
    label: 'The Dodd Trophy · 2026 preseason watch list',
    url: 'https://chick-fil-apeachbowl.com/news/2026/7/9/the-dodd-trophy-presented-by-pnc-dodd-trophy-releases-2026-preseason-watch-list.aspx',
    role: 'A coach award lens that includes academics, graduation, community, and projected success.',
  },
  {
    label: 'NCAA · President Charlie Baker on the House settlement',
    url: 'https://www.ncaa.org/media-center-a-letter-from-ncaa-president-charlie-baker/',
    role: 'The direct-benefit and revenue-sharing context reshaping program capital.',
  },
  {
    label: 'NCAA · Finances of intercollegiate athletics',
    url: 'https://www.ncaa.org/what-we-do/finances/finances-of-intercollegiate-athletics/',
    role: 'A boundary against treating football revenue as simple institutional profit.',
  },
  {
    label: 'Knight-Newhouse College Athletics Database · Custom reports',
    url: 'https://www.knightnewhousedata.org/reports',
    role: 'Public reporting tools for football spending, coaching pay, facilities, debt, and institutional NIL.',
  },
  {
    label: 'Michigan · Kyle Whittingham named head football coach',
    url: 'https://mgoblue.com/news/2025/12/26/kyle-whittingham-named-michigans-j-ira-and-nicki-harris-family-head-football-coach',
    role: 'Primary confirmation of one of the 2026 season’s defining room changes.',
  },
  {
    label: 'Penn State · Matt Campbell named head football coach',
    url: 'https://gopsusports.com/news/2025/12/8/matt-campbell-named-head-football-coach',
    role: 'Primary confirmation and career record for Campbell’s new room.',
  },
  {
    label: 'Virginia Tech · James Franklin coaching profile',
    url: 'https://hokiesports.com/sports/football/roster/season/2026/staff/james-franklin',
    role: 'Primary confirmation and program-building record for Franklin at Virginia Tech.',
  },
  {
    label: 'LSU · Lane Kiffin coaching profile',
    url: 'https://lsusports.net/sports/fb/roster/season/2026/staff/lane-kiffin',
    role: 'Primary confirmation and coaching history for Kiffin at LSU.',
  },
  {
    label: 'College Football Playoff · 2026–27 format',
    url: 'https://collegefootballplayoff.com/news/2026/1/23/2627-format.aspx',
    role: 'The postseason structure every 2026 room is trying to reach.',
  },
] as const;

export const POINTCAST_COACHES_FEATURE = {
  spec: 'pointcast.college-football.coaches-50/v1',
  title: "THE COACHES' ROOM",
  subtitle: 'The PointCast 50 for 2026',
  dek: 'Fifty coaches. Seven rooms. One question: who can turn players, money, place, fans, facilities, and belief into a football program that holds?',
  publishedAt: '2026-07-29T12:14:00-07:00',
  updatedAt: '2026-07-29T12:14:00-07:00',
  asOf: '2026-07-29',
  byline: 'PointCast Editorial Desk',
  canonical: 'https://pointcast.xyz/25/magazine/coaches-50',
  machineEdition: 'https://pointcast.xyz/25/magazine/coaches-50.json',
  magazine: 'https://pointcast.xyz/25/magazine',
  block: '0541',
  socialImage: 'https://pointcast.xyz/images/pointcast-coaches-50/social-card.png',
  playlist: {
    title: "THE COACHES' ROOM — PointCast College Football 2026",
    provider: 'Spotify',
    tracks: 13,
    url: 'https://open.spotify.com/playlist/5HAh6Bu2OhiZxbDNAKbL6a',
    note: 'Dawn film, recruiting highway, practice heat, the tunnel, and the drive home.',
  },
  thesis:
    'A head coach is the most visible person in a system too large for one person to control. The honest ranking has to grade the coach and inspect the room.',
  methodology:
    'PointCast ranked current FBS head coaches editorially, then used seven 1–10 room scores as apertures rather than a formula. The order considers recent proof, multi-year program building, player development, resource conversion, institutional fit, and the specific stakes of the 2026 job. Ties and disagreements are the point: every card names the next question that can move it.',
  boundary:
    'This is a timestamped, unofficial editorial ranking—not an employment evaluation, audited financial analysis, player-welfare grade, prediction model, or official publication of any school, conference, coach, award, broadcaster, or governing body.',
} as const;

export const weightedRoomIndex = (scores: CoachScorecard) =>
  Math.round(
    COACH_AXIS_LABELS.reduce(
      (total, axis) => total + scores[axis.id] * axis.weight,
      0,
    ) / 10,
  );
