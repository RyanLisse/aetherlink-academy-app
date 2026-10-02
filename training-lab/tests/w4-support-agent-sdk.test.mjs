import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {parseMessages} from '../w4-support-agent-sdk/lib/messages.mjs';
import {buildOptions as singleAgentOptions} from '../w4-support-agent-sdk/01-single-agent/options.mjs';
import {agents as subagents} from '../w4-support-agent-sdk/02-subagents/agents.mjs';
import {buildOptions as subagentOptions} from '../w4-support-agent-sdk/02-subagents/options.mjs';
import {agents as mcpAgents} from '../w4-support-agent-sdk/03-mcp/agents.mjs';
import {buildOptions as mcpOptions} from '../w4-support-agent-sdk/03-mcp/options.mjs';
import {findTransaction, rowsToTransactions} from '../w4-support-agent-sdk/03-mcp/transaction-mcp/transactions.mjs';

const labRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageRoot = path.join(labRoot, 'w4-support-agent-sdk');
const projectDirs = [
  path.join(packageRoot, '01-single-agent', 'claude-project'),
  path.join(packageRoot, '02-subagents', 'claude-project'),
  path.join(packageRoot, '03-mcp', 'claude-project'),
];
const packageMessages = readFileSync(path.join(packageRoot, 'customer-messages.md'), 'utf8');
const starterMessages = readFileSync(path.join(labRoot, '..', 'starter', 'customer-messages.md'), 'utf8');
const supportFixtures = JSON.parse(readFileSync(path.join(labRoot, '..', 'content', 'support', 'support-messages.json'), 'utf8'));
const projectRules = {
  settingSources: ['project'],
  systemPrompt: {type: 'preset', preset: 'claude_code'},
  disallowedTools: ['WebSearch', 'WebFetch', 'Bash'],
};

const filesBelow = (directory) => readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
  const fullPath = path.join(directory, entry.name);
  return entry.isDirectory() ? filesBelow(fullPath) : [fullPath];
});

const isOutside = (directory, candidate) => {
  const relative = path.relative(directory, candidate);
  return relative.startsWith('..') || path.isAbsolute(relative);
};

test('participant messages parse to the server support fixtures and match the starter copy', () => {
  assert.equal(packageMessages, starterMessages);
  assert.doesNotMatch(packageMessages, /\b(?:low|medium|high)\b/i);
  assert.deepEqual(
    parseMessages(packageMessages),
    supportFixtures.tickets.map(({ticket}) => ({
      id: ticket.ticket_id,
      subject: ticket.subject,
      message: ticket.message,
    })),
  );
});

