CREATE TABLE IF NOT EXISTS system_metadata (
 key TEXT PRIMARY KEY,
 value TEXT NOT NULL,
 updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
 id uuid PRIMARY KEY,
 code text UNIQUE NOT NULL,
 data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 person_id text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('browser', 'mcp')),
 expires_at bigint NOT NULL,
 display_name text
);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS display_name text;
CREATE INDEX IF NOT EXISTS sessions_person ON sessions(room_id, person_id, kind);
CREATE TABLE IF NOT EXISTS participant_access (
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 person_id text NOT NULL,
 secret_hash text PRIMARY KEY,
 verified_email text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (room_id, person_id)
);
CREATE INDEX IF NOT EXISTS participant_access_person ON participant_access(room_id, person_id);
CREATE TABLE IF NOT EXISTS facilitator_sessions (
 token_hash text PRIMARY KEY,
 sub text NOT NULL,
 email text NOT NULL,
 name text NOT NULL,
 domain text NOT NULL,
 expires_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS facilitator_sessions_expiry ON facilitator_sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_states (
 state_hash text PRIMARY KEY,
 nonce text NOT NULL,
 code_verifier text NOT NULL,
 expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS login_states_expiry ON login_states(expires_at);
CREATE TABLE IF NOT EXISTS requests (
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 person_id text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('evidence', 'review', 'handoff')),
 request_id text NOT NULL,
 payload_hash text NOT NULL,
 intent jsonb NOT NULL,
 result jsonb,
 PRIMARY KEY (room_id, person_id, kind, request_id)
);
CREATE TABLE IF NOT EXISTS decks (
 id uuid PRIMARY KEY,
 room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 revision integer NOT NULL,
 data jsonb NOT NULL,
 updated_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS decks_room ON decks(room_id, updated_at);
