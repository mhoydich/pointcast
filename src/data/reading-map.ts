import feed from './reading-feed.json' with { type: 'json' };
import { buildReadingMapRecords, makeThemeAssignments } from '../lib/reading-map-browser.mjs';

export const readingMapThemes = [
  { id: 'power-money', label: 'Power & money', question: 'Who gets to decide?', note: 'Ambition, institutions and the price of success.', color: 'ochre' },
  { id: 'imagined-worlds', label: 'Imagined worlds', question: 'What else is possible?', note: 'Invented places, adventures and altered realities.', color: 'ink' },
  { id: 'place-identity', label: 'Place & identity', question: 'Where does a life belong?', note: 'Landscape, belonging and the making of a self.', color: 'sage' },
  { id: 'language-attention', label: 'Language & attention', question: 'What changes when we notice?', note: 'Meaning, inward life and the habits of attention.', color: 'sage' },
  { id: 'memoir', label: 'Memoir & lives', question: 'How do we tell a life?', note: 'Personal accounts, biographies and lives in retrospect.', color: 'ochre' },
  { id: 'ideas-systems', label: 'Ideas & systems', question: 'How do things connect?', note: 'Organizations, invention and patterns of change.', color: 'ink' },
  { id: 'open-shelf', label: 'The open shelf', question: 'Keep the question open.', note: 'Titles left ungrouped where a connection is less certain.', color: 'sage' },
] as const;

export type ReadingMapTheme = typeof readingMapThemes[number]['id'];

// One deliberate editorial assignment for every book ID in this snapshot.
// These are reading connections, not ratings, genre declarations or feed fields.
export const manuallyReviewedGroups: Record<ReadingMapTheme, readonly string[]> = {
  'power-money': ['12898', '5139', '10229557', '86174', '100789', '14720', '69571', '22034', '2122', '1171', '1052', '4671', '1869', '1097'],
  'imagined-worlds': ['6310', '234225', '21787', '15881', '472331', '6288', '33', '968', '667', '257149', '295', '2767793', '68429', '68428', '34', '3', '4981', '375802', '5907', '7613', '4980'],
  'place-identity': ['5246', '25905', '5954', '24861', '16631', '77203', '5107', '1845'],
  'language-attention': ['13103', '3431', '52036', '4894', '4865', '2165'],
  'memoir': ['301448', '773858', '6900', '483525', '5558', '6562380', '2265', '25378', '1207904', '296716', '9418327', '11084145', '246468', '823046', '1617'],
  'ideas-systems': ['8517215', '14577509', '5571', '85574', '68143', '6653187', '48731', '1301', '10658', '98233', '2615', '368593', '28815', '3228917', '641604', '113934', '76865', '2612', '1911', '1202'],
  'open-shelf': ['611298', '168642', '21996'],
};

export const readingMapAssignments = makeThemeAssignments(manuallyReviewedGroups);
export const readingMapRecords = buildReadingMapRecords(feed.records, readingMapAssignments);
export const readingMapProvenance = '87 title records from a user-supplied Goodreads RSS snapshot, checked 2026-10-03. Editorial connections, not ratings. This is a manually reviewed snapshot, not a live sync or complete account scan.';
export const readingMapSnapshot = {
  provider: 'Goodreads', checkedAt: '2026-10-03', status: 'manually-reviewed-snapshot',
  recordCount: readingMapRecords.length, provenance: readingMapProvenance,
};

export const readingMapPaths = [
  { id: 'place-choice', label: 'Place & choice', question: 'How does place shape a chosen life?', recordIds: ['5246', '77203', '52036'] },
  { id: 'institutions-agency', label: 'Invented worlds', question: 'How do institutions shape a person’s agency?', recordIds: ['375802', '234225', '68428'] },
  { id: 'useful-connections', label: 'Ideas & systems', question: 'Which conditions make a connection useful?', recordIds: ['48731', '68143', '8517215'] },
] as const;

type ReadingPathRecord = { id: string; title: string; author: string; bookUrl: string; companion: { href: string } | null };
export function readingMapPathsFor(records: readonly ReadingPathRecord[]) {
  return readingMapPaths.map((path) => ({
    id: path.id, label: path.label, question: path.question,
    records: path.recordIds.map((id) => {
      const record = records.find((item) => item.id === id);
      if (!record) throw new Error(`Missing editorial path record: ${id}`);
      return { id: record.id, title: record.title, author: record.author,
        href: record.companion?.href ?? record.bookUrl,
        destination: record.companion ? 'companion' : 'book catalog record' };
    }),
  }));
}

export function readingMapWithCompanions(shelf: readonly { id: string; title: string; author: string; href: string }[]) {
  return buildReadingMapRecords(feed.records, readingMapAssignments, shelf);
}
