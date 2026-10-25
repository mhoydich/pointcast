/** Authored prompts and deterministic outlines. No model, scoring, or generated claims. */
export const WORKSHOPS = {
  pitch: {
    id: 'pitch',
    title: 'Pitch Room',
    kicker: 'SAY IT CLEARLY / THEN TRY IT AGAIN',
    description: 'Find the point of your offer, proposal, or difficult conversation. Write or dictate a first take, rehearse it, and leave with a useful speaking card.',
    accent: '#efc29c',
    timerSeconds: 60,
    checklist: [
      'I can name the person or audience I am speaking to.',
      'I used a specific example instead of an unsupported promise.',
      'I left room for the other person’s perspective.',
      'I ended with one clear, proportionate next step.',
    ],
    scenarios: [
      {
        id: 'offer',
        title: 'Introduce an offer',
        description: 'Explain what you make, who it helps, and a small next step.',
        prompts: [
          { id: 'audience', label: 'Who it is for', question: 'Who are you speaking to, and what situation are they dealing with?', hint: 'Picture one person in one real situation. Use their language rather than a broad market label.', placeholder: 'I am speaking to… They are trying to…' },
          { id: 'offer', label: 'The useful change', question: 'What do you offer, and what useful change is it intended to make?', hint: 'Name the thing you actually provide. Separate what it does today from what you hope it will do.', placeholder: 'I make / provide… It is designed to help with…' },
          { id: 'evidence', label: 'Something concrete', question: 'What example, demonstration, or result can you honestly point to?', hint: 'A small sample is enough. If you do not have evidence yet, say what you would need to test.', placeholder: 'A concrete example is… What I have not tested yet is…' },
          { id: 'concern', label: 'The likely question', question: 'What might make this person hesitate, and what is your honest answer?', hint: 'Think about fit, time, cost, or effort. You can acknowledge a limit without solving it in this rehearsal.', placeholder: 'They may ask… My answer would be…' },
          { id: 'next', label: 'One next step', question: 'What small, specific next step are you asking for?', hint: 'Make the request easy to understand and easy to decline. Avoid promising an outcome you cannot control.', placeholder: 'Would you be open to…?' },
        ],
      },
      {
        id: 'proposal',
        title: 'Present a creative proposal',
        description: 'Give an idea a shape someone else can picture and respond to.',
        prompts: [
          { id: 'idea', label: 'The central idea', question: 'What would you like to make, and who is it for?', hint: 'Try one sentence with a clear subject. Give the project a working name if that helps.', placeholder: 'I want to make… for…' },
          { id: 'experience', label: 'What someone experiences', question: 'Describe one moment a person would see, hear, or do.', hint: 'Choose a concrete scene that makes the idea easy to picture. A mood word alone is not a scene.', placeholder: 'Someone arrives and… Then they…' },
          { id: 'proof', label: 'What already exists', question: 'What sketch, reference, sample, or test can you show now?', hint: 'Distinguish an existing piece from something you still plan to create.', placeholder: 'I can show… The part still to make is…' },
          { id: 'scope', label: 'The first version', question: 'What belongs in the first version, and what are its limits?', hint: 'Name a realistic size, time box, or dependency. Use estimates as estimates, not commitments.', placeholder: 'The first version includes… It depends on…' },
          { id: 'decision', label: 'The decision you need', question: 'What decision or piece of feedback would help you move forward?', hint: 'Ask one focused question rather than requesting approval of everything at once.', placeholder: 'The decision I need is… The question I want feedback on is…' },
        ],
      },
      {
        id: 'conversation',
        title: 'Prepare a difficult conversation',
        description: 'Make room for facts, your perspective, and a constructive request.',
        prompts: [
          { id: 'observation', label: 'What happened', question: 'What specific event or pattern do you want to discuss?', hint: 'Describe what you observed. Leave guesses about the other person’s motives out of this first sentence.', placeholder: 'When… happened, I noticed…' },
          { id: 'impact', label: 'Why it matters to you', question: 'How did it affect you or the work you share?', hint: 'Speak from your perspective. Name the effect without deciding what the other person intended.', placeholder: 'The effect on me / our work was…' },
          { id: 'curiosity', label: 'Their perspective', question: 'What could you ask to understand how they saw the situation?', hint: 'Use a question you are prepared to listen to, rather than a conclusion disguised as a question.', placeholder: 'How did you see…? Is there something I am missing about…?' },
          { id: 'request', label: 'A workable request', question: 'What concrete change would you like to ask for?', hint: 'Keep the request within the situation you described. Leave space to discuss another workable approach.', placeholder: 'Could we try…? What would make that workable for you?' },
          { id: 'followup', label: 'How to leave it', question: 'How would you confirm the next step after hearing their response?', hint: 'Rehearse an invitation to agree on a next step, not a claim that they have already agreed.', placeholder: 'Before we finish, can we check…?' },
        ],
      },
    ],
  },
  story: {
    id: 'story',
    title: 'Story Booth',
    kicker: 'FOLLOW A THREAD / FIND ITS SHAPE',
    description: 'Talk or write your way through a story, a remembered moment, or a world you want to explore. Six prompts turn your own words into an outline you can take away.',
    accent: '#c4bde9',
    timerSeconds: 120,
    checklist: [
      'There is a person, perspective, or place I want to follow.',
      'I included at least one specific sensory detail.',
      'I can point to what changes or what remains unresolved.',
      'For a real memory, I marked details I am unsure about.',
    ],
    scenarios: [
      {
        id: 'short-story',
        title: 'A short story',
        description: 'Follow someone who wants something and has to make a choice.',
        prompts: [
          { id: 'character', label: 'Someone wants something', question: 'Who are we following, and what do they want right now?', hint: 'Start with a person and an immediate desire. You do not need their whole biography.', placeholder: 'We follow… Right now, they want…' },
          { id: 'place', label: 'A place with a pulse', question: 'Where are they, and what small detail makes the place feel real?', hint: 'Use a sound, texture, smell, object, or habit someone could notice.', placeholder: 'They are in… One detail is…' },
          { id: 'obstacle', label: 'Something in the way', question: 'What makes getting what they want difficult?', hint: 'It can be another person, a practical limit, a mistaken belief, or a conflict within them.', placeholder: 'The difficulty is… It matters because…' },
          { id: 'choice', label: 'A choice with a cost', question: 'What do they decide to do, and what might it cost them?', hint: 'Give them an action. A decision moves the story even if it turns out to be wrong.', placeholder: 'They decide to… That risks…' },
          { id: 'turn', label: 'The turn', question: 'What happens that changes their understanding or their plan?', hint: 'This can be quiet. An ordinary gesture or a new fact can change a scene.', placeholder: 'Then… They realize…' },
          { id: 'ending', label: 'The last image', question: 'What do we see or hear at the end, and what has changed?', hint: 'Try ending on an image or action. It does not have to resolve every question.', placeholder: 'The final image is… What has changed is…' },
        ],
      },
      {
        id: 'memory',
        title: 'A remembered moment',
        description: 'Keep a real experience in your own words, including its uncertainties.',
        prompts: [
          { id: 'moment', label: 'The moment', question: 'What moment would you like to preserve?', hint: 'Choose something you feel comfortable writing about. An ordinary day is enough.', placeholder: 'I want to remember the time…' },
          { id: 'setting', label: 'Where you were', question: 'Where were you, and roughly when was it?', hint: 'Approximate is fine. Mark anything you are unsure about rather than filling in a detail.', placeholder: 'It was around… We were at… I am not sure about…' },
          { id: 'people', label: 'Who was there', question: 'Who was present, and what do you remember them doing?', hint: 'Use names or simple descriptions as you prefer. Include only details you want in your export.', placeholder: 'I was with… I remember them…' },
          { id: 'detail', label: 'The detail that stayed', question: 'What sound, object, gesture, or phrase still comes back to you?', hint: 'If the wording is approximate, say so. A remembered impression does not need to become an exact quotation.', placeholder: 'The detail I keep returning to is…' },
          { id: 'change', label: 'What moved', question: 'Did anything change during that moment or afterward?', hint: 'It is also fine to say nothing obvious changed. You are preserving the experience, not forcing a lesson.', placeholder: 'During / after that moment… Or perhaps what stayed the same was…' },
          { id: 'meaning', label: 'What it means now', question: 'Why do you want to keep this memory now?', hint: 'Leave room for your understanding to change. A question can be a good final line.', placeholder: 'Today, I want to keep it because… I still wonder…' },
        ],
      },
      {
        id: 'world',
        title: 'A world to explore',
        description: 'Begin with a place, a rule, and one person living inside it.',
        prompts: [
          { id: 'place', label: 'The place', question: 'What is this place, and what does it feel like on an ordinary day?', hint: 'Start at human scale: a street, kitchen, station, garden, or workplace.', placeholder: 'This is a place where… On an ordinary day…' },
          { id: 'rule', label: 'One unusual rule', question: 'What rule, custom, or physical fact makes this world different?', hint: 'Choose one difference you can show through daily life.', placeholder: 'In this world… Because of that, people…' },
          { id: 'person', label: 'Someone inside it', question: 'Who lives here, and how do they get through an ordinary day?', hint: 'Give us a job, habit, responsibility, or small desire to follow.', placeholder: 'We meet… Their day usually involves…' },
          { id: 'friction', label: 'Where the rule pinches', question: 'How does that world’s rule make this person’s life easier or harder?', hint: 'Connect the interesting idea to a practical consequence.', placeholder: 'The rule helps them by… But it makes… difficult.' },
          { id: 'spark', label: 'A day that breaks the pattern', question: 'What happens one day that this person cannot simply ignore?', hint: 'Find a small incident that can open a larger story.', placeholder: 'One day… They cannot ignore it because…' },
          { id: 'question', label: 'The door you leave open', question: 'What would you like to discover next about this world?', hint: 'Name the unresolved question, possible scene, or tension that makes you want to return.', placeholder: 'Next, I want to find out…' },
        ],
      },
    ],
  },
};

function answerFor(answers, id) {
  if (!answers || typeof answers !== 'object' || !Object.hasOwn(answers, id)) return '';
  return typeof answers[id] === 'string' ? answers[id].trim() : '';
}

export function getProgress(scenario, answers = {}) {
  const total = scenario.prompts.length;
  const completed = scenario.prompts.filter(prompt => answerFor(answers, prompt.id)).length;
  return { completed, total, remaining: total - completed, percent: total ? Math.round(completed / total * 100) : 0 };
}

export function buildOutline(config, scenario, answers = {}) {
  const sections = scenario.prompts.map((prompt, index) => `### ${index + 1}. ${prompt.label}\n\n${answerFor(answers, prompt.id) || '[Not answered]'}`);
  const kind = config.id === 'pitch' ? 'Speaking card' : 'Story outline';
  return [
    `# ${config.title} — ${scenario.title}`,
    `${kind} · Open Channel / PointCast`,
    'Assembled from your answers to authored prompts. No AI-written answers or automated evaluation. Dessa is not connected.',
    `https://pointcast.xyz/open-channel/${config.id === 'pitch' ? 'pitch-room' : 'story-booth'}/`,
    '## Your words, in order',
    ...sections,
  ].join('\n\n') + '\n';
}
