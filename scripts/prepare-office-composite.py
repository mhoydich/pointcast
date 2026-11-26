"""Read-only pinned PR overlays for integration CI, never a production release."""
import hashlib, json, pathlib, urllib.request
root = pathlib.Path(__file__).resolve().parents[1]
rows = json.loads((root / 'docs/office/integration-dependencies.json').read_text())
for row in rows:
    sha = row['sha']
    assert len(sha) == 40 and all(c in '0123456789abcdef' for c in sha)
    for rel in row['paths']:
        assert rel.startswith(('public/office/', 'src/lib/office/')) and '..' not in rel.split('/')
        path = root / rel
        expected = row['sha256'][rel]
        if path.exists():
            if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                raise SystemExit('Existing owner file differs; refresh review lock: ' + rel)
            continue
        url = 'https://raw.githubusercontent.com/mhoydich/pointcast/' + sha + '/' + rel
        with urllib.request.urlopen(url, timeout=20) as response:
            content = response.read(262145)
        assert len(content) <= 262144
        if hashlib.sha256(content).hexdigest() != expected:
            raise SystemExit('Pinned content hash mismatch: ' + rel)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
print('Prepared pinned component/data dependencies for composite checks only.')
