ALTER TABLE "users" ADD COLUMN "beta_agreement_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "beta_agreement_version" varchar(32);