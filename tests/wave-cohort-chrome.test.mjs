import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = readFileSync(join(root, 'src/main.jsx'), 'utf8');
const store = readFileSync(join(root, 'server/store.mjs'), 'utf8');
const cohort = readFileSync(join(root, 'server/cohort.mjs'), 'utf8');
const cohortRoutes = readFileSync(join(root, 'server/routes/cohort.mjs'), 'utf8');
const sql = readFileSync(join(root, 'server/schema/academy.sql'), 'utf8');
const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
const nl = JSON.parse(readFileSync(join(root, 'src/i18n/nl.json'), 'utf8'));

test('F1 create named Wave cohort from facilitator overview', () => {
  assert.match(main, /data-testid="cohort-create"/);
  assert.match(main, /facilitator\/cohort\/create/);
  assert.match(main, /cohort\.name/);
  assert.match(main, /cohort\.startDate/);
  assert.match(en['cohort.title'], /Wave cohort/i);
  assert.match(nl['cohort.title'], /Wave-cohort/i);
  assert.match(en['cohort.createHelp'], /Room codes stay separate/i);
});

test('F2 attach rooms — list linked + attach by id or code', () => {
  assert.match(main, /data-testid="cohort-rooms"/);
  assert.match(main, /cohort\.linkedRooms/);
  assert.match(main, /facilitator\/cohort\/attach/);
  assert.match(main, /roomCode/);
  assert.match(main, /cohort\.attachByCode/);
  assert.match(cohortRoutes, /findRoomIdByCode/);
  assert.match(cohort, /rooms:rooms\.map\(room=>\(\{id:room\.id/);
});

test('F3 roster empty state + enrolled members', () => {
  assert.match(main, /data-testid="cohort-roster-empty"/);
  assert.match(main, /cohort\.rosterEmpty/);
  assert.match(main, /className="cohort-roster"/);
  assert.ok(en['cohort.rosterEmpty']);
  assert.ok(nl['cohort.rosterEmpty']);
});

test('F4 roster CSV / copy export with name + room + join time', () => {
  assert.match(main, /data-testid="cohort-roster-copy"/);
  assert.match(main, /data-testid="cohort-roster-csv"/);
  assert.match(main, /cohort\.copyRoster/);
  assert.match(main, /cohort\.exportRoster/);
  assert.match(main, /rosterCsvText/);
  assert.match(main, /text\/csv/);
  assert.match(cohort, /export function rosterCsv/);
  assert.match(cohort, /'name','room','room_code','joined_at'/);
});

test('F5 vocabulary distinguishes room session vs Wave cohort', () => {
  assert.match(main, /data-testid="room-session-label"/);
  assert.match(main, /data-testid="wave-cohort-badge"/);
  assert.match(main, /data-testid="cohort-vocab"/);
  assert.match(main, /room\.sessionLabel/);
  assert.match(main, /room\.waveOf/);
  assert.match(main, /cohort\.lede/);
  assert.match(en['room.sessionLabel'], /Room session/i);
  assert.match(nl['room.sessionLabel'], /Kamersessie/i);
  assert.match(en['cohort.lede'], /not the whole course/i);
  assert.match(nl['cohort.lede'], /niet het hele traject/i);
  assert.match(store, /wave:r\.cohortId\?\{id:r\.cohortId,name:r\.cohortName/);
});

test('F6 migration safety — forward-only IF NOT EXISTS; rooms without cohort unchanged', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS cohorts/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS cohort_members/);
  assert.doesNotMatch(sql, /DROP TABLE\s+cohorts/i);
  assert.doesNotMatch(sql, /ALTER TABLE rooms DROP/i);
  // join path still allows rooms without cohortId
  assert.match(store, /if\(r\.cohortId\)fail\(403,COHORT_ROOM_JOIN_MESSAGE\)/);
  assert.match(store, /wave:r\.cohortId\?\{id:r\.cohortId,name:r\.cohortName\|\|null\}:null/);
});

test('F7 not LMS catalog — no course catalog / payments / org switcher surface', () => {
  assert.doesNotMatch(main, /course catalog|seo landing|stripe|multi-tenant|org switcher|learnhouse|frappe\/lms/i);
  assert.doesNotMatch(en['cohort.lede'] + en['cohort.createHelp'], /catalog|payment|stripe|subscription/i);
});
