#!/usr/bin/env python3
"""Validate the frozen data used by the two published-story candidates."""
import csv
import hashlib
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'sketches/codex/data-stories-20261103'
PAGES = ROOT / 'src/pages/data-stories'

class DataStoryChecks(unittest.TestCase):
    def test_quake_source_and_rendered_rows(self):
        raw = (DATA / 'comcat_2020_2024.csv').read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), 'efa8e6478e642042e6a648a6af598b0e14b1d6411b885629d7c3227ed0e7838a')
        records = list(csv.DictReader(raw.decode().splitlines()))
        self.assertEqual(len(records), 28)
        self.assertEqual(len({r['id'] for r in records}), 28)
        self.assertTrue(all(r['status'] == 'reviewed' and r['type'] == 'earthquake' and float(r['mag']) >= 3 for r in records))
        self.assertEqual(Counter(r['time'][:4] for r in records), {'2020': 2, '2021': 7, '2022': 1, '2023': 3, '2024': 15})
        page = (PAGES / 'earthquakes.astro').read_text()
        for record in records:
            self.assertIn('/earthquakes/eventpage/' + record['id'], page)
        self.assertIn('aftershocks', page)
        self.assertIn('not a prediction', page)

    def test_rent_values_and_uncertainty(self):
        records = list(csv.DictReader((DATA / 'acs_2020_2024_gross_rent.csv').read_text().splitlines()))
        self.assertEqual({r['city']: (int(r['estimate_usd_month']), int(r['moe_90pct_usd_month'])) for r in records}, {
            'Hermosa Beach': (2887, 196), 'Manhattan Beach': (3449, 250),
            'Redondo Beach': (2691, 71), 'Torrance': (2280, 52)})
        page = (PAGES / 'rent.astro').read_text()
        for row in records:
            self.assertIn(row['geo_id'], page)
            estimate, moe = int(row['estimate_usd_month']), int(row['moe_90pct_usd_month'])
            self.assertIn(f'width:{estimate / 40}%', page)
            self.assertIn(f'left:{(estimate - moe) / 40}%;width:{2 * moe / 40}%', page)
            self.assertIn(f"${int(row['estimate_usd_month']):,} ± ${int(row['moe_90pct_usd_month']):,}", page)
        for term in ('2020–2024', '90%', 'not current asking rents'):
            self.assertIn(term, page)

    def test_images_and_tables_exist(self):
        for page, image in [('earthquakes', 'earthquake'), ('rent', 'rent')]:
            text = (PAGES / (page + '.astro')).read_text()
            self.assertIn('<table>', text)
            self.assertIn('<details>', text)
            self.assertIn('prefers-reduced-motion', text)
            self.assertTrue((ROOT / 'public/data-stories' / (image + '-illustration.png')).is_file())

if __name__ == '__main__':
    unittest.main()
