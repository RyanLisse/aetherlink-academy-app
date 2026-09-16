# Vercel Academy takedown plan

Last updated: 2026-09-16 (Europe/Amsterdam)

**Goal:** Retire the **AetherLink Academy** app from Vercel Hobby once Hetzner is proven SoT.  
**Non-goal:** Deleting the whole Vercel account or breaking `aetherlink.ai` / `www` marketing if those still use Vercel.

## Why

Vercel Hobby paused this project after Fluid Active CPU / related limits (`DEPLOYMENT_DISABLED`). Academy now runs on Hetzner sibling Docker with GitHub Actions rebuilds on `main`.

## SoT after cutover

| Layer | SoT |
| --- | --- |
| Code | `https://github.com/RyanLisse/aetherlink-academy-app` `main` |
| Runtime | Hetzner CX33 `aetherlink-academy` — `http://91.99.78.17:4317` (later `https://academy.aetherlink.ai`) |
| Deploy | GitHub Actions → SSH → `rebuild-from-git.sh` |
| DNS (domain) | GoDaddy (`ns73`/`ns74.domaincontrol.com`) |

## Leave alone

- Apex `@` A → `76.76.21.21` (Vercel)
- `www` CNAME → `cname.vercel-dns.com`
- Any non-Academy Vercel projects under the same team

## Preconditions

1. Live health: `GET http://91.99.78.17:4317/game/health` → `{"ok":true,...}`
2. Thin-slice (or current workshop tip) smoke-tested on Hetzner
3. Ryan GO to archive/delete the Academy Vercel project
4. Optional: `academy.aetherlink.ai` HTTPS live (see `docs/domain-godaddy.md`)

## Steps (Ryan / operator in Vercel UI)

1. Open Vercel → team that owns Academy → find project(s) for `aetherlink-academy-app`.
2. Settings → Domains: remove Academy-only hostnames if any still listed.
3. Settings → Git: disconnect auto-deploy from GitHub **or** delete project after confirming no other app shares it.
4. Archive or **Delete** the Academy project only.
5. In GitHub repo settings: drop Vercel GitHub App checks as required if they still fail red on PRs (optional hygiene).
6. Confirm next `main` push still runs **Hetzner** Actions successfully.
7. Update `progress.md`: mark Vercel Academy taken down.

## Verify after takedown

- Hetzner health still green
- No one is sharing a Vercel Academy URL as the workshop link
- Marketing site `aetherlink.ai` / `www` still resolves if you still use them

## Rollback

Re-import the GitHub repo into Vercel and deploy `main` only with explicit Ryan GO (emergency). Prefer fixing Hetzner instead.

## Related

- Domain cutover: `docs/domain-godaddy.md`
- Hosting packet: `/workspace/handoffs/2026-09-16-aetherlink-academy-hetzner/`
