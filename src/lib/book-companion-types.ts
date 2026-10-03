export interface ExpansionSource { id: string; label: string; url: string; type: string; note: string }
export interface ExpansionBook {
  resourceType?: 'book' | 'reading-room'; authorCredits?: { name: string; role: 'author' | 'contributor' }[]; attributionLine?: string; copyHeading?: string; copyIntro?: string;
  id: string; shelfNumber: string; title: string; subtitle: string; authors: string[];
  firstPublished: string; firstPublicationNote: string; kind: string; themes: string[];
  theme: string; layout: string; tagline: string; dek: string;
  art: { src: string; alt: string; width: number; height: number; caption: string };
  context: { heading: string; paragraphs: string[]; sourceIds: string[] };
  authorNote: { text: string; sourceIds: string[] };
  entryPoints: { id: string; label: string; title: string; prompt: string }[];
  pathways: { label: string; title: string; text: string }[];
  editions: { id: string; label: string; format: string; publisher: string; isbn: string | null; publicationDate: string | null; pages: number | null; extras: string; why: string; sourceId: string; links: { kind: string; label: string; url: string; note: string }[] }[];
  digitalRoutes: { id: string; label: string; description: string; url: string; rights: string; sourceId: string; type: string }[];
  rightsNote: string; readerNote: string | null;
  deeper: { themes: { title: string; text: string }[]; questions: string[] };
  series: null | { intro: string; items: { title: string; note: string; url: string | null; sourceId: string }[] };
  related: { title: string; url: string; why: string }[];
  sources: ExpansionSource[]; checkedAt: string;
}
