CREATE TABLE "academy_curriculum"."facilitator_login_states" (
	"state_hash" text PRIMARY KEY NOT NULL,
	"nonce" text NOT NULL,
	"code_verifier" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_curriculum"."facilitator_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "facilitator_login_states_expires_at_idx" ON "academy_curriculum"."facilitator_login_states" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "facilitator_sessions_expires_at_idx" ON "academy_curriculum"."facilitator_sessions" USING btree ("expires_at");