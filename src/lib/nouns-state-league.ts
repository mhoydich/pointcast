export type NounsStateTeam = {
  state: string;
  code: string;
  region: 'Atlantic' | 'Appalachian' | 'Great Lakes' | 'Gulf' | 'Heartland' | 'Mountain' | 'Pacific' | 'Prairie';
  team: string;
  short: string;
  colors: [string, string];
  nounSeed: number;
  motif: string;
  field: string;
  signatureMove: string;
  fanRitual: string;
  contribution: string;
};

export type NounsStateArtifactKind = {
  id: string;
  label: string;
  format: string;
  use: string;
};

export type NounsStateFoundingDrop = {
  code: string;
  dropName: string;
  headline: string;
  capsule: string;
  products: string[];
  watchHook: string;
  sponsorRead: string;
  agentTask: string;
};

export type NounsStateDropGallerySlot = {
  id: string;
  label: string;
  status: 'ready-to-generate' | 'needs-remix' | 'sponsor-candidate' | 'ready-to-publish';
  format: string;
  promptKind: string;
  proof: string;
  nextAction: string;
};

export type NounsStateManusArtifact = {
  id: string;
  state: string;
  code: string;
  team: string;
  short: string;
  modelLane: string;
  format: string;
  title: string;
  prompt: string;
  review: string;
  proof: string;
};

export type NounsStateAgencyPoster = {
  id: string;
  state: string;
  code: string;
  team: string;
  short: string;
  nounId: number;
  nounReference: string;
  agencyLane: string;
  campaignLine: string;
  headline: string;
  posterTitle: string;
  format: string;
  mediaPlan: string[];
  prompt: string;
  proof: string;
};

export type NounsStateNightMatchup = {
  id: string;
  left: NounsStateTeam;
  right: NounsStateTeam;
  headline: string;
  fieldLine: string;
  watchInvite: string;
  artifactPrompt: string;
  sponsorRead: string;
  agentTask: string;
};

export type NounsStateNightSlate = {
  region: NounsStateTeam['region'];
  title: string;
  headline: string;
  teams: NounsStateTeam[];
  matchups: NounsStateNightMatchup[];
  featured: NounsStateNightMatchup;
  hostRundown: string;
  watchInvite: string;
  artifactBundle: string;
  sponsorRead: string;
  agentTask: string;
  proofChecklist: string[];
  guardrail: string;
};

export const NOUNS_STATE_LEAGUE_VERSION = '0.1.0';

