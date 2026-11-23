#!/usr/bin/env python3
"""Retrieve a bounded USGS ComCat CSV to a new file without overwriting snapshots."""
import argparse
import csv
import hashlib
from pathlib import Path
import urllib.parse
import urllib.request

p = {'format':'csv', 'starttime':'2020-01-01', 'endtime':'2025-01-01', 'latitude':'33.9192', 'longitude':'-118.4165', 'maxradiuskm':'40.2336', 'minmagnitude':'3', 'eventtype':'earthquake', 'orderby':'time-asc'}
url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?' + urllib.parse.urlencode(p)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path, help='New output filename; must not already exist')
args=parser.parse_args()
with urllib.request.urlopen(url,timeout=60) as response:
    data=response.read(); content_type=response.headers.get_content_type()
if content_type not in ('text/csv','text/plain','application/csv'):
    raise SystemExit(f'Refusing non-CSV content type: {content_type}')
with args.output.open('xb') as f: f.write(data)
with args.output.open(newline='',encoding='utf-8-sig') as f: rows=list(csv.DictReader(f))
print(f'URL: {url}\nWrote {len(rows)} rows to {args.output}\nSHA-256: {hashlib.sha256(data).hexdigest()}')
print('Validate the new snapshot and record its UTC retrieval time before use.')
