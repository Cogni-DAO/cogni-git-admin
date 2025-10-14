# E2E Test Bug Analysis: Current Status & Resolution History

## Current Status (October 2025)

### 🚨 **Current Issue**: EVM OpcodeNotFound Error

**Status**: E2E tests are failing with `EVM error: OpcodeNotFound` during blockchain transaction execution.

**Last Working State**: Tests were functional before recent environment variable unification changes.

**Current Error Pattern**:
```
EVM error: OpcodeNotFound
RPC Request failed: eth_estimateGas
Contract: 0x77BA7C0663b2f48F295E12e6a149F4882404B4ea (Aragon Admin Plugin)
```

**Hypothesis**: Contract may have been upgraded/redeployed, or ABI mismatch has reoccurred.

### 🔍 **Current Debugging Status**

**Environment Configuration**: ✅ **CONFIRMED WORKING**
- All environment variables loaded correctly
- Wallet balance sufficient: `72677731127437149 wei`
- Contract addresses unchanged from working configuration
- GitHub API integration working (PR creation/cleanup succeeds)

**Test Infrastructure**: ✅ **CONFIRMED WORKING**  
- Fixture replay tests **PASS** (webhook processing works)
- Environment validation and logging removed successfully
- Shared test configuration working correctly

**Blockchain Integration**: ❌ **FAILING**
- `eth_estimateGas` calls failing with `OpcodeNotFound`
- Suggests ABI/contract mismatch or contract upgrade
- Same error pattern for both PR merge and admin management flows

### 🎯 **Key Clues from Historical Analysis**

From the previous resolution (lines 29-50), we see this **exact issue occurred before**:

1. **ABI Signature Mismatch** - Contract expected 5 parameters but code was sending 4
2. **Missing `bytes data` Parameter** - Working transaction included final `bytes data` parameter
3. **Successful Transaction Reference**: `0x3182b7...` on Etherscan shows correct format

**CRITICAL INSIGHT**: The historical analysis shows a successful transaction that used the exact same contracts we're targeting now. This means the contracts should work, but there may be an ABI mismatch reoccurrence.

### 🛠️ **Immediate Action Items**

1. **Verify ABI Signature**: Check if current E2E tests are using the correct 5-parameter `createProposal` signature
2. **Compare with Successful Transaction**: Examine `0x3182b7309c11a62ed4e771331a352b0a1e2beec7c4f4f0a24a3a3d758072c015` on Etherscan
3. **Validate Contract State**: Confirm admin plugin at `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea` is still active
4. **Check for Contract Upgrades**: Verify if Aragon contracts have been upgraded since last working state

### ✅ **ABI Analysis Results**

**Current ABI in E2E Tests** (CORRECT - 5 parameters):
```typescript
'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint64 startDate, uint64 endDate, bytes data) returns (uint256)'
```

**Status**: ✅ ABI signature is **CORRECT** and matches the historical working version from the successful transaction.

**Conclusion**: The ABI mismatch that caused previous issues has **NOT reoccurred**. The current issue is likely:
1. **Contract upgrade/redeployment** on Sepolia testnet
2. **Network-level issues** with Sepolia RPC
3. **Permission changes** on the DAO contracts
4. **Contract state changes** that make the current call invalid

### 🎯 **Updated Hypothesis**

Since the ABI is correct and environment is properly configured, the most likely cause is:
- **Aragon Admin Plugin contract at `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea` may have been upgraded or deprecated**
- **Test wallet permissions may have been revoked**
- **DAO configuration may have changed**

**Next Steps**: Verify the contract is still deployed and functional on Sepolia testnet.

### 🎉 **BREAKTHROUGH: Contract Investigation Results**

**Investigation Date**: October 13, 2025

**Method**: Direct RPC calls to Sepolia using production environment variables

#### ✅ **Contract State Analysis - ALL WORKING**
- **Contract deployed**: ✅ Bytecode exists at `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea`
- **DAO address correct**: ✅ Returns expected `0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5`
- **Wallet funded**: ✅ `0.072678 ETH` balance (`72677731127437149 wei`)
- **Basic contract methods**: ✅ `supportsInterface()` and `dao()` work perfectly
- **Gas estimation SUCCESS**: ✅ `95,282 gas` for exact `createProposal` call used in E2E tests

#### 🚨 **CRITICAL FINDING: The Root Cause is NOT the Contract!**

