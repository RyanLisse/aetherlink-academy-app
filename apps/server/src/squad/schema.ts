/**
 * Runtime squad tables in schema `academy_runtime`.
 * Distinct from `academy_curriculum.rooms` (course pin) owned by AET-22.
 */
import {bigint, jsonb, pgSchema, text, uuid} from 'drizzle-orm/pg-core';
import type {Room} from './types.ts';

export const runtime = pgSchema('academy_runtime');

export const squadRooms = runtime.table('squad_rooms', {
  id: uuid('id').primaryKey(),
  code: text('code').notNull().unique(),
  data: jsonb('data').$type<Room>().notNull(),
});

export const squadSessions = runtime.table('squad_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => squadRooms.id, {onDelete: 'cascade'}),
  personId: text('person_id').notNull(),
  kind: text('kind').notNull(), // browser | mcp
  expiresAt: bigint('expires_at', {mode: 'number'}).notNull(),
  displayName: text('display_name'),
});

export const facilitatorSessions = runtime.table('facilitator_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  sub: text('sub').notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  expiresAt: bigint('expires_at', {mode: 'number'}).notNull(),
});

export const loginStates = runtime.table('login_states', {
  stateHash: text('state_hash').primaryKey(),
  nonce: text('nonce').notNull(),
  codeVerifier: text('code_verifier').notNull(),
  expiresAt: bigint('expires_at', {mode: 'number'}).notNull(),
});

export const localePrefs = runtime.table('locale_prefs', {
  scope: text('scope').notNull(), // user:<id> | room:<id>
  locale: text('locale').notNull(),
});

export const RUNTIME_DDL = `
CREATE SCHEMA IF NOT EXISTS academy_runtime;
CREATE TABLE IF NOT EXISTS academy_runtime.squad_rooms (
  id uuid PRIMARY KEY,
  code text UNIQUE NOT NULL,
  data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_runtime.squad_sessions (
  token_hash text PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES academy_runtime.squad_rooms(id) ON DELETE CASCADE,
  person_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('browser', 'mcp')),
  expires_at bigint NOT NULL,
  display_name text
);
CREATE INDEX IF NOT EXISTS squad_sessions_person ON academy_runtime.squad_sessions(room_id, person_id, kind);
CREATE TABLE IF NOT EXISTS academy_runtime.facilitator_sessions (
  token_hash text PRIMARY KEY,
  sub text NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  expires_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_runtime.login_states (
  state_hash text PRIMARY KEY,
  nonce text NOT NULL,
  code_verifier text NOT NULL,
  expires_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_runtime.locale_prefs (
  scope text PRIMARY KEY,
  locale text NOT NULL
);
`;
