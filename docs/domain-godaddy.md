# Domain guide — `academy.aetherlink.ai` (GoDaddy → Hetzner)

Last updated: 2026-09-16 (Europe/Amsterdam)

This guide connects **GoDaddy DNS** for `aetherlink.ai` to the Academy Hetzner VPS and fronts the app as **`https://academy.aetherlink.ai`**.

It is a **runbook**, not an automated cutover. DNS and registrar steps need a human in GoDaddy. VPS TLS / proxy steps need an operator with SSH to the Academy box.

## Current verified state

| Item | Value |
| --- | --- |
| Desired hostname | `academy.aetherlink.ai` |
| Domain | `aetherlink.ai` |
| DNS nameservers | GoDaddy `ns73.domaincontrol.com` / `ns74.domaincontrol.com` (**VERIFIED**) |
| Apex `@` A today | `76.76.21.21` (Vercel) — **leave alone** |
| `www` today | CNAME → `cname.vercel-dns.com.` — **leave alone** |
| `academy` today | **does not exist** (NXDOMAIN) |
| Academy VPS | Hetzner CX33 `aetherlink-academy`, IPv4 **`91.99.78.17`**, IPv6 prefix `2a01:4f8:1c16:63d8::/64` |
| Live app today | Sibling Docker on **`http://91.99.78.17:4317`** (health `/game/health`) |
| Deploy SoT | `main` → GitHub Actions → `/root/aetherlink-academy/rebuild-from-git.sh` |
| Openship | Installed on same VPS; edge listens `:80`/`:443` but **does not yet ship Academy** (needed a custom domain) |
| Vercel Hobby | Paused / blocked — not SoT for Academy |

Official GoDaddy A-record help: https://www.godaddy.com/help/add-or-edit-an-a-record-42546

---

## Goal

1. `academy.aetherlink.ai` resolves to the Academy VPS.
2. Browsers reach Academy on **HTTPS :443** (not raw `:4317`).
3. App env / OAuth know the public URL.
4. Apex and `www` stay on their current (Vercel) setup.

---

## Phase 1 — GoDaddy DNS (Ryan / human)

