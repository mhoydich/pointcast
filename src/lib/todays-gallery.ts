export const TODAY_GALLERY_DATE = '2026-07-20';

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

export const todaysGalleryManifest = {
  schema: 'pointcast.gallery.edit.v1',
  date: TODAY_GALLERY_DATE,
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
