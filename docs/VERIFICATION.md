# Verificatie

Dit runbook beschrijft de controles tegen een draaiende Academy: lokaal en tegen productie.
Productie is nu `http://91.99.78.17:4317` (Hetzner). `academy.aetherlink.ai` resolvet nog niet (NXDOMAIN).

## Overzicht

| Controle | Script | Secrets | Schrijft data | HTTP toegestaan |
|---|---|---|---|---|
| Deployed smoke | `scripts/deployed-smoke.mjs` | geen | nee | ja |
| SSO-probe | `scripts/deployed-smoke.mjs` met `SMOKE_SSO=1` | geen | alleen een login-state van 10 minuten als SSO aan staat | ja |
| Curriculumdagen 1–7 | `scripts/deployed-curriculum.mjs` | geen | nee | ja |
| Leercheck | `scripts/deployed-learning-check.mjs` | `ACADEMY_HOST_KEY` | ja, synthetische squad | nee, alleen HTTPS |
| MCP-check | `scripts/deployed-mcp-check.mjs` | `ACADEMY_HOST_KEY` | ja, synthetische squad | nee, alleen HTTPS |
| Browseracceptatie | `scripts/deployed-browser-acceptance.mjs` | `ACADEMY_HOST_KEY` | ja, synthetische squad | nee, alleen HTTPS |
| Unit-tests van de probes | `tests/deployed-smoke.test.mjs` | geen | nee | n.v.t. |

Alle deployed-scripts gebruiken dezelfde exitcodes.
`0` betekent dat alles slaagt.
`1` betekent dat minstens één controle faalt: kapot, onbereikbaar of verkeerde revisie.
`2` betekent dat niets faalt, maar een onderdeel nog niet beschikbaar is: SSO niet geconfigureerd of een curriculumdag niet uitgerold.
Beide niet-nulcodes blokkeren een release. Code `2` is een configuratie- of uitrolvraag, geen bug.

## Deployed smoke

Draai tegen productie:

```sh
SMOKE_BASE_URL=http://91.99.78.17:4317 EXPECTED_REVISION=<volledige commit-SHA> node scripts/deployed-smoke.mjs
```

Draai lokaal na `pnpm start` met `SMOKE_BASE_URL=http://127.0.0.1:4317`.
In GitHub Actions start je "Academy deployed smoke" met `url`, `revision` en optioneel `sso` en `public_url`.
Het artefact `deployed-smoke-<run>` bevat `test-results/deployed-smoke.json`.
Elke check daarin heeft `name`, `status`, `passed` en `detail`.

Verwachte uitvoer tegen productie op 25 september 2026:

```text
WARN plain HTTP target http://91.99.78.17:4317; this smoke sends no credentials, but TLS is not verified
PASS: Academy and Proof ready: ok=true proof=true
FAIL: Deployed revision matches EXPECTED_REVISION: /game/health reports no revision (null); set SOURCE_REVISION on the deployed process
PASS: Application HTML available: / HTTP 200 text/html; charset=utf-8
PASS: Public runtime config: googleSso=false portal=true portalLaunch=true
PASS: /game/state rejects missing credentials: HTTP 401
...
11/12 deployed smoke checks passed
```

De smoke faalt daar dus met exit `1` op de revisie. Dat is een bekend gat: het proces op Hetzner krijgt geen `SOURCE_REVISION`.

| Melding | Betekenis |
|---|---|
| `FAIL: deployment metadata` | `SMOKE_BASE_URL` ontbreekt of is ongeldig, bevat credentials, of `EXPECTED_REVISION` is geen volledige SHA. Er is geen request gedaan. |
| `Academy and Proof ready` faalt | `/game/health` is niet 200, `ok` is niet `true`, of de Proof-sidecar is onbereikbaar (`proof` is niet `true`). |
| `reports no revision (null)` | Het proces kent zijn revisie niet. Zet `SOURCE_REVISION` in de runtime-omgeving. |
| `revision mismatch` | Er draait een andere commit dan verwacht. De deploy is niet doorgekomen of er is teruggerold. |
| `Application HTML available` faalt | De root-build (`dist/index.html`) ontbreekt of de gateway serveert iets anders. |
| `Public runtime config` faalt | `/game/config` geeft geen 200 of mist de booleans `googleSso`, `portal` en `portalLaunch`. |
| `rejects missing/invalid credentials` faalt | Een beveiligde route antwoordt zonder geldige sessie met iets anders dan 401 of 403. Behandel dit als securityprobleem. |