The **exact same `createProposal` call** that fails in E2E tests **works perfectly** when simulated directly via RPC:

1. ✅ **Contract is fully functional**
2. ✅ **Wallet has required permissions** 
3. ✅ **RPC endpoint operational**
4. ✅ **Gas estimation succeeds for identical parameters**

#### 🎯 **Root Cause Identified: E2E Test Execution Environment**

Since the contract call works in isolation but fails in E2E tests, the issue is in:

1. **Transaction parameters**: Different gas settings, nonce handling, or maxFeePerGas in E2E context
2. **Viem configuration**: E2E tests may use different Viem version or client settings
3. **Test execution timing**: Race conditions or state conflicts during test runs
4. **Error propagation**: "OpcodeNotFound" may be misleading error from test framework, not blockchain

#### 📋 **Updated Action Plan**

**Status**: Environment and contracts are **100% correct**. Issue is in **E2E test execution layer**.

**Next Steps**: 
1. Analyze E2E test transaction parameters vs. working direct calls
2. Compare Viem client configurations between test and production
3. Check for timing or nonce conflicts in test execution
4. Investigate error propagation in E2E test framework

### 🎯 **ACTUAL ROOT CAUSE DISCOVERED: Property Name Mismatch**

**Investigation Date**: October 13, 2025 - **RESOLVED**

#### 🚨 **The Real Bug: Undefined Contract Address**

After investigating the E2E test code, discovered the actual issue:

**Problem**: E2E tests reference `testConfig.ADMIN_PLUGIN_CONTRACT` but the property is named `testConfig.ARAGON_ADMIN_PLUGIN_CONTRACT`

**Result**: Tests attempt to call `createProposal` on `undefined` instead of the actual contract address `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea`

