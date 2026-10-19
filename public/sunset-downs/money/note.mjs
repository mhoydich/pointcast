export const EDITIONS = Object.freeze([
  { id: 'silver-screen', code: 'SS', name: 'Silver Screen', role: 'The comeback', line: 'The camera still loves a closer.', color: '#c6c9bc' },
  { id: 'velvet-alibi', code: 'VA', name: 'Velvet Alibi', role: 'The beautiful problem', line: 'An impeccable entrance. An inconvenient past.', color: '#b78b9e' },
  { id: 'nepo-baby', code: 'NB', name: 'Nepo Baby', role: 'The gilded favorite', line: 'Born on third. Racing for the last word.', color: '#dbbd6e' },
  { id: 'final-cut', code: 'FC', name: 'Final Cut', role: 'The ruthless editor', line: 'Everything unnecessary gets left behind.', color: '#8aafa8' },
  { id: 'stunt-double', code: 'SD', name: 'Stunt Double', role: 'The working hero', line: 'Does the dangerous part. Never gets the close-up.', color: '#c58c73' },
  { id: 'golden-hour', code: 'GH', name: 'Golden Hour', role: 'The last romantic', line: 'Some things are worth chasing into the sunset.', color: '#ddaa6d' },
].map(Object.freeze));
export const DENOMINATIONS = Object.freeze([10, 50, 100]);
export function stableCredit(value) {
  return Array.from(String(value ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').trim()).slice(0, 36).join('') || 'THE SUNSET SYNDICATE';
}
export const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
export function designId(id, denomination) {
  const edition = EDITIONS.find(item => item.id === id);
  if (!edition || !DENOMINATIONS.includes(denomination)) throw new Error('Choose a Studio Scrip edition and a 10, 50 or 100 numeral.');
  return `SD-${edition.code}-${String(denomination).padStart(3, '0')}-01`;
}
export function renderNote(id, denomination, owner, portrait) {
  const serial = designId(id, denomination);
  const edition = EDITIONS.find(item => item.id === id);
  if (typeof portrait !== 'string' || !portrait.startsWith('<svg ') || !portrait.endsWith('</svg>') || /<(?:script|foreignObject|image|use)\b|\bon\w+\s*=|(?:href|url)\s*[=(]/i.test(portrait)) throw new Error('An original Nouns SVG portrait is required.');
  const ink = denomination === 50 ? '#572e3e' : '#102a24';
  const paper = denomination === 100 ? '#e7d7b4' : '#f2eadd';
  const credit = escapeXml(stableCredit(owner));
  const line = escapeXml(edition.line);
  const portraitUri = `data:image/svg+xml,${encodeURIComponent(portrait).replace(/'/g, '%27')}`;
  const waves = Array.from({length: 17}, (_, i) => `<ellipse cx="1395" cy="334" rx="${202+i*6}" ry="${201-i*6}" fill="none" stroke="${ink}" stroke-width="1.2" opacity=".15"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="180mm" height="70mm" viewBox="0 0 1800 700" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(edition.name)} · ${denomination} Studio Scrip · collectible art</title><desc id="desc">Sunset Downs collectible art note credited to ${credit}. Prop scrip. No cash value. Reprintable design ${serial}.</desc>
<metadata>Original Nouns layers, CC0 artwork. Seed and source checksum: https://pointcast.xyz/sunset-downs/art/nouns/manifest.json . Local seed selection is not a minted Noun ID. Independent PointCast art; no Nouns DAO endorsement.</metadata>
<rect width="1800" height="700" fill="${paper}"/><rect x="15" y="15" width="1770" height="670" fill="none" stroke="${ink}" stroke-width="6"/><rect x="28" y="28" width="1744" height="644" fill="none" stroke="${ink}" stroke-width="1"/>
<path d="M65 120H1735M65 589H1735M1043 150V556" fill="none" stroke="${ink}" stroke-width="1" opacity=".65"/>
<g fill="${ink}" font-family="Arial,Helvetica,sans-serif"><text x="66" y="82" font-size="20" letter-spacing="5">POINTCAST PICTURES · ART DEPARTMENT</text><text x="1732" y="82" text-anchor="end" font-size="20" letter-spacing="4">STUDIO SCRIP / SERIES 01</text></g>
<g fill="${ink}"><text x="67" y="234" font-family="Georgia,'Times New Roman',serif" font-size="90" letter-spacing="-3">SUNSET DOWNS</text><text x="73" y="288" font-family="Arial,Helvetica,sans-serif" font-size="18" letter-spacing="7">A LITTLE FORTUNE. A VERY GOOD STORY.</text>
<text x="72" y="449" font-family="Georgia,'Times New Roman',serif" font-size="166" letter-spacing="-8">${denomination}</text><text x="${denomination === 100 ? 371 : 280}" y="416" font-family="Arial,Helvetica,sans-serif" font-size="19" letter-spacing="5">PROP SCRIP</text><text x="${denomination === 100 ? 371 : 280}" y="448" font-family="Arial,Helvetica,sans-serif" font-size="18">COLLECTIBLE ART · NO CASH VALUE</text>
<text x="76" y="512" font-family="Georgia,'Times New Roman',serif" font-size="26" font-style="italic">${line}</text><text x="76" y="558" font-family="Arial,Helvetica,sans-serif" font-size="17" letter-spacing="1">STABLE CREDIT · ${credit}</text></g>
${waves}<ellipse cx="1396" cy="347" rx="229" ry="219" fill="${edition.color}" fill-opacity=".45"/><image x="1196" y="134" width="400" height="400" href="${portraitUri}" image-rendering="pixelated"/>
<g fill="${ink}" font-family="Arial,Helvetica,sans-serif"><text x="1395" y="567" text-anchor="middle" font-size="21" letter-spacing="4">${escapeXml(edition.name.toUpperCase())}</text><text x="76" y="631" font-size="17" letter-spacing="2">DESIGN ${serial} · REPRINTABLE</text><text x="1395" y="631" text-anchor="middle" font-size="15" letter-spacing="2">NOUNS ORIGINAL ART / CC0</text><text x="1731" y="631" text-anchor="end" font-size="27">${denomination}</text></g>
</svg>`;
}
