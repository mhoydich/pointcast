#!/usr/bin/env python3
"""Serve public/ at / and scripts/spatial/fixtures/ at /__fixtures/ for the spatial kit's browser test.

  python3 scripts/spatial/serve.py [port]        (default 8101)

The fixtures are test pages whose manifests are hostile on purpose, so they are kept out of public/
and are never deployed. This server is for local testing only."""
import http.server, os, sys
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC = os.path.join(ROOT, 'public')
FIXTURES = os.path.join(ROOT, 'scripts', 'spatial', 'fixtures')


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if clean.startswith('/__fixtures/'):
            rel = os.path.normpath(clean[len('/__fixtures/'):]).lstrip(os.sep)
            if rel.startswith('..'):
                return os.path.join(FIXTURES, '__nope__')
            return os.path.join(FIXTURES, rel)
        return super().translate_path(path)

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8101
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=PUBLIC))
    print(f'serving {PUBLIC} on http://localhost:{port}/ (fixtures at /__fixtures/)')
    httpd.serve_forever()
