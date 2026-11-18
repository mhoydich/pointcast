#!/usr/bin/env bash
# Assemble the two draft modules on localhost without modifying the checkout.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
preview_dir=$(mktemp -d)
trap 'rm -rf -- "$preview_dir"' EXIT
mkdir -p "$preview_dir/loom/kit" "$preview_dir/sketches"
ln -s "$here" "$preview_dir/sketches/loom-fire-family"
origin=https://raw.githubusercontent.com/mhoydich/pointcast
curl -fsSL "$origin/fb24cd9c3f4b1607d62b58f7b30777f692fa28c0/public/loom/kit/flame.mjs" -o "$preview_dir/loom/kit/flame.mjs"
curl -fsSL "$origin/fefc09da6210de06a87f4eff6b6eab892f0eade3/public/loom/kit/sound.mjs" -o "$preview_dir/loom/kit/sound.mjs"
echo "Open http://localhost:${1:-8080}/sketches/loom-fire-family/"
python3 -m http.server "${1:-8080}" --bind 127.0.0.1 --directory "$preview_dir"
