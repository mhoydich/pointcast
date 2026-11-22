#!/usr/bin/env python3
"""Prepare lossless Noun 0 proof overlays for the original 24 Many Worlds Atlas WebP pairs.

Run with Python 3 and Pillow: python scripts/prepare-nouns-money-atlas-web-patches.py OUTPUT_DIR
Coordinates use the 1200 × 600 web face and the matching PDF TrimBox, measured from the top left.
"""
import argparse
import json
from pathlib import Path
from statistics import median
from xml.etree import ElementTree

from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parents[1] / 'public'
ATLAS = PUBLIC / 'nouns-money/collected/atlas'
NOUN = PUBLIC / 'images/nouns-money/noun-0000-original.svg'
# The wider patch carries the original paper and clears the standalone glasses.
# The square is the complete, uncropped canonical artwork, including its background.
FACES = {
    'front': {
        'patch': (26, 24, 174, 112),
        'clear': (26, 47, 174, 110),
        'swatches': (18, 180),
        'square': (58, 26, 142, 110),
    },
    'back': {
        'patch': (1018, 68, 1174, 134),
        'clear': (1018, 68, 1174, 134),
        'swatches': (1008, 1180),
        'square': (1066, 70, 1126, 130),
    },
}


def original_noun():
    """Render the original crisp-edged rects in SVG drawing order."""
    svg = ElementTree.parse(NOUN).getroot()
    if svg.get('viewBox') != '0 0 320 320':
        raise ValueError(f'Unexpected Noun 0 viewBox in {NOUN}')
    image = Image.new('RGB', (320, 320))
    for rect in svg:
        if rect.tag != '{http://www.w3.org/2000/svg}rect':
            raise ValueError(f'Unsupported SVG element {rect.tag}')
        x, y = int(rect.get('x', 0)), int(rect.get('y', 0))
        w = 320 if rect.get('width') == '100%' else int(rect.attrib['width'])
        h = 320 if rect.get('height') == '100%' else int(rect.attrib['height'])
        image.paste(rect.attrib['fill'], (x, y, x + w, y + h))
    return image


def make_patch(source, geometry, noun):
    x0, y0, x1, y1 = geometry['patch']
    patch = source.crop((x0, y0, x1, y1))
    left, top, right, bottom = geometry['clear']
    draw = ImageDraw.Draw(patch)
    # Sample five untouched pixels on both sides of the old glyph at the same y.
    # This preserves edition-specific paper and the slight variation near the back masthead.
    for y in range(top, bottom):
        samples = [source.getpixel((x, y)) for x0_sample in geometry['swatches']
                   for x in range(x0_sample, x0_sample + 5)]
        paper = tuple(round(median(channel)) for channel in zip(*samples))
        draw.line((left - x0, y - y0, right - 1 - x0, y - y0), fill=paper)
    l, t, r, b = geometry['square']
    stamp = noun.resize((r - l, b - t), Image.Resampling.NEAREST)
    patch.paste(stamp, (l - x0, t - y0))
    return patch


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output_dir', type=Path)
    args = parser.parse_args()
    patches = args.output_dir / 'patches'
    fronts = sorted(ATLAS.glob('*-front.webp'))
    backs = sorted(ATLAS.glob('*-back.webp'))
    stems = [p.stem.removesuffix('-front') for p in fronts]
    if len(stems) != 24 or [p.stem.removesuffix('-back') for p in backs] != stems:
        raise ValueError(f'Expected the 24 front/back pairs in {ATLAS}')
    noun = original_noun()
    patches.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for stem in stems:
        manifest[stem] = {}
        for side, geometry in FACES.items():
            name = f'{stem}-{side}'
            with Image.open(ATLAS / f'{name}.webp') as webp:
                if webp.size != (1200, 600):
                    raise ValueError(f'Unexpected face dimensions for {name}: {webp.size}')
                source = webp.convert('RGB')
            patch = make_patch(source, geometry, noun)
            out = patches / f'{name}.png'
            patch.save(out, optimize=True)
            x, y, _, _ = geometry['patch']
            manifest[stem][side] = {
                'sourceWidth': source.width, 'sourceHeight': source.height,
                'x': x, 'y': y, 'width': patch.width, 'height': patch.height,
                'path': out.relative_to(args.output_dir).as_posix(),
            }
    (args.output_dir / 'web-patches.json').write_text(
        json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared {2 * len(stems)} lossless patches in {patches}')


if __name__ == '__main__':
    main()
