import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const outputDir = path.join(repoRoot, 'public', 'decks');
const runtimeNodeModules =
  process.env.CODEX_RUNTIME_NODE_MODULES ??
  '/Users/michaelhoydich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';

const require = createRequire(import.meta.url);
const artifactPath = require.resolve('@oai/artifact-tool', { paths: [runtimeNodeModules] });
const sharpPath = require.resolve('sharp', { paths: [runtimeNodeModules] });

const {
  Presentation,
  PresentationFile,
  auto,
  column,
  fill,
  fixed,
  fr,
  grid,
  hug,
  image,
  layers,
  panel,
  row,
  rule,
  shape,
  text,
  wrap,
} = await import(pathToFileURL(artifactPath).href);
const sharp = (await import(pathToFileURL(sharpPath).href)).default;

const deckPath = path.join(outputDir, 'nouns-nation-builder-roadmap-v2.pptx');
const contactSheetPath = path.join(outputDir, 'nouns-nation-builder-roadmap-v2-preview-contact-sheet.png');
const previewPrefix = 'nouns-nation-builder-roadmap-v2-preview';
const assets = {
  battle: path.join(repoRoot, 'public', 'images', 'og', 'battle.png'),
  block406: path.join(repoRoot, 'public', 'images', 'og', 'b', '0406.png'),
  block407: path.join(repoRoot, 'public', 'images', 'og', 'b', '0407.png'),
  block408: path.join(repoRoot, 'public', 'images', 'og', 'b', '0408.png'),
};

const W = 1920;
const H = 1080;
const colors = {
  ink: '#12110E',
  muted: '#5F5E5A',
  cream: '#FBF7E9',
  paper: '#FFFDF6',
  red: '#D8333F',
  blue: '#316FDD',
  green: '#D7FF3F',
  purple: '#4E19A8',
  night: '#050310',
};

function style(size, color = colors.ink, extra = {}) {
  return {
    fontSize: size,
    color,
    ...extra,
  };
}

function label(value, color = colors.purple) {
  return text(value, {
    width: fill,
    height: hug,
    style: style(22, color, { bold: true }),
  });
}

function body(value, width = fill, size = 30) {
  return text(value, {
    width,
    height: hug,
    style: style(size, colors.muted),
  });
}

function headline(value, size = 86, color = colors.ink) {
  return text(value, {
    width: fill,
    height: hug,
    style: style(size, color, { bold: true }),
  });
}

function addSlide(presentation, name, root) {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name, width: fill, height: fill },
      [
        shape({ name: `${name}-background`, width: fill, height: fill, fill: colors.cream }),
        root,
      ],
    ),
    { frame: { left: 0, top: 0, width: W, height: H }, baseUnit: 8 },
  );
  return slide;
}

function openPill(value, fillColor = colors.paper, textColor = colors.ink) {
  return panel(
    {
      width: fill,
      height: hug,
      padding: { x: 18, y: 12 },
      fill: fillColor,
      borderRadius: 0,
    },
    text(value, {
      width: fill,
      height: hug,
      style: style(24, textColor, { bold: true }),
    }),
  );
}

function yearSlide(presentation, year, title, lede, assetPath, rows) {
  return addSlide(
    presentation,
    `year-${year}`,
    grid(
      {
        width: fill,
        height: fill,
        columns: [fixed(560), fr(1)],
        rows: [fr(1), fixed(290)],
        columnGap: 54,
        rowGap: 38,
        padding: { x: 86, y: 72 },
      },
      [
        column(
        { width: fill, height: fill, gap: 20 },
          [
            label(`YEAR ${year === '2026' ? '1' : year === '2027' ? '2' : '3'} / ${year}`),
            text(year, {
              width: fill,
              height: hug,
              style: style(170, colors.ink, { bold: true }),
            }),
            text(title, {
              width: wrap(500),
              height: hug,
              style: style(52, colors.ink, { bold: true }),
            }),
            body(lede, wrap(490), 26),
          ],
        ),
        grid(
          {
            width: fill,
            height: fill,
            columns: [fr(1)],
            rows: [auto, auto, auto],
            rowGap: 22,
            padding: { x: 0, y: 18 },
          },
          rows.map((item) =>
            row(
              { width: fill, height: hug, gap: 24, align: 'start' },
              [
                text(item.kicker, {
                  width: fixed(150),
                  height: hug,
                  style: style(24, colors.red, { bold: true }),
                }),
                column(
                  { width: fill, height: hug, gap: 8 },
                  [
                    text(item.title, {
                      width: fill,
                      height: hug,
                      style: style(38, colors.ink, { bold: true }),
                    }),
                    body(item.body, fill, 26),
                  ],
                ),
              ],
            ),
          ),
        ),
        image({
          name: `year-${year}-receipt`,
          path: assetPath,
          width: fill,
          height: fill,
          fit: 'cover',
          alt: `Nouns Nation roadmap ${year} receipt graphic`,
          columnSpan: 2,
        }),
      ],
    ),
  );
}

