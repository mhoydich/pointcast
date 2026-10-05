"""Exercise the real deploy script with offline CLI transports and a private fixture tree."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/deploy.sh'
LIVE = '83daec8bbd458dc80966e43dab7dcc4c675c4a22'
PIN = 'c6077c1401c2486ed11cfe94e0c5e05bd1a3dd32'
MAIN = 'a55fa8bef730a4fcceb626f9181c9a2b3cee297e'
OTHER = 'f' * 40

TRANSPORT = r'''#!/usr/bin/python3
import json, os, pathlib, subprocess, sys
root = pathlib.Path(os.environ['PC_TEST_FIXTURE'])
data = json.loads((root / 'case.json').read_text())
name, args = pathlib.Path(sys.argv[0]).name, sys.argv[1:]
with (root / 'calls.jsonl').open('a') as out:
    out.write(json.dumps({'name': name, 'args': args}) + '\n')
if name == 'git':
    if args[:1] == ['-C']: args = args[2:]
    if args[:1] == ['rev-parse']:
        print(data['main'] if args[-1] == 'origin/main' else root / 'repository')
    elif args[:2] == ['cat-file', '-t']:
        if args[-1] not in data['known']: sys.exit(1)
        print('tag' if args[-1] in data['tags'] else 'commit')
    elif args[:2] == ['merge-base', '--is-ancestor']:
        sys.exit(0 if args[-2:] in data['ancestors'] or args[-2] == args[-1] else 1)
    elif args[:1] == ['log']:
        print('Fixture reviewed correction')
    sys.exit(0)
if name == 'cat':
    if args == [str(pathlib.Path.home() / '.pointcast-deploy.live')]:
        if data['markerMissing']: sys.exit(1)
        print(data['live'])
        sys.exit(0)
    sys.exit(subprocess.call(['/bin/cat', *args]))
if name == 'find':
    print('fixture-file\n' * data['fileCount'], end='')
    sys.exit(0)
if name == 'npm':
    if args[:2] != ['run', 'build']:
        sys.exit(91)
    work = pathlib.Path.cwd()
    for relative in ['index.html', 'court/index.html', 'blocks.json']:
        if relative == data['missing']: continue
        target = work / 'dist' / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text('fixture only')
    sys.exit(0)
if name in ['curl', 'npx', 'wrangler']:
    sys.exit(93)  # Never permit a fixture to reach network, auth or upload.
sys.exit(92)
'''


class PinnedReleaseTests(unittest.TestCase):
    def run_case(self, args, *, live=LIVE, known=None, ancestors=None,
                 missing='', file_count=3001, tags=None, marker_missing=False):
        with tempfile.TemporaryDirectory(prefix='pc-pin-offline-') as directory:
            root = Path(directory)
            data = {'live': live, 'main': MAIN, 'known': known or [LIVE, PIN, MAIN, OTHER],
                    'ancestors': ancestors if ancestors is not None else [[LIVE, PIN], [PIN, MAIN], [LIVE, MAIN]],
                    'missing': missing, 'fileCount': file_count,
                    'tags': tags or [], 'markerMissing': marker_missing}
            (root / 'case.json').write_text(json.dumps(data))
            binary = root / 'bin'
            binary.mkdir()
            for name in ['git', 'cat', 'find', 'npm', 'curl', 'npx', 'wrangler']:
                target = binary / name
                target.write_text(TRANSPORT)
                target.chmod(0o755)
            work = root / 'work'
            work.mkdir()
            (work / '.git').write_text('fixture only')
            lockfile = b'{}\n'
            (work / 'package-lock.json').write_bytes(lockfile)
            (work / 'node_modules').mkdir()
            (work / 'node_modules/.pc-lock-hash').write_text(hashlib.sha1(lockfile).hexdigest())
            (work / 'node_modules/.bin').mkdir()
            denied_upload = work / 'node_modules/.bin/wrangler'
            denied_upload.write_text(TRANSPORT)
            denied_upload.chmod(0o755)
            # Preserve the actual HOME value without inheriting any credentials.
            environment = {'HOME': os.environ['HOME'], 'LANG': 'C', 'LC_ALL': 'C',
                           'TMPDIR': str(root)}
            environment.update(PATH=str(binary) + ':/usr/bin:/bin:/usr/sbin:/sbin',
                               PC_TEST_FIXTURE=str(root), PC_DEPLOY_DIR=str(work),
                               PC_DEPLOY_LOCK=str(root / 'lock'), PC_DEPLOY_LOG=str(root / 'deploy.log'))
            # HOME and the real global marker remain untouched. The cat transport
            # supplies a fixture marker; --dry-run always stops before upload/write.
            result = subprocess.run(['/bin/bash', str(SCRIPT), '--dry-run', *args],
                                    env=environment, text=True, capture_output=True, timeout=15)
            calls = [json.loads(line) for line in (root / 'calls.jsonl').read_text().splitlines()] if (root / 'calls.jsonl').exists() else []
            self.assertFalse((root / 'lock').exists(), 'EXIT cleanup releases only fixture lock')
            checkouts = [row['args'] for row in calls if row['name'] == 'git' and 'checkout' in row['args']]
            builds = [row for row in calls if row['name'] == 'npm']
            self.assertFalse(any(row['name'] in ['curl', 'npx', 'wrangler'] for row in calls),
                             'dry-run fixture must never invoke a denied network transport')
            return result, checkouts, builds, calls

    def test_pin_builds_exact_reviewed_ancestor_with_full_gate(self):
        result, checkouts, builds, calls = self.run_case(['--release-sha=' + PIN])
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(checkouts[0][-1], PIN)
        self.assertEqual(len(builds), 1)
        self.assertTrue(any('fetch' in row['args'] for row in calls if row['name'] == 'git'))
        self.assertIn('build ok: 3001 files', result.stdout)
        self.assertIn('dry run, stopping before deploy', result.stdout)

    def test_default_still_selects_fresh_main(self):
        result, checkouts, builds, _ = self.run_case([])
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(checkouts[0][-1], MAIN)
        self.assertEqual(len(builds), 1)

    def test_invalid_or_duplicate_pin_stops_before_git_checkout_build(self):
        for args in [['--release-sha='], ['--release-sha=short'], ['--release-sha=' + PIN, '--release-sha=' + PIN]]:
            with self.subTest(args=args):
                result, checkouts, builds, _ = self.run_case(args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(checkouts, [])
                self.assertEqual(builds, [])

    def test_unavailable_or_unrelated_commit_cannot_build(self):
        cases = [({'known': [LIVE, MAIN]}, PIN), ({}, OTHER)]
        for configuration, pin in cases:
            with self.subTest(pin=pin, configuration=configuration):
                result, checkouts, builds, _ = self.run_case(['--release-sha=' + pin], **configuration)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(checkouts, [])
                self.assertEqual(builds, [])

    def test_missing_marker_or_rollback_is_rejected_even_with_force(self):
        for live, pin in [('', PIN), ('invalid-marker', PIN), (PIN, LIVE)]:
            with self.subTest(live=live, pin=pin):
                result, checkouts, builds, _ = self.run_case(['--force', '--release-sha=' + pin], live=live)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(checkouts, [])
                self.assertEqual(builds, [])
        result, checkouts, builds, _ = self.run_case(['--release-sha=' + PIN], marker_missing=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(checkouts, [])
        self.assertEqual(builds, [])

    def test_tag_objects_cannot_be_selected_or_recorded_live(self):
        for configuration in [{'tags': [PIN]}, {'tags': [LIVE]}]:
            with self.subTest(configuration=configuration):
                result, checkouts, builds, _ = self.run_case(['--release-sha=' + PIN], **configuration)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(checkouts, [])
                self.assertEqual(builds, [])

    def test_pin_preserves_partial_and_small_build_rejection(self):
        for configuration in [{'missing': 'blocks.json'}, {'file_count': 2999}]:
            with self.subTest(configuration=configuration):
                result, checkouts, builds, _ = self.run_case(['--release-sha=' + PIN], **configuration)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(checkouts[0][-1], PIN)
                self.assertEqual(len(builds), 1)
                self.assertIn('GATE:', result.stdout)


if __name__ == '__main__':
    unittest.main(verbosity=2)
