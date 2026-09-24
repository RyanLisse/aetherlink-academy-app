# Squad room

A facilitator creates a squad and shares its room code; participants join by name and code without an account, get a Driver or Navigator role, and land in the shared squad room.

## Sub-features

- `squad-create` facilitator creates a squad with the start key (or Google SSO when configured).
- `squad-join` participant joins with name and room code.
- `squad-roles` roster shows Driver and Navigators; facilitator controls rotate roles and advance rounds.
- `squad-rejoin` the same name and code in a fresh session restores the seat.
- `squad-overview` facilitator overview lists all squads (`/?facilitator=1`, then overview).
- `squad-errors` wrong code, wrong start key and a full squad show distinct messages.

## How to get to it (user POV)

- Facilitator opens `/?facilitator=1`, or `/` and chooses `I am a facilitator` in the `Choose your role` tablist.
- Participant opens `/` (or a shared link with `?code=<room code>`) and stays on `I am a participant`.

## Driving it with Playwright

Preconditions:

- Doctor passes. Host key read from `.verification/runs/<run-id>/academy-data/host-key` into a variable.
- One browser context per person.

- **Create.** Facilitator context: `goto('/?facilitator=1')`, fill `getByLabel('Squad name')` with `Squad Verify`, `getByLabel('Your name')` with `Facilitator`, `getByLabel('Facilitator start key')` with the key, click `getByRole('button', {name: 'Create squad'})`. The squad room opens with `getByRole('navigation', {name: 'Main navigation'})` and a room code in the header; record the code.
- **Join.** Participant context: `goto('/')`, fill `getByLabel('Your name')` with `Participant A` and `getByLabel('Room code')` with the code, click `getByRole('button', {name: 'Join'})`. The squad room opens.
- **Roster read-back.** In the facilitator context, the roster lists `Participant A` with a role. Reload; it is still listed.
- **Soft rejoin.** Open a new participant context, join again as `Participant A` with the same code. The roster does not gain a second `Participant A`.
- **Wrong code.** Join with code `ZZZZZZ`. A "room not found" style error appears and no room opens.
- **Proof.** Facilitator and participant screenshots after join, ARIA snapshot of the roster, `state.json` with the room code and roster names.

## Gotchas

- Sessions are cookies. Two people in one browser context overwrite each other.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `ACADEMY_FACILITATOR_DOMAINS` must be all set or all unset; `start.mjs` strips them, so local runs use the start key path.
- The `apps/web` `/` shell also shows a `Squad room` heading with a `JoinForm`, but it is only served by the wave runtime and its roster is demo data (`Ada`, `Nik`, `Lee`) held in `sessionStorage`. On the gateway, `/` is the legacy game. Do not prove squads on the wave shell.
- Practice rounds need enough members; recipes that start rounds should join four participants.
- Never create squads on production.
