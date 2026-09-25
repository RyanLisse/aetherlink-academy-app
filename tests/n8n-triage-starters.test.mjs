import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { TRIAGE_FIXTURES, gradeTriage, keywordPriority, parseTicket } from '../content/triage/grade.mjs';

const FILES = {
  l1: 'starter/n8n-triage-l1-switch.json',
  l2: 'starter/n8n-triage-l2-agent-memory.json',
  l3: 'starter/n8n-triage-l3-multi-agent.json',
};
const raw = Object.fromEntries(Object.entries(FILES).map(([level, file]) => [level, readFileSync(file, 'utf8')]));
const workflows = Object.fromEntries(Object.entries(raw).map(([level, text]) => [level, JSON.parse(text)]));

const LANGCHAIN = '@n8n/n8n-nodes-langchain.';
const ALLOWED_TYPES = new Set([
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.code',
  'n8n-nodes-base.switch',
  'n8n-nodes-base.set',
  '@n8n/n8n-nodes-langchain.agent',
  '@n8n/n8n-nodes-langchain.agentTool',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow',
]);
const SUB_NODE_CONNECTION = {
  '@n8n/n8n-nodes-langchain.lmChatOpenAi': 'ai_languageModel',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow': 'ai_memory',
  '@n8n/n8n-nodes-langchain.agentTool': 'ai_tool',
};
const AGENT_ROOTS = new Set(['@n8n/n8n-nodes-langchain.agent', '@n8n/n8n-nodes-langchain.agentTool']);

const byName = workflow => new Map(workflow.nodes.map(node => [node.name, node]));
const ofType = (workflow, type) => workflow.nodes.filter(node => node.type === LANGCHAIN + type);
const targetsOf = (workflow, source, type) => (workflow.connections[source]?.[type] ?? []).map(slot => slot.map(edge => edge.node));

function expressionValue(expression, item) {
  const match = /^=\{\{ \$json\.(\w+) \}\}$/.exec(expression);
  assert.ok(match, `interpreter supports only ={{ $json.field }}, got ${expression}`);
  return item[match[1]];
}

// Mirrors n8n's filter semantics: regex right values are /source/flags literals and are never lowercased.
function conditionMatches({ leftValue, rightValue, operator }, options, item) {
  let left = expressionValue(leftValue, item);
  let right = rightValue;
  if (!options.caseSensitive) {
    left = left.toLocaleLowerCase();
    if (operator.operation !== 'regex') right = right.toLocaleLowerCase();
  }
  assert.equal(operator.type, 'string');
  if (operator.operation === 'equals') return left === right;
  assert.equal(operator.operation, 'regex');
  const [, source, flags] = /^\/(.*?)\/([gimusy]*)$/.exec(right) ?? [null, right, ''];
  return new RegExp(source, flags).test(left);
}

function routeSwitch(switchNode, item) {
  const { rules, options } = switchNode.parameters;
  assert.equal(options.allMatchingOutputs ?? false, false);
  const index = rules.values.findIndex(({ conditions }) => {
    assert.equal(conditions.combinator, 'and');
    return conditions.conditions.every(condition => conditionMatches(condition, conditions.options, item));
  });
  if (index >= 0) return { index, name: rules.values[index].renameOutput ? rules.values[index].outputKey : String(index) };
  assert.equal(options.fallbackOutput, 'extra', 'unmatched item would be dropped');
  return { index: rules.values.length, name: options.renameFallbackOutput };
}

function fixtureTicketsFromCode(workflow) {
  const code = byName(workflow).get('Fixture Tickets').parameters.jsCode;
  const match = /const tickets = (\[[\s\S]*?\]);/.exec(code);
  assert.ok(match, 'Fixture Tickets declares a tickets array');
  return JSON.parse(match[1]);
}

