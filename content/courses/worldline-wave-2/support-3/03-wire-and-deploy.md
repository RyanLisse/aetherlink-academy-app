---
lesson: wire-and-deploy
day: support-3
course: worldline-wave-2
mode: solo
durationMinutes: 45
title:
  en: Wire AI logic and deploy
  nl: AI-logica verbinden en deployen
lede:
  en: Connect input → AI → business logic → alert draft, then publish one container URL.
  nl: Verbind input → AI → business logic → alert draft, en publiceer één container-URL.
---

## Slide: Wire AI → logic → alert draft

```yaml
kicker: Concept
type: concept
layout: steps
title: Wire AI → logic → alert draft
steps:
  - "Input — GET /transactions from day-03 mock-api"
  - "AI stub — analyzeWithAi scores anomaly (fictional cohort)"
  - "Business logic — amount ≥ 9000 EUR → high severity"
  - "Alert draft — draft_only + human_approval_required"
expected: "No auto-send. Human gate stays closed."
```

> notes:
> EN: The AI is intentionally a stub — pedagogy is the boundary, not model quality.
> NL: De AI is bewust een stub — pedagogie is de grens, niet modelkwaliteit.

## Slide: Deploy your container

```yaml
kicker: Concept
type: concept
layout: steps
title: Deploy your container
steps:
  - "Read starter/DEPLOY.md"
  - "docker compose -p trainee-$USER up -d --build"
  - "Note http://<host>:<PARTICIPANT_PORT>/alert?id=TX-FIC-302"
  - "Teardown is an infra comment — not your homework to invent"
```

> notes:
> EN: Operator owns namespace + teardown script (domain/infra ticket). Content only documents the recipe.
> NL: Operator bezit namespace + teardown-script (domain/infra-ticket). Content documenteert alleen het recept.

## Slide: Practice — publish one URL

```yaml
kicker: Practice
type: practice
layout: exercise
title: Deploy and curl one alert
timer: 20
assignment:
  title:
    en: Container URL + one alert
    nl: Container-URL + één alert
  timer: 20
  starterPath: day-03/starter
  steps:
    - en: "Follow DEPLOY.md (compose or node serve)"
      nl: "Volg DEPLOY.md (compose of node serve)"
    - en: "curl the /alert?id=TX-FIC-302 URL"
      nl: "curl de /alert?id=TX-FIC-302 URL"
    - en: "Save URL + JSON body as evidence"
      nl: "Bewaar URL + JSON-body als bewijs"
  expected: "Reachable URL returning alert true for TX-FIC-302"
  check: "Evidence includes URL and one alert draft JSON"
  hints:
    - en: "Laptop path without Docker: node transaction-alert.mjs serve on PORT=8080"
      nl: "Laptop zonder Docker: node transaction-alert.mjs serve op PORT=8080"
```

> notes:
> EN: Accept node serve evidence if Docker is unavailable on the training seat.
> NL: Accepteer node serve-bewijs als Docker ontbreekt op de trainingsplek.
