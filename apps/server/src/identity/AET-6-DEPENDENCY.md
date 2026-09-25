# AET-6 dependency — Google SSO env

Facilitator Google SSO is implemented behind env flags in `google-sso.ts` /
`FacilitatorAuth`. It stays **disabled** until Hetzner ops (AET-6) sets:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ACADEMY_FACILITATOR_DOMAINS` (or `GOOGLE_ALLOWED_DOMAINS`)
- `ACADEMY_PUBLIC_URL` (callback = `${ACADEMY_PUBLIC_URL}/auth/google/callback`)

Domain cutover only changes `ACADEMY_PUBLIC_URL`. No code change required.
