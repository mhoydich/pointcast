// Bounded real Astro compiler/container render of the entire actual layout.
// Only unrelated imports are stubbed; props, destructure, template and scripts
// are retained. This is not a Vite build, font/child integration or browser test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=process.env.NMW_LAYOUT_SOURCE_ROOT
  ? pathToFileURL(resolve(process.env.NMW_LAYOUT_SOURCE_ROOT)+'/')
  : new URL('../',import.meta.url);
const require=createRequire(new URL('package.json',root));
const compiler=await import(pathToFileURL(require.resolve('@astrojs/compiler')));
const {experimental_AstroContainer}=await import(pathToFileURL(require.resolve('astro/container')));
const ts=require('typescript');
const runtime=pathToFileURL(require.resolve('astro/runtime/server/index.js')).href;
const source=await readFile(new URL('src/layouts/BlockLayout.astro',root),'utf8');
const routeSource=await readFile(new URL('src/pages/ues/currency-lab.astro',root),'utf8');
const rawLab=await readFile(new URL('src/components/ues-currency-lab/lab.html',root),'utf8');

function stubUnrelatedImports(fullSource){
  const match=fullSource.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match,'Actual layout must have one frontmatter block');
  const original=match[1];
  const componentNames=[];
  let front=original.replace(/^import (\w+) from '\.\.\/components\/[^']+\.astro';\r?$/gm,(_line,name)=>{componentNames.push(name);return `const ${name}=__fixtureChild;`;});
  assert.ok(componentNames.includes('FooterBar')&&componentNames.includes('TezosSessionBridge'));
  const replacements=[
    [/^import '@fontsource-variable\/(?:inter|jetbrains-mono)';\r?$/gm,''],
    [/^import \{ versionedImageUrl \} from '\.\.\/lib\/og-version\.mjs';\r?$/m,'const versionedImageUrl=(url)=>url;'],
    [/^import \{ pageCardUrl \} from '\.\.\/lib\/unfurl\/urls\.mjs';\r?$/m,"const pageCardUrl=(_path,_bucket,base)=>new URL('/fixture-card.png',base).href;"],
    [/^import \{ DISCOVERY_LINKS, SITE_DESCRIPTION, SITE_KEYWORDS, buildIdentityJsonLd \} from '\.\.\/lib\/seo';\r?$/m,"const DISCOVERY_LINKS=[], SITE_DESCRIPTION='Manifest fixture', SITE_KEYWORDS=['fixture']; const buildIdentityJsonLd=()=>({'@context':'https://schema.org','@type':'WebSite',name:'Fixture'});"],
    [/^import legacyStylesheet from '\.\.\/styles\/global\.css\?url';\r?$/m,"const legacyStylesheet='/fixture-legacy.css';"],
    [/^import \{ ClientRouter \} from 'astro:transitions';\r?$/m,'const ClientRouter=__fixtureChild;'],
  ];
  for(const [pattern,value]of replacements){assert.match(front,pattern,'Unrelated import binding changed; review fixture scope');front=front.replace(pattern,value);}
  assert.doesNotMatch(front,/^import\b/m,'Unexpected import must be explicitly reviewed, not executed');
  const stub=`import {createComponent as __fixtureCreate,render as __fixtureRender} from ${JSON.stringify(runtime)};\nconst __fixtureChild=__fixtureCreate(()=>__fixtureRender\`\`);\n`;
  // Replacing only the frontmatter import region leaves all actual prop/default
  // logic and the entire template, including manifest expression, unchanged.
  return fullSource.slice(0,match.index)+`---\n${stub}${front}\n---`+fullSource.slice(match[0].length);
}

async function compileFixture(text,filename){
  const compiled=await compiler.transform(text,{filename,internalURL:pathToFileURL(require.resolve('astro/compiler-runtime')).href,resultScopedSlot:true});
  assert.equal(compiled.diagnostics.filter(d=>d.severity===1).length,0,'Actual source must compile without errors');
  // Standard Vite steps omitted by the standalone compiler: erase TypeScript
  // and remove unused bundler metadata/style imports, including multi-line
  // hoisted-script metadata. Full layout source and template are unmodified.
  const emitted=compiled.code.replace(/,\s*createMetadata as \$\$createMetadata/,'').replace(/['"]astro\/runtime\/server\/index\.js['"]/g,JSON.stringify(runtime));
  const code=ts.transpileModule(emitted,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},transformers:{before:[()=>sf=>ts.factory.updateSourceFile(sf,sf.statements.filter(statement=>{
    if(ts.isImportDeclaration(statement)&&statement.moduleSpecifier.text.includes('?astro&type=style&'))return false;
    if(ts.isVariableStatement(statement)&&statement.declarationList.declarations.some(d=>ts.isIdentifier(d.name)&&d.name.text==='$$metadata'))return false;
    return true;
  }))]}}).outputText;
  await writeFile(filename,code);
  return (await import(pathToFileURL(filename))).default;
}

const manifests=html=>[...html.matchAll(/<link\b[^>]*\brel="manifest"[^>]*>/g)].map(m=>m[0]);
async function render(Component,props){
  const container=await experimental_AstroContainer.create();
  return container.renderToString(Component,{props,request:new Request('https://pointcast.xyz/manifest-fixture/')});
}

test('actual compiled BlockLayout defaults preserve manifest; false removes only its exact tag',async t=>{
  const temp=await mkdtemp(join(tmpdir(),'pointcast-layout-manifest-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const Layout=await compileFixture(stubUnrelatedImports(source),join(temp,'compiled-layout.mjs'));
  for(const variant of [{},{isolated:true},{legacy:true},{immersive:true}]){
    const props={title:'Manifest fixture',...variant};
    const normal=await render(Layout,props);
    const explicitTrue=await render(Layout,{...props,includeManifest:true});
    const optedOut=await render(Layout,{...props,includeManifest:false});
    assert.equal(normal,explicitTrue,'Omitted and explicit true must be byte-identical: '+JSON.stringify(variant));
    const links=manifests(normal);assert.equal(links.length,1);
    assert.match(links[0],/href="\/manifest\.webmanifest"/);
    assert.equal(manifests(optedOut).length,0);
    assert.equal(optedOut,normal.replace(links[0],''),'False may remove only the exact manifest tag: '+JSON.stringify(variant));
  }
});

test('actual compiled UES route passes false while unrelated existing callers do not opt out',async t=>{
  const temp=await mkdtemp(join(tmpdir(),'pointcast-ues-manifest-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const layoutFile=join(temp,'compiled-layout.mjs');
  await compileFixture(stubUnrelatedImports(source),layoutFile);
  assert.match(routeSource,/<BlockLayout\b[^>]*\bincludeManifest=\{false\}/);
  const fixture=routeSource
    .replace(/^import BlockLayout from '\.\.\/\.\.\/layouts\/BlockLayout\.astro';\r?$/m,`import BlockLayout from ${JSON.stringify(pathToFileURL(layoutFile).href)};`)
    .replace(/^import content from '\.\.\/\.\.\/components\/ues-currency-lab\/lab\.html\?raw';\r?$/m,`const content=${JSON.stringify(rawLab)};`);
  const Route=await compileFixture(fixture,join(temp,'compiled-route.mjs'));
  const html=await render(Route,{});
  assert.equal(manifests(html).length,0,'Actual UES route opt-out must reach the real layout');
  assert.match(html,/id="currency-lab"/);
  assert.match(html,/data-pc-isolated="true"/);
  // This test does not impose a policy on future callers: unchanged existing
  // route defaults are reviewed in the release diff and rendered above.
});
