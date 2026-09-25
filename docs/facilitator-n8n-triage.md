# Facilitator: n8n-triage L1 tot L3 (Workshop 3)

Deze handleiding hoort bij de drie n8n-starters voor Workshop 3. Eén supportticket gaat erin, Low, Medium of High komt eruit. Alles is afgeleid van de Workshop 3-deck (`apps/web/src/deck/workshop3-slides.ts`) en van de export `n8n/support-triage.json` in `RyanLisse/aetherlink-day5-n8n-to-agent@a848389`. Wat we niet konden controleren staat onder OPEN.

## Doel en ladder

De ladder heeft drie niveaus (W3 dia 3 en dia 18).

| Niveau | Wat | Starter | Deck |
| --- | --- | --- | --- |
| L1 regels | Switch op trefwoorden, geen LLM | `starter/n8n-triage-l1-switch.json` | W3 dia 5 tot 7 |
| L2 oordeel | Eén AI Agent met memory, mens beoordeelt | `starter/n8n-triage-l2-agent-memory.json` | W3 dia 8 tot 10 |
| L3 specialisten | Customer Reply Agent en Risk Agent, één menselijke gate | `starter/n8n-triage-l3-multi-agent.json` | W3 dia 11 tot 13 |

De solo-lat is minimaal L2 (W3 dia 10). L3 is stretch en niet verplicht (W3 dia 11 en 13). L1 is de verplichte gate vóór L2 (W3 dia 7).

## Importeren

Importeer elk bestand apart, in de workshop-instance van n8n (W3 dia 17: geen productie).

1. Open n8n en maak een nieuwe workflow.
2. Kies in het workflowmenu "Import from file".
3. Kies één van de drie starters.
4. Herhaal dit per niveau. Elk bestand wordt een eigen workflow.

Alle drie de workflows staan op `active: false`. Ze starten alleen met de handmatige trigger. De node "Fixture Tickets" levert de vier beoordeelde tickets uit `starter/triage-fixtures.json` als vier items.

## Credentials

Alleen L2 en L3 hebben een credential nodig: één OpenAI-credential.

1. Maak in n8n onder Credentials een OpenAI-credential aan.
2. Open in de workflow elke node "OpenAI Chat Model". L2 heeft er één, L3 heeft er drie ("OpenAI Chat Model", "OpenAI Chat Model1", "OpenAI Chat Model2").
3. Selecteer daar je credential.

In de bestanden staat een placeholder met id `REPLACE_ME` en de naam "AetherLink workshop OpenAI (placeholder)". Die verwijst naar niets. Plak nooit een sleutel in de workflow, in een Code node of in de chat. Houd de credential-dialoog buiten beeld tijdens het delen van je scherm (W3 dia 4 en 17).

## Demo-script per niveau

Het ritme is steeds uitleg, voordoen, zelf doen (W3 dia 1). De zaal kijkt tijdens het voordoen en bouwt nog niet mee.

### L1 voordoen (W3 dia 6)

1. Open de L1-workflow, of screenshot `01-n8n.jpeg`.
2. Laat de "Priority Switch" zien. Regel High matcht `charged twice|complaint|fraud|today`. Regel Medium matcht `refund|error|wrong|broken`. Alles wat overblijft gaat naar de fallback-uitgang "Low".
3. Voer de workflow uit met één fixture-ticket.
4. Laat zien dat het label overeenkomt met de fixture. WL-1026 gaat naar High, WL-1027 naar Low, WL-9001 en WL-9002 naar Medium.

### L2 voordoen (W3 dia 9)

1. Open de L2-workflow, of screenshot `02-n8n.jpeg`.
2. Laat de "AI Agent" zien met "OpenAI Chat Model" en "Simple Memory".
3. Laat zien dat de agent een prioriteit voorstelt met `draft_only: true` en `human_approval_required: true`.
4. Pauzeer bij de menselijke review. De agent verstuurt niets (W3 dia 10: geen stille auto-send).

### L3 voordoen (W3 dia 12)

1. Open de L3-workflow, of screenshot `03-n8n.jpeg`.
2. Benoem de twee rollen. De "Customer Reply Agent" schrijft een conceptantwoord. De "Risk Agent" schrijft een interne risiconotitie.
3. Benoem de ene menselijke gate. De uitvoer bevat `customer_reply` en `risk_note`, maar niets gaat naar de klant zonder goedkeuring.