export const NOUNS_STATE_LEAGUE_TEAMS: NounsStateTeam[] = [
  { state: 'Alabama', code: 'AL', region: 'Gulf', team: 'Alabama Rocket Hammers', short: 'ALR', colors: ['#8a1538', '#f6d365'], nounSeed: 7, motif: 'Saturn V flame, crimson quilt blocks, pine sparks', field: 'Huntsville Launch Yard', signatureMove: 'Moonshot Bonk', fanRitual: 'Countdown clap from ten', contribution: 'Build launch posters, tailgate reads, and space-race lore cards.' },
  { state: 'Alaska', code: 'AK', region: 'Pacific', team: 'Alaska Aurora Yetis', short: 'AKY', colors: ['#112b46', '#7df9c6'], nounSeed: 18, motif: 'Aurora curtains, glacier blue, salmon-run stripes', field: 'Denali Night Field', signatureMove: 'Northern Lights Screen', fanRitual: 'Wave green lights after every heal', contribution: 'Create cold-open visuals, weather cards, and late-night TV loops.' },
  { state: 'Arizona', code: 'AZ', region: 'Mountain', team: 'Arizona Canyon Cacti', short: 'AZC', colors: ['#b33a3a', '#ffb347'], nounSeed: 23, motif: 'Saguaro armor, copper sun, canyon shadows', field: 'Sonoran Heat Bowl', signatureMove: 'Cactus Wall', fanRitual: 'Raise two fingers for desert guard', contribution: 'Design heat maps, rivalry signs, and dust-storm recap cards.' },
  { state: 'Arkansas', code: 'AR', region: 'Heartland', team: 'Arkansas Diamond Pickers', short: 'ARD', colors: ['#bf0d3e', '#e8e8e8'], nounSeed: 35, motif: 'Diamond glints, river bends, fiddle strings', field: 'Crater Claim Field', signatureMove: 'Gem Rush', fanRitual: 'Tap the table like a pickaxe', contribution: 'Collect fan chants, field gems, and music-bed suggestions.' },
  { state: 'California', code: 'CA', region: 'Pacific', team: 'California Golden Noggles', short: 'CAG', colors: ['#f6bd16', '#1c5d99'], nounSeed: 42, motif: 'Golden poppy, surf glass, redwood pixels', field: 'Poppy Coast Coliseum', signatureMove: 'Pacific Breakaway', fanRitual: 'Sunset wave during specials', contribution: 'Make creator clips, venue watch kits, and sponsor-ready beach posters.' },
  { state: 'Colorado', code: 'CO', region: 'Mountain', team: 'Colorado Summit Frames', short: 'COS', colors: ['#244c9a', '#f7c948'], nounSeed: 51, motif: 'Fourteener peaks, ski-goggle shine, alpine lightning', field: 'Mile High Ridge', signatureMove: 'Thin Air Dash', fanRitual: 'Hold breath on overtime', contribution: 'Produce altitude stats, trail badges, and mountain broadcast bumpers.' },
  { state: 'Connecticut', code: 'CT', region: 'Atlantic', team: 'Connecticut Charter Whales', short: 'CTW', colors: ['#1f4e79', '#9ed0ff'], nounSeed: 63, motif: 'Charter oak, brass buttons, whale-tail flags', field: 'Harbor Charter Court', signatureMove: 'Oak Clause Rally', fanRitual: 'Knock twice for the charter', contribution: 'Write rule explainers, heritage cards, and courtroom-style recaps.' },
  { state: 'Delaware', code: 'DE', region: 'Atlantic', team: 'Delaware First State Sprinters', short: 'DEF', colors: ['#76a9d6', '#f4c95d'], nounSeed: 70, motif: 'First-state sash, bay foam, tiny racing shields', field: 'First Flag Flat', signatureMove: 'Ratify Rush', fanRitual: 'First clap gets the chant', contribution: 'Maintain first-to-post announcements and quick-start social cards.' },
  { state: 'Florida', code: 'FL', region: 'Gulf', team: 'Florida Neon Manatees', short: 'FLM', colors: ['#ff6f61', '#00a6a6'], nounSeed: 88, motif: 'Neon reef, orange blossom, swamp-glow noggles', field: 'Everglades Glow Dome', signatureMove: 'Mangrove Drift', fanRitual: 'Slow clap until the sudden sprint', contribution: 'Make tropical sponsor reads, short-form clips, and watch-party menus.' },
  { state: 'Georgia', code: 'GA', region: 'Atlantic', team: 'Georgia Peach Prophets', short: 'GAP', colors: ['#f78da7', '#2f5233'], nounSeed: 94, motif: 'Peach fuzz, red clay, porch-light halos', field: 'Red Clay Orchard', signatureMove: 'Porch Swing Screen', fanRitual: 'Peach chant after captain calls', contribution: 'Write hospitality copy, rivalry meals, and post-match porch recaps.' },
  { state: 'Hawaii', code: 'HI', region: 'Pacific', team: 'Hawaii Lava Shakas', short: 'HIL', colors: ['#ff5a36', '#00bcd4'], nounSeed: 101, motif: 'Volcanic glass, hibiscus pixels, wave crests', field: 'Big Island Flow Field', signatureMove: 'Shaka Surge', fanRitual: 'Throw shaka on every heal', contribution: 'Build island field skins, aloha intros, and surf-report match cards.' },
  { state: 'Idaho', code: 'ID', region: 'Mountain', team: 'Idaho Tater Miners', short: 'IDT', colors: ['#7b4f2c', '#f6e7b4'], nounSeed: 117, motif: 'Basalt rows, potato moons, sawtooth ridges', field: 'Sawtooth Root Cellar', signatureMove: 'Spud Guard', fanRitual: 'Root chant for the root crop', contribution: 'Create farm reports, wholesome chants, and harvest-season standings.' },
  { state: 'Illinois', code: 'IL', region: 'Great Lakes', team: 'Illinois Windy Pizzas', short: 'ILW', colors: ['#0f4c81', '#d71920'], nounSeed: 126, motif: 'Deep-dish shields, lake wind, rail sparks', field: 'Lakefront Wind Tunnel', signatureMove: 'Deep Dish Stack', fanRitual: 'Spin napkins on center control', contribution: 'Host city desk reads, transit maps, and pizza-box playoff brackets.' },
  { state: 'Indiana', code: 'IN', region: 'Great Lakes', team: 'Indiana Checkered Pacers', short: 'INC', colors: ['#002d62', '#fdbb30'], nounSeed: 134, motif: 'Checkered flags, corn-gold lanes, gym-floor shine', field: 'Brickyard Hardwood', signatureMove: 'Lap 500 Haste', fanRitual: 'Wave checkers on rush speed', contribution: 'Build race clocks, Hoosier gym posters, and lap-by-lap recaps.' },
  { state: 'Iowa', code: 'IA', region: 'Prairie', team: 'Iowa Corn Signalers', short: 'IAC', colors: ['#f5c542', '#2c7a3f'], nounSeed: 142, motif: 'Corn rows, caucus cards, radio tower blips', field: 'Tall Corn Signal Field', signatureMove: 'Silo Broadcast', fanRitual: 'Call-and-response from both rows', contribution: 'Run poll cards, rural radio reads, and county-by-county rooting maps.' },
  { state: 'Kansas', code: 'KS', region: 'Prairie', team: 'Kansas Tornado Wizards', short: 'KST', colors: ['#6b4ea0', '#f2d16b'], nounSeed: 155, motif: 'Cyclone curls, wheat-gold capes, ruby pixel shoes', field: 'Wheatstorm Spiral', signatureMove: 'Twister Rotate', fanRitual: 'Rotate seats after every comeback', contribution: 'Create storm alerts, bracket maps, and yellow-brick road storylines.' },
  { state: 'Kentucky', code: 'KY', region: 'Appalachian', team: 'Kentucky Bluegrass Jockeys', short: 'KYB', colors: ['#0033a0', '#74b72e'], nounSeed: 166, motif: 'Bluegrass, derby silks, bourbon-barrel rings', field: 'Derby Grass Track', signatureMove: 'Final Furlong Rally', fanRitual: 'Two taps then a stretch-run yell', contribution: 'Make derby cards, race calls, and barrel-aged sponsor concepts.' },
  { state: 'Louisiana', code: 'LA', region: 'Gulf', team: 'Louisiana Brass Gators', short: 'LAG', colors: ['#552583', '#fdb927'], nounSeed: 177, motif: 'Brass horns, bayou ripples, gator-scale armor', field: 'Bayou Brass Bowl', signatureMove: 'Second Line Surge', fanRitual: 'Horn line after KOs', contribution: 'Score soundtrack drops, parade posters, and gumbo-watch party guides.' },
  { state: 'Maine', code: 'ME', region: 'Atlantic', team: 'Maine Lighthouse Lobsters', short: 'MEL', colors: ['#d71920', '#003f5c'], nounSeed: 188, motif: 'Lighthouse beams, lobster claws, pine fog', field: 'Acadia Beacon Field', signatureMove: 'Foghorn Guard', fanRitual: 'Flash lights on replay cues', contribution: 'Make coastal watch frames, lighthouse intros, and seafood slate cards.' },
  { state: 'Maryland', code: 'MD', region: 'Atlantic', team: 'Maryland Crab Shields', short: 'MDC', colors: ['#eaaa00', '#c8102e'], nounSeed: 199, motif: 'Flag checks, crab claws, harbor armor', field: 'Chesapeake Check Field', signatureMove: 'Old Bay Pinch', fanRitual: 'Crab-claw hand signs on guard', contribution: 'Design flag-heavy lower thirds, crab feast invites, and rivalry pins.' },
  { state: 'Massachusetts', code: 'MA', region: 'Atlantic', team: 'Massachusetts Minute Nouns', short: 'MAM', colors: ['#002855', '#b31b1b'], nounSeed: 205, motif: 'Lanterns, codfish silver, brick campus marks', field: 'Commonwealth Lantern Yard', signatureMove: 'Midnight Ride Dash', fanRitual: 'One if by land, two if by field', contribution: 'Write lore-dense recaps, school rivalry cards, and history desk reads.' },
  { state: 'Michigan', code: 'MI', region: 'Great Lakes', team: 'Michigan Great Lake Mechs', short: 'MIG', colors: ['#00274c', '#ffcb05'], nounSeed: 217, motif: 'Mitten map, auto bolts, freshwater chrome', field: 'Motor Lake Foundry', signatureMove: 'Assembly Line Push', fanRitual: 'Mitten wave left to right', contribution: 'Build factory stat strips, lake-effect reports, and maker bounties.' },
  { state: 'Minnesota', code: 'MN', region: 'Great Lakes', team: 'Minnesota North Star Loons', short: 'MNL', colors: ['#4f2683', '#7ac143'], nounSeed: 222, motif: 'North Star, loon calls, ice-lake pixels', field: 'Twin Lake Icehouse', signatureMove: 'Loon Echo Heal', fanRitual: 'Call back the loon after heals', contribution: 'Make winter watch kits, lake-cabin recaps, and kindness chants.' },
  { state: 'Mississippi', code: 'MS', region: 'Gulf', team: 'Mississippi Delta Blues', short: 'MSD', colors: ['#003087', '#d01c1f'], nounSeed: 234, motif: 'Delta strings, river silt, magnolia white', field: 'Delta Juke Field', signatureMove: 'Twelve-Bar Break', fanRitual: 'Stomp the beat after specials', contribution: 'Write blues calls, river maps, and porch-stage match posters.' },
  { state: 'Missouri', code: 'MO', region: 'Heartland', team: 'Missouri Arch Mules', short: 'MOA', colors: ['#0057b8', '#c0c0c0'], nounSeed: 246, motif: 'Gateway arch, mule kicks, river junctions', field: 'Gateway River Arch', signatureMove: 'Archway Counter', fanRitual: 'Make an arch with arms on counters', contribution: 'Create gateway explainers, BBQ watch cards, and river rivalry grids.' },
  { state: 'Montana', code: 'MT', region: 'Mountain', team: 'Montana Big Sky Bison', short: 'MTB', colors: ['#5e503f', '#87ceeb'], nounSeed: 258, motif: 'Big sky gradients, bison shoulders, copper stars', field: 'Big Sky Range', signatureMove: 'Bison Line Charge', fanRitual: 'Low rumble before rushes', contribution: 'Make wide-screen TV cards, ranger reports, and open-range posters.' },
  { state: 'Nebraska', code: 'NE', region: 'Prairie', team: 'Nebraska Prairie Balloons', short: 'NEP', colors: ['#d00000', '#f5f5dc'], nounSeed: 270, motif: 'Sandhill cranes, prairie balloons, corn-red stripes', field: 'Sandhill Airfield', signatureMove: 'Crane Lift', fanRitual: 'Lift hands on every save', contribution: 'Produce crane migration graphics, small-town slates, and fairground watch plans.' },
  { state: 'Nevada', code: 'NV', region: 'Mountain', team: 'Nevada Neon Jackpots', short: 'NVJ', colors: ['#2c2a4a', '#ff2e88'], nounSeed: 282, motif: 'Neon dice, desert chrome, silver-state shine', field: 'Neon Basin Casino', signatureMove: 'Jackpot Special', fanRitual: 'Count chips on specials', contribution: 'Make odds-free neon graphics, night-match teasers, and spectacle cards.' },
  { state: 'New Hampshire', code: 'NH', region: 'Atlantic', team: 'New Hampshire Granite Yetis', short: 'NHG', colors: ['#1d4f91', '#b7c9d9'], nounSeed: 294, motif: 'Granite cliffs, maple smoke, ski-lift lines', field: 'White Mountain Granite', signatureMove: 'Live Free Freeze', fanRitual: 'Freeze pose after stuns', contribution: 'Write mountain recaps, town hall prompts, and maple-season fixtures.' },
  { state: 'New Jersey', code: 'NJ', region: 'Atlantic', team: 'New Jersey Turnpike Tomatoes', short: 'NJT', colors: ['#006747', '#ff4f58'], nounSeed: 306, motif: 'Turnpike signs, diner chrome, tomato-red shields', field: 'Garden State Overpass', signatureMove: 'Jughandle Juke', fanRitual: 'Point left before going right', contribution: 'Make diner menus, exit-number watch maps, and rivalry banter cards.' },
  { state: 'New Mexico', code: 'NM', region: 'Mountain', team: 'New Mexico Chili Comets', short: 'NMC', colors: ['#c8102e', '#ffd100'], nounSeed: 318, motif: 'Chile ristras, Zia sun, desert comets', field: 'Zia Sun Yard', signatureMove: 'Red-or-Green Burst', fanRitual: 'Choose red or green before kickoff', contribution: 'Create chile choice polls, desert science cards, and art-market posters.' },
  { state: 'New York', code: 'NY', region: 'Atlantic', team: 'New York Empire Bagels', short: 'NYE', colors: ['#0038a8', '#ff6319'], nounSeed: 324, motif: 'Subway tiles, skyline crowns, bagel rings', field: 'Empire Street Court', signatureMove: 'Five Borough Press', fanRitual: 'Borough roll call at halftime', contribution: 'Run borough watch parties, subway line graphics, and late-night recaps.' },
  { state: 'North Carolina', code: 'NC', region: 'Atlantic', team: 'North Carolina Tar Heel Flyers', short: 'NCF', colors: ['#4b9cd3', '#13294b'], nounSeed: 336, motif: 'Flight wings, pine tar, lighthouse blue', field: 'First Flight Field', signatureMove: 'Outer Banks Lift', fanRitual: 'Paper airplane toss after wins', contribution: 'Make flight logs, campus rivalry cards, and coastal watch kits.' },
  { state: 'North Dakota', code: 'ND', region: 'Prairie', team: 'North Dakota Prairie Satellites', short: 'NDS', colors: ['#0a3d2e', '#f2c14e'], nounSeed: 348, motif: 'Badlands bands, wheat satellites, northern radar', field: 'Badlands Signal Plain', signatureMove: 'Radar Lock', fanRitual: 'Sweep arms like radar', contribution: 'Create signal maps, oilfield-vs-prairie stories, and quiet-power scouting.' },
  { state: 'Ohio', code: 'OH', region: 'Great Lakes', team: 'Ohio Buckeye Builders', short: 'OHB', colors: ['#bb0000', '#666666'], nounSeed: 360, motif: 'Buckeye stickers, river steel, astronaut patches', field: 'Buckeye Steel Yard', signatureMove: 'Script N Block', fanRitual: 'Dot the i after final KOs', contribution: 'Make builder cards, steel-town hype reels, and space-state facts.' },
  { state: 'Oklahoma', code: 'OK', region: 'Prairie', team: 'Oklahoma Red Dirt Riders', short: 'OKR', colors: ['#a23e2a', '#00a3a3'], nounSeed: 372, motif: 'Red dirt, bison shields, storm-sky turquoise', field: 'Red Dirt Rodeo', signatureMove: 'Sooner Sweep', fanRitual: 'Boot stomp on rush mode', contribution: 'Build rodeo cards, storm desk reads, and red-dirt music prompts.' },
  { state: 'Oregon', code: 'OR', region: 'Pacific', team: 'Oregon Moss Beavers', short: 'ORM', colors: ['#154734', '#ffb500'], nounSeed: 384, motif: 'Moss, beaver teeth, rain-shell pixels', field: 'Cascadia Rain Mill', signatureMove: 'Dam Builder Guard', fanRitual: 'Rain patter clap', contribution: 'Make rain overlays, forest zines, and co-op builder challenges.' },
  { state: 'Pennsylvania', code: 'PA', region: 'Appalachian', team: 'Pennsylvania Keystone Bells', short: 'PAK', colors: ['#1f4e79', '#f2c94c'], nounSeed: 396, motif: 'Keystone plates, liberty bells, coal sparks', field: 'Keystone Bellworks', signatureMove: 'Bellringer Rally', fanRitual: 'Ring once on captain calls', contribution: 'Write city-vs-city rivalry scripts, bell cues, and maker-history cards.' },
  { state: 'Rhode Island', code: 'RI', region: 'Atlantic', team: 'Rhode Island Anchor Minis', short: 'RIA', colors: ['#003a70', '#f5d04c'], nounSeed: 408, motif: 'Tiny anchor, ocean state waves, clam-shack signs', field: 'Narragansett Mini Dock', signatureMove: 'Anchor Drop', fanRitual: 'Tiny chant, huge volume', contribution: 'Make compact mobile cards, dockside invites, and small-state power rankings.' },
  { state: 'South Carolina', code: 'SC', region: 'Atlantic', team: 'South Carolina Palmetto Moons', short: 'SCP', colors: ['#003c5f', '#ffffff'], nounSeed: 420, motif: 'Palmetto moon, sea-island indigo, porch fans', field: 'Palmetto Moon Yard', signatureMove: 'Lowcountry Tide', fanRitual: 'Moon clap in two beats', contribution: 'Create lowcountry menus, coastal field notes, and porch-watch scripts.' },
  { state: 'South Dakota', code: 'SD', region: 'Prairie', team: 'South Dakota Monument Thunder', short: 'SDT', colors: ['#3d5a80', '#f4d35e'], nounSeed: 432, motif: 'Granite profiles, prairie thunder, buffalo tracks', field: 'Black Hills Monument', signatureMove: 'Stoneface Stand', fanRitual: 'Stand still on defense wins', contribution: 'Make monument graphics, road-trip schedules, and plains thunder bumpers.' },
  { state: 'Tennessee', code: 'TN', region: 'Appalachian', team: 'Tennessee Volunteer Vinyl', short: 'TNV', colors: ['#ff8200', '#4b2e83'], nounSeed: 444, motif: 'Vinyl grooves, volunteer stars, smoky mountain haze', field: 'Music Row Mountain', signatureMove: 'Volunteer Chorus', fanRitual: 'Sing the special back', contribution: 'Score walk-up songs, smoky posters, and music-city recap cuts.' },
  { state: 'Texas', code: 'TX', region: 'Gulf', team: 'Texas Lone Star Longhorns', short: 'TXL', colors: ['#bf5700', '#002868'], nounSeed: 456, motif: 'Longhorn horns, lone stars, oilfield lights', field: 'Lone Star Megafield', signatureMove: 'Big Bend Stampede', fanRitual: 'Horns up on center control', contribution: 'Run megacast rooms, rivalry maps, sponsor reads, and state-sized brackets.' },
  { state: 'Utah', code: 'UT', region: 'Mountain', team: 'Utah Arch Runners', short: 'UTA', colors: ['#c2410c', '#4f8a8b'], nounSeed: 468, motif: 'Red rock arches, salt flats, beehive marks', field: 'Arches Salt Circuit', signatureMove: 'Bonneville Burst', fanRitual: 'Trace an arch before kickoff', contribution: 'Create speed-trial clips, red-rock posters, and hive-work task boards.' },
  { state: 'Vermont', code: 'VT', region: 'Atlantic', team: 'Vermont Maple Mounts', short: 'VTM', colors: ['#2f6b3f', '#c47f2c'], nounSeed: 480, motif: 'Maple leaves, covered bridges, ski wax', field: 'Green Mountain Sugarhouse', signatureMove: 'Maple Slow Drip', fanRitual: 'Slow clap until the syrup surge', contribution: 'Make cozy recaps, maple sponsor concepts, and winter schedule cards.' },
  { state: 'Virginia', code: 'VA', region: 'Atlantic', team: 'Virginia Cavalier Cardinals', short: 'VAC', colors: ['#861f41', '#e57200'], nounSeed: 492, motif: 'Cardinal wings, colonial brick, blue-ridge ribbons', field: 'Blue Ridge Commonwealth', signatureMove: 'Cavalier Cutback', fanRitual: 'Bow then charge', contribution: 'Write commonwealth lore, campus cards, and ridge-to-tidewater rivalries.' },
  { state: 'Washington', code: 'WA', region: 'Pacific', team: 'Washington Rainier Coders', short: 'WAR', colors: ['#2c5234', '#8ed1fc'], nounSeed: 504, motif: 'Rainier snow, evergreen code rain, ferry lights', field: 'Puget Code Rain', signatureMove: 'Evergreen Compile', fanRitual: 'Refresh chant on every replay', contribution: 'Build agent tools, ferry-watch maps, and rainforest visual systems.' },
  { state: 'West Virginia', code: 'WV', region: 'Appalachian', team: 'West Virginia Mountain Moths', short: 'WVM', colors: ['#002855', '#eaaa00'], nounSeed: 516, motif: 'Mothman eyes, coal seams, mountain roads', field: 'Appalachian Signal Mine', signatureMove: 'Mothlight Ambush', fanRitual: 'Lights out before surprise specials', contribution: 'Make cryptid cards, mountain radio reads, and coal-to-code lore.' },
  { state: 'Wisconsin', code: 'WI', region: 'Great Lakes', team: 'Wisconsin Cheese Curds', short: 'WIC', colors: ['#ffb81c', '#0b6623'], nounSeed: 528, motif: 'Cheese hats, lake ice, supper-club neon', field: 'Dairyland Ice Rink', signatureMove: 'Curd Cluster', fanRitual: 'Hat tilt after heals', contribution: 'Create supper-club watch kits, dairy stats, and frozen-field recaps.' },
  { state: 'Wyoming', code: 'WY', region: 'Mountain', team: 'Wyoming High Plains Broncos', short: 'WYB', colors: ['#492f24', '#ffc425'], nounSeed: 540, motif: 'Bronco silhouettes, geyser steam, high-plains gold', field: 'Yellowstone Range Gate', signatureMove: 'Geyser Kick', fanRitual: 'Stamp once before the burst', contribution: 'Make open-range cards, geyser countdowns, and frontier scouting briefs.' },
];

