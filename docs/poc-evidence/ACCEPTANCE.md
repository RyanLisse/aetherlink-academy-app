# Academy → Slides PoC acceptance record

## Current status

The deployed authoring flow is **runtime accepted** through live browser edit,
readback, snapshot creation, and restart persistence.

## Deployments

| Service | Public HTTPS origin | OpenShip deployment | Runtime image | Source/revision |
| --- | --- | --- | --- | --- |
| Academy authoring PoC | <https://academy-poc.91-99-78-17.sslip.io> | `dep_S3dGOQCENT5bbO3G` | `openship/academy-authoring-poc:bld_CXfNIUoFJMHajjFT` | `poc-d41973575767b0a9` |
| Slides | <https://slides-poc.91-99-78-17.sslip.io> | `dep_93aKK1qkdbEXOLrb` | `openship/academy-slides-poc:bld_t-DJWLdfxwnsykzL` | `faf8bca157405254dd3ec604e992570056ec7492` |

The Academy deployment reported the expected revision from its health response.
Postgres, Redis, and Proof were reachable through the Academy health/connection
checks. Unauthenticated protected authoring requests returned `401`. The
production `academy-app` remained on the exact base image
`sha256:b80cdb10b303cb41c43102785db118b17165fa89e8a22d36e5eefd0390cb804e`.

## Code and local gates

The reviewed change is the opt-in authoring slice relative to
`8691b46e4a074d99f23d08da6395ed5d76699af6`.

- Server authoring tests: **27 passed**.
- Web tests: **7 passed**.
- Server and web typechecks: **passed**.
- Server and web production builds: **passed**.
- Diff whitespace check: **passed**.
- Academy overlay build used the verified local base image
  `sha256:b80cdb10b303cb41c43102785db118b17165fa89e8a22d36e5eefd0390cb804e`
  with a required `SOURCE_REVISION`.

The implementation keeps the Slides token server-side, requires a bearer token
for authoring routes, enforces HTTPS for non-loopback upstreams, validates the
configured upstream origin, and persists an uncertain deck-creation fence so a
timeout cannot trigger an automatic duplicate create.

## Live browser evidence

The following flow was completed against the public deployments:

1. A lesson was created in the deployed Academy authoring UI.
2. Academy created a real deck in the authenticated Slides editor.
3. The deck was opened in Slides and edited in the browser.
4. The edited title was read back as **“AI in je werk — bewerkt in Slides”**.
5. The first heading read back as **“Van praktijkvraag naar een sterke les”**.
6. Speaker notes beginning with **“PoC-controle”** were present in the readback.
7. Academy refreshed the deck from Slides and saved a new snapshot.

Screenshots:

- [Academy live snapshot](./academy-live-snapshot.png)
- [Slides live edited](./slides-live-edited.png)

SSH inspection of the Academy JSON store confirmed two immutable snapshot-history
entries. The original snapshot revision was
`fa33c640b064a750e1a40c72c151e81e9d18ad78d3335d87d0c31e0f685eb663`; the edited
snapshot revision was
`bd049a071b9669d5e980c8aad4853de3d517e22082d5207160c08d63f8ab07ba`. The edited
entry contained the complete five-slide HTML and speaker notes. Both OpenShip
restart routes returned `ready`; after reload, Slides still showed the edited
title and heading, and Academy reauthenticated and loaded the edited snapshot.
The two full history revisions remained identical after restart. The machine-
readable result is recorded in [runtime.json](./runtime.json).

## Acceptance scope and limits

The runtime acceptance covers the deployed single-operator PoC flow and its
restart persistence. It does not claim production-grade operation.

This is a single-operator PoC with one Academy process and JSON persistence. It
does not provide SSO, multi-instance coordination, or production-grade lesson
storage. Initial deck content is deterministic template content; it is not
AI-authored. The PoC deployments and their supporting databases are separate
from the production Academy runtime.

## Packaging follow-up

After live acceptance, Dockerfile lint cleanup sorted apt packages, combined
consecutive build commands, and used exec-form health checks. The deployed
images above predate this packaging-only cleanup; application sources are the
ones exercised in the recorded browser flow. A rebuild of this cleaned packaging
is not included in the live acceptance claim.
