# Academy release evidence

A release is accepted only when the tested source revision, container build and deployed revision can be traced to one another. A green workflow file or an HTTP 200 alone is insufficient.

For each candidate retain:

- Repository commit SHA and PR URL.
- GitHub Actions run URL, run attempt and test summary, including skipped tests.
- Dockerfile path, base image digest, resulting image ID/digest and target platform.
- Hetzner host, container image ID/digest, deployed URL and source SHA (`SOURCE_REVISION`).
- Readiness and HTTPS smoke result, followed by the deployed browser/MCP acceptance evidence.
- Previous known-good deployment ID, schema compatibility assessment and rollback operator.

Do not attach environment files, tokens, participant cookies, facilitator keys or raw request/response traces containing credentials. Evidence should contain assertion names and results. Store test artifacts even on failure.

## Ownership

The implementation task owns application changes and source publication. The CI/CD task owns the first Academy deployment and pipeline. The coordinating task owns final E2E acceptance. Coordinate ownership before publishing a replacement release. Preserve the separate `aetherlink-game-lab` project.

## Gates

1. PR: frozen dependency install, application build, unit and PostgreSQL/Redis integration checks, actual Docker build and runtime readiness.
2. Candidate: deployment built from a recorded commit, using runtime secret integration and no build secrets.
3. Deployed smoke: exact revision, HTML, Academy readiness and authentication boundaries.
4. Acceptance: independent browser participants, roles/rotation, intent link and debrief board across instances, reconnect/restart, evidence/review, quiz privacy and remote MCP.
5. Production promotion: accept only after the owner records the passing deployed acceptance results.

A smoke pass does not claim the full acceptance gate. The first release has no prior known-good deployment to roll back to; record that explicitly.
