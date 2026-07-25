import wildflowerReceiver from '../assets/bell-fall-v2/bg-17-wildflower-vase.jpg';
import yellowCarFrequency from '../assets/bell-fall-v2/bg-05-yellow-car.jpg';
import nageireTransmitter from '../assets/bell-fall-v2/bg-10-nageire-vase.png';
import elSegundoHorizon from '../assets/bell-fall-v2/bg-09-el-segundo-skyline.png';

export type HomeSignal = {
  id: string;
  frequency: string;
  channel: 'GDN' | 'ESC';
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
    id: 'wildflower-receiver',
    frequency: 'GDN-17',
    channel: 'GDN',
    title: 'Wildflower receiver',
    note: 'Floral geometry tuned for a quiet first arrival.',
    src: wildflowerReceiver.src,
    alt: 'A slender ikebana arrangement of pink wireframe flowers against a dark brown field',
    color: '#eaff62',
    href: '/showcast/bells-bloom',
    imagePosition: 'center 52%',
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
