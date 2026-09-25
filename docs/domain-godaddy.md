# Domain guide. `academy.aetherlink.ai` to Hetzner

Last updated 2026-09-21 (Europe/Amsterdam).

This is an operator runbook. It prepares the GoDaddy DNS record and the Hetzner edge. It does not run DNS, SSH, TLS issuance, OAuth changes, or Vercel actions.

## Current evidence

The requested production hostname currently returns NXDOMAIN. HTTPS could not be checked because DNS did not resolve. No production cutover is claimed by this change. The local proxy gate is the only completed evidence and runs without secrets or external state.

| Item | Value |
| --- | --- |
| Hostname | `academy.aetherlink.ai` |
| GoDaddy nameservers | `ns73.domaincontrol.com`, `ns74.domaincontrol.com` |
| Academy A record | Pending operator action. `91.99.78.17` |
| Academy upstream | `127.0.0.1:4317` |
| Public URL after cutover | `https://academy.aetherlink.ai` |
| Proxy config | [`infra/proxy/Caddyfile`](../infra/proxy/Caddyfile) |
| Local gate | `node infra/proxy/verify-local.mjs` |

The Academy code remains `main` in `RyanLisse/aetherlink-academy-app`. The Hetzner sibling Docker path and its GitHub Actions rebuild remain the runtime/deploy SoT. The hostname cutover is separate from the marketing site.

The proxy must be the only public ingress. Proof on `:4400`, the app on `:4317`, Postgres, and Redis stay private. The planned Wave 1 runtime ports `:4318` and `:4418` are also internal and must not be opened publicly. Caddy preserves WebSocket upgrades and disables response buffering for SSE with `flush_interval -1`.

## Local verification

From the repository root, run:

```sh
node infra/proxy/verify-local.mjs
```

The script starts a deterministic HTTP, SSE, and WebSocket fixture on `127.0.0.1:48143`, starts Caddy from the checked-in config in a uniquely named disposable `academy-wave-domain-*` container on `127.0.0.1:48142`, asserts the health response, event-stream content type and payload, WebSocket upgrade, and an echoed WebSocket frame. Every network wait has a deadline. Cleanup terminates only the captured container ID created by that run. The verifier sets Caddy `ACADEMY_BIND=127.0.0.1` and `ACADEMY_ADMIN=off`; production keeps the default bind and loopback admin endpoint for normal reloads. It uses Docker host networking so Caddy can reach the loopback fixture; this requires Linux Docker or Docker Desktop with host networking enabled. It proves proxy behavior only. It does not prove the Academy container, TLS, DNS, or production reachability.

Run the bounded negative-path check with:

```sh
node infra/proxy/verify-local-negative.mjs
```

It occupies `48142` and expects the verifier to fail within thirty seconds, then closes its listener and child process. It does not inspect or remove an existing `academy-wave-domain` container.

## Production preparation

### 1. GoDaddy DNS. Ryan or registrar operator

Add one record in the `aetherlink.ai` GoDaddy DNS zone.

| Field | Value |
| --- | --- |
| Type | `A` |
| Name | `academy` |
| Value | `91.99.78.17` |
| TTL | `600` while testing, then the normal policy |

Leave the apex `@`, `www`, MX, TXT, SPF, and DMARC records unchanged. Verify from an external network:

```sh
dig +short academy.aetherlink.ai A
```

The expected answer is `91.99.78.17`. Do not continue to TLS until this answer is stable from more than one resolver.

### 2. Hetzner edge. Ops operator with SSH

1. Inspect the existing Openship edge first. It currently binds `:80` and `:443`; do not start a second listener or install a competing service until the operator has selected one owner for those ports. If Openship can attach this hostname and route the Academy upstream, use that existing edge and record its route. Otherwise use the Caddy config in this repository.
2. For the Caddy path, install or enable Caddy only after confirming `:80` and `:443` are free or have been deliberately handed over. Copy [`infra/proxy/Caddyfile`](../infra/proxy/Caddyfile) to the service configuration directory and provide `ACADEMY_HOST=academy.aetherlink.ai`, `ACADEMY_UPSTREAM=127.0.0.1:4317`, and `ACADEMY_PUBLIC_URL=https://academy.aetherlink.ai` through the service environment. Use [`infra/proxy/.env.example`](../infra/proxy/.env.example) as the shape only. It contains no credentials.
3. Validate before reload with `caddy validate --config /etc/caddy/Caddyfile` and inspect the rendered config. Reload with the host's existing service manager, then inspect the certificate and access logs. Caddy will obtain and renew the certificate after DNS and port 80 are reachable.
4. Bind the Academy gateway to loopback. Close inbound `4317`, `4400`, `4318`, and `4418` in the Hetzner firewall. Allow only `80` and `443` to the selected edge.
5. Verify the app from outside the VPS:

```sh
curl -fsS https://academy.aetherlink.ai/game/health
```

The response must be JSON with `ok: true` and `proof: true`. The final gate also needs a browser classroom run with both a WebSocket update and an SSE update. A `200` health response alone is insufficient.

### 3. App and Google OAuth configuration

Set `ACADEMY_PUBLIC_URL=https://academy.aetherlink.ai` in the private runtime environment, preserving the existing secret values. Restart through the existing deployment process. In the Google OAuth client, add the authorized JavaScript origin:

```text
https://academy.aetherlink.ai
```

Add this authorized redirect URI:

```text
https://academy.aetherlink.ai/auth/google/callback
```

Retest facilitator login and the participant MCP setup only after HTTPS is live. Never commit the environment file or OAuth credentials.

## Acceptance and open production action

The production acceptance remains open until an operator records all of these results:

- `dig +short academy.aetherlink.ai A` returns `91.99.78.17` from an external network.
- `curl -fsS https://academy.aetherlink.ai/game/health` returns `ok: true` and `proof: true`.
- HTTP redirects to HTTPS, and raw public access to `:4317`, `:4400`, `:4318`, and `:4418` is refused.
- A real browser classroom run proves WebSocket and SSE updates through the hostname.
- Google facilitator login and participant MCP connectivity use the hostname.
- The exact source revision and TLS certificate are recorded in release evidence.

This work does not perform any of those production actions. It does not change DNS, SSH to the VPS, issue a certificate, modify OAuth, or delete Vercel resources.

## Rollback

If the operator needs to back out, disable the Caddy site and remove only the `academy` A record. Keep apex, `www`, mail records, and the app data untouched. Restore the previous private runtime URL only if the application requires it during recovery.

## Records that stay untouched

The apex `@` record, `www` CNAME, MX, TXT, SPF, and DMARC records remain with their existing owners. The separate Openship control plane remains installed until an operator has deliberately selected it or Caddy as the sole `:80` and `:443` owner.

## Related operator documents

- [Vercel Academy takedown](vercel-academy-takedown.md)
- [Deployment status](DEPLOYMENT.md)
- [Release evidence](RELEASE-EVIDENCE.md)
