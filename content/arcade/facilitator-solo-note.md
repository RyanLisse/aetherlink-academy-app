# Facilitator note — Arcade solo (aetherlab)

**Linear:** AET-68 · parent AET-65  
**Audience:** facilitators running Agent Arcade cohorts

## One sentence

**Solo** = Scrimba-style timeline in the browser (replay, pause, fork-edit, checkpoint). **Live Eve / Claude Agent SDK** = deep-link or run-local — not embedded with secrets.

## How to use in a room

1. Hub → **Start solo** (`/arcade/solo?lesson=ws-1-eve-weather`) for self-paced Eve weather.
2. Weather / Council / SDK-bridge pages each offer matching solo lessons (see LESSON-ID-CONTRACT.md).
3. At a checkpoint, invite learners to fork the editor, then **Reset** before continuing the timeline.
4. Optional live run: open Eve template or clone `weather-agent-sdk` / `council-agent-sdk` — credentials stay in their own env, never in Arcade pages.

## Caption modes

Arcade chrome keeps **Mensentaal | Tech**. Solo player captions follow lesson `say` ops; do not expect a second pedagogy stack.

## What solo is not (v1)

- Not a hosted Eve iframe
- Not multiplayer editing
- Not a replacement for Day 1–5 workshop packs
- Not Catapulze / Robbie content

## Proof for Done

Learner finishes `ws-1-eve-weather` without you at the keyboard; Hetzner URL returns 200; screenshot on AET-69.
