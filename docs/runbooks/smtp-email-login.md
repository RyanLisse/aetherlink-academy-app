# Runbook: SMTP for optional email login (AET-57)

Status: prepared 2026-09-26. Email login is off in production today (see "Before state").

For: the operator who connects a mail provider so participants can link an email address and sign in again with a 6-digit code. Email stays optional. Without SMTP the cohort code keeps working and the email option is hidden.

Only the legacy gateway sends these mails (`server/email-login.mjs`). apps/server has no email login.

## 1. What is in DNS today (checked 2026-09-26)

`aetherlink.ai` mail runs on Google Workspace. These records exist and must keep working:

| Record | Value |
| --- | --- |
| `MX @` | `aspmx.l.google.com` and the `alt1` to `alt4` Google hosts |
| `TXT @` (SPF) | `v=spf1 include:dc-aa8e722993._spfm.aetherlink.ai ~all` (a GoDaddy-managed include that resolves to `include:_spf.google.com`) |
| `TXT _dmarc` | `v=DMARC1; p=quarantine; ruf=mailto:info@aetherlink.ai` |
| `TXT google._domainkey` | Google Workspace DKIM key |

Rules that keep regular company mail safe:

1. A domain may have exactly one `v=spf1` TXT record. A second one makes SPF fail for all mail from `aetherlink.ai`, and with `p=quarantine` that mail lands in spam. Never add a second SPF record at `@`.
2. Do not change or add `_dmarc`. The existing policy already covers new senders.
3. Do not touch the MX records or `google._domainkey`.

## 2. Choose a sending setup

Pick one. Both work with the six variables in step 3.

**Option A. Google Workspace SMTP relay (no DNS change).** Workspace already passes SPF and signs DKIM for `aetherlink.ai`.

1. Create a dedicated Workspace user, for example `academy@aetherlink.ai`, or use an existing alias.
2. Google Admin console > **Apps > Google Workspace > Gmail > Routing > SMTP relay service > Configure**. Allowed senders: only addresses in your domains. Authentication: **require SMTP authentication**, and optionally also **only accept mail from these IP addresses** with `91.99.78.17`. Encryption: **require TLS**.
3. Use host `smtp-relay.gmail.com`, port `587`, the Workspace user and its password (or an app password when 2-step verification is on).

**Option B. A transactional mail provider** (for example Postmark, Resend, Amazon SES, Mailgun or Brevo).

1. In the provider, add the sending domain `aetherlink.ai` and a sender address such as `academy@aetherlink.ai`.
2. The provider shows DNS records. Add them in GoDaddy (**Domain Portfolio > aetherlink.ai > DNS**). They are safe when they are:
   - DKIM: a `TXT` or `CNAME` at a selector name such as `<selector>._domainkey`. It sits next to `google._domainkey` and does not touch `@`.
   - Return-Path / custom MAIL FROM: a `CNAME` (or `MX` + `TXT`) on a subdomain such as `bounce` or `pm-bounces`. Its SPF lives on that subdomain, not on `@`.
3. If the provider insists on an SPF include at `@`, edit the one existing SPF record and add the include before `~all`, for example `v=spf1 include:dc-aa8e722993._spfm.aetherlink.ai include:<provider-spf> ~all`. Keep the total under 10 DNS lookups. If GoDaddy manages SPF through its SPF tool, add the provider there instead of creating a new record.
4. Wait until the provider marks the domain verified.

DMARC then passes through DKIM alignment (`d=aetherlink.ai`), even though the envelope sender is the provider's bounce subdomain.

Outbound ports: Hetzner Cloud blocks outgoing ports 25 and 465 on new servers by default (Hetzner policy; not checked for this server). Use port 587 with STARTTLS. The verify script in step 5 shows whether 587 is reachable from the container.

Done when the provider (or Google Admin) shows the domain or relay as active and you have host, port, user and password in 1Password.

## 3. The variables

Names and rules from `createMailTransport` in `server/email-login.mjs`:

| Variable | Value | Notes |
| --- | --- | --- |
| `ACADEMY_MAIL_TRANSPORT` | `smtp` | `log` is refused when `NODE_ENV=production` (the image sets it). Any other value turns email login off |
| `ACADEMY_SMTP_HOST` | for example `smtp-relay.gmail.com` | required |
| `ACADEMY_SMTP_PORT` | `587` | default `587` with STARTTLS required. `465` means implicit TLS |
| `ACADEMY_SMTP_FROM` | `AetherLink Academy <academy@aetherlink.ai>` | required. Must be an address the provider allows |
| `ACADEMY_SMTP_USER` | provider user | set both user and pass, or neither |
| `ACADEMY_SMTP_PASS` | provider password or API key | secret |
| `ACADEMY_SMTP_REQUIRE_TLS` | leave unset | `0` only for a local test server without TLS |

