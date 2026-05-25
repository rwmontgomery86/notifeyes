CREATE TABLE IF NOT EXISTS "od_practice_blocks" (
	"od_id" uuid NOT NULL,
	"practice_id" uuid NOT NULL,
	"blocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "od_practice_blocks_od_id_practice_id_pk" PRIMARY KEY("od_id","practice_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_opted_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_opted_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "od_practice_blocks" ADD CONSTRAINT "od_practice_blocks_od_id_optometrists_id_fk" FOREIGN KEY ("od_id") REFERENCES "public"."optometrists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "od_practice_blocks" ADD CONSTRAINT "od_practice_blocks_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
