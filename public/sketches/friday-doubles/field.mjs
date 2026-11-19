function readCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (character === '\r' || character === '\n')) {
      if (character === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error('Unclosed CSV field');
  if (row.length || cell) rows.push([...row, cell]);
  return rows;
}

const details = document.querySelector('#invite-list');
const pairs = document.querySelector('#pairs');
const status = document.querySelector('#pool-status');
const skills = new Set(['3.0', '3.5', '4.0', '4.5', '5.0']);
const missingNames = new Set(['', 'unavailable', 'left out by request', 'a player who asked to be left out', 'singles']);

async function loadPlayers() {
  if (!details.open) return;
  details.removeEventListener('toggle', loadPlayers);
  status.textContent = 'Loading competition results…';
  try {
    const response = await fetch('/pickleball/rankings/results.csv', { credentials: 'omit' });
    if (!response.ok) throw new Error('Results unavailable');
    const [headers, ...rows] = readCsv(await response.text());
    const required = ['event_id', 'category', 'age_bracket', 'skill_level', 'place', 'player_1', 'player_2'];
    if (!required.every(key => headers?.includes(key))) throw new Error('Missing result columns');
    const columns = Object.fromEntries(required.map(key => [key, headers.indexOf(key)]));
    const teams = [];
    const people = new Set();
    for (const row of rows) {
      const skill = row[columns.skill_level];
      const place = row[columns.place];
      if (row[columns.event_id] !== 'capa-oc-champ-2026' || row[columns.category] !== 'mixed' ||
          row[columns.age_bracket] !== '35+' || !skills.has(skill) || !['1', '2'].includes(place)) continue;
      const names = [row[columns.player_1], row[columns.player_2]]
        .map(name => (name || '').trim())
        .filter(name => !missingNames.has(name.toLowerCase()));
      if (!names.length) continue;
      names.forEach(name => people.add(name));
      teams.push({ skill, place, names });
    }
    teams.sort((a, b) => Number(a.skill) - Number(b.skill) || Number(a.place) - Number(b.place));
    for (const team of teams) {
      const item = document.createElement('li');
      item.textContent = [team.skill, team.place === '1' ? 'Gold' : 'Silver', team.names.join(' & ')].join(' · ');
      pairs.append(item);
    }
    status.textContent = people.size
      ? people.size + (people.size === 1 ? ' name' : ' names') + ' listed in the public competition results.'
      : 'No matching names are currently listed in the public competition results.';
  } catch {
    status.textContent = 'Competition results could not be loaded. The organizer’s bracket is linked below.';
  }
}

details.addEventListener('toggle', loadPlayers);
if (details.open) loadPlayers();
