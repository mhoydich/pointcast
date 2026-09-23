#!/bin/sh
# Compile and execute only the local SmartPy scenarios. This script does not
# contact Tezos, read a wallet, or originate a contract.
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
smartpy_python=${SMARTPY_PYTHON:-/Users/michaelhoydich/sundial/.venv/bin/python}

if [ ! -x "$smartpy_python" ]; then
  echo "SmartPy Python was not found: $smartpy_python" >&2
  echo "Set SMARTPY_PYTHON to a Python interpreter with smartpy-tezos installed." >&2
  exit 1
fi

if [ "$#" -gt 1 ]; then
  echo "Usage: $0 [output-directory]" >&2
  exit 64
fi

cleanup=true
if [ "$#" -eq 1 ]; then
  build_dir=$1
  cleanup=false
  mkdir -p "$build_dir"
else
  build_dir=$(mktemp -d "${TMPDIR:-/tmp}/pointcast-nouns-bandmates-smartpy.XXXXXX")
fi

if [ "$cleanup" = true ]; then
  trap '/bin/rm -r -- "$build_dir"' EXIT
fi

cd "$build_dir"
"$smartpy_python" "$repo_root/contracts/v2/nouns_bandmates_fa2.py"

if [ "$cleanup" = false ]; then
  echo "SmartPy artifacts: $build_dir/nouns_bandmates_fa2_compile/"
fi
