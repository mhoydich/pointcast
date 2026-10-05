import test from 'node:test';
import assert from 'node:assert/strict';
import { isQuietUesStudyPath } from '../src/lib/ues-living-study-boundaries.mjs';

test('approved mortality document and static HTML aliases omit session restoration',()=>{
  for (const slug of ['death']) {
    for (const suffix of ['','/','.html','/index.html']) {
      assert.equal(isQuietUesStudyPath(`/ues/${slug}${suffix}`),true);
    }
  }
});

test('ordinary classes, account/API routes, JSON, and neighboring paths retain existing session behavior',()=>{
  for (const pathname of ['/ues/grief/','/ues/human-energy/','/ues/nature-interaction/','/ues/frequency/','/ues/human-energy/adult-substances/','/','/ues','/ues/','/ues/track-05','/ues/plant-portraits','/me','/login','/api/auth/session','/ues/grief.json','/ues/human-energy.json','/ues/nature-interaction.json','/ues/human-energyish','/ues/grief-support','/ues/grief/notes','/ues/human-energy/index.html/extra','/UES/grief','/ues/grief//']) {
    assert.equal(isQuietUesStudyPath(pathname),false,pathname);
  }
});
