import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import * as model from '../public/opportunities/model.mjs';
import {jobsShell} from '../src/lib/opportunities-shell.mjs';

// This suite checks source only. The immutable production base supplies its
// catalog; jsdom is the dependency already installed in that checkout.
const baseRepo = process.env.POINTCAST_SOURCE_REPO || process.cwd();
const baseSha = '338007d487d0f1096f1662346eb2fcd1a2aeed76';
const require = createRequire(baseRepo + '/package.json');
const {JSDOM} = require('jsdom');
const baseFile = path => execFileSync('git', ['show', baseSha + ':' + path], {cwd:baseRepo, encoding:'utf8'});
const baseCatalog = JSON.parse(baseFile('public/opportunities/catalog.json'));
const sourceShell = readFileSync(new URL('../public/opportunities/index.html', import.meta.url), 'utf8');
const baseXai = baseCatalog.opportunities.find(row => row.id === 'external-xai-grok-imagine-5244173007');
const boardSource = readFileSync(new URL('../public/opportunities/board.mjs', import.meta.url), 'utf8');
const expectedEditionIds = ['el-segundo-25mi', 'new-york-city-25mi', 'silicon-valley-25mi', 'built-world-southern-california', 'hollywood-creative'];
const [localEdition, otherEdition] = expectedEditionIds;
const checkedAt = '2026-10-07T10:30:00Z';
const metadata = [
 ['el-segundo-25mi', 'el-segundo', 'El Segundo · 25 miles', '25 miles from the documented El Segundo center'],
 ['new-york-city-25mi', 'new-york-city', 'New York City · 25 miles', '25 miles from the documented Midtown Manhattan center'],
 ['silicon-valley-25mi', 'silicon-valley', 'Silicon Valley · 25 miles', '25 miles from the documented Palo Alto center'],
 ['built-world-southern-california', 'built-world-southern-california', 'Built world · Southern California', 'Southern California built-world work'],
 ['hollywood-creative', 'hollywood-creative', 'Hollywood creative', 'Creative work with a documented Hollywood membership basis'],
].map(([id,slug,title,scope]) => ({id,route:'/jobs/internships/' + slug + '/',title,scope,checkedAt,asOfDate:'2026-10-07',coverageNote:'Curated dated snapshot; coverage is not exhaustive.',locationCaveat:'A geographic radius is not a commute estimate.'}));

function externalRow(id, editionIds, overrides = {}) {
 const sourceUrl = 'https://employer.example.test/jobs/' + id;
 const externalApplicationUrl = 'https://applications.example.test/positions/' + id;
 return {...structuredClone(baseXai), id, editionIds, employer:'Fixture Employer', employerBoard:'Official careers', project:'all', title:id + ' official opportunity', kind:'internship', sourceUrl, externalApplicationUrl, sourceDate:null, reviewedAt:'2026-10-07', checkedAt, availabilityVerifiedAt:checkedAt, compensation:'Paid internship; amount, period and hours not stated.', compensationKind:'paid', pay:null, eligibility:null, locationText:'El Segundo, California', remoteEligibility:null, description:'A synthetic official-source fixture for edition behavior.', expectations:'Complete the duties stated by the official employer.', terms:'The official employer controls applications. Hours, duration, supervision and eligibility not stated.', applicationEvidence:{verified:true,sourceUrl,applicationUrl:externalApplicationUrl,checkedAt,observation:'The official listing exposes this application destination.'}, sourceDetails:{requirements:{education:'Undergraduate enrollment',graduationDate:null},dates:{applicationDeadline:null},geography:{membershipBasis:'Documented official El Segundo worksite; city-level approximation.'}}, ...overrides};
}
const additions = [
 externalRow('local-internship', [localEdition]),
 externalRow('local-trainee', [localEdition], {kind:'trainee', title:'Local paid trainee', compensation:'Paid trainee; amount and period not stated.'}),
 externalRow('shared-paid-role', [localEdition,otherEdition], {kind:'role', title:'Shared paid role'}),
 externalRow('local-availability-unknown', [localEdition], {status:'needs-reconfirmation',listingState:'availability-unknown',availabilityVerifiedAt:null,externalApplicationUrl:null,applicationEvidence:null,compensationKind:'unconfirmed',compensation:'Pay not stated; current availability unverified.',title:'Local internship · availability unknown'}),
 externalRow('local-program-reference', [localEdition], {kind:'learning-program',status:'needs-reconfirmation',listingState:'program-reference',availabilityVerifiedAt:null,externalApplicationUrl:null,applicationEvidence:null,compensationKind:'unconfirmed',compensation:'Program pay not stated.',title:'Local program reference',description:'An official program reference; an open internship listing is not established.'}),
 externalRow('local-unpaid-internship', [localEdition], {compensationKind:'unpaid',compensation:'Unpaid internship as stated by the employer.'}),
 externalRow('other-internship', [otherEdition], {locationText:'New York, New York',title:'New York internship'}),
];
const catalog = {...structuredClone(baseCatalog),internshipEditions:metadata,opportunities:[...structuredClone(baseCatalog.opportunities),...additions]};
const scopedIds = additions.filter(row => row.editionIds.includes(localEdition)).map(row => row.id);
const sortedIds = rows => rows.map(row => row.id).sort();
const boundState = search => model.readState(search, {edition:localEdition});

