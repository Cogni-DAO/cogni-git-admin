# E2E Test Helpers

Utilities for replaying captured webhook fixtures in end-to-end tests.

## Components

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
- **E2E Runner**: Used by `e2e/e2e-runner.ts` to test webhook processing
- **Target Deployments**: Sends requests to deployed applications specified via `E2E_APP_DEPLOYMENT_URL`

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

## Recent Fixes
- **SSL/TLS Connection**: Resolved handshake failures with DigitalOcean/Cloudflare by cleaning proxy headers
- **SNI/ALPN Negotiation**: Fixed by removing headers that poison TLS negotiation
- **IPv4 Forcing**: Prevents IPv6 routing issues in certain edge configurations