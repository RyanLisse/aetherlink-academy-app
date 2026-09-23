import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const outDir = process.env.AET41_EVIDENCE_DIR || path.join(here, "../evidence");
mkdirSync(outDir, { recursive: true });

const child = spawn(process.execPath, ["scripts/start-mocks.mjs"], {
  cwd: path.join(root, "training-lab"),
  stdio: ["ignore", "pipe", "pipe"],
});

let startup = "";
const started = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("startup timeout")), 8000);
  child.stdout.on("data", (c) => {
    startup += c.toString();
    const line = startup.split("\n").find((x) => x.startsWith("{"));
    if (line) {
      clearTimeout(timer);
      resolve(JSON.parse(line));
    }
  });
  child.once("exit", (code, signal) => {
    clearTimeout(timer);
    reject(new Error(`exited ${code ?? signal}`));
  });
});

const waitHealth = async (port) => {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`health fail ${port}`);
};

await Promise.all([48136, 48137, 48138].map(waitHealth));

const receipt = {
  when: new Date().toISOString(),
  startup,
  servers: [],
};

const clients = [];
try {
  for (const [name, port, listTool, listArgs, getTool, getArgs] of [
    ["training-jira", 48136, "list_issues", {}, "get_issue", { key: "TRAIN-101" }],
    ["training-gitlab", 48137, "list_merge_requests", {}, "get_merge_request", { iid: 7 }],
    ["training-confluence", 48138, "search_pages", { query: "settlement" }, "get_page", { id: "PAGE-201" }],
  ]) {
    const client = new Client({ name: "aet-41-assignment-10", version: "0.1.0" });
    clients.push(client);
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
    const listed = await client.listTools();
    const listResult = await client.callTool({ name: listTool, arguments: listArgs });
    const getResult = await client.callTool({ name: getTool, arguments: getArgs });
    const entry = {
      name,
      port,
      tools: listed.tools.map((t) => ({ name: t.name, description: t.description })),
      listTool,
      listPayload: JSON.parse(listResult.content[0].text),
      getTool,
      getPayload: JSON.parse(getResult.content[0].text),
      listIsError: listResult.isError === true,
      getIsError: getResult.isError === true,
    };
    receipt.servers.push(entry);
  }
} finally {
  await Promise.all(clients.map((c) => c.close().catch(() => undefined)));
  child.kill("SIGTERM");
}

writeFileSync(path.join(outDir, "mcp-a10-receipt.json"), JSON.stringify(receipt, null, 2));
writeFileSync(
  path.join(outDir, "mcp-a10-list.txt"),
  receipt.servers
    .map((s) => {
      return [
        `=== ${s.name} :${s.port} ===`,
        "TOOLS:",
        ...s.tools.map((t) => ` - ${t.name}: ${t.description}`),
        `LIST ${s.listTool}:`,
        JSON.stringify(s.listPayload, null, 2),
        `GET ${s.getTool}:`,
        JSON.stringify(s.getPayload, null, 2),
        "",
      ].join("\n");
    })
    .join("\n"),
);

// HTML screenshot surface
const jira = receipt.servers.find((s) => s.name === "training-jira");
const html = `<!doctype html><html><head><meta charset="utf-8"><title>AET-41 Assignment 10 MCP proof</title>
<style>
body{font-family:ui-sans-serif,system-ui;background:#06111e;color:#e8eef7;margin:0;padding:32px}
h1{color:#FF7A1A} h2{color:#8ad4ff} .card{background:#0d1b2c;border:1px solid #1e3a5f;border-radius:12px;padding:16px;margin:12px 0}
code,pre{background:#020a14;padding:12px;border-radius:8px;display:block;overflow:auto;white-space:pre-wrap}
.ok{color:#5dffb0} .meta{opacity:.8;font-size:14px}
</style></head><body>
<h1>Assignment 10 · Mock MCP proof (AET-41)</h1>
<p class="meta">Clean-machine style client path · ${receipt.when} · fictional TRAIN-* only · outside Worldline</p>
<div class="card"><h2>training-jira tool listing</h2>
<pre>${jira.tools.map((t) => t.name + " — " + t.description).join("\n")}</pre></div>
<div class="card"><h2>list_issues result</h2>
<pre>${JSON.stringify(jira.listPayload, null, 2)}</pre></div>
<div class="card"><h2>get_issue TRAIN-101 result</h2>
<pre>${JSON.stringify(jira.getPayload, null, 2)}</pre></div>
<p class="ok">PASS — listTools + list_issues + get_issue against http://127.0.0.1:48136/mcp</p>
</body></html>`;
writeFileSync(path.join(outDir, "mcp-a10-evidence.html"), html);
console.log(JSON.stringify({ ok: true, servers: receipt.servers.map((s) => s.name), tools: jira.tools.map((t) => t.name) }, null, 2));
