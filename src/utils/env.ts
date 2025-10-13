import { z } from "zod";

/** helpers */
const isEthAddr = /^0x[a-fA-F0-9]{40}$/;

// Check if we're in development/test mode (for CI/testing environments)
// In development/test, make required fields optional to allow testing without production secrets
// This prevents CI failures when imports trigger environment validation
const isDevelopmentMode = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test");

/** base required for app runtime (prod, preview, dev) */
const baseSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  APP_ENV: z.enum(["dev","preview","prod"]).default("dev"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["trace","debug","info","warn","error","fatal"]).default("info"),

  // GitHub App (required in production, optional in dev/test)
  // Note: PRIVATE_KEY is handled entirely by Probot framework, not accessible via env.ts
  APP_ID: isDevelopmentMode ? z.coerce.number().int().positive().optional() : z.coerce.number().int().positive(),
  WEBHOOK_SECRET: isDevelopmentMode ? z.string().optional() : z.string().min(1),
  GITHUB_CLIENT_ID: isDevelopmentMode ? z.string().optional() : z.string().min(1),
  GITHUB_CLIENT_SECRET: isDevelopmentMode ? z.string().optional() : z.string().min(1),

  // Chain core (required in production, optional in dev/test)
  CHAIN_ID: isDevelopmentMode ? z.coerce.number().int().positive().optional() : z.coerce.number().int().positive(),
  SIGNAL_CONTRACT: isDevelopmentMode ? z.string().optional() : z.string().regex(isEthAddr, "invalid EVM address"),
  DAO_ADDRESS: isDevelopmentMode ? z.string().optional() : z.string().regex(isEthAddr, "invalid EVM address"),
  EVM_RPC_URL: isDevelopmentMode ? z.string().optional() : z.string().url(),

  // Webhook verification (required in production, optional in dev/test)
  ALCHEMY_SIGNING_KEY: isDevelopmentMode ? z.string().optional() : z.string().min(1),
});

/** dev-only knobs (optional) */
const devSchema = z.object({
  WEBHOOK_PROXY_URL: z.string().url().optional(),
  ALCHEMY_PROXY_URL: z.string().url().optional(),
  CAPTURE_PORT: z.coerce.number().int().positive().default(4001),
  FIXTURE_CAPTURE_DIR: z.string().default("./test/fixtures"),
});


/** build conditional schema */
const schema = baseSchema.merge(devSchema);

/** validate once, on import */
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Environment validation failed:");
  for (const i of parsed.error.issues) console.error(` - ${i.path.join(".")}: ${i.message}`);
  throw new Error("env: invalid configuration");
}

const env = parsed.data;

/** safe log in non-prod */
if (env.APP_ENV !== "prod") {
  console.info("env ok:", {
    APP_ENV: env.APP_ENV,
    NODE_ENV: env.NODE_ENV,
    APP_ID: env.APP_ID,
    CHAIN_ID: env.CHAIN_ID,
    SIGNAL_CONTRACT: env.SIGNAL_CONTRACT,
    DAO_ADDRESS: env.DAO_ADDRESS,
  });
}

export type Env = z.infer<typeof schema>;
export const environment: Env = env;