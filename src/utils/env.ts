import { z } from "zod";

/** helpers */
const isEthAddr = /^0x[a-fA-F0-9]{40}$/;
const redact = (v: string) => (v?.length > 8 ? `${v.slice(0,4)}…${v.slice(-4)}` : "set");

/** base required for app runtime (prod, preview, dev) */
const baseSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  APP_ENV: z.enum(["dev","preview","prod"]).default("dev"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["trace","debug","info","warn","error","fatal"]).default("info"),

  // GitHub App (all required)
  APP_ID: z.coerce.number().int().positive(),
  PRIVATE_KEY: z.string().min(1).transform((s) => {
    const t = s.trim();
    if (t.includes("BEGIN RSA")) return t; // already PEM
    // allow single-line PK from env providers
    return `-----BEGIN RSA PRIVATE KEY-----\n${t}\n-----END RSA PRIVATE KEY-----`;
  }),
  WEBHOOK_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  // Chain core (app needs to parse and verify signals)
  CHAIN_ID: z.coerce.number().int().positive(),
  SIGNAL_CONTRACT: z.string().regex(isEthAddr, "invalid EVM address"),
  DAO_ADDRESS: z.string().regex(isEthAddr, "invalid EVM address"),
  EVM_RPC_URL: z.string().url(),

  // Webhook verification
  ALCHEMY_SIGNING_KEY: z.string().min(1),
});

/** dev-only knobs (optional) */
const devSchema = z.object({
  WEBHOOK_PROXY_URL: z.string().url().optional(),
  ALCHEMY_PROXY_URL: z.string().url().optional(),
  CAPTURE_PORT: z.coerce.number().int().positive().default(4001),
  FIXTURE_CAPTURE_DIR: z.string().default("./test/fixtures"),
});

/** test/E2E-only. Required only when NODE_ENV=test or E2E_ENABLED=1 */
const e2eSchema = z.object({
  // infra targets
  E2E_APP_DEPLOYMENT_URL: z.string().url(),
  E2E_TEST_REPO: z.string().regex(/^[^/]+\/[^/]+$/, 'format "owner/repo"'),
  E2E_TEST_REPO_GITHUB_PAT: z.string().min(1),

  // chain bits used by tests, not by app boot
  ARAGON_ADMIN_PLUGIN_CONTRACT: z.string().regex(isEthAddr, "invalid EVM address"),
  WALLET_PRIVATE_KEY: z.string().min(1),

  // timings
  E2E_WEBHOOK_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  E2E_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  E2E_TEST_ADMIN_USERNAME: z.string().default("cogni-test-user"),
});

/** build conditional schema */
const wantsE2E = process.env.NODE_ENV === "test" || process.env.E2E_ENABLED === "1";

const schema = wantsE2E
  ? baseSchema.merge(devSchema).merge(e2eSchema)
  : baseSchema.merge(devSchema);

/** validate once, on import */
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Environment validation failed:");
  for (const i of parsed.error.issues) console.error(` - ${i.path.join(".")}: ${i.message}`);
  throw new Error("env: invalid configuration");
}

const env = parsed.data;

/** minimal redacted log in non-prod */
if (env.APP_ENV !== "prod") {
  const summary = {
    APP_ENV: env.APP_ENV,
    NODE_ENV: env.NODE_ENV,
    APP_ID: env.APP_ID,
    SIGNAL_CONTRACT: env.SIGNAL_CONTRACT,
    DAO_ADDRESS: env.DAO_ADDRESS,
    EVM_RPC_URL: env.EVM_RPC_URL,
    GITHUB_CLIENT_ID: redact(env.GITHUB_CLIENT_ID),
    PRIVATE_KEY: "loaded",
    WEBHOOK_SECRET: "set",
    ALCHEMY_SIGNING_KEY: "set",
    E2E_ENABLED: wantsE2E ? "1" : "0",
  };
  // eslint-disable-next-line no-console
  console.info("env ok:", summary);
}

export type Env = z.infer<typeof schema>;
export const environment: Env = env;