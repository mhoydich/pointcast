import nounSharedPulse from '../assets/campaigns/pointcast-drum-noun-universe/115-rooms-one-shared-pulse.webp';
import yellowCarFrequency from '../assets/bell-fall-v2/bg-05-yellow-car.jpg';
import nageireTransmitter from '../assets/bell-fall-v2/bg-10-nageire-vase.png';
import elSegundoHorizon from '../assets/bell-fall-v2/bg-09-el-segundo-skyline.png';

export type HomeSignal = {
  id: string;
  frequency: string;
  channel: 'NOUN' | 'GDN' | 'ESC';
  title: string;
  note: string;
  src: string;
  alt: string;
  color: string;
  href: string;
  imagePosition: string;
};

export const HOME_SIGNALS: HomeSignal[] = [
  {
    id: 'noun-shared-pulse',
    frequency: 'NOUN-115',
    channel: 'NOUN',
    title: 'Noun shared pulse',
    note: 'One bright Noun drummer routes a shared pulse through 115 playful rooms.',
    src: nounSharedPulse.src,
    alt: 'Bright illustrated Noun drummer connecting an arcade, radio tower, bell shrine, theater, and music machines',
    color: '#ffd43b',
    href: '/drum-press',
    imagePosition: 'center 44%',
  },
  {
    id: 'yellow-car-frequency',
    frequency: 'ESC-05',
    channel: 'ESC',
    title: 'Yellow car frequency',
    note: 'A bright local carrier moving through the watercolor street.',
    src: yellowCarFrequency.src,
    alt: 'A yellow car parked on a pale blue watercolor street in El Segundo',
    color: '#ef5da8',
    href: '/showcast/bells-bloom',
    imagePosition: 'center center',
  },
  {
    id: 'nageire-transmitter',
    frequency: 'GDN-10',
    channel: 'GDN',
    title: 'Nageire transmitter',
    note: 'Loose stems, tall vessel, soft signal with room to breathe.',
    src: nageireTransmitter.src,
    alt: 'A loose nageire-style floral arrangement in a tall vessel',
    color: '#73e6d2',
    href: '/showcast/bells-bloom',
    imagePosition: 'center 46%',
  },
  {
    id: 'el-segundo-horizon',
    frequency: 'ESC-09',
    channel: 'ESC',
    title: 'El Segundo horizon',
    note: 'A civic frequency carried from the coast into the imagined skyline.',
    src: elSegundoHorizon.src,
    alt: 'An imagined El Segundo skyline rendered as a bright field image',
    color: '#ffb25b',
    href: '/network-el-segundo',
    imagePosition: 'center center',
  },
];
