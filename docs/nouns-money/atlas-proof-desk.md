# Many Worlds Atlas proof desk

Open `/nouns-money/atlas-proof/` in the review build. Pick an edition and a side to compare the published art with the candidate. Download the displayed side as a full-resolution PNG, or choose **Prepare candidate PDF** to assemble both print pages. Once the checksum matches, **Download verified candidate** becomes available. Pacific Bloom's [front](../../public/nouns-money/atlas-proof/samples/01-california-front.png) and [back](../../public/nouns-money/atlas-proof/samples/01-california-back.png) can be viewed directly in GitHub.

The [strategy desk](https://pointcast.xyz/loom?to=loom%3Acf41d135c8ff2ace12f59c78%23m_4c1z3o2q1c) wants whole Nouns in place of the standalone corner glasses. These review proofs use the same complete Noun #0 as a printer’s mark across 24 editions. Its colors and pixel shapes come from the [original SVG](../../public/images/nouns-money/noun-0000-original.svg) and the collection's [provenance record](../../public/images/nouns-money/provenance.json). Michael Hoydich / Currency Builder is credited in the original artwork.

## Rebuild the candidates

From the repository root, run the following with Python 3, Pillow, and PyMuPDF. The scripts read the current catalog and write to a separate output directory.

```sh
python scripts/prepare-nouns-money-atlas-web-patches.py /tmp/many-worlds-atlas
python scripts/prepare-nouns-money-atlas-proofs.py /tmp/many-worlds-atlas --full-pdfs
```

The first step restores the paper around each old mark and places the original portrait in a small PNG patch. The print step replaces the isolated glasses drawing in the PDF content stream with native vector rectangles. Each PDF in `pdfs/` retains the two original pages, searchable type, 150 × 75 mm trim and 3 mm bleed. The web faces retain the 1200 × 600 source composition.

The desk reads `proofs.json` and `patches/` from its own directory. Each binary PDF patch is an incremental suffix for the matching published master. The viewer verifies the source, suffix and assembled file before offering the download. A master or geometry mismatch requires review. Source faces, published master downloads and edition numbers remain available in the original catalog; physical press proofing is pending.
