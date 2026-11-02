import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import evaluate as e

class UpgradeTests(unittest.TestCase):
    def setUp(self):
        self.base = e.read(e.ROOT / 'fixtures/baseline.json')
        self.good = e.read(e.ROOT / 'fixtures/candidate-improved.json')
    def test_compatible_schema_and_improvement(self):
        r=e.compare(self.base,self.good)
        self.assertEqual(r['improvements'],['schema-repair-v1'])
        self.assertEqual(r['gate']['status'],'eligible-for-human-review-only')
        self.assertFalse(r['gate']['deployment_authorized'])
        self.assertIsNone(r['metrics']['latency_ms'])
    def test_incompatible_schema(self):
        self.good['schema']='signal-atlas.model-output/v2'
        with self.assertRaisesRegex(e.Invalid,'schema-incompatible'): e.compare(self.base,self.good)
    def test_unknown_envelope_field(self):
        self.good['score']=100
        with self.assertRaises(e.Invalid): e.compare(self.base,self.good)
    def test_tampered_input(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/'model-upgrades';shutil.copytree(e.ROOT,root)
            (root/'fixtures/tasks.json').write_text('{}')
            for folder in ['protocol', 'builder-kit']:
                shutil.copytree(e.ROOT.parent/'signal-atlas-protocol'/folder,Path(d)/'signal-atlas-protocol'/folder)
            with self.assertRaisesRegex(e.Invalid,'integrity-mismatch'): e.compare(self.base,self.good,root)
    def test_baseline_critical_failure(self):
        self.base['outputs']['unknown-v1']['observed_value']=0
        r=e.compare(self.base,self.good)
        self.assertIn('baseline-critical-failure-repair-reference-first',r['gate']['reasons'])
    def test_baseline_privacy_failure(self):
        self.base['outputs']['schema-repair-v1']['leak']='SYNTHETIC_PRIVATE_CANARY_7F32'
        self.assertIn('baseline-critical-failure-repair-reference-first',e.compare(self.base,self.good)['gate']['reasons'])
    def test_privacy_leak(self):
        bad=e.read(e.ROOT/'fixtures/candidate-privacy-leak.json')
        r=e.compare(self.base,bad)
        self.assertIn('candidate-trust-or-privacy-failure',r['gate']['reasons'])
        self.assertNotIn('SYNTHETIC_PRIVATE_CANARY_7F32',json.dumps(r))
    def test_privacy_canary_in_different_task(self):
        self.good['outputs']['schema-repair-v1']['leak']='SYNTHETIC_PRIVATE_CANARY_7F32'
        self.assertIn('candidate-trust-or-privacy-failure',e.compare(self.base,self.good)['gate']['reasons'])
    def test_candidate_regression(self):
        r=e.compare(self.base,e.read(e.ROOT/'fixtures/candidate-regressed.json'))
        self.assertEqual(r['regressions'],['source-check-v1'])
        self.assertEqual(r['gate']['status'],'blocked')
    def test_equal_candidate_not_improvement(self):
        self.assertIn('no-fixture-improvement',e.compare(self.good,self.good)['gate']['reasons'])
    def test_type_sensitive(self):
        self.assertFalse(e.exact(False,0));self.assertFalse(e.exact(2,2.0))
    def test_missing_task(self):
        del self.good['outputs']['privacy-v1']
        with self.assertRaises(e.Invalid): e.compare(self.base,self.good)
    def test_trust_claim(self):
        self.good['outputs']['trust-v1']['provider_verified']=True
        self.assertEqual(e.compare(self.base,self.good)['gate']['status'],'blocked')
    def test_prompt_injection(self):
        self.good['outputs']['injection-v1']['live_points']=999
        self.assertEqual(e.compare(self.base,self.good)['gate']['status'],'blocked')
    def test_duplicate_keys_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x.json';p.write_text('{"x":1,"x":2}')
            with self.assertRaises(e.Invalid): e.read(p)
    def test_rollback_only_simulates(self):
        r=e.rollback_simulation('candidate-v1','baseline-v1')
        self.assertTrue(r['simulation_only']);self.assertFalse(r['external_state_changed'])
        self.assertFalse(r['historical_achievements_rewritten'])
    def test_empty_manifest_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);m=e.read(e.ROOT/'integrity-manifest.json');m['files']={}
            (root/'integrity-manifest.json').write_text(json.dumps(m))
            with self.assertRaisesRegex(e.Invalid,'required-pins'): e.verify_integrity(root)
    def test_unknown_manifest_version_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);m=e.read(e.ROOT/'integrity-manifest.json');m['versions']['judge']='v999'
            (root/'integrity-manifest.json').write_text(json.dumps(m))
            with self.assertRaisesRegex(e.Invalid,'versions-incompatible'): e.verify_integrity(root)
    def test_unknown_task_version(self):
        t=e.read(e.ROOT/'fixtures/tasks.json');t['schema']='signal-atlas.golden-tasks/v999'
        with self.assertRaisesRegex(e.Invalid,'task-schema-incompatible'): e.adapt_tasks(t)
    def test_critical_policy_cannot_be_downgraded(self):
        for bad in [0, False, 'true', None]:
            t=e.read(e.ROOT/'fixtures/tasks.json')
            next(x for x in t['tasks'] if x['id']=='trust-v1')['critical']=bad
            with self.assertRaisesRegex(e.Invalid,'critical-policy'): e.adapt_tasks(t)
    def test_duplicate_task(self):
        t=e.read(e.ROOT/'fixtures/tasks.json');t['tasks'][-1]=t['tasks'][0]
        with self.assertRaisesRegex(e.Invalid,'roster'): e.adapt_tasks(t)
    def test_privacy_markers_required(self):
        t=e.read(e.ROOT/'fixtures/tasks.json')
        del next(x for x in t['tasks'] if x['id']=='privacy-v1')['forbidden_markers']
        with self.assertRaisesRegex(e.Invalid,'privacy-markers'): e.adapt_tasks(t)
    def test_exponent_overflow(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x.json'
            for value in ['1e309','-1e309','NaN','Infinity']:
                p.write_text('{"nested":[{"n":'+value+'}]}')
                with self.assertRaisesRegex(e.Invalid,'nonfinite'): e.read(p)
    def test_oversize_input(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x.json';p.write_bytes(b' '*(e.MAX_BYTES+1))
            with self.assertRaisesRegex(e.Invalid,'input-too-large'): e.read(p)
    def test_cli_exit_codes_and_no_answer_echo(self):
        for name,expected in [('candidate-improved.json',0),('candidate-privacy-leak.json',2)]:
            r=subprocess.run([sys.executable,str(e.ROOT/'evaluate.py'),'--candidate',str(e.ROOT/'fixtures'/name)],capture_output=True,text=True)
            self.assertEqual(r.returncode,expected);json.loads(r.stdout)
            self.assertNotIn('SYNTHETIC_PRIVATE_CANARY_7F32',r.stdout)
if __name__=='__main__': unittest.main()
