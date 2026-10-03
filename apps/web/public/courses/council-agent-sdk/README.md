# Council agent example

This project runs four sample answers, then uses a judge rule to combine them.
You will edit that rule and see how the scores change.

## Prerequisites

- Node.js 24 LTS, which includes npm.
- Git.
- A terminal. Use Terminal on macOS or Linux, or PowerShell on Windows.

## 1. Get the project and install its packages

```text
git clone https://github.com/RyanLisse/council-agent-sdk.git
cd council-agent-sdk
npm install
```

Expected output includes:

```text
found 0 vulnerabilities
```

### Check your work

`npm install` finishes without an error. The project does not use a `.env`
file. The SDK reads `ANTHROPIC_API_KEY` from the terminal environment.

## 2. Run the tests

```text
npm test
```

Expected output:

```text
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
```

### Check your work

All seven tests pass. They use fixed sample text and do not call a model.

## 3. Run the sample

```text
npm start
```

Expected output includes:

```text
  "judge": {
    "answer": "Samenvatting: Moeten we een paraplu meenemen in Amsterdam? — concrete stappen: 1) check bron 2) beslis.",
    "agreement": {
      "alpha": 0.85,
      "bravo": 0.3,
      "charlie": 0.85,
      "delta": 0.85
    },
    "notes": "judge-rule:strict-vague"
  }
}

(Tip) Set ANTHROPIC_API_KEY to exercise the live Claude Agent SDK path.
```

### Check your work

The command prints four member answers and a summary. It does not need
an API key.

## 4. Change the judge rule

Open `instructions.md`. In the `Judge rule` section, replace
`Wees strenger bij vage claims.` with `Wees mild; vague wording is fine.`.
Do not edit the member instructions above it.

Run the quest and tests:

```text
npm run quest:judge
npm test
```

Expected output includes:

```text
judge notes: judge-rule:default
agreement: { alpha: 0.85, bravo: 0.5, charlie: 0.85, delta: 0.85 }
answer: Samenvatting: Is remote-first altijd beter voor startups? — concrete stappen: 1) check bron 2) beslis.
quest ok — edit only the judge rule in instructions.md and re-run.
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
```

### Check your work

The quest reports `judge-rule:default`. All seven tests pass. The test uses
sample rules and does not overwrite your edit.

## 5. Try the live SDK path (optional)

The live path needs an Anthropic API key. Set it in the terminal where you
will run the command. The key stays in that terminal session and never goes in
a file.

macOS or Linux:

```text
export ANTHROPIC_API_KEY=...
npm start
```

Windows PowerShell:

```text
$env:ANTHROPIC_API_KEY = "..."
npm start
```

Windows Command Prompt:

```text
set ANTHROPIC_API_KEY=...
npm start
```

### Check your work

With a valid key, the command starts the Claude Agent SDK query. The live
response changes between runs. No live output is shown because this
walkthrough did not use an API key.

## 6. Open or rebuild the course

Double-click `course/index.html` in your file explorer.

macOS:

```text
open course/index.html
```

Linux:

```text
xdg-open course/index.html
```

Windows PowerShell:

```text
Start-Process .\course\index.html
```

Windows Command Prompt:

```text
start "" course\index.html
```

After you edit a course module, rebuild and check the saved page:

```text
npm run course:build
npm run course:check
```

Expected output:

```text
Built course/index.html — open it in your browser.
course/index.html is up to date.
```

### Check your work

The build command writes `course/index.html`. The check command confirms that
the saved page matches its source files.

## Files

| Path | What it contains |
| --- | --- |
| `instructions.md` | The member directions and editable judge rule. |
| `src/council.ts` | Sample answers, scoring, and the judge. |
| `src/schemas.ts` | Member and judge data types. |
| `src/agent.ts` | The sample runner and optional SDK query. |
| `course/` | The interactive HTML lessons. |

## License

MIT
