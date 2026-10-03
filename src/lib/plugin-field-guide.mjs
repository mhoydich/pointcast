export const GUIDE_BRANDS = Object.freeze({
  pointcast: 'PointCast',
  ues: 'University of El Segundo',
  industrynext: 'IndustryNext',
});

export function guideMarkdown(guide) {
  const status = Object.fromEntries(guide.statusLabels.map((item) => [item.id, item.label]));
  const source = Object.fromEntries(guide.sources.map((item) => [item.id, item]));
  const out = [`# ${guide.title}`, '', guide.subtitle, '', `Educational draft · Codex · checked ${guide.checkedAt}`, '', `PointCast source baseline: ${guide.baselineSha}`, ''];
  const add = (...items) => out.push(...items, '');
  for (const paragraph of guide.intro) add(paragraph);
  add('## How to read the examples');
  for (const item of guide.statusLabels) add(`- **${item.label}:** ${item.description}`);
  add('## What is already here');
  for (const item of guide.baselines) {
    add(`### ${GUIDE_BRANDS[item.brand]} — ${item.title}`, `**${status[item.status]}**`, '', item.body);
    add(item.links.map((link) => `[${link.label}](${link.url})`).join(' · '));
  }
  add('## Three first pilots');
  for (const item of guide.recommendations) add(`- **${GUIDE_BRANDS[item.brand]} — ${item.title}:** ${item.body}`);
  for (const topic of guide.topics) {
    add(`## ${topic.number} · ${topic.title}`, topic.question, '', topic.definition);
    add(`**Use:** ${Array.isArray(topic.use) ? topic.use.join(' ') : topic.use}`, '', `**Avoid:** ${Array.isArray(topic.avoid) ? topic.avoid.join(' ') : topic.avoid}`);
    add('### Architecture');
    topic.architecture.forEach((step, i) => add(`${i + 1}. ${step}`));
    for (const practice of topic.practices) add(`**${practice.label}:** ${practice.body}`);
    add(`**Availability:** ${topic.availability}`);
    for (const example of topic.examples) {
      add(`### ${GUIDE_BRANDS[example.brand]} — ${example.title}`, `**${status[example.status]}**`, '', example.body);
      add(`**Example prompt:** ${example.prompt}`, '', `**Intended output:** ${example.output}`, '', `**First step:** ${example.firstStep}`);
    }
    if (topic.code) add(`### Code illustration`, topic.code.caption, '', `\`\`\`${topic.code.language}`, topic.code.text, '\`\`\`', '', `Adapted from [${source[topic.code.source].title}](${source[topic.code.source].url}).`);
    add('Sources: ' + topic.sources.map((id) => `[${source[id].title}](${source[id].url})`).join(', '));
  }
  add('## The shared operating standard');
  for (const item of guide.sharedPractices) add(`- **${item.label}:** ${item.body}`);
  add('## From draft to pilot');
  guide.pilotSteps.forEach((item, i) => add(`${i + 1}. **${item.title}:** ${item.body}`));
  add('## Sources checked');
  for (const item of guide.sources) add(`- [${item.title}](${item.url}) — ${item.note}`);
  add('## Limits of this edition');
  for (const item of guide.limitations) add(`- ${item}`);
  return out.join('\n').trimEnd() + '\n';
}
