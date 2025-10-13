/**
 * Manual debugging script for admin plugin createProposal call
 * Helps isolate the revert issue outside of test suite
 */
import { createPublicClient, createWalletClient, http, parseAbi, getContract, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import 'dotenv/config';

// Contract ABIs
const cogniSignalAbi = parseAbi([
  'function signal(string calldata repo, string calldata action, string calldata target, uint256 pr, bytes32 commit, bytes calldata extra) external',
  'event CogniAction(address indexed dao, uint256 indexed chainId, string repo, string action, string target, uint256 pr, bytes32 commit, bytes extra, address indexed executor)'
]);

const adminPluginAbi = parseAbi([
  'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint256 allowFailureMap, uint64 startDate, uint64 endDate) returns (uint256)',
  'function executeProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint256 allowFailureMap) external',
  'event ProposalCreated(uint256 indexed proposalId)',
  'event Executed(uint256 indexed proposalId)',
  'function hasPermission(address where, address who, bytes32 permissionId, bytes calldata data) external view returns (bool)'
]);

const config = {
  SIGNAL_CONTRACT: process.env.SIGNAL_CONTRACT,
  ARAGON_ADMIN_PLUGIN_CONTRACT: process.env.ARAGON_ADMIN_PLUGIN_CONTRACT,
  EVM_RPC_URL: process.env.EVM_RPC_URL,
  PRIVATE_KEY: process.env.E2E_TEST_WALLET_PRIVATE_KEY,
  TEST_REPO: process.env.E2E_TEST_REPO
};

async function debugAdminPlugin() {
  console.log('🔍 Starting admin plugin debug...\n');

  // Setup clients
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(config.EVM_RPC_URL),
  });

  const account = privateKeyToAccount(config.PRIVATE_KEY);
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: http(config.EVM_RPC_URL),
    account,
  });

  const adminPlugin = getContract({
    address: config.ADMIN_PLUGIN_CONTRACT,
    abi: adminPluginAbi,
    client: walletClient,
  });

  console.log(`Wallet: ${account.address}`);
  console.log(`Admin Plugin: ${config.ADMIN_PLUGIN_CONTRACT}`);
  console.log(`CogniSignal: ${config.SIGNAL_CONTRACT}\n`);

  try {
    // 1. Check wallet balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`💰 Wallet balance: ${balance.toString()} wei`);

    if (balance === BigInt(0)) {
      throw new Error('No ETH for gas');
    }

    // 2. Check permissions (if hasPermission exists)
    try {
      const PROPOSER_PERMISSION_ID = '0x0000000000000000000000000000000000000000000000000000000000000000'; // placeholder
      const hasPermission = await adminPlugin.read.hasPermission([
        config.ARAGON_ADMIN_PLUGIN_CONTRACT,
        account.address,
        PROPOSER_PERMISSION_ID,
        '0x'
      ]);
      console.log(`🔑 Has proposer permission: ${hasPermission}`);
    } catch (e) {
      console.log(`ℹ️  Could not check permissions: ${e.message.substring(0, 100)}...`);
    }

    // 3. Prepare the same action as in test
    const testPrNumber = 999; // dummy PR for testing
    const actions = [{
      to: config.SIGNAL_CONTRACT,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: cogniSignalAbi,
        functionName: 'signal',
        args: [
          config.TEST_REPO,
          'PR_APPROVE',
          'pull_request',
          BigInt(testPrNumber),
          ('0x' + '0'.repeat(64)),
          '0x'
        ]
      })
    }];

    console.log(`\n📦 Action prepared:`);
    console.log(`  to: ${actions[0].to}`);
    console.log(`  value: ${actions[0].value}`);
    console.log(`  data length: ${actions[0].data.length} chars`);

    // 4. Try executeProposal (direct execution)
    console.log('\n🧪 Testing executeProposal (direct execution)...');

    // Test 1: executeProposal with allowFailureMap=0
    console.log('\nTest 1: executeProposal with allowFailureMap=0');
    try {
      const txHash = await adminPlugin.write.executeProposal([
        '0x',
        actions,
        BigInt(0)
      ]);
      console.log(`✅ SUCCESS: ${txHash}`);
      return;
    } catch (e) {
      console.log(`❌ FAILED: ${e.message}`);
    }

    // Test 2: executeProposal with allowFailureMap=1
    console.log('\nTest 2: executeProposal with allowFailureMap=1 (allow failures)');
    try {
      const txHash = await adminPlugin.write.executeProposal([
        '0x',
        actions,
        BigInt(1)
      ]);
      console.log(`✅ SUCCESS: ${txHash}`);
      return;
    } catch (e) {
      console.log(`❌ FAILED: ${e.message}`);
    }

    console.log('\n❌ All executeProposal attempts failed');

  } catch (error) {
    console.error(`💥 Debug failed: ${error.message}`);
    console.error(error);
  }
}

debugAdminPlugin().catch(console.error);