"""Build Hem from official Nouns RLE traits plus an original beret overlay.

Run: python build_avatar.py
Requires Pillow. No image-generation model is used.
"""
from pathlib import Path
import hashlib
import json
import html
from urllib.request import urlopen
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'sources' / 'image-data.json'
EXPECTED = 'a03f22b7838b35fdf0332617c9b8e2b032eb26cf1632afbefb200fec64c4bc20'
SOURCE_URL = ('https://raw.githubusercontent.com/nounsDAO/nouns-monorepo/'
              '2213eea1c15f331f786784c2621d53bdecf907e2/packages/nouns-assets/src/image-data.json')
raw_source = SOURCE.read_bytes() if SOURCE.exists() else urlopen(SOURCE_URL, timeout=30).read()
assert hashlib.sha256(raw_source).hexdigest() == EXPECTED, 'Official source differs'
data = json.loads(raw_source)
seed = {'background': 1, 'body': 13, 'accessory': 73, 'head': 68, 'glasses': 15}
groups = [('bodies', 'body'), ('accessories', 'accessory'), ('heads', 'head'), ('glasses', 'glasses')]

def decode_trait(group, index):
    """Decode palette/top/right/bottom/left + run/color byte pairs."""
    encoded = data['images'][group][index]['data'].removeprefix('0x')
    raw = bytes.fromhex(encoded)
    palette, top, right, bottom, left = raw[:5]
    assert palette == 0 and 0 <= left < right <= 32
    result = []
    x, y = left, top
    for start in range(5, len(raw), 2):
        remaining, color = raw[start:start + 2]
        while remaining:
            width = min(remaining, right - x)
            assert width > 0 and y < 32
            if color:
                result.append((x, y, width, 1, '#' + data['palette'][color]))
            x += width
            remaining -= width
            if x == right:
                x, y = left, y + 1
    return result

base_rects = [(0, 0, 32, 32, '#' + data['bgcolors'][seed['background']])]
for group, field in groups:
    base_rects.extend(decode_trait(group, seed[field]))

# Original hand-authored pixel geometry; this is not an official Nouns trait.
ink, highlight = '#17171e', '#35323d'
beret = [
    (16, 0, 1, 2, ink),
    (11, 2, 10, 1, ink),
    (7, 3, 17, 1, ink),
    (5, 4, 20, 1, ink),
    (3, 5, 23, 1, ink),
    (3, 6, 22, 1, ink),
    (4, 7, 20, 1, ink),
    (5, 8, 17, 1, ink),
    (10, 9, 12, 1, ink),
    (10, 3, 8, 1, highlight),
    (6, 4, 4, 1, highlight),
]

traits = {field: data['images'][group][seed[field]]['filename'] for group, field in groups}
provenance = {
    'name': 'Hem — Loom poet',
    'kind': 'Nouns artwork remix, not an issued or numbered Noun NFT',
    'generation': 'Deterministic official RLE compositing; no generative AI image model',
    'seed': seed,
    'traits': traits,
    'official_source': 'https://pointcast.xyz/nouns-money/workshop/assets/image-data.json',
    'upstream_repository': 'https://github.com/nounsDAO/nouns-monorepo',
    'upstream_commit': '2213eea1c15f331f786784c2621d53bdecf907e2',
    'upstream_path': 'packages/nouns-assets/src/image-data.json',
    'source_sha256': EXPECTED,
    'artwork_license': 'Official Nouns artwork is CC0 / public domain',
    'custom_overlay': 'Original black beret in 32x32 pixel coordinates; list in build_avatar.py',
    'native_size': [32, 32],
    'output_size': [1024, 1024],
    'scale_method': 'nearest-neighbor',
}

def svg_rect(rect):
    x, y, w, h, color = rect
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>'

base_group = ''.join(map(svg_rect, base_rects))
beret_group = ''.join(map(svg_rect, beret))
metadata = html.escape(json.dumps(provenance, separators=(',', ':')))
svg = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" '
    'viewBox="0 0 32 32" shape-rendering="crispEdges" role="img" aria-labelledby="title desc">'
    '<title id="title">Hem, the beret-wearing Loom poet</title>'
    '<desc id="desc">Official Nouns dictionary head, red noggles, dark sweater and pocket pencil, '
    'with an original black beret overlay. A Nouns artwork remix.</desc>'
    f'<metadata>{metadata}</metadata>'
    f'<g id="official-nouns-traits">{base_group}</g>'
    f'<g id="custom-black-beret">{beret_group}</g></svg>'
)
(ROOT / 'hem-avatar.svg').write_text(svg)
image = Image.new('RGB', (32, 32))
draw = ImageDraw.Draw(image)
for x, y, w, h, color in base_rects + beret:
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=color)
image.resize((1024, 1024), Image.Resampling.NEAREST).save(ROOT / 'hem-avatar.png')
provenance['sha256_svg'] = hashlib.sha256((ROOT / 'hem-avatar.svg').read_bytes()).hexdigest()
provenance['sha256_png'] = hashlib.sha256((ROOT / 'hem-avatar.png').read_bytes()).hexdigest()
(ROOT / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
print(json.dumps({'seed': seed, 'traits': traits, 'source_sha256_verified': True}))
