# E2E Test Suite

## Purpose
Playwright test files for end-to-end validation of cogni-git-admin.

## Structure
- `fixture-replay.spec.ts` - **SKIPPED** - Webhook fixture replay (signing key conflicts across environments)
- `blockchain-pr-merge.spec.ts` - Complete DAO → blockchain → PR merge workflow (5min timeout)
- `blockchain-admin-management.spec.ts` - Complete ADD_ADMIN → REMOVE_ADMIN workflow test (5min timeout)

## Execution
```bash
npm run e2e              # Run all tests
npm run e2e:fixtures      # Fast fixture tests only
npm run e2e:blockchain    # Blockchain integration tests only
```

## Requirements

### Environment Variables
**Base (always required):**
- `E2E_APP_DEPLOYMENT_URL` - Target deployment URL for webhook testing

**Blockchain Tests (required for blockchain-*.spec.ts):**
- `EVM_RPC_URL` - Ethereum RPC endpoint (e.g., Sepolia)
- `WALLET_PRIVATE_KEY` - Private key for transaction signing
- `SIGNAL_CONTRACT` - CogniSignal contract address
- `ARAGON_ADMIN_PLUGIN_CONTRACT` - Aragon Admin Plugin contract address
- `DAO_ADDRESS` - DAO contract address
- `E2E_TEST_REPO` - GitHub repository in format "owner/repo"
- `E2E_TEST_REPO_GITHUB_PAT` - GitHub Personal Access Token with repo permissions

**Optional:**
- `E2E_WEBHOOK_TIMEOUT_MS` - Webhook processing timeout (default: 120000)
- `E2E_POLL_INTERVAL_MS` - Polling interval for status checks (default: 5000)
- `E2E_TEST_ADMIN_USERNAME` - Test user for admin management (default: "cogni-test-user")

### Configuration Management
- Tests import shared configuration from `e2e/helpers/test-config.ts`
- Configuration combines `environment` object values with E2E-specific `process.env` values
- Eliminates duplicate TEST_CONFIG objects across test files
- See `e2e/helpers/global-setup.ts` for centralized validation logic

### Contract Integration
- Tests access Aragon Admin Plugin via `testConfig.ARAGON_ADMIN_PLUGIN_CONTRACT`
- Uses `getContract()` with proper ABI including 5-parameter `createProposal` signature
- Property naming: Use full `ARAGON_ADMIN_PLUGIN_CONTRACT` name, not shortened `ADMIN_PLUGIN_CONTRACT`

### Recent Changes
- **Fixture Replay Test Skipped (Oct 2025)**: `fixture-replay.spec.ts` marked as `test.skip()` due to Alchemy signing key conflicts between local/preview/production environments
- **Property Name Mismatch (Oct 2025)**: Fixed undefined contract address issue where tests referenced `testConfig.ADMIN_PLUGIN_CONTRACT` instead of correct `testConfig.ARAGON_ADMIN_PLUGIN_CONTRACT`
- **Error Resolution**: "EVM error: OpcodeNotFound" was caused by attempting contract calls on undefined address, not blockchain issues