"""Package finite compiled QA inputs, excluding server/runtime and private output."""
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys

work = pathlib.Path(sys.argv[1]).resolve()
dist = work/'dist'
out = work/'cohort-qa-artifact'
assert dist.is_dir() and not out.exists(), 'fresh compiled output required'
required = ['coastal-signal-wallet/index.html', 'moon/index.html', 'sun/index.html', 'pacific/index.html', 'air/index.html', 'agents/index.html', 'agents/spec/index.html', 'ues/prediction-markets/index.html', 'reading/animation/index.html', 'reading/animation/avatar-the-last-airbender/index.html', 'reading/animation/hanna-barbera/index.html', 'reading/animation/saturday-morning-1980s/index.html', 'moon.json', 'sun.json', 'pacific.json', 'air.json', 'observatory/fonts.css', 'observatory/observatory.css', 'observatory/observatory.js', 'observatory/report.schema.json', 'observatory/moon-sun-research.json', 'observatory/pacific-air-research.json', 'agents/event.schema.json', 'agents/draft.json', 'favicon.svg']
files = set(required)
assert (dist/'_astro').is_dir(), 'Astro dependencies required'
for directory in ['_astro', 'fonts']:
    root = dist/directory
    if root.exists():
        for item in root.rglob('*'):
            assert not item.is_symlink(), 'symlink dependency rejected'
            if item.is_file(): files.add(item.relative_to(dist).as_posix())
assert any(x.startswith('_astro/') and x.endswith('.js') for x in files), 'compiled scripts required'
assert any(x.startswith('_astro/') and x.endswith('.css') for x in files), 'compiled styles required'
assert any(x.endswith('.woff2') for x in files), 'compiled local fonts required'
manifest=[]
for name in sorted(files):
    source=dist/name
    assert source.is_file() and not source.is_symlink(), 'missing/unsafe dependency: '+name
    assert source.resolve().is_relative_to(dist), 'dependency escaped dist'
    for parent in source.parents:
        if parent==dist: break
        assert not parent.is_symlink(), 'symlink parent rejected'
    data=source.read_bytes(); target=out/name; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(data)
    manifest.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
assert sum(x['bytes'] for x in manifest)<180_000_000, 'bounded artifact exceeded'
git=lambda *args: subprocess.check_output(['git','-C',str(work),*args],text=True).strip()
record={'schema':'pointcast.cohort-compiled-artifact/v1','head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),'build':'npm run build:bare','requiredPaths':required,'files':manifest,'fileCount':len(manifest),'totalBytes':sum(x['bytes'] for x in manifest),'scope':'Compiled target HTML, explicit public data/assets, complete local Astro/font dependencies; excludes backend/runtime and unrelated navigation destinations.'}
(out/'manifest.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({'head':record['head'],'tree':record['tree'],'files':len(manifest),'bytes':record['totalBytes']}))
