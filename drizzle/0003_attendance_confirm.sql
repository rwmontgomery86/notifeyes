ALTER TABLE "bookings" ADD COLUMN "attendance_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "attendance_confirmed_by_user_id" uuid;