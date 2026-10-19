// The Camp Days deck: 52 cards for days three to fourteen of a long outage.
// Four suits of thirteen, so it is also an ordinary deck of playing cards.
// Each suit maps to a playing-card suit; ranks run A, 2-10, J, Q, K.

export type Suit = {
  id: string;
  name: string;
  symbol: string;
  colour: string;
  about: string;
  cards: { title: string; text: string }[];
};

export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const suits: Suit[] = [
  {
    id: 'morning',
    name: 'Morning',
    symbol: '♣',
    colour: '#2F4A3A',
    about: 'One small job before breakfast. Camp runs on chores that are finished by ten.',
    cards: [
      { title: 'Water count', text: 'Check every jug and tally the level on the lid. Shared water goes further when everyone can see it.' },
      { title: 'Fill the wash station', text: 'Top up the hand-wash jug and put the soap beside it before anyone needs it.' },
      { title: 'Fridge check', text: 'Read both thermometers and write the numbers on the magnet card. Above 4 °C for more than two hours means it goes.' },
      { title: 'Set the Den', text: 'Cold day: close the doors to every other room. Hot day: draw the curtains on the sunny side before ten.' },
      { title: 'Little House round', text: 'Check the temporary toilet against local emergency sanitation instructions. Keep waste contained, away from children, and use the disposal method your local authority specifies.' },
      { title: 'Battery round', text: 'Count the spare batteries, crank the radio for a few minutes, and put the low headlamps first in line for fresh ones.' },
      { title: 'Radio on the hour', text: 'Listen for local emergency updates. Write down one useful thing for the porch board, with its source and time.' },
      { title: 'Medicine tick', text: 'Follow your usual medication plan and check storage against the product label. A pouch alone cannot control temperature; contact your pharmacist or clinician if supplies or storage are uncertain.' },
      { title: 'Light test', text: 'Every headlamp on, one at a time. A dim one gets fresh batteries now, not at nine tonight.' },
      { title: 'Biscuit Tin', text: 'Count the cash and note what went out. Small bills stay small.' },
      { title: 'Pantry pick', text: 'Choose tonight’s supper from the oldest tins on the shelf. First in, first eaten.' },
      { title: 'Clear the paths', text: 'Tidy the hall and the stairs. A tidy dark house is one nobody trips in.' },
      { title: 'Camp log', text: 'Date, weather, who visited, one good thing. In two weeks it will be worth reading.' },
    ],
  },
  {
    id: 'supper',
    name: 'Supper',
    symbol: '♦',
    colour: '#A83E20',
    about: 'Shelf-stable suppers. Portable gas camp stoves and charcoal grills are outdoors only, away from doors, windows and vents. Indoors, choose ready-to-eat food or an indoor-rated electric appliance with safe power. Cook only as much as you can eat safely.',
    cards: [
      { title: 'Freezer check', text: 'Check time and temperature before choosing supper. Discard thawed perishables held above 40°F (4°C) for more than two hours; use the FoodSafety.gov chart. Cooking does not rescue unsafe food.' },
      { title: 'Rice and beans', text: 'A pot of rice, a tin of beans, and whatever spices are in the cupboard. Better on day three than it sounds.' },
      { title: 'Soup, upgraded', text: 'A tin of soup, a tin of chickpeas and a handful of small pasta. Feeds twice as many.' },
      { title: 'Camp pancakes', text: 'Flour, a little sugar, a pinch of salt, oil and water. Syrup if anyone packed it.' },
      { title: 'Tuna pasta', text: 'Pasta, a tin of tuna, a good glug of oil and bottled lemon. Ten minutes of fuel.' },
      { title: 'Red lentil dal', text: 'Red lentils cook in about twenty minutes. Add a tin of tomatoes and serve it over rice.' },
      { title: 'Porridge for supper', text: 'Oats, sugar and tinned fruit. Warm, fast and nobody complains.' },
      { title: 'Cracker nachos', text: 'Crackers, warmed tinned beans and a jar of salsa. Eaten standing up, which is half the fun.' },
      { title: 'Rice tonight', text: 'Freshly cooked rice, a tin of mixed veg and soy sauce. Make only what you will eat now if safe refrigeration is unavailable. Do not keep cooked rice overnight at room temperature.' },
      { title: 'Couscous night', text: 'Just pour boiling water over it and put a lid on. The kindest meal for the fuel supply.' },
      { title: 'One-tin potluck', text: 'Everyone on the street brings one tin to the porch. Somebody always has peaches.' },
      { title: 'Hot chocolate', text: 'A pot of water, cocoa, sugar and powdered milk. Morale is a supply too.' },
      { title: 'Lid on', text: 'One pot and a lid save fuel. Follow the food’s cooking instructions and finish cooking fully; use ready-to-eat food if safe cooking is unavailable.' },
    ],
  },
  {
    id: 'play',
    name: 'Play',
    symbol: '♥',
    colour: '#B4473F',
    about: 'Something to do that is not waiting. The evenings are long and the battery is precious.',
    cards: [
      { title: 'Crazy Eights', text: 'This deck is a real deck. Deal seven each and play until supper.' },
      { title: 'Chapter a night', text: 'Pick the longest book in the house and read one chapter aloud by lantern every evening.' },
      { title: 'Shadow theatre', text: 'One headlamp on the floor, one wall, two hands. Bonus points for a convincing rabbit.' },
      { title: 'Twenty questions', text: 'Person, place or thing. Played in sleeping bags, it lasts longer than you’d think.' },
      { title: 'Letter to future you', text: 'Write what this week was like. Seal it and put it in the kit for the next time it gets opened.' },
      { title: 'Map the street', text: 'Draw the block from memory: houses, trees, the neighbour with the dog. Check it on tomorrow’s walk.' },
      { title: 'Learn a knot', text: 'Bowline, clove hitch or the trucker’s hitch. A length of cord and a chair leg is all it takes.' },
      { title: 'The jigsaw', text: 'Start the hardest puzzle in the house on the floor of the Den. It doesn’t have to be finished.' },
      { title: 'Star count', text: 'Look out of the darkest window. With the street lights off there are more than anyone remembers.' },
      { title: 'Stretch', text: 'Ten minutes on the rug: necks, backs and legs. Sleeping on the floor asks for it.' },
      { title: 'Sing-along', text: 'Everyone picks one song they know all the words to. No phones needed.' },
      { title: 'Story chain', text: 'One sentence each, round and round, until the story ends or someone falls asleep.' },
      { title: 'Early night', text: 'Lights out an hour after sunset. Sleep is the cheapest thing in camp.' },
    ],
  },
  {
    id: 'porch',
    name: 'Porch',
    symbol: '♠',
    colour: '#27324B',
    about: 'Neighbours can make everyday jobs easier. These cards help you keep in touch; urgent needs go to emergency services, not a window sign.',
    cards: [
      { title: 'Hand out Porch Cards', text: 'Knock, say hello, swap cards. Ten minutes on the first day saves hours later.' },
      { title: 'Check on the older neighbour', text: 'Cold or heat falls hardest on older people. Knock on the same door at the same time every day.' },
      { title: 'News at noon', text: 'Pick one porch and one time. Whoever heard the radio shares what it said.' },
      { title: 'Swap shelf', text: 'Put what you have too much of on a table outside: batteries, tins, books. Take what you need.' },
      { title: 'Walk the block', text: 'A short walk when conditions are safe. In hot weather choose a cooler time, and check in with neighbours who asked for a visit.' },
      { title: 'Water notes', text: 'Share the latest local water advisory and the CDC treatment instructions, with their source and time. A running tap does not prove the water is safe.' },
      { title: 'Generator rota', text: 'Keep generators outdoors more than 20 feet from doors, windows and vents. Follow the manual for connections; medical-device backup needs a plan with the clinician and supplier.' },
      { title: 'Chalk the pavement', text: 'Give the kids the chalk. A drawn-on street feels like a street that’s fine.' },
      { title: 'Carry day', text: 'Help whoever can’t move heavy water jugs. Five gallons weighs about forty pounds.' },
      { title: 'Door board', text: 'Tape a sheet to one front door for messages: who needs what, who went where, what the radio said.' },
      { title: 'Four o’clock tea', text: 'One kettle, everyone’s mugs. The street’s best meeting has no agenda.' },
      { title: 'Window signs up', text: 'Green records a recent check-in. Amber asks for a knock. Call 911 or your local emergency number for urgent help; do not wait for someone to see a sign.' },
      { title: 'Thank-you notes', text: 'Write one for whoever helped this week. Leave it on their step.' },
    ],
  },
];