function fallbackDocument(html) {
 const match = html.match(/<noscript(?:\s[^>]*)?>([\s\S]*?)<\/noscript>/i);
 assert.ok(match, 'the shell must retain a no-JavaScript projection');
 return new JSDOM(match[1]).window.document;
}
async function board(t, {edition = localEdition, search = '', data = catalog, fetchError = false} = {}) {
 const route = edition ? metadata.find(item => item.id === edition).route : '/jobs/';
 const html = jobsShell(sourceShell, data, edition || undefined);
 const dom = new JSDOM(html, {url:'https://pointcast.xyz' + route + search,runScripts:'outside-only'});
 t.after(() => dom.window.close());
 const {window} = dom;
 const historyCalls = [];
 for (const method of ['pushState','replaceState']) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (...args) => {historyCalls.push({method,url:args[2]});return original(...args);};
 }
 window.__opportunitiesModel = model;
 window.fetch = async () => {
  if (fetchError) throw new Error('fixture catalog unavailable');
  return {ok:true,json:async () => structuredClone(data)};
 };
 const script = boardSource.replace(/^import\s*\{([^}]+)\}\s*from\s*['"]\.\/model\.mjs['"];?\s*/m, 'const {$1} = window.__opportunitiesModel;\n')
  .replaceAll('import.meta.url', JSON.stringify('https://pointcast.xyz/opportunities/board.mjs'));
 assert.doesNotMatch(script, /^import\s/m, 'the source harness must replace the actual model import');
 await window.eval('(async () => {\n' + script + '\n})()');
 return {window,document:window.document,historyCalls,cardIds:() => [...window.document.querySelectorAll('#cards article')].map(card => card.dataset.recordId || card.querySelector('h3')?.id?.replace(/^title-/,'')),change:(id,value,type='change') => {const input=window.document.getElementById(id);input.value=value;input.dispatchEvent(new window.Event(type,{bubbles:true}));}};
}

test('edition URL choices are enumerated and round trip with the existing filters', () => {
 assert.deepEqual(model.editionIds, expectedEditionIds);
 assert.ok(model.kinds.includes('internship'));
 assert.ok(model.kinds.includes('trainee'));
 const state=model.readState('?edition=' + localEdition + '&q=local&kind=internship&origin=external&status=verified-current&listingState=active-listing');
 assert.equal(state.edition,localEdition);
 assert.deepEqual(model.readState(model.queryState(state)),state);
 for (const value of ['unknown','__proto__','javascript:alert(1)','<script>','../new-york-city']) assert.equal(model.readState('?edition=' + encodeURIComponent(value)).edition,'all');
 assert.equal(model.readState('?q=' + 'x'.repeat(250)).q.length,200);
});

