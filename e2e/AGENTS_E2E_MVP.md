# E2E MVP: Complete DAO Vote → PR Merge Flow

## Current Status: 🚧 WIP - Auth Issue Discovered

### ✅ What's Working
- Test creates PR successfully
- Blockchain connection established (Sepolia)
- Wallet has ETH and can make transactions
- Test framework and integration complete

### 🐛 Current Blocker
**DAO Authorization Issue**: Our test wallet cannot directly call `signal()` on the contract.

```
ContractFunctionExecutionError: NOT_DAO
sender:    0xB0FcB5Ae33DFB4829f663458798E5e3843B21839  (test wallet)
required:  0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5  (DAO contract)
```

## Solution Needed

The test wallet has **DAO member permissions** but needs to go through the full proposal flow:

1. **Create Proposal**: Submit proposal to execute `signal()` 
2. **Vote**: Cast vote on the proposal
3. **Execute**: Once passed, execute the proposal (which calls `signal()`)

This requires implementing DAO governance contract interactions, not just direct CogniSignal calls.

## Desired Complete Flow

```
Test Wallet (Member) → Create DAO Proposal → Vote → Execute → CogniSignal.signal() → Webhook → PR Merge
```

## Environment Configuration

All environment variables are configured in `.env`:

```bash
# Working Configuration
E2E_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
E2E_TEST_WALLET_PRIVATE_KEY=0x7e1cc7be1c6074585bab220cfec9cc2eec4484341be20a524eca5bc8a90bf58d
E2E_COGNISIGNAL_CONTRACT=0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1
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
- 🚧 **Authorization**: Need DAO proposal flow
- 📋 **Next**: Implement governance contract interactions

## Test Execution

```bash
npm run e2e  # Runs both fixture replay + live blockchain test
```

**Expected Result**: DAO proposal → vote → execution → webhook → PR merge

**Current Result**: `NOT_DAO` error at contract level (need to implement governance flow)

## Next Steps

1. Identify the DAO governance contract address
2. Implement proposal creation via governance contract  
3. Implement voting mechanism
4. Implement proposal execution that triggers `CogniSignal.signal()`
5. Complete end-to-end test validation

## Success Criteria (When Complete)

- ✅ Complete DAO governance workflow
- ✅ PR created and merged via blockchain vote
- ✅ No manual intervention required  
- ✅ Full cleanup of test artifacts
- ✅ Execution time under 30 seconds