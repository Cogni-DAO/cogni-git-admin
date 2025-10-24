/**
 * Complete E2E Test: DAO Admin Management
 * 
 * Tests the full admin management workflow:
 * 1. Execute ADD_ADMIN DAO vote on Sepolia (CogniSignal.signal())
 * 2. Wait for Alchemy webhook → cogni-git-admin  
 * 3. Verify user gets invited as admin (pending invitation)
 * 4. Execute REMOVE_ADMIN DAO vote on Sepolia
 * 5. Wait for Alchemy webhook → cogni-git-admin
 * 6. Verify pending invitation gets cancelled
 */
import { test, expect } from '@playwright/test';
import { createPublicClient, createWalletClient, http, parseAbi, getContract, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { execSync } from 'child_process';
import { testConfig } from '../helpers/test-config';

// Contract ABI from CogniSignal.sol
const cogniSignalAbi = parseAbi([
  'function signal(string calldata repoUrl, string calldata action, string calldata target, string calldata resource, bytes calldata extra) external',
  'event CogniAction(address indexed dao, uint256 indexed chainId, string repoUrl, string action, string target, string resource, bytes extra, address indexed executor)'
]);

// Admin Plugin ABI from Aragon (matching successful transaction)
const adminPluginAbi = parseAbi([
  'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint64 startDate, uint64 endDate, bytes data) returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId)',
  'event Executed(uint256 indexed proposalId)'
]);


// Helper to run shell commands with GitHub token
function sh(cmd: string, options: { env?: Record<string, string> } = {}) {
  console.log(`[E2E] Running: ${cmd}`);
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, ...options.env }
    }).trim();
  } catch (error: any) {
    console.error(`[E2E] Command failed: ${cmd}`);
    console.error(`[E2E] Error: ${error.message}`);
    console.error(`[E2E] Stdout: ${error.stdout}`);
    console.error(`[E2E] Stderr: ${error.stderr}`);
    throw error;
  }
}

// Validation
test.beforeAll(async () => {
  console.log('🚀 Starting E2E Admin Management Test Setup...');

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

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  console.log('✅ E2E Setup Complete');
  console.log(`- Contract: ${testConfig.SIGNAL_CONTRACT}`);
  console.log(`- DAO: ${testConfig.DAO_ADDRESS}`);
  console.log(`- Test Repo: ${testConfig.TEST_REPO}`);
  console.log(`- Test Username: ${testConfig.TEST_USERNAME}`);
  console.log(`- App URL: ${testConfig.E2E_APP_DEPLOYMENT_URL}`);
});