test('lesson project instructions preserve the supplied rules and append the MCP boundary', () => {
  const singleRules = readFileSync(path.join(projectDirs[0], 'CLAUDE.md'), 'utf8').replaceAll('\r\n', '\n');
  const orchestratorRules = readFileSync(path.join(projectDirs[1], 'CLAUDE.md'), 'utf8').replaceAll('\r\n', '\n');
  const mcpRules = readFileSync(path.join(projectDirs[2], 'CLAUDE.md'), 'utf8').replaceAll('\r\n', '\n');

  assert.match(singleRules, /^# Customer Support Triage$/m);
  assert.match(singleRules, /^## Priority definitions$/m);
  assert.match(singleRules, /^## Required output$/m);
  assert.match(singleRules, /^- Use only information supplied by the user or available inside this project\.$/m);
  assert.match(singleRules, /^- Do not search the web for customer or transaction information\.$/m);
  assert.match(singleRules, /^- \*\*HIGH\*\* — Suspected fraud or security risk,/m);
  assert.match(orchestratorRules, /^# Customer Support Orchestrator$/m);
  assert.match(orchestratorRules, /^## Workflow$/m);
  assert.match(orchestratorRules, /^## Final output$/m);
  assert.match(orchestratorRules, /^1\. Delegate analysis and priority classification to the `ticket-analyst`\.$/m);
  assert.match(orchestratorRules, /^3\. Delegate the customer reply to the `email-responder`, including the original message and analyst result\.$/m);
  assert.equal(mcpRules, `${orchestratorRules}\n## Transaction data\n- When a message contains a transaction ID (format \`TX-####\`), the \`ticket-analyst\` looks it up with the \`get_transaction\` tool.\n- Never read transaction files yourself; transaction data only arrives through the tool.\n- In the final output, add a line \`External data:\` listing which facts came from \`get_transaction\` (or \`none\`).\n`);
});

test('lesson options use project instructions and keep tools scoped to each lesson', () => {
  const options = [singleAgentOptions(), subagentOptions(), mcpOptions()];

  for (const option of options) {
    assert.ok(path.isAbsolute(option.cwd));
    assert.equal(path.basename(option.cwd), 'claude-project');
    assert.deepEqual(option.settingSources, projectRules.settingSources);
    assert.deepEqual(option.systemPrompt, projectRules.systemPrompt);
    assert.deepEqual(option.disallowedTools, projectRules.disallowedTools);
  }

  const [single, subagent, mcp] = options;
  assert.equal(single.agents, undefined);
  assert.equal(single.mcpServers, undefined);
  assert.deepEqual(single.tools, []);
  assert.equal(single.maxTurns, 2);
  assert.deepEqual(Object.keys(subagent.agents).sort(), ['email-responder', 'ticket-analyst']);
  assert.deepEqual(subagent.agents, subagents);
  assert.deepEqual(subagent.tools, ['Agent', 'Write']);
  assert.equal(subagent.maxTurns, 10);
  assert.equal(mcp.maxTurns, 10);
  assert.deepEqual(subagent.allowedTools, ['Agent', 'Write']);
  assert.equal(subagent.permissionMode, 'acceptEdits');
  assert.equal(subagent.mcpServers, undefined);
  assert.deepEqual(Object.keys(mcp.agents).sort(), ['email-responder', 'ticket-analyst']);
  assert.deepEqual(mcp.agents, mcpAgents);
  assert.deepEqual(mcp.agents['ticket-analyst'].tools, ['mcp__transactions__get_transaction']);
  assert.deepEqual(mcp.agents['email-responder'].tools, []);
  assert.deepEqual(mcp.tools, ['Agent', 'Write']);
  assert.deepEqual(mcp.allowedTools, ['Agent', 'Write', 'mcp__transactions__get_transaction']);
  assert.equal(mcp.permissionMode, 'acceptEdits');
  assert.deepEqual(Object.keys(mcp.mcpServers), ['transactions']);
  assert.equal(mcp.mcpServers.transactions.type, 'stdio');
  assert.equal(mcp.mcpServers.transactions.command, 'node');

  const serverPath = mcp.mcpServers.transactions.args[0];
  const workbookPath = mcp.mcpServers.transactions.env.TRANSACTIONS_XLSX;
  assert.ok(path.isAbsolute(serverPath));
  assert.ok(path.isAbsolute(workbookPath));
  assert.ok(isOutside(mcp.cwd, serverPath));
  assert.ok(isOutside(mcp.cwd, workbookPath));
});

test('the transaction helper maps workbook rows and returns null for an unknown ID', () => {
  const rows = [
    ['Transaction ID', 'Customer', 'Amount', 'Status', 'Date', 'Currency', 'Issue Details', 'Fraud Flag'],
    ['TX-1014', 'Alex Morgan', 1290, 'Completed', '2026-08-21', 'EUR', 'Customer reports transaction as unrecognised', 'Yes'],
  ];
  const transactions = rowsToTransactions(rows);

  assert.equal(findTransaction(transactions, 'TX-1014').fraudFlag, 'Yes');
  assert.equal(findTransaction(transactions, 'TX-9999'), null);
});

test('transaction workbooks stay outside every claude-project directory', () => {
  for (const projectDir of projectDirs) {
    const workbooks = filesBelow(projectDir).filter((file) => file.endsWith('.xlsx'));
    assert.deepEqual(workbooks, [], projectDir);
  }
});

const gradedExpected = Object.fromEntries(supportFixtures.tickets
  .filter(({ticket}) => !supportFixtures.ungraded.includes(ticket.ticket_id))
  .map(({ticket, expected_priority}) => [ticket.ticket_id, expected_priority]));
const readPackageJson = (file) => JSON.parse(readFileSync(path.join(packageRoot, file), 'utf8'));
const checkLabels = (labels) => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'w4-labels-')), 'labels.json');
  writeFileSync(file, typeof labels === 'string' ? labels : JSON.stringify(labels));
  return spawnSync(process.execPath, [path.join(packageRoot, 'check.mjs'), file], {encoding: 'utf8'});
};

test('one npm install covers the MCP server and the package exposes offline checks', () => {
  const pkg = readPackageJson('package.json');
  assert.equal(pkg.scripts.postinstall, 'npm install --prefix 03-mcp/transaction-mcp --no-audit --no-fund');
  assert.equal(pkg.scripts['smoke:mcp'], 'node 03-mcp/transaction-mcp/smoke.mjs');
  assert.equal(pkg.scripts.check, 'node check.mjs');
  assert.equal(pkg.engines.node, '>=22');
  assert.match(readFileSync(path.join(packageRoot, '.gitignore'), 'utf8'), /^labels\.json$/m);
  const readme = readFileSync(path.join(packageRoot, 'README.md'), 'utf8');
  assert.doesNotMatch(readme, /cd 03-mcp\/transaction-mcp/);
  for (const literal of ['npm run smoke:mcp', 'npm run check', 'export ANTHROPIC_API_KEY=', '$env:ANTHROPIC_API_KEY = ', 'set ANTHROPIC_API_KEY=']) {
    assert.ok(readme.includes(literal), `README includes ${literal}`);
  }
});

test('answer key and template match the graded support messages', () => {
  const key = readPackageJson('answer-key.json');
  assert.equal(key.algorithm, 'sha256');
  assert.deepEqual(key.hashes, Object.fromEntries(Object.entries(gradedExpected).map(([id, label]) => [
    id, createHash('sha256').update(`${id}:${label}`).digest('hex'),
  ])));
  assert.deepEqual(readPackageJson('labels.template.json'), Object.fromEntries(Object.keys(gradedExpected).map((id) => [id, ''])));
  assert.doesNotMatch(readFileSync(path.join(packageRoot, 'answer-key.json'), 'utf8'), /\b(?:low|medium|high)\b/);
});

test('label check passes all-correct labels and ignores MSG-10', () => {
  const result = checkLabels({...gradedExpected, 'MSG-10': 'high'});
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^MSG-10 is not graded/m);
  assert.match(result.stdout, /^Lesson 1 \(MSG-01 to MSG-06\): 6\/6 PASS$/m);
  assert.match(result.stdout, /^Lesson 3 \(MSG-01 to MSG-09\): 9\/9 PASS$/m);
});

test('label check passes Lesson 1 alone and fails on any wrong label', () => {
  const lessonOne = Object.fromEntries(Object.entries(gradedExpected).slice(0, 6));
  const partial = checkLabels(lessonOne);
  assert.equal(partial.status, 0, partial.stderr);
  assert.match(partial.stdout, /^Lesson 3 \(MSG-01 to MSG-09\): 6\/9 REVISE$/m);

  const wrongLabel = gradedExpected['MSG-08'] === 'low' ? 'high' : 'low';
  const wrong = checkLabels({...gradedExpected, 'MSG-08': wrongLabel});
  assert.equal(wrong.status, 1);
  assert.match(wrong.stdout, /^MSG-08 revise$/m);
  assert.match(wrong.stdout, /^Lesson 1 \(MSG-01 to MSG-06\): 6\/6 PASS$/m);
  assert.match(wrong.stdout, /^Lesson 3 \(MSG-01 to MSG-09\): 8\/9 REVISE$/m);
});

test('label check skips empty labels and rejects unknown IDs or labels', () => {
  const empty = checkLabels(readFileSync(path.join(packageRoot, 'labels.template.json'), 'utf8'));
  assert.equal(empty.status, 1);
  assert.doesNotMatch(empty.stdout, /correct|revise/);
  assert.match(empty.stdout, /^Lesson 1 \(MSG-01 to MSG-06\): 0\/6 REVISE$/m);

  const unknown = checkLabels({'MSG-11': 'low'});
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown message ID: MSG-11/);
  const invalid = checkLabels({'MSG-01': 'urgent'});
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Invalid label for MSG-01/);
});
