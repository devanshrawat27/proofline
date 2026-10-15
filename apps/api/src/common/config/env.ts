import "dotenv/config";
import { z } from "zod";

/**
 * Central, validated environment configuration. The app fails fast at startup
 * with a safe, actionable message if required variables are missing or invalid.
 * Never logs secret values.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  REDIS_URL: z.string().url().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("Proofline <no-reply@proofline.local>"),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((value) => value !== "false"),

  SESSION_COOKIE_NAME: z.string().min(1).default("proofline_session"),
  SUPPLIER_COOKIE_NAME: z.string().min(1).default("proofline_supplier_session"),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters")
    .default("dev-only-change-me-please-generate-a-real-48-byte-secret"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),

  API_PORT: z.coerce.number().int().positive().default(Number(process.env.PORT) || 4000),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  WEB_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  AI_PROVIDER: z.enum(["gemini", "none"]).default("none"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(3),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    // Safe failure: names and messages only, never secret values.
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const value = parsed.data;
  if (value.NODE_ENV === "production") {
    if (value.SESSION_SECRET.startsWith("dev-only")) {
      throw new Error("SESSION_SECRET must be set to a strong secret in production.");
    }
  }
  cached = value;
  return value;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";

export const corsAllowedOrigins = env.CORS_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