When anything is missing or inconsistent, the gateway logs a warning, starts without email login, and every `/game/email/*` route answers 404. It never half-enables.

## 4. Set them on the legacy gateway (Hetzner)

The gateway env is the same private host file as the Google variables. Find it with the name-only commands in [google-oauth.md](google-oauth.md) step 4.

1. Back up the file: `cp <env-file> <env-file>.bak-$(date +%Y%m%d%H%M)`.
2. Add these lines:

   ```sh
   ACADEMY_MAIL_TRANSPORT=smtp
   ACADEMY_SMTP_HOST=smtp-relay.gmail.com
   ACADEMY_SMTP_PORT=587
   ACADEMY_SMTP_FROM=AetherLink Academy <academy@aetherlink.ai>
   ACADEMY_SMTP_USER=academy@aetherlink.ai
   ACADEMY_SMTP_PASS=...
   ```

   Keep each value on one line. The `From` value with spaces and `<...>` works unquoted.
3. Redeploy `main`:

   ```sh
   SHA=$(gh api repos/RyanLisse/aetherlink-academy-app/commits/main --jq .sha)
   ssh root@91.99.78.17 "/root/aetherlink-academy/rebuild-from-git.sh $SHA"
   ```

## 5. Verify

1. From inside the gateway container, which has the real env and the real network path. This checks `/game/config` and runs an SMTP handshake (greeting, EHLO, STARTTLS with certificate check, AUTH, NOOP, QUIT). It never sends `MAIL FROM`, `RCPT` or `DATA`, and it never prints the password:

   ```sh
   ssh root@91.99.78.17 'docker exec academy-app node scripts/verify/smtp.mjs http://127.0.0.1:4317'
   ```

   Done when it ends with `all 7 checks passed`: `/game/config emailLogin`, `SMTP env complete`, `SMTP greeting`, `EHLO`, `TLS`, `AUTH`, `NOOP`.

2. Before deploying, you can test the credentials from a laptop. The password is read without echo and stays in this shell only:

   ```sh
   read -rs ACADEMY_SMTP_PASS; export ACADEMY_SMTP_PASS
   ACADEMY_MAIL_TRANSPORT=smtp ACADEMY_SMTP_HOST=smtp-relay.gmail.com ACADEMY_SMTP_PORT=587 \
   ACADEMY_SMTP_FROM='AetherLink Academy <academy@aetherlink.ai>' ACADEMY_SMTP_USER=academy@aetherlink.ai \
     node scripts/verify/smtp.mjs
   unset ACADEMY_SMTP_PASS
   ```

3. One real mail, end to end. Join a test cohort as a participant, link your own address, and enter the code. In Gmail open the message, **Show original**, and expect `SPF: PASS`, `DKIM: PASS with domain aetherlink.ai` and `DMARC: PASS`.
4. Check that company mail still passes: send a normal mail from a `@aetherlink.ai` Workspace account to an outside Gmail address and read **Show original** the same way.

Done when all four steps pass.

Failures and what they mean:

| Output | Meaning |
| --- | --- |
| `emailLogin=false` | The gateway did not accept the env. Check its log: `docker logs academy-app 2>&1 \| grep ACADEMY_MAIL_TRANSPORT` |
| `SMTP handshake ... ETIMEDOUT` | Port blocked (Hetzner 25/465) or wrong host |
| `TLS ... server does not offer STARTTLS` | The app would refuse to send. Use port 587 on a server that offers STARTTLS |
| `AUTH (code 535 ...)` | Wrong user or password, or the relay does not allow this sender |
| `SPF: FAIL` or `DKIM: FAIL` in Show original | DNS records from step 2 are missing or not yet verified |

## 6. Limits and rollback

Codes are valid 10 minutes, allow 5 attempts, and have a 60-second resend cooldown. Sending is limited to 5 per address per hour and 20 per IP per 15 minutes. Check that the provider's daily quota is above your cohort size times a few logins.

Rollback: remove the `ACADEMY_MAIL_TRANSPORT` line (or restore the `.bak` file) and redeploy. The email option disappears; cohort codes keep working. Remove DNS records only if you also drop the provider, and never touch `@` SPF beyond undoing your own include.

## 7. Before state (2026-09-26)

```text
$ node scripts/verify/smtp.mjs http://91.99.78.17:4317
Email login on http://91.99.78.17:4317
  FAIL  /game/config emailLogin  (emailLogin=false (HTTP 200))
1 of 1 checks failed
```

The SMTP handshake was not run: no SMTP credentials exist yet.
