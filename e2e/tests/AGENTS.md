# E2E Test Suite

## Purpose
Playwright test files for end-to-end validation of cogni-git-admin.

## Structure
- `fixture-replay.spec.ts` - Fast webhook fixture replay tests (30s timeout)
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

See `e2e/helpers/global-setup.ts` for centralized validation logic.