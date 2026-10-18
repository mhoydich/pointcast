"""Bounded offline fixtures; synthetic /tmp inputs only, never a build or network."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('package-workshop-artifact.py')
spec = importlib.util.spec_from_file_location('packager', SCRIPT)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
HEAD, TREE = 'a' * 40, 'b' * 40


class FixtureRepo:
    def __init__(self, root):
        self.work = root / 'synthetic-repo'
        self.work.mkdir()
        self.dist = self.work / 'dist'
        self.dist.mkdir()
        self.output = self.work / 'workshop-qa-artifact'
        self.sources = {}
        core = {'index.html': b'<html><head><link rel="stylesheet" href="./style.css"><script type="module" src="./app.mjs"></script></head><body><img src="./assets/starter.svg"><a href="/unrelated/">Navigation</a></body></html>',
                'style.css': b'body{color:black}', 'app.mjs': b'import "./model.mjs";', 'model.mjs': b'export const model=1;',
                'assets/starter.svg': b'<svg xmlns="http://www.w3.org/2000/svg"><style>path{fill:url(#paint)}</style></svg>'}
        while len(core) < 12: core['data-' + str(len(core)) + '.json'] = b'{}'
        lab = {'lab.css': b'.lab{color:green}', 'lab.mjs': b'import "./lab-core.mjs";', 'lab-core.mjs': b'export const lab=1;',
               'workshop-model.mjs': b'export const model=1;', 'image-data.json': b'{}'}
        while len(lab) < 14: lab['data-' + str(len(lab)) + '.json'] = b'{}'
        for directory, items in [('nouns-money/workshop', core), ('assets/ues-currency-lab', lab)]:
            for name, data in items.items():
                relative = 'public/' + directory + '/' + name
                self.sources[relative] = data
                self.write(self.work / relative, data)
                self.write(self.dist / directory / name, data)
        for relative in m.SOURCE_INPUTS:
            self.sources[relative] = ('synthetic source binding ' + relative).encode()
            self.write(self.work / relative, self.sources[relative])
        self.write(self.dist / m.UES_PAGE,
                   b'<html><head><link rel="stylesheet" href="/_astro/layout.css"><link rel="icon" href="/favicon.svg">'
                   b'<link rel="manifest" href="/manifest.webmanifest"><script type="module" src="/_astro/chrome.js"></script>'
                   b'</head><body><link rel="stylesheet" href="/assets/ues-currency-lab/lab.css">'
                   b'<script type="module" src="/assets/ues-currency-lab/lab.mjs"></script>'
                   b'<img srcset="data:image/png;base64,abc 1x, /images/one.svg 2x">'
                   b'<a href="https://example.test/source">Official source</a></body></html>')
        assets = {'_astro/layout.css': br'@import /* keep */ "./nested.css";@font-face{src:url(./fonts/local\20 font.woff2)}',
                  '_astro/nested.css': b'body{background:url(../images/one.svg)}',
                  '_astro/fonts/local font.woff2': b'fixture-font',
                  '_astro/chrome.js': b'const map=["_astro/unused.js","_astro/preload-only.css"];import("./"+name+".js");',
                  '_astro/unused.js': b'if(ok)/["\']/.test(source);const x=`${import("./template.js")}`;',
                  '_astro/template.js': b'export{};',
                  '_astro/preload-only.css': b'p{color:blue}',
                  '_astro/unrelated-image.png': b'not a requested image; must remain excluded',
                  'fonts/extra.woff2': b'font-census',
                  'images/one.svg': b'<svg xmlns="http://www.w3.org/2000/svg"/>',
                  'favicon.svg': b'<svg xmlns="http://www.w3.org/2000/svg"/>',
                  'manifest.webmanifest': b'{"icons":[{"src":"/images/one.svg"}],"start_url":"/"}'}
        for relative, data in assets.items(): self.write(self.dist / relative, data)

    @staticmethod
    def write(path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def git(self, work, *args):
        if args == ('rev-parse', 'HEAD'): return HEAD.encode() + b'\n'
        if args == ('rev-parse', 'HEAD^{tree}'): return TREE.encode() + b'\n'
        if args and args[0] == 'ls-tree':
            rows = []
            for path, data in sorted(self.sources.items()):
                blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
                rows.append(('100644 blob ' + blob + '\t' + path).encode())
            return b'\0'.join(rows) + b'\0'
        if args and args[0] == 'show' and args[1].startswith('HEAD:'):
            return self.sources[args[1][5:]]
        raise AssertionError('Unexpected offline git fixture call: ' + repr(args))


class Fixtures(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='workshop-packager-fixture-')
        self.root = Path(self.temp.name)
        self.repo = FixtureRepo(self.root)
        self.git_patch = patch.object(m, 'git', side_effect=self.repo.git)
        self.git_patch.start()

    def tearDown(self):
        self.git_patch.stop()
        self.temp.cleanup()

    def package(self, **kwargs):
        return m.package(self.repo.work, self.repo.output, kwargs.pop('expected_head', HEAD),
                         kwargs.pop('expected_tree', TREE), **kwargs)

    def test_01_complete_scope_manifest_hashes_and_no_source_copy(self):
        record = self.package()
        manifest = json.loads((self.repo.output / 'manifest.json').read_text())
        self.assertEqual((manifest['head'], manifest['tree']), (HEAD, TREE))
        self.assertEqual(manifest['runtimeInventories']['nouns-money/workshop']['fileCount'], 12)
        self.assertEqual(manifest['runtimeInventories']['assets/ues-currency-lab']['fileCount'], 14)
        for item in manifest['files']:
            data = (self.repo.output / item['path']).read_bytes()
            self.assertEqual((len(data), m.digest(data)), (item['bytes'], item['sha256']))
            self.assertFalse(item['path'].startswith(('src/', 'docs/', 'scripts/')))
        names = {item['path'] for item in manifest['files']}
        self.assertIn('_astro/unused.js', names)
        self.assertIn('_astro/template.js', names)
        self.assertIn('_astro/preload-only.css', names)
        self.assertIn('_astro/fonts/local font.woff2', names)
        self.assertIn('fonts/extra.woff2', names)
        self.assertNotIn('_astro/unrelated-image.png', names)
        self.assertNotIn('unrelated/index.html', names)
        self.assertTrue(manifest['emittedDependencyCensus']['triggered'])
        self.assertEqual(sum(item['bytes'] for item in manifest['files']), record['bytes'])
        self.assertLess(record['bytes'] + record['manifestBytes'], m.BUDGET)
        self.assertTrue(all(item['fetched'] is False for item in manifest['externalReferences']))
        self.assertEqual(manifest['packagerSha256'], m.digest(SCRIPT.read_bytes()))

    def test_02_missing_html_stylesheet_fails_without_output(self):
        (self.repo.dist / '_astro/layout.css').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing local dependency'): self.package()
        self.assertFalse(self.repo.output.exists())

    def test_03_missing_transitive_css_import_and_font_fail(self):
        (self.repo.dist / '_astro/nested.css').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing local dependency'): self.package()
        self.assertFalse(self.repo.output.exists())

    def test_04_census_css_dependency_is_required_even_if_not_directly_linked(self):
        (self.repo.dist / '_astro/preload-only.css').write_text('@import "./missing-preload.css";')
        with self.assertRaisesRegex(ValueError, 'Missing local dependency'): self.package()

    def test_05_css_escaping_and_import_comments_are_decoded(self):
        refs = m.css_references(r'''/* url("./ignored.css") */ @import /* gap */ "./nested.css"; a{background:url(./escaped\20 name.svg)}''')
        self.assertEqual(refs, [('./nested.css', 'css-import'), ('./escaped name.svg', 'css-url')])
        self.assertEqual(m.css_references('a{fill:url(#paint)}'), [('#paint', 'css-url')])
        self.assertEqual(m.local_reference('data:image/svg+xml;base64,AAAA', '_astro/a.css')[0], 'embedded')

    def test_06_path_escape_hidden_backend_and_bad_scheme_fail(self):
        for value in ['../../../../private.txt', '/%2eenv', '/api/private.json', 'file:///etc/passwd',
                      '/_astro/../../secret.css', '/_astro/%2e%2e/%2e%2e/secret.css', '/_astro/a%5cb.css', '/_astro/%zz.css']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                m.local_reference(value, '_astro/layout.css')
        self.assertEqual(m.local_reference('../images/one.svg', '_astro/layout.css'), ('local', 'images/one.svg'))

    def test_07_symlink_file_and_parent_directory_are_rejected(self):
        external = self.root / 'external.css'; external.write_text('private outside dist')
        target = self.repo.dist / '_astro/layout.css'; target.unlink(); target.symlink_to(external)
        with self.assertRaisesRegex(ValueError, 'Symlink'): self.package()
        target.unlink(); target.write_text('body{}')
        font_dir = self.repo.dist / 'fonts'; shutil.rmtree(font_dir); font_dir.symlink_to(self.root, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Symlink|Unsafe generated'): self.package()

    def test_08_size_bound_is_checked_before_payload_read_or_copy(self):
        with (self.repo.dist / '_astro/oversized.js').open('wb') as stream: stream.truncate(m.BUDGET + 1)
        with self.assertRaisesRegex(ValueError, 'budget'): self.package()
        self.assertFalse(self.repo.output.exists())
        self.assertFalse(list(self.repo.work.glob('.*.packaging-*')))

    def test_09_head_tree_and_invalid_identity_fail(self):
        for kwargs in [{'expected_head': 'c' * 40}, {'expected_tree': 'c' * 40}, {'expected_head': 'short'}]:
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError): self.package(**kwargs)
        self.assertFalse(self.repo.output.exists())

    def test_10_compiled_runtime_or_source_bytes_cannot_drift(self):
        (self.repo.dist / 'nouns-money/workshop/model.mjs').write_text('altered runtime')
        with self.assertRaisesRegex(ValueError, 'runtime bytes differ'): self.package()
        (self.repo.dist / 'nouns-money/workshop/model.mjs').write_bytes(self.repo.sources['public/nouns-money/workshop/model.mjs'])
        (self.repo.work / 'src/pages/ues/currency-lab.astro').write_text('altered source')
        with self.assertRaisesRegex(ValueError, 'source differs'): self.package()

    def test_11_runtime_inventory_must_match_the_complete_tracked_set(self):
        (self.repo.dist / 'assets/ues-currency-lab/untracked.json').write_text('{}')
        with self.assertRaisesRegex(ValueError, 'inventory differs'): self.package()

    def test_12_no_lexer_claim_or_dynamic_import_interpretation(self):
        graph = m.Graph(self.repo.dist)
        text = r'''if(ok)/["']/.test(x);throw /import("decoy")/;const t=`${import("./template.js")}`;import("./"+name+".js");'''
        graph.inventory_js(text, '_astro/chrome.js')
        self.assertEqual(graph.edges, [])
        self.assertEqual(graph.files, {})
        self.assertFalse(hasattr(m, 'js_tokens'))

    def test_13_mixed_data_srcset_keeps_local_dependency_and_external_is_never_fetched(self):
        self.assertEqual(m.srcset_references('data:image/png;base64,abc 1x, ./local.svg 2x'),
                         ['data:image/png;base64,abc', './local.svg'])
        graph = m.Graph(self.repo.dist)
        graph.reference('https://example.test/font.woff2', '_astro/layout.css', 'css-url')
        self.assertEqual(graph.files, {})
        self.assertEqual(graph.external[0]['fetched'], False)

    def test_14_output_is_fresh_and_transactional_stage_is_cleaned(self):
        self.repo.output.mkdir()
        with self.assertRaisesRegex(ValueError, 'fresh'): self.package()
        self.repo.output.rmdir()
        original = Path.write_bytes
        def fail_copy(path, data):
            if '.packaging-' in str(path) and path.name == 'app.mjs': raise OSError('synthetic copy failure')
            return original(path, data)
        with patch.object(Path, 'write_bytes', fail_copy):
            with self.assertRaisesRegex(OSError, 'synthetic copy failure'): self.package()
        self.assertFalse(self.repo.output.exists())
        self.assertFalse(list(self.repo.work.glob('.*.packaging-*')))

    def test_15_budget_and_manifest_limits_cannot_be_relaxed(self):
        with self.assertRaisesRegex(ValueError, 'at most 40 MB'): self.package(byte_budget=m.BUDGET + 1)
        with self.assertRaisesRegex(ValueError, 'budget'): self.package(byte_budget=200)
        self.assertFalse(self.repo.output.exists())

    def test_16_html_base_url_or_missing_image_is_not_silently_omitted(self):
        with self.assertRaisesRegex(ValueError, 'base URL'): m.HtmlReferences('<base href="https://evil.test/">')
        (self.repo.dist / 'images/one.svg').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing local dependency'): self.package()

    def test_17_known_seo_head_only_rewrite_is_bound_and_body_drift_rejected(self):
        path = self.repo.dist / 'nouns-money/workshop/index.html'
        source = path.read_bytes()
        metadata = ('<meta name="description" content="Compiled description"><link rel="canonical" href="https://pointcast.xyz/nouns-money/workshop/">'
                    '<meta property="og:image" content="https://pointcast.xyz/images/og/og-home-v5.png">'
                    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"}</script>'
                    '<style>' + m.SEO_HEADING_CSS + '</style>').encode()
        compiled = source.replace(b'</head>', metadata + b'</head>')
        path.write_bytes(compiled)
        self.package()
        manifest = json.loads((self.repo.output / 'manifest.json').read_text())
        record = next(item for item in manifest['files'] if item['path'] == 'nouns-money/workshop/index.html')
        self.assertFalse(record['sourceByteMatch'])
        self.assertTrue(record['declaredBuildTransformation']['outsideHeadByteMatch'])
        self.assertEqual(record['declaredBuildTransformation']['sourceSha256'], m.digest(source))
        shutil.rmtree(self.repo.output)
        path.write_bytes(compiled.replace(b'</body>', b'<script>unrelated()</script></body>'))
        with self.assertRaisesRegex(ValueError, 'outside head differ'): self.package()

    def test_18_new_executable_head_script_style_or_fetch_is_rejected(self):
        source = (self.repo.dist / 'nouns-money/workshop/index.html').read_bytes()
        canonical = b'<link rel="canonical" href="https://pointcast.xyz/nouns-money/workshop/">'
        for extra in [b'<script>newBehavior()</script>', b'<script src="https://evil.test/code.js"></script>',
                      b'<style>body{display:none}</style>', b'<link rel="stylesheet" href="https://evil.test/style.css">']:
            with self.subTest(extra=extra), self.assertRaisesRegex(ValueError, 'head changed'):
                m.head_only_seo_transform(source, source.replace(b'</head>', canonical + extra + b'</head>'))

    def test_19_duplicate_type_or_refresh_meta_cannot_hide_in_seo_allowance(self):
        source = (self.repo.dist / 'nouns-money/workshop/index.html').read_bytes()
        canonical = b'<link rel="canonical" href="https://pointcast.xyz/nouns-money/workshop/">'
        for extra in [b'<script type="text/javascript" type="application/ld+json" src="https://evil.test/code.js">{"@context":"https://schema.org","@type":"WebPage"}</script>',
                      b'<meta name="description" http-equiv="refresh" content="0;url=https://evil.test/">']:
            with self.subTest(extra=extra), self.assertRaisesRegex(ValueError, 'attributes'):
                m.head_only_seo_transform(source, source.replace(b'</head>', canonical + extra + b'</head>'))

    def test_20_stripped_seo_tags_have_exact_attribute_allowlists(self):
        source = (self.repo.dist / 'nouns-money/workshop/index.html').read_bytes()
        canonical = '<link rel="canonical" href="https://pointcast.xyz/nouns-money/workshop/">'
        for extra in ['<script type="application/ld+json" onload="bad()">{"@context":"https://schema.org","@type":"WebPage"}</script>',
                      '<style onload="bad()">' + m.SEO_HEADING_CSS + '</style>',
                      '<meta property="og:image" content="https://example.test/image.png" onload="bad()">',
                      '<meta name="description" name="viewport" content="changed">']:
            with self.subTest(extra=extra), self.assertRaisesRegex(ValueError, 'attributes'):
                m.head_only_seo_transform(source, source.replace(b'</head>', (canonical + extra + '</head>').encode()))


if __name__ == '__main__':
    unittest.main(verbosity=2)
