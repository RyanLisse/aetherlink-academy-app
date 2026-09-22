import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('main.jsx wires Chat navigation only after chatAvailable, using the embed route', () => {
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /ChatPanel/);
  assert.match(main, /chatState/);
  assert.match(main, /chatAvailable/);
  assert.match(main, /chatState==='ready'/);
  assert.doesNotMatch(main, /AGENT_CHAT_URL|AGENT_CHAT_SHARED_SECRET/);
});

test('chat.jsx renders an in-shell iframe pointed at the Academy embed route, not the external Chat URL', () => {
  const chat = readFileSync(new URL('../src/chat.jsx', import.meta.url), 'utf8');
  assert.match(chat, /\/game\/chat\/embed/);
  assert.doesNotMatch(chat, /https?:\/\//);
  assert.match(chat, /referrerPolicy="no-referrer"/);
  assert.match(chat, /allow="clipboard-read; clipboard-write"/);
  assert.doesNotMatch(chat, /sandbox=/);
  assert.match(chat, /RefreshCw/);
});

test('server/app.mjs wires the chat embed route through the embed helper', () => {
  const app = readFileSync(new URL('../server/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /app\.get\('\/game\/chat\/embed'/);
  assert.match(app, /createChatEmbedStartUrl/);
  assert.match(app, /chatEmbedErrorHtml/);
  assert.match(app, /chatAvailable/);
});

test('chat chrome strings are translated in both catalogs', () => {
  const en = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
  const nl = JSON.parse(readFileSync(new URL('../src/i18n/nl.json', import.meta.url), 'utf8'));
  for (const key of ['nav.chat', 'chat.eyebrow', 'chat.title', 'chat.lede', 'chat.loading', 'chat.retry', 'chat.frameTitle']) {
    assert.ok(en[key], `missing EN ${key}`);
    assert.ok(nl[key], `missing NL ${key}`);
  }
});

test('i18n catalogs stay in parity across all keys', () => {
  const en = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
  const nl = JSON.parse(readFileSync(new URL('../src/i18n/nl.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(en).sort(), Object.keys(nl).sort());
});
