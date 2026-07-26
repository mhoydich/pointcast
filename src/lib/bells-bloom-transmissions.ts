export type BellsBloomTransmission = {
  id: string;
  title: string;
  publishAt: string;
  dateLabel: string;
  image: string;
  alt: string;
};

export const BELLS_BLOOM_SHOWCAST_HREF = '/showcast/bells-bloom';
export const BELLS_BLOOM_MANIFEST_HREF = '/showcast/bells-bloom.json';
export const BELLS_BLOOM_ARCHIVE_AT = '2026-08-02T00:00:00-07:00';

export const BELLS_BLOOM_TRANSMISSIONS: readonly BellsBloomTransmission[] = [
  {
    id: '01',
    title: 'Signal Garden',
    publishAt: '2026-07-26T08:08:00-07:00',
    dateLabel: 'Sun · Jul 26',
    image: '/showcast/bells-bloom/assets/01-signal-garden.jpg',
    alt: 'Signal Garden: a white bell silhouette and vivid flowers over lavender, yellow, green, and blue geometry',
  },
  {
    id: '04',
    title: 'Rose Bell',
    publishAt: '2026-07-27T08:08:00-07:00',
    dateLabel: 'Mon · Jul 27',
    image: '/showcast/bells-bloom/assets/04-rose-bell.jpg',
    alt: 'Rose Bell: a vivid pink bell and loose rose stems on a textured dark green field',
  },
  {
    id: '09',
    title: 'Orbital Vase',
    publishAt: '2026-07-28T08:08:00-07:00',
    dateLabel: 'Tue · Jul 28',
    image: '/showcast/bells-bloom/assets/09-orbital-vase.jpg',
    alt: 'Orbital Vase: a round blue and violet floral vessel inside a modernist grid',
  },
  {
    id: '12',
    title: 'Soft Chime',
    publishAt: '2026-07-29T08:08:00-07:00',
    dateLabel: 'Wed · Jul 29',
    image: '/showcast/bells-bloom/assets/12-soft-chime.jpg',
    alt: 'Soft Chime: a monumental domed bell built from translucent lavender, mint, yellow, and blue rectangles',
  },
  {
    id: '17',
    title: 'Turquoise Bell, Wild Stem',
    publishAt: '2026-07-30T08:08:00-07:00',
    dateLabel: 'Thu · Jul 30',
    image: '/showcast/bells-bloom/assets/17-turquoise-bell.jpg',
    alt: 'Turquoise Bell, Wild Stem: turquoise, ultramarine, green, and lavender geometry arranged around a white bell',
  },
  {
    id: '22',
    title: 'Glitch Bell, Orange Stem',
    publishAt: '2026-07-31T08:08:00-07:00',
    dateLabel: 'Fri · Jul 31',
    image: '/showcast/bells-bloom/assets/22-glitch-bell-orange-stem.jpg',
    alt: 'Glitch Bell, Orange Stem: a translucent blue bell interrupted by orange and pink flowers and analog glitch marks',
  },
  {
    id: '28',
    title: 'After Hours Lamp',
    publishAt: '2026-08-01T08:08:00-07:00',
    dateLabel: 'Sat · Aug 1',
    image: '/showcast/bells-bloom/assets/28-after-hours-lamp.jpg',
    alt: 'After Hours Lamp: a dark green mushroom lamp and coral glow on a warm salmon print field',
  },
];

export function getBellsBloomTransmission(
  now: Date = new Date(),
): BellsBloomTransmission {
  const nowTime = now.getTime();
  let active = BELLS_BLOOM_TRANSMISSIONS[0];

  for (const transmission of BELLS_BLOOM_TRANSMISSIONS) {
    if (Date.parse(transmission.publishAt) > nowTime) break;
    active = transmission;
  }

  return active;
}

export function isBellsBloomArchive(now: Date = new Date()): boolean {
  return now.getTime() >= Date.parse(BELLS_BLOOM_ARCHIVE_AT);
}
