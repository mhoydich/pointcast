/**
 * Signature Studio: one catalog for the page, the JSON twin and the tests.
 * Licenses are the ones in public/signature/fonts (OFL or Apache-2.0).
 * Paths are extracted outlines, so the page can draw real vectors without
 * fetching a font file at view time.
 */

export const BLOCK = '0765';
export const PATH = '/signature';
export const HISTORY_PATH = '/signature/history';

export const NOT_LEGAL =
  'This is not a legally binding e-signature service, not a notary, and not proof of who you are.';

export const HONESTY = 'devnet · no value · may reset';

export type SignatureFont = {
  id: string;
  family: string;
  license: 'OFL-1.1' | 'Apache-2.0';
  /** The copyright line on the license file shipped beside the font. */
  credit: string;
  file: string;
  paths: string;
  note: string;
};

export const FONTS: SignatureFont[] = [
  {
    id: 'pointcast-script',
    family: 'PointCast Script',
    license: 'OFL-1.1',
    credit: 'Copyright 2026 PointCast, with Reserved Font Name “PointCast Script”.',
    file: '/signature/fonts/pointcast-script/PointCastScript.ttf',
    paths: '/signature/paths/pointcast-script.json',
    note: 'An original face drawn for this studio. Glyphs live in scripts/signature/glyphs.mjs.',
  },
  {
    id: 'dancing-script',
    family: 'Dancing Script',
    license: 'OFL-1.1',
    credit: 'Copyright 2016 The Dancing Script Project Authors, with Reserved Font Name “Dancing Script”.',
    file: '/signature/fonts/dancing-script/DancingScript-wght.ttf',
    paths: '/signature/paths/dancing-script.json',
    note: 'SIL Open Font License. The file is a variable font. These outlines are the regular master, weight 400.',
  },
  {
    id: 'great-vibes',
    family: 'Great Vibes',
    license: 'OFL-1.1',
    credit: 'Copyright 2015 The Great Vibes Pro Project Authors.',
    file: '/signature/fonts/great-vibes/GreatVibes-Regular.ttf',
    paths: '/signature/paths/great-vibes.json',
    note: 'SIL Open Font License. Regular.',
  },
  {
    id: 'allura',
    family: 'Allura',
    license: 'OFL-1.1',
    credit: 'Copyright 2010 The Allura Project Authors.',
    file: '/signature/fonts/allura/Allura-Regular.ttf',
    paths: '/signature/paths/allura.json',
    note: 'SIL Open Font License. Regular.',
  },
  {
    id: 'sacramento',
    family: 'Sacramento',
    license: 'OFL-1.1',
    credit: 'Copyright 2012 Brian J. Bonislawsky DBA Astigmatic, with Reserved Font Name “Sacramento”.',
    file: '/signature/fonts/sacramento/Sacramento-Regular.ttf',
    paths: '/signature/paths/sacramento.json',
    note: 'SIL Open Font License. Regular.',
  },
  {
    id: 'mrs-saint-delafield',
    family: 'Mrs Saint Delafield',
    license: 'OFL-1.1',
    credit: 'Copyright 2011 Alejandro Paul, with Reserved Font Name “Mrs Saint Delafield”.',
    file: '/signature/fonts/mrs-saint-delafield/MrsSaintDelafield-Regular.ttf',
    paths: '/signature/paths/mrs-saint-delafield.json',
    note: 'SIL Open Font License. Regular.',
  },
  {
    id: 'herr-von-muellerhoff',
    family: 'Herr Von Muellerhoff',
    license: 'OFL-1.1',
    credit: 'Copyright 2011 Alejandro Paul, with Reserved Font Name “Herr Von Muellerhoff”.',
    file: '/signature/fonts/herr-von-muellerhoff/HerrVonMuellerhoff-Regular.ttf',
    paths: '/signature/paths/herr-von-muellerhoff.json',
    note: 'SIL Open Font License. Regular.',
  },
  {
    id: 'homemade-apple',
    family: 'Homemade Apple',
    license: 'Apache-2.0',
    credit: 'Copyright 2010 Font Diner, Inc.',
    file: '/signature/fonts/homemade-apple/HomemadeApple-Regular.ttf',
    paths: '/signature/paths/homemade-apple.json',
    note: 'Apache License 2.0, not the SIL Open Font License. The LICENSE.txt beside the file is the grant.',
  },
];

export const fontById = (id: string) => FONTS.find((f) => f.id === id);

export const MEANINGS = [
  { id: 'mark', title: 'A mark', does: 'Shows a shape someone made or chose: typed in a font, drawn, or uploaded.' },
  { id: 'integrity', title: 'Integrity', does: 'A SHA-256 of the exported PNG. If one byte of that file changes, the hash changes. It does not say who made the file.' },
  { id: 'key', title: 'A key', does: 'An ed25519 signature over a statement and that hash. It shows the holder of a private key signed those exact bytes. It does not show who that person is.' },
  { id: 'time', title: 'A time on one server', does: 'A signed post on the PointCast devnet is sealed into a block with that server’s clock. devnet · no value · may reset. It is not a legal timestamp and it is not anchored to another chain.' },
  { id: 'law', title: 'A legal signature', does: 'Statutes such as the US ESIGN Act and UETA can give effect to an electronic signature when intent, agreement, attribution and retention are met. This page does not do those things. It is not a notary and not an e-signature service.' },
] as const;

export const EDITION_GAP = [
  'An edition mint on this devnet is a different transaction from a post. edition_mint carries a recipe and an approval signature from the edition’s attestor. The public devnet’s editions list, GET /editions, currently has one edition, daily-mint, and its mints are approved by the house attestor. Signature Studio cannot produce that approval, and it will not pretend a post is a mint.',
  'To mint a signature as an edition you would need: an open_edition from the editions admin whose recipe is short enough for the chain (the PNG’s SHA-256, or a small SVG), either no attestor or an attestor that will sign approval_digest for the visitor’s key, and a renderer hash the terms commit to. Until that edition exists, Record writes a signature/v1 post on the ART channel, which the house holds open.',
].join(' ');