const presentation = Presentation.create({ slideSize: { width: W, height: H } });

addSlide(
  presentation,
  'cover',
  grid(
    {
      width: fill,
      height: fill,
      columns: [fr(1)],
      rows: [fr(1), fixed(330)],
      rowGap: 34,
      padding: { x: 86, y: 72 },
    },
    [
      column(
        { width: fill, height: fill, gap: 26, justify: 'center' },
        [
          label('ROADMAP V2 / APRIL 29 2026'),
          text('NOUNS NATION BUILDER', {
            width: wrap(1400),
            height: hug,
            style: style(118, colors.ink, { bold: true }),
          }),
          text('Browser room -> agent broadcast -> TV league -> live final.', {
            width: wrap(1180),
            height: hug,
            style: style(44, colors.muted),
          }),
          rule({ width: fixed(720), weight: 8, stroke: colors.green }),
        ],
      ),
      image({
        name: 'battle-strip',
        path: assets.battle,
        width: fill,
        height: fill,
        fit: 'cover',
        alt: 'Nouns Nation battle broadcast graphic',
      }),
    ],
  ),
);

addSlide(
  presentation,
  'thesis',
  grid(
    {
      width: fill,
      height: fill,
      columns: [fr(1.08), fr(0.92)],
      columnGap: 64,
      padding: { x: 86, y: 72 },
    },
    [
      column(
        { width: fill, height: fill, gap: 28, justify: 'center' },
        [
          label('INVESTMENT THESIS'),
          headline('Buy the venue, not just the game.', 92),
          body(
            'The wedge is a live, AI-readable sports and culture venue where humans root, agents scout, and every output becomes a reusable artifact.',
            wrap(820),
            34,
          ),
        ],
      ),
      column(
        { width: fill, height: fill, gap: 18, justify: 'center' },
        [
          openPill('1. Browser room'),
          openPill('2. Living-room TV', '#EEF7FF'),
          openPill('3. Partner venues', '#F8E9EF'),
          openPill('4. Ticketed final', colors.green),
          body('Fund the venue. Prove the ritual. Delay the token.', fill, 30),
        ],
      ),
    ],
  ),
);

addSlide(
  presentation,
  'ai-curve',
  grid(
    {
      width: fill,
      height: fill,
      columns: [fr(1)],
      rows: [auto, fr(1), auto],
      rowGap: 44,
      padding: { x: 86, y: 72 },
    },
    [
      column(
        { width: fill, height: hug, gap: 18 },
        [
          label('AI TOOL CURVE'),
          headline('Small teams can now operate like media control rooms.', 78),
        ],
      ),
      grid(
        {
          width: fill,
          height: fill,
          columns: [fr(1), fr(1), fr(1)],
          columnGap: 28,
          padding: { x: 0, y: 18 },
        },
        [
          panel(
            { width: fill, height: fill, padding: 28, fill: colors.paper },
            column(
              { width: fill, height: fill, gap: 22 },
              [
                text('2026', { width: fill, height: hug, style: style(76, colors.red, { bold: true }) }),
                text('Agent-native production', { width: fill, height: hug, style: style(40, colors.ink, { bold: true }) }),
                body('Agents inspect repos, edit files, run commands, call MCP tools, and produce artifacts.', fill, 30),
              ],
            ),
          ),
          panel(
            { width: fill, height: fill, padding: 28, fill: '#EEF7FF' },
            column(
              { width: fill, height: fill, gap: 22 },
              [
                text('2027', { width: fill, height: hug, style: style(76, colors.blue, { bold: true }) }),
                text('Distributed media ops', { width: fill, height: hug, style: style(40, colors.ink, { bold: true }) }),
                body('Remote MCP and coding agents let partner nodes run standardized nights with local identity.', fill, 30),
              ],
            ),
          ),
          panel(
            { width: fill, height: fill, padding: 28, fill: '#F3FFE8' },
            column(
              { width: fill, height: fill, gap: 22 },
              [
                text('2028', { width: fill, height: hug, style: style(76, colors.purple, { bold: true }) }),
                text('Physical-world show surface', { width: fill, height: hug, style: style(40, colors.ink, { bold: true }) }),
                body('Bespoke media formats become cheap enough to rehearse, localize, and package for venues.', fill, 30),
              ],
            ),
          ),
        ],
      ),
      body('OpenAI Agents SDK, Anthropic MCP, Cloudflare remote MCP, and GitHub Copilot coding agent are the tooling assumptions.', fill, 24),
    ],
  ),
);

