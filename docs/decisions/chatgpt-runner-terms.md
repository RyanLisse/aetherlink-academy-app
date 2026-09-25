# ChatGPT sign-in as a second chat runner

Status: decided, not built (AET-43). Retrieved 2026-09-25.

## Question

Can the Academy add "Sign in with ChatGPT" (the Codex ChatGPT-account login) as a second chat or agent runner provider in our self-hosted app, so a participant's ChatGPT subscription runs the work instead of an API key?

## Conclusion

**Unclear, and not allowed for the hosted shape.** We do not build it.

| Shape | Verdict |
| --- | --- |
| A. The Academy server holds participants' ChatGPT tokens and runs Codex or ChatGPT for them | Not allowed as far as the published terms go. Account credentials may not be shared or made available to anyone else, and OpenAI offers no third-party "Sign in with ChatGPT" program that would sanction it. |
| B. Each participant runs Codex locally with their own ChatGPT login, and the Academy drives it (for example through `codex exec` or MCP) | Unclear. OpenAI documents API keys for programmatic and CI/CD Codex use, and a non-interactive, subscription-backed access token only for ChatGPT Enterprise workspaces. No clause we could read forbids B on Plus, Pro or Team, but nothing supports it either. |
| C. An OpenAI API key, configured per participant or per cohort | Allowed. This is the documented path for automation. |

What this means for the product: the locked decision already routes deep help through the participant's own Claude over MCP, with no hosted tutor. Participants who prefer Codex can connect their own Codex session to `/mcp` interactively, which is ordinary use of their own account. A server-side ChatGPT runner stays out.

## Evidence

- [Codex authentication docs](https://learn.chatgpt.com/docs/auth) (the target of `developers.openai.com/codex` auth links), fetched 2026-09-25:
  - "Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs."
  - "Use an access token when automation needs ChatGPT workspace access, ChatGPT-managed Codex entitlements, or enterprise workspace controls without a browser sign-in." Enterprise admins grant members the right to create these tokens.
  - "Treat `~/.codex/auth.json` like a password: it contains access tokens."
- [OpenAI Terms of Use](https://openai.com/policies/row-terms-of-use/): "You may not share your account credentials or make your account available to anyone else and are responsible for all activities that occur under your account." The page returned HTTP 403 to direct fetches; the quote comes from a search-engine copy, so recheck it in a browser before relying on the wording.
- [OpenAI account sharing policy](https://help.openai.com/en/articles/10471989): "Your OpenAI account is meant for you—the individual who created it." Retrieved through a proxy after a direct 403. It addresses sharing with people and says nothing specific about server-mediated use.
- [openai/codex discussion #8338](https://github.com/openai/codex/discussions/8338): an OpenAI maintainer confirms the CLI is Apache-2.0 and forkable, declines to say whether third-party apps built on ChatGPT login comply with the terms, and points back to the Terms of Use.
- [TechCrunch, 2025-05-27](https://techcrunch.com/2025/05/27/openai-may-soon-let-you-sign-in-with-chatgpt-for-other-apps/): OpenAI was exploring "Sign in with ChatGPT" for third-party apps. We found no launched program or developer terms for it.

Not retrieved: the Usage Policies, Services Agreement and Business Terms pages all returned HTTP 403. A launched third-party sign-in program or an explicit clause in those pages would change this conclusion.

## Revisit when

- OpenAI publishes developer terms for "Sign in with ChatGPT" in third-party apps.
- A cohort runs on ChatGPT Enterprise and its admin issues Codex access tokens for this use. Shape B then becomes a documented path for that cohort.
