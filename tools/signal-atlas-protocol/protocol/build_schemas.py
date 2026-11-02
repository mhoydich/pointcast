"""Author schema artifacts only; no network or application persistence."""
import json
from pathlib import Path
ROOT=Path(__file__).parent
SITE_IDS=['pointcast','el-segundo','industry-next','ues']
REAL_CATALOG_IDS=['gptbot','oai-searchbot','chatgpt-user','oai-adsbot','googlebot','bingbot','unknown-automation']
FIXTURE_CATALOG_IDS=['fixture-kite','fixture-mica','fixture-loop','fixture-notch']
base={'$schema':'https://json-schema.org/draft/2020-12/schema'}
identifier={'type':'string','pattern':'^[a-z0-9][a-z0-9._-]{0,79}$'}
hash64={'type':'string','pattern':'^[a-f0-9]{64}$'}
stamp={'type':'string','format':'date-time','pattern':r'^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$'}
props={
 'challenge_id':identifier,'site_id':{'enum':SITE_IDS},'season_id':identifier,'task_id':identifier,'task_version':identifier,
 'dataset_hash':hash64,'nonce':{'type':'string','pattern':'^[A-Za-z0-9_-]{22}$'},'issued_at':stamp,'expires_at':stamp,
 'terms_hash':hash64,'participant_key_id':hash64,'data_mode':{'enum':['fixture','live']}
}
challenge={**base,'$id':'urn:pointcast:league-challenge:v1','title':'League challenge: server-owned context; structural validation only','type':'object','additionalProperties':False,'required':list(props),'properties':props}
attemptprops={**props,'attempt_id':identifier,'public_key':{'type':'string','pattern':'^[A-Za-z0-9_-]{43}$'},'result_hash':hash64,'opt_in':{'const':True},'signature':{'type':'string','pattern':'^[A-Za-z0-9_-]{86}$'}}
attempt={**base,'$id':'urn:pointcast:league-attempt:v1','title':'Signed opt-in attempt: Ed25519 verification is also required','type':'object','additionalProperties':False,'required':list(attemptprops),'properties':attemptprops}
nullableCount={'type':['integer','null'],'minimum':0}
metricNames=['claimed_requests','origin_confirmed_requests','signed_participant_submissions','verified_unique_tasks']
metrics={'type':'object','additionalProperties':False,'required':metricNames,'properties':{k:nullableCount for k in metricNames}}
site={
 'type':'object','additionalProperties':False,
 'required':['site_id','measurement_origin','coverage_state','window','last_ingest_at','source','metrics'],
 'properties':{
  'site_id':{'enum':SITE_IDS},'measurement_origin':{'enum':['pointcast','el-segundo','industry-next']},
  'coverage_state':{'enum':['not_connected','partial','connected','stale','paused']},
  'window':{'oneOf':[{'type':'null'},{'type':'object','additionalProperties':False,'required':['start','end','complete'],'properties':{'start':stamp,'end':stamp,'complete':{'type':'boolean'}}}]},
  'last_ingest_at':{'oneOf':[{'type':'null'},stamp]},
  'source':{'oneOf':[{'type':'null'},{'type':'object','additionalProperties':False,'required':['kind','verification_version','sample_rate'],'properties':{'kind':{'enum':['edge_aggregate','manual_aggregate','fixture']},'verification_version':{'enum':['v1']},'sample_rate':{'type':['number','null'],'exclusiveMinimum':0,'maximum':1}}}]},
  'metrics':metrics
 },
 'allOf':[
  {'if':{'properties':{'coverage_state':{'enum':['not_connected','stale','paused']}}},'then':{'properties':{'metrics':{'properties':{k:{'type':'null'} for k in metricNames}}}}},
  {'if':{'properties':{'site_id':{'const':'ues'}}},'then':{'properties':{'measurement_origin':{'const':'pointcast'}}}},
  {'if':{'properties':{'coverage_state':{'const':'not_connected'}}},'then':{'properties':{'window':{'type':'null'},'last_ingest_at':{'type':'null'},'source':{'type':'null'}}}}
 ]
}
encounter={
 'type':'object','additionalProperties':False,
 'required':['catalog_id','site_id','observation','participation','verification_method','observed_day','data_mode'],
 'properties':{'catalog_id':{'enum':REAL_CATALOG_IDS+FIXTURE_CATALOG_IDS},'site_id':{'enum':SITE_IDS},'observation':{'enum':['observed_unattributed','observed_claimed','origin_confirmed']},'participation':{'enum':['not_enrolled','claimed_profile','signed_opt_in','suspended','revoked']},'verification_method':{'enum':['none','ua_claim','provider_cidr','forward_confirmed_rdns','provider_message_signature','participant_key_signature']},'observed_day':{'type':'string','format':'date'},'data_mode':{'enum':['fixture','live']}},
 'allOf':[
  {'if':{'properties':{'observation':{'const':'origin_confirmed'}}},'then':{'properties':{'verification_method':{'enum':['provider_cidr','forward_confirmed_rdns','provider_message_signature']}}}},
  {'if':{'properties':{'verification_method':{'const':'participant_key_signature'}}},'then':{'properties':{'participation':{'const':'signed_opt_in'},'observation':{'enum':['observed_unattributed','observed_claimed']}}}}
 ]
}
def conditional_mode(mode, properties):
 return {'if':{'properties':{'data_mode':{'const':mode}}},'then':{'properties':properties}}