yearSlide(presentation, '2026', 'Prove the weekly ritual', 'Make the league room worth returning to every week.', assets.block406, [
  {
    kicker: 'SURFACES',
    title: 'Hub, TV cast, V3 desk, agent bench, roadmap',
    body: 'The public product must feel like a venue with a schedule, not a pile of prototypes.',
  },
  {
    kicker: 'BUILD',
    title: 'Agent desk and twelve watch nights',
    body: 'Scout, host, commentator, QA, and scorekeeper jobs create useful artifacts every slate.',
  },
  {
    kicker: 'GATES',
    title: 'Repeat viewing plus sponsor tests',
    body: 'Twelve watch nights, three sponsor or grant tests, and a visible cohort returning across slates.',
  },
]);

yearSlide(presentation, '2027', 'Syndicate the broadcast network', 'Turn one desk into a repeatable local and partner format.', assets.block407, [
  {
    kicker: 'SURFACES',
    title: 'City nodes and venue watch kits',
    body: 'Bars, campuses, chapters, shops, and clubs get a local kit without losing identity.',
  },
  {
    kicker: 'BUILD',
    title: 'Federated manifests and sponsor inventory',
    body: 'Local rules, rosters, results, sponsor reads, and recaps publish into the same envelope.',
  },
  {
    kicker: 'GATES',
    title: 'Four partner nodes, two to four sponsors',
    body: 'The target is 1,000-plus weekly viewers, treated as an operating milestone rather than a promise.',
  },
]);

yearSlide(presentation, '2028', 'Package the live final', 'Make a browser-native sport legible on a stage or stadium board.', assets.block408, [
  {
    kicker: 'SURFACES',
    title: 'Flagship final and ticketed stream',
    body: 'The show has a live host, agent desk, crowd screen, recap studio, and sponsor rhythm.',
  },
  {
    kicker: 'BUILD',
    title: 'Venue AV runbook and licensing kit',
    body: 'The format needs scoreboard graphics, QR handoffs, sponsor reads, and a repeatable operator guide.',
  },
  {
    kicker: 'GATES',
    title: 'Ten venue partners and break-even season economics',
    body: 'The stadium idea only matters once partner venues already want the package.',
  },
]);

