import HUNDRED from '../data/nouns-money-hundred.json';
import EVERYDAY from '../data/nouns-money-editions.json';
import FLOWERS from '../data/nouns-money-flowers.json';
import DIMENSIONS from '../data/nouns-money-app-dimensions.json';
import { NOTE_DESIGNS, NORDIC_STUDIES } from './nouns-money';
import { buildCatalog } from './nouns-money-app-model.mjs';
const order = ['flowers','nordic','originals','everyday','studies'];
export const APP_CATALOG = buildCatalog({hundred:HUNDRED, originals:NOTE_DESIGNS, studies:NORDIC_STUDIES, everyday:EVERYDAY, flowers:FLOWERS.catalog}).map(art=>{const d=DIMENSIONS[art.id];if(!d)throw new Error(`Unmeasured artwork: ${art.id}`);return {...art,width:d.width,height:d.height};}).sort((a,b)=>order.indexOf(a.seriesKey)-order.indexOf(b.seriesKey));
export const APP_SERIES = [
  {key:'flowers',title:'Flower Studies',subtitle:'2026 · notes, stamps & medallions'},
  {key:'nordic',title:'Nordic / 2027',subtitle:'100 exact-source Noun designs'},
  {key:'originals',title:'The Original Ten',subtitle:'Collection 01 / 2026'},
  {key:'everyday',title:'Everyday / 2028',subtitle:'50 exact-source editions'},
  {key:'studies',title:'Nordic Studies',subtitle:'14 generated visual studies'}
];
export const APP_DISCLOSURE = 'A personal art catalog and local design prototype. Collectible art, never legal tender. Favorites record preferences, not ownership. Decorative stamps have no postal value. No purchasing, minting, redemption or financial participation is enabled.';