export const NOUNS_STATE_LEAGUE_REGIONS = [
  'Atlantic',
  'Appalachian',
  'Great Lakes',
  'Gulf',
  'Heartland',
  'Mountain',
  'Pacific',
  'Prairie',
] as const;

export const NOUNS_STATE_LEAGUE_PARTICIPATION = [
  {
    lane: 'Watch',
    ask: 'Pick a state team, open the desk or TV cast, and send one watch hook with the team short code.',
  },
  {
    lane: 'Root',
    ask: 'Claim local fan identity: state, Noun number, battle cry, and one rivalry you want scheduled.',
  },
  {
    lane: 'Create',
    ask: 'Make a poster, state intro, mascot variant, field texture, walk-up line, or recap card.',
  },
  {
    lane: 'Host',
    ask: 'Run a regional slate: Atlantic night, Mountain rush, Great Lakes derby, Gulf heat, or Pacific late cast.',
  },
  {
    lane: 'Agent',
    ask: 'Choose a state, audit its team kit, generate three broadcast calls, and propose one accepted-work proof.',
  },
  {
    lane: 'Sponsor',
    ask: 'Reserve a no-money-yet field naming, state read, poster drop, or playoff-bowl moment for human approval.',
  },
];

export const NOUNS_STATE_LEAGUE_FORMAT = {
  name: 'Nouns United States Union League',
  teams: 50,
  format: '50 state teams, eight regional divisions, rotating regional slates, Union Cup playoffs, and a Nouns Bowl of the States.',
  seasonBeats: ['State Kit Reveal', 'Regional Weeks', 'Rivalry Road Trips', 'Union Cup', 'Nouns Bowl of the States'],
  watchModes: ['state atlas page', 'Battle Desk', 'TV Cast', 'Mobile Cast', 'Desk Wall snapshots', 'Agent Bench tasks'],
};

