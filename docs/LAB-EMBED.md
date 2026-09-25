# Lab embed contract (AET-87)

A day pack can host an Arcade Lab lesson, or any lab that speaks this contract, inside the Lesson panel. The participant plays the lab in an iframe. When the lab reports completion, the room records it in that participant's day progress. There is no second sandbox or LMS: the lab keeps its own runtime and only reports progress.

## Declaring labs in a day pack

Add `labs` to a pack in `server/content.mjs`:

```js
labs: [
  {id: 'ws-5-sdk-quickstart', src: '/arcade-lab/?lesson=ws-5-sdk-quickstart&embed=1', title: 'Arcade · SDK quickstart'},
],
```

| Field | Rule |
|---|---|
| `id` | Lowercase letters, digits and dashes, at most 64 characters, unique within the pack. For Arcade, use the lesson id from `apps/arcade-lab/LESSON-ID-CONTRACT.md`. |
| `src` | Absolute, or relative to the Academy origin. `embed=1` hides Arcade's authoring chrome and turns on the bridge. |
| `title` | Shown above the frame and used as the iframe `title` for screen readers. |
| `config` | Optional flat object of strings, numbers and booleans, passed to the lab in `init`. |

No production pack declares labs yet. Which day hosts which Arcade lesson is a content decision that is still open.

## Origin allowlist

The server serves a lab only when its `src` origin is on the allowlist. The Academy origin (`ACADEMY_PUBLIC_URL`) is always on it, because the gateway serves Arcade Lab at `/arcade-lab/`. Add other lab origins with a comma-separated `ACADEMY_LAB_ORIGINS`. Wildcards, paths and non-HTTP(S) entries are dropped. A lab with any other origin does not appear in `/game/day-pack`, and a completion for it gets a 404.

A same-origin lab is first-party code. The iframe uses `sandbox="allow-scripts allow-same-origin"`. Arcade needs `allow-same-origin` to load its module scripts, and the host needs it so the lab has a real origin to check. Together, these flags do not isolate a same-origin lab from the Academy page. Host third-party labs on their own origin.

## Messages

Types and parsers are in `packages/lab-embed` (`@academy/lab-embed`). Every message carries `v: 1`. Both sides ignore:

- a message from the wrong origin or window;
- a message with an unknown type or version;
- a message that fails validation;
- a message whose JSON is larger than 8 KB.

| Direction | Message |
|---|---|
| host → lab | `{v, type: 'init', labId, config, locale: 'nl' \| 'en'}` |
| lab → host | `{v, type: 'ready'}` |
| lab → host | `{v, type: 'progress', step, total}` |
| lab → host | `{v, type: 'complete', labId, result: {outcome: 'completed', score?: {value, max}}, evidence?}` (evidence is at most 2000 characters) |
| lab → host | `{v, type: 'error', message}` |

The host's handshake works like this:

1. The lab sends `ready` to each allowlisted host origin. The browser delivers it only to the parent's real origin.
2. The host answers `ready`, and also the iframe's `load` event, with `init` addressed to the lab's origin.
3. The lab binds to the first valid `init` from its parent and sends nothing before that.
4. The host drops a `complete` whose `labId` is not the lab it embedded.

On the lab side, Arcade Lab accepts `init` only from its own origin. `apps/arcade-lab/src/embed-bridge.ts` counts each finished checkpoint as one step, and reaching the end with every checkpoint finished as the last step. Seeking past a checkpoint does not count it.

## Recording completion

`POST /game/lab-complete` takes `{labId, result, evidence?}` from the participant's own session. It works like this:

- Facilitators get a 403. The embed shows them a preview note.
- A `labId` that the current day's pack does not declare, or that is not allowlisted, gets a 404.
- The first completion is stored under `progressByDay[day].labs[labId]` as `{source: 'lab-reported', result, evidence, at}` and returns `recorded: true`.
- A later completion for the same lab returns the stored record with `recorded: false`.
- The server takes the participant from the session only. A `participantId` in the body is ignored.

The record says the lab reported completion. It is not a verified grade. The Route panel shows a `Labs n/m` chip for days that host labs.
