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

test('approved wallet-free Coastal Signal and exact static aliases omit session restoration',()=>{
  for (const suffix of ['','/','.html','/index.html']) assert.equal(isQuietUesStudyPath(`/coastal-signal${suffix}`),true);
  for (const pathname of ['/coastal-signal.json','/coastal-signalish','/coastal-signal/notes','/coastal-signal//','/coastal-signal/index.html/extra']) assert.equal(isQuietUesStudyPath(pathname),false,pathname);
});

test('approved standalone studies and exact static aliases omit account restoration',()=>{
  for (const study of ['/coastal-signal-wallet','/moon','/sun','/pacific','/waves','/air']) {
    for (const suffix of ['','/','.html','/index.html']) assert.equal(isQuietUesStudyPath(study+suffix),true,study+suffix);
    for (const suffix of ['.json','ish','/notes','//','/index.html/extra']) assert.equal(isQuietUesStudyPath(study+suffix),false,study+suffix);
  }
});

test('new isolated animation reading and static aliases omit account restoration',()=>{
  for (const study of ["/reading/animation", "/reading/animation/avatar-the-last-airbender", "/reading/animation/hanna-barbera", "/reading/animation/saturday-morning-1980s"]) {
    for (const suffix of ['','/','.html','/index.html']) assert.equal(isQuietUesStudyPath(study+suffix),true);
    for (const suffix of ['.json','ish','/notes','//','/index.html/extra']) assert.equal(isQuietUesStudyPath(study+suffix),false);
  }
});
