(function () {
  "use strict";

  const STORAGE_KEY = "sitting-with-gandalf-log";
  const SETTINGS_KEY = "sitting-with-gandalf-settings";
  const NOUNS_COLLECTION_KEY = "sitting-with-gandalf-nouns-collection";
  const KEEPSAKE_COLLECTION_KEY = "sitting-with-gandalf-keepsake-collection";
  const RESOURCE_LEVELS_KEY = "sitting-with-gandalf-resource-levels";
  const SPELLBOOK_KEY = "sitting-with-gandalf-spellbook";
  const DEFAULT_MINUTES = 15;
  const RELEASE_VERSION = "v7";
  const SETTINGS_RELEASE = "v7-noun-story";
  const versions = new Set(["v1", "v2", "v3", "v4", "v5", "v6", "v7"]);
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
      summary: "Presence, spells, tally",
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
      summary: "Ritual, spells, tally",
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
      summary: "Pipe leaf, spells, tally",
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
      summary: "Tavern pour, spells, tally",
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
      summary: "Study charm, spells, tally",
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

  const keepsakeRelics = [
    {
      id: "ember-coin",
      name: "Ember Coin",
      family: "warmth",
      rarity: "Common",
      mark: "EC",
      bg: "#3a241a",
      tone: "#f0b45b",
      shadow: "#7b4025",
      cue: "Hold one warm thought without squeezing it.",
      line: "A small heat in the pocket can make the whole road less stern."
    },
    {
      id: "moss-pin",
      name: "Moss Pin",
      family: "rest",
      rarity: "Common",
      mark: "MP",
      bg: "#263827",
      tone: "#9fbc68",
      shadow: "#405f35",
      cue: "Let the softest green thing do nothing correctly.",
      line: "Some comfort works because it does not announce itself."
    },
    {
      id: "rain-bead",
      name: "Rain Bead",
      family: "listening",
      rarity: "Common",
      mark: "RB",
      bg: "#24333c",
      tone: "#a7d3de",
      shadow: "#3f6370",
      cue: "Count three quiet sounds before adding a thought.",
      line: "Rain is old practice at arriving one drop at a time."
    },
    {
      id: "pipe-match",
      name: "Pipe Match",
      family: "pause",
      rarity: "Common",
      mark: "PM",
      bg: "#33291f",
      tone: "#ef9e54",
      shadow: "#71472e",
      cue: "Touch the pause before the next draw.",
      line: "The match is brief, but it remembers how to begin."
    },
    {
      id: "road-button",
      name: "Road Button",
      family: "wander",
      rarity: "Uncommon",
      mark: "RO",
      bg: "#3a3328",
      tone: "#d0bd7a",
      shadow: "#725f37",
      cue: "Choose the next step, then stop negotiating with the horizon.",
      line: "A button stays useful because it holds one small thing together."
    },
    {
      id: "moon-thread",
      name: "Moon Thread",
      family: "ease",
      rarity: "Uncommon",
      mark: "MT",
      bg: "#252a3c",
      tone: "#d7d9ff",
      shadow: "#4f5578",
      cue: "Let one silver line lead you back to the chair.",
      line: "The moon does not hurry, and somehow it is never late."
    },
    {
      id: "map-corner",
      name: "Map Corner",
      family: "direction",
      rarity: "Uncommon",
      mark: "MC",
      bg: "#3d3424",
      tone: "#dfc586",
      shadow: "#80673b",
      cue: "Fold the big plan until only the next inch remains.",
      line: "A torn corner may still know where north is."
    },
    {
      id: "lantern-wick",
      name: "Lantern Wick",
      family: "clarity",
      rarity: "Uncommon",
      mark: "LW",
      bg: "#392b1e",
      tone: "#ffd27a",
      shadow: "#8e5c2e",
      cue: "Make the thought smaller until it can be lit.",
      line: "A wick does not blaze by arguing. It receives the flame."
    },
    {
      id: "tea-token",
      name: "Tea Token",
      family: "steep",
      rarity: "Rare",
      mark: "TT",
      bg: "#273a38",
      tone: "#c5e7c8",
      shadow: "#4d7269",
      cue: "Wait one breath longer than the answer demands.",
      line: "The steeping is part of the flavor."
    },
    {
      id: "star-salt",
      name: "Star Salt",
      family: "wonder",
      rarity: "Rare",
      mark: "SS",
      bg: "#24243b",
      tone: "#f4e6a6",
      shadow: "#676097",
      cue: "Add a pinch of wonder and stop measuring the whole sky.",
      line: "Even a tiny sparkle can season the dark."
    },
    {
      id: "quiet-key",
      name: "Quiet Key",
      family: "release",
      rarity: "Rare",
      mark: "QK",
      bg: "#2c3029",
      tone: "#d6d2ad",
      shadow: "#5c6456",
      cue: "Unlock nothing. Just feel the door become less important.",
      line: "Not every key is for opening; some are for remembering you can leave."
    },
    {
      id: "garden-note",
      name: "Garden Note",
      family: "kindness",
      rarity: "Rare",
      mark: "GN",
      bg: "#273822",
      tone: "#bddd7d",
      shadow: "#587144",
      cue: "Write the gentlest version of the thought in your head.",
      line: "A note kept kindly changes the way the day reads it back."
    }
  ];

  const spellResources = [
    {
      id: "focus",
      name: "Focus",
      short: "single flame",
      mark: "FO",
      tone: "#f2c56b",
      bg: "#3a2d1e",
      prompt: "Choose one thing and make the rest quieter.",
      action: "narrow",
      promise: "the next thing becomes small enough to begin",
      words: ["clear", "steady", "one"]
    },
    {
      id: "patience",
      name: "Patience",
      short: "slow road",
      mark: "PA",
      tone: "#9fbc68",
      bg: "#263827",
      prompt: "Let the answer arrive without being dragged by the sleeve.",
      action: "soften",
      promise: "the waiting stops feeling like waste",
      words: ["wait", "root", "green"]
    },
    {
      id: "warmth",
      name: "Warmth",
      short: "kept ember",
      mark: "WA",
      tone: "#ef9e54",
      bg: "#3a241a",
      prompt: "Make the room friendlier before making the plan sharper.",
      action: "warm",
      promise: "the room remembers you are allowed to enjoy it",
      words: ["ember", "near", "kind"]
    },
    {
      id: "wonder",
      name: "Wonder",
      short: "wide sky",
      mark: "WO",
      tone: "#d7d9ff",
      bg: "#252a3c",
      prompt: "Leave one corner of the thought unexplained on purpose.",
      action: "widen",
      promise: "the world gets larger than the problem",
      words: ["star", "wide", "ask"]
    },
    {
      id: "courage",
      name: "Courage",
      short: "small yes",
      mark: "CO",
      tone: "#d0bd7a",
      bg: "#3d3424",
      prompt: "Take the next honest step without asking it to be the whole road.",
      action: "steady",
      promise: "the first step stops needing a speech",
      words: ["step", "lamp", "true"]
    },
    {
      id: "ease",
      name: "Ease",
      short: "loose hand",
      mark: "EA",
      tone: "#a7d3de",
      bg: "#24333c",
      prompt: "Remove one unnecessary grip from the minute.",
      action: "loosen",
      promise: "the breath has somewhere pleasant to land",
      words: ["loose", "rain", "room"]
    }
  ];

  const wizardFramework = [
    {
      key: "hat",
      label: "Hat",
      role: "signal",
      items: [
        { id: "moss-brim", name: "Moss Brim", mark: "MB", tone: "#9fbc68", bg: "#263827", clue: "low green patience" },
        { id: "moon-cone", name: "Moon Cone", mark: "MC", tone: "#d7d9ff", bg: "#252a3c", clue: "cool reflected thought" },
        { id: "ember-cap", name: "Ember Cap", mark: "EC", tone: "#ef9e54", bg: "#3a241a", clue: "warm permission" },
        { id: "rain-hood", name: "Rain Hood", mark: "RH", tone: "#a7d3de", bg: "#24333c", clue: "sheltered listening" },
        { id: "road-crown", name: "Road Crown", mark: "RC", tone: "#d0bd7a", bg: "#3d3424", clue: "humble direction" },
        { id: "star-fold", name: "Star Fold", mark: "SF", tone: "#f4e6a6", bg: "#24243b", clue: "night witness" }
      ]
    },
    {
      key: "beard",
      label: "Beard",
      role: "temper",
      items: [
        { id: "silver-fork", name: "Silver Fork", mark: "SI", tone: "#d7d3bd", bg: "#3a3a32", clue: "two ways made gentle" },
        { id: "cloud-braid", name: "Cloud Braid", mark: "CB", tone: "#eef3ff", bg: "#273346", clue: "shape-change without panic" },
        { id: "ember-split", name: "Ember Split", mark: "ES", tone: "#ffc16f", bg: "#3a241f", clue: "warmth in the pause" },
        { id: "rainfall-sweep", name: "Rainfall Sweep", mark: "RS", tone: "#b5edf0", bg: "#1d3840", clue: "the thought rinses itself" },
        { id: "root-curl", name: "Root Curl", mark: "RO", tone: "#cfc08a", bg: "#2f2a22", clue: "depth before speed" },
        { id: "tide-whisker", name: "Tide Whisker", mark: "TW", tone: "#f4ead6", bg: "#2d3443", clue: "old hush from the shore" }
      ]
    },
    {
      key: "staff",
      label: "Staff",
      role: "tool",
      items: [
        { id: "ember-staff", name: "Ember Staff", mark: "ES", tone: "#e89c43", bg: "#33251f", clue: "one brave little light" },
        { id: "wave-staff", name: "Wave Staff", mark: "WS", tone: "#8fc3bf", bg: "#20343d", clue: "yield and continue" },
        { id: "moon-reed", name: "Moon Reed", mark: "MR", tone: "#9bbde4", bg: "#222b42", clue: "cool air through the hand" },
        { id: "road-crook", name: "Road Crook", mark: "RK", tone: "#dfc586", bg: "#3c3425", clue: "next inch only" },
        { id: "signal-wand", name: "Signal Wand", mark: "SW", tone: "#b9d37d", bg: "#25313a", clue: "clear enough to begin" },
        { id: "garden-root", name: "Garden Root", mark: "GR", tone: "#bddd7d", bg: "#273822", clue: "kindness with roots" }
      ]
    },
    {
      key: "robe",
      label: "Robe",
      role: "mood",
      items: [
        { id: "hearth-brown", name: "Hearth Brown", mark: "HB", tone: "#d0bd7a", bg: "#31291f", clue: "ordinary comfort" },
        { id: "forest-green", name: "Forest Green", mark: "FG", tone: "#82a35e", bg: "#223f31", clue: "soft cover" },
        { id: "rain-blue", name: "Rain Blue", mark: "RB", tone: "#9bd7e0", bg: "#20353b", clue: "weather outside" },
        { id: "wine-velvet", name: "Wine Velvet", mark: "WV", tone: "#d58a91", bg: "#3a2525", clue: "evening pleasure" },
        { id: "pixel-charcoal", name: "Pixel Charcoal", mark: "PC", tone: "#f0c96a", bg: "#202520", clue: "tiny bright squares" },
        { id: "meadow-gold", name: "Meadow Gold", mark: "MG", tone: "#f1db8b", bg: "#333923", clue: "wide room" }
      ]
    },
    {
      key: "relic",
      label: "Relic",
      role: "hold",
      items: [
        { id: "ember-coin", name: "Ember Coin", mark: "EC", tone: "#f0b45b", bg: "#3a241a", clue: "carry warmth lightly" },
        { id: "moss-pin", name: "Moss Pin", mark: "MP", tone: "#9fbc68", bg: "#263827", clue: "pin the hurry down" },
        { id: "rain-bead", name: "Rain Bead", mark: "RB", tone: "#a7d3de", bg: "#24333c", clue: "count three drops" },
        { id: "wine-glass", name: "Red Wine Glass", mark: "WG", tone: "#d58a91", bg: "#3a2525", clue: "pleasure without rush" },
        { id: "coast-shell", name: "Coast Shell", mark: "CS", tone: "#f4ead6", bg: "#2d3443", clue: "vastness in the pocket" },
        { id: "oil-lantern", name: "Oil Lantern", mark: "OL", tone: "#ffd27a", bg: "#392b1e", clue: "a thought made visible" }
      ]
    },
    {
      key: "realm",
      label: "Realm",
      role: "place",
      items: [
        { id: "moss-glade", name: "Moss Glade", mark: "MG", tone: "#9fbc68", bg: "#1f3a2d", clue: "green attention" },
        { id: "rain-garden", name: "Rain Garden", mark: "RG", tone: "#a7d3de", bg: "#20343d", clue: "porch listening" },
        { id: "road-meadow", name: "Road Meadow", mark: "RM", tone: "#dfc586", bg: "#3d3424", clue: "the next honest step" },
        { id: "moon-lake", name: "Moon Lake", mark: "ML", tone: "#d7d9ff", bg: "#222b42", clue: "reflection without replay" },
        { id: "socal-coast", name: "SoCal Coast", mark: "SC", tone: "#8fc3bf", bg: "#24333c", clue: "marine layer calm" },
        { id: "paris-rain", name: "Paris Rain", mark: "PR", tone: "#f1d7a1", bg: "#302a31", clue: "soft city evening" }
      ]
    }
  ];

  const nounWizardHeads = [
    { id: "moss-head", name: "Moss Head", mark: "MH", tone: "#9fbc68", shadow: "#48643d", clue: "green square calm" },
    { id: "ember-head", name: "Ember Head", mark: "EH", tone: "#ef9e54", shadow: "#7a3e26", clue: "warm block focus" },
    { id: "rain-head", name: "Rain Head", mark: "RH", tone: "#9bd7e0", shadow: "#386670", clue: "cool pixel listening" },
    { id: "moon-head", name: "Moon Head", mark: "MO", tone: "#d7d9ff", shadow: "#6d73a2", clue: "soft reflected thought" },
    { id: "road-head", name: "Road Head", mark: "RD", tone: "#dfc586", shadow: "#7c6337", clue: "next-inch resolve" },
    { id: "wine-head", name: "Wine Head", mark: "WH", tone: "#d58a91", shadow: "#693843", clue: "evening pleasure" },
    { id: "coast-head", name: "Coast Head", mark: "CH", tone: "#8fc3bf", shadow: "#33615f", clue: "marine layer ease" },
    { id: "cream-head", name: "Cream Head", mark: "CR", tone: "#f4ead6", shadow: "#8b7a5e", clue: "quiet parchment mind" }
  ];

  const nounWizardNoggles = [
    { id: "classic-red-blue", name: "Classic Red / Blue", mark: "RB", left: "#f25d5d", right: "#70a8ff", frame: "#0a0b0c", clue: "dao-table clarity" },
    { id: "moss-gold", name: "Moss Gold", mark: "MG", left: "#b9d37d", right: "#f0c96a", frame: "#11150e", clue: "soft green signal" },
    { id: "ember-cyan", name: "Ember Cyan", mark: "EC", left: "#ef9e54", right: "#8fc3bf", frame: "#101010", clue: "warm idea, cool hand" },
    { id: "wine-moon", name: "Wine Moon", mark: "WM", left: "#d58a91", right: "#d7d9ff", frame: "#151018", clue: "pleasure with wonder" },
    { id: "rain-cream", name: "Rain Cream", mark: "RC", left: "#a7d3de", right: "#f4ead6", frame: "#0e1518", clue: "weather made gentle" },
    { id: "pixel-brass", name: "Pixel Brass", mark: "PB", left: "#f0c96a", right: "#ffd27a", frame: "#16140c", clue: "tiny bright decision" }
  ];

  const nounWizardAccessories = [
    { id: "pipe", name: "Pipe", mark: "PI", tone: "#8b6037", bg: "#2b2119", clue: "slow rings, no hurry" },
    { id: "beer", name: "Tavern Pint", mark: "TP", tone: "#e3a85f", bg: "#3a2818", clue: "ordinary joy kept near" },
    { id: "book", name: "Small Book", mark: "BK", tone: "#b9c7e8", bg: "#222b42", clue: "one page wiser" },
    { id: "leaf", name: "Shire Leaf", mark: "LF", tone: "#9fbc68", bg: "#263827", clue: "green pause" },
    { id: "wand", name: "Signal Wand", mark: "WD", tone: "#f0c96a", bg: "#2f2a22", clue: "one bright instruction" },
    { id: "shell", name: "Coast Shell", mark: "SH", tone: "#f4ead6", bg: "#2d3443", clue: "sea hush in pocket" }
  ];

  const nounWizardProtocolVersion = "WN-7.1";

  const nounWizardAuras = [
    { id: "hearth-glow", name: "Hearth Glow", mark: "HG", tone: "#ef9e54", bg: "#3a241a", clue: "warm room around the build" },
    { id: "moss-halo", name: "Moss Halo", mark: "MH", tone: "#9fbc68", bg: "#263827", clue: "green quiet around the head" },
    { id: "rain-veil", name: "Rain Veil", mark: "RV", tone: "#a7d3de", bg: "#24333c", clue: "weather softened into privacy" },
    { id: "moon-ring", name: "Moon Ring", mark: "MR", tone: "#d7d9ff", bg: "#222b42", clue: "cool light without pressure" },
    { id: "coast-haze", name: "Coast Haze", mark: "CH", tone: "#8fc3bf", bg: "#24333c", clue: "marine layer as patience" },
    { id: "pixel-spark", name: "Pixel Spark", mark: "PS", tone: "#f0c96a", bg: "#202520", clue: "tiny square of attention" }
  ];

  const nounWizardCharms = [
    { id: "pocket-moon", name: "Pocket Moon", mark: "PM", tone: "#d7d9ff", bg: "#222b42", clue: "keeps wonder small enough to carry" },
    { id: "road-button", name: "Road Button", mark: "RB", tone: "#dfc586", bg: "#3d3424", clue: "fastens the next step" },
    { id: "study-candle", name: "Study Candle", mark: "SC", tone: "#fff0a8", bg: "#33251f", clue: "turns attention upright" },
    { id: "rain-pebble", name: "Rain Pebble", mark: "RP", tone: "#a7d3de", bg: "#24333c", clue: "simple weight in weather" },
    { id: "coast-shell", name: "Coast Shell", mark: "CS", tone: "#f4ead6", bg: "#2d3443", clue: "old hush from the water" },
    { id: "ember-match", name: "Ember Match", mark: "EM", tone: "#ef9e54", bg: "#3a241a", clue: "one bright permission" },
    { id: "garden-thread", name: "Garden Thread", mark: "GT", tone: "#bddd7d", bg: "#273822", clue: "mends the mood gently" },
    { id: "star-token", name: "Star Token", mark: "ST", tone: "#f4e6a6", bg: "#24243b", clue: "night kept in the palm" }
  ];

  const nounWizardAtmospheres = [
    { id: "fireplace-hour", name: "Fireplace Hour", mark: "FH", tone: "#ef9e54", bg: "#3a241a", clue: "crackle, low light, no hurry" },
    { id: "rain-window", name: "Rain Window", mark: "RW", tone: "#a7d3de", bg: "#24333c", clue: "outside moving, inside still" },
    { id: "road-dust", name: "Road Dust", mark: "RD", tone: "#dfc586", bg: "#3d3424", clue: "the path can wait" },
    { id: "star-porch", name: "Star Porch", mark: "SP", tone: "#d7d9ff", bg: "#222b42", clue: "wide dark and a small lamp" },
    { id: "marine-layer", name: "Marine Layer", mark: "ML", tone: "#8fc3bf", bg: "#24333c", clue: "coastal softness over the edges" },
    { id: "paris-glow", name: "Paris Glow", mark: "PG", tone: "#d58a91", bg: "#302a31", clue: "wet stone, red wine, lamplight" }
  ];

  const nounWizardOfferings = [
    { id: "pipe-leaf", name: "Pipe Leaf", mark: "PL", tone: "#9fbc68", bg: "#263827", clue: "slow draw, softer thought" },
    { id: "red-wine", name: "Red Wine", mark: "RW", tone: "#d58a91", bg: "#3a2525", clue: "pleasure taken kindly" },
    { id: "small-beer", name: "Small Beer", mark: "SB", tone: "#e3a85f", bg: "#3a2818", clue: "tavern warmth without spectacle" },
    { id: "hot-tea", name: "Hot Tea", mark: "HT", tone: "#f1d7a1", bg: "#302a31", clue: "wait long enough to steep" },
    { id: "ocean-air", name: "Ocean Air", mark: "OA", tone: "#8fc3bf", bg: "#24333c", clue: "vastness before the next word" },
    { id: "firelight", name: "Firelight", mark: "FL", tone: "#ffd27a", bg: "#392b1e", clue: "one room made warmer" },
    { id: "clean-page", name: "Clean Page", mark: "CP", tone: "#f4ead6", bg: "#2f2a22", clue: "a thought with room to land" },
    { id: "quiet-bread", name: "Quiet Bread", mark: "QB", tone: "#d0bd7a", bg: "#3a2d20", clue: "humble comfort counted fully" }
  ];

  const nounWizardLessons = [
    { id: "be-here", name: "Be Here", mark: "BH", tone: "#f0c96a", bg: "#2f2a22", clue: "attention returns to the room" },
    { id: "begin-small", name: "Begin Small", mark: "BS", tone: "#9fbc68", bg: "#263827", clue: "seed-sized is big enough" },
    { id: "soften-grip", name: "Soften Grip", mark: "SG", tone: "#a7d3de", bg: "#24333c", clue: "less force, more contact" },
    { id: "look-again", name: "Look Again", mark: "LA", tone: "#d7d9ff", bg: "#222b42", clue: "wonder before verdict" },
    { id: "enjoy-plainly", name: "Enjoy Plainly", mark: "EP", tone: "#ef9e54", bg: "#3a241a", clue: "ordinary pleasure is allowed" },
    { id: "ask-gently", name: "Ask Gently", mark: "AG", tone: "#f4e6a6", bg: "#24243b", clue: "curiosity without pressure" },
    { id: "wait-kindly", name: "Wait Kindly", mark: "WK", tone: "#dfc586", bg: "#3d3424", clue: "patience with a friendly face" },
    { id: "keep-wonder", name: "Keep Wonder", mark: "KW", tone: "#b9d37d", bg: "#25313a", clue: "leave one corner unexplained" }
  ];

  const actualNounImageBase = "https://noun.pics";
  const actualNounSeeds = [
    1, 7, 17, 28, 42, 88, 99, 137, 174, 205,
    247, 333, 401, 420, 512, 557, 612, 696, 777, 808,
    945, 1020, 1086, 1111, 1169, 1191, 73, 144, 256, 369
  ];

  const imageSeries = [
    {
      id: "mondrian-road-map",
      number: "01",
      title: "Mondrian Road Map",
      style: "geometric coast",
      tags: "mondrian / socal / ocean",
      cue: "Make the coast into a spell grid.",
      prompt: "Create an original Gandalf-adjacent image generation study: a kind grey-robed wandering wizard companion with broad hat, seen as an abstract Southern California coast map made from crisp primary-color rectangles, black grid lines, ocean blue blocks, forest green blocks, and small ember-gold path markers. The composition should feel like a meditative art poster, balanced, sharp, gallery-ready, with no copied painting and no exact character likeness.",
      palette: "primary red, yellow, blue, black, parchment, ocean blue, forest green",
      avoid: "No exact Gandalf film likeness, no actor likeness, no copied Mondrian painting, no logos, no readable text, no watermark."
    },
    {
      id: "warhol-pipe-multiples",
      number: "02",
      title: "Pop Pipe Multiples",
      style: "screenprint panels",
      tags: "warhol / pop / color",
      cue: "Let one wizard become many moods.",
      prompt: "Create a 1960s pop-art screenprint-inspired image generation study: four repeated panels of an original grey-robed wizard companion, each with a different colorway for fire, rain, forest, and ocean. Use bold ink halftone texture, high-contrast flat colors, playful registration offsets, and a calm meditative expression. The subject should be original, not a recognizable film character or actor.",
      palette: "tomato red, cyan, acid yellow, violet, moss green, cream",
      avoid: "No exact Warhol copy, no celebrity portrait, no exact Gandalf film likeness, no actor likeness, no brand marks, no text."
    },
    {
      id: "hoydich-socal-broadcast",
      number: "03",
      title: "Hoydich Broadcast Coast",
      style: "socal broadcast",
      tags: "hoydich / pointcast / el segundo",
      cue: "Turn the sit into a coastal signal.",
      prompt: "Create an original Hoydich / PointCast-flavored Southern California visual: a grey-robed wandering wizard companion sitting near an El Segundo-style coastal overlook, ocean haze, palm-shadow geometry, subtle terminal-green signal dots, small local-broadcast UI glyphs, warm human-made weirdness, and a relaxed evening mood. Make it feel personal, handmade, meditative, and coastal, without using logos or readable interface text.",
      palette: "marine layer blue, concrete tan, palm green, terminal green, sunset brass",
      avoid: "No exact Gandalf film likeness, no actor likeness, no real logo, no readable UI text, no watermark."
    },
    {
      id: "forest-buddha-head",
      number: "04",
      title: "Forest Buddha Head",
      style: "moss meditation",
      tags: "forest / buddha / stillness",
      cue: "Sit beside old stone and listen.",
      prompt: "Create a respectful meditative fantasy image: an original grey-robed wandering wizard companion seated at a distance from a weathered moss-covered Buddha head in a quiet forest. The mood is still, reverent, and gentle; morning fog, damp ferns, soft green light, and no theatrical magic. The wizard is a companion to silence, not the center of worship.",
      palette: "moss green, fog silver, wet stone, dark bark, candle amber",
      avoid: "No exact Gandalf film likeness, no actor likeness, no religious parody, no horror, no logos, no text."
    },
    {
      id: "ocean-waves-blockprint",
      number: "05",
      title: "Ocean Waves Blockprint",
      style: "waves blockprint",
      tags: "ocean / waves / print",
      cue: "Let the waves carve the spell.",
      prompt: "Create a hand-carved blockprint image generation study: an original wise grey-robed wizard companion in profile, tiny against large rhythmic ocean waves, with bold carved linework, imperfect ink edges, sea foam patterns, and a Southern California horizon. The waves should feel musical and meditative, not copied from a famous print.",
      palette: "indigo, cream, seafoam, black ink, sun-faded ochre",
      avoid: "No exact Gandalf film likeness, no actor likeness, no copied Great Wave composition, no logos, no text, no watermark."
    },
    {
      id: "oil-tanker-twilight",
      number: "06",
      title: "Oil Tanker Twilight",
      style: "industrial ocean",
      tags: "tanker / harbor / dusk",
      cue: "Find calm near the horizon machinery.",
      prompt: "Create a cinematic but quiet Southern California harbor image: an original grey-robed wizard companion sitting on a bluff, a distant oil tanker on the twilight ocean, low marine layer, tiny amber harbor lights, and a meditative industrial calm. The composition should make the tanker feel like a slow moving thought on the horizon.",
      palette: "petroleum black, rust red, dusk violet, ocean steel, brass lights",
      avoid: "No exact Gandalf film likeness, no actor likeness, no corporate logos, no disaster scene, no text."
    },
    {
      id: "airplane-marine-layer",
      number: "07",
      title: "Airplane Over Marine Layer",
      style: "airport sky",
      tags: "airplane / lax / clouds",
      cue: "Watch the thought pass overhead.",
      prompt: "Create a serene Southern California aviation image: an original grey-robed wizard companion standing near coastal grasses while a commercial airplane passes high through a peach-blue marine layer sky. Make it feel like LAX-adjacent calm, ocean nearby, soft wind, and a moment of looking up before returning to breath.",
      palette: "peach cloud, sky blue, sage grass, runway grey, warm cream",
      avoid: "No exact Gandalf film likeness, no actor likeness, no airline logos, no readable numbers, no text."
    },
    {
      id: "pixel-campfire",
      number: "08",
      title: "Pixel Campfire",
      style: "16-bit sit",
      tags: "pixel / campfire / game",
      cue: "Make the quiet playable.",
      prompt: "Create a cozy pixel-art image generation study: an original tiny grey wizard companion by a campfire between forest and ocean, 16-bit texture, readable silhouette, gentle animated-game feeling, moonlit waves in the distance, warm pixels, and a small meditative UI-like border with no actual text.",
      palette: "ember orange, moss green, midnight blue, moon silver, pixel cream",
      avoid: "No exact Gandalf film likeness, no actor likeness, no game franchise look, no logos, no readable text."
    },
    {
      id: "monet-paris-rain",
      number: "09",
      title: "Paris Rain Impression",
      style: "monet / paris",
      tags: "paris / france / rain",
      cue: "Let Paris blur the hard edge.",
      prompt: "Create a French impressionist image generation study inspired by Paris rain: an original grey-robed wandering wizard companion seated near a cafe window, soft umbrellas outside, wet boulevard reflections, a small glass of red wine on the table, shimmering brushwork, and gentle atmospheric light. The image should feel like a memory rather than a literal portrait.",
      palette: "rain grey, wine red, lamp gold, wet stone blue, cream",
      avoid: "No exact Gandalf film likeness, no actor likeness, no copied Monet painting, no readable signage, no logos."
    },
    {
      id: "red-wine-atlas",
      number: "10",
      title: "Red Wine Atlas",
      style: "french table",
      tags: "france / red wine / map",
      cue: "Let the map become a table.",
      prompt: "Create a warm tabletop image generation study: an original grey-robed wizard companion reflected faintly in a glass of red wine, an old map of France, Paris marked only by a small abstract dot, candlelight, forest sprig, ocean-shell keepsake, and painterly shadows. Make it intimate, meditative, and quiet.",
      palette: "deep burgundy, candle amber, parchment, olive green, ink black",
      avoid: "No exact Gandalf film likeness, no actor likeness, no readable map labels, no wine branding, no logos, no text."
    },
    {
      id: "forest-ocean-portal",
      number: "11",
      title: "Forest Ocean Portal",
      style: "california threshold",
      tags: "forest / ocean / portal",
      cue: "Stand where green becomes blue.",
      prompt: "Create a magical-real but understated Southern California image: an original grey-robed wizard companion on a trail where coastal forest opens to a blue ocean view. Use subtle portal-like light made from natural fog and sun, not fantasy effects. The mood is restorative, meditative, and clear.",
      palette: "eucalyptus green, ocean blue, fog white, trail brown, sun brass",
      avoid: "No exact Gandalf film likeness, no actor likeness, no glowing sci-fi portal, no logos, no text."
    },
    {
      id: "buddha-waves-tanker",
      number: "12",
      title: "Buddha Waves Tanker",
      style: "surreal calm",
      tags: "buddha / waves / tanker",
      cue: "Hold the strange things together gently.",
      prompt: "Create a surreal meditative collage image: a mossy stone Buddha head, blockprint ocean waves, a distant oil tanker, and an original grey-robed wandering wizard companion seated quietly in the foreground. The elements should feel harmonized, not chaotic: Southern California industrial coast meets forest stillness.",
      palette: "moss, indigo ink, rust, cream, muted gold",
      avoid: "No exact Gandalf film likeness, no actor likeness, no religious parody, no copied famous print, no logos, no text."
    },
    {
      id: "airplane-over-paris",
      number: "13",
      title: "Airplane Over Paris",
      style: "travel memory",
      tags: "airplane / paris / france",
      cue: "Let distance become a soft shape.",
      prompt: "Create a dreamlike travel-memory image generation study: an original grey-robed wizard companion seen from behind at a Paris window, a plane crossing a pale evening sky, rooftops and chimneys below, a forest postcard on the table, and a small glass of red wine catching the last light. Meditative, elegant, not touristy.",
      palette: "Paris grey, wine red, pale gold, slate roof, cream",
      avoid: "No exact Gandalf film likeness, no actor likeness, no airline logos, no readable signs, no text."
    },
    {
      id: "mondrian-tanker-pixel",
      number: "14",
      title: "Tanker Pixel Grid",
      style: "pixel geometry",
      tags: "mondrian / tanker / pixel",
      cue: "Square the horizon into calm.",
      prompt: "Create a pixel-geometric image generation study: an original grey-robed wizard companion as a small calm sprite, an oil tanker simplified into blocky rectangles on an ocean horizon, primary-color grid structure, SoCal sunset haze, and a quiet game-title-screen feeling without any text.",
      palette: "primary red, yellow, blue, black, ocean slate, sunset peach",
      avoid: "No exact Gandalf film likeness, no actor likeness, no copied artwork, no logos, no readable text."
    },
    {
      id: "monet-forest-wine",
      number: "15",
      title: "Forest Wine Impression",
      style: "impressionist forest",
      tags: "monet / forest / red wine",
      cue: "Paint the pause before the sip.",
      prompt: "Create an impressionist forest image generation study: an original grey-robed wizard companion resting near a forest stream, a small glass of red wine on a flat stone, ocean light somehow filtering through trees, loose brushwork, soft color vibration, and a deeply pleasant late-afternoon mood.",
      palette: "leaf green, stream blue, wine red, dappled gold, soft violet",
      avoid: "No exact Gandalf film likeness, no actor likeness, no copied Monet painting, no logos, no text, no watermark."
    }
  ];

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
    : initialVersion === "v4" || initialVersion === "v5" || initialVersion === "v6" || initialVersion === "v7"
      ? "pixel"
      : "storybook";
  const initialNounsGandalf = savedRelease && nounsGandalfs.some((card) => card.id === savedSettings.nounsActive)
    ? savedSettings.nounsActive
    : nounsGandalfs[0].id;
  const initialKeepsake = savedRelease && keepsakeRelics.some((relic) => relic.id === savedSettings.keepsakeActive)
    ? savedSettings.keepsakeActive
    : keepsakeForCardId(initialNounsGandalf, savedRelease && rituals[savedSettings.ritual] ? savedSettings.ritual : "enjoy").id;
  const initialResource = savedRelease && spellResources.some((resource) => resource.id === savedSettings.resourceActive)
    ? savedSettings.resourceActive
    : "focus";
  const initialArtPrompt = savedRelease && imageSeries.some((prompt) => prompt.id === savedSettings.artActive)
    ? savedSettings.artActive
    : imageSeries[0].id;
  const initialNoggleShift = savedRelease && Number.isFinite(Number(savedSettings.noggleShift))
    ? Math.abs(Math.floor(Number(savedSettings.noggleShift))) % actualNounSeeds.length
    : 0;
  const initialCouncilOffset = savedRelease && Number.isFinite(Number(savedSettings.councilOffset))
    ? Math.abs(Math.floor(Number(savedSettings.councilOffset))) % nounsGandalfs.length
    : 0;
  const initialStoryShift = savedRelease && Number.isFinite(Number(savedSettings.storyShift))
    ? Math.abs(Math.floor(Number(savedSettings.storyShift))) % 3
    : 0;
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
    keepsakeActive: initialKeepsake,
    keepsakeCollection: loadKeepsakeCollection(),
    resourceActive: initialResource,
    resourceLevels: loadResourceLevels(),
    spellBook: loadSpellBook(),
    activeSpell: "",
    artActive: initialArtPrompt,
    noggleShift: initialNoggleShift,
    councilOffset: initialCouncilOffset,
    storyShift: initialStoryShift,
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
    v7NounAvatar: document.getElementById("v7NounAvatar"),
    v7Progress: document.getElementById("v7Progress"),
    v7RitualLine: document.getElementById("v7RitualLine"),
    v7WizardTitle: document.getElementById("v7WizardTitle"),
    v7WizardText: document.getElementById("v7WizardText"),
    v7TraitPills: document.getElementById("v7TraitPills"),
    v7FrameworkTitle: document.getElementById("v7FrameworkTitle"),
    v7ElementGrid: document.getElementById("v7ElementGrid"),
    v7NounBuildTitle: document.getElementById("v7NounBuildTitle"),
    v7NounFeatureGrid: document.getElementById("v7NounFeatureGrid"),
    v7CouncilTitle: document.getElementById("v7CouncilTitle"),
    v7CouncilGrid: document.getElementById("v7CouncilGrid"),
    v7StoryTitle: document.getElementById("v7StoryTitle"),
    v7StoryText: document.getElementById("v7StoryText"),
    v7StoryMeta: document.getElementById("v7StoryMeta"),
    v7CollectionGrid: document.getElementById("v7CollectionGrid"),
    v7ForgeHint: document.getElementById("v7ForgeHint"),
    v7RelicName: document.getElementById("v7RelicName"),
    v7ResourceName: document.getElementById("v7ResourceName"),
    v7SpellLine: document.getElementById("v7SpellLine"),
    v7NogglesName: document.getElementById("v7NogglesName"),
    v7CouncilHint: document.getElementById("v7CouncilHint"),
    v7StoryHint: document.getElementById("v7StoryHint"),
    v7SigilLine: document.getElementById("v7SigilLine"),
    v7CueLine: document.getElementById("v7CueLine"),
    v7ImageTitle: document.getElementById("v7ImageTitle"),
    v6NounAvatar: document.getElementById("v6NounAvatar"),
    v6Progress: document.getElementById("v6Progress"),
    v6RitualLine: document.getElementById("v6RitualLine"),
    v6SitTitle: document.getElementById("v6SitTitle"),
    v6SitText: document.getElementById("v6SitText"),
    v6GandalfName: document.getElementById("v6GandalfName"),
    v6GandalfCue: document.getElementById("v6GandalfCue"),
    v6KeepsakeName: document.getElementById("v6KeepsakeName"),
    v6ResourceName: document.getElementById("v6ResourceName"),
    v6ImageTitle: document.getElementById("v6ImageTitle"),
    nounsAvatar: document.getElementById("nounsAvatar"),
    nounsName: document.getElementById("nounsName"),
    nounsMeta: document.getElementById("nounsMeta"),
    nounsMantra: document.getElementById("nounsMantra"),
    nounsCollected: document.getElementById("nounsCollected"),
    nounsCount: document.getElementById("nounsCount"),
    nounsGrid: document.getElementById("nounsGrid"),
    keepsakeBadge: document.getElementById("keepsakeBadge"),
    keepsakeName: document.getElementById("keepsakeName"),
    keepsakeMeta: document.getElementById("keepsakeMeta"),
    keepsakeCue: document.getElementById("keepsakeCue"),
    keepsakeCount: document.getElementById("keepsakeCount"),
    keepsakePair: document.getElementById("keepsakePair"),
    keepsakeGrid: document.getElementById("keepsakeGrid"),
    resourceButtons: Array.from(document.querySelectorAll(".resource-button")),
    resourceName: document.getElementById("resourceName"),
    resourceText: document.getElementById("resourceText"),
    resourceBar: document.getElementById("resourceBar"),
    resourceScore: document.getElementById("resourceScore"),
    spellSigil: document.getElementById("spellSigil"),
    spellPhrase: document.getElementById("spellPhrase"),
    spellCount: document.getElementById("spellCount"),
    spellList: document.getElementById("spellList"),
    sharpenResourceButton: document.getElementById("sharpenResourceButton"),
    buildSpellButton: document.getElementById("buildSpellButton"),
    keepSpellButton: document.getElementById("keepSpellButton"),
    artSeriesNumber: document.getElementById("artSeriesNumber"),
    artSeriesStyle: document.getElementById("artSeriesStyle"),
    artSeriesTags: document.getElementById("artSeriesTags"),
    artSeriesTitle: document.getElementById("artSeriesTitle"),
    artSeriesPrompt: document.getElementById("artSeriesPrompt"),
    artSeriesAvoid: document.getElementById("artSeriesAvoid"),
    artSeriesGrid: document.getElementById("artSeriesGrid"),
    copyArtPromptButton: document.getElementById("copyArtPromptButton"),
    nextArtPromptButton: document.getElementById("nextArtPromptButton"),
    v6PullButton: document.getElementById("v6PullButton"),
    v6PairButton: document.getElementById("v6PairButton"),
    v6BeginButton: document.getElementById("v6BeginButton"),
    v6SharpenButton: document.getElementById("v6SharpenButton"),
    v6KeepButton: document.getElementById("v6KeepButton"),
    v6ImageButton: document.getElementById("v6ImageButton"),
    v6MythButton: document.getElementById("v6MythButton"),
    v7ForgeButton: document.getElementById("v7ForgeButton"),
    v7PairButton: document.getElementById("v7PairButton"),
    v7SharpenButton: document.getElementById("v7SharpenButton"),
    v7SpellButton: document.getElementById("v7SpellButton"),
    v7NogglesButton: document.getElementById("v7NogglesButton"),
    v7CouncilButton: document.getElementById("v7CouncilButton"),
    v7StoryButton: document.getElementById("v7StoryButton"),
    v7SigilButton: document.getElementById("v7SigilButton"),
    v7BeginButton: document.getElementById("v7BeginButton"),
    v7KeepButton: document.getElementById("v7KeepButton"),
    v7ImageButton: document.getElementById("v7ImageButton"),
    v7MythButton: document.getElementById("v7MythButton"),
    pullGandalfButton: document.getElementById("pullGandalfButton"),
    collectGandalfButton: document.getElementById("collectGandalfButton"),
    meditateGandalfButton: document.getElementById("meditateGandalfButton"),
    pullKeepsakeButton: document.getElementById("pullKeepsakeButton"),
    keepKeepsakeButton: document.getElementById("keepKeepsakeButton"),
    startButton: document.getElementById("startButton"),
    pauseButton: document.getElementById("pauseButton"),
    resetButton: document.getElementById("resetButton"),
    blendSelect: document.getElementById("blendSelect"),
    drawButton: document.getElementById("drawButton"),
    exhaleButton: document.getElementById("exhaleButton"),
    wisdomButton: document.getElementById("wisdomButton"),
    soundButton: document.getElementById("soundButton"),
    mythModeButton: document.getElementById("mythModeButton"),
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

  function loadKeepsakeCollection() {
    try {
      const raw = localStorage.getItem(KEEPSAKE_COLLECTION_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const validIds = new Set(keepsakeRelics.map((relic) => relic.id));
      return new Set(Array.isArray(parsed) ? parsed.filter((id) => validIds.has(id)) : []);
    } catch (error) {
      return new Set();
    }
  }

  function loadResourceLevels() {
    try {
      const raw = localStorage.getItem(RESOURCE_LEVELS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return spellResources.reduce((levels, resource) => {
        const value = Number(parsed[resource.id] || 0);
        levels[resource.id] = Number.isFinite(value) ? Math.max(0, Math.min(99, Math.floor(value))) : 0;
        return levels;
      }, {});
    } catch (error) {
      return spellResources.reduce((levels, resource) => {
        levels[resource.id] = 0;
        return levels;
      }, {});
    }
  }

  function loadSpellBook() {
    try {
      const raw = localStorage.getItem(SPELLBOOK_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((spell) => spell && typeof spell.phrase === "string" && typeof spell.resource === "string")
        .slice(0, 8);
    } catch (error) {
      return [];
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
        keepsakeActive: state.keepsakeActive,
        resourceActive: state.resourceActive,
        artActive: state.artActive,
        noggleShift: state.noggleShift,
        councilOffset: state.councilOffset,
        storyShift: state.storyShift,
        warmth: state.warmth,
        smoke: state.smoke
      })
    );
  }

  function saveNounsCollection() {
    localStorage.setItem(NOUNS_COLLECTION_KEY, JSON.stringify(Array.from(state.nounsCollection)));
  }

  function saveKeepsakeCollection() {
    localStorage.setItem(KEEPSAKE_COLLECTION_KEY, JSON.stringify(Array.from(state.keepsakeCollection)));
  }

  function saveResourceLevels() {
    localStorage.setItem(RESOURCE_LEVELS_KEY, JSON.stringify(state.resourceLevels));
  }

  function saveSpellBook() {
    localStorage.setItem(SPELLBOOK_KEY, JSON.stringify(state.spellBook.slice(0, 8)));
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

  function activeKeepsake() {
    return keepsakeRelics.find((relic) => relic.id === state.keepsakeActive) || keepsakeRelics[0];
  }

  function activeResource() {
    return spellResources.find((resource) => resource.id === state.resourceActive) || spellResources[0];
  }

  function activeArtPrompt() {
    return imageSeries.find((prompt) => prompt.id === state.artActive) || imageSeries[0];
  }

  function resourceSharpnessScore() {
    return spellResources.reduce((sum, resource) => sum + (state.resourceLevels[resource.id] || 0), 0);
  }

  function keepsakeSeed(seed) {
    return Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function deterministicItem(items, seed, offset = 0) {
    const safeOffset = Number.isFinite(Number(offset)) ? Math.floor(Number(offset)) : 0;
    return items[(keepsakeSeed(seed) + safeOffset + items.length) % items.length] || items[0];
  }

  function keepsakeForCardId(cardId, ritual = "enjoy") {
    const index = keepsakeSeed(`${cardId}-${ritual}`) % keepsakeRelics.length;
    return keepsakeRelics[index] || keepsakeRelics[0];
  }

  function suggestedKeepsakeForCard(card = activeNounsGandalf(), ritual = state.ritual) {
    return keepsakeForCardId(card.id, ritual);
  }

  function wizardElementsForCard(card = activeNounsGandalf(), ritual = state.ritual) {
    return wizardFramework.map((slot, slotIndex) => {
      const seed = keepsakeSeed(`${card.id}-${card.noun}-${card.rarity}-${card.mode}-${ritual}-${slot.key}-${slotIndex}`);
      const item = slot.items[seed % slot.items.length] || slot.items[0];
      return { key: slot.key, label: slot.label, role: slot.role, item };
    });
  }

  function wizardElement(elements, key) {
    return elements.find((element) => element.key === key)?.item || wizardFramework.find((slot) => slot.key === key)?.items[0];
  }

  function wizardElementPhrase(elements) {
    const hat = wizardElement(elements, "hat");
    const staff = wizardElement(elements, "staff");
    const realm = wizardElement(elements, "realm");
    return `${hat.name}, ${staff.name}, ${realm.name}`;
  }

  function actualNounSeedForCard(card = activeNounsGandalf(), shift = state.noggleShift) {
    const cardIndex = Math.max(0, nounsGandalfs.findIndex((candidate) => candidate.id === card.id));
    const safeShift = Number.isFinite(Number(shift)) ? Math.floor(Number(shift)) : 0;
    return actualNounSeeds[(cardIndex + safeShift + actualNounSeeds.length) % actualNounSeeds.length] || actualNounSeeds[0];
  }

  function actualNounTraitForCard(card = activeNounsGandalf(), shift = state.noggleShift) {
    const seed = actualNounSeedForCard(card, shift);
    return {
      id: `noun-${seed}`,
      name: `Noun #${seed}`,
      mark: `N${seed}`,
      tone: card.lens,
      bg: card.bg,
      clue: "actual CC0 Noun art via noun.pics",
      image: `${actualNounImageBase}/${seed}.svg`
    };
  }

  function nounWizardTraitsForCard(card = activeNounsGandalf(), ritual = state.ritual, shift = state.noggleShift) {
    const seed = keepsakeSeed(`${card.id}-${card.noun}-${card.rarity}-${card.mode}-${ritual}`);
    const safeShift = Number.isFinite(Number(shift)) ? Math.floor(Number(shift)) : 0;

    return {
      actual: actualNounTraitForCard(card, shift),
      head: nounWizardHeads[seed % nounWizardHeads.length] || nounWizardHeads[0],
      noggles: nounWizardNoggles[(seed + safeShift + nounWizardNoggles.length) % nounWizardNoggles.length] || nounWizardNoggles[0],
      accessory: nounWizardAccessories[(seed + safeShift * 2 + nounWizardAccessories.length) % nounWizardAccessories.length] || nounWizardAccessories[0]
    };
  }

  function nounWizardMixForCard(card = activeNounsGandalf(), ritual = state.ritual, shift = state.noggleShift) {
    const safeShift = Number.isFinite(Number(shift)) ? Math.floor(Number(shift)) : 0;
    const seed = `${card.id}-${card.noun}-${ritual}-noun-${actualNounSeedForCard(card, shift)}`;

    return {
      aura: deterministicItem(nounWizardAuras, `${seed}-aura`, safeShift),
      charm: deterministicItem(nounWizardCharms, `${seed}-charm`, safeShift * 2),
      atmosphere: deterministicItem(nounWizardAtmospheres, `${seed}-atmosphere`, safeShift * 3),
      offering: deterministicItem(nounWizardOfferings, `${seed}-offering`, safeShift * 4),
      lesson: deterministicItem(nounWizardLessons, `${seed}-lesson`, safeShift * 5)
    };
  }

  function protocolAttribute(traitType, item, source, detail) {
    return {
      trait_type: traitType,
      value: item.name,
      mark: item.mark,
      tone: item.tone,
      bg: item.bg,
      source,
      detail: detail || item.clue
    };
  }

  function wizardNounProtocolForCard(card = activeNounsGandalf(), ritual = state.ritual, shift = state.noggleShift) {
    const elements = wizardElementsForCard(card, ritual);
    const traits = nounWizardTraitsForCard(card, ritual, shift);
    const mix = nounWizardMixForCard(card, ritual, shift);
    const ritualData = rituals[ritual] || rituals.enjoy;
    const ritualItem = {
      id: ritual,
      name: ritualData.title,
      mark: ritualData.title.slice(0, 2).toUpperCase(),
      tone: "#f0c96a",
      bg: "#2f2a22",
      clue: ritualData.short
    };
    const relic = card.id === state.nounsActive ? activeKeepsake() : suggestedKeepsakeForCard(card, ritual);
    const resourceId = card.id === state.nounsActive ? state.resourceActive : resourceForRitualId(ritual);
    const resource = spellResources.find((item) => item.id === resourceId) || spellResources[0];
    const protocolItem = {
      id: nounWizardProtocolVersion.toLowerCase(),
      name: nounWizardProtocolVersion,
      mark: "WN",
      tone: "#f0c96a",
      bg: "#2f2a22",
      clue: "actual Noun first; deterministic wizard attributes after"
    };
    const attributes = [
      protocolAttribute("Protocol", protocolItem, "creation"),
      protocolAttribute("Actual Noun", traits.actual, "noun.pics", traits.actual.clue),
      protocolAttribute("Ritual", ritualItem, "sit"),
      ...elements.map((element) => protocolAttribute(element.label, element.item, `wizard-${element.role}`)),
      protocolAttribute("Aura", mix.aura, "attribute-mix"),
      protocolAttribute("Charm", mix.charm, "attribute-mix"),
      protocolAttribute("Atmosphere", mix.atmosphere, "attribute-mix"),
      protocolAttribute("Offering", mix.offering, "attribute-mix"),
      protocolAttribute("Lesson", mix.lesson, "attribute-mix"),
      protocolAttribute("Resource", resource, "sharpener"),
      protocolAttribute("Relic Pair", relic, "pairing")
    ];
    const staff = wizardElement(elements, "staff");
    const sigil = [traits.actual.mark, staff.mark, mix.charm.mark, mix.lesson.mark, resource.mark].join("-");

    return {
      version: nounWizardProtocolVersion,
      seed: `${card.id}:${traits.actual.id}:${ritual}:${shift}`,
      sigil,
      card,
      elements,
      traits,
      mix,
      ritual: ritualItem,
      relic,
      resource,
      attributes
    };
  }

  function isNatureVersion(version = state.version) {
    return version === "v3" || version === "v4" || version === "v5" || version === "v6" || version === "v7";
  }

  function isCollectibleVersion(version = state.version) {
    return version === "v5" || version === "v6" || version === "v7";
  }

  function applyNounStyle(element, card) {
    element.style.setProperty("--card-bg", card.bg);
    element.style.setProperty("--hat", card.hat);
    element.style.setProperty("--robe", card.robe);
    element.style.setProperty("--lens", card.lens);
    element.style.setProperty("--spark", card.spark);
  }

  function applyWizardNounStyle(
    element,
    card,
    elements = wizardElementsForCard(card),
    traits = nounWizardTraitsForCard(card),
    mix = nounWizardMixForCard(card)
  ) {
    const hat = wizardElement(elements, "hat");
    const beard = wizardElement(elements, "beard");
    const staff = wizardElement(elements, "staff");
    const robe = wizardElement(elements, "robe");
    const relic = wizardElement(elements, "relic");
    const realm = wizardElement(elements, "realm");

    element.style.setProperty("--noun-head", traits.head.tone);
    element.style.setProperty("--noun-head-shadow", traits.head.shadow);
    element.style.setProperty("--noun-glasses-left", traits.noggles.left);
    element.style.setProperty("--noun-glasses-right", traits.noggles.right);
    element.style.setProperty("--noun-glasses-frame", traits.noggles.frame);
    element.style.setProperty("--noun-accessory", traits.accessory.tone);
    element.style.setProperty("--noun-accessory-bg", traits.accessory.bg);
    element.style.setProperty("--actual-noun-bg", traits.actual.bg);
    element.style.setProperty("--wizard-hat", hat.tone);
    element.style.setProperty("--wizard-beard", beard.tone);
    element.style.setProperty("--wizard-staff", staff.tone);
    element.style.setProperty("--wizard-robe", robe.bg);
    element.style.setProperty("--wizard-trim", robe.tone);
    element.style.setProperty("--wizard-orb", relic.tone);
    element.style.setProperty("--wizard-aura", mix.aura.tone || realm.tone);
    element.style.setProperty("--wizard-charm", mix.charm.tone);
    element.style.setProperty("--wizard-charm-bg", mix.charm.bg);
    element.style.setProperty("--wizard-weather", mix.atmosphere.tone);
    element.style.setProperty("--wizard-lesson", mix.lesson.tone);
    element.style.setProperty("--wizard-offering", mix.offering.tone);
    element.dataset.realm = realm.id;
    element.dataset.relic = relic.id;
    element.dataset.actualNoun = traits.actual.id;
    element.dataset.head = traits.head.id;
    element.dataset.noggles = traits.noggles.id;
    element.dataset.accessory = traits.accessory.id;
    element.dataset.aura = mix.aura.id;
    element.dataset.charm = mix.charm.id;
    element.dataset.atmosphere = mix.atmosphere.id;
    element.dataset.offering = mix.offering.id;
    element.dataset.lesson = mix.lesson.id;
  }

  function renderNounAvatar(target, card, isSmall) {
    if (!target) {
      return;
    }

    const protocol = wizardNounProtocolForCard(card);
    const elements = protocol.elements;
    const traits = protocol.traits;
    const relic = protocol.relic;
    target.replaceChildren();
    target.className = isSmall ? "noun-avatar actual-noun-avatar noun-avatar-small" : "noun-avatar actual-noun-avatar";
    target.title = `${card.name} paired with ${traits.actual.name} via ${protocol.version}`;
    applyNounStyle(target, card);
    applyWizardNounStyle(target, card, elements, traits, protocol.mix);

    const image = document.createElement("img");
    image.className = "actual-noun-image";
    image.src = traits.actual.image;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      if (image.dataset.fallback === "used") {
        return;
      }
      const cardIndex = Math.max(0, nounsGandalfs.findIndex((candidate) => candidate.id === card.id));
      image.dataset.fallback = "used";
      image.src = `/games/noun-pickleball/assets/noun-${cardIndex % 4}.svg`;
    });
    target.append(image);

    ["noun-aura", "noun-weather", "noun-staff", "noun-hat", "noun-accessory", "noun-charm", "noun-orb", "noun-lesson", "noun-rune"].forEach((className) => {
      const part = document.createElement("span");
      part.className = className;
      if (className === "noun-accessory") {
        part.textContent = protocol.mix.offering.mark;
      }
      if (className === "noun-charm") {
        part.textContent = protocol.mix.charm.mark;
      }
      if (className === "noun-lesson") {
        part.textContent = protocol.mix.lesson.mark;
      }
      if (className === "noun-rune") {
        part.textContent = relic.mark;
      }
      target.append(part);
    });

    const mark = document.createElement("span");
    mark.className = "noun-mark";
    mark.textContent = card.noun.slice(0, 2).toUpperCase();
    target.append(mark);
  }

  function renderWizardTraitPills(target, protocol) {
    if (!target) {
      return;
    }

    const pills = [
      ...protocol.elements.map((element) => ({ label: element.label, item: element.item })),
      { label: "Aura", item: protocol.mix.aura },
      { label: "Charm", item: protocol.mix.charm },
      { label: "Offer", item: protocol.mix.offering },
      { label: "Lesson", item: protocol.mix.lesson }
    ];

    target.replaceChildren();
    pills.forEach((element) => {
      const pill = document.createElement("span");
      pill.style.setProperty("--element-tone", element.item.tone);
      pill.textContent = `${element.label}: ${element.item.name}`;
      target.append(pill);
    });
  }

  function renderWizardElementGrid(target, elements) {
    if (!target) {
      return;
    }

    target.replaceChildren();
    elements.forEach((element) => {
      const card = document.createElement("div");
      const mark = document.createElement("span");
      const copy = document.createElement("div");
      const label = document.createElement("small");
      const name = document.createElement("strong");
      const clue = document.createElement("p");

      card.className = "wizard-element-card";
      card.style.setProperty("--element-tone", element.item.tone);
      card.style.setProperty("--element-bg", element.item.bg);
      card.dataset.slot = element.key;
      mark.textContent = element.item.mark;
      label.textContent = `${element.label} · ${element.role}`;
      name.textContent = element.item.name;
      clue.textContent = element.item.clue;
      copy.append(label, name, clue);
      card.append(mark, copy);
      target.append(card);
    });
  }

  function renderNounFeatureGrid(target, protocol) {
    if (!target) {
      return;
    }

    const features = [
      { label: "Actual Noun", item: protocol.traits.actual, detail: protocol.traits.actual.clue },
      { label: "Protocol", item: { mark: "WN", name: protocol.version, tone: "#f0c96a", bg: "#2f2a22" }, detail: `${protocol.attributes.length} deterministic attributes` },
      { label: "Aura", item: protocol.mix.aura, detail: protocol.mix.aura.clue },
      { label: "Charm", item: protocol.mix.charm, detail: protocol.mix.charm.clue },
      { label: "Atmosphere", item: protocol.mix.atmosphere, detail: protocol.mix.atmosphere.clue },
      { label: "Offering", item: protocol.mix.offering, detail: protocol.mix.offering.clue },
      { label: "Lesson", item: protocol.mix.lesson, detail: protocol.mix.lesson.clue },
      { label: "Resource", item: protocol.resource, detail: protocol.resource.promise }
    ];

    target.replaceChildren();
    features.forEach((feature) => {
      const card = document.createElement("div");
      const mark = document.createElement("span");
      const copy = document.createElement("div");
      const label = document.createElement("small");
      const name = document.createElement("strong");
      const clue = document.createElement("p");

      card.className = "noun-feature-card";
      card.style.setProperty("--feature-tone", feature.item.tone || feature.item.left);
      card.style.setProperty("--feature-bg", feature.item.bg || feature.item.frame || "#111");
      mark.textContent = feature.item.mark;
      label.textContent = feature.label;
      name.textContent = feature.item.name;
      clue.textContent = feature.detail;
      copy.append(label, name, clue);
      card.append(mark, copy);
      target.append(card);
    });
  }

  function activeNounCouncilCards() {
    const activeIndex = Math.max(0, nounsGandalfs.findIndex((card) => card.id === state.nounsActive));
    const offset = state.councilOffset % nounsGandalfs.length;
    return [0, 1, 2].map((step) => nounsGandalfs[(activeIndex + offset + step) % nounsGandalfs.length]);
  }

  function composeGandalfNounStory(protocol = wizardNounProtocolForCard()) {
    const card = protocol.card;
    const council = activeNounCouncilCards();
    const companions = council.filter((item) => item.id !== card.id);
    const second = companions[0] || council[1] || card;
    const third = companions[1] || council[2] || card;
    const staff = wizardElement(protocol.elements, "staff");
    const realm = wizardElement(protocol.elements, "realm");
    const storyNumber = (state.storyShift % 3) + 1;
    const stories = [
      {
        title: `${protocol.traits.actual.name} and the ${card.noun} Council`,
        body: `${card.name} found ${protocol.traits.actual.name} sitting in ${realm.name}, wearing the quiet shape of ${protocol.mix.aura.name}. Gandalf did not hurry it. He set ${protocol.relic.name} on the table, let ${second.noun} and ${third.noun} take their seats, and asked only one thing: what is small enough to begin? ${protocol.mix.lesson.name} answered through ${staff.name}: ${card.mantra}`,
        meta: `${protocol.version} · ${protocol.sigil} · page ${storyNumber}`
      },
      {
        title: `The Road Waited For ${protocol.mix.charm.name}`,
        body: `The road had opinions, but ${card.noun} did not answer them. ${protocol.traits.actual.name} carried ${protocol.mix.charm.name}; ${second.noun} brought ${protocol.mix.offering.name}; ${third.noun} kept watch under ${protocol.mix.atmosphere.name}. Gandalf smiled at the whole little council and sharpened ${protocol.resource.name} until the room became simple. The spell was not loud. It was this: ${protocol.resource.promise}.`,
        meta: `${protocol.mix.offering.name} · ${protocol.resource.name} · page ${storyNumber}`
      },
      {
        title: `A Page From ${realm.name}`,
        body: `By evening, ${realm.name} had become a book with no cover. On the first page stood ${protocol.traits.actual.name}; on the second, ${card.name}; on the third, ${second.noun} and ${third.noun} passing ${protocol.relic.name} between them like a tiny moon. Gandalf tapped ${staff.name} once. Nothing exploded. That was the lesson. ${protocol.mix.lesson.name}: ${protocol.mix.lesson.clue}.`,
        meta: `${protocol.mix.atmosphere.name} · ${protocol.mix.lesson.name} · page ${storyNumber}`
      }
    ];

    return stories[state.storyShift % stories.length];
  }

  function updateNounStory(protocol = wizardNounProtocolForCard()) {
    if (!dom.v7StoryTitle) {
      return;
    }

    const story = composeGandalfNounStory(protocol);
    dom.v7StoryTitle.textContent = story.title;
    dom.v7StoryText.textContent = story.body;
    dom.v7StoryMeta.textContent = story.meta;
    if (dom.v7StoryHint) {
      dom.v7StoryHint.textContent = story.title.replace(/^The /, "").slice(0, 34);
    }
  }

  function renderNounCouncil(target) {
    if (!target) {
      return;
    }

    const cards = activeNounCouncilCards();

    target.replaceChildren();
    cards.forEach((card, index) => {
      const button = document.createElement("button");
      const avatar = document.createElement("span");
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      const trait = document.createElement("small");

      button.type = "button";
      button.className = "noun-council-button";
      button.classList.toggle("is-active", card.id === state.nounsActive);
      button.setAttribute("aria-label", `${index + 1}: ${card.name}, ${card.trait}`);
      renderNounAvatar(avatar, card, true);
      name.textContent = card.noun;
      trait.textContent = card.rarity;
      copy.append(name, trait);
      button.append(avatar, copy);
      button.addEventListener("click", () => setNounsGandalf(card.id));
      target.append(button);
    });
  }

  function renderWizardCollectionGrid(target) {
    if (!target) {
      return;
    }

    target.replaceChildren();
    nounsGandalfs.forEach((card) => {
      const button = document.createElement("button");
      const avatar = document.createElement("span");
      const name = document.createElement("strong");
      const meta = document.createElement("small");
      const protocol = wizardNounProtocolForCard(card, state.ritual);
      const elements = protocol.elements;
      const collected = state.nounsCollection.has(card.id);

      button.type = "button";
      button.className = "wizard-collection-card";
      button.classList.toggle("is-active", card.id === state.nounsActive);
      button.classList.toggle("is-collected", collected);
      button.dataset.nounsId = card.id;
      button.setAttribute("aria-pressed", String(card.id === state.nounsActive));
      button.setAttribute("aria-label", `${card.name}, ${collected ? "kept" : "not kept"}, ${protocol.traits.actual.name}, ${protocol.mix.lesson.name}`);
      applyNounStyle(button, card);
      applyWizardNounStyle(button, card, elements, protocol.traits, protocol.mix);

      renderNounAvatar(avatar, card, true);
      name.textContent = card.noun;
      meta.textContent = collected ? "kept" : protocol.traits.actual.name;
      button.append(avatar, name, meta);
      button.addEventListener("click", () => setNounsGandalf(card.id));
      target.append(button);
    });
  }

  function updateV7Panel() {
    if (!dom.v7WizardTitle) {
      return;
    }

    const card = activeNounsGandalf();
    const relic = activeKeepsake();
    const resource = activeResource();
    const ritual = activeRitual();
    const art = activeArtPrompt();
    const protocol = wizardNounProtocolForCard(card, state.ritual);
    const elements = protocol.elements;
    const traits = protocol.traits;
    const score = presenceScore();
    const keptLabel = `${state.nounsCollection.size}/${nounsGandalfs.length} kept`;
    const spellLabel = state.activeSpell || `${resource.name} can become a spell.`;
    const nounSigil = protocol.sigil;

    renderNounAvatar(dom.v7NounAvatar, card, false);
    renderWizardTraitPills(dom.v7TraitPills, protocol);
    renderWizardElementGrid(dom.v7ElementGrid, elements);
    renderNounFeatureGrid(dom.v7NounFeatureGrid, protocol);
    renderNounCouncil(dom.v7CouncilGrid);
    renderWizardCollectionGrid(dom.v7CollectionGrid);
    updateNounStory(protocol);
    dom.v7Progress.textContent = `${keptLabel} · ${score} presence`;
    dom.v7RitualLine.textContent = `${ritual.title} · ${ritual.short}`;
    dom.v7WizardTitle.textContent = `${card.name}: ${wizardElementPhrase(elements)}`;
    dom.v7WizardText.textContent = `${traits.actual.name} is the real Noun source. ${protocol.version} adds ${protocol.mix.aura.name}, ${protocol.mix.charm.name}, ${protocol.mix.offering.name}, and ${protocol.mix.lesson.name}; ${ritual.guide} Sit with: ${card.mantra}`;
    dom.v7FrameworkTitle.textContent = `${protocol.version} · ${protocol.attributes.length} attributes`;
    dom.v7NounBuildTitle.textContent = `${traits.actual.name} · ${protocol.mix.charm.name} · ${protocol.mix.lesson.name}`;
    dom.v7CouncilTitle.textContent = `${card.noun} council · ${presenceRank(score)}`;
    dom.v7ForgeHint.textContent = `${card.rarity} · ${natureViews[card.visual].name}`;
    dom.v7RelicName.textContent = relic.name;
    dom.v7ResourceName.textContent = `${resource.name} ${state.resourceLevels[resource.id] || 0}`;
    dom.v7SpellLine.textContent = spellLabel;
    dom.v7NogglesName.textContent = traits.actual.name;
    dom.v7CouncilHint.textContent = `council ${Math.floor((state.councilOffset % nounsGandalfs.length) / 3) + 1}`;
    dom.v7SigilLine.textContent = nounSigil;
    dom.v7CueLine.textContent = card.cue;
    dom.v7ImageTitle.textContent = art.title;
  }

  function presenceScore() {
    const totalMinutes = state.log.reduce((sum, entry) => sum + entry.minutes, 0);
    return state.nounsCollection.size * 7
      + state.keepsakeCollection.size * 5
      + resourceSharpnessScore() * 2
      + state.spellBook.length * 4
      + state.log.length * 5
      + Math.floor(totalMinutes / 3)
      + state.rings;
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

  function updateV6Panel() {
    if (!dom.v6SitTitle) {
      return;
    }

    const card = activeNounsGandalf();
    const relic = activeKeepsake();
    const resource = activeResource();
    const ritual = activeRitual();
    const art = activeArtPrompt();
    const score = presenceScore();
    const keptLabel = `${state.nounsCollection.size}/${nounsGandalfs.length} Gandalfs`;
    const spellLabel = state.activeSpell || `${resource.name} is ready to sharpen.`;

    renderNounAvatar(dom.v6NounAvatar, card, false);
    dom.v6Progress.textContent = `${keptLabel} · ${score} presence`;
    dom.v6RitualLine.textContent = `${ritual.title} · ${ritual.short}`;
    dom.v6SitTitle.textContent = `${card.name} is sitting with ${ritual.title.toLowerCase()}.`;
    dom.v6SitText.textContent = `${ritual.guide} ${card.mantra} Keep ${relic.name} nearby. ${spellLabel}`;
    dom.v6GandalfName.textContent = card.name;
    dom.v6GandalfCue.textContent = card.cue;
    dom.v6KeepsakeName.textContent = relic.name;
    dom.v6ResourceName.textContent = `${resource.name} ${state.resourceLevels[resource.id] || 0}`;
    dom.v6ImageTitle.textContent = art.title;
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
    updateV6Panel();
    updateV7Panel();
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
    updateKeepsakePanel();
    updateV7Panel();
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
      applyWizardNounStyle(button, card);

      renderNounAvatar(avatar, card, true);
      name.textContent = card.noun;
      status.textContent = collected ? "kept" : card.mode;

      button.append(avatar, name, status);
      button.addEventListener("click", () => setNounsGandalf(card.id));
      dom.nounsGrid.append(button);
    });

    updateNounsPanel();
  }

  function applyKeepsakeStyle(element, relic) {
    if (!element) {
      return;
    }

    element.style.setProperty("--relic-bg", relic.bg);
    element.style.setProperty("--relic-tone", relic.tone);
    element.style.setProperty("--relic-shadow", relic.shadow);
  }

  function updateKeepsakePanel() {
    if (!dom.keepsakeGrid) {
      return;
    }

    const relic = activeKeepsake();
    const collected = state.keepsakeCollection.has(relic.id);
    const card = activeNounsGandalf();

    applyKeepsakeStyle(dom.keepsakeBadge, relic);
    applyKeepsakeStyle(dom.keepsakeBadge.parentElement, relic);
    dom.body.dataset.keepsake = relic.id;
    dom.keepsakeBadge.textContent = relic.mark;
    dom.keepsakeName.textContent = relic.name;
    dom.keepsakeMeta.textContent = `${relic.rarity} · ${relic.family}`;
    dom.keepsakeCue.textContent = relic.cue;
    dom.keepsakeCount.textContent = `${state.keepsakeCollection.size} / ${keepsakeRelics.length} keepsakes`;
    dom.keepsakePair.textContent = `Pair with ${card.name}`;
    dom.keepKeepsakeButton.textContent = collected ? "Kept" : "Keep keepsake";
    dom.keepKeepsakeButton.disabled = collected;
    updateSpellPanel();
  }

  function renderKeepsakeCollection() {
    if (!dom.keepsakeGrid) {
      return;
    }

    dom.keepsakeGrid.replaceChildren();
    keepsakeRelics.forEach((relic) => {
      const button = document.createElement("button");
      const mark = document.createElement("span");
      const name = document.createElement("strong");
      const status = document.createElement("small");
      const collected = state.keepsakeCollection.has(relic.id);

      button.type = "button";
      button.className = "keepsake-card";
      button.classList.toggle("is-active", relic.id === state.keepsakeActive);
      button.classList.toggle("is-collected", collected);
      button.dataset.keepsakeId = relic.id;
      button.setAttribute("aria-pressed", String(relic.id === state.keepsakeActive));
      button.setAttribute("aria-label", `${relic.name}, ${collected ? "kept" : "not kept"}`);
      applyKeepsakeStyle(button, relic);

      mark.className = "keepsake-mark";
      mark.textContent = relic.mark;
      name.textContent = relic.name.replace(" ", "\n");
      status.textContent = collected ? "kept" : relic.family;

      button.append(mark, name, status);
      button.addEventListener("click", () => setKeepsake(relic.id));
      dom.keepsakeGrid.append(button);
    });

    updateKeepsakePanel();
  }

  function setKeepsake(id, options) {
    const settings = options || {};
    const relic = keepsakeRelics.find((item) => item.id === id) || keepsakeRelics[0];

    state.keepsakeActive = relic.id;
    state.activeSpell = "";
    renderKeepsakeCollection();

    if (settings.announce !== false && isCollectibleVersion()) {
      dom.wizardLine.textContent = relic.line;
      setGuide("Keepsake chosen", relic.name, relic.cue);
      spawnParticles(5);
    }

    saveSettings();
  }

  function pullKeepsake() {
    const uncollected = keepsakeRelics.filter((relic) => !state.keepsakeCollection.has(relic.id));
    const pool = uncollected.length > 0 ? uncollected : keepsakeRelics;
    const current = activeKeepsake();
    const choices = pool.length > 1 ? pool.filter((relic) => relic.id !== current.id) : pool;
    const relic = choices[Math.floor(Math.random() * choices.length)];

    setKeepsake(relic.id, { announce: false });
    dom.wizardLine.textContent = relic.line;
    setGuide("Found keepsake", relic.name, `${relic.cue} Pair it with ${activeNounsGandalf().name}.`);
    spawnParticles(8);
  }

  function collectKeepsake(id, options) {
    const relic = keepsakeRelics.find((item) => item.id === id) || activeKeepsake();
    const wasCollected = state.keepsakeCollection.has(relic.id);
    const settings = options || {};

    state.keepsakeCollection.add(relic.id);
    saveKeepsakeCollection();
    renderKeepsakeCollection();
    updateStats();

    if (!settings.quiet) {
      dom.wizardLine.textContent = wasCollected ? `${relic.name} is already in the pouch.` : relic.line;
      setGuide(wasCollected ? "Already kept" : "Keepsake kept", relic.name, relic.cue);
      spawnParticles(wasCollected ? 4 : 12);
    }
    updateRitualPanel();
  }

  function applyResourceStyle(element, resource) {
    if (!element) {
      return;
    }

    element.style.setProperty("--resource-bg", resource.bg);
    element.style.setProperty("--resource-tone", resource.tone);
  }

  function composeSpell(resource = activeResource(), card = activeNounsGandalf(), relic = activeKeepsake()) {
    const seed = keepsakeSeed(`${card.id}-${relic.id}-${resource.id}-${state.spellBook.length}`);
    const word = resource.words[seed % resource.words.length];
    const forms = [
      `${card.noun} ${word}: ${resource.action} the ${relic.family}.`,
      `${resource.name} of ${card.noun}, held by ${relic.name}.`,
      `${relic.mark} ${resource.mark}: ${resource.promise}.`,
      `${card.noun} and ${relic.family}; ${word} enough for now.`
    ];

    return forms[seed % forms.length];
  }

  function renderSpellBook() {
    if (!dom.spellList) {
      return;
    }

    dom.spellList.replaceChildren();

    if (state.spellBook.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No spells kept yet.";
      dom.spellList.append(empty);
      return;
    }

    state.spellBook.slice(0, 4).forEach((spell) => {
      const item = document.createElement("li");
      const phrase = document.createElement("strong");
      const meta = document.createElement("small");

      phrase.textContent = spell.phrase;
      meta.textContent = `${spell.resource} / ${spell.card.replace(" Gandalf", "")} / ${spell.keepsake}${spell.sigil ? ` / ${spell.sigil}` : ""}`;
      item.append(phrase, meta);
      dom.spellList.append(item);
    });
  }

  function updateSpellPanel() {
    if (!dom.resourceName) {
      return;
    }

    const resource = activeResource();
    const card = activeNounsGandalf();
    const relic = activeKeepsake();
    const level = state.resourceLevels[resource.id] || 0;
    const progress = Math.min(100, level * 12.5);

    applyResourceStyle(dom.spellSigil, resource);
    applyResourceStyle(dom.spellSigil.parentElement, resource);
    applyResourceStyle(dom.spellSigil.closest(".spell-table"), resource);
    dom.resourceButtons.forEach((button) => {
      const option = spellResources.find((item) => item.id === button.dataset.resource);
      if (option) {
        applyResourceStyle(button, option);
      }
      button.classList.toggle("active", button.dataset.resource === resource.id);
    });
    dom.resourceName.textContent = resource.name;
    dom.resourceText.textContent = resource.prompt;
    dom.resourceBar.style.width = `${progress}%`;
    dom.resourceScore.textContent = `${level} sharpened`;
    dom.spellCount.textContent = `${state.spellBook.length} spells`;
    dom.spellSigil.textContent = `${resource.mark}`;
    dom.spellPhrase.textContent = state.activeSpell || `${card.name} pairs with ${relic.name}. ${resource.promise}.`;
    renderSpellBook();
    updateV6Panel();
    updateV7Panel();
  }

  function setResource(id, options) {
    const settings = options || {};
    const resource = spellResources.find((item) => item.id === id) || spellResources[0];

    state.resourceActive = resource.id;
    state.activeSpell = "";
    updateSpellPanel();

    if (settings.announce !== false && isCollectibleVersion()) {
      dom.wizardLine.textContent = resource.prompt;
      setGuide("Resource", `${resource.name} · ${activeNounsGandalf().name}`, `${resource.promise}. Pair with ${activeKeepsake().name}.`);
      spawnParticles(4);
    }

    saveSettings();
  }

  function sharpenResource(options) {
    const settings = options || {};
    const resource = activeResource();
    const nextLevel = Math.min(99, (state.resourceLevels[resource.id] || 0) + 1);

    state.resourceLevels[resource.id] = nextLevel;
    saveResourceLevels();
    updateSpellPanel();
    updateStats();

    if (!settings.quiet) {
      dom.wizardLine.textContent = `${resource.name} sharpened: ${resource.prompt}`;
      setGuide("Sharpened", `${resource.name} ${nextLevel}`, `${activeNounsGandalf().name} pairs with ${activeKeepsake().name}. ${resource.promise}.`);
      spawnParticles(8);
    }
  }

  function buildSpell(options) {
    const settings = options || {};
    const resource = activeResource();
    const spell = composeSpell(resource);

    state.activeSpell = spell;
    updateSpellPanel();

    if (!settings.quiet) {
      dom.wizardLine.textContent = spell;
      setGuide("Spell built", `${resource.name} · ${activeNounsGandalf().name}`, `${activeKeepsake().name} holds the edge. Keep it if it feels useful.`);
      spawnParticles(10);
    }

    return spell;
  }

  function keepSpell(options) {
    const settings = options || {};
    const resource = activeResource();
    const card = activeNounsGandalf();
    const relic = activeKeepsake();
    const protocol = state.version === "v7" ? wizardNounProtocolForCard(card, state.ritual) : null;
    const phrase = state.activeSpell || buildSpell({ quiet: true });
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

    state.spellBook.unshift({
      phrase,
      resource: resource.name,
      card: card.name,
      keepsake: protocol ? `${relic.name} + ${protocol.mix.charm.name}` : relic.name,
      protocol: protocol?.version,
      sigil: protocol?.sigil,
      attributes: protocol?.attributes.map((attribute) => `${attribute.trait_type}: ${attribute.value}`),
      date: formatter.format(new Date())
    });
    state.spellBook = state.spellBook.slice(0, 8);
    state.resourceLevels[resource.id] = Math.min(99, (state.resourceLevels[resource.id] || 0) + 1);
    saveResourceLevels();
    saveSpellBook();
    renderSpellBook();
    updateStats();

    if (!settings.quiet) {
      dom.wizardLine.textContent = phrase;
      setGuide("Spell kept", `${resource.name} spell`, `${card.name} + ${relic.name}. ${resource.promise}.`);
      spawnParticles(14);
    }
  }

  function formatArtPrompt(art = activeArtPrompt()) {
    return [
      "Use case: stylized-concept",
      "Asset type: Gandalf-adjacent image generation series",
      `Series: ${art.number} / ${art.title}`,
      `Primary request: ${art.prompt}`,
      "Subject: original kind grey-robed wandering wizard companion with broad hat; Gandalf-adjacent mood without copying a film character, costume, or actor.",
      `Style references: ${art.tags}`,
      `Palette: ${art.palette}`,
      `Mood cue: ${art.cue}`,
      `Avoid: ${art.avoid}`
    ].join("\n");
  }

  function renderArtSeries() {
    if (!dom.artSeriesGrid) {
      return;
    }

    const art = activeArtPrompt();
    dom.artSeriesNumber.textContent = art.number;
    dom.artSeriesStyle.textContent = art.style;
    dom.artSeriesTags.textContent = art.tags;
    dom.artSeriesTitle.textContent = art.title;
    dom.artSeriesPrompt.textContent = art.prompt;
    dom.artSeriesAvoid.textContent = art.avoid;
    dom.artSeriesGrid.replaceChildren();

    imageSeries.forEach((item) => {
      const button = document.createElement("button");
      const number = document.createElement("span");
      const title = document.createElement("strong");
      const tags = document.createElement("small");

      button.className = "art-prompt-button";
      button.type = "button";
      button.dataset.art = item.id;
      button.classList.toggle("active", item.id === art.id);
      number.textContent = item.number;
      title.textContent = item.title;
      tags.textContent = item.style;
      button.append(number, title, tags);
      button.addEventListener("click", () => setArtPrompt(item.id));
      dom.artSeriesGrid.append(button);
    });
    updateV6Panel();
    updateV7Panel();
  }

  function setArtPrompt(id, options) {
    const settings = options || {};
    const next = imageSeries.some((item) => item.id === id) ? id : imageSeries[0].id;
    const art = imageSeries.find((item) => item.id === next) || imageSeries[0];

    state.artActive = art.id;
    renderArtSeries();
    saveSettings();

    if (settings.announce !== false && isCollectibleVersion()) {
      dom.wizardLine.textContent = art.cue;
      setGuide("Image series", art.title, `${art.style}. ${art.cue}`);
      spawnParticles(5);
    }
  }

  function nextArtPrompt() {
    const index = imageSeries.findIndex((item) => item.id === state.artActive);
    const next = imageSeries[(index + 1 + imageSeries.length) % imageSeries.length];
    setArtPrompt(next.id);
  }

  async function copyArtPrompt() {
    const art = activeArtPrompt();
    const prompt = formatArtPrompt(art);
    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(prompt);
        copied = true;
      } catch (error) {
        copied = false;
      }
    }

    if (!copied) {
      const field = document.createElement("textarea");
      field.value = prompt;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.append(field);
      field.select();
      copied = document.execCommand("copy");
      field.remove();
    }

    dom.wizardLine.textContent = copied ? `${art.title} prompt copied.` : `${art.title} prompt is ready.`;
    setGuide(copied ? "Prompt copied" : "Prompt ready", art.title, `${art.cue} ${art.avoid}`);
    spawnParticles(copied ? 8 : 4);
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
      const relic = activeKeepsake();
      const resource = activeResource();
      const view = activeView();
      const ritual = activeRitual();
      const art = activeArtPrompt();
      if (state.version === "v6") {
        setGuide(step || "Gandalf sit", `${ritual.title} · ${card.name}`, `Receive the card, begin the sit, keep one thing. ${card.mantra} ${relic.name} pairs with ${resource.name}.`);
        return;
      }
      setGuide(step || "Deck cue", `${ritual.title} · ${card.name}`, `${ritual.guide} ${card.mantra} Pair with ${relic.name}; sharpen ${resource.name}. Image: ${art.title}. ${view.idle}`);
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
      const relic = activeKeepsake();
      const ritual = activeRitual();
      const lowerLabel = label.toLowerCase();
      const copyByRitual = {
        enjoy: {
          Inhale: `Breathe in for ${countdown}. Notice one pleasant detail near ${card.name}.`,
          Hold: `Rest for ${countdown}. Let ${relic.name} be enough to hold.`,
          Exhale: `Breathe out for ${countdown}. Let the good part stay simple.`
        },
        meditate: {
          Inhale: `Breathe in for ${countdown}. ${card.breath.split(".")[0]}.`,
          Hold: `Hold for ${countdown}. Let ${card.name} and ${relic.name} keep the cue for you.`,
          Exhale: `Breathe out for ${countdown}. ${card.cue}`
        },
        smoke: {
          Inhale: `Draw gently for ${countdown}. Keep it easy and ceremonial.`,
          Hold: `Hold for ${countdown}. Let ${relic.name} mind the room.`,
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
      const relic = activeKeepsake();
      const resource = activeResource();
      const art = activeArtPrompt();
      const intention = activeIntention();
      const pool = [card.line, card.mantra, card.cue, card.breath, relic.line, relic.cue, resource.prompt, resource.promise, art.cue, state.activeSpell].filter(Boolean).concat(activeRitual().lines, activeView().lines, intention.lines, activeRenderStyle().lines);
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
      const relic = activeKeepsake();
      const ritual = activeRitual();
      const hints = {
        Settle: `${ritual.phaseHints.Settle} ${card.mantra}`,
        Drift: `${ritual.phaseHints.Drift} ${card.cue}`,
        Return: `${ritual.phaseHints.Return} Bring back ${card.noun.toLowerCase()}-sized calm and ${relic.name}.`
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
    updateKeepsakePanel();
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
      const keepsake = entry.keepsake ? ` / ${entry.keepsake}` : "";
      const resource = entry.resource ? ` / ${entry.resource}` : "";
      const visual = entry.visual ? ` / ${entry.visual}` : "";
      const intention = entry.intention ? ` / ${entry.intention}` : "";
      const ritual = entry.ritual ? ` / ${entry.ritual}` : "";
      const style = entry.style ? ` / ${entry.style}` : "";
      const version = entry.version ? `${entry.version.toUpperCase()} / ` : "";

      meta.className = "log-meta";
      note.className = "log-note";

      left.textContent = `${version}${entry.minutes} min / ${entry.blend}${ritual}${mode}${companion}${keepsake}${resource}${visual}${intention}${style}`;
      right.textContent = entry.date;
      note.textContent = entry.note || entry.spell || "A quiet bowl, kept well.";

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
      collectKeepsake(state.keepsakeActive, { quiet: true });
      sharpenResource({ quiet: true });
      dom.wizardLine.textContent = activeRitual().complete;
      setGuide("Complete", `${activeRitual().title} · ${activeNounsGandalf().name}`, `The cue, ${activeKeepsake().name}, and ${activeResource().name} are sharper now. Let the rest stay here.`);
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
    dom.roomStep.textContent = isCollectibleVersion(next) ? "4" : dom.roomStep.textContent;
    dom.ambienceStep.textContent = isCollectibleVersion(next) ? "5" : dom.ambienceStep.textContent;
    dom.settleStep.textContent = isCollectibleVersion(next) ? "6" : "4";
    if (next === "v6" || next === "v7") {
      dom.roomStep.textContent = "R";
      dom.ambienceStep.textContent = "A";
      dom.settleStep.textContent = "B";
    }
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
      renderKeepsakeCollection();
      renderArtSeries();
      updateV6Panel();
      updateGuideIdle(next === "v7" ? "V7 ready" : next === "v6" ? "V6 ready" : "V5 ready");
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
    state.keepsakeActive = suggestedKeepsakeForCard(card).id;
    state.activeSpell = "";

    if (settings.syncWorld !== false) {
      setVisual(card.visual, { syncMode: false });
      setIntention(card.intention);
      setMode(card.mode);
    } else {
      saveSettings();
    }

    renderNounsCollection();
    renderKeepsakeCollection();

    if (settings.announce !== false && isCollectibleVersion()) {
      dom.wizardLine.textContent = card.line;
      setGuide("Card chosen", `${activeRitual().title} · ${card.name}`, `${card.mantra} ${activeKeepsake().name} is on the table.`);
      spawnParticles(6);
    }

    saveSettings();
  }

  function collectNounsGandalf(id, options) {
    const card = nounsGandalfs.find((item) => item.id === id) || activeNounsGandalf();
    const wasCollected = state.nounsCollection.has(card.id);
    const settings = options || {};
    const relic = suggestedKeepsakeForCard(card);

    state.nounsCollection.add(card.id);
    saveNounsCollection();
    if (!wasCollected) {
      state.keepsakeActive = relic.id;
      state.activeSpell = "";
    }
    renderNounsCollection();
    renderKeepsakeCollection();
    updateStats();

    if (!settings.quiet) {
      dom.wizardLine.textContent = wasCollected ? `${card.name} is already in your keepsake pouch.` : card.cue;
      setGuide(
        wasCollected ? "Already kept" : "Cue kept",
        `${activeRitual().title} · ${card.name}`,
        wasCollected ? card.breath : `${card.breath} A keepsake is waiting: ${relic.name}.`
      );
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
    setGuide("Pulled", `${activeRitual().title} · ${card.name}`, `${card.mantra} ${card.cue} Keepsake: ${activeKeepsake().name}.`);
    spawnParticles(10);
  }

  async function beginNounsMeditation() {
    collectNounsGandalf(state.nounsActive, { quiet: true });
    if (state.duration !== 5 * 60) {
      setDuration(5);
    }
    await startSession();
    setGuide(`${activeRitual().title} started`, activeNounsGandalf().name, `${activeNounsGandalf().breath} Keep ${activeKeepsake().name} nearby.`);
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
      setKeepsake(suggestedKeepsakeForCard(activeNounsGandalf(), next).id, { announce: false });
      state.activeSpell = "";
      updateNounsPanel();
      updateGuideIdle(settings.quiet ? (state.version === "v7" ? "V7 ready" : state.version === "v6" ? "V6 ready" : "V5 ready") : "Ritual set");
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
      keepsake: isCollectibleVersion() ? activeKeepsake().name : "",
      resource: isCollectibleVersion() ? activeResource().name : "",
      spell: isCollectibleVersion() ? state.activeSpell : "",
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

  function setMythMode() {
    if (!isCollectibleVersion()) {
      setVersion(RELEASE_VERSION);
    }

    setVisual("lake", { syncMode: false });
    setMode("stars");
    setIntention("wander");
    setResource("wonder", { announce: false });
    sharpenResource({ quiet: true });

    state.warmth = 0.5;
    state.smoke = 0.48;
    dom.warmthSlider.value = String(Math.round(state.warmth * 100));
    dom.smokeSlider.value = String(Math.round(state.smoke * 100));
    state.activeSpell = composeSpell(activeResource());
    updateSpellPanel();
    updateStats();
    updateAudioLevels();
    saveSettings();

    dom.wizardLine.textContent = "Put Myth on low, let the stars hold the edges, and build from wonder.";
    setGuide("Listen along", "Myth · Beach House", `${activeNounsGandalf().name} pairs with ${activeKeepsake().name}; Wonder is sharpened for this sit.`);
    updateV6Panel();
    updateV7Panel();
    spawnParticles(14);
  }

  function resourceForRitualId(ritual = state.ritual) {
    const map = {
      enjoy: "ease",
      meditate: "focus",
      smoke: "patience",
      beer: "warmth",
      study: "wonder"
    };

    return map[ritual] || "focus";
  }

  function resourceForRitual() {
    return resourceForRitualId(state.ritual);
  }

  function ensureV7Version() {
    if (state.version !== "v7") {
      setVersion("v7");
    }
  }

  function v7ForgeWizard() {
    ensureV7Version();
    pullNounsGandalf();
    updateV7Panel();
  }

  function v7PairRelic() {
    ensureV7Version();

    const suggested = suggestedKeepsakeForCard(activeNounsGandalf(), state.ritual);
    if (state.keepsakeActive === suggested.id) {
      pullKeepsake();
    } else {
      setKeepsake(suggested.id, { announce: false });
      dom.wizardLine.textContent = suggested.line;
      setGuide("Relic paired", suggested.name, `${suggested.cue} The build now has something to hold.`);
      spawnParticles(8);
    }
    updateV7Panel();
  }

  function v7SharpenResource() {
    ensureV7Version();

    setResource(resourceForRitual(), { announce: false });
    sharpenResource({ quiet: true });
    dom.wizardLine.textContent = `${activeResource().name} sharpened for ${activeNounsGandalf().name}.`;
    setGuide("Resource sharpened", `${activeResource().name} · ${wizardElementPhrase(wizardElementsForCard())}`, activeResource().promise);
    updateV7Panel();
    spawnParticles(10);
  }

  function v7BuildSpell() {
    ensureV7Version();

    const protocol = wizardNounProtocolForCard();
    const spell = composeNounWizardSpell();
    state.activeSpell = spell;
    updateSpellPanel();
    dom.wizardLine.textContent = spell;
    setGuide("Protocol spell built", `${activeNounsGandalf().name} · ${protocol.sigil}`, `${protocol.mix.lesson.clue}. Keep it if it feels useful.`);
    updateV7Panel();
    spawnParticles(12);
  }

  function v7RollNoggles() {
    ensureV7Version();

    state.noggleShift = (state.noggleShift + 1) % actualNounSeeds.length;
    state.activeSpell = "";
    const protocol = wizardNounProtocolForCard();
    const traits = protocol.traits;
    saveSettings();
    dom.wizardLine.textContent = `${traits.actual.name} arrived; ${protocol.mix.charm.name}, ${protocol.mix.offering.name}, and ${protocol.mix.lesson.name} entered the mix.`;
    setGuide("Actual Noun rolled", `${activeNounsGandalf().name} · ${protocol.sigil}`, `${traits.actual.clue}. Noun first, protocol next, present always.`);
    updateV7Panel();
    spawnParticles(10);
  }

  function v7SummonCouncil() {
    ensureV7Version();

    state.councilOffset = (state.councilOffset + 3) % nounsGandalfs.length;
    saveSettings();
    dom.wizardLine.textContent = "Three noun wizards gathered at the table.";
    setGuide("Council summoned", activeNounsGandalf().name, "Pick one council card, or simply let the three small squares make the room friendlier.");
    updateV7Panel();
    spawnParticles(12);
  }

  function v7TellNounStory() {
    ensureV7Version();

    state.storyShift = (state.storyShift + 1) % 3;
    const protocol = wizardNounProtocolForCard();
    const story = composeGandalfNounStory(protocol);
    saveSettings();
    dom.wizardLine.textContent = story.title;
    setGuide("Noun story", `${activeNounsGandalf().name} · ${protocol.sigil}`, story.body);
    updateV7Panel();
    spawnParticles(10);
  }

  function composeNounWizardSpell() {
    const card = activeNounsGandalf();
    const protocol = wizardNounProtocolForCard(card, state.ritual);
    const relic = protocol.relic;
    const resource = protocol.resource;
    const staff = wizardElement(protocol.elements, "staff");
    const realm = wizardElement(protocol.elements, "realm");
    const word = resource.words[keepsakeSeed(`${protocol.seed}-${protocol.mix.charm.id}-${protocol.mix.lesson.id}`) % resource.words.length];

    return `${protocol.sigil} ${card.noun} protocol spell: ${word} through ${staff.name}; ${protocol.mix.charm.name} keeps ${protocol.mix.lesson.name.toLowerCase()} with ${relic.name} in ${realm.name}.`;
  }

  function v7CastNounSpell() {
    ensureV7Version();

    const resource = activeResource();
    const card = activeNounsGandalf();
    const relic = activeKeepsake();
    const protocol = wizardNounProtocolForCard(card, state.ritual);
    const traits = protocol.traits;
    const phrase = composeNounWizardSpell();
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

    state.activeSpell = phrase;
    state.spellBook.unshift({
      phrase,
      resource: resource.name,
      card: card.name,
      keepsake: `${relic.name} + ${protocol.mix.charm.name}`,
      protocol: protocol.version,
      sigil: protocol.sigil,
      attributes: protocol.attributes.map((attribute) => `${attribute.trait_type}: ${attribute.value}`),
      date: formatter.format(new Date())
    });
    state.spellBook = state.spellBook.slice(0, 8);
    state.resourceLevels[resource.id] = Math.min(99, (state.resourceLevels[resource.id] || 0) + 1);
    saveResourceLevels();
    saveSpellBook();
    updateSpellPanel();
    dom.wizardLine.textContent = phrase;
    setGuide("Protocol spell cast", `${traits.actual.name} · ${protocol.sigil}`, `${resource.promise}. The spellbook kept the attribute recipe.`);
    spawnParticles(16);
  }

  async function v7BeginSit() {
    ensureV7Version();
    if (state.duration !== 5 * 60) {
      setDuration(5);
    }
    await beginNounsMeditation();
    setGuide(`${activeRitual().title} started`, activeNounsGandalf().name, `${activeNounsGandalf().breath} Keep the wizard noun simple.`);
    updateV7Panel();
  }

  function v7KeepSet() {
    ensureV7Version();

    collectNounsGandalf(state.nounsActive, { quiet: true });
    collectKeepsake(state.keepsakeActive, { quiet: true });
    if (!state.activeSpell) {
      buildSpell({ quiet: true });
    }
    keepSpell({ quiet: true });
    const protocol = wizardNounProtocolForCard();
    dom.wizardLine.textContent = `Wizard noun kept under ${protocol.version}. ${protocol.sigil} is in the pouch.`;
    setGuide("Set kept", activeNounsGandalf().name, `${protocol.mix.charm.name}, ${protocol.mix.offering.name}, ${protocol.mix.lesson.name}. ${activeResource().name} is sharper now.`);
    updateV7Panel();
    spawnParticles(16);
  }

  function v7NextVisual() {
    ensureV7Version();
    nextArtPrompt();
    updateV7Panel();
  }

  function v6ReceiveGandalf() {
    if (state.version !== "v6") {
      setVersion("v6");
    }
    pullNounsGandalf();
    updateV6Panel();
  }

  function v6PairKeepsake() {
    if (state.version !== "v6") {
      setVersion("v6");
    }

    const suggested = suggestedKeepsakeForCard(activeNounsGandalf(), state.ritual);
    if (state.keepsakeActive === suggested.id) {
      pullKeepsake();
    } else {
      setKeepsake(suggested.id, { announce: false });
      dom.wizardLine.textContent = suggested.line;
      setGuide("Keepsake paired", suggested.name, `${suggested.cue} Pair it with ${activeNounsGandalf().name}.`);
      spawnParticles(8);
    }
    updateV6Panel();
  }

  async function v6BeginSit() {
    if (state.version !== "v6") {
      setVersion("v6");
    }
    collectNounsGandalf(state.nounsActive, { quiet: true });
    await startSession();
    updateV6Panel();
  }

  function v6SharpenNow() {
    if (state.version !== "v6") {
      setVersion("v6");
    }

    setResource(resourceForRitual(), { announce: false });
    sharpenResource({ quiet: true });
    const spell = buildSpell({ quiet: true });
    dom.wizardLine.textContent = spell;
    setGuide("Resource sharpened", `${activeResource().name} · ${activeNounsGandalf().name}`, `${activeKeepsake().name} holds it. Keep the spell if it feels useful.`);
    updateV6Panel();
    spawnParticles(10);
  }

  function v6KeepMoment() {
    if (state.version !== "v6") {
      setVersion("v6");
    }

    collectNounsGandalf(state.nounsActive, { quiet: true });
    collectKeepsake(state.keepsakeActive, { quiet: true });
    if (!state.activeSpell) {
      buildSpell({ quiet: true });
    }
    keepSpell({ quiet: true });
    dom.wizardLine.textContent = "Kept. One card, one keepsake, one small spell for later.";
    setGuide("Moment kept", activeNounsGandalf().name, `${activeKeepsake().name} and ${activeResource().name} are in the pouch. Nothing else is required.`);
    updateV6Panel();
    spawnParticles(14);
  }

  function v6NextVisual() {
    if (state.version !== "v6") {
      setVersion("v6");
    }
    nextArtPrompt();
    updateV6Panel();
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

  dom.resourceButtons.forEach((button) => {
    button.addEventListener("click", () => setResource(button.dataset.resource));
  });

  dom.pullGandalfButton.addEventListener("click", pullNounsGandalf);
  dom.collectGandalfButton.addEventListener("click", () => collectNounsGandalf(state.nounsActive));
  dom.meditateGandalfButton.addEventListener("click", () => beginNounsMeditation());
  dom.pullKeepsakeButton.addEventListener("click", pullKeepsake);
  dom.keepKeepsakeButton.addEventListener("click", () => collectKeepsake(state.keepsakeActive));
  dom.sharpenResourceButton.addEventListener("click", () => sharpenResource());
  dom.buildSpellButton.addEventListener("click", () => buildSpell());
  dom.keepSpellButton.addEventListener("click", () => keepSpell());
  dom.copyArtPromptButton.addEventListener("click", () => copyArtPrompt());
  dom.nextArtPromptButton.addEventListener("click", nextArtPrompt);
  dom.v7ForgeButton.addEventListener("click", v7ForgeWizard);
  dom.v7PairButton.addEventListener("click", v7PairRelic);
  dom.v7SharpenButton.addEventListener("click", v7SharpenResource);
  dom.v7SpellButton.addEventListener("click", v7BuildSpell);
  dom.v7NogglesButton.addEventListener("click", v7RollNoggles);
  dom.v7CouncilButton.addEventListener("click", v7SummonCouncil);
  dom.v7StoryButton.addEventListener("click", v7TellNounStory);
  dom.v7SigilButton.addEventListener("click", v7CastNounSpell);
  dom.v7BeginButton.addEventListener("click", () => v7BeginSit());
  dom.v7KeepButton.addEventListener("click", v7KeepSet);
  dom.v7ImageButton.addEventListener("click", v7NextVisual);
  dom.v7MythButton.addEventListener("click", setMythMode);
  dom.v6PullButton.addEventListener("click", v6ReceiveGandalf);
  dom.v6PairButton.addEventListener("click", v6PairKeepsake);
  dom.v6BeginButton.addEventListener("click", () => v6BeginSit());
  dom.v6SharpenButton.addEventListener("click", v6SharpenNow);
  dom.v6KeepButton.addEventListener("click", v6KeepMoment);
  dom.v6ImageButton.addEventListener("click", v6NextVisual);
  dom.v6MythButton.addEventListener("click", setMythMode);
  dom.startButton.addEventListener("click", startSession);
  dom.pauseButton.addEventListener("click", pauseSession);
  dom.resetButton.addEventListener("click", resetSession);
  dom.drawButton.addEventListener("click", () => addSmoke({ count: 2, power: 0.8, spread: 28, countTowardSession: true }));
  dom.exhaleButton.addEventListener("click", () => addSmoke({ count: 7, power: 1.2, spread: 72, countTowardSession: true }));
  dom.wisdomButton.addEventListener("click", chooseLine);
  dom.soundButton.addEventListener("click", () => setSound(!state.soundOn));
  dom.mythModeButton.addEventListener("click", setMythMode);
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
  renderKeepsakeCollection();
  renderArtSeries();
  updateSpellPanel();
  setRenderStyle(state.renderStyle);
  setVersion(state.version);
  setRitual(state.ritual, { quiet: true });
  setCompanion(state.companion, { syncMode: false });
  setMode(state.mode);
  updateTimer();
  updateGuideIdle(isCollectibleVersion() ? (state.version === "v7" ? "V7 ready" : state.version === "v6" ? "V6 ready" : "V5 ready") : isNatureVersion() ? (state.version === "v4" ? "V4 ready" : "Nature ready") : "Next");
  requestAnimationFrame(tick);
  requestAnimationFrame(drawSmoke);
})();
