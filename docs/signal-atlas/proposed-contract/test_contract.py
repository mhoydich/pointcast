import copy
from pathlib import Path
import tempfile
import unittest
import validate_examples as v

class ProposalContractTests(unittest.TestCase):
    def setUp(self):
        self.discovery = v.read_json(v.ROOT / "discovery.example.json")
        self.task = v.read_json(v.ROOT / "task.example.json")
    def test_examples_remain_inert(self):
        self.assertTrue(v.validate_document("discovery", self.discovery))
        self.assertTrue(v.validate_document("task", self.task))
    def test_all_endpoints_must_stay_null(self):
        for key in self.discovery["endpoints"]:
            changed = copy.deepcopy(self.discovery)
            changed["endpoints"][key] = "https://fixture.invalid/" + key
            with self.assertRaises(v.Invalid): v.validate_document("discovery", changed)
    def test_discovery_grants_no_actions(self):
        for key, value in [("accessGranted", True), ("allowedActions", ["deploy"]), ("crossSiteAuthority", True)]:
            changed = copy.deepcopy(self.discovery); changed[key] = value
            with self.assertRaises(v.Invalid): v.validate_document("discovery", changed)
    def test_release_permissions_cannot_be_enabled(self):
        for key in self.task["release"]:
            if key == "status": continue
            changed = copy.deepcopy(self.task); changed["release"][key] = True
            with self.assertRaises(v.Invalid): v.validate_document("task", changed)
    def test_task_access_is_not_granted(self):
        self.task["target"]["accessGranted"] = True
        with self.assertRaises(v.Invalid): v.validate_document("task", self.task)
    def test_wrong_origin_fails(self):
        self.task["scope"]["origin"] = "https://elsegundo.xyz"
        with self.assertRaisesRegex(v.Invalid, "wrong-parent"): v.validate_document("task", self.task)
    def test_wrong_repository_fails(self):
        self.task["target"]["repository"] = "mhoydich/hello-token-reserve"
        with self.assertRaisesRegex(v.Invalid, "wrong-site"): v.validate_document("task", self.task)
    def test_university_parents_are_independent(self):
        for edition, parent in v.EDITIONS.items():
            changed = copy.deepcopy(self.task)
            changed["scope"].update(siteId=parent, origin=v.ORIGINS[parent], editionId=edition)
            changed["target"]["repository"] = v.REPOSITORIES[parent]
            self.assertTrue(v.validate_document("task", changed))
        self.task["scope"]["editionId"] = "el-segundo-university"
        with self.assertRaisesRegex(v.Invalid, "wrong-edition"): v.validate_document("task", self.task)
    def test_provider_labels_do_not_create_authority(self):
        for doc, kind in [(self.discovery, "discovery"), (self.task, "task")]:
            doc["capabilityInterface"].update(provider="Unlisted future provider", model="Unlisted model")
            self.assertTrue(v.validate_document(kind, doc))
        self.task["capabilityInterface"]["providerRequirements"] = ["Favored vendor"]
        with self.assertRaises(v.Invalid): v.validate_document("task", self.task)
    def test_unknown_stays_unknown(self):
        self.discovery["telemetry"]["observedLabelCount"] = 0
        with self.assertRaises(v.Invalid): v.validate_document("discovery", self.discovery)
    def test_no_lease_or_review_can_be_fabricated(self):
        for change in ["lease", "receipt"]:
            changed = copy.deepcopy(self.task)
            if change == "lease": changed["lease"]["fencingToken"] = 1
            else: changed["receipt"]["reviewDecision"] = "approved"
            with self.assertRaises(v.Invalid): v.validate_document("task", changed)
    def test_network_installation_and_path_escape_fail(self):
        for group, key, value in [("limits","network","all"),("limits","dependencyInstallation","allowed"),("target","proposedWritePaths",["docs/../secret.md"]),("target","proposedWritePaths",[".git/config"])]:
            changed = copy.deepcopy(self.task); changed[group][key] = value
            with self.assertRaises(v.Invalid): v.validate_document("task", changed)
    def test_lease_budget_and_boolean_integer_fail(self):
        self.task["limits"]["maxClaimSeconds"] = True
        with self.assertRaises(v.Invalid): v.validate_document("task", self.task)
        self.task["limits"].update(maxClaimSeconds=900,maxTotalClaimSeconds=600)
        with self.assertRaises(v.Invalid): v.validate_document("task", self.task)
    def test_unknown_versions_and_fields_fail(self):
        self.task["schema"] = "signal-atlas.agent-task/v99"
        with self.assertRaises(v.Invalid): v.validate_document("task", self.task)
        self.discovery["publish"] = True
        with self.assertRaises(v.Invalid): v.validate_document("discovery", self.discovery)
    def test_bounded_duplicate_nonfinite_json(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / "input.json"
            for raw in ['{"x":1,"x":2}', '{"x":1e309}', '{"x":NaN}', ' ' * (v.MAX_BYTES + 1)]:
                p.write_text(raw)
                with self.assertRaises(v.Invalid): v.read_json(p)
    def test_schema_validator_is_explicitly_bounded(self):
        with self.assertRaisesRegex(v.Invalid, "unsupported-schema"): v.validate_schema({}, {"$ref":"https://fixture.invalid/schema"})

if __name__ == "__main__":
    unittest.main()