export const NOUNS_STATE_NIGHT_GUARDRAIL =
  'Fictional Nouns sports broadcast only: no official sports marks, no live-result claim, no betting, no checkout, no promised payout, and human approval before publishing sponsor or participant-credit work.';

export const NOUNS_STATE_ARTIFACT_KINDS: NounsStateArtifactKind[] = [
  {
    id: 'hero-poster',
    label: 'Hero Poster',
    format: 'vertical 4:5 poster',
    use: 'state team reveal, social post, venue print, and season atlas card',
  },
  {
    id: 'square-ad',
    label: 'Square Ad',
    format: '1:1 social ad',
    use: 'watch-party invite, paid social test, and sponsor-safe promo creative',
  },
  {
    id: 'product-drop',
    label: 'Product Drop',
    format: 'editorial product mockup',
    use: 'shirt, cap, sticker pack, enamel pin, trading card, or drink-label concept',
  },
  {
    id: 'broadcast-card',
    label: 'Broadcast Card',
    format: '16:9 TV card',
    use: 'pre-game slate, lower-third background, replay sting, or desk wall still',
  },
  {
    id: 'fan-ritual',
    label: 'Fan Ritual Art',
    format: 'cinematic ritual frame',
    use: 'community prompt, match intro, chant card, or watch-room screen',
  },
  {
    id: 'agent-brief',
    label: 'Agent Brief',
    format: 'copyable creative task',
    use: 'Claude, ChatGPT, Codex, or visiting agent handoff for one accepted artifact',
  },
];

