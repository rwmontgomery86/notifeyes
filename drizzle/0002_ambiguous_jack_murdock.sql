ALTER TABLE "shifts" ADD COLUMN "bump_rate_cents_per_hour" integer;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "bump_radius_meters" integer;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "bumped_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketing_opted_in" boolean DEFAULT false NOT NULL;