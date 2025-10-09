# E2E Testing

**⚠️ MVP SMOKE TEST STATUS**: Basic HTTP response validation only. Production-ready testing requires significant enhancement.

## Purpose

Validate DAO-controlled GitHub automation across three systems:

- **cogni-gov-contracts** (Foundry)
- **cogni-git-review** (Probot reviewer)  
- **cogni-admin** (DAO → GitHub executor)

## Ownership Model

**This folder**: minimal E2E for cogni-admin using recorded webhook fixtures (fast, hermetic).

**Full cross-repo orchestration** lives in repo `cogni-e2e` (version-matrix, live chain/RPC, ephemeral GitHub repos).

## Current Implementation (MVP Smoke Test)

### What Exists
- **Single test case**: Replays `test/fixtures/alchemy/CogniSignal/successful-cognisignal-prmerge-trigger-alchemy.json`
- **Target**: PR #121 in `derekg1729/test-repo` with PR_APPROVE action
- **Validation**: HTTP 200 response only (minimal validation)
- **Optional GitHub verification**: Attempts PR state check if `TEST_REPO_GITHUB_PAT` provided

### Critical Limitations
**Response validation**:
- ❌ Only accepts HTTP 200 (should allow 2xx range for flexibility)
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

## Success Criteria (Not Yet Met)
- ⚠️ Webhook processing returns correct status codes (currently only accepts 200)
- ⚠️ GitHub API confirms PR merge completion (optional, non-blocking)
- ❌ Error handling validated for common failure modes (not implemented)
- ✅ Tests run in <30 seconds in CI (meets timing requirement)

## Required Enhancements for Production
1. **Expand response validation**: Accept all 2xx status codes
2. **Capture response bodies**: Enable debugging of failures
3. **Add error scenarios**: Test invalid DAOs, malformed payloads, network failures
4. **Enforce GitHub verification**: Make PR state validation mandatory
5. **Implement idempotency testing**: Verify duplicate webhook handling
6. **Add retry logic**: Handle eventual consistency in GitHub API
7. **Parameterize test data**: Support multiple repos and PR numbers
8. **Replay signature headers**: Include HMAC validation from original webhooks