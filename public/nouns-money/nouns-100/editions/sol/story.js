/* Original story, script and character interpretations for the Sol edition. */
window.PREMIERE = {
  version: 1,
  title: 'Nouns World Premiere: The Missing Last Reel',
  author: 'GPT-6.1 Sol',
  cast: [
    {id:1,name:'Cam',role:'Director of unnecessary drama',flaw:'Frames every crisis as a heroic close-up, including a lost umbrella.',heart:'Wants to make something worth sharing. Needs to let somebody else choose the shot.',line:'“Can we panic again? I missed the light.”'},
    {id:2,name:'Grain',role:'Keeper of the almost-perfect frame',flaw:'Can spot one speck of dust in a storm and will stop to name it.',heart:'Remembers tiny details. Learns that a scuff can prove someone was there.',line:'“That scratch has terrible timing.”'},
    {id:3,name:'Splice',role:'Editor with separation anxiety',flaw:'Cannot cut a scene without giving it a farewell speech.',heart:'Can connect anything. Must learn that leaving something out is also an act of care.',line:'“One more version. A short one. Probably.”'},
    {id:4,name:'Blue Hour',role:'Lighting poet, logistical hazard',flaw:'Waits for the perfect atmosphere until everyone else needs a coat.',heart:'Makes ordinary corners beautiful. Is learning to use the light that is here.',line:'“The mood is nearly ready.”'},
    {id:5,name:'Scout',role:'Location scout for the long way round',flaw:'Brings three routes to every destination and a fourth to the conversation.',heart:'Finds what others walk past. Must eventually stop exploring and knock.',line:'“It is only a detour if we return.”'},
    {id:6,name:'Wide Eyes',role:'Audience of one, volume of forty',flaw:'Reacts to the twist before anybody has explained the setup.',heart:'Believes a first attempt deserves a real audience. Is learning to listen past the surprise.',line:'“I knew it! What did I know?”'},
    {id:7,name:'Double',role:'Stunt double for everyday errands',flaw:'Rehearses a chair pull as if the chair has signed a waiver.',heart:'Makes risk look manageable. Sometimes the brave thing is asking for a hand.',line:'“I have trained for stairs.”'},
    {id:8,name:'Index',role:'Archivist of the obvious in hindsight',flaw:'Files a clue so accurately that nobody can find it without a clue.',heart:'Knows where the story has been. Needs a shelf marked RIGHT NOW.',line:'“It is under M. For Misfiled.”'},
    {id:9,name:'Twinkle',role:'Publicist of the not-yet-happened',flaw:'Writes the standing-ovation announcement before locating the chairs.',heart:'Makes people feel invited. Must learn to promise an evening, not a miracle.',line:'“World premiere. World approximately defined.”'},
    {id:10,name:'Ghostlight',role:'Caretaker of the last lamp',flaw:'Fixes problems so quietly that nobody notices help is needed.',heart:'Keeps a seat for the late arrival. Is learning to take a seat of their own.',line:'“I was here. I can say that louder.”'}
  ],
  episodes: [
    ['The Missing Last Reel','Cam + the whole club','The final reel vanishes minutes before the club’s first premiere. A search across Offscreen uncovers a harder problem: nobody ever filmed an ending. You decide what the audience gets instead.','Playable pilot'],
    ['The Forty-First Chair','Ghostlight + Double','Forty mismatched chairs, forty invitations, one late arrival. Double engineers an absurd folding balcony while Ghostlight quietly gives up their own seat. The room must learn who has been standing all night.','Premise'],
    ['A Festival of One','Twinkle + Wide Eyes','Twinkle prints a festival schedule that attracts exactly one guest: Wide Eyes, already on the committee. To earn one honest reaction, the club has to stop treating the empty seats like a bad review.','Premise'],
    ['The Uncut Sandwich','Splice + Grain','A silent lunch film has grown to four hours because Splice cannot part with a single bite. Grain discovers the best moment in an accidental cut, and saving the film means losing their favorite scene.','Premise'],
    ['Blue Hour, All Night','Blue Hour + Scout','The perfect rooftop sunset is five hours away and dawn is on its way. Scout offers increasingly scenic shortcuts to yesterday until a plain work lamp gives Blue Hour a better idea.','Premise'],
    ['Please Hold Your Thunder','Double + Ghostlight','Double promises a spectacular live storm made from a tin sheet. The loudest show in Offscreen meets Ghostlight’s need for one quiet night. They build a thunderstorm you can see without hearing.','Premise'],
    ['Filed Under Tomorrow','Index + Cam','Index finds a programme for a screening that has not happened yet—because Cam approved the wrong print file. Their detective epic turns into an apology tour through every shop that put up the poster.','Premise'],
    ['The Reverse Red Carpet','Grain + Twinkle','Twinkle rolls out a red carpet that leads straight away from the entrance. Grain cannot bear to move its immaculate folds, so they follow it and discover who has been too shy to come inside.','Premise'],
    ['No Spoilers, Please','Wide Eyes + Splice','Wide Eyes volunteers to introduce a mystery and accidentally reveals everything except the title. Splice builds a trailer out of the audience’s confused guesses. The surprise is what everyone notices on a second look.','Premise'],
    ['The Smallest World Premiere','The whole club','The neighborhood festival loses its screen to a leaking roof. Every object left by the season becomes part of a street-corner show. Cam finally steps out of the frame, and Ghostlight calls the first cue.','Premise']
  ],
  items:{'paper-screen':'A roll of paper, slightly heroic.','brass-clip':'A brass clip with excellent grip.','cue-strip':'A projection cue strip, readable backwards.','blank-card':'One gloriously unprinted invitation.','wide-shot':'A wide shot with room for everyone.','faces':'Ten unprepared close-ups.','quiet-show':'A quiet show with a lamp for every row.','big-show':'A very small monster with a large shadow.','plain-truth':'An honest note on the door.','grand-truth':'An unnecessarily grand honest note.'},
  scenes:{
    arrival:{place:'lobby',time:'00:17',kicker:'COLD OPEN / A PROMISE WITH A HOLE IN IT',title:'The case of the absent ending',cast:[1,9,3],prop:'ticket',text:[
      'The Between smells of warm dust and raincoats. Forty chairs face a white screen. Twinkle has written WORLD PREMIERE on a banner too long for the lobby; WORLD wraps around a pipe.',
      '“The world has been notified,” Twinkle says. “Locally.”',
      'Cam squares up an imaginary camera. “Tonight, we show Offscreen who we are.” Splice arrives carrying two reels and a silence that is much heavier.',
      '“There are three acts,” Splice says. “I have brought the first two.”',
      'Index finds a handling slip on the floor: LAST REEL — KEEP COOL, KEEP DRY. Scout points toward the alley. Blue Hour points toward the roof. Grain points out that the slip is already damp.',
      'Cam reaches for a director’s chair. There is no chair. “All right. Who leads?”'
    ],choices:[{label:'Follow Scout into the alley',note:'A chase, at walking speed.',next:'alley'},{label:'Let Index follow the paper trail',note:'A detective story with filing problems.',next:'archive'},{label:'Take Blue Hour to the roof',note:'The light is suspiciously good up there.',next:'roof'}]},
    alley:{place:'alley',time:'00:23',kicker:'ROUTE A / THE LONG WAY ROUND',title:'An alley with ambitions',cast:[5,7,2],prop:'map',text:[
      'Scout unfolds a map so large that Double has to hold the neighborhood up at one corner. Three dotted lines lead behind the cinema. All three end in a drawing of the same bin.',
      '“A landmark,” Scout explains. “Not the destination.”',
      'Under a collapsed paper awning, something circular catches the light. Above it, an exterior stair climbs safely to the roof. Grain notices a brass clip by the drain, gripping a corner of the handling slip.',
      'Double stretches. “I have trained for stairs.” Nobody asks when. A gust lifts the awning and reveals that the circular thing is an advertisement for soup.',
      'There are still two useful things here. The problem is choosing one before Scout adds another route.'
    ],choices:[{label:'Roll up the awning paper',note:'It might become a screen. It is definitely no longer an awning.',next:'canopy',gain:'paper-screen'},{label:'Pick up the brass clip',note:'Follow the instruction caught in its teeth.',next:'clip',gain:'brass-clip'}]},
    canopy:{place:'alley',time:'00:28',kicker:'FOUND OBJECT / PAPER SCREEN',title:'The rescue of a former roof',cast:[5,7,2],prop:'paper',text:[
      'Double prepares an elaborate tumble to retrieve the paper. Grain simply lifts it off a hook. Double bows anyway. “A successful rehearsal.”',
      'On the underside is a note in Ghostlight’s small, neat writing: LEAK ABOVE BOOTH. COAT BOX MOVED UPSTAIRS.',
      'Scout marks the exterior stair with an enormous star. Grain smooths a wrinkle in the paper and then, with considerable effort, allows the wrinkle to remain.',
      'They carry the roll upstairs together. For the first time tonight, the map is folded away before the destination arrives.'
    ],choices:[{label:'Climb the ordinary, undramatic stair',note:'Double will provide the drama.',next:'found'}]},
    clip:{place:'alley',time:'00:28',kicker:'FOUND OBJECT / BRASS CLIP',title:'Grip is a kind of commitment',cast:[2,5,7],prop:'clip',text:[
      'The brass clip releases a second scrap: COAT BOX — ROOF LANDING. DRY FOR NOW. Grain holds the pieces together so carefully that the rain has to go around them.',
      '“Our mystery has an address,” says Scout, sounding a little disappointed.',
      'Double offers to vault a perfectly serviceable stair rail. Grain hands over the clip instead. “Carry the important object.”',
      'Double takes it with the solemnity of a stunt professional entrusted with a very small stunt. The three head up the exterior stair. Scout chooses the route already under their feet.'
    ],choices:[{label:'Go to the roof landing',note:'Keep the clip. It has earned a supporting role.',next:'found'}]},
    archive:{place:'booth',time:'00:23',kicker:'ROUTE B / THE PAPER TRAIL',title:'Filed under very nearly helpful',cast:[8,3,10],prop:'tin',text:[
      'Index opens a cupboard marked TEMPORARY PERMANENT STORAGE. There are two smaller cupboards inside. Splice whispers that the arrangement is emotionally familiar.',
      'Ghostlight keeps one hand on a drip tray under the ceiling. Nobody asks about it. Index locates a ledger: the final can was moved during a leak. The destination field says SEE REVERSE.',
      'The reverse contains a catalogue of reverses. Beneath it are a projection cue strip and an unprinted invitation. On the invitation, a pencil arrow points up.',
      '“We could keep interpreting,” Ghostlight says, “or we could ask who moved the box.”',
      'Index pauses. “An oral source. How adventurous.”'
    ],choices:[{label:'Take the cue strip and follow the arrow',note:'Index gets to keep one useful document.',next:'labels',gain:'cue-strip'},{label:'Put the files down and ask Ghostlight',note:'A question can be faster than a catalogue.',next:'question',gain:'blank-card'}]},
    labels:{place:'booth',time:'00:28',kicker:'FOUND OBJECT / CUE STRIP',title:'The other side of the label',cast:[8,3,10],prop:'strip',text:[
      'Index holds the strip to the light. Read backwards, DRY STORAGE becomes a perfectly ordinary instruction pointing to the roof landing.',
      '“I was just about to say that,” Ghostlight says. Index lowers the strip. “I was just about to listen.”',
      'Splice begins a farewell speech to the cupboard. Ghostlight shuts it halfway through the second paragraph. “It will still be here when we return.”',
      'They leave the drip tray in place and carry the cue strip upstairs. Index adds a new category to the ledger: THINGS A FRIEND COULD HAVE TOLD ME.'
    ],choices:[{label:'Follow Ghostlight upstairs',note:'The person, rather than the paperwork.',next:'found'}]},
    question:{place:'booth',time:'00:28',kicker:'FOUND OBJECT / A BLANK INVITATION',title:'An answer with room around it',cast:[10,8,3],prop:'card',text:[
      '“I moved it,” Ghostlight says. “To the coat box on the roof landing. The cupboard leaks.”',
      'Index looks at the drip tray, then at Ghostlight’s wet sleeve. “Have you been holding that all night?”',
      '“Not all night. I changed hands.”',
      'Splice finds a shelf for the tray. It takes three seconds and no committee. Ghostlight unfolds their hand, surprised by its freedom.',
      'Index takes the blank invitation. “For a new label?” Splice asks. “For a question I have not thought of yet,” Index says. They head upstairs with Ghostlight in front.'
    ],choices:[{label:'Let Ghostlight show the way',note:'Some sources deserve a credit.',next:'found'}]},
    roof:{place:'roof',time:'00:23',kicker:'ROUTE C / A HIGHLY LOCAL ADVENTURE',title:'The light is nearly ready',cast:[4,6,9],prop:'lamp',text:[
      'Blue Hour opens the roof door like a curtain. Rain has stopped. The city glows at the edges. Wide Eyes gasps before looking. “Excellent reveal. What am I seeing?”',
      '“The final minutes of a remarkable blue,” Blue Hour says. Twinkle checks the premiere banner through the skylight. It now reads ORLD.',
      'A paper roll catches on a railing. Beneath a brass clip, Ghostlight has attached a note to a coat box on the sheltered landing: REELS MOVED HERE. BOOTH LEAKS.',
      'Blue Hour wants to wait until the box looks more mysterious. Wide Eyes is ready to announce a discovery. Twinkle has found a pen. One of these impulses must briefly lose.'
    ],choices:[{label:'Catch the paper roll before it blows away',note:'Save the practical prop before the perfect picture.',next:'breeze',gain:'paper-screen'},{label:'Take the clip and read the actual note',note:'Sometimes the clue is just written down.',next:'rig',gain:'brass-clip'}]},
    breeze:{place:'roof',time:'00:28',kicker:'FOUND OBJECT / PAPER SCREEN',title:'A supporting roll',cast:[4,6,9],prop:'paper',text:[
      'Wide Eyes catches the paper against the railing. Blue Hour reaches for an imaginary viewfinder, then remembers they have two available hands and uses both.',
      '“The light was perfect,” Twinkle says. “You missed it.”',
      'Blue Hour looks at the three of them holding the roll in a crooked little row. “I do not think I did.”',
      'They unhook the paper and step back into the dry landing. Wide Eyes gently knocks on the coat box before opening it. “For suspense,” they explain. This time the gasp waits until the lid is up.'
    ],choices:[{label:'Open the coat box',note:'The suspense has been very considerate.',next:'found'}]},
    rig:{place:'roof',time:'00:28',kicker:'FOUND OBJECT / BRASS CLIP',title:'A review from the weather',cast:[9,4,6],prop:'clip',text:[
      'Twinkle reads the note out loud. It is not a review, a prophecy, or an endorsement. It is an explanation of a leaking roof.',
      '“Can I say the film survived a tempest?”',
      '“You can say the box stayed dry,” Blue Hour replies.',
      'Twinkle crosses out an entire press release and writes DRY BOX, GOOD FRIEND. Wide Eyes applauds the shorter version.',
      'Blue Hour removes the brass clip and hands it to Twinkle. “For holding the thing we actually have.” Together they lift the coat box lid while the extraordinary blue becomes an ordinary, useful night.'
    ],choices:[{label:'Look inside the dry box',note:'A modestly successful expedition.',next:'found'}]},
    found:{place:'booth',time:'00:36',kicker:'THE REVEAL / AN EXTREMELY SHORT LAST ACT',title:'The ending was here all along. Sort of.',cast:[1,3,8],prop:'reel',text:[
      'The can is safe. The label says LAST REEL. Back in the booth, Splice threads it with ceremonial care. Cam gathers everyone around.',
      'On the screen: a white countdown, then white leader, then more white leader. Splice stops the machine before the loose end can slap.',
      'Index consults the shooting log. “Act three: the club opens the doors. Status: we will do it tonight.”',
      'Ten faces turn toward Cam. Cam studies an imaginary camera angle and, for once, puts it down.',
      '“We were so busy planning our big entrance that we never filmed ourselves letting anyone in.”',
      'From the lobby comes the sound of a chair being set down. A programme rests on it. An audience does not need to be seen to be waiting.',
      'There is time for a choice. There is no time for a perfect one.'
    ],choices:[{label:'Finish the film with what you have',note:'A tiny edit can make a real ending.',next:'reconstruct'},{label:'Turn the blank ending into a live shadow show',note:'Let the room become the final scene.',next:'shadows'},{label:'Tell the audience the truth',note:'An unfinished thing can still be an invitation.',next:'honest'}]},
    reconstruct:{place:'booth',time:'00:41',kicker:'THE FINAL CUT / WHAT BELONGS IN THE FRAME?',title:'One last shot',cast:[1,2,3],prop:'camera',text:[
      'Grain lays out the unused takes. A door sticking. A broom entering frame before its owner. Cam practicing a welcome to a coat stand.',
      '“All mistakes,” Cam says. Grain looks closer. “All evidence.”',
      'Splice runs the film through by hand. The mistakes make a rhythm: a door opens, a broom enters, someone makes room. They already have the beginning of an ending.',
      '“One last shot,” Cam says. “We shoot it now. No speeches.”',
      'Splice looks relieved, then bereaved on behalf of the speeches. Grain checks the camera. The club can show the empty chair they made together, or the people who are suddenly afraid to sit in it.'
    ],choices:[{label:'Film the whole room, leaving a chair open',note:'A wide shot with room for one more.',next:'edit',gain:'wide-shot'},{label:'Film ten honest, unprepared faces',note:'Nobody has time to arrange a heroic expression.',next:'edit',gain:'faces'}]},
    edit:{place:'booth',time:'00:49',kicker:'THE FINAL CUT / LET IT RUN',title:'The mercy of one fewer version',cast:[3,2,1],prop:'strip',text:[
      'Splice joins the final shot. A little join flashes white. Grain reaches toward it and stops. “Leave it. That is where we were here.”',
      'Cam is halfway through asking for another take. Ghostlight calls from the doorway: “There is a seat for you.”',
      'The sentence lands harder than an ovation. Cam nods. Splice labels the offcuts MAYBE LATER and, with visible effort, shuts the tin.',
      'There is one cue left: start the projector. A machine can do that. Staying to watch the result will take all ten of them.'
    ],choices:[{label:'Follow the cue strip into the last shot',note:'The paper trail earns its closing credit.',next:'end-film',requires:'cue-strip',tag:'cue'},{label:'Let the sound of the room be the cue',note:'The film can breathe at the audience’s pace.',next:'end-film',tag:'room'}]},
    shadows:{place:'auditorium',time:'00:41',kicker:'THE LIVE ENDING / MAKE BELIEVE, TOGETHER',title:'A monster of manageable proportions',cast:[7,4,6],prop:'lamp',text:[
      'Double produces a paper monster from a pocket. It has six feet and a very anxious expression. “Emergency spectacle.”',
      'Blue Hour turns one safe work lamp toward a sheet. Wide Eyes watches the monster’s shadow grow as Double moves it closer to the light.',
      '“It is enormous!” Wide Eyes says. Double takes one step back. “Now it has a sensible commute.”',
      'Ghostlight marks a clear path behind the chairs so nobody trips over the cable. The trick is only paper, a lamp, and distance. That makes it available to everyone.',
      'They need a final scene. Does the little monster make a grand entrance, or does it discover a quiet place to sit?'
    ],choices:[{label:'Let the monster find a quiet seat',note:'Small shadows. A warm lamp. Room to arrive.',next:'shadowquiet',gain:'quiet-show'},{label:'Give it the biggest entrance in Offscreen',note:'Maximum shadow. Minimum actual monster.',next:'shadowbig',gain:'big-show'}]},
    shadowquiet:{place:'auditorium',time:'00:48',kicker:'LIVE / HOLD THE QUIET',title:'A small place on a large screen',cast:[10,7,4],prop:'chair',text:[
      'Double lowers the monster until it is no taller than a ticket. Blue Hour places a paper chair beside it. Ghostlight moves the lamp slowly: a tiny sunrise crosses the screen.',
      'The monster waits. A second chair arrives. Then a third. Nobody is chased, rescued, or revealed to be secretly important.',
      '“It is just sitting,” Wide Eyes whispers.',
      '“With company,” Ghostlight says. “That changes the scene.”',
      'The paper chair wobbles. Double catches it in full view of the screen. A hand has entered the picture. It belongs there.'
    ],choices:[{label:'Leave the hand in the picture',note:'Let the audience see how the kindness works.',next:'end-shadow',tag:'quiet'}]},
    shadowbig:{place:'auditorium',time:'00:48',kicker:'LIVE / A TRIUMPH OF RELATIVE SCALE',title:'The terror of the tiny lobby',cast:[7,6,9],prop:'monster',text:[
      'The monster fills the screen. Twinkle narrates: “A creature beyond all known dimensions!” Double moves it back an inch. It becomes the size of a kettle.',
      '“Dimensions have been updated,” Twinkle says.',
      'Wide Eyes supplies the thunder by gently shaking a tin of ticket stubs. The monster approaches a cardboard cinema. At the door it folds six feet into a polite little queue.',
      'The grand entrance stops. The monster knocks.',
      'Ghostlight opens the model’s tiny door. Double places the creature inside and draws back the lamp. All that enormous effort was for a small, reasonable wish.'
    ],choices:[{label:'Open the real cinema door too',note:'The spectacle has made its point.',next:'end-shadow',tag:'big'}]},
    honest:{place:'lobby',time:'00:41',kicker:'THE OPEN INVITATION / SAY WHAT IS TRUE',title:'The premiere of a nearly',cast:[9,1,10],prop:'card',text:[
      'Twinkle reaches for a euphemism large enough to hide in. “An exclusive preview of our—”',
      '“Unfinished film,” Cam says.',
      'The words do not break the marquee. The chairs remain chairs. Ghostlight brings out a tray of warm cups and sets one down for Twinkle.',
      '“We can show the first two acts,” Cam says. “Then we can ask what people noticed. They do not have to fix it for us.”',
      'Twinkle turns the premiere poster over. Its back is wonderfully empty. At last, a publicity space with no obligation to be impressive.',
      'The invitation needs one honest sentence. Twinkle can write it plainly or keep a little theater in the truth.'
    ],choices:[{label:'Write: “We made a beginning. Come see.”',note:'A small invitation you can actually keep.',next:'confessquiet',gain:'plain-truth'},{label:'Write: “World premiere of our magnificent almost.”',note:'A flourish, with the truth in the same size type.',next:'confessgrand',gain:'grand-truth'}]},
    confessquiet:{place:'lobby',time:'00:48',kicker:'OPEN DOOR / NO SMALL PRINT',title:'A beginning with its coat still on',cast:[1,10,9],prop:'ticket',text:[
      'Cam hangs the plain invitation at eye level. Ghostlight places a pencil beside the programmes, then adds a second sign: YOU MAY ALSO JUST WATCH.',
      'Twinkle reads both. “Should I add a deadline?”',
      '“For sitting?” Ghostlight asks.',
      'Twinkle pockets the pen. Cam takes the director’s chair from behind the desk and sets it in the audience row. It looks like a normal chair from there.',
      'The screen is ready for two acts and an honest pause. The last act can wait until the club has lived it.'
    ],choices:[{label:'Sit down with everyone else',note:'Being present is enough work for tonight.',next:'end-honest',tag:'plain'}]},
    confessgrand:{place:'lobby',time:'00:48',kicker:'OPEN DOOR / THE TRUTH GETS A MARQUEE',title:'A magnificent almost',cast:[9,6,1],prop:'banner',text:[
      'Twinkle writes ALMOST with the largest letters on the poster. Wide Eyes points at it. “Is that the twist?”',
      '“That is the promise.”',
      'Cam holds the poster while Twinkle tapes the corners. There is no fine print. No announcement of an ovation. Just an evening that knows what it is.',
      'Wide Eyes tears a spare programme into three bookmark strips. “For everyone who wants to remember where we stopped.”',
      'Twinkle adds a last line: YOU DO NOT OWE US AN ENDING. Then, finally out of things to announce, they go inside.'
    ],choices:[{label:'Let “almost” have its opening night',note:'A real promise is worth a very large poster.',next:'end-honest',tag:'grand'}]},
    'end-film':{place:'auditorium',time:'01:02',kicker:'ENDING 01 / THE FILM THAT LEFT ROOM',title:'A good place to cut',cast:[1,2,3,8,10],prop:'reel',ending:'The Film That Left Room',text:[
      'The first two acts run. The door sticks. The broom arrives early. Then the join flashes: a single bright blink, a visible seam between the plan and the evening that actually happened.',
      {if:'wide-shot',yes:'In the final wide shot, an empty chair waits beside the club. It does not look like an absence. It looks like a place being kept.',no:'Ten unprepared faces fill the final shot. One looks away. One almost laughs. Cam is the last to stop directing. Nobody looks like a hero, which is why they look like friends.'},
      {tag:'cue',yes:'Index follows the rescued cue strip. For once, every label points toward something happening right now.',no:'Splice lets the sound of the room carry the cut. A shifted coat, a breath, the projector’s little clatter: enough of a score.'},
      'When the image ends, Cam stays seated. Grain leaves the scratch alone. Splice closes the tin without adding a subtitle.',
      'Twinkle’s programme now has a final credit: MADE IN THE COMPANY OF OTHERS. A world premiere, locally defined. A whole evening, at last.'
    ]},
    'end-shadow':{place:'auditorium',time:'01:02',kicker:'ENDING 02 / THE ROOM THAT BECAME THE FILM',title:'Cast a little company',cast:[7,4,6,9,10],prop:'lamp',ending:'The Room That Became the Film',text:[
      {if:'quiet-show',yes:'The little monster sits with its new neighbors. When Ghostlight lifts the lamp, their shadows share one enormous patch of light. There is no chase. Wide Eyes forgets to wait for one.',no:'The enormous monster fits inside the cardboard cinema. Wide Eyes makes one last tiny thunderclap with the ticket tin. Double bows so deeply that the monster bows too.'},
      {if:'paper-screen',yes:'The rescued awning paper becomes the screen. Its wrinkle cuts across the moon like a cloud. Grain, in the second row, decides the weather is part of the picture.',no:'The cinema’s white screen becomes a stage. Ghostlight steadies the paper set on a table, and Double learns to trust a helping hand.'},
      'Blue Hour turns the lamp so the makers’ own shadows enter the picture. No hidden mechanism. No perfect illusion. Ten friends and an extremely practical beam of light.',
      'Ghostlight is about to step aside when Double makes room at the lamp. “You can take the last cue.”',
      'Ghostlight takes it. The monster waves. Twinkle prints a programme credit that is finally accurate: LIVE, WITH VISIBLE HELP.'
    ]},
    'end-honest':{place:'lobby',time:'01:02',kicker:'ENDING 03 / THE INVITATION THAT MEANT IT',title:'To be continued, in good company',cast:[1,9,10,6,8],prop:'card',ending:'The Invitation That Meant It',text:[
      'Two acts play. Then the projector stops, deliberately, on a blank field. Cam stands without finding an angle.',
      '“That is what we have. Thank you for being here while we make the rest.”',
      {if:'plain-truth',yes:'Outside, the small invitation gets a new pencil line: WE SAW A BEGINNING. A plain sentence, with enough space beneath it for another night.',no:'Outside, the magnificent ALMOST poster gains a little hand-drawn chair. Twinkle leaves the embellishment unsigned. Somebody else has entered the picture.'},
      'No one is asked to grade the evening. A few paper scraps collect in the empty can: a drawing of the door, a question about the broom, one careful word—again.',
      'Ghostlight sits down before the cups are all collected. Index leaves the scraps unfiled until tomorrow. Cam folds a programme to mark the exact place they stopped.',
      'The premiere did not finish the film. It gave the club a reason to return. On the back of the programme, Twinkle writes: ADMIT ONE MORE TRY.'
    ]}
  }
};
