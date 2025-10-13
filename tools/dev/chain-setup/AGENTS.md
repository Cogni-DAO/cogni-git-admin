# Chain Setup Tools

## Purpose
Validate prerequisites and environment setup for comprehensive E2E testing of DAO validation logic.

## Current Approach: Use Existing Contracts ✅

### Architecture Decision
- ✅ **Use existing Sepolia contracts** (already deployed and working)
- ✅ **Focus on webhook mocking** for local development  
- ✅ **Point to real contracts** for E2E tests
- ❌ ~~Deploy simplified contracts~~ (belongs in Solidity repo)

### Two-DAO Test Strategy

**Current State:**
- **Valid DAO**: `0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5` (in app config `ALLOWED_DAO`)
- **Test DAO**: `0xB0FcB5Ae33DFB4829f663458798E5e3843B21839` (in test config `E2E_DAO_ADDRESS`)
- **Result**: Test correctly fails when DAOs don't match ✅

**Target Test Scenarios:**
1. **Positive Test**: Change app config to match test DAO → webhook processed
2. **Negative Test**: Keep current mismatch → webhook rejected

## Scripts Overview

### ✅ `validate-setup.ts` (Ready for Use)
**Purpose**: Comprehensive E2E prerequisites validation
- Wallet balance and gas estimates
- Contract deployments and ABI compatibility  
- RPC connectivity and GitHub API access
- Webhook endpoint reachability
- **Usage**: `npm run validate-e2e-setup`

### ❌ `deploy-test-contracts.ts` (Deprecated)
**Status**: Created but not recommended for use
**Issues**: 
- Oversimplified mock contracts
- Duplicates functionality that belongs in Solidity repo
- Creates maintenance burden for contract changes
**Alternative**: Use existing contracts with different configuration

## Recommended Approach

### For Two-DAO Testing
1. **Use existing contracts** on Sepolia (no new deployments)
2. **Create webhook fixtures** with different DAO addresses
3. **Test app configuration** changes (ALLOWED_DAO)
4. **Mock Alchemy webhooks** for local development

### For Local Development
- **Webhook replay** using captured fixtures
- **Environment configuration** switching
- **GitHub API mocking** when needed
- **Focus on business logic** not infrastructure

## Environment Focus

**What belongs here:**
- GitHub API interactions ✅
- Webhook parsing and validation ✅  
- DAO allowlist validation ✅
- Action execution logic ✅

**What doesn't belong here:**
- Contract deployment ❌
- Complex governance logic ❌
- Smart contract compilation ❌
- Blockchain infrastructure setup ❌

## Next Steps

1. ✅ Test validation script with current environment
2. 🔄 Create webhook mocking tools for different DAO addresses
3. 🔄 Update E2E tests to use configuration switching
4. 🔄 Document webhook fixture creation process

## Usage

```bash
# Validate current E2E setup
npm run validate-e2e-setup

# Future: Mock webhook testing
npm run mock-webhook-scenarios

# Future: Configuration-based E2E tests  
npm run e2e:config-switching
```