def item_mode(mode):
 return {'items':{'properties':{'data_mode':{'const':mode}}}}
row={'type':'object','additionalProperties':False,'required':['site_id','value','data_mode'],
 'properties':{'site_id':{'enum':SITE_IDS},'value':{'type':'integer','minimum':0},'data_mode':{'enum':['fixture','live']}}}
league_source={'oneOf':[{'type':'null'},{'type':'object','additionalProperties':False,
 'required':['kind','rubric_version','task_manifest_hash'],
 'properties':{'kind':{'enum':['server_adjudications','fixture']},'rubric_version':{'enum':['v1']},'task_manifest_hash':hash64}}]}
league={'type':'object','additionalProperties':False,
 'required':['state','metric','rows','source','window','last_adjudicated_at'],
 'properties':{'state':{'enum':['not_connected','practice_only','open','paused']},'metric':{'const':'verified_unique_tasks'},
 'rows':{'type':'array','maxItems':100,'items':row},'source':league_source,
 'window':site['properties']['window'],'last_adjudicated_at':{'oneOf':[{'type':'null'},stamp]}},
 'allOf':[
  {'if':{'properties':{'state':{'const':'not_connected'}}},'then':{'properties':{'rows':{'maxItems':0},'source':{'type':'null'},'window':{'type':'null'},'last_adjudicated_at':{'type':'null'}}}},
  {'if':{'properties':{'state':{'const':'paused'}}},'then':{'properties':{'rows':{'maxItems':0}}}},
  {'if':{'properties':{'state':{'const':'practice_only'}}},'then':{'properties':{'rows':{'items':{'properties':{'data_mode':{'const':'fixture'}}}}}}},
  {'if':{'properties':{'state':{'const':'open'}}},'then':{'properties':{'source':{'type':'object','properties':{'kind':{'const':'server_adjudications'}}},'window':{'type':'object'},'last_adjudicated_at':{'type':'string'},'rows':{'items':{'properties':{'data_mode':{'const':'live'}}}}}}}
 ]
}
feed={
 **base,'$id':'urn:pointcast:bot-league-public-feed:v1','title':'Privacy-bounded Atlas feed; no personal/log identifiers','type':'object','additionalProperties':False,
 'required':['schema','data_mode','generated_at','sites','encounters','league'],
 'properties':{
  'schema':{'const':'pointcast.bot-league-public/v1'},'data_mode':{'enum':['unconnected','fixture','live']},
  'generated_at':{'oneOf':[{'type':'null'},stamp]},'sites':{'type':'array','minItems':4,'maxItems':4,'items':site},
  'encounters':{'type':'array','maxItems':100,'items':encounter},'league':league
 },
 'allOf':[
  conditional_mode('unconnected',{
   'generated_at':{'type':'null'},'encounters':{'maxItems':0},
   'sites':{'items':{'properties':{'coverage_state':{'const':'not_connected'}}}},
   'league':{'properties':{'state':{'const':'not_connected'},'rows':{'maxItems':0}}}
  }),
  conditional_mode('fixture',{
   'encounters':item_mode('fixture'),
   'league':{'properties':{'state':{'const':'practice_only'},'rows':item_mode('fixture')}}
  }),
  conditional_mode('live',{
   'encounters':item_mode('live'),
   'league':{'properties':{'rows':item_mode('live')}}
  })
 ]
}
# Semantic constraints expressible structurally; runtime still verifies context/signatures.
for site_id in SITE_IDS:
 site['allOf'].append({'if':{'properties':{'site_id':{'const':site_id}}},'then':{'properties':{'measurement_origin':{'const':'pointcast' if site_id=='ues' else site_id}}}})
