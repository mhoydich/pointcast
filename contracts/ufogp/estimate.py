"""Optional offline sizing: pip install pytezos==3.16.1; no RPC or keys.
Usage: python estimate.py /path/to/ufogp-simulation/ufogp
"""
import json
from pathlib import Path
import sys
from pytezos.michelson.forge import forge_micheline

for code_path in sorted(Path(sys.argv[1]).glob('*_contract.json')):
    storage_path = code_path.with_name(code_path.name.replace('_contract.json', '_storage.json'))
    code = len(forge_micheline(json.loads(code_path.read_text())))
    storage = len(forge_micheline(json.loads(storage_path.read_text())))
    print(f'{code_path.name}: code={code} storage={storage} '
          f'burn_proxy={(code + storage + 257) * 0.00025:.5f} tez')
