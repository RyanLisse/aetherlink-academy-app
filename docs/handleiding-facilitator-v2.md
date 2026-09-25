# Handleiding voor facilitators (v2)

Deze versie vult [handleiding-facilitator.md](handleiding-facilitator.md) aan met de guardrails en ontwerpbeslissingen die uit Notion komen.
Notion levert die context één keer aan. Daarna is de Academy de bron en worden wijzigingen hier gedaan, niet in Notion.

## Guardrails en ontwerpbeslissingen

Elke guardrail hieronder staat onder de Notion-pagina waar hij vandaan komt, met de pagina-URL en het moment waarop de export is opgehaald.
Er staan hier geen guardrails die niet in de Notion-export stonden.
Tot de echte export is geïmporteerd, blijft deze sectie leeg.

<!-- notion-import:guardrails:start -->
_Nog niet geïmporteerd. Deze sectie wordt gevuld door de eenmalige Notion-import._
<!-- notion-import:guardrails:end -->

## Hoe deze sectie gevuld wordt

De import leest een geautoriseerde Notion-export (Markdown & CSV) van schijf en maakt nooit verbinding met Notion.

1. Exporteer de Notion-werkruimte als "Markdown & CSV" en pak de export uit.
2. Zet naast de geëxporteerde pagina's een bestand `notion-export.json` met het tijdstip van de export:
   `{"retrievedAt": "2026-10-01T09:00:00Z"}`.
3. Bekijk eerst wat er zou veranderen:
   `pnpm --filter @academy/server import notion <export-map> --dry-run`.
4. Voer de import uit tegen de database van de cursus:
   `DATABASE_URL=… pnpm --filter @academy/server import notion <export-map> --course <cursus-id>`.
5. Draai stap 4 nog een keer. De uitvoer moet `"changes": 0` tonen.

Welke Notion-pagina waarheen gaat, volgt uit de paginatitel:

| Notion-pagina | Doel in de Academy |
| --- | --- |
| `Draaiboek Dag N` (tabel met `Start`, `Eind`, `Onderdeel`) | dagplanning van dag N (`day.schedule`) |
| `Checklist Dag N` (to-do's `- [ ]`) | checklist van dag N (`day.checklist`) |
| `Kahoot…` database (CSV, met kolommen `Dag` en eventueel `Les`) | quizvragen als concept (`quiz_question`), niet zichtbaar voor deelnemers tot publicatie |
| `Guardrails…` of `Ontwerpbeslissingen…` (opsommingstekens) | de sectie hierboven |

Geïmporteerde tekst is onbetrouwbaar.
Verborgen HTML, HTML-commentaar en onzichtbare tekens worden verwijderd.
Regels die een AI-assistent proberen te sturen ("negeer alle eerdere instructies", "system prompt", "je bent nu …") worden in hun geheel weggelaten en in de uitvoer van de import vermeld.
De exacte regel staat in `apps/server/src/notion/sanitize.ts`.

Een dag, checklist of quizvraag die in de Academy al andere inhoud heeft, wordt niet overschreven.
De import meldt die als overgeslagen.
