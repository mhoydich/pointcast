(function () {
  "use strict";

  const STORAGE_KEY = "sitting-with-gandalf-log";
  const SETTINGS_KEY = "sitting-with-gandalf-settings";
  const NOUNS_COLLECTION_KEY = "sitting-with-gandalf-nouns-collection";
  const DEFAULT_MINUTES = 15;
  const RELEASE_VERSION = "v5";
  const SETTINGS_RELEASE = "v5-enjoy";
  const versions = new Set(["v1", "v2", "v3", "v4", "v5"]);
  const renderStyles = {
    storybook: {
      name: "Storybook glow",
      idle: "The picture stays painterly and warm, like a page you can breathe inside.",
      lines: ["Let the brushwork soften the edges.", "The old quiet has good color today."]
    },
    pixel: {
      name: "Pixel campfire",
      idle: "The world has gone tiny and bright. Let each little square carry less than a thought.",
      lines: [
        "A small pixel can hold a surprising amount of peace.",
        "Step lightly. Even the moss has gone 16-bit.",
        "Tiny lights, tiny worries, plenty of room."
      ]
    }
  };

  const rituals = {
    enjoy: {
      title: "Enjoy",
      short: "be here",
      blendLabel: "Moment flavor",
      blendOptions: ["Warm chair", "First sip", "Firelight on wood", "Rain on glass"],
      startLabel: "Begin enjoying",
      runningLabel: "being here",
      idleLabel: "enjoyment",
      summary: "Presence, keepsakes, tally",
      warmth: 0.7,
      smoke: 0.48,
      guide: "No lesson to extract. Sit where you are and let the room be pleasant.",
      complete: "Good. Nothing was improved; it was simply enjoyed.",
      phaseHints: {
        Settle: "Arrive in the pleasant part.",
        Drift: "Stay with what feels good before naming it.",
        Return: "Bring back the ease, not a lesson."
      },
      cues: {
        look: "Look for the smallest pleasant thing and let it be enough.",
        listen: "Let the room sound like company, not instruction.",
        breathe: "Breathe as if this minute is allowed to be nice.",
        release: "Leave one task outside the circle of light."
      },
      lines: [
        "Enjoyment is not a reward after presence; it is one way into it.",
        "There is no errand inside this minute.",
        "Let the good part be simple. It will not mind."
      ]
    },
    meditate: {
      title: "Meditate",
      short: "steady mind",
      blendLabel: "Session scent",
      blendOptions: ["Moss breath", "Lantern hush", "Rain-window calm", "Moonwater quiet"],
      startLabel: "Begin 5-min sit",
      runningLabel: "card sit",
      idleLabel: "meditation sit",
      summary: "Ritual, collection, tally",
      warmth: 0.58,
      smoke: 0.44,
      guide: "Sit with the card, breathe with the room, and let one cue become gentle.",
      complete: "You did not chase clarity. You made a place where it could sit down.",
      phaseHints: {
        Settle: "Let the cue choose the first breath.",
        Drift: "Stay near the image. Nothing needs solving yet.",
        Return: "Bring back one sentence you can use."
      },
      cues: {
        look: "Look at the card until one detail stops asking for effort.",
        listen: "Let the ambience become a room around the thought.",
        breathe: "Breathe with the cue, not against the clock.",
        release: "Let the card keep what you do not need to rehearse."
      },
      lines: [
        "Attention is a hearth: tend it gently and it warms the room.",
        "A thought that can wait has already become kinder.",
        "Do not wrestle the mind. Offer it a chair."
      ]
    },
    smoke: {
      title: "Pipe",
      short: "slow rings",
      blendLabel: "Pipe leaf",
      blendOptions: ["Shire mild", "Ranger nightleaf", "Wizard reserve", "Hearthside clover"],
      startLabel: "Begin pipe pause",
      runningLabel: "pipe pause",
      idleLabel: "slow smoke",
      summary: "Pipe leaf, cards, tally",
      warmth: 0.64,
      smoke: 0.82,
      guide: "Draw slowly, watch the ring leave, and let the card turn one worry into weather.",
      complete: "Good. The smoke has carried off enough of the sharpness.",
      phaseHints: {
        Settle: "Let the pipe find its first slow glow.",
        Drift: "Watch the ring leave without following it.",
        Return: "Keep the warmth, leave the haze."
      },
      cues: {
        look: "Watch the smoke soften the hard edge of the thought.",
        listen: "Hear the room before you add another opinion.",
        breathe: "Draw gently. Hold lightly. Exhale without a speech.",
        release: "Give the next ring one worry and let it wander off."
      },
      lines: [
        "A smoke ring is a small proof that letting go can have shape.",
        "The pipe is not the point. The pause is.",
        "Exhale slowly. Even old troubles lose their outline."
      ]
    },
    beer: {
      title: "Beer",
      short: "tavern pint",
      blendLabel: "Tavern pour",
      blendOptions: ["Half pint by the fire", "Amber table ale", "Rainy-window stout", "Small celebratory beer"],
      startLabel: "Begin beer sit",
      runningLabel: "beer sit",
      idleLabel: "warm beer",
      summary: "Tavern pour, cards, tally",
      warmth: 0.72,
      smoke: 0.52,
      guide: "Set the glass down, take the room in slowly, and let good company make the thought kinder.",
      complete: "There. A small cheer, a quieter head, and no need to hurry the next road.",
      phaseHints: {
        Settle: "Set the glass down and arrive.",
        Drift: "Let the room be friendly without asking anything from it.",
        Return: "Carry the warmth, not the noise."
      },
      cues: {
        look: "Notice the nearest warm color before the next sip.",
        listen: "Hear the room as company, not demand.",
        breathe: "Breathe first; let the pint be scenery, not command.",
        release: "Put one opinion on the table and leave it there."
      },
      lines: [
        "A good pint is best when it slows the story down.",
        "No good moment improves by being rushed across a table.",
        "Warmth is useful when it remembers to stay gentle."
      ]
    },
    study: {
      title: "Study",
      short: "quiet lesson",
      blendLabel: "Desk charm",
      blendOptions: ["Margin candle", "Old map dust", "Library rain", "Quiet question"],
      startLabel: "Begin study sit",
      runningLabel: "study sit",
      idleLabel: "small study",
      summary: "Study charm, cards, tally",
      warmth: 0.54,
      smoke: 0.38,
      guide: "Pull a card, read its cue like a footnote, and leave with one cleaner thought.",
      complete: "That is study enough: one cleaner thought, filed where you can find it.",
      phaseHints: {
        Settle: "Read the cue once. Do not argue with it yet.",
        Drift: "Let the card teach by being specific.",
        Return: "Name the lesson in one plain sentence."
      },
      cues: {
        look: "Study one visual detail until it becomes a metaphor.",
        listen: "Listen for the useful part of the quiet.",
        breathe: "Breathe before deciding what the lesson is.",
        release: "Drop the clever version. Keep the true one."
      },
      lines: [
        "Getting smarter often feels like needing fewer words.",
        "A clean thought is better company than a crowded theory.",
        "Study is attention with somewhere kind to sit."
      ]
    }
  };

  const nounsGandalfs = [
    {
      id: "moss",
      noun: "Moss",
      name: "Moss Gandalf",
      trait: "keeps the small green quiet",
      rarity: "Common",
      mode: "fire",
      visual: "glade",
      intention: "rest",
      bg: "#253827",
      hat: "#5f7345",
      robe: "#24392f",
      lens: "#c8df81",
      spark: "#f0c96a",
      mantra: "Rest your attention in one green place.",
      cue: "Let the moss keep one thought you do not need to carry.",
      breath: "Inhale shade. Exhale the road-dust of the day.",
      line: "Green is not in a hurry, and it has survived more than you think."
    },
    {
      id: "lantern",
      noun: "Lantern",
      name: "Lantern Gandalf",
      trait: "carries a little useful light",
      rarity: "Common",
      mode: "fire",
      visual: "glade",
      intention: "ground",
      bg: "#3a2f20",
      hat: "#8b6738",
      robe: "#302b23",
      lens: "#ffd37a",
      spark: "#f39a46",
      mantra: "Let one small light be enough.",
      cue: "Name the nearest warm color, then soften around it.",
      breath: "Inhale the glow. Exhale the extra room.",
      line: "A lantern is just a brave little yes in the dark."
    },
    {
      id: "teapot",
      noun: "Teapot",
      name: "Teapot Gandalf",
      trait: "knows when to steep",
      rarity: "Common",
      mode: "rain",
      visual: "garden",
      intention: "rest",
      bg: "#24373a",
      hat: "#607b76",
      robe: "#27363a",
      lens: "#bfe8dd",
      spark: "#e0bf6b",
      mantra: "Let the moment steep before you answer.",
      cue: "Wait three breaths before improving anything.",
      breath: "Inhale steam. Exhale the need to be finished.",
      line: "Some quiet only arrives after the water stops shouting."
    },
    {
      id: "map",
      noun: "Map",
      name: "Map Gandalf",
      trait: "folds the far road smaller",
      rarity: "Common",
      mode: "road",
      visual: "meadow",
      intention: "wander",
      bg: "#3c3425",
      hat: "#8d7a49",
      robe: "#393120",
      lens: "#f0c96a",
      spark: "#b9d37d",
      mantra: "Choose the next inch, not the whole horizon.",
      cue: "Let the path exist without asking it for a promise.",
      breath: "Inhale open air. Exhale the clenched map.",
      line: "A map is friendlier once you stop asking it to be a prophecy."
    },
    {
      id: "moon",
      noun: "Moon",
      name: "Moon Gandalf",
      trait: "holds light without gripping it",
      rarity: "Rare",
      mode: "stars",
      visual: "lake",
      intention: "sleep",
      bg: "#222b42",
      hat: "#53648e",
      robe: "#242b3a",
      lens: "#d9e4ff",
      spark: "#9bbde4",
      mantra: "Reflect the day; do not replay it.",
      cue: "Look for the softest edge in the dark.",
      breath: "Inhale cool water. Exhale the last bright noise.",
      line: "The moon has never mistaken reflection for possession."
    },
    {
      id: "acorn",
      noun: "Acorn",
      name: "Acorn Gandalf",
      trait: "protects the beginning",
      rarity: "Common",
      mode: "fire",
      visual: "glade",
      intention: "ground",
      bg: "#332a1f",
      hat: "#7b603a",
      robe: "#2c382c",
      lens: "#d4b46f",
      spark: "#82a35e",
      mantra: "Begin seed-small.",
      cue: "Make the next breath modest enough to trust.",
      breath: "Inhale low. Exhale into the chair.",
      line: "Large oaks have the manners to begin as pockets."
    },
    {
      id: "pebble",
      noun: "Pebble",
      name: "Pebble Gandalf",
      trait: "makes weight feel simple",
      rarity: "Common",
      mode: "road",
      visual: "meadow",
      intention: "ground",
      bg: "#333734",
      hat: "#6f746f",
      robe: "#27312d",
      lens: "#c7d1bf",
      spark: "#e0bf6b",
      mantra: "Feel what is actually here.",
      cue: "Notice one point of contact and let it become enough.",
      breath: "Inhale the floor. Exhale the argument.",
      line: "A pebble does not apologize for being precise."
    },
    {
      id: "fern",
      noun: "Fern",
      name: "Fern Gandalf",
      trait: "unfurls without fanfare",
      rarity: "Common",
      mode: "fire",
      visual: "glade",
      intention: "rest",
      bg: "#1f3a2d",
      hat: "#4f8459",
      robe: "#22362a",
      lens: "#9fdc97",
      spark: "#f0c96a",
      mantra: "Uncurl one place in the body.",
      cue: "Let the shoulders unfold at their own pace.",
      breath: "Inhale gently. Exhale as if making room for leaves.",
      line: "The fern knows that opening is not the same as explaining."
    },
    {
      id: "rainboot",
      noun: "Rainboot",
      name: "Rainboot Gandalf",
      trait: "walks through weather anyway",
      rarity: "Uncommon",
      mode: "rain",
      visual: "garden",
      intention: "wander",
      bg: "#20343d",
      hat: "#45616a",
      robe: "#20353b",
      lens: "#9bd7e0",
      spark: "#d1a85b",
      mantra: "Weather is not the whole story.",
      cue: "Let the rain do the moving while you stay dry inside.",
      breath: "Inhale cool. Exhale resistance to the weather.",
      line: "A wet path can still be kind to steady feet."
    },
    {
      id: "mushroom",
      noun: "Mushroom",
      name: "Mushroom Gandalf",
      trait: "thrives under soft cover",
      rarity: "Uncommon",
      mode: "fire",
      visual: "glade",
      intention: "rest",
      bg: "#302a31",
      hat: "#8f5f60",
      robe: "#2d3328",
      lens: "#f1d7a1",
      spark: "#b9d37d",
      mantra: "Be hidden if hidden helps.",
      cue: "Let privacy be part of the medicine.",
      breath: "Inhale earth. Exhale being seen too sharply.",
      line: "Not every good thing grows in full view."
    },
    {
      id: "river",
      noun: "River",
      name: "River Gandalf",
      trait: "continues by yielding",
      rarity: "Uncommon",
      mode: "rain",
      visual: "garden",
      intention: "wander",
      bg: "#1d3840",
      hat: "#477b83",
      robe: "#1f3037",
      lens: "#b5edf0",
      spark: "#8fc3bf",
      mantra: "Move by softening first.",
      cue: "Let the next thought pass without building a bridge.",
      breath: "Inhale current. Exhale the stone in the chest.",
      line: "A river wins no argument and reaches the sea all the same."
    },
    {
      id: "ember",
      noun: "Ember",
      name: "Ember Gandalf",
      trait: "keeps warmth quiet",
      rarity: "Rare",
      mode: "fire",
      visual: "glade",
      intention: "ground",
      bg: "#3a241f",
      hat: "#9a5134",
      robe: "#2e2721",
      lens: "#ffc16f",
      spark: "#e89c43",
      mantra: "Warmth can be small and still be real.",
      cue: "Find the quietest warmth in the body.",
      breath: "Inhale ember. Exhale smoke.",
      line: "A low glow has outlasted many bonfires."
    },
    {
      id: "blanket",
      noun: "Blanket",
      name: "Blanket Gandalf",
      trait: "makes permission tactile",
      rarity: "Common",
      mode: "rain",
      visual: "garden",
      intention: "rest",
      bg: "#302c3a",
      hat: "#6a5a86",
      robe: "#312b3b",
      lens: "#ddd0ff",
      spark: "#8fc3bf",
      mantra: "Let comfort do some of the work.",
      cue: "Relax the jaw as if accepting warmth.",
      breath: "Inhale covered. Exhale guarded.",
      line: "There are evenings when softness is the wisest tool."
    },
    {
      id: "clover",
      noun: "Clover",
      name: "Clover Gandalf",
      trait: "finds luck in small repeats",
      rarity: "Rare",
      mode: "fire",
      visual: "glade",
      intention: "rest",
      bg: "#1f3d2c",
      hat: "#4f8e55",
      robe: "#223f31",
      lens: "#d6f5a2",
      spark: "#f0c96a",
      mantra: "Count blessings only until counting gets noisy.",
      cue: "Notice three small comforts, then stop tallying.",
      breath: "Inhale one. Exhale enough.",
      line: "Luck often arrives dressed as something ordinary."
    },
    {
      id: "pinecone",
      noun: "Pinecone",
      name: "Pinecone Gandalf",
      trait: "keeps a forest folded up",
      rarity: "Uncommon",
      mode: "road",
      visual: "meadow",
      intention: "ground",
      bg: "#352d22",
      hat: "#735a3b",
      robe: "#2b382d",
      lens: "#d0bc82",
      spark: "#b9d37d",
      mantra: "Hold complexity without opening every scale.",
      cue: "Let one problem stay folded for now.",
      breath: "Inhale resin. Exhale the list.",
      line: "A whole forest can wait inside a small patience."
    },
    {
      id: "cloud",
      noun: "Cloud",
      name: "Cloud Gandalf",
      trait: "changes shape without panic",
      rarity: "Common",
      mode: "stars",
      visual: "lake",
      intention: "wander",
      bg: "#273346",
      hat: "#6e7f9b",
      robe: "#293442",
      lens: "#eef3ff",
      spark: "#9bbde4",
      mantra: "Let the shape change.",
      cue: "Watch one thought drift without naming its destination.",
      breath: "Inhale sky. Exhale outline.",
      line: "A cloud has never failed by refusing to stay itself."
    },
    {
      id: "door",
      noun: "Door",
      name: "Door Gandalf",
      trait: "knows when closed is kind",
      rarity: "Uncommon",
      mode: "fire",
      visual: "glade",
      intention: "ground",
      bg: "#3a2c24",
      hat: "#7a573b",
      robe: "#312a25",
      lens: "#f1cc8f",
      spark: "#e89c43",
      mantra: "Close one door in the mind.",
      cue: "Leave outside what cannot help this sit.",
      breath: "Inhale threshold. Exhale the hallway.",
      line: "A closed door is sometimes hospitality for the soul."
    },
    {
      id: "compass",
      noun: "Compass",
      name: "Compass Gandalf",
      trait: "prefers direction to speed",
      rarity: "Rare",
      mode: "road",
      visual: "meadow",
      intention: "wander",
      bg: "#25313a",
      hat: "#526b70",
      robe: "#252f32",
      lens: "#c8e5e1",
      spark: "#e0bf6b",
      mantra: "A direction is enough for now.",
      cue: "Ask what feels north, then take no action yet.",
      breath: "Inhale toward. Exhale urgency.",
      line: "Speed is a poor substitute for knowing which way is kind."
    },
    {
      id: "biscuit",
      noun: "Biscuit",
      name: "Biscuit Gandalf",
      trait: "believes in humble comforts",
      rarity: "Common",
      mode: "fire",
      visual: "glade",
      intention: "rest",
      bg: "#3a2d20",
      hat: "#a47a43",
      robe: "#31291f",
      lens: "#ffe0a0",
      spark: "#f0c96a",
      mantra: "Take the ordinary kindness seriously.",
      cue: "Let one plain comfort count.",
      breath: "Inhale warm bread. Exhale performance.",
      line: "A biscuit may not save the world, but it can improve the council."
    },
    {
      id: "thimble",
      noun: "Thimble",
      name: "Thimble Gandalf",
      trait: "mends tiny tears",
      rarity: "Uncommon",
      mode: "rain",
      visual: "garden",
      intention: "ground",
      bg: "#26313a",
      hat: "#60717d",
      robe: "#293139",
      lens: "#d7e7ef",
      spark: "#8fc3bf",
      mantra: "Repair one stitch, not the whole cloak.",
      cue: "Find the smallest repair available in this breath.",
      breath: "Inhale thread. Exhale fray.",
      line: "Tiny mending has embarrassed many grand disasters."
    },
    {
      id: "window",
      noun: "Window",
      name: "Window Gandalf",
      trait: "lets the outside stay outside",
      rarity: "Common",
      mode: "rain",
      visual: "garden",
      intention: "rest",
      bg: "#26383f",
      hat: "#55747a",
      robe: "#26343a",
      lens: "#c9f0ee",
      spark: "#d1a85b",
      mantra: "Witness without opening the latch.",
      cue: "Look at the world without joining every motion.",
      breath: "Inhale behind glass. Exhale the weather.",
      line: "A window is proof that distance can still be tender."
    },
    {
      id: "shell",
      noun: "Shell",
      name: "Shell Gandalf",
      trait: "keeps an old hush",
      rarity: "Rare",
      mode: "stars",
      visual: "lake",
      intention: "sleep",
      bg: "#2d3443",
      hat: "#747b8d",
      robe: "#2b3140",
      lens: "#f4ead6",
      spark: "#9bbde4",
      mantra: "Listen for the small held sea.",
      cue: "Let one sound become spacious.",
      breath: "Inhale tide. Exhale shore.",
      line: "Even a shell can remember vastness without making a speech."
    },
    {
      id: "candle",
      noun: "Candle",
      name: "Candle Gandalf",
      trait: "turns attention into flame",
      rarity: "Common",
      mode: "fire",
      visual: "glade",
      intention: "ground",
      bg: "#33251f",
      hat: "#85613c",
      robe: "#2e2922",
      lens: "#fff0a8",
      spark: "#e89c43",
      mantra: "Let attention stand upright.",
      cue: "Rest the eyes as if watching a candle.",
      breath: "Inhale flame. Exhale flicker.",
      line: "A candle does not conquer darkness; it makes a room."
    },
    {
      id: "key",
      noun: "Key",
      name: "Key Gandalf",
      trait: "opens less by forcing",
      rarity: "Rare",
      mode: "road",
      visual: "meadow",
      intention: "ground",
      bg: "#303329",
      hat: "#747045",
      robe: "#2d342a",
      lens: "#f0dc89",
      spark: "#b9d37d",
      mantra: "Turn gently.",
      cue: "Loosen one place before trying to open it.",
      breath: "Inhale patience. Exhale force.",
      line: "Many doors prefer a quiet key to a brave shoulder."
    },
    {
      id: "apple",
      noun: "Apple",
      name: "Apple Gandalf",
      trait: "returns you to simple sweetness",
      rarity: "Common",
      mode: "fire",
      visual: "meadow",
      intention: "rest",
      bg: "#3a2525",
      hat: "#8f4541",
      robe: "#2f3328",
      lens: "#ffe2a4",
      spark: "#b9d37d",
      mantra: "Let the simple thing be sufficient.",
      cue: "Notice one pleasant detail without improving it.",
      breath: "Inhale crisp. Exhale excess.",
      line: "A good apple is a sermon with better manners."
    },
    {
      id: "button",
      noun: "Button",
      name: "Button Gandalf",
      trait: "fastens what matters",
      rarity: "Uncommon",
      mode: "rain",
      visual: "garden",
      intention: "ground",
      bg: "#2d3340",
      hat: "#566782",
      robe: "#27323d",
      lens: "#d8e3ff",
      spark: "#8fc3bf",
      mantra: "Fasten attention to one small thing.",
      cue: "Return to the breath as if buttoning a coat.",
      breath: "Inhale close. Exhale loose ends.",
      line: "The smallest fastening can keep out a surprising draft."
    },
    {
      id: "cup",
      noun: "Cup",
      name: "Cup Gandalf",
      trait: "knows enough by holding less",
      rarity: "Common",
      mode: "rain",
      visual: "garden",
      intention: "rest",
      bg: "#25373a",
      hat: "#65827c",
      robe: "#26343a",
      lens: "#d5eee8",
      spark: "#d1a85b",
      mantra: "Make room before asking to be filled.",
      cue: "Empty the next exhale completely enough.",
      breath: "Inhale steam. Exhale the brim.",
      line: "A cup is useful because it keeps a little emptiness."
    },
    {
      id: "root",
      noun: "Root",
      name: "Root Gandalf",
      trait: "goes down before forward",
      rarity: "Rare",
      mode: "fire",
      visual: "glade",
      intention: "ground",
      bg: "#2f2a22",
      hat: "#6c5b3c",
      robe: "#27382d",
      lens: "#cfc08a",
      spark: "#82a35e",
      mantra: "Down is also a direction.",
      cue: "Feel the body choose the ground.",
      breath: "Inhale through the soles. Exhale into the earth.",
      line: "Roots are proof that depth can be quiet progress."
    },
    {
      id: "dew",
      noun: "Dew",
      name: "Dew Gandalf",
      trait: "makes morning without noise",
      rarity: "Uncommon",
      mode: "stars",
      visual: "lake",
      intention: "sleep",
      bg: "#203444",
      hat: "#5f7f8d",
      robe: "#243443",
      lens: "#d8fbff",
      spark: "#9bbde4",
      mantra: "Let softness gather by itself.",
      cue: "Do not force the calm; let it condense.",
      breath: "Inhale cool. Exhale softly enough to disappear.",
      line: "Dew does not announce the morning. It simply arrives."
    },
    {
      id: "meadow",
      noun: "Meadow",
      name: "Meadow Gandalf",
      trait: "gives the feeling room",
      rarity: "Common",
      mode: "road",
      visual: "meadow",
      intention: "wander",
      bg: "#333923",
      hat: "#748348",
      robe: "#2b3829",
      lens: "#f1db8b",
      spark: "#e0bf6b",
      mantra: "Widen around the feeling.",
      cue: "Let the horizon be larger than the thought.",
      breath: "Inhale open. Exhale narrow.",
      line: "A meadow is what happens when space decides to be kind."
    }
  ];

  const modeLines = {
    fire: [
      "Sit down, then. Haste has already had its say.",
      "A fire is a very old kind of clock. Listen until it names the hour.",
      "Trouble may wait outside. It knows the rules of a closed round door.",
      "The smallest pause can hold a surprising amount of courage.",
      "Let the smoke take the sharp edges off the road."
    ],
    rain: [
      "Rain on the roof is the road speaking from a distance.",
      "There is no shame in being still while the weather does the traveling.",
      "A wet cloak dries faster beside patience.",
      "The world is rinsing its face. Give yours a rest as well.",
      "Even thunder sounds gentler from a good chair."
    ],
    road: [
      "The road has many opinions. You need not answer every one.",
      "A map is only a promise made by ink.",
      "Pack lightly, but keep one song where you can reach it.",
      "Mountains look smaller after a proper pause.",
      "Not every journey improves by beginning at once."
    ],
    stars: [
      "Old light arrives late and still finds the window.",
      "Let the constellations do the remembering for a while.",
      "A quiet room can be larger than a kingdom.",
      "Stars are patient witnesses. Borrow their manners.",
      "Even night keeps a few small lamps lit."
    ]
  };

  const modeTones = {
    fire: { low: 82.41, high: 123.47, drone: 0.18 },
    rain: { low: 73.42, high: 110.0, drone: 0.13 },
    road: { low: 65.41, high: 98.0, drone: 0.15 },
    stars: { low: 92.5, high: 138.59, drone: 0.1 }
  };

  const natureViews = {
    glade: {
      name: "Moss glade",
      mode: "fire",
      idle: "Rest your eyes in the green. Let the small lights do the wandering.",
      phases: {
        Settle: "Find one patch of moss and let your shoulders answer it.",
        Drift: "Let the glade hold the edges of the day for you.",
        Return: "Bring back one small, green permission to move slowly."
      },
      cues: {
        look: "Notice the softest light in the trees. Stay with it for three breaths.",
        listen: "Listen as if the room has leaves. Let the quiet have texture.",
        breathe: "Breathe in like shade. Breathe out like a path becoming clear.",
        release: "Let one tight thought step off the trail and disappear behind the ferns."
      },
      lines: [
        "Green is a patient kind of advice.",
        "You do not need to enter the forest loudly.",
        "Let the moss keep what you no longer need to carry.",
        "A small light is enough when the eyes soften."
      ]
    },
    garden: {
      name: "Rain garden",
      mode: "rain",
      idle: "Let the porch hold you. The rain can do the moving for now.",
      phases: {
        Settle: "Hear the nearest drops before you sort the far ones.",
        Drift: "Let the garden drink what the day could not.",
        Return: "Come back rinsed, not rushed."
      },
      cues: {
        look: "Look where the path shines. Let the rain polish the moment.",
        listen: "Count three soft sounds, then stop counting.",
        breathe: "Breathe in cool. Breathe out the hurry you inherited.",
        release: "Put one worry down on the wet stones and leave it there."
      },
      lines: [
        "Rain makes a room out of anywhere with a roof.",
        "Let the weather be busy on your behalf.",
        "A garden in rain is not waiting. It is receiving.",
        "You can be sheltered without being closed."
      ]
    },
    meadow: {
      name: "Meadow path",
      mode: "road",
      idle: "Choose the open air. Let the far hills make the next thing smaller.",
      phases: {
        Settle: "Feel the path without needing to follow it yet.",
        Drift: "Let the meadow widen around the question.",
        Return: "Take one honest step, not the whole horizon."
      },
      cues: {
        look: "Look toward the bright distance without making a plan.",
        listen: "Listen for the space between thoughts. It has room in it.",
        breathe: "Breathe in the open field. Breathe out the clenched map.",
        release: "Let the path go on without you for a few minutes."
      },
      lines: [
        "A path can invite you without hurrying you.",
        "The hill is far away, and that is part of its kindness.",
        "Let the meadow be large enough for the feeling.",
        "Open air has a way of making small troubles tell the truth."
      ]
    },
    lake: {
      name: "Moon lake",
      mode: "stars",
      idle: "Rest beside the reflected sky. Nothing bright needs to be chased.",
      phases: {
        Settle: "Let the water show you how stillness moves.",
        Drift: "Borrow the lake's habit of holding light without grasping it.",
        Return: "Bring back one quiet reflection and leave the rest shining."
      },
      cues: {
        look: "Look at the reflected moon. Let attention settle on the waterline.",
        listen: "Listen for the night behind the sound.",
        breathe: "Breathe in like cool water. Breathe out like a ripple flattening.",
        release: "Let one thought sink without needing to watch it land."
      },
      lines: [
        "The lake keeps the moon without owning it.",
        "Night can be gentle when you stop negotiating with it.",
        "Reflection is not repetition. It is softening.",
        "A quiet surface still has depth."
      ]
    }
  };

  const intentions = {
    rest: {
      title: "Rest",
      text: "Let the picture be enough. Nothing needs improving for the next few minutes.",
      lines: ["Rest is not a delay. It is repair.", "Let enough be enough for one small hour."]
    },
    ground: {
      title: "Ground",
      text: "Feel the chair, the floor, the weight of yourself allowed to arrive.",
      lines: ["The body is a better anchor than an argument.", "Come back by inches. That is still coming back."]
    },
    wander: {
      title: "Wander",
      text: "Let attention walk gently through the scene without asking it to perform.",
      lines: ["A wandering mind can still move softly.", "Let attention roam, then invite it home."]
    },
    sleep: {
      title: "Sleep",
      text: "Dim the effort. Let every breath make the room a little farther from the day.",
      lines: ["The day may close without a speech.", "Let the last task be getting softer."]
    }
  };

  const companions = {
    hearth: {
      name: "Hearth Gandalf",
      mode: "fire",
      idle: "Begin warm: start the quiet sit, then breathe with the ring.",
      paused: "The fire will keep its place. Return when you are ready.",
      complete: "Good. Carry one ember of that quiet with you.",
      phases: {
        Settle: "Let the pipe find its first slow glow.",
        Drift: "Let the room do most of the work.",
        Return: "Bring back one ember, not the whole fire."
      },
      lines: [
        "Warmth first. Wisdom can take the second chair.",
        "The hearth knows how to wait without becoming idle.",
        "Draw slowly. Even old magic begins with breath.",
        "A good chair has ended more quarrels than a loud speech."
      ]
    },
    rain: {
      name: "Rain Gandalf",
      mode: "rain",
      idle: "Begin soft: let the rain carry the hurry away before you draw.",
      paused: "Rain does not mind interruption. It simply continues.",
      complete: "There. Washed clean enough for the next small thing.",
      phases: {
        Settle: "Hear the roof before you hear your thoughts.",
        Drift: "Let the weather travel for you.",
        Return: "Take the quiet part of the storm back with you."
      },
      lines: [
        "Rain has a thousand fingers and no need to hurry.",
        "A wet road is still a road, only more honest.",
        "Let each drop answer one thought and leave you with fewer.",
        "The window is doing enough. Sit behind it."
      ]
    },
    road: {
      name: "Road Gandalf",
      mode: "road",
      idle: "Begin steady: set your pack down, draw once, and leave the road outside.",
      paused: "The road bends, waits, and goes on. So may you.",
      complete: "You have walked without leaving. That counts.",
      phases: {
        Settle: "Put the pack down before you inspect the map.",
        Drift: "Let the dust fall behind you.",
        Return: "Choose the next step, not the whole journey."
      },
      lines: [
        "Not every road asks to be answered tonight.",
        "Dust is only the road remembering your feet.",
        "A map is better after tea and worse after panic.",
        "Rest is also a direction."
      ]
    },
    stars: {
      name: "Star Gandalf",
      mode: "stars",
      idle: "Begin quiet: look upward, draw lightly, and let the night widen.",
      paused: "The stars do not scold a pause within a pause.",
      complete: "A little night-sense is enough for one pocket.",
      phases: {
        Settle: "Let the dark become spacious rather than empty.",
        Drift: "Borrow the patience of distant light.",
        Return: "Bring back one small lamp for the path."
      },
      lines: [
        "Old light arrives late and is not ashamed.",
        "The sky is full because it leaves room.",
        "A quiet pipe can make a window out of any wall.",
        "Look up long enough and the hour grows gentler."
      ]
    }
  };

  const phases = [
    { threshold: 0, name: "Settle", hint: "Shoulders down. Let the room find you." },
    { threshold: 0.22, name: "Drift", hint: "No errands here. Just the fire and the next breath." },
    { threshold: 0.72, name: "Return", hint: "Bring one useful thing back from the quiet." }
  ];

  const pace = [
    { label: "Inhale", seconds: 4 },
    { label: "Hold", seconds: 2 },
    { label: "Exhale", seconds: 6 }
  ];

  const savedSettings = loadSettings();
  const savedRelease = savedSettings.release === SETTINGS_RELEASE;
  const initialVersion = savedRelease && versions.has(savedSettings.version) ? savedSettings.version : RELEASE_VERSION;
  const initialRenderStyle = savedRelease && renderStyles[savedSettings.renderStyle]
    ? savedSettings.renderStyle
    : initialVersion === "v4" || initialVersion === "v5"
      ? "pixel"
      : "storybook";
  const initialNounsGandalf = savedRelease && nounsGandalfs.some((card) => card.id === savedSettings.nounsActive)
    ? savedSettings.nounsActive
    : nounsGandalfs[0].id;
  const state = {
    duration: DEFAULT_MINUTES * 60,
    remaining: DEFAULT_MINUTES * 60,
    running: false,
    mode: savedSettings.mode || "fire",
    version: initialVersion,
    companion: companions[savedSettings.companion] ? savedSettings.companion : "hearth",
    visual: natureViews[savedSettings.visual] ? savedSettings.visual : "glade",
    intention: intentions[savedSettings.intention] ? savedSettings.intention : "rest",
    renderStyle: initialRenderStyle,
    ritual: savedRelease && rituals[savedSettings.ritual] ? savedSettings.ritual : "enjoy",
    nounsActive: initialNounsGandalf,
    nounsCollection: loadNounsCollection(),
    rings: 0,
    log: loadLog(),
    paceStartedAt: performance.now(),
    soundOn: false,
    warmth: savedSettings.warmth ?? 0.62,
    smoke: savedSettings.smoke ?? 0.58,
    lantern: false,
    phaseName: "Settle",
    guidePace: ""
  };

  const dom = {
    body: document.body,
    timerFace: document.getElementById("timerFace"),
    timerText: document.getElementById("timerText"),
    timerCaption: document.getElementById("timerCaption"),
    wizardLine: document.getElementById("wizardLine"),
    phaseName: document.getElementById("phaseName"),
    phaseHint: document.getElementById("phaseHint"),
    guideStep: document.getElementById("guideStep"),
    guideTitle: document.getElementById("guideTitle"),
    guideText: document.getElementById("guideText"),
    versionButtons: Array.from(document.querySelectorAll(".version-button")),
    visualButtons: Array.from(document.querySelectorAll(".nature-button")),
    intentionButtons: Array.from(document.querySelectorAll(".intention-button")),
    cueButtons: Array.from(document.querySelectorAll(".cue-button")),
    intentionTitle: document.getElementById("intentionTitle"),
    intentionText: document.getElementById("intentionText"),
    roomStep: document.getElementById("roomStep"),
    ambienceStep: document.getElementById("ambienceStep"),
    settleStep: document.getElementById("settleStep"),
    durationButtons: Array.from(document.querySelectorAll(".duration-button")),
    companionButtons: Array.from(document.querySelectorAll(".wizard-button")),
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    ritualButtons: Array.from(document.querySelectorAll(".ritual-button")),
    ritualName: document.getElementById("ritualName"),
    ritualText: document.getElementById("ritualText"),
    wisdomBar: document.getElementById("wisdomBar"),
    wisdomRank: document.getElementById("wisdomRank"),
    nounsAvatar: document.getElementById("nounsAvatar"),
    nounsName: document.getElementById("nounsName"),
    nounsMeta: document.getElementById("nounsMeta"),
    nounsMantra: document.getElementById("nounsMantra"),
    nounsCollected: document.getElementById("nounsCollected"),
    nounsCount: document.getElementById("nounsCount"),
    nounsGrid: document.getElementById("nounsGrid"),
    pullGandalfButton: document.getElementById("pullGandalfButton"),
    collectGandalfButton: document.getElementById("collectGandalfButton"),
    meditateGandalfButton: document.getElementById("meditateGandalfButton"),
    startButton: document.getElementById("startButton"),
    pauseButton: document.getElementById("pauseButton"),
    resetButton: document.getElementById("resetButton"),
    blendSelect: document.getElementById("blendSelect"),
    drawButton: document.getElementById("drawButton"),
    exhaleButton: document.getElementById("exhaleButton"),
    wisdomButton: document.getElementById("wisdomButton"),
    soundButton: document.getElementById("soundButton"),
    lanternButton: document.getElementById("lanternButton"),
    lanternExitButton: document.getElementById("lanternExitButton"),
    hushButton: document.getElementById("hushButton"),
    warmthSlider: document.getElementById("warmthSlider"),
    smokeSlider: document.getElementById("smokeSlider"),
    smokeLabel: document.getElementById("smokeLabel"),
    paceLabel: document.getElementById("paceLabel"),
    paceCount: document.getElementById("paceCount"),
    paceBar: document.getElementById("paceBar"),
    ringCount: document.getElementById("ringCount"),
    ringLabel: document.getElementById("ringLabel"),
    sessionCount: document.getElementById("sessionCount"),
    totalMinutes: document.getElementById("totalMinutes"),
    wisdomCount: document.getElementById("wisdomCount"),
    ritualSummary: document.getElementById("ritualSummary"),
    blendLabel: document.getElementById("blendLabel"),
    noteInput: document.getElementById("noteInput"),
    sealEntryButton: document.getElementById("sealEntryButton"),
    clearLogButton: document.getElementById("clearLogButton"),
    logList: document.getElementById("logList"),
    canvas: document.getElementById("smokeCanvas")
  };

  const ctx = dom.canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const visuals = {
    rings: [],
    particles: [],
    lastFrame: performance.now(),
    nextWisp: performance.now() + 1600,
    nextParticle: performance.now() + 300
  };

  const audio = {
    context: null,
    masterGain: null,
    droneGain: null,
    low: null,
    high: null,
    timers: []
  };

  function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function loadLog() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function loadNounsCollection() {
    try {
      const raw = localStorage.getItem(NOUNS_COLLECTION_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const validIds = new Set(nounsGandalfs.map((card) => card.id));
      return new Set(Array.isArray(parsed) ? parsed.filter((id) => validIds.has(id)) : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveLog() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.log.slice(0, 12)));
  }

  function saveSettings() {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        release: SETTINGS_RELEASE,
        version: state.version,
        mode: state.mode,
        companion: state.companion,
        visual: state.visual,
        intention: state.intention,
        renderStyle: state.renderStyle,
        ritual: state.ritual,
        nounsActive: state.nounsActive,
        warmth: state.warmth,
        smoke: state.smoke
      })
    );
  }

  function saveNounsCollection() {
    localStorage.setItem(NOUNS_COLLECTION_KEY, JSON.stringify(Array.from(state.nounsCollection)));
  }

  function activeCompanion() {
    return companions[state.companion] || companions.hearth;
  }

  function activeView() {
    return natureViews[state.visual] || natureViews.glade;
  }

  function activeIntention() {
    return intentions[state.intention] || intentions.rest;
  }

  function activeRenderStyle() {
    return renderStyles[state.renderStyle] || renderStyles.storybook;
  }

  function activeRitual() {
    return rituals[state.ritual] || rituals.meditate;
  }

  function activeNounsGandalf() {
    return nounsGandalfs.find((card) => card.id === state.nounsActive) || nounsGandalfs[0];
  }

  function isNatureVersion(version = state.version) {
    return version === "v3" || version === "v4" || version === "v5";
  }

  function isCollectibleVersion(version = state.version) {
    return version === "v5";
  }

  function applyNounStyle(element, card) {
    element.style.setProperty("--card-bg", card.bg);
    element.style.setProperty("--hat", card.hat);
    element.style.setProperty("--robe", card.robe);
    element.style.setProperty("--lens", card.lens);
    element.style.setProperty("--spark", card.spark);
  }

  function renderNounAvatar(target, card, isSmall) {
    if (!target) {
      return;
    }

    target.replaceChildren();
    target.className = isSmall ? "noun-avatar noun-avatar-small" : "noun-avatar";
    target.title = card.name;
    applyNounStyle(target, card);

    ["noun-robe", "noun-staff", "noun-hat", "noun-face", "noun-beard", "noun-glasses"].forEach((className) => {
      const part = document.createElement("span");
      part.className = className;
      target.append(part);
    });

    const mark = document.createElement("span");
    mark.className = "noun-mark";
    mark.textContent = card.noun.slice(0, 2).toUpperCase();
    target.append(mark);
  }

  function presenceScore() {
    const totalMinutes = state.log.reduce((sum, entry) => sum + entry.minutes, 0);
    return state.nounsCollection.size * 7 + state.log.length * 5 + Math.floor(totalMinutes / 3) + state.rings;
  }

  function presenceRank(score) {
    if (score >= 220) {
      return "Deeply here";
    }
    if (score >= 140) {
      return "Warmly present";
    }
    if (score >= 82) {
      return "Settled in";
    }
    if (score >= 38) {
      return "Enjoying the room";
    }
    if (score >= 12) {
      return "Arriving";
    }
    return "Just arrived";
  }

  function updateRitualPanel() {
    const ritual = activeRitual();
    const score = presenceScore();
    const nextBreak = score >= 220 ? 220 : score >= 140 ? 220 : score >= 82 ? 140 : score >= 38 ? 82 : score >= 12 ? 38 : 12;
    const previousBreak = score >= 220 ? 220 : score >= 140 ? 140 : score >= 82 ? 82 : score >= 38 ? 38 : score >= 12 ? 12 : 0;
    const progress = nextBreak === previousBreak ? 100 : ((score - previousBreak) / (nextBreak - previousBreak)) * 100;

    dom.body.dataset.ritual = state.ritual;
    dom.ritualButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.ritual === state.ritual);
    });

    if (dom.ritualName) {
      dom.ritualName.textContent = `${ritual.title} · ${ritual.short}`;
      dom.ritualText.textContent = ritual.guide;
      dom.wisdomBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
      dom.wisdomRank.textContent = `${score} presence · ${presenceRank(score)}`;
    }
  }

  function replaceBlendOptions(options) {
    const current = dom.blendSelect.value;

    dom.blendSelect.replaceChildren();
    options.forEach((option) => {
      const element = document.createElement("option");
      element.value = option;
      element.textContent = option;
      dom.blendSelect.append(element);
    });

    if (options.includes(current)) {
      dom.blendSelect.value = current;
    }
  }

  function updateBlendOptions() {
    replaceBlendOptions(activeRitual().blendOptions);
  }

  function updateNounsPanel() {
    if (!dom.nounsGrid) {
      return;
    }

    const card = activeNounsGandalf();
    const collected = state.nounsCollection.has(card.id);
    const ritual = activeRitual();
    renderNounAvatar(dom.nounsAvatar, card, false);
    dom.body.dataset.collectible = card.id;
    dom.nounsName.textContent = card.name;
    dom.nounsMeta.textContent = `${card.rarity} · ${ritual.title} · ${natureViews[card.visual].name} · ${intentions[card.intention].title}`;
    dom.nounsMantra.textContent = card.mantra;
    dom.nounsCollected.textContent = collected ? "kept" : "waiting";
    dom.collectGandalfButton.textContent = collected ? "Kept" : "Keep cue";
    dom.collectGandalfButton.disabled = collected;
    dom.meditateGandalfButton.textContent = ritual.startLabel;
    dom.nounsCount.textContent = `${state.nounsCollection.size} / ${nounsGandalfs.length} kept`;
  }

  function renderNounsCollection() {
    if (!dom.nounsGrid) {
      return;
    }

    dom.nounsGrid.replaceChildren();
    nounsGandalfs.forEach((card) => {
      const button = document.createElement("button");
      const avatar = document.createElement("span");
      const name = document.createElement("strong");
      const status = document.createElement("small");
      const collected = state.nounsCollection.has(card.id);

      button.type = "button";
      button.className = "nouns-card";
      button.classList.toggle("is-active", card.id === state.nounsActive);
      button.classList.toggle("is-collected", collected);
      button.dataset.nounsId = card.id;
      button.setAttribute("aria-pressed", String(card.id === state.nounsActive));
      button.setAttribute("aria-label", `${card.name}, ${collected ? "kept" : "not kept"}`);
      applyNounStyle(button, card);

      renderNounAvatar(avatar, card, true);
      name.textContent = card.noun;
      status.textContent = collected ? "kept" : card.mode;

      button.append(avatar, name, status);
      button.addEventListener("click", () => setNounsGandalf(card.id));
      dom.nounsGrid.append(button);
    });

    updateNounsPanel();
  }

  function setGuide(step, title, text) {
    dom.guideStep.textContent = step;
    dom.guideTitle.textContent = title;
    dom.guideText.textContent = text;
  }

  function updateGuideIdle(step) {
    if (state.version === "v1") {
      return;
    }

    if (isCollectibleVersion()) {
      const card = activeNounsGandalf();
      const view = activeView();
      const ritual = activeRitual();
      setGuide(step || "Deck cue", `${ritual.title} · ${card.name}`, `${ritual.guide} ${card.mantra} ${view.idle}`);
      return;
    }

    if (isNatureVersion()) {
      const view = activeView();
      const intention = activeIntention();
      const renderStyle = activeRenderStyle();
      setGuide(step || "Nature cue", `${view.name} · ${renderStyle.name}`, `${view.idle} ${intention.text} ${renderStyle.idle}`);
      return;
    }

    const companion = activeCompanion();
    setGuide(step || "Next", companion.name, companion.idle);
  }

  function updateGuideForPace(label, countdown) {
    if (state.version === "v1") {
      return;
    }

    if (isCollectibleVersion()) {
      const card = activeNounsGandalf();
      const ritual = activeRitual();
      const lowerLabel = label.toLowerCase();
      const copyByRitual = {
        enjoy: {
          Inhale: `Breathe in for ${countdown}. Notice one pleasant detail near ${card.name}.`,
          Hold: `Rest for ${countdown}. Nothing needs to become useful.`,
          Exhale: `Breathe out for ${countdown}. Let the good part stay simple.`
        },
        meditate: {
          Inhale: `Breathe in for ${countdown}. ${card.breath.split(".")[0]}.`,
          Hold: `Hold for ${countdown}. Let ${card.name} keep the cue for you.`,
          Exhale: `Breathe out for ${countdown}. ${card.cue}`
        },
        smoke: {
          Inhale: `Draw gently for ${countdown}. Keep it easy and ceremonial.`,
          Hold: `Hold for ${countdown}. Let ${card.name} mind the room.`,
          Exhale: `Exhale for ${countdown}. Let the smoke carry ${card.noun.toLowerCase()}-sized worry away.`
        },
        beer: {
          Inhale: `Breathe in for ${countdown}. Notice the warmth before the glass.`,
          Hold: `Rest for ${countdown}. Let the table hold the thought.`,
          Exhale: `Breathe out for ${countdown}. Take the room slowly, then return to ${card.name}.`
        },
        study: {
          Inhale: `Read the cue for ${countdown}. ${card.mantra}`,
          Hold: `Hold for ${countdown}. Let the useful part separate from the clever part.`,
          Exhale: `File one thought for ${countdown}. ${card.cue}`
        }
      };
      const copy = copyByRitual[state.ritual] || copyByRitual.enjoy;

      setGuide(`Now: ${lowerLabel}`, `${ritual.title} · ${card.name}`, copy[label] || card.mantra);
      return;
    }

    if (isNatureVersion()) {
      const view = activeView();
      const lowerLabel = label.toLowerCase();
      const copy = {
        Inhale: `Breathe in for ${countdown}. Keep the ${view.name.toLowerCase()} soft in your eyes.`,
        Hold: `Hold for ${countdown}. Let the view hold the edges of the room.`,
        Exhale: `Breathe out for ${countdown}. Let one thing loosen without needing a story.`
      };

      setGuide(`Now: ${lowerLabel}`, view.name, copy[label] || view.idle);
      return;
    }

    const companion = activeCompanion();
    const lowerLabel = label.toLowerCase();
    const copy = {
      Inhale: `Draw in for ${countdown}. Let ${companion.name} keep the room steady.`,
      Hold: `Hold for ${countdown}. Nothing needs chasing.`,
      Exhale: `Exhale for ${countdown}. Let the smoke drift; tap Smoke ring if you want to see it go.`
    };

    setGuide(`Now: ${lowerLabel}`, companion.name, copy[label] || companion.idle);
  }

  function chooseLine() {
    if (isCollectibleVersion()) {
      const card = activeNounsGandalf();
      const intention = activeIntention();
      const pool = [card.line, card.mantra, card.cue, card.breath].concat(activeRitual().lines, activeView().lines, intention.lines, activeRenderStyle().lines);
      const next = pool[Math.floor(Math.random() * pool.length)];
      dom.wizardLine.textContent = next;
      return;
    }

    if (isNatureVersion()) {
      const view = activeView();
      const intention = activeIntention();
      const pool = view.lines.concat(intention.lines, activeRenderStyle().lines);
      const next = pool[Math.floor(Math.random() * pool.length)];
      dom.wizardLine.textContent = next;
      return;
    }

    const companion = activeCompanion();
    const pool = state.version === "v1" || Math.random() <= 0.38 ? modeLines[state.mode] : companion.lines;
    const next = pool[Math.floor(Math.random() * pool.length)];
    dom.wizardLine.textContent = next;
  }

  function updateTimer() {
    const progress = 1 - state.remaining / state.duration;
    const degrees = Math.max(0, Math.min(360, progress * 360));
    dom.timerFace.style.setProperty("--progress", `${degrees}deg`);
    dom.timerText.textContent = formatTime(state.remaining);
    dom.timerCaption.textContent = state.running
      ? isCollectibleVersion()
        ? activeRitual().runningLabel
        : isNatureVersion()
        ? "breathing slowly"
        : "keeping watch"
      : isCollectibleVersion()
        ? activeRitual().idleLabel
        : isNatureVersion()
        ? "nature sit"
        : "pipe pause";
    updatePhase(progress);
  }

  function updatePhase(progress) {
    const active = phases.reduce((current, phase) => (progress >= phase.threshold ? phase : current), phases[0]);

    if (active.name !== state.phaseName) {
      state.phaseName = active.name;
      if (state.running) {
        addSmoke({ count: 4, power: 0.8, spread: 54, countTowardSession: false });
      }
    }

    dom.phaseName.textContent = active.name;
    if (isCollectibleVersion()) {
      const card = activeNounsGandalf();
      const ritual = activeRitual();
      const hints = {
        Settle: `${ritual.phaseHints.Settle} ${card.mantra}`,
        Drift: `${ritual.phaseHints.Drift} ${card.cue}`,
        Return: `${ritual.phaseHints.Return} Bring back ${card.noun.toLowerCase()}-sized calm.`
      };
      dom.phaseHint.textContent = hints[active.name] || card.mantra;
    } else if (isNatureVersion()) {
      dom.phaseHint.textContent = activeView().phases[active.name] || active.hint;
    } else {
      dom.phaseHint.textContent = state.version === "v1" ? active.hint : activeCompanion().phases[active.name] || active.hint;
    }
  }

  function updateStats() {
    const totalMinutes = state.log.reduce((sum, entry) => sum + entry.minutes, 0);
    const score = presenceScore();
    dom.ringCount.textContent = String(isCollectibleVersion() ? state.nounsCollection.size : state.rings);
    dom.sessionCount.textContent = String(state.log.length);
    dom.totalMinutes.textContent = String(totalMinutes);
    if (dom.wisdomCount) {
      dom.wisdomCount.textContent = String(score);
    }
    updateRitualPanel();
  }

  function renderLog() {
    dom.logList.replaceChildren();

    if (state.log.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No notes saved yet.";
      dom.logList.append(empty);
      updateStats();
      return;
    }

    state.log.slice(0, 8).forEach((entry) => {
      const item = document.createElement("li");
      const meta = document.createElement("div");
      const note = document.createElement("p");
      const left = document.createElement("span");
      const right = document.createElement("span");
      const mode = entry.mode ? ` / ${entry.mode}` : "";
      const companion = entry.companion ? ` / ${entry.companion.replace(" Gandalf", "")}` : "";
      const visual = entry.visual ? ` / ${entry.visual}` : "";
      const intention = entry.intention ? ` / ${entry.intention}` : "";
      const ritual = entry.ritual ? ` / ${entry.ritual}` : "";
      const style = entry.style ? ` / ${entry.style}` : "";
      const version = entry.version ? `${entry.version.toUpperCase()} / ` : "";

      meta.className = "log-meta";
      note.className = "log-note";

      left.textContent = `${version}${entry.minutes} min / ${entry.blend}${ritual}${mode}${companion}${visual}${intention}${style}`;
      right.textContent = entry.date;
      note.textContent = entry.note || "A quiet bowl, kept well.";

      meta.append(left, right);
      item.append(meta, note);
      dom.logList.append(item);
    });

    updateStats();
  }

  async function startSession() {
    if (state.remaining <= 0) {
      state.remaining = state.duration;
    }

    if (isCollectibleVersion()) {
      collectNounsGandalf(state.nounsActive, { quiet: true });
    }

    state.running = true;
    state.paceStartedAt = performance.now();
    state.guidePace = "";
    dom.startButton.textContent = "Running";
    dom.startButton.disabled = true;
    dom.pauseButton.disabled = false;
    chooseLine();
    updateGuideIdle("Sit has begun");

    if (!state.soundOn) {
      await setSound(true);
    }
  }

  function pauseSession() {
    state.running = false;
    dom.startButton.textContent = isCollectibleVersion() ? `Resume ${activeRitual().title.toLowerCase()}` : isNatureVersion() ? "Resume nature sit" : "Resume quiet sit";
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.timerCaption.textContent = isCollectibleVersion() ? activeRitual().idleLabel : isNatureVersion() ? "nature sit" : "pipe pause";
    if (isCollectibleVersion()) {
      setGuide("Paused", `${activeRitual().title} · ${activeNounsGandalf().name}`, "The card will keep its place. Return without fuss.");
    } else if (isNatureVersion()) {
      setGuide("Paused", activeView().name, "The place will keep waiting. Come back without hurry.");
    } else if (state.version === "v2") {
      setGuide("Paused", activeCompanion().name, activeCompanion().paused);
    }
  }

  function resetSession() {
    state.running = false;
    state.remaining = state.duration;
    state.phaseName = "";
    dom.startButton.textContent = isCollectibleVersion() ? activeRitual().startLabel : isNatureVersion() ? "Start nature sit" : "Start quiet sit";
    dom.startButton.disabled = false;
    dom.pauseButton.disabled = true;
    dom.paceLabel.textContent = "Settle";
    dom.paceCount.textContent = "0";
    dom.paceBar.style.width = "0%";
    state.guidePace = "";
    updateGuideIdle("Next");
    updateTimer();
  }

  function completeSession() {
    pauseSession();
    dom.startButton.textContent = isCollectibleVersion() ? activeRitual().startLabel : isNatureVersion() ? "Start nature sit" : "Start quiet sit";
    state.remaining = 0;
    updateTimer();
    if (isCollectibleVersion()) {
      collectNounsGandalf(state.nounsActive, { quiet: true });
      dom.wizardLine.textContent = activeRitual().complete;
      setGuide("Complete", `${activeRitual().title} · ${activeNounsGandalf().name}`, "The cue is in your pouch. Let the rest stay here.");
    } else if (isNatureVersion()) {
      dom.wizardLine.textContent = "There. The room feels less crowded now.";
      setGuide("Complete", activeView().name, "Carry one color, one sound, and one easier breath back with you.");
    } else if (state.version === "v2") {
      dom.wizardLine.textContent = "There. A little more room in the world.";
      setGuide("Complete", activeCompanion().name, activeCompanion().complete);
    } else {
      dom.wizardLine.textContent = "There. A little more room in the world.";
    }
    addSmoke({ count: 12, power: 1.2, spread: 100, countTowardSession: true });
    spawnParticles(18);
  }

  function setDuration(minutes) {
    state.duration = minutes * 60;
    state.remaining = state.duration;
    dom.durationButtons.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.minutes) === minutes);
    });
    resetSession();
  }

  function setVersion(version) {
    const next = versions.has(version) ? version : RELEASE_VERSION;
    state.version = next;
    dom.body.dataset.version = next;
    dom.versionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.version === next);
    });

    dom.roomStep.textContent = next === "v1" ? "1" : "2";
    dom.ambienceStep.textContent = next === "v1" ? "2" : "3";
    dom.roomStep.textContent = isCollectibleVersion(next) ? "3" : dom.roomStep.textContent;
    dom.ambienceStep.textContent = isCollectibleVersion(next) ? "4" : dom.ambienceStep.textContent;
    dom.settleStep.textContent = isCollectibleVersion(next) ? "5" : "4";
    dom.ritualSummary.textContent = isCollectibleVersion(next) ? activeRitual().summary : isNatureVersion(next) ? "Session scent and tally" : "Pipe leaf and tally";
    dom.blendLabel.textContent = isCollectibleVersion(next) ? activeRitual().blendLabel : isNatureVersion(next) ? "Session scent" : "Pipe leaf";
    dom.smokeLabel.textContent = isNatureVersion(next) ? "Atmosphere" : "Smoke";
    dom.ringLabel.textContent = isCollectibleVersion(next) ? "cards" : isNatureVersion(next) ? "cues" : "rings";
    dom.startButton.textContent = state.running ? "Running" : isCollectibleVersion(next) ? activeRitual().startLabel : isNatureVersion(next) ? "Start nature sit" : "Start quiet sit";
    if (!isCollectibleVersion(next)) {
      replaceBlendOptions(
        isNatureVersion(next)
          ? ["Moss breath", "Rain-window calm", "Meadow air", "Moonwater quiet"]
          : ["Shire mild", "Ranger nightleaf", "Wizard reserve", "Hearthside clover"]
      );
    }

    if (next === "v1" && state.mode === "stars") {
      setMode("fire");
      return;
    }

    if (next === "v1") {
      dom.phaseHint.textContent = phases.find((phase) => phase.name === state.phaseName)?.hint || phases[0].hint;
      chooseLine();
    } else if (isCollectibleVersion(next)) {
      if (state.renderStyle !== "pixel") {
        setRenderStyle("pixel");
      }
      setNounsGandalf(state.nounsActive, { announce: false });
      setRitual(state.ritual, { quiet: true });
      renderNounsCollection();
      updateGuideIdle("V5 ready");
      chooseLine();
    } else if (isNatureVersion(next)) {
      if (next === "v4" && state.renderStyle !== "pixel") {
        setRenderStyle("pixel");
      } else if (next === "v3" && state.renderStyle !== "storybook") {
        setRenderStyle("storybook");
      }
      setVisual(state.visual);
      setIntention(state.intention);
      updateGuideIdle(next === "v4" ? "V4 ready" : "Nature ready");
    } else {
      updateGuideIdle("V2 ready");
    }

    saveSettings();
  }

  function setNounsGandalf(id, options) {
    const settings = options || {};
    const next = nounsGandalfs.some((card) => card.id === id) ? id : nounsGandalfs[0].id;
    const card = nounsGandalfs.find((item) => item.id === next) || nounsGandalfs[0];

    state.nounsActive = next;
    dom.body.dataset.collectible = next;

    if (settings.syncWorld !== false) {
      setVisual(card.visual, { syncMode: false });
      setIntention(card.intention);
      setMode(card.mode);
    } else {
      saveSettings();
    }

    renderNounsCollection();

    if (settings.announce !== false && isCollectibleVersion()) {
      dom.wizardLine.textContent = card.line;
      setGuide("Card chosen", `${activeRitual().title} · ${card.name}`, `${card.mantra} ${card.trait}.`);
      spawnParticles(6);
    }

    saveSettings();
  }

  function collectNounsGandalf(id, options) {
    const card = nounsGandalfs.find((item) => item.id === id) || activeNounsGandalf();
    const wasCollected = state.nounsCollection.has(card.id);
    const settings = options || {};

    state.nounsCollection.add(card.id);
    saveNounsCollection();
    renderNounsCollection();
    updateStats();

    if (!settings.quiet) {
      dom.wizardLine.textContent = wasCollected ? `${card.name} is already in your keepsake pouch.` : card.cue;
      setGuide(wasCollected ? "Already kept" : "Cue kept", `${activeRitual().title} · ${card.name}`, card.breath);
      spawnParticles(wasCollected ? 4 : 12);
    }
    updateRitualPanel();
  }

  function pullNounsGandalf() {
    const uncollected = nounsGandalfs.filter((card) => !state.nounsCollection.has(card.id));
    const pool = uncollected.length > 0 ? uncollected : nounsGandalfs;
    const current = activeNounsGandalf();
    const choices = pool.length > 1 ? pool.filter((card) => card.id !== current.id) : pool;
    const card = choices[Math.floor(Math.random() * choices.length)];

    setNounsGandalf(card.id, { announce: false });
    dom.wizardLine.textContent = card.line;
    setGuide("Pulled", `${activeRitual().title} · ${card.name}`, `${card.mantra} ${card.cue}`);
    spawnParticles(10);
  }

  async function beginNounsMeditation() {
    collectNounsGandalf(state.nounsActive, { quiet: true });
    if (state.duration !== 5 * 60) {
      setDuration(5);
    }
    await startSession();
    setGuide(`${activeRitual().title} started`, activeNounsGandalf().name, activeNounsGandalf().breath);
  }

  function setRitual(ritual, options) {
    const next = rituals[ritual] ? ritual : "meditate";
    const settings = options || {};

    state.ritual = next;
    dom.body.dataset.ritual = next;
    dom.ritualButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.ritual === next);
    });

    if (isCollectibleVersion()) {
      dom.ritualSummary.textContent = activeRitual().summary;
      dom.blendLabel.textContent = activeRitual().blendLabel;
      dom.smokeLabel.textContent = next === "smoke" ? "Smoke" : next === "beer" ? "Warmth haze" : "Atmosphere";
      dom.startButton.textContent = state.running ? "Running" : activeRitual().startLabel;
      dom.timerCaption.textContent = state.running ? activeRitual().runningLabel : activeRitual().idleLabel;
      state.warmth = activeRitual().warmth;
      state.smoke = activeRitual().smoke;
      dom.warmthSlider.value = String(Math.round(state.warmth * 100));
      dom.smokeSlider.value = String(Math.round(state.smoke * 100));
      updateAudioLevels();
      updateBlendOptions();
      updateNounsPanel();
      updateGuideIdle(settings.quiet ? "V5 ready" : "Ritual set");
      if (!settings.quiet) {
        dom.wizardLine.textContent = activeRitual().lines[0];
        spawnParticles(next === "smoke" ? 8 : 5);
      }
    }

    updateRitualPanel();
    saveSettings();
  }

  function setMode(mode) {
    const nextMode = state.version === "v1" && mode === "stars" ? "fire" : mode;
    state.mode = nextMode;
    dom.body.dataset.mode = nextMode;
    dom.modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === nextMode);
    });
    saveSettings();
    chooseLine();
    tuneDrone();

    if (state.soundOn) {
      clearSoundTimers();
      scheduleAmbience();
    }

    if (!state.running) {
      updateGuideIdle(isCollectibleVersion() ? "Room set" : isNatureVersion() ? "Sound set" : "Next");
    }
  }

  function setCompanion(companion, options) {
    const next = companions[companion] ? companion : "hearth";
    const settings = options || {};

    state.companion = next;
    dom.body.dataset.companion = next;
    dom.companionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.companion === next);
    });

    if (settings.syncMode !== false) {
      setMode(companions[next].mode);
    } else {
      saveSettings();
    }

    chooseLine();
    updateGuideIdle(
      isCollectibleVersion()
        ? "Deck ready"
        : isNatureVersion()
        ? "Nature ready"
        : settings.syncMode === false
          ? "Choose your Gandalf"
          : "Companion chosen"
    );
  }

  function setVisual(visual, options) {
    const next = natureViews[visual] ? visual : "glade";
    const settings = options || {};

    state.visual = next;
    dom.body.dataset.visual = next;
    dom.visualButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.visual === next);
    });

    if (settings.syncMode !== false) {
      setMode(natureViews[next].mode);
    } else {
      saveSettings();
    }

    if (isNatureVersion()) {
      chooseLine();
      updateGuideIdle(isCollectibleVersion() ? "Card view" : "View chosen");
    }
  }

  function setIntention(intention) {
    const next = intentions[intention] ? intention : "rest";
    const active = intentions[next];

    state.intention = next;
    dom.body.dataset.intention = next;
    dom.intentionButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.intention === next);
    });
    dom.intentionTitle.textContent = active.title;
    dom.intentionText.textContent = active.text;
    saveSettings();

    if (isNatureVersion()) {
      chooseLine();
      updateGuideIdle(isCollectibleVersion() ? "Card cue" : "Intention set");
    }
  }

  function setRenderStyle(renderStyle) {
    const next = renderStyles[renderStyle] ? renderStyle : "storybook";
    state.renderStyle = next;
    dom.body.dataset.render = next;
    saveSettings();

    if (isNatureVersion()) {
      chooseLine();
      updateGuideIdle(isCollectibleVersion() ? "Deck style" : next === "pixel" ? "Pixel style" : "Storybook style");
      spawnParticles(next === "pixel" ? 10 : 5);
    }
  }

  function playCue(cue) {
    const view = activeView();
    const card = activeNounsGandalf();
    const text = isCollectibleVersion()
      ? activeRitual().cues[cue] || {
        look: card.cue,
        listen: card.mantra,
        breathe: card.breath,
        release: `Let ${card.noun.toLowerCase()}-sized calm be enough.`
      }[cue] || card.mantra
      : view.cues[cue] || view.idle;
    const labels = {
      look: "Look",
      listen: "Listen",
      breathe: "Breathe",
      release: "Release"
    };

    dom.wizardLine.textContent = text;
    setGuide(labels[cue] || "Cue", isCollectibleVersion() ? `${activeRitual().title} · ${card.name}` : view.name, text);

    if (cue === "breathe") {
      addSmoke({ count: 4, power: 0.55, spread: 70, countTowardSession: false });
    } else {
      spawnParticles(cue === "release" ? 12 : 6);
    }

    state.rings += 1;
    updateStats();
  }

  function setWarmth(value) {
    state.warmth = Number(value) / 100;
    saveSettings();
    updateAudioLevels();
  }

  function setSmoke(value) {
    state.smoke = Number(value) / 100;
    saveSettings();
  }

  function sealEntry() {
    const minutes = Math.round(state.duration / 60);
    const presence = presenceScore();
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

    state.log.unshift({
      date: formatter.format(new Date()),
      minutes,
      blend: dom.blendSelect.value,
      rings: state.rings,
      mode: state.mode,
      version: state.version,
      ritual: isCollectibleVersion() ? activeRitual().title : "",
      companion: state.version === "v2" ? activeCompanion().name : isCollectibleVersion() ? activeNounsGandalf().name : "",
      visual: isNatureVersion() ? activeView().name : "",
      intention: isNatureVersion() ? activeIntention().title : "",
      style: isNatureVersion() ? activeRenderStyle().name : "",
      presence,
      wisdom: presence,
      note: dom.noteInput.value.trim()
    });

    state.log = state.log.slice(0, 12);
    dom.noteInput.value = "";
    saveLog();
    renderLog();
    dom.wizardLine.textContent = "A record kept is a small lantern against forgetfulness.";
  }

  function clearLog() {
    state.log = [];
    saveLog();
    renderLog();
    dom.wizardLine.textContent = "Blank pages are not empty. They are patient.";
  }

  function updatePace(now) {
    if (!state.running) {
      return;
    }

    const total = pace.reduce((sum, item) => sum + item.seconds, 0);
    const elapsed = ((now - state.paceStartedAt) / 1000) % total;
    let cursor = 0;

    for (const item of pace) {
      const nextCursor = cursor + item.seconds;
      if (elapsed <= nextCursor) {
        const local = elapsed - cursor;
        const countdown = Math.max(1, Math.ceil(item.seconds - local));
        const width = Math.min(100, (local / item.seconds) * 100);
        dom.paceLabel.textContent = item.label;
        dom.paceCount.textContent = String(countdown);
        dom.paceBar.style.width = `${width}%`;
        if (state.guidePace !== `${item.label}-${countdown}`) {
          state.guidePace = `${item.label}-${countdown}`;
          updateGuideForPace(item.label, countdown);
        }
        return;
      }
      cursor = nextCursor;
    }
  }

  function tick(now) {
    if (!tick.previous) {
      tick.previous = now;
    }

    const delta = (now - tick.previous) / 1000;
    tick.previous = now;

    if (state.running) {
      state.remaining = Math.max(0, state.remaining - delta);
      if (state.remaining <= 0) {
        completeSession();
      }
      updatePace(now);
    }

    updateTimer();
    requestAnimationFrame(tick);
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    dom.canvas.width = Math.floor(window.innerWidth * ratio);
    dom.canvas.height = Math.floor(window.innerHeight * ratio);
    dom.canvas.style.width = `${window.innerWidth}px`;
    dom.canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function addSmoke(options) {
    const baseCount = options.count || 1;
    const intensity = 0.35 + state.smoke * 0.95;
    const count = Math.max(1, Math.round(baseCount * intensity));
    const power = options.power || 0.7;
    const spread = options.spread || 24;
    const originX = options.x || window.innerWidth * 0.68;
    const originY = options.y || window.innerHeight * 0.72;

    for (let index = 0; index < count; index += 1) {
      visuals.rings.push({
        x: originX + (Math.random() - 0.5) * spread,
        y: originY + (Math.random() - 0.5) * spread * 0.45,
        radius: 10 + Math.random() * 14,
        alpha: (0.26 + Math.random() * 0.22) * intensity,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.22 - Math.random() * 0.38 - power * 0.08,
        wobble: Math.random() * 200,
        stretch: 0.58 + Math.random() * 0.34,
        line: 1 + Math.random() * 1.8
      });
    }

    visuals.rings = visuals.rings.slice(-150);

    if (options.countTowardSession) {
      state.rings += count;
      updateStats();
    }
  }

  function spawnParticles(count) {
    if (reducedMotion) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const type = state.mode;

      if (type === "rain") {
        visuals.particles.push({
          type,
          x: Math.random() * window.innerWidth,
          y: -30 - Math.random() * 160,
          vx: -0.8 - Math.random() * 0.6,
          vy: 8 + Math.random() * 7,
          length: 14 + Math.random() * 34,
          alpha: 0.16 + Math.random() * 0.22,
          life: 1
        });
        continue;
      }

      if (type === "road") {
        visuals.particles.push({
          type,
          x: window.innerWidth * (0.35 + Math.random() * 0.48),
          y: window.innerHeight * (0.58 + Math.random() * 0.3),
          vx: -0.16 + Math.random() * 0.34,
          vy: -0.06 - Math.random() * 0.22,
          radius: 1.2 + Math.random() * 3.8,
          alpha: 0.12 + Math.random() * 0.16,
          life: 1
        });
        continue;
      }

      if (type === "stars") {
        visuals.particles.push({
          type,
          x: window.innerWidth * (0.24 + Math.random() * 0.66),
          y: window.innerHeight * (0.08 + Math.random() * 0.52),
          vx: -0.02 + Math.random() * 0.04,
          vy: -0.02 + Math.random() * 0.04,
          radius: 0.9 + Math.random() * 2.4,
          alpha: 0.16 + Math.random() * 0.28,
          twinkle: Math.random() * 1000,
          life: 1
        });
        continue;
      }

      visuals.particles.push({
        type: "fire",
        x: window.innerWidth * (0.62 + Math.random() * 0.34),
        y: window.innerHeight * (0.72 + Math.random() * 0.22),
        vx: -0.08 + Math.random() * 0.18,
        vy: -0.36 - Math.random() * 0.74,
        radius: 1.4 + Math.random() * 3.8,
        alpha: 0.18 + Math.random() * 0.32,
        life: 1
      });
    }

    visuals.particles = visuals.particles.slice(-220);
  }

  function drawParticles(delta, now) {
    visuals.particles.forEach((particle) => {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.life -= delta * (particle.type === "rain" ? 0.00038 : 0.00012);

      if (particle.type === "rain") {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x + particle.vx * particle.length, particle.y + particle.length);
        ctx.strokeStyle = `rgba(176, 196, 207, ${Math.max(0, particle.alpha * particle.life)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      if (particle.type === "stars") {
        const pulse = 0.6 + Math.sin((now + particle.twinkle) / 460) * 0.4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(221, 226, 207, ${Math.max(0, particle.alpha * particle.life * pulse)})`;
        ctx.shadowColor = "rgba(157, 179, 213, 0.38)";
        ctx.shadowBlur = 10;
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      const color = particle.type === "road" ? "209, 168, 91" : "232, 156, 67";
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color}, ${Math.max(0, particle.alpha * particle.life)})`;
      ctx.shadowColor = `rgba(${color}, 0.26)`;
      ctx.shadowBlur = particle.type === "road" ? 6 : 12;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    visuals.particles = visuals.particles.filter((particle) => {
      return particle.life > 0 && particle.y < window.innerHeight + 80 && particle.y > -180 && particle.x > -120 && particle.x < window.innerWidth + 120;
    });
  }

  function drawSmoke(now) {
    const delta = Math.min(42, now - visuals.lastFrame || 16);
    visuals.lastFrame = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.shadowBlur = 0;

    if (!reducedMotion && now > visuals.nextParticle) {
      const count = state.mode === "rain" ? 7 : state.mode === "stars" ? 2 : 3;
      spawnParticles(count);
      visuals.nextParticle = now + (state.mode === "rain" ? 110 : state.mode === "stars" ? 900 : 420);
    }

    if (state.running && now > visuals.nextWisp) {
      addSmoke({ count: 1, power: 0.4, spread: 32, countTowardSession: false });
      visuals.nextWisp = now + 1900 + Math.random() * (5200 - state.smoke * 2600);
    }

    drawParticles(delta, now);

    visuals.rings.forEach((ring) => {
      ring.radius += delta * 0.018;
      ring.x += ring.vx * delta + Math.sin((now + ring.wobble) / 760) * 0.08;
      ring.y += ring.vy * delta;
      ring.alpha -= delta * 0.00012;

      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * ring.stretch, Math.sin(now / 1600) * 0.18, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(233, 231, 213, ${Math.max(0, ring.alpha)})`;
      ctx.lineWidth = ring.line;
      ctx.shadowColor = "rgba(232, 156, 67, 0.12)";
      ctx.shadowBlur = 12;
      ctx.stroke();
    });

    visuals.rings = visuals.rings.filter((ring) => ring.alpha > 0 && ring.y > -120);
    requestAnimationFrame(drawSmoke);
  }

  function createAudioGraph() {
    audio.context = new (window.AudioContext || window.webkitAudioContext)();
    audio.masterGain = audio.context.createGain();
    audio.droneGain = audio.context.createGain();
    audio.low = audio.context.createOscillator();
    audio.high = audio.context.createOscillator();

    audio.low.type = "sine";
    audio.high.type = "triangle";
    audio.low.connect(audio.droneGain);
    audio.high.connect(audio.droneGain);
    audio.droneGain.connect(audio.masterGain);
    audio.masterGain.connect(audio.context.destination);

    tuneDrone();
    updateAudioLevels();
    audio.low.start();
    audio.high.start();
  }

  function updateAudioLevels() {
    if (!audio.context || !audio.masterGain || !audio.droneGain) {
      return;
    }

    const now = audio.context.currentTime;
    const tone = modeTones[state.mode];
    audio.masterGain.gain.setTargetAtTime(state.warmth * 0.18, now, 0.08);
    audio.droneGain.gain.setTargetAtTime(tone.drone * (0.35 + state.warmth), now, 0.14);
  }

  function tuneDrone() {
    if (!audio.context || !audio.low || !audio.high) {
      return;
    }

    const now = audio.context.currentTime;
    const tone = modeTones[state.mode];
    audio.low.frequency.setTargetAtTime(tone.low, now, 0.22);
    audio.high.frequency.setTargetAtTime(tone.high, now, 0.22);
    updateAudioLevels();
  }

  function clearSoundTimers() {
    audio.timers.forEach((timer) => window.clearTimeout(timer));
    audio.timers = [];
  }

  function queueSound(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    audio.timers.push(timer);
  }

  function noiseBuffer(duration) {
    const samples = Math.floor(audio.context.sampleRate * duration);
    const buffer = audio.context.createBuffer(1, samples, audio.context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < samples; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function playNoise(options) {
    const now = audio.context.currentTime;
    const source = audio.context.createBufferSource();
    const filter = audio.context.createBiquadFilter();
    const gain = audio.context.createGain();

    source.buffer = noiseBuffer(options.duration);
    filter.type = options.filterType;
    filter.frequency.value = options.frequency;
    filter.Q.value = options.q || 0.7;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(options.gain * state.warmth, now + options.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);

    source.connect(filter).connect(gain).connect(audio.masterGain);
    source.start(now);
    source.stop(now + options.duration + 0.02);
  }

  function playBell() {
    const now = audio.context.currentTime;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    const frequencies = [329.63, 392.0, 493.88, 587.33];

    oscillator.type = "sine";
    oscillator.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025 * state.warmth, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    oscillator.connect(gain).connect(audio.masterGain);
    oscillator.start(now);
    oscillator.stop(now + 2.4);
  }

  function playRoadStep() {
    const now = audio.context.currentTime;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(82 + Math.random() * 18, now);
    oscillator.frequency.exponentialRampToValueAtTime(46, now + 0.18);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025 * state.warmth, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(gain).connect(audio.masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }

  function scheduleAmbience() {
    if (!state.soundOn || !audio.context || audio.context.state === "suspended") {
      return;
    }

    if (state.mode === "rain") {
      playNoise({ duration: 0.18, filterType: "highpass", frequency: 1500, q: 0.6, gain: 0.018, attack: 0.018 });
      queueSound(scheduleAmbience, 70 + Math.random() * 180);
      return;
    }

    if (state.mode === "road") {
      playNoise({ duration: 0.62, filterType: "lowpass", frequency: 620, q: 0.5, gain: 0.012, attack: 0.12 });
      if (Math.random() > 0.55) {
        playRoadStep();
      }
      queueSound(scheduleAmbience, 480 + Math.random() * 1400);
      return;
    }

    if (state.mode === "stars") {
      if (Math.random() > 0.32) {
        playBell();
      }
      queueSound(scheduleAmbience, 1800 + Math.random() * 4200);
      return;
    }

    playNoise({ duration: 0.035 + Math.random() * 0.09, filterType: "bandpass", frequency: 550 + Math.random() * 1800, q: 1.4, gain: 0.12 + Math.random() * 0.12, attack: 0.006 });
    queueSound(scheduleAmbience, 120 + Math.random() * 850);
  }

  async function setSound(nextOn) {
    state.soundOn = nextOn;

    if (!state.soundOn) {
      dom.soundButton.textContent = "Turn ambience on";
      clearSoundTimers();
      if (audio.context) {
        await audio.context.suspend();
      }
      return;
    }

    if (!audio.context) {
      createAudioGraph();
    }

    dom.soundButton.textContent = "Mute ambience";
    await audio.context.resume();
    tuneDrone();
    updateAudioLevels();
    clearSoundTimers();
    scheduleAmbience();
  }

  function hush() {
    setSound(false);
    visuals.rings = [];
    visuals.particles = [];
    dom.wizardLine.textContent = "A good silence asks for nothing.";
    if (isCollectibleVersion()) {
      setGuide("Quiet", `${activeRitual().title} · ${activeNounsGandalf().name}`, "Ambience is off. Keep the card, keep the cue, keep it simple.");
    } else if (isNatureVersion()) {
      setGuide("Quiet", activeView().name, "Ambience is off. Let the picture do the holding for a while.");
    } else if (state.version === "v2") {
      setGuide("Quiet", activeCompanion().name, "Ambience is off. The room can stay still for a while.");
    }
  }

  function toggleLantern(force) {
    state.lantern = typeof force === "boolean" ? force : !state.lantern;
    dom.body.classList.toggle("lantern-mode", state.lantern);
    dom.lanternButton.textContent = state.lantern ? "Exit focus" : "Focus view";
  }

  dom.durationButtons.forEach((button) => {
    button.addEventListener("click", () => setDuration(Number(button.dataset.minutes)));
  });

  dom.versionButtons.forEach((button) => {
    button.addEventListener("click", () => setVersion(button.dataset.version));
  });

  dom.visualButtons.forEach((button) => {
    button.addEventListener("click", () => setVisual(button.dataset.visual));
  });

  dom.intentionButtons.forEach((button) => {
    button.addEventListener("click", () => setIntention(button.dataset.intention));
  });

  dom.cueButtons.forEach((button) => {
    button.addEventListener("click", () => playCue(button.dataset.cue));
  });

  dom.companionButtons.forEach((button) => {
    button.addEventListener("click", () => setCompanion(button.dataset.companion));
  });

  dom.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  dom.ritualButtons.forEach((button) => {
    button.addEventListener("click", () => setRitual(button.dataset.ritual));
  });

  dom.pullGandalfButton.addEventListener("click", pullNounsGandalf);
  dom.collectGandalfButton.addEventListener("click", () => collectNounsGandalf(state.nounsActive));
  dom.meditateGandalfButton.addEventListener("click", () => beginNounsMeditation());
  dom.startButton.addEventListener("click", startSession);
  dom.pauseButton.addEventListener("click", pauseSession);
  dom.resetButton.addEventListener("click", resetSession);
  dom.drawButton.addEventListener("click", () => addSmoke({ count: 2, power: 0.8, spread: 28, countTowardSession: true }));
  dom.exhaleButton.addEventListener("click", () => addSmoke({ count: 7, power: 1.2, spread: 72, countTowardSession: true }));
  dom.wisdomButton.addEventListener("click", chooseLine);
  dom.soundButton.addEventListener("click", () => setSound(!state.soundOn));
  dom.hushButton.addEventListener("click", hush);
  dom.lanternButton.addEventListener("click", () => toggleLantern());
  dom.lanternExitButton.addEventListener("click", () => toggleLantern(false));
  dom.warmthSlider.addEventListener("input", (event) => setWarmth(event.target.value));
  dom.smokeSlider.addEventListener("input", (event) => setSmoke(event.target.value));
  dom.sealEntryButton.addEventListener("click", sealEntry);
  dom.clearLogButton.addEventListener("click", clearLog);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.lantern) {
      toggleLantern(false);
    }
  });

  dom.warmthSlider.value = String(Math.round(state.warmth * 100));
  dom.smokeSlider.value = String(Math.round(state.smoke * 100));

  resizeCanvas();
  renderLog();
  renderNounsCollection();
  setRenderStyle(state.renderStyle);
  setVersion(state.version);
  setRitual(state.ritual, { quiet: true });
  setCompanion(state.companion, { syncMode: false });
  setMode(state.mode);
  updateTimer();
  updateGuideIdle(isCollectibleVersion() ? "V5 ready" : isNatureVersion() ? (state.version === "v4" ? "V4 ready" : "Nature ready") : "Next");
  requestAnimationFrame(tick);
  requestAnimationFrame(drawSmoke);
})();
