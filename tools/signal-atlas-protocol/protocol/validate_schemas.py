"""Offline artifact validation. Requires already-installed jsonschema; no network."""
import copy
import json
from datetime import datetime
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
# Validate date-time without relying on optional jsonschema format extras.
checker=FormatChecker()
@checker.checks('date-time')
def strict_datetime(value):
 if not isinstance(value,str):return True
 try:
  return datetime.fromisoformat(value.replace('Z','+00:00')).tzinfo is not None
 except ValueError:return False
ROOT=Path(__file__).parent
schemas={name:json.loads((ROOT/name).read_text()) for name in ['challenge.schema.json','attempt.schema.json','public-feed.schema.json']}
for schema in schemas.values(): Draft202012Validator.check_schema(schema)
validator=Draft202012Validator(schemas['public-feed.schema.json'],format_checker=checker)
feed=json.loads((ROOT/'unconnected.public.json').read_text())
checks=0
def check(value,valid,label):
 global checks
 errors=list(validator.iter_errors(value))
 assert (not errors)==valid, (label,[e.message for e in errors])
 checks+=1
check(feed,True,'safe unconnected default')
for field in ['ip','pid','userAgent','email','wallet']:
 bad=copy.deepcopy(feed);bad[field]='private';check(bad,False,'no public '+field)
bad=copy.deepcopy(feed);bad['sites'][0]['metrics']['claimed_requests']=0;check(bad,False,'unknown not zero')
bad=copy.deepcopy(feed);bad['sites'][3]['measurement_origin']='ues';check(bad,False,'UES shares origin')
bad=copy.deepcopy(feed);bad['sites'][3]=copy.deepcopy(bad['sites'][0]);check(bad,False,'canonical sites unique')
bad=copy.deepcopy(feed);bad['sites'][0]['coverage_state']='connected';check(bad,False,'connected requires source/window/time')
row={'catalog_id':'fixture-mica','site_id':'pointcast','observation':'observed_claimed','participation':'not_enrolled','verification_method':'ua_claim','observed_day':'2026-11-01','data_mode':'fixture'}
fixture=copy.deepcopy(feed);fixture['data_mode']='fixture';fixture['generated_at']='2026-11-01T15:00:00.000Z';fixture['league']['state']='practice_only';fixture['encounters']=[row]
check(fixture,True,'labeled fixture')
bad=copy.deepcopy(fixture);bad['encounters'][0]['data_mode']='live';check(bad,False,'fixture cannot mix live')
live=copy.deepcopy(feed);live['data_mode']='live';live['generated_at']='2026-11-01T15:00:00.000Z';live['encounters']=[dict(row,data_mode='live',catalog_id='gptbot')]
check(live,False,'unconnected site cannot have observed live rows')
live['sites'][0].update(coverage_state='connected',window={'start':'2026-11-01T00:00:00.000Z','end':'2026-11-01T15:00:00.000Z','complete':True},last_ingest_at='2026-11-01T15:00:00.000Z',source={'kind':'edge_aggregate','verification_version':'v1','sample_rate':1})
live['sites'][0]['metrics']['claimed_requests']=1
check(live,True,'connected live record with unconnected other sites')
bad=copy.deepcopy(live);bad['encounters'][0]['data_mode']='fixture';check(bad,False,'live cannot mix fixture')
bad=copy.deepcopy(live);bad['encounters'][0]['observation']='origin_confirmed';check(bad,False,'UA cannot confirm origin')
bad=copy.deepcopy(live);bad['encounters'][0]['verification_method']='participant_key_signature';bad['encounters'][0]['participation']='signed_opt_in';bad['encounters'][0]['observation']='origin_confirmed';check(bad,False,'participant signature not provider identity')
bad=copy.deepcopy(live);bad['sites'][0]['coverage_state']='partial';bad['sites'][0]['metrics']['claimed_requests']=0;check(bad,False,'partial zero is unknown')
bad=copy.deepcopy(live);bad['sites'][0]['source']={'kind':'fixture','verification_version':'v1','sample_rate':1};check(bad,False,'live cannot use fixture source')
bad=copy.deepcopy(live);bad['encounters'][0]['observed_day']='2026-02-31';check(bad,False,'real dates required')
bad=copy.deepcopy(live);bad['sites'][0]['metrics']['claimed_requests']=-1;check(bad,False,'no negative counts')
# Independent-review regressions: each is tested in isolation, not masked by other errors.
bad=copy.deepcopy(live);bad['league']['rows']=[{'site_id':'pointcast','value':99,'data_mode':'live'}];check(bad,False,'disconnected league cannot publish standings')
bad=copy.deepcopy(live);bad['league']['state']='open';bad['league']['rows']=[{'site_id':'pointcast','value':99,'data_mode':'live'}];check(bad,False,'open league needs independent adjudication source/window/time')
partial=copy.deepcopy(live);partial['sites'][0].update(coverage_state='partial',window=None,source=None,last_ingest_at=None);partial['sites'][0]['metrics']['claimed_requests']=42;check(partial,False,'partial observations need source/window/ingest')
partial=copy.deepcopy(live);partial['sites'][0]['coverage_state']='partial';partial['sites'][0]['window']['complete']=False;partial['sites'][0]['metrics']['claimed_requests']=42;check(partial,True,'partial counts permitted only with evidence context')
for private_id in ['192.168.1.1','2001.db8.1','person-at-example.com','arbitrary-key-hash','fixture-mica']:
 bad=copy.deepcopy(partial);bad['encounters'][0]['catalog_id']=private_id;check(bad,False,'known-family allowlist rejects '+private_id)
