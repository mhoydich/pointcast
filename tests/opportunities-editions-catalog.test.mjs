import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {jobsShell} from '../src/lib/opportunities-shell.mjs';
import {editionIds,readState,selectRows,sourceDetailEntries,externalApplicationLink,canApply} from '../public/opportunities/model.mjs';
const sourceRepo=process.env.POINTCAST_SOURCE_REPO||process.cwd();
const {JSDOM}=createRequire(resolve(sourceRepo,'package.json'))('jsdom');
const catalog=JSON.parse(readFileSync(process.env.POINTCAST_CATALOG_PATH||new URL('../public/opportunities/catalog.json',import.meta.url),'utf8'));
const shell=readFileSync(new URL('../public/opportunities/index.html',import.meta.url),'utf8');
const sourceText=value=>value===null||value===undefined||value===''?'Not stated':typeof value==='boolean'?(value?'Yes':'No'):String(value);
const leaves=value=>Array.isArray(value)?value.flatMap(leaves):value&&typeof value==='object'?Object.values(value).flatMap(leaves):[sourceText(value)];

test('the admitted catalog provides all five nonempty shared edition projections',()=>{
 assert.equal(catalog.opportunities.filter(r=>r.origin!=='external').length,24);
 const projectState=readState('?project=internship-editions');
 assert.equal(projectState.project,'internship-editions');
 assert.deepEqual(selectRows(catalog.opportunities,projectState).map(r=>r.id).sort(),catalog.opportunities.filter(r=>r.project==='internship-editions').map(r=>r.id).sort());
 assert.ok(selectRows(catalog.opportunities,projectState).length>0);
 const projectControl=new JSDOM(shell).window.document.querySelector('#project option[value=internship-editions]');
 assert.equal(projectControl?.textContent,'Internship editions');
 projectControl.ownerDocument.defaultView.close();
 assert.equal(new Set(catalog.opportunities.map(r=>r.id)).size,catalog.opportunities.length);
 for(const id of editionIds){
  const edition=catalog.internshipEditions.find(e=>e.id===id);assert.ok(edition);
  const rows=selectRows(catalog.opportunities,readState('?edition=invalid&site=intern&network=1',{edition:id}));
  assert.ok(rows.length>0);assert.ok(rows.every(r=>r.editionIds.includes(id)));
  const html=jobsShell(shell,catalog,id),doc=new JSDOM(html).window.document;
  assert.equal(doc.body.dataset.edition,id);assert.equal(doc.querySelector('[rel=canonical]').href,'https://pointcast.xyz'+edition.route);
  const fallback=new JSDOM(doc.querySelector('noscript').innerHTML).window.document;
  assert.deepEqual([...fallback.querySelectorAll('article')].map(n=>n.dataset.recordId),catalog.opportunities.filter(r=>r.editionIds?.includes(id)).map(r=>r.id));
  for(const row of rows){
   const card=[...fallback.querySelectorAll('article')].find(n=>n.dataset.recordId===row.id);assert.ok(card);
   assert.ok(card.querySelector('details'));assert.ok(card.textContent.includes(row.terms));
   for(const value of leaves(row.sourceDetails))assert.ok(card.textContent.includes(value),row.id+' loses factual source value: '+value);
   const apply=card.querySelector('.employer-apply');assert.equal(apply?.href||null,externalApplicationLink(row));
   assert.equal(canApply(row),false);
   if(row.kind==='trainee')assert.match(card.querySelector('.card-top').textContent,/TRAINEE · SEPARATE FROM INTERNSHIPS/);
   if(row.listingState!=='active-listing')assert.equal(apply,null);
  }
  for(const note of [...edition.coverageNotes||[],...edition.methodologyCaveats||[]])assert.ok(doc.querySelector('.edition-method').textContent.includes(note));
  doc.defaultView.close();fallback.defaultView.close();
 }
});

test('all admitted active applications satisfy the official source evidence gate',()=>{
 const additive=catalog.opportunities.filter(r=>Array.isArray(r.editionIds));
 for(const r of additive){
  assert.equal(!!externalApplicationLink(r),r.status==='verified-current'&&r.listingState==='active-listing',r.id);
  assert.ok(sourceDetailEntries(r).length>0);
 }
 const nyc=additive.filter(r=>r.editionIds.includes('new-york-city-25mi'));
 for(const r of nyc)assert.equal(r.sourceDetails.geographyByEdition['new-york-city-25mi'].distanceMiles,null);
});
