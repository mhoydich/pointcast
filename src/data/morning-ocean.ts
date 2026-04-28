export interface MorningOceanToken {
  tokenId: number;
  slug: string;
  title: string;
  vessel: string;
  celestial: string;
  horizon: string;
  mood: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';
  editionSize: number;
  imageUrl: string;
  palette: {
    sky: string;
    water: string;
    accent: string;
    ink: string;
  };
  prompt: string;
}

export const MORNING_OCEAN_STYLE_PROMPT =
  'Morning Ocean collectible NFT art series, quiet luxury maritime oil-painting cards, woven canvas texture, calm horizon, boats in the background, soft sun and planets, sophisticated palette, no text.';

const token = (
  tokenId: number,
  slug: string,
  title: string,
  vessel: string,
  celestial: string,
  horizon: string,
  mood: string,
  rarity: MorningOceanToken['rarity'],
  editionSize: number,
  palette: MorningOceanToken['palette'],
): MorningOceanToken => ({
  tokenId,
  slug,
  title,
  vessel,
  celestial,
  horizon,
  mood,
  rarity,
  editionSize,
  imageUrl: `/images/morning-ocean/tokens/${String(tokenId).padStart(2, '0')}-${slug}.png`,
  palette,
  prompt:
    `${MORNING_OCEAN_STYLE_PROMPT} Token ${tokenId}: ${title}. ` +
    `Vessel: ${vessel}. Sky object: ${celestial}. Horizon: ${horizon}. Mood: ${mood}.`,
});

