export const REGIONAL_READING_PATH = '/reading/regions';

export function assertRegionalStory(story) {
  if (!story || typeof story !== 'object') throw new Error('A complete regional story is required.');
  for (const key of ['slug', 'country', 'title', 'dek', 'checkedDate']) {
    if (typeof story[key] !== 'string' || !story[key].trim()) throw new Error(`Missing regional story ${key}.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.slug)) throw new Error('Invalid regional story slug.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(story.checkedDate)) throw new Error('Regional stories need a dated source check.');
  if (!Array.isArray(story.summary) || !story.summary.length) throw new Error('A quick reading summary is required.');
  if (story.summary.some(point => typeof point !== 'string' || !point.trim())) throw new Error('Summary points must contain readable text.');
  if (!Array.isArray(story.sections) || !story.sections.length) throw new Error('The substantial main story is required.');
  if (!Array.isArray(story.sources) || !story.sources.length) throw new Error('Regional stories require inspectable sources.');
  const sourceIds = new Set();
  for (const source of story.sources) {
    if (!source.id || sourceIds.has(source.id) || !source.title) throw new Error('Source IDs and titles must be complete and unique.');
    if (new URL(source.url).protocol !== 'https:') throw new Error('Source links must use HTTPS.');
    sourceIds.add(source.id);
  }
  const sectionIds = new Set(['summary', 'work', 'learning', 'sources']);
  for (const section of story.sections) {
    if (!section.id || sectionIds.has(section.id) || !section.heading) throw new Error('Section IDs and headings must be complete and unique.');
    if (!Array.isArray(section.paragraphs) || !section.paragraphs.length) throw new Error('Empty outline sections cannot be published as stories.');
    if (section.paragraphs.some(paragraph => typeof paragraph !== 'string' || !paragraph.trim())) throw new Error('Story paragraphs must contain readable text.');
    if ((section.sourceIds || []).some(id => !sourceIds.has(id))) throw new Error('Unknown section source reference.');
    sectionIds.add(section.id);
  }
  for (const brand of ['industrynext', 'ues']) {
    if (!story.companions?.[brand]?.title) throw new Error(`Missing ${brand} companion.`);
  }
  if (!story.companions.industrynext.paragraphs?.length) throw new Error('The business companion needs substantive reading.');
  if (!story.companions.ues.prompts?.length) throw new Error('The UES companion needs practical learning prompts.');
  if (regionalReadingWordCount(story) < 600) throw new Error('The main story is incomplete for the substantial regional reading shelf.');
  return story;
}

export function assertRegionalShelf(stories) {
  if (!Array.isArray(stories) || !stories.length) throw new Error('Do not publish an empty reading shelf.');
  const slugs = new Set();
  for (const story of stories) {
    assertRegionalStory(story);
    if (slugs.has(story.slug)) throw new Error('Duplicate regional reading route.');
    slugs.add(story.slug);
  }
  return stories;
}

export const regionalStoryPath = story => `${REGIONAL_READING_PATH}/${story.slug}`;

export function regionalReadingWordCount(story) {
  return story.sections.flatMap(section => section.paragraphs).join(' ').trim().split(/\s+/).filter(Boolean).length;
}

export function regionalReadingMinutes(story) {
  return Math.max(1, Math.ceil(regionalReadingWordCount(story) / 200));
}