export const NOUNS_STATE_FOUNDING_DROPS: NounsStateFoundingDrop[] = [
  {
    code: 'CA',
    dropName: 'Poppy Coast Opening Set',
    headline: 'Golden Noggles take the sunset lane.',
    capsule: 'A coastal launch kit with poppy field posters, surf-glass broadcast cards, and beach-watch sponsor inventory.',
    products: ['poppy coast match poster', 'sunset noggles tee', 'redwood sticker sheet'],
    watchHook: 'Best watched as a late Pacific slate with mobile invites and a TV Cast warm open.',
    sponsorRead: 'Presented by a local maker who wants the cleanest sunset read on the slate.',
    agentTask: 'Generate a 4:5 poster, 1:1 watch ad, and 16:9 TV card for the California Golden Noggles.',
  },
  {
    code: 'NY',
    dropName: 'Five Borough Night Card',
    headline: 'Empire Bagels press the whole city.',
    capsule: 'A loud borough-roll-call set with subway tile typography, skyline crown cards, and late-night recap prompts.',
    products: ['bagel ring trading card', 'subway tile lower third', 'borough roll-call poster'],
    watchHook: 'Run this as a prime-time city desk with a halftime borough chant.',
    sponsorRead: 'Reserved for a diner, studio, or local crew backing the city-night matchup.',
    agentTask: 'Build a city-night prompt pack with one poster, one recap card, and one sponsor-safe read.',
  },
  {
    code: 'TX',
    dropName: 'Lone Star Megafield Kit',
    headline: 'Longhorns turn the bracket into a state-sized show.',
    capsule: 'A maximal TV package with megafield cards, oilfield-light product boards, and rivalry map prompts.',
    products: ['megafield broadcast slate', 'longhorn cap concept', 'rivalry map poster'],
    watchHook: 'Best for a huge regional night with loud lower thirds and sponsor bumpers.',
    sponsorRead: 'A reservation-only read for the biggest field-naming burst in the Union Cup.',
    agentTask: 'Create a Texas-sized campaign pack with poster, merch concept, and field naming proof checklist.',
  },
  {
    code: 'LA',
    dropName: 'Bayou Brass Parade Pack',
    headline: 'Brass Gators bring the second line to center field.',
    capsule: 'A music-led launch pack with parade posters, horn-line replay cards, and product concepts with bayou gold.',
    products: ['second-line poster', 'brass gator pin set', 'bayou bowl TV bumper'],
    watchHook: 'Queue it when the room needs sound, motion, and a watch-party menu.',
    sponsorRead: 'Backed by a kitchen, venue, or record-shop read with no payment flow attached.',
    agentTask: 'Generate parade-heavy visuals and a 30-second host read for the Louisiana Brass Gators.',
  },
  {
    code: 'AK',
    dropName: 'Denali Night Signal',
    headline: 'Aurora Yetis turn heals into green light.',
    capsule: 'A late-night cold-open kit with aurora posters, glacier product boards, and weather-card prompts.',
    products: ['aurora match poster', 'glacier sticker strip', 'Denali night TV card'],
    watchHook: 'Perfect for overnight TV mode or a quiet ambient watch room.',
    sponsorRead: 'A cold-open reservation for a maker funding late-night field visuals.',
    agentTask: 'Create an aurora cold-open prompt pack with weather copy and proof notes.',
  },
  {
    code: 'WV',
    dropName: 'Mothlight Ambush File',
    headline: 'Mountain Moths disappear, then the field blinks.',
    capsule: 'A cryptid-flavored artifact set with radio reads, surprise-special cards, and dark-field poster prompts.',
    products: ['mothlight poster', 'signal mine patch', 'cryptid recap card'],
    watchHook: 'Use for upset nights, fog fields, and spooky watch-room interstitials.',
    sponsorRead: 'A reservation-only mountain radio read for a cryptid-safe field moment.',
    agentTask: 'Generate one dark-field poster, one radio read, and one proof card for accepted cryptid art.',
  },
  {
    code: 'FL',
    dropName: 'Everglades Glow Sheet',
    headline: 'Neon Manatees drift slow, then sprint bright.',
    capsule: 'A tropical promo kit with reef-neon ads, glow-dome broadcast cards, and sponsor-ready watch menus.',
    products: ['neon reef ad', 'mangrove drink-label concept', 'glow dome lower third'],
    watchHook: 'Built for mobile sharing, tropical match invites, and short-form clips.',
    sponsorRead: 'A clean tropical sponsor read for a reservation-only watch-party package.',
    agentTask: 'Create a mobile-first Florida ad, product label, and watch-party receipt.',
  },
  {
    code: 'WA',
    dropName: 'Rainier Code Rain Board',
    headline: 'Rainier Coders compile the evergreen rush.',
    capsule: 'A builder-friendly launch pack with code-rain broadcast cards, ferry-watch maps, and agent tool prompts.',
    products: ['code rain TV card', 'evergreen sticker pack', 'ferry-watch poster'],
    watchHook: 'Run as the agent-builder slate with coding tasks and rainforest visuals.',
    sponsorRead: 'A sponsor-safe maker read for accepted tools, QA, and broadcast overlays.',
    agentTask: 'Generate a builder artifact pack with poster, tool brief, and route-audit proof checklist.',
  },
];