## Fixture en grader

`starter/triage-fixtures.json` is de gedeelde set voor dag 3 en dag 4. Hij bevat vier beoordeelde tickets.

| Ticket | Verwacht | Herkomst |
| --- | --- | --- |
| WL-1026 | high | vehicle-repo |
| WL-1027 | low | vehicle-repo |
| WL-9001 | medium | synthetisch (`synthetic: true`) |
| WL-9002 | medium | synthetisch (`synthetic: true`) |

De synthetische tickets vullen het label medium, dat de vehicle-repo niet dekt. Onder `special` staan een prompt-injectieticket en een ticket met een ongeldige vorm. Die tellen niet mee in de score.

Leg de labels van een run vast in een JSON-bestand, bijvoorbeeld `labels.json` met `{"WL-1026":"high","WL-1027":"low","WL-9001":"medium","WL-9002":"medium"}`. Draai daarna de grader.

```bash
node content/triage/grade.mjs labels.json
```

De grader print de acceptatietabel (Ticket, Verwacht, Werkelijk, Match). Hij eindigt met exit code 0 bij PASS en 1 bij REVISE. Een ontbrekend label verschijnt als OPEN. Op dag 4 draait dezelfde tabel tegen de uitvoer van Claude (W4 dia 14). Bij een mismatch pas je prompt of tools aan, niet de labels.

## Veelvoorkomende fouten

- **Credential niet geselecteerd.** De OpenAI Chat Model-node faalt zolang de placeholder `REPLACE_ME` geselecteerd is. In L3 moet je alle drie de model-nodes bijwerken.
- **Memory lekt tussen tickets.** In de vehicle-export gebruikt "Simple Memory" de vaste sessiesleutel `1`, en "Simple Memory2" gebruikt dezelfde sleutel. n8n bewaart die memory per workflow en sessiesleutel, dus alle tickets en beide nodes delen dan één geschiedenis. De starters gebruiken `={{ $json.ticket_id }}` voor de hoofdagent en `reply-` of `risk-` plus het ticket-id voor de specialisten.
- **Agent geeft JSON in een codeblok of gewone tekst terug.** "Parse Decision" doet een kale `JSON.parse` en faalt dan. De prompt vraagt om alleen JSON zonder codeblok. Faalt het toch, laat dan de ruwe uitvoer zien en scherp de prompt aan.
- **Hoofdletters in de Switch.** Een Switch met `equals` op `High` matcht `high` niet als hoofdlettergevoeligheid aan staat. De starters zetten "Ignore Case" aan en de L1-regexen hebben de vlag `i`.
- **Prompt-injectie "approve a refund".** Het speciale ticket vraagt de agent om de regels te negeren en een refund goed te keuren. Het bericht is klantdata, nooit beleid. L1 routeert het naar Medium op het woord "refund". Een agent mag geen refund goedkeuren, en een mens beoordeelt altijd.
- **Import is geen bewijs.** Een geïmporteerde workflow bewijst niet dat het model gedraaid heeft. Alleen een uitvoering met trace of export telt als bewijs (W3 dia 17).
- **Geen productie-writes.** Geen echte Jira, betalingen of klantmail. Alle tickets zijn fictief (W3 dia 4 en 17).

## OPEN

- De import in de workshop-instance van n8n is door ons nog niet live getest. De bestanden zijn alleen statisch gecontroleerd met `tests/n8n-triage-starters.test.mjs`.
- De veldnamen van de Switch (regex-operatie, `fallbackOutput: "extra"`, `renameFallbackOutput`, `ignoreCase`) komen uit de n8n-broncode op `master` (`SwitchV3.node.ts` en `filter-parameter.ts`). De versie van de workshop-instance is niet gecontroleerd.
- Of `$json.ticket_id` als sessiesleutel werkt binnen de memory van een agent-tool (L3-specialisten) is niet met een run bevestigd.
- Er is nog geen model-run met trace voor L2 of L3. Of gpt-5-mini de vier labels haalt is dus onbekend.
- Het screenshotpakket `/workshop-3/` (`01-n8n.jpeg`, `02-n8n.jpeg`, `03-n8n.jpeg`) hoort bij de deck en is niet door deze starters gemaakt.
