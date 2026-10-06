import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFileSync(path.join(root,rel),'utf8');

test('teach-path: session chrome is ClassroomShell (REVISED ACCEPT)',()=>{
  const main=read('src/main.jsx');
  const shell=read('src/classroom-shell.jsx');
  assert.match(main,/import \{ClassroomShell\} from '\.\/classroom-shell'/);
  assert.match(main,/return <ClassroomShell/);
  assert.match(shell,/data-testid="classroom-home"/);
  assert.match(shell,/data-testid="classroom-outline"/);
  assert.match(shell,/data-testid="classroom-mark-complete"/);
  assert.doesNotMatch(main,/function ClassroomOverlay/);
  assert.doesNotMatch(main,/function FacilitatorControls/);
  assert.doesNotMatch(shell,/skool\.tabs|Community tab/);
});

test('teach-path: join gate and /facilitator admin preserved',()=>{
  const main=read('src/main.jsx');
  assert.match(main,/if\(path===ADMIN_PATH\)return <FacilitatorAdmin /);
  assert.match(main,/className="join"/);
});
