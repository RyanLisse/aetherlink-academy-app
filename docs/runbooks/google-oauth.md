# Runbook: Google OAuth for facilitators (AET-6)

Status: prepared 2026-09-26. Google SSO is off in production today (see "Before state").

For: the operator who creates the Google OAuth client and turns on facilitator login for the legacy gateway and for apps/server. Participants do not use Google; they keep their cohort code.

## 1. Read this first

1. Google refuses redirect URIs that are a raw IP address or plain `http://`, except for `localhost`. Source: [Google redirect URI validation rules](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation). So `http://91.99.78.17:4317/auth/google/callback` cannot be registered. Production Google login needs an HTTPS hostname first.
2. `academy.aetherlink.ai` did not resolve on 2026-09-26 (no `A` record). Do the DNS and edge steps in [domain-godaddy.md](../domain-godaddy.md) before step 4 below. If you need login before that, the only option is another HTTPS hostname served by the OpenShip edge (for example an `sslip.io` name like the PoC used), registered as its own redirect URI.
3. The three Google variables are all-or-nothing. With one or two set, the gateway refuses to start (`server/runtime-config.mjs`) and so does apps/server (`googleSsoFromEnv`). Set all three in one edit.
4. The redirect URI is always `${ACADEMY_PUBLIC_URL}/auth/google/callback`. Both servers derive it the same way (`new URL('/auth/google/callback', publicUrl)`). `ACADEMY_PUBLIC_URL` must be an origin only: scheme, host and optional port, no path, no trailing text.

## 2. Create the OAuth client in Google Cloud

Use a Google Cloud project owned by the aetherlink.ai Workspace. The console calls this area **Google Auth Platform** (older name: **APIs & Services > OAuth consent screen / Credentials**).

1. Open https://console.cloud.google.com/auth/overview and select or create the project, for example `aetherlink-academy`.
2. **Branding**: app name `AetherLink Academy`, support email, developer contact email. Leave the logo empty; adding one starts Google's brand verification.
3. **Audience** (user type):
   - **Internal** if every facilitator has an `@aetherlink.ai` Google Workspace account. No review and no test-user list.
   - **External** if facilitators come from more than one Workspace (for example `aetherlink.ai` and `blinqx.tech`). Then press **Publish app** to move it to "In production". While it stays in "Testing", only listed test users can sign in. The requested scopes are non-sensitive, so no Google verification is needed.
   - Either way, the server still only accepts domains in `ACADEMY_FACILITATOR_DOMAINS`.
4. **Data Access**: add the scopes `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile`. The server requests `openid email profile`.
5. **Clients > Create client**, type **Web application**, name `academy-facilitators`.
6. **Authorized JavaScript origins**: not needed; the flow is server-side. Adding `https://academy.aetherlink.ai` does no harm.
7. **Authorized redirect URIs**, add every one you will use:

   ```text
   https://academy.aetherlink.ai/auth/google/callback
   http://localhost:4317/auth/google/callback
   http://localhost:4318/auth/google/callback
   https://<apps-server-host>/auth/google/callback
   ```

   The first is the legacy gateway in production. The two `localhost` lines are local development for the gateway (4317) and apps/server (4318). Use `localhost`, not `127.0.0.1`, and set `ACADEMY_PUBLIC_URL=http://localhost:<port>` locally so the callback matches. The last line is apps/server in production once it has a hostname ([apps-server-deploy.md](apps-server-deploy.md) step 7).
8. Save. Copy the **Client ID** (ends in `.apps.googleusercontent.com`) and the **Client secret** into 1Password. Do not paste them into chat, Linear or Git.

Done when the client shows the redirect URIs above and the secret is stored in 1Password.

## 3. The variables

| Variable | Legacy gateway | apps/server | Value |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | yes | yes | from step 2 |
| `GOOGLE_CLIENT_SECRET` | yes | yes | from step 2. apps/server also uses it as the HMAC key for the `academy-login` cookie |
| `ACADEMY_FACILITATOR_DOMAINS` | yes | yes | comma-separated, for example `aetherlink.ai` or `aetherlink.ai,blinqx.tech`. With exactly one domain, Google also gets the `hd` hint |
| `ACADEMY_PUBLIC_URL` | yes | yes | `https://academy.aetherlink.ai` for the gateway, `https://<apps-server-host>` for apps/server |

`GOOGLE_ALLOWED_DOMAINS` is not read anymore. The gateway signs the login cookie with `PROOF_COLLAB_SIGNING_SECRET`, or with the host key when that is unset. Both already exist in production.

Storage: the legacy gateway keeps facilitator sessions in its own Postgres schema, created by its own `init()`. Nothing to migrate. apps/server needs Drizzle migration `0006_facilitator_sessions.sql` (id 7 in `academy_curriculum_migrations`). Without it every login ends in `login_error=session`. Apply it with [apps-server-deploy.md](apps-server-deploy.md) step 5.

## 4. Set them on the legacy gateway (Hetzner)

Production env for the gateway is a private file on the host, read by the Compose service behind `/root/aetherlink-academy/rebuild-from-git.sh`. That script is not in this repository, so confirm the file path first. These commands print variable names only, never values:

