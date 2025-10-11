# E2E Test Suite

## Purpose
Playwright test files for end-to-end validation of cogni-git-admin.

## Structure
- `fixture-replay.spec.ts` - Fast webhook fixture replay tests (30s timeout)
- `blockchain-integration.spec.ts` - Full DAO → blockchain → webhook → GitHub workflow (5min timeout)

## Execution
```bash
npm run e2e                    # Run all tests
npm run e2e -- --project=fixture-replay        # Fast tests only
npm run e2e -- --project=blockchain-integration # Blockchain tests only
```

## Requirements
See `e2e/helpers/global-setup.ts` for environment variable validation.