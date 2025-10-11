# E2E Testing

## Purpose
Validate DAO-controlled GitHub automation: DAO vote → webhook → PR merge.

## Implementation
Playwright-based E2E test suite providing unified test execution and reporting for both fixture replay and live blockchain integration tests.

## Architecture
```
e2e/
├── tests/
│   ├── fixture-replay.spec.ts       # Webhook fixture replay tests
│   └── blockchain-integration.spec.ts # Live blockchain E2E tests
├── helpers/
│   ├── fixture-replay.ts            # HTTP replay utilities
│   ├── global-setup.ts              # Playwright global setup
│   └── playwright-setup.ts          # Test configuration helpers
├── playwright.config.ts              # Playwright test configuration
└── AGENTS_E2E_MVP.md                # Detailed workflow specification
```

## Test Execution
```bash
# Run Playwright E2E suite (both fixture and blockchain tests)
npm run e2e

# Required environment (.env)
E2E_APP_DEPLOYMENT_URL=http://localhost:3000  # Target deployment
E2E_TEST_REPO_GITHUB_PAT=ghp_...             # GitHub token for verification
E2E_SEPOLIA_RPC_URL=https://...              # Sepolia RPC for blockchain tests
E2E_TEST_WALLET_PRIVATE_KEY=0x...            # Test wallet for transactions
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