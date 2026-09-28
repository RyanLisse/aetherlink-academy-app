# Classroom / ConceptSim locale

ConceptSim locale proves that in-room step-through simulations follow the UI locale: under `nl`, narrative and attribution are Dutch with no silent EN leak; under `en`, English copy is shown. Prefer Harness Engineering (s01+) or a locale-complete workshop day (W5/W4/W3).

## Sub-features

- `locale-toggle` switches chrome between `NL` and `EN` via the language group.
- `conceptsim-open` opens a lesson that mounts ConceptSim (Harness day or workshop retrofit).
- `nl-attribution` asserts Dutch attribution text under `nl` (no EN leak).
- `en-attribution` asserts English attribution remains available under `en`.
- `sim-step` advances one ConceptSim step with `Stap vooruit` / `Step forward`.

## How to get to it (user POV)

- Join or create a room as facilitator (see [facilitator-home](./facilitator-home.md)).
- Open Course → **Harness Engineering** and pick a chapter day (e.g. day 8 / s01), **or** advance facilitator day control to Workshop 5/4/3.
- Open the Lesson panel so narrative, diagram, and ConceptSim are visible.
- Toggle **NL** then **EN** in the topbar language group and re-check ConceptSim attribution.

## Driving it with control.mjs

Preconditions:

- Doctor reports `ok: true` against the chosen harness target.
- Facilitator session active in a room (host-key or Google SSO).
- Tip under test includes locale-complete sims (`locales:{en,nl}` with per-locale `attribution`). Live soft-live tip may still be behind `main` until OpenShip — doctor prints `revision`.
- For NL attribution bar on workshops, expect Dutch strings such as `Door Academy geschreven` (W5) or Harness MIT NL attribution — never the EN-only top-level string under `nl`.

- **Enter room.** Use facilitator-home create (or join) so `Hoofdnavigatie` is visible.
- **Open lesson.** Navigate to Harness / workshop lesson so section `Conceptsimulatie` (nl) or `Concept simulation` (en) is present (`getByRole` / `getByTestId('sim-slot')` / `getByTestId('concept-sim')`).
- **NL path.** Click language button `NL` (`aria-pressed` true). Assert ConceptSim title/description are Dutch and `.sim-attribution` does **not** contain English-only phrases like `Academy-authored` or bare `MIT License, Copyright` without Dutch framing when a NL attribution exists.
- **Step once.** Click `Stap vooruit` (`getByRole('button', { name: 'Stap vooruit' })`). Timeline (`aria-live`) shows at least one message; status may show `Stap 1 van …`.
- **EN path.** Click `EN`. Attribution and sim chrome switch to English (`Step forward`, `Concept simulation`).
- **Proof.** Save `artifacts/conceptsim-locale/nl.png`, `nl.aria.txt`, `en.png`, `meta.json` with tip revision and chapter id.

Optional drive entry: `node .cursor/skills/verify-academy/scripts/control.mjs drive conceptsim-locale` (requires an already-authenticated room URL/session — see Gotchas).

## Gotchas

- Soft-live without facilitator auth is **blocked** for this feature (start screen alone is insufficient).
- SVG diagram labels may remain EN (MIT upstream); that is not an EN-leak failure. Attribution + narrative + sim step copy are the gate.
- Room header day can lag facilitator day control; Lesson content is authoritative.
- Do not iframe `learn.shareai.run` — ConceptSim is Academy-native.
- Fixture `fixture-agent-loop` may be EN-only under `nl` (surface proof only); use Harness s01–s17 or W5/W4/W3 for locale lock proofs.
