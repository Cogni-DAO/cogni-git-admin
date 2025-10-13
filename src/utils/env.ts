// src/utils/env.ts - Simple environment validation with required variables
import { z } from 'zod';

// Required environment variables - these MUST be present
const requiredEnvSchema = z.object({
  // GitHub App Configuration
  APP_ID: z.coerce.number().min(1),
  PRIVATE_KEY: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(1),

  // Blockchain Configuration  
  CHAIN_ID: z.coerce.number().min(1),
  SIGNAL_CONTRACT: z.string().min(1),
  ALLOWED_DAO: z.string().min(1),
  EVM_RPC_URL: z.string().url(),

  // Alchemy (for webhook verification)
  ALCHEMY_SIGNING_KEY: z.string().min(1),
});

// Optional environment variables with defaults
const optionalEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  // Optional GitHub
  WEBHOOK_PROXY_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

});

const envSchema = requiredEnvSchema.merge(optionalEnvSchema);

// Validate environment on import
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Environment validation failed:');
  result.error.issues.forEach(issue => {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  throw new Error('Environment validation failed');
}

console.log('✅ Environment validation passed');

export const environment = result.data;