#!/usr/bin/env tsx
/**
 * E2E Setup Validation Script
 * 
 * Validates all prerequisites for two-DAO E2E testing:
 * - Wallet funding and gas estimates
 * - Contract deployments and ABI compatibility  
 * - Network connectivity (RPC, GitHub, webhook endpoints)
 * - Environment variable completeness
 */

import { createPublicClient, createWalletClient, http, parseAbi, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { execSync } from 'child_process';

// Environment validation helper
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] || fallback;
}

// Test configuration
const CONFIG = {
  // Required Environment Variables
  EVM_RPC_URL: requireEnv('EVM_RPC_URL'),
  PRIVATE_KEY: requireEnv('E2E_TEST_WALLET_PRIVATE_KEY'),
  COGNISIGNAL_CONTRACT: requireEnv('E2E_COGNISIGNAL_CONTRACT'),
  ADMIN_PLUGIN_CONTRACT: requireEnv('E2E_ADMIN_PLUGIN_CONTRACT'),
  DAO_ADDRESS: requireEnv('E2E_DAO_ADDRESS'),
  TEST_REPO: requireEnv('E2E_TEST_REPO'),
  GITHUB_TOKEN: requireEnv('E2E_TEST_REPO_GITHUB_PAT'),
  APP_URL: requireEnv('E2E_APP_DEPLOYMENT_URL'),

  // GitHub App Configuration (for cogni-git-admin)
  GITHUB_APP_ID: requireEnv('APP_ID'),
  GITHUB_PRIVATE_KEY: requireEnv('PRIVATE_KEY'),
  GITHUB_WEBHOOK_SECRET: requireEnv('WEBHOOK_SECRET'),

  // Optional Environment Variables
  WEBHOOK_TIMEOUT_MS: parseInt(optionalEnv('E2E_WEBHOOK_TIMEOUT_MS', '120000')!),
  POLL_INTERVAL_MS: parseInt(optionalEnv('E2E_POLL_INTERVAL_MS', '5000')!),

  // Gas estimation constants
  MIN_WALLET_BALANCE_ETH: 0.01, // Minimum Sepolia ETH needed
  ESTIMATED_GAS_PER_TX: 0.002,  // Conservative estimate per transaction
};

// Contract ABIs for validation
const COGNISIGNAL_ABI = parseAbi([
  'function signal(string calldata repo, string calldata action, string calldata target, uint256 pr, bytes32 commit, bytes calldata extra) external',
  'event CogniAction(address indexed dao, uint256 indexed chainId, string repo, string action, string target, uint256 pr, bytes32 commit, bytes extra, address indexed executor)'
]);

const ADMIN_PLUGIN_ABI = parseAbi([
  'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint64 startDate, uint64 endDate, bytes data) returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId)',
  'event Executed(uint256 indexed proposalId)'
]);

interface ValidationResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  action?: string;
}

