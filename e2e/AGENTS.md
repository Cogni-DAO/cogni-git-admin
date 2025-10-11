# E2E Testing

## Purpose
Validate DAO-controlled GitHub automation: DAO vote → webhook → PR merge.

## Current Implementation Status

### ✅ What Works
1. **Fixture-based test** (`e2e-runner.ts`): Replays captured webhook → HTTP 204
2. **Live blockchain test** (`dao-merge.spec.ts`): Creates PR, connects to Sepolia, executes admin proposals
3. **Admin plugin flow**: `createProposal()` with correct ABI signature working
4. **CogniAction events**: Successfully emitted from executed proposals (e.g., tx `0xb52f78c466dd48faa363a2ed90c799af69e841485e14c24f2bf1ed2fd8fe3dfb`)
5. **Webhook delivery**: App receives webhooks and returns HTTP 204

### 🐛 Current Issue
**Silent Webhook Processing Failure**: Webhooks are delivered but fail during processing.

- **Symptom**: HTTP 204 response indicates no valid events found
- **Root cause**: Processing pipeline fails silently after webhook receipt
- **Impact**: GitHub operations (PR merge/approve) not triggered despite valid blockchain events

**Next Step**: Add debug logging to identify where webhook validation/processing fails.

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
- ✅ Fixture test: Working (HTTP 204, webhook replay)
- ✅ Integration: Both tests run together  
- ✅ Blockchain: Connects to Sepolia, creates PRs
- ✅ **Auth Issue Resolved**: Admin plugin `createProposal()` flow implemented
- ✅ **Blockchain Events**: CogniAction events emitting correctly
- 🚧 **Webhook Processing**: Silent failure - events not triggering GitHub actions
- 📋 **TODO**: Debug webhook processing pipeline to identify validation failure

## Future Enhancements
- ✅ ~~Fix DAO authorization~~ (completed - admin plugin flow working)
- Debug and fix webhook processing pipeline
- Add comprehensive logging for webhook validation steps
- Add error scenarios and edge cases
- Playwright Test integration for proper test suite organization, execution, reporting
- Multi-environment support (local/preview/prod)