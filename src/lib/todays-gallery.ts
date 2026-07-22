import reveAbundance from '../assets/todays-art/2026-07-21/reve/abundance-flows.webp';
import revePositive from '../assets/todays-art/2026-07-21/reve/the-positive-index.webp';
import revePublicMiracle from '../assets/todays-art/2026-07-21/reve/small-public-miracle.webp';
import { JULY22_WORKS } from './todays-art-july22';

export const TODAY_GALLERY_DATE = '2026-07-22';
export const JULY20_GALLERY_DATE = '2026-07-20';

export const MIDJOURNEY_DEEP_CUTS = [
  ['001-a5df9a4cbdf0', 'Lineage / Memory', 'University of El Segundo'],
  ['188-fbb9b95647fa', 'Second Period', 'University of El Segundo'],
  ['146-508d380b6990', 'Many / One / Nine', 'Commons + Systems'],
  ['196-8378ab8a7574', 'Four Lanes / One Commons', 'Commons + Systems'],
  ['041-d9792e707c62', 'Genetics Teaching Poster', 'Botany + Flower Commons'],
  ['416-9d4f1bb9b994', 'Plant / Human Correspondence', 'Botany + Flower Commons'],
  ['065-a7073f62566d', 'Cultivation as Choreography', 'Type + Graphic Studies'],
  ['169-8390ae1a01eb', 'Open Flower Standard', 'Type + Graphic Studies'],
  ['505-fcb16b222410', 'Lost Coastal Field Atlas', 'El Segundo Fieldwork'],
  ['545-03d8c4d48162', 'Celestial Stained Glass', 'El Segundo Fieldwork'],
  ['509-a8774ed6cafd', 'Migratory Bird Radio Log', 'Open Studies'],
  ['625-3e6557d4f781', 'Crashing Wave / Distant Signal', 'Open Studies'],
] as const;

export const IDEOGRAM_CUTS = [
  ['9twsnUetViyS8EyeIlDQ2g', 'Poolside Inventory'],
  ['0gNXAs_eWlKsOKe-UBw8JA', 'Possible / Los Angeles 1974'],
  ['E1iJ0_7aX9Glfzvaczs-Ig', 'Concrete / Chrome / Cash'],
  ['tvgYWYenUqOVmvLLJ3bF2w', 'Concrete / Gold / Speed'],
  ['0IUxt9kQRmW04cvc4BBGFg', 'Possible on Wilshire'],
  ['GZlbZdTaQd6KIMyR7cfUWw', 'Possible in Silver'],
] as const;

export const IMAGEAPP_CUTS = [
  ['money-ocean', 'Money Ocean', 'Prompt-named ImageApp export'],
  ['so-tired', 'So Tired', 'ImageApp user bucket'],
  ['sailboat', 'Good Wind', 'ImageApp user bucket'],
  ['color-field-01', 'Pacific Bands I', 'ImageApp user bucket'],
  ['color-field-02', 'Pacific Bands II', 'ImageApp user bucket'],
] as const;

export const july20GalleryManifest = {
  schema: 'pointcast.gallery.edit.v1',
  date: JULY20_GALLERY_DATE,
  title: "Today's Art: Money, Flowers, Signal",
  artist: 'Michael Hoydich',
  editor: 'PointCast',
  sources: {
    midjourney: {
      liveSelection: 5,
      deepCuts: MIDJOURNEY_DEEP_CUTS.map(([id, title, category]) => ({
        id,
        title,
        category,
        image: `https://el-segundo-school-archive.pages.dev/display/${id}.webp`,
      })),
    },
    ideogram: IDEOGRAM_CUTS.map(([id, title]) => ({
      id,
      title,
      profile: 'mhoydich',
      source: `https://ideogram.ai/assets/image/balanced/response/${id}@2k`,
    })),
    imageapp: {
      profile: 'mikeimageapp',
      availabilityNote: 'Curated from the local profile export while imageapp.xyz was in maintenance mode.',
      works: IMAGEAPP_CUTS.map(([id, title, note]) => ({ id, title, note })),
    },
  },
};

export const POSITIVE_INDEX_MIDJOURNEY = [
  ['b4780342-9fda-45ff-b973-77451790ec69', 0, 'Bicycle Repair Shrine'],
  ['805963fd-ca00-49a4-b796-55614f5123a0', 0, 'The Long Table'],
  ['805963fd-ca00-49a4-b796-55614f5123a0', 3, 'Blue Canopy Supper'],
  ['d7b95d81-5b75-40ff-9a7f-a13fb3c5f306', 1, 'Garden Kiosk'],
  ['d7b95d81-5b75-40ff-9a7f-a13fb3c5f306', 0, 'Bus Shelter Conservatory'],
  ['8487ec7a-ad8d-4f1a-9069-7d4008468d22', 1, 'Neighborhood Star Map'],
] as const;

