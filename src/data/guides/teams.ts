import type { Guide } from './types';

const ALL = { label: 'All guides', href: '/guides' };

export const TEAM_GUIDES: Guide[] = [
  {
    slug: 'start-a-pickleball-team',
    category: 'pickleball',
    title: 'How to start a pickleball team or club',
    dek: 'Turn a group of regulars into a team that shows up, plays fair, and lasts past the first season.',
    audience: 'Players who keep running into the same people at the courts and want something more organized, without turning it into a second job.',
    seat: 'open',
    minutes: 7,
    sections: [
      {
        heading: 'Start with the purpose, then the roster',
        body: [
          'Before anyone signs up for anything, decide what the team is for. A social club that meets for friendly games, a team that enters organized league play, and a group chasing tournament results all need different people and different commitments. Write the purpose in two sentences and share it with everyone who asks to join. It saves awkward conversations later.',
          'Pick a roster size that matches your court time. A common rule of thumb is that each court holds four players at a time, so a team that books two courts can usually carry eight to ten active players without anyone sitting out too long. Keep a short waitlist instead of letting the roster balloon, and be honest with people about where they stand on it.',
          'Gather the basics from each player in one place: name as they want it shown, how to reach them, availability by day, and whether they are comfortable being listed publicly. Ask for consent to be listed rather than assuming it.',
        ],
      },
      {
        heading: 'Skill levels and ratings',
        body: [
          'Pickleball players describe their level in a few different ways. Many use a self-rating on a simple scale, often described in half-point steps from beginner to advanced. Others use a rating that is calculated from recorded match results, such as DUPR-style ratings, where the number moves as you play. Leagues and tournaments may use their own systems, so read the rules of any organization you join rather than assuming they match another one.',
          'Self-ratings drift high, especially among people who mostly play casual games. A friendly way to keep things honest is to have new members play a few rotations with different partners before settling on a level, and to let the captain adjust groupings quietly instead of announcing anyone is in the wrong group.',
          'Decide up front whether the team is open to mixed levels or aims for a narrow band. Mixed-level teams work well when the format rotates partners. Narrow-band teams work better when you are entering play that is divided by rating. Either is fine, as long as everybody knows which one they signed up for.',
        ],
      },
      {
        heading: 'Court time and where to play',
        body: [
          'Court access is usually the hardest part. Public courts are often first come, first served, which is good for casual play but unreliable for a team that wants a fixed night. Private clubs, recreation departments, and schools sometimes allow reservations. Rules and costs vary by place, so ask the facility directly and get the answer in writing when you can.',
          'Choose a primary slot and a backup. A regular weekly time builds habit, and a backup (a different day, or a second location) keeps one rained-out or double-booked night from breaking the routine. Post the plan where everyone can find it, and confirm the day before.',
          'Be a good guest wherever you play. Follow posted rules, share courts with people who are waiting, and leave the space cleaner than you found it. A team that is known as considerate usually gets invited back.',
        ],
      },
      {
        heading: 'Dues and money',
        body: [
          'Keep money simple and transparent. Dues typically cover things like court rental, balls, a shared first aid kit, a banner, or an entry fee for outside play. Work out the actual costs first, divide by the number of players, and round to something easy. Avoid inventing a number and then looking for things to spend it on.',
          'Pick one person to hold the money and keep a short running record of what came in and what went out. Share that record with the team at least once a season. If someone cannot afford dues, have a quiet way to handle it, such as a small shared fund that does not require anyone to explain themselves.',
          'Be clear about refunds before they are needed. Decide what happens if someone leaves midseason or the season is cut short, and put it in the same message where dues are announced.',
        ],
      },
      {
        heading: 'The captain role',
        body: [
          'A captain is a coordinator, not a boss. The job is to set the schedule, confirm attendance, make lineups, and be the single point of contact for outside organizers. It helps to name a co-captain so the team does not stall when one person is traveling or busy.',
          'Good captains communicate in one predictable place, on a predictable rhythm: a weekly message with the plan, a reminder the day before, and a short recap after. They also make sure every player gets real playing time over the season and that newer players are introduced to the group.',
          'Write down how decisions get made and how the captain role rotates or ends. A team that agrees on this early rarely has to argue about it later.',
        ],
      },
    ],
    checklist: [
      { label: 'Write the purpose', detail: 'Two sentences: social, league, or competitive, and how often the team plays.' },
      { label: 'Set a roster size', detail: 'Match active players to the courts you can actually get, and keep a short waitlist.' },
      { label: 'Collect player info with consent', detail: 'Contact, availability, and whether each person agrees to be listed publicly.' },
      { label: 'Agree on how levels are described', detail: 'Self-rating, a calculated rating, or the rules of any league you join.' },
      { label: 'Lock a main slot and a backup', detail: 'One regular time plus a fallback for weather or double-bookings.' },
      { label: 'Price dues from real costs', detail: 'Divide actual expenses, keep a simple record, and share it each season.' },
      { label: 'Name a captain and a co-captain', detail: 'Define duties and how the role rotates or ends.' },
      { label: 'Pick one channel for updates', detail: 'Use one group chat or email list so nothing gets lost.' },
    ],
    wanted: [
      'Local court access tips: which facilities take reservations and how groups can ask.',
      'A sample one-page team agreement (purpose, dues, attendance, captain duties) you have used.',
      'How your team handles mixed skill levels and what rotation formats worked.',
      'A simple dues tracking method that avoids awkward money conversations.',
      'Stories of what made your first season succeed or fall apart.',
      'Accessibility and welcome tips for new or returning players.',
    ],
    related: [
      { label: 'Pickleball hub', href: '/pickleball' },
      { label: 'Local', href: '/local' },
      ALL,
    ],
    tags: ['pickleball', 'team', 'club', 'captain', 'dues'],
  },
  {
    slug: 'pickleball-ladder-and-league-night',
    category: 'pickleball',
    title: 'How to run a pickleball ladder or league night',
    dek: 'Formats, scoring, rotation, and record keeping that keep a weekly night fair and fun.',
    audience: 'Organizers running a recurring ladder, round robin, or league night for a team, club, or open group.',
    seat: 'open',
    minutes: 8,
    sections: [
      {
        heading: 'Choose a format that fits your group',
        body: [
          'A ladder ranks players or pairs and lets them move up or down based on results. It rewards consistency and works best when people can commit to most weeks. A round robin has everyone play with or against everyone else over the night, and it is the friendliest option for groups with mixed levels or uneven attendance.',
          'A league night usually combines the two: a fixed set of teams or pairs, a schedule across several weeks, and standings. Pick the simplest format that matches your goal. If people mostly want to play and meet others, a rotating round robin is hard to beat. If they want to measure progress, a ladder or league adds the structure.',
          'Say the format out loud at the start of every night. A thirty-second explanation of how courts, rotation, and scoring work prevents most confusion.',
        ],
      },
      {
        heading: 'Scoring and game length',
        body: [
          'Decide your scoring before play begins and stick to it. Many groups play games to a fixed number of points, others use a timer, and some play a set number of rotations. Short games to a low point total keep courts moving and give everyone more games, while timed rounds make the night predictable.',
          'Whatever you choose, make the tiebreakers explicit. Common options include head-to-head result, point differential, or a sudden-death point. Write them down before the first match so nobody feels the rules were invented to fit the outcome.',
          'Use the rules of any sanctioning body or facility if you are playing under one. If your night is informal, say so, and keep it consistent.',
        ],
      },
      {
        heading: 'Rotation and fair pairing',
        body: [
          'Rotation is where fairness lives. In a round robin, rotate partners so that over the night everyone plays with a variety of people. A printed or shared rotation chart for the number of players you have makes this almost automatic. Keep charts for four, five, six, and eight courts-worth of players handy, and tape them where people can see.',
          'For a ladder, pair people near their current rank so matches are close. Avoid permanent partnerships that lock in advantages, unless the format is explicitly for fixed pairs. Let newer players choose whether to start near the middle or the bottom, and let them move quickly if they are clearly placed too low.',
          'Handle odd numbers with a visible sit-out rule. Rotate who sits so nobody sits twice before everyone has sat once. Treat byes as normal, not as a punishment.',
        ],
      },
      {
        heading: 'Keeping results',
        body: [
          'Results do not need software. A shared spreadsheet, a whiteboard photo, or a simple form works fine. What matters is that someone is responsible for recording scores at the end of each match and that players can see standings soon after the night.',
          'Record the date, the court, the pairs, and the score. Keep the raw results and the standings separate so you can recheck a number later. If anyone disputes a result, the raw record is the tiebreaker, and the organizer makes the call.',
          'Share standings in the same place every week. Celebrate improvement and attendance as well as wins, so the board does not turn into a scoreboard only the top few care about.',
        ],
      },
      {
        heading: 'Running the night',
        body: [
          'Arrive early to set up courts, balls, and the sign-in sheet. Start on time, because late starts compound. Have one person run the clock and one person handle questions, so the organizer is not pulled in two directions.',
          'Keep a calm, friendly tone when problems come up. Line calls, pace of play, and unsportsmanlike behavior are the most common issues, and a short posted code of conduct gives you something to point to. Address problems privately and early.',
          'End with a short wrap-up: thank the group, announce next week, and ask for volunteers to help set up or take down. A night that finishes well tends to bring people back.',
        ],
      },
    ],
    checklist: [
      { label: 'Pick the format', detail: 'Ladder, round robin, or a multi-week league, matched to your goal and attendance.' },
      { label: 'Fix scoring and game length', detail: 'Points target, timer, or rotation count, announced before play.' },
      { label: 'Write down tiebreakers', detail: 'Head-to-head, point differential, or sudden death, decided in advance.' },
      { label: 'Prepare rotation charts', detail: 'Have versions for different player counts, posted at the courts.' },
      { label: 'Set a sit-out rule', detail: 'Rotate byes so nobody sits twice before everyone sits once.' },
      { label: 'Assign a results keeper', detail: 'One person records date, court, pairs, and score each week.' },
      { label: 'Post standings weekly', detail: 'Use the same place every time, and note attendance and improvement.' },
      { label: 'Share a short code of conduct', detail: 'Line calls, pace, and respect, so there is something to refer to.' },
    ],
    wanted: [
      'Rotation charts for odd player counts that worked for your group.',
      'How you handle line-call disputes without slowing the night.',
      'A results spreadsheet template you are willing to share.',
      'Ideas for welcoming first-timers into a ladder without intimidating them.',
      'Notes on timing: how long a night should run for a given number of courts.',
    ],
    related: [
      { label: 'Pickleball hub', href: '/pickleball' },
      { label: 'The Squeeze', href: '/pickleball/the-squeeze' },
      ALL,
    ],
    tags: ['pickleball', 'ladder', 'league', 'round-robin', 'scoring'],
  },
  {
    slug: 'pickleball-team-page',
    category: 'pickleball',
    title: 'What belongs on your pickleball team page',
    dek: 'A short checklist for a team page that people actually read: schedule, results, roster, photos, and a captain note.',
    audience: 'Captains and volunteers who maintain a team page and want it useful, current, and respectful of players.',
    seat: 'open',
    minutes: 5,
    sections: [
      {
        heading: 'Start with what people come for',
        body: [
          'Most visitors to a team page want one of three things: when and where the next game is, how the team did recently, or how to join. Put those at the top, in that order, and keep everything else below. A page that answers the first question in five seconds will get reopened.',
          'Use plain language and full dates. Write a date as a weekday plus month and day, add a time zone if you play across regions, and name the location as the facility calls itself. Avoid inside jokes and shorthand that only existing members understand.',
        ],
      },
      {
        heading: 'Schedule and results',
        body: [
          'List upcoming dates with time, place, and what kind of night it is, such as practice, ladder night, or a match against another group. Mark changes clearly and remove canceled events instead of leaving them to confuse people. If the schedule depends on weather or court availability, say how updates will be announced.',
          'For results, post the date, the opponent or format, the score, and a one-line note. Keep the tone factual and kind. Results are a record, not a verdict on anyone, and they should never single out one player for a bad day.',
          'Archive older results by season rather than deleting them. Over time that record becomes the team history, which new players enjoy reading.',
        ],
      },
      {
        heading: 'Roster, with consent',
        body: [
          'Only list a person when they have agreed to be listed, and only in the form they agreed to. A first name or a nickname is often enough. Ask each player what they want shown, and let them change their mind at any time without explanation.',
          'Do not publish contact details such as phone numbers or home addresses on a public page. Route inquiries through a single team contact or a form. If a player has stepped away, move them to an alumni or past-members list only if they are comfortable with that, or remove them.',
          'Skill levels are optional. If you show them, make sure the player agreed, and describe the system you use generally, such as a self-rating or a calculated rating, rather than implying an official ranking.',
        ],
      },
      {
        heading: 'Photos, with consent',
        body: [
          'Photos make a page feel alive, but they need permission. Ask people before posting, tell them where the photo will appear, and take it down quickly when asked. A sign-up form with a simple yes or no for photos makes this easy.',
          'For anyone under 18, get a parent or guardian to agree before showing a face or a full name. When in doubt, choose a photo of the courts, the equipment, or players from behind. Add short alt text describing what is in the photo so the page works for everyone.',
          'Keep photo credits honest. If someone else took the picture, name them, with their permission, or leave the credit generic.',
        ],
      },
      {
        heading: "The captain's note",
        body: [
          'A short note from the captain gives the page a human voice. Two or three sentences is plenty: what happened this week, what is coming up, and a thank-you. Sign it with the name the captain uses publicly, and date it so readers know it is current.',
          'Rotate who writes the note if the captain is busy. Make sure every note is written by the person who signs it, since a team page is a place where readers should be able to trust who is speaking.',
          'Review the page at the end of each season. Remove stale items, update the roster, and confirm that everyone shown still wants to be.',
        ],
      },
    ],
    checklist: [
      { label: 'Put next game first', detail: 'Date, time, and place near the top of the page.' },
      { label: 'Keep results factual', detail: 'Date, opponent or format, score, and a one-line note, with no individual blame.' },
      { label: 'Get roster consent', detail: 'List only people who agreed, in the form they agreed to.' },
      { label: 'Keep contact details private', detail: 'Use one team contact or form instead of personal numbers.' },
      { label: 'Get photo consent', detail: 'Ask first, say where it will appear, and remove on request.' },
      { label: 'Protect minors', detail: 'Guardian consent before any face or full name of anyone under 18.' },
      { label: "Add a dated captain's note", detail: 'A few sentences, signed by the person who wrote it.' },
      { label: 'Review each season', detail: 'Archive old results and confirm the roster is still accurate.' },
    ],
    wanted: [
      'A sample consent form or message for roster and photo permission.',
      'Examples of short, kind results notes that read well.',
      'Layout ideas that work well on a phone for a team schedule.',
      'Alt text examples for common team photos.',
      'How your team archives past seasons.',
    ],
    related: [
      { label: 'Pickleball hub', href: '/pickleball' },
      { label: 'Pickleball home', href: '/pickleball/home' },
      ALL,
    ],
    tags: ['pickleball', 'team-page', 'consent', 'roster', 'schedule'],
  },
  {
    slug: 'run-a-rec-league-team',
    category: 'sports',
    title: 'How to run an adult rec league team',
    dek: 'Schedule, subs, carpools, uniforms, and dues for softball, basketball, soccer, and other adult league teams.',
    audience: 'Adults who volunteered, or got volunteered, to manage a recreational team in a community league.',
    seat: 'open',
    minutes: 7,
    sections: [
      {
        heading: 'Know the league before you recruit',
        body: [
          'Read the league rules and registration details before you contact a single player. Note the roster minimums, the registration deadline, any fee schedule, and how forfeits work. League rules vary a lot, so use the ones the league actually publishes and ask the organizer when something is unclear.',
          'Recruit from the circles you already have: coworkers, neighbors, friends of friends, and people from last season. Be upfront about the level of play and how serious the team is. A team that says it is here to have fun and play fair will attract people who want the same thing.',
          'Get commitment in writing, even if it is just a reply to a group message. A simple yes with a name and a contact tells you who is really in.',
        ],
      },
      {
        heading: 'Schedule, attendance, and subs',
        body: [
          'When the league schedule comes out, put every game in a shared calendar right away and send the link to the team. Ask for a quick yes or no on each game as soon as possible, ideally several days ahead, so you know early if you are short.',
          'Keep a sub list of people who are willing to fill in. Ask them in order and keep it fair, so the same person is not always called last minute. Check league rules on who can sub and whether they must be registered, and do not assume a friend can play without being approved.',
          'Set a firm cutoff for withdrawals, and remind the team that a forfeit affects everybody. Many forfeits are avoidable with an early heads-up and a few spare players.',
        ],
      },
      {
        heading: 'Carpools and logistics',
        body: [
          'Away games and early mornings go more smoothly with a plan for rides. A shared sheet or chat message where drivers offer seats and riders claim them works well. Pair people who live near each other, and make sure no one is stuck without a way home.',
          'Share the field or court details ahead of time: address, parking, where to meet, and what to bring. Mention restrooms, shade, and water if those are issues. Check the weather the day before and know how the league announces cancellations.',
          'Bring a small kit to every game: a first aid kit, extra water, a ball pump, a pen for the scorebook, and a printed copy of the roster. These small things solve most problems before they start.',
        ],
      },
      {
        heading: 'Uniforms and gear',
        body: [
          'Check whether the league requires matching uniforms, numbers, or specific colors. If it does, order early, because lead times vary. If it does not, a matching shirt is still a nice touch and helps people feel like a team.',
          'Be transparent about costs. Show what a uniform costs per person, who pays up front, and how reimbursement works. Offer a no-frills option so that the price of a jersey is never the reason someone drops out.',
          'Keep a simple inventory of shared gear such as balls, bases, cones, and pinnies, and assign someone to bring it. Return borrowed league equipment promptly.',
        ],
      },
      {
        heading: 'Dues and fairness',
        body: [
          'Calculate dues from the real numbers: registration fee, uniforms, any equipment, and a small cushion for surprises. Divide by the roster size and collect early. Use a payment method everyone can use, and keep a record of who has paid.',
          'Keep playing time fair within the spirit of the league. Many rec leagues have rules about minimum play, and even when they do not, rotating positions and innings keeps people engaged. Explain your approach at the first meeting so nobody feels surprised.',
          'At season end, share a short financial summary, thank the team, and ask who wants to return. Passing along what you learned makes the next manager much more comfortable.',
        ],
      },
    ],
    checklist: [
      { label: 'Read the league rules', detail: 'Registration deadline, roster minimums, fees, and forfeit policy.' },
      { label: 'Confirm your roster in writing', detail: 'A yes with a name and contact for every player.' },
      { label: 'Build a shared calendar', detail: 'Put every game in as soon as the schedule is released.' },
      { label: 'Keep a sub list', detail: 'Check league rules on who can sub, and call people in a fair order.' },
      { label: 'Organize rides', detail: 'Drivers offer seats, riders claim them, nobody gets stranded.' },
      { label: 'Plan the game kit', detail: 'First aid, water, pump, scorebook pen, printed roster.' },
      { label: 'Price uniforms and dues openly', detail: 'Show the math and offer a lower-cost option.' },
      { label: 'Share an end-of-season summary', detail: 'Money in and out, thanks, and who is returning.' },
    ],
    wanted: [
      'League registration tips from people who have managed teams in the area.',
      'A reusable message template for asking about attendance and subs.',
      'How you have handled playing-time disagreements kindly.',
      'Carpool or logistics tools that worked for your team.',
      'Sample inventory lists for softball, basketball, and soccer.',
      'Ideas for welcoming new players into an existing team.',
    ],
    related: [
      { label: 'Baseball', href: '/baseball' },
      { label: 'Local', href: '/local' },
      ALL,
    ],
    tags: ['rec-league', 'softball', 'basketball', 'soccer', 'manager'],
  },
  {
    slug: 'youth-team-parent-guide',
    category: 'sports',
    title: 'Team parent guide for youth sports',
    dek: 'Snack and volunteer rotations, clear communication, safety basics, and keeping kids’ privacy protected.',
    audience: 'Team parents and volunteer coordinators supporting a coach and a group of families on a youth sports team.',
    seat: 'open',
    minutes: 8,
    sections: [
      {
        heading: 'What a team parent actually does',
        body: [
          'The team parent handles the logistics so the coach can coach. That usually means collecting contact information, setting up volunteer schedules, passing along league announcements, and being the friendly point of contact for families. Agree with the coach at the start about which tasks are yours and which are theirs.',
          'Start the season with a short welcome message that covers practice times, game days, who to ask about what, and how families will be updated. Ask each family for an emergency contact and any health or allergy information the coach needs, and ask who is allowed to pick up each child.',
          'Keep family information private. Store it somewhere that only you and the coach can reach, and never share a phone number or address without that family agreeing.',
        ],
      },
      {
        heading: 'Snack and volunteer rotations',
        body: [
          'Build a rotation early and make it easy to follow. A shared sheet with dates, jobs, and a spot for each family to sign up works well. Typical jobs include snacks, water, setting up and taking down, keeping the scorebook if one is used, and photos for the team.',
          'Ask about allergies and dietary needs before anyone buys snacks. Many teams choose simple, nut-free options and ask families to check ingredient labels. Some leagues have their own snack rules, so check what applies. Keep it low-stakes, because the point is the kids, not an elaborate spread.',
          'Spread the work fairly. Let families who cannot volunteer on game days help in other ways, such as ordering team gear, organizing the end-of-season party, or managing the sheet. Never keep score of who contributes more.',
        ],
      },
      {
        heading: 'Communication that works',
        body: [
          'Pick one channel and stick with it. A group chat or email list works for most teams, and a short weekly message listing the week ahead helps everyone plan. Send reminders the day before and post changes as soon as you know them.',
          'Keep messages calm and specific. Include time, place, what to bring, and who to contact. Leave out complaints and commentary about other kids, other parents, or officials. Take sensitive issues into a private conversation, and involve the coach or league when needed.',
          'Make sure communication with children is appropriate. Many youth organizations recommend that adults avoid private one-on-one messages with minors and instead include a parent or guardian. Follow your league or club policy where one exists.',
        ],
      },
      {
        heading: 'Safety basics',
        body: [
          'Know where the first aid kit is and who is trained to use it. Keep a copy of emergency contacts for every child at practices and games, and know the address of the field in case you need to call for help. Learn the league policy on injuries and concussions, and follow it.',
          'Pay attention to heat, cold, and air quality. Bring water, plan breaks, and be ready to modify or postpone activity when conditions are poor. Make sure shade or shelter is available when you can.',
          'Follow any background check and training requirements set by your league, school, or club. If you see something that makes you uneasy, report it to the league through the proper channel rather than letting it go.',
        ],
      },
      {
        heading: "Protecting kids' privacy online",
        body: [
          'Treat minors differently from adults on anything public. Do not publish last names, full names with faces, home addresses, school names, or schedules that reveal where a child will be, unless a parent or guardian has clearly agreed. First names or jersey numbers without faces are safer defaults for public posts.',
          'Get consent in writing for photos and recaps, and make it easy to say no or change one’s mind later. Do not tag children, and do not share photos of kids who are not part of your team. If a family opts out, respect that every time.',
          'Keep team photos and rosters in private groups with controlled access rather than in public posts. When in doubt, ask the parents first, and when still in doubt, leave it out.',
        ],
      },
    ],
    checklist: [
      { label: 'Agree on roles with the coach', detail: 'Decide which logistics tasks belong to the team parent.' },
      { label: 'Collect family information privately', detail: 'Emergency contacts, allergies, and approved pickup people, stored securely.' },
      { label: 'Build the volunteer sheet', detail: 'Snacks, water, setup, scorebook, and photos, with fair sign-up.' },
      { label: 'Check allergies before snacks', detail: 'Choose simple options and follow league snack rules.' },
      { label: 'Use one communication channel', detail: 'Weekly overview plus a reminder the day before.' },
      { label: 'Follow youth contact policies', detail: 'Include a parent or guardian in messages with minors.' },
      { label: 'Know the safety plan', detail: 'First aid kit, field address, injury and heat policy.' },
      { label: 'Get written consent for any public post', detail: 'No last names or faces of kids without guardian consent.' },
    ],
    wanted: [
      'Allergy-aware snack ideas that kids actually like.',
      'A template for a team welcome message and emergency contact form.',
      'League or school policies on adult-to-minor communication, shared by someone who knows them.',
      'A photo consent form that parents found clear and easy.',
      'Heat and air quality guidance used by local leagues.',
      'Ways your team made volunteering fair for working parents.',
    ],
    related: [
      { label: 'Local', href: '/local' },
      { label: 'Baseball', href: '/baseball' },
      ALL,
    ],
    tags: ['youth-sports', 'team-parent', 'safety', 'privacy', 'volunteers'],
  },
  {
    slug: 'game-day-reporting',
    category: 'sports',
    title: 'How to write a game recap and keep useful stats',
    dek: 'Short, fair recaps and simple stats that a team will actually use all season.',
    audience: 'Team members, parents, and volunteers who write recaps or keep stats for a rec, club, or community team.',
    seat: 'open',
    minutes: 6,
    sections: [
      {
        heading: 'What a good recap does',
        body: [
          'A good recap tells the reader what happened in a few clear paragraphs. Open with the result and the setting: who played, where, and the final score. Then give two or three moments that explain the game, such as a long rally, a comeback, or a defensive stand. Close with what is next.',
          'Keep it short. A recap that fits on a phone screen will be read by more people than a long one. Use plain American English and active verbs, and check names, scores, and spellings before you post. Accuracy builds trust faster than flair.',
          'Write about what happened, not about what should have happened. Leave out guesses about why someone made a play, and stick to what you saw or what the scorebook says.',
        ],
      },
      {
        heading: 'Stats a team will actually use',
        body: [
          'Track a small number of things consistently instead of many things badly. For most teams that means score by period or inning, attendance, and one or two individual numbers that fit the sport. Pick them with the team so that people understand why they are being counted.',
          'Decide who records stats and how. A single scorekeeper with a simple sheet is more reliable than everyone guessing afterward. Take a photo of the sheet right after the game as a backup, and enter it into a shared file that same day if you can.',
          'Be careful with stats that can embarrass people, such as errors or turnovers. Many teams track them privately for coaching and share only positive or team-level numbers publicly. Whatever you choose, tell players in advance what is recorded and what is shared.',
        ],
      },
      {
        heading: 'Fairness across the season',
        body: [
          'Over a season, every player who showed up should appear in the writing at least once. Keep a simple tally of who has been mentioned, and look for people who have been missed. Quieter contributions count: a great pass, steady defense, encouraging teammates, or showing up every week.',
          'Spread the spotlight on purpose. If the same two names fill every recap, others will notice. Rotating the writer can help, as long as the writers follow the same guidelines on tone and accuracy.',
          'Credit the other team too. A kind line about an opponent’s play makes your recap more honest and builds goodwill in the league.',
        ],
      },
      {
        heading: 'No shaming',
        body: [
          'Never name a player in connection with a mistake. A loss belongs to the team, and the recap should talk about it that way. If something needs to be said about a specific error, say it privately or leave it for coaching conversations, not a public page.',
          'Avoid sarcasm, nicknames the person has not chosen, and comments about bodies, age, or ability. Be especially careful with minors, and use first names or numbers only if guardians have agreed to public mentions.',
          'Read your draft once as if you were the player being written about. If any line would sting, change it. Then read it as a parent, an opponent, and a stranger.',
        ],
      },
    ],
    checklist: [
      { label: 'Lead with the result', detail: 'Teams, place, and final score in the first lines.' },
      { label: 'Add two or three key moments', detail: 'Pick plays that explain the game, not every point.' },
      { label: 'Verify names and numbers', detail: 'Check spellings and the scorebook before posting.' },
      { label: 'Choose a small stat set', detail: 'A few numbers recorded consistently beat many recorded badly.' },
      { label: 'Assign one scorekeeper', detail: 'Photograph the sheet and enter it the same day.' },
      { label: 'Track mentions over the season', detail: 'Make sure every player shows up in the writing.' },
      { label: 'Credit the opponent', detail: 'Include one fair, specific compliment.' },
      { label: 'Run the no-shaming read', detail: 'Reread as the player, the parent, and a stranger.' },
    ],
    wanted: [
      'Recap examples that are short, accurate, and kind.',
      'A one-page stat sheet for a sport you keep stats in.',
      'A method for tracking who has been mentioned during the season.',
      'Guidance on what stats are appropriate to share for youth teams.',
      'Tips for writing recaps quickly right after a game.',
    ],
    related: [
      { label: 'Baseball', href: '/baseball' },
      { label: 'Local', href: '/local' },
      { label: 'Intern program', href: '/intern' },
      ALL,
    ],
    tags: ['recap', 'stats', 'reporting', 'fairness', 'writing'],
  },
  {
    slug: 'beach-and-run-clubs',
    category: 'sports',
    title: 'How to organize a beach volleyball, run, or surf club',
    dek: 'Meeting points, waivers in general terms, heat and weather, and pacing that welcomes everyone.',
    audience: 'Organizers of informal outdoor groups, such as beach volleyball regulars, a weekly run club, or a surf meetup.',
    seat: 'open',
    minutes: 7,
    sections: [
      {
        heading: 'Pick a clear meeting point and rhythm',
        body: [
          'Choose a spot that is easy to find, has parking or transit nearby, and has a landmark people can describe. Give an exact meeting point, a start time, and a plain-language note on how to recognize the group. Share the same information in the same place every week.',
          'Keep the rhythm predictable. A regular day and time beat a clever schedule that nobody can remember. Say what happens if conditions are bad, such as high surf, poor air quality, or extreme heat, and tell people where cancellations will be posted.',
          'Check local rules for the places you meet. Beaches, parks, and public paths may have regulations about group size, organized events, parking, or permits. Ask the managing agency directly rather than guessing, and follow what they tell you.',
        ],
      },
      {
        heading: 'Waivers and liability in general terms',
        body: [
          'Outdoor sports carry real risk, and groups often use a waiver so participants acknowledge it. What a waiver should say, and whether it is enforceable, depends on where you are and what you do, so this guide cannot give legal advice. Talk to a qualified professional or the organization hosting you before you rely on one.',
          'Whatever you decide, be honest with participants. Tell them plainly that the activity involves risk, that they take part voluntarily, and that they are responsible for knowing their own limits. If you are using a facility, an insurer, or a club, ask what they require.',
          'Keep a simple record of who attends and any emergency contact they choose to share. Store it privately and use it only for the group. Tell newcomers how the information will be used.',
        ],
      },
      {
        heading: 'Weather, heat, and conditions',
        body: [
          'Plan around the conditions, not the calendar. Sun, heat, wind, fog, and cold all change what a safe session looks like. For summer and warm days, move activity earlier or later, add shade and water breaks, and remind people to hydrate, wear sun protection, and listen to their bodies.',
          'Learn the signs of heat illness and know what to do: stop activity, move to shade, cool the person, and call for emergency help when symptoms are serious. Keep this written down where the leaders can see it. For ocean activities, check surf and tide reports and local lifeguard guidance before each session.',
          'Have a rule that anyone can opt out or stop at any time. Make that rule loud and cheerful so people use it.',
        ],
      },
      {
        heading: 'Inclusive pacing and welcoming newcomers',
        body: [
          'For runs, offer more than one pace group and say so in the announcement. A no-drop policy, where a leader stays with the last person, tells beginners that they belong. Use loops or out-and-backs so faster runners can add distance while others turn around.',
          'For volleyball and similar games, rotate teams and partners so newer players get time with experienced ones. Explain the rules in a sentence or two and avoid jargon. For surf meetups, encourage people to paddle out in conditions that match their experience, and pair beginners with a friendly buddy.',
          'Greet every newcomer by name, introduce them to someone, and check in after the first session. Consider accessibility too: mention terrain, restroom access, and whether there is a quieter or shorter option.',
        ],
      },
      {
        heading: 'Keeping the group going',
        body: [
          'Share the load. Rotate who leads warm-ups, who brings the first aid kit, who counts heads at the end. Groups that depend on a single person tend to fade when that person gets busy.',
          'Communicate in one place and keep it friendly. A short post with the plan, the weather call, and the meeting point is enough. After the session, thank people and share a simple recap without naming anyone’s struggles.',
          'Ask for feedback once in a while and act on it. A club that listens to its members tends to grow by word of mouth.',
        ],
      },
    ],
    checklist: [
      { label: 'Pick an exact meeting point', detail: 'Include parking or transit notes and a way to recognize the group.' },
      { label: 'Set a predictable schedule', detail: 'Regular day and time, plus a plan for cancellations.' },
      { label: 'Check local rules', detail: 'Ask the managing agency about group size, events, and permits.' },
      { label: 'Get advice on waivers', detail: 'Consult a qualified professional or your hosting organization.' },
      { label: 'Plan for heat and conditions', detail: 'Shade, water, adjusted times, and written heat illness steps.' },
      { label: 'Offer multiple paces or levels', detail: 'Pace groups, rotating teams, and a no-drop approach.' },
      { label: 'Welcome newcomers by name', detail: 'Introduce them and check in after the first session.' },
      { label: 'Share leadership', detail: 'Rotate warm-ups, the first aid kit, and the head count.' },
    ],
    wanted: [
      'Local tips on which public spaces require permits or have group rules, with the agency to contact.',
      'Heat and air quality guidance you have used for outdoor sessions.',
      'Pace group formats that worked for mixed-ability run clubs.',
      'A welcome script for first-time volleyball or surf meetup attendees.',
      'Accessibility notes for common meeting spots, such as terrain and restrooms.',
      'Examples of waiver language from a qualified source, clearly labeled as such.',
    ],
    related: [
      { label: 'Local', href: '/local' },
      { label: 'Pickleball hub', href: '/pickleball' },
      ALL,
    ],
    tags: ['beach', 'volleyball', 'run-club', 'surf', 'safety', 'inclusive'],
  },
  {
    slug: 'run-a-pickleball-tournament-day',
    published: '2026-10-22',
    category: 'pickleball',
    title: 'How to run a small pickleball tournament day',
    dek: 'Formats, court math, check-in, and a friendly tone for a one-day club or community event that finishes on time.',
    audience: 'Club organizers and volunteers running a first or second small tournament, without a big staff or a sanctioning body behind them.',
    seat: 'open',
    minutes: 8,
    sections: [
      {
        heading: 'Pick a format you can finish',
        body: [
          'The most common small-event format is round robin pools that feed into a bracket. Players or teams are split into pools, everyone in a pool plays everyone else, and the top finishers advance to a single-elimination or short playoff round. Pools guarantee each entry several matches, which matters when people have given up a morning to be there.',
          'Choose the format from your constraints, not your ambitions. Count the courts you can reliably use, the hours you have them, and the entries you expect, then pick the simplest structure that fits. Games to a lower score, or a fixed time window, shorten the day. Write the scoring rules, tiebreakers, and any time caps in one short sheet before registration opens so nobody argues about them at the courts.',
          'Decide early whether you are running doubles with set partners, a rotating-partner social format, or both. Rotating formats are forgiving for mixed groups and make it easy to absorb a late dropout. Set partners feel more like a competition. Either is fine if the registration page says plainly which one it is.',
        ],
      },
      {
        heading: 'Divisions by skill and age',
        body: [
          'Divisions keep matches fun. Common splits are by skill level, by age band, or by both, and sometimes by format such as men’s, women’s, or mixed doubles. Keep the number of divisions small enough that each one has enough entries for a real pool. A division with only two or three entries is usually better merged with a neighbor than run on its own.',
          'Skill levels are self-reported in most community events, and self-ratings tend to run high. Describe each division in plain words on the registration page, and tell players the organizer may move an entry to a better-fitting division. Do that quietly and early, ideally before the day, rather than announcing it at the courts.',
          'If you use an outside rating system to place players, follow that system’s own published rules and be clear about whether it is required or just a guide. For age divisions, state the cutoff date you use so the answer is not a debate.',
        ],
      },
      {
        heading: 'Court and time math',
        body: [
          'Do the math on paper before you take a single registration. Estimate the length of one match, including warm-up, score calls, and the walk on and off, then add a buffer. Multiply matches per pool by the number of pools, divide by the number of courts, and see whether the total fits inside your court window with room to spare. Matches almost always run longer than the plan, so build in slack and a hard stop for the final round.',
          'Reserve your courts in writing with the facility or managing agency, and confirm what is allowed: setting up tables, posting a bracket, selling food, or charging an entry fee may each need permission. Rules vary by place, so ask directly. Know your backup if the courts are unavailable or unplayable.',
          'Assign courts and start times in a published schedule, and name a single person to run the clock. Stagger starts if check-in is slow. Plan lunch and rest windows for the people playing back-to-back matches, and keep the final matches on the best-lit, most spectator-friendly court if you have a choice.',
        ],
      },
      {
        heading: 'Check-in, referees, and line calls',
        body: [
          'Run check-in from one table with a printed roster, a pen, and a clear sign. Confirm names, divisions, and partners, hand out the schedule and court assignments, and collect any waiver or consent form the venue or your group requires. Have a short answer ready for the question everyone asks: where do I go and when.',
          'Most community events run on player-called lines, with players calling the ball on their own side of the net and giving the benefit of the doubt to the opponent when unsure. Say so at the start of the day, and name a floating volunteer who can step in when a call is disputed. Check the published rules your group is following for details on service, faults, and score calling, and print the few that matter most on the schedule sheet.',
          'Assign referees only if you have people who know the rules and are willing to stay neutral. A calm volunteer for the medal matches is a nice touch, but a poorly informed referee is worse than none. Remind everyone that the goal is a good match, and that a disputed point is not worth a lost afternoon.',
        ],
      },
      {
        heading: 'Heat, water, results, and keeping it friendly',
        body: [
          'Plan for weather before the day. Provide shade where you can, water that is easy to reach, and a place to sit. Tell players to bring their own water and sun protection, and build rest into the schedule. If the heat, air quality, or lightning makes play unsafe, have a stated rule for delaying, shortening, or stopping the event, and give one person the authority to call it.',
          'Post results where everyone can see them, on a bracket board, a shared page, or both. Update after each round, and keep the final standings clear and accurate. Share only what players agreed to share, such as names as they want them shown, and keep any information about minors minimal, with first names only unless a guardian says otherwise.',
          'The tone you set is what people remember. Welcome new players by name, thank volunteers out loud, and keep prizes modest. A short wrap-up with thanks, the results, and a note about the next event brings people back far more reliably than a perfect bracket.',
        ],
      },
    ],
    checklist: [
      { label: 'Choose a format', detail: 'Pools into a bracket, a rotating-partner social format, or a mix, with scoring and tiebreakers in writing.' },
      { label: 'Set divisions in plain words', detail: 'Skill and age bands described simply, with the age cutoff date stated.' },
      { label: 'Do the court and time math', detail: 'Matches times pools divided by courts, plus a buffer and a hard stop.' },
      { label: 'Get courts confirmed in writing', detail: 'Ask the facility what is allowed for tables, fees, food, and signage.' },
      { label: 'Set up one check-in table', detail: 'Printed roster, schedule, court assignments, and any required forms.' },
      { label: 'Explain line calls and rules', detail: 'State how calls work and name a volunteer for disputes.' },
      { label: 'Plan for heat and weather', detail: 'Shade, water, rest windows, and a named person who can pause play.' },
      { label: 'Post results and thank people', detail: 'Update the bracket each round and keep names and minors’ details private by default.' },
    ],
    wanted: [
      'Links to official parks department or facility pages on court reservations and event permits, with the date you checked them.',
      'Published heat-illness guidance for outdoor sports from public health or sports-medicine sources.',
      'The publicly posted rulebook of the organization whose rules your event follows, with its version or date.',
      'Your sample schedule or bracket sheet that kept a small event on time.',
      'A check-in script or sign-up form that worked for your tournament.',
      'Your tips that worked for handling a disputed line call without hard feelings.',
    ],
    related: [
      { label: 'Pickleball hub', href: '/pickleball' },
      { label: 'Local', href: '/local' },
      ALL,
      { label: 'Send material', href: '/guides/intake' },
    ],
    tags: ['pickleball', 'tournament', 'round-robin', 'brackets', 'organizer', 'heat-safety'],
  },
  {
    slug: 'coach-your-first-youth-team',
    published: '2026-10-22',
    category: 'sports',
    title: 'How to coach your first youth team',
    dek: 'A first practice plan, fair playing time, honest talks with parents, and the safety basics, for a volunteer who said yes.',
    audience: 'First-time volunteer coaches of young players, including parents who were handed a clipboard and a roster.',
    seat: 'open',
    minutes: 8,
    sections: [
      {
        heading: 'Before the first practice',
        body: [
          'Start by learning what your league requires. Most leagues have required training, background screening, and rules about practices and communication. Complete whatever safety and background training your league requires before you work with players, and ask the league contact if anything is unclear. Do not skip a step because you know the families.',
          'Get the practical details in order: the field or gym location, the roster, the schedule, the league rules for your age group, and the emergency contact and health information for each child. Bring a first aid kit, water, and a phone, and know the address of the practice site in case you need to call for help.',
          'Pick one or two goals for the season that are about the kids, not the standings. Learning the basics, enjoying the game, and wanting to come back next year are goals that every child can reach.',
        ],
      },
      {
        heading: 'A first practice plan',
        body: [
          'Keep the first practice short, active, and welcoming. A simple shape works well: arrive and learn names, a light warm-up game, two or three short skill stations, a small-sided game, and a team cheer or a short talk to finish. Plan for about an hour for younger players or whatever your league recommends, and expect to cut things if the group is restless.',
          'Use age-appropriate drills described in general terms. For younger children that means games that build movement, balance, throwing, kicking, or catching in a playful way, with lots of touches and very little standing in line. For older children you can add simple positions and short rules, but keep explanations to a sentence or two before they play. Ask your league or an experienced coach for the skill progressions that fit your sport.',
          'Learn every name quickly and use them. Ask a returning player to help demonstrate. End by telling each child something specific they did well, and tell families the plan for the next session.',
        ],
      },
      {
        heading: 'Playing time and fairness',
        body: [
          'Decide your playing time approach before the first game and tell parents what it is. Many recreational leagues have minimum playing time rules, so check yours first. If there is no rule, a simple plan that rotates positions and sitting-out turns keeps things fair and removes the temptation to play the strongest kids the most.',
          'Write the rotation down in advance rather than deciding in the moment. A visible lineup card, even a handwritten one, helps you stay consistent when the game gets tight. Give every child a chance at different positions, and avoid labeling kids by what they can or cannot do.',
          'Fair does not always mean identical. A child who is injured, tired, or struggling with the heat may need a different amount of time, and that is fine as long as the reason is the child’s well-being and not the scoreboard.',
        ],
      },
      {
        heading: 'Talking with parents',
        body: [
          'Hold a short meeting or send a welcome message before the first practice. Cover the schedule, the way you will communicate, your approach to playing time, what you expect of players, and how you would like parents to behave on the sideline. Ask them to cheer for all the kids and leave coaching and officiating to the people assigned to those jobs.',
          'Keep communication in one predictable place, and include a parent or guardian in any message with a child. Many youth organizations recommend avoiding private one-on-one messages between adults and minors, so follow your league policy. Share problems privately, not in the group chat.',
          'When a parent has a concern, listen first and set a time to talk away from the game and away from the kids. A 24-hour pause before discussing playing time or a bad day on the field helps both sides cool down. Involve the league if a conversation does not resolve or if you feel uncomfortable.',
        ],
      },
      {
        heading: 'Safety basics and keeping it fun',
        body: [
          'Check the field or gym before every session for hazards, hot surfaces, holes, and equipment that is not secure. Build water breaks into practice, and adjust the plan for heat, cold, poor air quality, or lightning. Learn your league policy on injuries and concussions, and follow it if a child is hurt, even when they say they are fine. Never leave a child alone at the end of practice, and know who is approved to pick up each player.',
          'Keep the focus on fun. Short explanations, lots of movement, and small games keep young players engaged better than long drills. Celebrate effort, kindness, and improvement. Let the kids laugh, and let mistakes be part of learning.',
          'Protect children’s privacy in anything you post. Use first names only, and do not publish photos or other details without guardian consent. When in doubt, ask the parents first and leave it out if you are still unsure.',
        ],
      },
    ],
    checklist: [
      { label: 'Complete the league’s required training', detail: 'Finish whatever safety and background steps your league requires before working with players.' },
      { label: 'Collect emergency information privately', detail: 'Contacts, health notes, and approved pickup people for each child, kept secure.' },
      { label: 'Pack the basics', detail: 'First aid kit, water, phone, roster, and the address of the practice site.' },
      { label: 'Plan a short first practice', detail: 'Names, warm-up game, a few skill stations, a small-sided game, and a close.' },
      { label: 'Set a playing time approach', detail: 'Check league rules, write the rotation down, and tell parents.' },
      { label: 'Send a welcome message to families', detail: 'Schedule, communication channel, expectations, and sideline behavior.' },
      { label: 'Follow adult-to-minor contact rules', detail: 'Include a parent or guardian in messages with children.' },
      { label: 'Get consent before posting anything', detail: 'First names only, and no photos without guardian consent.' },
    ],
    wanted: [
      'Links to official youth sports league coach training and safety requirement pages, with the date you checked them.',
      'Published heat-illness and concussion guidance for youth sports from public health or sports-medicine sources.',
      'Publicly posted league rules on minimum playing time for a specific age group, with the source and date.',
      'Your first practice plan that worked, with timings and the games you used.',
      'Your welcome message to parents that set the right tone.',
      'Your tips that worked for a hard conversation about playing time.',
    ],
    related: [
      { label: 'Baseball', href: '/baseball' },
      { label: 'Local', href: '/local' },
      ALL,
      { label: 'Send material', href: '/guides/intake' },
    ],
    tags: ['youth-sports', 'coaching', 'volunteer', 'practice-plan', 'safety', 'parents'],
  },
  {
    slug: 'organize-a-pickup-game',
    published: '2026-10-22',
    category: 'sports',
    title: 'How to organize a recurring pickup game',
    dek: 'Pick a time and place, set group chat norms, make fair teams, welcome newcomers, and keep a regular game alive.',
    audience: 'Players who want a steady pickup basketball, soccer, or volleyball game and are willing to be the person who sends the message.',
    seat: 'open',
    minutes: 6,
    sections: [
      {
        heading: 'Pick a time and a place',
        body: [
          'A pickup game survives on a predictable time. Choose a day and hour that most of your core group can make, and keep it the same each week. A fixed slot beats a perfect slot, because people build it into their routines. Start with a core group of enough players to run a game and a few more who can fill in.',
          'Public courts and fields are usually the easiest place to start, but rules vary. Some are first come, first served, some require a reservation or permit for organized groups, and some have posted hours or limits on group use. Check with the managing agency, such as the parks and recreation department or the school, and read the posted rules before you plan around a spot. If you need a permit or reservation, ask what is required and how far ahead.',
          'Have a backup location or an alternate day. When your usual court is full or closed, a plan B keeps the habit alive instead of letting one bad week end the game.',
        ],
      },
      {
        heading: 'Group chat norms',
        body: [
          'Use one group chat and set a few simple norms at the start. Post the day, time, and place, ask for a quick reply by a set time, and say what happens if too few people say yes. Keep messages short, and keep off-topic chatter out of the main thread if you can.',
          'Make the rules of the chat clear: respond honestly, cancel as early as you can, and do not add people without asking. Be careful with personal information. Share phone numbers only with consent and avoid posting anyone’s schedule or location outside the group.',
          'Decide who is the organizer, and make it easy to hand off. One person who sends the weekly message and handles the plan is enough, as long as someone else can step in when they are away.',
        ],
      },
      {
        heading: 'Make teams fairly',
        body: [
          'Fair teams make a game more fun for everyone. Simple methods work: captains alternate picks, players are split into balanced groups by whoever knows the group best, or teams are reshuffled each game so the same people do not always play together. Winners-stay formats work for busy courts, but cap the number of games in a row so no team is stuck on court all night.',
          'Keep the sorting friendly. Avoid public rankings or picking the same kids last. If skill levels are uneven, balance the teams by mixing stronger and newer players, and adjust rules lightly, such as limiting certain shots or rotating positions. Ask the group how competitive it wants to be, then follow what most people choose.',
          'Agree on how to settle disputes. A simple rule such as calling your own fouls honestly and replaying a contested point keeps small arguments from becoming big ones.',
        ],
      },
      {
        heading: 'Welcome newcomers',
        body: [
          'A game stays alive when new people feel welcome. Greet newcomers by name, ask about their experience, and put them with players who will include them. Tell them the house rules before the first whistle, such as how teams are picked and how fouls are called.',
          'Let people grow into the group. Invite a newcomer to the chat only after they have played once or twice and have said they would like to join, and ask before adding anyone. Keep an eye out for players who are quiet and make sure they get touches.',
          'Be clear about what level the game is. Describe it honestly, whether relaxed, competitive, or somewhere in the middle, so people can decide whether it fits them. A good fit is better than a larger roster.',
        ],
      },
      {
        heading: 'Injuries, weather, and keeping a regular going',
        body: [
          'Decide the weather rules in advance and write them in the chat. Name who makes the call and by what time, and consider heat, cold, lightning, wet surfaces, and air quality. When in doubt, cancel or move indoors and say so early. Take heat seriously by bringing water and taking breaks, and encourage anyone feeling unwell to stop.',
          'Injuries happen in pickup games. Agree on a pause when someone is hurt, keep a basic first aid kit in the bag, and know the address of the location in case you need to call for help. Players take part at their own risk, so encourage people to warm up and to sit out when something does not feel right. Ask a qualified source about waivers or insurance if your group is large or on a managed facility.',
          'To keep a regular going, rotate the organizer role, thank people for showing up, and review the plan every season. Check in on whether the time, place, and level still fit. A game that gets small adjustments tends to outlast one that never changes.',
        ],
      },
    ],
    checklist: [
      { label: 'Fix a day and time', detail: 'Choose a recurring slot most of the core group can make.' },
      { label: 'Check the location rules', detail: 'Ask the managing agency about reservations, permits, and group use.' },
      { label: 'Line up a backup spot', detail: 'Name an alternate court, field, or day.' },
      { label: 'Start one group chat', detail: 'Post the plan, ask for replies by a set time, and keep it short.' },
      { label: 'Choose a team-picking method', detail: 'Alternating captains, balanced groups, or reshuffles, with a cap on winners-stay.' },
      { label: 'Write a welcome script', detail: 'House rules and the level of the game, told to newcomers up front.' },
      { label: 'Set weather and injury rules', detail: 'Who calls it, by when, and what happens when someone is hurt.' },
      { label: 'Share the organizer role', detail: 'Name someone who can send the message when you are away.' },
    ],
    wanted: [
      'Links to official parks department or school district pages on court and field reservations and group use, with the date you checked them.',
      'Published heat-illness and air-quality guidance for outdoor exercise from public health sources.',
      'Public rules or guidance on pickup etiquette and self-officiating from a recreation department or sports association.',
      'Your team-picking method that worked for uneven skill levels.',
      'Your group chat norms that kept a pickup game going for a season.',
      'Your welcome script that worked for newcomers.',
    ],
    related: [
      { label: 'Local', href: '/local' },
      { label: 'Pickleball hub', href: '/pickleball' },
      ALL,
      { label: 'Send material', href: '/guides/intake' },
    ],
    tags: ['pickup', 'basketball', 'soccer', 'volleyball', 'community', 'weather'],
  },
];