export const MORNING_OCEAN_TOKENS: readonly MorningOceanToken[] = [
  token(1, 'sun-tanker', 'Sun Tanker', 'long oil tanker', 'low gold sun', 'sheltered Pacific inlet', 'earned calm at first light', 'rare', 44, {
    sky: '#e8bc86',
    water: '#53778a',
    accent: '#d26b43',
    ink: '#1b2830',
  }),
  token(2, 'silver-sail', 'Silver Sail', 'single white sailboat', 'silver sun through marine haze', 'island channel', 'slow confidence', 'uncommon', 88, {
    sky: '#d7d2be',
    water: '#6f8891',
    accent: '#f0d6a3',
    ink: '#243744',
  }),
  token(3, 'red-tug-moon', 'Red Tug Moon', 'working harbor tug', 'white morning moon', 'fjord cliffs', 'useful power kept quiet', 'rare', 44, {
    sky: '#b9c6c4',
    water: '#456779',
    accent: '#c7563b',
    ink: '#142638',
  }),
  token(4, 'pearl-fishing-boat', 'Pearl Fishing Boat', 'wooden fishing boat', 'pearl planet', 'open bay', 'patient navigation', 'common', 144, {
    sky: '#d9c5a8',
    water: '#58798a',
    accent: '#eee2c9',
    ink: '#25323a',
  }),
  token(5, 'research-morning', 'Research Morning', 'white research vessel', 'pale sun', 'blue mountain passage', 'clear observation', 'rare', 44, {
    sky: '#d4c3a8',
    water: '#5f7c8b',
    accent: '#f2ead7',
    ink: '#21303b',
  }),
  token(6, 'distant-freighter', 'Distant Freighter', 'far freighter', 'rose sun', 'flowered coastline', 'quiet scale', 'uncommon', 88, {
    sky: '#e2aa96',
    water: '#5d7683',
    accent: '#d46f54',
    ink: '#1c2c35',
  }),
  token(7, 'palm-catamaran', 'Palm Catamaran', 'anchored catamaran', 'honey sun', 'tropical harbor', 'soft arrival', 'rare', 44, {
    sky: '#e5be98',
    water: '#607d86',
    accent: '#c97d58',
    ink: '#17343a',
  }),
  token(8, 'champagne-yacht', 'Champagne Yacht', 'low luxury yacht', 'champagne sun', 'rock garden coast', 'polished drift', 'epic', 24, {
    sky: '#e7b693',
    water: '#526f80',
    accent: '#dfb15f',
    ink: '#1b2e3b',
  }),
  token(9, 'harbor-ferry', 'Harbor Ferry', 'morning passenger ferry', 'orange sun', 'dawn commuter line', 'gentle momentum', 'uncommon', 88, {
    sky: '#e6b284',
    water: '#587a85',
    accent: '#db7c4c',
    ink: '#20333c',
  }),
  token(10, 'blue-tug', 'Blue Tug', 'small blue tug', 'faint star', 'blue hour harbor', 'work before the city wakes', 'common', 144, {
    sky: '#91a5ad',
    water: '#345f76',
    accent: '#d06a49',
    ink: '#102a39',
  }),
  token(11, 'crescent-rowboat', 'Crescent Rowboat', 'empty wooden rowboat', 'thin crescent moon', 'still cove', 'held silence', 'rare', 44, {
    sky: '#b6a58e',
    water: '#527487',
    accent: '#f3d6a4',
    ink: '#192c36',
  }),
  token(12, 'patrol-vessel', 'Patrol Vessel', 'gray patrol vessel', 'clouded sun', 'stone point', 'watchful steadiness', 'uncommon', 88, {
    sky: '#d3c2aa',
    water: '#647d86',
    accent: '#eee5cd',
    ink: '#23323a',
  }),
  token(13, 'whale-ferry', 'Whale Ferry', 'small ferry', 'white sun', 'wild passage', 'rare encounter', 'epic', 24, {
    sky: '#cfbea2',
    water: '#537585',
    accent: '#2d5365',
    ink: '#162832',
  }),
  token(14, 'coral-trawler', 'Coral Trawler', 'fishing trawler', 'coral sunrise', 'working coast', 'honest harvest', 'common', 144, {
    sky: '#d8af90',
    water: '#5a7882',
    accent: '#c85437',
    ink: '#1b3138',
  }),
  token(15, 'rose-skiff', 'Rose Skiff', 'small skiff', 'rose sun', 'glass bay', 'minimum viable voyage', 'rare', 44, {
    sky: '#dfa89d',
    water: '#6f8490',
    accent: '#c96b6f',
    ink: '#22313a',
  }),
  token(16, 'landmark-ferry', 'Landmark Ferry', 'city ferry', 'small planet', 'domed landmark skyline', 'pilgrimage by water', 'rare', 44, {
    sky: '#e7b38a',
    water: '#567887',
    accent: '#d98b55',
    ink: '#1c2f39',
  }),
  token(17, 'solar-sail', 'Solar Sail', 'heeled racing sailboat', 'bright solar disk', 'wind lane', 'elegant pressure', 'epic', 24, {
    sky: '#e4a986',
    water: '#557583',
    accent: '#f0c56e',
    ink: '#1d2c35',
  }),
  token(18, 'twin-schooner', 'Twin Schooner', 'two-masted schooner', 'morning sun', 'outer islands', 'old craft, clean line', 'rare', 44, {
    sky: '#d8b99a',
    water: '#5c7a86',
    accent: '#e8d1a0',
    ink: '#1a2f38',
  }),
  token(19, 'container-dawn', 'Container Dawn', 'container ship', 'wide sun', 'industrial horizon', 'scale without hurry', 'uncommon', 88, {
    sky: '#dfad85',
    water: '#527483',
    accent: '#cf6d42',
    ink: '#1b2c35',
  }),
  token(20, 'long-oil-tanker', 'Long Oil Tanker', 'black oil tanker', 'muted morning sun', 'mountain channel', 'heavy vessel, light mind', 'rare', 44, {
    sky: '#d3c0a5',
    water: '#526f82',
    accent: '#c48757',
    ink: '#182a35',
  }),
  token(21, 'bay-runner', 'Bay Runner', 'fast bay ferry', 'hazy sun', 'coastal city inlet', 'clean acceleration', 'uncommon', 88, {
    sky: '#d6c2a9',
    water: '#5c7888',
    accent: '#c98b63',
    ink: '#1f3039',
  }),
  token(22, 'wooden-launch', 'Wooden Launch', 'varnished wooden launch', 'pale planet', 'private cove', 'quiet ownership', 'rare', 44, {
    sky: '#cbbfa5',
    water: '#466c7f',
    accent: '#b56b3e',
    ink: '#172b36',
  }),
  token(23, 'eclipse-carrier', 'Eclipse Carrier', 'distant carrier ship', 'black eclipse sun', 'night-to-morning line', 'threshold moment', 'mythic', 8, {
    sky: '#30485c',
    water: '#23465c',
    accent: '#f0c56e',
    ink: '#081821',
  }),
  token(24, 'mist-freighter', 'Mist Freighter', 'freighter in fog', 'veiled white sun', 'gray open sea', 'arrival not yet visible', 'rare', 44, {
    sky: '#c8c4b8',
    water: '#78858a',
    accent: '#eee7d4',
    ink: '#25323a',
  }),
] as const;

export function morningOceanTokenById(tokenId: number): MorningOceanToken | undefined {
  return MORNING_OCEAN_TOKENS.find((item) => item.tokenId === tokenId);
}
