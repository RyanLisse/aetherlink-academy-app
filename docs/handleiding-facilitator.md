# Handleiding voor facilitators

Stap voor stap door AetherLink Academy als facilitator. Alle labels komen letterlijk uit de applicatie.

## Inloggen met Google

Als "Inloggen met Google" op het aanmeldscherm staat, meld je aan met je Google Workspace-account. Een account van een toegestaan domein opent automatisch je facilitatorwerkplek en toont "Ingelogd als" met je naam en e-mailadres. Gebruik "Uitloggen" om alleen de facilitator-login te beëindigen. De facilitator-startsleutel hieronder blijft beschikbaar als break-glass fallback als Google-login niet is geconfigureerd of tijdelijk niet werkt.

## Voorbereiding

1. Open de gedeployde applicatie in een browser.
   Gebruik het Hetzner-adres http://91.99.78.17:4317 (of https://academy.aetherlink.ai zodra de domeincutover live is).
2. Vraag de startsleutel uit de serveromgeving alleen op als je de break-glass fallback nodig hebt.
   De waarde staat lokaal in `.data/host-key` of in de serveromgeving.
   Print of deel de waarde nooit.
3. Gebruik Node 24 en pnpm als je de applicatie lokaal beheert.
   Dit is achtergrondinformatie voor de serveromgeving, niet voor deelnemers.

## Squad aanmaken en de code delen

1. Kies op het aanmeldscherm "Ik ben facilitator".
   De knop opent de weergave "Inloggen als facilitator".
2. Ben je niet met Google ingelogd, vul dan de fallback in bij "Facilitator-startsleutel".
   De placeholder is "Lokale startsleutel".
3. Klik op "Inloggen".
   Je komt in je facilitatorwerkplek met je squads en cohorten.
4. Vul de squadnaam in bij "Squadnaam" in de kaart "Start een squad".
   De placeholder is "Squad Orion".
5. Klik op "Maak squad".
   Je komt in "Squad-room" terecht.
6. Controleer de lege roster.
   Je ziet "Jouw squad (0/12)" en "Wacht op je squad. Deel de kamercode om te beginnen.".
7. Deel de code met je squad.
   In het blok "Kamercode" staat de code met de knop "Kopieer kamercode".
   Gebruik daarnaast "Kopieer uitnodigingslink" om een link te delen die de code alvast invult.
8. Bewaak de groepsgrootte.
   Een squad heeft vier of vijf mensen.
   Bij twaalf leden verschijnt "Squad is vol (maximaal 12).". Soft default blijft ~4–5; de praktijk start vanaf 4.
9. Controleer de roster.
   Alle squadleden zijn gelijkwaardige deelnemers.

## Meerdere squads en facilitatoren

1. Kies op het aanmeldscherm "Ik ben facilitator" en log in.
   Deze weergave gebruikt je Google-login of vraagt om de facilitator-startsleutel als fallback.
2. Klik op "Inloggen".
   Je ziet alle aangemaakte squads, hun kamercode, ronde, timer, roster en bewijsstatus.
3. Kies bij de gewenste squad "Open als facilitator".
   Je komt in die "Squad-room" terecht zonder de bestaande facilitator-sessie te vervangen.
4. Gebruik voor extra begeleiding een eigen toegestane Google-login of dezelfde facilitator-startsleutel als fallback.
   Meerdere facilitatoren kunnen aan dezelfde squad attachen.

## Ronde starten, pauzeren en volgende fase

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
8. Start de volgende ronde met "Volgende ronde".
   Alleen deze actie gaat naar de volgende ronde.
9. Controleer de timer bij afloop.
   De timer start nooit automatisch een nieuwe ronde.
10. Pas de resterende tijd aan bij "Tijd (min)".
    De waarde wordt opgeslagen wanneer je het veld verlaat of Enter gebruikt.
11. Gebruik "+5 min" of "-5 min" voor een snelle aanpassing.
12. Stel de standaardduur van nieuwe rondes in bij "Rondetijd (min)".
    Een volgende ronde gebruikt deze rondetijd.

## Bewijs reviewen, handoff afronden

1. Open "Review & overdracht".
   Je ziet "Menselijke review · reproduceerbare overdracht" en "Alles klaar voor overdracht?".
2. Open "Bewijsmateriaal ({n})".
   Een nieuw item heeft de status "Nog te beoordelen".
3. Controleer de bevinding, het commando, de waargenomen uitvoer en de beperking.
   Een beoordeeld item toont "Menselijk beoordeeld" of "Aanvullen".