Sign in to [GoDaddy Domain Portfolio](https://www.godaddy.com/) → select **`aetherlink.ai`** → **DNS**.

### 1. Add the subdomain A record

| Field | Value |
| --- | --- |
| Type | **A** |
| Name | **`academy`** (GoDaddy will make `academy.aetherlink.ai`) |
| Value | **`91.99.78.17`** |
| TTL | 1 hour (default) or 600s while testing |

Save. Most changes show within ~1 hour; allow up to 48 hours globally.

### 2. Optional IPv6

If you want dual-stack and have a specific host address on the VPS (not only the `/64` prefix), add an **AAAA** for Name `academy` with that address. Skip until the IPv6 host address is confirmed on the server.

### 3. Do **not** change

- Apex `@` A → Vercel
- `www` CNAME → Vercel
- Existing MX / TXT / SPF / DMARC for mail

### 4. Verify DNS

From any machine:

```bash
# should return 91.99.78.17
dig +short academy.aetherlink.ai A
# or
curl -sS "https://dns.google/resolve?name=academy.aetherlink.ai&type=A"
```

Also check GoDaddy’s DNS list shows `academy` → `91.99.78.17`.

**Checkpoint:** DNS only. Hitting `http://academy.aetherlink.ai:4317` may work once DNS propagates; `https://academy.aetherlink.ai` will not until Phase 2.

---

## Phase 2 — HTTPS on the VPS (operator)

Pick **one** path. Recommended for this host: **Path A** (simple reverse proxy + Let’s Encrypt) while sibling Docker remains deploy SoT. **Path B** uses Openship edge once the domain is attached there.

### Shared prerequisites

- SSH to the VPS as `root` (or sudo) with the Academy deploy key / ops key.
- Ports **80** and **443** open in Hetzner firewall / cloud firewall for the public IP.
- DNS for `academy.aetherlink.ai` already pointing at `91.99.78.17`.
- Academy container healthy: `curl -sS http://127.0.0.1:4317/game/health` → `{"ok":true,...}`.

### Path A — Caddy (or nginx) reverse proxy → `:4317` (**recommended v1**)

Idea: terminate TLS on the host; proxy to the existing `academy-app` publish on loopback or `127.0.0.1:4317`.

Suggested end state:

1. Change Docker publish from `0.0.0.0:4317` to **`127.0.0.1:4317`** (so the app is not directly public).
2. Install Caddy (or nginx + certbot).
3. Site block for `academy.aetherlink.ai` → `reverse_proxy 127.0.0.1:4317`.
4. Let’s Encrypt HTTP-01 on `:80` (automatic with Caddy).

Minimal Caddyfile sketch (operator fills paths):

```text
academy.aetherlink.ai {
        reverse_proxy 127.0.0.1:4317
}
```

Prove:

```bash
curl -sS https://academy.aetherlink.ai/game/health
# expect {"ok":true,"proof":true,...}
```

Browser: open `https://academy.aetherlink.ai` — EN default + EN|NL toggle.

### Path B — Openship edge

Openship on this box already binds **`:80`/`:443`**. Once `academy.aetherlink.ai` DNS is live:

1. In Openship, attach the custom domain to the Academy project / service.
2. Point edge upstream at the Academy container (or stop publishing `:4317` publicly and let edge be the only ingress).
3. Confirm Openship issues / renews certificates for the hostname.
4. Only then consider Openship auto-deploy as an alternate to sibling Docker Actions — **do not flip SoT** until health + Actions path are still understood.

If Openship domain UX still requires Openship Cloud billing, stay on **Path A**.

---

## Phase 3 — App config after HTTPS works

On the VPS env file `/root/aetherlink-academy/.env` (mode 600 — **never commit**):

| Variable (names may vary — match repo) | Set to |
| --- | --- |
| Public URL / origin | `https://academy.aetherlink.ai` |
| Any cookie / CSRF / absolute link base | same origin |

Rebuild/restart sibling Docker via the existing script (or wait for next `main` push).

### Google facilitator OAuth (AET-6)

In Google Cloud Console OAuth client for Academy, add authorized origins / redirect URIs for:

- `https://academy.aetherlink.ai`
- (and keep old IP/port URIs only while still testing)

Then retest facilitator Google login on the hostname, not the raw IP.

### Progress / intent docs

Update `progress.md` when cutover is live (hostname + TLS path chosen). Keep `intent.md` hosting SoT in sync.

---

## Phase 4 — Hardening checklist

- [ ] `https://academy.aetherlink.ai/game/health` OK
- [ ] HTTP → HTTPS redirect works
- [ ] `:4317` no longer public (`0.0.0.0` → loopback only)
- [ ] Hetzner firewall: 80/443 open; 4317 closed from internet
- [ ] OAuth redirects updated
- [ ] EN|NL toggle still works on the domain
- [ ] GitHub Actions deploy still healthy after rebuild
- [ ] Vercel Hobby left paused (no need to revive for Academy)

---

## Rollback

1. Remove or change the GoDaddy `academy` A record (or point elsewhere).
2. Re-publish `0.0.0.0:4317` if needed for emergency IP access.
3. Disable / stop the reverse proxy or Openship domain route.
4. Revert `.env` public URL to the IP form only if something hard-depends on it.

---

## Who does what

| Step | Owner |
| --- | --- |
| GoDaddy A record `academy` → `91.99.78.17` | Ryan (registrar) |
| TLS proxy / Openship domain attach | CoS routes → ops/Herdr on VPS |
| `.env` public URL + rebuild | ops/Herdr |
| Google OAuth redirect URIs | Ryan (Google Console) or delegated |
| Linear tracking | AetherLink workspace project **AetherLink Academy** |

## Related

- Live interim URL: `http://91.99.78.17:4317`
- Repo: https://github.com/RyanLisse/aetherlink-academy-app
- Linear project: https://linear.app/aetherlink/project/aetherlink-academy-ecb902a093bd
- Linear issue: https://linear.app/aetherlink/issue/AET-11/docs-godaddy-domain-guide-for-academyaetherlinkai
