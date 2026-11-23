import csv
import tempfile
import unittest
from pathlib import Path
from build_analysis import build, distance_km, HERE

class AnalysisTests(unittest.TestCase):
    def test_origin_distance(self):
        self.assertAlmostEqual(distance_km(33.9192, -118.4165), 0.0, places=9)
    def test_snapshot(self):
        meta = build(HERE / 'comcat_2020_2024.csv')
        self.assertEqual(meta['event_count'], 28)
        self.assertEqual(meta['unique_event_ids'], 28)
        self.assertLessEqual(meta['largest_approx_distance_km'], 40.2336)
        self.assertEqual(meta['year_counts'], {'2020':2,'2021':7,'2022':1,'2023':3,'2024':15})
    def test_reject_duplicate(self):
        with (HERE / 'comcat_2020_2024.csv').open(newline='') as f:
            rows=list(csv.DictReader(f)); fields=rows[0].keys()
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'duplicate.csv'
            with p.open('w',newline='') as f:
                w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerow(rows[0]);w.writerow(rows[0])
            with self.assertRaisesRegex(ValueError,'duplicate'):
                build(p)
if __name__ == '__main__': unittest.main()
