#!/usr/bin/env python3
"""Build the self-contained Traveling Trapper episode using only Python stdlib."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent

def script_json(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")

def main():
    content = json.loads((ROOT / "episode-content.json").read_text(encoding="utf-8"))
    noun = (ROOT / "assets/host.svg").read_text(encoding="utf-8")
    if noun.lstrip().startswith("<?xml"):
        noun = noun[noun.index("?>") + 2:].strip()
    template = (ROOT / "page-template.html").read_text(encoding="utf-8")
    runtime = (ROOT / "app.js").read_text(encoding="utf-8")
    output = template.replace("__HOST__", noun).replace("__DATA__", script_json(content)).replace("__NOUN_DATA__", script_json(noun)).replace("__APP__", runtime)
    assert all(marker not in output for marker in ("__HOST__", "__DATA__", "__NOUN_DATA__", "__APP__"))
    (ROOT / "index.html").write_text(output, encoding="utf-8")
    print(json.dumps({"file": str(ROOT / "index.html"), "bytes": len(output.encode("utf-8")), "concepts": len(content["concepts"]), "parts": len(content["part_types"])}))

if __name__ == "__main__":
    main()
