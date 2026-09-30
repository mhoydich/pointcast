/** New museum software. Cell values are ATASCII bytes, not Atari screen codes. */
export const COLUMNS = 40;
export const ROWS = 24;
export const NOTES = [
  {
    title: 'A place on the other end',
    body: 'Before a feed was always there, you chose a number and called. One small computer could become a meeting place. This room imagines that feeling, using the Atari character set.',
  },
  {
    title: 'The people behind the names',
    body: 'Mike Hoydich recalls launching Death Star in 1987 with Frank. Their handles were Overlord and Freddie. The detailed story and returning callers live in Mike\'s 2013 WordPress post.',
  },
  {
    title: 'Make a little world',
    body: 'A line, a corner, a filled square. ATASCII gives a small screen a large vocabulary. Our Death Star art and archery game are new works. No original board, messages, or software are being replayed.',
  },
];
export const TARGETS = [3, 5, 2, 4, 3];
export const WINDS = [0, -1, 1, -2, 2];
export function cleanHandle(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9 _-]/g, '').trim().slice(0, 16) || 'VISITOR';
}
export function textBytes(text, inverse = false) {
  return [...String(text).toUpperCase()].map(char => {
    const code = char.charCodeAt(0);
    return (code >= 32 && code <= 95 ? code : 63) + (inverse ? 128 : 0);
  });
}
export function scoreArrow(aim, target, wind) {
  const landed = aim + wind;
  const distance = Math.abs(landed - target);
  return { landed, points: distance === 0 ? 10 : distance === 1 ? 6 : distance === 2 ? 3 : 0 };
}
/** @typedef {{landed: number, points: number}} ArrowShot */
/** @typedef {{round: number, aim: number, score: number, shot: ArrowShot | null, complete: boolean}} ArcheryGame */
/** @returns {ArcheryGame} */
export function freshGame() {
  return { round: 0, aim: 3, score: 0, shot: null, complete: false };
}
/** @param {ArcheryGame} game @returns {ArcheryGame} */
export function fireArrow(game) {
  if (game.shot || game.complete) return game;
  const shot = scoreArrow(game.aim, TARGETS[game.round], WINDS[game.round]);
  return { ...game, score: game.score + shot.points, shot };
}
/** @param {ArcheryGame} game @returns {ArcheryGame} */
export function nextArrow(game) {
  if (!game.shot || game.complete) return game;
  if (game.round === TARGETS.length - 1) return { ...game, complete: true };
  return { ...game, round: game.round + 1, shot: null };
}
export function wrapText(text, width = 34) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if ((line + (line ? ' ' : '') + word).length > width) {
      if (line) lines.push(line);
      line = word;
    } else line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines;
}

