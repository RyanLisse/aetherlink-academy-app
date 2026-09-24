# Workshop 5 diagrams

Source for every image in `apps/web/public/workshop-5/*-dark.png`. The keynote deck hides lists and
tables, so diagrams ship as 2048×1100 PNGs in one Academy-dark frame.

- `diagrams.html` — line vs loop, before/after agents, the arrowed loop, the day plan, the shifts table (`?d=<name>`)
- `visual.html` + `visuals.js` + `visuals.css` — the artifact drawings: intent, contract, plan, brief, agent, terminal, gate, loop (`?v=<name>`)

Edit the HTML, then re-render with headless Chrome (bash 4+):

```bash
tools/workshop-5-diagrams/render.sh          # all
tools/workshop-5-diagrams/render.sh shifts   # one
```

The shifts table and the bottleneck and loop diagrams are Academy-dark remakes after Anthropic's
*The AI-Native SDLC playbook* (Louis Claxton); keep the source line on the table.
