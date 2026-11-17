#!/usr/bin/env python3
"""Read-only art checks: provenance, whole portraits, real XML, pixel-preserving crew embedding."""
from pathlib import Path
import hashlib, json, struct, xml.etree.ElementTree as ET
from PIL import Image
root = Path(__file__).resolve().parents[1]
folder = root / 'public/images/after-hours-art'
m = json.loads((folder/'manifest.json').read_text())
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
assert digest(root/m['source']['imageData']) == m['sourceSha256']
assert digest(root/m['seatSource']) == m['seatSourceSha256']
assert [s['slug'] for s in m['seats']] == ['mike','loom-desk','ada','sid','tess','lou']
assert len(m['assets']) == 9
for asset in m['assets']:
    svg = root/'public'/asset['svg'].lstrip('/')
    png = root/'public'/asset['png'].lstrip('/')
    assert digest(svg) == asset['svgSha256']
    assert digest(png) == asset['pngSha256']
    tree = ET.fromstring(svg.read_bytes())
    assert tree.tag == '{http://www.w3.org/2000/svg}svg'
    assert [int(tree.attrib[k]) for k in ['width','height']] == [asset['width'], asset['height']]
    assert png.read_bytes()[:8] == b'\x89PNG\r\n\x1a\n'
    assert struct.unpack('>II', png.read_bytes()[16:24]) == (asset['width'],asset['height'])
    for el in tree.iter():
        assert el.tag.split('}')[-1].lower() not in ['script','foreignobject','image','filter','clippath','mask','animate']
        assert not any(k.lower().startswith('on') or k.endswith('href') for k in el.attrib)
crew = Image.open(folder/'crew-sheet.png').convert('RGBA')
for i,seat in enumerate(m['seats']):
    native_svg = root/'public'/seat['svg'].lstrip('/')
    original_svg = root/'public'/seat['existingArt'].lstrip('/')
    assert native_svg.read_bytes() == original_svg.read_bytes(), seat['slug']+' SVG drift'
    native = Image.open(root/'public'/seat['png'].lstrip('/')).convert('RGBA')
    original = Image.open(original_svg.with_suffix('.png')).convert('RGBA')
    assert native.size == (320,320) and native.tobytes() == original.tobytes(), seat['slug']+' raster drift'
    x,y=40+(i%3)*400,70 if i<3 else 455
    assert crew.crop((x,y,x+320,y+320)).tobytes() == native.tobytes(), seat['slug']+' crew crop/clipping/recolour'
for name in ['cassette-sleeve','flag']:
    assert 'take nothing, leave maps' in (folder/(name+'.svg')).read_text()
print('PASS: 9 SVG/PNG hashes, XML/dimensions/safety; 6 native SVG+PNG matches; 6 crew crops pixel-identical; exact line.')
