import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('The Local Transmission defines ten active, independently completable six-module classes', async () => {
  const source = await read('../src/lib/ues-classes.ts');
  const codes = source.match(/^    code: 'UES-(?:20[1-9]|210)',$/gm) ?? [];
  const activeCourses = source.match(/^    status: 'active',$/gm) ?? [];
  const courseWeekBlocks = source.match(/^    weeks: \[$/gm) ?? [];
  const weeks = source.match(/^        week: [1-6],$/gm) ?? [];
  const receipts = source.match(/^        publicReceipt:/gm) ?? [];
  const soloPaths = source.match(/^    soloPath:$/gm) ?? [];
  const paths = source.match(/^    path: '\/ues\/[a-z0-9-]+',$/gm) ?? [];
  const jsonPaths = source.match(/^    jsonPath: '\/ues\/[a-z0-9-]+\.json',$/gm) ?? [];

  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  assert.deepEqual(
    codes.map((line) => line.match(/UES-(?:20[1-9]|210)/)?.[0]),
    Array.from({ length: 10 }, (_, index) => `UES-${201 + index}`),
  );
  assert.equal(activeCourses.length, 10);
  assert.equal(courseWeekBlocks.length, 10);
  assert.equal(weeks.length, 60);
  assert.equal(receipts.length, 60);
  assert.equal(soloPaths.length, 10);
  assert.equal(paths.length, 10);
  assert.equal(jsonPaths.length, 10);

  assert.match(source, /status: 'active' as const/);
  assert.match(source, /deliveryMode: 'self-paced' as const/);
  assert.match(source, /planningLearners: 120/);
  assert.match(source, /accessCapacity: 'uncapped'/);
  assert.match(source, /courseCount: 10/);
  assert.match(source, /learnerPriceUsd: 0/);
  assert.match(source, /totalUsd: 46_600/);
  assert.match(source, /coursePoolUsd: 34_500/);
  assert.match(source, /sharedPoolUsd: 12_100/);
  assert.match(source, /Complete any four of the six module receipts and the final course outcome or a private equivalent/);
  assert.match(source, /Start any class immediately, without an application or account/);
  assert.match(source, /No live attendance, camera, account, wallet, or public posting is required/);
  assert.match(source, /Progress stays in this browser unless the learner chooses to download a private completion receipt/);
  assert.match(source, /Every required prompt, scenario, rubric, and checklist is written on this course page/);
  assert.match(source, /No AI system is required/);
  assert.doesNotMatch(source, /\b(?:supplied|class-provided|instructor-provided)\b/i);
  assert.doesNotMatch(source, /status: 'forming'/);
  assert.doesNotMatch(source, /learnerCapacity: 96/);
});

test('UES publishes one shared catalog, ten JSON routes, and privacy-safe self-paced course rooms', async () => {
  const [catalog, room, roomJson, catalogJson, program] = await Promise.all([
    read('../src/pages/ues/index.astro'),
    read('../src/pages/ues/[slug].astro'),
    read('../src/pages/ues/[slug].json.ts'),
    read('../src/pages/ues/classes.json.ts'),
    read('../src/lib/ues-program.ts'),
  ]);

  assert.match(catalog, /UES_SEASON_ONE_COURSES/);
  assert.match(catalog, /Ten active, self-paced University of El Segundo classes/);
  assert.match(catalog, /Start a class/);
  assert.match(catalog, /No account\. No application\. No deadline\. No wallet/);
  assert.match(catalog, /\.hero__copy \{ min-width:0;/);
  assert.match(catalog, /\.section__head>\* \{ min-width:0;/);
  assert.match(catalog, /@media\(max-width:480px\).*\.section__head h2\{font-size:clamp\(48px,11\.5vw,55px\)\}/);
  assert.match(catalog, /@media\(max-width:360px\).*h1\{font-size:39px\}/);
  assert.match(catalog, /href="\/ues\/track-05"/);
  assert.doesNotMatch(catalog, /<main(?:\s|>)/);

  assert.match(room, /getStaticPaths/);
  assert.match(room, /href="\/ues" aria-current="page"/);
  assert.match(room, /href="\/el-segundo-school#gallery"/);
  assert.match(room, /href="\/university-of-el-segundo#fund"/);
  assert.match(room, /Start here\. No account required/);
  assert.match(room, /wallet, public identity, public artifact, or blockchain transaction is never required/);
  assert.match(room, /courseWorkload: `\$\{course\.weeklyCommitment\.total\}/);
  assert.match(room, /courseMode: \['online', 'self-paced', 'asynchronous'\]/);
  assert.match(room, /course\.weeklyCommitment\.fieldworkMinutes\.minimum/);
  assert.match(room, /course\.weeklyCommitment\.selfGuidedStudioMinutes/);
  assert.match(room, /data-course-desk/);
  assert.match(room, /<progress data-course-progress max="5" value="0"/);
  assert.match(room, /aria-label=\{`\$\{course\.code\} course completion`\}/);
  assert.match(room, /data-course-week=\{index \+ 1\}/);
  assert.match(room, /data-course-final/);
  assert.match(room, /window\.localStorage\.setItem\(storageKey, serializeProgress\(progress\)\)/);
  assert.match(room, /Download private receipt/);
  assert.match(room, /createCompletionReceipt\(progress\)/);
  assert.match(room, /The complete solo toolkit/);
  assert.match(room, /Source trail/);
  assert.match(room, /Audience scenarios/);
  assert.match(room, /Cold read/);
  assert.match(room, /Safety and rights pass/);
  assert.match(room, /suggested after module \{assignment\.dueWeek\}/);
  assert.doesNotMatch(room, /due week/);
  assert.doesNotMatch(room, /instructor: \{ '@type': 'Person'/);
  assert.doesNotMatch(room, /import\([^)]*ues-fund/);

  assert.match(roomJson, /status: 'active'/);
  assert.match(roomJson, /deliveryMode: 'self-paced'/);
  assert.match(roomJson, /start: 'anytime'/);
  assert.match(roomJson, /storage: 'local-browser-only'/);
  assert.match(roomJson, /walletRequired: false/);
  assert.match(roomJson, /transactionPolicy/);
  assert.match(catalogJson, /current:/);
  assert.match(catalogJson, /durationModules: 6/);
  assert.match(catalogJson, /learnerPriceUsd: 0/);
  assert.match(catalogJson, /account: false/);
  assert.match(catalogJson, /wallet: false/);
  assert.match(catalogJson, /syncsToServer: false/);
  assert.match(program, /nextOnlineTerm: ONLINE_SEASON_ONE/);
  assert.match(program, /nextCourses: UES_SEASON_ONE_COURSES/);
});

test('private progress completes at four of six modules plus the final outcome', async () => {
  const {
    createCompletionReceipt,
    createProgress,
    isComplete,
    normalizeProgress,
    progressSummary,
    serializeProgress,
    setFinalOutcome,
    setWeekComplete,
  } = await import('../src/lib/ues-progress.mjs');

  let progress = createProgress('UES-201');
  progress = setWeekComplete(progress, 1, true, '2026-07-18T10:00:00.000Z');
  progress = setWeekComplete(progress, 2, true, '2026-07-18T11:00:00.000Z');
  progress = setWeekComplete(progress, 3, true, '2026-07-18T12:00:00.000Z');
  progress = setFinalOutcome(progress, true, '2026-07-18T13:00:00.000Z');
  assert.equal(isComplete(progress), false);

  progress = setWeekComplete(progress, 4, true, '2026-07-18T14:00:00.000Z');
  assert.equal(isComplete(progress), true);
  assert.deepEqual(progressSummary(progress), { value: 5, max: 5, complete: true, nextModule: 5 });

  const receipt = createCompletionReceipt(progress);
  assert.equal(receipt.kind, 'self-attested-course-completion');
  assert.equal(receipt.courseCode, 'UES-201');
  assert.equal(receipt.completedModuleCount, 4);
  assert.equal(receipt.finalOutcome, true);
  assert.match(receipt.disclaimer, /Not academic credit, accreditation, verified identity, an on-chain record, or a financial credential/);

  const normalized = normalizeProgress({
    ...JSON.parse(serializeProgress(progress)),
    name: 'must be discarded',
    wallet: 'must be discarded',
    artifact: 'must be discarded',
  }, 'UES-201');
  assert.deepEqual(
    Object.keys(normalized).sort(),
    ['completedAt', 'completedWeeks', 'courseCode', 'finalOutcome', 'startedAt', 'v'],
  );
});

test('School discovery surfaces link the art archive, active classes, and funding program', async () => {
  const [home, archive, funding] = await Promise.all([
    read('../src/components/ElSegundoSchoolHome.astro'),
    read('../src/pages/el-segundo-school.astro'),
    read('../src/pages/university-of-el-segundo.astro'),
  ]);

  assert.match(home, /href="\/ues">Take a class/);
  assert.match(archive, /href="\/ues">Classes/);
  assert.match(funding, /id="next-term"/);
  assert.match(funding, /href="\/ues">Class catalog/);
  assert.match(funding, /Ten rooms are active now/);
  assert.match(funding, /href="\/ues#current-term">Start a class now/);
  assert.match(funding, /PROGRAM \+ EXPANSION TOTAL/);
  assert.match(funding, /Active self-paced term/);
  assert.match(funding, /This view includes the active Local Transmission target/);
});
