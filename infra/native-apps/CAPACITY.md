# Native app suite capacity baseline

Live read-only measurement: 2026-09-21 18:34 UTC.
Evidence: https://github.com/RyanLisse/aetherlink-academy-app/actions/runs/35639282838

| Resource | Observed |
| --- | --- |
| vCPU | 4 |
| RAM | 7751 MiB total; 4280 MiB available |
| Swap | none |
| Root filesystem | 75 GB; 58 GB used; 14 GB free; 81% |
| Academy authoring PoC idle memory | 222.3 MiB |
| Slides PoC idle memory | 234.7 MiB |
| Docker images | 23.83 GB total; reported reclaimable 14.75 GB |
| Docker build cache | 39.25 GB total; reported reclaimable 21.34 GB |

Docker shared-layer/cache totals can overlap. Do not add reclaimable figures or
blindly prune production/rollback images or volumes. All 12 containers were up;
Academy production, Academy PoC and Slides healthchecks were healthy.

## Decision

Disk headroom is the immediate rollout constraint. Audit retained builds and
perform scoped cache cleanup or expand storage before five additional builds.
Prefer CI/external builds; otherwise build sequentially. These idle measurements
do not establish concurrent-agent or media-render capacity. Measure per-app RSS,
CPU, queue delay, p95 response latency and disk growth at the intended class size.
A 16 GB RAM host or separate render/agent worker is a sizing candidate, not a
measured requirement or an approved purchase. No resize has been performed.

## Access

Existing GitHub Actions SSH credentials successfully ran the read-only audit.
Local 1Password/SSH authorization and the OpenShip API session are unavailable.
New OpenShip-managed deployment is not completed. An authorized OpenShip API
session/service credential is still required; do not bypass auth or silently
replace managed deployment with standalone Docker containers.

## Hetzner control-plane check

Installed official hcloud CLI v1.68.0. Context list is empty; both `hcloud server
list` and `hcloud server-type list` fail with `no active context or token`.
No HCLOUD_TOKEN is configured; GitHub contains only existing SSH deployment
secrets. A read-only token for the correct Hetzner project is required to inspect
existing second servers, quotas and location-specific model availability.

After authentication, use:

```sh
hcloud server list -o json
hcloud server-type list -o columns=name,cores,memory,disk,architecture,location,location_available
hcloud location list
```

Do not interpret a failed inventory as an empty project. Compare a resize with a
second x86 app/media host in the appropriate network zone; inspect workloads on
any existing candidate before reuse. No server was created, resized or deleted.
Exact pricing is pending authenticated lookup. Hetzner changed pricing for new
orders and rescales on 15 June 2026; existing unchanged servers are unaffected:
https://docs.hetzner.cloud/whats-new

## Authenticated follow-up (2026-09-21)

1Password access restored using the existing Aetherlink-hetzner-api item.
hcloud lists one server in this project: aetherlink-academy, CX33, nbg1,
4 vCPU / 8 GB / 80 GB. No second server exists in this project.

| Candidate | CPU / RAM / disk | nbg1 monthly net | Available in nbg1 |
| --- | --- | --- | --- |
| CX43 | 8 shared / 16 GB / 160 GB | EUR 15.99 | no (also unavailable fsn1/hel1) |
| CPX32 | 4 shared / 8 GB / 160 GB | EUR 35.49 | yes |
| CPX42 | 8 shared / 16 GB / 320 GB | EUR 69.49 | yes |
| CCX23 | 4 dedicated / 16 GB / 160 GB | EUR 85.99 | yes |

API price/availability snapshot, not a reservation. Prices exclude tax and any
IP, backup or storage add-ons. Project-wide quota was not established by this
inventory. Ryan chose not to order: reduce costs on the existing host first.

Pruned unused Docker build cache older than 24 hours with 10 GB cache reserve.
Recovered 4.932 GB; root filesystem now 54 GB used / 19 GB free (75%). No
containers, images or volumes deleted. Five OpenShip projects registered with
production limits 1 vCPU / 512 MB (Clips 768 MB); these are initial caps requiring
runtime acceptance, not proof that media rendering fits. Build caps 2 vCPU / 2 GB;
prefer external builds. OpenShip credentials restored for this session.


### Bounded Chat build observation — 2026-09-21

The classic Docker builder enforces the configured cgroup limit. Chat deployment
`dep_PXk9WSET0mHPh7Kx` exhausted its 2 GB build limit during the final Nitro bundle
(kernel OOM evidence); the runtime was never started. Before the single retry,
4334 MiB RAM was available and disk had 16 GB free. Retry
`dep_ZYFxkzqIYNXASso6` uses 2 CPU / 3072 MB build limits, with the runtime still
limited to 1 CPU / 512 MB. No server purchase or resize is authorized.

Five registered projects are not proof of capacity for five simultaneous apps.
Keep builds sequential, keep Clips background work disabled, and measure actual
runtime memory and disk after each accepted deployment before proceeding.
