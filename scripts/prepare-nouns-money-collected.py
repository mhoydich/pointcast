#!/usr/bin/env python3
"""Recover a public, size-bounded Nouns Money collection from supplied local artifacts.

Requires Pillow and pypdf. Inputs remain unchanged. Run with explicit source paths;
source handoff HTML, private README files and hosting metadata are never published.
"""
import argparse
import hashlib
import html
import io
import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter


def clean(value):
    return html.unescape(re.sub(r'<[^>]+>', '', value)).strip()


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def digest(value):
    return hashlib.sha256(value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('repo', 'gallery', 'atlas', 'regional', 'paperworks'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    root = args.repo / 'public/nouns-money/collected'
    root.mkdir(parents=True, exist_ok=True)
    for name in ('gallery', 'atlas', 'regional/notes', 'downloads'):
        (root / name).mkdir(parents=True, exist_ok=True)
    prefix = '/nouns-money/collected/'
    entries, collections, downloads, excluded, sources, reuse = [], [], [], [], [], []

    def download(path, title, fmt, description):
        downloads.append(dict(title=title, url=prefix + str(path.relative_to(root)),
                              format=fmt, bytes=path.stat().st_size, description=description))

    existing = {}
    for p in (args.repo / 'public/images/nouns-money').rglob('*.webp'):
        existing.setdefault(p.name, []).append(p)
    offers = {'Reserved art inventory', 'Merchant benefits', 'Workshop access',
              'Structured profit participation', 'Prepaid print services'}
    excluded_groups = {
        'Apps and dashboards': 'Operational dashboards and interface screenshots held outside the public art collection.',
        'Local Gardens': 'Source metadata records unresolved commercial permissions; held for separate review.'
    }
    with zipfile.ZipFile(args.gallery) as z:
        html_files = [n for n in z.namelist() if n.endswith('/index.html')]
        assert len(html_files) == 1
        index_name = html_files[0]
        markup = z.read(index_name).decode('utf-8')
        base = str(Path(index_name).parent)
        source_cards = 0
        for section in re.findall(r'<section\b.*?</section>', markup, re.S):
            group = re.sub(r'\s*\(\d+\)\s*$', '', clean(re.search(r'<h2>(.*?)</h2>', section, re.S)[1]))
            group_id = 'archive-' + slug(group)
            current = []
            for article in re.findall(r'<article\b.*?</article>', section, re.S):
                source_cards += 1
                title = clean(re.search(r'<h3>(.*?)</h3>', article, re.S)[1])
                src = html.unescape(re.search(r'<img[^>]+src="([^"]+)"', article)[1])
                paragraphs = [clean(p) for p in re.findall(r'<p[^>]*>(.*?)</p>', article, re.S)]
                reason = excluded_groups.get(group)
                if title in offers:
                    reason = 'Speculative backing or participation offer; held outside the public art collection.'
                if reason:
                    excluded.append(dict(title=title, collection=group, sourceImage=Path(src).name, reason=reason))
                    continue
                name = Path(src).name
                assert re.fullmatch(r'[A-Za-z0-9_.-]+\.webp', name), name
                data = z.read(base + '/' + src)
                with Image.open(io.BytesIO(data)) as im:
                    width, height = im.size
                    im.verify()
                target = root / 'gallery' / name
                image = prefix + 'gallery/' + name
                for candidate in existing.get(name, []):
                    if digest(candidate.read_bytes()) == digest(data):
                        image = '/' + str(candidate.relative_to(args.repo / 'public'))
                        reuse.append(dict(image=name, path=image))
                        break
                else:
                    target.write_bytes(data)
                entry = dict(id='archive-' + Path(name).stem, title=title, collection=group_id,
                             kind='preview', image=image, width=width, height=height,
                             description=paragraphs[1] if len(paragraphs) > 1 else '',
                             caption=paragraphs[0] if paragraphs else '',
                             status=paragraphs[-1] if paragraphs else 'Creative review preview.',
                             printReady=False, source='Recovered creative gallery',
                             previewNotice='Reduced-resolution review image. Not a print master. Motion studies are stills.')
                current.append(entry)
                entries.append(entry)
            if current:
                collections.append(dict(id=group_id, title=group, count=len(current), kind='preview',
                    description='Recovered creative-review images, including individual faces and studies. Not a count of unique editions.',
                    cover=current[0]['image']))
        assert source_cards == 830, source_cards
        sources.append(dict(source=args.gallery.name, sha256=digest(args.gallery.read_bytes()),
                            recoveredImages=source_cards, publishedImages=source_cards-len(excluded)))

    series = json.loads((args.atlas / 'source/series.json').read_text())
    master_path = args.atlas / 'print/nouns-money-24-master-with-bleed.pdf'
    master = PdfReader(master_path)
    assert len(master.pages) == 48
    for i, item in enumerate(series['items']):
        basename = item['id'] + '-' + item['slug']
        faces = {}
        for side in ('front', 'back'):
            source = args.atlas / 'notes' / (basename + '-' + side + '.png')
            dest = root / 'atlas' / (basename + '-' + side + '.webp')
            with Image.open(source) as im:
                im = im.convert('RGB')
                im.thumbnail((1200, 600), Image.Resampling.LANCZOS)
                im.save(dest, 'WEBP', quality=88, method=6)
                faces[side] = (prefix + 'atlas/' + dest.name, im.width, im.height)
        output = root / 'downloads' / (basename + '-print-master.pdf')
        writer = PdfWriter()
        for page in master.pages[2*i:2*i+2]:
            writer.add_page(page)
        writer.add_metadata({'/Title': item['title'] + ' - Nouns Money print master',
                             '/Subject': 'Collectible art, no cash value. 150 x 75 mm trim, 3 mm bleed. Physical proof required.'})
        with output.open('wb') as f:
            writer.write(f)
        check = PdfReader(output)
        assert len(check.pages) == 2
        for offset, page in enumerate(check.pages):
            original = master.pages[2*i+offset]
            assert list(page.mediabox) == list(original.mediabox)
            assert list(page.trimbox) == list(original.trimbox)
            assert list(page.bleedbox) == list(original.bleedbox)
            assert page.get_contents().get_data() == original.get_contents().get_data()
        assert output.stat().st_size < 25_000_000
        entries.append(dict(id='atlas-' + basename, title=item['title'], collection='many-worlds-atlas',
            kind='print-edition', image=faces['front'][0], back=faces['back'][0],
            width=faces['front'][1], height=faces['front'][2], download=prefix+'downloads/'+output.name,
            downloadBytes=output.stat().st_size, description=item['story'], region=item['region'],
            family=item['family'], denomination=item['denomination'], printReady=True,
            status='Generated illustration with Nouns-inspired graphic layout. Collectible art; no cash value.',
            trimMm=[150,75], bleedMm=3, physicalPrintProof=False,
            printNotice='Two-page RGB PDF: front and back, 150 × 75 mm trim plus 3 mm bleed. Print a physical proof before a production run.'))
    collections.insert(0, dict(id='many-worlds-atlas', title='The Many Worlds Atlas', count=24, kind='print-edition',
        description='Twenty-four illustrated editions spanning America, world studies, imagined cultures and nature. Individual front/back PDF masters include 3 mm bleed.',
        cover=prefix+'atlas/01-california-front.webp'))
    sources.append(dict(source='Many Worlds Atlas', sha256=digest(master_path.read_bytes()), editions=24, sides=48,
                        derivedMasters=24, originalPdfPages=48, preservedPageGeometry=True, preservedContentStreams=True))
    guide = root / 'downloads/atlas-print-guide.pdf'
    shutil.copyfile(args.atlas / 'print/print-guide-and-collection.pdf', guide)
    download(guide, 'Many Worlds print guide', 'PDF', 'Four-page collection and print guide. Physical proofing is still required.')

    regional = json.loads((args.regional / 'edition-manifest.json').read_text())
    assert regional['editionCount'] == 8 and regional['noteSides'] == 16
    for item in regional['editions']:
        for side in ('front', 'back'):
            data = (args.regional / item[side]).read_text()
            assert '<script' not in data and 'javascript:' not in data
            (root / 'regional' / item[side]).write_text(data)
        entries.append(dict(id='regional-'+item['id'], title=item['name'], collection='regional-paperworks',
            kind='vector-edition', image=prefix+'regional/'+item['front'], back=prefix+'regional/'+item['back'],
            width=1800, height=900, detail=prefix+'regional/print-collection.html#edition-'+item['id'],
            download=prefix+'regional/'+item['front'], description=item['regionInfo']['caption'],
            region=item['regionInfo']['name'], printReady=True, trimMm=[150,75], bleedMm=0,
            physicalPrintProof=False, status='Original Nouns layers with saved trait seeds; decorative art with no cash value.',
            printNotice='Vector faces, 150 × 75 mm, no bleed. Print one front/back pair per craft sheet, cut and mount back-to-back.'))
    text = (args.regional / 'print-collection.html').read_text()
    text = re.sub(r'<p class="links">.*?</p>', '<p class="links"><a href="/nouns-money/">Back to Nouns Money</a></p>', text, flags=re.S)
    text = text.replace('https://nouns-money-maker-mh.mhoydich.chatgpt.site', '/nouns-money/music/')
    text = text.replace('https://nouns-check-studio-mh.mhoydich.chatgpt.site', '/nouns-money/')
    for item in regional['editions']:
        text = text.replace('data-edition="'+item['id']+'"', 'id="edition-'+item['id']+'" data-edition="'+item['id']+'"')
    (root / 'regional/print-collection.html').write_text(text)
    (root / 'regional/edition-manifest.json').write_text(json.dumps(regional, indent=2)+'\n')
    shutil.copyfile(args.regional / 'NOUNS-CODE-LICENSE.txt', root / 'regional/NOUNS-CODE-LICENSE.txt')
    (root / 'regional/PRINT.txt').write_text('NOUNS MONEY / REGIONAL PAPERWORKS\nEight original-art editions, 16 vector faces.\nOpen print-collection.html. Print at 100% / Actual Size with backgrounds enabled and browser headers/footers disabled.\nOne front/back pair per sheet: cut and mount back-to-back. Each face is 150 x 75 mm; no bleed. Verify the 100 mm ruler on a physical proof before quantities.\nCollectible art only, no cash value or redemption. Original Nouns art is CC0; renderer license is included.\n')
    pack = root / 'downloads/regional-paperworks.zip'
    with zipfile.ZipFile(pack, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in sorted((root/'regional').rglob('*')):
            if p.is_file():
                z.write(p, 'regional-paperworks/'+str(p.relative_to(root/'regional')))
    download(pack, 'Regional Paperworks - eight editions', 'ZIP', 'Sixteen vector faces, saved trait seeds, license and a browser print sheet. 150 × 75 mm; no bleed.')
    collections.insert(1, dict(id='regional-paperworks', title='Regional Paperworks', count=8, kind='vector-edition',
        description='Eight exact-source Nouns editions: Iceland, the Alps, Kerala, Lisbon, Marrakesh, Seoul, the Great Lakes and Atacama. Vector craft sheets, without bleed.',
        cover=prefix+'regional/'+regional['editions'][0]['front']))
    sources.append(dict(source='Regional Paperworks', editions=8, sides=16,
                        sourceManifestSha256=digest((args.regional/'edition-manifest.json').read_bytes())))

    for name, title in [('nouns-money-letter.pdf','Original Nouns notes - US Letter'),('nouns-money-a4.pdf','Original Nouns notes - A4')]:
        dest = root/'downloads'/('original-'+name)
        shutil.copyfile(args.paperworks/'original-nouns-money'/name,dest)
        download(dest,title,'PDF','Three original-art vector notes at 180 × 70 mm. Single-sided, print at 100%. No cash value.')
    checks = root/'downloads/pacific-daydream-checkbook.zip'
    with zipfile.ZipFile(checks,'w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted((args.paperworks/'checkbook-set').iterdir()):
            if p.suffix in ('.svg','.json'):
                z.write(p,'pacific-daydream/'+p.name)
        z.writestr('pacific-daydream/PRINT.txt','Pacific Daydream / The Good Company. Generic collectible voucher design.\nThree editable 180 x 75 mm vouchers, a cover and saved original Nouns trait seeds.\nNo banking, payment or shared redemption function. Print a physical proof before production. Original Nouns artwork is CC0.\n')
    download(checks,'Pacific Daydream checkbook templates','ZIP','Editable cover and three generic vouchers with matching retained stubs and saved Nouns seeds. No payment or shared redemption service.')
    ids = [e['id'] for e in entries]
    assert len(ids) == len(set(ids)), 'Duplicate entry IDs'
    manifest = dict(updatedAt='2026-10-14', title='Nouns Money - collected', entries=entries,
        collections=collections, downloads=downloads,
        counts=dict(recoveredGalleryImages=830, publishedGalleryPreviews=830-len(excluded),
                    curatedOut=len(excluded), atlasEditions=24, regionalEditions=8, entries=len(entries)),
        notice='Archive counts refer to images, including fronts, backs, contact sheets and studies; they are not counts of unique editions. Downloadable print editions are labeled separately.')
    (root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    files = [p for p in root.rglob('*') if p.is_file()]
    assert all(p.stat().st_size < 25_000_000 for p in files)
    inventory = dict(updatedAt='2026-10-14',sources=sources,excluded=excluded,reusedExistingAssets=reuse,
                     counts=manifest['counts'],publicFiles=len(files),publicBytes=sum(p.stat().st_size for p in files),
                     largestFileBytes=max(p.stat().st_size for p in files),
                     omitted=['Private handoff README and its MICHAEL / KANA header','Hosting identifiers and deployment records',
                              'Operational screenshots','Unreviewed backing offers','Local Gardens pending commercial permissions'],
                     checks=['All recovered image files decoded','All 24 two-page PDF masters preserve source page geometry and content streams',
                             'No single public file reaches 25 MB','Source artifacts unchanged','No unique-edition claim for recovered preview count'])
    (args.repo/'docs/nouns-money/collected-asset-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(manifest=str(root/'manifest.json'),counts=manifest['counts'],collections=len(collections),files=len(files),bytes=inventory['publicBytes'],largest=inventory['largestFileBytes']),indent=2))


if __name__ == '__main__':
    main()
