import { z } from "zod";

const envSchema = z.object({
  // Server-side only (Next.js keeps these out of the browser)
  SUPABASE_URL: z.string().url({ message: "Must be a valid URL" }),
  SUPABASE_ANON_KEY: z.string().min(1, { message: "Supabase Anon Key is required" }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, { message: "Supabase Service Role Key is required" }),

  // Sentry (optional during development)
  SENTRY_DSN: z.string().url({ message: "Must be a valid Sentry DSN URL" }).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url({ message: "Must be a valid Sentry DSN URL" }).optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Environment tracking
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// Parse the current process.env against our schema
const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    envParsed.error.flatten().fieldErrors
  );
  throw new Error("Missing or invalid environment variables. Check your .env file or Vercel dashboard.");
}

// Export the validated environment variables for use across your app
export const env = envParsed.data;