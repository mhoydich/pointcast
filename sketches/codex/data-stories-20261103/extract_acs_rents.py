#!/usr/bin/env python3
"""Extract four city rows from a locally downloaded official ACS B25064 file."""
import csv, hashlib, json, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
PLACES={'1600000US0633364':'Hermosa Beach','1600000US0645400':'Manhattan Beach','1600000US0660018':'Redondo Beach','1600000US0680000':'Torrance'}
if len(sys.argv)!=2: raise SystemExit('Usage: python3 extract_acs_rents.py /path/to/acsdt5y2024-b25064.dat')
p=Path(sys.argv[1]); results={}
with p.open(newline='',encoding='utf-8-sig') as f:
    reader=csv.DictReader(f,delimiter='|')
    if not {'GEO_ID','B25064_E001','B25064_M001'}.issubset(reader.fieldnames or []): raise ValueError('Unexpected ACS schema')
    for row in reader:
        geo=row['GEO_ID']
        if geo in PLACES:
            if geo in results: raise ValueError(f'Duplicate geographic ID {geo}')
            est,moe=row['B25064_E001'],row['B25064_M001']
            if not (est.isdigit() and moe.isdigit()): raise ValueError(f'Nonstandard or suppressed ACS value for {geo}: consult annotations')
            results[geo]={'city':PLACES[geo],'geo_id':geo,'estimate_usd_month':int(est),'moe_90pct_usd_month':int(moe)}
if set(results)!=set(PLACES): raise ValueError(f'Missing IDs: {set(PLACES)-set(results)}')
with (HERE/'acs_2020_2024_gross_rent.csv').open('w',newline='',encoding='utf-8') as f:
    writer=csv.DictWriter(f,fieldnames=['city','geo_id','estimate_usd_month','moe_90pct_usd_month']);writer.writeheader();writer.writerows(results[k] for k in sorted(results))
hash=hashlib.sha256()
with p.open('rb') as f:
    for chunk in iter(lambda:f.read(1024*1024),b''): hash.update(chunk)
print(json.dumps({'input':str(p),'sha256':hash.hexdigest(),'rows_written':len(results)},indent=2))
