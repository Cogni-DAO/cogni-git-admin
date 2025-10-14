# E2E Test Helpers

Utilities and configuration for Playwright-based end-to-end tests.

## Components

### Global Setup (`global-setup.ts`)
Playwright global setup that validates required environment variables before test execution.

**Environment Validation:**
- Base requirements: `E2E_APP_DEPLOYMENT_URL` (always required)
- Fixture test requirements: `E2E_TEST_REPO_GITHUB_PAT` (optional but recommended)
- Blockchain test requirements: `EVM_RPC_URL`, `WALLET_PRIVATE_KEY`, `SIGNAL_CONTRACT`, `ARAGON_ADMIN_PLUGIN_CONTRACT`, `DAO_ADDRESS`, `E2E_TEST_REPO`, `E2E_TEST_REPO_GITHUB_PAT`

**Test Configuration:**
- Exports `validateE2EEnvironment()` for centralized validation
- Exports `getTestConfig()` for standardized configuration access
- Creates `e2e/artifacts` directory for test outputs
- Validates environment based on test type being run

### Test Configuration (`test-config.ts`)
Shared configuration object for all E2E tests that combines environment values with application environment.

**Configuration Sources:**
- Blockchain settings from `environment` object: `SIGNAL_CONTRACT`, `DAO_ADDRESS`, `EVM_RPC_URL`
- E2E-specific values from `process.env`: `ARAGON_ADMIN_PLUGIN_CONTRACT`, `WALLET_PRIVATE_KEY`, `E2E_TEST_REPO`, `E2E_TEST_REPO_GITHUB_PAT`, `E2E_APP_DEPLOYMENT_URL`
- Default values: `TEST_USERNAME` (defaults to 'cogni-test-user'), timeouts for webhook and polling intervals

**Exported Configuration:**
```typescript
testConfig = {
  // Blockchain from environment object
  SIGNAL_CONTRACT, DAO_ADDRESS, EVM_RPC_URL,
  // E2E-specific from process.env
  ARAGON_ADMIN_PLUGIN_CONTRACT, PRIVATE_KEY, TEST_REPO, GITHUB_TOKEN, E2E_APP_DEPLOYMENT_URL,
  // Defaults and timeouts
  TEST_USERNAME, WEBHOOK_TIMEOUT_MS, POLL_INTERVAL_MS
}
```

### Playwright Setup (`playwright-setup.ts`)
Test configuration helpers for Playwright test suite.

### Fixture Replay (`fixture-replay.ts`)
HTTP client for replaying captured webhook fixtures against deployed applications. Reads fixture files created by the webhook capture system and sends them to target endpoints with proper TLS handling and header cleaning.

**Functionality:**
- Reads JSON fixtures containing base64-encoded webhook payloads
- Cleans proxy-injected headers that poison SNI/ALPN negotiation at edge servers
- Preserves essential headers (content-type, auth headers) while removing proxy artifacts
- Configures explicit TLS settings: SNI servername, IPv4 family, TLS 1.2+ minimum
- Sends requests to configurable target URLs for E2E testing
- Returns HTTP status codes for validation
- Implements 10-second timeout for network requests

**Type Definitions:**
```typescript
type Recorded = {
  headers: Record<string, string | string[]>;
  body_raw_base64: string;
  method: string;
  url: string;
};
```

## Usage Pattern
```typescript
import { replayFixture } from './helpers/fixture-replay.js';

const statusCode = await replayFixture(
  'test/fixtures/alchemy/CogniSignal/webhook.json',
  'https://deployment.com/api/v1/webhooks/onchain/cogni-signal'
);
```

## Integration Points
- **Fixture Source**: Reads fixtures from `test/fixtures/` directory created by `tools/dev/webhook-capture/`
- **Playwright Tests**: Used by test suite in `e2e/tests/` for webhook processing validation
- **Target Deployments**: Sends requests to deployed applications specified via `E2E_APP_DEPLOYMENT_URL`
- **Test Configuration**: Playwright config in `playwright.config.ts` defines test projects and timeouts

## Technical Considerations
- Uses native Node.js `http`/`https` modules for maximum compatibility
- Cleans headers to prevent SSL/TLS negotiation failures:
  - Removes: host, x-forwarded-*, disguised-host, x-original-url, rawBody, cookies
  - Preserves: content-type, authorization, x-hub-signature-256, x-alchemy-signature
- Explicit TLS configuration for Cloudflare compatibility:
  - Sets `servername` for proper SNI
  - Forces IPv4 (`family: 4`) to avoid IPv6 path quirks
  - Requires TLS 1.2 minimum (`minVersion: 'TLSv1.2'`)
- Preserves exact byte sequences via base64 encoding/decoding
- Consumes response bodies to prevent connection hanging
- Implements proper error handling and timeout management

## Limitations
- Does not validate response bodies (only status codes)
- Does not support request retry logic
- Cannot replay WebSocket or streaming connections
- Timeout is fixed at 10 seconds (not configurable)

## Implementation Notes
- **SSL/TLS Compatibility**: Cleans proxy headers to ensure proper handshake with edge servers
- **SNI/ALPN Negotiation**: Removes headers that interfere with TLS negotiation
- **IPv4 Enforcement**: Uses IPv4 to avoid routing issues in certain edge configurations