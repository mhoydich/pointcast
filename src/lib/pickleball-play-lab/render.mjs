import { SESSION } from './session.mjs';
export const GAMES = [
  {
    id: 'backhand', name: 'Backhand Builder', label: '01 / TOGETHER', hook: 'Make the next six feel familiar.', score: '6 good dinks = 1 team point',
    purpose: 'Explore a comfortable, repeatable backhand dink.',
    steps: [
      'Stand opposite one another at the kitchen line. Choose straight-ahead or crosscourt positions so both players can comfortably use a backhand.',
      'Cooperatively exchange bounce dinks to the agreed backhand area. Start with a generous target and manageable pace.',
      'Count successful in-bounds backhand dinks across both players: each return adds one. Six in a row earn one team point, then reset the streak to zero. A miss resets the streak, not the team score. Collect three team points; take turns feeding.',
    ],
    easier: 'Start with three consecutive dinks if six feels frustrating.',
    harder: 'Shrink the target slightly. For a separate challenge, alternate backhand and middle targets and count all successful target shots. Change one thing at a time.',
    notice: 'Look for a repeatable low, controlled ball. This game does not prescribe a one- or two-handed backhand.',
  },
  {
    id: 'drop', name: 'Drop-and-Go', label: '02 / YOUR OWN BEST', hook: 'Give yourself time to arrive.', score: 'Up to 2 points per attempt',
    purpose: 'Connect a soft drop to a controlled move toward the kitchen.',
    steps: [
      'Agree on a half-court lane. One player starts at the baseline; the other starts at the kitchen and feeds a ball that bounces comfortably near the baseline.',
      'The baseline player drops the feed. The rally becomes live in your lane; the kitchen player returns realistically rather than manufacturing success.',
      'Award the two points independently, with a maximum of two. Earn one if the receiver contacts the drop below net height. During the same rally, earn another if the baseline player reaches the kitchen line under control and then makes a legal, in-bounds shot before the rally ends. Intermediate shots are allowed. A missed drop earns zero. A drop the receiver does not contact has no observed contact height; do not count it as a below-net success.',
      'For an untimed round, take ten feeds and then swap roles. In this five-minute session, swap at 2:30 even if you have not finished ten. Compare your own previous total only when the number and setup of attempts match.',
    ],
    easier: 'Start closer to the kitchen. Advance when the reply allows it; reaching the line at any cost is not the goal.',
    harder: 'Vary feed depth. Later, start with a real serve and return and follow the normal two-bounce rule.',
    notice: 'Below-net contact is a useful practice proxy, not proof that a ball cannot be attacked.',
  },
  {
    id: 'green', name: 'Green-Light Dinks', label: '03 / CHOOSE WELL', hook: 'An invitation, not an impulse.', score: 'First to 7; switch lanes next game',
    purpose: 'Practice choosing an attack as well as hitting one.',
    steps: [
      'Use an agreed half-court lane. Start with a gentle feed, which does not count. Then count four successful cooperative bounce dinks across both players. A setup miss restarts the opening with no point.',
      'After the fourth successful dink, the rally is live. Either player may speed up only when balanced and contacting the ball above net height.',
      'The rally winner earns one point. Attacking before the four-dink setup is complete, or outside the agreed decision gate, immediately gives the other player the point. If a call is uncertain, replay the point. Play to seven, then switch lanes.',
    ],
    easier: 'Choose a slower pace and a generous lane together.',
    harder: 'In a later round, remove the above-net restriction. Discuss whether each attempted attack created an advantage.',
    notice: 'The attack gate is an intentionally conservative practice constraint, not a universal tactical rule. A winning shot can still be a poor decision.',
  },
];
export function renderPlayLab() {
  return `<div class="play-lab" data-play-lab>
    <header class="lab-nav"><a class="lab-brand" href="/">POINTCAST<span>COURT NOTES</span></a><a href="/pickleball/home">Pickleball Home <span aria-hidden="true">↗</span></a></header>
    <section class="lab-hero" aria-labelledby="lab-title">
      <div class="lab-hero-copy"><p class="lab-eyebrow">THE PLAY LAB / SESSION 01</p><h1 id="lab-title">One court.<br>Two players.<br><em>Twenty minutes.</em></h1><p class="lab-dek">Three small challenges. One thing to carry into your next game.</p><a class="lab-primary" href="#session">Open the play card <span aria-hidden="true">↘</span></a><p class="lab-hero-note">A partner practice for adults. Bring your usual paddles and a ball.</p></div>
      <div class="lab-court" aria-hidden="true"><div class="lab-court-line lab-court-top"></div><div class="lab-kitchen lab-kitchen-top"></div><div class="lab-net"></div><div class="lab-kitchen lab-kitchen-bottom"></div><div class="lab-court-line lab-court-bottom"></div><span class="lab-ball lab-ball-a"></span><span class="lab-ball lab-ball-b"></span><span class="lab-court-caption">CONTROL<br>CHOICE<br>JOY</span><span class="lab-court-number">20</span></div>
    </section>
    <div class="lab-intro"><p>Get better without turning every court visit into homework. Try a short game, notice one useful pattern, and finish with something you both enjoy.</p><p>Adjust the challenge together. These are practice experiments, not rating tests.</p></div>
    <section id="session" class="lab-session" aria-labelledby="session-title">
      <div class="lab-section-heading"><div><p class="lab-eyebrow">01 / YOUR PLAY CARD</p><h2 id="session-title">A little structure.<br>Room to play.</h2></div><p>Read the games first. Stop at each time boundary even if a game is unfinished, or pause and extend it together.</p></div>
      <div class="lab-clock" data-clock-controls hidden>
        <div class="lab-clock-face"><span class="lab-eyebrow">SESSION REMAINING</span><span class="lab-clock-digits" data-clock role="timer" aria-label="Session time remaining">20:00</span><span data-phase-time>2:00 in this block</span></div>
        <div class="lab-clock-copy"><p class="lab-eyebrow" data-clock-state>READY WHEN YOU ARE</p><h3 data-phase-title>Find your rhythm</h3><p data-phase-cue>${SESSION[0].cue}</p><div class="lab-clock-buttons"><button class="lab-primary" type="button" data-clock-toggle>Start session</button><button class="lab-secondary" type="button" data-clock-reset>Reset</button></div><p class="lab-clock-help">Pauses when this tab is hidden or you leave the page. Pause before locking your screen; resume when ready. Refreshing starts a new session.</p></div>
      </div>
      <p class="lab-status" role="status" aria-live="polite" data-clock-status></p>
      <ol class="lab-phases">${SESSION.map((phase, index) => `<li data-phase="${index}"><div class="lab-phase-top"><span>${String(index + 1).padStart(2, '0')}</span><span>${phase.range}</span></div><h3>${phase.title}</h3><p>${phase.cue}</p><button type="button" data-jump="${index}" hidden>Start here<span class="lab-sr">: ${phase.title}</span> <span aria-hidden="true">↗</span></button></li>`).join('')}</ol>
      <noscript><p class="lab-note">The full session and game rules work without JavaScript. Use your own clock for the suggested timing.</p></noscript>
    </section>
    <section id="games" class="lab-games" aria-labelledby="games-title">
      <div class="lab-section-heading"><div><p class="lab-eyebrow">02 / PICK A CHALLENGE</p><h2 id="games-title">Three ways<br>to want another rep.</h2></div><p>Choose cooperative points, a personal best, or a short competitive round. Both players get a say.</p></div>
      <div class="lab-rules-note"><strong>Custom practice rules.</strong> All scoring and constraints here are our own training formats. Agree on them first. Keep normal non-volley-zone restrictions during live play. Feed-start games skip the serve and return sequence; they are not official matches. Use the <a href="https://usapickleball.org/rules/">USA Pickleball rulebook</a> for match rules.</div>
      <div class="lab-game-picker" data-game-picker hidden role="group" aria-label="Choose a practice game">${GAMES.map(game => `<button type="button" data-game-button="${game.id}" aria-controls="game-${game.id}" aria-pressed="false">${game.name}<span aria-hidden="true">↗</span></button>`).join('')}</div>
      ${GAMES.map(game => `<article class="lab-game" id="game-${game.id}" data-game="${game.id}" aria-labelledby="title-${game.id}"><div class="lab-game-intro"><p class="lab-eyebrow">${game.label}</p><h3 id="title-${game.id}">${game.name}</h3><p class="lab-game-hook">${game.hook}</p><p>${game.purpose}</p><div class="lab-score"><span class="lab-eyebrow">CUSTOM SCORE</span><strong>${game.score}</strong></div></div><div class="lab-game-rules"><h4>How to play</h4><ol>${game.steps.map(step => `<li>${step}</li>`).join('')}</ol><details><summary>Make it fit both players</summary><p><strong>Ease in.</strong> ${game.easier}</p><p><strong>Add a challenge.</strong> ${game.harder}</p></details><p class="lab-notice"><strong>Notice this.</strong> ${game.notice}</p></div></article>`).join('')}
    </section>
    <section class="lab-reflect" aria-labelledby="reflect-title"><p class="lab-eyebrow">03 / TAKE SOMETHING WITH YOU</p><h2 id="reflect-title">Keep one thing.<br>Change one thing.</h2><div class="lab-reflect-grid"><p><span>01</span>What became more repeatable?</p><p><span>02</span>Which choice changed under pressure?</p><p><span>03</span>Was it fun enough to do again?</p></div><p class="lab-reflect-end">Next time, change one target, feed, or decision rule. Keep the rest familiar.</p></section>
    <footer class="lab-footer"><div><p class="lab-eyebrow">NOTES & NEXT STEPS</p><h2>A practice card,<br>not a promise.</h2><p>These original games and time blocks are adjustable experiments. They do not predict competitive ratings or imply an endorsement by a coach or governing body.</p><p>Drafted with OpenAI Codex; independently reviewed by GPT-6 Astra. Official links checked November 1, 2026 UTC. Coaching-page text was unavailable during this check. The game formats, thresholds, and scoring are our original choices.</p></div><div><h3>Official further reading</h3><ul><li><a href="https://usapickleball.org/pickleball-skills/level-three/pickleball-dink-shots/">USA Pickleball · Dink strategy ↗</a></li><li><a href="https://usapickleball.org/pickleball-skills/level-three/how-to-hit-a-third-shot-drop-in-pickleball/">USA Pickleball · Third-shot drop ↗</a></li><li><a href="https://usapickleball.org/rules/">USA Pickleball · Current rules ↗</a></li></ul><nav aria-label="Keep exploring"><a href="/pickleball/home">More practice ideas ↗</a><a href="/pickleball">Find a South Bay court ↗</a><a href="https://elsegundo.xyz/university/pickleball/">Track an experiment at UES ↗</a><a href="https://elsegundo.xyz/pickleball/practice/">Open the partner game counter ↗</a></nav><p class="lab-small">The timer runs in this tab. This card asks for no personal information and saves no session data.</p></div></footer>
  </div>`;
}
