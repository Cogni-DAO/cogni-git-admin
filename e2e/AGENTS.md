# Purpose

Validate DAO-controlled GitHub automation across three systems:

- **cogni-gov-contracts** (Foundry)
- **cogni-git-review** (Probot reviewer)  
- **cogni-admin** (DAO → GitHub executor)

## Ownership Model

**This folder**: minimal E2E for cogni-admin using recorded webhook fixtures (fast, hermetic).

**Full cross-repo orchestration** lives in repo `cogni-e2e` (version-matrix, live chain/RPC, ephemeral GitHub repos).

## Test Scope

### Fixture-Based Golden Path Tests
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
├── fixtures/           # Captured webhook payloads
│   ├── pr-approve-success.json
│   └── invalid-dao.json
├── webhook-e2e.test.ts # Fixture replay tests
└── helpers/            # Test utilities
```

## Success Criteria
- Webhook processing returns correct status codes
- GitHub API confirms PR merge completion  
- Error handling validated for common failure modes
- Tests run in <30 seconds in CI