test.describe('Complete E2E: DAO Admin Management', () => {

  test('should complete ADD_ADMIN → REMOVE_ADMIN workflow', async () => {
    const envWithToken = { GITHUB_TOKEN: testConfig.GITHUB_TOKEN };
    const [owner, repo] = testConfig.TEST_REPO.split('/');

    // Setup blockchain clients
    const account = privateKeyToAccount(testConfig.PRIVATE_KEY as `0x${string}`);
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(testConfig.EVM_RPC_URL)
    });

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(testConfig.EVM_RPC_URL)
    });

    console.log(`✅ E2E Setup Complete`);
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Wallet balance: ${balance} wei`);

    // Step 1: Clean up any existing invitations for test user
    console.log('🧹 Cleaning up any existing invitations...');
    try {
      sh(`gh api repos/${testConfig.TEST_REPO}/invitations --jq '.[] | select(.invitee.login == "${testConfig.TEST_USERNAME}") | .id' | head -1`, { env: envWithToken });
      const invitationId = sh(`gh api repos/${testConfig.TEST_REPO}/invitations --jq '.[] | select(.invitee.login == "${testConfig.TEST_USERNAME}") | .id' | head -1`, { env: envWithToken });
      if (invitationId) {
        sh(`gh api -X DELETE repos/${testConfig.TEST_REPO}/invitations/${invitationId}`, { env: envWithToken });
        console.log(`🗑️ Cancelled existing invitation ID ${invitationId}`);
      }
    } catch (error) {
      console.log('ℹ️  No existing invitations to clean up');
    }

    // Step 2: Execute ADD_ADMIN DAO vote  
    console.log('🗳️  Executing ADD_ADMIN DAO vote on Sepolia...');

    console.log(`📝 Username for admin operations: ${testConfig.TEST_USERNAME}`);

    // Create DAO proposal for grant admin action
    const addAdminCalldata = encodeFunctionData({
      abi: cogniSignalAbi,
      functionName: 'signal',
      args: [
        `https://github.com/${testConfig.TEST_REPO}`,  // repoUrl (full URL)
        'grant',                        // action (new canonical name)
        'collaborator',                 // target (provider-agnostic)
        testConfig.TEST_USERNAME,       // resource (username directly)
        '0x'                           // extra (no longer needed)
      ]
    });

    const adminPlugin = getContract({
      address: testConfig.ARAGON_ADMIN_PLUGIN_CONTRACT as `0x${string}`,
      abi: adminPluginAbi,
      client: { public: publicClient, wallet: walletClient }
    });

    const addAdminTx = await adminPlugin.write.createProposal([
      '0x', // metadata
      [{
        to: testConfig.SIGNAL_CONTRACT as `0x${string}`,
        value: 0n,
        data: addAdminCalldata
      }],
      0n, // startDate (immediate)
      BigInt(Math.floor(Date.now() / 1000) + 300), // endDate (5 min from now)
      '0x' // data
    ]);

    console.log(`📤 ADD_ADMIN proposal transaction: ${addAdminTx}`);

    // Wait for ADD_ADMIN transaction to be processed by webhook
    console.log('⏳ Waiting for ADD_ADMIN webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    // Step 3: Verify user was invited as admin (pending invitation)
    console.log('🔍 Verifying ADD_ADMIN created pending invitation...');
    const invitations = JSON.parse(sh(`gh api repos/${testConfig.TEST_REPO}/invitations`, { env: envWithToken }));
    const testUserInvite = invitations.find((inv: any) => inv.invitee?.login === testConfig.TEST_USERNAME);

    expect(testUserInvite).toBeTruthy();
    expect(testUserInvite.permissions).toBe('admin');
    console.log(`✅ Confirmed pending admin invitation for ${testConfig.TEST_USERNAME}`);
    console.log(`📋 Invitation ID: ${testUserInvite.id}`);

    // Step 4: Execute REMOVE_ADMIN DAO vote
    console.log('🗳️  Executing REMOVE_ADMIN DAO vote on Sepolia...');

    // Create DAO proposal for revoke admin action  
    const removeAdminCalldata = encodeFunctionData({
      abi: cogniSignalAbi,
      functionName: 'signal',
      args: [
        `https://github.com/${testConfig.TEST_REPO}`,  // repoUrl (full URL)
        'revoke',                       // action (new canonical name)
        'collaborator',                 // target (provider-agnostic)
        testConfig.TEST_USERNAME,       // resource (username directly)
        '0x'                           // extra (no longer needed)
      ]
    });

    const removeAdminTx = await adminPlugin.write.createProposal([
      '0x', // metadata
      [{
        to: testConfig.SIGNAL_CONTRACT as `0x${string}`,
        value: 0n,
        data: removeAdminCalldata
      }],
      0n, // startDate (immediate)
      BigInt(Math.floor(Date.now() / 1000) + 300), // endDate (5 min from now)
      '0x' // data
    ]);

    console.log(`📤 REMOVE_ADMIN proposal transaction: ${removeAdminTx}`);

    // Wait for REMOVE_ADMIN transaction to be processed by webhook
    console.log('⏳ Waiting for REMOVE_ADMIN webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    // Step 5: Verify pending invitation was cancelled
    console.log('🔍 Verifying REMOVE_ADMIN cancelled pending invitation...');
    const afterInvitations = JSON.parse(sh(`gh api repos/${testConfig.TEST_REPO}/invitations`, { env: envWithToken }));
    const remainingInvite = afterInvitations.find((inv: any) => inv.invitee?.login === testConfig.TEST_USERNAME);

    expect(remainingInvite).toBeFalsy();
    console.log(`✅ Confirmed pending invitation was cancelled for ${testConfig.TEST_USERNAME}`);

    console.log('🎉 E2E Admin Management test completed successfully!');
  });

});