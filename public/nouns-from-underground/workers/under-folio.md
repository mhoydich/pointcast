# Proof Archive release checklist

Record a release ID, artifact version, and one status per check. Start each check as Pending and mark it Verified only when its evidence is recorded.

- [ ] **Artifact upload.** Record the destination, object ID or URL, and checksum. Read the stored artifact back from that destination and confirm its checksum matches the release candidate.
- [ ] **Public readback.** Open the intended public URL in a signed-out session. Confirm the expected artifact version is visible or downloadable and record the final URL, observation time, and version signal.
- [ ] **PR merge.** Confirm the pull request is marked merged into the intended branch. Record the PR URL, target branch, and merge commit SHA.
- [ ] **Production deploy.** Confirm the production deployment reports success for the intended commit or artifact version. Open production and confirm it serves that version. Record the deployment ID, production URL, and observed version.

If a check is blocked, record the missing evidence and next action on that check. Each Verified status requires its own evidence.
