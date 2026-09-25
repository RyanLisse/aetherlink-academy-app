# Sub-agents (compare slide)

Main weather agent delegates fictional support work to three specialists.
Roles are pedagogical — no live tickets.

| Folder | Role |
| --- | --- |
| `data-analyst/` | Summarise weather fixture + ticket fields |
| `tester/` | Re-run shared acceptance expectations |
| `report-generator/` | Draft human-review report (never auto-send) |

Wire these as Agent SDK sub-agents / handoffs in the solo extend lesson.
