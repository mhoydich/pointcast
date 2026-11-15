"""Offline regression tests for the bounded ATLAS-PILOT-INTEGRATION-01 draft.

The expected IDs and version hashes below come from the frozen handoff, not
from the builder. Filesystem and CLI tests run in disposable copies, with a
separate published-atlas sentinel that must remain unchanged.
"""

from __future__ import annotations

from contextlib import contextmanager
from copy import deepcopy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


PACKET_DIR = Path(__file__).resolve().parent
OUTPUT_NAMES = {
    "review-packet.json",
    "proposed-additions.geojson",
    "validation-report.json",
}
EXPECTED_ALIASES = {
    "tatiana-bilbao-estudio-mexico-city": "tatiana-bilbao-mexico-city",
    "cave-bureau-nairobi": "cave-bureau-nairobi",
    "woha-singapore": "woha-singapore",
}
EXPECTED_ADDITIONS = {
    "assemble-london",
    "white-arkitekter-gothenburg",
    "al-borde-quito",
    "counterspace-johannesburg",
    "studio-lotus-new-delhi",
    "andrew-burges-architects-sydney",
    "patchwork-architecture-wellington",
}
EXPECTED_SNAPSHOTS = {
    "atlas-pilot-01": (
        "58f7bd487e5d4669a4957abe84a5bbaf45b79ddd",
        "a32828b405cf9bc7a40bc02e2d1fe5887247aa47c954be2d89e1fbe53e10f82c",
    ),
    "atlas-01": (
        "bf378dd2e3391177305797d6268b27341401dc9c",
        "3c27cc7d982a1d93b54a6beef21356f00fb9a8642416e233680119f0affb6ffd",
    ),
    "receiving-atlas": (
        "51943b2a1a7721edff2e2379d95000bc4c165cdf",
        "e443399bb60075090b9a3f6b662f53388f89b7e7edb604d25abf778b8e782aa1",
    ),
    "loom-receipts": (
        None,
        "c83934bf79e1328ea1e2cb19aa5e13905b000e975c6bea40b3101f0d2d866195",
    ),
}
ACCEPTANCE_RECEIPT = "loom:598bf32cd8d47592fa14465c#m_24616p1a47"

# Keep running the suite from generating files alongside the frozen fixtures.
sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location(
    "atlas_pilot_review_builder", PACKET_DIR / "build_review_packet.py"
)
assert _spec is not None and _spec.loader is not None
builder = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = builder
_spec.loader.exec_module(builder)


def tree_state(root: Path, *, omit_outputs: bool = False) -> dict:
    """Record bytes, modification times and directory membership, not atimes."""
    state = {}
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if omit_outputs and "outputs" in relative.parts:
            continue
        if path.is_symlink():
            state[str(relative)] = ("symlink", os.readlink(path))
        elif path.is_dir():
            state[str(relative)] = ("directory",)
        else:
            state[str(relative)] = (
                "file",
                hashlib.sha256(path.read_bytes()).hexdigest(),
                path.stat().st_mtime_ns,
            )
    return state


@contextmanager
def isolated_packet():
    """Clone only the declared local inputs and builder into an isolated tree."""
    with tempfile.TemporaryDirectory(prefix="atlas-review-test-") as temporary:
        repo = Path(temporary) / "repo"
        packet_dir = repo / "sketches" / "teamterra" / PACKET_DIR.name
        (packet_dir / "inputs").mkdir(parents=True)
        for name in ("input-manifest.json", "mapping.json", "build_review_packet.py"):
            shutil.copy2(PACKET_DIR / name, packet_dir / name)
        for key in EXPECTED_SNAPSHOTS:
            shutil.copy2(
                PACKET_DIR / "inputs" / f"{key}.json",
                packet_dir / "inputs" / f"{key}.json",
            )
        live_atlas = repo / "public" / "teamterra-atlas" / "atlas.json"
        live_atlas.parent.mkdir(parents=True)
        live_atlas.write_bytes(b'{"records":[{"id":"live-sentinel"}]}\n')
        yield repo, packet_dir


def run_cli(packet_dir: Path, *arguments: str) -> subprocess.CompletedProcess:
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    return subprocess.run(
        [sys.executable, "-B", str(packet_dir / "build_review_packet.py"), *arguments],
        cwd=packet_dir.parent,
        env=env,
        capture_output=True,
        text=True,
        timeout=20,
        check=False,
    )


