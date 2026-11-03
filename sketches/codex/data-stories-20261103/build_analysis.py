#!/usr/bin/env python3
"""Validate a frozen USGS ComCat CSV and derive transparent exploratory tables.

Run: python3 build_analysis.py [INPUT.csv]
This does not download data or estimate risk. Spherical distance is an
independent approximation; the selection itself was made by the USGS API.
"""
import csv
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'comcat_2020_2024.csv'
CENTER_LAT, CENTER_LON = 33.9192, -118.4165
RADIUS_KM = 40.2336
# Slight tolerance allows ellipsoid/sphere disagreement at the boundary.
DISTANCE_TOLERANCE_KM = 0.3
START = dt.datetime(2020, 1, 1, tzinfo=dt.timezone.utc)
END = dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc)

def distance_km(lat, lon):
    a, b = math.radians(CENTER_LAT), math.radians(lat)
    dlat, dlon = b-a, math.radians(lon-CENTER_LON)
    h = math.sin(dlat/2)**2 + math.cos(a)*math.cos(b)*math.sin(dlon/2)**2
    return 6371.0088 * 2 * math.asin(math.sqrt(min(1, h)))

def build(path):
    with path.open(newline='', encoding='utf-8-sig') as fh:
        rows = list(csv.DictReader(fh))
    required = {'id','time','updated','latitude','longitude','depth','mag','magType','place','type','status'}
    if not rows or not required.issubset(rows[0]):
        raise ValueError('Input is empty or lacks required ComCat columns')
    seen = set(); events = []
    for row in rows:
        if not row['id'] or row['id'] in seen: raise ValueError('Missing or duplicate event ID')
        seen.add(row['id'])
        t = dt.datetime.fromisoformat(row['time'].replace('Z', '+00:00'))
        lat, lon, mag, depth = map(float, (row['latitude'], row['longitude'], row['mag'], row['depth']))
        if not all(math.isfinite(v) for v in (lat, lon, mag, depth)): raise ValueError('Non-finite numeric value')
        if not (-90 <= lat <= 90 and -180 <= lon <= 180): raise ValueError('Invalid coordinates')
        if not START <= t < END: raise ValueError('Time outside half-open query period')
        if mag < 3 or row['type'] != 'earthquake': raise ValueError('Event outside type or magnitude filter')
        distance = distance_km(lat, lon)
        if distance > RADIUS_KM + DISTANCE_TOLERANCE_KM: raise ValueError('Event outside approximate radius tolerance')
        events.append((row, t, mag, depth, distance))
    events.sort(key=lambda x: x[1])
    out = HERE / 'events_with_distance.csv'
    fields = ['id','time_utc','updated_utc','latitude','longitude','depth_km','magnitude','magnitude_type','place','status','distance_from_approx_center_km']
    with out.open('w', newline='', encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader()
        for r,t,mag,depth,d in events:
            w.writerow(dict(id=r['id'],time_utc=r['time'],updated_utc=r['updated'],latitude=r['latitude'],longitude=r['longitude'],depth_km=r['depth'],magnitude=r['mag'],magnitude_type=r['magType'],place=r['place'],status=r['status'],distance_from_approx_center_km=f'{d:.3f}'))
    annual=[]
    for year in range(2020, 2025):
        group=[e for e in events if e[1].year == year]
        annual.append(dict(year=year,events=len(group),magnitude_3_to_lt4=sum(3 <= e[2] < 4 for e in group),magnitude_4_or_higher=sum(e[2] >= 4 for e in group),largest_magnitude=f'{max((e[2] for e in group), default=0):.2f}' if group else ''))
    with (HERE/'annual_summary.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=annual[0].keys());w.writeheader();w.writerows(annual)
    meta={'input_filename':path.name,'input_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'event_count':len(events),'unique_event_ids':len(seen),'reviewed_count':sum(e[0]['status']=='reviewed' for e in events),'center_approx_lat':CENTER_LAT,'center_approx_lon':CENTER_LON,'api_maxradius_km':RADIUS_KM,'distance_calculation':'Haversine; mean Earth radius 6371.0088 km','largest_approx_distance_km':round(max(e[4] for e in events),3),'year_counts':{str(a['year']):a['events'] for a in annual},'warning':'Historical catalog snapshot; counts are not forecasts or shaking measurements. Aftershocks included; completeness and detection vary.'}
    (HERE/'analysis_metadata.json').write_text(json.dumps(meta, indent=2)+'\n', encoding='utf-8')
    return meta

if __name__ == '__main__':
    print(json.dumps(build(SOURCE), indent=2))
