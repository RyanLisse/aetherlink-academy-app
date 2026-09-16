# Handleiding voor facilitators

Stap voor stap door AetherLink Academy als facilitator. Alle labels komen letterlijk uit de applicatie.

## Inloggen met Google

Als "Inloggen met Google" op het aanmeldscherm staat, meld je aan met je Google Workspace-account. Een account van een toegestaan domein opent automatisch "Start een squad" en toont "Ingelogd als" met je naam en e-mailadres. Gebruik "Uitloggen" om alleen de facilitator-login te beëindigen. De facilitator-startsleutel hieronder blijft beschikbaar als break-glass fallback als Google-login niet is geconfigureerd of tijdelijk niet werkt.

## Voorbereiding

1. Open de gedeployde applicatie in een browser.
   Gebruik bijvoorbeeld https://aetherlink-academy-app.vercel.app.
2. Vraag de startsleutel uit de serveromgeving alleen op als je de break-glass fallback nodig hebt.
   De waarde staat lokaal in `.data/host-key` of in de serveromgeving.
   Print of deel de waarde nooit.
3. Gebruik Node 24 en pnpm als je de applicatie lokaal beheert.
   Dit is achtergrondinformatie voor de serveromgeving, niet voor deelnemers.

## Squad aanmaken en de code delen

1. Kies op het aanmeldscherm "Ik ben facilitator".
   De knop opent de weergave "Start een squad".
2. Vul de squadnaam in bij "Squadnaam".
   De placeholder is "Squad Orion".
3. Ben je niet met Google ingelogd, vul dan de fallback in bij "Facilitator-startsleutel".
   De placeholder is "Lokale startsleutel". Voor een ingelogde facilitator is dit veld verborgen.
4. Klik op "Maak squad".
   Je komt in "Squad-room" terecht.
5. Controleer de lege roster.
   Je ziet "Jouw squad (0/12)" en "Wacht op je squad. Deel de kamercode om te beginnen.".
6. Deel de code met je squad.
   In het blok "Kamercode" staat de code met de knop "Kopieer kamercode".
   Gebruik daarnaast "Kopieer uitnodigingslink" om een link te delen die de code alvast invult.
7. Bewaak de groepsgrootte.
   Een squad heeft vier of vijf mensen.
   Bij twaalf leden verschijnt "Squad is vol (maximaal 12).". Soft default blijft ~4–5; de praktijk start vanaf 4.
8. Controleer de rolverdeling.
   De applicatie heeft op elk moment precies één "Driver".

## Meerdere squads en facilitatoren

1. Kies op het aanmeldscherm "Facilitator-overzicht".
   Deze weergave gebruikt je Google-login of vraagt om de facilitator-startsleutel als fallback.
2. Vul zo nodig de startsleutel in en klik op "Toon overzicht".
   Je ziet alle aangemaakte squads, hun kamercode, ronde, timer, roster en bewijsstatus.
3. Kies bij de gewenste squad "Open als facilitator".
   Je komt in die "Squad-room" terecht zonder de bestaande facilitator-sessie te vervangen.
4. Gebruik voor extra begeleiding een eigen toegestane Google-login of dezelfde facilitator-startsleutel als fallback.
   Meerdere facilitatoren kunnen aan dezelfde squad attachen.

## Ronde starten, pauzeren, volgende fase en driver roteren

1. Open het paneel "Facilitator".
   Je ziet de knoppen "Start timer" en "Volgende ronde".
2. Start de ronde met "Start timer".
   Tijdens de ronde verandert de knop in "Pauzeren".
3. Pauzeer de ronde met "Pauzeren".
   De ronde toont dan de gepauzeerde toestand.
4. Kies de fase bij "Fase".
   De opties zijn "Plan", "Design", "Build", "Test", "Deploy" en "Maintain".
5. Kies de supportdag bij "Dag".
   De opties zijn 1, 2, 3, 4 en 5.
6. Kies de werkvorm bij "Werkvorm".
   De opties zijn "Les", "Solo", "Squad" en "Review".
7. Wacht met starten of doorgaan tot minimaal vier deelnemers zijn aangesloten.
   Anders toont de applicatie "Wacht op minimaal 4 deelnemers.".
8. Roteer de Driver met "Volgende ronde", of schud Driver/Navigator met "Rollen schudden" / "Shuffle roles".
   Alleen deze actie roteert de driver.
9. Controleer de timer bij afloop.
   De timer roteert de driver nooit automatisch.
10. Pas de resterende tijd aan bij "Tijd (min)".
    De waarde wordt opgeslagen wanneer je het veld verlaat of Enter gebruikt.
11. Gebruik "+5 min" of "-5 min" voor een snelle aanpassing.
12. Stel de standaardduur van nieuwe rondes in bij "Rondetijd (min)".
    Een volgende ronde gebruikt deze rondetijd.

## Suggesties en bewijs reviewen, handoff afronden