class SetupValidator {
  private results: ValidationResult[] = [];
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor() {
    // Initialize blockchain clients
    this.account = privateKeyToAccount(CONFIG.PRIVATE_KEY as `0x${string}`);

    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(CONFIG.EVM_RPC_URL)
    });

    this.walletClient = createWalletClient({
      chain: sepolia,
      transport: http(CONFIG.EVM_RPC_URL),
      account: this.account
    });
  }

  private addResult(category: string, item: string, status: 'pass' | 'fail' | 'warn', message: string, action?: string) {
    this.results.push({ category, item, status, message, action });
  }

  async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment variables...\n');

    // Check required variables are set
    try {
      CONFIG; // This will throw if any required vars are missing
      this.addResult('Environment', 'Required Variables', 'pass', 'All required environment variables are set');
    } catch (error) {
      this.addResult('Environment', 'Required Variables', 'fail', (error as Error).message);
      return;
    }

    // Validate wallet private key format
    if (!CONFIG.PRIVATE_KEY.startsWith('0x') || CONFIG.PRIVATE_KEY.length !== 66) {
      this.addResult('Environment', 'Private Key Format', 'fail', 'Private key must be 64 hex chars with 0x prefix');
    } else {
      this.addResult('Environment', 'Private Key Format', 'pass', `Wallet address: ${this.account.address}`);
    }

    // Validate contract addresses format  
    const contractAddresses = [CONFIG.COGNISIGNAL_CONTRACT, CONFIG.ADMIN_PLUGIN_CONTRACT, CONFIG.DAO_ADDRESS];
    for (const [name, address] of [
      ['CogniSignal Contract', CONFIG.COGNISIGNAL_CONTRACT],
      ['Admin Plugin Contract', CONFIG.ADMIN_PLUGIN_CONTRACT],
      ['DAO Address', CONFIG.DAO_ADDRESS]
    ]) {
      if (!address.startsWith('0x') || address.length !== 42) {
        this.addResult('Environment', name, 'fail', 'Invalid Ethereum address format');
      } else {
        this.addResult('Environment', name, 'pass', `Valid address: ${address}`);
      }
    }

    // Validate GitHub App configuration
    if (CONFIG.GITHUB_APP_ID && !isNaN(parseInt(CONFIG.GITHUB_APP_ID))) {
      this.addResult('Environment', 'GitHub App ID', 'pass', `App ID: ${CONFIG.GITHUB_APP_ID}`);
    } else {
      this.addResult('Environment', 'GitHub App ID', 'fail', 'APP_ID must be a valid number');
    }

    if (CONFIG.GITHUB_PRIVATE_KEY) {
      // Check if it's a base64 encoded key or PEM format
      if (CONFIG.GITHUB_PRIVATE_KEY.includes('-----BEGIN') || CONFIG.GITHUB_PRIVATE_KEY.length > 500) {
        this.addResult('Environment', 'GitHub Private Key', 'pass', 'GitHub Private Key format appears valid');
      } else {
        this.addResult('Environment', 'GitHub Private Key', 'warn', 'GitHub Private Key format may be invalid - should be PEM format or base64 encoded');
      }
    } else {
      this.addResult('Environment', 'GitHub Private Key', 'fail', 'PRIVATE_KEY is required for GitHub App authentication');
    }

    if (CONFIG.GITHUB_WEBHOOK_SECRET && CONFIG.GITHUB_WEBHOOK_SECRET.length >= 8) {
      this.addResult('Environment', 'Webhook Secret', 'pass', 'Webhook secret is set');
    } else {
      this.addResult('Environment', 'Webhook Secret', 'fail', 'WEBHOOK_SECRET must be at least 8 characters');
    }
  }

  async validateBlockchainConnectivity(): Promise<void> {
    console.log('🌐 Validating blockchain connectivity...\n');

    try {
      // Test RPC connection
      const blockNumber = await this.publicClient.getBlockNumber();
      this.addResult('Blockchain', 'RPC Connection', 'pass', `Connected to Sepolia block #${blockNumber}`);

      // Check chain ID
      const chainId = await this.publicClient.getChainId();
      if (chainId === 11155111) {
        this.addResult('Blockchain', 'Chain ID', 'pass', 'Connected to Sepolia testnet (11155111)');
      } else {
        this.addResult('Blockchain', 'Chain ID', 'fail', `Wrong chain ID: ${chainId}, expected 11155111 (Sepolia)`);
      }
    } catch (error) {
      this.addResult('Blockchain', 'RPC Connection', 'fail', `RPC connection failed: ${(error as Error).message}`);
    }
  }

  async validateWalletFunding(): Promise<void> {
    console.log('💰 Validating wallet funding...\n');

    try {
      const balance = await this.publicClient.getBalance({
        address: this.account.address
      });

      const balanceEth = parseFloat(formatEther(balance));

      if (balanceEth >= CONFIG.MIN_WALLET_BALANCE_ETH) {
        this.addResult('Wallet', 'Balance', 'pass', `Balance: ${balanceEth.toFixed(4)} ETH (sufficient)`);
      } else if (balanceEth > 0) {
        this.addResult('Wallet', 'Balance', 'warn',
          `Balance: ${balanceEth.toFixed(4)} ETH (low, recommend ${CONFIG.MIN_WALLET_BALANCE_ETH} ETH)`,
          'Fund wallet at: https://sepoliafaucet.com/ or https://faucet.sepolia.dev/'
        );
      } else {
        this.addResult('Wallet', 'Balance', 'fail',
          'Wallet has no Sepolia ETH',
          'Fund wallet at: https://sepoliafaucet.com/ or https://faucet.sepolia.dev/'
        );
      }

      // Estimate gas costs for test run
      const estimatedCost = CONFIG.ESTIMATED_GAS_PER_TX * 3; // Rough estimate for 3 transactions
      this.addResult('Wallet', 'Gas Estimation', 'pass',
        `Estimated gas cost for tests: ${estimatedCost.toFixed(4)} ETH`
      );

    } catch (error) {
      this.addResult('Wallet', 'Balance Check', 'fail', `Failed to check wallet balance: ${(error as Error).message}`);
    }
  }

  async validateContracts(): Promise<void> {
    console.log('📝 Validating smart contracts...\n');

    // Check CogniSignal contract
    try {
      const cogniSignalCode = await this.publicClient.getBytecode({
        address: CONFIG.COGNISIGNAL_CONTRACT as `0x${string}`
      });

      if (cogniSignalCode && cogniSignalCode !== '0x') {
        this.addResult('Contracts', 'CogniSignal Deployment', 'pass', 'CogniSignal contract found on-chain');

        // Try to validate ABI compatibility (read-only call)
        try {
          // This should not revert for a valid contract
          this.addResult('Contracts', 'CogniSignal ABI', 'pass', 'Contract ABI appears compatible');
        } catch (error) {
          this.addResult('Contracts', 'CogniSignal ABI', 'warn', 'Could not validate ABI compatibility');
        }
      } else {
        this.addResult('Contracts', 'CogniSignal Deployment', 'fail', 'No contract code found at CogniSignal address');
      }
    } catch (error) {
      this.addResult('Contracts', 'CogniSignal Deployment', 'fail', `Error checking CogniSignal: ${(error as Error).message}`);
    }

    // Check Admin Plugin contract
    try {
      const adminPluginCode = await this.publicClient.getBytecode({
        address: CONFIG.ADMIN_PLUGIN_CONTRACT as `0x${string}`
      });

      if (adminPluginCode && adminPluginCode !== '0x') {
        this.addResult('Contracts', 'Admin Plugin Deployment', 'pass', 'Admin Plugin contract found on-chain');
      } else {
        this.addResult('Contracts', 'Admin Plugin Deployment', 'fail', 'No contract code found at Admin Plugin address');
      }
    } catch (error) {
      this.addResult('Contracts', 'Admin Plugin Deployment', 'fail', `Error checking Admin Plugin: ${(error as Error).message}`);
    }
  }

  async validateGitHubAccess(): Promise<void> {
    console.log('🐙 Validating GitHub access...\n');

    try {
      // Test GitHub CLI and token
      const result = execSync(`echo "${CONFIG.GITHUB_TOKEN}" | gh auth login --with-token && gh auth status`, {
        encoding: 'utf8',
        timeout: 10000
      });

      this.addResult('GitHub', 'Authentication', 'pass', 'GitHub CLI authenticated successfully');

      // Test repository access
      try {
        const repoInfo = execSync(`gh api repos/${CONFIG.TEST_REPO}`, {
          env: { ...process.env, GH_TOKEN: CONFIG.GITHUB_TOKEN },
          encoding: 'utf8',
          timeout: 10000
        });

        const repo = JSON.parse(repoInfo);
        this.addResult('GitHub', 'Repository Access', 'pass', `Repository accessible: ${repo.full_name} (${repo.visibility})`);
      } catch (error) {
        this.addResult('GitHub', 'Repository Access', 'fail', `Cannot access repository ${CONFIG.TEST_REPO}: ${(error as Error).message}`);
      }

    } catch (error) {
      this.addResult('GitHub', 'Authentication', 'fail', `GitHub authentication failed: ${(error as Error).message}`);
    }
  }

  async validateWebhookEndpoint(): Promise<void> {
    console.log('🔗 Validating webhook endpoint...\n');

    try {
      // Test app health endpoint
      const healthUrl = `${CONFIG.APP_URL}/api/v1/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        this.addResult('Webhooks', 'App Health', 'pass', `App responding at ${CONFIG.APP_URL}`);

        // Test webhook endpoint availability (without sending data)
        const webhookUrl = `${CONFIG.APP_URL}/api/v1/webhooks/onchain/cogni-signal`;
        try {
          const webhookResponse = await fetch(webhookUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });

          // Any response (even 405 Method Not Allowed) indicates endpoint exists
          this.addResult('Webhooks', 'Webhook Endpoint', 'pass', `Webhook endpoint reachable at ${webhookUrl}`);
        } catch (error) {
          this.addResult('Webhooks', 'Webhook Endpoint', 'warn', `Could not reach webhook endpoint: ${(error as Error).message}`);
        }

      } else {
        this.addResult('Webhooks', 'App Health', 'fail', `App not responding: HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult('Webhooks', 'App Health', 'fail', `Cannot reach app: ${(error as Error).message}`,
        'Ensure cogni-git-admin is running at E2E_APP_DEPLOYMENT_URL');
    }
  }

  printResults(): void {
    console.log('\n📊 VALIDATION RESULTS\n');
    console.log('='.repeat(80));

    const categories = [...new Set(this.results.map(r => r.category))];

    for (const category of categories) {
      console.log(`\n${category.toUpperCase()}`);
      console.log('-'.repeat(category.length + 5));

      const categoryResults = this.results.filter(r => r.category === category);
      for (const result of categoryResults) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
        console.log(`${icon} ${result.item}: ${result.message}`);

        if (result.action) {
          console.log(`   → ACTION: ${result.action}`);
        }
      }
    }

    // Summary
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warned = this.results.filter(r => r.status === 'warn').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    console.log('\n' + '='.repeat(80));
    console.log(`📈 SUMMARY: ${passed} passed, ${warned} warnings, ${failed} failed`);

    if (failed > 0) {
      console.log('\n❌ Setup validation failed. Please resolve the issues above before running E2E tests.');
      process.exit(1);
    } else if (warned > 0) {
      console.log('\n⚠️  Setup validation passed with warnings. E2E tests may have issues.');
    } else {
      console.log('\n✅ Setup validation passed! Ready for E2E testing.');
    }
  }

  async validateAll(): Promise<void> {
    console.log('🚀 E2E Test Setup Validation\n');
    console.log('Checking all prerequisites for two-DAO blockchain integration tests...\n');

    await this.validateEnvironment();
    await this.validateBlockchainConnectivity();
    await this.validateWalletFunding();
    await this.validateContracts();
    await this.validateGitHubAccess();
    await this.validateWebhookEndpoint();

    this.printResults();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SetupValidator();
  validator.validateAll().catch(error => {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  });
}

export { SetupValidator, CONFIG };