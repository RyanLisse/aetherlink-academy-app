# AET-6 dependency: Google SSO for facilitators on apps/server

`apps/server` serves the same facilitator login as the legacy gateway
(`server/google-sso.mjs`, `server/app.mjs`):

| Route | Behaviour |
| --- | --- |
| `GET /auth/google/start` | PKCE S256 + `state` + `nonce` (10 min). Sets the signed `academy-login` cookie, stores the verifier and nonce in `facilitator_login_states`, then redirects to Google. |
| `GET /auth/google/callback` | Checks state (cookie first, then the single-use server record), exchanges the code, verifies the ID token against Google's JWKS, applies the domain allowlist, then sets `academy-facilitator` and redirects to `/?facilitator=1`. |
| `POST /auth/logout` | Deletes the session row and expires the cookie. Answers `204`. |

Failures redirect to `/?login_error=<code>`:

| Code | Cause |
| --- | --- |
| `state` | Missing, forged, expired or replayed state. |
| `domain` | `hd` or the email domain is not in `ACADEMY_FACILITATOR_DOMAINS`. |
| `token` | The code exchange failed, for example a PKCE verifier mismatch or a reused code. |
| `verify` | Bad signature, `iss`, `aud`, `exp`, `iat` or `nonce`, or the email is not verified. |
| `disabled` | Google env is not configured. |
| `session` | Anything else, such as the session store being unavailable. |

`academy-facilitator` holds a random 256-bit token. It is `HttpOnly`,
`SameSite=Lax` and `Path=/`, with `Max-Age=43200` (12 h). It is `Secure`
whenever `ACADEMY_PUBLIC_URL` is https. Postgres keeps only
`sha256(token)`, in `academy_curriculum.facilitator_sessions` (migration
`0006_facilitator_sessions.sql`). Any instance can resolve the cookie, and a
restart logs nobody out. `/authoring-api` accepts it as a cookie or as
`Authorization: Bearer <token>`.

## Env (all-or-nothing)

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client ID (`…apps.googleusercontent.com`). |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret. It also keys the HMAC on the `academy-login` cookie. |
| `ACADEMY_FACILITATOR_DOMAINS` | Comma-separated Workspace domains, for example `aetherlink.ai,blinqx.tech`. With one domain, Google also gets the `hd` hint. |
| `ACADEMY_PUBLIC_URL` | `https://academy.aetherlink.ai`. The callback is `${ACADEMY_PUBLIC_URL}/auth/google/callback`. |

With none of the first three set, SSO is off and both routes redirect to
`/?login_error=disabled`. With some but not all set, the server refuses to
boot. This is the same rule as `server/runtime-config.mjs`.
`GOOGLE_ALLOWED_DOMAINS` is no longer read.

## What Ryan configures

1. Google Cloud Console, **APIs & Services > Credentials > Create
   credentials > OAuth client ID**, type **Web application**.
2. **Authorized redirect URIs**:
   - `https://academy.aetherlink.ai/auth/google/callback`
   - `http://localhost:4318/auth/google/callback` (apps/server local dev)
   - `http://localhost:4317/auth/google/callback` (legacy gateway local dev,
     if the same client is shared)
   - any staging origin, as `https://<staging-host>/auth/google/callback`
3. **Authorized JavaScript origins** are not needed, because the flow is
   server-side.
4. **OAuth consent screen**: user type **Internal** when every facilitator
   is in one Workspace. Use External plus the domain allowlist otherwise.
   Scopes: `openid`, `email`, `profile`.
5. Set the four env vars above as OpenShip / Hetzner secrets on the
   apps/server service.
6. Apply the Drizzle migrations (including `0006`) to the production
   database before the first boot with SSO. apps/server does not run
   `migrate.run` at startup.

Google must list local redirect URIs as `localhost`, not `127.0.0.1`. Set
`ACADEMY_PUBLIC_URL=http://localhost:4318` locally so the callback matches.
A domain cutover changes `ACADEMY_PUBLIC_URL` and adds the new redirect URI.
No code change is needed.
