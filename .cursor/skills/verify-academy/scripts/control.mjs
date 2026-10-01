#!/usr/bin/env node
/**
 * Launch, doctor, drive, and stop a disposable AetherLink Academy verification instance.
 * Invoke from the repository root. Never kill by process name — only PIDs this script recorded.
 */
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { openSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(SKILL_DIR, "../../..");
const RUN_DIR = join(SKILL_DIR, ".run");
const ARTIFACTS_DIR = join(SKILL_DIR, "artifacts");
const PID_FILE = join(RUN_DIR, "pids.json");
const LOCAL_ORIGIN = "http://127.0.0.1:4317";
const READY_MS = 120_000;
const SERVICES_DIR =
  process.env.CI_SERVICES_DIR || join(RUN_DIR, "ci-services");

const usage = `Usage: node .cursor/skills/verify-academy/scripts/control.mjs <command> [args]

  launch                 Start CI Postgres/Redis (Docker), write .env, setup if needed, start Academy
  doctor                 Read-only health at /game/health
  stop                   Kill only PIDs recorded by launch; stop CI services if we started them
  drive <feature-id>     Browser-drive a mapped feature (facilitator-home | conceptsim-locale)
  http <url>             GET a URL and print status + body prefix
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targetMode = () =>
  String(process.env.ACADEMY_VERIFY_TARGET || "local").toLowerCase();

const origin = () => {
  if (targetMode() === "deployed") {
    const raw = process.env.ACADEMY_URL || "https://academy.91-99-78-17.sslip.io/";
    return new URL(raw).origin;
  }
  return LOCAL_ORIGIN;
};

const healthUrl = () => `${origin()}/game/health`;

const httpGet = async (url) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json,text/html,*/*" },
    redirect: "manual",
  });
  const body = await response.text();
  return { body, status: response.status, headers: response.headers };
};

const loadPids = () => {
  try {
    return JSON.parse(readFileSync(PID_FILE, "utf8"));
  } catch {
    return null;
  }
};

const pidAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitForHealth = async (label) => {
  const deadline = Date.now() + READY_MS;
  let last = "";
  while (Date.now() < deadline) {
    try {
      const result = await httpGet(healthUrl());
      last = `${result.status} ${result.body.slice(0, 120)}`;
      if (result.status === 200) {
        try {
          const json = JSON.parse(result.body);
          if (json.ok === true) return json;
        } catch {
          /* keep waiting */
        }
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await sleep(500);
  }
  throw new Error(`${label} not ready at ${healthUrl()} (${last})`);
};

const ensureRunDir = () => mkdirSync(RUN_DIR, { recursive: true, mode: 0o700 });

const writeEnvFile = (servicesEnvPath) => {
  const envPath = join(REPO_ROOT, ".env");
  if (existsSync(envPath) && !process.env.ACADEMY_VERIFY_FORCE_ENV) {
    console.log(`using existing ${envPath}`);
    return envPath;
  }
  const sourced = readFileSync(servicesEnvPath, "utf8");
  const picks = {};
  for (const line of sourced.split("\n")) {
    const m = line.match(/^export\s+([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith("'") && v.endsWith("'")) ||
      (v.startsWith('"') && v.endsWith('"'))
    ) {
      v = v.slice(1, -1);
    }
    // bash $'...' / printf %q may escape — strip simple backslash escapes
    v = v.replace(/\\(.)/g, "$1");
    picks[m[1]] = v;
  }
  const lines = [
    `DATABASE_URL=${picks.DATABASE_URL || ""}`,
    `REDIS_URL=${picks.REDIS_URL || ""}`,
    `NODE_EXTRA_CA_CERTS=${picks.NODE_EXTRA_CA_CERTS || ""}`,
    `ACADEMY_STORAGE=postgres`,
    `ACADEMY_PUBLIC_URL=${LOCAL_ORIGIN}`,
    `PORT=4317`,
    `PROOF_PORT=4400`,
    `HOST=127.0.0.1`,
  ];
  writeFileSync(envPath, lines.join("\n") + "\n", { mode: 0o600 });
  console.log(`wrote disposable ${envPath}`);
  return envPath;
};

const dockerAvailable = () => {
  const r = spawnSync("docker", ["info"], { stdio: "ignore" });
  return r.status === 0;
};

const startCiServices = () => {
  if (!dockerAvailable()) {
    throw new Error(
      "Docker is required for local launch (scripts/ci-services.sh). Set ACADEMY_VERIFY_TARGET=deployed or provide DATABASE_URL + REDIS_URL (rediss) yourself."
    );
  }
  mkdirSync(SERVICES_DIR, { recursive: true, mode: 0o755 });
  const r = spawnSync("bash", ["scripts/ci-services.sh", "start"], {
    cwd: REPO_ROOT,
    env: { ...process.env, CI_SERVICES_DIR: SERVICES_DIR },
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error("ci-services.sh start failed");
  return join(SERVICES_DIR, "env.sh");
};

const maybeSetup = () => {
  const marker = join(REPO_ROOT, "dist", "index.html");
  if (existsSync(marker) && !process.env.ACADEMY_VERIFY_FORCE_SETUP) {
    console.log("dist/ present — skipping setup.mjs (set ACADEMY_VERIFY_FORCE_SETUP=1 to rebuild)");
    return;
  }
  console.log("running node scripts/setup.mjs …");
  const r = spawnSync(process.execPath, ["scripts/setup.mjs"], {
    cwd: REPO_ROOT,
    env: process.env,
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error("scripts/setup.mjs failed");
};

const spawnAcademy = () => {
  ensureRunDir();
  const logPath = join(RUN_DIR, "academy.log");
  const logFd = openSync(logPath, "a");
  const child = spawn(
    process.execPath,
    ["--env-file=.env", "scripts/start.mjs"],
    {
      cwd: REPO_ROOT,
      detached: true,
      env: { ...process.env },
      stdio: ["ignore", logFd, logFd],
    }
  );
  child.unref();
  return { pid: child.pid, logPath };
};

const cmdLaunch = async () => {
  if (targetMode() === "deployed") {
    throw new Error(
      "launch is local-only. For soft-live set ACADEMY_VERIFY_TARGET=deployed and run doctor/drive."
    );
  }
  const existing = loadPids();
  if (existing?.academy && pidAlive(existing.academy)) {
    console.log(JSON.stringify({ ok: true, alreadyRunning: true, pid: existing.academy }));
    return;
  }
  // Refuse if port answers and we do not own it
  try {
    const probe = await httpGet(healthUrl());
    if (probe.status === 200 && !process.env.ACADEMY_VERIFY_ALLOW_SHARED) {
      throw new Error(
        `Port 4317 already healthy but pidfile is not ours. Refusing to double-drive. Set ACADEMY_VERIFY_ALLOW_SHARED=1 for read-only.`
      );
    }
  } catch (e) {
    if (e instanceof Error && /Refusing/.test(e.message)) throw e;
  }

  ensureRunDir();
  let ciServices = false;
  let servicesEnv = join(SERVICES_DIR, "env.sh");
  if (!process.env.DATABASE_URL || !(process.env.REDIS_URL || process.env.KV_URL)) {
    servicesEnv = startCiServices();
    ciServices = true;
    // Load into this process for setup/start children
    const body = readFileSync(servicesEnv, "utf8");
    for (const line of body.split("\n")) {
      const m = line.match(/^export\s+([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      let v = m[2];
      if (
        (v.startsWith("'") && v.endsWith("'")) ||
        (v.startsWith('"') && v.endsWith('"'))
      ) {
        v = v.slice(1, -1);
      }
      v = v.replace(/\\(.)/g, "$1");
      process.env[m[1]] = v;
    }
  } else {
    console.log("using caller-provided DATABASE_URL / REDIS_URL");
  }
  writeEnvFile(servicesEnv);
  maybeSetup();
  const { pid, logPath } = spawnAcademy();
  const meta = {
    academy: pid,
    startedAt: new Date().toISOString(),
    origin: LOCAL_ORIGIN,
    logPath,
    ciServices,
    servicesDir: ciServices ? SERVICES_DIR : null,
  };
  writeFileSync(PID_FILE, JSON.stringify(meta, null, 2) + "\n", { mode: 0o600 });
  const health = await waitForHealth("Academy");
  console.log(JSON.stringify({ ok: true, pid, health, logPath }, null, 2));
};

const cmdDoctor = async () => {
  const mode = targetMode();
  const url = healthUrl();
  let health;
  try {
    const result = await httpGet(url);
    health = { status: result.status, body: result.body };
    if (result.status !== 200) {
      console.log(JSON.stringify({ ok: false, mode, url, health }, null, 2));
      process.exitCode = 1;
      return;
    }
    const json = JSON.parse(result.body);
    const pids = loadPids();
    const owned = Boolean(pids?.academy && pidAlive(pids.academy));
    const shared =
      process.env.ACADEMY_VERIFY_ALLOW_SHARED === "1" || mode === "deployed";
    const ok = json.ok === true && (owned || shared || mode === "deployed");
    const out = {
      ok,
      mode,
      url,
      revision: json.revision ?? null,
      proof: json.proof ?? null,
      owned,
      shared,
    };
    console.log(JSON.stringify(out, null, 2));
    if (!ok) process.exitCode = 1;
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          mode,
          url,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
};

const cmdStop = async () => {
  if (targetMode() === "deployed") {
    console.log(JSON.stringify({ ok: true, skipped: "deployed target — not stopping" }));
    return;
  }
  if (process.env.ACADEMY_VERIFY_ALLOW_SHARED === "1") {
    console.log(JSON.stringify({ ok: true, skipped: "shared instance — not stopping" }));
    return;
  }
  const pids = loadPids();
  if (!pids?.academy) {
    console.log(JSON.stringify({ ok: true, skipped: "no pidfile" }));
    return;
  }
  const pid = pids.academy;
  if (pidAlive(pid)) {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        /* already gone */
      }
    }
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline && pidAlive(pid)) await sleep(250);
    if (pidAlive(pid)) {
      try {
        process.kill(-pid, "SIGKILL");
      } catch {
        try {
          process.kill(pid, "SIGKILL");
        } catch {
          /* */
        }
      }
    }
  }
  if (pids.ciServices && pids.servicesDir) {
    spawnSync("bash", ["scripts/ci-services.sh", "stop"], {
      cwd: REPO_ROOT,
      env: { ...process.env, CI_SERVICES_DIR: pids.servicesDir },
      stdio: "inherit",
    });
  }
  try {
    rmSync(PID_FILE);
  } catch {
    /* */
  }
  console.log(JSON.stringify({ ok: true, stopped: pid, artifactsRetained: ARTIFACTS_DIR }));
};

const readHostKey = () => {
  if (process.env.ACADEMY_HOST_KEY) return process.env.ACADEMY_HOST_KEY.trim();
  const path = join(REPO_ROOT, ".data", "host-key");
  if (!existsSync(path)) {
    throw new Error("No ACADEMY_HOST_KEY and .data/host-key missing — launch first");
  }
  return readFileSync(path, "utf8").trim();
};

const cmdDrive = async (featureId) => {
  if (!featureId) throw new Error("drive requires a feature-id");
  const require = createRequire(import.meta.url);
  let chromium;
  try {
    ({ chromium } = require(join(REPO_ROOT, "node_modules", "@playwright/test")));
  } catch {
    ({ chromium } = require("@playwright/test"));
  }

  const doctorProbe = await httpGet(healthUrl());
  if (doctorProbe.status !== 200) {
    throw new Error(`doctor failed before drive: ${doctorProbe.status}`);
  }

  const outDir = join(ARTIFACTS_DIR, featureId);
  mkdirSync(outDir, { recursive: true, mode: 0o755 });

  if (featureId === "facilitator-home") {
    const hostKey = readHostKey();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(45_000);
    await page.goto(origin() + "/", { waitUntil: "networkidle" });
    const nlToggle = page.getByRole("button", { name: "NL", exact: true });
    if (await nlToggle.count()) await nlToggle.click();
    await page.getByRole("radio", { name: /Ik ben facilitator|I am a facilitator/ }).check();
    await page.getByLabel(/^(Facilitator-startsleutel|Facilitator start key)$/).fill(hostKey);
    await page.getByRole("button", { name: /^(Inloggen|Sign in)$/ }).click();
    await page.getByLabel(/^(Squadnaam|Squad name)$/).fill("Verify Orion");

    const createResponsePromise = page.waitForResponse(
      (r) => {
        try {
          return (
            r.request().method() === "POST" &&
            new URL(r.url()).pathname.endsWith("/game/create")
          );
        } catch {
          return false;
        }
      },
      { timeout: 45_000 }
    );
    await page.getByRole("button", { name: /^(Maak squad|Create squad)$/ }).click();
    const createResponse = await createResponsePromise;
    const createBody = await createResponse.json();
    if (!createResponse.ok() || !createBody?.code) {
      throw new Error(`create failed: ${createResponse.status()} ${JSON.stringify(createBody)}`);
    }
    const squadCode = String(createBody.code);

    // Tip 5f645284+ lands facilitators on Facilitatorwerkplek (not legacy "Jouw squad (n/n)").
    await page.getByRole("heading", { level: 1, name: "Verify Orion" }).waitFor({
      timeout: 45_000,
    });
    const eyebrow = page.locator(".simple-eyebrow");
    await eyebrow.waitFor({ timeout: 15_000 });
    const eyebrowText = await eyebrow.innerText();
    if (!/Facilitatorwerkplek|Facilitator workspace/i.test(eyebrowText)) {
      throw new Error(`Expected facilitator workspace eyebrow, got: ${eyebrowText}`);
    }

    // Capture workshop landing before optional Participants nav.
    await page.screenshot({ path: join(outDir, "workshop-landing.png"), fullPage: true });

    // Optional second view: open More → Participants (does not fail the proof).
    try {
      const more = page.locator("details.simple-more summary");
      if (await more.count()) {
        await more.click();
        const participants = page.getByRole("button", { name: /Deelnemers|Participants/i });
        if (await participants.count()) await participants.click();
      }
    } catch {
      /* workspace landing + create code is sufficient proof */
    }

let ariaText = "";
    try {
      if (typeof page.locator("body").ariaSnapshot === "function") {
        ariaText = await page.locator("body").ariaSnapshot();
      } else {
        ariaText = await page.locator("body").innerText();
      }
    } catch {
      ariaText = await page.locator("body").innerText();
    }
    writeFileSync(join(outDir, "room.aria.txt"), ariaText);
    await page.screenshot({ path: join(outDir, "room.png"), fullPage: true });
    writeFileSync(
      join(outDir, "meta.json"),
      JSON.stringify(
        {
          featureId,
          origin: origin(),
          squadName: "Verify Orion",
          squadCodeRedacted: squadCode.slice(0, 2) + "***",
          squadCodeLength: squadCode.length,
          health: JSON.parse(doctorProbe.body),
          capturedAt: new Date().toISOString(),
        },
        null,
        2
      ) + "\n"
    );
    await browser.close();
    console.log(
      JSON.stringify(
        {
          ok: true,
          featureId,
          artifacts: outDir,
          squadCodeLength: squadCode.length,
        },
        null,
        2
      )
    );
    return;
  }

  if (featureId === "conceptsim-locale") {
    throw new Error(
      "conceptsim-locale drive requires an authenticated room session; follow feature-map/conceptsim-locale.md manually or extend control.mjs once a stable deep-link exists. facilitator-home is the automated prove path."
    );
  }

  throw new Error(`Unknown feature-id: ${featureId}`);
};

const cmdHttp = async (url) => {
  if (!url) throw new Error("http requires a URL");
  const result = await httpGet(url);
  console.log(JSON.stringify({ status: result.status, body: result.body.slice(0, 500) }, null, 2));
  if (result.status >= 400) process.exitCode = 1;
};

const main = async () => {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd) {
    console.error(usage);
    process.exit(2);
  }
  switch (cmd) {
    case "launch":
      await cmdLaunch();
      break;
    case "doctor":
      await cmdDoctor();
      break;
    case "stop":
      await cmdStop();
      break;
    case "drive":
      await cmdDrive(args[0]);
      break;
    case "http":
      await cmdHttp(args[0]);
      break;
    default:
      console.error(usage);
      process.exit(2);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