4. Vul de review in.
   Gebruik "Jouw controle en besluit" en de selectie "Beoordeling".
5. Kies "Voldoende onderbouwd" of "Meer bewijs nodig".
   Klik daarna op "Bewaar review".
6. Vul de drie overdrachtvelden in.
   Gebruik "Wat is besloten?", "Wat is getest of gereproduceerd?" en "Wat staat nog open?".
7. Klik op "Overdracht vastleggen".
   De applicatie toont "Overdracht vastgelegd.".

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

## Lessen maken en als Classroom tonen (Slide decks)

Wave-1 les-authoring loopt via Effect Slide decks en MCP — niet via Google Classroom-overlay.
Facilitator Google-SSO-login hierboven blijft ongewijzigd; die is geen teaching-pad.

1. Maak of bewerk lessen in "Slide decks".
   Open in de sidebar "Slide decks" (`/game/decks…`).
   Maak een nieuw deck, bewerk slides in de UI, of laat Claude Code hetzelfde doen via de MCP-tools `list_decks`, `get_deck`, `create_deck`, `add_slide`, `update_slide`, `patch_deck` en `export_deck_html` (zie [SLIDES.md](SLIDES.md) en de privé-instructie uit "Agent-setup").
2. Pin het deck als Classroom-overlay voor de kamerdag.
   Open het deck en kies als facilitator "Pin als Classroom" (volledige knop: "Pin dit deck als Classroom-overlay voor dag {day}").
   De applicatie toont: "Gepind als Classroom-overlay voor dag {day}. Open Classroom toont dit Effect-deck in plaats van het statische /classroom- of /workshop-pakket.".
3. Open Classroom om te lesgeven.
   Klik op "Classroom-modus openen".
   Met een pin toont de overlay de Effect present-view van dat deck (`/game/decks/:id/present`), niet het statische Jessy/Cons- of workshop-pakket.
4. Maak de pin los wanneer je terug wilt naar het statische dagpakket.
   Kies "Classroom losmaken" ("Classroom-overlay voor deze dag losmaken").
   Zonder pin valt "Classroom-modus openen" terug op same-origin `/classroom/{n}` (dag 1–2) of `/workshop/{n}` (dag 3–7) — de Jessy/Cons- en workshop-packs.
5. Behandel de Google Classroom-overlay als deprecated.
   Documenteer of gebruik geen Google iframe en geen `CLASSROOM_DECK_ID` als teaching-pad.
   Effect decks in de UI + MCP (`server/slides`) zijn de les-authoring source of truth.
   Importeer BuilderIO `templates/slides` niet opnieuw als runtime.
6. Laat Cons de content-SoT voor statische `/classroom/{n}` tot een dag in-app is hergeschreven.
   Pins promoten niet naar statische `/classroom`-routes.
   Een dag blijft Cons/Jessy tot die dag opnieuw is geautoriseerd in Effect decks én PRODUCT-ACCEPT die inhoud vrijgeeft.

## Problemen oplossen

1. Controleer de naam als een deelnemer niet kan aanmelden.
   Een naam die al in de kamer staat, wordt geweigerd met "Deze naam is al in gebruik in deze kamer.". Een naam is geen inlogmiddel.
   Een deelnemer komt terug op de eigen seat via de persoonlijke toegangslink uit de roster ("Kopieer mijn link").
   Deelnemers die vóór deze wijziging zijn aangemeld hebben nog geen link. Zolang ze aangemeld zijn, kunnen ze er een kopiëren.
   Is een deelnemer zonder link de sessie kwijt, laat hem dan met een herkenbare andere naam opnieuw deelnemen. De voortgang van de oude seat blijft zichtbaar in het facilitatoroverzicht.
2. Controleer de groepsgrootte.
   Bij twaalf leden staat er "Squad is vol (maximaal 12).".
3. Controleer de code.
   Bij een ongeldige code staat er "Kamercode niet gevonden.".
4. Controleer de intent-link.
   Onder "Onze intent" zie je de ingestelde link of "Nog geen intent-link". Zet of wijzig hem met "Link wijzigen".
5. Laat de deelnemer de verbinding herstellen.
   De applicatie pollt de roomstatus elke twee seconden en hervat de sessie bij het laden.
6. Gebruik één deelnemer per browserprofiel.
   Alle tabbladen in een profiel delen dezelfde sessiecookie.
7. Laat de deelnemer opnieuw aanmelden na het wissen van `sessionStorage`.
   Op een ander apparaat of in een andere browser is de persoonlijke toegangslink nodig.

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
