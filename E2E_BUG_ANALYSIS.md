# E2E Test Bug Analysis: Webhook Processing Silent Failure

## Problem Statement

The E2E test for DAO-controlled GitHub automation successfully executes blockchain proposals and emits CogniAction events, but the webhook processing pipeline fails silently. The app receives webhooks but returns HTTP 204, indicating no valid events were found for processing.

### Current Status
- **✅ Resolved**: Admin plugin authorization - correct wallet private key and ABI signature
- **✅ Working**: Blockchain proposal execution and event emission
- **🐛 Active Issue**: Webhook processing fails to validate/process valid CogniAction events

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

### 🐛 Current Issue: Webhook Processing Pipeline

**Symptoms**:
- Webhook delivered successfully to app
- App returns HTTP 204 (no content) instead of HTTP 200 (success)
- No GitHub operations triggered despite valid blockchain events

**Likely Causes**:
1. **Provider Detection Failure**: App may not recognize the webhook provider format
2. **Signature Verification Failure**: HMAC validation may be failing silently
3. **Transaction Hash Parsing**: Webhook payload may not contain expected transaction hash format
4. **Chain/DAO Validation**: Environment variables may not match the actual event data
5. **Event Filtering**: Contract address or event signature filtering may be incorrect

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

## Debugging Plan

### Phase 1: Add Comprehensive Logging (📋 TODO)
Add debug logging at each step of webhook processing:
```typescript
// In handleCogniSignal route
logger.debug('Provider detected:', provider);
logger.debug('Signature verification result:', signatureValid);
logger.debug('Parsed transaction hashes:', txHashes);
logger.debug('RPC fetch result:', rpcResult);
logger.debug('Event validation:', { chainId, dao, contract });
```

### Phase 2: Verify Environment Configuration
Check that deployed app has correct environment variables:
- `COGNI_CHAIN_ID`: Should be `11155111` (Sepolia)
- `COGNI_ALLOWED_DAO`: Should match the DAO address from events
- `COGNI_SIGNAL_CONTRACT`: Should match the CogniSignal contract address
- `ALCHEMY_SIGNING_KEY`: Required for webhook signature verification

### Phase 3: Test Webhook Processing Locally
1. Capture actual webhook payload from failed request
2. Replay locally with debug logging enabled
3. Identify exact point of failure in processing pipeline

### Phase 4: Fix Identified Issue
Based on debug findings, implement fix for:
- Provider detection logic
- Signature verification
- Transaction parsing
- Event validation
- GitHub action execution

## Current Testing Results

### Working Components
1. Create test PR via GitHub API ✅
2. Execute admin proposal via `createProposal()` ✅ 
3. Trigger `CogniSignal.signal()` through proposal execution ✅
4. Emit CogniAction event with correct parameters ✅
5. Deliver webhook to application ✅

### Failing Component
6. Process webhook and trigger GitHub operations ✗
   - Returns HTTP 204 indicating no valid events found
   - No GitHub API calls made to merge/approve PR

The core infrastructure is sound - just need to match the exact function signature that the deployed admin plugin expects.