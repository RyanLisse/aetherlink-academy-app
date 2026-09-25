# Academy → Slides PoC

This opt-in slice keeps Academy lesson metadata and immutable slide snapshots in
Academy. It creates a real deck in the separately deployed BuilderIO Slides app,
opens the upstream editor in a new tab, and reads the resulting HTML back through
the upstream action API. It does not generate AI-authored content: the initial
slides are deterministic templates of the operator's lesson text.

## Boundaries

- One operator and one Academy process; JSON persistence is not a multi-replica database.
- `ACADEMY_AUTHORING_ENABLED=true` plus all required settings enable the API.
- `ACADEMY_AUTHORING_KEY` is a server-side shared PoC passphrase. The UI keeps it
  only in tab memory. `AGENT_SLIDES_TOKEN` never goes to the browser.
- `AGENT_SLIDES_URL` must be HTTPS except for loopback development URLs.
- Normal Slides authentication stays enabled. The static action token and
  `AGENT_NATIVE_OWNER_EMAIL` represent the same single operator as the editor login.
- `/authoring-api/lessons` creates/lists lessons. The `deck`, `refresh`, and
  `snapshot` actions operate only on the configured upstream. Snapshot history
  includes actual full HTML in the server store; the UI receives summaries.
- An uncertain create is fenced persistently; do not clear its marker and blindly
  retry, because the upstream deck may already exist.
- This is a separate PoC environment. The production Academy container and its
  PostgreSQL/Redis stores are not modified.

## Deployed layout

OpenShip 0.7.2 manages two Docker projects on the existing Hetzner host:

| App | OpenShip project | HTTPS origin |
| --- | --- | --- |
| Academy | `proj_M7RZZpVKd31QLlL6` | `https://academy-poc.91-99-78-17.sslip.io` |
| Slides | `proj_w7CUXPU7qVrL-kKJ` | `https://slides-poc.91-99-78-17.sslip.io` |

The supporting `compose.remote.yaml` stack is separate from production. It binds
PostgreSQL and Redis to the Docker bridge address, not a public host interface.
Both use TLS; Redis also requires a password. A dedicated self-signed certificate
is mounted read-only into app containers through `NODE_EXTRA_CA_CERTS`.
The certificate is a short-lived PoC certificate and must be renewed before expiry.

Remote paths:

- `/opt/academy-authoring-poc/academy-data/authoring/lessons.json`
- `/opt/academy-authoring-poc/slides-data/`
- `/opt/academy-authoring-poc/tls/`
- `/opt/academy-authoring-poc/services.env` (private, mode 0600)

Use separate `academy_poc` and `slides_poc` databases on the dedicated PoC
PostgreSQL server. The certificate's SAN must include the configured database
hostname/IP. Before the first Compose start, make the TLS directory traversable
and the key readable only by the Postgres/Redis container UID (999).

## Build and deploy

`slides.Dockerfile`, `slides.dockerignore`, and `SLIDES.md` package the
Slides scaffold with its frozen dependency lockfile and the auth configuration
patch described below. Source reference:
`@agent-native/core@0.182.1`, upstream
`adec853eb337cbe0ead48464305d6f30cc07806e`.

`academy.Dockerfile` is a PoC overlay on the exact, already-built Academy image ID
on this host. It requires `SOURCE_REVISION`, copies the compiled server and web
assets, explicitly starts the new server, and checks both Academy and Proof.
The full clean build remains available as `infra/Dockerfile`; the overlay is
intentionally tied to the verified base and does not constitute a portable release.

OpenShip's supported folder flow is:

1. `POST /api/projects/folder/session`.
2. Upload a filtered tar.gz to the returned upload URL using the returned ticket.
3. `POST /api/projects/folder/scan/:sessionId`.
4. `POST /api/projects/ensure` with `gitProvider: "upload"`,
   `sourceKind: "upload"`, `framework: "docker"`, `buildKind: "dockerfile"`,
   `projectType: "docker"`, explicit port, server ID, public endpoint and mounts.
   The scan may detect Vite for Slides; override to Docker so its Dockerfile owns
   installation, compilation and runtime.
5. `PATCH /api/projects/:id/env` with private runtime environment values.
6. `POST /api/deployments/build/access` with project and upload-session IDs,
   `environment: "production"`, `runtimeMode: "docker"`, `buildStrategy: "server"`.
   Here `production` is OpenShip's environment label inside the new PoC project,
   not the existing Academy production project.
7. Wait for `ready`, verify public HTTPS, exact revision, protected endpoints,
   real upstream create/readback, editor changes and persistence after restart.

Source archives must exclude `.env*`, private keys, session files, runtime data,
node_modules and VCS metadata. Do not use an API-container-invisible host path as
`localPath`. Keep deployment tokens out of commands, logs and screenshots.

## Slides signup configuration

Apply the scaffold patch with `git apply --unidiff-zero slides-auth.patch`.
The only app-level adjustment is `slides-auth.patch`: a supported Better Auth
plugin sets `emailAndPassword.autoSignIn=false`. With core 0.182.1 and PostgreSQL,
the signup session hook otherwise reads the just-created user outside its active
transaction and aborts signup. This configuration creates the user first; a
separate sign-in then creates the session successfully. Authentication and normal
password verification remain enabled. Apply the patch to the scaffold before
building. Both sequential calls were verified against the real local PostgreSQL
runtime (signup 200/no session, login 200/session).

The exact Academy base is a local Docker image ID. OpenShip 0.7.2's classic
Dockerfile builder accepts it; Docker BuildKit does not resolve local image IDs
in `FROM`. For a BuildKit/registry pipeline, publish the base to a private registry
and use its immutable repo digest instead. Do not replace the pin with a tag.

## Recovering an uncertain create

Reload lessons after a timeout. The selected lesson shows `Resultaat onbekend`
and `Bestaand deck-ID`. Find the already-created deck in the configured Slides
workspace, copy its ID from `/deck/<id>`, and choose **Bestaand deck koppelen**.
The authenticated `POST /authoring-api/lessons/:id/reconcile` only performs a
full read of that deck, validates the returned ID/origin, and attaches it if the
lesson is still fenced and has no deck. It never overwrites a linked deck and
never sends a second create request. An upstream error leaves the fence intact.

## Acceptance evidence

See `docs/poc-evidence/` for screenshots and the final run record. A successful
build or `/ping` alone is not acceptance: the required flow includes creating a
lesson in the deployed Academy UI, creating a real Slides deck, editing it in
the authenticated upstream editor, reading it back, saving a new snapshot and
verifying both applications retain the result after restart.
