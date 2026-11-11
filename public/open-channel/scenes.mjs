// Original branching fiction for Open Channel. Every response is authored.
export const SCENES = [
  {
    id: 'last-signal',
    number: '01',
    title: 'Last Signal',
    character: 'Mara',
    role: 'Desert radio host',
    tagline: 'One tower. One last transmission.',
    description: 'A desert station is closing at dawn. Help Mara decide what its last signal should carry.',
    color: '#d7eaa6',
    nodes: {
      start: {
        text: 'This is Mara, at the end of the dial. They take the tower down at sunrise. I have time for one last dedication. Who are we speaking to?',
        choices: [
          { label: 'The people leaving town.', next: 'leaving' },
          { label: 'The people staying behind.', next: 'staying' },
        ],
      },
      leaving: {
        text: 'Three pairs of headlights have slowed outside. Maybe they heard us. The diner has one pot of coffee left, and I have one record without a scratch. What do they need?',
        choices: [
          { label: 'A reason to stop for a minute.', next: 'coffee' },
          { label: 'A song to take with them.', next: 'road' },
        ],
      },
      staying: {
        text: 'I asked who was still awake. One porch light blinked across the highway. Then another. There are more of us here than the silence suggested. What should we send back?',
        choices: [
          { label: 'Ask everyone to light a window.', next: 'windows' },
          { label: 'Keep the line open together.', next: 'quiet' },
        ],
      },
      coffee: {
        text: 'The headlights go dark. Someone unlocks the diner. By the time our signal fades, six strangers are arguing gently about the best road east. I leave the microphone and take the last empty stool.',
        ending: 'One More Cup',
        choices: [],
      },
      road: {
        text: 'The record catches. The headlights start moving, one after another, carrying the same chorus into different distances. I let the needle finish. For three minutes, this little town has been everywhere.',
        ending: 'A Moving Constellation',
        choices: [],
      },
      windows: {
        text: 'Lights come on above the garage, behind the market, in a house I thought was empty. The tower goes quiet. Across the highway, the town keeps broadcasting.',
        ending: 'Home Frequency',
        choices: [],
      },
      quiet: {
        text: 'I leave the microphone open. A kettle clicks off. A truck passes. Somewhere, a dog settles down. Nobody calls. Nobody needs to. This is Mara, signing off from a place that is still here.',
        ending: 'Room for the Quiet',
        choices: [],
      },
    },
  },
  {
    id: 'greenhouse',
    number: '02',
    title: 'The Small Garden',
    character: 'Jun',
    role: 'Lunar greenhouse keeper',
    tagline: 'A little room for something alive.',
    description: 'Jun has one spare growing tray on a lunar outpost. Choose what this small garden will become.',
    color: '#bdcaff',
    nodes: {
      start: {
        text: 'Jun here. All the useful crops are accounted for. This last tray is ours. I found two seed envelopes in a coat from Earth: a tiny tomato, and a flower that opens after dark.',
        choices: [
          { label: 'Plant the little tomato.', next: 'tomato' },
          { label: 'Plant the night flower.', next: 'flower' },
        ],
      },
      tomato: {
        text: 'Six weeks later, we have one red tomato. Everyone has been pretending not to watch it. The incoming crew asks whether we need anything. We could invite them to dinner, or send them seeds.',
        choices: [
          { label: 'Make room at the table.', next: 'supper' },
          { label: 'Send seeds to the next outpost.', next: 'seeds' },
        ],
      },
      flower: {
        text: 'The bud is ready. Tonight, the observation deck opens for the arriving crew. I can carry the tray upstairs, or leave it here and turn off the work lights. Where should its first night happen?',
        choices: [
          { label: 'Upstairs, with everyone watching.', next: 'welcome' },
          { label: 'Here, in a little darkness.', next: 'dark' },
        ],
      },
      supper: {
        text: 'We slice the tomato so thin you can see the lamp through it. Twelve people, twelve pieces. Nobody mentions how small their share is. For the first time, the outpost smells like somebody expected us.',
        ending: 'First Supper',
        choices: [],
      },
      seeds: {
        text: 'I save the seeds in an envelope marked: Something unnecessary. Please grow it. Months later, a photograph comes back from the next outpost. A red dot in a green room. Our garden has learned to travel.',
        ending: 'Cargo of Morning',
        choices: [],
      },
      welcome: {
        text: 'We dim the observation deck. The flower opens while Earth hangs blue beyond the glass. Nobody takes the first photograph. We just watch. Then someone asks whether the next ship could bring a second tray.',
        ending: 'A Place to Arrive',
        choices: [],
      },
      dark: {
        text: 'The petals unfold in the quiet. I sit beside the tray until my shift is over. Tomorrow I will tell everyone it bloomed. Tonight, one beautiful thing happens without needing an audience.',
        ending: 'A Private Moon',
        choices: [],
      },
    },
  },
  {
    id: 'returns-desk',
    number: '03',
    title: 'The Returns Desk',
    character: 'Ivo',
    role: 'Harbor lost-and-found keeper',
    tagline: 'Some things arrive without an owner.',
    description: 'At closing time, Ivo finds two unclaimed objects in a seaside lost-and-found. Give one a new destination.',
    color: '#a9dfdb',
    nodes: {
      start: {
        text: 'Ivo, harbor returns desk. The last ferry has gone. Two things remain on my counter: a brass compass, and a letter addressed to Whoever needs a place. Which one should we deal with before closing?',
        choices: [
          { label: 'Take a look at the compass.', next: 'compass' },
          { label: 'Open the letter.', next: 'letter' },
        ],
      },
      compass: {
        text: 'There is an inscription: For the journey after the journey. No name. The needle settles toward the headland. I have worked here twenty years and never walked to its end. What do you think?',
        choices: [
          { label: 'Take that walk tonight.', next: 'headland' },
          { label: 'Leave it for the next traveler.', next: 'traveler' },
        ],
      },
      letter: {
        text: 'It says: The blue house above the harbor has an empty room. Come before the kettle cools. No date, no signature. Its window is lit. Should I take the letter there, or write something back?',
        choices: [
          { label: 'Knock at the blue house.', next: 'house' },
          { label: 'Write an invitation in return.', next: 'reply' },
        ],
      },
      headland: {
        text: 'I lock the desk and follow the path. At the headland, the harbor looks small enough to hold. The compass did not find anything I had lost. It found somewhere I had never thought to look.',
        ending: 'Beyond the Counter',
        choices: [],
      },
      traveler: {
        text: 'I put the compass beside tomorrow’s ferry tickets, with a note: Take the long way once. In the morning it is gone. In its place, someone has left a perfect shell. I open a new drawer.',
        ending: 'Another Beginning',
        choices: [],
      },
      house: {
        text: 'An old woman opens the door. She looks at the letter, then moves a second cup beside the kettle. I ask who wrote it. She says she has been waiting years for somebody to ask.',
        ending: 'The Second Cup',
        choices: [],
      },
      reply: {
        text: 'I write: The returns desk opens at eight. There is a chair for anyone with a story. I leave it at the blue house. Next morning, three people are waiting. None of them has lost a thing.',
        ending: 'A Place for Stories',
        choices: [],
      },
    },
  },
];
