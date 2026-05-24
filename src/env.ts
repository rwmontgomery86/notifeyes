import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().optional(),
  EMAIL_FROM: z.string().default("NotifEyes <hello@notifeyes.local>"),
  RESEND_API_KEY: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@notifeyes.local"),
  WORKER_URL: z.string().url().optional(),
  NOTIFEYES_LAUNCH_METRO: z.string().default("sf_bay"),
  // --TODO: legal review --- flat-fee pricing per brief §8 (V1 placeholder)
  NOTIFEYES_MATCH_FEE_CENTS: z.coerce.number().int().min(0).default(999),
  NOTIFEYES_SAMEDAY_FEE_CENTS: z.coerce.number().int().min(0).default(1999),
  NOTIFEYES_SAMEDAY_THRESHOLD_HOURS: z.coerce.number().int().min(1).default(24),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
