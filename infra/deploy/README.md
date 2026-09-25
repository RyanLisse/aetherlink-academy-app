# Wave foundation sibling deploy (F0-FOUNDATION)

The new TypeScript 7 / Effect 4 stack runs beside the legacy app. Nothing here runs on push; every step is an explicit operator action.

## Files

- `../compose.yaml`: project `academy-wave` with `app` (:4318, loopback only), `proof` (:4418 inside the Compose-owned `academy-wave-net`), `postgres`, `redis`, and a one-shot local TLS certificate initializer. Postgres host connections are restricted to TLS and Redis plaintext is disabled; their data and generated certificates live in Compose-owned volumes. The legacy `academy-postgres` / `academy-redis` containers are never referenced.
- `../Dockerfile`: builds apps/server, apps/web and vendor/proof-sdk in one image. Health check reads `/health` and requires `ok` and `proof` to be true.
- `../.env.example`: local placeholders only. Copy to `/root/aetherlink-academy-wave/.env` on the host and replace them with deployment values there. The file is never committed.
- `rebuild-wave-foundation.sh <sha>`: clone/fetch, checkout the exact SHA, build, `compose up`, then wait until `/health` reports that SHA and confirm `:4317/game/health` still answers.

Passwords must be at least 20 characters and use only letters, digits, `_`, or `-`; this keeps the Compose connection URLs unambiguous. Generate deployment values with `openssl rand -hex 32`.

## First-time bootstrap

If `/root/aetherlink-academy-wave/` does not exist yet (or the rebuild script is missing), run:

```sh
# on the Hetzner box, or via the GitHub workflow below
git clone https://github.com/RyanLisse/aetherlink-academy-app.git /tmp/academy-wave-bootstrap
bash /tmp/academy-wave-bootstrap/infra/deploy/bootstrap-wave-foundation.sh <full-git-sha>
```

`bootstrap-wave-foundation.sh` installs the rebuild script, clones the repo under
`$ACADEMY_WAVE_HOME/src`, and creates `.env` with `openssl rand -hex 32` passwords
only when `.env` is missing. Secrets are never printed.

The **Wave foundation sibling deploy (manual)** workflow now runs bootstrap before
rebuild, so a cold host no longer fails with "No such file or directory".

## Operator invocation

```sh
# on the Hetzner box, once
mkdir -p /root/aetherlink-academy-wave
install -m 0755 infra/deploy/rebuild-wave-foundation.sh /root/aetherlink-academy-wave/rebuild-wave-foundation.sh
cp infra/.env.example /root/aetherlink-academy-wave/.env   # then edit real values

# per release
/root/aetherlink-academy-wave/rebuild-wave-foundation.sh <full-git-sha>
```

Or dispatch the GitHub workflow **Wave foundation sibling deploy (manual)** with the SHA and the confirmation phrase `deploy-sibling`. It requires the same SSH secrets as the legacy deploy and only runs the script above.

## Local integration check

From the repository root, with Docker available and no other process using loopback port `4318`:

```sh
cp infra/.env.example infra/.env
docker compose --project-name academy-wave --file infra/compose.yaml --env-file infra/.env up --detach --build
for i in $(seq 1 90); do curl --silent --fail http://127.0.0.1:4318/health >/dev/null && break; sleep 2; done
curl --fail http://127.0.0.1:4318/health
docker compose --project-name academy-wave --file infra/compose.yaml --env-file infra/.env stop postgres
curl --fail-with-body --include http://127.0.0.1:4318/connection
docker compose --project-name academy-wave --file infra/compose.yaml --env-file infra/.env start postgres
curl --fail http://127.0.0.1:4318/health
```

The generated CA and service certificates are local-only and can be removed with `docker compose ... down --volumes` when the stack is no longer needed.

## Acceptance still open

The external acceptance (`curl https://<host>:4318/health` returning `ok:true, proof:true` while `:4317/game/health` still answers, plus the firewall/proxy opening of :4318) has not been executed. Compose configuration validation and the CI workflow are defined, but a local or CI runtime pass is required before claiming the vertical slice is proven.
