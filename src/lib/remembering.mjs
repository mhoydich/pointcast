export const remembranceCards = [
  { id: 'thinking', title: 'Thinking of you', label: 'A little companionship', message: 'Holding you in my thoughts today. No words or reply are needed.' },
  { id: 'remember', title: 'Their name matters', label: 'For a life remembered', message: 'Remembering the ways one life can touch so many others.' },
  { id: 'memory', title: 'A shared memory', label: 'Something to keep close', message: 'There is a memory I would like to keep here, with love.' },
  { id: 'day', title: 'On a difficult day', label: 'Room for every feeling', message: 'You do not have to make this day feel any particular way. There is room for you here.' },
  { id: 'love', title: 'Love remains', label: 'When words are hard', message: 'There is room here for love, sorrow, gratitude, and everything you cannot yet name.' },
  { id: 'prayer', title: 'A prayer for comfort', label: 'A gentle blessing', message: 'May you find gentleness around you, rest when you need it, and companionship through the days ahead.' },
];

export const remembranceOccasions = [
  { id: 'loss', label: 'A loss' },
  { id: 'anniversary', label: 'An anniversary of remembrance' },
  { id: 'birthday', label: 'A birthday in remembrance' },
  { id: 'thinking', label: 'Thinking of you today' },
];

export const remembranceIntents = [
  { id: 'companionship', label: 'Companionship', message: 'I am thinking of you. There is no need to reply.' },
  { id: 'remember', label: 'Remember together', message: 'Holding this memory with you. There is no need to reply.' },
  { id: 'comfort', label: 'Offer comfort', message: 'Sending care and wishing you moments of comfort. There is no need to reply.' },
];

/** The exact plain text the visitor previews, copies or deliberately shares. */
export function buildRemembranceText(cardId, name = '', memory = '', occasionId = '', intentId = '') {
  const card = remembranceCards.find((item) => item.id === cardId) || remembranceCards[0];
  const cleanName = String(name).trim().slice(0, 80);
  const cleanMemory = String(memory).trim().slice(0, 1200);
  const occasion = remembranceOccasions.find((item) => item.id === occasionId);
  const intent = remembranceIntents.find((item) => item.id === intentId);
  return [card.title, occasion?.label || '', cleanName ? `Remembering ${cleanName}` : '', card.message, intent?.message || '', cleanMemory, 'Made with care · PointCast', 'https://pointcast.xyz/remembering/'].filter(Boolean).join('\n\n');
}

/** Wrap every character, including long unbroken words, without truncation. */
export function wrapRemembranceText(text, measure, maxWidth) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const character of paragraph) {
      if (line && measure(line + character) > maxWidth) {
        const space = line.lastIndexOf(' ');
        if (space >= 0 && space < line.length - 1) {
          lines.push(line.slice(0, space + 1));
          line = line.slice(space + 1);
        } else {
          lines.push(line);
          line = '';
        }
      }
      line += character;
    }
    lines.push(line);
  }
  return lines;
}

/** Reflow whitespace while keeping every non-whitespace character in the image. */
export function reflowRemembranceForImage(text) {
  const paragraphs = text.split(/\n\s*\n/u).map((part) => part.replace(/\s+/gu, ' ').trim()).filter(Boolean);
  if (paragraphs.length <= 12) return paragraphs.join('\n\n');
  return [...paragraphs.slice(0, 11), paragraphs.slice(11).join(' ')].join('\n\n');
}