Een `http://`-doel mag, omdat de smoke alleen een bewust ongeldige bearer-token verstuurt.

## SSO-probe

```sh
SMOKE_SSO=1 SMOKE_BASE_URL=<origin> EXPECTED_REVISION=<sha> node scripts/deployed-smoke.mjs
```

De probe vraagt `/auth/google/start` op en volgt de redirect niet. Er wordt nooit ingelogd.
Staat SSO aan, dan bewaart de server een login-state die na 10 minuten verloopt.
Optionele variabelen:
`SMOKE_PUBLIC_URL` (workflow-input `public_url`) is de publieke origin waarop de callback hoort, standaard `SMOKE_BASE_URL`. Zet hem na de domeincutover als je via het IP-adres smoket.
`EXPECTED_GOOGLE_CLIENT_ID` vergelijkt de client-id exact. Zonder deze variabele wordt alleen de vorm `<nummer>-<id>.apps.googleusercontent.com` gecontroleerd.

| Uitkomst | Betekenis |
|---|---|
| `PASS` | 302 naar `https://accounts.google.com`, met client-id, `redirect_uri=<publieke origin>/auth/google/callback`, `response_type=code`, scope met `openid email`, `state`, `nonce`, PKCE `S256` en een `academy-login`-cookie. |
| `NOT CONFIGURED` (exit `2`) | `/game/config` meldt `googleSso=false` en de start redirect naar `/?login_error=disabled`. Zet `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` en `ACADEMY_FACILITATOR_DOMAINS` op de server; alle drie of geen. |
| `broken: ... login_error=verify` | SSO staat aan, maar Google-discovery faalde vanaf de server. Controleer uitgaand netwerk. |
| `broken: redirect_uri ...` | `ACADEMY_PUBLIC_URL` op de server wijkt af van de verwachte publieke origin. Google weigert dan de callback. |
| `broken: /game/config googleSso=...` | Config en startroute spreken elkaar tegen. Waarschijnlijk draaien instanties met verschillende omgeving. |
| Overige `broken:` | De redirect mist een verplicht onderdeel. De melding noemt welke. |

Productie gaf op 25 september 2026 `NOT CONFIGURED: Facilitator Google login start: not configured: /game/config googleSso=false and /auth/google/start redirects to /?login_error=disabled`.

## Curriculumdagen 1–7

```sh
node scripts/deployed-curriculum.mjs http://91.99.78.17:4317
```

Het curriculum telt zeven dagen: Classroom 1 en 2 (`/classroom/1`, `/classroom/2`) en Workshop 3 tot en met 7 (`/workshop/3` … `/workshop/7`).
De gateway geeft op elk `/classroom/*`- en `/workshop/*`-pad dezelfde apps/web-shell terug, ook op `/workshop/9`. Een 200 bewijst dus niets.
De probe haalt daarom de module-scripts en modulepreload-chunks uit de shell op en telt een dag alleen als geserveerd als die het routepad als letterlijke string bevatten.
Productie gaf op 25 september 2026 `PASS` voor alle zeven dagen.

| Melding | Betekenis |
|---|---|
| `OPEN curriculum_day_N_...: not yet available` (exit `2`) | De uitgerolde bundle kent die route niet. De dag is niet gebouwd of niet gedeployed. |
| `FAIL ... HTTP 503: apps/web not built` | De server mist `apps/web/dist`. De deploy heeft de workspace-build overgeslagen. |
| `FAIL ... did not return the apps/web shell` | Het pad geeft geen HTML met `id="root"` en een module-script. |
| `FAIL ... bundle ... HTTP <code>` | De shell verwijst naar een asset die de server niet levert. |

