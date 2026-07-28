export type PointCastFocusModeId =
  | 'film-room'
  | 'playbook'
  | 'belief-board'
  | 'saturday-ops'
  | 'walk-home';

export const POINTCAST_SOUND_OF_FOCUS = {
  spec: 'pointcast.college-football-sound-desk/v1',
  title: 'THE SOUND OF FOCUS',
  subtitle: 'What the work sounds like before the stadium arrives.',
  byline: 'Michael Hoydich',
  desk: 'Sound Desk',
  feature: '001',
  issue: '001',
  publishedAt: '2026-07-28T14:25:00-07:00',
  canonical: 'https://pointcast.xyz/25/magazine/sound-of-focus',
  machineEdition: 'https://pointcast.xyz/25/magazine/sound-of-focus.json',
  interactiveLab: 'https://tonebloom.xyz/focus',
  parent: 'https://pointcast.xyz/25/magazine',
  block: '0535',
  thesis:
    'College football is usually described at stadium volume. Most of its decisive attention happens earlier and quieter: the film room, the playbook, the belief board, the operation, and the walk that lets the mind widen again.',
  boundary:
    'An unofficial editorial and interactive sound study. It is not medical advice, performance treatment, coaching instruction, or an endorsement of supplements, cannabis, or non-prescribed medication.',
  focusModes: [
    {
      id: 'film-room',
      number: '01',
      pointcastName: 'The Film Room',
      toneBloomName: 'Deep Field',
      attention: 'Narrow and hold',
      job: 'Find the repeatable truth inside too much footage.',
      collegeFootballUse:
        'Opponent film, protection structure, coverage tendencies, self-scout, and the moment the first theory stops surviving the tape.',
      sound:
        'Low brown field, very sparse glass, and an optional split beat. No lyrics. No dramatic drop asking to become the work.',
      question: 'What is the one pattern that changes the call?',
      color: '#d8f000',
      playlist: {
        name: 'Deep Coding Mix',
        url: 'https://open.spotify.com/playlist/0VLY2iCC9TGOBUVbKzlIQU?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=a7ed2384-ce49-47b4-90d1-bbd0fd21475f&nl=spotify%3Anl%3ACAASEKftI4TOSUe0kNG70P0hR18aGDk6MFZMWTJpQ0M5VEdPQlVWYkt6bElRVSADMAPgAzXoA6qY99H6M%2FADoAQ%3D&redirect_uri=com.openai.chat%3A%2F%2F',
      },
    },
    {
      id: 'playbook',
      number: '02',
      pointcastName: 'The Playbook',
      toneBloomName: 'Reading Glass',
      attention: 'Protect the language channel',
      job: 'Keep words, rules, and sequence from competing with the soundtrack.',
      collegeFootballUse:
        'Install language, call sheets, reporting, editing, memorization, and every sentence that has to stay legible under pressure.',
      sound:
        'Soft pink field, almost no percussion, no lyrics, and long spaces between chimes.',
      question: 'What must still be clear when the crowd is not?',
      color: '#b6a6ef',
      playlist: {
        name: 'Reading Glass',
        url: 'https://open.spotify.com/playlist/4KrbIMqZFtWfqMsAv0xv5I?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=08a9a246-1fae-4566-949c-f1046eda9c47&nl=spotify%3Anl%3ACAASEAipokYfrkVmlJzxBG7anEcaGDk6NEtyYklNcVpGdFdmcU1zQXYweHY1SSADMAPgAzXoA%2B2L99H6M%2FADoAQ%3D&redirect_uri=com.openai.chat%3A%2F%2F',
      },
    },
    {
      id: 'belief-board',
      number: '03',
      pointcastName: 'The Belief Board',
      toneBloomName: 'Open Shape',
      attention: 'Widen and connect',
      job: 'Let apparently separate evidence form a new argument.',
      collegeFootballUse:
        'Ranking, scheme invention, recruiting fit, feature ideas, drawing a future campus, and asking what the consensus board cannot see.',
      sound:
        'An air field with wandering chimes and more color. Enough movement to invite connection without dictating the answer.',
      question: 'What changes if the obvious comparison is wrong?',
      color: '#ff6038',
      playlist: {
        name: '25 × Tone Bloom — Open Shape',
        url: 'https://open.spotify.com/playlist/1nm5bKd8yMv7i6SbCGNzz3?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=402156bd-07c3-4056-8b2b-cd8867b26190&nl=spotify%3Anl%3ACAASEEAhVr0Hw0BWiyvNiGeyYZAaGDk6MW5tNWJLZDh5TXY3aTZTYkNHTnp6MyADMAPgAzXoA6zE99H6M%2FADoAQ%3D&redirect_uri=com.openai.chat%3A%2F%2F',
      },
    },
    {
      id: 'saturday-ops',
      number: '04',
      pointcastName: 'Saturday Operations',
      toneBloomName: 'Admin Glide',
      attention: 'Move the queue',
      job: 'Keep small necessary actions moving without turning each into a referendum.',
      collegeFootballUse:
        'Travel sheets, equipment, credentials, texts, edits, exports, food, timing, and the invisible labor required before kickoff.',
      sound:
        'Dry pulse, warm ticks, and an even forward gait. Less contemplation, more reliable movement.',
      question: 'What can be finished cleanly before the next handoff?',
      color: '#2364ef',
      playlist: {
        name: 'Admin Glide',
        url: 'https://open.spotify.com/playlist/7uJiw6teir8N6ivVKqJFXS?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=77257655-d2e6-4fe3-8de2-ee62544dd227&nl=spotify%3Anl%3ACAASEHcldlXS5k%2FjjeLuYlRN0icaGDk6N3VKaXc2dGVpcjhONml2VktxSkZYUyADMAPgAzXoA4TR99H6M%2FADoAQ%3D&redirect_uri=com.openai.chat%3A%2F%2F',
      },
    },
    {
      id: 'walk-home',
      number: '05',
      pointcastName: 'The Walk Home',
      toneBloomName: 'Reset Walk',
      attention: 'Release and return',
      job: 'Let the aperture widen so the next narrow interval is possible.',
      collegeFootballUse:
        'The empty concourse, the hotel walk, the Sunday reset, postgame emotion, incubation, and the difference between recovery and more input.',
      sound:
        'Wide air, slow bronze, and a soft landing. This is not another performance interval.',
      question: 'What becomes visible when the result stops shouting?',
      color: '#f4ead8',
      playlist: {
        name: '25 × Tone Bloom — Reset Walk',
        url: 'https://open.spotify.com/playlist/39MNTFiA9EFlpl9TRYAjla?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=679e4003-e24e-4e1f-9919-ace073a55146&nl=spotify%3Anl%3ACAASEGeeQAPiTk4fmRms4HOlUUYaGDk6MzlNTlRGaUE5RUZscGw5VFJZQWpsYSADMAPgAzXoA57e99H6M%2FADoAQ%3D&redirect_uri=com.openai.chat%3A%2F%2F',
      },
    },
  ],
  principles: [
    {
      number: '01',
      title: 'Attention changes shape',
      note: 'Sustained film study, verbal learning, strategic invention, operations, and recovery do not ask the nervous system for the same thing.',
    },
    {
      number: '02',
      title: 'The crowd is not the model',
      note: 'Stadium music is designed for shared arousal. Work sound is often better when it masks, paces, or gets out of the way.',
    },
    {
      number: '03',
      title: 'Silence is a condition',
      note: 'The study rotates Tone Bloom, Spotify, and silence. A soundtrack has to beat the quiet result, not only the annoying room.',
    },
    {
      number: '04',
      title: 'Feeling focused is one measure',
      note: 'Completion, accuracy, recall, and distraction count can disagree with how compelling a session felt.',
    },
    {
      number: '05',
      title: 'Recovery belongs on the board',
      note: 'The walk home is not empty time. It is the wide state that makes another narrow state possible.',
    },
  ],
  enhancers: [
    {
      name: 'Caffeine',
      verdict: 'Useful for some, with real tradeoffs',
      note: 'A familiar amount may support alertness. More can produce anxiety, palpitations, and damaged sleep. The FDA 400 mg/day reference is not a target.',
    },
    {
      name: 'Binaural beats',
      verdict: 'A sound condition, not a treatment',
      note: 'Two nearby tones sent to opposite ears create a perceived beat. Attention findings and brain-entrainment claims remain inconsistent.',
    },
    {
      name: 'Adaptogens + nootropics',
      verdict: 'Product-specific and often overmarketed',
      note: '“Natural,” “adaptogen,” and “nootropic” are not evidence grades. Ingredients, purity, interactions, task, and repeated observation all matter.',
    },
    {
      name: 'Prescription stimulants',
      verdict: 'Clinical treatment, not shared equipment',
      note: 'They can be effective when appropriately prescribed and also carry misuse, addiction, and overdose risks. Never borrow or share them.',
    },
    {
      name: 'Cannabis',
      verdict: 'Felt focus can disagree with measured focus',
      note: 'THC can impair attention, memory, learning, decisions, coordination, and reaction time. Tone Bloom logs cannabis only as an observational context tag.',
    },
  ],
  sources: [
    {
      label: 'PLOS One systematic review · binaural-beat entrainment evidence',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37205669/',
    },
    {
      label: 'Memory & Cognition · music with lyrics and cognitive tasks',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10162369/',
    },
    {
      label: 'Scientific Reports · preferred background music and task-focus',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8357712/',
    },
    {
      label: 'U.S. FDA · caffeine amount, sensitivity, and safety',
      url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much',
    },
    {
      label: 'NIH NCCIH · Rhodiola usefulness and safety',
      url: 'https://www.nccih.nih.gov/health/rhodiola',
    },
    {
      label: 'NIH NCCIH · Ashwagandha usefulness and safety',
      url: 'https://www.nccih.nih.gov/health/ashwagandha',
    },
    {
      label: 'U.S. CDC · cannabis and brain health',
      url: 'https://www.cdc.gov/cannabis/health-effects/brain-health.html',
    },
    {
      label: 'U.S. FDA · prescription stimulant warnings',
      url: 'https://www.fda.gov/drugs/drug-safety-communications/fda-updating-warnings-improve-safe-use-prescription-stimulants-used-treat-adhd-and-other-conditions',
    },
    {
      label: 'World Health Organization · safe listening',
      url: 'https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening',
    },
  ],
  rights: {
    originalToneBloomWebAudio: true,
    spotifyPlaylistsCreatedForFeature: 5,
    spotifyPlaybackHostedByPointCast: false,
    spotifyPlaybackHostedByToneBloom: false,
    commercialRecordingsHosted: false,
    commercialRecordingsProxied: false,
    lyricsReproduced: false,
    medicalAdvice: false,
    diagnosis: false,
    localStudyDataUploaded: false,
  },
  credits: {
    conceptCurationWriting: 'Michael Hoydich',
    interactiveScoreBuild: 'GPT-5.6 Sol with Michael Hoydich',
    collaboration: 'PointCast 25 × Tone Bloom',
  },
} as const;
