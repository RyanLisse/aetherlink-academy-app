# AetherLink Academy

Current delivery direction: [incremental refactor and agent authoring](docs/decisions/2026-09-28-academy-agent-authoring.md). This decision describes planned changes; existing runtime behavior below is not a claim that hosted chat is already delivered.

Nederlandse leeromgeving met een gedeeld intent-document per squad (een Proof-cloudlink of `intent.md` in de squad-repo), flexibele squads (standaard ~4–5, soft max ~12), één driver, facilitatorbediening, privé-quiz, brongebonden kennisbank en bewijs/review/handoff. Eigen Claude Code werkt via een beperkte MCP-bridge. De app bevat geen modelchat en vraagt geen Anthropic API-key.

Zie [de vijf supportdagen](docs/LEARNING-ROUTE.md) voor inhoud, voortgang en de grenzen van de oefeningen. Squads bewaren bestanden in [objectopslag](docs/OBJECT-STORAGE.md) en bouwen en presenteren ook [slidedecks](docs/SLIDES.md) via de UI of via de eigen Claude Code (MCP-tools `create_deck`, `add_slide`, `update_slide`, `patch_deck`, `export_deck_html`).

## Starten

Vereist Node.js 24 en pnpm 11.19.0. Voer vanuit deze map uit:

```sh
node scripts/setup.mjs
node --env-file=.env scripts/start.mjs
```

Setup installeert de vastgelegde afhankelijkheden en bouwt de app. De runtime vereist de bestaande Postgres- en Redis-variabelen uit een afgeschermde `.env` of een werkende 1Password-mount. Gebruik bij een mount `--env-file=.env.1password`. Er worden geen model-providercredentials gevraagd. Open na de healthcheck http://127.0.0.1:4317; deze README bewijst niet dat daar momenteel een proces draait.

De lokale facilitatorcode staat in `.data/host-key` (alleen lokaal bekijken) en blijft beschikbaar als break-glass fallback. Maak via het startscherm een squad; deel de getoonde squadcode met deelnemers. Gebruik afzonderlijke browserprofielen: het Proof-iframe deelt de sessiecookie binnen één profiel. Praktijk start pas bij vier leden. De timer roteert nooit automatisch. Facilitator kiest fase en driver afzonderlijk.

Squads, sessies, intent-links, bewijs, reviews, het debriefbord en private snapshots staan in Postgres. Redis synchroniseert aanwezigheid en schermstatus. `.data/` bewaart alleen lokale ontwikkelsleutels en eventueel historische fixturebestanden. Productie gebruikt gedeelde signing- en facilitatorgeheimen uit de serveromgeving. Stop met Ctrl-C. Browser-, MCP- en facilitator-logintokens verlopen na twaalf uur.

## Facilitator-login met Google

Stel `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` en `ACADEMY_FACILITATOR_DOMAINS` samen in om Google Workspace-login te activeren. De domeinlijst is kommagescheiden, bijvoorbeeld `example.nl,school.example`. Registreer `${ACADEMY_PUBLIC_URL}/auth/google/callback` als redirect-URI bij Google. Waarden worden getrimd; een trailing spatie in `GOOGLE_CLIENT_ID` mag de audience-check niet meer breken. Als een van de drie variabelen ontbreekt, start de loginconfiguratie niet; als alle drie ontbreken, blijft de bestaande interface ongewijzigd en werkt de facilitator-startsleutel als fallback.

### Google-login foutcodes (`/?login_error=…`)

| Code | Betekenis | Serverlog |
|------|-----------|-----------|
| `state` | Cookie/server-state mismatch of verlopen | `[academy] Google-login state check failed` met `reason` (`no-cookie`, `expired`, `mismatch`, `bad-signature`, `no-server-state`) |
| `verify` | id_token-claims of JWKS-check mislukt | `[academy] Google-login mislukt` met `{code:'verify', reason}` — `reason` is o.a. `aud`, `iss`, `exp`, `iat`, `nonce`, `email_verified`, `signature`, `jwks`, `discovery`, `malformed` |
| `token` | Token-endpoint / authorization code mislukt | zelfde warn-vorm met `reason` (`token`, `code`, `id_token`) |
| `domain` | Hosted domain / e-maildomein niet op allowlist | `reason` `allowlist` of `hd` |
| `session` | Google-identiteit ok, maar facilitator-sessie opslaan faalde (DB/store) | `code:'session'` — **niet** verwarren met JWT-verify; startsleutel blijft beschikbaar |
| `disabled` | SSO-env incompleet | — |

Productie-proof: als Vercel Hobby `402 DEPLOYMENT_DISABLED` teruggeeft, is live login niet te testen tot de deployment weer actief is; gebruik lokaal of een preview-deploy.

## Eigen Claude Code verbinden

Open als deelnemer **Mijn leercoach** en klik **Kopieer voor je Claude**. Plak de complete privé-instructie in je eigen ingelogde Claude Code. De app regelt tijdelijke toegang voor de huidige deelnemer en squad; de deelnemer hoeft geen API-key, token of configuratie samen te stellen. Herhaald kopiëren in dezelfde browsersessie hergebruikt de instructie tot deze verloopt.