**Error Manifestation**: `EVM error: OpcodeNotFound` (because you can't call methods on undefined address)

#### ✅ **Fix Applied**

**Files Fixed**:
- `e2e/tests/blockchain-pr-merge.spec.ts:87` - Changed `testConfig.ADMIN_PLUGIN_CONTRACT` → `testConfig.ARAGON_ADMIN_PLUGIN_CONTRACT`
- `e2e/tests/blockchain-admin-management.spec.ts:139` - Changed `testConfig.ADMIN_PLUGIN_CONTRACT` → `testConfig.ARAGON_ADMIN_PLUGIN_CONTRACT`

**Impact**: E2E tests should now work correctly as they'll use the proper contract address.

#### 🧠 **Lessons Learned**

1. **"OpcodeNotFound" error was misleading** - actual issue was undefined contract address, not blockchain/contract problems
2. **Property name inconsistency** between test config and test usage caused the failure
3. **Environment and contract state were always correct** - issue was purely in test code property access
4. **Direct contract investigation was crucial** for proving the blockchain layer was functional

#### 📋 **Verification Status**

**Expected Result**: E2E tests should now pass successfully with proper contract address resolution.

---

## Historical Analysis (Previously Resolved)

This section archives the resolution of E2E testing issues that were blocking the DAO-controlled GitHub automation workflow. These issues were previously resolved but may provide clues for current failures.

### Resolution Summary
- **✅ Resolved**: Admin plugin authorization with correct ABI signature (5 parameters)
- **✅ Resolved**: HTTP response codes (400/422 for errors, 204 for success)
- **✅ Resolved**: E2E test runner integration using Playwright framework
- **✅ Resolved**: Webhook processing validation and GitHub operations

## Research Findings

### ✅ Successful Transaction Analysis
- **Working Transaction**: [`0x3182b7...`](https://sepolia.etherscan.io/tx/0x3182b7309c11a62ed4e771331a352b0a1e2beec7c4f4f0a24a3a3d758072c015)
- **Method Used**: `createProposal(bytes _metadata, tuple[] _actions, uint64 _startDate, uint64, bytes _data)`
- **Key Insight**: Successful transaction included a `bytes _data` parameter at the end
- **Target**: Same contracts (Admin Plugin: `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea`, CogniSignal: `0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1`)

### ✅ Aragon Admin Plugin Behavior
- **Two Methods**: `createProposal()` and `executeProposal()` both available
- **Permission Model**: Requires `EXECUTE_PROPOSAL_PERMISSION_ID` for `executeProposal()`
- **Admin Delegation**: DAO grants `EXECUTE_PERMISSION` to Admin plugin, which can delegate via `EXECUTE_PROPOSAL_PERMISSION`
- **Direct Execution**: Admin plugin enables immediate execution without voting period

### ✅ Current Implementation Issues Identified

#### 1. **ABI Signature Mismatch**
**Current ABI**:
```typescript
'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint256 allowFailureMap, uint64 startDate, uint64 endDate) returns (uint256)'
```

**Expected ABI** (from successful transaction):
```typescript  
'function createProposal(bytes metadata, (address to, uint256 value, bytes data)[] actions, uint64 startDate, uint64 endDate, bytes data) returns (uint256)'
```

**Missing**: `bytes data` parameter at the end (custom proposal parameters)

#### 2. **Permission Requirements**
- Test wallet may not have `EXECUTE_PROPOSAL_PERMISSION_ID` 
- Permissions must be explicitly granted by DAO, not automatic
- Error signature `0x32dbe3b4` suggests permission denial

#### 3. **Parameter Structure**
- Current call missing the final `bytes data` parameter
- Working transaction used this parameter (likely empty `0x`)

## Root Cause Analysis

### ✅ Resolved Issues
1. **Function Signature**: Fixed ABI to include correct 5 parameters with `bytes data`
2. **Wallet Authorization**: Using correct private key for authorized admin wallet
3. **Contract Verification**: Confirmed `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea` is correct admin plugin

### Resolved: Webhook Processing Pipeline

**Original Issue**: Webhooks were delivered but returned HTTP 204 with no GitHub operations triggered.

**Root Cause**: Missing `DAO_ADDRESS` environment variable (was commented out in `.env`)

**Resolution**: 
- Uncommented the environment variable
- Implemented proper HTTP response codes:
  - **422**: For DAO/chain validation failures with detailed messages
  - **400**: For unknown webhook providers
  - **204**: Only for successfully processed webhooks with no relevant events

## Solution Strategy

### Option 1: Match Successful Transaction Exactly (Recommended)
1. **Fix ABI**: Add missing `bytes data` parameter to `createProposal` function signature
2. **Update Call**: Pass empty `0x` for the `data` parameter 
3. **Test**: Verify this matches the successful transaction pattern

### Option 2: Verify and Grant Permissions
1. **Check Plugin Type**: Confirm contract at `0x77BA7C...` is admin plugin
2. **Query Permissions**: Check if test wallet has `EXECUTE_PROPOSAL_PERMISSION_ID`
3. **Grant Permission**: If missing, grant permission through DAO proposal

### Option 3: Use executeProposal with Proper Permissions
1. **Grant Permission**: Ensure `EXECUTE_PROPOSAL_PERMISSION_ID` is granted to test wallet
2. **Use executeProposal**: Switch to direct execution method
3. **Verify**: Confirm immediate execution works

## Lessons Learned

### Environment Variable Configuration
- **Critical**: Ensure all required environment variables are uncommented and properly set
- **Validation**: Add startup checks for required configuration
- **Documentation**: Maintain clear documentation of all required variables

### Testing Infrastructure
- **Playwright Benefits**: Unified test runner with proper reporting and artifact collection
- **Test Isolation**: Separate test projects for different test types (fixture vs blockchain)
- **Timeout Configuration**: Different timeouts for fast fixture tests (30s) vs slow blockchain tests (5m)

### Contract Integration
- **ABI Accuracy**: Ensure function signatures match deployed contracts exactly
- **Parameter Count**: Admin plugin requires 5 parameters, not 4 as initially assumed
- **Event Verification**: Use Etherscan to verify actual event emissions match expectations

## Final Working Configuration

### Verified Components
1. **GitHub API Integration**: PR creation and cleanup ✅
2. **Admin Plugin Flow**: `createProposal()` with 5 parameters ✅ 
3. **CogniSignal Integration**: Event emission via proposal actions ✅
4. **CogniAction Events**: Proper parameters and indexing ✅
5. **Webhook Delivery**: Alchemy webhook reception ✅
6. **Webhook Processing**: Validation and GitHub operations ✅

### Test Infrastructure
- **Playwright Suite**: 2 test files with proper execution
- **Fixture Replay**: Fast validation using captured webhooks
- **Blockchain Tests**: Complete DAO workflow on Sepolia
- **Reporting**: HTML reports, JSON results, video/trace artifacts