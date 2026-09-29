import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const solo = path.join(root, 'apps/web/public/solos/c1-c2-concepts');

const required = [
  'index.html',
  'README.md',
  'CLAUDE.md',
  'SOLO.md',
  'solo-structure.json',
  '.claude/SCRIPT_INSTRUCTIONS.md',
  '.claude/commands/start-solo.md',
  '.claude/commands/start-c1-concepts.md',
  '.claude/commands/start-01-claude-md.md',
  '.claude/commands/start-02-skills-vs-agents.md',
  '.claude/commands/start-03-mcp.md',
  '.claude/commands/start-04-hooks.md',
  'lessons/01-claude-md/CLAUDE.md',
  'lessons/02-skills-vs-agents/CLAUDE.md',
  'lessons/03-mcp/CLAUDE.md',
  'lessons/04-hooks/CLAUDE.md',
  'proof/PROOF.md',
  'proof/artifact-card.html',
];

test('C1-C2 concepts Solo-in-Claude package lands under /solos (AET-132)', () => {
  for (const rel of required) {
    assert.equal(existsSync(path.join(solo, rel)), true, rel);
  }
  const structure = JSON.parse(readFileSync(path.join(solo, 'solo-structure.json'), 'utf8'));
  assert.equal(structure.entryCommand, 'start-solo');
  assert.equal(structure.modules.length, 4);
  assert.deepEqual(structure.modules.map(m => m.slug), ['claude-md', 'skills-vs-agents', 'mcp', 'hooks']);
  const l1 = readFileSync(path.join(solo, 'lessons/01-claude-md/CLAUDE.md'), 'utf8');
  assert.match(l1, /STOP:/);
  assert.match(l1, /USER:/);
  assert.match(l1, /ACTION:/);
  assert.match(l1, /standing notebook/i);
  const l2 = readFileSync(path.join(solo, 'lessons/02-skills-vs-agents/CLAUDE.md'), 'utf8');
  assert.match(l2, /recipe/i);
  assert.match(l2, /coworker/i);
  const l3 = readFileSync(path.join(solo, 'lessons/03-mcp/CLAUDE.md'), 'utf8');
  assert.match(l3, /power strip/i);
  const l4 = readFileSync(path.join(solo, 'lessons/04-hooks/CLAUDE.md'), 'utf8');
  assert.match(l4, /sticky/i);
  assert.match(l4, /guarantee/i);
  const blob = [l1, l2, l3, l4].join('\n');
  assert.equal(/Basecamp|FSPM|inherited-chaos/i.test(blob), false);
  const start = readFileSync(path.join(solo, '.claude/commands/start-solo.md'), 'utf8');
  assert.match(start, /SILENTLY/i);
  assert.match(start, /01-claude-md/);
  const index = readFileSync(path.join(solo, 'index.html'), 'utf8');
  assert.match(index, /\/start-solo/);
  assert.match(index, /ccforeveryone\.com\/guides\/claude-code-concepts-explained/);
  const proof = readFileSync(path.join(solo, 'proof/artifact-card.html'), 'utf8');
  assert.match(proof, /PROOF\.md|artifact/i);
});
