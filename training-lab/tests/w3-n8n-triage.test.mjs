import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const labRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageRoot = path.join(labRoot, 'w3-n8n-triage');
const repoRoot = path.join(labRoot, '..');
const fixtures = JSON.parse(readFileSync(path.join(repoRoot, 'starter', 'triage-fixtures.json'), 'utf8'));
const expected = Object.fromEntries(fixtures.tickets.map(({ticket, expected_priority}) => [ticket.ticket_id, expected_priority]));
const readJson = (file) => JSON.parse(readFileSync(path.join(packageRoot, file), 'utf8'));

const check = (labels) => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'w3-labels-')), 'labels.json');
  writeFileSync(file, typeof labels === 'string' ? labels : JSON.stringify(labels));
  return spawnSync(process.execPath, [path.join(packageRoot, 'check.mjs'), file], {encoding: 'utf8'});
};

test('package workflows are byte-identical to the starter workflows', () => {
  for (const file of ['n8n-triage-l1-switch.json', 'n8n-triage-l2-agent-memory.json', 'n8n-triage-l3-multi-agent.json']) {
    assert.equal(readFileSync(path.join(packageRoot, file), 'utf8'), readFileSync(path.join(repoRoot, 'starter', file), 'utf8'), file);
  }
});

test('answer key and template cover exactly the graded fixture tickets', () => {
  const key = readJson('answer-key.json');
  assert.equal(key.algorithm, 'sha256');
  assert.deepEqual(key.hashes, Object.fromEntries(Object.entries(expected).map(([id, label]) => [
    id, createHash('sha256').update(`${id}:${label}`).digest('hex'),
  ])));
  assert.deepEqual(readJson('labels.template.json'), Object.fromEntries(Object.keys(expected).map((id) => [id, ''])));
  assert.doesNotMatch(readFileSync(path.join(packageRoot, 'answer-key.json'), 'utf8'), /\b(?:low|medium|high)\b/);
});

test('package pins n8n, requires Node 24, and ignores participant labels', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.n8n, 'npx --yes n8n@2.41.1');
  assert.equal(pkg.scripts.check, 'node check.mjs');
  assert.equal(pkg.engines.node, '>=24');
  assert.match(readFileSync(path.join(packageRoot, '.gitignore'), 'utf8'), /^labels\.json$/m);
});

test('check passes all-correct labels', () => {
  const result = check(expected);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^WL-1026 correct$/m);
  assert.match(result.stdout, /^Workshop 3 \(all tickets\): 4\/4 PASS$/m);
});

test('check asks to revise one wrong label', () => {
  const result = check({...expected, 'WL-9001': 'high'});
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^WL-9001 revise$/m);
  assert.match(result.stdout, /^Workshop 3 \(all tickets\): 3\/4 REVISE$/m);
});

test('check skips empty labels without counting them', () => {
  const result = check(readFileSync(path.join(packageRoot, 'labels.template.json'), 'utf8'));
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stdout, /correct|revise/);
  assert.match(result.stdout, /^Workshop 3 \(all tickets\): 0\/4 REVISE$/m);
});

test('check rejects unknown IDs and invalid labels with exit code 2', () => {
  const unknown = check({'WL-0000': 'low'});
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown ticket ID: WL-0000/);
  const invalid = check({'WL-1026': 'urgent'});
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Invalid label for WL-1026/);
});
