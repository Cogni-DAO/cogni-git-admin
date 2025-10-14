import { environment } from '../../src/utils/env';

export const testConfig = {
  // Blockchain Configuration (from app environment)
  SIGNAL_CONTRACT: environment.SIGNAL_CONTRACT,
  DAO_ADDRESS: environment.DAO_ADDRESS,
  EVM_RPC_URL: environment.EVM_RPC_URL,

  // E2E-specific Configuration (direct from process.env)
  ARAGON_ADMIN_PLUGIN_CONTRACT: process.env.ARAGON_ADMIN_PLUGIN_CONTRACT!,
  PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY!,
  TEST_REPO: process.env.E2E_TEST_REPO!,
  GITHUB_TOKEN: process.env.E2E_TEST_REPO_GITHUB_PAT!,
  E2E_APP_DEPLOYMENT_URL: process.env.E2E_APP_DEPLOYMENT_URL!,
  TEST_USERNAME: process.env.E2E_TEST_ADMIN_USERNAME || 'cogni-test-user',

  // Timeouts
  WEBHOOK_TIMEOUT_MS: parseInt(process.env.E2E_WEBHOOK_TIMEOUT_MS || '120000'),
  POLL_INTERVAL_MS: parseInt(process.env.E2E_POLL_INTERVAL_MS || '5000'),
} as const;