test('a route-bound edition ignores tampered edition, site and network scope', () => {
 for (const query of ['', '?edition=' + otherEdition, '?edition=all&site=intern&network=1', '?edition=unknown&site=rally&network=0','?site=industrynext&network=1']) {
  const state=boundState(query);
  assert.equal(state.edition,localEdition);
  assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,state)),[...scopedIds].sort(),query);
  assert.equal(model.readState(model.queryState(state),{edition:localEdition}).edition,localEdition);
 }
});

test('edition membership uses record editionIds and permits an explicit shared record', () => {
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,model.readState('?edition=' + otherEdition))),['other-internship','shared-paid-role']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?q=shared'))),['shared-paid-role']);
 assert.equal(model.selectRows(catalog.opportunities,boundState('?q=Grok')).length,0);
 assert.equal(model.selectRows(catalog.opportunities,boundState('?q=New+York')).length,0);
 const wrongField={...additions[0],id:'malformed-edition-membership',editionIds:localEdition};
 assert.equal(model.selectRows([wrongField],boundState('')).length,0,'a string is not an editionIds membership array');
});

test('paid role, internship and trainee filters retain their distinct meaning', () => {
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?kind=paid-role'))),['local-internship','local-trainee','shared-paid-role']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?kind=internship'))),['local-availability-unknown','local-internship','local-unpaid-internship']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?kind=trainee'))),['local-trainee']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?kind=learning-program'))),['local-program-reference']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?status=verified-current'))),['local-internship','local-trainee','local-unpaid-internship','shared-paid-role']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?status=needs-reconfirmation'))),['local-availability-unknown','local-program-reference']);
});

test('employer listing-state filters separate active, program and unverified sources', () => {
 assert.deepEqual(model.listingStates,['all','active-listing','program-reference','availability-unknown']);
 assert.equal(boundState('?listingState=unknown').listingState,'all');
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?listingState=active-listing'))),['local-internship','local-trainee','local-unpaid-internship','shared-paid-role']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?listingState=program-reference'))),['local-program-reference']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?listingState=availability-unknown'))),['local-availability-unknown']);
 assert.deepEqual(sortedIds(model.selectRows(catalog.opportunities,boundState('?q=Undergraduate+enrollment'))),[...scopedIds].sort(),'expanded factual source details are searchable');
});

test('a distinct external application URL needs matching official application evidence', () => {
 const row=additions[0];
 assert.notEqual(row.externalApplicationUrl,row.sourceUrl);
 assert.equal(model.externalApplicationLink(row),row.externalApplicationUrl);
 for (const patch of [
  {origin:'internal'}, {sourceKind:'unverified'}, {status:'needs-reconfirmation'},
  {listingState:'program-reference'}, {listingState:'availability-unknown'},
  {availabilityVerifiedAt:null}, {availabilityVerifiedAt:'invalid'}, {applicationEvidence:null},
  {applicationEvidence:{...row.applicationEvidence,verified:false}},
  {applicationEvidence:{...row.applicationEvidence,sourceUrl:'https://other.example.test/'}},
  {applicationEvidence:{...row.applicationEvidence,applicationUrl:'https://other.example.test/'}},
  {applicationEvidence:{...row.applicationEvidence,checkedAt:'invalid'}},
  {applicationEvidence:{...row.applicationEvidence,observation:''}},
 ]) assert.equal(model.externalApplicationLink({...row,...patch}),null,JSON.stringify(patch));
 assert.equal(model.externalApplicationLink({...row,externalApplicationUrl:row.sourceUrl,applicationEvidence:null}),null,'new records cannot use the legacy xAI exception');
});