def altered_provenance_entries(entries):
    """Change provenance without changing the frozen file bytes or hashes."""
    for index, original in enumerate(entries):
        replacements = {"kind": "unapproved_source_kind"}
        if "repository" in original:
            replacements["repository"] = "unauthorized/replacement"
            replacements["source_url"] = "https://example.invalid/replaced-source"
        if "source_messages" in original:
            replacements["source_messages"] = ["loom:invented-provenance"]
        replacements["metadata"] = {"source_reuse_status": "approved"}
        for field, replacement in replacements.items():
            changed = deepcopy(entries)
            changed[index][field] = replacement
            yield f"{original['key']}:{field}", changed
    changed = deepcopy(entries)
    extra = deepcopy(entries[0])
    extra["key"] = "unapproved-input"
    changed.append(extra)
    yield "extra input entry", changed


class InputIntegrityTests(unittest.TestCase):
    def test_frozen_source_versions_and_bytes_match_the_handoff(self):
        manifest, documents, _mapping = builder.load_inputs(PACKET_DIR)
        entries = {entry["key"]: entry for entry in manifest["inputs"]}
        self.assertEqual(set(EXPECTED_SNAPSHOTS), set(entries))
        self.assertEqual(set(EXPECTED_SNAPSHOTS), set(documents))
        for key, (commit, digest) in EXPECTED_SNAPSHOTS.items():
            with self.subTest(source=key):
                entry = entries[key]
                raw = (PACKET_DIR / entry["path"]).read_bytes()
                self.assertEqual(digest, hashlib.sha256(raw).hexdigest())
                self.assertEqual(digest, entry["sha256"])
                self.assertEqual(len(raw), entry["bytes"])
                if commit is not None:
                    self.assertEqual(commit, entry["commit"])
                self.assertEqual(json.loads(raw), documents[key])

    def test_even_json_equivalent_changes_to_any_frozen_input_are_rejected(self):
        for key in EXPECTED_SNAPSHOTS:
            with self.subTest(source=key), isolated_packet() as (_repo, packet_dir):
                source = packet_dir / "inputs" / f"{key}.json"
                source.write_bytes(source.read_bytes() + b"\n")
                with self.assertRaises(builder.ReviewError):
                    builder.load_inputs(packet_dir)
                self.assertFalse((packet_dir / "outputs").exists())

    def test_changed_version_pin_is_rejected(self):
        with isolated_packet() as (_repo, packet_dir):
            path = packet_dir / "input-manifest.json"
            manifest = json.loads(path.read_text())
            manifest["inputs"][0]["commit"] = "0" * 40
            path.write_text(json.dumps(manifest))
            with self.assertRaises(builder.ReviewError):
                builder.load_inputs(packet_dir)

    def test_a_matching_edited_manifest_cannot_replace_a_frozen_original(self):
        with isolated_packet() as (_repo, packet_dir):
            path = packet_dir / "input-manifest.json"
            manifest = json.loads(path.read_text())
            entry = next(row for row in manifest["inputs"] if row["key"] == "atlas-pilot-01")
            source = packet_dir / entry["path"]
            altered = json.loads(source.read_text())
            altered["practices"][0]["name"] = "An unauthorized replacement"
            raw = (json.dumps(altered) + "\n").encode()
            source.write_bytes(raw)
            entry["sha256"] = hashlib.sha256(raw).hexdigest()
            entry["bytes"] = len(raw)
            entry["git_blob_sha1"] = hashlib.sha1(
                f"blob {len(raw)}\0".encode() + raw
            ).hexdigest()
            path.write_text(json.dumps(manifest))
            with self.assertRaises(builder.ReviewError):
                builder.load_inputs(packet_dir)

    def test_mapping_cannot_promote_a_pending_addition(self):
        with isolated_packet() as (_repo, packet_dir):
            path = packet_dir / "mapping.json"
            mapping = json.loads(path.read_text())
            row = next(row for row in mapping["rows"] if row["pilot_id"] == "assemble-london")
            row["addition_acceptance"] = "accepted"
            path.write_text(json.dumps(mapping))
            with self.assertRaises(builder.ReviewError):
                builder.render_outputs(packet_dir)
            self.assertFalse((packet_dir / "outputs").exists())

    def test_mapping_cannot_invent_an_alias_decision_receipt(self):
        with isolated_packet() as (_repo, packet_dir):
            path = packet_dir / "mapping.json"
            mapping = json.loads(path.read_text())
            row = next(row for row in mapping["rows"] if row["pilot_id"] == "woha-singapore")
            row["decision_receipt"] = "loom:invented-acceptance"
            path.write_text(json.dumps(mapping))
            with self.assertRaises(builder.ReviewError):
                builder.render_outputs(packet_dir)

    def test_manifest_provenance_and_extra_metadata_are_rejected_at_both_entry_points(self):
        manifest, documents, mapping = builder.load_inputs(PACKET_DIR)
        variants = []
        for label, entries in altered_provenance_entries(manifest["inputs"]):
            changed = deepcopy(manifest)
            changed["inputs"] = entries
            variants.append((label, changed))
        changed = deepcopy(manifest)
        changed["metadata"] = {"publication_eligible": True}
        variants.append(("extra top-level metadata", changed))
        for label, changed in variants:
            with self.subTest(drift=label, entry_point="load_inputs"):
                with isolated_packet() as (_repo, packet_dir):
                    (packet_dir / "input-manifest.json").write_text(json.dumps(changed))
                    with self.assertRaises(builder.ReviewError):
                        builder.load_inputs(packet_dir)
                    self.assertFalse((packet_dir / "outputs").exists())
            with self.subTest(drift=label, entry_point="build_packet"):
                with self.assertRaises(builder.ReviewError):
                    builder.build_packet(deepcopy(changed), deepcopy(documents), deepcopy(mapping))


class PacketContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest, cls.documents, cls.mapping = builder.load_inputs(PACKET_DIR)
        cls.packet = builder.build_packet(cls.manifest, cls.documents, cls.mapping)
        cls.pilot = {record["id"]: record for record in cls.documents["atlas-pilot-01"]["practices"]}
        cls.atlas01 = {record["id"]: record for record in cls.documents["atlas-01"]["practices"]}
        cls.receiving = {record["id"]: record for record in cls.documents["receiving-atlas"]["records"]}
        cls.versions = {row["key"]: row for row in cls.manifest["inputs"]}

    def assert_original_envelope(self, envelope, source_key, original):
        self.assertEqual(source_key, envelope["source_key"])
        self.assertEqual(original["id"], envelope["original_id"])
        self.assertEqual(self.versions[source_key]["commit"], envelope["commit"])
        self.assertEqual(self.versions[source_key]["repository_path"], envelope["repository_path"])
        self.assertEqual(original, envelope["record"])

    def test_build_and_validation_preserve_all_input_objects(self):
        manifest, documents, mapping = builder.load_inputs(PACKET_DIR)
        before = deepcopy((manifest, documents, mapping))
        packet = builder.build_packet(manifest, documents, mapping)
        checks = builder.validate_packet(packet, documents, mapping)
        self.assertEqual(before, (manifest, documents, mapping))
        self.assertEqual(69, len(documents["receiving-atlas"]["records"]))
        self.assertTrue(checks)
        self.assertTrue(all(isinstance(check, dict) for check in checks))

    def test_exact_three_identity_matches_and_seven_pending_additions(self):
        aliases = self.packet["accepted_aliases"]
        additions = self.packet["proposed_additions"]
        self.assertEqual(3, len(aliases))
        self.assertEqual(7, len(additions))
        self.assertEqual(EXPECTED_ALIASES, {row["pilot_id"]: row["canonical_id"] for row in aliases})
        self.assertEqual(EXPECTED_ADDITIONS, {row["pilot_id"] for row in additions})
        self.assertEqual(EXPECTED_ADDITIONS, {row["proposed_id"] for row in additions})
        self.assertTrue(EXPECTED_ADDITIONS.isdisjoint(self.receiving))
        self.assertEqual("draft_review_only", self.packet["status"])
        for flag in ("eligible", "live_import_performed", "receiving_dataset_modified"):
            self.assertIs(False, self.packet["publication"][flag])
        mapping = {row["pilot_id"]: row for row in self.mapping["rows"]}
        for row in aliases:
            with self.subTest(alias=row["pilot_id"]):
                self.assertEqual("accepted", row["identity_status"])
                self.assertEqual("attachment_proposed", row["integration_status"])
                self.assertEqual(mapping[row["pilot_id"]], row["decision"])
                self.assertEqual(ACCEPTANCE_RECEIPT, row["decision"]["decision_receipt"])
                self.assertEqual("not assessed", row["incoming_source_reuse_status"])
        for row in additions:
            with self.subTest(addition=row["pilot_id"]):
                self.assertEqual("pending", row["review_status"])
                self.assertIs(False, row["publication_eligible"])
                self.assertEqual("not assessed", row["source_reuse_status"])

    def test_baseline_counts_and_packet_metadata_preserve_the_original_scope(self):
        expected = {
            "total_records": 69,
            "architecture_records": 36,
            "mapped_records": 69,
            "countries": 36,
            "architecture_relationships": 45,
            "records_changed": 0,
        }
        for key, value in expected.items():
            self.assertEqual(value, self.packet["baseline"][key], key)
        candidate = self.packet["candidate_counts_if_all_additions_accepted"]
        self.assertTrue(candidate["condition"])
        for key, value in {
            "architecture_records": 43, "total_records": 76, "mapped_records": 76, "countries": 38
        }.items():
            self.assertEqual(value, candidate[key], key)
        self.assertEqual(self.manifest["inputs"], self.packet["inputs"])
        for key in ("atlas-pilot-01", "atlas-01", "receiving-atlas"):
            self.assertEqual(self.documents[key]["metadata"], self.packet["source_metadata"][key])
        metadata = self.packet["source_metadata"]["atlas-pilot-01"]
        self.assertEqual("CC-BY-4.0", metadata["coordinate_license"])
        self.assertEqual("https://creativecommons.org/licenses/by/4.0/", metadata["coordinate_license_url"])
        self.assertIn("GeoNames", metadata["coordinate_attribution"])

    def test_every_source_record_and_its_version_is_recoverable_without_field_loss(self):
        for addition in self.packet["proposed_additions"]:
            with self.subTest(addition=addition["pilot_id"]):
                self.assert_original_envelope(
                    addition["source_record"], "atlas-pilot-01", self.pilot[addition["pilot_id"]]
                )
        for alias in self.packet["accepted_aliases"]:
            with self.subTest(alias=alias["pilot_id"]):
                expected = {
                    "atlas-pilot-01": self.pilot[alias["pilot_id"]],
                    "atlas-01": self.atlas01[alias["canonical_id"]],
                    "receiving-atlas": self.receiving[alias["canonical_id"]],
                }
                self.assertEqual(set(expected), set(alias["source_records"]))
                for source_key, original in expected.items():
                    self.assert_original_envelope(alias["source_records"][source_key], source_key, original)
                practice_id = self.atlas01[alias["canonical_id"]]["practice_id"]
                for collection in ("offices", "person_practice_relationships"):
                    related = [
                        record for record in self.documents["atlas-01"][collection]
                        if record["practice_id"] == practice_id
                    ]
                    self.assertEqual(related, alias["atlas01_related"][collection])

    def test_addition_geometry_dates_permissions_and_source_qualifications(self):
        for addition in self.packet["proposed_additions"]:
            with self.subTest(addition=addition["pilot_id"]):
                source = self.pilot[addition["pilot_id"]]
                coordinates = source["coordinates"]
                record = addition["normalized_record"]
                self.assertEqual(source["id"], record["id"])
                self.assertEqual([coordinates["longitude"], coordinates["latitude"]], record["coordinates"])
                self.assertEqual(coordinates, record["coordinate_provenance"])
                self.assertEqual("GeoNames", record["coordinate_provider"])
                self.assertEqual(coordinates["source_url"], record["coordinate_source"])
                self.assertEqual("city", record["coordinate_precision"])
                self.assertEqual(source["source_checked_date"], record["checked_at"])
                self.assertEqual("not_verified", record["registration_status"])
                self.assertEqual("not assessed", record["reuse_status"])
                self.assertEqual([], record["people"])
                for caveat in (source["professional_public_location"], source["current_roster_note"], coordinates["note"]):
                    self.assertIn(caveat, record["notes"])
                self.assertIs(False, record["coordinate_provenance"]["is_office_location"])
                self.assertEqual("CC-BY-4.0", record["coordinate_provenance"]["license"])
                self.assertEqual("GeoNames", record["coordinate_provenance"]["attribution"])

    def test_alias_city_coordinates_remain_separate_without_averaging(self):
        for alias in self.packet["accepted_aliases"]:
            with self.subTest(alias=alias["pilot_id"]):
                canonical = self.receiving[alias["canonical_id"]]
                pilot_coordinates = self.pilot[alias["pilot_id"]]["coordinates"]
                observations = {row["role"]: row for row in alias["location_observations"]}
                self.assertEqual(2, len(alias["location_observations"]))
                self.assertEqual({"canonical_display", "incoming_alternative"}, set(observations))
                display = observations["canonical_display"]
                incoming = observations["incoming_alternative"]
                self.assertEqual("receiving-atlas", display["source_key"])
                for field in ("coordinates", "coordinate_provider", "coordinate_source", "coordinate_precision", "coordinate_provenance"):
                    self.assertEqual(canonical[field], display[field])
                self.assertEqual("atlas-pilot-01", incoming["source_key"])
                self.assertEqual(
                    [pilot_coordinates["longitude"], pilot_coordinates["latitude"]], incoming["coordinates"]
                )
                self.assertEqual(pilot_coordinates, incoming["source_coordinate_record"])
                self.assertEqual("GeoNames", incoming["coordinate_provider"])
                self.assertEqual(pilot_coordinates["source_url"], incoming["coordinate_source"])
                self.assertEqual("city", incoming["coordinate_precision"])
                self.assertIs(False, incoming["is_office_location"])
                self.assertNotEqual(display["coordinates"], incoming["coordinates"])

    def test_mailing_contact_roster_scope_and_the_explicit_id_alias_are_preserved(self):
        aliases = {row["pilot_id"]: row for row in self.packet["accepted_aliases"]}
        cave = aliases["cave-bureau-nairobi"]
        cave_pilot = cave["source_records"]["atlas-pilot-01"]["record"]
        self.assertIn("public mailing contact", cave_pilot["professional_public_location"])
        self.assertIn("physical street-level office location was not established", cave_pilot["professional_public_location"])
        self.assertEqual(
            self.receiving["cave-bureau-nairobi"]["notes"],
            cave["source_records"]["receiving-atlas"]["record"]["notes"],
        )
        woha = aliases["woha-singapore"]["source_records"]
        self.assertEqual("not_verified", woha["atlas-pilot-01"]["record"]["current_roster_status"])
        self.assertEqual(
            self.pilot["woha-singapore"]["current_roster_note"],
            woha["atlas-pilot-01"]["record"]["current_roster_note"],
        )
        self.assertEqual(
            {"Mun Summ Wong", "Richard Hassell"},
            {person["name"] for person in woha["atlas-01"]["record"]["associated_architects"]},
        )
        tatiana = aliases["tatiana-bilbao-estudio-mexico-city"]
        self.assertEqual("tatiana-bilbao-mexico-city", tatiana["canonical_id"])
        self.assertEqual("tatiana-bilbao-estudio-mexico-city", tatiana["source_records"]["atlas-pilot-01"]["original_id"])
        self.assertEqual(6, len(tatiana["source_records"]["atlas-pilot-01"]["record"]["partners_as_listed"]))

    def test_geojson_contains_only_pending_additions_with_original_geonames_points(self):
        rendered = builder.render_outputs(PACKET_DIR)
        geojson = json.loads(rendered["proposed-additions.geojson"])
        self.assertEqual("FeatureCollection", geojson["type"])
        self.assertEqual(7, len(geojson["features"]))
        self.assertEqual(EXPECTED_ADDITIONS, {feature["properties"]["id"] for feature in geojson["features"]})
        for feature in geojson["features"]:
            properties = feature["properties"]
            source = self.pilot[properties["id"]]
            coordinates = source["coordinates"]
            with self.subTest(feature=properties["id"]):
                self.assertEqual("Feature", feature["type"])
                self.assertEqual(
                    {"type": "Point", "coordinates": [coordinates["longitude"], coordinates["latitude"]]},
                    feature["geometry"],
                )
                self.assertEqual("pending", properties["review_status"])
                self.assertIs(False, properties["publication_eligible"])
                self.assertEqual(coordinates, properties["coordinate_provenance"])
                self.assertEqual("not assessed", properties["reuse_status"])
                self.assertEqual(
                    {"source_key": "atlas-pilot-01", "commit": EXPECTED_SNAPSHOTS["atlas-pilot-01"][0], "original_id": source["id"]},
                    properties["original_source_ref"],
                )

    def test_validation_rejects_permission_and_acceptance_escalation(self):
        mutations = (
            ("addition accepted", lambda packet: packet["proposed_additions"][0].__setitem__("review_status", "accepted")),
            ("addition publishable", lambda packet: packet["proposed_additions"][0].__setitem__("publication_eligible", True)),
            ("incoming permission", lambda packet: packet["proposed_additions"][0].__setitem__("source_reuse_status", "approved")),
            ("normalized permission", lambda packet: packet["proposed_additions"][0]["normalized_record"].__setitem__("reuse_status", "approved")),
            ("alias permission", lambda packet: packet["accepted_aliases"][0].__setitem__("incoming_source_reuse_status", "approved")),
            ("packet publishable", lambda packet: packet["publication"].__setitem__("eligible", True)),
        )
        for label, mutate in mutations:
            with self.subTest(drift=label):
                changed = deepcopy(self.packet)
                mutate(changed)
                with self.assertRaises(builder.ReviewError):
                    builder.validate_packet(changed, self.documents, self.mapping)

    def test_validation_rejects_loss_of_source_qualifications_or_geometry(self):
        mutations = (
            ("raw roster lost", lambda packet: packet["accepted_aliases"][0]["source_records"]["atlas-pilot-01"]["record"].pop("current_roster_note")),
            ("coordinate license lost", lambda packet: packet["proposed_additions"][0]["normalized_record"]["coordinate_provenance"].pop("license")),
            ("canonical coordinate changed", lambda packet: packet["accepted_aliases"][0]["location_observations"][0].__setitem__("coordinates", [0.0, 0.0])),
            ("invented verification date", lambda packet: packet["proposed_additions"][0]["normalized_record"].__setitem__("checked_at", "2099-01-01")),
        )
        for label, mutate in mutations:
            with self.subTest(drift=label):
                changed = deepcopy(self.packet)
                mutate(changed)
                with self.assertRaises(builder.ReviewError):
                    builder.validate_packet(changed, self.documents, self.mapping)

    def test_validation_report_binds_the_actual_outputs_and_preserved_inputs(self):
        rendered = builder.render_outputs(PACKET_DIR)
        report = json.loads(rendered["validation-report.json"])
        self.assertEqual(self.packet, json.loads(rendered["review-packet.json"]))
        self.assertEqual("structural_checks_passed", report["status"])
        self.assertEqual(self.manifest["inputs"], report["inputs"])
        self.assertEqual(self.packet["baseline"], report["baseline"])
        self.assertEqual(
            self.packet["candidate_counts_if_all_additions_accepted"],
            report["candidate_counts_if_all_additions_accepted"],
        )
        self.assertIs(False, report["publication_eligible"])
        self.assertIs(False, report["live_import_performed"])
        self.assertTrue(report["checks"])
        self.assertTrue(all(check["passed"] is True for check in report["checks"]))
        self.assertEqual(
            {
                name: hashlib.sha256(rendered[name]).hexdigest()
                for name in ("review-packet.json", "proposed-additions.geojson")
            },
            report["output_sha256"],
        )

    def test_validation_rejects_modified_packet_input_provenance(self):
        for label, entries in altered_provenance_entries(self.packet["inputs"]):
            with self.subTest(drift=label):
                changed = deepcopy(self.packet)
                changed["inputs"] = entries
                with self.assertRaises(builder.ReviewError):
                    builder.validate_packet(changed, self.documents, self.mapping)


