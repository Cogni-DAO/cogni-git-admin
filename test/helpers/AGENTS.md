# Test Helpers

Utility modules for unit and integration testing.

## Components

### Fixture Replay (Moved)
The `fixture-replay.ts` module has been relocated to `e2e/helpers/` as it is specifically designed for end-to-end testing rather than unit testing.

**New location**: `e2e/helpers/fixture-replay.ts`
- See `e2e/helpers/AGENTS.md` for current documentation
- Used by E2E test runner for webhook replay testing
- Works with captured fixtures from `fixtures/` directory

## Current State
This directory currently contains no active helper modules. Unit test helpers will be added here as needed for:
- Mock data generation
- Test fixture utilities
- Common test assertions
- Test environment setup

## Integration Points
- **Fixture Storage**: Test fixtures stored in `fixtures/` directory
- **E2E Helpers**: End-to-end testing utilities in `e2e/helpers/`
- **Webhook Capture**: Fixture generation via `tools/dev/webhook-capture/`