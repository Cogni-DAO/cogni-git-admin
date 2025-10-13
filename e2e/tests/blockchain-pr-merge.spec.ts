/**
 * Complete E2E Test: DAO Vote → PR Merge
 * 
 * Tests the full workflow:
 * 1. Create test PR via GitHub API
 * 2. Execute DAO vote on Sepolia (CogniSignal.signal())
 * 3. Wait for Alchemy webhook → cogni-git-admin
 * 4. Verify PR gets merged by cogni-git-admin
 */
import { test, expect } from '@playwright/test';
import { createPublicClient, createWalletClient, http, parseAbi, getContract, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { execSync } from 'child_process';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { testConfig } from '../helpers/test-config';

// Contract ABI from CogniSignal.sol
const cogniSignalAbi = parseAbi([
  'function signal(string calldata repo, string calldata action, string calldata target, uint256 pr, bytes32 commit, bytes calldata extra) external',
  'event CogniAction(address indexed dao, uint256 indexed chainId, string repo, string action, string target, uint256 pr, bytes32 commit, bytes extra, address indexed executor)'
]);

// Admin Plugin ABI from Aragon (matching successful transaction)
const adminPluginAbi = parseAbi([
  'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint64 startDate, uint64 endDate, bytes data) returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId)',
  'event Executed(uint256 indexed proposalId)'
]);


function sh(cmd: string, opts: any = {}) {
  return execSync(cmd, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...opts
  }).trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test.describe('Complete E2E: DAO Vote → PR Merge', () => {
  let publicClient: any;
  let walletClient: any;
  let adminPlugin: any;

  test.beforeAll(async () => {
    // Validate required environment variables
    const requiredEnvVars = [
      'SIGNAL_CONTRACT',
      'ARAGON_ADMIN_PLUGIN_CONTRACT',
      'DAO_ADDRESS',
      'EVM_RPC_URL',
      'WALLET_PRIVATE_KEY',
      'E2E_TEST_REPO',
      'E2E_TEST_REPO_GITHUB_PAT',
      'E2E_APP_DEPLOYMENT_URL'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // E2E_APP_URL can be localhost for development or deployed URL for CI/production

    // Setup blockchain clients
    publicClient = createPublicClient({
      chain: sepolia,
      transport: http(testConfig.EVM_RPC_URL),
    });

    const account = privateKeyToAccount(testConfig.PRIVATE_KEY as `0x${string}`);

    walletClient = createWalletClient({
      chain: sepolia,
      transport: http(testConfig.EVM_RPC_URL),
      account,
    });

    // Setup admin plugin contract interface
    adminPlugin = getContract({
      address: testConfig.ADMIN_PLUGIN_CONTRACT as `0x${string}`,
      abi: adminPluginAbi,
      client: walletClient,
    });

    console.log(`✅ E2E Setup Complete`);
    console.log(`- Contract: ${testConfig.SIGNAL_CONTRACT}`);
    console.log(`- DAO: ${testConfig.DAO_ADDRESS}`);
    console.log(`- Test Repo: ${testConfig.TEST_REPO}`);
    console.log(`- App URL: ${testConfig.E2E_APP_URL}`);
  });

  test('should complete DAO vote → PR merge workflow', async () => {
    const timestamp = Date.now();
    const branch = `e2e-test-${timestamp}`;
    const tempDir = mkdtempSync(join(tmpdir(), 'cogni-e2e-'));
    let prNumber: string | null = null;

    try {
      // === PHASE 1: Create Test PR ===
      console.log('📝 Creating test PR...');

      const envWithToken = { ...process.env, GH_TOKEN: testConfig.GITHUB_TOKEN };

      // Clone repo and create test change
      sh(`gh repo clone ${testConfig.TEST_REPO} ${tempDir}`, { env: envWithToken });
      sh(`git -C ${tempDir} switch -c ${branch}`);

      const testContent = `E2E test change ${new Date().toISOString()}`;
      sh(`echo '${testContent}' > ${tempDir}/.e2e-test.txt`);
      sh(`git -C ${tempDir} add .e2e-test.txt`);
      sh(`git -C ${tempDir} -c user.name='cogni-e2e-bot' -c user.email='e2e@cogni.test' commit -m 'e2e: test PR for DAO vote'`);
      sh(`git -C ${tempDir} push origin ${branch}`);

      // Create PR
      const prUrl = sh(`gh pr create -R ${testConfig.TEST_REPO} --title "E2E Test PR ${timestamp}" --body "Auto-created for E2E testing - will be merged by DAO vote" --base main --head ${branch}`, { env: envWithToken });
      prNumber = prUrl.split('/').pop()!;

      console.log(`✅ Created PR #${prNumber}: ${prUrl}`);

      // === PHASE 2: Execute DAO Vote on Sepolia ===
      console.log('🗳️  Executing DAO vote on Sepolia...');

      // Check wallet balance
      const balance = await publicClient.getBalance({
        address: walletClient.account.address
      });
      console.log(`Wallet balance: ${balance.toString()} wei`);

      if (balance === BigInt(0)) {
        throw new Error('Test wallet has no Sepolia ETH for gas');
      }

      // Create proposal to execute signal() function
      const actions = [{
        to: testConfig.SIGNAL_CONTRACT,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: cogniSignalAbi,
          functionName: 'signal',
          args: [
            testConfig.TEST_REPO,    // repo
            'PR_APPROVE',             // action  
            'pull_request',           // target
            BigInt(prNumber),         // pr number
            ('0x' + '0'.repeat(64)) as `0x${string}`,    // commit (placeholder)
            '0x'                      // extra data
          ]
        })
      }];

      const txHash = await adminPlugin.write.createProposal([
        '0x',                    // metadata (empty)
        actions,                 // encoded signal() call
        BigInt(0),               // startDate (immediate)
        BigInt(0),               // endDate (immediate execution)
        '0x'                     // data (empty, matching successful tx)
      ]);

      console.log(`📤 Admin proposal transaction: ${txHash}`);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Verify CogniAction event was emitted (from the executed proposal)
      const cogniActionLog = receipt.logs.find((log: any) =>
        log.address.toLowerCase() === testConfig.SIGNAL_CONTRACT.toLowerCase()
      );

      if (!cogniActionLog) {
        throw new Error('CogniAction event not found in transaction logs - proposal may not have executed');
      }

      console.log('✅ CogniAction event emitted via proposal execution');

      // === PHASE 3: Wait for Webhook Processing & PR Merge ===
      console.log('⏳ Waiting for Alchemy webhook → cogni-git-admin → PR merge...');

      let merged = false;
      const startTime = Date.now();

      while (!merged && (Date.now() - startTime) < testConfig.WEBHOOK_TIMEOUT_MS) {
        // Check PR status
        const prStatusJson = sh(`gh api repos/${testConfig.TEST_REPO}/pulls/${prNumber}`, { env: envWithToken });
        const prStatus = JSON.parse(prStatusJson);

        console.log(`PR #${prNumber} state: ${prStatus.state}, merged: ${prStatus.merged}`);

        if (prStatus.merged) {
          merged = true;
          console.log(`🎉 SUCCESS: PR #${prNumber} merged by cogni-git-admin!`);

          // Get merge commit info for validation
          console.log(`Merge commit: ${prStatus.merge_commit_sha}`);
          console.log(`Merged by: ${prStatus.merged_by?.login || 'unknown'}`);
          break;
        }

        await sleep(testConfig.POLL_INTERVAL_MS);
      }

      // === PHASE 4: Validation ===
      if (!merged) {
        // Get logs for debugging
        try {
          const logs = sh(`curl -s ${testConfig.E2E_APP_URL}/api/v1/health`);
          console.log('App health check:', logs);
        } catch (e) {
          console.log('Could not fetch app logs');
        }

        throw new Error(`TIMEOUT: PR #${prNumber} was not merged within ${testConfig.WEBHOOK_TIMEOUT_MS / 1000}s`);
      }

      // Success! 🎉
      expect(merged).toBe(true);

    } finally {
      // === CLEANUP ===
      if (prNumber && testConfig.GITHUB_TOKEN) {
        try {
          console.log('🧹 Cleaning up test branch...');
          const envWithToken = { ...process.env, GH_TOKEN: testConfig.GITHUB_TOKEN };

          // Since PR was merged, just delete the branch
          sh(`git push origin --delete ${branch}`, {
            cwd: tempDir,
            env: envWithToken
          });
          console.log(`✅ Deleted branch ${branch}`);
        } catch (cleanupErr) {
          console.warn('⚠️  Branch cleanup failed:', cleanupErr);
        }
      }

      // Always cleanup temp directory
      try {
        execSync(`rm -rf "${tempDir}"`, { stdio: 'ignore' });
        console.log('✅ Cleaned up temp directory');
      } catch (cleanupErr) {
        console.warn('⚠️  Temp directory cleanup failed:', cleanupErr);
      }
    }
  }, 300_000); // 5 minute timeout
});