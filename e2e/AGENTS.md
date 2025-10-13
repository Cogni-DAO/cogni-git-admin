# E2E Testing

## Purpose
Validate DAO-controlled GitHub automation: DAO vote → webhook → PR merge.

## Implementation
Playwright-based E2E test suite providing unified test execution and reporting for both fixture replay and live blockchain integration tests.

## Architecture
```
e2e/
├── tests/
│   ├── fixture-replay.spec.ts            # Webhook fixture replay tests
│   ├── blockchain-integration.spec.ts    # Live blockchain E2E tests
│   └── blockchain-admin-management.spec.ts # Admin management E2E tests
├── helpers/
│   ├── fixture-replay.ts                 # HTTP replay utilities
│   ├── global-setup.ts                   # Playwright global setup
│   └── playwright-setup.ts               # Test configuration helpers
├── playwright.config.ts                   # Playwright test configuration
└── AGENTS_E2E_MVP.md                     # Detailed workflow specification
```

## Test Execution
```bash
# Run Playwright E2E suite (both fixture and blockchain tests)
npm run e2e

# Environment Variables

## Required Variables
```bash
# Application Configuration
E2E_APP_DEPLOYMENT_URL=http://localhost:3000  # Target deployment URL

# GitHub Configuration  
E2E_TEST_REPO=owner/repo                      # Test repository (e.g., cogni-dao/test-repo)
E2E_TEST_REPO_GITHUB_PAT=github_pat_...       # GitHub PAT for API operations
E2E_TEST_ADMIN_USERNAME=cogni-test-user       # Test username for admin management tests (optional, defaults to 'cogni-test-user')

# Blockchain Configuration (for blockchain integration tests)
EVM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY  # Sepolia RPC endpoint
WALLET_PRIVATE_KEY=0x...                                    # Test wallet private key
SIGNAL_CONTRACT=0x...                                       # CogniSignal contract address
ARAGON_ADMIN_PLUGIN_CONTRACT=0x...                                      # Aragon Admin Plugin address
DAO_ADDRESS=0x...                                                # DAO address
```

## Optional Variables
```bash
# Test Timing Configuration (with defaults)
E2E_WEBHOOK_TIMEOUT_MS=120000    # Webhook processing timeout (default: 2 minutes)
E2E_POLL_INTERVAL_MS=5000        # PR status polling interval (default: 5 seconds)

# Legacy fixture test support
TEST_REPO=derekg1729/test-repo   # Default test repo for fixture tests
TIMEOUT_SEC=30                   # Fixture test timeout (default: 30 seconds)
```
```

## Playwright Configuration
- **Test Runner**: Unified Playwright test execution
- **Projects**: Separate configurations for fixture-replay (30s timeout) and blockchain-integration (5m timeout)
- **Reporting**: HTML reports, JSON results, console output
- **Artifacts**: Test videos on failure, traces on retry
- **Parallelization**: Sequential execution to avoid GitHub API rate limits

## Test Coverage
### Fixture Replay Tests
- ✅ Captured Alchemy webhook processing
- ✅ HTTP response validation
- ✅ GitHub PR state verification (when token provided)

### Blockchain Integration Tests  
- ✅ Complete DAO vote workflow via admin plugin
- ✅ PR creation and cleanup
- ✅ CogniAction event emission
- ✅ Webhook delivery verification
- ✅ ADD_ADMIN and REMOVE_ADMIN operations
- ✅ Repository invitation management

## Test Features
- **HTTP Response Validation**: Tests verify correct 200/204/400/422 response codes
- **Unified Test Runner**: Playwright provides consistent test execution and reporting
- **DAO Authorization**: Tests complete DAO vote workflow via admin plugin
- **Comprehensive Coverage**: Both fixture replay and live blockchain scenarios

## Future Enhancements
- Multi-environment configuration profiles
- Additional error scenario coverage
- Performance benchmarking
- Cross-provider webhook testing