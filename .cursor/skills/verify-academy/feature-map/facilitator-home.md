# Facilitator home / squad create

Facilitator home lets a host open the Academy start screen, authenticate with the facilitator start key (or Google SSO), create a named squad, and confirm the squad code is visible for participants.

## Sub-features

- `start-open` opens the public start screen with facilitator and join entry points.
- `facilitator-unlock` selects the facilitator role in the join Segmented control (`Ik ben facilitator` / `I am a facilitator`) and reveals the start-key field.
- `squad-create` persists a new room and shows the squad code.
- `squad-code-visible` exposes a copyable kamercode for participants.

## How to get to it (user POV)

- Open Academy at `http://127.0.0.1:4317/` (local) or `https://academy.91-99-78-17.sslip.io/` (soft-live).
- Choose role `Ik ben facilitator` (NL) or `I am a facilitator` (EN) in the role Segmented control.
- Enter a squad name and the facilitator start key, then choose `Maak squad`.
- (Alternate) Google Workspace SSO when `GOOGLE_*` + `ACADEMY_FACILITATOR_DOMAINS` are configured — not required for the host-key path.

## Driving it with control.mjs

Preconditions:

- `node .cursor/skills/verify-academy/scripts/control.mjs doctor` reports `ok: true`.
- Local: `.data/host-key` exists (created on first start) **or** `ACADEMY_HOST_KEY` is set. Deployed: `ACADEMY_HOST_KEY` in the environment.
- No prior need for an existing squad named `Verify Orion`.

- **Open start.** Navigate to the origin. Run `node .cursor/skills/verify-academy/scripts/control.mjs drive facilitator-home`. The page shows button `Ik ben facilitator` and button `Deelnemen`.
- **Prefer NL chrome.** Click language button `NL` so labels match the product default.
- **Unlock facilitator.** Select radio `Ik ben facilitator`. Browser: `getByRole('radio', { name: /Ik ben facilitator|I am a facilitator/ }).check()`. The `Facilitator-startsleutel` / `Facilitator start key` field appears.
- **Sign in.** Fill the start key and choose `Inloggen` / `Sign in`. Browser: `getByLabel(/^(Facilitator-startsleutel|Facilitator start key)$/).fill(...)` and `getByRole('button', { name: /^(Inloggen|Sign in)$/ }).click()`. The facilitator workspace opens.
- **Create squad.** Fill squad name `Verify Orion` in the `Start een squad` / `Start a squad` card and choose `Maak squad` / `Create squad`. Browser: `getByLabel(/^(Squadnaam|Squad name)$/).fill(...)` and `getByRole('button', { name: /^(Maak squad|Create squad)$/ }).click()`. Wait for heading `/^(Jouw squad|Your squad) \(/` and `h1` text `Verify Orion`.
- **Confirm landing.** After create, the facilitator lands on **Facilitatorwerkplek** / **Facilitator workspace** with `h1` `Verify Orion` (not the legacy `Jouw squad (n/n)` chrome alone).
- **Confirm code.** Capture `code` from the `POST /game/create` JSON response. Optionally open Participants (`Deelnemers`) and use `Kopieer uitnodigingslink` / `Copy invite link`.
- **Proof.** Save screenshot + ARIA under `artifacts/facilitator-home/` (`room.png`, `room.aria.txt`, `meta.json`). Artifacts show `Verify Orion` and facilitator workspace eyebrow; meta records squad code length (redacted).

## Gotchas

- Host key is required for the break-glass path; Google SSO alone on soft-live needs a signed-in facilitator browser profile.
- Creating a squad mutates shared soft-live state — prefer a disposable local instance for automated prove.
- Use separate browser contexts/profiles for facilitator vs participants (Proof iframe shares cookies within one profile).
- `ACADEMY_HOST_KEY` / `.data/host-key` must never appear in committed artifacts; redact in logs.
- After create on tip `5f645284`+, assert Facilitatorwerkplek + squad `h1` and create-response code — a 200 on `/` alone is not proof.
- Legacy deployed-browser-acceptance still expects `Jouw squad (`; prefer this map's workspace landing when driving tip ≥ #161.
