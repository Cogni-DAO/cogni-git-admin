# E2E Testing

**✅ CONNECTIVITY RESOLVED**: E2E tests successfully connect to DigitalOcean deployment with proper SSL/TLS handling. Basic HTTP response validation working.

## Purpose

Validate DAO-controlled GitHub automation across three systems:

- **cogni-gov-contracts** (Foundry)
- **cogni-git-review** (Probot reviewer)  
- **cogni-admin** (DAO → GitHub executor)

## Ownership Model

**This folder**: minimal E2E for cogni-admin using recorded webhook fixtures (fast, hermetic).

**Full cross-repo orchestration** lives in repo `cogni-e2e` (version-matrix, live chain/RPC, ephemeral GitHub repos).

## Current Implementation

### What Exists
- **Single test case**: Replays `test/fixtures/alchemy/CogniSignal/successful-cognisignal-prmerge-trigger-alchemy.json`
- **Target**: PR #121 in `derekg1729/test-repo` with PR_APPROVE action
- **Validation**: HTTP 2xx response validation (accepts range 200-299)
- **Optional GitHub verification**: Attempts PR state check if `TEST_REPO_GITHUB_PAT` provided
- **SSL/TLS Fix**: Header cleaning prevents proxy artifacts from poisoning SNI/ALPN negotiation
- **Authentication**: Environment-aware installation ID selection (dev vs production)

### Current Limitations
**Response validation**:
- ✅ Accepts HTTP 2xx range for flexibility
- ❌ No response body capture for debugging failures
- ❌ No error scenario testing

**GitHub verification**:
- ❌ Optional and non-blocking (test passes regardless of GitHub state)
- ❌ No idempotency testing for repeated webhook delivery
- ❌ No retry logic for eventual consistency

**Test robustness**:
- ❌ Single fixture only (no coverage of edge cases)
- ❌ No signature header replay from original webhook
- ❌ No validation of deployment availability before testing
- ❌ Hard-coded test data (repo, PR number)

## Test Scope

### Fixture-Based Golden Path Tests (Planned)
- **Input**: Captured Alchemy webhook payloads from manual testing
- **Process**: POST to `/api/v1/webhooks/onchain/cogni-signal` endpoint
- **Output**: Verify GitHub PR merge execution and proper response codes
- **Speed**: Fast, no external dependencies beyond test-repo GitHub API

### What We Don't Test Here
- Smart contract deployment/execution (→ cogni-gov-contracts)
- PR review bot integration (→ cogni-git-review) 
- Multi-repository orchestration (→ cogni-e2e)
- Live blockchain interaction (→ cogni-e2e)

## Implementation

```
e2e/
├── e2e-runner.ts        # TypeScript CLI-based E2E test runner (generates test-artifacts/e2e-summary.json)
└── helpers/
    └── fixture-replay.ts # Webhook fixture replay utilities
```

### Test Execution
```bash
# Required environment variable
export E2E_APP_DEPLOYMENT_URL=https://your-deployment.com

# Optional: verify GitHub API effects
export TEST_REPO_GITHUB_PAT=ghp_your_token

# Run E2E test
npm run e2e
```

## Success Criteria
- ✅ Webhook processing returns correct status codes (accepts 2xx range)
- ✅ E2E connectivity to DigitalOcean deployment working
- ⚠️ GitHub API confirms PR merge completion (optional, non-blocking)
- ❌ Error handling validated for common failure modes (not implemented)
- ✅ Tests run in <30 seconds in CI (meets timing requirement)

## Required Enhancements for Production
1. **Capture response bodies**: Enable debugging of failures
2. **Add error scenarios**: Test invalid DAOs, malformed payloads, network failures
3. **Enforce GitHub verification**: Make PR state validation mandatory
4. **Implement idempotency testing**: Verify duplicate webhook handling
5. **Add retry logic**: Handle eventual consistency in GitHub API
6. **Parameterize test data**: Support multiple repos and PR numbers
7. **Replay signature headers**: Include HMAC validation from original webhooks
8. **Remove hardcoded installation IDs**: Replace with database-backed mapping