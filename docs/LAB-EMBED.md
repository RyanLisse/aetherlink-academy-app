# Lab embed contract (AET-87, graded stops AET-95)

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

Types and parsers are in `packages/lab-embed` (`@academy/lab-embed`). Every message carries `v: 1`. The contract is at minor 1 (`LAB_EMBED_MINOR`), which adds graded stops. Minor 1 only adds optional fields and message types, so a minor-0 peer still works (see [Version handling](#version-handling)). Both sides ignore:

- a message from the wrong origin or window;
- a message with an unknown type or version;
- a message that fails validation;
- a message whose JSON is larger than 8 KB.

| Direction | Message |
|---|---|
| host → lab | `{v, type: 'init', minor, labId, config, locale: 'nl' \| 'en', gradedStops}` (`minor` and `gradedStops` are new in minor 1) |
| host → lab | `{v, type: 'graded', labId, stopId, passed, attempts}` (minor 1) |
| lab → host | `{v, type: 'ready'}` |
| lab → host | `{v, type: 'progress', step, total}` |
| lab → host | `{v, type: 'answer', labId, stopId, answer}` (minor 1; `answer` is a choice index or at most 2000 characters of text) |
| lab → host | `{v, type: 'complete', labId, result: {outcome: 'completed', score?: {value, max}}, evidence?}` (evidence is at most 2000 characters) |
| lab → host | `{v, type: 'error', message}` |

The host's handshake works like this:

1. The lab sends `ready` to each allowlisted host origin. The browser delivers it only to the parent's real origin.
2. The host answers `ready`, and also the iframe's `load` event, with `init` addressed to the lab's origin.
3. The lab binds to the first valid `init` from its parent and sends nothing before that.
4. The host drops a `complete` or `answer` whose `labId` is not the lab it embedded, and an `answer` for a stop outside `gradedStops`.

On the lab side, Arcade Lab accepts `init` only from its own origin. `apps/arcade-lab/src/embed-bridge.ts` counts each finished checkpoint as one step, and reaching the end with every checkpoint finished as the last step. Seeking past a checkpoint does not count it.

## Recording completion

`POST /game/lab-complete` takes `{labId, result, evidence?}` from the participant's own session. It works like this:

- Facilitators get a 403. The embed shows them a preview note.
- A `labId` that the current day's pack does not declare, or that is not allowlisted, gets a 404.
- The first completion is stored under `progressByDay[day].labs[labId]` as `{source: 'lab-reported', result, evidence, at}` and returns `recorded: true`.
- A later completion for the same lab returns the stored record with `recorded: false`.
- The server takes the participant from the session only. A `participantId` in the body is ignored.

For a lab without graded stops, the record says the lab reported completion. It is not a verified grade. For graded labs, see [Graded stops](#graded-stops). The Route panel shows a `Labs n/m` chip for days that host labs.

## Graded stops

A graded stop is a checkpoint whose answer the server checks. The lab never gets the expected answer, only the verdict. The server records the verdict in the participant's day progress.

### Declaring answer keys

Keys live in `server/lab-keys.mjs`, keyed by lab id and then stop id. They are not in the day pack, because the portal publishes the whole pack. The server parses them at startup and refuses to boot on a malformed key.

```js
export const labGradingKeys={
  'ws-2-eve-state':{'stop-2':{kind:'choice',correct:1}},
};
```

| Kind | Key | Passes when |
|---|---|---|
| `choice` | `{correct}` | the answer is that option index. This mirrors an Arcade knowledge check (`options` + `correct`). |
| `match` | `{includes?, regex?, flags?}` | the answer is text, contains `includes` and matches `regex`. This mirrors the Arcade `assert` shape. `flags` may use only `i`, `m`, `s` and `u`. |

Arcade stops have no ids, so the contract names them by position. `stop-1` is the lesson's first checkpoint, `stop-2` its second, and so on. No production pack declares labs yet, so `labGradingKeys` is empty.

`/game/day-pack` lists each lab's `gradedStops` as ids only. The host passes them to the lab in `init`. In a facilitator preview, the host sends an empty `gradedStops`, so the lab runs ungraded.

### Flow

1. At a graded stop, Arcade shows a card marked "graded by Academy". It does not reveal the answer locally.
2. The lab sends `answer`. The host relays it to `POST /game/lab-answer` with `{labId, stopId, answer}`.
3. The server grades the answer against the key. It stores `progressByDay[day].labStops[labId][stopId]` as `{stopId, passed, attempts, at, source: 'server-graded'}` and returns `{recorded, day, labId, stop}`.
4. The host posts `graded` back to the lab. A wrong answer marks only the chosen option and lets the participant try again. A passed stop enables Continue and counts as a finished step.

`/game/lab-answer` follows the same rules as `/game/lab-complete`. It takes the participant from the session only. Facilitators get a 403. A lab that is not in today's pack gets a 404, and so does a stop without a key. A stop that has passed stays passed: later answers return the stored record with `recorded: false` and do not count as attempts. The submitted answer itself is not stored.

For a lab with graded stops, `/game/lab-complete` returns 409 until every graded stop has passed. It then records `{source: 'server-graded', result: {outcome: 'completed', score: {value: n, max: n}}, evidence, at}` and ignores the result the lab reported. A lab without keys still records `source: 'lab-reported'`.

### Version handling

- A minor-0 host sends `init` without `minor` or `gradedStops`. The lab reads that as minor 0 with no graded stops and reports completion as before.
- A minor-0 lab ignores `gradedStops` and never sends `answer`. If the server has keys for that lab, the completion gets a 409, so a lab that cannot be graded never counts as graded.
- A message with any `v` other than 1 is ignored, as before.

### What Arcade can grade now

A run of `apps/arcade-lab` lessons on 2026-09-25 found 22 checkpoints:

| Checkpoint | Count | Gradable now |
|---|---|---|
| Knowledge check (`options` + `correct`) | 10, in every lesson except `sample-counter` | Yes, as `choice`. |
| Free-text prediction or reflection | 12 | Only with a deterministic key, as `match`. Most are open questions that need human review. |
| `assert` over a lesson file (`ws-1-eve-weather` stop-2) | 1 | No. The replay writes that file itself, so the assert checks the recording, not the participant. |
| Code that must run (for example the `node:assert` tests in `ws-3-sdk-weather`) | n/a | No. The server never runs submitted code. This needs a sandbox and is an open item. |

A built-in Arcade lesson still ships its `correct` index in the Arcade bundle, because standalone Arcade reveals answers locally. For those stops, the server verdict is authoritative, but the key is not secret. Keeping it secret means removing `correct` from graded lessons in embed builds. That is an open item.