addSlide(
  presentation,
  'capital-gates',
  grid(
    {
      width: fill,
      height: fill,
      columns: [fr(1)],
      rows: [auto, fr(1)],
      rowGap: 34,
      padding: { x: 86, y: 72 },
    },
    [
      column(
        { width: fill, height: hug, gap: 16 },
        [
          label('CAPITAL PLAN'),
          headline('Tranche the money to proof, not vibes.', 78),
        ],
      ),
      grid(
        {
          width: fill,
          height: fill,
          columns: [fixed(250), fixed(280), fr(1)],
          rows: [auto, auto, auto, auto, auto],
          columnGap: 22,
          rowGap: 14,
          padding: 0,
        },
        [
          label('GATE', colors.red),
          label('AMOUNT', colors.red),
          label('UNLOCK', colors.red),
          text('Seed check', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          text('$50k-$75k', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          body('Ninety days of product proof: watch nights, agent loop, analytics, and sponsor collateral.', fill, 28),
          text('Production tranche', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          text('Up to $250k', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          body('Released after repeat viewing, useful agent output, and one sponsor or ecosystem partner.', fill, 28),
          text('Broadcast tranche', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          text('Milestone priced', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          body('Only after partner venues want the format and the runbook is repeatable.', fill, 28),
          text('Onchain option', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          text('Counsel-gated', { width: fill, height: hug, style: style(34, colors.ink, { bold: true }) }),
          body('Builder DAO or token comes after legal review, audience proof, and clean governance claims.', fill, 28),
        ],
      ),
    ],
  ),
);

addSlide(
  presentation,
  'ask',
  grid(
    {
      width: fill,
      height: fill,
      columns: [fr(0.9), fr(1.1)],
      rows: [fr(1)],
      columnGap: 58,
      padding: { x: 86, y: 72 },
    },
    [
      column(
        { width: fill, height: fill, gap: 26, justify: 'center' },
        [
          label('NEXT 90 DAYS'),
          headline('Write the first check into the ritual.', 82),
          body('$50k-$75k funds the venue proof. Expansion waits for retention, useful agent output, and one sponsor or grant partner.', wrap(740), 34),
          rule({ width: fixed(560), weight: 8, stroke: colors.green }),
        ],
      ),
      column(
        { width: fill, height: fill, gap: 22, justify: 'center' },
        [
          openPill('Days 1-30: slate, recaps, link circuit, viewer loop'),
          openPill('Days 31-60: operator bench, scorekeeper, sponsor inventory', '#EEF7FF'),
          openPill('Days 61-90: paid or grant-backed season test', '#F8E9EF'),
          image({
            name: 'ask-battle-receipt',
            path: assets.battle,
            width: fill,
            height: fixed(270),
            fit: 'cover',
            alt: 'Nouns Nation battle broadcast graphic',
          }),
        ],
      ),
    ],
  ),
);

await fs.mkdir(outputDir, { recursive: true });
const hydrationRequests = presentation.getPendingImageHydrationRequests();
presentation.hydrateImageAssets(
  await Promise.all(
    hydrationRequests.map(async (request) => ({
      assetId: request.assetId,
      contentType: request.contentType,
      data: await fs.readFile(request.uri),
    })),
  ),
);
const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save(deckPath);

const previewPaths = [];
for (const [index, slide] of presentation.slides.items.entries()) {
  const blob = await slide.export({ format: 'png' });
  const png = Buffer.from(await blob.arrayBuffer());
  const previewPath = path.join(outputDir, `${previewPrefix}-${String(index + 1).padStart(2, '0')}.png`);
  await fs.writeFile(previewPath, png);
  previewPaths.push(previewPath);
}

const thumbWidth = 480;
const thumbHeight = 270;
const contactWidth = thumbWidth * 4;
const contactHeight = thumbHeight * 2;
const composites = await Promise.all(
  previewPaths.map(async (previewPath, index) => ({
    input: await sharp(previewPath).resize(thumbWidth, thumbHeight).png().toBuffer(),
    left: (index % 4) * thumbWidth,
    top: Math.floor(index / 4) * thumbHeight,
  })),
);

await sharp({
  create: {
    width: contactWidth,
    height: contactHeight,
    channels: 4,
    background: colors.cream,
  },
})
  .composite(composites)
  .png()
  .toFile(contactSheetPath);

const stats = await Promise.all(
  previewPaths.map(async (previewPath) => {
    const imageStats = await sharp(previewPath).stats();
    const means = imageStats.channels.slice(0, 3).map((channel) => Math.round(channel.mean));
    return {
      path: path.relative(repoRoot, previewPath),
      means,
      entropy: Number(imageStats.entropy.toFixed(3)),
    };
  }),
);

console.log(
  JSON.stringify(
    {
      deck: path.relative(repoRoot, deckPath),
      previews: previewPaths.map((previewPath) => path.relative(repoRoot, previewPath)),
      contactSheet: path.relative(repoRoot, contactSheetPath),
      stats,
    },
    null,
    2,
  ),
);
