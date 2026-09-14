import coastalCamps from '../data/coastal-camps.json';
import spaceshipGardens from '../data/spaceship-gardens.json';

// Add each new published set here. The running page and JSON catalog share
// this list, while existing image URLs and dated pages remain permanent.
export const ART_DOWNLOAD_COLLECTIONS = [coastalCamps, spaceshipGardens]
  .sort((a, b) => b.published.localeCompare(a.published) || b.blockId.localeCompare(a.blockId));

export const ART_DOWNLOAD_COUNT = ART_DOWNLOAD_COLLECTIONS.reduce((sum, set) => sum + set.images.length, 0);
export const ART_DOWNLOAD_URL = 'https://pointcast.xyz/downloads/';
