#!/usr/bin/env python3
"""Build review PDF suffixes and a manifest from the original Atlas and its WebP patch proofs.

First run prepare-nouns-money-atlas-web-patches.py OUTPUT. Then run this script
with the same OUTPUT. Requires PyMuPDF. --full-pdfs also keeps the assembled
candidate masters. The published source prints and web faces are inputs only.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import tempfile
import xml.etree.ElementTree as ET

import fitz


ROOT = Path(__file__).resolve().parents[1]
COLLECTION = Path('public/nouns-money/collected')
PORTRAITS = Path('public/images/nouns-money')
SIDES = ('front', 'back')
# Positions in the 1200 × 600 trim preview, top-left origin.
STAMP = {'front': (58, 26, 84), 'back': (1066, 70, 60)}
PATCH_BOX = {'front': (26, 24, 148, 88), 'back': (1018, 68, 156, 66)}
# This isolated path (including its two cut-outs) occurs once per audited side.
MARK_PATH = (
    b'n 450 100 m 500 100 l 500 0 l 800 0 l 800 300 l 500 300 l 500 150 l '
    b'450 150 l 450 300 l 150 300 l 150 150 l 50 150 l 50 250 l 0 250 l '
    b'0 100 l 150 100 l 150 0 l 450 0 l 450 100 l h 550 250 m 650 250 l '
    b'650 50 l 550 50 l h 200 250 m 300 250 l 300 50 l 200 50 l h'
)
MARK_MATRIX = {
    'front': b'.060236 0 0 -0.060236 19.84252 202.3228 cm',
    'back': b'.06378 0 0 -0.06378 371.3386 194.8819 cm',
}
COLOR = rb'(?:0|1|\.[0-9]+)(?: (?:0|1|\.[0-9]+)){2} rg'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_portrait(repo):
    folder = repo / PORTRAITS
    source = folder / 'noun-0000-original.svg'
    provenance = json.loads((folder / 'provenance.json').read_text())
    entry = next(x for x in provenance['artworks'] if x['noun_id'] == 0)
    data = source.read_bytes()
    if sha(data) != entry['sha256_svg'] or not entry['official_trait_pixel_match']:
        raise ValueError('Noun 0 source differs from its verified provenance')
    svg = ET.fromstring(data)
    if svg.attrib.get('viewBox') != '0 0 320 320':
        raise ValueError('Unexpected Noun 0 viewBox')
    commands = []
    for rect in svg:
        if rect.tag != '{http://www.w3.org/2000/svg}rect':
            raise ValueError('Unexpected shape in Noun 0')
        fill = rect.attrib['fill']
        if not re.fullmatch(r'#[0-9A-Fa-f]{6}', fill):
            raise ValueError('Unexpected Noun 0 fill')
        rgb = [int(fill[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        values = [rect.get('x', '0'), rect.get('y', '0'), rect.attrib['width'], rect.attrib['height']]
        x, y, w, h = [320 if s == '100%' else int(s) for s in values]
        # PDF rectangles use the same SVG coordinate system under the outer y-flip.
        commands.append(' '.join(f'{c:.8f}' for c in rgb) + f' rg {x} {y} {w} {h} re f')
    return '\n'.join(commands), sha(data)


def replace_mark(doc, page, side, portrait):
    trim = page.trimbox
    if (page.rotation != 0 or len(page.get_contents()) != 1 or
            abs(trim.width - 150 * 72 / 25.4) > .01 or abs(trim.height - 75 * 72 / 25.4) > .01):
        raise ValueError(f'{side}: unexpected orientation, stream count or trim box')
    stream_id, = page.get_contents()
    stream = doc.xref_stream(stream_id)
    mark = re.compile(rb'(?m)^q\r?\n' + re.escape(MARK_MATRIX[side]) + rb'\r?\n'
                      + COLOR + rb'\r?\n' + re.escape(MARK_PATH) + rb'\r?\nf\*\r?\nQ(?=\r?$)')
    if len(mark.findall(stream)) != 1 or stream.count(MARK_PATH) != 1:
        raise ValueError(f'{side}: unique standalone mark and its expected transform not found')
    x, y, size = STAMP[side]
    # Convert the desired top-left trim pixel to a native PDF point.
    tl = fitz.Point(trim.x0 + x * trim.width / 1200, trim.y0 + y * trim.height / 600)
    origin = tl * ~page.transformation_matrix
    sx = size * trim.width / 1200 / 320
    sy = size * trim.height / 600 / 320
    stamp = (f'q\n{sx:.10f} 0 0 {-sy:.10f} {origin.x:.8f} {origin.y:.8f} cm\n'
             + portrait + '\nQ').encode('ascii')
    doc.update_stream(stream_id, mark.sub(lambda _: stamp, stream, count=1))


def geometry(page):
    return tuple(tuple(box) for box in (page.mediabox, page.cropbox, page.trimbox, page.bleedbox))


def make_pdf(source, work_path, portrait):
    original = source.read_bytes()
    work_path.write_bytes(original)
    with fitz.open(work_path) as doc:
        if doc.page_count != 2 or not doc.can_save_incrementally():
            raise ValueError('Expected a native two-page incremental PDF')
        for page, side in zip(doc, SIDES):
            replace_mark(doc, page, side, portrait)
        # Keep the original trailer ID so two runs using the same inputs produce the same file.
        doc.save(work_path, incremental=True, no_new_id=True, encryption=fitz.PDF_ENCRYPT_KEEP)

    result = work_path.read_bytes()
    if not result.startswith(original) or len(result) == len(original):
        raise ValueError('Candidate is not the original plus one incremental update')
    with fitz.open(stream=original, filetype='pdf') as old, fitz.open(work_path) as new:
        for before, after in zip(old, new):
            if (geometry(before) != geometry(after) or before.get_text() != after.get_text()
                    or before.get_images() != after.get_images() or MARK_PATH in after.read_contents()):
                raise ValueError('PDF page failed geometry, text, artwork or mark-removal verification')
    return original, result


def face_info(folder, output, slug, side, web_patches):
    filename = f'{slug}-{side}.webp'
    patch_ref = f'patches/{slug}-{side}.png'
    web = web_patches[slug][side]
    bounds = [web[name] for name in ('x', 'y', 'width', 'height')]
    if tuple(bounds) != PATCH_BOX[side] or web['path'] != patch_ref:
        raise ValueError(f'{side}: Web patch geometry does not match the audited region')
    png = (output / patch_ref).read_bytes()
    if (png[:8] != b'\x89PNG\r\n\x1a\n' or
            (int.from_bytes(png[16:20], 'big'), int.from_bytes(png[20:24], 'big')) != tuple(bounds[2:])):
        raise ValueError(f'{side}: Web patch missing or unexpected PNG dimensions')
    return dict(zip(('x', 'y', 'width', 'height'), bounds),
                source=f'/nouns-money/collected/atlas/{filename}',
                sourceSha256=sha((folder / 'atlas' / filename).read_bytes()),
                patch=patch_ref, patchSha256=sha(png))


def write_candidate(entry, folder, output, work, portrait, web_patches, keep_pdf):
    slug = entry['id'].removeprefix('atlas-')
    if not re.fullmatch(r'[0-9]{2}-[a-z0-9-]+', slug) or entry.get('width') != 1200 or entry.get('height') != 600:
        raise ValueError('Unrecognized Atlas identity or preview dimensions')
    filename = f'{slug}-print-master.pdf'
    if entry['download'] != f'/nouns-money/collected/downloads/{filename}':
        raise ValueError('Unrecognized master source path')

    faces = {side: face_info(folder, output, slug, side, web_patches) for side in SIDES}
    temp_pdf = work / filename
    original, result = make_pdf(folder / 'downloads' / filename, temp_pdf, portrait)
    suffix = result[len(original):]
    patch_ref = f'patches/{slug}.bin'
    (output / patch_ref).write_bytes(suffix)
    if keep_pdf:
        (output / 'pdfs' / filename).write_bytes(result)
    pdf = dict(source=entry['download'], patch=patch_ref, patchSha256=sha(suffix),
               sourceBytes=len(original), resultBytes=len(result), sourceSha256=sha(original), resultSha256=sha(result))
    return dict(id=entry['id'], title=entry['title'], **faces, pdf=pdf)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path, help='separate proof folder containing the Web patches')
    parser.add_argument('--repo', type=Path, default=ROOT)
    parser.add_argument('--full-pdfs', action='store_true', help='retain assembled PDFs alongside suffixes')
    args = parser.parse_args()
    repo = args.repo.resolve()
    folder = repo / COLLECTION
    output = args.output.resolve()
    if output == folder or folder in output.parents or output == repo or output in folder.parents:
        parser.error('Choose a candidate folder separate from the repository and original collection roots')
    web_path = output / 'web-patches.json'
    if not web_path.exists():
        parser.error('First run prepare-nouns-money-atlas-web-patches.py with this output directory')
    web_patches = json.loads(web_path.read_text())
    portrait, portrait_sha = load_portrait(repo)
    catalog = json.loads((folder / 'manifest.json').read_text())
    entries = [e for e in catalog['entries'] if e['collection'] == 'many-worlds-atlas']
    if len(entries) != 24 or len({e['id'] for e in entries}) != 24:
        parser.error('Expected 24 unique Atlas editions')
    (output / 'patches').mkdir(parents=True, exist_ok=True)
    if args.full_pdfs:
        (output / 'pdfs').mkdir(exist_ok=True)
    manifest = dict(
        status='Candidate artwork for desk review',
        portrait=dict(id=0, svg='/images/nouns-money/noun-0000-original.svg', sha256=portrait_sha),
        editions=[], inspectionRequired=[])
    with tempfile.TemporaryDirectory() as temp:
        for entry in entries:
            try:
                proof = write_candidate(entry, folder, output, Path(temp), portrait, web_patches, args.full_pdfs)
                manifest['editions'].append(proof)
            except (ValueError, KeyError, OSError, RuntimeError) as exc:
                manifest['inspectionRequired'].append(dict(id=entry['id'], reason=str(exc)))
    (output / 'proofs.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f"{len(manifest['editions'])} candidate editions, {len(manifest['inspectionRequired'])} require inspection")
    return bool(manifest['inspectionRequired'])


if __name__ == '__main__':
    raise SystemExit(main())