export const POSITIVE_INDEX_IDEOGRAM = [
  ['8Ix6T408QkCRK6Pb-sBV7w', 'Abundance Flows I'],
  ['7P8oOUsyQqCrUDfaL2-IzA', 'Abundance Flows II'],
  ['Nc5vstX-SGOgu3_Axgw4-g', 'Abundance Flows III'],
  ['AmnaTBGZS_OkLW6Pfqc0Fw', 'Abundance Flows IV'],
] as const;

export const POSITIVE_INDEX_IMAGEAPP = [
  ['money-ocean', 'Money Ocean'],
  ['so-tired', 'So Tired'],
  ['color-field-01', 'Pacific Bands I'],
  ['color-field-02', 'Pacific Bands II'],
] as const;

export const POSITIVE_INDEX_REVE_ADS = [
  ['PC-HOUSE-007', 'The Positive Index', revePositive.src],
  ['PC-HOUSE-008', 'A Small Public Miracle', revePublicMiracle.src],
  ['PC-HOUSE-009', 'Abundance Flows', reveAbundance.src],
] as const;

export const positiveIndexGalleryManifest = {
  schema: 'pointcast.gallery.edit.v1',
  date: '2026-07-21',
  title: "Today's Art: The Positive Index",
  artist: 'Michael Hoydich',
  editor: 'PointCast',
  workCount: 14,
  thesis: 'Ordinary public things pictured as evidence that a generous California future is already trying to arrive.',
  sources: {
    midjourney: POSITIVE_INDEX_MIDJOURNEY.map(([jobId, index, title]) => ({
      jobId,
      index,
      title,
      source: `https://www.midjourney.com/jobs/${jobId}?index=${index}`,
    })),
    ideogram: POSITIVE_INDEX_IDEOGRAM.map(([id, title]) => ({
      id,
      title,
      profile: 'mhoydich',
      source: `https://ideogram.ai/assets/image/balanced/response/${id}@2k`,
    })),
    imageapp: {
      profile: 'mikeimageapp',
      availabilityNote: 'A live review was attempted on July 21, 2026. imageapp.xyz still showed Site Maintenance, so this room revisits preserved local profile exports.',
      works: POSITIVE_INDEX_IMAGEAPP.map(([id, title]) => ({ id, title, provenance: 'preserved local ImageApp profile export' })),
    },
    reve: {
      purpose: 'House-ad campaign created for this edition; not counted in the 14 artwork total.',
      creatives: POSITIVE_INDEX_REVE_ADS.map(([id, title, image]) => ({ id, title, image })),
    },
  },
  mintStatus: 'not represented as minted',
};

export const todaysGalleryManifest = {
  schema: 'pointcast.gallery.edit.v1',
  date: TODAY_GALLERY_DATE,
  title: "Today's Art: The City Is a Poster",
  artist: 'Michael Hoydich',
  editor: 'PointCast',
  edit: 3,
  workCount: JULY22_WORKS.length,
  thesis: 'Fifteen speculative broadsides turn El Segundo into a civic operating system: days of the week, water, sports, machines, weather, and myth all demanding a wall.',
  provenance: {
    source: 'User-provided local image batch supplied to PointCast on July 22, 2026.',
    generationTool: 'not asserted',
    handling: 'Original source files preserved in the PointCast repository; responsive WebP derivatives are generated by Astro at build time.',
  },
  rooms: [
    { id: 'sign-systems', title: 'Signs with weather inside', workIds: ['PC-TA-20260722-01', 'PC-TA-20260722-02', 'PC-TA-20260722-03', 'PC-TA-20260722-08'] },
    { id: 'local-calendar', title: 'A week you can walk into', workIds: ['PC-TA-20260722-04', 'PC-TA-20260722-07', 'PC-TA-20260722-11', 'PC-TA-20260722-15'] },
    { id: 'machines-games', title: 'Machines join the league', workIds: ['PC-TA-20260722-05', 'PC-TA-20260722-06', 'PC-TA-20260722-09', 'PC-TA-20260722-10', 'PC-TA-20260722-13'] },
    { id: 'value-systems', title: 'Value gets a new face', workIds: ['PC-TA-20260722-12', 'PC-TA-20260722-14'] },
  ],
  works: JULY22_WORKS.map(({ id, title, room, note, alt, sourceFilename, image }) => ({
    id,
    title,
    room,
    note,
    alt,
    sourceFilename,
    width: image.width,
    height: image.height,
    image: `https://pointcast.xyz${image.src}`,
  })),
  mintStatus: 'not represented as minted',
};
