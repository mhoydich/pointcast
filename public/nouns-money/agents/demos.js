(function () {
  'use strict';

  const IDS = ['desk-buddy', 'scout', 'keeper', 'tempo', 'muse', 'sprout', 'beacon', 'harbor', 'relay', 'treasury'];
  let sequence = 0;
  const clean = (value, max = 240) => Array.from(String(value == null ? '' : value).trim()).slice(0, max).join('');
  const textLines = (...lines) => lines.filter(line => line !== undefined && line !== null).join('\n');

  function mount({ projectId, element, onState = () => {}, onArtifact = () => {} }) {
    if (!element || typeof element.replaceChildren !== 'function') throw new Error('A demo container is required.');
    if (!IDS.includes(projectId)) throw new Error('Unknown Noun Agent project.');
    let active = true;
    const disposers = [];
    const prefix = 'noun-demo-' + (++sequence) + '-';
    let fieldNumber = 0;
    const root = document.createElement('div');
    root.className = 'noun-demo';
    root.dataset.project = projectId;
    element.replaceChildren(root);

    function el(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = String(text);
      return node;
    }
    function listen(node, event, handler) {
      const wrapped = (...args) => { if (active) handler(...args); };
      node.addEventListener(event, wrapped);
      disposers.push(() => node.removeEventListener(event, wrapped));
      return node;
    }
    function state(value, caption) { if (active) onState(value, caption); }
    function artifact(title, text) { if (active) onArtifact({ title, text }); }
    function intro(title, description) {
      root.append(el('h3', '', title), el('p', 'demo-intro', description));
    }
    function row(...nodes) {
      const node = el('div', 'demo-row');
      node.append(...nodes);
      return node;
    }
    function button(label, action) {
      const node = el('button', 'demo-button', label);
      node.type = 'button';
      return listen(node, 'click', action);
    }
    function field(label, value = '', options = {}) {
      const wrap = el('label', 'demo-field');
      const input = el(options.multiline ? 'textarea' : 'input');
      input.id = prefix + (++fieldNumber);
      wrap.htmlFor = input.id;
      if (!options.multiline) input.type = options.type || 'text';
      if (options.multiline) input.rows = options.rows || 3;
      input.value = value;
      input.maxLength = options.max || 240;
      if (options.placeholder) input.placeholder = options.placeholder;
      if (options.min != null) input.min = options.min;
      if (options.maxNumber != null) input.max = options.maxNumber;
      if (options.step != null) input.step = options.step;
      wrap.append(el('span', '', label), input);
      return { wrap, input };
    }
    function choice(label, items, initial) {
      const wrap = el('label', 'demo-field');
      const input = el('select');
      input.id = prefix + (++fieldNumber);
      wrap.htmlFor = input.id;
      items.forEach(item => {
        const option = el('option', '', typeof item === 'string' ? item : item.label);
        option.value = typeof item === 'string' ? item : item.value;
        input.append(option);
      });
      if (initial != null) input.value = initial;
      wrap.append(el('span', '', label), input);
      return { wrap, input };
    }
    function result() {
      const node = el('div', 'demo-result');
      node.setAttribute('aria-live', 'polite');
      node.style.whiteSpace = 'pre-wrap';
      root.append(node);
      return node;
    }
    function show(node, text) { node.textContent = text; }
    function required(input, label, output) {
      if (clean(input.value)) return true;
      show(output, 'Add ' + label + ' first.');
      state('needs-you', 'A little detail is missing.');
      input.focus();
      return false;
    }

    const implementations = {
      'desk-buddy': () => {
        intro('Make room for three things', 'Write a small list, then check off each step. Your companion follows the checklist you control.');
        const tasks = ['Choose one useful thing', 'Give it focused attention', 'Leave a note for tomorrow'].map((value, index) => {
          const task = field('Step ' + (index + 1), value, { max: 100 });
          const checkbox = el('input');
          checkbox.type = 'checkbox';
          checkbox.id = prefix + 'done-' + index;
          const label = el('label', 'demo-check');
          label.htmlFor = checkbox.id;
          label.append(checkbox, el('span', '', 'Done'));
          root.append(row(task.wrap, label));
          return { ...task, checkbox };
        });
        const output = result();
        const update = () => {
          const named = tasks.filter(task => clean(task.input.value));
          const done = named.filter(task => task.checkbox.checked).length;
          show(output, done + ' of ' + named.length + ' named steps complete.');
          state(named.length && done === named.length ? 'complete' : done ? 'working' : 'idle', named.length && done === named.length ? 'A small day, well done.' : 'One step at a time.');
        };
        tasks.forEach(task => {
          listen(task.checkbox, 'change', update);
          listen(task.input, 'input', () => { task.checkbox.checked = false; update(); });
        });
        root.append(row(button('Save my checklist', () => {
          if (!tasks.some(task => clean(task.input.value))) { show(output, 'Name at least one step.'); state('needs-you', 'Name your first step.'); return; }
          artifact('Desk Buddy checklist', textLines('DESK BUDDY · LOCAL CHECKLIST', '', ...tasks.filter(task => clean(task.input.value)).map(task => (task.checkbox.checked ? '[x] ' : '[ ] ') + clean(task.input.value, 100))));
          show(output, 'Your current checklist is ready to download.');
        }), button('Uncheck all', () => { tasks.forEach(task => { task.checkbox.checked = false; }); update(); })));
        update();
      },

      scout: () => {
        intro('Compare what you already found', 'Score up to three ideas or leads. Each of your three criteria counts equally; this prototype does not browse or verify claims.');
        const criteria = ['Fit', 'Readiness', 'Ease of reaching'].map(label => field('Criterion', label, { max: 40 }));
        root.append(row(...criteria.map(item => item.wrap)));
        const scores = ['1', '2', '3', '4', '5'];
        const leads = ['Lead A', 'Lead B', 'Lead C'].map((name, index) => {
          const group = el('fieldset', 'demo-list');
          group.append(el('legend', '', 'Candidate ' + (index + 1)));
          const title = field('Name', name, { max: 90 });
          const ratings = criteria.map((_, number) => choice('Criterion ' + (number + 1) + ' score', scores, '3'));
          group.append(title.wrap, row(...ratings.map(item => item.wrap)));
          root.append(group);
          return { title, ratings };
        });
        const output = result();
        root.append(button('Compare my scores', () => {
          const names = criteria.map((item, index) => clean(item.input.value, 40) || 'Criterion ' + (index + 1));
          const ranked = leads.map((lead, index) => ({ name: clean(lead.title.input.value, 90), scores: lead.ratings.map(item => Number(item.input.value)), index })).filter(lead => lead.name);
          if (!ranked.length) { show(output, 'Name at least one candidate.'); state('needs-you', 'Add something to compare.'); return; }
          ranked.forEach(lead => { lead.total = lead.scores.reduce((a, b) => a + b, 0); });
          ranked.sort((a, b) => b.total - a.total || a.index - b.index);
          const lines = ranked.map(lead => lead.name + ' — ' + lead.total + '/15\n' + names.map((name, i) => name + ': ' + lead.scores[i] + '/5').join(' · '));
          const topTied = ranked.filter(lead => lead.total === ranked[0].total).length > 1;
          const summary = topTied ? 'The highest score is tied. Choose the next conversation yourself.' : ranked[0].name + ' has the highest score under your criteria.';
          const report = textLines('SCOUT · USER-SCORED COMPARISON', '', ...lines.flatMap(line => [line, '']), summary, 'These scores are your inputs, not researched facts.');
          show(output, report);
          state('complete', topTied ? 'A tie worth thinking about.' : 'Your comparison is ready.');
          artifact('Scout comparison', report);
        }));
        state('needs-you', 'Give me your own criteria and scores.');
      },

      keeper: () => {
        intro('Keep a little field notebook', 'Save up to 12 short notes in this browser session. Delete a card or export the notebook to keep it beyond the session. No notes are sent anywhere.');
        const storageKey = 'noun-agent-keeper-v1';
        let notes = [];
        let storageAvailable = true;
        try {
          const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
          if (Array.isArray(saved)) notes = saved.filter(item => item && typeof item.text === 'string').slice(0, 12).map((item, i) => ({ id: String(item.id || 'restored-' + i), text: clean(item.text, 500) }));
        } catch (_) { storageAvailable = false; }
        const note = field('A thought worth keeping', '', { multiline: true, max: 500, placeholder: 'A useful quote, a small discovery, a reminder…' });
        root.append(note.wrap);
        const list = el('div', 'demo-list');
        const output = result();
        function save() {
          try { sessionStorage.setItem(storageKey, JSON.stringify(notes)); } catch (_) { storageAvailable = false; }
        }
        function render() {
          list.replaceChildren();
          notes.forEach(item => {
            const card = el('article', 'demo-note');
            const body = el('p', '', item.text);
            body.style.whiteSpace = 'pre-wrap';
            card.append(body, button('Delete note', () => { notes = notes.filter(saved => saved.id !== item.id); save(); render(); show(output, 'Note deleted.'); state('idle', 'Room for another thought.'); }));
            list.append(card);
          });
          if (!notes.length) list.append(el('p', '', 'Your notebook is empty.'));
        }
        root.append(row(button('Keep this note', () => {
          if (!required(note.input, 'a note', output)) return;
          if (notes.length >= 12) { show(output, 'This notebook holds 12 notes. Delete one or export the collection.'); state('needs-you', 'Make room in the notebook.'); return; }
          notes.push({ id: Date.now().toString(36) + '-' + (++fieldNumber), text: clean(note.input.value, 500) });
          note.input.value = '';
          save(); render();
          show(output, storageAvailable ? notes.length + ' notes kept in this tab.' : 'Note kept in this open demo only. Browser storage is unavailable; export it before leaving.');
          state('complete', 'A thought safely noted.');
        }), button('Export notebook', () => {
          if (!notes.length) { show(output, 'Add a note before exporting.'); state('needs-you', 'The notebook is waiting.'); return; }
          artifact('Keeper notebook', textLines('KEEPER · SESSION NOTEBOOK', '', ...notes.flatMap((item, i) => [(i + 1) + '. ' + item.text, ''])));
          show(output, 'Your notebook is ready to download.');
          state('complete', 'Your notes are ready to keep.');
        })), list);
        render();
        state('idle', notes.length ? notes.length + ' notes in this tab.' : 'A place for small discoveries.');
      },

      tempo: () => {
        intro('A small pocket of focus', 'Choose one or five minutes. The timer uses elapsed clock time, so switching tabs will not stretch the session.');
        const duration = choice('Focus length', [{ value: '60', label: '1 minute' }, { value: '300', label: '5 minutes' }], '60');
        const intention = field('One thing to focus on', '', { max: 120, placeholder: 'Sketch a first idea' });
        root.append(row(duration.wrap, intention.wrap));
        const display = el('p', 'demo-timer', '01:00');
        display.setAttribute('role', 'timer');
        display.setAttribute('aria-label', 'Time remaining');
        root.append(display);
        const output = result();
        let remaining = 60000;
        let deadline = null;
        let total = 60000;
        let completed = false;
        const format = milliseconds => {
          const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
          return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
        };
        let start;
        let pause;
        function finish() {
          deadline = null;
          remaining = 0;
          completed = true;
          display.textContent = '00:00';
          start.disabled = true;
          pause.disabled = true;
          duration.input.disabled = false;
          show(output, 'Your focus session is complete. Take a breath before your next step.');
          state('complete', 'A little time, well spent.');
          artifact('Tempo focus receipt', textLines('TEMPO · COMPLETED FOCUS SESSION', '', 'Duration: ' + total / 60000 + ' minute' + (total === 60000 ? '' : 's'), 'Focus: ' + (clean(intention.input.value, 120) || 'A quiet moment'), 'Completed: ' + new Date().toISOString(), '', 'Browser-local timer receipt; completion is not proof of work.'));
        }
        function tick() {
          if (!active || deadline === null) return;
          remaining = Math.max(0, deadline - Date.now());
          display.textContent = format(remaining);
          if (remaining === 0) finish();
        }
        function reset() {
          deadline = null;
          completed = false;
          total = Number(duration.input.value) * 1000;
          remaining = total;
          display.textContent = format(remaining);
          start.disabled = false;
          start.textContent = 'Start focus';
          pause.disabled = true;
          duration.input.disabled = false;
          show(output, 'Ready when you are.');
          state('idle', 'A moment waiting for you.');
        }
        start = button('Start focus', () => {
          if (deadline !== null || completed) return;
          deadline = Date.now() + remaining;
          start.disabled = true;
          pause.disabled = false;
          duration.input.disabled = true;
          show(output, 'Focusing' + (clean(intention.input.value, 120) ? ' on: ' + clean(intention.input.value, 120) : '.') + '\nKeep this page open; no notification permission is needed.');
          state('working', 'I will keep the time.');
          tick();
        });
        pause = button('Pause', () => {
          tick();
          if (deadline === null) return;
          deadline = null;
          start.disabled = false;
          start.textContent = 'Resume focus';
          pause.disabled = true;
          show(output, 'Paused. Your remaining time is saved until you leave this demo.');
          state('needs-you', 'Ready to resume when you are.');
        });
        root.append(row(start, pause, button('Reset timer', reset)));
        listen(duration.input, 'change', reset);
        const timer = setInterval(tick, 200);
        disposers.push(() => clearInterval(timer));
        reset();
      },

      muse: () => {
        intro('Turn ingredients into a creative brief', 'Pick a mood, a material and a purpose. Muse assembles a repeatable prompt template from your choices; it is not generating an image.');
        const mood = choice('Mood', ['Quiet wonder', 'Playful optimism', 'Midnight mystery', 'Warm nostalgia']);
        const material = choice('Material', ['Folded paper', 'Riso ink', 'Glazed ceramic', 'Woven textile']);
        const purpose = choice('Object', ['A companion keepsake', 'A pocket field guide', 'A celebration ticket', 'A tiny desk shrine']);
        const audience = field('For whom?', '', { max: 100, placeholder: 'Someone beginning something new' });
        const constraint = field('One useful constraint', 'Two colors, one original Noun', { max: 150 });
        root.append(row(mood.wrap, material.wrap), purpose.wrap, audience.wrap, constraint.wrap);
        const output = result();
        let variation = 0;
        const details = ['Leave one generous area of empty space.', 'Give one small detail an unexpected scale.', 'Build a repeated border from a single simple shape.', 'Use the reverse side for a personal message.'];
        root.append(button('Compose a brief', () => {
          const brief = textLines('MUSE · CREATIVE BRIEF', '', 'Object: ' + purpose.input.value, 'Mood: ' + mood.input.value, 'Material: ' + material.input.value, 'For: ' + (clean(audience.input.value, 100) || 'A curious friend'), 'Constraint: ' + (clean(constraint.input.value, 150) || 'Keep the first version simple.'), '', 'Direction: ' + details[variation++ % details.length], 'Noun treatment: preserve the original pixel geometry; build the layout around it.', 'First proof: make one small version and check its legibility at actual size.');
          show(output, brief);
          state('complete', 'A first direction, ready to explore.');
          artifact('Muse creative brief', brief);
        }));
        state('needs-you', 'Choose the ingredients.');
      },

      sprout: () => {
        intro('Three small lessons about Noun companions', 'A tiny local quiz with explanations. Learn what an original portrait, a visual state and a printable note actually mean.');
        const questions = [
          { text: 'What makes a companion portrait reproducible?', options: ['A five-part trait seed plus the same source art', 'A title saying “rare”', 'A new image every time'], correct: 0, why: 'The background, body, accessory, head and glasses indices select layers from the same art snapshot. A seed does not establish a minted token or ownership.' },
          { text: 'The companion switches to “working.” What does this prove?', options: ['A remote bot is definitely running', 'Only that this interface received a working-state signal', 'An external task is complete'], correct: 1, why: 'Visual states are interface signals. This demo changes them through your actions; a real integration would need verified events from the bot.' },
          { text: 'What is Nouns Bot Money in this collection?', options: ['Legal tender', 'An automatic token balance', 'A printable art keepsake with a fictional denomination'], correct: 2, why: 'These notes are collectible art. Printing a note does not create financial rights, a payment balance, custody or a minted asset.' }
        ];
        let index = 0;
        let score = 0;
        let answered = false;
        const question = el('h4');
        const options = el('div', 'demo-list');
        const output = result();
        const next = button('Next lesson', () => {
          if (!answered) return;
          index++;
          if (index < questions.length) render();
          else {
            question.textContent = 'A little wiser.';
            options.replaceChildren();
            next.hidden = true;
            show(output, score + ' of ' + questions.length + ' correct on the first try. You have seen every explanation.');
            artifact('Sprout learning card', textLines('SPROUT · LEARNING CARD', '', 'First-answer score: ' + score + '/3', '', ...questions.flatMap(item => [item.text, item.options[item.correct], item.why, ''])));
            state('complete', 'Three small lessons, kept.');
          }
        });
        function render() {
          answered = false;
          next.disabled = true;
          next.hidden = false;
          next.textContent = index === questions.length - 1 ? 'Finish lesson' : 'Next lesson';
          const item = questions[index];
          question.textContent = (index + 1) + ' of 3 · ' + item.text;
          options.replaceChildren();
          item.options.forEach((label, answerIndex) => {
            const option = button(label, () => {
              if (answered) return;
              answered = true;
              if (answerIndex === item.correct) score++;
              Array.from(options.querySelectorAll('button')).forEach(node => { node.disabled = true; });
              show(output, (answerIndex === item.correct ? 'Exactly. ' : 'The answer is: ' + item.options[item.correct] + '. ') + item.why);
              next.disabled = false;
              state('working', 'One new idea taking root.');
            });
            options.append(option);
          });
          show(output, 'Choose one answer.');
          state('needs-you', 'A small question for you.');
        }
        root.append(question, options, next);
        render();
      },

      beacon: () => {
        intro('Make a welcoming beginning', 'Create a host card and a three-part agenda for a gathering. This is a printable plan; it sends no invitations.');
        const occasion = field('Gathering', 'A small creative afternoon', { max: 100 });
        const host = field('Host or group', '', { max: 80, placeholder: 'The neighborhood studio' });
        const duration = choice('Time together', [{ value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '60', label: '60 minutes' }], '30');
        const welcome = field('Welcome line', 'Come as you are. There is room for your ideas.', { multiline: true, max: 200 });
        root.append(occasion.wrap, row(host.wrap, duration.wrap), welcome.wrap);
        const output = result();
        root.append(button('Create welcome card', () => {
          if (!required(occasion.input, 'a name for the gathering', output)) return;
          const minutes = Number(duration.input.value);
          const arrival = Math.round(minutes / 5);
          const closing = arrival;
          const making = minutes - arrival - closing;
          const card = textLines('BEACON · WELCOME CARD', '', clean(occasion.input.value, 100), clean(welcome.input.value, 200) || 'Welcome. There is a place for you here.', 'Hosted by: ' + (clean(host.input.value, 80) || 'Friends, together'), '', 'OUR ' + minutes + '-MINUTE PLAN', 'Arrive & introduce ourselves · ' + arrival + ' minutes', 'Make, share or explore together · ' + making + ' minutes', 'Name one thing to take away · ' + closing + ' minutes', '', 'Host note: make room for quiet participation and an easy way to pass.');
          show(output, card);
          artifact('Beacon welcome card', card);
          state('complete', 'A place made ready.');
        }));
        state('needs-you', 'Who are we welcoming?');
      },

      harbor: () => {
        intro('A place to put a thought down', 'Write an intention and a reflection. Harbor arranges your own words into a keepsake card; no interpretation or advice is generated.');
        const mood = choice('The feeling of this moment', ['Quiet', 'Hopeful', 'Restless', 'Grateful', 'Uncertain']);
        const intention = field('What would you like to make room for?', '', { multiline: true, max: 240, placeholder: 'A little patience with the unfinished things.' });
        const reflection = field('What would you like to remember?', '', { multiline: true, max: 400, placeholder: 'One ordinary thing that mattered today.' });
        const dedication = field('Dedicate this card', '', { max: 80, placeholder: 'For a friend, for tomorrow, for myself' });
        root.append(mood.wrap, intention.wrap, reflection.wrap, dedication.wrap);
        const output = result();
        root.append(button('Make my reflection card', () => {
          if (!clean(intention.input.value) && !clean(reflection.input.value)) { show(output, 'Add an intention or a reflection to make the card your own.'); state('needs-you', 'Your words will make this card.'); intention.input.focus(); return; }
          const card = textLines('HARBOR · A MOMENT KEPT', '', mood.input.value, clean(dedication.input.value, 80) || 'For this moment', '', 'I am making room for:', clean(intention.input.value, 240) || 'A little open space.', '', 'I want to remember:', clean(reflection.input.value, 400) || 'I can return to this later.');
          show(output, card);
          artifact('Harbor reflection card', card);
          state('complete', 'Your words, held for a moment.');
        }));
        state('idle', 'There is room to begin slowly.');
      },

      relay: () => {
        intro('Make the next handoff clear', 'Assign three steps and name what “done” means. Relay prepares a handoff brief for you to share; it does not contact anyone or run the work.');
        const goal = field('Shared goal', '', { max: 150, placeholder: 'Prepare a first printable collection' });
        root.append(goal.wrap);
        const tasks = ['Choose the direction', 'Make the first proof', 'Review and hand off'].map((value, index) => {
          const group = el('fieldset', 'demo-list');
          group.append(el('legend', '', 'Step ' + (index + 1)));
          const task = field('Task', value, { max: 130 });
          const owner = field('Owner', '', { max: 80, placeholder: 'A person or a bot name' });
          const done = field('Done means', '', { max: 160, placeholder: 'A concrete deliverable' });
          group.append(task.wrap, row(owner.wrap, done.wrap));
          root.append(group);
          return { task, owner, done };
        });
        const output = result();
        root.append(button('Prepare handoff', () => {
          if (!required(goal.input, 'a shared goal', output)) return;
          const incomplete = tasks.find(item => !clean(item.task.input.value) || !clean(item.owner.input.value) || !clean(item.done.input.value));
          if (incomplete) { show(output, 'Give each step a task, an owner and a clear definition of done.'); state('needs-you', 'A handoff needs clear ownership.'); (!clean(incomplete.task.input.value) ? incomplete.task.input : !clean(incomplete.owner.input.value) ? incomplete.owner.input : incomplete.done.input).focus(); return; }
          const brief = textLines('RELAY · HANDOFF BRIEF', '', 'Goal: ' + clean(goal.input.value, 150), '', ...tasks.flatMap((item, index) => [(index + 1) + '. ' + clean(item.task.input.value, 130), 'Owner: ' + clean(item.owner.input.value, 80), 'Done means: ' + clean(item.done.input.value, 160), index ? 'Starts after step ' + index + ' is reviewed.' : 'Ready to begin after the owner accepts.', '']), 'Status: prepared locally. Not sent, accepted or executed.');
          show(output, brief);
          artifact('Relay handoff brief', brief);
          state('complete', 'The next step has a name.');
        }));
        state('needs-you', 'Who will carry each step?');
      },

      treasury: () => {
        intro('Make a note worth keeping', 'Draft a dedication for Nouns Bot Money, then open the note studio. Denominations are fictional design elements; these notes carry no monetary or token value.');
        const denomination = choice('Collector’s denomination', ['1', '10', '100'], '10');
        const purpose = choice('What this note celebrates', ['One good idea', 'A helpful handoff', 'A focused hour', 'A tiny act of care']);
        const dedication = field('Dedication', '', { max: 80, placeholder: 'For the person who helped me begin' });
        const message = field('Message for the reverse', '', { multiline: true, max: 200, placeholder: 'Keep making small things that matter.' });
        root.append(row(denomination.wrap, purpose.wrap), dedication.wrap, message.wrap);
        const output = result();
        root.append(button('Create my note brief', () => {
          const brief = textLines('NOUNS BOT MONEY · NOTE BRIEF', '', 'Companion: Treasury', 'Fictional denomination: ' + denomination.input.value, 'Celebrating: ' + purpose.input.value, 'Dedication: ' + (clean(dedication.input.value, 80) || 'For a small thing that mattered'), 'Reverse: ' + (clean(message.input.value, 200) || 'Keep making small things that matter.'), '', 'Art direction: original Nouns portrait, generous margins, clear serial and edition fields.', 'Collectible art only. Not legal tender, a token, a balance or a promise of redemption.', 'The note studio opens separately; this brief is not automatically sent there.');
          show(output, brief);
          artifact('Nouns Bot Money dedication', brief);
          state('complete', 'A little value, expressed as a keepsake.');
        }));
        const link = el('a', 'demo-button', 'Open Nouns Bot Money studio ↗');
        link.href = '../bot-money/?agent=treasury';
        root.append(link);
        state('needs-you', 'What would you like to celebrate?');
      }
    };

    implementations[projectId]();
    const disclosure = el('p', 'demo-disclosure', 'Local prototype · Your actions drive the companion’s visual state. No autonomous bot, external send or background service is running.');
    root.append(disclosure);
    return () => {
      if (!active) return;
      active = false;
      disposers.splice(0).forEach(dispose => dispose());
      if (root.parentNode === element) root.remove();
    };
  }

  window.NounAgentDemos = Object.freeze({ mount, ids: Object.freeze(IDS.slice()) });
})();
