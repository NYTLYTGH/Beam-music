CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY,
	"display_name" text DEFAULT '' NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"instagram" text DEFAULT '' NOT NULL,
	"avatar_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
