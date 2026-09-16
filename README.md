# AetherLink Academy

Nederlandse leeromgeving met een echt, doorlopend Proof-document, squads van 4–5, één driver, facilitatorbediening, privé-quiz, brongebonden kennisbank en bewijs/review/handoff. Eigen Claude Code werkt via een beperkte MCP-bridge. De app bevat geen modelchat en vraagt geen Anthropic API-key.

Zie [de vijf supportdagen](docs/LEARNING-ROUTE.md) voor inhoud, voortgang en de grenzen van de oefeningen.

## Starten

Vereist Node.js 24 en pnpm 11.19.0. Voer vanuit deze map uit:

```sh
node scripts/setup.mjs
node --env-file=.env scripts/start.mjs
```

Setup installeert de vastgelegde afhankelijkheden en bouwt app plus Proof. De runtime vereist de bestaande Postgres- en Redis-variabelen uit een afgeschermde `.env` of een werkende 1Password-mount. Gebruik bij een mount `--env-file=.env.1password`. Er worden geen model-providercredentials gevraagd. Open na de healthcheck http://127.0.0.1:4317; deze README bewijst niet dat daar momenteel een proces draait.

De lokale facilitatorcode staat in `.data/host-key` (alleen lokaal bekijken) en blijft beschikbaar als break-glass fallback. Maak via het startscherm een squad; deel de getoonde squadcode met deelnemers. Gebruik afzonderlijke browserprofielen: het Proof-iframe deelt de sessiecookie binnen één profiel. Praktijk start pas bij vier leden. De timer roteert nooit automatisch. Facilitator kiest fase en driver afzonderlijk.

Squads, sessies, Proof-documenten, marks, Yjs-geschiedenis en private snapshots staan in Postgres. Redis synchroniseert live samenwerking en aanwezigheid. `.data/` bewaart alleen lokale ontwikkelsleutels en eventueel historische fixturebestanden. Productie gebruikt gedeelde signing- en facilitatorgeheimen uit de serveromgeving. Stop met Ctrl-C. Browser-, MCP- en facilitator-logintokens verlopen na twaalf uur.

## Facilitator-login met Google

Stel `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` en `ACADEMY_FACILITATOR_DOMAINS` samen in om Google Workspace-login te activeren. De domeinlijst is kommagescheiden, bijvoorbeeld `example.nl,school.example`. Registreer `${ACADEMY_PUBLIC_URL}/auth/google/callback` als redirect-URI bij Google. Als een van de drie variabelen ontbreekt, start de loginconfiguratie niet; als alle drie ontbreken, blijft de bestaande interface ongewijzigd en werkt de facilitator-startsleutel als fallback.

## Eigen Claude Code verbinden

Open als deelnemer **Mijn leercoach** en klik **Kopieer voor je Claude**. Plak de complete privé-instructie in je eigen ingelogde Claude Code. De app regelt tijdelijke toegang voor de huidige deelnemer en squad; de deelnemer hoeft geen API-key, token of configuratie samen te stellen. Herhaald kopiëren in dezelfde browsersessie hergebruikt de instructie tot deze verloopt.

Claude configureert de remote MCP in lokale projectscope, controleert de sessie-identiteit via `get_mission` en leest daarna het gedeelde document en lesmateriaal. Mogelijk vraagt Claude om toestemming of een herstart om nieuwe tools te laden. De UI meldt alleen een geslaagde MCP-aanroep na werkelijk gebruik, niet na kopiëren. Clipboardblokkering geeft een selecteerbaar alternatief. De instructie bevat tijdelijke privétoegang en hoort uitsluitend in de eigen agent.

## Twee eigen accounts: nog uit te voeren

Na de HTTPS-deployment verbinden twee deelnemers ieder hun eigen Claude Code met hun eigen gametoken. Laat beide dezelfde missie/documentcontext ophalen, echte tests in hun eigen starter uitvoeren en bewijs met een unieke `requestId` indienen. Controleer toegeschreven bijdragen, gelijktijdige documentbewerkingen, herverbinding en tokenrevocatie. Voeg voor de squadgrootte twee testdeelnemers in aparte browserprofielen toe. Menselijk accepteren en afwijzen via Academy zijn lokaal met echte Proof-voorstellen getest. De accounttest en publieke regressie zijn nog niet afgerond.

