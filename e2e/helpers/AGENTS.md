# E2E Test Helpers

Utilities for replaying captured webhook fixtures in end-to-end tests.

## Components

### Fixture Replay (`fixture-replay.ts`)
HTTP client for replaying captured webhook fixtures against deployed applications. Reads fixture files created by the webhook capture system and sends them to target endpoints with exact header and body preservation.

**Functionality:**
- Reads JSON fixtures containing base64-encoded webhook payloads
- Reconstructs original HTTP requests with preserved headers and bodies
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
  'fixtures/alchemy/CogniSignal/webhook.json',
  'https://deployment.com/api/v1/webhooks/onchain/cogni-signal'
);
```

## Integration Points
- **Fixture Source**: Reads fixtures from `fixtures/` directory created by `tools/dev/webhook-capture/`
- **E2E Runner**: Used by `e2e/e2e-runner.ts` to test webhook processing
- **Target Deployments**: Sends requests to deployed applications specified via `E2E_APP_DEPLOYMENT_URL`

## Technical Considerations
- Uses native Node.js `http` module for maximum compatibility
- Preserves exact byte sequences via base64 encoding/decoding
- Handles both HTTP and HTTPS protocols
- Consumes response bodies to prevent connection hanging
- Implements proper error handling and timeout management

## Limitations
- Does not validate response bodies (only status codes)
- Does not support request retry logic
- Cannot replay WebSocket or streaming connections
- Timeout is fixed at 10 seconds (not configurable)