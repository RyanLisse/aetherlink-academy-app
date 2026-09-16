# Deploymentstatus

De broncode is een WIP voor een aparte private Academy-repository en een apart Vercel-project. Een geslaagde build is nog geen geaccepteerde release. Actuele testresultaten staan in [PROGRESS.md](../PROGRESS.md).

## Runtime

Node 24 start de Academy-gateway en een echte Proof-server op een interne loopbackpoort. De runtime gebruikt Postgres voor squads, sessies, Proof-documenten, marks, Yjs-geschiedenis, leases, verzoekreserveringen en private HTML-snapshots. Redis verzorgt aanwezigheid en live communicatie tussen instanties. PostgreSQL-transacties blijven de duurzame autoriteit.

`DATABASE_URL` en een TLS-`REDIS_URL` (of `KV_URL`) moeten beschikbaar zijn. Beide bestaande diensten zijn live getest. De 1Password-mount kan om herauthenticatie vragen. De door de gebruiker aangeleverde, afgeschermde `.env` is een geautoriseerde lokale fallback. Geen secretwaarden horen in Git, buildcontext of bewijsbestanden.

Voor meerdere instanties zijn dezelfde `ACADEMY_HOST_KEY` en `PROOF_COLLAB_SIGNING_SECRET` nodig, ieder met minstens 32 tekens. Gebruik per omgeving aparte `ACADEMY_DATABASE_SCHEMA`, `PROOF_DATABASE_SCHEMA`, `ACADEMY_REDIS_PREFIX` en `PROOF_REDIS_PREFIX`. Stel `ACADEMY_PUBLIC_URL` in op de exacte HTTPS-origin voor cookies, MCP en WebSocket-URLs.

## Schemawijzigingen

Nieuwe Academy- en Proof-schemas krijgen binnen dezelfde opstarttransactie een versienummer en SHA-256-checksum van hun SQL-definitie. Een herstart met dezelfde definitie leest alleen deze marker; hij herhaalt geen DDL terwijl andere instanties schrijven. Dit is getest met een gelijktijdige writer-lock en echte procesherstart.

Een bestaand schema zonder marker of met een afwijkende checksum stopt met een expliciete migratiefout. Behandel dit als een geplande offline migratie: controleer de huidige structuur en data, maak een herstelbaar backupplan en pas een gereviewde migratie toe. Zet geen marker handmatig om de controle te passeren en verwijder geen bestaand schema als opstartworkaround. De huidige tests gebruiken uitsluitend hun eigen tijdelijke schemas.

## Containers

`Dockerfile` bouwt app plus Proof. Voor lokaal Compose-gebruik:

```sh
docker compose up --build -d
docker compose logs academy
docker compose down
```

Compose leest de private `.env`, bindt alleen de gateway op `127.0.0.1:4317` en bewaart lokale ontwikkelsleutels in `academy-data`. Document- en squadgegevens staan extern in Postgres. `down -v` verwijdert de lokale sleutels en hoort niet bij normale cleanup.

`Dockerfile.vercel` gebruikt een tijdelijke werkmap zonder volume, `ACADEMY_STORAGE=postgres`, een niet-rootgebruiker en `tini`. Alleen de gateway ontvangt publiek verkeer; Proof blijft op loopback. Vercel detecteert `Dockerfile.vercel` en bouwt de container op het platform. Zie [de officiële containerdocumentatie](https://vercel.com/docs/functions/container-images).

De startcode valideert de productieconfiguratie vóór opslag of subprocessen worden geopend. Vercel vereist Postgres, TLS-Redis, gedeelde host- en signing-geheimen van minimaal 32 tekens en een canonieke HTTPS-origin. Native acceptatie, afwijzing, herladen en procesherstart zijn lokaal bewezen; echte containerbuild en publieke acceptatie blijven aparte releasegates.

## Vercel en CI/CD

Gebruik uitsluitend de persoonlijke scope `ryan-lisses-projects` (`team_ouqYH7cF2UfVWN6dDhryMSEM`, Hobby). Laat het bestaande `aetherlink-game-lab` intact. Een nieuw Academy-project is nog niet geverifieerd.

De aparte CI/CD-taak bezit workflows, echte containerbuild, buildidentiteit, eerste deployment, deployed smokechecks en rollback. De implementatietaak bezit de appcode, opslagmigratie en integratietests. Deel concrete commits; vermijd gelijktijdige releases en forcepushes. De gebruiker heeft de CI/CD-taak inmiddels expliciet gemachtigd een nieuwe repository te maken en naar Vercel te deployen. Die taak publiceert uitsluitend de benodigde appcode/configuratie; interne documenten en secrets blijven lokaal. Een lokale commit is geen gepubliceerde release.

Docker CLI en daemon ontbreken op de lokale implementatiemachine. Lokale statische Dockerfilechecks bewijzen geen image-build. De CI/CD-taak moet die build werkelijk uitvoeren.

WebSocket-verbindingen kunnen bij het einde van een functie opnieuw verbinden met een andere instantie. De app moet daarom gedeelde toestand teruglezen en opnieuw autoriseren. Zie [de officiële WebSocket-documentatie](https://vercel.com/docs/functions/websockets).

## Vereiste releasebewijzen

- Twee echte Academy/Proof-processen, gelijktijdige edits en gedeelde Redis-communicatie.
- Procesuitval, reconnect, duurzame inhoud en ingetrokken toegang over instanties.
- Menselijk accepteren en afwijzen in de echte browser na de opslagmigratie.
- Echte containerbuild met bekende bron-SHA en correcte runtimegeheimen.
- Publieke HTTPS, WSS en remote MCP inclusief mutaties en tokenbegrenzing.
- Deelnemer- en facilitatorflows, privéquiz, solo-evidence en kennisbank op de gedeployde versie.
- Twee echte Claude Code-accounts als expliciete gebruikersacceptatie; protocolclients vervangen dat bewijs niet.

Nieuwe betaalde diensten zijn niet nodig voor de huidige implementatiestappen en zijn niet aangekocht.


## Google facilitator SSO (ops)

Vereist samen: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ACADEMY_FACILITATOR_DOMAINS`, plus exacte `ACADEMY_PUBLIC_URL` origin (geen pad) die overeenkomt met de Google redirect-URI `${ACADEMY_PUBLIC_URL}/auth/google/callback`.

Bij falende login logt de callback altijd:

```text
[academy] Google-login mislukt { code, reason, message }
```

Voor `login_error=verify` lees `reason` (bijv. `aud` = client-id mismatch). Voor `login_error=session` is de JWT ok maar faalde `facilitator_sessions` insert/cleanup — controleer Postgres (`expires_at` is epoch-milliseconds bigint, niet `timestamptz`; vergelijk met `$1` ms, niet `now()`). De facilitator-startsleutel (`ACADEMY_HOST_KEY`) blijft het noodpad tot SSO live bewezen is.

Live Vercel Hobby kan `402 DEPLOYMENT_DISABLED` geven; code-fix en specs gaan wel door zonder production mutate.