Beperking: een route die dynamisch wordt opgebouwd (bijvoorbeeld `` `/workshop/${n}` ``) of alleen in een niet-voorgeladen lazy chunk staat, meldt deze probe als `OPEN`. Dat is bewust fail-closed; pas dan de probe aan.

## Leercheck

```sh
ACADEMY_URL=https://<origin> ACADEMY_HOST_KEY=<operator-secret> EXPECTED_REVISION=<sha> node scripts/deployed-learning-check.mjs
```

Vereist HTTPS en de facilitator-sleutel uit de operatorkluis. Plak de sleutel nooit in een prompt, issue of logbestand.
De check maakt een synthetische squad met vier deelnemers, doorloopt de vijf supportdagen van de room-API (`/game/day-pack`, dag 1 tot en met 5) en logt de tokens daarna uit.
Hij draait ook de curriculumprobe hierboven voor de zeven dagen.
Bewijs staat in `test-results/deployed-learning/deployed-learning-check.json`.
Productie is nu alleen via HTTP bereikbaar, dus deze check kan daar pas draaien na de domein- en TLS-cutover.

De supportdagen (1–5, room-API) en de curriculumdagen (1–7, deckroutes) zijn verschillende nummeringen. `day_N_...` in de uitvoer zijn supportdagen; `curriculum_day_N_...` zijn curriculumdagen.

| Melding | Betekenis |
|---|---|
| `revision_begin` faalt | Revisie ontbreekt of wijkt af. De check stopt direct. |
| `setup_synthetic_squad` faalt | Host-key onjuist of squad aanmaken werkt niet. De check stopt direct. |
| `day_N_control_and_pack` faalt | Het dagpakket ontbreekt, heeft een andere vorm of lekt quizantwoorden. |
| `day_N_participant_progress` / `host_review_handoff` faalt | Route, reflectie, bewijs, review of overdracht wordt niet opgeslagen. |
| `fresh_progress_and_debrief` faalt | Voortgang over vijf dagen of de debrief-export klopt niet. |
| `participant_debrief_forbidden` faalt | Een deelnemer kan de facilitator-debrief lezen. Behandel dit als securityprobleem. |
| `starter_*` faalt | Een starterbestand is niet te downloaden. |
| `revision_end` faalt | Er is tijdens de check een andere revisie uitgerold. Herhaal de check. |

## Lokale tests

```sh
pnpm run test:legacy
pnpm run typecheck && pnpm run test
```

`tests/deployed-smoke.test.mjs` test de smoke, de SSO-probe en de curriculumprobe tegen opgenomen productieresponses in `tests/fixtures/deployed/`.
Elke fixture noemt URL, ophaaltijd, grootte en SHA-256 van de volledige respons. De bundle is mechanisch ingekort tot de regels rond de routepaden.
De configured-SSO-fixture komt uit `server/google-sso.mjs` met een fictieve client-id en de live Google-discovery, omdat productie geen SSO heeft.
Neem de fixtures opnieuw op met `node tests/fixtures/deployed/record.mjs [origin]`. Dat script doet alleen anonieme GETs.

## Historisch rapport (13 september 2026)

### Functionele controles

Zes geslaagde Node-tests: squadgrootte en één driver; onafhankelijke timer/rol/fase; privé-diagnostiek en persistente gescheiden credentials; minimum vier deelnemers; echte HTTP/stdio MCP-integratie; twee onafhankelijke Proof Yjs-clients met gelijktijdige wijzigingen en reconnect. De startertest is eveneens geslaagd.