test('application evidence and the row check describe the same availability observation', () => {
 const row=additions[0],differentObservation='2026-10-07T11:30:00Z';
 for (const patch of [
  {applicationEvidence:{...row.applicationEvidence,checkedAt:differentObservation}},
  {applicationEvidence:{...row.applicationEvidence,checkedAt:'invalid'}},
  {availabilityVerifiedAt:differentObservation},
  {checkedAt:differentObservation},
  {checkedAt:'invalid'},
 ]) assert.equal(model.externalApplicationLink({...row,...patch}),null,JSON.stringify(patch));
 const sameInstant='2026-10-07T03:30:00-07:00';
 assert.equal(model.externalApplicationLink({...row,checkedAt:sameInstant,applicationEvidence:{...row.applicationEvidence,checkedAt:sameInstant}}),row.externalApplicationUrl,'equivalent timezone representations describe one observation');
 assert.equal(model.externalApplicationLink({...row,checkedAt:undefined}),row.externalApplicationUrl,'the optional row check does not replace required availability and evidence timestamps');
});

test('both source and application destinations must be safe HTTPS URLs', () => {
 const row=additions[0];
 for (const url of ['http://employer.example.test/','javascript:alert(1)','data:text/html,hello','https://user:secret@employer.example.test/','not a URL']) {
  assert.equal(model.externalApplicationLink({...row,sourceUrl:url,applicationEvidence:{...row.applicationEvidence,sourceUrl:url}}),null,url);
  assert.equal(model.externalApplicationLink({...row,externalApplicationUrl:url,applicationEvidence:{...row.applicationEvidence,applicationUrl:url}}),null,url);
 }
 for (const row of additions.filter(item => item.listingState !== 'active-listing')) assert.equal(model.externalApplicationLink(row),null);
});

test('the exact base xAI snapshot keeps its original official outbound link and closed intake', () => {
 assert.equal(baseCatalog.opportunities.length,25);
 assert.equal(baseCatalog.opportunities.filter(row => row.origin !== 'external').length,24);
 assert.equal(baseXai.title,'Creator & Community Program Lead — Grok Imagine');
 assert.equal(baseXai.sourceUrl,'https://job-boards.greenhouse.io/xai/jobs/5244173007');
 assert.equal(baseXai.checkedAt,'2026-10-07T00:28:29Z');
 assert.equal(model.externalApplicationLink(baseXai),baseXai.sourceUrl);
 assert.equal(model.canApply(baseXai),false);
 assert.deepEqual(catalog.opportunities.slice(0,25),baseCatalog.opportunities);
 assert.deepEqual(sortedIds(model.selectRows(baseCatalog.opportunities,model.readState('?q=Grok+Imagine&origin=external'))),[baseXai.id]);
 assert.equal(model.externalApplicationLink({...baseXai,id:'pretend-xai',applicationEvidence:null}),null,'the existing ID is part of the exact legacy exception');
});

