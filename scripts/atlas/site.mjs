// Site configuration for the PointCast atlas. The only file in scripts/atlas/ that differs between sites.
export const site = {
  host: 'pointcast.xyz',
  name: 'PointCast atlas',
  description: 'Every court, spot, shrine, paddle, league, page, agent and tool PointCast knows how to place, in one file. The 25-mile El Segundo layer first, then wider.',
  notOfficial: 'PointCast is an independent project. Not an official City of El Segundo page.',
  spec: 'https://pointcast.xyz/cartography/atlas',
  map: 'https://pointcast.xyz/cartography/map',
  atlasPath: '/atlas.json',
  output: 'public/atlas.json',
  radiusMiles: 25,
  // The same declared center the civic atlas (elsegundo.xyz/atlas) and the dispensary atlas use:
  // El Segundo City Hall, 350 Main Street, from the LA County Services Locator facility point.
  center: {
    lat: 33.92044971,
    lon: -118.4153182,
    name: 'El Segundo City Hall, 350 Main Street',
    source: 'https://locator.lacounty.gov/lac/Location/3177269/el-segundo-city-hall',
    method: 'Published LA County Services Locator facility point; not a surveyed entrance.',
  },
  // PointCast also publishes the merged index of every site atlas.
  index: {
    output: 'public/atlas/index.json',
    indexName: 'The Atlas: merged index',
    indexDescription: 'Every record from every site atlas (PointCast, elsegundo.xyz, and the University of El Segundo and Industry Next layers they host), merged by id, with cross-site links resolved.',
    indexMap: 'https://pointcast.xyz/cartography/map?site=all',
    sisters: [
      { atlas: 'https://elsegundo.xyz/atlas.json', snapshot: 'src/data/atlas/snapshots/elsegundo.xyz.json' },
    ],
  },
};
