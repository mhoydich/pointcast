#!/usr/bin/env python3
"""Build an offline, source-preserving review packet. This is not an importer."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
TASK_ID = "ATLAS-PILOT-INTEGRATION-01"
OUTPUT_NAMES = frozenset(
    {"review-packet.json", "proposed-additions.geojson", "validation-report.json"}
)
MAPPING_RECEIPT = "loom:598bf32cd8d47592fa14465c#m_451d3e1i2j"
ACCEPTANCE_RECEIPT = "loom:598bf32cd8d47592fa14465c#m_24616p1a47"
CLAIM_RECEIPT = "loom:598bf32cd8d47592fa14465c#m_17265a3l4s"
ALIAS_TARGETS = {
    "cave-bureau-nairobi": "cave-bureau-nairobi",
    "woha-singapore": "woha-singapore",
    "tatiana-bilbao-estudio-mexico-city": "tatiana-bilbao-mexico-city",
}
ADDITION_IDS = frozenset(
    {
        "assemble-london",
        "white-arkitekter-gothenburg",
        "al-borde-quito",
        "counterspace-johannesburg",
        "studio-lotus-new-delhi",
        "andrew-burges-architects-sydney",
        "patchwork-architecture-wellington",
    }
)
# These are the reviewed input versions, not a user-configurable import feed.
# Both hashes and manifest metadata are checked before any output is written.
INPUT_SPECS = {
    "atlas-pilot-01": {
        "path": "inputs/atlas-pilot-01.json",
        "commit": "58f7bd487e5d4669a4957abe84a5bbaf45b79ddd",
        "repository_path": "sketches/teamterra/2026-11-15-practice-pilot-01/practices-research.json",
        "bytes": 22121,
        "sha256": "a32828b405cf9bc7a40bc02e2d1fe5887247aa47c954be2d89e1fbe53e10f82c",
        "git_blob_sha1": "20887bbb65e732344dcf463f16641f958e4180dd",
    },
    "atlas-01": {
        "path": "inputs/atlas-01.json",
        "commit": "bf378dd2e3391177305797d6268b27341401dc9c",
        "repository_path": "public/sketches/teamterra-world-architects-2026-11-15/atlas.json",
        "bytes": 201848,
        "sha256": "3c27cc7d982a1d93b54a6beef21356f00fb9a8642416e233680119f0affb6ffd",
        "git_blob_sha1": "8993f44ac9a447420b7a1a5f421961c742b54ac6",
    },
    "receiving-atlas": {
        "path": "inputs/receiving-atlas.json",
        "commit": "51943b2a1a7721edff2e2379d95000bc4c165cdf",
        "repository_path": "public/teamterra-atlas/atlas.json",
        "bytes": 243646,
        "sha256": "e443399bb60075090b9a3f6b662f53388f89b7e7edb604d25abf778b8e782aa1",
        "git_blob_sha1": "fc825e7d59efa407300efb3ce7516becac7d6fad",
    },
    "loom-receipts": {
        "path": "inputs/loom-receipts.json",
        "bytes": 12359,
        "sha256": "c83934bf79e1328ea1e2cb19aa5e13905b000e975c6bea40b3101f0d2d866195",
    },
}
MANIFEST_METADATA = {
    "schema_version": "1.0",
    "task_id": TASK_ID,
    "scope": "Offline draft review packet; no live import",
    "receiver_baseline_commit": INPUT_SPECS["receiving-atlas"]["commit"],
}
SOURCE_MESSAGES = [
    MAPPING_RECEIPT,
    "loom:598bf32cd8d47592fa14465c#m_5c3x2x350i",
    ACCEPTANCE_RECEIPT,
    "loom:598bf32cd8d47592fa14465c#m_0a3h71583g",
    CLAIM_RECEIPT,
]


class ReviewError(ValueError):
    """The frozen scope, inputs, preservation rules or output boundary failed."""


def require(condition, message):
    if not condition:
        raise ReviewError(message)


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def _reject_constant(value):
    raise ReviewError(f"Non-finite JSON number: {value}")


def read_json(raw):
    try:
        return json.loads(raw, object_pairs_hook=_unique_object, parse_constant=_reject_constant)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ReviewError(f"Invalid JSON: {exc}") from exc


def _inside_file(root, relative):
    path = root / relative
    require(not path.is_symlink(), f"Input must not be a symlink: {relative}")
    require(path.resolve().is_relative_to(root.resolve()), f"Input escapes packet: {relative}")
    require(path.is_file(), f"Missing input file: {relative}")
    return path


def _expected_input_entries():
    """Derive every allowed provenance field from the reviewed frozen versions."""
    entries = []
    for key, spec in INPUT_SPECS.items():
        entry = {"key": key, "path": spec["path"]}
        if "commit" in spec:
            entry.update({
                "kind": "git_snapshot",
                "repository": "mhoydich/pointcast",
                "commit": spec["commit"],
                "repository_path": spec["repository_path"],
                "source_url": (
                    "https://github.com/mhoydich/pointcast/blob/"
                    + spec["commit"] + "/" + spec["repository_path"]
                ),
            })
        else:
            entry.update({
                "kind": "public_message_snapshot",
                "source_messages": list(SOURCE_MESSAGES),
            })
        entry.update({"bytes": spec["bytes"], "sha256": spec["sha256"]})
        if "git_blob_sha1" in spec:
            entry["git_blob_sha1"] = spec["git_blob_sha1"]
        entries.append(entry)
    return entries


def _manifest_entries(manifest):
    expected = {**MANIFEST_METADATA, "inputs": _expected_input_entries()}
    require(manifest == expected, "Frozen manifest shape or provenance changed")
    return {entry["key"]: entry for entry in expected["inputs"]}


def _index(records, label):
    require(isinstance(records, list), f"{label} must be a list")
    result = {}
    for record in records:
        require(isinstance(record, dict) and isinstance(record.get("id"), str), f"Invalid {label} ID")
        require(record["id"] not in result, f"Duplicate {label} ID: {record['id']}")
        result[record["id"]] = record
    return result


def _rows(mapping, documents):
    require(mapping.get("schema_version") == "1.0" and mapping.get("task_id") == TASK_ID, "Wrong mapping scope")
    require(mapping.get("mapping_source") == MAPPING_RECEIPT, "Mapping receipt changed")
    require(mapping.get("identity_decision_source") == ACCEPTANCE_RECEIPT, "Acceptance receipt changed")
    rows = mapping.get("rows", [])
    require(isinstance(rows, list) and len(rows) == 10, "Expected ten mapping rows")
    by_id = {row.get("pilot_id"): row for row in rows}
    require(set(by_id) == set(ALIAS_TARGETS) | ADDITION_IDS, "Mapping IDs changed or duplicate")
    require(len({row.get("canonical_id") for row in rows}) == 10, "Mapping target collision")
    pilot = _index(documents["atlas-pilot-01"]["practices"], "pilot")
    receiver = _index(documents["receiving-atlas"]["records"], "receiving")
    frozen = _index(documents["atlas-01"]["practices"], "Atlas-01")
    require(set(pilot) == set(by_id), "Pilot and mapping ID sets differ")
    require(len(receiver) == 69, "Expected the frozen 69-record receiving baseline")
    for pilot_id, row in by_id.items():
        if pilot_id in ALIAS_TARGETS:
            canonical_id = ALIAS_TARGETS[pilot_id]
            require(row.get("canonical_id") == canonical_id, f"Accepted alias target changed: {pilot_id}")
            require(row.get("operation") == "alias_attachment", f"Wrong alias operation: {pilot_id}")
            require(row.get("identity_decision") == "accepted", f"Alias lacks accepted identity: {pilot_id}")
            require(row.get("decision_receipt") == ACCEPTANCE_RECEIPT, f"Alias receipt changed: {pilot_id}")
            require(row.get("addition_acceptance") == "not applicable", f"Alias is not an addition: {pilot_id}")
            require(canonical_id in receiver and canonical_id in frozen, f"Missing canonical alias: {canonical_id}")
        else:
            require(row.get("canonical_id") == pilot_id, f"Proposed addition ID changed: {pilot_id}")
            require(row.get("operation") == "proposed_addition", f"Wrong addition operation: {pilot_id}")
            require(row.get("identity_decision") == "pending", f"Addition cannot be accepted here: {pilot_id}")
            require(row.get("addition_acceptance") == "pending", f"Addition review must remain pending: {pilot_id}")
            require(row.get("decision_receipt") is None, f"No addition acceptance receipt exists: {pilot_id}")
            require(pilot_id not in receiver, f"Addition already exists: {pilot_id}")
    return [by_id[record["id"]] for record in documents["atlas-pilot-01"]["practices"]]


def load_inputs(packet_dir=HERE):
    root = Path(packet_dir)
    manifest = read_json(_inside_file(root, "input-manifest.json").read_bytes())
    entries = _manifest_entries(manifest)
    documents = {}
    for key, spec in INPUT_SPECS.items():
        raw = _inside_file(root, spec["path"]).read_bytes()
        require(len(raw) == spec["bytes"], f"Frozen input byte count changed: {key}")
        require(hashlib.sha256(raw).hexdigest() == spec["sha256"], f"Frozen input SHA-256 changed: {key}")
        if "git_blob_sha1" in spec:
            blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
            require(blob == entries[key]["git_blob_sha1"], f"Frozen Git blob changed: {key}")
        documents[key] = read_json(raw)
    mapping = read_json(_inside_file(root, "mapping.json").read_bytes())
    _rows(mapping, documents)
    receipts = documents["loom-receipts"]["receipts"]
    for key, address in [("mapping", MAPPING_RECEIPT), ("alias_acceptance", ACCEPTANCE_RECEIPT), ("integration_claim", CLAIM_RECEIPT)]:
        require(receipts[key]["address"] == address, f"Wrong original {key} receipt")
        require(receipts[key]["message"].get("via") is None, f"Mirrored {key} receipt is not the original")
    return manifest, documents, mapping


def _source_record(key, record):
    spec = INPUT_SPECS[key]
    return {
        "source_key": key,
        "commit": spec["commit"],
        "repository_path": spec["repository_path"],
        "original_id": record["id"],
        "record": copy.deepcopy(record),
    }


def _pilot_point(record):
    coordinate = record["coordinates"]
    longitude, latitude = coordinate["longitude"], coordinate["latitude"]
    require(
        all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in [longitude, latitude]),
        f"Invalid numeric coordinates: {record['id']}",
    )
    require(-180 <= longitude <= 180 and -90 <= latitude <= 90, f"Coordinates out of range: {record['id']}")
    require(coordinate.get("is_office_location") is False, f"Pilot point must stay a city reference: {record['id']}")
    require(coordinate.get("license") == "CC-BY-4.0", f"GeoNames licence missing: {record['id']}")
    return [longitude, latitude]


def _source_urls(record):
    urls = [record["source_url"], *record.get("additional_source_urls", [])]
    if record.get("discipline_source_url"):
        urls.append(record["discipline_source_url"])
    return list(dict.fromkeys(urls))


def _normalized_addition(record):
    sources = []
    for url in _source_urls(record):
        source = {"url": url, "source_type": "official practice website"}
        evidence = []
        if url == record["source_url"]:
            evidence.append(record["professional_public_location"])
        if url == record.get("discipline_source_url"):
            evidence.append(record["discipline_summary"])
        if evidence:
            source["evidence"] = "\n".join(evidence)
        sources.append(source)
    return {
        "id": record["id"],
        "collection": "architects",
        "entity_type": "architecture_practice",
        "name": record["name"],
        "city": record["city"],
        "country": record["country"],
        "iso2": record["country_code"],
        "region": record["region"],
        "website": record["source_url"],
        "sources": sources,
        "checked_at": record["source_checked_date"],
        "source_checked_date": record["source_checked_date"],
        "location_label": "approximate city reference",
        "location_basis": "city reference point",
        "coordinates": _pilot_point(record),
        "coordinate_provider": "GeoNames",
        "coordinate_source": record["coordinates"]["source_url"],
        "coordinate_precision": "city",
        "coordinate_provenance": copy.deepcopy(record["coordinates"]),
        "registration_status": record["operating_or_registration_status"],
        "reuse_status": "not assessed",
        "people": [],
        "sports": [],
        "special": False,
        "specialties": [],
        "notes": [
            record["professional_public_location"],
            record["discipline_summary"],
            record["current_roster_note"],
            record["coordinates"]["note"],
            "Person identities are not resolved in this draft. Complete dated roster assertions remain in the preserved source record.",
        ],
    }


def _atlas_related(document, record):
    practice_ids = {record["id"], "practice:" + record["id"], record.get("practice_id")}
    practice_ids.discard(None)
    return {
        "offices": copy.deepcopy([r for r in document["offices"] if r.get("practice_id") in practice_ids]),
        "person_practice_relationships": copy.deepcopy(
            [r for r in document["person_practice_relationships"] if r.get("practice_id") in practice_ids]
        ),
    }


def build_packet(manifest, documents, mapping):
    _manifest_entries(manifest)
    rows = _rows(mapping, documents)
    pilot = _index(documents["atlas-pilot-01"]["practices"], "pilot")
    frozen = _index(documents["atlas-01"]["practices"], "Atlas-01")
    receiver = _index(documents["receiving-atlas"]["records"], "receiving")
    additions, aliases = [], []
    for row in rows:
        source = pilot[row["pilot_id"]]
        if row["operation"] == "proposed_addition":
            additions.append({
                "pilot_id": source["id"],
                "proposed_id": row["canonical_id"],
                "review_status": "pending",
                "publication_eligible": False,
                "normalized_record": _normalized_addition(source),
                "source_record": _source_record("atlas-pilot-01", source),
                "source_reuse_status": "not assessed",
            })
            continue
        canonical = receiver[row["canonical_id"]]
        original = frozen[row["canonical_id"]]
        aliases.append({
            "pilot_id": source["id"],
            "canonical_id": canonical["id"],
            "identity_status": "accepted",
            "integration_status": "attachment_proposed",
            "decision": copy.deepcopy(row),
            "source_records": {
                "atlas-01": _source_record("atlas-01", original),
                "atlas-pilot-01": _source_record("atlas-pilot-01", source),
                "receiving-atlas": _source_record("receiving-atlas", canonical),
            },
            "atlas01_related": _atlas_related(documents["atlas-01"], original),
            "location_observations": [
                {
                    "role": "canonical_display",
                    "source_key": "receiving-atlas",
                    "coordinates": copy.deepcopy(canonical["coordinates"]),
                    "coordinate_provider": canonical["coordinate_provider"],
                    "coordinate_source": canonical["coordinate_source"],
                    "coordinate_precision": canonical["coordinate_precision"],
                    "coordinate_provenance": copy.deepcopy(canonical["coordinate_provenance"]),
                },
                {
                    "role": "incoming_alternative",
                    "source_key": "atlas-pilot-01",
                    "coordinates": _pilot_point(source),
                    "coordinate_provider": "GeoNames",
                    "coordinate_source": source["coordinates"]["source_url"],
                    "coordinate_precision": "city",
                    "is_office_location": False,
                    "source_coordinate_record": copy.deepcopy(source["coordinates"]),
                },
            ],
            "incoming_source_reuse_status": "not assessed",
        })
    baseline_records = documents["receiving-atlas"]["records"]
    baseline_countries = {r["iso2"] for r in baseline_records}
    baseline_architects = sum(r["collection"] == "architects" for r in baseline_records)
    mapped = sum(isinstance(r.get("coordinates"), list) and len(r["coordinates"]) == 2 for r in baseline_records)
    return {
        "schema_version": "teamterra.integration-review/v1",
        "task_id": TASK_ID,
        "status": "draft_review_only",
        "implementation_note": mapping["implementation_note"],
        "publication": {
            "eligible": False,
            "live_import_performed": False,
            "receiving_dataset_modified": False,
            "next_gate": "Separate acceptance of the seven additions and a reviewed integration change.",
        },
        "inputs": copy.deepcopy(manifest["inputs"]),
        "receipts": {"mapping": MAPPING_RECEIPT, "identity_decisions": ACCEPTANCE_RECEIPT, "implementation_claim": CLAIM_RECEIPT},
        "source_metadata": {
            key: copy.deepcopy(documents[key]["metadata"])
            for key in ["atlas-pilot-01", "atlas-01", "receiving-atlas"]
        },
        "baseline": {
            "commit": INPUT_SPECS["receiving-atlas"]["commit"],
            "complete_snapshot": INPUT_SPECS["receiving-atlas"]["path"],
            "sha256": INPUT_SPECS["receiving-atlas"]["sha256"],
            "total_records": len(baseline_records),
            "architecture_records": baseline_architects,
            "architecture_relationships": len(documents["receiving-atlas"]["architecture_relationships"]),
            "directory_sources": len(documents["receiving-atlas"]["directory_sources"]),
            "mapped_records": mapped,
            "countries": len(baseline_countries),
            "records_changed": 0,
        },
        "candidate_counts_if_all_additions_accepted": {
            "condition": "Hypothetical only: all seven additions accepted in a separate review.",
            "architecture_records": baseline_architects + len(additions),
            "total_records": len(baseline_records) + len(additions),
            "mapped_records": mapped + len(additions),
            "countries": len(baseline_countries | {a["normalized_record"]["iso2"] for a in additions}),
        },
        "proposed_additions": additions,
        "accepted_aliases": aliases,
    }


def validate_packet(packet, documents, mapping):
    """Check preservation and the review boundary independently of serialization."""
    rows = _rows(mapping, documents)
    pilot = _index(documents["atlas-pilot-01"]["practices"], "pilot")
    frozen = _index(documents["atlas-01"]["practices"], "Atlas-01")
    receiver = _index(documents["receiving-atlas"]["records"], "receiving")
    checks = []

    def check(name, condition, detail):
        require(condition, f"{name}: {detail}")
        checks.append({"name": name, "passed": True, "detail": detail})

    check("review_only", packet.get("status") == "draft_review_only" and all(
        packet.get("publication", {}).get(k) is False
        for k in ["eligible", "live_import_performed", "receiving_dataset_modified"]
    ), "No output authorizes or performs an import.")
    check("input_provenance", packet.get("inputs") == _expected_input_entries()
          and packet.get("receipts") == {
              "mapping": MAPPING_RECEIPT,
              "identity_decisions": ACCEPTANCE_RECEIPT,
              "implementation_claim": CLAIM_RECEIPT,
          }, "Every source repository, URL, kind, version, hash and original message reference is pinned; extra provenance fields are rejected.")
    check("source_metadata", all(
        packet.get("source_metadata", {}).get(key) == documents[key]["metadata"]
        for key in ["atlas-pilot-01", "atlas-01", "receiving-atlas"]
    ), "Packet-level metadata and attribution remain complete.")
    check("baseline", packet["baseline"]["total_records"] == 69
          and packet["baseline"]["architecture_records"] == 36
          and packet["baseline"]["architecture_relationships"] == 45
          and packet["baseline"]["records_changed"] == 0
          and packet["baseline"]["sha256"] == INPUT_SPECS["receiving-atlas"]["sha256"],
          "The complete receiving input retains 69 records, 45 architecture relationships and its original hash.")
    additions, aliases = packet["proposed_additions"], packet["accepted_aliases"]
    check("scope_counts", len(additions) == 7 and len(aliases) == 3
          and {a["pilot_id"] for a in additions} == ADDITION_IDS
          and {a["pilot_id"] for a in aliases} == set(ALIAS_TARGETS),
          "Exactly seven pending additions and three accepted identity links.")
    for addition in additions:
        source = pilot[addition["pilot_id"]]
        normalized = addition["normalized_record"]
        check("addition:" + source["id"], addition["proposed_id"] == source["id"]
              and addition["review_status"] == "pending" and addition["publication_eligible"] is False
              and source["id"] not in receiver
              and addition["source_record"] == _source_record("atlas-pilot-01", source),
              "Pending proposal retains the entire original source record and version.")
        check("addition_metadata:" + source["id"],
              normalized["id"] == source["id"] and normalized["collection"] == "architects"
              and normalized["entity_type"] == "architecture_practice"
              and normalized["iso2"] == source["country_code"]
              and all(normalized[k] == source[k] for k in ["name", "city", "country", "region"])
              and normalized["checked_at"] == source["source_checked_date"]
              and normalized["source_checked_date"] == source["source_checked_date"]
              and normalized["registration_status"] == source["operating_or_registration_status"] == "not_verified"
              and normalized["people"] == []
              and normalized["reuse_status"] == addition["source_reuse_status"] == "not assessed",
              "Identity resolution, dates, registration and source-reuse scope are not upgraded.")
        check("addition_geography:" + source["id"],
              normalized["coordinates"] == _pilot_point(source)
              and normalized["coordinate_provenance"] == source["coordinates"]
              and normalized["coordinate_source"] == source["coordinates"]["source_url"]
              and normalized["coordinate_provider"] == "GeoNames"
              and normalized["coordinate_precision"] == "city"
              and all(value in normalized["notes"] for value in [
                  source["professional_public_location"], source["current_roster_note"], source["coordinates"]["note"]
              ])
              and [s["url"] for s in normalized["sources"]] == _source_urls(source),
              "Exact lon/lat, coordinate licence, original location/roster caveats and source URLs survive.")
    row_index = {r["pilot_id"]: r for r in rows}
    for alias in aliases:
        pilot_id = alias["pilot_id"]
        canonical_id = ALIAS_TARGETS[pilot_id]
        source, original, current = pilot[pilot_id], frozen[canonical_id], receiver[canonical_id]
        check("alias:" + pilot_id,
              alias["canonical_id"] == canonical_id and alias["identity_status"] == "accepted"
              and alias["integration_status"] == "attachment_proposed"
              and alias["decision"] == row_index[pilot_id]
              and alias["source_records"] == {
                  "atlas-01": _source_record("atlas-01", original),
                  "atlas-pilot-01": _source_record("atlas-pilot-01", source),
                  "receiving-atlas": _source_record("receiving-atlas", current),
              }
              and alias["atlas01_related"] == _atlas_related(documents["atlas-01"], original)
              and alias["incoming_source_reuse_status"] == "not assessed",
              "Accepted identity retains all three complete source versions, related source records and incoming reuse uncertainty.")
        locations = alias["location_observations"]
        check("alias_geography:" + pilot_id,
              len(locations) == 2
              and locations[0]["role"] == "canonical_display"
              and locations[0]["coordinates"] == current["coordinates"]
              and locations[0]["coordinate_provenance"] == current["coordinate_provenance"]
              and locations[0]["coordinate_source"] == current["coordinate_source"]
              and locations[0]["coordinate_provider"] == current["coordinate_provider"]
              and locations[1]["role"] == "incoming_alternative"
              and locations[1]["coordinates"] == _pilot_point(source)
              and locations[1]["source_coordinate_record"] == source["coordinates"]
              and locations[1]["coordinate_provider"] == "GeoNames"
              and locations[1]["coordinate_source"] == source["coordinates"]["source_url"]
              and locations[1]["is_office_location"] is False,
              "Canonical and incoming city references remain separate, unchanged and attributed.")
    check("conditional_counts", packet["candidate_counts_if_all_additions_accepted"] == {
        "condition": "Hypothetical only: all seven additions accepted in a separate review.",
        "architecture_records": 43, "total_records": 76, "mapped_records": 76, "countries": 38,
    }, "Candidate counts are conditional; the receiving collection remains at its baseline.")
    return checks


def _candidate_geojson(packet, documents):
    features = []
    for addition in packet["proposed_additions"]:
        record = copy.deepcopy(addition["normalized_record"])
        point = record.pop("coordinates")
        record.update({
            "review_status": "pending",
            "publication_eligible": False,
            "original_source_ref": {
                "source_key": "atlas-pilot-01",
                "commit": INPUT_SPECS["atlas-pilot-01"]["commit"],
                "original_id": addition["pilot_id"],
            },
        })
        features.append({
            "type": "Feature",
            "id": addition["proposed_id"],
            "geometry": {"type": "Point", "coordinates": point},
            "properties": record,
        })
    return {
        "type": "FeatureCollection",
        "name": TASK_ID + " — seven pending additions",
        "review_status": "pending",
        "publication_eligible": False,
        "coordinate_attribution": documents["atlas-pilot-01"]["metadata"]["coordinate_attribution"],
        "coordinate_license": documents["atlas-pilot-01"]["metadata"]["coordinate_license"],
        "coordinate_license_url": documents["atlas-pilot-01"]["metadata"]["coordinate_license_url"],
        "practice_source_reuse_status": "not assessed",
        "features": features,
    }


def render_outputs(packet_dir=HERE):
    manifest, documents, mapping = load_inputs(packet_dir)
    before = copy.deepcopy(documents)
    packet = build_packet(manifest, documents, mapping)
    checks = validate_packet(packet, documents, mapping)
    require(documents == before, "Builder mutated a frozen input")
    geojson = _candidate_geojson(packet, documents)
    additions = {a["proposed_id"]: a["normalized_record"] for a in packet["proposed_additions"]}
    require(
        len(geojson["features"]) == 7
        and all(
            f["geometry"]["coordinates"] == additions[f["id"]]["coordinates"]
            and f["properties"]["reuse_status"] == additions[f["id"]]["reuse_status"]
            and f["properties"]["coordinate_provenance"] == additions[f["id"]]["coordinate_provenance"]
            and f["properties"]["review_status"] == "pending"
            and f["properties"]["publication_eligible"] is False
            for f in geojson["features"]
        ),
        "Candidate GeoJSON parity failed",
    )
    checks.extend([
        {"name": "inputs_not_mutated", "passed": True, "detail": "Every parsed input, including the whole receiving document, is unchanged."},
        {"name": "candidate_geojson_parity", "passed": True, "detail": "Seven pending features retain exact coordinates, coordinate provenance and reuse status."},
    ])
    outputs = {"review-packet.json": json_bytes(packet), "proposed-additions.geojson": json_bytes(geojson)}
    report = {
        "task_id": TASK_ID,
        "status": "structural_checks_passed",
        "scope": "Offline structural and preservation checks. No fresh primary-source, permission or browser verification.",
        "inputs": copy.deepcopy(manifest["inputs"]),
        "checks": checks,
        "output_sha256": {name: hashlib.sha256(raw).hexdigest() for name, raw in outputs.items()},
        "baseline": packet["baseline"],
        "candidate_counts_if_all_additions_accepted": packet["candidate_counts_if_all_additions_accepted"],
        "publication_eligible": False,
        "live_import_performed": False,
    }
    outputs["validation-report.json"] = json_bytes(report)
    return outputs


def _output_paths(packet_dir, outputs):
    require(set(outputs) == OUTPUT_NAMES, "Unexpected output filenames; no custom output targets are supported")
    require(all(isinstance(raw, bytes) for raw in outputs.values()), "Outputs must be serialized bytes")
    root = Path(packet_dir).resolve()
    destination = root / "outputs"
    require(not destination.is_symlink(), "Output directory must not be a symlink")
    require(destination.resolve().parent == root, "Output directory escapes this packet")
    require(not destination.exists() or destination.is_dir(), "Output destination is not a directory")
    paths = {}
    # Preflight the complete destination set before mkdir or the first write.
    for name in sorted(OUTPUT_NAMES):
        path = destination / name
        require(not path.is_symlink(), f"Output must not be a symlink: {name}")
        require(not path.exists() or path.is_file(), f"Output is not a regular file: {name}")
        require(path.resolve().parent == destination.resolve(), f"Output escapes this packet: {name}")
        paths[name] = path
    return paths


def write_outputs(packet_dir, outputs):
    paths = _output_paths(packet_dir, outputs)
    (Path(packet_dir).resolve() / "outputs").mkdir(exist_ok=True)
    for name, path in paths.items():
        path.write_bytes(outputs[name])


def check_outputs(packet_dir, outputs):
    paths = _output_paths(packet_dir, outputs)
    return [name for name, path in paths.items() if not path.is_file() or path.read_bytes() != outputs[name]]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Compare committed review outputs without writing")
    args = parser.parse_args(argv)
    try:
        outputs = render_outputs(HERE)
        if args.check:
            stale = check_outputs(HERE, outputs)
            if stale:
                print(json.dumps({"status": "stale_outputs", "files": stale}), file=sys.stderr)
                return 1
        else:
            write_outputs(HERE, outputs)
        print(json.dumps({
            "task_id": TASK_ID,
            "status": "checked" if args.check else "built",
            "pending_additions": 7,
            "accepted_identity_aliases": 3,
            "live_import_performed": False,
            "output_sha256": {name: hashlib.sha256(raw).hexdigest() for name, raw in outputs.items()},
        }, indent=2))
        return 0
    except (ReviewError, KeyError, TypeError, OSError) as exc:
        print("Review packet failed: " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
