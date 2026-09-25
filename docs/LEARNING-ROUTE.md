# Zeven dagen

De route volgt de vastgezette dagvolgorde uit het lesplan: twee klasdagen en vijf workshopdagen. Het ritme is elke dag hetzelfde: de facilitator doet voor, de deelnemer werkt solo, legt Proof vast en een mens reviewt.

1. Classroom 1: AI, LLM en agents; Claude Code volgens Explore → Plan → Create → Test → Human review → Handoff.
2. Classroom 2: CLAUDE.md, skills, MCP en de kleinste nuttige teamworkflow. Die use-case is het vertrekpunt voor dag 6 en 7.
3. Workshop 3: ticket-triage in n8n op drie niveaus: L1 Switch, L2 AI Agent met memory, L3 Customer Reply + Risk. Solo minimaal L2.
4. Workshop 4: dezelfde triage met de Claude Agent SDK. Zelfde fixture-tickets en labels als dag 3.
5. Workshop 5: AI-native SDLC: intent → spec → plan → build → test → review → handoff met menselijke gates.
6. Workshop 6: eigen opdracht: intent, plan, eerste thin slice in n8n of Claude en een Proof-draft.
7. Workshop 7: polish, review, Proof final, vijf minuten presenteren en één 90-dagenstap.

## Dagpakketten

Elk pakket staat in `content/days/` en bevat een leerdoel, het facilitator-demoscript, solo-stappen, materiaal en naslag, Proof-acceptatie, drie quizvragen en open punten. Iedere demo-, solo- en quizverwijzing noemt de dia in de dagdeck. `pnpm lint:content:day-packs` controleert dat elke geciteerde dia nog dezelfde titel heeft.

Dag 3 en 4 worden beoordeeld op één fixture-set (`starter/triage-fixtures.json`). `node content/triage/grade.mjs labels.json` print de acceptatietabel en eindigt met exit code 0 bij PASS. Zie `docs/facilitator-n8n-triage.md`.

De facilitator kiest de dag en werkvorm. Quiz en hulpkeuze zijn per deelnemer per dag opgeslagen. Een quiz is een voorlopige hulpkeuze, geen certificaat. Bewijs, review en squad-overdracht worden apart vastgelegd; reflectie is zichtbaar voor de deelnemer en facilitator, niet voor andere deelnemers.

## Bron

Leerdoelen en dagvolgorde komen uit het lesplan (Linear, SoT). Demo, solo-stappen en acceptatie zijn afgeleid van de decks in `apps/web/src/deck/`. Wat het lesplan niet noemt, staat als OPEN in het pakket in plaats van verzonnen. De n8n-starters volgen de export in `RyanLisse/aetherlink-day5-n8n-to-agent`; synthetische tickets zijn gemarkeerd.

## Acceptatie

De content- en voortgangstests staan in CI. Browseracceptatie, een live import in de workshop-n8n-instantie en eigen Claude Code-accounts blijven afzonderlijke controles.