export const NOUNS_STATE_DROP_GALLERY_SLOTS: NounsStateDropGallerySlot[] = [
  {
    id: 'hero-wall',
    label: 'Hero Wall',
    status: 'ready-to-generate',
    format: '4:5 poster plus square crop',
    promptKind: 'hero-poster',
    proof: 'generated image, prompt text, reviewer note, and state-team tag',
    nextAction: 'Generate the main poster, then pick one mobile crop for the state atlas.',
  },
  {
    id: 'product-table',
    label: 'Product Table',
    status: 'sponsor-candidate',
    format: 'product-board concept',
    promptKind: 'product-drop',
    proof: 'mockup image, three product names, and reservation-only sponsor read',
    nextAction: 'Turn the products into a sponsor-safe inventory card for human approval.',
  },
  {
    id: 'broadcast-still',
    label: 'Broadcast Still',
    status: 'ready-to-publish',
    format: '16:9 TV card',
    promptKind: 'broadcast-card',
    proof: 'TV still, lower-third safe zone, and watch-room URL',
    nextAction: 'Ship one pregame card into the TV Cast and mobile invite copy.',
  },
  {
    id: 'ritual-remix',
    label: 'Ritual Remix',
    status: 'needs-remix',
    format: 'fan ritual frame',
    promptKind: 'fan-ritual',
    proof: 'ritual image, chant line, accessibility note, and remix reason',
    nextAction: 'Ask a creative agent for one weirder but still readable fan ceremony.',
  },
];

export function buildNounsStateArtifactPrompt(team: NounsStateTeam, kindId = 'hero-poster') {
  const kind = NOUNS_STATE_ARTIFACT_KINDS.find((item) => item.id === kindId) ?? NOUNS_STATE_ARTIFACT_KINDS[0];
  const sharedDirection = [
    `Create a ${kind.format} for the ${team.team}, the ${team.state} team in the Nouns Nation Union League.`,
    `Use Nouns-inspired pixel attitude, chunky noggles, playful sports-broadcast energy, and no official sports league marks.`,
    `Team colors: ${team.colors[0]} and ${team.colors[1]}.`,
    `Local motif: ${team.motif}.`,
    `Home field: ${team.field}.`,
    `Signature move: ${team.signatureMove}.`,
    `Fan ritual: ${team.fanRitual}.`,
    `Make it feel state-specific, collectible, clean, and broadcast-ready.`,
  ];

  const kindDirection: Record<string, string> = {
    'hero-poster': 'Prioritize bold type, one central Noun athlete, state-shaped graphic rhythm, and a clear team-name lockup.',
    'square-ad': 'Prioritize immediate readability on mobile, short headline, big team code, and a watch-now composition.',
    'product-drop': 'Show three product concepts in one editorial product-board scene: wearable, sticker/card, and small sponsor object.',
    'broadcast-card': 'Frame it like a premium pre-game TV slate with empty safe zones for scorebug, matchup, and live ticker.',
    'fan-ritual': 'Depict fans performing the ritual as a surreal local sports ceremony around the field.',
    'agent-brief': 'Return a practical creative brief with deliverable, acceptance criteria, proof requirements, and one remix idea.',
  };

  return `${sharedDirection.join(' ')} ${kindDirection[kind.id] ?? kindDirection['hero-poster']}`;
}

export function buildNounsStateNightSlate(region: NounsStateTeam['region'] = 'Pacific'): NounsStateNightSlate {
  const teams = NOUNS_STATE_LEAGUE_TEAMS.filter((team) => team.region === region);
  const slateTeams = teams.length >= 6
    ? teams.slice(0, 6)
    : [...teams, ...NOUNS_STATE_LEAGUE_TEAMS.filter((team) => team.region !== region)].slice(0, 6);
  const pairs = [[0, 1], [2, 3], [4, 5]];
  const matchups = pairs.map(([leftIndex, rightIndex], index) => {
    const left = slateTeams[leftIndex];
    const right = slateTeams[rightIndex];
    const headline = `${left.short} vs ${right.short}: ${left.motif.split(',')[0]} meets ${right.motif.split(',')[0]}.`;
    const fieldLine = `${left.field} road feed into ${right.field}`;
    const watchInvite = [
      `NOUNS UNION STATE NIGHT / ${region.toUpperCase()}`,
      `${left.team} vs ${right.team}`,
      `Field line: ${fieldLine}.`,
      `Watch: https://pointcast.xyz/nouns-nation-battler-tv/`,
      NOUNS_STATE_NIGHT_GUARDRAIL,
    ].join('\n');
    const artifactPrompt = [
      `Create a State Night matchup poster for ${left.team} vs ${right.team}.`,
      `Use original Nouns-style sports art, chunky noggles, clean matchup type, and no official sports marks.`,
      `Blend ${left.state} motif "${left.motif}" with ${right.state} motif "${right.motif}".`,
      `Include field cues: ${fieldLine}.`,
      `Make it readable as a TV pregame card and a mobile invite.`,
    ].join(' ');
    const sponsorRead = [
      `Reservation-only sponsor read for ${left.short} vs ${right.short}:`,
      `Tonight's fictional Nouns Union State Night is presented by a local maker backing ${region} creative work.`,
      `No checkout, no odds, no official relationship; human approval required before any sponsor placement.`,
    ].join(' ');
    const agentTask = [
      `Agent task ${index + 1}: produce one watch hook, one poster prompt, one sponsor-safe read, and one proof checklist for ${left.team} vs ${right.team}.`,
      `Mention ${left.fanRitual}, ${right.fanRitual}, ${left.signatureMove}, and ${right.signatureMove}.`,
      'Return only human-reviewable copy and proof notes.',
    ].join(' ');

    return {
      id: `${left.code.toLowerCase()}-${right.code.toLowerCase()}-state-night`,
      left,
      right,
      headline,
      fieldLine,
      watchInvite,
      artifactPrompt,
      sponsorRead,
      agentTask,
    };
  });
  const featured = matchups[0];
  const title = `${region} State Night`;
  const headline = `${featured.left.short} and ${featured.right.short} headline a ${region} Union slate.`;
  const proofChecklist = [
    'Host rundown copied or posted with State Night route URL.',
    'Three matchups selected from the regional slate.',
    'One poster or broadcast card prompt generated for a featured matchup.',
    'Sponsor read remains reservation-only and human-approved.',
    'No official marks, betting language, checkout, payout, or live-result claims.',
  ];
  const hostRundown = [
    `${title.toUpperCase()} HOST RUNDOWN`,
    `Cold open: ${headline}`,
    `Match 1: ${matchups[0].left.team} vs ${matchups[0].right.team} at ${matchups[0].fieldLine}.`,
    `Match 2: ${matchups[1].left.team} vs ${matchups[1].right.team} at ${matchups[1].fieldLine}.`,
    `Match 3: ${matchups[2].left.team} vs ${matchups[2].right.team} at ${matchups[2].fieldLine}.`,
    `Fan ritual beat: ${featured.left.fanRitual} meets ${featured.right.fanRitual}.`,
    `Goal: https://pointcast.xyz/goal?preset=nouns-union-state-night#setup`,
    NOUNS_STATE_NIGHT_GUARDRAIL,
  ].join('\n');

  return {
    region,
    title,
    headline,
    teams: slateTeams,
    matchups,
    featured,
    hostRundown,
    watchInvite: featured.watchInvite,
    artifactBundle: matchups.map((matchup) => `${matchup.left.short}/${matchup.right.short}: ${matchup.artifactPrompt}`).join('\n\n'),
    sponsorRead: featured.sponsorRead,
    agentTask: [
      `UNION STATE NIGHT AGENT BRIEF: ${title}`,
      `Produce three watch hooks, one artifact brief, one sponsor-safe read, and one proof checklist.`,
      `Featured: ${featured.left.team} vs ${featured.right.team}.`,
      `Route: https://pointcast.xyz/nouns-nation-union/state-night/`,
      NOUNS_STATE_NIGHT_GUARDRAIL,
    ].join('\n'),
    proofChecklist,
    guardrail: NOUNS_STATE_NIGHT_GUARDRAIL,
  };
}

