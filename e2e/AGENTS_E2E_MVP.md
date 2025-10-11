# E2E MVP: Complete DAO Vote → PR Merge Flow

## Current Status: 🚧 WIP - Webhook Processing Issue

### ✅ What's Working
- Test creates PR successfully
- Blockchain connection established (Sepolia)
- Wallet has ETH and can make transactions
- Admin plugin `createProposal()` executes successfully
- CogniAction events emit correctly (verified on Etherscan)
- Webhooks are delivered to app (HTTP 204 responses)

### 🐛 Current Blocker
**Silent Webhook Processing Failure**: Webhooks reach the app but fail during processing.

```
Live Transaction: 0xb52f78c466dd48faa363a2ed90c799af69e841485e14c24f2bf1ed2fd8fe3dfb
Block: 9385561
Event: CogniAction emitted successfully
Webhook: HTTP 204 (no valid events found)
GitHub: No PR merge/approve triggered
```

## Solution: Admin Plugin Flow (✅ Implemented)

**Status**: Admin plugin flow is working correctly. The blockchain side is fully functional.

### Confirmed Working Implementation
- ✅ **Admin Plugin Contract**: `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea`
- ✅ **Correct ABI**: Fixed signature with 5 parameters including `bytes data`
- ✅ **Successful Execution**: Proposals execute immediately, emit CogniAction events
- ✅ **Example Transaction**: [0xb52f78c4...](https://sepolia.etherscan.io/tx/0xb52f78c466dd48faa363a2ed90c799af69e841485e14c24f2bf1ed2fd8fe3dfb)

### Corrected Flow

```
Test Wallet (Admin) → Admin.createProposal() → Immediate Execution → CogniSignal.signal() → Webhook → PR Merge
```

**Key Insight**: No voting needed - admin privileges allow instant proposal creation + execution.

## Environment Configuration

All environment variables are configured in `.env`:

```bash
# Working Configuration. Giving keys away ONLY because it's purely test network
E2E_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
E2E_TEST_WALLET_PRIVATE_KEY=0x7e1cc7be1c6074585bab220cfec9cc2eec4484341be20a524eca5bc8a90bf58d
E2E_COGNISIGNAL_CONTRACT=0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1
E2E_ADMIN_PLUGIN_CONTRACT=0x77BA7C0663b2f48F295E12e6a149F4882404B4ea
E2E_DAO_ADDRESS=0xB0FcB5Ae33DFB4829f663458798E5e3843B21839
E2E_TEST_REPO=derekg1729/test-repo
E2E_TEST_REPO_GITHUB_PAT=github_pat_...
E2E_APP_DEPLOYMENT_URL=http://localhost:3000
```

## Implementation Status

- ✅ **Test Infrastructure**: Complete and working
- ✅ **GitHub Integration**: PR creation/cleanup working  
- ✅ **Blockchain Client**: Connected to Sepolia
- ✅ **Environment**: All variables configured
- ✅ **Authorization**: Admin plugin flow implemented and working
- ✅ **Blockchain Events**: CogniAction events emitting correctly
- 🐛 **Webhook Processing**: Failing silently - returns HTTP 204 (no valid events)
- 📋 **Next**: Debug webhook validation/processing pipeline

## Test Execution

```bash
npm run e2e  # Runs both fixture replay + live blockchain test
```

**Expected Result**: Admin proposal → immediate execution → webhook → PR merge

**Current Result**: Admin proposal ✓ → execution ✓ → webhook received ✓ → processing fails ✗

## Implementation Plan

### 1. Replace Direct Signal Call
**Location**: `e2e/dao-merge.spec.ts:151-158`

**From** (current broken):
```typescript
await contract.write.signal([...args])
```

**To** (working admin flow):
```typescript  
await adminPluginContract.write.createProposal([
  metadata,
  actions, 
  allowFailureMap,
  startDate,
  endDate
])
```

### 2. Required Contract Setup

```typescript
// Admin Plugin ABI 
const adminPluginAbi = parseAbi([
  'function createProposal(bytes metadata, tuple(address to, uint256 value, bytes data)[] actions, uint256 allowFailureMap, uint64 startDate, uint64 endDate) returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId)',
  'event Executed(uint256 indexed proposalId)'
]);

// Admin Plugin Contract  
const adminPlugin = getContract({
  address: '0x77BA7C0663b2f48F295E12e6a149F4882404B4ea',
  abi: adminPluginAbi,
  client: walletClient
});
```

### 3. Construct Action Array
**✅ CogniSignal Contract Now Verified** - Full ABI available from Etherscan!

```typescript
const actions = [{
  to: TEST_CONFIG.COGNISIGNAL_CONTRACT,
  value: 0n,
  data: encodeFunctionData({
    abi: cogniSignalAbi,
    functionName: 'signal',
    args: [
      TEST_CONFIG.TEST_REPO,    // repo (string)
      'PR_APPROVE',             // action (string)
      'pull_request',           // target (string)
      BigInt(prNumber),         // pr (uint256)
      '0x' + '0'.repeat(64),    // commit (bytes32)
      '0x'                      // extra (bytes)
    ]
  })
}];
```

**CogniAction Event**: Will emit with DAO, chainId, repo, action, target, pr, commit, extra, executor parameters.

### 4. Execute Call
```typescript
const txHash = await adminPlugin.write.createProposal([
  '0x',                    // metadata (empty)
  actions,                 // encoded signal() call
  0n,                      // allowFailureMap (no failures allowed)  
  0n,                      // startDate (immediate)
  0n                       // endDate (immediate execution)
]);
```

## Next Steps

1. ✅ **Identify Admin Plugin**: `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea` ✓
2. ✅ **Implement createProposal Flow**: Replaced direct signal() call ✓
3. ✅ **Test Integration**: Proposals create and execute immediately ✓
4. 🐛 **Debug Webhook Processing**: Identify why valid events return HTTP 204
5. 📋 **Add Debug Logging**: Trace webhook validation/processing steps
6. 📋 **Fix Processing Pipeline**: Ensure CogniAction events trigger GitHub operations

## Success Criteria (When Complete)

- ✅ Complete DAO governance workflow
- ✅ PR created and merged via blockchain vote
- ✅ No manual intervention required  
- ✅ Full cleanup of test artifacts
- ✅ Execution time under 30 seconds