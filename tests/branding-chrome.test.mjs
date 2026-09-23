import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {THEMING_HOOKS, backToAcademyHref, academyReturnUrl} from '../packages/branding/src/index.js';

test('branding tokens are scoped to .academy-chrome and avoid canvas bleed selectors', () => {
  const css = readFileSync(path.join(process.cwd(), 'infra/native-apps/tokens.css'), 'utf8');
  assert.match(css, /\.academy-chrome\s*\{/);
  assert.match(css, /\.academy-chrome__back/);
  assert.doesNotMatch(css, /(^|\n)\s*(iframe|canvas|video)\s*\{/m);
  assert.doesNotMatch(css, /iframe\s+[^{]*\{/);
});

test('theming hooks inventory covers six apps without forking claim', () => {
  for (const app of ['slides', 'chat', 'assets', 'calendar', 'clips', 'content']) {
    assert.ok(Array.isArray(THEMING_HOOKS[app]) && THEMING_HOOKS[app].length > 0);
  }
  assert.equal(backToAcademyHref({returnTo: 'https://academy.example/?view=apps'}, 'https://academy.example'), 'https://academy.example/?view=apps');
  assert.equal(academyReturnUrl('https://academy.example', {path: '/', query: {view: 'apps'}}), 'https://academy.example/?view=apps');
});

test('AcademyChrome component exposes Back to Academy without global style import of lesson canvas', () => {
  const src = readFileSync(path.join(process.cwd(), 'src/portal/AcademyChrome.jsx'), 'utf8');
  assert.match(src, /apps\.backToAcademy/);
  assert.match(src, /academy-chrome__back/);
  assert.doesNotMatch(src, /style\.css/);
});
