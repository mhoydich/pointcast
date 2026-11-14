"""Read-only node simulations of public fixtures. NEVER signs or injects.

Requires optional pytezos==3.16.1. Generate cost_scenarios.py artifacts first.
Usage: python measure_costs.py ARTIFACT_DIR OUTPUT.json --rpc https://rpc.tzkt.io/mainnet --source-public-address tz...
The source must be revealed and funded IN THE PUBLIC CONTEXT for preview
validation only. Possession/control of that address is neither needed nor claimed.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone
from pytezos.crypto.encoding import base58_encode
from pytezos.michelson.parse import michelson_to_micheline
from pytezos.operation.forge import forge_operation_group


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('artifacts', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--rpc', required=True)
    parser.add_argument('--block', default='head', help='head or a block hash for exact replay')
    parser.add_argument('--source-public-address', required=True)
    args = parser.parse_args()
    source = args.source_public_address
    if not re.fullmatch(r'tz[1234][1-9A-HJ-NP-Za-km-z]{33}', source):
        parser.error('public implicit address required, never a key or alias')
    rpc = args.rpc.rstrip('/')
    if not rpc.startswith('https://'):
        parser.error('HTTPS RPC required')

    def request(path, payload=None):
        # The only write-shaped requests this program permits are non-injecting
        # protocol helpers. No signer, wallet client or injection API exists here.
        if payload is not None:
            assert path.endswith(('/helpers/scripts/run_operation', '/helpers/scripts/trace_code'))
        command = ['curl', '--fail-with-body', '--silent', '--show-error', '--max-time', '60', rpc+path]
        data = None
        if payload is not None:
            command += ['-H', 'Content-Type: application/json', '--data-binary', '@-']
            data = json.dumps(payload)
        result = subprocess.run(command, input=data, capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError(f"RPC failure {path}: {result.stderr} {result.stdout[:1500]}")
        return json.loads(result.stdout)

    if not re.fullmatch(r'head|B[1-9A-HJ-NP-Za-km-z]{50}', args.block):
        parser.error('--block must be head or a Tezos block hash')
    header = request('/chains/main/blocks/'+args.block+'/header')
    root = '/chains/main/blocks/'+header['hash']
    constants = request(root+'/context/constants')
    context = request(root+'/context/contracts/'+source)
    assert context.get('revealed'), 'preview source must already be revealed'
    admin = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb'
    code = {}
    state = {}
    initial = {}
    cases = []
    current_contract = None
    pending = None
    label = None
    params = None
    for line in (args.artifacts/'log.txt').read_text().splitlines():
        if line.startswith('Creating contract '):
            current_contract = len(initial)
            pending = 'initial'
        match = re.search(r'h2: COST (\w+)', line)
        if match:
            label = match[1]
        match = re.search(r'file \S+/(step_\d+_cont_(\d+)_params.json)', line)
        if match:
            params = json.loads((args.artifacts/match[1]).read_text())
            current_contract = int(match[2])
        match = re.match(r'Executing (\w+)\(', line)
        if match:
            pending = match[1]
        if line.startswith(' -> '):
            value = michelson_to_micheline(line[4:])
            if pending == 'initial':
                initial[current_contract] = value
            else:
                cases.append(dict(name=label, contract=current_contract, entrypoint=pending,
                                  before=state[current_contract], after=value, input=params))
            state[current_contract] = value
    for i in initial:
        code[i] = json.loads(next(args.artifacts.glob(f'*_cont_{i}_contract.json')).read_text())
    assert len(initial) == 3 and len(cases) == 14

    def preview(i, storage):
        op = dict(kind='origination', source=source, fee='0',
                  counter=str(int(context['counter'])+1), gas_limit=constants['hard_gas_limit_per_operation'],
                  storage_limit='60000', balance='0', script=dict(code=code[i], storage=storage))
        unsigned = dict(branch=header['hash'], contents=[op])
        # Fixed zero bytes, not a cryptographic signature or a key operation.
        body = dict(chain_id=header['chain_id'], operation={**unsigned, 'signature':base58_encode(bytes(64), b'sig').decode()})
        result = request(root+'/helpers/scripts/run_operation', body)
        if not isinstance(result, dict):
            raise RuntimeError(result)
        receipt = result['contents'][0]['metadata']['operation_result']
        assert receipt['status'] == 'applied', receipt
        size = len(forge_operation_group(unsigned))+64
        gas = int(receipt['consumed_milligas'])/1000
        # 100 mutez base + 0.1 mutez/gas + 1 mutez/byte: an explicit pricing
        # assumption, not a protocol-mandated fee or an account debit.
        fee = (100 + gas/10 + size)/1_000_000
        return dict(storage_bytes=int(receipt['paid_storage_size_diff']),
                    consumed_milligas=int(receipt['consumed_milligas']),
                    assumed_fee_tez=round(fee, 8), operation_bytes=size,
                    simulated_burn_tez=sum(-int(u['change']) for u in receipt.get('balance_updates', [])
                                           if u.get('kind') == 'contract' and int(u['change']) < 0)/1_000_000,
                    request_sha256=hashlib.sha256(json.dumps(body,sort_keys=True).encode()).hexdigest())

    snapshots = {}
    def key(i, storage):
        return str(i)+':'+hashlib.sha256(json.dumps(storage,sort_keys=True).encode()).hexdigest()
    for i, storage in initial.items():
        snapshots[key(i,storage)] = (i,storage)
    for c in cases:
        for which in ('before','after'):
            snapshots[key(c['contract'],c[which])] = (c['contract'],c[which])
    with ThreadPoolExecutor(max_workers=1) as pool:
        values = list(pool.map(lambda pair: preview(*pair), snapshots.values()))
    measurements = dict(zip(snapshots,values))
    rows = []
    for c in cases:
        i = c['contract']
        before = measurements[key(i,c['before'])]
        after = measurements[key(i,c['after'])]
        delta = after['storage_bytes']-before['storage_bytes']
        row = dict(name=c['name'], entrypoint=c['entrypoint'], storage_growth_bytes=delta,
                   storage_burn_proxy_tez=max(0,delta)*int(constants['cost_per_byte'])/1_000_000,
                   before=before, after=after, script_milligas=None)
        if c['entrypoint'] in ('propose','vote'):
            row['gas_note'] = 'Unmeasured: external Seat VIEW context is unavailable to trace_code.'
        else:
            now = {'dao_close_tie':86500,'dao_close_empty_sixteen':176400,'dao_close_winner':266400}.get(c['name'],300000)
            payload = dict(script=code[i],storage=c['before'],input=c['input'],entrypoint=c['entrypoint'],
                           amount='0',balance='0',chain_id=header['chain_id'],source=admin,payer=source,
                           gas=constants['hard_gas_limit_per_operation'],now=str(now))
            result = request(root+'/helpers/scripts/trace_code',payload)
            assert isinstance(result,dict) and 'trace' in result, result
            row['script_milligas'] = sum(int(step['gas']) for step in result['trace'])
            row['gas_note'] = 'Trace sum only; excludes some post-interpreter and manager/callback overhead.'
        row['fee_allowance_tez'] = 0.15
        row['planning_total_tez'] = round(row['storage_burn_proxy_tez']+0.15,6)
        rows.append(row)
    # Standard FA2 balance callbacks: trace the emitting contract only. The
    # injected receiver is a dummy type, never a live originated contract.
    callback = 'KT1Tezooo1zzSmartPyzzSTATiCzzzyfC8eF'
    response_type = dict(prim='list', args=[dict(prim='pair', args=[
        dict(prim='pair',args=[dict(prim='address'),dict(prim='nat')]),dict(prim='nat')])])
    for i, name in [(0,'seat_balance_of_two'),(1,'doubloon_balance_of_two')]:
        reqs = [dict(prim='Pair',args=[dict(string=owner),dict(int='0')])
                for owner in (admin, 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6')]
        payload = dict(script=code[i],storage=state[i],
                       input=dict(prim='Pair',args=[reqs,dict(string=callback)]),
                       entrypoint='balance_of',amount='0',balance='0',
                       chain_id=header['chain_id'],source=admin,payer=source,
                       gas=constants['hard_gas_limit_per_operation'],
                       other_contracts=[dict(address=callback,type=response_type)])
        result = request(root+'/helpers/scripts/trace_code',payload)
        assert isinstance(result,dict) and 'trace' in result, result
        rows.append(dict(name=name,entrypoint='balance_of',storage_growth_bytes=0,
                         storage_burn_proxy_tez=0,script_milligas=sum(int(t['gas']) for t in result['trace']),
                         gas_note='Excludes receiver execution/storage; budget receiver separately.',
                         fee_allowance_tez=0.15,planning_total_tez=0.15))
    output = dict(simulation_only=True, generated_at=datetime.now(timezone.utc).isoformat(),
                  rpc=rpc, block=header['hash'], protocol=header['protocol'],
                  source_public_address=source, source_control_claimed=False,
                  constants={k:constants[k] for k in ('cost_per_byte','origination_size','hard_gas_limit_per_operation')},
                  originations={['Seat','Doubloon','DAO'][i]:measurements[key(i,st)] for i,st in initial.items()},
                  calls=rows)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(output,indent=2)+'\n')
    print('Wrote simulation-only measurements to',args.output)

if __name__ == '__main__':
    main()
