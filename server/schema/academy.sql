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
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS read_only boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS sessions_person_id ON sessions(person_id);
CREATE INDEX IF NOT EXISTS rooms_cohort ON rooms((data->>'cohortId'));
CREATE TABLE IF NOT EXISTS cohorts (
 id uuid PRIMARY KEY,
 name text NOT NULL,
 starts_at bigint NOT NULL,
 days integer NOT NULL CHECK (days BETWEEN 1 AND 14),
 read_only_export boolean NOT NULL DEFAULT true,
 current_room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
 created_by jsonb,
 created_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS cohort_members (
 id uuid PRIMARY KEY,
 cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
 name text NOT NULL,
 created_at bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS cohort_members_name ON cohort_members(cohort_id, lower(name));
CREATE TABLE IF NOT EXISTS cohort_access_codes (
 code_hash text PRIMARY KEY,
 cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
 member_id uuid NOT NULL REFERENCES cohort_members(id) ON DELETE CASCADE,
 created_at bigint NOT NULL,
 revoked_at bigint,
 last_activated_at bigint
);
CREATE UNIQUE INDEX IF NOT EXISTS cohort_access_codes_live ON cohort_access_codes(member_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS access_attempts (
 key text PRIMARY KEY,
 window_started_at bigint NOT NULL,
 count integer NOT NULL
);
CREATE TABLE IF NOT EXISTS cohort_certificates (
 id text PRIMARY KEY,
 cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
 member_id uuid NOT NULL REFERENCES cohort_members(id) ON DELETE CASCADE,
 member_name text NOT NULL,
 cohort_name text NOT NULL,
 starts_at bigint NOT NULL,
 ends_at bigint NOT NULL,
 days integer NOT NULL,
 issued_at bigint NOT NULL,
 issued_by jsonb,
 revoked_at bigint
);
CREATE UNIQUE INDEX IF NOT EXISTS cohort_certificates_live ON cohort_certificates(member_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS participant_emails (
 person_id text PRIMARY KEY,
 room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
 cohort_member_id uuid REFERENCES cohort_members(id) ON DELETE CASCADE,
 email text NOT NULL UNIQUE,
 verified_at bigint NOT NULL,
 CHECK ((room_id IS NULL) <> (cohort_member_id IS NULL))
);
CREATE TABLE IF NOT EXISTS email_challenges (
 key text PRIMARY KEY,
 code_hash text NOT NULL,
 sent_at bigint NOT NULL,
 expires_at bigint NOT NULL,
 attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS email_challenges_expiry ON email_challenges(expires_at);