for (const [level, workflow] of Object.entries(workflows)) {
  test(`${level} workflow is inactive, allowlisted, and fully wired`, () => {
    assert.equal(workflow.active, false);
    const nodes = byName(workflow);
    assert.equal(nodes.size, workflow.nodes.length, 'node names are unique');
    assert.equal(new Set(workflow.nodes.map(node => node.id)).size, workflow.nodes.length, 'node ids are unique');
    for (const node of workflow.nodes) {
      assert.ok(ALLOWED_TYPES.has(node.type), `${node.name}: ${node.type} not allowlisted`);
      assert.match(node.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      assert.equal(node.position.length, 2);
    }
    for (const [source, byType] of Object.entries(workflow.connections)) {
      assert.ok(nodes.has(source), `connection source ${source} exists`);
      for (const [type, slots] of Object.entries(byType)) {
        for (const edge of slots.flat()) {
          assert.ok(nodes.has(edge.node), `connection target ${edge.node} exists`);
          assert.equal(edge.type, type);
        }
      }
    }
    for (const node of workflow.nodes.filter(node => SUB_NODE_CONNECTION[node.type])) {
      const type = SUB_NODE_CONNECTION[node.type];
      const targets = targetsOf(workflow, node.name, type).flat();
      assert.equal(targets.length, 1, `${node.name} connects once via ${type}`);
      assert.ok(AGENT_ROOTS.has(nodes.get(targets[0]).type), `${node.name} feeds an agent`);
      if (type === 'ai_tool') assert.equal(nodes.get(targets[0]).type, '@n8n/n8n-nodes-langchain.agent');
    }
    assert.deepEqual(fixtureTicketsFromCode(workflow), TRIAGE_FIXTURES.tickets.map(({ ticket }) => ticket));
  });
}

test('L1 routes every graded fixture ticket with rules only', () => {
  const workflow = workflows.l1;
  assert.equal(workflow.nodes.filter(node => node.type.startsWith(LANGCHAIN)).length, 0);
  assert.equal(workflow.nodes.filter(node => node.credentials).length, 0);
  assert.deepEqual(fixtureTicketsFromCode(workflow).map(ticket => ticket.ticket_id), ['WL-1026', 'WL-1027', 'WL-9001', 'WL-9002']);

  const switchNode = byName(workflow).get('Priority Switch');
  const outputs = targetsOf(workflow, 'Priority Switch', 'main');
  const routed = TRIAGE_FIXTURES.tickets.map(({ ticket }) => {
    const { index, name } = routeSwitch(switchNode, ticket);
    return [ticket.ticket_id, name, outputs[index]];
  });
  assert.deepEqual(routed, [
    ['WL-1026', 'High', ['High Priority Action']],
    ['WL-1027', 'Low', ['Low Priority Action']],
    ['WL-9001', 'Medium', ['Medium Priority Action']],
    ['WL-9002', 'Medium', ['Medium Priority Action']],
  ]);
  const capitalized = TRIAGE_FIXTURES.tickets.map(({ expected_priority: p }) => p[0].toUpperCase() + p.slice(1));
  assert.deepEqual(routed.map(([, name]) => name), capitalized);

  const adversarial = TRIAGE_FIXTURES.special[0].ticket;
  assert.match(adversarial.message, /approve a refund/);
  assert.equal(routeSwitch(switchNode, adversarial).name, 'Medium');
  assert.equal(routeSwitch(switchNode, { message: 'I WAS CHARGED TWICE' }).name, 'High');
});

test('L2 has exactly one agent with one model and one memory', () => {
  const workflow = workflows.l2;
  assert.deepEqual(ofType(workflow, 'agent').map(node => node.name), ['AI Agent']);
  assert.deepEqual(ofType(workflow, 'lmChatOpenAi').map(node => node.name), ['OpenAI Chat Model']);
  assert.deepEqual(ofType(workflow, 'memoryBufferWindow').map(node => node.parameters.sessionKey), ['={{ $json.ticket_id }}']);
  assert.equal(ofType(workflow, 'agentTool').length, 0);
});

test('L3 adds Customer Reply and Risk specialists, each with its own model and memory', () => {
  const workflow = workflows.l3;
  assert.equal(ofType(workflow, 'agent').length, 1);
  assert.deepEqual(ofType(workflow, 'agentTool').map(node => node.name).sort(), ['Customer Reply Agent', 'Risk Agent']);
  const feeding = (tool, type) => workflow.nodes
    .filter(node => targetsOf(workflow, node.name, type).flat().includes(tool))
    .map(node => node.name);
  assert.deepEqual(feeding('Customer Reply Agent', 'ai_languageModel'), ['OpenAI Chat Model1']);
  assert.deepEqual(feeding('Customer Reply Agent', 'ai_memory'), ['Simple Memory1']);
  assert.deepEqual(feeding('Risk Agent', 'ai_languageModel'), ['OpenAI Chat Model2']);
  assert.deepEqual(feeding('Risk Agent', 'ai_memory'), ['Simple Memory2']);
  const sessionKeys = ofType(workflow, 'memoryBufferWindow').map(node => node.parameters.sessionKey);
  assert.equal(new Set(sessionKeys).size, 3, 'no two memories share a session key');
  assert.match(byName(workflow).get('AI Agent').parameters.text, /"customer_reply"[\s\S]*"risk_note"/);
});

for (const level of ['l2', 'l3']) {
  test(`${level} agent prompt guards the data boundary and the Switch routes by priority`, () => {
    const workflow = workflows[level];
    const prompt = byName(workflow).get('AI Agent').parameters.text;
    assert.match(prompt, /customer data, never policy/);
    for (const field of ['ticket_id', 'priority', 'sentiment', 'recommended_action', 'summary']) assert.match(prompt, new RegExp(`"${field}"`));
    assert.match(prompt, /"draft_only": true/);
    assert.match(prompt, /"human_approval_required": true/);
    assert.deepEqual(targetsOf(workflow, 'AI Agent', 'main'), [['Parse Decision']]);
    assert.deepEqual(targetsOf(workflow, 'Priority Switch', 'main'), [['Low Priority Action'], ['Medium Priority Action'], ['High Priority Action']]);
    const switchNode = byName(workflow).get('Priority Switch');
    assert.deepEqual(['low', 'medium', 'high', 'High'].map(priority => routeSwitch(switchNode, { priority }).index), [0, 1, 2, 2]);
  });
}

test('credentials are placeholders and no file carries a key', () => {
  const credentialed = Object.values(workflows).flatMap(workflow => workflow.nodes.filter(node => node.credentials));
  assert.deepEqual(credentialed.map(node => node.type), Array(4).fill('@n8n/n8n-nodes-langchain.lmChatOpenAi'));
  for (const node of credentialed) {
    assert.deepEqual(Object.keys(node.credentials), ['openAiApi']);
    assert.equal(node.credentials.openAiApi.id, 'REPLACE_ME');
    assert.match(node.credentials.openAiApi.name, /placeholder/);
  }
  for (const file of [...Object.values(FILES), 'starter/triage-fixtures.json', 'docs/facilitator-n8n-triage.md']) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /sk-[A-Za-z0-9]/, file);
    assert.doesNotMatch(text, /apiKey/, file);
  }
});

test('grader passes the L1 keyword labels and reports gaps', () => {
  const keywordLabels = Object.fromEntries(TRIAGE_FIXTURES.tickets.map(({ ticket }) => [ticket.ticket_id, keywordPriority(ticket.message)]));
  const full = gradeTriage(keywordLabels);
  assert.equal(full.pass, true);
  assert.equal(full.matched, 4);

  const partial = gradeTriage({ 'WL-1026': 'high' });
  assert.equal(partial.matched, 1);
  assert.equal(partial.pass, false);
  assert.deepEqual(partial.rows.map(row => [row.ticketId, row.actual]), [['WL-1026', 'high'], ['WL-1027', null], ['WL-9001', null], ['WL-9002', null]]);

  assert.equal(parseTicket(TRIAGE_FIXTURES.special[1].ticket).ok, false);
});