1. Open "Review & overdracht".
   Je ziet "Menselijke review · reproduceerbare overdracht" en "Alles klaar voor overdracht?".
2. Controleer "Documentvoorstellen".
   Zonder voorstellen staat er "Nog geen voorstellen. Je Claude Code kan via MCP een onderbouwde wijziging voorstellen.".
3. Beoordeel een open voorstel.
   Controleer de huidige tekst en de voorgestelde vervanging.
4. Accepteer of wijs het voorstel af.
   Klik op "Accepteer in document" of "Wijs af".
5. Open "Bewijsmateriaal ({n})".
   Een nieuw item heeft de status "Nog te beoordelen".
6. Controleer de bevinding, het commando, de waargenomen uitvoer en de beperking.
   Een beoordeeld item toont "Menselijk beoordeeld" of "Aanvullen".
7. Vul de review in.
   Gebruik "Jouw controle en besluit" en de selectie "Beoordeling".
8. Kies "Voldoende onderbouwd" of "Meer bewijs nodig".
   Klik daarna op "Bewaar review".
9. Vul de drie overdrachtvelden in.
   Gebruik "Wat is besloten?", "Wat is getest of gereproduceerd?" en "Wat staat nog open?".
10. Klik op "Overdracht vastleggen".
    De applicatie toont "Overdracht in Proof vastgelegd. De facilitator roteert de driver apart.".

## De zeven sessies

1. Plan eerst de twee klassikale sessies.
   De route vermeldt: "Vooraf: 2 klassikale sessies over agentproductiviteit en het aanpassen van je werkwijze.".
   Deze sessies hebben geen eigen scherm in de applicatie.
2. Kies voor de vijf supportdagen de juiste waarde bij "Dag".
   De opties zijn 1, 2, 3, 4 en 5.
3. Gebruik "Werkvorm" voor de actuele vorm.
   De opties zijn "Les", "Solo", "Squad" en "Review".
4. Open "Mijn route" om de vijf dagen te tonen.
   De titel is "Vijf dagen. Echte voortgang.".
5. Gebruik dag 1 als "Samen starten".
   De tag is "Begeleid" en de beschrijving is "Gedeelde intent, grenzen en één kleine volgende stap.".
6. Gebruik dag 2 als "Dieper begrijpen".
   De tag is "Begeleid" en de beschrijving is "Van plan naar controle, review en een verse-lezer-overdracht.".
7. Gebruik dag 3 als "Samen bouwen".
   De tag is "Coaching" en de beschrijving is "Een begrensde agenttaak, toegestane tools en menselijke evaluatie.".
8. Gebruik dag 4 als "Zelf aanpakken".
   De tag is "Hints" en de beschrijving is "Een reproduceerbare Claude Code-werkwijze met instructies en gerichte tools.".
9. Gebruik dag 5 als "Zelfstandig toepassen".
   De tag is "Zelfstandig" en de beschrijving is "Een gewijzigde taak aanpakken en je bewijs verantwoorden.".
10. Beschrijf geen extra in-app curriculum voor de klassikale sessies.
    Nog niet beschikbaar in deze versie.
11. Beschrijf geen volledige n8n- of transfermissies als bestaande functionaliteit.
    Nog niet beschikbaar in deze versie.

## Problemen oplossen

1. Controleer de naam als een deelnemer niet kan aanmelden.
   Bij dezelfde naam + kamercode herstelt soft rejoin de bestaande seat (geen blanco seat, geen foutmelding over dubbele naam).
2. Controleer de groepsgrootte.
   Bij twaalf leden staat er "Squad is vol (maximaal 12).".
3. Controleer de code.
   Bij een ongeldige code staat er "Kamercode niet gevonden.".
4. Controleer de Proof-status.
   Bij een laadprobleem staat er "Proof kon niet laden".
   Bij een verbroken documentverbinding staat er "Proof offline · controleer je verbinding".
5. Laat de deelnemer de verbinding herstellen.
   De applicatie pollt de roomstatus elke twee seconden en hervat de sessie bij het laden.
6. Gebruik één deelnemer per browserprofiel.
   Het Proof-iframe deelt de sessiecookie binnen één profiel.
7. Laat de deelnemer opnieuw aanmelden na het wissen van `sessionStorage`.
   Op een ander apparaat of in een andere browser zijn opnieuw de naam en "Kamercode" nodig.

## Wat je nooit doet

1. Deel de "Facilitator-startsleutel" nooit.
   Bewaar de startsleutel uit de serveromgeving privé.
2. Deel geen persoonlijke gametoken of MCP-token in chat.
   Zet tokens ook nooit in screenshots.
3. Houd credentials uit elk gedeeld kanaal.
   Gebruik voor deelnemers alleen de code uit "Kamercode".

## Bronverwijzing

src/main.jsx
src/panels.jsx
server/app.mjs
server/mcp-tools.mjs
server/store.mjs
README.md