```sh
ssh root@91.99.78.17 'ls -la /root/aetherlink-academy; grep -n "env" /root/aetherlink-academy/rebuild-from-git.sh'
ssh root@91.99.78.17 'docker exec academy-app env | cut -d= -f1 | sort'
```

Then:

1. Make a backup: `cp <env-file> <env-file>.bak-$(date +%Y%m%d%H%M)`.
2. Add or change these four lines in one edit:

   ```sh
   ACADEMY_PUBLIC_URL=https://academy.aetherlink.ai
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   ACADEMY_FACILITATOR_DOMAINS=aetherlink.ai
   ```

3. Redeploy the current `main` so the container picks up the file. The gateway health shows `revision: null`, so take the SHA from GitHub:

   ```sh
   SHA=$(gh api repos/RyanLisse/aetherlink-academy-app/commits/main --jq .sha)
   ssh root@91.99.78.17 "/root/aetherlink-academy/rebuild-from-git.sh $SHA"
   ```

   Or run **Deploy Hetzner Academy** from the Actions tab (`workflow_dispatch` on `main`).
4. If the gateway does not come back: the log shows `Google-login vereist dat GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET en ACADEMY_FACILITATOR_DOMAINS alle drie zijn ingesteld.` Fix the file, or restore the `.bak` file and redeploy.

For apps/server the file is `/root/aetherlink-academy-wave/.env`. See [apps-server-deploy.md](apps-server-deploy.md) step 8.

## 5. Verify without logging in

```sh
node scripts/verify/google-oauth.mjs https://academy.aetherlink.ai
node scripts/verify/apps-server.mjs https://<apps-server-host> --public-url https://<apps-server-host>
```

The script reads `/game/config` (gateway only) and calls `/auth/google/start` without following the redirect. It checks that the redirect goes to `https://accounts.google.com`, that `redirect_uri` equals `${ACADEMY_PUBLIC_URL}/auth/google/callback`, `response_type=code`, the scopes `openid email profile`, PKCE `S256` with a 43-character challenge, a random `state` and `nonce`, and an `academy-login` cookie that is `HttpOnly`, `SameSite=Lax` and `Secure` on HTTPS. It never contacts Google and never completes a login. It prints the `hd` hint when there is one.

Done when the gateway run ends with `all 10 checks passed` (9 without an `hd` hint).

If you test through a different origin than the public one (for example from inside the container at `http://127.0.0.1:4317`), pass `--public-url https://academy.aetherlink.ai`.

## 6. Verify with a real login

1. Open `https://academy.aetherlink.ai/auth/google/start` in a private window.
2. Sign in with a facilitator account in an allowed domain.
3. Expect to land on `https://academy.aetherlink.ai/?facilitator=1` with the facilitator view.
4. Sign in with a personal `@gmail.com` account. Expect `/?login_error=domain`.

Done when step 3 and step 4 both behave as described.

## 7. What each login_error means

Both servers use the same six codes and log `[academy] Google-login mislukt` with `code` and `reason`. Read the log with `ssh root@91.99.78.17 'docker logs --since 10m academy-app 2>&1 | grep Google-login'`.

| `login_error` | Meaning | Typical `reason` and fix |
| --- | --- | --- |
| `disabled` | SSO is off: the three Google variables are not all set | set all three and redeploy |
| `state` | The login state is missing, forged, expired or already used | `no-cookie`, `expired`, `mismatch`, `bad-signature`, `no-server-state`. Usually the callback came back to another origin than the one that started the login, or it took longer than 10 minutes. Check `ACADEMY_PUBLIC_URL` |
| `domain` | The Google account's Workspace domain (`hd`) or email domain is not allowed | `allowlist` or `hd`. Add the domain to `ACADEMY_FACILITATOR_DOMAINS` |
| `token` | Exchanging the code at Google failed | `token` or `id_token`. Wrong client secret, a redirect URI that does not match the registered one exactly, or a reused code |
| `verify` | The ID token failed a check | `aud` (wrong client ID), `iss`, `exp`, `iat` (server clock), `nonce`, `signature`, `jwks` or `discovery` (no outbound HTTPS to Google), `email_verified` |
| `session` | Google login worked but the session could not be stored | apps/server: migration 0006 missing or Postgres down. Gateway: Postgres down |

Google shows its own `Error 400: redirect_uri_mismatch` page before any of these when the redirect URI is not registered. Add the exact URI the verify script prints under `redirect_uri matches`.

## 8. Rollback

Remove the three Google lines (or restore the `.bak` file) and redeploy. Facilitators fall back to the host key. Leave the OAuth client in Google Cloud; it does nothing on its own.

## 9. Before state (2026-09-26)

```text
$ node scripts/verify/google-oauth.mjs http://91.99.78.17:4317
Google OAuth on http://91.99.78.17:4317
  FAIL  /game/config googleSso  (googleSso=false (HTTP 200))
  FAIL  start redirects to Google  (redirected to /?login_error=disabled: Google SSO is off: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ACADEMY_FACILITATOR_DOMAINS are not all set on this server)
2 of 2 checks failed
```

`dig +short academy.aetherlink.ai A` returned nothing.