bad=copy.deepcopy(partial);bad['sites'][0]['source']['verification_version']='192.168.1.1';check(bad,False,'no personal IDs in version label')
league_live=copy.deepcopy(feed);league_live.update(data_mode='live',generated_at='2026-11-01T15:00:00.000Z');league_live['league'].update(state='open',source={'kind':'server_adjudications','rubric_version':'v1','task_manifest_hash':'a'*64},window={'start':'2026-11-01T00:00:00.000Z','end':'2026-11-01T15:00:00.000Z','complete':True},last_adjudicated_at='2026-11-01T15:00:00.000Z',rows=[{'site_id':'pointcast','value':1,'data_mode':'live'}]);check(league_live,True,'independently grounded Circuit works without crawler telemetry')
bad=copy.deepcopy(league_live);bad['league']['state']='paused';check(bad,False,'paused league publishes no current standings')
challenge={'challenge_id':'challenge-001','site_id':'pointcast','season_id':'season-001','task_id':'citation-relay','task_version':'v1','dataset_hash':'a'*64,'nonce':'A'*22,'issued_at':'2026-11-01T15:00:00.000Z','expires_at':'2026-11-01T15:01:00.000Z','terms_hash':'b'*64,'participant_key_id':'c'*64,'data_mode':'fixture'}
cv=Draft202012Validator(schemas['challenge.schema.json'],format_checker=checker)
av=Draft202012Validator(schemas['attempt.schema.json'],format_checker=checker)
assert not list(cv.iter_errors(challenge));checks+=1
for patch in [{'site_id':'unknown'},{'nonce':'bad'},{'issued_at':'2026-02-31T00:00:00.000Z'},{'secret_key':'never'}]:
 assert list(cv.iter_errors(dict(challenge,**patch)));checks+=1
# Shape-only fake zero bytes are intentionally NOT treated as a valid signature.
attempt=dict(challenge,attempt_id='attempt-001',public_key='A'*43,result_hash='d'*64,opt_in=True,signature='A'*86)
assert not list(av.iter_errors(attempt));checks+=1
for patch in [{'opt_in':False},{'signature':'bad'},{'ip':'127.0.0.1'},{'public_key':'bad'}]:
 assert list(av.iter_errors(dict(attempt,**patch)));checks+=1
print(f'{len(schemas)} JSON schemas valid; {checks} public-feed/wire contract checks passed.')
