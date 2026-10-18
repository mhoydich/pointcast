#!/usr/bin/env python3
"""Package the two Workshop runtimes and the compiled UES page dependency graph.

Standard library only; no fetching, script execution, build, or deployment.
Call after the exact-head full build:
  python3 scripts/package-workshop-artifact.py "$GITHUB_WORKSPACE" --expected-head <40sha>
"""
import argparse
from collections import deque
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from urllib.parse import unquote, urlsplit

SCHEMA = 'pointcast.nouns-money-workshop.compiled-artifact/v1'
RUNTIMES = {'nouns-money/workshop': 12, 'assets/ues-currency-lab': 14}
UES_PAGE = 'ues/currency-lab/index.html'
SOURCE_INPUTS = ('src/pages/ues/currency-lab.astro', 'src/components/ues-currency-lab/lab.html',
                 'src/layouts/BlockLayout.astro', 'package.json', 'package-lock.json',
                 'astro.config.mjs', 'src/lib/seo-build.mjs', 'src/lib/seo-paths.mjs')
BUDGET = 40_000_000
MAX_FILES = 1500
EXTENSIONS = {'.js', '.mjs', '.css', '.json', '.webmanifest', '.woff', '.woff2', '.ttf', '.otf',
              '.eot', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.ico'}
FORBIDDEN = {'api', 'functions', 'server', '_server', '_worker.js', 'src', 'docs', 'tests',
             'scripts', 'node_modules', 'coverage'}
SEO_HEADING_CSS = '.pc-seo-heading{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}'
CSS_URL = re.compile(r'url\s*\(', re.I)
CSS_IMPORT = re.compile(r'@import\s*', re.I)
CSS_ESCAPE = re.compile(r'\\(?:[0-9a-fA-F]{1,6}[ \t\r\n\f]?|\r\n|[\s\S])')


def require(ok, message):
    if not ok:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def head_only_seo_transform(source, compiled):
    """Permit only this repo's established SEO-head rewrite of the public entry."""
    def split(data):
        heads = list(re.finditer(rb'<head\b[^>]*>([\s\S]*?)</head\s*>', data, re.I))
        require(len(heads) == 1, 'Workshop must contain exactly one head')
        match = heads[0]
        return data[:match.start(1)], match.group(1).decode('utf-8'), data[match.end(1):]
    a, source_head, b = split(source)
    x, compiled_head, y = split(compiled)
    require((a, b) == (x, y), 'Workshop bytes outside head differ from exact source')
    def attrs(tag):
        class Attrs(HTMLParser):
            result = {}
            def handle_starttag(self, tag, pairs):
                require(len(pairs) == len({name for name, value in pairs}), 'Duplicate Workshop head attributes rejected')
                self.result = dict(pairs)
        parsed = Attrs(); parsed.feed(tag); return parsed.result
    canonical = [attrs(tag).get('href') for tag in re.findall(r'<link\b[^>]*>', compiled_head, re.I)
                 if (attrs(tag).get('rel') or '').lower() == 'canonical']
    require(canonical == ['https://pointcast.xyz/nouns-money/workshop/'], 'Workshop compiled canonical mismatch')
    def stable(head):
        def metadata(match):
            tag = match.group(); values = attrs(tag)
            if tag.lower().startswith('<link'):
                if (values.get('rel') or '').lower() == 'canonical':
                    require(set(values) == {'rel', 'href'}, 'Unexpected SEO canonical attributes')
                    return ''
                return tag
            name = (values.get('name') or '').lower(); prop = (values.get('property') or '').lower()
            mutable = name == 'description' or name == 'twitter:image' or name.startswith('twitter:image:') or prop == 'og:image' or prop.startswith('og:image:')
            if mutable:
                require(set(values) in ({'name', 'content'}, {'property', 'content'}), 'Unexpected SEO meta attributes')
                return ''
            return tag
        head = re.sub(r'<(?:meta|link)\b[^>]*>', metadata, head, flags=re.I)
        def script(match):
            values = attrs(match.group(1))
            if (values.get('type') or '').lower() != 'application/ld+json': return match.group()
            require(set(values) == {'type'}, 'Unexpected SEO JSON-LD script attributes')
            data = json.loads(match.group(2))
            require(isinstance(data, dict) and data.get('@context') == 'https://schema.org'
                    and data.get('@type') in ('BreadcrumbList', 'WebPage'), 'Unexpected compiled SEO JSON-LD')
            return ''
        head = re.sub(r'(<script\b[^>]*>)([\s\S]*?)</script\s*>', script, head, flags=re.I)
        def style(match):
            if match.group(2) != SEO_HEADING_CSS: return match.group()
            require(not attrs(match.group(1)), 'Unexpected SEO-heading style attributes')
            return ''
        head = re.sub(r'(<style\b[^>]*>)([\s\S]*?)</style\s*>', style, head, flags=re.I)
        return head
    require(stable(source_head) == stable(compiled_head), 'Workshop head changed outside known SEO metadata')
    return {'policy': 'known-head-only-seo-build-hook', 'outsideHeadByteMatch': True,
            'executableScriptStyleFetchDependenciesUnchanged': True,
            'sourceSha256': digest(source), 'compiledSha256': digest(compiled),
            'sourceBindings': ['astro.config.mjs', 'src/lib/seo-build.mjs', 'src/lib/seo-paths.mjs']}


def git(work, *args):
    return subprocess.check_output(['git', '-C', str(work), *args], timeout=15)


def identity(work, expected_head, expected_tree=None):
    require(bool(re.fullmatch(r'[0-9a-f]{40}', expected_head)), 'Expected head must be a full 40-character SHA')
    head = git(work, 'rev-parse', 'HEAD').decode().strip()
    tree = git(work, 'rev-parse', 'HEAD^{tree}').decode().strip()
    require(head == expected_head, 'Checkout head mismatch: ' + head)
    require(bool(re.fullmatch(r'[0-9a-f]{40}', tree)), 'Invalid source tree')
    if expected_tree is not None:
        require(bool(re.fullmatch(r'[0-9a-f]{40}', expected_tree)) and tree == expected_tree, 'Reviewed tree mismatch')
    return head, tree


def safe_file(root, relative):
    require(isinstance(relative, str) and relative and not relative.startswith('/'), 'Unsafe relative file path')
    parts = relative.split('/')
    require(all(part not in ('', '.', '..') and not part.startswith('.') for part in parts), 'Hidden or unsafe path: ' + relative)
    require(not any(part.lower() in FORBIDDEN for part in parts), 'Backend/source path rejected: ' + relative)
    current = root
    require(root.is_dir() and not root.is_symlink(), 'Missing or symlinked artifact root')
    for part in parts:
        current = current / part
        require(not current.is_symlink(), 'Symlink dependency rejected: ' + relative)
    require(current.is_file(), 'Missing local dependency: ' + relative)
    require(current.resolve().is_relative_to(root.resolve()), 'Dependency escaped artifact root: ' + relative)
    return current


def css_unescape(value):
    def replace(match):
        code, escaped = match.groups()
        if code:
            number = int(code, 16)
            return chr(number) if 0 < number <= 0x10ffff and not 0xd800 <= number <= 0xdfff else '\ufffd'
        return '' if escaped in ('\n', '\r', '\r\n', '\f') else escaped
    return re.sub(r'\\(?:([0-9a-fA-F]{1,6})[ \t\r\n\f]?|(\r\n|[\s\S]))', replace, value)


def local_reference(value, from_path, site_root=False):
    """Return (kind, normalized path/value). No URL is opened."""
    value = html.unescape(value).strip()
    if not value or value.startswith('#'):
        return 'fragment', value
    require(not any(ord(c) < 32 or ord(c) == 127 for c in value), 'Control character in dependency URL')
    require('\\' not in value, 'Backslash in decoded dependency URL: ' + value)
    parsed = urlsplit(value)
    if parsed.scheme in ('https', 'http') or value.startswith('//'):
        require(bool(parsed.netloc), 'Malformed external reference: ' + value)
        return 'external', value
    if parsed.scheme in ('data', 'blob'):
        return 'embedded', parsed.scheme
    require(not parsed.scheme, 'Unsafe dependency scheme: ' + value)
    require(not re.search(r'%(?![0-9a-fA-F]{2})', parsed.path), 'Malformed URL encoding: ' + value)
    path = unquote(parsed.path, errors='strict')
    require('\\' not in path and not any(ord(c) < 32 or ord(c) == 127 for c in path), 'Unsafe decoded dependency path')
    parts = [] if path.startswith('/') or site_root or path.startswith('_astro/') else from_path.split('/')[:-1]
    for part in path.lstrip('/').split('/'):
        if part in ('', '.'):
            continue
        if part == '..':
            require(bool(parts), 'Dependency escaped dist: ' + value)
            parts.pop()
        else:
            require(not part.startswith('.'), 'Hidden dependency path: ' + value)
            parts.append(part)
    require(bool(parts), 'Dependency resolves to an empty path: ' + value)
    normalized = '/'.join(parts)
    require(not any(part.lower() in FORBIDDEN for part in parts), 'Backend/source dependency rejected: ' + normalized)
    return 'local', normalized


def css_references(text):
    """Scan comments, strings, @import strings and url() without losing escapes."""
    result = []
    i = 0
    def quoted(start):
        quote, at, chars = text[start], start + 1, []
        while at < len(text):
            char = text[at]
            if char == quote:
                return ''.join(chars), at + 1
            if char == '\\' and at + 1 < len(text):
                chars.append(text[at:at + 2]); at += 2
            else:
                chars.append(char); at += 1
        raise ValueError('Unterminated CSS string at offset ' + str(start))
    while i < len(text):
        # A delimiter escaped in a selector/identifier is not a string or
        # comment boundary. Consume one CSS escape, preserving slash parity.
        if text[i] == '\\':
            escaped = CSS_ESCAPE.match(text, i)
            i = escaped.end() if escaped else i + 1
            continue
        if text.startswith('/*', i):
            end = text.find('*/', i + 2); require(end >= 0, 'Unterminated CSS comment at offset ' + str(i)); i = end + 2
            continue
        match = CSS_URL.match(text, i)
        if match and (i == 0 or not re.match(r'[\w-]', text[i - 1])):
            at = match.end()
            while at < len(text) and text[at].isspace(): at += 1
            if at < len(text) and text[at] in ('"', "'"):
                value, at = quoted(at)
                while at < len(text) and text[at].isspace(): at += 1
                require(at < len(text) and text[at] == ')', 'Malformed CSS url() at offset ' + str(at))
            else:
                chars = []
                while at < len(text) and text[at] != ')':
                    if text[at] == '\\' and at + 1 < len(text): chars.append(text[at:at + 2]); at += 2
                    else: chars.append(text[at]); at += 1
                require(at < len(text), 'Unterminated CSS url() at offset ' + str(i))
                value = ''.join(chars).strip()
            result.append((css_unescape(value), 'css-url')); i = at + 1
            continue
        match = CSS_IMPORT.match(text, i)
        if match:
            at = match.end()
            while at < len(text):
                if text[at].isspace(): at += 1
                elif text.startswith('/*', at):
                    end = text.find('*/', at + 2)
                    require(end >= 0, 'Unterminated CSS import comment at offset ' + str(at))
                    at = end + 2
                else: break
            if at < len(text) and text[at] in ('"', "'"):
                value, i = quoted(at); result.append((css_unescape(value), 'css-import')); continue
        if text[i] in ('"', "'"):
            _, i = quoted(i)
        else:
            i += 1
    return result


def srcset_references(value):
    refs, i = [], 0
    while i < len(value):
        while i < len(value) and (value[i].isspace() or value[i] == ','): i += 1
        start = i
        while i < len(value) and not value[i].isspace(): i += 1
        url = value[start:i]
        if not url: break
        if url.endswith(','):
            refs.append(url.rstrip(',')); continue
        refs.append(url)
        # Descriptors end at the separator; embedded data-URL commas were
        # consumed as part of the URL token, rather than split as new files.
        while i < len(value) and value[i] != ',': i += 1
    return refs


class HtmlReferences(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.refs, self.external_candidates, self.ignored, self.inline_css, self.inline_js = [], [], [], [], []
        self.in_style, self.in_script = False, False
        self.feed(text)

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        require(tag != 'base', 'HTML base URL would change dependency resolution')
        for value in attrs.values():
            if value and value.startswith(('https://', 'http://', '//')): self.external_candidates.append(value)
        if attrs.get('style'): self.inline_css.append(attrs['style'])
        if tag == 'style': self.in_style = True
        if tag == 'script':
            if attrs.get('src'): self.refs.append((attrs['src'], 'html-script'))
            self.in_script = not attrs.get('src') and attrs.get('type', '').lower() in ('', 'module', 'text/javascript', 'application/javascript')
        if tag == 'link' and attrs.get('href'):
            if set((attrs.get('rel') or '').lower().split()) & {'stylesheet', 'preload', 'modulepreload', 'icon', 'manifest'}:
                self.refs.append((attrs['href'], 'html-link-' + (attrs.get('rel') or '')))
            else: self.ignored.append({'url': attrs['href'], 'kind': 'metadata-link'})
        if tag in ('img', 'source', 'audio', 'video', 'input', 'iframe') and attrs.get('src'):
            require(tag != 'iframe', 'Local/external iframe is outside this compiled artifact scope')
            self.refs.append((attrs['src'], 'html-' + tag))
        if tag == 'video' and attrs.get('poster'): self.refs.append((attrs['poster'], 'html-video-poster'))
        if tag in ('image', 'use'):
            for key in ('href', 'xlink:href'):
                if attrs.get(key): self.refs.append((attrs[key], 'svg-image'))
        if attrs.get('srcset'):
            for value in srcset_references(attrs['srcset']):
                self.refs.append((value, 'html-srcset'))
        if tag == 'a' and attrs.get('href'): self.ignored.append({'url': attrs['href'], 'kind': 'navigation-or-download'})

    def handle_endtag(self, tag):
        if tag == 'style': self.in_style = False
        if tag == 'script': self.in_script = False

    def handle_data(self, data):
        if self.in_style: self.inline_css.append(data)
        if self.in_script: self.inline_js.append(data)


def tracked_sources(work):
    entries = {}
    raw = git(work, 'ls-tree', '-r', '-z', '--full-tree', 'HEAD', '--',
              *('public/' + prefix for prefix in RUNTIMES), *SOURCE_INPUTS)
    for record in raw.split(b'\0'):
        if not record: continue
        info, name = record.split(b'\t', 1)
        mode, kind, blob = info.decode().split()
        path = name.decode('utf-8')
        require(mode in ('100644', '100755') and kind == 'blob', 'Unsafe tracked source: ' + path)
        # Source inputs intentionally live under src; validate physical components separately.
        current = work
        for part in path.split('/'):
            current = current / part
            require(not current.is_symlink(), 'Symlink source rejected: ' + path)
        require(current.is_file(), 'Missing tracked source: ' + path)
        data = git(work, 'show', 'HEAD:' + path)
        require(current.read_bytes() == data, 'Tracked source differs from exact head: ' + path)
        entries[path] = {'path': path, 'gitBlob': blob, 'bytes': len(data), 'sha256': digest(data)}
    for path in SOURCE_INPUTS:
        require(path in entries, 'Missing required committed source binding: ' + path)
    for prefix, count in RUNTIMES.items():
        names = [name for name in entries if name.startswith('public/' + prefix + '/')]
        require(len(names) == count, 'Unexpected tracked runtime inventory for ' + prefix + ': ' + str(len(names)))
    return entries


class Graph:
    def __init__(self, dist, byte_budget=BUDGET):
        self.dist, self.byte_budget = dist, byte_budget
        self.files, self.queue, self.edges = {}, deque(), []
        self.external, self.ignored, self.javascript_literals = [], [], []
        self.census_paths = []
        self.needs_census, self.census_done = False, False
        self.total = 0

    def include_path(self, relative, reason):
        if relative in self.files: return
        path = safe_file(self.dist, relative)
        allow_html = relative in (UES_PAGE, 'nouns-money/workshop/index.html')
        allow_runtime = any(relative.startswith(prefix + '/') for prefix in RUNTIMES)
        require(allow_runtime or allow_html or path.suffix.lower() in EXTENSIONS, 'Out-of-scope dependency type: ' + relative)
        require(path.suffix.lower() != '.html' or allow_html, 'Unrelated navigation page rejected: ' + relative)
        size = path.stat().st_size
        require(len(self.files) < MAX_FILES and self.total + size <= self.byte_budget, 'Artifact exceeds bounded file/byte budget')
        data = path.read_bytes()
        require(len(data) == size, 'File changed during inventory: ' + relative)
        self.files[relative] = {'path': relative, 'bytes': size, 'sha256': digest(data), 'admittedBy': reason}
        self.total += size; self.queue.append(relative)
        if relative.startswith('_astro/') and path.suffix.lower() in ('.js', '.mjs'):
            self.needs_census = True

    def reference(self, value, from_path, kind, site_root=False):
        category, normalized = local_reference(value, from_path, site_root)
        if category == 'local':
            self.edges.append({'from': from_path, 'url': value, 'path': normalized, 'kind': kind})
            self.include_path(normalized, kind)
        elif category == 'external': self.external.append({'from': from_path, 'url': normalized, 'kind': kind, 'fetched': False})
        else: self.ignored.append({'from': from_path, 'kind': category + '-' + kind})

    def inventory_js(self, text, relative):
        # Candidate inventory only: strings/comments/regex are not parsed as JS.
        # Complete emitted JS/CSS/fonts are included separately, without a
        # fragile claim that this regex discovers a JavaScript module graph.
        for match in re.finditer(r"[\"']([^\"'\\\r\n]{1,2048})[\"']", text):
            value = match.group(1)
            if value.startswith(('https://', 'http://', '//')):
                self.external.append({'from': relative, 'url': value, 'kind': 'javascript-string-candidate', 'fetched': False})
            elif value.startswith(('_astro/', '/_astro/')):
                self.javascript_literals.append({'path': relative, 'offset': match.start(), 'value': value,
                                                 'kind': 'unparsed-generated-asset-string-candidate', 'interpreted': False})

    def add_generated_census(self):
        if self.census_done or not self.needs_census:
            return
        self.census_done = True
        for directory in ('_astro', 'fonts'):
            root = self.dist / directory
            if not root.exists():
                require(directory != '_astro', 'Generated JavaScript requires the emitted _astro directory')
                continue
            require(root.is_dir() and not root.is_symlink(), 'Unsafe generated dependency directory: ' + directory)
            for path in sorted(root.rglob('*')):
                relative = path.relative_to(self.dist).as_posix()
                require(not path.is_symlink(), 'Symlink census entry rejected: ' + relative)
                if path.is_file() and path.suffix.lower() in ('.js', '.mjs', '.css', '.woff', '.woff2', '.ttf', '.otf', '.eot'):
                    self.include_path(relative, 'complete-emitted-js-css-font-census')
                    self.census_paths.append(relative)

    def scan_css(self, text, relative):
        try:
            references = css_references(text)
        except ValueError as error:
            raise ValueError('CSS parse error in ' + relative + ': ' + str(error)) from error
        for value, kind in references: self.reference(value, relative, kind)

    def traverse(self):
        while self.queue:
            self.add_generated_census()
            relative = self.queue.popleft()
            suffix = Path(relative).suffix.lower()
            if suffix not in ('.html', '.svg', '.css', '.js', '.mjs', '.webmanifest'): continue
            data = safe_file(self.dist, relative).read_bytes()
            require(digest(data) == self.files[relative]['sha256'], 'Dependency changed during graph scan: ' + relative)
            text = data.decode('utf-8')
            if suffix in ('.html', '.svg'):
                parsed = HtmlReferences(text)
                for value, kind in parsed.refs: self.reference(value, relative, kind)
                for css in parsed.inline_css: self.scan_css(css, relative)
                for js in parsed.inline_js: self.inventory_js(js, relative)
                for value in parsed.external_candidates: self.external.append({'from': relative, 'url': value, 'kind': 'html-attribute-candidate', 'fetched': False})
                self.ignored.extend(dict(record, path=relative) for record in parsed.ignored)
            elif suffix == '.css': self.scan_css(text, relative)
            elif suffix in ('.js', '.mjs'): self.inventory_js(text, relative)
            elif suffix == '.webmanifest':
                value = json.loads(text)
                for icon in value.get('icons', []):
                    if icon.get('src'): self.reference(icon['src'], relative, 'webmanifest-icon')


def package(work, output, expected_head, expected_tree=None, byte_budget=BUDGET):
    work = work.resolve()
    require(0 < byte_budget <= BUDGET, 'Byte budget must be positive and at most 40 MB')
    require(not output.exists() and not output.is_symlink(), 'Artifact output must be fresh')
    dist = work / 'dist'
    require(dist.is_dir() and not dist.is_symlink(), 'Fresh compiled dist directory required')
    require(not output.resolve().is_relative_to(dist.resolve()), 'Artifact output cannot be inside dist')
    head, tree = identity(work, expected_head, expected_tree)
    bindings = tracked_sources(work)
    graph = Graph(dist, byte_budget)
    for prefix in RUNTIMES:
        root = dist / prefix
        require(root.is_dir() and not root.is_symlink(), 'Missing/symlinked runtime directory: ' + prefix)
        actual = []
        for path in root.rglob('*'):
            require(not path.is_symlink(), 'Symlink runtime entry rejected: ' + str(path.relative_to(dist)))
            if path.is_file(): actual.append(path.relative_to(dist).as_posix())
        expected = {name.removeprefix('public/') for name in bindings if name.startswith('public/' + prefix + '/')}
        require(set(actual) == expected, 'Compiled runtime inventory differs from tracked source: ' + prefix)
        for relative in sorted(actual):
            graph.include_path(relative, 'complete-scoped-runtime')
            source = bindings['public/' + relative]
            equal = graph.files[relative]['sha256'] == source['sha256']
            if not equal:
                require(relative == 'nouns-money/workshop/index.html', 'Compiled runtime bytes differ from exact source: ' + relative)
                graph.files[relative]['declaredBuildTransformation'] = head_only_seo_transform(
                    git(work, 'show', 'HEAD:public/' + relative), safe_file(dist, relative).read_bytes())
            graph.files[relative]['sourcePath'] = source['path']
            graph.files[relative]['sourceByteMatch'] = equal
    graph.include_path(UES_PAGE, 'compiled-ues-entry')
    graph.traverse()
    require(identity(work, expected_head, expected_tree) == (head, tree), 'Head changed during packaging')
    manifest = {'schema': SCHEMA, 'head': head, 'tree': tree, 'expectedHead': expected_head,
                'buildInput': 'Existing exact-head remote CI full build; packager performs no build',
                'entrypoints': ['nouns-money/workshop/index.html', UES_PAGE],
                'runtimeInventories': {prefix: {'fileCount': count, 'scope': 'entire exact tracked public file inventory; non-HTML bytes source-exact; Workshop HTML permits only declared SEO-head transformation'} for prefix, count in RUNTIMES.items()},
                'files': [graph.files[key] for key in sorted(graph.files)], 'fileCount': len(graph.files),
                'totalBytes': graph.total, 'byteBudgetIncludingManifest': byte_budget,
                'sourceBindings': [bindings[key] for key in sorted(bindings)],
                'packagerSha256': digest(Path(__file__).read_bytes()),
                'dependencyEdges': sorted(graph.edges, key=lambda e: (e['from'], e['path'], e['kind'], e['url'])),
                'externalReferences': sorted({json.dumps(x, sort_keys=True): x for x in graph.external}.values(), key=lambda e: (e['from'], e['url'], e['kind'])),
                'excludedReferences': graph.ignored, 'javascriptLiteralInventory': graph.javascript_literals,
                'emittedDependencyCensus': {'triggered': graph.census_done, 'directories': ['_astro', 'fonts'],
                    'extensions': ['.js', '.mjs', '.css', '.woff', '.woff2', '.ttf', '.otf', '.eot'],
                    'paths': sorted(graph.census_paths)},
                'scope': 'Two complete scoped public runtimes; compiled UES page, its local HTML/CSS dependency closure, and the complete emitted _astro/fonts JS/CSS/font census when generated JavaScript is referenced.',
                'limitations': ['No external fetching, browser evaluation, backend/API responses or navigation destinations.',
                               'No general JavaScript parsing or module-graph claim. Complete emitted JS/CSS/font census covers generated code instead.',
                               'JavaScript string literals are inventoried as unparsed candidates only; dynamic strings, fetches and computed URLs are not evaluated or guessed.',
                               'Complete scoped runtimes include their JSON/SVG/license files even when referenced only through computed local names.',
                               'Manifest source bindings contain paths and hashes only; source/private evidence files are not copied.']}
    encoded = (json.dumps(manifest, indent=2, ensure_ascii=False) + '\n').encode()
    require(graph.total + len(encoded) <= byte_budget, 'Artifact plus manifest exceeds 40 MB budget')
    output.parent.mkdir(parents=True, exist_ok=True)
    stage = output.with_name('.' + output.name + '.packaging-' + str(os.getpid()))
    require(not stage.exists() and not stage.is_symlink(), 'Staging path must be fresh')
    stage.mkdir()
    try:
        for relative, record in sorted(graph.files.items()):
            data = safe_file(dist, relative).read_bytes()
            require(len(data) == record['bytes'] and digest(data) == record['sha256'], 'Dependency changed before copy: ' + relative)
            target = stage / relative; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
        (stage / 'manifest.json').write_bytes(encoded)
        require(identity(work, expected_head, expected_tree) == (head, tree), 'Head changed before artifact finalization')
        stage.rename(output)
    except BaseException:
        shutil.rmtree(stage)
        raise
    return {'head': head, 'tree': tree, 'files': len(graph.files), 'bytes': graph.total,
            'manifestBytes': len(encoded), 'externalReferenceCount': len(manifest['externalReferences']),
            'javascriptLiteralCandidateCount': len(graph.javascript_literals), 'outputDirectory': str(output)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('work', type=Path)
    parser.add_argument('--expected-head', required=True)
    parser.add_argument('--expected-tree')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    work = args.work.resolve()
    output = args.output if args.output is not None else work / 'workshop-qa-artifact'
    try:
        record = package(work, output, args.expected_head, args.expected_tree)
        print(json.dumps(record, indent=2))
        return 0
    except (OSError, ValueError, subprocess.SubprocessError, UnicodeError) as error:
        print(json.dumps({'passed': False, 'error': type(error).__name__ + ': ' + str(error)}), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
