# Test the free OpenRouter coach models

Use `scripts/openrouter-model-check.mjs` to check the exact free-model IDs
`thinkingmachines/inkling:free`, `cohere/north-mini-code:free`, then
`nvidia/nemotron-3-ultra-550b-a55b:free` (in that order).
It first reads OpenRouter's live model catalog and requires the requested exact
ID plus zero prompt and completion prices. It then sends one authenticated,
synthetic lesson/question per model. The probe uses the same coach prompt and
`provider.data_collection: "deny"` rule as the application. It never sends
participant names, lesson content, room codes, or other Academy data.

## Run it

Provide `OPENROUTER_API_KEY` to this server-side process through the existing
1Password environment/mount workflow. Do not put it in browser code, a client
environment variable, a command argument, a checked-in `.env` file, or output.
For a shell session, use the protected environment setup already used by the
deployment; then run:

```sh
node scripts/openrouter-model-check.mjs
```

To check one model or repeat the checks explicitly:

```sh
node scripts/openrouter-model-check.mjs thinkingmachines/inkling:free
node scripts/openrouter-model-check.mjs nvidia/nemotron-3-ultra-550b-a55b:free
node scripts/openrouter-model-check.mjs cohere/north-mini-code:free
node scripts/openrouter-model-check.mjs nvidia/nemotron-3-ultra-550b-a55b:free cohere/north-mini-code:free
```

Exit status is `0` only when every requested model passed the live catalog
price gate and authenticated synthetic inference. A missing key or invalid ID
exits `2`; catalog, price, policy, rate-limit, availability, or response
failures exit `1`. Output reports the model and failure category, never the key,
request, generated answer, or raw upstream error body. A `PASS` is real live
catalog and authenticated API evidence; unit tests use mocked fetch and are
not evidence of model availability.

The checker submits only the requested model ID (there is no alternate-model
fallback list), rejects IDs without `:free`, requires zero prompt and
completion prices before inference, and rejects a response that reports a
non-free route or non-zero cost. OpenRouter may route within the providers for
the selected model. By default its data-collection restriction is kept on every
completion request. If that restriction leaves no eligible provider, the
checker reports `policy-unavailable` and stops for that model; it never automatically retries
without the privacy setting. The explicit synthetic-only opt-in below is separate. This is especially important for free endpoints,
whose provider privacy terms can differ.

## Configure the application

The application already accepts any `ACADEMY_COACH_MODEL` ending in `:free`.
After choosing a model that passed the live check, configure the server
environment only:

```sh
ACADEMY_COACH_MODEL=cohere/north-mini-code:free
```

Keep `OPENROUTER_API_KEY` server-side in the protected runtime environment.
Without it, the coach remains disabled and the deterministic FAQ continues to
work. Changing the model does not relax `provider.data_collection: "deny"`.

## Live catalog snapshot

On 2026-09-28, `GET https://openrouter.ai/api/v1/models` returned the Cohere and Nemotron exact
IDs with `pricing.prompt` and `pricing.completion` equal to `"0"`. This is a
time-specific catalog observation, not proof that inference is currently
available or that a provider will satisfy the Academy privacy policy. The
checker refreshes that catalog immediately before each live test.

OpenRouter references: [List models](https://openrouter.ai/docs/api/api-reference/models/get-models),
[provider data-collection controls](https://openrouter.ai/docs/guides/get-started/sovereign-ai),
[North Mini Code API details](https://openrouter.ai/cohere/north-mini-code), and
[Nemotron 3 Ultra free model](https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b-20260604).

## Authenticated Academy test — 28 September 2026

Using the Academy-specific 1Password key with synthetic content only: Cohere North Mini Code Free returned a valid cited answer and passed. Nemotron 3 Ultra Free returned a data-policy rejection: no endpoint matched `data_collection: "deny"`. The restriction was preserved. These observations are time-specific; rerun the checker before choosing a model.

## Explicit synthetic-only policy comparison

The default retains the Academy data policy. For a deliberately synthetic probe
where provider collection is acceptable, use:

```sh
node scripts/openrouter-model-check.mjs --allow-data-collection thinkingmachines/inkling:free cohere/north-mini-code:free nvidia/nemotron-3-ultra-550b-a55b:free
```

This flag removes only the probe's data-collection routing filter. It does not
change the running Academy policy, accept arbitrary prompt input, relax catalog
price checks or enable a paid fallback. The checker processes models in the given
order. Inkling and the relaxed-policy sequence require a separate successful live
run; the earlier Cohere success does not establish their result.
