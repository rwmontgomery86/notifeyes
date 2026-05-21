CREATE TYPE "public"."application_source" AS ENUM('apply', 'invite', 'watch_alert');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('applied', 'shortlisted', 'offered', 'accepted', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('scheduled', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."review_author" AS ENUM('practice', 'od');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('draft', 'posted', 'booked', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('fill_in', 'half_day', 'weekend', 'recurring', 'permanent');--> statement-breakpoint
CREATE TYPE "public"."shift_visibility" AS ENUM('public', 'favorites', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('practice_owner', 'practice_scheduler', 'od', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."watch_zone_shape" AS ENUM('circle', 'polygon');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"od_id" uuid NOT NULL,
	"source" "application_source" NOT NULL,
	"message" text,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"od_id" uuid NOT NULL,
	"practice_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"contract_id" uuid,
	"total_cents" integer NOT NULL,
	"platform_fee_cents" integer NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"cancelled_by_user_id" uuid,
	"cancellation_reason" text,
	"cancellation_fee_cents" integer,
	"cancelled_at" timestamp with time zone,
	"check_in_at" timestamp with time zone,
	"check_out_at" timestamp with time zone,
	"payment_intent_id" text,
	"payment_status" varchar(40) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"template_version" varchar(20) NOT NULL,
	"body_text" text NOT NULL,
	"signed_by_practice_at" timestamp with time zone,
	"signed_by_practice_user_id" uuid,
	"signed_by_od_at" timestamp with time zone,
	"signed_by_od_user_id" uuid,
	"pdf_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorite_ods" (
	"practice_id" uuid NOT NULL,
	"od_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_ods_practice_id_od_id_pk" PRIMARY KEY("practice_id","od_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "followed_practices" (
	"od_id" uuid NOT NULL,
	"practice_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "followed_practices_od_id_practice_id_pk" PRIMARY KEY("od_id","practice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_user_id" uuid,
	"body" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"system_kind" varchar(40),
	"system_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(40) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"channels_sent" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_url" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "optometrists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"display_name" varchar(200),
	"headshot_url" text,
	"bio" text,
	"home_location" geography(Point, 4326),
	"travel_radius_mi" integer DEFAULT 25 NOT NULL,
	"license_state" varchar(2),
	"license_number" varchar(80),
	"license_expires_at" timestamp with time zone,
	"license_doc_url" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_user_id" uuid,
	"verification_notes" text,
	"dea_url" text,
	"malpractice_url" text,
	"cpr_url" text,
	"npi_number" varchar(20),
	"id_verified_at" timestamp with time zone,
	"ehr_experience" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating_avg" real,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"shifts_completed" integer DEFAULT 0 NOT NULL,
	"cancellation_count" integer DEFAULT 0 NOT NULL,
	"no_show_count" integer DEFAULT 0 NOT NULL,
	"payout_method" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"od_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payout_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"stripe_transfer_id" text,
	"marked_sent_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"dba" varchar(200),
	"bio" text,
	"year_established" integer,
	"chairs" integer,
	"ehr" varchar(80),
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"address_line" varchar(200),
	"city" varchar(100),
	"state" varchar(2),
	"zip" varchar(10),
	"location" geography(Point, 4326),
	"business_license_verified" boolean DEFAULT false NOT NULL,
	"payment_method_verified" boolean DEFAULT false NOT NULL,
	"rating_avg" real,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"shifts_completed" integer DEFAULT 0 NOT NULL,
	"cancellation_count" integer DEFAULT 0 NOT NULL,
	"on_time_pay_pct" real,
	"avg_fill_time_hrs" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"author_role" "review_author" NOT NULL,
	"author_user_id" uuid NOT NULL,
	"rating_overall" integer NOT NULL,
	"rating_specifics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"public_comment" text,
	"private_feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" uuid NOT NULL,
	"posted_by_user_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"lunch_minutes" integer DEFAULT 30 NOT NULL,
	"type" "shift_type" NOT NULL,
	"rate_cents_per_hour" integer NOT NULL,
	"services_needed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes_for_od" text,
	"visibility" "shift_visibility" DEFAULT 'public' NOT NULL,
	"status" "shift_status" DEFAULT 'draft' NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"booked_application_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thread_participants" (
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "thread_participants_thread_id_user_id_pk" PRIMARY KEY("thread_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"context_booking_id" uuid,
	"context_shift_id" uuid,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"phone" varchar(32),
	"password_hash" text,
	"role" "user_role" NOT NULL,
	"practice_id" uuid,
	"od_id" uuid,
	"name" varchar(200),
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watch_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"od_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"shape" "watch_zone_shape" NOT NULL,
	"geometry" geography(Geometry, 4326) NOT NULL,
	"geometry_meta" jsonb NOT NULL,
	"days_of_week" jsonb DEFAULT '[0,1,2,3,4,5,6]'::jsonb NOT NULL,
	"time_start" varchar(5),
	"time_end" varchar(5),
	"min_rate_cents" integer DEFAULT 0 NOT NULL,
	"shift_types" jsonb DEFAULT '["fill_in","half_day","weekend"]'::jsonb NOT NULL,
	"notify_channels" jsonb DEFAULT '["push","email"]'::jsonb NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_od_id_optometrists_id_fk" FOREIGN KEY ("od_id") REFERENCES "public"."optometrists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_od_id_optometrists_id_fk" FOREIGN KEY ("od_id") REFERENCES "public"."optometrists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_ods" ADD CONSTRAINT "favorite_ods_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_ods" ADD CONSTRAINT "favorite_ods_od_id_optometrists_id_fk" FOREIGN KEY ("od_id") REFERENCES "public"."optometrists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "followed_practices" ADD CONSTRAINT "followed_practices_od_id_optometrists_id_fk" FOREIGN KEY ("od_id") REFERENCES "public"."optometrists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "followed_practices" ADD CONSTRAINT "followed_practices_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_od_id_optometrists_id_fk" FOREIGN KEY ("od_id") REFERENCES "public"."optometrists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_posted_by_user_id_users_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread_participants" ADD CONSTRAINT "thread_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_context_booking_id_bookings_id_fk" FOREIGN KEY ("context_booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_context_shift_id_shifts_id_fk" FOREIGN KEY ("context_shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "watch_zones" ADD CONSTRAINT "watch_zones_od_id_optometrists_id_fk" FOREIGN KEY ("od_id") REFERENCES "public"."optometrists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "applications_shift_od_idx" ON "applications" USING btree ("shift_id","od_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_shift_idx" ON "bookings" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_thread_idx" ON "messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ods_verification_idx" ON "optometrists" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_od_idx" ON "payouts" USING btree ("od_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subs_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_booking_author_idx" ON "reviews" USING btree ("booking_id","author_role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_published_idx" ON "reviews" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_status_idx" ON "shifts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_starts_idx" ON "shifts" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_practice_idx" ON "shifts" USING btree ("practice_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watch_zones_od_idx" ON "watch_zones" USING btree ("od_id");