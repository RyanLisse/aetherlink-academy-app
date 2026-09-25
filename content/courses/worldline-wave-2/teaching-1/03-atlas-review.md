---
lesson: atlas-review
day: teaching-1
course: worldline-wave-2
mode: solo
durationMinutes: 25
title:
  en: Solo — Atlas repository review
  nl: Solo — Atlas repository-review
lede:
  en: Investigate the fictional Atlas starter. Deliver one reproducible mismatch plus a bounded improvement proposal.
  nl: Onderzoek de fictieve Atlas-starter. Lever één reproduceerbare afwijking plus een begrensd verbetervoorstel.
source:
  repo: jyse/aetherlink-classroom-slides
  branch: cons/cursus-aanpassingen
  commit: 0c194f6fc38481290922b878ac5a7d31ca795c8d
  path: CURRICULUM.md decision 3 + server/content.mjs mission ATLAS-REVIEW-01
  note: Mission text adapted from content.mjs; starter copied under training-lab/teaching (AET-7 tip packs untouched).
---

## Slide: Mission contract

```yaml
kicker: Concept
type: concept
layout: cards
title: ATLAS-REVIEW-01
cards:
  - title: Goal
    body: One reproducible mismatch between onboarding instructions and the project, plus a bounded proposal
  - title: Allowed
    body: Read starter files · run node --test in your copy · submit evidence for human accept
  - title: Stop
    body: Missing files, secrets, or access outside the starter — report what is missing; do not invent output
```

> notes:
> EN: Mission id ATLAS-REVIEW-01 from content.mjs. Facilitator decides accept.
> NL: Missie-id ATLAS-REVIEW-01 uit content.mjs. Facilitator beslist over acceptatie.

## Slide: Practice — one reproducible finding

```yaml
kicker: Practice
type: practice
layout: exercise
title: Deliver one reproducible Atlas finding
timer: 25
assignment:
  title:
    en: Atlas review — one evidence-backed finding
    nl: Atlas-review — één evidence-based bevinding
  timer: 25
  starterPath: teaching/day-1/starter
  steps:
    - en: "Compare README.md with scripts in package.json"
      nl: "Vergelijk README.md met de scripts in package.json"
    - en: "Run the available test with node --test in your copy"
      nl: "Voer de beschikbare test uit met node --test in je kopie"
    - en: "Record file path, command actually run, literal output, and limitation"
      nl: "Noteer bestandspad, echt uitgevoerd commando, letterlijke uitvoer en beperking"
    - en: "Propose one bounded improvement; do not push or deploy"
      nl: "Stel één begrensde verbetering voor; push of deploy niet"
  expected: "Finding cites a concrete file; command+output present; human gate still open"
  check: "Path + command + observed output + limitation + next owner named"
  hints:
    - en: "A failed command is still evidence — record the real error"
      nl: "Een mislukt commando is ook bewijs — noteer de echte fout"
    - en: "Stretch: design a check that prevents README drift; say why the existing test misses it"
      nl: "Stretch: ontwerp een check die README-drift voorkomt; zeg waarom de bestaande test dit mist"
```

> notes:
> EN: Quiz from content.mjs day1Questions can be used verbally — bounded goal first; refuse unneeded Jira; strong handoff cites file/command/outcome.
> NL: Quiz uit content.mjs day1Questions kan mondeling — eerst begrensd doel; weiger onnodige Jira; sterke handoff noemt bestand/commando/uitkomst.