export function buildNounsStateDropGallery(team: NounsStateTeam, drop: NounsStateFoundingDrop) {
  const slots = NOUNS_STATE_DROP_GALLERY_SLOTS.map((slot) => ({
    ...slot,
    prompt: buildNounsStateArtifactPrompt(team, slot.promptKind),
  }));

  const receipt = [
    `DROP GALLERY: ${drop.dropName}`,
    `Team: ${team.team} (${team.state} / ${team.short})`,
    `Headline: ${drop.headline}`,
    `Gallery slots: ${slots.map((slot) => `${slot.label} - ${slot.status}`).join('; ')}`,
    `Next lane: generate one visual, review one remix, package one sponsor candidate, and publish one broadcast still.`,
    `Proof: keep prompt, generated image, reviewer note, URL, and human approval before sponsor or participant-credit routing.`,
    'Guardrail: original Nouns-style creative only; no official sports marks, betting claims, checkout, payout, or implied official relationship.',
  ].join('\n');

  return {
    dropName: drop.dropName,
    code: team.code,
    team: team.team,
    state: team.state,
    short: team.short,
    colors: team.colors,
    nounSeed: team.nounSeed,
    headline: drop.headline,
    slots,
    receipt,
  };
}

export function buildNounsStateManusArtifact(team: NounsStateTeam, index = 0): NounsStateManusArtifact {
  const formats = [
    { format: '4:5 founding poster', emphasis: 'one heroic Noun captain, loud state typography, and a collectible match-poster frame' },
    { format: '1:1 mobile ad', emphasis: 'big team code, immediate watch invite, and clean crop-safe Nouns action' },
    { format: '16:9 broadcast still', emphasis: 'field-wide sports desk composition, lower-third safe space, and live-match atmosphere' },
    { format: 'product board', emphasis: 'three merch concepts: wearable, sticker or card, and a small sponsor-safe object' },
    { format: 'ritual art frame', emphasis: 'fans performing the state ritual as a surreal but readable pre-match ceremony' },
  ];
  const selected = formats[index % formats.length];
  const title = `${team.state} ${selected.format}`;
  const prompt = [
    `Use a top-tier image model lane such as Nano Banana, ChatGPT image generation, or another high-fidelity multimodal image model to create a ${selected.format} for ${team.team}.`,
    `Make it original Nouns-style sports art with chunky noggles, crisp type, playful field energy, and no official sports marks.`,
    `State identity: ${team.state}; team code ${team.short}; colors ${team.colors[0]} and ${team.colors[1]}.`,
    `Local motif: ${team.motif}. Home field: ${team.field}. Signature move: ${team.signatureMove}.`,
    `Composition emphasis: ${selected.emphasis}.`,
    `Add small broadcast details that make the team feel alive: fan ritual "${team.fanRitual}", contribution lane "${team.contribution}", and one empty safe zone for a PointCast caption.`,
    'Do not use real league logos, official school marks, betting language, checkout language, or promised financial return.',
  ].join(' ');

  return {
    id: `${team.code.toLowerCase()}-manus-artifact`,
    state: team.state,
    code: team.code,
    team: team.team,
    short: team.short,
    modelLane: 'Nano Banana / ChatGPT image generation / top multimodal image model',
    format: selected.format,
    title,
    prompt,
    review: `Manus pass: generate the ${selected.format}, check state specificity, preserve readable team type, then suggest one bolder remix.`,
    proof: 'Save prompt, generated image, model name, reviewer note, state code, and human approval before publishing or sponsor routing.',
  };
}

export function buildNounsStateManusArtifactRun() {
  const artifacts = NOUNS_STATE_LEAGUE_TEAMS.map((team, index) => buildNounsStateManusArtifact(team, index));
  const receipt = [
    'MANUS 50 ARTIFACT RUN',
    'Scope: one model-ready artifact for every US state team in the Nouns Nation Union League.',
    'Model lane: Nano Banana / ChatGPT image generation / top multimodal image model, with human review before publishing.',
    `Artifacts: ${artifacts.map((artifact) => `${artifact.code}:${artifact.format}`).join(', ')}`,
    'Workflow: generate, review, remix, publish one accepted state artifact, then route sponsor or participant credit only after human approval.',
    'Guardrail: fictional Nouns sports creative; no official sports marks, betting claims, checkout, payout, or implied official relationship.',
  ].join('\n');

  return {
    count: artifacts.length,
    modelLane: 'Nano Banana / ChatGPT image generation / top multimodal image model',
    workflow: ['generate', 'review', 'remix', 'publish accepted state artifact', 'route approved sponsor or participant credit'],
    guardrail: 'Fictional Nouns sports creative only; no official sports marks, betting claims, checkout, payout, or implied official relationship.',
    artifacts,
    receipt,
  };
}

