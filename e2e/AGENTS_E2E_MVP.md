# E2E MVP: Complete DAO Vote → PR Merge Flow

> **📋 Prerequisites**: See [tests/INTEGRATION-PREREQS.md](tests/INTEGRATION-PREREQS.md) for complete setup requirements including environment variables, external service dependencies, and critical expectations.

## Status: ✅ Implemented

Complete E2E testing infrastructure for DAO-controlled GitHub operations using Playwright test framework.

### Implementation Components
- ✅ Playwright test suite configuration
- ✅ Fixture replay tests for fast validation
- ✅ Live blockchain integration tests
- ✅ Admin plugin flow with proper ABI
- ✅ CogniAction event emission and webhook delivery
- ✅ HTTP response codes (400/422 for errors, 204 for success)

## Admin Plugin Architecture

### Contract Details
- **Admin Plugin Contract**: `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea`
- **CogniSignal Contract**: `0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1`
- **DAO Address**: `0xB0FcB5Ae33DFB4829f663458798E5e3843B21839`

### Execution Flow
```
Test Wallet (Admin) → Admin.createProposal() → Immediate Execution → CogniSignal.signal() → Webhook → GitHub Operation
```

Admin privileges enable instant proposal creation and execution without voting period.

## Environment Configuration

All environment variables are configured in `.env`:

```bash
# Working Configuration. Giving keys away ONLY because it's purely test network
EVM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
WALLET_PRIVATE_KEY=0x7e1cc7be1c6074585bab220cfec9cc2eec4484341be20a524eca5bc8a90bf58d
SIGNAL_CONTRACT=0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1
ARAGON_ADMIN_PLUGIN_CONTRACT=0x77BA7C0663b2f48F295E12e6a149F4882404B4ea
DAO_ADDRESS=0xB0FcB5Ae33DFB4829f663458798E5e3843B21839
E2E_TEST_REPO=derekg1729/test-repo
E2E_TEST_REPO_GITHUB_PAT=github_pat_...
E2E_APP_DEPLOYMENT_URL=http://localhost:3000
```

## Test Suite Features

### Infrastructure
- ✅ **Playwright Integration**: Unified test runner with proper reporting
- ✅ **GitHub Integration**: PR creation/cleanup via API  
- ✅ **Blockchain Client**: Viem-based Sepolia interaction
- ✅ **Environment Configuration**: Comprehensive .env setup
- ✅ **Admin Plugin**: Correct ABI with 6 parameters including vcs field
- ✅ **Event Emission**: CogniAction events with proper parameters

## Test Execution

```bash
npm run e2e  # Runs Playwright test suite
```

### Test Projects
1. **fixture-replay**: Fast webhook replay tests (30s timeout)
2. **blockchain-integration**: Live Sepolia tests (5m timeout)

### Test Artifacts
- HTML reports in `e2e/artifacts/playwright-report`
- JSON results in `e2e/artifacts/results.json`
- Videos and traces on failure


## Key Implementation Details

### Contract Interaction
```typescript
const adminPluginAbi = parseAbi([
  'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint64 startDate, uint64 endDate, bytes data) returns (uint256)'
]);

const actions = [{
  to: SIGNAL_CONTRACT,
  value: 0n,
  data: encodeFunctionData({
    abi: cogniSignalAbi,
    functionName: 'signal',
    args: [vcs, repoUrl, action, target, resource, extra]
  })
}];
```

### Success Metrics
- ✅ Complete DAO governance workflow implemented
- ✅ PR operations via blockchain vote
- ✅ Automated test execution and cleanup  
- ✅ Comprehensive error handling
- ✅ Proper test isolation and reporting