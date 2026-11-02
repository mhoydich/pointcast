"""Independent fixed-invariant tests: passing means the reproduced unsafe states are rejected."""
import copy,json
from pathlib import Path
from jsonschema import Draft202012Validator,FormatChecker
root=Path(__file__).resolve().parents[1]/'protocol'
v=Draft202012Validator(json.loads((root/'public-feed.schema.json').read_text()),format_checker=FormatChecker())
base=json.loads((root/'unconnected.public.json').read_text())
base.update(data_mode='live',generated_at='2026-11-01T15:00:00.000Z')
def accepted(name,patch):
 f=copy.deepcopy(base);patch(f)
 errors=list(v.iter_errors(f));assert errors,('UNSAFE STATE STILL ACCEPTED',name);print('REJECTED:',name)
accepted('not_connected league publishes nonzero live standings',lambda f:f['league'].update(rows=[dict(site_id='pointcast',value=99,data_mode='live')]))
def partial(f):
 f['sites'][0]['coverage_state']='partial'
 f['sites'][0]['metrics']['claimed_requests']=42
 f['encounters']=[dict(catalog_id='gptbot',site_id='pointcast',observation='origin_confirmed',participation='not_enrolled',verification_method='provider_cidr',observed_day='2026-11-01',data_mode='live')]
accepted('partial site claims verified encounters/counts with null source, window and ingestion time',partial)
def ip_catalog(f):
 partial(f);f['encounters'][0]['catalog_id']='192.168.1.1'
accepted('raw IP can pass in unconstrained catalog_id field',ip_catalog)
# Isolate privacy validation from the partial-site failures above.
valid=copy.deepcopy(base);partial(valid)
valid['sites'][0].update(source={'kind':'edge_aggregate','verification_version':'v1','sample_rate':1},window={'start':'2026-11-01T00:00:00.000Z','end':'2026-11-01T15:00:00.000Z','complete':False},last_ingest_at='2026-11-01T15:00:00.000Z')
assert not list(v.iter_errors(valid)), 'positive valid partial control rejected'
valid['encounters'][0]['catalog_id']='192.168.1.1'
assert list(v.iter_errors(valid)), 'IP catalog accepted with otherwise valid provenance'
print('REJECTED: IP catalog with otherwise valid provenance; positive control passed')
# Circuit and Atlas coverage are independent: prove valid open Circuit works with disconnected Atlas.
valid=copy.deepcopy(base)
valid['league'].update(state='open',source={'kind':'server_adjudications','rubric_version':'v1','task_manifest_hash':'a'*64},window={'start':'2026-11-01T00:00:00.000Z','end':'2026-11-01T15:00:00.000Z','complete':True},last_adjudicated_at='2026-11-01T15:00:00.000Z',rows=[dict(site_id='pointcast',value=1,data_mode='live')])
assert not list(v.iter_errors(valid)), 'independent sourced Circuit rejected'
print('ACCEPTED: independently sourced Circuit with disconnected Atlas')
