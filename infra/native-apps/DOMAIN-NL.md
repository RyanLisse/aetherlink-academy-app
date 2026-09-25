# Academy-domein koppelen via GoDaddy en OpenShip

Gecontroleerd op 21 september 2026: GoDaddy beheert de DNS via
ns73/ns74.domaincontrol.com. `academy.aetherlink.ai` heeft nog geen A-record.

## Wat Ryan invult

GoDaddy → Domain Portfolio → aetherlink.ai → DNS → Record toevoegen:

| Veld | Waarde |
| --- | --- |
| Type | A |
| Naam | academy |
| Waarde | 91.99.78.17 |
| TTL | 1 uur |

Laat @, www, MX en mailgerelateerde TXT-records intact. Voeg geen AAAA toe
zonder bevestigd IPv6-hostadres. Gebruik geen URL-forwarding.

Dit regelt alleen DNS. HTTPS en de app-koppeling worden op de server ingesteld.

## Operatorstappen na DNS

1. Controleer `dig +short academy.aetherlink.ai A`: verwacht `91.99.78.17`.
2. Koppel de hostname aan de bedoelde Academy-runtime met de bestaande OpenShip
   edge. Gebruik custom-domain preview om eventueel vereiste verificatierecords
   te bepalen, daarna DNS-verificatie en certificaatuitgifte. Poorten 80/443 zijn
   al van OpenShip; installeer geen tweede proxy.
3. De bestaande productie draait als `academy-app` op poort 4317. De authoring-PoC
   is een apart OpenShip-project. Ryan heeft OpenShip als toekomstige hoofdversie
   bevestigd. Routeer het productiedomein daarheen na de volledige datamigratie en
   acceptatie in AET-34; faseer de oude runtime daarna uit. Voor de PoC kan afzonderlijk `academy-poc` als A-record
   naar hetzelfde IP worden toegevoegd en aan `proj_M7RZZpVKd31QLlL6` worden gekoppeld.
4. Stel voor de gekozen app `ACADEMY_PUBLIC_URL=https://academy.aetherlink.ai` in.
   Voor de huidige productiecode is de Google OAuth redirect exact
   `https://academy.aetherlink.ai/auth/google/callback` (server/google-sso.mjs).
   Voeg die toe aan de bestaande Google OAuth-client; behoud oude callbacks tijdens
   de overgang. De agent-native apps hebben eigen authconfiguratie/callbacks.
5. Verifieer HTTPS zonder certificaatwaarschuwingen, facilitator-login,
   sessie/cookies, WebSocket/SSE en een echte lesflow. Productiehealth:
   `/game/health`; de aparte nieuwe Academy-PoC gebruikt `/health`.
6. Verifieer certificaatvernieuwing en documenteer rollback. Een DNS-record alleen
   betekent niet dat domeincutover of SSO is geaccepteerd.

## Bronnen

- https://www.godaddy.com/help/add-or-edit-an-a-record-42546
- https://openship.io/docs/guides/custom-domains
- https://openship.io/docs/api/domains

Linear: AET-42. Er is in deze taak nog geen DNS- of productiecutover uitgevoerd.