export function buildNounsStateAgencyPoster(team: NounsStateTeam, index = 0): NounsStateAgencyPoster {
  const agencyLanes = [
    'Los Angeles sports-culture launch campaign',
    'New York outdoor/poster takeover campaign',
    'global design-office identity sprint',
    'social-first creator ad campaign',
    'night-game broadcast poster campaign',
  ];
  const formats = [
    'wild-posting 24x36 poster',
    'subway-platform poster',
    'arena concourse one-sheet',
    'mobile story ad',
    'billboard-safe 16:9 key art',
  ];
  const verbs = ['storms', 'glows', 'presses', 'rallies', 'breaks open', 'turns up', 'holds the line'];
  const agencyLane = agencyLanes[index % agencyLanes.length];
  const format = formats[index % formats.length];
  const verb = verbs[index % verbs.length];
  const campaignLine = 'Fifty States. Fifty Nouns. One Union Night.';
  const headline = `${team.short} ${verb} from ${team.field}.`;
  const posterTitle = `${team.state} State Night Poster`;
  const nounReference = `Actual Noun #${team.nounSeed} reference: https://noun.pics/${team.nounSeed}.svg. PointCast local preview asset: /games/nouns-nation-battler/assets/noun-${team.nounSeed % 60}.svg.`;
  const prompt = [
    `Create an original ${format} for ${team.team} in the Nouns United States Union League.`,
    `Creative benchmark: a top Los Angeles or New York advertising/design firm launching a weird fictional sports property.`,
    `Campaign line: "${campaignLine}" Headline: "${headline}"`,
    `${nounReference}`,
    `Use actual Noun #${team.nounSeed} as the central athlete/captain, preserving the real Noun silhouette, head shape, body/accessory feel, pixel-art construction, and noggles from the reference rather than inventing a generic mascot.`,
    `Build the ad around that actual Noun with premium sports typography, high-contrast field energy, and one unmistakable ${team.state} visual idea.`,
    `State identity: ${team.motif}. Team colors: ${team.colors[0]} and ${team.colors[1]}.`,
    `Feature actual Noun #${team.nounSeed}, one secondary local symbol, and a clean team-name lockup: ${team.team}.`,
    `Include subtle cues for home field "${team.field}", signature move "${team.signatureMove}", and fan ritual "${team.fanRitual}".`,
    `Keep a safe zone for a PointCast caption and a small "Nouns Union State Night" tag.`,
    `Do not use official league logos, school marks, real team marks, betting language, checkout language, or promised financial return.`,
  ].join(' ');

  return {
    id: `${team.code.toLowerCase()}-agency-poster`,
    state: team.state,
    code: team.code,
    team: team.team,
    short: team.short,
    nounId: team.nounSeed,
    nounReference,
    agencyLane,
    campaignLine,
    headline,
    posterTitle,
    format,
    mediaPlan: ['wild posting', 'mobile story', 'TV pregame still', 'state atlas card'],
    prompt,
    proof: 'Save prompt, generated image, model name, reviewer note, state code, and human approval before publishing, sponsor routing, or participant credit.',
  };
}

export function buildNounsStateAgencyPosterRun() {
  const posters = NOUNS_STATE_LEAGUE_TEAMS.map((team, index) => buildNounsStateAgencyPoster(team, index));
  const receipt = [
    'NOUNS UNION AGENCY 50 POSTER CAMPAIGN',
    'Assignment: one premium ad-poster concept for every state team.',
    'Benchmark: top Los Angeles / New York advertising and design firm energy, executed through Manus, ChatGPT image generation, Nano Banana, or another top image model.',
    'Noun rule: every poster must use its assigned actual Noun number as the central athlete, with noun.pics reference art preserved before adding state campaign styling.',
    `Campaign line: ${posters[0]?.campaignLine}`,
    `Posters: ${posters.map((poster) => `${poster.code}:${poster.format}`).join(', ')}`,
    'Workflow: generate, review, remix weak concepts, publish accepted posters, then route sponsor or participant credit only after human approval.',
    'Guardrail: fictional Nouns sports creative only; no official sports marks, betting claims, checkout, payout, or implied official relationship.',
  ].join('\n');

  return {
    count: posters.length,
    campaignLine: posters[0]?.campaignLine ?? 'Fifty States. Fifty Nouns. One Union Night.',
    modelLane: 'Manus / ChatGPT image generation / Nano Banana / top multimodal image model',
    guardrail: 'Fictional Nouns sports creative only; no official sports marks, betting claims, checkout, payout, or implied official relationship.',
    mediaPlan: ['wild posting', 'mobile story set', 'TV pregame stills', 'state atlas cards', 'sponsor-safe proof board'],
    posters,
    receipt,
  };
}

export function buildNounsStateArtifactPack(team: NounsStateTeam) {
  return {
    team: team.team,
    state: team.state,
    code: team.code,
    short: team.short,
    colors: team.colors,
    nounSeed: team.nounSeed,
    motif: team.motif,
    field: team.field,
    signatureMove: team.signatureMove,
    fanRitual: team.fanRitual,
    contribution: team.contribution,
    prompts: NOUNS_STATE_ARTIFACT_KINDS.map((kind) => ({
      ...kind,
      prompt: buildNounsStateArtifactPrompt(team, kind.id),
    })),
  };
}

export function buildNounsStateCampaignPack(team: NounsStateTeam, drop?: NounsStateFoundingDrop) {
  const selectedDrop = drop ?? NOUNS_STATE_FOUNDING_DROPS.find((item) => item.code === team.code);
  const title = selectedDrop?.dropName ?? `${team.team} State Kit`;
  const headline = selectedDrop?.headline ?? `${team.team} enter the Union Cup from ${team.field}.`;
  const products = selectedDrop?.products ?? ['team reveal poster', 'watch invite ad', 'broadcast slate'];

  return [
    `${title}`,
    `Team: ${team.team} (${team.state} / ${team.short})`,
    `Headline: ${headline}`,
    `Creative direction: ${team.motif}; colors ${team.colors[0]} and ${team.colors[1]}; Nouns-inspired, chunky noggles, original marks only.`,
    `Artifact run: ${products.join(', ')}.`,
    `Watch hook: ${selectedDrop?.watchHook ?? `Host a ${team.region} regional slate at ${team.field}.`}`,
    `Sponsor read: ${selectedDrop?.sponsorRead ?? 'Reservation intent only; no payment processing, official marks, odds, or promised payout.'}`,
    `Agent task: ${selectedDrop?.agentTask ?? `Generate one poster, one ad, one broadcast card, and one proof checklist for ${team.team}.`}`,
    'Guardrail: fictional Nouns sports creative, not official sports marks, betting content, or a real checkout.',
  ].join('\n');
}