test('edition shells bind metadata, share assets and reject unsupported or empty scope', () => {
 const html=jobsShell(sourceShell,catalog,localEdition);
 const dom=new JSDOM(html);const document=dom.window.document;
 assert.equal(document.body.dataset.edition,localEdition);
 assert.equal(document.querySelector('link[rel="canonical"]').href,'https://pointcast.xyz' + metadata[0].route);
 assert.ok(document.title.includes('El Segundo'));
 for (const file of ['board.css','board.mjs','catalog.json']) assert.ok(html.includes('/opportunities/' + file));
 assert.doesNotMatch(html,/(?:href|src)="\.\//);
 assert.throws(() => jobsShell(sourceShell,catalog,'unknown'));
 assert.throws(() => jobsShell(sourceShell,catalog,expectedEditionIds[2]));
 assert.throws(() => jobsShell(sourceShell,{...catalog,internshipEditions:[]},localEdition));
 assert.doesNotMatch(html,/<form|JobPosting|noindex|mailto:/);
 dom.window.close();
});

test('root edition navigation follows admitted catalog metadata and preserves xAI', () => {
 const html=jobsShell(sourceShell,catalog);
 const dom=new JSDOM(html);const document=dom.window.document;
 assert.equal(document.querySelector('link[rel="canonical"]').href,'https://pointcast.xyz/jobs/');
 for (const item of metadata.slice(0,2)) assert.ok([...document.querySelectorAll('a')].some(link => link.getAttribute('href') === item.route),item.route);
 for (const item of metadata.slice(2)) assert.equal([...document.querySelectorAll('a')].some(link => link.getAttribute('href') === item.route),false,'empty edition has no public navigation');
 assert.ok(html.includes(baseXai.sourceUrl));
 assert.ok(html.includes('Creator &amp; Community Program Lead'));
 dom.window.close();
});

test('no-JavaScript edition cards contain every scoped record and source terms', () => {
 const html=jobsShell(sourceShell,catalog,localEdition);
 const document=fallbackDocument(html);
 const cards=[...document.querySelectorAll('article[data-record-id]')];
 assert.deepEqual(cards.map(card => card.dataset.recordId).sort(),[...scopedIds].sort());
 for (const row of additions.filter(item => item.editionIds.includes(localEdition))) {
  const card=cards.find(card => card.dataset.recordId === row.id);
  assert.ok(card.querySelector('details'),'terms are available without JavaScript');
  assert.ok(card.querySelector('dl.source-details, .source-details dl'),'factual source details remain readable');
  for (const value of [row.title,row.description,row.compensation,row.terms,'Undergraduate enrollment','Documented official El Segundo worksite']) assert.ok(card.textContent.includes(value),row.id + ': ' + value);
  const apply=[...card.querySelectorAll('a')].find(link => link.href === row.externalApplicationUrl);
  assert.equal(Boolean(apply),Boolean(model.externalApplicationLink(row)),row.id);
 }
 assert.doesNotMatch(document.body.textContent,/Grok Imagine|New York internship/);
 assert.match(document.body.textContent,/not stated/i);
});

test('no-JavaScript factual source dictionaries and metadata are escaped', () => {
 const dangerous='<img src=x onerror="alert(1)">';
 const row=externalRow('escaped-fixture',[localEdition],{title:dangerous,employer:'<script>alert(1)</script>',sourceDetails:{fact:dangerous,unsafeUrl:'javascript:alert(1)',nested:{unknown:null,items:['One source fact',dangerous]}}});
 const data={...catalog,internshipEditions:[{...metadata[0],title:'<script>Bad title</script>',scope:dangerous}],opportunities:[row]};
 const html=jobsShell(sourceShell,data,localEdition);
 const document=fallbackDocument(html);
 assert.ok(document.body.textContent.includes(dangerous));
 assert.ok(document.body.textContent.includes('One source fact'));
 assert.equal(document.querySelectorAll('img,script').length,0);
 assert.equal([...document.querySelectorAll('a')].some(link => link.getAttribute('href')?.startsWith('javascript:')),false);
 assert.match(document.body.textContent,/not stated/i);
 assert.doesNotMatch(html,/<script>Bad title<\/script>/);
});

test('the DOM board stays in its bound edition after hostile query state', async t => {
 const b=await board(t,{search:'?edition=' + otherEdition + '&site=intern&network=1'});
 assert.deepEqual(b.cardIds().sort(),[...scopedIds].sort());
 assert.equal(b.document.body.dataset.edition,localEdition);
 assert.ok(b.document.title.includes('El Segundo'));
 assert.ok(b.document.getElementById('view-title').textContent.includes('El Segundo'));
 assert.ok([...b.document.querySelectorAll('[data-site]')].every(link => link.closest('[hidden]')),'brand switches are hidden on a bound edition');
 assert.ok(b.document.querySelector('.network-toggle').hidden);
 assert.equal(b.document.getElementById('result-count').textContent.includes('6'),true);
 b.change('q','Grok','input');
 assert.deepEqual(b.cardIds(),[]);
 assert.equal(b.document.getElementById('empty').hidden,false);
 assert.equal(b.historyCalls.at(-1).method,'replaceState');
 assert.equal(b.window.location.pathname,metadata[0].route);
 assert.equal(new URLSearchParams(b.window.location.search).get('edition'),localEdition);
});

test('search, filter history and both reset controls retain the bound edition', async t => {
 const b=await board(t);
 b.change('kind','trainee');
 assert.deepEqual(b.cardIds(),['local-trainee']);
 assert.equal(b.historyCalls.at(-1).method,'pushState');
 b.change('q','unmatched test phrase','input');
 assert.deepEqual(b.cardIds(),[]);
 assert.equal(b.historyCalls.at(-1).method,'replaceState');
 b.document.getElementById('clear').click();
 assert.deepEqual(b.cardIds().sort(),[...scopedIds].sort());
 assert.equal(b.document.getElementById('q').value,'');
 assert.equal(b.document.getElementById('kind').value,'all');
 b.change('status','verified-current');
 b.change('kind','internship');
 assert.deepEqual(b.cardIds().sort(),['local-internship','local-unpaid-internship']);
 b.document.getElementById('reset').click();
 assert.deepEqual(b.cardIds().sort(),[...scopedIds].sort());
 assert.equal(new URLSearchParams(b.window.location.search).get('edition'),localEdition);
 assert.equal(b.window.location.pathname,metadata[0].route);
});

test('popstate reparses filters while retaining route scope and honest program availability', async t => {
 const b=await board(t);
 b.window.history.pushState(null,'','?edition=' + otherEdition + '&site=rally&network=1&kind=learning-program');
 b.window.dispatchEvent(new b.window.PopStateEvent('popstate'));
 assert.deepEqual(b.cardIds(),['local-program-reference']);
 const program=b.document.querySelector('#cards article');
 assert.equal(program.querySelectorAll('.employer-apply').length,0);
 assert.doesNotMatch(program.querySelector('.badge')?.textContent || '',/Listing checked|Verified current/i);
 b.window.history.pushState(null,'','?edition=unknown&site=intern&status=needs-reconfirmation');
 b.window.dispatchEvent(new b.window.PopStateEvent('popstate'));
 assert.deepEqual(b.cardIds().sort(),['local-availability-unknown','local-program-reference']);
 assert.equal(b.document.querySelectorAll('#cards .employer-apply').length,0);
 assert.match(b.document.querySelector('#cards').textContent,/unverified|unknown|reference/i);
});

test('the employer-state DOM filter and its reset keep source facts and edition scope', async t => {
 const b=await board(t);
 b.change('listingState','program-reference');
 assert.deepEqual(b.cardIds(),['local-program-reference']);
 assert.equal(new URLSearchParams(b.window.location.search).get('listingState'),'program-reference');
 assert.equal(b.document.querySelectorAll('#cards .employer-apply').length,0);
 assert.match(b.document.querySelector('#cards .source-details').textContent,/Undergraduate enrollment/);
 assert.match(b.document.querySelector('#cards .source-details').textContent,/Not stated/);
 b.change('listingState','availability-unknown');
 assert.deepEqual(b.cardIds(),['local-availability-unknown']);
 assert.equal(new URLSearchParams(b.window.location.search).get('listingState'),'availability-unknown');
 assert.equal(b.document.querySelectorAll('#cards .employer-apply').length,0);
 b.document.getElementById('reset').click();
 assert.equal(b.document.getElementById('listingState').value,'all');
 assert.deepEqual(b.cardIds().sort(),[...scopedIds].sort());
 assert.equal(new URLSearchParams(b.window.location.search).get('edition'),localEdition);
});

test('root DOM search preserves the existing official xAI role', async t => {
 const b=await board(t,{edition:null,search:'?q=Grok+Imagine&origin=external'});
 assert.deepEqual(b.cardIds(),[baseXai.id]);
 const link=b.document.querySelector('#cards .employer-apply');
 assert.equal(link.href,baseXai.sourceUrl);
 assert.match(b.document.querySelector('#cards').textContent,/PointCast accepts no applications/);
 assert.equal(b.document.querySelectorAll('form').length,0);
});

test('a failed catalog fetch retains the source projection and reports an unavailable catalog', async t => {
 const b=await board(t,{fetchError:true});
 assert.equal(b.document.getElementById('result-count').textContent,'Edition unavailable');
 assert.equal(b.document.getElementById('empty').hidden,false);
 assert.match(b.document.getElementById('empty-note').textContent,/could not load/i);
 const document=fallbackDocument(b.document.documentElement.outerHTML);
 assert.equal(document.querySelectorAll('article[data-record-id]').length,scopedIds.length);
});
