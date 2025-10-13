import { FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Validates environment and prepares test infrastructure
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Setup...');

  // Validate environment variables
  validateE2EEnvironment();

  // Create artifacts directory
  const { mkdirSync } = await import('fs');
  const { join } = await import('path');

  const artifactsDir = join(process.cwd(), 'e2e/artifacts');
  mkdirSync(artifactsDir, { recursive: true });

  console.log('✅ E2E Setup Complete');
}

/**
 * Centralized environment variable validation
 * Based on your review feedback for better organization
 */
export const validateE2EEnvironment = () => {
  const requiredBase = [
    'E2E_APP_DEPLOYMENT_URL'
  ];

  const requiredFixture = [
    'E2E_TEST_REPO_GITHUB_PAT', // Optional for fixture tests, but recommended
  ];

  const requiredBlockchain = [
    'EVM_RPC_URL',
    'WALLET_PRIVATE_KEY',
    'SIGNAL_CONTRACT',
    'ARAGON_ADMIN_PLUGIN_CONTRACT',
    'E2E_DAO_ADDRESS',
    'E2E_TEST_REPO',
    'E2E_TEST_REPO_GITHUB_PAT'
  ];

  // Always validate base requirements
  const missingBase = requiredBase.filter(key => !process.env[key]);
  if (missingBase.length > 0) {
    throw new Error(`Missing required base env vars: ${missingBase.join(', ')}`);
  }

  // Validate blockchain requirements if running blockchain tests
  const runningBlockchainTests = process.argv.some(arg =>
    arg.includes('blockchain-integration')
  ) && !process.argv.some(arg => arg.includes('fixture-replay'));

  if (runningBlockchainTests) {
    const missingBlockchain = requiredBlockchain.filter(key => !process.env[key]);
    if (missingBlockchain.length > 0) {
      throw new Error(`Missing required blockchain env vars: ${missingBlockchain.join(', ')}`);
    }

    console.log('✅ Blockchain environment validated');
    console.log(`- RPC: ${process.env.EVM_RPC_URL?.substring(0, 50)}...`);
    console.log(`- DAO: ${process.env.E2E_DAO_ADDRESS}`);
    console.log(`- CogniSignal: ${process.env.SIGNAL_CONTRACT}`);
    console.log(`- Admin Plugin: ${process.env.ARAGON_ADMIN_PLUGIN_CONTRACT}`);
  }

  console.log('✅ Base environment validated');
  console.log(`- App URL: ${process.env.E2E_APP_DEPLOYMENT_URL}`);
  console.log(`- GitHub PAT: ${process.env.E2E_TEST_REPO_GITHUB_PAT ? 'Set' : 'Not set (optional for fixtures)'}`);
};

/**
 * Test data configuration
 * Centralized test parameters for consistency
 */
export const getTestConfig = () => {
  return {
    // App configuration
    APP_URL: process.env.E2E_APP_DEPLOYMENT_URL!,

    // GitHub configuration
    TEST_REPO: process.env.E2E_TEST_REPO || 'derekg1729/test-repo',
    GITHUB_TOKEN: process.env.E2E_TEST_REPO_GITHUB_PAT,

    // Blockchain configuration (only if running blockchain tests)
    EVM_RPC_URL: process.env.EVM_RPC_URL,
    PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
    SIGNAL_CONTRACT: process.env.SIGNAL_CONTRACT,
    ARAGON_ADMIN_PLUGIN_CONTRACT: process.env.ARAGON_ADMIN_PLUGIN_CONTRACT,
    DAO_ADDRESS: process.env.E2E_DAO_ADDRESS,

    // Test timeouts
    WEBHOOK_TIMEOUT_MS: parseInt(process.env.E2E_WEBHOOK_TIMEOUT_MS || '120000'),
    POLL_INTERVAL_MS: parseInt(process.env.E2E_POLL_INTERVAL_MS || '5000'),
  };
};

export default globalSetup;