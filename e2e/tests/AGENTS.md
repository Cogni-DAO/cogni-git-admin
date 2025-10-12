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
See `e2e/helpers/global-setup.ts` for environment variable validation.