Claude configureert de remote MCP in lokale projectscope, controleert de sessie-identiteit via `get_mission` en leest daarna het gedeelde document en lesmateriaal. Mogelijk vraagt Claude om toestemming of een herstart om nieuwe tools te laden. De UI meldt alleen een geslaagde MCP-aanroep na werkelijk gebruik, niet na kopiëren. Clipboardblokkering geeft een selecteerbaar alternatief. De instructie bevat tijdelijke privétoegang en hoort uitsluitend in de eigen agent.

## Twee eigen accounts: nog uit te voeren

Na de HTTPS-deployment verbinden twee deelnemers ieder hun eigen Claude Code met hun eigen gametoken. Laat beide dezelfde missie en intent-link ophalen, echte tests in hun eigen starter uitvoeren en bewijs met een unieke `requestId` indienen. Controleer toegeschreven bijdragen, herverbinding en tokenrevocatie. Voeg voor de squadgrootte twee testdeelnemers in aparte browserprofielen toe. De accounttest en publieke regressie zijn nog niet afgerond.

## Docker

`Dockerfile` bouwt de app en is wat de Hetzner-productieruntime via Compose bouwt. De lokale Compose-configuratie vereist runtimecredentials en bewaart ontwikkelsleutels in een volume. Duurzame applicatietoestand staat extern. Docker is hier niet beschikbaar; de aparte CI/CD-taak verzorgt een echte build. Zie [deploymentstatus](docs/DEPLOYMENT.md). Domain cutover runbook: [GoDaddy → academy.aetherlink.ai](docs/domain-godaddy.md). Vercel is afgebouwd; de historische takedown staat in [Vercel Academy takedown](docs/vercel-academy-takedown.md).

## Controles en grenzen

```sh
pnpm test
node --test starter/status.test.mjs
```

De eerdere integratie- en samenwerkingstests vereisen een draaiende server via `ACADEMY_URL` (standaard poort 4317). Ze maken eigen testsquads. Gerichte databasechecks vereisen de bestaande Postgres-omgeving. `tests/distributed.test.mjs` start zelf twee echte Academy-processen wanneer `ACADEMY_DISTRIBUTED_TEST=1` is ingesteld; gebruik daarvoor exclusief poorten 4351/4352.

De oorspronkelijke rendererhang is lokaal opgelost en opnieuw in de browser gecontroleerd. Publieke acceptatie en de volledige gedistribueerde regressie zijn nog niet geslaagd. [progress.md](progress.md) bevat de actuele resultaten en beperkingen. Het [gedateerde browserrapport](../demo/VERIFICATION.md) is een werkmapartefact buiten deze repository. Zie ook [architectuur](docs/ARCHITECTURE.md).

Dit is een lokaal pilot-MVP: de driverrol stuurt de werkvorm. Het intent-document zelf staat buiten de Academy (Proof cloud of de squad-repo); alleen driver en facilitator zetten de link. Namen/squadcodes zijn geen geverifieerde identiteit. De tien ingebouwde lessen zijn een compacte MVP-inhoud; het volledige externe curriculumdocument is niet geïmporteerd. Liveblocks is beoordeeld maar niet geïntegreerd. De broncoderepository is [RyanLisse/aetherlink-academy-app](https://github.com/RyanLisse/aetherlink-academy-app) en de publieke deployment draait op de Hetzner CX33 `aetherlink-academy` via OpenShip edge (`https://academy.91-99-78-17.sslip.io/`; na de domain-stap is raw host `:4317` mogelijk alleen loopback — `academy.aetherlink.ai` / AET-42 volgt wanneer DNS bestaat). Deployed acceptatie wordt bewezen met `scripts/deployed-mcp-check.mjs` en `scripts/deployed-browser-acceptance.mjs`; zie [handleiding deelnemer](docs/handleiding-deelnemer.md) en [handleiding facilitator](docs/handleiding-facilitator.md).

## Kwaliteitschecks

Twee scanners lopen naast de tests. Beide zijn adviserend op pushes naar `main` en rapporteren op pull requests alleen nieuwe problemen.

```sh
npx react-doctor@latest src
qlty check --all --no-fix
qlty githooks install
```

React Doctor scant de React-frontend in `src/`; `doctor.config.json` sluit buildoutput uit. Qlty draait actionlint, zizmor, shellcheck, hadolint, radarlint-iac, osv-scanner, trufflehog en ripgrep vanuit `.qlty/qlty.toml`; er zijn bewust geen formatters ingeschakeld. De git hooks in `.qlty/hooks` draaien de checks op gewijzigde bestanden voor elke push. Installeer de Qlty CLI met `curl -fsSL https://qlty.sh | bash`.

De Academy bevat geen documenteditor meer. Het intent-document van een squad is een Proof-clouddocument of `intent.md` in de squad-repo; de room bewaart alleen de https-link (`POST /game/intent`) en `/game/intent.md` levert een sjabloon.