class OutputBoundaryTests(unittest.TestCase):
    def test_rendering_is_deterministic_and_has_no_filesystem_or_network_effects(self):
        with isolated_packet() as (repo, packet_dir):
            before = tree_state(repo)
            with mock.patch("socket.create_connection", side_effect=AssertionError("network used")), \
                 mock.patch("urllib.request.urlopen", side_effect=AssertionError("network used")):
                first = builder.render_outputs(packet_dir)
                second = builder.render_outputs(packet_dir)
            self.assertEqual(OUTPUT_NAMES, set(first))
            self.assertEqual(first, second)
            self.assertTrue(all(isinstance(value, bytes) for value in first.values()))
            self.assertEqual(before, tree_state(repo))

    def test_check_reports_missing_or_stale_outputs_without_repairing_them(self):
        with isolated_packet() as (repo, packet_dir):
            outputs = builder.render_outputs(packet_dir)
            before = tree_state(repo)
            self.assertEqual(OUTPUT_NAMES, set(builder.check_outputs(packet_dir, outputs)))
            self.assertEqual(before, tree_state(repo))
            builder.write_outputs(packet_dir, outputs)
            self.assertEqual([], builder.check_outputs(packet_dir, outputs))
            stale = packet_dir / "outputs" / "review-packet.json"
            stale.write_bytes(b"stale review packet\n")
            before = tree_state(repo)
            self.assertEqual(["review-packet.json"], builder.check_outputs(packet_dir, outputs))
            self.assertEqual(before, tree_state(repo))

    def test_cli_only_writes_the_three_fixed_outputs_and_check_is_read_only(self):
        with isolated_packet() as (repo, packet_dir):
            before = tree_state(repo)
            missing = run_cli(packet_dir, "--check")
            self.assertNotEqual(0, missing.returncode)
            self.assertEqual(before, tree_state(repo))
            created = run_cli(packet_dir)
            self.assertEqual(0, created.returncode, created.stderr)
            self.assertEqual(before, tree_state(repo, omit_outputs=True))
            self.assertEqual(OUTPUT_NAMES, {path.name for path in (packet_dir / "outputs").iterdir()})
            after = tree_state(repo)
            checked = run_cli(packet_dir, "--check")
            self.assertEqual(0, checked.returncode, checked.stderr)
            self.assertEqual(after, tree_state(repo))
            (packet_dir / "outputs" / "proposed-additions.geojson").write_bytes(b"{}\n")
            stale = tree_state(repo)
            checked = run_cli(packet_dir, "--check")
            self.assertNotEqual(0, checked.returncode)
            self.assertEqual(stale, tree_state(repo))

    def test_cli_cannot_accept_a_live_destination_or_an_apply_option(self):
        with isolated_packet() as (repo, packet_dir):
            before = tree_state(repo)
            for arguments in (("--output", str(repo / "public" / "teamterra-atlas")), ("--apply",)):
                with self.subTest(arguments=arguments):
                    result = run_cli(packet_dir, *arguments)
                    self.assertNotEqual(0, result.returncode)
                    self.assertEqual(before, tree_state(repo))

    def test_an_output_directory_symlink_cannot_redirect_writes(self):
        with isolated_packet() as (repo, packet_dir):
            outputs = builder.render_outputs(packet_dir)
            (packet_dir / "outputs").symlink_to(repo / "public" / "teamterra-atlas", target_is_directory=True)
            before = tree_state(repo)
            with self.assertRaises(builder.ReviewError):
                builder.write_outputs(packet_dir, outputs)
            self.assertEqual(before, tree_state(repo))

    def test_a_destination_symlink_is_rejected_before_other_outputs_are_written(self):
        with isolated_packet() as (repo, packet_dir):
            outputs = builder.render_outputs(packet_dir)
            destination = packet_dir / "outputs"
            destination.mkdir()
            for name in OUTPUT_NAMES - {"validation-report.json"}:
                (destination / name).write_bytes(b"existing review material\n")
            (destination / "validation-report.json").symlink_to(
                repo / "public" / "teamterra-atlas" / "atlas.json"
            )
            before = tree_state(repo)
            with self.assertRaises(builder.ReviewError):
                builder.write_outputs(packet_dir, outputs)
            self.assertEqual(before, tree_state(repo))

    def test_a_directory_at_a_file_destination_fails_before_any_write(self):
        with isolated_packet() as (repo, packet_dir):
            outputs = builder.render_outputs(packet_dir)
            (packet_dir / "outputs" / "validation-report.json").mkdir(parents=True)
            before = tree_state(repo)
            with self.assertRaises(builder.ReviewError):
                builder.write_outputs(packet_dir, outputs)
            self.assertEqual(before, tree_state(repo))

    def test_unexpected_output_names_cannot_escape_the_packet(self):
        with isolated_packet() as (repo, packet_dir):
            outputs = builder.render_outputs(packet_dir)
            outputs["../../../../public/teamterra-atlas/atlas.json"] = b"unauthorized live replacement\n"
            before = tree_state(repo)
            with self.assertRaises(builder.ReviewError):
                builder.write_outputs(packet_dir, outputs)
            self.assertEqual(before, tree_state(repo))


if __name__ == "__main__":
    unittest.main()