De integratietest controleert roomisolatie, geweigerde onbevoegde bediening, vijf echte MCP-tools, curriculumzoekresultaten, idempotent bewijs als echt Proof-commentaar, een wachtend voorstel zonder tekstwijziging, menselijke acceptatie, review/handoff en intrekking van de oude token. De Yjs-test verifieert samengevoegde tekst via de echte Proof-server en weigering van een buitenlandse room-WebSocket.

App en Proof bouwen succesvol. De Proof-bundel geeft een waarschuwing over bundelgrootte en een genegeerde use-client directive in web-haptics. Dat blokkeert de lokale pilot niet; optimalisatie is niet uitgevoerd.

### Browser en ontwerp

In de in-app browser zijn deelnemen, echte Proof-tekstbewerking/undo, kenniszoeken, privé-quizresultaat, navigatie en terugkeer naar hetzelfde opgeslagen document bekeken. Desktop: 1536×1024. Mobiel: 390×844, documentbreedte 390 zonder horizontale pagina-overflow. De smalle navigatiebalk kan bewust horizontaal scrollen. Proof toont zijn echte opslagstatus; testleden zonder actieve sessie worden offline weergegeven.

De geaccepteerde ontwerpafbeelding en gerenderde screenshots zijn rechtstreeks met view_image naast elkaar beoordeeld. Dit is een vergelijking van merk, hiërarchie en bruikbaarheid, geen claim van pixelidentieke reproductie.

| Onderdeel | Uitkomst |
|---|---|
| Donker/licht merkpalet | Donkere inkttinten en lichte vlakken behouden; cyaan/violet accenten toegepast. |
| Zijbalk en hoofdhiërarchie | Academy-branding, route/squad/coach/kennis-navigatie en centrale werkruimte behouden. |
| SDLC-fasen | Zichtbare fasebalk, los van driverrotatie en rondetimer. |
| Squadwerkruimte | Centrale documentruimte en rechter roster/rondekolom sluiten aan op het concept. |
| Typografie en ruimte | Heldere koppen, secundaire metadata en rustige paneelafstand beoordeeld op desktop. |
| Doorlopend document | Bewuste functionele afwijking: één echte Proof-editor vervangt losse voorbeeldkaarten. |
| Coach | Bewuste afwijking: echte eigen-Claude MCP-instructies en bronzoeken vervangen fictieve chat. |
| Status en personen | Werkelijke timer, opslagstatus en testleden; initialen in plaats van voorbeeldportretten. |
| Mobiel | Kolommen stapelen; roster volgt op het document. |

Copyverschillen zijn bewust: Nederlandse uitvoerbare instructies, eerlijke verbindingsstatus en concrete missie vervangen voorbeeldcopy. Enkele ingebedde native Proof-labels blijven Engels. Tijdens serverherstarts en iframe-navigatie zijn disconnectmeldingen waargenomen; het document herstelde en toonde opgeslagen status. Er is geen claim dat de volledige upstream console foutvrij is.

Screenshots staan naast de repository in `../screenshots/`: squad-dark.png, squad-light.png, coach-light.png en squad-mobile.png.

### Nog door mensen te valideren

Twee echte Claude Code-accounts op twee computers zijn niet beschikbaar gesteld en dus niet getest. De concrete acceptatietest staat in README.md. Ook volledige curriculumdekking, SSO, internetdeployment, productiebelasting en Liveblocks behoren niet tot de gerealiseerde lokale pilot. De menselijke driverrol beperkt Proof-editorrechten niet. Er zijn geen modelantwoorden of bewijsresultaten gesimuleerd.

### Aanvulling na echte browserwalkthrough

Dit oorspronkelijke rapport is aangevuld door de [browserwalkthrough met demo](../../demo/VERIFICATION.md). Die ronde ontdekte een reproduceerbare Proof-rendererhang met reviewcommentaren plus een pending vervangingsvoorstel. De eerdere geslaagde checks betekenen daarom geen volledige huidige acceptatie. Remote HTTP-MCP en clipboardfallback zijn inmiddels geïmplementeerd; publieke deployment en twee eigen Claude-accounts zijn nog niet end-to-end geverifieerd.