site['allOf'].append({'if':{'properties':{'coverage_state':{'enum':['connected','partial']}}},'then':{'properties':{'source':{'type':'object'},'window':{'type':'object'},'last_ingest_at':{'type':'string'}}}})
nonzero_or_null={'anyOf':[{'type':'null'},{'type':'integer','minimum':1}]}
site['allOf'].append({'if':{'properties':{'coverage_state':{'const':'partial'}}},'then':{'properties':{'metrics':{'properties':{k:nonzero_or_null for k in metricNames}}}}})
site['allOf'].append({'if':{'properties':{'window':{'type':'object','properties':{'complete':{'const':False}}}}},'then':{'properties':{'metrics':{'properties':{k:nonzero_or_null for k in metricNames}}}}})
feed['properties']['sites']['allOf']=[{'contains':{'properties':{'site_id':{'const':s}}},'minContains':1,'maxContains':1} for s in SITE_IDS]
feed['allOf'].append(conditional_mode('live',{'generated_at':{'type':'string'},'sites':{'items':{'properties':{'source':{'not':{'type':'object','properties':{'kind':{'const':'fixture'}},'required':['kind']}}}}}}))
encounter['allOf'].append({'if':{'properties':{'observation':{'const':'observed_claimed'}}},'then':{'properties':{'verification_method':{'enum':['ua_claim','participant_key_signature']}}}})
encounter['allOf'].append({'if':{'properties':{'observation':{'const':'observed_unattributed'}}},'then':{'properties':{'verification_method':{'enum':['none','participant_key_signature']}}}})
for site_id in SITE_IDS:
 feed['allOf'].append({
  'if':{'properties':{'data_mode':{'const':'live'},'encounters':{'contains':{'properties':{'site_id':{'const':site_id}}},'minContains':1}}},
  'then':{'properties':{'sites':{'contains':{'properties':{'site_id':{'const':site_id},'coverage_state':{'enum':['partial','connected','stale','paused']}}},'minContains':1}}}
 })
# Catalog-only data is a reviewed finite vocabulary, never a visitor-supplied ID.
feed['allOf'].append(conditional_mode('live',{'encounters':{'items':{'properties':{'catalog_id':{'enum':REAL_CATALOG_IDS}}}},'league':{'properties':{'state':{'enum':['not_connected','open','paused']},'source':{'not':{'type':'object','properties':{'kind':{'const':'fixture'}},'required':['kind']}}}}}))
feed['allOf'].append(conditional_mode('fixture',{'encounters':{'items':{'properties':{'catalog_id':{'enum':FIXTURE_CATALOG_IDS}}}}}))
encounter['allOf'].append({'if':{'properties':{'catalog_id':{'const':'unknown-automation'}}},'then':{'properties':{'observation':{'const':'observed_unattributed'}}}})
feed['allOf'].append({'if':{'properties':{'league':{'properties':{'state':{'const':'open'}}}}},'then':{'properties':{'data_mode':{'const':'live'}}}})
for name,obj in [('challenge.schema.json',challenge),('attempt.schema.json',attempt),('public-feed.schema.json',feed)]:
 (ROOT/name).write_text(json.dumps(obj,indent=2)+'\n')
empty={'schema':'pointcast.bot-league-public/v1','data_mode':'unconnected','generated_at':None,'sites':[{'site_id':s,'measurement_origin':'pointcast' if s=='ues' else s,'coverage_state':'not_connected','window':None,'last_ingest_at':None,'source':None,'metrics':{k:None for k in metricNames}} for s in SITE_IDS],'encounters':[],'league':{'state':'not_connected','metric':'verified_unique_tasks','rows':[],'source':None,'window':None,'last_adjudicated_at':None}}
(ROOT/'unconnected.public.json').write_text(json.dumps(empty,indent=2)+'\n')
