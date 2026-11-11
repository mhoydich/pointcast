"""Writes one ping per town (/local-census/<slug>/ping.json) and the network file (/ping-kit/network.json)
from the Local Census town files. Run from the repo root after build_census.py."""
import json
ROOT='public/local-census'; BASE='https://pointcast.xyz'
GEO={"el-segundo":(33.919,-118.416),"manhattan-beach":(33.885,-118.411),"hermosa-beach":(33.862,-118.399),"redondo-beach":(33.849,-118.388),
     "torrance":(33.836,-118.341),"hawthorne":(33.916,-118.353),"inglewood":(33.962,-118.353),"culver-city":(34.021,-118.396),
     "gardena":(33.888,-118.309),"carson":(33.831,-118.282)}
region=json.load(open(f'{ROOT}/region.json')); slugs=[t['slug'] for t in region['towns']]
def near(slug,n=3):
    a=GEO[slug]; d=sorted((( (a[0]-GEO[s][0])**2+((a[1]-GEO[s][1])*0.83)**2, s) for s in slugs if s!=slug))
    return [s for _,s in d[:n]]
pings=[]
for slug in slugs:
    t=json.load(open(f'{ROOT}/towns/{slug}.json')); hh=[o['value'] for o in t['official'] if o['label']=='Households'][0]
    pop=[o for o in t['official'] if o['label']=='Residents'][0]
    top=sorted(t['postings']['families'],key=lambda f:-f['count'])[0]
    p={"ping":"0.1","town":t['name'],"slug":slug,"region":"South Bay, Los Angeles County, California",
       "lat":GEO[slug][0],"lon":GEO[slug][1],"updated":t['snapshot'],
       "home":f"{BASE}/local-census/{slug}/","data":f"{BASE}/local-census/towns/{slug}.json",
       "signals":[
         {"kind":"residents","label":"Residents","value":pop['value'],"grade":pop['grade']},
         {"kind":"jobs_posted_30d","label":"Jobs posted in 30 days","value":t['postings']['total'],"grade":"C"},
         {"kind":"jobs_per_100_households","label":"Postings per 100 households","value":round(t['postings']['total']/hh*1000)/10,"grade":"C"},
         {"kind":"top_job_family","label":"Largest job family","value":top['name'],"count":top['count'],"grade":"C"}],
       "needs":[{"need":r['need'],"next_step":r['move'],"confidence":r['confidence']} for r in t['reads']],
       "asks":[g for g in t['gaps']],
       "neighbors":near(slug),
       "maintainer":"PointCast","contact":"mh@pointcast.xyz"}
    json.dump(p,open(f'{ROOT}/{slug}/ping.json','w'),indent=1,ensure_ascii=False); pings.append(p)
net={"network":"South Bay ping network","ping":"0.1","updated":region['snapshot'],
     "about":"Each town publishes one small file saying what it is, what it needs and what it does not know. This file lists them.",
     "towns":[{"town":p['town'],"slug":p['slug'],"lat":p['lat'],"lon":p['lon'],"ping":f"{BASE}/local-census/{p['slug']}/ping.json","home":p['home'],
               "jobs_posted_30d":p['signals'][1]['value'],"jobs_per_100_households":p['signals'][2]['value'],
               "top_need":p['needs'][0]['need'],"neighbors":p['neighbors']} for p in pings]}
json.dump(net,open('public/ping-kit/network.json','w'),indent=1,ensure_ascii=False)
print(len(pings),[ (p['slug'],p['neighbors']) for p in pings][:3])
