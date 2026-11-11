#!/usr/bin/env python3
"""Check documentation proposals only. Not a runtime parser or authorization service."""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAX_BYTES = 65536
ORIGINS = {"pointcast": "https://pointcast.xyz", "el-segundo": "https://elsegundo.xyz", "industry-next": "https://www.industrynext.xyz"}
REPOSITORIES = {"pointcast": "mhoydich/pointcast", "el-segundo": "mhoydich/hello-token-reserve", "industry-next": "mhoydich/nouns5.4"}
EDITIONS = {"ues": "pointcast", "el-segundo-university": "el-segundo"}
KEYWORDS = {"$schema", "title", "description", "type", "const", "enum", "properties", "required", "additionalProperties", "items", "minItems", "maxItems", "uniqueItems", "minLength", "maxLength", "pattern", "minimum", "maximum"}

class Invalid(ValueError):
    pass

def read_json(path):
    with Path(path).open("rb") as handle:
        raw = handle.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise Invalid("input-too-large")
    def pairs(rows):
        value = {}
        for key, item in rows:
            if key in value:
                raise Invalid("duplicate-key")
            value[key] = item
        return value
    def number(text):
        value = float(text)
        if not math.isfinite(value):
            raise Invalid("nonfinite-number")
        return value
    try:
        return json.loads(raw, object_pairs_hook=pairs, parse_float=number,
                          parse_constant=lambda _: (_ for _ in ()).throw(Invalid("nonfinite-number")))
    except (UnicodeError, json.JSONDecodeError):
        raise Invalid("invalid-json") from None

def exact(left, right):
    return json.dumps(left, sort_keys=True, separators=(",", ":")) == json.dumps(right, sort_keys=True, separators=(",", ":"))

def validate_schema(value, schema):
    """Finite schema subset used by these files; no ref resolution or network access."""
    if set(schema) - KEYWORDS:
        raise Invalid("unsupported-schema-keyword")
    if "const" in schema and not exact(value, schema["const"]):
        raise Invalid("const-mismatch")
    if "enum" in schema and not any(exact(value, option) for option in schema["enum"]):
        raise Invalid("enum-mismatch")
    kinds = schema.get("type", [])
    kinds = [kinds] if isinstance(kinds, str) else kinds
    checks = {"object": type(value) is dict, "array": type(value) is list,
              "string": type(value) is str, "integer": type(value) is int,
              "null": value is None, "boolean": type(value) is bool}
    if kinds and not any(checks.get(kind, False) for kind in kinds):
        raise Invalid("type-mismatch")
    if type(value) is dict:
        props = schema.get("properties", {})
        if set(schema.get("required", [])) - set(value):
            raise Invalid("missing-field")
        if schema.get("additionalProperties") is False and set(value) - set(props):
            raise Invalid("unknown-field")
        for key in set(value) & set(props):
            validate_schema(value[key], props[key])
    if type(value) is list:
        if not schema.get("minItems", 0) <= len(value) <= schema.get("maxItems", len(value)):
            raise Invalid("array-size")
        if schema.get("uniqueItems") and len({json.dumps(x, sort_keys=True) for x in value}) != len(value):
            raise Invalid("duplicate-item")
        if "items" in schema:
            for item in value:
                validate_schema(item, schema["items"])
    if type(value) is str:
        if not schema.get("minLength", 0) <= len(value) <= schema.get("maxLength", len(value)):
            raise Invalid("string-size")
        if "pattern" in schema and re.fullmatch(schema["pattern"], value) is None:
            raise Invalid("string-pattern")
    if type(value) is int and not schema.get("minimum", value) <= value <= schema.get("maximum", value):
        raise Invalid("integer-range")

def validate_document(kind, value):
    if kind not in {"discovery", "task"}:
        raise Invalid("unknown-document-kind")
    validate_schema(value, read_json(ROOT / (kind + ".schema.json")))
    scope = value["scope"]
    if scope["origin"] != ORIGINS[scope["siteId"]]:
        raise Invalid("wrong-parent-origin")
    if scope["editionId"] is not None and EDITIONS[scope["editionId"]] != scope["siteId"]:
        raise Invalid("wrong-edition-parent")
    if kind == "task":
        if value["target"]["repository"] != REPOSITORIES[scope["siteId"]]:
            raise Invalid("wrong-site-repository")
        if value["limits"]["maxTotalClaimSeconds"] < value["limits"]["maxClaimSeconds"]:
            raise Invalid("invalid-lease-budget")
        for path in value["target"]["proposedWritePaths"]:
            if any(segment in {".", "..", ".git", ".agents", ".codex"} for segment in path.split("/")):
                raise Invalid("unsafe-proposed-path")
    return True

def main():
    try:
        for kind in ("discovery", "task"):
            validate_document(kind, read_json(ROOT / (kind + ".example.json")))
        print("Two documentation proposals valid; no access, endpoint, lease or release activated.")
        return 0
    except (Invalid, OSError, RecursionError, KeyError, TypeError):
        print("Proposed contract validation failed; no action taken.")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
