from html.parser import HTMLParser
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1] / 'public/art/after-hours-2026-11-02'
originals = {
    'takeoff-organ-dusk-concept-v1.png': '80492e5a99441daab41546a0db3f9e6384c78b9e738b343c561221ddc8345351',
    'pointcast-earthquakes-field-guide-v1.png': '64de0309e0590ea89af477ac59e5b316ec5b3028a46d00a340a14e0724470394',
    'pointcast-housing-key-neighborhood-v1.png': '20fbd6771cae61bb4effd6b67d3647c6e44895b83d04116d8180ad77ed25834a',
}

class Gallery(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
        self.links = []
        self.noindex = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'img':
            self.images.append(attrs)
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name') == 'robots' and 'noindex' in attrs.get('content', ''):
            self.noindex = True

page = Gallery()
page.feed((root / 'index.html').read_text())
assert not page.noindex, 'Published gallery should be indexable'
assert len(page.images) == len(originals), 'Gallery must show exactly the three originals'
for name, expected_hash in originals.items():
    path = root / 'assets' / name
    assert hashlib.sha256(path.read_bytes()).hexdigest() == expected_hash, f'Original changed: {name}'
    src = f'assets/{name}'
    images = [i for i in page.images if i.get('src') == src]
    assert len(images) == 1 and images[0].get('alt'), f'Missing accessible image: {name}'
    assert src in page.links, f'Missing original-image link: {name}'
print('Gallery originals, accessible images and original-image links verified.')
