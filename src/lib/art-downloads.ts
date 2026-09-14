import coastalCamps from '../data/coastal-camps.json';
import hummingbirds from '../data/hummingbirds.json';
import spaceshipGardens from '../data/spaceship-gardens.json';

// Add each new published set here. The running page and JSON catalog share
// this list, while existing image URLs and dated pages remain permanent.
export const ART_DOWNLOAD_COLLECTIONS = [hummingbirds, coastalCamps, spaceshipGardens]
  .map((set) => ({
    ...set,
    archives: 'archives' in set ? set.archives : [{
      ...set.archive,
      label: 'Complete set',
      imageCount: set.images.length,
      firstImage: set.images[0].number,
      lastImage: set.images[set.images.length - 1].number,
    }],
  }))
  .sort((a, b) => b.published.localeCompare(a.published) || b.blockId.localeCompare(a.blockId));

export const ART_DOWNLOAD_COUNT = ART_DOWNLOAD_COLLECTIONS.reduce((sum, set) => sum + set.images.length, 0);
export const ART_DOWNLOAD_URL = 'https://pointcast.xyz/downloads/';
