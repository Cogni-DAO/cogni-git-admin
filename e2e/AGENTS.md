# E2E Testing

## Purpose
Validate DAO-controlled GitHub automation: DAO vote → webhook → PR merge.

## Current Implementation Status

### ✅ What Works
1. **Fixture-based test** (`e2e-runner.ts`): Replays captured webhook → HTTP 200
2. **Live blockchain test** (`dao-merge.spec.ts`): Creates PR, connects to Sepolia
3. **Integrated runner**: `npm run e2e` runs both tests sequentially

### 🐛 Known Issue (WIP)
**DAO Wallet Mismatch**: The test wallet is not the actual DAO address configured in the deployed contract.

- **Contract expects**: `0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5` (DAO)  
- **Test wallet is**: `0xB0FcB5Ae33DFB4829f663458798E5e3843B21839` (member)
- **Result**: Contract reverts with `NOT_DAO`

**Next Step**: Implement full DAO proposal → vote → execution flow instead of direct `signal()` call.

## Architecture
```
e2e/
├── dao-merge.spec.ts           # Live blockchain E2E (has auth bug)
├── e2e-runner.ts              # Fixture replay (working)
├── helpers/fixture-replay.ts   # HTTP utilities
└── AGENTS_E2E_MVP.md          # Detailed workflow spec
```

## Test Execution
```bash
# Run both tests
npm run e2e

# Required environment (.env)
E2E_APP_DEPLOYMENT_URL=http://localhost:3000  # or deployed URL
E2E_TEST_REPO_GITHUB_PAT=ghp_...             # GitHub token
```

## Success Progress
- ✅ Fixture test: Working (HTTP 200, webhook replay)
- ✅ Integration: Both tests run together  
- ✅ Blockchain: Connects to Sepolia, creates PRs
- 🚧 **Auth Issue**: Need DAO proposal flow, not direct signal()
- 📋 **TODO**: Implement proposal → vote → execute pattern

## Future Enhancements
- Fix DAO authorization (implement proposal flow)
- Add error scenarios and edge cases
- Playwright Test integration for proper test suite organization, execution, reporting
- Multi-environment support (local/preview/prod)