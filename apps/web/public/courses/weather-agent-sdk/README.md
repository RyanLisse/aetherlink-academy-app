# Weather agent example

This project uses saved weather data to make a clothing choice. It also shows
how an optional Claude Agent SDK call could get weather data from a tool.

## Prerequisites

- Node.js 24 LTS, which includes npm.
- Git.
- A terminal. Use Terminal on macOS or Linux, or PowerShell on Windows.

## 1. Get the project and install its packages

```text
git clone https://github.com/RyanLisse/weather-agent-sdk.git
cd weather-agent-sdk
npm install
```

Expected output includes:

```text
found 0 vulnerabilities
```

### Check your work

`npm install` finishes without an error. This project does not use a `.env`
file. The SDK reads `ANTHROPIC_API_KEY` from the terminal environment.

## 2. Run the tests

```text
npm test
```

Expected output:

```text
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

### Check your work

All six tests pass. They use saved weather data and do not call a model.

## 3. Run the sample

```text
npm start
```

Expected output includes:

```text
"decision": "bring umbrella"
(Tip) Set ANTHROPIC_API_KEY to exercise the Claude Agent SDK query path.
```

### Check your work

The command prints the weather, the decision, and clothing advice. It
does not need an API key.

## 4. Change the clothing advice

Open Claude Code in this repository. Paste this prompt:

```text
Read README.md section 4, instructions.md, src/quest-clothing.ts, and the weather tests. Ask me to type one fictional weather case. Change only the clothing-advice sentence under "Mini-quest hook" in instructions.md so the advice is short and useful for my case. Do not add a tool or edit runtime code. Show the diff. Ask me to judge whether the sentence fits my case. Then run npm run quest:clothing and npm test. Explain that the quest only checks for clothing words and always runs the Amsterdam fixture for 2026-09-21; it does not execute my case or prove the prose changed fixture output. Stop after I review the sentence and both command results.
```

Type your own fictional weather case when Claude Code asks. Review the diff
before you accept the sentence. Claude Code then runs:

```text
npm run quest:clothing
npm test
```

Expected output includes:

```text
instructions hook: clothing advice present
quest clothing line: lichte jas of trui; paraplu mee
ℹ pass 6
ℹ fail 0
```

The quest checks only that `instructions.md` contains clothing words. It then
runs the fixed Amsterdam fixture for 2026-09-21. The deterministic clothing
line comes from `src/decide.ts`, not from your edited prose. Your own case is
design input that you judge yourself; the quest does not execute it.

### Check your work

The quest succeeds and all six tests pass. Your own case, your manual judgment,
the reviewed diff, and the two command results are visible. Stop before the
optional live path.

## 5. Try the live SDK path (optional)

The live path needs an Anthropic API key. Set it in the terminal where you will
run the command. The key stays in that terminal session and never goes in a
file.

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

With a valid key, the command prints the fixture result and starts the Claude
Agent SDK query. The live response changes between runs. No live output is
shown here because this walkthrough did not use an API key.

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
| `instructions.md` | The editable clothing advice. |
| `src/tools/get_weather.ts` | The weather tool and its fixture. |
| `src/decide.ts` | The weather decision and clothing advice. |
| `src/agent.ts` | The fixture runner and optional SDK query. |
| `course/` | The interactive HTML lessons. |

## License

MIT