## Docker en Vercel

`Dockerfile` en `Dockerfile.vercel` bouwen app plus Proof. De lokale Compose-configuratie vereist runtimecredentials en bewaart ontwikkelsleutels in een volume. Duurzame applicatietoestand staat extern. Docker is hier niet beschikbaar; de aparte CI/CD-taak verzorgt een echte build. De Vercel-startguard blijft actief tot de gedeelde runtime is geverifieerd. Zie [deploymentstatus](docs/DEPLOYMENT.md). Domain cutover runbook: [GoDaddy → academy.aetherlink.ai](docs/domain-godaddy.md).

## Controles en grenzen

```sh
pnpm test
node --test starter/status.test.mjs
```

De eerdere integratie- en samenwerkingstests vereisen een draaiende server via `ACADEMY_URL` (standaard poort 4317). Ze maken eigen testsquads. Gerichte databasechecks vereisen de bestaande Postgres-omgeving. `tests/distributed.test.mjs` start zelf twee echte app/Proof-processen wanneer `ACADEMY_DISTRIBUTED_TEST=1` is ingesteld; gebruik daarvoor exclusief poorten 4351/4352 en 4451/4452. Het testcommando neemt ook de TypeScript canonical-test mee.

De oorspronkelijke rendererhang is lokaal opgelost en opnieuw in de browser gecontroleerd. Publieke acceptatie en de volledige gedistribueerde regressie zijn nog niet geslaagd. [progress.md](progress.md) bevat de actuele resultaten en beperkingen. Het [gedateerde browserrapport](../demo/VERIFICATION.md) is een werkmapartefact buiten deze repository. Zie ook [architectuur](docs/ARCHITECTURE.md).

Dit is een lokaal pilot-MVP: de driverrol stuurt de werkvorm, geen exclusief schrijfrecht in Proof. Alle menselijke editors kunnen het document bewerken. Namen/squadcodes zijn geen geverifieerde identiteit. De tien ingebouwde lessen zijn een compacte MVP-inhoud; het volledige externe curriculumdocument is niet geïmporteerd. Enkele native Proof-bedieningen zijn Engels. Liveblocks is beoordeeld maar niet geïntegreerd. De broncoderepository is [RyanLisse/aetherlink-academy-app](https://github.com/RyanLisse/aetherlink-academy-app) en de publieke deployment draait op https://aetherlink-academy-app.vercel.app in Vercel-regio fra1. Deployed acceptatie wordt bewezen met `scripts/deployed-mcp-check.mjs` en `scripts/deployed-browser-acceptance.mjs`; zie [handleiding deelnemer](docs/handleiding-deelnemer.md) en [handleiding facilitator](docs/handleiding-facilitator.md).

## Kwaliteitschecks

Twee scanners lopen naast de tests. Beide zijn adviserend op pushes naar `main` en rapporteren op pull requests alleen nieuwe problemen.

```sh
npx react-doctor@latest src
qlty check --all --no-fix
qlty githooks install
```

React Doctor scant de React-frontend in `src/`; `doctor.config.json` sluit de vendored Proof SDK en buildoutput uit. Qlty draait actionlint, zizmor, shellcheck, hadolint, radarlint-iac, osv-scanner, trufflehog en ripgrep vanuit `.qlty/qlty.toml`; er zijn bewust geen formatters ingeschakeld. De git hooks in `.qlty/hooks` draaien de checks op gewijzigde bestanden voor elke push. Installeer de Qlty CLI met `curl -fsSL https://qlty.sh | bash`.

Proof is vendored vanaf [EveryInc/proof-sdk](https://github.com/EveryInc/proof-sdk), commit `fb2578758f1c62776301209131181643c5f4a19a`, inclusief MIT-licentie. Lokale integratieaanpassingen staan in de architectuurnotitie.
