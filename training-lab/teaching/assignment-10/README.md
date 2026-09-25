# Assignment 10 · Connected context (mock MCP)

Wave-2 teaching pack rewrite of Assignment 10 so the day runs **outside Worldline**.

## Primary path — training-lab mocks

1. From the repo root (Node 24 + pnpm 11.19.0):

   ```sh
   pnpm install --frozen-lockfile && pnpm --filter training-lab start:mocks
   ```

2. Copy [`mcp.json`](mcp.json) into your Claude Code MCP config (participant-owned; no secrets).

| Server | URL |
| --- | --- |
| `training-jira` | `http://127.0.0.1:48136/mcp` |
| `training-gitlab` | `http://127.0.0.1:48137/mcp` |
| `training-confluence` | `http://127.0.0.1:48138/mcp` |

3. In Claude Code run `/mcp`, confirm the three training servers, then retrieve **one** item read-only (`list_issues` / `get_issue`, `list_merge_requests` / `get_merge_request`, or `search_pages` / `get_page`).

Known mock keys: Jira `TRAIN-101` / `TRAIN-102`, GitLab IID `7` / `8`, Confluence `PAGE-201`.

## Plan-B — local fixtures

If MCP cannot connect, explain one file under [`fixtures/`](fixtures/) instead (`jira-EX-142.json`, `jira-TRAIN-101.json`, `gitlab-MR-7.json`, or `confluence-PAGE-201.json`). Teaching point (retrieve → explain → do not modify) survives without a live round-trip.

## Attribution

- Classroom deck / curriculum: `jyse/aetherlink-classroom-slides` branch `cons/cursus-aanpassingen` @ `0c194f6fc38481290922b878ac5a7d31ca795c8d`
- `CURRICULUM.md` **decision 3** confirmed real Worldline MCP as the original primary path; this wave-2 pack keeps that decision's **local-fixture safety net** and makes **training-lab mocks** the primary path for fictional delivery outside Worldline (AET-41).

## Verify on a clean machine

```sh
# from repo root, Node 24
node training-lab/teaching/assignment-10/scripts/verify-mcp.mjs
```

Writes tool listing + `get_issue` / `get_merge_request` / `get_page` receipts under `teaching/assignment-10/evidence/`.
Optional: `AET41_EVIDENCE_DIR=/path node …` to redirect artifacts (used for Linear evidence).