export function makeDisplay(state) {
  const cells = Array(COLUMNS * ROWS).fill(32);
  const put = (x, y, text, inverse = false) => {
    if (y < 0 || y >= ROWS) return;
    for (const [i, code] of textBytes(text, inverse).entries()) {
      if (x + i >= 0 && x + i < COLUMNS) cells[y * COLUMNS + x + i] = code;
    }
  };
  const glyph = (x, y, code) => {
    if (x >= 0 && x < COLUMNS && y >= 0 && y < ROWS) cells[y * COLUMNS + x] = code;
  };
  const center = (y, text, inverse = false) => put(Math.floor((COLUMNS - text.length) / 2), y, text, inverse);
  const rule = y => { for (let x = 1; x < 39; x++) glyph(x, y, 18); };
  const box = (x, y, width, height) => {
    for (let dx = 1; dx < width - 1; dx++) { glyph(x + dx, y, 18); glyph(x + dx, y + height - 1, 18); }
    for (let dy = 1; dy < height - 1; dy++) { glyph(x, y + dy, 124); glyph(x + width - 1, y + dy, 124); }
    glyph(x, y, 17); glyph(x + width - 1, y, 5); glyph(x, y + height - 1, 26); glyph(x + width - 1, y + height - 1, 3);
  };
  const paragraph = (y, text, width = 34, x = 3) => wrapText(text, width).forEach((line, i) => put(x, y + i, line));
  const star = (left, top) => {
    // Authored ATASCII art: a round silhouette, surface panels, dish and equator.
    for (let y = 0; y < 13; y++) {
      for (let x = 0; x < 15; x++) {
        const radius = ((x - 7) / 7.3) ** 2 + ((y - 6) / 6.3) ** 2;
        if (radius < 1) glyph(left + x, top + y, 160);
      }
    }
    for (let x = 1; x < 14; x++) glyph(left + x, top + 7, x === 8 ? 160 : 32);
    for (const [x, y] of [[3, 2], [4, 2], [5, 2], [2, 3], [6, 3], [2, 4], [6, 4], [3, 5], [4, 5], [5, 5]]) glyph(left + x, top + y, 32);
    glyph(left + 4, top + 3, 20); glyph(left + 4, top + 4, 32);
    for (const [x,y] of [[10,2], [10,3], [12,4], [8,5], [11,8], [4,9], [5,9], [9,10], [10,10]]) glyph(left+x,top+y,18+128);
    glyph(left - 1, top + 1, 14); glyph(left + 17, top + 3, 20); glyph(left + 16, top + 10, 0);
  };
  for (let x = 0; x < COLUMNS; x++) glyph(x, 0, 160);
  center(0, ' DEATH STAR BBS / MUSEUM ', true);
  center(2, 'ATARI 130XE   /   40 COLUMNS');
  rule(21);
  let title = 'Death Star BBS';
  let readable = '';
  const view = state.view;
  if (view === 'welcome' || view === 'menu' || view === 'offline') {
    star(3, 5);
    if (view === 'menu') {
      put(21, 5, 'MAIN MENU', true);
      const doors = ['B  BULLETINS', 'G  ARCHERY', 'A  GLYPH ROOM', 'I  SYSTEM INFO', 'H  YOUR HANDLE', 'C  THE CLUB', 'Q  HANG UP'];
      doors.forEach((line, i) => put(21, 7 + i * 2, line));
      center(3, `HELLO, ${state.handle}`);
      readable = `Main menu. Hello, ${state.handle}. B: new museum bulletins. G: archery door game. A: ATASCII glyph room. I: system information. H: change your local handle. C: community club. Q: hang up.`;
      center(22, 'PRESS A MENU KEY OR TAP BELOW');
    } else {
      put(22, 6, 'D E A T H'); put(23, 8, 'S T A R'); put(24, 10, 'B B S');
      put(22, 13, '1987 -> 2026');
      put(21, 16, view === 'offline' ? 'NO CARRIER.' : 'A PHONE LINE.');
      put(21, 18, view === 'offline' ? 'COME BACK SOON.' : 'A LITTLE WORLD.');
      center(20, 'NEW ART. REAL ATASCII CHARACTERS.');
      center(22, view === 'offline' ? 'ENTER TO VISIT AGAIN' : 'PRESS ENTER TO DIAL IN', true);
      readable = view === 'offline' ? 'You have left the local BBS recreation. Press Enter to visit again.' : 'Death Star BBS. A new reconstruction, with newly drawn Death Star character art using the real Atari character set. Press Enter to begin a local museum visit. No network connection or account is created.';
    }
  } else if (view === 'bulletins') {
    const note = NOTES[state.note];
    title = `Museum bulletin ${state.note + 1} of ${NOTES.length}`;
    box(1, 4, 38, 16);
    put(3, 5, `MUSEUM NOTE 00${state.note + 1} / 2026`, true);
    paragraph(7, note.title);
    paragraph(10, note.body);
    put(3, 18, 'NEW WRITING BY CODEX. NOT A LOG.');
    center(22, 'P PREVIOUS   N NEXT   ESC MENU');
    readable = `${title}. ${note.title}. ${note.body} These are newly authored museum notes by Codex, not archived messages. P for previous, N for next, Escape for main menu.`;
  } else if (view === 'info') {
    title = 'System information';
    center(4, 'THEN / AS MIKE REMEMBERS IT', true);
    ['1987: DEATH STAR COMES ONLINE.', 'SYSOPS: OVERLORD AND FREDDIE.', 'ATARI 130XE. 300 BAUD. FOREM.', 'LESS THAN 1 MB OF STORAGE.'].forEach((line,i) => put(3,6+i,line));
    center(12, 'NOW / THE MUSEUM RECONSTRUCTION', true);
    paragraph(14, 'A real ATASCII glyph atlas. New art, notes and game. No recovered BBS code. Nothing is sent to the old board.');
    put(3, 19, 'SOURCE: MIKE\'S 2013 WORDPRESS POST.');
    center(22, 'O ORIGINAL POST   ESC MAIN MENU');
    readable = 'Historical setup according to Mike Hoydich’s 2013 WordPress post: Death Star launched in 1987, with Overlord and Freddie, an Atari 130XE, 300 baud, FoReM, and less than 1 MB of storage. This is new browser software with a real ATASCII glyph atlas. Original software is not running. An alternate founder bio lists 1988 and 2400 baud; see the museum source notes for that unresolved difference. O opens the original post, Escape returns to the menu.';
  } else if (view === 'glyphs') {
    title = 'ATASCII glyph room';
    center(4, '128 CHARACTERS. A WHOLE VOCABULARY.', true);
    for (let code = 0; code < 128; code++) glyph(4 + (code % 16) * 2, 6 + Math.floor(code / 16), code);
    box(3, 15, 34, 3); put(7, 16, 'INVERSE IS ANOTHER WORLD', true);
    [0, 16, 96, 123, 20, 21, 25, 28, 29, 30, 31].forEach((code,i) => glyph(8+i*2, 19, code));
    center(22, '8 X 8 GLYPHS   /   ESC MAIN MENU');
    readable = 'ATASCII glyph room. All 128 normal character cells are shown, followed by an inverse-text panel, suits, circle, half blocks and arrows. Each glyph is an eight-by-eight pixel bitmap. Image by Kim Slawson, corrected by Dpla-fr, CC0. Escape returns to the menu.';
  } else if (view === 'handle') {
    title = 'Your local handle';
    box(3, 6, 34, 12);
    center(8, 'WHAT SHOULD WE CALL YOU?', true);
    center(11, state.handle);
    paragraph(14, 'Use the field below. Up to 16 letters, numbers, spaces, - or _. Saved in this browser only.', 30, 5);
    center(22, 'NO ACCOUNT. NO PUBLIC PROFILE.');
    readable = 'Choose a local handle using the form below. Up to 16 letters, numbers, spaces, hyphens or underscores. Stored only in this browser when storage is available. This does not create a public account. Escape cancels.';
  } else if (view === 'game') {
    const game = state.game;
    title = 'Archery door game';
    const target = TARGETS[game.round];
    const wind = WINDS[game.round];
    center(3, 'THE ARCHERY DOOR / NEW MUSEUM GAME', true);
    put(2,5, `ARROW ${game.round+1}/5`); put(26,5, `SCORE ${String(game.score).padStart(2,'0')}/50`);
    put(2,7, `AIM ${game.aim+1}`); put(15,7, `TARGET ${target+1}`); put(29,7, `WIND ${wind >= 0 ? '+' : ''}${wind}`);
    for (let y = 0; y < 7; y++) {
      put(3, 10+y, String(y+1));
      glyph(6, 10+y, y === game.aim ? 4 : 124);
      const distance = Math.abs(y-target);
      glyph(33,10+y,distance===0 ? 20 : distance===1 ? 160 : distance===2 ? 25 : 124);
    }
    put(6,18,'BOW'); put(29,18,'TARGET');
    if (game.shot && game.shot.landed >= 0 && game.shot.landed < 7) {
      for (let x = 8; x < 33; x++) glyph(x,10+game.shot.landed,18);
      glyph(32,10+game.shot.landed,31);
    } else if (!game.shot) glyph(8,10+game.aim,31);
    const result = game.shot ? `${game.shot.points === 10 ? 'BULLSEYE!' : game.shot.points ? 'ON THE TARGET.' : 'WIDE OF THE TARGET.'} +${game.shot.points}` : 'WIND SHIFTS YOUR ARROW UP (-) / DOWN (+)';
    center(20, game.complete ? `ROUND COMPLETE. ${game.score} / 50 POINTS.` : result);
    center(22, game.complete ? 'R PLAY AGAIN  /  ESC MENU' : game.shot ? (game.round===4 ? 'ENTER TO SEE YOUR TOTAL' : 'ENTER FOR THE NEXT ARROW') : 'UP/DOWN AIM  /  SPACE FIRE  /  ESC MENU');
    const best = state.best === null ? '' : ` Best in this browser: ${state.best} of 50.`;
    readable = game.complete ? `Archery complete. You scored ${game.score} of 50.${best} R plays again. Escape returns to the main menu.` : `Arrow ${game.round+1} of 5. Aim row ${game.aim+1}, target row ${target+1}, wind ${wind >= 0 ? '+' : ''}${wind}. Negative wind moves up, positive moves down. ${game.shot ? `Shot scored ${game.shot.points} points. Total ${game.score}. Press Enter to continue.` : 'Use Up and Down to aim, then Space to fire. You need aim plus wind to equal the target row.'} Escape returns to the main menu.`;
  }
  center(23, 'LOCAL RECONSTRUCTION / NOT ORIGINAL CODE');
  return { cells, title, readable };
}
