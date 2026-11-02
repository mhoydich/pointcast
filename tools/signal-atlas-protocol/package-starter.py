#!/usr/bin/env python3
"""Package the reviewed offline practice kit. No upload, install or runtime activation."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent
FILES = ["start.mjs","START-HERE.md","protocol/protocol.mjs","builder-kit/client.mjs","builder-kit/missions.mjs","builder-kit/run.mjs","builder-kit/inspect.mjs","builder-kit/PROTOCOL-DEPENDENCY.json","builder-kit/fixtures/terms.fixture.json","builder-kit/fixtures/source-check.packet.json","builder-kit/fixtures/source-check.challenge.template.json","builder-kit/fixtures/schema-repair.packet.json","builder-kit/fixtures/schema-repair.challenge.template.json","builder-kit/fixtures/repair-target.schema.json","builder-kit/examples/source-check.answer.json","builder-kit/examples/schema-repair.answer.json"]
LIMIT = 250000

def digest(value):
    return hashlib.sha256(value).hexdigest()

def package_bytes():
    imported = json.loads((ROOT / "BUILDER-UPSTREAM.json").read_text())
    upstream = json.loads((ROOT / "UPSTREAM.json").read_text())
    pins = {item["path"]: item for item in imported["importedFiles"] + upstream["importedFiles"]}
    content = {}
    for name in FILES:
        source = ROOT / ("starter/" + name if name in {"start.mjs", "START-HERE.md"} else name)
        if source.is_symlink() or not source.is_file() or ROOT.resolve() not in source.resolve().parents:
            raise ValueError("unsafe source file")
        value = source.read_bytes()
        if not 0 < len(value) <= 65536:
            raise ValueError("source file size outside bounds")
        if name not in {"start.mjs", "START-HERE.md"}:
            pin = pins[name]
            if len(value) != pin["bytes"] or digest(value) != pin["sha256"]:
                raise ValueError("reviewed source hash mismatch")
        content[name] = value
    if sum(map(len, content.values())) > LIMIT:
        raise ValueError("review package size before growth")
    manifest = {"schema":"signal-atlas.offline-starter/v1", "dataMode":"fixture", "enrollment":False,
                "livePoints":0, "files":{name:{"bytes":len(value),"sha256":digest(value)} for name,value in sorted(content.items())}}
    content["SOURCE-MANIFEST.json"] = (json.dumps(manifest,indent=2)+"\n").encode()
    output = io.BytesIO()
    with zipfile.ZipFile(output,"w",compression=zipfile.ZIP_STORED) as archive:
        for name,value in sorted(content.items()):
            info = zipfile.ZipInfo("signal-atlas-builder-kit/" + name, (1980,1,1,0,0,0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info,value)
    archive = output.getvalue()
    provenance = {"schema":"signal-atlas.offline-starter-package/v1","status":"local-review-artifact",
                  "archiveSha256":digest(archive),"archiveBytes":len(archive),"runtimeFiles":len(FILES),
                  "dataMode":"fixture","enrollment":False,"livePoints":0,
                  "sourceProtocolSha256":pins["protocol/protocol.mjs"]["sha256"],
                  "sourceBuilderArchiveSha256":imported["sourceArchiveSha256"],
                  "deterministicFormat":"sorted paths, fixed 1980 timestamps, stored ZIP entries, fixed 0644 mode",
                  "sourceFiles":manifest["files"]}
    return archive,(json.dumps(provenance,indent=2)+"\n").encode()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output",type=Path,help="New ZIP destination; parent directory must exist")
    parser.add_argument("--replace",action="store_true",help="Replace only this generated ZIP and its provenance")
    args = parser.parse_args()
    requested = args.output.absolute()
    if requested.is_symlink():
        raise SystemExit("Output cannot be a symlink")
    output = requested.parent.resolve() / requested.name
    if output.suffix != ".zip":
        raise SystemExit("Output must end in .zip")
    provenance = output.with_suffix(".provenance.json")
    if provenance.is_symlink():
        raise SystemExit("Provenance cannot be a symlink")
    if not output.parent.is_dir():
        raise SystemExit("Output parent must exist")
    if not args.replace and (output.exists() or provenance.exists()):
        raise SystemExit("Output already exists; no file changed")
    archive,metadata = package_bytes()
    # The default writes exclusively. --replace is explicit generated-artifact replacement.
    if args.replace:
        for path,value in [(output,archive),(provenance,metadata)]:
            with tempfile.NamedTemporaryFile(dir=output.parent,delete=False) as handle:
                temporary=Path(handle.name);handle.write(value)
            temporary.replace(path)
    else:
        with output.open("xb") as handle: handle.write(archive)
        with provenance.open("xb") as handle: handle.write(metadata)
    print(json.dumps({"zip":str(output),"provenance":str(provenance),"bytes":len(archive),"sha256":digest(archive),"uploaded":False}))

if __name__ == "__main__":
    main()
