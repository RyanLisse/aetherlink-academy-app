# Facilitator notes — Agent Arcade

**Linear:** LIS-64  
**Cohort shape:** dual captions (Mensentaal / Tech), Scrimba-achtig: coach → run → checkpoint  
**Primary language coach scripts:** Nederlands (Mensentaal); Tech captions EN/NL-mix OK  

## Prep (D-1)

1. Lees `modules/arcade-manifest.json` + L1/L2 modules.
2. Dry-run L1: weather fixture `pnpm dev` (TUI, **geen creds**).
3. Dry-run L2: `pnpm install` → `eve link` → `pnpm dev` (gateway nodig).
4. Check Eve account / seat plan voor cohort — **blocker** als niet geregeld.
5. Print of pin fallback: demo-stream L2 als link faalt.
6. Badge-kanaal klaar: screenshot upload of session link (Academy existing proof path).
7. Bevestig: dit lab vervangt **niet** Day 1–5 packs — aparte `/arcade*` routes.

## Eve needs

| Item | L1 Weather | L2 Council |
|------|------------|------------|
| Creds for local TUI | Nee | Nee voor pure UI-shell; **ja** via `eve link` / AI Gateway voor live models |
| Network | Ja | Ja |
| Node/pnpm | Ja | Ja |
| Vercel link | Nee | Ja (`eve link`) |

Secrets blijven in lokale env / facilitator vault — **nooit** in git, Slack, of lesmateriaal.

## Timing (indicatief, geen KPI)

| Blok | Tijd |
|------|------|
| Intro Agent Arcade + captions toggle | 5 min |
| L1 Weather | 40–50 min |
| Pauze | 5–10 min |
| L2 Council | 40–50 min |
| SDK bridge (mapping / watch) | 20–40 min |
| Badge + debrief | 10 min |

Stretch alleen als cohort voorloopt. Tech die Eve sneller af heeft → mapping table vroeger.

## Caption cues

- Start elke stap met **Mensentaal** hardop; wijs Tech-toggle aan voor developers.
- Checkpoint hardop: “Klaar als je X kunt aanwijzen.”
- Verboden: lange monologen. Max ~30–60s coach per stap, dan playground.
- Poteto: kort, concreet, één verandering per mini-quest.

## Badge proof

**Badge:** “first agent”

Accept:
- Session link (Eve/Academy), of
- Screenshot van TUI/UI met zichtbare instruction-effect (L1 clothing of L2 judge delta)

Facilitator checkt: gedrag veranderd door **hun** edit, niet alleen default run.

Tech SDK badge apart — pas na LIS-65 starters.

## Fallbacks

| Fail | Actie |
|------|-------|
| L1 TUI start niet | Facilitator deelt screen; deelnemers editen `instructions.md` in editor en plakken diff in chat/squad doc |
| L2 `eve link` / gateway down | Pre-recorded council run + live edit van judge-instruction op gedeelde repo copy |
| Geen Eve seat | Watch-mode; content + checkpoints als quiz; lab later inhalen |
| Academy `/arcade` nog niet live | Run vanuit dit handoff-pakket + Eve URLs; Herdr wiring volgt (LIS-60) |
| SDK starters PENDING | Non-tech skip; tech mapping-only; markeer partial |

## Do / Don't

**Do:** één zin wijzigen, run, observeer.  
**Do:** dual captions.  
**Don't:** secrets plakken.  
**Don't:** Day packs vervangen.  
**Don't:** metrics verzinnen (“97% agreement”) — alleen UI-waarden voorlezen.

## BYO Claude (MCP)

Connect your Claude — coach already knows where you are. Platform chat stays FAQ/nav only.
